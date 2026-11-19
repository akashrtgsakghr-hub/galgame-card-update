/* ── 导航界面 ────────────────────────────────────────────────────────────
   点一下左上角的小地图 → 整张图铺开；点图上任意一格设目的地，或者从清单里挑；
   放大图上画红线，缩回小窗后红线变成「往哪边走」的指引；按「走过去」由脚本代按方向键。

   认路的前提是「知道自己在哪张图、哪一格」。核心没有内存出口，所以改用画面：
   把当前这一帧按 16px 切成 15×7 块，取每块的平均亮度，去和卡带里 500 多张地图
   逐格比对，得分最高的就是现在站的地方。一次比对约 0.2 秒，只在进新图时做。
   ────────────────────────────────────────────────────────────────────── */

/* 目的地清单：中文名 + 扁平下标（官方绿宝石 518 张的排列顺序，已与卡带逐张核对） */
var NAV_POIS = [
  ['未白镇', 9], ['古辰镇', 10], ['橙华市', 0], ['卡那兹市', 3], ['武斗镇', 11],
  ['凯那市', 1], ['紫堇市', 2], ['绿荫镇', 14], ['秋叶镇', 13], ['釜炎镇', 12],
  ['茵郁市', 4], ['水静市', 5], ['绿岭市', 6], ['琉璃市', 7], ['彩幽市', 8], ['暮水镇', 15],
  ['橙华森林', 249], ['石之洞窟', 245], ['流星瀑布', 238], ['浅滩洞穴', 284],
  ['沙漠遗迹', 244], ['小岛横洞', 305], ['古代坟墓', 306],
  ['101 号路', 16], ['102 号路', 17], ['110 号路', 25], ['119 号路', 34],
  ['121 号路', 36], ['128 号路', 43]
];

var navAtlasCache = null, navAdjCache = null, navAtlasBroken = false;
var navRom = null, navRomLen = 0;
var navHere = null;                 // { idx, x, y, score }
var navDest = null;                 // { idx, x, y, name }
var navPlan = null;                 // moonPlan 的结果
var navBlink = 0, navWalking = false, navWalkTimer = 0;
var navMapCanvasCache = {}, navMapCanvasKey = '';
var navLumaCache = {}, navGridCache = {};

/* ── 卡带 ─────────────────────────────────────────────────────────────── */
function navRomBytes() {
  if (navRom) return navRom;
  if (!coreModule || !lastRom) return null;
  var ptr = 0;
  try { ptr = coreModule._emuGetSymbol(1); } catch (e) { return null; }
  var len = Math.round((Number(lastRom.sizeMB) || 16) * 1048576);
  if (!ptr || !coreModule.HEAPU8 || ptr + len > coreModule.HEAPU8.length) return null;
  navRomLen = len;
  navRom = coreModule.HEAPU8.subarray(ptr, ptr + len);
  return navRom;
}
function navAtlas() {
  if (navAtlasCache || navAtlasBroken) return navAtlasCache;
  var bytes = navRomBytes();
  if (!bytes) return null;
  try {
    navAtlasCache = makeRomAtlas(bytes);
  } catch (e) { navAtlasBroken = true; return null; }
  if (!navAtlasCache) { navAtlasBroken = true; return null; }
  return navAtlasCache;
}
function navAdj() {
  if (navAdjCache) return navAdjCache;
  var a = navAtlas();
  if (!a || !a.countsOk) return null;
  navAdjCache = moonMapGraph(a);
  return navAdjCache;
}

