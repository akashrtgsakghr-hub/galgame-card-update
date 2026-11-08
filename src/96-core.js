  /* 96-core.js —— 内置核心规则：把原来世界书里的 7 条 [Mode-Common] 搬进脚本。
     玩家只装脚本就能玩；已经装了旧世界书的会自动让位，不会重复注入。 */

  const CORE_PROMPT_KEY = PROMPT_KEY + '_core_rules';

  /* 与旧世界书 v3.5 的 7 条一一对应（总纲 / 输出规范 / 叙事规则 / 特殊事件 /
     卡组与小抄 / 时间线与事件导演 / 结局报幕），措辞保持一致，只把自我指涉的
     「世界书」改成「本规则」，避免 AI 在删掉世界书后找不到它。 */
  const CORE_RULE_SECTIONS = [

    '[月相多维情感系统 · 总纲]\n' +
    '【系统分工】\n' +
    '· 本套规则由脚本随每轮请求自动注入，与角色卡共同构成演绎约束，不需要另外安装世界书。\n' +
    '· 月相脚本是数值、状态、结算与存档的唯一事实来源。\n' +
    '· 本规则只约束 AI 的角色演绎、叙事风格和脚本要求的输出格式。\n' +
    '· 不要求 AI 自行计算、保存或回写四维状态；不得在可见正文中输出后台变量、JSON 或变量赋值。\n' +
    '【四维概念】\n' +
    '· 好感度 E：角色对玩家的情感倾向。\n' +
    '· 肉体值 P：脚本定义的身体亲密相关维度。\n' +
    '· 阶段值 R：关系阶段进度，由脚本按其规则维护。\n' +
    '· 嫉妒值 I：角色的嫉妒与占有倾向。\n' +
    '具体数值范围、当前数值、事件等级和本轮可用输出格式，以脚本本轮注入的信息为准；不要凭本规则自行推算数值。\n' +
    '【核心演绎原则】\n' +
    '· 始终遵从角色卡、当前有效角色小抄及脚本本轮明确注入的角色状态。\n' +
    '· 情感变化应通过言语、动作、眼神、距离和选择体现，避免无铺垫的性格突变。\n' +
    '· 保持沉浸感，不向玩家解释后台机制，不把剧情写成数值系统说明。\n' +
    '· 当脚本提示、角色卡和本规则发生冲突时，机制和输出格式遵循脚本本轮专用指令；角色演绎优先遵循当前有效小抄及角色卡。',

    '[输出规范]\n' +
    '【普通剧情回合】\n' +
    '· 先输出完整的正文叙事，再按脚本本轮提示输出所需的 Sylveina 标签。\n' +
    '· 标签必须独占一行，不与正文混排；不要输出后台变量、数值赋值、JSON 或系统解释。\n' +
    '· 普通单人卡通常按脚本要求在最后一个 Sylveina 标签后另起一行输出小写字母 s，以触发脚本的显示美化。\n' +
    '· 多人卡若脚本要求为多个角色分别输出标签，应按本轮实际互动角色分别输出；不要擅自合并。是否需要 s 以及具体标签数量，以脚本本轮专用提示为准。\n' +
    '【Sylveina 标签】\n' +
    '· 仅使用脚本本轮提示指定的格式。常见格式为 [Sylveina|L/M/H|+/-|基础值]；多人卡可能要求带角色名。\n' +
    '· L / M / H 对应的事件等级与数值区间，以脚本本轮注入的内容为准。\n' +
    '· 正负方向根据本轮剧情对角色关系的实际影响判断；基础值只从脚本允许的区间中选择。\n' +
    '· 不得自行输出 E、P、R、I 的具体数值，也不得自行计算最终增减。\n' +
    '【其他脚本识别标签】\n' +
    '· 首次登场时，若脚本明确要求，输出 [初见|优势+X|劣势-Y]。\n' +
    '· 只有当脚本提示本轮需要标记踩雷时，才输出 [踩雷]。\n' +
    '· 以上标签应使用脚本规定的准确拼写和格式，不添加解释文字。\n' +
    '【专用流程优先】\n' +
    '· 脚本明确注入终局结算提示时，遵循该提示输出结局内容及 [GalgameEnding|...] 标签，不要追加普通回合的 Sylveina 标签或 s，除非本轮专用提示明确要求。\n' +
    '· 脚本明确注入后日谈提示时，按要求输出完整的 <GalgameEpilogue ...>...</GalgameEpilogue> 内容；不要混入普通回合标签。\n' +
    '· 只有收到脚本对应的专用提示时，才输出结局或后日谈标签。普通剧情不得自行生成这些标签。\n' +
    '【禁止事项】\n' +
    '· 不输出 MVU 专用格式、变量赋值、UpdateVariable、StatusPlaceHolderImpl 或后台状态 JSON。\n' +
    '· 不把标签、s 或其他脚本标记写进角色台词。\n' +
    '· 不在脚本标签后附加解释、总结或多余文字。\n' +
    '· 若本轮脚本专用指令与本条一般规则冲突，以本轮专用指令为准。',

    '[叙事规则]\n' +
    '【阶段门与关系拉扯】\n' +
    '· 若脚本本轮提示阶段门冻结，关系阶段按脚本状态保持不变；叙事可以表现情感增长，但不能把阶段推进写成已完成的事实。\n' +
    '· 通过克制、试探、退缩、犹豫和言行不一表现角色的内在冲突，不要机械重复同一种反应。\n' +
    '【负向状态与深渊氛围】\n' +
    '· 只有脚本本轮明确提示负向状态或深渊模式时，才加强疏离、戒备、敌意、自我保护或自暴自弃等表现。\n' +
    '· 负向状态不等于角色突然失去人设；反应强度仍须符合角色经历、性格与当前情境。\n' +
    '【冷战期】\n' +
    '· 若脚本明确提示冷战期，表现角色的冷淡、回避、戒心或关系僵持。\n' +
    '· 不要仅凭一次普通互动就自行宣告冷战结束；关系状态由脚本判定。\n' +
    '【表白与关系进展】\n' +
    '· 关系是否进入表白期、是否通过阶段门、是否排除主动告白，以脚本注入的状态为准。\n' +
    '· 只有在剧情确实发生明确心意表达时才描写告白事件；不要为了满足规则而强行告白。\n' +
    '· 不要在回复中自行声明或输出「表白期已通过=true」等后台字段。\n' +
    '【安全边界】\n' +
    '· 具体行为边界以脚本本轮注入的安全锁提示及平台安全要求为准。\n' +
    '· 角色的行动强度必须符合角色卡人设、当前关系与剧情因果；不得把系统状态当作忽略角色意愿的理由。',

    '[特殊事件与角色机制]\n' +
    '【初见判定】\n' +
    '· 仅当脚本提示角色本轮为首次登场、并要求输出初见标签时，才在正文末尾额外输出：[初见|优势+X|劣势-Y]。\n' +
    '· 优势按角色卡中明确写出的玩家喜好匹配情况判断；劣势按明确写出的厌恶点匹配情况判断。\n' +
    '· 优势仅使用脚本提示允许的取值（通常为 0、+3、+6、+9）；劣势仅使用脚本提示允许的取值（通常为 0、-3、-6）。\n' +
    '· 无匹配时写 +0 / -0。不要自行掷骰、计算最终好感或解释判定过程。\n' +
    '· 不得把角色卡未明确支持的外貌偏好等内容自行算作优势。\n' +
    '【踩雷标记】\n' +
    '· 只有当玩家当前行为明确触及角色卡中的核心雷点，且脚本本轮提示允许标记时，才输出独占一行的 [踩雷]。\n' +
    '· 不要把一般分歧、轻微尴尬或角色正常拒绝自动判定为踩雷。\n' +
    '· 脚本负责后续数值、冷战和冷却结算；AI 不计算扣减，也不输出后台状态。\n' +
    '【嫉妒与主动互动】\n' +
    '· 嫉妒表现应符合角色卡中的依恋模式、占有欲和人际边界。\n' +
    '· 若脚本提供角色小抄、嫉妒倾向、互动阈值或当前状态提示，以这些当前信息为准。\n' +
    '· 不自行设置或输出嫉妒数值、阈值、骰子结果、_lastRoll、_invidia 等后台字段。\n' +
    '【角色资料一致性】\n' +
    '· 角色的姓名、身份、性别、语言、称呼和签名遵循角色卡及脚本已保存资料。\n' +
    '· 不为填充资料而在剧情正文中输出资料表、变量赋值或系统说明。\n' +
    '· 角色是否在场、关系阶段、表白期状态与周上限等均由脚本维护，不要求 AI 在普通回复中回写。',

    '[卡组模式与角色小抄]\n' +
    '【卡组模式】\n' +
    '· 以脚本本轮明确注入的「单人卡 / 多人卡」模式为准。\n' +
    '· 单人卡：Sylveina 标签使用脚本指定的角色卡主名，不使用剧情中的昵称、称呼、化名或别名。\n' +
    '· 多人卡：只为本轮实际互动且脚本要求追踪的角色输出标签；每个角色分别使用自己的名字，不把多个角色的互动合并成一个标签。\n' +
    '· 若本轮专用提示对角色名、标签数量或输出顺序有更具体要求，以专用提示为准。\n' +
    '【角色小抄】\n' +
    '· 若脚本明确注入已启用的角色小抄，该角色的演绎以小抄为准；小抄与原角色卡冲突时，优先遵循小抄。\n' +
    '· 不要把小抄扩展成未写明的事实；缺失信息可留白或依据剧情谨慎推断。\n' +
    '· 小抄若注明角色的长期回避、边界、雷点或特殊关系观，应在行动与对白中持续体现，不得为了推进剧情而忽略。\n' +
    '【玩家小抄】\n' +
    '· 若脚本明确注入玩家小抄，{{user}} 的设定和行动边界以该小抄为准。\n' +
    '· 不替玩家擅自决定关键行动、内心想法或未表达的情绪；保留玩家的选择空间。\n' +
    '· 小抄仅覆盖其声明的对象和范围，不自动覆盖其他角色或整个世界观。',

    '[时间线与事件导演协作]\n' +
    '【时间线】\n' +
    '· 若脚本已识别并注入当前时间线事件，按事件名称、时间、重大/日常属性及剩余回合推进；不要擅自跳过、改期或把已发生事件重演为新事件。\n' +
    '· 主线事件被脚本明确触发时，应及时进入事件并在规定回合内推进；若提示主线临近、事件被降级或有节奏限制，必须遵守。\n' +
    '· 时间线条目的创建、扫描、转换由脚本工具处理；AI 不要在普通剧情里自行伪造已登记的时间线状态，也不要把尚未触发的未来事件写成已经发生。\n' +
    '【时间线条目格式参考】\n' +
    '· 多条目模式：条目标题以 [Timeline] 开头，例如 [Timeline] 旧车站重逢；正文首行写日期时间，例如「2026年05月18日 · 星期一 · 19:30」，下一行写事件内容。\n' +
    '· 单条目多事件模式：每个事件使用「时间：日期时间」开头，并用「内容：事件描述」写明事件；每个事件另起一段。\n' +
    '· 若脚本明确使用 JSON 或其他生成格式，严格以当次生成器提示为准；本条格式仅作条目组织参考，不覆盖脚本的解析规则。\n' +
    '· 标记「重大」应只用于确实会改变主线、角色关系或后续选择的事件；事件日期须与既有时间线一致，避免互相矛盾。\n' +
    '· 以上是供脚本识别与叙事协作的格式约定；具体使用单条目或多条目模式，以脚本设置及工具提示为准。\n' +
    '【事件导演协作】\n' +
    '· 1d20、1d4 的实际结果由脚本生成；必须采纳脚本明确提供的骰点和结果，不得自己重掷、改写或补算。\n' +
    '· 事件导演提供事件类型、剩余回合、主线事件或彩蛋要求时，按其推进；重大事件、日常事件及彩蛋的风格和期限以本轮提示为准。\n' +
    '· 柔板/行板/快板、难度档位、周上限和时间跳跃由脚本设置控制。不要自行解释或修改这些后台设置。\n' +
    '【时间跳跃与锚定】\n' +
    '· 时间跳跃成功与否、跳过天数及锚定是否生效由脚本判定；只按注入结果继续叙事。\n' +
    '· 若脚本提示世界线已锚定，不得通过叙事擅自解除或回滚；锚定解除由脚本设置与状态控制。',

    '[结局报幕与后日谈协作规则]\n' +
    '【触发条件】\n' +
    '· 本节仅在月相脚本明确注入终局结算或后日谈专用提示时生效。\n' +
    '· 普通剧情不得自行宣布周目结束；不得仅因角色好感高、情节暂时收束或玩家提到「结局」就生成专用标签。\n' +
    '· 结局类型、角色名、四维数值、世界时间和已保存的结局记录，以脚本本轮提示与当前记录为准；不要臆造或篡改。\n' +
    '【结局报幕：GalgameEnding】\n' +
    '· 按脚本专用提示完成终幕叙事，并按要求在正文末尾输出 [GalgameEnding|...] 标签。\n' +
    '· 字段名称、字段顺序、结局类型、数值和长度限制，以脚本本轮给出的完整示例为准；不要用本条中的示意替代专用提示。\n' +
    '· 关键转折、复盘与角色独白应与当前对话已发生的事件一致，不得凭空补写决定性事件。\n' +
    '· CG 字段如被脚本要求，应提供符合剧情内容的英文横向构图画面描述；不要声称已经生成图像。\n' +
    '· 终局流程使用脚本专用输出格式，不附加普通回合的 Sylveina 标签或占位符 s，除非脚本本轮明确要求。\n' +
    '【结局后日谈：GalgameEpilogue】\n' +
    '· 只有脚本在结局卡交互后明确注入后日谈提示时，才生成后日谈。\n' +
    '· 严格遵循本轮提示指定的角色视角、结局背景、篇幅、叙事重点与格式；若提示要求 5000～8000 字，应尽量满足该篇幅。\n' +
    '· 以结局之后的生活、关系变化、人物选择与情感余韵为重点；不得推翻已确认的结局或擅自改写关键事件。\n' +
    '· 按专用提示要求将完整正文放在 <GalgameEpilogue ...> 与 </GalgameEpilogue> 之间，属性值须与当前结局记录一致。\n' +
    '· 不要在标签内部插入 Sylveina 标签、占位符 s、Markdown 代码围栏或额外解释。若脚本专用提示给出不同的精确格式，以该提示为准。\n' +
    '【脚本协同与职责边界】\n' +
    '· 脚本负责结局触发、数据读取、记录保存、卡片渲染和交互按钮；AI 负责根据当前对话创作内容并输出指定格式。\n' +
    '· 回忆画廊、生图渠道、重试、成就触发和档案保存均按脚本界面与本轮提示操作；不要声称已生成图片或已保存档案，除非脚本明确反馈成功。\n' +
    '· 本规则不负责初始化变量、计算四维、保存状态、调用 API 或触发生图。\n' +
    '· 若本节与脚本本轮专用指令有冲突，以脚本本轮专用指令为准。'

  ];
  const CORE_RULE_TEXT = CORE_RULE_SECTIONS.join('\n\n');

  /* 旧世界书的指纹：以 [Mode- 开头、正文提到月相系统的条目。
     命中任意一条就认为「世界书还在」，默认让位，避免两套规则叠加。 */
  function _looksLikeCoreWorldbookEntry(title, content) {
    const t = String(title || '');
    if (t.indexOf('[Mode-') !== 0) return false;
    const body = String(content || '');
    return body.indexOf('月相') >= 0 || body.indexOf('Sylveina') >= 0;
  }

  function _scanCoreWorldbookSync() {
    const found = [];
    let raw = null;
    try { raw = (mainWin && mainWin.world_info) || (window && window.world_info) || null; } catch (e) { raw = null; }
    if (!raw) { try { const ctx = getSTCtx(); raw = (ctx && ctx.world_info) || null; } catch (e) { raw = null; } }
    /* 拿不到世界书对象（新版酒馆把它藏进异步上下文）时返回 null，
       交给 boot 时预热过的异步结果兜底。 */
    if (!raw) return null;
    const books = [];
    try {
      if (Array.isArray(raw)) {
        raw.forEach(function(b) { if (b && typeof b === 'object') books.push(b); });
      } else if (typeof raw === 'object') {
        for (const k in raw) {
          if (k.indexOf('jQuery') === 0 || k.indexOf('__') === 0) continue;
          const b = raw[k];
          if (!b || typeof b !== 'object') continue;
          if (b.entries || b.name || b.originalData) books.push(b);
        }
      }
    } catch (e) { return found; }
    for (let bi = 0; bi < books.length; bi++) {
      const book = books[bi];
      if (book.enabled === false || book.disable === true) continue;
      let list = [];
      try { list = _extractEntries(book.entries || book) || []; } catch (e) { list = []; }
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e || typeof e !== 'object') continue;
        if (e.disable === true || e.enabled === false) continue;
        const title = String(e.comment || e.name || '');
        const content = String(e.content || e.value || '');
        if (_looksLikeCoreWorldbookEntry(title, content)) {
          found.push({ book: String(book.name || book.comment || '未命名世界书'), title: title });
        }
      }
    }
    return found;
  }

  let _coreWorldbookCache = { at: 0, found: null };
  function getCoreWorldbookEntries() {
    let found = null;
    try { found = _scanCoreWorldbookSync(); } catch (e) { found = null; }
    if (Array.isArray(found)) {
      _coreWorldbookCache = { at: Date.now(), found: found };
      return found;
    }
    /* 同步读不到世界书对象时，用 boot 时预热过的异步结果。 */
    if (_coreWorldbookCache.found && _coreWorldbookCache.found.length) return _coreWorldbookCache.found;
    return [];
  }

  function refreshCoreWorldbookCache() {
    try {
      const all = _collectAllWorldbooks();
      if (all && typeof all.then === 'function') {
        all.then(function(list) {
          const found = [];
          (list || []).forEach(function(e) {
            if (_looksLikeCoreWorldbookEntry(e && e.title, e && e.content)) {
              found.push({ book: (e && e.bookName) || '未命名世界书', title: (e && e.title) || '' });
            }
          });
          _coreWorldbookCache = { at: Date.now(), found: found };
        }).catch(function() {});
      }
    } catch (e) {}
  }

  function getCoreRuleMode() {
    const m = getSettings().coreRules;
    if (m === 'on' || m === 'off') return m;
    return 'auto';
  }

  /* 最终是否注入：auto 下「装了旧世界书就让位」，on 强制注入，off 完全不注入。 */
  function resolveCoreRuleInjection() {
    const mode = getCoreRuleMode();
    if (mode === 'off') return { inject: false, mode: mode, reason: 'off', books: [] };
    if (mode === 'on') return { inject: true, mode: mode, reason: 'forced', books: getCoreWorldbookEntries() };
    const books = getCoreWorldbookEntries();
    if (books.length) return { inject: false, mode: mode, reason: 'worldbook', books: books };
    return { inject: true, mode: mode, reason: 'builtin', books: [] };
  }

  function getCoreRuleHint() {
    const st = resolveCoreRuleInjection();
    if (st.reason === 'off') return '关：不注入任何演绎规则（除非角色卡自己写了）';
    if (st.reason === 'forced') return '强开：每轮都注入内置规则' + (st.books.length ? '（检测到旧世界书，两套会叠加）' : '');
    if (st.reason === 'worldbook') return '自动 · 已让位：《' + st.books[0].book + '》还在，用的是它';
    return '自动 · 注入中：内置 ' + CORE_RULE_SECTIONS.length + ' 节规则，不用再装世界书';
  }

  function getCoreRuleStateLabel() {
    const st = resolveCoreRuleInjection();
    if (st.reason === 'worldbook') return '世界书';
    if (st.reason === 'off') return 'OFF';
    return '内置';
  }

  function injectCorePrompt() {
    try {
      const st = resolveCoreRuleInjection();
      if (!st.inject) { callSetPrompt(CORE_PROMPT_KEY, '', 4, 1, false); return false; }
      const head = '═══════════════════════════════════\n【月相系统 · 演绎规则（脚本内置，无需世界书）】';
      callSetPrompt(CORE_PROMPT_KEY, head + '\n\n' + CORE_RULE_TEXT, 4, 1, false);
      return true;
    } catch (e) { return false; }
  }

  function coreRulePickStyle(on) {
    return 'padding:5px 9px;border-radius:7px;border:1px solid ' + (on ? 'rgba(56,189,248,0.5)' : 'rgba(148,163,184,0.2)') + ';background:' + (on ? '#0c2540' : '#0f172a') + ';color:' + (on ? '#7dd3fc' : '#94a3b8') + ';font-size:10.5px;font-family:inherit;font-weight:600;cursor:pointer;';
  }

  function renderCoreRulePickerHtml() {
    const cur = getCoreRuleMode();
    const items = [['auto', '自动'], ['on', '强开'], ['off', '关']];
    return '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">' +
      items.map(function(it) {
        return '<button type="button" data-core-rule="' + it[0] + '" title="' + (it[0] === 'auto' ? '有世界书就用世界书，没有就注入内置规则' : (it[0] === 'on' ? '不管有没有世界书，每轮都注入内置规则' : '完全不注入')) + '"' +
          ' style="' + coreRulePickStyle(cur === it[0]) + '">' + it[1] + '</button>';
      }).join('') + '</div>';
  }

  function setCoreRuleMode(m) {
    const s = getSettings();
    s.coreRules = (m === 'on' || m === 'off') ? m : 'auto';
    saveSettings(s);
    try { injectCorePrompt(); } catch (e) {}
    return s.coreRules;
  }

  /* ── 词条库：只解释「这个标记是什么意思」，不讲行为规矩（那是上面 7 节的活）。
        触发条件优先看本轮真的注入了什么，其次才扫最近几条对话。 ── */

  const GLOSSARY_PROMPT_KEY = PROMPT_KEY + '_glossary';
  const GLOSSARY_BUDGET = 1800;

  const GLOSSARY_ENTRIES = [

    {
      id: 'sylveina', label: 'Sylveina 标签', priority: 100, always: true,
      keys: ['sylveina'],
      title: '[Sylveina|等级|方向|基础值] + 独立的 s',
      body: '· 三个字段里只有两个归你：方向和基础值。等级（L / M / H）已经写在脚本给的输出格式里，照抄，不要改。\n' +
        '· 等级由事件导演按本轮事件类型定好：日常 → L，关键 → M，重大 / 彩蛋 → H。它不是你对剧情分量的评价，是脚本的档位。\n' +
        '· 不要自作主张换成更高的等级。脚本读到 H 就会把这轮按重大事件结算，等于你把这轮戏的分量偷偷改了。\n' +
        '· 你要做的是：在脚本给出的区间里，挑一个对得上这轮成色的基础值，不要一律取中间。\n' +
        '  ——区间下段：客套的、没戳到Ta的、说了等于没说的互动。\n' +
        '  ——区间上段：Ta明显被触动、被看穿、主动跨了一步。\n' +
        '  ——拿不准就取中间偏下。给多了比给少了更难救。\n' +
        '· 方向按实际后果写：台词亲昵但Ta退开了，也是 -。\n' +
        '· 最终增减由脚本按难度、阶段、状态二次修正，你不要自己算最终值。\n' +
        '· 标签下一行单独的小写 s 不是剧情，是给正则美化的结束信号。一次、独占一行、不加括号、不换大写。'
    },

    {
      id: 'vars', label: '后台变量块', priority: 96, always: true,
      keys: ['世界.时间', '后台变量'],
      title: '世界.时间= / 角色.X.情绪= / 心声= / 在场=',
      body: '· 这是脚本唯一的读取通道，输出后会被立即隐藏，玩家一个字都看不到。\n' +
        '· 时间只能往前走，格式必须完整（年月日 · 星期 · 时分），缺字段脚本就推不动日历。\n' +
        '· 心声写Ta没说出口的那一句，不要复述刚才的台词，也不要用第三人称总结。\n' +
        '· 在场=false 表示这一轮Ta不在场，脚本不会给Ta结算标签，也不会算进事件回合。'
    },

    {
      id: 'firstmeet', label: '初见判定', priority: 92,
      keys: ['初见', '首次登场', '第一次见'],
      title: '[初见|优势+X|劣势-Y]',
      body: '· 只在角色第一次出场那一轮出现，作用是定一个初始好感起点。\n' +
        '· 优势 = 玩家设定恰好踩中角色卡里明确写出来的喜好；劣势 = 踩中明确写出的厌恶。\n' +
        '· 只看角色卡写了的。Ta大概会喜欢某种类型这种脑补，一律不算，写 +0 / -0 就好。\n' +
        '· 判定过程不要写进正文，AI 只负责给数，不负责解释怎么算的。'
    },

    {
      id: 'gate', label: '阶段门', priority: 86,
      keys: ['阶段门', '破门', '冻结', 'R阶段门'],
      title: '阶段门 · 破门期',
      body: '· 阶段门 = 好感度到了某个节点，但关系还不该自动升级的那道坎。\n' +
        '· 冻结期间 R（阶段值）不动、E 照常加减。表现成「心里想要，嘴上不认」，是最有戏的一段。\n' +
        '· 突破与否由脚本掷骰决定。AI 不掷骰、不宣布突破，只能说「好像有什么松动了」。'
    },

    {
      id: 'abyss', label: '深渊模式', priority: 84,
      keys: ['深渊', '负值', '负数'],
      title: '深渊模式',
      body: '· Ta的 E / P / I 里出现了负值，说明这段关系已经被伤过。\n' +
        '· 表现是自我否定、试探性攻击、把你的好意当成算计，不是单纯发脾气。\n' +
        '· 恢复要靠连续的正面互动，不能一轮就翻篇，也不能靠一次道歉全部清零。'
    },

    {
      id: 'coldwar', label: '冷战期', priority: 88,
      keys: ['冷战', '踩雷', '雷点'],
      title: '[踩雷] · 冷战期',
      body: '· 玩家碰到了角色卡里写明的核心雷点，Ta进入数天的封闭状态。\n' +
        '· 这是关系层面的断裂，不是闹别扭：回避、冷淡、拒绝解释、把话堵死。\n' +
        '· 脱困要靠下一周的掷骰加上持续示好。AI 不能自己宣布和好，也不能靠一段煽情独白跳过。\n' +
        '· 冷战结束时脚本会明确提示，没提示就是还没结束。'
    },

    {
      id: 'confession', label: '表白期', priority: 82,
      keys: ['表白', '告白', '心意'],
      title: '表白期 · 已通过 / 已排除',
      body: '· 已通过：关系已经越过了「可以说出口」的门槛，允许直球、允许把喜欢说破。\n' +
        '· 已排除：这张卡设定Ta不会主动告白，只能用行动表达。别替Ta强行开口，那会毁人设。'
    },

    {
      id: 'quota', label: '周上限', priority: 60,
      keys: ['周上限', '上限', '触顶'],
      title: '周上限',
      body: '· 每个角色每周能拿到的增益总量有封顶，防止一轮刷满。\n' +
        '· 触顶后这周再怎么示好也加不动。叙事上写成「Ta今天有点心不在焉」，不要写成Ta突然不喜欢你了。\n' +
        '· 这是后台规则，正文里一个字都不要提。'
    },

    {
      id: 'pacing', label: '节奏档', priority: 58,
      keys: ['柔板', '行板', '快板', 'adagio', 'andante', 'allegro'],
      title: '柔板 / 行板 / 快板',
      body: '· 这是事件导演多久出一次事件的频率档，不是叙事速度，也不是情绪基调。\n' +
        '· 柔板：很久才来一次，把日常写厚、写细。\n' +
        '· 行板：正常间隔，隔几轮来一次。\n' +
        '· 快板：事件接连不断，少写闲笔，快速推进。'
    },

    {
      id: 'anchor', label: '锚定与跳跃', priority: 76,
      keys: ['锚定', '时间跳跃', '世界线', '跳过'],
      title: '锚定 · 时间跳跃',
      body: '· 锚定 = 世界线被锁死，剧情里已经发生过的关键事实不能回滚。\n' +
        '· 锚定生效时，不要写「其实那天什么都没发生」这类反悔式转折。\n' +
        '· 跳过若干天、跳到下一个季节，由脚本判定是否允许。没被允许就老老实实按分钟推进。'
    },

    {
      id: 'event', label: '事件导演', priority: 90,
      keys: ['事件', '剩余回合', '主线', '导演'],
      title: '事件导演 · 当前事件',
      body: '· 这一轮该演什么、演多久，是脚本掷骰定的，不是你临时想的。\n' +
        '· 拿到「当前事件」就围着它写：场面、对话、心理、细节写足，每轮只推进一小步。\n' +
        '· 剩余回合是硬约束，剩 1 回合就得收束，不要拖成三回合，也不要提前收尾。\n' +
        '· 主线临近时收敛张力，别在这个窗口里搞大喜大悲。'
    },

    {
      id: 'multicard', label: '多人卡', priority: 80,
      keys: ['多人卡', '单人卡', '角色名'],
      title: '多人卡标签',
      body: '· 这张卡有好几个能攻略的人。只为这一轮真正互动过的角色输出标签，每人一条，不合并。\n' +
        '· 角色名必须用档案里的正名，不用昵称、称呼、化名。\n' +
        '· 没写角色名的标签只会算给主要攻略对象，别的人白演一场。'
    },

    {
      id: 'ending', label: '结局报幕', priority: 94,
      keys: ['galgameending', '结局', '周目'],
      title: '[GalgameEnding|...]',
      body: '· 整周目收尾的报幕标签，只在本轮注入终局提示时才输出，平时不许自己宣布结局。\n' +
        '· 字段顺序和取值以注入的完整示例为准，不要自己加字段、改顺序、补内容。\n' +
        '· 终局这一轮不输出普通 Sylveina 标签，也不输出 s。\n' +
        '· CG 字段要写英文横向构图描述，但不要说「已生成图片」。'
    },

    {
      id: 'epilogue', label: '后日谈', priority: 93,
      keys: ['galgameepilogue', '后日谈', '番外'],
      title: '<GalgameEpilogue ...>',
      body: '· 结局之后的生活续写，不是第二个结局，也不许推翻已经定下的结局。\n' +
        '· 只在结局卡交互之后、脚本注入后日谈提示时才写。\n' +
        '· 篇幅要求（比如 5000~8000 字）要真的写够，别缩成一段。\n' +
        '· 标签里面不要再塞 Sylveina 标签、s、代码围栏或解释文字。'
    }

  ];

  let _glossaryLast = { ids: [], labels: [], chars: 0, at: 0 };

  function getGlossaryMode() {
    const m = getSettings().glossary;
    if (m === 'always' || m === 'off') return m;
    return 'auto';
  }

  function getChatTailForGlossary() {
    try { return collectChatHistoryContext(2600).chat || ''; } catch (e) { return ''; }
  }

  /* 命中规则：always 无条件带；其余看「本轮注入文本 + 最近几条对话」里有没有它的触发词。 */
  function scanGlossaryHits(extraText) {
    const mode = getGlossaryMode();
    if (mode === 'off') return [];
    if (mode === 'always') return GLOSSARY_ENTRIES.slice();
    let hay = '';
    try { hay = getRoundInjectedText() || ''; } catch (e) { hay = ''; }
    hay += '\n' + (extraText || '') + '\n' + getChatTailForGlossary();
    hay = hay.toLowerCase();
    const out = [];
    for (let i = 0; i < GLOSSARY_ENTRIES.length; i++) {
      const e = GLOSSARY_ENTRIES[i];
      if (e.always) { out.push(e); continue; }
      const keys = e.keys || [];
      for (let k = 0; k < keys.length; k++) {
        if (hay.indexOf(String(keys[k]).toLowerCase()) >= 0) { out.push(e); break; }
      }
    }
    return out;
  }

  /* 超预算时按优先级砍尾巴，至少留一条，避免一条都没进去。 */
  function buildGlossaryText(hits) {
    const sorted = hits.slice().sort(function(a, b) { return (b.priority || 0) - (a.priority || 0); });
    const blocks = []; const labels = []; const ids = [];
    let used = 0;
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const block = '【' + e.label + '】' + e.title + '\n' + e.body;
      if (used + block.length > GLOSSARY_BUDGET && blocks.length > 0) continue;
      blocks.push(block); labels.push(e.label); ids.push(e.id); used += block.length;
    }
    return { text: blocks.join('\n\n'), used: used, labels: labels, ids: ids };
  }

  function injectGlossaryPrompt() {
    try {
      const hits = scanGlossaryHits();
      if (!hits.length) {
        callSetPrompt(GLOSSARY_PROMPT_KEY, '', 4, 1, false);
        _glossaryLast = { ids: [], labels: [], chars: 0, at: Date.now() };
        return false;
      }
      const built = buildGlossaryText(hits);
      const head = '═══════════════════════════════════\n' +
        '【月相系统 · 标签与状态释义】\n' +
        '下面只列出本轮真的用得上的条目；没列到的标签，这一轮不会出现，不要主动去写。';
      const text = head + '\n\n' + built.text;
      /* 释义本身也含「阶段门」「冷战」这些词，不挡住就会自己命中自己，
         一轮里多调几次就雪球成全量。写完把记录还原回去。 */
      const snapshot = getRoundInjectedText();
      callSetPrompt(GLOSSARY_PROMPT_KEY, text, 4, 1, false);
      setRoundInjectedText(snapshot);
      _glossaryLast = { ids: built.ids, labels: built.labels, chars: text.length, at: Date.now() };
      return true;
    } catch (e) { return false; }
  }

  function getGlossaryHint() {
    const mode = getGlossaryMode();
    const total = GLOSSARY_ENTRIES.length;
    if (mode === 'off') return '关：不解释标签，AI 只按本轮给的格式照抄';
    if (mode === 'always') return '全量：' + total + ' 条全部常驻（每条都占上下文）';
    const last = _glossaryLast.labels || [];
    if (!last.length) return '自动 · 按需：' + total + ' 条里命中哪条发哪条（还没生成过）';
    return '自动 · 按需：' + total + ' 条里本轮命中 ' + last.length + ' 条 · ' + last.join('、');
  }

  function glossaryPickStyle(on) {
    return 'padding:5px 9px;border-radius:7px;border:1px solid ' + (on ? 'rgba(167,139,250,0.5)' : 'rgba(148,163,184,0.2)') + ';background:' + (on ? '#241a3f' : '#0f172a') + ';color:' + (on ? '#c4b5fd' : '#94a3b8') + ';font-size:10.5px;font-family:inherit;font-weight:600;cursor:pointer;';
  }

  function renderGlossaryPickerHtml() {
    const cur = getGlossaryMode();
    const items = [['auto', '按需'], ['always', '全量'], ['off', '关']];
    const tips = { auto: '只发本轮用得到的词条（推荐）', always: '所有词条每轮都发，最稳但费上下文', off: '不解释标签含义' };
    return '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">' +
      items.map(function(it) {
        return '<button type="button" data-glossary="' + it[0] + '" title="' + tips[it[0]] + '"' +
          ' style="' + glossaryPickStyle(cur === it[0]) + '">' + it[1] + '</button>';
      }).join('') + '</div>';
  }

  function setGlossaryMode(m) {
    const s = getSettings();
    s.glossary = (m === 'always' || m === 'off') ? m : 'auto';
    saveSettings(s);
    try { injectGlossaryPrompt(); } catch (e) {}
    return s.glossary;
  }
  /* ───────────────────────────────────────────────────────── */
