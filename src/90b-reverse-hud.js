/* 90b-reverse-hud.js —— 攻略模式的像素挂件（酒馆页面里的悬浮球 + 浮层）

   定位说明（重要）：
   这不是一个软件，也不是一个小应用 —— 它是酒馆页面上的一个挂件。
   · 不新建窗口、不用 iframe、不接管键盘、不改酒馆的 DOM 结构
   · 只在 body 上多一个 fixed 的球；点开是一个小浮层，点外面就收回去
   · 攻略模式一关 → 球和浮层都从 DOM 里删掉，页面上不留任何痕迹
   · 所有数据都在本脚本的聊天元数据里，不落第三方、不写文件

   四页签：
     板  小黑板：AI 抛出来的任务，可以接，也可以不理
     架  货架：像素书架，一本一本竖着排，点一下买
     包  背包：身上的东西，点一下用
     TOK 上下文分项：世界书 / 角色卡 / 我 / 本系统 各占多少

   移动端注意：球放在右侧偏下、避开底部输入框那一条，免得挡到发送按钮。 */

const REVERSE_HUD_STYLE_ID = 'moon-reverse-hud-style';
const REVERSE_HUD_TAB_KEY = 'moon_reverse_hud_tab';
const REVERSE_HUD_TABS = [
  { id: 'board', name: '板', full: '任务板' },
  { id: 'shelf', name: '架', full: '货架' },
  { id: 'bag', name: '包', full: '背包' },
  { id: 'token', name: 'TOK', full: '上下文' }
];

function reverseHudTab() {
  let t = 'board';
  try {
    const s = getStorage();
    const raw = s && s.getItem(REVERSE_HUD_TAB_KEY);
    if (raw && REVERSE_HUD_TABS.some(function(x) { return x.id === raw; })) t = raw;
  } catch (e) {}
  return t;
}
function reverseHudSetTab(t) {
  try { const s = getStorage(); if (s) s.setItem(REVERSE_HUD_TAB_KEY, String(t)); } catch (e) {}
}

