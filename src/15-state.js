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

  /* 分维度标签：[肉体|角色名|L|+|2] / [嫉妒|角色名|M|-|3]

     为什么另开一族，而不是在 [Sylveina|…] 里塞第六个字段：
     老标签的正则被玩家卡里的「正则美化」和好几种旧版脚本共用，加字段 = 所有
     下游解析器都要跟着改，改慢了就是「标签出现在正文里」的线上事故。
     新开一族最坏情况是「AI 没写」——和现在一样不动，不会更坏。

     语义（和状态卡上的叫法对齐）：
       肉体 = 身体层面的推进（拥抱、亲吻、肌肤接触、同寝）
       嫉妒 = 醋意 / 占有欲（第三方介入、玩家与他人亲近、被冷落）
     两个都不是「感情深浅」，所以涨落规则和 E 完全不同（见 computeCharDelta）。 */
  const DIM_TAG_GLOBAL_RE = /[\[\u3014\u3010\uff3b(（]\s*(肉体|嫉妒)\s*[|｜]([^\]\u3015\u3011\uff3d)）\r\n]+)[\]\u3015\u3011\uff3d)）]?/gi;
  const DIM_TAG_NAME_MAP = { '肉体': 'P', '嫉妒': 'I' };

