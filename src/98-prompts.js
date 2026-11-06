  function getPromptTemplates() {
    const keys = ['conflict', 'mode', 'custom', 'opening', 'openingPass2', 'backfill', 'timeline'];
    const base = {};
    for (const k of keys) base[k] = { sys: DEFAULT_PROMPTS[k].sys, user: DEFAULT_PROMPTS[k].user };
    try {
      const raw = mainWin.localStorage.getItem(PROMPT_TPL_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        for (const k of keys) { if (o[k]) { if (typeof o[k].sys === 'string') base[k].sys = o[k].sys; if (typeof o[k].user === 'string') base[k].user = o[k].user; } }
      }
    } catch (e) {}
    return base;
  }
  function savePromptTemplates(t) {
    try { const payload = {}; for (const k of ['conflict', 'mode', 'custom', 'opening', 'openingPass2', 'backfill', 'timeline']) payload[k] = { sys: t[k].sys, user: t[k].user }; mainWin.localStorage.setItem(PROMPT_TPL_KEY, JSON.stringify(payload)); } catch (e) {}
  }
  function listPromptPresets() { try { const raw = mainWin.localStorage.getItem(PROMPT_PRESETS_KEY); if (raw) return JSON.parse(raw) || {}; } catch (e) {} return {}; }
  function loadPromptPreset(name) { return listPromptPresets()[name] || null; }
  function deletePromptPreset(name) {
    const all = listPromptPresets();
    if (all[name]) { delete all[name]; try { mainWin.localStorage.setItem(PROMPT_PRESETS_KEY, JSON.stringify(all)); } catch (e) {} return true; }
    return false;
  }
  function renderPromptTemplate(tpl, vars) {
    if (!tpl) return '';
    return String(tpl).replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, function(_, k) { return (vars[k] !== undefined && vars[k] !== null) ? String(vars[k]) : ''; });
  }

  function openPromptEditor(panel) {
    const tpl = getPromptTemplates();
    const presets = listPromptPresets();
    const presetNames = Object.keys(presets);
    let curTask = 'conflict';
    const taskTabs = ['conflict', 'mode', 'custom', 'opening', 'openingPass2', 'backfill', 'timeline'].map(function(k) {
      const label = DEFAULT_PROMPTS[k].label;
      const active = k === curTask;
      return '<button class="moon-tpl-tab" data-task="' + k + '" style="padding:7px 12px;border-radius:8px;border:1px solid ' + (active ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.2)') + ';background:' + (active ? '#0c2540' : '#0f172a') + ';color:' + (active ? '#7dd3fc' : '#94a3b8') + ';font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">' + label + '</button>';
    }).join('');
    const html = '<div style="font-size:11px;color:#94a3b8;line-height:1.7;margin-bottom:10px;">可用占位符：<br><code style="color:#7dd3fc;font-size:10px;">' + DEFAULT_PROMPTS.placeholders.replace(/\s+/g, ' ') + '</code></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' + taskTabs + '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">' +
      '<select id="moon-preset-select" style="flex:1;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#171a22;color:#e2e8f0;font-size:11.5px;"><option value="">— 载入预设 —</option>' + presetNames.map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') + '</select>' +
      '<button id="moon-preset-load" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(56,189,248,0.35);background:#0c2540;color:#7dd3fc;font-size:11px;cursor:pointer;font-family:inherit;">载入</button>' +
      '<button id="moon-preset-del" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(239,68,68,0.35);background:#2a0a10;color:#fca5a5;font-size:11px;cursor:pointer;font-family:inherit;">删除</button></div>' +
      '<div style="margin-bottom:6px;font-size:11px;color:#e2e8f0;font-weight:600;">系统提示词</div>' +
      '<textarea id="moon-tpl-sys" style="width:100%;box-sizing:border-box;min-height:110px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#171a22;color:#e2e8f0;font-size:11px;line-height:1.6;font-family:monospace;resize:vertical;"></textarea>' +
      '<div style="margin:10px 0 6px;font-size:11px;color:#e2e8f0;font-weight:600;">用户提示词</div>' +
      '<textarea id="moon-tpl-user" style="width:100%;box-sizing:border-box;min-height:160px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#171a22;color:#e2e8f0;font-size:11px;line-height:1.6;font-family:monospace;resize:vertical;"></textarea>' +
      '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">' +
      '<input id="moon-preset-name" placeholder="预设名字" style="flex:1;min-width:120px;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#171a22;color:#e2e8f0;font-size:11.5px;">' +
      '<button id="moon-preset-save" style="padding:7px 12px;border-radius:8px;border:1px solid rgba(16,185,129,0.4);background:#052e20;color:#6ee7b7;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">另存为预设</button></div>' +
      '<div style="margin-top:12px;display:flex;gap:6px;">' +
      '<button id="moon-tpl-save" style="flex:1;padding:9px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#f4f1ea;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;">保存</button>' +
      '<button id="moon-tpl-reset" style="flex:1;padding:9px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;">恢复默认</button></div>';
    showModalDialog('🧩 提示词编辑', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        const taSys = mask.querySelector('#moon-tpl-sys'); const taUser = mask.querySelector('#moon-tpl-user');
        const sel = mask.querySelector('#moon-preset-select'); const nameInput = mask.querySelector('#moon-preset-name');
        function renderTask(k) {
          curTask = k; taSys.value = tpl[k].sys || ''; taUser.value = tpl[k].user || '';
          mask.querySelectorAll('.moon-tpl-tab').forEach(function(btn) {
            const on = btn.getAttribute('data-task') === k;
            btn.style.borderColor = on ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.2)';
            btn.style.background = on ? '#0c2540' : '#0f172a';
            btn.style.color = on ? '#7dd3fc' : '#94a3b8';
          });
        }
        mask.querySelectorAll('.moon-tpl-tab').forEach(function(btn) { btn.addEventListener('click', function() { renderTask(btn.getAttribute('data-task')); }); });
        renderTask('conflict');
        mask.querySelector('#moon-tpl-save').addEventListener('click', function() { tpl[curTask] = { sys: taSys.value, user: taUser.value }; savePromptTemplates(tpl); toast('已保存', 'success'); });
        mask.querySelector('#moon-tpl-reset').addEventListener('click', function() { taSys.value = DEFAULT_PROMPTS[curTask].sys; taUser.value = DEFAULT_PROMPTS[curTask].user; toast('已恢复默认', 'info'); });
        mask.querySelector('#moon-preset-load').addEventListener('click', function() { const n = sel.value; if (!n) return; const p = loadPromptPreset(n); if (!p) return; const d = p[curTask] ? p[curTask] : { sys: p.sys, user: p.user }; if (d) { taSys.value = d.sys || ''; taUser.value = d.user || ''; } nameInput.value = n; toast('已载入', 'success'); });
        mask.querySelector('#moon-preset-del').addEventListener('click', function() { const n = sel.value; if (!n) return; if (deletePromptPreset(n)) { const opt = sel.querySelector('option[value="' + n + '"]'); if (opt) opt.remove(); sel.value = ''; toast('已删除', 'info'); } });
        mask.querySelector('#moon-preset-save').addEventListener('click', function() {
          const n = nameInput.value.trim(); if (!n) return;
          const all = listPromptPresets();
          all[n] = all[n] || {}; all[n][curTask] = { sys: taSys.value, user: taUser.value }; all[n].ts = Date.now();
          try { mainWin.localStorage.setItem(PROMPT_PRESETS_KEY, JSON.stringify(all)); } catch (e) {}
          if (!sel.querySelector('option[value="' + n + '"]')) { const opt = mainDoc.createElement('option'); opt.value = n; opt.textContent = n; sel.appendChild(opt); }
          sel.value = n; toast('已保存', 'success');
        });
      }
    });
  }
  /* ───────────────────────────────────────────────────────── */
  function openAiConflictDialog(panel) {
    const tasks = [
      { key: 'conflict', label: '🔍 冲突检测' },
      { key: 'mode', label: '🎯 模式推荐' },
      { key: 'custom', label: '✏️ 自定义' }
    ];
    const providers = [
      { key: 'custom', label: '🔑 配置API模型' + (hasValidCustomAIConfig() ? '（已设：' + getCustomAIConfig().model + '）' : '（未设·点开始自动弹窗）') },
      { key: 'main', label: '🎭 酒馆主模型' }
    ];
    const html = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div><div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;">选择模块</div>' +
      '<select id="moon-task-select" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(56,189,248,0.35);background:#0c1a2e;color:#e2e8f0;font-size:12px;">' +
      tasks.map(function(t) { return '<option value="' + t.key + '">' + t.label + '</option>'; }).join('') + '</select></div>' +
      '<div><div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;">选择模型</div>' +
      '<select id="moon-provider-select" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:12px;">' +
      providers.map(function(p) { return '<option value="' + p.key + '">' + p.label + '</option>'; }).join('') + '</select></div>' +
      '<button id="moon-ai-run" style="padding:11px;border-radius:10px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#f4f1ea;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:600;">🚀 开始执行</button></div>';
    showModalDialog('🤖 AI 深度检测', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-ai-run').addEventListener('click', async function() {
          const task = mask.querySelector('#moon-task-select').value;
          const provider = mask.querySelector('#moon-provider-select').value;
          const taskLabel = (DEFAULT_PROMPTS[task] && DEFAULT_PROMPTS[task].label) || task;
          try { mask.remove(); } catch (e) {}
          const statusEl = panel.querySelector('#moon-phase-status');
          statusEl.innerHTML = '<span style="color:#93c5fd">⏳ 执行「' + taskLabel + '」...</span>';
          const html2 = await runAiConflictScan(provider, task);
          statusEl.innerHTML = '<span style="color:#6ee7b7">✔ 完成。</span>';
          showResultDialog(SYSTEM_UI_NAME + ' · AI ' + taskLabel, html2);
        });
      }
    });
  }

  async function runAiConflictScan(provider, task) {
    task = task || 'conflict';
    const taskLabel = (DEFAULT_PROMPTS[task] && DEFAULT_PROMPTS[task].label) || task;
    const lines = ['<b style="color:#93c5fd">🤖 AI 检测 · ' + taskLabel + '</b><br>'];
    let entries = [];
    try { entries = await getAllWorldbookEntries(); } catch (e) {}
    const mvuEntries = entries.filter(function(e) { return e.title.indexOf('[Mode-') === 0 || e.title.indexOf('[Initvar]') === 0; });
    const otherEntries = entries.filter(function(e) { return e.title.indexOf('[Mode-') !== 0 && e.title.indexOf('[Initvar]') !== 0; });
    const mvuDump = mvuEntries.map(function(e) { return '### ' + e.title + '\n' + e.content.slice(0, 1500); }).join('\n\n');
    const otherDump = otherEntries.map(function(e) { return '### ' + e.title + '\n' + e.content.slice(0, 800); }).join('\n\n');
    const currentMode = getCurrentMode();
    const modeList = ['easy', 'normal', 'hard', 'hell'].map(function(m) { const i = LUNAR_META[m]; return '- ' + i.name + '：' + i.detail; }).join('\n');
    let charInfo = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) charInfo = '角色卡：' + (ch.name || '未命名') + '\n' + (ch.description || '').slice(0, 800);
      }
    } catch (e) {}
    if (!charInfo) charInfo = '(无法读取)';
    const vars = { charInfo: charInfo, currentMode: currentMode, currentModeLabel: getModeLabel(currentMode), modeList: modeList, mvuDump: mvuDump, otherDump: otherDump };
    const tpl = getPromptTemplates()[task] || getPromptTemplates().conflict;
    try {
      let reply = await callOpeningModel(provider, renderPromptTemplate(tpl.sys, vars), renderPromptTemplate(tpl.user, vars));
      if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
      lines.push('<div style="white-space:pre-wrap;color:#e2e8f0;font-size:11px;">' + reply.replace(/</g, '&lt;') + '</div>');
    } catch (err) { lines.push('<span style="color:#f87171">✖ 调用失败：' + (err.message || String(err)) + '</span>'); }
    return lines.join('<br>');
  }

