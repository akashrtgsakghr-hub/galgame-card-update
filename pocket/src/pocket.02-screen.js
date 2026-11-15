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
/* 屏内配色：和机身、和系统界面同一套黑粉（都跟皮肤走）。
   早先这里是暗橄榄液晶（#555e4b）配墨绿字，像块 1989 年的屏；可机身是黑粉像素，
   插卡页一会儿橄榄一会儿黑，看着像两台机器。现在屏里统一黑粉：
   LCD=底 / INK=墨（这里是粉）/ HI=压在墨上的字（这里是近黑）/ MID=中间调 / ACC=浅粉。
   想退回橄榄：把 PALETTE_OLIVE 改成 true。 */
var PALETTE_OLIVE = false;
function cartPal(){
  if(PALETTE_OLIVE){
    return {lcd:SKIN.lcd,ink:SKIN.ink,acc:SKIN.scrAcc,mid:SKIN.mid,soft:SKIN.soft,
      hi:SKIN.hi,dark:SKIN.dark,panel:SKIN.panel,grid:SKIN.grid,
      bar:SKIN.ink, barTxt:SKIN.hi};
  }
  var t=skinObj.tokens;
  /* BAR / BARTXT 单独拿出来：条是黑底、字是粉，跟机身一个逻辑（黑底粉字），
     不是「粉条黑字」——一整条粉在屏上太吵，像块招牌。 */
  return {lcd:t.bg, ink:t.accent, acc:t.accent2,
    mid:mixHex(t.bg,t.accent,.46), soft:mixHex(t.bg,t.accent,.24),
    hi:t.edge, dark:t.edge, panel:t.surface, grid:rgba(t.accent,.16),
    bar:t.edge, barTxt:t.accent};
}
function cartDoc(title, body, logic){
  var P=cartPal();
  var pal=['var LCD='+JSON.stringify(P.lcd)+',INK='+JSON.stringify(P.ink)+',ACC='+JSON.stringify(P.acc)+',',
    'MID='+JSON.stringify(P.mid)+',SOFT='+JSON.stringify(P.soft)+',HI='+JSON.stringify(P.hi)+',',
    'DARK='+JSON.stringify(P.dark)+',PANEL='+JSON.stringify(P.panel)+',GRID='+JSON.stringify(P.grid)+',',
    'BAR='+JSON.stringify(P.bar)+',BARTXT='+JSON.stringify(P.barTxt)+';'].join("");
  var css=':root{--lcd:'+P.lcd+';--ink:'+P.ink+'}';
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>'+title+'</title>'
    + '<style>'+css+GAME_CSS+'</style></head><body>'+body
    + '<script>'+HOST_JS+'\n'+pal+'\n'+logic+'<\/script></body></html>';
}
var CANVAS_BODY='<canvas id="c" width="480" height="320"></canvas>';

