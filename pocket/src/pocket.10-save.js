/* ═══════════════════════════════════════════════════════════════════════════
   MOON POCKET v3 / 存档区快照
   ─ 核心符号 2（savPtr）就是卡带的 Flash 存档区：128KB Flash + 8KB 附加区。
     游戏里按「保存」写的是这块内存，它原来只活在这个 iframe 里，
     一关面板 / 一换聊天 / 一刷新就全没了——「导出 .sav」也只是下载一份，不算存。
   ─ 这里把它抓出来 → 压缩 → 存进本机键值库；作为酒馆面板嵌入时，
     宿主会把整包写进当前聊天的 chatMetadata，于是「存档跟着这条聊天走」。
   ─ 键按卡带指纹隔离，同一条聊天里换卡带不会串档。
   ─ 三个触发点：游戏自己写 Flash（onSaveBufChanged）、8 秒一次的静默巡检、
     AI 回复完成后宿主发来的 moon-host:autosave。
   ═══════════════════════════════════════════════════════════════════════════ */

var SAV_PREFIX = "moon-pocket:cart-save:";
var SAV_POLL_MS = 8000;        // 静默巡检间隔：没变化就不写盘，纯读内存比一遍哈希
var savPollTimer = 0, savLastSig = "", savLastAt = 0, savBusy = false;

function mpPost(m){ try{ parent.postMessage(m,"*"); }catch(e){} }

/* 这张卡带的存档键。用 ROM 头里算出来的 SHA-1 前 16 位：
   同一张卡带在任何聊天里都是同一把钥匙，换卡带自然换档。 */
function savKey(){
  var tag = (lastRom && (lastRom.hash || lastRom.code)) || "rom";
  return SAV_PREFIX + String(tag).slice(0, 16);
}

/* 空存档：整片都是 0xFF 或 0x00。这种不写——玩家还没在游戏里存过档，
   存一份空的上去只会让下次开机多一次无意义的回填。 */
function savIsBlank(u8){
  for (var i = 0; i < u8.length; i++){ var v = u8[i]; if (v !== 0xff && v !== 0x00) return false; }
  return true;
}

