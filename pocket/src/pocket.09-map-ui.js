/* ═══════════════════════════════════════════════════════════════════════════
   ⑨ 小地图：屏里左上角那扇窗

   ─ 妈妈开场塞的那张图，一开始是空的；你走到哪，它自己画到哪。
   ─ 进新地图（森林、洞窟、解谜层）自动翻新的一页，上一页最后落脚的地方标成「出口」。
   ─ 定位不读内存：算法与状态机都在 ⑧ pocket.08-map-core.js，这里只管取帧、画、交互。
   ═══════════════════════════════════════════════════════════════════════════ */
var MAP_TILES = 44;                  /* 一页图纸 44×44 格（704×704 像素） */
var MAP_SAMPLE_MS = 110;             /* 取帧间隔：约 9 次/秒，够用又不抢帧 */
/* 小窗画布：原来是 192×144（12×9 格），占掉屏幕近三成，玩家嫌挡视野——
   它只是「我在图上哪儿」的角标，要看清楚点击画面会开全屏整图，
   所以缩到窗口实际宽度的 1/4 屏上下（桌面约 128×96，面积只剩四成）。
   尺寸不写死：窗宽由 CSS 定（跟着屏幕缩放），画布按窗宽 1:1 重设，
   这样在任何屏幕尺寸下都是硬像素、不糊。 */
var MAP_VIEW_W = 128, MAP_VIEW_H = 96;   /* 兜底尺寸，实际以 mapFit() 量出来的为准 */
/* 视野往上偏 2 格：底部那条 36px 是 HUD，本来就没拼进图纸，
   把小窗往上挪一挪，既避开黑边，也正好多看点「前面」 */
var MAP_VIEW_UP = 2;

var mapTracker = null, mapOpen = false, mapAuto = true, mapFolded = false;
var mapAtlasMode = false;   /* true = 正在用卡带直出的整图，不是手绘拼贴 */
var mapLastSample = 0, mapBlinks = 0;
var mapViewCv = null, mapViewCtx = null;

/* 小窗默认就摆在屏幕上（不用先点一次），所以「该不该重画」看的是它可不可见，
   不是 mapOpen——那个说的是玩家有没有手动展开过。 */
function mapVisible(){
  var h = $("#map-panel");
  return !!(h && !h.hidden);
}

/* 画布尺寸跟着窗口走：窗宽由 CSS 决定（窄屏会缩），这里把画布重设成同样的像素数，
   保持 1:1 —— 缩放会让硬像素地图变糊，也会让「你」那个方块变形。
   高度按 4:3 走，跟 GBA 屏幕同比例。 */
var mapFitW = 0, mapFitH = 0;
function mapFit(){
  var host = $("#map-panel");
  var w = host ? Math.round(host.clientWidth) : 0;
  if (w < 80) w = MAP_VIEW_W;                       /* 窗还没显示（clientWidth 为 0）时用兜底 */
  if (w > 192) w = 192;
  var h = Math.round(w * 0.75);
  if (w !== mapFitW || h !== mapFitH){
    mapFitW = w; mapFitH = h;
    if (mapViewCv){
      mapViewCv.width = w; mapViewCv.height = h;    /* 重设尺寸会清空画布，下一帧会重画 */
      mapViewCtx = mapViewCv.getContext("2d");
    }
  }
  return { w: mapFitW, h: mapFitH };
}

function mapPrefsLoad(){ mapAuto = LS.getItem(FLAG_PREFIX + "map-auto") !== "0"; }
function mapPrefsSave(){ LS.setItem(FLAG_PREFIX + "map-auto", mapAuto ? "1" : "0"); }

/* 取帧缓冲：核心把画面放在 wasm 里，先复制一份再交给状态机，免得读到写了一半的帧 */
var mapFrameCopy = null;

function mapInit(){
  if (!mapTracker) mapTracker = MapCore.tracker({ tiles: MAP_TILES, cap: 3 });
  return mapTracker;
}

/* 图纸的离屏画布：一页一张，第一次要画时才建，旧页跟着丢掉 */
function mapSheetCanvas(page){
  if (!page.cv){
    page.cv = document.createElement("canvas");
    page.cv.width = page.sheet.w;
    page.cv.height = page.sheet.h;
    page.cv.getContext("2d").putImageData(new ImageData(page.sheet.data, page.sheet.w, page.sheet.h), 0, 0);
  }
  return page.cv;
}
function mapSyncSheet(page){
  if (!page || !page.cv) return;
  page.cv.getContext("2d").putImageData(new ImageData(page.sheet.data, page.sheet.w, page.sheet.h), 0, 0);
}

