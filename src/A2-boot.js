  function injectMenuEntry() {
    const tryInject = function() {
      const menu = mainDoc.getElementById('extensionsMenu') || 
                   mainDoc.getElementById('extensions_menu') || 
                   mainDoc.querySelector('.extensionsMenu') || 
                   mainDoc.querySelector('#extension-settings');
      if (!menu) return false;
      const old = mainDoc.getElementById('moon-phase-menu-entry');
      if (old && old.parentNode === menu) return true;
      if (old) { try { old.remove(); } catch (e) {} }
      const div = mainDoc.createElement('div');
      div.id = 'moon-phase-menu-entry';
      div.className = 'list-group-item flex-container flexGap5 interactable';
      div.tabIndex = 0;
      div.innerHTML = '<span class="fa-fw extensionsMenuExtensionButton" style="font-size:15px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">🌕</span><span>' + SYSTEM_MENU_NAME + '</span>';
      div.addEventListener('click', function() { openPanel({ autoTour: true }); });
      menu.appendChild(div);
      return true;
    };
    if (!tryInject()) {
      const interval = setInterval(function() { if (tryInject()) clearInterval(interval); }, 600);
      setTimeout(function() { clearInterval(interval); }, 90000);
    }
    // Listen for click on ST wand buttons to immediately inject if menu was lazy-loaded
    try {
      const wandBtns = mainDoc.querySelectorAll('#extensionsMenuButton, #extensions_button, .extensionsMenuExtensionButton, #wand_button');
      wandBtns.forEach(function(b) {
        if (!b._mpHooked) {
          b._mpHooked = true;
          b.addEventListener('click', function() { setTimeout(tryInject, 100); setTimeout(tryInject, 400); });
        }
      });
    } catch(e) {}
    // 🎮 沉浸模式入口已经收进系统面板主菜单，不再往魔棒菜单里多塞一项
  }

  
  // 全局导出与魔棒快捷入口兼容
  try {
    mainWin.openMoonPhase = openPanel;
    mainWin.openGalgameConsole = openPanel;
    window.openMoonPhase = openPanel;
    window.openGalgameConsole = openPanel;
  } catch(e) {}

  function openPanel(opts) {
    let mask = mainDoc.getElementById('moon-phase-mask');
    if (!mask) {
      mask = mainDoc.createElement('div');
      mask.id = 'moon-phase-mask';
      mask.addEventListener('click', function(e) { if (e.target === mask) closePanel(); });
      mainDoc.body.appendChild(mask);
    }
    let panel = mask.querySelector('#moon-phase-panel');
    if (!panel) { panel = mainDoc.createElement('div'); panel.id = 'moon-phase-panel'; mask.appendChild(panel); }
    /* 渲染失败也必须把面板打开：以前 renderPanel 抛异常会停在 classList.add 之前，
       玩家看到的就是「点了月相系统没反应，得刷新一次」。现在出错就把错误摊开讲清楚。 */
    try {
      renderPanel(panel);
    } catch (e) {
      try { console.warn('[月相] 面板渲染失败：', e); } catch (e2) {}
      try { toast('面板渲染出错：' + String(e && e.message || e), 'warning'); } catch (e3) {}
    }
    // 显式压在 Galgame 沉浸层（2147483000）之上，但低于各种弹窗（2147483650+）
    try { mask.style.zIndex = '2147483645'; } catch (e) {}
    mask.classList.add('open');
    /* 第一次从菜单打开时自动走一遍聚光灯引导；看完 / 跳过都写 introSeen，不再打扰 */
    if (opts && opts.autoTour) {
      setTimeout(function() {
        try {
          if (_tourAutoStarted) return;
          if (getSettings().introSeen === true) return;
          _tourAutoStarted = true;
          openTutorialDialog(panel);
        } catch (e) {}
      }, 420);
    }
  }

  function closePanel() {
    const panel = mainDoc.getElementById('moon-phase-panel');
    if (panel && panel._lcdArcadeStop) { try { panel._lcdArcadeStop(); } catch (e) {} panel._lcdArcadeStop = null; }
    /* 关面板必须把掌机一起停掉：它的核心占着一个 rAF 循环，留着会一直烧 CPU */
    if (panel && panel._pocketStop) { try { panel._pocketStop(); } catch (e) {} panel._pocketStop = null; }
    const m = mainDoc.getElementById('moon-phase-mask');
    if (m) m.classList.remove('open');
  }

  function refreshPanel() {
    try { const panel = mainDoc.getElementById('moon-phase-panel'); if (panel) renderPanel(panel); } catch (e) {}
  }

  function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

  /* ── 一次性刷新闸门 ────────────────────────────────────────
     旧逻辑是「写标记 → 刷新」，标记写在 localStorage 里。只要 localStorage 写不进去
     （隐私模式 / iframe 限制 / 配额满 / 换设备），下一次加载又会重新判断成「需要刷新」，
     玩家看到的就是酒馆反复自己刷。现在统一走这里：只有 sessionStorage 确认标记真的
     写成功了才刷新，写不进去就宁可不刷 —— 停在旧页面，比无限刷新好得多。 */
  let _mpReloading = false;
  function safeReloadOnce(tag) {
    if (_mpReloading) return false;
    const key = 'moon_phase_reload_gate_' + String(tag || 'default');
    let ss = null;
    try { ss = mainWin.sessionStorage || sessionStorage; } catch (e) { ss = null; }
    if (!ss) return false;
    try {
      if (ss.getItem(key) === '1') return false;
      ss.setItem(key, '1');
      if (ss.getItem(key) !== '1') return false;
    } catch (e) { return false; }
    _mpReloading = true;
    setTimeout(function() {
      try {
        if (mainWin && mainWin.location && typeof mainWin.location.reload === 'function') mainWin.location.reload();
        else location.reload();
      } catch (e) { try { location.reload(); } catch (e2) {} }
    }, 500);
    return true;
  }


  function showFirstBootDialog() {
    closeFirstBootDialog();
    const mask = mainDoc.createElement('div');
    mask.id = 'moon-firstboot-mask';
    mask.className = 'mp-pixel-modal';
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483648;background:radial-gradient(circle at center,rgba(15,23,42,0.96) 0%,rgba(2,6,12,0.98) 100%);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    mask.innerHTML = '' +
      '<div style="background:linear-gradient(175deg,#141826 0%,#22262f 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:20px;padding:26px;width:100%;max-width:480px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 25px 70px rgba(18, 20, 26, 0.85),0 0 40px rgba(99,102,241,0.25);box-sizing:border-box;">' +
      '<div style="font-size:15px;font-weight:600;color:#fde047;text-align:center;margin-bottom:6px;letter-spacing:1px;">🌙 ' + SYSTEM_UI_NAME + '</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;text-align:center;margin-bottom:20px;">首次启动 · 系统初始化检测</div>' +
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="display:inline-block;width:64px;height:64px;border-radius:50%;border:3px solid rgba(148,163,184,0.2);border-top-color:#7dd3fc;border-right-color:#c084fc;animation:moon-spin 1.2s linear infinite;"></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#cbd5e1;line-height:1.8;margin-bottom:16px;padding:12px 14px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:10px;">' +
      '<div style="color:#7dd3fc;font-weight:600;margin-bottom:6px;">📢 首次导入公告</div>' +
      '欢迎使用本系统。检测到这是首次导入，系统将自动执行以下初始化检测：<br>' +
      '① 系统自检 · ② 公式测试 · ③ 环境冲突扫描<br>' +
      '每一步完成后会弹出结果窗口，请依次查看并关闭，全部完成后系统会自动刷新一次。' +
      '</div>' +
      '<div id="moon-firstboot-status" style="font-size:11px;color:#94a3b8;margin-bottom:8px;">⏳ 准备中...</div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(148,163,184,0.15);overflow:hidden;margin-bottom:16px;">' +
      '<div id="moon-firstboot-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#7dd3fc,#c084fc);transition:width 0.4s ease;"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;">' +
      '<span id="moon-firstboot-step1">○ 自检</span>' +
      '<span id="moon-firstboot-step2">○ 测试</span>' +
      '<span id="moon-firstboot-step3">○ 冲突扫描</span>' +
      '<span id="moon-firstboot-step4">○ 完成</span>' +
      '</div>' +
      '</div>';
    mainDoc.body.appendChild(mask);
  }

  function updateFirstBootProgress(step, text) {
    const m = mainDoc.getElementById('moon-firstboot-mask');
    if (!m) return;
    const bar = m.querySelector('#moon-firstboot-bar');
    const status = m.querySelector('#moon-firstboot-status');
    if (bar) bar.style.width = Math.min(100, (step / 4) * 100) + '%';
    if (status) status.textContent = text || '';
    const labels = ['自检', '测试', '冲突扫描', '完成'];
    for (let i = 1; i <= 4; i++) {
      const el = m.querySelector('#moon-firstboot-step' + i);
      if (!el) continue;
      const label = labels[i - 1];
      if (i < step || (i === step && step === 4)) {
        el.textContent = '● ' + label;
        el.style.color = '#6ee7b7';
      } else if (i === step) {
        el.textContent = '◐ ' + label;
        el.style.color = '#7dd3fc';
      } else {
        el.textContent = '○ ' + label;
        el.style.color = '#64748b';
      }
    }
  }

  function closeFirstBootDialog() {
    const m = mainDoc.getElementById('moon-firstboot-mask');
    if (m) { try { m.remove(); } catch (e) {} }
  }

  let _firstBootRunning = false;
  const FIRST_BOOT_SESSION_KEY = 'moon_phase_firstboot_session_v1';
  async function runFirstBootSequence() {
    if (_firstBootRunning) return;
    _firstBootRunning = true;
    let hasDone = false;
    try { hasDone = (mainWin.localStorage.getItem(FIRST_RUN_KEY) === '1'); } catch(e) {}
    /* 同一个浏览器会话只跑一次。localStorage 写不进去时靠这个标记兜底，
       否则每次加载都会重播自检 → 刷新 → 再播，表现就是酒馆一直刷。 */
    let alreadyRanThisSession = false;
    try {
      const ss = mainWin.sessionStorage || sessionStorage;
      alreadyRanThisSession = ss.getItem(FIRST_BOOT_SESSION_KEY) === '1';
      if (!alreadyRanThisSession) ss.setItem(FIRST_BOOT_SESSION_KEY, '1');
    } catch (e) { alreadyRanThisSession = hasDone; }
    if (hasDone || alreadyRanThisSession) { _firstBootRunning = false; return; }
    try { mainWin.localStorage.setItem(FIRST_RUN_KEY, '1'); } catch(e) {}

    showFirstBootDialog();
    await sleep(1200);

    // ① 自检
    updateFirstBootProgress(1, '⏳ 正在扫描系统状态...');
    await sleep(800);
    let selfcheckHtml = '';
    try { selfcheckHtml = await runSelfCheckWithArcade(); } catch(e) { selfcheckHtml = '<div style="color:#f87171">自检异常：' + String(e && e.message || e) + '</div>'; }
    updateFirstBootProgress(1, '✔ 自检完成，请查看结果');
    await showStepDialog('🔭 自检报告', selfcheckHtml, { confirmText: '✔ 看完了，下一步' });
    updateFirstBootProgress(1, '✔ 自检通过');
    await sleep(300);

    // ② 测试
    updateFirstBootProgress(2, '⏳ 正在运行综合测试...');
    await sleep(800);
    let testHtml = '';
    try { testHtml = await runSimulationTest(); } catch(e) { testHtml = '<div style="color:#f87171">测试异常：' + String(e && e.message || e) + '</div>'; }
    updateFirstBootProgress(2, '✔ 测试完成，请查看结果');
    await showStepDialog('🧪 测试结果', testHtml, { confirmText: '✔ 看完了，下一步' });
    updateFirstBootProgress(2, '✔ 测试通过');
    await sleep(300);

    // ③ 冲突扫描
    updateFirstBootProgress(3, '⏳ 正在扫描全环境冲突...');
    await sleep(800);
    let scanHtml = '';
    try { const r = await runConflictScan(); scanHtml = (r && r.html) || ''; } catch(e) { scanHtml = '<div style="color:#f87171">扫描异常：' + String(e && e.message || e) + '</div>'; }
    updateFirstBootProgress(3, '✔ 冲突扫描完成，请查看结果');
    await showStepDialog('🔍 冲突扫描', scanHtml, { confirmText: '✔ 看完了，下一步' });
    updateFirstBootProgress(3, '✔ 冲突扫描通过');
    await sleep(300);

    // ④ 完成
    updateFirstBootProgress(4, '✔ 全部检测完成，即将刷新页面...');
    await sleep(1200);
    closeFirstBootDialog();
    _firstBootRunning = false;
    if (getSettings().autoReload !== false) safeReloadOnce('firstboot');
    else toast('首次初始化完成。自动刷新已关闭，请手动刷新一次使初始化结果完整生效。', 'info');
  }