/* 卡带菜单：一张卡时摆封面（大图），多张时退回列表。
   封面是照着 GBA 卡带盒的构图自己画的像素示意——弧形标题带、精灵球、底部机型条，
   没有打包任何官方图，所以离线也能出、也不占体积。 */
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
  'function center(txt,y,font){g.font=font;g.fillText(txt,Math.round((240-g.measureText(txt).width)/2),y);}',
  '/* 放不下就截断加省略号：卡带名可以很长，列表行只有 140px */',
  'function fit(txt,maxW,font){g.font=font;if(g.measureText(txt).width<=maxW)return txt;',
  ' var s=txt;while(s.length>1&&g.measureText(s+"…").width>maxW)s=s.slice(0,-1);return s+"…";}',
  '/* 卡带盒封面：x,y 左上角，w,h 尺寸 */',
  'function cover(x,y,w,h){',
  ' g.fillStyle=INK;g.fillRect(x,y,w,h);',
  ' g.fillStyle=PANEL;g.fillRect(x+2,y+2,w-4,h-4);',
  /* 顶部弧形标题带：GBA 盒面最上面那条弧 */
  ' g.fillStyle=INK;g.beginPath();g.moveTo(x+2,y+2);g.lineTo(x+w-2,y+2);g.lineTo(x+w-2,y+16);',
  ' g.quadraticCurveTo(x+w/2,y+29,x+2,y+16);g.closePath();g.fill();',
  ' g.fillStyle=HI;g.font="bold 10px monospace";g.fillText("POKéMON",x+8,y+13);',
  ' g.font="bold 9px monospace";g.fillText("BT999",x+w-33,y+13);',
  /* 精灵球：上半深、下半浅，中间一条横带 + 中心圆 —— 单色屏上也能一眼认出是球 */
  ' var cx=x+w/2,cy=y+49,r=13;',
  ' g.fillStyle=INK;g.beginPath();g.arc(cx,cy,r,0,6.283);g.fill();',
  ' g.fillStyle=HI;g.beginPath();g.arc(cx,cy,r-2,0,6.283);g.fill();',
  ' g.fillStyle=ACC;g.beginPath();g.arc(cx,cy,r-2,Math.PI,Math.PI*2);g.fill();',
  ' g.fillStyle=INK;g.fillRect(cx-r+2,cy-1.5,2*r-4,3);',
  ' g.beginPath();g.arc(cx,cy,5,0,6.283);g.fill();',
  ' g.fillStyle=HI;g.beginPath();g.arc(cx,cy,3,0,6.283);g.fill();',
  /* 底部机型条：EMERALD + 改版版本号 */
  ' g.fillStyle=BAR;g.fillRect(x+2,y+h-18,w-4,16);',
  ' g.fillStyle=INK;g.fillRect(x+2,y+h-19,w-4,1);',
  ' g.fillStyle=BARTXT;g.font="bold 9px monospace";g.fillText("EMERALD",x+8,y+h-6);',
  ' g.font="8px monospace";g.fillText("v9.99",x+w-31,y+h-6);',
  '}',
  'function paint(){',
  ' g.fillStyle=LCD;g.fillRect(0,0,240,160);',
  ' g.fillStyle=BAR;g.fillRect(0,0,240,20);',
  ' g.fillStyle=INK;g.fillRect(0,19,240,1);',
  ' g.fillStyle=BARTXT;g.font="bold 10px monospace";g.fillText("MOON POCKET / CARTRIDGE",6,14);',
  ' g.fillText(String(list.length).padStart(2,"0")+" CART",196,14);',
  ' if(!list.length){',
  '  g.fillStyle=INK;center("卡带槽是空的",74,"bold 12px monospace");',
  '  g.fillStyle=GRID;center("插一张卡带就能玩",92,"9px monospace");',
  '  g.fillStyle=BAR;g.fillRect(0,146,240,14);g.fillStyle=INK;g.fillRect(0,146,240,1);',
  '  g.fillStyle=BARTXT;center("点机身上的卡带口插卡",156,"9px monospace");',
  '  return;}',
  ' if(list.length===1){var c=list[0];',
  /* 单卡：上面摆卡带盒，下面三行写名字——全名一行放不下，按 主名 / 副名 / 版本 拆开 */
  '  cover(57,22,126,84);',
  '  var sub=(c.l2||"")+(c.l2&&c.l3?" · ":"")+(c.l3||"");',
  '  g.fillStyle=INK;center(fit(c.l1||c.title,226,"bold 11px monospace"),120,"bold 11px monospace");',
  '  g.fillStyle=INK;center(fit(sub,226,"9px monospace"),133,"9px monospace");',
  /* 底条和列表页用同一条：整块机器的「脚」，别让提示文字贴到屏幕边缘 */
  '  g.fillStyle=BAR;g.fillRect(0,146,240,14);',
  '  g.fillStyle=INK;g.fillRect(0,146,240,1);',
  '  g.fillStyle=BARTXT;center("本机卡带 · 按 A 插进去",156,"8px monospace");',
  '  return;}',
  /* 多张：仍走列表，一屏四张 */
  ' g.fillStyle=INK;g.font="9px monospace";g.fillText("选一张卡带，按 A 启动",6,34);',
  ' g.fillStyle=GRID;g.fillRect(6,40,228,1);',
  ' for(var i=viewTop;i<Math.min(viewTop+PAGE,list.length);i++){var y=44+(i-viewTop)*23;',
  '  if(i===sel){g.fillStyle=INK;g.fillRect(4,y-2,232,21);g.fillStyle=HI;}else{g.fillStyle=INK;}',
  '  g.font="10px monospace";g.fillText(String(i+1).padStart(2,"0"),10,y+13);',
  '  g.fillText(fit(list[i].title,132,"10px monospace"),32,y+13);',
  '  g.font="8px monospace";g.fillText(list[i].tag,172,y+12);}',
  ' g.fillStyle=BAR;g.fillRect(0,146,240,14);',
  ' g.fillStyle=INK;g.fillRect(0,146,240,1);',
  ' g.fillStyle=BARTXT;g.font="9px monospace";',
  ' g.fillText("↑↓ 选择  A 启动  ·  卡带自备 / 核心可接",5,156);',
  '}',
  'paint();'
].join('\n');

