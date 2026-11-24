/* 90-reverse-mode.js —— 攻略模式核心（设置 / 双账本 / 积分 / buff / 提示注入 / 结算挂点）

   本功能按域拆成 6 片，改哪块只看那个文件：
     90-reverse-mode.js    这里：设置、双账本、积分与券、签到、泄漏清洗、buff、提示注入、afterCalc
     90c-reverse-items.js  道具：定义池、货架、图鉴、转盘、购买与使用
     90d-reverse-task.js   任务：库、生成推进结算、失败扣分、[板] 任务板、给她派活
     90e-reverse-punish.js 整活：猫娘病毒的文案 / 触发 / 解除 / 面板设置块
     90f-reverse-ui.js     面板：两版页签、渲染、事件委托
     90g-reverse-extra.js  周边：成就、纪念日与节日、Token 估算
     （90b-reverse-hud.js 是状态栏悬浮窗，独立一片）

   设计铁律：
   ① 两边账本、库存、货架完全独立，只共用「道具定义池」。
   ② 两边互相不可见：正文出现系统词一律清洗，提示里也不许 AI 说破。
   ③ 道具不直接改 E/P/R/I，只产出 buff 标记，由注入 / 结算读取。
   ④ 角色侧积分 = floor(累计正向 E × 5)；道具加成不进这条链路。
   ⑤ reverse 关闭时所有新功能静默：不注入、不清洗、不刷新、不报错。

   状态落点：
     全局   moon_reverse_settings_v1 / moon_reverse_itemlib_v1::<卡名>
     聊天   moon_reverse_role_v1 / moon_reverse_player_v1 */

const REVERSE_SETTINGS_KEY = 'moon_reverse_settings_v1';
const REVERSE_ROLE_KEY = 'moon_reverse_role_v1';
const REVERSE_PLAYER_KEY = 'moon_reverse_player_v1';
const REVERSE_ITEMLIB_KEY = 'moon_reverse_itemlib_v1';
const REVERSE_UI_TAB_KEY = 'moon_reverse_ui_tab';
const REVERSE_CODEX_TAB_KEY = 'moon_reverse_codex_tab';

const REVERSE_RARITY = {
  common:    { name: '普通', weight: 60, price: 20,   color: '#94a3b8', permanent: false, shelf: true,  stock: 3 },
  rare:      { name: '稀有', weight: 30, price: 80,   color: '#7dd3fc', permanent: false, shelf: true,  stock: 3 },
  legendary: { name: '传说', weight: 9,  price: 300,  color: '#c084fc', permanent: false, shelf: true,  stock: 1 },
  gem:       { name: '宝石', weight: 1,  price: 1000, color: '#fde047', permanent: true,  shelf: false, stock: 1 }
};
/* AI 不许自由生成 effect.type，只认这五个 */
const REVERSE_EFFECT_TYPES = ['buff', 'debuff', 'task_item', 'narrative', 'permanent'];

const REVERSE_SHELF_GAME_DAYS = 3;
const REVERSE_SHELF_REAL_COOLDOWN = 3 * 3600 * 1000;
const REVERSE_SHELF_SIZE = 6;
const REVERSE_GEM_PRICE = 1000;
const REVERSE_PROMPT_KEY = PROMPT_KEY + '_reverse';
const REVERSE_PLAYER_PROMPT_KEY = PROMPT_KEY + '_reverse_act';