/* ── 认图：整张图缩到「一格一个亮度」，拿画面去对 ────────────────────── */
function navLz77(at) {
  var b = navRom;
  if (!b || b[at] !== 0x10) return null;
  var size = b[at + 1] | (b[at + 2] << 8) | (b[at + 3] << 16);
  var out = new Uint8Array(size);
  var i = at + 4, o = 0;
  while (o < size && i < b.length) {
    var flags = b[i++];
    for (var bit = 7; bit >= 0 && o < size; bit--) {
      if (flags & (1 << bit)) {
        var b1 = b[i++], b2 = b[i++];
        var len = (b1 >> 4) + 3, disp = ((b1 & 0xF) << 8) | b2;
        for (var k = 0; k < len && o < size; k++, o++) out[o] = out[o - disp - 1];
      } else out[o++] = b[i++];
    }
  }
  return out;
}
function navTsInfo(atlas, tsOff) {
  var key = 'ts' + tsOff;
  if (navLumaCache[key]) return navLumaCache[key];
  var b = navRom;
  var compressed = b[tsOff] === 1;
  var gPtr = atlas.off(atlas.u32(tsOff + 4));
  var pPtr = atlas.off(atlas.u32(tsOff + 8));
  var mPtr = atlas.off(atlas.u32(tsOff + 12));
  var gfx = (compressed && navLz77(gPtr)) || b.subarray(gPtr, gPtr + 512 * 32);
  var pal = new Uint16Array(256);
  for (var i = 0; i < 256; i++) {
    var v = atlas.u16(pPtr + i * 2);
    pal[i] = v;
  }
  var info = { gfx: gfx, pal: pal, meta: mPtr };
  navLumaCache[key] = info;
  return info;
}
/* 元瓦片 → 平均亮度（0..255）。同一套瓦片集只算一次，1024 条 */
function navMetaLuma(atlas, idx) {
  var lay = atlas.layoutOf(idx);
  var key = 'ml' + lay.ts1 + ':' + lay.ts2;
  if (navLumaCache[key]) return navLumaCache[key];
  var t1 = navTsInfo(atlas, lay.ts1);
  var t2 = navTsInfo(atlas, lay.ts2);
  var out = new Uint8Array(1024);
  for (var id = 0; id < 1024; id++) {
    var ts = id < 512 ? t1 : t2;
    var mo = ts.meta + (id < 512 ? id : id - 512) * 16;
    var sum = 0, n = 0;
    for (var e = 0; e < 8; e++) {
      var ent = atlas.u16(mo + e * 2);
      var tid = ent & 0x3ff;
      if (!tid) continue;
      var base = tid * 32;
      if (base + 32 > ts.gfx.length) continue;
      var bank = (ent >> 12) & 0xf;
      for (var p = 0; p < 32; p++) {
        var byte = ts.gfx[base + p];
        for (var half = 0; half < 2; half++) {
          var cidx = half ? (byte >> 4) : (byte & 0xf);
          if (!cidx) continue;
          var c = ts.pal[bank * 16 + cidx];
          sum += ((c & 31) * 3 + ((c >> 5) & 31) * 6 + ((c >> 10) & 31)) * 8;
          n++;
        }
      }
    }
    out[id] = n ? Math.min(255, Math.round(sum / n)) : 0;
  }
  navLumaCache[key] = out;
  return out;
}
function navMapGrid(atlas, idx) {
  if (navGridCache[idx]) return navGridCache[idx];
  var lay = atlas.layoutOf(idx);
  if (!lay) return null;
  var luma = navMetaLuma(atlas, idx);
  var g = new Uint8Array(lay.w * lay.h);
  for (var y = 0; y < lay.h; y++) {
    for (var x = 0; x < lay.w; x++) {
      var v = atlas.u16(lay.map + (y * lay.w + x) * 2);
      g[y * lay.w + x] = luma[v & 0x3ff];
    }
  }
  navGridCache[idx] = { grid: g, w: lay.w, h: lay.h };
  return navGridCache[idx];
}
/* 画面 → 15×8 个格子的平均亮度（底部 32px 是改版的常驻 HUD，不参与） */
var NAV_Rows = 8;
/* 取「玩家正看着的那一帧」：优先从屏幕画布上读，读不到才退回核心的帧缓冲。
   两块本来应该一样，但画布是唯一能确认「屏幕上真的是这个」的来源。 */
