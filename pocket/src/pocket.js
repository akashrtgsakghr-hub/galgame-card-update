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

/* ── ① 皮肤引擎 ───────────────────────────────────────────────────────── */
var TOKEN_MAP = { bg:"--color-bg",surface:"--color-surface",surface2:"--color-surface-2",edge:"--color-edge",
  text:"--color-text",muted:"--color-muted",accent:"--color-accent",accent2:"--color-accent-2",
  line:"--color-line",lcd:"--color-lcd",ink:"--color-lcd-ink",button:"--color-btn" };
var DEFAULT_SKIN = {
  format:"moon-skin",version:1,id:"moon.noir-pink",name:"黑粉 · 默认",author:"月相系统",license:"CC0-1.0",
  tokens:{bg:"#100b11",surface:"#1a121c",surface2:"#2a1a2a",edge:"#080509",text:"#f7e9f0",muted:"#a896a4",
    accent:"#ff86c2",accent2:"#ffc4e0",line:"rgba(255,255,255,.13)",lcd:"#555e4b",ink:"#10150b",button:"#33202f"},
  scanline:.035,radius:18,assets:{}
};
/* 屏幕沿用这块暗橄榄液晶：换机身皮肤不换屏，三套 APK 抽色皮肤都保留同一块屏 */
var BUILTIN_SKINS = [DEFAULT_SKIN,
  {format:"moon-skin",version:1,id:"apk.mimikyu-dusk",name:"谜拟Q · 暮色（配色抽取）",author:"本机 APK 抽色",license:"仅配色",
   tokens:{bg:"#0b070c",surface:"#141015",surface2:"#2a181d",edge:"#060407",text:"#f7e9f0",muted:"#948a90",
     accent:"#cb979e",accent2:"#e0b9bf",line:"rgba(255,255,255,.13)",lcd:"#555e4b",ink:"#10150b",button:"#2d1a1f"},
   scanline:.045,radius:18,assets:{}},
  {format:"moon-skin",version:1,id:"apk.pika-pop",name:"皮卡丘 · 浅粉（配色抽取）",author:"本机 APK 抽色",license:"仅配色",
   tokens:{bg:"#0b080d",surface:"#141016",surface2:"#2d1e26",edge:"#060408",text:"#f7e9f0",muted:"#9b9095",
     accent:"#f8bbbb",accent2:"#ffd9d9",line:"rgba(255,255,255,.13)",lcd:"#555e4b",ink:"#10150b",button:"#33222c"},
   scanline:.045,radius:18,assets:{}},
  {format:"moon-skin",version:1,id:"apk.scizor-ink",name:"巨钳螳螂 · 绯墨（配色抽取）",author:"本机 APK 抽色",license:"仅配色",
   tokens:{bg:"#0b070c",surface:"#140f15",surface2:"#2e1419",edge:"#060407",text:"#f7e9f0",muted:"#95898e",
     accent:"#fb8493",accent2:"#ffb9c1",line:"rgba(255,255,255,.13)",lcd:"#555e4b",ink:"#10150b",button:"#321c22"},
   scanline:.045,radius:18,assets:{}}];
var skinObj = DEFAULT_SKIN, SKIN = {};

function hex2rgb(h){h=String(h||"").trim();var m=/^#?([\da-f]{6})$/i.exec(h);if(!m)return [128,128,128];
  var n=parseInt(m[1],16);return [(n>>16)&255,(n>>8)&255,n&255];}
