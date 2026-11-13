  function detectRelativeElapsedDays(mes) {
    if (!mes) return 0;
    const text = String(mes);
    const probe = text.slice(0, 500) + '\n' + text.slice(-500);
    const target = parsePlayerTimeJumpTarget(new Date(2000, 0, 1), probe);
    if (target) return Math.max(1, calendarDayDiff(new Date(2000, 0, 1), target));
    const mNext = probe.match(/(?:^|[\s。！？!?\n])(?:次日|翌日|隔日|隔天|第二天)(?!的)/);
    return mNext ? 1 : 0;
  }

  function getTurnMinutes() {
    const v = Number(getSettings().turnMinutes);
    return (isFinite(v) && v > 0 && v <= 120) ? Math.round(v) : DEFAULT_TURN_MINUTES;
  }

  function getLatestUserMessageText() {
    try {
      const ctx = getSTCtx();
      if (!ctx || !ctx.chat || !ctx.chat.length) return '';
      for (let i = ctx.chat.length - 1; i >= 0; i--) {
        const m = ctx.chat[i];
        if (m && m.is_user) return String(m.mes || '');
      }
    } catch (e) {}
    return '';
  }

  // 只比较「日历日」，同一天返回 0
  function calendarDayDiff(fromDate, toDate) {
    const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
    const b = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();
    return Math.round((b - a) / 86400000);
  }

  function ensureWorldClockFields(world) {
    if (!world || typeof world !== 'object') return;
    if (world._游戏日 === undefined || world._游戏日 === null || !isFinite(Number(world._游戏日))) {
      world._游戏日 = Math.floor(Number(world._内部流逝天数) || 0);
    }
    world._游戏日 = Math.max(0, Math.floor(Number(world._游戏日) || 0));
    // 旧版是小数天，统一成整数天，两个字段保持同步
    world._内部流逝天数 = world._游戏日;
    if (world._上次好感度跳跃结算日 === undefined || world._上次好感度跳跃结算日 === null || !isFinite(Number(world._上次好感度跳跃结算日))) {
      world._上次好感度跳跃结算日 = world._游戏日;
    }
    if (world._回合 === undefined || !isFinite(Number(world._回合))) world._回合 = 0;
    world._回合 = Math.max(0, Math.floor(Number(world._回合) || 0));
    if (!world._上次推进时间) world._上次推进时间 = world.时间 || '';
  }

  // 世界时钟推进：默认每轮走 turnMinutes 分钟；跨大跨度需玩家授权或正文转场
  function advanceWorldClock(world, latestAiText) {
    const out = { ok: false, from: '', to: '', minutes: 0, days: 0, source: 'none', granted: false, clamped: false };
    try {
      if (!world) return out;
      ensureWorldClockFields(world);
      const stateTime = String(world.时间 || '');
      const fromStr = String(world._上次推进时间 || stateTime);
      const fromDate = parseGameTime(fromStr) || parseGameTime(stateTime);
      if (!fromDate) return out;
      out.from = fromStr;
      const playerText = getLatestUserMessageText();
      const playerTarget = parsePlayerTimeJumpTarget(fromDate, playerText);
      const narrativeDays = detectRelativeElapsedDays(latestAiText);
      const granted = !!playerTarget || TIME_GRANT_RE.test(playerText) || narrativeDays > 0;
      out.granted = granted;
      const step = getTurnMinutes();
      let target = null;
      let source = '';

      // ① 玩家明确指定跨度时，以玩家为准，优先级高于 AI 时间标签和后台变量时间。
      if (playerTarget) { target = playerTarget; source = 'player_jump'; }

      // ② 正文/后台明确声明时间。_时钟已由正文确定 只负责表明本轮时间字段已更新，不代表允许擅自缩短玩家跨度。
      if (!target && world._时钟已由正文确定 === true) {
        const cur = parseGameTime(stateTime);
        if (cur) { target = cur; source = 'declared'; }
      }
      if (!target) {
        const aiTime = tryExtractWorldTimeFromMessage(latestAiText, fromStr);
        if (aiTime) { const d = parseGameTime(aiTime); if (d) { target = d; source = 'ai_clock'; } }
      }
      if (!target) {
        const cur = parseGameTime(stateTime);
        if (cur && stateTime !== fromStr) { target = cur; source = 'state_clock'; }
      }
      // ③ 正文相对时间兜底（如「三天后」「一年后」）。
      if (!target && narrativeDays > 0) {
        const d = new Date(fromDate.getTime()); d.setDate(d.getDate() + narrativeDays);
        target = d; source = 'narrative_days';
      }
      // ④ 默认每轮推进分钟数。
      if (!target) { target = new Date(fromDate.getTime() + step * 60000); source = 'default_step'; }

      let deltaMin = Math.round((target.getTime() - fromDate.getTime()) / 60000);
      if (deltaMin < 0) {
        // 禁止倒退。若玩家没有要求倒退，拒绝旧时间；若明确要求回档，也不让计时器倒扣。
        target = fromDate; deltaMin = 0; source = 'rejected';
      }
      // 只有 AI/后台自己制造的大跨度才受闸门限制；玩家明确指定的跨度绝不截断。
      if (deltaMin > step * 3 && !granted && (source === 'ai_clock' || source === 'state_clock' || source === 'declared')) {
        target = new Date(fromDate.getTime() + step * 60000);
        deltaMin = step; source = 'clamped'; out.clamped = true;
      }
      const toStr = formatGameTime(target) || stateTime;
      if (!toStr) return out;
      const dayDelta = Math.max(0, calendarDayDiff(fromDate, target));
      world.时间 = toStr;
      world._上次推进时间 = toStr;
      delete world._时钟已由正文确定;
      if (dayDelta > 0) {
        world._游戏日 = Math.max(0, Math.floor(Number(world._游戏日) || 0)) + dayDelta;
        world._内部流逝天数 = world._游戏日;
      }
      out.ok = true; out.to = toStr; out.minutes = deltaMin; out.days = dayDelta; out.source = source;
      return out;
    } catch (e) { return out; }
  }

  function tryExtractWorldTimeFromMessage(mes, currentWorldTime) {
    if (!mes) return null;
    const text = String(mes);
    const explicitMatch = text.match(/(?:世界\.时间|【?当前时间|【?时间|📅|🕒)\s*[:：=]\s*([^\r\n】>]+)/i);
    const candidate = explicitMatch ? explicitMatch[1].trim() : '';
    const m = (candidate && candidate.match(TL_TIME_RE)) || text.match(/(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日[^\r\n]{0,20}?\d{1,2}\s*[:点时]\s*\d{1,2}(?:\s*分)?)/);
    if (!m) return null;
    // 必须用 m[0]（完整匹配）；m[1] 只是年份，旧版因此永远解析失败
    const newDate = parseGameTime(m[0]);
    if (!newDate) return null;
    const curDate = parseGameTime(currentWorldTime);
    if (curDate && newDate.getTime() < curDate.getTime()) return null;
    return formatGameTime(newDate);
  }

