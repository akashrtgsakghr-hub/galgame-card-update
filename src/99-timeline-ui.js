  /* 复制对勾：入场带 380/18 的 1.19 微弹，2.5s 后自行淡出并复位按钮。
     两个复制分支（clipboard / execCommand 兜底）共用这一处，别再各写一遍。
     放在文件开头：下面的对话框回调会引用它，避免 const 定义晚于调用。 */
  const TIMELINE_COPY_LABEL = '<span class="mp-ico" aria-hidden="true">📋</span> 复制';
  const TIMELINE_COPY_HIDE_MS = 2500;
  function showTimelineCopied(btn) {
    if (!btn) return;
    btn.innerHTML = '<span class="mp-ico-tick" aria-hidden="true">✔</span> 已复制';
    if (btn._mpCopyTimer) clearTimeout(btn._mpCopyTimer);
    btn._mpCopyTimer = setTimeout(function() {
      btn._mpCopyTimer = 0;
      btn.innerHTML = TIMELINE_COPY_LABEL;
    }, TIMELINE_COPY_HIDE_MS);
  }

  async function runTimelineConvert(panel, cand) {
    const entry = (cand && cand.entry) || {};
    const rawContent = String(entry.content || '').slice(0, 8000);
    if (!rawContent.trim()) { showModalDialog('⚠️ 无法转写', '<div>该条目内容为空。</div>', null, { confirmText: '关闭' }); return; }
    showLoadingDialog('AI 正在转写时间线...');
    let reply = '';
    try { reply = await callOpeningModel('main', buildTimelineConvertSysPrompt(), '【原始时间线内容】\n' + rawContent); }
    catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    reply = String(reply).trim();
    const m = reply.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) reply = m[1].trim();
    if (!reply) { showModalDialog('❌ 转写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
    showTimelineResultDialog(reply, entry, cand);
  }

  function buildTimelineConvertSysPrompt() {
    const lines = [
      '你是时间线格式转换助手。把用户给你的任意格式时间线，转换为本系统标准格式。',
      '【输出格式】每个事件两行，块与块之间空一行：',
      '时间：YYYY年M月D日H点M分',
      '内容：一句话简述',
      '【硬性要求】',
      '1. 24 小时制，格式固定。',
      '2. 时间必须能推断或按顺序合理排布，不能倒退。',
      '3. 一句话说清发生什么。',
      '4. 原文标记「重大」的，在内容末尾加「（重大）」。',
      '5. 只输出时间线条目，不要解释、不要 markdown。'
    ];
    if (getFanficEnhance()) lines.push('【同人补强】若识别到 IP，可结合 IP 常识补强角色名、地点、因果，但不能删改玩家写明的角色名/事件名/时间。');
    return lines.join('\n');
  }

  function showTimelineResultDialog(initialText, entry, cand) {
    const origTitle = String((entry && entry.title) || (cand && cand.tag) || '(无标题)').replace(/</g, '&lt;');
    let currentText = initialText;
    function buildHtml(text) {
      const preview = String(text).replace(/</g, '&lt;');
      return '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">整理好了。点下面「💾 存进脚本」就存进去，<b style="color:#6ee7b7;">不用新建世界书</b>。</div>' +
        '<div id="moon-tl-result-box" style="padding:10px 12px;background:#171a22;border:1px solid rgba(148,163,184,0.2);border-radius:9px;font-family:monospace;font-size:11px;color:#a5f3fc;white-space:pre-wrap;max-height:280px;overflow-y:auto;">' + preview + '</div>' +
        '<div style="margin-top:12px;padding:10px 12px;background:rgba(110,231,183,0.08);border:1px solid rgba(110,231,183,0.3);border-radius:9px;font-size:11px;color:#6ee7b7;line-height:1.7;">来源：' + origTitle + '。存进去之后可以随时在「📋 时间线清单」里改时间、改类型、删除。</div>';
    }
    showModalDialog('🕰️ AI 转写结果', buildHtml(initialText), function() {
      const items = parseTimelineText(currentText);
      if (!items.length) { toast('没认出时间，先把上面的内容改一改', 'warning'); return; }
      const added = addTimelineEvents(items);
      toast('已存进脚本：新增 ' + added + ' 条时间线', 'success');
      setTimeout(function() { openTimelineManagerDialog(null); }, 260);
    }, {
      confirmText: '💾 存进脚本',
      onOpen: function(mask) {
        const confirmBtn = mask.querySelector('#moon-modal-confirm'); if (!confirmBtn) return;
        const copyBtn = mainDoc.createElement('button');
        copyBtn.innerHTML = TIMELINE_COPY_LABEL;
        copyBtn.style.cssText = 'flex:1;padding:10px;border-radius:9px;border:1px solid rgba(56,189,248,0.5);background:#0c2540;color:#7dd3fc;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;';
        copyBtn.addEventListener('click', function() {
          try {
            if (mainWin.navigator && mainWin.navigator.clipboard) mainWin.navigator.clipboard.writeText(currentText).then(function() { showTimelineCopied(copyBtn); });
            else fallbackCopyTimeline(currentText, copyBtn);
          } catch (e) { fallbackCopyTimeline(currentText, copyBtn); }
        });
        const slimBtn = mainDoc.createElement('button');
        slimBtn.innerHTML = '<span class="mp-ico" aria-hidden="true">📉</span> 精简';
        slimBtn.style.cssText = 'flex:1;padding:10px;border-radius:9px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;';
        slimBtn.addEventListener('click', async function() {
          if (slimBtn.disabled) return;
          slimBtn.disabled = true; slimBtn.innerHTML = '<span class="mp-ico" aria-hidden="true">⏳</span> 处理中';
          try {
            const out = await simplifyTimelineTokens(currentText);
            if (out) { currentText = out; const box = mask.querySelector('#moon-tl-result-box'); if (box) box.textContent = out; toast('已精简', 'success'); }
          } catch (e) { toast('精简失败', 'warning'); }
          finally { slimBtn.disabled = false; slimBtn.innerHTML = '<span class="mp-ico" aria-hidden="true">📉</span> 精简'; }
        });
        confirmBtn.parentNode.insertBefore(slimBtn, confirmBtn);
        confirmBtn.parentNode.insertBefore(copyBtn, confirmBtn);
      }
    });
  }

  async function simplifyTimelineTokens(text) {
    const sys = '你是时间线精简助手。在保留时间字段完整的前提下，压缩内容字段。删掉形容词、修辞，只保留「谁+做了什么+关键结果」。不要新增事件，不要改动时间。直接输出精简后的时间线。';
    let reply = await callOpeningModel('main', sys, '【原始时间线】\n' + String(text || ''));
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    return String(reply).trim();
  }
  function fallbackCopyTimeline(txt, btn) {
    try {
      const ta = mainDoc.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      mainDoc.body.appendChild(ta); ta.select(); mainDoc.execCommand('copy'); ta.remove();
      showTimelineCopied(btn);
    } catch (e) { toast('复制失败', 'warning'); }
  }

  function openManualTimelineInputDialog(panel) {
    const html = '<div style="font-size:11px;color:#cbd5e1;margin-bottom:10px;">把任意格式的时间线写进来，AI 转成系统标准格式。</div>' +
      '<textarea id="moon-manual-tl" placeholder="例如：&#10;2016年4月5日 敦被赶出孤儿院&#10;2016年4月8日 敦加入侦探社（重大）" style="width:100%;box-sizing:border-box;min-height:160px;padding:10px 12px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;line-height:1.7;resize:vertical;font-family:inherit;"></textarea>';
    showModalDialogCancelable('✍️ 手动输入时间线', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const raw = mask ? mask.querySelector('#moon-manual-tl').value.trim() : '';
        try { if (mask) mask.remove(); } catch (e) {}
        if (!raw) { toast('输入为空', 'info'); return; }
        const fakeEntry = { title: '(玩家手动输入)', content: raw };
        const sysPrompt = buildTimelineConvertSysPrompt();
        showLoadingDialog('AI 正在转写...');
        let reply = '';
        try { reply = await callOpeningModel('main', sysPrompt, '【原始时间线内容】\n' + raw); }
        catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
        closeLoadingDialog();
        if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
        reply = String(reply).trim();
        const m = reply.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) reply = m[1].trim();
        if (!reply) { showModalDialog('❌ 转写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
        showTimelineResultDialog(reply, fakeEntry, { tag: '(手动输入)' });
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始转写', cancelText: '取消' });
  }
  /* ───────────────────────────────────────────────────────── */
  /* ── 时间线清单：全部操作都写回脚本本地仓库 ── */
  function openTimelineManagerDialog(panel) {
    const list = loadTimelineStore();
    let nowStr = '';
    try { const d = readMvuLatest(); nowStr = (d && d.stat_data && d.stat_data.世界 && d.stat_data.世界.时间) || ''; } catch (e) {}
    const nowDate = parseGameTime(nowStr);

    const rows = list.length ? list.map(function(e) {
      const d = parseGameTime(e.time);
      const past = !!(nowDate && d && d.getTime() <= nowDate.getTime());
      const stateTxt = e.done ? '✅ 已触发' : (past ? '⚡ 已到点' : '⏳ 待触发');
      const stateColor = e.done ? '#6ee7b7' : (past ? '#fbbf24' : '#94a3b8');
      const typeBadge = e.isMajor
        ? '<span style="font-size:9.5px;padding:1px 6px;border-radius:6px;background:rgba(244,114,208,0.18);color:#f9a8d4;border:1px solid rgba(244,114,208,0.45);">重大</span>'
        : '<span style="font-size:9.5px;padding:1px 6px;border-radius:6px;background:rgba(56,189,248,0.15);color:#7dd3fc;border:1px solid rgba(56,189,248,0.35);">日常</span>';
      return '<div style="padding:9px 10px;background:#171a22;border:1px solid rgba(148,163,184,0.16);border-radius:9px;margin-bottom:6px;">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          typeBadge + '<span style="font-size:12px;font-weight:600;color:#e2e8f0;flex:1;min-width:0;overflow-wrap:anywhere;">' + escapeFeatureHtml(e.name) + '</span>' +
          '<span style="font-size:9.5px;color:' + stateColor + ';">' + stateTxt + '</span>' +
        '</div>' +
        '<div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">' + escapeFeatureHtml(e.time || '未写时间') + '</div>' +
        '<div style="display:flex;gap:5px;margin-top:6px;">' +
          '<button class="moon-tl-act" data-act="time" data-id="' + e.id + '" style="flex:1;padding:5px;border-radius:6px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:10.5px;cursor:pointer;font-family:inherit;">⏱ 改时间</button>' +
          '<button class="moon-tl-act" data-act="type" data-id="' + e.id + '" style="flex:1;padding:5px;border-radius:6px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;">🔄 换成' + (e.isMajor ? '日常' : '重大') + '</button>' +
          '<button class="moon-tl-act" data-act="del" data-id="' + e.id + '" style="flex:0.7;padding:5px;border-radius:6px;border:1px solid rgba(248,113,113,0.4);background:#2a1010;color:#fca5a5;font-size:10.5px;cursor:pointer;font-family:inherit;">🗑</button>' +
        '</div></div>';
    }).join('') : '<div style="padding:16px 10px;text-align:center;font-size:11.5px;color:#64748b;line-height:1.8;">还没有时间线。<br>点下面「📝 让 AI 编一份」，或「➕ 手动加一条」。</div>';

    const html =
      '<div style="font-size:11px;color:#94a3b8;line-height:1.7;margin-bottom:8px;">' +
        '这些大事表<b style="color:#7dd3fc;">存在脚本里</b>，不用建世界书；换存档、开新对话都还在这张卡上。' +
        (nowStr ? '<br>当前世界时间：<b style="color:#e2e8f0;">' + escapeFeatureHtml(nowStr) + '</b>' : '') +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<button id="moon-tl-add" style="flex:1;min-width:88px;padding:7px;border-radius:8px;border:1px solid rgba(110,231,183,0.4);background:#0d2b22;color:#6ee7b7;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">➕ 手动加一条</button>' +
        '<button id="moon-tl-cls" style="flex:1;min-width:88px;padding:7px;border-radius:8px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">🤖 判日常/重大</button>' +
        '<button id="moon-tl-clear" style="flex:0.8;min-width:66px;padding:7px;border-radius:8px;border:1px solid rgba(248,113,113,0.4);background:#2a1010;color:#fca5a5;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">🗑 清空</button>' +
      '</div>' +
      '<div style="max-height:44dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>' +
      '<div style="margin-top:10px;font-size:10.5px;color:#64748b;line-height:1.6;">到点的事会自动变成「当前事件」并规定占几回合，AI 只负责把这件事写好看。</div>';

    showModalDialog('📋 时间线清单（共 ' + list.length + ' 条）', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        function reopen() { try { mask.remove(); } catch (e) {} openTimelineManagerDialog(panel); }
        const addBtn = mask.querySelector('#moon-tl-add');
        if (addBtn) addBtn.addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          openTimelineAddDialog(panel);
        });
        const clsBtn = mask.querySelector('#moon-tl-cls');
        if (clsBtn) clsBtn.addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          classifyTimelineWithAI(panel);
        });
        const clrBtn = mask.querySelector('#moon-tl-clear');
        if (clrBtn) clrBtn.addEventListener('click', function() {
          if (!list.length) { toast('本来就是空的', 'info'); return; }
          clearTimelineStore(); toast('已清空时间线', 'success'); reopen();
        });
        mask.querySelectorAll('.moon-tl-act').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id');
            const act = btn.getAttribute('data-act');
            const item = list.filter(function(x) { return x.id === id; })[0];
            if (!item) return;
            if (act === 'del') { removeTimelineEvent(id); toast('已删除', 'success'); reopen(); return; }
            if (act === 'type') { updateTimelineEvent(id, { isMajor: !item.isMajor }); reopen(); return; }
            if (act === 'time') {
              try { mask.remove(); } catch (e) {}
              showTimelineTimeEditor(panel, item);
            }
          });
        });
      }
    });
  }

  function showTimelineTimeEditor(panel, item) {
    const html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">时间写法要能被认出来，例如：2024年5月3日 · 星期五 · 19:30</div>' +
      '<input id="moon-tl-time-input" type="text" value="' + escapeFeatureHtml(item.time || '') + '" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;font-family:inherit;">';
    showModalDialogCancelable('⏱ 改时间', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const v = mask ? String(mask.querySelector('#moon-tl-time-input').value || '').trim() : '';
        try { if (mask) mask.remove(); } catch (e) {}
        if (!parseGameTime(v)) { toast('这个时间读不出来，换个写法试试', 'warning'); openTimelineManagerDialog(panel); return; }
        updateTimelineEvent(item.id, { time: v });
        toast('时间已改', 'success');
        openTimelineManagerDialog(panel);
      },
      function() { openTimelineManagerDialog(panel); },
      { confirmText: '保存', cancelText: '取消' });
  }

  function openTimelineAddDialog(panel) {
    const nowStr = (function() { try { const d = readMvuLatest(); return (d && d.stat_data && d.stat_data.世界 && d.stat_data.世界.时间) || ''; } catch (e) { return ''; } })();
    const html =
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">时间（例：2024年5月3日 · 星期五 · 19:30）</div>' +
      '<input id="moon-tl-add-time" type="text" value="' + escapeFeatureHtml(nowStr) + '" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;font-family:inherit;">' +
      '<div style="font-size:11px;color:#94a3b8;margin:10px 0 4px;">会发生什么（一句话）</div>' +
      '<input id="moon-tl-add-name" type="text" placeholder="例：文化祭当天，她鼓起勇气约你" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;font-family:inherit;">' +
      '<label style="display:flex;align-items:center;gap:6px;margin-top:12px;font-size:11.5px;color:#cbd5e1;cursor:pointer;">' +
        '<input type="checkbox" id="moon-tl-add-major"> 这是重大事件（不加就是日常）</label>';
    showModalDialogCancelable('➕ 加一条时间线', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        if (!mask) return;
        const time = String(mask.querySelector('#moon-tl-add-time').value || '').trim();
        const name = String(mask.querySelector('#moon-tl-add-name').value || '').trim();
        const major = !!mask.querySelector('#moon-tl-add-major').checked;
        try { mask.remove(); } catch (e) {}
        if (!name) { toast('事件名不能空着', 'warning'); openTimelineManagerDialog(panel); return; }
        if (!parseGameTime(time)) { toast('时间读不出来，换个写法试试', 'warning'); openTimelineManagerDialog(panel); return; }
        addTimelineEvents([{ name: name, time: time, isMajor: major }]);
        toast('已加进脚本', 'success');
        openTimelineManagerDialog(panel);
      },
      function() { openTimelineManagerDialog(panel); },
      { confirmText: '加进去', cancelText: '取消' });
  }

  async function classifyTimelineWithAI(panel) {
    const list = loadTimelineStore();
    if (!list.length) { toast('时间线是空的，先加几条', 'info'); return; }
    const payload = list.map(function(e, i) { return (i + 1) + '. ' + (e.time || '(无时间)') + '｜' + e.name; }).join('\n');
    const sys = '你是剧情节奏规划助手。给下面每个时间线事件判断它属于「日常」还是「重大」。\n判断标准：日常=吃饭、上学、闲聊、小摩擦、日常约会这种起伏不大的事；重大=告白、吵架分手、事故、离别、生死、主线冲突这种会改变关系或世界观的事。\n【输出】严格 JSON 数组，只输出 JSON：\n[{"i":1,"type":"日常","why":"≤12字"}]\n不要解释，不要 markdown。';
    showLoadingDialog('AI 正在判断哪件是日常、哪件是重大…');
    let reply = '';
    try { reply = await callOpeningModel('main', sys, payload); }
    catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    const arr = extractJson(reply);
    if (!Array.isArray(arr)) { toast('AI 没按格式回，再试一次', 'warning'); return; }
    let changed = 0;
    arr.forEach(function(it) {
      if (!it) return;
      const idx = Number(it.i) - 1;
      const target = list[idx];
      if (!target) return;
      const isMajor = /重大|关键/.test(String(it.type || ''));
      if (target.isMajor !== isMajor) { updateTimelineEvent(target.id, { isMajor: isMajor }); changed++; }
    });
    toast('判定完成，改了 ' + changed + ' 条', 'success');
    openTimelineManagerDialog(panel);
  }

  function openTimelineGeneratorDialog(panel) {
    const html = '<div style="font-size:11px;color:#cbd5e1;margin-bottom:10px;">让 AI 根据角色卡 / 大纲，生成 [Timeline] 世界书条目。</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">剧情大纲（可选）</div>' +
      '<textarea id="moon-tl-input" placeholder="例如：主角与角色共度四季、经历表白、吵架、和好……" style="width:100%;box-sizing:border-box;min-height:100px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.25);background:#171a22;color:#e2e8f0;font-size:11.5px;line-height:1.6;resize:vertical;"></textarea>' +
      '<div style="margin-top:10px;font-size:11px;color:#94a3b8;margin-bottom:6px;">选择模型（未保存API时点开始会自动弹窗填写）：</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid #a94d8b;background:#241025;cursor:pointer;"><input type="radio" name="moon-tl-model" value="custom" ' + (hasValidCustomAIConfig() ? 'checked' : '') + '><span style="font-size:12px;color:#ffc4e9;">🔑 我自己的 API' + (hasValidCustomAIConfig() ? '（已填好）' : '（要先填）') + '</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-tl-model" value="main" ' + (!hasValidCustomAIConfig() ? 'checked' : '') + '><span style="font-size:12px;">🎭 就用酒馆现在这个 AI</span></label></div>';
    showModalDialogCancelable('🕰️ 时间线生成器', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const userInput = mask ? mask.querySelector('#moon-tl-input').value.trim() : '';
        const sel = mask ? mask.querySelector('input[name="moon-tl-model"]:checked') : null;
        const provider = sel ? sel.value : 'main';
        try { if (mask) mask.remove(); } catch (e) {}
        await runTimelineGenerator(panel, provider, userInput);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始生成', cancelText: '取消' });
  }

  async function runTimelineGenerator(panel, provider, userInput) {
    const charInfo = collectCharInfoForBio('');
    const tpl = getPromptTemplates().timeline || DEFAULT_PROMPTS.timeline;
    const vars = {
      charInfo: charInfo,
      userInput: userInput || '（未提供额外大纲，请根据角色卡设定自由设计合理的主线与情感推进时间线）'
    };
    showLoadingDialog('AI 正在生成时间线...');
    let reply = '';
    try {
      reply = await callOpeningModel(provider || 'main', renderPromptTemplate(tpl.sys, vars), renderPromptTemplate(tpl.user, vars));
    } catch (e) {
      closeLoadingDialog();
      toast('时间线生成失败：' + (e.message || e), 'warning');
      return;
    }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply || '');
    reply = String(reply).trim();
    if (!reply) {
      showModalDialog('❌ 生成失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' });
      return;
    }
    let formatted = reply;
    try {
      const arr = extractJson(reply);
      if (Array.isArray(arr) && arr.length) {
        formatted = arr.map(function(item) {
          if (!item || typeof item !== 'object') return '';
          const name = String(item.name || item.title || item.comment || '').replace(/^\[Timeline\]\s*/i, '').trim();
          const time = String(item.time || item.时间 || '').trim();
          const desc = String(item.desc || item.content || item.描述 || '').replace(/\n+/g, ' ').trim();
          const major = /重大|关键/.test(String(item.type || item.类型 || '')) || item.isMajor === true;
          if (!time) return '';
          const head = name || desc.slice(0, 20) || '事件';
          const extra = (desc && desc !== head) ? ' ' + desc : '';
          return '时间：' + time + '\n内容：【' + head + '】' + extra + (major ? '（重大）' : '');
        }).filter(Boolean).join('\n\n');
      }
    } catch (e) {}
    const items = parseTimelineText(formatted);
    if (!items.length) { showTimelineResultDialog(formatted, { title: '(AI 生成时间线)' }, { tag: 'AI' }); return; }
    const added = addTimelineEvents(items);
    toast('已存进脚本：新增 ' + added + ' 条时间线（重复的会跳过）', 'success');
    openTimelineManagerDialog(panel);
  }

