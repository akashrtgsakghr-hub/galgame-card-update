  function checkAndPromptMigrate() { return; }

  function startMigrationPack(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色) {
      showModalDialog('📦 打包迁移', '<div>当前对话没有可打包的数据。</div>', null, { confirmText: '关闭' });
      return;
    }
    const statData = data.stat_data;
    const chars = statData.角色;
    const validNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    if (!validNames.length) {
      showModalDialog('📦 打包迁移', '<div>当前对话没有有效角色数据。</div>', null, { confirmText: '关闭' });
      return;
    }
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '将当前对话的完整角色档案打包。切换到新对话窗口后，脚本会自动询问是否导入。' +
      '<br><span style="color:#fbbf24;">导入后会完整覆盖新对话的变量数据。</span></div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;font-size:11px;color:#cbd5e1;line-height:1.7;">' +
      '<div style="color:#7dd3fc;font-weight:700;margin-bottom:4px;">将打包以下内容（完整无删减）：</div>' +
      '<div>· 世界时间 / 地点 / 内部流逝天数 / 上次推进时间</div>' +
      '<div>· ' + validNames.length + ' 个角色的完整档案：</div>' +
      '<div style="padding-left:14px;color:#94a3b8;">好感度 · 肉体值 · 阶段值 · 嫉妒值 · 情绪 · 心声 · 在场 · 重要度</div>' +
      '<div style="padding-left:14px;color:#94a3b8;">_invidia 全部字段 · _lastRoll · _quota 全部字段（周上限/破门/暗掷/玩家冷却/表白期/自适应标记）</div>' +
      '<div style="padding-left:14px;color:#94a3b8;">_eventState · _timelineCompleted · _debuff 冷战期</div>' +
      '</div>';
    showModalDialogCancelable('📦 打包迁移', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        try { if (mask) mask.remove(); } catch (e) {}
        runMigrationPack();
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始打包', cancelText: '取消' });
  }

  function runMigrationPack() {
    const data = readMvuLatest();
    if (!data || !data.stat_data) { toast('没有可打包的数据', 'warning'); return; }
    const pending = {
      fromChatId: (function() { try { return getSTCtx().chatId || ''; } catch(e) { return ''; } })(),
      fromCardName: getCurrentCardName(),
      packedAt: Date.now(),
      stat_data: JSON.parse(JSON.stringify(data.stat_data))
    };
    try {
      (getStorage() || localStorage).setItem(PENDING_MIGRATION_KEY, JSON.stringify(pending));
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata) { ctx.chatMetadata[PENDING_MIGRATION_KEY] = pending; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
    } catch (e) { toast('打包写入失败', 'warning'); return; }
    const charCount = Object.keys(pending.stat_data.角色 || {}).filter(function(n) { return !isCharSkeleton(pending.stat_data.角色[n]); }).length;
    showModalDialog('✅ 打包完成',
      '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '已打包 <b style="color:#7dd3fc;">' + charCount + '</b> 个角色的完整档案。</div>' +
      '<div style="padding:10px 12px;background:#05070e;border:1px solid rgba(110,231,183,0.25);border-radius:9px;font-size:11px;color:#6ee7b7;line-height:1.7;">' +
      '🎯 接下来：切换到你想继续演的那个新对话窗口，脚本会自动弹窗询问是否导入。</div>',
      null, { confirmText: '知道了' });
  }

  function checkPendingMigration() {
    let pending = null;
    try {
      const raw = (getStorage() || localStorage).getItem(PENDING_MIGRATION_KEY);
      if (raw) pending = JSON.parse(raw);
    } catch (e) {}
    if (!pending) {
      try {
        const ctx = getSTCtx();
        if (ctx && ctx.chatMetadata && ctx.chatMetadata[PENDING_MIGRATION_KEY]) pending = ctx.chatMetadata[PENDING_MIGRATION_KEY];
      } catch (e) {}
    }
    if (!pending || !pending.stat_data) return;
    const cur = loadLocalState();
    if (cur && cur.stat_data && cur.stat_data.角色) {
      for (const n in cur.stat_data.角色) {
        if (cur.stat_data.角色[n] && !isCharSkeleton(cur.stat_data.角色[n])) return;
      }
    }
    const validNames = Object.keys(pending.stat_data.角色 || {}).filter(function(n) { return !isCharSkeleton(pending.stat_data.角色[n]); });
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '检测到一份来自其他对话的打包数据：</div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      '<div>来源卡：<b style="color:#7dd3fc;">' + String(pending.fromCardName || '(未知)') + '</b></div>' +
      '<div>打包时间：' + new Date(pending.packedAt || 0).toLocaleString() + '</div>' +
      '<div>角色数：' + validNames.length + '</div>' +
      '<div>世界时间：' + String(pending.stat_data.世界 && pending.stat_data.世界.时间 || '(未知)') + '</div>' +
      '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">包含角色：</div>' +
      '<div style="padding:8px 10px;background:#05070e;border:1px solid rgba(148,163,184,0.15);border-radius:8px;font-size:11px;color:#cbd5e1;line-height:1.7;max-height:100px;overflow-y:auto;">' + validNames.join('、') + '</div>' +
      '<div style="margin-top:10px;font-size:11px;color:#fbbf24;line-height:1.7;">⚠️ 导入后会完整覆盖当前对话的变量数据（含所有 _quota / _eventState / _debuff / _timelineCompleted 等字段）。</div>';
    showModalDialogCancelable('📦 检测到迁移数据', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        try { if (mask) mask.remove(); } catch (e) {}
        applyPendingMigration(pending);
      },
      function() { toast('已跳过（打包数据仍保留，下次可再选）', 'info'); },
      { confirmText: '导入', cancelText: '稍后再说' });
  }

  async function applyPendingMigration(pending) {
    if (!pending || !pending.stat_data) return;
    const ok = await writeMvuLatest(pending.stat_data);
    if (!ok) { toast('迁移写入失败', 'warning'); return; }
    try {
      (getStorage() || localStorage).removeItem(PENDING_MIGRATION_KEY);
      const ctx = getSTCtx();
      if (ctx && ctx.chatMetadata && ctx.chatMetadata[PENDING_MIGRATION_KEY]) {
        delete ctx.chatMetadata[PENDING_MIGRATION_KEY];
        if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata();
      }
    } catch (e) {}
    toast('迁移完成，档案已完整导入', 'success');
    try { refreshPanel(); } catch (e) {}
  }

  function manualMigrate(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data) { toast('无法读取变量数据', 'warning'); return; }
    const pending = getPendingMigrateChars(data.stat_data);
    if (pending.length === 0) {
      showModalDialog('🔄 兼容迁移', '<div>当前没有需要迁移的角色。</div>', null, { confirmText: '关闭' });
      return;
    }
    const html = '<div>以下角色将进行字段迁移：</div>'
      + '<div style="margin-top:8px;color:#7dd3fc;">' + pending.join('、') + '</div>'
      + '<div style="margin-top:10px;font-size:11px;color:#fbbf24;">旧字段会转换为新字段，四维数值保留，计时字段重置。</div>';
    showModalDialogCancelable('🔄 兼容迁移', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        try { if (mask) mask.remove(); } catch (e) {}
        const statData = data.stat_data;
        for (const name of pending) {
          const ch = statData.角色[name];
          if (!ch) continue;
          if (ch.情感值 !== undefined) { ch.好感度 = Number(ch.情感值) || 0; delete ch.情感值; }
          if (ch.关系值 !== undefined) { ch.阶段值 = Number(ch.关系值) || 0; delete ch.关系值; }
          if (ch.身体值 !== undefined) { ch.肉体值 = Number(ch.身体值) || 0; delete ch.身体值; }
          if (ch.好感值 !== undefined) { ch.好感度 = Number(ch.好感值) || 0; delete ch.好感值; }
          if (ch._quota && ch._quota.E周已用 !== undefined) { ch._quota.好感度周上限已用 = Number(ch._quota.E周已用) || 0; delete ch._quota.E周已用; }
          if (ch._quota && ch._quota._debuff && ch._quota._debuff.踩雷冷却中 !== undefined) {
            ch._quota._debuff.冷战期 = !!ch._quota._debuff.踩雷冷却中;
            delete ch._quota._debuff.踩雷冷却中;
          }
          if (!ch._quota) ch._quota = {};
          if (!ch._quota._eventState) {
            ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 };
          }
          if (!Array.isArray(ch._quota._timelineCompleted)) ch._quota._timelineCompleted = [];
          if (ch._quota._playerConfession === undefined) ch._quota._playerConfession = false;
          if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
          if (!ch._quota._debuff) ch._quota._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
        }
        statData[MIGRATED_FLAG] = true;
        const ok = await writeMvuLatest(statData);
        if (ok) { toast('兼容迁移完成', 'success'); try { refreshPanel(); } catch (e) {} }
        else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '确认迁移', cancelText: '取消' });
  }

  function openAiMigrateEntryDialog(panel) {
    const data = readMvuLatest();
    if (!data || !data.stat_data) { toast('无法读取变量数据', 'warning'); return; }
    showAiMigrateEntryDialog(data, panel);
  }

  function showAiMigrateEntryDialog(data, panel) {
    const savedPref = getAiMigrateModelPref();
    if (savedPref) { runAiAssistedMigrate(savedPref, data, panel); return; }
    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">让 AI 通读聊天上下文，判断哪些条目该保留、改名、删除、合并。</div>'
      + '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">选择模型（未保存API时点开始会自动弹窗填写）：</div>'
      + '<div style="display:flex;gap:8px;">'
      + '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid #a94d8b;background:#241025;cursor:pointer;"><input type="radio" name="moon-aimig-model" value="custom" ' + (hasValidCustomAIConfig() ? 'checked' : '') + '><span style="font-size:12px;color:#ffc4e9;">🔑 我自己的 API' + (hasValidCustomAIConfig() ? '（已填好）' : '（要先填）') + '</span></label>'
      + '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-aimig-model" value="main" ' + (!hasValidCustomAIConfig() ? 'checked' : '') + '><span style="font-size:12px;">🎭 就用酒馆现在这个 AI</span></label></div>';
    showModalDialogCancelable('🤖 AI 辅助迁移 · 选择模型', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const sel = mask ? mask.querySelector('input[name="moon-aimig-model"]:checked') : null;
        const provider = sel ? sel.value : 'main';
        saveAiMigrateModelPref(provider);
        try { if (mask) mask.remove(); } catch (e) {}
        runAiAssistedMigrate(provider, data, panel);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始整理', cancelText: '取消' });
  }

  function getAiMigrateModelPref() { try { return mainWin.localStorage.getItem(AI_MIGRATE_MODEL_PREF_KEY) || ''; } catch (e) { return ''; } }
  function saveAiMigrateModelPref(p) { try { mainWin.localStorage.setItem(AI_MIGRATE_MODEL_PREF_KEY, p); } catch (e) {} }

  async function runAiAssistedMigrate(provider, data, panel) {
    if (!data || !data.stat_data || !data.stat_data.角色) { toast('没有可整理的角色数据', 'warning'); return; }
    const chars = data.stat_data.角色;
    const names = Object.keys(chars);
    if (!names.length) { toast('角色表为空', 'info'); return; }
    let charInfo = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) charInfo = '角色卡：' + (ch.name || '未命名') + '\n' + (ch.description || '').slice(0, 800);
      }
    } catch (e) {}
    if (!charInfo) charInfo = '(无法读取)';
    const chatCtx = collectChatHistoryContext(6000);
    const charsDump = names.map(function(n) {
      const ch = chars[n] || {};
      return '- ' + n + ' | E' + (ch.好感度 || 0) + ' P' + (ch.肉体值 || 0) + ' R' + (ch.阶段值 || 0) + ' I' + (ch.嫉妒值 || 0);
    }).join('\n');
    const sysPrompt = '你是月相多维情感系统的「变量整理」助手。判断每个条目应该怎么处理。\n【输出】严格 JSON：{"keep":[],"rename":[{"from":"旧","to":"新","reason":""}],"delete":[{"name":"","reason":""}],"merge":[{"froms":[],"to":"","reason":""}]}\n只输出 JSON。';
    const userPrompt = '【角色卡】\n' + charInfo + '\n\n【当前角色表】\n' + charsDump + '\n\n【聊天上下文】\n' + (chatCtx.chat || '(无)');
    showLoadingDialog('AI 正在整理变量...');
    let reply = '';
    try { reply = await callOpeningModel(provider, sysPrompt, userPrompt); }
    catch (e) { closeLoadingDialog(); toast('调用模型失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    const decision = extractJson(reply);
    if (!decision || typeof decision !== 'object') { showModalDialog('❌ 解析失败', '<div>模型未返回合法 JSON。</div>', null, { confirmText: '关闭' }); return; }
    renderAiMigratePreview(data, { keep: decision.keep || [], rename: decision.rename || [], delete: decision.delete || [], merge: decision.merge || [] }, panel);
  }

  function renderAiMigratePreview(data, decision, panel) {
    const chars = data.stat_data.角色 || {};
    const names = Object.keys(chars);
    const actions = [];
    decision.keep.forEach(function(n) { if (names.indexOf(n) >= 0) actions.push({ type: 'keep', from: n, to: n, reason: '保留' }); });
    decision.rename.forEach(function(item) { if (item && names.indexOf(item.from) >= 0) actions.push({ type: 'rename', from: item.from, to: item.to, reason: item.reason || '' }); });
    decision.delete.forEach(function(item) { if (item && names.indexOf(item.name) >= 0) actions.push({ type: 'delete', from: item.name, reason: item.reason || '' }); });
    decision.merge.forEach(function(item) {
      if (!item || !Array.isArray(item.froms)) return;
      const validFroms = item.froms.filter(function(n) { return names.indexOf(n) >= 0; });
      if (validFroms.length < 2) return;
      actions.push({ type: 'merge', from: validFroms.join('+'), froms: validFroms, to: item.to, reason: item.reason || '' });
    });
    if (!actions.length) { showModalDialog('🤖 AI 整理完成', '<div>AI 未给出任何有效改动。</div>', null, { confirmText: '关闭' }); return; }
    let html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">AI 已给出整理方案。勾选后应用。</div>';
    actions.forEach(function(a, idx) {
      const colorMap = { keep: '#6ee7b7', rename: '#7dd3fc', delete: '#fca5a5', merge: '#c084fc' };
      const labelMap = { keep: '保留', rename: '重命名', delete: '删除', merge: '合并' };
      html += '<label style="display:block;padding:8px 10px;background:#05070e;border-radius:9px;margin-bottom:6px;border:1px solid rgba(148,163,184,0.15);cursor:pointer;">'
        + '<input type="checkbox" class="moon-aimig-check" data-idx="' + idx + '" checked style="margin-right:8px;">'
        + '<span style="padding:1px 7px;border-radius:6px;background:' + (colorMap[a.type] || '#cbd5e1') + ';color:#05070e;font-size:10px;font-weight:700;margin-right:6px;">' + (labelMap[a.type] || a.type) + '</span>'
        + '<b style="color:#e2e8f0;">' + a.from + '</b>'
        + (a.to && a.to !== a.from ? ' → ' + a.to : '')
        + (a.reason ? '<div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">💡 ' + a.reason + '</div>' : '')
        + '</label>';
    });
    html += '<div style="margin-top:10px;display:flex;gap:6px;">'
      + '<button id="moon-aimig-all" style="flex:0.7;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">全选/全不选</button>'
      + '<button id="moon-aimig-apply" style="flex:1.4;padding:10px;border-radius:9px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✅ 应用</button></div>';
    showModalDialog('🤖 AI 辅助迁移 · 确认方案', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-aimig-all').addEventListener('click', function() {
          const boxes = mask.querySelectorAll('.moon-aimig-check');
          const allChecked = Array.from(boxes).every(function(b) { return b.checked; });
          boxes.forEach(function(b) { b.checked = !allChecked; });
        });
        mask.querySelector('#moon-aimig-apply').addEventListener('click', function() {
          const selected = [];
          mask.querySelectorAll('.moon-aimig-check').forEach(function(b) {
            if (b.checked) selected.push(actions[Number(b.getAttribute('data-idx'))]);
          });
          if (!selected.length) { toast('未勾选任何操作', 'info'); return; }
          try { mask.remove(); } catch (e) {}
          applyAiMigration(data, selected, panel);
        });
      }
    });
  }

  async function applyAiMigration(data, selectedActions, panel) {
    const chars = data.stat_data.角色 || {};
    const now = (data.stat_data.世界 && data.stat_data.世界.时间) || '2000年01月01日 · 星期六 · 00:00';
    const newChars = {};
    const handled = {};
    selectedActions.forEach(function(a) {
      if (a.type === 'delete') handled[a.from] = true;
      if (a.type === 'rename') handled[a.from] = true;
      if (a.type === 'merge' && a.froms) a.froms.forEach(function(n) { handled[n] = true; });
      if (a.type === 'keep') handled[a.from] = true;
    });
    selectedActions.forEach(function(a) {
      if (a.type === 'delete') return;
      if (a.type === 'keep') { if (chars[a.from]) newChars[a.to] = cloneCharWithResetQuota(chars[a.from], now, a.noReset); }
      else if (a.type === 'rename') { if (chars[a.from]) newChars[a.to] = cloneCharWithResetQuota(chars[a.from], now, false); }
      else if (a.type === 'merge') {
        let merged = null;
        a.froms.forEach(function(n) {
          const src = chars[n];
          if (!src) return;
          if (!merged) merged = cloneCharWithResetQuota(src, now, false);
          else {
            merged.好感度 = Math.max(Number(merged.好感度) || 0, Number(src.好感度) || 0);
            merged.肉体值 = Math.max(Number(merged.肉体值) || 0, Number(src.肉体值) || 0);
            merged.阶段值 = Math.max(Number(merged.阶段值) || 0, Number(src.阶段值) || 0);
            merged.嫉妒值 = Math.max(Number(merged.嫉妒值) || 0, Number(src.嫉妒值) || 0);
          }
        });
        if (merged) newChars[a.to] = merged;
      }
    });
    Object.keys(chars).forEach(function(n) { if (!handled[n] && !newChars[n]) newChars[n] = chars[n]; });
    if (!Object.keys(newChars).length) { showModalDialog('⚠️ 结果为空', '<div>整理后角色表会变成空表。</div>', null, { confirmText: '返回' }); return; }
    data.stat_data.角色 = newChars;
    data.stat_data[MIGRATED_FLAG] = true;
    const ok = await writeMvuLatest(data.stat_data);
    if (ok) { toast('AI 辅助迁移完成', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
  }

  function cloneCharWithResetQuota(src, now, noReset) {
    const clone = JSON.parse(JSON.stringify(src));
    if (noReset) return clone;
    if (!clone._quota || typeof clone._quota !== 'object') clone._quota = {};
    const q = clone._quota;
    q.好感度周上限已用 = 0;
    q.周上限起始 = now;
    q.R阶段门 = false;
    q.下次暗掷 = now;
    q.玩家本周已掷 = false;
    q.玩家冷却至 = now;
    q.表白期冷却至 = '';
    q._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
    q._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 };
    q._timelineCompleted = [];
    if (q._playerConfession === undefined) q._playerConfession = false;
    if (q._firstMeetDone === undefined) q._firstMeetDone = false;
    return clone;
  }


  function openUnifiedAdaptDialog(panel) {
    const data = readMvuLatest(); const statData = data && data.stat_data; const chars = statData && statData.角色;
    const cardMode = getCardMode(); const validNames = [];
    if (chars && typeof chars === 'object') { for (const n in chars) { if (!isCharSkeleton(chars[n])) validNames.push(n); } }
    const hasValidVars = validNames.length > 0;
    let detectHtml = '';
    if (hasValidVars) detectHtml = '<div style="padding:10px 12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);border-radius:9px;color:#6ee7b7;font-size:11.5px;line-height:1.7;margin-bottom:12px;"><b>✔ 这个对话已经有角色档案了</b>：' + validNames.join('、') + '<br><span style="color:#a7f3d0;">档案正常的话，直接点右上角关掉就行。</span></div>';
    else detectHtml = '<div style="padding:10px 12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.35);border-radius:9px;color:#7dd3fc;font-size:11.5px;line-height:1.7;margin-bottom:12px;"><b>ℹ️ 这个对话还没有角色档案</b><br>现在建一份就好。卡组模式：<b>' + (cardMode === 'multi' ? '多人卡（好几个角色）' : '单人卡（一个角色）') + '</b></div>';
    const html = detectHtml +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button id="moon-adapt-adaptive" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(56,189,248,0.6);background:linear-gradient(135deg,#0c2540,#075985);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">🌅 AI 智能建档　👈 点这个就行<div style="font-size:10.5px;font-weight:400;color:#a5f3fc;margin-top:4px;">AI 把聊天记录读一遍，自动建好角色档案。<br>第一次玩、或者老对话第一次装这个插件，都点它。</div></button>' +
      '<button id="moon-adapt-migrate" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(251,191,36,0.6);background:linear-gradient(135deg,#2a1a05,#78350f);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">🔄 兼容迁移<div style="font-size:10.5px;font-weight:400;color:#fcd34d;margin-top:4px;">只有一种情况用它：你以前装过旧版本，旧数值搬不过来。</div></button>' +
      '<button id="moon-adapt-aimig" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(168,85,247,0.6);background:linear-gradient(135deg,#2a1040,#4c1d95);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">🤖 AI 辅助迁移<div style="font-size:10.5px;font-weight:400;color:#e9d5ff;margin-top:4px;">角色表里堆了很多乱七八糟的条目，让 AI 判断哪个留、哪个删。</div></button>' +
      '<button id="moon-adapt-pack" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(110,231,183,0.6);background:linear-gradient(135deg,#052e20,#064e3b);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;text-align:left;">📦 打包迁移到新对话<div style="font-size:10.5px;font-weight:400;color:#6ee7b7;margin-top:4px;">想把档案搬到另一个聊天窗口继续玩，就用它。</div></button>' +
      '</div>';
    showModalDialog('🚀 开局适配 · 点第一个就行', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-adapt-adaptive').addEventListener('click', function() { try { mask.remove(); } catch (e) {} manualAdaptiveOpening(panel); });
        mask.querySelector('#moon-adapt-migrate').addEventListener('click', function() { try { mask.remove(); } catch (e) {} manualMigrate(panel); });
        mask.querySelector('#moon-adapt-aimig').addEventListener('click', function() { try { mask.remove(); } catch (e) {} openAiMigrateEntryDialog(panel); });
        mask.querySelector('#moon-adapt-pack').addEventListener('click', function() { try { mask.remove(); } catch (e) {} startMigrationPack(panel); });
      }
    });
  }

  function manualAdaptiveOpening(panel) {
    const cardMode = getCardMode(); let charName = '';
    const data = readMvuLatest(); const chars = data && data.stat_data && data.stat_data.角色;
    if (chars && typeof chars === 'object') {
      const validNames = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
      if (validNames.length > 0) charName = validNames[0];
    }
    if (!charName && cardMode !== 'multi') {
      try { const ctx = getSTCtx(); if (ctx && ctx.characters && ctx.characterId != null) { const ch = ctx.characters[ctx.characterId]; if (ch && ch.name) charName = String(ch.name).replace(/[。\.]+$/, '').trim(); } } catch (e) {}
    }
    showAdaptiveStartDialog(charName || '(多人卡)');
  }
  /* ───────────────────────────────────────────────────────── */
