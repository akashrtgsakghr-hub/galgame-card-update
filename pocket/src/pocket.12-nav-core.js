/* ── 寻路内核 ────────────────────────────────────────────────────────────
   纯函数，不碰 DOM、不碰模拟器：给一张代价网格就能算出一条路。
   代价来自 pocket.11-rom-atlas.js（普通地面 1、草地 2~3、沙地 2、水和坎 = 墙），
   所以算出来的永远是「只靠走」的那条，不会让玩家去爬、去跳、去渡水。
   ────────────────────────────────────────────────────────────────────── */

/* 四方向 A*。grid[i] = 0 表示走不过去，>0 是踩上去的代价。
   返回 [{x,y}...]（不含起点），走不通返回 null。 */
function moonAstar(grid, w, h, sx, sy, tx, ty) {
  if (!grid || w <= 0 || h <= 0) return null;
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return null;
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
  var start = sy * w + sx, goal = ty * w + tx;
  if (start === goal) return [];
  if (!grid[goal]) return null;

  var n = w * h;
  var g = new Float32Array(n);
  var f = new Float32Array(n);
  var from = new Int32Array(n);
  var closed = new Uint8Array(n);
  var open = [];                       // 简单二叉堆
  for (var i = 0; i < n; i++) { g[i] = Infinity; from[i] = -1; }

  function push(idx) {
    open.push(idx);
    var k = open.length - 1;
    while (k > 0) {
      var p = (k - 1) >> 1;
      if (f[open[p]] <= f[open[k]]) break;
      var t = open[p]; open[p] = open[k]; open[k] = t; k = p;
    }
  }
  function pop() {
    var top = open[0], last = open.pop();
    if (open.length) {
      open[0] = last;
      var k = 0;
      for (;;) {
        var l = k * 2 + 1, r = l + 1, m = k;
        if (l < open.length && f[open[l]] < f[open[m]]) m = l;
        if (r < open.length && f[open[r]] < f[open[m]]) m = r;
        if (m === k) break;
        var t = open[m]; open[m] = open[k]; open[k] = t; k = m;
      }
    }
    return top;
  }
  function hcost(idx) {
    var x = idx % w, y = (idx - x) / w;
    return Math.abs(x - tx) + Math.abs(y - ty);
  }

  g[start] = 0; f[start] = hcost(start); push(start);
  var guard = 0;
  while (open.length && guard++ < n * 4) {
    var cur = pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    var cx = cur % w, cy = (cur - cx) / w;
    var nx = [cx + 1, cx - 1, cx, cx], ny = [cy, cy, cy + 1, cy - 1];
    for (var k = 0; k < 4; k++) {
      var ax = nx[k], ay = ny[k];
      if (ax < 0 || ay < 0 || ax >= w || ay >= h) continue;
      var ni = ay * w + ax;
      if (closed[ni] || !grid[ni]) continue;
      var ng = g[cur] + grid[ni];
      if (ng < g[ni]) {
        g[ni] = ng; from[ni] = cur; f[ni] = ng + hcost(ni); push(ni);
      }
    }
  }
  if (from[goal] < 0 && start !== goal) return null;
  var path = [], p = goal, hops = 0;
  while (p !== start && p >= 0 && hops++ < n) {
    path.push({ x: p % w, y: Math.floor(p / w) });
    p = from[p];
  }
  if (p !== start) return null;
  path.reverse();
  return path;
}

/* 把点吸附到最近的可走格：玩家点的可能是墙、是树、是水面 */
function moonSnapWalkable(grid, w, h, x, y, rad) {
  if (!grid || w <= 0 || h <= 0) return null;
  rad = rad || 6;
  var best = null, bestD = 1e9;
  for (var dy = -rad; dy <= rad; dy++) {
    for (var dx = -rad; dx <= rad; dx++) {
      var ax = x + dx, ay = y + dy;
      if (ax < 0 || ay < 0 || ax >= w || ay >= h) continue;
      if (!grid[ay * w + ax]) continue;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = { x: ax, y: ay }; }
    }
  }
  return best;
}