function navGrabFrame() {
  var cv = document.getElementById('core-canvas');
  if (cv && cv.getContext) {
    try { return cv.getContext('2d').getImageData(0, 0, 240, 160); } catch (e) {}
  }
  return coreImageData;
}
function navFrameLuma() {
  var img = navGrabFrame();
  if (!img) return null;
  var d = img.data;
  var out = new Uint8Array(15 * NAV_Rows);
  for (var ty = 0; ty < NAV_Rows; ty++) {
    for (var tx = 0; tx < 15; tx++) {
      var sum = 0, n = 0;
      for (var y = 2; y < 16; y += 3) {
        for (var x = 2; x < 16; x += 3) {
          var i = (((ty * 16 + y) * 240) + (tx * 16 + x)) * 4;
          sum += d[i] * 3 + d[i + 1] * 6 + d[i + 2];
          n += 10;
        }
      }
      out[ty * 15 + tx] = Math.round(sum / n / 8);
    }
  }
  return out;
}
/* ── 直接读存档定位（首选）───────────────────────────────────────────────
   卡带里那张 gMoonSymTab 给了 &gSaveBlock1Ptr。SaveBlock1 的布局是源码写死的
   （include/global.h）：
     0x00 struct Coords16 pos       → 当前格 x / y
     0x04 struct WarpData location  → mapGroup / mapNum
   顺着读一次就有「哪张图的哪一格」，一格不差。

   为什么不继续用画面比对：它只认「画面中间那块地形」，画面一旦被别的东西盖住
   （骑乘时坐骑压在身上、对话框、菜单、黑屏过场、战斗）就认不出来，地图直接空掉。
   读内存不看画面，这些情况全都不受影响。──────────────────────────────── */
var navMemTab = null, navMemTabAbsent = false;

/* 换卡带时清缓存：ROM 指针、地图图集、坐标表、已认出的位置都得重来 */
function navForgetRom() {
  navRom = null; navRomLen = 0;
  navAtlasCache = null; navAdjCache = null; navAtlasBroken = false;
  navMemTab = null; navMemTabAbsent = false;
  navMapCanvasCache = {}; navMapCanvasKey = '';
  navLumaCache = {}; navGridCache = {};
  navHere = null; navDest = null; navPlan = null;
}

