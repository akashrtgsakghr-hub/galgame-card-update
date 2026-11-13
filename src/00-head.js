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
  const MOON_FORMULA_VERSION = '5.7.1';
  const MOON_FORMULA_CHANGELOG = "【v5.7.1 小地图 · 妈妈那张手绘图】\n" +
  "1. 屏里左上角多了一扇「手绘地图」窗：开局是空的，你走过的地方它自己一格格画出来，中间那个一闪一闪的方块就是你。\n" +
  "2. 位置不是读内存读来的。核心只导出 4 个内存符号（ROM / 存档 / 帧缓冲 / 金手指），没有 RAM 出口；就算从 wasm 堆里认出工作内存，坐标与地图编号的偏移每个改版都要重新标定。所以改成看画面：站住时镜头正好落在 16px 格线上，把每一帧按格对齐拼进一张大图，靠像素差判断「对上了 / 换地图了」。\n" +
  "3. 进新地图（森林、洞窟、楼梯下面、解谜层）自动翻页；上一页最后落脚的地方标「出口」，进来的地方标「入口」。标题栏 – 收起、↺ 换一张白纸；「地图」按钮开关，也可以设成不自动翻开。\n" +
  "4. 剧情上它是妈妈塞鞋时顺手给的那张；机制上它是掌机这一层照着画面描的——卡带里的道具表、名字表、发放脚本都没有源码，真道具塞不进去，所以不假装是游戏内道具。第一次翻开有她的一张便条，读完记在本机。\n" +
  "5. 拆件：算法与状态机 pocket.08-map-core.js（纯像素函数 + 状态机，不碰 DOM），取帧与绘制 pocket.09-map-ui.js，样式 pocket.05-map.css。回归 node tools/verify-map.mjs 22/22（合成帧，含走位、翻页、贴边挪图、对话框与 HUD 判据），真卡带联调 node tools/probe-map-live.mjs（真像素平移验证）。\n" +
  "6. 两个坑写进注释：改版底部常驻的深色 HUD 不能当成对话框（判据加了「亮不亮」，否则一张图都画不出来）；玩家立绘那块要挖洞，否则小人会被烙进地图。\n" +
  "7. 攻略「这台机器」册加了一节：小地图怎么用，以及它做不到的三件事——不是官方全图、单屏房间点位会偏、画面被对话框挡住时不画。\n" +
  "8. 收尾三处：一步没走过的残页（开场白、过场、菜单）不再占页数，地图册里只留真走过的；小窗视野往上偏两格，避开底部那条没拼进去的 HUD，顺便多看一眼前面；对外多了个 map.feed() 调试入口，联调脚本拿真画面平移就能验走位。\n" +
  "9. 回归 23/23（多了「残页不作数」一条），掌机 68/68、攻略 31/31、面板合并 19/19（F5d / S6b 是 5.0.0 起就有的存量失败，与本次无关）。";

  // 默认更新源走国内反代：不挂梯子也能连上，缓存只有秒级——推完立刻能查到（实测 93ms）。
  // 官方直连排在它后面：挂了梯子的机器走 raw 更可信，但国内不挂梯子时它基本不通。
  const DEFAULT_UPDATE_URL = 'https://gh-proxy.com/https://raw.githubusercontent.com/akashrtgsakghr-hub/galgame-card-update/main/moon-phase.js';
  const OLD_DEFAULT_UPDATE_URL = 'https://raw.githubusercontent.com/akashrtgsakghr-hub/galgame-card-update/main/moon-phase.js';
  const LEGACY_DEFAULT_UPDATE_URL = 'https://cdn.jsdelivr.net/gh/akashrtgsakghr-hub/galgame-card-update@main/moon-phase.js';
  const LAST_TIME_KEY = 'moon_phase_last_world_time';
  const LAST_JUMP_FLOOR_KEY = 'moon_phase_last_jump_floor';
  const LAST_GAME_DAY_KEY = 'moon_phase_last_game_day'; // 旧版全局键，现已迁移为世界存档字段，不再参与结算。
  const FATE_BACKUP_KEY = 'moon_phase_fate_backup';
  const AUTORELOAD_KEY = 'moon_phase_autoreload_pending';
  const BACKFILL_PROMPT_KEY = 'moon_phase_backfill_prompted_chats';
  const FIRST_RUN_KEY = 'moon_phase_first_run_done_v1';
  const AUTO_RELOAD_DONE_KEY = 'moon_phase_auto_reload_done_v1';
  const ANNOUNCEMENT_SEEN_KEY = 'moon_phase_announcement_seen_v2';
  const LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY = 'moon_phase_last_update_announcement_version';
  const SELF_CHECK_ARCADE_SEEN_KEY = 'moon_phase_self_check_arcade_seen_v1';
  const ARCADE_CHAT_RECORD_KEY = 'moon_phase_arcade_record_v1';
  const MOON_POCKET_SAVES_KEY = 'moon_phase_pocket_saves_v1';
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
  /* 正式名称：面板抬头用主名 + 副名两行拼出完整名称，别处（公告 / 导出 / 自检）直接用全文。 */
  const SYSTEM_UI_NAME = 'Doki♥Doki！我要成为后宫王！～为了全CG全结局全要素收集而向全世界告白的大作战～';
  const SYSTEM_MENU_NAME = 'Doki♥Doki！我要成为后宫王！';
  const SYSTEM_MENU_SUB = '～为了全CG全结局全要素收集而向全世界告白的大作战～';
  /* 旧名只用于「认出这是个老安装」：脚本改名、世界书指纹、老存档迁移都还要认它。 */
  const SYSTEM_LEGACY_NAMES = ['月相系统', '🌕 月相系统', 'Galgame攻略系统'];
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
    turnMinutes: 10, autoBootstrap: true, coreRules: 'auto', glossary: 'auto',
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

