/* 90d-reverse-task.js —— 攻略模式的任务链路：任务库 / 派发 / 推进 / 完成 / 失败 / 任务板

   一次失败只扣分（唯一的数值代价），连败满次数才转给 90e-reverse-punish.js 挂病毒。
   「给她派活」也在这一片：玩家亲手派的活，她不做完同样走失败结算。 */
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
    /* 「连续」失败要真的连续：做到一次就断连，不然攒了三周的三次失手会一起算账。
       上一次失败的惩罚还留着演（那是已经发生的事），只是不再累计。 */
    st.failStreak = 0;
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
  /* 整活开着时惩罚只有扣分这一个数值后果，所以不再乘倍率 —— 倍率和「只有扣分」是两套口径。 */
  const fine = base;
  t.status = 'failed';
  st.taskFailed = rvNum(st.taskFailed, 0) + 1;
  st.points = Math.max(0, rvNum(st.points, 0) - fine);
  pushLedger(st, -fine, '任务失败：' + t.title);

  if (who === 'role' && rs.nyankoPunish) {
    const need = Math.max(1, Math.min(9, Math.round(rvNum(rs.punishStreak, 3))));
    st.failStreak = rvNum(st.failStreak, 0) + 1;
    const pending = {
      at: rvNow(),
      title: String(t.title || '').slice(0, 20),
      text: String(rs.punishText || '').replace(/\s+/g, ' ').trim().slice(0, 120) || REVERSE_PUNISH_DEFAULT_TEXT,
      streak: st.failStreak, need: need, left: Math.max(0, need - st.failStreak),
      fine: fine, triggered: false
    };
    const willTrigger = st.failStreak >= need;
    if (willTrigger) { st.failStreak = 0; pending.triggered = true; pending.left = 0; }
    st.punishPending = pending;
    saveRoleState(st);
    if (willTrigger) {
      const info = reverseTriggerNyanko(rs, t);
      try {
        toast('任务没完成：' + t.title + ' · 积分 -' + fine + ' · 猫娘病毒' +
          (info.permanent ? '（终身）' : '（' + info.hours + ' 小时）'), 'warning');
      } catch (e) {}
      return t;
    }
    try {
      toast('任务没完成：' + t.title + ' · 积分 -' + fine + ' · 再有 ' + pending.left + ' 次会中猫娘病毒', 'warning');
    } catch (e) {}
    return t;
  }

  const buffName = String((t.penalty && t.penalty.buff) || '情绪低落');
  const prompt = '你有点提不起劲，回话变短，笑也慢半拍。';
  if (who === 'player') savePlayerState(st); else saveRoleState(st);
  reverseAddBuff(who, {
    key: 'task_fail_' + t.id,
    name: buffName, kind: 'debuff', prompt: prompt,
    expireAt: rvNow() + rvHourMs(12)
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