function rgb2hex(a){return "#"+a.map(function(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");}).join("");}
function mixHex(a,b,t){var x=hex2rgb(a),y=hex2rgb(b);return rgb2hex(x.map(function(v,i){return v*(1-t)+y[i]*t;}));}
function rgba(h,al){var c=hex2rgb(h);return "rgba("+c[0]+","+c[1]+","+c[2]+","+al+")";}
/* 屏内只用液晶四阶：浅底 / 深字 / 两档中间绿；机身粉色不进屏 */
function deriveSkin(t){
  return { lcd:t.lcd, ink:t.ink, accent:t.accent,
    soft:mixHex(t.lcd,t.ink,.20), mid:mixHex(t.lcd,t.ink,.52), dark:t.ink,
    hi:mixHex(t.lcd,"#ffffff",.42), panel:mixHex(t.lcd,"#ffffff",.28),
    grid:rgba(t.ink,.14), inkText:mixHex(t.lcd,t.accent,.30),
    scrAcc:mixHex(t.lcd,t.ink,.80) };
}
function normalizeSkin(s){
  if(!s||typeof s!=="object")throw new Error("皮肤不是 JSON 对象");
  if(s.format!=="moon-skin")throw new Error("format 必须是 moon-skin");
  if(Number(s.version)!==1)throw new Error("version 必须是 1");
  if(!s.tokens||typeof s.tokens!=="object")throw new Error("缺少 tokens");
  var t=Object.assign({},DEFAULT_SKIN.tokens,s.tokens);
  /* 令牌会被直接写进内联 style，等于一小段 CSS。导入的皮肤必须只能是「颜色字面量」，
     任何 url() / expression / ; / } / < 都可能逃出这个属性去改别的样式。 */
  var COLOR_RE=/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[0-9.]+\s*,\s*[0-9.]+\s*,\s*[0-9.]+\s*(,\s*[0-9.]+\s*)?\)|hsla?\(\s*[0-9.]+(deg)?\s*,\s*[0-9.]+%\s*,\s*[0-9.]+%\s*(,\s*[0-9.]+\s*)?\))$/;
  for(var k in TOKEN_MAP){
    if(typeof t[k]!=="string"||!t[k])throw new Error("缺少颜色令牌 "+k);
    if(!COLOR_RE.test(t[k].trim()))throw new Error("颜色令牌 "+k+" 不是合法颜色："+String(t[k]).slice(0,32));
    t[k]=t[k].trim();
  }
  return {format:"moon-skin",version:1,id:String(s.id||"local.skin"),name:String(s.name||"本机皮肤"),
    author:String(s.author||"本机"),license:String(s.license||"未声明"),
    tokens:t,scanline:Math.max(0,Math.min(.25,Number(s.scanline)||0)),
    radius:Math.max(0,Math.min(48,Number(s.radius)||18)),
    assets:(s.assets&&typeof s.assets==="object")?s.assets:{},
    source:s.source||null};
}
var prevTokenJSON=null;
function applySkin(s){
  skinObj=normalizeSkin(s);SKIN=deriveSkin(skinObj.tokens);
  var root=document.documentElement.style,t=skinObj.tokens;
  var tokenJSON=JSON.stringify(t),tokensChanged=tokenJSON!==prevTokenJSON;
  for(var k in TOKEN_MAP)root.setProperty(TOKEN_MAP[k],t[k]);
  root.setProperty("--scanline",String(skinObj.scanline));
  root.setProperty("--radius-device",skinObj.radius+"px");
  var art=skinObj.assets&&skinObj.assets.wallpaper;
  root.setProperty("--skin-wallpaper",art?'url("'+String(art).replace(/["\\]/g,"")+'")':"none");
  $("#brand-skin").textContent=skinObj.name;
  $("#chip-skin").textContent=skinObj.id.toUpperCase().replace("MOON.","").replace("APK.","").slice(0,16);
  $("#skin-scan").value=Math.round(skinObj.scanline*100);
  $("#skin-scan-val").textContent=skinObj.scanline.toFixed(2);
  $("#skin-json").textContent=JSON.stringify(skinObj,null,2);
  $$(".skin-preset").forEach(function(b){b.classList.toggle("active",b.dataset.id===skinObj.id);});
  if(tokensChanged){
    buildCarts();          // 换肤后旧正文的颜色已过期，entry 全部作废重建
    if(activeId&&activeId!=="__home"&&activeId!=="__os"){
      var c=CARTS.find(function(x){return x.id===activeId;});
      if(c&&c.runtime==="srcdoc"&&frameLive){frame.srcdoc=cartEntry(c);}
    }
  }
  prevTokenJSON=tokenJSON;
  drawCoreView();
  try{LS.setItem(FLAG_PREFIX+"skin",JSON.stringify(skinObj));}catch(e){}
  renderOs();
  return skinObj;
}

/* ── ② 屏内游戏位（画布 2× 内部分辨率，文字清晰；逻辑坐标仍是 240×160） ── */
var HOST_JS = [
  'var SAVE={},paused=false,held={};',
  'function send(t,p){var o={type:"moon-cart:"+t};if(p)for(var k in p)o[k]=p[k];parent.postMessage(o,"*");}',
  'addEventListener("message",function(e){var d=e.data||{};',
  ' if(d.type==="moon-cart:boot"){SAVE=d.save||{};if(typeof onBoot==="function")onBoot(SAVE,d.list||[]);send("ready",{title:document.title});}',
  ' else if(d.type==="moon-cart:input"){held[d.button]=d.down;if(typeof onKey==="function")onKey(d.button,d.down);}',
  ' else if(d.type==="moon-cart:pause"){paused=!!d.value;}',
  '});',
  '/* 画布按屏幕真实设备像素 1:1 定尺寸，逻辑坐标仍是 240×160；不再被 CSS 拉伸糊字 */',
  'function fitCanvas(g){var c=document.getElementById("c"),dpr=window.devicePixelRatio||1;',
  ' var w=Math.max(240,Math.round(c.clientWidth*dpr)),h=Math.max(160,Math.round(c.clientHeight*dpr));',
  ' if(c.width!==w||c.height!==h){c.width=w;c.height=h;}',
  ' g.setTransform(w/240,0,0,h/160,0,0);}',
  'function ctx2d(){var g=document.getElementById("c").getContext("2d");fitCanvas(g);',
  ' addEventListener("resize",function(){fitCanvas(g);if(typeof paint==="function")paint();});return g;}',
  'function persist(o){send("save",{data:o});}',
  'function report(n){send("score",{score:n});}',
  'function launch(id){send("launch",{id:id});}',
  'addEventListener("keydown",function(e){var m={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",KeyZ:"a",KeyX:"b",Enter:"start",ShiftLeft:"select",Space:"a"};if(m[e.code]){e.preventDefault();if(typeof onKey==="function")onKey(m[e.code],true);}});',
  'addEventListener("keyup",function(e){var m={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",KeyZ:"a",KeyX:"b",Enter:"start",ShiftLeft:"select",Space:"a"};if(m[e.code]&&typeof onKey==="function")onKey(m[e.code],false);});'
].join('\n');
var GAME_CSS = [
  'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--lcd);color:var(--ink);',
  'font-family:"JetBrains Mono","Consolas","Microsoft YaHei UI",monospace;}',
  'canvas{display:block;width:100%;height:100%;image-rendering:pixelated}',
  'body{user-select:none;-webkit-user-select:none}'
].join('');
function cartDoc(title, body, logic){
  var pal=['var LCD='+JSON.stringify(SKIN.lcd)+',INK='+JSON.stringify(SKIN.ink)+',ACC='+JSON.stringify(SKIN.scrAcc)+',',
    'MID='+JSON.stringify(SKIN.mid)+',SOFT='+JSON.stringify(SKIN.soft)+',HI='+JSON.stringify(SKIN.hi)+',',
    'DARK='+JSON.stringify(SKIN.dark)+',PANEL='+JSON.stringify(SKIN.panel)+',GRID='+JSON.stringify(SKIN.grid)+';'].join("");
  var css=':root{--lcd:'+SKIN.lcd+';--ink:'+SKIN.ink+'}';
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>'+title+'</title>'
    + '<style>'+css+GAME_CSS+'</style></head><body>'+body
    + '<script>'+HOST_JS+'\n'+pal+'\n'+logic+'<\/script></body></html>';
}
var CANVAS_BODY='<canvas id="c" width="480" height="320"></canvas>';

var LOGIC_LAUNCHER=[
  'var g=ctx2d();',
  'var list=[],sel=0,viewTop=0,t=0,PAGE=4;',
  '/* 全局不能用 top：window.top 在 sandbox iframe 里是跨域保留属性 */',
  'function clampTop(){if(sel<viewTop)viewTop=sel;if(sel>=viewTop+PAGE)viewTop=sel-PAGE+1;',
  ' if(viewTop>Math.max(0,list.length-PAGE))viewTop=Math.max(0,list.length-PAGE);if(viewTop<0)viewTop=0;}',
  'function onBoot(s,l){list=l||[];sel=0;viewTop=0;paint();}',
  'function onKey(b,d){if(!d||paused||!list.length)return;',
  ' if(b==="up")sel=(sel+list.length-1)%list.length;',
  ' else if(b==="down")sel=(sel+1)%list.length;',
  ' else if(b==="a"||b==="start"){launch(list[sel].id);return;}',
  ' clampTop();paint();}',
  'function paint(){',
  ' g.fillStyle=LCD;g.fillRect(0,0,240,160);',
  ' g.fillStyle=INK;g.fillRect(0,0,240,25);',
  ' g.fillStyle=HI;g.font="bold 10px monospace";g.fillText("MOON POCKET / CARTRIDGE",6,15);',
  ' g.fillStyle=INK;g.font="9px monospace";g.fillText("街机模式 · 选一张卡带，按 A 启动",6,37);',
  ' g.fillStyle=GRID;g.fillRect(6,43,228,1);',
  ' for(var i=viewTop;i<Math.min(viewTop+PAGE,list.length);i++){var y=47+(i-viewTop)*23;',
  '  if(i===sel){g.fillStyle=INK;g.fillRect(4,y-2,232,21);g.fillStyle=HI;}else{g.fillStyle=INK;}',
  '  g.font="10px monospace";g.fillText(String(i+1).padStart(2,"0"),10,y+13);',
  '  g.fillText(list[i].title,32,y+13);',
  '  g.font="8px monospace";g.fillText(list[i].tag,172,y+12);}',
  ' if(list.length>PAGE){g.fillStyle=GRID;g.fillRect(235,46,2,96);',
  '  var h=Math.max(18,Math.round(96*PAGE/list.length)),oy=46+Math.round(92*viewTop/Math.max(1,list.length-PAGE));',
  '  g.fillStyle=INK;g.fillRect(235,oy,2,h);}',
  ' g.fillStyle=INK;g.fillRect(0,146,240,14);',
  ' g.fillStyle=HI;g.font="9px monospace";',
  ' g.fillText("↑↓ 选择  A 启动  ·  卡带自备 / 核心可接",5,156);',
  '}',
  'paint();'
].join('\n');
var LOGIC_RUNNER=[
  'var g=ctx2d();',
  'var jy=0,jv=0,obs=[],tick=0,score=0,dead=false,hi=SAVE.hi||0;',
  'function reset(){jy=0;jv=0;tick=0;score=0;dead=false;obs=[{x:250,w:12,h:16},{x:390,w:16,h:22}];}',
  'function jump(){if(dead){reset();return}if(jy===0)jv=-9.4;}',
  'function onBoot(s){hi=s.hi||0;reset();}',
  'function onKey(b,d){if(d&&(b==="a"||b==="up"||b==="start"||b==="space"))jump();}',
  'function frame(){',
  ' if(!dead){tick++;if(tick%6===0)score++;',
  '  jv+=0.52;jy+=jv;if(jy>0){jy=0;jv=0;}',
  '  for(var i=0;i<obs.length;i++)obs[i].x-=2.3+Math.min(2,score/220);',
  '  if(obs.length&&obs[0].x<-24)obs.shift();',
  '  if(tick%Math.max(52,96-score/28)<1)obs.push({x:250,w:10+Math.random()*9|0,h:14+Math.random()*13|0});',
  '  for(var j=0;j<obs.length;j++){var o=obs[j];if(o.x<44&&o.x+o.w>26&&jy>-o.h){dead=true;hi=Math.max(hi,score);persist({hi:hi});report(score);}}}',
  ' g.fillStyle=LCD;g.fillRect(0,0,240,160);',
  ' g.fillStyle=GRID;for(var k=0;k<8;k++)g.fillRect((k*37+tick/3)%260,128,18,2);',
  ' g.fillStyle=MID;g.fillRect(0,136,240,2);g.fillRect(0,150,240,1);',
  ' g.fillStyle=DARK;for(var m=0;m<obs.length;m++){var q=obs[m];g.fillRect(q.x,136-q.h,q.w,q.h);g.fillRect(q.x-2,136-q.h+3,q.w+4,2);}',
  ' g.fillStyle=INK;g.fillRect(26,112+jy,15,24);g.fillRect(38,118+jy,4,4);',
  ' g.fillStyle=ACC;g.fillRect(26,136+jy,15,2);',
  ' g.font="10px monospace";g.fillStyle=INK;',
  ' g.fillText("SCORE "+String(score).padStart(5,"0"),6,14);',
  ' g.fillText("HI "+String(hi).padStart(5,"0"),172,14);',
  ' if(dead){g.fillStyle=PANEL;g.fillRect(52,58,136,44);g.strokeStyle=INK;g.strokeRect(52,58,136,44);',
  '  g.fillStyle=INK;g.fillText("GAME OVER",80,76);g.fillText("A / START 重来",70,92);}',
  ' else{g.fillText("A 跳跃 · Esc 回菜单",6,154);}',
  '}',
  'var __last=0;function __loop(ts){requestAnimationFrame(__loop);if(document.hidden)return;if(ts-__last<33)return;__last=ts;frame();}',
  'reset();requestAnimationFrame(__loop);'
].join('\n');
var LOGIC_SPIRIT=[
  'var g=ctx2d();',
  'var BEASTS=[{n:"苔灯",c:MID,d:"苔藓里生出的一盏小灯"},{n:"霜羽",c:SOFT,d:"落在肩上会结一层薄霜"},{n:"墨鲤",c:DARK,d:"只在月相偏弦时浮出水面"}];',
  'var px=7,py=5,step=0,md="field",wild=null,guard=70,menu=0,dex=SAVE.dex||[],msg="用方向键走动，草丛里会遇到灵。",msgT=0;',
  'function grass(x,y){return ((x*7+y*13+(x*y)%5)%7)<3;}',
  'function onBoot(s){dex=s.dex||[];msg="已收 "+dex.length+" / "+BEASTS.length+" 灵";}',
  'function say(t){msg=t;msgT=110;}',
  'function move(dx,dy){var nx=Math.max(0,Math.min(14,px+dx)),ny=Math.max(0,Math.min(9,py+dy));px=nx;py=ny;step++;',
  ' if(grass(px,py)&&Math.random()<0.24){wild=BEASTS[Math.floor(Math.random()*3)];guard=60+Math.floor(Math.random()*30);menu=0;md="encounter";say("野生的「"+wild.n+"」出现了！");}}',
  'function onKey(b,d){if(!d||paused)return;',
  ' if(md==="dex"){if(b==="b"||b==="select"||b==="start"){md="field";say("回到原野");}return;}',
  ' if(md==="field"){',
  '  if(b==="up")move(0,-1);else if(b==="down")move(0,1);else if(b==="left")move(-1,0);else if(b==="right")move(1,0);',
  '  else if(b==="select"){md="dex";}else if(b==="start"){say("灵匣 · 已收 "+dex.length+" / 3");}return;}',
  ' if(md==="encounter"){',
  '  if(b==="left")menu=(menu+2)%3;else if(b==="right")menu=(menu+1)%3;',
  '  else if(b==="b"){md="field";wild=null;say("你悄悄退开了。");}',
  '  else if(b==="a"){',
  '   if(menu===0){var p=.18+(100-guard)/150;if(Math.random()<p){var id=BEASTS.indexOf(wild);if(dex.indexOf(id)<0)dex.push(id);persist({dex:dex});report(dex.length);',
  '      say("收服了「"+wild.n+"」！图鉴 "+dex.length+"/3");md="field";wild=null;}else{guard=Math.min(100,guard+6);say("没合上……它更警惕了。");}}',
  '   else if(menu===1){guard=Math.max(0,guard-22);say("警戒降到 "+guard+"。");if(Math.random()<0.12){md="field";wild=null;say("它转身钻进草里。");}}',
  '   else{md="field";wild=null;say("你放它走了。");}}}',
  'function box(x,y,w,h){g.fillStyle=LCD;g.fillRect(x,y,w,h);g.strokeStyle=INK;g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);}',
  'function frame(){',
  ' if(msgT>0)msgT--;',
  ' g.fillStyle=LCD;g.fillRect(0,0,240,160);',
  ' if(md==="field"){',
  '  for(var y=0;y<10;y++)for(var x=0;x<15;x++){var gx=x*16,gy=y*13+22;',
  '   if(grass(x,y)){g.fillStyle=SOFT;g.fillRect(gx,gy,16,13);g.fillStyle=MID;g.fillRect(gx+3,gy+3,2,7);g.fillRect(gx+10,gy+1,2,9);}',
  '   else{g.fillStyle=LCD;g.fillRect(gx,gy,16,13);}',
  '   g.strokeStyle=GRID;g.strokeRect(gx+.5,gy+.5,16,13);}',
  '  g.fillStyle=INK;g.fillRect(px*16+4,py*13+24,8,10);g.fillStyle=HI;g.fillRect(px*16+5,py*13+25,3,2);',
  '  g.fillStyle=INK;g.fillRect(0,0,240,20);g.fillStyle=HI;g.font="10px monospace";',
  '  g.fillText("灵匣 · 拾遗",5,13);g.fillText("图鉴 "+dex.length+"/3",184,13);',
  ' } else if(md==="dex"){',
  '  g.fillStyle=INK;g.fillRect(0,0,240,20);g.fillStyle=HI;g.font="10px monospace";g.fillText("灵 图 鉴",5,13);',
  '  for(var i=0;i<3;i++){var got=dex.indexOf(i)>=0;box(10,26+i*40,220,34);',
  '   g.fillStyle=got?BEASTS[i].c:GRID;g.fillRect(16,32+i*40,26,22);',
  '   g.fillStyle=INK;g.font="10px monospace";g.fillText(got?("No."+(i+1)+"  "+BEASTS[i].n):"No."+(i+1)+"  ？？？",50,42+i*40);',
  '   g.font="9px monospace";g.fillText(got?BEASTS[i].d:"尚未收录",50,55+i*40);}',
  '  g.fillText("B / SELECT 返回",5,154);',
  ' } else {',
  '  g.fillStyle=SOFT;g.fillRect(0,96,240,64);g.fillStyle=INK;g.fillRect(0,94,240,2);',
  '  var b=wild;g.fillStyle=b.c;g.beginPath();g.arc(180,54,22,0,6.283);g.fill();',
  '  g.fillStyle=GRID;g.fillRect(158,72,44,4);',
  '  g.fillStyle=INK;g.fillRect(176,42,3,3);g.fillRect(188,42,3,3);',
  '  g.font="10px monospace";g.fillText("野生的「"+b.n+"」",8,18);',
  '  g.fillText("警戒",8,34);g.strokeRect(38,26,90,8);g.fillStyle=ACC;g.fillRect(39,27,Math.round(88*guard/100),6);',
  '  g.fillStyle=INK;g.fillText(String(guard),134,34);',
  '  var opts=["投匣","安抚","离开"];',
  '  for(var m=0;m<3;m++){box(8+m*76,108,70,24);if(m===menu){g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(8+m*76+1,109,68,22);}',
  '   g.fillStyle=INK;g.fillText(opts[m],18+m*76,123);}}',
  ' if(md!=="dex"){g.fillStyle=INK;g.fillRect(0,150,240,10);g.fillStyle=HI;g.font="9px monospace";',
  '  g.fillText(msgT>0?msg:(md==="field"?"方向键走动 · SELECT 图鉴 · Esc 回菜单":"← → 选 · A 确定 · B 取消"),5,158);}',
  '}',
  'var __last=0;function __loop(ts){requestAnimationFrame(__loop);if(document.hidden)return;if(ts-__last<33)return;__last=ts;frame();}',
  'requestAnimationFrame(__loop);'
].join('\n');
var LOGIC_ORACLE=[
  'var g=ctx2d();',
  'var PH=["新月","蛾眉月","上弦月","盈凸月","满月","亏凸月","下弦月","残月"];',
  'var LINE=["宜开口，别把话留到下一轮。","宜回头看一眼走过的路。","宜把没写完的那页写完。","宜慢一点，雨会自己停。","宜收藏一件没什么用的小东西。","宜答应一个不费力的邀请。","宜早睡，月相会替你守夜。"];',
  'var idx=SAVE.idx||0,spin=0,res=SAVE.res||"按 A / START 摇一次月相";',
  'function onBoot(s){idx=s.idx||0;res=s.res||res;}',
  'function onKey(b,d){if(d&&(b==="a"||b==="start")){spin=18;idx=(idx+1+Math.floor(Math.random()*3))%8;res=PH[idx]+" · "+LINE[Math.floor(Math.random()*LINE.length)];persist({idx:idx,res:res});report(idx);}}',
  'function frame(){',
  ' if(spin>0)spin--;',
  ' g.fillStyle=LCD;g.fillRect(0,0,240,160);',
  ' g.fillStyle=INK;g.fillRect(0,0,240,18);g.fillStyle=HI;g.font="10px monospace";g.fillText("月 相 占 卜",6,13);g.fillText("MOON ORACLE",176,13);',
  ' var cx=120,cy=64,r=30;g.fillStyle=MID;g.beginPath();g.arc(cx,cy,r+2,0,6.283);g.fill();',
  ' g.fillStyle=HI;g.beginPath();g.arc(cx,cy,r,0,6.283);g.fill();',
  ' g.fillStyle=LCD;var off=(idx/8)*r*2;g.beginPath();g.arc(cx-r+off+spin%5,cy,r,0,6.283);g.fill();',
  ' g.fillStyle=INK;g.font="12px monospace";g.fillText(PH[idx],cx-24,112);',
  ' g.font="9px monospace";var words=res.split(" · ");g.fillText(words[0]||"",12,132);',
  ' g.fillStyle=INK;g.fillRect(0,150,240,10);g.fillStyle=HI;g.fillText("A / START 摇一次 · Esc 回菜单",5,158);',
  '}',
  'var __last=0;function __loop(ts){requestAnimationFrame(__loop);if(document.hidden)return;if(ts-__last<33)return;__last=ts;frame();}',
  'requestAnimationFrame(__loop);'
].join('\n');

var MANIFEST_SAMPLE={format:"moon-cart",version:1,id:"moon.breath",title:"月相呼吸灯",latin:"MOON BREATH",
  genre:"氛围 · 示例",author:"月相系统",license:"CC0-1.0",runtime:"srcdoc",input:["a"],
  entry:"<!doctype html>…自带 HTML/JS…",save:{scope:"per-chat",quotaBytes:65536},assets:[],requires:{rom:false,wasm:false}};
var CARTS=[], extraCarts=[];
function buildCarts(){
  // 卡带正文按需构建：启动时只出菜单，点开哪张才拼哪张的 HTML，省掉开机那一下的长任务
  var base=[
    {format:"moon-cart",version:1,id:"moon.runner",no:"01",title:"月相跑者",genre:"动作 · 反应",license:"原创 · CC0",runtime:"srcdoc",entry:null,assets:[],requires:{rom:false},
      _make:function(){return cartDoc("月相跑者",CANVAS_BODY,LOGIC_RUNNER);}},
    {format:"moon-cart",version:1,id:"moon.spirit",no:"02",title:"灵匣 · 拾遗",genre:"收集 · 养成",license:"原创 · CC0",runtime:"srcdoc",entry:null,assets:[],requires:{rom:false},
      _make:function(){return cartDoc("灵匣 · 拾遗",CANVAS_BODY,LOGIC_SPIRIT);}},
    {format:"moon-cart",version:1,id:"moon.oracle",no:"03",title:"月相占卜",genre:"氛围 · 轻互动",license:"原创 · CC0",runtime:"srcdoc",entry:null,assets:[],requires:{rom:false},
      _make:function(){return cartDoc("月相占卜",CANVAS_BODY,LOGIC_ORACLE);}},
    {format:"moon-cart",version:1,id:"rom.slot.byor",no:"04",title:"插卡玩老游戏",genre:"卡带 · 本机导入",license:"不含游戏文件",runtime:"byor",entry:null,assets:[],requires:{rom:true}}
  ];
  CARTS=base.concat(extraCarts);
}
/* 取卡带正文：自带游戏第一次点开才拼，外部导入的卡带直接用它的 entry */
function cartEntry(c){
  if(!c)return "";
  if(!c._make)return c.entry||"";
  if(!c.entry)c.entry=c._make();
  return c.entry;
}
function gameList(){return CARTS.map(function(c){return {id:c.id,title:c.title,tag:(c.runtime==="byor"?"CART":c.runtime.toUpperCase())};});}

/* ── ③ 屏内导航 ───────────────────────────────────────────────────────── */
function postFrame(obj){if(!frameLive)return;try{var w=frame.contentWindow;if(w)w.postMessage(obj,"*");}catch(e){}}
function unloadFrame(){frameLive=false;frame.onload=null;try{frame.removeAttribute("srcdoc");}catch(e){}}
function showLayer(name){
  Object.keys(layers).forEach(function(k){layers[k].hidden=(k!==name);});
  frame.hidden=(name!=="frame");frame.style.visibility=(name==="frame")?"visible":"hidden";
  if(name!=="frame")unloadFrame();
}
function goHome(quiet){
  activeId="__home";showLayer("frame");frameLive=true;
  frame.onload=function(){postFrame({type:"moon-cart:boot",save:{},list:gameList()});};
  frame.srcdoc=cartDoc("启动菜单",CANVAS_BODY,LOGIC_LAUNCHER);
  $("#save-caption").textContent="存档：LOCAL / 按卡带隔离";
  if(!quiet)toast("卡带菜单 · 方向键选择，A 启动");
}
function goOs(quiet){
  activeId="__os";showLayer("os");renderOs();
  $("#save-caption").textContent="酒馆内部系统 / TAVERN OS";
  if(!quiet)toast("酒馆内部系统 · 宽屏显示月相 / 角色 / 世界书 / 时间线");
}
function insert(id,quiet){
  var c=CARTS.find(function(x){return x.id===id;});if(!c)return;
  if(!powered)setPower(true);
  activeId=id;
  if(c.runtime==="byor"){
    showLayer("byor");$("#save-caption").textContent="存档：LOCAL / 卡带";
    if(!quiet)toast("卡带：本机读取，系统里没有夹带任何游戏文件");
  }else if(c.runtime==="srcdoc"){
    showLayer("frame");frameLive=true;
    frame.onload=function(){postFrame({type:"moon-cart:boot",save:readSave(c.id),list:gameList()});};
    frame.srcdoc=cartEntry(c);
    $("#save-caption").textContent="存档：LOCAL / "+c.id;
    if(!quiet)toast("已启动「"+c.title+"」· Esc 回卡带菜单");
  }else{
    showLayer("msg");
    layers.msg.innerHTML="<div style='font:700 18px/1.6 var(--font-ui)'>"+esc(c.title)+"</div><small>这个游戏位尚未装载内容</small>";
  }
}
function setMode(m,quiet){
  mode=(m==="tavern")?"tavern":"arcade";
  document.body.setAttribute("data-mode",mode);
  $("#mode-tavern").setAttribute("aria-pressed",String(mode==="tavern"));
  $("#mode-arcade").setAttribute("aria-pressed",String(mode==="arcade"));
  $("#mode-name").textContent=mode==="arcade"?"模拟器":"酒馆内部系统";
  $("#chip-mode").textContent=mode.toUpperCase();
  $("#tavern-view").style.opacity=mode==="tavern"?"1":".55";
  if(mode==="arcade"){
    if(quiet){goHome(true);}
    else{bootSequence().then(function(){ if(mode==="arcade") goHome(true); });}
  }else goOs(true);
  if(!quiet)toast(mode==="arcade"?"街机模式：屏幕切成模拟器":"酒馆模式：屏幕显示内部系统");
}
$("#mode-tavern").addEventListener("click",function(){setMode("tavern");});
$("#mode-arcade").addEventListener("click",function(){setMode("arcade");});
$("#home-btn").addEventListener("click",function(){setMode("tavern");});
$("#menu-btn").addEventListener("click",function(){setMode("arcade");});
$("#home-from-byor").addEventListener("click",function(){goHome();});

function renderOs(){
  var on=wbEntries.filter(function(e){return !e.disable;});
  $("#os-wb").textContent=wbEntries.length+" 条 · 已启用 "+on.length;
  $("#chip-wb").textContent="WB "+on.length;
  $("#os-clock").textContent="皮肤 "+skinObj.name+" · 金手指 "+(cheatOn?"ON":"OFF");
  $("#os-moon").textContent=cheatOn?"上弦月 · 世界书已接入":"上弦月 · 运行中";
  var feed=$("#os-feed");if(!feed)return;
  var items=on.length?on.slice(0,5).map(function(e){
    return "<li>"+esc(e.comment)+"<span>"+esc((e.key||[]).slice(0,2).join(" / "))+"</span></li>";
  }).join(""):"<p>金手指开启并转写后，这里会列出真正写进剧情的条目。</p>";
  var states=[["月相时钟","运行中"],["存档桥",(bridge&&bridge.name)||"—"],
    ["世界书键",wbKey().slice(-20)],["皮肤",skinObj.name],["金手指",cheatOn?"ON":"OFF"]];
  feed.innerHTML='<div class="cell"><h5>已启用世界书条目 / '+on.length+'</h5>'+(on.length?"<ul>"+items+"</ul>":items)+'</div>'
    +'<div class="cell"><h5>系统状态 / LINK</h5><ul>'
    +states.map(function(s){return "<li>"+esc(s[0])+"<span>"+esc(s[1])+"</span></li>";}).join("")+'</ul></div>';
}
var OS_DETAIL={
  moon:"<b>月相系统</b> · 时钟、阶段与关系数值沿用 4.8.22 的核心逻辑；切模式不会重置存档。",
  chars:"<b>角色与建档</b> · 复用酒馆建档的候选扫描（世界书 / 角色卡 / 聊天）与数值写入字段。",
  worldbook:"<b>世界书</b> · 金手指把存档里的同行、配招、道具、羁绊转写成 world_info.entries，条目可折叠、可停用、可导出。点顶栏「世界书」进编辑页。",
  timeline:"<b>时间线</b> · 事件导演与开局建档写同一份 stat_data；特殊事件条目会被写进剧情注入位。",
  galgame:"<b>沉浸模式</b> · v4.8.20 的剧本稿 / 电影字幕样式：无卡片、宋黑分工、铜色强调。",
  arcade:"<b>街机模式</b> · 拨到街机就是卡带菜单；老游戏插自己的卡带，运行核心用 attachCore() 接开源 WASM。"
};
$("#os-grid").addEventListener("click",function(e){
  var b=e.target.closest("[data-os]");if(!b)return;
  var k=b.dataset.os;
  if(k==="arcade"){setMode("arcade");return;}
  if(k==="worldbook"){openWorldBook();return;}
  $("#os-detail").innerHTML=OS_DETAIL[k]||OS_DETAIL.moon;
});

/* ── ④ 卡带：顶部卡槽状态 + 真 GBA 头部 / 32MB 汉化改版 / SHA-1 / 核心交接 ── */
function renderCartSlot(){
  var slot=$("#cart-slot"),label=$("#cart-label"),hint=$("#cart-hint");
  if(!slot||!label)return;
  if(lastRom){
    slot.classList.add("loaded");
    label.textContent=(String(lastRom.title||"").replace(/\.+$/,"").trim())||lastRom.name||"CARTRIDGE";
    hint.textContent=lastRom.sizeMB+" MB";
  }else{
    slot.classList.remove("loaded");
    label.textContent="NO CARTRIDGE";
    hint.textContent="插入卡带";
  }
}
$("#cart-slot").addEventListener("click",function(){
  if(lastRom)insert("rom.slot.byor");else $("#rom-file").click();
});
var SAVE_DB={BPEE:"FLASH 128KB（rom_config.ini: flashSize=128k）",BPRE:"FLASH 128KB（FireRed）",
  BPEJ:"FLASH 128KB（日版）",BPGJ:"FLASH 128KB",AXVE:"FLASH 128KB",AXPE:"FLASH 128KB"};
function parseGBAHeader(buf,name){
  var size=buf.byteLength,u8=new Uint8Array(buf,0,Math.min(0xC0,size));
  var s=function(a,b){var o="";for(var i=a;i<b&&i<u8.length;i++){var c=u8[i];o+=(c>=32&&c<127)?String.fromCharCode(c):".";}return o;};
  var title=s(0xA0,0xAC),code=s(0xAC,0xB0),maker=s(0xB0,0xB2);
  var fixed=u8[0xB2],op=u8[3],stored=u8[0xBD];
  var neg=0;for(var i=0xA0;i<=0xBC;i++)neg=(neg-u8[i])&255;
  var calc=(neg-0x19)&255;
  // 直接在字节上扫 ASCII 签名：原来逐字符拼 1MB 字符串再 indexOf，32MB 改版要 64ms
  var n=Math.min(1024*1024,size),head=new Uint8Array(buf,0,n);
  var SCAN=Math.min(head.length,524288);            // 存档库签名都在 ROM 前部，512KB 足够
  function findAscii(sig){
    var m=sig.length,first=sig.charCodeAt(0);
    for(var i=0;i+m<=SCAN;i++){
      if(head[i]!==first)continue;
      var k=1;for(;k<m;k++){if(head[i+k]!==sig.charCodeAt(k))break;}
      if(k===m)return i;
    }
    return -1;
  }
  var found=[];
  ["FLASH1M_V","FLASH512_V","FLASH_V","EEPROM_V","SRAM_F_V","SRAM_V","FLASH","EEPROM","SRAM"].forEach(function(p){
    if(found.length<3&&findAscii(p)>=0)found.push(p);
  });
  var pow2=size>=1048576&&size<=64*1048576&&(size&(size-1))===0;
  return {name:name,size:size,sizeMB:+(size/1048576).toFixed(2),sizeOK:pow2,
    title:title,code:code,maker:maker,fixed:fixed,opcode:op,
    headerOK:(fixed===0x96&&op===0xEA),
    checksumOK:stored===calc,stored:"0x"+stored.toString(16).padStart(2,"0"),
    expected:"0x"+calc.toString(16).padStart(2,"0"),
    saveType:SAVE_DB[code]||(found.length?found.join(" / "):"未识别（需核心探测）"),
    signatures:found};
}
function renderRomCard(m,hash){
  var card=$("#rom-card");card.hidden=false;
  card.innerHTML='<dl>'
    +'<dt>文件</dt><dd>'+esc(m.name)+'</dd>'
    +'<dt>容量</dt><dd>'+m.size.toLocaleString()+' B / '+m.sizeMB+' MB '+(m.sizeOK?'· 合法 GBA 容量':'· 非 2 的幂，仍可交给核心')+'</dd>'
    +'<dt>标题 / 代码</dt><dd>'+esc(m.title)+' / '+esc(m.code)+' / '+esc(m.maker)+'</dd>'
    +'<dt>头部标识</dt><dd>'+(m.headerOK?'<span class="ok">固定字节 0x96 + ARM 跳转 ✓</span>':'<span class="bad">未通过</span>')+'</dd>'
    +'<dt>头部校验和</dt><dd>'+(m.checksumOK?'<span class="ok">一致 '+m.stored+'</span>':'<span class="bad">原厂 '+m.stored+' / 计算 '+m.expected+'（汉化改版常见，不拒绝装载）</span>')+'</dd>'
    +'<dt>存档类型</dt><dd>'+esc(m.saveType)+'</dd>'
    +'<dt>SHA-1</dt><dd>'+esc(hash)+'</dd>'
    +'</dl>';
}
function drawCoreView(){
  var cv=$("#core-canvas");if(!cv)return;
  /* 真实核心自己在画 240×160，这里只负责没有真实核心时的占位信息页 */
  if(core&&core.real&&coreBooted)return;
  var g=cv.getContext("2d");g.setTransform(2,0,0,2,0,0);
  var t=skinObj.tokens;
  g.fillStyle=t.lcd;g.fillRect(0,0,240,160);
  g.fillStyle=t.ink;g.fillRect(0,0,240,20);
  g.fillStyle=mixHex(t.lcd,"#ffffff",.55);g.font="bold 10px monospace";
  g.fillText("MOON POCKET / CORE",6,13);
  g.fillStyle=t.ink;g.font="10px monospace";
  g.fillText("CORE  "+(core?core.name:"—"),8,38);
  g.fillText("LIC   "+(core?core.license:"—"),8,52);
  g.fillStyle=rgba(t.ink,.28);g.fillRect(8,60,224,1);
  if(lastRom){
    g.fillStyle=t.ink;g.font="10px monospace";
    g.fillText("ROM   LOADED (本机)",8,76);
    g.fillText("SIZE  "+lastRom.sizeMB+" MB / "+lastRom.code,8,90);
    g.fillText("SAVE  "+String(lastRom.saveType).split("（")[0].slice(0,24),8,102);
    g.font="8px monospace";
    g.fillText("SHA-1 "+lastRom.hash.slice(0,24),8,116);
    g.fillText("      "+lastRom.hash.slice(24),8,126);
    g.font="9px monospace";
    g.fillText("演示核心：不模拟游戏，仅验证装载链路",8,140);
  }else{
    g.fillStyle=t.ink;g.font="10px monospace";
    g.fillText("ROM   WAITING",8,78);
    g.font="9px monospace";g.fillText("回卡带页，插一张卡带交给核心",8,96);
    g.fillText("演示核心：不模拟游戏，仅验证装载链路",8,140);
  }
  g.fillStyle=t.ink;g.fillRect(0,148,240,12);
  g.fillStyle=mixHex(t.lcd,"#ffffff",.55);g.font="9px monospace";
  g.fillText("自带 ROM · 开源核心 · 无第三方资产",5,157);
}

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
      var ret = M._emuLoadROM(buf.length);
      M._emuResetCpu();
      coreBooted = true;
      coreStart();
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

/* ── ⑥ 世界书：酒馆 world_info.entries 结构 + 折叠编辑 + 导出 ─────────── */
/* 酒馆 world_info 条目的这几个字段是数值型，会被拼进编辑器的 input/属性里。
   导入别人改过的世界书时，字符串型数值能变成注入点，所以在这里统一收敛：
   只取整数 + 夹到酒馆自己的合法区间，非数字直接退回默认值。 */
function clampInt(v,lo,hi,dflt){
  var n=Number(v);
  if(!isFinite(n))return dflt;
  n=Math.round(n);
  return n<lo?lo:(n>hi?hi:n);
}
function stEntry(uid,key,comment,content,extra){
  var e={uid:uid,key:key,keysecondary:[],comment:comment,content:content,
    constant:false,selective:true,order:100+uid,position:0,disable:false,
    addMemo:true,excludeRecursion:false,preventRecursion:false,delayUntilRecursion:false,
    probability:100,useProbability:true,depth:4,group:"",groupOverride:false,groupWeight:100,
    scanDepth:null,caseSensitive:null,matchWholeWords:null,useGroupScoring:null,
    automationId:"",role:null,vectorized:false,triggers:[],ignoreBudget:false};
  var merged=Object.assign(e,extra||{});
  merged.uid=clampInt(merged.uid,0,999999,0);
  merged.order=clampInt(merged.order,0,99999,100);
  merged.position=clampInt(merged.position,0,4,0);
  merged.depth=clampInt(merged.depth,0,9999,4);
  merged.probability=clampInt(merged.probability,0,100,100);
  merged.groupWeight=clampInt(merged.groupWeight,1,10000,100);
  if(typeof merged.content!=="string")merged.content=String(merged.content==null?"":merged.content);
  if(!Array.isArray(merged.key))merged.key=merged.key==null?[]:[String(merged.key)];
  return merged;
}
function lines(a){return (a||[]).filter(Boolean).map(function(x){return "· "+x;}).join("\n");}
function makeEntries(s){
  var t=s.trainer||{},party=s.party||[],bag=s.bag||[],bonds=s.bonds||[],events=s.events||[],out=[],u=0;
  out.push(stEntry(u++,["训练家",t.name||"玩家","我","存档"],"[口袋] 训练家档案",
    "【训练家档案】\n名："+(t.name||"未知")+"｜ID："+(t.id||"—")+"\n徽章："+(t.badges==null?"—":t.badges)
    +"｜游玩时长："+(t.playtime||"—")+"｜零用钱："+(t.money==null?"—":t.money)
    +"\n当前地点："+(t.location||"—")+"\n数据源："+(s.source||"存档桥")));
  var roster=party.map(function(p,i){return (i+1)+". "+(p.nickname||p.species)+"（"+(p.species||"—")+"）Lv."+(p.level||"—");}).join("\n");
  out.push(stEntry(u++,["队伍","同行","宝可梦","伙伴"],"[口袋] 同行队伍",
    "【同行队伍】共 "+party.length+" 只\n"+roster+"\n剧情中使用队伍资料时，以这份名单与下面各条目为准。"));
  party.forEach(function(p){
    var nick=p.nickname||p.species||"伙伴";
    var keys=[nick,p.species||"伙伴",(p.species||"伙伴")+"配招","配招"];
    var body="【"+(p.species||"伙伴")+"｜"+nick+"】\n等级："+(p.level||"—")+"｜性别："+(p.gender||"—")
      +"｜性格："+(p.nature||"—")+"｜特性："+(p.ability||"—")
      +"\n携带道具："+(p.item||"无")
      +"\n配招："+((p.moves||[]).join(" / ")||"—")
      +"\n羁绊："+(p.bond||"暂无记录")
      +"\n特殊事件：\n"+(lines(p.events)||"· 暂无记录");
    out.push(stEntry(u++,keys,"[口袋] 宝可梦 · "+nick,body,{order:110+u,depth:3}));
  });
  var moveTable=party.map(function(p){return (p.nickname||p.species)+"："+((p.moves||[]).join(" / ")||"—");}).join("\n");
  out.push(stEntry(u++,["配招","招式","技能","战斗"],"[口袋] 配招总表",
    "【配招总表｜直接套用玩家存档】\n"+moveTable+"\n描写战斗时按上表取招，不得自行替换或新增招式。"));
  out.push(stEntry(u++,["道具","背包","携带","物品"],"[口袋] 背包与道具",
    "【背包与道具】\n"+(bag.map(function(x){return "· "+x.name+" ×"+x.count;}).join("\n")||"· 空")));
  out.push(stEntry(u++,["羁绊","回忆","特殊事件","往事"],"[口袋] 羁绊与特殊事件",
    "【羁绊】\n"+(lines(bonds)||"· 暂无")
    +"\n【特殊事件】\n"+(lines(events)||"· 暂无")
    +"\n这些是玩家实际游玩中发生的事，剧情里可以引用，不得改写结局。"));
  if(s.rom||s.save){
    var r=s.rom||lastRom||{},sv=s.save||{};
    out.push(stEntry(u++,["存档","进度","ROM","游戏版本"],"[口袋] 存档与版本",
      "【存档与版本】\nROM："+(r.title||"—")+" / "+(r.code||"—")+"｜容量："+(r.sizeMB||"—")+" MB"
      +"\n存档类型："+(r.saveType||"—")+"｜SHA-1："+(r.hash||"—")
      +"\n扇区："+(sv.sectors==null?"—":sv.sectors)+"｜校验通过："+(sv.valid==null?"—":sv.valid)
      +"\n"+(sv.note||"")));
  }
  return out;
}
var NARRATOR_SYS="你是游戏存档资料的整理员。把给定的结构化资料改写成可供剧情引用的世界书条目正文，只做整理与归纳，不新增事实、不虚构事件、不评价。只输出正文，不要标题、不要 JSON、不要解释。";
async function buildWorldBook(snapshot){
  lastSnapshot=snapshot;
  var entries=makeEntries(snapshot);
  if(narrator){
    for(var i=0;i<entries.length;i++){
      try{
        var text=await narrator(NARRATOR_SYS,"条目："+entries[i].comment+"\n关键词："+entries[i].key.join("、")+"\n原始资料：\n"+entries[i].content);
        if(text&&typeof text==="string"&&text.trim())entries[i].content=text.trim();
      }catch(e){/* 转写失败保留确定性版本，不让链路断掉 */}
    }
  }
  wbEntries=entries;saveWorldBook();return entries;
}
function wbKey(){return WB_PREFIX+chatId;}
function saveWorldBook(){try{LS.setItem(wbKey(),JSON.stringify(wbEntries));}catch(e){}renderOs();}
function loadWorldBook(){try{wbEntries=JSON.parse(LS.getItem(wbKey())||"[]")||[];}catch(e){wbEntries=[];}renderOs();}
function bindNarrator(fn){if(fn&&typeof fn!=="function")throw new Error("转写 API 必须是函数");narrator=fn;return narrator;}
function getInjectedWorldInfo(){
  return wbEntries.filter(function(e){return !e.disable;})
    .sort(function(a,b){return (a.order||100)-(b.order||100);})
    .map(function(e){return "【"+e.comment+"】\n"+e.content;}).join("\n\n");
}
function collectEditor(){
  return $$(".wb-entry").map(function(d){
    var uid=Number(d.dataset.uid);
    var e=wbEntries.find(function(x){return x.uid===uid;})||stEntry(uid,[],"","");
    e.comment=d.querySelector(".f-comment").value;
    e.key=d.querySelector(".f-key").value.split(/[,，、]/).map(function(s){return s.trim();}).filter(Boolean);
    e.keysecondary=d.querySelector(".f-key2").value.split(/[,，、]/).map(function(s){return s.trim();}).filter(Boolean);
    e.content=d.querySelector(".f-content").value;
    e.order=Number(d.querySelector(".f-order").value)||100;
    e.disable=!d.querySelector(".f-enable").checked;
    e.constant=d.querySelector(".f-constant").checked;
    e.selective=!e.constant;
    return e;
  });
}
function renderWorldBook(){
  var list=$("#wb-list");
  list.innerHTML=wbEntries.map(function(e,i){
    return '<details class="wb-entry" data-uid="'+e.uid+'"'+(i===0?" open":"")+'>'
      +'<summary><span class="uidx">'+String(i+1).padStart(2,"0")+'</span>'
      +'<span class="ttl">'+esc(e.comment)+'</span>'
      +'<span class="pill'+(e.disable?"":" on")+'">'+(e.disable?"已停用":"启用中")+'</span></summary>'
      +'<div class="wb-fields">'
      +'<label>条目标题 / comment<input class="f-comment" value="'+esc(e.comment)+'"></label>'
      +'<label>插入顺序 / order<input class="f-order" type="number" min="0" max="999" value="'+(e.order||100)+'"></label>'
      +'<label class="wide">主关键词 / key（逗号分隔）<input class="f-key" value="'+esc((e.key||[]).join("，"))+'"></label>'
      +'<label class="wide">次要关键词 / keysecondary<input class="f-key2" value="'+esc((e.keysecondary||[]).join("，"))+'"></label>'
      +'<label class="wide">条目正文 / content<textarea class="f-content" rows="6">'+esc(e.content)+'</textarea></label>'
      +'<div class="checks"><label><input class="f-enable" type="checkbox"'+(e.disable?"":" checked")+'> 启用此条</label>'
      +'<label><input class="f-constant" type="checkbox"'+(e.constant?" checked":"")+'> 恒定注入</label>'
      +'<span>position '+(e.position||0)+' · depth '+(e.depth||4)+'</span></div>'
      +'<button type="button" class="del" data-del="'+e.uid+'">删除此条目</button>'
      +'</div></details>';
  }).join("");
  updateWbMeta();
}
function updateWbMeta(){
  var enabled=wbEntries.filter(function(e){return !e.disable;}).length;
  $("#wb-count").textContent=wbEntries.length;$("#wb-enabled").textContent=enabled;
  $("#wb-key").textContent=wbKey();
  $("#wb-source").textContent=(lastSnapshot&&lastSnapshot.source)||"本机存档";
  $("#wb-inject").textContent=getInjectedWorldInfo()||"（还没有启用的条目）";
  $("#wb-enable-all").checked=wbEntries.length>0&&enabled===wbEntries.length;
  renderOs();
}
function openWorldBook(){
  if(!wbEntries.length){toast("还没有世界书条目，先开启金手指转写一次",true);return;}
  renderWorldBook();$("#wb-overlay").hidden=false;
}
$("#wb-btn").addEventListener("click",openWorldBook);
$("#wb-open-rail").addEventListener("click",openWorldBook);
$("#wb-close").addEventListener("click",function(){$("#wb-overlay").hidden=true;});
$("#wb-save-btn").addEventListener("click",function(){wbEntries=collectEditor();saveWorldBook();renderWorldBook();toast("已保存 "+wbEntries.length+" 条世界书 · 剧情里可直接调用");});
$("#wb-enable-all").addEventListener("change",function(e){wbEntries=collectEditor();wbEntries.forEach(function(x){x.disable=!e.target.checked;});saveWorldBook();renderWorldBook();});
$("#wb-list").addEventListener("click",function(e){
  var b=e.target.closest("[data-del]");if(!b)return;
  wbEntries=collectEditor();wbEntries=wbEntries.filter(function(x){return x.uid!==Number(b.dataset.del);});
  saveWorldBook();renderWorldBook();toast("条目已删除");
});
$("#wb-rebuild").addEventListener("click",function(){$("#wb-overlay").hidden=true;runConvert();});
$("#wb-export-btn").addEventListener("click",function(){
  wbEntries=collectEditor();saveWorldBook();
  var out={name:"口袋世界书 · "+chatId,entries:{}};
  wbEntries.forEach(function(e){out.entries[String(e.uid)]=e;});
  downloadJSON(out,"口袋世界书-"+chatId+".json");toast("已导出酒馆 world_info 格式 JSON");
});
$("#wb-import-btn").addEventListener("click",function(){$("#wb-file").click();});
$("#wb-file").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    try{
      var o=JSON.parse(String(r.result));var src=o.entries||o;
      var arr=Object.keys(src).map(function(k){return src[k];}).filter(function(x){return x&&typeof x==="object";});
      if(!arr.length)throw new Error("没有 entries");
      wbEntries=arr.map(function(x,i){return Object.assign(stEntry(i,[],"",""),x,{uid:i});});
      saveWorldBook();renderWorldBook();toast("已导入 "+wbEntries.length+" 条世界书条目");
    }catch(err){toast("导入失败："+err.message,true);}
  };
  r.readAsText(f,"utf-8");e.target.value="";
});
function downloadJSON(o,name){
  var blob=new Blob([JSON.stringify(o,null,2)],{type:"application/json"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);},2000);
}
async function runConvert(){
  var snap;
  try{snap=await (bridge?bridge.readSnapshot():defaultSnapshot());}
  catch(err){toast("读取存档失败："+err.message,true);return;}
  snap=snap||defaultSnapshot();
  if(lastRom&&!snap.rom)snap.rom={title:lastRom.title,code:lastRom.code,sizeMB:lastRom.sizeMB,saveType:lastRom.saveType,hash:lastRom.hash};
  toast(narrator?"正在调用脚本内接的转写 API…":"正在把存档转写成世界书条目…");
  await buildWorldBook(snap);
  $("#wb-overlay").hidden=false;renderWorldBook();
  toast("转写完成："+wbEntries.length+" 条，可折叠修改、启用或导出");
}
/* 金手指：首次开启弹窗 → 确认后转写 → 编辑页 */
function enableCheat(on){
  cheatOn=!!on;document.body.setAttribute("data-cheat",cheatOn?"on":"off");
  $("#cheat-btn").classList.toggle("on",cheatOn);
  $("#cheat-btn").setAttribute("aria-pressed",String(cheatOn));
  $("#chip-cheat").textContent="CHEAT "+(cheatOn?"ON":"OFF");
  $("#chip-cheat").classList.toggle("hot",cheatOn);
  renderOs();
  if(!cheatOn){toast("金手指已关闭 · 已保存的世界书仍可编辑，但不再自动转写");return;}
  var asked=LS.getItem(FLAG_PREFIX+"cheat-asked");
  if(asked){toast("金手指已开启 · 点顶栏「世界书」查看条目");return;}
  $("#cheat-src").textContent="数据源："+((bridge&&bridge.name)||"内置示例存档（原创）")
    +" · 读取训练家 / 同行 / 配招 / 道具 / 羁绊 / 特殊事件";
  $("#cheat-overlay").hidden=false;
}
$("#cheat-btn").addEventListener("click",function(){enableCheat(!cheatOn);});
$("#cheat-yes").addEventListener("click",function(){
  LS.setItem(FLAG_PREFIX+"cheat-asked","1");$("#cheat-overlay").hidden=true;runConvert();
});
$("#cheat-no").addEventListener("click",function(){
  LS.setItem(FLAG_PREFIX+"cheat-asked","1");$("#cheat-overlay").hidden=true;
  toast("已跳过转写 · 之后点「世界书 → 重新转写」可随时生成");
});