/* ── 取帧 ─────────────────────────────────────────────────────────────── */
/* 喂一帧给状态机并刷新界面。正常走 mapSample()，调试/联调用 mapFeed() 直接塞帧。 */
function mapFeed(frame){
  var tr = mapInit();
  var ev = tr.sample(frame);
  if (ev === "commit" || ev === "shift"){
    var pg = tr.page();
    mapSyncSheet(pg);
    mapUpdateChrome();
    /* 真的在这张图上走过一步，才自动翻开——开场白、菜单那种静止画面不该弹窗 */
    if (!mapOpen && mapAuto && ((pg && pg.moves >= 1)
        || (typeof navMemLocate === "function" && navMemLocate()))){
      mapShow(true);
    } else if (mapOpen) mapRender();
  } else if (ev === "newpage"){
    mapUpdateChrome();
    if (mapOpen) mapRender();
  }
  return ev;
}

function mapSample(){
  if (!coreBooted || corePaused || !coreModule || !coreImageData) return;
  if (!layers.core || layers.core.hidden) return;
  var src = coreImageData.data;
  if (!mapFrameCopy) mapFrameCopy = new Uint8ClampedArray(src.length);
  mapFrameCopy.set(src);
  var ev = mapFeed(mapFrameCopy);
  /* 全图模式的位置是从存档读的，跟「画面有没有变」无关：骑乘时玩家在走、画面被
     坐骑盖住，走到新一格也未必触发 commit。窗开着就按采样节奏重画，
     不然玩家标记会一直停在第一次画上去的地方。 */
  if (mapVisible()) mapRender();
  return ev;
}

/* ── 画：小窗里只显示玩家周围 12×9 格 ─────────────────────────────────── */
/* 地图内部保留抓下来的原始彩色（GBA 那套绿、米白、山灰），只有窗框是黑粉像素。
   曾经整块压成「暗梅紫→浅粉」双色，等于把彩色地图洗成粉照——用户否掉了。
   想再看粉墨版：MAP_TINT 改 true。

   这一段只做两件事：可选的双色映射，以及补 alpha=0 的像素。
   ─ 玩家立绘挖的洞（左右都够近）：抄正下方那一行（已经从下往上解析过），
     等于把人站过的地方往下「抹」一下，出来是一条干净的地面延伸，不会有竖条纹。
   ─ 没走过的空地（一侧离得很远）：填深色纸，看着像还没画到的地方。
   补洞为什么能往下抄：这一遍是从最底下一行往上走的，处理到某一行时，
   下面那一行要么本身是实心地形，要么已经被补好了。 */
var MAP_TINT = false;
var mapRowL = null, mapRowR = null;
function mapTintView(g, x, y, w, h){
  var img;
  try { img = g.getImageData(x, y, w, h); } catch (e) { return; }
  var d = img.data;
  if (!mapRowL || mapRowL.length < w){ mapRowL = new Int32Array(w); mapRowR = new Int32Array(w); }
  var L = mapRowL, R = mapRowR, paper = [26, 18, 26], rowStep = w * 4;

  /* 一行一行来，从最底下往上：处理到某一行时，下面那一行已经处理完了，
     补洞可以直接抄正下方。L / R 是单行数组，必须在同一行里算完就用掉——
     先整张图算 L、再整张图算 R，第二轮会把第一轮的结果覆盖成最后一行。 */
  for (var ry = h - 1; ry >= 0; ry--){
    var base = ry * w * 4;
    /* ① 正着走：实心像素（可选）重映射，记下左边最近的实心像素 */
    var lastL = -1;
    for (var cx = 0; cx < w; cx++){
      var i = base + cx * 4;
      if (d[i + 3] >= 8){
        if (MAP_TINT){
          var l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          var t = Math.pow(l, 0.72);
          d[i]     = 14 + t * 241;
          d[i + 1] = 8  + t * 168;
          d[i + 2] = 16 + t * 204;
        }
        d[i + 3] = 255;
        lastL = i;
      }
      L[cx] = lastL;
    }
    /* ② 倒着走：记下右边最近的实心像素 */
    var lastR = -1;
    for (var rx = w - 1; rx >= 0; rx--){
      var i2 = base + rx * 4;
      if (d[i2 + 3] >= 8) lastR = i2;
      R[rx] = lastR;
    }
    /* ③ 补这一行的洞 */
    for (var cx3 = 0; cx3 < w; cx3++){
      var ci = base + cx3 * 4;
      if (d[ci + 3] >= 8) continue;
      var li = L[cx3], ri = R[cx3];
      /* 左右都够近才算「洞」；一侧很远说明是没走过的空地，
         硬插值会从最近的实心像素一路拉过去，拖出一道几十像素的糊带。 */
      var lDist = li >= 0 ? cx3 - (li - base) / 4 : 1e9;
      var rDist = ri >= 0 ? (ri - base) / 4 - cx3 : 1e9;
      if (lDist > 40 || rDist > 40){
        d[ci] = paper[0]; d[ci + 1] = paper[1]; d[ci + 2] = paper[2];
      } else {
        var below = ci + rowStep;
        if (ry + 1 < h && d[below + 3] >= 8){
          d[ci] = d[below]; d[ci + 1] = d[below + 1]; d[ci + 2] = d[below + 2];
        } else if (li >= 0 && ri >= 0){
          var k = lDist / (lDist + rDist);
          d[ci]     = d[li]     + (d[ri]     - d[li])     * k;
          d[ci + 1] = d[li + 1] + (d[ri + 1] - d[li + 1]) * k;
          d[ci + 2] = d[li + 2] + (d[ri + 2] - d[li + 2]) * k;
        } else {
          d[ci] = paper[0]; d[ci + 1] = paper[1]; d[ci + 2] = paper[2];
        }
      }
      d[ci + 3] = 255;
    }
  }
  g.putImageData(img, x, y);
}
/* 取图纸上一块，放到临时画布上再处理。
   为什么要多这一层：透明像素（玩家立绘的洞、没走过的格子）必须在 alpha 通道上认出来，
   直接画到可见画布上时底色不透明，alpha 一律 255，就再也分不出「没数据」和「黑色地形」了。 */
