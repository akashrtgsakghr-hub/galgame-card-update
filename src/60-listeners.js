  function setupListeners() {
    const trySubscribe = function(eventName, handler) {
      const lower = eventName.toLowerCase(); const upper = eventName.toUpperCase();
      try { if (typeof eventOn === 'function') { eventOn(lower, handler); return true; } } catch (e) {}
      try {
        const es = mainWin.eventSource || window.eventSource;
        const et = mainWin.event_types || window.event_types;
        if (es && typeof es.on === 'function') {
          const mappedKey = (et && (et[upper] || et[lower])) || lower;
          es.on(mappedKey, handler); return true;
        }
      } catch (e) {}
      return false;
    };
    trySubscribe('worldinfo_entries_loaded', function(lores) {
      try {
        if (!Array.isArray(lores)) return lores;
        const mode = getCurrentMode();
        const modeCap = mode.charAt(0).toUpperCase() + mode.slice(1);
        const targetPrefix = '[Mode-' + modeCap + ']';
        for (let i = lores.length - 1; i >= 0; i--) {
          const entry = lores[i]; if (!entry) continue;
          const title = String(entry.name || entry.comment || entry.title || '');
          if (title.indexOf('[Mode-') === 0) {
            if (title.indexOf('[Mode-Common]') === 0) continue;
            if (title.indexOf(targetPrefix) !== 0) { lores.splice(i, 1); continue; }
          }
        }
        const _bioCardName = getCurrentCardName();
        if (_bioCardName && _bioCardName !== '(未知卡牌)') {
          const _bioLib = getBioLibrary();
          const _enabledBios = Object.values(_bioLib.bios || {}).filter(function(b) { return b && b.enabled === true && b.cardName === _bioCardName; });
          if (_enabledBios.length > 0) {
            const _coveredNames = _enabledBios.map(function(b) { return String(b.charName || '').trim(); }).filter(function(n) { return n.length >= 1; });
            if (_coveredNames.length > 0) {
              for (let i = lores.length - 1; i >= 0; i--) {
                const entry = lores[i]; if (!entry) continue;
                const title = String(entry.name || entry.comment || entry.title || '');
                if (title.indexOf('[Mode-') === 0) continue;
                if (title.indexOf('[Initvar]') === 0) continue;
                if (title.indexOf('[Timeline]') === 0) continue;
                if (title.indexOf('[WorldTimeline]') === 0) continue;
                const hit = _coveredNames.some(function(n) { return title.indexOf(n) >= 0; });
                if (hit) lores.splice(i, 1);
              }
            }
          }
        }
      } catch (e) {}
      return lores;
    });
    trySubscribe('message_received', function() {
      isWaitingForExtraModel = false;
      onGenerationEnd();
    });
    trySubscribe('character_message_rendered', function() {
      setTimeout(function() {
        sanitizeSylveinaRegexTail();
        beautifySylveinaTagsInDom();
      }, 150);
    });
    trySubscribe('mag_variable_update_ended', function() {
      isWaitingForExtraModel = false;
    });
    trySubscribe('chat_completion_prompt_ready', function() {
      injectCardModeNotice();
      injectEventPrompt();
      injectFanficEnhanceNotice();
      injectEnabledBios();
      injectUserBio();
      if (loadAnchor()) { const anchor = loadAnchor(); if (anchor) injectFateCollapse(anchor); }
    });
    trySubscribe('message_deleted', onMessageDeletedOrSwiped);
    trySubscribe('message_swiped', onMessageDeletedOrSwiped);
    trySubscribe('chat_changed', function() {
      anchorData = null; pendingCollapseNotice = false; timeJumpCooldown = 0; isWaitingForExtraModel = false;
      const store = getStorage();
      if (store) { store.removeItem(LAST_TIME_KEY); store.removeItem(LAST_JUMP_FLOOR_KEY); store.removeItem(LAST_GAME_DAY_KEY); }
      clearFateCollapse();
      setTimeout(function() { tryInheritAnchor(); }, 800);
      setTimeout(function() { checkAndPromptMigrate(); }, 2000);
      setTimeout(function() { runAdaptiveOpeningFlow(); }, 2000);
      setTimeout(function() { checkPendingMigration(); }, 2600);
      setTimeout(function() { checkAndPromptBackfill(); }, 3800);
      setTimeout(function() { checkAndPromptBioEnable(); }, 4600);
      setTimeout(function() { beautifySylveinaTagsInDom(); }, 1000);
      setTimeout(function() { applyBackendVariablesFromLatest(); }, 1200);
    });
    setTimeout(function() { beautifySylveinaTagsInDom(); }, 600);
    setTimeout(function() { beautifySylveinaTagsInDom(); }, 2200);
  }

  function sanitizeSylveinaRegexTail() {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || typeof found.msg.mes !== 'string') return false;
      let mes = found.msg.mes;
      const allTags = extractAllSylveinaTags(mes);
      if (!allTags.length) return false;
      let changed = false;

      // 将全角〔Sylveina|...〕或【Sylveina|...】等异体统一规范化为半角 [Sylveina|...]
      const normalizedMes = mes.replace(SYLVEINA_TAG_GLOBAL_RE, function(full, body) {
        const parsed = parseSylveinaBody(body, full);
        if (!parsed) return full;
        return parsed.canonicalSimpleTag;
      });
      if (normalizedMes !== mes) {
        mes = normalizedMes;
        changed = true;
      }

      const reNorm = new RegExp(SYLVEINA_TAG_GLOBAL_RE.source, 'gi');
      let m, lastNorm = null;
      while ((m = reNorm.exec(mes)) !== null) {
        lastNorm = { index: m.index, text: m[0], end: reNorm.lastIndex };
      }
      if (lastNorm) {
        const suffix = mes.slice(lastNorm.end);
        const backendPattern = /(?:^|\r?\n)\s*(?:角色\.[^\r\n=]+=[^\r\n]*|世界\.时间=[^\r\n]*|<UpdateVariable>[\s\S]*?<\/UpdateVariable>|<StatusPlaceHolderImpl\s*\/>)/i;
        const alreadyHasPlaceholder = /^\s*\r?\n\s*s\s*$/.test(suffix);
        const isAtEnd = /^\s*$/.test(suffix);
        if (backendPattern.test(suffix) || (isAtEnd && !alreadyHasPlaceholder)) {
          const cleanPrefix = mes.slice(0, lastNorm.end).replace(/[ \t]+$/, '');
          mes = cleanPrefix + '\ns';
          changed = true;
        }
      }
      if (changed) {
        found.msg.mes = mes.replace(/\n{3,}/g, '\n\n');
      }
      return changed;
    } catch (e) { return false; }
  }

  const GALGAME_ENDING_BRACKET_RE = /[\[\u3014\u3010\uff3b]\s*GalgameEnding\s*[|｜:\uff1a]([\s\S]*?)[\]\u3015\u3011\uff3d]/gi;
  const GALGAME_ENDING_XML_RE = /(?:<|&lt;)GalgameEnding(?:\s+[^>&]*)?(?:>|&gt;)([\s\S]*?)(?:<\/|&lt;\/)GalgameEnding(?:>|&gt;)/gi;
  const GALGAME_EPILOGUE_BRACKET_RE = /[\[\u3014\u3010\uff3b]\s*GalgameEpilogue\s*[|｜:\uff1a]([\s\S]*?)[\]\u3015\u3011\uff3d]/gi;
  const GALGAME_EPILOGUE_XML_RE = /(?:<|&lt;)GalgameEpilogue(\s+[^>&]*)?(?:>|&gt;)([\s\S]*?)(?:<\/|&lt;\/)GalgameEpilogue(?:>|&gt;)/gi;

  const ENDING_ROUTE_META = {
    TE: { badge: 'TRUE END · 命定真结局', jp: '― トゥルーエンド · 世界線の収束 ―', accent: '#f472d0', subAccent: '#7dd3fc', border: '#f472d0', bgGlow: 'rgba(244,114,208,0.22)' },
    HE: { badge: 'HAPPY END · 圆满终局', jp: '― ハッピーエンド · 永遠の誓い ―', accent: '#fb7185', subAccent: '#fde047', border: '#fb7185', bgGlow: 'rgba(251,113,133,0.22)' },
    BE: { badge: 'BAD END · 悲恋终局', jp: '― バッドエンド · 散りゆく花 ―', accent: '#38bdf8', subAccent: '#c084fc', border: '#38bdf8', bgGlow: 'rgba(56,189,248,0.20)' },
    CageEnd: { badge: 'CAGE END · 槛中终局', jp: '― ケイジエンド · 閉ざされた楽園 ―', accent: '#e879f9', subAccent: '#f43f5e', border: '#e879f9', bgGlow: 'rgba(232,121,249,0.22)' },
    UserDeathEnd: { badge: 'DEAD END · 陨落终局', jp: '― デッドエンド · 終焉の鐘 ―', accent: '#94a3b8', subAccent: '#f87171', border: '#94a3b8', bgGlow: 'rgba(148,163,184,0.18)' },
    CharDeathEnd: { badge: 'ECLIPSE END · 永诀终局', jp: '― エクリプスエンド · 残響の月 ―', accent: '#a78bfa', subAccent: '#93c5fd', border: '#a78bfa', bgGlow: 'rgba(167,139,250,0.20)' },
    CustomEnd: { badge: 'FINALE END · 终幕之章', jp: '― フィナーレ · 運命の栞 ―', accent: '#f472d0', subAccent: '#fde047', border: '#f472d0', bgGlow: 'rgba(244,114,208,0.22)' }
  };

  function cleanHtmlToPlainForRegex(str) {
    return String(str || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .trim();
  }

