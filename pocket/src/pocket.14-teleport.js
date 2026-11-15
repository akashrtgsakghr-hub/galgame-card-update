/* ═══════════════════════════════════════════════════════════════════════════
   MOON POCKET / 瞬间移动
   ─ 前提：队伍里得有一只「会瞬间移动」的宝可梦（念力系那几条线）。
     判断不靠玩家自报，是去读卡带的存档区：Flash 扇区 → SaveBlock1 → 队伍 →
     解密（Gen3 的 100 字节宝可梦记录）→ 看四个招式里有没有 100 号（TELEPORT）。
   ─ 为什么不做「真·写坐标」：核心只导出 ROM / 存档区 / 帧缓冲 / 金手指文本
     四个符号，没有 RAM 出口，也没有写内存的接口。所以瞬移＝把算好的路线
     按帧代按方向键、用不着等动画：视觉上就是嗖一下沿着路线掠过。
     好处是卡带一个字节都不用改，存档也照旧。
   ─ 拆件：这一段只管「能不能瞬移」和「怎么代跑」；认路靠 pocket.12，
     认在哪张图靠 pocket.13，本文件不碰地图数据。
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 一、存档结构常量（对着 pokeemerald 的 global.h 抄的） ───────────────── */
var TP_SECTOR = 0x1000;          // Flash 每个扇区 4KB
var TP_SECTOR_DATA = 0xf80;      // 前 0xF80 是数据，尾巴 0x80 是扇脚
var TP_SB1_SECS = [1, 2, 3, 4];  // SaveBlock1 占 1..4 号扇区
var TP_SB1_SIZE = TP_SECTOR_DATA * 4;
var TP_SECURITY = 0x08012025;    // 扇脚里的固定签名，用来认「这是个真扇区」
var TP_OFF_COUNT = 0x234;        // SaveBlock1 + 0x234 = 队伍数量
var TP_OFF_PARTY = 0x238;        // SaveBlock1 + 0x238 = 队伍数组
var TP_MON = 100;                // struct Pokemon 100 字节
var TP_PARTY_MAX = 6;
var TP_MOVE_TELEPORT = 100;      // MOVE_TELEPORT

/* 12 个字按 (性格 % 24) 摆成四段：0=成长 1=招式 2=努力 3=杂项 */
var TP_SUB_ORDER = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0]
];

/* 只会用来显示，认不出来也不影响判断 */
var TP_SPECIES_NAME = {
  63: "凯西", 64: "勇基拉", 65: "胡地", 177: "天然雀", 178: "天然鸟",
  280: "拉鲁拉丝", 281: "奇鲁莉亚", 282: "沙奈朵", 337: "月石", 338: "太阳岩",
  358: "风铃铃", 343: "天平偶", 344: "念力土偶", 325: "跳跳猪", 326: "噗噗猪"
};

function tpU16(b, o) { return (b[o] | (b[o + 1] << 8)) & 0xffff; }
function tpU32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function tpName(species) { return TP_SPECIES_NAME[species] || ("图鉴 #" + species); }

/* ── 二、读队伍 ───────────────────────────────────────────────────────────
   一只宝可梦 = 头部 0x20 字节（明文：性格/初训家ID/名字/…）+ 0x30 字节数据段。
   数据段用「性格 ^ ID」当钥匙整段异或，解开再按性格决定四段的排法。 */
function tpReadMon(b, off) {
  var personality = tpU32(b, off), otId = tpU32(b, off + 4);
  var key = (personality ^ otId) >>> 0;
  var order = TP_SUB_ORDER[personality % 24];
  var w = new Uint32Array(12), i;
  for (i = 0; i < 12; i++) w[i] = (tpU32(b, off + 0x20 + i * 4) ^ key) >>> 0;

  var growth = null, attacks = null;
  for (var s = 0; s < 4; s++) {
    var seg = [w[s * 3], w[s * 3 + 1], w[s * 3 + 2]];
    if (order[s] === 0) growth = seg;
    else if (order[s] === 1) attacks = seg;
  }
  if (!growth || !attacks) return null;

  return {
    personality: personality,
    species: growth[0] & 0xffff,
    exp: growth[1],
    friendship: (growth[2] >>> 8) & 0xff,
    level: b[off + 0x54],
    moves: [attacks[0] & 0xffff, attacks[0] >>> 16, attacks[1] & 0xffff, attacks[1] >>> 16]
  };
}

