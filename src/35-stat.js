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
        lines.push('  → 状态说明：冷战标记、持续时间与脱困条件由脚本记录；不规定角色必须采取何种具体言行。');
      }
      if (g.type === 'gate_enter') {
        lines.push('【' + g.char + '】好感度 E=' + g.E + ' 已到达破门节点 ' + g.node + '。');
        lines.push('  → 进入破门期：R 阶段冻结（角色心中有过不去的坎），但 E 依然可以正常增加。阈值 = ' + g.threshold);
        lines.push('  → 状态说明：R 阶段暂时冻结，E 仍可结算；此状态不规定角色必须如何回应玩家。');
      } else if (g.type === 'gate_success') {
        lines.push('【' + g.char + '】阶段门突破！由' + g.side + '掷骰成功。');
        lines.push('  → 阶段值 R 上升至 ' + g.newR + '，关系正式进入新阶段。');
        lines.push('  → 状态说明：脚本已将 R 阶段推进至新值；具体关系表现仍由角色性格和实际剧情决定。');
        for (const r of g.rolls) { lines.push('    · [' + r.side + '] 1d20=' + r.dice + '（阈值≥' + r.threshold + '）→ ' + r.result); }
      } else if (g.type === 'gate_roll') {
        lines.push('【' + g.char + '】阶段门判定（未突破）：');
        for (const r of g.rolls) { lines.push('    · [' + r.side + '] 1d20=' + r.dice + '（阈值≥' + r.threshold + '）→ ' + r.result); }
        lines.push('  → 状态说明：本次判定未突破，R 保持不变；不要求角色采取固定的停滞或退缩行为。');
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
    if (lines.length > 2) callSetPrompt(PROMPT_KEY + '_gate', lines.join('\n'), 0, 1, false);
  }
  /* ───────────────────────────────────────────────────────── */
  /* 关于「阶段锚定」（已下线，v5.18.3）：
     以前这里有一张 R_STAGE_BOUNDARY 表，按 R 档下发「不得有肢体接触」
     「不得谈长期承诺」这类禁令。做法本身能防住「数值封顶了、演出还在往前冲」，
     但它假设关系是从零长起来的——遇到「设定里就是相处三年的兄妹」，
     这套禁令会把老熟人判成越界，而且和玩家自己的世界书正文打架。
     现在只给数值和阶段名，演到什么程度交给世界书与玩家设定。 */

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
      /* ── 当前状态：AI 必须照抄这里的数字，不能自己编 ──────────
         以前这里只给「本轮事件类型 + 标签格式」，E/P/R/I 一个数字都没给，
         AI 就会在正文和草稿里瞎写「好感度 20」，和状态卡上的真实值对不上。
         现在把脚本算完的结果原样报给它，并明确禁止它自己复述数字。 */
      lines.push('════ 当前状态 · 唯一事实来源（脚本已结算，你无权修改） ════');
      activeKeys.forEach(function(name) {
        const ch = chars[name]; if (!ch) return;
        const E = Number(ch.好感度) || 0; const P = Number(ch.肉体值) || 0;
        const I = Number(ch.嫉妒值) || 0; const R = Number(ch.阶段值) || 0;
        const stage = getRStageFromE(E);
        const q = ch._quota || {};
        const cap = Number(MOON_FORMULA_PARAMS.weeklyCap[getCurrentMode()] || MOON_FORMULA_PARAMS.weeklyCap.normal);
        const used = Math.min(cap, Math.max(0, Number(q.好感度周上限已用) || 0));
        const remain = Math.max(0, roundHalf(cap - used));
        const address = String(ch.对玩家称呼 || '').trim();
        lines.push('· ' + name + '｜好感 E=' + E + '（关系阶段：' + stage.name + ' / R=' + R + '）｜肉体 P=' + P + '｜嫉妒 I=' + I +
          '｜情绪 ' + String(ch.情绪 || '😐') + '｜' + (ch.在场 === false ? '不在场' : '在场') +
          (address ? '｜已登记对玩家称呼「' + address + '」' : ''));
        lines.push('  本周正向好感额度：' + used.toFixed(1) + '/' + cap.toFixed(1) + '，剩余 ' + remain.toFixed(1) + '（脚本按游戏内满 7 天重置）');
        if (address) {
          lines.push('  对玩家的专属称呼已固定为「' + address + '」；后续自然使用，不要擅自更改，也不要每句话都重复。');
        } else if (E >= 58 || R >= 3) {
          lines.push('  关系已达到可形成专属称呼的阶段。本轮请根据角色性格、语言习惯和真实相处经历，创造一个只属于该角色的对玩家称呼，并在后台变量块追加：角色.' + name + '.对玩家称呼=<称呼>。只生成一次，不用模板化的“亲爱的”。');
        }
      });
      /* 分工：脚本只出「数值 + 阶段」，表现交给世界书。
         玩家手里往往另有感情/关系向的世界书，那边才定义「朋友怎么相处」。
         两边都讲表现就会打架，所以这里把边界说死，并禁止 AI 自己再判一次关系。 */
      lines.push('→ 脚本只负责两件事：好感/亲密的加减结果，以及它落在哪一档关系。它不负责「这一档关系该怎么表现」——朋友怎么相处、暧昧到什么程度、恋人间怎么说话，一律以世界书和玩家设定为准；世界书若对当前关系有定义，以世界书为准，本段不得与它竞争，也不要自己另立一套标准。');
      lines.push('→ 关系判断已经完成，不要再自行评估或改写：不要写「我们算不算朋友」「关系好像进了一步」这类自评，不要用分数反推关系，也不要因为分高就自动加戏、因为分低就刻意冷场。需要提到关系时，直接用给定的阶段名。');
      lines.push('→ 正文与草稿里都不要写「好感度=XX」「当前关系阶段：XX（好感度XX）」这类数字，也不要输出 Phase.xxx、「关系阶段分析」这类段落；数值由状态卡统一展示，你重复只会和卡片打架。');
      lines.push('');
      activeKeys.forEach(function(name) {
        const ch = chars[name]; if (!ch) return;
        const q = ch._quota || {}; const es = q._eventState || {};
        const eventType = es.事件类型 || '日常';
        const range = eventType === '日常' ? '0.5~2.0' : (eventType === '关键' ? '3.0~5.0' : (eventType === '重大' || eventType === '彩蛋' ? '6.0~10.0' : '0.5~2.0'));
        const levelTag = eventType === '日常' ? 'L' : (eventType === '关键' ? 'M' : 'H');
        const _q = ch._quota || {};
        if (ch.在场 === true && _q._firstMeetDone !== true) {
          lines.push('【' + name + '】首次登场！');
          if (firstMeetMode() === 'dice') {
            lines.push('  初见骰由脚本直接掷出，你不需要输出任何初见标签，也不要自己写好感数字。');
          } else {
            lines.push('  请通读角色卡，判断玩家设定触发了哪些喜好/厌恶。');
            lines.push('  在正文末尾额外输出 `[初见|优势+X|劣势-Y]`（优势取值 0/+3/+6/+9，劣势取值 0/-3/-6）。');
            lines.push('  → 这只是「档位」，最终数值由脚本掷 1d20 结算，你不需要也不许写结果数字。');
            lines.push('  → 本轮忘了写也没关系：脚本会按无加成直接掷，不会再等下一轮。');
          }
        }
        const importance = String(ch.重要度 || '主要').trim();
        if (importance === '主要') lines.push('  ★ 角色定位：主要互动对象 —— 本轮叙事可优先关注Ta，但这不代表Ta已经喜欢玩家或必须主动亲近；态度仍由当前关系事实、人设与剧情决定。Ta 不在场时，不要为了「优先关注」把Ta写进场。');
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
        if (q.R阶段门 === true) lines.push('  ⚠️ 阶段门冻结中：R 暂时不变，E 仍可正常结算；这是数值状态，不规定角色必须如何表现。');
        /* 本轮的关系边界。这是「分数锁死了、演出还在涨」的正面解法：
           光报一个 E=71 给它，AI 只会按剧情惯性往上推；把「这一档不许出现什么」列出来，
           它才有东西可以对照。和上面的阶段门提示不重复——那条讲数值，
           这条讲演出，二者一起才封得住。 */
        {
          /* 关系底子：建档时从人设/世界书里认定的既有关系。
             只抬不压 —— 写得出来「十几年兄妹」，演出就不该被数值压成刚认识。 */
          const _prior = ch._关系先验;
          if (_prior && (_prior.关系 || _prior.共处时长)) {
            const _pRel = String(_prior.关系 || '').trim();
            const _past = String(_prior.共处时长 || '').trim();
            if (_pRel || _past) {
              lines.push('  🧷 【' + name + '】关系底子：' + (_pRel || '已认识') + (_past ? '（' + _past + '）' : '')
                + '。这是建档时从人设和设定里认定的既有关系，演出手法要匹配它——'
                + '不要因为当前数值不高，就把老熟人演成刚认识。');
            }
          }
          const _cap = Number(MOON_FORMULA_PARAMS.weeklyCap[getCurrentMode()] || MOON_FORMULA_PARAMS.weeklyCap.normal);
          const _used = Math.min(_cap, Math.max(0, Number(q.好感度周上限已用) || 0));
          const _remain = roundHalf(_cap - _used);
          if (_remain <= 0) {
            lines.push('  🔒 【' + name + '】本周好感额度已用尽（' + _used.toFixed(1) + '/' + _cap.toFixed(1) + '）：这一轮 E 不会再涨，写标签也会被丢弃。');
            lines.push('     → 叙事上同样停住：把这一场写「厚」（细节、气氛、心理、对白的停顿），不要写「深」（关系跃迁、新的亲密推进、升级性质的措辞）。');
          } else if (_remain <= 1.5) {
            lines.push('  ⚠️ 【' + name + '】本周好感额度只剩 ' + _remain.toFixed(1) + '：这一轮最多只能再往前一点点，不要写成关系大跃进。');
          }
        }
        const db = q._debuff || {};
        if (db.冷战期 === true) lines.push('  💣 冷战期标记仍有效：持续时间与解除条件由脚本判定；该标记只提供关系背景，不指定角色必须采取的言行。');
        const E = Number(ch.好感度) || 0; const P = Number(ch.肉体值) || 0; const I = Number(ch.嫉妒值) || 0;
        if (E < 0 || P < 0 || I < 0) lines.push('  🌑 当前存在负值记录：它描述关系/状态曾受损，不要求角色必须敌视或自我否定。');
        if (q.表白期已通过 === true) lines.push('  💗 表白期已通过：关系已进入新阶段。');
        else if (q.表白期排除 === true) lines.push('  🚫 此角色已排除表白期（' + (q.表白期排除理由 || '无理由') + '）。');
      });
      lines.push('');
      lines.push('标签格式：' + (multiCard ? '[Sylveina|角色名|L/M/H|+/-|基础值]' : '[Sylveina|L/M/H|+/-|基础值]') + '，例：' + (multiCard ? '[Sylveina|长谷川茗|M|+|3.5]' : '[Sylveina|M|+|3.5]') + '。');
      lines.push('基础值区间：L=0.5~2.0，M=3.0~5.0，H=6.0~10.0。');
      /* 分维度标签：肉体 / 嫉妒。
         
         以前只教了这一条 [Sylveina|…]，而它的维度默认是 E，
         所以四维里只有好感度会动，肉体值和嫉妒值从建档起就是死的。
         现在给出另外两条独立标签（格式照抄，只换开头那个词），
         并写清「什么时候才写」—— 不写触发条件，模型只会每轮硬凑一条。 */
      /* 肉体这一维的定义必须写清楚，否则模型会按「身体接触进度条」去填。
         它不是「发生过什么」，是「此刻有多想要」——这个差别决定了两件事：
         一、不用真的碰到也能涨（被撩到、看到、闻到、自己脑补都算）；
         二、它和好感是两条独立的轴（讨厌也可能被撩到，深爱也可能克制）。
         写不清这两点，四维就退化成一维加两个装饰。 */
      lines.push('【另外两维】');
      lines.push('  · 肉体值 = 欲望 / 色欲的强度，不是「身体关系的进度」。不需要真的发生什么，甚至不需要碰到：');
      lines.push('    被撩到、被逼近、闻到对方身上的味道、看到不该看的、脑子里反复想——都算。');
      lines.push('    输出一行：' + (multiCard ? '[肉体|角色名|L/M/H|+|数值]' : '[肉体|L/M/H|+|数值]'));
      lines.push('    涨：轻微心动 1~3，明显被撩到 5~10，几乎撑不住 15 以上。这一维不设上限、也没有周额度。');
      lines.push('    落：被泼冷水、被打断、被拒绝、尴尬到清醒、累到没那个心思 → 写负值，掉多少写多少（最低到 0）。');
      lines.push('    ⚠️ 它和好感是两条独立的轴：可以讨厌一个人却被撩到（E 负、P 正），也可以深爱却克制（E 高、P 低）。');
      lines.push('       不要写成「好感够了才配有的东西」，也不要用好感的高低去推它。');
      lines.push('  · 嫉妒值 = 醋意。出现第三方、玩家和别人亲近、或角色被晾在一边时写：' + (multiCard ? '[嫉妒|角色名|L/M/H|+|数值]' : '[嫉妒|L/M/H|+|数值]'));
      lines.push('    数值 0.5~5.0，按醋意强度给；玩家主动安抚或明确表态之后，写一条负向让它降下来（例：' + (multiCard ? '[嫉妒|角色名|L|-|1]' : '[嫉妒|L|-|1]') + '）。');
      lines.push('  这两行都是可选的：这一轮确实有欲望、有醋意才写，没有就不写，不要硬凑。');
      /* 转折标签：把「这一轮算不算大事」的判断权真正交给模型。
         脚本不再替它拿主意 —— 但要给出写法和量级，否则它会每轮都写一条。 */
      lines.push('【重大转折 · 这一档的判断权在你手上】');
      lines.push('  当这一轮发生了真正「翻页」的事——记忆恢复、生死关头、关系挑明、背叛、诀别、');
      lines.push('  多年的心结被一句话解开——就写一行：');
      lines.push('    ' + (multiCard ? '[转折|角色名|+18|他想起她跪在雪里]' : '[转折|+18|他想起她跪在雪里]'));
      lines.push('  数值按情节给：±5 有触动但没跨过线 / ±10 明显偏转 / ±20 整段关系的走向变了 / ±30 是这种级别的上限。');
      lines.push('  第三段必须是理由（一句话），没理由脚本直接丢掉这一行；这一行不受每周好感额度限制。');
      lines.push('  写了 [转折] 的这一轮就不要再写 [Sylveina] 了——两个都写只认转折。');
      lines.push('  但别每轮都用：日常的你来我往、吃饱了、递杯水，那不叫转折，用 [Sylveina|…] 就够。');
      lines.push('  三个标签都可以交给脚本，正文里不要解释它们，也不要写它们算出了多少分。');
      lines.push('【重要：正则美化触发格式】正文剧情结束后，最后单独输出一个 Sylveina 数值标签（如果这一轮还写了 [肉体] / [嫉妒] / [转折]，放在它前面），下一行只输出小写字母 s。示例：');
      lines.push('[Sylveina|L|+|1.2]');
      lines.push('s');
      lines.push('【后台变量块 · 每一轮都必须重写一遍】不是建档写一次就完事；这一轮漏写，脚本就收不到这一轮的情绪与心声，状态卡会停在上一轮。放在 s 之后、正文之外，脚本会自动收走，玩家看不到：');
      lines.push('世界.时间=<本轮结束时的世界时间，格式必须是 YYYY年MM月DD日 · 星期X · HH:MM，只能前进不能倒退>');
      lines.push('世界.地点=<本轮结束时的场景地点>');
      lines.push('接着给本轮出场的每个角色各写三行（角色名照抄档案里的正名，一个字都别改）：');
      lines.push('角色.<角色名>.情绪=<单个 emoji，写Ta这一轮结束时的情绪>');
      lines.push('角色.<角色名>.心声=<15~40字第一人称内心话，写Ta这一轮真正没说出口的那一句>');
      lines.push('角色.<角色名>.在场=true / false　← 这一行是事实，不是名单：');
      lines.push('    true = 人就在这个场景里（看得见、能对话）；false = 不在（走了、被带走、在别处、还没到）。');
      lines.push('    只是「这一轮没说话」不算不在场，仍然写 true。');
      lines.push('    写了 false 的角色，本轮正文里不能有他的台词、动作、心理；也不要下一轮又让他凭空出现——');
      lines.push('    他要回来得有具体由头（被叫来、自己找来、事件推进），并在正文里交代一句。');
      lines.push('    允许一个人连续多轮不在场（独处、分头行动、异地、时间跳跃），不要为了让对话有来有回就把他拉回来。');
      lines.push('只有当该角色 E≥58 或 R≥3，且档案中尚无对玩家专属称呼时，才额外输出一行：角色.<角色名>.对玩家称呼=<根据角色性格创造的独特称呼>。已有称呼时不要再输出或修改。');
      lines.push('→ 心声与情绪是「每轮刷新的即时状态」，不是档案字段：每一轮都要按本轮剧情重写，哪怕和上一轮很像也要换一句新的。直接复制上一轮的心声，等同于这一轮没写。');
      /* 这里再写一遍 [心声|…] 的短格式：后面那条 depth 0 的独立提醒是最显眼的一条，
         但它挂在最末尾，部分酒馆 / 提示词管理器版本会把 depth 0 的注入丢掉或折叠。
         写进这一块（depth 1、和状态同一条）等于留了条备用通道 ——
         两条内容一致，谁到了都能让模型看见。 */
      lines.push('写完正文后，再给每个出场角色单独补一行心声标签（脚本靠它更新状态卡，漏一行算本轮没写完）：[心声|角色名|一句此刻的内心话，20字以内]');
      lines.push('（当前世界时间：' + (world.时间 || '未记录') + '｜当前地点：' + (world.地点 || '未记录') + '｜游戏日：第 ' + (Number(world._游戏日) || 0) + ' 天。'
        + '节奏规则：同一场景内的对话，每轮只推进 ' + getTurnMinutes() + ' 分钟（最多不超过 ' + (getTurnMinutes() * 2) + ' 分钟），不要自行跳到几小时之后或第二天；'
        + '只有玩家明确要求（第二天 / 三天后 / 睡一觉 / 跳过）或剧情确实需要转场时，才写出跨时段或跨天的新时间。'
        + '没有跨天就保持同一天，只把分钟往后推。）');
      lines.push('【分工】剧情事件的种类与节奏由脚本的骰子与导演系统决定，你不需要自己另起大事件；拿到哪件事，就把它写成最好看的那一版。');
      lines.push('禁止在正文与后台变量块里输出 好感度/肉体值/阶段值/嫉妒值 数值，禁止输出 JSON、UpdateVariable、StatusPlaceHolderImpl 或任何解释文字；四维数值全部由本插件按标签在本地计算和保存。');
      callSetPrompt(PROMPT_KEY + '_event', lines.join('\n'), 0, 1, false);
    } catch (e) { console.warn('[Doki] 状态注入失败：', e); }
  }

  /* 每轮一条「心声提醒」，注入位置在 prompt 最下面（position 4 / depth 0）。

     为什么单独一条：上面那一大坨规则里其实已经写了「每轮都要重写心声」，
     但它埋在中间，模型写到后面就疲劳了，经常整轮不写 —— 状态卡只能显示「本轮未收到」。
     把同样的要求压成一行、放到最后，模型照做的概率明显更高（这一行的位置比措辞更管用）。

     只留「角色名 + 格式 + 一个例子」，不重复讲道理：这一段每轮都在最显眼的位置，
     写长了反而把正文挤掉。 */
  /* 这一行的原文同时留一份：除了走 extension_prompts，还要在请求发出前贴到 chat 末尾
     （见 injectTailIntoFinalChat）。两条通道内容一样，位置不同——系统提示区管「在不在」，
     最后一条管「有没有用」。 */
  let _voiceTailNote = '';
  function getVoiceTailNote() { return _voiceTailNote; }

  function injectVoiceTagReminder() {
    try {
      const data = loadLocalState();
      const chars = (data && data.stat_data && data.stat_data.角色) || {};
      /* 只在场的点名写心声 —— 这一段在 prompt 最下面，点名越多越挤正文。
         但离场这件事仍要留一句口子：不加的话，AI 判了 false 之后
         下一轮提醒里就没这个人了，状态卡会一直停在「离场」。 */
      const names = Object.keys(chars).filter(function(n) {
        const ch = chars[n];
        return ch && !isCharSkeleton(ch) && ch.在场 !== false;
      }).slice(0, 3);
      if (!names.length) { _voiceTailNote = ''; callSetPrompt(PROMPT_KEY + '_voice', '', 0, 0, false); return; }
      const lines = [];
      lines.push('【最后一步·正文之后】给 ' + names.join('、') + ' 各写一行心声标签，缺一行算本轮没写完：');
      lines.push('[心声|角色名|一句此刻的内心话（20 字以内）]');
      lines.push('例：[心声|' + names[0] + '|他居然记得礼堂的事。]');
      lines.push('有人离场就补 角色.<名字>.在场=false，不用写心声。');
      lines.push('玩家看不到，别夹在正文中间。');
      /* 分维度标签也放在这一条里提醒一次。
         上面那一大段里其实写清了「什么时候写肉体、什么时候写嫉妒」，
         但和历史遗留的「只输出一个 Sylveina 标签」放在同一屏，模型很容易记住后者、忘掉前者。
         这里只给最少的信息（有就写、没有别写），不重复讲触发条件——讲长了这一段就没人读了。 */
      lines.push('有欲望补 [肉体|角色名|L|+|3]，有醋意补 [嫉妒|角色名|L|+|2]，都没有就不写。');
      lines.push('真翻页就用 [转折|角色名|数值|理由]，不写 Sylveina。');
      _voiceTailNote = lines.join('\n');
      callSetPrompt(PROMPT_KEY + '_voice', _voiceTailNote, 0, 0, false);
    } catch (e) { console.warn('[Doki] 心声提醒注入失败：', e); }
  }

  /* ── 掌机金手指转写出来的世界书 ────────────────────────────────────────
     链路：掌机读存档 → 金手指把同行 / 配招 / 道具 / 羁绊写成 world_info 条目
     → 掌机写自己的 localStorage → 宿主（87a）把整包塞进 chatMetadata
     → 这里读出来拼成一段，每轮挂在 prompt 上。

     以前这本只活在掌机里：玩家在屏内看得到条目，AI 一个字都收不到。
     那就不叫「写进剧情」，只是给人看的一份清单。 */
  const POCKET_WB_BUDGET = 6000;   // 整段上限，超了就按条目顺序截断
  const POCKET_WB_ENTRY_CAP = 900; // 单条正文上限，避免一个条目把预算吃光

  function readPocketWorldBook() {
    let bag = null;
    try {
      const ctx = getSTCtx();
      bag = (ctx && ctx.chatMetadata && ctx.chatMetadata[MOON_POCKET_SAVES_KEY]) || null;
    } catch (e) { bag = null; }
    if (!bag || typeof bag !== 'object') return null;

    let entries = [];
    Object.keys(bag).forEach(function (k) {
      if (k.indexOf('moon-pocket:worldbook:') !== 0) return;
      let arr = null;
      try { arr = JSON.parse(bag[k]); } catch (e) { return; }
      if (!Array.isArray(arr) || !arr.length) return;
      /* 掌机的存档键按它自己的 chatId 分；宿主这一侧只认「哪一条最全」，
         不去猜它用的是哪个 id —— 玩家换过聊天也不至于突然读不到。 */
      if (arr.length > entries.length) entries = arr;
    });
    if (!entries.length) return null;

    let name = '';
    const rawName = bag['moon-pocket:flag:wb-name'];
    if (rawName != null) {
      try { name = String(JSON.parse(rawName)); } catch (e) { name = String(rawName); }
    }
    return { name: name || '后宫王神宠秘籍', entries: entries };
  }

  function injectPocketWorldBook() {
    try {
      const book = readPocketWorldBook();
      const live = book ? book.entries.filter(function (e) {
        return e && !e.disable && String(e.content || '').trim();
      }).sort(function (a, b) { return (Number(a.order) || 100) - (Number(b.order) || 100); }) : [];
      if (!live.length) { callSetPrompt(PROMPT_KEY + '_pocket_wb', '', 0, 0, false); return; }

      const head = [
        '【' + book.name + ' · 玩家存档实测资料】',
        '以下是玩家在卡带里实际打出来的存档，已整理成条。写战斗、养成、收服、交换时按这里的资料为准：',
        '· 不得替换或增减玩家队伍成员；已列出的精灵，招式只能从它的配招里取。',
        '· 未列出的精灵、路人训练家可以正常出现，不要因为这份表就认为世界上只有这几只。',
      ].join('\n');

      const parts = [];
      let used = head.length;
      for (let i = 0; i < live.length; i++) {
        const title = String(live[i].comment || live[i].key && live[i].key[0] || '条目').trim();
        let body = String(live[i].content || '').trim();
        if (body.length > POCKET_WB_ENTRY_CAP) body = body.slice(0, POCKET_WB_ENTRY_CAP) + '…';
        const chunk = '▸ ' + title + '\n' + body;
        if (used + chunk.length + 2 > POCKET_WB_BUDGET) break;
        parts.push(chunk);
        used += chunk.length + 2;
      }
      if (!parts.length) { callSetPrompt(PROMPT_KEY + '_pocket_wb', '', 0, 0, false); return; }
      callSetPrompt(PROMPT_KEY + '_pocket_wb', head + '\n\n' + parts.join('\n\n'), 0, 1, false);
    } catch (e) { console.warn('[Doki] 神宠秘籍注入失败：', e); }
  }

  function injectRelationshipFactsPrompt() {
    try {
      const data = readMvuLatest();
      const chars = data && data.stat_data && data.stat_data.角色;
      if (!chars || typeof chars !== 'object') {
        callSetPrompt(PROMPT_KEY + '_relationship_facts', '', 0, 0, false);
        return;
      }
      const lines = [
        '【当前关系资料 · 只声明关系，不规定表现】',
        '以下为脚本保存的当前关系记录。本段只回答「你们现在是什么关系」，不回答「这种关系该怎么演」。',
        '剧本里谁更亲近、谁先低头、能开什么玩笑、要不要告白，按世界书（含玩家自带的感情/关系设定）和角色卡来写；世界书与本节冲突时，世界书优先。',
        '它不要求角色变得倒贴、冷漠、顺从、占有、告白或拒绝；不得仅凭分数推断角色会做出某种具体行为。',
        '关系已由脚本判定完成，你不需要再判断、也不要在正文里讨论「我们算什么关系」。小抄或旧对话中的态度描述不能擅自覆盖这份记录，也不能凭空升级关系。'
      ];
      Object.keys(chars).forEach(function(name) {
        const ch = chars[name];
        if (!ch || isCharSkeleton(ch)) return;
        const E = Number(ch.好感度) || 0;
        const R = Number(ch.阶段值) || 0;
        const P = Number(ch.肉体值) || 0;
        const I = Number(ch.嫉妒值) || 0;
        const stage = getRStageFromE(E);
        const address = String(ch.对玩家称呼 || '').trim();
        const q = ch._quota || {};
        const cap = Number(MOON_FORMULA_PARAMS.weeklyCap[getCurrentMode()] || MOON_FORMULA_PARAMS.weeklyCap.normal);
        /* 和注入里那份口径一致：超额记录（老存档 / 手改过）不能再往上飘，
           否则这里会出现「12.0/7.0（剩余 0.0）」这种自相矛盾的读数。 */
        const used = Math.min(cap, Math.max(0, Number(q.好感度周上限已用) || 0));
        const remain = Math.max(0, roundHalf(cap - used));
        lines.push('角色「' + name + '」：E=' + E + '；关系阶段=' + stage.name + '；脚本阶段值 R=' + R + '；P=' + P + '；I=' + I + '；本周正向 E 额度=' + used.toFixed(1) + '/' + cap.toFixed(1) + '（剩余 ' + remain.toFixed(1) + '）。');
        if (address) lines.push('角色「' + name + '」已保存的对玩家专属称呼：「' + address + '」。这是持久资料，合适的直接称呼场景自然使用，不要自行改名。');
      });
      lines.push('不要在正文中解释这些数值或复述关系分析；它们只用于维持上下文一致。');
      callSetPrompt(PROMPT_KEY + '_relationship_facts', lines.join('\n'), 0, 1, false);
    } catch (e) { console.warn('[Doki] 关系事实注入失败：', e); }
  }

  function injectCardModeNotice() {
    const mode = getCardMode();
    if (mode === 'multi') {
      const content = ['【卡组模式：多人卡】', '标签必须带角色名，格式：[Sylveina|角色名|L/M/H|+/-|基础值]，例：[Sylveina|长谷川茗|L|+|1.5]。', '标签里的角色名必须使用本轮剧情中实际互动的角色正名，不要用昵称或称呼。', '若本轮与多个角色有互动，为每一个角色分别输出各自的 Sylveina 标签。', '没有写角色名的标签只会结算给「主要攻略对象」一个人，其他角色不会加分。'].join('\n');
      callSetPrompt(PROMPT_KEY + '_cardmode', content, 0, 1, false);
    } else {
      const content = ['【卡组模式：单人卡】', '本轮数值标签统一使用角色卡主名（即当前对话的角色名）。', '不要用剧情里的昵称、称呼、化名或别名作为 <名>。', '若剧情里出现其他配角，可以在正文中描写，但数值标签只针对角色卡主名这一条。'].join('\n');
      callSetPrompt(PROMPT_KEY + '_cardmode', content, 0, 1, false);
    }
  }

  function injectFanficEnhanceNotice() {
    if (!getFanficEnhance()) { callSetPrompt(PROMPT_KEY + '_fanfic', '', 0, 0, false); return; }
    const content = ['═══════════════════════════════════', '🌐【同人台词补强 · 已开启】', '本卡涉及原著 IP。请在撰写角色台词时遵循以下规则：', '① 台词优先参考该角色在原 IP 源语言里的用语习惯、口头禅、称谓、语气、节奏。', '② 若你能判断 IP 与源语言（如《文豪野犬》= 日语；《哈利波特》= 英语），台词请优先按源语言语感写；如玩家开了双语输出，则翻译部分使用源语言直译，不要意译、不要润色。', '③ 允许保留少量源语言原文词（称谓/语气词/专有名词），让台词更贴近原作。', '④ 不改变角色人设，不脱离当前剧情进度，只调整「说话方式」。', '═══════════════════════════════════'].join('\n');
    callSetPrompt(PROMPT_KEY + '_fanfic', content, 0, 2, false);
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
    callSetPrompt(PROMPT_KEY + '_safety', content, 0, 2, false);
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
    // 0 是「这一轮没打动Ta」的合法写法，不要被夹成下界，否则每轮都会被强制加分
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
    /* getDimCoeff 是给 E 用的 S 曲线（<30 时 ×0.5），目的是让「刚认识」涨得慢。
       但 P / I 都从 0 起步，套同一条曲线等于永远爬不出 0（0.5 的 0.5 还是 0.5）。
       而且「肉体」「嫉妒」本来就不该按好感度的同一套节奏走，所以这两维固定 ×1.0。 */
    if (dim !== 'R' && dim !== 'P' && dim !== 'I') delta *= getDimCoeff(oldValue);
    // direction 是方向，不是倍率：负向必须先带负号，否则 '-' 标签也会给 E 加分。
    if (direction === '负向') delta *= -getNegCoeff(mode, dim);
    delta *= abyssMult;
    let emotionResult = null;
    if (dim === 'E' && !shouldSkipEmotion(charData, mode)) {
      const threshold = getEmotionThreshold(eventType);
      const dice = Math.floor(Math.random() * MOON_FORMULA_PARAMS.emotionDice) + 1;
      const passed = dice >= threshold;
      if (passed) delta += getEmotionBonus(mode, eventType, direction);
      emotionResult = { dice: dice, threshold: threshold, passed: passed };
    }
    /* ── P / I 的专属约束 ──────────────────────────────────────────
       P 是**欲望（色欲）**，不是「身体关系的进度条」。
       这个定义差一点就把整套规则带歪，所以写清楚它意味着什么：

         · 欲望可以凭空产生。不用真的碰到，甚至不用对方在场——
           闻到味道、看到不该看的、被撩了一句、自己脑补，都算。
         · 欲望和好感是两条独立的轴。讨厌一个人也可能被撩到（E 负、P 正），
           深爱一个人也可能克制（E 高、P 低）。如果按「好感够了才许有欲望」
           去卡，这一维就退化成好感的影子，四维也没必要存在了。
           ——所以这里**没有 R 门槛**（之前那版有，是按「身体接触程度」理解的，
           定义纠正后必须删掉）。

         不设单轮上限、不设周额度、不封顶：用户要的是「一口气加很多、
         也能一口气减很多」。只保住下限 0（欲望不会变成负数）。

       I（嫉妒）相反：谁都能吃醋，但它是最容易失控的一维（剧情里
       「有人搭话」就能写一条），所以单轮上限压到 5，并由 50-calc
       每回合做一次自然回落（见 applyEnvyDecay）。 */
    if (dim === 'I' && Math.abs(delta) > 5) delta = Math.sign(delta) * 5;
    if (dim !== 'P' && Math.abs(delta) > MOON_FORMULA_PARAMS.singleCap) delta = Math.sign(delta) * MOON_FORMULA_PARAMS.singleCap;
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
    let newValue = roundHalf(oldValue + delta);
    /* 下限一律 0（负数没意义）；上限只有嫉妒有。
       肉体不封顶 —— 用户要的是「可以一口气加很多」，
       硬塞一个 100 的天花板，剧情里真要连着写几场亲密戏就会卡住不动，
       状态卡上看着像脚本坏了。
       夹完要把 delta 重算一遍，否则「嫉妒 99 再 +5」会记成 +5、newValue=100，
       结算提示和正文徽章都在报一个没发生过的涨幅。 */
    if (dim === 'P' || dim === 'I') {
      const floor = Math.max(0, newValue);
      const bounded = (dim === 'I') ? Math.min(100, floor) : floor;
      if (bounded !== newValue) { newValue = bounded; delta = roundHalf(newValue - oldValue); }
    }
    return { delta: delta, oldValue: oldValue, newValue: newValue, fieldName: fieldName, dimension: dim, emotionResult: emotionResult, isAbyss: isAbyss, weeklyBlocked: weeklyBlocked };
  }

  /* 嫉妒的自然回落。

     这里**不另定规则**，而是接回角色档案里本来就有的那个字段：
       `_invidia.每日衰减基数`
     它从 v4.6 起就写在每个角色档案的模板里（同组还有 重力等级 / 骰子判定阈值 /
     大失败反噬值 / 主动互动阈值），只是从来没有代码去读它 —— 嫉妒一直是「只按事件变、
     不会自己消」的状态。现在把这一条接上，用的是既有设计，不是我新发明的数值：

       每日衰减基数 > 0  → 每跨过一个**游戏日**，嫉妒减这么多
       每日衰减基数 = 0  → 不自动衰减（默认值；所有老存档都是 0，行为与旧版完全一致）

     为什么按「日」不按「回合」：醋是过一夜会淡的东西。
     按回合算的话，玩家一晚上聊四十轮，天都没亮嫉妒就自己清零了，那不合理。
     走 `_内部流逝天数`，和「好感周额度按游戏日重置」是同一个时间轴。

     收到 [嫉妒] 标签的那一轮不衰减 —— 那轮本来就有由头，
     降不降由玩家做了什么决定（写负值才是「被哄好了」）。 */
  function applyEnvyDecay(charData, gameDay, opts) {
    if (!charData) return null;
    const cfg = charData._invidia || {};
    const base = Number(cfg.每日衰减基数) || 0;
    if (!(base > 0)) return null;
    const q = charData._quota || (charData._quota = {});
    const day = Math.max(0, Math.floor(Number(gameDay) || 0));
    const lastRaw = Number(q._envyDecayDay);
    const hasLast = isFinite(lastRaw);
    if (hasLast && day <= lastRaw) return null;
    /* markOnly：这一轮收到了 [嫉妒]，按设计不降，但「这一天」照样要记下来。
       不记的话，下一次衰减会从更早那天算起，把今天连本带利补扣掉 ——
       玩家看到的是「明明安抚了她，第二天反而掉得更多」。 */
    const markOnly = !!(opts && opts.markOnly);
    q._envyDecayDay = day;
    if (markOnly) return null;
    const cur = Number(charData.嫉妒值) || 0;
    if (cur <= 0) return null;
    /* 一次跨了好几天就按天数乘。上界 7 天，避免玩家跳一年直接把嫉妒清零之后
       又觉得「怎么一觉醒来全没了」—— 超过一周的部分不再累乘。 */
    const days = hasLast ? Math.max(1, Math.min(7, day - lastRaw)) : 1;
    const next = Math.max(0, roundHalf(cur - base * days));
    if (next === cur) return null;
    charData.嫉妒值 = next;
    return { oldValue: cur, newValue: next, delta: roundHalf(next - cur), fieldName: '嫉妒值', dimension: 'I', days: days, base: base };
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

