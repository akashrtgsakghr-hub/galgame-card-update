  function renderArcadeGameScreen() {
    return '<div class="mp-arcade-box"><div class="mp-arcade-brand">MOON POCKET ARCADE </div><div class="mp-arcade-title">像素跳跃 · 避开障碍，挑战本聊天最高纪录</div><div class="mp-arcade-hud"><span>SCORE <b id="moon-arcade-score">00000</b></span><span>HI <b id="moon-arcade-hi-score">' + String(getArcadeHighScore()).padStart(5, '0') + '</b></span></div><div class="mp-arcade-record-time" id="moon-arcade-record-time">RECORD TIME · ' + lcdEscape(formatArcadeRecordTime(getArcadeRecord().achievedAt, getArcadeHighScore())) + '</div><iframe id="moon-arcade-frame" class="mp-arcade-frame" title="离线像素小游戏" sandbox="allow-scripts"></iframe><div class="mp-arcade-session-stats" id="moon-arcade-session-stats"></div><div class="mp-arcade-state" id="moon-arcade-state">空格 / ↑ / 点击游戏画面跳跃</div><div class="mp-arcade-foot">本地离线运行 · 成绩按当前聊天保存</div></div>';
  }

  /* 难度四档。四处都会用到（面板、街机、设置组），所以抽成一个函数，
     文案统一成「名字 · 状态 + 每周最多加多少」，不再混用「满月/新月」这种只有老玩家懂的叫法。 */
  function renderDifficultyPicker(selectedLevel, isArcadeMode) {
    return '<div class="mp-mode-grid" role="group" aria-label="' + (isArcadeMode ? '街机难度' : '游戏难度') + '">' +
      ['easy', 'normal', 'hard', 'hell'].map(function(m) {
        const item = LUNAR_META[m];
        const isAct = m === selectedLevel;
        return '<button type="button" class="mp-mode-btn' + (isAct ? ' active' : '') + '" data-mode="' + m + '" aria-pressed="' + isAct + '">' +
          '<div class="mp-mode-moon">' + item.glyph + '</div>' +
          '<div>' + item.name + '</div>' +
          '<div>' + (isArcadeMode ? '难度 ' + item.name : '每周最多 +' + String(Math.round(item.quota * 10) / 10)) + '</div></button>';
      }).join('') + '</div>' +
      '<div class="mp-mode-description">' + (isArcadeMode
        ? '<b>' + LUNAR_META[selectedLevel].glyph + ' ' + LUNAR_META[selectedLevel].name + '</b>　' + ARCADE_DIFFICULTY_HINTS[selectedLevel] + '。只影响小游戏，不改剧情难度。'
        : '<b>' + LUNAR_META[selectedLevel].glyph + ' ' + LUNAR_META[selectedLevel].name + ' · ' + LUNAR_META[selectedLevel].title + '</b>　' + LUNAR_META[selectedLevel].detail) +
      '</div>';
  }

  /* 面板图标：一套线稿，18px、1.5 描边、颜色跟随文字。
     以前六个菜单项混着 ▶ ⚙ 和一个彩色 emoji，扫码扫不动；
     现在统一成同一套线，emoji 全部从界面里撤掉。 */
  function uiIco(name) {
    const P = {
      play: '<path d="M8.4 5.4v13.2L19.4 12z"/>',
      heart: '<path d="M12 20.2C7.7 17 4.2 14 4.2 10.5A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.8 2.8c0 3.5-3.5 6.5-7.8 9.7z"/>',
      journal: '<path d="M5.2 4.8h11.4A2.4 2.4 0 0 1 19 7.2v11.9H7.6a2.4 2.4 0 0 1-2.4-2.4z"/><path d="M8.8 9h6.8M8.8 12.6h6.8M8.8 16.2h4.2"/>',
      wrench: '<path d="M14.9 4.7a4.6 4.6 0 0 0-5.7 6.1l-4.8 4.8a1.9 1.9 0 0 0 2.7 2.7l4.8-4.8a4.6 4.6 0 0 0 6.1-5.7l-2.9 2.9-2.4-.6-.6-2.4z"/>',
      sliders: '<path d="M5 7.6h5.6M16 7.6h3M5 16.4h3M13.4 16.4h5.6"/><circle cx="13" cy="7.6" r="2.1"/><circle cx="10.6" cy="16.4" r="2.1"/>',
      gamepad: '<path d="M7.6 8.6h8.8a4.5 4.5 0 0 1 0 9h-.5l-1.8-1.9h-4.2l-1.8 1.9h-.5a4.5 4.5 0 0 1 0-9z"/><path d="M8.4 11.4v3.4M6.7 13.1h3.4"/><circle cx="15.2" cy="12.2" r=".75"/><circle cx="16.8" cy="14" r=".75"/>'
    };
    return '<svg class="mp-lico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  function renderPanel(panel) {
    /* 卡带机模式下整个屏就是一个 sandbox iframe，里面跑着有状态的模拟器。
       面板的定时刷新（refreshPanel）如果照常重绘，会先 _pocketStop() 把 iframe 拆掉，
       玩家正在玩的这一局就没了。这个模式下界面全部由 iframe 自己渲染，
       面板侧没有需要刷新的内容，所以直接跳过。 */
    if (panel.dataset.displayMode === 'pocket' && panel._pocketStop
        && mainDoc.getElementById('moon-pocket-host')) return;

    /* 这些按钮不一定存在：切到街机 / 卡带机时液晶屏内容整块不渲染。
       以前这里直接 querySelector(...).addEventListener 会抛 null，导致后面的绑定全断。 */
    const bindClick = function(sel, fn) { const el = panel.querySelector(sel); if (el) el.addEventListener('click', fn); return el; };
    if (panel._lcdArcadeStop) { try { panel._lcdArcadeStop(); } catch (e) {} panel._lcdArcadeStop = null; }
    if (panel._pocketStop) { try { panel._pocketStop(); } catch (e) {} panel._pocketStop = null; }
    if (panel._lcdStateTimer) { clearInterval(panel._lcdStateTimer); panel._lcdStateTimer = null; }
    const mode = getCurrentMode();
    const rawDisplay = panel.dataset.displayMode;
    const displayMode = (rawDisplay === 'arcade' || rawDisplay === 'pocket') ? rawDisplay : 'system';
    const isArcadeMode = displayMode === 'arcade';
    const isPocketMode = displayMode === 'pocket';
    const selectedLevel = isArcadeMode ? (panel.dataset.arcadeDifficulty || 'normal') : mode;
    const activeMenuKey = panel.dataset.activeMenuKey || '';
    panel.dataset.displayMode = displayMode;
    panel.classList.toggle('mp-display-arcade', isArcadeMode);
    panel.classList.toggle('mp-display-pocket', isPocketMode);
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
    /* 引导条：每次打开面板只说一件「现在该做什么」。
       以前这里是一张「第一次玩？照着做两步」的卡 + 上面六张菜单卡 + 一块 LCD，
       信息全在，但没人告诉新手从哪下手；现在按存档状态算一句话。 */
    const rosterNames = Object.keys(_panelChars).filter(function(n) { return !isCharSkeleton(_panelChars[n]); });
    const guide = !hasRoster
      ? {
          ok: false,
          eyebrow: '下一步 · 只做这一件事',
          title: '先建一份人物档案',
          desc: '点右边的按钮，AI 会把聊天记录读一遍，把人物和现在的数值填好。建完就不用再点它了。',
          cta: '帮我建档案',
          act: 'adapt',
          link: '先看 30 秒怎么玩'
        }
      : {
          ok: true,
          eyebrow: '已经可以玩了',
          title: '回到酒馆正常聊天就行',
          desc: 'Ta涨多少由这台小机器算，AI 看不到数字，也不会自己编。想全屏看剧情就点右边。',
          cta: '全屏看剧情',
          act: 'gal',
          link: '看 30 秒怎么玩'
        };
    const guideHtml = '<div class="mp-guide' + (guide.ok ? ' is-ok' : '') + '" id="moon-guide">' +
      '<div class="mp-guide-main">' +
        '<span class="mp-guide-eyebrow">' + guide.eyebrow + '</span>' +
        '<div class="mp-guide-title">' + guide.title + '</div>' +
        '<div class="mp-guide-desc">' + guide.desc + '</div>' +
        '<button type="button" class="mp-guide-link" data-guide-act="tour">' + guide.link + '</button>' +
      '</div>' +
      '<div class="mp-guide-actions">' +
        '<button type="button" class="mp-guide-cta" data-guide-act="' + guide.act + '">' + guide.cta + '</button>' +
      '</div>' +
    '</div>';

    /* 重绘会重建整棵 DOM，折叠块的展开状态和滚动位置都会丢，
       玩家看到的就是「改一下单人卡/多人卡，运行设定自己就收起来了」。先快照、后还原。
       两套折叠都要记：老的 <details>（兼容）和新的 .mp-fold。 */
    const _foldSnap = {};
    let _scrollSnap = 0;
    try {
      panel.querySelectorAll('details').forEach(function(d) {
        const summaryEl = d.querySelector('summary');
        const t = (summaryEl ? summaryEl.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 24);
        if (t) _foldSnap[t] = d.open === true;
      });
      panel.querySelectorAll('.mp-fold[data-fold]').forEach(function(d) {
        _foldSnap['fold:' + d.getAttribute('data-fold')] = d.getAttribute('data-open') === '1';
      });
      _scrollSnap = Number(panel.scrollTop) || 0;
    } catch (e) {}

    /* 设置卡放到主菜单之后：先给「现在做什么」，再给「怎么调」 */
    const settingsCardHtml = '<div class="mp-card">' +
      pocketFold('play', '玩法与手感', '难度、卡组、建档、骰子、事件节奏',
        '<div class="mp-set-block"><div class="mp-set-title">游戏难度</div>' +
        '<div class="mp-set-desc">' + currentMeta.detail + '</div>' +
        renderDifficultyPicker(selectedLevel, false) + '</div>' +
        pocketRow('这张卡有几个人', cardMode === 'multi' ? '好几个人都能攻略：谁在场就算谁的分' : '只有一个人：所有加减都算在Ta头上',
          '<button class="mp-cardmode-btn ' + (cardMode === 'multi' ? 'on' : '') + '" id="moon-phase-cardmode">' + (cardMode === 'multi' ? '多人卡' : '单人卡') + '</button>') +
        pocketRow('自动建档', autoBoot ? 'Ta第一次说话就自动建好档案，之后每轮有新角色也会补进来' : '关掉了：不点「开局适配」就一直不建档',
          '<button class="mp-safelock-btn ' + (autoBoot ? 'on' : 'off') + '" id="moon-phase-autobootstrap">' + (autoBoot ? '开' : '关') + '</button>') +
        pocketRow('初见投资', (firstMeetMode() === 'dice' ? '只看骰子：第一次见面给多少全凭运气' : '骰子 + 人设：AI 只判断Ta吃不吃你这一套，数值仍由骰子定') + (firstMeetFloorOn() ? '，没过也给 1~4 点' : ''),
          '<button class="mp-safelock-btn ' + (firstMeetMode() === 'dice' ? 'off' : 'on') + '" id="moon-phase-firstmeet">' + (firstMeetMode() === 'dice' ? '纯骰子' : '骰子+AI') + '</button>') +
        pocketRow('小事件来得多勤', pacing === 'Adi' ? '慢：很久才来一次' : pacing === 'All' ? '快：经常来' : '中：正常节奏',
          '<button class="mp-pacing-btn ' + pacing + '" id="moon-phase-pacing">' + (pacing === 'Adi' ? '慢' : pacing === 'All' ? '快' : '中') + '</button>') +
        pocketRow('借原作台词', fanficOn ? '会参考原作里Ta说过的话，更像本人' : '只按角色卡演，不引用原作',
          '<button class="mp-fanfic-btn' + (fanficOn ? ' on' : '') + '" id="moon-phase-fanfic">' + (fanficOn ? '开' : '关') + '</button>'),
        false) +
      pocketFold('look', '外观与阅读', '状态卡长什么样、用哪一套纸与光',
        '<div class="mp-set-block"><div class="mp-set-title">楼内状态卡</div>' +
        '<div class="mp-set-desc" id="moon-phase-skin-desc">' + lcdEscape(getSkinHint()) + '</div>' +
        renderSkinPickerHtml() + '</div>' +
        '<div class="mp-set-block"><div class="mp-set-title">自制美化</div>' +
        '<div class="mp-set-desc">描述你想要的样子，让模型生成一套配色与材质；也可以导出成文档，在外面做好再把 JSON 贴回来。</div>' +
        '<div style="margin-top:8px;"><button id="moon-forge-open" class="mp-safelock-btn on">自制美化 / 导出文档</button></div></div>',
        false) +
      pocketFold('ai', 'AI 怎么演', '只有想换模型、或觉得Ta说话不像，才需要动',
        pocketRow('让插件用自己的 AI', hasApi ? ('当前模型：' + lcdEscape(apiCfg.model)) : '不用填。不填就用你酒馆里那个 AI',
          '<button class="mp-extra-btn ' + (hasApi ? 'on' : '') + '" id="moon-phase-extramodel">' + (hasApi ? '已配置' : '去配置') + '</button>') +
        '<div class="mp-set-block"><div class="mp-set-title">演绎规则</div>' +
        '<div class="mp-set-desc" id="moon-phase-core-desc">' + lcdEscape(getCoreRuleHint()) + '</div>' +
        renderCoreRulePickerHtml() + '</div>' +
        '<div class="mp-set-block"><div class="mp-set-title">词条释义</div>' +
        '<div class="mp-set-desc" id="moon-phase-glossary-desc">' + lcdEscape(getGlossaryHint()) + '</div>' +
        renderGlossaryPickerHtml() + '</div>',
        false) +
      pocketFold('risk', '开了就回不了头', '这两个开关会影响整局，看清楚再用',
        pocketRow('安全锁', getSafetyLock() ? '开：Ta最多嘴上凶，不会真的伤害你' : '关：剧情可能真的动手',
          '<button class="mp-safelock-btn ' + (getSafetyLock() ? 'on' : 'off') + '" id="moon-phase-safetylock">' + (getSafetyLock() ? '开' : '关') + '</button>') +
        pocketRow('锁死这段剧情', (antisl || anchorLocked) ? '已经开了：Ta一旦心凉就锁死，只能开新对话重来' : '关着。打开后Ta心凉就回不了头，删楼重摇都没用',
          '<button class="mp-antisl ' + ((antisl || anchorLocked) ? 'on' : '') + '" id="moon-phase-antisl">' + (anchorLocked ? '已锁死' : (antisl ? '开' : '关')) + '</button>'),
        false) +
      '<div class="mp-fate ' + (fateActive ? 'active' : 'idle') + '">' +
      '<span class="mp-fate-dot" style="background:' + (fateActive ? '#ff8ab2' : '#7fd8a8') + ';"></span>' +
      '<span>' + (fateActive ? '已经锁死了，只能开新对话' : '还没锁，随时能反悔') + '</span></div></div>';

    panel.innerHTML = '' +
      /* 头部：品牌名固定一行（长卡名收成副标题），版本号独立成块，不再把标题挤成三行 */
      '<div class="mp-head"><button type="button" class="mp-title-group mp-update-hitbox" id="moon-version-badge" aria-label="检查更新" title="点击这里检查更新">' +
      '<span class="mp-title-orb">' + currentMeta.glyph + '</span>' +
      '<span class="mp-brand"><span class="mp-title">' + SYSTEM_MENU_NAME + '</span>' +
      '<span class="mp-brand-sub">' + SYSTEM_MENU_SUB + '</span></span></button>' +
      '<span class="mp-badge" style="cursor:pointer;' + (_cachedUpdateInfo ? 'border-color:rgba(244,114,208,.6);color:#ffb3e8;' : '') + '">v' + MOON_FORMULA_VERSION + (_cachedUpdateInfo ? ' · 有新版' : '') + '</span>' +
      '<button class="mp-close" id="moon-phase-close" aria-label="关闭面板">✕</button></div>' +
      guideHtml +
      '<div class="mp-display-mode-switch" role="tablist" aria-label="切换面板或街机">' +
      '<button type="button" role="tab" aria-selected="' + (!isArcadeMode) + '" class="' + (!isArcadeMode ? 'active' : '') + '" data-display-mode="system">系统面板</button>' +
      '<button type="button" role="tab" aria-selected="' + isArcadeMode + '" class="' + (isArcadeMode ? 'active' : '') + '" data-display-mode="arcade">街机小游戏</button>' +
      '<button type="button" role="tab" aria-selected="' + isPocketMode + '" class="' + (isPocketMode ? 'active' : '') + '" data-display-mode="pocket">卡带机</button></div>' +
      '<div class="mp-card mp-lcd-card' + (isArcadeMode ? ' mp-lcd-game' : (isPocketMode ? ' mp-pocket-card' : '')) + '">' + (isArcadeMode ? renderArcadeGameScreen() : (isPocketMode ? renderPocketScreen() : renderLcdScreen(panel, mode, antisl, extraSetting, cardMode, pacing, fanficOn))) + '</div>' +
      (isArcadeMode
        ? '<div class="mp-card mp-mode-select-card is-arcade">' + renderDifficultyPicker(selectedLevel, true) + '</div>'
        : '') +
      '<div class="mp-system-content">' +
      (bioStatus.count > 0 ? '<div class="mp-card"><div class="mp-card-title">已有 ' + bioStatus.count + ' 份角色小抄生效<small>BIO</small></div><div class="mp-set-desc">' + bioStatus.charNames.join('、') + '</div></div>' : '') +
      (enabledUserBio ? '<div class="mp-card"><div class="mp-card-title">玩家档案已生效<small>YOU</small></div><div class="mp-set-desc">' + String(enabledUserBio.userName || '(未命名)').replace(/</g, '&lt;') + '</div></div>' : '') +
      '<section class="mp-menu-home" id="moon-menu-home" style="' + (activeMenuKey ? 'display:none' : 'display:block') + '">' +
      '<div class="mp-menu-label">主菜单 · 点哪进哪</div><div class="mp-menu-grid">' +
      '<button class="mp-menu-card" data-menu-open="adventure"' + (hasRoster ? '' : ' data-primary="1"') + '><span class="mp-menu-icon">' + uiIco('play') + '</span><span><b>新游戏 / 继续旅程</b><small>建立人物档案、调整难度，或接续已有进度</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="characters"><span class="mp-menu-icon">' + uiIco('heart') + '</span><span><b>人物图鉴与存档</b><small>管理角色关系、玩家身份、结局与回忆</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="timeline"><span class="mp-menu-icon">' + uiIco('journal') + '</span><span><b>世界编年史</b><small>查看与编辑世界事件、日期和未来节点</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="system"><span class="mp-menu-icon">' + uiIco('wrench') + '</span><span><b>系统诊断室</b><small>检查数据、标签解析与插件冲突</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-menu-open="settings"><span class="mp-menu-icon">' + uiIco('sliders') + '</span><span><b>游戏设置</b><small>调整界面、记忆、图像与运行参数</small></span><i>›</i></button>' +
      '<button class="mp-menu-card" data-gal-open="1"><span class="mp-menu-icon">' + uiIco('gamepad') + '</span><span><b>沉浸模式</b><small>全屏读剧情，像玩 Galgame 一样点着往下走</small></span><i>›</i></button>' +
      '</div><div class="mp-menu-controls"><span>不知道点哪，回最上面看那条粉色提示</span></div>' +
      '<div class="mp-console-cluster" role="group" aria-label="掌机按键">' +
        '<div class="mp-dpad" aria-hidden="true">' +
          '<button type="button" class="mp-dpad-btn mp-dpad-up" tabindex="-1" aria-label="上">▲</button>' +
          '<button type="button" class="mp-dpad-btn mp-dpad-left" data-lcd-page-step="-1" aria-label="屏幕上一页">◀</button>' +
          '<div class="mp-dpad-center"></div>' +
          '<button type="button" class="mp-dpad-btn mp-dpad-right" data-lcd-page-step="1" aria-label="屏幕下一页">▶</button>' +
          '<button type="button" class="mp-dpad-btn mp-dpad-down" tabindex="-1" aria-label="下">▼</button>' +
        '</div>' +
        '<div class="mp-pill-keys">' +
          '<div class="mp-pill-row">' +
            '<button type="button" class="mp-select-key" id="moon-phase-tutorial" title="打开新手引导">说明书</button>' +
            '<button type="button" class="mp-start-key' + (hasApi ? '' : ' unconfigured') + '" id="moon-header-api-btn" title="配置独立 AI 接口">AI 钥匙</button>' +
          '</div>' +
          '<div class="mp-pill-labels"><span>看怎么玩</span><span>' + (hasApi ? '已连' : '没填也能玩') + '</span></div>' +
        '</div>' +
        '<div class="mp-action-block">' +
          '<div class="mp-action-cluster">' +
            '<button type="button" class="mp-round-btn mp-btn-b" id="moon-btn-b" title="返回上一步">B</button>' +
            '<button type="button" class="mp-round-btn mp-btn-a" id="moon-btn-a" title="确认 / 开始">A</button>' +
          '</div>' +
          '<div class="mp-speaker-grill" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
        '</div>' +
      '</div>' +
      '</section>' +
      /* 掌机按键条：保留实体手感，但压成一行、放到内容之后 —— 它本来就是装饰性的，
         以前挡在菜单前面，手机上要先滑过半屏才看到能点的东西。 */
      '<section class="mp-menu-page" id="moon-menu-page" style="' + (activeMenuKey ? 'display:block' : 'display:none') + '">' +
      '<div class="mp-menu-page-head"><button class="mp-menu-back" id="moon-menu-back">◀ 返回</button><div><small>你在这里</small><b id="moon-menu-page-title">' + ({ adventure: '开始游戏', characters: '角色与存档', timeline: '冒险日志', system: '系统检修', settings: '系统选项' }[activeMenuKey] || '功能') + '</b></div><span class="mp-page-led"></span></div>' +
      '<div class="mp-subpage-switch" role="tablist" aria-label="切换功能">' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'adventure' ? ' active' : '') + '" data-menu-open="adventure">▶ 开始</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'characters' ? ' active' : '') + '" data-menu-open="characters">角色</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'timeline' ? ' active' : '') + '" data-menu-open="timeline">日志</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'system' ? ' active' : '') + '" data-menu-open="system">检修</button>' +
        '<button type="button" class="mp-subpage-tab' + (activeMenuKey === 'settings' ? ' active' : '') + '" data-menu-open="settings">选项</button>' +
      '</div>' +
      '<div class="mp-menu-subpage" data-menu-page="adventure" style="display:' + (activeMenuKey === 'adventure' ? 'block' : 'none') + '"><div class="mp-sub-label">开始游戏</div>' +
      pocketFold('adv-build', '建档案 / 搬存档', '第一次玩，或者换了新聊天还想接着玩',
        '<div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-adapt"><span>一键建档案</span><small>AI 读一遍聊天记录，把人和现在的数值填好</small></button>' +
        '<button class="mp-btn mp-btn-highlight" id="moon-phase-pack-migrate"><span>搬旧存档</span><small>换到新聊天时，把这里的档案带过去</small></button></div>', true) +
      pocketFold('adv-roll', '重摇 / 查上限', '觉得这轮加少了，或者想知道上限清没清',
        '<div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-reroll"><span>重摇这一轮</span><small>不满意就重摇，摇到满意再确认，可以一直摇</small></button>' +
        '<button class="mp-btn" id="moon-phase-countdown"><span>检查每周上限</span><small>算一下这周的加分额度该清零了没</small></button></div>', true) +
      '</div>' +
      '<div class="mp-menu-subpage" data-menu-page="characters" style="display:' + (activeMenuKey === 'characters' ? 'block' : 'none') + '"><div class="mp-sub-label">角色与存档</div>' +
      pocketFold('chr-files', '人物档案', '认错人、说话不像、想手改数值',
        '<div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-roster"><span>查看 / 修改档案</span><small>谁算主要攻略对象、现在多少分，都能手改</small></button>' +
        '<button class="mp-btn mp-btn-highlight" id="moon-phase-bio"><span>让Ta试演一段</span><small>先看Ta说话像不像本人，不像就重写</small></button>' +
        '<button class="mp-btn mp-btn-highlight" id="moon-phase-bio-lib"><span>已存的人物小抄</span><small>管所有写好的小抄，可改可开关</small></button></div>', true) +
      pocketFold('chr-you', '玩家身份档案', '每个聊天单独保存昵称与玩家设定，互不串档',
        '<div class="mp-grid"><button class="mp-btn mp-btn-user" id="moon-phase-player-nickname"><span>设置本聊天昵称</span><small>当前：' + lcdEscape(getChatPlayerIdentity().nickname || '跟随酒馆用户名') + '</small></button>' +
        '<button class="mp-btn mp-btn-user" id="moon-phase-user-bio"><span>生成玩家档案</span><small>整理当前玩家人设，形成可复用的小传</small></button>' +
        '<button class="mp-btn mp-btn-user" id="moon-phase-user-bio-lib"><span>选择本聊天的玩家档案</span><small>只影响当前聊天；其他聊天保留自己的选择</small></button></div>' +
        '<div style="font-size:10px;color:var(--mp-fg-3);margin-top:7px;">玩家昵称与玩家小抄均按聊天存档，不再使用全局启用状态。</div>', true) +
      pocketFold('chr-end', '回忆与结局', '想看攒下来的图和这一局的收尾',
        '<div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-gallery"><span>回忆画廊</span><small>看解锁的插画和成就，能下载保存</small></button>' +
        '<button class="mp-btn" id="moon-phase-ending"><span>结算这一局</span><small>生成结局卡和一篇番外</small></button></div>', true) +
      '</div>' +
      '<div class="mp-menu-subpage" data-menu-page="timeline" style="display:' + (activeMenuKey === 'timeline' ? 'block' : 'none') + '"><div class="mp-sub-label">冒险日志（可选）</div>' +
      pocketFold('tl-list', '世界大事表', '不写也能正常玩；写了 AI 会有主线目标',
        '<div class="mp-grid">' +
        '<button class="mp-btn" id="moon-phase-tl-list"><span>看看现在有什么</span><small>接下来会发生什么，能改能删</small></button>' +
        '<button class="mp-btn" id="moon-phase-tl-gen"><span>让 AI 编一份</span><small>它编完直接存进来，不用你写</small></button>' +
        '<button class="mp-btn" id="moon-phase-scan-timeline"><span>从世界书搬</span><small>已经有现成的，搬进来就行</small></button>' +
      '</div>', true) +
      pocketFold('tl-edit', '自己补 / 改日期', 'AI 写漏了，或者日期读错了',
        '<div class="mp-grid"><button class="mp-btn" id="moon-phase-tl-tag"><span>日期写在哪</span><small>告诉它去哪个位置读日期</small></button>' +
        '<button class="mp-btn" id="moon-phase-manual-tl"><span>手动贴一段</span><small>贴进去，自动整理成标准格式</small></button></div>', true) +
      '</div>' +
      '<div class="mp-menu-subpage" data-menu-page="system" style="display:' + (activeMenuKey === 'system' ? 'block' : 'none') + '"><div class="mp-sub-label">系统检修</div>' +
      pocketFold('sys-check', '先体检', '不知道哪坏了，就点这两个',
        '<div class="mp-grid"><button class="mp-btn" id="moon-phase-selfcheck"><span>系统自检</span><small>一条条列给你：哪项正常、哪项不正常</small></button>' +
        '<button class="mp-btn" id="moon-phase-simtest"><span>拿假数据试算</span><small>不碰你的存档，只验证算法跑不跑得通</small></button></div>', true) +
      pocketFold('sys-conflict', '查打架', '怀疑和别的插件/世界书撞了',
        '<div class="mp-grid"><button class="mp-btn" id="moon-phase-conflict"><span>冲突扫描</span><small>查世界书里有没有重复、互相打架的条目</small></button>' +
        '<button class="mp-btn" id="moon-phase-ai-detect"><span>让 AI 帮我看</span><small>它读完给出结论，也能顺手推荐个难度</small></button></div>', true) +
      '</div>' +
      '<div class="mp-menu-subpage" data-menu-page="settings" style="display:' + (activeMenuKey === 'settings' ? 'block' : 'none') + '"><div class="mp-sub-label">系统选项</div>' +
      pocketFold('opt-ai', 'AI 与接口', '可选：让插件单独用一个 AI',
        '<div class="mp-grid"><button class="mp-btn mp-btn-highlight" id="moon-phase-custom-ai"><span>AI 钥匙</span><small>' + (hasApi ? '已填：' + lcdEscape(String(apiCfg.model).slice(0, 12)) : '不用填，不填就用酒馆里那个 AI') + '</small></button>' +
        '<button class="mp-btn" id="moon-phase-prompt-edit"><span>改提示词</span><small>AI 收到的指令在这里，看得懂再改</small></button></div>', true) +
      pocketFold('opt-art', '插画与番外', '用哪家画图、番外写多长',
        '<div class="mp-grid"><button class="mp-btn" id="moon-phase-image-settings"><span>画图与番外设定</span><small>选画图渠道，定番外字数</small></button>' +
        '<button class="mp-btn mp-btn-user" id="moon-phase-tutorial-btn"><span>新手说明书</span><small>一步一步讲，30 秒看完</small></button></div>', true) +
      pocketFold('opt-update', '更新与帮助', '拉最新版、遇到问题先搜这里',
        '<div class="mp-grid"><button class="mp-btn' + (_cachedUpdateInfo ? ' mp-btn-highlight' : '') + '" id="moon-phase-update"><span>' + (_cachedUpdateInfo ? '有新版本' : '检查更新') + '</span><small>连不上会自动换线路重试</small></button>' +
        '<button class="mp-btn" id="moon-phase-faq"><span>遇到问题</span><small>按情况分好类，一句话一个答案</small></button></div>', true) +
      '</div></section>' +
      settingsCardHtml +
      '<div class="mp-status" id="moon-phase-status">准备好了。要做的事都写在最上面那条提示里。</div></div>';

    /* 还原折叠状态：按标题文字 / data-fold 匹配，和重绘前那一份对齐 */
    try {
      panel.querySelectorAll('details').forEach(function(d) {
        const summaryEl = d.querySelector('summary');
        const t = (summaryEl ? summaryEl.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 24);
        if (t && Object.prototype.hasOwnProperty.call(_foldSnap, t)) d.open = _foldSnap[t];
      });
      panel.querySelectorAll('.mp-fold[data-fold]').forEach(function(d) {
        const key = 'fold:' + d.getAttribute('data-fold');
        if (!Object.prototype.hasOwnProperty.call(_foldSnap, key)) return;
        const open = _foldSnap[key] === true;
        d.setAttribute('data-open', open ? '1' : '0');
        const head = d.querySelector('.mp-fold-head');
        if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (_scrollSnap) panel.scrollTop = _scrollSnap;
    } catch (e) {}

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
    try { bindPocketFolds(panel); } catch (e) {}
    /* 引导条：按钮动作和它写的那句话必须对得上，所以动作也集中在一处判断 */
    panel.querySelectorAll('[data-guide-act]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const act = btn.getAttribute('data-guide-act');
        if (act === 'adapt') { openUnifiedAdaptDialog(panel); return; }
        if (act === 'gal') {
          let ok = false;
          try { ok = galFlip() !== false; } catch (e) {
            ok = false;
            try { toast('沉浸模式没打开：' + String(e && e.message || e), 'warning'); } catch (e2) {}
          }
          if (ok !== false) { try { closePanel(); } catch (e) {} }
          return;
        }
        if (act === 'tour') { openTutorialDialog(panel); }
      });
    });
    bindClick('#moon-phase-close', closePanel);
    bindClick('#moon-phase-tutorial', function() { openTutorialDialog(panel); });
    const tutBtn2 = panel.querySelector('#moon-phase-tutorial-btn');
    if (tutBtn2) tutBtn2.addEventListener('click', function() { openTutorialDialog(panel); });
    const quickStartBtn = panel.querySelector('#moon-quick-start');
    if (quickStartBtn) quickStartBtn.addEventListener('click', function() { openUnifiedAdaptDialog(panel); });
    const headerApiBtn = panel.querySelector('#moon-header-api-btn');
    if (headerApiBtn) headerApiBtn.addEventListener('click', function() { openCustomAIConfigDialog(panel); });

    /* 页签改用事件委托绑在面板上：renderPanel 会整体重写 innerHTML，
       绑在按钮上的监听会随节点一起被丢掉，表现为「切过一次页签后页签就点不动了」。 */
    if (panel.dataset.modeTabsBound !== '1') {
      panel.dataset.modeTabsBound = '1';
      panel.addEventListener('click', function(event) {
        const button = event.target && event.target.closest ? event.target.closest('button[data-display-mode]') : null;
        if (!button || !panel.contains(button)) return;
        const raw = button.getAttribute('data-display-mode');
        const nextMode = (raw === 'arcade' || raw === 'pocket') ? raw : 'system';
        if (nextMode === panel.dataset.displayMode) return;
        panel.dataset.displayMode = nextMode;
        renderPanel(panel);
      });
    }
    if (isArcadeMode) {
      const lcdCard = panel.querySelector('.mp-lcd-card');
      if (lcdCard) panel._lcdArcadeStop = mountArcadeRunner(lcdCard, { standalone: true, difficulty: selectedLevel });
    }
    if (isPocketMode) {
      const pocketCard = panel.querySelector('.mp-pocket-card');
      if (pocketCard) panel._pocketStop = mountPocket(pocketCard);
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
    bindClick('#moon-menu-back', function() {
      panel.dataset.activeMenuKey = '';
      menuPage.style.display = 'none';
      menuHome.style.display = 'block';
    });
    const galEntryBtn = panel.querySelector('[data-gal-open]');
    if (galEntryBtn) galEntryBtn.addEventListener('click', function() {
      /* 先进沉浸层，再收面板：反过来的话面板一收就把点击冒泡链断了。
         开/关以 DOM 实际状态判断，不看存档里的 on，避免「点了没反应」。 */
      let ok = false;
      try { ok = galFlip() !== false; } catch (e) {
        ok = false;
        try { toast('沉浸模式没打开：' + String(e && e.message || e), 'warning'); } catch (e2) {}
      }
      if (ok !== false) { try { closePanel(); } catch (e) {} }
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

bindClick('#moon-phase-update', function() {
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
    bindClick('#moon-phase-antisl', function() {
      if (loadAnchor()) { toast('世界线已锚定 · 只能通过开启新对话解除', 'warning'); return; }
      const s2 = getSettings(); s2.antisl = !(s2.antisl === true); saveSettings(s2); refreshPanel();
    });
    bindClick('#moon-phase-extramodel', function() { openCustomAIConfigDialog(panel); });
    bindClick('#moon-phase-cardmode', function() { const s2 = getSettings(); s2.cardMode = (s2.cardMode === 'multi') ? 'single' : 'multi'; saveSettings(s2); refreshPanel(); });
    bindClick('#moon-phase-safetylock', function() { const s2 = getSettings(); s2.safetyLock = !getSafetyLock(); saveSettings(s2); refreshPanel(); });
    bindClick('#moon-phase-autobootstrap', function() { const s2 = getSettings(); s2.autoBootstrap = (s2.autoBootstrap === false); saveSettings(s2); if (s2.autoBootstrap) { setTimeout(function() { autoBootstrapCharacter('first-reply'); }, 120); } refreshPanel(); });
    bindClick('#moon-phase-firstmeet', function() {
      const s2 = getSettings();
      s2.firstMeetMode = (s2.firstMeetMode === 'dice') ? 'hybrid' : 'dice';
      saveSettings(s2);
      toast(s2.firstMeetMode === 'dice' ? '初见投资：只掷骰，AI 不再给档位' : '初见投资：AI 评档位，脚本掷数值', 'info');
      refreshPanel();
    });
    (function() {
      const coreBtns = panel.querySelectorAll('[data-core-rule]');
      for (let i = 0; i < coreBtns.length; i++) {
        coreBtns[i].addEventListener('click', function() {
          const v = setCoreRuleMode(this.getAttribute('data-core-rule'));
          toast('演绎规则：' + ({ auto: '自动（有世界书就用世界书）', on: '强制用内置规则', off: '不注入' }[v] || v), 'info');
          refreshPanel();
        });
      }
    })();
    (function() {
      const glBtns = panel.querySelectorAll('[data-glossary]');
      for (let i = 0; i < glBtns.length; i++) {
        glBtns[i].addEventListener('click', function() {
          const v = setGlossaryMode(this.getAttribute('data-glossary'));
          toast('词条释义：' + ({ auto: '按需注入', always: '全量常驻', off: '关闭' }[v] || v), 'info');
          refreshPanel();
        });
      }
    })();
    bindClick('#moon-phase-pacing', function() { const s2 = getSettings(); const cur = getEventPacing(); const next = cur === 'Adi' ? 'And' : (cur === 'And' ? 'All' : 'Adi'); s2.eventPacing = next; saveSettings(s2); refreshPanel(); });
    bindClick('#moon-phase-fanfic', function() { const cur = getFanficEnhance(); setFanficEnhance(!cur); refreshPanel(); });
    bindClick('#moon-phase-countdown', function() { const actions = checkAllCountdowns(); const statusEl = panel.querySelector('#moon-phase-status'); if (actions.length === 0) statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 巡检完成：暂无到期周期节点。</span>'; else { let html = '<b style="color:#fde047">捕捉到 ' + actions.length + ' 个到期节点：</b><br>'; actions.forEach(function(a) { html += '<span style="color:#93c5fd">[' + a.type + ']</span> ' + a.char + '<br>'; }); statusEl.innerHTML = html; } });
    bindClick('#moon-phase-selfcheck', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#f472d0">运行自检...</span>'; const html = await runSelfCheckWithArcade(); statusEl.innerHTML = '<span style="color:#f9a8d4">✔ 自检完成。</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 自检报告', html); });
    bindClick('#moon-phase-simtest', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#93c5fd">运行测试...</span>'; const html = await runSimulationTest(); statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 测试完成。</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 测试结果', html); });
    bindClick('#moon-phase-conflict', async function() { const statusEl = panel.querySelector('#moon-phase-status'); statusEl.innerHTML = '<span style="color:#93c5fd">扫描冲突...</span>'; const result = await runConflictScan(); statusEl.innerHTML = result.hasConflict ? '<span style="color:#fbbf24">⚠ 发现冲突</span>' : '<span style="color:#6ee7b7">✔ 未发现冲突</span>'; showResultDialog(SYSTEM_UI_NAME + ' · 冲突扫描', result.html); });
    bindClick('#moon-phase-reroll', function() { openRerollDialog(panel); });
    bindClick('#moon-phase-pack-migrate', function() { startMigrationPack(panel); });
    bindClick('#moon-phase-bio', function() { openAuditionMainDialog(panel); });
    const rosterBtn = panel.querySelector('#moon-phase-roster');
    if (rosterBtn) rosterBtn.addEventListener('click', function() { openCharacterRosterDialog(panel); });
    bindClick('#moon-phase-bio-lib', function() { openBioLibraryDialog(panel); });
    bindClick('#moon-phase-user-bio', function() { openUserAuditionMainDialog(panel); });
    bindClick('#moon-phase-user-bio-lib', function() { openUserBioLibraryDialog(panel); });
    bindClick('#moon-phase-player-nickname', function() {
      const current = getChatPlayerIdentity().nickname;
      showModalDialogCancelable('设置本聊天的玩家昵称', '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:8px;">这个昵称只保存在当前聊天。使用同一张角色卡开新聊天时，可以设置另一套玩家身份。</div><input id="moon-chat-player-nickname-input" type="text" maxlength="32" value="' + lcdEscape(current) + '" placeholder="留空则跟随酒馆用户名" style="width:100%;box-sizing:border-box;padding:10px;background:#100b14;color:#f8eaf3;border:1px solid #74415f;border-radius:4px;">',
        function() { const mask = mainDoc.getElementById('moon-modal-mask'); const input = mask && mask.querySelector('#moon-chat-player-nickname-input'); if (!input) return; if (saveChatPlayerIdentity({ nickname: input.value })) { try { injectUserBio(); } catch (e) {} toast('本聊天昵称已保存', 'success'); try { mask.remove(); } catch (e) {} refreshPanel(); } },
        function() {}, { confirmText: '保存昵称', cancelText: '取消', onOpen: function(mask) { const input = mask.querySelector('#moon-chat-player-nickname-input'); if (input) input.focus(); } });
    });
    bindClick('#moon-phase-gallery', function() { openMemoryGalleryDialog(); });
    bindClick('#moon-phase-ending', function() { manualTriggerEnding(panel); });
    bindClick('#moon-phase-prompt-edit', function() { openPromptEditor(panel); });
    bindClick('#moon-phase-custom-ai', function() { openCustomAIConfigDialog(panel); });
    bindClick('#moon-phase-image-settings', function() { openImageGenerationSettingsDialog(panel); });
    bindClick('#moon-phase-faq', openFaqDialog);
    bindClick('#moon-phase-adapt', function() { openUnifiedAdaptDialog(panel); });
    bindClick('#moon-phase-ai-detect', function() { openAiConflictDialog(panel); });
    bindClick('#moon-token-refresh', function() { refreshTokenCard(panel); });
    setTimeout(function() { try { refreshTokenCard(panel); } catch (e) {} }, 120);
    bindClick('#moon-phase-scan-timeline', function() { openScanTimelineDialog(panel); });
    bindClick('#moon-phase-tl-gen', function() { openTimelineGeneratorDialog(panel); });
    if (panel.querySelector('#moon-phase-tl-list')) bindClick('#moon-phase-tl-list', function() { openTimelineManagerDialog(panel); });
    bindClick('#moon-phase-manual-tl', function() { openManualTimelineInputDialog(panel); });
    bindClick('#moon-phase-tl-tag', function() { openTimelineTagDialog(panel); });
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
    /* 初见投资留痕：谁结算过、骰点多少、档位从哪来、给了几分。
       玩家反馈「建档后从零开始加」时，看这一行就能判断是没掷、还是掷了但没过。 */
    try {
      const _d = readMvuLatest();
      const _chars = (_d && _d.stat_data && _d.stat_data.角色) || {};
      const _names = Object.keys(_chars).filter(function(k) { return k !== '示例角色' && k !== 'You' && k !== '你'; });
      const _done = []; const _pending = [];
      _names.forEach(function(n) {
        const q = (_chars[n] && _chars[n]._quota) || {};
        if (q._初见) _done.push(n + ' 1d20=' + q._初见.骰 + ' → E' + (q._初见.投入 >= 0 ? '+' : '') + q._初见.投入 + '（' + q._初见.档 + '·' + q._初见.来源 + '）');
        else if (q._firstMeetDone !== true) _pending.push(n);
      });
      info('初见投资：' + (firstMeetMode() === 'dice' ? '纯骰子' : '骰子+AI档位') + (firstMeetFloorOn() ? ' · 失败保底 1d4' : ' · 无保底'));
      if (_done.length) info('　已结算：' + _done.join('；'));
      if (_pending.length) info('　待结算：' + _pending.join('、') + '（下一轮入场时掷）');
    } catch (e) {}
    info('演绎规则：' + getCoreRuleHint());
    info('词条释义：' + getGlossaryHint());
    const pacingName = { Adi: 'Adagio · 柔板', And: 'Andante · 行板', All: 'Allegro · 快板' }[getEventPacing()] || getEventPacing();
    info('推进节奏：' + pacingName);
    info('同人台词补强：' + (getFanficEnhance() ? 'ON' : 'OFF'));
    info('安全锁：' + (getSafetyLock() ? 'ON' : '⚠ OFF'));
    info('锚定：' + (getAntiSL() ? 'ON' : '⚠ OFF'));
    info('当前难度：' + (LUNAR_META[getCurrentMode()]?.name || getCurrentMode()));

    lines.push('<div class="mp-log-subhead">── 独立 API ──</div>');
    const aiCfg = getCustomAIConfig();
    if (aiCfg && aiCfg.url && aiCfg.key && aiCfg.model) {
      const target = aiEndpointFor(aiCfg.rawUrl || aiCfg.url);
      info('接口：' + _aiHost(target.endpoint) + ' · ' + (target.protocol === 'anthropic' ? 'Anthropic 协议' : 'OpenAI 兼容'));
      info('模型：' + aiCfg.model);
    } else {
      info('还没配独立 API —— 后台任务会先试酒馆当前模型');
    }
    const recents = getAiRecentRequests();
    if (!recents.length) {
      info('这次开页面还没调过接口');
    } else {
      const tail = recents.slice(-5);
      for (let i = 0; i < tail.length; i++) {
        const r = tail[i];
        const secs = Math.round((r.ms || 0) / 100) / 10;
        const lineText = (r.via || '?') + ' · ' + (r.host || '?') + ' · ' + (r.model || '?') + ' · '
          + (r.code === 'ok' ? '成功' : (r.code || '失败')) + (r.status ? '（HTTP ' + r.status + '）' : '') + ' · ' + secs + 's';
        if (r.code === 'ok') ok(lineText); else warn(lineText);
      }
    }

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
    const verdictHtml = '<div style="padding:9px 11px;border-radius:9px;margin-bottom:10px;font-size:12px;font-weight:600;line-height:1.6;background:' +
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
    lines.push('<b style="color:#6ee7b7">' + SYSTEM_UI_NAME + ' · 综合测试</b><br>');
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

    lines.push('<div class="mp-log-subhead">【测试4A】负向好感必须扣分，且不占正向周额度</div>');
    try {
      const mockNegative = { 好感度: 20, 肉体值: 0, 阶段值: 1, 嫉妒值: 0, _quota: { 好感度周上限已用: 1.0 } };
      const negativeRoll = { 事件类型: '日常', 方向: '负向', 主维度: 'E', 基础值: 2.0 };
      const negativeResult = computeCharDelta(mockNegative, negativeRoll, 'hell');
      const quotaUnchanged = Number(mockNegative._quota.好感度周上限已用) === 1.0;
      if (negativeResult && negativeResult.delta < 0 && quotaUnchanged) lines.push('✔ 负向标签确实扣减 E，且没有消耗正向周额度');
      else lines.push('✖ 负向结算异常：Δ=' + (negativeResult && negativeResult.delta) + '，周额度未变=' + quotaUnchanged);
    } catch (e) { lines.push('✖ 负向结算测试异常：' + (e.message || e)); }

    lines.push('<div class="mp-log-subhead">【测试4B】周上限必须压住超额正向加分</div>');
    try {
      const mockQuota = { 好感度: 20, 肉体值: 0, 阶段值: 1, 嫉妒值: 0, _quota: { 好感度周上限已用: 2.5 } };
      const positiveRoll = { 事件类型: '重大', 方向: '正向', 主维度: 'E', 基础值: 8.0 };
      const quotaResult = computeCharDelta(mockQuota, positiveRoll, 'hell');
      const withinCap = quotaResult && quotaResult.delta === 0.5 && Number(mockQuota._quota.好感度周上限已用) === 3.0;
      if (withinCap) lines.push('✔ 地狱难度周额度剩余 0.5 时，实际只入账 0.5');
      else lines.push('✖ 周上限异常：实际 Δ=' + (quotaResult && quotaResult.delta) + '，已用=' + (mockQuota._quota && mockQuota._quota.好感度周上限已用));
    } catch (e) { lines.push('✖ 周上限测试异常：' + (e.message || e)); }

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
        角色: { '长谷川茗': { 好感度: 10, 肉体值: 0, 阶段值: 0, 嫉妒值: 0, 情绪: '', 心声: '……', 在场: true, 重要度: '主要', 对玩家称呼: '' } }
      };
      const mockMes = 'Ta笑了笑。\n[Sylveina|L|+|1.5]\ns\n角色.长谷川茗.情绪=\n角色.长谷川茗.心声=今天真开心。\n角色.长谷川茗.对玩家称呼=小月\n世界.时间=2000年01月02日 · 星期日 · 21:30';
      const res = ingestBackendVariables(mockMes, mockStat);
      const okTime = String(mockStat.世界.时间).indexOf('01月02日') >= 0;
      const okVoice = String(mockStat.角色['长谷川茗'].心声).indexOf('开心') >= 0;
      const okEmoji = String(mockStat.角色['长谷川茗'].情绪) === '';
      const okNick = String(mockStat.角色['长谷川茗'].对玩家称呼) === '小月';
      const repeatRes = ingestBackendVariables('角色.长谷川茗.心声=今天真开心。', mockStat);
      const okRepeat = (repeatRes.applied || []).indexOf('长谷川茗.心声重复') >= 0;
      const okStrip = String(res.text).indexOf('角色.长谷川茗.心声') < 0 && String(res.text).indexOf('角色.长谷川茗.对玩家称呼') < 0 && String(res.text).indexOf('世界.时间') < 0;
      if (okTime && okVoice && okEmoji && okNick && okRepeat && okStrip) lines.push('✔ 时间 / 心声 / 情绪 / 专属称呼均被写入；重复心声可识别，后台行已从正文清理');
      else lines.push('✖ 后台变量摄入不完整：时间' + okTime + ' 心声' + okVoice + ' 情绪' + okEmoji + ' 昵称' + okNick + ' 重复识别' + okRepeat + ' 清理' + okStrip);
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
      const d1 = detectRelativeElapsedDays('次日清晨，Ta推开了门。');
      const d2 = detectRelativeElapsedDays('三天后，演出如期而至。');
      const d3 = detectRelativeElapsedDays('Ta轻轻点头，什么也没说。');
      if (d1 === 1 && d2 === 3 && d3 === 0) lines.push('✔ 相对时间换算正确（1 / 3 / 0 天）');
      else lines.push('✖ 相对时间换算异常：' + d1 + ' / ' + d2 + ' / ' + d3);
    } catch (e) { lines.push('✖ 相对时间测试异常：' + (e.message || e)); }

    lines.push('<br><b style="color:#6ee7b7">综合测试完毕，本地化引擎运转正常。</b>');
    return lines.join('<br>');
  }

  async function runConflictScan() {
    const lines = [];
    /* 这两个计数必须在这里声明：warn() 会自增 _nWarn，漏声明就是 ReferenceError，
       启动自检会直接崩成「扫描异常：_nWarn is not defined」。 */
    let _nFail = 0, _nWarn = 0;
    const ok = function(s) { lines.push('<span style="color:#6ee7b7">✔</span> ' + s); };
    const warn = function(s) { _nWarn++; lines.push('<span style="color:#fbbf24">⚠</span> ' + s); };
    const info = function(s) { lines.push('<span style="color:#93c5fd">ℹ</span> ' + s); };
    const bad = function(s) { lines.push('<span style="color:#f87171">✖</span> ' + s); };
    let hasConflict = false;
    let fatalCount = 0;
    lines.push('<b style="color:#93c5fd">全环境冲突扫描</b>');

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
    info('数值全由掌机自己算；AI 只负责报时间和Ta心里的想法，这些玩家看不到');

    lines.push('<div class="mp-log-subhead">总结</div>');
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
    box.innerHTML = '<span style="color:#94a3b8;">正在算…</span>';
    try {
      const r = await computeTokenBreakdown();
      const lines = [];
      lines.push('<div style="font-size:10.5px;line-height:1.9;">');
      if (r.charCard > 0) lines.push('<div style="color:#94a3b8;">Ta的角色卡' + (r.charCardName ? '（' + String(r.charCardName).replace(/</g,'&lt;') + '）' : '') + ': <span style="color:#a5f3fc;">' + _fmtK(r.charCard) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">掌机自己占的: <span style="color:#6ee7b7;">' + _fmtK(r.sysTotal) + '</span></div>');
      r.sys.forEach(function(item) { lines.push('<div style="color:#64748b;padding-left:12px;">· ' + item.key + ': <span style="color:#94a3b8;">' + _fmtK(item.tokens) + '</span></div>'); });
      lines.push('<div style="color:#94a3b8;">世界设定条目: <span style="color:#c084fc;">' + _fmtK(r.moonEntries) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">时间表: <span style="color:#f9a8d4;">' + _fmtK(r.timeline) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">你的全局设置' + (r.presetName ? '（' + String(r.presetName).replace(/</g,'&lt;') + '）' : '') + ': <span style="color:#fbbf24;">' + _fmtK(r.preset) + '</span></div>');
      lines.push('<div style="color:#94a3b8;">其他设定: <span style="color:#fda4af;">' + _fmtK(r.worldbook) + '</span></div>');
      lines.push('<div style="border-top:1px dashed rgba(148,163,184,0.25);margin:6px 0;"></div>');
      lines.push('<div style="color:#fde047;font-weight:600;">加起来: <span style="color:#fde047;">' + _fmtK(r.grand) + '</span></div>');
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
    if (!names.length) { showModalDialog('角色定位', '<div style="line-height:1.8;">这个对话还没有角色档案。<br>先去 <b>▶ 开始游戏 → 开局适配</b> 点一下，建好再回来。</div>', null, { confirmText: '关闭' }); return; }
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
      /* 初见投资的可见状态：掷过就写骰点和投入；没掷过就明确写着「待结算」，
         免得玩家又以为是「脚本没生效」。自己往变量里加的人也能在这里补一次。 */
      const fm = ch._quota && ch._quota._初见;
      const fmDone = !!fm || (ch._quota && ch._quota._firstMeetDone === true);
      const fmTxt = fm
        ? ('初见 1d20=' + fm.骰 + (fm.档 ? '（' + fm.档 + '）' : '') + ' → E' + (fm.投入 >= 0 ? '+' : '') + fm.投入 + '　' + String(fm.来源 || ''))
        : (fmDone ? '初见已结算（旧存档，无骰点记录）' : '初见未结算 · 下一轮入场自动掷');
      return '<div class="moon-roster-row" data-name="' + escapeFeatureHtml(n) + '" data-idx="' + i + '" style="padding:10px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:9px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
        '<b style="font-size:12px;color:#f8fafc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeFeatureHtml(n) + '</b>' +
        '<span style="font-size:10px;color:#94a3b8;white-space:nowrap;">E' + (Number(ch.好感度) || 0) + ' P' + (Number(ch.肉体值) || 0) + ' R' + (Number(ch.阶段值) || 0) + ' I' + (Number(ch.嫉妒值) || 0) + '</span></div>' +
        '<div style="font-size:10px;line-height:1.5;margin-bottom:6px;color:' + (fmDone ? '#94a3b8' : '#fbbf24') + ';">' + escapeFeatureHtml(fmTxt) + '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
        '<select class="moon-roster-imp" data-idx="' + i + '" style="flex:1;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#22262f;color:#e2e8f0;font-size:11.5px;font-family:inherit;">' + impOptions(imp) + '</select>' +
        '<button type="button" class="moon-roster-presence" data-idx="' + i + '" data-on="' + (present ? '1' : '0') + '" style="padding:6px 10px;border-radius:6px;border:1px solid ' + (present ? 'rgba(110,231,183,0.5)' : 'rgba(148,163,184,0.3)') + ';background:' + (present ? '#052e20' : '#111827') + ';color:' + (present ? '#6ee7b7' : '#94a3b8') + ';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">' + (present ? '在场' : '不在场') + '</button>' +
        '<button type="button" class="moon-roster-firstmeet" data-idx="' + i + '" data-on="0" title="给这个人补掷一次初见骰（自己加进档案的角色用这个）" style="padding:6px 10px;border-radius:6px;border:1px solid rgba(168,85,247,0.45);background:#2a1040;color:#e9d5ff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">补掷</button></div>' +
        '<input class="moon-roster-voice" data-idx="' + i + '" value="' + escapeFeatureHtml(ch.心声 || '') + '" placeholder="Ta心里在想什么（可以自己改）" style="width:100%;box-sizing:border-box;margin-top:6px;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.2);background:#22262f;color:#cbd5e1;font-size:11px;font-family:inherit;">' +
        '</div>';
    }).join('');
    const html = '<div style="padding:9px 11px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:9px;font-size:10.8px;line-height:1.7;color:#bae6fd;margin-bottom:10px;">' +
      '<b>「主要」= 你真正想攻略的人</b>（AI 会把感情戏都写给Ta）<br>「次要」= 会出现、能聊几句的配角　「NPC」= 只露个脸的路人<br>改完点下面的「保存」就生效，<b>不用重开存档</b>。<br>时间卡住、内心话不动，这一页也能顺手改掉。' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
      '<div style="flex:1.6;"><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">世界时间</div><input id="moon-roster-world-time" value="' + escapeFeatureHtml(world.时间 || '') + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:11px;font-family:inherit;"></div>' +
      '<div style="flex:1;"><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">地点</div><input id="moon-roster-world-place" value="' + escapeFeatureHtml(world.地点 || '') + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:11px;font-family:inherit;"></div></div>' +
      '<div style="max-height:46dvh;overflow-y:auto;padding-right:3px;">' + rows + '</div>';
    showModalDialog('角色定位 · 顺便修时间和内心话', html, function() {
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
      const fmPending = [];
      mask.querySelectorAll('.moon-roster-row').forEach(function(row) {
        const name = row.getAttribute('data-name');
        const ch = stat.角色[name]; if (!ch) return;
        const sel = row.querySelector('.moon-roster-imp');
        if (sel) { const v = String(sel.value || ''); if (['主要', '次要', 'NPC'].indexOf(v) >= 0) ch.重要度 = v; }
        const pBtn = row.querySelector('.moon-roster-presence');
        if (pBtn) ch.在场 = pBtn.getAttribute('data-on') === '1';
        const vInput = row.querySelector('.moon-roster-voice');
        if (vInput) { const v = String(vInput.value || '').trim(); if (v) ch.心声 = v.slice(0, 300); }
        /* 点了「补掷」：清掉旧的初见结论，重新走一次结算。
           自己往变量里加的人、或者旧存档里从没掷过的角色，都靠这个补上开局投资。 */
        const fBtn = row.querySelector('.moon-roster-firstmeet');
        if (fBtn && fBtn.getAttribute('data-on') === '1') {
          if (!ch._quota) ch._quota = {};
          ch._quota._firstMeetDone = false;
          ch._quota._初见待结算 = true;
          try { delete ch._quota._初见; } catch (e) { ch._quota._初见 = null; }
          fmPending.push(name);
        }
      });
      writeMvuLatest(stat).then(async function(ok) {
        if (!ok) { toast('写入失败', 'warning'); return; }
        let fmNote = '';
        for (let i = 0; i < fmPending.length; i++) {
          const n = fmPending[i];
          try {
            const inv = await processFirstMeetForChar(n, stat.角色[n], getCurrentMode(), { allowScriptRoll: true, force: true, source: '面板补掷' });
            if (inv) fmNote += (fmNote ? '、' : '') + n + ' E' + (inv.delta >= 0 ? '+' : '') + inv.delta + '（' + inv.tier + '）';
          } catch (e) {}
        }
        if (fmNote) { await writeMvuLatest(stat); toast('初见已掷：' + fmNote, 'success'); }
        else toast('改好了，下一轮就生效', 'success');
        try { injectEventPrompt(); } catch (e) {}
        try { refreshPanel(); } catch (e) {}
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
      mask.querySelectorAll('.moon-roster-firstmeet').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const next = btn.getAttribute('data-on') !== '1';
          btn.setAttribute('data-on', next ? '1' : '0');
          btn.style.borderColor = next ? 'rgba(244,114,182,0.8)' : 'rgba(168,85,247,0.45)';
          btn.style.background = next ? '#4a1030' : '#2a1040';
          btn.textContent = next ? '待掷' : '补掷';
        });
      });
    } });
  }

  function openRerollDialog(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色) { showModalDialog('数值重Roll', '<div>当前没有可用的角色数据。</div>', null, { confirmText: '关闭' }); return; }
    const chars = data.stat_data.角色;
    const charNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (!charNames.length) { showModalDialog('数值重Roll', '<div>没有角色可供重Roll。</div>', null, { confirmText: '关闭' }); return; }
    const html = '<div style="font-size:11.5px;color:#94a3b8;margin-bottom:8px;">给谁重摇？</div>' +
      '<select id="moon-reroll-char" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;">' + charNames.map(function(n) { return '<option value="' + escapeFeatureHtml(n) + '">' + escapeFeatureHtml(n) + '</option>'; }).join('') + '</select>' +
      '<div id="moon-reroll-info" style="margin-top:12px;padding:10px;background:#171a22;border-radius:8px;font-size:11px;line-height:1.7;color:#cbd5e1;min-height:80px;">点下面「重Roll」开始</div>' +
      '<div id="moon-reroll-manual" style="display:none;margin-top:10px;padding:10px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);border-radius:8px;font-size:11px;color:#fde68a;">' +
        '<div style="margin-bottom:6px;">这一轮没找到 AI 的判定 → 你自己定一个：</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
        '<select id="moon-reroll-dir" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(251,191,36,0.35);background:#171a22;color:#e2e8f0;font-size:11px;font-family:inherit;"><option value="正向">正向</option><option value="负向">负向</option></select>' +
        '<select id="moon-reroll-dim" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(251,191,36,0.35);background:#171a22;color:#e2e8f0;font-size:11px;font-family:inherit;"><option value="E">好感 E</option><option value="P">肉体 P</option><option value="I">嫉妒 I</option></select>' +
        '<input id="moon-reroll-base" type="number" step="0.5" min="0" max="10" style="width:74px;padding:6px;border-radius:6px;border:1px solid rgba(251,191,36,0.35);background:#171a22;color:#e2e8f0;font-size:11px;font-family:inherit;"></div>' +
        '<div style="margin-top:6px;color:#a16207;line-height:1.6;">这只用于这次重摇，不会改掉剧情里已经发生的事。</div>' +
      '</div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;">' +
      '<button id="moon-reroll-do" style="flex:1;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#f4f1ea;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">重Roll</button>' +
      '<button id="moon-reroll-confirm" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(16,185,129,0.5);background:#052e20;color:#6ee7b7;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;" disabled>确认覆盖</button></div>' +
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
    showModalDialog('数值重Roll', html, null, {
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
          if (pendingResult.newWeeklyUsed !== undefined) {
            if (!target._quota || typeof target._quota !== 'object') target._quota = {};
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

  /* ── 自助答疑 ───────────────────────────────────────────────
     原则：先让人对上「我遇到的是哪种情况」，再给一句人话答案 +
     具体点哪里。不写术语，不写「请检查配置」。 */
  const FAQ_CATS = [
    { id: 'start', name: '第一次玩' },
    { id: 'number', name: '数字不对' },
    { id: 'story', name: '剧情和时间' },
    { id: 'error', name: '出错了' },
    { id: 'tune', name: '想调设置' }
  ];
  const FAQ_LIST = [
    /* 第一次玩 */
    { cat: 'start', q: '第一次玩，第一步点哪里？', keys: ['第一次', '新手', '开始', '入门', '上手'],
      a: '看最上面那条粉色提示，它会告诉你现在该做什么。<br>还没有人物档案时，点右边的 <b>帮我建档案</b>，等它跑完就行。<br>只建一次，之后正常聊天，数字会自己涨。' },
    { cat: 'start', q: '建完档案还要做什么？', keys: ['建档', '之后', '接下来', '干嘛'],
      a: '什么都不用做，回酒馆正常聊天。<br>Ta加分减分都由这台掌机算，AI 只能打暗号，改不了数。' },
    { cat: 'start', q: '要装别的东西吗？', keys: ['依赖', 'mvu', '安装', '前置', '插件'],
      a: '不用装任何东西，也<b>不需要 MVU</b>。<br>所有数据都存在这台掌机里，跟别的插件不冲突。' },
    { cat: 'start', q: '找不到入口 / 点了没反应', keys: ['刷新', '导入', '菜单', '入口', '没反应'],
      a: '先确认脚本是<b>已启用</b>状态，再刷新一次酒馆页面。<br>入口在右上角扩展菜单里，图标是 <b></b>。' },
    { cat: 'start', q: '这台掌机上一堆按钮，都是干什么的？', keys: ['看不懂', '说明', '按钮', '说明书', '教程'],
      a: '点最下面那排的 <b>说明书</b>，它会一步一步指着告诉你哪个是哪个，30 秒看完。<br>看完就关了，不会再打扰你。' },

    /* 数字不对 */
    { cat: 'number', q: '好感不涨 / 加分太少', keys: ['不涨', '加分', '太少', '好感'],
      a: '先看 <b>开始游戏 → 重摇这一轮</b>。<br>它会告诉你这次是按什么算的：AI 判定、本楼暗号，还是你手填。<br>不涨多半是 AI 这轮没打暗号，退一步手选方向也能摇。' },
    { cat: 'number', q: '重摇显示「没有记录」', keys: ['无记录', '重roll', '重摇', '判断'],
      a: '意思是这一轮 AI 没给这个角色打暗号。<br>现在会自动退一步：先试本楼暗号，还不行就让你<b>手动选方向、填数值</b>，照样能摇。' },
    { cat: 'number', q: '时间和内心话不动了', keys: ['时间', '心声', '内心话', '不推进', '卡住'],
      a: '多半是这轮 AI 没写时间。<br>想马上修：<b>角色与存档 → 查看 / 修改档案</b>，直接手写时间、地点、内心话，保存立刻生效。' },
    { cat: 'number', q: 'AI 把别人当主角了', keys: ['次要', '重要度', '角色定位', '攻略对象', '认错'],
      a: '<b>角色与存档 → 查看 / 修改档案</b>，把Ta改成<b>主要</b>。<br>改完 AI 下一轮就会围着Ta写，<b>不用重开档</b>。' },
    { cat: 'number', q: '好感卡在 18 / 38 / 58 上不去', keys: ['阶段门', '卡住', '升级', '破门', '冻结'],
      a: '这是「关系升级」的关口，不是坏了。<br>到 <b>18 / 38 / 58 / 78 / 98</b> 这五个点会停下来判一次「能不能更进一步」，过了才升级。<br>没过就等更好的时机，可以继续聊天攒机会。' },
    { cat: 'number', q: '每周加分有上限吗？', keys: ['上限', '每周', '额度', '清零'],
      a: '有。<b>开始游戏 → 检查每周上限</b> 能看这周还剩多少，也能手动清零。<br>这是为了防止一直聊同一件事把分刷爆。' },
    { cat: 'number', q: '事件太久没来了', keys: ['事件', '节奏', '频率', '没有事件'],
      a: '大约每 <b>8~12 回合</b>来一个日常小事件。<br>嫌慢嫌快：<b>玩法与手感 → 小事件来得多勤</b>，慢 / 中 / 快三档都能调。' },
    { cat: 'number', q: '开局给的分太高 / 太低', keys: ['初见', '开局', '底分', '保底'],
      a: '<b>玩法与手感 → 初见投资</b> 能切两种：<br><b>纯骰子</b>——第一次见面给多少全凭运气；<br><b>骰子 + 人设</b>——AI 只判断Ta吃不吃你这一套，数值仍由骰子定。<br>没过也有 1~4 点保底，不会一分不给。' },

    /* 剧情和时间 */
    { cat: 'story', q: '时间是怎么走的？', keys: ['时间推进', '十分钟', '游戏日', '时间'],
      a: '你每发一句话，时间往前 <b>10 分钟</b>，像真的在一起过日子。<br>过了半夜就算新的一天。<br>要跳到几小时后或第二天，<b>得你自己说一声</b>（「我们明天见」「睡了」），或者正文里写「次日 / 一周后」。' },
    { cat: 'story', q: '「锚定时间线」是什么？', keys: ['锚定', '时间线', '锁定', '回不了头'],
      a: '一个<b>回不了头</b>的开关，在「玩法与手感」最下面。<br>打开后，只要Ta好感跌破 0 或者跟你冷战，这段剧情就锁死：删楼、滑动、重摇、刷好感都解不开，<b>只能开新对话</b>。<br>不打开就完全不影响你。' },
    { cat: 'story', q: 'AI 回复末尾那个 [Sylveina|…] 是什么？', keys: ['标签', 'sylveina', '暗号', '括号'],
      a: '那是给掌机看的<b>暗号</b>，你不用管。<br>AI 只打暗号，具体加多少由掌机摇骰子算，AI 改不了数。<br>正常情况下它会自动收起来，不会出现在正文里。' },
    { cat: 'story', q: '沉浸模式怎么用？', keys: ['沉浸', 'gal', '全屏', '退出'],
      a: '主菜单点 <b>沉浸模式</b>，全屏读剧情，点一下往下走一句，像玩 Galgame。<br>想退出按 <b>Esc</b>，或者点右上角的退出按钮。' },
    { cat: 'story', q: '世界大事表要不要写？', keys: ['时间线', 'timeline', '主线', '大事表'],
      a: '不写也能玩。<br>写了的话 AI 会照着上面的日期安排主线大事，世界更有目标感。<br>懒得写就让 AI 编一份：<b>冒险日志 → 让 AI 编一份</b>。' },

    /* 出错了 */
    { cat: 'error', q: '面板打不开 / 白屏', keys: ['打不开', '白屏', '报错', '崩'],
      a: '先刷新一次酒馆页面。<br>还不行就走一趟 <b>系统检修 → 系统自检</b>，它一条条列给你哪项不正常。<br>把结果截图发帖，比描述半天管用。' },
    { cat: 'error', q: '和别的插件打架了？', keys: ['冲突', '打架', '重复', '撞'],
      a: '<b>系统检修 → 冲突扫描</b>，查世界书里有没有重复或者互相打架的条目。<br>拿不准就点旁边的 <b>让 AI 帮我看</b>，它读完给结论。' },
    { cat: 'error', q: '更新拉不到新版', keys: ['更新', '新版', '失败', '线路'],
      a: '<b>系统选项 → 检查更新</b> 会自动换线路重试。<br>全都失败就是网络问题，过一会儿再点，或者手动导入新的 JSON。' },
    { cat: 'error', q: '换聊天了，档案还在吗？', keys: ['换聊天', '存档', '搬家', '迁移'],
      a: '档案跟着<b>这条聊天</b>走，所以换新聊天等于从头开始。<br>想接着玩：<b>开始游戏 → 搬旧存档</b>，把原来的档案带过去。' },

    /* 想调设置 */
    { cat: 'tune', q: '难度选哪个？', keys: ['难度', '地狱', '简单', '选哪个'],
      a: '<b>玩法与手感 → 游戏难度</b>，四档都写了区别。<br>拿不准就选中间那档，<b>随时能改，不用重开</b>。' },
    { cat: 'tune', q: '想换状态卡的样子', keys: ['皮肤', '外观', '状态卡', '换样子'],
      a: '<b>系统选项</b> 里能换状态卡外观，点一下就能预览，不用保存再刷新。' },
    { cat: 'tune', q: '想让Ta说话更像本人', keys: ['试镜', '小抄', '像不像', '说话不像'],
      a: '<b>角色与存档 → 让Ta试演一段</b>：AI 先读角色卡写一份小抄，再演一小段给你看。<br>不像就写意见让它重演，满意了就存下来。存下来之后 AI 演Ta会明显更像。' },
    { cat: 'tune', q: '想让插件单独用一个 AI', keys: ['api', '模型', '钥匙', '接口'],
      a: '<b>系统选项 → AI 钥匙</b>。<br>不填也能用，直接用你酒馆里那个 AI。只有想换模型、或嫌它演得不对，才需要填。' }
  ];

  function openFaqDialog() {
    const chips = '<div id="moon-faq-chips">' +
      '<button type="button" class="mp-faq-chip active" data-cat="all">全部</button>' +
      FAQ_CATS.map(function(c) { return '<button type="button" class="mp-faq-chip" data-cat="' + c.id + '">' + c.name + '</button>'; }).join('') +
      '</div>';
    const html = '<div class="mp-faq-tip">先选一个最像你现在的情况；找不到就打个词搜，比如「时间」「认错」。</div>' +
      chips +
      '<input id="moon-faq-search" class="mp-faq-search" type="search" placeholder="搜一下，比如：不涨 / 卡住 / 退出" autocomplete="off">' +
      '<div id="moon-faq-list"></div>' +
      '<div class="mp-faq-foot">还是没有？走一趟 <b>系统检修 → 系统自检</b>，把结果截图发帖，比描述半天管用。</div>';

    showModalDialog('遇到问题', html, null, {
      confirmText: '知道了',
      onOpen: function(mask) {
        const input = mask.querySelector('#moon-faq-search');
        const list = mask.querySelector('#moon-faq-list');
        let cat = 'all';

        function render() {
          const kw = String(input.value || '').trim().toLowerCase();
          const items = FAQ_LIST.filter(function(item) {
            if (cat !== 'all' && item.cat !== cat) return false;
            if (!kw) return true;
            return (item.q + ' ' + item.keys.join(' ') + ' ' + item.a).toLowerCase().indexOf(kw) >= 0;
          });
          if (!items.length) {
            list.innerHTML = '<div class="mp-faq-empty">没找到。<br>换个词试试，或者点上面的「全部」。</div>';
            return;
          }
          list.innerHTML = items.map(function(item, i) {
            return '<div class="mp-faq-item" data-cat="' + item.cat + '" data-open="' + (kw && items.length <= 2 ? '1' : '0') + '">' +
              '<button type="button" class="mp-faq-q"><span>' + item.q + '</span><i>▾</i></button>' +
              '<div class="mp-faq-body"><div class="mp-faq-clip"><div class="mp-faq-a">' + item.a + '</div></div></div>' +
              '</div>';
          }).join('');
          list.querySelectorAll('.mp-faq-item').forEach(function(el) {
            const q = el.querySelector('.mp-faq-q');
            q.setAttribute('aria-expanded', el.getAttribute('data-open') === '1' ? 'true' : 'false');
            q.addEventListener('click', function() {
              const next = el.getAttribute('data-open') !== '1';
              el.setAttribute('data-open', next ? '1' : '0');
              q.setAttribute('aria-expanded', next ? 'true' : 'false');
            });
          });
        }

        mask.querySelectorAll('.mp-faq-chip').forEach(function(chip) {
          chip.addEventListener('click', function() {
            mask.querySelectorAll('.mp-faq-chip').forEach(function(c) { c.classList.remove('active'); });
            chip.classList.add('active');
            cat = chip.getAttribute('data-cat');
            render();
          });
        });
        input.addEventListener('input', render);
        render();
      }
    });
  }
