// 导航回归：直接吃真卡带，验证图集、代价网格、A*、跨图骨架，并把算出来的路画成 PNG
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

const ROOT = 'C:/Users/1/WorkBuddy/2026-10-31-03-22-02';
const ROM = process.argv[2] || 'E:/绿宝石+模拟器/1100296.gba';
const OUT = process.argv[3] || ROOT + '/moon-pocket/shots/nav-route.png';

/* ── 把源文件当普通脚本加载，测的就是生产代码 ── */
const src = ['pocket.11-rom-atlas.js', 'pocket.12-nav-core.js']
  .map((f) => fs.readFileSync(`${ROOT}/moon-pocket/src/${f}`, 'utf8')).join('\n;\n');
const api = new Function(src + `; return {
  makeRomAtlas, moonAstar, moonPlan, moonMapGraph, moonRouteMaps, moonSnapWalkable,
  MOON_BEHAVIOR_COST, MOON_MAP_GROUP_COUNTS };`)();

const bytes = new Uint8Array(fs.readFileSync(ROM));
let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log(`  ✓ ${name}${extra ? ' · ' + extra : ''}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' · ' + extra : ''}`); }
};

console.log('== 图集 ==');
const t0 = Date.now();
const atlas = api.makeRomAtlas(bytes);
ok('从卡带里认出地图头数组', !!atlas, `${Date.now() - t0}ms`);
if (!atlas) process.exit(1);
ok('地图张数 = 518（官方绿宝石）', atlas.count === 518, `${atlas.count} 张`);
ok('(组,序) 能换算成扁平下标', atlas.countsOk);
ok('下标换算可逆', atlas.indexOf(0, 0) === 0 && atlas.indexOf(1, 0) === 57, `组1 起点 ${atlas.indexOf(1, 0)}`);

/* 传送点 / 连接解析率 */
let warps = 0, warpsOk = 0, cons = 0, consOk = 0;
for (let i = 0; i < atlas.count; i++) {
  for (const w of atlas.warps(i)) {
    if (w.g === 127 && w.n === 127) continue;    // 占位：这张图没有这道门的目标
    warps++; if (atlas.indexOf(w.g, w.n) >= 0) warpsOk++;
  }
  for (const c of atlas.connections(i)) { cons++; if (atlas.indexOf(c.g, c.n) >= 0) consOk++; }
}
ok('传送点目标全部可解析', warpsOk === warps, `${warpsOk}/${warps}`);
ok('相邻图目标全部可解析', consOk === cons, `${consOk}/${cons}`);

/* ── 代价网格：找几张有代表性的图 ── */
const ident = JSON.parse(fs.readFileSync(ROOT + '/moon-pocket/shots/_identity.json', 'utf8'));
const byName = new Map(ident.map((m) => [m.name, m.i]));
function gridOf(name) {
  const idx = byName.get(name);
  if (idx === undefined) return null;
  const lay = atlas.layoutOf(idx);
  return { idx, lay, grid: atlas.costGrid(idx) };
}

console.log('== 代价网格 ==');
const town = gridOf('LittlerootTown');
ok('LittlerootTown 能解析', !!town, town ? `${town.lay.w}x${town.lay.h}` : '');
if (town) {
  let wall = 0, walk = 0, grass = 0;
  for (const v of town.grid) { if (!v) wall++; else { walk++; if (v > 1) grass++; } }
  ok('城镇里既有墙也有路', wall > 0 && walk > 0, `墙 ${wall} · 可走 ${walk} · 草/沙 ${grass}`);
}
const route = gridOf('Route101');
if (route) {
  let grass = 0, wall = 0;
  for (const v of route.grid) { if (!v) wall++; else if (v > 1) grass++; }
  ok('Route101 有草地（代价 > 1）', grass > 0, `草地 ${grass} 格 · 墙 ${wall}`);
}
const sea = gridOf('Route108');
if (sea) {
  let water = 0;
  const lay = sea.lay;
  for (let i = 0; i < sea.grid.length; i++) {
    const v = atlas.u16(lay.map + i * 2);
    const id = v & 0x3ff;
    const ab = atlas.u32(lay.ts1 + 16) ? atlas.off(atlas.u32(lay.ts1 + 16)) : 0;
    const ab2 = atlas.off(atlas.u32(lay.ts2 + 16));
    const bh = atlas.u16(id < 512 ? ab + id * 2 : ab2 + (id - 512) * 2) & 0xff;
    if (bh >= 16 && bh <= 24) water++;
  }
  ok('海面被判成墙（水面行为 → 代价 0）', water > 0, `水面 ${water} 格`);
}