/* ── 基础工具 ─────────────────────────────────────────── */
function rvEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}
function rvNum(v, d) { const n = Number(v); return isFinite(n) ? n : (d || 0); }
function rvNow() { return Date.now(); }
function rvGameDay() {
  try {
    const d = readMvuLatest();
    const w = d && d.stat_data && d.stat_data.世界;
    return Math.max(0, Math.floor(rvNum(w && w._游戏日, 0)));
  } catch (e) { return 0; }
}
function rvGameTime() {
  try {
    const d = readMvuLatest();
    const w = d && d.stat_data && d.stat_data.世界;
    return String((w && w.时间) || '');
  } catch (e) { return ''; }
}
function rvPad(n) { return String(n).padStart(2, '0'); }
function rvDateKey(ts) {
  const d = new Date(ts || Date.now());
  return d.getFullYear() + '-' + rvPad(d.getMonth() + 1) + '-' + rvPad(d.getDate());
}
function rvMonthDay(ts) {
  const d = new Date(ts || Date.now());
  return rvPad(d.getMonth() + 1) + '-' + rvPad(d.getDate());
}
function rvTodayKey() { return rvDateKey(Date.now()); }
function rvYesterdayKey() { return rvDateKey(Date.now() - 86400000); }
function rvHourMs(n) { return Math.max(1, rvNum(n, 12)) * 3600 * 1000; }

/* ── 设置：四个认知开关 + 整活惩罚 ─────────────────────── */
/* 失败惩罚整活（nyankoPunish）的三档时长：
   off      —— 永远是 punishHours 小时
   escalate —— 第一次 punishHours 小时，之后再中就是终身（默认）
   always   —— 反攻略模式下第一次就终身
   为什么不是一个固定值：玩家对「12 小时」和「终身」的期待差太远，与其替他决定，
   不如把这三档摆出来，规则写进提示词让角色也知道自己头上悬的是哪一档。 */
const REVERSE_PUNISH_FOREVER = ['off', 'escalate', 'always'];
const REVERSE_PUNISH_DEFAULT_TEXT = '跪坐在原地等对方回来，不许解释，也不许替自己找理由。';

function getReverseSettings() {
  const d = {
    enabled: false, userKnowsOwn: true, charKnowsPlayerSys: false, userKnowsCharSys: false, hud: true,
    /* 失败惩罚整活 */ nyankoPunish: false,
    punishText: '',          /* 玩家自定义的惩罚演出，空 = 用内置文案 */
    punishStreak: 3,         /* 连续失败几次触发猫娘病毒 */
    punishHours: 12,         /* 病毒时长 */
    punishForever: 'escalate'/* off / escalate / always */
  };
  try {
    const raw = getStorage() && getStorage().getItem(REVERSE_SETTINGS_KEY);
    if (raw) return Object.assign(d, JSON.parse(raw) || {});
  } catch (e) {}
  return d;
}
function saveReverseSettings(patch) {
  const next = Object.assign(getReverseSettings(), patch || {});
  try { const s = getStorage(); if (s) s.setItem(REVERSE_SETTINGS_KEY, JSON.stringify(next)); } catch (e) {}
  return next;
}
function isReverseModeOn() { return getReverseSettings().enabled === true; }

/* ── 双账本 ─────────────────────────────────────────── */
function defaultRoleState() {
  return {
    points: 0, ledger: [], inventory: {}, shelf: [], gemShelf: [],
    shelfRefreshAt: 0, shelfGameDay: 0,
    task: null, buffs: [], wheelTickets: 0,
    accumPositiveE: 0, pointsAwarded: 0, awardedGates: [],
    taskDone: 0, taskFailed: 0, taskRounds: 0,
    /* 失败惩罚整活：连败计数 / 待演出的惩罚 / 病毒中过几次 */
    failStreak: 0, punishPending: null, nyankoCount: 0
  };
}
function defaultPlayerState() {
  return {
    points: 0, ledger: [], inventory: {}, shelf: [], gemShelf: [],
    shelfRefreshAt: 0, shelfGameDay: 0,
    task: null, buffs: [], wheelTickets: 0,
    signIn: { lastDate: '', streak: 0, lastTs: 0 },
    arcadeTotalScore: 0, arcadePointsAwarded: 0,
    achievements: {}, seenItems: {},
    anniversaries: [], activeEvents: [], birthday: '',
    earnedTotal: 0, ticketMilestone: 0, eventCheckAt: 0, coldWarSeen: {},
    pendingTexts: [], taskDone: 0, taskFailed: 0, taskRounds: 0,
    taskOffers: [], offerSeen: {}
  };
}
function rvNormalizeState(raw, def) {
  const st = Object.assign(def, raw && typeof raw === 'object' ? raw : {});
  ['ledger', 'shelf', 'gemShelf', 'buffs', 'awardedGates', 'anniversaries', 'activeEvents', 'pendingTexts', 'taskOffers'].forEach(function(k) {
    if (!Array.isArray(st[k])) st[k] = [];
  });
  ['inventory', 'achievements', 'seenItems', 'coldWarSeen', 'offerSeen'].forEach(function(k) {
    if (!st[k] || typeof st[k] !== 'object') st[k] = {};
  });
  if (!st.signIn || typeof st.signIn !== 'object') st.signIn = { lastDate: '', streak: 0, lastTs: 0 };
  return st;
}
function getRoleState() { return rvNormalizeState(readChatFeatureValue(REVERSE_ROLE_KEY, null), defaultRoleState()); }
function getPlayerState() { return rvNormalizeState(readChatFeatureValue(REVERSE_PLAYER_KEY, null), defaultPlayerState()); }
function saveRoleState(st) { writeChatFeatureValue(REVERSE_ROLE_KEY, st); return st; }
function savePlayerState(st) { writeChatFeatureValue(REVERSE_PLAYER_KEY, st); return st; }

