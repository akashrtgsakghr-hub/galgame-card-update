/* 90g-reverse-extra.js —— 攻略模式周边：成就、纪念日与节日、Token 估算

   都不改核心数值，只读 statData 记事件；Token 估算只给悬浮窗做参考，不假装精确。 */
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
