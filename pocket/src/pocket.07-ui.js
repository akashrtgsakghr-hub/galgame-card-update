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

/* ── 顶部工具条的「⋯」抽屉 ────────────────────────────────────────────────
   主行只放攻略 / 地图 / 金手指 / ←卡带，刷新、暂停、导出存档收进来。
   点开、点里面任一键、点面板外面、切层，都收得回去。 */
(function(){
  var more=$("#emu-more"),panel=$("#emu-more-panel");
  if(!more||!panel)return;
  function setOpen(open){
    panel.hidden=!open;
    more.setAttribute("aria-expanded",open?"true":"false");
  }
  more.addEventListener("click",function(e){
    /* 别冒泡到 document，否则刚开就被外面那句「点外面收起」关掉 */
    e.stopPropagation();setOpen(panel.hidden);
  });
  panel.addEventListener("click",function(e){
    if(e.target.closest("button"))setOpen(false);
  });
  document.addEventListener("click",function(e){
    if(panel.hidden)return;
    if(panel.contains(e.target)||more.contains(e.target))return;
    setOpen(false);
  });
  addEventListener("keydown",function(e){
    if(e.code==="Escape"&&!panel.hidden){e.stopPropagation();setOpen(false);}
  },true);
  /* 对外给 showLayer 用：切层时把抽屉收掉，免得带着上一个界面的菜单进游戏 */
  window.__pocketCloseMore=function(){setOpen(false);};
})();

