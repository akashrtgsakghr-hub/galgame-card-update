  /* ───────────────────────────────────────────────────────── */
  function parseGameTime(str) {
    if (!str || typeof str !== 'string') return null;
    const re = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日[\s\S]*?(?:(上午|下午|中午|凌晨|早上|早晨|清晨|傍晚|晚上|夜里|夜间|深夜|午后|正午)\s*)?(\d{1,2})\s*(?:[:点时])\s*(?:(\d{1,2})\s*分?)?/;
    const m = str.match(re);
    if (!m) return null;
    try {
      let hh = +m[5]; const mm = (m[6] !== undefined && m[6] !== '') ? +m[6] : 0; const period = m[4] || '';
      if (period) {
        const isPM = /下午|午后|傍晚|晚上|夜里|夜间|深夜/.test(period);
        const isAM = /上午|早上|早晨|清晨|凌晨/.test(period);
        const isNoon = /中午|正午/.test(period);
        if (isNoon) { if (hh < 12) hh = 12; }
        else if (isPM) { if (hh < 12) hh += 12; }
        else if (isAM) { if (hh === 12) hh = 0; }
      }
      if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
      return new Date(+m[1], +m[2] - 1, +m[3], hh, mm);
    } catch (e) { return null; }
  }

  function timeReached(currentStr, targetStr) {
    const a = parseGameTime(currentStr); const b = parseGameTime(targetStr);
    if (!a || !b) return false; return a.getTime() >= b.getTime();
  }

  function addDaysToGameTime(timeStr, days) {
    const d = parseGameTime(timeStr); if (!d) return timeStr;
    d.setDate(d.getDate() + days);
    const y = d.getFullYear(); const mo = String(d.getMonth() + 1).padStart(2, '0'); const da = String(d.getDate()).padStart(2, '0');
    const wd = ['日','一','二','三','四','五','六'][d.getDay()]; const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
    return y + '年' + mo + '月' + da + '日 · 星期' + wd + ' · ' + hh + ':' + mm;
  }

  async function updateInternalTime() {
    // 保留为对外薄封装，逻辑统一走 advanceWorldClock，避免出现两套时间算法
    try {
      const data = readMvuLatest();
      if (!data || !data.stat_data || !data.stat_data.世界) return null;
      const world = data.stat_data.世界;
      ensureWorldClockFields(world);
      const latestAi = getLatestAiMessage();
      const text = latestAi && latestAi.msg ? String(latestAi.msg.mes || '') : '';
      const info = advanceWorldClock(world, text);
      if (!info.ok) return null;
      await writeMvuLatest(data.stat_data);
      return { diffDays: info.days, internalDays: info.days, totalInternalDays: world._游戏日, isJump: info.days >= 1, 来源: info.source };
    } catch (e) { return null; }
  }

  function tryGetDisplayData() {
    try {
      const data = readMvuLatest();
      if (data) {
        if (data.display_data) return { source: 'display_data', data: data.display_data };
        if (data.stat_data) return { source: 'stat_data', data: data.stat_data };
      }
    } catch (e) {}
    if (cachedVars && cachedVars.stat_data) return { source: '缓存', data: cachedVars.stat_data };
    return null;
  }
  function readVar(path, defaultValue) {
    const all = tryGetDisplayData();
    if (!all || !all.data) return defaultValue;
    const parts = path.split('.');
    let cur = all.data;
    for (const p of parts) { if (cur == null || typeof cur !== 'object') return defaultValue; cur = cur[p]; }
    return cur !== undefined ? cur : defaultValue;
  }
  function estimateTokens(text) {
    if (!text) return 0;
    const s = String(text);
    const cjk = (s.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
    const other = s.length - cjk;
    return Math.ceil(cjk * 1.0 + other / 4);
  }
  function _fmtK(n) { return Math.round(Number(n) || 0) + ' 字'; }

  function _extractEntries(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.entries) {
      if (Array.isArray(data.entries)) return data.entries;
      if (typeof data.entries === 'object') return Object.values(data.entries);
    }
    if (typeof data === 'object') return Object.values(data);
    return [];
  }

async function _collectAllWorldbooks(includeDisabled) {
  const all = [];
  const ctx = getSTCtx();
  const raw = (mainWin && mainWin.world_info) || (window && window.world_info) || (ctx && ctx.world_info) || null;
  if (raw) {
    const books = [];
    if (Array.isArray(raw)) {
      raw.forEach(function(b) { if (b && typeof b === 'object') books.push(b); });
    } else if (typeof raw === 'object') {
      for (const k in raw) {
        const b = raw[k];
        if (k.indexOf('jQuery') === 0 || k.indexOf('__') === 0) continue;
        if (!b || typeof b !== 'object') continue;
        if (b.entries || b.name || b.originalData) books.push(b);
      }
    }
    for (const book of books) {
      const bookDisabled = (book.enabled === false || book.disable === true);
      if (!includeDisabled && bookDisabled) continue;
      const list = _extractEntries(book.entries || book);
      for (const e of list) {
        if (!e || typeof e !== 'object') continue;
        const entryDisabled = (e.disable === true || e.enabled === false);
        if (!includeDisabled && entryDisabled) continue;
        const content = String(e.content || e.value || '');
        if (!content) continue;
        all.push({
          bookName: String(book.name || book.comment || ''),
          title: String(e.comment || e.key || e.name || '').trim(),
          content: content,
          constant: e.constant === true,
          enabled: !entryDisabled,
          bookEnabled: !bookDisabled
        });
      }
    }
    if (all.length > 0) return all;
  }
    let names = [];
    try { if (ctx && typeof ctx.getWorldInfoNames === 'function') names = await ctx.getWorldInfoNames(); } catch (e) {}
    for (const bookName of (names || [])) {
      let data = null;
      try { if (ctx && typeof ctx.loadWorldInfo === 'function') data = await ctx.loadWorldInfo(bookName); } catch (e) {}
      if (!data) continue;
      const list = _extractEntries(data);
      for (const e of list) {
        if (!e || typeof e !== 'object') continue;
        if (e.disable === true || e.enabled === false) continue;
        const content = String(e.content || e.value || '');
        if (!content) continue;
        all.push({ bookName: bookName, title: String(e.comment || e.key || e.name || '').trim(), content: content, constant: e.constant === true });
      }
    }
    return all;
  }

  async function getAllWorldbookEntries() {
    const books = await _collectAllWorldbooks();
    return books.map(function(e) { return { bookName: e.bookName, title: e.title, content: e.content, enabled: true }; });
  }