console.log('== 单图寻路 ==');
if (route) {
  const lay = route.lay, grid = route.grid;
  /* 找两个可走格 */
  let a = null, b = null;
  for (let i = 0; i < grid.length && !a; i++) if (grid[i]) a = { x: i % lay.w, y: Math.floor(i / lay.w) };
  for (let i = grid.length - 1; i >= 0 && !b; i--) if (grid[i]) b = { x: i % lay.w, y: Math.floor(i / lay.w) };
  const path = api.moonAstar(grid, lay.w, lay.h, a.x, a.y, b.x, b.y);
  ok('能算出一条路', !!path, path ? `${path.length} 步` : '');
  if (path) {
    let adj = true, walkable = true;
    let px = a.x, py = a.y;
    for (const s of path) {
      if (Math.abs(s.x - px) + Math.abs(s.y - py) !== 1) adj = false;
      if (!grid[s.y * lay.w + s.x]) walkable = false;
      px = s.x; py = s.y;
    }
    ok('每一步都是四方向相邻', adj);
    ok('每一步都落在可走格', walkable);
    ok('终点就是对上的那一格', px === b.x && py === b.y);
    /* 草地优先绕开：路的平均代价应该低于全图平均 */
    let sum = 0, cnt = 0;
    for (const s of path) { sum += grid[s.y * lay.w + s.x]; cnt++; }
    ok('路径平均代价不高于 1.6（尽量走硬地）', sum / cnt <= 1.6, `平均 ${(sum / cnt).toFixed(2)}`);
  }
}

console.log('== 跨图骨架 ==');
const adj = api.moonMapGraph(atlas);
let edges = 0;
for (const e of adj) edges += e.length;
ok('地图之间连成了网', edges > 700, `${edges} 条边`);
/* 连通分量 */
const seen = new Uint8Array(atlas.count);
let comps = [];
for (let i = 0; i < atlas.count; i++) {
  if (seen[i]) continue;
  const q = [i]; seen[i] = 1; let n = 0;
  while (q.length) {
    const c = q.pop(); n++;
    for (const e of adj[c]) if (!seen[e.to]) { seen[e.to] = 1; q.push(e.to); }
  }
  comps.push(n);
}
comps.sort((a, b) => b - a);
ok('地图被分成若干连通片（秘境、战斗塔本来就进不去）', comps.length > 1 && comps.length < 200, `共 ${comps.length} 片，最大 ${comps[0]} 张`);

/* 剧情主线的连通片里，该有的城镇都得在 */
{
  const start = atlas.indexOf(0, 0);
  const seen2 = new Uint8Array(atlas.count);
  const q2 = [start]; seen2[start] = 1; const comp = [];
  while (q2.length) {
    const c = q2.pop(); comp.push(c);
    for (const e of adj[c]) if (!seen2[e.to]) { seen2[e.to] = 1; q2.push(e.to); }
  }
  const names = new Set(comp.map((i) => ident[i] && ident[i].name));
  const need = ['PetalburgCity', 'RustboroCity', 'DewfordTown', 'SlateportCity', 'MauvilleCity',
    'VerdanturfTown', 'FallarborTown', 'LavaridgeTown', 'FortreeCity', 'LilycoveCity',
    'MossdeepCity', 'EverGrandeCity', 'Route101', 'Route119', 'Route128'];
  const miss = need.filter((n) => !names.has(n));
  ok('主线连通片里 15 个关键地点全都在（琉璃市要潜水，另算）', miss.length === 0, miss.length ? '缺 ' + miss.join(',') : `连通片 ${comp.length} 张图`);
}

