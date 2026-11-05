/* 86a-gal-parse.js —— 消息解析与分页。
   目标：一条 AI 回复 → 若干「块」→ 若干「页」。全程只读原消息，绝不改写聊天记录。 */

  /* ── ① 清洗：把机械化内容从展示文本里摘出去 ──────────────
     注意：只影响展示，ctx.chat 里的 mes 一个字符都不动。 */
  function galCleanMessage(mes) {
    let text = String(mes == null ? '' : mes);
    text = text.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '');
    text = text.replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '');
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    // 结局 / 尾声标签交给原有幕布渲染，沉浸界面里不重复显示
    text = text.replace(/[\[\u3014\u3010\uff3b]\s*GalgameEnding\s*[|｜:：][\s\S]*?[\]\u3015\u3011\uff3d]/gi, '');
    text = text.replace(/[\[\u3014\u3010\uff3b]\s*GalgameEpilogue\s*[|｜:：][\s\S]*?[\]\u3015\u3011\uff3d]/gi, '');
    // Sylveina 数值标签 + 紧随其后的占位 s
    text = text.replace(/[\[\u3014\u3010\uff3b]\s*Sylveina\s*[|｜][^\]\u3015\u3011\uff3d\r\n]*[\]\u3015\u3011\uff3d]?/gi, '');
    text = text.replace(/(^|\n)[ \t]*s[ \t]*(?=\n|$)/g, '$1');
    // 后台变量行（世界.时间=… / 角色.XX.情绪=…）
    text = text.replace(/(^|\n)[ \t]*(?:世界|角色)\.[^\r\n=]+=[^\r\n]*/g, '$1');
    // 图片标签单独由图片适配层处理，这里先摘掉避免重复显示
    text = text.replace(/<img\b[^>]*>/gi, '');
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  }

  function galRuleEnabledList(rules) {
    const list = Array.isArray(rules) && rules.length ? rules : galDefaultRules();
    return list.filter(function(r) { return r && r.enabled !== false; });
  }

  /* ── ② 指令解析：背景 / 立绘 / CG ─────────────────────── */
  function galExtractDirectives(text, rules) {
    const out = { bg: '', sprite: [], cg: '', scene: '', rest: text };
    galRuleEnabledList(rules).forEach(function(rule) {
      if (rule.mode !== 'xml') return;
      if (['bg', 'sprite', 'cg', 'scene'].indexOf(rule.type) < 0) return;
      const tag = String(rule.pattern || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!tag) return;
      const re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'gi');
      out.rest = out.rest.replace(re, function(full, body) {
        const val = String(body || '').trim();
        if (!val) return '';
        if (rule.type === 'bg') out.bg = val;
        else if (rule.type === 'cg') out.cg = val;
        else if (rule.type === 'scene') out.scene = val;
        else if (rule.type === 'sprite') {
          // 支持 "名字|表情" 或 "名字:表情"
          val.split(/[,，;；\n]/).forEach(function(part) {
            const one = part.trim();
            if (one) out.sprite.push(one.replace(/[:：]/, '|'));
          });
        }
        return '';
      });
    });
    return out;
  }

  /* ── ③ 选项解析：只认明确标记，绝不把普通列表当选项 ────── */
  function galSplitChoiceLines(blockText) {
    const lines = String(blockText || '').split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      let line = String(lines[i] || '').trim();
      if (!line) continue;
      // 去掉常见序号前缀：1. / 1、/ 1) / A. / A、/ ① / - / * / ·
      line = line.replace(/^[\(\（]?\s*(?:\d{1,2}|[A-Za-z]|[①②③④⑤⑥⑦⑧⑨⑩])\s*[\.\、\)\）:：]\s*/, '');
      line = line.replace(/^[\-\*·•]\s+/, '');
      line = line.replace(/^[>\s]+/, '');
      // 去掉行内强调符号
      line = line.replace(/^\*+|\*+$/g, '').trim();
      if (!line) continue;
      // 明显的正文长句不是选项
      if (line.length > 80) continue;
      out.push(line);
      if (out.length >= 12) break;
    }
    return out;
  }

  function galExtractChoices(text, rules) {
    const choices = [];
    let rest = text;
    const list = galRuleEnabledList(rules);
    for (let i = 0; i < list.length; i++) {
      const rule = list[i];
      if (rule.type !== 'choice') continue;
      if (rule.mode === 'xml') {
        const tag = String(rule.pattern || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!tag) continue;
        const re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'gi');
        let m;
        while ((m = re.exec(rest)) !== null) {
          galSplitChoiceLines(m[1]).forEach(function(line) { choices.push(line); });
        }
        rest = rest.replace(re, '');
      } else if (rule.mode === 'regex') {
        if (!rule.pattern) continue;
        let re = null;
        try { re = new RegExp(rule.pattern, 'gi'); } catch (e) { continue; }
        let m;
        while ((m = re.exec(rest)) !== null) {
          galSplitChoiceLines(m[1] || m[0]).forEach(function(line) { choices.push(line); });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
        rest = rest.replace(re, '');
      } else if (rule.mode === 'block') {
        const marker = String(rule.pattern || '').trim();
        if (!marker) continue;
        const esc = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 标记行：可带括号，如 【选项】 / [选项] / 选项：
        const re = new RegExp('(^|\\n)[ \\t]*(?:[\\[【〔（(]\\s*' + esc + '\\s*[\\]】〕）)]|' + esc + '\\s*[：:])[ \\t]*\\r?\\n?', 'i');
        const m = rest.match(re);
        if (m) {
          const start = m.index + m[0].length;
          let tail = rest.slice(start);
          // 选项段到空行为止
          const endMatch = tail.match(/\n[ \t]*\n/);
          let blockText = tail;
          let after = '';
          if (endMatch) {
            blockText = tail.slice(0, endMatch.index);
            after = tail.slice(endMatch.index);
          }
          galSplitChoiceLines(blockText).forEach(function(line) { choices.push(line); });
          rest = rest.slice(0, m.index) + (after ? '\n' + after.replace(/^\n+/, '') : '');
        }
      }
    }
    // 去重保序
    const seen = {};
    const unique = [];
    choices.forEach(function(c) {
      const k = c.replace(/\s+/g, '');
      if (seen[k]) return;
      seen[k] = 1;
      unique.push(c);
    });
    return { choices: unique, rest: rest };
  }

  /* ── ④ 正文分块 ───────────────────────────────────────── */
  function galClassifyParagraph(para, rules) {
    const text = String(para || '').trim();
    if (!text) return [];
    const list = galRuleEnabledList(rules);
    // prefix：行首标记优先
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.mode !== 'prefix' || !r.pattern) continue;
      if (text.indexOf(r.pattern) === 0) {
        const body = text.slice(String(r.pattern).length).trim();
        if (!body) continue;
        return [{ type: r.type, text: body }];
      }
    }
    // wrap：整段被括号包住
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.mode !== 'wrap' || !r.pattern || String(r.pattern).length !== 2) continue;
      const open = r.pattern.charAt(0), close = r.pattern.charAt(1);
      if (text.length > 2 && text.charAt(0) === open && text.charAt(text.length - 1) === close) {
        return [{ type: r.type, text: text.slice(1, -1).trim() }];
      }
      // 允许多段括号并列
      const allWrapped = text.split(/(?<=[\)）])\s*/).every(function(seg) {
        const s = seg.trim();
        return s.length > 2 && s.charAt(0) === open && s.charAt(s.length - 1) === close;
      }) && text.indexOf(open) === 0;
      if (allWrapped) {
        const parts = [];
        const re = new RegExp('\\' + open + '([^' + '\\' + close + ']*)' + '\\' + close, 'g');
        let m;
        while ((m = re.exec(text)) !== null) { if (m[1].trim()) parts.push(m[1].trim()); }
        if (parts.length) return parts.map(function(t) { return { type: r.type, text: t }; });
      }
    }
    // speaker：名字 + 冒号
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.mode !== 'speaker') continue;
      const m = text.match(/^([^\s：:，。！？!?、\[\]【】「」“”"']{1,14})\s*[：:]\s*([\s\S]+)$/);
      if (m) {
        const name = m[1].trim();
        const body = m[2].trim();
        if (name && body && body.length > 1) return [{ type: 'name', text: name }, { type: 'text', text: body }];
      }
    }
    return [{ type: 'text', text: text }];
  }

  function galParseMessage(mes, rules) {
    const raw = String(mes == null ? '' : mes);
    const cleaned = galCleanMessage(raw);
    const result = {
      ok: false, raw: raw, cleaned: cleaned, blocks: [], choices: [],
      directives: { bg: '', sprite: [], cg: '', scene: '' },
      usedFallback: false, reason: ''
    };
    if (!cleaned) {
      result.usedFallback = true;
      result.reason = '消息清洗后为空';
      return result;
    }
    const effectiveRules = Array.isArray(rules) && rules.length ? rules : galGetTagmap();

    // 指令
    const dir = galExtractDirectives(cleaned, effectiveRules);
    result.directives = { bg: dir.bg, sprite: dir.sprite, cg: dir.cg, scene: dir.scene };
    let body = dir.rest;

    // 选项
    const choiceOut = galExtractChoices(body, effectiveRules);
    result.choices = choiceOut.choices;
    body = choiceOut.rest;

    // XML / 自定义正则 两类「包裹型」标签
    const xmlRules = galRuleEnabledList(effectiveRules).filter(function(r) {
      return (r.mode === 'xml' || r.mode === 'regex') &&
        ['text', 'narration', 'thought', 'name', 'scene'].indexOf(r.type) >= 0;
    });
    let usedXml = false;
    if (xmlRules.length) {
      // 一次性把所有已知标签替换成占位，再按顺序切块
      let work = body;
      const slots = [];
      xmlRules.forEach(function(r) {
        let re = null;
        if (r.mode === 'regex') {
          if (!r.pattern) return;
          try { re = new RegExp(r.pattern, 'gi'); } catch (e) { return; }
        } else {
          const tag = String(r.pattern || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (!tag) return;
          re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'gi');
        }
        work = work.replace(re, function(full, inner) {
          const id = '__GAL_' + slots.length + '__';
          slots.push({ type: r.type, text: String(inner == null ? full : inner).trim() });
          return '\n' + id + '\n';
        });
        if (slots.length) usedXml = true;
      });
      if (usedXml) {
        const blocks = [];
        work.split(/\n+/).forEach(function(line) {
          const t = line.trim();
          if (!t) return;
          const m = t.match(/^__GAL_(\d+)__$/);
          if (m) {
            const slot = slots[Number(m[1])];
            if (slot && slot.text) blocks.push(slot);
            return;
          }
          // 标签外的零散文本仍然当正文
          blocks.push({ type: 'text', text: t });
        });
        if (blocks.length) {
          result.blocks = galMergeAdjacentBlocks(blocks);
          result.ok = true;
          return result;
        }
      }
    }

    // 普通文本：按空行分段
    const paragraphs = String(body).split(/\n[ \t]*\n/).map(function(p) { return p.trim(); }).filter(Boolean);
    const blocks = [];
    paragraphs.forEach(function(para) {
      galClassifyParagraph(para, effectiveRules).forEach(function(b) { blocks.push(b); });
    });
    if (!blocks.length) {
      // 兜底：整条原始回复当纯文本，绝不丢消息
      result.blocks = [{ type: 'text', text: cleaned }];
      result.usedFallback = true;
      result.reason = '没有识别到任何标签，按纯文本展示';
      result.ok = true;
      return result;
    }
    result.blocks = galMergeAdjacentBlocks(blocks);
    result.ok = true;
    // 只有「一个结构化块都没认出来」才算回退直出；<bg>/<choices> 认出来的不算
    const structured = result.blocks.some(function(b) { return b.type !== 'text'; }) ||
      !!dir.bg || (dir.sprite && dir.sprite.length > 0) || !!dir.cg || result.choices.length > 0;
    result.usedFallback = !structured;
    if (!structured) result.reason = '没有识别到结构化标签，按原始文本展示';
    else if (!result.choices.length) {
      // 没有选项不是错误，只是这轮没有分支
      result.reason = '本轮没有选项标记';
    }
    return result;
  }

  function galMergeAdjacentBlocks(blocks) {
    const out = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || !b.text) continue;
      const prev = out[out.length - 1];
      if (prev && prev.type === b.type && b.type !== 'name' && prev.type !== 'name') {
        prev.text = prev.text + '\n' + b.text;
      } else {
        out.push({ type: b.type, text: b.text });
      }
    }
    return out;
  }

  /* ── ⑤ 分页：按实际屏幕容量，不按固定字数 ──────────────── */
  function galViewport() {
    let w = 800, h = 900;
    try {
      w = mainWin.innerWidth || (mainDoc.documentElement && mainDoc.documentElement.clientWidth) || 800;
      h = mainWin.innerHeight || (mainDoc.documentElement && mainDoc.documentElement.clientHeight) || 900;
    } catch (e) {}
    return { w: Math.max(280, w), h: Math.max(320, h) };
  }

  function galLayoutMetrics() {
    const vp = galViewport();
    const s = galGetSettings();
    const font = Number(s.fontSize) || 17;
    const lineH = font * (Number(s.lineHeight) || 1.75);
    // 对话框宽度跟随 CSS：桌面 920 上限，手机留 24px 边距
    const boxW = Math.min(920, vp.w - 24) - 56;
    // 文本框高度：手机竖屏约 30vh，桌面约 26vh，夹在 96~280 之间
    const isPhone = vp.w < 640;
    const boxH = galClamp(vp.h * (isPhone ? 0.30 : 0.26), 96, 280);
    const cjkW = font;
    const latinW = font * 0.56;
    return {
      vw: vp.w, vh: vp.h, font: font, lineHeight: lineH,
      boxW: Math.max(160, boxW), boxH: boxH,
      maxLines: Math.max(2, Math.floor(boxH / lineH)),
      cjkW: cjkW, latinW: latinW, isPhone: isPhone
    };
  }

  function galTextWidth(text, m) {
    let w = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code > 0x2e80) w += m.cjkW;
      else if (code === 32) w += m.latinW * 0.5;
      else w += m.latinW;
    }
    return w;
  }

  function galEstimateLines(text, m) {
    const segs = String(text || '').split('\n');
    let lines = 0;
    segs.forEach(function(seg) {
      if (!seg) { lines += 1; return; }
      lines += Math.max(1, Math.ceil(galTextWidth(seg, m) / m.boxW));
    });
    return lines;
  }

  function galSplitSentences(text) {
    const s = String(text || '');
    const out = [];
    const re = /[^。！？!?…；;\n]*[。！？!?…；;]|[^。！？!?…；;\n]+$/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      const t = m[0].trim();
      if (t) out.push(t);
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return out.length ? out : [s];
  }

  function galHardSplit(text, m, maxLines) {
    // 最后手段：按字符硬切，保证单块能塞进一页
    const out = [];
    let buf = '';
    for (let i = 0; i < text.length; i++) {
      buf += text.charAt(i);
      if (galEstimateLines(buf, m) >= maxLines) { out.push(buf); buf = ''; }
    }
    if (buf.trim()) out.push(buf);
    return out;
  }

  /* 把块切成「适合一页」的块序列 */
  function galExplodeBlock(block, m) {
    const lines = galEstimateLines(block.text, m);
    if (lines <= m.maxLines) return [block];
    const out = [];
    const sentences = galSplitSentences(block.text);
    let buf = '';
    sentences.forEach(function(sen) {
      const candidate = buf ? (buf + sen) : sen;
      if (galEstimateLines(candidate, m) > m.maxLines && buf) {
        out.push({ type: block.type, text: buf });
        buf = sen;
      } else {
        buf = candidate;
      }
    });
    if (buf) out.push({ type: block.type, text: buf });
    // 还有超长句 → 硬切
    const final = [];
    out.forEach(function(b) {
      if (galEstimateLines(b.text, m) > m.maxLines) {
        galHardSplit(b.text, m, m.maxLines).forEach(function(part) { final.push({ type: b.type, text: part }); });
      } else final.push(b);
    });
    return final.length ? final : [block];
  }

  function galPaginate(blocks, metrics) {
    const m = metrics || galLayoutMetrics();
    const flat = [];
    (Array.isArray(blocks) ? blocks : []).forEach(function(b) {
      if (!b || !b.text) return;
      galExplodeBlock(b, m).forEach(function(x) { flat.push(x); });
    });
    const pages = [];
    let cur = [];
    let used = 0;
    const gap = 0.4; // 段间距折算成 0.4 行
    flat.forEach(function(b) {
      const h = galEstimateLines(b.text, m) + gap;
      if (cur.length && used + h > m.maxLines) {
        pages.push(cur);
        cur = [];
        used = 0;
      }
      cur.push(b);
      used += h;
    });
    if (cur.length) pages.push(cur);
    if (!pages.length) pages.push([{ type: 'text', text: '' }]);
    return { pages: pages, total: pages.length, metrics: m };
  }

  /* 一页的纯文本（给历史回看 / 已读跳过用） */
  function galPagePlainText(page) {
    return (Array.isArray(page) ? page : []).map(function(b) { return String(b.text || '').trim(); }).filter(Boolean).join('\n');
  }