function injectReverseHudStyle() {
  if (!mainDoc) return;
  let el = mainDoc.getElementById(REVERSE_HUD_STYLE_ID);
  if (!el) {
    el = mainDoc.createElement('style');
    el.id = REVERSE_HUD_STYLE_ID;
    mainDoc.head.appendChild(el);
  }
  if (el.getAttribute('data-built') === '1') return;
  el.setAttribute('data-built', '1');
  el.textContent = `
/* ── 挂件整体：黑粉像素，硬边、硬阴影，没有圆润的现代感 ───────────── */
#moon-rhud-ball{
  position:fixed;right:10px;bottom:124px;width:46px;height:46px;z-index:2147483200;
  display:none;align-items:center;justify-content:center;box-sizing:border-box;
  background:linear-gradient(180deg,#241329 0%,#160c19 100%);
  border:3px solid #f472d0;border-radius:3px;
  box-shadow:4px 4px 0 rgba(18,13,20,.75),inset 0 0 0 2px rgba(18,13,20,.6);
  cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;
  font:600 9px/1 "MP Fusion Pixel","Zpix","Courier New",monospace;color:#ffd9f2;
}
#moon-rhud-ball.on{display:flex;}
#moon-rhud-ball:active{transform:translate(2px,2px);box-shadow:2px 2px 0 rgba(18,13,20,.75);}
#moon-rhud-ball .rhud-ball-ico{display:block;image-rendering:pixelated;}
#moon-rhud-ball .rhud-ball-pts{
  position:absolute;right:-5px;top:-7px;min-width:18px;height:14px;padding:0 3px;
  display:flex;align-items:center;justify-content:center;box-sizing:border-box;
  background:#f472d0;color:#200a1c;border:2px solid #200a1c;border-radius:2px;
  font:600 9px/1 "MP Fusion Pixel","Courier New",monospace;
}
#moon-rhud-ball .rhud-ball-dot{
  position:absolute;left:-4px;top:-6px;width:9px;height:9px;background:#fde047;
  border:2px solid #200a1c;border-radius:1px;display:none;
}
#moon-rhud-ball.has-new .rhud-ball-dot{display:block;}

/* ── 浮层 ──────────────────────────────────────────────────────── */
#moon-rhud{
  position:fixed;right:10px;bottom:180px;z-index:2147483201;display:none;
  width:min(336px,calc(100vw - 20px));max-height:min(470px,68vh);
  box-sizing:border-box;flex-direction:column;
  background:linear-gradient(180deg,#1b0f1e 0%,#120b14 100%);
  border:3px solid #f472d0;border-radius:3px;
  box-shadow:6px 6px 0 rgba(18,13,20,.8),inset 0 0 0 2px rgba(18,13,20,.55);
  font:500 11px/1.55 "MP Fusion Pixel","Zpix","Courier New",monospace;
  color:#f6e2f1;overflow:hidden;
}
#moon-rhud.on{display:flex;}
#moon-rhud *{box-sizing:border-box;}
#moon-rhud .rhud-top{
  display:flex;align-items:center;gap:0;padding:5px 6px;
  background:#2a1327;border-bottom:3px solid #4a2240;flex:none;
}
#moon-rhud .rhud-tabs{display:flex;gap:3px;flex:1;min-width:0;}
#moon-rhud .rhud-tab{
  flex:1;min-width:0;padding:5px 2px;cursor:pointer;text-align:center;
  background:#170d1a;color:#c79bb8;border:2px solid #3d1a36;border-radius:2px;
  font:600 10px/1.2 "MP Fusion Pixel","Courier New",monospace;
  text-transform:uppercase;user-select:none;-webkit-user-select:none;
}
#moon-rhud .rhud-tab.on{background:#f472d0;color:#200a1c;border-color:#ffd9f2;}
#moon-rhud .rhud-close{
  flex:none;width:24px;height:24px;margin-left:5px;display:flex;align-items:center;justify-content:center;
  background:#3d1a36;color:#ffd9f2;border:2px solid #6b2f5c;border-radius:2px;cursor:pointer;
  font:600 12px/1 "Courier New",monospace;
}
#moon-rhud .rhud-close:active{background:#6b2f5c;}
#moon-rhud .rhud-body{
  flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:8px;
  -webkit-overflow-scrolling:touch;
}
#moon-rhud .rhud-body::-webkit-scrollbar{width:5px;}
#moon-rhud .rhud-body::-webkit-scrollbar-thumb{background:#6b2f5c;border-radius:0;}
#moon-rhud .rhud-foot{
  flex:none;display:flex;align-items:center;justify-content:space-between;gap:6px;
  padding:4px 7px;background:#170d1a;border-top:2px solid #3d1a36;
  font:600 9.5px/1.4 "MP Fusion Pixel","Courier New",monospace;color:#a4789a;
}

/* ── 通用小块 ──────────────────────────────────────────────────── */
#moon-rhud .rhud-btn{
  padding:4px 8px;cursor:pointer;user-select:none;-webkit-user-select:none;
  background:#2a1327;color:#ffd9f2;border:2px solid #6b2f5c;border-radius:2px;
  font:600 10px/1.3 "MP Fusion Pixel","Courier New",monospace;white-space:nowrap;
  box-shadow:2px 2px 0 rgba(18,13,20,.7);
}
#moon-rhud .rhud-btn:active{transform:translate(1px,1px);box-shadow:1px 1px 0 rgba(18,13,20,.7);}
#moon-rhud .rhud-btn.hot{background:#f472d0;color:#200a1c;border-color:#ffd9f2;}
#moon-rhud .rhud-btn.dim{background:#1d121f;color:#8a6b82;border-color:#3d1a36;box-shadow:none;cursor:default;}
#moon-rhud .rhud-empty{
  padding:18px 10px;text-align:center;color:#8a6b82;font-size:10.5px;line-height:1.7;
}

/* ── 板：小黑板 ────────────────────────────────────────────────── */
#moon-rhud .rhud-board{
  background:#14201c;
  border:3px solid #4a3526;border-radius:2px;
  box-shadow:inset 0 0 0 2px #0b1310,0 3px 0 rgba(18,13,20,.6);
  padding:9px 9px 10px;margin-bottom:8px;
}
#moon-rhud .rhud-board-hd{
  display:flex;align-items:center;justify-content:space-between;
  font:600 10px/1.3 "MP Fusion Pixel","Courier New",monospace;color:#8fd6b0;
  letter-spacing:.04em;padding-bottom:5px;margin-bottom:6px;
  border-bottom:1px dashed rgba(143,214,176,.35);
}
#moon-rhud .rhud-chalk{
  font:500 11.5px/1.62 "MP Fusion Pixel","PingFang SC","Microsoft YaHei",monospace;
  color:#e8f5ec;text-shadow:0 0 1px rgba(232,245,236,.5);
}
#moon-rhud .rhud-chalk .t{font-weight:600;color:#f4fffa;}
#moon-rhud .rhud-chalk .m{color:#a9c9b8;font-size:10.5px;}
#moon-rhud .rhud-chalk .r{color:#fde047;}
#moon-rhud .rhud-offer{
  position:relative;padding:6px 8px 7px 11px;margin-bottom:7px;
  border:1px solid rgba(232,245,236,.22);border-left:3px solid #8fd6b0;
  background:rgba(232,245,236,.035);border-radius:1px;
}
#moon-rhud .rhud-offer:last-child{margin-bottom:0;}
#moon-rhud .rhud-offer-act{display:flex;gap:6px;margin-top:7px;justify-content:flex-start;}
#moon-rhud .rhud-offer-act .rhud-btn{flex:none;text-align:center;padding:3px 11px;font-size:10px;letter-spacing:.02em;}
#moon-rhud .rhud-offer-act .rhud-btn.hot{padding:3px 13px;}

/* ── 架：像素书架 ──────────────────────────────────────────────── */
#moon-rhud .rhud-shelf{
  display:grid;grid-template-columns:repeat(4,1fr);gap:6px 4px;
  padding:10px 6px 9px;background:#170f14;
  border:3px solid #4a3526;border-radius:2px;border-bottom-width:6px;
  box-shadow:inset 0 -2px 0 rgba(74,53,38,.85),0 3px 0 rgba(18,13,20,.55);
  align-items:end;
}
#moon-rhud .rhud-book{
  position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;
  cursor:pointer;user-select:none;-webkit-user-select:none;
}
#moon-rhud .rhud-book .spine{
  width:30px;height:80px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
  padding:5px 1px 4px;border-radius:1px;
  writing-mode:vertical-rl;text-orientation:upright;
  font:600 9.5px/1.1 "MP Fusion Pixel","Zpix","Courier New",monospace;
  letter-spacing:.04em;overflow:hidden;white-space:nowrap;
  border:1px solid rgba(18,13,20,.75);
  box-shadow:inset -4px 0 0 rgba(18,13,20,.32),inset 2px 0 0 rgba(255,255,255,.10),2px 2px 0 rgba(18,13,20,.55);
}
#moon-rhud .rhud-book .price{
  font:600 8.5px/1 "MP Fusion Pixel","Courier New",monospace;color:#fde047;white-space:nowrap;
}
#moon-rhud .rhud-book.no .spine{filter:grayscale(.7) brightness(.6);}
#moon-rhud .rhud-book.no .price{color:#8a6b82;}
#moon-rhud .rhud-book:active .spine{transform:translateY(1px);}
#moon-rhud .rhud-gemshelf{margin-top:7px;padding:6px 7px;background:#1e1524;border:2px solid #6b2f5c;border-radius:2px;}
#moon-rhud .rhud-gemshelf .hd{font:600 9.5px/1.3 "MP Fusion Pixel","Courier New",monospace;color:#fde047;margin-bottom:4px;}

/* ── 包：格子 ──────────────────────────────────────────────────── */
#moon-rhud .rhud-bag{
  display:grid;grid-template-columns:repeat(4,1fr);gap:6px;
  padding:8px;background:#170f14;border:3px solid #4a3526;border-radius:2px;
}
#moon-rhud .rhud-slot{
  position:relative;aspect-ratio:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:2px;background:#221626;border:2px solid #3d1a36;border-radius:2px;cursor:pointer;
  font:600 9px/1.15 "MP Fusion Pixel","Courier New",monospace;color:#f6e2f1;text-align:center;
  overflow:hidden;word-break:break-all;
}
#moon-rhud .rhud-slot.empty{background:#150d17;border-style:dashed;cursor:default;color:#4a3050;}
#moon-rhud .rhud-slot .n{
  position:absolute;right:1px;bottom:1px;min-width:12px;height:12px;padding:0 2px;
  display:flex;align-items:center;justify-content:center;background:#f472d0;color:#200a1c;
  font:600 8.5px/1 "Courier New",monospace;border-radius:1px;
}

/* ── TOK：分项统计 ─────────────────────────────────────────────── */
#moon-rhud .rhud-tok{margin-bottom:7px;}
#moon-rhud .rhud-tok-row{margin-bottom:8px;}
#moon-rhud .rhud-tok-hd{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;}
#moon-rhud .rhud-tok-hd b{font:600 11px/1.3 "MP Fusion Pixel","Courier New",monospace;color:#f6e2f1;}
#moon-rhud .rhud-tok-hd span{font:600 11px/1.3 "MP Fusion Pixel","Courier New",monospace;color:#fde047;}
#moon-rhud .rhud-tok-bar{height:8px;background:#150d17;border:2px solid #3d1a36;border-radius:1px;overflow:hidden;}
#moon-rhud .rhud-tok-bar i{display:block;height:100%;background:repeating-linear-gradient(90deg,#f472d0 0 4px,#c94fa8 4px 6px);}
#moon-rhud .rhud-tok-bar i.b2{background:repeating-linear-gradient(90deg,#7dd3fc 0 4px,#3f9fc9 4px 6px);}
#moon-rhud .rhud-tok-bar i.b3{background:repeating-linear-gradient(90deg,#8fd6b0 0 4px,#4d9973 4px 6px);}
#moon-rhud .rhud-tok-bar i.b4{background:repeating-linear-gradient(90deg,#fde047 0 4px,#c9ae21 4px 6px);}
#moon-rhud .rhud-tok-note{font:500 9.5px/1.6 "PingFang SC","Microsoft YaHei",sans-serif;color:#9c7d93;margin-top:6px;}
#moon-rhud .rhud-tok-total{
  display:flex;justify-content:space-between;align-items:center;padding:7px 8px;margin-bottom:9px;
  background:#221626;border:2px solid #6b2f5c;border-radius:2px;
}
#moon-rhud .rhud-tok-total b{font:600 13px/1.2 "MP Fusion Pixel","Courier New",monospace;color:#ffd9f2;}

/* ── 小屏：球和浮层都往上收一点，别压到输入框 ──────────────────── */
@media (max-width:520px){
  #moon-rhud-ball{right:8px;bottom:132px;width:42px;height:42px;}
  #moon-rhud{right:8px;bottom:182px;width:calc(100vw - 16px);max-height:62vh;}
}
`;
}

