/* 44-time-phrase.js —— 口语时间解析：把「过去了一个小时」「一会儿」「回家」折算成分钟

   三档优先级：① 明确时长 > ② 时段锚点（中午 / 傍晚）> ③ 模糊说法（带默认值）。
   日级说法（明天 / 三天后）不在这里处理，交给 40-backend.js 的 parsePlayerTimeJumpTarget；
   这里一旦看到日级词就直接返回 null，避免两套解析互相覆盖。
   维护提示：改默认时长只动 TIME_VAGUE_RULES 那张表，别动下面的判定顺序。 */

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
