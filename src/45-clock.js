  function detectRelativeElapsedDays(mes) {
    if (!mes) return 0;
    const text = String(mes);
    const probe = text.slice(0, 500) + '\n' + text.slice(-500);
    const target = parsePlayerTimeJumpTarget(new Date(2000, 0, 1), probe);
    if (target) return Math.max(1, calendarDayDiff(new Date(2000, 0, 1), target));
    const mNext = probe.match(/(?:^|[\s。！？!?\n])(?:次日|翌日|隔日|隔天|第二天)(?!的)/);
    return mNext ? 1 : 0;
  }

  /* ── 常用时间短语 ─────────────────────────────────────────────────
     随口一句「过去了一个小时」「到中午了」，时钟就该动，而不是每轮只走固定的
     turnMinutes。这里认三类，优先级从高到低：
       ① 明确时长：过去了 / 过了 / 经过 / 一个多小时后 + 分钟 · 刻钟 · 小时
       ② 时段锚点：中午 / 午饭 / 傍晚 / 深夜 / 天亮 …（推到今天或明天的那个点）
       ③ 模糊说法：一会儿 / 片刻 / 穿衣服 / 回家 / 吃饭 —— 按默认值折算（见下表）。
          说不清花了多久的话才是日常里的多数，一律不认等于把时钟锁死在 10 分钟。
     返回 { minutes, kind: 'elapsed'|'anchor'|'vague', crossedDay, phrase } 或 null。 */
  const TIME_DAY_JUMP_RE = /(?:明天|明日|昨天|昨日|前天|后天|大后天|次日|翌日|下周|下个?星期|下个?月)/;
  const TIME_ELAPSED_RE = /(?:过去|过了|又过|经过|流逝|度过|已经过去|转眼(?:间)?(?:就)?(?:又)?(?:过去|过))\s*(?:了)?\s*(半|一?个半|[零〇一二两三四五六七八九十百\d]+)\s*个?\s*(多)?\s*(分钟|分|刻钟|小时|钟头)/;
  const TIME_AFTER_RE = /(半|一?个半|[零〇一二两三四五六七八九十百\d]+)\s*个?\s*(多)?\s*(分钟|分|刻钟|小时|钟头)\s*(?:后|之后|以后)/;
  const TIME_ANCHORS = [
    { re: /(?:凌晨|黎明前)/, hh: 3 * 60 },
    { re: /(?:天亮|破晓|拂晓|清晨|早晨|早上|早饭|早餐)/, hh: 7 * 60 },
    { re: /(?:上午)/, hh: 10 * 60 },
    { re: /(?:中午|正午|晌午|午饭|午餐)/, hh: 12 * 60 },
    { re: /(?:下午|午后)/, hh: 15 * 60 },
    { re: /(?:傍晚|黄昏|日落|夕阳)/, hh: 18 * 60 },
    { re: /(?:晚上|入夜|晚饭|晚餐)/, hh: 19 * 60 },
    { re: /(?:深夜|半夜|午夜|子夜)/, hh: 23 * 60 }
  ];
  /* 「午饭还没到」「等天亮」这种是在说未来/否定，不算已经到点 */
  const TIME_ANCHOR_NEG_RE = /(?:还没|没到|不到|才刚|等到|下次|改天|不是|别|来不及)/;

  /* ── 模糊说法：给一组默认时长 ────────────────────────────────────────
     日常里很少有人说「过了二十分钟」，更多是「一会儿」「吃个饭」「回家」。
     这些说法本身就含着时间，按下面这张表折算：
       片刻 5 分 · 一会儿 10 分 · 穿衣服/收拾 15 分 · 出门走动 30 分 · 吃饭 60 分
     同一句里出现几种就叠加（封顶 3 小时），因为它们通常是先后发生的：
     「回家吃个饭」= 30 + 60 = 90 分。只有这句里既没有明确时长、也没有时段锚点时才用，
     那两种说法更准（「过了一个小时，然后回家」按 60 分算，不再叠 30）。 */
  const TIME_VAGUE_RULES = [
    { re: /(?:片刻|一小会儿|稍候|稍等)/g, minutes: 5, label: '片刻' },
    { re: /(?:一会儿|待会儿|等会儿|一忽儿)/g, minutes: 10, label: '一会儿' },
    { re: /(?:穿(?:好|上|起)?(?:衣服|外套|鞋)|换(?:了)?(?:一)?(?:身|件|套)?衣服|打扮|洗漱|收拾一下)/g, minutes: 15, label: '穿衣收拾' },
    { re: /(?:回家|回去|回宿舍|回房间|回学校|回教室|出门|出发|动身|前往|赶到|走一趟|去一趟|去(?:了)?(?:超市|学校|公司|医院|店里|食堂|宿舍|公园|车站|街上|楼下|楼上|教室|图书馆|厕所|洗手间|外面|那边))/g, minutes: 30, label: '出门走动' },
    { re: /(?:吃(?:了)?(?:个|顿)?饭|吃饭|用餐|吃(?:了)?点东西)/g, minutes: 60, label: '吃饭' }
  ];
  /* 「还没回家」「别急着回去」「没一会儿」都是在说没发生 / 不要发生 */
  const TIME_VAGUE_NEG_RE = /(?:还没|没有|没|不到|别|不要|不用|不必|等到|下次|改天)$/;

  function parseTimePhrase(text, fromDate) {
    const s = String(text || '');
    if (!s || !fromDate) return null;
    /* 日级说法（明天 / 三天后）交给 parsePlayerTimeJumpTarget 处理，这里不抢：
       两套同时命中会互相覆盖，谁先谁后都说不清。 */
    if (TIME_DAY_JUMP_RE.test(s)) return null;
    const m = TIME_ELAPSED_RE.exec(s) || TIME_AFTER_RE.exec(s);
    if (m) {
      const unit = m[3];
      let n = 0;
      if (/^一?个半$/.test(m[1])) n = 1.5;
      else if (/^半个?多?$/.test(m[1])) n = 0.5;
      else n = Number(parseChineseCount(m[1])) || 0;
      if (n > 0) {
        const per = (unit === '分钟' || unit === '分') ? 1 : (unit === '刻钟' ? 15 : 60);
        let minutes = n * per;
        /* 「多」是「这个数量再往上一点」：三个多小时 ≈ 3.5 小时，半个多小时 ≈ 45 分。
           ×1.5 会把 3 小时算成 4.5 小时，只有 1 这个数恰好对上。 */
        if (m[2] === '多') minutes += (n < 1 ? per * 0.25 : per / 2);
        minutes = Math.round(minutes);
        if (minutes > 0 && minutes <= 96 * 60) {
          return { minutes: minutes, kind: 'elapsed', crossedDay: false, phrase: String(m[0]).trim() };
        }
      }
    }
    for (let i = 0; i < TIME_ANCHORS.length; i++) {
      const a = TIME_ANCHORS[i];
      const hit = a.re.exec(s);
      if (!hit) continue;
      const before = s.slice(Math.max(0, hit.index - 8), hit.index);
      if (TIME_ANCHOR_NEG_RE.test(before)) continue;
      /* 否定/未到常写在锚点词后面：「午饭还没到」「中午还早」。 */
      const after = s.slice(hit.index + hit[0].length, hit.index + hit[0].length + 4);
      if (/^(?:还|尚|没|未|不|才|早)/.test(after)) continue;
      const target = new Date(fromDate.getTime());
      target.setHours(Math.floor(a.hh / 60), a.hh % 60, 0, 0);
      let diff = Math.round((target.getTime() - fromDate.getTime()) / 60000);
      const crossedDay = diff <= 0;
      if (crossedDay) diff += 1440;
      return { minutes: diff, kind: 'anchor', crossedDay: crossedDay, phrase: hit[0] };
    }
    /* ③ 模糊说法兜底：没有明确时长、也没有时段锚点时才用。 */
    let vague = 0;
    const vagueLabels = [];
    for (let i = 0; i < TIME_VAGUE_RULES.length; i++) {
      const rule = TIME_VAGUE_RULES[i];
      rule.re.lastIndex = 0;
      let hit;
      let usable = false;
      while ((hit = rule.re.exec(s)) !== null) {
        const before = s.slice(Math.max(0, hit.index - 3), hit.index);
        if (TIME_VAGUE_NEG_RE.test(before)) continue;
        /* 「我们出发吧」「回家吗」是在提议/发问，不是已经发生了 —— 不推时钟。 */
        const after = s.slice(hit.index + hit[0].length, hit.index + hit[0].length + 2);
        if (/^[吧吗呢啊嘛？?]/.test(after)) continue;
        usable = true;
        break;
      }
      rule.re.lastIndex = 0;
      if (usable) { vague += rule.minutes; vagueLabels.push(rule.label); }
    }
    if (vague > 0) {
      return { minutes: Math.min(vague, 180), kind: 'vague', crossedDay: false, phrase: vagueLabels.join('+') };
    }
    return null;
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
    const out = { ok: false, from: '', to: '', minutes: 0, days: 0, source: 'none', granted: false, clamped: false, blockedTo: '', blockedMinutes: 0 };
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
      const playerPhrase = parseTimePhrase(playerText, fromDate);
      const narrativeDays = detectRelativeElapsedDays(latestAiText);
      /* AI 侧：分钟级和当日内的时段锚点才认。它要是在晚上写「到中午了」，
         那是把时间写串了 —— 直接给它跳到明天中午会凭空吃掉十几个小时。 */
      const aiPhraseRaw = parseTimePhrase(latestAiText, fromDate);
      const aiPhrase = (aiPhraseRaw && aiPhraseRaw.minutes <= 12 * 60) ? aiPhraseRaw : null;
      const granted = !!playerTarget || !!playerPhrase || TIME_GRANT_RE.test(playerText) || narrativeDays > 0;
      out.granted = granted;
      const step = getTurnMinutes();
      let target = null;
      let source = '';

      // ① 玩家明确指定跨度时，以玩家为准，优先级高于 AI 时间标签和后台变量时间。
      if (playerTarget) { target = playerTarget; source = 'player_jump'; }
      // ①b 玩家说的「过去一个小时 / 到中午了」这类常用时间词。
      if (!target && playerPhrase) {
        target = new Date(fromDate.getTime() + playerPhrase.minutes * 60000);
        source = 'player_phrase';
      }

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
      /* ⑤ AI 正文里写的「过了一个小时 / 到傍晚了」：只在它没改后台时间字段时兜底。
         放在 state_clock 之后 —— 后台字段是它明写的数，比正文里的口语更可信。 */
      if (!target && aiPhrase) {
        target = new Date(fromDate.getTime() + aiPhrase.minutes * 60000);
        source = 'ai_phrase';
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
        /* 把「AI 原本想跳到哪」记下来：夹回是静默的，不告诉玩家的话，
           他只会看到时钟几乎没动、AI 写的「次日清晨」那一行还被删了，
           像 bug 不像设计。调用方拿这个字段去 toast 一句。 */
        out.blockedTo = formatGameTime(target) || String(stateTime || '');
        out.blockedMinutes = deltaMin;
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

