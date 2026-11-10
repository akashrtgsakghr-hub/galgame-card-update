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
        ch.心声 = v; applied.push(charName + '.心声');
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
    if (['情绪', '心情', '表情', '心声', '内心话', '独白', '在场', '重要度', '角色定位'].indexOf(f) >= 0) return 'apply';
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
  function applyBackendVariablesFromLatest() {
    try {
      const found = getLatestAiMessage();
      if (!found || !found.msg || typeof found.msg.mes !== 'string') return null;
      const res = ingestBackendVariables(found.msg.mes);
      if (res.text !== found.msg.mes) found.msg.mes = res.text;
      if (res.applied.length && res.statData) {
        try { writeMvuLatest(res.statData); } catch (e) {}
        try { console.log('[Doki] 后台变量同步：', res.applied.join('｜')); } catch (e) {}
      }
      return res;
    } catch (e) { return null; }
  }

  // 剧情里「次日 / 三天后 / 一周后」这类明确的时间流逝，兜底换算成天数