/* ── 电源 / 按键 / 消息 ───────────────────────────────────────────────── */
function setPower(on){
  powered=on;consoleEl.classList.toggle("is-on",on);consoleEl.classList.toggle("is-off",!on);
  var b=$("#power-btn");
  if(b){b.setAttribute("aria-checked",String(on));b.setAttribute("aria-pressed",String(on));}
  if(activeId)postFrame({type:"moon-cart:pause",value:!on});
}
$("#power-btn").addEventListener("click",function(){setPower(!powered);});

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
  /* 按键只往两个地方去：正在跑的核心，或者屏内的卡带菜单。没有第三处了。 */
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
  /* M / H 以前是「酒馆模式 ↔ 街机模式」的拨杆。屏里没有酒馆那层了，
     两个键统一当「回卡带菜单」用，老习惯不改。 */
  if(e.code==="KeyM"||e.code==="KeyH"){goHome();return;}
  if(e.code==="KeyP"){setPower(!powered);return;}
  if(e.code==="Escape"){
    if(!$("#wb-overlay").hidden){$("#wb-overlay").hidden=true;}
    else if(!$("#skin-drawer").hidden){$("#skin-drawer").hidden=true;}
    else if(!$("#cheat-overlay").hidden){$("#cheat-overlay").hidden=true;}
    else goHome();
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
  /* 小地图：状态 / 开关 / 手动翻页。位置是画面拼出来的，不是读内存读来的 */
  map:{
    state:function(){
      var tr=mapTracker, p=tr&&tr.page();
      return { open:mapOpen, auto:mapAuto, pages:tr?tr.pages().length:0, cur:tr?tr.index():-1,
        page:p?{ x:p.ox+MapCore.MID_X, y:p.oy+MapCore.MID_Y,
          entry:p.entry?{x:p.entry.x,y:p.entry.y}:null,
          exit:p.exit?{x:p.exit.x,y:p.exit.y}:null,
          pastes:p.pastes }:null };
    },
    show:mapShow, hide:mapHide, toggle:mapToggle, reset:mapReset,
    newPage:function(){ mapInit().newPage(); },
    /* 调试用：直接塞一帧 240×160 RGBA（联调脚本拿真画面平移来验走位），返回状态机结果 */
    feed:function(frame){ return mapFeed(frame); },
    /* 调试用：现在按存档读到的位置（读不到返回 null）——用来确认「读内存」这条通没通 */
    locate:function(){ return (typeof navMemLocate === "function") ? navMemLocate() : null; },
    atlasMode:function(){ return mapAtlasMode; },
    /* 调试用：整图能不能画出来、卡在哪一步 */
    probe:function(){
      var mem = (typeof navMemLocate === "function") ? navMemLocate() : null;
      var out = { mem: mem, atlas: !!(typeof navAtlas === "function" && navAtlas()),
        img: null, lay: null, err: window.__mapRenderErr || null };
      if (mem) {
        try {
          var a = navAtlas();
          var l = a && a.layoutOf(mem.idx);
          out.lay = l ? { w: l.w, h: l.h } : null;
          var img = navRenderMapCanvas(mem.idx);
          out.img = img ? { w: img.width, h: img.height } : null;
        } catch (e) { out.err = String(e && e.message || e); }
      }
      return out;
    }
  },
  /* 存档区快照：写盘 / 读档 / 状态。auto 由宿主在「AI 回复完成」时调 */
  save:{
    write:function(reason){ return savWrite(reason||"manual"); },
    restore:function(){ return savRestoreToCore(); },
    state:function(){
      var rec=savRead();
      return { key:savKey(), has:!!rec, at:rec?Number(rec.at)||0:0,
        raw:rec?Number(rec.raw)||0:0, packed:rec?String(rec.data||"").length:0,
        pack:rec?rec.k:"", code:rec?rec.code:"", sig:savLastSig };
    },
    chime:function(on){ if(on===undefined) return chimeOn; savSetChime(!!on); return chimeOn; }
  },
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
    }else if(d.type==="moon-host:cheat"){
      /* 酒馆面板那一侧点的金手指：玩家不用先进卡带机翻菜单。
         第一次开就把「问过了」标记打上，别让它在屏里再弹一次确认框把画面挡住。 */
      if(d.on){try{LS.setItem(FLAG_PREFIX+"cheat-asked","1");}catch(_){}}
      enableCheat(!!d.on);
      if(d.on&&!wbEntries.length)runConvert();
    }else if(d.type==="moon-host:wb-rebuild"){
      runConvert();
    }else if(d.type==="moon-host:rom-none"){
      /* 宿主手里没有卡带（普通发布版且玩家还没选过文件）：直接弹文件框 */
      embeddedRomPending=false;
      $("#rom-file").click();
    }else if(d.type==="moon-host:rom-error"){
      embeddedRomPending=false;
      toast("卡带准备失败："+(d.message||"未知原因"));
      var _oe=$("#rom-result");if(_oe)_oe.textContent="卡带准备失败："+(d.message||"未知原因");
    }else if(d.type==="moon-host:rom-cached"){
      /* 宿主已经把这个 32MB 记住了：下次打开点卡槽就能直接玩 */
      toast(d.ok?"卡带已记住 · 下次点卡槽直接玩":"卡带能玩，但这台机器没让存（空间不足或无痕模式）");
    }else if(d.type==="moon-host:rom-meta"){
      /* 宿主只报来源（此时一个字节都没解）——先把卡槽文案写对 */
      embeddedRomSize=d.size||0;
      embeddedRomCached=!!d.cached;
      try{renderCartSlot();}catch(_){}
    }else if(d.type==="moon-host:rom"&&d.buf){
      /* 玩家点了卡槽、宿主才解好推过来。存着，并立刻装机。 */
      embeddedRomBuf=d.buf;
      try{renderCartSlot();}catch(_){}
      if(embeddedRomPending){embeddedRomPending=false;bootRomBuffer(embeddedRomBuf,"BT999 · 内置卡带");}
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

/* ── 屏内工具栏闲置下沉 ──────────────────────────────────────────────
   这条 bar 常年压在游戏画面上：标题画面挡 logo，取名界面正好压住游戏
   自己画的「移动 / 确认 / 返回」提示。不操作 4 秒就沉下去变淡，碰一下
   或悬停立刻回来——按钮位置不变，只是别一直挡着。 */
(function(){
  var hud=document.querySelector("#core-stage .emu-hud");
  if(!hud)return;
  var idleTimer=null;
  var wake=function(){
    hud.classList.remove("is-idle");
    clearTimeout(idleTimer);
    idleTimer=setTimeout(function(){hud.classList.add("is-idle");},4000);
  };
  var stage=document.querySelector("#core-stage");
  if(stage){
    stage.addEventListener("pointermove",wake,{passive:true});
    stage.addEventListener("pointerdown",wake,{passive:true});
  }
  addEventListener("keydown",wake,{passive:true});
  /* 截图/自动化用：派发 moon-pocket:hud-wake 就能把它叫回来 */
  addEventListener("moon-pocket:hud-wake",wake);
  wake();
})();