var mapRegionCv = null, mapRegionCtx = null;
function mapRegion(sx, sy, w, h){
  if (!mapRegionCv){
    mapRegionCv = document.createElement("canvas");
    mapRegionCtx = mapRegionCv.getContext("2d");
  }
  if (mapRegionCv.width !== w || mapRegionCv.height !== h){
    mapRegionCv.width = w; mapRegionCv.height = h;
  }
  mapRegionCtx.clearRect(0, 0, w, h);
  mapRegionCtx.imageSmoothingEnabled = false;
  mapRegionCtx.drawImage(mapSheetCanvas(mapTracker.page()), sx, sy, w, h, 0, 0, w, h);
  return mapRegionCv;
}
/* ── 卡带直出地图：整张图 + 玩家点 ──────────────────────────────────────
   以前这扇窗是「你走到哪，它画到哪」——玩家得自己把路走一遍才有图，
   没去过的地方永远是空的。

   现在直接问卡带：坐标从存档读（见 ⑬ navMemLocate），地形从 ROM 的
   metatile 表渲染（navRenderMapCanvas）——整张图一次画全，一格不差，
   也不用等玩家先走过。玩家位置仍用原来那个闪烁方块表示。 */
function mapRenderAtlas(g, vw, vh, mem) {
  var img = navRenderMapCanvas(mem.idx);
  var atlas = navAtlas();
  var lay = atlas && atlas.layoutOf(mem.idx);
  if (!img || !lay) return false;
  var W = lay.w * 16, H = lay.h * 16;
  if (!W || !H) return false;
  var s = Math.min(vw / W, vh / H);
  var ox = Math.round((vw - W * s) / 2), oy = Math.round((vh - H * s) / 2);
  g.fillStyle = "#0b060d"; g.fillRect(0, 0, vw, vh);
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0, W, H, ox, oy, Math.round(W * s), Math.round(H * s));

  /* 你：沿用原来的闪烁方块。地图缩得越小，方块越不能跟着缩——
     缩到 0.2 倍时 6px 只剩 1px，玩家根本找不到自己。 */
  var cx = ox + (mem.x * 16 + 8) * s, cy = oy + (mem.y * 16 + 8) * s;
  var on = (mapBlinks % 2) === 0;
  g.fillStyle = "#0b060d"; g.fillRect(cx - 4, cy - 4, 8, 8);
  g.fillStyle = on ? "#ffffff" : "#ff86c2"; g.fillRect(cx - 3, cy - 3, 6, 6);

  /* 缩得太狠时给个外圈，让它在一堆地形里跳出来 */
  if (s < 0.6) {
    g.strokeStyle = on ? "rgba(255,255,255,.55)" : "rgba(255,134,194,.55)";
    g.lineWidth = 1;
    g.strokeRect(cx - 5.5, cy - 5.5, 11, 11);
  }
  return true;
}

