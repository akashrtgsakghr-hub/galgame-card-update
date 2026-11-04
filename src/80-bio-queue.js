    const lib = getUserBioLibrary();
    Object.values(lib.userBios || {}).forEach(function(b) { if (b) { b.enabled = false; b.updatedAt = Date.now(); } });
    const id = genUserBioId(); const now = Date.now();
    const ctx = getSTCtx(); const cardName = getCurrentCardName();
    let userName = '(未命名玩家)';
    try { userName = (ctx && (ctx.name1 || ctx.name)) || '(未命名玩家)'; } catch (e) {}
    lib.userBios[id] = {
      id: id, userName: userName, cardName: cardName || '', wordLimit: bioLimit, enabled: true, createdAt: now, updatedAt: now,
      versions: { original: { content: bio, generatedAt: now, wordLimit: bioLimit }, current: { content: bio, generatedAt: now, wordLimit: bioLimit } },
      audition: { latest: { content: audition, generatedAt: now } }
    };
    const ok = saveUserBioLibrary(lib);
    if (ok) { toast('玩家小抄已保存并启用', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('保存失败：localStorage 可能已满', 'warning');
  }

  function _mb_fill(str, map) { return String(str).replace(/\{(\w+)\}/g, function(_, k) { return map[k] !== undefined ? String(map[k]) : ''; }); }
  function _mb_buildAuditionSys(scene, wordLimit, duoConfig) {
    const p = _mb_CFG.p;
    let base = _mb_fill(p.e, { SCENE: scene, W: wordLimit });
    if (duoConfig && duoConfig.mode === 'player') base += ' ' + _mb_fill(p.h_player, { PLAYER: duoConfig.playerDesc || '(未知玩家)' });
    else if (duoConfig && duoConfig.mode === 'npc') base += ' ' + _mb_fill(p.h_npc, { NPC: duoConfig.npcName || 'NPC' });
    return [base, p.f].join(' ');
  }
  function _mb_buildRevisionSys(feedback, wordLimit) { return _mb_fill(_mb_CFG.p.g, { NOTE: feedback, W: wordLimit }); }
  function _mb_buildSceneFromMode(mode, custom, charName) {
    if (mode === 'custom' && custom) {
      const parts = [];
      if (custom.time) parts.push('时间：' + custom.time);
      if (custom.place) parts.push('地点：' + custom.place);
      if (custom.chars) parts.push('同时在场：' + custom.chars);
      if (custom.desc) parts.push('情境：' + custom.desc);
      return parts.length ? parts.join('。') : '一个安静的午后，玩家来到' + charName + '面前。';
    }
    if (mode === 'recent') {
      const ctx = getSTCtx();
      if (ctx && ctx.chat && ctx.chat.length) {
        const lines = [];
        for (let i = ctx.chat.length - 1; i >= 0 && lines.length < 3; i--) {
          const m = ctx.chat[i]; if (!m) continue;
          let text = String(m.mes || '').replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '').replace(/<Commands>[\s\S]*?<\/Commands>/gi, '').replace(/<StatusPlaceHolderImpl\s*\/>/gi, '').trim();
          if (!text) continue;
          if (text.length > 300) text = text.slice(0, 300) + '……';
          lines.unshift((m.is_user ? '【玩家】' : '【角色】') + text);
        }
        if (lines.length) return '承接最近对话的延续场景：\n' + lines.join('\n');
      }
      return '一个安静的午后，玩家来到' + charName + '面前。';
    }
    return '根据角色特点，选择一个最能展现这位角色灵魂的日常或临界场景。';
  }
  function _mb_buildBioSys(wordLimit) {
    const p = _mb_CFG.p;
    return [_mb_fill(p.a, {}), _mb_fill(p.b, {}), _mb_fill(p.c, { W: wordLimit })].join(' ');
  }
  async function _mb_genBioSilent(charName, wordLimit, useChat) {
    const provider = getAdaptModelPref();
    const charInfo = collectCharInfoForBio(charName);
    let chatHistory = '';
    if (useChat) { try { const chatCtx = collectChatHistoryContext(3000); chatHistory = chatCtx.chat || ''; } catch (e) {} }
    const sys = _mb_buildBioSys(wordLimit);
    const user = '【角色名】' + charName + '\n\n【角色卡】\n' + charInfo + (chatHistory ? '\n\n【最近对话参考】\n' + chatHistory : '') + '\n\n请输出这份角色的灵魂小传。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }
  async function _mb_rewriteForR(charName, oldBio, newR, newRStageName, wordLimit, chatHistory) {
    const provider = getAdaptModelPref();
    const sysPrompt = ['你是一位剧组选角导演。这个角色与玩家的关系阶段刚刚发生了推进。', '请根据新的阶段，重写这位角色的灵魂小传。', '', '【新的关系阶段】R=' + newR + '（' + (newRStageName || '') + '）', '', '【重写要求】', '1. 保留【底色】部分的角色核心性格（可以微调措辞，但本质不变）', '2. 重点改写【对玩家的态度】部分，体现新的关系阶段', '3. 【行为锚点】和【台词声线】相应调整', '4. 总字数不超过 ' + wordLimit + ' 字', '5. 只输出小传内容，不要任何前言后记、不要 markdown、不要复述角色卡', '', '【格式】保留原来的四块结构：[core personality] / [attitude toward player] / [behavioral triggers] / [three voice sample lines]'].join('\n');
    const userPrompt = '【角色名】' + charName + '\n\n【当前小传】\n' + oldBio + (chatHistory ? '\n\n【最近剧情参考】\n' + chatHistory : '') + '\n\n请输出重写后的小传。';
    const reply = await callOpeningModel(provider, sysPrompt, userPrompt);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }
  /* ───────────────────────────────────────────────────────── */
  async function triggerBioRewriteFor(charNames) {
    if (!Array.isArray(charNames) || !charNames.length) return;
    const cardName = getCurrentCardName();
    if (!cardName || cardName === '(未知卡牌)') return;
    const lib = getBioLibrary();
    const now = Date.now();
    let rewritten = 0;
    let chatHistory = '';
    try { const chatCtx = collectChatHistoryContext(2500); chatHistory = chatCtx.chat || ''; } catch (e) {}
    for (let i = 0; i < charNames.length; i++) {
      const charName = charNames[i];
      const bios = Object.values(lib.bios).filter(function(b) { return b && b.enabled === true && b.cardName === cardName && b.charName === charName; });
      if (bios.length === 0) continue;
      const data = readMvuLatest();
      const ch = data && data.stat_data && data.stat_data.角色 && data.stat_data.角色[charName];
      if (!ch) continue;
      const newR = Number(ch.阶段值) || 0;
      const newStage = getRStageFromE(Number(ch.好感度) || 0);
      for (let j = 0; j < bios.length; j++) {
        const b = bios[j];
        try {
          const oldCurrent = String(b.versions.current.content || '');
          if (!oldCurrent) continue;
          const revised = await _mb_rewriteForR(charName, oldCurrent, newR, newStage.name, b.wordLimit || 260, chatHistory);
          if (!revised || !revised.trim()) continue;
          if (!b.versions || typeof b.versions !== 'object') b.versions = {};
          if (!Array.isArray(b.versions.history)) b.versions.history = [];
          b.versions.history.push({ content: oldCurrent, generatedAt: b.versions.current.generatedAt || b.createdAt || now, rValue: b.versions.current.rValue !== undefined ? b.versions.current.rValue : null });
          if (b.versions.history.length > 10) b.versions.history = b.versions.history.slice(-10);
          b.versions.current = { content: revised.trim(), generatedAt: now, rValue: newR, wordLimit: b.wordLimit || 260 };
          b.updatedAt = now; b._pendingRewriteNotice = true; rewritten++;
        } catch (e) { console.warn('[Doki] R 重写失败：', e); }
      }
    }
    if (rewritten > 0) {
      saveBioLibrary(lib);
      toast('角色小抄已根据新阶段自动重写（' + rewritten + ' 份）', 'success');
      try { refreshPanel(); } catch (e) {}
    }
  }

  async function _mb_genAudition(charName, bio, scene, wordLimit, duoConfig) {
    const provider = getAdaptModelPref();
    const sys = _mb_buildAuditionSys(scene, wordLimit, duoConfig);
    let user = '【角色名】' + charName + '\n\n【灵魂小传】\n' + bio + '\n\n请开始你的试镜演出。';
    if (duoConfig && duoConfig.mode === 'player') {
      user = '【你的角色】' + charName + '\n\n【灵魂小传】\n' + bio + '\n\n【玩家角色设定】\n' + (duoConfig.playerDesc || '(未设置)') + '\n\n请开始你的试镜演出。';
    }
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }

  async function _mb_reviseBio(charName, oldBio, feedback, wordLimit) {
    const provider = getAdaptModelPref();
    const sys = _mb_buildRevisionSys(feedback, wordLimit);
    const user = '【角色名】' + charName + '\n\n【当前小传】\n' + oldBio + '\n\n请按要求修订，只输出修订后的小传。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }

  function openAuditionMainDialog(panel) {
    const activeNames = getCurrentActiveCharNames();
    if (activeNames.length === 0) {
      showModalDialog('🎬 角色试镜', '<div>当前存档没有有效角色。</div><div style="margin-top:8px;color:#fbbf24;">请先完成建档。</div>', null, { confirmText: '知道了' });
      return;
    }
    const rows = activeNames.map(function(name) {
      return '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:6px;cursor:pointer;">' +
        '<input type="checkbox" class="moon-aud-char-check" data-name="' + name.replace(/"/g, '&quot;') + '" checked>' +
        '<span style="font-size:12px;color:#e2e8f0;">' + name + '</span></label>';
    }).join('');
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">AI 将先通读角色卡生成灵魂小抄，再为每个角色排演一段试镜片段。</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">勾选要试镜的角色：</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;margin-top:10px;">对戏模式：</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cbd5e1;cursor:pointer;"><input type="radio" name="moon-aud-duo-mode" value="solo" checked> 单人独白（只有该角色，聚焦内心戏）</label>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cbd5e1;cursor:pointer;"><input type="radio" name="moon-aud-duo-mode" value="player"> 与玩家对戏</label>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cbd5e1;cursor:pointer;"><input type="radio" name="moon-aud-duo-mode" value="npc"> 与 AI 配角对戏</label></div>' +
      '<div id="moon-aud-duo-config" style="display:none;padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:10px;">' +
      '<div id="moon-aud-duo-player-box" style="display:none;margin-bottom:6px;"><div style="font-size:10.5px;color:#94a3b8;margin-bottom:3px;">玩家角色设定（可选，会作为对戏参考）</div><textarea id="moon-aud-player-desc" placeholder="例如：性格温和，不擅长表达感情。" style="width:100%;box-sizing:border-box;min-height:50px;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.6;resize:vertical;font-family:inherit;"></textarea></div>' +
      '<div id="moon-aud-duo-npc-box" style="display:none;"><div style="font-size:10.5px;color:#94a3b8;margin-bottom:3px;">配角名（例如：中原中也）</div><input id="moon-aud-npc-name" type="text" placeholder="角色名" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;"></div></div>' +
      '<div style="max-height:28dvh;overflow-y:auto;padding-right:4px;margin-bottom:10px;">' + rows + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">试镜场景来源：</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cbd5e1;cursor:pointer;"><input type="radio" name="moon-aud-scene-mode" value="ai" checked> AI 自选</label>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cbd5e1;cursor:pointer;"><input type="radio" name="moon-aud-scene-mode" value="recent"> 从最近对话抽</label>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cbd5e1;cursor:pointer;"><input type="radio" name="moon-aud-scene-mode" value="custom"> 自定义场景</label></div>' +
      '<div id="moon-aud-custom-box" style="display:none;padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:10px;">' +
      '<div style="margin-bottom:6px;"><div style="font-size:10.5px;color:#94a3b8;margin-bottom:3px;">时间</div><input id="moon-aud-scene-time" type="text" placeholder="例如：雨夜" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;"></div>' +
      '<div style="margin-bottom:6px;"><div style="font-size:10.5px;color:#94a3b8;margin-bottom:3px;">地点</div><input id="moon-aud-scene-place" type="text" placeholder="例如：天台" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;"></div>' +
      '<div style="margin-bottom:6px;"><div style="font-size:10.5px;color:#94a3b8;margin-bottom:3px;">同时在场（可选）</div><input id="moon-aud-scene-chars" type="text" placeholder="例如：中原中也" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;"></div>' +
      '<div><div style="font-size:10.5px;color:#94a3b8;margin-bottom:3px;">情境描述</div><textarea id="moon-aud-scene-desc" placeholder="例如：玩家递给他一把伞" style="width:100%;box-sizing:border-box;min-height:60px;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.6;resize:vertical;font-family:inherit;"></textarea></div></div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">小抄字数：<span id="moon-aud-bio-label" style="color:#7dd3fc;font-weight:700;">260</span> 字</div>' +
      '<input id="moon-aud-bio-slider" type="range" min="150" max="400" step="10" value="260" style="width:100%;margin-bottom:8px;">' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">试镜片段字数：<span id="moon-aud-seg-label" style="color:#7dd3fc;font-weight:700;">200</span> 字</div>' +
      '<input id="moon-aud-seg-slider" type="range" min="100" max="400" step="10" value="200" style="width:100%;margin-bottom:10px;">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;cursor:pointer;"><input type="checkbox" id="moon-aud-use-chat" checked> 生成小抄时参考最近对话</label>';
    showModalDialogCancelable('🎬 角色试镜', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const names = [];
        mask.querySelectorAll('.moon-aud-char-check').forEach(function(ck) { if (ck.checked) names.push(ck.getAttribute('data-name')); });
        if (!names.length) { toast('未勾选任何角色', 'info'); return; }
        const mode = (mask.querySelector('input[name="moon-aud-scene-mode"]:checked') || {}).value || 'ai';
        const custom = { time: (mask.querySelector('#moon-aud-scene-time') || {}).value || '', place: (mask.querySelector('#moon-aud-scene-place') || {}).value || '', chars: (mask.querySelector('#moon-aud-scene-chars') || {}).value || '', desc: (mask.querySelector('#moon-aud-scene-desc') || {}).value || '' };
        const bioLimit = Number(mask.querySelector('#moon-aud-bio-slider').value) || 260;
        const segLimit = Number(mask.querySelector('#moon-aud-seg-slider').value) || 200;
        const useChat = mask.querySelector('#moon-aud-use-chat').checked;
        const duoMode = (mask.querySelector('input[name="moon-aud-duo-mode"]:checked') || {}).value || 'solo';
        const duoNpcName = (mask.querySelector('#moon-aud-npc-name') || {}).value || '';
        const playerDesc = (mask.querySelector('#moon-aud-player-desc') || {}).value || '';
        try { mask.remove(); } catch (e) {}
        _mb_startQueue(names, { sceneMode: mode, custom: custom, bioLimit: bioLimit, segLimit: segLimit, useChat: useChat, duoMode: duoMode, duoNpcName: duoNpcName, playerDesc: playerDesc }, panel);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始试镜', cancelText: '取消',
        onOpen: function(mask) {
          const bs = mask.querySelector('#moon-aud-bio-slider'); const bl = mask.querySelector('#moon-aud-bio-label');
          bs.addEventListener('input', function() { bl.textContent = bs.value; });
          const ss = mask.querySelector('#moon-aud-seg-slider'); const sl = mask.querySelector('#moon-aud-seg-label');
          ss.addEventListener('input', function() { sl.textContent = ss.value; });
          mask.querySelectorAll('input[name="moon-aud-scene-mode"]').forEach(function(r) { r.addEventListener('change', function() { const box = mask.querySelector('#moon-aud-custom-box'); box.style.display = r.value === 'custom' && r.checked ? 'block' : 'none'; }); });
          mask.querySelectorAll('input[name="moon-aud-duo-mode"]').forEach(function(r) {
            r.addEventListener('change', function() {
              const box = mask.querySelector('#moon-aud-duo-config'); const pBox = mask.querySelector('#moon-aud-duo-player-box'); const nBox = mask.querySelector('#moon-aud-duo-npc-box');
              const val = mask.querySelector('input[name="moon-aud-duo-mode"]:checked').value;
              box.style.display = val === 'solo' ? 'none' : 'block';
              pBox.style.display = val === 'player' ? 'block' : 'none';
              nBox.style.display = val === 'npc' ? 'block' : 'none';
            });
          });
        }
      });
  }
  /* ───────────────────────────────────────────────────────── */
  async function _mb_startQueue(names, config, panel) {
    const state = { names: names.slice(), index: 0, config: config, drafts: {}, confirmed: {} };
    showLoadingDialog('AI 正在做人物小抄...');
    for (let i = 0; i < state.names.length; i++) {
      const name = state.names[i];
      updateLoadingDialogText('AI 正在为 ' + name + ' 做人物小抄... (' + (i + 1) + '/' + names.length + ')');
      try {
        const bio = await _mb_genBioSilent(name, config.bioLimit, config.useChat);
        state.drafts[name] = { bio: bio, audition: '', sceneText: '', revisionCount: 0 };
      } catch (e) { state.drafts[name] = { bio: null, error: String(e && e.message || e) }; }
    }
    closeLoadingDialog();
    _mb_processCurrent(state, panel);
  }

  async function _mb_processCurrent(state, panel) {
    while (state.index < state.names.length) {
      const name = state.names[state.index];
      const draft = state.drafts[name];
      if (!draft || !draft.bio) { state.confirmed[name] = { skipped: true, reason: draft ? draft.error : '未知错误' }; state.index++; continue; }
      const scene = _mb_buildSceneFromMode(state.config.sceneMode, state.config.custom, name);
      draft.sceneText = scene;
      showLoadingDialog('AI 正在调整状态...');
      try {
        draft.audition = await _mb_genAudition(name, draft.bio, scene, state.config.segLimit, { mode: state.config.duoMode, npcName: state.config.duoNpcName, playerDesc: state.config.playerDesc });
      } catch (e) { draft.audition = '（试镜片段生成失败：' + (e.message || e) + '）'; }
      closeLoadingDialog();
      _mb_openAuditionDialog(state, panel);
      return;
    }
    _mb_finishQueue(state, panel);
  }

  function _mb_openAuditionDialog(state, panel) {
    const name = state.names[state.index];
    const draft = state.drafts[name];
    const total = state.names.length;
    const current = state.index + 1;
    const safeName = String(name).replace(/</g, '&lt;');
    const safeAud = String(draft.audition || '').replace(/</g, '&lt;');
    const html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">角色 ' + current + ' / ' + total + '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#f8fafc;margin-bottom:10px;">🎬 ' + safeName + '</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">试镜片段</div>' +
      '<div style="padding:12px 14px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:10px;font-size:12px;line-height:1.8;color:#e2e8f0;white-space:pre-wrap;max-height:38dvh;overflow-y:auto;margin-bottom:12px;">' + safeAud + '</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">导演意见</div>' +
      '<textarea id="moon-aud-feedback" placeholder="例如：他应该更冷淡一些。" style="width:100%;box-sizing:border-box;min-height:70px;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;resize:vertical;font-family:inherit;margin-bottom:10px;"></textarea>' +
      '<div style="display:flex;gap:6px;">' +
      '<button id="moon-aud-retry" style="flex:1.2;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🎭 让 AI 重演</button>' +
      '<button id="moon-aud-ok" style="flex:1;padding:9px;border-radius:8px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✅ 确认</button>' +
      '<button id="moon-aud-skip" style="flex:0.7;padding:9px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">⏭️ 跳过</button></div>';
    let mask = mainDoc.getElementById('moon-modal-mask');
    if (mask) { try { mask.remove(); } catch (e) {} }
    mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:520px;max-height:88dvh;overflow-y:auto;font-family:sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8);box-sizing:border-box;">' +
      '<div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;">🎬 试镜中</div>' +
      '<div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:6px;">' + html + '</div></div>';
    mainDoc.body.appendChild(mask);
    function closeMask() { try { mask.remove(); } catch (e) {} }
    mask.querySelector('#moon-aud-retry').addEventListener('click', async function() {
      const fb = String(mask.querySelector('#moon-aud-feedback').value || '').trim();
      if (!fb) { toast('请先写下意见', 'info'); return; }
      closeMask();
      showLoadingDialog('AI 正在调整状态...');
      try {
        const newBio = await _mb_reviseBio(name, draft.bio, fb, state.config.bioLimit);
        draft.bio = newBio; draft.revisionCount++;
        const scene = draft.sceneText || _mb_buildSceneFromMode(state.config.sceneMode, state.config.custom, name);
        draft.audition = await _mb_genAudition(name, draft.bio, scene, state.config.segLimit, { mode: state.config.duoMode, npcName: state.config.duoNpcName, playerDesc: state.config.playerDesc });
      } catch (e) { closeLoadingDialog(); toast('重演失败：' + (e.message || e), 'warning'); _mb_openAuditionDialog(state, panel); return; }
      closeLoadingDialog();
      _mb_openAuditionDialog(state, panel);
    });
    mask.querySelector('#moon-aud-ok').addEventListener('click', function() {
      state.confirmed[name] = { skipped: false, draft: draft };
      state.index++; closeMask();
      _mb_processCurrent(state, panel);
    });
    mask.querySelector('#moon-aud-skip').addEventListener('click', function() {
      state.confirmed[name] = { skipped: true };
      state.index++; closeMask();
      _mb_processCurrent(state, panel);
    });
  }

  function _mb_finishQueue(state, panel) {
    const lib = getBioLibrary();
    const cardName = getCurrentCardName();
    const now = Date.now();
    let savedCount = 0;
    Object.keys(state.confirmed).forEach(function(name) {
      const c = state.confirmed[name];
      if (!c || c.skipped || !c.draft || !c.draft.bio) return;
      const id = genBioId();
      lib.bios[id] = {
        id: id, charName: name, cardName: cardName, tags: [], wordLimit: state.config.bioLimit, enabled: true,
        createdAt: now, updatedAt: now,
        versions: {
          original: { content: c.draft.bio, generatedAt: now, rValue: null, wordLimit: state.config.bioLimit },
          current: { content: c.draft.bio, generatedAt: now, rValue: null, wordLimit: state.config.bioLimit }
        },
        audition: { latest: { content: c.draft.audition, scene: c.draft.sceneText, generatedAt: now, revisionCount: c.draft.revisionCount || 0 } }
      };
      savedCount++;
    });
    const saved = saveBioLibrary(lib);
    const skippedNames = Object.keys(state.confirmed).filter(function(n) { return state.confirmed[n].skipped; });
    let bodyHtml = '';
    if (saved && savedCount > 0) bodyHtml = '<div style="color:#6ee7b7;font-size:12.5px;font-weight:700;margin-bottom:6px;">✔ 已为 ' + savedCount + ' 个角色建立试镜记录</div><div style="font-size:11px;color:#94a3b8;line-height:1.7;">数据已保存到本地。换设备前请自行导出备份。</div>';
    else bodyHtml = '<div style="color:#94a3b8;font-size:12px;">本次没有角色被确认。</div>';
    if (skippedNames.length) bodyHtml += '<div style="margin-top:10px;padding:8px 10px;background:rgba(148,163,184,0.08);border-radius:8px;font-size:10.5px;color:#94a3b8;">跳过：' + skippedNames.join('、') + '</div>';
    showModalDialog('🎬 试镜完成', bodyHtml, null, { confirmText: '关闭' });
    try { refreshPanel(); } catch (e) {}
  }

