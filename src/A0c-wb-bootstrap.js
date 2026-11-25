/* A0c-wb-bootstrap.js —— 多人卡：按世界书角色建档（不认卡名），支持分批 AI 判定 / 手填 / 掷骰，
   以及「删除档案 + 永久不再建档」的名单。

   为什么单独一片：原来只有两条建档路 —— 自动建档（多人卡只认标签里点过名的人）
   和手动建档（候选里混着卡名）。多人卡的卡名通常是剧本名/合集名，不是角色，
   拿它建档会立出一个根本不存在的「人物」。这里改成从世界书条目里认人：

     ① 只读条目头和关键词，不预先搬整个世界书（内容等真要判的时候才按角色取）
     ② 先让玩家勾选要建哪几个
     ③ 按 4 个一批送 AI 判，避免一次要 20 个人把输出截断
     ④ 每个角色都能单独选「让 AI 判 / 自己填 / 掷骰」
     ⑤ 档案可删；删的时候问一句「以后还建不建」，勾了就进永久排除名单 */

  const MOON_PERM_BLOCK_KEY = 'moon_char_perm_block_v1';
  const WB_BATCH_SIZE = 4;

  /* ── 永久排除名单（按聊天存，换聊天互不影响） ───────────────── */
  function moonBlockedMap() {
    const v = readChatFeatureValue(MOON_PERM_BLOCK_KEY, null);
    return v && typeof v === 'object' && v.names && typeof v.names === 'object' ? v : { version: 1, names: {} };
  }
  function moonBlockedNames() {
    return Object.keys(moonBlockedMap().names || {});
  }
  function isMoonCharBlocked(name) {
    const n = String(name || '').trim();
    if (!n) return false;
    const m = moonBlockedMap().names || {};
    return !!m[n];
  }
  function setMoonCharBlocked(name, on) {
    const n = String(name || '').trim();
    if (!n) return false;
    const m = moonBlockedMap();
    if (!m.names) m.names = {};
    if (on) m.names[n] = Date.now();
    else delete m.names[n];
    return writeChatFeatureValue(MOON_PERM_BLOCK_KEY, m);
  }

  /* ── 世界书：只抽人名，不搬内容 ─────────────────────────────── */
  function wbBooksRaw() {
    const out = [];
    let raw = null;
    try { raw = (mainWin && mainWin.world_info) || (window && window.world_info) || null; } catch (e) { raw = null; }
    if (!raw) { try { const c = getSTCtx(); raw = (c && c.world_info) || null; } catch (e) { raw = null; } }
    if (!raw || typeof raw !== 'object') return out;

    const pushBook = function (b, name) {
      if (!b || typeof b !== 'object') return;
      const src = b.entries || b;
      const list = [];
      if (Array.isArray(src)) {
        src.forEach(function (e) { if (e && typeof e === 'object') list.push(e); });
      } else if (typeof src === 'object') {
        Object.keys(src).forEach(function (k) {
          if (/^(jQuery|__)/.test(k)) return;
          const e = src[k];
          if (e && typeof e === 'object') list.push(e);
        });
      }
      if (list.length) out.push({ name: String(name || b.name || b.comment || '(世界书)'), entries: list });
    };

    if (Array.isArray(raw)) {
      raw.forEach(function (b) { pushBook(b, b && (b.name || b.comment)); });
    } else if (raw.entries) {
      pushBook(raw, raw.name || raw.comment);
    } else {
      Object.keys(raw).forEach(function (k) {
        if (/^(jQuery|__)/.test(k)) return;
        pushBook(raw[k], k);
      });
    }
    return out;
  }

  function wbKeysOf(e) {
    if (!e) return [];
    let k = e.key;
    if (k === undefined && e.keys !== undefined) k = e.keys;
    if (Array.isArray(k)) return k.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    if (typeof k === 'string') return k.split(/[,，、;；\n]/).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return [];
  }

  const WB_NAME_STOP = ['你', '我', '他', '她', '它', 'ta', 'Ta', 'TA', '玩家', '用户', '旁白', '世界', '设定', '规则',
    '系统', '时间', '地点', '背景', '角色', '人物', '主角', '配角', '剧情', '开场', '当前', '状态', '备注', '简介'];

  /* 像人名的才算候选：2~6 字、纯中英文、不以虚词结尾。
     宁可少认几个（玩家可以手输补），也不要把「魔法学院」这种设定词塞进角色表。 */
  function wbNameLike(s) {
    let v = String(s || '').trim();
    if (!v) return '';
    v = v.replace(/^[【\[（(「『《]+/, '').trim();
    /* 「周雨 · 角色」「林晚（学姐）」这种，取分隔符前那一段当名字；
       昵称、后缀留给关键词，不再各自立一个角色。 */
    v = String(v.split(/[\s·・*＊|｜/\\\-—–_（(【\[「『《,，、~～:：]/)[0] || '').trim();
    v = v.replace(/[】\]）)」』》]+$/, '').trim();
    if (v.length < 2 || v.length > 6) return '';
    if (WB_NAME_STOP.indexOf(v) >= 0) return '';
    if (/[0-9０-９]/.test(v)) return '';
    if (!/^[\u4e00-\u9fa5·・A-Za-z]{2,6}$/.test(v)) return '';
    if (/[的了是在和与及或之们个位名号岁年月日时分秒]$/.test(v)) return '';
    return v;
  }

  /* 候选角色：条目 comment / 关键词 / 单关键词条目。
     打分只用来排序，最后仍由玩家勾。 */
  /* 每轮 AI 回复都可能问一次候选，世界书几百条时别每次都全扫一遍。
     键带上排除名单，玩家删/恢复人之后立刻失效。 */
  let wbCandCache = { key: '', at: 0, list: null };

  function wbCharacterCandidates() {
    const cacheKey = moonBlockedNames().join('|') + '#' + wbBooksRaw().length;
    if (wbCandCache.list && wbCandCache.key === cacheKey && Date.now() - wbCandCache.at < 30000) return wbCandCache.list;
    const seen = {};
    const out = [];
    const add = function (name, entry, book, keys, score) {
      if (!name) return;
      if (isMoonCharBlocked(name)) return;
      if (!seen[name]) {
        seen[name] = { name: name, keys: keys.slice(0, 6), books: [book], score: score, entries: [entry] };
        out.push(seen[name]);
      } else {
        seen[name].score = Math.max(seen[name].score, score);
        if (seen[name].books.indexOf(book) < 0) seen[name].books.push(book);
        seen[name].entries.push(entry);
      }
    };
    wbBooksRaw().forEach(function (book) {
      book.entries.forEach(function (e) {
        if (!e || e.disable === true || e.enabled === false) return;
        const comment = String(e.comment || e.title || '').trim();
        const content = String(e.content || e.value || '');
        const keys = wbKeysOf(e);
        const nameKeys = keys.map(wbNameLike).filter(Boolean);
        const isCharEntry = /角色|人物|登场|NPC/i.test(comment);
        const mentioned = function (n) { return !!n && content.indexOf(n) >= 0; };
        const scoreOf = function (base) {
          let sc = base;
          if (isCharEntry) sc += 2;
          if (/[他她]|ta\b/i.test(content.slice(0, 500))) sc += 1;
          if (content.length > 40) sc += 1;
          return sc;
        };
        const cn = wbNameLike(comment);
        if (cn) {
          /* comment 就是人名：只认这一个，昵称（关键词）当别名留着取设定用。
             再加一道「正文里确实提到过他」的闸 —— 否则「魔法学院」「地图」
             这种四字设定条目也会被当成角色。 */
          const pronoun = /[他她]|ta\b/i.test(content.slice(0, 600));
          if (mentioned(cn) || isCharEntry || (nameKeys.indexOf(cn) >= 0 && pronoun)) add(cn, e, book.name, nameKeys, scoreOf(3));
          return;
        }
        if (isCharEntry) {
          nameKeys.forEach(function (k) { if (mentioned(k)) add(k, e, book.name, nameKeys, scoreOf(2)); });
          return;
        }
        /* 没有 comment，或 comment 不是人名：只有单关键词、且正文里真的在写他，才收 */
        if (nameKeys.length === 1 && mentioned(nameKeys[0]) && /[他她]|ta\b/i.test(content)) {
          add(nameKeys[0], e, book.name, nameKeys, scoreOf(1));
        }
      });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    wbCandCache = { key: cacheKey, at: Date.now(), list: out };
    return out;
  }

  /* 真要判的时候才取这个角色的设定正文（按名字/关键词命中，最多 3 条） */
  function wbLoreForName(name, keysWanted) {
    const want = [String(name || '').trim()].concat((keysWanted || []).map(String)).filter(Boolean);
    const parts = [];
    wbBooksRaw().forEach(function (book) {
      book.entries.forEach(function (e) {
        if (!e || e.disable === true || e.enabled === false) return;
        const title = String(e.comment || e.title || '');
        const keys = wbKeysOf(e);
        let hit = false;
        for (let i = 0; i < want.length; i++) {
          const w = want[i];
          if (!w) continue;
          if (title.indexOf(w) >= 0) { hit = true; break; }
          for (let k = 0; k < keys.length; k++) { if (String(keys[k]).indexOf(w) >= 0) { hit = true; break; } }
          if (hit) break;
        }
        if (!hit) return;
        const c = String(e.content || e.value || '').trim();
        if (!c) return;
        parts.push('【' + (title || name) + '】' + c.slice(0, 900));
      });
    });
    return parts.slice(0, 3).join('\n');
  }

  /* ── 掷骰开局：2d6，7 点为中性，两端拉开 ───────────────────── */
  function moonDice(n, sides) { let s = 0; for (let i = 0; i < n; i++) s += 1 + Math.floor(Math.random() * (sides || 6)); return s; }
  function moonDiceOpening() {
    const a = moonDice(1, 6), b = moonDice(1, 6);
    const sum = a + b;                       // 2..12
    const E = Math.round((sum - 7) * 5.5);   // -28..28，7 = 0
    return { dice: [a, b], sum: sum, E: E, text: '🎲 ' + a + '+' + b + '=' + sum };
  }

  /* ── 玩家侧资料：一次读全 ─────────────────────────────────────
     一键建档最容易出错的地方是「只看开场白」：玩家往往把旧情写在人设里
     （ST 的 persona，或者本插件自己的玩家档案），开场白里一个字没有。
     所以这里两处人设都读，合起来按「人设 > 世界书 > 开场白」的优先级用。 */
  function moonPlayerDossier() {
    const ctx = getSTCtx() || {};
    let cardName = '', cardDesc = '', cardPersonality = '', scenario = '', opening = '';
    try {
      const ch = ctx.characters && ctx.characterId != null ? ctx.characters[ctx.characterId] : null;
      if (ch) {
        cardName = String(ch.name || '');
        cardDesc = String(ch.description || '').slice(0, 1500);
        cardPersonality = String(ch.personality || '').slice(0, 600);
        scenario = String(ch.scenario || '').slice(0, 800);
        opening = String(ch.first_mes || '').slice(0, 1500);
      }
    } catch (e) {}
    let stPersona = '', playerName = '';
    try {
      const p = collectCurrentPlayerPersona();
      stPersona = String(p.persona || '');
      playerName = String(p.name || '');
    } catch (e) {}
    let bio = '';
    try {
      const b = (typeof getEnabledUserBio === 'function') ? getEnabledUserBio() : null;
      if (b && b.versions && b.versions.current) bio = String(b.versions.current.content || '');
    } catch (e) {}
    /* 两份人设接在一起给。人设是主要证据，长度给足——截得太短，
       「相处三年」这种关键句就正好被切掉。 */
    const personaMerged = [bio, stPersona].filter(Boolean).join('\n---\n').slice(0, 2600);
    return {
      cardName: cardName, cardDesc: cardDesc, cardPersonality: cardPersonality,
      scenario: scenario, opening: opening, personaMerged: personaMerged, playerName: playerName
    };
  }

  /* ── 第一步：把资料读成一份「谁是谁、跟谁有什么旧情」的摘要 ─────
     一步到位直接要分数，模型会只在开场白里找证据，写完才发现人设里的
     「相处三年」被整段忽略（玩家的实测就是这样：兄妹十几年被判成十几分）。
     所以先摘要、再定档：摘要这一步只做抽取，不碰数值。 */
  async function moonSummarizeRelations(dossier) {
    const d = dossier || moonPlayerDossier();
    if (!d.personaMerged && !d.opening) return '';
    const SYS = '你是剧情资料整理员。只做抽取和归纳，不评价、不给数值、不编造没写的东西。'
      + '【用户人设是最高优先级】：人设里写过的旧情、共处时长、共同经历，一律以人设为准，开场白只作补充。';
    const USER = '【玩家人设】（最高优先级）\n' + (d.personaMerged || '(无)')
      + '\n\n【角色卡】' + (d.cardName || '(无)') + '\n' + (d.cardDesc || '')
      + (d.cardPersonality ? '\n【性格】' + d.cardPersonality : '')
      + (d.scenario ? '\n【场景】' + d.scenario : '')
      + '\n\n【开场白】\n' + (d.opening || '(无)')
      + '\n\n输出 JSON（不要任何别的文字）：\n'
      + '{"玩家":{"身份":"","处境":"","性格":""},'
      + '"旧情":[{"对象":"","关系":"亲属/青梅竹马/恋人/旧识/同僚/仇敌/陌生",'
      + '"共处时长":"照抄原文，如「相处三年」「从小一起长大」「十年没见」；没写就留空",'
      + '"关键经历":"原文写过的共同经历，一句；没写留空","证据":"引用原文那一句"}],'
      + '"关系总则":"这个玩家和这世界里其他人普遍是什么立场，一句"}';
    let raw = '';
    try {
      const r = await callOpeningModel('main', SYS, USER);
      raw = (typeof r === 'string') ? r : String((r && (r.content || r.text)) || '');
    } catch (e) { raw = ''; }
    return String(raw || '').trim().slice(0, 2400);
  }

  /* ── 分批 AI 判定 ───────────────────────────────────────────── */
  async function moonJudgeCharsBatch(items, brief) {
    const d = moonPlayerDossier();
    const opening = d.opening;
    const cardName = d.cardName;
    const persona = d.personaMerged;
    const playerName = d.playerName;

    const blocks = items.map(function (it, i) {
      const lore = wbLoreForName(it.name, it.keys);
      return '◆角色 ' + (i + 1) + '：' + it.name + '\n' + (lore ? '设定：' + lore : '设定：（世界书里没有这个人的条目，只能从开场白判断）');
    }).join('\n\n');

    const SYS = '你是剧情关系裁判。证据优先级：玩家人设 > 世界书设定 > 开场白。'
      + '先判断每个角色和玩家的【既有关系】，再按关系深度给数值。只输出 JSON 数组，不要解释。';
    const USER = '【玩家】' + (playerName || '玩家')
      + '\n【关系摘要】（已从人设/世界书里抽好，直接采信，不要自己另判一遍）\n' + (String(brief || '').trim() || '(无摘要)')
      + '\n\n【玩家人设原文】（摘要漏掉的，回原文补）\n' + (persona || '(无)')
      + '\n\n【角色卡】' + (cardName || '(无)')
      + '\n【开场白】\n' + (opening || '(无开场白)')
      + '\n\n' + blocks
      + '\n\n请逐个判断，输出：\n'
      + '[{"名字":"","关系":"亲属/青梅竹马/恋人/旧识/同僚/仇敌/陌生","共处时长":"照抄证据里写的时长，没写留空","好感度":0,"肉体值":0,"理由":"引用原文那一句"}]\n'
      + '【尺度·按证据定档，不要按「第一次见面」给】\n'
      + '· 人设或设定里写了旧情，按共处深度先定档，再在档内按相处好坏浮动 ±10：\n'
      + '  亲属 / 从小一起长大 / 十年以上 → 65~85\n'
      + '  相处三年以上（含青梅竹马、长期同僚、旧情人）→ 50~70\n'
      + '  相处几个月到三年 → 25~45\n'
      + '  只是认识 / 同事 / 同学 / 邻居 / 上下级 → 10~30\n'
      + '· 上面哪一条都对不上、也没写相处事实 → 0~10（真·陌生人）\n'
      + '· 明确写了仇、背叛、血债、决裂 → -60~-30\n'
      + '· 同一段关系只该有一个结论：先定档，档内浮动，不要这次给 18 下次给 75。\n'
      + '· 理由必须引用原文；引不出原文的，共处时长留空、按陌生人算。\n'
      + '· 肉体值只按已经发生过的身体关系给：写了夫妻/恋人可给 20~50，其余一律 0。';

    let raw = '';
    try {
      const r = await callOpeningModel('main', SYS, USER);
      raw = (typeof r === 'string') ? r : String((r && (r.content || r.text)) || '');
    } catch (e) { raw = ''; }
    let arr = null;
    try { arr = JSON.parse(raw); } catch (e) {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) { try { arr = JSON.parse(m[0]); } catch (e2) { arr = null; } }
    }
    const map = {};
    (Array.isArray(arr) ? arr : []).forEach(function (it) {
      const nm = String(it && (it.名字 || it.name) || '').trim();
      if (!nm) return;
      const rel = String(it.关系 || '').slice(0, 8);
      const past = String(it.共处时长 || it.相处时长 || '').slice(0, 30);
      map[nm] = {
        E: Math.max(-100, Math.min(100, Math.round(Number(it.好感度) || 0))),
        B: Math.max(0, Math.min(100, Math.round(Number(it.肉体值) || 0))),
        rel: rel,
        past: past,
        /* 有共处时长，或者关系本身就不是「陌生」→ 这个人早就在玩家的生活里了，
           不该再走「初见」那一套（初见骰是给真·陌生人用的，
           拿它决定「相处三年的兄妹」的起始值，等于让骰子决定记忆）。 */
        known: !!(past || /亲属|兄|妹|姐|弟|青梅|恋人|夫妻|旧识|旧情|发小|同僚|同学|同事|仇/.test(rel)),
        why: String(it.理由 || '').slice(0, 40)
      };
    });
    return map;
  }

  /* ── 删除档案 ──────────────────────────────────────────────── */
  async function deleteCharProfile(name, permanent) {
    const n = String(name || '').trim();
    if (!n) return false;
    const data = readMvuLatest();
    const sd = data && data.stat_data;
    if (!sd || !sd.角色 || !sd.角色[n]) { toast('没找到这个人的档案', 'info'); return false; }
    delete sd.角色[n];
    const ok = await writeMvuLatest(sd);
    if (!ok) { toast('删除失败：' + (lastWriteError || '写入被拒'), 'warning'); return false; }
    if (permanent) setMoonCharBlocked(n, true);
    try { refreshPanel(); } catch (e) {}
    toast(permanent ? ('已删除「' + n + '」，以后不再建档') : ('已删除「' + n + '」，Ta 再出场还能重新建档'), 'success');
    return true;
  }

  function openCharDeleteDialog(name, after) {
    const n = String(name || '').trim();
    if (!n) return;
    const html = '<div style="font-size:12px;line-height:1.8;color:#e2e8f0;">要删除 <b style="color:#fca5a5;">' + n + '</b> 的档案吗？<br>'
      + '<span style="color:#94a3b8;font-size:11px;">删掉之后，Ta 的数值、心声、阶段都会清空。之后 Ta 再出场，会重新建一份。</span></div>'
      + '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:9px 10px;border:1px solid rgba(248,113,113,.35);border-radius:8px;background:rgba(127,29,29,.18);font-size:11.5px;color:#fecaca;cursor:pointer;">'
      + '<input type="checkbox" id="moon-del-perm" style="width:15px;height:15px;"> 永久不再建档（下次出场也不建）</label>'
      + '<div style="margin-top:8px;font-size:10px;color:#64748b;">勾了这项会记进这个聊天的排除名单，可以在「世界书建档」里点「恢复」撤销。</div>';
    showModalDialogCancelable('🗑 删除角色档案', html,
      async function () {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const perm = !!(mask && mask.querySelector('#moon-del-perm') && mask.querySelector('#moon-del-perm').checked);
        try { if (mask) mask.remove(); } catch (e) {}
        const ok = await deleteCharProfile(n, perm);
        if (ok && typeof after === 'function') { try { after(); } catch (e) {} }
      },
      null,
      { confirmText: '删除', cancelText: '取消' });
  }

  /* ── 主弹窗：世界书角色建档 ─────────────────────────────────── */
  function openWorldbookBootstrapDialog(panel) {
    const cands = wbCharacterCandidates();
    const data = readMvuLatest();
    const chars = (data && data.stat_data && data.stat_data.角色) || {};
    const existing = Object.keys(chars).filter(function (n) { return chars[n] && !isCharSkeleton(chars[n]); });
    const blocked = moonBlockedNames();
    const isMulti = getCardMode() === 'multi';
    const cardName = String(getCurrentCardName() || '');

    let head = '<div style="font-size:11.5px;color:#94a3b8;line-height:1.75;margin-bottom:10px;">'
      + (isMulti
        ? '这张是<b style="color:#fbbf24;">多人卡</b>：不按卡名建档，改成从世界书里认人。<br>'
        : '卡组模式是单人卡，这里也能用：从世界书里挑人。卡名 <b>' + cardName + '</b> 默认不进候选。<br>')
      + '只读了条目标题和关键词，没有把整个世界书搬进来；真要判谁的时候才取谁的设定。</div>';

    if (blocked.length) {
      head += '<div style="font-size:10.5px;color:#f87171;margin-bottom:8px;">已永久排除（' + blocked.length + '）：' + blocked.join('、')
        + ' <button type="button" id="moon-wb-unblock" style="margin-left:6px;padding:2px 8px;border-radius:6px;border:1px solid rgba(148,163,184,.4);background:transparent;color:#94a3b8;font-size:10px;cursor:pointer;">恢复全部</button></div>';
    }

    let rows = '';
    if (!cands.length) {
      rows = '<div style="padding:14px;color:#fbbf24;font-size:11.5px;line-height:1.8;">世界书里没认出像人名的条目。<br>'
        + '可以在下面手动加：一行一个名字。</div>';
    } else {
      cands.forEach(function (c, i) {
        const has = existing.indexOf(c.name) >= 0;
        rows += '<div class="moon-wb-row" data-idx="' + i + '" style="display:flex;align-items:center;gap:7px;padding:7px 6px;border-bottom:1px solid rgba(148,163,184,.14);">'
          + '<input type="checkbox" class="moon-wb-check" data-idx="' + i + '"' + (has ? ' disabled' : '') + ' style="width:15px;height:15px;flex:none;">'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:12.5px;color:' + (has ? '#64748b' : '#e2e8f0') + ';">' + c.name
          + (has ? '<span style="font-size:9.5px;color:#22c55e;margin-left:6px;">已在档</span>' : '') + '</div>'
          + '<div style="font-size:9.5px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
          + (c.keys.length ? '关键词：' + c.keys.join(' / ') : '无关键词') + ' · ' + c.books.join('、') + '</div></div>'
          + '<select class="moon-wb-mode" data-idx="' + i + '"' + (has ? ' disabled' : '') + ' style="padding:4px 6px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
          + '<option value="ai">让 AI 判</option><option value="manual">自己填</option><option value="dice">掷骰</option></select>'
          + '<input class="moon-wb-e" data-idx="' + i + '" type="number" step="1" value="0" title="好感度" style="width:52px;padding:4px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
          + '<input class="moon-wb-b" data-idx="' + i + '" type="number" step="1" value="0" title="肉体值" style="width:46px;padding:4px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
          + '</div>';
      });
    }

    let existingHtml = '';
    if (existing.length) {
      existingHtml = '<div style="margin-top:10px;font-size:10.5px;color:#94a3b8;">已有档案（要删点右边）：</div>'
        + '<div style="max-height:22vh;overflow:auto;border:1px solid rgba(148,163,184,.16);border-radius:8px;margin-top:4px;">'
        + existing.map(function (n, i) {
          return '<div class="moon-wb-exist" data-name="' + n.replace(/"/g, '&quot;') + '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid rgba(148,163,184,.12);">'
            + '<span style="flex:1;font-size:11.5px;color:#cbd5e1;">' + n + '</span>'
            + '<button type="button" class="moon-wb-del" data-name="' + n.replace(/"/g, '&quot;') + '" style="padding:3px 9px;border-radius:6px;border:1px solid rgba(248,113,113,.45);background:rgba(127,29,29,.25);color:#fca5a5;font-size:10.5px;cursor:pointer;">删除</button></div>';
        }).join('') + '</div>';
    }

    const html = head
      + '<div id="moon-wb-rows" style="max-height:40vh;overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:9px;">' + rows + '</div>'
      + '<div style="margin-top:8px;"><div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">手动加人（一行一个，会一起建档）</div>'
      + '<textarea id="moon-wb-extra" rows="2" placeholder="例如：林晚&#10;周雨" style="width:100%;box-sizing:border-box;padding:7px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11.5px;resize:vertical;"></textarea></div>'
      + existingHtml
      + '<div style="margin-top:8px;font-size:10px;color:#64748b;">· 没勾的不写入　· 让 AI 判会按 4 个一批送，不会一次塞 20 个人　· 掷骰 = 2d6，7 点为中性</div>';

    showModalDialogCancelable('📖 世界书建档', html,
      async function () {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const picked = [];
        mask.querySelectorAll('.moon-wb-row').forEach(function (row) {
          const idx = Number(row.getAttribute('data-idx'));
          const ck = row.querySelector('.moon-wb-check'); if (!ck || !ck.checked || ck.disabled) return;
          const c = cands[idx]; if (!c) return;
          const modeEl = row.querySelector('.moon-wb-mode');
          picked.push({
            name: c.name, keys: c.keys,
            mode: modeEl ? modeEl.value : 'ai',
            E: Number(row.querySelector('.moon-wb-e').value) || 0,
            B: Number(row.querySelector('.moon-wb-b').value) || 0
          });
        });
        const extraEl = mask.querySelector('#moon-wb-extra');
        if (extraEl) {
          String(extraEl.value || '').split(/[\n,，、]/).forEach(function (s) {
            const n = String(s || '').trim();
            if (!n) return;
            if (isMoonCharBlocked(n)) return;
            if (picked.some(function (p) { return p.name === n; })) return;
            picked.push({ name: n, keys: [n], mode: 'ai', E: 0, B: 0 });
          });
        }
        if (!picked.length) { toast('没勾选任何人', 'info'); return; }
        try { mask.remove(); } catch (e) {}

        /* 掷骰的当场算，结果念给玩家听 */
        const diceNotes = [];
        picked.forEach(function (p) {
          if (p.mode !== 'dice') return;
          const d = moonDiceOpening();
          p.E = d.E; p.B = 0; p._dice = d;
          diceNotes.push(p.name + ' ' + d.text + ' → ' + d.E);
        });
        if (diceNotes.length) toast(diceNotes.join('　'), 'info');

        /* AI 分批 */
        const aiList = picked.filter(function (p) { return p.mode === 'ai'; });
        const map = {};
        /* 先做一次关系摘要：把玩家人设里的旧情、共处时长抽出来，
          再拿去逐个人定档。少了这一步，模型只会盯着开场白，
           人设里写的「相处三年」相当于没写。 */
        let brief = '';
        if (aiList.length) {
          try { showLoadingDialog('先读一遍你的人设和旧情…'); } catch (e) {}
          try { brief = await moonSummarizeRelations(); } catch (e) { brief = ''; }
          try { closeLoadingDialog(); } catch (e) {}
        }
        for (let i = 0; i < aiList.length; i += WB_BATCH_SIZE) {
          const batch = aiList.slice(i, i + WB_BATCH_SIZE);
          try { showLoadingDialog('正在建档 ' + (i + 1) + '–' + Math.min(i + batch.length, aiList.length) + ' / ' + aiList.length + '…'); } catch (e) {}
          let part = {};
          try { part = await moonJudgeCharsBatch(batch, brief); } catch (e) { part = {}; }
          Object.keys(part).forEach(function (k) { map[k] = part[k]; });
          /* AI 漏掉的人：这一批里没返回的，退成 0 值 + 提示，不留空 */
          batch.forEach(function (b) { if (!map[b.name]) map[b.name] = { E: b.E, B: b.B, rel: '', why: 'AI 没返回，按手填值写入' }; });
        }
        try { closeLoadingDialog(); } catch (e) {}

        const list = picked.map(function (p) {
          const ai = p.mode === 'ai' ? map[p.name] : null;
          const E = ai ? ai.E : p.E;
          const B = ai ? ai.B : p.B;
          const st = getRStageFromE(E);
          return {
            名字: p.name, 重要度: '主要', 好感度: E, 肉体值: B, 阶段值: st.r, 嫉妒值: 0,
            已有关系: !!(ai && ai.known),
            共处时长: (ai && ai.past) || '',
            关系: (ai && ai.rel) || '',
            情绪: '😐', 心声: (ai && ai.why) ? String(ai.why).slice(0, 30) : (p._dice ? '开局掷骰 ' + p._dice.sum : '……')
          };
        });
        try { await applyMultiCardAdaptiveOpening(list); } catch (e) { toast('写入失败：' + (e && e.message || e), 'warning'); }
        try { if (panel && typeof refreshPanel === 'function') refreshPanel(); } catch (e) {}
      },
      function () { toast('已取消', 'info'); },
      {
        confirmText: '确认建档', cancelText: '取消',
        onOpen: function (mask) {
          mask.querySelectorAll('.moon-wb-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const n = btn.getAttribute('data-name');
              /* 必须先关掉这一层：弹窗是排队渲染的，不关掉的话删除确认框永远轮不到，
                 表现就是「点了删除没反应」。 */
              try { mask.remove(); } catch (e) {}
              setTimeout(function () {
                openCharDeleteDialog(n, function () {
                  setTimeout(function () { try { openWorldbookBootstrapDialog(panel); } catch (e) {} }, 220);
                });
              }, 160);
            });
          });
          const ub = mask.querySelector('#moon-wb-unblock');
          if (ub) ub.addEventListener('click', function () {
            const m = moonBlockedMap();
            m.names = {};
            writeChatFeatureValue(MOON_PERM_BLOCK_KEY, m);
            toast('已清空排除名单', 'success');
            try { mask.remove(); } catch (e) {}
            setTimeout(function () { try { openWorldbookBootstrapDialog(panel); } catch (e) {} }, 200);
          });
        }
      });
  }

  /* 只列现有档案、专门删除的入口（面板「人物档案」里挂一个） */
  function openCharListDeleteDialog(panel) {
    const data = readMvuLatest();
    const chars = (data && data.stat_data && data.stat_data.角色) || {};
    const names = Object.keys(chars).filter(function (n) { return chars[n] && !isCharSkeleton(chars[n]); });
    let html;
    if (!names.length) {
      html = '<div style="font-size:12px;color:#94a3b8;line-height:1.8;">当前聊天还没有角色档案。</div>';
    } else {
      html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">点「删除」会先问一次：只是删这份档案，还是以后都不再建档。</div>'
        + '<div style="max-height:50vh;overflow:auto;border:1px solid rgba(148,163,184,.16);border-radius:8px;">'
        + names.map(function (n) {
          const E = Number(chars[n].好感度) || 0;
          return '<div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid rgba(148,163,184,.12);">'
            + '<span style="flex:1;font-size:12px;color:#e2e8f0;">' + n + '<span style="font-size:10px;color:#64748b;margin-left:6px;">好感 ' + E + '</span></span>'
            + '<button type="button" class="moon-wb-del" data-name="' + n.replace(/"/g, '&quot;') + '" style="padding:3px 10px;border-radius:6px;border:1px solid rgba(248,113,113,.45);background:rgba(127,29,29,.25);color:#fca5a5;font-size:10.5px;cursor:pointer;">删除</button></div>';
        }).join('') + '</div>';
    }
    showModalDialog('🗂 删除角色档案', html, null, {
      confirmText: '关闭',
      onOpen: function (mask) {
        mask.querySelectorAll('.moon-wb-del').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const n = btn.getAttribute('data-name');
            try { mask.remove(); } catch (e) {}
            setTimeout(function () {
              openCharDeleteDialog(n, function () {
                setTimeout(function () { try { openCharListDeleteDialog(panel); } catch (e) {} }, 220);
              });
            }, 160);
          });
        });
      }
    });
  }

  function exposeWbBootstrap() {
    try { if (typeof mainWin !== 'undefined' && mainWin) {
      mainWin.openWorldbookBootstrapDialog = openWorldbookBootstrapDialog;
      mainWin.openCharListDeleteDialog = openCharListDeleteDialog;
      mainWin.openCharDeleteDialog = openCharDeleteDialog;
    } } catch (e) {}
    try { if (typeof window !== 'undefined') {
      window.openWorldbookBootstrapDialog = openWorldbookBootstrapDialog;
      window.openCharListDeleteDialog = openCharListDeleteDialog;
      window.openCharDeleteDialog = openCharDeleteDialog;
    } } catch (e) {}
  }
  try { exposeWbBootstrap(); } catch (e) {}
