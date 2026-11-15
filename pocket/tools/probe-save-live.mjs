// 存档真机联调：插卡 → 模拟游戏写档 → 落盘 → 重载页面 → 再插卡 → 看能不能接上。
// 跑的是拼好的 index.html（线上同一份），不是另写一份逻辑。
//   node tools/probe-save-live.mjs
import { chromium } from '../../moon/node_modules/playwright-core/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const P = path.resolve(HERE, '..');
const SHOTS = path.join(P, 'shots');
const ROM = process.env.ROM || 'E:/绿宝石+模拟器/1100296.gba';
const EXEC = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
if (!fs.existsSync(ROM)) { console.log('找不到卡带：' + ROM); process.exit(2); }
fs.mkdirSync(SHOTS, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm',
  '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  const abs = path.resolve(P, u === '/' ? 'index.html' : u.replace(/^\/+/, ''));
  if (!abs.startsWith(P) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
  fs.createReadStream(abs).pipe(r);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const url = 'http://127.0.0.1:' + srv.address().port + '/';

const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e && e.message || e)));
await page.route('**/*', (rt) => rt.request().url().startsWith('http://127.0.0.1') ? rt.continue() : rt.abort());
await page.goto(url);
await page.waitForFunction(() => !!window.MOON_POCKET);

/* ① 插卡 → 核心跑起来 */
async function plugRom() {
  await page.setInputFiles('#rom-file', ROM);
  await page.waitForFunction(() => window.coreBooted === true, { timeout: 120000 });
  await page.waitForTimeout(600);
}
await plugRom();
console.log('卡带已装载：' + JSON.stringify(await page.evaluate(() => window.MOON_POCKET.getRom())));

const before = await page.evaluate(() => window.MOON_POCKET.save.state());
console.log('插卡后存档状态：' + JSON.stringify(before));

/* ② 模拟「游戏里存了一次档」：往 Flash 区写一段可辨识的数据，再用正式接口落盘
      （真实路径是玩家在游戏里按保存，核心写 Flash；这里只是跳过走路那一段） */
const written = await page.evaluate(async () => {
  const core = window.MOON_POCKET.getCore();
  const snap = core.saveState();
  if (!snap) return { ok: false, why: '拿不到存档区' };
  /* 0x10000 往后的 4KB 写成有规律的数据，重启后能一眼认出来 */
  for (let i = 0; i < 4096; i++) snap[0x10000 + i] = (i * 37 + 11) & 0xff;
  core.loadState(snap);
  const r = await window.MOON_POCKET.save.write('manual');
  return { ok: r.ok, bytes: r.bytes, raw: r.raw, pack: r.pack, at: r.at, why: r.why || '', skip: r.skip || '' };
});
console.log('写盘：' + JSON.stringify(written));

const after = await page.evaluate(() => window.MOON_POCKET.save.state());
console.log('写盘后存档状态：' + JSON.stringify(after));
const caption = await page.evaluate(() => document.querySelector('#save-caption').textContent);
console.log('底部状态行：' + caption);
await page.screenshot({ path: path.join(SHOTS, 'save-live-written.png') });

/* ③ 重载整个页面（等于关掉酒馆再打开 / 刷新），再插同一张卡带 */
await page.reload();
await page.waitForFunction(() => !!window.MOON_POCKET);
const afterReload = await page.evaluate(() => window.MOON_POCKET.save.state());
console.log('重载后（还没插卡）存档状态：' + JSON.stringify(afterReload));

await plugRom();
const restoredCheck = await page.evaluate(() => {
  const core = window.MOON_POCKET.getCore();
  const snap = core.saveState();
  let hit = 0;
  for (let i = 0; i < 4096; i++) if (snap[0x10000 + i] === ((i * 37 + 11) & 0xff)) hit++;
  return { hit, total: 4096, caption: document.querySelector('#save-caption').textContent,
    state: window.MOON_POCKET.save.state() };
});
console.log('重开卡带后：回填命中 ' + restoredCheck.hit + '/' + restoredCheck.total + ' 字节');
console.log('  底部状态行：' + restoredCheck.caption);
console.log('  存档状态：' + JSON.stringify(restoredCheck.state));
await page.screenshot({ path: path.join(SHOTS, 'save-live-restored.png') });

const pass = restoredCheck.hit === 4096;
console.log('\n' + (pass ? '✅ 存档能跨「关掉再打开」活下来' : '❌ 回填没对上'));
console.log(errs.length ? '页面错误：' + errs.slice(0, 4).join(' | ') : '页面错误：无');
await browser.close();
srv.close();
process.exitCode = pass ? 0 : 1;
