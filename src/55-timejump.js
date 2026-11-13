  async function checkTimeJump() {
    try {
      const data = readMvuLatest();
      const statData = data && data.stat_data;
      const world = statData && statData.世界;
      if (!world || !world.时间) return null;
      ensureWorldClockFields(world);
      const gameDay = Math.max(0, Math.floor(Number(world._游戏日) || 0));
      // 结算基准写入当前聊天的世界存档，不再使用跨聊天共享的 localStorage 日数键。
      if (world._上次好感度跳跃结算日 === undefined || !isFinite(Number(world._上次好感度跳跃结算日))) {
        world._上次好感度跳跃结算日 = gameDay;
        await writeMvuLatest(statData);
        return null;
      }
      const lastDay = Math.max(0, Math.floor(Number(world._上次好感度跳跃结算日) || 0));
      const dayDelta = gameDay - lastDay;
      if (dayDelta < 0) {
        world._上次好感度跳跃结算日 = gameDay;
        await writeMvuLatest(statData);
        return null;
      }
      if (dayDelta < 1 || timeJumpCooldown > 0) return null;

      // 先固化本次结算游标，成功/失败都只判定一次，避免同一段时间被重复掷骰。
      world._上次好感度跳跃结算日 = gameDay;
      const mode = getCurrentMode();
      const diceThreshold = mode === 'easy' ? 8 : mode === 'normal' ? 13 : 18;
      const dice = Math.floor(Math.random() * 20) + 1;
      const coeff = dayDelta < 180 ? 1.0 : 1.5;
      const base = 1.5 * coeff;
      let delta = 0; let resultText = '';
      if (dice === 20) { delta = base * 1.5; resultText = '大成功'; }
      else if (dice === 1) { delta = 0; resultText = '大失败（不加不减）'; }
      else if (dice >= diceThreshold) { delta = base; resultText = '成功'; }
      else { delta = 0; resultText = '失败（不加不减）'; }
      delta = Math.min(delta, 5.0); delta = roundHalf(delta);
      timeJumpCooldown = 5;
      const appliedChanges = [];
      if (delta !== 0 && statData.角色) {
        const cap = Number(MOON_FORMULA_PARAMS.weeklyCap[mode] || MOON_FORMULA_PARAMS.weeklyCap.normal);
        for (const name in statData.角色) {
          const ch = statData.角色[name];
          if (!ch || isCharSkeleton(ch) || ch.在场 === false) continue;
          if (!ch._quota || typeof ch._quota !== 'object') ch._quota = {};
          const q = ch._quota;
          const used = Math.max(0, Number(q.好感度周上限已用) || 0);
          const remain = Math.max(0, roundHalf(cap - used));
          const applied = Math.min(delta, remain);
          if (applied > 0) {
            ch.好感度 = roundHalf((Number(ch.好感度) || 0) + applied);
            q.好感度周上限已用 = roundHalf(used + applied);
            syncStageWithAffection(ch);
            appliedChanges.push(name + ' +' + applied.toFixed(1));
          } else {
            appliedChanges.push(name + ' +0（本周额度已满）');
          }
        }
      }
      const saved = await writeMvuLatest(statData);
      if (!saved) { try { console.warn('[Doki] 时间跳跃好感度结算写回失败：', lastWriteError); } catch (e) {} }
      return { diffDays: Math.floor(dayDelta), dice: dice, threshold: diceThreshold, resultText: resultText, delta: delta, systemDays: Math.floor(dayDelta), daysFromFloor: Math.floor(dayDelta), changes: appliedChanges, mode: mode, coeff: coeff, saveOk: saved };
    } catch (e) { return null; }
  }

  function injectTimeJump(info) {
    const lines = [];
    lines.push('═══════════════════════════════════');
    lines.push('⏳【月轨异动：时空流逝判定】');
    lines.push('世界时间跳跃了 ' + info.diffDays + ' 天。');
    lines.push('（系统按' + getModeLabel(info.mode) + '月相判定，系数 ×' + info.coeff + '）');
    lines.push('');
    lines.push('【掷骰判定】1d20 = ' + info.dice + '（阈值 ≥' + info.threshold + '）');
    lines.push('【结果】' + info.resultText);
    lines.push('【E值变化】基础奖励 +' + info.delta + '；各角色实际入账按各自本周剩余额度结算。');
    if (info.changes && info.changes.length) lines.push('【实际入账】' + info.changes.join('；'));
    lines.push('【系统时间结算】本次实际经过 ' + info.systemDays + ' 天；已用于倒计时、冷战期限与周期刷新。');
    lines.push('→ 叙事要求：在接下来的剧情中自然体现这段时间流逝后的关系氛围。');
    lines.push('═══════════════════════════════════');
    callSetPrompt(PROMPT_KEY + '_jump', lines.join('\n'), 4, 1, false);
  }
  function checkAllCountdowns(sourceStatData) {
    const actions = [];
    try {
      const data = sourceStatData ? { stat_data: sourceStatData } : readMvuLatest();
      const statData = data && data.stat_data;
      const currentTime = (statData && statData.世界 && statData.世界.时间) || readVar('世界.时间', '');
      if (!currentTime) return actions;
      const characters = (statData && statData.角色) || readVar('角色', {});
      if (!characters || typeof characters !== 'object') return actions;
      let mutated = false;
      for (const name in characters) {
        const ch = characters[name]; if (!ch || isCharSkeleton(ch)) continue;
        const quota = ch._quota || (ch._quota = {});
        const debuff = quota._debuff || (quota._debuff = {});
        const E = Number(ch.好感度) || 0;
        if (!quota.周上限起始) { quota.周上限起始 = currentTime; mutated = true; }
        if (quota.周上限起始) {
          const startDate = parseGameTime(quota.周上限起始); const curDate = parseGameTime(currentTime);
          if (startDate && curDate) {
            const diffDays = calendarDayDiff(startDate, curDate);
            if (diffDays >= 7) {
              const fullWeeks = Math.floor(diffDays / 7);
              // 按完整周数推进周期起点，保留不足 7 天的余数；跨一年也不会只重置一次后丢失周期。
              const newResetStr = addDaysToGameTime(quota.周上限起始, fullWeeks * 7);
              quota.好感度周上限已用 = 0;
              quota.玩家本周已掷 = false;
              quota.周上限起始 = newResetStr;
              mutated = true;
              actions.push({ type: 'quota_reset', char: name,
                msg: "【好感度周上限重置】角色【" + name + "】跨越 " + fullWeeks + " 个完整周，已重置本周好感上限与破门掷骰次数。" });
            }
          }
        }
        if (debuff.冷战期 === true && debuff.冷却结束时间) {
          if (timeReached(currentTime, debuff.冷却结束时间) && E >= 0) {
            debuff.冷战期 = false;
            debuff.冷却结束时间 = '';
            mutated = true;
            actions.push({ type: 'coldwar_end', char: name,
              msg: "【冷战期结束】角色【" + name + "】冷战冷却时间已满且好感度非负，已解冻恢复正常互动。" });
          }
        }
      }
      if (mutated && statData && !sourceStatData) {
        writeMvuLatest(statData);
      }
      return actions;
    } catch (e) { return actions; }
  }
  function injectCountdownActions(actions) {
    try {
      if (!actions || actions.length === 0) { callSetPrompt(PROMPT_KEY, '', 0, 0, false); return; }
      const content = [
        '═══════════════════════════════════',
        '⚡【系统强制：月轨周期节点到期】',
        '以下事件已在世界时间推进中自然到期：',
        '',
        actions.map(function(a) { return a.msg; }).join('\n\n'),
        '═══════════════════════════════════'
      ].join('\n');
      callSetPrompt(PROMPT_KEY, content, 4, 1, false);
    } catch (e) {}
  }

