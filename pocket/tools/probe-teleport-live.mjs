// 真机联调：① 手动按帧推进（GBA_CORE.step）到底有没有驱动游戏
//            ② 把一份合成存档写进 Flash 区，看「念力系解锁」这条链在真页面上通不通
import { chromium } from '../../moon/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const P = 'C:/Users/1/WorkBuddy/2026-10-31-03-22-02/moon-pocket';
const ROM = process.env.ROM || 'E:/绿宝石+模拟器/1100296.gba';
const EXEC = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
const SHOTS = path.join(P, 'shots');

/* ── 合成一份存档（结构和 verify-teleport 里的一致） ───────────────────── */
const ORDER = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0]
];
const w32 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; };
const w16 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; };
function encMon(m) {
  const b = new Uint8Array(100);
  w32(b, 0, m.personality); w32(b, 4, m.otId);
  const key = (m.personality ^ m.otId) >>> 0, order = ORDER[m.personality % 24];
  const subs = [
    [m.species & 0xffff, 0, 70 << 8],
    [(m.moves[0] & 0xffff) | ((m.moves[1] & 0xffff) << 16), (m.moves[2] & 0xffff) | ((m.moves[3] & 0xffff) << 16), 0],
    [0, 0, 0], [0, 0, 0]
  ];
  const words = new Array(12);
  for (let s = 0; s < 4; s++) for (let k = 0; k < 3; k++) words[s * 3 + k] = subs[order[s]][k];
  for (let i = 0; i < 12; i++) w32(b, 0x20 + i * 4, (words[i] ^ key) >>> 0);
  b[0x54] = m.level;
  return b;
}
function makeFlash(mons) {
  const flash = new Uint8Array(0x20000).fill(0xff);
  const sb1 = new Uint8Array(0xf80 * 4);
  sb1[0x234] = mons.length;
  mons.forEach((m, i) => sb1.set(encMon(m), 0x238 + i * 100));
  for (let id = 1; id <= 4; id++) {
    const base = id * 0x1000;
    flash.set(sb1.subarray((id - 1) * 0xf80, id * 0xf80), base);
    w16(flash, base + 0xff4, id);
    w16(flash, base + 0xff6, 0x1234);
    w32(flash, base + 0xff8, 0x08012025);
    w32(flash, base + 0xffc, 1);
  }
  return flash;
}

/* ── 起服务、开页 ─────────────────────────────────────────────────────── */
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  const abs = path.resolve(P, u === '/' ? 'index.html' : u.replace(/^\/+/, ''));
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
  fs.createReadStream(abs).pipe(r);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));

const b = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e && e.message || e)));
await pg.goto('http://127.0.0.1:' + srv.address().port + '/');
await pg.waitForFunction(() => !!window.MOON_POCKET, { timeout: 20000 });
await pg.setInputFiles('#rom-file', ROM);
await pg.waitForFunction(() => window.coreBooted === true, { timeout: 90000 });
await pg.evaluate(() => { window.cheatSpeed = 3; });

const tap = async (code, hold = 40, gap = 90) => {
  await pg.keyboard.down(code); await pg.waitForTimeout(hold);
  await pg.keyboard.up(code); await pg.waitForTimeout(gap);
};

/* 把开场推过去（不求进到能走路的场景，这里验的是别的） */
for (let round = 1; round <= 12; round++) {
  for (let i = 0; i < 16; i++) { await tap('KeyZ'); if (i % 8 === 7) await tap('Enter'); }
  await tap('KeyX');
}
await pg.waitForTimeout(400);
await pg.screenshot({ path: path.join(SHOTS, 'tp-live-start.png') });

/* ① 手动按帧推进：先量「什么都不按」的画面抖动当基线，再量按住的差别。
      按住 90 帧 ≈ 走 5 格，画面差异应该远大于基线，才说明按住了真的在动。 */
const drive = await pg.evaluate(() => {
  const grab = () => Array.from(document.getElementById('core-canvas').getContext('2d').getImageData(0, 0, 240, 160).data);
  const diff = (a, c) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - c[i]) > 12 || Math.abs(a[i + 1] - c[i + 1]) > 12) n++; return n; };
  GBA_CORE.manual(true);
  const clock0 = GBA_CORE.clock();
  const a0 = grab(); GBA_CORE.step(90); const a1 = grab();
  const baseline = diff(a0, a1);
  const out = { baseline: baseline, moved: 0, dirs: {} };
  for (const dir of ['down', 'right', 'up', 'left']) {
    const b0 = grab();
    GBA_CORE.input(dir, true); GBA_CORE.step(90); GBA_CORE.input(dir, false); GBA_CORE.step(8);
    out.dirs[dir] = diff(b0, grab());
  }
  out.moved = GBA_CORE.clock() - clock0;
  GBA_CORE.manual(false);
  return out;
});
console.log(`按帧推进：时钟走了 ${drive.moved} 帧 · 静止 90 帧基线 ${drive.baseline} 像素`);
console.log('  按住各方向 90 帧的变化：' + Object.entries(drive.dirs).map(([k, v]) => `${k} ${v}`).join(' · '));
await pg.screenshot({ path: path.join(SHOTS, 'tp-live-driven.png') });

