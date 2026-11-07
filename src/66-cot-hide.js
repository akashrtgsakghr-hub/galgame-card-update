/* 66-cot-hide.js —— 把「只给脚本看的草稿段」从消息里藏掉。
 *
 * AI 有时会在正文后面跟一段写给自己的思考，例如：
 *     Phase. 爱意自然呈现
 *     当前关系阶段：初识观察期（好感度24）……
 *     Phase. 文风cot
 *     <太宰治内置cot> 已严格读取并遵循… </太宰治内置cot>
 * 这些内容玩家不该看到（数值由脚本独占，它自己复述只会和状态卡打架）。
 *
 * 做法：渲染后把从第一个 Phase 小标题（或行首 <…cot> 块）到消息结尾的那一段
 * 收进一个 hidden 容器。原文一个字都不删 —— 换存档、别的正则、AI 上下文
 * 还要读它，只是不显示。
 */

  const MP_COT_HIDDEN_CLASS = 'mp-cot-hidden';
  const MP_COT_FOLD_ATTR = 'data-mp-cot';
  // 行首的草稿小标题：Phase.xxx 或 <角色名cot>
  const MP_COT_HEAD_RE = /(^|\n)[ \t]*(?:Phase[ \t]*[.．:：]|<\/?[A-Za-z0-9_\u4e00-\u9fa5]{1,16}cot>)/;
  // 小标题之后要能看出「这确实是一段草稿」，否则可能只是正文里提到了 Phase
  const MP_COT_TAIL_RE = /(?:Phase[ \t]*[.．:：]|<[^<>\n]{1,16}cot>|关系阶段|阶段分析|写作思路|文风|人设|反恋爱脑|潜台词|叙事要求)/;

  function mpCotHideEnabled() { return getSettings().hideAiCot !== false; }

  /* 在纯文本里找草稿段起点；返回 -1 表示这段消息里没有草稿 */
  function mpFindCotStart(text) {
    const s = String(text == null ? '' : text);
    if (s.length < 8) return -1;
    const m = MP_COT_HEAD_RE.exec(s);
    if (!m) return -1;
    const start = m.index + (m[1] ? m[1].length : 0);
    if (!MP_COT_TAIL_RE.test(s.slice(start))) return -1;
    return start;
  }

  /* 把 <br> / </p> 也当成换行，得到与 textContent 同序的纯文本（标签本身不占字符） */
  function mpElementPlainText(el) {
    if (!el) return '';
    const html = String(el.innerHTML || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li)>/gi, '\n')
      .replace(/<[^>]*>/g, '');
    return html.replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, '&');
  }

  /* 纯文本偏移 → DOM 位置（文本节点按文档顺序累加，<br> 记一个换行） */
  function mpPointFromOffset(root, offset) {
    let acc = 0;
    let hit = null;
    const walk = function(node) {
      if (hit || !node) return;
      const kids = node.childNodes || [];
      for (let i = 0; i < kids.length; i++) {
        if (hit) return;
        const kid = kids[i];
        if (kid.nodeType === 3) {
          const len = kid.nodeValue ? kid.nodeValue.length : 0;
          if (offset <= acc + len) { hit = { node: kid, offset: Math.max(0, offset - acc) }; return; }
          acc += len;
        } else if (kid.nodeType === 1) {
          if (kid.tagName === 'BR') {
            if (offset <= acc) { hit = { node: kid.parentNode, offset: mpIndexOfNode(kid) }; return; }
            acc += 1;
          } else {
            walk(kid);
          }
        }
      }
    };
    walk(root);
    return hit;
  }
  function mpIndexOfNode(node) {
    try {
      const parent = node.parentNode;
      for (let i = 0; i < parent.childNodes.length; i++) if (parent.childNodes[i] === node) return i;
    } catch (e) {}
    return 0;
  }

  function mpHideOneCotBlock(el) {
    try {
      if (!el || el.getAttribute(MP_COT_FOLD_ATTR) === '1') return false;
      const plain = mpElementPlainText(el);
      const start = mpFindCotStart(plain);
      if (start < 0) return false;
      const point = mpPointFromOffset(el, start);
      if (!point) return false;
      let range = null;
      try {
        range = mainDoc.createRange();
        range.setStart(point.node, point.offset);
        range.setEnd(el, el.childNodes.length);
      } catch (e) { return false; }
      const frag = range.extractContents();
      if (!frag || (!frag.textContent && !frag.childNodes.length)) return false;
      const box = mainDoc.createElement('span');
      box.className = MP_COT_HIDDEN_CLASS;
      box.setAttribute('hidden', 'hidden');
      box.setAttribute('aria-hidden', 'true');
      box.style.display = 'none';
      box.appendChild(frag);
      el.appendChild(box);
      el.setAttribute(MP_COT_FOLD_ATTR, '1');
      return true;
    } catch (e) { return false; }
  }

  function mpShowOneCotBlock(el) {
    try {
      const box = el && el.querySelector ? el.querySelector('.' + MP_COT_HIDDEN_CLASS) : null;
      if (!box || !box.parentNode) return false;
      const parent = box.parentNode;
      while (box.firstChild) parent.insertBefore(box.firstChild, box);
      parent.removeChild(box);
      el.removeAttribute(MP_COT_FOLD_ATTR);
      return true;
    } catch (e) { return false; }
  }

  /* 最近 N 条消息里执行；返回实际藏了几条 */
  function mpHideCotBlocksInDom(limit) {
    let n = 0;
    try {
      if (!mpCotHideEnabled()) return 0;
      const nodes = mainDoc.querySelectorAll('.mes .mes_text');
      const max = Number(limit) || 12;
      for (let i = Math.max(0, nodes.length - max); i < nodes.length; i++) {
        if (mpHideOneCotBlock(nodes[i])) n++;
      }
    } catch (e) {}
    return n;
  }

  /* 关掉开关时把已经藏起来的内容原样放回去 */
  function mpShowCotBlocksInDom() {
    let n = 0;
    try {
      const nodes = mainDoc.querySelectorAll('.mes .mes_text[' + MP_COT_FOLD_ATTR + '="1"]');
      for (let i = 0; i < nodes.length; i++) { if (mpShowOneCotBlock(nodes[i])) n++; }
    } catch (e) {}
    return n;
  }

  function mpApplyCotFold() {
    if (mpCotHideEnabled()) mpHideCotBlocksInDom();
    else mpShowCotBlocksInDom();
  }

  /* 纯文本版：沉浸模式不走 DOM，直接从字符串尾巴上把草稿段切掉 */
  function mpTrimCotText(text) {
    const s = String(text == null ? '' : text);
    if (!mpCotHideEnabled()) return s;
    const start = mpFindCotStart(s);
    if (start < 0) return s;
    return s.slice(0, start).replace(/[ \t]+$/, '');
  }