/* =========================================================
 * 启动
 * ========================================================= */
injectStyle();
setupListeners();
// 🎮 Galgame 沉浸层启动（样式 / 菜单 / 全局入口 / 恢复上次开关状态）
try { galBoot(); } catch (e) {}

// 预热「旧世界书是否还在」的探测结果，供首次生成前决定要不要注入内置规则
try { refreshCoreWorldbookCache(); } catch (e) {}
try { injectCorePrompt(); } catch (e) {}
try { resetRoundInjectedText(); injectGlossaryPrompt(); } catch (e) {}

// 判断是否需要刷新
let _needAutoReload = false;
let _isFirstBoot = false;
try {
  const ls = mainWin.localStorage || localStorage;
  const lastRunVer = ls.getItem(LAST_RUN_VERSION_KEY) || '';
  // 版本变化 → 刷新一次
  if (lastRunVer && lastRunVer !== MOON_FORMULA_VERSION) _needAutoReload = true;
  ls.setItem(LAST_RUN_VERSION_KEY, MOON_FORMULA_VERSION);
  _isFirstBoot = (ls.getItem(FIRST_RUN_KEY) !== '1');
} catch (e) { _isFirstBoot = true; }

if (_needAutoReload && !_isFirstBoot && getSettings().autoReload !== false) {
  // 版本更新后最多刷新一次；普通挂载不再追加第二次刷新。
  setTimeout(function() { safeReloadOnce('version'); }, 900);
} else if (_isFirstBoot) {
  // 首次导入检测流程：同样先挂载魔棒菜单，避免初始化中断后按钮彻底丢失
  setTimeout(injectMenuEntry, 300);
  setTimeout(function() { runFirstBootSequence(); }, 1200);
} else {
  // 常规启动不强制刷新页面。此前 mount 闸门每个新页面会话都会触发一次，
  // 首次导入/版本更新完成后的下一次加载又会命中不同闸门，造成连续两次刷新。
  setTimeout(function() { checkAndPromptMigrate(); }, 2500);
  setTimeout(function() { checkAndPromptBackfill(); }, 4200);
  setTimeout(function() { checkAndPromptBioEnable(); }, 5200);

  setTimeout(function() {
    injectMenuEntry();
    toast(SYSTEM_UI_NAME + ' 已加载', 'success');
  }, 800);
  setTimeout(function() { showUpdateAnnouncementOnce(); }, 1500);
  setTimeout(injectMenuEntry, 3000);
  setTimeout(injectMenuEntry, 8000);
  setTimeout(function() { runAdaptiveOpeningFlow(); }, 5500);
  setTimeout(function() { checkPendingMigration(); }, 6500);
}

// 不管走哪条分支，都排一次静默检查更新。
// 以前只有「常规启动」才查：「首次导入」的人（本地还没写过任何状态）和版本变化后要刷新的
// 那一轮都拿不到新版本提示，看起来就像「怎么重启都不更新」。
if (!_needAutoReload) {
  setTimeout(function() {
    try {
      const cfg = getUpdateConfig();
      if (cfg.autoCheck && cfg.url) checkForUpdates(true);
    } catch (e) {}
  }, 9000);
}
})();
