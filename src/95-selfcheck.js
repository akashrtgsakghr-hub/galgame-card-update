  function renderArcadeGameScreen() {
    return '<div class="mp-arcade-box"><div class="mp-arcade-brand">▣ MOON POCKET ARCADE ▣</div><div class="mp-arcade-title">像素跳跃 · 避开障碍，挑战本聊天最高纪录</div><div class="mp-arcade-hud"><span>SCORE <b id="moon-arcade-score">00000</b></span><span>HI <b id="moon-arcade-hi-score">' + String(getArcadeHighScore()).padStart(5, '0') + '</b></span></div><div class="mp-arcade-record-time" id="moon-arcade-record-time">RECORD TIME · ' + lcdEscape(formatArcadeRecordTime(getArcadeRecord().achievedAt, getArcadeHighScore())) + '</div><canvas id="moon-arcade-canvas" width="320" height="94" aria-label="离线像素小游戏，按空格、方向上键或点击屏幕跳跃"></canvas><div class="mp-arcade-state" id="moon-arcade-state">PRESS SPACE / TAP TO JUMP</div><div class="mp-arcade-foot">空格 / ↑ / 触屏跳跃 · 用顶部切换返回系统面板</div></div>';
  }

  function openTutorialDialog(panel) {
    const steps = [
      {
        title: 'PAGE 01 · 这台掌机是干什么的',
        badge: 'MOON POCKET MANUAL',
        body: '<div style="line-height:1.85;font-size:11.5px;color:#ffe1f5;">' +
          '<div style="padding:8px 10px;background:#100a13;border:1px solid #f472d0;margin-bottom:8px;">' +
            '<b style="color:#ff8cdb;">★ 一句话：你不用做任何事，正常聊天就好。</b><br>' +
            '她对你动了多少心、走近到哪一步、现在什么关系、有多吃醋 —— 这四件事掌机都会自己记下来。' +
          '</div>' +
          '<div style="margin-bottom:8px;"><b>它怎么知道？靠一个「暗号」</b><br>' +
            'AI 每轮说完话，末尾会偷偷打一个暗号，长这样：<code>[Sylveina|M|+|3.5]</code>。<br>' +
            '掌机看见暗号，就摇一次骰子，把这一轮的变化算好记上。暗号玩家看不到，也不会打断剧情。' +
          '</div>' +
          '<div><b>屏幕上那四个字母是什么</b><br>' +
            '· <b style="color:#ffb8eb;">好感 (E)</b>：她有多喜欢你。涨到一定数会触发「关系升级判定」。<br>' +
            '· <b style="color:#ffb8eb;">亲密 (P)</b>：身体上走到哪一步了。<br>' +
            '· <b style="color:#ffb8eb;">关系 (R)</b>：从 -5 到 5，负数越冷、正数越亲。<br>' +
            '· <b style="color:#ffb8eb;">醋意 (I)</b>：她有多吃醋。' +
          '</div>' +
        '</div>'
      },
      {
        title: 'PAGE 02 · 液晶屏上四个画面',
        badge: 'MONO LCD DISPLAY',
        body: '<div style="line-height:1.8;font-size:11.5px;color:#ffe1f5;">' +
          '<p style="margin:0 0 6px;">点屏幕上方的 <b>[01 总览] ~ [04 占用]</b> 直接跳，也可以点底部 <b>◀ / ▶</b> 翻页：</p>' +
          '<div style="display:flex;flex-direction:column;gap:5px;">' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">[01 总览]</b>：现在几点、什么难度、开关是开还是关、她现在的数值。</div>' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">[02 角色]</b>：换人看 —— 四项数值、表情、她心里在想什么（内心话）。</div>' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">[03 事件]</b>：过了几天、第几回合、下一件大事还有多久、眼前这个小事件还剩几回合。</div>' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">[04 占用]</b>：这段对话占了多少字。数字太大手机会变卡。</div>' +
          '</div>' +
        '</div>'
      },
      {
        title: 'PAGE 03 · 你只需要记住这两个按钮',
        badge: 'GAME MENU GUIDE 1',
        body: '<div style="line-height:1.8;font-size:11.5px;color:#ffe1f5;">' +
          '<div style="padding:7px 9px;background:#100a13;border:1px solid #f472d0;margin-bottom:6px;">' +
            '<b style="color:#ff8cdb;">① 第一次玩：▶ 开始游戏 → 🚀 开局适配</b><br>' +
            '点它，AI 会把聊天记录读一遍，自动帮你建好角色档案。<b>老存档（已经聊了几十楼）也能用。</b><br>' +
            '<span style="color:#fde047;">建好之后就不用再点它了。</span>' +
          '</div>' +
          '<div style="padding:7px 9px;background:#100a13;border:1px solid #74355f;margin-bottom:6px;">' +
            '<b style="color:#ffb8eb;">② 觉得不对：♥ 角色与存档 → 👥 角色定位</b><br>' +
            'AI 把别人当成主角了？在这里改成「主要」。<br>' +
            '名字不对、时间卡住、内心话不更新 —— 同一页都能手改，改完点保存立刻生效。' +
          '</div>' +
          '<div style="padding:7px 9px;background:#100a13;border:1px solid #74355f;">' +
            '<b style="color:#ffb8eb;">加分不满意：🎲 属性点重掷</b><br>' +
            '这一轮算少了？点它重摇，可以一直摇到满意，再点「确认覆盖」。' +
          '</div>' +
        '</div>'
      },
      {
        title: 'PAGE 04 · 剩下三个菜单（都可以不点）',
        badge: 'GAME MENU GUIDE 2',
        body: '<div style="line-height:1.8;font-size:11.5px;color:#ffe1f5;">' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">▤ 冒险日志</b>：这个世界未来会发生什么。<b>不设置也能正常玩</b>，想让 AI 有主线目标才需要。</div>' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">⚙ 系统检修</b>：觉得卡了、数字乱跳才点。先点 <b>🔭 系统自检</b>，它会告诉你是哪里坏了。</div>' +
            '<div style="padding:6px 8px;background:#100a13;border:1px solid #74355f;"><b style="color:#ffb8eb;">▧ 系统选项</b>：填 AI 钥匙、换画风、看说明书。</div>' +
            '<div style="padding:7px 9px;background:#241025;border:1px solid #f472d0;"><b style="color:#ff8cdb;">🔑 AI 钥匙（API）填不填？</b><br>' +
              '不填也能玩，用的是你酒馆里那个 AI。<br>只有想让插件单独用一个 AI（比如更便宜的模型），才需要填。<br>' +
              '<b>忘了提前填也没关系：用到时会自动弹窗让你填，填完继续，不用重来。</b>' +
            '</div>' +
          '</div>' +
        '</div>'
      }
    ];

    let curStep = 0;
    try {
      const s = getSettings();
      if (!s.introSeen) { s.introSeen = true; saveSettings(s); }
    } catch (e) {}

    const html = '<div id="moon-tut-pills" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:10px;"></div>' +
      '<div id="moon-tut-head" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:5px;border-bottom:1px dashed #74355f;"></div>' +
      '<div id="moon-tut-body" style="min-height:220px;"></div>' +
      '<div style="display:flex;gap:6px;margin-top:12px;padding-top:10px;border-top:1px dashed #74355f;">' +
        '<button type="button" id="moon-tut-prev" style="padding:8px 10px;font-size:11px;cursor:pointer;">◀ PREV</button>' +
        '<button type="button" id="moon-tut-api" style="padding:8px 10px;font-size:11px;cursor:pointer;">🔑 配置API</button>' +
        '<button type="button" id="moon-tut-next" style="flex:1;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;">NEXT ▶</button>' +
      '</div>';

    showModalDialog('📖 MOON POCKET · 掌机说明书（新手引导）', html, null, {
      confirmText: '合上说明书',
      onOpen: function(mask) {
        const pillsEl = mask.querySelector('#moon-tut-pills');
        const headEl = mask.querySelector('#moon-tut-head');
        const bodyEl = mask.querySelector('#moon-tut-body');
        const prevBtn = mask.querySelector('#moon-tut-prev');
        const nextBtn = mask.querySelector('#moon-tut-next');
        const apiBtn = mask.querySelector('#moon-tut-api');

        function renderStep(idx) {
          curStep = Math.max(0, Math.min(steps.length - 1, idx));
          const st = steps[curStep];
          pillsEl.innerHTML = steps.map(function(item, i) {
            const on = i === curStep;
            return '<button type="button" class="moon-tut-step-btn" data-idx="' + i + '" style="padding:5px 2px;border:1px solid ' + (on ? '#f472d0' : '#643052') + ';background:' + (on ? '#37102f' : '#140b16') + ';color:' + (on ? '#ffe1f5' : '#bc8eaf') + ';font:700 10px monospace;cursor:pointer;">P0' + (i + 1) + '</button>';
          }).join('');
          pillsEl.querySelectorAll('.moon-tut-step-btn').forEach(function(b) {
            b.addEventListener('click', function() { renderStep(Number(b.getAttribute('data-idx')) || 0); });
          });
          headEl.innerHTML = '<b style="font-size:12px;color:#ffb8eb;">' + st.title + '</b><span style="font-size:9px;padding:1px 6px;border:1px solid #87416e;background:#2a1126;color:#ffc4e9;">' + st.badge + '</span>';
          bodyEl.innerHTML = st.body;
          prevBtn.disabled = curStep === 0;
          prevBtn.style.opacity = curStep === 0 ? '0.45' : '1';
          nextBtn.textContent = curStep === steps.length - 1 ? '🚀 立即开局适配' : 'NEXT (' + (curStep + 1) + '/' + steps.length + ') ▶';
        }

        prevBtn.addEventListener('click', function() { if (curStep > 0) renderStep(curStep - 1); });
        nextBtn.addEventListener('click', function() {
          if (curStep < steps.length - 1) {
            renderStep(curStep + 1);
          } else {
            try { mask.remove(); } catch (e) {}
            setTimeout(function() { openUnifiedAdaptDialog(panel); }, 180);
          }
        });
        apiBtn.addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          setTimeout(function() { openCustomAIConfigDialog(panel); }, 180);
        });
        renderStep(0);
      }
    });
  }

  function renderPanel(panel) {
    if (panel._lcdArcadeStop) { try { panel._lcdArcadeStop(); } catch (e) {} panel._lcdArcadeStop = null; }
    if (panel._lcdStateTimer) { clearInterval(panel._lcdStateTimer); panel._lcdStateTimer = null; }
    const mode = getCurrentMode();
    const displayMode = panel.dataset.displayMode === 'arcade' ? 'arcade' : 'system';
    const isArcadeMode = displayMode === 'arcade';
    const selectedLevel = isArcadeMode ? (panel.dataset.arcadeDifficulty || 'normal') : mode;
    const activeMenuKey = panel.dataset.activeMenuKey || '';
    panel.dataset.displayMode = displayMode;
    panel.classList.toggle('mp-display-arcade', isArcadeMode);
    const antisl = getAntiSL();
    const anchorLocked = !!loadAnchor();
    const extraSetting = getExtraModelMode();
    const cardMode = getCardMode();
    const autoBoot = getSettings().autoBootstrap !== false;
    const pacing = getEventPacing();
    const fateActive = isFateCollapseTriggered();
    const currentMeta = LUNAR_META[mode] || LUNAR_META.hell;
    const fanficOn = getFanficEnhance();
    const bioStatus = getCurrentBioStatus();
    const enabledUserBio = getEnabledUserBio();
    const hasApi = hasValidCustomAIConfig();
    const apiCfg = getCustomAIConfig();
    const s = getSettings();
    const _panelStat = (readMvuLatest() || {}).stat_data || {};
    const _panelChars = _panelStat.角色 || {};
    const hasRoster = Object.keys(_panelChars).some(function(n) { return !isCharSkeleton(_panelChars[n]); });
    const firstRunTip = hasRoster ? '' :
      '<div class="mp-card" style="border-color:rgba(244,114,208,0.45);background:rgba(244,114,208,0.07);">' +
      '<div style="font-size:12px;font-weight:800;color:#ff8cdb;margin-bottom:6px;">🎮 第一次玩？照着做两步就好</div>' +
      '<div style="font-size:11px;color:#e2e8f0;line-height:1.85;">' +
      '<b>第 1 步</b>　点下面的按钮 → AI 把聊天记录读一遍，自动建好角色档案。<br>' +
      '<b>第 2 步</b>　建好就关掉面板，正常聊天。她会自己涨好感。</div>' +
      '<button class="mp-btn mp-btn-highlight" id="moon-quick-start" style="width:100%;margin-top:9px;">🚀 帮我建角色档案（一键直达）</button>' +
      '</div>';

    panel.innerHTML = '' +
      '<div class="mp-head"><button type="button" class="mp-title-group mp-update-hitbox" id="moon-version-badge" aria-label="检查更新" title="点击标题区域或版本号检查更新" style="display:flex;align-items:center;gap:8px;">' +
      '<span class="mp-title-orb">' + currentMeta.glyph + '</span>' +
      '<span class="mp-title">' + SYSTEM_UI_NAME + '</span>' +
      '<span class="mp-badge" style="cursor:pointer;' +
        (_cachedUpdateInfo ? 'border-color:rgba(253,224,71,0.55);color:#fde047;' : '') +
        '">v' + MOON_FORMULA_VERSION +
        (_cachedUpdateInfo ? ' <b style="color:#fde047;margin-left:2px;">NEW · 有更新</b>' : '') +
      '</span>' +
      '</button><button class="mp-close" id="moon-phase-close">✕</button></div>' +
      '<div class="mp-display-mode-switch" role="tablist" aria-label="选择显示模式">' +
      '<button type="button" role="tab" aria-selected="' + (!isArcadeMode) + '" class="' + (!isArcadeMode ? 'active' : '') + '" data-display-mode="system">▤ 系统面板</button>' +
      '<button type="button" role="tab" aria-selected="' + isArcadeMode + '" class="' + (isArcadeMode ? 'active' : '') + '" data-display-mode="arcade">▣ 街机模式</button></div>' +
      '<div class="mp-card mp-lcd-card' + (isArcadeMode ? ' mp-lcd-game' : '') + '">' + (isArcadeMode ? renderArcadeGameScreen() : renderLcdScreen(panel, mode, antisl, extraSetting, cardMode, pacing, fanficOn)) + '</div>' +
      '<div class="mp-console-cluster" role="region" aria-label="掌机实体按键群">' +
        '<!-- 十字方向键 D-Pad -->' +
        '<div class="mp-dpad" aria-label="十字方向键">' +
          '<button type="button" class="mp-dpad-btn mp-dpad-up" aria-label="上" title="向上">▲</button>' +
          '<button type="button" class="mp-dpad-btn mp-dpad-left" data-lcd-page-step="-1" aria-label="上一页" title="向左 / 切换屏幕上一页">◀</button>' +
          '<div class="mp-dpad-center"></div>' +
          '<button type="button" class="mp-dpad-btn mp-dpad-right" data-lcd-page-step="1" aria-label="下一页" title="向右 / 切换屏幕下一页">▶</button>' +
          '<button type="button" class="mp-dpad-btn mp-dpad-down" aria-label="下" title="向下">▼</button>' +
        '</div>' +
        '<!-- 中间倾斜 SELECT & START 胶键 -->' +
        '<div class="mp-pill-keys">' +
          '<div class="mp-pill-row">' +
            '<button type="button" class="mp-select-key" id="moon-phase-tutorial" title="打开掌机说明书">SELECT</button>' +
            '<button type="button" class="mp-start-key' + (hasApi ? '' : ' unconfigured') + '" id="moon-header-api-btn" title="配置独立 AI 接口 (API)">START</button>' +
          '</div>' +
          '<div class="mp-pill-labels">' +
            '<span>📖 说明书</span>' +
            '<span>🔑 ' + (hasApi ? 'API已连' : '配置API') + '</span>' +
          '</div>' +
        '</div>' +
        '<!-- 右侧倾斜 A/B 按键与扬声器 -->' +
        '<div class="mp-action-block">' +
          '<div class="mp-action-cluster">' +
            '<button type="button" class="mp-round-btn mp-btn-b" id="moon-btn-b" title="B键 · 返回/关闭菜单">B</button>' +
            '<button type="button" class="mp-round-btn mp-btn-a" id="moon-btn-a" title="A键 · 确认/快速开始">A</button>' +
          '</div>' +
          '<div class="mp-speaker-grill" aria-label="扬声器孔">' +
            '<i></i><i></i><i></i><i></i><i></i>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mp-card mp-mode-select-card' + (isArcadeMode ? ' is-arcade' : '') + '"><details class="mp-difficulty-fold" open><summary>' + (isArcadeMode ? '街机难度' : '游戏难度') + '<i>▼</i></summary><div class="mp-difficulty-content">' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' +
      ['easy', 'normal', 'hard', 'hell'].map(function(m) {
        const item = LUNAR_META[m]; const isAct = (m === selectedLevel);
        return '<button class="mp-mode-btn ' + (isAct ? 'active' : '') + '" data-mode="' + m + '" style="padding:8px 2px;border-radius:9px;border:1px solid ' + (isAct ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.15)') + ';background:' + (isAct ? '#0c2540' : '#0f172a') + ';color:' + (isAct ? '#7dd3fc' : '#94a3b8') + ';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">' +
          '<div class="mp-mode-moon">' + item.glyph + '</div><div>' + item.name + ' · ' + item.title + '</div>' +
          '<div style="font-size:8px;opacity:0.65;">' + (isArcadeMode ? '街机档位' : '每周最多 +' + item.quota) + '</div></button>';
      }).join('') + '</div>' +
      '<div class="mp-mode-description" style="margin-top:8px;font-size:10.5px;color:#94a3b8;line-height:1.55;">' +
      (isArcadeMode
        ? '<b style="color:#e2e8f0;">' + LUNAR_META[selectedLevel].glyph + ' ' + LUNAR_META[selectedLevel].name + ' · ' + LUNAR_META[selectedLevel].title + '（街机档位）</b><br>' + ARCADE_DIFFICULTY_HINTS[selectedLevel] + '。<br>这个只影响街机小游戏，不改剧情难度。点一下立刻重开一局。'
        : '<b style="color:#e2e8f0;">' + currentMeta.glyph + ' ' + currentMeta.name + ' · ' + currentMeta.title + '</b><br>' + currentMeta.detail) + '</div></div></details></div>' +
      firstRunTip + '<div class="mp-system-content">' +
      '<div class="mp-card"><details class="mp-settings-fold"><summary>⚙ 运行设定 <span>▼</span></summary><div class="mp-toggle-row">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🌑 锚定时间线</div><div class="mp-toggle-desc">她翻脸/心凉就锁剧情，只能开新对话解</div></div>' +
      '<button class="mp-antisl ' + ((antisl || anchorLocked) ? 'on' : '') + '" id="moon-phase-antisl">' + (anchorLocked ? '🔒 已锁定' : (antisl ? '锚定: ON' : '锚定: OFF')) + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🔑 独立 API 接口</div><div class="mp-toggle-desc">' + (hasApi ? ('当前模型：' + lcdEscape(apiCfg.model)) : '没填也能玩，用到时会自动弹窗') + '</div></div>' +
      '<button class="mp-extra-btn ' + (hasApi ? 'on' : '') + '" id="moon-phase-extramodel">' + (hasApi ? 'API: 已配置' : '配置 API') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🃏 卡组模式</div><div class="mp-toggle-desc">' + (cardMode === 'multi' ? '这张卡有好几个能攻略的人' : '这张卡只有一个人') + '</div></div>' +
      '<button class="mp-cardmode-btn ' + (cardMode === 'multi' ? 'on' : '') + '" id="moon-phase-cardmode">' + (cardMode === 'multi' ? '多人卡' : '单人卡') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🧾 自动建档</div><div class="mp-toggle-desc">' + (autoBoot ? '对面第一次回话后，自动建一份 0 值档案，直接能加减' : '关：不点「开局适配」就一直不建档') + '</div></div>' +
      '<button class="mp-safelock-btn ' + (autoBoot ? 'on' : 'off') + '" id="moon-phase-autobootstrap">' + (autoBoot ? 'ON' : 'OFF') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);flex-wrap:wrap;gap:8px;">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🎫 楼内状态卡</div><div class="mp-toggle-desc" id="moon-phase-skin-desc">' + lcdEscape(getSkinHint()) + '</div></div>' +
      renderSkinPickerHtml() + '</div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🔒 安全锁</div><div class="mp-toggle-desc">' + (getSafetyLock() ? '开：她最多嘴上凶' : '关：可能真的动手') + '</div></div>' +
      '<button class="mp-safelock-btn ' + (getSafetyLock() ? 'on' : 'off') + '" id="moon-phase-safetylock">' + (getSafetyLock() ? '🔒 ON' : '⚠️ OFF') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🎬 事件推进节奏</div><div class="mp-toggle-desc">' + (pacing === 'Adi' ? '慢：很久才来一次' : pacing === 'All' ? '快：经常来' : '中：正常节奏') + '</div></div>' +
      '<button class="mp-pacing-btn ' + pacing + '" id="moon-phase-pacing">' + (pacing === 'Adi' ? 'Adagio 慢' : pacing === 'All' ? 'Allegro 快' : 'Andante 中') + '</button></div>' +
      '<div class="mp-toggle-row" style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(148,163,184,0.1);">' +
      '<div class="mp-toggle-info"><div class="mp-toggle-title">🌐 同人台词补强</div><div class="mp-toggle-desc">' + (fanficOn ? '借原作台词，说得更像本人' : '不借原作台词') + '</div></div>' +
      '<button class="mp-fanfic-btn' + (fanficOn ? ' on' : '') + '" id="moon-phase-fanfic">' + (fanficOn ? '🌐 ON' : 'OFF') + '</button></div>' +
      '</details><div class="mp-fate ' + (fateActive ? 'active' : 'idle') + '">' +
      '<span style="width:7px;height:7px;border-radius:50%;background:' + (fateActive ? '#f43f5e' : '#34d399') + ';"></span>' +
      '<span>' + (fateActive ? '🌑 锚定生效中' : '🌓 月相流转中 · 命运未定') + '</span></div></div>' +
      (bioStatus.count > 0 ? '<div class="mp-card" style="border-color:rgba(110,231,183,0.3);background:rgba(16,185,129,0.06);"><div style="font-size:11px;color:#6ee7b7;font-weight:700;">📖 已启用 ' + bioStatus.count + ' 份角色小抄</div><div style="font-size:10px;color:#94a3b8;margin-top:3px;">覆盖角色：' + bioStatus.charNames.join('、') + '</div></div>' : '') +
      (enabledUserBio ? '<div class="mp-card" style="border-color:rgba(244,114,182,0.3);background:rgba(244,114,182,0.06);"><div style="font-size:11px;color:#f9a8d4;font-weight:700;">👤 已启用玩家小抄</div><div style="font-size:10px;color:#94a3b8;margin-top:3px;">玩家：' + String(enabledUserBio.userName || '(未命名)').replace(/</g, '&lt;') + ' · 覆盖 Persona 面板</div></div>' : '') +
      '<section class="mp-menu-home" id="moon-menu-home" style="' + (activeMenuKey ? 'display:none' : 'display:block') + '"><div class="mp-menu-label">MOON POCKET · 主菜单（点哪进哪）</div><div class="mp-menu-grid">' +
      '<button class="mp-menu-card" data-menu-open="adventure"><span class="mp-menu-icon">▶</span><span><b>开始游戏</b><small>第一次玩点这里：建角色档案 · 重摇骰子 · 搬存档</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="characters"><span class="mp-menu-icon">♥</span><span><b>角色与存档</b><small>认错主角就在这改 · 让 AI 演得像本人 · 结局相册</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="timeline"><span class="mp-menu-icon">▤</span><span><b>冒险日志</b><small>这个世界哪天会出事（不点也能玩）</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="system"><span class="mp-menu-icon">⚙</span><span><b>系统检修</b><small>卡住了、数不对劲 → 来这体检一次</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="settings"><span class="mp-menu-icon">▧</span><span><b>系统选项</b><small>填 AI 钥匙 · 换画风 · 看说明书</small></span><i>›</i></button>' +
      '</div><div class="mp-menu-controls"><span><kbd>SELECT</kbd> 掌机说明书</span><span><kbd>START</kbd> 配置API</span><span>💡 不会玩？先点「开始游戏」</span></div></section>' +
      '<section class="mp-menu-page" id="moon-menu-page" style="' + (activeMenuKey ? 'display:block' : 'display:none') + '">' +
      '<div class="mp-menu-page-head"><button class="mp-menu-back" id="moon-menu-back">◀ 返回主菜单</button><div><small>GAME MENU / 掌机功能卡槽</small><b id="moon-menu-page-title">' + ({ adventure: '开始游戏', characters: '角色与存档', timeline: '冒险日志', system: '系统检修', settings: '系统选项' }[activeMenuKey] || '功能') + '</b></div><span class="mp-page-led"></span></div>' +
      '<div class="mp-subpage-switch" role="tablist" aria-label="快捷切换掌机菜单">' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'adventure' ? ' active' : '') + '" data-menu-open="adventure">▶ 开始</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'characters' ? ' active' : '') + '" data-menu-open="characters">♥ 角色</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'timeline' ? ' active' : '') + '" data-menu-open="timeline">▤ 日志</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'system' ? ' active' : '') + '" data-menu-open="system">⚙ 检修</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'settings' ? ' active' : '') + '" data-menu-open="settings">▧ 选项</button>' +
      '</div>' +
      '<div class="mp-menu-subpage" data-menu-page="adventure" style="display:' + (activeMenuKey === 'adventure' ? 'block' : 'none') + '"><div class="mp-sub-label">冒险准备 / ADVENTURE SETUP</div>' +
      '<details class="mp-action-fold" open><summary><span>建角色与搬存档</span><small>第一次建档 · 换聊天接着玩</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-adapt"><span>🚀 开局适配</span><small>第一次玩必点：AI 读完聊天记录，自动建好角色档案</small></button><button class="mp-btn mp-btn-highlight" id="moon-phase-pack-migrate"><span>📦 存档迁移</span><small>换到新聊天还想接着玩：把档案打包带走</small></button></div></details>' +
      '<details class="mp-action-fold" open><summary><span>摇骰与倒计时</span><small>加分不满意就重摇 · 查周上限</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-reroll"><span>🎲 属性点重掷</span><small>这轮加分不满意？重摇，可以摇到满意为止</small></button><button class="mp-btn" id="moon-phase-countdown"><span>⏱️ 回合计时</span><small>每周好感上限该清零了吗？点一下检查</small></button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="characters" style="display:' + (activeMenuKey === 'characters' ? 'block' : 'none') + '"><div class="mp-sub-label">角色档案 / CHARACTER FILES</div>' +
      '<details class="mp-action-fold" open><summary><span>角色档案与试戏</span><small>改主角 · 试戏 · 防说话走样</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-roster"><span>👥 角色定位</span><small>AI 认错人？在这里把她改成「主要」</small></button><button class="mp-btn mp-btn-highlight" id="moon-phase-bio"><span>🎬 角色试镜</span><small>让 AI 先演一段，看像不像本人</small></button><button class="mp-btn mp-btn-highlight" id="moon-phase-bio-lib"><span>📚 角色小抄库</span><small>管理所有人设小抄，可改可开关</small></button></div></details>' +
      '<details class="mp-action-fold" open><summary><span>玩家档案</span><small>让 AI 记住「你」是谁</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-user" id="moon-phase-user-bio"><span>👤 玩家档案</span><small>把酒馆里的「你」写成一份小传</small></button><button class="mp-btn mp-btn-user" id="moon-phase-user-bio-lib"><span>📂 玩家资料库</span><small>挑一份小传让它生效</small></button></div></details>' +
      '<details class="mp-action-fold" open><summary><span>相册与通关</span><small>看解锁的插画 · 结算这一局</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-gallery"><span>🏆 回忆画廊</span><small>看解锁的成就和插画，可下载保存</small></button><button class="mp-btn" id="moon-phase-ending"><span>🌌 周目结算</span><small>这一局结束：生成结局卡和番外小说</small></button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="timeline" style="display:' + (activeMenuKey === 'timeline' ? 'block' : 'none') + '"><div class="mp-sub-label">冒险日志 / WORLD LOG</div>' +
      '<details class="mp-action-fold" open><summary><span>时间线</span><small>大事表就存在脚本里，不用建世界书</small><i>＋</i></summary><div class="mp-grid">' +
        '<button class="mp-btn" id="moon-phase-tl-list"><span>📋 时间线清单</span><small>看看接下来会发生什么，能改能删</small></button>' +
        '<button class="mp-btn" id="moon-phase-tl-gen"><span>📝 生成时间线</span><small>让 AI 编一份大事表，直接存进来</small></button>' +
        '<button class="mp-btn" id="moon-phase-scan-timeline"><span>📥 从世界书导入</span><small>已经有现成的？搬进来就行</small></button>' +
      '</div></details>' +
      '<details class="mp-action-fold" open><summary><span>改日期</span><small>指定读哪一栏 · 自己粘贴</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-tl-tag"><span>🏷️ 时间线标签</span><small>告诉它「日期写在哪一栏」</small></button><button class="mp-btn" id="moon-phase-manual-tl"><span>✍️ 手动补录</span><small>自己贴一段，自动转成标准格式</small></button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="system" style="display:' + (activeMenuKey === 'system' ? 'block' : 'none') + '"><div class="mp-sub-label">系统检修 / SYSTEM SERVICE</div>' +
      '<details class="mp-action-fold" open><summary><span>体检</span><small>存上了吗 · 有没有缺零件</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-selfcheck"><span>🔭 系统自检</span><small>看数据存在哪、有没有缺零件</small></button><button class="mp-btn" id="moon-phase-simtest"><span>🧪 模拟测试</span><small>拿假数据试算一遍，不动你的存档</small></button></div></details>' +
      '<details class="mp-action-fold" open><summary><span>查冲突</span><small>别的插件跟我打架了吗</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-conflict"><span>🔍 冲突扫描</span><small>查世界书有没有重复、互相打架的条目</small></button><button class="mp-btn" id="moon-phase-ai-detect"><span>🤖 AI 功能检测</span><small>让 AI 帮你查冲突，或推荐一个难度</small></button></div></details></div>' +
      '<div class="mp-menu-subpage" data-menu-page="settings" style="display:' + (activeMenuKey === 'settings' ? 'block' : 'none') + '"><div class="mp-sub-label">系统选项 / OPTIONS</div>' +
      '<details class="mp-action-fold" open><summary><span>AI 与接口</span><small>可选：让插件用自己的 AI</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-custom-ai"><span>⚙️ 配置API</span><small>' + (hasApi ? '已设:' + lcdEscape(String(apiCfg.model).slice(0, 10)) : '没填也能玩，用到时会自动弹窗') + '</small></button><button class="mp-btn" id="moon-phase-prompt-edit"><span>🧩 提示词设置</span><small>想改 AI 收到的指令，在这里改</small></button></div></details>' +
      '<details class="mp-action-fold" open><summary><span>插画与番外</span><small>用哪家出图 · 番外写多长</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn" id="moon-phase-image-settings"><span>🖼️ 回忆与生图设定</span><small>选画图的渠道，定番外的字数</small></button><button class="mp-btn mp-btn-user" id="moon-phase-tutorial-btn"><span>📖 掌机说明书</span><small>不会用就看这个，一页讲一件事</small></button></div></details>' +
      '<details class="mp-action-fold" open><summary><span>更新与帮助</span><small>拉最新版 · 常见问题</small><i>＋</i></summary><div class="mp-grid"><button class="mp-btn' + (_cachedUpdateInfo ? ' mp-btn-highlight' : '') + '" id="moon-phase-update"><span>' + (_cachedUpdateInfo ? '⬇ 发现新版本' : '🔄 检查版本更新') + '</span><small>连不通会自动换镜像</small></button><button class="mp-btn" id="moon-phase-faq"><span>❓ 帮助与说明</span><small>一个问题一句话，先搜这里</small></button></div></details></div></section>' +
      '<div class="mp-status" id="moon-phase-status">' + SYSTEM_UI_NAME + ' 准备就绪。</div></div>';

    panel._lcdStateTimer = setInterval(function() {
      if (!panel.isConnected) { clearInterval(panel._lcdStateTimer); panel._lcdStateTimer = null; return; }
      const latest = readMvuLatest();
      const latestStat = latest && latest.stat_data || {};
      const timeEl = panel.querySelector('.mp-lcd-world-time');
      if (timeEl) timeEl.textContent = '世界时间　' + String((latestStat.世界 && latestStat.世界.时间) || '等待游戏时间');
      const selectedName = panel.dataset.lcdCharacter || '';
      const latestCharacter = latestStat.角色 && latestStat.角色[selectedName];
      const characterView = panel.querySelector('.mp-lcd-character-view');
      if (characterView) characterView.innerHTML = renderLcdCharacterDetails(latestCharacter);
      const eventView = panel.querySelector('#moon-event-status');
      if (eventView) eventView.innerHTML = renderEventStatusCard();
    }, 2500);
    bindLcdPageControls(panel);
    panel.querySelector('#moon-phase-close').addEventListener('click', closePanel);
    panel.querySelector('#moon-phase-tutorial').addEventListener('click', function() { openTutorialDialog(panel); });
    const tutBtn2 = panel.querySelector('#moon-phase-tutorial-btn');
    if (tutBtn2) tutBtn2.addEventListener('click', function() { openTutorialDialog(panel); });
    const quickStartBtn = panel.querySelector('#moon-quick-start');
    if (quickStartBtn) quickStartBtn.addEventListener('click', function() { openUnifiedAdaptDialog(panel); });
    const headerApiBtn = panel.querySelector('#moon-header-api-btn');
    if (headerApiBtn) headerApiBtn.addEventListener('click', function() { openCustomAIConfigDialog(panel); });

    panel.querySelectorAll('[data-display-mode]').forEach(function(button) {
      button.addEventListener('click', function() {
        const nextMode = button.getAttribute('data-display-mode') === 'arcade' ? 'arcade' : 'system';
        if (nextMode === panel.dataset.displayMode) return;
        panel.dataset.displayMode = nextMode;
        renderPanel(panel);
      });
    });
    if (isArcadeMode) {
      const lcdCard = panel.querySelector('.mp-lcd-card');
      if (lcdCard) panel._lcdArcadeStop = mountArcadeRunner(lcdCard, { standalone: true, difficulty: selectedLevel });
    }
    const menuHome = panel.querySelector('#moon-menu-home');
    const menuPage = panel.querySelector('#moon-menu-page');
    const menuTitles = { adventure: '开始游戏', characters: '角色与存档', timeline: '冒险日志', system: '系统检修', settings: '系统选项' };
    panel.querySelectorAll('[data-menu-open]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const key = btn.getAttribute('data-menu-open');
        panel.dataset.activeMenuKey = key;
        menuHome.style.display = 'none';
        menuPage.style.display = 'block';
        const title = panel.querySelector('#moon-menu-page-title');
        if (title) title.textContent = menuTitles[key] || '功能';
        panel.querySelectorAll('.mp-subpage-tab').forEach(function(t) {
          t.classList.toggle('active', t.getAttribute('data-menu-open') === key);
        });
        panel.querySelectorAll('.mp-menu-subpage').forEach(function(page) {
          page.style.display = page.getAttribute('data-menu-page') === key ? 'block' : 'none';
        });
      });
    });
    panel.querySelector('#moon-menu-back').addEventListener('click', function() {
      panel.dataset.activeMenuKey = '';
      menuPage.style.display = 'none';
      menuHome.style.display = 'block';
    });
    if (panel.dataset.menuKeysBound !== '1') {
      panel.dataset.menuKeysBound = '1';
      panel.addEventListener('keydown', function(event) {
        if ((event.key === 'Escape' || event.key === 'Backspace') && menuPage.style.display !== 'none') {
          event.preventDefault();
          panel.querySelector('#moon-menu-back').click();
        }
      });
    }