function navMemTable() {
  if (navMemTab || navMemTabAbsent) return navMemTab;
  var b = navRomBytes();
  var M = coreModule;
  /* ROM 还没装进核心时先别下结论：小窗一开机就在重绘，这里会被反复调用，
     只有「ROM 读到了但搜不到表」才算这张卡带没带坐标表。 */
  if (!b || !b.length || !M || !M._emuPeek32) return null;
  /* 'S','M','T','1' 按小端拼成 0x31544D53 */
  var MAGIC = 0x31544D53;
  var at = -1;
  for (var o = 0; o + 8 <= b.length; o += 4) {
    if (((b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0) === MAGIC) { at = o; break; }
  }
  if (at < 0) { navMemTabAbsent = true; return null; }
  navMemTab = {
    at: at,
    savPtrAddr: (b[at + 4] | (b[at + 5] << 8) | (b[at + 6] << 16) | (b[at + 7] << 24)) >>> 0,
  };
  return navMemTab;
}

/* 读存档 → { idx, x, y }；读不到（还没进游戏 / 卡带没这张表）返回 null */
function navMemLocate() {
  var tab = navMemTable();
  var M = coreModule;
  if (!tab || !M || !M._emuPeek32) return null;
  var atlas = navAtlas();
  if (!atlas) return null;
  var sav = M._emuPeek32(tab.savPtrAddr) >>> 0;
  /* SaveBlock1 在 EWRAM（0x02000000 起）；0 或越界说明还没建好存档 */
  if (sav < 0x02000000 || sav >= 0x02040000) return null;
  var p0 = M._emuPeek32(sav) >>> 0;
  var p1 = M._emuPeek32(sav + 4) >>> 0;
  var x = p0 & 0xFFFF, y = (p0 >>> 16) & 0xFFFF;
  var g = p1 & 0xFF, n = (p1 >>> 8) & 0xFF;
  var idx = atlas.indexOf(g, n);
  if (idx < 0 || idx >= atlas.count) return null;
  var lay = atlas.layoutOf(idx);
  if (!lay || x >= lay.w || y >= lay.h) return null;
  return { idx: idx, x: x, y: y, score: 999, exact: true };
}

/* 找「这张画面属于哪张图的哪一格」。
   两条硬规矩，宁可说「认不准」也不指错路：
   · 这一窗如果几乎是一块纯色（树林、墙面、水面），任何图都对得上，直接放弃；
   · 第一名和第二名打平（差 2 格以内）也放弃——说明这块地形在好几张图里都长一样。 */
function navIdentify(frameLuma) {
  var atlas = navAtlas();
  if (!atlas) return null;
  /* 能读存档就别猜：画面比对只在没有符号表的卡带上兜底 */
  var exact = navMemLocate();
  if (exact) return exact;
  var fl = frameLuma || navFrameLuma();
  if (!fl || fl.length < 15 * NAV_Rows) return null;
  var rows = NAV_Rows, tiles = 15 * rows;

  /* 画面本身有没有起伏 */
  var mean = 0, i;
  for (i = 0; i < tiles; i++) mean += fl[i];
  mean /= tiles;
  var varc = 0;
  for (i = 0; i < tiles; i++) { var dv = fl[i] - mean; varc += dv * dv; }
  if (Math.sqrt(varc / tiles) < 9) return null;

  var best = null, second = null;
  var N = atlas.count;
  for (var idx = 0; idx < N; idx++) {
    var lay = atlas.layoutOf(idx);
    if (!lay || lay.w < 15 || lay.h < rows) continue;
    var mg = navMapGrid(atlas, idx);
    if (!mg) continue;
    var g = mg.grid, w = mg.w, h = mg.h;
    var mapBest = -1, mapBestX = 0, mapBestY = 0;
    for (var oy = 0; oy + rows <= h; oy++) {
      for (var ox = 0; ox + 15 <= w; ox++) {
        var score = 0, ok = true;
        for (var k = 0; k < 8; k++) {              // 先拿 8 个点粗筛，不行就跳
          var fk = (k * 13) % tiles;
          if (Math.abs(g[(oy + ((fk / 15) | 0)) * w + ox + (fk % 15)] - fl[fk]) > 30) { ok = false; break; }
        }
        if (!ok) continue;
        for (var t = 0; t < tiles; t++) {
          if (Math.abs(g[(oy + ((t / 15) | 0)) * w + ox + (t % 15)] - fl[t]) <= 26) score++;
        }
        if (score > mapBest) { mapBest = score; mapBestX = ox; mapBestY = oy; }
      }
    }
    if (mapBest < 0) continue;
    var cand = { idx: idx, x: mapBestX + 7, y: mapBestY + 5, score: mapBest };
    if (!best || cand.score > best.score) { second = best; best = cand; }
    else if (!second || cand.score > second.score) second = cand;
  }
  if (!best || best.score < tiles * 0.72) return null;
  if (second && second.score >= best.score - 2) return null;   // 打平：不敢认
  return best;
}

/* ── 整张图渲染 ───────────────────────────────────────────────────────── */
function navRenderMapCanvas(idx) {
  var atlas = navAtlas();
  if (!atlas) return null;
  if (navMapCanvasKey === idx && navMapCanvasCache[idx]) return navMapCanvasCache[idx];
  var lay = atlas.layoutOf(idx);
  if (!lay) return null;
  var W = lay.w * 16, H = lay.h * 16;
  if (W <= 0 || H <= 0 || W * H > 4000 * 4000) return null;
  var t1 = navTsInfo(atlas, lay.ts1);
  var t2 = navTsInfo(atlas, lay.ts2);
  var buf = new Uint8ClampedArray(W * H * 4);
  function blob(x, y, tid, bank, hf, vf, gfx, pal) {
    var base = tid * 32;
    if (base + 32 > gfx.length) return;
    for (var py = 0; py < 8; py++) {
      for (var px = 0; px < 8; px++) {
        var byte = gfx[base + py * 4 + (px >> 1)];
        var ci = (px & 1) ? (byte >> 4) : (byte & 0xf);
        if (!ci) continue;
        var c = pal[bank * 16 + ci];
        var dx = x + (hf ? 7 - px : px), dy = y + (vf ? 7 - py : py);
        if (dx < 0 || dy < 0 || dx >= W || dy >= H) continue;
        var o = (dy * W + dx) * 4;
        buf[o] = ((c & 31) << 3) | ((c & 31) >> 2);
        buf[o + 1] = (((c >> 5) & 31) << 3) | (((c >> 5) & 31) >> 2);
        buf[o + 2] = (((c >> 10) & 31) << 3) | (((c >> 10) & 31) >> 2);
        buf[o + 3] = 255;
      }
    }
  }
  for (var ty = 0; ty < lay.h; ty++) {
    for (var tx = 0; tx < lay.w; tx++) {
      var v = atlas.u16(lay.map + (ty * lay.w + tx) * 2);
      var id = v & 0x3ff;
      var ts = id < 512 ? t1 : t2;
      var sub = id < 512 ? id : id - 512;
      var mo = ts.meta + sub * 16;
      for (var e = 0; e < 8; e++) {
        var ent = atlas.u16(mo + e * 2);
        var tid = ent & 0x3ff;
        if (!tid) continue;
        blob(tx * 16 + (e & 1) * 8, ty * 16 + ((e >> 1) & 1) * 8, tid, (ent >> 12) & 0xf,
          (ent >> 10) & 1, (ent >> 11) & 1, ts.gfx, ts.pal);
      }
    }
  }
  var cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  var ctx = cv.getContext('2d');
  ctx.putImageData(new ImageData(buf, W, H), 0, 0);
  navMapCanvasCache = {};
  navMapCanvasCache[idx] = cv;
  navMapCanvasKey = idx;
  return cv;
}

/* ── 放大层 ───────────────────────────────────────────────────────────── */
function navEl(id) { return document.getElementById(id); }

function navBuild() {
  if (navEl('nav-view')) return;
  var host = document.querySelector('.core-stage') || document.body;
  var box = document.createElement('div');
  box.className = 'nav-view';
  box.id = 'nav-view';
  box.hidden = true;
  box.innerHTML =
    '<div class="nv-head"><b id="nv-title">地图</b>' +
    '<button type="button" id="nv-close" aria-label="关闭">×</button></div>' +
    '<div class="nv-stage"><canvas id="nv-canvas" width="720" height="480"></canvas>' +
    '<div class="nv-hint" id="nv-hint">点图上一格 = 定目的地</div></div>' +
    '<div class="nv-bar">' +
    '<select id="nv-pois"><option value="">去哪儿…</option></select>' +
    '<button type="button" id="nv-go">走过去</button>' +
    '<button type="button" id="nv-clear">清空</button>' +
    '</div>';
  host.appendChild(box);
  var sel = navEl('nv-pois');
  for (var i = 0; i < NAV_POIS.length; i++) {
    var op = document.createElement('option');
    op.value = String(NAV_POIS[i][1]);
    op.textContent = NAV_POIS[i][0];
    sel.appendChild(op);
  }
  navEl('nv-close').addEventListener('click', navClose);
  navEl('nv-clear').addEventListener('click', function () {
    navDest = null; navPlan = null; navHint('点图上一格 = 定目的地'); navDraw();
    if (typeof mapRender === 'function') mapRender();
  });
  navEl('nv-go').addEventListener('click', function () { navWalkStart(); });
  navEl('nv-canvas').addEventListener('click', navTap);
  sel.addEventListener('change', function () {
    var v = sel.value;
    if (!v) return;
    navPickMap(Number(v), sel.options[sel.selectedIndex].textContent);
  });
  /* 瞬间移动是另一片（pocket.14），这边只在建好工具栏之后叫它一声 */
  if (typeof tpAttachBar === 'function') tpAttachBar(box);
}

function navHint(text) {
  var h = navEl('nv-hint');
  if (h) h.textContent = text;
}

function navTitle() {
  var t = navEl('nv-title');
  if (!t) return;
  var name = '';
  if (navHere) {
    for (var i = 0; i < NAV_POIS.length; i++) if (NAV_POIS[i][1] === navHere.idx) name = NAV_POIS[i][0];
    t.textContent = (name || ('地图 #' + navHere.idx)) + (navDest ? ' → ' + navDest.name : '');
  } else {
    t.textContent = '地图';
  }
}

/* 画：整张图 + 你 + 目的地 + 红线 */
function navDraw() {
  var cv = navEl('nv-canvas');
  if (!cv) return;
  var g = cv.getContext('2d');
  var cw = cv.width, ch = cv.height;
  g.fillStyle = '#0b1109';
  g.fillRect(0, 0, cw, ch);
  var atlas = navAtlas();
  if (!atlas || !navHere) {
    g.fillStyle = '#7d8a74'; g.font = 'bold 15px monospace'; g.textAlign = 'center';
    g.fillText(navAtlasBroken ? '这张卡带认不出来' : '还没进入游戏', cw / 2, ch / 2);
    g.textAlign = 'left';
    return;
  }
  var lay = atlas.layoutOf(navHere.idx);
  var img = navRenderMapCanvas(navHere.idx);
  if (!lay || !img) return;
  var W = lay.w * 16, H = lay.h * 16;
  var s = Math.min((cw - 8) / W, (ch - 8) / H);
  if (s > 4) s = 4;
  var ox = Math.round((cw - W * s) / 2), oy = Math.round((ch - H * s) / 2);
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0, W, H, ox, oy, Math.round(W * s), Math.round(H * s));

  function at(x, y) { return { x: ox + (x * 16 + 8) * s, y: oy + (y * 16 + 8) * s }; }

  /* 红线：只画当前这张图的那一段 */
  if (navPlan && navPlan.length) {
    g.lineWidth = Math.max(2, 2 * s);
    g.strokeStyle = 'rgba(0,0,0,.55)';
    g.beginPath();
    var seg = navPlan[0];
    var from = at(navHere.x, navHere.y);
    g.moveTo(from.x, from.y);
    for (var i = 0; i < seg.steps.length; i++) {
      var p = at(seg.steps[i].x, seg.steps[i].y);
      g.lineTo(p.x, p.y);
    }
    g.stroke();
    g.strokeStyle = '#e8263f';
    g.beginPath();
    g.moveTo(from.x, from.y);
    for (var j = 0; j < seg.steps.length; j++) {
      var q = at(seg.steps[j].x, seg.steps[j].y);
      g.lineTo(q.x, q.y);
    }
    g.stroke();
  }
  /* 目的地就在这张图上才画红旗；在别的图上，就标出这段路要从哪个口出去 */
  var flag = Math.max(8, Math.round(9 * Math.min(2, s)));
  function pin(x, y, color, label) {
    var d = at(x, y);
    g.fillStyle = '#111'; g.fillRect(d.x - 1, d.y - flag * 1.5, 2, flag * 1.6);
    g.fillStyle = color; g.fillRect(d.x + 1, d.y - flag * 1.5, flag, flag * 0.8);
    if (label) {
      g.fillStyle = '#0b1109'; g.font = 'bold ' + Math.round(flag * 0.7) + 'px monospace';
      g.textAlign = 'center'; g.fillText(label, d.x + 1 + flag / 2, d.y - flag * 0.86);
      g.textAlign = 'left';
    }
  }
  if (navDest && navDest.idx === navHere.idx) pin(navDest.x, navDest.y, '#e8263f', '');
  else if (navPlan && navPlan.length && navPlan[0].exit) pin(navPlan[0].exit.x, navPlan[0].exit.y, '#7fd08a', '出');
  /* 你：红方块，一闪一闪 */
  var me = at(navHere.x, navHere.y);
  var on = (navBlink % 2) === 0;
  g.fillStyle = '#0b1109'; g.fillRect(me.x - 5 * Math.min(1, s / 2) - 2, me.y - 5 * Math.min(1, s / 2) - 2,
    10 * Math.min(1, s / 2) + 4, 10 * Math.min(1, s / 2) + 4);
  g.fillStyle = on ? '#ff2d55' : '#ffb3c1';
  g.fillRect(me.x - 5 * Math.min(1, s / 2), me.y - 5 * Math.min(1, s / 2),
    10 * Math.min(1, s / 2), 10 * Math.min(1, s / 2));
  navTitle();
}

