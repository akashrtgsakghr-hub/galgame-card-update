// 真机联调：把游戏推到能走路的地方，用真画面认图，再沿红线走几步看位置有没有变
import { chromium } from '../../moon/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const P = 'C:/Users/1/WorkBuddy/2026-10-31-03-22-02/moon-pocket';
const ROM = process.env.ROM || 'E:/绿宝石+模拟器/1100296.gba';
const EXEC = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
const SHOTS = path.join(P, 'shots');

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

/* 推开场与命名：一段时间 A，隔几次 START */
for (let round = 1; round <= 30; round++) {
  for (let i = 0; i < 18; i++) {
    await tap('KeyZ');
    if (i % 8 === 7) await tap('Enter');
  }
  const st = await pg.evaluate(() => {
    const s = MOON_POCKET.map.state();
    return { pages: s.pages, page: s.page, moving: s.page ? s.page.pastes : 0 };
  });
  if (round % 6 === 0) console.log(`  第 ${round} 轮 · 地图 ${st.pages} 页 · ${st.page ? st.page.x + ',' + st.page.y : '—'}`);
  if (st.page && st.moving > 40) break;
}
await pg.evaluate(() => { navAtlas(); });         // 先把图集建起来（顺手预热）

/* 关掉菜单/背包：菜单画面本来就认不出 */
for (let i = 0; i < 4; i++) await tap('KeyX', 45, 160);
await pg.waitForTimeout(400);
await pg.screenshot({ path: path.join(SHOTS, 'nav-live-before.png') });

const tryIdentify = () => pg.evaluate(() => {
  const t0 = performance.now();
  const here = navIdentify();
  return { here, ms: Math.round(performance.now() - t0),
    varLuma: (function () {
      var fl = navFrameLuma(); if (!fl) return null;
      var m = 0, i; for (i = 0; i < fl.length; i++) m += fl[i]; m /= fl.length;
      var v = 0; for (i = 0; i < fl.length; i++) { var d = fl[i] - m; v += d * d; }
      return Math.round(Math.sqrt(v / fl.length));
    })() };
});

let id = await tryIdentify();
console.log(id.here
  ? `认图：地图 #${id.here.idx} 位置 (${id.here.x},${id.here.y}) 得分 ${id.here.score}/120 · ${id.ms}ms`
  : `认图：认不出来（画面起伏 ${id.varLuma}）· ${id.ms}ms`);

/* 认不出就往外走走——房间里常年是地板，换到有树有路的地方再看 */
if (!id.here) {
  for (let k = 0; k < 8 && !id.here; k++) {
    for (let i = 0; i < 3; i++) await pg.keyboard.press('ArrowDown', { delay: 60 });
    await pg.waitForTimeout(700);
    id = await tryIdentify();
    console.log(`  走第 ${k + 1} 段后：` + (id.here ? `认出 地图 #${id.here.idx} (${id.here.x},${id.here.y}) 得分 ${id.here.score} · ${id.ms}ms` : `仍认不出（起伏 ${id.varLuma}）`));
  }
  await pg.screenshot({ path: path.join(SHOTS, 'nav-live-walked.png') });
}

if (!id.here) {
  await pg.screenshot({ path: path.join(SHOTS, 'nav-live-noid.png') });
  console.log(errs.length ? '页面报错：' + errs.slice(0, 3).join(' | ') : '页面报错：无');
  await b.close(); srv.close();
  process.exit(2);
}

/* 打开放大层截图（这就是玩家看到的东西） */
await pg.evaluate(() => {
  navHere = navIdentify();
  navBuild();
  document.getElementById('nav-view').hidden = false;
  navResize();
  navDraw();
});
await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(SHOTS, 'nav-live-view.png') });

/* 选一个本图内的目的地，看算不算得出路；再走几步看位置变不变 */
const walk = await pg.evaluate(async () => {
  const a = navAtlas(), lay = a.layoutOf(navHere.idx), grid = a.costGrid(navHere.idx);
  /* 找一个离现在 6 格左右、能站的地方当目的地 */
  let dest = null;
  for (let r = 4; r < 12 && !dest; r++) {
    for (const d of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
      const x = navHere.x + d[0], y = navHere.y + d[1];
      if (x < 0 || y < 0 || x >= lay.w || y >= lay.h) continue;
      if (!grid[y * lay.w + x]) continue;
      dest = { x, y }; break;
    }
  }
  if (!dest) return { err: '附近没有能站的格子' };
  navDest = { idx: navHere.idx, x: dest.x, y: dest.y, name: '测试点' };
  navPlan = moonPlan(a, navAdj(), navHere.idx, navHere.x, navHere.y, navDest.idx, navDest.x, navDest.y);
  if (!navPlan) return { err: '算不出路', dest };
  const before = MOON_POCKET.map.state().page;
  navWalkStart();
  await new Promise((r) => setTimeout(r, 2600));
  navWalking = false;
  const after = MOON_POCKET.map.state().page;
  return { dest, steps: navPlan[0].steps.length, before: [before.x, before.y], after: [after.x, after.y],
    hint: document.getElementById('nv-hint').textContent };
});
console.log('一键寻路：' + JSON.stringify(walk));
await pg.screenshot({ path: path.join(SHOTS, 'nav-live-walk.png') });
console.log(errs.length ? '页面报错：' + errs.slice(0, 3).join(' | ') : '页面报错：无');
await b.close(); srv.close();
