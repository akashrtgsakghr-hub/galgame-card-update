/* ═══════════════════════════════════════════════════════════════════════════
   MOON POCKET v3 / host
   ① 皮肤引擎  ② 游戏位  ③ 屏内导航  ④ ROM 装载  ⑤ 存档桥  ⑥ 世界书  ⑦ 对外 API
   ═══════════════════════════════════════════════════════════════════════════ */
var $ = function(s){return document.querySelector(s);};
var $$ = function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
var frame = $("#cart-frame"), consoleEl = $("#console");
/* 屏幕只有一页：卡带。没有「酒馆内部系统」那一层——这台机器只管插卡、选卡、跑卡带，
   酒馆侧的月相 / 角色 / 世界书 / 时间线留在酒馆面板里，别在掌机上再摆一遍。 */
var layers = { byor:$("#byor"), core:$("#core-stage"), cheat:$("#cheat-stage"), msg:$("#screen-msg"), boot:$("#boot") };
var activeId = null, powered = true, mode = "arcade", core = null, bridge = null, narrator = null;
var lastRom = null, lastSnapshot = null, frameLive = false, toastTimer = null;
var chatId = "local", wbEntries = [], cheatOn = false;
var SAVE_PREFIX = "moon-pocket:demo:", WB_PREFIX = "moon-pocket:worldbook:", FLAG_PREFIX = "moon-pocket:flag:";
/* 金手指转写出来的那本世界书叫什么。导出 JSON、编辑页抬头、酒馆侧注入的标题都是这一份；
   名字本身也要落盘（FLAG_PREFIX+"wb-name"），宿主那一层才不需要认识这里的常量。 */
var WB_NAME = "后宫王神宠秘籍";
/* 卡带槽里那一张的名字（只有这一张）。卡带盒封面、插卡页、机身槽位、模拟器抬头都吃这一份，
   改名字只改这里。封面放不下全名，拆三行写：01 主名 / 02 副名 / 03 版本。 */
var CART_TITLE = "BT999变态宝可梦：后宫王内部特供_v9.99魔改汉化版";
var CART_SHORT = "BT999 变态宝可梦";
var CART_LINE = ["BT999 变态宝可梦", "后宫王内部特供", "v9.99 魔改汉化版"];

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
