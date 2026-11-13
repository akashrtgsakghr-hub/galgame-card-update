// 真机联调：把 32MB 改版塞进掌机页面，一路推到能走路，再看小地图有没有真的长出来。
//   node tools/probe-map-live.mjs
// 只按键、只读页面状态；截图落在 shots/map-live-*.png。
import { chromium } from '../../moon/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const POCKET = path.resolve(ROOT, '..');
const ROM = process.env.ROM || 'E:/究极绿宝石10.0/究极绿宝石10.0(内置修改器）新.gba';
const EXEC = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const SHOTS = path.join(POCKET, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm',
  '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const abs = path.resolve(POCKET, rel);
  if (!abs.startsWith(POCKET) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
  fs.createReadStream(abs).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}/`;

const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
await ctx.route('**/*', (route) => (route.request().url().startsWith('http://127.0.0.1') ? route.continue() : route.abort()));
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.goto(base);
await page.waitForFunction(() => !!window.MOON_POCKET, { timeout: 20000 });

console.log('插卡：' + path.basename(ROM));
await page.setInputFiles('#rom-file', ROM);
await page.waitForFunction(() => window.coreBooted === true, { timeout: 90000 });
console.log('核心已接管画面');

/* 提速：一帧 rAF 里多跑几帧核心，只影响节奏，不改游戏数据 */
await page.evaluate(() => { window.cheatSpeed = 4; });

const tap = async (code, hold = 45, gap = 130) => {
  await page.keyboard.down(code);
  await page.waitForTimeout(hold);
  await page.keyboard.up(code);
  await page.waitForTimeout(gap);
};
const state = () => page.evaluate(() => window.MOON_POCKET.map.state());
const walkOnce = async (code, ms = 340) => {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
  await page.waitForTimeout(460);          // 站定，等它拼进去
};

/* ① 推开场：一段 A 之后试着走两步，走得动就说明已经进世界了 */
let reached = false, rounds = 0, st = null;
for (let attempt = 1; attempt <= 8 && !reached; attempt++){
  for (let i = 0; i < 25; i++){
    await tap('KeyZ');
    rounds++;
    if (i % 8 === 7) await tap('Enter');   // 命名界面靠 START 确认
  }
  await tap('KeyX');                       // B：万一开着菜单先退掉
  await page.waitForTimeout(300);
  const a = await state();
  /* 往下走一串：屋里出门要往门口走，出了门就是镇子，镜头才跟着人滚 */
  for (let i = 0; i < 8; i++) await walkOnce('ArrowDown', 420);
  await walkOnce('ArrowRight');
  const b = await state();
  reached = !!(a.page && b.page && (a.page.x !== b.page.x || a.page.y !== b.page.y));
  console.log(`  第 ${attempt} 段（累计 ${rounds} 次按键）· 地图 ${b.pages} 页 · 位置 ${b.page ? b.page.x + ',' + b.page.y : '—'} · ${reached ? '走动了' : '还在过场'}`);
  if (!reached) await page.screenshot({ path: path.join(SHOTS, `map-live-a${attempt}.png`) });
}
/* ② 真像素平移测试：拿当前这一帧（改版的真实画面）左右挪一格，喂给同一套算法。
      屋子是一屏装得下的，镜头不跟着人滚，所以「走出去」这一步在探针里做不了；
      但「真画面能不能对上真画面」可以在这里验：挪 16px 应该被认出「往右走了一格」。 */
const pan = await page.evaluate(() => {
  const src = new Uint8ClampedArray(window.coreImageData.data);
  function shifted(dx, dy){
    const f = new Uint8ClampedArray(src.length);
    f.fill(0);
    for (let y = 0; y < 160; y++){
      const sy = y + dy;
      if (sy < 0 || sy >= 160) continue;
      for (let x = 0; x < 240; x++){
        const sx = x + dx;
        if (sx < 0 || sx >= 240) continue;
        const fi = (y * 240 + x) * 4, si = (sy * 240 + sx) * 4;
        f[fi] = src[si]; f[fi + 1] = src[si + 1]; f[fi + 2] = src[si + 2]; f[fi + 3] = 255;
      }
    }
    return f;
  }
  const st = MapCore.stats(src);
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  let ev = '', guard = 0;
  while (ev !== 'commit' && guard++ < 40) ev = tr.sample(shifted(0, 0));
  if (!tr.page()) return { empty: true, stats: { pale: +st.pale.toFixed(3), dark: +st.dark.toFixed(3), box: +st.box.toFixed(3), kinds: st.kinds, ui: st.ui } };
  const base = { ox: tr.page().ox, oy: tr.page().oy, ev };
  const evR = tr.sample(shifted(16, 0));            /* 镜头往右挪一格 = 人往右走了一格 */
  const right = { ev: evR, ox: tr.page().ox, oy: tr.page().oy };
  const evU = tr.sample(shifted(32, -16));          /* 再往右一格、往上一格 */
  const up = { ev: evU, ox: tr.page().ox, oy: tr.page().oy };
  const s = MapCore.score(tr.page().sheet, shifted(32, -16), tr.page().ox, tr.page().oy);
  return { base, right, up, stats: { pale: +st.pale.toFixed(3), dark: +st.dark.toFixed(3), box: +st.box.toFixed(3), kinds: st.kinds, ui: st.ui },
    scoreAtRight: s ? +s.avg.toFixed(2) : null, samples: s ? s.n : 0 };
});
console.log('当前帧判定：' + JSON.stringify(pan.stats));
if (pan.empty){ console.log('❌ 这一帧被判成 UI，跳过平移测试'); }
console.log(`真像素贴合：首帧 ${pan.base.ev} 落在 (${pan.base.ox},${pan.base.oy})`);
console.log(`  平移一格 → ${pan.right.ev} 落在 (${pan.right.ox},${pan.right.oy})  ${pan.right.ox === pan.base.ox + 1 ? '✅ 认出右移一格' : '❌ 没认出来'}`);
console.log(`  再右一格上移一格 → ${pan.up.ev} 落在 (${pan.up.ox},${pan.up.oy})  ${pan.up.ox === pan.base.ox + 2 && pan.up.oy === pan.base.oy - 1 ? '✅ 认出斜移' : '❌ 没认出来'}`);
console.log(`  重新对齐后的像素差：${pan.scoreAtRight}（${pan.samples} 个采样点）`);

const painted = await page.evaluate(() => {
  const cv = document.querySelector('#mp-canvas');
  const g = cv.getContext('2d');
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let lit = 0, total = cv.width * cv.height;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 30) lit++;
  return { lit, total, pct: +(lit / total * 100).toFixed(1) };
});
console.log(`小窗里画出来的像素：${painted.lit}/${painted.total}（${painted.pct}%）`);

await page.evaluate(() => { window.MOON_POCKET.map.show(); });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(SHOTS, 'map-live-screen.png') });
const panel = await page.$('#map-panel');
if (panel) await panel.screenshot({ path: path.join(SHOTS, 'map-live-panel.png') });
await page.screenshot({ path: path.join(SHOTS, 'map-live-full.png'), fullPage: false });

if (!reached){
  console.log('\n注：这一版开场很长，探针没走到「大张地图」那一步；位置不变是应为人在一屏装得下的屋子里（镜头不滚）。');
  console.log('    所以改用「真像素平移」验证追踪——见上面 👆');
  await page.screenshot({ path: path.join(SHOTS, 'map-live-stuck.png') });
}
console.log(errs.length ? '页面错误：' + errs.slice(0, 4).join(' | ') : '页面错误：无');
await browser.close();
srv.close();
