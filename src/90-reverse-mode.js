/* 90-reverse-mode.js —— 攻略模式（角色版 + 玩家版，两套平行系统）

   设计铁律：
   ① 两边账本、库存、货架完全独立，只共用「道具定义池」。
   ② 两边互相不可见：正文出现系统词一律清洗，提示里也不许 AI 说破。
   ③ 道具不直接改 E/P/R/I，只产出 buff 标记，由注入 / 结算读取。
   ④ 角色侧积分 = floor(累计正向 E × 5)；道具加成不进这条链路。
   ⑤ reverse 关闭时所有新功能静默：不注入、不清洗、不刷新、不报错。

   状态落点：
     全局   moon_reverse_settings_v1 / moon_reverse_itemlib_v1::<卡名>
     聊天   moon_reverse_role_v1 / moon_reverse_player_v1

   P0 骨架 → P1 商城/转盘/成就/图鉴 → P2 任务/注入/惩罚 → P3 纪念日/活动/宝石橱窗
   全部在本片内实现，主文件只加 6 处挂点行。 */

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
function getReverseSettings() {
  const d = { enabled: false, userKnowsOwn: true, charKnowsPlayerSys: false, userKnowsCharSys: false, nyankoPunish: false, hud: true };
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
    taskDone: 0, taskFailed: 0, taskRounds: 0
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

/* ── 道具定义池（按角色卡分档，两边共用） ─────────────── */
function reverseItemLibKey() {
  let card = 'default';
  try { const c = getCurrentCardName(); if (c && c !== '(未知卡牌)') card = c; } catch (e) {}
  return REVERSE_ITEMLIB_KEY + '::' + card;
}
function getItemLibrary() {
  try {
    const raw = getStorage() && getStorage().getItem(reverseItemLibKey());
    const o = raw ? JSON.parse(raw) : null;
    if (o && o.items && typeof o.items === 'object') return o;
  } catch (e) {}
  const seeded = { version: 1, items: reverseBuiltinItems() };
  saveItemLibrary(seeded);
  return seeded;
}
function saveItemLibrary(lib) {
  try {
    const s = getStorage();
    if (s) s.setItem(reverseItemLibKey(), JSON.stringify(lib));
    return true;
  } catch (e) { return false; }
}

/* 道具 effect 必须是对象；type 不在枚举里直接判非法（导入也走这里） */
function reverseMakeEffect(type, prompt, hours, key, stackable) {
  return {
    type: type,
    key: String(key || ''),
    duration: type === 'permanent' ? 0 : rvNum(hours, 12),
    stackable: stackable === true,
    prompt: String(prompt || '')
  };
}
function reverseNormalizeItem(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || fallbackId || '').trim();
  if (!id) return null;
  const effRaw = (raw.effect && typeof raw.effect === 'object') ? raw.effect : null;
  if (!effRaw) return null;
  const type = String(effRaw.type || '').toLowerCase();
  if (REVERSE_EFFECT_TYPES.indexOf(type) < 0) return null;
  const rarity = REVERSE_RARITY[raw.rarity] ? raw.rarity : 'common';
  let owner = String(raw.owner || 'both');
  if (owner !== 'role_only' && owner !== 'player_only') owner = 'both';
  return {
    id: id,
    name: String(raw.name || id).slice(0, 24),
    desc: String(raw.desc || '').slice(0, 120),
    rarity: rarity,
    owner: owner,
    effect: reverseMakeEffect(type, effRaw.prompt || raw.desc || '', effRaw.duration, effRaw.key, effRaw.stackable),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 6).map(String) : [],
    createdAt: rvNum(raw.createdAt, 0) || rvNow()
  };
}
function reverseBuiltinItems() {
  const make = function(id, name, desc, rarity, owner, type, prompt, hours) {
    const it = reverseNormalizeItem({ id: id, name: name, desc: desc, rarity: rarity, owner: owner, effect: { type: type, prompt: prompt, duration: hours } }, id);
    return [id, it];
  };
  const list = [
    /* 她那边的小东西：buff / narrative，她会在剧情里自然用出来 */
    make('r_hairtie',   '素色发绳',       '把头发束起来，露出后颈。她说这样写字不挡眼。', 'common', 'role_only', 'buff', '你把头发束起来了，后颈有点凉。', 12),
    make('r_mint',      '薄荷糖',         '铁盒里剩三颗，她自己舍不得吃，留着给别人。',   'common', 'role_only', 'buff', '嘴里含着薄荷糖，说话带一点凉。', 6),
    make('r_sticky',    '便利贴',         '她习惯把想说的话先写在纸上，再决定要不要递出去。', 'common', 'role_only', 'narrative', '你手里捏着一张便利贴，上面只写了一行字。', 1),
    make('r_catbell',   '猫铃铛',         '走路会响。她本来嫌吵，后来没摘。',             'common', 'role_only', 'buff', '你一走动就有铃声，藏不住行踪。', 12),
    make('r_nightlight','夜灯贴纸',       '贴在床头，关灯后会亮一排小星。',               'common', 'role_only', 'buff', '关灯之后，床头亮起一排小星。', 12),
    make('r_coffee',    '速冲咖啡',       '两包连冲。她喝不惯苦的，加了三勺糖。',         'common', 'role_only', 'buff', '你手边有一杯很甜的咖啡，还烫。', 4),
    make('r_record',    '旧唱片',         'B 面第三首有划痕，唱针跳一下，她就笑一下。',   'rare',   'role_only', 'buff', '屋里放着旧唱片，第三首时不时跳一下。', 12),
    make('r_earphone',  '共享耳机的另一只','线很短，两个人的距离被拽到一臂之内。',       'rare',   'role_only', 'buff', '你分出去一只耳机，线绷得很直。', 6),
    make('r_bento',     '手写便当',       '煎蛋上用番茄酱画了个歪掉的心，她说是失手。',   'rare',   'role_only', 'buff', '便当盒还热着，煎蛋上有一个歪掉的心。', 6),
    make('r_lozenge',   '止咳糖浆',       '她记得你嗓子哑了三天，第四天把瓶子放在你桌上。', 'rare', 'role_only', 'buff', '桌上多了一瓶止咳糖浆，标签朝外。', 24),
    make('r_ticket',    '电影票根',       '两张，同一场。另一张一直夹在书里没扔。',       'rare',   'role_only', 'narrative', '你把两张票根摊在桌上，日期是同一场。', 1),
    make('r_umbrella',  '雨天的一把伞',   '她说只带了一把，其实是把另一把留在了家里。',   'legendary', 'role_only', 'buff', '你带着一把伞，伞骨上还挂着水。', 12),
    make('r_letter',    '没有寄出的信',   '写到第三行停了，墨迹在那句话上洇开一小片。',   'legendary', 'role_only', 'narrative', '信封没有封口，第三行的墨迹洇开了。', 1),
    make('r_handwarmer','暖手袋',         '冬天她总说手冷，然后把暖手袋塞给你，说自己不怕冷。', 'legendary', 'role_only', 'buff', '暖手袋在你手里，热度刚好。', 8),
    make('r_moonjar',   '月亮标本',       '玻璃瓶里收着一夜的月光。她说这是她最贵的东西了。', 'gem', 'role_only', 'permanent', '玻璃瓶里的光一直没灭。', 0),

    /* 玩家这边的工具：只给屏幕前的你，不进 AI 上下文 */
    make('p_intel',     '情报券·近况',    '翻开一页：她最近在意什么、哪里是雷区。',       'common', 'player_only', 'narrative', '你看清了她最近在意的那件事。', 1),
    make('p_mug',       '小礼物·马克杯',  '买个不贵但有心思的东西，递过去的时候有话说。', 'common', 'player_only', 'narrative', '你把杯子推过去，说路过看到的。', 1),
    make('p_hairpin',   '小礼物·发夹',    '挑对了是加分，挑错了要解释很久。',             'rare',   'player_only', 'narrative', '发夹放在她手边，你让她试一下。', 1),
    make('p_rain',      '场景券·雨夜',    '把天气变成雨，把两个人困在同一个屋檐下。',     'rare',   'player_only', 'narrative', '雨忽然下起来，你们被堵在同一段屋檐下。', 1),
    make('p_roof',      '场景券·天台',    '把地点挪到天台。风大，说话得靠近一点。',       'rare',   'player_only', 'narrative', '你带她上了天台，风把话吹散一半。', 1),
    make('p_coin',      '幸运币',         '攥在手心里，图个心安。',                       'common', 'player_only', 'buff', '你把幸运币塞进她掌心，让她许个愿。', 6),
    make('p_rewind',    '重来一次',       '把刚刚那一句收回去重说。它不改变已经发生的事，只改变你怎么面对。', 'gem', 'player_only', 'permanent', '你还有一次把话说清楚的机会。', 0)
  ];
  const out = {};
  list.forEach(function(pair) { if (pair[1]) out[pair[0]] = pair[1]; });
  return out;
}

/* 增删改 */
function reverseAddItem(raw) {
  const lib = getItemLibrary();
  const it = reverseNormalizeItem(raw, raw && raw.id);
  if (!it) return { ok: false, reason: '道具格式不对（effect.type 必须是 buff/debuff/task_item/narrative/permanent）' };
  if (lib.items[it.id]) return { ok: false, reason: '这个 id 已经有了' };
  lib.items[it.id] = it;
  saveItemLibrary(lib);
  return { ok: true, item: it };
}
function reverseDeleteItem(id) {
  const lib = getItemLibrary();
  if (!lib.items[id]) return false;
  delete lib.items[id];
  saveItemLibrary(lib);
  return true;
}
function reverseExportItems() {
  try {
    return JSON.stringify({ version: 1, items: getItemLibrary().items }, null, 2);
  } catch (e) { return '{"version":1,"items":{}}'; }
}
/* 导入：rarity 为空 = 用原值；conflict: overwrite / skip / rename */
function reverseImportItems(text, rarity, conflict) {
  let parsed = null;
  try { parsed = JSON.parse(String(text || '')); } catch (e) { return { ok: false, reason: '不是合法 JSON', added: 0, skipped: 0 }; }
  const src = (parsed && parsed.items && typeof parsed.items === 'object') ? parsed.items : parsed;
  if (!src || typeof src !== 'object') return { ok: false, reason: '里面没有 items', added: 0, skipped: 0 };
  const lib = getItemLibrary();
  let added = 0, skipped = 0;
  Object.keys(src).forEach(function(k) {
    const raw = Object.assign({}, src[k]);
    if (!raw.id) raw.id = k;
    if (rarity && REVERSE_RARITY[rarity]) raw.rarity = rarity;
    const it = reverseNormalizeItem(raw, k);
    if (!it) { skipped++; return; }
    if (lib.items[it.id]) {
      if (conflict === 'skip') { skipped++; return; }
      if (conflict === 'rename') {
        let n = 2, id = it.id + '_' + n;
        while (lib.items[id]) { n++; id = it.id + '_' + n; }
        it.id = id;
        lib.items[id] = it;
        added++;
        return;
      }
    }
    lib.items[it.id] = it;
    added++;
  });
  saveItemLibrary(lib);
  return { ok: added > 0, added: added, skipped: skipped, reason: added ? '' : '没有一条能导入' };
}