/* ── 跨图：先按「地图跳数」选一条骨架，再在每张图里走实际的路 ──────────
   走门 / 走出边界都算一跳。水、坎、需要秘传技的地方在代价网格里已经是墙，
   所以骨架里不会出现「得游过去」的边。 */
function moonMapGraph(atlas) {
  var n = atlas.count;
  var adj = new Array(n);
  for (var i = 0; i < n; i++) adj[i] = [];
  for (var idx = 0; idx < n; idx++) {
    var ws = atlas.warps(idx);
    for (var k = 0; k < ws.length; k++) {
      var to = atlas.indexOf(ws[k].g, ws[k].n);
      if (to >= 0 && to !== idx) {
        adj[idx].push({ to: to, kind: 'warp', x: ws[k].x, y: ws[k].y, warpId: ws[k].warpId, w: 8 });
      }
    }
    var cs = atlas.connections(idx);
    for (var j = 0; j < cs.length; j++) {
      var t2 = atlas.indexOf(cs[j].g, cs[j].n);
      if (t2 >= 0 && t2 !== idx) {
        adj[idx].push({ to: t2, kind: 'conn', dir: cs[j].dir, offset: cs[j].offset, w: 2 });
      }
    }
  }
  return adj;
}

/* 从 from 到 to 的最省交互骨架：返回 [{to, via}]，via 是这道门在上一张图的位置 */
function moonRouteMaps(atlas, adj, fromIdx, toIdx) {
  if (fromIdx === toIdx) return [];
  var n = atlas.count;
  var dist = new Float32Array(n);
  var prev = new Array(n);
  var seen = new Uint8Array(n);
  for (var i = 0; i < n; i++) dist[i] = Infinity;
  dist[fromIdx] = 0;
  var queue = [fromIdx];
  var guard = 0;
  while (queue.length && guard++ < n * 40) {
    /* 朴素取最小：518 张图、每张几道门，规模很小，够用 */
    var bi = 0;
    for (var q = 1; q < queue.length; q++) if (dist[queue[q]] < dist[queue[bi]]) bi = q;
    var cur = queue.splice(bi, 1)[0];
    if (seen[cur]) continue;
    seen[cur] = 1;
    if (cur === toIdx) break;
    var es = adj[cur];
    for (var e = 0; e < es.length; e++) {
      var ed = es[e];
      var nd = dist[cur] + ed.w;
      if (nd < dist[ed.to]) {
        dist[ed.to] = nd;
        prev[ed.to] = { from: cur, edge: ed };
        queue.push(ed.to);
      }
    }
  }
  if (dist[toIdx] === Infinity) return null;
  var hops = [], p = toIdx;
  while (p !== fromIdx) {
    var step = prev[p];
    if (!step) return null;
    hops.push({ from: step.from, to: p, edge: step.edge });
    p = step.from;
  }
  hops.reverse();
  return hops;
}

/* 走出边界：在对应那条边上找一个能站的格子。
   边界那一行多半是树或围栏，得整条边扫一遍，挑离当前位置最近的可走格。 */
function moonEdgeExit(grid, w, h, dir, cx, cy) {
  var cells = [];
  var depth = 2;
  for (var d = 0; d < depth; d++) {
    if (dir === 3) { for (var y = 0; y < h; y++) cells.push({ x: d, y: y }); }
    else if (dir === 4) { for (var y2 = 0; y2 < h; y2++) cells.push({ x: w - 1 - d, y: y2 }); }
    else if (dir === 2) { for (var x = 0; x < w; x++) cells.push({ x: x, y: d }); }
    else if (dir === 1) { for (var x2 = 0; x2 < w; x2++) cells.push({ x: x2, y: h - 1 - d }); }
  }
  var best = null, bestD = 1e9;
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];
    if (!grid[c.y * w + c.x]) continue;
    var dist = Math.abs(c.x - cx) + Math.abs(c.y - cy);
    if (dist < bestD) { bestD = dist; best = c; }
  }
  return best;
}

/* 从 A 走到 B 之后，人落在 B 的哪一格？
   走边界：从 A 的北边出去，就从 B 的南边进来（东西同理），中间按连接表的 offset 平移；
   走门：B 里那扇「指回 A、编号相同」的门就是落点。 */
