  /* ───────────────────────────────────────────────────────── */
  const CUSTOM_AI_CONFIG_KEY_LOCAL = 'moon_phase_custom_ai_config';
  function getCustomAIConfig() {
    try {
      const store = getStorage();
      const raw = store ? store.getItem(CUSTOM_AI_CONFIG_KEY_LOCAL) : null;
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { url: '', key: '', model: '' };
  }
  function saveCustomAIConfig(cfg) {
    try {
      const store = getStorage();
      if (store) store.setItem(CUSTOM_AI_CONFIG_KEY_LOCAL, JSON.stringify(cfg));
    } catch (e) {}
  }

  const normalizeApiUrl = normalizeCustomApiUrl;
  function normalizeCustomApiUrl(url) {
    if (!url) return '';
    let u = String(url).trim().replace(/[\u3000\s]+/g, '').replace(/\/+$/, '');
    if (u.endsWith('/chat/completions')) return u;
    if (/\/v\d+(?:beta\d*)?$/i.test(u)) return u + '/chat/completions';
    try {
      const urlObj = new URL(u);
      const p = urlObj.pathname.replace(/\/+$/, '');
      if (p === '' || p === '/') return u + '/v1/chat/completions';
      if (!p.endsWith('/chat/completions')) return u + '/chat/completions';
    } catch (e) {}
    return u;
  }

  function deriveCustomBaseUrl(url) {
    if (!url) return '';
    let u = String(url).trim().replace(/[\u3000\s]+/g, '').replace(/\/+$/, '');
    if (u.endsWith('/chat/completions')) u = u.slice(0, -'/chat/completions'.length);
    else if (u.endsWith('/models')) u = u.slice(0, -'/models'.length);
    try {
      const x = new URL(u);
      const p = x.pathname.replace(/\/+$/, '');
      if (p === '' || p === '/') x.pathname = '/v1';
      return x.toString().replace(/\/+$/, '');
    } catch (e) {
      return u;
    }
  }

  function deriveModelsUrl(chatUrl) {
    const base = deriveCustomBaseUrl(chatUrl);
    if (!base) return '';
    return base.replace(/\/+$/, '') + '/models';
  }

  function getSTRequestHeaders() {
    try {
      const ctx = getSTCtx();
      if (ctx && typeof ctx.getRequestHeaders === 'function') return ctx.getRequestHeaders();
    } catch (e) {}
    try {
      if (typeof mainWin.getRequestHeaders === 'function') return mainWin.getRequestHeaders();
    } catch (e) {}
    return { 'Content-Type': 'application/json' };
  }

  function extractModelIdsFromPayload(data) {
    let ids = [];
    if (Array.isArray(data && data.data)) ids = data.data.map(function(x) { return x && (x.id || x.name || x.model); });
    else if (Array.isArray(data && data.models)) ids = data.models.map(function(x) { return typeof x === 'string' ? x : (x && (x.id || x.name || x.model)); });
    else if (Array.isArray(data)) ids = data.map(function(x) { return typeof x === 'string' ? x : (x && (x.id || x.name || x.model)); });
    return ids.filter(function(s) { return s && typeof s === 'string'; }).map(function(s) { return s.replace(/^models\//, ''); });
  }

  function getSuggestedModelsByUrl(rawUrl) {
    const u = String(rawUrl || '').toLowerCase();
    if (u.indexOf('deepseek') >= 0) return ['deepseek-chat', 'deepseek-reasoner'];
    if (u.indexOf('googleapis') >= 0 || u.indexOf('gemini') >= 0) return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
    if (u.indexOf('anthropic') >= 0 || u.indexOf('claude') >= 0) return ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'];
    if (u.indexOf('siliconflow') >= 0) return ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'];
    if (u.indexOf('openrouter') >= 0) return ['deepseek/deepseek-chat-v3-0324', 'google/gemini-2.5-flash', 'openai/gpt-4o-mini'];
    return ['deepseek-chat', 'deepseek-reasoner', 'gpt-4o-mini', 'gemini-2.5-flash', 'claude-3-7-sonnet-latest'];
  }

  async function fetchModelsWithFallback(rawUrl, key) {
    const doFetch = (mainWin && typeof mainWin.fetch === 'function') ? mainWin.fetch.bind(mainWin) : fetch;
    const baseUrl = deriveCustomBaseUrl(rawUrl);
    const modelsUrl = deriveModelsUrl(normalizeCustomApiUrl(rawUrl));
    const candidateUrls = [modelsUrl];
    try {
      const uObj = new URL(rawUrl.trim());
      const altUrl = uObj.origin + '/v1/models';
      const altUrl2 = uObj.origin + '/models';
      if (candidateUrls.indexOf(altUrl) < 0) candidateUrls.push(altUrl);
      if (candidateUrls.indexOf(altUrl2) < 0) candidateUrls.push(altUrl2);
    } catch (e) {}

    let lastErr = null;
    // 1. 优先尝试通过酒馆后端代理接口拉取（绕过浏览器 CORS 跨域与移动端 iframe 限制）
    try {
      const stHeaders = Object.assign({ 'Content-Type': 'application/json' }, getSTRequestHeaders());
      const proxyRes = await doFetch('/api/backends/chat-completions/status', {
        method: 'POST',
        headers: stHeaders,
        body: JSON.stringify({
          chat_completion_source: 'custom',
          custom_url: baseUrl,
          api_key_custom: key,
          reverse_proxy: baseUrl,
          proxy_password: key
        })
      });
      if (proxyRes && !proxyRes.ok) { proxyNote = '代理线路返回 HTTP ' + proxyRes.status; }
      if (proxyRes && proxyRes.ok) {
        const proxyData = await proxyRes.json();
        const proxyIds = extractModelIdsFromPayload(proxyData);
        if (proxyIds.length > 0) return { ids: proxyIds, via: '酒馆后端代理' };
      }
    } catch (e) {
      lastErr = e;
    }

    // 2. 尝试前端直接请求候选 /models 端点
    for (let i = 0; i < candidateUrls.length; i++) {
      const targetUrl = candidateUrls[i];
      if (!targetUrl) continue;
      try {
        const res = await doFetch(targetUrl, {
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + key }
        });
        if (!res.ok) {
          const t = await res.text();
          lastErr = new Error('HTTP ' + res.status + ' ' + String(t).slice(0, 120));
          continue;
        }
        const data = await res.json();
        const ids = extractModelIdsFromPayload(data);
        if (ids.length > 0) return { ids: ids, via: '直连' };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Failed to fetch');
  }

  function openCustomAIConfigDialog(panel, onSaved, onCanceled, promptBannerText) {
    const cfg = getCustomAIConfig();
    const displayUrl = cfg.rawUrl || (cfg.url ? deriveCustomBaseUrl(cfg.url) : '');
    const bannerHtml = promptBannerText
      ? '<div style="padding:8px 10px;margin-bottom:10px;border:1px solid #f472d0;background:#241025;color:#ffd1f1;font-size:11px;line-height:1.6;">💡 <b>掌机提示：</b>' + escapeFeatureHtml(promptBannerText) + '</div>'
      : '';

    const html = bannerHtml +
      '<div style="font-size:11px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">仅供本系统的 AI 检测 / 开局推断 / 角色与玩家试镜 / 时间线功能使用。<br><span style="color:#ff8cdb;font-size:10px;">★ 支持直接手填模型名保存（无需必须拉取列表），保存后立即生效。</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">API URL</div><input id="moon-custom-url" type="text" value="' + escapeFeatureHtml(displayUrl) + '" placeholder="https://api.deepseek.com/v1" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;border:1px solid #74355f;background:#05070e;color:#e2e8f0;font-size:12px;"></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">API Key</div><input id="moon-custom-key" type="password" value="' + escapeFeatureHtml(cfg.key || '') + '" placeholder="sk-..." style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;border:1px solid #74355f;background:#05070e;color:#e2e8f0;font-size:12px;"></div>' +
      '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<div style="font-size:11px;color:#94a3b8;">模型（可直接输入或从下拉框选择）</div>' +
          '<button id="moon-custom-fetch" type="button" style="padding:3px 10px;border-radius:4px;border:1px solid #f472d0;background:#37102f;color:#ffe1f5;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:700;">📥 拉取模型列表</button>' +
        '</div>' +
        '<input id="moon-custom-model" type="text" value="' + escapeFeatureHtml(cfg.model || '') + '" placeholder="例如：deepseek-chat / gemini-2.5-flash / gpt-4o-mini" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;border:1px solid #74355f;background:#05070e;color:#e2e8f0;font-size:12px;">' +
        '<div id="moon-custom-model-select-box" style="display:none;margin-top:6px;">' +
          '<select id="moon-custom-model-select" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;border:1px solid #74355f;background:#05070e;color:#e2e8f0;font-size:12px;"></select>' +
        '</div>' +
        '<div id="moon-custom-model-status" style="font-size:10.5px;color:#64748b;margin-top:4px;line-height:1.5;"></div>' +
      '</div></div>';
    showModalDialogCancelable('🔑 配置 API 接口', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const rawUrl = mask.querySelector('#moon-custom-url').value.trim();
        const key = mask.querySelector('#moon-custom-key').value.trim();
        const model = mask.querySelector('#moon-custom-model').value.trim();
        if (!rawUrl || !key || !model) { toast('请填写完整 API URL、Key 和模型名称', 'warning'); return; }
        const savedObj = { rawUrl: rawUrl, url: normalizeCustomApiUrl(rawUrl), key: key, model: model };
        saveCustomAIConfig(savedObj);
        try { mask.remove(); } catch (e) {}
        toast('API 配置已保存' + (typeof onSaved === 'function' ? '，正在继续执行…' : ''), 'success');
        try { refreshPanel(); } catch (e) {}
        if (typeof onSaved === 'function') {
          setTimeout(function() { try { onSaved(savedObj); } catch (e) {} }, 120);
        }
      },
      function() {
        toast('已取消', 'info');
        if (typeof onCanceled === 'function') {
          try { onCanceled(); } catch (e) {}
        }
      },
      { confirmText: typeof onSaved === 'function' ? '保存并继续' : '保存', cancelText: '取消',
        onOpen: function(mask) {
          const fetchBtn = mask.querySelector('#moon-custom-fetch');
          const urlInput = mask.querySelector('#moon-custom-url');
          const keyInput = mask.querySelector('#moon-custom-key');
          const modelInput = mask.querySelector('#moon-custom-model');
          const selBox = mask.querySelector('#moon-custom-model-select-box');
          const sel = mask.querySelector('#moon-custom-model-select');
          const status = mask.querySelector('#moon-custom-model-status');

          function rawUrlMatchesDomainMismatch(u, m) {
            const ul = String(u || '').toLowerCase();
            const ml = String(m || '').toLowerCase();
            if (ul.indexOf('api.deepseek.com') >= 0 && ml.indexOf('deepseek') < 0) return true;
            return false;
          }

          function populateSelect(ids, noteText, noteColor) {
            const unique = Array.from(new Set(ids));
            const cur = String(modelInput.value || '').trim();
            sel.innerHTML = '<option value="">— 选择要使用的模型 —</option>' + unique.map(function(id) {
              const safeVal = String(id).replace(/"/g, '&quot;');
              const safeTxt = String(id).replace(/</g, '&lt;');
              return '<option value="' + safeVal + '"' + (id === cur ? ' selected' : '') + '>' + safeTxt + '</option>';
            }).join('');
            selBox.style.display = 'block';
            if (unique.length && (!cur || rawUrlMatchesDomainMismatch(urlInput.value, cur))) {
              modelInput.value = unique[0];
              sel.value = unique[0];
            }
            status.textContent = noteText;
            status.style.color = noteColor || '#6ee7b7';
          }

          fetchBtn.addEventListener('click', async function() {
            const rawUrl = urlInput.value.trim();
            const key = keyInput.value.trim();
            if (!rawUrl) { status.textContent = '请先填写 API URL'; status.style.color = '#f87171'; return; }
            if (!key) { status.textContent = '请先填写 API Key'; status.style.color = '#f87171'; return; }

            fetchBtn.disabled = true; fetchBtn.textContent = '⏳ 拉取中...';
            status.textContent = '正在拉取模型列表（支持酒馆后端代理与直连双通道）...';
            status.style.color = '#94a3b8';
            try {
              const res = await fetchModelsWithFallback(rawUrl, key);
              const ids = res.ids || [];
              ids.sort(function(a, b) { return a.localeCompare(b); });
              populateSelect(ids, '✔ 共拉取到 ' + ids.length + ' 个模型（' + res.via + '），已加载到下拉框', '#6ee7b7');
            } catch (e) {
              const fallbackIds = getSuggestedModelsByUrl(rawUrl);
              const errMsg = String(e && e.message || e);
              populateSelect(
                fallbackIds,
                '⚠ 远程列表拉取受限（' + errMsg + '），已为您载入该接口常用模型预设，可直接下拉选择或手动填写模型名并点击保存！',
                '#fbbf24'
              );
            } finally {
              fetchBtn.disabled = false;
              fetchBtn.textContent = '📥 拉取模型列表';
            }
          });

          sel.addEventListener('change', function() {
            if (sel.value) modelInput.value = sel.value;
          });
        }
      });
  }

  async function _callCustomAIConfigOnce(sysPrompt, userPrompt) {
    const cfg = getCustomAIConfig();
    if (!cfg.url || !cfg.key || !cfg.model) throw new Error('未配置自定义副模型');
    const doFetch = (mainWin && typeof mainWin.fetch === 'function') ? mainWin.fetch.bind(mainWin) : fetch;
    const apiUrl = normalizeCustomApiUrl(cfg.rawUrl || cfg.url);
    const baseUrl = deriveCustomBaseUrl(cfg.rawUrl || cfg.url);
    const messages = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt }
    ];
    let proxyNote = '';

    // 1. 优先尝试通过酒馆后端代理请求（避免浏览器 CORS Failed to fetch）
    try {
      const stHeaders = Object.assign({ 'Content-Type': 'application/json' }, getSTRequestHeaders());
      const proxyRes = await doFetch('/api/backends/chat-completions/generate', {
        method: 'POST',
        headers: stHeaders,
        body: JSON.stringify({
          chat_completion_source: 'custom',
          custom_url: baseUrl,
          api_key_custom: cfg.key,
          reverse_proxy: baseUrl,
          proxy_password: cfg.key,
          model: cfg.model,
          messages: messages,
          temperature: 0.3,
          stream: false
        })
      });
      if (proxyRes && proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData && proxyData.choices && proxyData.choices[0] && proxyData.choices[0].message) {
          return proxyData.choices[0].message.content;
        }
        if (proxyData && typeof proxyData.content === 'string') return proxyData.content;
      }
    } catch (e) {}

    // 2. 回退前端直连请求
    try {
      const res = await doFetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.key
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: messages,
          temperature: 0.3
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error('HTTP ' + res.status + ': ' + t.slice(0, 120));
      }
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
      throw new Error('接口返回格式异常');
    } catch (e) {
      throw new Error('请求自定义 API 失败（请检查 URL/Key/模型名是否匹配，如使用 DeepSeek 请选 deepseek-chat）：' + (e.message || e) + (proxyNote ? '｜' + proxyNote : ''));
    }
  }

  /* ── 独立 API：全局串行 + 429 退避重试 ────────────────────
     429 多半是「同一秒钟发了太多请求」或「这个模型排队太长」。
     ① 所有独立 API 调用排成一条队，一次只发一个；
     ② 命中 429 / 5xx 自动等一会儿再试，最多 3 次；
     ③ 仍然失败时给出能直接照做的人话提示。 */
  let _customAIQueue = Promise.resolve();
  let _customAIBusy = 0;
  function runInAISerial(fn) {
    const next = _customAIQueue.then(fn, fn);
    _customAIQueue = next.then(function() {}, function() {});
    return next;
  }
  function _aiSleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
  function isRateLimitError(errOrMsg) {
    const t = String((errOrMsg && errOrMsg.message) || errOrMsg || '');
    return /(^|\D)429(\D|$)|rate.?limit|too many requests|overloaded|quota|exceeded|(^|\D)(502|503|529)(\D|$)/i.test(t);
  }
  function aiRetryDelayMs(err, attempt) {
    const t = String((err && err.message) || err || '');
    const m = t.match(/(?:retry[\-\s]?after|等待|稍后)[^\d]{0,10}(\d+)/i);
    if (m) return Math.min(30000, Math.max(1000, Number(m[1]) * 1000));
    const table = [1500, 4000, 9000];
    return table[Math.min(attempt, table.length - 1)];
  }
  async function callCustomAIConfig(sysPrompt, userPrompt) {
    const maxTries = 3;
    let lastErr = null;
    for (let i = 0; i < maxTries; i++) {
      try {
        _customAIBusy++;
        try {
          return await runInAISerial(function() { return _callCustomAIConfigOnce(sysPrompt, userPrompt); });
        } finally { _customAIBusy = Math.max(0, _customAIBusy - 1); }
      } catch (e) {
        lastErr = e;
        if (!isRateLimitError(e) || i >= maxTries - 1) break;
        const wait = aiRetryDelayMs(e, i);
        try { toast('模型限流（429），' + Math.round(wait / 1000) + ' 秒后自动重试（第 ' + (i + 2) + '/' + maxTries + ' 次）', 'info'); } catch (e2) {}
        await _aiSleep(wait);
      }
    }
    if (isRateLimitError(lastErr)) {
      throw new Error('模型返回 429（请求太频繁或额度用尽）。已自动重试 ' + (maxTries - 1) + ' 次仍未成功。\n可以这样办：① 换轻量一点的模型（名字里带 Flash / mini / lite 的通常更容易排上队）；② 等 1~2 分钟再点一次；③ 把「独立 API」切回酒馆当前模型，让主模型跑这些后台任务。');
    }
    throw lastErr;
  }

  const DEFAULT_PROMPTS = {
    conflict: { label: '冲突检测', sys: '你是月相多维情感系统的「冲突检测」助手。分析给定的条目，找出变量路径重复、字段名不一致、语义重复、规则矛盾。无问题输出「未发现明显冲突」；有问题逐条列出「类型｜涉及条目｜描述｜建议」。', user: '【角色卡信息】\n{{charInfo}}\n\n【月相条目】\n{{mvuDump}}\n\n【其他世界书条目】\n{{otherDump}}' },
    mode: { label: '模式推荐', sys: '根据角色卡风格、预设、世界书，在「简单/普通/困难/地狱」里推荐一个。输出格式：推荐模式：X；理由：≤50字。', user: '【角色卡】\n{{charInfo}}\n\n【当前模式】{{currentMode}}（{{currentModeLabel}}）\n\n【四种模式说明】\n{{modeList}}\n\n【月相条目】\n{{mvuDump}}\n\n【世界书】\n{{otherDump}}' },
    custom: { label: '自定义', sys: '你是月相多维情感系统的辅助审计助手。', user: '【角色卡】\n{{charInfo}}\n\n【当前模式】{{currentMode}}\n\n【模式说明】\n{{modeList}}\n\n【月相条目】\n{{mvuDump}}\n\n【世界书】\n{{otherDump}}\n\n【我的指令】\n（在这里写）' },
    opening: { label: '开局推断', sys: '你是月相多维情感系统的「开局推断」助手。请推断角色对玩家的初始四维数值。\n【输出】严格 JSON：{"好感度":number,"肉体值":number,"嫉妒值":number,"情绪":"单个emoji","心声":"15~30字第一人称","推断理由":"≤80字"}', user: '【玩家设定】\n名字：{{playerName}}\n描述：{{playerPersona}}\n\n【角色卡】\n名称：{{charName}}\n简介：{{charDesc}}\n性格：{{charPersonality}}\n场景：{{charScenario}}\n开场白：{{charFirstMes}}\n创作者注释：{{charCreatorNotes}}\n\n【对话历史】\n{{chatHistory}}' },
    openingPass2: { label: '开局补全', sys: '你是月相多维情感系统的「开局补全」助手。玩家已确认好感度、肉体值、阶段值。请根据这些最终数值，重新评估嫉妒值、情绪、心声。\n【输出】严格 JSON：{"嫉妒值":number,"情绪":"单个emoji","心声":"15~30字第一人称"}', user: '【玩家设定】\n{{playerName}}\n描述：{{playerPersona}}\n\n【角色卡】\n名称：{{charName}}\n简介：{{charDesc}}\n\n【最终确认数值】\n好感度：{{finalE}}\n肉体值：{{finalP}}\n阶段值：{{finalR}}\n\n【对话历史】\n{{chatHistory}}' },
    backfill: { label: '对话回填', sys: '你是月相多维情感系统的「对话回填」助手。玩家有一个没有变量的老存档，请根据对话历史推断此刻角色对玩家的一整套合理状态。\n【输出】严格 JSON，字段：世界时间、世界地点、好感度、肉体值、嫉妒值、情绪、心声、重要度、表白期已通过、表白期排除、已触发时间线事件名、好感度周上限已用、推断理由。', user: '【玩家设定】\n{{playerName}}\n描述：{{playerPersona}}\n\n【角色卡】\n名称：{{charName}}\n简介：{{charDesc}}\n性格：{{charPersonality}}\n场景：{{charScenario}}\n\n{{timelineDump}}\n\n【对话历史】\n{{chatHistory}}' },
    timeline: { label: '时间线生成', sys: '你是剧情时间线规划助手。请为这张角色卡设计 6~10 个未来会发生的事件，并按时间从早到晚排列。\n【每件事都要判断类型】\n· 日常：吃饭、上学、闲聊、小摩擦、日常约会这类起伏不大的事；\n· 重大：告白、吵架分手、事故、离别、生死、主线冲突这类会改变关系或世界观的事。\n先在心里按上面的标准判断，再写进 type 字段。\n【输出】严格 JSON 数组，只输出 JSON，不要解释、不要 markdown：\n[{"name":"一句话事件名","time":"YYYY年MM月DD日 · 星期X · HH:MM","type":"日常","desc":"≤30字补充"}]\n时间必须单调递增，且不早于今天。', user: '【角色卡】\n{{charInfo}}\n\n【剧情大纲】\n{{userInput}}' },
    placeholders: '{{charInfo}} {{charName}} {{charDesc}} {{charPersonality}} {{charScenario}} {{charFirstMes}} {{charCreatorNotes}} {{currentMode}} {{currentModeLabel}} {{modeList}} {{mvuDump}} {{otherDump}} {{promptDump}} {{playerName}} {{playerPersona}} {{finalE}} {{finalP}} {{finalR}} {{finalRName}} {{finalRDesc}} {{chatHistory}} {{userInput}} {{timelineDump}}'
  };