/* ══════════════════════════════════════════════════════════════════════
   金手指台（GOLDEN LINK）
   ─ 一键宏：直接替玩家按键，落在 coreKeys 上，不碰游戏数据
   ─ 代码：CBA「XXXXXXXX YYYY」/ GSA「XXXXXXXXYYYYYYYY」都收，交给核心的
           _emuAddCheat；核心拒收会当场说清楚（返回 -1），不假装成功
   ─ 体检：往 EWRAM 尾巴写 4 个半字魔法值，跑一帧后在整个 wasm 堆里搜这 8 个字节。
           搜到 = 引擎真的在写模拟内存；搜不到 = 这个核心构建的作弊接口是哑的。
           之所以要体检：核心自带的接口加了代码不报错也不生效，光看返回值看不出来。
   ══════════════════════════════════════════════════════════════════════ */
var CHEAT_CODES_KEY = "moon-pocket-cheat-codes-v1";
var cheatCodes = [], cheatEngine = null, cheatMashTimer = 0, cheatHoldTimer = 0;
var CHEAT_SPEEDS = [1, 2, 4];
var CHEAT_PROBE_ADDR = 0x203fff0;   /* EWRAM 尾巴，一般没人用 */

function cheatLoad(){
  try{
    var raw = LS.getItem(CHEAT_CODES_KEY);
    if(raw){ var arr = JSON.parse(raw); if(arr && arr.length) cheatCodes = arr; }
  }catch(e){}
}
function cheatSave(){
  try{ LS.setItem(CHEAT_CODES_KEY, JSON.stringify(cheatCodes.slice(0, 40))); }catch(e){}
}
/* 把一条代码写进核心的金手指文本缓冲，再让核心解析 */
function cheatPush(code){
  var M = coreModule;
  if(!M || !coreBooted) return { ok:false, ret:null, msg:"核心还没跑起来" };
  if(typeof M._emuAddCheat !== "function") return { ok:false, ret:null, msg:"这个核心没有导出金手指接口" };
  var text = String(code || "").replace(/\s+/g, " ").trim().toUpperCase();
  if(!text) return { ok:false, ret:null, msg:"代码是空的" };
  if(text.length > 120) return { ok:false, ret:null, msg:"代码太长" };
  var ptr = M._emuGetSymbol(4);
  var bytes = new TextEncoder().encode(text + "\0");
  M.HEAPU8.fill(0, ptr, ptr + 512);
  M.HEAPU8.set(bytes, ptr);
  var ret;
  try{ ret = M._emuAddCheat(ptr); }catch(e){ return { ok:false, ret:null, msg:"核心抛错：" + e.message }; }
  return { ok: ret >= 0, ret: ret, msg: ret >= 0 ? "核心受理了（返回 " + ret + "）" : "核心拒收（返回 " + ret + "），检查位数：CBA 12 位、GSA 16 位" };
}

