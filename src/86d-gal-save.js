/* 86d-gal-save.js —— 存档 / 读档 / 阅读进度。
   读档不是"把旧消息显示一遍"，而是要把聊天推进到那个剧情节点；
   酒馆没有公开的跳转 API，所以这里先探测能力，探测不到就明说，不伪造成功。 */

  function galGetSaves() {
    const raw = readChatFeatureValue(GAL_SAVES_KEY, []);
    return Array.isArray(raw) ? raw.filter(function(s) { return s && s.id; }) : [];
  }
  function galSaveSaves(list) {
    const next = (Array.isArray(list) ? list : []).slice(0, 20);
    writeChatFeatureValue(GAL_SAVES_KEY, next);
    return next;
  }
  function galNewSaveId() { return 'galsave_' + Date.now() + '_' + Math.floor(Math.random() * 100000); }

  function galFingerprint(text) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    let hash = 2166136261;
    for (let i = 0; i < s.length; i++) { hash ^= s.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(36) + ':' + s.length;
  }
  function galCurrentChatInfo() {
    try {
      const ctx = getSTCtx();
      if (!ctx) return { chatId: '', avatar: '' };
      const ch = (ctx.characters && ctx.characters[ctx.characterId]) || {};
      return { chatId: String(ctx.chatId || ''), avatar: String(ch.avatar || '') };
    } catch (e) { return { chatId: '', avatar: '' }; }
  }

  function galCreateSave(name) {
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) { return { ok: false, reason: '读不到酒馆上下文' }; }
    if (!ctx || !Array.isArray(ctx.chat) || !ctx.chat.length) return { ok: false, reason: '当前聊天还没有消息' };
    const st = galGetState();
    const floor = Number.isFinite(Number(st.floor)) && Number(st.floor) >= 0 ? Number(st.floor) : (ctx.chat.length - 1);
    const msg = ctx.chat[floor];
    if (!msg) return { ok: false, reason: '目标楼层不存在' };
    const info = galCurrentChatInfo();
    const mem = galGetMemory();
    const stat = readMvuLatest();
    const item = {
      id: galNewSaveId(),
      name: String(name || '').trim().slice(0, 40) || ('第 ' + (floor + 1) + ' 楼 · ' + new Date().toLocaleString('zh-CN', { hour12: false })),
      chatId: info.chatId,
      avatar: info.avatar,
      floor: floor,
      swipeId: Number(msg.swipe_id) || 0,
      page: Math.max(0, Number(st.page) || 0),
      fingerprint: galFingerprint(msg.mes),
      preview: String(galCleanMessage(msg.mes)).replace(/\s+/g, ' ').slice(0, 80),
      view: JSON.parse(JSON.stringify(st.view || {})),
      memory: { turns: mem.turns.slice(-6), stages: mem.stages.slice(-2), long: mem.long.slice(-1) },
      stat: stat && stat.stat_data ? JSON.parse(JSON.stringify(stat.stat_data)) : null,
      createdAt: Date.now()
    };
    const list = galGetSaves();
    list.unshift(item);
    galSaveSaves(list);
    return { ok: true, save: item };
  }

  function galDeleteSave(id) {
    const list = galGetSaves().filter(function(s) { return s.id !== id; });
    galSaveSaves(list);
    return true;
  }
  function galRenameSave(id, name) {
    const list = galGetSaves();
    const item = list.find(function(s) { return s.id === id; });
    if (!item) return false;
    item.name = String(name || '').trim().slice(0, 40) || item.name;
    galSaveSaves(list);
    return true;
  }

  /* ── 原生回退能力探测 ───────────────────────────────────── */
  function galRollbackCapability() {
    const ctx = getSTCtx();
    const hasGlobalDelete = typeof mainWin.deleteMessage === 'function';
    const hasCtxDelete = !!(ctx && typeof ctx.deleteMessage === 'function');
    const hasSlash = !!(ctx && typeof ctx.executeSlashCommandsWithOptions === 'function');
    let hasReload = false;
    try { hasReload = !!(ctx && typeof ctx.saveMetadata === 'function' && typeof ctx.reloadCurrentChat === 'function'); } catch (e) {}
    return {
      hasGlobalDelete: hasGlobalDelete,
      hasCtxDelete: hasCtxDelete,
      hasSlash: hasSlash,
      hasReload: hasReload,
      canRollback: hasGlobalDelete || hasCtxDelete || hasSlash,
      detail: hasGlobalDelete ? 'deleteMessage（原生）'
        : (hasCtxDelete ? 'ctx.deleteMessage（原生）'
          : (hasSlash ? '/del 斜杠命令（尽力而为）' : '无可用回退接口'))
    };
  }

  /* 删除 floor 之后的所有消息。返回 {ok, deleted, reason} */
  async function galRollbackToFloor(targetFloor) {
    const ctx = getSTCtx();
    if (!ctx || !Array.isArray(ctx.chat)) return { ok: false, deleted: 0, reason: '读不到聊天记录' };
    if (targetFloor < 0 || targetFloor >= ctx.chat.length) return { ok: false, deleted: 0, reason: '目标楼层超出范围' };
    const cap = galRollbackCapability();
    if (!cap.canRollback) {
      return { ok: false, deleted: 0, reason: '当前酒馆版本没有可用的消息回退接口（既没有 deleteMessage，也没有 /del 命令），无法真正回到该楼层。' };
    }
    let deleted = 0;
    // 优先原生 deleteMessage：从末尾往前删，索引不会漂移
    for (let i = ctx.chat.length - 1; i > targetFloor; i--) {
      let done = false;
      try {
        if (typeof mainWin.deleteMessage === 'function') { await mainWin.deleteMessage(i); done = true; }
      } catch (e) {}
      if (!done) {
        try {
          if (ctx && typeof ctx.deleteMessage === 'function') { await ctx.deleteMessage(i); done = true; }
        } catch (e) {}
      }
      if (!done) break;
      // 删掉末尾一条后长度必须恰好是 i（原长度 i+1）。没变或变了别的数目都说明接口不可靠，立即停手
      if (ctx.chat.length !== i) {
        return { ok: false, deleted: deleted, reason: '删除接口没有按预期改变聊天记录，已停止操作，避免误删。' };
      }
      deleted++;
    }
    if (ctx.chat.length - 1 === targetFloor) {
      if (typeof ctx.saveMetadata === 'function') { try { await ctx.saveMetadata(); } catch (e) {} }
      return { ok: true, deleted: deleted, reason: '已回到第 ' + (targetFloor + 1) + ' 楼，共删除 ' + deleted + ' 条后续消息。' };
    }
    // 原生接口都不行时，退到 /del（只探测到有该命令才会走到这里）
    if (cap.hasSlash) {
      try {
        const from = targetFloor + 2;
        const to = ctx.chat.length;
        if (to >= from) {
          await ctx.executeSlashCommandsWithOptions('/del ' + from + '-' + to);
          if (ctx.chat.length - 1 === targetFloor) {
            return { ok: true, deleted: ctx.chat.length - 1 - targetFloor, reason: '已通过 /del 回到第 ' + (targetFloor + 1) + ' 楼。' };
          }
          return { ok: false, deleted: deleted, reason: '/del 执行后楼层数没有变化，可能需要手动确认。' };
        }
      } catch (e) {
        return { ok: false, deleted: deleted, reason: '/del 执行失败：' + String(e && e.message || e) };
      }
    }
    return { ok: false, deleted: deleted, reason: '删除过程中中断，当前楼层未到达目标位置。' };
  }

  /* ── 读档前的预检：告诉玩家会发生什么 ───────────────────── */
  function galPreviewRestore(id) {
    const save = galGetSaves().find(function(s) { return s.id === id; });
    if (!save) return { ok: false, reason: '存档不存在' };
    const info = galCurrentChatInfo();
    if (save.chatId && info.chatId && save.chatId !== info.chatId) {
      return { ok: false, reason: '这是「' + save.chatId + '」那份聊天的存档，不能读进当前聊天。', crossChat: true };
    }
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) {}
    if (!ctx || !Array.isArray(ctx.chat)) return { ok: false, reason: '读不到聊天记录' };
    const atSave = ctx.chat[save.floor];
    const sameFloor = atSave && galFingerprint(atSave.mes) === save.fingerprint;
    let found = sameFloor ? save.floor : -1;
    if (found < 0) {
      for (let i = ctx.chat.length - 1; i >= 0; i--) {
        if (ctx.chat[i] && galFingerprint(ctx.chat[i].mes) === save.fingerprint) { found = i; break; }
      }
    }
    const behind = ctx.chat.length - 1 - save.floor;
    const cap = galRollbackCapability();
    return {
      ok: true,
      save: save,
      sameFloor: sameFloor,
      foundFloor: found,
      needsRollback: !sameFloor || behind > 0,
      canRollback: cap.canRollback,
      capability: cap,
      behind: behind,
      warning: (behind > 0)
        ? '读档会回到第 ' + (save.floor + 1) + ' 楼，当前第 ' + (save.floor + 1 + behind) + ' 楼之后的 ' + behind + ' 条消息将被删除，且无法撤销。'
        : '当前已在存档楼层，读档只会恢复画面与阅读进度，不会删除任何消息。'
    };
  }

  /* 只恢复展示状态，不动聊天记录（安全路径） */
  function galRestoreViewOnly(id) {
    const pv = galPreviewRestore(id);
    if (!pv.ok) return pv;
    const save = pv.save;
    const st = galGetState();
    st.view = JSON.parse(JSON.stringify(save.view || { bg: '', cg: '', sprites: {}, expressions: {} }));
    const floor = pv.sameFloor ? save.floor : (pv.foundFloor >= 0 ? pv.foundFloor : save.floor);
    st.floor = floor;
    st.page = Math.max(0, Number(save.page) || 0);
    galSetState(st);
    if (save.memory) {
      const mem = galGetMemory();
      if (Array.isArray(save.memory.turns) && save.memory.turns.length) mem.turns = save.memory.turns.slice(-6);
      if (Array.isArray(save.memory.stages) && save.memory.stages.length) mem.stages = save.memory.stages.slice(-2);
      if (Array.isArray(save.memory.long) && save.memory.long.length) mem.long = save.memory.long.slice(-1);
      galSaveMemory(mem);
    }
    return { ok: true, floor: floor, page: st.page, viewOnly: true };
  }

  async function galApplyRestore(id, opts) {
    opts = opts || {};
    const pv = galPreviewRestore(id);
    if (!pv.ok) return pv;
    if (!pv.needsRollback || opts.rollback === false) {
      const r = galRestoreViewOnly(id);
      if (r.ok && pv.needsRollback) {
        r.reason = '只恢复了画面与阅读进度；当前聊天仍停在第 ' + ((function() {
          const ctx = getSTCtx(); return ctx && ctx.chat ? ctx.chat.length : 0;
        })()) + ' 楼，剧情节点没有回退。';
      }
      return r;
    }
    if (!pv.canRollback) {
      const r = galRestoreViewOnly(id);
      r.reason = pv.capability.detail + '；无法真正回退剧情，只恢复了画面与进度。';
      r.rollbackFailed = true;
      return r;
    }
    const rb = await galRollbackToFloor(pv.save.floor);
    if (!rb.ok) {
      const r = galRestoreViewOnly(id);
      r.rollbackFailed = true;
      r.reason = rb.reason;
      return r;
    }
    const r = galRestoreViewOnly(id);
    r.reason = rb.reason;
    r.rolledBack = true;
    return r;
  }

  /* ── 阅读进度：与楼层 / swipe 绑定 ─────────────────────── */
  function galRecordRead(idx, swipeId, page) {
    const cur = galGetProgress(idx, swipeId);
    const readMax = Math.max(cur.readMax, Number(page) || 0);
    return galSetProgress(idx, swipeId, { p: Number(page) || 0, readMax: readMax });
  }
  function galIsPageRead(idx, swipeId, page) {
    return Number(page) <= galGetProgress(idx, swipeId).readMax;
  }
