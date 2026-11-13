/* ═══════════════════════════════════════════════════════════════════════════
   真实运行核心：44vba（VBA-Next 的 WASM 构建，GPL-3.0）
   ─ 核心文件：core/44gba.js + core/44gba.wasm；嵌进酒馆时由打包器换成内嵌 base64
   ─ 生命周期：loadCore() 初始化 → boot() 塞 ROM → 每帧 runFrame → 取 240×160 RGBA
   ─ C 侧符号：1=ROM缓冲 2=存档区(128KB Flash+8KB) 3=帧缓冲 4=金手指文本缓冲
   ═══════════════════════════════════════════════════════════════════════════ */
var CORE_JS_URL = "core/44gba.js", CORE_WASM_URL = "core/44gba.wasm";
var cheatSpeed=1;
var coreModule=null, corePromise=null, coreCtx=null, coreImageData=null,
    coreFbView=null, coreSavView=null, coreRaf=0, coreKeys=0, corePaused=false,
    coreFrames=0, coreFpsT=0, coreFps=0, coreBooted=false;

/* 按键位序与核心一致：a,b,select,start,right,left,up,down,r,l */
var KEY_BIT = { a:0, b:1, select:2, start:3, right:4, left:5, up:6, down:7, r:8, l:9 };

function b64ToBytes(b64){
  var bin = atob(b64), n = bin.length, out = new Uint8Array(n);
  for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
  return out;
}
/* wasm 以 gzip 内嵌，省掉一半体积；没有 DecompressionStream 时退回未压缩内嵌 */
function gunzipBytes(bytes){
  if (typeof DecompressionStream !== "function") return Promise.reject(new Error("no DecompressionStream"));
  var ds = new DecompressionStream("gzip");
  var stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Response(stream).arrayBuffer().then(function(b){ return new Uint8Array(b); });
}

/* 取核心资源：嵌入酒馆时用内嵌副本（srcdoc 是 opaque origin，拿不到相对路径），
   独立打开页面时直接读同目录文件。 */
function coreAssets(){
  if (window.__MOON_CORE_JS__ && window.__MOON_CORE_WASM_B64__){
    var raw = b64ToBytes(window.__MOON_CORE_WASM_B64__);
    var p = window.__MOON_CORE_WASM_GZ__ ? gunzipBytes(raw) : Promise.resolve(raw);
    return p.then(function(wasm){ return { js: window.__MOON_CORE_JS__, wasm: wasm }; });
  }
  return Promise.all([
    fetch(CORE_JS_URL).then(function(r){ if(!r.ok) throw new Error("核心脚本 "+r.status); return r.text(); }),
    fetch(CORE_WASM_URL).then(function(r){ if(!r.ok) throw new Error("核心 wasm "+r.status); return r.arrayBuffer(); })
  ]).then(function(a){ return { js: a[0], wasm: new Uint8Array(a[1]) }; });
}

/* 核心是 Emscripten 产物，直接以全局方式执行；用 Blob URL 注入脚本，
   这样不碰 eval，也能在 sandbox iframe 里跑。 */
function injectCoreScript(code){
  return new Promise(function(res, rej){
    var url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    var el = document.createElement("script");
    el.src = url;
    el.onload = function(){ URL.revokeObjectURL(url); res(); };
    el.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("核心脚本执行失败")); };
    document.head.appendChild(el);
  });
}

function loadCore(){
  if (coreModule) return Promise.resolve(coreModule);
  if (corePromise) return corePromise;
  corePromise = coreAssets().then(function(assets){
    /* C 侧会回调这几个名字，宿主必须先备好，否则 wasm 一执行就抛 */
    window.writeAudio = window.writeAudio || function(){};
    window.wasmReady = window.wasmReady || function(){};
    window.onSaveBufChanged = window.onSaveBufChanged || function(){};
    return new Promise(function(res, rej){
      window.Module = {
        wasmBinary: assets.wasm,
        print: function(){},
        printErr: function(m){ if(/error|abort/i.test(String(m))) try{console.warn("[core] "+m);}catch(e){} },
        onRuntimeInitialized: function(){ res(window.Module); }
      };
      injectCoreScript(assets.js).catch(rej);
    });
  }).then(function(M){
    coreModule = M;
    var fbPtr = M._emuGetSymbol(3), savPtr = M._emuGetSymbol(2);
    coreFbView = new Uint8ClampedArray(M.HEAPU8.buffer).subarray(fbPtr, fbPtr + 240*160*4);
    coreSavView = M.HEAPU8.subarray(savPtr, savPtr + 0x20000 + 0x2000);
    coreCtx = $("#core-canvas").getContext("2d");
    coreImageData = new ImageData(coreFbView, 240, 160);
    return M;
  }).catch(function(err){
    corePromise = null;
    throw err;
  });
  return corePromise;
}