/* ── 挂载 / 卸载 ─────────────────────────────────────────────── */
function reverseHudEl() {
  return mainDoc ? mainDoc.getElementById('moon-rhud') : null;
}
function reverseHudBallEl() {
  return mainDoc ? mainDoc.getElementById('moon-rhud-ball') : null;
}
/* 背包图标：16×16 像素图，用格子拼，不引外部图片 */
function reverseHudBallIcon() {
  return '<svg class="rhud-ball-ico" width="24" height="24" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
    '<rect x="4" y="1" width="8" height="2" fill="#ffd9f2"/>' +
    '<rect x="3" y="3" width="10" height="2" fill="#f472d0"/>' +
    '<rect x="2" y="5" width="12" height="9" fill="#2a1327" stroke="#f472d0" stroke-width="1"/>' +
    '<rect x="5" y="7" width="6" height="5" fill="#f472d0"/>' +
    '<rect x="6" y="8" width="4" height="3" fill="#2a1327"/>' +
    '<rect x="7" y="9" width="2" height="1" fill="#ffd9f2"/>' +
    '</svg>';
}
function reverseHudMount() {
  if (!mainDoc || !mainDoc.body) return;
  injectReverseHudStyle();
  if (!isReverseModeOn()) { reverseHudUnmount(); return; }
  let ball = reverseHudBallEl();
  if (!ball) {
    ball = mainDoc.createElement('div');
    ball.id = 'moon-rhud-ball';
    ball.setAttribute('role', 'button');
    ball.setAttribute('aria-label', '攻略模式挂件');
    ball.innerHTML = '<span class="rhud-ball-dot"></span>' + reverseHudBallIcon() +
      '<span class="rhud-ball-pts">0</span>';
    ball.addEventListener('click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      reverseHudToggle();
    });
    mainDoc.body.appendChild(ball);
  }
  ball.classList.add('on');
  reverseHudRefreshBadge();

  if (!reverseHudEl()) {
    const box = mainDoc.createElement('div');
    box.id = 'moon-rhud';
    box.innerHTML =
      '<div class="rhud-top">' +
        '<div class="rhud-tabs"></div>' +
        '<div class="rhud-close" role="button" aria-label="收起">×</div>' +
      '</div>' +
      '<div class="rhud-body"></div>' +
      '<div class="rhud-foot"><span class="rhud-foot-l"></span><span class="rhud-foot-r"></span></div>';
    mainDoc.body.appendChild(box);
    box.addEventListener('click', function(ev) {
      /* 点浮层内部：不冒泡到 document，否则会被当成「点了外面」 */
      ev.stopPropagation();
      reverseHudHandleClick(ev);
    });
    /* 点浮层外面就收起来 —— 挂一次 document 监听，卸载时同函数摘掉 */
    mainDoc.addEventListener('click', reverseHudOutsideClick, true);
  }
  reverseHudRender();
}
function reverseHudUnmount() {
  try {
    const box = reverseHudEl();
    if (box && box.parentNode) box.parentNode.removeChild(box);
    const ball = reverseHudBallEl();
    if (ball && ball.parentNode) ball.parentNode.removeChild(ball);
    if (mainDoc) mainDoc.removeEventListener('click', reverseHudOutsideClick, true);
  } catch (e) {}
}
function reverseHudOutsideClick(ev) {
  const box = reverseHudEl();
  if (!box || !box.classList.contains('on')) return;
  const t = ev.target;
  if (box.contains(t)) return;
  const ball = reverseHudBallEl();
  if (ball && ball.contains(t)) return;
  reverseHudClose();
}
function reverseHudOpen() {
  const box = reverseHudEl();
  if (!box) { reverseHudMount(); }
  const b = reverseHudEl();
  if (!b) return;
  b.classList.add('on');
  reverseHudRender();
  reverseHudRefreshBadge();
}
function reverseHudClose() {
  const box = reverseHudEl();
  if (box) box.classList.remove('on');
}
function reverseHudToggle() {
  const box = reverseHudEl();
  if (box && box.classList.contains('on')) reverseHudClose();
  else reverseHudOpen();
}
/* 球上的角标：积分 + 有没有新任务可接 */
function reverseHudRefreshBadge() {
  const ball = reverseHudBallEl();
  if (!ball) return;
  try {
    const p = getPlayerState();
    const pts = ball.querySelector('.rhud-ball-pts');
    if (pts) pts.textContent = String(rvNum(p.points, 0) > 999 ? '999+' : rvNum(p.points, 0));
    const offers = reverseOfferList();
    const taskActive = !!(p.task && p.task.status === 'active');
    ball.classList.toggle('has-new', offers.length > 0 && !taskActive);
  } catch (e) {}
}