function getTimelineKeywords() {
  try {
    const raw = mainWin.localStorage.getItem(TIMELINE_KEYWORDS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (e) {}
  return DEFAULT_TIMELINE_KEYWORDS.slice();
}
function setTimelineKeywords(list) {
  try { mainWin.localStorage.setItem(TIMELINE_KEYWORDS_KEY, JSON.stringify(list)); } catch (e) {}
}

// 全库扫描：不管是否启用，都找出来
async function scanAllTimelineEntries() {
  const tag = getTimelineTag();
  const keywords = getTimelineKeywords();
  const all = await _collectAllWorldbooks(true);
  const results = [];
  const seen = Object.create(null);
  const push = function(e, matchType, priority, extra) {
    const key = e.bookName + '||' + e.title;
    if (seen[key]) return;
    seen[key] = true;
    const item = {
      bookName: e.bookName, title: e.title, content: e.content,
      enabled: e.enabled, bookEnabled: e.bookEnabled,
      matchType: matchType, priority: priority
    };
    if (extra) Object.assign(item, extra);
    results.push(item);
  };
  // ① 自定义标签优先
  if (tag) {
    for (const e of all) {
      if (String(e.title || '').indexOf(tag) === 0) push(e, 'tag', 0);
    }
  }
  // ② [Timeline] / [WorldTimeline] 前缀
  for (const e of all) {
    const t = String(e.title || '');
    if (t.indexOf('[Timeline]') === 0) push(e, 'prefix-timeline', 1);
    else if (t.indexOf('[WorldTimeline]') === 0) push(e, 'prefix-worldtimeline', 1);
  }
  // ③ 关键词 / 时间模式
  for (const e of all) {
    const t = String(e.title || '');
    if (t.indexOf('[Mode-') === 0 || t.indexOf('[Initvar]') === 0) continue;
    if (t.indexOf('[Timeline]') === 0 || t.indexOf('[WorldTimeline]') === 0) continue;
    const c = String(e.content || '');
    const titleHit = keywords.some(function(k) { return k && t.indexOf(k) >= 0; });
    const contentHit = keywords.some(function(k) { return k && c.indexOf(k) >= 0; });
    const hasTime = TL_TIME_RE.test(c);
    if (titleHit || contentHit || hasTime) push(e, 'keyword', 2, { titleHit: titleHit, contentHit: contentHit, hasTime: hasTime });
  }
  results.sort(function(a, b) {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.bookName + a.title).localeCompare(b.bookName + b.title);
  });
  return results;
}

async function openScanTimelineDialog(panel) {
  showLoadingDialog('扫描世界书中...');
  let entries = [];
  try { entries = await scanAllTimelineEntries(); } catch (e) {}
  closeLoadingDialog();

  const curTag = getTimelineTag();
  const curKw = getTimelineKeywords();

  if (!entries.length) {
    showModalDialog('🔎 扫描时间线',
      '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;">未找到任何与时间线相关的条目。</div>' +
      '<div style="margin-top:8px;font-size:11px;color:#64748b;">可以调整下方标签或关键词后再扫描。</div>' +
      '<div style="margin-top:14px;"><button id="moon-scan-tag-btn" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:11.5px;cursor:pointer;font-family:inherit;font-weight:600;">📜 设置自定义标签</button></div>' +
      '<div style="margin-top:6px;"><button id="moon-scan-kw-btn" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:11.5px;cursor:pointer;font-family:inherit;font-weight:600;">🔍 设置关键词</button></div>',
      null, {
        confirmText: '关闭',
        onOpen: function(mask) {
          mask.querySelector('#moon-scan-tag-btn').addEventListener('click', function() { try { mask.remove(); } catch(e){} openTimelineTagDialog(panel); });
          mask.querySelector('#moon-scan-kw-btn').addEventListener('click', function() { try { mask.remove(); } catch(e){} openTimelineKeywordDialog(panel); });
        }
      });
    return;
  }

  const rows = entries.map(function(e, idx) {
    const typeLabel = ({
      'tag': '📜 标签匹配',
      'prefix-timeline': '📌 [Timeline]',
      'prefix-worldtimeline': '📌 [WorldTimeline]',
      'keyword': '🔍 关键词'
    })[e.matchType] || e.matchType;
    const status = (e.enabled && e.bookEnabled)
      ? '<span style="font-size:9.5px;color:#6ee7b7;">● 启用</span>'
      : '<span style="font-size:9.5px;color:#f87171;">○ 禁用</span>';
    const preview = String(e.content).replace(/</g, '&lt;');
    return '<div class="moon-tl-item" data-idx="' + idx + '" style="padding:10px 12px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:9px;margin-bottom:6px;">' +
      '<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;">' +
      '<input type="checkbox" class="moon-tl-check" data-idx="' + idx + '" checked style="margin-top:2px;flex-shrink:0;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span style="font-size:12px;font-weight:600;color:#e2e8f0;">' + String(e.title || '(无标题)').replace(/</g, '&lt;') + '</span>' +
          '<span style="font-size:9.5px;padding:1px 6px;border-radius:6px;background:rgba(56,189,248,0.15);color:#7dd3fc;">' + typeLabel + '</span>' +
          status +
        '</div>' +
        '<div style="font-size:10px;color:#64748b;margin-top:3px;">📚 ' + String(e.bookName || '(未知书)').replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:10.5px;color:#94a3b8;margin-top:5px;max-height:44px;overflow:hidden;line-height:1.5;">' + preview.slice(0, 110) + (preview.length > 110 ? '……' : '') + '</div>' +
      '</div></label></div>';
  }).join('');

  const html =
    '<div style="font-size:11px;color:#94a3b8;line-height:1.6;margin-bottom:10px;">' +
      '共发现 <b style="color:#7dd3fc;">' + entries.length + '</b> 个疑似时间线条目（含禁用条目）。' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
      '<button id="moon-tl-selectall" style="flex:1;min-width:70px;padding:6px;border-radius:7px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:600;">全选 / 全不选</button>' +
      '<button id="moon-tl-settag" style="flex:1;min-width:70px;padding:6px;border-radius:7px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:600;">📜 标签：' + (curTag ? String(curTag).replace(/</g,'&lt;') : '未设') + '</button>' +
      '<button id="moon-tl-setkw" style="flex:1;min-width:70px;padding:6px;border-radius:7px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;font-weight:600;">🔍 关键词 (' + curKw.length + ')</button>' +
    '</div>' +
    '<div style="max-height:46dvh;overflow-y:auto;padding-right:4px;margin-bottom:10px;">' + rows + '</div>' +
    '<div style="font-size:10.5px;color:#64748b;line-height:1.6;">' +
      '转写会把选中条目合并后交给 AI 整理成系统标准格式。' +
    '</div>';

  showModalDialogCancelable('🔎 扫描时间线', html,
    async function() {
      const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
      const ids = [];
      mask.querySelectorAll('.moon-tl-check').forEach(function(ck) { if (ck.checked) ids.push(Number(ck.getAttribute('data-idx'))); });
      if (!ids.length) { toast('未勾选任何条目', 'info'); return; }
      const selected = ids.map(function(i) { return entries[i]; }).filter(Boolean);
      try { mask.remove(); } catch (e) {}
      await runTimelineMultiConvert(panel, selected);
    },
    function() { toast('已取消', 'info'); },
    {
      confirmText: '📝 转写选中项',
      cancelText: '取消',
      onOpen: function(mask) {
        mask.querySelector('#moon-tl-selectall').addEventListener('click', function() {
          const boxes = mask.querySelectorAll('.moon-tl-check');
          const allChecked = Array.from(boxes).every(function(b) { return b.checked; });
          boxes.forEach(function(b) { b.checked = !allChecked; });
        });
        mask.querySelector('#moon-tl-settag').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          openTimelineTagDialog(panel, function() { openScanTimelineDialog(panel); });
        });
        mask.querySelector('#moon-tl-setkw').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          openTimelineKeywordDialog(panel, function() { openScanTimelineDialog(panel); });
        });
      }
    });
}