/* 点图上一格：吸附到最近能站的地方，算这条路怎么走 */
function navTap(ev) {
  var atlas = navAtlas();
  if (!atlas || !navHere) return;
  var cv = navEl('nv-canvas');
  var r = cv.getBoundingClientRect();
  var px = (ev.clientX - r.left) * (cv.width / r.width);
  var py = (ev.clientY - r.top) * (cv.height / r.height);
  var lay = atlas.layoutOf(navHere.idx);
  var W = lay.w * 16, H = lay.h * 16;
  var s = Math.min((cv.width - 8) / W, (cv.height - 8) / H);
  if (s > 4) s = 4;
  var ox = (cv.width - W * s) / 2, oy = (cv.height - H * s) / 2;
  var tx = Math.floor((px - ox) / (16 * s)), ty = Math.floor((py - oy) / (16 * s));
  if (tx < 0 || ty < 0 || tx >= lay.w || ty >= lay.h) return;
  var grid = atlas.costGrid(navHere.idx);
  var snap = moonSnapWalkable(grid, lay.w, lay.h, tx, ty, 6);
  if (!snap) { navHint('那一带走不过去'); return; }
  navDest = { idx: navHere.idx, x: snap.x, y: snap.y, name: '选点 ' + snap.x + ',' + snap.y };
  navPlan = moonPlan(atlas, navAdj() || [], navHere.idx, navHere.x, navHere.y, navDest.idx, navDest.x, navDest.y);
  navHint(navPlan ? ('这段 ' + navPlan[0].steps.length + ' 步') : '算不出路');
  navDraw();
  if (typeof mapRender === 'function') mapRender();
}

