  /* 时钟指纹用的文本：把脚本自己会删掉的东西先抠干净。

     为什么要这一步 —— 同一楼层 message_received 可能触发两次（再来一次 / 手滑）。
     以前指纹直接哈希原文，可原文在处理过程中会被清洗（标签、s 占位、
     后台变量行全被删），于是第二次算出来的指纹不同，被当成新楼层，
     时钟又走 10 分钟、回合又 +1。玩家看到的就是「刷新一下时间就变了」。
     只要两次拿到的都是「清洗后等价」的文本，指纹就稳定。 */
  function normalizeClockSigText(text) {
    let t = String(text || '');
    try { t = t.replace(SYLVEINA_TAG_GLOBAL_RE, ''); } catch (e) {}
    try { t = t.replace(VOICE_TAG_GLOBAL_RE, ''); } catch (e) {}
    /* 反向模式的任务板行 */
    t = t.replace(/(?:^|\r?\n)[ \t]*\[板\][^\r\n]*/gi, '');
    /* 后台变量行 / MVU 块 / 状态占位 */
    t = t.replace(/(?:^|\r?\n)\s*(?:角色\.[^\r\n=]+=[^\r\n]*|世界\.时间=[^\r\n]*|<UpdateVariable>[\s\S]*?<\/UpdateVariable>|<StatusPlaceHolderImpl\s*\/>)/gi, '');
    /* 单独一行的 s（sanitize 补的占位，也会被删） */
    t = t.replace(/(?:^|\r?\n)[ \t]*s[ \t]*(?=\r?\n|$)/gi, '');
    return t.replace(/\s+/g, ' ').trim();
  }

  /* ── 「上一轮到底结没结算」留痕 ────────────────────────────────────────────
     玩家最常见的困惑是「我回复了，好感没动，是不是脚本没跑」。
     脚本有没有跑只有它自己知道，所以每轮把结论写下来，面板直接读：
     几个标签、谁涨了几分、有没有被周上限压住。 */
  const LAST_SETTLE_KEY = 'moon_last_settle_v1';
  function saveLastSettle(rec) {
    try {
      const st = getStorage();
      if (!st) return false;
      st.setItem(LAST_SETTLE_KEY + '_' + getChatStateKey(), JSON.stringify(rec));
      return true;
    } catch (e) { return false; }
  }
  function loadLastSettle() {
    try {
      const st = getStorage();
      const raw = st && st.getItem(LAST_SETTLE_KEY + '_' + getChatStateKey());
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) { return null; }
  }

  async function runMoonCalculation() {
    try {
      const data = readMvuLatest();
      if (!data || !data.stat_data || !data.stat_data.角色) return;
      const statData = data.stat_data;
      const chars = statData.角色;
      const world = statData.世界 || (statData.世界 = { 时间: '2000年01月01日 · 星期六 · 00:00', _内部流逝天数: 0, _上次推进时间: '2000年01月01日 · 星期六 · 00:00' });
      const mode = getCurrentMode();
      const latestAi = getLatestAiMessage();
      const latestAiText = latestAi && latestAi.msg ? String(latestAi.msg.mes || '') : '';
      const activeCharNames = Object.keys(chars).filter(function(k) {
        return k !== '示例角色' && k !== 'You' && k !== '你' && chars[k] && !isCharSkeleton(chars[k]);
      });
      // 还没有任何有效角色（开场白楼层 / 空档）时，本轮不算一回合，也不推进世界时钟：
      // 否则玩家一句话都没说，时间已经走了 10 分钟、回合数也先跳了 1。
      if (activeCharNames.length === 0) return;
      ensureWorldClockFields(world);
      const clockSig = latestAi ? 'f' + latestAi.idx + ':' + stableFeatureHash(normalizeClockSigText(latestAiText)) : 't:' + String(world.时间 || '');
      // 同一楼层只推进一次时钟，避免 message_received 与 generation_ended 重复结算
      if (world._lastClockSig !== clockSig) {
        world._回合 = Math.max(0, Math.floor(Number(world._回合) || 0)) + 1;
        const clockInfo = advanceWorldClock(world, latestAiText);
        world._lastClockSig = clockSig;
        if (clockInfo.ok) {
          statData._最后推进 = { 来源: clockInfo.source, 分钟: clockInfo.minutes, 天数: clockInfo.days, 是否拦截: clockInfo.clamped, 到: clockInfo.to, 被拦下的目标: clockInfo.blockedTo || '' };
        }
        /* 夹回必须出声。以前这里是静默的：AI 写「次日清晨」、脚本只推 10 分钟、那行时间还被从正文删了，
           玩家看到的是「时钟几乎不动、AI 说的话少了一句」，像坏了。现在给一句人话。 */
        if (clockInfo.clamped) {
          try {
            toast('时间被脚本挡住了：AI 想推到 ' + (clockInfo.blockedTo || '很后面') + '，这轮只走了 ' + clockInfo.minutes + ' 分钟。要跨天就在你的话里写「第二天」。', 'warning');
          } catch (e) {}
        }
      }
      const currentTime = world.时间 || '';
      // 时钟已经推进，先处理到期周期，再结算本轮好感度，避免跨周后仍吃旧周额度。
      const countdownActions = checkAllCountdowns(statData);

      const changedChars = [];
      const stageChangedChars = [];
      const weeklyBlockedChars = [];
      const gateLogs = [];
      const eventLogs = [];
      const achievementRequests = [];
      const endingRequests = [];
      const turnSignature = latestAi ? String(latestAi.idx) + ':' + stableFeatureHash(latestAiText.replace(SYLVEINA_TAG_GLOBAL_RE, '').trim()) : stableFeatureHash(String(currentTime));
      const parsedTags = extractAllSylveinaTags(latestAiText);
      const primaryTarget = pickPrimaryTarget(chars, activeCharNames);
      /* 一个 [初见|…] 标签只能被消费一次。
         本轮如果有刚建档、还没吃过初见骰的人，就先把标签留给他们中的一个；
         老存档里 _firstMeetDone=false 的角色不许截胡，否则新人只能吃兜底档位。 */
      const firstMeetPending = activeCharNames.filter(function(n) {
        const c = chars[n];
        return c && c._quota && c._quota._初见待结算 === true && c._quota._firstMeetDone !== true;
      });
      const firstMeetTagOwner = firstMeetPending.length ? firstMeetPending[0] : null;

      let wbEntries = [];
      try { wbEntries = await getAllWorldbookEntries(); } catch (e) {}

      for (const name of activeCharNames) {
        const ch = chars[name];
        if (!ch || isCharSkeleton(ch)) continue;
        if (!ch._quota) ch._quota = {};
        if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
        const oldRBeforeTurn = Number(ch.阶段值) || 0;

        try {
          /* 初见骰子：建档时会当场掷一次并清掉「待结算」标记。
             这里兜的是另一种情况——建档当时写入失败、或者角色那时还没到场，
             标记还挂着；只要这一轮文本点到了名字，就地补掷，不再无限期等 AI 标签。
             老存档没有这个标记，仍然只认 AI 写的 [初见|…]，不会被二次收费。 */
          const fmPending = ch._quota._初见待结算 === true;
          const fmResult = await processFirstMeetForChar(name, ch, mode, fmPending ? {
            allowScriptRoll: true,
            force: true,
            noTag: firstMeetPending.length > 0 && name !== firstMeetTagOwner,
            source: latestAiText.indexOf(name) >= 0 ? '入场补掷（点名）' : '入场补掷（在场）'
          } : { noTag: firstMeetPending.length > 0 });
          if (fmResult) gateLogs.push({ type: 'event_update', char: name, event: { type: 'first_meet', result: fmResult } });
        } catch (e) {}
        try {
          const dbResult = await processDebuffIfTagged(name, ch, mode);
          if (dbResult) gateLogs.push({ type: 'event_update', char: name, event: { type: 'debuff', result: dbResult } });
        } catch (e) {}

        // 若本楼层检测到 Sylveina 标签且尚未对该角色结算，则自动写入 ch._lastRoll
        const matchedTag = matchTagForCharacter(parsedTags, name, activeCharNames.length, primaryTarget);
        const latestFloorIdx = latestAi ? Number(latestAi.idx) : -1;
        const floorNotRewound = (ch._quota._lastCalcFloor === undefined) || (latestFloorIdx >= Number(ch._quota._lastCalcFloor));
        if (matchedTag && ch._quota._lastCalculatedTurnSig !== turnSignature && floorNotRewound) {
          const esType = (ch._quota._eventState && ch._quota._eventState.事件类型) || '';
          // 【脚本主导】事件类型只认事件导演的判定，AI 标签里的 L/M/H 一律不参与。
          // 否则模型填一个 H 就能把日常戏升格成重大事件，绕过事件导演去触发成就与额外结算。
          const resolvedEventType = (esType === '重大' || esType === '彩蛋') ? '重大' : (esType || '日常');
          // 区间是脚本定的，结算时必须由脚本执行：给了超范围的值只取边界
          const baseClamped = clampBaseToEventRange(Number(matchedTag.baseValue) || 0, resolvedEventType);
          ch._lastRoll = {
            事件类型: resolvedEventType,
            方向: matchedTag.direction || '正向',
            主维度: matchedTag.dimension || 'E',
            基础值: baseClamped.value,
            _applied: false,
            _turnSig: turnSignature,
            // 留痕：面板/自检能看出这一轮 AI 有没有越权，以及脚本怎么处理的
            _脚本校准: {
              标签等级: matchedTag.level || '',
              标签基础值: Number(matchedTag.baseValue) || 0,
              等级来源: esType ? '事件导演' : '默认日常',
              基础值已夹紧: baseClamped.clamped
            }
          };
        }

        const lastRoll = readLastRoll(ch);
        if (lastRoll && lastRoll.主维度 && !lastRoll._applied) {
          ch._quota._preRollSnapshot = {
            好感度: Number(ch.好感度) || 0,
            肉体值: Number(ch.肉体值) || 0,
            阶段值: Number(ch.阶段值) || 0,
            嫉妒值: Number(ch.嫉妒值) || 0,
            好感度周上限已用: Number(ch._quota.好感度周上限已用) || 0,
            turnSig: turnSignature
          };
          if (lastRoll.事件类型 === '重大') {
            achievementRequests.push({ charName: name, eventType: '重大事件', reason: String(lastRoll.主维度) + '向剧烈转折', key: turnSignature + '::' + name + '::major' });
          }
          const result = computeCharDelta(ch, lastRoll, mode);
          if (result && result.delta !== 0) {
            ch[result.fieldName] = result.newValue;
            changedChars.push({ name: name, field: result.fieldName, delta: result.delta, newValue: result.newValue });
          }
          /* 被周上限压住：这一轮不是「脚本没跑」，而是额度真的用完了。
             以前只写日志、界面上一点动静都没有，玩家只会觉得好感卡住不动了。 */
          if (result && result.weeklyBlocked && Number(lastRoll.基础值) > 0) weeklyBlockedChars.push(name);
          // 保留 _lastRoll 供阶段门判定与面板「🎲 属性点重掷」读取，仅标记已结算
          ch._lastRoll = {
            事件类型: lastRoll.事件类型,
            方向: lastRoll.方向,
            主维度: lastRoll.主维度,
            基础值: lastRoll.基础值,
            // 越权留痕要跟着走，否则面板/自检里看不到这一轮 AI 写了什么
            _脚本校准: lastRoll._脚本校准 || null,
            _applied: true,
            _turnSig: turnSignature
          };
          ch._quota._lastCalculatedTurnSig = turnSignature;
          if (latestFloorIdx >= 0) ch._quota._lastCalcFloor = latestFloorIdx;
        }

        const gateLog = processGateForChar(name, ch, currentTime, mode);
        if (gateLog) gateLogs.push(gateLog);
        syncStageWithAffection(ch);
        try { computePlayerConfession(ch, mode, currentTime); } catch (e) {}

        const newRAfterTurn = Number(ch.阶段值) || 0;
        if (newRAfterTurn !== oldRBeforeTurn) {
          stageChangedChars.push(name);
        }

        try {
          const evt = await processEventSystem(name, ch, currentTime, world, wbEntries);
          if (evt) {
            eventLogs.push({ char: name, event: evt });
            if (evt.isMajor || evt.isEgg || evt.dice === 20) {
              const isEggUnlock = evt.isEgg || evt.dice === 20;
              achievementRequests.push({ charName: name, eventType: isEggUnlock ? '彩蛋事件' : '重大事件', reason: isEggUnlock ? '事件骰掷出 1d20=20' : (evt.name || '世界线重大转折'), key: turnSignature + '::' + name + (isEggUnlock ? '::egg' : '::major') });
            }
          }
        } catch (e) {}
        try {
          const ending = isEndingTriggerCondition(name, ch, latestAiText, latestAi ? latestAi.idx : -1);
          if (ending.triggered) endingRequests.push({ charName: name, charData: ch, ending: ending });
        } catch (e) {}
      }

      const ok = await writeMvuLatest(statData, { showLoading: stageChangedChars.length > 0 });
      if (!ok) { try { console.warn('[Doki] 变量写回失败：', lastWriteError); } catch (e) {} return; }
      if (stageChangedChars.length > 0) {
        try { triggerBioRewriteFor(stageChangedChars); } catch (e) {}
      }
      achievementRequests.forEach(function(request) {
        if (markAchievementTrigger(request.key)) triggerAchievementUnlock(request.charName, request.eventType, request.reason, request.key).catch(function(e) { try { console.warn('[Doki] 成就记录失败：', e); } catch (ignore) {} });
      });
      // 结局只能由玩家在面板主动发起「周目结算」。
      // 旧实现在这里无条件弹「终局报幕确认」窗（窗里就写着后日谈按钮），
      // 完全绕过了 armEndingFlow 闸门，开局第 1、2 楼也会弹。现在只给一次不打断的提示。
      endingRequests.forEach(function(request) {
        if (markEndingPrompted(request.charName, request.ending.type)) {
          try { toast('《' + request.charName + '》可以进行周目结算了 —— 系统面板 → 人物图鉴与存档 → 回忆与结局，点「结算这一局」', 'success'); } catch (e) {}
        }
      });
      if (gateLogs.length) { try { injectGateNotice(gateLogs); } catch (e) {} }
      if (eventLogs.length) { try { injectGateNotice(eventLogs.map(function(x) { return { type: 'event_update', char: x.char, event: x.event }; })); } catch (e) {} }
      if (changedChars.length) {
        try {
          const msg = changedChars.map(function(c) { return c.name + ' ' + c.field + ' ' + (c.delta >= 0 ? '+' : '') + c.delta + ' → ' + c.newValue; }).join('；');
          console.log('[Doki] 数值更新：', msg);
          toast('数值更新：' + msg, 'info');
        } catch (e) {}
      }
      /* 攻略模式：五条挂点，全部包在 try 里 —— 这一段坏掉不许影响主结算。 */
      try { reverseSyncRolePoints(changedChars); } catch (e) {}
      try { if (stageChangedChars.length) reverseGrantGateTickets(stageChangedChars); } catch (e) {}
      try { reverseMaybeRefreshShelves(false); } catch (e) {}
      try { reverseCheckAchievements(statData); } catch (e) {}
      try { reverseTickTasks(statData, changedChars); } catch (e) {}
      if (weeklyBlockedChars.length) {
        try {
          const cap = Number((MOON_FORMULA_PARAMS.weeklyCap[mode] || MOON_FORMULA_PARAMS.weeklyCap.normal)).toFixed(1);
          const key = 'moon_quota_hint_' + getChatStateKey() + '_' + String(currentTime || '').slice(0, 11);
          const store = getStorage();
          const shown = store ? store.getItem(key) : '1';
          if (!shown) {
            if (store) store.setItem(key, '1');
            toast('本周好感额度已满（' + cap + '）：' + weeklyBlockedChars.join('、') + ' 这轮只走剧情、不再加分。游戏内过满 7 天会自动重置。', 'warning');
          }
          console.log('[Doki] 周上限已满：', weeklyBlockedChars.join('、'), '上限', cap);
        } catch (e) {}
      }
      try { refreshPanel(); } catch (e) {}
      try {
        saveLastSettle({
          at: Date.now(),
          floor: latestAi ? Number(latestAi.idx) : -1,
          turn: Math.max(0, Math.floor(Number(world._回合) || 0)),
          tags: parsedTags.length,
          changed: changedChars.map(function(c) { return { name: c.name, field: c.field, delta: c.delta, newValue: c.newValue }; }),
          blocked: weeklyBlockedChars.slice(),
          clamp: statData._最后推进 && statData._最后推进.是否拦截 ? String(statData._最后推进.来源 || '') : ''
        });
      } catch (e) {}
      /* 把这一轮实际生效的增量交回去：正文里那个数值徽章要按它改写，
         否则玩家看到「▲ +3」、状态卡只涨 1.5，第一反应就是脚本坏了。 */
      return { countdownActions: countdownActions, changedChars: changedChars, weeklyBlockedChars: weeklyBlockedChars };
    } catch (e) { try { console.warn('[Doki] 计算流程异常：', e); } catch (e2) {} return null; }
  }

  function processEventSystem(charName, ch, currentTimeStr, worldStat, worldbookEntries) {
    return new Promise(function(resolve) {
      try {
        const currentDate = parseGameTime(currentTimeStr);
        if (!currentDate) { resolve(null); return; }
        if (!ch._quota) ch._quota = {};
        let eventState = ch._quota._eventState || {};
        if (eventState.当前事件 === undefined) eventState.当前事件 = '';
        if (eventState.事件类型 === undefined) eventState.事件类型 = '';
        if (eventState.剩余回合 === undefined) eventState.剩余回合 = 0;
        if (eventState.冷却回合 === undefined) eventState.冷却回合 = 0;
        if (eventState.强制日常期 === undefined) eventState.强制日常期 = 0;
        if (eventState.上次投掷内部天数 === undefined) eventState.上次投掷内部天数 = 0;
        if (eventState.上次大事件内部天数 === undefined) eventState.上次大事件内部天数 = 0;
        const worldGameDay = Number(worldStat && worldStat._游戏日) || Math.floor(Number(worldStat && worldStat._内部流逝天数) || 0);
        const worldInternalDays = worldGameDay;
        const turnNo = Math.max(0, Math.floor(Number(worldStat && worldStat._回合) || 0));
        const pacing = getEventPacing();
        // 短线节拍（日常/重大事件）按「回合」，长线冷却按「游戏日」
        // daily/major 是事件占用回合数，judgeEvery 是两次判定间隔回合，majorCdDays 是重大事件冷却天数
        const rules = {
          Adi: { daily: 8, major: 15, cd: 3, judgeEvery: 12, majorCdDays: 5 },
          And: { daily: 5, major: 10, cd: 3, judgeEvery: 10, majorCdDays: 4 },
          All: { daily: 3, major: 5, cd: 3, judgeEvery: 8, majorCdDays: 3 }
        };
        const rule = rules[pacing] || rules.And;
        // 旧存档平滑迁移：回合/游戏日字段缺失时以当前值为基准，避免出现「跨版本立刻连出事件」
        if (eventState.上次投掷回合 === undefined || !isFinite(Number(eventState.上次投掷回合))) eventState.上次投掷回合 = turnNo;
        if (eventState.上次大事件游戏日 === undefined || !isFinite(Number(eventState.上次大事件游戏日))) eventState.上次大事件游戏日 = worldGameDay;
        eventState.上次投掷回合 = Number(eventState.上次投掷回合) || 0;
        eventState.上次大事件游戏日 = Number(eventState.上次大事件游戏日) || 0;
        const entries = Array.isArray(worldbookEntries) ? worldbookEntries : [];
        /* 时间线总开关：关掉就整条链路都不读（连世界书里现成的时间线也不读），
           存着的条目原样留着，玩家想再开就再开。判据只有 timelineActiveEvents 一处。 */
        const timelineEvents = timelineActiveEvents(entries);
        let completed = ch._quota._timelineCompleted || [];
        if (!Array.isArray(completed)) completed = [];
        let triggeredTimeline = null;
        for (const evt of timelineEvents) {
          if (evt.done) continue;
          if (completed.indexOf(evt.name) >= 0) continue;
          const eventTime = parseGameTime(evt.time);
          if (eventTime && currentDate.getTime() >= eventTime.getTime()) { triggeredTimeline = { name: evt.name, isMajor: evt.isMajor }; break; }
        }
        if (triggeredTimeline) {
          completed.push(triggeredTimeline.name);
          ch._quota._timelineCompleted = completed;
          try { markTimelineDoneByName(triggeredTimeline.name); } catch (e) {}
          eventState.当前事件 = triggeredTimeline.name;
          eventState.事件类型 = triggeredTimeline.isMajor ? '重大' : '日常';
          eventState.剩余回合 = triggeredTimeline.isMajor ? rule.major : rule.daily;
          eventState.冷却回合 = 0; eventState.强制日常期 = 0;
          if (triggeredTimeline.isMajor) eventState.上次大事件内部天数 = worldInternalDays;
          ch._quota._eventState = eventState;
          resolve({ type: 'world_event', name: eventState.当前事件, isMajor: triggeredTimeline.isMajor, rounds: eventState.剩余回合 });
          return;
        }
        if (eventState.当前事件 && eventState.剩余回合 > 0) {
          eventState.剩余回合 -= 1;
          if (eventState.剩余回合 <= 0) {
            eventState.当前事件 = ''; eventState.事件类型 = ''; eventState.冷却回合 = rule.cd;
            ch._quota._eventState = eventState;
            resolve({ type: 'event_end', name: '事件结束', cd: rule.cd });
            return;
          }
          ch._quota._eventState = eventState;
          resolve({ type: 'event_progress', name: eventState.当前事件, remaining: eventState.剩余回合 });
          return;
        }
        if (eventState.冷却回合 > 0) {
          eventState.冷却回合 -= 1;
          ch._quota._eventState = eventState;
          resolve({ type: 'cooldown', remaining: eventState.冷却回合 });
          return;
        }
        const JUDGE_INTERVAL = rule.judgeEvery;
        // 兜底：长时间没判定（例如回合计数被外部重置），强制清空日常期重新投
        if (turnNo - eventState.上次投掷回合 >= JUDGE_INTERVAL * 12) { eventState.强制日常期 = 0; eventState.上次投掷回合 = turnNo; }
        if (eventState.强制日常期 > 0) {
          eventState.强制日常期 -= 1; eventState.上次投掷回合 = turnNo;
          eventState.当前事件 = '强制日常事件'; eventState.事件类型 = '日常'; eventState.剩余回合 = rule.daily;
          ch._quota._eventState = eventState;
          resolve({ type: 'new_event', name: eventState.当前事件, isMajor: false, rounds: eventState.剩余回合 });
          return;
        }
        const turnsSinceLastRoll = turnNo - eventState.上次投掷回合;
        if (turnsSinceLastRoll < JUDGE_INTERVAL) { resolve(null); return; }
        let nextTimelineDate = null;
        for (const evt of timelineEvents) {
          if (evt.done) continue;
          if (completed.indexOf(evt.name) >= 0) continue;
          const eventTime = parseGameTime(evt.time);
          if (eventTime && eventTime.getTime() > currentDate.getTime()) { if (!nextTimelineDate || eventTime.getTime() < nextTimelineDate.getTime()) nextTimelineDate = eventTime; }
        }
        let daysToNextTimeline = Infinity;
        if (nextTimelineDate) daysToNextTimeline = (nextTimelineDate.getTime() - currentDate.getTime()) / 86400000;
        eventState._距离主线天数 = daysToNextTimeline;
        const canMajor = (worldGameDay - eventState.上次大事件游戏日) >= rule.majorCdDays;
        const forbidMajor = daysToNextTimeline <= 30;
        let isMajor = false; let isEgg = false; let eventName = '随机事件';
        const dice = Math.floor(Math.random() * 20) + 1;
        if (dice === 20) { isEgg = true; eventName = '彩蛋事件'; }
        else if (dice >= 15) {
          if (!canMajor || forbidMajor) { isMajor = false; eventName = forbidMajor ? '日常事件（主线临近）' : '日常事件（大事件冷却中）'; }
          else { isMajor = true; eventName = '重大事件'; eventState.上次大事件游戏日 = worldGameDay; eventState.强制日常期 = 3; }
        } else { isMajor = false; eventName = '日常事件'; }
        eventState.当前事件 = eventName;
        eventState.事件类型 = isEgg ? '彩蛋' : (isMajor ? '重大' : '日常');
        eventState.剩余回合 = isEgg ? 5 : (isMajor ? rule.major : rule.daily);
        eventState.上次投掷回合 = turnNo;
        eventState.上次投掷内部天数 = worldGameDay;
        ch._quota._eventState = eventState;
        resolve({ type: 'new_event', name: eventName, isMajor: isMajor, isEgg: isEgg, dice: dice, rounds: eventState.剩余回合, forbidMajor: forbidMajor });
      } catch (e) { resolve(null); }
    });
  }
  /* ───────────────────────────────────────────────────────── */
