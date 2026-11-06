  function onMessageDeletedOrSwiped() {
    // Galgame 层：清掉越界分页进度并刷新展示（不改聊天记录）
    setTimeout(function() { try { onGalMessageMutated(); } catch (e) {} }, 120);
    setTimeout(function() {
      // 只看锚点是否存在，不看当前好感度：锁一旦落下就不会因为「刷回正数」而失效
      const anchor = loadAnchor(); if (!anchor) return;
      injectFateCollapse(anchor);
      pendingCollapseNotice = true;
      toast('时空已被锚定，还请接受现实。', 'warning');
    }, 300);
  }

  function getUserBioLibrary() {
    try { const raw = mainWin.localStorage.getItem(USER_BIO_LIBRARY_KEY); if (raw) { const parsed = JSON.parse(raw); if (parsed && parsed.userBios && typeof parsed.userBios === 'object') return parsed; } } catch (e) {}
    return { version: 1, userBios: {} };
  }
  function saveUserBioLibrary(lib) {
    try { mainWin.localStorage.setItem(USER_BIO_LIBRARY_KEY, JSON.stringify(lib)); return true; } catch (e) { return false; }
  }
  function genUserBioId() { return 'ubio_' + Date.now() + '_' + Math.floor(Math.random() * 100000); }
  function getEnabledUserBio() {
    try {
      const lib = getUserBioLibrary();
      const enabled = Object.values(lib.userBios || {}).filter(function(b) { return b && b.enabled === true && b.versions && b.versions.current && b.versions.current.content; });
      if (enabled.length === 0) return null;
      enabled.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      return enabled[0];
    } catch (e) { return null; }
  }
  function collectCurrentPlayerPersona() {
    const ctx = getSTCtx();
    let name = ''; let persona = '';
    try { name = (ctx && (ctx.name1 || ctx.name)) || ''; } catch (e) {}
    function _pickString(v) { if (!v) return ''; if (typeof v === 'string') return v; if (typeof v === 'object') return String(v.description || v.persona || v.value || ''); return ''; }
    try {
      if (ctx) {
        if (!persona && ctx.personas && ctx.user_avatar) { const cand = _pickString(ctx.personas[ctx.user_avatar]); if (cand && cand.trim()) persona = cand; }
        if (!persona && ctx.personas && typeof ctx.personas === 'object') { for (const k in ctx.personas) { const cand = _pickString(ctx.personas[k]); if (cand && cand.trim()) { persona = cand; break; } } }
        if (!persona && ctx.powerUser) { const cand = _pickString(ctx.powerUser.persona) || _pickString(ctx.powerUser.persona_description); if (cand && cand.trim()) persona = cand; }
        if (!persona) { const cand = _pickString(ctx.persona); if (cand && cand.trim()) persona = cand; }
        if (!persona && ctx.power_user) { const cand = _pickString(ctx.power_user.persona) || _pickString(ctx.power_user.persona_description); if (cand && cand.trim()) persona = cand; }
      }
      if (!persona && mainWin.power_user) { const cand = _pickString(mainWin.power_user.persona) || _pickString(mainWin.power_user.persona_description); if (cand && cand.trim()) persona = cand; }
      if (!persona) { try { const el = mainDoc.getElementById('persona_description'); if (el && el.value) persona = String(el.value); } catch (e) {} }
      if (!persona) { try { const boxes = mainDoc.querySelectorAll('#persona_management textarea, #user-settings-block textarea, .persona_description textarea'); for (let i = 0; i < boxes.length; i++) { const v = String(boxes[i].value || '').trim(); if (v) { persona = v; break; } } } catch (e) {} }
    } catch (e) {}
    return { name: name || '(未命名玩家)', persona: String(persona || '').trim() };
  }

  function injectUserBio() {
    try {
      const bio = getEnabledUserBio();
      if (!bio || !bio.versions || !bio.versions.current) { callSetPrompt(USER_BIO_PROMPT_KEY, '', 0, 0, false); return null; }
      const content = String(bio.versions.current.content || '').trim();
      if (!content) { callSetPrompt(USER_BIO_PROMPT_KEY, '', 0, 0, false); return null; }
      const lines = [];
      lines.push('═══════════════════════════════════');
      lines.push('👤【最高优先级 · 玩家角色演出覆盖】');
      lines.push('本卡已启用「玩家角色小抄」。{{user}} 的演绎请完全以下方小抄为准。');
      lines.push('忽略 SillyTavern Persona 面板中的 {{user}} 设定（如有）。');
      lines.push('如遇任何冲突，一律以本小抄为准。');
      lines.push('（注：本轮剧情中其他设定（角色卡、世界书、预设等）不受本小抄影响，照常生效。）');
      lines.push(''); lines.push(content); lines.push('═══════════════════════════════════');
      callSetPrompt(USER_BIO_PROMPT_KEY, lines.join('\n'), 4, 1, false);
      return bio;
    } catch (e) { console.warn('[Doki] 玩家小抄注入失败：', e); return null; }
  }
  /* ───────────────────────────────────────────────────────── */
  function hasBioForCurrentCard() {
    try {
      const cardName = getCurrentCardName();
      if (!cardName || cardName === '(未知卡牌)') return [];
      const lib = getBioLibrary();
      return Object.values(lib.bios || {}).filter(function(b) { return b && b.cardName === cardName && b.versions && b.versions.current; });
    } catch (e) { return []; }
  }
  function markBioAskedForCurrentChat() {
    try {
      const info = getCurrentChatInfo();
      const key = (info.chatId || '') + '|' + (info.avatar || '');
      if (!key || key === '|') return;
      const raw = mainWin.localStorage.getItem(BIO_ASKED_CHATS_KEY);
      let list = [];
      try { list = JSON.parse(raw) || []; } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      if (list.indexOf(key) < 0) { list.push(key); if (list.length > 200) list = list.slice(-200); mainWin.localStorage.setItem(BIO_ASKED_CHATS_KEY, JSON.stringify(list)); }
    } catch (e) {}
  }
  function hasBioBeenAskedForCurrentChat() {
    try {
      const info = getCurrentChatInfo();
      const key = (info.chatId || '') + '|' + (info.avatar || '');
      if (!key || key === '|') return true;
      const raw = mainWin.localStorage.getItem(BIO_ASKED_CHATS_KEY);
      if (!raw) return false;
      const list = JSON.parse(raw) || [];
      return Array.isArray(list) && list.indexOf(key) >= 0;
    } catch (e) { return true; }
  }

  function checkAndPromptBioEnable() {
    try {
      if (mainDoc.getElementById('moon-modal-mask')) return;
      if (hasBioBeenAskedForCurrentChat()) return;
      const bios = hasBioForCurrentCard();
      if (bios.length === 0) return;
      const byChar = {};
      bios.forEach(function(b) { const n = b.charName || '(未命名)'; if (!byChar[n]) byChar[n] = []; byChar[n].push(b); });
      const rows = Object.keys(byChar).map(function(charName) {
        const list = byChar[charName];
        list.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        const anyEnabled = list.some(function(b) { return b.enabled === true; });
        const preview = list[0].versions && list[0].versions.current ? String(list[0].versions.current.content).substring(0, 50) : '';
        return '<label style="display:block;padding:10px 12px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:6px;cursor:pointer;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
          '<input type="checkbox" class="moon-bio-ask-check" data-char="' + charName.replace(/"/g, '&quot;') + '"' + (anyEnabled ? ' checked' : '') + '>' +
          '<span style="font-size:12.5px;font-weight:600;color:#f8fafc;">' + charName.replace(/</g, '&lt;') + '</span>' +
          (list.length > 1 ? '<span style="font-size:10px;color:#94a3b8;">共 ' + list.length + ' 份</span>' : '') +
          (anyEnabled ? '<span style="font-size:10px;color:#6ee7b7;margin-left:auto;">● 启用中</span>' : '<span style="font-size:10px;color:#94a3b8;margin-left:auto;">○ 未启用</span>') +
          '</div><div style="font-size:10.5px;color:#64748b;line-height:1.5;padding-left:22px;">' + preview.replace(/</g, '&lt;') + '……</div></label>';
      }).join('');
      const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">检测到本卡有角色小抄。勾选表示"启用"，AI 会在剧情里按小抄来演绎这个角色。<br><span style="color:#fbbf24;">启用同角色的新小抄会自动停用旧的。</span></div>' +
        '<div style="max-height:44dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>';
      showModalDialogCancelable('📖 本卡有角色小抄', html,
        function() {
          const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
          const lib = getBioLibrary(); const enabledChars = []; const disabledChars = [];
          mask.querySelectorAll('.moon-bio-ask-check').forEach(function(ck) { const charName = ck.getAttribute('data-char'); if (ck.checked) enabledChars.push(charName); else disabledChars.push(charName); });
          enabledChars.forEach(function(charName) {
            const list = byChar[charName]; if (!list || !list.length) return;
            list.forEach(function(b, i) { const target = lib.bios[b.id]; if (!target) return; target.enabled = (i === 0); target.updatedAt = Date.now(); });
          });
          disabledChars.forEach(function(charName) {
            const list = byChar[charName]; if (!list) return;
            list.forEach(function(b) { const target = lib.bios[b.id]; if (target) { target.enabled = false; target.updatedAt = Date.now(); } });
          });
          saveBioLibrary(lib); markBioAskedForCurrentChat();
          try { mask.remove(); } catch (e) {}
          toast('已更新角色小抄启用状态', 'success'); try { refreshPanel(); } catch (e) {}
        },
        function() { markBioAskedForCurrentChat(); toast('稍后可以到「📚 角色小抄库」里手动启用', 'info'); },
        { confirmText: '保存选择', cancelText: '稍后再说' });
    } catch (e) { console.warn('[Doki] 开窗询问失败：', e); }
  }

  function batchSetBioEnabled(ids, enable) {
    if (!Array.isArray(ids) || !ids.length) return;
    const lib = getBioLibrary();
    if (enable) {
      const targets = [];
      ids.forEach(function(id) { const b = lib.bios[id]; if (b) targets.push({ cardName: b.cardName || '', charName: b.charName || '' }); });
      Object.values(lib.bios).forEach(function(b) { if (!b) return; const key = (b.cardName || '') + '|' + (b.charName || ''); if (targets.some(function(t) { return (t.cardName + '|' + t.charName) === key; })) b.enabled = false; });
      ids.forEach(function(id) { const b = lib.bios[id]; if (b) { b.enabled = true; b.updatedAt = Date.now(); } });
    } else {
      ids.forEach(function(id) { const b = lib.bios[id]; if (b) { b.enabled = false; b.updatedAt = Date.now(); } });
    }
    saveBioLibrary(lib);
    toast(enable ? '已启用 ' + ids.length + ' 份' : '已停用 ' + ids.length + ' 份', 'success');
  }

  function injectEnabledBios() {
    try {
      const cardName = getCurrentCardName();
      if (!cardName || cardName === '(未知卡牌)') { callSetPrompt(PROMPT_KEY + '_bio', '', 0, 0, false); return null; }
      const lib = getBioLibrary();
      const enabledBios = Object.values(lib.bios || {}).filter(function(b) { return b && b.enabled === true && b.cardName === cardName && b.versions && b.versions.current && b.versions.current.content; });
      if (enabledBios.length === 0) { callSetPrompt(PROMPT_KEY + '_bio', '', 0, 0, false); return { count: 0, charNames: [] }; }
      const byChar = {};
      enabledBios.forEach(function(b) { const n = String(b.charName || '').trim(); if (!n) return; if (!byChar[n] || (b.updatedAt || 0) > (byChar[n].updatedAt || 0)) byChar[n] = b; });
      const charNames = Object.keys(byChar);
      if (charNames.length === 0) { callSetPrompt(PROMPT_KEY + '_bio', '', 0, 0, false); return { count: 0, charNames: [] }; }
      const lines = [];
      lines.push('═══════════════════════════════════');
      lines.push('📖【最高优先级 · 角色演出覆盖】');
      lines.push('本卡已启用「角色小抄」。以下角色的演绎请完全以小抄为准。');
      lines.push('忽略角色卡描述、性格、场景、世界观条目里关于这些角色的所有原设定。');
      lines.push('如遇任何冲突，一律以小抄为准，不得参考原设定。');
      lines.push('');
      charNames.forEach(function(n) { const content = String(byChar[n].versions.current.content || '').trim(); lines.push('【' + n + '】'); lines.push(content); lines.push(''); });
      lines.push('═══════════════════════════════════');
      callSetPrompt(PROMPT_KEY + '_bio', lines.join('\n'), 4, 1, false);
      return { count: charNames.length, charNames: charNames };
    } catch (e) { console.warn('[Doki] 小抄注入失败：', e); return null; }
  }

  function getCurrentBioStatus() {
    try {
      const cardName = getCurrentCardName();
      if (!cardName || cardName === '(未知卡牌)') return { count: 0, charNames: [] };
      const lib = getBioLibrary();
      const enabled = Object.values(lib.bios || {}).filter(function(b) { return b && b.enabled === true && b.cardName === cardName; });
      const nameSet = {};
      enabled.forEach(function(b) { const n = String(b.charName || '').trim(); if (n) nameSet[n] = true; });
      const charNames = Object.keys(nameSet);
      return { count: charNames.length, charNames: charNames };
    } catch (e) { return { count: 0, charNames: [] }; }
  }

  function openEditBioDialog(id, panel) {
    const lib = getBioLibrary();
    const b = lib.bios[id];
    if (!b) { toast('找不到这份小抄', 'warning'); return; }
if (!b.versions) b.versions = {};
if (!b.versions.current) {
  b.versions.current = {
    content: b.versions.original ? b.versions.original.content : '（空白小抄，请在此输入）',
    generatedAt: Date.now(), rValue: null, wordLimit: b.wordLimit || 260
  };
}
    const currentContent = String(b.versions.current.content || '');
    const wordLimit = b.wordLimit || 260;
    const history = (b.versions && Array.isArray(b.versions.history)) ? b.versions.history : [];
    const html = '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">字数：<span id="moon-bio-edit-count" style="color:#7dd3fc;font-weight:600;">' + currentContent.length + '</span> / ' + wordLimit + '</div>' +
      '<textarea id="moon-bio-edit-textarea" style="width:100%;box-sizing:border-box;min-height:220px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + currentContent.replace(/</g, '&lt;') + '</textarea>' +
      (history.length > 0 ? '<div style="margin-top:10px;border-top:1px dashed rgba(148,163,184,0.15);padding-top:8px;"><div style="font-size:10.5px;color:#c084fc;font-weight:600;margin-bottom:6px;">📜 历史版本（' + history.length + ' 个）</div>' +
        history.slice().reverse().map(function(h, i) {
          const idxNum = history.length - i;
          const timeAgo = (function() { const diff = Date.now() - (h.generatedAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
          return '<details style="margin-bottom:4px;"><summary style="cursor:pointer;font-size:10.5px;color:#94a3b8;padding:4px 0;">v' + idxNum + ' · ' + timeAgo + ' · R=' + (h.rValue !== null && h.rValue !== undefined ? h.rValue : '?') + '</summary>' +
            '<textarea readonly style="width:100%;box-sizing:border-box;min-height:80px;padding:8px;margin-top:4px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#22262f;color:#94a3b8;font-size:10.5px;line-height:1.6;font-family:inherit;resize:vertical;">' + String(h.content || '').replace(/</g, '&lt;') + '</textarea></details>';
        }).join('') + '</div>' : '') +
      '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">编辑只修改「当前版本」；原始备份不受影响。</div>';
    showModalDialogCancelable('✏️ 编辑角色小抄 · ' + String(b.charName || '未命名').replace(/</g, '&lt;'), html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const ta = mask ? mask.querySelector('#moon-bio-edit-textarea') : null;
        if (!ta) return;
        const newContent = String(ta.value || '').trim();
        if (!newContent) { toast('内容不能为空', 'warning'); return; }
        b.versions.current.content = newContent;
        b.versions.current.generatedAt = Date.now();
        b.updatedAt = Date.now();
        saveBioLibrary(lib);
        try { mask.remove(); } catch (e) {}
        toast('已保存', 'success');
        setTimeout(function() { openBioLibraryDialog(panel); }, 300);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '保存', cancelText: '取消',
        onOpen: function(mask) {
          const ta = mask.querySelector('#moon-bio-edit-textarea'); const counter = mask.querySelector('#moon-bio-edit-count');
          if (ta && counter) { ta.addEventListener('input', function() { const len = String(ta.value || '').length; counter.textContent = len; counter.style.color = len > wordLimit ? '#fca5a5' : '#7dd3fc'; }); }
        }
      });
  }
  /* ───────────────────────────────────────────────────────── */
  function openBioLibraryDialog(panel) {
    const lib = getBioLibrary();
    const bios = Object.values(lib.bios || {});
    if (bios.length === 0) {
      showModalDialog('📚 角色小抄库',
        '<div style="color:#94a3b8;">角色小抄库为空。</div>' +
        '<div style="margin-top:8px;font-size:11px;color:#64748b;">先到主面板点「🎬 角色试镜」生成一份试试。</div>',
        null, { confirmText: '关闭' });
      return;
    }
    bios.sort(function(a, b) {
      if ((b.enabled ? 1 : 0) !== (a.enabled ? 1 : 0)) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0);
      const ca = String(a.charName || '').localeCompare(String(b.charName || ''));
      if (ca !== 0) return ca;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    const rows = bios.map(function(b) {
      const current = b.versions && b.versions.current ? b.versions.current.content : '';
      const original = b.versions && b.versions.original ? b.versions.original.content : '';
      const preview = String(current).substring(0, 80);
      const hasAudition = !!(b.audition && b.audition.latest);
      const wordCount = String(current).length;
      const enabled = b.enabled === true;
      const hasOriginal = !!original && original !== current;
      const history = (b.versions && Array.isArray(b.versions.history)) ? b.versions.history : [];
      const timeAgo = (function() { const diff = Date.now() - (b.updatedAt || b.createdAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
      return '<div class="moon-bio-card" data-id="' + b.id + '" style="margin-bottom:10px;background:#171a22;border:1px solid ' + (enabled ? 'rgba(110,231,183,0.4)' : 'rgba(251,191,36,0.35)') + ';border-radius:10px;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(148,163,184,0.08);">' +(!enabled ? '<div style="padding:5px 12px;background:rgba(251,191,36,0.08);color:#fbbf24;font-size:10px;border-bottom:1px solid rgba(251,191,36,0.2);">⚠️ 未启用 · 不影响查看/编辑/删除，点击右上角圆点或「启用所选」才会应用此小抄</div>' : '') +
        '<input type="checkbox" class="moon-bio-lib-check" data-id="' + b.id + '" style="flex-shrink:0;">' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:12.5px;font-weight:600;color:#f8fafc;">' + String(b.charName || '未命名').replace(/</g, '&lt;') + '</span>' +
        '<span class="moon-bio-toggle" data-id="' + b.id + '" style="font-size:10px;padding:1px 7px;border-radius:10px;cursor:pointer;' + (enabled ? 'color:#6ee7b7;background:rgba(16,185,129,0.15);' : 'color:#94a3b8;background:rgba(148,163,184,0.1);') + '">' + (enabled ? '● 启用' : '○ 未启用') + '</span>' +
        '</div><div style="font-size:10px;color:#64748b;margin-top:2px;">' + String(b.cardName || '(未知卡)').replace(/</g, '&lt;') + ' · ' + wordCount + '字 · ' + timeAgo + (hasAudition ? ' · 🎬 已试镜' : '') + '</div></div>' +
        '<button class="moon-bio-expand" data-id="' + b.id + '" style="flex-shrink:0;background:transparent;border:none;color:#94a3b8;font-size:14px;cursor:pointer;padding:4px 6px;border-radius:6px;" title="展开原始版本">▼</button></div>' +
        '<div style="padding:10px 12px;font-size:11px;color:#cbd5e1;line-height:1.6;">' + preview.replace(/</g, '&lt;') + (current.length > 80 ? '……' : '') + '</div>' +
        '<div style="display:flex;gap:6px;padding:8px 12px;border-top:1px solid rgba(148,163,184,0.08);background:rgba(15,23,42,0.3);">' +
        '<button class="moon-bio-view-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;">👁 查看</button>' +
        '<button class="moon-bio-edit-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;">✏️ 编辑</button>' +
        '<button class="moon-bio-del-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:10.5px;cursor:pointer;font-family:inherit;">🗑 删除</button></div>' +
        '<div class="moon-bio-original" data-id="' + b.id + '" style="display:none;padding:10px 12px;border-top:1px dashed rgba(148,163,184,0.15);background:rgba(15,23,42,0.5);">' +
        (hasOriginal
          ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><div style="font-size:10.5px;color:#fbbf24;font-weight:600;">📌 初始版本（玩家确认的那份）</div>' +
            '<button class="moon-bio-del-original" data-id="' + b.id + '" style="padding:3px 8px;border-radius:6px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:9.5px;cursor:pointer;font-family:inherit;">删除原始版本</button></div>' +
            '<textarea readonly style="width:100%;box-sizing:border-box;min-height:100px;padding:8px 10px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#22262f;color:#94a3b8;font-size:10.5px;line-height:1.6;font-family:inherit;resize:vertical;">' + String(original).replace(/</g, '&lt;') + '</textarea>'
          : '<div style="font-size:10.5px;color:#64748b;text-align:center;padding:6px;">（初始版本与当前版本一致）</div>') +
        (history.length > 0
          ? '<div style="margin-top:10px;border-top:1px dashed rgba(148,163,184,0.15);padding-top:8px;"><div style="font-size:10.5px;color:#c084fc;font-weight:600;margin-bottom:6px;">📜 历史版本（' + history.length + ' 个）</div>' +
            history.slice().reverse().map(function(h, i) {
              const idxNum = history.length - i;
              const timeAgo = (function() { const diff = Date.now() - (h.generatedAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
              return '<details style="margin-bottom:4px;"><summary style="cursor:pointer;font-size:10.5px;color:#94a3b8;padding:4px 0;">v' + idxNum + ' · ' + timeAgo + ' · R=' + (h.rValue !== null && h.rValue !== undefined ? h.rValue : '?') + '</summary>' +
                '<textarea readonly style="width:100%;box-sizing:border-box;min-height:80px;padding:8px;margin-top:4px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#22262f;color:#94a3b8;font-size:10.5px;line-height:1.6;font-family:inherit;resize:vertical;">' + String(h.content || '').replace(/</g, '&lt;') + '</textarea></details>';
            }).join('') + '</div>' : '') +
        '</div></div>';
    }).join('');
    const html = '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' +
      '<button id="moon-bio-selectall" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">全选 / 全不选</button>' +
      '<button id="moon-bio-batch-enable" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(16,185,129,0.4);background:#052e20;color:#6ee7b7;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">启用所选</button>' +
      '<button id="moon-bio-batch-disable" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#1e293b;color:#cbd5e1;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">停用所选</button>' +
      '<button id="moon-bio-batch-del" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;">删除所选</button></div>' +
      '<div style="max-height:52dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>';
    showModalDialog('📚 角色小抄库', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        function collectCheckedIds() { const ids = []; mask.querySelectorAll('.moon-bio-lib-check').forEach(function(ck) { if (ck.checked) ids.push(ck.getAttribute('data-id')); }); return ids; }
        mask.querySelector('#moon-bio-selectall').addEventListener('click', function() { const all = mask.querySelectorAll('.moon-bio-lib-check'); const allChecked = Array.from(all).every(function(c) { return c.checked; }); all.forEach(function(c) { c.checked = !allChecked; }); });
        mask.querySelector('#moon-bio-batch-enable').addEventListener('click', function() { const ids = collectCheckedIds(); if (!ids.length) { toast('未勾选任何小抄', 'info'); return; } batchSetBioEnabled(ids, true); try { mask.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); });
        mask.querySelector('#moon-bio-batch-disable').addEventListener('click', function() { const ids = collectCheckedIds(); if (!ids.length) { toast('未勾选任何小抄', 'info'); return; } batchSetBioEnabled(ids, false); try { mask.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); });
        mask.querySelector('#moon-bio-batch-del').addEventListener('click', function() {
          const ids = collectCheckedIds(); if (!ids.length) { toast('未勾选任何小抄', 'info'); return; }
          showModalDialogCancelable('🗑 确认删除', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除 <b>' + ids.length + '</b> 份角色小抄（包含各自的原始备份），删除后无法恢复。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
            function() { const lib2 = getBioLibrary(); ids.forEach(function(id) { delete lib2.bios[id]; }); saveBioLibrary(lib2); toast('已删除 ' + ids.length + ' 份', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); },
            function() { toast('已取消', 'info'); },
            { confirmText: '确认删除', cancelText: '取消' });
        });
        mask.querySelectorAll('.moon-bio-toggle').forEach(function(tg) {
          tg.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = tg.getAttribute('data-id'); const b = lib.bios[id]; if (!b) return;
            batchSetBioEnabled([id], b.enabled !== true);
            try { mask.remove(); } catch (e) {}
            setTimeout(function() { openBioLibraryDialog(panel); }, 300);
          });
        });
        mask.querySelectorAll('.moon-bio-expand').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id'); const box = mask.querySelector('.moon-bio-original[data-id="' + id + '"]'); if (!box) return;
            const isOpen = box.style.display !== 'none';
            box.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '▼' : '▲';
          });
        });
mask.querySelectorAll('.moon-bio-view-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const id = btn.getAttribute('data-id');
    const currentLib = getBioLibrary(); // 实时读取，避免快照
    const b = currentLib.bios[id];
    if (!b) { toast('找不到这份小抄', 'warning'); return; }
    if (!b.versions) b.versions = {};
    const content = (b.versions.current && b.versions.current.content)
      ? b.versions.current.content
      : (b.versions.original && b.versions.original.content)
        ? b.versions.original.content
        : '（暂无内容）';
    const aud = b.audition && b.audition.latest ? b.audition.latest.content : '';
    showModalDialog('👁 ' + String(b.charName || '未命名').replace(/</g, '&lt;'),
      '<div style="font-size:10.5px;color:' + (b.enabled ? '#6ee7b7' : '#fbbf24') + ';margin-bottom:4px;">' +
        (b.enabled ? '● 已启用' : '○ 未启用（仅查看，不影响编辑）') + '</div>' +
      '<textarea readonly style="width:100%;box-sizing:border-box;min-height:180px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(content).replace(/</g, '&lt;') + '</textarea>' +
      (aud ? '<div style="font-size:10.5px;color:#94a3b8;margin:10px 0 4px 0;">🎬 最近一次试镜片段</div>' +
        '<textarea readonly style="width:100%;box-sizing:border-box;min-height:100px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(aud).replace(/</g, '&lt;') + '</textarea>' : ''),
      null, { confirmText: '关闭' });
  });
});
        mask.querySelectorAll('.moon-bio-edit-btn').forEach(function(btn) { btn.addEventListener('click', function(e) { e.stopPropagation(); openEditBioDialog(btn.getAttribute('data-id'), panel); }); });
        mask.querySelectorAll('.moon-bio-del-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id'); const b = lib.bios[id];
            showModalDialogCancelable('🗑 确认删除', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除角色小抄：<b>' + String(b.charName || '未命名').replace(/</g, '&lt;') + '</b><br>包含原始备份，删除后无法恢复。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
              function() { delete lib.bios[id]; saveBioLibrary(lib); toast('已删除', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); },
              function() { toast('已取消', 'info'); },
              { confirmText: '确认删除', cancelText: '取消' });
          });
        });
        mask.querySelectorAll('.moon-bio-del-original').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id'); const b = lib.bios[id];
            if (!b || !b.versions || !b.versions.original) return;
            showModalDialogCancelable('🗑 删除原始版本', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除角色小抄的原始备份。<br>当前版本不受影响，仍然可以正常使用和编辑。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
              function() { b.versions.original = { content: b.versions.current.content, generatedAt: Date.now(), rValue: null, wordLimit: b.wordLimit || 260 }; b.updatedAt = Date.now(); saveBioLibrary(lib); toast('已删除原始备份', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openBioLibraryDialog(panel); }, 300); },
              function() { toast('已取消', 'info'); },
              { confirmText: '确认删除', cancelText: '取消' });
          });
        });
      }
    });
  }
  /* ───────────────────────────────────────────────────────── */
  function openUserBioLibraryDialog(panel) {
    const lib = getUserBioLibrary();
    const userBios = Object.values(lib.userBios || {});
    if (userBios.length === 0) {
      showModalDialog('👤 玩家小抄库',
        '<div style="color:#94a3b8;">玩家小抄库为空。</div>' +
        '<div style="margin-top:8px;font-size:11px;color:#64748b;">先到主面板点「👤 玩家小抄」生成一份试试。</div>',
        null, { confirmText: '关闭' });
      return;
    }
    userBios.sort(function(a, b) {
      if ((b.enabled ? 1 : 0) !== (a.enabled ? 1 : 0)) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0);
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    const rows = userBios.map(function(b) {
      const current = b.versions && b.versions.current ? b.versions.current.content : '';
      const preview = String(current).substring(0, 80);
      const wordCount = String(current).length;
      const enabled = b.enabled === true;
      const timeAgo = (function() { const diff = Date.now() - (b.updatedAt || b.createdAt || 0); const days = Math.floor(diff / 86400000); if (days >= 1) return days + '天前'; const hours = Math.floor(diff / 3600000); if (hours >= 1) return hours + '小时前'; return '刚刚'; })();
      return '<div class="moon-ubio-card" data-id="' + b.id + '" style="margin-bottom:10px;background:#171a22;border:1px solid ' + (enabled ? 'rgba(110,231,183,0.4)' : 'rgba(148,163,184,0.15)') + ';border-radius:10px;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(148,163,184,0.08);">' +
        '<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:12.5px;font-weight:600;color:#f8fafc;">' + String(b.userName || '未命名玩家').replace(/</g, '&lt;') + '</span>' +
        '<span class="moon-ubio-toggle" data-id="' + b.id + '" style="font-size:10px;padding:1px 7px;border-radius:10px;cursor:pointer;' + (enabled ? 'color:#6ee7b7;background:rgba(16,185,129,0.15);' : 'color:#94a3b8;background:rgba(148,163,184,0.1);') + '">' + (enabled ? '● 启用' : '○ 未启用') + '</span>' +
        '</div><div style="font-size:10px;color:#64748b;margin-top:2px;">' + String(b.cardName || '(未知卡)').replace(/</g, '&lt;') + ' · ' + wordCount + '字 · ' + timeAgo + '</div></div></div>' +
        '<div style="padding:10px 12px;font-size:11px;color:#cbd5e1;line-height:1.6;">' + preview.replace(/</g, '&lt;') + (current.length > 80 ? '……' : '') + '</div>' +
        '<div style="display:flex;gap:6px;padding:8px 12px;border-top:1px solid rgba(148,163,184,0.08);background:rgba(15,23,42,0.3);">' +
        '<button class="moon-ubio-view-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);background:#0c2540;color:#7dd3fc;font-size:10.5px;cursor:pointer;font-family:inherit;">👁 查看</button>' +
        '<button class="moon-ubio-edit-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(168,85,247,0.4);background:#2a1040;color:#c084fc;font-size:10.5px;cursor:pointer;font-family:inherit;">✏️ 编辑</button>' +
        '<button class="moon-ubio-del-btn" data-id="' + b.id + '" style="flex:1;padding:6px;border-radius:6px;border:1px solid rgba(239,68,68,0.4);background:#2a0a10;color:#fca5a5;font-size:10.5px;cursor:pointer;font-family:inherit;">🗑 删除</button></div></div>';
    }).join('');
    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">同时间只允许启用 1 份玩家小抄。启用新小抄会自动停用旧的。</div>' +
      '<div style="max-height:56dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>';
    showModalDialog('👤 玩家小抄库', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelectorAll('.moon-ubio-toggle').forEach(function(tg) {
          tg.addEventListener('click', function() {
            const id = tg.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const target = lib2.userBios[id];
            if (!target) return;
            const enable = target.enabled !== true;
            if (enable) { Object.values(lib2.userBios || {}).forEach(function(x) { if (x) { x.enabled = false; x.updatedAt = Date.now(); } }); target.enabled = true; target.updatedAt = Date.now(); }
            else { target.enabled = false; target.updatedAt = Date.now(); }
            saveUserBioLibrary(lib2); toast(enable ? '已启用' : '已停用', 'success');
            try { mask.remove(); } catch (e) {}
            setTimeout(function() { openUserBioLibraryDialog(panel); }, 300);
          });
        });
        mask.querySelectorAll('.moon-ubio-view-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const b = lib2.userBios[id];
            if (!b || !b.versions || !b.versions.current) return;
            const content = b.versions.current.content; const aud = b.audition && b.audition.latest ? b.audition.latest.content : '';
            showModalDialog('👁 ' + String(b.userName || '未命名玩家').replace(/</g, '&lt;'),
              '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">当前小传版本</div>' +
              '<textarea readonly style="width:100%;box-sizing:border-box;min-height:180px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(content).replace(/</g, '&lt;') + '</textarea>' +
              (aud ? '<div style="font-size:10.5px;color:#94a3b8;margin:10px 0 4px 0;">🎬 最近一次试镜片段</div>' +
                '<textarea readonly style="width:100%;box-sizing:border-box;min-height:100px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + String(aud).replace(/</g, '&lt;') + '</textarea>' : ''),
              null, { confirmText: '关闭' });
          });
        });
        mask.querySelectorAll('.moon-ubio-edit-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const b = lib2.userBios[id];
            if (!b || !b.versions || !b.versions.current) return;
            const currentContent = String(b.versions.current.content || '');
            showModalDialogCancelable('✏️ 编辑玩家小抄',
              '<textarea id="moon-ubio-edit-ta" style="width:100%;box-sizing:border-box;min-height:220px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + currentContent.replace(/</g, '&lt;') + '</textarea>',
              function() {
                const m2 = mainDoc.getElementById('moon-modal-mask'); const ta = m2 ? m2.querySelector('#moon-ubio-edit-ta') : null;
                if (!ta) return;
                const v = String(ta.value || '').trim(); if (!v) { toast('内容不能为空', 'warning'); return; }
                b.versions.current.content = v; b.versions.current.generatedAt = Date.now(); b.updatedAt = Date.now();
                saveUserBioLibrary(lib2); try { m2.remove(); } catch (e) {}
                toast('已保存', 'success'); setTimeout(function() { openUserBioLibraryDialog(panel); }, 300);
              },
              function() { toast('已取消', 'info'); },
              { confirmText: '保存', cancelText: '取消' });
          });
        });
        mask.querySelectorAll('.moon-ubio-del-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-id'); const lib2 = getUserBioLibrary(); const b = lib2.userBios[id];
            showModalDialogCancelable('🗑 确认删除', '<div style="font-size:12px;color:#fca5a5;line-height:1.7;">即将删除玩家小抄：<b>' + String(b && b.userName || '未命名').replace(/</g, '&lt;') + '</b><br>删除后无法恢复。<br><span style="color:#fbbf24;">确定继续吗？</span></div>',
              function() { delete lib2.userBios[id]; saveUserBioLibrary(lib2); toast('已删除', 'success'); const m2 = mainDoc.getElementById('moon-modal-mask'); try { if (m2) m2.remove(); } catch (e) {} setTimeout(function() { openUserBioLibraryDialog(panel); }, 300); },
              function() { toast('已取消', 'info'); },
              { confirmText: '确认删除', cancelText: '取消' });
          });
        });
      }
    });
  }

  function _ub_buildBioSys(wordLimit) {
    return ['你是一位剧本顾问。用户在扮演一个角色（玩家角色）。', '请根据用户提供的设定，提炼出一份「玩家角色灵魂小传」。', '输出 4 个板块，按顺序：', '[core personality] / [speech style] / [behavioral triggers] / [background hints]', '硬性要求：', '1. 不改变原设定中的身份、性别、称呼。', '2. 不虚构原设定没有的关键事实（如职业、亲属、重大经历）。', '3. 只做「提炼 + 强化演出感」，不替换设定。', '4. 总字数不超过 ' + wordLimit + ' 字。', '5. 只输出小传内容，不要 markdown、不要前言后记。'].join('\n');
  }
  function _ub_buildAuditionSys(scene, wordLimit) {
    return ['你是一位演员，扮演的是「玩家角色」。', '按灵魂小传演一段单人戏。', '场景：' + scene, '重点：第一人称内心戏 + 微反应 + 说话方式。', '不要替其他角色写动作或对白。', '不要写成读者视角的旁白，要沉浸在玩家角色的视角里。', '总字数不超过 ' + wordLimit + ' 字。'].join('\n');
  }
  function _ub_buildRevisionSys(feedback, wordLimit) {
    return ['用户对上一版玩家角色灵魂小传提出了修改意见：' + feedback, '请根据意见重写玩家角色灵魂小传。', '保留原有 4 板块结构：[core personality] / [speech style] / [behavioral triggers] / [background hints]', '总字数不超过 ' + wordLimit + ' 字。', '只输出修订后的小传内容。'].join('\n');
  }
  async function _ub_genBio(provider, wordLimit, useChat) {
    const personaData = collectCurrentPlayerPersona();
    if (!personaData.persona) throw new Error('当前 Persona 面板为空，请先在右侧填写玩家设定。');
    let chatHistory = '';
    if (useChat) {
      try {
        const ctx = getSTCtx();
        if (ctx && ctx.chat && ctx.chat.length) {
          const lines = []; let total = 0;
          for (let i = ctx.chat.length - 1; i >= 0 && total < 2400; i--) {
            const m = ctx.chat[i]; if (!m) continue;
            const role = m.is_user ? '玩家' : (personaData.name || '角色');
            let text = String(m.mes || '').replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '').replace(/<Commands>[\s\S]*?<\/Commands>/gi, '').replace(/<StatusPlaceHolderImpl\s*\/>/gi, '').trim();
            if (!text) continue;
            if (text.length > 800) text = text.slice(0, 800) + '……';
            lines.unshift('【' + role + '】' + text); total += text.length;
          }
          chatHistory = lines.join('\n\n');
        }
      } catch (e) {}
    }
    const sys = _ub_buildBioSys(wordLimit);
    const user = '【玩家名字】' + personaData.name + '\n\n【Persona 设定原文】\n' + personaData.persona + (chatHistory ? '\n\n【最近对话参考（仅供了解玩家说话方式）】\n' + chatHistory : '') + '\n\n请提炼玩家角色的灵魂小传。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }
  async function _ub_genAudition(provider, bio, scene, wordLimit) {
    const sys = _ub_buildAuditionSys(scene, wordLimit);
    const user = '【玩家角色灵魂小传】\n' + bio + '\n\n请开始你的单人演出。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }
  async function _ub_reviseBio(provider, oldBio, feedback, wordLimit) {
    const sys = _ub_buildRevisionSys(feedback, wordLimit);
    const user = '【当前小传】\n' + oldBio + '\n\n请输出修订后的小传。';
    const reply = await callOpeningModel(provider, sys, user);
    let text = String(reply || '').trim();
    const m = text.match(/```(?:[a-zA-Z]*)?\s*([\s\S]*?)```/); if (m) text = m[1].trim();
    return text;
  }

function getUpdateConfig() {
  try {
    const raw = mainWin.localStorage.getItem(UPDATE_CONFIG_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      const savedUrl = String(o.url || '').trim();
      const normalizedSavedUrl = savedUrl.replace(/[?#].*$/, '');
      const updateUrl = !savedUrl || normalizedSavedUrl === LEGACY_DEFAULT_UPDATE_URL
        ? DEFAULT_UPDATE_URL : savedUrl;
      return {
        url: updateUrl,
        autoCheck: o.autoCheck !== false,
        mirrorFallback: o.mirrorFallback !== false
      };
    }
  } catch (e) {}
  return { url: DEFAULT_UPDATE_URL, autoCheck: true, mirrorFallback: true };
}

function saveUpdateConfig(cfg) {
  try { mainWin.localStorage.setItem(UPDATE_CONFIG_KEY, JSON.stringify(cfg)); } catch (e) {}
}

// ─────────────────────────────────────────────────────────────
// 更新线路兜底：先走官方直连，直连不通才换国内镜像；全部失败给明确提示
// ─────────────────────────────────────────────────────────────
const UPDATE_DIRECT_TIMEOUT = 8000;   // 直连等待上限（超时即判定不通）
const UPDATE_MIRROR_TIMEOUT = 15000;  // 镜像等待上限
const UPDATE_TOTAL_BUDGET = 45000;    // 整条链路的总等待上限，超过就不再起新的线路
const UPDATE_LAST_GOOD_KEY = 'moon_phase_update_last_good_source';

function _updEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _updLastGoodSource() {
  try { return String(mainWin.localStorage.getItem(UPDATE_LAST_GOOD_KEY) || ''); } catch (e) { return ''; }
}

// 把各种 GitHub 直链还原成 owner/repo/branch/path，用于拼镜像地址
function _parseGithubSource(url) {
  const raw = String(url || '').trim().replace(/[?#].*$/, '');
  let m = raw.match(/^https?:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/i);
  if (m) return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
  m = raw.match(/^https?:\/\/cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@\/]+)@([^\/]+)\/(.+)$/i);
  if (m) return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
  m = raw.match(/^https?:\/\/raw\.gitmirror\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/i);
  if (m) return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
  m = raw.match(/^https?:\/\/(?:ghfast\.top|gh-proxy\.com|ghproxy\.net|gh-proxy\.net)\/https?:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/i);
  if (m) return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
  return null;
}

// 生成线路表：最近可用线路 → 官方直连 → 国内镜像（同一地址自动去重）
function buildUpdateSourceChain(primaryUrl, preferUrl) {
  const chain = [];
  const seen = {};
  function add(url, label, kind) {
    const u = String(url || '').trim();
    if (!u || seen[u]) return;
    seen[u] = 1;
    chain.push({ url: u, label: label, kind: kind });
  }
  const primary = String(primaryUrl || DEFAULT_UPDATE_URL).trim();
  const prefer = String(preferUrl || '').trim();
  if (prefer && prefer !== primary) add(prefer, '上次可用的线路', 'prefer');
  add(primary, '官方直连', 'direct');
  const gh = _parseGithubSource(primary);
  if (gh) {
    const base = gh.owner + '/' + gh.repo;
    const raw = 'https://raw.githubusercontent.com/' + base + '/' + gh.branch + '/' + gh.path;
    add('https://cdn.jsdelivr.net/gh/' + base + '@' + gh.branch + '/' + gh.path, '国内镜像 · jsDelivr', 'mirror');
    add('https://fastly.jsdelivr.net/gh/' + base + '@' + gh.branch + '/' + gh.path, '国内镜像 · jsDelivr Fastly', 'mirror');
    add('https://ghproxy.net/' + raw, '国内镜像 · ghproxy.net', 'mirror');
    add('https://gh-proxy.com/' + raw, '国内镜像 · gh-proxy', 'mirror');
  }
  return chain;
}

// 带超时的单线路下载：卡住不动也能在限定时间内放弃，避免永远转圈
async function fetchTextWithTimeout(url, timeoutMs, note) {
  const ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
  const limit = Math.max(3000, timeoutMs || UPDATE_DIRECT_TIMEOUT);
  let timer = null;
  if (ctrl) timer = setTimeout(function() { try { ctrl.abort(); } catch (e) {} }, limit);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined });
    if (!res) throw new Error('没有收到响应');
    if (!res.ok) throw new Error('HTTP ' + res.status + (res.status === 404 ? '（文件不存在或分支名变了）' : ''));
    const text = await res.text();
    if (!text || !String(text).trim()) throw new Error('返回内容为空');
    return String(text);
  } catch (e) {
    if (e && (e.name === 'AbortError' || /aborted/i.test(String(e.message || '')))) {
      throw new Error('连接超时（' + Math.round(limit / 1000) + ' 秒无响应' + (note ? '，' + note : '') + '）');
    }
    const msg = String((e && e.message) || e || '未知错误');
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(msg)) throw new Error('网络不通（可能被拦截或 DNS 解析失败）');
    throw new Error(msg);
  } finally { if (timer) clearTimeout(timer); }
}