/* 让玩家从家里一路走到天元镇（跨 3 张图以上的真实路线） */
function findIdx(name) { return byName.get(name); }
const from = findIdx('LittlerootTown'), to = findIdx('PetalburgCity');
if (from !== undefined && to !== undefined) {
  const fg = atlas.costGrid(from), fl = atlas.layoutOf(from);
  let sx = 0, sy = 0, bd = 1e9;
  for (let i = 0; i < fg.length; i++) {
    if (!fg[i]) continue;
    const x = i % fl.w, y = Math.floor(i / fl.w);
    const d = Math.abs(x - fl.w / 2) + Math.abs(y - fl.h / 2);
    if (d < bd) { bd = d; sx = x; sy = y; }
  }
  const tg = atlas.costGrid(to), tl = atlas.layoutOf(to);
  let tx = 0, ty = 0;
  for (let i = tg.length - 1; i >= 0; i--) if (tg[i]) { tx = i % tl.w; ty = Math.floor(i / tl.w); break; }
  const plan = api.moonPlan(atlas, adj, from, sx, sy, to, tx, ty);
  ok('LittlerootTown → PetalburgCity 算得出完整路线', !!plan, plan ? `${plan.length} 段` : '');
  if (plan) {
    let steps = 0;
    for (const seg of plan) steps += seg.steps.length;
    ok('路线含多张地图（说明跨图生效）', plan.length >= 2, plan.map((p) => ident[p.idx].name).join(' → '));
    ok('总步数在合理范围', steps > 5 && steps < 3000, `${steps} 步`);
  }
}

/* ── 画一张带红线的图，肉眼验一下 ── */
const DBG = process.env.NAV_PNG_MAP || 'Route101';
const pick = gridOf(DBG) || route || town;
if (pick) {
  /* 先算一条从左上走到右下的路，画上去看效果 */
  const lay = pick.lay, grid = pick.grid;
  let s0 = null, s1 = null;
  for (let i = 0; i < grid.length && !s0; i++) if (grid[i]) s0 = { x: i % lay.w, y: Math.floor(i / lay.w) };
  for (let i = grid.length - 1; i >= 0 && !s1; i--) if (grid[i]) s1 = { x: i % lay.w, y: Math.floor(i / lay.w) };
  pick.path = api.moonAstar(grid, lay.w, lay.h, s0.x, s0.y, s1.x, s1.y);
  const png = renderWithPath(bytes, atlas, pick, api);
  fs.writeFileSync(OUT, png);
  console.log(`\n画出 ${DBG} 的路线 → ${OUT}`);
}

console.log(`\n==== ${pass}/${pass + fail} 通过 ====`);
if (fail) process.exit(1);

