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


  async function runMoonCalculation() {
    try {
      /* 冷冻到点 + 排着一个强制副本 → 直接拽进去，不再问玩家（用户定的）。
         这一轮先返回：手上这份回复是主线写的，不能拿来当副本第一回合。 */
      if (typeof dungeonIsOn === 'function' && !dungeonIsOn()
        && typeof dungeonTryForceStart === 'function') {
        try {
          const forced = dungeonTryForceStart();
          if (forced) {
            try { toast('主神空间把你直接塞进了「' + forced.name + '」，没得选', 'warning'); } catch (e) {}
            return;
          }
        } catch (e) {}
      }
      /* 副本先于一切数据检查处理：副本里可能根本没有主线角色在说话（单人探索、
         或者角色已经阵亡成幽灵），但回合和判定照样要走。放后面会被 stat_data 的早退挡掉。 */
      const inDungeon = (typeof dungeonIsOn === 'function' && dungeonIsOn());
      if (inDungeon) {
        const dgLatest = getLatestAiMessage();
        const dgText = dgLatest && dgLatest.msg ? String(dgLatest.msg.mes || '') : '';
        const dgIdx = dgLatest ? dgLatest.idx : null;
        try { dungeonTick(dgIdx); } catch (e) {}
        try {
          const dg = dungeonApplyRuled(dgText, dgIdx);
          /* 扣血必须当场喊一声：玩家在聊天里，不会没事去开面板 */
          if (dg && dg.hit && dg.hit !== 'none') {
            const label = dg.hit === 'fatal' ? '严重违规' : (dg.hit === 'major' ? '中等违规' : '轻微违规');
            if (dg.exited) {
              toast(label + ' —— 你被拖出了副本，这一局算失败', 'error');
            } else {
              toast(label + '  −' + dg.dmg + (dg.down ? '　同行者倒下了' : ''), 'warning');
            }
          }
        } catch (e) {}
      }

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
      /* 副本期间的 tick 与判定已经在函数开头处理过（那里不依赖 stat_data）。
         这里只保留一个标志，用来关掉事件导演。 */
      /* 时钟推进。以前副本里整段跳过（怕 _回合 被吃），现在必须走：
         规则怪谈的通关门槛是「存活多长时间」，而存活时间就挂在这个时钟上。
         没角色的空档楼层仍然不推 —— 但副本里例外：队友可能全阵亡了，
         时间照走，不然倒计时会冻在原地。 */
      if (activeCharNames.length > 0 || inDungeon) {
        ensureWorldClockFields(world);
        const clockSig = latestAi ? 'f' + latestAi.idx + ':' + stableFeatureHash(normalizeClockSigText(latestAiText)) : 't:' + String(world.时间 || '');
        // 同一楼层只推进一次时钟，避免 message_received 与 generation_ended 重复结算
        if (world._lastClockSig !== clockSig) {
          /* _回合 是主线的计数，副本不吃它 —— 副本自己按回合记在 run 里 */
          if (!inDungeon) world._回合 = Math.max(0, Math.floor(Number(world._回合) || 0)) + 1;
          const clockInfo = advanceWorldClock(world, latestAiText);
          world._lastClockSig = clockSig;
          if (clockInfo.ok) {
            statData._最后推进 = { 来源: clockInfo.source, 分钟: clockInfo.minutes, 天数: clockInfo.days, 是否拦截: clockInfo.clamped, 到: clockInfo.to, 被拦下的目标: clockInfo.blockedTo || '' };
            /* 走了多久就往存活倒计时里加多久：AI 写过夜，倒计时直接跳过去 */
            if (inDungeon) {
              try { dungeonAddElapsed(clockInfo.minutes); } catch (e) {}
            }
          }
          /* 夹回必须出声。以前这里是静默的：AI 写「次日清晨」、脚本只推 10 分钟、那行时间还被从正文删了，
             玩家看到的是「时钟几乎不动、AI 说的话少了一句」，像坏了。现在给一句人话。
             副本里不弹：那句话是给主线时间跳越用的，副本里只会打断气氛。 */
          if (clockInfo.clamped && !inDungeon) {
            try {
              toast('时间被脚本挡住了：AI 想推到 ' + (clockInfo.blockedTo || '很后面') + '，这轮只走了 ' + clockInfo.minutes + ' 分钟。要跨天就在你的话里写「第二天」。', 'warning');
            } catch (e) {}
          }
        }
      }
      // 还没有任何有效角色（开场白楼层 / 空档）时，本轮不算一回合，也不结算好感
      // 否则玩家一句话都没说，回合数先跳了 1、角色们还各自结算了一轮
      if (activeCharNames.length === 0) return;
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
      /* 成就闸门（以前 isMajor 一律给成就：dice>=15 就有 25%，再叠加判定间隔，频率高得离谱）。
         现在只有三种情况能解锁：彩蛋（1d20=20）、主线节点事件、重大事件里掷到 19/20。
         另外每个角色有冷却，同一角色 60 回合内最多解锁一次，避免「一晚上拿三个」。 */
      const ACHV_MIN_DICE = 19;
      const ACHV_COOLDOWN_TURNS = 60;
      const turnNo = Math.max(0, Math.floor(Number(world && world._回合) || 0));

      const parsedTags = extractAllSylveinaTags(latestAiText);
      /* 分维度标签单独收一份。以前四维里只有 E 会动，根因就在这里：
         注入只教 AI 写 [Sylveina|…]，解析器又把维度默认成 'E'，
         于是 P / I 永远等不到属于自己的那条标签，状态卡上两个数从建档起就没变过。 */
      const parsedDimTags = (typeof extractAllDimTags === 'function') ? extractAllDimTags(latestAiText) : [];
      /* 转折标签单独收一份。它和分维度标签是两件事：维度标签说「哪一维动了」，
         转折标签说「这一轮是剧情节点，数值由 AI 按情节定」。 */
      const parsedTurnTags = (typeof extractAllTurnTags === 'function') ? extractAllTurnTags(latestAiText) : [];
      /* 嫉妒的自然回落按「游戏日」走（读 _invidia.每日衰减基数），所以这里要一份当前游戏日。
         和 processEventSystem 用的是同一个口径，不另立一套时间轴。 */
      const dimGameDay = Math.max(0, Math.floor(Number(world._游戏日) || Number(world._内部流逝天数) || 0));
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

        /* 转折标签优先：AI 明确判定「这一轮是重大转折」时，数值直接用它给的，
           不走事件导演的档位、不占好感周额度、也不参与成就判定。
           和普通标签互斥 —— 同一角色同一轮两个都写，只认转折
           （能写出带理由的转折，说明它真的判断过；那条普通标签多半是惯性凑的）。 */
        let turnApplied = null;
        if (typeof pickTurnTagForCharacter === 'function') {
          const turnTag = pickTurnTagForCharacter(parsedTurnTags, name, activeCharNames.length, primaryTarget);
          const turnFloor = latestAi ? Number(latestAi.idx) : -1;
          const lastTurnFloor = Number(ch._quota._lastTurnFloor);
          /* 冷却：同一个角色 3 层内只吃一次转折。
             不加这道闸，模型会把它当常规加分手短——每轮都写一条「他明白了」，
             E 三天就满。转折之所以叫转折，是因为它不是每轮都有。 */
          const turnCd = (typeof TURN_TAG_COOLDOWN === 'number') ? TURN_TAG_COOLDOWN : 3;
          const turnTooSoon = isFinite(lastTurnFloor) && turnFloor >= 0
            && (turnFloor - lastTurnFloor) < turnCd;
          if (turnTag && !turnTooSoon && ch._quota._turnSig !== turnSignature) {
            ch._quota._turnSig = turnSignature;
            const rawV = Number(turnTag.value) || 0;
            const capMax = (typeof TURN_TAG_MAX === 'number') ? TURN_TAG_MAX : 30;
            const capped = Math.max(-capMax, Math.min(capMax, rawV));
            const beforeE = Number(ch.好感度) || 0;
            const afterE = Math.max(-100, Math.min(100, roundHalf(beforeE + capped)));
            if (afterE !== beforeE) {
              ch.好感度 = afterE;
              const turnDelta = roundHalf(afterE - beforeE);
              ch._quota._lastTurnFloor = turnFloor;
              changedChars.push({ name: name, field: '好感度', delta: turnDelta, newValue: afterE, reason: turnTag.why });
              turnApplied = ch._lastTurn = {
                delta: turnDelta, why: turnTag.why, asked: rawV,
                capped: rawV !== capped, sig: turnSignature
              };
            }
          }
        }
        // 若本楼层检测到 Sylveina 标签且尚未对该角色结算，则自动写入 ch._lastRoll
        const matchedTag = turnApplied ? null : matchTagForCharacter(parsedTags, name, activeCharNames.length, primaryTarget);
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

        /* ── P / I：分维度标签，走和 E 同一条 computeCharDelta ─────────
           复用是为了共享「方向 / 负向系数 / 深渊惩罚 / 舍入」这几条规则，
           但门槛和上限是各维自己的（写在 computeCharDelta 里）：

           肉体 —— 不夹。AI 写多少就结算多少，也没有周上限。
             用户要的是「一口气加很多，也能一口气减很多」，这里再套一个
             单轮上限就把这个手感削平了。
           嫉妒 —— 单轮夹 5。它是唯一一个「剧情里随口一句就能写一条」的维度，
             不夹的话二十轮就顶到 100。

           这里不用 clampBaseToEventRange：那是按「日常 0.5~2.0」给 E 定的，
           套到肉体上会让「一场吻戏」和「递了杯水」拿到一样的增量。 */
        try {
          const dimTags = (typeof matchDimTagsForCharacter === 'function')
            ? matchDimTagsForCharacter(parsedDimTags, name, activeCharNames.length, primaryTarget) : [];
          if (dimTags.length) {
            if (!ch._quota._dimSig || typeof ch._quota._dimSig !== 'object') ch._quota._dimSig = {};
            for (const dt of dimTags) {
              if (ch._quota._dimSig[dt.dimension] === turnSignature) continue;
              const esTypeD = (ch._quota._eventState && ch._quota._eventState.事件类型) || '';
              const resolvedD = (esTypeD === '重大' || esTypeD === '彩蛋') ? '重大' : (esTypeD || '日常');
              const rawBase = Math.abs(Number(dt.baseValue) || 0);
              const baseD = dt.dimension === 'I' ? Math.min(rawBase, 5) : rawBase;
              const dimResult = computeCharDelta(ch, {
                主维度: dt.dimension,
                基础值: baseD,
                方向: dt.direction || '正向',
                事件类型: resolvedD
              }, mode);
              if (dimResult && dimResult.delta !== 0) {
                ch[dimResult.fieldName] = dimResult.newValue;
                changedChars.push({ name: name, field: dimResult.fieldName, delta: dimResult.delta, newValue: dimResult.newValue });
              }
              ch._quota._dimSig[dt.dimension] = turnSignature;
            }
          }
          /* 嫉妒自然回落：这一轮没收到 [嫉妒] 就按「每日衰减基数」往下掉。
             不进 changedChars —— 每回合弹一条「嫉妒 -0.5」比不弹更烦；
             面板在函数末尾统一刷新，玩家打开就能看到。
             有标签的那轮不降，但要把当天记下来，否则第二天会把这天补扣一次。 */
          const gotEnvyTag = dimTags.some(function(t) { return t.dimension === 'I'; });
          if (gotEnvyTag) {
            try { applyEnvyDecay(ch, dimGameDay, { markOnly: true }); } catch (e) {}
          } else {
            const decay = applyEnvyDecay(ch, dimGameDay);
            if (decay) { try { console.log('[Doki] 嫉妒回落：', name, decay.oldValue, '→', decay.newValue, '（' + decay.days + ' 天 × ' + decay.base + '）'); } catch (e) {} }
          }
        } catch (e) { try { console.warn('[Doki] 分维度结算失败：', e); } catch (e2) {} }

        const gateLog = processGateForChar(name, ch, currentTime, mode);
        if (gateLog) gateLogs.push(gateLog);
        syncStageWithAffection(ch);
        try { computePlayerConfession(ch, mode, currentTime); } catch (e) {}

        const newRAfterTurn = Number(ch.阶段值) || 0;
        if (newRAfterTurn !== oldRBeforeTurn) {
          stageChangedChars.push(name);
        }

        try {
          /* 副本里不跑事件导演：主线的随机事件会跟副本的怪物撞在一起，
             而且成就也一并跟着不走（副本的成就在结算时给分）。 */
          const evt = inDungeon ? null : await processEventSystem(name, ch, currentTime, world, wbEntries);
          if (evt) {
            eventLogs.push({ char: name, event: evt });
            /* 成就只在「够格」的时候弹：彩蛋和主线节点必给（这两类本来就稀有），
               普通随机事件必须掷到 19/20 才算，且同一角色有冷却。 */
            const esForAchv = (ch._quota && ch._quota._eventState) || {};
            const isEggUnlock = !!(evt.isEgg || evt.dice === 20);
            const isTimelineMajor = evt.type === 'world_event' && evt.isMajor === true;
            const strongRoll = Number(evt.dice) >= ACHV_MIN_DICE;
            const lastAchvTurn = Number(esForAchv.上次成就回合);
            const cooledDown = !isFinite(lastAchvTurn) || (turnNo - lastAchvTurn) >= ACHV_COOLDOWN_TURNS;
            if (isEggUnlock || isTimelineMajor || (strongRoll && cooledDown)) {
              esForAchv.上次成就回合 = turnNo;
              ch._quota._eventState = esForAchv;
              achievementRequests.push({
                charName: name,
                eventType: isEggUnlock ? '彩蛋事件' : '重大事件',
                reason: isEggUnlock ? '事件骰掷出 1d20=20' : (evt.name || '世界线重大转折'),
                key: turnSignature + '::' + name + (isEggUnlock ? '::egg' : '::major')
              });
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
          /* 转折那一条带上 AI 给的理由 —— 玩家得看得见「这 18 分是为什么加的」，
             否则跟以前一样像黑箱。 */
          const msg = changedChars.map(function(c) {
            return c.name + ' ' + c.field + ' ' + (c.delta >= 0 ? '+' : '') + c.delta + ' → ' + c.newValue
              + (c.reason ? '（' + c.reason + '）' : '');
          }).join('；');
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
