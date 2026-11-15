/* ── 卡带地图图集 ────────────────────────────────────────────────────────
   把 ROM 里的「地图 → 通行性 → 地形 → 传送点 → 相邻图」读成内存里的表。
   全部按文件偏移读，不碰 DOM、不依赖模拟器，node 里可以直接跑回归。

   依据（都对过真实卡带）：
   · MapHeader 0x1C 字节，地图头在 ROM 里是一条扁平的指针数组，
     顺序 = (地图组, 组内序号)，官方 518 张，逐张尺寸与反编译工程 100% 一致。
   · MapLayout：s32 w, s32 h, u16* border, u16* map, Tileset* 主, Tileset* 副
   · 每格 u16：bit0-9 元瓦片号，bit10-11 碰撞（1 = 走不过去），bit12-15 高度
   · Tileset 结构 +16 指向元瓦片属性表，u16/条，低 8 位是地形行为
   ────────────────────────────────────────────────────────────────────── */

/* 官方绿宝石 34 个地图组各有多少张（累加 = 518）。用来自 (组,序) 反推扁平下标。
   别的 ROM 若张数对不上，crossMap 会自己降级成「只在本图内导航」。 */
var MOON_MAP_GROUP_COUNTS = [57, 5, 5, 6, 7, 8, 9, 7, 7, 14, 8, 17, 10, 23, 13, 15, 15,
  2, 2, 2, 3, 1, 1, 1, 108, 61, 89, 2, 1, 13, 1, 1, 3, 1];

/* 地形 → 走路代价。0 = 走不过去；数字越大越不想走。
   取值来自 include/constants/metatile_behaviors.h（绿宝石全版本通用）。 */
var MOON_BEHAVIOR_COST = (function () {
  var t = new Uint8Array(256);
  for (var i = 0; i < 256; i++) t[i] = 1;          // 默认：普通地面
  t[1] = 0;                                        // 秘密基地墙
  t[2] = 2; t[7] = 2;                              // 高草 / 矮草：能走，但会遇敌
  t[3] = 3; t[9] = 3; t[36] = 3;                   // 长草 / 草边 / 火山灰草
  t[6] = 2; t[33] = 2;                             // 深沙 / 沙地
  t[8] = 1;                                        // 洞窟地面
  t[32] = 1; t[38] = 1; t[39] = 1;                 // 冰面（滑，但还是一步）
  /* 水面：没有冲浪就是墙。等以后接了秘传技再放开 */
  [16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 34, 35, 42].forEach(function (k) { t[k] = 0; });
  /* 单向坎 / 跳崖 / 四面不可通：要「跳一下」，算交互，直接不走 */
  for (var k = 48; k <= 63; k++) t[k] = 0;
  return t;
})();