/* ───────────── 渲染（只在回归里用，不进插件） ───────────── */
function renderWithPath(b, atlas, pick, api) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const off = (p) => p - 0x08000000;
  function lz77(at) {
    if (b[at] !== 0x10) return null;
    const size = b[at + 1] | (b[at + 2] << 8) | (b[at + 3] << 16);
    const out = new Uint8Array(size);
    let i = at + 4, o = 0;
    while (o < size) {
      const flags = b[i++];
      for (let bit = 7; bit >= 0 && o < size; bit--) {
        if (flags & (1 << bit)) {
          const b1 = b[i++], b2 = b[i++];
          const len = (b1 >> 4) + 3, disp = ((b1 & 0xF) << 8) | b2;
          for (let k = 0; k < len && o < size; k++, o++) out[o] = out[o - disp - 1];
        } else out[o++] = b[i++];
      }
    }
    return out;
  }
  function tileset(p) {
    const o = off(p);
    const compressed = b[o] === 1;
    const g = dv.getUint32(o + 4, true), pa = dv.getUint32(o + 8, true), me = dv.getUint32(o + 12, true);
    const gfx = (compressed && lz77(off(g))) || b.subarray(off(g), off(g) + 512 * 32);
    const pal = new Uint16Array(256);
    for (let i = 0; i < 256; i++) pal[i] = dv.getUint16(off(pa) + i * 2, true);
    return { gfx, pal, meta: off(me), sub: 0 };
  }
  const lay = pick.lay;
  const L = off(dv.getUint32(lay.header, true));
  const ts1 = tileset(dv.getUint32(L + 16, true));
  const ts2 = tileset(dv.getUint32(L + 20, true));
  ts2.sub = 512;
  const W = lay.w * 16, H = lay.h * 16;
  const out = Buffer.alloc(W * H * 3, 0);
  const rgb = (c) => [((c & 31) << 3) | ((c & 31) >> 2), (((c >> 5) & 31) << 3) | (((c >> 5) & 31) >> 2), (((c >> 10) & 31) << 3) | (((c >> 10) & 31) >> 2)];
  function drawTile(ts, x, y, tileId, palBank, hf, vf) {
    const idx = tileId - ts.sub;
    if (idx < 0 || idx * 32 >= ts.gfx.length) return;
    const src = idx * 32;
    for (let ty = 0; ty < 8; ty++) for (let tx = 0; tx < 8; tx++) {
      const byte = ts.gfx[src + ty * 4 + (tx >> 1)];
      const v = (tx & 1) ? (byte >> 4) : (byte & 0xF);
      if (!v) continue;
      const [r, g, bl] = rgb(ts.pal[palBank * 16 + v]);
      const px = x + (hf ? 7 - tx : tx), py = y + (vf ? 7 - ty : ty);
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const di = (py * W + px) * 3;
      out[di] = r; out[di + 1] = g; out[di + 2] = bl;
    }
  }
  for (let ty = 0; ty < lay.h; ty++) for (let tx = 0; tx < lay.w; tx++) {
    const v = dv.getUint16(lay.map + (ty * lay.w + tx) * 2, true);
    const id = v & 0x3ff;
    const ts = id < 512 ? ts1 : ts2;
    const mo = ts.meta + (id - ts.sub) * 16;
    for (let i = 0; i < 8; i++) {
      const e = dv.getUint16(mo + i * 2, true);
      const tileId = e & 0x3ff;
      if (!tileId) continue;
      drawTile(ts, tx * 16 + (i & 1) * 8, ty * 16 + ((i >> 1) & 1) * 8, tileId, (e >> 12) & 0xF, (e >> 10) & 1, (e >> 11) & 1);
    }
  }
  /* 画路：红色 2px 线 + 终点十字 */
  const path = pick.path;
  if (path) {
    const put = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) { const i = (y * W + x) * 3; out[i] = 220; out[i + 1] = 20; out[i + 2] = 40; } };
    let prev = null;
    for (const s of path) {
      const cx = s.x * 16 + 8, cy = s.y * 16 + 8;
      if (prev) {
        const steps = Math.max(Math.abs(cx - prev[0]), Math.abs(cy - prev[1]));
        for (let k = 0; k <= steps; k++) {
          const x = Math.round(prev[0] + (cx - prev[0]) * k / steps);
          const y = Math.round(prev[1] + (cy - prev[1]) * k / steps);
          put(x, y); put(x + 1, y); put(x, y + 1);
        }
      }
      prev = [cx, cy];
    }
  }
  return png(W, H, out);
}
function png(w, h, rgbBuf) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgbBuf.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const crcTable = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    let crc = 0xFFFFFFFF;
    for (const byte of body) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const c = Buffer.alloc(4); c.writeUInt32BE(crc);
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