/* 体检：魔法字节写进 EWRAM 尾巴 → 跑一帧 → 整个堆里找这 8 个字节 */
function cheatSelfTest(done){
  var M = coreModule;
  if(!M || !coreBooted){ cheatEngine = { ok:null, msg:"核心还没跑起来，插卡后再体检" }; if(done) done(cheatEngine); return; }
  var magic = [0xdead, 0xbeef, 0xcafe, 0xf00d], accepted = 0;
  for(var i = 0; i < magic.length; i++){
    var addr = (CHEAT_PROBE_ADDR + i * 2).toString(16).padStart(7, "0");
    var r = cheatPush("1" + addr + " " + magic[i].toString(16).padStart(4, "0"));
    if(r.ok) accepted++;
  }
  try{ M._emuRunFrame(coreKeys); }catch(e){}
  var needle = [0xad, 0xde, 0xef, 0xbe, 0xfe, 0xca, 0x0d, 0xf0];
  var H = M.HEAPU8, CHUNK = 8 * 1024 * 1024, pos = 0;
  (function step(){
    try{
      var end = Math.min(H.length, pos + CHUNK);
      for(var i = pos; i < end; i++){
        if(H[i] !== needle[0]) continue;
        var okAll = true;
        for(var k = 1; k < 8; k++){ if(H[i + k] !== needle[k]){ okAll = false; break; } }
        if(okAll){
          cheatEngine = { ok:true, at:i, accepted:accepted,
            msg:"核心写内存可用（已实测：第 " + i + " 字节处找到了探针）" };
          if(done) done(cheatEngine); return;
        }
      }
    }catch(e){ /* 堆在扫描中长大过：当作没找到 */ }
    pos += CHUNK;
    if(pos < H.length) setTimeout(step, 0);
    else{
      cheatEngine = { ok:false, accepted:accepted,
        msg:"核心的金手指接口是哑的：代码解析通过（" + accepted + "/4 条受理），但内存一个字节都没变。开了也不会无敌。" };
      if(done) done(cheatEngine);
    }
  })();
}

