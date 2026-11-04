  function parseGalgameEndingPayload(rawBody) {
    const cleaned = cleanHtmlToPlainForRegex(rawBody);
    if (!cleaned) return null;
    const data = readMvuLatest();
    const chars = (data && data.stat_data && data.stat_data.角色) || {};
    const names = Object.keys(chars).filter(function(n) { return !isCharSkeleton(chars[n]); });
    const defaultCharName = names[0] || '攻略角色';
    const defaultCh = chars[defaultCharName] || {};
    const defaultTime = String(readVar('世界.时间', '终幕时刻'));

    const fields = {};
    // 尝试 JSON 解析兜底
    if (cleaned.indexOf('{') >= 0 && cleaned.lastIndexOf('}') > cleaned.indexOf('{')) {
      try {
        const j = extractJson(cleaned);
        if (j && typeof j === 'object') {
          Object.keys(j).forEach(function(k) { fields[k.toLowerCase()] = String(j[k] || '').trim(); });
        }
      } catch (e) {}
    }

    // 解析管道符 | 或换行分隔的 key=value
    const tokens = cleaned.split(/[|｜\r\n]+/).map(function(s) { return s.trim(); }).filter(Boolean);
    tokens.forEach(function(tok) {
      const m = tok.match(/^([^=＝:：]{1,18})[=＝:：]\s*([\s\S]+)$/);
      if (!m) return;
      const key = m[1].trim().toLowerCase();
      const val = m[2].trim();
      if (!val) return;
      if (key === '结局名' || key === '结局' || key === '标题' || key === 'title') fields.title = val;
      else if (key === '类型' || key === '路线' || key === 'type' || key === 'endingtype' || key === 'route') fields.endingType = val;
      else if (key === '角色' || key === '女主' || key === '攻略角色' || key === 'char' || key === 'charname') fields.charName = val;
      else if (key === '时间' || key === '世界时间' || key === '历经时间' || key === 'time' || key === 'totaltime') fields.totalTime = val;
      else if (key === '四维' || key === '数值' || key === '终局四维' || key === 'stats') fields.stats = val;
      else if (key === '转折' || key === '关键时刻' || key === '分歧点' || key === 'keymoment') fields.keyMoment = val;
      else if (key === '复盘' || key === '纪要' || key === '总结' || key === 'summary') fields.summary = val;
      else if (key === '独白' || key === '心声' || key === '终幕独白' || key === 'monologue') fields.monologue = val;
      else if (key === 'cg' || key === 'cgprompt' || key === 'prompt' || key === '画面' || key === '提示词') fields.cgPrompt = val;
    });

    const charName = String(fields.charName || fields.char || defaultCharName).slice(0, 60);
    const chObj = chars[charName] || defaultCh || {};
    let E = Number(chObj.好感度) || 0;
    let P = Number(chObj.肉体值) || 0;
    let R = Number(chObj.阶段值) || 0;
    let I = Number(chObj.嫉妒值) || 0;
    if (fields.stats) {
      const mE = fields.stats.match(/(?:E|好感(?:度)?)[\s:：=]*([+-]?\d+(?:\.\d+)?)/i);
      const mP = fields.stats.match(/(?:P|肉体(?:值)?)[\s:：=]*([+-]?\d+(?:\.\d+)?)/i);
      const mR = fields.stats.match(/(?:R|阶段(?:值)?)[\s:：=]*([+-]?\d+(?:\.\d+)?)/i);
      const mI = fields.stats.match(/(?:I|嫉妒(?:值)?)[\s:：=]*([+-]?\d+(?:\.\d+)?)/i);
      if (mE) E = parseFloat(mE[1]);
      if (mP) P = parseFloat(mP[1]);
      if (mR) R = parseFloat(mR[1]);
      if (mI) I = parseFloat(mI[1]);
    }

    let rawType = String(fields.endingType || fields.endingtype || 'TE').trim();
    if (/happy|圆满|^he$/i.test(rawType)) rawType = 'HE';
    else if (/bad|悲恋|悲剧|^be$/i.test(rawType)) rawType = 'BE';
    else if (/cage|囚禁/i.test(rawType)) rawType = 'CageEnd';
    else if (/userdeath|玩家死亡|陨落/i.test(rawType)) rawType = 'UserDeathEnd';
    else if (/chardeath|角色死亡|永诀/i.test(rawType)) rawType = 'CharDeathEnd';
    else if (/true|真结局|^te$/i.test(rawType)) rawType = 'TE';

    const title = String(fields.title || (charName + '之篇 · 终末之约')).replace(/^[《「『]|[》」』]$/g, '').slice(0, 80);
    const totalTime = String(fields.totalTime || fields.totaltime || defaultTime).slice(0, 80);
    const keyMoment = String(fields.keyMoment || fields.keymoment || '命运交叉点上的最终抉择').slice(0, 260);
    const summary = String(fields.summary || '漫长的相遇与抉择，在此刻收束为这一周目的最终注脚。').slice(0, 500);
    const monologue = String(fields.monologue || '倘若时光倒流，我仍会记得与你相遇的这一刻。').replace(/^[“「『]|[”」』]$/g, '').slice(0, 300);
    let cgPrompt = String(fields.cgPrompt || fields.cgprompt || ('horizontal composition, 16:9 aspect ratio, widescreen, cinematic anime visual novel ending CG, ' + charName + ', emotional finale scene')).slice(0, 2500);
    if (!/horizontal composition|16:9/i.test(cgPrompt)) {
      cgPrompt = 'horizontal composition, 16:9 aspect ratio, widescreen, ' + cgPrompt;
    }

    const endingId = 'ending_chat_' + stableFeatureHash(charName + '::' + title + '::' + rawType);
    const record = {
      id: endingId,
      title: title,
      endingType: rawType,
      charName: charName,
      totalTime: totalTime,
      E: E,
      P: P,
      R: R,
      I: I,
      summary: summary,
      monologue: monologue,
      keyMoment: keyMoment,
      cgPrompt: cgPrompt,
      createdAt: Date.now()
    };
    ensureEndingRecordArchived(record);
    return record;
  }

  function ensureEndingRecordArchived(record) {
    if (!record || !record.id) return;
    try {
      const archive = getEndingArchive();
      const existsIdx = archive.records.findIndex(function(r) { return r && r.id === record.id; });
      if (existsIdx < 0) {
        archive.records.unshift(record);
        saveEndingArchive(archive);
      } else {
        archive.records[existsIdx] = Object.assign({}, archive.records[existsIdx], record, { createdAt: archive.records[existsIdx].createdAt || record.createdAt });
        saveEndingArchive(archive);
      }
      const gallery = getGalleryList();
      const galIdx = gallery.findIndex(function(item) { return item && item.id === record.id; });
      if (galIdx < 0) {
        gallery.unshift({
          id: record.id,
          char: record.charName,
          title: record.title,
          desc: record.summary,
          prompt: record.cgPrompt,
          uc: getImageGenConfig().imageNegativePrompt,
          imageKey: '',
          imageUrl: '',
          createdAt: record.createdAt,
          isEnding: true,
          endingType: record.endingType
        });
        saveGalleryList(gallery);
      }
    } catch (e) {}
  }

  function renderGalgameEndingCurtainHtml(record) {
    const meta = ENDING_ROUTE_META[record.endingType] || ENDING_ROUTE_META.CustomEnd;
    const playerInfo = collectCurrentPlayerPersona();
    const playerName = (playerInfo && playerInfo.name && playerInfo.name !== '(未命名玩家)') ? playerInfo.name : 'PLAYER / 观测者';
    const stageName = getRStageFromE(record.E).name;
    const payloadJson = escapeFeatureHtml(JSON.stringify({
      id: record.id,
      title: record.title,
      endingType: record.endingType,
      charName: record.charName,
      totalTime: record.totalTime,
      E: record.E,
      P: record.P,
      R: record.R,
      I: record.I,
      summary: record.summary,
      monologue: record.monologue,
      keyMoment: record.keyMoment,
      cgPrompt: record.cgPrompt,
      createdAt: record.createdAt
    }));

    return '<div class="mp-galgame-ending-curtain" data-mp-ending-card="' + escapeFeatureHtml(record.id) + '" data-mp-ending-payload="' + payloadJson + '" style="margin:14px 0 10px;border:2px solid ' + meta.border + ';border-radius:6px;background:radial-gradient(circle at 50% 0%,' + meta.bgGlow + ',rgba(12,7,16,0.98) 68%),linear-gradient(180deg,#14091a 0%,#08050b 100%);color:#fce7f3;font-family:\"MP Fusion Pixel\",\"Noto Serif SC\",\"Microsoft YaHei\",sans-serif;box-shadow:0 12px 32px rgba(0,0,0,0.85),inset 0 0 24px ' + meta.bgGlow + ';overflow:hidden;position:relative;">' +
      '<!-- 顶部电影黑边报幕栏 -->' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;background:linear-gradient(90deg,#050307,#210d20,#050307);border-bottom:1px solid rgba(244,114,208,0.4);font-size:10px;letter-spacing:1.5px;color:#f9a8d4;font-family:monospace;">' +
        '<span>🎬 VISUAL NOVEL ENDING CREDITS · 終幕報幕</span>' +
        '<span style="color:#fde047;">✦ WORLDLINE CONVERGENCE ✦</span>' +
      '</div>' +
      '<!-- 中央结局主标题舞台 -->' +
      '<div style="padding:18px 18px 14px;text-align:center;border-bottom:1px dashed rgba(244,114,208,0.32);background:radial-gradient(ellipse at center,rgba(244,114,208,0.10) 0%,transparent 75%);">' +
        '<div style="display:inline-block;padding:3px 14px;border:1px solid ' + meta.accent + ';background:rgba(20,9,24,0.88);color:' + meta.accent + ';font-size:11px;font-weight:700;letter-spacing:2px;box-shadow:2px 2px 0 rgba(0,0,0,0.6);">' +
          '✦ ' + escapeFeatureHtml(meta.badge) + ' ✦' +
        '</div>' +
        '<div style="font-size:10px;color:#cbd5e1;letter-spacing:2px;margin-top:5px;opacity:0.85;">' + escapeFeatureHtml(meta.jp) + '</div>' +
        '<div style="font-size:21px;font-weight:700;color:#ffffff;margin:10px 0 6px;letter-spacing:1.5px;text-shadow:0 2px 12px ' + meta.accent + ';">' +
          '『 ' + escapeFeatureHtml(record.title) + ' 』' +
        '</div>' +
        '<div style="font-size:10px;color:#f9a8d4;letter-spacing:3px;opacity:0.85;">─── ❖ ───  S T A F F   &amp;   C A S T   R O L L  ─── ❖ ───</div>' +
      '</div>' +
      '<!-- 双栏日系 Galgame 报幕演职员与轨迹表 -->' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;padding:14px 16px;background:rgba(9,5,13,0.72);">' +
        '<!-- 左栏：CAST / 出演与终局羁绊 -->' +
        '<div style="padding:10px 12px;background:rgba(24,12,29,0.85);border:1px solid rgba(244,114,208,0.32);border-left:3px solid ' + meta.accent + ';">' +
          '<div style="font-size:10px;color:' + meta.subAccent + ';letter-spacing:1.5px;font-weight:700;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:4px;">◈ CAST &amp; PARAMETER · 登场人物与终局数值</div>' +
          '<div style="font-size:11.5px;line-height:1.85;color:#f8dbf0;">' +
            '<div><span style="color:#94a3b8;font-size:10.5px;">HEROINE / 攻略角色：</span><b style="color:#fff;">' + escapeFeatureHtml(record.charName) + '</b> <span style="font-size:10px;padding:1px 5px;background:#35132d;border:1px solid #f472d0;color:#ffb8eb;">' + escapeFeatureHtml(stageName) + '</span></div>' +
            '<div><span style="color:#94a3b8;font-size:10.5px;">OBSERVER / 玩家视点：</span><b style="color:#fde047;">' + escapeFeatureHtml(playerName) + '</b></div>' +
            '<div><span style="color:#94a3b8;font-size:10.5px;">WORLD TIME / 历经岁月：</span><span style="color:#7dd3fc;">' + escapeFeatureHtml(record.totalTime) + '</span></div>' +
            '<div style="margin-top:5px;padding-top:5px;border-top:1px dashed rgba(244,114,208,0.22);display:flex;gap:6px;flex-wrap:wrap;font-family:monospace;font-size:11px;">' +
              '<span style="padding:1px 6px;background:#1f0d22;border:1px solid #f472d0;color:#ffb8eb;">好感 E:' + record.E + '</span>' +
              '<span style="padding:1px 6px;background:#1f0d22;border:1px solid #fb7185;color:#fecdd3;">肉体 P:' + record.P + '</span>' +
              '<span style="padding:1px 6px;background:#0f1d2e;border:1px solid #38bdf8;color:#bae6fd;">阶段 R:' + record.R + '</span>' +
              '<span style="padding:1px 6px;background:#231230;border:1px solid #c084fc;color:#e9d5ff;">嫉妒 I:' + record.I + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<!-- 右栏：STORY ARCHIVE / 命运分歧与周目复盘 -->' +
        '<div style="padding:10px 12px;background:rgba(24,12,29,0.85);border:1px solid rgba(244,114,208,0.32);border-left:3px solid ' + meta.subAccent + ';">' +
          '<div style="font-size:10px;color:' + meta.subAccent + ';letter-spacing:1.5px;font-weight:700;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:4px;">◈ STORY &amp; DIRECTION · 命运轨迹与周目纪要</div>' +
          '<div style="font-size:11.5px;line-height:1.75;color:#f8dbf0;">' +
            '<div style="margin-bottom:6px;"><span style="color:#fde047;font-weight:700;">★ 命运分歧点：</span><span>' + escapeFeatureHtml(record.keyMoment) + '</span></div>' +
            '<div><span style="color:#f9a8d4;font-weight:700;">✦ 终幕复盘：</span><span style="color:#e2e8f0;">' + escapeFeatureHtml(record.summary) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<!-- 经典 Galgame 底部 ADV 台词框：角色终幕独白 -->' +
      '<div style="margin:2px 16px 12px;padding:12px 15px;background:linear-gradient(180deg,rgba(32,12,34,0.92),rgba(14,7,18,0.96));border:1px solid ' + meta.accent + ';box-shadow:inset 0 0 14px rgba(244,114,208,0.15);position:relative;">' +
        '<div style="display:inline-block;padding:2px 10px;background:' + meta.accent + ';color:#09050b;font-size:10.5px;font-weight:700;margin-bottom:6px;letter-spacing:1px;">' +
          '【 ' + escapeFeatureHtml(record.charName) + ' · 終幕独白 】' +
        '</div>' +
        '<div style="font-size:12.5px;line-height:1.85;color:#ffffff;font-style:italic;letter-spacing:0.5px;">' +
          '「 ' + escapeFeatureHtml(record.monologue) + ' 」<span style="color:' + meta.accent + ';margin-left:6px;font-style:normal;">▼</span>' +
        '</div>' +
      '</div>' +
      '<!-- 终幕后日谈互动询问栏（内置正则交互：是否查看后日谈，点击自动填入聊天框并发送） -->' +
      '<div style="margin:0 16px 12px;padding:11px 14px;background:linear-gradient(90deg,rgba(14,32,52,0.94),rgba(34,13,40,0.94));border:1px dashed #7dd3fc;border-left:3px solid #7dd3fc;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:inset 0 0 14px rgba(125,211,252,0.14);">' +
        '<div style="flex:1;min-width:200px;font-size:11.5px;line-height:1.65;color:#e0f2fe;">' +
          '<div style="font-weight:700;color:#7dd3fc;letter-spacing:0.8px;">📖 AFTER STORY · 是否查看《' + escapeFeatureHtml(record.charName) + '》视角后日谈番外？</div>' +
          '<div style="font-size:10.5px;color:#cbd5e1;">点下方按钮将自动填充提示词至聊天输入框并发送，让 AI 在当前对话内以《' + escapeFeatureHtml(record.charName) + '》视角继续创作一篇 <b>5000～8000字</b> 的结局后完整番外</div>' +
        '</div>' +
        '<button type="button" data-mp-ending-action="epilogue" data-mp-ending-id="' + escapeFeatureHtml(record.id) + '" style="padding:8px 14px;border:1px solid #7dd3fc;background:linear-gradient(180deg,#163c5e,#0c2136);color:#f0f9ff;font:700 11.5px monospace;cursor:pointer;box-shadow:2px 2px 0 #060d17;white-space:nowrap;">✨ 查看后日谈（自动填入发送）</button>' +
      '</div>' +
      '<!-- 报幕互动操作台（显影结局CG / 查看后日谈 / 导出结算卡 / 回忆画廊） -->' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;padding:0 16px 12px;">' +
        '<button type="button" data-mp-ending-action="cg" data-mp-ending-id="' + escapeFeatureHtml(record.id) + '" style="flex:1;min-width:120px;padding:7px 8px;border:1px solid #f472d0;background:#381230;color:#ffe4f7;font:700 11px monospace;cursor:pointer;box-shadow:2px 2px 0 #09050c;">🖼️ 显影结局 CG (横构图)</button>' +
        '<button type="button" data-mp-ending-action="epilogue" data-mp-ending-id="' + escapeFeatureHtml(record.id) + '" style="flex:1;min-width:120px;padding:7px 8px;border:1px solid #7dd3fc;background:#102338;color:#e0f2fe;font:700 11px monospace;cursor:pointer;box-shadow:2px 2px 0 #09050c;">📖 查看后日谈 (5000~8000字番外)</button>' +
        '<button type="button" data-mp-ending-action="share" data-mp-ending-id="' + escapeFeatureHtml(record.id) + '" style="flex:1;min-width:105px;padding:7px 8px;border:1px solid #fde047;background:#2d2110;color:#fef08a;font:700 11px monospace;cursor:pointer;box-shadow:2px 2px 0 #09050c;">📸 导出结算卡</button>' +
        '<button type="button" data-mp-ending-action="gallery" data-mp-ending-id="' + escapeFeatureHtml(record.id) + '" style="padding:7px 10px;border:1px solid #a855f7;background:#211132;color:#f3e8ff;font:700 11px monospace;cursor:pointer;box-shadow:2px 2px 0 #09050c;">🏆 画廊</button>' +
      '</div>' +
      '<!-- 底部 Staff 铭牌与 Fin. 落款 -->' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 16px;background:#060309;border-top:1px solid rgba(244,114,208,0.3);font-size:10px;color:#a38ea1;font-family:monospace;">' +
        '<span>DIRECTOR : MOON POCKET GALGAME SYSTEM</span>' +
        '<span style="color:#f9a8d4;font-weight:700;font-size:11.5px;letter-spacing:1.5px;">— Fin. —　Thank you for playing ♥</span>' +
      '</div>' +
    '</div>';
  }

  function bindGalgameEndingCardDelegation() {
    if (mainDoc._mpEndingDelegationBound) return;
    mainDoc._mpEndingDelegationBound = true;
    mainDoc.addEventListener('click', function(ev) {
      const btn = ev.target && ev.target.closest ? ev.target.closest('[data-mp-ending-action]') : null;
      if (!btn) return;
      ev.preventDefault();
      const action = btn.getAttribute('data-mp-ending-action');
      const endingId = btn.getAttribute('data-mp-ending-id') || '';
      const cardEl = btn.closest('[data-mp-ending-card]');
      let payload = null;
      if (cardEl && cardEl.getAttribute('data-mp-ending-payload')) {
        try { payload = JSON.parse(cardEl.getAttribute('data-mp-ending-payload')); } catch (e) {}
      }
      const archive = getEndingArchive();
      let record = archive.records.find(function(r) { return r && r.id === endingId; }) || payload;
      if (record) ensureEndingRecordArchived(record);

      if (action === 'gallery') {
        openMemoryGalleryDialog();
        return;
      }
      if (!record) {
        toast('未找到该结局记录，请打开回忆画廊查看', 'warning');
        return;
      }
      if (action === 'cg') {
        const galItem = getGalleryList().find(function(item) { return item && item.id === record.id; }) || {
          id: record.id,
          char: record.charName,
          title: record.title,
          desc: record.summary,
          prompt: record.cgPrompt,
          uc: getImageGenConfig().imageNegativePrompt,
          imageKey: '',
          imageUrl: '',
          createdAt: record.createdAt || Date.now(),
          isEnding: true,
          endingType: record.endingType
        };
        developCGItem(galItem);
      } else if (action === 'epilogue') {
        injectAndSendEpiloguePromptToChatbox(record);
      } else if (action === 'epilogue_modal') {
        startEpilogueGenerationEngine(record.charName, record);
      } else if (action === 'share') {
        generateSteamShareCard(record);
      }
    });

    mainDoc.addEventListener('click', function(ev) {
      const expBtn = ev.target && ev.target.closest ? ev.target.closest('[data-mp-epilogue-export]') : null;
      if (!expBtn) return;
      ev.preventDefault();
      const card = expBtn.closest('[data-mp-epilogue-card]');
      if (!card) return;
      const title = card.getAttribute('data-mp-epilogue-title') || '终局后日谈番外';
      const charName = card.getAttribute('data-mp-epilogue-char') || '角色';
      const bodyEl = card.querySelector('.mp-galgame-epilogue-body');
      const rawText = bodyEl ? (bodyEl.innerText || bodyEl.textContent || '') : '';
      if (!rawText.trim()) {
        toast('未读取到后日谈正文内容', 'warning');
        return;
      }
      const header = '# 《' + title + '》\n> 叙事视角：' + charName + '\n\n';
      const blob = new Blob([header + rawText.trim()], { type: 'text/plain;charset=utf-8' });
      const url = (mainWin.URL || URL).createObjectURL(blob);
      downloadFileViaBrowser(url, '后日谈_' + String(charName + '_' + title).replace(/[\\/:*?"<>|]/g, '_') + '.txt');
      setTimeout(function() { try { (mainWin.URL || URL).revokeObjectURL(url); } catch (e) {} }, 5000);
    });
  }

  function parseGalgameEpilogueXml(attrStr, innerHtml) {
    const attrs = String(attrStr || '').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
    const getAttr = function(name) {
      const m = attrs.match(new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', 'i'));
      return m ? m[1].trim() : '';
    };
    const title = getAttr('title') || getAttr('标题') || '终幕之后 · 角色视角番外';
    const charName = getAttr('char') || getAttr('角色') || '她';
    const endingTitle = getAttr('ending') || getAttr('结局') || '命定终局';
    const bodyHtml = String(innerHtml || '').trim();
    if (!bodyHtml) return null;
    return { title: title, charName: charName, endingTitle: endingTitle, bodyHtml: bodyHtml };
  }

  function parseGalgameEpilogueBracket(rawBody) {
    if (!rawBody) return null;
    const cleaned = String(rawBody).replace(/<br\s*\/?>/gi, '\n').trim();
    const parts = cleaned.split(/[|｜]/);
    const map = {};
    const freeParts = [];
    parts.forEach(function(seg) {
      const eqIdx = seg.search(/[=:：]/);
      if (eqIdx > 0 && eqIdx < 12) {
        const k = seg.slice(0, eqIdx).replace(/<[^>]+>/g, '').trim().toLowerCase();
        const v = seg.slice(eqIdx + 1).trim();
        map[k] = v;
      } else {
        freeParts.push(seg.trim());
      }
    });
    const title = map['标题'] || map['title'] || '终幕之后 · 角色视角番外';
    const charName = map['角色'] || map['char'] || '她';
    const endingTitle = map['结局'] || map['ending'] || '命定终局';
    const bodyText = map['正文'] || map['content'] || freeParts.join('\n\n');
    if (!bodyText) return null;
    const bodyHtml = bodyText
      .split(/\n{2,}/)
      .map(function(p) { return '<p style="margin:0 0 12px;text-indent:2em;">' + p.replace(/\n/g, '<br>') + '</p>'; })
      .join('');
    return { title: title, charName: charName, endingTitle: endingTitle, bodyHtml: bodyHtml };
  }

  function renderGalgameEpilogueCurtainHtml(ep) {
    const plainLen = String(ep.bodyHtml || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
    return '<div class="mp-galgame-epilogue-card" data-mp-epilogue-card="1" data-mp-epilogue-title="' + escapeFeatureHtml(ep.title) + '" data-mp-epilogue-char="' + escapeFeatureHtml(ep.charName) + '" style="margin:14px 0 10px;border:2px solid #7dd3fc;border-radius:6px;background:radial-gradient(circle at 50% 0%,rgba(56,189,248,0.16),rgba(10,7,16,0.98) 70%),linear-gradient(180deg,#101929 0%,#09060e 100%);color:#f8fafc;font-family:\"MP Fusion Pixel\",\"Noto Serif SC\",\"Microsoft YaHei\",serif;box-shadow:0 12px 32px rgba(0,0,0,0.85),inset 0 0 24px rgba(56,189,248,0.12);overflow:hidden;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;background:linear-gradient(90deg,#060b14,#132840,#060b14);border-bottom:1px solid rgba(125,211,252,0.4);font-size:10.5px;letter-spacing:1.5px;color:#7dd3fc;font-family:monospace;">' +
        '<span>📖 VISUAL NOVEL AFTER STORY · 終局後日談番外</span>' +
        '<span style="color:#fde047;">✦ POV : ' + escapeFeatureHtml(ep.charName) + ' · 约 ' + plainLen + ' 字 ✦</span>' +
      '</div>' +
      '<div style="padding:18px 20px 14px;text-align:center;border-bottom:1px dashed rgba(125,211,252,0.3);">' +
        '<div style="display:inline-block;padding:2px 12px;border:1px solid #7dd3fc;background:rgba(15,28,46,0.9);color:#7dd3fc;font-size:10.5px;font-weight:700;letter-spacing:1.5px;">' +
          '承接终局：《' + escapeFeatureHtml(ep.endingTitle) + '》 · 角色第一视角番外' +
        '</div>' +
        '<div style="font-size:20px;font-weight:700;color:#ffffff;margin:10px 0 4px;letter-spacing:1.2px;text-shadow:0 2px 10px rgba(56,189,248,0.45);">' +
          '『 ' + escapeFeatureHtml(ep.title) + ' 』' +
        '</div>' +
        '<div style="font-size:10.5px;color:#f9a8d4;letter-spacing:2px;opacity:0.9;">─── ❖ ───  A F T E R   S T O R Y  ·  ' + escapeFeatureHtml(ep.charName) + ' の 視 点  ─── ❖ ───</div>' +
      '</div>' +
      '<div class="mp-galgame-epilogue-body" style="padding:18px 22px;font-size:13.5px;line-height:2.0;color:#f1f5f9;letter-spacing:0.4px;max-height:72vh;overflow-y:auto;background:rgba(8,6,14,0.65);">' +
        ep.bodyHtml +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;background:#06040a;border-top:1px solid rgba(125,211,252,0.3);font-size:10.5px;color:#94a3b8;font-family:monospace;">' +
        '<span>✦ AFTER STORY ARCHIVE · 角色视角完整番外</span>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<button type="button" data-mp-epilogue-export="1" style="padding:6px 12px;border:1px solid #7dd3fc;background:#10263c;color:#e0f2fe;font:700 11px monospace;cursor:pointer;box-shadow:2px 2px 0 #050811;">💾 导出后日谈 TXT</button>' +
          '<span style="color:#f9a8d4;font-weight:700;">— After Story Fin. ♥ —</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function beautifyGalgameEndingInDom() {
    try {
      bindGalgameEndingCardDelegation();
      const nodes = mainDoc.querySelectorAll('.mes .mes_text');
      if (!nodes || !nodes.length) return;
      for (let i = Math.max(0, nodes.length - 10); i < nodes.length; i++) {
        const el = nodes[i];
        if (!el || !el.innerHTML) continue;
        const textSample = el.textContent || '';
        const hasEnding = /GalgameEnding/i.test(textSample) || /GalgameEnding/i.test(el.innerHTML);
        const hasEpilogue = /GalgameEpilogue/i.test(textSample) || /GalgameEpilogue/i.test(el.innerHTML);
        if (!hasEnding && !hasEpilogue) continue;
        let rawHtml = el.innerHTML;
        let modifiedEnding = false;
        let modifiedEpilogue = false;

        if (hasEnding) {
          rawHtml = rawHtml.replace(GALGAME_ENDING_XML_RE, function(full, body) {
            const rec = parseGalgameEndingPayload(body);
            if (!rec) return full;
            modifiedEnding = true;
            return renderGalgameEndingCurtainHtml(rec);
          });

          rawHtml = rawHtml.replace(GALGAME_ENDING_BRACKET_RE, function(full, body) {
            const rec = parseGalgameEndingPayload(body);
            if (!rec) return full;
            modifiedEnding = true;
            return renderGalgameEndingCurtainHtml(rec);
          });
        }

        if (hasEpilogue) {
          rawHtml = rawHtml.replace(GALGAME_EPILOGUE_XML_RE, function(full, attrStr, body) {
            const ep = parseGalgameEpilogueXml(attrStr, body);
            if (!ep) return full;
            modifiedEpilogue = true;
            return renderGalgameEpilogueCurtainHtml(ep);
          });

          rawHtml = rawHtml.replace(GALGAME_EPILOGUE_BRACKET_RE, function(full, body) {
            const ep = parseGalgameEpilogueBracket(body);
            if (!ep) return full;
            modifiedEpilogue = true;
            return renderGalgameEpilogueCurtainHtml(ep);
          });
        }

        if ((modifiedEnding || modifiedEpilogue) && rawHtml !== el.innerHTML) {
          el.innerHTML = rawHtml;
          if (modifiedEnding) callSetPrompt(PROMPT_KEY + '_ending_director', '', 0, 0, false);
          if (modifiedEpilogue) callSetPrompt(PROMPT_KEY + '_epilogue_director', '', 0, 0, false);
        }
      }
    } catch (e) {}
  }

  function beautifySylveinaTagsInDom() {
    try {
      const nodes = mainDoc.querySelectorAll('.mes .mes_text');
      if (!nodes || !nodes.length) return;
      const levelNames = { L: '日常波动', M: '关键转折', H: '重大羁绊' };
      for (let i = Math.max(0, nodes.length - 6); i < nodes.length; i++) {
        const el = nodes[i];
        if (!el || !el.innerHTML) continue;
        if (!/Sylveina/i.test(el.textContent || '')) continue;
        const rawHtml = el.innerHTML;
        const domTagRe = /[\[\u3014\u3010\uff3b(（]\s*Sylveina\s*[|｜]([^\]\u3015\u3011\uff3d)）<\r\n]+)[\]\u3015\u3011\uff3d)）](?:\s*(?:<br\s*\/?>|\r?\n|<\/p>\s*<p>)?\s*s(?=\s*(?:<\/p>|$)))?/gi;
        const replaced = rawHtml.replace(domTagRe, function(full, body) {
          const parsed = parseSylveinaBody(body, full);
          if (!parsed) return full;
          const isPos = parsed.sign !== '-';
          const accent = isPos ? '#f472d0' : '#38bdf8';
          const bg = isPos ? 'rgba(244,114,208,0.12)' : 'rgba(56,189,248,0.12)';
          const levelLabel = levelNames[parsed.level] || parsed.eventType || '命运波动';
          const namePrefix = parsed.charName ? (escapeFeatureHtml(parsed.charName) + ' · ') : '';
          return '<div class="mp-sylveina-badge" style="display:inline-flex;align-items:center;gap:8px;margin-top:6px;padding:4px 11px;border-radius:4px;border:1px solid ' + accent + ';background:' + bg + ';color:#fce7f3;font:700 11.5px \"MP Fusion Pixel\",\"Courier New\",monospace;box-shadow:2px 2px 0 rgba(20,10,24,0.65);">' +
            '<span>🌙 ' + namePrefix + levelLabel + ' [' + parsed.level + ']</span>' +
            '<span style="color:' + accent + ';">' + (isPos ? '▲ +' : '▼ -') + parsed.baseValue + '</span>' +
            '</div>';
        });
        if (replaced !== rawHtml) {
          el.innerHTML = replaced;
        }
      }
    } catch (e) {}
    beautifyGalgameEndingInDom();
  }

  function onGenerationEnd() {
    callSetPrompt(PROMPT_KEY + '_gate', '', 0, 0, false);
    if (timeJumpCooldown > 0) timeJumpCooldown--;
    injectSafetyLockStatus();
    injectFanficEnhanceNotice();
    // ① 先把 AI 写的后台变量（世界时间 / 情绪 / 心声 / 在场）吃进本地状态
    try { applyBackendVariablesFromLatest(); } catch (e) {}
    sanitizeSylveinaRegexTail();
    beautifySylveinaTagsInDom();
    const jumpInfo = checkTimeJump();
    if (jumpInfo) { injectTimeJump(jumpInfo); }
    else { callSetPrompt(PROMPT_KEY + '_jump', '', 0, 0, false); const actions = checkAllCountdowns(); injectCountdownActions(actions); }
    injectEventPrompt();
    setTimeout(function() {
      Promise.resolve(runMoonCalculation()).finally(function() {
        sanitizeSylveinaRegexTail();
        beautifySylveinaTagsInDom();
      });
    }, 600);
    const nowTriggered = isFateCollapseTriggered();
    const existingAnchor = loadAnchor();
    if (nowTriggered && !existingAnchor) {
      // 首次触发：固化锚点，只写这一次（之后不再随最新楼层漂移）
      const cap = captureLatestContent();
      if (cap) {
        const locked = saveAnchor(cap);
        if (locked) {
          injectFateCollapse(locked);
          setTimeout(function() { toast('系统视线已降临 · 锚定时间线已固化', 'warning'); }, 500);
        }
      }
    } else if (existingAnchor) {
      // 已有锚点：无条件维持注入，好感回正也不解除，只认「开新对话」
      injectFateCollapse(existingAnchor);
    }
    if (nowTriggered && !lastTriggerState) { setTimeout(function() { toast('系统视线已降临 · 锚定时间线生效', 'warning'); }, 500); }
    lastTriggerState = nowTriggered;
    if (pendingCollapseNotice && existingAnchor) {
      pendingCollapseNotice = false;
      setTimeout(function() { toast('世界线已被收束，还请直面既定命运。', 'warning'); }, 500);
    } else if (!existingAnchor) {
      pendingCollapseNotice = false;
    }
  }
  /* ───────────────────────────────────────────────────────── */