const _badgeEl = panel.querySelector('#moon-version-badge');
if (_badgeEl) {
  _badgeEl.addEventListener('click', function() {
    if (_cachedUpdateInfo) {
      showUpdateAvailableDialog(_cachedUpdateInfo);
      return;
    }
    const cfg = getUpdateConfig();
    if (!cfg.url) { openUpdateConfigDialog(panel); return; }
    checkForUpdates(false);
  });
}

panel.querySelector('#moon-phase-update').addEventListener('click', function() {
  if (_cachedUpdateInfo) { showUpdateAvailableDialog(_cachedUpdateInfo); return; }
  const cfg = getUpdateConfig();
  if (!cfg.url) openUpdateConfigDialog(panel);
  else checkForUpdates(false);
});
    if (panel.dataset.modeButtonsBound !== '1') {
      panel.dataset.modeButtonsBound = '1';
      panel.addEventListener('click', function(event) {
        const btn = event.target && event.target.closest ? event.target.closest('.mp-mode-btn') : null;
        if (!btn || !panel.contains(btn)) return;
        if (panel.dataset.displayMode === 'arcade') {
          const nextArcadeDifficulty = btn.getAttribute('data-mode') || 'normal';
          if (nextArcadeDifficulty === (panel.dataset.arcadeDifficulty || 'normal')) return;
          panel.dataset.arcadeDifficulty = nextArcadeDifficulty;
          renderPanel(panel);
          return;
        }
        const s2 = getSettings(); s2.mode = btn.getAttribute('data-mode'); saveSettings(s2); refreshPanel();
      });
    }
    const lcdCharacterSelect = panel.querySelector('.mp-lcd-character-select');
    if (lcdCharacterSelect) {
      lcdCharacterSelect.addEventListener('change', function() {
        panel.dataset.lcdCharacter = lcdCharacterSelect.value;
        const data = readMvuLatest();
        const character = data && data.stat_data && data.stat_data.角色 && data.stat_data.角色[lcdCharacterSelect.value];
        const view = panel.querySelector('.mp-lcd-character-view');
        if (view) view.innerHTML = renderLcdCharacterDetails(character);
      });
    }
    panel.querySelector('#moon-phase-antisl').addEventListener('click', function() {
      if (loadAnchor()) { toast('世界线已锚定 · 只能通过开启新对话解除', 'warning'); return; }
      const s2 = getSettings(); s2.antisl = !(s2.antisl === true); saveSettings(s2); refreshPanel();
    });
    panel.querySelector('#moon-phase-extramodel').addEventListener('click', function() { openCustomAIConfigDialog(panel); });
    panel.querySelector('#moon-phase-cardmode').addEventListener('click', function() { const s2 = getSettings(); s2.cardMode = (s2.cardMode === 'multi') ? 'single' : 'multi'; saveSettings(s2); refreshPanel(); });
    panel.querySelector('#moon-phase-safetylock').addEventListener('click', function() { const s2 = getSettings(); s2.safetyLock = !getSafetyLock(); saveSettings(s2); refreshPanel(); });
    panel.querySelector('#moon-phase-autobootstrap').addEventListener('click', function() { const s2 = getSettings(); s2.autoBootstrap = (s2.autoBootstrap === false); saveSettings(s2); if (s2.autoBootstrap) { setTimeout(function() { autoBootstrapCharacter('first-reply'); }, 120); } refreshPanel(); });
    panel.querySelector('#moon-phase-pacing').addEventListener('click', function() { const s2 = getSettings(); const cur = getEventPacing(); const next = cur === 'Adi' ? 'And' : (cur === 'And' ? 'All' : 'Adi'); s2.eventPacing = next; saveSettings(s2); refreshPanel(); });
    panel.querySelector('#moon-phase-fanfic').addEventListener('click', function() { const cur = getFanficEnhance(); setFanficEnhance(!cur); refreshPanel(); });
    panel.querySelector('#moon-phase-countdown').addEventListener('click', function() { const actions = checkAllCountdowns(); const statusEl = panel.querySelector('#moon-phase-status'); if (actions.length === 0) statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 巡检完成：暂无到期周期节点。</span>'; else { let html = '<b style="color:#fde047">⚡ 捕捉到 ' + actions.length + ' 个到期节点：</b><br>'; actions.forEach(function(a) { html += '<span style="color:#93c5fd">[' + a.type + ']</span> ' + a.char + '<br>'; }); statusEl.innerHTML = html; } });
    panel.querySelector('#moon-phase-selfcheck').addEventListener('click', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#f472d0">⏳ 运行自检...</span>'; const html = await runSelfCheckWithArcade(); statusEl.innerHTML = '<span style="color:#f9a8d4">✔ 自检完成。</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 自检报告', html); });
    panel.querySelector('#moon-phase-simtest').addEventListener('click', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#93c5fd">⏳ 运行测试...</span>'; const html = await runSimulationTest(); statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 测试完成。</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 测试结果', html); });
    panel.querySelector('#moon-phase-conflict').addEventListener('click', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#93c5fd">⏳ 扫描冲突...</span>'; const result = await runConflictScan(); statusEl.innerHTML = result.hasConflict ? '<span style="color:#fbbf24">⚠ 发现冲突</span>' : '<span style="color:#6ee7b7">✔ 未发现冲突</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 冲突扫描', result.html); });
    panel.querySelector('#moon-phase-reroll').addEventListener('click', function() { openRerollDialog(panel); });
    panel.querySelector('#moon-phase-pack-migrate').addEventListener('click', function() { startMigrationPack(panel); });
    panel.querySelector('#moon-phase-bio').addEventListener('click', function() { openAuditionMainDialog(panel); });
    const rosterBtn = panel.querySelector('#moon-phase-roster');
    if (rosterBtn) rosterBtn.addEventListener('click', function() { openCharacterRosterDialog(panel); });
    panel.querySelector('#moon-phase-bio-lib').addEventListener('click', function() { openBioLibraryDialog(panel); });
    panel.querySelector('#moon-phase-user-bio').addEventListener('click', function() { openUserAuditionMainDialog(panel); });
    panel.querySelector('#moon-phase-user-bio-lib').addEventListener('click', function() { openUserBioLibraryDialog(panel); });
    panel.querySelector('#moon-phase-gallery').addEventListener('click', function() { openMemoryGalleryDialog(); });
    panel.querySelector('#moon-phase-ending').addEventListener('click', function() { manualTriggerEnding(panel); });
    panel.querySelector('#moon-phase-prompt-edit').addEventListener('click', function() { openPromptEditor(panel); });
    panel.querySelector('#moon-phase-custom-ai').addEventListener('click', function() { openCustomAIConfigDialog(panel); });
    panel.querySelector('#moon-phase-image-settings').addEventListener('click', function() { openImageGenerationSettingsDialog(panel); });
    panel.querySelector('#moon-phase-faq').addEventListener('click', openFaqDialog);
    panel.querySelector('#moon-phase-adapt').addEventListener('click', function() { openUnifiedAdaptDialog(panel); });
    panel.querySelector('#moon-phase-ai-detect').addEventListener('click', function() { openAiConflictDialog(panel); });
    panel.querySelector('#moon-token-refresh').addEventListener('click', function() { refreshTokenCard(panel); });
    setTimeout(function() { try { refreshTokenCard(panel); } catch (e) {} }, 120);
    panel.querySelector('#moon-phase-scan-timeline').addEventListener('click', function() { openScanTimelineDialog(panel); });
    panel.querySelector('#moon-phase-tl-gen').addEventListener('click', function() { openTimelineGeneratorDialog(panel); });
    if (panel.querySelector('#moon-phase-tl-list')) panel.querySelector('#moon-phase-tl-list').addEventListener('click', function() { openTimelineManagerDialog(panel); });
    panel.querySelector('#moon-phase-manual-tl').addEventListener('click', function() { openManualTimelineInputDialog(panel); });
    panel.querySelector('#moon-phase-tl-tag').addEventListener('click', function() { openTimelineTagDialog(panel); });
  }
  /* ───────────────────────────────────────────────────────── */
  async function runSelfCheck() {
    const lines = [];
    let _nFail = 0, _nWarn = 0;
    const ok = function(s) { lines.push('<span style="color:#6ee7b7">✔</span> ' + s); };
    const warn = function(s) { _nWarn++; lines.push('<span style="color:#fbbf24">⚠</span> ' + s); };
    const info = function(s) { lines.push('<span style="color:#93c5fd">ℹ</span> ' + s); };
    const fail = function(s) { _nFail++; lines.push('<span style="color:#f87171">✖</span> ' + s); };
    lines.push('<div class="mp-log-subhead">── 现在用的版本 ──</div>');
    info('版本：' + MOON_FORMULA_VERSION);
    info('UI 名称：' + SYSTEM_UI_NAME);
    info('特殊标签：Sylveina');
    info('卡组模式：' + (getCardMode() === 'multi' ? '多人卡' : '单人卡'));
    info('自动建档：' + (getSettings().autoBootstrap === false ? 'OFF（要手动点开局适配）' : 'ON（对面首条回复后自动立档）'));
    const pacingName = { Adi: 'Adagio · 柔板', And: 'Andante · 行板', All: 'Allegro · 快板' }[getEventPacing()] || getEventPacing();
    info('推进节奏：' + pacingName);
    info('同人台词补强：' + (getFanficEnhance() ? 'ON' : 'OFF'));
    info('安全锁：' + (getSafetyLock() ? '🔒 ON' : '⚠️ OFF'));
    info('锚定：' + (getAntiSL() ? '🔒 ON' : '⚠️ OFF'));
    info('当前难度：' + (LUNAR_META[getCurrentMode()]?.name || getCurrentMode()));

lines.push('<div class="mp-log-subhead">── 档案存在哪 ──</div>');
    const stateKey = getChatStateKey();
    const localRaw = (getStorage() || localStorage).getItem(stateKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        const charCount = Object.keys(parsed.stat_data && parsed.stat_data.角色 || {}).filter(function(k) { return !isCharSkeleton(parsed.stat_data.角色[k]); }).length;
        ok('档案已经存好了 · 角色数: ' + charCount);
        const worldTime = parsed.stat_data && parsed.stat_data.世界 && parsed.stat_data.世界.时间;
        if (worldTime) info('世界时间：' + worldTime);
      } catch (e) { fail('档案读不出来了：' + e.message); }
    } else { warn('还没有档案 —— 第一次玩的话这是正常的'); }
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && ctx.chatMetadata[stateKey]) ok('另外还存了一份备份（清缓存、换设备都不怕）');
      else warn('目前只有一份，聊几句再看一次更稳');
    } catch (e) { fail('备份读取失败'); }
    lines.push('<div class="mp-log-subhead">── 算分规则 ──</div>');
    info('暗号格式：' + (getCardMode() === 'multi' ? '[Sylveina|角色名|L/M/H|+/-|基础值]' : '[Sylveina|L/M/H|+/-|基础值]'));
    info('基础值区间：L=0.5~2.0 · M=3.0~5.0 · H=6.0~10.0');
    info('单次上限：' + MOON_FORMULA_PARAMS.singleCap + ' 点');
    info('周上限：简单 ' + MOON_FORMULA_PARAMS.weeklyCap.easy + ' / 普通 ' + MOON_FORMULA_PARAMS.weeklyCap.normal + ' / 困难 ' + MOON_FORMULA_PARAMS.weeklyCap.hard + ' / 地狱 ' + MOON_FORMULA_PARAMS.weeklyCap.hell);

    lines.push('<div class="mp-log-subhead">── 人设小抄 ──</div>');
    try {
      const bioLib = getBioLibrary();
      const bioList = Object.values(bioLib.bios || {});
      if (bioList.length === 0) info('角色小抄库为空');
      else { const enabledCount = bioList.filter(function(b) { return b.enabled === true; }).length; ok('角色小抄：共 ' + bioList.length + ' 份（启用 ' + enabledCount + ' 份）'); }
    } catch (e) { fail('小抄库读取失败：' + (e.message || e)); }
    try {
      const ubLib = getUserBioLibrary();
      const ubList = Object.values(ubLib.userBios || {});
      if (ubList.length === 0) info('玩家小抄库为空');
      else { const enabledCount = ubList.filter(function(b) { return b.enabled === true; }).length; ok('玩家小抄：共 ' + ubList.length + ' 份（启用 ' + enabledCount + ' 份）'); }
    } catch (e) { fail('玩家小抄库读取失败：' + (e.message || e)); }

    const curCard = getCurrentCardName();
    const bioStatus = getCurrentBioStatus();
    if (curCard && curCard !== '(未知卡牌)') {
      info('当前卡：' + curCard + ' · 启用小抄 ' + bioStatus.count + ' 份');
      if (bioStatus.count > 0) info('覆盖角色：' + bioStatus.charNames.join('、'));
    }
    lines.push('<div class="mp-log-subhead">── 相册与结局 ──</div>');
    try {
      const gallery = getGalleryList(), endings = getEndingArchive(), imageConfig = getImageGenConfig();
      info('当前聊天回忆：' + gallery.length + ' 项 · 已结算周目：' + endings.records.length + ' 次');
      info('图片渠道：' + String(imageConfig.imageProvider || 'pollinations').toUpperCase() + ' · 显影需手动点击');
      info('后日谈目标：' + (Number(getSettings().epilogueTargetWords) || 8000) + ' 字');
    } catch (e) { warn('回忆档案尚未初始化'); }
    const verdict = _nFail ? ('✖ 有 ' + _nFail + ' 项不正常 —— 请把下面整段截图发帖')
      : (_nWarn ? ('⚠ 能用，但有 ' + _nWarn + ' 项要注意') : '✔ 一切正常，可以放心玩');
    const verdictHtml = '<div style="padding:9px 11px;border-radius:9px;margin-bottom:10px;font-size:12px;font-weight:800;line-height:1.6;background:' +
      (_nFail ? 'rgba(248,113,113,0.14);border:1px solid rgba(248,113,113,0.45);color:#fca5a5;' :
       _nWarn ? 'rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.4);color:#fde68a;' :
                'rgba(110,231,183,0.12);border:1px solid rgba(110,231,183,0.4);color:#6ee7b7;') + '">' + verdict +
      '<div style="font-size:10.5px;font-weight:400;opacity:.85;margin-top:3px;">下面这些是给排查用的细节，看不懂没关系。</div></div>';
    return verdictHtml + lines.join('<br>');
  }

  async function runSelfCheckWithArcade() {
    let seen = false;
    try { seen = mainWin.localStorage.getItem(SELF_CHECK_ARCADE_SEEN_KEY) === '1'; } catch (e) {}
    if (seen) return await runSelfCheck();
    try { mainWin.localStorage.setItem(SELF_CHECK_ARCADE_SEEN_KEY, '1'); } catch (e) {}
    showLoadingDialog('首次系统自检 · 正在启动像素扫描…', true);
    await sleep(1400);
    try { return await runSelfCheck(); }
    finally { closeLoadingDialog(); }
  }

  async function runSimulationTest() {
    const lines = [];
    let _nFail = 0, _nWarn = 0;
    lines.push('<b style="color:#6ee7b7">🧪 ' + SYSTEM_UI_NAME + ' · 综合测试</b><br>');
    lines.push('<span style="color:#94a3b8;font-size:10px;">测试使用假数据 (Amore: E5/P2/R1/I0)，不污染真实变量</span><br>');

    lines.push('<div class="mp-log-subhead">【测试1】时间解析</div>');
    const t1 = parseGameTime('2026年10月15日 · 星期四 · 14:30');
    const t2 = parseGameTime('2016年4月5日下午2点30分');
    if (t1 && t2 && t2.getHours() === 14) lines.push('✔ 时间解析正确');
    else lines.push('✖ 时间解析异常');

    lines.push('<div class="mp-log-subhead">【测试2】Sylveina 标签解析（含全角括号兼容）</div>');
    const mockMes1 = "剧情推演。\n[Sylveina|L|+|1.2]";
    const mockMes2 = "剧情推演。\n〔Sylveina|M|+|3.5〕";
    const tTag1 = extractSylveinaTag(mockMes1);
    const tTag2 = extractSylveinaTag(mockMes2);
    if (tTag1 && tTag1.level === 'L' && tTag1.baseValue === 1.2 && tTag2 && tTag2.level === 'M' && tTag2.baseValue === 3.5) {
      lines.push('✔ 标准标签与全角〔Sylveina|M|+|3.5〕提取均正常');
    } else {
      lines.push('✖ 标签提取失败');
    }

    lines.push('<div class="mp-log-subhead">【测试3】公式仿真 (Amore 5210 + L+1.2)</div>');
    try {
      const mockAmore = { 好感度: 5, 肉体值: 2, 阶段值: 1, 嫉妒值: 0, _quota: { R阶段门: false, 好感度周上限已用: 0 } };
      const mockLastRoll = { 事件类型: '日常', 方向: '正向', 主维度: 'E', 基础值: 1.2 };
      const result = computeCharDelta(mockAmore, mockLastRoll, 'normal');
      if (result) lines.push('✔ 公式计算成功 · E从 ' + result.oldValue + ' 变为 ' + result.newValue + '（Δ=' + result.delta + '）');
      else lines.push('✖ 公式计算返回 null');
    } catch (e) { lines.push('✖ 公式仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试4】公式仿真 (Amore 5210 + H+8.0)</div>');
    try {
      const mockAmore2 = { 好感度: 5, 肉体值: 2, 阶段值: 1, 嫉妒值: 0, _quota: { R阶段门: false, 好感度周上限已用: 0 } };
      const mockLastRoll2 = { 事件类型: '重大', 方向: '正向', 主维度: 'E', 基础值: 8.0 };
      const result2 = computeCharDelta(mockAmore2, mockLastRoll2, 'normal');
      if (result2 && result2.delta !== 0) lines.push('✔ 重大事件计算成功 · Δ=' + result2.delta + '（应被单次上限压缩）');
      else lines.push('✖ 重大事件计算失败');
    } catch (e) { lines.push('✖ 公式仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试5】阶段门仿真</div>');
    try {
      const mockCh = { 好感度: 19, 肉体值: 0, 阶段值: 0, 嫉妒值: 0, _quota: { R阶段门: false }, _lastRoll: {} };
      const res = processGateForChar('模拟角色', mockCh, '2000年01月01日 · 星期六 · 00:00', 'normal');
      if (res && res.type === 'gate_enter' && res.node === 18) lines.push('✔ E=19 触发破门期成功');
      else lines.push('✖ 阶段门未正确触发');
    } catch (e) { lines.push('✖ 阶段门仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试6】事件导演推进</div>');
    try {
      const pacing = getEventPacing();
      const rules = { Adi: { daily: 8, major: 15, cd: 3 }, And: { daily: 5, major: 10, cd: 3 }, All: { daily: 3, major: 5, cd: 3 } };
      const rule = rules[pacing] || rules.And;
      const mockEventState = { 当前事件: '测试事件', 事件类型: '日常', 剩余回合: 2, 冷却回合: 0 };
      mockEventState.剩余回合 -= 1;
      if (mockEventState.剩余回合 === 1) lines.push('✔ 事件推进仿真正确');
      mockEventState.剩余回合 -= 1;
      if (mockEventState.剩余回合 <= 0) { mockEventState.当前事件 = ''; mockEventState.冷却回合 = rule.cd; }
      if (mockEventState.冷却回合 === rule.cd) lines.push('✔ 事件结束进入冷却');
      else lines.push('✖ 事件结束仿真失败');
    } catch (e) { lines.push('✖ 事件导演仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试7】LocalStorage 快照归档与回滚</div>');
    try {
      const mockSnapshots = [{ E: 5, P: 2, R: 1, I: 0 }, { E: 6, P: 2, R: 1, I: 0 }, { E: 7, P: 3, R: 1, I: 1 }];
      const lastState = mockSnapshots.pop();
      if (mockSnapshots.length === 2 && mockSnapshots[1].E === 6) lines.push('✔ 快照归档(3份)与重Roll回滚逻辑正常');
      else lines.push('✖ 快照回滚逻辑异常');
    } catch (e) { lines.push('✖ 快照仿真异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试8】核心函数存在性</div>');
    try {
      if (typeof computeCharDelta === 'function') lines.push('✔ computeCharDelta 已定义');
      else lines.push('✖ computeCharDelta 缺失');
      if (typeof runMoonCalculation === 'function') lines.push('✔ runMoonCalculation 已定义');
      else lines.push('✖ runMoonCalculation 缺失');
      if (typeof extractSylveinaTag === 'function') lines.push('✔ extractSylveinaTag 已定义');
      else lines.push('✖ extractSylveinaTag 缺失');
      if (typeof loadLocalState === 'function') lines.push('✔ loadLocalState 已定义');
      else lines.push('✖ loadLocalState 缺失');
      if (typeof saveLocalState === 'function') lines.push('✔ saveLocalState 已定义');
      else lines.push('✖ saveLocalState 缺失');
    } catch (e) { lines.push('✖ 函数存在性检查异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试9】后台变量块摄入（世界时间 / 心声 / 情绪）</div>');
    try {
      const mockStat = {
        世界: { 时间: '2000年01月01日 · 星期六 · 00:00', 地点: '教室', _内部流逝天数: 0, _上次推进时间: '2000年01月01日 · 星期六 · 00:00' },
        角色: { '长谷川茗': { 好感度: 10, 肉体值: 0, 阶段值: 0, 嫉妒值: 0, 情绪: '😐', 心声: '……', 在场: true, 重要度: '主要' } }
      };
      const mockMes = '她笑了笑。\n[Sylveina|L|+|1.5]\ns\n角色.长谷川茗.情绪=😄\n角色.长谷川茗.心声=今天真开心。\n世界.时间=2000年01月02日 · 星期日 · 21:30';
      const res = ingestBackendVariables(mockMes, mockStat);
      const okTime = String(mockStat.世界.时间).indexOf('01月02日') >= 0;
      const okVoice = String(mockStat.角色['长谷川茗'].心声).indexOf('开心') >= 0;
      const okEmoji = String(mockStat.角色['长谷川茗'].情绪) === '😄';
      const okStrip = String(res.text).indexOf('角色.长谷川茗.心声') < 0 && String(res.text).indexOf('世界.时间') < 0;
      if (okTime && okVoice && okEmoji && okStrip) lines.push('✔ 时间 / 心声 / 情绪 均被写入，且已从正文清理');
      else lines.push('✖ 后台变量摄入不完整：时间' + okTime + ' 心声' + okVoice + ' 情绪' + okEmoji + ' 清理' + okStrip);
    } catch (e) { lines.push('✖ 后台变量摄入异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试10】多人卡标签隔离</div>');
    try {
      const mockChars = {
        '甲': { 好感度: 5, 肉体值: 0, 阶段值: 0, 嫉妒值: 0, 在场: true, 重要度: '主要' },
        '乙': { 好感度: 5, 肉体值: 0, 阶段值: 0, 嫉妒值: 0, 在场: true, 重要度: '次要' }
      };
      const named = extractAllSylveinaTags('[Sylveina|乙|M|+|3.5]');
      const plain = extractAllSylveinaTags('[Sylveina|L|+|1.0]');
      const primary = pickPrimaryTarget(mockChars, Object.keys(mockChars));
      const hitB = matchTagForCharacter(named, '乙', 2, primary);
      const missA = matchTagForCharacter(named, '甲', 2, primary);
      const plainOnlyPrimary = matchTagForCharacter(plain, '甲', 2, primary) && !matchTagForCharacter(plain, '乙', 2, primary);
      if (hitB && !missA && plainOnlyPrimary) lines.push('✔ 具名标签只结算本人，无名标签只结算主目标（' + primary + '）');
      else lines.push('✖ 标签归属异常：具名=' + !!hitB + ' 越界=' + !!missA + ' 无名隔离=' + !!plainOnlyPrimary);
    } catch (e) { lines.push('✖ 标签隔离测试异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试11】相对时间兜底（次日 / 三天后）</div>');
    try {
      const d1 = detectRelativeElapsedDays('次日清晨，她推开了门。');
      const d2 = detectRelativeElapsedDays('三天后，演出如期而至。');
      const d3 = detectRelativeElapsedDays('她轻轻点头，什么也没说。');
      if (d1 === 1 && d2 === 3 && d3 === 0) lines.push('✔ 相对时间换算正确（1 / 3 / 0 天）');
      else lines.push('✖ 相对时间换算异常：' + d1 + ' / ' + d2 + ' / ' + d3);
    } catch (e) { lines.push('✖ 相对时间测试异常：' + (e.message || e)); }

    lines.push('<br><b style="color:#6ee7b7">✨ 综合测试完毕，本地化引擎运转正常。</b>');
    return lines.join('<br>');
  }

  async function runConflictScan() {
    const lines = [];
    const ok = function(s) { lines.push('<span style="color:#6ee7b7">✔</span> ' + s); };
    const warn = function(s) { _nWarn++; lines.push('<span style="color:#fbbf24">⚠</span> ' + s); };
    const info = function(s) { lines.push('<span style="color:#93c5fd">ℹ</span> ' + s); };
    const bad = function(s) { lines.push('<span style="color:#f87171">✖</span> ' + s); };
    let hasConflict = false;
    let fatalCount = 0;
    lines.push('<b style="color:#93c5fd">🔍 全环境冲突扫描</b>');

const stateKey = getChatStateKey();
    const localRaw = (getStorage() || localStorage).getItem(stateKey);
    if (localRaw) { try { JSON.parse(localRaw); ok('LocalStorage 数据结构合法'); } catch (e) { bad('LocalStorage 数据损坏'); fatalCount++; } }
    else warn('LocalStorage 尚无数据');

    lines.push('<div class="mp-log-subhead">── 世界书条目检查 ──</div>');
    let entries = [];
    try { entries = await getAllWorldbookEntries(); } catch (e) {}
    const modeTitleMap = {};
    for (const e of entries) { if (e.title.indexOf('[Mode-') === 0) { if (!modeTitleMap[e.title]) modeTitleMap[e.title] = []; modeTitleMap[e.title].push(e.bookName); } }
    let dup = false;
    for (const t in modeTitleMap) { if (modeTitleMap[t].length > 1) { bad('条目「' + t + '」重复'); dup = true; hasConflict = true; } }
    if (!dup) ok('没有 [Mode-] 条目重复');

    lines.push('<div class="mp-log-subhead">── 标签格式检查 ──</div>');
    info('当前标签格式：' + (getCardMode() === 'multi' ? '[Sylveina|角色名|L/M/H|+/-|基础值]' : '[Sylveina|L/M/H|+/-|基础值]'));
    info('数值全由掌机自己算；AI 只负责报时间和她心里的想法，这些玩家看不到');

    lines.push('<div class="mp-log-subhead">📋 总结</div>');
    if (fatalCount > 0) bad('发现 ' + fatalCount + ' 项致命冲突');
    else if (hasConflict) warn('发现若干可修复的冲突');
    else ok('未发现明显冲突');
    return { hasConflict: hasConflict || fatalCount > 0, html: lines.join('<br>') };
  }
  /* ───────────────────────────────────────────────────────── */
  async function computeTokenBreakdown() {
    const out = { sys: [], sysTotal: 0, charCard: 0, charCardName: '', moonEntries: 0, moonEntriesCount: 0, timeline: 0, timelineCount: 0, preset: 0, presetName: '', worldbook: 0, worldbookCount: 0, grand: 0 };
    const ctx = getSTCtx();
    try {
      const ep = mainWin.extension_prompts || window.extension_prompts || (function() { try { return ctx && ctx.extensionPrompts; } catch(e) { return null; } })();
      if (ep && typeof ep === 'object') {
        for (const k in ep) {
          if (k.indexOf('moon_phase') !== 0) continue;
          const v = ep[k];
          const content = String((v && (v.value !== undefined ? v.value : v.content)) || '');
          if (!content) continue;
          const t = estimateTokens(content);
          let short = k;
          if (k === 'moon_phase_time_tracker') short = '主体';
          else if (k === 'moon_phase_user_bio_injected') short = '玩家小抄';
          else if (k.indexOf('moon_phase_time_tracker_') === 0) short = k.slice('moon_phase_time_tracker_'.length);
          out.sys.push({ key: short, tokens: t });
          out.sysTotal += t;
        }
      }
    } catch (e) {}
    try {
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) { out.charCardName = ch.name || ''; const parts = [ch.description, ch.personality, ch.scenario, ch.first_mes, ch.mes_example, ch.creator_notes].filter(function(x) { return x && typeof x === 'string'; }).join('\n'); out.charCard = estimateTokens(parts); }
      }
    } catch (e) {}
    try {
      const books = await _collectAllWorldbooks();
      for (const e of books) {
        const t = estimateTokens(e.content);
        const title = e.title || '';
        if (title.indexOf('[Mode-') === 0 || title.indexOf('[Initvar]') === 0) { out.moonEntries += t; out.moonEntriesCount++; }
        else if (title.indexOf('[Timeline]') === 0 || title.indexOf('[WorldTimeline]') === 0) { out.timeline += t; out.timelineCount++; }
        else { out.worldbook += t; out.worldbookCount++; }
      }
    } catch (e) {}
    try {
      let presetText = ''; let presetName = '';
      const s = (ctx && ctx.chatCompletionSettings) || null;
      if (s) {
        ['main_prompt','system_prompt','jailbreak_prompt','post_history_instructions','nsfw_prompt','new_chat_prompt','new_group_chat_prompt','new_example_chat_prompt'].forEach(function(f) { if (typeof s[f] === 'string' && s[f]) presetText += s[f] + '\n'; });
        presetName = String(s.preset_settings_openai || s.preset || '');
      }
      try {
        if (ctx && typeof ctx.getPresetManager === 'function') {
          const pm = ctx.getPresetManager();
          if (pm) {
            if (!presetName) { if (typeof pm.getSelectedPresetName === 'function') presetName = pm.getSelectedPresetName() || ''; else if (pm.selectedPresetName) presetName = pm.selectedPresetName; }
            if (!presetText && typeof pm.getPresetList === 'function') {
              const list = pm.getPresetList(); const presets = (list && list.presets) || null;
              if (presets && presetName && presets[presetName]) { const p = presets[presetName]; ['main_prompt','system_prompt','jailbreak_prompt','post_history_instructions','nsfw_prompt'].forEach(function(f) { if (typeof p[f] === 'string' && p[f]) presetText += p[f] + '\n'; }); }
            }
          }
        }
      } catch (e) {}
      out.preset = estimateTokens(presetText); out.presetName = presetName;
    } catch (e) {}
    out.grand = out.sysTotal + out.charCard + out.moonEntries + out.timeline + out.preset + out.worldbook;
    return out;
  }

  async function refreshTokenCard(panel) {
    const box = panel.querySelector('#moon-token-box');
    if (!box) return;
    box.innerHTML = '<span style="color:#94a3b8;">⏳ 正在算…</span>';
    try {
      const r = await computeTokenBreakdown();
      const lines = [];
      lines.push('<div style="font-size:10.5px;line-height:1.9;">');
      if (r.charCard > 0) lines.push('<div style="color:#94a3b8;">她的角色卡' + (r.charCardName ? '（' + String(r.charCardName).replace(/</g,'&lt;') + '）' : '') + ': <span style="color:#a5f3fc;">' + _fmtK(r.charCard) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">掌机自己占的: <span style="color:#6ee7b7;">' + _fmtK(r.sysTotal) + '</span></div>');
      r.sys.forEach(function(item) { lines.push('<div style="color:#64748b;padding-left:12px;">· ' + item.key + ': <span style="color:#94a3b8;">' + _fmtK(item.tokens) + '</span></div>'); });
      lines.push('<div style="color:#94a3b8;">世界设定条目: <span style="color:#c084fc;">' + _fmtK(r.moonEntries) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">时间表: <span style="color:#f9a8d4;">' + _fmtK(r.timeline) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">你的全局设置' + (r.presetName ? '（' + String(r.presetName).replace(/</g,'&lt;') + '）' : '') + ': <span style="color:#fbbf24;">' + _fmtK(r.preset) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">其他设定: <span style="color:#fda4af;">' + _fmtK(r.worldbook) + '</span></div>');
      lines.push('<div style="border-top:1px dashed rgba(148,163,184,0.25);margin:6px 0;"></div>');
      lines.push('<div style="color:#fde047;font-weight:700;">加起来: <span style="color:#fde047;">' + _fmtK(r.grand) + '</span></div>');
      lines.push('</div>');
      box.innerHTML = lines.join('');
    } catch (e) { box.innerHTML = '<span style="color:#f87171">✖ 算不出来：' + String(e && e.message || e).replace(/</g, '&lt;') + '</span>'; }
  }

  // 手动改角色定位（主要 / 次要 / NPC），并支持修正世界时间与内心话
  async function setCharImportance(name, importance, opts) {
    opts = opts || {};
    const data = readMvuLatest();
    const chars = data && data.stat_data && data.stat_data.角色;
    if (!chars || !chars[name]) return false;
    const v = String(importance || '').trim();
    if (['主要', '次要', 'NPC'].indexOf(v) < 0) return false;
    chars[name].重要度 = v;
    if (opts.presence !== undefined) chars[name].在场 = opts.presence === true;
    if (opts.voice !== undefined && String(opts.voice).trim()) chars[name].心声 = String(opts.voice).trim().slice(0, 300);
    const ok = await writeMvuLatest(data.stat_data);
    if (ok) { try { injectEventPrompt(); } catch (e) {} try { refreshPanel(); } catch (e) {} }
    return ok;
  }

  function openCharacterRosterDialog(panel) {
    const data = readMvuLatest();
    const chars = (data && data.stat_data && data.stat_data.角色) || {};
    const names = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (!names.length) { showModalDialog('👥 角色定位', '<div style="line-height:1.8;">这个对话还没有角色档案。<br>先去 <b>▶ 开始游戏 → 🚀 开局适配</b> 点一下，建好再回来。</div>', null, { confirmText: '关闭' }); return; }
    const world = (data.stat_data && data.stat_data.世界) || {};
    const impOptions = function(cur) {
      return ['主要', '次要', 'NPC'].map(function(v) {
        return '<option value="' + v + '"' + (String(cur) === v ? ' selected' : '') + '>' + v + '</option>';
      }).join('');
    };
    const rows = names.map(function(n, i) {
      const ch = chars[n];
      const imp = String(ch.重要度 || '主要');
      const present = ch.在场 !== false;
      return '<div class="moon-roster-row" data-name="' + escapeFeatureHtml(n) + '" data-idx="' + i + '" style="padding:10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:9px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
        '<b style="font-size:12px;color:#f8fafc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeFeatureHtml(n) + '</b>' +
        '<span style="font-size:10px;color:#94a3b8;white-space:nowrap;">E' + (Number(ch.好感度) || 0) + ' P' + (Number(ch.肉体值) || 0) + ' R' + (Number(ch.阶段值) || 0) + ' I' + (Number(ch.嫉妒值) || 0) + '</span></div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
        '<select class="moon-roster-imp" data-idx="' + i + '" style="flex:1;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#0a0c16;color:#e2e8f0;font-size:11.5px;font-family:inherit;">' + impOptions(imp) + '</select>' +
        '<button type="button" class="moon-roster-presence" data-idx="' + i + '" data-on="' + (present ? '1' : '0') + '" style="padding:6px 10px;border-radius:6px;border:1px solid ' + (present ? 'rgba(110,231,183,0.5)' : 'rgba(148,163,184,0.3)') + ';background:' + (present ? '#052e20' : '#111827') + ';color:' + (present ? '#6ee7b7' : '#94a3b8') + ';font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">' + (present ? '在场' : '不在场') + '</button></div>' +
        '<input class="moon-roster-voice" data-idx="' + i + '" value="' + escapeFeatureHtml(ch.心声 || '') + '" placeholder="她心里在想什么（可以自己改）" style="width:100%;box-sizing:border-box;margin-top:6px;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.2);background:#0a0c16;color:#cbd5e1;font-size:11px;font-family:inherit;">' +
        '</div>';
    }).join('');
    const html = '<div style="padding:9px 11px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:9px;font-size:10.8px;line-height:1.7;color:#bae6fd;margin-bottom:10px;">' +
      '<b>「主要」= 你真正想攻略的人</b>（AI 会把感情戏都写给她）<br>「次要」= 会出现、能聊几句的配角　「NPC」= 只露个脸的路人<br>改完点下面的「保存」就生效，<b>不用重开存档</b>。<br>时间卡住、内心话不动，这一页也能顺手改掉。' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
      '<div style="flex:1.6;"><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">世界时间</div><input id="moon-roster-world-time" value="' + escapeFeatureHtml(world.时间 || '') + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:11px;font-family:inherit;"></div>' +
      '<div style="flex:1;"><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">地点</div><input id="moon-roster-world-place" value="' + escapeFeatureHtml(world.地点 || '') + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:11px;font-family:inherit;"></div></div>' +
      '<div style="max-height:46dvh;overflow-y:auto;padding-right:3px;">' + rows + '</div>';
    showModalDialog('👥 角色定位 · 顺便修时间和内心话', html, function() {
      const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
      const d = readMvuLatest();
      const stat = d && d.stat_data; if (!stat) return;
      if (!stat.角色) stat.角色 = {};
      const timeInput = mask.querySelector('#moon-roster-world-time');
      const placeInput = mask.querySelector('#moon-roster-world-place');
      if (!stat.世界) stat.世界 = { 时间: '', _内部流逝天数: 0, _上次推进时间: '' };
      if (timeInput) {
        const raw = String(timeInput.value || '').trim();
        const parsed = parseGameTime(raw);
        if (parsed) stat.世界.时间 = formatGameTime(parsed);
      }
      if (placeInput) stat.世界.地点 = String(placeInput.value || '').trim().slice(0, 60);
      mask.querySelectorAll('.moon-roster-row').forEach(function(row) {
        const name = row.getAttribute('data-name');
        const ch = stat.角色[name]; if (!ch) return;
        const sel = row.querySelector('.moon-roster-imp');
        if (sel) { const v = String(sel.value || ''); if (['主要', '次要', 'NPC'].indexOf(v) >= 0) ch.重要度 = v; }
        const pBtn = row.querySelector('.moon-roster-presence');
        if (pBtn) ch.在场 = pBtn.getAttribute('data-on') === '1';
        const vInput = row.querySelector('.moon-roster-voice');
        if (vInput) { const v = String(vInput.value || '').trim(); if (v) ch.心声 = v.slice(0, 300); }
      });
      writeMvuLatest(stat).then(function(ok) {
        if (ok) {
          toast('改好了，下一轮就生效', 'success');
          try { injectEventPrompt(); } catch (e) {}
          try { refreshPanel(); } catch (e) {}
        } else toast('写入失败', 'warning');
      });
    }, { confirmText: '保存', onOpen: function(mask) {
      mask.querySelectorAll('.moon-roster-presence').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const on = btn.getAttribute('data-on') === '1';
          const next = !on;
          btn.setAttribute('data-on', next ? '1' : '0');
          btn.textContent = next ? '在场' : '不在场';
          btn.style.borderColor = next ? 'rgba(110,231,183,0.5)' : 'rgba(148,163,184,0.3)';
          btn.style.background = next ? '#052e20' : '#111827';
          btn.style.color = next ? '#6ee7b7' : '#94a3b8';
        });
      });
    } });
  }

  function openRerollDialog(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色) { showModalDialog('🎲 数值重Roll', '<div>当前没有可用的角色数据。</div>', null, { confirmText: '关闭' }); return; }
    const chars = data.stat_data.角色;
    const charNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (!charNames.length) { showModalDialog('🎲 数值重Roll', '<div>没有角色可供重Roll。</div>', null, { confirmText: '关闭' }); return; }
    const html = '<div style="font-size:11.5px;color:#94a3b8;margin-bottom:8px;">给谁重摇？</div>' +
      '<select id="moon-reroll-char" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#05070e;color:#e2e8f0;font-size:12px;">' + charNames.map(function(n) { return '<option value="' + escapeFeatureHtml(n) + '">' + escapeFeatureHtml(n) + '</option>'; }).join('') + '</select>' +
      '<div id="moon-reroll-info" style="margin-top:12px;padding:10px;background:#05070e;border-radius:8px;font-size:11px;line-height:1.7;color:#cbd5e1;min-height:80px;">点下面「🎲 重Roll」开始</div>' +
      '<div id="moon-reroll-manual" style="display:none;margin-top:10px;padding:10px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);border-radius:8px;font-size:11px;color:#fde68a;">' +
        '<div style="margin-bottom:6px;">这一轮没找到 AI 的判定 → 你自己定一个：</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
        '<select id="moon-reroll-dir" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(251,191,36,0.35);background:#05070e;color:#e2e8f0;font-size:11px;font-family:inherit;"><option value="正向">正向</option><option value="负向">负向</option></select>' +
        '<select id="moon-reroll-dim" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(251,191,36,0.35);background:#05070e;color:#e2e8f0;font-size:11px;font-family:inherit;"><option value="E">好感 E</option><option value="P">肉体 P</option><option value="I">嫉妒 I</option></select>' +
        '<input id="moon-reroll-base" type="number" step="0.5" min="0" max="10" style="width:74px;padding:6px;border-radius:6px;border:1px solid rgba(251,191,36,0.35);background:#05070e;color:#e2e8f0;font-size:11px;font-family:inherit;"></div>' +
        '<div style="margin-top:6px;color:#a16207;line-height:1.6;">这只用于这次重摇，不会改掉剧情里已经发生的事。</div>' +
      '</div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;">' +
      '<button id="moon-reroll-do" style="flex:1;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🎲 重Roll</button>' +
      '<button id="moon-reroll-confirm" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(16,185,129,0.5);background:#052e20;color:#6ee7b7;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;" disabled>确认覆盖</button></div>' +
      '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">每点一次就重摇一次，可以一直摇到满意，再点「确认覆盖」。</div>';
    let pendingResult = null; const mode = getCurrentMode();
    function eventRangeOf(ch) {
      const es = (ch && ch._quota && ch._quota._eventState) || {};
      const type = String(es.事件类型 || '日常');
      if (type === '关键') return { evt: '关键', range: [3.0, 5.0] };
      if (type === '重大' || type === '彩蛋') return { evt: '重大', range: [6.0, 10.0] };
      return { evt: '日常', range: [0.5, 2.0] };
    }
    function tagRollForLatest(name) {
      const ext = extractBaseValueFromLatestAiMessage();
      if (!ext) return null;
      const tagName = String(ext.charName || '').trim();
      const validNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
      const primary = pickPrimaryTarget(chars, validNames);
      const hit = tagName && (tagName === name || name.indexOf(tagName) >= 0 || tagName.indexOf(name) >= 0);
      if (tagName && !hit) return null;
      if (!tagName && validNames.length > 1 && primary !== name) return null;
      return { 事件类型: ext.eventType || '日常', 方向: ext.direction || '正向', 主维度: ext.dimension || 'E', 基础值: Number(ext.value) || 0 };
    }
    showModalDialog('🎲 数值重Roll', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const sel = mask.querySelector('#moon-reroll-char'); const infoEl = mask.querySelector('#moon-reroll-info');
        const doBtn = mask.querySelector('#moon-reroll-do'); const confirmBtn = mask.querySelector('#moon-reroll-confirm');
        const manualBox = mask.querySelector('#moon-reroll-manual');
        const dirSel = mask.querySelector('#moon-reroll-dir'); const dimSel = mask.querySelector('#moon-reroll-dim'); const baseInput = mask.querySelector('#moon-reroll-base');
        function fillManual(name) {
          const ch = chars[name] || {};
          const r = eventRangeOf(ch);
          manualBox.style.display = 'none';
          if (baseInput) baseInput.value = String(Math.round((r.range[0] + Math.random() * (r.range[1] - r.range[0])) * 2) / 2);
          if (dimSel) dimSel.value = 'E';
          if (dirSel) dirSel.value = '正向';
          return r;
        }
        function showCurrent() {
          const name = sel.value; const ch = chars[name] || {}; const lr = ch._lastRoll || {};
          const rangeInfo = eventRangeOf(ch);
          const hasLr = !!lr.主维度;
          infoEl.innerHTML = '角色：<b style="color:#7dd3fc">' + escapeFeatureHtml(name) + '</b>　<span style="color:#64748b;">' + escapeFeatureHtml(String(ch.重要度 || '主要')) + (ch.在场 === false ? ' · 不在场' : '') + '</span><br>' +
            '当前：E' + (ch.好感度 || 0) + ' P' + (ch.肉体值 || 0) + ' R' + (ch.阶段值 || 0) + ' I' + (ch.嫉妒值 || 0) + '<br>' +
            '本轮判断：' + (hasLr
              ? '<span style="color:#6ee7b7">已记录</span>（' + escapeFeatureHtml(lr.事件类型 || '') + ' ' + escapeFeatureHtml(lr.方向 || '') + ' ' + escapeFeatureHtml(lr.主维度 || '') + ' 基础' + (lr.基础值 || 0) + (lr._applied ? '｜已结算' : '｜待结算') + '）'
              : '<span style="color:#fbbf24">无记录</span>（本楼层没有该角色的 Sylveina 标签，或已在其它楼层结算过）') + '<br>' +
            '<span style="color:#64748b;font-size:10.5px;">当前事件档位：' + rangeInfo.evt + ' · 基础值区间 ' + rangeInfo.range[0] + '~' + rangeInfo.range[1] + '</span>';
          if (!hasLr) { fillManual(name); manualBox.style.display = 'block'; }
          else manualBox.style.display = 'none';
          pendingResult = null; confirmBtn.disabled = true;
        }
        sel.addEventListener('change', showCurrent); showCurrent();
        doBtn.addEventListener('click', function() {
          const name = sel.value; const ch = chars[name] || {};
          let lastRoll = readLastRoll(ch);
          let source = 'AI 判定';
          if (!lastRoll || !lastRoll.主维度) { lastRoll = tagRollForLatest(name); source = '本楼层标签'; }
          if (!lastRoll || !lastRoll.主维度) {
            const r = eventRangeOf(ch);
            const base = Number(baseInput && baseInput.value);
            const useBase = (!isNaN(base) && base > 0) ? Math.min(10, base) : Math.round((r.range[0] + Math.random() * (r.range[1] - r.range[0])) * 2) / 2;
            lastRoll = { 事件类型: r.evt, 方向: (dirSel && dirSel.value === '负向') ? '负向' : '正向', 主维度: (dimSel && dimSel.value) || 'E', 基础值: useBase };
            source = '人工补判';
          }
          const clone = JSON.parse(JSON.stringify(ch));
          const snap = clone._quota && clone._quota._preRollSnapshot;
          if (snap && typeof snap === 'object') {
            if (snap.好感度 !== undefined) clone.好感度 = snap.好感度;
            if (snap.肉体值 !== undefined) clone.肉体值 = snap.肉体值;
            if (snap.阶段值 !== undefined) clone.阶段值 = snap.阶段值;
            if (snap.嫉妒值 !== undefined) clone.嫉妒值 = snap.嫉妒值;
            if (clone._quota && snap.好感度周上限已用 !== undefined) clone._quota.好感度周上限已用 = snap.好感度周上限已用;
          }
          const result = computeCharDelta(clone, lastRoll, mode);
          if (!result) { infoEl.innerHTML = '<span style="color:#f87171">✖ 计算失败，请检查 _lastRoll 字段。</span>'; return; }
          pendingResult = {
            name: name,
            fieldName: result.fieldName,
            dimension: result.dimension,
            newValue: result.newValue,
            newWeeklyUsed: clone._quota ? clone._quota.好感度周上限已用 : undefined,
            lastRoll: lastRoll
          };
          infoEl.innerHTML = '角色：<b style="color:#7dd3fc">' + escapeFeatureHtml(name) + '</b><br><b style="color:#6ee7b7">重Roll结果：</b>（来源：' + source + '）<br>' +
            '本轮判断：' + escapeFeatureHtml(lastRoll.事件类型) + ' ' + escapeFeatureHtml(lastRoll.方向) + ' ' + escapeFeatureHtml(lastRoll.主维度) + ' 基础' + lastRoll.基础值 + '<br>' +
            result.fieldName + '：' + result.oldValue + ' → <b style="color:#6ee7b7">' + result.newValue + '</b>（Δ' + (result.delta >= 0 ? '+' : '') + result.delta + '）<br>' +
            (result.emotionResult ? '情绪骰 1d4 = ' + result.emotionResult.dice + '（阈值' + result.emotionResult.threshold + '，' + (result.emotionResult.passed ? '通过' : '失败') + '）<br>' : '') +
            (result.isAbyss ? '⚠ 深渊模式生效<br>' : '') + (result.weeklyBlocked ? '⚠ 周上限已压缩<br>' : '');
          confirmBtn.disabled = false;
        });
        confirmBtn.addEventListener('click', async function() {
          if (!pendingResult) return;
          const d = readMvuLatest();
          if (!d || !d.stat_data || !d.stat_data.角色 || !d.stat_data.角色[pendingResult.name]) { toast('写入失败：找不到角色', 'warning'); return; }
          const target = d.stat_data.角色[pendingResult.name];
          target[pendingResult.fieldName] = pendingResult.newValue;
          if (target._quota && pendingResult.newWeeklyUsed !== undefined) {
            target._quota.好感度周上限已用 = pendingResult.newWeeklyUsed;
          }
          if (pendingResult.lastRoll) {
            target._lastRoll = {
              事件类型: pendingResult.lastRoll.事件类型,
              方向: pendingResult.lastRoll.方向,
              主维度: pendingResult.lastRoll.主维度,
              基础值: pendingResult.lastRoll.基础值,
              _applied: true,
              _turnSig: (_lastRollTurnSigFor(pendingResult.name) || '')
            };
          }
          syncStageWithAffection(target);
          const ok = await writeMvuLatest(d.stat_data);
          if (ok) { toast('已覆盖变量', 'success'); try { refreshPanel(); } catch (e) {} try { mask.remove(); } catch (e) {} }
          else toast('写入失败', 'warning');
        });
      }
    });
  }
  function _lastRollTurnSigFor(name) {
    try { const d = readMvuLatest(); const ch = d && d.stat_data && d.stat_data.角色 && d.stat_data.角色[name]; return ch && ch._lastRoll ? ch._lastRoll._turnSig : ''; } catch (e) { return ''; }
  }

  function openFaqDialog() {
    const FAQ_LIST = [
      { q: '第一次玩，我该点哪里？', keys: ['第一次', '新手', '开始', '入门'], a: '只做一件事：<b>▶ 开始游戏 → 🚀 开局适配</b>，点一下等它跑完。<br>它会读完聊天记录，自动帮你建好角色档案。<br>建好之后就不用管了，正常聊天，好感会自己涨。' },
      { q: '我不想装也能玩吗？要装别的东西吗？', keys: ['依赖', 'mvu', '安装', '前置'], a: '不用装任何别的东西。所有数据都存在这台掌机里，<b>不需要 MVU</b>。' },
      { q: '导入脚本后没反应 / 找不到入口', keys: ['刷新', '导入', '菜单', '入口'], a: '先确认脚本是「已启用」状态，然后刷新一次酒馆页面。<br>入口在右上角的扩展菜单里，图标是 🌕。' },
      { q: '时间是怎么走的？', keys: ['时间推进', '十分钟', '游戏日', '时间'], a: '你每发一句话，时间往前 <b>10 分钟</b>，像真的在一起过日子。<br>过了半夜就算新的一天（游戏日 +1）。<br>如果剧情要跳到几小时后或第二天，<b>你得自己说一声</b>（「我们明天见」「睡了」），或者正文写了「次日 / 一周后」。<br>没说就默认只过 10 分钟，不会乱跳。' },
      { q: '时间 / 内心话不动了怎么办', keys: ['时间', '心声', '内心话', '不推进', '卡住'], a: '多半是这轮 AI 没写时间。<br>想马上修：<b>♥ 角色与存档 → 👥 角色定位</b>，直接手写时间、地点和内心话，保存立刻生效。' },
      { q: 'AI 把别人当成主角了 / 认成「次要」', keys: ['次要', '重要度', '角色定位', '攻略对象', '认错'], a: '<b>♥ 角色与存档 → 👥 角色定位</b>，把她改成「主要」。<br>改完 AI 下一轮就会围着她写，<b>不用重开档</b>。' },
      { q: '「锚定时间线」是什么？', keys: ['锚定', '时间线', '锁定', '反悔'], a: '一个「回不了头」的开关。<br>打开后，<b>只要她好感跌破 0，或者跟你冷战</b>，这段剧情就锁死了：<br>删楼、滑动、重摇、把好感刷回来 —— 都解不开。<br><b>唯一的解法是开一个新对话。</b><br>不打开就完全不影响你。' },
      { q: '加分太少了，能重来吗？', keys: ['重roll', '重投', '重摇', '加分'], a: '可以。<b>▶ 开始游戏 → 🎲 属性点重掷</b>，摇到满意再点「确认覆盖」。<br>它会告诉你这次是按什么算的（AI 判定 / 本楼暗号 / 你手填）。' },
      { q: '重摇显示「无记录」怎么办？', keys: ['无记录', '重roll', '判断'], a: '意思是这一轮 AI 没给这个角色打暗号。<br>现在会自动退回一步：先试「本楼暗号」，还不行就让你<b>手动选方向、数值</b>，照样能摇。' },
      { q: '「关系升级判定」（阶段门）是什么？', keys: ['阶段门', '破门', '冻结', '升级'], a: '好感涨到 <b>18 / 38 / 58 / 78 / 98</b> 这五个点时，会停下来做一次「能不能更进一步」的判定。<br>过了就升级，没过就卡在这个阶段，需要更好的时机。' },
      { q: '事件多久来一次？', keys: ['事件', '节奏', '频率'], a: '大约每 <b>8~12 回合</b>来一个日常小事件，重大事件有几天冷却。<br>嫌多嫌少，去 <b>⚙ 运行设定 → 事件推进节奏</b> 调慢 / 中 / 快。' },
      { q: '「彩蛋事件」是什么？', keys: ['彩蛋', '大成功'], a: '摇到 20 点才会出现的稀有事件，持续 5 回合，风格一定是轻松搞笑的日常。' },
      { q: '角色试镜是干什么的？', keys: ['试镜', '小抄', '像不像'], a: '让 AI 先读角色卡，写一份「她该怎么说话」的小抄，再演一小段给你看。<br>不像就写意见让它重演，满意了就存下来。<br>存下来之后，AI 演她会明显更像本人（不会说出不像她会说的话）。' },
      { q: '小抄（角色小抄库 / 玩家档案）怎么管？', keys: ['小抄库', '管理', '玩家', 'persona'], a: '一个角色只能启用一份小抄，启用新的会自动关掉旧的。<br>玩家档案也一样，只是它管的是「你」。<br>随时可以在库里改、关、删。' },
      { q: '自检报告在哪看？', keys: ['自检', '报告', '报错'], a: '<b>⚙ 系统检修 → 🔭 系统自检</b>，跑完会弹窗告诉你哪一项不正常。<br>要发帖求助，先跑自检 + 模拟测试，把结果截图一起发。' },
      { q: '时间线要不要写？', keys: ['时间线', 'timeline', '主线'], a: '不写也能玩。<br>写了的话，AI 会照着上面的日期安排主线大事，世界更有目标感。<br>写法：一个事件一条，或者一条里用「时间：xxx / 内容：yyy」分段。' },
      { q: 'AI 回复末尾那个 [Sylveina|...] 是什么？', keys: ['标签', 'sylveina', '暗号'], a: '那是给掌机看的「暗号」，你不用管。<br>AI 只打暗号，具体加多少分由掌机摇骰子算，AI 改不了数。' }
    ];

    const html = '<div style="padding:10px 12px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:9px;color:#fca5a5;font-size:11.5px;line-height:1.7;margin-bottom:12px;">' +
      '<b>🛑 遇到问题先做两步：</b><br>① 先看下面有没有你的问题　② 没有的话点 <b>⚙ 系统检修 → 🔭 系统自检</b>，把结果截图发帖。<br>' +
      '<span style="color:#fde047;font-weight:700;">💡 不需要装 MVU，所有数据都存在这台掌机里。</span></div>' +
      '<input id="moon-faq-search" placeholder="打个词搜一搜，比如「时间」「认错」" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#05070e;color:#e2e8f0;font-size:12px;outline:none;margin-bottom:10px;">' +
      '<div id="moon-faq-list" style="display:flex;flex-direction:column;gap:6px;"></div>';
    showModalDialog('❓ 常见问题', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const input = mask.querySelector('#moon-faq-search'); const list = mask.querySelector('#moon-faq-list');
        function render(kw) {
          const w = String(kw || '').trim().toLowerCase();
          const items = FAQ_LIST.filter(function(item) { if (!w) return true; const pool = (item.q + ' ' + item.keys.join(' ') + ' ' + item.a).toLowerCase(); return pool.indexOf(w) >= 0; });
          if (!items.length) { list.innerHTML = '<div style="color:#f87171;font-size:11px;">没找到，换个词试试。</div>'; return; }
          list.innerHTML = items.map(function(item, idx) {
            return '<div style="border:1px solid rgba(148,163,184,0.14);border-radius:9px;overflow:hidden;">' +
              '<button class="moon-faq-q" data-idx="' + idx + '" style="width:100%;text-align:left;padding:8px 10px;background:#0f172a;color:#e2e8f0;border:none;cursor:pointer;font-size:11.5px;font-weight:700;font-family:inherit;">' + item.q + '</button>' +
              '<div class="moon-faq-a" data-idx="' + idx + '" style="display:none;padding:8px 10px;background:#05070e;color:#94a3b8;font-size:11px;line-height:1.65;">' + item.a + '</div></div>';
          }).join('');
          list.querySelectorAll('.moon-faq-q').forEach(function(btn) { btn.addEventListener('click', function() { const idx = btn.getAttribute('data-idx'); const a = list.querySelector('.moon-faq-a[data-idx="' + idx + '"]'); if (a) a.style.display = a.style.display === 'none' ? 'block' : 'none'; }); });
        }
        input.addEventListener('input', function() { render(input.value); }); render('');
      }
    });
  }