function mapRender(){
  var g = mapViewCtx;
  var D = window.__mapDbg || (window.__mapDbg = { calls: 0, mem: 0, img: 0, g: 0, open: 0 });
  D.calls++; D.open = mapOpen ? 1 : 0;
  if (!g) return;
  D.g = 1;
  var dims = mapFit();
  var vw = dims.w, vh = dims.h, T = MapCore.TILE;

  /* 首选：卡带直出整图。读不到存档（还没进游戏）才退回手绘 */
  if (typeof navMemLocate === "function" && typeof navRenderMapCanvas === "function") {
    try {
      var mem = navMemLocate();
      if (mem) D.mem++;
      if (mem && mapRenderAtlas(g, vw, vh, mem)) {
        var wasAtlas = mapAtlasMode;
        mapAtlasMode = true;
        D.img++;
        /* 标题/页码按模式变，切换的那一次要跟着改，否则写着「手绘地图」却画着全图 */
        if (!wasAtlas) mapUpdateChrome();
        return;
      }
    } catch (e) { try { window.__mapRenderErr = String(e && e.message || e); } catch (e2) {} }
  }
  mapAtlasMode = false;
  g.fillStyle = "#0b060d"; g.fillRect(0, 0, vw, vh);
  var tr = mapTracker, page = tr && tr.page();
  if (!page){
    g.fillStyle = "rgba(255,196,224,.5)"; g.font = "bold 9px monospace"; g.textAlign = "center";
    g.fillText("还没开始绘制", vw / 2, vh / 2);
    g.textAlign = "left";
    return;
  }
  var px = page.ox + MapCore.MID_X, py = page.oy + MapCore.MID_Y;
  /* 小窗左上角对应的图纸像素 */
  var sx = px * T + T / 2 - vw / 2, sy = py * T + T / 2 - vh / 2 - MAP_VIEW_UP * T;
  var cv = mapSheetCanvas(page);
  g.imageSmoothingEnabled = false;
  /* 图纸边缘之外留黑：越界那块裁掉 */
  var clipX = Math.max(0, -sx), clipY = Math.max(0, -sy);
  var drawW = Math.min(vw - clipX, cv.width - Math.max(0, sx));
  var drawH = Math.min(vh - clipY, cv.height - Math.max(0, sy));
  if (drawW > 0 && drawH > 0){
    var region = mapRegion(Math.max(0, sx), Math.max(0, sy), drawW, drawH);
    mapTintView(mapRegionCtx, 0, 0, drawW, drawH);     /* 在临时画布上改：能读到 alpha */
    g.drawImage(region, clipX, clipY);
  }
  /* 不再画格子线：4px 横竖线压在 2:1 的真实画面上，远看像屏花了。
     走过几格靠地形本身的边界看，够用。 */

  function toView(tx, ty){ return { x: tx * T + T / 2 - sx, y: ty * T + T / 2 - sy }; }
  function mark(pt, color, label){
    var v = toView(pt.x, pt.y);
    if (v.x < -8 || v.y < -8 || v.x > vw + 8 || v.y > vh + 8) return;
    g.fillStyle = "#0b060d"; g.fillRect(v.x - 6, v.y - 6, 12, 12);
    g.fillStyle = color; g.fillRect(v.x - 5, v.y - 5, 10, 10);
    g.fillStyle = "#0b060d"; g.font = "bold 8px monospace"; g.textAlign = "center";
    g.fillText(label, v.x, v.y + 3); g.textAlign = "left";
  }
  var same = page.entry && page.exit && page.entry.x === page.exit.x && page.entry.y === page.exit.y;
  if (page.entry) mark(page.entry, "#8fd08a", "入");
  if (page.exit && !same) mark(page.exit, "#e8b96a", "出");

  /* 导航中的红线：缩成小窗也看得出往哪边走 */
  if (typeof navDrawMini === "function") navDrawMini(g, toView, px, py);

  /* 你：一闪一闪的方块。外圈一圈深色保证在任何地形上都跳出来；
     方块本身不做内孔——之前中间挖了个 2×2，缩到小窗里就像个纸箱。 */
  var me = toView(px, py), cx = me.x, cy = me.y, on = (mapBlinks % 2) === 0;
  g.fillStyle = "#0b060d"; g.fillRect(cx - 4, cy - 4, 8, 8);
  g.fillStyle = on ? "#ffffff" : "#ff86c2"; g.fillRect(cx - 3, cy - 3, 6, 6);
}