/* ── 货架：稀有度权重抽签 ─────────────────────────────── */
function reversePickByRarity(pool) {
  const list = (pool || []).filter(function(it) { return it && REVERSE_RARITY[it.rarity]; });
  if (!list.length) return null;
  let total = 0;
  list.forEach(function(it) { total += REVERSE_RARITY[it.rarity].weight; });
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= REVERSE_RARITY[list[i].rarity].weight;
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}
/* 普通货架：6 格不重复，宝石不进；按 owner 过滤对方专属 */
function reverseRollShelf(lib, side) {
  const who = side === 'player' ? 'player' : 'role';
  const pool = Object.keys(lib.items).map(function(id) { return lib.items[id]; }).filter(function(it) {
    if (!it || !REVERSE_RARITY[it.rarity]) return false;
    if (!REVERSE_RARITY[it.rarity].shelf) return false;
    if (who === 'role' && it.owner === 'player_only') return false;
    if (who === 'player' && it.owner === 'role_only') return false;
    return true;
  });
  let want = REVERSE_SHELF_SIZE;
  try {
    const st = who === 'player' ? getPlayerState() : getRoleState();
    if ((st.activeEvents || []).some(function(e) { return e && e.perk === 'shelf_plus' && rvNum(e.untilDay, 0) >= rvGameDay(); })) want += 1;
  } catch (e) {}

  const picked = [];
  const seen = {};
  let guard = 0;
  while (picked.length < want && guard++ < 90 && pool.length) {
    const hit = reversePickByRarity(pool);
    if (!hit || seen[hit.id]) continue;
    seen[hit.id] = 1;
    picked.push({ id: hit.id, price: REVERSE_RARITY[hit.rarity].price, stock: REVERSE_RARITY[hit.rarity].stock });
  }
  /* 角色侧任务需要某件道具时，确保它出现在货架上 */
  try {
    if (who === 'role') {
      const t = getRoleState().task;
      if (t && t.needItem && lib.items[t.needItem] && !picked.some(function(p) { return p.id === t.needItem; })) {
        const need = lib.items[t.needItem];
        const slot = { id: need.id, price: REVERSE_RARITY[need.rarity] ? REVERSE_RARITY[need.rarity].price : 20, stock: 1 };
        if (picked.length) picked[picked.length - 1] = slot; else picked.push(slot);
      }
    }
  } catch (e) {}
  return picked;
}
/* 宝石橱窗：每张卡固定 1~2 个，按卡名做稳定挑选 */
function reverseRollGemShelf(lib, side) {
  const who = side === 'player' ? 'player' : 'role';
  const gems = Object.keys(lib.items).map(function(id) { return lib.items[id]; }).filter(function(it) {
    if (!it || it.rarity !== 'gem') return false;
    if (who === 'role' && it.owner === 'player_only') return false;
    if (who === 'player' && it.owner === 'role_only') return false;
    return true;
  });
  if (!gems.length) return [];
  let seed = 0;
  const key = reverseItemLibKey();
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 99991;
  const count = Math.min(gems.length, 1 + (seed % 2));
  const out = [];
  for (let i = 0; i < count; i++) {
    const it = gems[(seed + i * 7) % gems.length];
    if (it && !out.some(function(x) { return x.id === it.id; })) out.push({ id: it.id, price: REVERSE_GEM_PRICE, stock: 1 });
  }
  return out;
}

/* 刷新货架：游戏内每 3 天 / 强制（跳时间）/ 3 小时真实冷却 */
function reverseMaybeRefreshShelves(force) {
  if (!isReverseModeOn()) return { role: false, player: false };
  const gameDay = rvGameDay();
  const lib = getItemLibrary();
  const now = rvNow();
  const out = { role: false, player: false };
  const due = function(st) {
    if (force === true) return true;
    return gameDay - rvNum(st.shelfGameDay, 0) >= REVERSE_SHELF_GAME_DAYS;
  };
  const canRefresh = function(st) {
    if (!st.shelfRefreshAt) return true;
    if (!st.shelf || !st.shelf.length) return true;
    return now - rvNum(st.shelfRefreshAt, 0) >= REVERSE_SHELF_REAL_COOLDOWN;
  };

  const role = getRoleState();
  if (due(role) && canRefresh(role)) {
    role.shelf = reverseRollShelf(lib, 'role');
    role.gemShelf = reverseRollGemShelf(lib, 'role');
    role.shelfGameDay = gameDay;
    role.shelfRefreshAt = now;
    saveRoleState(role);
    out.role = true;
    try { reverseRoleAutoBuy(); } catch (e) {}
  }
  const player = getPlayerState();
  if (due(player) && canRefresh(player)) {
    player.shelf = reverseRollShelf(lib, 'player');
    player.gemShelf = reverseRollGemShelf(lib, 'player');
    player.shelfGameDay = gameDay;
    player.shelfRefreshAt = now;
    savePlayerState(player);
    out.player = true;
  }
  return out;
}