/* 扇脚：[0xFF4]编号 [0xFF6]校验 [0xFF8]签名 [0xFFC]计数器。签名不对就当没这个扇区 */
function tpSectorId(flash, base) {
  if (base + TP_SECTOR > flash.length) return -1;
  if (tpU32(flash, base + 0xff8) !== TP_SECURITY) return -1;
  return tpU16(flash, base + 0xff4);
}

/* 把 1..4 号扇区拼回 SaveBlock1（每次开机柜里存的位置不一定一样，按编号找） */
function tpSaveBlock1(flash) {
  if (!flash || flash.length < TP_SECTOR * 2) return null;
  var slot = [undefined, undefined, undefined, undefined];
  var n = Math.floor(flash.length / TP_SECTOR);
  for (var i = 0; i < n; i++) {
    var id = tpSectorId(flash, i * TP_SECTOR);
    if (id >= 1 && id <= 4) slot[id - 1] = i * TP_SECTOR;
  }
  for (i = 0; i < 4; i++) if (slot[i] === undefined) return null;
  var out = new Uint8Array(TP_SB1_SIZE);
  for (i = 0; i < 4; i++) out.set(flash.subarray(slot[i], slot[i] + TP_SECTOR_DATA), i * TP_SECTOR_DATA);
  return out;
}

/* 队伍：「最后一次在游戏里存过的那一份」。不是实时内存读的——核心没这个出口 */
function tpParty() {
  var flash = (typeof coreSavView !== "undefined" && coreSavView) ? coreSavView : null;
  if (!flash) return { ok: false, kind: "noflash", why: "核心没在跑，读不到存档区" };
  var sb1 = tpSaveBlock1(flash);
  if (!sb1) {
    /* 分不清「没存过」还是「对不上」的时候别乱猜：整片都是 FF/00 才是没存过，
       里头有别的字节就说明有存档、只是扇区结构不是官方那套（改版常见）。 */
    var blank = true;
    for (var k = 0; k < flash.length; k++) { var v = flash[k]; if (v !== 0xff && v !== 0x00) { blank = false; break; } }
    return blank
      ? { ok: false, kind: "blank", why: "存档区还是空的——游戏里还没存过档" }
      : { ok: false, kind: "broken", why: "读到了存档，但队伍位置跟官方对不上（改版常见）" };
  }
  var count = sb1[TP_OFF_COUNT];
  if (count === 0) return { ok: true, list: [], why: "存档时队伍还是空的" };
  if (count > TP_PARTY_MAX) return { ok: false, kind: "broken", why: "读到了存档，但队伍位置跟官方对不上（改版常见）" };

  var list = [];
  for (var i = 0; i < count; i++) {
    var m = tpReadMon(sb1, TP_OFF_PARTY + i * TP_MON);
    if (!m || !m.species || m.species > 440 || m.level > 100)
      return { ok: false, kind: "broken", why: "读到了存档，但队伍数据对不上（改版常见）" };
    list.push({
      slot: i + 1, species: m.species, level: m.level, moves: m.moves,
      friendship: m.friendship,
      teleport: m.moves.indexOf(TP_MOVE_TELEPORT) >= 0
    });
  }
  return { ok: true, list: list };
}

/* ── 三、解锁判定 ─────────────────────────────────────────────────────────
   读过一次就记 2 秒，免得开图时反复解压。手动开锁是给「存档结构对不上」的
   改版留的后门，正常卡带走不到那里。 */
var tpGateCache = null, tpGateAt = 0;

function tpManualFlag() {
  try { return LS.getItem(FLAG_PREFIX + "warp-manual") === "1"; } catch (e) { return false; }
}
function tpSetManualFlag(on) {
  try { on ? LS.setItem(FLAG_PREFIX + "warp-manual", "1") : LS.removeItem(FLAG_PREFIX + "warp-manual"); } catch (e) {}
  tpGateAt = 0; tpGateCache = null;
}

