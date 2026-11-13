  function formatGameTime(dateObj) {
    const d = dateObj instanceof Date ? dateObj : parseGameTime(dateObj);
    if (!d || isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return y + '年' + mo + '月' + da + '日 · 星期' + wd + ' · ' + hh + ':' + mm;
  }

  /* ── 后台变量块：AI 写的「世界.时间=… / 角色.X.心声=…」在此被脚本吃进本地状态 ── */
  const BACKEND_VAR_LINE_RE = /^[ \t>|]*(?:[-*·•][ \t]*)?(世界|角色)\s*[.．]\s*([^\r\n=＝:：]{1,60}?)\s*[=＝:：]\s*(.*?)[ \t]*$/gm;

  function _cleanBackendValue(raw) {
    let v = String(raw == null ? '' : raw).trim();
    v = v.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
    v = v.replace(/^[*`"'「『【\[（(]+/, '').replace(/[*`"'」』】\]）)]+$/, '').trim();
    return v;
  }
  function _parseBackendBool(raw) {
    const v = String(raw == null ? '' : raw).trim().toLowerCase();
    if (['true', '是', '1', '在', '在场', 'yes', 'on', '出场'].indexOf(v) >= 0) return true;
    if (['false', '否', '0', '不在', '离场', 'no', 'off', '退场'].indexOf(v) >= 0) return false;
    return null;
  }
  /* 角色名归一化：AI 经常把「长谷川 茗」写成「长谷川茗」、「太宰治（Sylveina）」写成「太宰治」，
     直接按字符串取会取不到人——于是情绪/心声/在场整轮被丢掉，表现就是「建档之后再也不更新」。 */
  function _normCharKey(raw) {
    return String(raw == null ? '' : raw)
      .replace(/[（(【\[].*?[）)】\]]/g, '')
      .replace(/[\s\u3000·・.\-_—~～'"“”]/g, '')
      .toLowerCase();
  }
  function _findCharKey(chars, raw) {
    if (!chars || typeof chars !== 'object') return '';
    const name = String(raw == null ? '' : raw).trim();
    if (!name) return '';
    if (Object.prototype.hasOwnProperty.call(chars, name)) return name;
    const target = _normCharKey(name);
    if (!target) return '';
    let exact = '';
    let partial = '';
    for (const key in chars) {
      if (!Object.prototype.hasOwnProperty.call(chars, key)) continue;
      const nk = _normCharKey(key);
      if (!nk) continue;
      if (nk === target) { exact = key; break; }
      if (target.length >= 2 && nk.length >= 2 && (nk.indexOf(target) >= 0 || target.indexOf(nk) >= 0)) {
        if (!partial || nk.length > _normCharKey(partial).length) partial = key;
      }
    }
    return exact || partial;
  }

  function _applyBackendVarLines(payload, statData, applied) {
    if (!payload || !statData) return;
    if (!statData.世界) statData.世界 = { 时间: '2000年01月01日 · 星期六 · 00:00', _内部流逝天数: 0, _上次推进时间: '2000年01月01日 · 星期六 · 00:00' };
    const re = new RegExp(BACKEND_VAR_LINE_RE.source, 'gm');
    let m;
    while ((m = re.exec(payload)) !== null) {
      const scope = m[1];
      const parts = String(m[2] || '').split(/[.．]/).map(function(s) { return s.trim(); }).filter(Boolean);
      const rawValue = m[3];
      if (!parts.length) continue;
      if (scope === '世界') {
        const field = parts[0];
        if (field === '时间' || field === '当前时间' || field === 'time') {
          const v = _cleanBackendValue(rawValue);
          const d = parseGameTime(v);
          if (!d) continue;
          const normalized = formatGameTime(d);
          if (normalized === statData.世界.时间) continue;
          const curDate = parseGameTime(statData.世界.时间);
          // 世界时间只进不退，防止回忆/闪回里的旧日期把面板时间改回去
          if (curDate && d.getTime() < curDate.getTime()) continue;
          statData.世界.时间 = normalized;
          // 告诉时钟推进：这一轮的时间已经由正文给定了，别再叠加默认步长
          statData.世界._时钟已由正文确定 = true;
          applied.push('世界时间→' + normalized);
        } else if (field === '地点') {
          const v = _cleanBackendValue(rawValue).slice(0, 60);
          if (!v) continue;
          statData.世界.地点 = v;
          applied.push('地点→' + v);
        }
        continue;
      }
      const rawCharName = parts[0];
      const field = parts[1];
      if (!rawCharName || !field || !statData.角色) continue;
      const charName = _findCharKey(statData.角色, rawCharName) || rawCharName;
      const ch = statData.角色[charName];
      if (!ch || isCharSkeleton(ch)) continue;
      if (field === '情绪' || field === '心情' || field === '表情') {
        const v = _cleanBackendValue(rawValue).slice(0, 8);
        if (!v) continue;
        ch.情绪 = v; applied.push(charName + '.情绪');
      } else if (field === '心声' || field === '内心话' || field === '独白') {
        const v = _cleanBackendValue(rawValue).slice(0, 300);
        if (!v) continue;
        if (v === String(ch.心声 || '').trim()) { applied.push(charName + '.心声重复'); continue; }
        ch.心声 = v; applied.push(charName + '.心声');
      } else if (field === '对玩家称呼' || field === '专属称呼') {
        // 专属称呼只在首次生成时写入；后续每轮读档注入，避免模型每轮改名。
        const v = _cleanBackendValue(rawValue).replace(/[。.!！?？]+$/g, '').slice(0, 16);
        if (!v || String(ch.对玩家称呼 || '').trim()) continue;
        ch.对玩家称呼 = v;
        applied.push(charName + '.对玩家称呼');
      } else if (field === '在场') {
        const b = _parseBackendBool(rawValue);
        if (b === null || ch.在场 === b) continue;
        ch.在场 = b; applied.push(charName + '.在场=' + (b ? 'true' : 'false'));
      } else if (field === '重要度' || field === '角色定位') {
        const v = _cleanBackendValue(rawValue);
        if (['主要', '主角', '次要', 'NPC', '路人'].indexOf(v) < 0) continue;
        ch.重要度 = (v === '主角' || v === '主要') ? '主要' : (v === '路人' ? 'NPC' : v);
        applied.push(charName + '.重要度=' + ch.重要度);
      }
    }
  }
  // 判断一行后台变量是否归本脚本管：apply=读进档案并隐藏；strip=数值由脚本独占，只隐藏；keep=不认识，原样留着给别的插件/正则
  function _backendFieldKind(scope, parts) {
    if (!parts || !parts.length) return 'keep';
    if (scope === '世界') {
      const f = parts[0];
      if (f === '时间' || f === '当前时间' || f === 'time' || f === '地点') return 'apply';
      return 'keep';
    }
    const f = parts[1];
    if (!f) return 'keep';
    if (['情绪', '心情', '表情', '心声', '内心话', '独白', '在场', '重要度', '角色定位', '对玩家称呼', '专属称呼'].indexOf(f) >= 0) return 'apply';
    if (['好感度', '好感', '肉体值', '肉体', '阶段值', '阶段', '嫉妒值', '嫉妒'].indexOf(f) >= 0) return 'strip';
    return 'keep';
  }
  function _isOwnedBackendLine(line) {
    const m = String(line || '').match(/^[ \t>|]*(?:[-*·•][ \t]*)?(世界|角色)\s*[.．]\s*([^\r\n=＝:：]{1,60}?)\s*[=＝:：]/);
    if (!m) return false;
    const parts = String(m[2] || '').split(/[.．]/).map(function(s) { return s.trim(); }).filter(Boolean);
    return _backendFieldKind(m[1], parts) !== 'keep';
  }
  // 把最新 AI 楼层里的后台变量块吃进本地状态，并从正文里清掉「属于本脚本」的那些行
  function ingestBackendVariables(mes, targetStat) {
    const out = { applied: [], text: String(mes == null ? '' : mes), statData: null };
    if (typeof mes !== 'string' || !mes) return out;
    const data = targetStat ? { stat_data: targetStat } : loadLocalState();
    const statData = data && data.stat_data;
    if (!statData) return out;
    let text = String(mes);
    if (text.indexOf('UpdateVariable') >= 0) {
      text = text.replace(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/gi, function(full, inner) {
        _applyBackendVarLines(inner, statData, out.applied);
        const kept = String(inner).split(/\r?\n/).filter(function(line) { return line.trim() && !_isOwnedBackendLine(line); });
        // 不认识的变量原样留在块里，避免破坏其它插件/正则的变量链
        return kept.length ? '<UpdateVariable>\n' + kept.join('\n') + '\n</UpdateVariable>' : '';
      });
    }
    _applyBackendVarLines(text, statData, out.applied);
    const cleaned = text.replace(new RegExp(BACKEND_VAR_LINE_RE.source, 'gm'), function(line) {
      return _isOwnedBackendLine(line) ? '' : line;
    }).replace(/\n{3,}/g, '\n\n');
    out.text = cleaned;
    out.statData = statData;
    return out;
  }
  async function applyBackendVariablesFromLatest() {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || typeof found.msg.mes !== 'string') return null;
      const rawMessage = String(found.msg.mes);
      const floorKey = String(found.idx);
      const res = ingestBackendVariables(rawMessage);
      if (res.text !== rawMessage) found.msg.mes = res.text;
      if (!res.statData || !res.statData.角色) return res;

      // 每条 AI 回复都登记一次同步结果。即使模型漏写心声，状态卡也会明确显示「本轮未收到」，
      // 不再让玩家误以为脚本没运行、或把上一轮心声误当成刚更新的内容。
      const voiceReceived = {};
      const voiceRepeated = {};
      (res.applied || []).forEach(function(item) {
        const value = String(item);
        const repeatSuffix = '.心声重复';
        const voiceSuffix = '.心声';
        if (value.slice(-repeatSuffix.length) === repeatSuffix) voiceRepeated[value.slice(0, -repeatSuffix.length)] = true;
        else if (value.slice(-voiceSuffix.length) === voiceSuffix) voiceReceived[value.slice(0, -voiceSuffix.length)] = true;
      });
      let heartbeatChanged = false;
      Object.keys(res.statData.角色).forEach(function(name) {
        const ch = res.statData.角色[name];
        if (!ch || isCharSkeleton(ch) || ch.在场 === false) return;
        if (!ch._quota || typeof ch._quota !== 'object') ch._quota = {};
        const q = ch._quota;
        if (String(q._心声同步楼层 == null ? '' : q._心声同步楼层) === floorKey) return;
        q._心声同步楼层 = floorKey;
        q._心声同步状态 = voiceReceived[name] ? '已收到' : (voiceRepeated[name] ? '本轮重复' : '本轮未收到');
        q._心声同步时间 = Date.now();
        heartbeatChanged = true;
      });

      if ((res.applied && res.applied.length) || heartbeatChanged) {
        const ok = await writeMvuLatest(res.statData);
        if (ok && res.applied && res.applied.length) {
          try { console.log('[Doki] 后台变量同步：', res.applied.join('｜')); } catch (e) {}
        }
        try { refreshPanel(); } catch (e) {}
      }
      return res;
    } catch (e) { return null; }
  }

  // 中文数字转整数，供「半个月 / 三个月 / 一年」等时间跨度解析使用。
  function parseChineseCount(raw) {
    const str = String(raw || '').trim();
    if (!str) return 0;
    if (/^\d+(?:\.\d+)?$/.test(str)) return Number(str);
    const digit = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    if (str === '十') return 10;
    if (str.indexOf('百') >= 0) {
      const p = str.split('百');
      const hundreds = p[0] ? (p[0] === '十' ? 10 : (digit[p[0]] || 0)) : 1;
      const rest = p[1] || '';
      return hundreds * 100 + (rest ? parseChineseCount(rest) : 0);
    }
    if (str.indexOf('十') >= 0) {
      const p = str.split('十');
      const tens = p[0] ? (digit[p[0]] || 0) : 1;
      const ones = p[1] ? (digit[p[1]] || 0) : 0;
      return tens * 10 + ones;
    }
    if (str.length === 1 && digit[str] !== undefined) return digit[str];
    let total = 0;
    for (let i = 0; i < str.length; i++) { if (digit[str[i]] === undefined) return 0; total = total * 10 + digit[str[i]]; }
    return total;
  }

  function addCalendarMonths(dateObj, months) {
    const d = new Date(dateObj.getTime());
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
  }

  // 识别玩家明确要求的时间跨度。玩家输入优先于 AI 自行给出的时间，避免剧情跳一年、后台却只走七天。
  function parsePlayerTimeJumpTarget(fromDate, playerText) {
    if (!fromDate || !playerText) return null;
    const text = String(playerText);
    const rel = text.match(/(?:大后天|后天|明天|明日|次日|翌日|下周|下个星期|下个月)/);
    if (rel) {
      const d = new Date(fromDate.getTime());
      if (/大后天/.test(rel[0])) d.setDate(d.getDate() + 3);
      else if (/后天/.test(rel[0])) d.setDate(d.getDate() + 2);
      else if (/明天|明日|次日|翌日/.test(rel[0])) d.setDate(d.getDate() + 1);
      else if (/下周|下个星期/.test(rel[0])) d.setDate(d.getDate() + 7);
      else if (/下个月/.test(rel[0])) return addCalendarMonths(d, 1);
      return d;
    }
    const amountRe = /(半个月|半年|[零〇一二两三四五六七八九十百\d]+年|[零〇一二两三四五六七八九十百\d]+个?月|[零〇一二两三四五六七八九十\d]+个?(?:星期|周)|[零〇一二两三四五六七八九十百\d]+天|[零〇一二两三四五六七八九十百\d]+日)/g;
    let m;
    while ((m = amountRe.exec(text)) !== null) {
      const token = m[1];
      const before = text.slice(Math.max(0, m.index - 14), m.index);
      const after = text.slice(m.index + token.length, m.index + token.length + 8);
      const hasAction = /跳过|快进|推进|度过|经过|过去|过了|又过了|时间.{0,5}(?:到|跳|快进)|直接到|来到|隔了|转眼/.test(before);
      const hasFuture = /^(?:\s*)(?:之后|以后|后|过去)/.test(after);
      const isPlanningTalk = /打算|计划|准备|希望|预计|想在|想要/.test(before) && !hasAction;
      if ((!hasAction && !hasFuture) || isPlanningTalk) continue;
      let d = new Date(fromDate.getTime());
      if (token === '半个月') d.setDate(d.getDate() + 15);
      else if (token === '半年') d = addCalendarMonths(d, 6);
      else {
        const unit = /年$/.test(token) ? 'year' : (/月$/.test(token) ? 'month' : (/(?:周|星期)$/.test(token) ? 'week' : 'day'));
        const numberText = token.replace(/个?(?:星期|周|月|年|天|日)$/, '');
        const n = parseChineseCount(numberText);
        if (!(n > 0) || n > 100) continue;
        if (unit === 'year') d = addCalendarMonths(d, n * 12);
        else if (unit === 'month') d = addCalendarMonths(d, n);
        else if (unit === 'week') d.setDate(d.getDate() + n * 7);
        else d.setDate(d.getDate() + n);
      }
      if (d.getTime() > fromDate.getTime()) return d;
    }
    return null;
  }

  // 正文时间转场兜底。这里不再把跨度截断到 7 天；玩家明确跨度由上面的日历算法精确换算。
