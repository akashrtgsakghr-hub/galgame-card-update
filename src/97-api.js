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

  /* ── 独立 API：发得出去，也看得懂为什么失败 ─────────────
     这一段照 st-theater 的请求层思路重写：
     ① 先把 HTTP 状态、Retry-After、HTML 报错页、思考标签翻译成
        「人照着能做」的结论，再决定要不要重试；
     ② 429 只在服务端要求的等待够短时才自动等，等太久就让玩家歇会儿；
     ③ 认证 / 模型名 / 内容审核这类错重试一百次也没用，直接给结论；
     ④ 每次请求记一行摘要（通道、域名、耗时、状态），出问题能回看。 */
  const AI_REQUEST_TIMEOUT_MS = 180000;
  const AI_MAX_AUTO_WAIT_MS = 15000;
  const AI_RECENT_LIMIT = 12;
  const _aiRecent = [];
  let _aiRecentSeq = 0;

  function getAiRecentRequests() {
    return _aiRecent.map(function(x) { return Object.assign({}, x); });
  }
  function _aiHost(url) {
    try { return new URL(String(url)).host; } catch (e) { return String(url || '').slice(0, 40); }
  }
  function _recordAiRequest(entry) {
    try {
      _aiRecent.push(Object.assign({ id: ++_aiRecentSeq, at: Date.now() }, entry || {}));
      while (_aiRecent.length > AI_RECENT_LIMIT) _aiRecent.shift();
    } catch (e) {}
  }

  function _aiError(code, message, opts) {
    const err = new Error(message);
    err.aiCode = code;
    opts = opts || {};
    err.aiRetryable = !!opts.retryable;
    err.aiFatal = !!opts.fatal;
    err.aiWaitMs = Number(opts.waitMs) || 0;
    err.aiDetail = String(opts.detail || '');
    if (opts.status) err.aiStatus = Number(opts.status);
    return err;
  }

  // 端点推导：地址可能填的是「域名」「带 /v1 的基址」「完整端点」三种之一，
  // Anthropic 原生协议的路径与鉴权头都和 OpenAI 不同，这里一并认出来。
  function aiEndpointFor(rawUrl) {
    const raw = String(rawUrl || '').trim().replace(/[\u3000\s]+/g, '').replace(/\/+$/, '');
    const base = raw ? deriveCustomBaseUrl(raw) : '';
    if (!raw) return { endpoint: '', baseUrl: '', protocol: 'openai' };
    const anthropic = /\/messages$/i.test(raw) || /anthropic|claude\.ai/i.test(raw);
    if (anthropic) {
      if (/\/messages$/i.test(raw)) return { endpoint: raw, baseUrl: base, protocol: 'anthropic' };
      if (/\/v\d+(?:beta\d*)?$/i.test(raw)) return { endpoint: raw + '/messages', baseUrl: base, protocol: 'anthropic' };
      if (/\/v\d+(?:beta\d*)?$/i.test(base)) return { endpoint: base + '/messages', baseUrl: base, protocol: 'anthropic' };
      return { endpoint: base + '/v1/messages', baseUrl: base, protocol: 'anthropic' };
    }
    return { endpoint: normalizeCustomApiUrl(raw), baseUrl: base, protocol: 'openai' };
  }

  function isHtmlPayload(contentType, text) {
    const type = String(contentType || '').toLowerCase();
    if (type.indexOf('text/html') >= 0 || type.indexOf('xhtml') >= 0) return true;
    return /^\s*(?:<!doctype\s+html\b|<html[\s>])/i.test(String(text || ''));
  }

  function parseRetryAfterHeader(value, now) {
    const text = String(value === null || value === undefined ? '' : value).trim();
    if (!text) return null;
    if (/^\d+(?:\.\d+)?$/.test(text)) return Math.max(0, Math.ceil(Number(text) * 1000));
    const stamp = Date.parse(text);
    if (!isFinite(stamp)) return null;
    return Math.max(0, stamp - Number(now || Date.now()));
  }

  // 思考模型（Gemini 2.5 / DeepSeek-R1 之类）会把推理过程也塞进正文，
  // 直接 JSON.parse 必然失败，所以统一在请求层剥掉再交出去。
  function stripReasoningTags(text) {
    let src = String(text === null || text === undefined ? '' : text);
    let had = false;
    src = src.replace(/<think(?:ing)?\s*>[\s\S]*?<\/think(?:ing)?\s*>/gi, function() { had = true; return ''; });
    src = src.replace(/<think(?:ing)?\s*>[\s\S]*$/i, function() { had = true; return ''; });
    src = src.replace(/<\/think(?:ing)?\s*>/gi, '');
    return { content: src.replace(/^\s+|\s+$/g, ''), hadReasoning: had };
  }

  function _aiPartText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      let out = '';
      for (let i = 0; i < value.length; i++) out += _aiPartText(value[i]);
      return out;
    }
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text;
      if (typeof value.content === 'string') return value.content;
      if (typeof value.output_text === 'string') return value.output_text;
    }
    return '';
  }

  // OpenAI / Anthropic / Gemini / Responses 四种返回形状，统一取正文
  function _aiPickText(json, protocol) {
    if (!json || typeof json !== 'object') return '';
    if (Array.isArray(json.choices) && json.choices.length) {
      const c = json.choices[0] || {};
      return _aiPartText(c.message && c.message.content)
        || _aiPartText(c.delta && c.delta.content)
        || (typeof c.text === 'string' ? c.text : '');
    }
    if (json.delta && typeof json.delta.text === 'string') return json.delta.text;
    if (Array.isArray(json.content)) {
      let out = '';
      for (let i = 0; i < json.content.length; i++) {
        const block = json.content[i];
        if (!block) continue;
        if (block.type && block.type !== 'text') continue;
        out += _aiPartText(block.text || block);
      }
      return out;
    }
    if (typeof json.content === 'string') return json.content;
    if (typeof json.output_text === 'string') return json.output_text;
    if (Array.isArray(json.candidates)) {
      let out = '';
      for (let i = 0; i < json.candidates.length; i++) {
        const parts = (json.candidates[i] && json.candidates[i].content && json.candidates[i].content.parts) || [];
        for (let j = 0; j < parts.length; j++) {
          if (parts[j] && parts[j].thought === true) continue;
          out += _aiPartText(parts[j]);
        }
      }
      return out;
    }
    if (Array.isArray(json.output)) {
      let out = '';
      for (let i = 0; i < json.output.length; i++) {
        const item = json.output[i];
        if (item && /reasoning|thought/i.test(String(item.type || ''))) continue;
        out += _aiPartText(item && item.content !== undefined ? item.content : item);
      }
      return out;
    }
    if (typeof json.text === 'string') return json.text;
    if (typeof json.response === 'string') return json.response;
    return '';
  }

  function _aiJoinSse(raw, protocol) {
    const lines = String(raw || '').split(/\r?\n/);
    let out = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.indexOf('data:') !== 0) continue;
      const payload = line.slice(5).replace(/^\s+/, '');
      if (!payload || payload === '[DONE]') continue;
      try { out += _aiPickText(JSON.parse(payload), protocol); } catch (e) {}
    }
    if (!out) throw _aiError('empty', '接口用流式格式返回，但里面没有正文。', { retryable: true });
    return out;
  }

  // 错误体里往往是一整段 JSON，只抽那句人能看的
  function _aiBodyMessage(bodyText) {
    const raw = String(bodyText === null || bodyText === undefined ? '' : bodyText).trim();
    if (!raw) return '';
    if (/^\s*</.test(raw)) return '';
    try {
      const json = JSON.parse(raw);
      const error = json && json.error;
      if (typeof error === 'string') return error.slice(0, 300);
      if (error && typeof error === 'object') return String(error.message || error.type || error.code || '').slice(0, 300);
      if (json && typeof json.message === 'string') return json.message.slice(0, 300);
      if (json && typeof json.detail === 'string') return json.detail.slice(0, 300);
      return '';
    } catch (e) {}
    return raw.slice(0, 300);
  }

  // 原文照抄有时是唯一线索（比如到底超了哪个上限），但只带一小段
  function _aiDetailSuffix(detail) {
    const text = String(detail || '').trim();
    return text ? ('（接口原话：' + text.slice(0, 120) + '）') : '';
  }

  function classifyAiFailure(status, bodyText, extra) {
    extra = extra || {};
    const code = Number(status) || 0;
    const detail = _aiBodyMessage(bodyText);
    const lower = String(detail || '').toLowerCase();
    const waitMs = Number(extra.waitMs) || 0;

    // 额度用完和「这一秒太挤」是两件事：前者等到明天也不会有
    if (code !== 429 && /insufficient[\s_-]*quota|exceeded your current quota|quota[\s_-]*(exhausted|exceeded)|billing|余额不足|欠费|额度(用尽|不足)|配额(用尽|不足)/.test(lower)) {
      return _aiError('quota', '这个 Key 的额度用完了或欠费了（HTTP ' + (code || '?') + '）。' + _aiDetailSuffix(detail),
        { fatal: true, status: code, detail: detail });
    }
    if (code === 429 || /(^|[^0-9])429([^0-9]|$)|rate[\s_-]*limit|too many requests|resource exhausted|quota (exceeded|exhausted)|请求过于频繁|限流/.test(lower)) {
      const waitText = waitMs > 0 ? ('接口要求等 ' + Math.ceil(waitMs / 1000) + ' 秒。') : '';
      return _aiError('rate_limit', '接口限流（429）：同一时间请求太多，或这个模型的额度排满了。' + waitText + _aiDetailSuffix(detail),
        { retryable: true, fatal: true, waitMs: waitMs, status: code, detail: detail });
    }
    if (code === 401 || code === 403 || /invalid api key|incorrect api key|unauthorized|authentication|api[_\s-]?key[_\s-]?(invalid|missing)/.test(lower)) {
      return _aiError('auth', 'Key 不对或没有权限（HTTP ' + (code || '?') + '）。检查 Key 有没有复制完整、是不是这个接口的。',
        { fatal: true, status: code, detail: detail });
    }
    if (code === 404 || /model[_\s-]*(not found|does not exist|not exist)|no such model|unknown model|模型(不存在|未找到)/.test(lower)) {
      return _aiError('model', '接口找不到这个模型（HTTP ' + (code || '?') + '）。模型名要和控制台里一模一样，比如 deepseek-chat、gemini-2.5-flash。',
        { fatal: true, status: code, detail: detail });
    }
    if (/content[\s_-]*(filter|policy)|\bsafety\b|prohibited|blocked|审核|违规/.test(lower)) {
      return _aiError('content', '被上游内容审核拦下了（HTTP ' + (code || '?') + '）。这不是脚本的问题，换一段上下文或换线路再试。',
        { fatal: true, status: code, detail: detail });
    }
    if (/context[_\s-]*(length|window)|maximum context|too many tokens|reduce the length|超出.{0,6}(长度|上限)|上下文/.test(lower)) {
      return _aiError('token', '内容太长，超出了模型上限（HTTP ' + (code || '?') + '）。',
        { fatal: true, status: code, detail: detail });
    }
    if (code >= 500) {
      return _aiError('server', '接口那边出错了（HTTP ' + code + '），多半是中转站或上游临时故障。',
        { retryable: true, status: code, detail: detail });
    }
    if (code === 400 || code === 422) {
      return _aiError('bad_request', '接口不接受这个请求（HTTP ' + code + '）。' + (detail ? '它说：' + detail : '常见原因是模型名、地址格式或参数不对。'),
        { status: code, detail: detail });
    }
    return _aiError('http', '接口返回 HTTP ' + (code || '?') + (detail ? '：' + detail : ''),
      { status: code, detail: detail });
  }

  async function _aiFetch(url, init, timeoutMs) {
    const doFetch = (mainWin && typeof mainWin.fetch === 'function') ? mainWin.fetch.bind(mainWin) : fetch;
    const ms = Math.max(1000, Number(timeoutMs) || AI_REQUEST_TIMEOUT_MS);
    const opts = Object.assign({}, init || {});
    let timer = null;
    if (typeof AbortController === 'function') {
      try {
        const ctrl = new AbortController();
        opts.signal = ctrl.signal;
        timer = setTimeout(function() { try { ctrl.abort(); } catch (e) {} }, ms);
      } catch (e) {}
    }
    try {
      return await doFetch(url, opts);
    } catch (e) {
      const msg = String((e && e.message) || e);
      const aborted = (e && e.name === 'AbortError') || /abort/i.test(msg);
      if (aborted) {
        throw _aiError('timeout', '等了 ' + Math.round(ms / 1000) + ' 秒，接口一直没回应。可能是模型排队太长，或线路卡住了。',
          { retryable: true, detail: msg });
      }
      throw _aiError('network', '连不上这个地址（' + msg + '）。检查 URL 有没有写错、需不需要挂代理；也可能是中转站不允许浏览器直接访问。',
        { retryable: true, detail: msg });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function _aiReadResponse(res, protocol) {
    const ct = String((res && res.headers && typeof res.headers.get === 'function' && res.headers.get('content-type')) || '');
    let raw = '';
    try { raw = await res.text(); }
    catch (e) { throw _aiError('network', '连接中断，响应读到一半就断了。', { retryable: true }); }
    const status = Number(res && res.status) || 0;
    if (!res || !res.ok) {
      const header = (res && res.headers && typeof res.headers.get === 'function') ? res.headers.get('retry-after') : '';
      if (isHtmlPayload(ct, raw)) {
        throw _aiError('html', '接口返回的是网页（HTTP ' + status + '），多半是中转站或网关的报错页。检查地址有没有填成网页，或稍后再试。',
          { retryable: true, status: status });
      }
      const classified = classifyAiFailure(status, raw, { waitMs: parseRetryAfterHeader(header) });
      classified.aiStatus = status;
      throw classified;
    }
    if (isHtmlPayload(ct, raw)) {
      throw _aiError('html', '接口返回的是网页而不是数据，多半是地址填错了，或中转站把错误页当成了正文。', { retryable: true, status: 200 });
    }
    return _aiExtractText(raw, protocol);
  }

  function _aiFinalize(text) {
    const parsed = stripReasoningTags(text);
    if (parsed.content) return parsed.content;
    if (parsed.hadReasoning) {
      throw _aiError('empty', '模型只写了思考过程，没写正文。可以让它「先给结论再解释」，或换一个不默认长思考的模型。', { retryable: true });
    }
    throw _aiError('empty', '接口没有返回正文。', { retryable: true });
  }

  function _aiExtractText(raw, protocol) {
    const text = String(raw === null || raw === undefined ? '' : raw).trim();
    if (!text) throw _aiError('empty', '接口返回了空内容（可能被上游拦了，也可能模型没开口）。', { retryable: true });
    if (/^(?:data|event):/.test(text)) return _aiFinalize(_aiJoinSse(text, protocol));
    let json = null;
    try { json = JSON.parse(text); } catch (e) {}
    if (!json || typeof json !== 'object') return _aiFinalize(text);
    if (json.error) {
      const detail = _aiBodyMessage(text);
      const classified = classifyAiFailure(0, text, {});
      if (classified.aiCode === 'http') {
        throw _aiError('http', '接口返回错误：' + (detail || '没有说明原因'), { detail: detail });
      }
      throw classified;
    }
    const picked = _aiPickText(json, protocol);
    return _aiFinalize(picked);
  }

  // ① 酒馆后端代发：绕开浏览器跨域，移动端 iframe 也不会被拦
  async function _aiViaProxy(cfg, target, messages) {
    const started = Date.now();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, getSTRequestHeaders());
    const body = {
      chat_completion_source: 'custom',
      custom_url: target.baseUrl,
      api_key_custom: cfg.key,
      reverse_proxy: target.baseUrl,
      proxy_password: cfg.key,
      model: cfg.model,
      messages: messages,
      temperature: 0.3,
      stream: false
    };
    const tag = { via: '酒馆代理', host: _aiHost(target.endpoint), model: cfg.model };
    try {
      const res = await _aiFetch('/api/backends/chat-completions/generate', { method: 'POST', headers: headers, body: JSON.stringify(body) }, AI_REQUEST_TIMEOUT_MS);
      const text = await _aiReadResponse(res, 'openai');
      _recordAiRequest(Object.assign({}, tag, { status: Number(res && res.status) || 200, code: 'ok', ms: Date.now() - started }));
      return text;
    } catch (e) {
      _recordAiRequest(Object.assign({}, tag, { status: Number(e && e.aiStatus) || 0, code: (e && e.aiCode) || 'error', ms: Date.now() - started }));
      throw e;
    }
  }

  // ② 直连：代理线路不认（或本身就是 Anthropic 协议）时走这条
  async function _aiViaDirect(cfg, target, messages) {
    const started = Date.now();
    const anthropic = target.protocol === 'anthropic';
    const headers = { 'Content-Type': 'application/json' };
    let body;
    if (anthropic) {
      headers['x-api-key'] = cfg.key;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
      body = {
        model: cfg.model,
        max_tokens: 4096,
        system: String((messages[0] && messages[0].content) || ''),
        messages: [{ role: 'user', content: String((messages[1] && messages[1].content) || '') }]
      };
    } else {
      headers['Authorization'] = 'Bearer ' + cfg.key;
      body = { model: cfg.model, messages: messages, temperature: 0.3, stream: false };
    }
    const tag = { via: '直连', host: _aiHost(target.endpoint), model: cfg.model };
    try {
      const res = await _aiFetch(target.endpoint, { method: 'POST', headers: headers, body: JSON.stringify(body) }, AI_REQUEST_TIMEOUT_MS);
      const text = await _aiReadResponse(res, anthropic ? 'anthropic' : 'openai');
      _recordAiRequest(Object.assign({}, tag, { status: Number(res && res.status) || 200, code: 'ok', ms: Date.now() - started }));
      return text;
    } catch (e) {
      _recordAiRequest(Object.assign({}, tag, { status: Number(e && e.aiStatus) || 0, code: (e && e.aiCode) || 'error', ms: Date.now() - started }));
      throw e;
    }
  }

  async function _callCustomAIConfigOnce(sysPrompt, userPrompt) {
    const cfg = getCustomAIConfig();
    if (!cfg.url || !cfg.key || !cfg.model) {
      throw _aiError('config', '还没填独立 API 的 URL / Key / 模型名。', { fatal: true });
    }
    const target = aiEndpointFor(cfg.rawUrl || cfg.url);
    const messages = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt }
    ];
    let firstErr = null;
    if (target.protocol === 'openai') {
      try {
        return await _aiViaProxy(cfg, target, messages);
      } catch (e) {
        // 限流 / 认证 / 模型名 / 审核：换条路也还是一样，不用白跑一趟
        if (e && e.aiFatal) throw e;
        firstErr = e;
      }
    }
    try {
      return await _aiViaDirect(cfg, target, messages);
    } catch (e) {
      const second = e || _aiError('unknown', '调用接口失败。');
      if (firstErr && firstErr.aiCode && firstErr.aiCode !== second.aiCode) {
        second.message += '\n（酒馆代理那条路也不通：' + String(firstErr.message).split('\n')[0] + '）';
      }
      throw second;
    }
  }

  /* ── 独立 API：全局串行 + 限流退避 ────────────────────────
     429 多半是「同一秒钟发了太多请求」或「这个模型排队太长」。
     ① 所有独立 API 调用排成一条队，一次只发一个；
     ② 只有服务端说「等几秒」时才自动等，要求等超过 15 秒就交给玩家；
     ③ 认证、模型名、审核这类错不重试，直接把结论说清楚。 */
  let _customAIQueue = Promise.resolve();
  let _customAIBusy = 0;
  function runInAISerial(fn) {
    const next = _customAIQueue.then(fn, fn);
    _customAIQueue = next.then(function() {}, function() {});
    return next;
  }
  function _aiSleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
  function isRateLimitError(errOrMsg) {
    if (errOrMsg && errOrMsg.aiCode) return errOrMsg.aiCode === 'rate_limit';
    const t = String((errOrMsg && errOrMsg.message) || errOrMsg || '');
    return /(^|\D)429(\D|$)|rate.?limit|too many requests|overloaded|quota|exceeded|(^|\D)(502|503|529)(\D|$)/i.test(t);
  }
  function aiRetryDelayMs(err, attempt) {
    const asked = Number(err && err.aiWaitMs) || 0;
    if (asked > 0) return Math.min(30000, Math.max(1000, asked));
    const t = String((err && err.message) || err || '');
    const m = t.match(/(?:retry[\-\s]?after|等待|稍后)[^\d]{0,10}(\d+)/i);
    if (m) return Math.min(30000, Math.max(1000, Number(m[1]) * 1000));
    const table = [1500, 4000, 9000];
    return table[Math.min(attempt, table.length - 1)];
  }
  // 返回 null = 这次不自动等（服务端要等太久，干耗没意义）
  function _aiWaitFor(err, attempt) {
    const asked = Number(err && err.aiWaitMs) || 0;
    if (asked > AI_MAX_AUTO_WAIT_MS) return null;
    if (asked > 0) return Math.max(1000, asked);
    return aiRetryDelayMs(err, attempt);
  }
  function _aiFriendly(err, tried) {
    const e = err || _aiError('unknown', '调用接口失败，原因不明。');
    const code = e.aiCode || '';
    if (code === 'rate_limit') {
      return _aiError('rate_limit',
        e.message + '\n已经试了 ' + Math.max(1, tried) + ' 次。还能这样办：① 换轻量一点的模型（名字里带 Flash / mini / lite 的通常更容易排上队）；② 等 1~2 分钟再点一次；③ 把「独立 API」切回酒馆当前模型，让主模型跑这些后台任务。',
        { detail: e.aiDetail });
    }
    if (code === 'quota') {
      return _aiError('quota', e.message + '\n换一个有额度的 Key，或到服务商控制台充值后再试。', { detail: e.aiDetail });
    }
    if (code === 'auth' || code === 'model' || code === 'config') {
      return _aiError(code, e.message + '\n改完地址 / Key / 模型名不用重开面板，直接再点一次就行。', { detail: e.aiDetail });
    }
    return e;
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
        const retryable = !!(e && (e.aiRetryable || isRateLimitError(e)));
        if (!retryable || i >= maxTries - 1) break;
        const wait = _aiWaitFor(e, i);
        if (wait === null) break;
        const label = (e && e.aiCode === 'rate_limit') ? '429 限流' : ((e && e.aiCode) || '暂时失败');
        try { toast('接口暂时不通（' + label + '），' + Math.round(wait / 1000) + ' 秒后自动再试（第 ' + (i + 2) + '/' + maxTries + ' 次）', 'info'); } catch (e2) {}
        await _aiSleep(wait);
      }
    }
    throw _aiFriendly(lastErr, maxTries);
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

