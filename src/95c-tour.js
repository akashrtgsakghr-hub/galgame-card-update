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
        text: '记住她对你<b>动了多少心</b>、走到哪一步。你什么都不用点，回酒馆正常聊天就行。'
      },
      {
        sel: '.mp-lcd-screen',
        title: '屏幕上是她现在的样子',
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
        text: '改数值、换攻略对象，进<b>角色与存档</b>；点不动、数字不对，进<b>系统检修</b>。这些不点也照样能玩。'
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
    try { panelOf(st) && panelOf(st).removeEventListener('scroll', st.reposition); } catch (e) {}
    try { mainDoc.removeEventListener('keydown', st.onKey, true); } catch (e) {}
    if (markSeen) {
      try { const s = getSettings(); if (!s.introSeen) { s.introSeen = true; saveSettings(s); } } catch (e) {}
    }
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
    layer.setAttribute('aria-label', '新手引导');
    const spot = mainDoc.createElement('div');
    spot.className = 'mp-tour-spot';
    const card = mainDoc.createElement('div');
    card.className = 'mp-tour-card';
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
      steps: steps,
      index: 0,
      reposition: function() { positionTour(st); },
      onKey: function(e) {
        if (e.key === 'Escape') { e.preventDefault(); closeTour(true); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); stepTour(st, 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); stepTour(st, -1); }
      }
    };
    _tourState = st;

    try { mainWin.addEventListener('resize', st.reposition); } catch (e) {}
    try { panel.addEventListener('scroll', st.reposition, { passive: true }); } catch (e) {}
    try { mainDoc.addEventListener('keydown', st.onKey, true); } catch (e) {}

    renderTourStep(st, 0);
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
      '<div class="mp-tour-title">' + step.title + '</div>' +
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

    /* 把目标滚到面板中间，量完再画框 —— 先量后滚会得到旧坐标 */
    try {
      const target = st.panel.querySelector(step.sel);
      if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'center', inline: 'nearest' });
    } catch (e) {}
    requestAnimationFrame(function() { positionTour(st); });
    setTimeout(function() { if (_tourState === st) positionTour(st); }, 260);
  }

  function positionTour(st) {
    if (!_tourState || _tourState !== st) return;
    const step = st.steps[st.index];
    const target = st.panel.querySelector(step.sel);
    const panelRect = st.panel.getBoundingClientRect();
    const vw = mainWin.innerWidth || 375;
    const vh = mainWin.innerHeight || 667;

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