var MANIFEST_SAMPLE={format:"moon-cart",version:1,id:"moon.breath",title:"月相呼吸灯",latin:"MOON BREATH",
  genre:"氛围 · 示例",author:"月相系统",license:"CC0-1.0",runtime:"srcdoc",input:["a"],
  entry:"<!doctype html>…自带 HTML/JS…",save:{scope:"per-chat",quotaBytes:65536},assets:[],requires:{rom:false,wasm:false}};
var CARTS=[], extraCarts=[];
function buildCarts(){
/* 卡带槽只放一张：BT999 那张改版卡带。以前那三张月相小游戏（跑者 / 灵匣 / 占卜）撤了——
     这台机器是卡带机，不是月相系统的小游戏机；月相在酒馆面板里，别在这儿重开一份。 */
  var base=[
    {format:"moon-cart",version:1,id:"rom.slot.byor",no:"01",title:CART_TITLE,
      l1:CART_LINE[0],l2:CART_LINE[1],l3:CART_LINE[2],
      latin:"BT999",genre:"卡带 · 本机导入",license:"不含游戏文件",
      runtime:"byor",entry:null,assets:[],requires:{rom:true}}
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
function gameList(){return CARTS.map(function(c){return {id:c.id,title:c.title,l1:c.l1,l2:c.l2,l3:c.l3,
  tag:(c.runtime==="byor"?"CART":c.runtime.toUpperCase())};});}

/* ── ③ 屏内导航 ───────────────────────────────────────────────────────── */
function postFrame(obj){if(!frameLive)return;try{var w=frame.contentWindow;if(w)w.postMessage(obj,"*");}catch(e){}}
function unloadFrame(){frameLive=false;frame.onload=null;try{frame.removeAttribute("srcdoc");}catch(e){}}
function showLayer(name){
  try{ if(window.__pocketCloseMore)window.__pocketCloseMore(); }catch(e){}
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
  /* 旧入口留着只当别名：屏幕里已经没有「酒馆内部系统」那一层了，
     按到 HOME / 老快捷键一律回卡带菜单，免得有人以为能把掌机当酒馆面板用。 */
  goHome(quiet);
}
/* 世界书 / 皮肤变动后仍会调到这里。屏内的系统页已经撤了，
   现在只更新机身外框上的小标签（WB 条数），不往屏幕里画东西。 */
function renderOs(){
  var chip=$("#chip-wb");
  if(chip)chip.textContent="WB "+wbEntries.filter(function(e){return !e.disable;}).length;
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
  /* 只剩一种模式：卡带机。参数留着是为了兼容老调用（MOON_POCKET.setMode / 快捷键），
     但不管传什么，屏幕都回卡带菜单——这台机器不再有「酒馆内部系统」那屏。 */
  mode="arcade";
  document.body.setAttribute("data-mode",mode);
  if($("#mode-name"))$("#mode-name").textContent="卡带机";
  if($("#chip-mode"))$("#chip-mode").textContent="CART";
  goHome(quiet);
  if(!quiet)toast("卡带机 · 插卡 / 选卡，A 启动");
}
$("#home-btn").addEventListener("click",function(){goHome();});
$("#menu-btn").addEventListener("click",function(){goHome();});
$("#home-from-byor").addEventListener("click",function(){goHome();});