function tpUnlocked(force) {
  var now = Date.now();
  if (!force && tpGateCache && now - tpGateAt < 2000) return tpGateCache;

  var res;
  var p = tpParty();
  if (!p.ok) {
    res = { ok: false, kind: p.kind, why: p.why, list: [], broken: p.kind === "broken" };
  } else {
    var hit = null;
    for (var i = 0; i < p.list.length; i++) if (p.list[i].teleport) { hit = p.list[i]; break; }
    res = hit
      ? { ok: true, mon: hit, list: p.list, name: tpName(hit.species) }
      : { ok: false, why: p.list.length ? "队伍里没有会「瞬间移动」的宝可梦" : "存档时队伍还是空的", list: p.list };
  }
  if (!res.ok && tpManualFlag()) res = { ok: true, manual: true, list: res.list, name: "手动开锁" };
  tpGateCache = res; tpGateAt = now;
  return res;
}

/* ── 四、代跑 ─────────────────────────────────────────────────────────────
   一格 16 帧（一个半步 8 帧），换方向先转 8 帧。按帧数喂，不按毫秒——
   倍速一开毫秒就不准了，帧数是死的。
   TP_HW 是硬件层，测试时可以整个换掉，状态机本身不依赖浏览器。 */
var TP_FRAMES_TILE = 16, TP_FRAMES_TURN = 8, TP_FRAMES_SETTLE = 6;
/* 一次长按最多按住几格。一整条直路可能有三十格，一次按完会卡住一秒多，
   中途也没机会查遇敌；拆成小段按，方向不变就不用重新转身。 */
var TP_RUN_MAX = 12;

var TP_HW = {
  step: function (n) {
    if (typeof GBA_CORE === "undefined" || !GBA_CORE.step) return 0;
    return GBA_CORE.step(n);
  },
  key: function (btn, down) {
    if (typeof coreSetKey === "function") coreSetKey(btn, down);
  },
  manual: function (on) {
    if (typeof GBA_CORE !== "undefined" && GBA_CORE.manual) GBA_CORE.manual(on);
  },
  soon: function (fn) {
    if (typeof requestAnimationFrame === "function") return requestAnimationFrame(fn);
    return setTimeout(fn, 16);
  },
  identify: function () {
    return (typeof navIdentify === "function") ? navIdentify() : null;
  },
  makePlan: function (here, dest) {
    if (typeof navAtlas !== "function" || typeof moonPlan !== "function") return null;
    return moonPlan(navAtlas(), navAdj(), here.idx, here.x, here.y, dest.idx, dest.x, dest.y);
  }
};

var tpState = null;    // { plan, si, ri, runs, dir, needIdentify, settle, rounds, steps, total }

function tpDirOf(from, to) {
  if (!from || !to) return null;
  var dx = to.x - from.x, dy = to.y - from.y;
  /* 两个轴同时变 = 斜着走，方向盘按不出来。正常路线只会出一个轴的差，
     所以这里直接判歪，宁可停下也不按着一个方向硬冲 */
  if (dx && dy) return null;
  if (dx > 0) return "right";
  if (dx < 0) return "left";
  if (dy > 0) return "down";
  if (dy < 0) return "up";
  return null;
}

/* 同方向连着几步合成一次长按，别一格一格地按——那样走起来像抽筋 */
function tpRunsOf(steps, from) {
  var runs = [], cur = { x: from.x, y: from.y }, i = 0;
  if (!steps || !steps.length) return runs;
  while (i < steps.length) {
    var dir = tpDirOf(cur, steps[i]);
    if (!dir) return null;                    // 路线里有斜着走的，说明上游算错了
    var n = 1;
    while (i + n < steps.length && tpDirOf(steps[i + n - 1], steps[i + n]) === dir) n++;
    /* 太长就拆开，每段最多 TP_RUN_MAX 格 */
    var left = n;
    while (left > TP_RUN_MAX) { runs.push({ dir: dir, n: TP_RUN_MAX }); left -= TP_RUN_MAX; }
    runs.push({ dir: dir, n: left });
    cur = steps[i + n - 1];
    i += n;
  }
  return runs;
}

/* 画面白到什么程度：战斗过场会整屏刷白，一路走过去不会。
   采样按 4 像素跳着取（约 1500 点），够判断也不拖速度。 */
function tpWash() {
  var d = (typeof coreImageData !== "undefined" && coreImageData) ? coreImageData.data : null;
  if (!d || d.length < 240 * 160 * 4) return 0;
  var lit = 0, n = 0;
  for (var y = 2; y < 158; y += 4) {
    for (var x = 2; x < 238; x += 4) {
      var i = (y * 240 + x) * 4;
      if (d[i] + d[i + 1] + d[i + 2] > 720) lit++;
      n++;
    }
  }
  return n ? lit / n : 0;
}

