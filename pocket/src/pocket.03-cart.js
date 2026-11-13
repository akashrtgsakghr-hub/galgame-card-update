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
