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
/* ── 刷新背包：这版便利道具的通病 ─────────────────────────────────────────
   闪光灯、隐身衣、城镇魔毯这类东西，点完要「切一次背包或队伍再切回来」才生效，
   官方说明里就写着这句。那是游戏本体里的实现，插件改不了它；
   能做的只有替玩家按那几下：START（开菜单）→ A（进背包）→ B（退背包）→ B（关菜单）。

   有两点得说清：
   - 这是「替你按键」，不是「修好了游戏」。按完还是得靠游戏自己重新算一遍。
   - 万一菜单光标不在背包上（上次停在哪就停在哪），会开成别的页；多按的 B 会退回来，
     不会保存、不会改档。 */
function pocketRefreshBag(){
  if(!coreModule || !coreBooted){ toast("先插一张卡带", true); return; }
  if(corePaused){ toast("先点「继续」再刷新", true); return; }
  var seq = [["start",150], ["a",150], ["b",150], ["b",200]], i = 0;
  toast("替你开一次背包再退出来…");
  (function step(){
    if(i >= seq.length){ toast("刷完了 · 道具这会儿应该生效了"); return; }
    cheatHold(KEY_BIT[seq[i][0]], 80);
    var wait = seq[i][1];
    i++;
    setTimeout(step, wait);
  })();
}
var refreshBtn = $("#emu-refresh");
if(refreshBtn) refreshBtn.addEventListener("click", pocketRefreshBag);

window.POCKET_CHEAT = { refresh:pocketRefreshBag, push:cheatPush, test:cheatSelfTest, codes:function(){ return cheatCodes.slice(); },
  engine:function(){ return cheatEngine; }, speed:function(){ return cheatSpeed; } };