function mapUpdateChrome(){
  var tr = mapTracker, t = $("#mp-title"), p = $("#mp-page"), page = tr && tr.page();
  var pages = (tr && tr.pages()) || [];
  /* 标题只写名字，页码单独占右边一格：以前「手绘地图 · 第 2 页」挤在 100px 里被截成省略号 */
  if (t) t.textContent = mapAtlasMode ? "地图 · 全图" : "手绘地图";
  if (p) p.textContent = mapAtlasMode ? "整张" : (Math.max(1, pages.indexOf(page) + 1) + "/" + Math.max(1, pages.length));
  var host = $("#map-panel");
  if (host) {
    host.classList.toggle("is-empty", !mapAtlasMode && (!page || page.pastes < 2));
    /* 全图模式下没有「入/出」这回事（那是手绘分页的概念），别在图例里误导 */
    host.classList.toggle("is-atlas", mapAtlasMode);
  }
}

/* ── 交互 ─────────────────────────────────────────────────────────────── */
function mapShow(silent){
  var host = $("#map-panel");
  if (!host) return;
  host.hidden = false; mapOpen = true;
  var b = $("#emu-map"); if (b) b.setAttribute("aria-pressed", "true");
  mapRender();
  if (!silent) toast(mapAtlasMode ? "小地图 · 整张图，点一下能摊开" : "小地图 · 走过的地方会自己画出来");
  /* 便条只在玩家自己点开那一次弹，自动亮出来的这一下不打断视线 */
  if (!silent && LS.getItem(FLAG_PREFIX + "map-note") !== "1") mapShowNote();
}
function mapHide(){
  var host = $("#map-panel");
  if (host) host.hidden = true;
  mapOpen = false;
  var b = $("#emu-map"); if (b) b.setAttribute("aria-pressed", "false");
}
function mapToggle(){ if (mapOpen) mapHide(); else mapShow(); }
function mapFold(){
  mapFolded = !mapFolded;
  var host = $("#map-panel"), b = $("#mp-fold");
  if (host) host.classList.toggle("is-shut", mapFolded);
  if (b) b.textContent = mapFolded ? "+" : "–";
  if (!mapFolded) mapRender();
}
function mapReset(){
  if (mapTracker) mapTracker.reset();
  mapFrameCopy = null;
  /* 换一张卡带 = 换一张地图册：上次那张 ROM 的字节和坐标表地址都不能再用，
     否则会拿新卡带的坐标去查旧卡带的地图。 */
  if (typeof navForgetRom === "function") navForgetRom();
  mapHide();
  mapUpdateChrome();
  mapRender();
}
function mapShowNote(){ var n = $("#mp-note"); if (n) n.hidden = false; }

if ($("#emu-map")) $("#emu-map").addEventListener("click", mapToggle);
if ($("#mp-fold")) $("#mp-fold").addEventListener("click", mapFold);
if ($("#mp-again")) $("#mp-again").addEventListener("click", function(){
  mapInit().newPage();
  mapUpdateChrome(); mapRender();
  toast("换了一张白纸，从脚下重新画");
});
if ($("#mp-note-ok")) $("#mp-note-ok").addEventListener("click", function(){
  var n = $("#mp-note"); if (n) n.hidden = true;
  LS.setItem(FLAG_PREFIX + "map-note", "1");
});
if ($("#mp-auto")) $("#mp-auto").addEventListener("change", function(){
  mapAuto = !!this.checked; mapPrefsSave();
});

mapPrefsLoad();
mapViewCv = $("#mp-canvas");
mapFit();
mapViewCtx = mapViewCv ? mapViewCv.getContext("2d") : null;
if ($("#mp-auto")) $("#mp-auto").checked = mapAuto;
mapUpdateChrome();
mapRender();

/* 窗宽变了（换窗口大小 / 手机转屏）就重设画布，否则会糊 */
var mapResizeTimer = 0;
window.addEventListener("resize", function(){
  clearTimeout(mapResizeTimer);
  mapResizeTimer = setTimeout(function(){ mapFit(); mapRender(); }, 180);
});

/* 取帧循环：自己一条 rAF，不挤在核心帧循环里；错了也只丢一帧，不连累游戏 */
(function mapLoop(ts){
  requestAnimationFrame(mapLoop);
  if (!ts || ts - mapLastSample < MAP_SAMPLE_MS) return;
  mapLastSample = ts;
  try { mapSample(); } catch (e) { /* 吞掉：地图坏一帧不该把卡带带崩 */ }
  if (mapVisible()){
    mapBlinks++;
    if (mapBlinks % 8 === 0) mapRender();      /* 「你」那个点在闪，隔一会儿重画一次 */
  }
})(0);
