  function detectRelativeElapsedDays(mes) {
    if (!mes) return 0;
    const text = String(mes);
    const head = text.slice(0, 220);
    const tail = text.slice(-220);
    const probe = head + '\n' + tail;
    const cnNum = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 半: 0.5 };
    let days = 0;
    const mWeek = probe.match(/(?:过了|又过了|转眼)?\s*([一两二三四五六七八九十\d]+)\s*(?:个)?\s*(?:星期|周)\s*(?:后|之后|以后)/);
    const mMonth = probe.match(/(?:过了|又过了|转眼)?\s*([一两二三四五六七八九十\d半]+)\s*(?:个)?\s*月\s*(?:后|之后|以后)/);
    const mDay = probe.match(/(?:过了|又过了|转眼)?\s*([一两二三四五六七八九十半\d]+)\s*(?:天|日)\s*(?:后|之后|以后)/);
    const mHalf = probe.match(/半个月\s*(?:后|之后|以后)/);
    const mNext = probe.match(/(?:^|[\s。！？!?\n])(?:次日|翌日|隔日|隔天|第二天)(?!的)/);
    if (mMonth) { const n = (cnNum[mMonth[1]] !== undefined ? cnNum[mMonth[1]] : parseFloat(mMonth[1])); if (n > 0) days = Math.round(n * 30); }
    else if (mWeek) { const n = (cnNum[mWeek[1]] !== undefined ? cnNum[mWeek[1]] : parseFloat(mWeek[1])); if (n > 0) days = Math.round(n * 7); }
    else if (mHalf) days = 15;
    else if (mDay) { const n = (cnNum[mDay[1]] !== undefined ? cnNum[mDay[1]] : parseFloat(mDay[1])); if (n > 0) days = Math.round(n); }
    else if (mNext) days = 1;
    if (!days || !isFinite(days)) return 0;
    return Math.max(1, Math.min(7, days));
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
      // 本轮的时间已经由正文/后台变量明确给出（AI 写了「世界.时间=…」或建档时按正文取到起点）：
      // 就以它为准，不再叠加默认步长。以前这里会再加 10 分钟，导致每轮时间凭空走快。
      if (world._时钟已由正文确定 === true) {
        delete world._时钟已由正文确定;
        const prevDate = parseGameTime(String(world._上次推进时间 || stateTime));
        const curDate = parseGameTime(stateTime);
        // 正文写成「第二天」「三天后」时，天数照样要记账，否则主线倒计时和游戏日会停在原地
        const declaredDays = (prevDate && curDate) ? Math.max(0, calendarDayDiff(prevDate, curDate)) : 0;
        out.ok = true; out.from = String(world._上次推进时间 || stateTime); out.to = stateTime;
        out.source = 'declared'; out.minutes = 0; out.days = declaredDays;
        world._上次推进时间 = stateTime;
        if (declaredDays > 0) {
          world._游戏日 = Math.max(0, Math.floor(Number(world._游戏日) || 0)) + declaredDays;
          world._内部流逝天数 = world._游戏日;
        }
        return out;
      }
      // 基准用「上次推进时间」：本轮的 世界.时间 可能已被后台变量摄入提前写掉
      const fromStr = String(world._上次推进时间 || stateTime);
      const fromDate = parseGameTime(fromStr) || parseGameTime(stateTime);
      if (!fromDate) return out;
      out.from = fromStr;
      const step = getTurnMinutes();
      const playerText = getLatestUserMessageText();
      const narrativeDays = detectRelativeElapsedDays(latestAiText);
      // 授权来源：玩家明说（明天/三天后…），或正文本身写了明确的转场（次日/一周后…）
      const granted = TIME_GRANT_RE.test(playerText) || narrativeDays > 0;
      out.granted = granted;

      let target = null; let source = '';
      // ① AI 显式给的时间优先
      const aiTime = tryExtractWorldTimeFromMessage(latestAiText, fromStr);
      if (aiTime) { const d = parseGameTime(aiTime); if (d) { target = d; source = 'ai_clock'; } }
      // ② 世界时间已被别处推进（后台变量摄入 / 手动校正）
      if (!target) {
        const cur = parseGameTime(stateTime);
        // 只比较「有没有变」，不比较「是不是更大」：_上次推进时间 可能刚被建档逻辑对齐到同一值，
        // 那样 cur > from 不成立，就会白走一次默认步长。
        if (cur && stateTime !== fromStr) { target = cur; source = 'state_clock'; }
      }
      // ③ 正文里的相对时间词
      if (!target) {
        const relDays = detectRelativeElapsedDays(latestAiText);
        if (relDays > 0) { const d = new Date(fromDate.getTime()); d.setDate(d.getDate() + relDays); target = d; source = 'narrative_days'; }
      }
      // ④ 默认步长
      if (!target) { target = new Date(fromDate.getTime() + step * 60000); source = 'default_step'; }

      let deltaMin = Math.round((target.getTime() - fromDate.getTime()) / 60000);
      let dayDelta = calendarDayDiff(fromDate, target);

      // 跨天闸门：明显的大跨度（超过一轮步长的 3 倍）必须由玩家授权或正文转场放行
      // 自然的「23:55 + 10 分钟过午夜」不算大跳，照常计入新的一天
      const isBigJump = deltaMin > step * 3;
      if (isBigJump && !granted && (source === 'ai_clock' || source === 'state_clock')) {
        target = new Date(fromDate.getTime() + step * 60000);
        deltaMin = step;
        dayDelta = calendarDayDiff(fromDate, target);
        source = 'clamped';
        out.clamped = true;
      }
      // 倒退一律拒绝
      if (deltaMin <= 0) return out;

      const toStr = formatGameTime(target);
      if (!toStr) return out;
      world.时间 = toStr;
      world._上次推进时间 = toStr;
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