function pushLedger(st, delta, reason) {
  if (!st || !Array.isArray(st.ledger)) return;
  st.ledger.push({ at: rvNow(), delta: Math.round(rvNum(delta, 0)), reason: String(reason || '') });
  if (st.ledger.length > 80) st.ledger = st.ledger.slice(-80);
}

  /* ── 积分 / 签到 / 阶段券 ── */
/* ── 积分 ─────────────────────────────────────────────── */
/* 玩家积分统一入口：记 earnedTotal，并处理「每 50 分 +1 券」里程碑 */
function reverseAddPlayerPoints(st, n, reason) {
  const add = Math.round(rvNum(n, 0));
  if (!add) return 0;
  /* 加分时不再夹 0：副本失败会把余额扣成负数（见 90h 的 dungeonAddPoints），
     这里要是还 Math.max(0, ...)，欠费玩家点个签到就直接把债抹平了。
     扣分仍然夹 0 —— 除了副本，别的路径不该把余额扣穿。 */
  const cur = rvNum(st.points, 0);
  st.points = add > 0 ? (cur + add) : Math.max(0, cur + add);
  if (add > 0) {
    st.earnedTotal = rvNum(st.earnedTotal, 0) + add;
    const milestone = Math.floor(rvNum(st.earnedTotal, 0) / 50);
    if (milestone > rvNum(st.ticketMilestone, 0)) {
      const gain = milestone - rvNum(st.ticketMilestone, 0);
      st.ticketMilestone = milestone;
      st.wheelTickets = rvNum(st.wheelTickets, 0) + gain;
      pushLedger(st, 0, '里程碑：累计 ' + rvNum(st.earnedTotal, 0) + ' 分 · 券 +' + gain);
    }
  }
  pushLedger(st, add, reason);
  return add;
}
/* 角色侧：floor(累计正向 E × 5)，pointsAwarded 单调递增 */
function reverseSyncRolePoints(changedChars) {
  if (!isReverseModeOn()) return 0;
  const st = getRoleState();
  (changedChars || []).forEach(function(c) {
    if (!c || c.field !== '好感度') return;
    const d = Number(c.delta) || 0;
    if (d > 0) st.accumPositiveE = Math.round((rvNum(st.accumPositiveE, 0) + d) * 10) / 10;
  });
  const target = Math.floor(rvNum(st.accumPositiveE, 0) * 5);
  let gained = 0;
  if (target > rvNum(st.pointsAwarded, 0)) {
    gained = target - rvNum(st.pointsAwarded, 0);
    st.pointsAwarded = target;
    st.points = rvNum(st.points, 0) + gained;
    pushLedger(st, gained, '好感增长兑换');
  }
  saveRoleState(st);
  return gained;
}
/* 玩家侧：街机累计得分 ÷ 50，差额入账，无上限 */
function reverseSyncArcadePoints(totalScore) {
  if (!isReverseModeOn()) return 0;
  const st = getPlayerState();
  const score = Math.max(rvNum(st.arcadeTotalScore, 0), Math.floor(rvNum(totalScore, 0)));
  st.arcadeTotalScore = score;
  const target = Math.floor(score / 50);
  let gained = 0;
  if (target > rvNum(st.arcadePointsAwarded, 0)) {
    gained = target - rvNum(st.arcadePointsAwarded, 0);
    st.arcadePointsAwarded = target;
    reverseAddPlayerPoints(st, gained, '街机得分兑换');
  }
  savePlayerState(st);
  return gained;
}
function reverseGrantAchievement(id, title) {
  if (!isReverseModeOn() || !id) return false;
  const st = getPlayerState();
  if (st.achievements[id]) return false;
  st.achievements[id] = { at: rvNow(), title: String(title || id) };
  reverseAddPlayerPoints(st, 5, '成就：' + (title || id));
  savePlayerState(st);
  try { toast('成就解锁：' + (title || id) + ' · 积分 +5', 'success'); } catch (e) {}
  return true;
}