/* ── 四个页签 ─────────────────────────────────────────────────── */
function reverseHudBoardHtml() {
  const p = getPlayerState();
  const offers = reverseOfferList();
  const t = p.task && p.task.status === 'active' ? p.task : null;
  let html = '';

  html += '<div class="rhud-board"><div class="rhud-board-hd"><span>今天挂出来的活</span><span>' + offers.length + ' 条</span></div>';
  if (!offers.length) {
    html += '<div class="rhud-chalk m">板上还空着。她下次开口的时候，会往上添一条。</div>';
  } else {
    offers.forEach(function(o) {
      const kindText = o.kind === 'turns' ? ('撑住 ' + o.remaining + ' 回合') : (o.kind === 'e' ? '让她好感真的涨' : ('做到 ' + o.need + ' 次'));
      html += '<div class="rhud-offer">' +
        '<div class="rhud-chalk"><span class="t">' + rvEsc(o.title) + '</span>' +
          (o.desc ? '<br><span class="m">' + rvEsc(o.desc) + '</span>' : '') +
          '<br><span class="r">+' + o.reward + ' 分</span>　<span class="m">' + kindText + ' · 剩 ' + o.remaining + ' 回合</span>' +
        '</div>' +
        '<div class="rhud-offer-act">' +
          '<div class="rhud-btn hot" data-rhud="accept" data-id="' + rvEsc(o.id) + '">接下这活</div>' +
          '<div class="rhud-btn" data-rhud="decline" data-id="' + rvEsc(o.id) + '">算了</div>' +
        '</div>' +
      '</div>';
    });
  }
  html += '</div>';

  if (t) {
    const pct = Math.min(100, Math.round(rvNum(t.progress, 0) / Math.max(1, rvNum(t.target.need, 1)) * 100));
    html += '<div class="rhud-board"><div class="rhud-board-hd"><span>手上在做</span><span>剩 ' + rvNum(t.remaining, 0) + ' 回合</span></div>' +
      '<div class="rhud-chalk"><span class="t">' + rvEsc(t.title) + '</span>' +
      (t.desc ? '<br><span class="m">' + rvEsc(t.desc) + '</span>' : '') +
      '<br><span class="m">进度 ' + rvNum(t.progress, 0) + ' / ' + rvNum(t.target.need, 0) + '</span>' +
      '<br><span class="r">+ ' + Math.round(rvNum(t.reward, 0) * (rvNum(t.rewardMul, 1) || 1)) + ' 分</span></div>' +
      '<div class="rhud-tok-bar" style="margin-top:6px;"><i style="width:' + pct + '%"></i></div>' +
      '</div>';
  }
  return html;
}

