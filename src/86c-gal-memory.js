/* 86c-gal-memory.js —— 记忆适配层。
   三模式互斥：builtin 自己做；external 全停并检测插件；off 什么都不做。
   第三方失效时只提醒，绝不静默切回内置（否则剧情记忆会出现断层）。 */

  const GAL_MEMORY_PLUGIN_KEYS = [
    { key: 'summary', label: 'Summary / 摘要记忆' },
    { key: 'memory', label: 'Memory 记忆扩展' },
    { key: 'st-memory', label: 'ST Memory' },
    { key: 'long-term-memory', label: 'Long-Term Memory' },
    { key: 'vectordb', label: 'Vector Storage 向量记忆' },
    { key: 'vector-storage', label: 'Vector Storage 向量记忆' },
    { key: 'chronicle', label: 'Chronicle 编年史' },
    { key: 'memory_enhancement', label: '记忆增强扩展' },
    { key: 'qrf', label: 'Quick Reply 记忆插件' }
  ];

  let _galMemoryBrokenToastAt = 0;

  function galDefaultMemory() {
    return { version: 1, turns: [], stages: [], long: [], updatedAt: 0, builtinSince: Date.now() };
  }
  function galGetMemory() {
    const raw = readChatFeatureValue(GAL_MEMORY_KEY, null);
    const mem = Object.assign(galDefaultMemory(), raw && typeof raw === 'object' ? raw : {});
    if (!Array.isArray(mem.turns)) mem.turns = [];
    if (!Array.isArray(mem.stages)) mem.stages = [];
    if (!Array.isArray(mem.long)) mem.long = [];
    return mem;
  }
  function galSaveMemory(mem) {
    const next = Object.assign(galDefaultMemory(), mem || {});
    next.updatedAt = Date.now();
    // 硬上限，防止长聊天把 metadata 撑爆
    if (next.turns.length > 60) next.turns = next.turns.slice(-60);
    if (next.stages.length > 30) next.stages = next.stages.slice(-30);
    if (next.long.length > 20) next.long = next.long.slice(-20);
    writeChatFeatureValue(GAL_MEMORY_KEY, next);
    return next;
  }
  function galClearMemory() {
    galSaveMemory(galDefaultMemory());
    try { callSetPrompt(GAL_PROMPT_KEY, '', 0, 0, false); } catch (e) {}
  }

  /* ── 第三方记忆插件探测 ───────────────────────────────── */
  function galDetectMemoryPlugins() {
    const found = [];
    let ext = null;
    try { const ctx = getSTCtx(); ext = (ctx && ctx.extensionSettings) || null; } catch (e) { ext = null; }
    if (ext && typeof ext === 'object') {
      GAL_MEMORY_PLUGIN_KEYS.forEach(function(meta) {
        const cfg = ext[meta.key];
        if (!cfg) return;
        const enabled = cfg.enabled !== false && cfg.disabled !== true;
        if (found.some(function(f) { return f.label === meta.label; })) return;
        found.push({ key: meta.key, label: meta.label, enabled: enabled, source: 'extensionSettings' });
      });
    }
    try {
      const nodes = mainDoc.querySelectorAll('[data-extension-id], [data-extension-name]');
      for (let i = 0; i < nodes.length; i++) {
        const id = String(nodes[i].getAttribute('data-extension-id') || nodes[i].getAttribute('data-extension-name') || '').toLowerCase();
        if (!id) continue;
        if (!/summar|memory|vector|chronicle|chronicle/.test(id)) continue;
        if (found.some(function(f) { return f.key === id; })) continue;
        found.push({ key: id, label: id, enabled: true, source: 'dom' });
      }
    } catch (e) {}
    return found;
  }

  /* external 模式下是否真的有一个可用接管方 */
  function galExternalMemoryUsable() {
    const list = galDetectMemoryPlugins();
    return { usable: list.some(function(p) { return p.enabled; }), plugins: list };
  }

  /* ── 内置记忆：抽取式，零额外 AI 调用 ─────────────────────
     为什么要抽取而不是再调一次模型：记忆整理每 3 回合一次，如果每次都调模型，
     长聊天的 token 与等待成本会翻倍。这里用确定性抽取，稳定、免费、可测试。 */
  function galCondenseForMemory(text, maxLen) {
    const clean = galCleanMessage(text).replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const limit = maxLen || 220;
    if (clean.length <= limit) return clean;
    // 优先保留带引号的台词与含情绪转折的句子
    const sentences = galSplitSentences(clean);
    const scored = sentences.map(function(s, i) {
      let score = 0;
      if (/[「“"]/.test(s)) score += 3;
      if (/(?:喜欢|讨厌|害怕|生气|哭|笑|拥抱|吻|离开|答应|拒绝|道歉|告白)/.test(s)) score += 2;
      score += Math.min(2, s.length / 60);
      return { s: s, i: i, score: score };
    });
    scored.sort(function(a, b) { return b.score - a.score || a.i - b.i; });
    let out = '';
    for (let i = 0; i < scored.length; i++) {
      const piece = scored[i].s;
      if ((out + piece).length > limit) continue;
      out += piece;
      if (out.length >= limit * 0.8) break;
    }
    if (!out) out = clean.slice(0, limit);
    return out;
  }

  function galMemoryAppendTurn(floorIdx) {
    if (galGetMemoryMode() !== 'builtin') return null;
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) { return null; }
    if (!ctx || !Array.isArray(ctx.chat) || !ctx.chat[floorIdx]) return null;
    const msg = ctx.chat[floorIdx];
    if (!msg || msg.is_user) return null;
    const mem = galGetMemory();
    if (mem.turns.some(function(t) { return t.floor === floorIdx; })) return mem; // 同楼层不重复记
    const text = galCondenseForMemory(msg.mes, 220);
    if (!text) return mem;
    mem.turns.push({ floor: floorIdx, text: text, at: Date.now() });
    if (mem.turns.length > 60) mem.turns = mem.turns.slice(-60);
    const s = galGetSettings();
    const stageEvery = Math.max(2, Number(s.memoryStageEvery) || 3);
    const longEvery = Math.max(6, Number(s.memoryLongEvery) || 12);
    // 每 N 回合整合一次阶段摘要
    if (mem.turns.length % stageEvery === 0) {
      const group = mem.turns.slice(-stageEvery);
      const summary = galBuildStageSummary(group);
      if (summary) {
        mem.stages.push({
          from: group[0].floor, to: group[group.length - 1].floor,
          text: summary, at: Date.now()
        });
      }
    }
    // 每 M 回合滚动进长期记忆
    if (mem.turns.length % longEvery === 0) {
      const recentStages = mem.stages.slice(-4);
      if (recentStages.length) {
        const longText = recentStages.map(function(st) { return st.text; }).join(' ');
        mem.long.push({
          from: recentStages[0].from, to: recentStages[recentStages.length - 1].to,
          text: galCondenseForMemory(longText, 420), at: Date.now()
        });
      }
    }
    return galSaveMemory(mem);
  }

  function galBuildStageSummary(turns) {
    const joined = (turns || []).map(function(t) { return t.text; }).join(' ');
    return galCondenseForMemory(joined, 180);
  }

  /* ── 注入：优先级从高到低，只发有效内容 ────────────────── */
  function galBuildMemoryPrompt() {
    if (galGetMemoryMode() !== 'builtin') return '';
    const s = galGetSettings();
    if (s.memoryInject === false) return '';
    const mem = galGetMemory();
    if (!mem.turns.length && !mem.stages.length && !mem.long.length) return '';

    const parts = [];
    // ① 当前场景 / 未完成事件
    const sceneBits = [];
    const st = galGetState();
    if (st.view && st.view.bg) sceneBits.push('当前背景已切换（' + String(st.view.bg).slice(0, 60) + '）');
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) {}
    if (ctx && Array.isArray(ctx.chat)) {
      for (let i = ctx.chat.length - 1; i >= 0; i--) {
        const m = ctx.chat[i];
        if (!m || m.is_user) continue;
        const tail = galCondenseForMemory(m.mes, 160);
        if (tail) { sceneBits.push('最新场景：' + tail); }
        break;
      }
    }
    const data = readMvuLatest();
    const chars = (data && data.stat_data && data.stat_data.角色) || {};
    const charBits = [];
    Object.keys(chars).forEach(function(n) {
      const c = chars[n];
      if (!c || isCharSkeleton(c)) return;
      const emo = String(c.情绪 || '').trim();
      const inn = String(c.心声 || '').trim();
      if (emo || inn) charBits.push(n + (emo ? '（' + emo + '）' : '') + (inn && inn !== '……' ? '：' + inn.slice(0, 40) : ''));
    });
    if (charBits.length) sceneBits.push('当前情绪：' + charBits.slice(0, 4).join('；'));
    if (sceneBits.length) parts.push('【当前场景与状态】\n· ' + sceneBits.join('\n· '));

    // ② 最近三回合
    const recent = mem.turns.slice(-3);
    if (recent.length) {
      parts.push('【最近三回合】\n' + recent.map(function(t) { return '· ' + t.text; }).join('\n'));
    }
    // ③ 阶段摘要（取最近 3 条）
    const stages = mem.stages.slice(-3);
    if (stages.length) {
      parts.push('【阶段摘要】\n' + stages.map(function(stage) { return '· ' + stage.text; }).join('\n'));
    }
    // ④ 长期记忆（取最近 2 条）
    const longs = mem.long.slice(-2);
    if (longs.length) {
      parts.push('【长期剧情记忆】\n' + longs.map(function(l) { return '· ' + l.text; }).join('\n'));
    }
    if (!parts.length) return '';
    return '═══════════════════════════════════\n' +
      '【月相 · 剧情记忆（只作连续性参考，不要复述）】\n' +
      parts.join('\n\n') + '\n' +
      '═══════════════════════════════════';
  }

  function injectGalMemoryPrompt() {
    const mode = galGetMemoryMode();
    if (mode !== 'builtin') {
      // 非内置模式必须把旧的内置注入清掉，否则会和第三方打架
      try { callSetPrompt(GAL_PROMPT_KEY, '', 0, 0, false); } catch (e) {}
      return false;
    }
    const text = galBuildMemoryPrompt();
    if (!text) { try { callSetPrompt(GAL_PROMPT_KEY, '', 0, 0, false); } catch (e) {} return false; }
    callSetPrompt(GAL_PROMPT_KEY, text, 4, 1, false);
    return true;
  }

  function galMemoryHint() {
    const s = galGetSettings();
    const mode = s.memoryMode;
    const mem = galGetMemory();
    const ext = galDetectMemoryPlugins();
    let warning = '';
    if (mode === 'external') {
      const usable = ext.some(function(p) { return p.enabled; });
      if (!usable) warning = '未检测到已启用的第三方记忆插件。内置记忆已全部停止，现在不会有任何剧情记忆被注入。';
    }
    return {
      mode: mode,
      label: { builtin: '月相内置记忆', external: '第三方记忆接管', off: '完全关闭' }[mode] || mode,
      turns: mem.turns.length, stages: mem.stages.length, longs: mem.long.length,
      plugins: ext, warning: warning,
      lastAt: mem.updatedAt || 0
    };
  }

  /* 外部记忆失效时提醒一次（每 10 分钟最多一次，避免刷屏） */
  function galMemoryWarnIfBroken() {
    if (galGetMemoryMode() !== 'external') return;
    const usable = galExternalMemoryUsable();
    if (usable.usable) return;
    const now = Date.now();
    if (now - _galMemoryBrokenToastAt < 600000) return;
    _galMemoryBrokenToastAt = now;
    toast('第三方记忆插件未启用：本月相已停止自己的记忆注入，请检查插件或切回「月相内置记忆」', 'warning');
  }
