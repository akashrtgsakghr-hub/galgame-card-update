  function checkTimeJump() {
    try {
      const data = readMvuLatest();
      const statData = data && data.stat_data;
      const world = statData && statData.世界;
      const currentTime = (world && world.时间) || readVar('世界.时间', '');
      if (!currentTime) return null;
      if (!world) return null;
      ensureWorldClockFields(world);
      const gameDay = Number(world._游戏日) || 0;
      const store = getStorage();
      const lastDayRaw = store && store.getItem(LAST_GAME_DAY_KEY);
      const lastDay = (lastDayRaw == null) ? -1 : parseInt(lastDayRaw, 10);
      if (!isFinite(lastDay) || lastDay < 0) { if (store) store.setItem(LAST_GAME_DAY_KEY, String(gameDay)); return null; }
      const dayDelta = gameDay - lastDay;
      if (dayDelta < 1) return null;
      if (timeJumpCooldown > 0) return null;
      if (store) store.setItem(LAST_GAME_DAY_KEY, String(gameDay));
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
      if (delta !== 0 && statData && statData.角色) {
        for (const name in statData.角色) {
          const ch = statData.角色[name];
          if (!ch || isCharSkeleton(ch) || ch.在场 === false) continue;
          ch.好感度 = roundHalf((Number(ch.好感度) || 0) + delta);
          syncStageWithAffection(ch);
        }
        writeMvuLatest(statData);
      }
      return { diffDays: Math.floor(diffDays), dice: dice, threshold: diceThreshold, resultText: resultText, delta: delta, daysFromFloor: daysFromFloor, mode: mode, coeff: coeff };
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
    lines.push('【E值变化】' + (info.delta >= 0 ? '+' : '') + info.delta + '（已由系统在本地档案中自动结算）');
    lines.push('【倒计时扣减】换算天数 ' + info.daysFromFloor + ' 天。');
    lines.push('→ 叙事要求：在接下来的剧情中自然体现这段时间流逝后的关系氛围。');
    lines.push('═══════════════════════════════════');
    callSetPrompt(PROMPT_KEY + '_jump', lines.join('\n'), 4, 1, false);
  }
  function checkAllCountdowns() {
    const actions = [];
    try {
      const data = readMvuLatest();
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
            const diffDays = (curDate.getTime() - startDate.getTime()) / 86400000;
            if (diffDays >= 7) {
              const y = curDate.getFullYear(); const mo = String(curDate.getMonth() + 1).padStart(2, '0'); const d = String(curDate.getDate()).padStart(2, '0');
              const wd = ['日', '一', '二', '三', '四', '五', '六'][curDate.getDay()];
              const newResetStr = y + '年' + mo + '月' + d + '日 · 星期' + wd + ' · 00:00';
              quota.好感度周上限已用 = 0;
              quota.玩家本周已掷 = false;
              quota.周上限起始 = newResetStr;
              mutated = true;
              actions.push({ type: 'quota_reset', char: name,
                msg: "【好感度周上限重置】角色【" + name + "】已满7天，系统已自动重置本周好感上限与破门掷骰次数。" });
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
      if (mutated && statData) {
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