function makeRomAtlas(bytes) {
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  var N = bytes.length;

  function u8(o) { return (o >= 0 && o < N) ? bytes[o] : 0; }
  function u16(o) { return (o >= 0 && o + 2 <= N) ? dv.getUint16(o, true) : 0; }
  function u32(o) { return (o >= 0 && o + 4 <= N) ? dv.getUint32(o, true) : 0; }
  function i32(o) { return (o >= 0 && o + 4 <= N) ? dv.getInt32(o, true) : 0; }
  function inRom(p) { return p >= 0x08000000 && p < 0x08000000 + N; }
  function off(p) { return p - 0x08000000; }

  /* 一条 MapHeader 是否成立：布局的宽高和地图块都得落在卡带里 */
  function looksHeader(p) {
    if (!inRom(p)) return false;
    var o = off(p);
    if (o + 0x1c > N) return false;
    if (!inRom(u32(o))) return false;
    var L = off(u32(o));
    var w = u32(L), h = u32(L + 4);
    if (w < 1 || w > 400 || h < 1 || h > 400) return false;
    var mp = u32(L + 12);
    if (!inRom(mp) || off(mp) + w * h * 2 > N) return false;
    return inRom(u32(L + 16)) && inRom(u32(L + 20));
  }

  /* 找那条扁平的地图头数组：先找一长串「都指向卡带里」的字，再逐条验。
     直接全量验太慢（32MB/4 = 800 万字），所以先按指针连续性粗筛。 */
  var hdrStart = -1, hdrEnd = -1;
  var runStart = -1;
  for (var o = 0; o + 4 <= N; o += 4) {
    var v = u32(o);
    var isPtr = v >= 0x08000000 && v < 0x08000000 + N;
    if (isPtr) {
      if (runStart < 0) runStart = o;
      continue;
    }
    if (runStart >= 0 && (o - runStart) / 4 >= 48) {
      /* 这一段够长，从中间取一条验证；成立就认为找到了地图头数组 */
      var probe = runStart + Math.floor(((o - runStart) / 4) / 2) * 4;
      if (looksHeader(u32(probe))) {
        var a = runStart;
        while (a >= 4 && looksHeader(u32(a - 4))) a -= 4;
        var b = o;
        while (b + 4 <= N && looksHeader(u32(b))) b += 4;
        if ((b - a) / 4 >= 48) { hdrStart = a; hdrEnd = b; break; }
      }
    }
    runStart = -1;
  }
  if (hdrStart < 0) return null;

  /* 粗扫出来的这一段可能把数组后面紧邻的别的指针也吞进来（真卡带上就多吞了 34 个）。
     用「相邻图是否互指」来定窗口：对的窗口里，A 连到 B，B 多半也连回 A；
     错位一格，互指率立刻塌下去。 */
  var runList = [];
  for (var ri = hdrStart; ri < hdrEnd; ri += 4) runList.push(off(u32(ri)));

  var groupOff = [];
  var totalMaps = 0;
  (function () {
    var acc = 0;
    for (var k = 0; k < MOON_MAP_GROUP_COUNTS.length; k++) { groupOff.push(acc); acc += MOON_MAP_GROUP_COUNTS[k]; }
    totalMaps = acc;
  })();

  function invIndex(idx) {
    for (var g = groupOff.length - 1; g >= 0; g--) {
      if (idx >= groupOff[g]) return { g: g, n: idx - groupOff[g] };
    }
    return null;
  }
  function indexOfIn(base, g, n) {
    if (g < 0 || g >= groupOff.length) return -1;
    if (n < 0 || n >= MOON_MAP_GROUP_COUNTS[g]) return -1;
    var i = groupOff[g] + n;
    return i < base ? -1 : i;
  }
  /* 用一条地图头偏移读它的相邻图（不依赖 headers 数组，窗口还没定） */
  function connsAt(h) {
    var co = off(u32(h + 12));
    if (!co) return [];
    var cnt = i32(co), cp = u32(co + 4);
    if (cnt <= 0 || cnt > 8 || !inRom(cp)) return [];
    var out = [];
    for (var k = 0; k < cnt; k++) {
      var q = off(cp) + k * 12;
      out.push({ g: u8(q + 8), n: u8(q + 9) });
    }
    return out;
  }
  function reciprocity(start) {
    var hit = 0, tot = 0;
    for (var i = 0; i < totalMaps; i++) {
      var h = runList[start + i];
      if (h === undefined) return -1;
      var me = invIndex(i);
      var cs = connsAt(h);
      for (var k = 0; k < cs.length; k++) {
        tot++;
        var j = indexOfIn(start, cs[k].g, cs[k].n);
        if (j < 0) continue;
        var back = connsAt(runList[j]);
        for (var b = 0; b < back.length; b++) {
          if (back[b].g === me.g && back[b].n === me.n) { hit++; break; }
        }
      }
    }
    return tot ? hit / tot : 0;
  }

  var winStart = 0;
  var runLen = runList.length;
  if (runLen > totalMaps) {
    var bestScore = -1;
    for (var ws = 0; ws + totalMaps <= runLen; ws += 4) {
      var sc = reciprocity(ws);
      if (sc > bestScore) { bestScore = sc; winStart = Math.max(0, (ws * 4 + hdrStart - hdrStart) / 1); winStart = ws; }
    }
    /* 互指率太低说明这不是我要的那条数组（比如改版把地图重排了），就保持原样 */
    if (bestScore < 0.5) winStart = 0;
  }
  var headers = runList.slice(winStart, winStart + Math.min(totalMaps, runLen));
  var count = headers.length;
  var countsOk = count === totalMaps;

  function indexOf(g, n) {
    if (!countsOk) return -1;
    if (g < 0 || g >= groupOff.length) return -1;
    if (n < 0 || n >= MOON_MAP_GROUP_COUNTS[g]) return -1;
    return groupOff[g] + n;
  }

  var cache = {};

  function layoutOf(idx) {
    if (cache['L' + idx]) return cache['L' + idx];
    var h = headers[idx];
    if (h === undefined) return null;
    var L = off(u32(h));
    var lay = {
      w: u32(L), h: u32(L + 4),
      border: off(u32(L + 8)), map: off(u32(L + 12)),
      ts1: off(u32(L + 16)), ts2: off(u32(L + 20)),
      header: h, ev: off(u32(h + 4)), con: off(u32(h + 12)),
      cave: u8(h + 0x15), mapType: u8(h + 0x17),
    };
    cache['L' + idx] = lay;
    return lay;
  }

  /* 元瓦片属性表（地形行为）所在位置。主瓦片集管 0..511，副的管 512..1023 */
  function attrBaseOf(idx) {
    var lay = layoutOf(idx);
    if (!lay) return null;
    if (cache['A' + idx]) return cache['A' + idx];
    var out = [off(u32(lay.ts1 + 16)) || 0, off(u32(lay.ts2 + 16)) || 0];
    cache['A' + idx] = out;
    return out;
  }

  /* 一格的代价：先看碰撞位，再看地形行为 */
  function tileCost(idx, x, y) {
    var lay = layoutOf(idx);
    if (!lay) return 0;
    if (x < 0 || y < 0 || x >= lay.w || y >= lay.h) return 0;
    var v = u16(lay.map + (y * lay.w + x) * 2);
    if ((v >> 10) & 3) return 0;                       // 碰撞位：走不过去
    var id = v & 0x3ff;
    var ab = attrBaseOf(idx);
    var attrOff = (id < 512 ? ab[0] + id * 2 : ab[1] + (id - 512) * 2);
    var bh = u16(attrOff) & 0xff;
    return MOON_BEHAVIOR_COST[bh] || 0;
  }

  /* 整张图的代价网格，算路径时用 */
  function costGrid(idx) {
    if (cache['G' + idx]) return cache['G' + idx];
    var lay = layoutOf(idx);
    if (!lay) return null;
    var g = new Uint8Array(lay.w * lay.h);
    for (var y = 0; y < lay.h; y++) {
      for (var x = 0; x < lay.w; x++) {
        var v = u16(lay.map + (y * lay.w + x) * 2);
        if ((v >> 10) & 3) continue;                   // 0 = 墙
        var id = v & 0x3ff;
        var ab = attrBaseOf(idx);
        var bh = u16((id < 512 ? ab[0] + id * 2 : ab[1] + (id - 512) * 2)) & 0xff;
        g[y * lay.w + x] = MOON_BEHAVIOR_COST[bh] || 1;
      }
    }
    cache['G' + idx] = g;
    return g;
  }

  /* 传送点：MapEvents = u8 物体数, u8 传送数, u8 坐标事件数, u8 背景数, 4 个指针 */
  function warps(idx) {
    if (cache['W' + idx]) return cache['W' + idx];
    var lay = layoutOf(idx);
    var out = [];
    if (lay && lay.ev > 0) {
      var nW = u8(lay.ev + 1);
      var wp = u32(lay.ev + 8);
      if (inRom(wp) && nW < 64) {
        for (var k = 0; k < nW; k++) {
          var w = off(wp) + k * 8;
          out.push({ x: dv.getInt16(w, true), y: dv.getInt16(w + 2, true), warpId: u8(w + 5), n: u8(w + 6), g: u8(w + 7) });
        }
      }
    }
    cache['W' + idx] = out;
    return out;
  }

  /* 相邻图：MapConnections = s32 条数, 指针；MapConnection = u8 方向, s32 偏移, u8 组, u8 序 */
  function connections(idx) {
    if (cache['C' + idx]) return cache['C' + idx];
    var lay = layoutOf(idx);
    var out = [];
    if (lay && lay.con > 0) {
      var cnt = i32(lay.con), cp = u32(lay.con + 4);
      if (cnt > 0 && cnt < 9 && inRom(cp)) {
        for (var k = 0; k < cnt; k++) {
          var q = off(cp) + k * 12;
          out.push({ dir: u8(q), offset: i32(q + 4), g: u8(q + 8), n: u8(q + 9) });
        }
      }
    }
    cache['C' + idx] = out;
    return out;
  }

  return {
    count: count, countsOk: countsOk, headers: headers,
    groupOff: groupOff, indexOf: indexOf,
    layoutOf: layoutOf, costGrid: costGrid, tileCost: tileCost,
    warps: warps, connections: connections,
    u8: u8, u16: u16, u32: u32, off: off,
  };
}
