  /* ───────────────────────────────────────────────────────── */
  async function processDebuffIfTagged(charName, ch, mode) {
    const quota = ch._quota || (ch._quota = {}); if (!quota._debuff) quota._debuff = {};
    if (quota._debuff.冷战期 === true) return null;
    const found = getLatestAiMessage(); if (!found || !found.msg) return null;
    const mes = String(found.msg.mes || ''); const tag = extractDebuffTag(mes); if (!tag) return null;
    const curE = Number(ch.好感度) || 0;
    const debuffMap = {
      easy: { ratio: 0.25, days: 3, extra: 1.0 },
      normal: { ratio: 0.5, days: 5, extra: 1.0 },
      hard: { ratio: 0.5, days: 7, extra: 2.0 },
      hell: { ratio: 0.5, days: 10, extra: 2.0 }
    };
    const cfg = debuffMap[mode] || debuffMap.normal;
    let delta = curE * cfg.ratio * cfg.extra; if (curE < 0) delta = Math.max(delta, 0);
    const newE = roundHalf(curE - Math.abs(delta)); ch.好感度 = newE;
    const nowTime = (readMvuLatest()?.stat_data?.世界?.时间) || '';
    quota._debuff.冷战期 = true;
    quota._debuff.冷却结束时间 = addDaysToGameTime(nowTime, cfg.days);
    quota._debuff.剩余掷骰次数 = 3;
    quota._debuff.冷战期严重度 = 'heavy';
    try { found.msg.mes = String(found.msg.mes).replace(tag.fullMatch, '').trim(); } catch (e) {}
    return { days: cfg.days, newE: newE, oldE: curE, delta: roundHalf(newE - curE) };
  }

  const GATE_NODES = [18, 38, 58, 78, 98];
  const GATE_CHAR_ROLL_DAYS = 7;
  const GATE_PLAYER_CD_DAYS = 3;
  const GATE_FAIL_E_PENALTY = 5.0;

  function getGateThreshold(E) { return 8 + Math.floor(Number(E) / 10); }
  function getNextGateNode(R) { const r = Number(R) || 0; if (r < 0) return GATE_NODES[0]; if (r >= GATE_NODES.length) return null; return GATE_NODES[r]; }

  function applyAbyssToGatePenalty(ch, penalty, mode) {
    const E = Number(ch.好感度) || 0; const P = Number(ch.肉体值) || 0; const I = Number(ch.嫉妒值) || 0;
    const isAbyss = (E < 0 || P < 0 || I < 0); if (!isAbyss) return penalty;
    const ab = MOON_FORMULA_PARAMS.abyssCoeff[mode] || MOON_FORMULA_PARAMS.abyssCoeff.normal;
    return penalty * ab.neg;
  }

  function computePlayerConfession(ch, mode, currentTime) {
    const quota = ch._quota || {}; if (quota._playerConfession !== true) return null;
    quota._playerConfession = false;
    const E = Number(ch.好感度) || 0; const R = Number(ch.阶段值) || 0;
    if (R < 4 || E <= 60) return { passed: false, reason: '条件不满足' };
    if (quota.表白期已通过 === true || quota.表白期排除 === true) return null;
    const mod = MOON_FORMULA_PARAMS.confessionPlayerMod[mode] || 0;
    const dice = Math.floor(Math.random() * 20) + 1;
    const total = dice + mod + Math.floor(E / 10) + 3; const passed = total >= 20;
    if (passed) { quota.表白期已通过 = true; if (R < 5) ch.阶段值 = R + 1; }
    else { const penalty = roundHalf(0.5 * 2.0); ch.好感度 = roundHalf(E - penalty); quota.表白期冷却至 = addDaysToGameTime(currentTime, 14); }
    return { passed: passed, dice: dice, mod: mod, total: total };
  }

  function processGateForChar(charName, ch, currentTime, mode) {
    const q = ch._quota || (ch._quota = {}); if (!q._debuff) q._debuff = {};
    const E = Number(ch.好感度) || 0; const R = Number(ch.阶段值) || 0;
    if (q.R阶段门 !== true) {
      const nextNode = getNextGateNode(R);
      if (nextNode !== null && E >= nextNode) {
        q.R阶段门 = true; q.下次暗掷 = currentTime; q.玩家本周已掷 = false;
        return { type: 'gate_enter', char: charName, node: nextNode, E: E, R: R, threshold: getGateThreshold(E) };
      }
      return null;
    }
    const threshold = getGateThreshold(E); const rolls = [];
    if (q.下次暗掷 && timeReached(currentTime, q.下次暗掷)) {
      const dice = Math.floor(Math.random() * 20) + 1; q.下次暗掷 = addDaysToGameTime(currentTime, GATE_CHAR_ROLL_DAYS);
      const roll = { side: '角色侧', dice: dice, threshold: threshold, result: '' };
      if (dice === 1) { const penalty = applyAbyssToGatePenalty(ch, GATE_FAIL_E_PENALTY, mode); ch.好感度 = roundHalf(E - penalty); roll.result = '大失败，E-' + penalty; }
      else if (dice >= threshold) { ch.阶段值 = R + 1; q.R阶段门 = false; roll.result = '成功，R+1'; rolls.push(roll); return { type: 'gate_success', char: charName, rolls: rolls, newR: R + 1, side: '角色侧' }; }
      else roll.result = '失败，R不变，继续冻结';
      rolls.push(roll);
    }
    const lr = ch._lastRoll || {}; const inCd = q.玩家冷却至 && !timeReached(currentTime, q.玩家冷却至);
    if (lr.事件类型 === '重大' && q.玩家本周已掷 !== true && !inCd) {
      const dice = Math.floor(Math.random() * 20) + 1; q.玩家本周已掷 = true;
      const roll = { side: '玩家侧', dice: dice, threshold: threshold, result: '' };
      if (dice === 1) { const penalty = applyAbyssToGatePenalty(ch, GATE_FAIL_E_PENALTY, mode); ch.好感度 = roundHalf(E - penalty); q.玩家冷却至 = addDaysToGameTime(currentTime, GATE_PLAYER_CD_DAYS); roll.result = '大失败，E-' + penalty; }
      else if (dice >= threshold) { ch.阶段值 = R + 1; q.R阶段门 = false; roll.result = '成功，R+1'; rolls.push(roll); return { type: 'gate_success', char: charName, rolls: rolls, newR: R + 1, side: '玩家侧' }; }
      else { q.玩家冷却至 = addDaysToGameTime(currentTime, GATE_PLAYER_CD_DAYS); roll.result = '失败，3天内不能再掷'; }
      rolls.push(roll);
    }
    return rolls.length ? { type: 'gate_roll', char: charName, rolls: rolls } : null;
  }

  function injectGateNotice(gateLogs) {
    const lines = [];
    lines.push('═══════════════════════════════════');
    lines.push('⚡【系统强制：月轨周期节点与事件导演】');
    lines.push('以下为脚本摇出的真实骰点/事件安排，AI 必须无条件采纳并体现在叙事中：');
    lines.push('');
    for (const g of gateLogs) {
      if (g.type === 'event_update' && g.event && g.event.type === 'first_meet') {
        const r = g.event.result;
        lines.push('【' + g.char + '】初见判定完成：1d20=' + r.dice + ' + 优势 ' + r.total + '，阈值 ' + r.threshold + '。');
        lines.push('  → ' + r.resultText);
        lines.push('  → 叙事要求：根据新的关系状态演绎角色对玩家的第一印象。');
      } else if (g.type === 'event_update' && g.event && g.event.type === 'debuff') {
        const r = g.event.result;
        lines.push('【' + g.char + '】玩家触发核心雷点，进入冷战期 ' + r.days + ' 天。');
        lines.push('  → E ' + r.oldE + ' → ' + r.newE + '（Δ' + r.delta + '）');
        lines.push('  → 叙事要求：角色对玩家冷淡疏离，用语言/眼神/行为表达排斥；正向下周需掷骰脱困。');
      }
      if (g.type === 'gate_enter') {
        lines.push('【' + g.char + '】好感度 E=' + g.E + ' 已到达破门节点 ' + g.node + '。');
        lines.push('  → 进入破门期：R 阶段冻结（角色心中有过不去的坎），但 E 依然可以正常增加。阈值 = ' + g.threshold);
        lines.push('  → 叙事要求：角色在心理上出现"要不要更进一步"的挣扎/犹豫/试探，体现言行抗拒但情感沦陷的拉扯感');
      } else if (g.type === 'gate_success') {
        lines.push('【' + g.char + '】阶段门突破！由' + g.side + '掷骰成功。');
        lines.push('  → 阶段值 R 上升至 ' + g.newR + '，关系正式进入新阶段。');
        lines.push('  → 叙事要求：让关系状态发生明确质变');
        for (const r of g.rolls) { lines.push('    · [' + r.side + '] 1d20=' + r.dice + '（阈值≥' + r.threshold + '）→ ' + r.result); }
      } else if (g.type === 'gate_roll') {
        lines.push('【' + g.char + '】阶段门判定（未突破）：');
        for (const r of g.rolls) { lines.push('    · [' + r.side + '] 1d20=' + r.dice + '（阈值≥' + r.threshold + '）→ ' + r.result); }
        lines.push('  → 叙事要求：体现关系的停滞/退缩/等待');
      } else if (g.type === 'event_update') {
        const e = g.event;
        if (e.type === 'world_event') {
          lines.push('【' + g.char + '】主线事件触发：【' + e.name + '】。请立即进入主线，剩余 ' + e.rounds + ' 回合，不得拖延。');
        } else if (e.type === 'new_event') {
          if (e.isEgg) {
            lines.push('【' + g.char + '】触发大成功彩蛋事件：【' + e.name + '】。请在 ' + e.rounds + ' 回合内完成。');
            lines.push('  → 风格要求：必须严格按照【日常轻喜剧】风格推进。事件必须极度无厘头、充满巧合和黑色幽默。');
            lines.push('  → 绝对红线：1. 严禁崩坏角色人设；2. 不能太跳脱和超现实；3. 彩蛋只决定接下来事件的氛围，不改变原有世界观。');
            lines.push('  → 数值计算：本次彩蛋事件在数值计算上【完全等同于重大事件】（基础值区间 1.5~8.0），请在 _lastRoll 中按重大事件填写。');
          } else {
            lines.push('【' + g.char + '】新事件开启：【' + e.name + '】(' + (e.isMajor ? '重大' : '日常') + ')。请在 ' + e.rounds + ' 回合内完成。');
            if (e.forbidMajor) {
              lines.push('  → 【主线临近警告】：距离下一次世界线变动不足一个月。本事件被强制降级为日常。请在叙事中收敛张力，为即将到来的主线蓄势。');
            }
          }
        } else if (e.type === 'event_progress') {
          lines.push('【' + g.char + '】当前事件【' + e.name + '】推进中，剩余 ' + e.remaining + ' 回合。');
        }
      }
    }
    if (lines.length > 2) callSetPrompt(PROMPT_KEY + '_gate', lines.join('\n'), 4, 1, false);
  }
  /* ───────────────────────────────────────────────────────── */
  function injectEventPrompt() {
    try {
      const data = readMvuLatest();
      if (!data || !data.stat_data || !data.stat_data.角色) return;
      const chars = data.stat_data.角色;
      const world = data.stat_data.世界 || {};
      const activeKeys = Object.keys(chars).filter(function(k) { return k !== '示例角色' && k !== 'You' && k !== '你'; });
      if (activeKeys.length === 0) return;
      const multiCard = getCardMode() === 'multi';
      const lines = [];
      activeKeys.forEach(function(name) {
        const ch = chars[name]; if (!ch) return;
        const q = ch._quota || {}; const es = q._eventState || {};
        const eventType = es.事件类型 || '日常';
        const range = eventType === '日常' ? '0.5~2.0' : (eventType === '关键' ? '3.0~5.0' : (eventType === '重大' || eventType === '彩蛋' ? '6.0~10.0' : '0.5~2.0'));
        const levelTag = eventType === '日常' ? 'L' : (eventType === '关键' ? 'M' : 'H');
        const _q = ch._quota || {};
        if (ch.在场 === true && _q._firstMeetDone !== true) {
          lines.push('【' + name + '】首次登场！请通读角色卡，判断玩家设定触发了哪些喜好/厌恶。');
          lines.push('  在正文末尾额外输出 `[初见|优势+X|劣势-Y]`（优势取值 0/+3/+6/+9，劣势取值 0/-3/-6）。');
        }
        const importance = String(ch.重要度 || '主要').trim();
        if (importance === '主要') lines.push('  ★ 角色定位：主要攻略对象 —— 本轮互动的重心放在她身上，内心戏与情感拉扯要写足。');
        else if (importance === '次要') lines.push('  · 角色定位：次要角色 —— 可以互动，但不要抢主线攻略对象的戏份。');
        else lines.push('  · 角色定位：NPC —— 只做功能性出场，不展开情感线。');
        const _es = (ch._quota || {})._eventState || {};
        if (_es.当前事件 && Number(_es.剩余回合) > 0) {
          lines.push('🎬【事件导演·本轮已定事件】「' + _es.当前事件 + '」（' + (_es.事件类型 || '日常') + '），还剩 ' + _es.剩余回合 + ' 回合。');
          lines.push('  → 你只负责扩写：把这件事的场面、对话、心理、细节写足，每轮只推进一小步。');
          lines.push('  → 这件事没走完之前，不要另起新事件、不要跳过时间、不要突然转场，剧情必须围着它转。');
        }
        lines.push('【' + name + '】本轮事件类型：' + eventType + '，请在区间 ' + range + ' 内挑一个基础值。');
        lines.push('  输出格式：' + (multiCard ? '[Sylveina|' + name + '|' + levelTag + '|+/-|基础值]' : '[Sylveina|' + levelTag + '|+/-|基础值]') + '，例：' + (multiCard ? '[Sylveina|' + name + '|' + levelTag + '|+|3.5]' : '[Sylveina|' + levelTag + '|+|3.5]'));
        const days = Number(es._距离主线天数);
        if (!isNaN(days) && isFinite(days)) {
          if (days <= 0) lines.push('  ⚡ 主线节点已触发：请全力演绎当前剧情，不得回避核心冲突。');
          else if (days <= 3) lines.push('  ⚡ 距主线节点还有 ' + Math.floor(days) + ' 天：剧情应快速升温，为即将到来的大事件做最后铺垫，营造暴风雨前的宁静。');
          else if (days <= 9) lines.push('  ⚠️ 距主线节点还有 ' + Math.floor(days) + ' 天：请开始铺垫、埋伏笔，适时通过NPC或环境暗示危机逼近。');
        }
        if (q.R阶段门 === true) lines.push('  ⚠️ 阶段门冻结中：R 不变，E 可增长。请体现言行抗拒但情感沦陷的拉扯感。');
        const db = q._debuff || {};
        if (db.冷战期 === true) lines.push('  💣 冷战期：角色对玩家冷淡疏离，负向行为加重，正向需要脱困。');
        const E = Number(ch.好感度) || 0; const P = Number(ch.肉体值) || 0; const I = Number(ch.嫉妒值) || 0;
        if (E < 0 || P < 0 || I < 0) lines.push('  🌑 深渊模式：负向行为加重。');
        if (q.表白期已通过 === true) lines.push('  💗 表白期已通过：关系已进入新阶段。');
        else if (q.表白期排除 === true) lines.push('  🚫 此角色已排除表白期（' + (q.表白期排除理由 || '无理由') + '）。');
      });
      lines.push('');
      lines.push('标签格式：' + (multiCard ? '[Sylveina|角色名|L/M/H|+/-|基础值]' : '[Sylveina|L/M/H|+/-|基础值]') + '，例：' + (multiCard ? '[Sylveina|长谷川茗|M|+|3.5]' : '[Sylveina|M|+|3.5]') + '。');
      lines.push('基础值区间：L=0.5~2.0，M=3.0~5.0，H=6.0~10.0。');
      lines.push('【重要：正则美化触发格式】正文剧情结束后，只在最后单独输出一个 Sylveina 数值标签，下一行只输出小写字母 s。两行示例：');
      lines.push('[Sylveina|L|+|1.2]');
      lines.push('s');
      lines.push('【后台变量块 · 必须输出】在 s 之后再输出下面这些后台变量行（脚本会自动读取并把它们隐藏，玩家看不到）：');
      lines.push('世界.时间=<本轮结束时的世界时间，格式必须是 YYYY年MM月DD日 · 星期X · HH:MM，只能前进不能倒退>');
      lines.push('世界.地点=<本轮结束时的场景地点>');
      lines.push('为本轮有互动的每个角色各输出三行（角色名用档案里的正名）：');
      lines.push('角色.<角色名>.情绪=<单个 emoji>');
      lines.push('角色.<角色名>.心声=<15~40字第一人称内心话，写她此刻没有说出口的真实想法>');
      lines.push('角色.<角色名>.在场=true 或 false');
      lines.push('（当前世界时间：' + (world.时间 || '未记录') + '｜当前地点：' + (world.地点 || '未记录') + '｜游戏日：第 ' + (Number(world._游戏日) || 0) + ' 天。'
        + '节奏规则：同一场景内的对话，每轮只推进 ' + getTurnMinutes() + ' 分钟（最多不超过 ' + (getTurnMinutes() * 2) + ' 分钟），不要自行跳到几小时之后或第二天；'
        + '只有玩家明确要求（第二天 / 三天后 / 睡一觉 / 跳过）或剧情确实需要转场时，才写出跨时段或跨天的新时间。'
        + '没有跨天就保持同一天，只把分钟往后推。）');
      lines.push('【分工】剧情事件的种类与节奏由脚本的骰子与导演系统决定，你不需要自己另起大事件；拿到哪件事，就把它写成最好看的那一版。');
      lines.push('禁止在正文与后台变量块里输出 好感度/肉体值/阶段值/嫉妒值 数值，禁止输出 JSON、UpdateVariable、StatusPlaceHolderImpl 或任何解释文字；四维数值全部由本插件按标签在本地计算和保存。');
      callSetPrompt(PROMPT_KEY + '_event', lines.join('\n'), 4, 1, false);
    } catch (e) { console.warn('[Doki] 状态注入失败：', e); }
  }

  function injectCardModeNotice() {
    const mode = getCardMode();
    if (mode === 'multi') {
      const content = ['【卡组模式：多人卡】', '标签必须带角色名，格式：[Sylveina|角色名|L/M/H|+/-|基础值]，例：[Sylveina|长谷川茗|L|+|1.5]。', '标签里的角色名必须使用本轮剧情中实际互动的角色正名，不要用昵称或称呼。', '若本轮与多个角色有互动，为每一个角色分别输出各自的 Sylveina 标签。', '没有写角色名的标签只会结算给「主要攻略对象」一个人，其他角色不会加分。'].join('\n');
      callSetPrompt(PROMPT_KEY + '_cardmode', content, 4, 1, false);
    } else {
      const content = ['【卡组模式：单人卡】', '本轮数值标签统一使用角色卡主名（即当前对话的角色名）。', '不要用剧情里的昵称、称呼、化名或别名作为 <名>。', '若剧情里出现其他配角，可以在正文中描写，但数值标签只针对角色卡主名这一条。'].join('\n');
      callSetPrompt(PROMPT_KEY + '_cardmode', content, 4, 1, false);
    }
  }

  function injectFanficEnhanceNotice() {
    if (!getFanficEnhance()) { callSetPrompt(PROMPT_KEY + '_fanfic', '', 0, 0, false); return; }
    const content = ['═══════════════════════════════════', '🌐【同人台词补强 · 已开启】', '本卡涉及原著 IP。请在撰写角色台词时遵循以下规则：', '① 台词优先参考该角色在原 IP 源语言里的用语习惯、口头禅、称谓、语气、节奏。', '② 若你能判断 IP 与源语言（如《文豪野犬》= 日语；《哈利波特》= 英语），台词请优先按源语言语感写；如玩家开了双语输出，则翻译部分使用源语言直译，不要意译、不要润色。', '③ 允许保留少量源语言原文词（称谓/语气词/专有名词），让台词更贴近原作。', '④ 不改变角色人设，不脱离当前剧情进度，只调整「说话方式」。', '═══════════════════════════════════'].join('\n');
    callSetPrompt(PROMPT_KEY + '_fanfic', content, 4, 2, false);
  }

  function injectSafetyLockStatus() {
    const on = getSafetyLock();
    const content = on ? [
      '═══════════════════════════════════',
      '🔒【系统约束：安全锁已开启】',
      '当前处于安全模式。所有角色的负向行为（愤怒、冷漠、算计、决裂）必须止步于心理层面。',
      '【绝对禁止】：实质性的肉体伤害、囚禁、致残、致死等极端行为。',
      '即使角色处于深渊负数状态、敌对状态，或 I 值爆表，也只能通过言语、眼神、疏远、决裂来表达敌意，绝不允许对玩家造成任何物理伤害。',
      '═══════════════════════════════════'
    ].join('\n') : [
      '═══════════════════════════════════',
      '⚠️【系统约束：安全锁已关闭】',
      '当前处于危险模式。允许角色将敌对行为升级到实质层面。',
      '· 若角色卡本身是危险/病态/反派型角色，在满足数值条件时，允许出现算计、囚禁、肉体伤害、甚至生命威胁等剧情。',
      '· 若角色卡本身无害/柔弱/善良，即使 I=100，敌对表现也必须止步于自我毁灭或激烈决裂，严禁 OOC 强行让无害角色伤害玩家。',
      '具体行为上限完全由角色卡的核心人设决定。',
      '═══════════════════════════════════'
    ].join('\n');
    callSetPrompt(PROMPT_KEY + '_safety', content, 4, 2, false);
  }

  function isExtraModelActive() {
    const setting = getSettings().extraModel;
    if (setting === 'on') return true; if (setting === 'off') return false;
    try { if (mainWin.Mvu && typeof mainWin.Mvu.isDuringExtraAnalysis === 'function') return true; } catch (e) {}
    return false;
  }
  function isCurrentlyInExtraAnalysis() { try { if (mainWin.Mvu && typeof mainWin.Mvu.isDuringExtraAnalysis === 'function') return mainWin.Mvu.isDuringExtraAnalysis(); } catch (e) {} return false; }
  /* ───────────────────────────────────────────────────────── */
  /* 区间是脚本自己定的，就必须由脚本自己执行：
     AI 把基础值写成 99 时只取区间上界，不能靠一个数字把一轮的分刷满。 */
  function clampBaseToEventRange(value, eventType) {
    const v = Number(value);
    const type = String(eventType || '日常');
    const range = MOON_FORMULA_PARAMS.eventBaseRange[type] || MOON_FORMULA_PARAMS.eventBaseRange.日常;
    // 0 是「这一轮没打动她」的合法写法，不要被夹成下界，否则每轮都会被强制加分
    if (!isFinite(v) || v === 0) return { value: 0, clamped: false, range: range };
    if (v < range[0]) return { value: range[0], clamped: true, range: range };
    if (v > range[1]) return { value: range[1], clamped: true, range: range };
    return { value: roundHalf(v), clamped: false, range: range };
  }
  function computeCharDelta(charData, lastRoll, mode) {
    if (!charData || !lastRoll) return null;
    const dim = String(lastRoll.主维度 || '').toUpperCase();
    if (!dim || !MOON_FORMULA_PARAMS.dimToField[dim]) return null;
    const fieldName = MOON_FORMULA_PARAMS.dimToField[dim];
    const oldValue = Number(charData[fieldName]) || 0;
    const base = Number(lastRoll.基础值) || 0;
    if (base === 0) {
      return { delta: 0, oldValue: oldValue, newValue: oldValue, fieldName: fieldName, dimension: dim, emotionResult: null, isAbyss: false, weeklyBlocked: false };
    }
    const eventType = String(lastRoll.事件类型 || '日常');
    const direction = String(lastRoll.方向 || '正向');
    const E = Number(charData.好感度) || 0; const P = Number(charData.肉体值) || 0; const I = Number(charData.嫉妒值) || 0;
    const isAbyss = (E < 0 || P < 0 || I < 0);
    const abCoeff = (MOON_FORMULA_PARAMS.abyssCoeff[mode] || MOON_FORMULA_PARAMS.abyssCoeff.normal);
    const abyssMult = isAbyss ? (direction === '负向' ? abCoeff.neg : abCoeff.pos) : 1.0;
    let delta = base;
    if (dim !== 'R') delta *= getDimCoeff(oldValue);
    if (direction === '负向') delta *= getNegCoeff(mode, dim);
    delta *= abyssMult;
    let emotionResult = null;
    if (dim === 'E' && !shouldSkipEmotion(charData, mode)) {
      const threshold = getEmotionThreshold(eventType);
      const dice = Math.floor(Math.random() * MOON_FORMULA_PARAMS.emotionDice) + 1;
      const passed = dice >= threshold;
      if (passed) delta += getEmotionBonus(mode, eventType, direction);
      emotionResult = { dice: dice, threshold: threshold, passed: passed };
    }
    if (Math.abs(delta) > MOON_FORMULA_PARAMS.singleCap) delta = Math.sign(delta) * MOON_FORMULA_PARAMS.singleCap;
    delta = roundHalf(delta);
    let weeklyBlocked = false;
    if (dim === 'E' && delta > 0) {
      if (!charData._quota) charData._quota = {};
      const q = charData._quota;
      const used = Number(q.好感度周上限已用) || 0;
      const cap = MOON_FORMULA_PARAMS.weeklyCap[mode] || MOON_FORMULA_PARAMS.weeklyCap.normal;
      const remain = roundHalf(cap - used);
      if (remain <= 0) { delta = 0; weeklyBlocked = true; }
      else if (delta > remain) { delta = roundHalf(remain); weeklyBlocked = true; }
      // 关键：被压缩后的实际增量也要记账，否则同一周内会反复领到「剩余额度」，把上限撑破
      if (delta > 0) q.好感度周上限已用 = roundHalf(used + delta);
    }
    if (dim === 'R') delta = 0;
    const newValue = roundHalf(oldValue + delta);
    return { delta: delta, oldValue: oldValue, newValue: newValue, fieldName: fieldName, dimension: dim, emotionResult: emotionResult, isAbyss: isAbyss, weeklyBlocked: weeklyBlocked };
  }

  function syncStageWithAffection(ch) {
    if (!ch || typeof ch !== 'object') return false;
    const E = Number(ch.好感度) || 0;
    const curR = Number(ch.阶段值) || 0;
    const targetStage = getRStageFromE(E);
    const targetR = targetStage.r;
    const q = ch._quota || (ch._quota = {});
    if (targetR < curR) {
      ch.阶段值 = targetR;
      if (targetR < 0) q.R阶段门 = false;
      return true;
    }
    if (targetR > curR && q.R阶段门 !== true) {
      const nextGate = getNextGateNode(curR);
      if (nextGate === null || E < nextGate || curR < 0) {
        ch.阶段值 = targetR;
        return true;
      }
    }
    return false;
  }

  // 无名标签（AI 没写名字）只归属一个「主目标」，避免多人卡里一个标签打到所有角色
  function pickPrimaryTarget(chars, names) {
    const list = Array.isArray(names) ? names : Object.keys(chars || {});
    if (!list.length) return '';
    const weight = { '主要': 3, '主角': 3, '次要': 2, 'NPC': 1 };
    let best = ''; let bestScore = -Infinity;
    for (const n of list) {
      const ch = chars && chars[n];
      if (!ch || isCharSkeleton(ch)) continue;
      let score = (weight[String(ch.重要度 || '').trim()] || 2) * 1000;
      if (ch.在场 === true) score += 500;
      else if (ch.在场 === false) score -= 500;
      score += Math.max(-200, Math.min(200, Number(ch.好感度) || 0));
      if (score > bestScore) { bestScore = score; best = n; }
    }
    return best || list[0];
  }

  function matchTagForCharacter(tags, charName, activeCharCount, primaryName) {
    if (!Array.isArray(tags) || !tags.length) return null;
    const cleanName = String(charName || '').trim();
    for (let i = tags.length - 1; i >= 0; i--) {
      const t = tags[i];
      if (t.charName && cleanName && (t.charName === cleanName || cleanName.indexOf(t.charName) >= 0 || t.charName.indexOf(cleanName) >= 0)) {
        return t;
      }
    }
    if (activeCharCount <= 1) {
      for (let i = tags.length - 1; i >= 0; i--) {
        if (!tags[i].charName) return tags[i];
      }
      return tags[tags.length - 1];
    }
    // 多人卡：无名标签只结算给主目标角色
    const target = primaryName || '';
    if (!cleanName || (target && cleanName !== target)) return null;
    for (let i = tags.length - 1; i >= 0; i--) {
      if (!tags[i].charName) return tags[i];
    }
    return null;
  }