// 按线路表依次尝试；返回 {text,url,label,kind,attempts,switched,stale}，全失败时抛错并带 attempts
// o.accept(text) 做「新鲜度校验」：镜像有缓存，拿到旧版本时返回 false 就继续换下一条；
// 若所有线路都只有旧内容，则把第一次拿到的旧内容作为兜底返回（stale:true）。
async function fetchUpdateSource(opts) {
  const o = opts || {};
  const primary = String(o.primaryUrl || DEFAULT_UPDATE_URL).trim();
  const cfg = getUpdateConfig();
  const allowMirror = cfg.mirrorFallback !== false && o.allowMirror !== false;
  const chain = buildUpdateSourceChain(primary, o.preferUrl);
  const attempts = [];
  const budget = typeof o.budgetMs === 'number' ? o.budgetMs : UPDATE_TOTAL_BUDGET;
  const startedAt = Date.now();
  let staleResult = null;
  for (let i = 0; i < chain.length; i++) {
    const item = chain[i];
    if (!allowMirror && item.url !== primary) continue;
    // 已经等太久就不再起新线路，避免加载框一直转；把剩下的记为「已跳过」
    if (attempts.length > 0 && Date.now() - startedAt > budget) {
      attempts.push({ label: item.label, url: item.url, ok: false, skipped: true, error: '已跳过（前面的线路等太久，不想让你一直转圈）' });
      continue;
    }
    if (typeof o.onBeforeAttempt === 'function') { try { o.onBeforeAttempt(item, attempts.length); } catch (e) {} }
    const timeout = item.kind === 'mirror' ? UPDATE_MIRROR_TIMEOUT : UPDATE_DIRECT_TIMEOUT;
    try {
      const text = await fetchTextWithTimeout(item.url, timeout, item.kind === 'mirror' ? '' : '直连被墙时属正常现象');
      let fresh = true;
      if (typeof o.accept === 'function') { try { fresh = o.accept(text) !== false; } catch (e) { fresh = true; } }
      if (!fresh) {
        attempts.push({ label: item.label, url: item.url, ok: false, stale: true, error: '拿到的是旧缓存，正在找更新的线路' });
        if (!staleResult) staleResult = { text: text, url: item.url, label: item.label, kind: item.kind };
        continue;
      }
      attempts.push({ label: item.label, url: item.url, ok: true });
      if (item.kind === 'mirror') { try { mainWin.localStorage.setItem(UPDATE_LAST_GOOD_KEY, item.url); } catch (e) {} }
      return { text: text, url: item.url, label: item.label, kind: item.kind, attempts: attempts, switched: attempts.length > 1 };
    } catch (e) {
      attempts.push({ label: item.label, url: item.url, ok: false, error: String((e && e.message) || e) });
    }
  }
  if (staleResult) {
    return { text: staleResult.text, url: staleResult.url, label: staleResult.label, kind: staleResult.kind, attempts: attempts, switched: attempts.length > 1, stale: true };
  }
  const err = new Error('所有更新线路都连不上');
  err.attempts = attempts;
  throw err;
}

