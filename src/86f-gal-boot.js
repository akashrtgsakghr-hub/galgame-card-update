/* 86f-gal-boot.js —— 沉浸模式启动与入口。
   入口已经收进系统面板主菜单（不再单独占一项魔棒菜单），这里只负责启动与恢复。 */

  function galMenuEntryHtml() {
    return '<span class="fa-fw extensionsMenuExtensionButton" style="font-size:15px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">🎮</span><span>Galgame 沉浸模式</span>';
  }

  /* 保留这个函数只是为了兼容旧调用点；真正的入口在面板里，魔棒菜单不再注入。 */
  function injectGalMenuEntry() {
    const old = mainDoc.getElementById('moon-gal-menu-entry');
    if (old) { try { old.remove(); } catch (e) {} }
    return false;
  }

  /* 沉浸层实际是否开着，以 DOM 为准。
     只读存档状态会在「上次没退干净」时骗人：状态是 on、DOM 没有（或反之），
     于是第一下点击判成「关闭」，看起来就是点了没反应。 */
  function galIsOpenInDom() {
    const root = galRootEl();
    return !!(root && root.classList.contains('open'));
  }
  function galShow() {
    try {
      if (!galIsOpenInDom()) galOpen();
      else galRender(true);
      return true;
    } catch (e) {
      try { console.warn('[月相] 沉浸模式打开失败：', e); } catch (e2) {}
      try { toast('沉浸模式打不开：' + String(e && e.message || e), 'warning'); } catch (e3) {}
      return false;
    }
  }
  function galHide() {
    try { galClose(); } catch (e) {}
  }
  function galFlip() {
    if (galIsOpenInDom()) { galHide(); return true; }
    return galShow();
  }

  /* 启动：只做三件事——注入样式、暴露全局入口、恢复"上次开着"的聊天 */
  function galBoot() {
    try { injectGalStyle(); } catch (e) {}
    try { mainWin.openMoonGalgame = galShow; window.openMoonGalgame = galShow; } catch (e) {}
    try { mainWin.toggleMoonGalgame = galFlip; window.toggleMoonGalgame = galFlip; } catch (e) {}
    try { injectGalMenuEntry(); } catch (e) {}
    // 恢复：每个聊天独立记住是否开着，换聊天不会串
    setTimeout(function() {
      try {
        if (galIsOn() && !galIsOpenInDom()) galShow();
      } catch (e) {}
    }, 1600);
  }

  /* 供面板/自检读取的一行摘要 */
  function galStatusLine() {
    const img = galImageHint();
    const mem = galMemoryHint();
    const tag = galTagmapHint();
    return '沉浸模式：' + (galIsOn() ? '开' : '关') +
      '｜图片：' + img.label + '｜记忆：' + mem.label +
      '｜标签：' + tag.presetName + '（' + tag.enabledCount + ' 条）';
  }