/* ── 签到 ─────────────────────────────────────────────── */
function reverseCanSignIn() {
  return getPlayerState().signIn.lastDate !== rvTodayKey();
}
function reverseDoSignIn() {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const st = getPlayerState();
  const today = rvTodayKey();
  if (st.signIn.lastDate === today) return { ok: false, reason: '今天已经签过了' };
  if (rvNum(st.signIn.lastTs, 0) && rvNow() < rvNum(st.signIn.lastTs, 0) - 3600000) {
    return { ok: false, reason: '系统时间异常，本次签到不计' };
  }
  const continuous = st.signIn.lastDate === rvYesterdayKey();
  st.signIn.streak = continuous ? rvNum(st.signIn.streak, 0) + 1 : 1;
  st.signIn.lastDate = today;
  st.signIn.lastTs = rvNow();

  let gained = 1;
  let tickets = 1;
  let bonus = '';
  const evActive = (st.activeEvents || []).some(function(e) { return e && e.perk === 'signin_plus' && rvNum(e.untilDay, 0) >= rvGameDay(); });
  if (evActive) { gained += 1; bonus += ' · 活动加成 +1'; }
  if (st.signIn.streak % 7 === 0) { gained += 5; tickets += 1; bonus += ' · 连签 ' + st.signIn.streak + ' 天，额外 +5 分 +1 券'; }
  st.wheelTickets = rvNum(st.wheelTickets, 0) + tickets;
  reverseAddPlayerPoints(st, gained, '每日签到（第 ' + st.signIn.streak + ' 天）');
  savePlayerState(st);
  try { toast('签到成功 · 积分 +' + gained + bonus, 'success'); } catch (e) {}
  return { ok: true, gained: gained, streak: st.signIn.streak, bonus: bonus };
}

/* ── 阶段突破：同角色同节点只给一次券 ─────────────────── */
function reverseGrantGateTickets(stageChangedChars) {
  if (!isReverseModeOn()) return 0;
  const st = getPlayerState();
  const data = readMvuLatest();
  const chars = (data && data.stat_data && data.stat_data.角色) || {};
  const nodes = [18, 38, 58, 78, 98];
  let granted = 0;
  (stageChangedChars || []).forEach(function(name) {
    const ch = chars[name];
    if (!ch) return;
    const E = rvNum(ch.好感度, 0);
    for (let i = 0; i < nodes.length; i++) {
      if (E < nodes[i]) break;
      const key = name + ':' + nodes[i];
      if (st.awardedGates.indexOf(key) >= 0) continue;
      st.awardedGates.push(key);
      st.wheelTickets = rvNum(st.wheelTickets, 0) + 1;
      granted++;
    }
  });
  if (granted > 0) {
    savePlayerState(st);
    try { toast('阶段突破 · 转盘券 +' + granted, 'success'); } catch (e) {}
  }
  return granted;
}