function compareVersions(a, b) {
  const pa = String(a).split('.').map(function(x) { return parseInt(x, 10) || 0; });
  const pb = String(b).split('.').map(function(x) { return parseInt(x, 10) || 0; });
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0, vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

async function checkForUpdates(silent) {
  const cfg = getUpdateConfig();
  if (!cfg.url) {
    if (!silent) openUpdateConfigDialog(null);
    return null;
  }
  if (!silent) showLoadingDialog('正在读取最新版本与更新公告…');
  try {
    const got = await fetchUpdateSource({
      primaryUrl: cfg.url,
      preferUrl: _updLastGoodSource(),
      onBeforeAttempt: function(item, tried) {
        if (silent || !tried) return;
        updateLoadingDialogText('直连没接通，正在换「' + item.label + '」…');
      },
      accept: function(text) {
        // 镜像有缓存：拿到比当前更旧的版本就继续换线，别让玩家以为「已是最新」
        const t = String(text);
        const m = t.match(/MOON_FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if (m) return compareVersions(m[1], MOON_FORMULA_VERSION) >= 0;
        try { const j = JSON.parse(t); if (j && j.version) return compareVersions(String(j.version), MOON_FORMULA_VERSION) >= 0; } catch (e) {}
        return true;
      }
    });
    if (got.switched && !silent) toast('官方直连不通，已自动改用「' + got.label + '」', 'info');
    const text = got.text;
    let remoteVersion = '', remoteInfo = '';
    try {
      const json = JSON.parse(text);
      if (json && json.version) {
        remoteVersion = String(json.version);
        remoteInfo = String(json.info || json.changelog || '');
      }
    } catch (e) {}
    if (!remoteVersion) {
      const m = text.match(/MOON_FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/);
      if (m) remoteVersion = m[1];
    }
    if (!remoteInfo) {
      const changelogMatch = text.match(/MOON_FORMULA_CHANGELOG\s*=\s*("(?:\\.|[^"\\])*")/);
      if (changelogMatch) {
        try { remoteInfo = JSON.parse(changelogMatch[1]); } catch (e) {}
      }
    }
    if (!remoteVersion) {
      if (!silent) showModalDialog('版本检查失败', '<div style="line-height:1.8;">更新源能连上，但里面没有版本号。<br>可能这个地址不是脚本源码，请在「⚙️ 更新设置」里换一个直链。</div>', null, { confirmText: '关闭' });
      return null;
    }
    const cmp = compareVersions(remoteVersion, MOON_FORMULA_VERSION);
    if (cmp > 0) {
      _cachedUpdateInfo = { version: remoteVersion, info: remoteInfo, url: cfg.url, resolvedUrl: got.url, sourceLabel: got.label, sourceKind: got.kind };
      try { refreshPanel(); } catch (e) {}
      if (!silent) showUpdateAvailableDialog(_cachedUpdateInfo);
      return _cachedUpdateInfo;
    }
    _cachedUpdateInfo = null;
    try { refreshPanel(); } catch (e) {}
    if (!silent) showModalDialog('版本检查结果', '<div style="line-height:1.8;">当前版本：<b style="color:#f472d0;">v' + MOON_FORMULA_VERSION + '</b><br>最新版本：<b style="color:#f472d0;">v' + remoteVersion + '</b><br><span style="color:#94a3b8;font-size:10.5px;">线路：' + _updEsc(got.label) + '</span><br><br>你现在使用的已经是最新版本。' + (got.stale ? '<br><span style="color:#fbbf24;font-size:10.5px;">（这条线路还在缓存旧版本，稍后再查可能会发现更新的版本）</span>' : '') + '</div>', null, { confirmText: '关闭' });
    return null;
  } catch (e) {
    if (!silent) showUpdateConnectFailedDialog('版本检查失败', '检查新版本需要联网，现在所有线路都没接通。', e.attempts, function() { checkForUpdates(false); });
    return null;
  } finally { if (!silent) closeLoadingDialog(); }
}

// 线路全部失败时的提示：列出试过哪几条线、各自为什么失败，并给「重试 / 换源」
function _updateAttemptsHtml(attempts) {
  if (!attempts || !attempts.length) return '';
  let rows = '';
  attempts.forEach(function(a) {
    const ok = !!a.ok;
    const color = ok ? '#6ee7b7' : (a.skipped ? '#94a3b8' : '#f87171');
    const mark = ok ? '✅ ' : (a.skipped ? '⏭ ' : '⛔ ');
    rows += '<div style="padding:6px 0;border-bottom:1px dashed rgba(148,163,184,0.15);">' +
      '<div style="color:' + color + ';font-weight:600;">' + mark + _updEsc(a.label) + '</div>' +
      (a.error ? '<div style="color:#94a3b8;font-size:10px;margin-top:2px;">' + _updEsc(a.error) + '</div>' : '') +
    '</div>';
  });
  return '<div style="padding:8px 10px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:9px;font-size:10.5px;line-height:1.5;margin:8px 0 10px;">' + rows + '</div>';
}

function showUpdateConnectFailedDialog(title, lead, attempts, onRetry) {
  const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;">' + lead + '</div>' +
    _updateAttemptsHtml(attempts) +
    '<div style="font-size:10.5px;color:#94a3b8;line-height:1.7;">' +
      '可以这样救：<br>' +
      '1️⃣ 过一会儿点「🔄 再试一次」；<br>' +
      '2️⃣ 开了加速器 / 梯子的先关掉或换个节点；<br>' +
      '3️⃣ 还是不行就点「⚙️ 换源」，把更新源换成 jsDelivr 镜像地址。' +
    '</div>';
  showModalDialogCancelable(title, html,
    function() { if (typeof onRetry === 'function') { try { onRetry(); } catch (e) {} } },
    function() {},
    { confirmText: '🔄 再试一次', cancelText: '关闭',
      onOpen: function(mask) {
        try {
          const cancelBtn = mask.querySelector('#moon-modal-cancel');
          const row = cancelBtn ? cancelBtn.parentNode : null;
          if (!row) return;
          const btn = mainDoc.createElement('button');
          btn.textContent = '⚙️ 换源';
          btn.style.cssText = 'flex:0 0 auto;padding:10px 12px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;';
          btn.addEventListener('click', function() {
            try { mask.remove(); } catch (e) {}
            setTimeout(function() { openUpdateConfigDialog(null); }, 150);
          });
          row.appendChild(btn);
        } catch (e) {}
      } });
}

function showUpdateAvailableDialog(remote) {
  const html =
    '<div style="font-size:12px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
      '发现新版本：<b style="color:#fde047;">v' + remote.version + '</b><br>' +
      '当前版本：<span style="color:#94a3b8;">v' + MOON_FORMULA_VERSION + '</span>' +
      (remote.sourceLabel ? '<br><span style="font-size:10.5px;color:#64748b;">线路：' + _updEsc(remote.sourceLabel) + (remote.sourceKind === 'mirror' ? '（直连不通，已自动切换）' : '') + '</span>' : '') +
    '</div>' +
    (remote.info
      ? '<div style="padding:10px 12px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:9px;font-size:11px;color:#94a3b8;line-height:1.7;max-height:240px;overflow-y:auto;margin-bottom:10px;white-space:pre-wrap;">' + String(remote.info).replace(/</g, '&lt;') + '</div>'
      : '') +
    '<div style="font-size:10.5px;color:#64748b;line-height:1.6;">点「✅ 确定更新」后，脚本会自动下载新版本并写入，然后刷新页面。<br>直连下载不通会自动换国内镜像；若连写入也失败，会降级为「复制到剪贴板 + 提示手动替换」。</div>';
  showModalDialogCancelable('🔄 发现新版本 v' + remote.version, html,
    function() { doAutoUpdate(remote); },
    function() { toast('已取消更新', 'info'); },
    { confirmText: '✅ 确定更新', cancelText: '稍后再说' });
}

function showUpdateAnnouncementOnce() {
  let firstRunDone = false;
  let lastAnnouncedVersion = '';
  try {
    const ls = mainWin.localStorage || localStorage;
    firstRunDone = ls.getItem(FIRST_RUN_KEY) === '1';
    lastAnnouncedVersion = ls.getItem(LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY) || '';
    // 新安装走首次启动引导，不再重复弹出版本更新公告。
    if (!firstRunDone) {
      ls.setItem(LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY, MOON_FORMULA_VERSION);
      return false;
    }
    if (lastAnnouncedVersion === MOON_FORMULA_VERSION) return false;
    ls.setItem(LAST_UPDATE_ANNOUNCEMENT_VERSION_KEY, MOON_FORMULA_VERSION);
  } catch (e) { return false; }

  const safeVersion = String(MOON_FORMULA_VERSION).replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
  const safeInfo = String(MOON_FORMULA_CHANGELOG || '本次更新已完成。').replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
  const html = '<div style="font-size:12px;color:#cbd5e1;line-height:1.8;margin-bottom:10px;">' +
    '已更新至 <b style="color:#fde047;">v' + safeVersion + '</b></div>' +
    '<div style="padding:10px 12px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:9px;font-size:11.5px;color:#cbd5e1;line-height:1.8;white-space:pre-wrap;">' +
    safeInfo + '</div>';
  showModalDialog('📢 更新公告', html, null, { confirmText: '知道了' });
  return true;
}

async function doAutoUpdate(remote) {
  if (!remote || !remote.url) { toast('无更新源', 'warning'); return; }

  showLoadingDialog('正在下载新版本…');
  let code = '';
  let got = null;
  try {
    got = await fetchUpdateSource({
      primaryUrl: remote.url,
      preferUrl: remote.resolvedUrl || _updLastGoodSource(),
      onBeforeAttempt: function(item, tried) {
        updateLoadingDialogText(tried ? '直连没接通，正在换「' + item.label + '」下载…' : '正在通过「' + item.label + '」下载新版本…');
      },
      accept: function(text) {
        // 必须是脚本本体，且版本不低于公告版本，否则继续换线（镜像缓存旧文件时很有用）
        let body = String(text);
        try {
          const j = JSON.parse(body);
          if (j && typeof j.content === 'string') body = j.content;
          else if (j && typeof j.script === 'string') body = j.script;
          else if (j && typeof j.code === 'string') body = j.code;
        } catch (e) {}
        const m = body.match(/MOON_FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if (!m) return false;
        return compareVersions(m[1], remote.version) >= 0;
      }
    });
    code = got.text;
  } catch (e) {
    closeLoadingDialog();
    showUpdateConnectFailedDialog('下载失败',
      '<b style="color:#f87171;">新版本没下载下来。</b><br>下面这些线路都试过了，全部没接通：',
      (e && e.attempts) || [],
      function() { doAutoUpdate(remote); });
    return;
  }
  closeLoadingDialog();

  // 若是 JSON 包装，尝试取出脚本正文
  try {
    const json = JSON.parse(code);
    if (json && typeof json.content === 'string') code = json.content;
    else if (json && typeof json.script === 'string') code = json.script;
    else if (json && typeof json.code === 'string') code = json.code;
  } catch (e) {}

  code = String(code || '').trim();
  if (!code || code.length < 500) {
    showModalDialog('下载内容异常',
      '<div style="line-height:1.8;">从「' + _updEsc(got ? got.label : '更新源') + '」拿到的东西不是脚本本体（长度只有 ' + code.length + ' 字符）。<br>' +
      '一般是更新源地址指错了文件，去「⚙️ 换源」里确认一下链接。</div>',
      null, { confirmText: '关闭' });
    return;
  }
  const verMatch = code.match(/MOON_FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!verMatch || compareVersions(verMatch[1], remote.version) < 0) {
    showModalDialog('下载内容对不上',
      '<div style="line-height:1.8;">下载到的版本号是 <b>' + _updEsc(verMatch ? verMatch[1] : '未标注') + '</b>，' +
      '但公告说是 <b>v' + _updEsc(remote.version) + '</b>。<br>' +
      '多半是镜像缓存了旧文件，等几分钟再试一次就好。</div>',
      null, { confirmText: '关闭' });
    return;
  }

  showLoadingDialog('正在写入更新…');
  let okTH = false;
  try { okTH = await tryApplyUpdateViaTavernHelper(code); } catch (e) { _autoUpdateScriptWriteDiagnostic = '酒馆助手脚本写入接口报错：' + String(e && e.message || e); try { console.warn('[Moon] TavernHelper 脚本更新接口失败:', e); } catch (e2) {} }
  const okLS = okTH ? false : tryApplyUpdateToStorage(code);
  let okIDB = false;
  if (!okTH) { try { okIDB = await tryApplyUpdateToIndexedDB(code); } catch (e) {} }
  closeLoadingDialog();

  if (okTH || okLS || okIDB) {
    _cachedUpdateInfo = null;
    toast('更新成功，即将刷新页面...', 'success');
    setTimeout(function() {
      try {
        if (mainWin && mainWin.location && typeof mainWin.location.reload === 'function') mainWin.location.reload();
        else location.reload();
      } catch (e) { try { location.reload(); } catch (e2) {} }
    }, 1200);
    return;
  }

  // 降级：复制到剪贴板
  let copied = false;
  try {
    if (mainWin.navigator && mainWin.navigator.clipboard) {
      await mainWin.navigator.clipboard.writeText(code);
      copied = true;
    }
  } catch (e) {}
  showModalDialog('⚠️ 自动写入失败',
    '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;">' +
      '未能确认新脚本已经写入。' +
      (_autoUpdateScriptWriteDiagnostic ? '<br><span style="color:#fbbf24;">原因：' + String(_autoUpdateScriptWriteDiagnostic).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' : '') +
      (copied ? '<br><b style="color:#6ee7b7;">新脚本已复制到剪贴板。</b>' : '') +
      '<br>请打开「酒馆助手 → 脚本管理」，找到本脚本，把新内容粘贴进去并保存。<br>' +
      '<span style="color:#fbbf24;">保存后本脚本会在下次加载时自动刷新页面。</span></div>',
    null, { confirmText: '知道了' });
}

// 通过酒馆助手公开脚本树接口更新自身，避免依赖酒馆内部 localStorage/IndexedDB 结构。
let _autoUpdateScriptWriteDiagnostic = '';
async function tryApplyUpdateViaTavernHelper(code) {
  const fixedScriptId = 'e22f244b-70e1-448e-b24e-5a9b36c48484';
  const types = ['global', 'preset', 'character'];
  const scopes = [];
  try { scopes.push(window); } catch (e) {}
  try { if (mainWin && scopes.indexOf(mainWin) < 0) scopes.push(mainWin); } catch (e) {}
  try { if (mainWin && mainWin.top && scopes.indexOf(mainWin.top) < 0) scopes.push(mainWin.top); } catch (e) {}
  const apis = [];
  const addApi = function(owner, api) {
    if (!api || typeof api.getScriptTrees !== 'function' || typeof api.updateScriptTreesWith !== 'function') return;
    if (apis.some(function(item) { return item.api === api; })) return;
    apis.push({ owner: owner, api: api });
  };
  scopes.forEach(function(scope) {
    try { addApi(scope, scope); } catch (e) {}
    try { addApi(scope.TavernHelper, scope.TavernHelper); } catch (e) {}
  });
  if (!apis.length) {
    _autoUpdateScriptWriteDiagnostic = '当前页面没有找到酒馆助手公开的脚本树读写接口。';
    return false;
  }

  let runtimeScriptId = '', runtimeScriptName = '';
  scopes.forEach(function(scope) {
    try { if (!runtimeScriptId && typeof scope.getScriptId === 'function') runtimeScriptId = String(scope.getScriptId() || ''); } catch (e) {}
    try { if (!runtimeScriptName && typeof scope.getScriptName === 'function') runtimeScriptName = String(scope.getScriptName() || ''); } catch (e) {}
  });
  const scriptIds = [runtimeScriptId, fixedScriptId].filter(function(id, index, all) { return id && all.indexOf(id) === index; });
  const scriptNames = [runtimeScriptName, 'Galgame攻略系统', '月相系统', '🌕 月相系统'].filter(function(name, index, all) { return name && all.indexOf(name) === index; });
  const listScripts = function(nodes, out) {
    (nodes || []).forEach(function(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'script') out.push(node);
      else if (node.type === 'folder') listScripts(node.scripts, out);
    });
    return out;
  };
  const rewrite = function(nodes, targetId, targetName, state) {
    return (nodes || []).map(function(node) {
      if (!node || typeof node !== 'object') return node;
      if (node.type === 'script' && (node.id === targetId || !targetId && node.name === targetName)) {
        state.count++;
        return Object.assign({}, node, { content: code });
      }
      if (node.type === 'folder' && Array.isArray(node.scripts)) return Object.assign({}, node, { scripts: rewrite(node.scripts, targetId, targetName, state) });
      return Object.assign({}, node);
    });
  };

  let sawReadableTree = false, sawMatchingScript = false, lastError = '';
  for (let a = 0; a < apis.length; a++) {
    const api = apis[a].api;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      let trees;
      try { trees = api.getScriptTrees.call(apis[a].owner, { type: type }); sawReadableTree = true; } catch (e) { lastError = String(e && e.message || e); continue; }
      const scripts = listScripts(trees, []);
      let target = scripts.find(function(script) { return scriptIds.indexOf(String(script.id || '')) >= 0; });
      if (!target) {
        const sameName = scripts.filter(function(script) { return scriptNames.indexOf(String(script.name || '')) >= 0; });
        if (sameName.length === 1) target = sameName[0];
      }
      if (!target) continue;
      sawMatchingScript = true;
      const targetId = String(target.id || '');
      const targetName = String(target.name || '');
      const state = { count: 0 };
      try {
        const updated = await api.updateScriptTreesWith.call(apis[a].owner, function(currentTrees) { return rewrite(currentTrees, targetId, targetName, state); }, { type: type });
        if (!state.count) { lastError = '脚本树更新函数没有找到目标脚本。'; continue; }
        const updatedScripts = listScripts(updated, []);
        let verified = updatedScripts.some(function(script) { return String(script.id || '') === targetId && script.content === code; });
        if (!verified) {
          const saved = api.getScriptTrees.call(apis[a].owner, { type: type });
          verified = listScripts(saved, []).some(function(script) { return String(script.id || '') === targetId && script.content === code; });
        }
        if (verified) { _autoUpdateScriptWriteDiagnostic = ''; return true; }
        lastError = '酒馆助手没有返回已写入的新脚本内容。';
      } catch (e) { lastError = String(e && e.message || e); }
    }
  }
  if (sawMatchingScript) _autoUpdateScriptWriteDiagnostic = lastError || '找到了本脚本，但酒馆助手没有确认保存结果。';
  else if (!sawReadableTree) _autoUpdateScriptWriteDiagnostic = lastError || '酒馆助手脚本库读取接口无法访问。';
  else _autoUpdateScriptWriteDiagnostic = '接口正常，但当前全局、预设和角色卡脚本库中都没有匹配到本脚本的 ID 或唯一名称。';
  return false;
}

// 尝试在 localStorage 里找到包含本脚本 id 的管理数据并替换 content
function tryApplyUpdateToStorage(code) {
  const ST_ID = 'e22f244b-70e1-448e-b24e-5a9b36c48484';
  let applied = false;
  try {
    const ls = mainWin.localStorage || localStorage;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key) continue;
      let raw = null;
      try { raw = ls.getItem(key); } catch (e) { continue; }
      if (!raw || raw.indexOf(ST_ID) < 0) continue;
      try {
        const data = JSON.parse(raw);
        if (_replaceScriptInNode(data, ST_ID, code)) {
          ls.setItem(key, JSON.stringify(data));
          applied = true;
          try { console.log('[Moon] 已更新 localStorage key:', key); } catch (e) {}
        }
      } catch (e) {}
    }
  } catch (e) {}
  return applied;
}

