var GUIDE_KEY = 'moon-pocket-guide-v1';
var guideState = { vol: 'main', id: 'b0' };
var _guideFlat = null;

/* 摊平：搜索、跳转、持久化都对着这张平表干活，卷只是它上面的一层分组。 */
function guideFlat(){
  if(_guideFlat) return _guideFlat;
  _guideFlat = [];
  GUIDE_VOLS.forEach(function(v){
    v.entries.forEach(function(e){
      e.vol = v.id;
      e.volName = v.name;
      _guideFlat.push(e);
    });
  });
  return _guideFlat;
}
function guideVol(id){
  return GUIDE_VOLS.filter(function(v){ return v.id === id; })[0] || GUIDE_VOLS[0];
}
function guideHas(id){ return guideFlat().some(function(e){ return e.id === id; }); }
function guideFind(id){
  var hit = guideFlat().filter(function(e){ return e.id === id; })[0];
  return hit || GUIDE_VOLS[0].entries[0];
}
function guideLoad(){
  try{
    var raw = LS.getItem(GUIDE_KEY);
    if(!raw) return;
    var o = JSON.parse(raw);
    if(o && o.id && guideHas(o.id)){
      var e = guideFind(o.id);
      guideState.id = e.id;
      guideState.vol = e.vol;
    }
  }catch(e){}
}
function guideSave(){
  try{ LS.setItem(GUIDE_KEY, JSON.stringify({ id: guideState.id })); }catch(e){}
}

/* 一段 → HTML。文案是纯数据，这里只套壳，不掺判断。 */
function guideEntryHtml(e){
  return '<div class="gd-entry">'
    + '<h3>' + esc(e.title) + '</h3>'
    + (e.note ? '<p class="gd-lv">' + esc(e.note) + '</p>' : '')
    + '<p class="gd-goal">' + esc(e.goal) + '</p>'
    + e.blocks.map(function(b){
        return '<section class="gd-block"><h4>' + esc(b.h) + '</h4><ul>'
          + b.list.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('')
          + '</ul></section>';
      }).join('')
    + '</div>';
}

/* 搜索：把每段的标题、目标、每一条都摊平了搜。命中就整段列出来——
   「冲浪」这种词单看一行没用，得连上下文一起看。结果里带上册名，
   不然玩家分不清这条是主线还是道具。 */
function guideSearch(q){
  var key = String(q || '').trim().toLowerCase();
  if(!key) return null;
  var hits = [];
  guideFlat().forEach(function(e){
    var lines = [e.title, e.goal, e.note || ''];
    e.blocks.forEach(function(b){ lines = lines.concat([b.h], b.list); });
    var matched = lines.filter(function(t){ return String(t).toLowerCase().indexOf(key) >= 0; });
    if(matched.length) hits.push({ e: e, matched: matched.slice(0, 3) });
  });
  return hits;
}

function guideRender(){
  var body = $('#guide-body'), vols = $('#guide-vols'), tabs = $('#guide-tabs'), foot = $('#guide-foot');
  var box = $('#guide-q');
  var q = box ? box.value : '';
  var hits = guideSearch(q);

  if(vols){
    vols.innerHTML = GUIDE_VOLS.map(function(v){
      var on = (v.id === guideState.vol && !hits) ? ' class="on"' : '';
      return '<button type="button" data-gv="' + esc(v.id) + '"' + on + '>'
        + esc(v.name) + '<small>' + esc(v.hint) + '</small></button>';
    }).join('');
  }
  if(tabs){
    /* 搜的时候把章节条收起来：结果本身跨册，留着会误导「只在当前册里搜」。 */
    tabs.innerHTML = hits ? '' : guideVol(guideState.vol).entries.map(function(e){
      var on = (e.id === guideState.id) ? ' class="on"' : '';
      return '<button type="button" data-gd="' + esc(e.id) + '"' + on + '>' + esc(e.chip) + '</button>';
    }).join('');
  }
  if(!body) return;

  if(hits){
    body.innerHTML = hits.length
      ? '<p class="gd-hint">找到 ' + hits.length + ' 段 · 点一下跳过去</p>'
        + hits.map(function(h){
            return '<button type="button" class="gd-hit" data-gd="' + esc(h.e.id) + '">'
              + '<b>' + esc(h.e.title) + '<em class="gd-vol">' + esc(h.e.volName) + '</em></b>'
              + h.matched.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('')
              + '</button>';
          }).join('')
      : '<p class="gd-hint">没找到「' + esc(q) + '」。试试「冲浪 / 居合斩 / 进化 / 金珠 / 存档」。</p>';
  } else {
    body.innerHTML = guideEntryHtml(guideFind(guideState.id));
  }
  body.scrollTop = 0;
  if(foot){
    foot.textContent = LS.isPersistent
      ? '进度记在这台机器里 · 换聊天不会串'
      : '这台机器没给存储权限 · 进度只在本次有效';
  }
}

function guideOpen(id){
  var d = $('#guide-drawer');
  if(!d) return;
  if(id && guideHas(id)){
    var e = guideFind(id);
    guideState.id = e.id;
    guideState.vol = e.vol;
  }
  d.hidden = false;
  var box = $('#guide-q'); if(box) box.value = '';
  guideRender();
  guideSave();
}
function guideClose(){
  var d = $('#guide-drawer');
  if(d) d.hidden = true;
}

/* 事件全走委托：抽屉每次重画，直接绑按钮会越绑越多。 */
function guideBind(){
  var d = $('#guide-drawer');
  if(!d) return;

  d.addEventListener('click', function(e){
    var t = e.target;
    if(!t || !t.closest) return;

    var vol = t.closest('[data-gv]');
    if(vol){
      var vid = vol.getAttribute('data-gv');
      var v = guideVol(vid);
      guideState.vol = v.id;
      /* 换册要顺手把当前段换成这册的第一段，否则会出现「页签是道具、内容是主线」 */
      if(guideFind(guideState.id).vol !== v.id) guideState.id = v.entries[0].id;
      var box0 = $('#guide-q'); if(box0) box0.value = '';
      guideRender();
      guideSave();
      return;
    }
    var jump = t.closest('[data-gd]');
    if(jump){
      var id = jump.getAttribute('data-gd');
      var hit = guideFind(id);
      guideState.id = hit.id;
      guideState.vol = hit.vol;
      var box = $('#guide-q'); if(box) box.value = '';
      guideRender();
      guideSave();
      return;
    }
    if(t.closest('#guide-close')) guideClose();
  });

  var box = $('#guide-q');
  if(box) box.addEventListener('input', function(){ guideRender(); });

  ['#emu-guide', '#guide-btn'].forEach(function(sel){
    var b = $(sel);
    if(b) b.addEventListener('click', function(){ guideOpen(); });
  });

  /* Esc 关抽屉。用捕获阶段抢在宿主那套键位映射前面，
     否则按 Esc 会被它当成「回卡带菜单」处理掉。 */
  addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    var drawer = $('#guide-drawer');
    if(!drawer || drawer.hidden) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    guideClose();
  }, true);
}

guideLoad();
guideBind();

window.POCKET_GUIDE = {
  open: guideOpen,
  close: guideClose,
  chapters: function(){
    return guideFlat().map(function(e){ return { id: e.id, chip: e.chip, title: e.title, vol: e.vol }; });
  },
  vols: function(){ return GUIDE_VOLS.map(function(v){ return { id: v.id, name: v.name, n: v.entries.length }; }); },
  current: function(){ return guideState.id; },
  currentVol: function(){ return guideState.vol; }
};

