  function parseSylveinaBody(bodyStr, fullMatch) {
    if (!bodyStr) return null;
    const rawParts = String(bodyStr).split(/[|｜]/).map(function(s) { return s.trim(); }).filter(Boolean);
    if (rawParts.length < 2) return null;
    let level = '';
    let sign = '';
    let baseValue = NaN;
    let dimension = 'E';
    let charName = '';
    const levelMap = { L: '日常', M: '关键', H: '重大' };
    for (let i = 0; i < rawParts.length; i++) {
      const p = rawParts[i];
      const upper = p.toUpperCase();
      if (!level && (upper === 'L' || upper === 'M' || upper === 'H')) {
        level = upper;
        continue;
      }
      if (!level && (p === '日常' || p === '关键' || p === '重大' || p === '彩蛋')) {
        level = p === '日常' ? 'L' : (p === '关键' ? 'M' : 'H');
        continue;
      }
      if (!sign && (p === '+' || p === '-' || p === '＋' || p === '－' || p === '−' || p === '—' || p === '正向' || p === '负向')) {
        sign = (p === '-' || p === '－' || p === '−' || p === '—' || p === '负向') ? '-' : '+';
        continue;
      }
      if ((upper === 'E' || upper === 'P' || upper === 'R' || upper === 'I') && isNaN(Number(p))) {
        dimension = upper;
        continue;
      }
      if (p === '好感度' || p === '好感' || p === '肉体值' || p === '肉体' || p === '阶段值' || p === '阶段' || p === '嫉妒值' || p === '嫉妒') {
        dimension = p.indexOf('肉') === 0 ? 'P' : (p.indexOf('阶') === 0 ? 'R' : (p.indexOf('嫉') === 0 ? 'I' : 'E'));
        continue;
      }
      // 注意：短横必须放在字符类末尾或转义。写成 [+-＋－−—] 会被 JS 当成「+ 到 ＋」的
      // Unicode 范围（U+002B–U+FF0B），把数字也吞进去，导致 +99 解析成 +9、+12 解析成 +2。
      const numMatch = p.match(/^([+\-＋－−—])?\s*(\d+(?:\.\d+)?)$/);
      if (numMatch && isNaN(baseValue)) {
        if (!sign && numMatch[1]) {
          sign = (numMatch[1] === '-' || numMatch[1] === '－' || numMatch[1] === '−' || numMatch[1] === '—') ? '-' : '+';
        }
        baseValue = parseFloat(numMatch[2]);
        continue;
      }
      if (!charName) {
        charName = p;
      }
    }
    if (!level) level = 'L';
    if (!sign) sign = '+';
    if (isNaN(baseValue)) return null;
    const eventType = levelMap[level] || '日常';
    const direction = sign === '+' ? '正向' : '负向';
    const canonicalTag = '[Sylveina|' + (charName ? charName + '|' : '') + level + '|' + sign + '|' + baseValue + ']';
    // 规范化时保留角色名，否则多人卡标签在「正则美化」环节会被抹成无名标签，导致一人加分全员加分
    const canonicalSimpleTag = '[Sylveina|' + (charName ? charName + '|' : '') + level + '|' + sign + '|' + baseValue + ']';
    return {
      level: level,
      sign: sign,
      direction: direction,
      eventType: eventType,
      dimension: dimension || 'E',
      baseValue: baseValue,
      charName: charName,
      fullMatch: fullMatch || canonicalTag,
      canonicalTag: canonicalTag,
      canonicalSimpleTag: canonicalSimpleTag
    };
  }

  function extractAllSylveinaTags(mes) {
    const out = [];
    if (!mes) return out;
    const text = String(mes);
    const re = new RegExp(SYLVEINA_TAG_GLOBAL_RE.source, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      const parsed = parseSylveinaBody(m[1], m[0]);
      if (parsed) {
        parsed.index = m.index;
        parsed.end = re.lastIndex;
        out.push(parsed);
      }
    }
    return out;
  }

  function extractSylveinaTag(mes) {
    const all = extractAllSylveinaTags(mes);
    if (!all.length) return null;
    return all[all.length - 1];
  }

  function extractBaseValueFromLatestAiMessage(eventType) {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || !found.msg.mes) return null;
      const tag = extractSylveinaTag(found.msg.mes);
      if (!tag) return null;
      return { value: tag.baseValue, direction: tag.direction, level: tag.level, eventType: tag.eventType || eventType || '日常', dimension: tag.dimension || 'E', charName: tag.charName || '', fullMatch: tag.fullMatch };
    } catch (e) { return null; }
  }

  function extractFirstMeetTag(mes) {
    if (!mes) return null;
    // 同理，这里的 [+-＋－] 也必须转义短横，否则会把数字当成符号吞掉
    const m = String(mes).match(/[\[\u3014\u3010\uff3b]\s*初见\s*[|｜]\s*优势\s*([+\-＋－]?\d+)\s*[|｜]\s*劣势\s*([+\-＋－]?\d+)\s*[\]\u3015\u3011\uff3d]/);
    if (!m) return null;
    const adv = Number(String(m[1]).replace('＋', '+').replace('－', '-')) || 0;
    const dis = Number(String(m[2]).replace('＋', '+').replace('－', '-')) || 0;
    return { 优势: adv, 劣势: dis, fullMatch: m[0] };
  }

  function extractDebuffTag(mes) {
    if (!mes) return null;
    const m = String(mes).match(/[\[\u3014\u3010\uff3b]\s*踩雷\s*[\]\u3015\u3011\uff3d]/);
    if (!m) return null;
    return { fullMatch: m[0] };
  }

  /* 初见加成只有 0/+3/+6/+9 与 0/-3/-6 这几档，由脚本执行：
     AI 写 +999 或 -999 时只取最近的合法档位，不能靠一个数字直接把开局判定拉满。 */
  const FIRST_MEET_ADV_TIERS = [0, 3, 6, 9];
  const FIRST_MEET_DIS_TIERS = [0, -3, -6];
  function nearestFirstMeetTier(v, tiers) {
    const n = Number(v);
    if (!isFinite(n)) return 0;
    let best = 0; let bestDist = Infinity;
    for (let i = 0; i < tiers.length; i++) {
      const d = Math.abs(tiers[i] - n);
      if (d < bestDist) { bestDist = d; best = tiers[i]; }
    }
    return best;
  }
  function clampFirstMeetAdv(v) { return nearestFirstMeetTier(v, FIRST_MEET_ADV_TIERS); }
  function clampFirstMeetDis(v) { return nearestFirstMeetTier(v, FIRST_MEET_DIS_TIERS); }

  /* 失败时的「印象底分」：至少 1d4。
     初见不是「要么一见钟情要么当没这个人」，没通过也要留下一点印象，
     否则建档完 E=0，后面全靠日常 0.5~2 一点点爬，玩家体感就是「根本没投资」。 */
  const FIRST_MEET_FLOOR_DICE = 4;
  function firstMeetThreshold(mode) { return mode === 'easy' ? 8 : 13; }
  function firstMeetCoeff(mode) { return mode === 'easy' ? 1.5 : (mode === 'normal' ? 1.0 : 0.5); }
  function firstMeetMode() { try { return getSettings().firstMeetMode === 'dice' ? 'dice' : 'hybrid'; } catch (e) { return 'hybrid'; } }
  function firstMeetFloorOn() { try { return getSettings().firstMeetFloor !== false; } catch (e) { return true; } }

  /* ── 初见投资：全系统唯一的掷骰入口 ──────────────────────
     档位（优势/劣势）可以由 AI 给——它读过角色卡，判断「玩家设定踩中了哪些喜好」是它的强项；
     但最终数值一定在这里掷出来，AI 写的任何「好感度=XX」都不进这条链路。
     这样既有人设依据，又保留运气，还能被自检复现（骰点、档位、阈值全留痕）。
     以前只有「AI 必须写标签」一条路：模型忘了写、或写了没过阈值，E 就停在 0，
     于是出现了「自动建档之后初见投资等于没生效、从零开始加」的问题。 */
  function rollFirstMeetInvestment(mode, advIn, disIn, opts) {
    opts = opts || {};
    const adv = clampFirstMeetAdv(advIn);
    const dis = clampFirstMeetDis(disIn);
    const dice = Math.floor(Math.random() * 20) + 1;
    const threshold = firstMeetThreshold(mode);
    const total = dice + adv + dis;
    let tier = '失败'; let delta = 0; let floor = 0;
    if (dice === 20) { tier = '大成功'; delta = 30; }
    else if (dice === 1) { tier = '大失败'; delta = -10; }
    else if (total >= threshold) { tier = '成功'; delta = roundHalf((total / 2) * firstMeetCoeff(mode)); }
    else if (opts.floor !== false) { floor = Math.floor(Math.random() * FIRST_MEET_FLOOR_DICE) + 1; delta = floor; }
    return { dice: dice, adv: adv, dis: dis, total: total, threshold: threshold, tier: tier, delta: delta, floor: floor };
  }

  /* 初见结算。opts：
       allowScriptRoll —— 没有 AI 标签也照掷（建档、补录新角色时用）
       adv / dis       —— 没有标签时的档位来源（角色卡推断 / 开局适配）
       source          —— 写进 _初见.来源，自检能回溯这笔分是谁给的
       force           —— 忽略「不在场」限制（刚建档还没轮到场次判定时）
       floor           —— 是否给失败保底，默认跟设置走
       noTag           —— 本轮不许碰 [初见|…]：一个标签只能被一个人消费，
                          同一轮里有刚建档的新人时，先紧着他们，别让老角色截胡 */
  async function processFirstMeetForChar(charName, ch, mode, opts) {
    opts = opts || {};
    const quota = ch._quota || (ch._quota = {});
    if (quota._firstMeetDone === true) return null;
    if (ch.在场 !== true && opts.force !== true) return null;
    const found = getLatestAiMessage();
    if ((!found || !found.msg) && !opts.allowScriptRoll) return null;
    const mes = String((found && found.msg && found.msg.mes) || '');
    const tag = (firstMeetMode() === 'hybrid' && !opts.noTag) ? extractFirstMeetTag(mes) : null;
    // 严格模式（dice）：只认脚本掷骰，连 AI 标签的档位都不采信
    if (!tag && !opts.allowScriptRoll) return null;
    const adv = tag ? tag.优势 : (opts.adv || 0);
    const dis = tag ? tag.劣势 : (opts.dis || 0);
    const useFloor = (opts.floor === undefined ? firstMeetFloorOn() : opts.floor !== false);
    const inv = rollFirstMeetInvestment(mode, adv, dis, { floor: useFloor });
    const before = Number(ch.好感度) || 0;
    const newE = roundHalf(before + inv.delta);
    ch.好感度 = newE;
    // R 一律由 E 推导：以前成功分支硬写 R=1，会出现「E=3.5 却写着愿意认识」的自相矛盾
    ch.阶段值 = getRStageFromE(newE).r;
    quota._firstMeetDone = true;
    try { delete quota._初见待结算; } catch (e) { quota._初见待结算 = false; }
    let worldTime = String(opts.worldTime || '');
    if (!worldTime) {
      try { const d = readMvuLatest(); worldTime = String((d && d.stat_data && d.stat_data.世界 && d.stat_data.世界.时间) || ''); } catch (e) {}
    }
    quota._初见 = {
      骰: inv.dice, 优势: inv.adv, 劣势: inv.dis, 合计: inv.total, 阈值: inv.threshold,
      档: inv.tier, 投入: inv.delta, 底分: inv.floor,
      来源: tag ? 'AI标签' : (opts.source || '脚本兜底'),
      之前: before, 时间: worldTime
    };
    if (tag) { try { found.msg.mes = String(found.msg.mes).replace(tag.fullMatch, '').trim(); } catch (e) {} }
    const diceTxt = '1d20=' + inv.dice + (inv.adv || inv.dis ? '（优势 ' + inv.adv + ' / 劣势 ' + inv.dis + '）' : '');
    let resultText = '';
    if (inv.tier === '大成功') resultText = '大成功 ' + diceTxt + ' → E+30，关系直接进入愿意认识';
    else if (inv.tier === '大失败') resultText = '大失败 ' + diceTxt + ' → E-10，第一印象就是负的';
    else if (inv.tier === '成功') resultText = '成功 ' + diceTxt + '，合计 ' + inv.total + ' ≥ ' + inv.threshold + ' → E+' + inv.delta;
    else resultText = '失败 ' + diceTxt + '，合计 ' + inv.total + ' < ' + inv.threshold + ' → 只留下 ' + inv.delta + ' 点印象底分';
    return {
      dice: inv.dice, total: inv.total, threshold: inv.threshold, tier: inv.tier,
      delta: inv.delta, newE: newE, newR: ch.阶段值,
      source: quota._初见.来源, char: charName, resultText: resultText
    };
  }

  function getLatestAiMessage() {
    try { const ctx = getSTCtx(); if (!ctx || !ctx.chat || !ctx.chat.length) return null; for (let i = ctx.chat.length - 1; i >= 0; i--) { if (ctx.chat[i] && !ctx.chat[i].is_user) return { msg: ctx.chat[i], idx: i }; } } catch (e) {}
    return null;
  }

  function hasAnyStatDataInRecentMessages(limit) {
    limit = limit || 3;
    try {
      const ctx = getSTCtx();
      if (!ctx || !ctx.chat || !ctx.chat.length) return false;
      let checked = 0;
      for (let i = ctx.chat.length - 1; i >= 0 && checked < limit; i--) {
        const m = ctx.chat[i]; if (!m || m.is_user) continue;
        checked++;
        const vars = m.variables;
        if (vars) {
          if (Array.isArray(vars)) { for (let k = 0; k < vars.length; k++) { if (vars[k] && vars[k].stat_data) return true; } }
          else if (typeof vars === 'object') { if (vars.stat_data) return true; if (vars[0] && vars[0].stat_data) return true; }
        }
        if (m.mvu && (m.mvu.stat_data || (m.mvu.variables && m.mvu.variables[0] && m.mvu.variables[0].stat_data))) return true;
        if (m.extra && m.extra.stat_data) return true;
      }
    } catch (e) {}
    return false;
  }