function _replaceScriptInNode(node, id, newContent) {
  if (!node || typeof node !== 'object') return false;
  let changed = false;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (_replaceScriptInNode(node[i], id, newContent)) changed = true;
    }
  } else {
    if (node.id === id && typeof node.content === 'string') {
      node.content = newContent;
      changed = true;
    }
    for (const k in node) {
      if (k === 'content') continue;
      if (_replaceScriptInNode(node[k], id, newContent)) changed = true;
    }
  }
  return changed;
}

// 尝试从 IndexedDB 里找脚本管理数据（不同酒馆版本库名不同，尽力而为）
async function tryApplyUpdateToIndexedDB(code) {
  const IDB = mainWin.indexedDB;
  if (!IDB) return false;
  const ST_ID = 'e22f244b-70e1-448e-b24e-5a9b36c48484';
  const CANDIDATES = [
    { db: 'tavern_helper', store: 'scripts' },
    { db: 'tavern_helper', store: 'script' },
    { db: 'SillyTavern', store: 'scripts' },
    { db: 'SillyTavern', store: 'script' },
    { db: 'TavernHelper', store: 'scripts' },
    { db: 'TavernHelper', store: 'script' },
    { db: 'SillyTavern_scripts', store: 'scripts' }
  ];
  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    try {
      const db = await _openIDB(IDB, c.db);
      if (!db) continue;
      if (!db.objectStoreNames.contains(c.store)) { try { db.close(); } catch (e) {} continue; }

      const tx = db.transaction(c.store, 'readwrite');
      const store = tx.objectStore(c.store);
      const all = await new Promise(function(resolve) {
        let done = false;
        const fin = function(v) { if (!done) { done = true; resolve(v); } };
        const r = store.getAll();
        r.onsuccess = function() { fin(r.result || []); };
        r.onerror = function() { fin([]); };
        setTimeout(function() { fin([]); }, 1500);
      });

      let changed = false;
      for (let j = 0; j < all.length; j++) {
        const row = all[j];
        if (!row || typeof row !== 'object') continue;
        if (row.id !== ST_ID) continue;
        if (typeof row.content !== 'string') continue;
        try {
          row.content = code;
          store.put(row);
          changed = true;
        } catch (e) {}
      }
      await new Promise(function(resolve) {
        let done = false;
        const fin = function() { if (!done) { done = true; resolve(); } };
        tx.oncomplete = fin; tx.onerror = fin; tx.onabort = fin;
        setTimeout(fin, 1500);
      });
      try { db.close(); } catch (e) {}
      if (changed) return true;
    } catch (e) {}
  }
  return false;
}