async function runTimelineMultiConvert(panel, entries) {
  if (!entries || !entries.length) return;
  // 合并所有选中条目
  const merged = entries.map(function(e) {
    return '=== 【' + (e.bookName || '未知书') + '】' + (e.title || '(无标题)') + ' ===\n' + String(e.content || '');
  }).join('\n\n');
  const raw = merged.slice(0, 12000);
  if (!raw.trim()) { showModalDialog('⚠️ 无法转写', '<div>选中条目内容为空。</div>', null, { confirmText: '关闭' }); return; }
  showLoadingDialog('AI 正在转写时间线...');
  let reply = '';
  try { reply = await callOpeningModel('main', buildTimelineConvertSysPrompt(), '【原始时间线内容】\n' + raw); }
  catch (e) { closeLoadingDialog(); toast('调用失败：' + (e.message || e), 'warning'); return; }
  closeLoadingDialog();
  if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
  reply = String(reply).trim();
  const m = reply.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) reply = m[1].trim();
  if (!reply) { showModalDialog('❌ 转写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
  showTimelineResultDialog(reply, { title: '(合并转写 ' + entries.length + ' 条)' }, { tag: getTimelineTag() || '[WorldTimeline]' });
}

function openTimelineTagDialog(panel, onDone) {
  const cur = getTimelineTag();
  const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
    '填一个标签名（例如 <code style="color:#7dd3fc;">[WorldTimeline]</code> 或 <code style="color:#7dd3fc;">世界时间线</code>）。<br>' +
    '启用后扫描会优先匹配以此标签开头的条目。<br>' +
    '<span style="color:#fbbf24;">留空即关闭。</span></div>' +
    '<input id="moon-tltag-input" type="text" value="' + String(cur || '').replace(/"/g, '&quot;') + '" placeholder="例如：[WorldTimeline]" style="width:100%;box-sizing:border-box;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12.5px;">';
  showModalDialogCancelable('📜 自定义时间线标签', html,
    function() {
      const mask = mainDoc.getElementById('moon-modal-mask');
      const v = mask ? mask.querySelector('#moon-tltag-input').value.trim() : '';
      setTimelineTag(v);
      try { if (mask) mask.remove(); } catch (e) {}
      toast(v ? ('时间线标签已设为：' + v) : '已关闭自定义时间线标签', 'info');
      try { refreshPanel(); } catch (e) {}
      if (typeof onDone === 'function') setTimeout(onDone, 200);
    },
    function() { toast('已取消', 'info'); if (typeof onDone === 'function') setTimeout(onDone, 200); },
    { confirmText: '保存', cancelText: '取消' });
}

function openTimelineKeywordDialog(panel, onDone) {
  const cur = getTimelineKeywords();
  const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:8px;">' +
    '扫描时会用这些关键词匹配世界书条目的<strong>标题和正文</strong>。<br>' +
    '<span style="color:#fbbf24;">默认：时间线 / 时间剧情 / 主线剧情</span></div>' +
    '<textarea id="moon-tlkw-input" placeholder="每行一个关键词" style="width:100%;box-sizing:border-box;min-height:120px;padding:9px 11px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;line-height:1.7;resize:vertical;font-family:inherit;">' + cur.join('\n') + '</textarea>' +
    '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">每行一个，空行自动忽略。</div>';
  showModalDialogCancelable('🔍 时间线关键词', html,
    function() {
      const mask = mainDoc.getElementById('moon-modal-mask');
      const v = mask ? mask.querySelector('#moon-tlkw-input').value : '';
      const list = String(v).split('\n').map(function(x) { return x.trim(); }).filter(Boolean);
      setTimelineKeywords(list.length ? list : DEFAULT_TIMELINE_KEYWORDS);
      try { if (mask) mask.remove(); } catch (e) {}
      toast('已保存 ' + (list.length || DEFAULT_TIMELINE_KEYWORDS.length) + ' 个关键词', 'success');
      if (typeof onDone === 'function') setTimeout(onDone, 200);
    },
    function() { toast('已取消', 'info'); if (typeof onDone === 'function') setTimeout(onDone, 200); },
    { confirmText: '保存', cancelText: '取消' });
}

