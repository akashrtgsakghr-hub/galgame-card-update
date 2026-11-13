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
