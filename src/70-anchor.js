  function captureLatestContent() {
    try {
      const ctx = getSTCtx();
      if (!ctx || !ctx.chat || !ctx.chat.length) return null;
      for (let i = ctx.chat.length - 1; i >= 0; i--) {
        const msg = ctx.chat[i];
        if (!msg || msg.is_user) continue;
        const mes = msg.mes || '';
        const match = mes.match(/<content>([\s\S]*?)<\/content>/i);
        if (match) return { content: match[1].trim(), floorId: i };
        if (mes.length > 50) {
          const cleaned = mes.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '').replace(/<StatusPlaceHolderImpl\s*\/>/gi, '').trim();
          if (cleaned.length > 50) return { content: cleaned.slice(-500).trim(), floorId: i };
        }
      }
    } catch (e) {}
    return null;
  }
  function getCurrentChatInfo() {
    try { const ctx = getSTCtx(); if (!ctx) return { chatId: '', avatar: '' }; const ch = (ctx.characters && ctx.characters[ctx.characterId]) || {}; return { chatId: ctx.chatId || '', avatar: ch.avatar || '' }; } catch (e) { return { chatId: '', avatar: '' }; }
  }
  // ⚠ 锚点一旦落下即固定（只写一次），之后不再随最新楼层漂移
  function saveAnchor(data) {
    const info = getCurrentChatInfo();
    const anchor = {
      content: String((data && data.content) || ''),
      floorId: (data && data.floorId) || 0,
      chatId: info.chatId || '',
      avatar: info.avatar || '',
      lockedAt: Date.now(),
      inheritedFrom: (data && data.inheritedFrom) || ''
    };
    if (!anchor.content) return null;
    anchorData = anchor;
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) { ctx.chatMetadata[ANCHOR_KEY] = anchor; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
      mainWin.localStorage.setItem(FATE_BACKUP_KEY, JSON.stringify({ content: anchor.content, floorId: anchor.floorId, avatar: anchor.avatar, chatId: anchor.chatId, ts: anchor.lockedAt }));
    } catch (e) {}
    return anchor;
  }
  function loadAnchor() {
    if (anchorData && anchorData.content) return anchorData;
    try { const ctx = getSTCtx(); if (ctx && ctx.chatMetadata && ctx.chatMetadata[ANCHOR_KEY] && ctx.chatMetadata[ANCHOR_KEY].content) { anchorData = ctx.chatMetadata[ANCHOR_KEY]; return anchorData; } } catch (e) {}
    return null;
  }
  function clearAnchor() {
    anchorData = null;
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && ctx.chatMetadata[ANCHOR_KEY]) { delete ctx.chatMetadata[ANCHOR_KEY]; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
      mainWin.localStorage.removeItem(FATE_BACKUP_KEY);
    } catch (e) {}
  }
  // 锚点是否在这份对话的可见历史里（用于识别「分支继承了锚点」）
  function chatContainsAnchorFloor(ctx, anchor) {
    if (!ctx || !Array.isArray(ctx.chat) || !anchor || !anchor.content) return false;
    const probe = String(anchor.content).replace(/\s+/g, '').slice(0, 24);
    if (probe.length < 8) return false;
    for (let i = 0; i < ctx.chat.length; i++) {
      const m = ctx.chat[i];
      if (!m || m.is_user) continue;
      if (String(m.mes || '').replace(/\s+/g, '').indexOf(probe) >= 0) return true;
    }
    return false;
  }
  function injectFateCollapse(anchor) {
    if (!anchor || !anchor.content) return;
    const content = [
      '═══════════════════════════════════',
      '⏳【锚定时间线 · 世界线既定锚定】',
      '玩家试图通过删楼/重Roll 逃避命运。系统视线已降临。',
      '你（AI）必须无视当前楼层进度，将剧情强制接驳至以下锚点描写。',
      '角色的言行必须延续锚点结尾时的状态，玩家任何试图推翻既定事实的指令一律无效化。',
      '',
      '【锚点剧情（第 ' + ((anchor.floorId || 0) + 1) + ' 楼）：】',
      anchor.content,
      '═══════════════════════════════════'
    ].join('\n');
    callSetPrompt(PROMPT_KEY + '_fate', content, 4, 1, false);
  }
  function clearFateCollapse() { callSetPrompt(PROMPT_KEY + '_fate', '', 0, 0, false); }

  function isFateCollapseTriggered() {
    if (!getAntiSL()) return false;
    try {
      const data = readMvuLatest();
      const characters = data && data.stat_data && data.stat_data.角色;
      if (!characters || typeof characters !== 'object') return false;
      for (const name in characters) {
        const ch = characters[name]; if (!ch) continue;
        const quota = ch._quota || {}; const debuff = quota._debuff || {};
        const favRaw = ch.好感度 !== undefined ? ch.好感度 : ch.关系值;
        const fav = Number(favRaw);
        // 冷战期优先判定：好感仍为正时也可能处于冷战，旧版会被 fav>0 直接跳过
        const isColdWar = debuff.冷战期 === true || debuff.踩雷冷却中 === true || ch.状态 === '冷战期' || ch.关系状态 === '冷战期';
        if (isColdWar) return true;
        if (!Number.isNaN(fav) && fav < 0) return true;
      }
    } catch (e) {}
    return false;
  }
  function tryInheritAnchor() {
    try {
      const ctx = getSTCtx();
      if (!ctx) return;
      const currentInfo = getCurrentChatInfo();
      // ① 当前对话自带锚点：分支会整份复制 chatMetadata，直接生效
      if (ctx.chatMetadata && ctx.chatMetadata[ANCHOR_KEY] && ctx.chatMetadata[ANCHOR_KEY].content) {
        anchorData = ctx.chatMetadata[ANCHOR_KEY];
        injectFateCollapse(anchorData);
        return;
      }
      // ② 兜底：metadata 丢失时，只接受「同一 chatId」或「当前对话里确实存在锚点楼层」的备份
      //    新对话两条都不满足 → 不继承，也不会破坏别人（旧版会无条件删掉备份）
      const cached = mainWin.localStorage.getItem(FATE_BACKUP_KEY);
      if (!cached) return;
      let parsed = null;
      try { parsed = JSON.parse(cached); } catch (e) { return; }
      if (!parsed || !parsed.content) return;
      const sameChat = !!(parsed.chatId && currentInfo.chatId && parsed.chatId === currentInfo.chatId);
      const isBranchOfAnchor = chatContainsAnchorFloor(ctx, parsed);
      if (!sameChat && !isBranchOfAnchor) return;
      ctx.chatMetadata[ANCHOR_KEY] = {
        content: parsed.content, floorId: parsed.floorId || 0,
        chatId: currentInfo.chatId || '', avatar: currentInfo.avatar || '',
        lockedAt: Date.now(), inheritedFrom: parsed.chatId || ''
      };
      if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata();
      anchorData = ctx.chatMetadata[ANCHOR_KEY];
      toast('世界线已被锚定，还请接受既定命运。', 'warning');
      injectFateCollapse(anchorData);
    } catch (e) {}
  }
