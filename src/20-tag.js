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
      const numMatch = p.match(/^([+-＋－−—])?\s*(\d+(?:\.\d+)?)$/);
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
    const m = String(mes).match(/[\[\u3014\u3010\uff3b]\s*初见\s*[|｜]\s*优势\s*([+-＋－]?\d+)\s*[|｜]\s*劣势\s*([+-＋－]?\d+)\s*[\]\u3015\u3011\uff3d]/);
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

  async function processFirstMeetForChar(charName, ch, mode) {
    const quota = ch._quota || (ch._quota = {});
    if (quota._firstMeetDone === true) return null;
    if (ch.在场 !== true) return null;
    const found = getLatestAiMessage();
    if (!found || !found.msg) return null;
    const mes = String(found.msg.mes || '');
    const tag = extractFirstMeetTag(mes);
    if (!tag) return null;
    const dice = Math.floor(Math.random() * 20) + 1;
    const threshold = (mode === 'easy') ? 8 : 13;
    const total = dice + (Number(tag.优势) || 0) + (Number(tag.劣势) || 0);
    let newE = Number(ch.好感度) || 0; let newR = Number(ch.阶段值) || 0; let resultText = '';
    if (dice === 20) { newE = 30; newR = 1; resultText = '大成功 → E=30, R=1'; }
    else if (dice === 1) { newE = Math.max(-15, -10); newR = 0; resultText = '大失败 → E=-10, R=0'; }
    else if (total >= threshold) {
      const coeff = (mode === 'easy') ? 1.5 : (mode === 'normal') ? 1.0 : 0.5;
      const delta = Math.round((total / 2) * coeff * 2) / 2;
      newE = roundHalf(newE + delta); newR = 1;
      resultText = '成功 ' + total + '≥' + threshold + ' → E+=' + delta + ', R=1';
    } else { resultText = '失败 ' + total + '<' + threshold + ' → E不变, R=0'; }
    ch.好感度 = newE; ch.阶段值 = newR; quota._firstMeetDone = true;
    try { found.msg.mes = String(found.msg.mes).replace(tag.fullMatch, '').trim(); } catch (e) {}
    return { dice: dice, total: total, threshold: threshold, newE: newE, newR: newR, resultText: resultText };
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