/* ── 双向泄漏清洗 ─────────────────────────────────────── */
const REVERSE_LEAK_RE = /[^。！？!?\n]*(?:攻略系统|系统商城|积分商城|任务面板|任务发布|系统提示音|绑定系统|系统通知|攻略任务|系统奖励|系统惩罚)[^。！？!?\n]*[。！？!?]?/g;
function sanitizeReverseLeak(text) {
  if (!isReverseModeOn()) return { text: String(text || ''), hit: 0 };
  const src = String(text || '');
  if (!src) return { text: src, hit: 0 };
  let hit = 0;
  const cleaned = src.replace(REVERSE_LEAK_RE, function() { hit++; return ''; }).replace(/\n{3,}/g, '\n\n').trim();
  if (hit > 0 && cleaned.replace(/\s+/g, '').length < 12) return { text: src, hit: 0 };
  return { text: cleaned, hit: hit };
}

/* ── 状态（buff） ─────────────────────────────────────── */
function getActiveBuffs(owner) {
  const st = owner === 'player' ? getPlayerState() : getRoleState();
  const now = rvNow();
  return (st.buffs || []).filter(function(b) {
    if (!b) return false;
    if (b.permanent || !b.expireAt) return true;
    return rvNum(b.expireAt, 0) > now;
  });
}
function reverseAddBuff(owner, buff) {
  if (!isReverseModeOn() || !buff || !buff.name) return false;
  const st = owner === 'player' ? getPlayerState() : getRoleState();
  if (!Array.isArray(st.buffs)) st.buffs = [];
  const exist = st.buffs.filter(function(b) { return b && b.key === buff.key; })[0];
  if (exist && !buff.stackable) {
    exist.expireAt = Math.max(rvNum(exist.expireAt, 0), rvNum(buff.expireAt, 0));
    exist.name = buff.name;
    exist.prompt = buff.prompt || exist.prompt;
  } else {
    st.buffs.push({
      key: String(buff.key || buff.name), name: String(buff.name),
      kind: buff.kind === 'debuff' ? 'debuff' : 'buff',
      prompt: String(buff.prompt || ''),
      permanent: buff.permanent === true,
      expireAt: buff.permanent ? 0 : (rvNum(buff.expireAt, 0) || (rvNow() + rvHourMs(12))),
      stackable: buff.stackable === true,
      at: rvNow()
    });
    if (st.buffs.length > 24) st.buffs = st.buffs.slice(-24);
  }
  if (owner === 'player') savePlayerState(st); else saveRoleState(st);
  return true;
}
function reverseTickBuffs() {
  if (!isReverseModeOn()) return 0;
  const now = rvNow();
  let removed = 0;
  ['role', 'player'].forEach(function(owner) {
    const st = owner === 'player' ? getPlayerState() : getRoleState();
    if (!Array.isArray(st.buffs)) return;
    const before = st.buffs.length;
    st.buffs = st.buffs.filter(function(b) { return b && (b.permanent || !b.expireAt || rvNum(b.expireAt, 0) > now); });
    const cut = before - st.buffs.length;
    if (cut > 0) { removed += cut; if (owner === 'player') savePlayerState(st); else saveRoleState(st); }
  });
  return removed;
}

  /* ── 提示注入（5.1 ~ 5.4） ── */
