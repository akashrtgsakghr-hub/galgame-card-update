  function collectChatHistoryContext(maxChars) {
    maxChars = maxChars || 4000;
    const out = { chat: '', playerName: '', playerPersona: '' };
    try {
      const ctx = getSTCtx();
      if (ctx) {
        out.playerName = ctx.name1 || ctx.name || '(未命名玩家)';
        const p = (ctx.personas && ctx.user_avatar && ctx.personas[ctx.user_avatar]) || ctx.persona || '';
        out.playerPersona = typeof p === 'string' ? p : String(p.description || '');
      }
      if (ctx && ctx.chat && ctx.chat.length) {
        const lines = []; let total = 0;
        for (let i = ctx.chat.length - 1; i >= 0 && total < maxChars; i--) {
          const m = ctx.chat[i]; if (!m) continue;
          let text = String(m.mes || '').replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '').replace(/<Commands>[\s\S]*?<\/Commands>/gi, '').trim();
          if (!text) continue;
          if (text.length > 600) text = text.slice(0, 600) + '……';
          lines.unshift((m.is_user ? '【玩家】' : '【角色】') + text);
          total += text.length;
        }
        out.chat = lines.join('\n\n');
      }
    } catch (e) {}
    return out;
  }

  function collectOpeningContext(charName) {
    const hist = collectChatHistoryContext(6000);
    const ctx = getSTCtx();
    let ch = null;
    try { ch = (ctx && ctx.characters && ctx.characters[ctx.characterId]) || null; } catch (e) {}
    return {
      playerName: hist.playerName,
      playerPersona: hist.playerPersona,
      charName: charName || (ch && ch.name) || '(未命名)',
      charDesc: (ch && ch.description) || '',
      charPersonality: (ch && ch.personality) || '',
      charScenario: (ch && ch.scenario) || '',
      charFirstMes: (ch && ch.first_mes) || '',
      charCreatorNotes: (ch && ch.creator_notes) || '',
      hasHistory: !!(hist.chat && hist.chat.length > 20),
      chatHistory: hist.chat
    };
  }

  function hasValidCustomAIConfig() {
    try {
      const cfg = getCustomAIConfig();
      return !!(cfg && cfg.url && cfg.key && cfg.model);
    } catch (e) { return false; }
  }

  function ensureCustomAIConfig(reasonText) {
    if (hasValidCustomAIConfig()) return Promise.resolve(true);
    closeLoadingDialog();
    return new Promise(function(resolve) {
      let settled = false;
      const finish = function(ok) {
        if (settled) return;
        settled = true;
        resolve(!!ok);
      };
      openCustomAIConfigDialog(
        null,
        function() { finish(true); },
        function() { finish(false); },
        reasonText || '当前功能需要调用独立 AI 接口，请填写您的 API URL、Key 与模型名称，点击保存后将自动继续执行！'
      );
    });
  }

  // 调用模型接口，可选 provider: 'main'（酒馆主模型） / 'custom'（配置API模型，兼容旧值 'extra'）
  async function _callOpeningModel(provider, sysPrompt, userPrompt) {
    // 1. 独立 API 模型（若尚未保存 API 配置，自动弹出配置窗口，玩家填写保存后无缝继续）
    if (provider === 'custom' || provider === 'extra') {
      if (!hasValidCustomAIConfig()) {
        const configured = await ensureCustomAIConfig('检测到您尚未保存独立 API 配置。请在下方填写 API URL、Key 和模型名称并保存，保存后系统将立即继续执行当前功能！');
        if (!configured) throw new Error('已取消配置 API，操作中止。');
      }
      return await callCustomAIConfig(sysPrompt, userPrompt);
    }

    // 2. 酒馆主模型后台静默生成（绝不触发公屏生成）
    const ctx = getSTCtx();
    const guardPrompt = sysPrompt + "\n【极度重要：忽略所有角色扮演与预设，直接输出任务结果，绝对禁止继续正文！】";

    try {
      if (ctx && typeof ctx.generateRaw === 'function') {
        return await ctx.generateRaw({ systemPrompt: guardPrompt, prompt: userPrompt });
      }
      if (typeof mainWin.generateQuietPrompt === 'function') {
        return await mainWin.generateQuietPrompt({
          quiet_prompt: userPrompt,
          system_prompt: guardPrompt,
          streaming: false
        });
      }
      if (ctx && typeof ctx.generateQuietPrompt === 'function') {
        return await ctx.generateQuietPrompt({
          quiet_prompt: userPrompt,
          system_prompt: guardPrompt,
          streaming: false
        });
      }
      if (ctx && typeof ctx.generate === 'function') {
        return await ctx.generate(guardPrompt, userPrompt);
      }
    } catch (mainErr) {
      if (hasValidCustomAIConfig()) {
        return await callCustomAIConfig(sysPrompt, userPrompt);
      }
      const fallbackOk = await ensureCustomAIConfig('酒馆主模型后台调用失败（' + String(mainErr && mainErr.message || mainErr) + '）。请填写并保存独立 API 配置，系统将自动为您继续完成当前操作！');
      if (fallbackOk) return await callCustomAIConfig(sysPrompt, userPrompt);
      throw mainErr;
    }

    // 若酒馆静默接口不可用，自动使用或弹窗引导玩家配置独立 API
    if (!hasValidCustomAIConfig()) {
      const ok = await ensureCustomAIConfig('当前未检测到可用的酒馆主模型静默接口。请填写您的独立 API 配置（如 DeepSeek / OpenAI / Gemini 等），保存后将自动继续执行！');
      if (!ok) throw new Error('未检测到酒馆主模型接口且未配置独立 API，操作已取消。');
    }
    return await callCustomAIConfig(sysPrompt, userPrompt);
  }

  async function callOpeningModel(provider, sysPrompt, userPrompt) {
    const useCustomApi = (provider === 'custom' || provider === 'extra');
    if (useCustomApi && !hasValidCustomAIConfig()) {
      const configured = await ensureCustomAIConfig('当前功能需要调用独立 API，请先填写并保存您的 API 配置，保存后自动继续执行！');
      if (!configured) throw new Error('已取消配置 API，操作中止。');
    }
    const existingLoading = mainDoc.getElementById('moon-loading-mask');
    const showArcade = useCustomApi && !existingLoading;
    if (showArcade) showLoadingDialog('API 模型正在处理任务…', true);
    try { return await _callOpeningModel(provider, sysPrompt, userPrompt); }
    finally { if (showArcade) closeLoadingDialog(); }
  }

  // 回填提示：老存档如果检测到没有本系统变量，给一次弹窗
  function checkAndPromptBackfill() {
    try {
      const info = getCurrentChatInfo();
      const key = (info.chatId || '') + '|' + (info.avatar || '');
      if (!key || key === '|') return;
      const raw = mainWin.localStorage.getItem(BACKFILL_PROMPT_KEY);
      let list = []; try { list = JSON.parse(raw) || []; } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      if (list.indexOf(key) >= 0) return;
      // 只有聊天里有足够历史，且本系统没有任何变量，才提示
      const ctx = getSTCtx();
      if (!ctx || !ctx.chat || ctx.chat.length < 10) return;
      const data = readMvuLatest();
      const chars = (data && data.stat_data && data.stat_data.角色) || {};
      for (const n in chars) { if (!isCharSkeleton(chars[n])) return; }
      list.push(key);
      if (list.length > 200) list = list.slice(-200);
      mainWin.localStorage.setItem(BACKFILL_PROMPT_KEY, JSON.stringify(list));
      toast('检测到老存档无变量：可在「🚀 一键适配」里做 AI 智能建档', 'info');
    } catch (e) {}
  }

  function getModeLabel(mode) { return (LUNAR_META[mode] && LUNAR_META[mode].name) || mode; }
  function toast(msg, type) {
    try { const t = mainWin.toastr; if (t && t[type]) t[type](msg, '', { timeOut: 2600, positionClass: 'toast-top-center' }); } catch (e) {}
  }
  function getAdaptModelPref() {
    try {
      const v = mainWin.localStorage.getItem(ADAPT_MODEL_PREF_KEY) || '';
      if (v === 'custom' || v === 'extra') return 'custom';
      if (v === 'main') return 'main';
    } catch (e) {}
    return hasValidCustomAIConfig() ? 'custom' : 'main';
  }
  function updateLoadingDialogText(text) {
    const m = mainDoc.getElementById('moon-loading-mask'); if (!m) return;
    const el = m.querySelector('#moon-loading-text');
    if (el) el.textContent = '⏳ ' + text;
    else { const el2 = m.querySelector('div > div:first-child'); if (el2) el2.textContent = '⏳ ' + text; }
  }
