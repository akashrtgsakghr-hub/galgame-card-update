/* 88b-theme.js —— 视觉统一层（不改任何一套皮肤的结构，只统一材质、字号与数字基线）
   原型：大正浪漫 × 暗色霓虹 · 印刷品质感
     ① 系统面板从「Tailwind 蓝灰仪表盘」拉回沉浸层同一族的近黑紫底 + 品红强调
     ② 标题用像素字、数值用等宽数字（tabular），避免数字跳动
     ③ 状态栏可读性：字号 10.5→11.5、次要文字对比度抬到可读线以上
     ④ 楼内状态卡（晨昏票根 / 月氏藏书票 / 预言家日报 / 朱丝栏邸报 / 少女心绪）
        只做「同类项统一」：数字对齐、小标签提对比、进度条同族渐变
        它们的排版、配色倾向、图案、纸张质感一律不动 */
(function () {
  var STYLE_ID = 'moon-theme-unify';

  var CSS = ''
  + ':root{'
  + '  --mp-ink-0:#0a0509; --mp-ink-1:#120a14; --mp-ink-2:#1a1020;'
  + '  --mp-accent:#f472d0; --mp-accent-2:#ffb3e8;'
  + '  --mp-fg:#f2e7ef; --mp-fg-2:#c9b0c2; --mp-fg-3:#b9a4b4;'
  + '  --mp-line:rgba(244,114,208,.18); --mp-line-2:rgba(244,114,208,.34);'
  + '  --mp-press:inset 0 1px 0 rgba(255,179,232,.10);'
  + '  --mp-pixel:"MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","Courier New",monospace;'
  + '}'

  /* ① 面板：底色与强调色归族 */
  + '#moon-phase-mask{background:radial-gradient(circle at center,rgba(18,10,20,.86) 0%,rgba(6,3,7,.94) 100%)!important;}'
  + '#moon-phase-panel{background:linear-gradient(170deg,#141021 0%,#0a0509 100%)!important;'
  + '  border:1px solid var(--mp-line)!important;color:var(--mp-fg)!important;'
  + '  box-shadow:0 24px 70px rgba(0,0,0,.72),var(--mp-press)!important;}'
  + '#moon-phase-panel .mp-card{background:linear-gradient(180deg,rgba(244,114,208,.055),rgba(255,255,255,.015))!important;'
  + '  border:1px solid var(--mp-line)!important;box-shadow:var(--mp-press)!important;}'
  + '#moon-phase-panel .mp-menu-card{background:rgba(255,255,255,.028)!important;border:1px solid var(--mp-line)!important;'
  + '  transition:border-color .18s ease,transform .18s ease,background .18s ease!important;}'
  + '#moon-phase-panel .mp-menu-card:hover{border-color:var(--mp-line-2)!important;transform:translateY(-1px)!important;'
  + '  background:rgba(244,114,208,.07)!important;}'
  + '#moon-phase-panel .mp-badge{background:rgba(244,114,208,.10)!important;border-color:rgba(244,114,208,.30)!important;color:var(--mp-accent-2)!important;}'

  /* ② 标题像素字 + 数值等宽 */
  + '#moon-phase-panel h1,#moon-phase-panel h2,#moon-phase-panel h3,'
  + '#moon-phase-panel .mp-card-title,#moon-phase-panel .mp-menu-label,#moon-phase-panel .mp-set-title{'
  + '  font-family:var(--mp-pixel)!important;letter-spacing:.06em!important;color:var(--mp-fg)!important;}'

  /* ③ 面板状态栏：可读性 + 和纸压印边（结构不动） */
  + '#moon-phase-panel .mp-status{background:rgba(10,5,9,.72)!important;border:1px solid var(--mp-line)!important;'
  + '  box-shadow:var(--mp-press)!important;font-size:11.5px!important;line-height:1.7!important;color:var(--mp-fg-2)!important;'
  + '  font-variant-numeric:tabular-nums;}'
  + '#moon-phase-panel .mp-status :is(b,strong){color:var(--mp-accent-2)!important;}'

  /* ④ 楼内状态卡：只做同类项统一 */
  + '.mp-gal-root :is(.mpp-stat-num,.metric-number,.cl-v,.tkt-cell-v,.mpp-stat,.metric-tag){'
  + '  font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;}'
  + '.mp-gal-root :is(.tkt-meta-lbl,.cl-k,.gauge-code,.metric-cn){color:rgba(214,194,208,.92);}'
  + '.mp-gal-root :is(.tkt-gauge-bar,.metric-bar-fill){background:linear-gradient(90deg,var(--mp-accent),var(--mp-accent-2))!important;}'

  /* ⑤ 版式层：只重排位置与间距，不增删任何一项显示内容 ──
        五套状态卡的四维行统一成「标签左 / 数值右 / 基线对齐」的阅读节奏；
        标签给固定列宽并允许省略号，数值右对齐 + 等宽，跨皮肤读起来是同一张表。
        面板：卡片间距统一、分区标题和折叠头对齐同一基线、内容宽度放宽到 520px。 */
  + '#moon-phase-panel{max-width:520px!important;}'
  + '#moon-phase-panel .mp-card{margin-bottom:12px!important;}'
  + '#moon-phase-panel .mp-card:last-child{margin-bottom:0!important;}'
  + '#moon-phase-panel :is(.mp-set-title,.mp-fold-title,.mp-menu-label){margin:14px 0 8px!important;}'
  + '#moon-phase-panel :is(.mp-set-row,.mp-fold-head){align-items:center!important;gap:10px!important;}'
  + '#moon-phase-panel :is(.mp-set-info,.mp-fold-info){min-width:0!important;}'
  + '#moon-phase-panel :is(.mp-set-desc,.mp-fold-desc){margin-top:2px!important;line-height:1.6!important;}'
  + '#moon-phase-panel .mp-status{padding:12px 14px!important;}'
  + '#moon-phase-panel .mp-status>div,#moon-phase-panel .mp-status>p{margin:0 0 6px!important;}'
  + '#moon-phase-panel .mp-status>div:last-child,#moon-phase-panel .mp-status>p:last-child{margin-bottom:0!important;}'
  + '.mp-gal-root :is(.metric-item,.mpp-stat,.tkt-cell,.cl-tile){display:flex!important;align-items:baseline!important;'
  + '  justify-content:space-between!important;gap:10px!important;min-width:0!important;}'
  + '.mp-gal-root :is(.metric-tag,.mpp-stat-lbl,.tkt-cell-lbl,.cl-k){flex:0 1 auto!important;min-width:0!important;'
  + '  overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}'
  + '.mp-gal-root :is(.metric-number,.mpp-stat-num,.tkt-cell-v,.cl-v){flex:0 0 auto!important;text-align:right!important;'
  + '  font-variant-numeric:tabular-nums!important;letter-spacing:.01em!important;}'
  + '.mp-gal-root :is(.metric-item,.mpp-stat,.tkt-cell,.cl-tile)+:is(.metric-item,.mpp-stat,.tkt-cell,.cl-tile){'
  + '  margin-top:6px!important;}';

  function injectMoonTheme() {
    try {
      var doc = (typeof mainDoc !== 'undefined' && mainDoc) ? mainDoc : document;
      var el = doc.getElementById(STYLE_ID);
      if (!el) { el = doc.createElement('style'); el.id = STYLE_ID; (doc.head || doc.documentElement).appendChild(el); }
      if (el.textContent !== CSS) el.textContent = CSS;
      return true;
    } catch (e) { return false; }
  }

  try { injectMoonTheme(); } catch (e) {}
  try { if (typeof mainWin !== 'undefined' && mainWin) mainWin.injectMoonTheme = injectMoonTheme; } catch (e) {}
  try { window.injectMoonTheme = injectMoonTheme; } catch (e) {}
})();