/* ── 提示注入（5.1 ~ 5.4） ────────────────────────────── */
/* 任务期间暂停随机事件：不改 processEventSystem 本体，换成一层拦截 */
let _reverseEventPausePatched = false;
function reversePatchEventPause() {
  if (_reverseEventPausePatched) return;
  try {
    if (typeof processEventSystem !== 'function') return;
    const origin = processEventSystem;
    processEventSystem = function() {
      try {
        if (isReverseModeOn()) {
          const role = getRoleState();
          const player = getPlayerState();
          if ((role.task && role.task.status === 'active') || (player.task && player.task.status === 'active')) return Promise.resolve(null);
        }
      } catch (e) {}
      return origin.apply(null, arguments);
    };
    _reverseEventPausePatched = true;
  } catch (e) {}
}
/* 只读诊断：随机事件暂停有没有装上、现在是不是该暂停 */
function reverseEventPauseState() {
  let active = false;
  try {
    const role = getRoleState();
    const player = getPlayerState();
    active = !!((role.task && role.task.status === 'active') || (player.task && player.task.status === 'active'));
  } catch (e) {}
  return { patched: _reverseEventPausePatched, active: active };
}
function reverseBuffPromptLines(owner) {
  const list = getActiveBuffs(owner);
  if (!list.length) return [];
  return list.slice(0, 6).map(function(b) {
    const permanent = b.permanent === true || !b.expireAt;
    const left = permanent ? '不会自己消失' : ('剩 ' + Math.max(1, Math.round((rvNum(b.expireAt, 0) - rvNow()) / 3600000)) + ' 小时');
    return b.name + '（' + left + '）：' + (b.prompt || b.name);
  });
}
/* 本轮「贴在最末尾」的那两句话：惩罚演出 + 玩家动作。两者都必须压到最后一条消息后面，
   所以合成一条发出去；谁先写谁在前，不互相覆盖（之前玩家动作和惩罚会各自写一次，
   后写的那次把前一次顶掉）。 */