/* 从清单挑：目的地是另一张图，得先跨图 */
function navPickMap(idx, name) {
  var atlas = navAtlas();
  if (!atlas) return;
  var lay = atlas.layoutOf(idx);
  if (!lay) return;
  var grid = atlas.costGrid(idx);
  var snap = moonSnapWalkable(grid, lay.w, lay.h, Math.floor(lay.w / 2), Math.floor(lay.h / 2), 12);
  if (!snap) { navHint('那张图没有能站的地方'); return; }
  navDest = { idx: idx, x: snap.x, y: snap.y, name: name || ('地图 #' + idx) };
  if (!navHere) { navHint('还没认出现在在哪张图'); navDraw(); return; }
  var adj = navAdj();
  if (!adj) { navHint('这张卡带的编号对不上，只能在本图内导'); return; }
  navPlan = moonPlan(atlas, adj, navHere.idx, navHere.x, navHere.y, navDest.idx, navDest.x, navDest.y);
  if (!navPlan) { navHint('这条路走不过去（可能要冲浪或秘传技）'); navDraw(); return; }
  var total = 0;
  for (var i = 0; i < navPlan.length; i++) total += navPlan[i].steps.length;
  navHint('途经 ' + navPlan.length + ' 张图 · 约 ' + total + ' 步');
  navDraw();
  if (typeof mapRender === 'function') mapRender();
}