/* FNV-1a：136KB 走一遍约 0.1ms，用来判断「这块内存变了没有」 */
function savSig(u8){
  var h = 2166136261;
  for (var i = 0; i < u8.length; i++){ h ^= u8[i]; h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/* ── 压缩：优先 deflate-raw（浏览器自带，压缩率高），退到字节级 RLE ────────
   GBA 存档里绝大多数是 0xFF 空区，RLE 已经能压到几 KB；
   真数据部分交给 deflate。两条都试，取小的。 */
function savDeflate(u8){
  if (typeof CompressionStream !== "function") return Promise.resolve(null);
  try{
    var s = new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return new Response(s).arrayBuffer()
      .then(function(b){ return new Uint8Array(b); })
      .catch(function(){ return null; });
  }catch(e){ return Promise.resolve(null); }
}
function savInflate(u8){
  if (typeof DecompressionStream !== "function") return Promise.resolve(null);
  try{
    var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(s).arrayBuffer()
      .then(function(b){ return new Uint8Array(b); })
      .catch(function(){ return null; });
  }catch(e){ return Promise.resolve(null); }
}
function savRleEncode(u8){
  var out = new Uint8Array(u8.length * 2 + 2), o = 0, i = 0, n = u8.length;
  while (i < n){
    var v = u8[i], run = 1;
    while (i + run < n && u8[i + run] === v && run < 255) run++;
    out[o++] = run; out[o++] = v; i += run;
  }
  return out.subarray(0, o);
}
function savRleDecode(d, size){
  var out = new Uint8Array(size), o = 0, i = 0;
  while (i + 1 < d.length && o < size){
    var run = d[i], v = d[i + 1]; i += 2;
    for (var k = 0; k < run && o < size; k++) out[o++] = v;
  }
  return out;
}

/* base64：136KB 用分块 String.fromCharCode 拼，别一个一个字符累加 */
function savB64(u8){
  var s = "", CH = 0x8000;
  for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
function savUnB64(str){
  var bin = atob(str), n = bin.length, out = new Uint8Array(n);
  for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function savCompress(u8){
  return savDeflate(u8).then(function(d){
    var r = savRleEncode(u8);
    var best = null;
    if (r.length < u8.length) best = { k: "r", bytes: r };
    if (d && d.length < u8.length && (!best || d.length < best.bytes.length)) best = { k: "d", bytes: d };
    if (!best) best = { k: "n", bytes: u8 };
    /* raw 是解压后的目标长度：RLE 靠它知道要还原多少字节，
       也写进存档记录里，换设备时能核对「这份存档原本多大」 */
    best.raw = u8.length;
    return best;
  });
}
function savDecompress(rec){
  var bytes;
  try{ bytes = savUnB64(rec.data); }catch(e){ return Promise.resolve(null); }
  if (rec.k === "n") return Promise.resolve(bytes);
  if (rec.k === "r") return Promise.resolve(savRleDecode(bytes, Number(rec.raw) || coreSavView.length));
  if (rec.k === "d") return savInflate(bytes);
  return Promise.resolve(null);
}

function savRead(){
  try{
    var raw = LS.getItem(savKey());
    if (!raw) return null;
    var rec = JSON.parse(raw);
    return rec && rec.data ? rec : null;
  }catch(e){ return null; }
}

/* ── 写盘 ────────────────────────────────────────────────────────────────
   reason: "auto"（AI 回复完）| "flash"（游戏自己写了 Flash）| "manual"（玩家点）| "timer" */
function savWrite(reason){
  if (!coreBooted || !coreSavView) return Promise.resolve({ ok: false, why: "核心没在跑" });
  if (savBusy) return Promise.resolve({ ok: false, why: "正在写" });
  var snap;
  try{ snap = coreSavView.slice(); }catch(e){ return Promise.resolve({ ok: false, why: "读不到存档区" }); }
  var sig = savSig(snap);
  /* 一个字都没变就不写：AI 每轮都回，没必要每轮都把同一份存档刷一遍 */
  if (sig === savLastSig && reason !== "manual") return Promise.resolve({ ok: true, skip: "nochange", at: savLastAt });
  if (savIsBlank(snap)) { savLastSig = sig; return Promise.resolve({ ok: true, skip: "blank", at: savLastAt }); }
  savBusy = true;
  return savCompress(snap).then(function(p){
    var rec = { v: 1, k: p.k, raw: p.raw, sig: sig, at: Date.now(),
      code: (lastRom && lastRom.code) || "", title: (lastRom && lastRom.title) || "",
      data: savB64(p.bytes) };
    var json = "";
    try{ json = JSON.stringify(rec); }catch(e){ savBusy = false; return { ok: false, why: "编码失败" }; }
    /* 宿主对单条 chatMetadata 的落地有 256KB 的顾虑，留足余量 */
    if (json.length > 200000){
      savBusy = false;
      return { ok: false, why: "压缩后仍有 " + Math.round(json.length / 1024) + "KB，超出可存范围" };
    }
    try{ LS.setItem(savKey(), json); }
    catch(e){ savBusy = false; return { ok: false, why: "本机存储写不进去" }; }
    savLastSig = sig; savLastAt = rec.at; savBusy = false;
    savUpdateCaption();
    return { ok: true, at: rec.at, bytes: p.bytes.length, raw: p.raw, code: rec.code, pack: p.k };
  }).catch(function(e){
    savBusy = false;
    return { ok: false, why: String((e && e.message) || e) };
  });
}

/* ── 恢复：核心 boot 之后、复位 CPU 之前调用 ──────────────────────────────
   顺序很重要：_emuLoadROM 先跑（它会清存档区），我们把存档写回去，
   再 _emuResetCpu——这样游戏是从「有存档的卡带」上开机的。 */
function savRestoreToCore(){
  if (!coreSavView) return Promise.resolve(false);
  var rec = savRead();
  if (!rec) return Promise.resolve(false);
  return savDecompress(rec).then(function(bytes){
    if (!bytes || bytes.length < 1024) return false;
    var n = Math.min(bytes.length, coreSavView.length);
    coreSavView.set(bytes.subarray(0, n));
    savLastSig = savSig(coreSavView);
    savLastAt = Number(rec.at) || 0;
    return true;
  }).catch(function(){ return false; });
}

/* ── 巡检：8 秒看一次，变了才写 ─────────────────────────────────────────
   C 侧 onSaveBufChanged 只在核心愿意回调时才响，不能全靠它。 */
function savWatchStart(){
  if (savPollTimer) return;
  savPollTimer = setInterval(function(){
    if (!coreBooted || document.hidden) return;
    try{ savWrite("timer"); }catch(e){}
  }, SAV_POLL_MS);
}
function savWatchStop(){ if (savPollTimer){ clearInterval(savPollTimer); savPollTimer = 0; } }

/* ── 界面：底部那行「存档：…」说真话 ───────────────────────────────────── */
function savHhmm(ts){
  if (!ts) return "";
  try{
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }catch(e){ return ""; }
}
function savUpdateCaption(){
  var el = $("#save-caption");
  if (!el) return;
  var rec = savRead();
  if (rec){
    el.textContent = "存档：" + (lastRom && lastRom.code ? lastRom.code + " · " : "") + "已存 " + savHhmm(Number(rec.at) || savLastAt);
    el.title = "这一局存在本机，并跟着当前这条聊天走（第 " + (rec.raw ? Math.round(rec.raw / 1024) : "?") + "KB → " + Math.round(String(rec.data || "").length / 1024) + "KB）";
  } else if (lastRom){
    el.textContent = "存档：这张卡带还没存过";
    el.title = "游戏里保存一次，这里就会记下来";
  } else {
    el.textContent = "存档：LOCAL / 按卡带隔离";
  }
}

/* ── 提示音开关：真正发声的是宿主（它一直在），掌机只负责把这个选择传过去 ── */
var chimeOn = true;
function savChimeFlag(){ return LS.getItem(FLAG_PREFIX + "chime") !== "0"; }
function savRenderChime(){
  var b = $("#chime-btn");
  if (!b) return;
  /* 不用 emoji：这台的等宽字体里彩色字形会破坏像素风，用文字说清楚 */
  b.textContent = chimeOn ? "提示音 · 开" : "提示音 · 关";
  b.setAttribute("aria-pressed", chimeOn ? "true" : "false");
  b.title = chimeOn ? "AI 回复完成时响一声（点一下关掉）" : "已静音（点一下打开）";
}
function savSetChime(on){
  chimeOn = !!on;
  try{ LS.setItem(FLAG_PREFIX + "chime", chimeOn ? "1" : "0"); }catch(e){}
  savRenderChime();
  mpPost({ type: "moon-pocket:chime-set", on: chimeOn });
  toast(chimeOn ? "AI 回复完成时会响一声" : "提示音已关");
}

/* ── 初始化 ────────────────────────────────────────────────────────────── */
(function savInit(){
  chimeOn = savChimeFlag();
  /* C 侧写 Flash 时会给这个回调；我们只做「记一笔，稍后落盘」 */
  window.onSaveBufChanged = function(){
    clearTimeout(savInit._t);
    savInit._t = setTimeout(function(){ try{ savWrite("flash"); }catch(e){} }, 500);
  };
  var btn = $("#chime-btn");
  if (btn) btn.addEventListener("click", function(){ savSetChime(!chimeOn); });

  addEventListener("message", function(e){
    var d = e.data || {};
    if (d.type === "moon-host:autosave"){
      savWrite("auto").then(function(r){
        if (r && r.ok && !r.skip){
          toast("AI 回复好了 · 这一局已存好 " + savHhmm(r.at || Date.now()));
        }
        mpPost({ type: "moon-pocket:saved", ok: !!(r && r.ok), skip: (r && r.skip) || "",
          at: (r && r.at) || Date.now(), bytes: (r && r.bytes) || 0, code: (r && r.code) || "",
          why: (r && r.why) || "" });
      });
    } else if (d.type === "moon-host:chime-state"){
      chimeOn = !!d.on;
      try{ LS.setItem(FLAG_PREFIX + "chime", chimeOn ? "1" : "0"); }catch(e){}
      savRenderChime();
    }
  });
  savRenderChime();
  savUpdateCaption();
})();