/* 一帧：跑核心 → 取帧缓冲画到屏幕。核心算 1 帧约 1ms，60fps 绰绰有余。 */
function coreTick(ts){
  coreRaf = requestAnimationFrame(coreTick);
  if (!coreModule || !coreBooted || corePaused) return;
  /* 倍速：一帧 rAF 里多跑几帧核心。金手指台的「加速」就是改这个数，
     不改游戏本身，也不影响存档。 */
  try{ for (var _f = 0; _f < cheatSpeed; _f++) coreModule._emuRunFrame(coreKeys); }catch(e){ return; }
  coreCtx.putImageData(coreImageData, 0, 0);
  coreFrames++;
  if (!coreFpsT) coreFpsT = ts;
  else if (ts - coreFpsT >= 500){
    coreFps = Math.round(coreFrames * 1000 / (ts - coreFpsT));
    coreFrames = 0; coreFpsT = ts;
    var f = $("#emu-fps"); if (f) f.textContent = coreFps || "--";
  }
}
function coreStart(){ if (!coreRaf) coreRaf = requestAnimationFrame(coreTick); }
function coreStop(){ if (coreRaf){ cancelAnimationFrame(coreRaf); coreRaf = 0; } }

var GBA_CORE = {
  name: "44vba", license: "GPL-3.0", version: "wasm", real: true,
  boot: function(buf, meta){
    var veil = $("#emu-veil"), veilText = $("#emu-veil-text");
    if (veil){ veil.hidden = false; veil.firstElementChild.textContent = "装载核心…"; }
    if (veilText) veilText.textContent = "正在初始化 WASM 核心";
    $("#emu-name").textContent = meta && meta.title ? meta.title : "GBA";
    coreBooted = false; corePaused = false; coreKeys = 0;
    return loadCore().then(function(M){
      if (veilText) veilText.textContent = "正在把卡带内容交给核心（" + (buf.length/1048576).toFixed(0) + " MB）";
      var romPtr = M._emuGetSymbol(1);
      M.HEAPU8.set(buf, romPtr);
      var ret =       M._emuLoadROM(buf.length);
      M._emuResetCpu();
      coreBooted = true;
      coreStart();
      /* 换一张卡带就是换一张地图册：旧页留着没意义 */
      if (typeof mapReset === "function") mapReset();
      if (veil) veil.hidden = true;
      $("#core-state").textContent = "44vba / GPL-3.0 · 运行中";
      return ret;
    }).catch(function(err){
      coreBooted = false;
      if (veil){ veil.hidden = false; veil.firstElementChild.textContent = "核心装载失败"; }
      if (veilText) veilText.textContent = String(err && err.message || err) + "（核心文件 core/44gba.js 与 .wasm 需在同目录）";
      throw err;
    });
  },
  frame: function(){ coreStart(); },
  input: function(btn, down){
    var bit = KEY_BIT[btn]; if (bit === undefined) return;
    if (down) coreKeys |= (1 << bit); else coreKeys &= ~(1 << bit);
  },
  pause: function(v){ corePaused = !!v; },
  saveState: function(){ return coreSavView ? Array.from(coreSavView) : null; },
  loadState: function(arr){
    if (!coreSavView || !arr || !arr.length) return false;
    coreSavView.set(arr.subarray ? arr.subarray(0, coreSavView.length) : arr.slice(0, coreSavView.length));
    if (coreModule) coreModule._emuResetCpu();
    return true;
  },
  rawSave: function(){ return coreSavView ? coreSavView.slice() : null; }
};

var DEMO_CORE={name:"moon.core-demo",license:"CC0-1.0",version:"1.0",
  boot:function(buf,meta){lastRom=Object.assign({},meta,{hash:meta.hash||""});drawCoreView();},
  frame:function(){drawCoreView();},input:function(){},saveState:function(){return null;},loadState:function(){}};