function navResize() {
  var cv = navEl('nv-canvas');
  var stage = cv && cv.parentNode;
  if (!cv || !stage) return;
  var r = stage.getBoundingClientRect();
  var w = Math.max(240, Math.round(r.width * 2)), h = Math.max(160, Math.round(r.height * 2));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
}
function navOpen() {
  navBuild();
  var box = navEl('nav-view');
  if (!box) return;
  box.hidden = false;
  navResize();
  navHint('正在认这是哪张图…');
  navDraw();
  if (typeof tpPaintBar === 'function') tpPaintBar();
  setTimeout(function () {
    var here = navIdentify();
    if (here) { navHere = here; navHint('点图上一格 = 定目的地'); }
    else navHint('读不到你的位置——还没进游戏，或者这张卡带里没有坐标表');
    navDraw();
  }, 30);
}
function navClose() {
  /* 正在瞬移就把手刹拉上：放大层一收，压暗层跟着看不见，留在那儿跑会让人以为卡死 */
  if (typeof tpState !== 'undefined' && tpState && typeof tpEnd === 'function') tpEnd('停下了');
  var box = navEl('nav-view');
  if (box) box.hidden = true;
  if (typeof mapRender === 'function') mapRender();
}

/* ── 小窗上的指引：缩回去也能看出往哪边走 ─────────────────────────────── */
function navDrawMini(g, toView, px, py) {
  if (!navPlan || !navPlan.length || !navHere) return;
  if (navPlan[0].idx !== navHere.idx) return;
  function toPage(t) { return toView(px + (t.x - navHere.x), py + (t.y - navHere.y)); }
  var steps = navPlan[0].steps;
  var n = Math.min(steps.length, 10);
  if (!n) return;
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4;
  g.beginPath();
  var a = toView(px, py);
  g.moveTo(a.x, a.y);
  for (var i = 0; i < n; i++) { var p = toPage(steps[i]); g.lineTo(p.x, p.y); }
  g.stroke();
  g.strokeStyle = '#e8263f'; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(a.x, a.y);
  for (var j = 0; j < n; j++) { var q = toPage(steps[j]); g.lineTo(q.x, q.y); }
  g.stroke();
  /* 终点画个小箭头 */
  var last = toPage(steps[n - 1]);
  g.fillStyle = '#e8263f';
  g.beginPath();
  g.moveTo(last.x, last.y - 4); g.lineTo(last.x + 4, last.y + 3); g.lineTo(last.x - 4, last.y + 3);
  g.closePath(); g.fill();
}

