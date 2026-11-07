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
.mp-gal-root{position:fixed;inset:0;z-index:2147483000;display:none;overflow:hidden;background:#171a22;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC","Microsoft YaHei",sans-serif;
  color:var(--gal-color,#f8fafc);-webkit-tap-highlight-color:transparent;}
.mp-gal-root.open{display:block;animation:mpGalFade .22s ease;}
@keyframes mpGalFade{from{opacity:0}to{opacity:1}}
.mp-gal-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-color:#171a22;
  filter:saturate(0.95);transition:background-image .45s ease;z-index:0;}
.mp-gal-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,6,12,.35) 0%,rgba(3,6,12,0) 28%,rgba(3,6,12,.10) 60%,rgba(3,6,12,.62) 100%);}
.mp-gal-sprite-layer{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;z-index:1;pointer-events:none;}
.mp-gal-sprite{max-height:82%;max-width:46%;object-fit:contain;filter:drop-shadow(0 12px 30px rgba(18, 20, 26, .55));
  transition:opacity .3s ease, transform .3s ease;}
.mp-gal-sprite.side-left{margin-right:auto;margin-left:4%;}
.mp-gal-sprite.side-right{margin-left:auto;margin-right:4%;}
.mp-gal-cg{position:absolute;inset:0;z-index:2;display:none;align-items:center;justify-content:center;background:rgba(3,6,12,.92);
  cursor:pointer;}
.mp-gal-cg.show{display:flex;}
.mp-gal-cg img{max-width:96%;max-height:92%;object-fit:contain;box-shadow:0 18px 60px rgba(18, 20, 26, .7);border-radius:6px;}
.mp-gal-top{position:absolute;top:0;left:0;right:0;z-index:6;display:flex;justify-content:space-between;align-items:center;
  padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 10px;gap:8px;
  background:linear-gradient(180deg,rgba(3,6,12,.55),rgba(3,6,12,0));transition:opacity .22s ease,transform .22s ease;}
.mp-gal-top button,.mp-gal-toolbar button,.mp-gal-sheet button{font-family:inherit;cursor:pointer;border-radius:10px;
  border:1px solid rgba(148,163,184,.28);background:rgba(15,23,42,.55);color:#e2e8f0;font-size:12px;padding:6px 10px;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .15s ease,border-color .15s ease;}
.mp-gal-top button:hover,.mp-gal-toolbar button:hover,.mp-gal-sheet button:hover{background:rgba(56,89,148,.55);border-color:rgba(148,197,255,.5);}
.mp-gal-top .mp-gal-title{font-size:11px;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;}
.mp-gal-top-right{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}
.mp-gal-dialog{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);transform:translateX(-50%);
  width:min(920px,calc(100% - 24px));z-index:5;box-sizing:border-box;
  background:rgba(8,12,22,var(--gal-op,.72));border:1px solid rgba(180,205,255,.18);border-radius:16px;
  box-shadow:0 20px 60px rgba(18, 20, 26, .55),inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter:blur(18px) saturate(1.25);-webkit-backdrop-filter:blur(18px) saturate(1.25);
  padding:14px 18px 16px;min-height:96px;transition:opacity .2s ease,transform .2s ease;}
.mp-gal-name{font-size:13px;font-weight:600;letter-spacing:.04em;color:#ffd7f2;
  margin-bottom:6px;display:flex;align-items:center;gap:8px;min-height:18px;}