function reverseHudShelfHtml() {
  const lib = getItemLibrary();
  const st = getPlayerState();
  const list = (st.shelf || []).filter(function(s) { return s && lib.items[s.id]; });
  let html = '';
  if (!list.length) {
    html += '<div class="rhud-empty">架子上是空的。<br>过 3 个游戏日会自己补货。</div>';
  } else {
    html += '<div class="rhud-shelf">';
    list.forEach(function(s) {
      const it = lib.items[s.id];
      const r = REVERSE_RARITY[it.rarity] || REVERSE_RARITY.common;
      const price = rvNum(s.price, 0);
      const afford = rvNum(st.points, 0) >= price;
      const stock = rvNum(s.stock, 0);
      const soldOut = stock <= 0;
      html += '<div class="rhud-book' + ((afford && !soldOut) ? '' : ' no') + '" data-rhud="buy" data-id="' + rvEsc(s.id) + '">' +
        '<div class="spine" style="background:linear-gradient(180deg,' + r.color + '33 0%,#221626 45%,' + r.color + '22 100%);color:' + r.color + ';border-color:' + r.color + '88;">' +
          rvEsc(it.name) +
        '</div>' +
        '<div class="price">' + (soldOut ? '售罄' : (price + ' 分')) + '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  if ((st.gemShelf || []).length) {
    html += '<div class="rhud-gemshelf"><div class="hd">宝石橱窗</div>' +
      '<div style="font:500 9px/1.4 \'Courier New\',monospace;color:#9c7d93;margin-bottom:4px;">攒够 1000 直接拿走，永久不会掉</div>';
    (st.gemShelf || []).forEach(function(s) {
      const it = lib.items[s.id];
      if (!it) return;
      const afford = rvNum(st.points, 0) >= rvNum(s.price, 0);
      html += '<div class="rhud-book' + (afford ? '' : ' no') + '" data-rhud="buy" data-id="' + rvEsc(s.id) + '" style="flex-direction:row;justify-content:space-between;align-items:center;gap:6px;">' +
        '<span style="font:600 10.5px/1.3 \'MP Fusion Pixel\',monospace;color:#fde047;">' + rvEsc(it.name) + '</span>' +
        '<span class="price">' + rvNum(s.price, 0) + ' 分</span>' +
      '</div>';
    });
    html += '</div>';
  }
  html += '<div class="rhud-empty" style="padding:8px 2px 2px;text-align:left;font-size:9.5px;">' +
    '<span class="rhud-btn" data-rhud="refresh" style="display:inline-block;">刷新货架</span>' +
    '<span style="margin-left:6px;color:#8a6b82;">手上 ' + rvNum(st.points, 0) + ' 分</span></div>';
  return html;
}

function reverseHudBagHtml() {
  const lib = getItemLibrary();
  const st = getPlayerState();
  const keys = Object.keys(st.inventory || {}).filter(function(k) { return rvNum(st.inventory[k], 0) > 0 && lib.items[k]; });
  const cells = [];
  keys.forEach(function(k) {
    cells.push({ id: k, name: lib.items[k].name, n: rvNum(st.inventory[k], 0), rarity: lib.items[k].rarity });
  });
  const total = Math.max(8, Math.ceil(cells.length / 4) * 4);
  let html = '<div class="rhud-bag">';
  for (let i = 0; i < total; i++) {
    const c = cells[i];
    if (!c) { html += '<div class="rhud-slot empty"></div>'; continue; }
    const r = REVERSE_RARITY[c.rarity] || REVERSE_RARITY.common;
    html += '<div class="rhud-slot" data-rhud="use" data-id="' + rvEsc(c.id) + '" style="border-color:' + r.color + '99;">' +
      '<span style="color:' + r.color + ';">' + rvEsc(c.name) + '</span>' +
      '<span class="n">' + c.n + '</span>' +
    '</div>';
  }
  html += '</div>';
  if (!cells.length) html += '<div class="rhud-empty">包里空着。<br>去货架上看看。</div>';
  html += '<div class="rhud-empty" style="padding:8px 2px 2px;text-align:left;font-size:9.5px;color:#8a6b82;">点一下格子就用掉；用完会告诉 AI 演出来。</div>';
  return html;
}

function reverseHudTokenHtml() {
  const stats = reverseTokenStats();
  const bars = ['', 'b2', 'b3', 'b4'];
  let html = '<div class="rhud-tok-total"><span style="color:#c79bb8;">整个上下文（估）</span><b>' + reverseFmtTokens(stats.total) + '</b></div>';
  stats.rows.forEach(function(r, i) {
    html += '<div class="rhud-tok-row">' +
      '<div class="rhud-tok-hd"><b>' + rvEsc(r.name) + '</b><span>' + reverseFmtTokens(r.tokens) + '　' + r.pct + '%</span></div>' +
      '<div class="rhud-tok-bar"><i class="' + bars[i % 4] + '" style="width:' + Math.max(r.tokens ? 3 : 0, r.pct) + '%"></i></div>' +
      '<div style="font:500 9px/1.4 \'PingFang SC\',sans-serif;color:#8a6b82;margin-top:2px;">' + rvEsc(r.detail) + '</div>' +
    '</div>';
  });
  html += '<div class="rhud-tok-note">这是估算：中文按 1 字 ≈ 0.75 token，其他按 4 字符 ≈ 1 token。' +
    '不同模型的分词器会有出入，看的是谁占得多，不是精确值。</div>';
  return html;
}

function reverseHudRender() {
  const box = reverseHudEl();
  if (!box) return;
  if (!isReverseModeOn()) { reverseHudClose(); return; }
  const tab = reverseHudTab();
  const tabsEl = box.querySelector('.rhud-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = REVERSE_HUD_TABS.map(function(t) {
      return '<div class="rhud-tab' + (t.id === tab ? ' on' : '') + '" data-rhud="tab" data-tab="' + t.id + '" title="' + t.full + '">' + t.name + '</div>';
    }).join('');
  }
  const body = box.querySelector('.rhud-body');
  if (body) {
    try {
      body.innerHTML = tab === 'shelf' ? reverseHudShelfHtml()
        : tab === 'bag' ? reverseHudBagHtml()
        : tab === 'token' ? reverseHudTokenHtml()
        : reverseHudBoardHtml();
    } catch (e) {
      body.innerHTML = '<div class="rhud-empty">这一页出错了：' + rvEsc(String(e && e.message || e).slice(0, 60)) + '</div>';
    }
  }
  const p = getPlayerState();
  const fl = box.querySelector('.rhud-foot-l');
  const fr = box.querySelector('.rhud-foot-r');
  if (fl) fl.textContent = '积分 ' + rvNum(p.points, 0) + ' · 券 ' + rvNum(p.wheelTickets, 0);
  if (fr) fr.textContent = '攻略模式';
  reverseHudRefreshBadge();
}