/* ── 一键走过去：脚本代按方向键，靠画面反馈确认真的动了 ───────────────── */
function navKeyDir(from, to) {
  if (to.x > from.x) return 'right';
  if (to.x < from.x) return 'left';
  if (to.y > from.y) return 'down';
  return 'up';
}
/* 按键代行：直接落在 coreKeys 上，不碰游戏数据 */
function coreSetKey(btn, down) {
  if (typeof core !== 'undefined' && core && typeof core.input === 'function') core.input(btn, down);
}
function navPress(dir, ms, done) {
  coreSetKey(dir, true);
  setTimeout(function () {
    coreSetKey(dir, false);
    if (done) done();
  }, ms);
}
function navPos() {
  try {
    var s = MOON_POCKET.map.state();
    if (s && s.page) return { x: s.page.x, y: s.page.y, pages: s.pages };
  } catch (e) {}
  return null;
}
function navWalkStart() {
  if (!navPlan || !navPlan.length) { navHint('先定个目的地'); return; }
  /* 正在瞬移就先把瞬移停了：两套代按不能同时按方向键 */
  if (typeof tpState !== 'undefined' && tpState && typeof tpEnd === 'function') tpEnd('停下了');
  if (navWalking) { navWalking = false; navHint('停下了'); return; }
  navWalking = true;
  navHint('跟着红线走…（再点一次「走过去」就停）');
  navWalkSegment(0);
}
function navWalkSegment(si) {
  if (!navWalking) return;
  var seg = navPlan[si];
  if (!seg) { navWalking = false; navHint('到了'); return; }
  var steps = seg.steps.slice();
  /* 同方向的连续几步合成一次长按，走路才不像抽筋 */
  var runs = [];
  var cur = { x: navHere ? navHere.x : steps.length ? steps[0].x : 0, y: navHere ? navHere.y : 0 };
  var i = 0;
  while (i < steps.length) {
    var dir = navKeyDir(cur, steps[i]);
    var n = 1;
    while (i + n < steps.length && navKeyDir(steps[i + n - 1], steps[i + n]) === dir) n++;
    runs.push({ dir: dir, n: n, to: steps[i + n - 1] });
    cur = steps[i + n - 1];
    i += n;
  }
  var ri = 0;
  function tick() {
    if (!navWalking) return;
    if (ri >= runs.length) {
      if (si + 1 < navPlan.length) {
        navHint('到下一张图了，等一下…');
        setTimeout(function () {
          if (!navWalking) return;
          var here = navIdentify();
          if (here) navHere = here;
          navWalkSegment(si + 1);
        }, 1400);
      } else { navWalking = false; navHint('到了'); }
      return;
    }
    var run = runs[ri];
    ri++;
    var before = navPos();
    navPress(run.dir, Math.min(1200, 170 * run.n + 90), function () {
      setTimeout(function () {
        if (!navWalking) return;
        var after = navPos();
        if (before && after) {
          var dx = after.x - before.x, dy = after.y - before.y;
          /* 只做宽松校验：方向对了就继续，明显没动就停 */
          if (dx === 0 && dy === 0 && run.n >= 2) {
            navWalking = false;
            navHint('前面被挡住了（可能有 NPC 或遇敌），停一下');
            return;
          }
          if (navHere) { navHere.x += dx; navHere.y += dy; }
        }
        tick();
      }, 200);
    });
  }
  tick();
}

/* ── 对外：给小地图窗口接上「点一下放大」 ─────────────────────────────── */
function navTestSetRom(bytes) { navRom = bytes; navRomLen = bytes.length; }
function navBindMini() {
  var cv = document.getElementById('mp-canvas');
  if (!cv || cv.__navBound) return;
  cv.__navBound = 1;
  cv.addEventListener('click', function (ev) { ev.preventDefault(); navOpen(); });
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', navBindMini);
  else navBindMini();
}
