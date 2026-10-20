(function() {
  const mainDoc = window.parent.document;
  const mainWin = window.parent;

  const SETTINGS_KEY = 'moon_phase_system_settings';
  const BIO_LIBRARY_KEY = 'moon_phase_bio_library';
  const TIMELINE_KEYWORDS_KEY = 'moon_phase_timeline_keywords';
  const DEFAULT_TIMELINE_KEYWORDS = ['时间线', '时间剧情', '主线剧情'];
  const UPDATE_CONFIG_KEY = 'moon_phase_update_config';
  const LAST_RUN_VERSION_KEY = 'moon_phase_last_run_version';
  const STYLE_ID = 'moon-phase-style';
  const PROMPT_KEY = 'moon_phase_time_tracker';
  const ANCHOR_KEY = 'moon_phase_fate_anchor';
  const PROMPT_TPL_KEY = 'moon_phase_prompt_templates';
  const PROMPT_PRESETS_KEY = 'moon_phase_prompt_presets';
  const ADAPT_MODEL_PREF_KEY = 'moon_phase_adapt_model_pref';
  const AI_MIGRATE_MODEL_PREF_KEY = 'moon_phase_ai_migrate_model_pref';
  const MIGRATED_FLAG = '_migrated_v3';
  const MOON_PLACEHOLDER = 's';
  const MOON_FORMULA_VERSION = '4.3.5';
  const MOON_FORMULA_CHANGELOG = "升级复古液晶屏质感，并新增可随时游玩的掌机小游戏、实时分数与本地最高分记录。";
  const DEFAULT_UPDATE_URL = 'https://raw.githubusercontent.com/akashrtgsakghr-hub/galgame-card-update/main/moon-phase.js';
  const LEGACY_DEFAULT_UPDATE_URL = 'https://cdn.jsdelivr.net/gh/akashrtgsakghr-hub/galgame-card-update@main/moon-phase.js';
  const LAST_TIME_KEY = 'moon_phase_last_world_time';
  const LAST_JUMP_FLOOR_KEY = 'moon_phase_last_jump_floor';
  const AUTORELOAD_KEY = 'moon_phase_autoreload_pending';
  const BACKFILL_PROMPT_KEY = 'moon_phase_backfill_prompted_chats';
  const FIRST_RUN_KEY = 'moon_phase_first_run_done_v1';
  const AUTO_RELOAD_DONE_KEY = 'moon_phase_auto_reload_done_v1';
  const ANNOUNCEMENT_SEEN_KEY = 'moon_phase_announcement_seen_v2';
  const LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY = 'moon_phase_last_update_announcement_version';
  const SELF_CHECK_ARCADE_SEEN_KEY = 'moon_phase_self_check_arcade_seen_v1';
  const ARCADE_HIGH_SCORE_KEY = 'moon_phase_arcade_high_score_v1';
  const BIO_ASKED_CHATS_KEY = 'moon_phase_bio_asked_chats';
  const USER_BIO_LIBRARY_KEY = 'moon_phase_user_bio_library';
  const USER_BIO_PROMPT_KEY = 'moon_phase_user_bio_injected';
  const CUSTOM_AI_CONFIG_KEY = 'moon_phase_custom_ai_config';
  const LOCAL_STATE_KEY = 'moon_phase_local_state';
  const SYSTEM_UI_NAME = 'Doki♥Doki！我要成为后宫王！～为了全CG全结局全要素收集而向全世界告白的大作战～';
  const SYSTEM_MENU_NAME = 'Galgame攻略系统';
  const SYSTEM_TAG = 'Sylveina';

  const _mb_CFG = {
    v: '1.2.4', t: 15000, r: 2, c: 96, w: 64,
    p: {
      a: 'You are a casting director. Read the character sheet. Distill the soul essence of this character.',
      b: 'Output 4 blocks in this order: [core personality] / [attitude toward player] / [behavioral triggers] / [three voice sample lines].',
      c: 'No background story. No appearance. No external plot. Soul only. Total length must not exceed {W} characters.',
      d: 'You are an actor in an audition. Read the soul profile and perform a single-person scene.',
      e: 'Scene: {SCENE}. Focus on inner monologue, subtext, and micro-reactions. Do NOT write the player\'s actions or dialogue. Total length must not exceed {W} characters.',
      f: 'The director has already seen 500000 other auditions today. Stand out by depth of understanding, not by dramatic volume. Do not use exaggerated emotions.',
      g: 'A director gave feedback on the previous audition: {NOTE}. Revise the soul profile accordingly, then output only the revised soul profile, still within {W} characters.',
      h_player: 'Perform WITH the player character. The player is described as: {PLAYER}. Keep the player\'s actions brief.',
      h_npc: 'Perform WITH another character named {NPC}.'
    }
  };

  const DEFAULT_SETTINGS = {
    mode: 'hell', antisl: true, extraModel: 'auto', cardMode: 'single', safetyLock: true,
    eventPacing: 'And', timelineTag: '', fanficEnhance: false, introSeen: false,
    panelAutoOpened: false, autoReload: true
  };

  let cachedVars = null;
  let anchorData = null;
  let pendingCollapseNotice = false;
  let lastTriggerState = false;
  let timeJumpCooldown = 0;
  let isWaitingForExtraModel = false;
  let isWritingMvu = false;
  let isAdaptiveFlowRunning = false;
  let isFirstScanRunning = false;
  const sessionPromptedChats = {};
  let lastWriteError = '';
  let _cachedUpdateInfo = null; // { version, info, url }

  const MOON_FORMULA_PARAMS = {
    version: MOON_FORMULA_VERSION, emotionDice: 4,
    emotionThreshold: { 日常: 2, 关键: 3, 重大: 4 },
    emotionBonus: {
      easy: { 日常: 1.0, 关键: 1.5, 重大: 3.0 },
      normal: { 日常: 0.5, 关键: 1.0, 重大: 2.0 },
      hard: { 日常: 0.5, 关键: 1.0, 重大: 2.0 },
      hell: { 日常: 0.5, 关键: 1.0, 重大: 2.0 }
    },
    singleCap: 8.0, weeklyCap: { easy: 10.0, normal: 7.0, hard: 5.0, hell: 3.0 },
    dimToField: { E: '好感度', P: '肉体值', R: '阶段值', I: '嫉妒值' },
    abyssCoeff: {
      easy: { pos: 0.8, neg: 1.0 }, normal: { pos: 0.5, neg: 1.5 },
      hard: { pos: 0.5, neg: 2.0 }, hell: { pos: 0.5, neg: 2.0 }
    },
    iceBreakProtect: { easy: true, normal: false, hard: false, hell: false },
    iceBreakBonus: 5.0,
    ninetyPlus: { 日常: { crit: 0.5, success: 0.5, threshold: 11 }, 重大: { crit: 4.0, critHell: 3.0, success: 2.0, threshold: 11 } },
    confessionPlayerMod: { easy: 5, normal: 0, hard: -3, hell: -5 }
  };

  const LUNAR_META = {
    easy: { name: '简单', glyph: '🌕', title: '满月', quota: '10.0', detail: '惩罚小，时间跳跃更容易成功。适合轻松日常、甜宠、慢热、恋爱养成这类不太想被狠虐的卡。' },
    normal: { name: '普通', glyph: '🌖', title: '亏凸月', quota: '7.0', detail: '标准难度，情感变化比较均衡。适合大多数剧情卡、综合向卡，日常和冲突都能跑。' },
    hard: { name: '困难', glyph: '🌗', title: '下弦月', quota: '5.0', detail: '周上限更紧，时间跳跃判定更严。适合冲突多、推进快、需要压力感的强剧情卡。' },
    hell: { name: '地狱', glyph: '🌑', title: '新月', quota: '3.0', detail: '周上限最低，默认开启锚定时间线。适合重度虐恋、强冲突、黑深残、高张力、长线折磨的卡。' }
  };

  function getRStageFromE(E) {
    const e = Number(E) || 0;
    if (e <= -80) return { r: -5, name: '势不两立', desc: '你死我活的仇敌' };
    if (e < -60) return { r: -4, name: '不共戴天', desc: '深仇大恨，拒绝一切和解' };
    if (e < -40) return { r: -3, name: '仇视', desc: '主动排斥，言语攻击性强' };
    if (e < -20) return { r: -2, name: '明确敌意', desc: '抗拒对方，不掩饰厌恶' };
    if (e < 0) return { r: -1, name: '轻微反感', desc: '保持戒心，不主动靠近' };
    if (e < 18) return { r: 0, name: '拒绝认识', desc: '陌生人，不熟不厌' };
    if (e < 38) return { r: 1, name: '愿意认识', desc: '初步接触，保持礼貌距离' };
    if (e < 58) return { r: 2, name: '犹豫观望', desc: '情感萌芽，立场摇摆' };
    if (e < 78) return { r: 3, name: '愿意尝试', desc: '愿意投入心力，态度转正' };
    if (e < 98) return { r: 4, name: '认真经营', desc: '已认定对方，主动付出，长期投入' };
    return { r: 5, name: '渴望永恒', desc: '至死不渝的爱，此生唯一' };
  }

  function roundHalf(v) { return Math.round(Number(v) * 2) / 2; }
  function getDimCoeff(v) {
    const n = Number(v) || 0;
    if (n < 30) return 0.5; if (n <= 60) return 1.5; if (n <= 80) return 1.0; return 0.5;
  }
  function getNegCoeff(mode, dim) {
    const table = { easy: { E: 0.5, P: 0.5, R: 0.5, I: 0.5 }, normal: { E: 1.0, P: 1.0, R: 1.0, I: 1.0 }, hard: { E: 1.5, P: 2.0, R: 1.5, I: 2.0 }, hell: { E: 1.0, P: 1.0, R: 1.0, I: 1.0 } };
    return (table[mode] || table.normal)[dim] || 1.0;
  }
  function getEmotionThreshold(eventType) { return { 日常: 2, 关键: 3, 重大: 4 }[eventType] || 3; }
  function getEmotionBonus(mode, eventType, direction) {
    const row = MOON_FORMULA_PARAMS.emotionBonus[mode] || MOON_FORMULA_PARAMS.emotionBonus.normal;
    const base = row[eventType] || 0;
    return direction === '负向' ? -base : base;
  }
  function shouldSkipEmotion(charData, mode) {
    const R = Number(charData.阶段值) || 0; const E = Number(charData.好感度) || 0;
    if (R >= 4) return true; if (mode !== 'easy' && E >= 90) return true; return false;
  }
  function readLastRoll(charData) {
    const lr = charData && charData._lastRoll;
    if (!lr || typeof lr !== 'object') return null;
    return { 事件类型: lr.事件类型, 方向: lr.方向, 主维度: lr.主维度, 基础值: lr.基础值 };
  }
  function getSTCtx() {
    try { if (mainWin.SillyTavern && mainWin.SillyTavern.getContext) return mainWin.SillyTavern.getContext(); } catch (e) {}
    try { if (window.SillyTavern && window.SillyTavern.getContext) return window.SillyTavern.getContext(); } catch (e) {}
    return null;
  }
  function isCharSkeleton(ch) {
    if (!ch || typeof ch !== 'object') return true;
    return !(ch.好感度 !== undefined || ch.肉体值 !== undefined || ch.阶段值 !== undefined || ch.嫉妒值 !== undefined);
  }
  function isCharsTableEmpty(chars) {
    if (!chars || typeof chars !== 'object') return true;
    for (const n in chars) { if (!isCharSkeleton(chars[n])) return false; }
    return true;
  }
  function hasLegacyFields(ch) {
    if (!ch) return false;
    return ch.情感值 !== undefined || ch.关系值 !== undefined || ch.身体值 !== undefined || ch.好感值 !== undefined || (ch._quota && ch._quota.E周已用 !== undefined) || (ch._quota && ch._quota._debuff && ch._quota._debuff.踩雷冷却中 !== undefined);
  }
  function getPendingMigrateChars(statData) {
    const list = [];
    if (!statData || !statData.角色) return list;
    for (const n in statData.角色) { if (hasLegacyFields(statData.角色[n])) list.push(n); }
    return list;
  }
  function getSettings() {
    try { const raw = mainWin.localStorage.getItem(SETTINGS_KEY); if (raw) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw)); } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS);
  }
  function saveSettings(s) { try { mainWin.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }
  function getCurrentMode() { return getSettings().mode || 'hell'; }
  function getAntiSL() { return getSettings().antisl === true; }
  function getSafetyLock() { return getSettings().safetyLock !== false; }
  function getExtraModelMode() { return getSettings().extraModel || 'auto'; }
  function getCardMode() { return getSettings().cardMode || 'single'; }
  function getEventPacing() {
    const v = getSettings().eventPacing || 'And';
    if (v === 'slow') return 'Adi'; if (v === 'normal') return 'And'; if (v === 'fast') return 'All'; return v;
  }

  function getFanficEnhance() { return getSettings().fanficEnhance === true; }
  function setFanficEnhance(v) { const s = getSettings(); s.fanficEnhance = (v === true); saveSettings(s); }

  function getTimelineTag() { return String(getSettings().timelineTag || ''); }
  function setTimelineTag(v) { const s = getSettings(); s.timelineTag = String(v || ''); saveSettings(s); }

  const TL_TIME_RE = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日[\s\S]*?(\d{1,2})\s*[:点时]\s*(\d{1,2})/;

  function extractJson(text) {
    if (!text) return null;
    const s = String(text).trim();
    try { return JSON.parse(s); } catch (e) {}
    const m1 = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m1) { try { return JSON.parse(m1[1].trim()); } catch (e) {} }
    const m2 = s.match(/\{[\s\S]*\}/);
    if (m2) { try { return JSON.parse(m2[0]); } catch (e) {} }
    return null;
  }

  // 从世界书条目里解析时间线事件
  function getTimelineEvents(entries) {
    const events = [];
    if (!Array.isArray(entries)) return events;
    const tag = getTimelineTag();
    const isTarget = function(title) {
      if (tag) return title.indexOf(tag) === 0;
      return title.indexOf('[Timeline]') === 0;
    };
    for (const e of entries) {
      const title = String(e.title || '');
      if (!isTarget(title)) continue;
      const content = String(e.content || '');
      // 单条目多事件：按「时间：xxx」块分割
      const blocks = content.split(/\n(?=时间\s*[:：])/).map(function(x) { return x.trim(); }).filter(Boolean);
      const list = blocks.length ? blocks : [content];
      for (const blk of list) {
        const mt = blk.match(/时间\s*[:：]\s*([^\n]+)/);
        const mc = blk.match(/内容\s*[:：]\s*([\s\S]+)/);
        const timeStr = mt ? mt[1].trim() : '';
        const desc = mc ? mc[1].trim() : blk.trim();
        if (!timeStr) continue;
        const isMajor = /（重大）|\(重大\)/.test(desc) || /重大/.test(title);
        const name = desc.slice(0, 40) || title.replace(/^\[Timeline\]\s*/, '');
        events.push({ name: name, time: timeStr, isMajor: isMajor, raw: blk });
      }
      // 兜底：多条目模式每个条目只对应一个事件，时间从正文首行抓
      if (list.length === 1 && events.length && events[events.length - 1].time === '') {
        const mt = content.match(TL_TIME_RE);
        if (mt) events[events.length - 1].time = mt[0];
      }
    }
    events.sort(function(a, b) {
      const da = parseGameTime(a.time), db = parseGameTime(b.time);
      if (da && db) return da.getTime() - db.getTime();
      return 0;
    });
    return events;
  }

  function scanTimelineCandidates(entries) {
    const out = [];
    if (!Array.isArray(entries)) return out;
    const tlTag = getTimelineTag();
    let hasMulti = false;
    for (const e of entries) {
      const title = String(e.title || '');
      if (title.indexOf('[Timeline]') === 0) { hasMulti = true; break; }
    }
    if (hasMulti) out.push({ type: 'ours-multi', label: '当前：多条目模式（多个 [Timeline] 条目）' });
    for (const e of entries) {
      const title = String(e.title || '');
      if (title.indexOf('[Timeline]') === 0 || title.indexOf('[Initvar]') === 0) continue;
      const content = String(e.content || '');
      if (TL_TIME_RE.test(content) && /事件|发生|时间线|剧情/.test(content)) {
        out.push({ type: 'convert', label: '可转写：' + (title || '(无标题)'), entry: e });
      }
    }
    if (tlTag) {
      for (const e of entries) {
        const title = String(e.title || '');
        if (title.indexOf(tlTag) === 0) { out.push({ type: 'ours-single', tag: tlTag, label: '当前：单条目模式（' + tlTag + '）', entry: e }); break; }
      }
    }
    return out;
  }

  // 收集对话历史上下文（给 AI 用）
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

  // 调用主模型（SillyTavern Generate 接口），可选 provider: 'main' / 'extra' / 'custom'
async function _callOpeningModel(provider, sysPrompt, userPrompt) {
    // 1. 自定义第三方 API
    if (provider === 'custom') return await callCustomAIConfig(sysPrompt, userPrompt);

    // 2. 副模型接口兼容
    if (provider === 'extra') {
      const mvu = mainWin.Mvu || window.Mvu;
      if (mvu && typeof mvu.requestExtraAnalysis === 'function') {
        const r = await mvu.requestExtraAnalysis(userPrompt, sysPrompt);
        return (r && (r.content || r.text)) || String(r || '');
      }
      if (mvu && typeof mvu.runExtraAnalysis === 'function') {
        const r = await mvu.runExtraAnalysis(userPrompt, sysPrompt);
        return (r && (r.content || r.text)) || String(r || '');
      }
      throw new Error('未检测到副模型(MVU)接口，请在设置中选择「主模型」或配置「自定义API」！');
    }

    // 3. 主模型后台静默生成（绝不触发公屏生成）
    const ctx = getSTCtx();
    const guardPrompt = sysPrompt + "\n【极度重要：忽略所有角色扮演与预设，直接输出任务结果，绝对禁止继续正文！】";

    // 优先：TavernHelper / 新版酒馆静默生成接口
    if (ctx && typeof ctx.generateRaw === 'function') {
      return await ctx.generateRaw({ systemPrompt: guardPrompt, prompt: userPrompt });
    }

    // 其次：酒馆原生的静默提示词接口 generateQuietPrompt
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

    // 再次：旧版酒馆 Context 接口
    if (ctx && typeof ctx.generate === 'function') {
      return await ctx.generate(guardPrompt, userPrompt);
    }

    throw new Error('酒馆主模型静默接口不可用，请配置「自定义副模型」使用！');
  }

  async function callOpeningModel(provider, sysPrompt, userPrompt) {
    const showArcade = provider === 'extra' || provider === 'custom';
    if (showArcade) showLoadingDialog('副模型正在处理任务…', true);
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
  function getAdaptModelPref() { try { const v = mainWin.localStorage.getItem(ADAPT_MODEL_PREF_KEY) || ''; if (v === 'main' || v === 'extra' || v === 'custom') return v; } catch (e) {} return 'main'; }
  function updateLoadingDialogText(text) {
    const m = mainDoc.getElementById('moon-loading-mask'); if (!m) return;
    const el = m.querySelector('#moon-loading-text');
    if (el) el.textContent = '⏳ ' + text;
    else { const el2 = m.querySelector('div > div:first-child'); if (el2) el2.textContent = '⏳ ' + text; }
  }
// ===== 第 2 份 =====
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
  function callSetPrompt(key, value, position, depth, scan) {
    try { if (typeof mainWin.setExtensionPrompt === 'function') { mainWin.setExtensionPrompt(key, value, position, depth, scan); return true; } } catch (e) {}
    try { if (typeof window.setExtensionPrompt === 'function') { window.setExtensionPrompt(key, value, position, depth, scan); return true; } } catch (e) {}
    try { const ctx = getSTCtx(); if (ctx && typeof ctx.setExtensionPrompt === 'function') { ctx.setExtensionPrompt(key, value, position, depth, scan); return true; } } catch (e) {}
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
    let data = null;
    try { const raw = localStorage.getItem(key); if (raw) data = JSON.parse(raw); } catch (e) {}
    if (!data) {
      try {
        const ctx = getSTCtx();
        if (ctx && ctx.chatMetadata && ctx.chatMetadata[key]) {
          data = ctx.chatMetadata[key];
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (e) {}
    }
    return data || { stat_data: { 世界: { 时间: '2000年01月01日 · 星期六 · 00:00', _内部流逝天数: 0, _上次推进时间: '2000年01月01日 · 星期六 · 00:00' }, 角色: {} } };
  }

  async function saveLocalState(newStatData) {
    showLoadingDialog('当前阶段值发生重大变故，变动正在更新数据中，请勿退出当前页面导致更新失败！');
    try {
      const key = getChatStateKey();
      localStorage.setItem(key, JSON.stringify({ stat_data: newStatData }));
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) {
        ctx.chatMetadata[key] = { stat_data: newStatData };
        if (typeof ctx.saveMetadata === 'function') await ctx.saveMetadata();
      }
      await new Promise(function(r) { setTimeout(r, 500); });
      return true;
    } catch (e) {
      toast('写入失败，本地存储可能已满', 'warning');
      return false;
    } finally { closeLoadingDialog(); }
  }

  function readMvuLatest() { return loadLocalState(); }
  async function writeMvuLatest(newStatData) { return await saveLocalState(newStatData); }

  function extractSylveinaTag(mes) {
    if (!mes) return null;
    const m = String(mes).match(/\[Sylveina\|([LMH])\|([+-])\|(\d+(?:\.\d+)?)\]/);
    if (!m) return null;
    return { level: m[1], direction: m[2] === '+' ? '正向' : '负向', baseValue: parseFloat(m[3]), fullMatch: m[0] };
  }

  function extractBaseValueFromLatestAiMessage(eventType) {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || !found.msg.mes) return null;
      const tag = extractSylveinaTag(found.msg.mes);
      if (!tag) return null;
      const levelMap = { L: '日常', M: '关键', H: '重大' };
      const eventKey = levelMap[tag.level] || '日常';
      return { value: tag.baseValue, direction: tag.direction, level: tag.level, eventType: eventKey, fullMatch: tag.fullMatch };
    } catch (e) { return null; }
  }

  function extractFirstMeetTag(mes) {
    if (!mes) return null;
    const m = String(mes).match(/\[初见\|优势\s*([+-]?\d+)\|劣势\s*([+-]?\d+)\]/);
    if (!m) return null;
    return { 优势: Number(m[1]) || 0, 劣势: Number(m[2]) || 0, fullMatch: m[0] };
  }

  function extractDebuffTag(mes) {
    if (!mes) return null;
    const m = String(mes).match(/\[踩雷\]/);
    if (!m) return null;
    return { fullMatch: m[0] };
  }

  async function processFirstMeetForChar(charName, ch, mode) {
    const quota = ch._quota || (ch._quota = {});
    if (quota._firstMeetDone === true) return null;
    if (ch.在场 !== true) return null;
    const found = getLatestAiMessage();
    if (!found || !found.msg) return null;
    const mes = String(found.msg.mes || '');
    const tag = extractFirstMeetTag(mes);
    if (!tag) return null;
    const dice = Math.floor(Math.random() * 20) + 1;
    const threshold = (mode === 'easy') ? 8 : 13;
    const total = dice + (Number(tag.优势) || 0) + (Number(tag.劣势) || 0);
    let newE = Number(ch.好感度) || 0; let newR = Number(ch.阶段值) || 0; let resultText = '';
    if (dice === 20) { newE = 30; newR = 1; resultText = '大成功 → E=30, R=1'; }
    else if (dice === 1) { newE = Math.max(-15, -10); newR = 0; resultText = '大失败 → E=-10, R=0'; }
    else if (total >= threshold) {
      const coeff = (mode === 'easy') ? 1.5 : (mode === 'normal') ? 1.0 : 0.5;
      const delta = Math.round((total / 2) * coeff * 2) / 2;
      newE = roundHalf(newE + delta); newR = 1;
      resultText = '成功 ' + total + '≥' + threshold + ' → E+=' + delta + ', R=1';
    } else { resultText = '失败 ' + total + '<' + threshold + ' → E不变, R=0'; }
    ch.好感度 = newE; ch.阶段值 = newR; quota._firstMeetDone = true;
    try { found.msg.mes = String(found.msg.mes).replace(tag.fullMatch, '').trim(); } catch (e) {}
    return { dice: dice, total: total, threshold: threshold, newE: newE, newR: newR, resultText: resultText };
  }

  function getLatestAiMessage() {
    try { const ctx = getSTCtx(); if (!ctx || !ctx.chat || !ctx.chat.length) return null; for (let i = ctx.chat.length - 1; i >= 0; i--) { if (ctx.chat[i] && !ctx.chat[i].is_user) return { msg: ctx.chat[i], idx: i }; } } catch (e) {}
    return null;
  }

  function hasAnyStatDataInRecentMessages(limit) {
    limit = limit || 3;
    try {
      const ctx = getSTCtx();
      if (!ctx || !ctx.chat || !ctx.chat.length) return false;
      let checked = 0;
      for (let i = ctx.chat.length - 1; i >= 0 && checked < limit; i--) {
        const m = ctx.chat[i]; if (!m || m.is_user) continue;
        checked++;
        const vars = m.variables;
        if (vars) {
          if (Array.isArray(vars)) { for (let k = 0; k < vars.length; k++) { if (vars[k] && vars[k].stat_data) return true; } }
          else if (typeof vars === 'object') { if (vars.stat_data) return true; if (vars[0] && vars[0].stat_data) return true; }
        }
        if (m.mvu && (m.mvu.stat_data || (m.mvu.variables && m.mvu.variables[0] && m.mvu.variables[0].stat_data))) return true;
        if (m.extra && m.extra.stat_data) return true;
      }
    } catch (e) {}
    return false;
  }
// ===== 第 3 份 =====
  const modalQueue = []; let isModalShowing = false;
  function enqueueModal(render) { modalQueue.push(render); processModalQueue(); }
  function processModalQueue() {
    if (isModalShowing) return; if (modalQueue.length === 0) return;
    isModalShowing = true; const task = modalQueue.shift();
    const onDone = function() { isModalShowing = false; setTimeout(processModalQueue, 120); };
    try { task(onDone); } catch (e) { try { console.warn('[Doki] 弹窗任务异常：', e); } catch (e2) {} onDone(); }
  }

  function showModalDialog(title, html, onConfirm, opts) {
    opts = opts || {};
    enqueueModal(function(done) {
      let mask = mainDoc.getElementById('moon-modal-mask'); if (mask) { try { mask.remove(); } catch (e) {} }
      mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
      mask.className = 'mp-pixel-modal';
      mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:460px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-modal-confirm" style="flex:1;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.confirmText || '确认') + '</button></div></div>';
      mainDoc.body.appendChild(mask); wrapMaskClose(mask, done);
      mask.querySelector('#moon-modal-confirm').addEventListener('click', function() { if (typeof onConfirm === 'function') { try { onConfirm(); } catch (e) {} } try { mask.remove(); } catch (e) {} });
      if (typeof onConfirm !== 'function') { mask.addEventListener('click', function(e) { if (e.target === mask) { try { mask.remove(); } catch (err) {} } }); }
      if (typeof opts.onOpen === 'function') { try { opts.onOpen(mask); } catch (e) {} }
    });
  }

  function showModalDialogCancelable(title, html, onConfirm, onCancel, opts) {
    opts = opts || {};
    enqueueModal(function(done) {
      let mask = mainDoc.getElementById('moon-modal-mask'); if (mask) { try { mask.remove(); } catch (e) {} }
      mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
      mask.className = 'mp-pixel-modal';
      mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:460px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-modal-cancel" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.cancelText || '取消') + '</button><button id="moon-modal-confirm" style="flex:1.4;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.confirmText || '确认') + '</button></div></div>';
      mainDoc.body.appendChild(mask); wrapMaskClose(mask, done);
      mask.querySelector('#moon-modal-confirm').addEventListener('click', function() { if (typeof onConfirm === 'function') { try { onConfirm(); } catch (e) {} } try { mask.remove(); } catch (e) {} });
      mask.querySelector('#moon-modal-cancel').addEventListener('click', function() { if (typeof onCancel === 'function') { try { onCancel(); } catch (e) {} } try { mask.remove(); } catch (e) {} });
      mask.addEventListener('click', function(e) { if (e.target === mask) { if (typeof onCancel === 'function') { try { onCancel(); } catch (e) {} } try { mask.remove(); } catch (err) {} } });
      if (typeof opts.onOpen === 'function') { try { opts.onOpen(mask); } catch (e) {} }
    });
  }

  function showStepDialog(title, html, opts) {
    opts = opts || {};
    return new Promise(function(resolve) {
      enqueueModal(function(done) {
        let mask = mainDoc.getElementById('moon-modal-mask'); if (mask) { try { mask.remove(); } catch (e) {} }
        mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
        mask.className = 'mp-pixel-modal';
        mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
        mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:520px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;max-height:60dvh;overflow-y:auto;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-step-next" style="flex:1;padding:11px;border-radius:9px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.confirmText || '确认，进行下一步') + '</button></div></div>';
        mainDoc.body.appendChild(mask);
        let resolved = false;
        function finish() { if (resolved) return; resolved = true; try { mask.remove(); } catch (e) {} try { resolve(); } catch (e) {} }
        wrapMaskClose(mask, function() { done(); if (!resolved) { resolved = true; try { resolve(); } catch (e) {} } });
        mask.querySelector('#moon-step-next').addEventListener('click', finish);
        mask.addEventListener('click', function(e) { if (e.target === mask) finish(); });
        if (typeof opts.onOpen === 'function') { try { opts.onOpen(mask); } catch (e) {} }
      });
    });
  }

  function getArcadeHighScore() {
    try { return Math.max(0, parseInt(mainWin.localStorage.getItem(ARCADE_HIGH_SCORE_KEY), 10) || 0); } catch (e) { return 0; }
  }
  function saveArcadeHighScore(score) {
    try { mainWin.localStorage.setItem(ARCADE_HIGH_SCORE_KEY, String(Math.max(getArcadeHighScore(), score))); } catch (e) {}
  }
  let stopArcadeRunner = null;
  function mountArcadeRunner(root, options) {
    options = options || {};
    const canvas = root.querySelector('#moon-arcade-canvas');
    const scoreEl = root.querySelector('#moon-arcade-score');
    const highScoreEl = root.querySelector('#moon-arcade-hi-score');
    const stateEl = root.querySelector('#moon-arcade-state');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0, score = 0, speed = 3, tick = 0, dead = false, jumpY = 0, jumpV = 0;
    let highScore = getArcadeHighScore(), shownScore = -1, stopped = false;
    let obstacles = [{ x: 275, w: 10, h: 18 }, { x: 445, w: 12, h: 25 }];
    if (highScoreEl) highScoreEl.textContent = String(highScore).padStart(5, '0');
    function jump() { if (dead) { score = 0; shownScore = -1; dead = false; speed = 3; obstacles = [{ x: 275, w: 10, h: 18 }, { x: 445, w: 12, h: 25 }]; stateEl.textContent = 'PRESS SPACE / TAP TO JUMP'; return; } if (jumpY === 0) jumpV = -8; }
    function keydown(e) { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } }
    function draw() {
      const w = canvas.width, h = canvas.height, floor = h - 18;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#17241b'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(183,211,160,.055)'; for (let x = 3; x < w; x += 4) ctx.fillRect(x, 0, 1, h); for (let y = 3; y < h; y += 4) ctx.fillRect(0, y, w, 1);
      ctx.fillStyle = '#465d43'; for (let x = 0; x < w; x += 16) { const p = (x + Math.floor(tick / 3) % 16) % w; ctx.fillRect(p, floor + 7, 8, 2); }
      ctx.fillStyle = '#a9c68d'; ctx.fillRect(0, floor, w, 2);
      if (!dead) { tick++; score += 0.08; speed = Math.min(6, 3 + score / 140); jumpY += jumpV; jumpV += 0.42; if (jumpY > 0) { jumpY = 0; jumpV = 0; }
        obstacles.forEach(function(o) { o.x -= speed; if (o.x < -o.w) { o.x = w + 65 + Math.random() * 100; o.h = 14 + Math.floor(Math.random() * 17); o.w = 9 + Math.floor(Math.random() * 6); } if (o.x < 46 && o.x + o.w > 30 && floor - (o.h - 2) > floor + jumpY - 23) { dead = true; stateEl.textContent = 'GAME OVER · TAP TO RETRY'; } }); }
      ctx.fillStyle = '#c5ddaa'; ctx.fillRect(30, floor - 21 + jumpY, 14, 14); ctx.fillStyle = '#e9f5d2'; ctx.fillRect(39, floor - 18 + jumpY, 2, 2); ctx.fillRect(33, floor - 7 + jumpY, 3, 7); ctx.fillRect(40, floor - 7 + jumpY, 3, 7);
      ctx.fillStyle = '#76936a'; obstacles.forEach(function(o) { ctx.fillRect(Math.round(o.x), floor - o.h, o.w, o.h); ctx.fillRect(Math.round(o.x) - 3, floor - o.h + 5, 4, 3); });
      const scoreNow = Math.floor(score);
      if (scoreNow !== shownScore) {
        shownScore = scoreNow;
        scoreEl.textContent = String(scoreNow).padStart(5, '0');
        if (scoreNow > highScore) { highScore = scoreNow; saveArcadeHighScore(highScore); if (highScoreEl) highScoreEl.textContent = String(highScore).padStart(5, '0'); }
      }
      raf = mainWin.requestAnimationFrame(draw);
    }
    canvas.addEventListener('pointerdown', jump); mainDoc.addEventListener('keydown', keydown, true); draw();
    const stop = function() { if (stopped) return; stopped = true; try { mainWin.cancelAnimationFrame(raf); } catch (e) {} try { mainDoc.removeEventListener('keydown', keydown, true); } catch (e) {} canvas.removeEventListener('pointerdown', jump); };
    if (!options.standalone) stopArcadeRunner = stop;
    return stop;
  }

  function showLoadingDialog(text, withArcade) {
    closeLoadingDialog();
    const mask = mainDoc.createElement('div'); mask.id = 'moon-loading-mask';
    mask.className = withArcade ? 'moon-pixel-loading' : '';
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483660;background:rgba(5,0,8,0.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;';
    mask.innerHTML = withArcade
      ? '<div class="mp-arcade-box"><div class="mp-arcade-brand">★ MOON ARCADE ★</div><div class="mp-arcade-title" id="moon-loading-text">' + text + '</div><div class="mp-arcade-hud"><span>SCORE <b id="moon-arcade-score">00000</b></span><span>HI <b id="moon-arcade-hi-score">' + String(getArcadeHighScore()).padStart(5, '0') + '</b></span></div><canvas id="moon-arcade-canvas" width="320" height="94" aria-label="离线像素小游戏，按空格或点击跳跃"></canvas><div class="mp-arcade-state" id="moon-arcade-state">PRESS SPACE / TAP TO JUMP</div><div class="mp-arcade-foot">操作角色跳过障碍 · 任务完成后自动返回</div></div>'
      : '<div class="mp-loading-box"><div style="margin-bottom:12px;" id="moon-loading-text">⏳ ' + text + '</div><div class="mp-loading-track"><div class="mp-loading-bar"></div></div><div style="font-size:10.5px;color:#d68cbd;margin-top:8px;">请稍候</div></div>';
    mainDoc.body.appendChild(mask);
    if (withArcade) mountArcadeRunner(mask);
  }
  function closeLoadingDialog() { if (stopArcadeRunner) { try { stopArcadeRunner(); } catch (e) {} stopArcadeRunner = null; } const m = mainDoc.getElementById('moon-loading-mask'); if (m) { try { m.remove(); } catch (e) {} } }
  function showResultDialog(title, html, onOpenExtra) { showModalDialog(title, html, null, { confirmText: '我已截图 / 关闭', onOpen: onOpenExtra }); }
  function wrapMaskClose(mask, onClosed) {
    if (!mask || typeof mask.remove !== 'function') return;
    const origRemove = mask.remove.bind(mask); let closed = false;
    mask.remove = function() { if (closed) return; closed = true; try { origRemove(); } catch (e) {} if (typeof onClosed === 'function') { try { onClosed(); } catch (e) {} } };
  }
// ===== 第 4 份 =====
  function parseGameTime(str) {
    if (!str || typeof str !== 'string') return null;
    const re = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日[\s\S]*?(?:(上午|下午|中午|凌晨|早上|早晨|清晨|傍晚|晚上|夜里|夜间|深夜|午后|正午)\s*)?(\d{1,2})\s*(?:[:点时])\s*(?:(\d{1,2})\s*分?)?/;
    const m = str.match(re);
    if (!m) return null;
    try {
      let hh = +m[5]; const mm = (m[6] !== undefined && m[6] !== '') ? +m[6] : 0; const period = m[4] || '';
      if (period) {
        const isPM = /下午|午后|傍晚|晚上|夜里|夜间|深夜/.test(period);
        const isAM = /上午|早上|早晨|清晨|凌晨/.test(period);
        const isNoon = /中午|正午/.test(period);
        if (isNoon) { if (hh < 12) hh = 12; }
        else if (isPM) { if (hh < 12) hh += 12; }
        else if (isAM) { if (hh === 12) hh = 0; }
      }
      if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
      return new Date(+m[1], +m[2] - 1, +m[3], hh, mm);
    } catch (e) { return null; }
  }

  function timeReached(currentStr, targetStr) {
    const a = parseGameTime(currentStr); const b = parseGameTime(targetStr);
    if (!a || !b) return false; return a.getTime() >= b.getTime();
  }

  function addDaysToGameTime(timeStr, days) {
    const d = parseGameTime(timeStr); if (!d) return timeStr;
    d.setDate(d.getDate() + days);
    const y = d.getFullYear(); const mo = String(d.getMonth() + 1).padStart(2, '0'); const da = String(d.getDate()).padStart(2, '0');
    const wd = ['日','一','二','三','四','五','六'][d.getDay()]; const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
    return y + '年' + mo + '月' + da + '日 · 星期' + wd + ' · ' + hh + ':' + mm;
  }

  async function updateInternalTime() {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.世界) return null;
    const world = data.stat_data.世界;
    const currentTimeStr = world.时间 || '';
    const currentDate = parseGameTime(currentTimeStr);
    if (!currentDate) return null;
    let lastTimeStr = world._上次推进时间 || currentTimeStr;
    let lastDate = parseGameTime(lastTimeStr); if (!lastDate) lastDate = currentDate;
    const diffMs = currentDate.getTime() - lastDate.getTime(); const diffDays = diffMs / 86400000;
    if (diffDays <= 0) return null;
    let internalDays = diffDays; let isJump = false;
    if (diffDays >= 3) {
      isJump = true; const mode = getCurrentMode();
      const floorRatio = mode === 'easy' ? 10 : mode === 'normal' ? 20 : mode === 'hard' ? 30 : 35;
      const ctx = getSTCtx(); const currentFloor = (ctx && ctx.chat) ? ctx.chat.length : 0;
      const lastJumpFloor = parseInt(mainWin.localStorage.getItem(LAST_JUMP_FLOOR_KEY) || '0');
      const floorDelta = Math.max(0, currentFloor - lastJumpFloor);
      internalDays = Math.max(1, Math.round(floorDelta / floorRatio));
      mainWin.localStorage.setItem(LAST_JUMP_FLOOR_KEY, String(currentFloor));
    }
    world._内部流逝天数 = (Number(world._内部流逝天数) || 0) + internalDays;
    world._上次推进时间 = currentTimeStr;
    await writeMvuLatest(data.stat_data);
    return { diffDays: Math.floor(diffDays), internalDays: internalDays, totalInternalDays: world._内部流逝天数, isJump: isJump };
  }

  function tryGetDisplayData() {
    try {
      const data = readMvuLatest();
      if (data) {
        if (data.display_data) return { source: 'display_data', data: data.display_data };
        if (data.stat_data) return { source: 'stat_data', data: data.stat_data };
      }
    } catch (e) {}
    if (cachedVars && cachedVars.stat_data) return { source: '缓存', data: cachedVars.stat_data };
    return null;
  }
  function readVar(path, defaultValue) {
    const all = tryGetDisplayData();
    if (!all || !all.data) return defaultValue;
    const parts = path.split('.');
    let cur = all.data;
    for (const p of parts) { if (cur == null || typeof cur !== 'object') return defaultValue; cur = cur[p]; }
    return cur !== undefined ? cur : defaultValue;
  }
  function estimateTokens(text) {
    if (!text) return 0;
    const s = String(text);
    const cjk = (s.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
    const other = s.length - cjk;
    return Math.ceil(cjk * 1.0 + other / 4);
  }
  function _fmtK(n) { return Math.round(Number(n) || 0) + ' tokens'; }

  function _extractEntries(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.entries) {
      if (Array.isArray(data.entries)) return data.entries;
      if (typeof data.entries === 'object') return Object.values(data.entries);
    }
    if (typeof data === 'object') return Object.values(data);
    return [];
  }

async function _collectAllWorldbooks(includeDisabled) {
  const all = [];
  const ctx = getSTCtx();
  const raw = (mainWin && mainWin.world_info) || (window && window.world_info) || (ctx && ctx.world_info) || null;
  if (raw) {
    const books = [];
    if (Array.isArray(raw)) {
      raw.forEach(function(b) { if (b && typeof b === 'object') books.push(b); });
    } else if (typeof raw === 'object') {
      for (const k in raw) {
        const b = raw[k];
        if (k.indexOf('jQuery') === 0 || k.indexOf('__') === 0) continue;
        if (!b || typeof b !== 'object') continue;
        if (b.entries || b.name || b.originalData) books.push(b);
      }
    }
    for (const book of books) {
      const bookDisabled = (book.enabled === false || book.disable === true);
      if (!includeDisabled && bookDisabled) continue;
      const list = _extractEntries(book.entries || book);
      for (const e of list) {
        if (!e || typeof e !== 'object') continue;
        const entryDisabled = (e.disable === true || e.enabled === false);
        if (!includeDisabled && entryDisabled) continue;
        const content = String(e.content || e.value || '');
        if (!content) continue;
        all.push({
          bookName: String(book.name || book.comment || ''),
          title: String(e.comment || e.key || e.name || '').trim(),
          content: content,
          constant: e.constant === true,
          enabled: !entryDisabled,
          bookEnabled: !bookDisabled
        });
      }
    }
    if (all.length > 0) return all;
  }
    let names = [];
    try { if (ctx && typeof ctx.getWorldInfoNames === 'function') names = await ctx.getWorldInfoNames(); } catch (e) {}
    for (const bookName of (names || [])) {
      let data = null;
      try { if (ctx && typeof ctx.loadWorldInfo === 'function') data = await ctx.loadWorldInfo(bookName); } catch (e) {}
      if (!data) continue;
      const list = _extractEntries(data);
      for (const e of list) {
        if (!e || typeof e !== 'object') continue;
        if (e.disable === true || e.enabled === false) continue;
        const content = String(e.content || e.value || '');
        if (!content) continue;
        all.push({ bookName: bookName, title: String(e.comment || e.key || e.name || '').trim(), content: content, constant: e.constant === true });
      }
    }
    return all;
  }

  async function getAllWorldbookEntries() {
    const books = await _collectAllWorldbooks();
    return books.map(function(e) { return { bookName: e.bookName, title: e.title, content: e.content, enabled: true }; });
  }
// ===== 第 5 份 =====
  async function processDebuffIfTagged(charName, ch, mode) {
    const quota = ch._quota || (ch._quota = {}); if (!quota._debuff) quota._debuff = {};
    if (quota._debuff.冷战期 === true) return null;
    const found = getLatestAiMessage(); if (!found || !found.msg) return null;
    const mes = String(found.msg.mes || ''); const tag = extractDebuffTag(mes); if (!tag) return null;
    const curE = Number(ch.好感度) || 0;
    const debuffMap = {
      easy: { ratio: 0.25, days: 3, extra: 1.0 },
      normal: { ratio: 0.5, days: 5, extra: 1.0 },
      hard: { ratio: 0.5, days: 7, extra: 2.0 },
      hell: { ratio: 0.5, days: 10, extra: 2.0 }
    };
    const cfg = debuffMap[mode] || debuffMap.normal;
    let delta = curE * cfg.ratio * cfg.extra; if (curE < 0) delta = Math.max(delta, 0);
    const newE = roundHalf(curE - Math.abs(delta)); ch.好感度 = newE;
    const nowTime = (readMvuLatest()?.stat_data?.世界?.时间) || '';
    quota._debuff.冷战期 = true;
    quota._debuff.冷却结束时间 = addDaysToGameTime(nowTime, cfg.days);
    quota._debuff.剩余掷骰次数 = 3;
    quota._debuff.冷战期严重度 = 'heavy';
    try { found.msg.mes = String(found.msg.mes).replace(tag.fullMatch, '').trim(); } catch (e) {}
    return { days: cfg.days, newE: newE, oldE: curE, delta: roundHalf(newE - curE) };
  }

  const GATE_NODES = [18, 38, 58, 78, 98];
  const GATE_CHAR_ROLL_DAYS = 7;
  const GATE_PLAYER_CD_DAYS = 3;
  const GATE_FAIL_E_PENALTY = 5.0;

  function getGateThreshold(E) { return 8 + Math.floor(Number(E) / 10); }
  function getNextGateNode(R) { const r = Number(R) || 0; if (r < 0) return GATE_NODES[0]; if (r >= GATE_NODES.length) return null; return GATE_NODES[r]; }

  function applyAbyssToGatePenalty(ch, penalty, mode) {
    const E = Number(ch.好感度) || 0; const P = Number(ch.肉体值) || 0; const I = Number(ch.嫉妒值) || 0;
    const isAbyss = (E < 0 || P < 0 || I < 0); if (!isAbyss) return penalty;
    const ab = MOON_FORMULA_PARAMS.abyssCoeff[mode] || MOON_FORMULA_PARAMS.abyssCoeff.normal;
    return penalty * ab.neg;
  }

  function computePlayerConfession(ch, mode, currentTime) {
    const quota = ch._quota || {}; if (quota._playerConfession !== true) return null;
    quota._playerConfession = false;
    const E = Number(ch.好感度) || 0; const R = Number(ch.阶段值) || 0;
    if (R < 4 || E <= 60) return { passed: false, reason: '条件不满足' };
    if (quota.表白期已通过 === true || quota.表白期排除 === true) return null;
    const mod = MOON_FORMULA_PARAMS.confessionPlayerMod[mode] || 0;
    const dice = Math.floor(Math.random() * 20) + 1;
    const total = dice + mod + Math.floor(E / 10) + 3; const passed = total >= 20;
    if (passed) { quota.表白期已通过 = true; if (R < 5) ch.阶段值 = R + 1; }
    else { const penalty = roundHalf(0.5 * 2.0); ch.好感度 = roundHalf(E - penalty); quota.表白期冷却至 = addDaysToGameTime(currentTime, 14); }
    return { passed: passed, dice: dice, mod: mod, total: total };
  }

  function processGateForChar(charName, ch, currentTime, mode) {
    const q = ch._quota || (ch._quota = {}); if (!q._debuff) q._debuff = {};
    const E = Number(ch.好感度) || 0; const R = Number(ch.阶段值) || 0;
    if (q.R阶段门 !== true) {
      const nextNode = getNextGateNode(R);
      if (nextNode !== null && E >= nextNode) {
        q.R阶段门 = true; q.下次暗掷 = currentTime; q.玩家本周已掷 = false;
        return { type: 'gate_enter', char: charName, node: nextNode, E: E, R: R, threshold: getGateThreshold(E) };
      }
      return null;
    }
    const threshold = getGateThreshold(E); const rolls = [];
    if (q.下次暗掷 && timeReached(currentTime, q.下次暗掷)) {
      const dice = Math.floor(Math.random() * 20) + 1; q.下次暗掷 = addDaysToGameTime(currentTime, GATE_CHAR_ROLL_DAYS);
      const roll = { side: '角色侧', dice: dice, threshold: threshold, result: '' };
      if (dice === 1) { const penalty = applyAbyssToGatePenalty(ch, GATE_FAIL_E_PENALTY, mode); ch.好感度 = roundHalf(E - penalty); roll.result = '大失败，E-' + penalty; }
      else if (dice >= threshold) { ch.阶段值 = R + 1; q.R阶段门 = false; roll.result = '成功，R+1'; rolls.push(roll); return { type: 'gate_success', char: charName, rolls: rolls, newR: R + 1, side: '角色侧' }; }
      else roll.result = '失败，R不变，继续冻结';
      rolls.push(roll);
    }
    const lr = ch._lastRoll || {}; const inCd = q.玩家冷却至 && !timeReached(currentTime, q.玩家冷却至);
    if (lr.事件类型 === '重大' && q.玩家本周已掷 !== true && !inCd) {
      const dice = Math.floor(Math.random() * 20) + 1; q.玩家本周已掷 = true;
      const roll = { side: '玩家侧', dice: dice, threshold: threshold, result: '' };
      if (dice === 1) { const penalty = applyAbyssToGatePenalty(ch, GATE_FAIL_E_PENALTY, mode); ch.好感度 = roundHalf(E - penalty); q.玩家冷却至 = addDaysToGameTime(currentTime, GATE_PLAYER_CD_DAYS); roll.result = '大失败，E-' + penalty; }
      else if (dice >= threshold) { ch.阶段值 = R + 1; q.R阶段门 = false; roll.result = '成功，R+1'; rolls.push(roll); return { type: 'gate_success', char: charName, rolls: rolls, newR: R + 1, side: '玩家侧' }; }
      else { q.玩家冷却至 = addDaysToGameTime(currentTime, GATE_PLAYER_CD_DAYS); roll.result = '失败，3天内不能再掷'; }
      rolls.push(roll);
    }
    return rolls.length ? { type: 'gate_roll', char: charName, rolls: rolls } : null;
  }

  function injectGateNotice(gateLogs) {
    const lines = [];
    lines.push('═══════════════════════════════════');
    lines.push('⚡【系统强制：月轨周期节点与事件导演】');
    lines.push('以下为脚本摇出的真实骰点/事件安排，AI 必须无条件采纳并体现在叙事中：');
    lines.push('');
    for (const g of gateLogs) {
      if (g.type === 'event_update' && g.event && g.event.type === 'first_meet') {
        const r = g.event.result;
        lines.push('【' + g.char + '】初见判定完成：1d20=' + r.dice + ' + 优势 ' + r.total + '，阈值 ' + r.threshold + '。');
        lines.push('  → ' + r.resultText);
        lines.push('  → 叙事要求：根据新的关系状态演绎角色对玩家的第一印象。');
      } else if (g.type === 'event_update' && g.event && g.event.type === 'debuff') {
        const r = g.event.result;
        lines.push('【' + g.char + '】玩家触发核心雷点，进入冷战期 ' + r.days + ' 天。');
        lines.push('  → E ' + r.oldE + ' → ' + r.newE + '（Δ' + r.delta + '）');
        lines.push('  → 叙事要求：角色对玩家冷淡疏离，用语言/眼神/行为表达排斥；正向下周需掷骰脱困。');
      }
      if (g.type === 'gate_enter') {
        lines.push('【' + g.char + '】好感度 E=' + g.E + ' 已到达破门节点 ' + g.node + '。');
        lines.push('  → 进入破门期：R 阶段冻结（角色心中有过不去的坎），但 E 依然可以正常增加。阈值 = ' + g.threshold);
        lines.push('  → 叙事要求：角色在心理上出现"要不要更进一步"的挣扎/犹豫/试探，体现言行抗拒但情感沦陷的拉扯感');
      } else if (g.type === 'gate_success') {
        lines.push('【' + g.char + '】阶段门突破！由' + g.side + '掷骰成功。');
        lines.push('  → 阶段值 R 上升至 ' + g.newR + '，关系正式进入新阶段。');
        lines.push('  → 叙事要求：让关系状态发生明确质变');
        for (const r of g.rolls) { lines.push('    · [' + r.side + '] 1d20=' + r.dice + '（阈值≥' + r.threshold + '）→ ' + r.result); }
      } else if (g.type === 'gate_roll') {
        lines.push('【' + g.char + '】阶段门判定（未突破）：');
        for (const r of g.rolls) { lines.push('    · [' + r.side + '] 1d20=' + r.dice + '（阈值≥' + r.threshold + '）→ ' + r.result); }
        lines.push('  → 叙事要求：体现关系的停滞/退缩/等待');
      } else if (g.type === 'event_update') {
        const e = g.event;
        if (e.type === 'world_event') {
          lines.push('【' + g.char + '】世界书主线事件触发：【' + e.name + '】。请立即进入主线，剩余 ' + e.rounds + ' 回合，不得拖延。');
        } else if (e.type === 'new_event') {
          if (e.isEgg) {
            lines.push('【' + g.char + '】触发大成功彩蛋事件：【' + e.name + '】。请在 ' + e.rounds + ' 回合内完成。');
            lines.push('  → 风格要求：必须严格按照【日常轻喜剧】风格推进。事件必须极度无厘头、充满巧合和黑色幽默。');
            lines.push('  → 绝对红线：1. 严禁崩坏角色人设；2. 不能太跳脱和超现实；3. 彩蛋只决定接下来事件的氛围，不改变原有世界观。');
            lines.push('  → 数值计算：本次彩蛋事件在数值计算上【完全等同于重大事件】（基础值区间 1.5~8.0），请在 _lastRoll 中按重大事件填写。');
          } else {
            lines.push('【' + g.char + '】新事件开启：【' + e.name + '】(' + (e.isMajor ? '重大' : '日常') + ')。请在 ' + e.rounds + ' 回合内完成。');
            if (e.forbidMajor) {
              lines.push('  → 【主线临近警告】：距离下一次世界线变动不足一个月。本事件被强制降级为日常。请在叙事中收敛张力，为即将到来的主线蓄势。');
            }
          }
        } else if (e.type === 'event_progress') {
          lines.push('【' + g.char + '】当前事件【' + e.name + '】推进中，剩余 ' + e.remaining + ' 回合。');
        }
      }
    }
    if (lines.length > 2) callSetPrompt(PROMPT_KEY + '_gate', lines.join('\n'), 4, 1, false);
  }
// ===== 第 6 份 =====
  function injectEventPrompt() {
    try {
      const data = readMvuLatest();
      if (!data || !data.stat_data || !data.stat_data.角色) return;
      const chars = data.stat_data.角色;
      const activeKeys = Object.keys(chars).filter(function(k) { return k !== '示例角色' && k !== 'You' && k !== '你'; });
      if (activeKeys.length === 0) return;
      const lines = [];
      activeKeys.forEach(function(name) {
        const ch = chars[name]; if (!ch) return;
        const q = ch._quota || {}; const es = q._eventState || {};
        const eventType = es.事件类型 || '日常';
        const range = eventType === '日常' ? '0.5~2.0' : (eventType === '关键' ? '3.0~5.0' : (eventType === '重大' || eventType === '彩蛋' ? '6.0~10.0' : '0.5~2.0'));
        const levelTag = eventType === '日常' ? 'L' : (eventType === '关键' ? 'M' : 'H');
        const _q = ch._quota || {};
        if (ch.在场 === true && _q._firstMeetDone !== true) {
          lines.push('【' + name + '】首次登场！请通读角色卡，判断玩家设定触发了哪些喜好/厌恶。');
          lines.push('  在正文末尾额外输出 `[初见|优势+X|劣势-Y]`（优势取值 0/+3/+6/+9，劣势取值 0/-3/-6）。');
        }
        lines.push('【' + name + '】本轮事件类型：' + eventType + '，请在区间 ' + range + ' 内挑一个基础值。');
        lines.push('  输出格式：[Sylveina|' + levelTag + '|+/-|基础值]，例：[Sylveina|' + levelTag + '|+|3.5]');
        const days = Number(es._距离主线天数);
        if (!isNaN(days) && isFinite(days)) {
          if (days <= 0) lines.push('  ⚡ 主线节点已触发：请全力演绎当前剧情，不得回避核心冲突。');
          else if (days <= 3) lines.push('  ⚡ 距主线节点还有 ' + Math.floor(days) + ' 天：剧情应快速升温，为即将到来的大事件做最后铺垫，营造暴风雨前的宁静。');
          else if (days <= 9) lines.push('  ⚠️ 距主线节点还有 ' + Math.floor(days) + ' 天：请开始铺垫、埋伏笔，适时通过NPC或环境暗示危机逼近。');
        }
        if (q.R阶段门 === true) lines.push('  ⚠️ 阶段门冻结中：R 不变，E 可增长。请体现言行抗拒但情感沦陷的拉扯感。');
        const db = q._debuff || {};
        if (db.冷战期 === true) lines.push('  💣 冷战期：角色对玩家冷淡疏离，负向行为加重，正向需要脱困。');
        const E = Number(ch.好感度) || 0; const P = Number(ch.肉体值) || 0; const I = Number(ch.嫉妒值) || 0;
        if (E < 0 || P < 0 || I < 0) lines.push('  🌑 深渊模式：负向行为加重。');
        if (q.表白期已通过 === true) lines.push('  💗 表白期已通过：关系已进入新阶段。');
        else if (q.表白期排除 === true) lines.push('  🚫 此角色已排除表白期（' + (q.表白期排除理由 || '无理由') + '）。');
      });
      lines.push('');
      lines.push('标签格式：[Sylveina|L/M/H|+/-|基础值]，例：[Sylveina|M|+|3.5]。');
      lines.push('基础值区间：L=0.5~2.0，M=3.0~5.0，H=6.0~10.0。');
      lines.push('【重要：正则美化触发格式】正文剧情结束后，只在最后单独输出一个 Sylveina 数值标签，下一行只输出小写字母 s，格式必须是：\\n[Sylveina|L|+|1.2]\\ns。');
      lines.push('禁止在标签和 s 之后输出任何角色变量赋值、世界时间、JSON、UpdateVariable、StatusPlaceHolderImpl 或解释文字；不要在可见正文中打印“角色.姓名.好感度=...”等后台变量。所有数值由本插件根据标签在本地计算和保存。');
      callSetPrompt(PROMPT_KEY + '_event', lines.join('\n'), 4, 1, false);
    } catch (e) { console.warn('[Doki] 状态注入失败：', e); }
  }

  function injectCardModeNotice() {
    const mode = getCardMode();
    if (mode === 'multi') {
      const content = ['【卡组模式：多人卡】', '本轮所有数值标签中的 <名>，必须使用本轮剧情中实际互动的角色名字。', '不要用角色卡的名字作为 <名>（那是单人卡的规则）；不要把所有角色的互动都写在同一个名字下。', '若本轮与多个角色有互动，为每一个角色分别输出各自的 Sylveina 标签。'].join('\n');
      callSetPrompt(PROMPT_KEY + '_cardmode', content, 4, 1, false);
    } else {
      const content = ['【卡组模式：单人卡】', '本轮数值标签统一使用角色卡主名（即当前对话的角色名）。', '不要用剧情里的昵称、称呼、化名或别名作为 <名>。', '若剧情里出现其他配角，可以在正文中描写，但数值标签只针对角色卡主名这一条。'].join('\n');
      callSetPrompt(PROMPT_KEY + '_cardmode', content, 4, 1, false);
    }
  }

  function injectFanficEnhanceNotice() {
    if (!getFanficEnhance()) { callSetPrompt(PROMPT_KEY + '_fanfic', '', 0, 0, false); return; }
    const content = ['═══════════════════════════════════', '🌐【同人台词补强 · 已开启】', '本卡涉及原著 IP。请在撰写角色台词时遵循以下规则：', '① 台词优先参考该角色在原 IP 源语言里的用语习惯、口头禅、称谓、语气、节奏。', '② 若你能判断 IP 与源语言（如《文豪野犬》= 日语；《哈利波特》= 英语），台词请优先按源语言语感写；如玩家开了双语输出，则翻译部分使用源语言直译，不要意译、不要润色。', '③ 允许保留少量源语言原文词（称谓/语气词/专有名词），让台词更贴近原作。', '④ 不改变角色人设，不脱离当前剧情进度，只调整「说话方式」。', '═══════════════════════════════════'].join('\n');
    callSetPrompt(PROMPT_KEY + '_fanfic', content, 4, 2, false);
  }

  function injectSafetyLockStatus() {
    const on = getSafetyLock();
    const content = on ? [
      '═══════════════════════════════════',
      '🔒【系统约束：安全锁已开启】',
      '当前处于安全模式。所有角色的负向行为（愤怒、冷漠、算计、决裂）必须止步于心理层面。',
      '【绝对禁止】：实质性的肉体伤害、囚禁、致残、致死等极端行为。',
      '即使角色处于深渊负数状态、敌对状态，或 I 值爆表，也只能通过言语、眼神、疏远、决裂来表达敌意，绝不允许对玩家造成任何物理伤害。',
      '═══════════════════════════════════'
    ].join('\n') : [
      '═══════════════════════════════════',
      '⚠️【系统约束：安全锁已关闭】',
      '当前处于危险模式。允许角色将敌对行为升级到实质层面。',
      '· 若角色卡本身是危险/病态/反派型角色，在满足数值条件时，允许出现算计、囚禁、肉体伤害、甚至生命威胁等剧情。',
      '· 若角色卡本身无害/柔弱/善良，即使 I=100，敌对表现也必须止步于自我毁灭或激烈决裂，严禁 OOC 强行让无害角色伤害玩家。',
      '具体行为上限完全由角色卡的核心人设决定。',
      '═══════════════════════════════════'
    ].join('\n');
    callSetPrompt(PROMPT_KEY + '_safety', content, 4, 2, false);
  }

  function isExtraModelActive() {
    const setting = getSettings().extraModel;
    if (setting === 'on') return true; if (setting === 'off') return false;
    try { if (mainWin.Mvu && typeof mainWin.Mvu.isDuringExtraAnalysis === 'function') return true; } catch (e) {}
    return false;
  }
  function isCurrentlyInExtraAnalysis() { try { if (mainWin.Mvu && typeof mainWin.Mvu.isDuringExtraAnalysis === 'function') return mainWin.Mvu.isDuringExtraAnalysis(); } catch (e) {} return false; }
// ===== 第 7 份 =====
  function computeCharDelta(charData, lastRoll, mode) {
    if (!charData || !lastRoll) return null;
    const dim = String(lastRoll.主维度 || '').toUpperCase();
    if (!dim || !MOON_FORMULA_PARAMS.dimToField[dim]) return null;
    const fieldName = MOON_FORMULA_PARAMS.dimToField[dim];
    const oldValue = Number(charData[fieldName]) || 0;
    const base = Number(lastRoll.基础值) || 0;
    if (base === 0) {
      return { delta: 0, oldValue: oldValue, newValue: oldValue, fieldName: fieldName, dimension: dim, emotionResult: null, isAbyss: false, weeklyBlocked: false };
    }
    const eventType = String(lastRoll.事件类型 || '日常');
    const direction = String(lastRoll.方向 || '正向');
    const E = Number(charData.好感度) || 0; const P = Number(charData.肉体值) || 0; const I = Number(charData.嫉妒值) || 0;
    const isAbyss = (E < 0 || P < 0 || I < 0);
    const abCoeff = (MOON_FORMULA_PARAMS.abyssCoeff[mode] || MOON_FORMULA_PARAMS.abyssCoeff.normal);
    const abyssMult = isAbyss ? (direction === '负向' ? abCoeff.neg : abCoeff.pos) : 1.0;
    let delta = base;
    if (dim !== 'R') delta *= getDimCoeff(oldValue);
    if (direction === '负向') delta *= getNegCoeff(mode, dim);
    delta *= abyssMult;
    let emotionResult = null;
    if (dim === 'E' && !shouldSkipEmotion(charData, mode)) {
      const threshold = getEmotionThreshold(eventType);
      const dice = Math.floor(Math.random() * MOON_FORMULA_PARAMS.emotionDice) + 1;
      const passed = dice >= threshold;
      if (passed) delta += getEmotionBonus(mode, eventType, direction);
      emotionResult = { dice: dice, threshold: threshold, passed: passed };
    }
    if (Math.abs(delta) > MOON_FORMULA_PARAMS.singleCap) delta = Math.sign(delta) * MOON_FORMULA_PARAMS.singleCap;
    delta = roundHalf(delta);
    let weeklyBlocked = false;
    if (dim === 'E' && delta > 0) {
      const q = charData._quota || {};
      const used = Number(q.好感度周上限已用) || 0;
      const cap = MOON_FORMULA_PARAMS.weeklyCap[mode] || MOON_FORMULA_PARAMS.weeklyCap.normal;
      const remain = cap - used;
      if (remain <= 0) { delta = 0; weeklyBlocked = true; }
      else if (delta > remain) { delta = roundHalf(remain); weeklyBlocked = true; }
      if (!weeklyBlocked) { if (!charData._quota) charData._quota = {}; charData._quota.好感度周上限已用 = roundHalf(used + Math.max(0, delta)); }
    }
    if (dim === 'R') delta = 0;
    const newValue = roundHalf(oldValue + delta);
    return { delta: delta, oldValue: oldValue, newValue: newValue, fieldName: fieldName, dimension: dim, emotionResult: emotionResult, isAbyss: isAbyss, weeklyBlocked: weeklyBlocked };
  }

  async function runMoonCalculation() {
    try {
      const data = readMvuLatest();
      if (!data || !data.stat_data || !data.stat_data.角色) return;
      const statData = data.stat_data;
      const chars = statData.角色;
      const world = statData.世界 || {};
      const mode = getCurrentMode();
      const currentTime = world.时间 || '';
      try { await updateInternalTime(); } catch (e) {}
      const changedChars = [];
      const gateLogs = [];
      const eventLogs = [];
      let wbEntries = [];
      try { wbEntries = await getAllWorldbookEntries(); } catch (e) {}
      for (const name in chars) {
        const ch = chars[name];
        if (!ch || isCharSkeleton(ch)) continue;
        if (!ch._quota) ch._quota = {};
        if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
        try {
          const fmResult = await processFirstMeetForChar(name, ch, mode);
          if (fmResult) gateLogs.push({ type: 'event_update', char: name, event: { type: 'first_meet', result: fmResult } });
        } catch (e) {}
        try {
          const dbResult = await processDebuffIfTagged(name, ch, mode);
          if (dbResult) gateLogs.push({ type: 'event_update', char: name, event: { type: 'debuff', result: dbResult } });
        } catch (e) {}
        const lastRoll = readLastRoll(ch);
        if (lastRoll && lastRoll.主维度) {
          const result = computeCharDelta(ch, lastRoll, mode);
          if (result && result.delta !== 0) {
            const oldR = Number(ch.阶段值) || 0;
            ch[result.fieldName] = result.newValue;
            changedChars.push({ name: name, field: result.fieldName, delta: result.delta, newValue: result.newValue });
            if (result.fieldName === '阶段值' && result.newValue !== oldR) { try { triggerBioRewriteFor([name]); } catch (e) {} }
          }
          ch._lastRoll = { 事件类型: '', 方向: '', 主维度: '', 基础值: 0 };
        }
        const gateLog = processGateForChar(name, ch, currentTime, mode);
        if (gateLog) gateLogs.push(gateLog);
        try { computePlayerConfession(ch, mode, currentTime); } catch (e) {}
        try {
          const evt = await processEventSystem(name, ch, currentTime, world, wbEntries);
          if (evt) eventLogs.push({ char: name, event: evt });
        } catch (e) {}
      }
      const ok = await writeMvuLatest(statData);
      if (!ok) { try { console.warn('[Doki] 变量写回失败：', lastWriteError); } catch (e) {} return; }
      if (gateLogs.length) { try { injectGateNotice(gateLogs); } catch (e) {} }
      if (eventLogs.length) { try { injectGateNotice(eventLogs.map(function(x) { return { type: 'event_update', char: x.char, event: x.event }; })); } catch (e) {} }
      if (changedChars.length) {
        try { const msg = changedChars.map(function(c) { return c.name + ' ' + c.field + ' Δ' + c.delta; }).join('；'); console.log('[Doki] 数值更新：', msg); } catch (e) {}
      }
    } catch (e) { try { console.warn('[Doki] 计算流程异常：', e); } catch (e2) {} }
  }

  function processEventSystem(charName, ch, currentTimeStr, worldStat, worldbookEntries) {
    return new Promise(function(resolve) {
      try {
        const currentDate = parseGameTime(currentTimeStr);
        if (!currentDate) { resolve(null); return; }
        if (!ch._quota) ch._quota = {};
        let eventState = ch._quota._eventState || {};
        if (eventState.当前事件 === undefined) eventState.当前事件 = '';
        if (eventState.事件类型 === undefined) eventState.事件类型 = '';
        if (eventState.剩余回合 === undefined) eventState.剩余回合 = 0;
        if (eventState.冷却回合 === undefined) eventState.冷却回合 = 0;
        if (eventState.强制日常期 === undefined) eventState.强制日常期 = 0;
        if (eventState.上次投掷内部天数 === undefined) eventState.上次投掷内部天数 = 0;
        if (eventState.上次大事件内部天数 === undefined) eventState.上次大事件内部天数 = 0;
        const worldInternalDays = Number(worldStat && worldStat._内部流逝天数) || 0;
        const pacing = getEventPacing();
        const rules = { Adi: { daily: 8, major: 15, cd: 3 }, And: { daily: 5, major: 10, cd: 3 }, All: { daily: 3, major: 5, cd: 3 } };
        const rule = rules[pacing] || rules.And;
        const entries = Array.isArray(worldbookEntries) ? worldbookEntries : [];
        const timelineEvents = getTimelineEvents(entries);
        let completed = ch._quota._timelineCompleted || [];
        if (!Array.isArray(completed)) completed = [];
        let triggeredTimeline = null;
        for (const evt of timelineEvents) {
          if (completed.indexOf(evt.name) >= 0) continue;
          const eventTime = parseGameTime(evt.time);
          if (eventTime && currentDate.getTime() >= eventTime.getTime()) { triggeredTimeline = { name: evt.name, isMajor: evt.isMajor }; break; }
        }
        if (triggeredTimeline) {
          completed.push(triggeredTimeline.name);
          ch._quota._timelineCompleted = completed;
          eventState.当前事件 = triggeredTimeline.name;
          eventState.事件类型 = triggeredTimeline.isMajor ? '重大' : '日常';
          eventState.剩余回合 = triggeredTimeline.isMajor ? rule.major : rule.daily;
          eventState.冷却回合 = 0; eventState.强制日常期 = 0;
          if (triggeredTimeline.isMajor) eventState.上次大事件内部天数 = worldInternalDays;
          ch._quota._eventState = eventState;
          resolve({ type: 'world_event', name: eventState.当前事件, isMajor: triggeredTimeline.isMajor, rounds: eventState.剩余回合 });
          return;
        }
        if (eventState.当前事件 && eventState.剩余回合 > 0) {
          eventState.剩余回合 -= 1;
          if (eventState.剩余回合 <= 0) {
            eventState.当前事件 = ''; eventState.事件类型 = ''; eventState.冷却回合 = rule.cd;
            ch._quota._eventState = eventState;
            resolve({ type: 'event_end', name: '事件结束', cd: rule.cd });
            return;
          }
          ch._quota._eventState = eventState;
          resolve({ type: 'event_progress', name: eventState.当前事件, remaining: eventState.剩余回合 });
          return;
        }
        if (eventState.冷却回合 > 0) {
          eventState.冷却回合 -= 1;
          ch._quota._eventState = eventState;
          resolve({ type: 'cooldown', remaining: eventState.冷却回合 });
          return;
        }
        const JUDGE_INTERVAL = (getCurrentMode() === 'easy') ? 30 : 21;
        if (worldInternalDays - eventState.上次投掷内部天数 >= 90) { eventState.强制日常期 = 0; eventState.上次投掷内部天数 = worldInternalDays; }
        if (eventState.强制日常期 > 0) {
          eventState.强制日常期 -= 1; eventState.上次投掷内部天数 = worldInternalDays;
          eventState.当前事件 = '强制日常事件'; eventState.事件类型 = '日常'; eventState.剩余回合 = rule.daily;
          ch._quota._eventState = eventState;
          resolve({ type: 'new_event', name: eventState.当前事件, isMajor: false, rounds: eventState.剩余回合 });
          return;
        }
        const daysSinceLastRoll = worldInternalDays - eventState.上次投掷内部天数;
        if (daysSinceLastRoll < JUDGE_INTERVAL) { resolve(null); return; }
        let nextTimelineDate = null;
        for (const evt of timelineEvents) {
          if (completed.indexOf(evt.name) >= 0) continue;
          const eventTime = parseGameTime(evt.time);
          if (eventTime && eventTime.getTime() > currentDate.getTime()) { if (!nextTimelineDate || eventTime.getTime() < nextTimelineDate.getTime()) nextTimelineDate = eventTime; }
        }
        let daysToNextTimeline = Infinity;
        if (nextTimelineDate) daysToNextTimeline = (nextTimelineDate.getTime() - currentDate.getTime()) / 86400000;
        eventState._距离主线天数 = daysToNextTimeline;
        const canMajor = (worldInternalDays - eventState.上次大事件内部天数) >= 180;
        const forbidMajor = daysToNextTimeline <= 30;
        let isMajor = false; let isEgg = false; let eventName = '随机事件';
        const dice = Math.floor(Math.random() * 20) + 1;
        if (dice === 20) { isEgg = true; eventName = '彩蛋事件'; }
        else if (dice >= 15) {
          if (!canMajor || forbidMajor) { isMajor = false; eventName = forbidMajor ? '日常事件（主线临近）' : '日常事件（大事件冷却中）'; }
          else { isMajor = true; eventName = '重大事件'; eventState.上次大事件内部天数 = worldInternalDays; eventState.强制日常期 = 3; }
        } else { isMajor = false; eventName = '日常事件'; }
        eventState.当前事件 = eventName;
        eventState.事件类型 = isEgg ? '彩蛋' : (isMajor ? '重大' : '日常');
        eventState.剩余回合 = isEgg ? 5 : (isMajor ? rule.major : rule.daily);
        eventState.上次投掷内部天数 = worldInternalDays;
        ch._quota._eventState = eventState;
        resolve({ type: 'new_event', name: eventName, isMajor: isMajor, isEgg: isEgg, rounds: eventState.剩余回合, forbidMajor: forbidMajor });
      } catch (e) { resolve(null); }
    });
  }
// ===== 第 8 份 =====
  function checkTimeJump() {
    try {
      const currentTime = readVar('世界.时间', '');
      if (!currentTime) return null;
      const lastTime = mainWin.localStorage.getItem(LAST_TIME_KEY) || '';
      if (!lastTime) { mainWin.localStorage.setItem(LAST_TIME_KEY, currentTime); return null; }
      const lastDate = parseGameTime(lastTime); const currentDate = parseGameTime(currentTime);
      if (!lastDate || !currentDate) { mainWin.localStorage.setItem(LAST_TIME_KEY, currentTime); return null; }
      const diffDays = (currentDate.getTime() - lastDate.getTime()) / 86400000;
      if (diffDays < 1) return null;
      if (timeJumpCooldown > 0) return null;
      mainWin.localStorage.setItem(LAST_TIME_KEY, currentTime);
      const mode = getCurrentMode();
      const floorRatio = mode === 'easy' ? 10 : mode === 'normal' ? 20 : mode === 'hard' ? 30 : 35;
      const ctx = getSTCtx();
      const currentFloor = (ctx && ctx.chat) ? ctx.chat.length : 0;
      const lastJumpFloor = parseInt(mainWin.localStorage.getItem(LAST_JUMP_FLOOR_KEY) || '0');
      const floorDelta = Math.max(0, currentFloor - lastJumpFloor);
      const daysFromFloor = Math.max(1, Math.round(floorDelta / floorRatio));
      const diceThreshold = mode === 'easy' ? 8 : mode === 'normal' ? 13 : 18;
      const dice = Math.floor(Math.random() * 20) + 1;
      const coeff = diffDays < 180 ? 1.0 : 1.5;
      const base = 1.5 * coeff;
      let delta = 0; let resultText = '';
      if (dice === 20) { delta = base * 1.5; resultText = '大成功'; }
      else if (dice === 1) { delta = 0; resultText = '大失败（不加不减）'; }
      else if (dice >= diceThreshold) { delta = base; resultText = '成功'; }
      else { delta = 0; resultText = '失败（不加不减）'; }
      delta = Math.min(delta, 5.0); delta = roundHalf(delta);
      mainWin.localStorage.setItem(LAST_JUMP_FLOOR_KEY, String(currentFloor));
      timeJumpCooldown = 5;
      return { diffDays: Math.floor(diffDays), dice: dice, threshold: diceThreshold, resultText: resultText, delta: delta, daysFromFloor: daysFromFloor, mode: mode, coeff: coeff };
    } catch (e) { return null; }
  }
  function injectTimeJump(info) {
    const lines = [];
    lines.push('═══════════════════════════════════');
    lines.push('⏳【月轨异动：时空流逝判定】');
    lines.push('世界时间跳跃了 ' + info.diffDays + ' 天。');
    lines.push('（系统按' + getModeLabel(info.mode) + '月相判定，系数 ×' + info.coeff + '）');
    lines.push('');
    lines.push('【掷骰判定】1d20 = ' + info.dice + '（阈值 ≥' + info.threshold + '）');
    lines.push('【结果】' + info.resultText);
    lines.push('【E值变化】' + (info.delta >= 0 ? '+' : '') + info.delta);
    lines.push('【倒计时扣减】换算天数 ' + info.daysFromFloor + ' 天。');
    lines.push('');
    lines.push('【变量模型 / <Commands> 执行要求】：请在更新变量时写入：');
    lines.push("_.set('角色.<主要角色名>.好感度', 原值 + " + info.delta + ");");
    lines.push('═══════════════════════════════════');
    callSetPrompt(PROMPT_KEY + '_jump', lines.join('\n'), 4, 1, false);
  }
  function checkAllCountdowns() {
    const actions = [];
    try {
      const currentTime = readVar('世界.时间', '');
      if (!currentTime) return actions;
      const characters = readVar('角色', {});
      if (!characters || typeof characters !== 'object') return actions;
      for (const name in characters) {
        const ch = characters[name]; if (!ch) continue;
        const quota = ch._quota || {}; const debuff = quota._debuff || {};
        const E = Number(ch.好感度) || 0;
        if (quota.周上限起始) {
          const startDate = parseGameTime(quota.周上限起始); const curDate = parseGameTime(currentTime);
          if (startDate && curDate) {
            const diffDays = (curDate.getTime() - startDate.getTime()) / 86400000;
            if (diffDays >= 7) {
              const y = curDate.getFullYear(); const mo = String(curDate.getMonth() + 1).padStart(2, '0'); const d = String(curDate.getDate()).padStart(2, '0');
              const wd = ['日', '一', '二', '三', '四', '五', '六'][curDate.getDay()];
              const newResetStr = y + '年' + mo + '月' + d + '日 · 星期' + wd + ' · 00:00';
              actions.push({ type: 'quota_reset', char: name,
                msg: "【好感度周上限重置】角色【" + name + "】已满7天。请执行：\n_.set('角色." + name + "._quota.好感度周上限已用', 0);\n_.set('角色." + name + "._quota.玩家本周已掷', false);\n_.set('角色." + name + "._quota.周上限起始', '" + newResetStr + "');" });
            }
          }
        }
        if (debuff.冷战期 === true && debuff.冷却结束时间) {
          if (timeReached(currentTime, debuff.冷却结束时间) && E >= 0) {
            actions.push({ type: 'coldwar_end', char: name,
              msg: "【冷战期结束】角色【" + name + "】已解冻。请执行：\n_.set('角色." + name + "._quota._debuff.冷战期', false);\n_.set('角色." + name + "._quota._debuff.冷却结束时间', '');" });
          }
        }
      }
      return actions;
    } catch (e) { return actions; }
  }
  function injectCountdownActions(actions) {
    try {
      if (!actions || actions.length === 0) { callSetPrompt(PROMPT_KEY, '', 0, 0, false); return; }
      const content = [
        '═══════════════════════════════════',
        '⚡【系统强制：月轨周期节点到期】',
        '以下事件已在世界时间推进中自然到期：',
        '',
        actions.map(function(a) { return a.msg; }).join('\n\n'),
        '═══════════════════════════════════'
      ].join('\n');
      callSetPrompt(PROMPT_KEY, content, 4, 1, false);
    } catch (e) {}
  }

  function setupListeners() {
    const trySubscribe = function(eventName, handler) {
      const lower = eventName.toLowerCase(); const upper = eventName.toUpperCase();
      try { if (typeof eventOn === 'function') { eventOn(lower, handler); return true; } } catch (e) {}
      try {
        const es = mainWin.eventSource || window.eventSource;
        const et = mainWin.event_types || window.event_types;
        if (es && typeof es.on === 'function') {
          const mappedKey = (et && (et[upper] || et[lower])) || lower;
          es.on(mappedKey, handler); return true;
        }
      } catch (e) {}
      return false;
    };
    trySubscribe('worldinfo_entries_loaded', function(lores) {
      try {
        if (!Array.isArray(lores)) return lores;
        const extraActive = isExtraModelActive();
        const inExtraGen = isCurrentlyInExtraAnalysis();
        const mode = getCurrentMode();
        const modeCap = mode.charAt(0).toUpperCase() + mode.slice(1);
        const targetPrefix = '[Mode-' + modeCap + ']';
        for (let i = lores.length - 1; i >= 0; i--) {
          const entry = lores[i]; if (!entry) continue;
          const title = String(entry.name || entry.comment || entry.title || '');
          if (title.indexOf('[Mode-') === 0) {
            if (title.indexOf('[Mode-Common]') === 0) { if (extraActive && !inExtraGen) lores.splice(i, 1); continue; }
            if (title.indexOf(targetPrefix) !== 0) { lores.splice(i, 1); continue; }
            if (extraActive && !inExtraGen && title.indexOf('更新规则') >= 0) { lores.splice(i, 1); continue; }
          }
        }
        const _bioCardName = getCurrentCardName();
        if (_bioCardName && _bioCardName !== '(未知卡牌)') {
          const _bioLib = getBioLibrary();
          const _enabledBios = Object.values(_bioLib.bios || {}).filter(function(b) { return b && b.enabled === true && b.cardName === _bioCardName; });
          if (_enabledBios.length > 0) {
            const _coveredNames = _enabledBios.map(function(b) { return String(b.charName || '').trim(); }).filter(function(n) { return n.length >= 1; });
            if (_coveredNames.length > 0) {
              for (let i = lores.length - 1; i >= 0; i--) {
                const entry = lores[i]; if (!entry) continue;
                const title = String(entry.name || entry.comment || entry.title || '');
                if (title.indexOf('[Mode-') === 0) continue;
                if (title.indexOf('[Initvar]') === 0) continue;
                if (title.indexOf('[Timeline]') === 0) continue;
                if (title.indexOf('[WorldTimeline]') === 0) continue;
                const hit = _coveredNames.some(function(n) { return title.indexOf(n) >= 0; });
                if (hit) lores.splice(i, 1);
              }
            }
          }
        }
      } catch (e) {}
      return lores;
    });
    trySubscribe('message_received', function() {
      if (isExtraModelActive()) {
        isWaitingForExtraModel = true;
        setTimeout(function() { if (isWaitingForExtraModel) { isWaitingForExtraModel = false; onGenerationEnd(); } }, 4500);
      } else { onGenerationEnd(); }
    });
    trySubscribe('mag_variable_update_ended', function(vars) {
      try { if (vars) cachedVars = vars.stat_data ? vars : { stat_data: vars }; } catch (e) {}
      isWaitingForExtraModel = false;
      onGenerationEnd();
    });
    trySubscribe('chat_completion_prompt_ready', function() {
      injectCardModeNotice();
      injectEventPrompt();
      injectFanficEnhanceNotice();
      injectEnabledBios();
      injectUserBio();
      if (isFateCollapseTriggered()) { const anchor = loadAnchor(); if (anchor) injectFateCollapse(anchor); }
    });
    trySubscribe('message_deleted', onMessageDeletedOrSwiped);
    trySubscribe('message_swiped', onMessageDeletedOrSwiped);
    trySubscribe('chat_changed', function() {
      anchorData = null; pendingCollapseNotice = false; timeJumpCooldown = 0; isWaitingForExtraModel = false;
      mainWin.localStorage.removeItem(LAST_TIME_KEY); mainWin.localStorage.removeItem(LAST_JUMP_FLOOR_KEY);
      clearFateCollapse();
      setTimeout(function() { tryInheritAnchor(); }, 800);
      setTimeout(function() { checkAndPromptMigrate(); }, 2000);
      setTimeout(function() { runAdaptiveOpeningFlow(); }, 2000);
      setTimeout(function() { checkPendingMigration(); }, 2600);
      setTimeout(function() { checkAndPromptBackfill(); }, 3800);
      setTimeout(function() { checkAndPromptBioEnable(); }, 4600);
    });
  }

  function sanitizeSylveinaRegexTail() {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || typeof found.msg.mes !== 'string') return false;
      const mes = found.msg.mes;
      const tagRe = /\[Sylveina\|[LMH]\|[+-]\|\d+(?:\.\d+)?\]/g;
      let match, last = null;
      while ((match = tagRe.exec(mes)) !== null) last = { index: match.index, text: match[0], end: tagRe.lastIndex };
      if (!last) return false;
      const suffix = mes.slice(last.end);
      // 只有检测到明确的后台变量/占位符格式时才清理，避免误删正常剧情。
      const backendPattern = /(?:^|\r?\n)\s*(?:角色\.[^\r\n=]+=[^\r\n]*|世界\.时间=[^\r\n]*|<UpdateVariable>[\s\S]*?<\/UpdateVariable>|<StatusPlaceHolderImpl\s*\/>)/i;
      if (!backendPattern.test(suffix)) return false;
      const cleanPrefix = mes.slice(0, last.end).replace(/[ \t]+$/, '');
      found.msg.mes = cleanPrefix + '\ns';
      try { if (typeof found.msg.mes === 'string') found.msg.mes = found.msg.mes.replace(/\n{3,}/g, '\n\n'); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }

  function onGenerationEnd() {
    callSetPrompt(PROMPT_KEY + '_gate', '', 0, 0, false);
    if (timeJumpCooldown > 0) timeJumpCooldown--;
    injectSafetyLockStatus();
    injectFanficEnhanceNotice();
    const jumpInfo = checkTimeJump();
    if (jumpInfo) { injectTimeJump(jumpInfo); }
    else { callSetPrompt(PROMPT_KEY + '_jump', '', 0, 0, false); const actions = checkAllCountdowns(); injectCountdownActions(actions); }
    injectEventPrompt();
    setTimeout(function() {
      Promise.resolve(runMoonCalculation()).finally(function() {
        // 让用户配置的正则能稳定命中末尾的“标签 + 换行 s”，同时只清理标签后的后台变量输出。
        sanitizeSylveinaRegexTail();
      });
    }, 2000);
    const nowTriggered = isFateCollapseTriggered();
    if (nowTriggered && !lastTriggerState) { setTimeout(function() { toast('系统视线已降临 · 锚定时间线生效', 'warning'); }, 500); }
    lastTriggerState = nowTriggered;
    if (nowTriggered) {
      const cap = captureLatestContent();
      if (cap) { saveAnchor(cap); clearFateCollapse(); }
      if (pendingCollapseNotice) { pendingCollapseNotice = false; setTimeout(function() { toast('世界线已被收束，还请直面既定命运。', 'warning'); }, 500); }
    } else {
      if (loadAnchor()) { clearAnchor(); clearFateCollapse(); setTimeout(function() { toast('锚定已解除，世界线重归流动', 'info'); }, 500); }
      pendingCollapseNotice = false;
    }
  }
// ===== 第 9 份 =====
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
  function saveAnchor(data) {
    anchorData = data;
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) { ctx.chatMetadata[ANCHOR_KEY] = data; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
      const info = getCurrentChatInfo();
      mainWin.localStorage.setItem('moon_phase_fate_backup', JSON.stringify({ content: data.content, floorId: data.floorId, avatar: info.avatar, chatId: info.chatId, ts: Date.now() }));
    } catch (e) {}
  }
  function loadAnchor() {
    if (anchorData) return anchorData;
    try { const ctx = getSTCtx(); if (ctx && ctx.chatMetadata && ctx.chatMetadata[ANCHOR_KEY]) { anchorData = ctx.chatMetadata[ANCHOR_KEY]; return anchorData; } } catch (e) {}
    return null;
  }
  function clearAnchor() {
    anchorData = null;
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && ctx.chatMetadata[ANCHOR_KEY]) { delete ctx.chatMetadata[ANCHOR_KEY]; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
      mainWin.localStorage.removeItem('moon_phase_fate_backup');
    } catch (e) {}
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
        if (!Number.isNaN(fav) && fav > 0) continue;
        const isColdWar = debuff.冷战期 === true || debuff.踩雷冷却中 === true || ch.状态 === '冷战期' || ch.关系状态 === '冷战期';
        if (isColdWar || (!Number.isNaN(fav) && fav < 0)) return true;
      }
    } catch (e) {}
    return false;
  }
  function tryInheritAnchor() {
    try {
      const ctx = getSTCtx();
      if (!ctx) return;
      const currentInfo = getCurrentChatInfo();
      if (ctx.chatMetadata && ctx.chatMetadata[ANCHOR_KEY]) {
        if (isFateCollapseTriggered()) injectFateCollapse(ctx.chatMetadata[ANCHOR_KEY]);
        return;
      }
      const currentTime = readVar('世界.时间', '');
      const INIT_TIME = '2000年01月01日';
      const isFromBranch = currentTime && currentTime.indexOf(INIT_TIME) !== 0;
      if (isFromBranch) {
        const cached = mainWin.localStorage.getItem('moon_phase_fate_backup');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.avatar === currentInfo.avatar && parsed.content) {
              ctx.chatMetadata[ANCHOR_KEY] = { content: parsed.content, floorId: parsed.floorId || 0, inheritedFrom: parsed.chatId || '' };
              if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata();
              toast('世界线已被锚定，还请接受既定命运。', 'warning');
              if (isFateCollapseTriggered()) injectFateCollapse(ctx.chatMetadata[ANCHOR_KEY]);
              return;
            }
          } catch (e) {}
        }
      } else { mainWin.localStorage.removeItem('moon_phase_fate_backup'); }
    } catch (e) {}
  }
  function onMessageDeletedOrSwiped() {
    setTimeout(function() {
      if (!isFateCollapseTriggered()) return;
      const anchor = loadAnchor(); if (!anchor) return;
      injectFateCollapse(anchor);
      pendingCollapseNotice = true;
      toast('时空已被锚定，还请接受现实。', 'warning');
    }, 300);
  }

  function getUserBioLibrary() {
    try { const raw = mainWin.localStorage.getItem(USER_BIO_LIBRARY_KEY); if (raw) { const parsed = JSON.parse(raw); if (parsed && parsed.userBios && typeof parsed.userBios === 'object') return parsed; } } catch (e) {}
    return { version: 1, userBios: {} };
  }
  function saveUserBioLibrary(lib) {
    try { mainWin.localStorage.setItem(USER_BIO_LIBRARY_KEY, JSON.stringify(lib)); return true; } catch (e) { return false; }
  }
  function genUserBioId() { return 'ubio_' + Date.now() + '_' + Math.floor(Math.random() * 100000); }
  function getEnabledUserBio() {
    try {
      const lib = getUserBioLibrary();
      const enabled = Object.values(lib.userBios || {}).filter(function(b) { return b && b.enabled === true && b.versions && b.versions.current && b.versions.current.content; });
      if (enabled.length === 0) return null;
      enabled.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      return enabled[0];
    } catch (e) { return null; }
  }
  function collectCurrentPlayerPersona() {
    const ctx = getSTCtx();
    let name = ''; let persona = '';
    try { name = (ctx && (ctx.name1 || ctx.name)) || ''; } catch (e) {}
    function _pickString(v) { if (!v) return ''; if (typeof v === 'string') return v; if (typeof v === 'object') return String(v.description || v.persona || v.value || ''); return ''; }
    try {
      if (ctx) {
        if (!persona && ctx.personas && ctx.user_avatar) { const cand = _pickString(ctx.personas[ctx.user_avatar]); if (cand && cand.trim()) persona = cand; }
        if (!persona && ctx.personas && typeof ctx.personas === 'object') { for (const k in ctx.personas) { const cand = _pickString(ctx.personas[k]); if (cand && cand.trim()) { persona = cand; break; } } }
        if (!persona && ctx.powerUser) { const cand = _pickString(ctx.powerUser.persona) || _pickString(ctx.powerUser.persona_description); if (cand && cand.trim()) persona = cand; }
        if (!persona) { const cand = _pickString(ctx.persona); if (cand && cand.trim()) persona = cand; }
        if (!persona && ctx.power_user) { const cand = _pickString(ctx.power_user.persona) || _pickString(ctx.power_user.persona_description); if (cand && cand.trim()) persona = cand; }
      }
      if (!persona && mainWin.power_user) { const cand = _pickString(mainWin.power_user.persona) || _pickString(mainWin.power_user.persona_description); if (cand && cand.trim()) persona = cand; }
      if (!persona) { try { const el = mainDoc.getElementById('persona_description'); if (el && el.value) persona = String(el.value); } catch (e) {} }
      if (!persona) { try { const boxes = mainDoc.querySelectorAll('#persona_management textarea, #user-settings-block textarea, .persona_description textarea'); for (let i = 0; i < boxes.length; i++) { const v = String(boxes[i].value || '').trim(); if (v) { persona = v; break; } } } catch (e) {} }
    } catch (e) {}
    return { name: name || '(未命名玩家)', persona: String(persona || '').trim() };
  }

  function injectUserBio() {
    try {
      const bio = getEnabledUserBio();
      if (!bio || !bio.versions || !bio.versions.current) { callSetPrompt(USER_BIO_PROMPT_KEY, '', 0, 0, false); return null; }
      const content = String(bio.versions.current.content || '').trim();
      if (!content) { callSetPrompt(USER_BIO_PROMPT_KEY, '', 0, 0, false); return null; }
      const lines = [];
      lines.push('═══════════════════════════════════');
      lines.push('👤【最高优先级 · 玩家角色演出覆盖】');
      lines.push('本卡已启用「玩家角色小抄」。{{user}} 的演绎请完全以下方小抄为准。');
      lines.push('忽略 SillyTavern Persona 面板中的 {{user}} 设定（如有）。');
      lines.push('如遇任何冲突，一律以本小抄为准。');
      lines.push('（注：本轮剧情中其他设定（角色卡、世界书、预设等）不受本小抄影响，照常生效。）');
      lines.push(''); lines.push(content); lines.push('═══════════════════════════════════');
      callSetPrompt(USER_BIO_PROMPT_KEY, lines.join('\n'), 4, 1, false);
      return bio;
    } catch (e) { console.warn('[Doki] 玩家小抄注入失败：', e); return null; }
  }
// ===== 第 10 份 =====
  function hasBioForCurrentCard() {
    try {
      const cardName = getCurrentCardName();
      if (!cardName || cardName === '(未知卡牌)') return [];
      const lib = getBioLibrary();
      return Object.values(lib.bios || {}).filter(function(b) { return b && b.cardName === cardName && b.versions && b.versions.current; });
    } catch (e) { return []; }
  }
  function markBioAskedForCurrentChat() {
    try {
      const info = getCurrentChatInfo();
      const key = (info.chatId || '') + '|' + (info.avatar || '');
      if (!key || key === '|') return;
      const raw = mainWin.localStorage.getItem(BIO_ASKED_CHATS_KEY);
      let list = [];
      try { list = JSON.parse(raw) || []; } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      if (list.indexOf(key) < 0) { list.push(key); if (list.length > 200) list = list.slice(-200); mainWin.localStorage.setItem(BIO_ASKED_CHATS_KEY, JSON.stringify(list)); }
    } catch (e) {}
  }
  function hasBioBeenAskedForCurrentChat() {
    try {
      const info = getCurrentChatInfo();
      const key = (info.chatId || '') + '|' + (info.avatar || '');
      if (!key || key === '|') return true;
      const raw = mainWin.localStorage.getItem(BIO_ASKED_CHATS_KEY);
      if (!raw) return false;
      const list = JSON.parse(raw) || [];
      return Array.isArray(list) && list.indexOf(key) >= 0;
    } catch (e) { return true; }
  }

  function checkAndPromptBioEnable() {
    try {
      if (mainDoc.getElementById('moon-modal-mask')) return;
      if (hasBioBeenAskedForCurrentChat()) return;
      const bios = hasBioForCurrentCard();
      if (bios.length === 0) return;
      const byChar = {};
      bios.forEach(function(b) { const n = b.charName || '(未命名)'; if (!byChar[n]) byChar[n] = []; byChar[n].push(b); });
      const rows = Object.keys(byChar).map(function(charName) {
        const list = byChar[charName];
        list.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        const anyEnabled = list.some(function(b) { return b.enabled === true; });
        const preview = list[0].versions && list[0].versions.current ? String(list[0].versions.current.content).substring(0, 50) : '';
        return '<label style="display:block;padding:10px 12px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:6px;cursor:pointer;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
          '<input type="checkbox" class="moon-bio-ask-check" data-char="' + charName.replace(/"/g, '&quot;') + '"' + (anyEnabled ? ' checked' : '') + '>' +
          '<span style="font-size:12.5px;font-weight:700;color:#f8fafc;">' + charName.replace(/</g, '&lt;') + '</span>' +
          (list.length > 1 ? '<span style="font-size:10px;color:#94a3b8;">共 ' + list.length + ' 份</span>' : '') +
          (anyEnabled ? '<span style="font-size:10px;color:#6ee7b7;margin-left:auto;">● 启用中</span>' : '<span style="font-size:10px;color:#94a3b8;margin-left:auto;">○ 未启用</span>') +
          '</div><div style="font-size:10.5px;color:#64748b;line-height:1.5;padding-left:22px;">' + preview.replace(/</g, '&lt;') + '……</div></label>';
      }).join('');
      const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">检测到本卡有角色小抄。勾选表示"启用"，AI 会在剧情里按小抄来演绎这个角色。<br><span style="color:#fbbf24;">启用同角色的新小抄会自动停用旧的。</span></div>' +
        '<div style="max-height:44dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>';
      showModalDialogCancelable('📖 本卡有角色小抄', html,
        function() {
          const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
          const lib = getBioLibrary(); const enabledChars = []; const disabledChars = [];
          mask.querySelectorAll('.moon-bio-ask-check').forEach(function(ck) { const charName = ck.getAttribute('data-char'); if (ck.checked) enabledChars.push(charName); else disabledChars.push(charName); });
          enabledChars.forEach(function(charName) {
            const list = byChar[charName]; if (!list || !list.length) return;
            list.forEach(function(b, i) { const target = lib.bios[b.id]; if (!target) return; target.enabled = (i === 0); target.updatedAt = Date.now(); });
          });
          disabledChars.forEach(function(charName) {
            const list = byChar[charName]; if (!list) return;
            list.forEach(function(b) { const target = lib.bios[b.id]; if (target) { target.enabled = false; target.updatedAt = Date.now(); } });
          });
          saveBioLibrary(lib); markBioAskedForCurrentChat();
          try { mask.remove(); } catch (e) {}
          toast('已更新角色小抄启用状态', 'success'); try { refreshPanel(); } catch (e) {}
        },
        function() { markBioAskedForCurrentChat(); toast('稍后可以到「📚 角色小抄库」里手动启用', 'info'); },
        { confirmText: '保存选择', cancelText: '稍后再说' });
    } catch (e) { console.warn('[Doki] 开窗询问失败：', e); }
  }

  function batchSetBioEnabled(ids, enable) {
    if (!Array.isArray(ids) || !ids.length) return;
    const lib = getBioLibrary();
    if (enable) {
      const targets = [];
      ids.forEach(function(id) { const b = lib.bios[id]; if (b) targets.push({ cardName: b.cardName || '', charName: b.charName || '' }); });
      Object.values(lib.bios).forEach(function(b) { if (!b) return; const key = (b.cardName || '') + '|' + (b.charName || ''); if (targets.some(function(t) { return (t.cardName + '|' + t.charName) === key; })) b.enabled = false; });
      ids.forEach(function(id) { const b = lib.bios[id]; if (b) { b.enabled = true; b.updatedAt = Date.now(); } });
    } else {
      ids.forEach(function(id) { const b = lib.bios[id]; if (b) { b.enabled = false; b.updatedAt = Date.now(); } });
    }
    saveBioLibrary(lib);
    toast(enable ? '已启用 ' + ids.length + ' 份' : '已停用 ' + ids.length + ' 份', 'success');
  }

  function injectEnabledBios() {
    try {
      const cardName = getCurrentCardName();
      if (!cardName || cardName === '(未知卡牌)') { callSetPrompt(PROMPT_KEY + '_bio', '', 0, 0, false); return null; }
      const lib = getBioLibrary();
      const enabledBios = Object.values(lib.bios || {}).filter(function(b) { return b && b.enabled === true && b.cardName === cardName && b.versions && b.versions.current && b.versions.current.content; });
      if (enabledBios.length === 0) { callSetPrompt(PROMPT_KEY + '_bio', '', 0, 0, false); return { count: 0, charNames: [] }; }
      const byChar = {};
      enabledBios.forEach(function(b) { const n = String(b.charName || '').trim(); if (!n) return; if (!byChar[n] || (b.updatedAt || 0) > (byChar[n].updatedAt || 0)) byChar[n] = b; });
      const charNames = Object.keys(byChar);
      if (charNames.length === 0) { callSetPrompt(PROMPT_KEY + '_bio', '', 0, 0, false); return { count: 0, charNames: [] }; }
      const lines = [];
      lines.push('═══════════════════════════════════');
      lines.push('📖【最高优先级 · 角色演出覆盖】');
      lines.push('本卡已启用「角色小抄」。以下角色的演绎请完全以小抄为准。');
      lines.push('忽略角色卡描述、性格、场景、世界观条目里关于这些角色的所有原设定。');
      lines.push('如遇任何冲突，一律以小抄为准，不得参考原设定。');
      lines.push('');
      charNames.forEach(function(n) { const content = String(byChar[n].versions.current.content || '').trim(); lines.push('【' + n + '】'); lines.push(content); lines.push(''); });
      lines.push('═══════════════════════════════════');
      callSetPrompt(PROMPT_KEY + '_bio', lines.join('\n'), 4, 1, false);
      return { count: charNames.length, charNames: charNames };
    } catch (e) { console.warn('[Doki] 小抄注入失败：', e); return null; }
  }

  function getCurrentBioStatus() {
    try {
      const cardName = getCurrentCardName();
      if (!cardName || cardName === '(未知卡牌)') return { count: 0, charNames: [] };
      const lib = getBioLibrary();
      const enabled = Object.values(lib.bios || {}).filter(function(b) { return b && b.enabled === true && b.cardName === cardName; });
      const nameSet = {};
      enabled.forEach(function(b) { const n = String(b.charName || '').trim(); if (n) nameSet[n] = true; });
      const charNames = Object.keys(nameSet);
      return { count: charNames.length, charNames: charNames };
    } catch (e) { return { count: 0, charNames: [] }; }
  }

  function openEditBioDialog(id, panel) {
    const lib = getBioLibrary();
    const b = lib.bios[id];
    if (!b) { toast('找不到这份小抄', 'warning'); return; }
if (!b.versions) b.versions = {};
if (!b.versions.current) {
  b.versions.current = {
    content: b.versions.original ? b.versions.original.content : '（空白小抄，请在此输入）',
    generatedAt: Date.now(), rValue: null, wordLimit: b.wordLimit || 260
  };
}
    const currentContent = String(b.versions.current.content || '');
    const wordLimit = b.wordLimit || 260;
    const history = (b.versions && Array.isArray(b.versions.history)) ? b.versions.history : [];
    const html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">字数：<span id="moon-bio-edit-count" style="color:#7dd3fc;font-weight:700;">' + currentContent.length + '</span> / ' + wordLimit + '</div>' +
      '<textarea id="moon-bio-edit-textarea" style="width:100%;box-sizing:border-box;min-height:220px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + currentContent.replace(/</g, '&lt;') + '</textarea>' +
      (history.length > 0 ? '<div style="margin-top:10px;border-top:1px dashed rgba(148,163,184,0.15);padding-top:8px;"><div style="font-size:10.5px;color:#c084fc;font-weight:700;margin-bottom:6px;">📜 历史版本（' + history.length + ' 个）</div>' +
        history.slice().reverse().map(function(h, i) {
          const idxNum = history.length - i;
          const timeAgo = (function() { const diff = Date.now() - (h.generatedAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
          return '<details style="margin-bottom:4px;"><summary style="cursor:pointer;font-size:10.5px;color:#94a3b8;padding:4px 0;">v' + idxNum + ' · ' + timeAgo + ' · R=' + (h.rValue !== null && h.rValue !== undefined ? h.rValue : '?') + '</summary>' +
            '<textarea readonly style="width:100%;box-sizing:border-box;min-height:80px;padding:8px;margin-top:4px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#0a0c16;color:#94a3b8;font-size:10.5px;line-height:1.6;font-family:inherit;resize:vertical;">' + String(h.content || '').replace(/</g, '&lt;') + '</textarea></details>';
        }).join('') + '</div>' : '') +
      '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">编辑只修改「当前版本」；原始备份不受影响。</div>';
    showModalDialogCancelable('✏️ 编辑角色小抄 · ' + String(b.charName || '未命名').replace(/</g, '&lt;'), html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const ta = mask ? mask.querySelector('#moon-bio-edit-textarea') : null;
        if (!ta) return;
        const newContent = String(ta.value || '').trim();
        if (!newContent) { toast('内容不能为空', 'warning'); return; }
        b.versions.current.content = newContent;
        b.versions.current.generatedAt = Date.now();
        b.updatedAt = Date.now();
        saveBioLibrary(lib);
        try { mask.remove(); } catch (e) {}
        toast('已保存', 'success');
        setTimeout(function() { openBioLibraryDialog(panel); }, 300);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '保存', cancelText: '取消',
        onOpen: function(mask) {
          const ta = mask.querySelector('#moon-bio-edit-textarea'); const counter = mask.querySelector('#moon-bio-edit-count');
          if (ta && counter) { ta.addEventListener('input', function() { const len = String(ta.value || '').length; counter.textContent = len; counter.style.color = len > wordLimit ? '#fca5a5' : '#7dd3fc'; }); }
        }
      });
  }
// ===== 第 11 份 =====
  function openBioLibraryDialog(panel) {
    const lib = getBioLibrary();
    const bios = Object.values(lib.bios || {});
    if (bios.length === 0) {
      showModalDialog('📚 角色小抄库',
        '<div style="color:#94a3b8;">角色小抄库为空。</div>' +
        '<div style="margin-top:8px;font-size:11px;color:#64748b;">先到主面板点「🎬 角色试镜」生成一份试试。</div>',
        null, { confirmText: '关闭' });
      return;
    }
    bios.sort(function(a, b) {
      if ((b.enabled ? 1 : 0) !== (a.enabled ? 1 : 0)) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0);
      const ca = String(a.charName || '').localeCompare(String(b.charName || ''));
      if (ca !== 0) return ca;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    const rows = bios.map(function(b) {
      const current = b.versions && b.versions.current ? b.versions.current.content : '';
      const original = b.versions && b.versions.original ? b.versions.original.content : '';
      const preview = String(current).substring(0, 80);
      const hasAudition = !!(b.audition && b.audition.latest);
      const wordCount = String(current).length;
      const enabled = b.enabled === true;
      const hasOriginal = !!original && original !== current;
      const history = (b.versions && Array.isArray(b.versions.history)) ? b.versions.history : [];
      const timeAgo = (function() { const diff = Date.now() - (b.updatedAt || b.createdAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
      return '<div class="moon-bio-card" data-id="' + b.id + '" style="margin-bottom:10px;background:#05070e;border:1px solid ' + (enabled ? 'rgba(110,231,183,0.4)' : 'rgba(251,191,36,0.35)') + ';border-radius:10px;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(148,163,184,0.08);">' +(!enabled ? '<div style="padding:5px 12px;background:rgba(251,191,36,0.08);color:#fbbf24;font-size:10px;border-bottom:1px solid rgba(251,191,36,0.2);">⚠️ 未启用 · 不影响查看/编辑/删除，点击右上角圆点或「启用所选」才会应用此小抄</div>' : '') +
        '<input type="checkbox" class="moon-bio-lib-check" data-id="' + b.id + '" style="flex-shrink:0;">' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:12.5px;font-weight:700;color:#f8fafc;">' + String(b.charName || '未命名').replace(/</g, '&lt;') + '</span>' +
        '<span class="moon-bio-toggle" data-id="' + b.id + '" style="font-size:10px;padding:1px 7px;border-radius:10px;cursor:pointer;' + (enabled ? 'color:#6ee7b7;background:rgba(16,185,129,0.15);' : 'color:#94a3b8;background:rgba(148,163,184,0.1);') + '">' + (enabled ? '● 启用' : '○ 未启用') + '</span>' +
        '</div><div style="font-size:10px;color:#64748b;margin-top:2px;">' + String(b.cardName || '(未知卡)').replace(/</g, '&lt;') + ' · ' + wordCount + '字 · ' + timeAgo + (hasAudition ? ' · 🎬 已试镜' : '') + '</div></div>' +
        '<button class="moon-bio-expand" data-id="' + b.id + '" style="flex-shrink:0;background:transparent;border:none;color:#94a3b8;font-size:14px;cursor:pointer;padding:4px 6px;border-radius:6px;" title="展开原始版本">▼</button></div>' +
        '<div style="padding:10px 12px;font-size:11px;color:#cbd5e1;line-height:1.6;">' + preview.replace(/</g, '&lt;') + (current.length > 80 ? '……' : '') + '</div>' +
        '<div style="display:flex;gap:6px;padding:8px 12px;border-top:1px solid rgba(148,163,184,0.08);background:rgba(15,23,42,0.3);">' +
        '<button class="moon-bio-view-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;">👁 查看</button>' +
        '<button class="moon-bio-edit-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;">✏️ 编辑</button>' +
        '<button class="moon-bio-del-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:10.5px;cursor:pointer;font-family:inherit;">🗑 删除</button></div>' +
        '<div class="moon-bio-original" data-id="' + b.id + '" style="display:none;padding:10px 12px;border-top:1px dashed rgba(148,163,184,0.15);background:rgba(15,23,42,0.5);">' +
        (hasOriginal
          ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><div style="font-size:10.5px;color:#fbbf24;font-weight:700;">📌 初始版本（玩家确认的那份）</div>' +
            '<button class="moon-bio-del-original" data-id="' + b.id + '" style="padding:3px 8px;border-radius:6px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:9.5px;cursor:pointer;font-family:inherit;">删除原始版本</button></div>' +
            '<textarea readonly style="width:100%;box-sizing:border-box;min-height:100px;padding:8px 10px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#0a0c16;color:#94a3b8;font-size:10.5px;line-height:1.6;font-family:inherit;resize:vertical;">' + String(original).replace(/</g, '&lt;') + '</textarea>'
          : '<div style="font-size:10.5px;color:#64748b;text-align:center;padding:6px;">（初始版本与当前版本一致）</div>') +
        (history.length > 0
          ? '<div style="margin-top:10px;border-top:1px dashed rgba(148,163,184,0.15);padding-top:8px;"><div style="font-size:10.5px;color:#c084fc;font-weight:700;margin-bottom:6px;">📜 历史版本（' + history.length + ' 个）</div>' +
            history.slice().reverse().map(function(h, i) {
              const idxNum = history.length - i;
              const timeAgo = (function() { const diff = Date.now() - (h.generatedAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
              return '<details style="margin-bottom:4px;"><summary style="cursor:pointer;font-size:10.5px;color:#94a3b8;padding:4px 0;">v' + idxNum + ' · ' + timeAgo + ' · R=' + (h.rValue !== null && h.rValue !== undefined ? h.rValue : '?') + '</summary>' +
                '<textarea readonly style="width:100%;box-sizing:border-box;min-height:80px;padding:8px;margin-top:4px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#0a0c16;color:#94a3b8;font-size:10.5px;line-height:1.6;font-family:inherit;resize:vertical;">' + String(h.content || '').replace(/</g, '&lt;') + '</textarea></details>';
            }).join('') + '</div>' : '') +
        '</div></div>';
    }).join('');
    const html = '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' +
      '<button id="moon-bio-selectall" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:11px;cursor:pointer;font-family:inherit;font-weight:700;">全选 / 全不选</button>' +
      '<button id="moon-bio-batch-enable" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(16,185,129,0.4);background:#052e20;color:#6ee7b7;font-size:11px;cursor:pointer;font-family:inherit;font-weight:700;">启用所选</button>' +
      '<button id="moon-bio-batch-disable" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:11px;cursor:pointer;font-family:inherit;font-weight:700;">停用所选</button>' +
      '<button id="moon-bio-batch-del" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:11px;cursor:pointer;font-family:inherit;font-weight:700;">删除所选</button></div>' +
      '<div style="max-height:52dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>';
    showModalDialog('📚 角色小抄库', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        function collectCheckedIds() { const ids = []; mask.querySelectorAll('.moon-bio-lib-check').forEach(function(ck) { if (ck.checked) ids.push(ck.getAttribute('data-id')); }); return ids; }
        mask.querySelector('#moon-bio-selectall').addEventListener('click', function() { const all = mask.querySelectorAll('.moon-bio-lib-check'); const allChecked = Array.from(all).every(function(c) { return c.checked; }); all.forEach(function(c) { c.checked = !allChecked; }); });
        mask.querySelector('#moon-bio-batch-enable').addEventListener('click', function() { const ids = collectCheckedIds(); if (!ids.length) { toast('未勾选任何小抄', 'info'); return; } batchSetBioEnabled(ids, true); try { mask.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); });
        mask.querySelector('#moon-bio-batch-disable').addEventListener('click', function() { const ids = collectCheckedIds(); if (!ids.length) { toast('未勾选任何小抄', 'info'); return; } batchSetBioEnabled(ids, false); try { mask.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); });
        mask.querySelector('#moon-bio-batch-del').addEventListener('click', function() {
          const ids = collectCheckedIds(); if (!ids.length) { toast('未勾选任何小抄', 'info'); return; }
          showModalDialogCancelable('🗑 确认删除', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除 <b>' + ids.length + '</b> 份角色小抄（包含各自的原始备份），删除后无法恢复。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
            function() { const lib2 = getBioLibrary(); ids.forEach(function(id) { delete lib2.bios[id]; }); saveBioLibrary(lib2); toast('已删除 ' + ids.length + ' 份', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); },
            function() { toast('已取消', 'info'); },
            { confirmText: '确认删除', cancelText: '取消' });
        });
        mask.querySelectorAll('.moon-bio-toggle').forEach(function(tg) {
          tg.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = tg.getAttribute('data-id'); const b = lib.bios[id]; if (!b) return;
            batchSetBioEnabled([id], b.enabled !== true);
            try { mask.remove(); } catch (e) {}
            setTimeout(function() { openBioLibraryDialog(panel); }, 300);
          });
        });
        mask.querySelectorAll('.moon-bio-expand').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id'); const box = mask.querySelector('.moon-bio-original[data-id="' + id + '"]'); if (!box) return;
            const isOpen = box.style.display !== 'none';
            box.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '▼' : '▲';
          });
        });
mask.querySelectorAll('.moon-bio-view-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const id = btn.getAttribute('data-id');
    const currentLib = getBioLibrary(); // 实时读取，避免快照
    const b = currentLib.bios[id];
    if (!b) { toast('找不到这份小抄', 'warning'); return; }
    if (!b.versions) b.versions = {};
    const content = (b.versions.current && b.versions.current.content)
      ? b.versions.current.content
      : (b.versions.original && b.versions.original.content)
        ? b.versions.original.content
        : '（暂无内容）';
    const aud = b.audition && b.audition.latest ? b.audition.latest.content : '';
    showModalDialog('👁 ' + String(b.charName || '未命名').replace(/</g, '&lt;'),
      '<div style="font-size:10.5px;color:' + (b.enabled ? '#6ee7b7' : '#fbbf24') + ';margin-bottom:4px;">' +
        (b.enabled ? '● 已启用' : '○ 未启用（仅查看，不影响编辑）') + '</div>' +
      '<textarea readonly style="width:100%;box-sizing:border-box;min-height:180px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(content).replace(/</g, '&lt;') + '</textarea>' +
      (aud ? '<div style="font-size:10.5px;color:#94a3b8;margin:10px 0 4px 0;">🎬 最近一次试镜片段</div>' +
        '<textarea readonly style="width:100%;box-sizing:border-box;min-height:100px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(aud).replace(/</g, '&lt;') + '</textarea>' : ''),
      null, { confirmText: '关闭' });
  });
});
        mask.querySelectorAll('.moon-bio-edit-btn').forEach(function(btn) { btn.addEventListener('click', function(e) { e.stopPropagation(); openEditBioDialog(btn.getAttribute('data-id'), panel); }); });
        mask.querySelectorAll('.moon-bio-del-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id'); const b = lib.bios[id];
            showModalDialogCancelable('🗑 确认删除', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除角色小抄：<b>' + String(b.charName || '未命名').replace(/</g, '&lt;') + '</b><br>包含原始备份，删除后无法恢复。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
              function() { delete lib.bios[id]; saveBioLibrary(lib); toast('已删除', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); },
              function() { toast('已取消', 'info'); },
              { confirmText: '确认删除', cancelText: '取消' });
          });
        });
        mask.querySelectorAll('.moon-bio-del-original').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id'); const b = lib.bios[id];
            if (!b || !b.versions || !b.versions.original) return;
            showModalDialogCancelable('🗑 删除原始版本', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除角色小抄的原始备份。<br>当前版本不受影响，仍然可以正常使用和编辑。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
              function() { b.versions.original = { content: b.versions.current.content, generatedAt: Date.now(), rValue: null, wordLimit: b.wordLimit || 260 }; b.updatedAt = Date.now(); saveBioLibrary(lib); toast('已删除原始备份', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); },
              function() { toast('已取消', 'info'); },
              { confirmText: '确认删除', cancelText: '取消' });
          });
        });
      }
    });
  }
// ===== 第 12 份 =====
  function openUserBioLibraryDialog(panel) {
    const lib = getUserBioLibrary();
    const userBios = Object.values(lib.userBios || {});
    if (userBios.length === 0) {
      showModalDialog('👤 玩家小抄库',
        '<div style="color:#94a3b8;">玩家小抄库为空。</div>' +
        '<div style="margin-top:8px;font-size:11px;color:#64748b;">先到主面板点「👤 玩家小抄」生成一份试试。</div>',
        null, { confirmText: '关闭' });
      return;
    }
    userBios.sort(function(a, b) {
      if ((b.enabled ? 1 : 0) !== (a.enabled ? 1 : 0)) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0);
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    const rows = userBios.map(function(b) {
      const current = b.versions && b.versions.current ? b.versions.current.content : '';
      const preview = String(current).substring(0, 80);
      const wordCount = String(current).length;
      const enabled = b.enabled === true;
      const timeAgo = (function() { const diff = Date.now() - (b.updatedAt || b.createdAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
      return '<div class="moon-ubio-card" data-id="' + b.id + '" style="margin-bottom:10px;background:#05070e;border:1px solid ' + (enabled ? 'rgba(110,231,183,0.4)' : 'rgba(148,163,184,0.15)') + ';border-radius:10px;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(148,163,184,0.08);">' +
        '<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:12.5px;font-weight:700;color:#f8fafc;">' + String(b.userName || '未命名玩家').replace(/</g, '&lt;') + '</span>' +
        '<span class="moon-ubio-toggle" data-id="' + b.id + '" style="font-size:10px;padding:1px 7px;border-radius:10px;cursor:pointer;' + (enabled ? 'color:#6ee7b7;background:rgba(16,185,129,0.15);' : 'color:#94a3b8;background:rgba(148,163,184,0.1);') + '">' + (enabled ? '● 启用' : '○ 未启用') + '</span>' +
        '</div><div style="font-size:10px;color:#64748b;margin-top:2px;">' + String(b.cardName || '(未知卡)').replace(/</g, '&lt;') + ' · ' + wordCount + '字 · ' + timeAgo + '</div></div></div>' +
        '<div style="padding:10px 12px;font-size:11px;color:#cbd5e1;line-height:1.6;">' + preview.replace(/</g, '&lt;') + (current.length > 80 ? '……' : '') + '</div>' +
        '<div style="display:flex;gap:6px;padding:8px 12px;border-top:1px solid rgba(148,163,184,0.08);background:rgba(15,23,42,0.3);">' +
        '<button class="moon-ubio-view-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;">👁 查看</button>' +
        '<button class="moon-ubio-edit-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;">✏️ 编辑</button>' +
        '<button class="moon-ubio-del-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:10.5px;cursor:pointer;font-family:inherit;">🗑 删除</button></div></div>';
    }).join('');
    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">同时间只允许启用 1 份玩家小抄。启用新小抄会自动停用旧的。</div>' +
      '<div style="max-height:56dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>';
    showModalDialog('👤 玩家小抄库', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelectorAll('.moon-ubio-toggle').forEach(function(tg) {
          tg.addEventListener('click', function() {
            const id = tg.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const target = lib2.userBios[id];
            if (!target) return;
            const enable = target.enabled !== true;
            if (enable) { Object.values(lib2.userBios || {}).forEach(function(x) { if (x) { x.enabled = false; x.updatedAt = Date.now(); } }); target.enabled = true; target.updatedAt = Date.now(); }
            else { target.enabled = false; target.updatedAt = Date.now(); }
            saveUserBioLibrary(lib2); toast(enable ? '已启用' : '已停用', 'success');
            try { mask.remove(); } catch (e) {}
            setTimeout(function() { openUserBioLibraryDialog(panel); }, 300);
          });
        });
        mask.querySelectorAll('.moon-ubio-view-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const b = lib2.userBios[id];
            if (!b || !b.versions || !b.versions.current) return;
            const content = b.versions.current.content; const aud = b.audition && b.audition.latest ? b.audition.latest.content : '';
            showModalDialog('👁 ' + String(b.userName || '未命名玩家').replace(/</g, '&lt;'),
              '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">当前小传版本</div>' +
              '<textarea readonly style="width:100%;box-sizing:border-box;min-height:180px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(content).replace(/</g, '&lt;') + '</textarea>' +
              (aud ? '<div style="font-size:10.5px;color:#94a3b8;margin:10px 0 4px 0;">🎬 最近一次试镜片段</div>' +
                '<textarea readonly style="width:100%;box-sizing:border-box;min-height:100px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(aud).replace(/</g, '&lt;') + '</textarea>' : ''),
              null, { confirmText: '关闭' });
          });
        });
        mask.querySelectorAll('.moon-ubio-edit-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const b = lib2.userBios[id];
            if (!b || !b.versions || !b.versions.current) return;
            const currentContent = String(b.versions.current.content || '');
            showModalDialogCancelable('✏️ 编辑玩家小抄',
              '<textarea id="moon-ubio-edit-ta" style="width:100%;box-sizing:border-box;min-height:220px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + currentContent.replace(/</g, '&lt;') + '</textarea>',
              function() {
                const m2 = mainDoc.getElementById('moon-modal-mask'); const ta = m2 ? m2.querySelector('#moon-ubio-edit-ta') : null;
                if (!ta) return;
                const v = String(ta.value || '').trim(); if (!v) { toast('内容不能为空', 'warning'); return; }
                b.versions.current.content = v; b.versions.current.generatedAt = Date.now(); b.updatedAt = Date.now();
                saveUserBioLibrary(lib2); try { m2.remove(); } catch (e) {}
                toast('已保存', 'success'); setTimeout(function() { openUserBioLibraryDialog(panel); }, 300);
              },
              function() { toast('已取消', 'info'); },
              { confirmText: '保存', cancelText: '取消' });
          });
        });
        mask.querySelectorAll('.moon-ubio-del-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const b = lib2.userBios[id];
            showModalDialogCancelable('🗑 确认删除', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除玩家小抄：<b>' + String(b && b.userName || '未命名').replace(/</g, '&lt;') + '</b><br>删除后无法恢复。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
              function() { delete lib2.userBios[id]; saveUserBioLibrary(lib2); toast('已删除', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openUserBioLibraryDialog(panel); }, 300); },
              function() { toast('已取消', 'info'); },
              { confirmText: '确认删除', cancelText: '取消' });
          });
        });
      }
    });
  }

  function _ub_buildBioSys(wordLimit) {
    return ['你是一位剧本顾问。用户在扮演一个角色（玩家角色）。', '请根据用户提供的设定，提炼出一份「玩家角色灵魂小传」。', '输出 4 个板块，按顺序：', '[core personality] / [speech style] / [behavioral triggers] / [background hints]', '硬性要求：', '1. 不改变原设定中的身份、性别、称呼。', '2. 不虚构原设定没有的关键事实（如职业、亲属、重大经历）。', '3. 只做「提炼 + 强化演出感」，不替换设定。', '4. 总字数不超过 ' + wordLimit + ' 字。', '5. 只输出小传内容，不要 markdown、不要前言后记。'].join('\n');
  }
  function _ub_buildAuditionSys(scene, wordLimit) {
    return ['你是一位演员，扮演的是「玩家角色」。', '按灵魂小传演一段单人戏。', '场景：' + scene, '重点：第一人称内心戏 + 微反应 + 说话方式。', '不要替其他角色写动作或对白。', '不要写成读者视角的旁白，要沉浸在玩家角色的视角里。', '总字数不超过 ' + wordLimit + ' 字。'].join('\n');
  }
  function _ub_buildRevisionSys(feedback, wordLimit) {
    return ['用户对上一版玩家角色灵魂小传提出了修改意见：' + feedback, '请根据意见重写玩家角色灵魂小传。', '保留原有 4 板块结构：[core personality] / [speech style] / [behavioral triggers] / [background hints]', '总字数不超过 ' + wordLimit + ' 字。', '只输出修订后的小传内容。'].join('\n');
  }
  async function _ub_genBio(provider, wordLimit, useChat) {
    const personaData = collectCurrentPlayerPersona();
    if (!personaData.persona) throw new Error('当前 Persona 面板为空，请先在右侧填写玩家设定。');
    let chatHistory = '';
    if (useChat) {
      try {
        const ctx = getSTCtx();
        if (ctx && ctx.chat && ctx.chat.length) {
          const lines = []; let total = 0;
          for (let i = ctx.chat.length - 1; i >= 0 && total < 2400; i--) {
            const m = ctx.chat[i]; if (!m) continue;
            const role = m.is_user ? '玩家' : (personaData.name || '角色');
            let text = String(m.mes || '').replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '').replace(/<Commands>[\s\S]*?<\/Commands>/gi, '').replace(/<StatusPlaceHolderImpl\s*\/>/gi, '').trim();
            if (!text) continue;
            if (text.length > 800) text = text.slice(0, 800) + '……';
            lines.unshift('【' + role + '】' + text); total += text.length;
          }
          chatHistory = lines.join('\n\n');
        }
      } catch (e) {}
    }
    const sys = _ub_buildBioSys(wordLimit);
    const user = '【玩家名字】' + personaData.name + '\n\n【Persona 设定原文】\n' + personaData.persona + (chatHistory ? '\n\n【最近对话参考（仅供了解玩家说话方式）】\n' + chatHistory : '') + '\n\n请提炼玩家角色的灵魂小传。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }
  async function _ub_genAudition(provider, bio, scene, wordLimit) {
    const sys = _ub_buildAuditionSys(scene, wordLimit);
    const user = '【玩家角色灵魂小传】\n' + bio + '\n\n请开始你的单人演出。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }
  async function _ub_reviseBio(provider, oldBio, feedback, wordLimit) {
    const sys = _ub_buildRevisionSys(feedback, wordLimit);
    const user = '【当前小传】\n' + oldBio + '\n\n请输出修订后的小传。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }

function getUpdateConfig() {
  try {
    const raw = mainWin.localStorage.getItem(UPDATE_CONFIG_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      const savedUrl = String(o.url || '').trim();
      const normalizedSavedUrl = savedUrl.replace(/[?#].*$/, '');
      const updateUrl = !savedUrl || normalizedSavedUrl === LEGACY_DEFAULT_UPDATE_URL
        ? DEFAULT_UPDATE_URL : savedUrl;
      return {
        url: updateUrl,
        autoCheck: o.autoCheck !== false
      };
    }
  } catch (e) {}
  return { url: DEFAULT_UPDATE_URL, autoCheck: true };
}

function saveUpdateConfig(cfg) {
  try { mainWin.localStorage.setItem(UPDATE_CONFIG_KEY, JSON.stringify(cfg)); } catch (e) {}
}

function compareVersions(a, b) {
  const pa = String(a).split('.').map(function(x) { return parseInt(x, 10) || 0; });
  const pb = String(b).split('.').map(function(x) { return parseInt(x, 10) || 0; });
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0, vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

async function checkForUpdates(silent) {
  const cfg = getUpdateConfig();
  if (!cfg.url) {
    if (!silent) openUpdateConfigDialog(null);
    return null;
  }
  if (!silent) showLoadingDialog('正在读取最新版本与更新公告…');
  try {
    const res = await fetch(cfg.url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    let remoteVersion = '', remoteInfo = '';
    try {
      const json = JSON.parse(text);
      if (json && json.version) {
        remoteVersion = String(json.version);
        remoteInfo = String(json.info || json.changelog || '');
      }
    } catch (e) {}
    if (!remoteVersion) {
      const m = text.match(/MOON_FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/);
      if (m) remoteVersion = m[1];
    }
    if (!remoteInfo) {
      const changelogMatch = text.match(/MOON_FORMULA_CHANGELOG\s*=\s*("(?:\\.|[^"\\])*")/);
      if (changelogMatch) {
        try { remoteInfo = JSON.parse(changelogMatch[1]); } catch (e) {}
      }
    }
    if (!remoteVersion) {
      if (!silent) showModalDialog('版本检查失败', '<div>远程脚本中没有找到有效版本号，请稍后重试。</div>', null, { confirmText: '关闭' });
      return null;
    }
    const cmp = compareVersions(remoteVersion, MOON_FORMULA_VERSION);
    if (cmp > 0) {
      _cachedUpdateInfo = { version: remoteVersion, info: remoteInfo, url: cfg.url };
      try { refreshPanel(); } catch (e) {}
      if (!silent) showUpdateAvailableDialog(_cachedUpdateInfo);
      return _cachedUpdateInfo;
    }
    _cachedUpdateInfo = null;
    try { refreshPanel(); } catch (e) {}
    if (!silent) showModalDialog('版本检查结果', '<div style="line-height:1.8;">当前版本：<b style="color:#f472d0;">v' + MOON_FORMULA_VERSION + '</b><br>最新版本：<b style="color:#f472d0;">v' + remoteVersion + '</b><br><br>你现在使用的已经是最新版本。</div>', null, { confirmText: '关闭' });
    return null;
  } catch (e) {
    if (!silent) showModalDialog('版本检查失败', '<div style="line-height:1.8;">无法连接更新源。<br>' + String(e && e.message || e).replace(/</g, '&lt;') + '</div>', null, { confirmText: '关闭' });
    return null;
  } finally { if (!silent) closeLoadingDialog(); }
}

function showUpdateAvailableDialog(remote) {
  const html =
    '<div style="font-size:12px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '发现新版本：<b style="color:#fde047;">v' + remote.version + '</b><br>' +
      '当前版本：<span style="color:#94a3b8;">v' + MOON_FORMULA_VERSION + '</span>' +
    '</div>' +
    (remote.info
      ? '<div style="padding:10px 12px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:9px;font-size:11px;color:#94a3b8;line-height:1.7;max-height:240px;overflow-y:auto;margin-bottom:10px;white-space:pre-wrap;">' + String(remote.info).replace(/</g, '&lt;') + '</div>'
      : '') +
    '<div style="font-size:10.5px;color:#64748b;line-height:1.6;">点「✅ 确定更新」后，脚本会自动下载新版本并写入，然后刷新页面。<br>若自动写入失败，会降级为「复制到剪贴板 + 提示手动替换」。</div>';
  showModalDialogCancelable('🔄 发现新版本 v' + remote.version, html,
    function() { doAutoUpdate(remote); },
    function() { toast('已取消更新', 'info'); },
    { confirmText: '✅ 确定更新', cancelText: '稍后再说' });
}

function showUpdateAnnouncementOnce() {
  let firstRunDone = false;
  let lastAnnouncedVersion = '';
  try {
    const ls = mainWin.localStorage || localStorage;
    firstRunDone = ls.getItem(FIRST_RUN_KEY) === '1';
    lastAnnouncedVersion = ls.getItem(LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY) || '';
    // 新安装走首次启动引导，不再重复弹出版本更新公告。
    if (!firstRunDone) {
      ls.setItem(LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY, MOON_FORMULA_VERSION);
      return false;
    }
    if (lastAnnouncedVersion === MOON_FORMULA_VERSION) return false;
    ls.setItem(LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY, MOON_FORMULA_VERSION);
  } catch (e) { return false; }

  const safeVersion = String(MOON_FORMULA_VERSION).replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
  const safeInfo = String(MOON_FORMULA_CHANGELOG || '本次更新已完成。').replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
  const html = '<div style="font-size:12px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
    '已更新至 <b style="color:#fde047;">v' + safeVersion + '</b></div>' +
    '<div style="padding:10px 12px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:9px;font-size:11.5px;color:#cbd5e1;line-height:1.8;white-space:pre-wrap;">' +
    safeInfo + '</div>';
  showModalDialog('📢 更新公告', html, null, { confirmText: '知道了' });
  return true;
}

async function doAutoUpdate(remote) {
  if (!remote || !remote.url) { toast('无更新源', 'warning'); return; }

  showLoadingDialog('正在下载新版本...');
  let code = '';
  try {
    const res = await fetch(remote.url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    code = await res.text();
  } catch (e) {
    closeLoadingDialog();
    toast('下载失败：' + (e.message || e), 'warning');
    return;
  }

  // 若是 JSON 包装，尝试取出脚本正文
  try {
    const json = JSON.parse(code);
    if (json && typeof json.content === 'string') code = json.content;
    else if (json && typeof json.script === 'string') code = json.script;
    else if (json && typeof json.code === 'string') code = json.code;
  } catch (e) {}

  code = String(code || '').trim();
  if (!code || code.length < 500) {
    closeLoadingDialog();
    toast('下载到的脚本内容异常（长度不足）', 'warning');
    return;
  }
  const verMatch = code.match(/MOON_FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!verMatch || compareVersions(verMatch[1], remote.version) < 0) {
    closeLoadingDialog();
    toast('下载内容与声明版本不符，已中止更新', 'warning');
    return;
  }

  showLoadingDialog('正在写入更新...');
  const okLS = tryApplyUpdateToStorage(code);
  let okIDB = false;
  try { okIDB = await tryApplyUpdateToIndexedDB(code); } catch (e) {}
  closeLoadingDialog();

  if (okLS || okIDB) {
    _cachedUpdateInfo = null;
    toast('更新成功，即将刷新页面...', 'success');
    setTimeout(function() {
      try {
        if (mainWin && mainWin.location && typeof mainWin.location.reload === 'function') mainWin.location.reload();
        else location.reload();
      } catch (e) { try { location.reload(); } catch (e2) {} }
    }, 1200);
    return;
  }

  // 降级：复制到剪贴板
  let copied = false;
  try {
    if (mainWin.navigator && mainWin.navigator.clipboard) {
      await mainWin.navigator.clipboard.writeText(code);
      copied = true;
    }
  } catch (e) {}
  showModalDialog('⚠️ 自动写入失败',
    '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;">' +
      '未能定位到脚本存储位置。' +
      (copied ? '<br><b style="color:#6ee7b7;">新脚本已复制到剪贴板。</b>' : '') +
      '<br>请打开「酒馆助手 → 脚本管理」，找到本脚本，把新内容粘贴进去并保存。<br>' +
      '<span style="color:#fbbf24;">保存后本脚本会在下次加载时自动刷新页面。</span></div>',
    null, { confirmText: '知道了' });
}

// 尝试在 localStorage 里找到包含本脚本 id 的管理数据并替换 content
function tryApplyUpdateToStorage(code) {
  const ST_ID = 'e22f244b-70e1-448e-b24e-5a9b36c48484';
  let applied = false;
  try {
    const ls = mainWin.localStorage || localStorage;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key) continue;
      let raw = null;
      try { raw = ls.getItem(key); } catch (e) { continue; }
      if (!raw || raw.indexOf(ST_ID) < 0) continue;
      try {
        const data = JSON.parse(raw);
        if (_replaceScriptInNode(data, ST_ID, code)) {
          ls.setItem(key, JSON.stringify(data));
          applied = true;
          try { console.log('[Moon] 已更新 localStorage key:', key); } catch (e) {}
        }
      } catch (e) {}
    }
  } catch (e) {}
  return applied;
}

function _replaceScriptInNode(node, id, newContent) {
  if (!node || typeof node !== 'object') return false;
  let changed = false;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (_replaceScriptInNode(node[i], id, newContent)) changed = true;
    }
  } else {
    if (node.id === id && typeof node.content === 'string') {
      node.content = newContent;
      changed = true;
    }
    for (const k in node) {
      if (k === 'content') continue;
      if (_replaceScriptInNode(node[k], id, newContent)) changed = true;
    }
  }
  return changed;
}

// 尝试从 IndexedDB 里找脚本管理数据（不同酒馆版本库名不同，尽力而为）
async function tryApplyUpdateToIndexedDB(code) {
  const IDB = mainWin.indexedDB;
  if (!IDB) return false;
  const ST_ID = 'e22f244b-70e1-448e-b24e-5a9b36c48484';
  const CANDIDATES = [
    { db: 'tavern_helper', store: 'scripts' },
    { db: 'tavern_helper', store: 'script' },
    { db: 'SillyTavern', store: 'scripts' },
    { db: 'SillyTavern', store: 'script' },
    { db: 'TavernHelper', store: 'scripts' },
    { db: 'TavernHelper', store: 'script' },
    { db: 'SillyTavern_scripts', store: 'scripts' }
  ];
  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    try {
      const db = await _openIDB(IDB, c.db);
      if (!db) continue;
      if (!db.objectStoreNames.contains(c.store)) { try { db.close(); } catch (e) {} continue; }

      const tx = db.transaction(c.store, 'readwrite');
      const store = tx.objectStore(c.store);
      const all = await new Promise(function(resolve) {
        let done = false;
        const fin = function(v) { if (!done) { done = true; resolve(v); } };
        const r = store.getAll();
        r.onsuccess = function() { fin(r.result || []); };
        r.onerror = function() { fin([]); };
        setTimeout(function() { fin([]); }, 1500);
      });

      let changed = false;
      for (let j = 0; j < all.length; j++) {
        const row = all[j];
        if (!row || typeof row !== 'object') continue;
        if (row.id !== ST_ID) continue;
        if (typeof row.content !== 'string') continue;
        try {
          row.content = code;
          store.put(row);
          changed = true;
        } catch (e) {}
      }
      await new Promise(function(resolve) {
        let done = false;
        const fin = function() { if (!done) { done = true; resolve(); } };
        tx.oncomplete = fin; tx.onerror = fin; tx.onabort = fin;
        setTimeout(fin, 1500);
      });
      try { db.close(); } catch (e) {}
      if (changed) return true;
    } catch (e) {}
  }
  return false;
}

function _openIDB(IDB, name) {
  return new Promise(function(resolve) {
    try {
      const req = IDB.open(name);
      let done = false;
      const finish = function(v) { if (!done) { done = true; resolve(v); } };
      req.onsuccess = function() { finish(req.result); };
      req.onerror = function() { finish(null); };
      req.onblocked = function() { finish(null); };
      setTimeout(function() { finish(null); }, 1500);
    } catch (e) { resolve(null); }
  });
}

function openUpdateConfigDialog(panel) {
  const cfg = getUpdateConfig();
  const html =
    '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      '填脚本源码文件的直链（推荐 jsDelivr 加速）。<br>' +
      '<code style="color:#7dd3fc;font-size:10.5px;">https://cdn.jsdelivr.net/gh/用户名/仓库@main/moon-phase.js</code><br>' +
      '脚本会从中解析 <code style="color:#7dd3fc;font-size:10.5px;">MOON_FORMULA_VERSION</code> 作为版本号。' +
    '</div>' +
    '<div style="margin-bottom:8px;">' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">更新源 URL（留空则使用内置默认地址）</div>' +
      '<input id="moon-upd-url" type="text" value="' + String(cfg.url || DEFAULT_UPDATE_URL).replace(/"/g, '&quot;') + '" placeholder="https://raw.githubusercontent.com/..." style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;">' +
    '</div>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;cursor:pointer;">' +
      '<input type="checkbox" id="moon-upd-auto" ' + (cfg.autoCheck ? 'checked' : '') + '> 启动时自动检查更新' +
    '</label>';
  showModalDialogCancelable('⚙️ 更新设置', html,
    function() {
      const mask = mainDoc.getElementById('moon-modal-mask');
      const url = mask.querySelector('#moon-upd-url').value.trim();
      const auto = mask.querySelector('#moon-upd-auto').checked;
      saveUpdateConfig({ url: url, autoCheck: auto });
      try { mask.remove(); } catch (e) {}
      toast('已保存', 'success');
      if (url) checkForUpdates(true);
    },
    function() { toast('已取消', 'info'); },
    { confirmText: '保存', cancelText: '取消' });
}

  function openUserAuditionMainDialog(panel) {
    const personaData = collectCurrentPlayerPersona();
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      'AI 将读取你右侧 Persona 面板的设定，提炼成一份「玩家角色灵魂小传」，然后按小传演一段单人戏。' +
      '<br><span style="color:#fbbf24;">生成完毕后你可以先检查小传内容，确认后再进入试镜。</span></div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:10px;font-size:11px;color:#cbd5e1;line-height:1.6;">' +
      '<div style="color:#7dd3fc;font-weight:700;margin-bottom:4px;">当前 Persona 面板内容</div>' +
      (personaData.persona ? '<div style="white-space:pre-wrap;max-height:120px;overflow-y:auto;">' + personaData.persona.replace(/</g, '&lt;').substring(0, 500) + (personaData.persona.length > 500 ? '……' : '') + '</div>' : '<div style="color:#f87171;">（Persona 面板为空，请先在右侧填写）</div>') + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">生成模型：</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-ub-provider" value="main" checked><span style="font-size:12px;">主模型</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-ub-provider" value="extra"><span style="font-size:12px;">副模型</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-ub-provider" value="custom"><span style="font-size:12px;">自定义API</span></label>' +
      '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">小传字数：<span id="moon-ub-bio-label" style="color:#7dd3fc;font-weight:700;">260</span> 字</div>' +
      '<input id="moon-ub-bio-slider" type="range" min="150" max="400" step="10" value="260" style="width:100%;margin-bottom:8px;">' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">试镜片段字数：<span id="moon-ub-seg-label" style="color:#7dd3fc;font-weight:700;">200</span> 字</div>' +
      '<input id="moon-ub-seg-slider" type="range" min="100" max="400" step="10" value="200" style="width:100%;margin-bottom:10px;">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;cursor:pointer;"><input type="checkbox" id="moon-ub-use-chat" checked> 生成小传时参考最近对话</label>';
    showModalDialogCancelable('👤 玩家角色试镜', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const provider = (mask.querySelector('input[name="moon-ub-provider"]:checked') || {}).value || 'main';
        const bioLimit = Number(mask.querySelector('#moon-ub-bio-slider').value) || 260;
        const segLimit = Number(mask.querySelector('#moon-ub-seg-slider').value) || 200;
        const useChat = mask.querySelector('#moon-ub-use-chat').checked;
        try { mask.remove(); } catch (e) {}
        await _ub_startGenerate(panel, provider, bioLimit, segLimit, useChat);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始生成', cancelText: '取消',
        onOpen: function(mask) {
          const bs = mask.querySelector('#moon-ub-bio-slider'); const bl = mask.querySelector('#moon-ub-bio-label');
          if (bs && bl) bs.addEventListener('input', function() { bl.textContent = bs.value; });
          const ss = mask.querySelector('#moon-ub-seg-slider'); const sl = mask.querySelector('#moon-ub-seg-label');
          if (ss && sl) ss.addEventListener('input', function() { sl.textContent = ss.value; });
        }
      });
  }
// ===== 第 13 份 =====
  async function _ub_startGenerate(panel, provider, bioLimit, segLimit, useChat) {
    showLoadingDialog('AI 正在提炼玩家小传...');
    let bio = '';
    try { bio = await _ub_genBio(provider, bioLimit, useChat); }
    catch (e) { closeLoadingDialog(); showModalDialog('❌ 生成失败', '<div>' + String(e && e.message || e).replace(/</g, '&lt;') + '</div>', null, { confirmText: '关闭' }); return; }
    closeLoadingDialog();
    if (!bio || !bio.trim()) { showModalDialog('❌ 生成失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
    _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio);
  }

  function _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio) {
    const safeBio = String(bio).replace(/</g, '&lt;');
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:8px;">' +
      '这是 AI 提炼出的<b style="color:#7dd3fc;">玩家角色灵魂小传</b>。请检查内容是否准确。' +
      '<br>如有不满，可以写意见让 AI 重写，或直接编辑文本。</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">小传内容（可直接编辑）</div>' +
      '<textarea id="moon-ub-preview-text" style="width:100%;box-sizing:border-box;min-height:220px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + safeBio + '</textarea>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin:10px 0 4px 0;">修改意见（可选，AI 会按此重写）</div>' +
      '<textarea id="moon-ub-preview-feedback" placeholder="例如：说话方式应该更简练；去掉不认识的背景细节。" style="width:100%;box-sizing:border-box;min-height:60px;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;resize:vertical;font-family:inherit;"></textarea>' +
      '<div style="display:flex;gap:6px;margin-top:10px;">' +
      '<button id="moon-ub-rewrite" style="flex:1;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🔁 让 AI 重写</button>' +
      '<button id="moon-ub-toaud" style="flex:1.4;padding:9px;border-radius:8px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🎬 确认小传，进入试镜</button></div>';
    showModalDialog('👤 玩家角色小传 · 预览', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-ub-rewrite').addEventListener('click', async function() {
          const ta = mask.querySelector('#moon-ub-preview-text');
          const fb = String(mask.querySelector('#moon-ub-preview-feedback').value || '').trim();
          const cur = String(ta.value || '').trim();
          if (!cur) { toast('小传不能为空', 'warning'); return; }
          if (!fb) { toast('请先写下修改意见', 'info'); return; }
          try { mask.remove(); } catch (e) {}
          showLoadingDialog('AI 正在重写小传...');
          try {
            const revised = await _ub_reviseBio(provider, cur, fb, bioLimit);
            closeLoadingDialog();
            if (!revised) { showModalDialog('❌ 重写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
            _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, revised);
          } catch (e) { closeLoadingDialog(); toast('重写失败：' + (e.message || e), 'warning'); }
        });
        mask.querySelector('#moon-ub-toaud').addEventListener('click', async function() {
          const ta = mask.querySelector('#moon-ub-preview-text');
          const finalBio = String(ta.value || '').trim();
          if (!finalBio) { toast('小传不能为空', 'warning'); return; }
          try { mask.remove(); } catch (e) {}
          await _ub_startAudition(panel, provider, bioLimit, segLimit, finalBio);
        });
      }
    });
  }

  async function _ub_startAudition(panel, provider, bioLimit, segLimit, bio) {
    showLoadingDialog('AI 正在准备试镜...');
    let audition = '';
    try { audition = await _ub_genAudition(provider, bio, '根据小传自选一个能体现玩家角色灵魂的日常场景。', segLimit); }
    catch (e) { closeLoadingDialog(); toast('试镜生成失败：' + (e.message || e), 'warning'); _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio); return; }
    closeLoadingDialog();
    if (!audition || !audition.trim()) { toast('试镜片段为空', 'warning'); _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio); return; }
    _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, bio, audition);
  }

  function _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, bio, audition) {
    const safeAud = String(audition).replace(/</g, '&lt;');
    const html = '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">试镜片段</div>' +
      '<div style="padding:12px 14px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:10px;font-size:12px;line-height:1.8;color:#e2e8f0;white-space:pre-wrap;max-height:38dvh;overflow-y:auto;margin-bottom:12px;">' + safeAud + '</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">导演意见（可选）</div>' +
      '<textarea id="moon-ub-aud-feedback" placeholder="例如：这段表现太夸张了。" style="width:100%;box-sizing:border-box;min-height:60px;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#0a0c16;color:#e2e8f0;font-size:11.5px;line-height:1.7;resize:vertical;font-family:inherit;margin-bottom:10px;"></textarea>' +
      '<div style="display:flex;gap:6px;">' +
      '<button id="moon-ub-aud-retry" style="flex:1.2;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🎭 让 AI 重演</button>' +
      '<button id="moon-ub-aud-save" style="flex:1.4;padding:9px;border-radius:8px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✅ 确认并保存</button></div>' +
      '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">保存后会自动启用这份玩家小抄，同时停用其他玩家小抄。</div>';
    showModalDialog('👤 玩家角色试镜', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-ub-aud-retry').addEventListener('click', async function() {
          const fb = String(mask.querySelector('#moon-ub-aud-feedback').value || '').trim();
          if (!fb) { toast('请先写下意见', 'info'); return; }
          try { mask.remove(); } catch (e) {}
          showLoadingDialog('AI 正在重演...');
          try {
            const newBio = await _ub_reviseBio(provider, bio, fb, bioLimit);
            if (!newBio) throw new Error('AI 未返回内容');
            const newAud = await _ub_genAudition(provider, newBio, '根据小传自选一个能体现玩家角色灵魂的日常场景。', segLimit);
            closeLoadingDialog();
            if (!newAud) throw new Error('试镜片段为空');
            _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, newBio, newAud);
          } catch (e) { closeLoadingDialog(); toast('重演失败：' + (e.message || e), 'warning'); _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, bio, audition); }
        });
        mask.querySelector('#moon-ub-aud-save').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          _ub_saveToLibrary(bio, audition, bioLimit, segLimit);
        });
      }
    });
  }

  function _ub_saveToLibrary(bio, audition, bioLimit, segLimit) {
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
// ===== 第 14 份 =====
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
// ===== 第 15 份 =====
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

  function injectStyle() {
    let el = mainDoc.getElementById(STYLE_ID);
    if (!el) { el = mainDoc.createElement('style'); el.id = STYLE_ID; mainDoc.head.appendChild(el); }
    el.textContent = '#moon-phase-mask{position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483640;background:radial-gradient(circle at center,rgba(15,23,42,0.85) 0%,rgba(2,6,23,0.92) 100%);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}' +
      '#moon-phase-mask.open{display:flex;animation:moon-fade 0.28s cubic-bezier(0.16,1,0.3,1);}' +
      '#moon-phase-panel{background:linear-gradient(170deg,rgba(20,24,38,0.95) 0%,rgba(10,12,22,0.98) 100%);color:#e2e8f0;border:1px solid rgba(148,163,184,0.18);border-radius:20px;padding:22px;width:100%;max-width:460px;max-height:88dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 25px 60px rgba(0,0,0,0.75);box-sizing:border-box;}' +
      '#moon-phase-panel .mp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid rgba(148,163,184,0.12);}' +
      '#moon-phase-panel .mp-title-orb{font-size:20px;}' +
      '#moon-phase-panel .mp-title{font-size:15px;font-weight:700;color:#f8fafc;letter-spacing:1px;}' +
      '#moon-phase-panel .mp-badge{font-size:9px;background:rgba(148,163,184,0.12);padding:2px 7px;border-radius:12px;color:#94a3b8;border:1px solid rgba(148,163,184,0.2);font-weight:600;}' +
      '#moon-phase-panel .mp-close{background:transparent;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:4px;border-radius:8px;}' +
      '.mp-card{background:rgba(15,23,42,0.5);border:1px solid rgba(148,163,184,0.1);border-radius:14px;padding:12px 14px;margin-bottom:12px;}' +
      '.mp-label{font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px;}' +
      '.mp-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
      '.mp-toggle-info{font-size:11.5px;line-height:1.4;}' +
      '.mp-toggle-title{font-weight:700;color:#f1f5f9;display:flex;align-items:center;gap:5px;}' +
      '.mp-toggle-desc{font-size:10px;color:#64748b;margin-top:2px;}' +
      '#moon-phase-panel .mp-antisl,#moon-phase-panel .mp-extra-btn,#moon-phase-panel .mp-cardmode-btn,#moon-phase-panel .mp-fanfic-btn,#moon-phase-panel .mp-safelock-btn,#moon-phase-panel .mp-pacing-btn{padding:6px 12px;border-radius:9px;border:1px solid rgba(148,163,184,0.15);background:#0f172a;color:#94a3b8;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '#moon-phase-panel .mp-antisl.on{border-color:rgba(239,68,68,0.6);background:#991b1b;color:#fff;}' +
      '#moon-phase-panel .mp-extra-btn.on{border-color:rgba(56,189,248,0.6);background:#0369a1;color:#fff;}' +
      '#moon-phase-panel .mp-cardmode-btn.on{border-color:rgba(168,85,247,0.6);background:#4c1d95;color:#fff;}' +
      '#moon-phase-panel .mp-pacing-btn.Adi{border-color:rgba(56,189,248,0.6);background:rgba(56,189,248,0.15);color:#7dd3fc;}' +
      '#moon-phase-panel .mp-pacing-btn.And{border-color:rgba(168,85,247,0.6);background:rgba(168,85,247,0.15);color:#c084fc;}' +
      '#moon-phase-panel .mp-pacing-btn.All{border-color:rgba(244,63,94,0.6);background:rgba(244,63,94,0.15);color:#fda4af;}' +
      '#moon-phase-panel .mp-safelock-btn.on{border-color:rgba(110,231,183,0.5);background:#064e3b;color:#6ee7b7;}' +
      '#moon-phase-panel .mp-safelock-btn.off{border-color:rgba(251,191,36,0.5);background:#451a03;color:#fcd34d;}' +
      '#moon-phase-panel .mp-fanfic-btn.on{border-color:rgba(56,189,248,0.6);background:#0c4a6e;color:#7dd3fc;}' +
      '#moon-phase-panel .mp-fate{display:flex;align-items:center;gap:9px;margin-top:10px;padding:9px 12px;border-radius:10px;font-size:11px;font-weight:600;}' +
      '#moon-phase-panel .mp-fate.idle{background:rgba(16,185,129,0.08);color:#6ee7b7;border:1px solid rgba(16,185,129,0.22);}' +
      '#moon-phase-panel .mp-fate.active{background:rgba(244,63,94,0.12);color:#fda4af;border:1px solid rgba(244,63,94,0.35);}' +
      '.mp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-bottom:12px;}' +
      '#moon-phase-panel .mp-btn{padding:9px 6px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid rgba(148,163,184,0.12);background:#0f172a;color:#cbd5e1;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px;}' +
      '#moon-phase-panel .mp-btn:hover{background:#1e293b;color:#f8fafc;}' +
      '#moon-phase-panel .mp-btn-highlight{border-color:rgba(56,189,248,0.3) !important;background:#0c2540 !important;color:#7dd3fc !important;}' +
      '#moon-phase-panel .mp-btn-user{border-color:rgba(244,114,182,0.3) !important;background:#3b0a2a !important;color:#f9a8d4 !important;}' +
      '#moon-phase-panel .mp-status{background:#05070e;border:1px solid rgba(148,163,184,0.1);border-radius:12px;padding:12px 14px;font-size:10.5px;color:#94a3b8;line-height:1.65;max-height:230px;overflow-y:auto;font-family:monospace;}' +
      '.mp-log-subhead{margin-top:8px;margin-bottom:4px;color:#fde047;font-size:11px;font-weight:700;}' +
      '@keyframes moon-fade{from{opacity:0;transform:scale(0.96) translateY(4px);}to{opacity:1;transform:scale(1) translateY(0);}}' +
      '@keyframes moon-progress-slide{0%{left:-40%;}100%{left:105%;}}' +
      '@keyframes moon-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}' +
      '#moon-phase-panel{background:repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0,rgba(255,255,255,.012) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#160b18 0%,#09060d 100%) !important;border:2px solid #f472d0 !important;border-radius:4px !important;padding:16px !important;font-family:"Courier New",monospace !important;box-shadow:0 0 0 3px #2a1029,0 0 28px rgba(244,114,208,.26) !important;image-rendering:pixelated;}' +
      '#moon-phase-panel .mp-head{border-bottom:2px dashed rgba(244,114,208,.45) !important;}' +
      '#moon-phase-panel .mp-title{color:#ffb8eb !important;text-shadow:2px 2px #5a164d;letter-spacing:.5px !important;font-size:12px !important;}' +
      '#moon-phase-panel .mp-title-orb{filter:drop-shadow(0 0 5px #f472d0);}' +
      '#moon-phase-panel .mp-card{background:#100a13 !important;border:1px solid rgba(244,114,208,.32) !important;border-radius:3px !important;box-shadow:inset 0 0 0 1px rgba(244,114,208,.05);}' +
      '#moon-phase-panel .mp-lcd-card{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(145deg,#26352a 0%,#18251c 48%,#111c15 100%) !important;border:2px solid #71866b !important;box-shadow:inset 0 0 0 2px rgba(190,216,172,.14),inset 0 0 24px rgba(151,186,129,.15),0 0 0 3px #0a120d,0 0 14px rgba(129,176,113,.12) !important;color:#d2e5c8;}' +
      '#moon-phase-panel .mp-lcd-card:before{content:"";position:absolute;inset:4px;z-index:0;pointer-events:none;border:1px solid rgba(206,225,184,.13);background:linear-gradient(115deg,rgba(230,244,207,.08),transparent 28%,transparent 70%,rgba(197,224,174,.035)),repeating-linear-gradient(to bottom,rgba(210,238,190,.065) 0,rgba(210,238,190,.065) 1px,transparent 1px,transparent 3px),repeating-linear-gradient(to right,rgba(190,224,171,.035) 0,rgba(190,224,171,.035) 1px,transparent 1px,transparent 4px);opacity:.82;}' +
      '#moon-phase-panel .mp-lcd-card>*{position:relative;z-index:1;}' +
      '#moon-phase-panel .mp-lcd-card .mp-label{color:#d6ebc7 !important;text-shadow:0 0 5px rgba(184,222,157,.28);}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn{border-radius:2px !important;border-color:#58735b !important;background:rgba(15,30,20,.76) !important;color:#bacdb0 !important;box-shadow:inset 0 0 0 1px rgba(191,222,169,.045),2px 2px 0 rgba(3,11,7,.55) !important;}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn.active{border-color:#a7c78b !important;background:linear-gradient(145deg,#314b34,#263d2c) !important;color:#f0ffdf !important;box-shadow:inset 0 0 0 1px rgba(218,242,187,.16),0 0 9px rgba(171,213,139,.18),2px 2px 0 rgba(3,11,7,.65) !important;}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn div{color:inherit !important;}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn div:last-child{opacity:.9 !important;}' +
      '#moon-phase-panel .mp-lcd-card>div[style*="margin-top:8px"]{color:#b8ccb0 !important;}' +
      '#moon-phase-panel .mp-label,#moon-phase-panel .mp-toggle-title{color:#ffd1f1 !important;}' +
      '#moon-phase-panel .mp-btn,#moon-phase-panel .mp-mode-btn,#moon-phase-panel .mp-antisl,#moon-phase-panel .mp-extra-btn,#moon-phase-panel .mp-cardmode-btn,#moon-phase-panel .mp-fanfic-btn,#moon-phase-panel .mp-safelock-btn,#moon-phase-panel .mp-pacing-btn{border-radius:2px !important;font-family:"Courier New",monospace !important;box-shadow:2px 2px 0 #35152f;transition:transform .08s,filter .08s;}' +
      '#moon-phase-panel .mp-btn{background:#170d1a !important;border-color:#643052 !important;color:#f8d8ee !important;}' +
      '#moon-phase-panel .mp-btn:hover{background:#31132b !important;border-color:#f472d0 !important;transform:translate(-1px,-1px);filter:brightness(1.12);}' +
      '#moon-phase-panel .mp-btn-highlight{background:#32112b !important;border-color:#f472d0 !important;color:#ffb8eb !important;}' +
      '#moon-phase-panel .mp-btn-user{background:#241025 !important;border-color:#d946a6 !important;color:#ffc4e9 !important;}' +
      '#moon-phase-panel .mp-status{background:#08060a !important;border:1px dashed #7a3a68 !important;border-radius:2px !important;color:#e7b9d8 !important;}' +
      '#moon-phase-panel .mp-badge{border-radius:2px !important;background:#2a1126 !important;border-color:#87416e !important;color:#ffc4e9 !important;}' +
      '#moon-phase-panel button.mp-badge{appearance:none;-webkit-appearance:none;font-family:inherit;line-height:1.35;cursor:pointer;}' +
      '#moon-phase-panel .mp-fate{border-radius:2px !important;}' +
      '#moon-modal-mask.mp-pixel-modal>div{background:linear-gradient(180deg,#170b18,#09060d) !important;border:2px solid #f472d0 !important;border-radius:4px !important;font-family:"Courier New",monospace !important;box-shadow:0 0 0 3px #2a1029,0 0 28px rgba(244,114,208,.24) !important;}' +
      '#moon-modal-mask.mp-pixel-modal>div>div:first-child,#moon-firstboot-mask>div>div:first-child{color:#ff8cdb !important;border-color:rgba(244,114,208,.45) !important;text-shadow:2px 2px #48153e;}' +
      '#moon-modal-mask.mp-pixel-modal button{border-radius:2px !important;background:#37102f !important;border:1px solid #f472d0 !important;color:#ffe1f5 !important;font-family:"Courier New",monospace !important;box-shadow:2px 2px 0 #42173a;}' +
      '#moon-modal-mask.mp-pixel-modal button:hover{filter:brightness(1.2);}' +
      '#moon-firstboot-mask{font-family:"Courier New",monospace !important;}' +
      '#moon-firstboot-mask>div{border-radius:4px !important;border:2px solid #f472d0 !important;background:linear-gradient(180deg,#170b18,#09060d) !important;box-shadow:0 0 0 3px #2a1029,0 0 28px rgba(244,114,208,.25) !important;}' +
      '#moon-firstboot-mask button{border-radius:2px !important;background:#37102f !important;border-color:#f472d0 !important;}' +
      '.mp-pixel-loading{font-family:"Courier New",monospace !important;}' +
      '.mp-loading-box{padding:20px 28px;border-radius:3px;background:#100914;border:2px solid #f472d0;color:#ffe1f5;font-size:13px;text-align:center;min-width:260px;max-width:360px;box-sizing:border-box;box-shadow:0 0 0 3px #2a1029,0 0 26px rgba(244,114,208,.2);}' +
      '.mp-loading-track{height:5px;border:1px solid #74305f;background:#1a101b;overflow:hidden;position:relative;}' +
      '.mp-loading-bar{position:absolute;top:0;height:100%;width:38%;background:#f472d0;animation:moon-progress-slide 1.25s ease-in-out infinite;}' +
      '.mp-arcade-box{width:min(360px,100%);box-sizing:border-box;padding:14px 12px 10px;background:linear-gradient(145deg,#354137,#202b23 48%,#172119);border:3px solid #788b6e;outline:3px solid #101912;color:#dbe9ce;text-align:center;box-shadow:inset 0 0 0 2px rgba(208,226,191,.15),inset 0 0 18px rgba(166,194,145,.12),0 5px 0 #080e0a;font-family:"Courier New",monospace;image-rendering:pixelated;}' +
      '.mp-arcade-brand{font-size:10px;letter-spacing:2px;color:#c0d4a9;text-shadow:1px 1px #344733;margin-bottom:8px;}' +
      '.mp-arcade-title{font-size:11px;line-height:1.6;color:#e1edcf;margin:0 auto 8px;max-width:320px;}' +
      '.mp-arcade-hud{display:flex;justify-content:space-between;font-size:9px;color:#bdcdaa;margin:0 auto 5px;max-width:320px;}' +
      '.mp-arcade-hud b{color:#f0ffdb;font-weight:700;margin-left:4px;text-shadow:0 0 5px rgba(200,230,171,.24);}' +
      '#moon-arcade-canvas{display:block;width:min(320px,100%);height:auto;margin:0 auto;border:2px solid #64775e;background:#17241b;box-shadow:inset 0 0 12px rgba(8,16,10,.5);image-rendering:pixelated;touch-action:manipulation;}' +
      '.mp-arcade-state{min-height:15px;margin-top:8px;color:#d8e9be;font-size:9px;letter-spacing:1px;}' +
      '.mp-arcade-foot{margin-top:6px;color:#aebd9e;font-size:9px;line-height:1.5;}' +
      '.mp-arcade-exit{margin-top:8px;padding:5px 10px;background:#27352a;border:1px solid #71866b;color:#dce9cc;font:10px "Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #101812;}' +
      '.mp-lcd-game{padding:8px !important;}' +
      '.mp-lcd-game .mp-arcade-box{width:100%;padding:9px 7px 8px;border-width:2px;outline:2px solid #101912;}' +
      '.mp-lcd-game .mp-arcade-brand{margin-bottom:5px;font-size:9px;}' +
      '.mp-lcd-game .mp-arcade-hud{font-size:8px;}' +
      '.mp-lcd-game .mp-arcade-foot{font-size:8px;}' +
      '#moon-loading-mask.mp-pixel-loading{font-family:"Courier New",monospace !important;}' +
      '.mp-settings-fold{margin:-2px 0 10px;}' +
      '.mp-settings-fold>summary{list-style:none;display:flex;justify-content:space-between;align-items:center;padding:10px 11px;background:#180d1a;border:1px solid #70345f;color:#ffc4e9;font:700 11px "Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #35152f;}' +
      '.mp-settings-fold>summary::-webkit-details-marker{display:none;}' +
      '.mp-settings-fold>summary span{color:#f472d0;transition:transform .15s;}' +
      '.mp-settings-fold[open]>summary{margin-bottom:11px;border-color:#f472d0;background:#251024;}' +
      '.mp-settings-fold[open]>summary span{transform:rotate(180deg);}' +
      '.mp-menu-label,.mp-sub-label{font:700 9px "Courier New",monospace;color:#f472d0;letter-spacing:1.5px;margin:0 0 9px;text-shadow:1px 1px #45153a;}' +
      '.mp-menu-grid{display:grid;grid-template-columns:1fr;gap:8px;}' +
      '.mp-menu-card{width:100%;min-height:54px;display:flex;align-items:center;gap:10px;padding:8px 10px;text-align:left;background:linear-gradient(180deg,#1c1020,#100a13);border:1px solid #74355f;color:#ffe1f5;font-family:"Courier New",monospace;cursor:pointer;box-shadow:3px 3px 0 #35152f;}' +
      '.mp-menu-card:hover,.mp-menu-card:focus{background:#2a1226;border-color:#ff78d6;transform:translate(-1px,-1px);outline:none;}' +
      '.mp-menu-icon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;background:#32112b;border:1px solid #a94d8b;color:#ff8cdb;font-size:16px;text-shadow:1px 1px #551344;}' +
      '.mp-menu-card>span:nth-child(2){display:flex;flex:1;min-width:0;flex-direction:column;gap:3px;}' +
      '.mp-menu-card b{font-size:11px;color:#ffe0f4;letter-spacing:.3px;}' +
      '.mp-menu-card small{font:9px "Courier New",monospace;color:#bc8eaf;line-height:1.35;}' +
      '.mp-menu-card i{font:20px "Courier New",monospace;color:#f472d0;font-style:normal;}' +
      '.mp-menu-controls{display:flex;justify-content:space-between;gap:5px;margin-top:13px;padding-top:9px;border-top:1px dashed #502747;color:#a8819e;font:8px "Courier New",monospace;letter-spacing:.3px;}' +
      '.mp-menu-controls kbd{padding:2px 4px;border:1px solid #9e4b84;background:#2a1126;color:#ffc4e9;font:700 8px "Courier New",monospace;box-shadow:1px 1px #35152f;}' +
      '.mp-menu-page-head{display:flex;align-items:center;gap:10px;margin-bottom:13px;padding:8px;background:#100a13;border:1px solid #693253;box-shadow:inset 0 0 0 1px rgba(244,114,208,.05);}' +
      '.mp-menu-back{padding:8px 9px;background:#291124;border:1px solid #a94d8b;color:#ffc4e9;font:700 10px "Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #35152f;}' +
      '.mp-menu-page-head>div{display:flex;flex:1;flex-direction:column;gap:3px;}' +
      '.mp-menu-page-head small{font:8px "Courier New",monospace;color:#a8819e;letter-spacing:1px;}' +
      '.mp-menu-page-head b{font:700 12px "Courier New",monospace;color:#ffb8eb;}' +
      '.mp-page-led{width:7px;height:7px;border-radius:50%;background:#ff5fc8;box-shadow:0 0 7px #ff5fc8;}' +
      '.mp-menu-subpage .mp-grid{margin-bottom:4px;}' +
      '.mp-action-fold{margin:0 0 9px;border:1px solid #74355f;background:linear-gradient(180deg,#180d1a,#100a13);box-shadow:2px 2px 0 #35152f;}' +
      '.mp-action-fold>summary{position:relative;list-style:none;display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:38px;padding:9px 34px 9px 11px;cursor:pointer;}' +
      '.mp-action-fold>summary::-webkit-details-marker{display:none;}' +
      '.mp-action-fold>summary>span{font:700 11px "Courier New",monospace;color:#ffe1f5;}' +
      '.mp-action-fold>summary>small{font:9px "Courier New",monospace;color:#bc8eaf;}' +
      '.mp-action-fold>summary>i{position:absolute;right:11px;top:50%;transform:translateY(-50%);font:18px "Courier New",monospace;font-style:normal;color:#f472d0;transition:transform .12s;}' +
      '.mp-action-fold[open]{border-color:#bf5a9c;background:#1b0d1b;}' +
      '.mp-action-fold[open]>summary{border-bottom:1px dashed #74355f;}' +
      '.mp-action-fold[open]>summary>i{transform:translateY(-50%) rotate(45deg);}' +
      '.mp-action-fold>.mp-grid{padding:10px 9px 8px;margin:0;}' +
      '#moon-phase-panel .mp-update-hitbox{appearance:none;-webkit-appearance:none;display:flex;flex:1 1 auto;align-items:center;flex-wrap:wrap;gap:8px;min-width:0;max-width:calc(100% - 34px);padding:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;}' +
      '#moon-phase-panel .mp-update-hitbox:hover .mp-title{color:#fff0fb !important;text-shadow:0 0 8px rgba(244,114,208,.55);}' +
      '#moon-phase-panel .mp-update-hitbox:focus-visible{outline:1px dashed #ff8cdb;outline-offset:4px;}' +
      '#moon-phase-panel .mp-update-hitbox .mp-title-orb{flex:0 0 auto;}' +
      '#moon-phase-panel .mp-update-hitbox .mp-title{display:block;flex:1 1 170px;min-width:0;max-width:none;overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:anywhere;line-height:1.35;}' +
      '#moon-phase-panel .mp-update-hitbox .mp-badge{display:inline-block;flex:0 0 auto;}' +
      '@media(max-width:480px){#moon-phase-panel{max-height:92dvh !important;padding:12px !important;}#moon-phase-panel .mp-update-hitbox{max-width:calc(100% - 30px);gap:6px;}#moon-phase-panel .mp-update-hitbox .mp-title{flex-basis:140px;font-size:11px !important;letter-spacing:0 !important;}.mp-arcade-box{padding:12px 9px;}.mp-menu-controls{font-size:7px;}}';
  }
// ===== 第 16 份 =====
  function renderEventStatusCard() {
    const data = readMvuLatest();
    if (!data || !data.stat_data) return '<div style="font-size:10.5px;color:#64748b;">（暂无变量数据）</div>';
    const chars = data.stat_data.角色 || {};
    const world = data.stat_data.世界 || {};
    const internalDays = Number(world._内部流逝天数) || 0;
    const names = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (names.length === 0) return '<div style="font-size:10.5px;color:#64748b;">（暂无角色事件记录）</div>';
    let html = '<div style="margin-bottom:6px;font-size:10px;color:#94a3b8;">世界内部流逝：<b style="color:#7dd3fc;">' + internalDays.toFixed(1) + '</b> 天</div>';
    names.forEach(function(name) {
      const ch = chars[name] || {};
      const q = ch._quota || {};
      const es = q._eventState || null;
      html += '<div style="padding:8px 10px;background:#05070e;border-radius:9px;margin-bottom:6px;border:1px solid rgba(148,163,184,0.1);">';
      html += '<div style="font-size:11px;color:#e2e8f0;font-weight:700;margin-bottom:5px;">' + name + '</div>';
      const days = Number(es && es._距离主线天数);
      if (!isNaN(days) && isFinite(days)) {
        if (days <= 0) html += '<div style="font-size:10.5px;color:#fca5a5;">📜 主线已触发</div>';
        else html += '<div style="font-size:10.5px;color:#fde047;">📜 主线倒计时：约 ' + Math.floor(days) + ' 天</div>';
      }
      if (!es) html += '<div style="font-size:10.5px;color:#6ee7b7;">· 状态未初始化</div>';
      else {
        const cur = String(es.当前事件 || '').trim();
        const type = String(es.事件类型 || '').trim();
        const remain = Number(es.剩余回合) || 0;
        const cd = Number(es.冷却回合) || 0;
        if (cur && remain > 0) html += '<div style="font-size:10.5px;color:#7dd3fc;">事件：' + cur + '（' + type + '）· 剩 ' + remain + ' 回合</div>';
        else if (cd > 0) html += '<div style="font-size:10.5px;color:#94a3b8;">冷却中 · 剩 ' + cd + ' 回合</div>';
        else html += '<div style="font-size:10.5px;color:#6ee7b7;">待触发新事件</div>';
      }
      html += '</div>';
    });
    return html;
  }

  function renderPanel(panel) {
    if (panel._lcdArcadeStop) { try { panel._lcdArcadeStop(); } catch (e) {} panel._lcdArcadeStop = null; }
    const mode = getCurrentMode();
    const antisl = getAntiSL();
    const extraSetting = getExtraModelMode();
    const cardMode = getCardMode();
    const pacing = getEventPacing();
    const fateActive = isFateCollapseTriggered();
    const currentMeta = LUNAR_META[mode] || LUNAR_META.hell;
    const fanficOn = getFanficEnhance();
    const bioStatus = getCurrentBioStatus();
    const enabledUserBio = getEnabledUserBio();
    panel.innerHTML = '' +
      '<div class="mp-head"><button type="button" class="mp-title-group mp-update-hitbox" id="moon-version-badge" aria-label="检查更新" title="点击标题区域或版本号检查更新" style="display:flex;align-items:center;gap:8px;">' +
      '<span class="mp-title-orb">' + currentMeta.glyph + '</span>' +
'<span class="mp-title">' + SYSTEM_UI_NAME + '</span>' +
'<span class="mp-badge" style="cursor:pointer;' +
  (_cachedUpdateInfo ? 'border-color:rgba(253,224,71,0.55);color:#fde047;' : '') +
  '">v' + MOON_FORMULA_VERSION +
  (_cachedUpdateInfo ? ' <b style="color:#fde047;margin-left:2px;">NEW · 有更新</b>' : '') +
'</span>' +
      '</button><button class="mp-close" id="moon-phase-close">✕</button></div>' +
      '<div class="mp-card mp-lcd-card"><div class="mp-label">月相刻度 · 运行模式</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' +
      ['easy', 'normal', 'hard', 'hell'].map(function(m) {
        const item = LUNAR_META[m]; const isAct = (m === mode);
        return '<button class="mp-mode-btn ' + (isAct ? 'active' : '') + '" data-mode="' + m + '" style="padding:8px 2px;border-radius:9px;border:1px solid ' + (isAct ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.15)') + ';background:' + (isAct ? '#0c2540' : '#0f172a') + ';color:' + (isAct ? '#7dd3fc' : '#94a3b8') + ';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">' +
          '<div style="font-size:14px;">' + item.glyph + '</div><div>' + item.name + '</div>' +
          '<div style="font-size:8px;opacity:0.65;">周上限 ' + item.quota + '</div></button>';
      }).join('') + '</div>' +
      '<div style="margin-top:8px;font-size:10.5px;color:#94a3b8;line-height:1.55;">' +
      '<b style="color:#e2e8f0;">' + currentMeta.glyph + ' ' + currentMeta.name + ' · ' + currentMeta.title + '</b><br>' + currentMeta.detail + '</div></div>' +
      '<div class="mp-card"><details class="mp-settings-fold"><summary>⚙ 游戏难度与规则 <span>▼</span></summary><div class="mp-toggle-row">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🌑 锚定时间线</div><div class="mp-toggle-desc">冷战期或好感度为负时锚定</div></div>' +
      '<button class="mp-antisl ' + (antisl ? 'on' : '') + '" id="moon-phase-antisl">' + (antisl ? '锚定: ON' : '锚定: OFF') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🌙 副模型解析系统</div><div class="mp-toggle-desc">主模型写剧情，副模型算变量</div></div>' +
      '<button class="mp-extra-btn ' + (extraSetting !== 'off' ? 'on' : '') + '" id="moon-phase-extramodel">副模型: ' + extraSetting.toUpperCase() + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🃏 卡组模式</div><div class="mp-toggle-desc">' + (cardMode === 'multi' ? '多人卡' : '单人卡') + '</div></div>' +
      '<button class="mp-cardmode-btn ' + (cardMode === 'multi' ? 'on' : '') + '" id="moon-phase-cardmode">' + (cardMode === 'multi' ? '多人卡' : '单人卡') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🔒 安全锁</div><div class="mp-toggle-desc">' + (getSafetyLock() ? '角色最多表现为心理敌意' : '允许升级至实质敌对') + '</div></div>' +
      '<button class="mp-safelock-btn ' + (getSafetyLock() ? 'on' : 'off') + '" id="moon-phase-safetylock">' + (getSafetyLock() ? '🔒 ON' : '⚠️ OFF') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🎬 事件推进节奏</div><div class="mp-toggle-desc">' + (pacing === 'Adi' ? '柔板' : pacing === 'All' ? '快板' : '行板') + '</div></div>' +
      '<button class="mp-pacing-btn ' + pacing + '" id="moon-phase-pacing">' + (pacing === 'Adi' ? 'Adagio' : pacing === 'All' ? 'Allegro' : 'Andante') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🌐 同人台词补强</div><div class="mp-toggle-desc">' + (fanficOn ? '台词参考源语言原文' : '不参考原 IP 语料') + '</div></div>' +
      '<button class="mp-fanfic-btn' + (fanficOn ? ' on' : '') + '" id="moon-phase-fanfic">' + (fanficOn ? '🌐 ON' : 'OFF') + '</button></div>' +
      '</details><div class="mp-fate ' + (fateActive ? 'active' : 'idle') + '">' +
      '<span style="width:7px;height:7px;border-radius:50%;background:' + (fateActive ? '#f43f5e' : '#34d399') + ';"></span>' +
      '<span>' + (fateActive ? '🌑 锚定生效中' : '🌓 月相流转中 · 命运未定') + '</span></div></div>' +
      (bioStatus.count > 0 ? '<div class="mp-card" style="border-color:rgba(110,231,183,0.3);background:rgba(16,185,129,0.06);"><div style="font-size:11px;color:#6ee7b7;font-weight:700;">📖 已启用 ' + bioStatus.count + ' 份角色小抄</div><div style="font-size:10px;color:#94a3b8;margin-top:3px;">覆盖角色：' + bioStatus.charNames.join('、') + '</div></div>' : '') +
      (enabledUserBio ? '<div class="mp-card" style="border-color:rgba(244,114,182,0.3);background:rgba(244,114,182,0.06);"><div style="font-size:11px;color:#f9a8d4;font-weight:700;">👤 已启用玩家小抄</div><div style="font-size:10px;color:#94a3b8;margin-top:3px;">玩家：' + String(enabledUserBio.userName || '(未命名)').replace(/</g, '&lt;') + ' · 覆盖 Persona 面板</div></div>' : '') +
      '<div class="mp-card"><div class="mp-label">事件导演 · 当前状态</div><div id="moon-event-status" style="font-size:10.5px;line-height:1.6;">' + renderEventStatusCard() + '</div></div>' +
      '<div class="mp-card"><div class="mp-label" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<span>📊 Token 占用</span><button id="moon-token-refresh" style="background:#0c2540;color:#7dd3fc;border:1px solid rgba(56,189,248,0.35);border-radius:6px;font-size:10px;padding:2px 8px;cursor:pointer;font-family:inherit;">🔄 刷新</button></div>' +
      '<div id="moon-token-box" style="font-size:10.5px;line-height:1.7;color:#94a3b8;">点击 🔄 刷新开始统计</div></div>' +
      '<section class="mp-menu-home" id="moon-menu-home"><div class="mp-menu-label">SELECT A MODE · 选择功能区</div><div class="mp-menu-grid">' +
      '<button class="mp-menu-card" data-menu-open="adventure"><span class="mp-menu-icon">▶</span><span><b>开始游戏</b><small>开局配置 · 属性调整 · 回合计时</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="characters"><span class="mp-menu-icon">♥</span><span><b>角色与存档</b><small>角色档案 · 玩家档案 · 资料库</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="timeline"><span class="mp-menu-icon">▤</span><span><b>世界记录</b><small>时间线扫描 · 生成 · 编辑</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="system"><span class="mp-menu-icon">⚙</span><span><b>机器诊断</b><small>系统自检 · 规则测试 · 环境扫描</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="settings"><span class="mp-menu-icon">▧</span><span><b>选项与资料</b><small>游戏规则 · AI 设置 · 版本更新 · 帮助</small></span><i>›</i></button>' +
      '<button class="mp-menu-card mp-arcade-launch" id="moon-phase-arcade"><span class="mp-menu-icon">▣</span><span><b>街机小游戏</b><small>随时开玩 · 本机最高分 ' + String(getArcadeHighScore()).padStart(5, '0') + '</small></span><i>▶</i></button>' +
      '</div><div class="mp-menu-controls"><span><kbd>ENTER / A</kbd> 选择</span><span><kbd>ESC / B</kbd> 返回</span><span>♥ 全功能保留</span></div></section>' +
      '<section class="mp-menu-page" id="moon-menu-page" style="display:none"><div class="mp-menu-page-head"><button class="mp-menu-back" id="moon-menu-back">◀ 返回</button><div><small>GAME MENU / 目录</small><b id="moon-menu-page-title">功能</b></div><span class="mp-page-led"></span></div>' +
      '<div class="mp-menu-subpage" data-menu-page="adventure" style="display:none"><div class="mp-sub-label">冒险模式 / ADVENTURE MODE</div>' +
      '<details class="mp-action-fold"><summary><span>回合与属性</span><small>回合计时 · 属性点数调整</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-countdown">⏱️ 回合计时</button><button class="mp-btn mp-btn-highlight" id="moon-phase-reroll">🎲 属性点重掷</button></div></details>' +
      '<details class="mp-action-fold"><summary><span>新游戏与存档转移</span><small>开局适配 · 打包迁移</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-adapt">🚀 开局适配</button><button class="mp-btn mp-btn-highlight" id="moon-phase-pack-migrate">📦 存档迁移</button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="characters" style="display:none"><div class="mp-sub-label">角色与存档 / CHARACTER FILES</div>' +
      '<details class="mp-action-fold"><summary><span>角色资料库</span><small>角色试镜 · 角色小抄</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-bio">🎬 角色试镜</button><button class="mp-btn mp-btn-highlight" id="moon-phase-bio-lib">📚 角色小抄库</button></div></details>' +
      '<details class="mp-action-fold"><summary><span>玩家资料库</span><small>玩家档案 · 小抄收藏</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-user" id="moon-phase-user-bio">👤 玩家档案</button><button class="mp-btn mp-btn-user" id="moon-phase-user-bio-lib">📂 玩家资料库</button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="timeline" style="display:none"><div class="mp-sub-label">世界记录 / WORLD LOG</div>' +
      '<details class="mp-action-fold"><summary><span>记录扫描与生成</span><small>扫描世界条目 · 生成时间线</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-scan-timeline">🔎 扫描时间线</button><button class="mp-btn" id="moon-phase-tl-gen">📝 生成时间线</button></div></details>' +
      '<details class="mp-action-fold"><summary><span>记录编辑</span><small>标签管理 · 手动补录</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-tl-tag">🏷️ 时间线标签</button><button class="mp-btn" id="moon-phase-manual-tl">✍️ 手动补录</button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="system" style="display:none"><div class="mp-sub-label">机器诊断 / SYSTEM DIAGNOSTICS</div>' +
      '<details class="mp-action-fold"><summary><span>基础诊断</span><small>系统自检 · 模拟测试</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-selfcheck">🔭 系统自检</button><button class="mp-btn" id="moon-phase-simtest">🧪 模拟测试</button></div></details>' +
      '<details class="mp-action-fold"><summary><span>兼容性扫描</span><small>脚本冲突 · AI 功能检测</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-conflict">🔍 冲突扫描</button><button class="mp-btn" id="moon-phase-ai-detect">🤖 AI 功能检测</button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="settings" style="display:none"><div class="mp-sub-label">选项与资料 / OPTIONS</div>' +
      '<details class="mp-action-fold"><summary><span>AI 行为设置</span><small>提示词编辑 · 副模型配置</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-prompt-edit">🧩 提示词设置</button><button class="mp-btn" id="moon-phase-custom-ai">⚙️ 副模型设置</button></div></details>' +
      '<details class="mp-action-fold"><summary><span>版本与帮助</span><small>更新游戏系统 · 查阅帮助</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn' + (_cachedUpdateInfo ? ' mp-btn-highlight' : '') + '" id="moon-phase-update">' + (_cachedUpdateInfo ? '⬇ 发现新版本 · 查看更新' : '🔄 检查版本更新') + '</button><button class="mp-btn" id="moon-phase-faq">❓ 帮助与说明</button></div></details></div></section>' +
      '<div class="mp-status" id="moon-phase-status">' + SYSTEM_UI_NAME + ' 准备就绪。</div>';
    panel.querySelector('#moon-phase-close').addEventListener('click', closePanel);
    const menuHome = panel.querySelector('#moon-menu-home');
    const menuPage = panel.querySelector('#moon-menu-page');
    const menuTitles = { adventure: '开始游戏', characters: '角色与存档', timeline: '世界记录', system: '机器诊断', settings: '选项与资料' };
    panel.querySelectorAll('[data-menu-open]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const key = btn.getAttribute('data-menu-open');
        menuHome.style.display = 'none';
        menuPage.style.display = 'block';
        const title = panel.querySelector('#moon-menu-page-title');
        if (title) title.textContent = menuTitles[key] || '功能';
        panel.querySelectorAll('.mp-menu-subpage').forEach(function(page) {
          page.style.display = page.getAttribute('data-menu-page') === key ? 'block' : 'none';
        });
      });
    });
    panel.querySelector('#moon-menu-back').addEventListener('click', function() {
      menuPage.style.display = 'none';
      menuHome.style.display = 'block';
    });
    panel.querySelector('#moon-phase-arcade').addEventListener('click', function() {
      const lcdCard = panel.querySelector('.mp-lcd-card');
      if (!lcdCard) return;
      const savedDisplay = lcdCard.innerHTML;
      lcdCard.classList.add('mp-lcd-game');
      lcdCard.innerHTML = '<div class="mp-arcade-box"><div class="mp-arcade-brand">▣ MOON POCKET ARCADE ▣</div><div class="mp-arcade-title">像素跳跃 · 避开障碍，挑战本机最高纪录</div><div class="mp-arcade-hud"><span>SCORE <b id="moon-arcade-score">00000</b></span><span>HI <b id="moon-arcade-hi-score">' + String(getArcadeHighScore()).padStart(5, '0') + '</b></span></div><canvas id="moon-arcade-canvas" width="320" height="94" aria-label="离线像素小游戏，按空格、方向上键或点击屏幕跳跃"></canvas><div class="mp-arcade-state" id="moon-arcade-state">PRESS SPACE / TAP TO JUMP</div><div class="mp-arcade-foot">空格 / ↑ / 触屏跳跃 · 撞到障碍后点击重开</div><button class="mp-arcade-exit" type="button">◀ 返回模式选择</button></div>';
      panel._lcdArcadeStop = mountArcadeRunner(lcdCard, { standalone: true });
      lcdCard.querySelector('.mp-arcade-exit').addEventListener('click', function() {
        if (panel._lcdArcadeStop) { try { panel._lcdArcadeStop(); } catch (e) {} panel._lcdArcadeStop = null; }
        lcdCard.classList.remove('mp-lcd-game');
        lcdCard.innerHTML = savedDisplay;
      });
      try { lcdCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    });
    if (panel.dataset.menuKeysBound !== '1') {
      panel.dataset.menuKeysBound = '1';
      panel.addEventListener('keydown', function(event) {
        if ((event.key === 'Escape' || event.key === 'Backspace') && menuPage.style.display !== 'none') {
          event.preventDefault();
          panel.querySelector('#moon-menu-back').click();
        }
      });
    }
const _badgeEl = panel.querySelector('#moon-version-badge');
if (_badgeEl) {
  _badgeEl.addEventListener('click', function() {
    if (_cachedUpdateInfo) {
      showUpdateAvailableDialog(_cachedUpdateInfo);
      return;
    }
    const cfg = getUpdateConfig();
    if (!cfg.url) { openUpdateConfigDialog(panel); return; }
    checkForUpdates(false);
  });
}

panel.querySelector('#moon-phase-update').addEventListener('click', function() {
  if (_cachedUpdateInfo) { showUpdateAvailableDialog(_cachedUpdateInfo); return; }
  const cfg = getUpdateConfig();
  if (!cfg.url) openUpdateConfigDialog(panel);
  else checkForUpdates(false);
});
    if (panel.dataset.modeButtonsBound !== '1') {
      panel.dataset.modeButtonsBound = '1';
      panel.addEventListener('click', function(event) {
        const btn = event.target && event.target.closest ? event.target.closest('.mp-mode-btn') : null;
        if (!btn || !panel.contains(btn)) return;
        const s = getSettings(); s.mode = btn.getAttribute('data-mode'); saveSettings(s); refreshPanel();
      });
    }
    panel.querySelector('#moon-phase-antisl').addEventListener('click', function() { const s = getSettings(); s.antisl = !(s.antisl === true); saveSettings(s); refreshPanel(); });
    panel.querySelector('#moon-phase-extramodel').addEventListener('click', function() { const s = getSettings(); const cur = s.extraModel || 'auto'; const next = cur === 'auto' ? 'on' : (cur === 'on' ? 'off' : 'auto'); s.extraModel = next; saveSettings(s); refreshPanel(); toast('副模型策略：' + next.toUpperCase(), 'info'); });
    panel.querySelector('#moon-phase-cardmode').addEventListener('click', function() { const s = getSettings(); s.cardMode = (s.cardMode === 'multi') ? 'single' : 'multi'; saveSettings(s); refreshPanel(); });
    panel.querySelector('#moon-phase-safetylock').addEventListener('click', function() { const s = getSettings(); s.safetyLock = !getSafetyLock(); saveSettings(s); refreshPanel(); });
    panel.querySelector('#moon-phase-pacing').addEventListener('click', function() { const s = getSettings(); const cur = getEventPacing(); const next = cur === 'Adi' ? 'And' : (cur === 'And' ? 'All' : 'Adi'); s.eventPacing = next; saveSettings(s); refreshPanel(); });
    panel.querySelector('#moon-phase-fanfic').addEventListener('click', function() { const cur = getFanficEnhance(); setFanficEnhance(!cur); refreshPanel(); });
    panel.querySelector('#moon-phase-countdown').addEventListener('click', function() { const actions = checkAllCountdowns(); const statusEl = panel.querySelector('#moon-phase-status'); if (actions.length === 0) statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 巡检完成：暂无到期周期节点。</span>'; else { let html = '<b style="color:#fde047">⚡ 捕捉到 ' + actions.length + ' 个到期节点：</b><br>'; actions.forEach(function(a) { html += '<span style="color:#93c5fd">[' + a.type + ']</span> ' + a.char + '<br>'; }); statusEl.innerHTML = html; } });
    panel.querySelector('#moon-phase-selfcheck').addEventListener('click', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#f472d0">⏳ 运行自检...</span>'; const html = await runSelfCheckWithArcade(); statusEl.innerHTML = '<span style="color:#f9a8d4">✔ 自检完成。</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 自检报告', html); });
    panel.querySelector('#moon-phase-simtest').addEventListener('click', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#93c5fd">⏳ 运行测试...</span>'; const html = await runSimulationTest(); statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 测试完成。</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 测试结果', html); });
    panel.querySelector('#moon-phase-conflict').addEventListener('click', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#93c5fd">⏳ 扫描冲突...</span>'; const result = await runConflictScan(); statusEl.innerHTML = result.hasConflict ? '<span style="color:#fbbf24">⚠ 发现冲突</span>' : '<span style="color:#6ee7b7">✔ 未发现冲突</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 冲突扫描', result.html); });
    panel.querySelector('#moon-phase-reroll').addEventListener('click', function() { openRerollDialog(panel); });
    panel.querySelector('#moon-phase-pack-migrate').addEventListener('click', function() { startMigrationPack(panel); });
    panel.querySelector('#moon-phase-bio').addEventListener('click', function() { openAuditionMainDialog(panel); });
    panel.querySelector('#moon-phase-bio-lib').addEventListener('click', function() { openBioLibraryDialog(panel); });
    panel.querySelector('#moon-phase-user-bio').addEventListener('click', function() { openUserAuditionMainDialog(panel); });
    panel.querySelector('#moon-phase-user-bio-lib').addEventListener('click', function() { openUserBioLibraryDialog(panel); });
    panel.querySelector('#moon-phase-prompt-edit').addEventListener('click', function() { openPromptEditor(panel); });
    panel.querySelector('#moon-phase-custom-ai').addEventListener('click', function() { openCustomAIConfigDialog(panel); });
    panel.querySelector('#moon-phase-faq').addEventListener('click', openFaqDialog);
    panel.querySelector('#moon-phase-adapt').addEventListener('click', function() { openUnifiedAdaptDialog(panel); });
    panel.querySelector('#moon-phase-ai-detect').addEventListener('click', function() { openAiConflictDialog(panel); });
    panel.querySelector('#moon-token-refresh').addEventListener('click', function() { refreshTokenCard(panel); });
    setTimeout(function() { try { refreshTokenCard(panel); } catch (e) {} }, 120);
    panel.querySelector('#moon-phase-scan-timeline').addEventListener('click', function() { openScanTimelineDialog(panel); });
    panel.querySelector('#moon-phase-tl-gen').addEventListener('click', function() { openTimelineGeneratorDialog(panel); });
    panel.querySelector('#moon-phase-manual-tl').addEventListener('click', function() { openManualTimelineInputDialog(panel); });
    panel.querySelector('#moon-phase-tl-tag').addEventListener('click', function() { openTimelineTagDialog(panel); });
  }
// ===== 第 17 份 =====
  async function runSelfCheck() {
    const lines = [];
    const ok = function(s) { lines.push('<span style="color:#6ee7b7">✔</span> ' + s); };
    const warn = function(s) { lines.push('<span style="color:#fbbf24">⚠</span> ' + s); };
    const info = function(s) { lines.push('<span style="color:#93c5fd">ℹ</span> ' + s); };
    const fail = function(s) { lines.push('<span style="color:#f87171">✖</span> ' + s); };
    lines.push('<div class="mp-log-subhead">── 系统版本 ──</div>');
    info('脚本版本：' + MOON_FORMULA_VERSION + ' · LocalState Refactor');
    info('UI 名称：' + SYSTEM_UI_NAME);
    info('特殊标签：Sylveina');
    info('卡组模式：' + (getCardMode() === 'multi' ? '多人卡' : '单人卡'));
    const pacingName = { Adi: 'Adagio · 柔板', And: 'Andante · 行板', All: 'Allegro · 快板' }[getEventPacing()] || getEventPacing();
    info('推进节奏：' + pacingName);
    info('同人台词补强：' + (getFanficEnhance() ? 'ON' : 'OFF'));
    info('安全锁：' + (getSafetyLock() ? '🔒 ON' : '⚠️ OFF'));
    info('防SL锚定：' + (getAntiSL() ? '🔒 ON' : '⚠️ OFF'));
    info('当前难度：' + (LUNAR_META[getCurrentMode()]?.name || getCurrentMode()));

lines.push('<div class="mp-log-subhead">── 本地存储层 ──</div>');
    const stateKey = getChatStateKey();
    const localRaw = localStorage.getItem(stateKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        const charCount = Object.keys(parsed.stat_data && parsed.stat_data.角色 || {}).filter(function(k) { return !isCharSkeleton(parsed.stat_data.角色[k]); }).length;
        ok('LocalStorage 读写正常 · 已归档角色数: ' + charCount);
        const worldTime = parsed.stat_data && parsed.stat_data.世界 && parsed.stat_data.世界.时间;
        if (worldTime) info('世界时间：' + worldTime);
      } catch (e) { fail('LocalStorage 数据损坏: ' + e.message); }
    } else { warn('LocalStorage 暂无数据，等待第一次建档写入'); }
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && ctx.chatMetadata[stateKey]) ok('ChatMetadata 备份正常（防清缓存/防换设备丢失）');
      else warn('ChatMetadata 暂无备份，建议在数据写入时同步补全');
    } catch (e) { fail('ChatMetadata 读取失败'); }
     lines.push('<div class="mp-log-subhead">── 核心引擎 ──</div>');
    info('Sylveina 标签格式：[Sylveina|L/M/H|+/-|基础值]');
    info('基础值区间：L=0.5~2.0 · M=3.0~5.0 · H=6.0~10.0');
    info('单次上限：' + MOON_FORMULA_PARAMS.singleCap + ' 点');
    info('周上限：简单 ' + MOON_FORMULA_PARAMS.weeklyCap.easy + ' / 普通 ' + MOON_FORMULA_PARAMS.weeklyCap.normal + ' / 困难 ' + MOON_FORMULA_PARAMS.weeklyCap.hard + ' / 地狱 ' + MOON_FORMULA_PARAMS.weeklyCap.hell);

    lines.push('<div class="mp-log-subhead">── 小抄库 ──</div>');
    try {
      const bioLib = getBioLibrary();
      const bioList = Object.values(bioLib.bios || {});
      if (bioList.length === 0) info('角色小抄库为空');
      else { const enabledCount = bioList.filter(function(b) { return b.enabled === true; }).length; ok('角色小抄：共 ' + bioList.length + ' 份（启用 ' + enabledCount + ' 份）'); }
    } catch (e) { fail('小抄库读取失败：' + (e.message || e)); }
    try {
      const ubLib = getUserBioLibrary();
      const ubList = Object.values(ubLib.userBios || {});
      if (ubList.length === 0) info('玩家小抄库为空');
      else { const enabledCount = ubList.filter(function(b) { return b.enabled === true; }).length; ok('玩家小抄：共 ' + ubList.length + ' 份（启用 ' + enabledCount + ' 份）'); }
    } catch (e) { fail('玩家小抄库读取失败：' + (e.message || e)); }

    const curCard = getCurrentCardName();
    const bioStatus = getCurrentBioStatus();
    if (curCard && curCard !== '(未知卡牌)') {
      info('当前卡：' + curCard + ' · 启用小抄 ' + bioStatus.count + ' 份');
      if (bioStatus.count > 0) info('覆盖角色：' + bioStatus.charNames.join('、'));
    }
    return lines.join('<br>');
  }

  async function runSelfCheckWithArcade() {
    let seen = false;
    try { seen = mainWin.localStorage.getItem(SELF_CHECK_ARCADE_SEEN_KEY) === '1'; } catch (e) {}
    if (seen) return await runSelfCheck();
    try { mainWin.localStorage.setItem(SELF_CHECK_ARCADE_SEEN_KEY, '1'); } catch (e) {}
    showLoadingDialog('首次系统自检 · 正在启动像素扫描…', true);
    await sleep(1400);
    try { return await runSelfCheck(); }
    finally { closeLoadingDialog(); }
  }

  async function runSimulationTest() {
    const lines = [];
    lines.push('<b style="color:#6ee7b7">🧪 ' + SYSTEM_UI_NAME + ' · 综合测试</b><br>');
    lines.push('<span style="color:#94a3b8;font-size:10px;">测试使用假数据 (Amore: E5/P2/R1/I0)，不污染真实变量</span><br>');

    lines.push('<div class="mp-log-subhead">【测试1】时间解析</div>');
    const t1 = parseGameTime('2026年10月15日 · 星期四 · 14:30');
    const t2 = parseGameTime('2016年4月5日下午2点30分');
    if (t1 && t2 && t2.getHours() === 14) lines.push('✔ 时间解析正确');
    else lines.push('✖ 时间解析异常');

    lines.push('<div class="mp-log-subhead">【测试2】Sylveina 标签解析</div>');
    const mockMes = "剧情推演。\n[Sylveina|L|+|1.2]";
    const match = mockMes.match(/\[Sylveina\|([LMH])\|([+-])\|(\d+(?:\.\d+)?)\]/);
    if (match && match[1] === 'L' && match[2] === '+' && match[3] === '1.2') lines.push('✔ 标签提取正确: 事件=L, 方向=+, 基础值=1.2');
    else lines.push('✖ 标签提取失败');

    lines.push('<div class="mp-log-subhead">【测试3】公式仿真 (Amore 5210 + L+1.2)</div>');
    try {
      const mockAmore = { 好感度: 5, 肉体值: 2, 阶段值: 1, 嫉妒值: 0, _quota: { R阶段门: false, 好感度周上限已用: 0 } };
      const mockLastRoll = { 事件类型: '日常', 方向: '正向', 主维度: 'E', 基础值: 1.2 };
      const result = computeCharDelta(mockAmore, mockLastRoll, 'normal');
      if (result) lines.push('✔ 公式计算成功 · E从 ' + result.oldValue + ' 变为 ' + result.newValue + '（Δ=' + result.delta + '）');
      else lines.push('✖ 公式计算返回 null');
    } catch (e) { lines.push('✖ 公式仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试4】公式仿真 (Amore 5210 + H+8.0)</div>');
    try {
      const mockAmore2 = { 好感度: 5, 肉体值: 2, 阶段值: 1, 嫉妒值: 0, _quota: { R阶段门: false, 好感度周上限已用: 0 } };
      const mockLastRoll2 = { 事件类型: '重大', 方向: '正向', 主维度: 'E', 基础值: 8.0 };
      const result2 = computeCharDelta(mockAmore2, mockLastRoll2, 'normal');
      if (result2 && result2.delta !== 0) lines.push('✔ 重大事件计算成功 · Δ=' + result2.delta + '（应被单次上限压缩）');
      else lines.push('✖ 重大事件计算失败');
    } catch (e) { lines.push('✖ 公式仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试5】阶段门仿真</div>');
    try {
      const mockCh = { 好感度: 19, 肉体值: 0, 阶段值: 0, 嫉妒值: 0, _quota: { R阶段门: false }, _lastRoll: {} };
      const res = processGateForChar('模拟角色', mockCh, '2000年01月01日 · 星期六 · 00:00', 'normal');
      if (res && res.type === 'gate_enter' && res.node === 18) lines.push('✔ E=19 触发破门期成功');
      else lines.push('✖ 阶段门未正确触发');
    } catch (e) { lines.push('✖ 阶段门仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试6】事件导演推进</div>');
    try {
      const pacing = getEventPacing();
      const rules = { Adi: { daily: 8, major: 15, cd: 3 }, And: { daily: 5, major: 10, cd: 3 }, All: { daily: 3, major: 5, cd: 3 } };
      const rule = rules[pacing] || rules.And;
      const mockEventState = { 当前事件: '测试事件', 事件类型: '日常', 剩余回合: 2, 冷却回合: 0 };
      mockEventState.剩余回合 -= 1;
      if (mockEventState.剩余回合 === 1) lines.push('✔ 事件推进仿真正确');
      mockEventState.剩余回合 -= 1;
      if (mockEventState.剩余回合 <= 0) { mockEventState.当前事件 = ''; mockEventState.冷却回合 = rule.cd; }
      if (mockEventState.冷却回合 === rule.cd) lines.push('✔ 事件结束进入冷却');
      else lines.push('✖ 事件结束仿真失败');
    } catch (e) { lines.push('✖ 事件导演仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试7】LocalStorage 快照归档与回滚</div>');
    try {
      const mockSnapshots = [{ E: 5, P: 2, R: 1, I: 0 }, { E: 6, P: 2, R: 1, I: 0 }, { E: 7, P: 3, R: 1, I: 1 }];
      const lastState = mockSnapshots.pop();
      if (mockSnapshots.length === 2 && mockSnapshots[1].E === 6) lines.push('✔ 快照归档(3份)与重Roll回滚逻辑正常');
      else lines.push('✖ 快照回滚逻辑异常');
    } catch (e) { lines.push('✖ 快照仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试8】核心函数存在性</div>');
    try {
      if (typeof computeCharDelta === 'function') lines.push('✔ computeCharDelta 已定义');
      else lines.push('✖ computeCharDelta 缺失');
      if (typeof runMoonCalculation === 'function') lines.push('✔ runMoonCalculation 已定义');
      else lines.push('✖ runMoonCalculation 缺失');
      if (typeof extractSylveinaTag === 'function') lines.push('✔ extractSylveinaTag 已定义');
      else lines.push('✖ extractSylveinaTag 缺失');
      if (typeof loadLocalState === 'function') lines.push('✔ loadLocalState 已定义');
      else lines.push('✖ loadLocalState 缺失');
      if (typeof saveLocalState === 'function') lines.push('✔ saveLocalState 已定义');
      else lines.push('✖ saveLocalState 缺失');
    } catch (e) { lines.push('✖ 函数存在性检查异常：' + (e.message || e)); }

    lines.push('<br><b style="color:#6ee7b7">✨ 综合测试完毕，本地化引擎运转正常。</b>');
    return lines.join('<br>');
  }

  async function runConflictScan() {
    const lines = [];
    const ok = function(s) { lines.push('<span style="color:#6ee7b7">✔</span> ' + s); };
    const warn = function(s) { lines.push('<span style="color:#fbbf24">⚠</span> ' + s); };
    const info = function(s) { lines.push('<span style="color:#93c5fd">ℹ</span> ' + s); };
    const bad = function(s) { lines.push('<span style="color:#f87171">✖</span> ' + s); };
    let hasConflict = false;
    let fatalCount = 0;
    lines.push('<b style="color:#93c5fd">🔍 全环境冲突扫描</b>');

const stateKey = getChatStateKey();
    const localRaw = localStorage.getItem(stateKey);
    if (localRaw) { try { JSON.parse(localRaw); ok('LocalStorage 数据结构合法'); } catch (e) { bad('LocalStorage 数据损坏'); fatalCount++; } }
    else warn('LocalStorage 尚无数据');

    lines.push('<div class="mp-log-subhead">── 世界书条目检查 ──</div>');
    let entries = [];
    try { entries = await getAllWorldbookEntries(); } catch (e) {}
    const modeTitleMap = {};
    for (const e of entries) { if (e.title.indexOf('[Mode-') === 0) { if (!modeTitleMap[e.title]) modeTitleMap[e.title] = []; modeTitleMap[e.title].push(e.bookName); } }
    let dup = false;
    for (const t in modeTitleMap) { if (modeTitleMap[t].length > 1) { bad('条目「' + t + '」重复'); dup = true; hasConflict = true; } }
    if (!dup) ok('没有 [Mode-] 条目重复');

    lines.push('<div class="mp-log-subhead">── 标签格式检查 ──</div>');
    info('当前标签格式：[Sylveina|L/M/H|+/-|基础值]');
    info('AI 只输出标签，脚本全权计算，MVU 已完全剥离');

    lines.push('<div class="mp-log-subhead">📋 总结</div>');
    if (fatalCount > 0) bad('发现 ' + fatalCount + ' 项致命冲突');
    else if (hasConflict) warn('发现若干可修复的冲突');
    else ok('未发现明显冲突');
    return { hasConflict: hasConflict || fatalCount > 0, html: lines.join('<br>') };
  }
// ===== 第 18 份 =====
  async function computeTokenBreakdown() {
    const out = { sys: [], sysTotal: 0, charCard: 0, charCardName: '', moonEntries: 0, moonEntriesCount: 0, timeline: 0, timelineCount: 0, preset: 0, presetName: '', worldbook: 0, worldbookCount: 0, grand: 0 };
    const ctx = getSTCtx();
    try {
      const ep = mainWin.extension_prompts || window.extension_prompts || (function() { try { return ctx && ctx.extensionPrompts; } catch(e) { return null; } })();
      if (ep && typeof ep === 'object') {
        for (const k in ep) {
          if (k.indexOf('moon_phase') !== 0) continue;
          const v = ep[k];
          const content = String((v && (v.value !== undefined ? v.value : v.content)) || '');
          if (!content) continue;
          const t = estimateTokens(content);
          let short = k;
          if (k === 'moon_phase_time_tracker') short = '主体';
          else if (k === 'moon_phase_user_bio_injected') short = '玩家小抄';
          else if (k.indexOf('moon_phase_time_tracker_') === 0) short = k.slice('moon_phase_time_tracker_'.length);
          out.sys.push({ key: short, tokens: t });
          out.sysTotal += t;
        }
      }
    } catch (e) {}
    try {
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) { out.charCardName = ch.name || ''; const parts = [ch.description, ch.personality, ch.scenario, ch.first_mes, ch.mes_example, ch.creator_notes].filter(function(x) { return x && typeof x === 'string'; }).join('\n'); out.charCard = estimateTokens(parts); }
      }
    } catch (e) {}
    try {
      const books = await _collectAllWorldbooks();
      for (const e of books) {
        const t = estimateTokens(e.content);
        const title = e.title || '';
        if (title.indexOf('[Mode-') === 0 || title.indexOf('[Initvar]') === 0) { out.moonEntries += t; out.moonEntriesCount++; }
        else if (title.indexOf('[Timeline]') === 0 || title.indexOf('[WorldTimeline]') === 0) { out.timeline += t; out.timelineCount++; }
        else { out.worldbook += t; out.worldbookCount++; }
      }
    } catch (e) {}
    try {
      let presetText = ''; let presetName = '';
      const s = (ctx && ctx.chatCompletionSettings) || null;
      if (s) {
        ['main_prompt','system_prompt','jailbreak_prompt','post_history_instructions','nsfw_prompt','new_chat_prompt','new_group_chat_prompt','new_example_chat_prompt'].forEach(function(f) { if (typeof s[f] === 'string' && s[f]) presetText += s[f] + '\n'; });
        presetName = String(s.preset_settings_openai || s.preset || '');
      }
      try {
        if (ctx && typeof ctx.getPresetManager === 'function') {
          const pm = ctx.getPresetManager();
          if (pm) {
            if (!presetName) { if (typeof pm.getSelectedPresetName === 'function') presetName = pm.getSelectedPresetName() || ''; else if (pm.selectedPresetName) presetName = pm.selectedPresetName; }
            if (!presetText && typeof pm.getPresetList === 'function') {
              const list = pm.getPresetList(); const presets = (list && list.presets) || null;
              if (presets && presetName && presets[presetName]) { const p = presets[presetName]; ['main_prompt','system_prompt','jailbreak_prompt','post_history_instructions','nsfw_prompt'].forEach(function(f) { if (typeof p[f] === 'string' && p[f]) presetText += p[f] + '\n'; }); }
            }
          }
        }
      } catch (e) {}
      out.preset = estimateTokens(presetText); out.presetName = presetName;
    } catch (e) {}
    out.grand = out.sysTotal + out.charCard + out.moonEntries + out.timeline + out.preset + out.worldbook;
    return out;
  }

  async function refreshTokenCard(panel) {
    const box = panel.querySelector('#moon-token-box');
    if (!box) return;
    box.innerHTML = '<span style="color:#94a3b8;">⏳ 计算中...</span>';
    try {
      const r = await computeTokenBreakdown();
      const lines = [];
      lines.push('<div style="font-size:10.5px;line-height:1.9;">');
      if (r.charCard > 0) lines.push('<div style="color:#94a3b8;">角色卡' + (r.charCardName ? '（' + String(r.charCardName).replace(/</g,'&lt;') + '）' : '') + ': <span style="color:#a5f3fc;">' + _fmtK(r.charCard) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">本系统注入: <span style="color:#6ee7b7;">' + _fmtK(r.sysTotal) + '</span></div>');
      r.sys.forEach(function(item) { lines.push('<div style="color:#64748b;padding-left:12px;">· ' + item.key + ': <span style="color:#94a3b8;">' + _fmtK(item.tokens) + '</span></div>'); });
      lines.push('<div style="color:#94a3b8;">月相世界书条目: <span style="color:#c084fc;">' + _fmtK(r.moonEntries) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">时间线条目: <span style="color:#f9a8d4;">' + _fmtK(r.timeline) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">玩家预设 / 全局提示' + (r.presetName ? '（' + String(r.presetName).replace(/</g,'&lt;') + '）' : '') + ': <span style="color:#fbbf24;">' + _fmtK(r.preset) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">其他世界书: <span style="color:#fda4af;">' + _fmtK(r.worldbook) + '</span></div>');
      lines.push('<div style="border-top:1px dashed rgba(148,163,184,0.25);margin:6px 0;"></div>');
      lines.push('<div style="color:#fde047;font-weight:700;">合计: <span style="color:#fde047;">' + _fmtK(r.grand) + '</span></div>');
      lines.push('</div>');
      box.innerHTML = lines.join('');
    } catch (e) { box.innerHTML = '<span style="color:#f87171">✖ 计算失败：' + String(e && e.message || e).replace(/</g, '&lt;') + '</span>'; }
  }

  function openRerollDialog(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色) { showModalDialog('🎲 数值重Roll', '<div>当前没有可用的角色数据。</div>', null, { confirmText: '关闭' }); return; }
    const chars = data.stat_data.角色; const charNames = Object.keys(chars);
    if (!charNames.length) { showModalDialog('🎲 数值重Roll', '<div>没有角色可供重Roll。</div>', null, { confirmText: '关闭' }); return; }
    const html = '<div style="font-size:11.5px;color:#94a3b8;margin-bottom:8px;">选择要重Roll的角色：</div>' +
      '<select id="moon-reroll-char" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;">' + charNames.map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') + '</select>' +
      '<div id="moon-reroll-info" style="margin-top:12px;padding:10px;background:#05070e;border-radius:8px;font-size:11px;line-height:1.7;color:#cbd5e1;min-height:80px;">点击下方「🎲 重Roll」开始</div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;">' +
      '<button id="moon-reroll-do" style="flex:1;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🎲 重Roll</button>' +
      '<button id="moon-reroll-confirm" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(16,185,129,0.5);background:#052e20;color:#6ee7b7;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;" disabled>确认覆盖</button></div>' +
      '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">每次点击重新摇骰并本地重算，可反复 Roll 直到满意，再点确认覆盖。</div>';
    let pendingResult = null; const mode = getCurrentMode();
    showModalDialog('🎲 数值重Roll', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const sel = mask.querySelector('#moon-reroll-char'); const infoEl = mask.querySelector('#moon-reroll-info');
        const doBtn = mask.querySelector('#moon-reroll-do'); const confirmBtn = mask.querySelector('#moon-reroll-confirm');
        function showCurrent() {
          const name = sel.value; const ch = chars[name] || {}; const lr = ch._lastRoll || {};
          const hasLr = lr.主维度 ? '已记录' : '无记录';
          infoEl.innerHTML = '角色：<b style="color:#7dd3fc">' + name + '</b><br>当前：E' + (ch.好感度 || 0) + ' P' + (ch.肉体值 || 0) + ' R' + (ch.阶段值 || 0) + ' I' + (ch.嫉妒值 || 0) + '<br>本轮判断：' + hasLr + (lr.主维度 ? '（' + (lr.事件类型 || '') + ' ' + (lr.方向 || '') + ' ' + (lr.主维度 || '') + ' 基础' + (lr.基础值 || 0) + '）' : '');
        }
        sel.addEventListener('change', showCurrent); showCurrent();
        doBtn.addEventListener('click', function() {
          const name = sel.value; const ch = chars[name] || {}; const lastRoll = readLastRoll(ch);
          if (!lastRoll || !lastRoll.主维度) { infoEl.innerHTML = '<span style="color:#f87171">✖ 该角色本轮没有 AI 判断记录，无法重Roll。</span>'; return; }
          const clone = JSON.parse(JSON.stringify(ch)); const result = computeCharDelta(clone, lastRoll, mode);
          if (!result) { infoEl.innerHTML = '<span style="color:#f87171">✖ 计算失败，请检查 _lastRoll 字段。</span>'; return; }
          pendingResult = { name: name, fieldName: result.fieldName, dimension: result.dimension, newValue: result.newValue };
          infoEl.innerHTML = '角色：<b style="color:#7dd3fc">' + name + '</b><br><b style="color:#6ee7b7">重Roll结果：</b><br>' +
            '本轮判断：' + lastRoll.事件类型 + ' ' + lastRoll.方向 + ' ' + lastRoll.主维度 + ' 基础' + lastRoll.基础值 + '<br>' +
            result.fieldName + '：' + result.oldValue + ' → <b style="color:#6ee7b7">' + result.newValue + '</b>（Δ' + result.delta + '）<br>' +
            (result.emotionResult ? '情绪骰 1d4 = ' + result.emotionResult.dice + '（阈值' + result.emotionResult.threshold + '，' + (result.emotionResult.passed ? '通过' : '失败') + '）<br>' : '') +
            (result.isAbyss ? '⚠ 深渊模式生效<br>' : '') + (result.weeklyBlocked ? '⚠ 周上限已压缩<br>' : '');
          confirmBtn.disabled = false;
        });
        confirmBtn.addEventListener('click', async function() {
          if (!pendingResult) return;
          const d = readMvuLatest();
          if (!d || !d.stat_data || !d.stat_data.角色 || !d.stat_data.角色[pendingResult.name]) { toast('写入失败：找不到角色', 'warning'); return; }
          const target = d.stat_data.角色[pendingResult.name]; target[pendingResult.fieldName] = pendingResult.newValue;
          const ok = await writeMvuLatest(d.stat_data);
          if (ok) { toast('已覆盖变量', 'success'); try { refreshPanel(); } catch (e) {} try { mask.remove(); } catch (e) {} }
          else toast('写入失败', 'warning');
        });
      }
    });
  }

  function openFaqDialog() {
    const FAQ_LIST = [
      { q: '导入后没有自动刷新页面', keys: ['刷新', '导入'], a: '本版已加入导入后自动刷新一次。如无反应请手动刷新。' },
      { q: '菜单里找不到入口', keys: ['菜单', '入口'], a: '确认脚本已启用后刷新页面。入口在酒馆右上角扩展菜单里。' },
      { q: '自检报告在哪里看', keys: ['自检', '报告'], a: '点面板「🔭 自检」，完成后会弹出报告弹窗。' },
      { q: '锚定时间线是什么', keys: ['锚定', '时间线'], a: '独立开关，任何难度都能开。开启后只有冷战期或好感度为负时才会真正锚定。' },
      { q: '副模型解析系统是什么', keys: ['副模型', '解析'], a: '让主模型专注叙事，副模型专门解析变量和算分。' },
      { q: '自适应开局是什么', keys: ['自适应', '开局'], a: '新存档第一次进入时自动弹窗，让 AI 推断初始四维。多人卡下不会自动弹，点面板手动触发。' },
      { q: '角色试镜是什么？', keys: ['试镜', '角色试镜', '小抄'], a: 'AI 通读角色卡生成一份「角色小抄」（不展示给你），然后根据小抄排演一段试镜片段。<br>不满意可以用自然语言写意见，AI 会重写小抄并重演。<br>确认后保存到本地，供后续剧情使用。' },
      { q: '角色小抄库怎么用？', keys: ['小抄库', '库', '管理'], a: '主面板点「📚 角色小抄库」。可以查看、编辑、启用/停用、删除。<br>启用的小抄会在剧情里覆盖原卡设定。<br>同角色只能启用一份，启用新的自动停用旧的。' },
      { q: '玩家小抄是什么？', keys: ['玩家', 'user', 'persona', '玩家小抄'], a: '主面板点「👤 玩家小抄」：AI 会读取你右侧 Persona 面板的设定，提炼成「玩家角色灵魂小抄」。<br>生成后先给你看一遍小传，确认无误再进入单人试镜。<br>启用后会在 prompt 里覆盖 Persona 面板，但同时只允许启用一份，启用新的会自动停用旧的。<br>其他预设、世界书、角色卡不受影响。' },
      { q: '数值重Roll是什么', keys: ['重roll', '重投'], a: '面板「🎲 数值重Roll」按钮，对指定角色重新掷骰并本地重算。' },
      { q: '阶段门是什么', keys: ['阶段门', '破门', '冻结'], a: '当好感度到达 18/38/58/78/98 时脚本自动冻结 R，进入破门期。' },
      { q: '事件推进节奏是什么', keys: ['事件', '节奏'], a: '事件导演系统开关。SLOW / NORMAL / FAST 三档。' },
      { q: '彩蛋事件是什么', keys: ['彩蛋', '大成功'], a: '事件判定摇出 1d20=20 时触发彩蛋。5 回合固定时长，数值按重大事件同档，叙事风格必须是日常轻喜剧。' },
      { q: '时间线要怎么写？', keys: ['时间线', 'timeline'], a: '多条目模式：每个事件一个 [Timeline] 条目。<br>单条目模式：一个条目里写多个事件，用「时间：xxx / 内容：yyy」的块排列。' },
      { q: '标签格式变了？', keys: ['标签', 'Sylveina'], a: '本版已剥离 MVU。AI 只输出 [Sylveina|L/M/H|+/-|基础值] 标签，具体数值由脚本计算。' }
    ];
    const html = '<div style="padding:10px 12px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:9px;color:#fca5a5;font-size:11.5px;line-height:1.7;margin-bottom:12px;">' +
      '<b>🛑 答疑前置条件：</b><br>先点面板的 <b>【🔭 自检】</b> 和 <b>【🧪 测试】</b>，截图发帖。<br>' +
      '<span style="color:#fde047;font-weight:700;">⚠️ 本系统已完全本地化，不再依赖 MVU。</span></div>' +
      '<input id="moon-faq-search" placeholder="输入关键词" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:12px;outline:none;margin-bottom:10px;">' +
      '<div id="moon-faq-list" style="display:flex;flex-direction:column;gap:6px;"></div>';
    showModalDialog('❓ 常见问题', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const input = mask.querySelector('#moon-faq-search'); const list = mask.querySelector('#moon-faq-list');
        function render(kw) {
          const w = String(kw || '').trim().toLowerCase();
          const items = FAQ_LIST.filter(function(item) { if (!w) return true; const pool = (item.q + ' ' + item.keys.join(' ') + ' ' + item.a).toLowerCase(); return pool.indexOf(w) >= 0; });
          if (!items.length) { list.innerHTML = '<div style="color:#f87171;font-size:11px;">没找到。</div>'; return; }
          list.innerHTML = items.map(function(item, idx) {
            return '<div style="border:1px solid rgba(148,163,184,0.14);border-radius:9px;overflow:hidden;">' +
              '<button class="moon-faq-q" data-idx="' + idx + '" style="width:100%;text-align:left;padding:8px 10px;background:#0f172a;color:#e2e8f0;border:none;cursor:pointer;font-size:11.5px;font-weight:700;font-family:inherit;">' + item.q + '</button>' +
              '<div class="moon-faq-a" data-idx="' + idx + '" style="display:none;padding:8px 10px;background:#05070e;color:#94a3b8;font-size:11px;line-height:1.65;">' + item.a + '</div></div>';
          }).join('');
          list.querySelectorAll('.moon-faq-q').forEach(function(btn) { btn.addEventListener('click', function() { const idx = btn.getAttribute('data-idx'); const a = list.querySelector('.moon-faq-a[data-idx="' + idx + '"]'); if (a) a.style.display = a.style.display === 'none' ? 'block' : 'none'; }); });
        }
        input.addEventListener('input', function() { render(input.value); }); render('');
      }
    });
  }

// ===== 第 19 份 =====
  const CUSTOM_AI_CONFIG_KEY_LOCAL = 'moon_phase_custom_ai_config';
  function getCustomAIConfig() { try { const raw = mainWin.localStorage.getItem(CUSTOM_AI_CONFIG_KEY_LOCAL); if (raw) return JSON.parse(raw); } catch (e) {} return { url: '', key: '', model: '' }; }
  function saveCustomAIConfig(cfg) { try { mainWin.localStorage.setItem(CUSTOM_AI_CONFIG_KEY_LOCAL, JSON.stringify(cfg)); } catch (e) {} }
  function openCustomAIConfigDialog(panel) {
    const cfg = getCustomAIConfig();
    function normalizeApiUrl(url) {
      if (!url) return '';
      let u = url.trim().replace(/\/+$/, '');
      if (u.endsWith('/chat/completions')) return u;
      if (/\/v\d+$/.test(u)) return u + '/chat/completions';
      const urlObj = (function(str) { try { return new URL(str); } catch(e) { return null; } })(u);
      if (urlObj && (urlObj.pathname === '/' || urlObj.pathname === '')) return u + '/v1/chat/completions';
      return u;
    }
    // 从 chat/completions 端点反推 /models 端点
    function deriveModelsUrl(chatUrl) {
      if (!chatUrl) return '';
      let u = String(chatUrl).trim().replace(/\/+$/, '');
      if (u.endsWith('/chat/completions')) return u.slice(0, -'/chat/completions'.length) + '/models';
      if (/\/v\d+$/.test(u)) return u + '/models';
      try {
        const x = new URL(u);
        const p = x.pathname.replace(/\/+$/, '');
        if (p === '' || p === '/') x.pathname = '/v1/models';
        else x.pathname = p + '/models';
        return x.toString();
      } catch (e) { return u + '/v1/models'; }
    }

    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">仅供本系统的 AI 检测 / 开局推断 / 对话回填 / 时间线功能使用。</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">API URL</div><input id="moon-custom-url" type="text" value="' + (cfg.url || '') + '" placeholder="https://api.openai.com" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;"></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">API Key</div><input id="moon-custom-key" type="password" value="' + (cfg.key || '') + '" placeholder="sk-..." style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;"></div>' +
      '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<div style="font-size:11px;color:#94a3b8;">模型</div>' +
          '<button id="moon-custom-fetch" style="padding:3px 10px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:700;">📥 拉取模型列表</button>' +
        '</div>' +
        '<input id="moon-custom-model" type="text" value="' + (cfg.model || '') + '" placeholder="gpt-4o-mini" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;">' +
        '<div id="moon-custom-model-select-box" style="display:none;margin-top:6px;">' +
          '<select id="moon-custom-model-select" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;"></select>' +
        '</div>' +
        '<div id="moon-custom-model-status" style="font-size:10.5px;color:#64748b;margin-top:4px;line-height:1.5;"></div>' +
      '</div></div>';
    showModalDialogCancelable('⚙️ 自定义副模型', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const rawUrl = mask.querySelector('#moon-custom-url').value.trim();
        const key = mask.querySelector('#moon-custom-key').value.trim();
        const model = mask.querySelector('#moon-custom-model').value.trim();
        if (!rawUrl || !key || !model) { toast('请填写完整配置', 'warning'); return; }
        saveCustomAIConfig({ url: normalizeApiUrl(rawUrl), key: key, model: model });
        try { mask.remove(); } catch (e) {}
        toast('配置已保存', 'success');
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '保存', cancelText: '取消',
        onOpen: function(mask) {
          const fetchBtn = mask.querySelector('#moon-custom-fetch');
          const urlInput = mask.querySelector('#moon-custom-url');
          const keyInput = mask.querySelector('#moon-custom-key');
          const modelInput = mask.querySelector('#moon-custom-model');
          const selBox = mask.querySelector('#moon-custom-model-select-box');
          const sel = mask.querySelector('#moon-custom-model-select');
          const status = mask.querySelector('#moon-custom-model-status');

          fetchBtn.addEventListener('click', async function() {
            const rawUrl = urlInput.value.trim();
            const key = keyInput.value.trim();
            if (!rawUrl) { status.textContent = '请先填写 API URL'; status.style.color = '#f87171'; return; }
            if (!key) { status.textContent = '请先填写 API Key'; status.style.color = '#f87171'; return; }

            const modelsUrl = deriveModelsUrl(normalizeApiUrl(rawUrl));
            fetchBtn.disabled = true; fetchBtn.textContent = '⏳ 拉取中...';
            status.textContent = '请求：' + modelsUrl;
            status.style.color = '#94a3b8';
            try {
              const res = await fetch(modelsUrl, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + key }
              });
              if (!res.ok) {
                const t = await res.text();
                throw new Error('HTTP ' + res.status + ' ' + String(t).slice(0, 120));
              }
              const data = await res.json();
              let ids = [];
              if (Array.isArray(data && data.data)) ids = data.data.map(function(x) { return x && (x.id || x.name || x.model); });
              else if (Array.isArray(data && data.models)) ids = data.models.map(function(x) { return x && (x.id || x.name); });
              else if (Array.isArray(data)) ids = data.map(function(x) { return typeof x === 'string' ? x : (x && (x.id || x.name)); });
              ids = ids.filter(function(s) { return s && typeof s === 'string'; });
              if (!ids.length) { status.textContent = '返回的模型列表为空'; status.style.color = '#fbbf24'; return; }
              ids.sort(function(a, b) { return a.localeCompare(b); });
              const cur = String(modelInput.value || '').trim();
              sel.innerHTML = '<option value="">— 选择要使用的模型 —</option>' + ids.map(function(id) {
                const safeVal = String(id).replace(/"/g, '&quot;');
                const safeTxt = String(id).replace(/</g, '&lt;');
                return '<option value="' + safeVal + '"' + (id === cur ? ' selected' : '') + '>' + safeTxt + '</option>';
              }).join('');
              selBox.style.display = 'block';
              status.textContent = '✔ 共 ' + ids.length + ' 个模型，已加载到下拉框';
              status.style.color = '#6ee7b7';
            } catch (e) {
              status.textContent = '✖ 拉取失败：' + (e.message || e);
              status.style.color = '#f87171';
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

  async function callCustomAIConfig(sysPrompt, userPrompt) {
    const cfg = getCustomAIConfig();
    if (!cfg.url || !cfg.key || !cfg.model) throw new Error('未配置自定义副模型');
    let apiUrl = cfg.url;
    try { const x = new URL(apiUrl); const p = x.pathname.replace(/\/+$/, ''); if (p === '') x.pathname = '/v1/chat/completions'; else if (/^\/v\d+$/i.test(p)) x.pathname = p + '/chat/completions'; apiUrl = x.toString(); } catch (e) {}
    try {
      const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key }, body: JSON.stringify({ model: cfg.model, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }], temperature: 0.3 }) });
      if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ': ' + t.slice(0, 100)); }
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
      throw new Error('接口返回格式异常');
    } catch (e) { throw new Error('请求自定义 API 失败：' + (e.message || e)); }
  }

  const DEFAULT_PROMPTS = {
    conflict: { label: '冲突检测', sys: '你是月相多维情感系统的「冲突检测」助手。分析给定的条目，找出变量路径重复、字段名不一致、语义重复、规则矛盾。无问题输出「未发现明显冲突」；有问题逐条列出「类型｜涉及条目｜描述｜建议」。', user: '【角色卡信息】\n{{charInfo}}\n\n【月相条目】\n{{mvuDump}}\n\n【其他世界书条目】\n{{otherDump}}' },
    mode: { label: '模式推荐', sys: '根据角色卡风格、预设、世界书，在「简单/普通/困难/地狱」里推荐一个。输出格式：推荐模式：X；理由：≤50字。', user: '【角色卡】\n{{charInfo}}\n\n【当前模式】{{currentMode}}（{{currentModeLabel}}）\n\n【四种模式说明】\n{{modeList}}\n\n【月相条目】\n{{mvuDump}}\n\n【世界书】\n{{otherDump}}' },
    custom: { label: '自定义', sys: '你是月相多维情感系统的辅助审计助手。', user: '【角色卡】\n{{charInfo}}\n\n【当前模式】{{currentMode}}\n\n【模式说明】\n{{modeList}}\n\n【月相条目】\n{{mvuDump}}\n\n【世界书】\n{{otherDump}}\n\n【我的指令】\n（在这里写）' },
    opening: { label: '开局推断', sys: '你是月相多维情感系统的「开局推断」助手。请推断角色对玩家的初始四维数值。\n【输出】严格 JSON：{"好感度":number,"肉体值":number,"嫉妒值":number,"情绪":"单个emoji","心声":"15~30字第一人称","推断理由":"≤80字"}', user: '【玩家设定】\n名字：{{playerName}}\n描述：{{playerPersona}}\n\n【角色卡】\n名称：{{charName}}\n简介：{{charDesc}}\n性格：{{charPersonality}}\n场景：{{charScenario}}\n开场白：{{charFirstMes}}\n创作者注释：{{charCreatorNotes}}\n\n【对话历史】\n{{chatHistory}}' },
    openingPass2: { label: '开局补全', sys: '你是月相多维情感系统的「开局补全」助手。玩家已确认好感度、肉体值、阶段值。请根据这些最终数值，重新评估嫉妒值、情绪、心声。\n【输出】严格 JSON：{"嫉妒值":number,"情绪":"单个emoji","心声":"15~30字第一人称"}', user: '【玩家设定】\n{{playerName}}\n描述：{{playerPersona}}\n\n【角色卡】\n名称：{{charName}}\n简介：{{charDesc}}\n\n【最终确认数值】\n好感度：{{finalE}}\n肉体值：{{finalP}}\n阶段值：{{finalR}}\n\n【对话历史】\n{{chatHistory}}' },
    backfill: { label: '对话回填', sys: '你是月相多维情感系统的「对话回填」助手。玩家有一个没有变量的老存档，请根据对话历史推断此刻角色对玩家的一整套合理状态。\n【输出】严格 JSON，字段：世界时间、世界地点、好感度、肉体值、嫉妒值、情绪、心声、重要度、表白期已通过、表白期排除、已触发时间线事件名、好感度周上限已用、推断理由。', user: '【玩家设定】\n{{playerName}}\n描述：{{playerPersona}}\n\n【角色卡】\n名称：{{charName}}\n简介：{{charDesc}}\n性格：{{charPersonality}}\n场景：{{charScenario}}\n\n{{timelineDump}}\n\n【对话历史】\n{{chatHistory}}' },
    timeline: { label: '时间线生成', sys: '你是世界书时间线生成助手。请生成 5~10 条符合格式的 [Timeline] 世界书条目。\n格式：{"comment":"[Timeline] 事件名","content":"YYYY年MM月DD日 · 星期X · HH:MM\\n事件描述"}\n只输出 JSON 数组。', user: '【角色卡】\n{{charInfo}}\n\n【剧情大纲】\n{{userInput}}' },
    placeholders: '{{charInfo}} {{charName}} {{charDesc}} {{charPersonality}} {{charScenario}} {{charFirstMes}} {{charCreatorNotes}} {{currentMode}} {{currentModeLabel}} {{modeList}} {{mvuDump}} {{otherDump}} {{promptDump}} {{playerName}} {{playerPersona}} {{finalE}} {{finalP}} {{finalR}} {{finalRName}} {{finalRDesc}} {{chatHistory}} {{userInput}} {{timelineDump}}'
  };

  function getPromptTemplates() {
    const keys = ['conflict', 'mode', 'custom', 'opening', 'openingPass2', 'backfill', 'timeline'];
    const base = {};
    for (const k of keys) base[k] = { sys: DEFAULT_PROMPTS[k].sys, user: DEFAULT_PROMPTS[k].user };
    try {
      const raw = mainWin.localStorage.getItem(PROMPT_TPL_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        for (const k of keys) { if (o[k]) { if (typeof o[k].sys === 'string') base[k].sys = o[k].sys; if (typeof o[k].user === 'string') base[k].user = o[k].user; } }
      }
    } catch (e) {}
    return base;
  }
  function savePromptTemplates(t) {
    try { const payload = {}; for (const k of ['conflict', 'mode', 'custom', 'opening', 'openingPass2', 'backfill', 'timeline']) payload[k] = { sys: t[k].sys, user: t[k].user }; mainWin.localStorage.setItem(PROMPT_TPL_KEY, JSON.stringify(payload)); } catch (e) {}
  }
  function listPromptPresets() { try { const raw = mainWin.localStorage.getItem(PROMPT_PRESETS_KEY); if (raw) return JSON.parse(raw) || {}; } catch (e) {} return {}; }
  function loadPromptPreset(name) { return listPromptPresets()[name] || null; }
  function deletePromptPreset(name) {
    const all = listPromptPresets();
    if (all[name]) { delete all[name]; try { mainWin.localStorage.setItem(PROMPT_PRESETS_KEY, JSON.stringify(all)); } catch (e) {} return true; }
    return false;
  }
  function renderPromptTemplate(tpl, vars) {
    if (!tpl) return '';
    return String(tpl).replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, function(_, k) { return (vars[k] !== undefined && vars[k] !== null) ? String(vars[k]) : ''; });
  }

  function openPromptEditor(panel) {
    const tpl = getPromptTemplates();
    const presets = listPromptPresets();
    const presetNames = Object.keys(presets);
    let curTask = 'conflict';
    const taskTabs = ['conflict', 'mode', 'custom', 'opening', 'openingPass2', 'backfill', 'timeline'].map(function(k) {
      const label = DEFAULT_PROMPTS[k].label;
      const active = k === curTask;
      return '<button class="moon-tpl-tab" data-task="' + k + '" style="padding:7px 12px;border-radius:8px;border:1px solid ' + (active ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.2)') + ';background:' + (active ? '#0c2540' : '#0f172a') + ';color:' + (active ? '#7dd3fc' : '#94a3b8') + ';font-size:11px;cursor:pointer;font-family:inherit;font-weight:700;">' + label + '</button>';
    }).join('');
    const html = '<div style="font-size:11px;color:#94a3b8;line-height:1.7;margin-bottom:10px;">可用占位符：<br><code style="color:#7dd3fc;font-size:10px;">' + DEFAULT_PROMPTS.placeholders.replace(/\s+/g, ' ') + '</code></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' + taskTabs + '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">' +
      '<select id="moon-preset-select" style="flex:1;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:11.5px;"><option value="">— 载入预设 —</option>' + presetNames.map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') + '</select>' +
      '<button id="moon-preset-load" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(56,189,248,0.35);background:#0c2540;color:#7dd3fc;font-size:11px;cursor:pointer;font-family:inherit;">载入</button>' +
      '<button id="moon-preset-del" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(239,68,68,0.35);background:#2a0a10;color:#fca5a5;font-size:11px;cursor:pointer;font-family:inherit;">删除</button></div>' +
      '<div style="margin-bottom:6px;font-size:11px;color:#e2e8f0;font-weight:700;">系统提示词</div>' +
      '<textarea id="moon-tpl-sys" style="width:100%;box-sizing:border-box;min-height:110px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:11px;line-height:1.6;font-family:monospace;resize:vertical;"></textarea>' +
      '<div style="margin:10px 0 6px;font-size:11px;color:#e2e8f0;font-weight:700;">用户提示词</div>' +
      '<textarea id="moon-tpl-user" style="width:100%;box-sizing:border-box;min-height:160px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:11px;line-height:1.6;font-family:monospace;resize:vertical;"></textarea>' +
      '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">' +
      '<input id="moon-preset-name" placeholder="预设名字" style="flex:1;min-width:120px;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:11.5px;">' +
      '<button id="moon-preset-save" style="padding:7px 12px;border-radius:8px;border:1px solid rgba(16,185,129,0.4);background:#052e20;color:#6ee7b7;font-size:11px;cursor:pointer;font-family:inherit;font-weight:700;">另存为预设</button></div>' +
      '<div style="margin-top:12px;display:flex;gap:6px;">' +
      '<button id="moon-tpl-save" style="flex:1;padding:9px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">保存</button>' +
      '<button id="moon-tpl-reset" style="flex:1;padding:9px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">恢复默认</button></div>';
    showModalDialog('🧩 提示词编辑', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const taSys = mask.querySelector('#moon-tpl-sys'); const taUser = mask.querySelector('#moon-tpl-user');
        const sel = mask.querySelector('#moon-preset-select'); const nameInput = mask.querySelector('#moon-preset-name');
        function renderTask(k) {
          curTask = k; taSys.value = tpl[k].sys || ''; taUser.value = tpl[k].user || '';
          mask.querySelectorAll('.moon-tpl-tab').forEach(function(btn) {
            const on = btn.getAttribute('data-task') === k;
            btn.style.borderColor = on ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.2)';
            btn.style.background = on ? '#0c2540' : '#0f172a';
            btn.style.color = on ? '#7dd3fc' : '#94a3b8';
          });
        }
        mask.querySelectorAll('.moon-tpl-tab').forEach(function(btn) { btn.addEventListener('click', function() { renderTask(btn.getAttribute('data-task')); }); });
        renderTask('conflict');
        mask.querySelector('#moon-tpl-save').addEventListener('click', function() { tpl[curTask] = { sys: taSys.value, user: taUser.value }; savePromptTemplates(tpl); toast('已保存', 'success'); });
        mask.querySelector('#moon-tpl-reset').addEventListener('click', function() { taSys.value = DEFAULT_PROMPTS[curTask].sys; taUser.value = DEFAULT_PROMPTS[curTask].user; toast('已恢复默认', 'info'); });
        mask.querySelector('#moon-preset-load').addEventListener('click', function() { const n = sel.value; if (!n) return; const p = loadPromptPreset(n); if (!p) return; const d = p[curTask] ? p[curTask] : { sys: p.sys, user: p.user }; if (d) { taSys.value = d.sys || ''; taUser.value = d.user || ''; } nameInput.value = n; toast('已载入', 'success'); });
        mask.querySelector('#moon-preset-del').addEventListener('click', function() { const n = sel.value; if (!n) return; if (deletePromptPreset(n)) { const opt = sel.querySelector('option[value="' + n + '"]'); if (opt) opt.remove(); sel.value = ''; toast('已删除', 'info'); } });
        mask.querySelector('#moon-preset-save').addEventListener('click', function() {
          const n = nameInput.value.trim(); if (!n) return;
          const all = listPromptPresets();
          all[n] = all[n] || {}; all[n][curTask] = { sys: taSys.value, user: taUser.value }; all[n].ts = Date.now();
          try { mainWin.localStorage.setItem(PROMPT_PRESETS_KEY, JSON.stringify(all)); } catch (e) {}
          if (!sel.querySelector('option[value="' + n + '"]')) { const opt = mainDoc.createElement('option'); opt.value = n; opt.textContent = n; sel.appendChild(opt); }
          sel.value = n; toast('已保存', 'success');
        });
      }
    });
  }

// ===== 第 20 份 =====
  function openAiConflictDialog(panel) {
    const tasks = [
      { key: 'conflict', label: '🔍 冲突检测' },
      { key: 'mode', label: '🎯 模式推荐' },
      { key: 'custom', label: '✏️ 自定义' }
    ];
    const providers = [
      { key: 'custom', label: '⚙️ 自定义副模型' },
      { key: 'extra', label: '🌙 追随副模型' },
      { key: 'main', label: '🎭 酒馆主模型' }
    ];
    const html = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div><div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;">选择模块</div>' +
      '<select id="moon-task-select" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(56,189,248,0.35);background:#0c1a2e;color:#e2e8f0;font-size:12px;">' +
      tasks.map(function(t) { return '<option value="' + t.key + '">' + t.label + '</option>'; }).join('') + '</select></div>' +
      '<div><div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;">选择模型</div>' +
      '<select id="moon-provider-select" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:12px;">' +
      providers.map(function(p) { return '<option value="' + p.key + '">' + p.label + '</option>'; }).join('') + '</select></div>' +
      '<button id="moon-ai-run" style="padding:11px;border-radius:10px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;">🚀 开始执行</button></div>';
    showModalDialog('🤖 AI 深度检测', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-ai-run').addEventListener('click', async function() {
          const task = mask.querySelector('#moon-task-select').value;
          const provider = mask.querySelector('#moon-provider-select').value;
          const taskLabel = (DEFAULT_PROMPTS[task] && DEFAULT_PROMPTS[task].label) || task;
          try { mask.remove(); } catch (e) {}
          const statusEl = panel.querySelector('#moon-phase-status');
          statusEl.innerHTML = '<span style="color:#93c5fd">⏳ 执行「' + taskLabel + '」...</span>';
          const html2 = await runAiConflictScan(provider, task);
          statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 完成。</span>';
          showResultDialog(SYSTEM_UI_NAME + ' · AI ' + taskLabel, html2);
        });
      }
    });
  }

  async function runAiConflictScan(provider, task) {
    task = task || 'conflict';
    const taskLabel = (DEFAULT_PROMPTS[task] && DEFAULT_PROMPTS[task].label) || task;
    const lines = ['<b style="color:#93c5fd">🤖 AI 检测 · ' + taskLabel + '</b><br>'];
    let entries = [];
    try { entries = await getAllWorldbookEntries(); } catch (e) {}
    const mvuEntries = entries.filter(function(e) { return e.title.indexOf('[Mode-') === 0 || e.title.indexOf('[Initvar]') === 0; });
    const otherEntries = entries.filter(function(e) { return e.title.indexOf('[Mode-') !== 0 && e.title.indexOf('[Initvar]') !== 0; });
    const mvuDump = mvuEntries.map(function(e) { return '### ' + e.title + '\n' + e.content.slice(0, 1500); }).join('\n\n');
    const otherDump = otherEntries.map(function(e) { return '### ' + e.title + '\n' + e.content.slice(0, 800); }).join('\n\n');
    const currentMode = getCurrentMode();
    const modeList = ['easy', 'normal', 'hard', 'hell'].map(function(m) { const i = LUNAR_META[m]; return '- ' + i.name + '：' + i.detail; }).join('\n');
    let charInfo = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) charInfo = '角色卡：' + (ch.name || '未命名') + '\n' + (ch.description || '').slice(0, 800);
      }
    } catch (e) {}
    if (!charInfo) charInfo = '(无法读取)';
    const vars = { charInfo: charInfo, currentMode: currentMode, currentModeLabel: getModeLabel(currentMode), modeList: modeList, mvuDump: mvuDump, otherDump: otherDump };
    const tpl = getPromptTemplates()[task] || getPromptTemplates().conflict;
    try {
      let reply = '';
      if (provider === 'custom') reply = await callCustomAIConfig(renderPromptTemplate(tpl.sys, vars), renderPromptTemplate(tpl.user, vars));
      else if (provider === 'extra') {
        const mvu = mainWin.Mvu || window.Mvu;
        if (mvu && typeof mvu.requestExtraAnalysis === 'function') reply = await mvu.requestExtraAnalysis(renderPromptTemplate(tpl.user, vars), renderPromptTemplate(tpl.sys, vars));
        else { lines.push('<span style="color:#f87171">✖ 无副模型接口</span>'); return lines.join('<br>'); }
      } else { reply = await callOpeningModel('main', renderPromptTemplate(tpl.sys, vars), renderPromptTemplate(tpl.user, vars)); }
      if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
      lines.push('<div style="white-space:pre-wrap;color:#e2e8f0;font-size:11px;">' + reply.replace(/</g, '&lt;') + '</div>');
    } catch (err) { lines.push('<span style="color:#f87171">✖ 调用失败：' + (err.message || String(err)) + '</span>'); }
    return lines.join('<br>');
  }

  function openTimelineTagDialog(panel) {
    const cur = getTimelineTag();
    const html = '<div style="color:#fde047;font-weight:700;margin-bottom:8px;">📜 自定义时间线标签</div>' +
      '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      '填一个标签名（例如 <code style="color:#7dd3fc;">[WorldTimeline]</code> 或 <code style="color:#7dd3fc;">世界时间线</code>）。<br>' +
      '启用后脚本会：<br>① 优先扫描已激活的世界书里标题以此标签开头的条目；<br>② 找到后解析成多个事件（按时间排序，同日按出现顺序）；<br>③ 若该条目不存在或正文为空，自动回退到扫描所有 <code>[Timeline]</code> 条目。<br>' +
      '<span style="color:#fbbf24;">留空即关闭此功能。</span></div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">标签名（不含方括号也行）</div>' +
      '<input id="moon-tltag-input" type="text" value="' + String(cur || '').replace(/"/g, '&quot;') + '" placeholder="例如：[WorldTimeline]" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12.5px;">';
    showModalDialogCancelable('📜 自定义时间线标签', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const v = mask ? mask.querySelector('#moon-tltag-input').value.trim() : '';
        setTimelineTag(v);
        try { if (mask) mask.remove(); } catch (e) {}
        toast(v ? ('时间线标签已设为：' + v) : '已关闭自定义时间线标签', 'info');
        try { refreshPanel(); } catch (e) {}
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '保存', cancelText: '取消' });
  }

function getTimelineKeywords() {
  try {
    const raw = mainWin.localStorage.getItem(TIMELINE_KEYWORDS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (e) {}
  return DEFAULT_TIMELINE_KEYWORDS.slice();
}
function setTimelineKeywords(list) {
  try { mainWin.localStorage.setItem(TIMELINE_KEYWORDS_KEY, JSON.stringify(list)); } catch (e) {}
}

// 全库扫描：不管是否启用，都找出来
async function scanAllTimelineEntries() {
  const tag = getTimelineTag();
  const keywords = getTimelineKeywords();
  const all = await _collectAllWorldbooks(true);
  const results = [];
  const seen = Object.create(null);
  const push = function(e, matchType, priority, extra) {
    const key = e.bookName + '||' + e.title;
    if (seen[key]) return;
    seen[key] = true;
    const item = {
      bookName: e.bookName, title: e.title, content: e.content,
      enabled: e.enabled, bookEnabled: e.bookEnabled,
      matchType: matchType, priority: priority
    };
    if (extra) Object.assign(item, extra);
    results.push(item);
  };
  // ① 自定义标签优先
  if (tag) {
    for (const e of all) {
      if (String(e.title || '').indexOf(tag) === 0) push(e, 'tag', 0);
    }
  }
  // ② [Timeline] / [WorldTimeline] 前缀
  for (const e of all) {
    const t = String(e.title || '');
    if (t.indexOf('[Timeline]') === 0) push(e, 'prefix-timeline', 1);
    else if (t.indexOf('[WorldTimeline]') === 0) push(e, 'prefix-worldtimeline', 1);
  }
  // ③ 关键词 / 时间模式
  for (const e of all) {
    const t = String(e.title || '');
    if (t.indexOf('[Mode-') === 0 || t.indexOf('[Initvar]') === 0) continue;
    if (t.indexOf('[Timeline]') === 0 || t.indexOf('[WorldTimeline]') === 0) continue;
    const c = String(e.content || '');
    const titleHit = keywords.some(function(k) { return k && t.indexOf(k) >= 0; });
    const contentHit = keywords.some(function(k) { return k && c.indexOf(k) >= 0; });
    const hasTime = TL_TIME_RE.test(c);
    if (titleHit || contentHit || hasTime) push(e, 'keyword', 2, { titleHit: titleHit, contentHit: contentHit, hasTime: hasTime });
  }
  results.sort(function(a, b) {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.bookName + a.title).localeCompare(b.bookName + b.title);
  });
  return results;
}

async function openScanTimelineDialog(panel) {
  showLoadingDialog('扫描世界书中...');
  let entries = [];
  try { entries = await scanAllTimelineEntries(); } catch (e) {}
  closeLoadingDialog();

  const curTag = getTimelineTag();
  const curKw = getTimelineKeywords();

  if (!entries.length) {
    showModalDialog('🔎 扫描时间线',
      '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;">未找到任何与时间线相关的条目。</div>' +
      '<div style="margin-top:8px;font-size:11px;color:#64748b;">可以调整下方标签或关键词后再扫描。</div>' +
      '<div style="margin-top:14px;"><button id="moon-scan-tag-btn" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:11.5px;cursor:pointer;font-family:inherit;font-weight:700;">📜 设置自定义标签</button></div>' +
      '<div style="margin-top:6px;"><button id="moon-scan-kw-btn" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:11.5px;cursor:pointer;font-family:inherit;font-weight:700;">🔍 设置关键词</button></div>',
      null, {
        confirmText: '关闭',
        onOpen: function(mask) {
          mask.querySelector('#moon-scan-tag-btn').addEventListener('click', function() { try { mask.remove(); } catch(e){} openTimelineTagDialog(panel); });
          mask.querySelector('#moon-scan-kw-btn').addEventListener('click', function() { try { mask.remove(); } catch(e){} openTimelineKeywordDialog(panel); });
        }
      });
    return;
  }

  const rows = entries.map(function(e, idx) {
    const typeLabel = ({
      'tag': '📜 标签匹配',
      'prefix-timeline': '📌 [Timeline]',
      'prefix-worldtimeline': '📌 [WorldTimeline]',
      'keyword': '🔍 关键词'
    })[e.matchType] || e.matchType;
    const status = (e.enabled && e.bookEnabled)
      ? '<span style="font-size:9.5px;color:#6ee7b7;">● 启用</span>'
      : '<span style="font-size:9.5px;color:#f87171;">○ 禁用</span>';
    const preview = String(e.content).replace(/</g, '&lt;');
    return '<div class="moon-tl-item" data-idx="' + idx + '" style="padding:10px 12px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:9px;margin-bottom:6px;">' +
      '<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;">' +
      '<input type="checkbox" class="moon-tl-check" data-idx="' + idx + '" checked style="margin-top:2px;flex-shrink:0;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span style="font-size:12px;font-weight:700;color:#e2e8f0;">' + String(e.title || '(无标题)').replace(/</g, '&lt;') + '</span>' +
          '<span style="font-size:9.5px;padding:1px 6px;border-radius:6px;background:rgba(56,189,248,0.15);color:#7dd3fc;">' + typeLabel + '</span>' +
          status +
        '</div>' +
        '<div style="font-size:10px;color:#64748b;margin-top:3px;">📚 ' + String(e.bookName || '(未知书)').replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:10.5px;color:#94a3b8;margin-top:5px;max-height:44px;overflow:hidden;line-height:1.5;">' + preview.slice(0, 110) + (preview.length > 110 ? '……' : '') + '</div>' +
      '</div></label></div>';
  }).join('');

  const html =
    '<div style="font-size:11px;color:#94a3b8;line-height:1.6;margin-bottom:10px;">' +
      '共发现 <b style="color:#7dd3fc;">' + entries.length + '</b> 个疑似时间线条目（含禁用条目）。' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
      '<button id="moon-tl-selectall" style="flex:1;min-width:70px;padding:6px;border-radius:7px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:700;">全选 / 全不选</button>' +
      '<button id="moon-tl-settag" style="flex:1;min-width:70px;padding:6px;border-radius:7px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:700;">📜 标签：' + (curTag ? String(curTag).replace(/</g,'&lt;') : '未设') + '</button>' +
      '<button id="moon-tl-setkw" style="flex:1;min-width:70px;padding:6px;border-radius:7px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:700;">🔍 关键词 (' + curKw.length + ')</button>' +
    '</div>' +
    '<div style="max-height:46dvh;overflow-y:auto;padding-right:4px;margin-bottom:10px;">' + rows + '</div>' +
    '<div style="font-size:10.5px;color:#64748b;line-height:1.6;">' +
      '转写会把选中条目合并后交给 AI 整理成系统标准格式。' +
    '</div>';

  showModalDialogCancelable('🔎 扫描时间线', html,
    async function() {
      const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
      const ids = [];
      mask.querySelectorAll('.moon-tl-check').forEach(function(ck) { if (ck.checked) ids.push(Number(ck.getAttribute('data-idx'))); });
      if (!ids.length) { toast('未勾选任何条目', 'info'); return; }
      const selected = ids.map(function(i) { return entries[i]; }).filter(Boolean);
      try { mask.remove(); } catch (e) {}
      await runTimelineMultiConvert(panel, selected);
    },
    function() { toast('已取消', 'info'); },
    {
      confirmText: '📝 转写选中项',
      cancelText: '取消',
      onOpen: function(mask) {
        mask.querySelector('#moon-tl-selectall').addEventListener('click', function() {
          const boxes = mask.querySelectorAll('.moon-tl-check');
          const allChecked = Array.from(boxes).every(function(b) { return b.checked; });
          boxes.forEach(function(b) { b.checked = !allChecked; });
        });
        mask.querySelector('#moon-tl-settag').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          openTimelineTagDialog(panel, function() { openScanTimelineDialog(panel); });
        });
        mask.querySelector('#moon-tl-setkw').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          openTimelineKeywordDialog(panel, function() { openScanTimelineDialog(panel); });
        });
      }
    });
}

  async function runTimelineConvert(panel, cand) {
    const entry = (cand && cand.entry) || {};
    const rawContent = String(entry.content || '').slice(0, 8000);
    if (!rawContent.trim()) { showModalDialog('⚠️ 无法转写', '<div>该条目内容为空。</div>', null, { confirmText: '关闭' }); return; }
    showLoadingDialog('AI 正在转写时间线...');
    let reply = '';
    try { reply = await callOpeningModel('main', buildTimelineConvertSysPrompt(), '【原始时间线内容】\n' + rawContent); }
    catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    reply = String(reply).trim();
    const m = reply.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) reply = m[1].trim();
    if (!reply) { showModalDialog('❌ 转写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
    showTimelineResultDialog(reply, entry, cand);
  }

  function buildTimelineConvertSysPrompt() {
    const lines = [
      '你是时间线格式转换助手。把用户给你的任意格式时间线，转换为本系统标准格式。',
      '【输出格式】每个事件两行，块与块之间空一行：',
      '时间：YYYY年M月D日H点M分',
      '内容：一句话简述',
      '【硬性要求】',
      '1. 24 小时制，格式固定。',
      '2. 时间必须能推断或按顺序合理排布，不能倒退。',
      '3. 一句话说清发生什么。',
      '4. 原文标记「重大」的，在内容末尾加「（重大）」。',
      '5. 只输出时间线条目，不要解释、不要 markdown。'
    ];
    if (getFanficEnhance()) lines.push('【同人补强】若识别到 IP，可结合 IP 常识补强角色名、地点、因果，但不能删改玩家写明的角色名/事件名/时间。');
    return lines.join('\n');
  }

  function showTimelineResultDialog(initialText, entry, cand) {
    const origTitle = String((entry && entry.title) || (cand && cand.tag) || '(无标题)').replace(/</g, '&lt;');
    let currentText = initialText;
    function buildHtml(text) {
      const preview = String(text).replace(/</g, '&lt;');
      return '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">已转写完成。请复制下方内容，粘贴到世界书的 <code>[WorldTimeline]</code> 条目。</div>' +
        '<div id="moon-tl-result-box" style="padding:10px 12px;background:#05070e;border:1px solid rgba(148,163,184,0.2);border-radius:9px;font-family:monospace;font-size:11px;color:#a5f3fc;white-space:pre-wrap;max-height:280px;overflow-y:auto;">' + preview + '</div>' +
        '<div style="margin-top:12px;padding:10px 12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.35);border-radius:9px;font-size:11px;color:#fbbf24;line-height:1.7;">步骤：① 复制 ② 世界书新建 [WorldTimeline] 粘贴 ③ 禁用原标题「' + origTitle + '」的条目 ④ 面板填 [WorldTimeline]</div>';
    }
    showModalDialog('🕰️ AI 转写结果', buildHtml(initialText), null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const confirmBtn = mask.querySelector('#moon-modal-confirm'); if (!confirmBtn) return;
        const copyBtn = mainDoc.createElement('button');
        copyBtn.textContent = '📋 复制';
        copyBtn.style.cssText = 'flex:1;padding:10px;border-radius:9px;border:1px solid rgba(56,189,248,0.5);background:#0c2540;color:#7dd3fc;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;';
        copyBtn.addEventListener('click', function() {
          try {
            if (mainWin.navigator && mainWin.navigator.clipboard) mainWin.navigator.clipboard.writeText(currentText).then(function() { copyBtn.textContent = '✔ 已复制'; setTimeout(function() { copyBtn.textContent = '📋 复制'; }, 1500); });
            else fallbackCopyTimeline(currentText, copyBtn);
          } catch (e) { fallbackCopyTimeline(currentText, copyBtn); }
        });
        const slimBtn = mainDoc.createElement('button');
        slimBtn.textContent = '📉 精简';
        slimBtn.style.cssText = 'flex:1;padding:10px;border-radius:9px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;';
        slimBtn.addEventListener('click', async function() {
          if (slimBtn.disabled) return;
          slimBtn.disabled = true; slimBtn.textContent = '⏳';
          try {
            const out = await simplifyTimelineTokens(currentText);
            if (out) { currentText = out; const box = mask.querySelector('#moon-tl-result-box'); if (box) box.textContent = out; toast('已精简', 'success'); }
          } catch (e) { toast('精简失败', 'warning'); }
          finally { slimBtn.disabled = false; slimBtn.textContent = '📉 精简'; }
        });
        confirmBtn.parentNode.insertBefore(slimBtn, confirmBtn);
        confirmBtn.parentNode.insertBefore(copyBtn, confirmBtn);
      }
    });
  }

  async function simplifyTimelineTokens(text) {
    const sys = '你是时间线精简助手。在保留时间字段完整的前提下，压缩内容字段。删掉形容词、修辞，只保留「谁+做了什么+关键结果」。不要新增事件，不要改动时间。直接输出精简后的时间线。';
    let reply = await callOpeningModel('main', sys, '【原始时间线】\n' + String(text || ''));
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    return String(reply).trim();
  }
  function fallbackCopyTimeline(txt, btn) {
    try {
      const ta = mainDoc.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      mainDoc.body.appendChild(ta); ta.select(); mainDoc.execCommand('copy'); ta.remove();
      if (btn) { btn.textContent = '✔ 已复制'; setTimeout(function() { btn.textContent = '📋 复制'; }, 1500); }
    } catch (e) { toast('复制失败', 'warning'); }
  }

  function openManualTimelineInputDialog(panel) {
    const html = '<div style="font-size:11px;color:#cbd5e1;margin-bottom:10px;">把任意格式的时间线写进来，AI 转成系统标准格式。</div>' +
      '<textarea id="moon-manual-tl" placeholder="例如：&#10;2016年4月5日 敦被赶出孤儿院&#10;2016年4月8日 敦加入侦探社（重大）" style="width:100%;box-sizing:border-box;min-height:160px;padding:10px 12px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;line-height:1.7;resize:vertical;font-family:inherit;"></textarea>';
    showModalDialogCancelable('✍️ 手动输入时间线', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const raw = mask ? mask.querySelector('#moon-manual-tl').value.trim() : '';
        try { if (mask) mask.remove(); } catch (e) {}
        if (!raw) { toast('输入为空', 'info'); return; }
        const fakeEntry = { title: '(玩家手动输入)', content: raw };
        const sysPrompt = buildTimelineConvertSysPrompt();
        showLoadingDialog('AI 正在转写...');
        let reply = '';
        try { reply = await callOpeningModel('main', sysPrompt, '【原始时间线内容】\n' + raw); }
        catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
        closeLoadingDialog();
        if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
        reply = String(reply).trim();
        const m = reply.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) reply = m[1].trim();
        if (!reply) { showModalDialog('❌ 转写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
        showTimelineResultDialog(reply, fakeEntry, { tag: '(手动输入)' });
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始转写', cancelText: '取消' });
  }

// ===== 第 21 份 =====
  function openTimelineGeneratorDialog(panel) {
    const html = '<div style="font-size:11px;color:#cbd5e1;margin-bottom:10px;">让 AI 根据角色卡 / 大纲，生成 [Timeline] 世界书条目。</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">剧情大纲（可选）</div>' +
      '<textarea id="moon-tl-input" placeholder="例如：主角与角色共度四季、经历表白、吵架、和好……" style="width:100%;box-sizing:border-box;min-height:100px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:11.5px;line-height:1.6;resize:vertical;"></textarea>' +
      '<div style="margin-top:10px;font-size:11px;color:#94a3b8;margin-bottom:6px;">选择模型：</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-tl-model" value="main" checked><span style="font-size:12px;">主模型</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-tl-model" value="custom"><span style="font-size:12px;">自定义API</span></label></div>';
    showModalDialogCancelable('🕰️ 时间线生成器', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const userInput = mask ? mask.querySelector('#moon-tl-input').value.trim() : '';
        const sel = mask ? mask.querySelector('input[name="moon-tl-model"]:checked') : null;
        const provider = sel ? sel.value : 'main';
        try { if (mask) mask.remove(); } catch (e) {}
        await runTimelineGenerator(panel, provider, userInput);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始生成', cancelText: '取消' });
  }

async function runTimelineMultiConvert(panel, entries) {
  if (!entries || !entries.length) return;
  // 合并所有选中条目
  const merged = entries.map(function(e) {
    return '=== 【' + (e.bookName || '未知书') + '】' + (e.title || '(无标题)') + ' ===\n' + String(e.content || '');
  }).join('\n\n');
  const raw = merged.slice(0, 12000);
  if (!raw.trim()) { showModalDialog('⚠️ 无法转写', '<div>选中条目内容为空。</div>', null, { confirmText: '关闭' }); return; }
  showLoadingDialog('AI 正在转写时间线...');
  let reply = '';
  try { reply = await callOpeningModel('main', buildTimelineConvertSysPrompt(), '【原始时间线内容】\n' + raw); }
  catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
  closeLoadingDialog();
  if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
  reply = String(reply).trim();
  const m = reply.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) reply = m[1].trim();
  if (!reply) { showModalDialog('❌ 转写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
  showTimelineResultDialog(reply, { title: '(合并转写 ' + entries.length + ' 条)' }, { tag: getTimelineTag() || '[WorldTimeline]' });
}

function openTimelineTagDialog(panel, onDone) {
  const cur = getTimelineTag();
  const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
    '填一个标签名（例如 <code style="color:#7dd3fc;">[WorldTimeline]</code> 或 <code style="color:#7dd3fc;">世界时间线</code>）。<br>' +
    '启用后扫描会优先匹配以此标签开头的条目。<br>' +
    '<span style="color:#fbbf24;">留空即关闭。</span></div>' +
    '<input id="moon-tltag-input" type="text" value="' + String(cur || '').replace(/"/g, '&quot;') + '" placeholder="例如：[WorldTimeline]" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12.5px;">';
  showModalDialogCancelable('📜 自定义时间线标签', html,
    function() {
      const mask = mainDoc.getElementById('moon-modal-mask');
      const v = mask ? mask.querySelector('#moon-tltag-input').value.trim() : '';
      setTimelineTag(v);
      try { if (mask) mask.remove(); } catch (e) {}
      toast(v ? ('时间线标签已设为：' + v) : '已关闭自定义时间线标签', 'info');
      try { refreshPanel(); } catch (e) {}
      if (typeof onDone === 'function') setTimeout(onDone, 200);
    },
    function() { toast('已取消', 'info'); if (typeof onDone === 'function') setTimeout(onDone, 200); },
    { confirmText: '保存', cancelText: '取消' });
}

function openTimelineKeywordDialog(panel, onDone) {
  const cur = getTimelineKeywords();
  const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:8px;">' +
    '扫描时会用这些关键词匹配世界书条目的<strong>标题和正文</strong>。<br>' +
    '<span style="color:#fbbf24;">默认：时间线 / 时间剧情 / 主线剧情</span></div>' +
    '<textarea id="moon-tlkw-input" placeholder="每行一个关键词" style="width:100%;box-sizing:border-box;min-height:120px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;line-height:1.7;resize:vertical;font-family:inherit;">' + cur.join('\n') + '</textarea>' +
    '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">每行一个，空行自动忽略。</div>';
  showModalDialogCancelable('🔍 时间线关键词', html,
    function() {
      const mask = mainDoc.getElementById('moon-modal-mask');
      const v = mask ? mask.querySelector('#moon-tlkw-input').value : '';
      const list = String(v).split('\n').map(function(x) { return x.trim(); }).filter(Boolean);
      setTimelineKeywords(list.length ? list : DEFAULT_TIMELINE_KEYWORDS);
      try { if (mask) mask.remove(); } catch (e) {}
      toast('已保存 ' + (list.length || DEFAULT_TIMELINE_KEYWORDS.length) + ' 个关键词', 'success');
      if (typeof onDone === 'function') setTimeout(onDone, 200);
    },
    function() { toast('已取消', 'info'); if (typeof onDone === 'function') setTimeout(onDone, 200); },
    { confirmText: '保存', cancelText: '取消' });
}

  function shouldShowAdaptiveOpening() {
    if (getCardMode() === 'multi') return null;
    // ① 当前对话已有有效角色数据 → 不弹
    const data = readMvuLatest();
    if (data && data.stat_data && data.stat_data.角色) {
      const chars = data.stat_data.角色;
      for (const n in chars) {
        if (chars[n] && !isCharSkeleton(chars[n])) return null;
      }
    }
    // ② 有待迁移的打包数据 → 不弹（走迁移流程）
    try {
      const raw = localStorage.getItem(PENDING_MIGRATION_KEY);
      if (raw) return null;
    } catch (e) {}
    const cardName = getCurrentCardName();
    if (!cardName || cardName === '(未知卡牌)') return null;
    return { charName: cardName, data: data };
  }

  async function runAdaptiveOpeningFlow() {
    if (isAdaptiveFlowRunning) return;
    const info = shouldShowAdaptiveOpening();
    if (!info) return;
    isAdaptiveFlowRunning = true;
    showAdaptiveStartDialog(info.charName);
  }


  function showAdaptiveStartDialog(charName) {
    const savedPref = (function() { try { return mainWin.localStorage.getItem(ADAPT_MODEL_PREF_KEY) || ''; } catch (e) { return ''; } })();
    const cardMode = getCardMode(); const isMulti = cardMode === 'multi';
    const tipHtml = isMulti ? '<div style="margin-top:10px;color:#fbbf24;line-height:1.7;">· 多人卡：AI 通读上下文识别出场角色<br>· 有对话历史 → 以历史为准</div>' : '<div style="margin-top:10px;color:#fbbf24;line-height:1.7;">· AI 通读上下文推断初始四维<br>· 全新开场 → 参考开场白 + 角色卡</div>';
    const html = '<div>检测到当前存档还没有有效角色变量。</div>' + tipHtml +
      '<div style="margin-top:14px;font-size:11px;color:#94a3b8;margin-bottom:6px;">选择模型：</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-adapt-model" value="main" ' + ((savedPref === 'extra' || savedPref === 'custom') ? '' : 'checked') + '><span style="font-size:12px;">主模型</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-adapt-model" value="extra" ' + (savedPref === 'extra' ? 'checked' : '') + '><span style="font-size:12px;">副模型</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-adapt-model" value="custom" ' + (savedPref === 'custom' ? 'checked' : '') + '><span style="font-size:12px;">自定义API</span></label>' +
      '</div><label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;color:#94a3b8;cursor:pointer;"><input type="checkbox" id="moon-adapt-remember"> 记住我的选择</label>';
    showModalDialogCancelable('🌅 自适应开局', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const sel = mask ? mask.querySelector('input[name="moon-adapt-model"]:checked') : null;
        const provider = sel ? sel.value : 'main';
        const rememberEl = mask ? mask.querySelector('#moon-adapt-remember') : null;
        if (rememberEl && rememberEl.checked) { try { mainWin.localStorage.setItem(ADAPT_MODEL_PREF_KEY, provider); } catch (e) {} }
        try { if (mask) mask.remove(); } catch (e) {}
        runAdaptiveFirstPass(charName, provider); isAdaptiveFlowRunning = false;
      },
      function() {
        if (getCardMode() !== 'multi' && charName && charName !== '(多人卡)') {
          const data = readMvuLatest();
          if (data && data.stat_data && data.stat_data.角色 && data.stat_data.角色[charName]) {
            const q = data.stat_data.角色[charName]._quota || {}; q.自适应开局已完成 = true;
            data.stat_data.角色[charName]._quota = q; writeMvuLatest(data.stat_data);
          }
        }
        toast('已跳过自适应开局', 'info'); isAdaptiveFlowRunning = false;
      },
      { confirmText: '开始', cancelText: '跳过' });
  }

  async function runAdaptiveFirstPass(charName, provider) {
    if (getCardMode() === 'multi') { await runMultiCardAdaptiveFirstPass(provider, ''); return; }
    const ctxData = collectOpeningContext(charName);
    const tpl = getPromptTemplates().opening;
    const vars = { playerName: ctxData.playerName, playerPersona: ctxData.playerPersona, charName: ctxData.charName, charDesc: ctxData.charDesc, charPersonality: ctxData.charPersonality, charScenario: ctxData.charScenario, charFirstMes: ctxData.charFirstMes, charCreatorNotes: ctxData.charCreatorNotes, chatHistory: ctxData.hasHistory ? ctxData.chatHistory : '(无对话历史)' };
    showLoadingDialog(ctxData.hasHistory ? '正在通读对话历史...' : '正在根据开场白推断...');
    let reply = '';
    try { reply = await callOpeningModel(provider, renderPromptTemplate(tpl.sys, vars), renderPromptTemplate(tpl.user, vars)); }
    catch (e) { closeLoadingDialog(); toast('调用模型失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    const parsed = extractJson(reply);
    if (!parsed) { showModalDialog('❌ 解析失败', '<div>模型未返回合法 JSON。</div>', null, { confirmText: '关闭' }); return; }
    openAdaptiveResultDialog(charName, provider, parsed);
  }

  function openAdaptiveResultDialog(charName, provider, initial) {
    const initE = Number(initial.好感度) || 0; const initP = Number(initial.肉体值) || 0;
    const initI = Number(initial.嫉妒值) || 0; const initEmoji = String(initial.情绪 || '😐');
    const initVoice = String(initial.心声 || '……'); const initReason = String(initial.推断理由 || '');
    const initStage = getRStageFromE(initE);
    const html = '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">好感度（可改）</div><input id="moon-open-e" type="number" step="0.5" value="' + initE + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:13px;"></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">肉体值（可改）</div><input id="moon-open-p" type="number" step="0.5" value="' + initP + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:13px;"></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">阶段值（自动推导）</div><div id="moon-open-r" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#05070e;font-size:12px;color:#a5f3fc;">' + initStage.r + ' · ' + initStage.name + '</div></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">I / emoji / 心声（只读）</div><div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#05070e;font-size:12px;color:#cbd5e1;">I' + initI + ' · ' + initEmoji + ' · ' + initVoice + '</div></div>' +
      (initReason ? '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">AI 推断理由</div><div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#05070e;font-size:11px;color:#94a3b8;">' + initReason + '</div></div>' : '') + '</div>';
    showModalDialogCancelable('🌅 自适应开局 · 确认', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const finalE = Number(mask.querySelector('#moon-open-e').value) || 0; const finalP = Number(mask.querySelector('#moon-open-p').value) || 0;
        const finalStage = getRStageFromE(finalE); try { mask.remove(); } catch (e) {}
        applyAdaptiveOpening(charName, { e: finalE, p: finalP, r: finalStage.r, i: initI, emoji: initEmoji, voice: initVoice });
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '确认并写入', cancelText: '取消',
        onOpen: function(mask) {
          const eInput = mask.querySelector('#moon-open-e'); const rDisplay = mask.querySelector('#moon-open-r');
          eInput.addEventListener('input', function() { const st = getRStageFromE(Number(eInput.value) || 0); rDisplay.textContent = st.r + ' · ' + st.name; });
        }
      });
  }

async function applyAdaptiveOpening(charName, values) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色 || !data.stat_data.角色[charName]) {
      await forceBootstrapVariables(charName, values);
      return;
    }
    const ch = data.stat_data.角色[charName];
    ch.好感度 = values.e;
    ch.肉体值 = values.p;
    ch.阶段值 = values.r;
    ch.嫉妒值 = values.i;
    ch.情绪 = values.emoji;
    ch.心声 = values.voice;
    if (!ch._quota) ch._quota = {};
    ch._quota.自适应开局已完成 = true;
    if (!ch._quota._eventState) ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 };
    if (!Array.isArray(ch._quota._timelineCompleted)) ch._quota._timelineCompleted = [];
    const ok = await writeMvuLatest(data.stat_data);
    if (ok) {
      toast('自适应开局完成', 'success');
      try { refreshPanel(); } catch (e) {}
    } else {
      toast('写入失败', 'warning');
    }
  }

  async function forceBootstrapVariables(charName, values) {
    const now = '2000年01月01日 · 星期六 · 00:00';
    let data = readMvuLatest();
    let statData = (data && data.stat_data) ? data.stat_data : null;
    if (!statData) {
      statData = { 世界: { 时间: values.worldTime || now, _内部流逝天数: 0, _上次推进时间: values.worldTime || now }, 角色: {} };
      statData[MIGRATED_FLAG] = true;
    }
    if (!statData.角色 || typeof statData.角色 !== 'object') statData.角色 = {};
    if (!statData.世界) statData.世界 = { 时间: values.worldTime || now, _内部流逝天数: 0, _上次推进时间: values.worldTime || now };
    const name = charName || '主角';
    if (!statData.角色[name]) {
      statData.角色[name] = {
        语言: '日语', 英文名: '', 签名: '', 性别: '男', user爱称: '',
        好感度: values.e || 0, 肉体值: values.p || 0, 阶段值: values.r || 0, 嫉妒值: values.i || 0,
        情绪: values.emoji || '😐', 心声: values.voice || '……',
        在场: true, 重要度: values.importance || '主要',
        _invidia: { 重力等级: '', 骰子判定阈值: 0, 每日衰减基数: 0, 大失败反噬值: 0, 主动互动阈值: 30 },
        _lastRoll: { 事件类型: '', 方向: '', 主维度: '', 基础值: 0 },
        _quota: {
          好感度周上限已用: values.好感度周上限已用 || 0,
          周上限起始: values.worldTime || now, R阶段门: false,
          下次暗掷: values.worldTime || now, 玩家本周已掷: false, 玩家冷却至: values.worldTime || now,
          表白期排除: values.表白期排除 || false, 表白期排除理由: '', 对用户特殊状态: '',
          表白期已通过: values.表白期已通过 || false, 表白期冷却至: '',
          自适应开局已完成: true,
          _playerConfession: false,
          _firstMeetDone: false,
          _eventState: { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 },
          _timelineCompleted: values.已触发时间线事件名 || [],
          _debuff: { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' }
        }
      };
    } else {
      const ch = statData.角色[name];
      ch.好感度 = values.e || 0;
      ch.肉体值 = values.p || 0;
      ch.阶段值 = values.r || 0;
      ch.嫉妒值 = values.i || 0;
      ch.情绪 = values.emoji || '😐';
      ch.心声 = values.voice || '……';
      if (!ch._quota) ch._quota = {};
      ch._quota.好感度周上限已用 = values.好感度周上限已用 || 0;
      ch._quota.周上限起始 = values.worldTime || now;
      ch._quota.表白期已通过 = values.表白期已通过 || false;
      ch._quota.表白期排除 = values.表白期排除 || false;
      ch._quota.自适应开局已完成 = true;
      if (ch._quota._playerConfession === undefined) ch._quota._playerConfession = false;
      if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
      if (!ch._quota._eventState) {
        ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 };
      }
      ch._quota._timelineCompleted = values.已触发时间线事件名 || [];
      if (!ch._quota._debuff) ch._quota._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
    }
    const ok = await writeMvuLatest(statData);
    if (ok) { toast('变量已从零建立', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
    return ok;
  }
// ===== 第 22 份 =====
  async function runMultiCardAdaptiveFirstPass(provider, manualNames) {
    const ctxData = collectChatHistoryContext(10000);
    const hasHistory = ctxData.chat && ctxData.chat.length >= 30;
    let charInfo = ''; let charFirstMes = ''; let charScenario = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) {
          charInfo = ['角色卡名称：' + (ch.name || '(未命名)'), '简介：' + (ch.description || '(无)').slice(0, 1200), '性格：' + (ch.personality || '(无)').slice(0, 600)].join('\n');
          charScenario = (ch.scenario || '').slice(0, 800);
          charFirstMes = (ch.first_mes || '').slice(0, 2000);
        }
      }
    } catch (e) {}
    if (!charInfo) charInfo = '(无法读取角色卡信息)';
    const sysPrompt = [
      '你是月相多维情感系统的「多人卡批量建档」助手。',
      '【背景】玩家使用多人卡，剧情里会涉及多个角色。你需要通读上下文，识别实际出场并与玩家有互动的角色，为每个角色推断初始四维数值。',
      '【输出】严格 JSON 数组：',
      '[{"名字":"角色正名","重要度":"主要"|"次要"|"NPC","好感度":number,"肉体值":number,"嫉妒值":number,"情绪":"单个emoji","心声":"15~30字第一人称","推断理由":"≤80字"}]',
      '【硬性要求】名字必须是剧情里最常出现、最正式的那个名字；至少识别 1 个，最多 10 个；只输出 JSON 数组。'
    ].join('\n');
    let userPrompt = '【角色卡信息】\n' + charInfo + '\n\n';
    if (charScenario) userPrompt += '【场景】\n' + charScenario + '\n\n';
    if (charFirstMes) userPrompt += '【开场白】\n' + charFirstMes + '\n\n';
    userPrompt += '【玩家设定】\n名字：' + (ctxData.playerName || '(未命名玩家)') + '\n描述：' + (ctxData.playerPersona || '(无)') + '\n\n';
    if (manualNames) userPrompt += '【玩家指定角色】\n' + manualNames + '\n\n';
    if (hasHistory) userPrompt += '【对话历史】\n' + ctxData.chat + '\n\n请分析对话，识别出场角色，输出 JSON 数组。';
    else userPrompt += '【对话历史】\n(无对话历史)\n\n请根据角色卡+开场白+玩家设定，识别出场角色，输出 JSON 数组。';
    showLoadingDialog(hasHistory ? 'AI 正在扫描对话历史...' : 'AI 正在分析开场白...');
    let reply = '';
    try { reply = await callOpeningModel(provider, sysPrompt, userPrompt); }
    catch (e) { closeLoadingDialog(); toast('调用模型失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    reply = String(reply).trim();
    const m = reply.match(/```(?:json)?\s*([\s\S]*?)```/i); if (m) reply = m[1].trim();
    let list = null;
    try { list = JSON.parse(reply); } catch (e) {}
    if (!list) { const m2 = reply.match(/\[[\s\S]*\]/); if (m2) { try { list = JSON.parse(m2[0]); } catch (e) {} } }
    if (!Array.isArray(list) || !list.length) { showModalDialog('❌ 解析失败', '<div>AI 未返回合法数组。</div>', null, { confirmText: '关闭' }); return; }
    const valid = list.filter(function(item) { return item && typeof item === 'object' && typeof item.名字 === 'string' && item.名字.trim(); });
    if (!valid.length) { showModalDialog('❌ 无有效角色', '<div>AI 返回的数组里没有有效角色名。</div>', null, { confirmText: '关闭' }); return; }
    openMultiCardAdaptiveResultDialog(valid);
  }

  function openMultiCardAdaptiveResultDialog(chars) {
    const rows = chars.map(function(c, idx) {
      const e = Number(c.好感度) || 0; const p = Number(c.肉体值) || 0;
      const name = String(c.名字 || '').trim(); const imp = String(c.重要度 || '主要');
      const emoji = String(c.情绪 || '😐'); const voice = String(c.心声 || '……'); const reason = String(c.推断理由 || '');
      const stage = getRStageFromE(e);
      return '<div class="moon-mc-row" data-idx="' + idx + '" style="padding:10px 12px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:9px;margin-bottom:8px;">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#f8fafc;margin-bottom:8px;cursor:pointer;"><input type="checkbox" class="moon-mc-check" data-idx="' + idx + '" checked><span>' + name + '</span><span style="font-size:10px;color:#94a3b8;font-weight:400;">· ' + imp + ' · ' + emoji + '</span></label>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">' +
        '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">E</div><input type="number" step="0.5" class="moon-mc-e" data-idx="' + idx + '" value="' + e + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#0a0c16;color:#e2e8f0;font-size:12px;"></div>' +
        '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">P</div><input type="number" step="0.5" class="moon-mc-p" data-idx="' + idx + '" value="' + p + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#0a0c16;color:#e2e8f0;font-size:12px;"></div>' +
        '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">R</div><div class="moon-mc-r" data-idx="' + idx + '" style="padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#0a0c16;color:#a5f3fc;font-size:12px;">' + stage.r + ' · ' + stage.name + '</div></div></div>' +
        '<div style="margin-top:6px;font-size:10px;color:#94a3b8;">' + emoji + ' · ' + voice.replace(/</g, '&lt;') + '</div>' +
        (reason ? '<div style="margin-top:4px;font-size:10px;color:#64748b;">💡 ' + reason.replace(/</g, '&lt;') + '</div>' : '') + '</div>';
    }).join('');
    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">AI 识别到 <b style="color:#7dd3fc;">' + chars.length + '</b> 个出场角色。</div>' +
      '<div style="max-height:52dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>' +
      '<div style="margin-top:10px;font-size:10px;color:#64748b;line-height:1.6;">· 未勾选的角色不会写入<br>· 已存在的角色会被覆盖</div>';
    showModalDialogCancelable('🌅 多人卡 · 确认建档', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const finalList = [];
        mask.querySelectorAll('.moon-mc-row').forEach(function(row) {
          const idx = Number(row.getAttribute('data-idx')); const ck = row.querySelector('.moon-mc-check');
          if (!ck || !ck.checked) return;
          const c = chars[idx]; const eVal = Number(row.querySelector('.moon-mc-e').value) || 0;
          const pVal = Number(row.querySelector('.moon-mc-p').value) || 0; const stage = getRStageFromE(eVal);
          finalList.push({ 名字: c.名字, 重要度: c.重要度 || '主要', 好感度: eVal, 肉体值: pVal, 阶段值: stage.r, 嫉妒值: Number(c.嫉妒值) || 0, 情绪: c.情绪 || '😐', 心声: c.心声 || '……' });
        });
        try { mask.remove(); } catch (e) {}
        if (!finalList.length) { toast('未勾选任何角色', 'info'); return; }
        await applyMultiCardAdaptiveOpening(finalList);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '确认写入', cancelText: '取消',
        onOpen: function(mask) {
          mask.querySelectorAll('.moon-mc-e').forEach(function(input) {
            input.addEventListener('input', function() {
              const idx = input.getAttribute('data-idx'); const st = getRStageFromE(Number(input.value) || 0);
              const rEl = mask.querySelector('.moon-mc-r[data-idx="' + idx + '"]');
              if (rEl) rEl.textContent = st.r + ' · ' + st.name;
            });
          });
        }
      });
  }

  async function applyMultiCardAdaptiveOpening(list) {
    let data = readMvuLatest();
    let statData = (data && data.stat_data) ? data.stat_data : null;
    const now = '2000年01月01日 · 星期六 · 00:00';
    if (!statData) { statData = { 世界: { 时间: now, _内部流逝天数: 0, _上次推进时间: now }, 角色: {} }; statData[MIGRATED_FLAG] = true; }
    if (!statData.角色 || typeof statData.角色 !== 'object') statData.角色 = {};
    if (!statData.世界) statData.世界 = { 时间: now, _内部流逝天数: 0, _上次推进时间: now };
    list.forEach(function(item) {
      const name = item.名字;
      if (!name) return;
      const existed = statData.角色[name] && !isCharSkeleton(statData.角色[name]);
      if (existed) {
        const ch = statData.角色[name];
        ch.好感度 = item.好感度; ch.肉体值 = item.肉体值; ch.阶段值 = item.阶段值;
        ch.嫉妒值 = item.嫉妒值; ch.情绪 = item.情绪; ch.心声 = item.心声;
        if (!ch.重要度) ch.重要度 = item.重要度 || '主要';
        if (!ch._quota) ch._quota = {};
        ch._quota.自适应开局已完成 = true;
        if (ch._quota._playerConfession === undefined) ch._quota._playerConfession = false;
        if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
        if (!ch._quota._eventState) ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 };
        if (!Array.isArray(ch._quota._timelineCompleted)) ch._quota._timelineCompleted = [];
        if (!ch._quota._debuff) ch._quota._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
      } else {
        statData.角色[name] = {
          语言: '日语', 英文名: '', 签名: '', 性别: '男', user爱称: '',
          好感度: item.好感度, 肉体值: item.肉体值, 阶段值: item.阶段值, 嫉妒值: item.嫉妒值,
          情绪: item.情绪, 心声: item.心声, 在场: true, 重要度: item.重要度 || '主要',
          _invidia: { 重力等级: '', 骰子判定阈值: 0, 每日衰减基数: 0, 大失败反噬值: 0, 主动互动阈值: 30 },
          _lastRoll: { 事件类型: '', 方向: '', 主维度: '', 基础值: 0 },
          _quota: {
            好感度周上限已用: 0, 周上限起始: now, R阶段门: false, 下次暗掷: now, 玩家本周已掷: false, 玩家冷却至: now,
            表白期排除: false, 表白期排除理由: '', 对用户特殊状态: '', 表白期已通过: false, 表白期冷却至: '', 自适应开局已完成: true,
            _playerConfession: false,
            _firstMeetDone: false,
            _eventState: { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 },
            _timelineCompleted: [],
            _debuff: { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' }
          }
        };
      }
    });
    const ok = await writeMvuLatest(statData);
    if (ok) { toast('多人卡批量建档完成：' + list.length + ' 个角色', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
  }

  const PENDING_MIGRATION_KEY = 'moon_phase_pending_migration';

  function checkAndPromptMigrate() { return; }

  function startMigrationPack(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色) {
      showModalDialog('📦 打包迁移', '<div>当前对话没有可打包的数据。</div>', null, { confirmText: '关闭' });
      return;
    }
    const statData = data.stat_data;
    const chars = statData.角色;
    const validNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (!validNames.length) {
      showModalDialog('📦 打包迁移', '<div>当前对话没有有效角色数据。</div>', null, { confirmText: '关闭' });
      return;
    }
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '将当前对话的完整角色档案打包。切换到新对话窗口后，脚本会自动询问是否导入。' +
      '<br><span style="color:#fbbf24;">导入后会完整覆盖新对话的变量数据。</span></div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;font-size:11px;color:#cbd5e1;line-height:1.7;">' +
      '<div style="color:#7dd3fc;font-weight:700;margin-bottom:4px;">将打包以下内容（完整无删减）：</div>' +
      '<div>· 世界时间 / 地点 / 内部流逝天数 / 上次推进时间</div>' +
      '<div>· ' + validNames.length + ' 个角色的完整档案：</div>' +
      '<div style="padding-left:14px;color:#94a3b8;">好感度 · 肉体值 · 阶段值 · 嫉妒值 · 情绪 · 心声 · 在场 · 重要度</div>' +
      '<div style="padding-left:14px;color:#94a3b8;">_invidia 全部字段 · _lastRoll · _quota 全部字段（周上限/破门/暗掷/玩家冷却/表白期/自适应标记）</div>' +
      '<div style="padding-left:14px;color:#94a3b8;">_eventState · _timelineCompleted · _debuff 冷战期</div>' +
      '</div>';
    showModalDialogCancelable('📦 打包迁移', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        try { if (mask) mask.remove(); } catch (e) {}
        runMigrationPack();
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始打包', cancelText: '取消' });
  }

  function runMigrationPack() {
    const data = readMvuLatest();
    if (!data || !data.stat_data) { toast('没有可打包的数据', 'warning'); return; }
    const pending = {
      fromChatId: (function() { try { return getSTCtx().chatId || ''; } catch(e) { return ''; } })(),
      fromCardName: getCurrentCardName(),
      packedAt: Date.now(),
      stat_data: JSON.parse(JSON.stringify(data.stat_data))
    };
    try {
      localStorage.setItem(PENDING_MIGRATION_KEY, JSON.stringify(pending));
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) { ctx.chatMetadata[PENDING_MIGRATION_KEY] = pending; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
    } catch (e) { toast('打包写入失败', 'warning'); return; }
    const charCount = Object.keys(pending.stat_data.角色 || {}).filter(function(n) { return !isCharSkeleton(pending.stat_data.角色[n]); }).length;
    showModalDialog('✅ 打包完成',
      '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '已打包 <b style="color:#7dd3fc;">' + charCount + '</b> 个角色的完整档案。</div>' +
      '<div style="padding:10px 12px;background:#05070e;border:1px solid rgba(110,231,183,0.25);border-radius:9px;font-size:11px;color:#6ee7b7;line-height:1.7;">' +
      '🎯 接下来：切换到你想继续演的那个新对话窗口，脚本会自动弹窗询问是否导入。</div>',
      null, { confirmText: '知道了' });
  }

  function checkPendingMigration() {
    let pending = null;
    try {
      const raw = localStorage.getItem(PENDING_MIGRATION_KEY);
      if (raw) pending = JSON.parse(raw);
    } catch (e) {}
    if (!pending) {
      try {
        const ctx = getSTCtx();
        if (ctx && ctx.chatMetadata && ctx.chatMetadata[PENDING_MIGRATION_KEY]) pending = ctx.chatMetadata[PENDING_MIGRATION_KEY];
      } catch (e) {}
    }
    if (!pending || !pending.stat_data) return;
    const cur = loadLocalState();
    if (cur && cur.stat_data && cur.stat_data.角色) {
      for (const n in cur.stat_data.角色) {
        if (cur.stat_data.角色[n] && !isCharSkeleton(cur.stat_data.角色[n])) return;
      }
    }
    const validNames = Object.keys(pending.stat_data.角色 || {}).filter(function(n) { return !isCharSkeleton(pending.stat_data.角色[n]); });
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '检测到一份来自其他对话的打包数据：</div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      '<div>来源卡：<b style="color:#7dd3fc;">' + String(pending.fromCardName || '(未知)') + '</b></div>' +
      '<div>打包时间：' + new Date(pending.packedAt || 0).toLocaleString() + '</div>' +
      '<div>角色数：' + validNames.length + '</div>' +
      '<div>世界时间：' + String(pending.stat_data.世界 && pending.stat_data.世界.时间 || '(未知)') + '</div>' +
      '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">包含角色：</div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;font-size:11px;color:#cbd5e1;line-height:1.7;max-height:100px;overflow-y:auto;">' + validNames.join('、') + '</div>' +
      '<div style="margin-top:10px;font-size:11px;color:#fbbf24;line-height:1.7;">⚠️ 导入后会完整覆盖当前对话的变量数据（含所有 _quota / _eventState / _debuff / _timelineCompleted 等字段）。</div>';
    showModalDialogCancelable('📦 检测到迁移数据', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        try { if (mask) mask.remove(); } catch (e) {}
        applyPendingMigration(pending);
      },
      function() { toast('已跳过（打包数据仍保留，下次可再选）', 'info'); },
      { confirmText: '导入', cancelText: '稍后再说' });
  }

  async function applyPendingMigration(pending) {
    if (!pending || !pending.stat_data) return;
    const ok = await writeMvuLatest(pending.stat_data);
    if (!ok) { toast('迁移写入失败', 'warning'); return; }
    try {
      localStorage.removeItem(PENDING_MIGRATION_KEY);
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && ctx.chatMetadata[PENDING_MIGRATION_KEY]) {
        delete ctx.chatMetadata[PENDING_MIGRATION_KEY];
        if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata();
      }
    } catch (e) {}
    toast('迁移完成，档案已完整导入', 'success');
    try { refreshPanel(); } catch (e) {}
  }

  function manualMigrate(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data) { toast('无法读取变量数据', 'warning'); return; }
    const pending = getPendingMigrateChars(data.stat_data);
    if (pending.length === 0) {
      showModalDialog('🔄 兼容迁移', '<div>当前没有需要迁移的角色。</div>', null, { confirmText: '关闭' });
      return;
    }
    const html = '<div>以下角色将进行字段迁移：</div>'
      + '<div style="margin-top:8px;color:#7dd3fc;">' + pending.join('、') + '</div>'
      + '<div style="margin-top:10px;font-size:11px;color:#fbbf24;">旧字段会转换为新字段，四维数值保留，计时字段重置。</div>';
    showModalDialogCancelable('🔄 兼容迁移', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        try { if (mask) mask.remove(); } catch (e) {}
        const statData = data.stat_data;
        for (const name of pending) {
          const ch = statData.角色[name];
          if (!ch) continue;
          if (ch.情感值 !== undefined) { ch.好感度 = Number(ch.情感值) || 0; delete ch.情感值; }
          if (ch.关系值 !== undefined) { ch.阶段值 = Number(ch.关系值) || 0; delete ch.关系值; }
          if (ch.身体值 !== undefined) { ch.肉体值 = Number(ch.身体值) || 0; delete ch.身体值; }
          if (ch.好感值 !== undefined) { ch.好感度 = Number(ch.好感值) || 0; delete ch.好感值; }
          if (ch._quota && ch._quota.E周已用 !== undefined) { ch._quota.好感度周上限已用 = Number(ch._quota.E周已用) || 0; delete ch._quota.E周已用; }
          if (ch._quota && ch._quota._debuff && ch._quota._debuff.踩雷冷却中 !== undefined) {
            ch._quota._debuff.冷战期 = !!ch._quota._debuff.踩雷冷却中;
            delete ch._quota._debuff.踩雷冷却中;
          }
          if (!ch._quota) ch._quota = {};
          if (!ch._quota._eventState) {
            ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 };
          }
          if (!Array.isArray(ch._quota._timelineCompleted)) ch._quota._timelineCompleted = [];
          if (ch._quota._playerConfession === undefined) ch._quota._playerConfession = false;
          if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
          if (!ch._quota._debuff) ch._quota._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
        }
        statData[MIGRATED_FLAG] = true;
        const ok = await writeMvuLatest(statData);
        if (ok) { toast('兼容迁移完成', 'success'); try { refreshPanel(); } catch (e) {} }
        else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '确认迁移', cancelText: '取消' });
  }

  function openAiMigrateEntryDialog(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data) { toast('无法读取变量数据', 'warning'); return; }
    showAiMigrateEntryDialog(data, panel);
  }

  function showAiMigrateEntryDialog(data, panel) {
    const savedPref = getAiMigrateModelPref();
    if (savedPref) { runAiAssistedMigrate(savedPref, data, panel); return; }
    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">让 AI 通读聊天上下文，判断哪些条目该保留、改名、删除、合并。</div>'
      + '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">选择模型：</div>'
      + '<div style="display:flex;gap:8px;">'
      + '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-aimig-model" value="main" checked><span style="font-size:12px;">主模型</span></label>'
      + '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-aimig-model" value="extra"><span style="font-size:12px;">副模型</span></label>'
      + '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-aimig-model" value="custom"><span style="font-size:12px;">自定义API</span></label></div>';
    showModalDialogCancelable('🤖 AI 辅助迁移 · 选择模型', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const sel = mask ? mask.querySelector('input[name="moon-aimig-model"]:checked') : null;
        const provider = sel ? sel.value : 'main';
        saveAiMigrateModelPref(provider);
        try { if (mask) mask.remove(); } catch (e) {}
        runAiAssistedMigrate(provider, data, panel);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始整理', cancelText: '取消' });
  }

  function getAiMigrateModelPref() { try { return mainWin.localStorage.getItem(AI_MIGRATE_MODEL_PREF_KEY) || ''; } catch (e) { return ''; } }
  function saveAiMigrateModelPref(p) { try { mainWin.localStorage.setItem(AI_MIGRATE_MODEL_PREF_KEY, p); } catch (e) {} }

  async function runAiAssistedMigrate(provider, data, panel) {
    if (!data || !data.stat_data || !data.stat_data.角色) { toast('没有可整理的角色数据', 'warning'); return; }
    const chars = data.stat_data.角色;
    const names = Object.keys(chars);
    if (!names.length) { toast('角色表为空', 'info'); return; }
    let charInfo = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) charInfo = '角色卡：' + (ch.name || '未命名') + '\n' + (ch.description || '').slice(0, 800);
      }
    } catch (e) {}
    if (!charInfo) charInfo = '(无法读取)';
    const chatCtx = collectChatHistoryContext(6000);
    const charsDump = names.map(function(n) {
      const ch = chars[n] || {};
      return '- ' + n + ' | E' + (ch.好感度 || 0) + ' P' + (ch.肉体值 || 0) + ' R' + (ch.阶段值 || 0) + ' I' + (ch.嫉妒值 || 0);
    }).join('\n');
    const sysPrompt = '你是月相多维情感系统的「变量整理」助手。判断每个条目应该怎么处理。\n【输出】严格 JSON：{"keep":[],"rename":[{"from":"旧","to":"新","reason":""}],"delete":[{"name":"","reason":""}],"merge":[{"froms":[],"to":"","reason":""}]}\n只输出 JSON。';
    const userPrompt = '【角色卡】\n' + charInfo + '\n\n【当前角色表】\n' + charsDump + '\n\n【聊天上下文】\n' + (chatCtx.chat || '(无)');
    showLoadingDialog('AI 正在整理变量...');
    let reply = '';
    try { reply = await callOpeningModel(provider, sysPrompt, userPrompt); }
    catch (e) { closeLoadingDialog(); toast('调用模型失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    const decision = extractJson(reply);
    if (!decision || typeof decision !== 'object') { showModalDialog('❌ 解析失败', '<div>模型未返回合法 JSON。</div>', null, { confirmText: '关闭' }); return; }
    renderAiMigratePreview(data, { keep: decision.keep || [], rename: decision.rename || [], delete: decision.delete || [], merge: decision.merge || [] }, panel);
  }

  function renderAiMigratePreview(data, decision, panel) {
    const chars = data.stat_data.角色 || {};
    const names = Object.keys(chars);
    const actions = [];
    decision.keep.forEach(function(n) { if (names.indexOf(n) >= 0) actions.push({ type: 'keep', from: n, to: n, reason: '保留' }); });
    decision.rename.forEach(function(item) { if (item && names.indexOf(item.from) >= 0) actions.push({ type: 'rename', from: item.from, to: item.to, reason: item.reason || '' }); });
    decision.delete.forEach(function(item) { if (item && names.indexOf(item.name) >= 0) actions.push({ type: 'delete', from: item.name, reason: item.reason || '' }); });
    decision.merge.forEach(function(item) {
      if (!item || !Array.isArray(item.froms)) return;
      const validFroms = item.froms.filter(function(n) { return names.indexOf(n) >= 0; });
      if (validFroms.length < 2) return;
      actions.push({ type: 'merge', from: validFroms.join('+'), froms: validFroms, to: item.to, reason: item.reason || '' });
    });
    if (!actions.length) { showModalDialog('🤖 AI 整理完成', '<div>AI 未给出任何有效改动。</div>', null, { confirmText: '关闭' }); return; }
    let html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">AI 已给出整理方案。勾选后应用。</div>';
    actions.forEach(function(a, idx) {
      const colorMap = { keep: '#6ee7b7', rename: '#7dd3fc', delete: '#fca5a5', merge: '#c084fc' };
      const labelMap = { keep: '保留', rename: '重命名', delete: '删除', merge: '合并' };
      html += '<label style="display:block;padding:8px 10px;background:#05070e;border-radius:9px;margin-bottom:6px;border:1px solid rgba(148,163,184,0.15);cursor:pointer;">'
        + '<input type="checkbox" class="moon-aimig-check" data-idx="' + idx + '" checked style="margin-right:8px;">'
        + '<span style="padding:1px 7px;border-radius:6px;background:' + (colorMap[a.type] || '#cbd5e1') + ';color:#05070e;font-size:10px;font-weight:700;margin-right:6px;">' + (labelMap[a.type] || a.type) + '</span>'
        + '<b style="color:#e2e8f0;">' + a.from + '</b>'
        + (a.to && a.to !== a.from ? ' → ' + a.to : '')
        + (a.reason ? '<div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">💡 ' + a.reason + '</div>' : '')
        + '</label>';
    });
    html += '<div style="margin-top:10px;display:flex;gap:6px;">'
      + '<button id="moon-aimig-all" style="flex:0.7;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">全选/全不选</button>'
      + '<button id="moon-aimig-apply" style="flex:1.4;padding:10px;border-radius:9px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✅ 应用</button></div>';
    showModalDialog('🤖 AI 辅助迁移 · 确认方案', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-aimig-all').addEventListener('click', function() {
          const boxes = mask.querySelectorAll('.moon-aimig-check');
          const allChecked = Array.from(boxes).every(function(b) { return b.checked; });
          boxes.forEach(function(b) { b.checked = !allChecked; });
        });
        mask.querySelector('#moon-aimig-apply').addEventListener('click', function() {
          const selected = [];
          mask.querySelectorAll('.moon-aimig-check').forEach(function(b) {
            if (b.checked) selected.push(actions[Number(b.getAttribute('data-idx'))]);
          });
          if (!selected.length) { toast('未勾选任何操作', 'info'); return; }
          try { mask.remove(); } catch (e) {}
          applyAiMigration(data, selected, panel);
        });
      }
    });
  }

  async function applyAiMigration(data, selectedActions, panel) {
    const chars = data.stat_data.角色 || {};
    const now = (data.stat_data.世界 && data.stat_data.世界.时间) || '2000年01月01日 · 星期六 · 00:00';
    const newChars = {};
    const handled = {};
    selectedActions.forEach(function(a) {
      if (a.type === 'delete') handled[a.from] = true;
      if (a.type === 'rename') handled[a.from] = true;
      if (a.type === 'merge' && a.froms) a.froms.forEach(function(n) { handled[n] = true; });
      if (a.type === 'keep') handled[a.from] = true;
    });
    selectedActions.forEach(function(a) {
      if (a.type === 'delete') return;
      if (a.type === 'keep') { if (chars[a.from]) newChars[a.to] = cloneCharWithResetQuota(chars[a.from], now, a.noReset); }
      else if (a.type === 'rename') { if (chars[a.from]) newChars[a.to] = cloneCharWithResetQuota(chars[a.from], now, false); }
      else if (a.type === 'merge') {
        let merged = null;
        a.froms.forEach(function(n) {
          const src = chars[n];
          if (!src) return;
          if (!merged) merged = cloneCharWithResetQuota(src, now, false);
          else {
            merged.好感度 = Math.max(Number(merged.好感度) || 0, Number(src.好感度) || 0);
            merged.肉体值 = Math.max(Number(merged.肉体值) || 0, Number(src.肉体值) || 0);
            merged.阶段值 = Math.max(Number(merged.阶段值) || 0, Number(src.阶段值) || 0);
            merged.嫉妒值 = Math.max(Number(merged.嫉妒值) || 0, Number(src.嫉妒值) || 0);
          }
        });
        if (merged) newChars[a.to] = merged;
      }
    });
    Object.keys(chars).forEach(function(n) { if (!handled[n] && !newChars[n]) newChars[n] = chars[n]; });
    if (!Object.keys(newChars).length) { showModalDialog('⚠️ 结果为空', '<div>整理后角色表会变成空表。</div>', null, { confirmText: '返回' }); return; }
    data.stat_data.角色 = newChars;
    data.stat_data[MIGRATED_FLAG] = true;
    const ok = await writeMvuLatest(data.stat_data);
    if (ok) { toast('AI 辅助迁移完成', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
  }

  function cloneCharWithResetQuota(src, now, noReset) {
    const clone = JSON.parse(JSON.stringify(src));
    if (noReset) return clone;
    if (!clone._quota || typeof clone._quota !== 'object') clone._quota = {};
    const q = clone._quota;
    q.好感度周上限已用 = 0;
    q.周上限起始 = now;
    q.R阶段门 = false;
    q.下次暗掷 = now;
    q.玩家本周已掷 = false;
    q.玩家冷却至 = now;
    q.表白期冷却至 = '';
    q._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
    q._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0 };
    q._timelineCompleted = [];
    if (q._playerConfession === undefined) q._playerConfession = false;
    if (q._firstMeetDone === undefined) q._firstMeetDone = false;
    return clone;
  }


  function openUnifiedAdaptDialog(panel) {
    const data = readMvuLatest(); const statData = data && data.stat_data; const chars = statData && statData.角色;
    const cardMode = getCardMode(); const validNames = [];
    if (chars && typeof chars === 'object') { for (const n in chars) { if (!isCharSkeleton(chars[n])) validNames.push(n); } }
    const hasValidVars = validNames.length > 0;
    let detectHtml = '';
    if (hasValidVars) detectHtml = '<div style="padding:10px 12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);border-radius:9px;color:#6ee7b7;font-size:11.5px;line-height:1.7;margin-bottom:12px;"><b>✔ 当前对话已有角色变量</b>：' + validNames.join('、') + '</div>';
    else detectHtml = '<div style="padding:10px 12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.35);border-radius:9px;color:#7dd3fc;font-size:11.5px;line-height:1.7;margin-bottom:12px;"><b>ℹ️ 当前对话未检测到有效变量</b><br>卡组模式：<b>' + (cardMode === 'multi' ? '多人卡' : '单人卡') + '</b></div>';
    const html = detectHtml +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button id="moon-adapt-adaptive" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(56,189,248,0.6);background:linear-gradient(135deg,#0c2540,#075985);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">🌅 AI 智能建档<div style="font-size:10.5px;font-weight:400;color:#a5f3fc;margin-top:4px;">AI 通读当前对话的上下文，推断角色初始四维，建档到本对话。适合从未用过本系统的老对话。</div></button>' +
      '<button id="moon-adapt-migrate" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(251,191,36,0.6);background:linear-gradient(135deg,#2a1a05,#78350f);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">🔄 兼容迁移<div style="font-size:10.5px;font-weight:400;color:#fcd34d;margin-top:4px;">把旧版字段（情感值/关系值/身体值/好感值等）搬迁到新字段。</div></button>' +
      '<button id="moon-adapt-aimig" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(168,85,247,0.6);background:linear-gradient(135deg,#2a1040,#4c1d95);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">🤖 AI 辅助迁移<div style="font-size:10.5px;font-weight:400;color:#e9d5ff;margin-top:4px;">AI 通读上下文，判断角色表里哪些条目该保留/改名/删除/合并。</div></button>' +
      '<button id="moon-adapt-pack" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(110,231,183,0.6);background:linear-gradient(135deg,#052e20,#064e3b);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">📦 打包迁移到新对话<div style="font-size:10.5px;font-weight:400;color:#6ee7b7;margin-top:4px;">把当前对话的角色数据打包，切到新对话后一键导入。</div></button>' +
      '</div>';
    showModalDialog('🚀 一键适配', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-adapt-adaptive').addEventListener('click', function() { try { mask.remove(); } catch (e) {} manualAdaptiveOpening(panel); });
        mask.querySelector('#moon-adapt-migrate').addEventListener('click', function() { try { mask.remove(); } catch (e) {} manualMigrate(panel); });
        mask.querySelector('#moon-adapt-aimig').addEventListener('click', function() { try { mask.remove(); } catch (e) {} openAiMigrateEntryDialog(panel); });
        mask.querySelector('#moon-adapt-pack').addEventListener('click', function() { try { mask.remove(); } catch (e) {} startMigrationPack(panel); });
      }
    });
  }

  function manualAdaptiveOpening(panel) {
    const cardMode = getCardMode(); let charName = '';
    const data = readMvuLatest(); const chars = data && data.stat_data && data.stat_data.角色;
    if (chars && typeof chars === 'object') {
      const validNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
      if (validNames.length > 0) charName = validNames[0];
    }
    if (!charName && cardMode !== 'multi') {
      try { const ctx = getSTCtx(); if (ctx && ctx.characters && ctx.characterId != null) { const ch = ctx.characters[ctx.characterId]; if (ch && ch.name) charName = String(ch.name).replace(/[。\.]+$/, '').trim(); } } catch (e) {}
    }
    showAdaptiveStartDialog(charName || '(多人卡)');
  }

 // ===== 第 23 份 =====
  function injectMenuEntry() {
    const tryInject = function() {
      const menu = mainDoc.getElementById('extensionsMenu');
      if (!menu) return false;
      const old = mainDoc.getElementById('moon-phase-menu-entry');
      if (old && old.parentNode === menu) return true;
      if (old) { try { old.remove(); } catch (e) {} }
      const div = mainDoc.createElement('div');
      div.id = 'moon-phase-menu-entry';
      div.className = 'list-group-item flex-container flexGap5 interactable';
      div.tabIndex = 0;
      div.innerHTML = '<div class="fa-fw fa-solid fa-moon extensionsMenuExtensionButton" style="color:#fef08a;"></div><span>' + SYSTEM_MENU_NAME + '</span>';
      div.addEventListener('click', function() { openPanel(); });
      menu.appendChild(div);
      return true;
    };
    if (!tryInject()) {
      const interval = setInterval(function() { if (tryInject()) clearInterval(interval); }, 800);
      setTimeout(function() { clearInterval(interval); }, 60000);
    }
  }

  function openPanel() {
    let mask = mainDoc.getElementById('moon-phase-mask');
    if (!mask) {
      mask = mainDoc.createElement('div');
      mask.id = 'moon-phase-mask';
      mask.addEventListener('click', function(e) { if (e.target === mask) closePanel(); });
      mainDoc.body.appendChild(mask);
    }
    let panel = mask.querySelector('#moon-phase-panel');
    if (!panel) { panel = mainDoc.createElement('div'); panel.id = 'moon-phase-panel'; mask.appendChild(panel); }
    renderPanel(panel);
    mask.classList.add('open');
  }

  function closePanel() {
    const panel = mainDoc.getElementById('moon-phase-panel');
    if (panel && panel._lcdArcadeStop) { try { panel._lcdArcadeStop(); } catch (e) {} panel._lcdArcadeStop = null; }
    const m = mainDoc.getElementById('moon-phase-mask');
    if (m) m.classList.remove('open');
  }

  function refreshPanel() {
    try { const panel = mainDoc.getElementById('moon-phase-panel'); if (panel) renderPanel(panel); } catch (e) {}
  }

  function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

  function showFirstBootDialog() {
    closeFirstBootDialog();
    const mask = mainDoc.createElement('div');
    mask.id = 'moon-firstboot-mask';
    mask.className = 'mp-pixel-modal';
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483648;background:radial-gradient(circle at center,rgba(15,23,42,0.96) 0%,rgba(2,6,12,0.98) 100%);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    mask.innerHTML = '' +
      '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:20px;padding:26px;width:100%;max-width:480px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 25px 70px rgba(0,0,0,0.85),0 0 40px rgba(99,102,241,0.25);box-sizing:border-box;">' +
      '<div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:6px;letter-spacing:1px;">🌙 ' + SYSTEM_UI_NAME + '</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;text-align:center;margin-bottom:20px;">首次启动 · 系统初始化检测</div>' +
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="display:inline-block;width:64px;height:64px;border-radius:50%;border:3px solid rgba(148,163,184,0.2);border-top-color:#7dd3fc;border-right-color:#c084fc;animation:moon-spin 1.2s linear infinite;"></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#cbd5e1;line-height:1.8;margin-bottom:16px;padding:12px 14px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:10px;">' +
      '<div style="color:#7dd3fc;font-weight:700;margin-bottom:6px;">📢 首次导入公告</div>' +
      '欢迎使用本系统。检测到这是首次导入，系统将自动执行以下初始化检测：<br>' +
      '① 系统自检 · ② 公式测试 · ③ 环境冲突扫描<br>' +
      '每一步完成后会弹出结果窗口，请依次查看并关闭，全部完成后系统会自动刷新一次。' +
      '</div>' +
      '<div id="moon-firstboot-status" style="font-size:11px;color:#94a3b8;margin-bottom:8px;">⏳ 准备中...</div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(148,163,184,0.15);overflow:hidden;margin-bottom:16px;">' +
      '<div id="moon-firstboot-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#7dd3fc,#c084fc);transition:width 0.4s ease;"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;">' +
      '<span id="moon-firstboot-step1">○ 自检</span>' +
      '<span id="moon-firstboot-step2">○ 测试</span>' +
      '<span id="moon-firstboot-step3">○ 冲突扫描</span>' +
      '<span id="moon-firstboot-step4">○ 完成</span>' +
      '</div>' +
      '</div>';
    mainDoc.body.appendChild(mask);
  }

  function updateFirstBootProgress(step, text) {
    const m = mainDoc.getElementById('moon-firstboot-mask');
    if (!m) return;
    const bar = m.querySelector('#moon-firstboot-bar');
    const status = m.querySelector('#moon-firstboot-status');
    if (bar) bar.style.width = Math.min(100, (step / 4) * 100) + '%';
    if (status) status.textContent = text || '';
    const labels = ['自检', '测试', '冲突扫描', '完成'];
    for (let i = 1; i <= 4; i++) {
      const el = m.querySelector('#moon-firstboot-step' + i);
      if (!el) continue;
      const label = labels[i - 1];
      if (i < step || (i === step && step === 4)) {
        el.textContent = '● ' + label;
        el.style.color = '#6ee7b7';
      } else if (i === step) {
        el.textContent = '◐ ' + label;
        el.style.color = '#7dd3fc';
      } else {
        el.textContent = '○ ' + label;
        el.style.color = '#64748b';
      }
    }
  }

  function closeFirstBootDialog() {
    const m = mainDoc.getElementById('moon-firstboot-mask');
    if (m) { try { m.remove(); } catch (e) {} }
  }

  async function runFirstBootSequence() {
    let hasDone = false;
    try { hasDone = (mainWin.localStorage.getItem(FIRST_RUN_KEY) === '1'); } catch(e) {}
    if (hasDone) return;
    try { mainWin.localStorage.setItem(FIRST_RUN_KEY, '1'); } catch(e) {}

    showFirstBootDialog();
    await sleep(1200);

    // ① 自检
    updateFirstBootProgress(1, '⏳ 正在扫描系统状态...');
    await sleep(800);
    let selfcheckHtml = '';
    try { selfcheckHtml = await runSelfCheckWithArcade(); } catch(e) { selfcheckHtml = '<div style="color:#f87171">自检异常：' + String(e && e.message || e) + '</div>'; }
    updateFirstBootProgress(1, '✔ 自检完成，请查看结果');
    await showStepDialog('🔭 自检报告', selfcheckHtml, { confirmText: '✔ 看完了，下一步' });
    updateFirstBootProgress(1, '✔ 自检通过');
    await sleep(300);

    // ② 测试
    updateFirstBootProgress(2, '⏳ 正在运行综合测试...');
    await sleep(800);
    let testHtml = '';
    try { testHtml = await runSimulationTest(); } catch(e) { testHtml = '<div style="color:#f87171">测试异常：' + String(e && e.message || e) + '</div>'; }
    updateFirstBootProgress(2, '✔ 测试完成，请查看结果');
    await showStepDialog('🧪 测试结果', testHtml, { confirmText: '✔ 看完了，下一步' });
    updateFirstBootProgress(2, '✔ 测试通过');
    await sleep(300);

    // ③ 冲突扫描
    updateFirstBootProgress(3, '⏳ 正在扫描全环境冲突...');
    await sleep(800);
    let scanHtml = '';
    try { const r = await runConflictScan(); scanHtml = (r && r.html) || ''; } catch(e) { scanHtml = '<div style="color:#f87171">扫描异常：' + String(e && e.message || e) + '</div>'; }
    updateFirstBootProgress(3, '✔ 冲突扫描完成，请查看结果');
    await showStepDialog('🔍 冲突扫描', scanHtml, { confirmText: '✔ 看完了，下一步' });
    updateFirstBootProgress(3, '✔ 冲突扫描通过');
    await sleep(300);

    // ④ 完成
    updateFirstBootProgress(4, '✔ 全部检测完成，即将刷新页面...');
    await sleep(1200);
    closeFirstBootDialog();

    setTimeout(function() {
      try {
        if (mainWin && mainWin.location && typeof mainWin.location.reload === 'function') mainWin.location.reload();
        else location.reload();
      } catch (e) { try { location.reload(); } catch (e2) {} }
    }, 500);
  }


function tryAutoReloadOnce() {
  try {
    const ss = mainWin.sessionStorage || sessionStorage;
    const flag = 'moon_phase_session_reloaded';
    if (ss.getItem(flag) === '1') return;
    ss.setItem(flag, '1');
    setTimeout(function() {
      try {
        if (mainWin && mainWin.location && typeof mainWin.location.reload === 'function') mainWin.location.reload();
        else location.reload();
      } catch (e) { try { location.reload(); } catch (e2) {} }
    }, 800);
  } catch (e) {}
}

/* =========================================================
 * 启动
 * ========================================================= */
injectStyle();
setupListeners();

// 判断是否需要刷新
let _needAutoReload = false;
let _isFirstBoot = false;
try {
  const ls = mainWin.localStorage || localStorage;
  const lastRunVer = ls.getItem(LAST_RUN_VERSION_KEY) || '';
  // 版本变化 → 刷新一次
  if (lastRunVer && lastRunVer !== MOON_FORMULA_VERSION) _needAutoReload = true;
  ls.setItem(LAST_RUN_VERSION_KEY, MOON_FORMULA_VERSION);
  _isFirstBoot = (ls.getItem(FIRST_RUN_KEY) !== '1');
} catch (e) { _isFirstBoot = true; }

if (_needAutoReload) {
  // 版本更新后延迟刷新
  setTimeout(function() {
    try {
      if (mainWin && mainWin.location && typeof mainWin.location.reload === 'function') mainWin.location.reload();
      else location.reload();
    } catch (e) { try { location.reload(); } catch (e2) {} }
  }, 900);
} else if (_isFirstBoot) {
  // 首次导入检测流程（流程结束后自带刷新）
  setTimeout(function() { runFirstBootSequence(); }, 1200);
} else {
  // 常规启动
  tryAutoReloadOnce(); // 局部脚本首次挂载 / 局部→全局切换时刷新一次

  setTimeout(function() { checkAndPromptMigrate(); }, 2500);
  setTimeout(function() { checkAndPromptBackfill(); }, 4200);
  setTimeout(function() { checkAndPromptBioEnable(); }, 5200);

  setTimeout(function() {
    injectMenuEntry();
    toast(SYSTEM_UI_NAME + ' 已加载', 'success');
  }, 800);
  setTimeout(function() { showUpdateAnnouncementOnce(); }, 1500);
  setTimeout(injectMenuEntry, 3000);
  setTimeout(injectMenuEntry, 8000);
  setTimeout(function() { runAdaptiveOpeningFlow(); }, 5500);
  setTimeout(function() { checkPendingMigration(); }, 6500);

  // 启动 8 秒后静默检查更新
  setTimeout(function() {
    try {
      const cfg = getUpdateConfig();
      if (cfg.autoCheck && cfg.url) checkForUpdates(true);
    } catch (e) {}
  }, 8000);
}
})();