function tpReleaseKeys() {
  TP_HW.key("up", false); TP_HW.key("down", false);
  TP_HW.key("left", false); TP_HW.key("right", false);
}

/* 一次「原子动作」：按住一个方向走完一段，或者处理一次刚跨完图的重认。
   返回 true 表示还有下一步，false 表示结束了。调度器只管反复调它。 */
function tpStepOnce() {
  var st = tpState;
  if (!st || st.stop) return false;

  /* ① 刚跨完图：先让画面稳下来，再重新认位置、重新算路 */
  if (st.needIdentify) {
    TP_HW.step(st.settle || 40);
    st.settle = 26;
    var here = TP_HW.identify();
    if (!here) {
      st.miss = (st.miss || 0) + 1;
      if (st.miss > 6) { tpEnd("到了新地方但认不出位置，剩下的路自己走吧"); return false; }
      return true;
    }
    st.miss = 0;
    st.needIdentify = false;
    if (typeof navHere !== "undefined") navHere = here;

    var np = TP_HW.makePlan(here, st.dest);
    if (!np) { tpEnd("落地后这条路走不通了（可能被 NPC 挡着，或者要秘传技）"); return false; }
    if (!np.length) { tpEnd("到了"); return false; }
    st.rounds++;
    if (st.rounds > 8) { tpEnd("绕了 8 圈还没到，先停下"); return false; }
    st.plan = np; st.si = 0; st.ri = 0;
    st.runs = tpRunsOf(np[0].steps, here);
    st.dir = null;
    if (!st.runs) { tpEnd("路线算歪了，停下"); return false; }
    st.total = np[0].steps.length;
    tpProgress("重新上路");
    return true;
  }

  var seg = st.plan[st.si];
  if (!seg) { tpEnd("到了"); return false; }

  /* ② 这一段走完了 */
  if (!st.runs || st.ri >= st.runs.length) {
    var isLast = (st.si + 1 >= st.plan.length);
    if (!isLast) {
      st.si++;
      st.needIdentify = true;
      st.settle = 46;                 // 门/边界过场大概 40 帧
      tpProgress("正在穿过地图边界");
      return true;
    }
    TP_HW.step(26);
    var fin = TP_HW.identify();
    if (fin && st.dest && fin.idx === st.dest.idx) tpEnd("到了 · " + (st.dest.name || "目的地"));
    else tpEnd("走完了，但没认准位置——看一眼地图确认一下");
    return false;
  }

  /* ③ 按住一个方向走一段 */
  var run = st.runs[st.ri++];
  var frames = run.n * TP_FRAMES_TILE + TP_FRAMES_SETTLE;
  if (st.dir && st.dir !== run.dir) frames += TP_FRAMES_TURN;
  st.dir = run.dir;
  TP_HW.key(run.dir, true);
  TP_HW.step(frames);
  TP_HW.key(run.dir, false);
  TP_HW.step(3);
  st.done += run.n;
  /* 一路走过去不会整屏刷白；刷白了多半是撞上野生宝可梦的战斗过场。
     这时候路线已经没意义了，按下去只会瞎走，直接停。 */
  if (tpWash() > 0.8) { tpEnd("遇敌了（画面被切成战斗），瞬移中断——打完再点一次"); return false; }
  tpProgress();
  return true;
}

function tpLoop() {
  if (!tpState || tpState.stop) return;
  var more = true;
  try { more = tpStepOnce(); } catch (e) { tpEnd("代跑出错了：" + (e && e.message || e)); return; }
  if (!more) return;
  if (tpState) TP_HW.soon(tpLoop);
}

function tpProgress(prefix) {
  var st = tpState;
  if (!st) return;
  var text = document.getElementById("tp-veil-text");
  if (text) {
    var total = 0, i;
    for (i = 0; i < st.plan.length; i++) total += st.plan[i].steps.length;
    text.textContent = (prefix ? prefix + " · " : "") +
      "第 " + (st.si + 1) + "/" + st.plan.length + " 段 · 本段 " + (st.runs ? st.runs.length - st.ri : 0) + " 步";
  }
  if (typeof navHint === "function" && navDest)
    navHint("瞬间移动中… 本段还剩 " + (st.runs ? st.runs.length - st.ri : 0) + " 步");
}