.mp-gal-name::before{content:"";width:3px;height:14px;border-radius:2px;background:linear-gradient(180deg,#f472d0,#7dd3fc);}
.mp-gal-text{font-size:var(--gal-fs,17px);line-height:var(--gal-lh,1.75);color:var(--gal-color,#f8fafc);
  white-space:pre-wrap;word-break:break-word;max-height:30vh;overflow:hidden;}
.mp-gal-text .gal-narr{color:#c7d2fe;font-style:italic;}
.mp-gal-text .gal-thought{color:#a5f3fc;opacity:.92;}
.mp-gal-text .gal-body{color:var(--gal-color,#f8fafc);}
.mp-gal-next{position:absolute;right:16px;bottom:8px;font-size:12px;color:#9fb6d8;animation:mpGalBlink 1.15s infinite;}
@keyframes mpGalBlink{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(3px)}}
.mp-gal-meta{position:absolute;left:18px;bottom:8px;font-size:10.5px;color:#7b8ea8;letter-spacing:.05em;}
.mp-gal-choices{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:min(720px,calc(100% - 28px));max-height:62vh;overflow-y:auto;z-index:7;display:none;flex-direction:column;gap:10px;}
.mp-gal-choices.show{display:flex;}
.mp-gal-choice{width:100%;text-align:left;padding:13px 16px;border-radius:12px;cursor:pointer;font-family:inherit;
  font-size:14.5px;line-height:1.5;color:#eef4ff;border:1px solid rgba(160,190,255,.30);
  background:rgba(10,16,30,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  transition:transform .12s ease,background .15s ease,border-color .15s ease;position:relative;}
.mp-gal-choice:hover{background:rgba(38,60,110,.85);border-color:rgba(190,215,255,.6);transform:translateY(-1px);}
.mp-gal-choice .gal-choice-idx{display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;
  border-radius:50%;background:rgba(244,114,208,.25);color:#ffd7f2;font-size:11px;margin-right:8px;font-weight:600;}
.mp-gal-toolbar{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);transform:translateX(-50%) translateY(140%);
  z-index:8;display:flex;gap:8px;padding:8px 10px;border-radius:14px;background:rgba(8,12,22,.82);
  border:1px solid rgba(148,163,184,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  transition:transform .25s cubic-bezier(.2,.9,.3,1),opacity .2s ease;opacity:0;max-width:calc(100% - 20px);flex-wrap:wrap;justify-content:center;}
.mp-gal-toolbar.show{transform:translateX(-50%) translateY(0);opacity:1;}
.mp-gal-edge{position:absolute;left:0;right:0;bottom:0;height:34px;z-index:4;}
.mp-gal-root.hide-ui .mp-gal-top,.mp-gal-root.hide-ui .mp-gal-dialog{opacity:0;pointer-events:none;transform:translateX(-50%) translateY(12px);}
.mp-gal-root.hide-ui .mp-gal-dialog{transform:translateX(-50%) translateY(30px);}
.mp-gal-root.hide-ui .mp-gal-edge{height:70px;}
.mp-gal-sheet-mask{position:absolute;inset:0;z-index:20;background:rgba(3,6,12,.78);display:flex;align-items:center;
  justify-content:center;padding:16px;box-sizing:border-box;}
.mp-gal-sheet{width:min(560px,100%);max-height:86dvh;overflow-y:auto;background:linear-gradient(170deg,rgba(20,25,40,.98),rgba(8,11,20,.99));
  border:1px solid rgba(148,163,184,.22);border-radius:18px;padding:18px;box-sizing:border-box;
  box-shadow:0 26px 70px rgba(18, 20, 26, .7);}
.mp-gal-sheet h3{margin:0 0 14px;font-size:14px;color:#f1f5f9;display:flex;justify-content:space-between;align-items:center;}
.mp-gal-sheet .gal-sec{border-top:1px solid rgba(148,163,184,.14);padding-top:12px;margin-top:12px;}
.mp-gal-sheet .gal-sec:first-of-type{border-top:none;padding-top:0;margin-top:0;}
.mp-gal-sheet .gal-label{font-size:11px;font-weight:600;color:#93a4bd;letter-spacing:.06em;margin-bottom:7px;text-transform:uppercase;}
.mp-gal-sheet .gal-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:12.5px;color:#dbe4f2;}
.mp-gal-sheet input[type=range]{width:150px;accent-color:#f472d0;}
.mp-gal-sheet input[type=text],.mp-gal-sheet textarea,.mp-gal-sheet select{width:100%;box-sizing:border-box;
  background:#0b1120;border:1px solid rgba(148,163,184,.25);border-radius:9px;color:#e2e8f0;font-size:12.5px;
  padding:8px 10px;font-family:inherit;}
.mp-gal-sheet .gal-seg{display:flex;flex-wrap:wrap;gap:6px;}
.mp-gal-sheet .gal-seg button{flex:1 1 auto;min-width:78px;font-size:11.5px;padding:7px 8px;}
.mp-gal-sheet .gal-seg button.on{background:rgba(244,114,208,.28);border-color:rgba(244,114,208,.7);color:#ffe4f7;font-weight:600;}
.mp-gal-sheet .gal-hint{font-size:10.5px;color:#7d8ca3;line-height:1.6;margin-top:6px;}
.mp-gal-sheet .gal-warn{font-size:11px;color:#fbbf24;line-height:1.6;margin-top:6px;background:rgba(251,191,36,.08);
  border:1px solid rgba(251,191,36,.28);border-radius:9px;padding:8px 10px;}
.mp-gal-sheet .gal-list{display:flex;flex-direction:column;gap:6px;max-height:230px;overflow-y:auto;}
.mp-gal-sheet .gal-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;
  border-radius:9px;background:rgba(15,23,42,.6);border:1px solid rgba(148,163,184,.14);font-size:12px;}
.mp-gal-sheet .gal-item .gal-item-main{flex:1;min-width:0;}
.mp-gal-sheet .gal-item .gal-item-sub{font-size:10.5px;color:#7d8ca3;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mp-gal-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;
  color:#94a3b8;font-size:13px;z-index:3;}
.mp-gal-root.is-phone .mp-gal-dialog{padding:12px 14px 20px;border-radius:14px;}
.mp-gal-root.is-phone .mp-gal-text{font-size:calc(var(--gal-fs,17px) - 1px);max-height:34vh;}
@media (max-width:640px){
  .mp-gal-sprite{max-height:72%;max-width:70%;}
  .mp-gal-top .mp-gal-title{display:none;}
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
    root.innerHTML = '' +
      '<div class="mp-gal-bg"></div>' +
      '<div class="mp-gal-sprite-layer"></div>' +
      '<div class="mp-gal-cg"><img alt="event cg"></div>' +
      '<div class="mp-gal-empty" id="mp-gal-empty" style="display:none"></div>' +
      '<div class="mp-gal-top">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<button type="button" data-gal-act="exit">← 返回聊天</button>' +
          '<span class="mp-gal-title">Galgame Mode</span>' +
        '</div>' +
        '<div class="mp-gal-top-right">' +
          '<button type="button" data-gal-act="moon">🌕 系统</button>' +
          '<button type="button" data-gal-act="cg">🖼 CG</button>' +
          '<button type="button" data-gal-act="input">⌨ 输入</button>' +
          '<button type="button" data-gal-act="history">📜 历史</button>' +
          '<button type="button" data-gal-act="saves">💾 存档</button>' +
          '<button type="button" data-gal-act="tagmap">🏷 标签</button>' +
          '<button type="button" data-gal-act="settings">⚙ 设置</button>' +
          '<button type="button" data-gal-act="hide">⛶ 隐藏</button>' +
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
        '<button type="button" data-gal-act="prev">◀ 上一页</button>' +
        '<button type="button" data-gal-act="next">下一页 ▶</button>' +
        '<button type="button" data-gal-act="auto">▶ 自动</button>' +
        '<button type="button" data-gal-act="skip">⏩ 已读跳过</button>' +
        '<button type="button" data-gal-act="input">⌨ 自由输入</button>' +
        '<button type="button" data-gal-act="fullscreen">⛶ 全屏</button>' +
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
    try { galApplyCssVars(root); } catch (e) {}
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
        empty.innerHTML = '这一段剧情没渲染出来：' + galEscape(e && e.message || e) +
          '<br><span style="font-size:11px;color:#7d8ca3;">可以先点左上角「← 返回聊天」，或刷新一次再试</span>';
      }
    }
    try { galMemoryWarnIfBroken(); } catch (e) {}
    return root;
  }

  function galClose() {
    const root = galRootEl();
    if (root) { root.classList.remove('open'); galCloseSheet(); }
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
      if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.innerHTML = '<div style="font-size:26px">🌙</div><div>当前聊天还没有 AI 回复</div><div style="font-size:11px;color:#64748b">先在酒馆里正常聊一句，再回到这里</div>'; }
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
      return '<button type="button" class="mp-gal-choice" data-gal-choice="' + i + '">' +
        '<span class="gal-choice-idx">' + (i + 1) + '</span>' + galEscape(c) + '</button>';
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
    if (auto) auto.textContent = GAL_RUNTIME.autoPlay ? '⏸ 暂停' : '▶ 自动';
    const hide = root.querySelector('[data-gal-act="hide"]');
    if (hide) hide.textContent = GAL_RUNTIME.hideUI ? '☰ 显示' : '⛶ 隐藏';
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
          { v: 'builtin', t: '🌙 月相内置' },
          { v: 'external', t: '🔌 第三方接管' },
          { v: 'manual', t: '📁 手动素材' },
          { v: 'off', t: '📝 纯文字' }
        ]) +
        '<div class="gal-hint">当前：<b>' + galEscape(img.label) + '</b>｜内置生图入口：' + (img.builtinActive ? '开启' : '已关闭') +
        '｜检测到的第三方生图插件：' + (img.detected.length ? img.detected.map(function(d) { return galEscape(d.label) + (d.enabled ? '' : '（未启用）'); }).join('、') : '无') + '</div>' +
        (img.warning ? '<div class="gal-warn">' + galEscape(img.warning) + '</div>' : '') +
        '<div class="gal-row" style="margin-top:8px"><span>每轮最多接收图片</span><input type="range" min="1" max="4" value="' + s.maxImagesPerTurn + '" data-gal-range="maxImagesPerTurn"></div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">记忆模式（三选一，互斥）</div>' +
        seg('memoryMode', s.memoryMode, [
          { v: 'builtin', t: '🌙 内置记忆' },
          { v: 'external', t: '🔌 第三方接管' },
          { v: 'off', t: '🚫 完全关闭' }
        ]) +
        '<div class="gal-hint">当前：<b>' + galEscape(mem.label) + '</b>｜回合 ' + mem.turns + ' · 阶段摘要 ' + mem.stages + ' · 长期 ' + mem.longs +
        '｜检测到的记忆插件：' + (mem.plugins.length ? mem.plugins.map(function(p) { return galEscape(p.label) + (p.enabled ? '' : '（未启用）'); }).join('、') : '无') + '</div>' +
        (mem.warning ? '<div class="gal-warn">' + galEscape(mem.warning) + '</div>' : '') +
        '<div class="gal-row" style="margin-top:8px"><span>阶段摘要间隔（回合）</span><input type="range" min="2" max="8" value="' + s.memoryStageEvery + '" data-gal-range="memoryStageEvery"></div>' +
        '<div class="gal-row"><span>长期记忆间隔（回合）</span><input type="range" min="6" max="20" value="' + s.memoryLongEvery + '" data-gal-range="memoryLongEvery"></div>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">标签映射</div>' +
        '<div class="gal-hint">当前预设：<b>' + galEscape(tag.presetName) + '</b>｜启用 ' + tag.enabledCount + ' / ' + tag.total + ' 条' +
        (tag.ok ? '｜校验通过' : '｜<span style="color:#f87171">存在 ' + tag.problems.filter(function(p) { return p.level === 'error'; }).length + ' 个问题</span>') + '</div>' +
        '<button type="button" data-gal-act="tagmap" style="margin-top:8px;width:100%">🏷 打开标签映射编辑器</button>' +
      '</div>' +
      '<div class="gal-sec">' +
        '<div class="gal-label">素材</div>' +
        '<button type="button" data-gal-asset="bg" style="width:100%;margin-bottom:6px">🖼 设置背景图（输入网址）</button>' +
        '<button type="button" data-gal-asset="sprite" style="width:100%;margin-bottom:6px">🧍 设置角色立绘（名字|表情）</button>' +
        '<button type="button" data-gal-asset="cg" style="width:100%">✨ 设置事件 CG</button>' +
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
        '<button type="button" data-gal-act="fullscreen" style="width:100%;margin-top:6px">⛶ 切换全屏</button>' +
      '</div>';
  }

  function galOpenSettingsSheet() {
    galShowSheet('⚙ Galgame 设置', galSettingsSheetHtml(), function(mask) {
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
        '<button type="button" data-gal-save-new="1" style="width:100%;margin-top:10px">💾 新建存档（当前楼层）</button>' +
      '</div>' +
      '<div class="gal-sec"><div class="gal-label">存档列表（最多 20 个）</div><div class="gal-list">' + listHtml + '</div></div>';
    galShowSheet('💾 存档 / 读档', body, function(mask) {
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
    galShowSheet('📖 读档确认', body, function(mask) {
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
    galShowSheet('📜 历史回看', '<div class="gal-hint" style="margin-bottom:10px">只是回看，不会删除或修改任何消息。</div>' +
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
        '<button type="button" data-gal-preset="save" style="width:100%;margin-top:10px">💾 保存这个预设</button>' +
      '</div>';
    galShowSheet('🏷 标签映射', body, function(mask) {
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
