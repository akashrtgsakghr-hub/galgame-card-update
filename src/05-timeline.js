  function extractJson(text) {
    if (!text) return null;
    const s = String(text).trim();
    try { return JSON.parse(s); } catch (e) {}
    const m1 = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m1) { try { return JSON.parse(m1[1].trim()); } catch (e) {} }
    const m2 = s.match(/\{[\s\S]*\}/);
    if (m2) { try { return JSON.parse(m2[0]); } catch (e) {} }
    return null;
  }

  // 从世界书条目里解析时间线事件（老玩家的兼容通道，内置仓库为空时才靠它）
  function _parseWorldbookTimelineEvents(entries) {
    const events = [];
    if (!Array.isArray(entries)) return events;
    const tag = getTimelineTag();
    const isTarget = function(title) {
      if (tag) return title.indexOf(tag) === 0;
      return title.indexOf('[Timeline]') === 0;
    };
    for (const e of entries) {
      const title = String(e.title || '');
      if (!isTarget(title)) continue;
      const content = String(e.content || '');
      // 单条目多事件：按「时间：xxx」块分割
      const blocks = content.split(/\n(?=时间\s*[:：])/).map(function(x) { return x.trim(); }).filter(Boolean);
      const list = blocks.length ? blocks : [content];
      for (const blk of list) {
        const mt = blk.match(/时间\s*[:：]\s*([^\n]+)/);
        const mc = blk.match(/内容\s*[:：]\s*([\s\S]+)/);
        const timeStr = mt ? mt[1].trim() : '';
        const desc = mc ? mc[1].trim() : blk.trim();
        if (!timeStr) continue;
        const isMajor = /（重大）|\(重大\)/.test(desc) || /重大/.test(title);
        const name = desc.slice(0, 40) || title.replace(/^\[Timeline\]\s*/, '');
        events.push({ name: name, time: timeStr, isMajor: isMajor, raw: blk });
      }
      // 兜底：多条目模式每个条目只对应一个事件，时间从正文首行抓
      if (list.length === 1 && events.length && events[events.length - 1].time === '') {
        const mt = content.match(TL_TIME_RE);
        if (mt) events[events.length - 1].time = mt[0];
      }
    }
    events.sort(function(a, b) {
      const da = parseGameTime(a.time), db = parseGameTime(b.time);
      if (da && db) return da.getTime() - db.getTime();
      return 0;
    });
    return events;
  }

  /* ── 时间线内置仓库：不建世界书也能用 ─────────────────────
     数据存在本机 localStorage，按角色卡分档（换对话、开新档都跟着卡走）。
     结构：[{ id, name, time, isMajor, done, source }] */
  const TIMELINE_STORE_KEY = 'moon_phase_timeline_events_v1';

  function timelineScopeKey() {
    try {
      const ctx = getSTCtx();
      const ch = (ctx && ctx.characters && ctx.characters[ctx.characterId]) || {};
      const id = ch.avatar || ch.name || (ctx && ctx.name2) || '';
      return 'c:' + String(id || 'default');
    } catch (e) { return 'c:default'; }
  }

  function _tlReadAll() {
    try {
      const raw = getStorage().getItem(TIMELINE_STORE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }

  function normalizeTimelineItem(x) {
    const o = (x && typeof x === 'object') ? x : {};
    return {
      id: String(o.id || ('tl_' + Math.random().toString(36).slice(2, 8))),
      name: String(o.name || o.title || '未命名事件').slice(0, 80),
      time: String(o.time || '').trim(),
      isMajor: o.isMajor === true || /重大|关键/.test(String(o.type || '')),
      done: o.done === true,
      source: String(o.source || 'local')
    };
  }

  function loadTimelineStore() {
    const all = _tlReadAll();
    const list = all[timelineScopeKey()];
    if (!Array.isArray(list)) return [];
    return list.filter(Boolean).map(normalizeTimelineItem).sort(function(a, b) {
      const da = parseGameTime(a.time), db = parseGameTime(b.time);
      if (da && db) return da.getTime() - db.getTime();
      if (da) return -1; if (db) return 1; return 0;
    });
  }

  function saveTimelineStore(list) {
    try {
      const all = _tlReadAll();
      all[timelineScopeKey()] = (Array.isArray(list) ? list : []).map(normalizeTimelineItem);
      getStorage().setItem(TIMELINE_STORE_KEY, JSON.stringify(all));
      return true;
    } catch (e) { return false; }
  }

  function addTimelineEvents(items) {
    const list = loadTimelineStore();
    const seen = {};
    list.forEach(function(e) { seen[e.name + '@' + e.time] = 1; });
    let added = 0;
    (items || []).forEach(function(raw) {
      const it = normalizeTimelineItem(raw);
      const key = it.name + '@' + it.time;
      if (seen[key]) return;
      seen[key] = 1;
      list.push(it);
      added++;
    });
    saveTimelineStore(list);
    return added;
  }

  function updateTimelineEvent(id, patch) {
    const list = loadTimelineStore();
    let hit = false;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id !== id) continue;
      list[i] = normalizeTimelineItem(Object.assign({}, list[i], patch || {}));
      hit = true; break;
    }
    if (hit) saveTimelineStore(list);
    return hit;
  }

  function removeTimelineEvent(id) {
    const list = loadTimelineStore().filter(function(e) { return e.id !== id; });
    saveTimelineStore(list);
  }

  function clearTimelineStore() { saveTimelineStore([]); }

  function markTimelineDoneByName(name) {
    if (!name) return;
    const list = loadTimelineStore();
    let hit = false;
    list.forEach(function(e) { if (e.name === name) { e.done = true; hit = true; } });
    if (hit) saveTimelineStore(list);
  }

  // 把「时间：xxx / 内容：yyy」文本或 JSON 数组解析成标准事件
  function parseTimelineText(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];
    const asJson = extractJson(raw);
    if (Array.isArray(asJson)) {
      return asJson.map(function(it) {
        if (!it || typeof it !== 'object') return null;
        return normalizeTimelineItem({
          name: it.name || it.title || it.comment || it.内容 || '',
          time: it.time || it.时间 || '',
          type: it.type || it.类型 || '',
          isMajor: it.isMajor === true || /重大|关键/.test(String(it.type || it.类型 || it.content || ''))
        });
      }).filter(function(x) { return x && x.name; });
    }
    const blocks = raw.split(/\n{2,}/).map(function(t) { return t.trim(); }).filter(Boolean);
    const list = [];
    blocks.forEach(function(blk) {
      const mt = blk.match(/时间\s*[:：]\s*([^\n]+)/);
      let timeStr = mt ? mt[1].trim() : '';
      if (!timeStr) { const mm = blk.match(TL_TIME_RE); if (mm) timeStr = mm[0]; }
      if (!timeStr) return;
      const mc = blk.match(/内容\s*[:：]\s*([\s\S]+)/);
      let desc = mc ? mc[1].trim() : blk.replace(/时间\s*[:：][^\n]+/, '').trim();
      desc = desc.replace(/\n+/g, ' ').trim();
      const isMajor = /（重大）|\(重大\)|\[重大\]|重大/.test(desc);
      desc = desc.replace(/（重大）|\(重大\)|\[重大\]/g, '').trim();
      const mName = desc.match(/【([^】]+)】/);
      const name = (mName ? mName[1] : desc).slice(0, 60) || '未命名事件';
      list.push(normalizeTimelineItem({ name: name, time: timeStr, isMajor: isMajor }));
    });
    return list;
  }

  // 统一出口：内置仓库优先，世界书作为可选补充
  function getTimelineEvents(entries) {
    const merged = [];
    const seen = {};
    loadTimelineStore().forEach(function(it) {
      const key = it.name + '@' + it.time;
      seen[key] = 1;
      merged.push({ name: it.name, time: it.time, isMajor: !!it.isMajor, done: !!it.done, id: it.id, source: 'local', raw: it.name });
    });
    _parseWorldbookTimelineEvents(entries).forEach(function(e) {
      const key = e.name + '@' + e.time;
      if (seen[key]) return;
      seen[key] = 1;
      merged.push({ name: e.name, time: e.time, isMajor: e.isMajor, done: false, source: 'book', raw: e.raw });
    });
    merged.sort(function(a, b) {
      const da = parseGameTime(a.time), db = parseGameTime(b.time);
      if (da && db) return da.getTime() - db.getTime();
      if (da) return -1; if (db) return 1; return 0;
    });
    return merged;
  }

  function scanTimelineCandidates(entries) {
    const out = [];
    if (!Array.isArray(entries)) return out;
    const tlTag = getTimelineTag();
    let hasMulti = false;
    for (const e of entries) {
      const title = String(e.title || '');
      if (title.indexOf('[Timeline]') === 0) { hasMulti = true; break; }
    }
    if (hasMulti) out.push({ type: 'ours-multi', label: '当前：多条目模式（多个 [Timeline] 条目）' });
    for (const e of entries) {
      const title = String(e.title || '');
      if (title.indexOf('[Timeline]') === 0 || title.indexOf('[Initvar]') === 0) continue;
      const content = String(e.content || '');
      if (TL_TIME_RE.test(content) && /事件|发生|时间线|剧情/.test(content)) {
        out.push({ type: 'convert', label: '可转写：' + (title || '(无标题)'), entry: e });
      }
    }
    if (tlTag) {
      for (const e of entries) {
        const title = String(e.title || '');
        if (title.indexOf(tlTag) === 0) { out.push({ type: 'ours-single', tag: tlTag, label: '当前：单条目模式（' + tlTag + '）', entry: e }); break; }
      }
    }
    return out;
  }

  // 收集对话历史上下文（给 AI 用）