/* ② 解锁链：没存档 → 锁；写进一份带凯西的存档 → 开 */
const before = await pg.evaluate(() => {
  const g = window.tpUnlocked(true);
  return { ok: g.ok, why: g.why || '', name: g.name || '' };
});
console.log('写存档之前：' + (before.ok ? '已解锁' : '锁着 · ' + before.why));

const flashB64 = Buffer.from(makeFlash([
  { personality: 0x11111101, otId: 0x2468ace0, species: 263, level: 6, moves: [33, 45, 0, 0] },   // 先放一只不会瞬移的
  { personality: 0x000000a5, otId: 0x13572468, species: 63, level: 11, moves: [100, 43, 0, 0] }    // 凯西，会瞬移
])).toString('base64');
const after = await pg.evaluate((b64) => {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  window.coreSavView.set(bytes.subarray(0, window.coreSavView.length));
  const g = window.tpUnlocked(true);
  const p = window.tpParty();
  return { ok: g.ok, name: g.name || '', why: g.why || '', slot: g.mon ? g.mon.slot : 0,
    party: p.ok ? p.list.map((m) => m.species + '/Lv' + m.level + (m.teleport ? '/瞬移' : '')) : p.why };
}, flashB64);
console.log('写存档之后：' + (after.ok ? `解锁 · ${after.name}（第 ${after.slot} 只）` : '仍锁着 · ' + after.why));
console.log('解析出的队伍：' + JSON.stringify(after.party));

/* ③ 界面：打开放大层，看按钮长什么样 */
await pg.evaluate(() => { window.MOON_POCKET.map.show(); navOpen(); });
await pg.waitForTimeout(900);
const btn = await pg.evaluate(() => {
  const el = document.getElementById('nv-warp');
  return el ? { text: el.textContent, locked: el.classList.contains('is-locked') } : null;
});
console.log('工具条按钮：' + (btn ? `「${btn.text}」 锁=${btn.locked}` : '没建出来'));
await pg.screenshot({ path: path.join(SHOTS, 'tp-live-view.png') });

/* ③b 界面示意：位置是脚本摆的（真画面在这台机器上认不出室内），只为看布局 */
const demo = await pg.evaluate(() => {
  const a = navAtlas();
  /* 从攻略里那批有名的地方里挑：尺寸适中、且从中心走得到 40 步以外的角落 */
  let idx = -1, lay = null, g = null;
  for (const poi of NAV_POIS) {
    const l = a.layoutOf(poi[1]);
    if (!l || l.w < 16 || l.h < 14 || l.w * l.h > 4000) continue;
    idx = poi[1]; lay = l; g = a.costGrid(poi[1]);
    break;
  }
  if (idx < 0) return null;
  /* 起点取地图中心最近的可走格；终点从起点做一次洪水填充，取「走得到的最远点」，
     这样路线一定存在（不然会算出一条到不了的路，图上什么都不画） */
  let from = { x: 0, y: 0 }, bd = 1e9;
  for (let i = 0; i < g.length; i++) {
    if (!g[i]) continue;
    const x = i % lay.w, y = (i / lay.w) | 0;
    const d = Math.abs(x - lay.w / 2) + Math.abs(y - lay.h / 2);
    if (d < bd) { bd = d; from = { x: x, y: y }; }
  }
  const dist = new Int32Array(g.length).fill(-1);
  const q = [from.y * lay.w + from.x];
  dist[q[0]] = 0;
  let to = from, far = 0;
  while (q.length) {
    const c = q.shift(), cx = c % lay.w, cy = (c / lay.w) | 0;
    if (dist[c] > far) { far = dist[c]; to = { x: cx, y: cy }; }
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of nb) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= lay.w || ny >= lay.h) continue;
      const ni = ny * lay.w + nx;
      if (!g[ni] || dist[ni] >= 0) continue;
      dist[ni] = dist[c] + 1;
      q.push(ni);
    }
  }
  navHere = { idx: idx, x: from.x, y: from.y, score: 120 };
  navDest = { idx: idx, x: to.x, y: to.y, name: '地图另一头' };
  navPlan = moonPlan(a, navAdj(), idx, from.x, from.y, idx, to.x, to.y);
  navHint(navPlan ? ('这段 ' + navPlan[0].steps.length + ' 步 · 点「瞬间移动」就走') : '算不出路');
  navDraw();
  return { idx, w: lay.w, h: lay.h, steps: navPlan ? navPlan[0].steps.length : -1 };
});
console.log('界面示意：地图 #' + (demo ? demo.idx + ' ' + demo.w + '×' + demo.h + ' · 路线 ' + demo.steps + ' 步' : '没找到合适的图'));
await pg.waitForTimeout(500);
await pg.screenshot({ path: path.join(SHOTS, 'tp-live-map.png') });

/* ④ 没解锁的样子：清掉存档再看一次 */
await pg.evaluate(() => {
  window.coreSavView.fill(0xff);
  const g = window.tpUnlocked(true);
  tpPaintBar();
  tpShowLock(g);
});
await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(SHOTS, 'tp-live-locked.png') });

console.log(errs.length ? '页面错误：' + errs.slice(0, 4).join(' | ') : '页面错误：无');
await b.close(); srv.close();