function _openIDB(IDB, name) {
  return new Promise(function(resolve) {
    try {
      const req = IDB.open(name);
      let done = false;
      const finish = function(v) { if (!done) { done = true; resolve(v); } };
      req.onsuccess = function() { finish(req.result); };
      req.onerror = function() { finish(null); };
      req.onblocked = function() { finish(null); };
      setTimeout(function() { finish(null); }, 1500);
    } catch (e) { resolve(null); }
  });
}

function openUpdateConfigDialog(panel) {
  const cfg = getUpdateConfig();
  const html =
    '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      '填脚本源码文件的直链（推荐 jsDelivr 加速）。<br>' +
      '<code style="color:#7dd3fc;font-size:10.5px;">https://cdn.jsdelivr.net/gh/用户名/仓库@main/moon-phase.js</code><br>' +
      '脚本会从中解析 <code style="color:#7dd3fc;font-size:10.5px;">MOON_FORMULA_VERSION</code> 作为版本号。' +
    '</div>' +
    '<div style="margin-bottom:8px;">' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">更新源 URL（留空则用内置地址，一般不用改）</div>' +
      '<input id="moon-upd-url" type="text" value="' + String(cfg.url || DEFAULT_UPDATE_URL).replace(/"/g, '&quot;') + '" placeholder="https://raw.githubusercontent.com/..." style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:12px;">' +
    '</div>' +
    '<label style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#94a3b8;cursor:pointer;margin-bottom:6px;line-height:1.6;">' +
      '<input type="checkbox" id="moon-upd-mirror" style="margin-top:2px;" ' + (cfg.mirrorFallback !== false ? 'checked' : '') + '> 直连下载不通时，自动换国内镜像（推荐开着）' +
    '</label>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;cursor:pointer;">' +
      '<input type="checkbox" id="moon-upd-auto" ' + (cfg.autoCheck ? 'checked' : '') + '> 启动时自动检查更新' +
    '</label>';
  showModalDialogCancelable('⚙️ 更新设置', html,
    function() {
      const mask = mainDoc.getElementById('moon-modal-mask');
      const url = mask.querySelector('#moon-upd-url').value.trim();
      const auto = mask.querySelector('#moon-upd-auto').checked;
      const mirrorInput = mask.querySelector('#moon-upd-mirror');
      const mirror = mirrorInput ? mirrorInput.checked : true;
      saveUpdateConfig({ url: url, autoCheck: auto, mirrorFallback: mirror });
      try { mask.remove(); } catch (e) {}
      toast('已保存', 'success');
      if (url) checkForUpdates(true);
    },
    function() { toast('已取消', 'info'); },
    { confirmText: '保存', cancelText: '取消' });
}

  function openUserAuditionMainDialog(panel) {
    const personaData = collectCurrentPlayerPersona();
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">' +
      'AI 将读取你右侧 Persona 面板的设定，提炼成一份「玩家角色灵魂小传」，然后按小传演一段单人戏。' +
      '<br><span style="color:#fbbf24;">生成完毕后你可以先检查小传内容，确认后再进入试镜。</span></div>' +
      '<div style="padding:8px 10px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:8px;margin-bottom:10px;font-size:11px;color:#cbd5e1;line-height:1.6;">' +
      '<div style="color:#7dd3fc;font-weight:600;margin-bottom:4px;">当前 Persona 面板内容</div>' +
      (personaData.persona ? '<div style="white-space:pre-wrap;max-height:120px;overflow-y:auto;">' + personaData.persona.replace(/</g, '&lt;').substring(0, 500) + (personaData.persona.length > 500 ? '……' : '') + '</div>' : '<div style="color:#f87171;">（Persona 面板为空，请先在右侧填写）</div>') + '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">生成模型（未保存API时点开始会自动弹窗填写）：</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid #a94d8b;background:#241025;cursor:pointer;"><input type="radio" name="moon-ub-provider" value="custom" ' + (hasValidCustomAIConfig() ? 'checked' : '') + '><span style="font-size:12px;color:#ffc4e9;">🔑 我自己的 API' + (hasValidCustomAIConfig() ? '（已填好）' : '（要先填）') + '</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-ub-provider" value="main" ' + (!hasValidCustomAIConfig() ? 'checked' : '') + '><span style="font-size:12px;">🎭 就用酒馆现在这个 AI</span></label>' +
      '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">小传字数：<span id="moon-ub-bio-label" style="color:#7dd3fc;font-weight:600;">260</span> 字</div>' +
      '<input id="moon-ub-bio-slider" type="range" min="150" max="400" step="10" value="260" style="width:100%;margin-bottom:8px;">' +
      '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">试镜片段字数：<span id="moon-ub-seg-label" style="color:#7dd3fc;font-weight:600;">200</span> 字</div>' +
      '<input id="moon-ub-seg-slider" type="range" min="100" max="400" step="10" value="200" style="width:100%;margin-bottom:10px;">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;cursor:pointer;"><input type="checkbox" id="moon-ub-use-chat" checked> 生成小传时参考最近对话</label>';
    showModalDialogCancelable('👤 玩家角色试镜', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const provider = (mask.querySelector('input[name="moon-ub-provider"]:checked') || {}).value || 'main';
        const bioLimit = Number(mask.querySelector('#moon-ub-bio-slider').value) || 260;
        const segLimit = Number(mask.querySelector('#moon-ub-seg-slider').value) || 200;
        const useChat = mask.querySelector('#moon-ub-use-chat').checked;
        try { mask.remove(); } catch (e) {}
        await _ub_startGenerate(panel, provider, bioLimit, segLimit, useChat);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '开始生成', cancelText: '取消',
        onOpen: function(mask) {
          const bs = mask.querySelector('#moon-ub-bio-slider'); const bl = mask.querySelector('#moon-ub-bio-label');
          if (bs && bl) bs.addEventListener('input', function() { bl.textContent = bs.value; });
          const ss = mask.querySelector('#moon-ub-seg-slider'); const sl = mask.querySelector('#moon-ub-seg-label');
          if (ss && sl) ss.addEventListener('input', function() { sl.textContent = ss.value; });
        }
      });
  }
  /* ───────────────────────────────────────────────────────── */
  async function _ub_startGenerate(panel, provider, bioLimit, segLimit, useChat) {
    showLoadingDialog('AI 正在提炼玩家小传...');
    let bio = '';
    try { bio = await _ub_genBio(provider, bioLimit, useChat); }
    catch (e) { closeLoadingDialog(); showModalDialog('❌ 生成失败', '<div>' + String(e && e.message || e).replace(/</g, '&lt;') + '</div>', null, { confirmText: '关闭' }); return; }
    closeLoadingDialog();
    if (!bio || !bio.trim()) { showModalDialog('❌ 生成失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
    _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio);
  }

  function _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio) {
    const safeBio = String(bio).replace(/</g, '&lt;');
    const html = '<div style="font-size:11.5px;color:#cbd5e1;line-height:1.7;margin-bottom:8px;">' +
      '这是 AI 提炼出的<b style="color:#7dd3fc;">玩家角色灵魂小传</b>。请检查内容是否准确。' +
      '<br>如有不满，可以写意见让 AI 重写，或直接编辑文本。</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">小传内容（可直接编辑）</div>' +
      '<textarea id="moon-ub-preview-text" style="width:100%;box-sizing:border-box;min-height:220px;padding:10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;font-family:inherit;resize:vertical;">' + safeBio + '</textarea>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin:10px 0 4px 0;">修改意见（可选，AI 会按此重写）</div>' +
      '<textarea id="moon-ub-preview-feedback" placeholder="例如：说话方式应该更简练；去掉不认识的背景细节。" style="width:100%;box-sizing:border-box;min-height:60px;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;resize:vertical;font-family:inherit;"></textarea>' +
      '<div style="display:flex;gap:6px;margin-top:10px;">' +
      '<button id="moon-ub-rewrite" style="flex:1;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🔁 让 AI 重写</button>' +
      '<button id="moon-ub-toaud" style="flex:1.4;padding:9px;border-radius:8px;border:1px solid transparent;background:#0369a1;color:#f4f1ea;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🎬 确认小传，进入试镜</button></div>';
    showModalDialog('👤 玩家角色小传 · 预览', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-ub-rewrite').addEventListener('click', async function() {
          const ta = mask.querySelector('#moon-ub-preview-text');
          const fb = String(mask.querySelector('#moon-ub-preview-feedback').value || '').trim();
          const cur = String(ta.value || '').trim();
          if (!cur) { toast('小传不能为空', 'warning'); return; }
          if (!fb) { toast('请先写下修改意见', 'info'); return; }
          try { mask.remove(); } catch (e) {}
          showLoadingDialog('AI 正在重写小传...');
          try {
            const revised = await _ub_reviseBio(provider, cur, fb, bioLimit);
            closeLoadingDialog();
            if (!revised) { showModalDialog('❌ 重写失败', '<div>AI 未返回内容。</div>', null, { confirmText: '关闭' }); return; }
            _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, revised);
          } catch (e) { closeLoadingDialog(); toast('重写失败：' + (e.message || e), 'warning'); }
        });
        mask.querySelector('#moon-ub-toaud').addEventListener('click', async function() {
          const ta = mask.querySelector('#moon-ub-preview-text');
          const finalBio = String(ta.value || '').trim();
          if (!finalBio) { toast('小传不能为空', 'warning'); return; }
          try { mask.remove(); } catch (e) {}
          await _ub_startAudition(panel, provider, bioLimit, segLimit, finalBio);
        });
      }
    });
  }

  async function _ub_startAudition(panel, provider, bioLimit, segLimit, bio) {
    showLoadingDialog('AI 正在准备试镜...');
    let audition = '';
    try { audition = await _ub_genAudition(provider, bio, '根据小传自选一个能体现玩家角色灵魂的日常场景。', segLimit); }
    catch (e) { closeLoadingDialog(); toast('试镜生成失败：' + (e.message || e), 'warning'); _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio); return; }
    closeLoadingDialog();
    if (!audition || !audition.trim()) { toast('试镜片段为空', 'warning'); _ub_openPreviewDialog(panel, provider, bioLimit, segLimit, bio); return; }
    _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, bio, audition);
  }

  function _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, bio, audition) {
    const safeAud = String(audition).replace(/</g, '&lt;');
    const html = '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">试镜片段</div>' +
      '<div style="padding:12px 14px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:10px;font-size:12px;line-height:1.8;color:#e2e8f0;white-space:pre-wrap;max-height:38dvh;overflow-y:auto;margin-bottom:12px;">' + safeAud + '</div>' +
      '<div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">导演意见（可选）</div>' +
      '<textarea id="moon-ub-aud-feedback" placeholder="例如：这段表现太夸张了。" style="width:100%;box-sizing:border-box;min-height:60px;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.25);background:#22262f;color:#e2e8f0;font-size:11.5px;line-height:1.7;resize:vertical;font-family:inherit;margin-bottom:10px;"></textarea>' +
      '<div style="display:flex;gap:6px;">' +
      '<button id="moon-ub-aud-retry" style="flex:1.2;padding:9px;border-radius:8px;border:1px solid rgba(168,85,247,0.5);background:#2a1040;color:#c084fc;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🎭 让 AI 重演</button>' +
      '<button id="moon-ub-aud-save" style="flex:1.4;padding:9px;border-radius:8px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#f4f1ea;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">✅ 确认并保存</button></div>' +
      '<div style="margin-top:8px;font-size:10.5px;color:#64748b;line-height:1.6;">保存后会自动启用这份玩家小抄，同时停用其他玩家小抄。</div>';
    showModalDialog('👤 玩家角色试镜', html, null, {
      confirmText: '关闭',
      onOpen: function(mask) {
        mask.querySelector('#moon-ub-aud-retry').addEventListener('click', async function() {
          const fb = String(mask.querySelector('#moon-ub-aud-feedback').value || '').trim();
          if (!fb) { toast('请先写下意见', 'info'); return; }
          try { mask.remove(); } catch (e) {}
          showLoadingDialog('AI 正在重演...');
          try {
            const newBio = await _ub_reviseBio(provider, bio, fb, bioLimit);
            if (!newBio) throw new Error('AI 未返回内容');
            const newAud = await _ub_genAudition(provider, newBio, '根据小传自选一个能体现玩家角色灵魂的日常场景。', segLimit);
            closeLoadingDialog();
            if (!newAud) throw new Error('试镜片段为空');
            _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, newBio, newAud);
          } catch (e) { closeLoadingDialog(); toast('重演失败：' + (e.message || e), 'warning'); _ub_openAuditionDialog(panel, provider, bioLimit, segLimit, bio, audition); }
        });
        mask.querySelector('#moon-ub-aud-save').addEventListener('click', function() {
          try { mask.remove(); } catch (e) {}
          _ub_saveToLibrary(bio, audition, bioLimit, segLimit);
        });
      }
    });
  }

  function _ub_saveToLibrary(bio, audition, bioLimit, segLimit) {