const _reverseTailParts = { punish: '', action: '', status: '' };
function reverseFlushTail() {
  const txt = [_reverseTailParts.punish, _reverseTailParts.action, _reverseTailParts.status].filter(Boolean).join('\n');
  try { callSetPrompt(REVERSE_PLAYER_PROMPT_KEY, txt, 0, 0, false); } catch (e) {}
  return txt;
}
function injectReversePrompt() {
  try { reversePatchEventPause(); } catch (e) {}
  try {
    if (!isReverseModeOn()) {
      callSetPrompt(REVERSE_PROMPT_KEY, '', 0, 0, false);
      callSetPrompt(REVERSE_PLAYER_PROMPT_KEY, '', 0, 0, false);
      _reverseTailParts.punish = '';
      _reverseTailParts.action = '';
      _reverseTailParts.status = '';
      return false;
    }
    const rs = getReverseSettings();
    const role = getRoleState();
    const lines = [];
    lines.push('═══════════════════════════════════');
    lines.push('【秘密 · 只存在于你心里】');
    lines.push('你身上绑着一个只有你知道的东西。它给你分数、给你任务、给你能换到的东西。');
    lines.push('分数来自对方对你的好感增长；任务失败会有代价。');
    lines.push('铁律：');
    lines.push('① 你绝不能向对方提及、暗示、承认这个事物的存在。');
    lines.push('② 所有与它的交互只发生在内心独白和后台行里。');
    lines.push('③ 任务要你用行动去完成，不是用台词去宣布。');
    lines.push('当前积分：' + rvNum(role.points, 0));
    if (role.task && role.task.status === 'active') {
      const t = role.task;
      lines.push('当前任务：' + String(t.title).slice(0, 40) + '｜' + String(t.desc || '').slice(0, 80) +
        '｜剩 ' + rvNum(t.remaining, 0) + ' 回合｜奖励 ' + rvNum(t.reward, 0));
      if (t.needItem) {
        const need = getItemLibrary().items[t.needItem];
        if (need) lines.push('（还差一件东西：' + need.name + '）');
      }
      const kindMap = { e: '让对方的好感真的涨起来', turns: '把这件事维持几个回合', progress: '做到了就在后台行写：系统.任务=完成' };
      lines.push('判定方式：' + (kindMap[t.target.kind] || kindMap.progress));
    }
    const invKeys = Object.keys(role.inventory || {}).filter(function(k) { return rvNum(role.inventory[k], 0) > 0; });
    if (invKeys.length) {
      const lib = getItemLibrary();
      lines.push('手上的东西：' + invKeys.slice(0, 8).map(function(k) { return (lib.items[k] && lib.items[k].name) || k; }).join('、'));
    }
    const buffLines = reverseBuffPromptLines('role');
    if (buffLines.length) { lines.push('当前状态：'); buffLines.forEach(function(l) { lines.push('· ' + l); }); }
    /* 惩罚规则：她知道规则，但控制不住 —— 这是整活成立的前提，
       不告诉她自己中招了只会被当成「AI 突然卖萌」，说清楚才有羞耻感。 */
    if (rs.nyankoPunish) {
      const need = Math.max(1, Math.min(9, Math.round(rvNum(rs.punishStreak, 3))));
      const hours = Math.max(1, Math.round(rvNum(rs.punishHours, 12)));
      const mode = REVERSE_PUNISH_FOREVER.indexOf(String(rs.punishForever)) >= 0 ? String(rs.punishForever) : 'escalate';
      const forever = mode === 'always'
        ? '这一次就可能是永远的：只要你在这件事上失手，它就跟你一辈子。'
        : (mode === 'escalate'
          ? '第一次只持续 ' + hours + ' 小时；再犯一次，它就会跟着你一辈子。'
          : '它只会持续 ' + hours + ' 小时，不会跟你一辈子。');
      /* 已经在病毒状态里时，症状已经在「当前状态」那行写全了，这里不再重复一遍 ——
         同一段话写两次，模型反而会把它当布景忽略掉。 */
      const inVirus = (role.buffs || []).filter(function(b) {
        return b && b.key === 'nyanko_virus' && (b.permanent === true || rvNum(b.expireAt, 0) > rvNow());
      })[0] || null;
      lines.push('扣分规则：手上的事没做到，就扣分。这是唯一的实质代价。');
      if (rvNum(role.failStreak, 0) > 0) {
        lines.push('你已经连着 ' + rvNum(role.failStreak, 0) + ' 次没做到，再有 ' +
          Math.max(0, need - rvNum(role.failStreak, 0)) + ' 次' + (inVirus ? '，病毒就会再发作一次' : '就会中「猫娘病毒」') + '。');
      }
      if (inVirus) {
        const leftH = inVirus.permanent ? 0 : Math.max(1, Math.round((rvNum(inVirus.expireAt, 0) - rvNow()) / 3600000));
        lines.push('猫娘病毒正在你身上发作' + (inVirus.permanent ? '，不会再好了。' : '，还会持续约 ' + leftH + ' 小时。') +
          (mode === 'escalate' ? '再连败一轮，它就跟你一辈子。' : (mode === 'always' ? '它随时可能变成终身。' : '它不会跟你一辈子。')));
      } else {
        lines.push('猫娘病毒：连着 ' + need + ' 次没做到就会中。中了以后每一句她说出口的话（含心声）结尾都要带「喵」、' +
          '自称「人家」、说话夹着嗓子又软又飘，会不受控地撒娇；你清楚这不正常，也想忍，但忍不住。' + forever);
      }
      lines.push('这条规则是对方亲口定下的，你知道它，也躲不开它 —— 你正在反过来攻略对方。');
    }
    /* 上一次失败的「样子」：玩家写的那句话，必须在本轮开头演出来；
       演完就消费掉，不重复占下一轮的上下文。 */
    let punishLine = '';
    if (rs.nyankoPunish && role.punishPending) {
      const pp = role.punishPending;
      punishLine = '【本轮开头必须演】她上一件事没做到（' + String(pp.title || '').slice(0, 20) + '），挨了罚：' +
        String(pp.text || '').slice(0, 120) +
        '\n用两三句话演出这件事落到她身上的样子和她的反应。不要解释规则，不要提「惩罚」「任务」「系统」这些词，也不要复述这句话。';
      role.punishPending = null;
      saveRoleState(role);
    }
    /* 病毒生效期：规则写在上面那段里，但模型会忘，每轮末尾再钉一次。 */
    const virusNow = (role.buffs || []).filter(function(b) {
      return b && b.key === 'nyanko_virus' && (b.permanent === true || rvNum(b.expireAt, 0) > rvNow());
    })[0];
    _reverseTailParts.status = virusNow
      ? '【状态】你现在中着猫娘病毒：这一轮每一句话（含心声）结尾都要带「喵」，自称「人家」，说话是夹着嗓子的。这不是可选项。'
      : '';
    if (rs.charKnowsPlayerSys && rs.userKnowsCharSys) {
      lines.push('你隐约察觉对方身上也有类似的东西，但不确定是什么、也不知道它给你什么。');
      lines.push('你可以试探，但不要直接问「你是不是也有系统」这种话。');
    } else if (rs.charKnowsPlayerSys) {
      lines.push('你隐约察觉对方身上也有类似的东西，但不确定。');
    } else if (rs.userKnowsCharSys) {
      lines.push('你知道对方好像察觉到你有事瞒着，但你没打算解释。');
    }
    lines.push('后台行写法：需要上报任务进度时，单独一行写「系统.任务=完成」或「系统.任务=+1」，这行不会出现在正文里。');
    lines.push('任务板写法：正文结束后另起一行，只写一条：');
    lines.push('[板]标题|一句话说明|奖励积分|持续回合|需要进度');
    lines.push('例：[板]陪她走完这段路|她今天不想一个人回家|18|4|3');
    lines.push('标题不超过 10 个字，奖励 8~40，持续回合 2~6，需要进度 1~6。本轮没有合适的新任务就写：[板]无');
    lines.push('这一行玩家看不到（会被脚本收走），所以不要把它写进正文，也不要提到「任务板」这三个字。');
    lines.push('═══════════════════════════════════');
    callSetPrompt(REVERSE_PROMPT_KEY, lines.join('\n'), 0, 2, false);
    _reverseTailParts.punish = punishLine;
    reverseFlushTail();
    /* 惩罚只演一次，动作也是「本轮开场」，发完就清；下一轮重新攒。 */
    _reverseTailParts.punish = '';
    _reverseTailParts.action = '';
    /* 每轮生成前顺手刷一下挂件角标：上一条 AI 回复可能刚抛出新任务，
       球上那个黄点得亮起来，玩家才知道板上有活。 */
    try { reverseHudRefreshBadge(); } catch (e) {}
    return true;
  } catch (e) { return false; }
}
/* 玩家刚用掉一件东西 / 买了什么：把这句话挂在本轮请求的最末尾。
   玩家点了「使用」，AI 就必须在正文里演出这件事的后果 —— 否则道具等于没生效。
   depth 0 = 紧贴最后一条消息，比 depth 1 更靠后。 */