function tpEnd(msg) {
  var st = tpState;
  if (!st) return;
  st.stop = true;
  tpState = null;
  TP_HW.manual(false);
  tpReleaseKeys();
  /* 一下跳出老远，旧的手绘地图册已经没意义了 */
  if (typeof mapReset === "function") { try { mapReset(); } catch (e) {} }
  tpVeil(false);
  if (typeof navHint === "function") navHint(msg || "停下了");
  if (typeof navDraw === "function") navDraw();
  if (typeof toast === "function") toast(msg || "停下了");
  tpPaintBar();
}

/* ── 五、对外：开始 / 停下 ────────────────────────────────────────────── */
function tpStart() {
  if (tpState) { tpEnd("停下了"); return false; }
  if (typeof navDest === "undefined" || !navDest) {
    if (typeof navHint === "function") navHint("先在图上点一格，或者从「去哪儿…」里挑一个");
    return false;
  }
  var gate = tpUnlocked(true);
  if (!gate.ok) { tpShowLock(gate); return false; }
  if (typeof coreModule === "undefined" || !coreModule || !coreBooted) {
    if (typeof toast === "function") toast("核心没在跑：先插一张卡带");
    return false;
  }
  /* 「走过去」正在按方向键的话先让它停：两套代按同时按会互相打架 */
  if (typeof navWalking !== "undefined" && navWalking) {
    navWalking = false;
    if (typeof navHint === "function") navHint("已接管：瞬移优先");
  }
  var here = TP_HW.identify();
  if (!here) {
    if (typeof navHint === "function") navHint("这一帧认不出你在哪张图，走两步再试");
    return false;
  }
  if (typeof navHere !== "undefined") navHere = here;

  var plan = TP_HW.makePlan(here, navDest);
  if (!plan) { if (typeof navHint === "function") navHint("这条路走不过去（可能要冲浪或秘传技）"); return false; }

  var runs = plan.length ? tpRunsOf(plan[0].steps, here) : [];
  if (!runs) { if (typeof navHint === "function") navHint("路线算歪了，先别走"); return false; }

  tpState = { plan: plan, si: 0, ri: 0, runs: runs, dir: null, dest: navDest,
    needIdentify: false, settle: 0, rounds: 0, done: 0, miss: 0, stop: false, t0: Date.now() };

  if (!plan.length || (!plan[0].steps.length && plan.length === 1)) {
    tpEnd("你已经站在这儿了");
    return true;
  }
  TP_HW.manual(true);
  tpReleaseKeys();
  tpVeil(true);
  tpProgress("瞬移开始");
  tpPaintBar();
  TP_HW.soon(tpLoop);
  return true;
}

/* ── 六、界面 ───────────────────────────────────────────────────────────
   挂在导航放大层的工具条上，跟「走过去」并排。锁着的时候按钮本身就说原因，
   点它会把「差什么」摊开讲清楚，而不是弹一句「条件不足」。 */
function tpBtnText(gate) {
  if (tpState) return "瞬移中…";
  if (!gate) gate = tpUnlocked(false);
  if (gate.ok) return "瞬间移动 · " + (gate.name || "");
  return "瞬间移动 · 锁着";
}

function tpPaintBar() {
  var b = document.getElementById("nv-warp");
  if (!b) return;
  var gate = tpUnlocked(false);
  b.textContent = tpBtnText(gate);
  b.classList.toggle("is-locked", !gate.ok && !tpState);
  b.classList.toggle("is-running", !!tpState);
}

