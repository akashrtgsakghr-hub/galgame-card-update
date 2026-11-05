/* 86f-gal-boot.js —— 沉浸模式启动与菜单入口。
   只新增入口，不改动原有「🌕 月相系统」面板的任何按钮。 */

  function galMenuEntryHtml() {
    return '<span class="fa-fw extensionsMenuExtensionButton" style="font-size:15px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">🎮</span><span>Galgame 沉浸模式</span>';
  }

  function injectGalMenuEntry() {
    const tryInject = function() {
      const menu = mainDoc.getElementById('extensionsMenu') ||
        mainDoc.getElementById('extensions_menu') ||
        mainDoc.querySelector('.extensionsMenu') ||
        mainDoc.querySelector('#extension-settings');
      if (!menu) return false;
      const old = mainDoc.getElementById('moon-gal-menu-entry');
      if (old && old.parentNode === menu) return true;
      if (old) { try { old.remove(); } catch (e) {} }
      const div = mainDoc.createElement('div');
      div.id = 'moon-gal-menu-entry';
      div.className = 'list-group-item flex-container flexGap5 interactable';
      div.tabIndex = 0;
      div.innerHTML = galMenuEntryHtml();
      div.addEventListener('click', function() {
        try { if (galIsOn()) galClose(); else galOpen(); } catch (e) {}
      });
      menu.appendChild(div);
      return true;
    };
    if (!tryInject()) {
      const interval = setInterval(function() { if (tryInject()) clearInterval(interval); }, 800);
      setTimeout(function() { clearInterval(interval); }, 90000);
    }
  }

  /* 启动：只做三件事——注入样式、暴露全局入口、恢复"上次开着"的聊天 */
  function galBoot() {
    try { injectGalStyle(); } catch (e) {}
    try { mainWin.openMoonGalgame = galOpen; window.openMoonGalgame = galOpen; } catch (e) {}
    try { mainWin.toggleMoonGalgame = galToggle; window.toggleMoonGalgame = galToggle; } catch (e) {}
    try { injectGalMenuEntry(); } catch (e) {}
    // 恢复：每个聊天独立记住是否开着，换聊天不会串
    setTimeout(function() {
      try {
        if (galIsOn() && !galRootEl()) galOpen();
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
