// 瞬间移动回归：① 队伍解析（合成 Flash 存档，24 种排列都过一遍）② 代跑状态机（假硬件）
import fs from 'node:fs';
import vm from 'node:vm';

const ROOT = 'C:/Users/1/WorkBuddy/2026-10-31-03-22-02';
const SHARD = ROOT + '/moon-pocket/src/pocket.14-teleport.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log(`  ✓ ${name}${extra ? ' · ' + extra : ''}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' · ' + extra : ''}`); }
};

/* ── 合成一张 Flash 存档 ──────────────────────────────────────────────── */
const ORDER = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0]
];

const w32 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; };
const w16 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; };

/* 加密一只宝可梦（tpReadMon 的逆运算，用来造测试数据） */
function encMon(m) {
  const b = new Uint8Array(100);
  w32(b, 0, m.personality); w32(b, 4, m.otId);
  const key = (m.personality ^ m.otId) >>> 0;
  const order = ORDER[m.personality % 24];
  const subs = [
    [m.species & 0xffff, m.exp || 0, ((m.friendship || 70) & 0xff) << 8],
    [(m.moves[0] & 0xffff) | ((m.moves[1] & 0xffff) << 16),
      (m.moves[2] & 0xffff) | ((m.moves[3] & 0xffff) << 16), 0],
    [0, 0, 0], [0, 0, 0]
  ];
  const words = new Array(12);
  for (let s = 0; s < 4; s++) for (let k = 0; k < 3; k++) words[s * 3 + k] = subs[order[s]][k];
  for (let i = 0; i < 12; i++) w32(b, 0x20 + i * 4, (words[i] ^ key) >>> 0);
  b[0x54] = m.level;
  return b;
}

/* 造 128KB Flash：扇区 1..4 装 SaveBlock1。phys 可以打乱，模拟「存档换过位置」 */
function makeFlash(mons, opts) {
  opts = opts || {};
  const flash = new Uint8Array(0x20000).fill(0xff);
  const sb1 = new Uint8Array(0xf80 * 4);
  sb1[0x234] = mons.length;
  mons.forEach((m, i) => sb1.set(encMon(m), 0x238 + i * 100));

  const phys = opts.phys || [1, 2, 3, 4];
  for (let i = 0; i < 4; i++) {
    const id = phys[i];                       // 物理位置 i 上放几号扇区
    const base = (opts.at || [1, 2, 3, 4])[i] * 0x1000;
    flash.set(sb1.subarray((id - 1) * 0xf80, id * 0xf80), base);
    const foot = base + 0xff4;
    w16(flash, foot, id);
    w16(flash, foot + 2, 0x1234);
    if (!(opts.badSec === id)) w32(flash, foot + 4, 0x08012025);
    w32(flash, foot + 8, 1);
  }
  return flash;
}

/* ── 把分片当普通脚本加载，测的就是生产代码 ── */
const shard = fs.readFileSync(SHARD, 'utf8');

function boot(flash) {
  const stubs = `
    var navDest = null, navHere = null, navPlan = null;
    var __msgs = [];
    function navHint(t){ __msgs.push(t); }
    function toast(t){ __msgs.push(t); }
    function navDraw(){}
    var LS = (function(){ var m = {}; return {
      getItem: function(k){ return k in m ? m[k] : null; },
      setItem: function(k,v){ m[k] = String(v); },
      removeItem: function(k){ delete m[k]; } }; })();
    var FLAG_PREFIX = "moon-pocket:flag:";
    var coreModule = {}, coreBooted = true, coreSavView = null, coreImageData = null;
    var document = { readyState: "complete", getElementById: function(){ return null; },
      querySelector: function(){ return null; }, addEventListener: function(){} };
  `;
  const api = new Function(stubs + '\n' + shard + `
    return { tpSaveBlock1, tpParty, tpUnlocked, tpReadMon, tpRunsOf, tpStart, tpStepOnce,
      tpEnd, tpTestState, tpTestSetHardware, tpSetManualFlag,
      setFlash: function(f){ coreSavView = f; },
      setDest: function(d){ navDest = d; },
      setFrame: function(d){ coreImageData = d; },
      wash: function(){ return tpWash(); },
      msgs: function(){ return __msgs.slice(); } };`)();
  if (flash) api.setFlash(flash);
  return api;
}

