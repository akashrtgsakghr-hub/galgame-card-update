/* ═══════════════════════════════════════════════════════════════════════════
   ⑧ 小地图核心：靠画面拼地图（automap）

   为什么不是「读内存拿坐标」：
   ─ 44vba 只导出 4 个符号（1=ROM 2=存档 3=帧缓冲 4=金手指文本），没有 RAM 出口。
     要读玩家坐标，得先在 wasm 堆里认出 256KB 工作内存、再给每个改版重新标定存档结构，
     换个改版就全废。所以这里走另一条路：**不读内存，只读画面。**

   怎么做：
   ─ 玩家在地图上走路时，镜头始终把玩家摆在画面正中；站住时，画面正好落在 16px 的格线上。
   ─ 于是每「站定」一次，就把整帧按格对齐拼进一张大图；两张图对不对得上，用像素差算分。
   ─ 对不上、且连续几次都对不上、而且画面也没在动 → 换地图了 → 翻新的一页。

   这一片不碰 DOM：MapCore 是纯像素函数，Tracker 是状态机。
   node 里能用假帧跑回归（tools/verify-map.mjs），跑的就是线上同一份代码。
   ═══════════════════════════════════════════════════════════════════════════ */
var MapCore = (function(){
  var TILE = 16, FW = 240, FH = 160;
  /* 玩家立绘钉在画面正中，拼图时挖掉这一块，免得把小人的像素烙进地图里 */
  var HOLE = { x0: 110, x1: 130, y0: 54, y1: 90 };
  /* 底部留白：不少改版在屏幕最下面常驻一条 HUD（时间、背包、队伍），
     那条东西钉在屏幕上不跟着地图走，拼进去会糊成一团。少拼这一条，
     走两步就会被上面重画的内容补回来，不影响整张图。 */
  var CLIP_Y1 = 124;
  /* 玩家所在的那一格（画面正中） */
  var MID_X = 7, MID_Y = 5;

  function inHole(x, y){ return x >= HOLE.x0 && x < HOLE.x1 && y >= HOLE.y0 && y < HOLE.y1; }

  /* 一张空白图纸：tiles × tiles 格 */
  function blank(tiles){
    var w = tiles * TILE;
    return { w: w, h: w, tiles: tiles, data: new Uint8ClampedArray(w * w * 4) };
  }

  /* 把一帧贴到图纸的格坐标 (tx,ty)。图纸外的丢掉，玩家立绘那块挖空。 */
  function paste(sheet, frame, tx, ty){
    var sx = tx * TILE, sy = ty * TILE, W = sheet.w, H = sheet.h, d = sheet.data, n = 0;
    for (var y = 0; y < CLIP_Y1; y++){
      var dy = sy + y;
      if (dy < 0 || dy >= H) continue;
      var row = dy * W;
      for (var x = 0; x < FW; x++){
        if (inHole(x, y)) continue;
        var dx = sx + x;
        if (dx < 0 || dx >= W) continue;
        var si = (row + dx) * 4, fi = (y * FW + x) * 4;
        d[si] = frame[fi]; d[si + 1] = frame[fi + 1]; d[si + 2] = frame[fi + 2]; d[si + 3] = 255;
        n++;
      }
    }
    return n;
  }

  /* 一帧贴到 (tx,ty) 后和图纸已有像素差多少；重叠太少返回 null（新图纸第一次贴就是这样） */
  function score(sheet, frame, tx, ty){
    var sx = tx * TILE, sy = ty * TILE, W = sheet.w, H = sheet.h, d = sheet.data;
    var sum = 0, n = 0;
    for (var y = 4; y < CLIP_Y1 - 4; y += 4){
      var dy = sy + y;
      if (dy < 0 || dy >= H) continue;
      var row = dy * W;
      for (var x = 4; x < FW - 4; x += 4){
        if (inHole(x, y)) continue;
        var dx = sx + x;
        if (dx < 0 || dx >= W) continue;
        var si = (row + dx) * 4;
        if (d[si + 3] === 0) continue;              /* 这块还没画过 */
        var fi = (y * FW + x) * 4;
        sum += Math.abs(d[si] - frame[fi]) + Math.abs(d[si + 1] - frame[fi + 1]) + Math.abs(d[si + 2] - frame[fi + 2]);
        n++;
      }
    }
    if (n < 150) return null;
    return { avg: sum / (n * 3), n: n };
  }

  /* 在 (ox,oy) 周围 span 格内找最贴合的一格 */
  function findBest(sheet, frame, ox, oy, span){
    var best = null, second = 1e9;
    for (var dy = -span; dy <= span; dy++){
      for (var dx = -span; dx <= span; dx++){
        var r = score(sheet, frame, ox + dx, oy + dy);
        if (!r) continue;
        if (!best || r.avg < best.avg){
          if (best) second = Math.min(second, best.avg);
          best = { tx: ox + dx, ty: oy + dy, avg: r.avg, n: r.n };
        } else if (r.avg < second) second = r.avg;
      }
    }
    if (best) best.second = (second === 1e9) ? best.avg : second;
    return best;
  }

  /* 两帧差多少（0~1）。走路时整屏在滚，这个值会明显抬起来 */
  function motion(a, b){
    var diff = 0, n = 0;
    for (var i = 0; i < a.length; i += 16){
      n++;
      if (Math.abs(a[i] - b[i]) > 18 || Math.abs(a[i + 1] - b[i + 1]) > 18 || Math.abs(a[i + 2] - b[i + 2]) > 18) diff++;
    }
    return n ? diff / n : 0;
  }

  /* 这一帧该不该拼进地图？
     pale 高 → 白底菜单 / 渐白    dark 高 → 渐黑、黑场
     box  高 → 底部一整条同色 = 对话框    kinds 少 → 整屏没几种颜色，过场或纯色 */
  function stats(frame){
    var pale = 0, dark = 0, n = 0;
    var bandN = 0, bandSame = 0, br = -1, bg = -1, bb = -1;
    var seen = {}, kinds = 0;
    for (var y = 0; y < FH; y += 2){
      for (var x = 0; x < FW; x += 2){
        var i = (y * FW + x) * 4, r = frame[i], g = frame[i + 1], b = frame[i + 2];
        n++;
        if (r > 196 && g > 196 && b > 196) pale++;
        if (r + g + b < 96) dark++;
        if (y >= 118){
          bandN++;
          if (br < 0){ br = r; bg = g; bb = b; bandSame = 1; }
          else if (Math.abs(r - br) < 12 && Math.abs(g - bg) < 12 && Math.abs(b - bb) < 12) bandSame++;
        }
        var key = (r >> 5) + "," + (g >> 5) + "," + (b >> 5);
        if (!seen[key]){ seen[key] = 1; kinds++; }
      }
    }
    var box = bandN ? bandSame / bandN : 0;
    /* 只有「整条亮色」才算对话框：不少改版在屏幕底部常驻一条深色 HUD（时间、背包、队伍），
       那条也是整条同色，但它是暗的——按亮不亮分开，免得把它当成对话框、地图一张都画不出来。 */
    var boxLit = box > 0.62 && (br + bg + bb) > 480;
    return { pale: pale / n, dark: dark / n, box: box, boxLit: boxLit, kinds: kinds,
      ui: (pale / n) > 0.3 || (dark / n) > 0.72 || boxLit || kinds < 8 };
  }

  /* ── 状态机：一册地图，一页一张纸 ──────────────────────────────────────
     用法：var tr = MapCore.tracker({tiles:44}); tr.sample(frame) → "commit" / "newpage" / ...
     sample() 只吃帧、只管状态，画不画是 UI 的事。 */
  function tracker(opts){
    opts = opts || {};
    var tiles = opts.tiles || 44, cap = opts.cap || 3;
    var matchOk = opts.matchOk || 12, missLimit = opts.missLimit || 4;
    var stillGate = opts.motionGate == null ? 0.02 : opts.motionGate;
    var pages = [], page = null, cur = -1, miss = 0, cool = 0, prev = null;

    function blankPage(){
      var sheet = blank(tiles);
      return {
        sheet: sheet, cv: null,                        /* cv 由 UI 按需建 */
        /* 镜头左上角 = 玩家格 - (7,5)，开局把玩家摆在图纸正中 */
        ox: Math.floor(tiles / 2) - MID_X, oy: Math.floor(tiles / 2) - MID_Y,
        entry: null, exit: null, fresh: true, pastes: 0, moves: 0, pixels: 0
      };
    }

    function newPage(){
      /* 上一页一步都没走过（开场白、过场、菜单那种静止画面）：当它没发生过，
         不占页数、不留「出口」，免得地图册里全是没用的残页 */
      if (page && page.moves < 1){ pages.pop(); cur = pages.length - 1; }
      page = blankPage();
      pages.push(page);
      while (pages.length > cap) pages.shift();
      cur = pages.length - 1;
      miss = 0;
      cool = 16;                 /* 新地图先等 2 秒：躲开「地名横幅」飘出来的那一下 */
      return page;
    }

    function endPage(){
      if (!page) return;
      page.exit = { x: page.ox + MID_X, y: page.oy + MID_Y };
      if (!page.entry) page.entry = { x: page.exit.x, y: page.exit.y };
    }

    /* 快走到图纸边上时整张挪回中间，别把刚走的路顶出去 */
    function recenter(){
      var edge = 8, px = page.ox + MID_X, py = page.oy + MID_Y, dx = 0, dy = 0;
      if (px < edge) dx = edge - px; else if (px > tiles - edge) dx = (tiles - edge) - px;
      if (py < edge) dy = edge - py; else if (py > tiles - edge) dy = (tiles - edge) - py;
      if (!dx && !dy) return false;
      var s = page.sheet, shiftX = dx * TILE, shiftY = dy * TILE;
      var out = new Uint8ClampedArray(s.data.length);
      for (var y = 0; y < s.h; y++){
        var ty = y + shiftY;
        if (ty < 0 || ty >= s.h) continue;
        for (var x = 0; x < s.w; x++){
          var tx = x + shiftX;
          if (tx < 0 || tx >= s.w) continue;
          var si = (y * s.w + x) * 4, di = (ty * s.w + tx) * 4;
          out[di] = s.data[si]; out[di + 1] = s.data[si + 1];
          out[di + 2] = s.data[si + 2]; out[di + 3] = s.data[si + 3];
        }
      }
      s.data.set(out);
      /* 内容整体挪了 (dx,dy) 格，玩家和标记在图纸里的格子跟着一起挪 */
      page.ox += dx; page.oy += dy;
      if (page.entry){ page.entry.x += dx; page.entry.y += dy; }
      if (page.exit){ page.exit.x += dx; page.exit.y += dy; }
      return true;
    }

    function commit(frame, tx, ty){
      /* moves 只在「位置真的变了」时加：它代表玩家在这张图上走过一步，
         UI 拿它当「可以翻开了」的信号，免得在开场白、菜单那种静止画面上就弹窗 */
      if (tx !== page.ox || ty !== page.oy) page.moves++;
      page.pixels += paste(page.sheet, frame, tx, ty);
      page.ox = tx; page.oy = ty;
      page.fresh = false;
      page.pastes++;
      if (!page.entry) page.entry = { x: tx + MID_X, y: ty + MID_Y };
      return recenter();
    }

    function keep(frame){
      if (!prev) prev = new Uint8ClampedArray(frame.length);
      prev.set(frame);
    }

    return {
      pages: function(){ return pages; },
      page: function(){ return page; },
      index: function(){ return cur; },
      reset: function(){ pages = []; page = null; cur = -1; miss = 0; cool = 0; prev = null; },
      newPage: function(){ endPage(); return newPage(); },
      endPage: endPage,
      /* 喂一帧；返回这一帧干了什么，方便 UI 决定要不要重画 */
      sample: function(frame){
        if (!prev) prev = new Uint8ClampedArray(frame.length);
        var st = stats(frame);
        if (st.ui){ miss = 0; keep(frame); return "ui"; }
        if (!page){ newPage(); keep(frame); return "newpage"; }
        if (cool > 0){ cool--; keep(frame); return "cool"; }
        if (page.fresh){ commit(frame, page.ox, page.oy); keep(frame); return "commit"; }

        var best = findBest(page.sheet, frame, page.ox, page.oy, 2);
        if (best && best.avg <= matchOk){
          miss = 0;
          if (best.tx !== page.ox || best.ty !== page.oy){
            var shifted = commit(frame, best.tx, best.ty);
            keep(frame);
            return shifted ? "shift" : "commit";
          }
          page.pastes++;
          keep(frame);
          return "same";
        }
        /* 画面还在动（走路 / 滑步）时对不上是正常的：等它站定 */
        var moving = motion(prev, frame) > stillGate;
        keep(frame);
        if (moving) return "moving";
        miss++;
        if (miss >= missLimit){ endPage(); newPage(); return "newpage"; }
        return "miss";
      }
    };
  }

  return { TILE: TILE, FW: FW, FH: FH, CLIP_Y1: CLIP_Y1, MID_X: MID_X, MID_Y: MID_Y,
    blank: blank, paste: paste, score: score, findBest: findBest,
    motion: motion, stats: stats, inHole: inHole, tracker: tracker };
})();

/* node 里跑回归用；浏览器里 typeof module === "undefined"，这一行不执行 */
if (typeof module === "object" && module.exports) module.exports = MapCore;