function cheatRender(){
  var note = $("#gt-engine");
  if(note){
    if(!cheatEngine || cheatEngine.ok === null){ note.className = "gt-note"; note.textContent = "正在体检核心…"; }
    else{
      note.className = "gt-note " + (cheatEngine.ok ? "ok" : "bad");
      note.innerHTML = "<b>" + (cheatEngine.ok ? "能开" : "开不了") + "</b> · " + esc(cheatEngine.msg);
    }
  }
  var list = $("#gt-list");
  if(list){
    list.innerHTML = cheatCodes.length ? cheatCodes.map(function(c){
      var r = c.ret === undefined || c.ret === null ? "" : (c.ret >= 0 ? " ✔" : " ✘");
      return '<li><code class="' + (c.ret >= 0 ? "" : "bad") + '">' + esc(c.code) + r + '</code>'
        + '<button type="button" data-cheat-re="' + esc(c.code) + '">重发</button>'
        + '<button type="button" data-cheat-del="' + esc(c.code) + '">删</button></li>';
    }).join("") : '<li style="opacity:.6;border:0"><code>还没有代码。CBA 写法形如 12025BC0 03E7。</code></li>';
  }
}

function cheatAdd(raw){
  var text = String(raw || "").replace(/\s+/g, " ").trim().toUpperCase();
  if(!text) return;
  var r = cheatPush(text);
  cheatCodes = cheatCodes.filter(function(c){ return c.code !== text; });
  cheatCodes.unshift({ code:text, ret:r.ret });
  cheatSave(); cheatRender();
  toast(r.msg, !r.ok);
}