/* ── 积分 ─────────────────────────────────────────────── */
/* 玩家积分统一入口：记 earnedTotal，并处理「每 50 分 +1 券」里程碑 */
function reverseAddPlayerPoints(st, n, reason) {
  const add = Math.round(rvNum(n, 0));
  if (!add) return 0;
  st.points = Math.max(0, rvNum(st.points, 0) + add);
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

/* ── 任务库：四阶段各 6 个，共 24 ─────────────────────── */
const REVERSE_TASK_POOL = [
  /* 初期（E < 20）接触类 */
  { id: 'e1', stage: 'early', type: 'contact', title: '打个招呼',     desc: '下一次见面，先开口的人是你。', target: { kind: 'turns', need: 1 }, remaining: 3, reward: 8,  rewardTicket: 0, penalty: { points: 4, buff: '被晾着的尴尬' } },
  { id: 'e2', stage: 'early', type: 'contact', title: '记住名字',     desc: '把对方的名字在心里念三遍，再用一次。', target: { kind: 'e', need: 2 }, remaining: 3, reward: 9,  rewardTicket: 0, penalty: { points: 4, buff: '被晾着的尴尬' } },
  { id: 'e3', stage: 'early', type: 'contact', title: '借一样东西',   desc: '借出去的东西才有还回来的理由。', target: { kind: 'progress', need: 1 }, remaining: 4, reward: 10, rewardTicket: 0, penalty: { points: 5, buff: '被晾着的尴尬' } },
  { id: 'e4', stage: 'early', type: 'contact', title: '一句夸奖',     desc: '夸具体的事，别夸人。', target: { kind: 'e', need: 3 }, remaining: 3, reward: 10, rewardTicket: 0, penalty: { points: 5, buff: '被晾着的尴尬' } },
  { id: 'e5', stage: 'early', type: 'contact', title: '一起走一段',   desc: '别急着分开，多走两步。', target: { kind: 'e', need: 4 }, remaining: 4, reward: 12, rewardTicket: 0, penalty: { points: 6, buff: '被晾着的尴尬' } },
  { id: 'e6', stage: 'early', type: 'contact', title: '第一次独处',   desc: '把时间留出一段，只有你们两个。', target: { kind: 'turns', need: 2 }, remaining: 4, reward: 12, rewardTicket: 1, penalty: { points: 6, buff: '被晾着的尴尬' } },

  /* 中期（20 ≤ E < 60）情绪 / 情报类 */
  { id: 'm1', stage: 'mid', type: 'emotion', title: '察觉情绪',       desc: '在对方说「没事」的时候看出来不是没事。', target: { kind: 'progress', need: 1 }, remaining: 4, reward: 14, rewardTicket: 0, penalty: { points: 8, buff: '情绪低落' } },
  { id: 'm2', stage: 'mid', type: 'emotion', title: '说一句心里话',   desc: '一句你自己都觉得有点难说的话。', target: { kind: 'e', need: 5 }, remaining: 4, reward: 15, rewardTicket: 0, penalty: { points: 8, buff: '情绪低落' } },
  { id: 'm3', stage: 'mid', type: 'intel',   title: '问一个私人的问题', desc: '问，但问到就停，不要追问。', target: { kind: 'progress', need: 1 }, remaining: 4, reward: 14, rewardTicket: 0, penalty: { points: 8, buff: '情绪低落' } },
  { id: 'm4', stage: 'mid', type: 'intel',   title: '记住一个细节',   desc: '她提过一次的东西，下次你先提。', target: { kind: 'turns', need: 2 }, remaining: 5, reward: 15, rewardTicket: 1, penalty: { points: 9, buff: '情绪低落' } },
  { id: 'm5', stage: 'mid', type: 'emotion', title: '吵完先低头',     desc: '不欢而散之后，先说话的人是你。', target: { kind: 'progress', need: 1 }, remaining: 5, reward: 18, rewardTicket: 0, penalty: { points: 10, buff: '情绪低落' } },
  { id: 'm6', stage: 'mid', type: 'emotion', title: '送出一件小东西', desc: '买了就要送出去，留在手里等于没买。', target: { kind: 'progress', need: 1 }, remaining: 4, reward: 16, rewardTicket: 0, penalty: { points: 8, buff: '情绪低落' } },

  /* 后期（60 ≤ E < 90）冒险 / 反向类 */
  { id: 'l1', stage: 'late', type: 'risk', title: '说出最不想说的',   desc: '那件事你一直绕着走。', target: { kind: 'e', need: 6 }, remaining: 5, reward: 22, rewardTicket: 1, penalty: { points: 12, buff: '说错话的余味' } },
  { id: 'l2', stage: 'late', type: 'risk', title: '越界一次',         desc: '做一件以前不敢做的事，别太过。', target: { kind: 'progress', need: 1 }, remaining: 5, reward: 22, rewardTicket: 0, penalty: { points: 12, buff: '说错话的余味' } },
  { id: 'l3', stage: 'late', type: 'reverse', title: '承认嫉妒',      desc: '承认你在意，比装作不在意难。', target: { kind: 'e', need: 5 }, remaining: 5, reward: 20, rewardTicket: 0, penalty: { points: 12, buff: '说错话的余味' } },
  { id: 'l4', stage: 'late', type: 'reverse', title: '主动示弱',      desc: '让她看见你也有撑不住的时候。', target: { kind: 'turns', need: 3 }, remaining: 6, reward: 20, rewardTicket: 0, penalty: { points: 12, buff: '说错话的余味' } },
  { id: 'l5', stage: 'late', type: 'reverse', title: '拒绝一次',      desc: '该说不的时候说不，别什么都答应。', target: { kind: 'progress', need: 1 }, remaining: 5, reward: 18, rewardTicket: 0, penalty: { points: 10, buff: '说错话的余味' } },
  { id: 'l6', stage: 'late', type: 'risk', title: '把选择交给她',     desc: '这次你决定不了，就别硬决定。', target: { kind: 'turns', need: 2 }, remaining: 4, reward: 20, rewardTicket: 1, penalty: { points: 12, buff: '说错话的余味' } },

  /* 终局（E ≥ 90）告白类，一次性 */
  { id: 'f1', stage: 'end', type: 'confess', title: '说出那句话',     desc: '那句你排练过很多次的话。', target: { kind: 'progress', need: 1 }, remaining: 6, reward: 30, rewardTicket: 1, penalty: { points: 15, buff: '没说出口的话' }, once: true },
  { id: 'f2', stage: 'end', type: 'confess', title: '等她先开口',     desc: '这一次不抢，等她说。', target: { kind: 'turns', need: 3 }, remaining: 6, reward: 28, rewardTicket: 1, penalty: { points: 15, buff: '没说出口的话' }, once: true },
  { id: 'f3', stage: 'end', type: 'confess', title: '给一个承诺',     desc: '承诺要小，但要能兑现。', target: { kind: 'e', need: 8 }, remaining: 6, reward: 30, rewardTicket: 0, penalty: { points: 15, buff: '没说出口的话' }, once: true },
  { id: 'f4', stage: 'end', type: 'confess', title: '被拒绝也不走',   desc: '答案不好也没关系，别转身。', target: { kind: 'progress', need: 1 }, remaining: 6, reward: 26, rewardTicket: 0, penalty: { points: 15, buff: '没说出口的话' }, once: true },
  { id: 'f5', stage: 'end', type: 'confess', title: '一起规划以后',   desc: '聊一件要过很久才会发生的事。', target: { kind: 'turns', need: 2 }, remaining: 5, reward: 26, rewardTicket: 1, penalty: { points: 15, buff: '没说出口的话' }, once: true },
  { id: 'f6', stage: 'end', type: 'confess', title: '把秘密说一半',   desc: '说一半，剩下的留着以后。', target: { kind: 'e', need: 7 }, remaining: 6, reward: 30, rewardTicket: 0, penalty: { points: 15, buff: '没说出口的话' }, once: true }
];

const REVERSE_TASK_STAGE = {
  early: { every: 1, chance: 0.3 },
  mid:   { every: 3, chance: 1 },
  late:  { every: 5, chance: 1 },
  end:   { every: 1, chance: 1 }
};
function reverseTaskStage(e) {
  const v = rvNum(e, 0);
  if (v >= 90) return 'end';
  if (v >= 60) return 'late';
  if (v >= 20) return 'mid';
  return 'early';
}
function reverseMainCharName() {
  try {
    const d = readMvuLatest();
    const chars = (d && d.stat_data && d.stat_data.角色) || {};
    let best = '', bestE = -Infinity;
    Object.keys(chars).forEach(function(k) {
      if (!chars[k] || isCharSkeleton(chars[k])) return;
      const e = rvNum(chars[k].好感度, 0);
      if (e > bestE) { bestE = e; best = k; }
    });
    if (best) return best;
  } catch (e) {}
  try { const c = getCurrentCardName(); if (c && c !== '(未知卡牌)') return c; } catch (e) {}
  return '';
}
function reverseBuildTask(tpl, agentName) {
  return {
    id: tpl.id,
    agent: agentName || '',
    title: tpl.title,
    desc: tpl.desc,
    type: tpl.type,
    stage: tpl.stage,
    target: { kind: tpl.target.kind, need: tpl.target.need },
    progress: 0,
    remaining: tpl.remaining,
    reward: tpl.reward,
    rewardTicket: rvNum(tpl.rewardTicket, 0),
    rewardMul: 1,
    penalty: { points: rvNum(tpl.penalty && tpl.penalty.points, 6), buff: String((tpl.penalty && tpl.penalty.buff) || '情绪低落') },
    needItem: tpl.needItem || '',
    once: tpl.once === true,
    status: 'active',
    createdAt: rvNow()
  };
}
/* 按阶段与频率生成；owner: role / player */
function reverseMaybeGenerateTask(owner) {
  if (!isReverseModeOn()) return null;
  const who = owner === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  if (st.task && st.task.status === 'active') return st.task;
  const data = readMvuLatest();
  const chars = (data && data.stat_data && data.stat_data.角色) || {};
  const main = reverseMainCharName();
  const E = chars[main] ? rvNum(chars[main].好感度, 0) : 0;
  const stage = reverseTaskStage(E);
  const rule = REVERSE_TASK_STAGE[stage];
  st.taskRounds = rvNum(st.taskRounds, 0) + 1;
  const save = function() { if (who === 'player') savePlayerState(st); else saveRoleState(st); };
  if (rule.every > 1 && st.taskRounds % rule.every !== 0) { save(); return null; }
  if (rule.chance < 1 && Math.random() > rule.chance) { save(); return null; }
  const pool = REVERSE_TASK_POOL.filter(function(t) { return t.stage === stage; })
    .filter(function(t) { return !(t.once && st.achievements && st.achievements['task_' + t.id]); });
  if (!pool.length) { save(); return null; }
  const tpl = pool[Math.floor(Math.random() * pool.length)];
  st.task = reverseBuildTask(tpl, main);
  save();
  return st.task;
}
/* 推进：回合类自动 +1，E 类由结算喂增量，progress 类只认后台行 */
function reverseTickTasks(statData, changedChars) {
  if (!isReverseModeOn()) return { role: null, player: null };
  const out = { role: null, player: null };
  let eDelta = 0;
  (changedChars || []).forEach(function(c) {
    if (!c || c.field !== '好感度') return;
    const d = Number(c.delta) || 0;
    if (d > 0) eDelta += d;
  });
  let anyActive = false;
  ['role', 'player'].forEach(function(who) {
    const st = who === 'player' ? getPlayerState() : getRoleState();
    const t = st.task;
    if (!t || t.status !== 'active') return;
    anyActive = true;
    if (t.target.kind === 'turns') t.progress = rvNum(t.progress, 0) + 1;
    else if (t.target.kind === 'e' && eDelta > 0) t.progress = Math.round((rvNum(t.progress, 0) + eDelta) * 10) / 10;
    t.remaining = Math.max(0, rvNum(t.remaining, 0) - 1);
    if (rvNum(t.progress, 0) >= rvNum(t.target.need, 0)) {
      reverseCompleteTask(who);
    } else if (t.remaining <= 0) {
      reverseFailTask(who);
    } else {
      /* 只有没走到结算那一步时才存这份快照；结算函数自己会存，
         这里再存一次会把它刚写的 buff / 奖励覆盖回旧值。 */
      if (who === 'player') savePlayerState(st); else saveRoleState(st);
    }
    out[who] = who === 'player' ? getPlayerState().task : getRoleState().task;
  });
  /* 任务期间暂停随机事件：除了拦截 processEventSystem，再把「强制日常期」顶住，
     双保险 —— 老存档 / 拦截没装上时，事件也不会插进任务里。 */
  if (anyActive) {
    try {
      const data = statData || readMvuLatest();
      const chars = (data && data.stat_data && data.stat_data.角色) || {};
      Object.keys(chars).forEach(function(name) {
        const ch = chars[name];
        if (!ch || !ch._quota) return;
        if (!ch._quota._eventState) ch._quota._eventState = {};
        const es = ch._quota._eventState;
        es.强制日常期 = Math.max(1, rvNum(es.强制日常期, 0));
      });
    } catch (e) {}
  }
  return out;
}
function reverseCompleteTask(owner) {
  const who = owner === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const t = st.task;
  if (!t || t.status !== 'active') return null;
  t.status = 'done';
  const mul = rvNum(t.rewardMul, 1) || 1;
  const reward = Math.round(rvNum(t.reward, 0) * mul);
  st.taskDone = rvNum(st.taskDone, 0) + 1;
  if (who === 'player') {
    reverseAddPlayerPoints(st, reward, '任务完成：' + t.title);
    if (rvNum(t.rewardTicket, 0)) st.wheelTickets = rvNum(st.wheelTickets, 0) + rvNum(t.rewardTicket, 0);
    if (t.once) st.achievements['task_' + t.id] = { at: rvNow(), title: t.title, silent: true };
    savePlayerState(st);
  } else {
    st.points = rvNum(st.points, 0) + reward;
    pushLedger(st, reward, '任务完成：' + t.title);
    saveRoleState(st);
    try { reverseRoleAutoBuy(); } catch (e) {}
  }
  try { toast((who === 'player' ? '任务完成：' : '她做到了：') + t.title + ' · +' + reward, 'success'); } catch (e) {}
  return t;
}
function reverseFailTask(owner) {
  const who = owner === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const t = st.task;
  if (!t || t.status !== 'active') return null;
  const rs = getReverseSettings();
  const base = rvNum(t.penalty && t.penalty.points, 6);
  const fine = rs.nyankoPunish ? Math.round(base * 1.5) : base;
  t.status = 'failed';
  st.taskFailed = rvNum(st.taskFailed, 0) + 1;
  st.points = Math.max(0, rvNum(st.points, 0) - fine);
  pushLedger(st, -fine, '任务失败：' + t.title);
  const buffName = rs.nyankoPunish ? '猫娘病毒' : String((t.penalty && t.penalty.buff) || '情绪低落');
  const prompt = rs.nyankoPunish
    ? '你说话会不自觉带「喵」，越紧张越明显，而且你控制不住。'
    : '你有点提不起劲，回话变短，笑也慢半拍。';
  if (who === 'player') savePlayerState(st); else saveRoleState(st);
  reverseAddBuff(who, {
    key: rs.nyankoPunish ? 'nyanko_virus' : ('task_fail_' + t.id),
    name: buffName, kind: 'debuff', prompt: prompt,
    expireAt: rvNow() + rvHourMs(rs.nyankoPunish ? 24 : 12)
  });
  try { toast('任务没完成：' + t.title + ' · 积分 -' + fine + ' · ' + buffName, 'warning'); } catch (e) {}
  return t;
}
/* 后台行：系统.任务=完成 / 系统.任务=+1（解析后从正文清掉） */
const REVERSE_TASK_LINE_RE = /系统\s*[.．]\s*任务\s*[=＝:：]\s*(完成|\+\d+)/g;
function reverseParseTaskLine(mes) {
  if (!isReverseModeOn()) return { text: String(mes || ''), hits: 0, done: false, plus: 0 };
  const src = String(mes || '');
  let hits = 0, done = false, plus = 0;
  src.replace(REVERSE_TASK_LINE_RE, function(m, v) {
    hits++;
    if (String(v) === '完成') done = true;
    else plus += rvNum(String(v).replace('+', ''), 0);
    return m;
  });
  if (!hits) return { text: src, hits: 0, done: false, plus: 0 };
  const cleaned = src.replace(REVERSE_TASK_LINE_RE, '').replace(/\n{3,}/g, '\n\n').trim();
  return { text: cleaned, hits: hits, done: done, plus: plus };
}
function reverseApplyTaskLine(parsed) {
  if (!parsed || !parsed.hits) return 0;
  let applied = 0;
  ['role', 'player'].forEach(function(who) {
    const st = who === 'player' ? getPlayerState() : getRoleState();
    const t = st.task;
    if (!t || t.status !== 'active') return;
    if (parsed.done) t.progress = rvNum(t.target.need, 0);
    else if (parsed.plus) t.progress = rvNum(t.progress, 0) + parsed.plus;
    applied++;
    if (rvNum(t.progress, 0) >= rvNum(t.target.need, 0)) { reverseCompleteTask(who); return; }
    if (who === 'player') savePlayerState(st); else saveRoleState(st);
  });
  return applied;
}

/* ── 成就（10 个） ────────────────────────────────────── */
const REVERSE_ACHIEVEMENTS = [
  { id: 'first_heart', title: '初次心动', desc: '任一角色好感度首次 ≥ 10' },
  { id: 'ice_break',   title: '破冰',     desc: '首次突破阶段门' },
  { id: 'full_moon',   title: '满月',     desc: '任一角色好感度 ≥ 100' },
  { id: 'abyss',       title: '深渊行者', desc: '好感度首次跌破 0' },
  { id: 'sunshine',    title: '雨过天晴', desc: '首次解除冷战' },
  { id: 'collector',   title: '收藏家',   desc: '图鉴解锁 10 个道具' },
  { id: 'rich',        title: '小富婆',   desc: '累计获得 1000 积分' },
  { id: 'iron',        title: '铁人',     desc: '连续签到 30 天' },
  { id: 'arcade_king', title: '街机王者', desc: '单局 ≥ 2000 分' },
  { id: 'omniscient',  title: '全知',     desc: '图鉴解锁 50 个道具' }
];
/* 顺手做三件事：成就判定、表白记录、现实活动检查（只读 statData，不改原逻辑） */
function reverseCheckAchievements(statData) {
  if (!isReverseModeOn()) return 0;
  const data = statData || readMvuLatest();
  const chars = (data && data.stat_data && data.stat_data.角色) || (data && data.角色) || {};
  const st = getPlayerState();
  let unlocked = 0;
  const names = Object.keys(chars).filter(function(k) { return chars[k] && !isCharSkeleton(chars[k]); });
  const Es = names.map(function(k) { return rvNum(chars[k].好感度, 0); });
  const maxE = Es.length ? Math.max.apply(null, Es) : 0;
  const minE = Es.length ? Math.min.apply(null, Es) : 0;

  const tryGrant = function(id) {
    const found = REVERSE_ACHIEVEMENTS.filter(function(a) { return a.id === id; })[0];
    if (!found) return;
    if (reverseGrantAchievement(id, found.title)) unlocked++;
  };

  if (maxE >= 10) tryGrant('first_heart');
  if (maxE >= 100) tryGrant('full_moon');
  if (minE < 0) tryGrant('abyss');
  if (names.some(function(k) { return rvNum(chars[k].阶段值, 0) >= 1 || (chars[k]._quota && chars[k]._quota.R阶段门); })) tryGrant('ice_break');

  names.forEach(function(k) {
    const q = chars[k]._quota || {};
    const deb = q._debuff || {};
    const cold = deb.冷战期 === true;
    if (st.coldWarSeen[k] === true && !cold) tryGrant('sunshine');
    if (cold) st.coldWarSeen[k] = true;
  });

  const seen = Object.keys(st.seenItems || {}).length;
  if (seen >= 10) tryGrant('collector');
  if (seen >= 50) tryGrant('omniscient');
  if (rvNum(st.earnedTotal, 0) >= 1000) tryGrant('rich');
  if (rvNum(st.signIn.streak, 0) >= 30) tryGrant('iron');
  try {
    const rec = getArcadeRecord();
    if (rvNum(rec && rec.score, 0) >= 2000) tryGrant('arcade_king');
  } catch (e) {}

  try { unlocked += reverseRecordConfession(chars); } catch (e) {}
  /* 收尾统一「重新读一遍再写」：上面每条 grant 都会自己存一次，
     这里若把开头那份旧快照存回去，等于把刚解锁的成就全抹掉。 */
  try {
    const fresh = getPlayerState();
    fresh.coldWarSeen = st.coldWarSeen;
    fresh.eventCheckAt = rvNum(fresh.eventCheckAt, 0) + 1;
    savePlayerState(fresh);
    if (fresh.eventCheckAt % 10 === 0) reverseCheckEvents();
  } catch (e) {}
  return unlocked;
}

/* ── 图鉴（四栏） ─────────────────────────────────────── */
function reverseCodexTab() {
  try { return getStorage().getItem(REVERSE_CODEX_TAB_KEY) || 'item'; } catch (e) { return 'item'; }
}
function getCodexHtml(tab) {
  if (!isReverseModeOn()) return '';
  const which = tab || reverseCodexTab();
  const p = getPlayerState();
  const lib = getItemLibrary();
  const head = '<div style="display:flex;gap:4px;margin-bottom:6px;">' +
    [['item', '道具'], ['ach', '成就'], ['cg', 'CG'], ['char', '角色']].map(function(pair) {
      return '<button type="button" class="mp-btn' + (which === pair[0] ? ' mp-btn-highlight' : '') +
        '" data-reverse-codex="' + pair[0] + '" style="flex:1;min-height:26px;font-size:11px;padding:0;">' + pair[1] + '</button>';
    }).join('') + '</div>';

  let body = '';
  if (which === 'item') {
    const ids = Object.keys(lib.items);
    const got = ids.filter(function(id) { return rvNum((p.seenItems || {})[id], 0) > 0; });
    body = '<div class="mp-set-desc" style="line-height:1.7;">已解锁 ' + got.length + ' / ' + ids.length + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + ids.slice(0, 60).map(function(id) {
        const it = lib.items[id];
        const has = rvNum((p.seenItems || {})[id], 0) > 0;
        const r = REVERSE_RARITY[it.rarity] || REVERSE_RARITY.common;
        return '<span title="' + rvEsc(it.desc || '') + '" style="font-size:11px;padding:2px 6px;border-radius:6px;border:1px solid ' +
          (has ? r.color + '77' : 'rgba(255,255,255,.12)') + ';color:' + (has ? r.color : '#64748b') + ';">' +
          rvEsc(has ? it.name : '？？？') + '</span>';
      }).join('') + '</div>';
  } else if (which === 'ach') {
    body = REVERSE_ACHIEVEMENTS.map(function(a) {
      const has = !!p.achievements[a.id];
      return '<div style="display:flex;justify-content:space-between;gap:6px;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);">' +
        '<span style="font-size:12px;color:' + (has ? '#fde047' : '#64748b') + ';">' + (has ? '● ' : '○ ') + rvEsc(a.title) + '</span>' +
        '<span style="font-size:10.5px;opacity:.7;text-align:right;">' + rvEsc(a.desc) + '</span></div>';
    }).join('');
  } else if (which === 'cg') {
    let list = [];
    try { list = getGalleryList(); } catch (e) { list = []; }
    body = list.length
      ? '<div class="mp-set-desc">已收集 ' + list.length + ' 张</div><div style="display:flex;flex-wrap:wrap;gap:4px;">' +
        list.slice(0, 24).map(function(g) { return '<span style="font-size:11px;padding:2px 6px;border-radius:6px;border:1px solid rgba(244,114,208,.3);">' + rvEsc(String(g.title || g.id).slice(0, 12)) + '</span>'; }).join('') + '</div>'
      : '<div class="mp-set-desc" style="opacity:.7;">还没有 CG。沉浸模式里配好图以后会进来。</div>';
  } else {
    let chars = {};
    try { chars = ((readMvuLatest() || {}).stat_data || {}).角色 || {}; } catch (e) { chars = {}; }
    const names = Object.keys(chars).filter(function(k) { return chars[k] && !isCharSkeleton(chars[k]); });
    body = names.length ? names.map(function(k) {
      const c = chars[k];
      return '<div style="padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);font-size:12px;">' +
        rvEsc(k) + ' <span style="opacity:.65;font-size:11px;">好感 ' + rvNum(c.好感度, 0) + ' · 阶段 ' + rvNum(c.阶段值, 0) +
        ' · ' + rvEsc(String(c.情绪 || '')) + '</span></div>';
    }).join('') : '<div class="mp-set-desc" style="opacity:.7;">还没有角色档案。</div>';
  }
  return head + body;
}

/* ── 大转盘：从道具池按权重抽，抽到直接进库存 ────────── */
function reverseSpinWheel(owner) {
  const who = owner === 'player' ? 'player' : 'role';
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const st = who === 'player' ? getPlayerState() : getRoleState();
  if (rvNum(st.wheelTickets, 0) <= 0) return { ok: false, reason: '没有转盘券了' };
  const lib = getItemLibrary();
  const pool = Object.keys(lib.items).map(function(id) { return lib.items[id]; }).filter(function(it) {
    if (!it || !REVERSE_RARITY[it.rarity]) return false;
    if (who === 'role' && it.owner === 'player_only') return false;
    if (who === 'player' && it.owner === 'role_only') return false;
    return true;
  });
  if (!pool.length) return { ok: false, reason: '道具库是空的，先导入道具' };
  st.wheelTickets = rvNum(st.wheelTickets, 0) - 1;
  const hit = reversePickByRarity(pool);
  st.inventory[hit.id] = rvNum(st.inventory[hit.id], 0) + 1;
  if (!st.seenItems) st.seenItems = {};
  st.seenItems[hit.id] = rvNum(st.seenItems[hit.id], 0) + 1;
  if (who === 'player') savePlayerState(st); else saveRoleState(st);
  try { toast('转盘：' + hit.name + '（' + REVERSE_RARITY[hit.rarity].name + '）', 'success'); } catch (e) {}
  return { ok: true, item: hit, label: hit.name + '（' + REVERSE_RARITY[hit.rarity].name + '）' };
}

/* ── 购买 / 使用 ─────────────────────────────────────── */
/* 角色侧货架只展示，不能手动买；她自己会挑（货架刷新后 / 任务完成后） */
function reverseRoleAutoBuy() {
  if (!isReverseModeOn()) return null;
  const st = getRoleState();
  const lib = getItemLibrary();
  const affordable = (st.shelf || []).filter(function(s) {
    return s && lib.items[s.id] && rvNum(s.stock, 0) > 0 && rvNum(st.points, 0) >= rvNum(s.price, 0);
  }).sort(function(a, b) { return rvNum(b.price, 0) - rvNum(a.price, 0); });
  if (!affordable.length) return null;
  const slot = affordable[0];
  const it = lib.items[slot.id];
  st.points = rvNum(st.points, 0) - rvNum(slot.price, 0);
  slot.stock = Math.max(0, rvNum(slot.stock, 0) - 1);
  st.inventory[it.id] = rvNum(st.inventory[it.id], 0) + 1;
  pushLedger(st, -rvNum(slot.price, 0), '她自己买了：' + it.name);
  saveRoleState(st);
  try { reverseUseItem('role', it.id, true); } catch (e) {}
  return it;
}
function reverseBuy(side, itemId) {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const who = side === 'player' ? 'player' : 'role';
  if (who === 'role') return { ok: false, reason: '她那边的东西她自己会挑，你不用替她买' };
  const st = getPlayerState();
  const lib = getItemLibrary();
  const it = lib.items[itemId];
  if (!it) return { ok: false, reason: '找不到这件东西' };
  const shelf = (st.shelf || []).concat(st.gemShelf || []);
  const slot = shelf.filter(function(s) { return s && s.id === itemId; })[0];
  if (!slot) return { ok: false, reason: '这件东西已经不在货架上了' };
  if (rvNum(slot.stock, 0) <= 0) return { ok: false, reason: '卖完了，等下次刷新' };
  const price = rvNum(slot.price, 0);
  if (rvNum(st.points, 0) < price) return { ok: false, reason: '积分不够（还差 ' + (price - rvNum(st.points, 0)) + '）' };
  st.points = rvNum(st.points, 0) - price;
  slot.stock = Math.max(0, rvNum(slot.stock, 0) - 1);
  st.inventory[it.id] = rvNum(st.inventory[it.id], 0) + 1;
  if (!st.seenItems) st.seenItems = {};
  st.seenItems[it.id] = rvNum(st.seenItems[it.id], 0) + 1;
  pushLedger(st, -price, '买入：' + it.name);
  savePlayerState(st);
  try { toast('已买入：' + it.name, 'success'); } catch (e) {}
  return { ok: true, item: it, price: price };
}
/* 使用：写 buff / 给玩家文案；silent 用于她自动买完直接用 */
function reverseUseItem(side, itemId, silent) {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const who = side === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const lib = getItemLibrary();
  const it = lib.items[itemId];
  if (!it) return { ok: false, reason: '找不到这件东西' };
  if (rvNum(st.inventory[itemId], 0) <= 0) return { ok: false, reason: '手上没有这件东西' };
  st.inventory[itemId] = rvNum(st.inventory[itemId], 0) - 1;
  /* 先把手上的数量落盘：下面 reverseAddBuff 会重新读一次状态再存，
     如果这里不先存，后面那次 save(st) 会把刚加的 buff 覆盖掉。 */
  if (who === 'player') savePlayerState(st); else saveRoleState(st);
  const eff = it.effect || {};
  const out = { ok: true, item: it, text: '' };

  if (who === 'role') {
    if (eff.type === 'task_item') {
      out.text = '她手里多了一件要交出去的东西：' + it.name;
    } else if (eff.type === 'narrative') {
      out.text = eff.prompt || it.desc || it.name;
      reverseAddBuff('role', {
        key: 'narr_' + it.id, name: it.name, kind: 'buff',
        prompt: out.text, expireAt: rvNow() + rvHourMs(6)
      });
    } else {
      reverseAddBuff('role', {
        key: it.id, name: it.name, kind: eff.type === 'debuff' ? 'debuff' : 'buff',
        prompt: eff.prompt || it.desc || '', permanent: eff.type === 'permanent',
        expireAt: eff.type === 'permanent' ? 0 : rvNow() + rvHourMs(eff.duration),
        stackable: eff.stackable === true
      });
      out.text = '她收好了「' + it.name + '」';
    }
    /* 任务需要这件东西：重新读一遍再改，别用开头那份快照覆盖 buff */
    if (st.task && st.task.needItem === itemId) {
      const fresh = getRoleState();
      if (fresh.task) { fresh.task.progress = rvNum(fresh.task.target.need, 0); saveRoleState(fresh); }
    }
  } else {
    if (eff.type === 'narrative') {
      const line = eff.prompt || it.desc || it.name;
      st.pendingTexts.push({ at: rvNow(), item: it.id, text: line });
      if (st.pendingTexts.length > 20) st.pendingTexts = st.pendingTexts.slice(-20);
      out.text = line;
      savePlayerState(st);
      try { injectReversePlayerAction(line); } catch (e) {}
    } else {
      reverseAddBuff('player', {
        key: it.id, name: it.name, kind: eff.type === 'debuff' ? 'debuff' : 'buff',
        prompt: eff.prompt || it.desc || '', permanent: eff.type === 'permanent',
        expireAt: eff.type === 'permanent' ? 0 : rvNow() + rvHourMs(eff.duration)
      });
      out.text = eff.prompt || it.desc || it.name;
    }
  }
  if (!silent && out.text) { try { toast(out.text, 'success'); } catch (e) {} }
  return out;
}

/* ── 纪念日：表白 / 结婚 ──────────────────────────────── */
function reverseRecordConfession(chars) {
  const st = getPlayerState();
  const list = chars || (((readMvuLatest() || {}).stat_data) || {}).角色 || {};
  let added = 0;
  Object.keys(list).forEach(function(name) {
    const q = list[name] && list[name]._quota;
    if (!q) return;
    if (q.表白期已通过 !== true) return;
    const flagKey = 'confess_' + name;
    if (st.achievements[flagKey]) return;
    st.achievements[flagKey] = { at: rvNow(), title: '表白：' + name, silent: true };
    st.anniversaries.push({ key: 'confess:' + name + ':' + rvTodayKey(), type: 'confess', charName: name, gameTime: rvGameTime(), realDate: rvTodayKey(), at: rvNow() });
    added++;
  });
  if (added) {
    if (st.anniversaries.length > 60) st.anniversaries = st.anniversaries.slice(-60);
    savePlayerState(st);
  }
  return added;
}
const REVERSE_MARRY_RE = /结婚|娶|嫁|婚礼|领证/;
function reverseCheckMarriage(mes) {
  if (!isReverseModeOn()) return false;
  const text = String(mes || '');
  if (!REVERSE_MARRY_RE.test(text)) return false;
  const data = readMvuLatest();
  const chars = (data && data.stat_data && data.stat_data.角色) || {};
  const names = Object.keys(chars).filter(function(k) { return chars[k] && rvNum(chars[k].好感度, 0) >= 100 && rvNum(chars[k].阶段值, 0) >= 5; });
  if (!names.length) return false;
  const name = names[0];
  const st = getPlayerState();
  if (st.achievements['marry_' + name]) return false;
  st.achievements['marry_' + name] = { at: rvNow(), title: '婚礼：' + name, silent: true };
  savePlayerState(st);
  try {
    showModalDialogCancelable('记一笔？',
      '这一段像是走到婚礼了。<br>要不要把它记成纪念日？记下来以后，每年这天都会有活动。',
      function() {
        const s2 = getPlayerState();
        s2.anniversaries.push({ key: 'marry:' + name + ':' + rvTodayKey(), type: 'marry', charName: name, gameTime: rvGameTime(), realDate: rvTodayKey(), at: rvNow() });
        savePlayerState(s2);
        toast('已记入纪念日：' + rvTodayKey(), 'success');
        try { refreshPanel(); } catch (e) {}
      },
      function() {},
      { confirmText: '记下来', cancelText: '不用' });
  } catch (e) {}
  return true;
}

/* ── 现实活动：固定节日 / 生日 / 纪念日 ────────────────── */
const REVERSE_FESTIVALS = [
  { md: '01-01', name: '元旦',   perk: 'signin_plus' },
  { md: '02-14', name: '情人节', perk: 'shelf_plus' },
  { md: '05-20', name: '520',    perk: 'shelf_plus' },
  { md: '08-25', name: '七夕',   perk: 'shelf_plus' },
  { md: '12-25', name: '圣诞',   perk: 'signin_plus' }
];
/* 生日：先从角色卡 creator_notes / description 抓，抓不到让玩家在面板手填 */
function reverseGuessBirthday() {
  let md = '';
  try {
    const ctx = getSTCtx();
    const ch = ctx && ctx.characters && ctx.characters[ctx.characterId];
    const text = String((ch && ch.creator_notes) || '') + '\n' + String((ch && ch.description) || '');
    const m = /生日[:：]?\s*(\d{1,2})\s*[月\/-]\s*(\d{1,2})/.exec(text);
    if (m) md = rvPad(rvNum(m[1], 1)) + '-' + rvPad(rvNum(m[2], 1));
  } catch (e) {}
  return md;
}
function reverseSetBirthday(md) {
  const st = getPlayerState();
  const v = String(md || '').trim();
  if (!/^\d{1,2}-\d{1,2}$/.test(v)) return { ok: false, reason: '写成 月-日，比如 05-20' };
  const parts = v.split('-');
  st.birthday = rvPad(rvNum(parts[0], 1)) + '-' + rvPad(rvNum(parts[1], 1));
  savePlayerState(st);
  return { ok: true, birthday: st.birthday };
}
function reverseCheckEvents(force) {
  if (!isReverseModeOn()) return null;
  const st = getPlayerState();
  const today = rvMonthDay();
  const day = rvGameDay();
  const alive = (st.activeEvents || []).filter(function(e) { return e && rvNum(e.untilDay, 0) >= day; });
  if (alive.length !== (st.activeEvents || []).length) st.activeEvents = alive;
  if (alive.length && !force) { savePlayerState(st); return null; }

  let hit = null;
  const fest = REVERSE_FESTIVALS.filter(function(f) { return f.md === today; })[0];
  if (fest) hit = { id: 'fest_' + fest.md, title: fest.name, desc: '今天是个日子，货架和签到都松一点。', perk: fest.perk };
  if (!hit && st.birthday && st.birthday === today) hit = { id: 'birthday', title: '她的生日', desc: '今天是她的生日。别空手。', perk: 'shelf_plus' };
  if (!hit) {
    const ann = (st.anniversaries || []).filter(function(a) { return a && String(a.realDate || '').slice(5) === today; })[0];
    if (ann) hit = { id: 'ann_' + (ann.charName || 'x') + today, title: (ann.type === 'marry' ? '结婚纪念日' : '表白纪念日'), desc: '一年前的今天。', perk: 'shelf_plus' };
  }
  if (!hit) { savePlayerState(st); return null; }
  if (alive.some(function(e) { return e && e.id === hit.id; })) { savePlayerState(st); return null; }

  st.activeEvents = alive.concat([{
    id: hit.id, title: hit.title, desc: hit.desc, perk: hit.perk,
    startDay: day, untilDay: day + 1, at: rvNow(), rewardMul: 2
  }]);
  savePlayerState(st);
  try {
    if (!st.task || st.task.status !== 'active') {
      const tpl = REVERSE_TASK_POOL.filter(function(t) { return t.id === 'e5'; })[0] || REVERSE_TASK_POOL[4];
      const task = reverseBuildTask(tpl, reverseMainCharName());
      task.rewardMul = 2;
      task.title = hit.title + ' · ' + task.title;
      const s2 = getPlayerState();
      s2.task = task;
      savePlayerState(s2);
    }
  } catch (e) {}
  try { toast('今天有活动：' + hit.title + ' · 任务奖励 ×2', 'info'); } catch (e) {}
  return hit;
}

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
    const left = b.permanent || !b.expireAt ? '一直' : (Math.max(1, Math.round((rvNum(b.expireAt, 0) - rvNow()) / 3600000)) + ' 小时');
    return '你现在处于「' + b.name + '」状态：' + (b.prompt || b.name) + ' 这个状态会在 ' + left + ' 后消失。';
  });
}
function injectReversePrompt() {
  try { reversePatchEventPause(); } catch (e) {}
  try {
    if (!isReverseModeOn()) {
      callSetPrompt(REVERSE_PROMPT_KEY, '', 0, 0, false);
      callSetPrompt(REVERSE_PLAYER_PROMPT_KEY, '', 0, 0, false);
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
    callSetPrompt(REVERSE_PROMPT_KEY, lines.join('\n'), 4, 2, false);
    callSetPrompt(REVERSE_PLAYER_PROMPT_KEY, '', 0, 0, false);
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
    callSetPrompt(REVERSE_PLAYER_PROMPT_KEY, line, 4, 0, false);
    return true;
  } catch (e) { return false; }
}

/* ── 面板 UI ─────────────────────────────────────────── */
function reverseRarityChip(rarity) {
  const r = REVERSE_RARITY[rarity] || REVERSE_RARITY.common;
  return '<span style="font-size:10px;padding:1px 5px;border-radius:6px;border:1px solid ' + r.color + '55;color:' + r.color + ';">' + r.name + '</span>';
}
function reverseShelfHtml(side, gems) {
  const who = side === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const lib = getItemLibrary();
  const list = ((gems ? st.gemShelf : st.shelf) || []).filter(function(s) { return s && lib.items[s.id]; });
  if (!list.length) return '<div class="mp-set-desc" style="opacity:.7;">货架空着。过 3 个游戏日会自己补，也可以点下面的「刷新货架」。</div>';
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' + list.map(function(s) {
    const it = lib.items[s.id];
    const price = rvNum(s.price, 0);
    const stock = rvNum(s.stock, 0);
    const can = who === 'player' && rvNum(st.points, 0) >= price && stock > 0;
    return '<div style="border:1px solid rgba(244,114,208,.18);border-radius:8px;padding:7px 8px;background:rgba(255,255,255,.02);">' +
      '<div style="display:flex;justify-content:space-between;gap:4px;align-items:center;">' +
        '<b style="font-size:12px;">' + rvEsc(it.name) + '</b>' + reverseRarityChip(it.rarity) + '</div>' +
      '<div class="mp-set-desc" style="font-size:11px;margin:3px 0 5px;line-height:1.5;opacity:.85;">' + rvEsc(String(it.desc || '').slice(0, 46)) + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">' +
        '<span style="font-size:11px;color:#fde047;">' + price + ' 分 · 剩 ' + stock + '</span>' +
        (who === 'player'
          ? '<button type="button" class="mp-btn" style="min-height:26px;padding:0 8px;font-size:11px;" data-reverse-buy="player|' + rvEsc(s.id) + '"' + (can ? '' : ' disabled') + '>买</button>'
          : '<span style="font-size:10.5px;opacity:.6;">她自己会挑</span>') +
      '</div></div>';
  }).join('') + '</div>';
}
function reverseBagHtml(side) {
  const who = side === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const lib = getItemLibrary();
  const keys = Object.keys(st.inventory || {}).filter(function(k) { return rvNum(st.inventory[k], 0) > 0; });
  if (!keys.length) return '<div class="mp-set-desc" style="opacity:.7;">空的。</div>';
  return keys.map(function(k) {
    const it = lib.items[k] || { name: k, desc: '' };
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 0;border-bottom:1px dashed rgba(255,255,255,.06);">' +
      '<span style="font-size:12px;">' + rvEsc(it.name) + ' <span style="opacity:.6;">×' + rvNum(st.inventory[k], 0) + '</span></span>' +
      '<button type="button" class="mp-btn" style="min-height:24px;padding:0 8px;font-size:11px;" data-reverse-use="' + rvEsc(side) + '|' + rvEsc(k) + '">用</button></div>';
  }).join('');
}
function reverseBuffsHtml(owner) {
  const list = getActiveBuffs(owner);
  if (!list.length) return '';
  return '<div class="mp-set-desc" style="line-height:1.75;">' + list.map(function(b) {
    const left = b.permanent || !b.expireAt ? '永久' : (Math.max(1, Math.round((rvNum(b.expireAt, 0) - rvNow()) / 3600000)) + ' 小时');
    const color = b.kind === 'debuff' ? '#f87171' : '#7dd3fc';
    return '<span style="color:' + color + ';">●</span> ' + rvEsc(b.name) + '（' + left + '）';
  }).join('<br>') + '</div>';
}
function reverseTaskHtml(owner) {
  const who = owner === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const t = st.task;
  if (!t) return '<div class="mp-set-desc" style="opacity:.7;">' + (who === 'player' ? '暂时没有任务。' : '她暂时没在盘算什么。') + '</div>';
  if (who === 'role') {
    /* 她的任务对玩家只露一个模糊的轮廓：不能直接看穿她在干什么 */
    const veil = t.status === 'active' ? 'Ta 正在盘算什么，但你看不出来。' : (t.status === 'done' ? 'Ta 好像松了口气。' : 'Ta 这两天有点低落。');
    return '<div class="mp-set-block" style="margin:0;"><div class="mp-set-desc" style="line-height:1.7;">' + rvEsc(veil) + '</div></div>';
  }
  const statusText = t.status === 'active' ? '进行中' : (t.status === 'done' ? '已完成' : '已失败');
  const color = t.status === 'active' ? '#fde047' : (t.status === 'done' ? '#7fd8a8' : '#f87171');
  return '<div style="border:1px solid rgba(244,114,208,.18);border-radius:8px;padding:7px 9px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<b style="font-size:12.5px;">' + rvEsc(t.title) + '</b>' +
      '<span style="font-size:11px;color:' + color + ';">' + statusText + '</span></div>' +
    '<div class="mp-set-desc" style="line-height:1.65;margin-top:2px;">' + rvEsc(t.desc) + '</div>' +
    '<div class="mp-set-desc" style="line-height:1.65;">进度 ' + rvNum(t.progress, 0) + ' / ' + rvNum(t.target.need, 0) +
      (t.status === 'active' ? ('　剩 ' + rvNum(t.remaining, 0) + ' 回合') : '') +
      '　奖励 +' + Math.round(rvNum(t.reward, 0) * (rvNum(t.rewardMul, 1) || 1)) + ' 分' +
      (rvNum(t.rewardMul, 1) > 1 ? '（活动 ×' + rvNum(t.rewardMul, 1) + '）' : '') + '</div></div>';
}
function reverseRolePaneHtml() {
  const role = getRoleState();
  return '<div class="mp-set-block"><div class="mp-set-title">她那边的账</div>' +
    '<div class="mp-set-desc" style="line-height:1.9;">积分 <b style="color:#f472d0;">' + rvNum(role.points, 0) + '</b>' +
      '　累计正向 E ' + rvNum(role.accumPositiveE, 0).toFixed(1) + ' × 5' +
      '<br>任务 完成 ' + rvNum(role.taskDone, 0) + ' / 失败 ' + rvNum(role.taskFailed, 0) +
      '　库存 ' + Object.keys(role.inventory || {}).length + ' 种</div>' +
    reverseTaskHtml('role') +
    (reverseBuffsHtml('role') ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">她现在的状态</div>' + reverseBuffsHtml('role') : '') +
    '</div>' +
    '<div class="mp-set-block"><div class="mp-set-title">亲手给她派一件事</div>' +
      '<div class="mp-set-desc" style="margin-bottom:6px;">她不做完就会掉分、闹情绪。名字最多 14 个字。</div>' +
      '<div style="display:flex;gap:5px;margin-bottom:5px;">' +
        '<input id="moon-reverse-assign-title" placeholder="比如：把房间收拾干净" style="flex:1;min-height:32px;font-size:12px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;padding:0 8px;box-sizing:border-box;" />' +
      '</div>' +
      '<div style="display:flex;gap:5px;align-items:center;">' +
        '<input id="moon-reverse-assign-reward" value="12" title="奖励积分" style="width:52px;min-height:30px;font-size:12px;text-align:center;background:rgba(18,13,20,.55);color:#fde047;border:1px solid rgba(244,114,208,.25);border-radius:8px;" />' +
        '<span class="mp-set-desc" style="opacity:.75;">分</span>' +
        '<input id="moon-reverse-assign-turns" value="4" title="持续回合" style="width:44px;min-height:30px;font-size:12px;text-align:center;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;" />' +
        '<span class="mp-set-desc" style="opacity:.75;">回合</span>' +
        '<button class="mp-btn" id="moon-reverse-assign-go" style="flex:1;min-height:30px;padding:0 8px;font-size:11px;">派给她</button>' +
      '</div></div>' +
    '<div class="mp-set-block"><div class="mp-set-title">她能买到的东西</div>' + reverseShelfHtml('role') + '</div>' +
    (role.gemShelf && role.gemShelf.length ? '<div class="mp-set-block"><div class="mp-set-title">宝石橱窗</div>' + reverseShelfHtml('role', true) + '</div>' : '') +
    '<div class="mp-set-block"><div class="mp-set-title">她手上的东西</div>' + reverseBagHtml('role') + '</div>';
}
function reversePlayerPaneHtml() {
  const p = getPlayerState();
  const lib = getItemLibrary();
  const evHtml = (p.activeEvents || []).filter(function(e) { return e && rvNum(e.untilDay, 0) >= rvGameDay(); })
    .map(function(e) { return '<div class="mp-set-desc" style="color:#fde047;">今天有活动 · ' + rvEsc(e.title) + '：' + rvEsc(e.desc) + '</div>'; }).join('');
  const anniHtml = (p.anniversaries || []).slice(-4).reverse()
    .map(function(a) { return '<div class="mp-set-desc">' + rvEsc(String(a.realDate || '').slice(5)) + ' · ' + (a.type === 'marry' ? '结婚' : '表白') + '：' + rvEsc(a.charName || '') + '</div>'; }).join('');
  const pendHtml = (p.pendingTexts || []).slice(-2).reverse()
    .map(function(t) { return '<div class="mp-set-desc" style="opacity:.85;border-left:2px solid rgba(244,114,208,.4);padding-left:6px;margin:4px 0;">' + rvEsc(t.text) + '</div>'; }).join('');
  const birthday = p.birthday || reverseGuessBirthday();
  return '<div class="mp-set-block"><div class="mp-set-title">你那边的账</div>' +
    '<div class="mp-set-desc" style="line-height:1.9;">积分 <b style="color:#7dd3fc;">' + rvNum(p.points, 0) + '</b>' +
      '　券 <b>' + rvNum(p.wheelTickets, 0) + '</b>　连签 <b>' + rvNum(p.signIn.streak, 0) + '</b> 天' +
      '<br>街机 ' + rvNum(p.arcadeTotalScore, 0) + ' 分（50:1）　累计获得 ' + rvNum(p.earnedTotal, 0) +
      '<br>图鉴 ' + Object.keys(p.seenItems || {}).length + ' / ' + Object.keys(lib.items).length + '</div>' +
    evHtml +
    '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
      '<button class="mp-btn mp-btn-highlight" id="moon-reverse-signin" style="flex:1;min-height:40px;"><span>每日签到</span><small>' + (reverseCanSignIn() ? '今天还没签' : '今天已经签过了') + '</small></button>' +
      '<button class="mp-btn" id="moon-reverse-spin" style="flex:1;min-height:40px;"><span>转一次盘</span><small>券 ' + rvNum(p.wheelTickets, 0) + ' 张</small></button>' +
    '</div>' +
    '<div class="mp-set-title" style="font-size:12px;margin-top:8px;">今天的任务</div>' + reverseTaskHtml('player') +
    (reverseBuffsHtml('player') ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">你的状态</div>' + reverseBuffsHtml('player') : '') +
    (pendHtml ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">可以直接发出去的话</div>' + pendHtml : '') +
    (anniHtml ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">纪念日</div>' + anniHtml : '') +
    '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">她的生日</div>' +
    '<div style="display:flex;gap:6px;align-items:center;">' +
      '<input id="moon-reverse-birthday" value="' + rvEsc(birthday) + '" placeholder="月-日，如 05-20" style="flex:1;min-height:30px;font-size:12px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;padding:0 8px;box-sizing:border-box;" />' +
      '<button class="mp-btn" id="moon-reverse-birthday-save" style="min-height:30px;padding:0 10px;font-size:11px;">记下</button>' +
    '</div>' +
    '</div>' +
    '<div class="mp-set-block"><div class="mp-set-title">你能买到的东西</div>' + reverseShelfHtml('player') + '</div>' +
    (p.gemShelf && p.gemShelf.length ? '<div class="mp-set-block"><div class="mp-set-title">宝石橱窗（1000 分）</div>' + reverseShelfHtml('player', true) + '</div>' : '') +
    '<div class="mp-set-block"><div class="mp-set-title">你的背包</div>' + reverseBagHtml('player') + '</div>';
}
function reverseCodexBlockHtml() {
  return '<div class="mp-set-block"><div class="mp-set-title">图鉴</div>' + getCodexHtml(reverseCodexTab()) + '</div>';
}
function reverseLibraryHtml() {
  let json = '';
  try { json = JSON.stringify({ version: 1, items: getItemLibrary().items }); } catch (e) { json = ''; }
  return '<div class="mp-set-block"><div class="mp-set-title">道具库</div>' +
    '<div class="mp-set-desc">改完粘回来点导入；稀有度可以统一改，冲突按下面两条规则处理。留空点导入 = 恢复内置。</div>' +
    '<textarea id="moon-reverse-lib" spellcheck="false" style="width:100%;min-height:86px;margin-top:6px;font-size:11px;line-height:1.5;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;padding:6px;box-sizing:border-box;">' + rvEsc(json) + '</textarea>' +
    '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">' +
      '<select id="moon-reverse-lib-rarity" style="flex:1;min-height:30px;font-size:11px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;">' +
        '<option value="">保留原稀有度</option>' +
        '<option value="common">全部普通</option><option value="rare">全部稀有</option>' +
        '<option value="legendary">全部传说</option><option value="gem">全部宝石</option></select>' +
      '<select id="moon-reverse-lib-conflict" style="flex:1;min-height:30px;font-size:11px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;">' +
        '<option value="rename">冲突就改名</option><option value="overwrite">冲突就覆盖</option><option value="skip">冲突就跳过</option></select>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px;">' +
      '<button class="mp-btn mp-btn-highlight" id="moon-reverse-lib-import" style="flex:1;min-height:34px;"><span>导入</span><small>按上面两条规则</small></button>' +
      '<button class="mp-btn" id="moon-reverse-lib-export" style="flex:1;min-height:34px;"><span>导出文件</span><small>存成 .json</small></button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px;">' +
      '<button class="mp-btn" id="moon-reverse-lib-reset" style="flex:1;min-height:30px;font-size:11px;">恢复内置道具</button>' +
      '<button class="mp-btn" id="moon-reverse-shelf-refresh" style="flex:1;min-height:30px;font-size:11px;">刷新两边货架</button>' +
    '</div></div>';
}
function renderReverseBlockHtml() {
  const rs = getReverseSettings();
  const role = getRoleState();
  const p = getPlayerState();
  const toggle = function(key, label, desc, on) {
    return pocketRow(label, desc, '<button class="mp-safelock-btn ' + (on ? 'on' : 'off') + '" data-reverse-toggle="' + key + '">' + (on ? '开' : '关') + '</button>');
  };
  let tab = 'role';
  try { tab = getStorage().getItem(REVERSE_UI_TAB_KEY) === 'player' ? 'player' : 'role'; } catch (e) {}
  const tabs = '<div style="display:flex;gap:6px;margin:8px 0;">' +
    '<button class="mp-btn' + (tab === 'role' ? ' mp-btn-highlight' : '') + '" data-reverse-tab="role" style="flex:1;min-height:32px;font-size:12px;">角色版</button>' +
    '<button class="mp-btn' + (tab === 'player' ? ' mp-btn-highlight' : '') + '" data-reverse-tab="player" style="flex:1;min-height:32px;font-size:12px;">玩家版</button>' +
    '</div>';

  const body =
    toggle('enabled', '攻略模式', rs.enabled ? '已开启：两边各有任务与商城，互相不知情' : '未开启。开了才有任务、商城、分数', rs.enabled) +
    toggle('userKnowsOwn', '{{user}} 知道自己的那一半', rs.userKnowsOwn ? '剧情里 {{user}} 知道自己有玩家版' : '{{user}} 不知道，只有屏幕前的你在操作', rs.userKnowsOwn) +
    toggle('charKnowsPlayerSys', '角色知道 {{user}} 也有', rs.charKnowsPlayerSys ? '角色察觉到你身上有同类东西' : '角色不知道（推荐）', rs.charKnowsPlayerSys) +
    toggle('userKnowsCharSys', '{{user}} 知道角色也有', rs.userKnowsCharSys ? '{{user}} 察觉角色身上有东西' : '{{user}} 不知道（推荐）', rs.userKnowsCharSys) +
    toggle('hud', '像素挂件', rs.hud === false ? '已关掉：页面上不显示那个球' : '右下角那个小球，点开是任务板 / 货架 / 背包 / 上下文', rs.hud !== false) +
    toggle('nyankoPunish', '失败惩罚整活', rs.nyankoPunish ? '任务失败会猫娘化 24 小时' : '只扣分 + 情绪低落 12 小时', rs.nyankoPunish) +
    (rs.enabled ? (tabs + (tab === 'player' ? reversePlayerPaneHtml() : reverseRolePaneHtml()) + reverseCodexBlockHtml() + reverseLibraryHtml()) : '');

  const desc = rs.enabled
    ? ('她 ' + rvNum(role.points, 0) + ' 分 · 你 ' + rvNum(p.points, 0) + ' 分 · 券 ' + rvNum(p.wheelTickets, 0))
    : '未开启：点开设置五个开关';
  return pocketFold('reverse', '攻略模式', desc, body, false);
}

/* 事件委托：开关 / 页签 / 买 / 用 / 签到 / 转盘 / 图鉴页 / 导入导出 / 生日 */
function bindReverseBlockEvents(panel) {
  if (!panel || panel.dataset.reverseBound === '1') return;
  panel.dataset.reverseBound = '1';
  panel.addEventListener('click', function(ev) {
    const t = ev.target;
    if (!t || !t.closest) return;

    const tg = t.closest('[data-reverse-toggle]');
    if (tg) {
      const key = tg.getAttribute('data-reverse-toggle');
      const cur = getReverseSettings();
      const patch = {}; patch[key] = !cur[key];
      saveReverseSettings(patch);
      if (key === 'enabled') {
        if (patch[key]) {
          reverseMaybeRefreshShelves(true);
          reverseCheckEvents(true);
          reverseMaybeGenerateTask('role');
        } else {
          try { callSetPrompt(REVERSE_PROMPT_KEY, '', 0, 0, false); } catch (e) {}
        }
      }
      /* 挂件跟着开关走：开→挂上球，关→连球带浮层一起删掉 */
      try { if (key === 'enabled' || key === 'hud') reverseHudSync(); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const assignGo = t.closest('#moon-reverse-assign-go');
    if (assignGo) {
      try {
        const box = assignGo.closest('.mp-set-block');
        const titleEl = box && box.querySelector('#moon-reverse-assign-title');
        const rewardEl = box && box.querySelector('#moon-reverse-assign-reward');
        const turnsEl = box && box.querySelector('#moon-reverse-assign-turns');
        const r = reverseAssignRoleTask({
          title: titleEl ? titleEl.value : '',
          reward: rewardEl ? rewardEl.value : 12,
          remaining: turnsEl ? turnsEl.value : 4
        });
        if (r.ok) {
          try { toast('派下去了：' + r.task.title, 'success'); } catch (e) {}
          try { refreshPanel(); } catch (e) {}
        } else {
          try { toast(r.reason || '派不出去', 'warning'); } catch (e) {}
        }
      } catch (e) {}
      return;
    }

    const tabBtn = t.closest('[data-reverse-tab]');
    if (tabBtn) {
      try { getStorage().setItem(REVERSE_UI_TAB_KEY, tabBtn.getAttribute('data-reverse-tab')); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const codexBtn = t.closest('[data-reverse-codex]');
    if (codexBtn) {
      try { getStorage().setItem(REVERSE_CODEX_TAB_KEY, codexBtn.getAttribute('data-reverse-codex')); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const buyBtn = t.closest('[data-reverse-buy]');
    if (buyBtn) {
      const raw = String(buyBtn.getAttribute('data-reverse-buy') || '').split('|');
      const r = reverseBuy(raw[0], raw[1]);
      if (!r.ok) toast(r.reason || '买不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const useBtn = t.closest('[data-reverse-use]');
    if (useBtn) {
      const raw = String(useBtn.getAttribute('data-reverse-use') || '').split('|');
      const r = reverseUseItem(raw[0], raw[1]);
      if (!r.ok) toast(r.reason || '用不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-signin')) {
      const r = reverseDoSignIn();
      if (!r.ok) toast(r.reason || '签不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-spin')) {
      const r = reverseSpinWheel('player');
      if (!r.ok) toast(r.reason || '抽不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-birthday-save')) {
      const box = panel.querySelector('#moon-reverse-birthday');
      const r = reverseSetBirthday(box ? box.value : '');
      toast(r.ok ? ('生日记下了：' + r.birthday) : r.reason, r.ok ? 'success' : 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-lib-import')) {
      const box = panel.querySelector('#moon-reverse-lib');
      const rarSel = panel.querySelector('#moon-reverse-lib-rarity');
      const conSel = panel.querySelector('#moon-reverse-lib-conflict');
      const txt = box ? String(box.value || '').trim() : '';
      let r = null;
      if (!txt) {
        const builtin = reverseBuiltinItems();
        saveItemLibrary({ version: 1, items: builtin });
        r = { ok: true, added: Object.keys(builtin).length, skipped: 0 };
      } else {
        r = reverseImportItems(txt, rarSel ? rarSel.value : '', conSel ? conSel.value : 'rename');
      }
      toast(r.ok ? ('导入完成：新增 ' + r.added + ' 条' + (r.skipped ? '，跳过 ' + r.skipped : '')) : (r.reason || '导入失败'), r.ok ? 'success' : 'warning');
      if (r.ok) {
        try { reverseMaybeRefreshShelves(true); } catch (e) {}
        try { refreshPanel(); } catch (e) {}
      }
      return;
    }

    if (t.closest('#moon-reverse-lib-export')) {
      try {
        const blob = new Blob([reverseExportItems()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = mainDoc.createElement('a');
        a.href = url;
        a.download = 'moon-reverse-items-' + rvTodayKey() + '.json';
        mainDoc.body.appendChild(a);
        a.click();
        setTimeout(function() { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 1200);
        toast('导出好了', 'success');
      } catch (e) { toast('导出失败：' + String(e && e.message || e), 'warning'); }
      return;
    }

    if (t.closest('#moon-reverse-lib-reset')) {
      saveItemLibrary({ version: 1, items: reverseBuiltinItems() });
      try { reverseMaybeRefreshShelves(true); } catch (e) {}
      toast('已恢复内置道具', 'success');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-shelf-refresh')) {
      const r = reverseMaybeRefreshShelves(true);
      if (r.role || r.player) toast('货架已刷新：她 ' + (r.role ? '✓' : '—') + ' / 你 ' + (r.player ? '✓' : '—'), 'success');
      else toast('还在 3 小时冷却里', 'info');
      try { refreshPanel(); } catch (e) {}
    }
  }, true);
}

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

/* ── 任务板：AI 抛活，玩家接或不接 ───────────────────────────────
   链路：AI 正文后另起一行写 [板]标题|说明|奖励|回合|进度
        → onGenerationEnd 把这行收走，灌进 taskOffers（最多 3 条，按标题去重）
        → 玩家在悬浮窗的小黑板上点「接」，才成为真任务（接一下给 2 分）
        → 不接就一直挂着，新任务来了把最旧的顶掉。
   玩家看不到那行原文 —— 它在进入聊天气泡之前就被删了。 */
const REVERSE_BOARD_RE = /^[ \t]*[\[【]板[\]】][ \t]*([^\n]*?)[ \t]*$/gm;
const REVERSE_BOARD_MAX = 3;
const REVERSE_OFFER_ACCEPT_POINTS = 2;

function reverseOfferCleanNum(v, def, min, max) {
  const raw = String(v == null ? '' : v).replace(/[^0-9.]/g, '');
  const n = raw ? Number(raw) : NaN;
  if (!isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}
function reverseOfferId(title) {
  return 'ai_' + String(title || '').replace(/[\s\u3000]/g, '').slice(0, 12);
}
/* 收一条任务：标题重复的直接丢掉，池子满了顶掉最旧的 */
function reverseAddOffer(raw) {
  if (!isReverseModeOn()) return null;
  const title = String((raw && raw.title) || '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!title) return null;
  if (/^(无|没有|暂无|—+|-+)$/.test(title)) return null;
  const st = getPlayerState();
  if (!Array.isArray(st.taskOffers)) st.taskOffers = [];
  if (!st.offerSeen || typeof st.offerSeen !== 'object') st.offerSeen = {};
  const key = reverseOfferId(title);
  if (st.offerSeen[key]) return null;
  const kindRaw = String((raw && raw.kind) || '');
  const kind = /回合/.test(kindRaw) ? 'turns' : (/好感/.test(kindRaw) ? 'e' : 'progress');
  const offer = {
    id: key,
    title: title,
    desc: String((raw && raw.desc) || '').replace(/\s+/g, ' ').trim().slice(0, 48),
    reward: reverseOfferCleanNum(raw && raw.reward, 12, 4, 60),
    remaining: reverseOfferCleanNum(raw && raw.remaining, 4, 1, 8),
    need: reverseOfferCleanNum(raw && raw.need, 3, 1, 8),
    kind: kind,
    from: (raw && raw.from) || 'ai',
    at: rvNow()
  };
  st.offerSeen[key] = rvNow();
  st.taskOffers.push(offer);
  if (st.taskOffers.length > REVERSE_BOARD_MAX) st.taskOffers = st.taskOffers.slice(-REVERSE_BOARD_MAX);
  savePlayerState(st);
  return offer;
}
/* 解析并删掉 [板] 行；返回清洗后的正文 + 收了几条 */
function reverseParseBoardLine(mes) {
  const src = String(mes || '');
  if (!isReverseModeOn() || !/[\[【]板[\]】]/.test(src)) return { text: src, added: 0, hit: 0, titles: [] };
  const titles = [];
  let added = 0;
  let hit = 0;
  const cleaned = src.replace(REVERSE_BOARD_RE, function(line, body) {
    hit++;
    const parts = String(body || '').split(/[|｜]/).map(function(x) { return String(x).trim(); });
    const title = parts[0] || '';
    if (!title || /^(无|没有|暂无)$/.test(title)) return '';
    const offer = reverseAddOffer({
      title: title,
      desc: parts[1] || '',
      reward: parts[2],
      remaining: parts[3],
      need: parts[4],
      kind: parts[5] || ''
    });
    if (offer) { added++; titles.push(offer.title); }
    return '';
  }).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text: cleaned, added: added, hit: hit, titles: titles };
}
function reverseOfferList() {
  const st = getPlayerState();
  return Array.isArray(st.taskOffers) ? st.taskOffers.filter(function(o) { return o && o.id; }) : [];
}
/* 接活：手上已经有任务时不让接（一个人同时只能追一件） */
function reverseAcceptOffer(id) {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式没开' };
  const st = getPlayerState();
  if (st.task && st.task.status === 'active') return { ok: false, reason: '手上还有一件没做完' };
  const list = Array.isArray(st.taskOffers) ? st.taskOffers : [];
  const idx = list.findIndex(function(o) { return o && o.id === id; });
  if (idx < 0) return { ok: false, reason: '这条已经不在板上了' };
  const o = list[idx];
  st.task = reverseBuildTask({
    id: o.id,
    title: o.title,
    desc: o.desc || '她没细说，你自己看着办。',
    type: 'board',
    stage: reverseTaskStage(0),
    target: { kind: o.kind, need: o.need },
    remaining: o.remaining,
    reward: o.reward,
    rewardTicket: 0,
    penalty: { points: Math.max(2, Math.round(o.reward / 3)), buff: '情绪低落' }
  }, reverseMainCharName());
  st.taskOffers = list.slice(0, idx).concat(list.slice(idx + 1));
  reverseAddPlayerPoints(st, REVERSE_OFFER_ACCEPT_POINTS, '接了任务板：' + o.title);
  savePlayerState(st);
  return { ok: true, task: st.task };
}
function reverseDeclineOffer(id) {
  const st = getPlayerState();
  const list = Array.isArray(st.taskOffers) ? st.taskOffers : [];
  const idx = list.findIndex(function(o) { return o && o.id === id; });
  if (idx < 0) return { ok: false };
  st.taskOffers = list.slice(0, idx).concat(list.slice(idx + 1));
  savePlayerState(st);
  return { ok: true };
}
/* 反攻略侧：玩家亲手给她派活（她不照做就会扣分掉状态） */
function reverseAssignRoleTask(opt) {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式没开' };
  const o = opt || {};
  const title = String(o.title || '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!title) return { ok: false, reason: '得先起个名字' };
  const role = getRoleState();
  if (role.task && role.task.status === 'active') return { ok: false, reason: '她手上还有一件没做完' };
  role.task = reverseBuildTask({
    id: 'manual_' + rvNow(),
    title: title,
    desc: String(o.desc || '').replace(/\s+/g, ' ').trim().slice(0, 48) || '玩家亲口交待的事，她得照做。',
    type: 'manual',
    stage: reverseTaskStage(0),
    target: { kind: o.kind === 'turns' ? 'turns' : 'progress', need: reverseOfferCleanNum(o.need, 3, 1, 8) },
    remaining: reverseOfferCleanNum(o.remaining, 4, 1, 8),
    reward: reverseOfferCleanNum(o.reward, 12, 4, 60),
    rewardTicket: 0,
    penalty: { points: reverseOfferCleanNum(o.penalty, 6, 2, 40), buff: '情绪低落' }
  }, reverseMainCharName());
  role.task.fromPlayer = true;
  saveRoleState(role);
  return { ok: true, task: role.task };
}

/* ── Token 分项统计（悬浮窗用；只估算，不假装精确） ──────────────
   中文按 1 字 ≈ 0.75 token（主流分词器实测均值），其余按 4 字符 ≈ 1 token。
   给玩家一个「谁在吃我的上下文」的相对概念，不用他拿计算器数。 */
function reverseEstimateTokens(text) {
  const s = String(text || '');
  if (!s) return 0;
  let cjk = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if ((c >= 0x3040 && c <= 0x30ff) || (c >= 0x3400 && c <= 0x9fff) || (c >= 0xac00 && c <= 0xd7af) || (c >= 0xf900 && c <= 0xfaff)) cjk++;
  }
  const rest = s.length - cjk;
  return Math.round(cjk * 0.75 + rest * 0.25);
}
function reverseWorldbookText() {
  let raw = null;
  try { raw = (mainWin && mainWin.world_info) || (window && window.world_info) || null; } catch (e) { raw = null; }
  if (!raw) { try { const c = getSTCtx(); raw = (c && c.world_info) || null; } catch (e) { raw = null; } }
  if (!raw) return '';
  const out = [];
  /* 世界书是三层结构（books → 每本书 → entries → 条目），得一层层往下钻，
     只把真正带 content 的条目算进去，否则永远统计成 0。 */
  const push = function(entry, depth) {
    if (!entry || typeof entry !== 'object' || depth > 4) return;
    if (typeof entry.content === 'string' && entry.content) out.push(entry.content);
    const keys = Object.keys(entry);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'content') continue;
      const v = entry[keys[i]];
      if (v && typeof v === 'object') push(v, depth + 1);
    }
  };
  push(raw, 0);
  return out.join('\n');

}
function reverseCharCardText() {
  try {
    const ctx = getSTCtx();
    if (!ctx) return '';
    const ch = (ctx.characters && ctx.characters[ctx.characterId]) || null;
    if (!ch) return '';
    return [ch.name, ch.description, ch.personality, ch.scenario, ch.mes_example, ch.creator_notes, ch.system_prompt, ch.post_history_instructions]
      .filter(Boolean).join('\n');
  } catch (e) { return ''; }
}
function reverseUserText() {
  try {
    const ctx = getSTCtx();
    if (!ctx) return '';
    const persona = (ctx.personas && ctx.user_avatar && ctx.personas[ctx.user_avatar]) || ctx.persona || '';
    return [ctx.name1 || ctx.name || '', persona].filter(Boolean).join('\n');
  } catch (e) { return ''; }
}
function reverseTokenStats() {
  const wb = reverseWorldbookText();
  const card = reverseCharCardText();
  const user = reverseUserText();
  let sys = '';
  try { sys = getRoundInjectedText() || ''; } catch (e) { sys = ''; }
  const rows = [
    { key: 'worldbook', name: '世界书', detail: '常驻条目', tokens: reverseEstimateTokens(wb) },
    { key: 'card', name: '角色卡', detail: '人设 / 场景 / 示例', tokens: reverseEstimateTokens(card) },
    { key: 'user', name: '我', detail: '名字与设定', tokens: reverseEstimateTokens(user) },
    { key: 'system', name: '本系统', detail: sys ? '注入的提示词' : '这一轮还没开始生成', tokens: reverseEstimateTokens(sys) }
  ];
  const total = rows.reduce(function(a, b) { return a + b.tokens; }, 0);
  rows.forEach(function(r) { r.pct = total ? Math.round(r.tokens / total * 100) : 0; });
  return { rows: rows, total: total };
}
function reverseFmtTokens(n) {
  const v = Math.round(rvNum(n, 0));
  if (v >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, '') + ' 万';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
}
