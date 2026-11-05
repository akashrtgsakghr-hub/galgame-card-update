/* 86-gal-core.js —— Galgame 沉浸模式：核心配置、聊天隔离状态、标签注册表与映射校验。
   设计原则：
   1. 不改酒馆聊天记录，所有状态只存在本模块自己的 chatMetadata 键里；
   2. 所有「展示层」判断都在这里集中，UI 只负责画；
   3. 标签映射与内置标准分离，玩家可以把自己的预设标签映射进来。 */

  /* ── 存储键（全部带 gal 前缀，避免和数值系统撞车） ───────── */
  const GAL_SETTINGS_KEY = 'moon_phase_gal_settings_v1';
  const GAL_STATE_KEY = 'moon_phase_gal_state_v1';
  const GAL_TAGMAP_KEY = 'moon_phase_gal_tagmap_v1';
  const GAL_SAVES_KEY = 'moon_phase_gal_saves_v1';
  const GAL_MEMORY_KEY = 'moon_phase_gal_memory_v1';
  const GAL_ASSET_KEY = 'moon_phase_gal_assets_v1';
  const GAL_PROMPT_KEY = 'moon_phase_time_tracker_gal_memory';
  const GAL_ROOT_ID = 'moon-gal-root';
  const GAL_STYLE_ID = 'moon-gal-style';

  /* ── 默认设置（全局，不含聊天相关状态） ───────────────────── */
  const GAL_DEFAULT_SETTINGS = {
    boxOpacity: 0.72,          // 对话框底色不透明度
    fontFamily: '',            // 空 = 跟随酒馆正文字体
    fontSize: 17,              // px
    lineHeight: 1.75,
    textColor: '#f8fafc',
    readingSpeed: 26,          // 打字机速度：每字毫秒，0 = 立即整段
    autoPlayDelay: 2600,       // 自动播放停留毫秒
    choiceMode: 'send',        // send = 点选项直接发；fill = 只填进输入框
    imageMode: 'builtin',      // builtin | external | manual | off
    externalImageAdapter: 'auto',
    maxImagesPerTurn: 1,
    memoryMode: 'builtin',     // builtin | external | off
    memoryStageEvery: 3,
    memoryLongEvery: 12,
    memoryInject: true,
    hideHints: false,
    showSpeaker: true,
    typewriter: true
  };

  /* ── 内部标准标签类型 ───────────────────────────────────── */
  const GAL_TAG_TYPES = [
    { id: 'text', name: '正文 / 对话', required: true, hint: '角色的台词与叙述主体，缺了它整条回复会被当成纯文本' },
    { id: 'choice', name: '选项', required: true, hint: '必须靠明确标记，普通数字列表不会被当成选项' },
    { id: 'name', name: '角色名称', required: false, hint: '说话人名字栏' },
    { id: 'narration', name: '旁白', required: false, hint: '无说话人的环境描写' },
    { id: 'thought', name: '内心独白', required: false, hint: '斜体或心声块' },
    { id: 'scene', name: '场景提示', required: false, hint: '给背景切换用的场景关键词' },
    { id: 'bg', name: '背景指令', required: false, hint: '直接指定背景图或背景名' },
    { id: 'sprite', name: '立绘指令', required: false, hint: '指定角色 / 表情' },
    { id: 'cg', name: 'CG 指令', required: false, hint: '把这一轮标记为事件 CG' }
  ];

  /* ── 内置默认映射规则 ────────────────────────────────────
     mode 说明：
       xml      —— <pattern>内容</pattern>
       block    —— 以 pattern 起头的一整段，段内每一行都是一条选项
       wrap     —— pattern 是一对括号，如「（）」，括号内为对应类型
       prefix   —— 行首是 pattern，则该行剩余部分为对应类型
       speaker  —— 「名字：台词」结构，冒号前为名字，冒号后为正文
       regex    —— 自定义正则，捕获组 1 为内容 */
  const GAL_DEFAULT_RULES = [
    { id: 'xml_speaker', type: 'name', mode: 'xml', pattern: 'speaker', enabled: true },
    { id: 'xml_text', type: 'text', mode: 'xml', pattern: 'text', enabled: true },
    { id: 'xml_narration', type: 'narration', mode: 'xml', pattern: 'narration', enabled: true },
    { id: 'xml_thought', type: 'thought', mode: 'xml', pattern: 'thought', enabled: true },
    { id: 'xml_scene', type: 'scene', mode: 'xml', pattern: 'scene', enabled: true },
    { id: 'xml_bg', type: 'bg', mode: 'xml', pattern: 'bg', enabled: true },
    { id: 'xml_sprite', type: 'sprite', mode: 'xml', pattern: 'sprite', enabled: true },
    { id: 'xml_cg', type: 'cg', mode: 'xml', pattern: 'cg', enabled: true },
    { id: 'xml_choices', type: 'choice', mode: 'xml', pattern: 'choices', enabled: true },
    { id: 'blk_choice_cn', type: 'choice', mode: 'block', pattern: '选项', enabled: true },
    { id: 'blk_choice_cn2', type: 'choice', mode: 'block', pattern: '选择', enabled: true },
    { id: 'blk_choice_en', type: 'choice', mode: 'block', pattern: 'choices', enabled: true },
    { id: 'wrap_narration_cn', type: 'narration', mode: 'wrap', pattern: '（）', enabled: true },
    { id: 'wrap_narration_en', type: 'narration', mode: 'wrap', pattern: '()', enabled: true },
    { id: 'prefix_thought_cn', type: 'thought', mode: 'prefix', pattern: '心声：', enabled: true },
    { id: 'prefix_thought_cn2', type: 'thought', mode: 'prefix', pattern: '内心：', enabled: true },
    { id: 'speaker_colon', type: 'name', mode: 'speaker', pattern: '', enabled: true }
  ];

  function galDefaultRules() {
    return GAL_DEFAULT_RULES.map(function(r) { return Object.assign({}, r); });
  }
  function galTagTypeName(type) {
    for (let i = 0; i < GAL_TAG_TYPES.length; i++) if (GAL_TAG_TYPES[i].id === type) return GAL_TAG_TYPES[i].name;
    return type;
  }
  function galEscape(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function(c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function galClamp(n, lo, hi) {
    const v = Number(n);
    if (!isFinite(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
  }

  /* ── 全局设置读写 ──────────────────────────────────────── */
  function galGetSettings() {
    let raw = null;
    try { const ls = getStorage(); raw = ls && ls.getItem(GAL_SETTINGS_KEY); } catch (e) {}
    let parsed = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = null; }
    const s = Object.assign({}, GAL_DEFAULT_SETTINGS, parsed && typeof parsed === 'object' ? parsed : {});
    s.boxOpacity = galClamp(s.boxOpacity, 0.2, 1);
    s.fontSize = galClamp(s.fontSize, 12, 30);
    s.lineHeight = galClamp(s.lineHeight, 1.2, 2.6);
    s.readingSpeed = galClamp(s.readingSpeed, 0, 120);
    s.autoPlayDelay = galClamp(s.autoPlayDelay, 800, 12000);
    if (['builtin', 'external', 'manual', 'off'].indexOf(s.imageMode) < 0) s.imageMode = 'builtin';
    if (['builtin', 'external', 'off'].indexOf(s.memoryMode) < 0) s.memoryMode = 'builtin';
    if (s.choiceMode !== 'fill') s.choiceMode = 'send';
    return s;
  }
  function galSaveSettings(patch) {
    const next = Object.assign({}, galGetSettings(), patch && typeof patch === 'object' ? patch : {});
    try { const ls = getStorage(); if (ls) ls.setItem(GAL_SETTINGS_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  }
  function galGetImageMode() { return galGetSettings().imageMode; }
  function galSetImageMode(mode) {
    const ok = ['builtin', 'external', 'manual', 'off'];
    const next = ok.indexOf(mode) >= 0 ? mode : 'builtin';
    galSaveSettings({ imageMode: next });
    // 切到非内置时必须立刻掐掉正在跑的内置生图，避免"偷偷调用"
    if (next !== 'builtin') galAbortBuiltinImageTasks();
    return next;
  }
  function galGetMemoryMode() { return galGetSettings().memoryMode; }
  function galSetMemoryMode(mode) {
    const ok = ['builtin', 'external', 'off'];
    const next = ok.indexOf(mode) >= 0 ? mode : 'builtin';
    galSaveSettings({ memoryMode: next });
    if (next !== 'builtin') { try { callSetPrompt(GAL_PROMPT_KEY, '', 0, 0, false); } catch (e) {} }
    if (next === 'builtin') { try { injectGalMemoryPrompt(); } catch (e) {} }
    return next;
  }

  /* ── 聊天级状态（切聊天自动隔离） ───────────────────────── */
  function galDefaultState() {
    return {
      version: 1,
      on: false,            // 当前聊天是否处于沉浸模式
      floor: -1,            // 当前展示的消息下标
      page: 0,              // 当前页
      pages: {},            // { 楼层键: { p, total, readMax } }
      view: { bg: '', cg: '', sprites: {}, expressions: {} },
      lastImageFloor: -1,
      updatedAt: 0
    };
  }
  function galGetState() {
    const raw = readChatFeatureValue(GAL_STATE_KEY, null);
    const st = Object.assign(galDefaultState(), raw && typeof raw === 'object' ? raw : {});
    if (!st.pages || typeof st.pages !== 'object') st.pages = {};
    if (!st.view || typeof st.view !== 'object') st.view = { bg: '', cg: '', sprites: {}, expressions: {} };
    if (!st.view.sprites || typeof st.view.sprites !== 'object') st.view.sprites = {};
    if (!st.view.expressions || typeof st.view.expressions !== 'object') st.view.expressions = {};
    return st;
  }
  function galSetState(st) {
    const next = Object.assign(galDefaultState(), st || {});
    next.updatedAt = Date.now();
    writeChatFeatureValue(GAL_STATE_KEY, next);
    return next;
  }
  function galPatchState(patch) {
    return galSetState(Object.assign(galGetState(), patch || {}));
  }
  function galIsOn() { return galGetState().on === true; }

  /* 楼层键：同一楼层 + 同一 swipe 视为同一段阅读进度。
     swipe 变了就是另一条回复，进度必须分开记，否则重 roll 会串页。 */
  function galFloorKey(idx, swipeId) {
    return String(idx) + '#' + String(swipeId == null ? 0 : swipeId);
  }
  function galGetProgress(idx, swipeId) {
    const st = galGetState();
    const rec = st.pages[galFloorKey(idx, swipeId)];
    if (!rec || typeof rec !== 'object') return { p: 0, total: 0, readMax: -1 };
    return { p: Math.max(0, Number(rec.p) || 0), total: Math.max(0, Number(rec.total) || 0), readMax: Number.isFinite(Number(rec.readMax)) ? Number(rec.readMax) : -1 };
  }
  function galSetProgress(idx, swipeId, patch) {
    const st = galGetState();
    const key = galFloorKey(idx, swipeId);
    const cur = st.pages[key] || { p: 0, total: 0, readMax: -1 };
    st.pages[key] = Object.assign({}, cur, patch || {});
    // 楼层记录最多留 400 条，防止长聊天把 metadata 撑爆
    const keys = Object.keys(st.pages);
    if (keys.length > 400) {
      keys.sort(function(a, b) { return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); });
      for (let i = 0; i < keys.length - 400; i++) delete st.pages[keys[i]];
    }
    galSetState(st);
    return st.pages[key];
  }
  function galClearAllProgress() {
    const st = galGetState();
    st.pages = {};
    st.page = 0;
    galSetState(st);
  }

  /* ── 标签映射：预设库 + 每聊天指派 ───────────────────────── */
  function galLoadTagmapStore() {
    let raw = null;
    try { const ls = getStorage(); raw = ls && ls.getItem(GAL_TAGMAP_KEY); } catch (e) {}
    let parsed = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = null; }
    if (!parsed || typeof parsed !== 'object' || !parsed.presets || typeof parsed.presets !== 'object') {
      parsed = { version: 1, presets: {}, assign: {} };
    }
    if (!parsed.assign || typeof parsed.assign !== 'object') parsed.assign = {};
    // 内置预设必须永远存在，且 id 固定
    if (!parsed.presets.gal_default) {
      parsed.presets.gal_default = { id: 'gal_default', name: '🌙 月相标准（默认）', rules: galDefaultRules(), builtin: true };
    }
    return parsed;
  }
  function galSaveTagmapStore(store) {
    try { const ls = getStorage(); if (ls) ls.setItem(GAL_TAGMAP_KEY, JSON.stringify(store)); return true; } catch (e) { return false; }
  }
  function galCurrentChatKey() {
    try { const info = getCurrentChatInfo(); return (info.chatId || '') + '|' + (info.avatar || ''); } catch (e) { return ''; }
  }
  function galGetTagmapPresetId() {
    const store = galLoadTagmapStore();
    const chatKey = galCurrentChatKey();
    const assigned = chatKey ? store.assign[chatKey] : '';
    if (assigned && store.presets[assigned]) return assigned;
    return 'gal_default';
  }
  function galGetTagmap() {
    const store = galLoadTagmapStore();
    const id = galGetTagmapPresetId();
    const preset = store.presets[id] || store.presets.gal_default;
    const rules = Array.isArray(preset.rules) && preset.rules.length ? preset.rules : galDefaultRules();
    return rules.map(function(r) { return Object.assign({}, r); });
  }
  function galAssignTagmap(presetId) {
    const store = galLoadTagmapStore();
    if (!store.presets[presetId]) return false;
    const chatKey = galCurrentChatKey();
    if (!chatKey) return false;
    store.assign[chatKey] = presetId;
    return galSaveTagmapStore(store);
  }
  function galNewPresetId() { return 'galmap_' + Date.now() + '_' + Math.floor(Math.random() * 100000); }
  function galSavePreset(preset) {
    if (!preset || !preset.id) return false;
    const store = galLoadTagmapStore();
    if (store.presets[preset.id] && store.presets[preset.id].builtin) return false;
    store.presets[preset.id] = { id: preset.id, name: String(preset.name || '未命名映射').slice(0, 40), rules: Array.isArray(preset.rules) ? preset.rules : galDefaultRules() };
    return galSaveTagmapStore(store);
  }
  function galDeletePreset(presetId) {
    if (!presetId || presetId === 'gal_default') return false;
    const store = galLoadTagmapStore();
    if (!store.presets[presetId]) return false;
    const wasAssigned = Object.keys(store.assign).some(function(k) { return store.assign[k] === presetId; });
    delete store.presets[presetId];
    Object.keys(store.assign).forEach(function(k) { if (store.assign[k] === presetId) store.assign[k] = 'gal_default'; });
    galSaveTagmapStore(store);
    return { deleted: true, reassigned: wasAssigned };
  }
  function galDuplicatePreset(presetId) {
    const store = galLoadTagmapStore();
    const src = store.presets[presetId];
    if (!src) return null;
    const copy = { id: galNewPresetId(), name: String(src.name || '映射') + ' 副本', rules: (src.rules || galDefaultRules()).map(function(r) { return Object.assign({}, r); }) };
    store.presets[copy.id] = copy;
    galSaveTagmapStore(store);
    return copy;
  }

  /* ── 映射校验：重复 / 冲突 / 缺必要项 ───────────────────── */
  function galRuleLabel(rule) {
    const mode = rule.mode || 'xml';
    if (mode === 'xml') return '<' + rule.pattern + '>';
    if (mode === 'block') return '【' + rule.pattern + '】段';
    if (mode === 'wrap') return rule.pattern;
    if (mode === 'prefix') return '行首「' + rule.pattern + '」';
    if (mode === 'speaker') return '「名字：台词」';
    if (mode === 'regex') return '/' + String(rule.pattern || '').slice(0, 28) + '/';
    return String(rule.pattern || '');
  }
  function galValidateTagmap(rules) {
    const list = Array.isArray(rules) ? rules : [];
    const problems = [];
    const enabled = list.filter(function(r) { return r && r.enabled !== false; });
    const seen = {};
    enabled.forEach(function(r) {
      if (!r.type) { problems.push({ level: 'error', text: '有一条规则没有指定映射目标' }); return; }
      const mode = r.mode || 'xml';
      const pattern = String(r.pattern == null ? '' : r.pattern);
      if (mode !== 'speaker' && !pattern.trim()) {
        problems.push({ level: 'error', text: '「' + galTagTypeName(r.type) + '」的匹配内容是空的' });
        return;
      }
      if (mode === 'wrap' && pattern.length !== 2) {
        problems.push({ level: 'error', text: '括号类映射必须是两个字符（例如「（）」），当前是「' + pattern + '」' });
      }
      if (mode === 'regex') {
        try { new RegExp(pattern); } catch (e) {
          problems.push({ level: 'error', text: '正则写错了：' + String(e && e.message || e) });
        }
      }
      const key = mode + '::' + pattern;
      if (seen[key]) {
        if (seen[key] === r.type) problems.push({ level: 'error', text: '重复映射：' + galRuleLabel(r) + ' 被两条规则同时指向「' + galTagTypeName(r.type) + '」' });
        else problems.push({ level: 'error', text: '冲突映射：' + galRuleLabel(r) + ' 同时被指定为「' + galTagTypeName(seen[key]) + '」和「' + galTagTypeName(r.type) + '」' });
      } else {
        seen[key] = r.type;
      }
    });
    GAL_TAG_TYPES.forEach(function(t) {
      if (!t.required) return;
      if (!enabled.some(function(r) { return r.type === t.id; })) {
        problems.push({ level: 'error', text: '缺少必要映射：' + t.name + '（' + t.hint + '）' });
      }
    });
    if (!enabled.some(function(r) { return r.type === 'text'; })) {
      problems.push({ level: 'warn', text: '没有「正文」映射时，整条回复会退化成纯文本展示，选项将无法解析' });
    }
    return { ok: problems.filter(function(p) { return p.level === 'error'; }).length === 0, problems: problems };
  }
  function galTagmapHint() {
    const id = galGetTagmapPresetId();
    const store = galLoadTagmapStore();
    const preset = store.presets[id] || store.presets.gal_default;
    const rules = preset.rules || galDefaultRules();
    const v = galValidateTagmap(rules);
    const enabledCount = rules.filter(function(r) { return r.enabled !== false; }).length;
    return {
      presetId: id,
      presetName: preset.name || '月相标准',
      enabledCount: enabledCount,
      total: rules.length,
      ok: v.ok,
      problems: v.problems
    };
  }

  /* ── 资源（背景 / 立绘 / CG）索引：只存引用，不复制文件 ──── */
  function galGetAssetStore() {
    const raw = readChatFeatureValue(GAL_ASSET_KEY, null);
    const st = raw && typeof raw === 'object' ? raw : {};
    return {
      bg: st.bg && typeof st.bg === 'object' ? st.bg : {},
      sprite: st.sprite && typeof st.sprite === 'object' ? st.sprite : {},
      cg: st.cg && typeof st.cg === 'object' ? st.cg : {}
    };
  }
  function galSaveAssetStore(store) {
    writeChatFeatureValue(GAL_ASSET_KEY, store);
    return store;
  }
  function galUpsertAsset(kind, name, value) {
    const store = galGetAssetStore();
    if (!store[kind]) store[kind] = {};
    const key = String(name || '').trim().slice(0, 40) || ('默认' + kind);
    if (!value || !String(value).trim()) delete store[kind][key];
    else store[kind][key] = { url: String(value).trim(), at: Date.now() };
    galSaveAssetStore(store);
    return store;
  }
  function galResolveAsset(kind, name) {
    const store = galGetAssetStore();
    const map = store[kind] || {};
    const key = String(name || '').trim();
    if (key && map[key] && map[key].url) return map[key].url;
    // 立绘支持「角色|表情」两级，找不到表情就退回角色默认
    if (kind === 'sprite' && key.indexOf('|') >= 0) {
      const charOnly = key.split('|')[0];
      if (map[charOnly] && map[charOnly].url) return map[charOnly].url;
    }
    if (map['默认'] && map['默认'].url) return map['默认'].url;
    return '';
  }