/* 一键宏：只是替玩家按键 */
function cheatHold(bit, ms){
  coreKeys |= (1 << bit);
  clearTimeout(cheatHoldTimer);
  cheatHoldTimer = setTimeout(function(){ coreKeys &= ~(1 << bit); }, ms);
}
function cheatMacro(name, btn){
  if(!coreModule || !coreBooted){ toast("核心还没跑起来 · 先插一张卡带", true); return; }
  if(name === "menu"){ cheatHold(KEY_BIT.start, 260); toast("替你按了 START"); }
  else if(name === "mash"){
    if(cheatMashTimer){ clearInterval(cheatMashTimer); cheatMashTimer = 0; btn.classList.remove("on"); toast("停止连打"); return; }
    cheatMashTimer = setInterval(function(){ cheatHold(KEY_BIT.a, 70); }, 190);
    btn.classList.add("on"); toast("开始连打 A · 再点一次停");
  }
  else if(name === "speed"){
    var i = (CHEAT_SPEEDS.indexOf(cheatSpeed) + 1) % CHEAT_SPEEDS.length;
    cheatSpeed = CHEAT_SPEEDS[i];
    if(btn && btn.childNodes[0]) btn.childNodes[0].nodeValue = "加速 ×" + cheatSpeed;
    toast("倍速 ×" + cheatSpeed);
  }
  else if(name === "pause"){
    corePaused = !corePaused;
    var p = $("#emu-pause"); if(p) p.textContent = corePaused ? "继续" : "暂停";
    toast(corePaused ? "已暂停" : "继续");
  }
}