function attachCore(adapter,quiet){
  if(!adapter||typeof adapter!=="object"||typeof adapter.boot!=="function")throw new Error("核心适配器需要 boot(romBuffer, meta)");
  core=adapter;$("#core-state").textContent=adapter.name+" / "+adapter.license+" · 已装载";
  if(!quiet)toast("已接入核心："+adapter.name+"（"+adapter.license+"）");return core;
}
/* 手动装载核心：只在还没插卡时用得上，插卡会自动装 */
$("#demo-core-btn").addEventListener("click",function(){
  attachCore(GBA_CORE,true);
  showLayer("byor");
  toast("运行核心已就位（"+GBA_CORE.name+" / "+GBA_CORE.license+"）· 插一张卡带就能跑");
});
$("#core-back").addEventListener("click",function(){
  if(core&&typeof core.pause==="function")core.pause(true);
  coreStop();showLayer("byor");
});
$("#emu-pause").addEventListener("click",function(){
  corePaused=!corePaused;
  this.textContent=corePaused?"继续":"暂停";
  toast(corePaused?"已暂停（省电）":"继续");
});
/* 导出 .sav：GBA 存档区前 128KB 就是 Flash 存档，可直接喂给别的模拟器 */
$("#emu-save").addEventListener("click",function(){
  if(!coreModule){toast("核心还没跑起来");return;}
  var raw=GBA_CORE.rawSave();
  if(!raw){toast("没有可导出的存档");return;}
  var name=((lastRom&&lastRom.code)||"moon")+"-"+(lastRom&&lastRom.sizeMB||0)+"MB.sav";
  var url=URL.createObjectURL(new Blob([raw.slice(0,0x20000)],{type:"application/octet-stream"}));
  var a=document.createElement("a");a.href=url;a.download=name;a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},4000);
  var nz=0;for(var i=0;i<0x20000;i++)if(raw[i])nz++;
  toast("已导出 "+name+"（128KB，非零 "+nz+" 字节）");
});
$("#rom-btn").addEventListener("click",function(){$("#rom-file").click();});
$("#rom-file").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  var out=$("#rom-result");out.textContent="读取中…（"+f.size.toLocaleString()+" 字节）";
  f.arrayBuffer().then(function(buf){
    var meta=parseGBAHeader(buf,f.name);
    return crypto.subtle.digest("SHA-1",buf).then(function(h){
      var hex=Array.from(new Uint8Array(h)).map(function(b){return b.toString(16).padStart(2,"0");}).join("");
      meta.hash=hex;lastRom=meta;renderRomCard(meta,hex);renderCartSlot();
      out.innerHTML="解析完成：<b>"+esc(meta.title)+" / "+esc(meta.code)+"</b> · "+meta.sizeMB+" MB · SHA-1 <code>"+hex.slice(0,16)+"…</code><br>"
        +"正在交给运行核心（"+esc(GBA_CORE.name)+" / "+esc(GBA_CORE.license)+"）。"
        +"<br>文件只在本页内存里读取，未复制、未上传、未保存。";
      /* 插进去就直接跑：核心异步初始化，装载期间屏幕上显示进度 */
      if(!core||!core.real)attachCore(GBA_CORE,true);
      showLayer("core");
      Promise.resolve(core.boot(new Uint8Array(buf),meta)).then(function(){
        out.innerHTML+="<br>核心已接管画面。";
        $("#emu-tip").textContent="方向键移动 · A 确认 · B 取消 · START 菜单 · 导出存档可拿到 .sav";
        toast("卡带已启动 · "+meta.sizeMB+" MB");
      }).catch(function(err){
        out.innerHTML+="<br>核心装载失败："+esc(err&&err.message||err);
        toast("核心装载失败，见卡带页说明");
      });
    });
  }).catch(function(err){out.textContent="解析失败："+err.message;});
  e.target.value="";
});

