/* ═══════════════════════════════════════════════════════════════════════════
   MOON POCKET v3 / host
   ① 皮肤引擎  ② 游戏位  ③ 屏内导航  ④ ROM 装载  ⑤ 存档桥  ⑥ 世界书  ⑦ 对外 API
   ═══════════════════════════════════════════════════════════════════════════ */
var $ = function(s){return document.querySelector(s);};
var $$ = function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
var frame = $("#cart-frame"), consoleEl = $("#console");
var layers = { os:$("#tavern-os"), byor:$("#byor"), core:$("#core-stage"), cheat:$("#cheat-stage"), msg:$("#screen-msg"), boot:$("#boot") };
var activeId = null, powered = true, mode = "arcade", core = null, bridge = null, narrator = null;
var lastRom = null, lastSnapshot = null, frameLive = false, toastTimer = null;
var chatId = "local", wbEntries = [], cheatOn = false;
var SAVE_PREFIX = "moon-pocket:demo:", WB_PREFIX = "moon-pocket:worldbook:", FLAG_PREFIX = "moon-pocket:flag:";

function toast(text, warn){
  var t=$("#toast");t.textContent=text;t.className="toast show"+(warn?" warn":"");
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.className="toast";},2600);
}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
/* 存储兜底：作为酒馆面板嵌入时 iframe 是 opaque origin，碰 localStorage 会抛 SecurityError。
   有真存储就用真的；没有就退到内存，并把变更推给宿主（由宿主存进聊天存档）。 */
var LS=(function(){
  var mem={}, real=null, onChange=null;
  try{ window.localStorage.setItem("__mp_probe__","1"); window.localStorage.removeItem("__mp_probe__"); real=window.localStorage; }
  catch(e){ real=null; }
  function fire(k,v){ if(onChange)try{onChange(k,v);}catch(_){} }
  return {
    isPersistent: !!real,
    onchange: function(fn){ onChange=fn; },
    seed: function(obj){ if(!real&&obj)for(var k in obj)mem[k]=String(obj[k]); },
    getItem: function(k){ return real? real.getItem(k) : (Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null); },
    setItem: function(k,v){ v=String(v); if(real)real.setItem(k,v); else mem[k]=v; fire(k,v); },
    removeItem: function(k){ if(real)real.removeItem(k); else delete mem[k]; fire(k,null); },
    dump: function(){ if(real){ var o={}; for(var i=0;i<real.length;i++){var k=real.key(i); if(k.indexOf("moon-pocket:")===0||k.indexOf("moon_pocket")===0)o[k]=real.getItem(k);} return o; } return mem; }
  };
})();
function readSave(id){try{return JSON.parse(LS.getItem(SAVE_PREFIX+id)||"{}")||{};}catch(e){return {};}}
function writeSave(id,data){try{LS.setItem(SAVE_PREFIX+id,JSON.stringify(data||{}));}catch(e){}}
