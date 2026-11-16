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
    /* 后台静默生成（成就命名、小抄重写、摘要、时间线）也是 GENERATION_STARTED，
       类型是 quiet。它要的是 JSON，不是剧情——把我们那七节规则塞进去只会让它跑偏，
       还白烧 token。所以 quiet 轮把注入全撤掉，正常轮再注回来。 */
    let _quietTurn = false;
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
    // 普通对话不弹街机：generation_started 是酒馆「每次 AI 生成回复」的事件。
    // 街机只由月相自己发起的长任务打开（见 callOpeningModel / 首次自检）。
    trySubscribe('message_received', function() {
      isWaitingForExtraModel = false;
      _quietTurn = false;
      // 终幕 / 后日谈导演指令只作用于玩家发起结算后的那一轮生成。
      // 旧实现只在成功渲染 [GalgameEnding|...] 时清空，AI 若没输出合规标签，
      // 这条「最高优先级」指令会一直留在后续每轮 prompt 里，导致持续写结局 / 后日谈。
      try {
        callSetPrompt(PROMPT_KEY + '_ending_director', '', 0, 0, false);
        callSetPrompt(PROMPT_KEY + '_epilogue_director', '', 0, 0, false);
      } catch (e) {}
      onGenerationEnd().then(function() {
        /* 回复处理完（变量已落盘）就立刻把下一轮要用的心声提醒写进去。
           为什么不在 chat_completion_prompt_ready 里只注一次：那个事件在部分酒馆 /
           酒馆助手版本里是「prompt 已经拼好」才触发，这时候改 extension_prompts
           对本次请求已经晚了；提前一轮注入不依赖那个时序。 */
        try { injectVoiceTagReminder(); } catch (e) {}
      }).catch(function(e) { try { console.warn('[Doki] 回复后处理失败：', e); } catch (ignore) {} });
      // Galgame 沉浸层：只记记忆、接收第三方图片、刷新展示，不碰聊天记录
      try { onGalMessageReceived(galLatestAiIndex()); } catch (e) {}
      /* 掌机：这一轮 AI 回完了——响一声，让掌机把这一局存下来。
         只有真的在掌机里跑着卡带时才动（判断在 pocketAfterAiReply 里）。 */
      try { if (typeof pocketAfterAiReply === 'function') pocketAfterAiReply('message_received'); } catch (e) {}
    });
    /* generation_ended 比 message_received 更早一点点到，两个都挂上、内部去抖；
       有些酒馆版本没有这个事件，trySubscribe 订阅失败就只剩上面那一条。 */
    trySubscribe('generation_ended', function() {
      try { if (typeof pocketAfterAiReply === 'function') pocketAfterAiReply('generation_ended'); } catch (e) {}
    });
    trySubscribe('character_message_rendered', function() {
      setTimeout(function() {
        sanitizeSylveinaRegexTail();
        beautifySylveinaTagsInDom();
      }, 150);
      setTimeout(function() { try { onGalDomRendered(); } catch (e) {} }, 260);
    });
    trySubscribe('mag_variable_update_ended', function() {
      isWaitingForExtraModel = false;
    });
    /* ── 注入时序 ────────────────────────────────────────────────────────────
       这一段以前只挂在 chat_completion_prompt_ready 上，而新版酒馆是「prompt 已经拼好」
       才发这个事件——在这里写 extension_prompts，只对下一轮有效，第一轮干脆是空的。
       现在主通道换成 generation_started（酒馆在拼 prompt **之前**发它），
       prompt_ready 只留作兜底 + 把最后一句贴到 chat 末尾。 */
    function runPromptInjectionSequence() {
      /* 先清空「本轮注入了什么」的记录，再按顺序注；核心规则和词条放到最后，
         这样它们能读到这一轮别人都往 prompt 里塞了些什么。 */
      try { resetRoundInjectedText(); } catch (e) {}
      injectCardModeNotice();
      injectEventPrompt();
      /* 攻略模式：角色侧那份「只存在于她心里」的提示。玩家侧永远不进 prompt。 */
      try { injectReversePrompt(); } catch (e) {}
      injectFanficEnhanceNotice();
      injectEnabledBios();
      injectUserBio();
      if (loadAnchor()) { const anchor = loadAnchor(); if (anchor) injectFateCollapse(anchor); }
      injectCorePrompt();
      injectGlossaryPrompt();
      // 剧情记忆：三模式互斥，非内置时这里只会把旧注入清空
      try { injectGalMemoryPrompt(); } catch (e) {}
      // 放在最后注入，防止旧小抄/旧摘要把当前关系事实覆盖掉。
      try { injectRelationshipFactsPrompt(); } catch (e) {}
      // 掌机金手指转写的那本《后宫王神宠秘籍》：玩家点了金手指才有内容，没点就是空。
      try { injectPocketWorldBook(); } catch (e) {}
      // 真正的最后一条：心声标签提醒。
      try { injectVoiceTagReminder(); } catch (e) {}
      try { saveInjectReport(); } catch (e) {}
    }
    /* 拼 prompt 之前：这一轮的规则必须在这时候就位。 */
    trySubscribe('generation_started', function(type) {
      if (String(type || '') === 'quiet') {
        _quietTurn = true;
        try { clearMoonPrompts(); } catch (e) {}
        return;
      }
      _quietTurn = false;
      try { runPromptInjectionSequence(); } catch (e) {}
    });
    /* prompt 已拼好：重算一遍内容（给下一轮更鲜的值），并把心声那句贴到 chat 末尾。
       老版本酒馆在拼之前就读 extension_prompts，这时内容和已拼好的 prompt 一致，
       injectTailIntoFinalChat 会检测到重复、不再追加。 */
    trySubscribe('chat_completion_prompt_ready', function(chatData) {
      if (_quietTurn) return;
      try { runPromptInjectionSequence(); } catch (e) {}
      try { injectTailIntoFinalChat(chatData, typeof getVoiceTailNote === 'function' ? getVoiceTailNote() : ''); } catch (e) {}
    });
    trySubscribe('message_deleted', onMessageDeletedOrSwiped);
    trySubscribe('message_swiped', onMessageDeletedOrSwiped);
    trySubscribe('chat_changed', function() {
      // 切换聊天时清掉任何残留的等待框（含街机 iframe），避免跨聊天挂在屏幕上。
      try { closeLoadingDialog(); } catch (e) {}
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
      setTimeout(function() {
        Promise.resolve(autoBootstrapCharacter('chat-open'))
          .then(function() { return applyBackendVariablesFromLatest(); })
          .catch(function(e) { try { console.warn('[Doki] 打开聊天后的状态同步失败：', e); } catch (ignore) {} });
      }, 1100);
      setTimeout(function() { refreshMessageSkins(); }, 1400);
      setTimeout(function() { try { onGalChatChanged(); } catch (e) {} }, 700);
      setTimeout(function() { try { injectUserBio(); injectGalMemoryPrompt(); injectRelationshipFactsPrompt(); refreshPanel(); } catch (e) {} }, 900);
    });
    setTimeout(function() { beautifySylveinaTagsInDom(); }, 600);
    setTimeout(function() { beautifySylveinaTagsInDom(); }, 2200);
    setTimeout(function() { refreshMessageSkins(); }, 2600);
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

  /* 结算完成之后，把正文里的数值标签整个删掉。

     标签 [Sylveina|角色|L|+|1.5] 是给脚本算账用的中间格式。
     玩家的「最终好感度」在状态栏里已经有了，正文再来一个徽章是重复，
     还会把注意力从剧情上拽走。所以算完就删，正文只留故事。

     按行判断：整行只有标签（或标签 + 那个 s 占位符）→ 连行一起删；
     混在句子中间 → 只抠掉标签本身，句子保留。 */
  function stripSylveinaTagsFromMessage() {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || typeof found.msg.mes !== 'string') return false;
      const src = found.msg.mes;
      if (!/Sylveina/i.test(src)) return false;
      const tagRe = /[\[\u3014\u3010\uff3b]\s*Sylveina\s*[|｜][^\]\u3015\u3011\uff3d]*[\]\u3015\u3011\uff3d]/gi;
      const lines = src.split(/\r?\n/);
      const kept = [];
      let hit = 0;
      let prevWasTag = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!/Sylveina/i.test(line)) {
          /* 紧跟在标签行后面那个单独的 s 是占位符，玩家不该看见，一并带走 */
          if (prevWasTag && /^\s*s\s*$/i.test(line)) { prevWasTag = false; continue; }
          kept.push(line);
          prevWasTag = false;
          continue;
        }
        const rest = line.replace(tagRe, function() { hit++; return ''; });
        /* 抠完只剩空白或一个 s → 这一行本来只为标签存在 */
        if (/^\s*s?\s*$/i.test(rest)) { prevWasTag = true; continue; }
        kept.push(rest.replace(/[ \t]{2,}/g, ' ').replace(/^[ \t]+|[ \t]+$/g, ''));
        prevWasTag = true;
      }
      if (!hit) return false;
      found.msg.mes = kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
      return true;
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

