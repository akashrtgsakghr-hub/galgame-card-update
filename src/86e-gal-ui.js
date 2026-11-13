/* 86e-gal-ui.js —— Galgame 沉浸界面。
   只做展示与交互，不改聊天记录；所有"发送"都交给酒馆原生输入框与发送按钮。 */

  const GAL_RUNTIME = {
    floor: -1, page: 0, pages: null, parsed: null, choices: [],
    cacheKey: '', typedKey: '', cgShownFor: '', typeTimer: null, typing: false,
    autoPlay: false, autoTimer: null, skip: false,
    hideUI: false, reviewMode: false, waiting: false, sheet: ''
  };

  function injectGalStyle() {
    let el = mainDoc.getElementById(GAL_STYLE_ID);
    if (!el) { el = mainDoc.createElement('style'); el.id = GAL_STYLE_ID; mainDoc.head.appendChild(el); }
    el.textContent = `
.mp-gal-root{position:fixed;inset:0;z-index:2147483000;display:none;overflow:hidden;
  --k-ink-0:#0a0509;--k-ink-1:#0e0e12;--k-ink-2:#141419;--k-ink-3:#1b1b22;
  --k-line:rgba(244,239,231,.10);--k-line-2:rgba(244,239,231,.18);
  --k-fg:#f4efe7;--k-fg-2:rgba(244,239,231,.62);--k-fg-3:rgba(244,239,231,.34);
  /* 墨樱粉保留为兼容令牌（面板等其他界面仍在用），沉浸层本身只用月光铜 */
  --k-accent:#f472d0;--k-accent-2:#ffb3e8;
  --k-brass:#e9cba4;--k-brass-2:#f7e7cf;
  --k-shadow:rgba(4,4,6,.72);
  --k-font-pixel:"MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","Courier New",monospace;
  --k-font-body:"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",-apple-system,sans-serif;
  --k-font-serif:"Songti SC","Noto Serif CJK SC","Source Han Serif SC","Source Han Serif CN","STSong","SimSun",serif;
  --k-ease:cubic-bezier(.16,1,.3,1);
  background:var(--k-ink-0) !important;
  font-family:var(--k-font-body);
  color:var(--gal-color,var(--k-fg));-webkit-tap-highlight-color:transparent;
  text-rendering:optimizeLegibility;}
.mp-gal-root.open{display:block;animation:mpGalFade .34s ease;}
@keyframes mpGalFade{from{opacity:0}to{opacity:1}}
/* 胶片颗粒：压在整屏最上层，只做质感，不挡点击 */
.mp-gal-root::after{content:"";position:absolute;inset:0;z-index:30;pointer-events:none;
  opacity:.05;mix-blend-mode:soft-light;background-size:180px 180px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E");}

.mp-gal-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-color:var(--k-ink-0);
  filter:saturate(.92) contrast(1.03);transition:background-image .45s ease;z-index:0;}
/* 底图压层：一圈暗角 + 下重上轻的渐变。台词不靠色块托底，靠这片暗下来的画面 */
.mp-gal-bg::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(76% 62% at 50% 44%,transparent 38%,rgba(5,5,8,.46) 100%),
    radial-gradient(120% 70% at 50% -10%,rgba(233,203,164,.07),transparent 62%);}
.mp-gal-bg::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(6,6,9,.52) 0%,rgba(6,6,9,.03) 17%,rgba(6,6,9,.06) 52%,rgba(6,6,9,.66) 88%,rgba(6,6,9,.82) 100%);}
.mp-gal-sprite-layer{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;z-index:1;pointer-events:none;}
.mp-gal-sprite{max-height:82%;max-width:46%;object-fit:contain;filter:drop-shadow(0 12px 30px rgba(6,3,7,.55));
  transition:opacity .3s ease, transform .3s ease;}
.mp-gal-sprite.side-left{margin-right:auto;margin-left:4%;}
.mp-gal-sprite.side-right{margin-left:auto;margin-right:4%;}
.mp-gal-cg{position:absolute;inset:0;z-index:2;display:none;align-items:center;justify-content:center;
  background:rgba(4,4,6,.96);cursor:pointer;}
.mp-gal-cg.show{display:flex;}
.mp-gal-cg img{max-width:94%;max-height:90%;object-fit:contain;border-radius:2px;
  box-shadow:0 30px 90px rgba(4,4,7,.8),0 0 0 1px rgba(244,239,231,.10);}

/* ── 顶栏：一排字，没有按钮框。返回靠左，工具组在桌面端贴右 ───────── */
.mp-gal-top{position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:0;
  padding:calc(env(safe-area-inset-top,0px) + 6px) 18px 26px;
  background:linear-gradient(180deg,rgba(5,5,8,.62) 0%,rgba(5,5,8,.24) 58%,rgba(5,5,8,0) 100%);
  transition:opacity .22s ease,transform .22s ease;}
.mp-gal-title{display:none;}
.mp-gal-top-right{flex:1 1 auto;min-width:0;display:flex;flex-wrap:nowrap;gap:2px;justify-content:flex-start;
  overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;padding:2px 0;}
.mp-gal-top-right::-webkit-scrollbar{display:none;}

/* 文字按钮：无底色、无描边，只有字和一条扫过的发丝下划线 */
.mp-gal-top button,.mp-gal-toolbar button{position:relative;font-family:inherit;cursor:pointer;
  min-height:44px;padding:6px 12px;box-sizing:border-box;border:0;border-radius:0;background:transparent;
  color:var(--k-fg-2);font:400 11px/1.2 var(--k-font-body);letter-spacing:.18em;white-space:nowrap;
  transition:color .18s ease;}
.mp-gal-top button::after,.mp-gal-toolbar button::after{content:"";position:absolute;left:12px;right:12px;bottom:11px;
  height:1px;background:var(--k-brass);opacity:.85;transform:scaleX(0);transform-origin:left center;
  transition:transform .3s var(--k-ease);}
.mp-gal-top button:hover,.mp-gal-top button:focus-visible,
.mp-gal-toolbar button:hover,.mp-gal-toolbar button:focus-visible{color:var(--k-fg);}
.mp-gal-top button:hover::after,.mp-gal-top button:focus-visible::after,
.mp-gal-toolbar button:hover::after,.mp-gal-toolbar button:focus-visible::after{transform:scaleX(1);}
.mp-gal-top button[data-on="1"]{color:var(--k-brass);}
.mp-gal-top button[data-on="1"]::after{transform:scaleX(1);opacity:.45;}
.mp-gal-top .mp-gal-back{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;
  margin-right:10px;padding-right:18px;border-right:1px solid var(--k-line);
  color:var(--k-fg);letter-spacing:.24em;}
.mp-gal-top .mp-gal-back::before{content:"";width:6px;height:6px;
  border-left:1px solid currentColor;border-bottom:1px solid currentColor;
  opacity:.8;transform:rotate(45deg);margin-top:-1px;}
.mp-gal-top button:active,.mp-gal-toolbar button:active{transform:translateY(1px);}
.mp-gal-top :is(button,[data-gal-act]):focus-visible,.mp-gal-toolbar button:focus-visible{
  outline:1px solid rgba(233,203,164,.7);outline-offset:2px;}

/* ── 对话框：没有盒子。台词落在一片柔和的光池上 ───────────────────── */
/* 护眼层给 .mp-gal-dialog 塞过 --mp-l2 底色；这里用 (0,2,0) + !important + 后注入压回去 */
.mp-gal-root .mp-gal-dialog{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 6px);
  transform:translateX(-50%);width:min(820px,calc(100% - 24px));z-index:5;box-sizing:border-box;
  display:grid;grid-template-columns:1fr auto;
  grid-template-areas:"name name" "text text" "meta next";
  background:radial-gradient(124% 128% at 50% 116%,rgba(5,5,8,.86) 0%,rgba(5,5,8,.60) 44%,rgba(5,5,8,.20) 72%,rgba(5,5,8,0) 88%) !important;
  border:0 !important;border-radius:0 !important;box-shadow:none !important;
  backdrop-filter:none;-webkit-backdrop-filter:none;
  padding:36px 26px 26px;min-height:124px;
  transition:opacity .2s ease,transform .24s var(--k-ease);}
.mp-gal-name{grid-area:name;font:400 12.5px/1.4 var(--k-font-serif);letter-spacing:.34em;
  color:var(--k-brass);margin-bottom:13px;display:flex;align-items:center;gap:11px;min-height:0;}
.mp-gal-name:empty{display:none;}
.mp-gal-name::before{content:"";flex:0 0 auto;width:24px;height:1px;background:var(--k-brass);opacity:.5;}
.mp-gal-text{grid-area:text;font-size:var(--gal-fs,17.5px);line-height:var(--gal-lh,1.95);
  letter-spacing:.015em;color:var(--gal-color,var(--k-fg));
  white-space:pre-wrap;word-break:break-word;max-height:34vh;overflow:hidden;
  background:transparent !important;padding:0 !important;border:0 !important;
  text-shadow:0 1px 3px rgba(2,2,4,.62);}
/* 旁白用宋、台词用黑：像剧本里的舞台指示与对白，各自听起来不一样 */
.mp-gal-text .gal-narr{font-family:var(--k-font-serif);font-size:calc(var(--gal-fs,17.5px) - .5px);
  line-height:calc(var(--gal-lh,1.95) + .05);color:rgba(244,239,231,.80);letter-spacing:.03em;font-style:normal;}
.mp-gal-text .gal-body{color:var(--gal-color,var(--k-fg));letter-spacing:.01em;}
.mp-gal-text .gal-thought{font-family:var(--k-font-serif);font-style:normal;
  color:#b9cbd2;opacity:.94;letter-spacing:.03em;}
.mp-gal-next{grid-area:next;align-self:end;justify-self:end;margin-top:18px;
  font:400 8px/1 var(--k-font-pixel);color:var(--k-brass);opacity:.35;
  animation:mpGalBlink 2.6s ease-in-out infinite;}
@keyframes mpGalBlink{0%,100%{opacity:.22;transform:translateY(0)}50%{opacity:.9;transform:translateY(2px)}}
.mp-gal-meta{grid-area:meta;align-self:end;margin-top:18px;
  font:400 9.5px/1.4 var(--k-font-pixel);color:rgba(244,239,231,.42);letter-spacing:.18em;}

/* ── 选项：一张表，不是两个按钮。发丝分隔 + 极薄磨砂 + 序号 ────────── */
.mp-gal-choices{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:min(580px,calc(100% - 44px));max-height:62vh;overflow-y:auto;z-index:7;display:none;
  flex-direction:column;gap:0;scrollbar-width:none;padding:16px 0;box-sizing:border-box;
  background:radial-gradient(78% 96% at 50% 50%,rgba(4,4,7,.82) 0%,rgba(4,4,7,.60) 36%,rgba(4,4,7,.20) 64%,rgba(4,4,7,0) 82%);}
.mp-gal-choices::-webkit-scrollbar{display:none;}
.mp-gal-choices.show{display:flex;}
.mp-gal-choice{position:relative;width:100%;text-align:left;cursor:pointer;font-family:inherit;
  display:flex;align-items:baseline;gap:15px;box-sizing:border-box;
  padding:15px 16px 15px 13px;border:0;border-radius:0;
  background:transparent;
  color:var(--k-fg);font-size:15.5px;line-height:1.55;letter-spacing:.02em;
  text-shadow:0 1px 3px rgba(2,2,4,.5);
  animation:galChoiceIn .46s var(--k-ease) both;animation-delay:calc(var(--i,0) * 70ms);
  transition:background .18s ease,border-color .18s ease,color .18s ease;}
/* 分隔线两端渐隐：线条融进画里，而不是划过整张照片 */
.mp-gal-choice::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;
  background:linear-gradient(90deg,rgba(244,239,231,0) 0%,rgba(244,239,231,.17) 16%,
    rgba(244,239,231,.17) 84%,rgba(244,239,231,0) 100%);
  transition:background .18s ease;}
.mp-gal-choice:first-child::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;pointer-events:none;
  background:linear-gradient(90deg,rgba(244,239,231,0) 0%,rgba(244,239,231,.17) 16%,
    rgba(244,239,231,.17) 84%,rgba(244,239,231,0) 100%);}
@keyframes galChoiceIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
.mp-gal-choice:hover,.mp-gal-choice:focus-visible{
  background:linear-gradient(90deg,rgba(233,203,164,.11) 0%,rgba(233,203,164,.04) 62%,rgba(233,203,164,0) 100%);
  color:#fffaf2;outline:none;}
.mp-gal-choice:hover::after,.mp-gal-choice:focus-visible::after{
  background:linear-gradient(90deg,rgba(233,203,164,0) 0%,rgba(233,203,164,.55) 16%,
    rgba(233,203,164,.55) 84%,rgba(233,203,164,0) 100%);}
.mp-gal-choice:focus-visible{box-shadow:inset 0 0 0 1px rgba(233,203,164,.35);}
.mp-gal-choice .gal-choice-idx{flex:0 0 auto;width:auto;height:auto;line-height:1;
  background:none;border-radius:0;text-align:left;font:400 9.5px/1 var(--k-font-pixel);
  letter-spacing:.14em;color:rgba(233,203,164,.55);transform:translateY(-1px);
  transition:color .18s ease;}
.mp-gal-choice:hover .gal-choice-idx{color:var(--k-brass-2);}

/* ── 底部工具栏：一条控制带，项与项之间只有发丝线 ─────────────────── */
.mp-gal-toolbar{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);
  transform:translateX(-50%) translateY(150%);z-index:8;
  display:flex;gap:0;align-items:center;padding:2px 6px;border-radius:2px;
  background:rgba(8,8,11,.86);border:1px solid var(--k-line);
  box-shadow:0 20px 48px rgba(4,4,7,.58);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  transition:transform .3s var(--k-ease),opacity .2s ease;opacity:0;
  max-width:calc(100% - 18px);flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none;}
.mp-gal-toolbar::-webkit-scrollbar{display:none;}
.mp-gal-toolbar button{border-left:1px solid rgba(244,239,231,.07);border-radius:0;}
.mp-gal-toolbar button:first-child{border-left:0;}
.mp-gal-toolbar.show{transform:translateX(-50%) translateY(0);opacity:1;}
.mp-gal-edge{position:absolute;left:0;right:0;bottom:0;height:34px;z-index:4;}
.mp-gal-root.hide-ui .mp-gal-top{opacity:0;pointer-events:none;transform:translateY(-12px);}
.mp-gal-root.hide-ui .mp-gal-dialog{opacity:0;pointer-events:none;transform:translateX(-50%) translateY(26px);}
.mp-gal-root.hide-ui .mp-gal-edge{height:70px;}
/* 工具栏弹出时把台词抬起来，别压在控制带上（不支持 :has 就退回原位重叠） */
.mp-gal-root:not(.hide-ui):has(.mp-gal-toolbar.show) .mp-gal-dialog{
  transform:translateX(-50%) translateY(-56px);}

/* ── 抽屉（历史 / 存档 / 设置 / 标签） ─────────────────────────────── */
.mp-gal-sheet-mask{position:absolute;inset:0;z-index:20;background:rgba(4,4,6,.84) !important;
  display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;
  backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}
.mp-gal-root .mp-gal-sheet{width:min(540px,100%);max-height:86dvh;overflow-y:auto;
  background:#101014 !important;border:1px solid var(--k-line) !important;border-radius:3px !important;
  padding:22px 20px;box-sizing:border-box;
  box-shadow:0 34px 90px rgba(4,4,7,.72) !important;}
.mp-gal-sheet h3{margin:0 0 16px;font:400 12px/1.4 var(--k-font-serif);letter-spacing:.26em;color:var(--k-brass);
  display:flex;justify-content:space-between;align-items:center;gap:8px;}
.mp-gal-sheet .gal-sec{border-top:1px solid var(--k-line);padding-top:14px;margin-top:14px;}
.mp-gal-sheet .gal-sec:first-of-type{border-top:none;padding-top:0;margin-top:0;}
.mp-gal-sheet .gal-label{font-size:10.5px;font-weight:400;color:rgba(233,203,164,.82);
  letter-spacing:.2em;margin-bottom:10px;}
.mp-gal-sheet .gal-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;font-size:12.5px;color:var(--k-fg-2);}
.mp-gal-sheet input[type=range]{width:150px;accent-color:var(--k-brass);}
.mp-gal-sheet input[type=text],.mp-gal-sheet textarea,.mp-gal-sheet select{width:100%;box-sizing:border-box;
  background:#0b0b0e;border:1px solid var(--k-line);border-radius:2px;color:var(--k-fg);font-size:12.5px;
  padding:9px 10px;font-family:inherit;outline:none;transition:border-color .18s ease,box-shadow .18s ease;}
.mp-gal-sheet input[type=text]:focus,.mp-gal-sheet textarea:focus,.mp-gal-sheet select:focus{
  border-color:rgba(233,203,164,.55);box-shadow:0 0 0 1px rgba(233,203,164,.20);}
.mp-gal-sheet button{font-family:inherit;cursor:pointer;min-height:38px;padding:8px 12px;box-sizing:border-box;
  border:1px solid var(--k-line);border-radius:2px;background:rgba(244,239,231,.03);
  color:var(--k-fg-2);font:400 11.5px/1.25 var(--k-font-body);letter-spacing:.06em;
  transition:background .18s ease,border-color .18s ease,color .18s ease;}
.mp-gal-sheet button:hover{background:rgba(233,203,164,.10);border-color:rgba(233,203,164,.34);color:var(--k-brass-2);}
.mp-gal-sheet button:focus-visible{outline:1px solid rgba(233,203,164,.7);outline-offset:2px;}
.mp-gal-sheet .gal-seg{display:flex;flex-wrap:wrap;gap:6px;}
.mp-gal-sheet .gal-seg button{flex:1 1 auto;min-width:78px;font-size:11px;}
.mp-gal-sheet .gal-seg button.on{background:rgba(233,203,164,.14);border-color:rgba(233,203,164,.55);
  color:var(--k-brass-2);font-weight:600;}
.mp-gal-sheet .gal-hint{font-size:10.5px;color:var(--k-fg-3);line-height:1.7;margin-top:8px;}
.mp-gal-sheet .gal-warn{font-size:11px;color:#ffcf8b;line-height:1.7;margin-top:8px;background:rgba(255,207,139,.06);
  border-left:1px solid rgba(255,207,139,.55);border-radius:0;padding:9px 11px;}
.mp-gal-sheet .gal-list{display:flex;flex-direction:column;gap:0;max-height:230px;overflow-y:auto;}
.mp-gal-sheet .gal-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 2px;
  border-radius:0;background:none;border:0;border-bottom:1px solid var(--k-line);font-size:12px;color:var(--k-fg);}
.mp-gal-sheet .gal-item .gal-item-main{flex:1;min-width:0;}
.mp-gal-sheet .gal-item .gal-item-sub{font-size:10.5px;color:var(--k-fg-3);margin-top:3px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;}

/* ── 空状态 ───────────────────────────────────────────────────────── */
.mp-gal-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;
  color:var(--k-fg-2);font-size:12.5px;z-index:3;padding:24px;text-align:center;line-height:1.8;}
.mp-gal-empty .mp-gal-empty-title{font:400 15px/1.5 var(--k-font-serif);letter-spacing:.22em;color:var(--k-brass);}
.mp-gal-empty .mp-gal-empty-sub{font-size:11px;color:var(--k-fg-3);letter-spacing:.06em;}

.mp-gal-root.is-phone .mp-gal-dialog{padding:30px 18px 22px;min-height:112px;}
.mp-gal-root.is-phone .mp-gal-text{font-size:calc(var(--gal-fs,17.5px) - 1px);max-height:36vh;}
@media (min-width:900px){
  .mp-gal-top{padding-left:26px;padding-right:26px;}
  .mp-gal-top-right{margin-left:auto;justify-content:flex-end;}
  .mp-gal-dialog{width:min(860px,calc(100% - 48px));}
  .mp-gal-choices{width:min(600px,calc(100% - 80px));}
}
@media (max-width:640px){
  .mp-gal-sprite{max-height:72%;max-width:70%;}
  .mp-gal-top{padding-left:12px;padding-right:12px;padding-bottom:22px;}
  .mp-gal-top button,.mp-gal-toolbar button{padding:6px 9px;font-size:10.5px;letter-spacing:.12em;}
  .mp-gal-top button::after,.mp-gal-toolbar button::after{left:9px;right:9px;}
  .mp-gal-top .mp-gal-back{font-size:0;letter-spacing:0;gap:0;padding:6px 12px 6px 8px;margin-right:4px;}
  .mp-gal-top .mp-gal-back::before{width:7px;height:7px;}
  .mp-gal-top-right{-webkit-mask-image:linear-gradient(90deg,#0c0c0e 0,#0c0c0e calc(100% - 14px),transparent 100%);
    mask-image:linear-gradient(90deg,#0c0c0e 0,#0c0c0e calc(100% - 14px),transparent 100%);}
  .mp-gal-choice{padding:14px 14px 14px 12px;font-size:15px;gap:12px;}
}
@media (prefers-reduced-motion:reduce){
  .mp-gal-root.open,.mp-gal-choice{animation:none !important;}
  .mp-gal-next{animation:none;opacity:.55;}
  .mp-gal-top button::after,.mp-gal-toolbar button::after{transition:none;}
}
`;
  }

  /* ── 根节点 ─────────────────────────────────────────────── */
  function galEnsureRoot() {
    let root = mainDoc.getElementById(GAL_ROOT_ID);
    if (root) return root;
    injectGalStyle();
    root = mainDoc.createElement('div');
    root.id = GAL_ROOT_ID;
    root.className = 'mp-gal-root';
    /* 关键几何写成内联：万一 <style> 没进去（CSP / 别的扩展清理 head），
       层至少还是一个铺满屏幕的容器，不至于「点了什么也没发生」。 */
    root.style.position = 'fixed';
    root.style.top = '0';
    root.style.right = '0';
    root.style.bottom = '0';
    root.style.left = '0';
    root.style.zIndex = '2147483000';
    root.style.display = 'none';
    root.style.overflow = 'hidden';
    root.innerHTML = '' +
      '<div class="mp-gal-bg"></div>' +
      '<div class="mp-gal-sprite-layer"></div>' +
      '<div class="mp-gal-cg"><img alt="event cg"></div>' +
      '<div class="mp-gal-empty" id="mp-gal-empty" style="display:none"></div>' +
      '<div class="mp-gal-top">' +
        '<button type="button" class="mp-gal-back" data-gal-act="exit">返回</button>' +
        '<span class="mp-gal-title">Galgame Mode</span>' +
        '<div class="mp-gal-top-right">' +
          '<button type="button" data-gal-act="moon">系统</button>' +
          '<button type="button" data-gal-act="cg">CG</button>' +
          '<button type="button" data-gal-act="input">输入</button>' +
          '<button type="button" data-gal-act="history">历史</button>' +
          '<button type="button" data-gal-act="saves">存档</button>' +
          '<button type="button" data-gal-act="tagmap">标签</button>' +
          '<button type="button" data-gal-act="settings">设置</button>' +
          '<button type="button" data-gal-act="hide">隐藏</button>' +
        '</div>' +
      '</div>' +
      '<div class="mp-gal-dialog" id="mp-gal-dialog">' +
        '<div class="mp-gal-name" id="mp-gal-name"></div>' +
        '<div class="mp-gal-text" id="mp-gal-text"></div>' +
        '<div class="mp-gal-meta" id="mp-gal-meta"></div>' +
        '<div class="mp-gal-next" id="mp-gal-next">▼</div>' +
      '</div>' +
      '<div class="mp-gal-choices" id="mp-gal-choices"></div>' +
      '<div class="mp-gal-toolbar" id="mp-gal-toolbar">' +
        '<button type="button" data-gal-act="prev">上一页</button>' +
        '<button type="button" data-gal-act="next">下一页</button>' +
        '<button type="button" data-gal-act="auto">自动</button>' +
        '<button type="button" data-gal-act="skip">已读跳过</button>' +
        '<button type="button" data-gal-act="input">自由输入</button>' +
        '<button type="button" data-gal-act="fullscreen">全屏</button>' +
      '</div>' +
      '<div class="mp-gal-edge" id="mp-gal-edge"></div>';
    mainDoc.body.appendChild(root);
    galBindRootEvents(root);
    return root;
  }

  function galBindRootEvents(root) {
    root.addEventListener('click', function(e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-gal-act]') : null;
      if (btn) {
        const act = btn.getAttribute('data-gal-act');
        galHandleAction(act, btn);
        return;
      }
      // 点 CG 关闭 CG
      if (e.target && e.target.closest && e.target.closest('.mp-gal-cg')) {
        const cg = root.querySelector('.mp-gal-cg');
        if (cg) cg.classList.remove('show');
        return;
      }
      // 点舞台/边条：推进一页
      if (e.target && e.target.closest && (e.target.closest('.mp-gal-dialog') || e.target.closest('.mp-gal-edge') || e.target === root)) {
        galAdvance();
      }
    });
    // 隐藏 UI 时点边缘呼出工具栏
    root.addEventListener('mousemove', function(e) {
      if (!GAL_RUNTIME.hideUI) return;
      const h = (mainWin.innerHeight || 800);
      if (e.clientY > h - 90) galShowToolbar(true);
    });
    root.addEventListener('touchstart', function(e) {
      if (!GAL_RUNTIME.hideUI) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      const h = (mainWin.innerHeight || 800);
      if (t.clientY > h - 110) galShowToolbar(true);
    }, { passive: true });
  }

  function galRootEl() { return mainDoc.getElementById(GAL_ROOT_ID); }

  /* 最近一条 AI 回复的下标；没有就返回 -1 */
  function galLatestAiIndex() {
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) { return -1; }
    if (!ctx || !Array.isArray(ctx.chat)) return -1;
    for (let i = ctx.chat.length - 1; i >= 0; i--) {
      if (ctx.chat[i] && !ctx.chat[i].is_user) return i;
    }
    return -1;
  }
  function galApplyCssVars(root) {
    const s = galGetSettings();
    root.style.setProperty('--gal-op', String(s.boxOpacity));
    root.style.setProperty('--gal-fs', (Number(s.fontSize) || 17) + 'px');
    root.style.setProperty('--gal-lh', String(s.lineHeight || 1.75));
    root.style.setProperty('--gal-color', s.textColor || '#f8fafc');
    if (s.fontFamily) root.style.setProperty('--gal-font', s.fontFamily);
    root.classList.toggle('is-phone', galViewport().w < 640);
  }

  function galHandleAction(act, btn) {
    if (act === 'exit') galClose();
    else if (act === 'moon') { try { openPanel(); } catch (e) {} }
    else if (act === 'next') galNextPage();
    else if (act === 'prev') galPrevPage();
    else if (act === 'auto') galToggleAutoPlay();
    else if (act === 'skip') galSkipRead();
    else if (act === 'input') galOpenFreeInput();
    else if (act === 'fullscreen') galToggleFullscreen();
    else if (act === 'cg') galToggleCg();
    else if (act === 'hide') galToggleHideUI();
    else if (act === 'history') galOpenHistorySheet();
    else if (act === 'saves') galOpenSaveSheet();
    else if (act === 'tagmap') galOpenTagmapSheet();
    else if (act === 'settings') galOpenSettingsSheet();
    else if (act === 'sheet-close') galCloseSheet();
  }

  /* ── 打开 / 关闭 ───────────────────────────────────────── */
  function galOpen() {
    const root = galEnsureRoot();
    /* 酒馆重绘 / 切换聊天时可能把节点连同它的父容器一起换掉，
       节点还在内存里但已经不在文档上——这时怎么点都不会有画面。 */
    try { if (!root.isConnected || !mainDoc.body.contains(root)) mainDoc.body.appendChild(root); } catch (e) {}
    try { galApplyCssVars(root); } catch (e) {}
    root.style.display = 'block';
    root.classList.add('open');
    galPatchState({ on: true });
    GAL_RUNTIME.reviewMode = false;
    GAL_RUNTIME.waiting = false;
    GAL_RUNTIME.sheet = '';
    const st = galGetState();
    GAL_RUNTIME.floor = Number(st.floor) >= 0 ? Number(st.floor) : -1;
    GAL_RUNTIME.page = Number(st.page) || 0;
    /* 渲染失败也要把「已经打开」这件事做实，并把原因写在空状态里，
       否则玩家看到的就是「点了一下，什么都没发生」。 */
    try {
      galRender(true);
    } catch (e) {
      try { console.warn('[月相] 沉浸模式渲染失败：', e); } catch (e2) {}
      const empty = root.querySelector('#mp-gal-empty');
      if (empty) {
        empty.style.display = 'flex';
        empty.innerHTML = '<div class="mp-gal-empty-title">这一段没渲染出来</div>' +
          '<div>' + galEscape(e && e.message || e) + '</div>' +
          '<div class="mp-gal-empty-sub">可以先点左上角「← 返回」，或刷新一次再试。</div>';
      }
    }
    try { galMemoryWarnIfBroken(); } catch (e) {}
    return root;
  }

  function galClose() {
    const root = galRootEl();
    if (root) { root.classList.remove('open'); root.style.display = 'none'; galCloseSheet(); }
    galStopTimers();
    galPatchState({ on: false });
  }

  function galRelease() {
    const root = galRootEl();
    if (root && root.parentNode) { try { root.parentNode.removeChild(root); } catch (e) {} }
    galStopTimers();
  }

  function galToggle() {
    if (galIsOn()) galClose();
    else galOpen();
  }

  function galStopTimers() {
    if (GAL_RUNTIME.typeTimer) { clearInterval(GAL_RUNTIME.typeTimer); GAL_RUNTIME.typeTimer = null; }
    if (GAL_RUNTIME.autoTimer) { clearInterval(GAL_RUNTIME.autoTimer); GAL_RUNTIME.autoTimer = null; }
    GAL_RUNTIME.autoPlay = false;
    GAL_RUNTIME.skip = false;
    GAL_RUNTIME.typing = false;
  }

  /* ── 取当前要展示的消息 ─────────────────────────────────── */
  function galResolveFloor() {
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) { return null; }
    if (!ctx || !Array.isArray(ctx.chat) || !ctx.chat.length) return null;
    let idx = GAL_RUNTIME.floor;
    if (!(idx >= 0 && idx < ctx.chat.length) || (ctx.chat[idx] && ctx.chat[idx].is_user)) {
      idx = -1;
      for (let i = ctx.chat.length - 1; i >= 0; i--) {
        if (ctx.chat[i] && !ctx.chat[i].is_user) { idx = i; break; }
      }
    }
    if (idx < 0) return null;
    return { idx: idx, msg: ctx.chat[idx] };
  }

  function galPrepare() {
    const entry = galResolveFloor();
    if (!entry) {
      GAL_RUNTIME.parsed = null; GAL_RUNTIME.pages = null; GAL_RUNTIME.choices = [];
      return null;
    }
    const swipeId = Number(entry.msg.swipe_id) || 0;
    const fp = galFingerprint(entry.msg.mes) + '|' + galGetTagmapPresetId() + '|' + JSON.stringify(galLayoutMetrics().maxLines) + '|' + galLayoutMetrics().boxW;
    if (GAL_RUNTIME.cacheKey !== fp) {
      const parsed = galParseMessage(entry.msg.mes, galGetTagmap());
      const paged = galPaginate(parsed.blocks, galLayoutMetrics());
      GAL_RUNTIME.parsed = parsed;
      GAL_RUNTIME.pages = paged.pages;
      GAL_RUNTIME.choices = parsed.choices;
      GAL_RUNTIME.cacheKey = fp;
      // 进度里的总页数可能因换设备而变化，以本次分页为准
      const prog = galGetProgress(entry.idx, swipeId);
      if (prog.total !== paged.total) galSetProgress(entry.idx, swipeId, { total: paged.total });
    }
    return { entry: entry, swipeId: swipeId };
  }

  /* ── 主渲染 ─────────────────────────────────────────────── */
  function galRender(force) {
    const root = galRootEl();
    if (!root) return;
    galApplyCssVars(root);
    root.classList.toggle('hide-ui', GAL_RUNTIME.hideUI);
    const prep = galPrepare();
    const emptyEl = root.querySelector('#mp-gal-empty');
    const dialog = root.querySelector('#mp-gal-dialog');
    const choicesEl = root.querySelector('#mp-gal-choices');

    if (!prep) {
      if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.innerHTML = '<div class="mp-gal-empty-title">这段聊天还没有 AI 回复</div><div>先在酒馆里正常聊一句，再回到这里。</div><div class="mp-gal-empty-sub">这里只是换了个方式看剧情，不会替你发消息。</div>'; }
      if (dialog) dialog.style.display = 'none';
      if (choicesEl) choicesEl.classList.remove('show');
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (dialog) dialog.style.display = '';

    const st = galGetState();
    const total = (GAL_RUNTIME.pages || []).length;
    const prog = galGetProgress(prep.entry.idx, prep.swipeId);
    let page = force ? (Number(GAL_RUNTIME.page) || 0) : (Number(GAL_RUNTIME.page) || 0);
    if (page < 0) page = 0;
    if (page > total - 1) page = Math.max(0, total - 1);
    GAL_RUNTIME.page = page;

    galApplyBackground(root, st);
    galApplySprites(root, st);
    galApplyCg(root, st);
    galRenderPage(root, page, total, prep);
    galRenderChoices(root, page, total, prep);
    galUpdateToolbarState(root);
    // 只在真的变化时落盘，避免每次翻页都写一遍 metadata
    if (prog.p !== page || prog.total !== total) {
      galSetProgress(prep.entry.idx, prep.swipeId, { p: page, total: total });
    }
    const stNow = galGetState();
    if (stNow.floor !== prep.entry.idx || stNow.page !== page) {
      galPatchState({ floor: prep.entry.idx, page: page });
    }
  }

  function galApplyBackground(root, st) {
    const bgEl = root.querySelector('.mp-gal-bg');
    if (!bgEl) return;
    const parsed = GAL_RUNTIME.parsed;
    let url = String(st.view.bg || '');
    if (!url && parsed && parsed.directives) {
      const want = parsed.directives.bg || parsed.directives.scene;
      if (want) url = galResolveDirective('bg', want);
    }
    if (!url) {
      const base = galResolveAsset('bg', '默认');
      if (base) url = base;
    }
    bgEl.style.backgroundImage = url ? 'url("' + url.replace(/"/g, '\\"') + '")' : 'none';
  }

  function galResolveDirective(kind, raw) {
    const val = String(raw || '').trim();
    if (!val) return '';
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(val)) return val;
    return galResolveAsset(kind, val);
  }

  function galApplySprites(root, st) {
    const layer = root.querySelector('.mp-gal-sprite-layer');
    if (!layer) return;
    const parsed = GAL_RUNTIME.parsed;
    let wanted = [];
    if (parsed && parsed.directives && parsed.directives.sprite && parsed.directives.sprite.length) {
      wanted = parsed.directives.sprite.slice(0, 3);
    } else {
      wanted = Object.keys(st.view.sprites || {}).slice(0, 3);
    }
    const urls = [];
    wanted.forEach(function(name) {
      const url = galResolveDirective('sprite', name) || (st.view.sprites && st.view.sprites[name]) || '';
      if (url && urls.indexOf(url) < 0) urls.push(url);
    });
    if (!urls.length) {
      Object.keys(st.view.sprites || {}).forEach(function(k) {
        const u = st.view.sprites[k];
        if (u && urls.indexOf(u) < 0) urls.push(u);
      });
    }
    if (!urls.length) {
      const d = galResolveAsset('sprite', '默认');
      if (d) urls.push(d);
    }
    const sig = urls.join('|');
    if (layer.getAttribute('data-sig') === sig) return;
    layer.setAttribute('data-sig', sig);
    layer.innerHTML = '';
    urls.forEach(function(u, i) {
      const img = mainDoc.createElement('img');
      img.className = 'mp-gal-sprite' + (urls.length > 1 ? (i === 0 ? ' side-left' : ' side-right') : '');
      img.src = u;
      img.alt = 'sprite';
      layer.appendChild(img);
    });
  }

  function galApplyCg(root, st) {
    const cgWrap = root.querySelector('.mp-gal-cg');
    if (!cgWrap) return;
    const img = cgWrap.querySelector('img');
    const parsed = GAL_RUNTIME.parsed;
    let url = String(st.view.cg || '');
    if (!url && parsed && parsed.directives && parsed.directives.cg) url = galResolveDirective('cg', parsed.directives.cg);
    if (!url || !img) { cgWrap.classList.remove('show'); return; }
    if (img.getAttribute('src') !== url) img.setAttribute('src', url);
    // 事件 CG 只在进入这一楼时自动弹出一次；之后点哪里都能关掉，不会反复挡住界面
    const entry = galResolveFloor();
    const floorKey = entry ? galFloorKey(entry.idx, Number(entry.msg.swipe_id) || 0) : '';
    if (GAL_RUNTIME.cgShownFor !== floorKey) {
      GAL_RUNTIME.cgShownFor = floorKey;
      cgWrap.classList.add('show');
    }
  }

  function galRenderPage(root, page, total, prep) {
    const textEl = root.querySelector('#mp-gal-text');
    const nameEl = root.querySelector('#mp-gal-name');
    const metaEl = root.querySelector('#mp-gal-meta');
    const nextEl = root.querySelector('#mp-gal-next');
    const blocks = (GAL_RUNTIME.pages || [])[page] || [];
    const s = galGetSettings();

    // 说话人：本页优先，取不到就沿用上一条 name 块
    let speaker = '';
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'name') { speaker = blocks[i].text; break; }
    }
    if (!speaker) {
      for (let p = page - 1; p >= 0; p--) {
        const prev = (GAL_RUNTIME.pages || [])[p] || [];
        let found = '';
        for (let i = 0; i < prev.length; i++) if (prev[i].type === 'name') found = prev[i].text;
        if (found) { speaker = found; break; }
      }
    }
    if (nameEl) {
      nameEl.textContent = s.showSpeaker !== false ? speaker : '';
      nameEl.style.display = (s.showSpeaker !== false && speaker) ? '' : 'none';
    }
    const html = blocks.filter(function(b) { return b.type !== 'name'; }).map(function(b) {
      const cls = b.type === 'narration' ? 'gal-narr' : (b.type === 'thought' ? 'gal-thought' : 'gal-body');
      return '<span class="' + cls + '">' + galEscape(b.text) + '</span>';
    }).join('\n');
    if (textEl) {
      const typeKey = (prep ? galFloorKey(prep.entry.idx, prep.swipeId) : '') + '#' + page;
      const wantType = s.typewriter !== false && Number(s.readingSpeed) > 0;
      if (wantType && GAL_RUNTIME.typedKey !== typeKey) {
        GAL_RUNTIME.typedKey = typeKey;
        galTypewrite(textEl, html);
      } else if (!GAL_RUNTIME.typing) {
        textEl.innerHTML = html;
      }
    }
    if (metaEl) metaEl.textContent = (page + 1) + ' / ' + total + (prep ? ('  ·  第 ' + (prep.entry.idx + 1) + ' 楼') : '');
    if (nextEl) nextEl.style.display = page < total - 1 ? '' : 'none';
  }

  function galTypewrite(el, html) {
    if (GAL_RUNTIME.typeTimer) { clearInterval(GAL_RUNTIME.typeTimer); GAL_RUNTIME.typeTimer = null; }
    // 打字机只对纯文本生效；含标签时直接整段上，避免把 HTML 切坏
    const div = mainDoc.createElement('div');
    div.innerHTML = html;
    const plain = div.textContent || '';
    if (!plain) { el.innerHTML = html; return; }
    const speed = Math.max(4, Number(galGetSettings().readingSpeed) || 26);
    const step = plain.length > 260 ? 3 : 1;
    let i = 0;
    GAL_RUNTIME.typing = true;
    el.textContent = '';
    const timer = setInterval(function() {
      i += step;
      if (i >= plain.length) {
        clearInterval(timer);
        if (GAL_RUNTIME.typeTimer === timer) GAL_RUNTIME.typeTimer = null;
        el.innerHTML = html;
        GAL_RUNTIME.typing = false;
        return;
      }
      el.textContent = plain.slice(0, i);
    }, speed * step);
    GAL_RUNTIME.typeTimer = timer;
  }

  function galRenderChoices(root, page, total, prep) {
    const box = root.querySelector('#mp-gal-choices');
    if (!box) return;
    const atEnd = page >= total - 1;
    const choices = GAL_RUNTIME.choices || [];
    if (!atEnd || !choices.length) {
      box.classList.remove('show');
      box.innerHTML = '';
      return;
    }
    box.innerHTML = choices.map(function(c, i) {
      const num = ('0' + (i + 1)).slice(-2);
      return '<button type="button" class="mp-gal-choice" data-gal-choice="' + i + '" style="--i:' + i + '">' +
        '<span class="gal-choice-idx">' + num + '</span>' + galEscape(c) + '</button>';
    }).join('');
    box.classList.add('show');
    const btns = box.querySelectorAll('[data-gal-choice]');
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        const idx = Number(this.getAttribute('data-gal-choice'));
        galChoose(idx);
      });
    }
  }

  /* ── 翻页 ───────────────────────────────────────────────── */
  function galAdvance() {
    if (GAL_RUNTIME.typing) { galFinishTyping(); return; }
    galNextPage();
  }

  function galFinishTyping() {
    if (GAL_RUNTIME.typeTimer) { clearInterval(GAL_RUNTIME.typeTimer); GAL_RUNTIME.typeTimer = null; }
    GAL_RUNTIME.typing = false;
    galRender(true);
  }

  function galNextPage() {
    const total = (GAL_RUNTIME.pages || []).length;
    if (!total) return;
    if (GAL_RUNTIME.page >= total - 1) return;
    GAL_RUNTIME.page++;
    const prep = galPrepare();
    if (prep) galRecordRead(prep.entry.idx, prep.swipeId, GAL_RUNTIME.page);
    galRender(false);
  }

  function galPrevPage() {
    if (GAL_RUNTIME.page <= 0) return;
    GAL_RUNTIME.page--;
    galRender(false);
  }

  function galGotoPage(n) {
    const total = (GAL_RUNTIME.pages || []).length;
    GAL_RUNTIME.page = Math.max(0, Math.min(total - 1, Number(n) || 0));
    galRender(false);
  }

  /* ── 选项发送：全部走酒馆原生输入框 ────────────────────── */
  function galNativeTextarea() {
    return mainDoc.getElementById('send_textarea') ||
      mainDoc.querySelector('#send_form textarea') ||
      mainDoc.querySelector('textarea#send_textarea') ||
      mainDoc.querySelector('#chat_form textarea');
  }
  function galFillNativeInput(text) {
    const ta = galNativeTextarea();
    if (!ta) return false;
    ta.value = text;
    try { ta.dispatchEvent(new mainWin.Event('input', { bubbles: true })); } catch (e) {}
    try { ta.dispatchEvent(new mainWin.Event('change', { bubbles: true })); } catch (e) {}
    try { ta.focus(); } catch (e) {}
    return true;
  }
  function galTriggerNativeSend() {
    const btn = mainDoc.getElementById('send_but') || mainDoc.querySelector('#send_but');
    if (btn && typeof btn.click === 'function') { btn.click(); return true; }
    const form = mainDoc.getElementById('send_form') || mainDoc.querySelector('#send_form');
    if (form && typeof form.requestSubmit === 'function') { try { form.requestSubmit(); return true; } catch (e) {} }
    return false;
  }

  function galChoose(idx) {
    const text = (GAL_RUNTIME.choices || [])[idx];
    if (!text) return;
    // 无论发送模式还是填入模式，点击这一刻都算玩家已作出选择；写入当前聊天存档。
    try { galRecordPlayerChoice(text, GAL_RUNTIME.floor); } catch (e) { console.warn('[月相] 玩家选择记忆写入失败：', e); }
    const s = galGetSettings();
    if (s.choiceMode === 'fill') {
      if (galFillNativeInput(text)) toast('已填入输入框，确认后发送', 'info');
      else toast('找不到酒馆输入框，请手动复制：' + text.slice(0, 30), 'warning');
      return;
    }
    if (!galFillNativeInput(text)) {
      toast('找不到酒馆输入框，已改为填入模式：请手动粘贴后发送', 'warning');
      return;
    }
    if (!galTriggerNativeSend()) {
      toast('已填入输入框，但没找到发送按钮，请手动点发送', 'warning');
      return;
    }
    GAL_RUNTIME.waiting = true;
    galShowWaiting();
    if (s.choiceMode === 'send') {
      // 保持沉浸界面，等 message_received 自动翻到新楼层
      GAL_RUNTIME.reviewMode = false;
    }
  }

  function galShowWaiting() {
    const root = galRootEl();
    if (!root) return;
    const box = root.querySelector('#mp-gal-choices');
    if (box) {
      box.innerHTML = '<div style="text-align:center;color:#9fb6d8;font-size:12.5px;padding:14px;' +
        'background:rgba(8,12,22,.7);border-radius:12px;border:1px solid rgba(148,163,184,.2);">' +
        '正在等待回复…<div style="font-size:10.5px;color:#64748b;margin-top:4px">回复到达后会自动翻到新的一页</div></div>';
      box.classList.add('show');
    }
  }

  function galOpenFreeInput() {
    const ta = galNativeTextarea();
    if (!ta) { toast('找不到酒馆输入框，请先退出沉浸模式', 'warning'); return; }
    galClose();
    setTimeout(function() { try { ta.focus(); } catch (e) {} }, 120);
  }

  /* ── 自动播放 / 已读跳过 ───────────────────────────────── */
  function galToggleAutoPlay() {
    if (GAL_RUNTIME.autoPlay) {
      if (GAL_RUNTIME.autoTimer) clearInterval(GAL_RUNTIME.autoTimer);
      GAL_RUNTIME.autoTimer = null;
      GAL_RUNTIME.autoPlay = false;
      galUpdateToolbarState(galRootEl());
      return;
    }
    GAL_RUNTIME.autoPlay = true;
    GAL_RUNTIME.skip = false;
    const delay = Math.max(800, Number(galGetSettings().autoPlayDelay) || 2600);
    GAL_RUNTIME.autoTimer = setInterval(function() {
      if (!GAL_RUNTIME.autoPlay) return;
      const total = (GAL_RUNTIME.pages || []).length;
      if (GAL_RUNTIME.page < total - 1) {
        galNextPage();
      } else if (GAL_RUNTIME.choices && GAL_RUNTIME.choices.length) {
        galToggleAutoPlay();
      } else {
        galToggleAutoPlay();
      }
    }, delay);
    galUpdateToolbarState(galRootEl());
  }

  /* 只跳过已读页，遇到未读立即停 */
  function galSkipRead() {
    const prep = galPrepare();
    if (!prep) return;
    const total = (GAL_RUNTIME.pages || []).length;
    const prog = galGetProgress(prep.entry.idx, prep.swipeId);
    if (prog.readMax < 0) { toast('这条回复还没有已读内容，跳过已取消', 'info'); return; }
    const startPage = GAL_RUNTIME.page;
    let target = startPage;
    while (target < total - 1 && target + 1 <= prog.readMax) target++;
    if (target === startPage) { toast('下一页就是未读内容了，已停在原地', 'info'); return; }
    GAL_RUNTIME.page = target;
    galRender(false);
    toast('已跳过 ' + (target - startPage) + ' 页已读内容', 'info');
  }

  function galToggleCg() {
    const root = galRootEl();
    if (!root) return;
    const cg = root.querySelector('.mp-gal-cg');
    if (!cg) return;
    const img = cg.querySelector('img');
    if (!img || !img.getAttribute('src')) { toast('这一轮没有事件 CG', 'info'); return; }
    cg.classList.toggle('show');
  }

  function galToggleHideUI() {
    GAL_RUNTIME.hideUI = !GAL_RUNTIME.hideUI;
    const root = galRootEl();
    if (root) root.classList.toggle('hide-ui', GAL_RUNTIME.hideUI);
    galShowToolbar(GAL_RUNTIME.hideUI);
    if (GAL_RUNTIME.hideUI) toast('界面已隐藏：点屏幕下方边缘可呼出工具栏', 'info');
  }
  function galShowToolbar(show) {
    const bar = galRootEl() && galRootEl().querySelector('#mp-gal-toolbar');
    if (bar) bar.classList.toggle('show', !!show);
  }
  function galToggleFullscreen() {
    const el = galRootEl();
    if (!el) return;
    try {
      const d = mainDoc;
      if (!d.fullscreenElement && el.requestFullscreen) { el.requestFullscreen(); return; }
      if (d.exitFullscreen) { d.exitFullscreen(); return; }
    } catch (e) {}
    toast('当前环境不支持全屏，可先用浏览器全屏（F11）', 'info');
  }
  function galUpdateToolbarState(root) {
    if (!root) return;
    const auto = root.querySelector('[data-gal-act="auto"]');
    if (auto) {
      auto.textContent = GAL_RUNTIME.autoPlay ? '暂停' : '自动';
      auto.setAttribute('data-on', GAL_RUNTIME.autoPlay ? '1' : '0');
    }
    const hide = root.querySelector('[data-gal-act="hide"]');
    if (hide) hide.textContent = GAL_RUNTIME.hideUI ? '显示' : '隐藏';
  }

  /* ── 事件钩子（由 setupListeners 调用，不重复注册） ─────── */
  function onGalMessageReceived(floorIdx) {
    if (!galIsOn()) return;
    try { galMemoryAppendTurn(floorIdx); } catch (e) {}
    try { galMemoryWarnIfBroken(); } catch (e) {}
    if (galGetImageMode() === 'external') {
      try { galIngestImagesForFloor(floorIdx); } catch (e) {}
    }
    if (GAL_RUNTIME.reviewMode || GAL_RUNTIME.waiting) {
      GAL_RUNTIME.reviewMode = false;
      GAL_RUNTIME.waiting = false;
      GAL_RUNTIME.floor = floorIdx;
      GAL_RUNTIME.page = 0;
      GAL_RUNTIME.cacheKey = '';
      galRender(true);
    } else {
      galRender(false);
    }
  }

  function onGalDomRendered() {
    if (!galIsOn()) return;
    if (galGetImageMode() !== 'external') return;
    const entry = galResolveFloor();
    if (!entry) return;
    try { galIngestImagesForFloor(entry.idx); } catch (e) {}
    galRender(false);
  }

  /* 删楼 / 重 roll / swipe 之后：清掉越界的分页进度，并刷新当前展示。
     注意：只清自己的进度记录，绝不改动聊天消息本身。 */
  function onGalMessageMutated() {
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) { return; }
    if (!ctx || !Array.isArray(ctx.chat)) return;
    const len = ctx.chat.length;
    const st = galGetState();
    let changed = false;
    Object.keys(st.pages || {}).forEach(function(k) {
      const idx = parseInt(k, 10);
      if (!isFinite(idx) || idx >= len) { delete st.pages[k]; changed = true; }
    });
    if (st.floor >= len) { st.floor = len - 1; changed = true; }
    if (changed) galSetState(st);
    GAL_RUNTIME.cacheKey = '';
    GAL_RUNTIME.typedKey = '';
    GAL_RUNTIME.cgShownFor = '';
    if (galIsOn()) setTimeout(function() { try { galRender(true); } catch (e) {} }, 220);
  }

  function onGalChatChanged() {    GAL_RUNTIME.floor = -1;
    GAL_RUNTIME.page = 0;
    GAL_RUNTIME.pages = null;
    GAL_RUNTIME.parsed = null;
    GAL_RUNTIME.cacheKey = '';
    GAL_RUNTIME.reviewMode = false;
    GAL_RUNTIME.waiting = false;
    galStopTimers();
    const root = galRootEl();
    if (!root) {
      if (galIsOn()) setTimeout(function() { galOpen(); }, 400);
      return;
    }
    if (galIsOn()) { root.classList.add('open'); galRender(true); }
    else root.classList.remove('open');
  }

  /* ── 遮罩式面板（设置 / 存档 / 标签 / 历史共用） ────────── */
  function galSheetRoot() {
    const root = galRootEl();
    if (!root) return null;
    let mask = root.querySelector('.mp-gal-sheet-mask');
    if (!mask) {
      mask = mainDoc.createElement('div');
      mask.className = 'mp-gal-sheet-mask';
      mask.addEventListener('click', function(e) { if (e.target === mask) galCloseSheet(); });
      root.appendChild(mask);
    }
    return mask;
  }
  function galCloseSheet() {
    const root = galRootEl();
    if (!root) return;
    const mask = root.querySelector('.mp-gal-sheet-mask');
    if (mask) { try { mask.remove(); } catch (e) {} }
    GAL_RUNTIME.sheet = '';
  }
  function galShowSheet(title, bodyHtml, onMount) {
    const mask = galSheetRoot();
    if (!mask) return false;
    GAL_RUNTIME.sheet = title;
    mask.innerHTML = '<div class="mp-gal-sheet"><h3><span>' + galEscape(title) + '</span>' +
      '<button type="button" data-gal-act="sheet-close">✕</button></h3>' + bodyHtml + '</div>';
    const closeBtn = mask.querySelector('[data-gal-act="sheet-close"]');
    if (closeBtn) closeBtn.addEventListener('click', galCloseSheet);
    if (typeof onMount === 'function') { try { onMount(mask); } catch (e) {} }
    return true;
  }

  /* ── 设置面板 ───────────────────────────────────────────── */
  function galSettingsSheetHtml() {
    const s = galGetSettings();
    const img = galImageHint();
    const mem = galMemoryHint();
    const tag = galTagmapHint();
    const seg = function(act, cur, opts) {
      return '<div class="gal-seg">' + opts.map(function(o) {
        return '<button type="button" data-gal-set="' + act + '" data-gal-val="' + o.v + '" class="' + (cur === o.v ? 'on' : '') + '">' + o.t + '</button>';
      }).join('') + '</div>';
    };
    return '' +
      '<div class="gal-sec">' +
        '<div class="gal-label">对话框</div>' +
        '<div class="gal-row"><span>不透明度</span><input type="range" min="20" max="100" value="' + Math.round(s.boxOpacity * 100) + '" data-gal-range="boxOpacity"></div>' +
        '<div class="gal-row"><span>字号</span><input type="range" min="12" max="30" value="' + s.fontSize + '" data-gal-range="fontSize"></div>' +
        '<div class="gal-row"><span>行距</span><input type="range" min="120" max="260" value="' + Math.round(s.lineHeight * 100) + '" data-gal-range="lineHeight"></div>' +
        '<div class="gal-row"><span>文字颜色</span><input type="text" style="width:120px" value="' + galEscape(s.textColor) + '" data-gal-text="textColor"></div>' +
        '<div class="gal-row"><span>字体（留空跟随酒馆）</span><input type="text" style="width:150px" value="' + galEscape(s.fontFamily) + '" data-gal-text="fontFamily"></div>' +
        '<div class="gal-row"><span>打字速度（毫秒/字）</span><input type="range" min="0" max="120" value="' + s.readingSpeed + '" data-gal-range="readingSpeed"></div>' +
        '<div class="gal-row"><span>自动播放停留（毫秒）</span><input type="range" min="800" max="8000" step="200" value="' + s.autoPlayDelay + '" data-gal-range="autoPlayDelay"></div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">选项</div>' +
        seg('choiceMode', s.choiceMode, [{ v: 'send', t: '点击直接发送' }, { v: 'fill', t: '只填入输入框' }]) +
        '<div class="gal-hint">两种模式都走酒馆原生输入框与发送按钮，不另开一套发送通道。</div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">图片模式（四选一，内置与第三方互斥）</div>' +
        seg('imageMode', s.imageMode, [
          { v: 'builtin', t: '月相内置' },
          { v: 'external', t: '第三方接管' },
          { v: 'manual', t: '手动素材' },
          { v: 'off', t: '纯文字' }
        ]) +
        '<div class="gal-hint">当前：<b>' + galEscape(img.label) + '</b>｜内置生图入口：' + (img.builtinActive ? '开启' : '已关闭') +
        '｜检测到的第三方生图插件：' + (img.detected.length ? img.detected.map(function(d) { return galEscape(d.label) + (d.enabled ? '' : '（未启用）'); }).join('、') : '无') + '</div>' +
        (img.warning ? '<div class="gal-warn">' + galEscape(img.warning) + '</div>' : '') +
        '<div class="gal-row" style="margin-top:8px"><span>每轮最多接收图片</span><input type="range" min="1" max="4" value="' + s.maxImagesPerTurn + '" data-gal-range="maxImagesPerTurn"></div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">剧情记忆核心（三选一）</div>' +
        seg('memoryMode', s.memoryMode, [
          { v: 'builtin', t: '月相记忆' },
          { v: 'external', t: '外部记忆' },
          { v: 'off', t: '关闭记忆' }
        ]) +
        '<div class="gal-hint">当前：<b>' + galEscape(mem.label) + '</b>｜剧情回合 ' + mem.turns + ' · 阶段纪要 ' + mem.stages + ' · 长期档案 ' + mem.longs + ' · 玩家选择 ' + (galGetMemory().choices || []).length +
        '｜检测到的记忆插件：' + (mem.plugins.length ? mem.plugins.map(function(p) { return galEscape(p.label) + (p.enabled ? '' : '（未启用）'); }).join('、') : '无') + '</div>' +
        (mem.warning ? '<div class="gal-warn">' + galEscape(mem.warning) + '</div>' : '') +
        '<div class="gal-row" style="margin-top:8px"><span>阶段摘要间隔（回合）</span><input type="range" min="2" max="8" value="' + s.memoryStageEvery + '" data-gal-range="memoryStageEvery"></div>' +
        '<div class="gal-row"><span>长期记忆间隔（回合）</span><input type="range" min="6" max="20" value="' + s.memoryLongEvery + '" data-gal-range="memoryLongEvery"></div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">标签映射</div>' +
        '<div class="gal-hint">当前预设：<b>' + galEscape(tag.presetName) + '</b>｜启用 ' + tag.enabledCount + ' / ' + tag.total + ' 条' +
        (tag.ok ? '｜校验通过' : '｜<span style="color:#f87171">存在 ' + tag.problems.filter(function(p) { return p.level === 'error'; }).length + ' 个问题</span>') + '</div>' +
        '<button type="button" data-gal-act="tagmap" style="margin-top:8px;width:100%">打开标签映射编辑器</button>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">素材</div>' +
        '<button type="button" data-gal-asset="bg" style="width:100%;margin-bottom:6px">设置背景图（输入网址）</button>' +
        '<button type="button" data-gal-asset="sprite" style="width:100%;margin-bottom:6px">设置角色立绘（名字|表情）</button>' +
        '<button type="button" data-gal-asset="cg" style="width:100%">设置事件 CG</button>' +
        (galGetPendingImages().length ? '<div class="gal-warn" style="margin-top:8px">有 ' + galGetPendingImages().length + ' 张图等着你指定用途：' +
          galGetPendingImages().map(function(p, i) {
            return '<div style="display:flex;gap:6px;margin-top:6px;align-items:center"><img src="' + galEscape(p.url) + '" style="width:42px;height:42px;object-fit:cover;border-radius:6px">' +
              '<button type="button" data-gal-pending="' + i + '" data-kind="bg" style="flex:1">背景</button>' +
              '<button type="button" data-gal-pending="' + i + '" data-kind="sprite" style="flex:1">立绘</button>' +
              '<button type="button" data-gal-pending="' + i + '" data-kind="cg" style="flex:1">CG</button></div>';
          }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">其他</div>' +
        '<div class="gal-row"><span>显示角色名</span><button type="button" data-gal-set="showSpeaker" data-gal-val="' + (s.showSpeaker !== false ? '0' : '1') + '">' + (s.showSpeaker !== false ? '开' : '关') + '</button></div>' +
        '<div class="gal-row"><span>打字机效果</span><button type="button" data-gal-set="typewriter" data-gal-val="' + (s.typewriter !== false ? '0' : '1') + '">' + (s.typewriter !== false ? '开' : '关') + '</button></div>' +
        '<button type="button" data-gal-act="fullscreen" style="width:100%;margin-top:6px">切换全屏</button>' +
      '</div>';
  }

  function galOpenSettingsSheet() {
    galShowSheet('Galgame 设置', galSettingsSheetHtml(), function(mask) {
      const save = function(patch) {
        galSaveSettings(patch);
        const root = galRootEl();
        if (root) galApplyCssVars(root);
        galRender(true);
      };
      mask.querySelectorAll('[data-gal-range]').forEach(function(input) {
        input.addEventListener('input', function() {
          const key = this.getAttribute('data-gal-range');
          let v = Number(this.value);
          if (key === 'boxOpacity') v = v / 100;
          if (key === 'lineHeight') v = v / 100;
          save((function() { const p = {}; p[key] = v; return p; })());
        });
      });
      mask.querySelectorAll('[data-gal-text]').forEach(function(input) {
        input.addEventListener('change', function() {
          const key = this.getAttribute('data-gal-text');
          save((function() { const p = {}; p[key] = this.value; return p; }).call(this));
        });
      });
      mask.querySelectorAll('[data-gal-set]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const key = this.getAttribute('data-gal-set');
          const val = this.getAttribute('data-gal-val');
          if (key === 'imageMode') { galSetImageMode(val); galOpenSettingsSheet(); return; }
          if (key === 'memoryMode') { galSetMemoryMode(val); galOpenSettingsSheet(); return; }
          if (key === 'choiceMode') { save({ choiceMode: val }); galOpenSettingsSheet(); return; }
          save((function() { const p = {}; p[key] = (val === '1'); return p; })());
          galOpenSettingsSheet();
        });
      });
      mask.querySelectorAll('[data-gal-asset]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const kind = this.getAttribute('data-gal-asset');
          galPromptAsset(kind);
        });
      });
      mask.querySelectorAll('[data-gal-pending]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const idx = Number(this.getAttribute('data-gal-pending'));
          const kind = this.getAttribute('data-kind');
          const pending = galGetPendingImages();
          const item = pending[idx];
          if (!item) return;
          let name = '';
          if (kind === 'sprite') name = mainWin.prompt('立绘角色名（可写 名字|表情）', '默认') || '';
          galAssignImage(item.url, kind, name || '默认');
          galOpenSettingsSheet();
        });
      });
    });
  }

  function galPromptAsset(kind) {
    const label = { bg: '背景图', sprite: '角色立绘', cg: '事件 CG' }[kind] || kind;
    const name = mainWin.prompt(label + '名称（背景可写场景名，立绘写 角色|表情）', kind === 'bg' ? '默认' : '默认');
    if (name == null) return;
    const url = mainWin.prompt('图片地址（http/https 或 data:image）', '');
    if (!url) return;
    const st = galGetState();
    if (kind === 'bg') st.view.bg = url;
    else if (kind === 'cg') st.view.cg = url;
    else if (kind === 'sprite') st.view.sprites[String(name).trim() || '默认'] = url;
    galSetState(st);
    galUpsertAsset(kind, String(name).trim() || '默认', url);
    galRender(true);
    galOpenSettingsSheet();
  }

  /* ── 存档面板 ───────────────────────────────────────────── */
  function galOpenSaveSheet() {
    const saves = galGetSaves();
    const cap = galRollbackCapability();
    const listHtml = saves.length ? saves.map(function(s) {
      const d = new Date(s.createdAt || 0);
      return '<div class="gal-item"><div class="gal-item-main"><div>' + galEscape(s.name) + '</div>' +
        '<div class="gal-item-sub">第 ' + (s.floor + 1) + ' 楼 · 第 ' + ((s.page || 0) + 1) + ' 页 · ' +
        d.toLocaleString('zh-CN', { hour12: false }) + ' · ' + galEscape(s.preview || '') + '</div></div>' +
        '<button type="button" data-gal-load="' + s.id + '">读取</button>' +
        '<button type="button" data-gal-del="' + s.id + '">删</button></div>';
    }).join('') : '<div class="gal-hint">还没有存档。读到关键剧情时点「新建存档」。</div>';
    const body = '' +
      '<div class="gal-sec">' +
        '<div class="gal-label">当前聊天</div>' +
        '<div class="gal-hint">读档能力：<b>' + galEscape(cap.detail) + '</b></div>' +
        (cap.canRollback ? '' : '<div class="gal-warn">当前酒馆版本没有可用的消息回退接口。读档只能恢复画面与阅读进度，不能把剧情退回到旧楼层。</div>') +
        '<button type="button" data-gal-save-new="1" style="width:100%;margin-top:10px">新建存档（当前楼层）</button>' +
      '</div>' +
      '<div class="gal-sec"><div class="gal-label">存档列表（最多 20 个）</div><div class="gal-list">' + listHtml + '</div></div>';
    galShowSheet('存档 / 读档', body, function(mask) {
      const newBtn = mask.querySelector('[data-gal-save-new]');
      if (newBtn) newBtn.addEventListener('click', function() {
        const name = mainWin.prompt('存档名（留空自动命名）', '') || '';
        const r = galCreateSave(name);
        if (r.ok) toast('已存档：' + r.save.name, 'success');
        else toast('存档失败：' + r.reason, 'warning');
        galOpenSaveSheet();
      });
      mask.querySelectorAll('[data-gal-del]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          galDeleteSave(this.getAttribute('data-gal-del'));
          galOpenSaveSheet();
        });
      });
      mask.querySelectorAll('[data-gal-load]').forEach(function(btn) {
        btn.addEventListener('click', function() { galConfirmRestore(this.getAttribute('data-gal-load')); });
      });
    });
  }

  function galConfirmRestore(id) {
    const pv = galPreviewRestore(id);
    if (!pv.ok) { toast(pv.reason, 'warning'); return; }
    const body = '' +
      '<div class="gal-sec">' +
        '<div class="gal-label">即将读档</div>' +
        '<div class="gal-hint">存档：<b>' + galEscape(pv.save.name) + '</b><br>目标楼层：第 ' + (pv.save.floor + 1) + ' 楼<br>' +
        '当前进度：第 ' + ((function() { const c = getSTCtx(); return c && c.chat ? c.chat.length : 0; })()) + ' 楼</div>' +
        (pv.needsRollback
          ? '<div class="gal-warn">' + galEscape(pv.warning) + '</div>'
          : '<div class="gal-hint" style="margin-top:8px">当前已在存档楼层，读档只恢复画面与阅读进度。</div>') +
        (pv.needsRollback && !pv.canRollback ? '<div class="gal-warn">' + galEscape(pv.capability.detail) + '。只能恢复画面，不能回退剧情。</div>' : '') +
        '<div style="display:flex;gap:8px;margin-top:14px">' +
          '<button type="button" data-gal-do="view" style="flex:1">只恢复画面与进度</button>' +
          (pv.needsRollback && pv.canRollback ? '<button type="button" data-gal-do="rollback" style="flex:1;border-color:rgba(248,113,113,.6);color:#fecaca">回退剧情并读档</button>' : '') +
        '</div>' +
      '</div>';
    galShowSheet('读档确认', body, function(mask) {
      const viewBtn = mask.querySelector('[data-gal-do="view"]');
      if (viewBtn) viewBtn.addEventListener('click', async function() {
        const r = galRestoreViewOnly(id);
        galCloseSheet();
        if (r.ok) { GAL_RUNTIME.floor = r.floor; GAL_RUNTIME.page = r.page; GAL_RUNTIME.cacheKey = ''; galRender(true); }
        toast(r.ok ? '已恢复画面与进度' : (r.reason || '恢复失败'), r.ok ? 'success' : 'warning');
      });
      const rbBtn = mask.querySelector('[data-gal-do="rollback"]');
      if (rbBtn) rbBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '正在回退…';
        const r = await galApplyRestore(id, { rollback: true });
        galCloseSheet();
        if (r.ok) {
          GAL_RUNTIME.floor = r.floor;
          GAL_RUNTIME.page = r.page;
          GAL_RUNTIME.cacheKey = '';
          setTimeout(function() { galRender(true); }, 300);
        }
        toast(r.reason || (r.ok ? '读档完成' : '读档失败'), r.rollbackFailed ? 'warning' : (r.ok ? 'success' : 'warning'));
      });
    });
  }

  /* ── 历史回看 ───────────────────────────────────────────── */
  function galOpenHistorySheet() {
    const ctx = getSTCtx();
    if (!ctx || !Array.isArray(ctx.chat)) { toast('读不到聊天记录', 'warning'); return; }
    const rows = [];
    for (let i = ctx.chat.length - 1; i >= 0 && rows.length < 40; i--) {
      const m = ctx.chat[i];
      if (!m || m.is_user) continue;
      const text = galCleanMessage(m.mes).replace(/\s+/g, ' ').slice(0, 70);
      if (!text) continue;
      rows.push('<div class="gal-item"><div class="gal-item-main"><div>第 ' + (i + 1) + ' 楼</div>' +
        '<div class="gal-item-sub">' + galEscape(text) + '</div></div>' +
        '<button type="button" data-gal-jump="' + i + '">回看</button></div>');
    }
    galShowSheet('历史回看', '<div class="gal-hint" style="margin-bottom:10px">只是回看，不会删除或修改任何消息。</div>' +
      '<div class="gal-list">' + (rows.length ? rows.join('') : '<div class="gal-hint">没有可回看的回复</div>') + '</div>',
      function(mask) {
        mask.querySelectorAll('[data-gal-jump]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const idx = Number(this.getAttribute('data-gal-jump'));
            GAL_RUNTIME.floor = idx;
            GAL_RUNTIME.page = 0;
            GAL_RUNTIME.cacheKey = '';
            GAL_RUNTIME.reviewMode = true;
            galCloseSheet();
            galRender(true);
            toast('正在回看第 ' + (idx + 1) + ' 楼；有新回复时会自动回到最新', 'info');
          });
        });
      });
  }

  /* ── 标签映射编辑器 ─────────────────────────────────────── */
  function galOpenTagmapSheet(presetId) {
    const store = galLoadTagmapStore();
    const activeId = presetId || galGetTagmapPresetId();
    const preset = store.presets[activeId] || store.presets.gal_default;
    const rules = (preset.rules || galDefaultRules()).map(function(r) { return Object.assign({}, r); });
    const check = galValidateTagmap(rules);
    const presetList = Object.keys(store.presets).map(function(id) {
      const p = store.presets[id];
      return '<option value="' + id + '"' + (id === activeId ? ' selected' : '') + '>' + galEscape(p.name) + (p.builtin ? '（内置）' : '') + '</option>';
    }).join('');
    const ruleRows = rules.map(function(r, i) {
      const types = GAL_TAG_TYPES.map(function(t) {
        return '<option value="' + t.id + '"' + (t.id === r.type ? ' selected' : '') + '>' + t.name + '</option>';
      }).join('');
      const modes = [
        ['xml', 'XML 标签'], ['block', '区块标记'], ['wrap', '成对括号'],
        ['prefix', '行首标记'], ['speaker', '名字：台词'], ['regex', '自定义正则']
      ].map(function(m) { return '<option value="' + m[0] + '"' + (m[0] === (r.mode || 'xml') ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('');
      return '<div class="gal-item" style="flex-wrap:wrap" data-rule-row="' + i + '">' +
        '<select data-rule-type="' + i + '" style="flex:1 1 90px">' + types + '</select>' +
        '<select data-rule-mode="' + i + '" style="flex:1 1 96px">' + modes + '</select>' +
        '<input type="text" data-rule-pattern="' + i + '" value="' + galEscape(r.pattern || '') + '" placeholder="匹配内容" style="flex:1 1 90px">' +
        '<button type="button" data-rule-toggle="' + i + '">' + (r.enabled === false ? '启用' : '停用') + '</button>' +
        '<button type="button" data-rule-del="' + i + '" style="border-color:rgba(248,113,113,.5);color:#fecaca">删</button>' +
        '</div>';
    }).join('');
    const problems = check.problems.length
      ? check.problems.map(function(p) { return '<div class="' + (p.level === 'error' ? 'gal-warn' : 'gal-hint') + '">' + galEscape(p.text) + '</div>'; }).join('')
      : '<div class="gal-hint" style="color:#6ee7b7">校验通过：必要映射齐全，没有重复或冲突。</div>';
    const body = '' +
      '<div class="gal-sec">' +
        '<div class="gal-label">映射预设</div>' +
        '<select data-gal-preset-select="1">' + presetList + '</select>' +
        '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
          '<button type="button" data-gal-preset="assign" style="flex:1">用于当前聊天</button>' +
          '<button type="button" data-gal-preset="new" style="flex:1">新建副本</button>' +
          '<button type="button" data-gal-preset="del" style="flex:1">删除</button>' +
        '</div>' +
        '<div class="gal-hint">「用于当前聊天」只影响这一份聊天；换聊天各用各的。内置预设不能删。</div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">规则（' + rules.length + ' 条）</div>' +
        '<div class="gal-list">' + ruleRows + '</div>' +
        '<button type="button" data-rule-add="1" style="width:100%;margin-top:8px">＋ 新增一条映射</button>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">校验</div>' + problems +
        '<button type="button" data-gal-preset="save" style="width:100%;margin-top:10px">保存这个预设</button>' +
      '</div>';
    galShowSheet('标签映射', body, function(mask) {
      const collect = function() {
        const out = [];
        mask.querySelectorAll('[data-rule-row]').forEach(function(row) {
          const i = row.getAttribute('data-rule-row');
          out.push({
            id: 'rule_' + i,
            type: mask.querySelector('[data-rule-type="' + i + '"]').value,
            mode: mask.querySelector('[data-rule-mode="' + i + '"]').value,
            pattern: mask.querySelector('[data-rule-pattern="' + i + '"]').value,
            enabled: row.getAttribute('data-disabled') === '1' ? false : true
          });
        });
        return out;
      };
      mask.querySelectorAll('[data-rule-toggle]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const i = this.getAttribute('data-rule-toggle');
          const row = mask.querySelector('[data-rule-row="' + i + '"]');
          if (!row) return;
          const dis = row.getAttribute('data-disabled') === '1';
          row.setAttribute('data-disabled', dis ? '0' : '1');
          this.textContent = dis ? '停用' : '启用';
        });
      });
      mask.querySelectorAll('[data-rule-del]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const i = this.getAttribute('data-rule-del');
          const row = mask.querySelector('[data-rule-row="' + i + '"]');
          if (row) row.remove();
        });
      });
      const addBtn = mask.querySelector('[data-rule-add]');
      if (addBtn) addBtn.addEventListener('click', function() {
        const list = mask.querySelector('.gal-list');
        const idx = String(Date.now());
        const div = mainDoc.createElement('div');
        div.className = 'gal-item';
        div.setAttribute('data-rule-row', idx);
        div.style.flexWrap = 'wrap';
        div.innerHTML = '<select data-rule-type="' + idx + '" style="flex:1 1 90px">' +
          GAL_TAG_TYPES.map(function(t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join('') + '</select>' +
          '<select data-rule-mode="' + idx + '" style="flex:1 1 96px">' +
          [['xml', 'XML 标签'], ['block', '区块标记'], ['wrap', '成对括号'], ['prefix', '行首标记'], ['speaker', '名字：台词'], ['regex', '自定义正则']]
            .map(function(m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select>' +
          '<input type="text" data-rule-pattern="' + idx + '" placeholder="匹配内容" style="flex:1 1 90px">' +
          '<button type="button" data-rule-del2="' + idx + '">删</button>';
        list.appendChild(div);
        const del = div.querySelector('[data-rule-del2="' + idx + '"]');
        if (del) del.addEventListener('click', function() { div.remove(); });
      });
      const sel = mask.querySelector('[data-gal-preset-select]');
      if (sel) sel.addEventListener('change', function() { galOpenTagmapSheet(this.value); });
      mask.querySelectorAll('[data-gal-preset]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const act = this.getAttribute('data-gal-preset');
          if (act === 'assign') {
            galAssignTagmap(activeId);
            GAL_RUNTIME.cacheKey = '';
            toast('当前聊天已改用：' + preset.name, 'success');
            galRender(true);
            galCloseSheet();
          } else if (act === 'new') {
            const copy = galDuplicatePreset(activeId);
            if (copy) galOpenTagmapSheet(copy.id);
          } else if (act === 'del') {
            if (activeId === 'gal_default') { toast('内置预设不能删除', 'warning'); return; }
            const r = galDeletePreset(activeId);
            if (r && r.deleted) { toast('已删除' + (r.reassigned ? '，相关聊天已切回默认' : ''), 'info'); galOpenTagmapSheet('gal_default'); }
          } else if (act === 'save') {
            if (activeId === 'gal_default') {
              toast('内置预设不能覆盖，请先「新建副本」', 'warning');
              return;
            }
            const rulesNew = collect();
            const v = galValidateTagmap(rulesNew);
            galSavePreset({ id: activeId, name: preset.name, rules: rulesNew });
            GAL_RUNTIME.cacheKey = '';
            toast(v.ok ? '已保存并生效' : '已保存，但还有 ' + v.problems.filter(function(p) { return p.level === 'error'; }).length + ' 个问题', v.ok ? 'success' : 'warning');
            galOpenTagmapSheet(activeId);
            galRender(true);
          }
        });
      });
    });
  }
