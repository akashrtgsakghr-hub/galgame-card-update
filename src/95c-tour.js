  /* ══════════════════════════════════════════════════════════════════════════
   * 95c-tour.js —— 新手引导（聚光灯式）
   *
   * 旧版是四页密密麻麻的说明书：一次讲完所有概念，读完还是不知道该点哪。
   * 现在改成「一步一步指着讲」：每页只高亮一个真实控件，一句话说清它是干什么的。
   * 参考的是常见的新手引导做法：聚焦 → 一句话 → 下一步，随时可跳过、可重看。
   *
   * 约定：
   *   · 只高亮面板里真实存在的元素，找不到就跳过该步骤（不硬编坐标）
   *   · 每一步都能「上一步 / 下一步 / 跳过 / Esc」
   *   · 看完或跳过都写 introSeen，下次不再自动弹
   *   · 只由扩展菜单打开时自动触发，测试和其它调用方不受影响
   * ══════════════════════════════════════════════════════════════════════════ */
  let _tourState = null;
  let _tourAutoStarted = false;

  function tourSteps() {
    return [
      {
        sel: '.mp-lcd-card',
        title: '这台小机器只做一件事',
        text: '记住Ta对你<b>动了多少心</b>、走到哪一步。你什么都不用点，回酒馆正常聊天就行。'
      },
      {
        sel: '.mp-lcd-screen',
        title: '屏幕上是Ta现在的样子',
        text: '上面四个页签：<b>状态</b>看总览，<b>角色</b>看每个人，<b>事件</b>看接下来会发生什么，<b>字数</b>看这段聊天有多长。'
      },
      {
        sel: '.mp-guide',
        title: '不知道点哪，就看这一条',
        text: '粉色的这条永远只说一件事：<b>现在最该做什么</b>。它让你点哪个按钮，点那个就对了。'
      },
      {
        sel: '[data-menu-open="adventure"]',
        title: '其余功能都在下面这几个格子里',
        text: '改数值、换攻略对象，进<b>角色与存档</b>；点不动、数字不对，进<b>系统检修</b>。<b>每日签到</b>和攻略模式开关在<b>游戏设置</b>里。这些不点也照样能玩。'
      },
      {
        sel: '[data-gal-open]',
        title: '想全屏看剧情',
        text: '点<b>沉浸模式</b>，像玩 Galgame 一样点着往下走。右上角随时能回到这个面板。'
      },
      {
        sel: '#moon-phase-tutorial',
        title: '以后想再看，点这里',
        text: '随时能把这段引导重看一遍。遇到具体问题，去<b>系统选项 → 遇到问题</b>，那里按情况分好类了。'
      }
    ];
  }

  function closeTour(markSeen) {
    const st = _tourState;
    if (!st) return;
    _tourState = null;
    try { st.layer.remove(); } catch (e) {}
    try { mainWin.removeEventListener('resize', st.reposition); } catch (e) {}
    try { if (mainWin.visualViewport) mainWin.visualViewport.removeEventListener('resize', st.reposition); } catch (e) {}
    try { if (st.resizeObs) st.resizeObs.disconnect(); } catch (e) {}
    try { panelOf(st) && panelOf(st).removeEventListener('scroll', st.reposition); } catch (e) {}
    try { mainDoc.removeEventListener('keydown', st.onKey, true); } catch (e) {}
    /* 关闭后把焦点送回打开引导的那个按钮。不回的话焦点掉回 body，
       键盘 / 读屏用户要从页面开头重新 Tab 一遍才找得回来。 */
    try {
      const back = st.prevFocus;
      if (back && typeof back.focus === 'function' && back.isConnected !== false) back.focus({ preventScroll: true });
    } catch (e) {}
    if (markSeen) {
      try { const s = getSettings(); if (!s.introSeen) { s.introSeen = true; saveSettings(s); } } catch (e) {}
    }
  }

  /* 卡片里能被 Tab 到的元素。卡片是 innerHTML 每次重建的，所以每次现查。 */
  function tourFocusables(card) {
    if (!card) return [];
    let list = [];
    try {
      list = Array.prototype.slice.call(card.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
    } catch (e) { return []; }
    /* 不用 offsetWidth 判断可见性：卡片刚插进 DOM、动画还没跑时宽度也是 0，
       真机上会在那一瞬间算出「没有可聚焦元素」；这里只排除 disabled 与 hidden。 */
    return list.filter(function(el) { return !el.disabled && !el.hidden; });
  }


  function panelOf(st) { return st && st.panel; }

  function openTutorialDialog(panel) {
    panel = panel || mainDoc.getElementById('moon-phase-panel');
    if (!panel) return;
    closeTour(false);

    const all = tourSteps();
    const steps = all.filter(function(s) { return !!panel.querySelector(s.sel); });
    if (!steps.length) return;

    const layer = mainDoc.createElement('div');
    layer.className = 'mp-tour-layer';
    layer.setAttribute('role', 'dialog');
    /* 标题在卡片里每次重建，用 aria-labelledby 指过去；写死 aria-label 会和屏幕上
       实际那一句脱节（改文案时容易忘）。 */
    layer.setAttribute('aria-labelledby', 'mp-tour-title');
    const spot = mainDoc.createElement('div');
    spot.className = 'mp-tour-spot';
    const card = mainDoc.createElement('div');
    card.className = 'mp-tour-card';
    card.setAttribute('tabindex', '-1');
    /* 读屏播报区：卡片内容整块 innerHTML 重建、焦点又不在内容上，
       不复述一遍的话，翻到第 2 步之后读屏用户听不到任何变化。 */
    const live = mainDoc.createElement('div');
    live.className = 'mp-tour-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    /* live 挂在 layer 上、不挂在 card 上：card 每步都整体重写 innerHTML，
       挂在里面会被一起清掉，播报就只剩第一步。 */
    layer.appendChild(live);
    layer.appendChild(spot);
    layer.appendChild(card);
    /* 挂到 body：面板本身是滚动容器，放在里面会被裁掉，
       某些祖先还有 backdrop-filter，会把 fixed 变成相对它的绝对定位。 */
    (mainDoc.body || panel).appendChild(layer);

    const st = {
      panel: panel,
      layer: layer,
      spot: spot,
      card: card,
      live: live,
      steps: steps,
      index: 0,
      prevFocus: mainDoc.activeElement,
      placed: false,
      resizeObs: null,
      reposition: function() { positionTour(st); },
      onKey: function(e) {
        if (e.key === 'Escape') { e.preventDefault(); closeTour(true); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); stepTour(st, 1); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); stepTour(st, -1); return; }
        /* Tab 只在这个卡片里循环。不拦的话焦点会窜到遮罩下面的面板按钮上，
           人眼看着聚光灯、焦点却在别处，读屏也是同样的错位。 */
        if (e.key === 'Tab') {
          const f = tourFocusables(card);
          if (!f.length) { e.preventDefault(); return; }
          const first = f[0], last = f[f.length - 1];
          const cur = mainDoc.activeElement;
          if (e.shiftKey) {
            if (cur === first || !card.contains(cur) || cur === card) { e.preventDefault(); try { last.focus(); } catch (err) {} }
          } else if (cur === last || !card.contains(cur) || cur === card) {
            e.preventDefault();
            try { first.focus(); } catch (err) {}
          }
        }
      }
    };
    _tourState = st;

    try { mainWin.addEventListener('resize', st.reposition); } catch (e) {}
    /* 手机上底部地址栏收起 / 软键盘弹出走的是 visualViewport，不触发 window.resize */
    try { if (mainWin.visualViewport) mainWin.visualViewport.addEventListener('resize', st.reposition); } catch (e) {}
    try { panel.addEventListener('scroll', st.reposition, { passive: true }); } catch (e) {}
    try { mainDoc.addEventListener('keydown', st.onKey, true); } catch (e) {}
    /* 折叠块展开、提示条换了文案都会让面板长高，聚光灯框得跟着挪。
       以前只在 260ms 后补量一次，量完再变就永远错位。 */
    try {
      if (typeof ResizeObserver === 'function') {
        st.resizeObs = new ResizeObserver(function() { positionTour(st); });
        st.resizeObs.observe(panel);
      }
    } catch (e) {}

    renderTourStep(st, 0);
    /* 焦点立刻送进卡片：不然键盘用户还停在面板上，读屏也不知道开了个对话框。 */
    try { card.focus({ preventScroll: true }); } catch (e) {}
  }

  function stepTour(st, dir) {
    const next = st.index + dir;
    if (next < 0) return;
    if (next >= st.steps.length) { closeTour(true); return; }
    renderTourStep(st, next);
  }

  function renderTourStep(st, idx) {
    st.index = Math.max(0, Math.min(st.steps.length - 1, idx));
    const step = st.steps[st.index];
    const last = st.index === st.steps.length - 1;
    const dots = st.steps.map(function(_, i) { return '<i class="' + (i === st.index ? 'on' : '') + '"></i>'; }).join('');
    st.card.innerHTML =
      '<div class="mp-tour-step">新手引导 · 第 ' + (st.index + 1) + ' / ' + st.steps.length + ' 步' +
        '<span class="mp-tour-dots" aria-hidden="true">' + dots + '</span></div>' +
      '<div class="mp-tour-title" id="mp-tour-title">' + step.title + '</div>' +
      '<div class="mp-tour-text">' + step.text + '</div>' +
      '<div class="mp-tour-foot">' +
        '<button type="button" class="mp-tour-skip" data-tour="skip">跳过，我知道了</button>' +
        '<span style="flex:1"></span>' +
        '<button type="button" class="mp-tour-nav" data-tour="prev"' + (st.index === 0 ? ' disabled' : '') + '>上一步</button>' +
        '<button type="button" class="mp-tour-nav primary" data-tour="next">' + (last ? '开始用' : '下一步') + '</button>' +
      '</div>';
    st.card.querySelector('[data-tour="skip"]').addEventListener('click', function() { closeTour(true); });
    st.card.querySelector('[data-tour="prev"]').addEventListener('click', function() { stepTour(st, -1); });
    st.card.querySelector('[data-tour="next"]').addEventListener('click', function() { stepTour(st, 1); });

    if (st.live) st.live.textContent = '第 ' + (st.index + 1) + ' 步，共 ' + st.steps.length + ' 步：' + step.title;

    /* 把目标滚到面板中间，量完再画框 —— 先量后滚会得到旧坐标 */
    try {
      const target = st.panel.querySelector(step.sel);
      if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'center', inline: 'nearest' });
    } catch (e) {}
    requestAnimationFrame(function() { positionTour(st); });
  }

  function positionTour(st) {
    if (!_tourState || _tourState !== st) return;
    /* 第一次定位必须瞬移：带着过渡会看到光框从左上角滑到目标上。
       定完位再放开过渡，之后每步之间就是平滑挪过去。 */
    if (!st.placed) {
      st.placed = true;
      try { st.spot.classList.add('no-anim'); } catch (e) {}
      requestAnimationFrame(function() {
        requestAnimationFrame(function() { try { st.spot.classList.remove('no-anim'); } catch (e) {} });
      });
    }
    const step = st.steps[st.index];
    const target = st.panel.querySelector(step.sel);
    const panelRect = st.panel.getBoundingClientRect();
    /* 手机地址栏收起 / 键盘弹出时，只有 visualViewport 是准的 */
    const vv = mainWin.visualViewport;
    const vw = (vv && vv.width) || mainWin.innerWidth || 375;
    const vh = (vv && vv.height) || mainWin.innerHeight || 667;

    /* 卡片宽度先算死：不能让「左 10 右 10」在窄容器里算出负数宽度 */
    const cardW = Math.max(240, Math.min(340, vw - 24));
    st.card.style.width = cardW + 'px';
    st.card.style.right = 'auto';

    if (!target) {
      st.spot.style.display = 'none';
      st.card.style.left = Math.round((vw - cardW) / 2) + 'px';
      st.card.style.top = Math.round(vh * 0.3) + 'px';
      st.card.style.bottom = 'auto';
      return;
    }
    const r = target.getBoundingClientRect();
    const pad = 4;
    const hasBox = r.width > 0 && r.height > 0;
    st.spot.style.display = hasBox ? 'block' : 'none';
    if (hasBox) {
      st.spot.style.left = Math.round(r.left - pad) + 'px';
      st.spot.style.top = Math.round(r.top - pad) + 'px';
      st.spot.style.width = Math.round(r.width + pad * 2) + 'px';
      st.spot.style.height = Math.round(r.height + pad * 2) + 'px';
    }

    /* 卡片放在目标上方或下方，看哪边空得下；两边都放不下就贴屏幕底部 */
    const cardH = st.card.offsetHeight || 190;
    const gap = 12;
    const safeTop = Math.max(8, panelRect.top + 8);
    const safeBottom = Math.min(vh - 8, panelRect.bottom - 8);
    let top = hasBox ? r.bottom + gap : safeTop + 8;
    if (top + cardH > safeBottom) top = hasBox ? r.top - cardH - gap : safeTop + 8;
    if (top < safeTop) top = Math.max(8, safeBottom - cardH);
    st.card.style.top = Math.round(top) + 'px';
    st.card.style.bottom = 'auto';

    const baseLeft = hasBox ? r.left : panelRect.left + 10;
    const maxLeft = vw - cardW - 8;
    st.card.style.left = Math.round(Math.max(8, Math.min(baseLeft, maxLeft))) + 'px';
  }
