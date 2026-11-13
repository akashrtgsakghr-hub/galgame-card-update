// 小地图回归：不跑模拟器，用合成帧走一遍「站定 → 拼图 → 换地图 → 翻页 → 贴边挪图」。
// 跑的是线上同一份 src/pocket.08-map-core.js（vm 里加载，不复制代码）。
//   node tools/verify-map.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src', 'pocket.08-map-core.js');
const code = fs.readFileSync(SRC, 'utf8');
const sandbox = { module: { exports: {} }, Uint8ClampedArray, ImageData: class {}, Math, console };
vm.runInNewContext(code, sandbox, { filename: 'pocket.08-map-core.js' });
const MapCore = sandbox.module.exports;

const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
};

/* ── 假世界：每格 16×16，格子里有 4×4 的小块花纹；换一张「地图」就换一套哈希种子 ── */
function hash(a, b, seed) {
  let h = (a * 374761393 + b * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function makeWorld(seed) {
  return {
    seed,
    px(wx, wy) {
      const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
      const s = hash(tx, ty, seed);
      const sub = ((wx % 16) >> 2) + 4 * ((wy % 16) >> 2);
      return [(s * 37 + sub * 11) & 255, (s >>> 8 & 29) + sub * 7 & 255, (s >>> 16 & 173) + sub * 3 & 255];
    },
  };
}
/* 一帧：镜头左上角落在世界格 (ox,oy)，正中站个人（立绘每帧在动，用来验证「挖洞」生效） */
function frameAt(world, ox, oy, tick) {
  const f = new Uint8ClampedArray(240 * 160 * 4);
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 240; x++) {
      const i = (y * 240 + x) * 4;
      if (x >= 112 && x < 128 && y >= 56 && y < 88) {
        f[i] = (tick * 23) & 255; f[i + 1] = 0x20; f[i + 2] = 0x40;
      } else {
        const c = world.px(ox * 16 + x, oy * 16 + y);
        f[i] = c[0]; f[i + 1] = c[1]; f[i + 2] = c[2];
      }
      f[i + 3] = 255;
    }
  }
  return f;
}
/* 底部整条同色的暗色 HUD：不该被当成对话框 */
function withDarkHud(f) {
  const g = new Uint8ClampedArray(f);
  for (let y = 124; y < 160; y++) {
    for (let x = 0; x < 240; x++) {
      const i = (y * 240 + x) * 4;
      g[i] = 44; g[i + 1] = 78; g[i + 2] = 40;
    }
  }
  return g;
}
/* 底部整条对话框：拼图时应该被拒 */
function withTextBox(f) {
  const g = new Uint8ClampedArray(f);
  for (let y = 116; y < 160; y++) {
    for (let x = 0; x < 240; x++) {
      const i = (y * 240 + x) * 4;
      g[i] = 248; g[i + 1] = 248; g[i + 2] = 240;
    }
  }
  return g;
}

function painted(page) {
  let n = 0;
  const d = page.sheet.data;
  for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
  return n;
}

/* 全图校验：图纸上画过的每一块，都必须等于「它对应的世界像素」。
   对应关系由「玩家所在格」锚定 —— 锚点一旦歪了，这里立刻炸。 */
function sheetMatchesWorld(page, world, playerWorldTile) {
  const T = MapCore.TILE, s = page.sheet;
  const pTile = { x: page.ox + MapCore.MID_X, y: page.oy + MapCore.MID_Y };
  let checked = 0, bad = 0;
  for (let sy = 0; sy < s.h; sy += 3) {
    for (let sx = 0; sx < s.w; sx += 3) {
      const si = (sy * s.w + sx) * 4;
      if (!s.data[si + 3]) continue;
      const wx = (playerWorldTile.x + Math.floor(sx / T) - pTile.x) * T + (sx % T);
      const wy = (playerWorldTile.y + Math.floor(sy / T) - pTile.y) * T + (sy % T);
      const c = world.px(wx, wy);
      checked++;
      if (Math.abs(c[0] - s.data[si]) > 1 || Math.abs(c[1] - s.data[si + 1]) > 1 || Math.abs(c[2] - s.data[si + 2]) > 1) bad++;
    }
  }
  return { checked, bad, ratio: checked ? bad / checked : 1 };
}

/* 反复喂同一帧，直到它被拼进去（新页有 2 秒冷却） */
function settle(tr, frame, max = 40) {
  let ev = '';
  for (let i = 0; i < max; i++) {
    ev = tr.sample(frame);
    if (ev === 'commit' || ev === 'shift') return ev;
  }
  return ev;
}