console.log('== 队伍解析 ==');
{
  const mons = [
    { personality: 0x12345678, otId: 0x9abcdef0, species: 263, level: 7, moves: [33, 45, 0, 0] },       // 蛇纹熊，不会瞬移
    { personality: 0x000000a5, otId: 0x11223344, species: 63, level: 12, moves: [100, 43, 0, 0] },        // 凯西，会瞬移
    { personality: 0xdeadbeef, otId: 0x0f0f0f0f, species: 280, level: 9, moves: [45, 0, 0, 0] },
    { personality: 0x0000000c, otId: 0x55667788, species: 65, level: 41, moves: [94, 115, 100, 0] }        // 胡地，瞬移在第三格
  ];
  const flash = makeFlash(mons);
  const api = boot(flash);
  const p = api.tpParty();
  ok('存档能拼回 SaveBlock1', p.ok, p.why || '');
  ok('队伍读到 4 只', p.ok && p.list.length === 4, p.ok ? p.list.map(x => x.species).join(',') : '');
  ok('性格/等级/招式都对得上',
    p.ok && p.list[1].species === 63 && p.list[1].level === 12 && p.list[1].moves[0] === 100 &&
    p.list[3].species === 65 && p.list[3].moves[2] === 100 && p.list[0].level === 7);
  ok('只认带 100 号（瞬间移动）的', p.ok && p.list.filter(x => x.teleport).length === 2);

  const g = api.tpUnlocked(true);
  ok('解锁：队伍里有会瞬移的就开', g.ok && g.mon.species === 63, g.ok ? g.name : g.why);
}

/* 24 种排列（性格 % 24）都要解得出来：这是 Gen3 最容易写错的地方 */
{
  let bad = 0;
  for (let k = 0; k < 24; k++) {
    /* 找一个 personality % 24 === k 的值 */
    let p0 = k;
    while (p0 % 24 !== k) p0++;
    const flash = makeFlash([{ personality: p0, otId: 0x0a0b0c0d, species: 300 + k, level: k + 1, moves: [k, 100, 7, 8] }]);
    const api = boot(flash);
    const p = api.tpParty();
    if (!p.ok || p.list[0].species !== 300 + k || p.list[0].moves[1] !== 100 || p.list[0].moves[0] !== k) bad++;
  }
  ok('性格 24 种排列全都能解开（物种 + 四个招式都不错位）', bad === 0, bad ? `${bad} 种错` : '24/24');
}

console.log('\n== 存档读不到 / 对不上的时候 ==');
{
  const api = boot(null);
  const g = api.tpUnlocked(true);
  ok('没有核心：直说读不到', !g.ok && /核心/.test(g.why), g.why);
}
{
  const flash = makeFlash([{ personality: 1, otId: 2, species: 63, level: 5, moves: [100, 0, 0, 0] }]);
  flash.fill(0xff);                       // 玩家还没在游戏里存过档
  const api = boot(flash);
  const g = api.tpUnlocked(true);
  ok('空存档：说是还没存过档', !g.ok && /还没存过档/.test(g.why), g.why);
}
{
  const flash = makeFlash([{ personality: 1, otId: 2, species: 63, level: 5, moves: [100, 0, 0, 0] }], { badSec: 2 });
  const api = boot(flash);
  const g = api.tpUnlocked(true);
  ok('扇区签名坏了：判成「结构对不上」而不是崩', !g.ok && g.broken, g.why);
  api.tpSetManualFlag(true);
  const g2 = api.tpUnlocked(true);
  ok('手动开锁能兜住改版', g2.ok && g2.manual, g2.ok ? 'manual' : g2.why);
}
{
  const flash = makeFlash([{ personality: 1, otId: 2, species: 63, level: 5, moves: [33, 0, 0, 0] }]);
  const api = boot(flash);
  const g = api.tpUnlocked(true);
  ok('队伍里没瞬移：说缺什么', !g.ok && /瞬间移动/.test(g.why), g.why);
}
{
  /* 扇区物理顺序打乱（存档换过位置）也要能对上 */
  const flash = makeFlash([{ personality: 7, otId: 9, species: 63, level: 5, moves: [100, 0, 0, 0] }],
    { phys: [3, 1, 4, 2], at: [1, 2, 3, 4] });
  const api = boot(flash);
  ok('扇区位置乱序也能拼回去', api.tpUnlocked(true).ok);
}

console.log('\n== 代跑状态机 ==');
{
  const api = boot(null);
  const runs = api.tpRunsOf([{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 8, y: 6 }, { x: 8, y: 7 }], { x: 5, y: 5 });
  ok('同方向连步合成一次长按', JSON.stringify(runs) === JSON.stringify([{ dir: 'right', n: 3 }, { dir: 'down', n: 2 }]),
    JSON.stringify(runs));
  ok('斜着走的路线直接判歪', api.tpRunsOf([{ x: 6, y: 6 }], { x: 5, y: 5 }) === null);
}

