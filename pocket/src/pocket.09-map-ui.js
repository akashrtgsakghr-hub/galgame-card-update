/* ═══════════════════════════════════════════════════════════════════════════
   ⑨ 小地图：屏里左上角那扇窗

   ─ 妈妈开场塞的那张图，一开始是空的；你走到哪，它自己画到哪。
   ─ 进新地图（森林、洞窟、解谜层）自动翻新的一页，上一页最后落脚的地方标成「出口」。
   ─ 定位不读内存：算法与状态机都在 ⑧ pocket.08-map-core.js，这里只管取帧、画、交互。
   ═══════════════════════════════════════════════════════════════════════════ */
var MAP_TILES = 44;                  /* 一页图纸 44×44 格（704×704 像素） */
var MAP_SAMPLE_MS = 110;             /* 取帧间隔：约 9 次/秒，够用又不抢帧 */
var MAP_VIEW_W = 192, MAP_VIEW_H = 144;   /* 小窗画布：12×9 格，1:1 像素 */
/* 视野往上偏 2 格：底部那条 36px 是 HUD，本来就没拼进图纸，
   把小窗往上挪一挪，既避开黑边，也正好多看点「前面」 */
var MAP_VIEW_UP = 2;

var mapTracker = null, mapOpen = false, mapAuto = true, mapFolded = false;
var mapLastSample = 0, mapBlinks = 0;
var mapViewCv = null, mapViewCtx = null;

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
    if (!mapOpen && mapAuto && pg && pg.moves >= 1){
      mapShow(true);
      if (LS.getItem(FLAG_PREFIX + "map-note") !== "1") mapShowNote();
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
  return mapFeed(mapFrameCopy);
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
function mapRender(){
  var g = mapViewCtx;
  if (!g) return;
  var vw = MAP_VIEW_W, vh = MAP_VIEW_H, T = MapCore.TILE;
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
  if (t) t.textContent = "手绘地图";
  if (p) p.textContent = Math.max(1, pages.indexOf(page) + 1) + "/" + Math.max(1, pages.length);
  var host = $("#map-panel");
  if (host) host.classList.toggle("is-empty", !page || page.pastes < 2);
}

/* ── 交互 ─────────────────────────────────────────────────────────────── */
function mapShow(silent){
  var host = $("#map-panel");
  if (!host) return;
  host.hidden = false; mapOpen = true;
  var b = $("#emu-map"); if (b) b.setAttribute("aria-pressed", "true");
  mapRender();
  if (!silent) toast("小地图 · 走过的地方会自己画出来");
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
mapViewCtx = mapViewCv ? mapViewCv.getContext("2d") : null;
if ($("#mp-auto")) $("#mp-auto").checked = mapAuto;
mapUpdateChrome();
mapRender();

/* 取帧循环：自己一条 rAF，不挤在核心帧循环里；错了也只丢一帧，不连累游戏 */
(function mapLoop(ts){
  requestAnimationFrame(mapLoop);
  if (!ts || ts - mapLastSample < MAP_SAMPLE_MS) return;
  mapLastSample = ts;
  try { mapSample(); } catch (e) { /* 吞掉：地图坏一帧不该把卡带带崩 */ }
  if (mapOpen){
    mapBlinks++;
    if (mapBlinks % 8 === 0) mapRender();      /* 只有「你」那个点需要重画 */
  }
})(0);