function moonEntry(atlas, nextIdx, fromIdx, edge, exit) {
  var lay = atlas.layoutOf(nextIdx);
  if (!lay) return null;
  var grid = atlas.costGrid(nextIdx);
  var guess = null;
  if (edge.kind === 'warp') {
    var ws = atlas.warps(nextIdx);
    for (var i = 0; i < ws.length; i++) {
      if (atlas.indexOf(ws[i].g, ws[i].n) === fromIdx && ws[i].warpId === edge.warpId) { guess = { x: ws[i].x, y: ws[i].y }; break; }
    }
    if (!guess) {
      for (var j = 0; j < ws.length; j++) {
        if (atlas.indexOf(ws[j].g, ws[j].n) === fromIdx) { guess = { x: ws[j].x, y: ws[j].y }; break; }
      }
    }
  } else {
    var ofs = edge.offset | 0;
    if (edge.dir === 2) guess = { x: (exit ? exit.x : Math.floor(lay.w / 2)) - ofs, y: lay.h - 1 };
    else if (edge.dir === 1) guess = { x: (exit ? exit.x : Math.floor(lay.w / 2)) - ofs, y: 0 };
    else if (edge.dir === 3) guess = { x: lay.w - 1, y: (exit ? exit.y : Math.floor(lay.h / 2)) - ofs };
    else if (edge.dir === 4) guess = { x: 0, y: (exit ? exit.y : Math.floor(lay.h / 2)) - ofs };
  }
  if (!guess) return null;
  return moonSnapWalkable(grid, lay.w, lay.h, guess.x, guess.y, 8);
}

/* 完整路线：本图起点 → 一道道门 → 目标图的目标格。
   返回 [{ idx, steps:[{x,y}...], exit }]，走不通返回 null。 */
function moonPlan(atlas, adj, fromIdx, sx, sy, toIdx, tx, ty) {
  var hops = moonRouteMaps(atlas, adj, fromIdx, toIdx);
  if (hops === null) return null;
  var out = [];
  var cx = sx, cy = sy, cur = fromIdx;
  if (!hops.length) {
    var lay0 = atlas.layoutOf(cur);
    if (!lay0) return null;
    var g0 = atlas.costGrid(cur);
    var snap = moonSnapWalkable(g0, lay0.w, lay0.h, tx, ty, 8);
    if (!snap) return null;
    var p0 = moonAstar(g0, lay0.w, lay0.h, cx, cy, snap.x, snap.y);
    if (!p0) return null;
    return [{ idx: cur, steps: p0, target: snap, exit: snap }];
  }
  for (var h = 0; h < hops.length; h++) {
    var hop = hops[h];
    var lay = atlas.layoutOf(hop.from);
    if (!lay) return null;
    var grid = atlas.costGrid(hop.from);
    var dest;
    if (hop.edge.kind === 'warp') dest = moonSnapWalkable(grid, lay.w, lay.h, hop.edge.x, hop.edge.y, 4);
    else dest = moonEdgeExit(grid, lay.w, lay.h, hop.edge.dir, cx, cy);
    if (!dest) return null;
    var steps = moonAstar(grid, lay.w, lay.h, cx, cy, dest.x, dest.y);
    if (!steps) return null;
    out.push({ idx: hop.from, steps: steps, via: hop.edge, exit: dest });
    var entry = moonEntry(atlas, hop.to, hop.from, hop.edge, dest);
    if (!entry) return null;
    cur = hop.to; cx = entry.x; cy = entry.y;
  }
  var layL = atlas.layoutOf(cur);
  if (!layL) return null;
  var gridL = atlas.costGrid(cur);
  var snapL = moonSnapWalkable(gridL, layL.w, layL.h, tx, ty, 8);
  if (!snapL) return null;
  var last = moonAstar(gridL, layL.w, layL.h, cx, cy, snapL.x, snapL.y);
  if (!last) return null;
  out.push({ idx: cur, steps: last, target: snapL, exit: snapL });
  return out;
}