/* ── 1. 纯函数 ─────────────────────────────────────────────────────────── */
{
  const w = makeWorld(7);
  const sheet = MapCore.blank(44);
  const f = frameAt(w, 10, 10, 1);
  const n = MapCore.paste(sheet, f, 20, 20);
  ok('拼图有写入', n > 240 * 124 * 0.9, `${n} 像素`);
  const same = MapCore.score(sheet, frameAt(w, 10, 10, 2), 20, 20);
  ok('同一画面在原位得分≈0（立绘会被挖洞忽略）', same && same.avg < 0.5, same ? same.avg.toFixed(2) : 'null');
  const off = MapCore.score(sheet, frameAt(w, 11, 10, 2), 20, 20);
  ok('错开一格得分明显变高', off && off.avg > 20, off ? off.avg.toFixed(1) : 'null');

  const normal = MapCore.stats(f);
  ok('正常世界画面不会被当成 UI', !normal.ui, `pale=${normal.pale.toFixed(2)} dark=${normal.dark.toFixed(2)} box=${normal.box.toFixed(2)} kinds=${normal.kinds}`);
  const boxed = MapCore.stats(withTextBox(f));
  ok('对话框被识别为 UI（不拼）', boxed.ui, `box=${boxed.box.toFixed(2)}`);
  const hud = MapCore.stats(withDarkHud(f));
  ok('底部暗色 HUD 不会被误当成对话框', !hud.ui, `box=${hud.box.toFixed(2)} boxLit=${hud.boxLit}`);
  const black = new Uint8ClampedArray(f.length);
  for (let i = 3; i < black.length; i += 4) black[i] = 255;
  ok('黑场 / 渐黑被识别为 UI', MapCore.stats(black).ui);
  const white = new Uint8ClampedArray(f.length).fill(255);
  ok('白屏 / 渐白被识别为 UI', MapCore.stats(white).ui);
}

/* ── 2. 走路：一路画过去，位置与图形都要对 ─────────────────────────────── */
{
  const w = makeWorld(11);
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  let px = 20, py = 20;                    /* 玩家所在世界格 */
  let ev = settle(tr, frameAt(w, px - 7, py - 5, 0));
  ok('第一帧开出第一页', tr.pages().length === 1 && ev === 'commit', `ev=${ev}`);

  const path = [[1, 0], [1, 0], [1, 0], [0, 1], [0, 1], [-1, 0], [0, -1], [1, 1], [1, 0], [0, 1]];
  let bad = 0, maxRatio = 0, shifts = 0, steps = 0;
  for (const [dx, dy] of path) {
    px += dx; py += dy;
    const evs = tr.sample(frameAt(w, px - 7, py - 5, ++steps));
    if (evs === 'shift') shifts++;
    const r = sheetMatchesWorld(tr.page(), w, { x: px, y: py });
    maxRatio = Math.max(maxRatio, r.ratio);
    if (r.ratio > 0.002) bad++;
  }
  ok('十步走下来图纸没错位（每个画过的像素都对得上世界）', bad === 0, `最大误差占比 ${(maxRatio * 100).toFixed(3)}%`);
  ok('图纸真的在长大（比第一帧覆盖得更多）', painted(tr.page()) > 240 * 124 * 1.2, `${painted(tr.page())} 像素`);
  ok('玩家格子留在图纸范围内', tr.page().ox + MapCore.MID_X >= 7 && tr.page().oy + MapCore.MID_Y >= 5);

  /* 走过的那条路：入口记在第一页起点，位置离当前位置几格之内 */
  const p = tr.page();
  ok('入口落在起点附近', p.entry && Math.abs(p.entry.x - (p.ox + MapCore.MID_X)) <= 12 && Math.abs(p.entry.y - (p.oy + MapCore.MID_Y)) <= 12,
    `入口 (${p.entry.x},${p.entry.y}) · 现在 (${p.ox + MapCore.MID_X},${p.oy + MapCore.MID_Y})`);
}

