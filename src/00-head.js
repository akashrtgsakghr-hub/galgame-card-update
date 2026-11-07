/* 00-head.js —— 启动头：全局常量、localStorage key、版本号与更新公告。
   本文件是 src/ 片段，由 scripts/build.mjs 按文件名顺序拼成 moon-phase.js，不能单独运行。 */
(function() {
  const mainDoc = (window.parent && window.parent.document) ? window.parent.document : document;
  const mainWin = window.parent || window;
  function getStorage() {
    try { if (mainWin && mainWin.localStorage) return mainWin.localStorage; } catch (e) {}
    try { if (window.localStorage) return window.localStorage; } catch (e) {}
    return null;
  }

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
  const MOON_FORMULA_VERSION = '4.7.6';
  const MOON_FORMULA_CHANGELOG = "【v4.7.6 初见投资真正落地 · 数值方案定型】\n1. 🎲 自动建档当场就掷初见骰：不再等下一轮 AI 会不会写 [初见|…]。建档完成的那一刻，人物就已经有起点，不再是 0 一路干爬。\n2. 💰 初见失败也给 1d4 印象底分：以前失败 E 一分不加、却照样标记「已初见」，等于把开局投资永久作废。面板可关。\n3. 🧭 一个 [初见|…] 标签只给一个人用：同一轮里有刚建档的新人时，标签优先给新人，老存档角色不许截胡，多人卡不再出现「新人只能吃兜底档位」。\n4. 🔁 兜底补掷：建档时写入失败、或人还没到场，标记会留着；之后哪一轮点到他的名字就地补掷，不会永久错过。\n5. 🤝 数值方案定为「AI 评档位 + 脚本掷骰」：AI 只判断玩家设定踩中了哪些喜好（0/+3/+6/+9），最终数字永远由 1d20 掷出。AI 直接给数值会漂移、不可复现，也会把「唯一事实来源」交回模型。面板可在「骰子+AI」与「纯骰子」间切换。\n6. 📐 初见的阶段值改为由好感度推导：以前成功分支硬写 R=1，会出现「E=3 却显示愿意认识」的自相矛盾。\n7. 🗂 角色定位面板逐个显示初见结果（骰点／档位／投入／来源）；自己往变量里加的人可以点「🎲 补掷」手动补一次，不用等下一轮。\n8. 🧾 开局适配给出非 0 好感时直接标记「已结算」，避免 AI 估完再被初见骰二次加成。\n9. 🔍 自检新增「初见投资」一行：谁结算了、骰点多少、档位从哪来、还剩谁待结算。\n10. 🧪 新增 F 系列 16 条回归用例，全套 17 个测试套件全部通过。";
  const DEFAULT_UPDATE_URL = 'https://raw.githubusercontent.com/akashrtgsakghr-hub/galgame-card-update/main/moon-phase.js';
  const LEGACY_DEFAULT_UPDATE_URL = 'https://cdn.jsdelivr.net/gh/akashrtgsakghr-hub/galgame-card-update@main/moon-phase.js';
  const LAST_TIME_KEY = 'moon_phase_last_world_time';
  const LAST_JUMP_FLOOR_KEY = 'moon_phase_last_jump_floor';
  const LAST_GAME_DAY_KEY = 'moon_phase_last_game_day';
  const FATE_BACKUP_KEY = 'moon_phase_fate_backup';
  const AUTORELOAD_KEY = 'moon_phase_autoreload_pending';
  const BACKFILL_PROMPT_KEY = 'moon_phase_backfill_prompted_chats';
  const FIRST_RUN_KEY = 'moon_phase_first_run_done_v1';
  const AUTO_RELOAD_DONE_KEY = 'moon_phase_auto_reload_done_v1';
  const ANNOUNCEMENT_SEEN_KEY = 'moon_phase_announcement_seen_v2';
  const LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY = 'moon_phase_last_update_announcement_version';
  const SELF_CHECK_ARCADE_SEEN_KEY = 'moon_phase_self_check_arcade_seen_v1';
  const ARCADE_CHAT_RECORD_KEY = 'moon_phase_arcade_record_v1';
  const LEGACY_ARCADE_HIGH_SCORE_KEY = 'moon_phase_arcade_high_score_v1';
  const GALLERY_STORAGE_KEY = 'moon_phase_cg_gallery_v1';
  const ENDING_STORAGE_KEY = 'moon_phase_endings_v1';
  const ACHIEVEMENT_TRIGGER_KEY = 'moon_phase_achievement_triggers_v1';
  const IMAGE_CONFIG_KEY = 'moon_phase_image_gen_config_v1';
  const CG_STYLE_PRESETS_KEY = 'moon_phase_cg_style_presets_v1';
  const GALLERY_DB_NAME = 'moon_phase_gallery_images_v1';
  const BIO_ASKED_CHATS_KEY = 'moon_phase_bio_asked_chats';
  const USER_BIO_LIBRARY_KEY = 'moon_phase_user_bio_library';
  const USER_BIO_PROMPT_KEY = 'moon_phase_user_bio_injected';
  const CUSTOM_AI_CONFIG_KEY = 'moon_phase_custom_ai_config';
  const LOCAL_STATE_KEY = 'moon_phase_local_state';
  const SYSTEM_UI_NAME = 'Doki♥Doki！我要成为后宫王！～为了全CG全结局全要素收集而向全世界告白的大作战～';
  const SYSTEM_MENU_NAME = '月相系统';
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
    mode: 'hell', antisl: true, extraModel: 'off', cardMode: 'single', safetyLock: true,
    eventPacing: 'And', timelineTag: '', fanficEnhance: false, introSeen: false,
    panelAutoOpened: false, autoReload: true, epilogueTargetWords: 8000, galleryRetentionDays: 0,
    turnMinutes: 10, autoBootstrap: true, coreRules: 'auto', glossary: 'auto', hideAiCot: true,
    /* 初见投资的数值怎么来：
       hybrid —— 骰子定数值，AI 只给「优势/劣势」档位（读过角色卡，判断人设契合度）
       dice   —— 全看骰子，AI 写什么档位都不采信
       firstMeetFloor：没过阈值也给 1d4 印象底分，避免建档完 E=0 一路干爬 */
    firstMeetMode: 'hybrid', firstMeetFloor: true
  };
  // 每轮默认推进分钟数（玩家没有明说时间时使用）
  const DEFAULT_TURN_MINUTES = 10;
  // 玩家「明确放行时间跳跃」的措辞；命中才允许跨天
  const TIME_GRANT_RE = /(?:\b次日\b|\b翌日\b|第二天|隔天|隔日|明天|明日|后天|大后天|下周|下个?星期|下个?月|过几天|几天后|数日后|[一两二三四五六七八九十\d]+\s*(?:天|日|个?星期|个?周|个?月)\s*(?:后|之后|以后)|睡到|睡一觉|过夜|天亮|到晚上|到晚些|傍晚见|晚上见|跳过|快进|时间跳到|直接到)/;
  // 正文里的叙事转场（AI 自己写的，视为已授权的转场）
  const NARRATIVE_TURN_RE = /(?:^|[\s。！？!?\n])(?:次日|翌日|隔日|隔天|第二天|夜幕降临|天色渐暗|转眼|一觉醒来)/;

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
    // 每种事件类型的基础值区间：注入时告诉 AI，结算时由脚本执行，AI 给超范围的值只取边界
    eventBaseRange: { 日常: [0.5, 2.0], 关键: [3.0, 5.0], 重大: [6.0, 10.0], 彩蛋: [6.0, 10.0] },
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
    easy: { name: '简单', glyph: '🌕', title: '满月', quota: '10.0', detail: '加分最多、也不容易翻脸。想慢慢谈恋爱的卡选这个。' },
    normal: { name: '普通', glyph: '🌗', title: '下弦月', quota: '7.0', detail: '加分适中，日常和冲突都能跑。不知道选哪个就选这个。' },
    hard: { name: '困难', glyph: '🌙', title: '峨眉月', quota: '5.0', detail: '每周能加的分更少，更难哄。适合冲突多、节奏快的卡。' },
    hell: { name: '地狱', glyph: '🌑', title: '新月', quota: '3.0', detail: '加分最少，而且默认锁剧情（回不了头）。适合重度虐恋、黑深残的卡。' }
  };
  const ARCADE_DIFFICULTY_HINTS = {
    easy: '低速巡航 · 适合熟悉操作',
    normal: '标准速度 · 推荐节奏',
    hard: '高速运行 · 反应挑战',
    hell: '极速挑战 · 障碍更密'
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
    return { 事件类型: lr.事件类型, 方向: lr.方向, 主维度: lr.主维度, 基础值: lr.基础值, _脚本校准: lr._脚本校准 || null, _applied: lr._applied === true, _turnSig: lr._turnSig || '' };
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