/* ── ⑤ 存档桥：核心快照 / moon-savelog 游戏日志 / 原始 .sav ───────────── */
var DEMO_SAVELOG=null;
function defaultSnapshot(){
  if(DEMO_SAVELOG)return DEMO_SAVELOG;
  // 与 samples/moon-savelog-sample.json 同一份原创数据（离线内置，不依赖文件读取）
  DEMO_SAVELOG={format:"moon-savelog",version:1,source:"内置示例存档（原创）",
    trainer:{name:"弦月",id:"04721",badges:6,playtime:"38:12",location:"苔灯镇 · 夜市",money:12840},
    party:[
      {species:"苔灯",nickname:"小灯",level:32,gender:"雌",nature:"温和",ability:"余晖",item:"月纹绸带",moves:["叶笛","萤火","寄生种子","月华"],bond:"在雨夜的屋檐下被收服，之后每到满月会自己跳上肩头",events:["满月夜替玩家照亮了回家的路","第一次道馆战拒绝交换上场"]},
      {species:"霜羽",nickname:"阿霜",level:29,gender:"雄",nature:"顽皮",ability:"薄霜",item:"碎冰石",moves:["冰砾","羽栖","顺风","雾隐"],bond:"总把玩家的袖口啄出一层白霜，被训斥后会装睡",events:["雪原里把走失的玩家带回营地"]},
      {species:"墨鲤",nickname:"墨墨",level:35,gender:"雌",nature:"沉着",ability:"弦月",item:"旧铜铃",moves:["水纹","影潜","月读","守住"],bond:"只在月相偏弦时浮出水面，记得玩家第一次念错它的名字",events:["在偏弦夜把掉进湖里的笔记本叼了回来"]}
    ],
    bag:[{name:"月纹绸带",count:1},{name:"苔灯果",count:7},{name:"旧铜铃",count:1},{name:"碎冰石",count:3}],
    bonds:["小灯会在满月夜主动跳上肩头","阿霜喜欢把袖口啄出白霜","墨墨只在偏弦月相浮出水面"],
    events:["雨夜屋檐下收服小灯","雪原里阿霜带回走失的玩家","偏弦夜墨墨叼回掉进湖里的笔记本"]};
  return DEMO_SAVELOG;
}
function attachBridge(b){
  if(!b||typeof b!=="object"||typeof b.readSnapshot!=="function")throw new Error("存档桥需要 readSnapshot()");
  bridge=b;$("#cheat-src").textContent="数据源："+(b.name||"自定义存档桥");return b;
}
attachBridge({name:"内置示例存档（原创）",readSnapshot:function(){return defaultSnapshot();}});
function parseGen3Save(buf,name){
  var size=buf.byteLength,dv=new DataView(buf),sectors=[];
  for(var off=0;off+0x1000<=size;off+=0x1000){
    if(dv.getUint32(off+0xFF8,true)===0x08012025){
      var sum=0;
      for(var i=0;i<0xFF4;i+=4)sum=(sum+dv.getUint32(off+i,true))>>>0;
      var chk=(((sum>>>16)+(sum&0xFFFF))&0xFFFF);
      sectors.push({index:off/0x1000,id:dv.getUint16(off+0xFF4,true),
        checksum:chk,stored:dv.getUint16(off+0xFF6,true),ok:chk===dv.getUint16(off+0xFF6,true),
        counter:dv.getUint32(off+0xFFC,true)});
    }
  }
  var counters=sectors.map(function(s){return s.counter;});
  var maxCounter=counters.length?Math.max.apply(null,counters):0;
  return {format:"moon-savelog",version:1,source:"原始 .sav / "+name,
    trainer:{name:"（未从原始扇区解析）",id:"—",badges:null,playtime:"—",location:"—",money:null},
    party:[],bag:[],bonds:[],events:[],
    save:{size:size,sectors:sectors.length,valid:sectors.filter(function(s){return s.ok;}).length,
      activeSlot:counters.filter(function(c){return c===maxCounter;}).length?"最新计数 "+maxCounter:"未识别",
      note:"原始 .sav 只做扇区/校验读取；宝可梦明细请从核心 readSnapshot() 或 moon-savelog 游戏日志获取"}};
}
function loadSaveFile(file){
  return file.arrayBuffer().then(function(buf){
    if(/\.json$/i.test(file.name)){
      var o=JSON.parse(new TextDecoder("utf-8").decode(buf));
      if(o.format!=="moon-savelog")throw new Error("format 必须是 moon-savelog");
      o.source="游戏日志 / "+file.name;return o;
    }
    return parseGen3Save(buf,file.name);
  });
}