/* ── 3. 对话框挡画面时不画也不误判换图 ─────────────────────────────────── */
{
  const w = makeWorld(13);
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  let px = 20, py = 20;
  settle(tr, frameAt(w, px - 7, py - 5, 0));
  const before = painted(tr.page());
  const pages0 = tr.pages().length;
  for (let i = 0; i < 12; i++) {
    const ev = tr.sample(withTextBox(frameAt(w, px - 7, py - 5, i)));
    if (ev !== 'ui') ok('对话框帧不该被拼', false, `ev=${ev}`);
  }
  ok('对话框期间图纸没动', painted(tr.page()) === before);
  ok('对话框期间没误翻页', tr.pages().length === pages0);
}

/* ── 4. 换地图：连续对不上 → 翻新页，旧页标出口 ────────────────────────── */
{
  const w1 = makeWorld(17), w2 = makeWorld(23);
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  let px = 20, py = 20;
  settle(tr, frameAt(w1, px - 7, py - 5, 0));
  tr.sample(frameAt(w1, px - 6, py - 5, 1));      /* 走两步，留个落脚点 */
  tr.sample(frameAt(w1, px - 5, py - 5, 2));
  const p1 = tr.page();
  const exitBefore = p1.exit;

  let evs = [];
  for (let i = 0; i < 8; i++) evs.push(tr.sample(frameAt(w2, 30 - 7, 30 - 5, 3)));
  ok('进了另一张地图会翻页', tr.pages().length === 2, `事件 ${evs.join(',')}`);
  ok('旧页把最后落脚点标成出口', p1.exit && !exitBefore, p1.exit ? `(${p1.exit.x},${p1.exit.y})` : 'null');

  /* 新页冷却完再拼，拼出来的必须是新地图的内容 */
  let guard = 0;
  while (tr.sample(frameAt(w2, 23, 25, 4)) !== 'commit' && guard++ < 40);
  const r = sheetMatchesWorld(tr.page(), w2, { x: 30, y: 30 });
  ok('新页画的是新地图，不是上一张的残影', r.ratio <= 0.002, `误差占比 ${(r.ratio * 100).toFixed(3)}%`);
}

/* ── 5. 贴边：走远了图纸整体挪，位置依然对得上 ─────────────────────────── */
{
  const w = makeWorld(29);
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  let px = 20, py = 20;
  settle(tr, frameAt(w, px - 7, py - 5, 0));
  let shifts = 0;
  for (let i = 0; i < 26; i++) {
    px += 1;
    const ev = tr.sample(frameAt(w, px - 7, py - 5, i + 1));
    if (ev === 'shift') shifts++;
  }
  const p = tr.page();
  const r = sheetMatchesWorld(p, w, { x: px, y: py });
  ok('走 26 格后图纸挪过位置', shifts > 0, `挪了 ${shifts} 次`);
  ok('挪完依然没有错位', r.ratio <= 0.002, `误差占比 ${(r.ratio * 100).toFixed(3)}%`);
  const sx = p.ox + MapCore.MID_X, sy = p.oy + MapCore.MID_Y;
  ok('玩家始终留在图纸里（留 8 格余量）', sx >= 8 && sx <= 44 - 8 && sy >= 8 && sy <= 44 - 8, `格 (${sx},${sy})`);
}

/* ── 5b. 一步没走过的残页不留在册子里 ─────────────────────────────────── */
{
  const w1 = makeWorld(31), w2 = makeWorld(37);
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  for (let i = 0; i < 12; i++) tr.sample(frameAt(w1, 10, 10, 0));   /* 画面静止：只拼，不走 */
  const stillPages = tr.pages().length;
  for (let i = 0; i < 8; i++) tr.sample(frameAt(w2, 10, 10, i));    /* 换一张图，同样没走 */
  ok('一步没走过的页会被丢掉（不占页数）', tr.pages().length === 1 && stillPages === 1,
    `静止后 ${stillPages} 页 → 换图后 ${tr.pages().length} 页`);
}

/* ── 6. 页数上限 ───────────────────────────────────────────────────────── */
{
  const tr = MapCore.tracker({ tiles: 44, cap: 3 });
  for (let k = 0; k < 6; k++) {
    const w = makeWorld(100 + k);
    settle(tr, frameAt(w, 10, 10, 0));                    /* 等冷却、拼第一帧 */
    tr.sample(frameAt(w, 11, 10, 1));                     /* 走两步，这页才算数 */
    tr.sample(frameAt(w, 12, 10, 2));
    tr.newPage();
  }
  ok('页数超过上限时丢最早的一页', tr.pages().length === 3, `${tr.pages().length} 页`);
}

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} 通过`);
process.exit(passed === results.length ? 0 : 1);