function injectReversePlayerAction(text) {
  try {
    const t = String(text || '').trim();
    if (!t) return false;
    const line = '【本轮开场】玩家刚刚做了这件事：' + t +
      '\n请在正文开头自然演出它引起的反应（对方注意到 / 气氛变化 / 东西本身带来的效果）。' +
      '只写剧情，不要解释机制，也不要复述这句话。';
    _reverseTailParts.action = line;
    reverseFlushTail();
    return true;
  } catch (e) { return false; }
}

  /* ── 结算挂点 ── */
/* 一次结算之后：规格里的五条挂点依次调用这里列的函数，
   这里只提供「全做一遍」的便捷入口，测试与面板刷新也会用。 */
function reverseAfterCalc(changedChars, stageChangedChars, statData) {
  if (!isReverseModeOn()) return null;
  const out = {};
  try { out.rolePoints = reverseSyncRolePoints(changedChars); } catch (e) {}
  try { out.tickets = reverseGrantGateTickets(stageChangedChars); } catch (e) {}
  try { out.shelf = reverseMaybeRefreshShelves(false); } catch (e) {}
  try { out.achievements = reverseCheckAchievements(statData); } catch (e) {}
  try { out.tasks = reverseTickTasks(statData, changedChars); } catch (e) {}
  try { out.buffsExpired = reverseTickBuffs(); } catch (e) {}
  try {
    const role = getRoleState();
    if (!role.task || role.task.status !== 'active') reverseMaybeGenerateTask('role');
    const pl = getPlayerState();
    if (!pl.task || pl.task.status !== 'active') reverseMaybeGenerateTask('player');
  } catch (e) {}
  return out;
}
