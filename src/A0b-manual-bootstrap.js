/* A0b-manual-bootstrap.js —— 手动建档：扫世界书/角色卡/聊天里的人 → 勾选 → 让 AI 判或自己填。
   产物直接复用 applyMultiCardAdaptiveOpening 写入 stat_data，字段格式与自动建档完全一致。 */

  function collectManualBootstrapCandidates() {
    const out = []; const seen = {};
    function add(name, source) {
      name = String(name || '').trim();
      if (!name || name.length > 24) return;
      if (seen[name]) { if (seen[name].indexOf(source) < 0) seen[name].push(source); return; }
      seen[name] = [source];
      out.push({ name: name, sources: seen[name] });
    }
    try {
      const ctx = getSTCtx();
      if (ctx) {
        try { if (typeof ctx.getWorldInfoNames === 'function') { (ctx.getWorldInfoNames() || []).forEach(function (n) { add(n, '世界书'); }); } } catch (e) {}
        try {
          const wi = ctx.world_info || ctx.worldInfo;
          if (wi && wi.entries) Object.keys(wi.entries).forEach(function (k) { const e = wi.entries[k] || {}; add(e.comment || e.key || '', '世界书'); });
        } catch (e) {}
        try { if (ctx.characters && ctx.characterId != null) { const ch = ctx.characters[ctx.characterId]; if (ch && ch.name) add(ch.name, '角色卡'); } } catch (e) {}
        try { (ctx.chat || []).forEach(function (m) { if (m && m.name && !m.is_user) add(m.name, '聊天'); }); } catch (e) {}
      }
    } catch (e) {}
    try {
      const d = readMvuLatest(); const chs = d && d.stat_data && d.stat_data.角色;
      if (chs && typeof chs === 'object') Object.keys(chs).forEach(function (n) { if (!isCharSkeleton(chs[n])) add(n, '存档'); });
    } catch (e) {}
    return out;
  }

  function manualStageLabel(e) {
    const st = getRStageFromE(Number(e) || 0);
    return st.r + ' · ' + st.name;
  }

  async function aiJudgeManualSelected(names) {
    const ctx = getSTCtx() || {};
    let card = '', opening = '', persona = '';
    try {
      const ch = ctx.characters && ctx.characterId != null ? ctx.characters[ctx.characterId] : null;
      if (ch) card = ['名称：' + (ch.name || ''), '简介：' + String(ch.description || '').slice(0, 1200), '性格：' + String(ch.personality || '').slice(0, 600), '场景：' + String(ch.scenario || '').slice(0, 600)].join('\n');
      opening = String(ch && ch.first_mes || '').slice(0, 1200);
      persona = String(ctx.name1 || '');
    } catch (e) {}
    const list = names.join('、');
    const SUM_SYS = '你是剧情资料的整理员。把给你的角色卡、开场白拆成结构化摘要。只做抽取和归纳，不评价、不写数值。';
    const SUM_USER = '输出 JSON（不要别的文字）：\n{\n "时间": "开场白里的当前时间",\n "地点": "开场白里的具体地点",\n "人物": [{"名":"","与对方关系":"","共处时长":"","依恋表现":"","身体边界":""}],\n "关系要点": ["只写事实"]\n}\n—— 原始资料 ——\n【角色卡】\n' + card + '\n【开场白】\n' + opening;
    let summary = '';
    try { const sr = await callOpeningModel('main', SUM_SYS, SUM_USER); summary = (typeof sr === 'string') ? sr : String((sr && (sr.content || sr.text)) || ''); } catch (e) { summary = ''; }
    try { if (typeof applyBootstrapSummary === "function") applyBootstrapSummary(summary); } catch (e) {}
    const JUDGE_SYS = '你是关系数值的裁判。先写理由，再给数字。只输出 JSON 数组。';
    const JUDGE_USER = '下面是这段关系的资料摘要：\n' + (summary || '(无摘要)') + '\n\n请为这些角色分别判断「他对玩家」的初始好感度（-100至100）和肉体值（0-100）：' + list + '\n【证据尺度】没有明确相处史、信任事实或共同经历时按陌生人处理，E通常为0~10；反复且具体的正向互动才可给10~30；30以上必须列明已经发生的共同经历；60以上必须有长期亲密关系事实；90以上必须有充分且持续的关系证据。不可仅因玩家人设有吸引力、角色可能喜欢某种类型或故事是恋爱向，就推断角色已经动心。负向经历应允许负值。理由必须引用人物设定、时间、地点和具体事实，不足的部分明确写证据不足。\n只输出 JSON 数组：[{"名字":"","好感度":0,"肉体值":0,"推断理由":""}]';
    let raw = '';
    try { const jr = await callOpeningModel('main', JUDGE_SYS, JUDGE_USER); raw = (typeof jr === 'string') ? jr : String((jr && (jr.content || jr.text)) || ''); } catch (e) { raw = ''; }
    let arr = null;
    try { arr = JSON.parse(raw); } catch (e) { const m = raw.match(/\[[\s\S]*\]/); if (m) { try { arr = JSON.parse(m[0]); } catch (e2) { arr = null; } } }
    const map = {};
    (Array.isArray(arr) ? arr : []).forEach(function (it) {
      const nm = String(it && (it.名字 || it.name) || '').trim();
      if (!nm) return;
      map[nm] = { E: Math.max(-100, Math.min(100, Math.round(Number(it.好感度) || 0))), B: Math.max(0, Math.min(100, Math.round(Number(it.肉体值) || 0))), why: String(it.推断理由 || '') };
    });
    return map;
  }

  /* 暴露给面板/调试：面板同作用域可直接调，这里再挂一份到全局，方便自检与外部入口 */
  function exposeManualBootstrap() {
    try { if (typeof mainWin !== 'undefined' && mainWin) mainWin.openManualBootstrapDialog = openManualBootstrapDialog; } catch (e) {}
    try { if (typeof window !== 'undefined') window.openManualBootstrapDialog = openManualBootstrapDialog; } catch (e) {}
  }


  /* ── 把「建档摘要」落进世界与事件系统 ──────────────────────────────
     摘要里的「时间 / 地点 / 关系要点」以前判完数值就丢了。
     现在：① 时间写进 世界.时间（并标记由正文确定，时钟直接采纳，不再从 2000 年爬）
           ② 生成一条开局时间线事件（source=bootstrap），进事件导演的时间线
           ③ 关系要点存到 世界._开局面，后续维护层可读                          */
  function applyBootstrapSummary(summaryText) {
    const out = { time: '', place: '', added: 0, ok: false };
    const s = String(summaryText || '');
    if (!s) return out;
    let obj = null;
    try { obj = JSON.parse(s); } catch (e) {
      const m = s.match(/\{[\s\S]*\}/);
      if (m) { try { obj = JSON.parse(m[0]); } catch (e2) { obj = null; } }
    }
    if (!obj || typeof obj !== 'object') return out;
    out.time = String(obj['时间'] || '').trim();
    out.place = String(obj['地点'] || '').trim();
    const points = Array.isArray(obj['关系要点']) ? obj['关系要点'].map(String).filter(Boolean) : [];
    let data = readMvuLatest();
    let statData = data && data.stat_data ? data.stat_data : null;
    if (!statData) statData = { 世界: {}, 角色: {} };
    if (!statData.世界) statData.世界 = {};
    const world = statData.世界;
    if (out.time && typeof parseGameTime === 'function' && parseGameTime(out.time)) {
      world.时间 = out.time;
      world._时钟已由正文确定 = true;
      world._上次推进时间 = out.time;
      if (!world._时间来源) world._时间来源 = 'bootstrap';
    }
    if (points.length) world._开局面 = { place: out.place, points: points, at: Date.now() };
    try { writeMvuLatest(statData); } catch (e) {}
    if (out.time) {
      try {
        out.added = addTimelineEvents([{
          name: '开局 · ' + (out.place || '开场'),
          time: out.time,
          isMajor: false,
          source: 'bootstrap'
        }]) || 0;
      } catch (e) {}
    }
    out.ok = true;
    return out;
  }

  function openManualBootstrapDialog(panel) {
    const cands = collectManualBootstrapCandidates();
    const head = '<div style="font-size:11.5px;color:#94a3b8;line-height:1.7;margin-bottom:10px;">勾选要建档的角色，然后选「让 AI 判」或「自己填」。<br>候选来自：世界书条目、当前角色卡、聊天里出现过的人名、已有存档。</div>';
    let rows = '';
    if (!cands.length) rows = '<div style="padding:12px;color:#fbbf24;font-size:11.5px;">没扫到任何候选。可以先打开一次角色卡/世界书，或者直接在下框里输入名字。</div>';
    cands.forEach(function (c, i) {
      rows += '<div class="moon-mb-row" data-idx="' + i + '" style="display:flex;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid rgba(148,163,184,.16);">'
        + '<input type="checkbox" class="moon-mb-check" data-idx="' + i + '" ' + (i === 0 ? 'checked' : '') + ' style="width:15px;height:15px;">'
        + '<div style="flex:1;min-width:0;"><div style="font-size:12.5px;color:#e2e8f0;">' + c.name + '</div>'
        + '<div style="font-size:10px;color:#64748b;">来源：' + c.sources.join(' / ') + '</div></div>'
        + '<select class="moon-mb-mode" data-idx="' + i + '" style="padding:4px 6px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;"><option value="ai">让 AI 判</option><option value="manual">自己填</option></select>'
        + '<input class="moon-mb-e" data-idx="' + i + '" type="number" step="0.5" value="0" placeholder="好感" style="width:56px;padding:4px 6px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
        + '<input class="moon-mb-p" data-idx="' + i + '" type="number" step="0.5" value="0" placeholder="肉体" style="width:56px;padding:4px 6px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
        + '<span class="moon-mb-r" data-idx="' + i + '" style="font-size:10px;color:#94a3b8;min-width:56px;">' + manualStageLabel(0) + '</span>'
        + '</div>';
    });
    const html = head + '<div id="moon-mb-rows" style="max-height:44vh;overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:9px;">' + rows + '</div>'
      + '<div style="margin-top:8px;font-size:10px;color:#64748b;">· 未勾选的不写入　· 已存在的角色会被覆盖　· 「让 AI 判」会先梳理一遍人物设定再判</div>';
    showModalDialogCancelable('🖊 手动建档', html,
      async function () {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const picked = [];
        mask.querySelectorAll('.moon-mb-row').forEach(function (row) {
          const idx = Number(row.getAttribute('data-idx'));
          const ck = row.querySelector('.moon-mb-check'); if (!ck || !ck.checked) return;
          const modeEl = row.querySelector('.moon-mb-mode');
          picked.push({
            name: cands[idx] ? cands[idx].name : '',
            mode: modeEl ? modeEl.value : 'ai',
            E: Number(row.querySelector('.moon-mb-e').value) || 0,
            B: Number(row.querySelector('.moon-mb-p').value) || 0
          });
        });
        if (!picked.length) { toast('没勾选任何人', 'info'); return; }
        try { mask.remove(); } catch (e) {}
        let aiMap = {};
        if (picked.some(function (p) { return p.mode === 'ai'; })) {
          try { showLoadingDialog('正在梳理人物设定…'); aiMap = await aiJudgeManualSelected(picked.filter(function (p) { return p.mode === 'ai'; }).map(function (p) { return p.name; })); } catch (e) { aiMap = {}; }
          try { closeLoadingDialog(); } catch (e) {}
        }
        const list = picked.map(function (p) {
          const ai = aiMap[p.name];
          const E = ai ? ai.E : p.E; const B = ai ? ai.B : p.B;
          const st = getRStageFromE(E);
          return { 名字: p.name, 重要度: '主要', 好感度: E, 肉体值: B, 阶段值: st.r, 嫉妒值: 0, 情绪: '😐', 心声: ai && ai.why ? ai.why.slice(0, 30) : '……' };
        });
        try { await applyMultiCardAdaptiveOpening(list); } catch (e) { toast('写入失败：' + (e && e.message || e), 'warning'); }
        try { if (panel && typeof refreshPanel === 'function') refreshPanel(); } catch (e) {}
        toast('手动建档完成：' + list.map(function (x) { return x.名字 + ' ' + x.好感度 + '/' + x.肉体值; }).join('、'), 'success');
      },
      function () { toast('已取消', 'info'); },
      { confirmText: '确认写入', cancelText: '取消',
        onOpen: function (mask) {
          mask.querySelectorAll('.moon-mb-e').forEach(function (input) {
            input.addEventListener('input', function () {
              const idx = input.getAttribute('data-idx');
              const rEl = mask.querySelector('.moon-mb-r[data-idx="' + idx + '"]');
              if (rEl) rEl.textContent = manualStageLabel(input.value);
            });
          });
        }
      });
  }

  try { exposeManualBootstrap(); } catch (e) {}
