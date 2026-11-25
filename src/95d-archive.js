/* 95d-archive.js —— 脚本档案柜：副本战绩、结算旁白、后日谈，存在脚本自己身上（全局 localStorage），
   不进 chat 变量。所以换聊天 / 换角色卡 / 换玩家档案，打开面板还能看到。

   和 readChatFeatureValue 的区别：
     - readChatFeatureValue → localStorage 键里带 chatStateKey，一个对话一份，换对话就看不见；
     - 这里 → 键固定，全局一份，跨对话共享。
   代价是 localStorage 只有 5MB 左右，所以有硬上限：每类最多 60 条、单条正文最多 12000 字。 */

const ARCHIVE_KEY = 'moon_phase_archive_v1';
const ARCHIVE_VERSION = 1;
const ARCHIVE_MAX_PER_KIND = 60;
const ARCHIVE_TEXT_MAX = 12000;

function archiveEmpty() { return { version: ARCHIVE_VERSION, records: [] }; }

/* 两条通道：
     global —— 脚本本体（localStorage，键固定）→ 跨对话可见
     chat   —— 当前对话（chatMetadata）→ 跟对话一起走
   读的时候合并，写的时候只写目标那条 —— 免得「只留本对话」把别处的记录复制进来。 */
function archiveReadGlobal() {
  try {
    const store = getStorage();
    if (!store) return archiveEmpty();
    const raw = store.getItem(ARCHIVE_KEY);
    if (!raw) return archiveEmpty();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return archiveEmpty();
    const records = Array.isArray(parsed.records) ? parsed.records : [];
    return {
      version: ARCHIVE_VERSION,
      records: records.filter(function (x) { return x && typeof x === 'object' && x.id; })
    };
  } catch (e) { return archiveEmpty(); }
}

function archiveReadChat() {
  try {
    const raw = readChatFeatureValue(ARCHIVE_KEY, null);
    if (!raw || typeof raw !== 'object') return archiveEmpty();
    const records = Array.isArray(raw.records) ? raw.records : [];
    return {
      version: ARCHIVE_VERSION,
      records: records.filter(function (x) { return x && typeof x === 'object' && x.id; })
    };
  } catch (e) { return archiveEmpty(); }
}

function archiveRead() {
  const seen = {};
  const all = [];
  archiveReadGlobal().records.concat(archiveReadChat().records).forEach(function (x) {
    if (seen[x.id]) return;
    seen[x.id] = 1;
    all.push(x);
  });
  all.sort(function (a, b) { return (Number(b.at) || 0) - (Number(a.at) || 0); });
  return { version: ARCHIVE_VERSION, records: all };
}

