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

  function callSetPrompt(key, value, position, depth, scan) {
    try { if (typeof mainWin.setExtensionPrompt === 'function') { mainWin.setExtensionPrompt(key, value, position, depth, scan); appendRoundInjectedText(value); return true; } } catch (e) {}
    try { if (typeof window.setExtensionPrompt === 'function') { window.setExtensionPrompt(key, value, position, depth, scan); appendRoundInjectedText(value); return true; } } catch (e) {}
    try { const ctx = getSTCtx(); if (ctx && typeof ctx.setExtensionPrompt === 'function') { ctx.setExtensionPrompt(key, value, position, depth, scan); appendRoundInjectedText(value); return true; } } catch (e) {}
    return false;
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
        if (typeof ctx.saveMetadata === 'function') await ctx.saveMetadata();
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

