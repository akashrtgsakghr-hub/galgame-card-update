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
