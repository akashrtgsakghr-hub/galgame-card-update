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