/* 假硬件：一个空场地 + 两张图；按住的帧数除以 16 就是走了几格 */
{
  const api = boot(makeFlash([{ personality: 3, otId: 5, species: 63, level: 8, moves: [100, 0, 0, 0] }]));
  const pos = { x: 5, y: 5 };
  let mapIdx = 1, held = null, plans = 0;
  const hw = {
    step(n) {
      if (held) {
        let tiles = Math.floor(n / 16);
        while (tiles-- > 0) {
          if (held === 'right') pos.x++; else if (held === 'left') pos.x--;
          else if (held === 'down') pos.y++; else if (held === 'up') pos.y--;
        }
      }
      return n;
    },
    key(b, d) { if (d) held = b; else if (held === b) held = null; },
    manual() {},
    soon() {},
    identify() { return { idx: mapIdx, x: pos.x, y: pos.y, score: 99 }; },
    makePlan(here, dest) {
      plans++;
      if (here.idx === 1) return [
        { idx: 1, steps: [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }] },
        { idx: 2, steps: [] }
      ];
      return [{ idx: 2, steps: [{ x: 1, y: 0 }, { x: 2, y: 0 }] }];
    }
  };
  api.tpTestSetHardware(hw);
  api.setDest({ idx: 2, x: 2, y: 0, name: '橙华市' });
  api.tpStart();
  let guard = 0;
  while (api.tpTestState() && guard++ < 80) {
    const before = api.tpTestState();
    api.tpStepOnce();
    /* 第一段走完、状态机开始等过场 → 把地图换掉，模拟穿过边界 */
    const after = api.tpTestState();
    if (after && after.rounds === 0 && after.si === 1) { mapIdx = 2; pos.x = 0; pos.y = 0; }
    if (!before) break;
  }
  ok('跨图后重算并走到终点', mapIdx === 2 && pos.x === 2 && pos.y === 0, `落点 (${pos.x},${pos.y}) · 规划 ${plans} 次`);
  ok('结束状态清干净', api.tpTestState() === null && hw.identify().idx === 2);
  ok('结束了就把按键松开', held === null);
}

/* 堵住不动 → 不许死循环，8 圈内自己停 */
{
  const api = boot(makeFlash([{ personality: 3, otId: 5, species: 63, level: 8, moves: [100, 0, 0, 0] }]));
  let held = 'none', plans = 0, loops = 0;
  const hw = {
    step() { return 0; },
    key(b, d) { held = d ? b : null; },
    manual() {},
    soon() {},
    identify() { return { idx: 2, x: 0, y: 0, score: 99 }; },
    makePlan() { plans++; return [{ idx: 2, steps: [{ x: 1, y: 0 }] }]; }
  };
  api.tpTestSetHardware(hw);
  api.setDest({ idx: 2, x: 1, y: 0, name: '堵住的巷子' });
  api.tpStart();
  while (api.tpTestState() && loops++ < 200) api.tpStepOnce();
  ok('原地打转会被「8 圈」闸住', api.tpTestState() === null && plans <= 10, `重算 ${plans} 次 · ${loops} 步`);
  ok('闸住之后按键是松的', held === null);
}

/* 遇敌保护：画面刷白就停，别在战斗里瞎按 */
{
  const api = boot(makeFlash([{ personality: 3, otId: 5, species: 63, level: 8, moves: [100, 0, 0, 0] }]));
  const dark = new Uint8ClampedArray(240 * 160 * 4);
  for (let i = 0; i < dark.length; i += 4) { dark[i] = 40; dark[i + 1] = 60; dark[i + 2] = 44; dark[i + 3] = 255; }
  api.setFrame({ data: dark });   // 浏览器里 coreImageData 是 ImageData，这里只喂 .data
  ok('正常画面不算白屏', api.wash() < 0.05, `白 ${(api.wash() * 100).toFixed(1)}%`);

  const white = new Uint8ClampedArray(dark);
  for (let i = 0; i < white.length; i += 4) { white[i] = 255; white[i + 1] = 255; white[i + 2] = 255; }
  api.setFrame({ data: white });
  ok('全白被判成战斗过场', api.wash() > 0.9, `白 ${(api.wash() * 100).toFixed(0)}%`);

  let held = 'none';
  api.tpTestSetHardware({
    step() { return 0; }, key(b, d) { held = d ? b : null; }, manual() {}, soon() {},
    identify() { return { idx: 2, x: 0, y: 0, score: 99 }; },
    makePlan() { return [{ idx: 2, steps: [{ x: 1, y: 0 }, { x: 2, y: 0 }] }]; }
  });
  api.setDest({ idx: 2, x: 2, y: 0, name: '远处' });
  api.tpStart();
  let guard = 0;
  while (api.tpTestState() && guard++ < 20) api.tpStepOnce();
  ok('一步没走完就自己停了（遇敌）', api.tpTestState() === null && held === null,
    api.msgs().slice(-1)[0] || '');
}

console.log(`\n${fail === 0 ? '✅ 全过' : '❌ 有失败'}：${pass} 过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
