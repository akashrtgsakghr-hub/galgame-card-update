  function renderEventStatusCard() {
    const data = readMvuLatest();
    if (!data || !data.stat_data) return '<div class="mp-lcd-empty">（暂无变量数据）</div>';
    const chars = data.stat_data.角色 || {};
    const world = data.stat_data.世界 || {};
    const internalDays = Number(world._内部流逝天数) || 0;
    const gameDay = (world._游戏日 === undefined) ? Math.floor(internalDays) : Math.floor(Number(world._游戏日) || 0);
    const turnNo = Math.floor(Number(world._回合) || 0);
    const names = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (names.length === 0) return '<div class="mp-lcd-empty">（暂无角色事件记录）</div>';
    let html = '<div class="mp-lcd-event-meta">游戏日 <b>' + gameDay + '</b> · 第 <b>' + turnNo + '</b> 回合 · <span style="opacity:.75">' + lcdEscape(String(world.时间 || '未记录').replace(/^(\d{4})年/, '$1·')) + '</span></div>';
    names.forEach(function(name) {
      const ch = chars[name] || {};
      const q = ch._quota || {};
      const es = q._eventState || null;
      html += '<div class="mp-lcd-event-entry"><b>' + lcdEscape(name) + '</b>';
      const days = Number(es && es._距离主线天数);
      if (!isNaN(days) && isFinite(days)) {
        if (days <= 0) html += '<div>▣ 主线已触发</div>';
        else html += '<div>▣ 主线倒计时：约 ' + Math.floor(days) + ' 天</div>';
      }
      if (!es) html += '<div>· 状态未初始化</div>';
      else {
        const cur = String(es.当前事件 || '').trim();
        const type = String(es.事件类型 || '').trim();
        const remain = Number(es.剩余回合) || 0;
        const cd = Number(es.冷却回合) || 0;
        if (cur && remain > 0) html += '<div>事件：' + lcdEscape(cur) + (type ? '（' + lcdEscape(type) + '）' : '') + ' · 剩 ' + remain + ' 回合</div>';
        else if (cd > 0) html += '<div>冷却中 · 剩 ' + cd + ' 回合</div>';
        else html += '<div>待触发新事件</div>';
      }
      html += '</div>';
    });
    return html;
  }

  function lcdEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function renderPixelMoonIcon(mode) {
    const key = LUNAR_META[mode] ? mode : 'easy';
    const patterns = {
      easy: ['..SSS..', '.SLLLS.', 'SLLLLLS', 'SLLLLLS', 'SLLLLLS', '.SLLLS.', '..SSS..'],
      normal: ['..SSS..', '.SLLLS.', 'SLLLSSS', 'SLLLSSS', 'SLLLSSS', '.SLLLS.', '..SSS..'],
      hard: ['..SSS..', '.SLLSS.', 'SLLSSS.', 'SLLSSS.', 'SLLSSS.', '.SLLSS.', '..SSS..'],
      hell: ['..LLL..', '.LSSSL.', 'LSSSSSL', 'LSSSSSL', 'LSSSSSL', '.LSSSL.', '..LLL..']
    }[key];
    const title = LUNAR_META[key].title;
    const cells = patterns.join('').split('').map(function(cell) {
      return '<i class="' + (cell === 'L' ? 'lit' : cell === 'S' ? 'shadow' : '') + '"></i>';
    }).join('');
    return '<span class="mp-moon-pixel" role="img" aria-label="' + lcdEscape(title) + '像素月相" title="' + lcdEscape(title) + '">' + cells + '</span>';
  }

  function renderLcdMood(emotion) {
    const e = String(emotion || '😐');
    let kind = 'neutral';
    if (/[😊😄😁🙂🥰😍❤️💕💖😘]/.test(e)) kind = 'happy';
    else if (/[😢😭😞☹️🥺]/.test(e)) kind = 'sad';
    else if (/[😠😡🤬💢]/.test(e)) kind = 'angry';
    else if (/[😳☺️😶‍🌫️]/.test(e)) kind = 'shy';
    const pixels = {
      neutral: ['.....', '.###.', '#...#', '#.#.#', '.....', '.#.#.', '..#..'],
      happy: ['.....', '.###.', '#...#', '#...#', '#.#.#', '#...#', '.###.'],
      sad: ['.....', '.###.', '#...#', '#...#', '#.#.#', '.#.#.', '..#..'],
      angry: ['#...#', '.###.', '#...#', '.#.#.', '#...#', '.###.', '.....'],
      shy: ['.....', '.###.', '#...#', '#.#.#', '#...#', '.###.', '..#..']
    }[kind];
    return '<span class="mp-lcd-pixel-face" role="img" aria-label="心情 ' + lcdEscape(e) + '" title="心情：' + lcdEscape(e) + '">' + pixels.join('').replace(/./g, function(px) { return '<i class="' + (px === '#' ? 'on' : '') + '"></i>'; }) + '</span>';
  }

  function renderLcdCharacterDetails(ch) {
    if (!ch) return '<div class="mp-lcd-empty">NO CHARACTER DATA<br>建立角色档案后显示角色状态</div>';
    const imp = String(ch.重要度 || '主要');
    const impColor = imp === '主要' ? '#f472d0' : (imp === '次要' ? '#7dd3fc' : '#94a3b8');
    return '<div class="mp-lcd-character-data"><div class="mp-lcd-stats">' +
      '<span>好感 <b>' + lcdEscape(ch.好感度 ?? 0) + '</b></span><span>肉体 <b>' + lcdEscape(ch.肉体值 ?? 0) + '</b></span>' +
      '<span>阶段 <b>' + lcdEscape(ch.阶段值 ?? 0) + '</b></span><span>嫉妒 <b>' + lcdEscape(ch.嫉妒值 ?? 0) + '</b></span></div>' +
      '<div class="mp-lcd-mood-row" style="gap:8px;flex-wrap:wrap;"><span style="color:' + impColor + ';font-weight:700;">' + lcdEscape(imp) + '</span>' +
      '<span style="color:' + (ch.在场 === false ? '#94a3b8' : '#6ee7b7') + ';">' + (ch.在场 === false ? '不在场' : '在场') + '</span></div>' +
      '<div class="mp-lcd-mood-row">' + renderLcdMood(ch.情绪) + '<span>心情 / ' + lcdEscape(ch.情绪 || '😐') + '</span></div>' +
      '<div class="mp-lcd-voice"><small>INNER VOICE · 心声</small><div>' + lcdEscape(ch.心声 || '暂无心声记录') + '</div></div></div>';
  }

  /* =========================================================
   * 回忆档案、成就与周目结算
   * ========================================================= */
  let _galleryImageDbPromise = null;
  let _galleryPreviewObjectUrl = '';

  function escapeFeatureHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function featureFallbackKey(key) { return getChatStateKey() + '__' + key; }
  function readChatFeatureValue(key, fallback) {
    try {
      const raw = mainWin.localStorage.getItem(featureFallbackKey(key));
      if (raw != null) return JSON.parse(raw);
    } catch (e) {}
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && Object.prototype.hasOwnProperty.call(ctx.chatMetadata, key)) return ctx.chatMetadata[key];
    } catch (e) {}
    return fallback;
  }
  function writeChatFeatureValue(key, value) {
    let saved = false;
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) {
        ctx.chatMetadata[key] = value;
        saved = true;
        if (typeof ctx.saveMetadata === 'function') {
          const result = ctx.saveMetadata();
          if (result && typeof result.catch === 'function') result.catch(function() {});
        }
      }
    } catch (e) {}
    try { mainWin.localStorage.setItem(featureFallbackKey(key), JSON.stringify(value)); saved = true; } catch (e) {}
    return saved;
  }
  function getGalleryList() {
    const value = readChatFeatureValue(GALLERY_STORAGE_KEY, []);
    return Array.isArray(value) ? value.filter(function(item) { return item && typeof item === 'object' && item.id; }) : [];
  }
  function saveGalleryList(list) {
    const current = getGalleryList();
    const next = Array.isArray(list) ? list.slice(0, 100) : [];
    const keep = new Set(next.map(function(item) { return item && item.id; }));
    current.forEach(function(item) { if (!keep.has(item.id) && item.imageKey) deleteGalleryImage(item); });
    return writeChatFeatureValue(GALLERY_STORAGE_KEY, next);
  }
  function getEndingArchive() {
    const value = readChatFeatureValue(ENDING_STORAGE_KEY, null);
    if (!value || typeof value !== 'object') return { records: [], prompted: {} };
    return { records: Array.isArray(value.records) ? value.records : [], prompted: value.prompted && typeof value.prompted === 'object' ? value.prompted : {} };
  }
  function saveEndingArchive(value) {
    value.records = (Array.isArray(value.records) ? value.records : []).slice(0, 80);
    return writeChatFeatureValue(ENDING_STORAGE_KEY, value);
  }
  function newFeatureId(prefix) { return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000000); }
  function getGalleryImageKey(id) { return getChatStateKey() + '::' + String(id || ''); }
  function openGalleryImageDb() {
    if (_galleryImageDbPromise) return _galleryImageDbPromise;
    const idb = mainWin.indexedDB;
    if (!idb) return Promise.resolve(null);
    _galleryImageDbPromise = new Promise(function(resolve) {
      let request;
      try { request = idb.open(GALLERY_DB_NAME, 1); } catch (e) { resolve(null); return; }
      request.onupgradeneeded = function() {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'key' });
      };
      request.onsuccess = function() { resolve(request.result); };
      request.onerror = function() { _galleryImageDbPromise = null; resolve(null); };
      request.onblocked = function() { _galleryImageDbPromise = null; resolve(null); };
    });
    return _galleryImageDbPromise;
  }
  function galleryImageTransaction(mode, action) {
    return openGalleryImageDb().then(function(db) {
      if (!db) throw new Error('浏览器不支持本地图片归档');
      return new Promise(function(resolve, reject) {
        let tx;
        try { tx = db.transaction('images', mode); } catch (e) { reject(e); return; }
        const store = tx.objectStore('images');
        let result;
        try { result = action(store); } catch (e) { reject(e); return; }
        tx.oncomplete = function() { resolve(result && result.result); };
        tx.onerror = function() { reject(tx.error || new Error('图片归档失败')); };
        tx.onabort = function() { reject(tx.error || new Error('图片归档中断')); };
        if (result && result.onerror) result.onerror = function() { reject(result.error || new Error('图片数据读取失败')); };
      });
    });
  }
  async function persistGalleryImage(id, imageUrl) {
    const url = String(imageUrl || '');
    if (!/^https?:\/\//i.test(url) && !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(url) && !/^blob:/i.test(url)) throw new Error('图片地址格式无效');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('图片下载失败');
      const blob = await response.blob();
      if (!blob || !blob.size || blob.size > 15 * 1024 * 1024) throw new Error('图片为空或超过 15 MB');
      const key = getGalleryImageKey(id);
      await galleryImageTransaction('readwrite', function(store) { return store.put({ key: key, blob: blob, savedAt: Date.now() }); });
      return { imageKey: key, imageUrl: '' };
    } catch (e) {
      if (/^https?:\/\//i.test(url)) return { imageKey: '', imageUrl: url };
      throw new Error('本机图片归档失败：' + (e && e.message || e));
    }
  }
  async function loadGalleryImage(item) {
    if (!item) return '';
    if (item.imageKey) {
      try {
        const record = await galleryImageTransaction('readonly', function(store) { return store.get(item.imageKey); });
        if (record && record.blob) return (mainWin.URL || URL).createObjectURL(record.blob);
      } catch (e) {}
    }
    return /^https?:\/\//i.test(String(item.imageUrl || '')) ? item.imageUrl : '';
  }
  async function deleteGalleryImage(item) {
    if (!item || !item.imageKey) return;
    try { await galleryImageTransaction('readwrite', function(store) { return store.delete(item.imageKey); }); } catch (e) {}
  }
  async function cleanExpiredGalleryImages() {
    const days = Math.max(0, Number(getSettings().galleryRetentionDays) || 0);
    if (!days) return;
    const now = Date.now(), list = getGalleryList();
    let changed = false;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.createdAt && now - Number(item.createdAt) > days * 86400000 && (item.imageKey || item.imageUrl)) {
        await deleteGalleryImage(item);
        item.imageKey = ''; item.imageUrl = ''; item.isExpired = true; changed = true;
      }
    }
    if (changed) saveGalleryList(list);
  }
  const IMAGE_PROVIDER_META = {
    pollinations: { name: 'Pollinations（免 Key）', defaultUrl: 'https://image.pollinations.ai', defaultModel: 'flux', needsKey: false },
    novelai: { name: 'NovelAI', defaultUrl: 'https://image.novelai.net/ai/generate-image', defaultModel: 'nai-diffusion-3', needsKey: true },
    sdwebui: { name: 'Stable Diffusion WebUI', defaultUrl: 'http://127.0.0.1:7860', defaultModel: '', needsKey: false },
    openai: { name: 'OpenAI 兼容图像接口', defaultUrl: 'https://api.openai.com/v1/images/generations', defaultModel: 'dall-e-3', needsKey: true },
    midjourney: { name: 'Midjourney Proxy', defaultUrl: '', defaultModel: 'mj-v6', needsKey: false }
  };

  function getImageGenConfig() {
    const defaultNeg = 'lowres, bad anatomy, bad hands, text, worst quality, low quality, jpeg artifacts, watermark, blurry, vertical orientation, portrait orientation';
    const defaultChannels = {
      pollinations: { apiUrl: 'https://image.pollinations.ai', apiKey: '', model: 'flux' },
      novelai: { apiUrl: 'https://image.novelai.net/ai/generate-image', apiKey: '', model: 'nai-diffusion-3' },
      sdwebui: { apiUrl: 'http://127.0.0.1:7860', apiKey: '', model: '' },
      openai: { apiUrl: 'https://api.openai.com/v1/images/generations', apiKey: '', model: 'dall-e-3' },
      midjourney: { apiUrl: '', apiKey: '', model: 'mj-v6' }
    };
    let raw = {};
    try {
      const ls = getStorage();
      raw = JSON.parse((ls && ls.getItem(IMAGE_CONFIG_KEY)) || '{}') || {};
    } catch (e) { raw = {}; }
    const channels = {};
    Object.keys(defaultChannels).forEach(function(k) {
      channels[k] = Object.assign({}, defaultChannels[k], (raw.channels && raw.channels[k]) || {});
    });
    // 兼容迁移旧版单渠道字段
    const legacyProv = raw.imageProvider || 'pollinations';
    if (channels[legacyProv]) {
      if (raw.imageApiUrl && ! (raw.channels && raw.channels[legacyProv] && raw.channels[legacyProv].apiUrl)) channels[legacyProv].apiUrl = raw.imageApiUrl;
      if (raw.imageApiKey && ! (raw.channels && raw.channels[legacyProv] && raw.channels[legacyProv].apiKey)) channels[legacyProv].apiKey = raw.imageApiKey;
      if (raw.imageModel && ! (raw.channels && raw.channels[legacyProv] && raw.channels[legacyProv].model)) channels[legacyProv].model = raw.imageModel;
    }
    const primaryProvider = (raw.primaryProvider && IMAGE_PROVIDER_META[raw.primaryProvider]) ? raw.primaryProvider : (IMAGE_PROVIDER_META[legacyProv] ? legacyProv : 'pollinations');
    const secondaryProvider = (raw.secondaryProvider && (raw.secondaryProvider === 'none' || IMAGE_PROVIDER_META[raw.secondaryProvider])) ? raw.secondaryProvider : 'none';
    const maxRetries = Math.max(1, Math.min(5, parseInt(raw.maxRetries, 10) || 5));
    const activeCh = channels[primaryProvider] || defaultChannels.pollinations;
    return {
      primaryProvider: primaryProvider,
      secondaryProvider: secondaryProvider,
      maxRetries: maxRetries,
      channels: channels,
      imageProvider: primaryProvider,
      imageApiUrl: activeCh.apiUrl || '',
      imageApiKey: activeCh.apiKey || '',
      imageModel: activeCh.model || '',
      imageNegativePrompt: typeof raw.imageNegativePrompt === 'string' ? raw.imageNegativePrompt : defaultNeg
    };
  }

  function saveImageGenConfig(config) {
    const allowed = ['pollinations', 'novelai', 'sdwebui', 'openai', 'midjourney'];
    if (!config || typeof config !== 'object') return false;
    const current = getImageGenConfig();
    const channels = Object.assign({}, current.channels);
    if (config.channels && typeof config.channels === 'object') {
      allowed.forEach(function(k) {
        if (config.channels[k] && typeof config.channels[k] === 'object') {
          channels[k] = {
            apiUrl: String(config.channels[k].apiUrl != null ? config.channels[k].apiUrl : (channels[k] && channels[k].apiUrl) || '').trim(),
            apiKey: String(config.channels[k].apiKey != null ? config.channels[k].apiKey : (channels[k] && channels[k].apiKey) || '').trim(),
            model: String(config.channels[k].model != null ? config.channels[k].model : (channels[k] && channels[k].model) || '').trim()
          };
        }
      });
    }
    const primary = allowed.indexOf(config.primaryProvider) >= 0 ? config.primaryProvider : (allowed.indexOf(config.imageProvider) >= 0 ? config.imageProvider : current.primaryProvider);
    if (config.imageApiUrl !== undefined || config.imageApiKey !== undefined || config.imageModel !== undefined) {
      const targetProv = allowed.indexOf(config.editingProvider) >= 0 ? config.editingProvider : primary;
      channels[targetProv] = {
        apiUrl: String(config.imageApiUrl !== undefined ? config.imageApiUrl : channels[targetProv].apiUrl).trim(),
        apiKey: String(config.imageApiKey !== undefined ? config.imageApiKey : channels[targetProv].apiKey).trim(),
        model: String(config.imageModel !== undefined ? config.imageModel : channels[targetProv].model).trim()
      };
    }
    const secondary = (config.secondaryProvider === 'none' || allowed.indexOf(config.secondaryProvider) >= 0) ? config.secondaryProvider : current.secondaryProvider;
    const maxRetries = Math.max(1, Math.min(5, parseInt(config.maxRetries, 10) || current.maxRetries || 5));
    const activeCh = channels[primary] || { apiUrl: '', apiKey: '', model: '' };
    const payload = {
      primaryProvider: primary,
      secondaryProvider: secondary,
      maxRetries: maxRetries,
      channels: channels,
      imageProvider: primary,
      imageApiUrl: activeCh.apiUrl,
      imageApiKey: activeCh.apiKey,
      imageModel: activeCh.model,
      imageNegativePrompt: config.imageNegativePrompt !== undefined ? String(config.imageNegativePrompt).trim() : current.imageNegativePrompt
    };
    try {
      const ls = getStorage();
      if (ls) ls.setItem(IMAGE_CONFIG_KEY, JSON.stringify(payload));
      return true;
    } catch (e) { return false; }
  }

  /* ── 画风与画师串预设库（支持多套画师串、正面提示词、负面提示词） ── */
  function getCgStylePresets() {
    try {
      const ls = getStorage();
      const raw = ls && ls.getItem(CG_STYLE_PRESETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.presets)) return parsed;
      }
    } catch (e) {}
    return {
      version: 1,
      presets: [
        {
          id: 'preset_default_gal',
          name: '🌸 日系Galgame清透CG（默认示例）',
          artistPrompt: 'anime style, key visual, visual novel CG, makoto shinkai, kyoto animation, ask (askzy), ciloranko',
          positivePrompt: 'masterpiece, best quality, ultra-detailed, horizontal composition, 16:9 aspect ratio, cinematic lighting, soft dramatic shadows, expressive eyes, detailed background',
          negativePrompt: 'lowres, bad anatomy, bad hands, extra digits, fewer digits, text, watermark, signature, worst quality, low quality, blurry, vertical orientation',
          enabled: false,
          updatedAt: Date.now()
        }
      ]
    };
  }

  function saveCgStylePresets(lib) {
    try {
      const ls = getStorage();
      if (ls && lib && Array.isArray(lib.presets)) {
        ls.setItem(CG_STYLE_PRESETS_KEY, JSON.stringify(lib));
        return true;
      }
    } catch (e) {}
    return false;
  }

  function getEnabledCgStylePreset() {
    const lib = getCgStylePresets();
    const found = (lib.presets || []).filter(function(p) { return p && p.enabled === true; });
    return found.length ? found[0] : null;
  }

  /* ── 画风与画师串预设管理弹窗 ── */
  function openCgStylePresetsDialog(onBack) {
    const lib = getCgStylePresets();
    const presets = lib.presets || [];
    const rows = presets.map(function(p) {
      const isEn = p.enabled === true;
      return '<div style="padding:10px;margin-bottom:8px;background:#100a13;border:1px solid ' + (isEn ? '#f472d0' : '#59304d') + ';border-radius:4px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:5px;">' +
          '<b style="color:#ffb8eb;font-size:12px;">🎨 ' + escapeFeatureHtml(p.name || '未命名预设') + '</b>' +
          '<button type="button" class="moon-cg-preset-toggle" data-id="' + escapeFeatureHtml(p.id) + '" style="padding:3px 9px;font-size:10.5px;cursor:pointer;background:' + (isEn ? '#37102f;border:1px solid #6ee7b7;color:#6ee7b7' : '#1c1020;border:1px solid #a94d8b;color:#e9c3dc') + ';">' + (isEn ? '● 已启用' : '○ 启用此预设') + '</button>' +
        '</div>' +
        '<div style="font-size:10px;color:#a5f3fc;line-height:1.5;word-break:break-all;"><b>画师串：</b>' + escapeFeatureHtml(String(p.artistPrompt || '(无)').slice(0, 110)) + '</div>' +
        '<div style="font-size:10px;color:#cbd5e1;line-height:1.5;word-break:break-all;"><b>正面词：</b>' + escapeFeatureHtml(String(p.positivePrompt || '(无)').slice(0, 110)) + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;line-height:1.5;word-break:break-all;"><b>负面词：</b>' + escapeFeatureHtml(String(p.negativePrompt || '(无)').slice(0, 90)) + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:7px;">' +
          '<button type="button" class="moon-cg-preset-edit" data-id="' + escapeFeatureHtml(p.id) + '" style="flex:1;padding:5px;font-size:10.5px;">✏️ 编辑</button>' +
          '<button type="button" class="moon-cg-preset-del" data-id="' + escapeFeatureHtml(p.id) + '" style="flex:0.6;padding:5px;font-size:10.5px;">🗑 删除</button>' +
        '</div>' +
      '</div>';
    }).join('');

    const html = '<div style="font-size:11px;color:#f9a8d4;line-height:1.7;margin-bottom:8px;">' +
      '可保存多套<b>画师串、正面提示词、负面提示词</b>。启用后，显影 CG 时会自动将画师串与正面/负面提示词拼接到画面描述中。</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<button type="button" id="moon-cg-preset-new" style="flex:1;padding:8px;font-weight:700;cursor:pointer;">＋ 新建画风/画师串预设</button>' +
      '</div>' +
      '<div style="max-height:46vh;overflow-y:auto;">' + (rows || '<div style="padding:16px;text-align:center;color:#94a3b8;">暂无预设，点击上方按钮新建一套吧！</div>') + '</div>';

    showModalDialog('🎨 画风与画师串预设库', html, function() {
      if (typeof onBack === 'function') setTimeout(onBack, 150);
    }, {
      confirmText: '完成返回',
      onOpen: function(mask) {
        mask.querySelector('#moon-cg-preset-new').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          openCgStylePresetEditDialog(null, function() { openCgStylePresetsDialog(onBack); });
        });
        mask.querySelectorAll('.moon-cg-preset-toggle').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id');
            const curLib = getCgStylePresets();
            let nowEnabled = false;
            (curLib.presets || []).forEach(function(item) {
              if (item.id === id) {
                item.enabled = !item.enabled;
                nowEnabled = item.enabled;
              } else {
                item.enabled = false;
              }
            });
            saveCgStylePresets(curLib);
            try { mask.remove(); } catch (e) {}
            toast(nowEnabled ? '已启用画风预设' : '已停用画风预设', nowEnabled ? 'success' : 'info');
            openCgStylePresetsDialog(onBack);
          });
        });
        mask.querySelectorAll('.moon-cg-preset-edit').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id');
            try { mask.remove(); } catch (e) {}
            openCgStylePresetEditDialog(id, function() { openCgStylePresetsDialog(onBack); });
          });
        });
        mask.querySelectorAll('.moon-cg-preset-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id');
            const curLib = getCgStylePresets();
            curLib.presets = (curLib.presets || []).filter(function(x) { return x.id !== id; });
            saveCgStylePresets(curLib);
            toast('预设已删除', 'info');
            try { mask.remove(); } catch (e) {}
            openCgStylePresetsDialog(onBack);
          });
        });
      }
    });
  }

  function openCgStylePresetEditDialog(presetId, onDone) {
    const lib = getCgStylePresets();
    const existing = presetId ? (lib.presets || []).find(function(x) { return x.id === presetId; }) : null;
    const item = existing || {
      id: newFeatureId('cgpreset'),
      name: '',
      artistPrompt: '',
      positivePrompt: 'masterpiece, best quality, ultra-detailed, horizontal composition, 16:9 aspect ratio, cinematic lighting',
      negativePrompt: 'lowres, bad anatomy, bad hands, text, watermark, worst quality, low quality, blurry, vertical orientation',
      enabled: true
    };
    const html = '<div style="display:flex;flex-direction:column;gap:8px;font-size:11.5px;">' +
      '<label>预设名称<input id="moon-cgp-name" type="text" value="' + escapeFeatureHtml(item.name) + '" placeholder="例如：清透水彩Gal风 / 赛璐璐厚涂" style="width:100%;box-sizing:border-box;padding:7px;margin-top:3px;background:#09060d;border:1px solid #a94d8b;color:#fce7f3;"></label>' +
      '<label>画师串 (Artist / Style Tags)<textarea id="moon-cgp-artist" placeholder="例如：artist:ask_(askzy), ciloranko, anime visual novel style..." style="width:100%;box-sizing:border-box;min-height:54px;padding:7px;margin-top:3px;background:#09060d;border:1px solid #a94d8b;color:#a5f3fc;font-family:monospace;">' + escapeFeatureHtml(item.artistPrompt) + '</textarea></label>' +
      '<label>正面提示词 (Positive Quality & Composition)<textarea id="moon-cgp-pos" placeholder="masterpiece, best quality, horizontal composition, 16:9..." style="width:100%;box-sizing:border-box;min-height:54px;padding:7px;margin-top:3px;background:#09060d;border:1px solid #a94d8b;color:#fce7f3;font-family:monospace;">' + escapeFeatureHtml(item.positivePrompt) + '</textarea></label>' +
      '<label>负面提示词 (Negative Prompt / UC)<textarea id="moon-cgp-neg" placeholder="lowres, bad anatomy, bad hands, text, watermark..." style="width:100%;box-sizing:border-box;min-height:54px;padding:7px;margin-top:3px;background:#09060d;border:1px solid #a94d8b;color:#fca5a5;font-family:monospace;">' + escapeFeatureHtml(item.negativePrompt) + '</textarea></label>' +
      '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#ffb8eb;"><input type="checkbox" id="moon-cgp-enable"' + (item.enabled !== false ? ' checked' : '') + '> 保存后立即启用此预设</label>' +
    '</div>';

    showModalDialogCancelable(existing ? '✏️ 编辑画风预设' : '＋ 新建画风预设', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const name = mask.querySelector('#moon-cgp-name').value.trim() || '自定义画风预设';
        const artist = mask.querySelector('#moon-cgp-artist').value.trim();
        const pos = mask.querySelector('#moon-cgp-pos').value.trim();
        const neg = mask.querySelector('#moon-cgp-neg').value.trim();
        const enableNow = mask.querySelector('#moon-cgp-enable').checked;
        const curLib = getCgStylePresets();
        if (!Array.isArray(curLib.presets)) curLib.presets = [];
        if (enableNow) {
          curLib.presets.forEach(function(p) { p.enabled = false; });
        }
        const updated = {
          id: item.id,
          name: name,
          artistPrompt: artist,
          positivePrompt: pos,
          negativePrompt: neg,
          enabled: enableNow,
          updatedAt: Date.now()
        };
        const idx = curLib.presets.findIndex(function(x) { return x.id === item.id; });
        if (idx >= 0) curLib.presets[idx] = updated;
        else curLib.presets.unshift(updated);
        saveCgStylePresets(curLib);
        toast('画风预设已保存', 'success');
        if (typeof onDone === 'function') setTimeout(onDone, 150);
      },
      function() { if (typeof onDone === 'function') setTimeout(onDone, 150); },
      { confirmText: '💾 保存预设', cancelText: '取消' }
    );
  }

  /* ── 组装完整横构图提示词（合并画师串预设 + 正面词 + 当前画面描述） ── */
  function composeFullCgPrompts(scenePrompt, itemNegativePrompt) {
    const preset = getEnabledCgStylePreset();
    const config = getImageGenConfig();
    const parts = [];
    if (preset && preset.artistPrompt) parts.push(String(preset.artistPrompt).trim());
    if (preset && preset.positivePrompt) parts.push(String(preset.positivePrompt).trim());
    if (!/horizontal composition|16:9|widescreen/i.test(parts.join(' ') + ' ' + String(scenePrompt || ''))) {
      parts.push('horizontal composition, 16:9 aspect ratio, widescreen, cinematic anime visual novel CG');
    }
    if (scenePrompt) parts.push(String(scenePrompt).trim());
    const finalPositive = parts.filter(Boolean).join(', ').replace(/,\s*,+/g, ', ').slice(0, 2800);

    const negParts = [];
    if (preset && preset.negativePrompt) negParts.push(String(preset.negativePrompt).trim());
    if (itemNegativePrompt) negParts.push(String(itemNegativePrompt).trim());
    if (!negParts.length && config.imageNegativePrompt) negParts.push(String(config.imageNegativePrompt).trim());
    const finalNegative = negParts.filter(Boolean).join(', ').slice(0, 1000);
    return { positive: finalPositive, negative: finalNegative };
  }

  function blobToDataUrl(blob) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function() { resolve(String(reader.result || '')); };
      reader.onerror = function() { reject(new Error('图片读取失败')); };
      reader.readAsDataURL(blob);
    });
  }

  async function requestSingleImageProvider(provider, channelCfg, input, negative) {
    const meta = IMAGE_PROVIDER_META[provider] || IMAGE_PROVIDER_META.pollinations;
    const apiUrl = String((channelCfg && channelCfg.apiUrl) || meta.defaultUrl || '').trim();
    const apiKey = String((channelCfg && channelCfg.apiKey) || '').trim();
    const model = String((channelCfg && channelCfg.model) || meta.defaultModel || '').trim();

    if (provider === 'novelai') {
      if (!apiKey) throw new Error('请先填写 NovelAI API Key');
      const response = await fetch(apiUrl || 'https://image.novelai.net/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          input: input,
          model: model || 'nai-diffusion-3',
          action: 'generate',
          parameters: { width: 1216, height: 832, scale: 5, sampler: 'k_euler', steps: 28, n_samples: 1, negative_prompt: negative }
        })
      });
      if (!response.ok) throw new Error('NovelAI HTTP ' + response.status);
      return await blobToDataUrl(await response.blob());
    }
    if (provider === 'sdwebui') {
      let url = (apiUrl || 'http://127.0.0.1:7860').replace(/\/+$/, '');
      if (!url.endsWith('/sdapi/v1/txt2img')) url += '/sdapi/v1/txt2img';
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ prompt: input, negative_prompt: negative, width: 1024, height: 576, steps: 25, cfg_scale: 7 })
      });
      if (!response.ok) throw new Error('SD WebUI HTTP ' + response.status);
      const json = await response.json();
      if (json.images && json.images[0]) return 'data:image/png;base64,' + json.images[0];
      throw new Error('SD WebUI 未返回有效图片');
    }
    if (provider === 'openai') {
      if (!apiKey) throw new Error('请先填写图像 API Key');
      let url = (apiUrl || 'https://api.openai.com').replace(/\/+$/, '');
      if (!/\/images\/generations$/i.test(url)) url += url.endsWith('/v1') ? '/images/generations' : '/v1/images/generations';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({ model: model || 'dall-e-3', prompt: input, size: '1792x1024', response_format: 'b64_json' })
      });
      if (!response.ok) throw new Error('图像 API HTTP ' + response.status);
      const json = await response.json(), row = json.data && json.data[0];
      if (row && row.b64_json) return 'data:image/png;base64,' + row.b64_json;
      if (row && /^https?:\/\//i.test(row.url || '')) return row.url;
      throw new Error('图像 API 未返回可用图片');
    }
    if (provider === 'midjourney') {
      const base = apiUrl.replace(/\/+$/, '');
      if (!base) throw new Error('请先填写 Midjourney Proxy 地址');
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['mj-api-secret'] = apiKey;
      const response = await fetch(base + '/mj/submit/imagine', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ prompt: input + ' --ar 16:9' })
      });
      if (!response.ok) throw new Error('Midjourney Proxy HTTP ' + response.status);
      const task = await response.json(), taskId = task.result;
      if (!taskId) throw new Error('Midjourney 任务提交失败');
      for (let i = 0; i < 40; i++) {
        await new Promise(function(resolve) { setTimeout(resolve, 3000); });
        const check = await fetch(base + '/mj/task/' + encodeURIComponent(taskId) + '/fetch', { headers: headers });
        if (!check.ok) continue;
        const result = await check.json();
        if (result.status === 'SUCCESS' && /^https?:\/\//i.test(result.imageUrl || '')) return result.imageUrl;
        if (result.status === 'FAILED') throw new Error('Midjourney 生成失败：' + String(result.failReason || '未知原因').slice(0, 120));
      }
      throw new Error('Midjourney 生成超时');
    }
    const encoded = encodeURIComponent(input.slice(0, 450));
    return 'https://image.pollinations.ai/prompt/' + encoded + '?width=1280&height=720&nologo=true&seed=' + Math.floor(Math.random() * 100000);
  }

  async function callImageGenerationApi(prompt, customNegativePrompt) {
    const config = getImageGenConfig();
    const composed = composeFullCgPrompts(prompt, customNegativePrompt);
    const input = composed.positive;
    const negative = composed.negative;
    if (!input) throw new Error('缺少图片提示词');

    const maxRetries = Math.max(1, Math.min(5, Number(config.maxRetries) || 5));
    const providersToTry = [config.primaryProvider || 'pollinations'];
    if (config.secondaryProvider && config.secondaryProvider !== 'none' && config.secondaryProvider !== providersToTry[0]) {
      providersToTry.push(config.secondaryProvider);
    }

    let lastError = null;
    for (let pIdx = 0; pIdx < providersToTry.length; pIdx++) {
      const prov = providersToTry[pIdx];
      const provLabel = (IMAGE_PROVIDER_META[prov] && IMAGE_PROVIDER_META[prov].name) || prov;
      const channelCfg = (config.channels && config.channels[prov]) || {};
      const roleTag = pIdx === 0 ? '默认渠道' : '次用备用渠道';

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          updateLoadingDialogText('正在通过' + roleTag + '【' + provLabel + '】显影 CG（第 ' + attempt + '/' + maxRetries + ' 次尝试）…');
        } catch (e) {}
        try {
          const resultUrl = await requestSingleImageProvider(prov, channelCfg, input, negative);
          if (resultUrl) return resultUrl;
        } catch (err) {
          lastError = err;
          try { console.warn('[Doki CG] ' + roleTag + ' ' + prov + ' 第 ' + attempt + '/' + maxRetries + ' 次失败：', err); } catch (e2) {}
          if (attempt < maxRetries) {
            await new Promise(function(r) { setTimeout(r, 900); });
          }
        }
      }
      if (pIdx === 0 && providersToTry.length > 1) {
        try { toast('默认渠道连续 ' + maxRetries + ' 次失败，正在自动切换至次用渠道…', 'warning'); } catch (e) {}
      }
    }
    throw lastError || new Error('生图请求在重试 ' + maxRetries + ' 次后仍未成功');
  }

  function getAchievementTriggerLedger() {
    const list = readChatFeatureValue(ACHIEVEMENT_TRIGGER_KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function markAchievementTrigger(key) {
    const list = getAchievementTriggerLedger();
    if (list.indexOf(key) >= 0) return false;
    list.push(key);
    writeChatFeatureValue(ACHIEVEMENT_TRIGGER_KEY, list.slice(-160));
    return true;
  }
  function stableFeatureHash(value) {
    const text = String(value || ''); let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(36);
  }

  function collectCurrentSceneContextForCg() {
    const latestAi = getLatestAiMessage();
    const latestScene = latestAi && latestAi.msg ? String(latestAi.msg.mes || '').replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '').replace(/[\[\(【〔]\s*Sylveina\|[\s\S]*$/i, '').trim() : '';
    const hist = collectChatHistoryContext(2800);
    return {
      latestScene: latestScene.slice(-1800),
      recentChat: String(hist.chat || '').slice(-2400)
    };
  }

  function triggerAchievementUnlock(charName, eventType, triggerReason, triggerKey) {
    return (async function() {
      const list = getGalleryList();
      if (list.some(function(item) { return item.triggerKey === triggerKey; })) return;
      const sceneCtx = collectCurrentSceneContextForCg();
      const systemPrompt = '你是日系视觉小说的成就策划。请结合当前剧情画面上下文，只输出 JSON 对象，字段为 title、desc、prompt、uc。title 不超过 24 字，desc 为 15 至 40 字，prompt 是根据当前画面生成的英文横构图动漫场景描述（默认横构图：包含 horizontal composition, 16:9 aspect ratio, widescreen, cinematic anime visual novel CG），uc 是负面提示词。不要输出 HTML。';
      const userPrompt = '角色：' + String(charName).slice(0, 100) + '\n事件：' + String(eventType).slice(0, 40) + '\n契机：' + String(triggerReason).slice(0, 160) + (sceneCtx.latestScene ? ('\n\n【当前最新画面正文】\n' + sceneCtx.latestScene) : '') + (sceneCtx.recentChat ? ('\n\n【近期对话上下文】\n' + sceneCtx.recentChat) : '') + '\n\n请将此刻的画面写成一枚值得收藏的恋爱剧情成就与默认横构图 CG 提示词。';
      let result = null;
      try { result = extractJson(await callOpeningModel(hasValidCustomAIConfig() ? 'custom' : 'main', systemPrompt, userPrompt)); } catch (e) {}
      result = result && typeof result === 'object' && !Array.isArray(result) ? result : {};
      let rawPrompt = String(result.prompt || ('horizontal composition, 16:9 aspect ratio, widescreen, romantic anime visual novel CG, ' + charName + ', tender emotional scene, cinematic horizontal composition')).trim();
      if (!/horizontal composition|16:9/i.test(rawPrompt)) {
        rawPrompt = 'horizontal composition, 16:9 aspect ratio, widescreen, ' + rawPrompt;
      }
      const item = {
        id: newFeatureId('ach'), triggerKey: triggerKey, char: String(charName),
        title: String(result.title || '与' + charName + '的命定回响').slice(0, 80),
        desc: String(result.desc || '在这个重要的瞬间，彼此的羁绊留下了新的印记。').slice(0, 300),
        prompt: rawPrompt.slice(0, 2500),
        uc: String(result.uc || 'worst quality, low quality, blurry, watermark').slice(0, 500),
        imageKey: '', imageUrl: '', createdAt: Date.now(), isEnding: false
      };
      list.unshift(item);
      saveGalleryList(list);
      const html = '<div style="text-align:center;padding:8px 0"><div style="font-size:30px">🏆</div><b>成就解锁</b><div style="font-size:15px;color:#f9a8d4;margin:8px 0">《' + escapeFeatureHtml(item.title) + '》</div><div>' + escapeFeatureHtml(item.desc) + '</div><div style="margin-top:10px;color:#94a3b8">已加入本聊天的回忆画廊（默认不自动生图，点击下方「查看当前回忆」即可发送生图请求显影 CG）。</div></div>';
      showModalDialogCancelable('🏆 成就记录', html,
        function() {
          setTimeout(function() { developCGItem(item); }, 150);
        },
        null,
        { confirmText: '🖼️ 查看当前回忆（显影 CG）', cancelText: '先收入回忆' }
      );
    })();
  }

  async function developCGItem(item) {
    if (!item || !item.prompt) { toast('这条回忆没有图片提示词', 'warning'); return; }
    showLoadingDialog('正在显影这段回忆 CG…');
    try {
      const generated = await callImageGenerationApi(item.prompt, item.uc);
      const stored = await persistGalleryImage(item.id, generated);
      const list = getGalleryList();
      const index = list.findIndex(function(row) { return row.id === item.id; });
      if (index < 0) throw new Error('回忆记录已不存在');
      list[index].imageKey = stored.imageKey; list[index].imageUrl = stored.imageUrl; list[index].isExpired = false;
      if (!saveGalleryList(list)) throw new Error('图片已生成，但无法保存回忆索引');
      closeLoadingDialog();
      const previewUrl = /^https?:\/\//i.test(stored.imageUrl) ? stored.imageUrl : generated;
      showModalDialog('✨ 回忆 CG 已显影', '<div id="moon-cg-preview" style="margin:8px 0"></div><div>已归档到当前聊天的回忆画廊。</div>', null, { confirmText: '知道了', onOpen: function(mask) { const image = mainDoc.createElement('img'); image.src = previewUrl; image.alt = item.title; image.style.cssText = 'width:100%;display:block;border:1px solid #693253'; mask.querySelector('#moon-cg-preview').appendChild(image); } });
    } catch (err) {
      closeLoadingDialog();
      toast('CG 显影失败：' + String(err && err.message || err).slice(0, 180), 'warning');
    }
  }

  function downloadFileViaBrowser(url, filename) {
    try {
      const anchor = mainDoc.createElement('a');
      const rawName = String(filename || 'Moon Pocket');
      const hasExt = /\.[a-z0-9]{2,5}$/i.test(rawName);
      anchor.href = url;
      anchor.download = rawName + (hasExt ? '' : (/^data:image\/jpeg/i.test(String(url)) ? '.jpg' : '.png'));
      mainDoc.body.appendChild(anchor); anchor.click(); setTimeout(function() { try { anchor.remove(); } catch (e) {} }, 250);
    } catch (e) { toast('下载失败：' + String(e && e.message || e), 'warning'); }
  }
  function closeFeatureModal(mask) {
    const button = mask && mask.querySelector('#moon-modal-confirm');
    if (button) button.click();
  }
  async function openMemoryGalleryDialog() {
    await cleanExpiredGalleryImages();
    const list = getGalleryList();
    const enabledPreset = getEnabledCgStylePreset();
    const imgCfg = getImageGenConfig();
    const primaryMeta = IMAGE_PROVIDER_META[imgCfg.primaryProvider] || IMAGE_PROVIDER_META.pollinations;
    const secondaryMeta = imgCfg.secondaryProvider && imgCfg.secondaryProvider !== 'none' ? IMAGE_PROVIDER_META[imgCfg.secondaryProvider] : null;

    const topBarHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;padding:7px;background:#100a13;border:1px solid #693253;">' +
      '<button type="button" id="moon-gal-presets-btn" style="flex:1;padding:6px;font-size:11px;cursor:pointer;">🎨 画风预设' + (enabledPreset ? ' (已启用)' : '') + '</button>' +
      '<button type="button" id="moon-gal-imgcfg-btn" style="flex:1;padding:6px;font-size:11px;cursor:pointer;">🖼️ 渠道设定</button>' +
    '</div>' +
    '<div style="font-size:10px;color:#e9c3dc;margin-bottom:8px;line-height:1.5;">' +
      '当前主渠道：<b style="color:#7dd3fc;">' + escapeFeatureHtml(primaryMeta.name) + '</b>' +
      (secondaryMeta ? ' · 次用渠道：<b style="color:#fde047;">' + escapeFeatureHtml(secondaryMeta.name) + '</b>' : ' · 次用渠道：无（失败自动重试 ' + imgCfg.maxRetries + ' 次）') +
      (enabledPreset ? ' · 画风：<b style="color:#f9a8d4;">' + escapeFeatureHtml(enabledPreset.name) + '</b>' : '') +
    '</div>';

    const rows = list.length ? list.map(function(item) {
      return '<article style="padding:9px;margin:7px 0;background:#100a13;border:1px solid #693253">' +
        '<b>《' + escapeFeatureHtml(item.title || '未命名回忆') + '》</b><div style="font-size:10px;color:#9ca3af">' + escapeFeatureHtml(item.char || '') + (item.isEnding ? ' · 周目结局' : ' · 成就') + ' · ' + new Date(Number(item.createdAt) || Date.now()).toLocaleString() + '</div>' +
        '<div style="margin:5px 0">' + escapeFeatureHtml(item.desc || '') + '</div>' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap"><button type="button" data-gallery-view="' + escapeFeatureHtml(item.id) + '">查看</button><button type="button" data-gallery-generate="' + escapeFeatureHtml(item.id) + '"' + (!item.prompt ? ' disabled' : '') + '>显影 CG</button><button type="button" data-gallery-download="' + escapeFeatureHtml(item.id) + '"' + (!(item.imageKey || item.imageUrl) ? ' disabled' : '') + '>下载</button><button type="button" data-gallery-delete="' + escapeFeatureHtml(item.id) + '">移除</button></div></article>';
    }).join('') : '<div style="text-align:center;padding:20px 4px;color:#cbd5e1;">这里还没有成就或周目结局。经历重大事件或彩蛋后，成就会自动入档。<br>可点击上方<b>「🎨 画风预设」或「🖼️ 渠道设定」</b>提前配置画师串与生图渠道。</div>';

    const html = topBarHtml + '<div style="max-height:36vh;overflow:auto">' + rows + '</div><div id="moon-gallery-preview" style="margin-top:10px"></div>';
    showModalDialog('📚 回忆画廊 · ' + list.length + ' 项', html, null, { confirmText: '关闭', onOpen: function(mask) {
      const presetBtn = mask.querySelector('#moon-gal-presets-btn');
      if (presetBtn) presetBtn.addEventListener('click', function() { closeFeatureModal(mask); setTimeout(function() { openCgStylePresetsDialog(openMemoryGalleryDialog); }, 160); });
      const imgCfgBtn = mask.querySelector('#moon-gal-imgcfg-btn');
      if (imgCfgBtn) imgCfgBtn.addEventListener('click', function() { closeFeatureModal(mask); setTimeout(function() { openImageGenerationSettingsDialog(null, openMemoryGalleryDialog); }, 160); });

      mask.querySelectorAll('[data-gallery-view]').forEach(function(button) {
        button.addEventListener('click', async function() {
          const item = getGalleryList().find(function(row) { return row.id === button.getAttribute('data-gallery-view'); });
          const preview = mask.querySelector('#moon-gallery-preview'); if (!item || !preview) return;
          if (_galleryPreviewObjectUrl) { try { (mainWin.URL || URL).revokeObjectURL(_galleryPreviewObjectUrl); } catch (e) {} _galleryPreviewObjectUrl = ''; }
          preview.textContent = '正在读取回忆…';
          const imageUrl = await loadGalleryImage(item);
          preview.replaceChildren();
          const title = mainDoc.createElement('b'); title.textContent = '《' + String(item.title || '未命名回忆') + '》'; preview.appendChild(title);
          const desc = mainDoc.createElement('div'); desc.textContent = String(item.desc || ''); preview.appendChild(desc);
          if (imageUrl) {
            if (imageUrl.indexOf('blob:') === 0) _galleryPreviewObjectUrl = imageUrl;
            const image = mainDoc.createElement('img'); image.src = imageUrl; image.alt = String(item.title || '回忆 CG'); image.style.cssText = 'width:100%;display:block;margin-top:7px;border:1px solid #693253'; preview.appendChild(image);
          } else {
            const note = mainDoc.createElement('div'); note.style.color = '#9ca3af'; note.textContent = item.isExpired ? '图片已按保留设置清理，可重新显影。' : '尚未生成 CG。'; preview.appendChild(note);
          }
        });
      });
      mask.querySelectorAll('[data-gallery-generate]').forEach(function(button) { button.addEventListener('click', function() {
        const item = getGalleryList().find(function(row) { return row.id === button.getAttribute('data-gallery-generate'); });
        closeFeatureModal(mask); setTimeout(function() { developCGItem(item); }, 180);
      }); });
      mask.querySelectorAll('[data-gallery-download]').forEach(function(button) { button.addEventListener('click', async function() {
        const item = getGalleryList().find(function(row) { return row.id === button.getAttribute('data-gallery-download'); });
        const imageUrl = await loadGalleryImage(item); if (imageUrl) downloadFileViaBrowser(imageUrl, 'MoonPocket_' + String(item.title || 'CG').replace(/[\\/:*?"<>|]/g, '_')); else toast('没有可下载的图片', 'info');
      }); });
      mask.querySelectorAll('[data-gallery-delete]').forEach(function(button) { button.addEventListener('click', function() {
        const item = getGalleryList().find(function(row) { return row.id === button.getAttribute('data-gallery-delete'); });
        closeFeatureModal(mask);
        setTimeout(function() { showModalDialogCancelable('移除回忆', '<div>确定移除《' + escapeFeatureHtml(item && item.title || '未命名回忆') + '》及其本地图片吗？</div>', async function() {
          if (!item) return;
          await deleteGalleryImage(item);
          saveGalleryList(getGalleryList().filter(function(row) { return row.id !== item.id; }));
          openMemoryGalleryDialog();
        }, null, { confirmText: '移除', cancelText: '保留' }); }, 180);
      }); });
    } });
  }

  function openImageGenerationSettingsDialog(panel, onBack) {
    const config = getImageGenConfig(), settings = getSettings();
    const providers = [
      ['pollinations', 'Pollinations（免 Key）'],
      ['novelai', 'NovelAI'],
      ['sdwebui', 'Stable Diffusion WebUI'],
      ['openai', 'OpenAI 兼容图像接口'],
      ['midjourney', 'Midjourney Proxy']
    ];
    let currentEditProv = config.primaryProvider || 'pollinations';
    const workingChannels = JSON.parse(JSON.stringify(config.channels || {}));

    const primaryOptions = providers.map(function(row) {
      return '<option value="' + row[0] + '"' + (config.primaryProvider === row[0] ? ' selected' : '') + '>' + row[1] + '</option>';
    }).join('');
    const secondaryOptions = '<option value="none"' + (config.secondaryProvider === 'none' ? ' selected' : '') + '>无次用渠道（仅主渠道自动重试最多 5 次）</option>' +
      providers.map(function(row) {
        return '<option value="' + row[0] + '"' + (config.secondaryProvider === row[0] ? ' selected' : '') + '>' + row[1] + '</option>';
      }).join('');
    const editOptions = providers.map(function(row) {
      return '<option value="' + row[0] + '"' + (currentEditProv === row[0] ? ' selected' : '') + '>配置渠道参数：' + row[1] + '</option>';
    }).join('');

    const initCh = workingChannels[currentEditProv] || { apiUrl: '', apiKey: '', model: '' };
    const html = '<div style="line-height:1.7;margin-bottom:8px;color:#f9a8d4;font-size:11px;">' +
      '每个生图渠道均可<b>独立配置并单独保存</b>。当默认主渠道生成失败时，系统会自动重新发起请求（最多重试 <b>5 次</b>）；若配置了次用渠道，主渠道失败后会自动切换至次用渠道继续生成。</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<button type="button" id="moon-imgcfg-open-presets" style="flex:1;padding:7px;font-size:11px;cursor:pointer;">🎨 管理画师串与正/负面提示词预设库</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
        '<label style="font-size:11px;">⭐ 默认主渠道<select id="moon-image-primary-provider" style="width:100%;padding:7px;margin-top:3px;background:#100a13;color:#6ee7b7;border:1px solid #a94d8b;">' + primaryOptions + '</select></label>' +
        '<label style="font-size:11px;">🛡️ 次用备用渠道<select id="moon-image-secondary-provider" style="width:100%;padding:7px;margin-top:3px;background:#100a13;color:#fde047;border:1px solid #a94d8b;">' + secondaryOptions + '</select></label>' +
      '</div>' +
      '<div style="padding:10px;background:#140b18;border:1px solid #f472d0;border-radius:4px;margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">' +
          '<select id="moon-image-provider" style="flex:1;padding:7px;background:#09060d;color:#ffb8eb;border:1px solid #f472d0;font-weight:700;">' + editOptions + '</select>' +
          '<button type="button" id="moon-image-save-channel" style="padding:7px 10px;font-size:11px;cursor:pointer;">💾 单独保存此渠道</button>' +
        '</div>' +
        '<label style="display:block;margin-top:6px;font-size:11px;">接口地址 (API URL)<input id="moon-image-url" value="' + escapeFeatureHtml(initCh.apiUrl) + '" placeholder="留空则使用该渠道官方默认地址" style="width:100%;box-sizing:border-box;padding:7px;margin-top:2px;background:#09060d;color:#fce7f3;border:1px solid #643052;"></label>' +
        '<label style="display:block;margin-top:6px;font-size:11px;">API Key（独立保存在掌机中）<input id="moon-image-key" type="password" value="' + escapeFeatureHtml(initCh.apiKey) + '" autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:7px;margin-top:2px;background:#09060d;color:#fce7f3;border:1px solid #643052;"></label>' +
        '<label style="display:block;margin-top:6px;font-size:11px;">模型名称 (Model)<input id="moon-image-model" value="' + escapeFeatureHtml(initCh.model) + '" placeholder="例如：nai-diffusion-3 / dall-e-3 / flux" style="width:100%;box-sizing:border-box;padding:7px;margin-top:2px;background:#09060d;color:#fce7f3;border:1px solid #643052;"></label>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">' +
        '<label style="font-size:11px;">失败自动重试次数（最多 5 次）<input id="moon-image-retries" type="number" min="1" max="5" value="' + Math.max(1, Math.min(5, Number(config.maxRetries) || 5)) + '" style="width:100%;box-sizing:border-box;padding:7px;margin-top:2px;background:#100a13;color:#fce7f3;border:1px solid #643052;"></label>' +
        '<label style="font-size:11px;">CG 保留天数（0=永久）<input id="moon-image-retention" type="number" min="0" max="3650" value="' + Math.max(0, Number(settings.galleryRetentionDays) || 0) + '" style="width:100%;box-sizing:border-box;padding:7px;margin-top:2px;background:#100a13;color:#fce7f3;border:1px solid #643052;"></label>' +
      '</div>' +
      '<label style="display:block;margin-top:8px;font-size:11px;">默认负面提示词（未启用画风预设时兜底使用）<textarea id="moon-image-negative" style="width:100%;box-sizing:border-box;min-height:44px;padding:7px;margin-top:2px;background:#100a13;color:#fce7f3;border:1px solid #643052;">' + escapeFeatureHtml(config.imageNegativePrompt) + '</textarea></label>' +
      '<label style="display:block;margin-top:8px;font-size:11px;">后日谈目标字数（1500–8000）<input id="moon-epilogue-words" type="number" min="1500" max="8000" step="500" value="' + Math.max(1500, Math.min(8000, Number(settings.epilogueTargetWords) || 8000)) + '" style="width:100%;box-sizing:border-box;padding:7px;margin-top:2px;background:#100a13;color:#fce7f3;border:1px solid #643052;"></label>';

    showModalDialogCancelable('⚙️ 回忆与生图设定', html, function() {
      const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
      const editSel = mask.querySelector('#moon-image-provider').value;
      workingChannels[editSel] = {
        apiUrl: mask.querySelector('#moon-image-url').value.trim(),
        apiKey: mask.querySelector('#moon-image-key').value.trim(),
        model: mask.querySelector('#moon-image-model').value.trim()
      };
      const primary = mask.querySelector('#moon-image-primary-provider').value;
      const secondary = mask.querySelector('#moon-image-secondary-provider').value;
      const retries = Math.max(1, Math.min(5, parseInt(mask.querySelector('#moon-image-retries').value, 10) || 5));
      const saved = saveImageGenConfig({
        primaryProvider: primary,
        secondaryProvider: secondary,
        maxRetries: retries,
        channels: workingChannels,
        imageProvider: primary,
        editingProvider: editSel,
        imageApiUrl: workingChannels[editSel].apiUrl,
        imageApiKey: workingChannels[editSel].apiKey,
        imageModel: workingChannels[editSel].model,
        imageNegativePrompt: mask.querySelector('#moon-image-negative').value.trim()
      });
      const nextSettings = getSettings();
      nextSettings.galleryRetentionDays = Math.max(0, Math.min(3650, parseInt(mask.querySelector('#moon-image-retention').value, 10) || 0));
      nextSettings.epilogueTargetWords = Math.max(1500, Math.min(8000, parseInt(mask.querySelector('#moon-epilogue-words').value, 10) || 8000));
      saveSettings(nextSettings);
      toast(saved ? '生图渠道与回忆设定已保存' : '图片配置未能保存，请检查本机存储空间', saved ? 'success' : 'warning');
      if (typeof onBack === 'function') setTimeout(onBack, 160);
    }, function() {
      if (typeof onBack === 'function') setTimeout(onBack, 160);
    }, {
      confirmText: '保存全部设定',
      cancelText: '取消',
      onOpen: function(mask) {
        const editSelect = mask.querySelector('#moon-image-provider');
        const urlInput = mask.querySelector('#moon-image-url');
        const keyInput = mask.querySelector('#moon-image-key');
        const modelInput = mask.querySelector('#moon-image-model');

        function flushInputsToWorking() {
          workingChannels[currentEditProv] = {
            apiUrl: urlInput.value.trim(),
            apiKey: keyInput.value.trim(),
            model: modelInput.value.trim()
          };
        }
        editSelect.addEventListener('change', function() {
          flushInputsToWorking();
          currentEditProv = editSelect.value;
          const ch = workingChannels[currentEditProv] || { apiUrl: '', apiKey: '', model: '' };
          urlInput.value = ch.apiUrl || '';
          keyInput.value = ch.apiKey || '';
          modelInput.value = ch.model || '';
        });
        mask.querySelector('#moon-image-save-channel').addEventListener('click', function() {
          flushInputsToWorking();
          const ok = saveImageGenConfig({
            primaryProvider: mask.querySelector('#moon-image-primary-provider').value,
            secondaryProvider: mask.querySelector('#moon-image-secondary-provider').value,
            maxRetries: Math.max(1, Math.min(5, parseInt(mask.querySelector('#moon-image-retries').value, 10) || 5)),
            channels: workingChannels,
            editingProvider: currentEditProv,
            imageApiUrl: workingChannels[currentEditProv].apiUrl,
            imageApiKey: workingChannels[currentEditProv].apiKey,
            imageModel: workingChannels[currentEditProv].model,
            imageNegativePrompt: mask.querySelector('#moon-image-negative').value.trim()
          });
          const label = (IMAGE_PROVIDER_META[currentEditProv] && IMAGE_PROVIDER_META[currentEditProv].name) || currentEditProv;
          toast(ok ? ('已单独保存【' + label + '】渠道配置') : '保存失败', ok ? 'success' : 'warning');
        });
        mask.querySelector('#moon-imgcfg-open-presets').addEventListener('click', function() {
          flushInputsToWorking();
          try { mask.remove(); } catch (e) {}
          openCgStylePresetsDialog(function() { openImageGenerationSettingsDialog(panel, onBack); });
        });
      }
    });
  }
  function isEndingTriggerCondition(charName, ch, recentText) {
    const E = Number(ch && ch.好感度) || 0, R = Number(ch && ch.阶段值) || 0, I = Number(ch && ch.嫉妒值) || 0;
    const quota = ch && ch._quota || {}, special = String(quota.对用户特殊状态 || '');
    const textPool = String(recentText || '') + ' ' + String(ch && ch.心声 || '');
    if (/(你|user|玩家)(已|彻底|已经)?(死了|停止了呼吸|失去心跳|永远闭上|咽下了最后一口气|倒在血泊中|牺牲了|殒命|离世)/i.test(textPool) || /(?:user已死|玩家死亡)/i.test(special)) return { triggered: true, type: 'UserDeathEnd', reason: '玩家在此刻迎来了生命的终点' };
    const escapedName = String(charName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if ((new RegExp('(' + (escapedName || '角色') + '|他|她)(已|彻底|已经)?(死了|停止了呼吸|自尽|牺牲|殒命|断气|永远离开)', 'i').test(textPool)) || (ch && ch.在场 === false && /死亡|消逝/.test(special))) return { triggered: true, type: 'CharDeathEnd', reason: '角色【' + charName + '】于此刻迎来终局' };
    if (E >= 100 && R >= 5) return { triggered: true, type: 'HE', reason: '情感羁绊达到圆满境界' };
    if (E <= -80 && R <= -4) return { triggered: true, type: 'BE', reason: '关系跌入无法挽回的仇视深渊' };
    if (special.indexOf('囚禁') >= 0 || (I >= 90 && !getSafetyLock())) return { triggered: true, type: 'CageEnd', reason: '关系进入囚禁终局条件' };
    return { triggered: false };
  }
  function markEndingPrompted(charName, endingType) {
    const archive = getEndingArchive(), key = String(charName) + '::' + String(endingType);
    if (archive.prompted[key]) return false;
    archive.prompted[key] = { at: Date.now() };
    saveEndingArchive(archive);
    return true;
  }
  function buildChatboxEndingPrompt(charName, ch, endingType, reason) {
    const E = Number(ch && ch.好感度) || 0;
    const P = Number(ch && ch.肉体值) || 0;
    const R = Number(ch && ch.阶段值) || 0;
    const I = Number(ch && ch.嫉妒值) || 0;
    const worldTime = String(readVar('世界.时间', '终幕时刻'));
    const routeMeta = ENDING_ROUTE_META[endingType] || ENDING_ROUTE_META.TE;
    const directorRule = [
      '═══════════════════════════════════',
      '🎬【最高优先级 · 日系 Galgame 周目终局报幕指令】',
      '玩家已触发本周目终局结算。请结合当前剧情脉络，为角色《' + charName + '》撰写一段充满日系视觉小说余韵的终幕演出正文（严禁代替玩家说话或行动）。',
      '在正文结束后，你必须在回复的最末尾另起一行，严格输出以下单行或多行 `[GalgameEnding|...]` 报幕标签（本系统脚本内置正则会将其自动替换渲染为日系经典 Galgame 结局报幕 Staff Roll 画面）：',
      '[GalgameEnding|结局名=四至十二字诗意结局名|类型=' + (endingType || 'TE') + '|角色=' + charName + '|时间=' + worldTime + '|四维=E:' + E + '/P:' + P + '/R:' + R + '/I:' + I + '|转折=一句话概括本周目最核心的命运分歧点（40字内）|复盘=本周目两人羁绊与结局的抒情复盘总结（120字内）|独白=角色在此刻对着玩家说出的第一人称终幕心声独白（80字内）|CG=horizontal composition, 16:9 aspect ratio, widescreen, cinematic anime visual novel ending CG, ' + charName + ', 根据当前终幕画面生成的英文横构图场景描述]',
      '═══════════════════════════════════'
    ].join('\n');

    const chatboxText = [
      '【🌌 周目终局结算 · 进入日系 Galgame 结局报幕演出】',
      '▸ 攻略角色：《' + charName + '》｜结局路线：' + routeMeta.badge + '（' + (reason || '世界线收束') + '）',
      '▸ 终局四维：好感(E)=' + E + ' / 肉体(P)=' + P + ' / 阶段(R)=' + R + ' / 嫉妒(I)=' + I + '｜世界时间：' + worldTime,
      '请根据我们至今为止的故事脉络，演绎本周目的终幕场景，并在回复末尾输出 [GalgameEnding|结局名=...|类型=' + (endingType || 'TE') + '|角色=' + charName + '|时间=' + worldTime + '|四维=E:' + E + '/P:' + P + '/R:' + R + '/I:' + I + '|转折=...|复盘=...|独白=...|CG=horizontal composition, 16:9 aspect ratio, widescreen, ...] 结局报幕标签。'
    ].join('\n');

    return { directorRule: directorRule, chatboxText: chatboxText };
  }

  function injectAndSendEndingPromptToChatbox(charName, ch, endingType, reason) {
    const built = buildChatboxEndingPrompt(charName, ch, endingType || 'TE', reason || '玩家主动结算周目');
    callSetPrompt(PROMPT_KEY + '_ending_director', built.directorRule, 4, 0, false);

    // 关闭掌机主面板，方便玩家直接在酒馆聊天窗口观看报幕生成
    try { closePanel(); } catch (e) {}

    const textarea = mainDoc.querySelector('#send_textarea, textarea#send_textarea, #prompt_textarea');
    const sendBtn = mainDoc.querySelector('#send_but, .fa-paper-plane#send_but, [ id="send_but" ]');

    if (textarea) {
      textarea.value = built.chatboxText;
      try { textarea.focus(); } catch (e) {}
      try {
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        if (mainWin.$ && typeof mainWin.$ === 'function') {
          mainWin.$(textarea).trigger('input').trigger('change');
        }
      } catch (e) {}

      setTimeout(function() {
        let sent = false;
        if (sendBtn && typeof sendBtn.click === 'function') {
          try {
            sendBtn.click();
            sent = true;
          } catch (e) {}
        }
        if (!sent && mainWin.$ && sendBtn) {
          try { mainWin.$(sendBtn).trigger('click'); sent = true; } catch (e) {}
        }
        if (!sent && typeof mainWin.Generate === 'function') {
          try { mainWin.Generate('normal'); sent = true; } catch (e) {}
        }
        toast(sent ? '🌌 已将周目结算提示词注入聊天框并自动发送！AI 回复后将通过内置正则渲染日系 Galgame 结局报幕' : '🌌 已将周目结算提示词填入聊天框，请点击发送按钮触发结局报幕', 'success');
      }, 160);
      return true;
    }

    // 若当前环境未找到酒馆聊天输入框，则回退为直接弹窗结算
    toast('未检测到酒馆聊天输入框，已切换为后台直接生成结局报幕', 'info');
    runEndingSettlement(charName, ch, endingType || 'TE');
    return false;
  }

  function buildChatboxEpiloguePrompt(record) {
    const charName = (record && record.charName) || '她';
    const endingTitle = (record && record.title) || (charName + '之篇 · 终末之约');
    const endingType = (record && record.endingType) || 'TE';
    const routeMeta = ENDING_ROUTE_META[endingType] || ENDING_ROUTE_META.TE;
    const keyMoment = (record && record.keyMoment) || '命运分歧点上的最终抉择';
    const summary = (record && record.summary) || '漫长的相遇与抉择，在此刻成为这一周目的最终注脚。';
    const monologue = (record && record.monologue) || '倘若时光倒流，我仍会记得与你相遇的这一刻。';
    const worldTime = (record && record.totalTime) || String(readVar('世界.时间', '未记录'));

    const directorRule = [
      '【📖 日系 Galgame 终局后日谈番外指令（本回合最高优先级）】',
      '上一回合玩家与角色「' + charName + '」已完成本周目终局结算（结局：《' + endingTitle + '》，路线：' + routeMeta.badge + '）。现在玩家点击了「查看后日谈」，请你立即在当前聊天对话内创作一篇 **5000字～8000字** 的完整结局后番外（After Story）：',
      '1. **叙事视角（核心要求）**：必须严格以角色「' + charName + '」的视角（第一人称“我”或极度贴合她内心的专属主视角）进行创作，细腻展现她在结局落幕之后的所见、所感、回忆与内心独白。',
      '2. **剧情内容与篇幅（5000～8000字完整番外）**：重点讲述《' + endingTitle + '》结局之后发生的事情——包含「序幕·终局余温」「第一幕·日常与季节流转」「第二幕·旧物与心底回响」「终幕·致未来的誓言/回望」四个自然篇章，细节丰满、情感真挚克制，总篇幅务必达到 **5000字～8000字**，绝不可敷衍缩写。',
      '3. **内置正则美化包裹格式（必须严格遵守）**：请将整篇后日谈番外完整包裹在 `<GalgameEpilogue title="自拟诗意后日谈标题" char="' + charName + '" ending="' + endingTitle + '">...此处写5000到8000字完整后日谈正文（可正常分段与使用小标题）...</GalgameEpilogue>` 标签内输出，以便脚本内置正则引擎将其渲染为日系 Galgame After Story 番外阅读卡。本回合无需输出 `[Sylveina|...]` 算分标签。'
    ].join('\n');

    const chatboxText = [
      '【📖 开启终局后日谈番外 · 《' + charName + '》视角长篇创作（5000～8000字）】',
      '▸ 承接周目结局：《' + endingTitle + '》（' + routeMeta.badge + '）｜终局时间：' + worldTime,
      '▸ 命运分歧回顾：' + keyMoment + '｜终幕独白：「' + monologue + '」',
      '▸ 请以《' + charName + '》的第一人称视角（或贴合角色内心的视角），顺着上一轮的终局结算，在当前对话内完整创作一篇 **5000字～8000字** 的结局后完整番外（讲述这个结局后面发生的故事、生活细节与内心回响），并使用 `<GalgameEpilogue title="后日谈标题" char="' + charName + '" ending="' + endingTitle + '">...完整番外正文...</GalgameEpilogue>` 标签包裹输出。'
    ].join('\n');

    return {
      directorRule: directorRule,
      chatboxText: chatboxText
    };
  }

  function injectAndSendEpiloguePromptToChatbox(record) {
    if (!record) {
      toast('未找到周目结局记录，无法发起后日谈', 'warning');
      return false;
    }
    const prompts = buildChatboxEpiloguePrompt(record);
    callSetPrompt(PROMPT_KEY + '_epilogue_director', prompts.directorRule, 1, 0, false);

    // 关闭任何打开的弹窗或掌机面板，回到公屏对话观看 AI 输出后日谈
    const modalMask = mainDoc.getElementById('moon-modal-mask');
    if (modalMask) modalMask.remove();
    const panel = mainDoc.getElementById('moon-panel');
    if (panel) panel.remove();

    const textarea = mainDoc.querySelector('#send_textarea') || mainDoc.querySelector('textarea[name="send_textarea"]');
    const sendBtn = mainDoc.querySelector('#send_but') || mainDoc.querySelector('[ data-testid="send-button" ]');

    if (textarea) {
      textarea.value = prompts.chatboxText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      try { textarea.focus(); } catch (e) {}

      setTimeout(function() {
        let sent = false;
        if (sendBtn && typeof sendBtn.click === 'function') {
          sendBtn.click();
          sent = true;
        }
        if (!sent && mainWin.$ && sendBtn) {
          try { mainWin.$(sendBtn).trigger('click'); sent = true; } catch (e) {}
        }
        if (!sent && typeof mainWin.Generate === 'function') {
          try { mainWin.Generate('normal'); sent = true; } catch (e) {}
        }
        toast(sent ? '📖 已将《' + record.charName + '》视角后日谈（5000~8000字）提示词填入聊天框并自动发送！' : '📖 已将后日谈提示词填入聊天框，请点击发送按钮开始创作', 'success');
      }, 160);
      return true;
    }

    toast('未检测到酒馆聊天输入框，已切换为弹窗生成后日谈', 'info');
    startEpilogueGenerationEngine(record.charName, record);
    return false;
  }

  function promptEndingDialog(charName, ch, endingInfo, isManual) {
    const eType = (endingInfo && endingInfo.type) || 'TE';
    const eReason = (endingInfo && endingInfo.reason) || '玩家主动选择结算周目';
    const routeMeta = ENDING_ROUTE_META[eType] || ENDING_ROUTE_META.TE;
    const html = '<div style="text-align:center;padding:8px 0">' +
      '<div style="font-size:28px">🌌</div>' +
      '<b style="color:#f9a8d4;font-size:14px;">世界线收束 · 日系 Galgame 终局报幕</b>' +
      '<div style="margin-top:8px;line-height:1.7;color:#fce7f3;">' +
        (isManual ? '即将为角色《<b>' + escapeFeatureHtml(charName) + '</b>》发起本周目的终局结算。' : '《<b>' + escapeFeatureHtml(charName) + '</b>》达成了终局条件：<b style="color:' + routeMeta.accent + ';">' + escapeFeatureHtml(routeMeta.badge) + '</b>（' + escapeFeatureHtml(eReason) + '）。') +
      '</div>' +
      '<div style="margin-top:10px;padding:9px 11px;background:#100a13;border:1px solid #f472d0;text-align:left;font-size:11px;line-height:1.7;color:#f9a8d4;">' +
        '<b>🎬 公屏结局报幕流程（内置正则美化）：</b><br>' +
        '1. 点击下方<b>「💬 注入聊天框并自动发送」</b>，系统会将周目结算提示词自动填入酒馆聊天框并发送。<br>' +
        '2. AI 撰写终幕剧情并输出 <code>[GalgameEnding|...]</code> 标签后，<b>脚本内置正则会自动将其替换为日系经典 Galgame 结局报幕（Staff Roll / Fin 演出卡）</b>！<br>' +
        '3. 报幕卡内自带<b>「✨ 查看后日谈」</b>交互按钮（点击自动填入输入框并发送，让 AI 在当前对话内以角色视角创作 <b>5000～8000字</b> 结局后完整番外），以及<b>显影横构图结局 CG、导出结算卡</b>。' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:10px;">' +
        '<button type="button" id="moon-ending-silent-btn" style="flex:1;padding:7px;font-size:11px;cursor:pointer;">⚡ 不发消息·直接弹窗生成报幕</button>' +
      '</div>' +
    '</div>';

    showModalDialogCancelable('✦ 终局报幕确认', html,
      function() {
        injectAndSendEndingPromptToChatbox(charName, ch, eType, eReason);
      },
      null,
      {
        confirmText: '💬 注入聊天框并自动发送',
        cancelText: '继续游玩',
        onOpen: function(mask) {
          const silentBtn = mask.querySelector('#moon-ending-silent-btn');
          if (silentBtn) {
            silentBtn.addEventListener('click', function() {
              closeFeatureModal(mask);
              setTimeout(function() { runEndingSettlement(charName, ch, eType); }, 160);
            });
          }
        }
      }
    );
  }

  function manualTriggerEnding(panel) {
    const data = readMvuLatest(), chars = data && data.stat_data && data.stat_data.角色 || {};
    const names = Object.keys(chars).filter(function(name) { return !isCharSkeleton(chars[name]); });
    if (!names.length) { toast('当前聊天没有可结算的角色档案', 'warning'); return; }
    const routeOptions = [
      ['TE', '✦ TRUE END · 命定真结局（默认推荐）'],
      ['HE', '✦ HAPPY END · 圆满终局'],
      ['BE', '✦ BAD END · 悲恋终局'],
      ['CageEnd', '✦ CAGE END · 槛中终局'],
      ['CustomEnd', '✦ FINALE END · 自由终幕']
    ].map(function(r) { return '<option value="' + r[0] + '">' + r[1] + '</option>'; }).join('');

    if (names.length === 1) {
      const onlyName = names[0];
      const ch = chars[onlyName];
      const autoCheck = isEndingTriggerCondition(onlyName, ch, '');
      const defaultRoute = autoCheck.triggered ? autoCheck.type : 'TE';
      promptEndingDialog(onlyName, ch, { type: defaultRoute, reason: autoCheck.triggered ? autoCheck.reason : '玩家主动选择结算周目' }, true);
      return;
    }
    const options = names.map(function(name) { return '<option value="' + escapeFeatureHtml(name) + '">' + escapeFeatureHtml(name) + '</option>'; }).join('');
    showModalDialogCancelable('🌌 选择周目结算角色与路线',
      '<label style="display:block;margin-bottom:8px;">结算角色档案<select id="moon-ending-char-select" style="width:100%;padding:8px;margin-top:4px;background:#100a13;color:#fce7f3;border:1px solid #a94d8b;">' + options + '</select></label>' +
      '<label style="display:block;">结局报幕路线<select id="moon-ending-route-select" style="width:100%;padding:8px;margin-top:4px;background:#100a13;color:#f9a8d4;border:1px solid #a94d8b;">' + routeOptions + '</select></label>',
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const selected = mask && mask.querySelector('#moon-ending-char-select') && mask.querySelector('#moon-ending-char-select').value;
        const route = (mask && mask.querySelector('#moon-ending-route-select') && mask.querySelector('#moon-ending-route-select').value) || 'TE';
        if (selected && chars[selected]) promptEndingDialog(selected, chars[selected], { type: route, reason: '玩家主动选择结算周目' }, true);
      }, null, { confirmText: '下一步', cancelText: '取消' }
    );
  }
  async function runEndingSettlement(charName, ch, endingType) {
    showLoadingDialog('正在整理本周目历程…');
    const history = collectChatHistoryContext(6000);
    const systemPrompt = '你是日系视觉小说的剧本监督。请根据提供的当前角色和聊天脉络，写一张简洁、尊重玩家设定的周目结算卡。只输出 JSON：title（结局名，最多40字）、summary（复盘，最多160字）、monologue（角色第一人称独白，最多100字）、cgPrompt（根据当前画面生成的横构图图片提示词，默认横构图：包含 horizontal composition, 16:9 aspect ratio, widescreen, cinematic anime visual novel CG，最多800字）、keyMoment（核心转折，最多120字）。不要替玩家补写行动或台词。';
    const userPrompt = '角色：' + String(charName).slice(0, 100) + '\n结局类型：' + String(endingType).slice(0, 40) + '\n四维：好感 ' + (Number(ch.好感度) || 0) + '，肉体 ' + (Number(ch.肉体值) || 0) + '，阶段 ' + (Number(ch.阶段值) || 0) + '，嫉妒 ' + (Number(ch.嫉妒值) || 0) + '\n游戏时间：' + String(readVar('世界.时间', '未记录')) + '\n\n聊天脉络：\n' + String(history && history.chat || '').slice(-6000);
    let result = null;
    try { result = extractJson(await callOpeningModel(hasValidCustomAIConfig() ? 'custom' : 'main', systemPrompt, userPrompt)); } catch (e) {}
    result = result && typeof result === 'object' && !Array.isArray(result) ? result : {};
    const title = String(result.title || charName + '之篇 · 终末之约').slice(0, 80);
    const summary = String(result.summary || '漫长的相遇与抉择，在此刻成为这一周目的最终注脚。').slice(0, 500);
    const monologue = String(result.monologue || '倘若时光倒流，我仍会记得与你相遇的这一刻。').slice(0, 300);
    let prompt = String(result.cgPrompt || ('horizontal composition, 16:9 aspect ratio, widescreen, anime visual novel ending, ' + charName + ', emotional cinematic horizontal scene')).slice(0, 2500);
    if (!/horizontal composition|16:9/i.test(prompt)) prompt = 'horizontal composition, 16:9 aspect ratio, widescreen, ' + prompt;
    const keyMoment = String(result.keyMoment || '命运交叉点上的最终抉择').slice(0, 300);
    const id = newFeatureId('ending');
    const record = { id: id, title: title, endingType: String(endingType || 'TE'), charName: charName, totalTime: String(readVar('世界.时间', '未记录')), E: Number(ch.好感度) || 0, P: Number(ch.肉体值) || 0, R: Number(ch.阶段值) || 0, I: Number(ch.嫉妒值) || 0, summary: summary, monologue: monologue, keyMoment: keyMoment, cgPrompt: prompt, createdAt: Date.now() };
    const archive = getEndingArchive(); archive.records.unshift(record); saveEndingArchive(archive);
    const item = { id: id, char: charName, title: title, desc: summary, prompt: prompt, uc: getImageGenConfig().imageNegativePrompt, imageKey: '', imageUrl: '', createdAt: record.createdAt, isEnding: true, endingType: record.endingType };
    const gallery = getGalleryList(); gallery.unshift(item); saveGalleryList(gallery);
    closeLoadingDialog();
    openGalgameEndingClearDialog(record, item);
  }
  function openGalgameEndingClearDialog(record, galleryItem) {
    bindGalgameEndingCardDelegation();
    const html = renderGalgameEndingCurtainHtml(record);
    showModalDialog('🎬 日系 Galgame 结局报幕 · 周目结算', html, null, { confirmText: '收下结局报幕卡' });
  }
  async function generateSteamShareCard(record) {
    try {
      const canvas = mainDoc.createElement('canvas'); canvas.width = 1200; canvas.height = 675;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('无法创建画布');
      const gradient = ctx.createLinearGradient(0, 0, 1200, 675); gradient.addColorStop(0, '#211020'); gradient.addColorStop(1, '#09070d'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, 675);
      ctx.strokeStyle = '#c94b9f'; ctx.lineWidth = 4; ctx.strokeRect(18, 18, 1164, 639);
      ctx.fillStyle = '#f9a8d4'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('MOON POCKET · 周目结算', 60, 80);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 42px sans-serif'; ctx.fillText(String(record.title || '终局').slice(0, 24), 60, 155);
      ctx.fillStyle = '#e9c3dc'; ctx.font = '22px sans-serif'; ctx.fillText(String(record.endingType || 'TE') + ' · ' + String(record.charName || '角色').slice(0, 30), 60, 205);
      ctx.fillStyle = '#e5d8e2'; ctx.font = '20px sans-serif';
      const lines = String(record.summary || '').match(/.{1,38}/g) || [];
      lines.slice(0, 4).forEach(function(line, index) { ctx.fillText(line, 60, 270 + index * 34); });
      ctx.fillStyle = '#f9a8d4'; ctx.font = '18px sans-serif'; ctx.fillText('E ' + record.E + '  P ' + record.P + '  R ' + record.R + '  I ' + record.I, 60, 440);
      ctx.fillStyle = '#c4b5c1'; ctx.font = 'italic 22px sans-serif'; ctx.fillText('“' + String(record.monologue || '').slice(0, 38) + '”', 60, 505);
      ctx.fillStyle = '#957f91'; ctx.font = '16px monospace'; ctx.fillText('GALGAME CARD SYSTEM · MEMORY ARCHIVE', 60, 610);
      downloadFileViaBrowser(canvas.toDataURL('image/png'), '周目结算卡_' + String(record.title || '结算').replace(/[\\/:*?"<>|]/g, '_'));
    } catch (e) { toast('结算卡导出失败：' + String(e && e.message || e), 'warning'); }
  }
  async function startEpilogueGenerationEngine(charName, record) {
    const settings = getSettings(), targetWords = Math.max(1500, Math.min(8000, Number(settings.epilogueTargetWords) || 8000));
    const chapters = [
      { title: '第一幕 · 离去之日', focus: '结局之后最初的数月，角色如何面对离别、失常与生活留下的痕迹。' },
      { title: '第二幕 · 岁月风蚀', focus: '数年流逝，角色如何带着两人共同经历的记忆继续生活。' },
      { title: '第三幕 · 终局回响', focus: '多年后的回望、最终的释怀，以及角色如何理解这段关系。' }
    ];
    let novel = '# 《' + record.title + ' · 后日谈》\n\n> 结局：' + record.endingType + ' · 角色：' + charName + '\n\n';
    showLoadingDialog('正在生成后日谈（目标约 ' + targetWords + ' 字）…');
    try {
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i]; updateLoadingDialogText('正在撰写 ' + chapter.title + '（' + (i + 1) + '/' + chapters.length + '）…');
        const systemPrompt = '你是擅长克制抒情的日系视觉小说作者。写一段约 ' + Math.ceil(targetWords / 3) + ' 字的后日谈正文。只写角色与世界，不代替玩家发言或行动。';
        const userPrompt = '角色：' + String(charName).slice(0, 100) + '\n结局：' + String(record.title).slice(0, 80) + '\n核心转折：' + String(record.keyMoment || '').slice(0, 200) + '\n角色心声：' + String(record.monologue || '').slice(0, 200) + '\n本章：' + chapter.title + '\n重点：' + chapter.focus;
        let body = await callOpeningModel('main', systemPrompt, userPrompt);
        if (typeof body !== 'string') body = body && body.content ? body.content : String(body || '');
        if (!body.trim()) throw new Error(chapter.title + '没有生成正文');
        novel += '\n\n## ' + chapter.title + '\n\n' + body.trim();
      }
      closeLoadingDialog(); openEpilogueReaderDialog(record.title, novel);
    } catch (e) { closeLoadingDialog(); toast('后日谈生成中断：' + String(e && e.message || e).slice(0, 180), 'warning'); }
  }
  function openEpilogueReaderDialog(title, text) {
    const safeTitle = escapeFeatureHtml(title);
    const html = '<div id="moon-epilogue-text" style="max-height:55vh;overflow:auto;padding:12px;background:#100a13;border:1px solid #693253;font-size:12px;line-height:1.9;white-space:pre-wrap">' + escapeFeatureHtml(text) + '</div><div style="margin-top:9px;text-align:right"><button id="moon-export-epilogue">导出 TXT</button></div>';
    showModalDialog('📖 后日谈 · 《' + safeTitle + '》', html, null, { confirmText: '阅读完毕', onOpen: function(mask) {
      mask.querySelector('#moon-export-epilogue').addEventListener('click', function() {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = (mainWin.URL || URL).createObjectURL(blob);
        downloadFileViaBrowser(url, '后日谈_' + String(title || '结局').replace(/[\\/:*?"<>|]/g, '_') + '.txt');
        setTimeout(function() { try { (mainWin.URL || URL).revokeObjectURL(url); } catch (e) {} }, 5000);
      });
    } });
  }

  function renderLcdScreen(panel, mode, antisl, extraSetting, cardMode, pacing, fanficOn) {
    const data = readMvuLatest();
    const stat = data && data.stat_data || {};
    const world = stat.世界 || {};
    const chars = stat.角色 || {};
    const names = Object.keys(chars).filter(function(name) { return !isCharSkeleton(chars[name]); });
    const selected = names.indexOf(panel.dataset.lcdCharacter || '') >= 0 ? panel.dataset.lcdCharacter : (names[0] || '');
    if (selected) panel.dataset.lcdCharacter = selected;
    const ch = selected ? chars[selected] : null;
    const modeMeta = LUNAR_META[mode] || LUNAR_META.hell;
    const hasApi = hasValidCustomAIConfig();
    const apiModel = hasApi ? getCustomAIConfig().model : '未设';
    const selections = [
      '锚定:' + (antisl ? '开' : '关'), 'AI:' + (hasApi ? '外接' : '主模'),
      '卡组:' + (cardMode === 'multi' ? '多人' : '单人'), '安全锁:' + (getSafetyLock() ? '开' : '关'),
      '节奏:' + (pacing === 'Adi' ? '慢' : pacing === 'All' ? '快' : '中'), '同人:' + (fanficOn ? '开' : '关')
    ];
    const options = names.map(function(name) { return '<option value="' + lcdEscape(name) + '"' + (name === selected ? ' selected' : '') + '>' + lcdEscape(name) + '</option>'; }).join('');
    const activePage = Math.max(0, Math.min(3, parseInt(panel.dataset.lcdPage || '0', 10) || 0));
    const pageNames = ['总览', '角色', '事件', '占用'];
    const shortLabels = ['01 总览', '02 角色', '03 事件', '04 占用'];
    function calcBar(val, maxVal) {
      const pct = Math.max(0, Math.min(100, Math.round(((Number(val) || 0) / (maxVal || 100)) * 100)));
      return '<div class="mp-rpg-stat-bar"><div class="mp-rpg-stat-fill" style="width:' + pct + '%;"></div></div>';
    }
    const eVal = Number(ch && ch.好感度) || 0;
    const pVal = Number(ch && ch.肉体值) || 0;
    const rVal = Number(ch && ch.阶段值) || 0;
    const iVal = Number(ch && ch.嫉妒值) || 0;
    const stageInfo = ch ? getRStageFromE(eVal) : { name: '初识' };

    const quickCharSummary = ch
      ? '<div style="padding:6px 8px;margin-top:6px;border:1px solid #151d14;font-size:11.5px;line-height:1.4;background:rgba(21,29,20,0.06);">' +
          '<div style="font-weight:bold;margin-bottom:4px;display:flex;justify-content:space-between;border-bottom:1px solid rgba(21,29,20,0.4);padding-bottom:3px;">' +
            '<span>♥ 目标：' + lcdEscape(selected) + '</span>' +
            '<span>' + lcdEscape(stageInfo.name) + '</span>' +
          '</div>' +
          '<div class="mp-rpg-stat-row"><span class="mp-rpg-stat-label">[E] 好感度</span>' + calcBar(eVal + 100, 200) + '<span class="mp-rpg-stat-val">' + eVal.toFixed(1) + '</span></div>' +
          '<div class="mp-rpg-stat-row"><span class="mp-rpg-stat-label">[P] 肉体值</span>' + calcBar(pVal, 100) + '<span class="mp-rpg-stat-val">' + pVal.toFixed(0) + '</span></div>' +
          '<div class="mp-rpg-stat-row"><span class="mp-rpg-stat-label">[R] 阶段门</span>' + calcBar(rVal, 5) + '<span class="mp-rpg-stat-val">Lv.' + rVal + '</span></div>' +
          '<div class="mp-rpg-stat-row"><span class="mp-rpg-stat-label">[I] 嫉妒值</span>' + calcBar(iVal, 100) + '<span class="mp-rpg-stat-val">' + iVal.toFixed(0) + '</span></div>' +
        '</div>'
      : '<div class="mp-lcd-empty" style="padding:12px 6px;">还没有角色档案<br>点下面「▶ 开始游戏」→「🚀 开局适配」就能建</div>';

    return '<div class="mp-console-bezel"><span class="mp-power-led"><i></i>POWER</span><span>DOT MATRIX · MOON POCKET</span><span>API:' + lcdEscape(String(apiModel).slice(0, 12)) + '</span></div>' +
      '<div class="mp-lcd-screen"><div class="mp-lcd-screen-head"><span>MOON POCKET · STATUS</span><b>MONO LCD</b></div>' +
      '<div class="mp-lcd-quick-tabs" role="tablist" aria-label="液晶屏直达页签">' +
      shortLabels.map(function(lb, idx) {
        return '<button type="button" class="mp-lcd-quick-tab' + (activePage === idx ? ' active' : '') + '" data-lcd-tab="' + idx + '">' + lb + '</button>';
      }).join('') +
      '</div>' +
      '<div class="mp-lcd-pages" data-lcd-pages>' +
      '<section class="mp-lcd-page' + (activePage === 0 ? ' active' : '') + '" data-lcd-page="0" data-page-label="总览">' +
      '<div class="mp-lcd-world-time">WORLD TIME　' + lcdEscape(world.时间 || '还没开始') + '</div>' +
      '<div class="mp-lcd-difficulty"><b>游戏难度</b>' + renderPixelMoonIcon(mode) + '<strong>' + lcdEscape(modeMeta.name + ' · ' + modeMeta.title) + '</strong></div>' +
      '<div class="mp-lcd-selection" style="min-height:auto;"><b>当前设定</b><span>' + selections.map(lcdEscape).join('　') + '</span></div>' +
      quickCharSummary + '</section>' +
      '<section class="mp-lcd-page' + (activePage === 1 ? ' active' : '') + '" data-lcd-page="1" data-page-label="角色">' +
      '<div class="mp-lcd-character-head"><span>角色档案 / CHARACTER FILE</span>' +
      (names.length ? '<select class="mp-lcd-character-select" aria-label="选择角色档案">' + options + '</select>' : '') + '</div>' +
      '<div class="mp-lcd-character-view">' + renderLcdCharacterDetails(ch) + '</div></section>' +
      '<section class="mp-lcd-page' + (activePage === 2 ? ' active' : '') + '" data-lcd-page="2" data-page-label="事件">' +
      '<div class="mp-lcd-page-title">EVENT DIRECTOR · 事件进度</div><div id="moon-event-status" class="mp-lcd-event-list">' + renderEventStatusCard() + '</div></section>' +
      '<section class="mp-lcd-page' + (activePage === 3 ? ' active' : '') + '" data-lcd-page="3" data-page-label="占用">' +
      '<div class="mp-lcd-token-head"><span>MEMORY · 字数占用</span><button type="button" class="mp-lcd-small-btn" id="moon-token-refresh">↻ 刷新</button></div>' +
      '<div id="moon-token-box">点右上「↻ 刷新」开始算</div></section></div>' +
      '<nav class="mp-lcd-page-nav" aria-label="显示屏翻页">' +
      '<button type="button" data-lcd-page-step="-1" aria-label="上一页">◀</button>' +
      '<div class="mp-lcd-page-indicator"><b data-lcd-page-label>' + pageNames[activePage] + '</b><span data-lcd-page-count>' + String(activePage + 1).padStart(2, '0') + ' / 04</span></div>' +
      '<button type="button" data-lcd-page-step="1" aria-label="下一页">▶</button></nav>' +
      '<div class="mp-lcd-screen-foot">点上方 [01~04] 或 ◀ ▶ 翻页</div></div>';
  }

  function setLcdPage(panel, page) {
    const pages = Array.prototype.slice.call(panel.querySelectorAll('.mp-lcd-page'));
    if (!pages.length) return;
    const next = (Number(page) % pages.length + pages.length) % pages.length;
    panel.dataset.lcdPage = String(next);
    pages.forEach(function(el, i) {
      const active = i === next;
      el.classList.toggle('active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    panel.querySelectorAll('[data-lcd-tab]').forEach(function(btn) {
      btn.classList.toggle('active', Number(btn.getAttribute('data-lcd-tab')) === next);
    });
    const label = panel.querySelector('[data-lcd-page-label]');
    const count = panel.querySelector('[data-lcd-page-count]');
    if (label) label.textContent = pages[next].getAttribute('data-page-label') || '';
    if (count) count.textContent = String(next + 1).padStart(2, '0') + ' / ' + String(pages.length).padStart(2, '0');
  }

  function bindLcdPageControls(panel) {
    const pages = panel.querySelectorAll('.mp-lcd-page');
    if (!pages.length) return;
    panel.querySelectorAll('[data-lcd-tab]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setLcdPage(panel, Number(btn.getAttribute('data-lcd-tab')) || 0);
      });
    });
    panel.querySelectorAll('[data-lcd-page-step]').forEach(function(button) {
      button.addEventListener('click', function() {
        setLcdPage(panel, (Number(panel.dataset.lcdPage) || 0) + Number(button.getAttribute('data-lcd-page-step')));
      });
    });
    const surface = panel.querySelector('[data-lcd-pages]');
    if (surface) {
      let startX = 0, startY = 0;
      surface.addEventListener('touchstart', function(event) {
        const touch = event.changedTouches && event.changedTouches[0];
        if (touch) { startX = touch.clientX; startY = touch.clientY; }
      }, { passive: true });
      surface.addEventListener('touchend', function(event) {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch || (event.target && event.target.closest && event.target.closest('button,select'))) return;
        const dx = touch.clientX - startX, dy = touch.clientY - startY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          setLcdPage(panel, (Number(panel.dataset.lcdPage) || 0) + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });
    }
    setLcdPage(panel, Number(panel.dataset.lcdPage) || 0);
  }