function archiveWriteGlobal(data) {
  try {
    const store = getStorage();
    if (!store) return false;
    store.setItem(ARCHIVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    /* 写满了（QuotaExceeded）：砍掉一半再试一次，还失败就认了 */
    try {
      const store = getStorage();
      const keep = archiveReadGlobal().records.slice(0, Math.floor(ARCHIVE_MAX_PER_KIND / 2));
      store.setItem(ARCHIVE_KEY, JSON.stringify({ version: ARCHIVE_VERSION, records: keep }));
      return true;
    } catch (e2) { return false; }
  }
}

function archiveWriteChat(data) {
  try { return writeChatFeatureValue(ARCHIVE_KEY, data); } catch (e) { return false; }
}

/* 按类分开截断：后日谈很长，别让它把副本战绩挤掉 */
function archiveTrim(list) {
  const byKind = {};
  const kept = [];
  list.forEach(function (x) {
    const k = x.kind || 'other';
    byKind[k] = (byKind[k] || 0) + 1;
    if (byKind[k] <= ARCHIVE_MAX_PER_KIND) kept.push(x);
  });
  return kept;
}

/* 存档开关：默认开（用户要的就是「换聊天也能看到」） */
function archiveToScript() {
  try { return getSettings().archiveToScript !== false; } catch (e) { return true; }
}
function setArchiveToScript(on) {
  try { const s = getSettings(); s.archiveToScript = !!on; saveSettings(s); } catch (e) {}
}

function archiveChatLabel() {
  let name = '';
  try {
    const ctx = getSTCtx();
    const ch = ctx && ctx.characters && ctx.characterId != null ? ctx.characters[ctx.characterId] : null;
    name = (ch && ch.name) || '';
  } catch (e) {}
  let cid = '';
  try { const info = getCurrentChatInfo(); cid = String((info && info.chatId) || ''); } catch (e) {}
  const tail = cid ? cid.slice(-6) : '未命名';
  return (name ? name + ' · ' : '') + '对话 ' + tail;
}

function archiveClip(text) {
  const s = String(text == null ? '' : text);
  return s.length > ARCHIVE_TEXT_MAX
    ? (s.slice(0, ARCHIVE_TEXT_MAX) + '\n\n……（超出 ' + ARCHIVE_TEXT_MAX + ' 字的部分没有存进档案，导出请用生成时的原文）')
    : s;
}

/* rec: { kind:'dungeon'|'epilogue', title, charName, result, level, delta, survivedMin, needMin,
          rulesRight, rulesTotal, pointsAfter, text, meta } */
/* 同一毫秒内可能连写好几条（批量结算 / 测试），只用时间戳会撞 id ——
   撞了之后 archiveRead 按 id 去重，会「写进去却少一条」。加个自增序号。 */
let _archiveSeq = 0;

function archiveAdd(rec) {
  if (!rec || !rec.kind) return null;
  const item = {
    id: 'arc_' + Date.now() + '_' + (++_archiveSeq) + '_' + Math.floor(Math.random() * 1000),
    kind: String(rec.kind),
    title: String(rec.title || '无题').slice(0, 120),
    charName: String(rec.charName || '').slice(0, 60),
    result: String(rec.result || '').slice(0, 20),
    level: String(rec.level || '').slice(0, 8),
    delta: Number(rec.delta) || 0,
    survivedMin: Number(rec.survivedMin) || 0,
    needMin: Number(rec.needMin) || 0,
    rulesRight: (rec.rulesRight == null ? null : Number(rec.rulesRight) || 0),
    rulesTotal: (rec.rulesTotal == null ? null : Number(rec.rulesTotal) || 0),
    pointsAfter: (rec.pointsAfter == null ? null : Number(rec.pointsAfter)),
    text: archiveClip(rec.text || ''),
    meta: (rec.meta && typeof rec.meta === 'object') ? rec.meta : {},
    from: archiveChatLabel(),
    scope: archiveToScript() ? 'script' : 'chat',
    at: Date.now()
  };
  if (item.scope === 'script') {
    const data = archiveReadGlobal();
    data.records.unshift(item);
    data.records = archiveTrim(data.records);
    archiveWriteGlobal(data);
  } else {
    const data = archiveReadChat();
    data.records.unshift(item);
    data.records = archiveTrim(data.records);
    archiveWriteChat(data);
  }
  return item;
}

function archiveDel(id) {
  let hit = false;
  [archiveReadGlobal, archiveReadChat].forEach(function (reader) {
    const data = reader();
    const before = data.records.length;
    data.records = data.records.filter(function (x) { return x.id !== id; });
    if (data.records.length !== before) {
      hit = true;
      if (reader === archiveReadGlobal) archiveWriteGlobal(data); else archiveWriteChat(data);
    }
  });
  return hit;
}

function archiveClear(kind) {
  [archiveReadGlobal, archiveReadChat].forEach(function (reader) {
    const data = reader();
    data.records = kind ? data.records.filter(function (x) { return x.kind !== kind; }) : [];
    if (reader === archiveReadGlobal) archiveWriteGlobal(data); else archiveWriteChat(data);
  });
  return true;
}

function archiveFind(id) {
  const list = archiveRead().records;
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function archiveCount(kind) {
  const list = archiveRead().records;
  if (!kind) return list.length;
  return list.filter(function (x) { return x.kind === kind; }).length;
}

function archiveTimeText(ts) {
  const n = Number(ts) || 0;
  if (!n) return '';
  const d = new Date(n);
  const p = function (v) { return v < 10 ? '0' + v : String(v); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function archiveSummaryLine(x) {
  if (!x) return '';
  if (x.kind === 'dungeon') {
    const tag = x.result === 'win' ? '通关' : (x.result === 'lose' ? '失败' : '放弃');
    let s = tag;
    if (x.level) s += ' · ' + x.level + ' 级';
    if (x.needMin) s += ' · 存活 ' + dungeonFormatMin(x.survivedMin) + '/' + dungeonFormatMin(x.needMin);
    if (x.rulesTotal) s += ' · 规则 ' + (x.rulesRight || 0) + '/' + x.rulesTotal;
    if (x.delta) s += ' · ' + (x.delta > 0 ? '+' : '') + x.delta + ' 分';
    return s;
  }
  if (x.kind === 'epilogue') {
    return '后日谈' + (x.charName ? ' · ' + x.charName + ' 视角' : '') + (x.text ? ' · ' + x.text.length + ' 字' : '');
  }
  if (x.kind === 'ending') {
    let s = '终幕' + (x.result ? ' · ' + x.result : '');
    if (x.meta && x.meta.totalTime) s += ' · ' + x.meta.totalTime;
    if (x.text) s += ' · ' + x.text.length + ' 字';
    return s;
  }
  return x.result || '';
}

function archiveRenderHtml(kind) {
  const on = archiveToScript();
  const all = archiveRead().records.filter(function (x) { return !kind || x.kind === kind; });
  const titleMap = { dungeon: '副本档案', epilogue: '后日谈档案', ending: '终幕结算' };
  let html = '<div class="mp-arc">' +
    '<div class="mp-arc-head"><b>🗄 ' + (titleMap[kind] || '脚本档案') + ' · 跨对话</b>' +
    '<label class="mp-arc-sw"><input type="checkbox" data-arc-mode="1"' + (on ? ' checked' : '') + '><span>存进脚本</span></label></div>' +
    '<small class="mp-arc-tip">' +
    (on
      ? '存在脚本本体里，不跟对话走：换聊天、换角色卡、换玩家设定，打开还能看到。'
      : '现在存进本对话：换聊天就看不到了。打开「存进脚本」之后的新记录才会跨对话可见。') +
    '</small>';

  if (!all.length) {
    html += '<div class="mp-arc-empty">' + (on ? '还没有记录。打完一局副本、生成一次后日谈，就会落在这里。' : '还没有记录，而且「存进脚本」是关着的。') + '</div></div>';
    return html;
  }

  html += '<div class="mp-arc-list">';
  all.slice(0, 12).forEach(function (x) {
    html += '<div class="mp-arc-row">' +
      '<div class="mp-arc-main"><b>' + escapeFeatureHtml(x.title) + '</b>' +
      '<small>' + escapeFeatureHtml(archiveSummaryLine(x)) + '</small>' +
        '<small class="mp-arc-from">' + escapeFeatureHtml(archiveTimeText(x.at)) +
        (x.from ? ' · 来自 ' + escapeFeatureHtml(x.from) : '') +
        ' · ' + (x.scope === 'chat' ? '本对话' : '脚本') + '</small></div>' +
      '<div class="mp-arc-ops">' +
      '<button class="mp-btn mp-btn-sm" data-arc-view="' + escapeFeatureHtml(x.id) + '">看</button>' +
      '<button class="mp-btn mp-btn-sm" data-arc-del="' + escapeFeatureHtml(x.id) + '">删</button>' +
      '</div></div>';
  });
  html += '</div>';
  if (all.length > 12) html += '<small class="mp-arc-tip">还有 ' + (all.length - 12) + ' 条更早的，已折起。</small>';
  html += '<div class="mp-arc-foot"><button class="mp-btn mp-btn-sm" data-arc-clear="' + escapeFeatureHtml(kind || '') + '">清空这一类</button></div>';
  html += '</div>';
  return html;
}

function archiveExportText(x) {
  if (!x) return;
  const head = '# ' + (x.title || '档案') + '\n' +
    '> ' + archiveSummaryLine(x) + '\n' +
    '> ' + archiveTimeText(x.at) + (x.from ? ' · ' + x.from : '') + '\n\n';
  const blob = new Blob([head + String(x.text || '')], { type: 'text/plain;charset=utf-8' });
  const url = (mainWin.URL || URL).createObjectURL(blob);
  downloadFileViaBrowser(url, (x.kind === 'epilogue' ? '后日谈_' : (x.kind === 'ending' ? '终幕_' : '副本结算_')) +
    String(x.title || '档案').replace(/[\\/:*?"<>|]/g, '_') + '.txt');
  setTimeout(function () { try { (mainWin.URL || URL).revokeObjectURL(url); } catch (e) {} }, 5000);
}

function archiveOpen(id) {
  const x = archiveFind(id);
  if (!x) { try { toast('这条档案已经不在了', 'warning'); } catch (e) {} return; }
  const body = x.text
    ? escapeFeatureHtml(x.text)
    : '<span style="color:#94a3b8">这条只有战绩，没有正文（当时没生成旁白，或者生成失败）。</span>';
  const html = '<div style="max-height:54vh;overflow:auto;padding:12px;background:var(--k-sur-0,#100a13);border:1px solid var(--k-frame,#693253);font-size:12px;line-height:1.95;white-space:pre-wrap">' + body + '</div>' +
    '<div style="margin-top:9px;text-align:right"><button id="moon-arc-export" style="padding:6px 12px;border:1px solid #7dd3fc;background:#10263c;color:#e0f2fe;font:600 11px monospace;cursor:pointer;">💾 导出 TXT</button></div>';
  showModalDialog(escapeFeatureHtml(x.title) + ' · 档案', html, null, {
    confirmText: '关闭',
    onOpen: function (mask) {
      const btn = mask.querySelector('#moon-arc-export');
      if (btn) btn.addEventListener('click', function () { archiveExportText(x); });
    }
  });
}

/* 事件委托：一个面板只绑一次 */
function archiveBind(root) {
  if (!root || root.dataset.arcBound === '1') return;
  root.dataset.arcBound = '1';

  root.addEventListener('click', function (ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    const view = t.closest('[data-arc-view]');
    if (view) { ev.preventDefault(); archiveOpen(view.getAttribute('data-arc-view')); return; }
    const del = t.closest('[data-arc-del]');
    if (del) {
      ev.preventDefault();
      archiveDel(del.getAttribute('data-arc-del'));
      try { toast('已从档案里删掉', 'info'); } catch (e) {}
      if (typeof refreshPanel === 'function') refreshPanel();
      return;
    }
    const clr = t.closest('[data-arc-clear]');
    if (clr) {
      ev.preventDefault();
      const kind = clr.getAttribute('data-arc-clear') || '';
      showModalDialogCancelable('清空档案',
        '这会删掉' + (kind === 'dungeon' ? '全部副本战绩' : (kind === 'epilogue' ? '全部后日谈' : (kind === 'ending' ? '全部终幕结算' : '全部档案'))) +
        '，删了就找不回来。<br><br>想留个底就先点「看 → 导出 TXT」。',
        function () {
          archiveClear(kind || null);
          try { toast('已清空', 'info'); } catch (e) {}
          if (typeof refreshPanel === 'function') refreshPanel();
        }, null, { confirmText: '删掉', cancelText: '算了' });
    }
  });

  root.addEventListener('change', function (ev) {
    const t = ev.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-arc-mode')) {
      setArchiveToScript(!!t.checked);
      try { toast(t.checked ? '之后的记录会存进脚本，换对话也能看到' : '之后的记录只留在本对话', 'info'); } catch (e) {}
      if (typeof refreshPanel === 'function') refreshPanel();
    }
  });
}
