/* 90h-dungeon.js —— 副本（主神空间）· 规则怪谈版

   设计见 docs/dungeon-system.md。这里是 P0+P2+P3 的可玩闭环：

     ① 认本：副本文本不写进脚本，玩家把「副本·xxx」条目放进世界书，这里扫描识别
     ② 勾本：勾上的本才进「可进列表」；勾选结果按聊天存，换聊天互不影响
     ③ 进本：记 run（回合 / 血条 / 规则表）
     ④ 跑本：AI 每轮在回复末尾附 <ruled> 判定块，脚本解析后扣血、推回合、涨存活时间
     ⑤ 出本：玩家在面板上判断哪些规则是真、哪些是假，提交后按存活进度与正确率给分

   规则怪谈的核心不是「违反就死」，是「有些规则遵守了才死」：
     · [真] 规则：违反了出事
     · [假] 规则：遵守了出事（上一个受害者留下的陷阱）
   AI 必须知道真假才能判后果；玩家看不到标记，要在这一场里自己推。

   血量：玩家 / 角色各 80。轻微 -16（5 次死）、中等 -27（3 次死）、严重 -80（一击带走）。

   存活：规则怪谈考的是「撑过多长时间」，不是「聊满多少回合」。
   所以副本内不再冻结世界时钟 —— 每轮照常走脚本的时钟（默认 10 分钟一轮，
   跟主线同一套规则），倒计时按真实流逝的游戏时间扣。AI 在正文里写
   「天亮了 / 过了两个小时」，时钟就往前跳这么多，倒计时跟着跳。
   回合数只用来切幕和记历史，不再是通关门槛。

   冷却：同样按游戏时间算（通关 7 天 / 失败 3 天）。玩家得让剧情里的时间
   真正走过去才会解冻 —— 不是挂机等现实时间。

   条目约定（缺项按默认，不阻塞进本）：
     标题：副本·深夜便利店      【副本】井      副本：末班地铁
     正文任意位置写这几行：
       等级：E
       最少回合：20
       存活：3 小时 20 分        ← 可选；不写就按「回合数 × 每轮分钟」推
       胜利：撑到六点并交出正确的规则表
       失败：血量归零 / 被强制退出
       类型：怪谈

       【规则】
       1. [真] 不要给没有影子的人结账。
       2. [假] 凌晨三点必须关灯。          ← 遵守这条才会死

       【分幕】
       第 1 幕（1-5 轮）：正常营业，只有一个客人
       第 2 幕（6-10 轮）：货架开始出现不存在的东西

     其余正文当作「副本设定」注入（超过 1600 字截断）。 */

  const DUNGEON_KEY = 'moon_dungeon_v1';
  const DUNGEON_VERSION = 4;                          // v4：存活倒计时 + 冷却按游戏时间
  /* 冷却分两档：通关 7 天、失败（含放弃）3 天。都是**游戏里的天**，
     玩家把剧情时间推过去才解冻 —— 挂机等现实时间没用。 */
  const DUNGEON_CD_WIN_DAYS = 7;
  const DUNGEON_CD_FAIL_DAYS = 3;
  const DUNGEON_DAY_MS = 24 * 60 * 60 * 1000;
  const DUNGEON_BODY_MAX = 1600;
  const DUNGEON_MIN_ROUNDS = 20;                      // 写少了按 20 算（只影响切幕与给分基数）
  const DUNGEON_MIN_SURVIVE = 30;                     // 再短的存活时长也按半小时算
  const DUNGEON_MAX_HP = 80;
  /* 80 血 → 5 / 3 / 1 次容错，正好对上「小怪挨五下、精英挨三下、BOSS 一击秒杀」 */
  const DUNGEON_DMG = { minor: 16, major: 27, fatal: DUNGEON_MAX_HP };
  const DUNGEON_LEVEL_MUL = { E: 1, D: 1.2, C: 1.4, B: 1.7, A: 2, S: 2.5 };
  /* 失败扣多少：等级越高赔得越多。E -20 … S -50 */
  const DUNGEON_FAIL_PENALTY = { E: 20, D: 24, C: 28, B: 34, A: 40, S: 50 };
  /* 欠到这儿就不再往下掉。否则连输几次就永远翻不了身，玩家只会删档。 */
  const DUNGEON_DEBT_FLOOR = -200;
  const DUNGEON_RULED_RE = /<ruled>([\s\S]*?)<\/ruled>/i;

  /* 标题前缀：兼容中文书名号 / 方括号 / 全半角冒号，玩家怎么写都认 */
  const DUNGEON_TITLE_RE = /^\s*(?:[【\[]\s*副本\s*[】\]]|副本\s*[·・:：\-—|｜]\s*)(.+?)\s*$/;

  /* ── 游戏时间 ─────────────────────────────────────────────
     副本里所有「还剩多久」都用世界时间算，不用 Date.now()。
     拿不到世界时间（还没建过存档）才退回现实时间，不让功能直接崩。 */
  function dungeonGameNow() {
    try {
      const d = (typeof readMvuLatest === 'function') ? readMvuLatest() : null;
      const w = d && d.stat_data && d.stat_data.世界;
      const t = (w && typeof parseGameTime === 'function') ? parseGameTime(String(w.时间 || '')) : null;
      if (t && !isNaN(t.getTime())) return t.getTime();
    } catch (e) {}
    return Date.now();
  }

  /* 「3 天」「6 小时」「45 分钟」「一夜」「3 小时 20 分」→ 分钟数。认不出来返回 0。
     复合写法必须认：「3 小时 20 分」只读成 3 小时的话，便利店本会少 20 分钟，
     面板上写的和条目写的对不上，玩家第一眼就会觉得脚本算错了。 */
  function dungeonParseSurvival(raw) {
    const text = String(raw || '').trim();
    if (!text) return 0;
    const CN = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const re = /(\d+(?:\.\d+)?|[一两二三四五六七八九十])\s*(?:个)?\s*(天|日|夜|小时|时|分钟|分)/g;
    let total = 0;
    let hit = false;
    let m;
    while ((m = re.exec(text))) {
      const n = (CN[m[1]] !== undefined) ? CN[m[1]] : Number(m[1]);
      if (!n) continue;
      hit = true;
      const u = m[2];
      /* 整夜按 8 小时（「撑到天亮」这类本大多是这一档） */
      if (u === '天' || u === '日') total += n * 1440;
      else if (u === '夜') total += n * 480;
      else if (u === '小时' || u === '时') total += n * 60;
      else total += n;
    }
    if (hit) return Math.round(total);
    /* 没有单位，只写数字 / 一个中文数字：按小时理解（「存活：3」= 3 小时） */
    const only = text.match(/(\d+(?:\.\d+)?)/) || text.match(/([一两二三四五六七八九十])/);
    if (!only) return 0;
    const n2 = (CN[only[1]] !== undefined) ? CN[only[1]] : Number(only[1]);
    return n2 ? Math.round(n2 * 60) : 0;
  }

  /* 一个本要撑多久（分钟）。写了「存活」就用它；没写按「回合 × 每轮分钟」推，
     跟主线同一套时钟 —— 20 轮 × 10 分钟 = 3 小时 20 分。 */
  function dungeonNeedMinutes(surviveMin, rounds) {
    const s = Math.round(Number(surviveMin) || 0);
    if (s > 0) return Math.max(DUNGEON_MIN_SURVIVE, s);
    const step = (typeof getTurnMinutes === 'function' ? getTurnMinutes() : 10) || 10;
    const r = Math.max(1, Math.round(Number(rounds) || DUNGEON_MIN_ROUNDS));
    return Math.max(DUNGEON_MIN_SURVIVE, Math.round(r * step));
  }

  function dungeonDefault() {
    return { version: DUNGEON_VERSION, lib: {}, run: null, cooldownUntilGame: 0, history: [], pendingForce: null };
  }

  function dungeonState() {
    const raw = readChatFeatureValue(DUNGEON_KEY, null);
    const st = (raw && typeof raw === 'object') ? raw : dungeonDefault();
    if (!st.lib || typeof st.lib !== 'object') st.lib = {};
    if (!Array.isArray(st.history)) st.history = [];
    if (typeof st.cooldownUntil !== 'number') st.cooldownUntil = 0;
    /* v3 → v4：冷却从「现实时间戳」换成「游戏时间戳」。
       老存档里剩下的那段真实时间，原样折成游戏时间接着走，不白送也不加罚。 */
    if (typeof st.cooldownUntilGame !== 'number') {
      const leftReal = Math.max(0, Number(st.cooldownUntil || 0) - Date.now());
      st.cooldownUntilGame = leftReal > 0 ? (dungeonGameNow() + leftReal) : 0;
    }
    if (st.run && typeof st.run !== 'object') st.run = null;
    if (st.pendingForce && typeof st.pendingForce !== 'object') st.pendingForce = null;
    /* 老库 / 老 run 补字段，别让面板算血条时炸 */
    Object.keys(st.lib).forEach(function (k) {
      const it = st.lib[k];
      if (it && !Array.isArray(it.rules)) it.rules = [];
    });
    if (st.run) {
      if (!Array.isArray(st.run.rules)) st.run.rules = [];
      if (!Array.isArray(st.run.hits)) st.run.hits = [];
      if (!st.run.judge || typeof st.run.judge !== 'object') st.run.judge = {};
      if (typeof st.run.hp !== 'number') st.run.hp = DUNGEON_MAX_HP;
      if (typeof st.run.charHp !== 'number') st.run.charHp = DUNGEON_MAX_HP;
      if (typeof st.run.rounds !== 'number' || st.run.rounds < DUNGEON_MIN_ROUNDS) {
        st.run.rounds = Math.max(DUNGEON_MIN_ROUNDS, Number(st.run.rounds) || 0);
      }
      /* v3 的 run 没有存活字段：按已跑回合折算一个进度，别让玩家回到本里变成 0 */
      if (typeof st.run.needMin !== 'number' || st.run.needMin <= 0) {
        st.run.needMin = dungeonNeedMinutes(st.run.surviveMin, st.run.rounds);
      }
      if (typeof st.run.survivedMin !== 'number') {
        const done = Math.min(1, Math.max(0, Number(st.run.round) || 0) / Math.max(1, st.run.rounds));
        st.run.survivedMin = Math.round(st.run.needMin * done);
      }
      /* v2 的 charDown 是「重伤昏迷」，v3 改成「阵亡成幽灵」，读老存档也算幽灵 */
      if (st.run.charDown && st.run.charGhost === undefined) st.run.charGhost = true;
      if (typeof st.run.charGhost !== 'boolean') st.run.charGhost = false;
    }
    st.version = DUNGEON_VERSION;
    return st;
  }

  function dungeonSave(st) {
    writeChatFeatureValue(DUNGEON_KEY, st);
    return st;
  }

  /* ── 识别：只认标题前缀，不猜内容 ───────────────────────────── */
  function dungeonTitleOf(e) {
    return String((e && (e.title || e.comment || e.name)) || '');
  }

  function dungeonBodyOf(e) {
    return String((e && (e.content || e.body || '')) || '');
  }

  function dungeonIsBook(e) {
    return DUNGEON_TITLE_RE.test(dungeonTitleOf(e));
  }

  /* 「等级：E」这类行，中英文冒号都认；一行里只取第一个 */
  function dungeonField(body, names) {
    const lines = String(body || '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*([^:：]{1,12})[:：]\s*(.+?)\s*$/);
      if (!m) continue;
      const k = m[1].trim();
      if (names.indexOf(k) >= 0) return m[2].trim();
    }
    return '';
  }

  /* 规则表：新格式（【规则】段 + [真]/[假]）与旧格式（yaml rules: 列表）都认。
     旧格式没标真假，一律当「真」——那种本只能算普通剧情本，玩不出规则怪谈的味道。 */
  function dungeonRulesOf(body) {
    const out = [];
    const text = String(body || '');
    const seg = text.match(/【规则】([\s\S]*?)(?=\n\s*【|$)/);
    if (seg) {
      seg[1].split(/\r?\n/).forEach(function (line) {
        const m = line.match(/^\s*(\d+)\s*[.、)）]\s*(?:[\[【]\s*(真|假|真规则|假规则|true|false)\s*[\]】]\s*)?(.+?)\s*$/i);
        if (!m) return;
        const flag = String(m[2] || '').toLowerCase();
        out.push({
          n: parseInt(m[1], 10) || (out.length + 1),
          text: String(m[3] || '').trim(),
          real: !(flag === '假' || flag === '假规则' || flag === 'false')
        });
      });
    }
    if (!out.length) {
      const y = text.match(/^\s*rules\s*:\s*\r?\n((?:[ \t]*-[ \t]*.+\r?\n?)+)/m);
      if (y) {
        y[1].split(/\r?\n/).forEach(function (line) {
          const m = line.match(/^\s*-\s*(.+?)\s*$/);
          if (!m) return;
          const raw = m[1];
          const fake = /^[\[【]\s*假/.test(raw);
          out.push({
            n: out.length + 1,
            text: raw.replace(/^[\[【]\s*(真|假)\s*[\]】]\s*/, '').trim(),
            real: !fake
          });
        });
      }
    }
    return out;
  }

  /* 分幕大纲：写在【分幕】段里，原样留给 AI，脚本只负责数「现在第几幕」 */
  function dungeonActsOf(body) {
    const seg = String(body || '').match(/【分幕】([\s\S]*?)(?=\n\s*【|$)/);
    return seg ? seg[1].trim() : '';
  }

  function dungeonParse(e) {
    const title = dungeonTitleOf(e);
    const hit = title.match(DUNGEON_TITLE_RE);
    const name = (hit ? hit[1] : title).trim() || '未命名副本';
    const body = dungeonBodyOf(e);
    /* 回合数现在只干两件事：切幕（5 轮一幕）和给分基数。
       不写默认 20，写少了也抬到 20 —— 短本被拉长，总比进不去强。 */
    const roundsRaw = dungeonField(body, ['最少回合', '回合', '回合数', '总回合', '长度', 'rounds']);
    const roundsWanted = parseInt(String(roundsRaw).replace(/[^\d]/g, ''), 10) || 0;
    const rounds = Math.max(DUNGEON_MIN_ROUNDS, roundsWanted);
    /* 「存活：3 天 / 6 小时 / 一夜」比回合数更贴近规则怪谈。
       写了就以它为准；没写退回回合数换算，老条目不用改。 */
    const surviveRaw = dungeonField(body, ['存活', '存活时长', '撑到', '坚持', '时长', 'survive']);
    const surviveMin = dungeonParseSurvival(surviveRaw);
    const needMin = dungeonNeedMinutes(surviveMin, rounds);
    const level = dungeonField(body, ['等级', '难度等级', '评级', 'difficulty', 'level']) || '?';
    const win = dungeonField(body, ['胜利', '通关', '胜利条件', '通关条件', 'win']);
    const lose = dungeonField(body, ['失败', '死亡', '失败条件', 'lose']);
    const kind = dungeonField(body, ['类型', '题材', '分类', 'genre']);
    const rules = dungeonRulesOf(body);
    const missingFields = [];
    if (!win) missingFields.push('胜利');
    if (!rules.length) missingFields.push('规则');
    return {
      id: 'dg_' + stableFeatureHash(String(e.bookName || '') + '::' + title),
      name: name,
      level: String(level).toUpperCase(),
      rounds: rounds,
      roundsWanted: roundsWanted,
      surviveRaw: surviveRaw,
      surviveMin: surviveMin,
      needMin: needMin,
      win: win,
      lose: lose,
      kind: kind,
      rules: rules,
      acts: dungeonActsOf(body),
      book: String(e.bookName || ''),
      body: body.length > DUNGEON_BODY_MAX ? body.slice(0, DUNGEON_BODY_MAX) + '…' : body,
      missingFields: missingFields,
      playable: true
    };
  }

  /* 扫描所有世界书。每次扫描把新出现的本并进 lib（默认不勾），
     已经勾过的保持原样；世界书里删掉的本标 gone，不静默丢弃。 */
  function dungeonScan() {
    const found = [];
    let books = [];
    try { books = (typeof wbBooksRaw === 'function') ? wbBooksRaw() : []; } catch (e) { books = []; }
    (books || []).forEach(function (b) {
      const list = (b && b.entries) || [];
      list.forEach(function (e) {
        if (!dungeonIsBook(e)) return;
        const item = dungeonParse(Object.assign({}, e, { bookName: b.name }));
        found.push(item);
      });
    });

    const st = dungeonState();
    const seen = {};
    found.forEach(function (it) {
      seen[it.id] = true;
      const old = st.lib[it.id];
      st.lib[it.id] = Object.assign({}, old || {}, {
        id: it.id, name: it.name, level: it.level, rounds: it.rounds,
        roundsWanted: it.roundsWanted, win: it.win, lose: it.lose, kind: it.kind,
        surviveRaw: it.surviveRaw, surviveMin: it.surviveMin, needMin: it.needMin,
        rules: it.rules, acts: it.acts, book: it.book,
        body: it.body, missingFields: it.missingFields, playable: it.playable,
        gone: false,                              // 世界书里还在
        enabled: !!(old && old.enabled),          // 第一次见到不自动勾，让玩家自己决定
        seenAt: Date.now()
      });
    });
    Object.keys(st.lib).forEach(function (id) {
      if (!seen[id]) st.lib[id].gone = true;      // 世界书里删掉了：保留记录但禁止进本
    });
    dungeonSave(st);
    return found;
  }

  function dungeonLibList() {
    const st = dungeonState();
    return Object.keys(st.lib).map(function (k) { return st.lib[k]; })
      .sort(function (a, b) {
        if (!!a.gone !== !!b.gone) return a.gone ? 1 : -1;
        return String(a.name).localeCompare(String(b.name), 'zh');
      });
  }

  function dungeonToggle(id, on) {
    const st = dungeonState();
    if (!st.lib[id]) return false;
    st.lib[id].enabled = !!on;
    dungeonSave(st);
    return true;
  }

  function dungeonIsOn() {
    const st = dungeonState();
    return !!(st.run && st.run.id);
  }

  function dungeonCurrent() {
    const st = dungeonState();
    return st.run || null;
  }

  /* 冷却剩多少（毫秒，游戏时间）。游戏日不往前推，它就一直是这个数 ——
     玩家想解冻，得让剧情的时间真的走过去。 */
  function dungeonCooldownLeft() {
    const st = dungeonState();
    const until = Number(st.cooldownUntilGame || 0);
    if (!until) return 0;
    const left = until - dungeonGameNow();
    return left > 0 ? left : 0;
  }

  /* 分钟 → 「1 天 3 小时」「2 小时 20 分」「45 分」 */
  function dungeonFormatMin(min) {
    const m = Math.max(0, Math.round(Number(min) || 0));
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const mm = Math.round(m % 60);
    if (d > 0) return d + ' 天' + (h > 0 ? ' ' + h + ' 小时' : '');
    if (h > 0) return h + ' 小时' + (mm > 0 ? ' ' + mm + ' 分' : '');
    return mm + ' 分';
  }

  /* 这一局的存活进度。生存玩法看的是「撑了多久」，回合只用来切幕。 */
  function dungeonProgress(r) {
    if (!r) return null;
    const need = Math.max(1, Number(r.needMin) || dungeonNeedMinutes(0, r.rounds));
    const done = Math.max(0, Number(r.survivedMin) || 0);
    return {
      needMin: need,
      survivedMin: done,
      leftMin: Math.max(0, need - done),
      pct: Math.min(100, (done / need) * 100),
      full: done >= need
    };
  }

  /* 第几幕：按存活进度切，跑满时正好落在最后一幕 */
  function dungeonActOf(r) {
    if (!r) return 1;
    const rounds = Math.max(1, Number(r.rounds) || DUNGEON_MIN_ROUNDS);
    const acts = Math.max(1, Math.round(rounds / 5));
    let ratio;
    if (r.needMin) ratio = Math.min(1, (Number(r.survivedMin) || 0) / Math.max(1, Number(r.needMin)));
    else ratio = Math.min(1, Math.max(0, ((r.round || 1) - 1) / rounds));
    return Math.min(acts, Math.floor(ratio * acts) + 1);
  }

  /* ── 进本 / 出本 ─────────────────────────────────────────── */

  function dungeonStart(id, opts) {
    const isForce = !!(opts && opts.force);
    const st = dungeonState();
    const it = st.lib[id];
    if (!it) return { ok: false, reason: '没有这个副本' };
    if (!it.enabled) return { ok: false, reason: '这个本还没勾上' };
    if (it.gone) return { ok: false, reason: '世界书里找不到这个条目了，重新扫描一下' };
    if (st.run) return { ok: false, reason: '已经在本里了' };
    /* 欠着一场债的时候不给自选：这一次由主神指定（冷却到点会自动拉走） */
    if (!isForce && st.pendingForce && dungeonCooldownLeft() <= 0) {
      return { ok: false, reason: '你欠着一场没还的债，这一次由主神指定副本' };
    }
    if (dungeonCooldownLeft() > 0) {
      return { ok: false, reason: '冷却中，还有 ' + dungeonFormatMin(dungeonCooldownLeft() / 60000) + '（要让剧情时间走过去）' };
    }
    /* 和攻略模式互斥：两边都要改注入和账本，同时开一定互相踩 */
    if (typeof isReverseModeOn === 'function' && isReverseModeOn()) {
      return { ok: false, reason: '攻略模式开着，先关掉再进本' };
    }
    /* 角色名：副本里要显示「哪个角色在掉血」。拿不到就留空，面板显示「同行者」 */
    let charName = '';
    try {
      const d = (typeof readMvuLatest === 'function') ? readMvuLatest() : null;
      const cs = d && d.stat_data && d.stat_data.角色;
      if (cs) {
        charName = Object.keys(cs).filter(function (k) {
          return k !== '示例角色' && k !== 'You' && k !== '你' && cs[k] && !isCharSkeleton(cs[k]);
        })[0] || '';
      }
    } catch (e) {}

    const needMin = dungeonNeedMinutes(it.surviveMin, it.rounds);
    st.run = {
      id: it.id, name: it.name, level: it.level, genre: it.kind || '',
      rounds: it.rounds, round: 0,
      needMin: needMin, survivedMin: 0,
      win: it.win, lose: it.lose, body: it.body, acts: it.acts || '',
      hp: DUNGEON_MAX_HP, charHp: DUNGEON_MAX_HP,
      charName: charName, charGhost: false, forced: false,
      rules: (it.rules || []).map(function (x) { return { n: x.n, text: x.text, real: x.real }; }),
      judge: {},
      hits: [],
      lastHit: null,
      startedAt: Date.now(),
      startGameMs: dungeonGameNow(),
      runId: 'run_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    };
    dungeonSave(st);
    return { ok: true, run: st.run };
  }

  /* 每轮 +1 —— 只用来切幕、记历史和给分基数。
     通关门槛是「存活倒计时」，不再是「跑满多少回合」。 */
  function dungeonTick(floorIdx) {
    const st = dungeonState();
    if (!st.run) return null;
    const r = st.run;
    /* 同一楼层只算一回合：message_received 与 generation_ended 都会触发结算，
       不去重的话玩家一句话能走两回合。 */
    if (floorIdx !== undefined && floorIdx !== null && r.lastFloor === floorIdx) return r;
    if (floorIdx !== undefined && floorIdx !== null) r.lastFloor = floorIdx;
    if (r.round < r.rounds) r.round += 1;
    r.lastTickAt = Date.now();
    dungeonSave(st);
    return r;
  }

  /* 世界时钟往前走了多少分钟，就往存活倒计时里加多少。
     这是副本唯一的进度源，但有下限：至少加「存活时长 ÷ 回合数」这一份。
     为什么要下限 —— 主线每轮默认只走 10 分钟，一个「撑一夜」的本要 480 分钟，
     光靠 10 分钟一轮得聊 48 轮，玩家会以为坏掉了。
     AI 写得更多（「天亮了」「熬了两个小时」）就按 AI 的，倒计时直接跳。 */
  function dungeonAddElapsed(minutes) {
    const st = dungeonState();
    const r = st.run;
    if (!r) return null;
    const need = Math.max(1, Number(r.needMin) || 0);
    const per = Math.max(1, Math.round(need / Math.max(1, Number(r.rounds) || DUNGEON_MIN_ROUNDS)));
    const add = Math.max(per, Math.round(Number(minutes) || 0));
    if (!add) return r;
    r.survivedMin = Math.max(0, Number(r.survivedMin) || 0) + add;
    /* 撑过目标就停下，不无限累加 —— 面板要显示「已撑满」而不是「12 小时 / 3 小时」 */
    if (r.survivedMin > need) r.survivedMin = need;
    r.lastElapsedAt = Date.now();
    dungeonSave(st);
    return r;
  }

  /* 解析 AI 回复末尾的判定块。AI 写不写都得活：
     没写 = 这一轮按「没违规」处理，绝不因为格式问题罚玩家。 */
  function dungeonParseRuled(text) {
    const m = String(text || '').match(DUNGEON_RULED_RE);
    if (!m) return null;
    const raw = m[1].trim();
    let o = null;
    try { o = JSON.parse(raw); } catch (e) { o = null; }
    if (!o || typeof o !== 'object') {
      /* AI 常写 hit: major 这种不带引号的，宽松再抓一遍 */
      o = {};
      const g = function (k) {
        const mm = raw.match(new RegExp(k + '\\s*[:=]\\s*["\']?([^"\'，,}\\s]+)', 'i'));
        return mm ? mm[1] : '';
      };
      o.hit = g('hit'); o.who = g('who'); o.rule = g('rule'); o.why = g('why');
    }
    let hit = String(o.hit || '').toLowerCase().trim();
    if (/^(minor|light|small|low|轻微|小|1)$/.test(hit)) hit = 'minor';
    else if (/^(major|heavy|mid|medium|中等|中|2)$/.test(hit)) hit = 'major';
    else if (/^(fatal|dead|death|boss|severe|严重|秒杀|3)$/.test(hit)) hit = 'fatal';
    else hit = 'none';
    let who = String(o.who || 'player').toLowerCase().trim();
    who = (who === 'char' || who === '角色' || who === 'npc' || who === 'role' || who === 'companion') ? 'char' : 'player';
    return {
      hit: hit, who: who,
      rule: parseInt(String(o.rule || '0').replace(/[^\d]/g, ''), 10) || 0,
      why: String(o.why || '').replace(/\s+/g, ' ').slice(0, 80)
    };
  }

  /* 把判定块从消息正文里剪掉。
     CSS 已经把它隐藏了，但万一酒馆的 sanitize 不认自定义标签、把标签删了留下 JSON，
     玩家就会看到一坨 {"hit":"none"} —— 所以正文里也不留。 */
  function dungeonStripRuled() {
    try {
      const latest = (typeof getLatestAiMessage === 'function') ? getLatestAiMessage() : null;
      if (!latest || !latest.msg) return false;
      const s = String(latest.msg.mes || '');
      if (!DUNGEON_RULED_RE.test(s)) return false;
      latest.msg.mes = s.replace(DUNGEON_RULED_RE, '').replace(/\n{3,}/g, '\n\n').trim();
      return true;
    } catch (e) { return false; }
  }

  /* 结算一次判定：扣血 → 角色昏迷 / 玩家死亡 / 严重违规强制退出。
     返回 { hit, who, dmg, down, exited }，给面板与 toast 用。 */
  function dungeonApplyRuled(text, floorIdx) {
    const st = dungeonState();
    const r = st.run;
    if (!r) return null;
    /* 和 tick 一样按楼层去重：message_received 与 generation_ended 都会走到这里，
       不然玩家一句话被扣两遍血。 */
    if (floorIdx !== undefined && floorIdx !== null) {
      if (r.lastRuledFloor === floorIdx) return { hit: 'none', silent: true, dup: true };
      r.lastRuledFloor = floorIdx;
    }
    const v = dungeonParseRuled(text);
    if (!v) return { hit: 'none', silent: true };        // 没写判定块，什么都不做
    if (v.hit === 'none') {
      try { dungeonStripRuled(); } catch (e) {}          // 没违规，但这行 JSON 也得从正文里拿掉
      return { hit: 'none' };
    }

    const dmg = DUNGEON_DMG[v.hit] || 0;
    const who = v.who;
    /* 严重违规：BOSS 级追击，一秒带走，不管当前还剩多少血 */
    if (v.hit === 'fatal') {
      if (who === 'char') r.charHp = 0; else r.hp = 0;
    } else if (who === 'char') {
      r.charHp = Math.max(0, r.charHp - dmg);
    } else {
      r.hp = Math.max(0, r.hp - dmg);
    }

    const rec = { round: r.round || 0, hit: v.hit, who: who, rule: v.rule, why: v.why, dmg: dmg };
    r.hits.push(rec);
    if (r.hits.length > 24) r.hits = r.hits.slice(-24);
    r.lastHit = rec;

    let down = false;
    if (r.charHp <= 0 && !r.charGhost) {
      /* 角色阵亡 → 变成幽灵跟着玩家：能说话、能出主意，碰不了任何东西，也挡不了刀。
         副本继续，只要玩家还活着。 */
      r.charGhost = true;
      r.charDown = true;
      r.charHp = 0;
      down = true;
    }
    dungeonSave(st);
    try { dungeonStripRuled(); } catch (e) {}

    /* 玩家血归零或严重违规 → 强制退出，算失败 */
    if (r.hp <= 0 || v.hit === 'fatal') {
      const res = dungeonFinish('lose', { reason: v.hit === 'fatal' ? 'fatal' : 'hp' });
      return { hit: v.hit, who: who, dmg: dmg, down: down, exited: true, finish: res };
    }
    return { hit: v.hit, who: who, dmg: dmg, down: down, exited: false };
  }

  /* 玩家在面板上勾「这条规则是真还是假」 */
  function dungeonJudgeRule(n, val) {
    const st = dungeonState();
    if (!st.run) return false;
    const v = (val === 'real' || val === 'fake') ? val : '';
    if (!v) delete st.run.judge[n];
    else st.run.judge[n] = v;
    dungeonSave(st);
    return true;
  }

  function dungeonJudgeStat(r) {
    const rules = (r && r.rules) || [];
    const j = (r && r.judge) || {};
    let right = 0, done = 0;
    rules.forEach(function (x) {
      const pick = j[x.n];
      if (!pick) return;
      done += 1;
      if ((pick === 'real') === !!x.real) right += 1;
    });
    return {
      total: rules.length, done: done, right: right,
      acc: rules.length ? right / rules.length : 0,
      allDone: rules.length > 0 && done === rules.length
    };
  }

  /* 副本自己的入账口：允许把 points 扣成负数。
     通用 reverseAddPlayerPoints 里是 Math.max(0, ...)，用在副本上永远扣不动，
     所以这里单独走一条，只影响副本结算，不动签到 / 任务 / 街机那些路径。
     欠款封顶 DUNGEON_DEBT_FLOOR —— 不封顶的话连输几次就永远翻不了身。 */
  function dungeonAddPoints(delta, reason) {
    let before = 0, after = 0;
    if (!delta) return { before: 0, after: 0, delta: 0 };
    try {
      const ps = getPlayerState();
      before = Number(ps.points) || 0;
      let next = before + delta;
      if (next < DUNGEON_DEBT_FLOOR) next = DUNGEON_DEBT_FLOOR;
      after = next;
      ps.points = next;
      /* 累计收入只算「真正落进正数的那部分」：还在还债时通关，不算又挣了一大笔。
         但不掐死 —— 里程碑券照发，欠债的人也得有道具可用。 */
      if (delta > 0) {
        ps.earnedTotal = (Number(ps.earnedTotal) || 0) + Math.max(0, after - Math.max(0, before));
      }
      try { if (typeof pushLedger === 'function') pushLedger(ps, after - before, reason); } catch (e) {}
      savePlayerState(ps);
    } catch (e) { return { before: before, after: before, delta: 0 }; }
    return { before: before, after: after, delta: after - before };
  }

  /* 失败后挑一个「强制副本」。优先级：
       ① 不是刚失败那个本 + 难度不高于它   （最舒服的惩罚）
       ② 不是刚失败那个本                  （宁可难一点，也不能重复同一个）
       ③ 只剩一个本，只能重复               （总比卡死在冷冻里好）
     第 ② 档是必要的：玩家勾的本少的时候，只按难度过滤会永远挑回同一个。 */
  function dungeonPickForceBatch(force) {
    const st = dungeonState();
    const list = Object.keys(st.lib).map(function (k) { return st.lib[k]; })
      .filter(function (x) { return x && x.enabled && !x.gone; });
    if (!list.length) return null;
    const cap = DUNGEON_LEVEL_MUL[String((force && force.level) || '').toUpperCase()] || 99;
    const mulOf = function (x) {
      return DUNGEON_LEVEL_MUL[String(x.level || '').toUpperCase()] || 0;
    };
    const diff = list.filter(function (x) { return !force || !force.srcId || x.id !== force.srcId; });

    let pool = diff.filter(function (x) { return mulOf(x) <= cap; });
    if (!pool.length) pool = diff;
    if (!pool.length) {
      pool = list.filter(function (x) { return mulOf(x) <= cap; });
      if (!pool.length) pool = list;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* 冷却归零后，下一次结算时把玩家直接拽进下一个本。
     返回进入的 run，或 null（没到点 / 没有可进的本）。 */
  function dungeonTryForceStart() {
    const st = dungeonState();
    if (st.run) return null;
    if (!st.pendingForce) return null;
    if (dungeonCooldownLeft() > 0) return null;
    const pick = dungeonPickForceBatch(st.pendingForce);
    if (!pick) { st.pendingForce = null; dungeonSave(st); return null; }
    const r = dungeonStart(pick.id, { force: true });
    if (!r.ok) return null;
    const st2 = dungeonState();
    st2.pendingForce = null;
    if (st2.run) st2.run.forced = true;
    dungeonSave(st2);
    return st2.run;
  }

  /* result: 'win' | 'lose' | 'abort'
     通关 7 天冷却；失败和放弃都是 3 天 + 扣分 + 排队强制副本
     （放弃如果比失败轻，玩家就会用放弃来规避惩罚）。
     积分直接加减，允许负 —— 后面通关照常往上加，加到正为止。 */
  function dungeonFinish(result, extra) {
    const st = dungeonState();
    if (!st.run) return { ok: false, reason: '现在不在本里' };
    const r = st.run;
    const kind = (result === 'win') ? 'win' : (result === 'lose' ? 'lose' : 'abort');
    const isWin = kind === 'win';
    const js = dungeonJudgeStat(r);
    const lv = String(r.level || '').toUpperCase();
    const mul = DUNGEON_LEVEL_MUL[lv] || 1;

    const pg = dungeonProgress(r);
    let delta = 0;
    if (isWin) {
      /* 没撑满就提交 → 按撑到的比例打折。不是禁止，只是拿不到全分。 */
      const doneRate = pg ? Math.min(1, pg.survivedMin / pg.needMin) : 0;
      const base = Math.max(60, r.rounds * 5);
      /* 没提交规则判断就通关，只给半份成绩 —— 判断表才是这个玩法的核心 */
      const accPart = js.total ? (0.5 + 0.5 * js.acc) : 0.5;
      delta = Math.round(base * mul * doneRate * accPart);
    } else {
      delta = -(DUNGEON_FAIL_PENALTY[lv] || 20);
    }

    const pay = dungeonAddPoints(delta, '副本「' + r.name + '」' + (isWin ? '通关' : '失败'));

    st.history.unshift({
      runId: r.runId, name: r.name, level: r.level,
      round: r.round, rounds: r.rounds, result: kind,
      survivedMin: pg ? pg.survivedMin : 0, needMin: pg ? pg.needMin : 0,
      delta: pay.delta, pointsAfter: pay.after,
      right: js.right, judgeTotal: js.total,
      why: (extra && extra.reason) ? extra.reason : '', at: Date.now(),
      /* 结算旁白要用的现场：规则真伪、玩家勾了什么、违规痕迹。
         规则正文截到 40 字 —— history 是跟着聊天走的，别让它无限长。 */
      genre: r.genre || '',
      winCond: r.win || '', loseCond: r.lose || '',
      rules: (r.rules || []).map(function (x) {
        return { n: x.n, text: String(x.text || '').slice(0, 40), real: !!x.real };
      }),
      picks: Object.assign({}, r.judge || {}),
      hits: (r.hits || []).slice(-10).map(function (x) {
        return { hit: x.hit, who: x.who, rule: x.rule, why: String(x.why || '').slice(0, 40) };
      }),
      settleText: ''
    });
    if (st.history.length > 20) st.history.length = 20;
    st.run = null;
    const cdDays = isWin ? DUNGEON_CD_WIN_DAYS : DUNGEON_CD_FAIL_DAYS;
    st.cooldownUntilGame = dungeonGameNow() + cdDays * DUNGEON_DAY_MS;
    /* 输了就排队一个强制副本；赢了把队清掉 */
    st.pendingForce = isWin ? null : {
      level: r.level, name: r.name, srcId: r.id, at: Date.now()
    };
    dungeonSave(st);
    return {
      ok: true, result: kind, delta: pay.delta, name: r.name,
      right: js.right, total: js.total,
      survivedMin: pg ? pg.survivedMin : 0, needMin: pg ? pg.needMin : 0,
      pointsAfter: pay.after, debt: pay.after < 0 ? -pay.after : 0,
      forcedNext: !isWin,
      cooldownDays: cdDays, cooldownMs: cdDays * DUNGEON_DAY_MS
    };
  }

  /* ── 结算旁白（后台调模型，不占公屏） ───────────────────────
     分数永远由脚本算，AI 只写「这一局到底怎么了」的那段话。
     接口不可用 / 超时 / 空串 → 静默跳过，绝不让它挡住结算。 */
  async function dungeonSettleNarration(h) {
    if (!h || typeof callQuietModel !== 'function') return '';
    const ruleLines = (h.rules || []).map(function (x) {
      const pick = (h.picks || {})[x.n] || '';
      const my = pick ? (pick === 'real' ? '真' : '假') : '没勾';
      const truth = x.real ? '真' : '假';
      const ok = pick ? ((pick === 'real') === !!x.real) : null;
      return '  第 ' + x.n + ' 条「' + x.text + '」—— 实际是' + truth +
        '，玩家勾了' + my + (ok === null ? '' : (ok ? '（对）' : '（错）'));
    }).join('\n');
    const hitLines = (h.hits || []).map(function (x) {
      return '  ' + (x.who === 'char' ? '同行者' : '玩家') + ' · ' +
        (x.hit === 'fatal' ? '严重' : (x.hit === 'major' ? '中等' : '轻微')) + '违规' +
        (x.rule ? '（第 ' + x.rule + ' 条）' : '') + (x.why ? '：' + x.why : '');
    }).join('\n');
    const tag = h.result === 'win' ? '通关' : (h.result === 'lose' ? '失败' : '放弃');

    const sys = '你是无限流「主神空间」的结算旁白作者。用第二人称（你/你们）写一段结算旁白，' +
      '冷峻、克制、有画面，不煽情。只写这一局发生过什么、代价是什么，不要新增设定，不要替玩家做决定，' +
      '不要写标题或 Markdown。输出 180~260 字，最后单独一行用「主神：」开头写一句不超过 30 字的评语。';

    const user = [
      '副本：' + h.name + '（' + h.level + ' 级' + (h.genre ? ' · ' + h.genre : '') + '）',
      h.winCond ? '通关条件：' + h.winCond : '',
      h.loseCond ? '失败条件：' + h.loseCond : '',
      '结果：' + tag + '，存活 ' + dungeonFormatMin(h.survivedMin || 0) + ' / ' + dungeonFormatMin(h.needMin || 0),
      '规则判断：' + (h.right || 0) + '/' + (h.judgeTotal || 0) + ' 条正确',
      '积分：' + (h.delta > 0 ? '+' : '') + h.delta + '，结算后余额 ' + (h.pointsAfter == null ? '未知' : h.pointsAfter),
      ruleLines ? '规则真相与玩家判断：\n' + ruleLines : '',
      hitLines ? '违规痕迹：\n' + hitLines : '',
      '\n写这段结算旁白。'
    ].filter(Boolean).join('\n');

    try {
      const out = await callQuietModel(sys, user);
      return String(out || '').trim().slice(0, 1200);
    } catch (e) { return ''; }
  }

  /* 结算完的收尾：后台补旁白 → 写回 history → 落档案柜。
     不 await —— 玩家点完结算就能继续聊，旁白晚几秒自己长出来。 */
  async function dungeonAfterSettle() {
    const st = dungeonState();
    const h = st.history[0];
    if (!h) return;
    let text = '';
    try { text = await dungeonSettleNarration(h); } catch (e) { text = ''; }
    if (text) {
      const st2 = dungeonState();
      if (st2.history[0] && st2.history[0].runId === h.runId) {
        st2.history[0].settleText = text;
        dungeonSave(st2);
      }
      try { toast('主神写完了这一局的结算', 'info'); } catch (e) {}
    }
    try {
      archiveAdd({
        kind: 'dungeon', title: h.name, result: h.result, level: h.level,
        delta: h.delta, survivedMin: h.survivedMin || 0, needMin: h.needMin || 0,
        rulesRight: h.right, rulesTotal: h.judgeTotal, pointsAfter: h.pointsAfter,
        text: text, meta: { runId: h.runId, genre: h.genre || '' }
      });
    } catch (e) {}
    if (typeof refreshPanel === 'function') refreshPanel();
  }

  /* ── 注入 ─────────────────────────────────────────────────── */
  function dungeonPromptText() {
    const st = dungeonState();
    const r = st.run;
    if (!r) return '';
    const acts = Math.max(1, Math.round(r.rounds / 5));
    const act = dungeonActOf(r);
    const hp = typeof r.hp === 'number' ? r.hp : DUNGEON_MAX_HP;
    const chp = typeof r.charHp === 'number' ? r.charHp : DUNGEON_MAX_HP;

    const lines = [];
    const pg = dungeonProgress(r);
    lines.push('【副本 · 存活 ' + dungeonFormatMin(pg ? pg.survivedMin : 0) + ' / ' + dungeonFormatMin(pg ? pg.needMin : 0) +
      ' · 第 ' + (r.round || 1) + ' 回合 · 第 ' + act + '/' + acts + ' 幕 · ' + r.level + ' 级】');
    lines.push('本名：' + r.name);
    if (r.genre) lines.push('类型：' + r.genre);
    if (r.win) lines.push('通关条件：' + r.win);
    if (r.lose) lines.push('失败条件：' + r.lose);
    lines.push('');
    lines.push('这一段是副本，不是主线。好感 / 亲密照常结算。副本里的时间跟外面一样在走：'
      + '你每写一轮，时钟就往前挪一点，玩家头上那个「存活倒计时」也一起掉。'
      + '写到过夜、写到「熬了两个小时」，时间就真的过去这么多，倒计时跟着跳。'
      + '但不要为了凑时间一口气跳到通关，也不要自己报「你还剩多少分钟」这种数值。'
      + '只演副本场景里的人和事，别让主线地点与人物凭空出现。');
    if (pg && pg.full) {
      lines.push('（这一局已经撑满存活时间，玩家随时可以提交规则判断收尾 —— 你正常写收尾的那一幕就行。）');
    } else if (pg) {
      lines.push('（还没撑满，还剩约 ' + dungeonFormatMin(pg.leftMin) + ' 的剧情时间。按分幕往下推，该过夜就过夜。）');
    }

    if (r.rules && r.rules.length) {
      lines.push('');
      lines.push('【规则表 · 只有你能看到真假，正文里绝对不能出现这些标记，也不能让角色"直觉知道"】');
      lines.push('标记含义：[真] = 违反会出事；[假] = 遵守才会出事（上一个死者留下的陷阱）。');
      r.rules.forEach(function (x) {
        lines.push('  ' + x.n + '. [' + (x.real ? '真' : '假') + '] ' + x.text);
      });
    }

    if (r.acts) {
      lines.push('');
      lines.push('【分幕大纲】（按它推进，别提前跳到后面几幕）');
      lines.push(r.acts);
      lines.push('当前是第 ' + act + ' 幕，只落到这一幕该出现的东西。');
    }

    lines.push('');
    lines.push('【这一轮按顺序想，想完再写正文】');
    lines.push('1) 玩家做了什么？碰到哪条规则？按后果分四档：');
    lines.push('   none 没违规 / minor 轻微（说错话、进错房间、被小怪缠上）');
    lines.push('   major 中等（明知故犯、破坏关键物件、被精英抓住）/ fatal 严重（直触禁忌、被 BOSS 追上）');
    lines.push('2) 玩家没动、是角色在行动时，站到角色视角上：角色只知道亲历过和被明确告知的事，'
      + '不知道规则真假、不知道怪物在哪、不知道大纲。角色按自己的性格与已知信息判断，'
      + '这个判断可以是错的，也可以因此踩雷。');
    lines.push('3) 得出这一轮的结果，写进正文。违反规则要有代价（受伤 / 异象逼近 / 东西变了），'
      + '但不要写数值，不要写「你掉了 16 点血」。');
    lines.push('');
    lines.push('【正文写完之后，最后单独附一行，玩家看不见，脚本要读】');
    lines.push('<ruled>{"hit":"none","who":"player","rule":0,"why":""}</ruled>');
    lines.push('hit 取 none / minor / major / fatal；who 取 player / char；rule 填违反的规则序号（没违反写 0）；'
      + 'why 一句话（12 字内）。这一行必须在回复最末尾，前后不要加任何别的格式。');

    lines.push('');
    if (r.forced) {
      lines.push('【这一场是被强行拽进来的】结尾不要写「你选择了这个副本」，'
        + '要写传送的瞬间、上一场的残留感、没得选的那种被动。');
    }
    lines.push('【当前血量】你 ' + hp + '/' + DUNGEON_MAX_HP + '，'
      + (r.charName || '同行者') + (r.charGhost ? ' 已阵亡。' : (' ' + chp + '/' + DUNGEON_MAX_HP + '。')));
    if (hp <= 24) lines.push('你伤得很重，正文里要写出站不稳、看不清这类状态。');
    if (r.charGhost) {
      lines.push('角色现在是幽灵形态：能说话、能出主意、能表达情绪，但碰不了任何东西，'
        + '不能被攻击，也挡不了刀。只有你和玩家看得见他，副本里的其他人看不见。'
        + '他说的话可以是错的 —— 他也在猜。');
    }

    if (r.body) {
      lines.push('');
      lines.push('【副本设定】');
      lines.push(r.body);
      lines.push('');
      lines.push('设定里的「隐藏线索」是留给玩家自己挖的：不要主动说出来，'
        + '只有玩家真的去查那个地方，才让角色看见。');
    }
    return lines.join('\n');
  }

  function injectDungeonPrompt() {
    try {
      const text = dungeonPromptText();
      callSetPrompt(PROMPT_KEY + '_dungeon', text, 0, 1, false);
      return !!text;
    } catch (e) { return false; }
  }

  /* ── 面板片段 ─────────────────────────────────────────────── */

  function dungeonFormatLeft(ms) {
    return dungeonFormatMin(Number(ms || 0) / 60000);
  }

  function dungeonHpBar(label, cur, max) {
    const pct = Math.max(0, Math.min(100, (Number(cur || 0) / Math.max(1, max)) * 100));
    const cls = pct <= 20 ? ' is-crit' : (pct <= 50 ? ' is-low' : '');
    return '<div class="mp-dg-hp-row">' +
      '<span class="mp-dg-hp-lab">' + escapeFeatureHtml(label) + '</span>' +
      '<span class="mp-dg-hp-bar"><i class="' + cls + '" style="width:' + pct.toFixed(1) + '%"></i></span>' +
      '<b>' + Math.max(0, Math.round(Number(cur || 0))) + '<em>/' + max + '</em></b>' +
      '</div>';
  }

  function dungeonHitLabel(h) {
    if (h === 'fatal') return '严重';
    if (h === 'major') return '中等';
    return '轻微';
  }

  function dungeonRunBody(r) {
    const js = dungeonJudgeStat(r);
    const act = dungeonActOf(r);
    const acts = Math.max(1, Math.round(r.rounds / 5));
    const pg = dungeonProgress(r) || { needMin: 0, survivedMin: 0, leftMin: 0, pct: 0, full: false };
    const hp = typeof r.hp === 'number' ? r.hp : DUNGEON_MAX_HP;
    let pts = null;
    try { pts = (typeof getPlayerState === 'function') ? (Number(getPlayerState().points) || 0) : null; } catch (e) {}

    let html = '<div class="mp-dg-run">' +
      '<b>' + escapeFeatureHtml(r.name) + '（' + escapeFeatureHtml(r.level) + ' 级' +
      (r.genre ? ' · ' + escapeFeatureHtml(r.genre) : '') + '）</b>' +
      '<small>存活 ' + dungeonFormatMin(pg.survivedMin) + ' / ' + dungeonFormatMin(pg.needMin) +
      ' · 第 ' + Math.max(1, r.round || 0) + ' 回合 · 第 ' + act + '/' + acts + ' 幕</small>' +
      '<div class="mp-dg-time"><i' + (pg.full ? ' class="is-full"' : (pg.pct >= 75 ? ' class="is-near"' : '')) +
      ' style="width:' + pg.pct.toFixed(1) + '%"></i></div>' +
      '<small class="mp-dg-time-lab">' +
      (pg.full
        ? '已撑满。可以提交规则判断收尾，分数按判断正确率给满'
        : ('还差 ' + dungeonFormatMin(pg.leftMin) + '。时间照剧情往前走，不按回合数算')) +
      '</small>' +
      '<div class="mp-dg-hp">' +
      dungeonHpBar('你', hp, DUNGEON_MAX_HP) +
      (r.charGhost
        ? '<div class="mp-dg-hp-row">' +
          '<span class="mp-dg-hp-lab">' + escapeFeatureHtml(r.charName || '同行者') + '</span>' +
          '<span class="mp-dg-ghost">阵亡 · 幽灵形态</span>' +
          '<b>0<em>/' + DUNGEON_MAX_HP + '</em></b></div>'
        : dungeonHpBar(r.charName || '同行者', typeof r.charHp === 'number' ? r.charHp : DUNGEON_MAX_HP, DUNGEON_MAX_HP)) +
      '</div>' +
      (r.charGhost
        ? '<small class="mp-dg-why">同行者已阵亡，现在是幽灵：能说话、能出主意，碰不了东西，也挡不了刀</small>'
        : '') +
      '</div>';

    if (pts !== null && pts < 0) {
      html += '<div class="mp-dg-warn">账户欠费 ' + Math.abs(pts) + ' 分，商城已锁。通关会照常往上加，加到正数为止。</div>';
    }

    if (hp <= DUNGEON_MAX_HP * 0.2) {
      html += '<div class="mp-dg-warn">血量见底，下一次违规就可能被强制退出。</div>';
    }

    if (r.lastHit) {
      html += '<div class="mp-dg-last">上一轮：' + dungeonHitLabel(r.lastHit.hit) + '违规' +
        (r.lastHit.rule ? '（第 ' + r.lastHit.rule + ' 条）' : '') +
        (r.lastHit.why ? ' · ' + escapeFeatureHtml(r.lastHit.why) : '') +
        ' · ' + (r.lastHit.who === 'char' ? escapeFeatureHtml(r.charName || '同行者') : '你') +
        ' −' + r.lastHit.dmg + '</div>';
    }

    if (!r.rules.length) {
      html += '<div class="mp-dg-empty" style="margin-top:10px"><b>这个本没写规则段</b>' +
        '<small>只能当普通剧情本跑，没有「判断真假规则」这一环。想玩规则怪谈，在世界书里补一段：</small>' +
        '<pre class="mp-dg-code">【规则】\n1. [真] 不要给没有影子的人结账\n2. [假] 凌晨三点必须关灯</pre></div>';
    } else {
      html += '<div class="mp-sub-label" style="margin-top:12px">规则表 · 哪些是真的？<span class="mp-dg-count">（' +
        js.done + '/' + js.total + '）</span></div>';
      html += '<div class="mp-dg-rules">';
      r.rules.forEach(function (x) {
        const pick = (r.judge || {})[x.n] || '';
        html += '<div class="mp-dg-rule">' +
          '<span class="mp-dg-rule-n">' + x.n + '</span>' +
          '<span class="mp-dg-rule-t">' + escapeFeatureHtml(x.text) + '</span>' +
          '<span class="mp-dg-rule-b">' +
          '<button class="mp-dg-pick' + (pick === 'real' ? ' is-on' : '') + '" data-dg-judge="' + x.n + '" data-dg-val="real">真</button>' +
          '<button class="mp-dg-pick' + (pick === 'fake' ? ' is-on' : '') + '" data-dg-judge="' + x.n + '" data-dg-val="fake">假</button>' +
          '</span></div>';
      });
      html += '</div>';
      html += '<div class="mp-grid">' +
        '<button class="mp-btn mp-btn-highlight" data-dg-act="submit"' + (js.allDone ? '' : ' disabled') + '>' +
        '<span>提交判断，结算</span><small>' +
        (js.allDone
          ? (pg.full
            ? '撑满了：通关后关 ' + DUNGEON_CD_WIN_DAYS + ' 个游戏日'
            : '没撑满：分数按 ' + Math.round(pg.pct) + '% 打折')
          : ('还有 ' + (js.total - js.done) + ' 条没判断')) +
        '</small></button>' +
        '<button class="mp-btn" data-dg-act="abort"><span>放弃这一局</span><small>算失败：扣 ' +
        (DUNGEON_FAIL_PENALTY[String(r.level || '').toUpperCase()] || 20) +
        ' 分，关 ' + DUNGEON_CD_FAIL_DAYS + ' 个游戏日，之后会被塞进新副本</small></button>' +
        '</div>';
    }

    if (r.hits && r.hits.length) {
      html += '<div class="mp-dg-history"><div class="mp-sub-label">违规记录</div>' +
        r.hits.slice(-6).reverse().map(function (h) {
          return '<div class="mp-dg-hrow"><span>第 ' + h.round + ' 回合 · ' + dungeonHitLabel(h.hit) +
            (h.rule ? ' · 第 ' + h.rule + ' 条' : '') + '</span><small>' +
            (h.who === 'char' ? escapeFeatureHtml(r.charName || '同行者') : '你') + ' −' + h.dmg + '</small></div>';
        }).join('') + '</div>';
    }
    return html;
  }

  function dungeonPanelBody() {
    const st = dungeonState();
    const run = st.run;
    const list = dungeonLibList();
    const cd = dungeonCooldownLeft();

    if (run) return dungeonRunBody(run);

    let head = '';
    if (cd > 0) {
      const lastH = st.history[0];
      const isWinCd = !!(lastH && lastH.result === 'win');
      head = '<div class="mp-dg-run is-cd"><b>' + (isWinCd ? '通关冷却' : '失败冷冻') + '：还有 ' +
        dungeonFormatLeft(cd) + ' 剧情时间</b>' +
        '<small>' + (isWinCd ? '通关要等 ' + DUNGEON_CD_WIN_DAYS + ' 天' : '失败 / 放弃要等 ' + DUNGEON_CD_FAIL_DAYS + ' 天') +
        '，按游戏时间算：得让剧情里的时间走过去才解冻，挂机等没用。只锁进本，不影响正常聊天</small>' +
        (st.pendingForce
          ? '<small class="mp-dg-why">解冻的那一轮会被直接拽进下一个副本，不会再问你</small>'
          : '') +
        '</div>';
    } else if (st.pendingForce) {
      head = '<div class="mp-dg-run is-cd"><b>时间到了，但你还欠着一场</b>' +
        '<small>这一次由主神指定：下一条消息发出去，队伍就会被直接塞进一个新副本</small></div>';
    }

    if (!list.length) {
      return head +
        '<div class="mp-dg-empty"><b>还没认到副本</b>' +
        '<small>把带「副本·」标题的世界书条目导入酒馆，再点下面的扫描。正文这样写：</small>' +
        '<pre class="mp-dg-code">副本·深夜便利店\n等级：E\n最少回合：20\n类型：怪谈\n胜利：撑到六点并交出正确的规则表\n失败：血量归零\n\n【规则】\n1. [真] 不要给没有影子的人结账\n2. [假] 凌晨三点必须关灯</pre>' +
        '<div class="mp-grid"><button class="mp-btn mp-btn-highlight" data-dg-act="scan"><span>扫描世界书</span><small>认一遍「副本·」开头的条目</small></button></div></div>' +
        archiveRenderHtml('dungeon');
    }

    let rows = '';
    list.forEach(function (it) {
      const gone = !!it.gone;
      const noRule = !(it.rules && it.rules.length);
      const why = gone ? '世界书里已经找不到这条了'
        : (noRule ? '没写【规则】段，只能当普通剧情本跑' : '');
      rows += '<div class="mp-dg-row' + (gone ? ' is-bad' : '') + '">' +
        '<label class="mp-dg-check"><input type="checkbox" data-dg-toggle="' + escapeFeatureHtml(it.id) + '"' +
        (it.enabled ? ' checked' : '') + (gone ? ' disabled' : '') + '><span>' +
        '<b>' + escapeFeatureHtml(it.name) + '</b>' +
        '<small>' + escapeFeatureHtml(it.level) + ' 级 · 存活 ' +
        dungeonFormatMin(it.needMin || dungeonNeedMinutes(it.surviveMin, it.rounds)) +
        (it.rules && it.rules.length ? ' · ' + it.rules.length + ' 条规则' : '') +
        (it.kind ? ' · ' + escapeFeatureHtml(it.kind) : '') +
        (it.book ? ' · 《' + escapeFeatureHtml(it.book) + '》' : '') + '</small>' +
        (why ? '<small class="mp-dg-why">' + escapeFeatureHtml(why) + '</small>' : '') +
        '</span></label>' +
        (it.enabled && !gone && !run && cd === 0 && !st.pendingForce
          ? '<button class="mp-btn mp-btn-sm" data-dg-start="' + escapeFeatureHtml(it.id) + '">进本</button>'
          : '') +
        '</div>';
    });

    return head +
      '<div class="mp-dg-list">' + rows + '</div>' +
      '<div class="mp-grid"><button class="mp-btn" data-dg-act="scan"><span>重新扫描世界书</span><small>加了新本、改了标题之后点一下</small></button></div>' +
      (st.history.length
        ? '<div class="mp-dg-history"><div class="mp-sub-label">最近几局</div>' +
          st.history.slice(0, 5).map(function (h) {
            const tag = h.result === 'win' ? '通关' : (h.result === 'lose' ? '失败' : '放弃');
            return '<div class="mp-dg-hrow"><span>' + escapeFeatureHtml(h.name) + '</span><small>' +
              tag + ' · ' + (h.survivedMin
                ? ('存活 ' + dungeonFormatMin(h.survivedMin) + '/' + dungeonFormatMin(h.needMin))
                : (h.round + '/' + h.rounds + ' 轮')) +
              (h.judgeTotal ? ' · 规则 ' + (h.right || 0) + '/' + h.judgeTotal : '') +
              (h.delta ? ' · ' + (h.delta > 0 ? '+' : '') + h.delta + ' 分' : '') +
              (typeof h.pointsAfter === 'number'
                ? (h.pointsAfter < 0 ? (' · 欠 ' + Math.abs(h.pointsAfter)) : (' · 余 ' + h.pointsAfter)) : '') +
              (h.settleText
                ? ' · <button class="mp-btn mp-btn-sm" data-dg-narr="' + escapeFeatureHtml(h.runId) + '">看结算</button>'
                : '') +
              '</small></div>';
          }).join('') + '</div>'
        : '') +
      archiveRenderHtml('dungeon');
  }

  function bindDungeonPanel(panel) {
    if (!panel) return;
    panel.querySelectorAll('[data-dg-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const act = btn.getAttribute('data-dg-act');
        if (act === 'scan') {
          const found = dungeonScan();
          try { toast(found.length ? ('认到 ' + found.length + ' 个副本') : '没找到「副本·」开头的条目', found.length ? 'success' : 'warning'); } catch (e) {}
          refreshPanel();
          return;
        }
        if (act === 'submit') {
          const js = dungeonJudgeStat(dungeonCurrent());
          if (!js.allDone) { try { toast('还有 ' + (js.total - js.done) + ' 条规则没判断', 'warning'); } catch (e) {} return; }
          const r = dungeonFinish('win');
          if (r.ok) {
            try {
              let msg = '副本「' + r.name + '」结算：规则 ' + r.right + '/' + r.total + '，+' + r.delta + ' 分';
              if (r.debt > 0) msg += '，账户还欠 ' + r.debt;
              msg += '。关 ' + r.cooldownDays + ' 个游戏日';
              toast(msg, r.survivedMin >= r.needMin ? 'success' : 'warning');
            } catch (e) {}
          }
          refreshPanel();
          /* 分数已经落袋，旁白后台补：晚几秒自己长出来，不耽误继续聊 */
          dungeonAfterSettle();
          return;
        }
        if (act === 'abort') {
          const r = dungeonFinish('abort');
          if (r.ok) {
            try {
              toast('已放弃：' + r.delta + ' 分，关 ' + r.cooldownDays + ' 个游戏日，时间到了会被塞进一个新副本', 'warning');
            } catch (e) {}
          }
          refreshPanel();
          dungeonAfterSettle();
        }
      });
    });
    panel.querySelectorAll('[data-dg-toggle]').forEach(function (box) {
      box.addEventListener('change', function () {
        dungeonToggle(box.getAttribute('data-dg-toggle'), !!box.checked);
        refreshPanel();
      });
    });
    panel.querySelectorAll('[data-dg-start]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const r = dungeonStart(btn.getAttribute('data-dg-start'));
        if (!r.ok) { try { toast(r.reason || '进不去', 'warning'); } catch (e) {} return; }
        try { toast('进入副本「' + r.run.name + '」，要存活 ' + dungeonFormatMin(r.run.needMin), 'success'); } catch (e) {}
        refreshPanel();
      });
    });
    /* 规则表的真/假：点一下记一下，不整块刷新（否则每点一条就滚回顶部） */
    panel.querySelectorAll('[data-dg-judge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const n = parseInt(btn.getAttribute('data-dg-judge'), 10);
        const val = btn.getAttribute('data-dg-val');
        dungeonJudgeRule(n, val);
        const box = btn.parentNode;
        if (box) {
          box.querySelectorAll('.mp-dg-pick').forEach(function (b) {
            b.classList.toggle('is-on', b.getAttribute('data-dg-val') === val);
          });
        }
        const js = dungeonJudgeStat(dungeonCurrent());
        const sub = panel.querySelector('[data-dg-act="submit"]');
        if (sub) {
          sub.disabled = !js.allDone;
          const sm = sub.querySelector('small');
          if (sm) {
            const pgr = dungeonProgress(dungeonCurrent()) || { pct: 0, full: false };
            sm.textContent = js.allDone
              ? (pgr.full
                ? ('撑满了：通关后关 ' + DUNGEON_CD_WIN_DAYS + ' 个游戏日')
                : ('没撑满：分数按 ' + Math.round(pgr.pct) + '% 打折'))
              : ('还有 ' + (js.total - js.done) + ' 条没判断');
          }
        }
        const lab = panel.querySelector('.mp-dg-count');
        if (lab) lab.textContent = '（' + js.done + '/' + js.total + '）';
      });
    });

    /* 「看结算」：把后台写好的那段旁白调出来 */
    panel.addEventListener('click', function (ev) {
      const btn = ev.target && ev.target.closest ? ev.target.closest('[data-dg-narr]') : null;
      if (!btn) return;
      ev.preventDefault();
      const rid = btn.getAttribute('data-dg-narr');
      const h = (dungeonState().history || []).filter(function (x) { return x.runId === rid; })[0];
      if (!h || !h.settleText) return;
      showModalDialog(escapeFeatureHtml(h.name) + ' · 结算',
        '<div style="max-height:50vh;overflow:auto;padding:12px;background:var(--k-sur-0,#100a13);border:1px solid var(--k-frame,#693253);font-size:12px;line-height:1.95;white-space:pre-wrap">' +
        escapeFeatureHtml(h.settleText) + '</div>',
        null, { confirmText: '关闭' });
    });

    /* 档案柜（跨对话）：点击 / 开关都用委托，面板重绘也不会重复绑 */
    archiveBind(panel);
  }