cheatLoad();
$("#emu-cheat").addEventListener("click", function(){
  showLayer("cheat"); cheatRender();
  if(!cheatEngine) cheatSelfTest(function(){ cheatRender(); });
});
$("#gt-back").addEventListener("click", function(){ showLayer("core"); });
$("#gt-apply").addEventListener("click", function(){
  var box = $("#gt-code"); if(!box) return;
  var lines = box.value.split(/\n+/).map(function(x){ return x.trim(); }).filter(Boolean);
  if(!lines.length){ toast("先写一条代码", true); return; }
  lines.forEach(cheatAdd);
  box.value = "";
});
$("#gt-test").addEventListener("click", function(){
  cheatEngine = null; cheatRender();
  cheatSelfTest(function(){ cheatRender(); });
});
$("#gt-clear").addEventListener("click", function(){
  cheatCodes = []; cheatSave(); cheatRender(); toast("已清空代码列表（游戏里已生效的不会撤回）");
});
$("#gt-list").addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b) return;
  if(b.dataset.cheatRe){ cheatAdd(b.dataset.cheatRe); return; }
  if(b.dataset.cheatDel){
    cheatCodes = cheatCodes.filter(function(c){ return c.code !== b.dataset.cheatDel; });
    cheatSave(); cheatRender();
  }
});
$(".gt-grid").addEventListener("click", function(e){
  var b = e.target.closest("button[data-macro]"); if(!b) return;
  cheatMacro(b.dataset.macro, b);
});
/* 掌机开机时顺手体检一次：不打扰玩家，只把结论放在面板上 */
window.POCKET_CHEAT = { push:cheatPush, test:cheatSelfTest, codes:function(){ return cheatCodes.slice(); },
  engine:function(){ return cheatEngine; }, speed:function(){ return cheatSpeed; } };

/* ── 美化抽屉 ─────────────────────────────────────────────────────────── */
function renderPresets(){
  $("#skin-presets").innerHTML=BUILTIN_SKINS.map(function(s){
    var t=s.tokens;
    return '<button type="button" class="skin-preset" data-id="'+esc(s.id)+'">'
      +'<span class="sw"><i style="background:'+t.bg+'"></i><i style="background:'+t.surface2+'"></i><i style="background:'+t.accent+'"></i><i style="background:'+t.lcd+'"></i></span>'
      +'<span><b>'+esc(s.name)+'</b><small>'+esc(s.id)+' · '+esc(s.license)+'</small></span></button>';
  }).join("");
}
$("#skin-presets").addEventListener("click",function(e){
  var b=e.target.closest("[data-id]");if(!b)return;
  var s=BUILTIN_SKINS.find(function(x){return x.id===b.dataset.id;});
  if(s){applySkin(s);toast("已套用皮肤「"+s.name+"」");}
});
$("#skin-btn").addEventListener("click",function(){$("#skin-drawer").hidden=false;});
$("#skin-close").addEventListener("click",function(){$("#skin-drawer").hidden=true;});
$("#skin-reset").addEventListener("click",function(){applySkin(DEFAULT_SKIN);toast("已恢复黑粉默认");});
$("#skin-export-btn").addEventListener("click",function(){downloadJSON(skinObj,skinObj.id+".moonskin.json");toast("已导出 moon-skin v1 皮肤");});
$("#skin-import-btn").addEventListener("click",function(){$("#skin-file").click();});
$("#skin-file").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    try{var s=applySkin(JSON.parse(String(r.result)));toast("已导入皮肤「"+s.name+"」");}
    catch(err){toast("皮肤导入被拒："+err.message,true);}
  };
  r.readAsText(f,"utf-8");e.target.value="";
});
$("#skin-art-btn").addEventListener("click",function(){$("#skin-art-file").click();});
$("#skin-art-file").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  if(f.size>2*1024*1024){toast("图案超过 2 MB，本机导入已拒绝",true);e.target.value="";return;}
  var r=new FileReader();
  r.onload=function(){
    var s=JSON.parse(JSON.stringify(skinObj));s.assets=s.assets||{};s.assets.wallpaper=String(r.result);
    s.id="local."+skinObj.id.replace(/^local\./,"");s.name=skinObj.name+" · 本机图案";
    applySkin(s);toast("本机图案已应用 · 只存在这台机器，不随宿主分发");
  };
  r.readAsDataURL(f);e.target.value="";
});
$("#skin-scan").addEventListener("input",function(e){
  var s=JSON.parse(JSON.stringify(skinObj));s.scanline=Number(e.target.value)/100;applySkin(s);
});

/* ── 电源 / 按键 / 消息 ───────────────────────────────────────────────── */
function setPower(on){
  powered=on;consoleEl.classList.toggle("is-on",on);consoleEl.classList.toggle("is-off",!on);
  var b=$("#power-btn");
  if(b){b.setAttribute("aria-checked",String(on));b.setAttribute("aria-pressed",String(on));}
  if(activeId)postFrame({type:"moon-cart:pause",value:!on});
}
$("#power-btn").addEventListener("click",function(){setPower(!powered);});
/* 酒馆模式下的屏内导航：方向键选模块，A 进，SELECT 往下翻设置 */
var osSel=0;
function updateOsHint(){
  var sc=document.querySelector("#tavern-os .sl-scroll"),h=$("#os-hint");
  if(!sc||!h)return;
  h.hidden=(sc.scrollTop+sc.clientHeight)>=(sc.scrollHeight-6);
}
function osKey(b){
  var tiles=[].slice.call(document.querySelectorAll(".os-tile"));
  if(!tiles.length)return;
  var cols=(window.innerWidth<=720)?2:3,n=tiles.length;
  if(b==="right")osSel=(osSel+1)%n;
  else if(b==="left")osSel=(osSel-1+n)%n;
  else if(b==="down")osSel=Math.min(n-1,osSel+cols);
  else if(b==="up")osSel=Math.max(0,osSel-cols);
  else if(b==="a"||b==="start"){osSel=osSel%n;tiles[osSel].click();return;}
  else if(b==="select"){var sc=document.querySelector("#tavern-os .sl-scroll");if(sc)sc.scrollBy({top:Math.round(sc.clientHeight*.8),behavior:"smooth"});return;}
  else return;
  tiles.forEach(function(t,i){t.classList.toggle("sel",i===osSel);});
  tiles[osSel].scrollIntoView({block:"nearest"});
  updateOsHint();
}
var osScroll=document.querySelector("#tavern-os .sl-scroll");
if(osScroll)osScroll.addEventListener("scroll",updateOsHint);

/* 切到街机模式：装载模拟器组件（真实会生成的 3 张内置卡带 + 显示区 + 按键映射） */
var BOOT_STEPS=[["装载模拟器组件…",260],["初始化显示区…",200],["挂载卡带…",240],["校准按键映射…",180]];
function bootSequence(){
  var fill=$("#boot-fill"),line=$("#boot-line"),hint=$("#boot-hint");
  showLayer("boot");
  if(fill)fill.style.width="0%";
  return new Promise(function(res){
    var i=0;
    (function step(){
      if(i>=BOOT_STEPS.length){res();return;}
      if(line)line.textContent=BOOT_STEPS[i][0];
      if(hint)hint.textContent="MOON EMU · "+(i+1)+" / "+BOOT_STEPS.length;
      if(fill)fill.style.width=Math.round((i+1)/BOOT_STEPS.length*100)+"%";
      var d=BOOT_STEPS[i][1];i++;
      setTimeout(step,d);
    })();
  });
}

