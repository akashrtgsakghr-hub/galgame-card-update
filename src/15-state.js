  /* ───────────────────────────────────────────────────────── */
  function getBioLibrary() {
    try { const raw = mainWin.localStorage.getItem(BIO_LIBRARY_KEY); if (raw) { const parsed = JSON.parse(raw); if (parsed && parsed.bios && typeof parsed.bios === 'object') return parsed; } } catch (e) {}
    return { version: 1, bios: {} };
  }
  function saveBioLibrary(lib) { try { mainWin.localStorage.setItem(BIO_LIBRARY_KEY, JSON.stringify(lib)); return true; } catch (e) { return false; } }
  function genBioId() { return 'bio_' + Date.now() + '_' + Math.floor(Math.random() * 100000); }
  function getCurrentCardName() {
    try { const ctx = getSTCtx(); if (ctx && ctx.characters && ctx.characterId != null) { const ch = ctx.characters[ctx.characterId]; if (ch && ch.name) return String(ch.name).trim(); } } catch (e) {}
    return '(未知卡牌)';
  }
  function getCurrentActiveCharNames() {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色) return [];
    return Object.keys(data.stat_data.角色).filter(function(k) { return k !== '示例角色' && k !== 'You' && k !== '你' && !isCharSkeleton(data.stat_data.角色[k]); });
  }
  function collectCharInfoForBio(charName) {
    let info = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) info = ['卡牌名称：' + (ch.name || '(未命名)'), '简介：' + (ch.description || '(无)').slice(0, 1200), '性格：' + (ch.personality || '(无)').slice(0, 800), '场景：' + (ch.scenario || '(无)').slice(0, 500), '创作者注释：' + (ch.creator_notes || '(无)').slice(0, 500)].join('\n');
      }
    } catch (e) {}
    return info || '(无法读取角色卡信息)';
  }
  /* 本轮实际注入过的全部文本。词条库靠它判断「这一轮 AI 手里到底有没有那个标签」，
     比扫聊天记录准得多——脚本刚注入的 [初见|…] 在对话里还不存在。 */
  let _roundInjectedText = '';
  function resetRoundInjectedText() { _roundInjectedText = ''; }
  function getRoundInjectedText() { return _roundInjectedText; }
  function setRoundInjectedText(t) { _roundInjectedText = String(t || ''); }
  function appendRoundInjectedText(value) {
    if (!value || typeof value !== 'string') return;
    const room = 20000 - _roundInjectedText.length;
    if (room <= 2) return;
    _roundInjectedText += '\n' + (value.length > room ? value.slice(0, room) : value);
  }

  /* ── 扩展提示词注入 ──────────────────────────────────────────────────────
     酒馆的 extension_prompt_types 一共只有三个值：BEFORE_PROMPT(2) / IN_PROMPT(0) / IN_CHAT(1)。
     我们历史上一直传 4，想表达「放进聊天记录里、贴着对话」；但酒馆拼 prompt 时对未知键
     只放行 0 和 2（preparePromptsForChatCompletion 里 `if (![0,2].includes(position)) continue;`），
     别的值会被整条丢弃、还不报错。结果就是：世界书那几条照常生效（成就、状态格式的骨架），
     而脚本注入的规则一条都没进过 prompt——心声格式、数值说明自然就没人执行。
     现在统一落 IN_PROMPT(0)：老版本认、新版本认、不会被静默丢掉。 */
  const PROMPT_POS_BEFORE = 2;
  const PROMPT_POS_IN_PROMPT = 0;
  let _injectReport = { at: 0, items: [], total: 0 };

  function normalizePromptPos(position) {
    /* 只有显式要「放到主提示词前面」的才保留 2，其余（含历史遗留的 4 / 1）一律落 IN_PROMPT。 */
    return Number(position) === PROMPT_POS_BEFORE ? PROMPT_POS_BEFORE : PROMPT_POS_IN_PROMPT;
  }

  function noteInjection(key, value, pos, depth) {
    try {
      const len = String(value || '').length;
      const items = _injectReport.items.filter(function(it) { return it.key !== key; });
      if (len > 0) items.push({ key: String(key), chars: len, pos: pos, depth: depth });
      _injectReport = { at: Date.now(), items: items, total: items.reduce(function(a, b) { return a + b.chars; }, 0) };
    } catch (e) {}
  }

  function getInjectReport() {
    if (_injectReport.items.length) return _injectReport;
    /* 刷新页面后内存里是空的，但玩家想看「上一轮到底注没注」——
       所以每轮结束时落一份到本地，重开面板还能读到。 */
    try {
      const st = getStorage();
      const raw = st && st.getItem('moon_inject_report_v1_' + getChatStateKey());
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && saved.items && saved.items.length) return saved;
    } catch (e) {}
    return _injectReport;
  }

  function saveInjectReport() {
    try {
      const st = getStorage();
      if (!st || !_injectReport.items.length) return false;
      st.setItem('moon_inject_report_v1_' + getChatStateKey(), JSON.stringify(_injectReport));
      return true;
    } catch (e) { return false; }
  }

  function callSetPrompt(key, value, position, depth, scan) {
    const pos = normalizePromptPos(position);
    const dep = Math.max(0, Number(depth) || 0);
    try { if (typeof mainWin.setExtensionPrompt === 'function') { mainWin.setExtensionPrompt(key, value, pos, dep, scan, 0); noteInjection(key, value, pos, dep); appendRoundInjectedText(value); return true; } } catch (e) {}
    try { if (typeof window.setExtensionPrompt === 'function') { window.setExtensionPrompt(key, value, pos, dep, scan, 0); noteInjection(key, value, pos, dep); appendRoundInjectedText(value); return true; } } catch (e) {}
    try { const ctx = getSTCtx(); if (ctx && typeof ctx.setExtensionPrompt === 'function') { ctx.setExtensionPrompt(key, value, pos, dep, scan, 0); noteInjection(key, value, pos, dep); appendRoundInjectedText(value); return true; } } catch (e) {}
    return false;
  }

  /* 把上一轮注入过的键全部清空：后台静默生成（要 JSON 的那些）之前调用，
     免得七节剧情规则去干扰它。正常轮会在 generation_started 重新注满。 */
  function clearMoonPrompts() {
    try {
      const keys = (_injectReport.items || []).map(function(it) { return it.key; });
      keys.forEach(function(k) { try { callSetPrompt(k, '', 0, 0, false); } catch (e) {} });
      _injectReport = { at: Date.now(), items: [], total: 0 };
      return keys.length;
    } catch (e) { return 0; }
  }

  /* 最后一条：等价于预设里「depth 0 的系统条目」。
     extension_prompts 只往系统提示区放（IN_PROMPT），想让它贴着最后一句玩家发言，
     只能在 prompt 已经拼好、请求还没发出去的那一刻，往 chat 数组尾部追加一条 system 消息。
     酒馆自己的 depth 0 注入也是这么落位的，所以不会被当成异常请求。 */
  function injectTailIntoFinalChat(chatData, note) {
    try {
      const text = String(note || '').trim();
      if (!text) return false;
      const chat = chatData && chatData.chat;
      if (!Array.isArray(chat) || !chat.length) return false;
      /* 只在「最后一条是玩家发言」时贴：后台静默生成 / 续写 / 旁白这类请求的
         末尾不是 user，贴上去只会干扰它要的格式。 */
      const tail = chat[chat.length - 1];
      if (!tail || String(tail.role || '') !== 'user') return false;
      const probe = text.slice(0, 24);
      for (let i = chat.length - 1; i >= 0 && i >= chat.length - 3; i--) {
        if (String((chat[i] && chat[i].content) || '').indexOf(probe) >= 0) return false;
      }
      chat.push({ role: 'system', content: text, injected: true });
      return true;
    } catch (e) { return false; }
  }

  function getChatStateKey() {
    try {
      const ctx = getSTCtx();
      if (!ctx) return LOCAL_STATE_KEY;
      const ch = (ctx.characters && ctx.characters[ctx.characterId]) || {};
      const cid = (ctx.chatId || '') + '|' + (ch.avatar || '');
      if (!cid || cid === '|') return LOCAL_STATE_KEY;
      return LOCAL_STATE_KEY + '_' + cid;
    } catch(e) { return LOCAL_STATE_KEY; }
  }

  function loadLocalState() {
    const key = getChatStateKey();
    const store = getStorage();
    let data = null;
    try {
      const raw = store ? store.getItem(key) : null;
      if (raw) data = JSON.parse(raw);
    } catch (e) {}
    if (!data) {
      try {
        const rawFallback = localStorage.getItem(key);
        if (rawFallback) data = JSON.parse(rawFallback);
      } catch (e) {}
    }
    if (!data) {
      try {
        const ctx = getSTCtx();
        if (ctx && ctx.chatMetadata && ctx.chatMetadata[key]) {
          data = ctx.chatMetadata[key];
          if (store) store.setItem(key, JSON.stringify(data));
        }
      } catch (e) {}
    }
    if (data && data.stat_data) cachedVars = data;
    return data || { stat_data: { 世界: { 时间: '2000年01月01日 · 星期六 · 00:00', _内部流逝天数: 0, _上次推进时间: '2000年01月01日 · 星期六 · 00:00' }, 角色: {} } };
  }

  /* ── 写盘合并 ────────────────────────────────────────────────────────
     一轮结算里可能连续写好几次（变量快照、攻略模式两本账、锚点、卡带存档…），
     每次都给酒馆一次 saveMetadata，等于把整份 metadata 全量落盘好几遍。
     桌面上感觉不到，手机上就是持续的 I/O 抖动。
     做法：同一轮微任务里只保留最后一次 —— 数据都写进去了，落盘次数压到 1 次。
     语义没变：调用方 await 的仍然是「已经存好」这件事。 */
  let _metaSaveQueued = null;
  function queueMetadataSave(ctx) {
    if (_metaSaveQueued) return _metaSaveQueued;
    const target = ctx;
    _metaSaveQueued = Promise.resolve().then(function() {
      _metaSaveQueued = null;
      try {
        if (target && typeof target.saveMetadata === 'function') return target.saveMetadata();
      } catch (e) {}
      return null;
    });
    return _metaSaveQueued;
  }

  async function saveLocalState(newStatData, opts) {
    opts = opts || {};
    const showLoading = opts.showLoading === true;
    if (showLoading) {
      showLoadingDialog('当前阶段值发生重大变故，变动正在更新数据中，请勿退出当前页面导致更新失败！');
    }
    try {
      const key = getChatStateKey();
      const payload = { stat_data: newStatData };
      cachedVars = payload;
      const store = getStorage();
      if (store) store.setItem(key, JSON.stringify(payload));
      try { if (localStorage !== store) localStorage.setItem(key, JSON.stringify(payload)); } catch (e) {}
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) {
        ctx.chatMetadata[key] = payload;
        if (typeof ctx.saveMetadata === 'function') await queueMetadataSave(ctx);
      }
      if (showLoading) await new Promise(function(r) { setTimeout(r, 350); });
      lastWriteError = '';
      return true;
    } catch (e) {
      lastWriteError = String(e && e.message || e);
      toast('写入失败，本地存储可能已满', 'warning');
      return false;
    } finally {
      if (showLoading) closeLoadingDialog();
    }
  }

  function readMvuLatest() { return loadLocalState(); }
  async function writeMvuLatest(newStatData, opts) { return await saveLocalState(newStatData, opts); }

  const SYLVEINA_TAG_GLOBAL_RE = /[\[\u3014\u3010\uff3b(（]\s*Sylveina\s*[|｜]([^\]\u3015\u3011\uff3d)）\r\n]+)[\]\u3015\u3011\uff3d)）]?/gi;

