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
function mapRender(){
  var g = mapViewCtx;
  if (!g) return;
  var vw = MAP_VIEW_W, vh = MAP_VIEW_H, T = MapCore.TILE;
  g.fillStyle = "#0a0f08"; g.fillRect(0, 0, vw, vh);
  var tr = mapTracker, page = tr && tr.page();
  if (!page){
    g.fillStyle = "#3c4736"; g.font = "bold 9px monospace"; g.textAlign = "center";
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
    g.drawImage(cv, Math.max(0, sx), Math.max(0, sy), drawW, drawH, clipX, clipY, drawW, drawH);
  }
  /* 格子线：极淡，只为看得清走过几格 */
  g.strokeStyle = "rgba(210,226,196,.08)"; g.lineWidth = 1; g.beginPath();
  for (var gx = (sx % T + T) % T; gx < vw; gx += T){ g.moveTo(gx + .5, 0); g.lineTo(gx + .5, vh); }
  for (var gy = (sy % T + T) % T; gy < vh; gy += T){ g.moveTo(0, gy + .5); g.lineTo(vw, gy + .5); }
  g.stroke();

  function toView(tx, ty){ return { x: tx * T + T / 2 - sx, y: ty * T + T / 2 - sy }; }
  function mark(pt, color, label){
    var v = toView(pt.x, pt.y);
    if (v.x < -8 || v.y < -8 || v.x > vw + 8 || v.y > vh + 8) return;
    g.fillStyle = "#0a0f08"; g.fillRect(v.x - 6, v.y - 6, 12, 12);
    g.fillStyle = color; g.fillRect(v.x - 5, v.y - 5, 10, 10);
    g.fillStyle = "#0a0f08"; g.font = "bold 8px monospace"; g.textAlign = "center";
    g.fillText(label, v.x, v.y + 3); g.textAlign = "left";
  }
  var same = page.entry && page.exit && page.entry.x === page.exit.x && page.entry.y === page.exit.y;
  if (page.entry) mark(page.entry, "#8fd08a", "入");
  if (page.exit && !same) mark(page.exit, "#e8b96a", "出");

  /* 你：一闪一闪的方块，外圈黑边保证在任何地形上都看得见 */
  var me = toView(px, py), cx = me.x, cy = me.y, on = (mapBlinks % 2) === 0;
  g.fillStyle = "#0a0f08"; g.fillRect(cx - 5, cy - 5, 10, 10);
  g.fillStyle = on ? "#ffffff" : "#ff86c2"; g.fillRect(cx - 3, cy - 3, 6, 6);
  g.fillStyle = "#0a0f08"; g.fillRect(cx - 1, cy - 1, 2, 2);
}

function mapUpdateChrome(){
  var tr = mapTracker, t = $("#mp-title"), page = tr && tr.page();
  if (t) t.textContent = "手绘地图 · 第 " + ((tr ? tr.pages().length : 0) || 1) + " 页";
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
