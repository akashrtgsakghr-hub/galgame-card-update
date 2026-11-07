  function shouldShowAdaptiveOpening() {
    if (getCardMode() === 'multi') return null;
    // ① 当前对话已有有效角色数据 → 不弹
    const data = readMvuLatest();
    if (data && data.stat_data && data.stat_data.角色) {
      const chars = data.stat_data.角色;
      for (const n in chars) {
        if (chars[n] && !isCharSkeleton(chars[n])) return null;
      }
    }
    // ② 有待迁移的打包数据 → 不弹（走迁移流程）
    try {
      const raw = (getStorage() || localStorage).getItem(PENDING_MIGRATION_KEY);
      if (raw) return null;
    } catch (e) {}
    const cardName = getCurrentCardName();
    if (!cardName || cardName === '(未知卡牌)') return null;
    return { charName: cardName, data: data };
  }

  async function runAdaptiveOpeningFlow() {
    if (isAdaptiveFlowRunning) return;
    const info = shouldShowAdaptiveOpening();
    if (!info) return;
    isAdaptiveFlowRunning = true;
    showAdaptiveStartDialog(info.charName);
  }

  /* ── 自动建档：没点「开局适配」也能正常加减 ─────────────────
     以前只有两条路进档：玩家点「AI 智能建档」，或者世界书里已经放着
     现成的变量。两条都没走，角色表就是空的 —— 掷骰、加好感、阶段门
     全部因为「找不到角色」被跳过，看起来像系统没生效。

     这里补第三条路：对面回过至少一句话之后，用 0 值把档案立起来。
     0 值 = 陌生人，不预设任何好感，正好适合「人设不需要给固定起始值」
     的卡；之后照常吃 Sylveina 标签加减。想更贴合开场，随时可以再去
     点「🚀 开局适配」用 AI 校准一次（会覆盖这套 0 值）。 */
  const AUTO_BOOTSTRAP_MIN_REPLIES = 1;

  /* 只数「玩家说过话之后，对面回的楼层」。
     新对话自带的开场白也是 AI 楼层，但它不算回复——否则一进聊天就建档，
     「开局适配」的 AI 校准弹窗就永远没机会出现了。 */
  function countAiReplies() {
    try {
      const ctx = getSTCtx();
      if (!ctx || !Array.isArray(ctx.chat)) return 0;
      let n = 0; let userSpoke = false;
      for (let i = 0; i < ctx.chat.length; i++) {
        const m = ctx.chat[i];
        if (!m || m.is_system) continue;
        if (m.is_user) { userSpoke = true; continue; }
        if (userSpoke) n++;
      }
      return n;
    } catch (e) { return 0; }
  }

  function getAutoBootstrapCardName() {
    const n = getCurrentCardName();
    if (!n || n === '(未知卡牌)') return '';
    return String(n).replace(/[。\.]+$/, '').trim();
  }

  /* ── 从一条回复里认人 ─────────────────────────────────────
     只认「明确点名」的：Sylveina 标签里的角色名、后台变量 `角色.X.` 的 X。
     这两个来源都是脚本自己要求 AI 输出的，不会误伤正文里的普通名词。 */
  const BOOTSTRAP_NAME_STOP = ['你', '我', '他', '她', '它', '玩家', '用户', 'User', 'user', '旁白', '众人', '大家', '系统', '未知'];

  function collectNamedCharsFromMessage(text) {
    const names = [];
    const push = function(n) {
      let v = String(n == null ? '' : n).trim();
      v = v.replace(/^[「『\[【(（<]+/, '').replace(/[」』\]】)）>]+$/, '').trim();
      if (!v || v.length > 12) return;
      if (BOOTSTRAP_NAME_STOP.indexOf(v) >= 0) return;
      if (names.indexOf(v) < 0) names.push(v);
    };
    const src = String(text || '');
    if (!src) return names;
    try {
      const tags = extractAllSylveinaTags(src);
      for (let i = 0; i < tags.length; i++) push(tags[i] && tags[i].charName);
    } catch (e) {}
    try {
      const re = /角色\s*[.．]\s*([^\r\n=＝:：.．]{1,30}?)\s*[.．]/g;
      let m;
      while ((m = re.exec(src)) !== null) push(m[1]);
    } catch (e) {}
    return names;
  }

  /* 兜底：从「名字：台词」这种对白格式里猜说话人。
     只在多人卡、且这一轮既没有标签也没有后台变量时才用，最多取前几个。 */
  function guessSpeakerNames(text) {
    const names = [];
    const src = String(text || '');
    if (!src) return names;
    const re = /(?:^|\n)[ \t>*\-•#\d.、]*([^\s：:，。！？；、\r\n]{2,6})[：:]/g;
    let m; let guard = 0;
    while ((m = re.exec(src)) !== null && guard++ < 40) {
      const n = String(m[1] || '').trim();
      if (!n || names.indexOf(n) >= 0) continue;
      if (BOOTSTRAP_NAME_STOP.indexOf(n) >= 0) continue;
      if (/[的了是在说问道着过他她我你]/.test(n)) continue;
      if (/^(?:时间|地点|地点|选项|选择|备注|状态|好感|阶段|肉体|嫉妒|心声|情绪|当前)$/.test(n)) continue;
      names.push(n);
    }
    return names;
  }

  // 从开场白 / 第一条回复里捞一个世界时间，捞不到就留给后面推进
  function guessOpeningWorldTime(texts) {
    const list = texts || [];
    for (let i = 0; i < list.length; i++) {
      const t = String(list[i] || '');
      if (!t) continue;
      const m = t.match(/(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日[^\r\n]{0,20}?\d{1,2}\s*[:点时]\s*\d{1,2}(?:\s*分)?)/);
      if (!m) continue;
      const d = parseGameTime(m[1] || m[0]);
      if (d && !isNaN(d.getTime())) return formatGameTime(d);
    }
    return '';
  }

  function buildAutoBootstrapEntry(worldTime) {
    const now = String(worldTime || '2000年01月01日 · 星期六 · 00:00');
    const stage = getRStageFromE(0);
    return {
      语言: '日语', 英文名: '', 签名: '', 性别: '男', user爱称: '',
      好感度: 0, 肉体值: 0, 阶段值: stage.r, 嫉妒值: 0,
      情绪: '😐', 心声: '……', 在场: true, 重要度: '主要',
      _invidia: { 重力等级: '', 骰子判定阈值: 0, 每日衰减基数: 0, 大失败反噬值: 0, 主动互动阈值: 30 },
      _lastRoll: { 事件类型: '', 方向: '', 主维度: '', 基础值: 0 },
      _quota: {
        好感度周上限已用: 0, 周上限起始: now, R阶段门: false,
        下次暗掷: now, 玩家本周已掷: false, 玩家冷却至: now,
        表白期排除: false, 表白期排除理由: '', 对用户特殊状态: '',
        表白期已通过: false, 表白期冷却至: '',
        自适应开局已完成: false,
        _autoBootstrapped: true, _autoBootstrapAt: now,
        _playerConfession: false, _firstMeetDone: false,
        /* 刚建出来的档还没吃过初见骰。标记挂在这里，建档当场就会结算一次；
           万一那次写入失败或人还没到场，下一轮点名时还能补上，不会永久错过。 */
        _初见待结算: true,
        _eventState: { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 },
        _timelineCompleted: [],
        _debuff: { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' }
      }
    };
  }

  // 世界书/别的插件可能已经塞了半截骨架，保留它有的字段，只补缺的
  function fillSkeletonEntry(target, fresh) {
    for (const k in fresh) {
      if (k === '_quota') {
        if (!target._quota || typeof target._quota !== 'object') target._quota = {};
        for (const qk in fresh._quota) {
          if (target._quota[qk] === undefined) target._quota[qk] = fresh._quota[qk];
        }
        continue;
      }
      if (target[k] === undefined) target[k] = fresh[k];
    }
    return target;
  }

  /* reason: 'first-reply'（对面第一次回复后触发）| 'chat-open'（打开已有聊天时补建） */
  async function autoBootstrapCharacter(reason) {
    try {
      if (isAdaptiveFlowRunning) {
        // 弹窗还开着就别抢；已经被关掉却忘了复位的话，这里顺手复位
        if (mainDoc.getElementById('moon-modal-mask')) return null;
        isAdaptiveFlowRunning = false;
      }
      if (getSettings().autoBootstrap === false) return null;
      if (countAiReplies() < AUTO_BOOTSTRAP_MIN_REPLIES) return null;
      try { if (getStorage() && getStorage().getItem(PENDING_MIGRATION_KEY)) return null; } catch (e) {}

      const data = readMvuLatest();
      if (!data || !data.stat_data) return null;
      const statData = data.stat_data;
      const tableEmpty = isCharsTableEmpty(statData.角色);

      const mode = getCardMode();
      const names = [];
      const cardName = getAutoBootstrapCardName();
      const latestTagMsg = getLatestAiMessage();
      const latestText = latestTagMsg ? String(latestTagMsg.msg.mes || '') : '';
      const named = collectNamedCharsFromMessage(latestText);
      const pushName = function(n) {
        const v = String(n || '').trim();
        if (v && names.indexOf(v) < 0) names.push(v);
      };
      if (!tableEmpty) {
        /* 已经有真档案：这一轮只补「新出场的人」。
           以前这里直接 return，换场景/加了新角色也永远进不了档，
           玩家看到的就是「只会更新数值，不会更新角色」。 */
        named.forEach(pushName);
        if (!names.length) return null;
      } else if (mode !== 'multi') {
        if (!cardName) return null;
        pushName(cardName);
      } else {
        /* 多人卡：只认标签 / 后台变量里点过名的；这一轮还没写名字时，
           退一步看对白格式里的说话人。卡名在多人卡上通常是剧本名而不是角色，
           宁可不建，也不往档案里塞一个假人。 */
        named.forEach(pushName);
        if (!names.length) guessSpeakerNames(latestText).slice(0, 3).forEach(pushName);
        if (!names.length) return null;
      }
      if (!names.length) return null;

      let cardFirstMes = '';
      try {
        const ctx = getSTCtx();
        const c = ctx && ctx.characters && ctx.characterId != null ? ctx.characters[ctx.characterId] : null;
        if (c) cardFirstMes = String(c.first_mes || '');
      } catch (e) {}

      const world = statData.世界 || (statData.世界 = {});
      const existingTime = String(world.时间 || '');
      // 世界已经在走（有回合 / 有天数 / 上次推进时间和当前时间不一致）时，不能再用正文去重猜，
      // 否则会把已经正确的时间覆盖掉，还会让当轮时钟被重复推进一次。
      const alreadyRunning = Number(world._回合) > 0 || Number(world._内部流逝天数) > 0
        || (!!existingTime && !!world._上次推进时间 && world._上次推进时间 !== existingTime);
      const hadRealTime = alreadyRunning || (!!existingTime && existingTime.indexOf('2000年01月01日') !== 0);
      const guessed = guessOpeningWorldTime([latestText, cardFirstMes]);
      const now = hadRealTime ? existingTime : (guessed || existingTime || '2000年01月01日 · 星期六 · 00:00');
      if (!hadRealTime) {
        world.时间 = now;
        // 原来的默认时间没意义，用新起点重置；已有真实时间就别动
        world._上次推进时间 = now;
        // 起点是从正文猜到的，说明这一轮的时间已由正文给定，时钟不要再叠加默认步长
        if (guessed) world._时钟已由正文确定 = true;
      }
      if (world._内部流逝天数 === undefined || !isFinite(Number(world._内部流逝天数))) world._内部流逝天数 = 0;
      if (!statData.角色 || typeof statData.角色 !== 'object') statData.角色 = {};

      const fresh = buildAutoBootstrapEntry(now);
      const made = [];
      for (let i = 0; i < names.length; i++) {
        const n = names[i];
        if (!n) continue;
        const exist = statData.角色[n];
        if (exist && !isCharSkeleton(exist)) continue;
        if (exist) statData.角色[n] = fillSkeletonEntry(exist, fresh);
        else {
          const entry = JSON.parse(JSON.stringify(fresh));
          /* 补录进来的新人先按「次要」算，免得抢了主攻略对象的戏；
             卡名本人和第一份档案仍然是「主要」。 */
          if (!tableEmpty && n !== cardName) entry.重要度 = '次要';
          statData.角色[n] = entry;
        }
        made.push(n);
      }
      if (!made.length) return null;
      statData[MIGRATED_FLAG] = true;

      /* 先落盘，再结算初见。
         这里的第一个 await 决定了「自动建档」与后面「后台变量摄入」的先后：
         把结算放在写盘之前，会让出微任务，后台变量的写入先发生、再被这里的
         旧快照盖掉（心声会丢）。所以维持原来的写入时机，写完再补掷。 */
      const ok = await writeMvuLatest(statData);
      if (!ok) return null;

      /* ── 初见投资：建档那一刻就掷，不等下一轮 AI 的标签 ──────────────
         以前建档只写一份 0 值骨架，把初见完全押给「下一轮 AI 会不会写
         [初见|…]」；模型忘了写、或者写了没过阈值，E 就一直停在 0，
         玩家体感就是「自动建档没启用初见投资、从头开始一点点加」。
         现在建完档立刻结算：本轮 AI 恰好写了标签就用它的档位，没写就按中性掷，
         失败也有印象底分——建档完成的那一刻，人物就已经有起点。 */
      const firstMeetNotes = [];
      try {
        const after = readMvuLatest();
        const sd = after && after.stat_data;
        if (sd && sd.角色) {
          for (let i = 0; i < made.length; i++) {
            const n = made[i];
            const ch = sd.角色[n];
            if (!ch || !ch._quota || ch._quota._firstMeetDone === true) continue;
            try {
              const inv = await processFirstMeetForChar(n, ch, getCurrentMode(), {
                allowScriptRoll: true,
                force: true,
                worldTime: now,
                source: tableEmpty ? '自动建档' : '新角色入档'
              });
              if (inv) firstMeetNotes.push(n + ' E' + (inv.delta >= 0 ? '+' : '') + inv.delta + '（' + inv.tier + '）');
            } catch (e) {}
          }
          if (firstMeetNotes.length) await writeMvuLatest(sd);
        }
      } catch (e) {}

      try { console.log('[月相] 自动建档：' + made.join('、') + (firstMeetNotes.length ? ' / 初见 ' + firstMeetNotes.join('、') : '')); } catch (e) {}
      if (reason !== 'silent') {
        const fmTxt = firstMeetNotes.length ? ' · 初见 ' + firstMeetNotes.join('、') : '';
        toast(tableEmpty
          ? '已自动建好档案' + fmTxt + ' · 想更贴合开场可点「🚀 开局适配」校准'
          : '新角色已入档：' + made.join('、') + fmTxt, 'info');
      }
      try { refreshPanel(); } catch (e) {}
      return made;
    } catch (e) { return null; }
  }

  function showAdaptiveStartDialog(charName) {
    const savedPref = (function() { try { return mainWin.localStorage.getItem(ADAPT_MODEL_PREF_KEY) || ''; } catch (e) { return ''; } })();
    const cardMode = getCardMode(); const isMulti = cardMode === 'multi';
    const tipHtml = isMulti ? '<div style="margin-top:10px;color:#fbbf24;line-height:1.7;">· 这张卡有好几个人，AI 会把出过场的都认出来<br>· 已经聊过的，按聊过的内容算</div>' : '<div style="margin-top:10px;color:#fbbf24;line-height:1.7;">· AI 会读完聊天记录，估一个起始数值<br>· 刚开始的对话，就照开场白和角色卡算</div>';
    const html = '<div>这个对话还没有角色档案，现在给你建一份。</div>' + tipHtml +
      '<div style="margin-top:14px;font-size:11px;color:#94a3b8;margin-bottom:6px;">用哪个 AI 来读？（没填过 API 也没关系，点「开始」会弹出填写框）</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid #a94d8b;background:#241025;cursor:pointer;"><input type="radio" name="moon-adapt-model" value="custom" ' + ((savedPref === 'custom' || savedPref === 'extra' || (!savedPref && hasValidCustomAIConfig())) ? 'checked' : '') + '><span style="font-size:12px;color:#ffc4e9;">🔑 我自己的 API' + (hasValidCustomAIConfig() ? '（已填好）' : '（要先填）') + '</span></label>' +
      '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px;border-radius:4px;border:1px solid rgba(148,163,184,0.25);cursor:pointer;"><input type="radio" name="moon-adapt-model" value="main" ' + ((savedPref === 'main' || (!savedPref && !hasValidCustomAIConfig())) ? 'checked' : '') + '><span style="font-size:12px;">🎭 就用酒馆现在这个 AI</span></label>' +
      '</div><label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;color:#94a3b8;cursor:pointer;"><input type="checkbox" id="moon-adapt-remember"> 记住我的选择</label>';
    showModalDialogCancelable('🌅 开始建角色档案', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const sel = mask ? mask.querySelector('input[name="moon-adapt-model"]:checked') : null;
        const provider = sel ? sel.value : 'main';
        const rememberEl = mask ? mask.querySelector('#moon-adapt-remember') : null;
        if (rememberEl && rememberEl.checked) { try { mainWin.localStorage.setItem(ADAPT_MODEL_PREF_KEY, provider); } catch (e) {} }
        try { if (mask) mask.remove(); } catch (e) {}
        runAdaptiveFirstPass(charName, provider); isAdaptiveFlowRunning = false;
      },
      function() {
        if (getCardMode() !== 'multi' && charName && charName !== '(多人卡)') {
          const data = readMvuLatest();
          if (data && data.stat_data && data.stat_data.角色 && data.stat_data.角色[charName]) {
            const q = data.stat_data.角色[charName]._quota || {}; q.自适应开局已完成 = true;
            data.stat_data.角色[charName]._quota = q; writeMvuLatest(data.stat_data);
          }
        }
        toast('这次先不建，随时可以回来点「开局适配」', 'info'); isAdaptiveFlowRunning = false;
      },
      { confirmText: '开始', cancelText: '跳过' });
  }

  async function runAdaptiveFirstPass(charName, provider) {
    if (getCardMode() === 'multi') { await runMultiCardAdaptiveFirstPass(provider, ''); return; }
    const ctxData = collectOpeningContext(charName);
    const tpl = getPromptTemplates().opening;
    const vars = { playerName: ctxData.playerName, playerPersona: ctxData.playerPersona, charName: ctxData.charName, charDesc: ctxData.charDesc, charPersonality: ctxData.charPersonality, charScenario: ctxData.charScenario, charFirstMes: ctxData.charFirstMes, charCreatorNotes: ctxData.charCreatorNotes, chatHistory: ctxData.hasHistory ? ctxData.chatHistory : '(无对话历史)' };
    showLoadingDialog(ctxData.hasHistory ? '正在通读对话历史...' : '正在根据开场白推断...');
    let reply = '';
    try { reply = await callOpeningModel(provider, renderPromptTemplate(tpl.sys, vars), renderPromptTemplate(tpl.user, vars)); }
    catch (e) { closeLoadingDialog(); toast('调用模型失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    const parsed = extractJson(reply);
    if (!parsed) { showModalDialog('❌ 解析失败', '<div>模型未返回合法 JSON。</div>', null, { confirmText: '关闭' }); return; }
    openAdaptiveResultDialog(charName, provider, parsed);
  }

  function openAdaptiveResultDialog(charName, provider, initial) {
    const initE = Number(initial.好感度) || 0; const initP = Number(initial.肉体值) || 0;
    const initI = Number(initial.嫉妒值) || 0; const initEmoji = String(initial.情绪 || '😐');
    const initVoice = String(initial.心声 || '……'); const initReason = String(initial.推断理由 || '');
    const initStage = getRStageFromE(initE);
    const html = '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">好感度（可改）</div><input id="moon-open-e" type="number" step="0.5" value="' + initE + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:13px;"></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">肉体值（可改）</div><input id="moon-open-p" type="number" step="0.5" value="' + initP + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:#171a22;color:#e2e8f0;font-size:13px;"></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">阶段值（自动推导）</div><div id="moon-open-r" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#171a22;font-size:12px;color:#a5f3fc;">' + initStage.r + ' · ' + initStage.name + '</div></div>' +
      '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">I / emoji / 心声（只读）</div><div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#171a22;font-size:12px;color:#cbd5e1;">I' + initI + ' · ' + initEmoji + ' · ' + initVoice + '</div></div>' +
      (initReason ? '<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">AI 推断理由</div><div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.15);background:#171a22;font-size:11px;color:#94a3b8;">' + initReason + '</div></div>' : '') + '</div>';
    showModalDialogCancelable('🌅 自适应开局 · 确认', html,
      function() {
        const mask = mainDoc.getElementById('moon-modal-mask');
        const finalE = Number(mask.querySelector('#moon-open-e').value) || 0; const finalP = Number(mask.querySelector('#moon-open-p').value) || 0;
        const finalStage = getRStageFromE(finalE); try { mask.remove(); } catch (e) {}
        applyAdaptiveOpening(charName, { e: finalE, p: finalP, r: finalStage.r, i: initI, emoji: initEmoji, voice: initVoice });
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '确认并写入', cancelText: '取消',
        onOpen: function(mask) {
          const eInput = mask.querySelector('#moon-open-e'); const rDisplay = mask.querySelector('#moon-open-r');
          eInput.addEventListener('input', function() { const st = getRStageFromE(Number(eInput.value) || 0); rDisplay.textContent = st.r + ' · ' + st.name; });
        }
      });
  }

async function applyAdaptiveOpening(charName, values) {
    const data = readMvuLatest();
    if (!data || !data.stat_data || !data.stat_data.角色 || !data.stat_data.角色[charName]) {
      await forceBootstrapVariables(charName, values);
      return;
    }
    const ch = data.stat_data.角色[charName];
    ch.好感度 = values.e;
    ch.肉体值 = values.p;
    ch.阶段值 = values.r;
    ch.嫉妒值 = values.i;
    ch.情绪 = values.emoji;
    ch.心声 = values.voice;
    if (!ch._quota) ch._quota = {};
    ch._quota.自适应开局已完成 = true;
    /* AI 读完整段聊天后给出的 E，本身就是「初见 + 相处」累计的结果，
       再让初见骰叠一次就是双算。只有它估出来正好是 0（真的还是陌生人）时，
       才把这一笔留给下一次掷骰，避免玩家点完适配还是从零爬。 */
    if ((Number(ch.好感度) || 0) !== 0) {
      ch._quota._firstMeetDone = true;
      try { delete ch._quota._初见待结算; } catch (e) { ch._quota._初见待结算 = false; }
    } else {
      ch._quota._初见待结算 = true;
    }
    if (!ch._quota._eventState) ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 };
    if (!Array.isArray(ch._quota._timelineCompleted)) ch._quota._timelineCompleted = [];
    const ok = await writeMvuLatest(data.stat_data);
    if (ok) {
      toast('自适应开局完成', 'success');
      try { refreshPanel(); } catch (e) {}
    } else {
      toast('写入失败', 'warning');
    }
  }

  async function forceBootstrapVariables(charName, values) {
    const now = '2000年01月01日 · 星期六 · 00:00';
    let data = readMvuLatest();
    let statData = (data && data.stat_data) ? data.stat_data : null;
    if (!statData) {
      statData = { 世界: { 时间: values.worldTime || now, _内部流逝天数: 0, _上次推进时间: values.worldTime || now }, 角色: {} };
      statData[MIGRATED_FLAG] = true;
    }
    if (!statData.角色 || typeof statData.角色 !== 'object') statData.角色 = {};
    if (!statData.世界) statData.世界 = { 时间: values.worldTime || now, _内部流逝天数: 0, _上次推进时间: values.worldTime || now };
    const name = charName || '主角';
    if (!statData.角色[name]) {
      statData.角色[name] = {
        语言: '日语', 英文名: '', 签名: '', 性别: '男', user爱称: '',
        好感度: values.e || 0, 肉体值: values.p || 0, 阶段值: values.r || 0, 嫉妒值: values.i || 0,
        情绪: values.emoji || '😐', 心声: values.voice || '……',
        在场: true, 重要度: values.importance || '主要',
        _invidia: { 重力等级: '', 骰子判定阈值: 0, 每日衰减基数: 0, 大失败反噬值: 0, 主动互动阈值: 30 },
        _lastRoll: { 事件类型: '', 方向: '', 主维度: '', 基础值: 0 },
        _quota: {
          好感度周上限已用: values.好感度周上限已用 || 0,
          周上限起始: values.worldTime || now, R阶段门: false,
          下次暗掷: values.worldTime || now, 玩家本周已掷: false, 玩家冷却至: values.worldTime || now,
          表白期排除: values.表白期排除 || false, 表白期排除理由: '', 对用户特殊状态: '',
          表白期已通过: values.表白期已通过 || false, 表白期冷却至: '',
          自适应开局已完成: true,
          _playerConfession: false,
          _firstMeetDone: (Number(values.e) || 0) !== 0,
          _初见待结算: (Number(values.e) || 0) === 0,
          _eventState: { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 },
          _timelineCompleted: values.已触发时间线事件名 || [],
          _debuff: { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' }
        }
      };
    } else {
      const ch = statData.角色[name];
      ch.好感度 = values.e || 0;
      ch.肉体值 = values.p || 0;
      ch.阶段值 = values.r || 0;
      ch.嫉妒值 = values.i || 0;
      ch.情绪 = values.emoji || '😐';
      ch.心声 = values.voice || '……';
      if (!ch._quota) ch._quota = {};
      ch._quota.好感度周上限已用 = values.好感度周上限已用 || 0;
      ch._quota.周上限起始 = values.worldTime || now;
      ch._quota.表白期已通过 = values.表白期已通过 || false;
      ch._quota.表白期排除 = values.表白期排除 || false;
      ch._quota.自适应开局已完成 = true;
      if (ch._quota._playerConfession === undefined) ch._quota._playerConfession = false;
      if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
      if (!ch._quota._eventState) {
        ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 };
      }
      ch._quota._timelineCompleted = values.已触发时间线事件名 || [];
      if (!ch._quota._debuff) ch._quota._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
    }
    const ok = await writeMvuLatest(statData);
    if (ok) { toast('变量已从零建立', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
    return ok;
  }
  /* ───────────────────────────────────────────────────────── */
  async function runMultiCardAdaptiveFirstPass(provider, manualNames) {
    const ctxData = collectChatHistoryContext(10000);
    const hasHistory = ctxData.chat && ctxData.chat.length >= 30;
    let charInfo = ''; let charFirstMes = ''; let charScenario = '';
    try {
      const ctx = getSTCtx();
      if (ctx && ctx.characters && ctx.characterId != null) {
        const ch = ctx.characters[ctx.characterId];
        if (ch) {
          charInfo = ['角色卡名称：' + (ch.name || '(未命名)'), '简介：' + (ch.description || '(无)').slice(0, 1200), '性格：' + (ch.personality || '(无)').slice(0, 600)].join('\n');
          charScenario = (ch.scenario || '').slice(0, 800);
          charFirstMes = (ch.first_mes || '').slice(0, 2000);
        }
      }
    } catch (e) {}
    if (!charInfo) charInfo = '(无法读取角色卡信息)';
    const sysPrompt = [
      '你是月相多维情感系统的「多人卡批量建档」助手。',
      '【背景】玩家使用多人卡，剧情里会涉及多个角色。你需要通读上下文，识别实际出场并与玩家有互动的角色，为每个角色推断初始四维数值。',
      '【输出】严格 JSON 数组：',
      '[{"名字":"角色正名","重要度":"主要"|"次要"|"NPC","好感度":number,"肉体值":number,"嫉妒值":number,"情绪":"单个emoji","心声":"15~30字第一人称","推断理由":"≤80字"}]',
      '【重要度判定】与玩家存在情感线/性张力、且是玩家主要互动对象的角色 = 主要；有互动但非情感线（同伴、对手、老师等）= 次要；只做背景出场 = NPC。玩家明确点名要攻略的角色必须是主要。',
      '【硬性要求】名字必须是剧情里最常出现、最正式的那个名字；至少识别 1 个，最多 10 个；只输出 JSON 数组。'
    ].join('\n');
    let userPrompt = '【角色卡信息】\n' + charInfo + '\n\n';
    if (charScenario) userPrompt += '【场景】\n' + charScenario + '\n\n';
    if (charFirstMes) userPrompt += '【开场白】\n' + charFirstMes + '\n\n';
    userPrompt += '【玩家设定】\n名字：' + (ctxData.playerName || '(未命名玩家)') + '\n描述：' + (ctxData.playerPersona || '(无)') + '\n\n';
    if (manualNames) userPrompt += '【玩家指定角色】\n' + manualNames + '\n\n';
    if (hasHistory) userPrompt += '【对话历史】\n' + ctxData.chat + '\n\n请分析对话，识别出场角色，输出 JSON 数组。';
    else userPrompt += '【对话历史】\n(无对话历史)\n\n请根据角色卡+开场白+玩家设定，识别出场角色，输出 JSON 数组。';
    showLoadingDialog(hasHistory ? 'AI 正在扫描对话历史...' : 'AI 正在分析开场白...');
    let reply = '';
    try { reply = await callOpeningModel(provider, sysPrompt, userPrompt); }
    catch (e) { closeLoadingDialog(); toast('调用模型失败：' + (e.message || e), 'warning'); return; }
    closeLoadingDialog();
    if (typeof reply !== 'string') reply = (reply && (reply.content || reply.text)) || String(reply);
    reply = String(reply).trim();
    const m = reply.match(/```(?:json)?\s*([\s\S]*?)```/i); if (m) reply = m[1].trim();
    let list = null;
    try { list = JSON.parse(reply); } catch (e) {}
    if (!list) { const m2 = reply.match(/\[[\s\S]*\]/); if (m2) { try { list = JSON.parse(m2[0]); } catch (e) {} } }
    if (!Array.isArray(list) || !list.length) { showModalDialog('❌ 解析失败', '<div>AI 未返回合法数组。</div>', null, { confirmText: '关闭' }); return; }
    const valid = list.filter(function(item) { return item && typeof item === 'object' && typeof item.名字 === 'string' && item.名字.trim(); });
    if (!valid.length) { showModalDialog('❌ 无有效角色', '<div>AI 返回的数组里没有有效角色名。</div>', null, { confirmText: '关闭' }); return; }
    openMultiCardAdaptiveResultDialog(valid);
  }

  function openMultiCardAdaptiveResultDialog(chars) {
    const rows = chars.map(function(c, idx) {
      const e = Number(c.好感度) || 0; const p = Number(c.肉体值) || 0;
      const name = String(c.名字 || '').trim(); const imp = String(c.重要度 || '主要');
      const emoji = String(c.情绪 || '😐'); const voice = String(c.心声 || '……'); const reason = String(c.推断理由 || '');
      const stage = getRStageFromE(e);
      return '<div class="moon-mc-row" data-idx="' + idx + '" style="padding:10px 12px;background:#171a22;border:1px solid rgba(148,163,184,0.15);border-radius:9px;margin-bottom:8px;">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#f8fafc;margin-bottom:8px;cursor:pointer;"><input type="checkbox" class="moon-mc-check" data-idx="' + idx + '" checked><span>' + name + '</span><span style="font-size:10px;color:#94a3b8;font-weight:400;">· ' + imp + ' · ' + emoji + '</span></label>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">' +
        '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">E</div><input type="number" step="0.5" class="moon-mc-e" data-idx="' + idx + '" value="' + e + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#22262f;color:#e2e8f0;font-size:12px;"></div>' +
        '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">P</div><input type="number" step="0.5" class="moon-mc-p" data-idx="' + idx + '" value="' + p + '" style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#22262f;color:#e2e8f0;font-size:12px;"></div>' +
        '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">R</div><div class="moon-mc-r" data-idx="' + idx + '" style="padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,0.15);background:#22262f;color:#a5f3fc;font-size:12px;">' + stage.r + ' · ' + stage.name + '</div></div></div>' +
        '<div style="margin-top:6px;font-size:10px;color:#94a3b8;">' + emoji + ' · ' + voice.replace(/</g, '&lt;') + '</div>' +
        '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;"><span style="font-size:10px;color:#94a3b8;">角色定位</span>' +
        '<select class="moon-mc-imp" data-idx="' + idx + '" style="flex:1;padding:5px 7px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);background:#22262f;color:#e2e8f0;font-size:11px;font-family:inherit;">' +
        ['主要', '次要', 'NPC'].map(function(v) { return '<option value="' + v + '"' + (imp === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
        '</select><span style="font-size:9.5px;color:#64748b;">主要=主攻略对象</span></div>' +
        (reason ? '<div style="margin-top:4px;font-size:10px;color:#64748b;">💡 ' + reason.replace(/</g, '&lt;') + '</div>' : '') + '</div>';
    }).join('');
    const html = '<div style="font-size:11px;color:#cbd5e1;line-height:1.7;margin-bottom:10px;">AI 识别到 <b style="color:#7dd3fc;">' + chars.length + '</b> 个出场角色。</div>' +
      '<div style="max-height:52dvh;overflow-y:auto;padding-right:4px;">' + rows + '</div>' +
      '<div style="margin-top:10px;font-size:10px;color:#64748b;line-height:1.6;">· 未勾选的角色不会写入<br>· 已存在的角色会被覆盖</div>';
    showModalDialogCancelable('🌅 多人卡 · 确认建档', html,
      async function() {
        const mask = mainDoc.getElementById('moon-modal-mask'); if (!mask) return;
        const finalList = [];
        mask.querySelectorAll('.moon-mc-row').forEach(function(row) {
          const idx = Number(row.getAttribute('data-idx')); const ck = row.querySelector('.moon-mc-check');
          if (!ck || !ck.checked) return;
          const c = chars[idx]; const eVal = Number(row.querySelector('.moon-mc-e').value) || 0;
          const pVal = Number(row.querySelector('.moon-mc-p').value) || 0; const stage = getRStageFromE(eVal);
          const impEl = row.querySelector('.moon-mc-imp');
          const impVal = impEl && ['主要', '次要', 'NPC'].indexOf(String(impEl.value)) >= 0 ? String(impEl.value) : (c.重要度 || '主要');
          finalList.push({ 名字: c.名字, 重要度: impVal, 好感度: eVal, 肉体值: pVal, 阶段值: stage.r, 嫉妒值: Number(c.嫉妒值) || 0, 情绪: c.情绪 || '😐', 心声: c.心声 || '……' });
        });
        try { mask.remove(); } catch (e) {}
        if (!finalList.length) { toast('未勾选任何角色', 'info'); return; }
        await applyMultiCardAdaptiveOpening(finalList);
      },
      function() { toast('已取消', 'info'); },
      { confirmText: '确认写入', cancelText: '取消',
        onOpen: function(mask) {
          mask.querySelectorAll('.moon-mc-e').forEach(function(input) {
            input.addEventListener('input', function() {
              const idx = input.getAttribute('data-idx'); const st = getRStageFromE(Number(input.value) || 0);
              const rEl = mask.querySelector('.moon-mc-r[data-idx="' + idx + '"]');
              if (rEl) rEl.textContent = st.r + ' · ' + st.name;
            });
          });
        }
      });
  }

  async function applyMultiCardAdaptiveOpening(list) {
    let data = readMvuLatest();
    let statData = (data && data.stat_data) ? data.stat_data : null;
    const now = '2000年01月01日 · 星期六 · 00:00';
    if (!statData) { statData = { 世界: { 时间: now, _内部流逝天数: 0, _上次推进时间: now }, 角色: {} }; statData[MIGRATED_FLAG] = true; }
    if (!statData.角色 || typeof statData.角色 !== 'object') statData.角色 = {};
    if (!statData.世界) statData.世界 = { 时间: now, _内部流逝天数: 0, _上次推进时间: now };
    list.forEach(function(item) {
      const name = item.名字;
      if (!name) return;
      const existed = statData.角色[name] && !isCharSkeleton(statData.角色[name]);
      if (existed) {
        const ch = statData.角色[name];
        ch.好感度 = item.好感度; ch.肉体值 = item.肉体值; ch.阶段值 = item.阶段值;
        ch.嫉妒值 = item.嫉妒值; ch.情绪 = item.情绪; ch.心声 = item.心声;
        ch.重要度 = ['主要', '次要', 'NPC'].indexOf(String(item.重要度)) >= 0 ? item.重要度 : (ch.重要度 || '主要');
        if (!ch._quota) ch._quota = {};
        ch._quota.自适应开局已完成 = true;
        if (ch._quota._playerConfession === undefined) ch._quota._playerConfession = false;
        if (ch._quota._firstMeetDone === undefined) ch._quota._firstMeetDone = false;
        if (!ch._quota._eventState) ch._quota._eventState = { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 };
        if (!Array.isArray(ch._quota._timelineCompleted)) ch._quota._timelineCompleted = [];
        if (!ch._quota._debuff) ch._quota._debuff = { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' };
      } else {
        statData.角色[name] = {
          语言: '日语', 英文名: '', 签名: '', 性别: '男', user爱称: '',
          好感度: item.好感度, 肉体值: item.肉体值, 阶段值: item.阶段值, 嫉妒值: item.嫉妒值,
          情绪: item.情绪, 心声: item.心声, 在场: true, 重要度: item.重要度 || '主要',
          _invidia: { 重力等级: '', 骰子判定阈值: 0, 每日衰减基数: 0, 大失败反噬值: 0, 主动互动阈值: 30 },
          _lastRoll: { 事件类型: '', 方向: '', 主维度: '', 基础值: 0 },
          _quota: {
            好感度周上限已用: 0, 周上限起始: now, R阶段门: false, 下次暗掷: now, 玩家本周已掷: false, 玩家冷却至: now,
            表白期排除: false, 表白期排除理由: '', 对用户特殊状态: '', 表白期已通过: false, 表白期冷却至: '', 自适应开局已完成: true,
            _playerConfession: false,
            _firstMeetDone: (Number(item.好感度) || 0) !== 0,
            _初见待结算: (Number(item.好感度) || 0) === 0,
            _eventState: { 当前事件: '', 事件类型: '', 剩余回合: 0, 冷却回合: 0, 强制日常期: 0, 上次投掷内部天数: 0, 上次大事件内部天数: 0, 上次投掷回合: 0, 上次大事件游戏日: 0 },
            _timelineCompleted: [],
            _debuff: { 冷战期: false, 冷却结束时间: '', 剩余掷骰次数: 3, 冷战期严重度: '' }
          }
        };
      }
    });
    const ok = await writeMvuLatest(statData);
    if (ok) { toast('多人卡批量建档完成：' + list.length + ' 个角色', 'success'); try { refreshPanel(); } catch (e) {} }
    else toast('写入失败：' + (lastWriteError || '未知原因'), 'warning');
  }

  const PENDING_MIGRATION_KEY = 'moon_phase_pending_migration';