function press(btn,down){
  var el=document.querySelector('[data-btn="'+btn+'"]');if(el)el.classList.toggle("down",down);
  if(!powered||!activeId)return;
  /* 酒馆模式：按键只操作屏内 UI，不发给游戏；街机模式才当手柄用 */
  if(!layers.os.hidden){ if(down)osKey(btn); return; }
  if(!layers.core.hidden){
    if(core&&typeof core.input==="function"){try{core.input(btn,down);}catch(e){}}
    return;
  }
  if(core&&typeof core.input==="function"){try{core.input(btn,down);}catch(e){}}
  postFrame({type:"moon-cart:input",button:btn,down:down});
}
$$("[data-btn]").forEach(function(b){
  var k=b.getAttribute("data-btn");
  b.addEventListener("pointerdown",function(e){e.preventDefault();press(k,true);});
  ["pointerup","pointerleave","pointercancel"].forEach(function(ev){b.addEventListener(ev,function(){press(k,false);});});
});
var KEYMAP={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",
  KeyZ:"a",KeyX:"b",KeyC:"x",KeyV:"y",Enter:"start",ShiftLeft:"select",Space:"a"};
addEventListener("keydown",function(e){
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.code==="KeyM"){setMode(mode==="arcade"?"tavern":"arcade");return;}
  if(e.code==="KeyH"){setMode("tavern");return;}
  if(e.code==="KeyP"){setPower(!powered);return;}
  if(e.code==="Escape"){
    if(!$("#wb-overlay").hidden){$("#wb-overlay").hidden=true;}
    else if(!$("#skin-drawer").hidden){$("#skin-drawer").hidden=true;}
    else if(!$("#cheat-overlay").hidden){$("#cheat-overlay").hidden=true;}
    else if(mode==="arcade")goHome();else goOs();
    return;
  }
  var k=KEYMAP[e.code];if(k){e.preventDefault();if(!e.repeat)press(k,true);}
});
addEventListener("keyup",function(e){var k=KEYMAP[e.code];if(k)press(k,false);});
addEventListener("message",function(e){
  if(!frameLive)return;var w;try{w=frame.contentWindow;}catch(err){return;}
  if(!w||e.source!==w)return;
  var d=e.data||{};
  if(d.type==="moon-cart:launch"&&activeId==="__home"){insert(String(d.id||""));return;}
  var c=CARTS.find(function(x){return x.id===activeId;});if(!c)return;
  if(d.type==="moon-cart:save")writeSave(c.id,d.data||{});
  else if(d.type==="moon-cart:score"){
    var s=readSave(c.id);s.lastScore=Number(d.score)||0;s.plays=(s.plays||0)+1;writeSave(c.id,s);
  }
});

/* ── 游戏位导入 / 示例 ────────────────────────────────────────────────── */
function validateCart(m){
  if(!m||typeof m!=="object")return "文件不是 JSON 对象";
  if(m.format!=="moon-cart")return "format 必须是 moon-cart";
  if(Number(m.version)!==1)return "version 必须是 1";
  if(!m.id||typeof m.id!=="string")return "缺少 id";
  if(!m.title||typeof m.title!=="string")return "缺少 title";
  if(!["srcdoc","byor","placeholder"].includes(m.runtime))return "runtime 只能是 srcdoc / byor / placeholder";
  if(m.runtime==="srcdoc"&&(typeof m.entry!=="string"||m.entry.length<40))return "srcdoc 游戏位缺少有效 entry";
  if(m.runtime==="srcdoc"&&m.entry.length>400000)return "entry 超过 400 KB，本演示不接收";
  return null;
}
function registerCart(m){
  var at=extraCarts.findIndex(function(x){return x.id===String(m.id);});
  var cart=Object.assign({},m,{no:String(CARTS.length+1).padStart(2,"0")});
  if(at>=0)extraCarts[at]=cart;else extraCarts.push(cart);
  buildCarts();if(activeId==="__home")goHome(true);return cart;
}
$("#import-btn").addEventListener("click",function(){$("#cart-file").click();});
$("#cart-file").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    var m;try{m=JSON.parse(String(r.result));}catch(err){toast("导入失败：JSON 解析错误",true);return;}
    var err=validateCart(m);if(err){toast("导入被拒："+err,true);return;}
    var c=registerCart(m);toast("已加入启动菜单「"+c.title+"」· 许可 "+(m.license||"未声明"));
  };
  r.readAsText(f,"utf-8");e.target.value="";
});
$("#sample-btn").addEventListener("click",function(){
  var demo=Object.assign({},MANIFEST_SAMPLE);
  demo.entry=cartDoc("月相呼吸灯",CANVAS_BODY,[
    'var g=ctx2d();var n=SAVE.n||0,t=0;',
    'function onBoot(s){n=s.n||0;}',
    'function onKey(b,d){if(d&&b==="a"){n++;persist({n:n});report(n);}}',
    'function frame(){t++;g.fillStyle=LCD;g.fillRect(0,0,240,160);',
    ' var r=26+Math.sin(t/22)*9;g.fillStyle=MID;g.beginPath();g.arc(120,72,r+3,0,6.283);g.fill();',
    ' g.fillStyle=HI;g.beginPath();g.arc(120,72,r,0,6.283);g.fill();',
    ' g.fillStyle=INK;g.fillRect(0,0,240,18);g.fillStyle=HI;g.font="10px monospace";',
    ' g.fillText("示例游戏位 · 月相呼吸灯",6,13);g.fillStyle=INK;g.fillText("按 A 计数："+n,72,132);',
    ' g.fillStyle=INK;g.fillRect(0,150,240,10);g.fillStyle=HI;g.font="9px monospace";g.fillText("从 JSON 导入 · Esc 回菜单",5,158);',
    '}var __last=0;function __loop(ts){requestAnimationFrame(__loop);if(document.hidden)return;if(ts-__last<33)return;__last=ts;frame();}requestAnimationFrame(__loop);'
  ].join("\n"));
  downloadJSON(demo,"moon-breath.mooncart.json");toast("示例游戏位已下载，导入后就出现在启动菜单里");
});

/* ── ⑦ 对外 API（月相脚本接进来就用这些） ─────────────────────────────── */
window.MOON_POCKET={
  version:"pocket-v4",
  setMode:function(m){setMode(m,true);},home:goHome,os:goOs,insert:insert,press:press,
  attachCore:attachCore,registerCart:registerCart,getCore:function(){return core;},press:press,
  coreState:function(){return {booted:coreBooted,paused:corePaused,fps:coreFps,module:!!coreModule,keys:coreKeys};},
  storage:LS,
  attachBridge:attachBridge,bindNarrator:bindNarrator,loadSaveFile:loadSaveFile,
  enableCheat:enableCheat,runConvert:runConvert,openWorldBook:openWorldBook,
  getWorldBook:function(){return wbEntries.map(function(e){return Object.assign({},e);});},
  getInjectedWorldInfo:getInjectedWorldInfo,
  setChatId:function(id){chatId=String(id||"local");loadWorldBook();return chatId;},
  getChatId:function(){return chatId;},
  applySkin:applySkin,exportSkin:function(){return JSON.parse(JSON.stringify(skinObj));},
  getSkin:function(){return JSON.parse(JSON.stringify(skinObj));},
  getMode:function(){return mode;},
  getRom:function(){return lastRom?Object.assign({},lastRom):null;},
  list:function(){return CARTS.map(function(c){return {id:c.id,title:c.title,runtime:c.runtime,license:c.license};});},
  resetAskFlag:function(){LS.removeItem(FLAG_PREFIX+"cheat-asked");}
};

/* ── 跑马灯 / 入场 / 开机 ─────────────────────────────────────────────── */
var TICKER_ITEMS=[
  "DMG LAYOUT · 屏幕在上，十字键左下，A/B 右下斜排",
  "NOIR + PINK · 默认黑粉机身，moon-skin v1 可换皮",
  "GOLDEN LINK · 金手指把存档里的同行 / 配招 / 羁绊写成世界书",
  "WORLD INFO · 条目可折叠、可停用、可导出酒馆格式 JSON",
  "CARTRIDGE · 支持 1–64MB 卡带解析，含 32MB 汉化改版",
  "CORE: OPEN-SOURCE · attachCore() 接 mGBA / libretro WASM"
];
$("#ticker").innerHTML=(TICKER_ITEMS.concat(TICKER_ITEMS)).map(function(t,i){
  return (i%2?'<span>'+t+'</span>':'<span><i>◆</i> '+t+'</span>');
}).join("");
function revealAll(){$$(".reveal").forEach(function(el){el.classList.add("in");});}
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)revealAll();
else requestAnimationFrame(function(){setTimeout(revealAll,60);});

renderPresets();
function applySavedSkin(){
  try{var saved=JSON.parse(LS.getItem(FLAG_PREFIX+"skin")||"null");if(saved)applySkin(saved);else applySkin(DEFAULT_SKIN);}
  catch(e){applySkin(DEFAULT_SKIN);}
}
applySavedSkin();
loadWorldBook();
goHome(true);

/* ── 宿主桥：作为酒馆面板的一屏嵌入时，存档改存宿主的聊天存档，按键走 postMessage ── */
var EMBED=document.body.classList.contains("is-embed");
if(EMBED){
  var post=function(m){try{parent.postMessage(m,"*");}catch(e){}};
  var flushTimer=null;
  LS.onchange(function(){
    clearTimeout(flushTimer);
    flushTimer=setTimeout(function(){post({type:"moon-pocket:persist",data:LS.dump()});},300);
  });
  addEventListener("message",function(e){
    var d=e.data||{};
    if(d.type==="moon-host:restore"&&d.data){
      LS.seed(d.data);applySavedSkin();loadWorldBook();
      try{renderOs();}catch(_){}
    }else if(d.type==="moon-host:key"&&d.button){
      press(d.button,!!d.down);
    }
  });
  var reportHeight=function(){
    var el=document.querySelector(".console");
    if(!el)return;
    post({type:"moon-pocket:height",height:Math.ceil(el.getBoundingClientRect().height)+18});
  };
  addEventListener("resize",reportHeight);
  setTimeout(reportHeight,80);setTimeout(reportHeight,600);
  post({type:"moon-pocket:ready"});
}