function tpShowLock(gate) {
  var box = document.getElementById("tp-lock");
  if (!box) return;
  box.hidden = false;
  var body = document.getElementById("tp-lock-body");
  if (!body) return;
  var lines = [];
  var kind = gate.kind || (gate.broken ? "broken" : "nomove");

  if (kind === "noflash") {
    lines.push(gate.why || "核心没在跑。");
    lines.push("先插一张卡带，等它跑起来再看。");
  } else if (kind === "blank") {
    lines.push("存档区还是空的——游戏里还没存过档。");
    lines.push("队伍是从「最后一次存档」里读的，没存过就什么都读不到。在游戏里按 START → 存档，存一次，再点「重新验」。");
  } else if (kind === "broken") {
    lines.push(gate.why || "读到了存档，但队伍位置跟官方对不上。");
    lines.push("这种一般是改版动了存档结构，正常卡带不会走到这里。如果你确实带着会瞬间移动的宝可梦，可以自己开锁。");
  } else {
    lines.push(gate.why || "队伍里还没有会「瞬间移动」的宝可梦。");
    lines.push("凯西 / 勇基拉 / 拉鲁拉丝 / 天然雀 / 月石 / 太阳岩这几条线都会这一招。抓一只放进队伍，在游戏里存一次档，再点「重新验」。");
    if (gate.list && gate.list.length) {
      var names = [];
      for (var i = 0; i < gate.list.length; i++) names.push(tpName(gate.list[i].species) + " Lv." + gate.list[i].level);
      lines.push("这次存档里的队伍：" + names.join(" / "));
    }
  }

  body.innerHTML = "";
  for (var k = 0; k < lines.length; k++) {
    var p = document.createElement("p");
    p.textContent = lines[k];
    body.appendChild(p);
  }
  var manual = document.getElementById("tp-lock-manual");
  if (manual) manual.hidden = kind !== "broken";
}

function tpHideLock() {
  var box = document.getElementById("tp-lock");
  if (box) box.hidden = true;
}

/* 覆盖层：瞬移的时候把屏幕压暗，只留一行字，免得玩家以为卡死了 */
function tpVeil(on) {
  var v = document.getElementById("tp-veil");
  if (v) v.hidden = !on;
}

function tpAttachBar(box) {
  if (!box) box = document.querySelector(".nav-view");
  if (!box || document.getElementById("nv-warp")) return;
  var bar = box.querySelector(".nv-bar");
  if (!bar) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "nv-warp";
  btn.textContent = "瞬间移动";
  btn.title = "队伍里要有会「瞬间移动」的念力系宝可梦";
  bar.insertBefore(btn, bar.querySelector("#nv-clear") || null);
  btn.addEventListener("click", function () {
    if (tpState) { tpEnd("停下了"); return; }
    tpHideLock();
    var gate = tpUnlocked(true);
    if (!gate.ok) { tpShowLock(gate); tpPaintBar(); return; }
    tpStart();
  });

  var lock = document.createElement("div");
  lock.className = "tp-lock";
  lock.id = "tp-lock";
  lock.hidden = true;
  lock.innerHTML =
    '<b>还差一步</b><div id="tp-lock-body"></div>' +
    '<div class="tp-lock-row">' +
    '<button type="button" id="tp-lock-retry">重新验</button>' +
    '<button type="button" id="tp-lock-manual" hidden>我确实有 · 手动开锁</button>' +
    '<button type="button" id="tp-lock-close">知道了</button>' +
    '</div>';
  var stage = box.querySelector(".nv-stage") || box;
  stage.appendChild(lock);

  var veil = document.createElement("div");
  veil.className = "tp-veil";
  veil.id = "tp-veil";
  veil.hidden = true;
  veil.innerHTML = '<b>瞬间移动</b><span id="tp-veil-text">正在起跳…</span>';
  stage.appendChild(veil);

  document.getElementById("tp-lock-close").addEventListener("click", tpHideLock);
  document.getElementById("tp-lock-retry").addEventListener("click", function () {
    var g = tpUnlocked(true);
    tpPaintBar();
    if (g.ok) { tpHideLock(); tpStart(); } else tpShowLock(g);
  });
  document.getElementById("tp-lock-manual").addEventListener("click", function () {
    tpSetManualFlag(true);
    tpHideLock();
    tpPaintBar();
    if (typeof navHint === "function") navHint("已手动开锁 · 点「瞬间移动」就走");
    if (typeof toast === "function") toast("已手动开锁");
  });

  tpPaintBar();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { tpAttachBar(null); });
  else tpAttachBar(null);
}

/* 对外：调试与联调用的口子（也方便 node 里跑回归） */
function tpTestSetHardware(hw) { if (hw) TP_HW = hw; }
function tpTestState() {
  return tpState ? { si: tpState.si, ri: tpState.ri, rounds: tpState.rounds,
    segs: tpState.plan.length, steps: tpState.plan.length ? tpState.plan[0].steps.length : 0,
    dest: tpState.dest ? { idx: tpState.dest.idx, x: tpState.dest.x, y: tpState.dest.y } : null } : null;
}