/* 所有交互走一个委托，重绘后不用重绑 */
function reverseHudHandleClick(ev) {
  const t = ev.target;
  if (!t || !t.closest) return;
  const closeBtn = t.closest('.rhud-close');
  if (closeBtn) { reverseHudClose(); return; }
  const node = t.closest('[data-rhud]');
  if (!node) return;
  const act = node.getAttribute('data-rhud');
  const id = node.getAttribute('data-id') || '';

  if (act === 'tab') {
    reverseHudSetTab(node.getAttribute('data-tab') || 'board');
    reverseHudRender();
    return;
  }
  if (act === 'accept') {
    const r = reverseAcceptOffer(id);
    try { toast(r.ok ? '接下了 · 积分 +' + REVERSE_OFFER_ACCEPT_POINTS : (r.reason || '接不了'), r.ok ? 'success' : 'info'); } catch (e) {}
    reverseHudRender();
    return;
  }
  if (act === 'decline') {
    reverseDeclineOffer(id);
    reverseHudRender();
    return;
  }
  if (act === 'buy') {
    const r = reverseBuy('player', id);
    try { toast(r.ok ? (r.text || '买下了') : (r.reason || '买不了'), r.ok ? 'success' : 'warning'); } catch (e) {}
    reverseHudRender();
    return;
  }
  if (act === 'use') {
    const r = reverseUseItem('player', id);
    try { toast(r.ok ? (r.text || '用掉了') : (r.reason || '用不了'), r.ok ? 'success' : 'warning'); } catch (e) {}
    reverseHudRender();
    return;
  }
  if (act === 'refresh') {
    const r = reverseMaybeRefreshShelves(true);
    try { toast((r.role || r.player) ? '货架已经换过一轮' : '还在冷却里，过一会儿再刷', (r.role || r.player) ? 'success' : 'info'); } catch (e) {}
    reverseHudRender();
    return;
  }
}

/* 挂在设置面板里的开关（默认开） */
function reverseHudEnabled() {
  const s = getReverseSettings();
  return s.hud !== false;
}
function reverseHudSync() {
  try {
    if (isReverseModeOn() && reverseHudEnabled()) reverseHudMount();
    else reverseHudUnmount();
  } catch (e) {}
}
