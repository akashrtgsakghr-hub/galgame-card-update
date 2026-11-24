/* 90c-reverse-items.js —— 攻略模式的「东西」：道具定义池 / 货架 / 图鉴 / 大转盘 / 买与用

   从 90-reverse-mode.js 拆出（2026-11-17 结构调整，纯搬移，无逻辑改动）。
   两边账本在核心片；这里只管道具本体——定义、抽签、展示、成交。 */
/* ── 道具定义池（按角色卡分档，两边共用） ─────────────── */
function reverseItemLibKey() {
  let card = 'default';
  try { const c = getCurrentCardName(); if (c && c !== '(未知卡牌)') card = c; } catch (e) {}
  return REVERSE_ITEMLIB_KEY + '::' + card;
}
/* 道具池版本：往内置池里加东西时必须 +1。v2 = 咒术向 7 件 + 忍者向 7 件。
   迁移**不放在读取路径上**（getItemLibrary 只读不写），否则「空道具库」「导入还原」
   这类场景会被偷偷塞回内置道具。真正的补齐走 reverseMigrateItemLibraryV2()，
   由启动流程调一次，且按角色卡打标记。 */
const REVERSE_ITEMLIB_VERSION = 2;
function getItemLibrary() {
  try {
    const raw = getStorage() && getStorage().getItem(reverseItemLibKey());
    const o = raw ? JSON.parse(raw) : null;
    if (o && o.items && typeof o.items === 'object') return o;
  } catch (e) {}
  const seeded = { version: REVERSE_ITEMLIB_VERSION, items: reverseBuiltinItems() };
  saveItemLibrary(seeded);
  return seeded;
}

/* 老存档补齐内置道具：只补缺、不覆盖（玩家改过的同名道具保留）。
   每个角色卡只跑一次；空库视为玩家主动清空，不补。 */
function reverseMigrateItemLibraryV2() {
  try {
    const s = getStorage();
    if (!s) return 0;
    const flagKey = reverseItemLibKey() + '::itemlib_v' + REVERSE_ITEMLIB_VERSION;
    if (s.getItem(flagKey) === '1') return 0;
    let lib = null;
    try { const raw = s.getItem(reverseItemLibKey()); lib = raw ? JSON.parse(raw) : null; } catch (e) {}
    if (!lib || !lib.items || typeof lib.items !== 'object') return 0;
    if (Object.keys(lib.items).length === 0) { s.setItem(flagKey, '1'); return 0; }
    const builtin = reverseBuiltinItems();
    let added = 0;
    Object.keys(builtin).forEach(function(id) {
      if (!lib.items[id]) { lib.items[id] = builtin[id]; added++; }
    });
    lib.version = REVERSE_ITEMLIB_VERSION;
    saveItemLibrary(lib);
    s.setItem(flagKey, '1');
    if (added > 0) { try { console.info('[Doki] 道具池已补齐 ' + added + ' 件新道具'); } catch (e) {} }
    return added;
  } catch (e) { return 0; }
}
function saveItemLibrary(lib) {
  try {
    const s = getStorage();
    if (s) s.setItem(reverseItemLibKey(), JSON.stringify(lib));
    return true;
  } catch (e) { return false; }
}

/* 道具 effect 必须是对象；type 不在枚举里直接判非法（导入也走这里） */
function reverseMakeEffect(type, prompt, hours, key, stackable) {
  return {
    type: type,
    key: String(key || ''),
    duration: type === 'permanent' ? 0 : rvNum(hours, 12),
    stackable: stackable === true,
    prompt: String(prompt || '')
  };
}
function reverseNormalizeItem(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || fallbackId || '').trim();
  if (!id) return null;
  const effRaw = (raw.effect && typeof raw.effect === 'object') ? raw.effect : null;
  if (!effRaw) return null;
  const type = String(effRaw.type || '').toLowerCase();
  if (REVERSE_EFFECT_TYPES.indexOf(type) < 0) return null;
  const rarity = REVERSE_RARITY[raw.rarity] ? raw.rarity : 'common';
  let owner = String(raw.owner || 'both');
  if (owner !== 'role_only' && owner !== 'player_only') owner = 'both';
  return {
    id: id,
    name: String(raw.name || id).slice(0, 24),
    desc: String(raw.desc || '').slice(0, 120),
    rarity: rarity,
    owner: owner,
    effect: reverseMakeEffect(type, effRaw.prompt || raw.desc || '', effRaw.duration, effRaw.key, effRaw.stackable),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 6).map(String) : [],
    createdAt: rvNum(raw.createdAt, 0) || rvNow()
  };
}
function reverseBuiltinItems() {
  const make = function(id, name, desc, rarity, owner, type, prompt, hours) {
    const it = reverseNormalizeItem({ id: id, name: name, desc: desc, rarity: rarity, owner: owner, effect: { type: type, prompt: prompt, duration: hours } }, id);
    return [id, it];
  };
  const list = [
    /* 她那边的小东西：buff / narrative，她会在剧情里自然用出来 */
    make('r_hairtie',   '素色发绳',       '把头发束起来，露出后颈。她说这样写字不挡眼。', 'common', 'role_only', 'buff', '你把头发束起来了，后颈有点凉。', 12),
    make('r_mint',      '薄荷糖',         '铁盒里剩三颗，她自己舍不得吃，留着给别人。',   'common', 'role_only', 'buff', '嘴里含着薄荷糖，说话带一点凉。', 6),
    make('r_sticky',    '便利贴',         '她习惯把想说的话先写在纸上，再决定要不要递出去。', 'common', 'role_only', 'narrative', '你手里捏着一张便利贴，上面只写了一行字。', 1),
    make('r_catbell',   '猫铃铛',         '走路会响。她本来嫌吵，后来没摘。',             'common', 'role_only', 'buff', '你一走动就有铃声，藏不住行踪。', 12),
    make('r_nightlight','夜灯贴纸',       '贴在床头，关灯后会亮一排小星。',               'common', 'role_only', 'buff', '关灯之后，床头亮起一排小星。', 12),
    make('r_coffee',    '速冲咖啡',       '两包连冲。她喝不惯苦的，加了三勺糖。',         'common', 'role_only', 'buff', '你手边有一杯很甜的咖啡，还烫。', 4),
    make('r_record',    '旧唱片',         'B 面第三首有划痕，唱针跳一下，她就笑一下。',   'rare',   'role_only', 'buff', '屋里放着旧唱片，第三首时不时跳一下。', 12),
    make('r_earphone',  '共享耳机的另一只','线很短，两个人的距离被拽到一臂之内。',       'rare',   'role_only', 'buff', '你分出去一只耳机，线绷得很直。', 6),
    make('r_bento',     '手写便当',       '煎蛋上用番茄酱画了个歪掉的心，她说是失手。',   'rare',   'role_only', 'buff', '便当盒还热着，煎蛋上有一个歪掉的心。', 6),
    make('r_lozenge',   '止咳糖浆',       '她记得你嗓子哑了三天，第四天把瓶子放在你桌上。', 'rare', 'role_only', 'buff', '桌上多了一瓶止咳糖浆，标签朝外。', 24),
    make('r_ticket',    '电影票根',       '两张，同一场。另一张一直夹在书里没扔。',       'rare',   'role_only', 'narrative', '你把两张票根摊在桌上，日期是同一场。', 1),
    make('r_umbrella',  '雨天的一把伞',   '她说只带了一把，其实是把另一把留在了家里。',   'legendary', 'role_only', 'buff', '你带着一把伞，伞骨上还挂着水。', 12),
    make('r_letter',    '没有寄出的信',   '写到第三行停了，墨迹在那句话上洇开一小片。',   'legendary', 'role_only', 'narrative', '信封没有封口，第三行的墨迹洇开了。', 1),
    make('r_handwarmer','暖手袋',         '冬天她总说手冷，然后把暖手袋塞给你，说自己不怕冷。', 'legendary', 'role_only', 'buff', '暖手袋在你手里，热度刚好。', 8),
    make('r_moonjar',   '月亮标本',       '玻璃瓶里收着一夜的月光。她说这是她最贵的东西了。', 'gem', 'role_only', 'permanent', '玻璃瓶里的光一直没灭。', 0),

    /* 玩家这边的工具：只给屏幕前的你，不进 AI 上下文 */
    make('p_intel',     '情报券·近况',    '翻开一页：她最近在意什么、哪里是雷区。',       'common', 'player_only', 'narrative', '你看清了她最近在意的那件事。', 1),
    make('p_mug',       '小礼物·马克杯',  '买个不贵但有心思的东西，递过去的时候有话说。', 'common', 'player_only', 'narrative', '你把杯子推过去，说路过看到的。', 1),
    make('p_hairpin',   '小礼物·发夹',    '挑对了是加分，挑错了要解释很久。',             'rare',   'player_only', 'narrative', '发夹放在她手边，你让她试一下。', 1),
    make('p_rain',      '场景券·雨夜',    '把天气变成雨，把两个人困在同一个屋檐下。',     'rare',   'player_only', 'narrative', '雨忽然下起来，你们被堵在同一段屋檐下。', 1),
    make('p_roof',      '场景券·天台',    '把地点挪到天台。风大，说话得靠近一点。',       'rare',   'player_only', 'narrative', '你带她上了天台，风把话吹散一半。', 1),
    make('p_coin',      '幸运币',         '攥在手心里，图个心安。',                       'common', 'player_only', 'buff', '你把幸运币塞进她掌心，让她许个愿。', 6),
    make('p_rewind',    '重来一次',       '把刚刚那一句收回去重说。它不改变已经发生的事，只改变你怎么面对。', 'gem', 'player_only', 'permanent', '你还有一次把话说清楚的机会。', 0),

    /* ── 联动道具 · 咒术向（不指名角色，只用设定里的物件）─────────
       这些是「氛围道具」：不改数值公式，只往正文里塞一个具体的东西，
       让这一轮的画面有出处。稀有度照旧走 common/rare/legendary。 */
    make('jjk_blindfold', '黑色眼罩',     '拉下来就只露下半张脸，笑起来反而更好认。',       'common', 'role_only', 'buff', '她把眼罩拉下来一点，只露出下巴。', 12),
    make('jjk_chalk',     '咒力粉笔',     '在地上画一圈，就算划了界。圈外的事，圈里说了算。', 'common', 'player_only', 'narrative', '你用粉笔在地上画了一个圈，圈内忽然安静下来。', 1),
    make('jjk_glove',     '缠布拳套',     '指节处磨得发白，看得出打过很多东西。',           'common', 'player_only', 'buff', '你把拳套缠紧，指节有点发麻。', 6),
    make('jjk_bandage',   '反转绷带',     '缠上去的时候有点烫，伤口会自己合上。',           'rare',   'role_only', 'buff', '绷带缠得很紧，皮肤底下在发热。', 8),
    make('jjk_idcard',    '术式高专学生证','照片是她自己贴上去的，边角翘起来一块。',         'rare',   'both', 'narrative', '学生证摊在桌上，照片的边角翘起来了。', 1),
    make('jjk_white_paper','领域用的白纸', '把这张纸摊开，这间屋子就归她说了算。',           'legendary', 'player_only', 'narrative', '白纸摊开，四周的声音像是被抽干了。', 4),
    make('jjk_finger',    '符纸包着的手指','不知道是谁的，包在符纸里还会动。最好别一直带在身上。', 'legendary', 'role_only', 'buff', '符纸里那截手指动了一下，屋里的灯闪了闪。', 6),

    /* ── 联动道具 · 忍者向 ───────────────────────────────── */
    make('nar_kunai',     '苦无',         '刃口有细小的缺口，是常用的那把。',               'common', 'player_only', 'buff', '苦无在指间转了一圈，稳稳停住。', 6),
    make('nar_wrap',      '护手绑带',     '一圈圈缠到手腕，握东西更稳。',                   'common', 'role_only', 'buff', '她把绑带一圈圈缠到手腕上，拉紧最后一圈。', 8),
    make('nar_ball',      '螺旋丸练习球', '里面灌了水，转起来会响。',                       'common', 'role_only', 'buff', '球在她手心里转，水声越来越急。', 6),
    make('nar_ramen',     '一乐拉面券',   '两张，背面写着「加蛋免费」。',                   'rare',   'both', 'buff', '两碗拉面端上来，热气糊住了眼镜。', 4),
    make('nar_clone_note','影分身便签',   '写下的事，另一个你也会记得。',                   'rare',   'player_only', 'narrative', '便签上的字迹干了两遍，像有人替你写过。', 1),
    make('nar_sharingan', '写轮眼镜片',   '戴上之后，别人的动作好像慢了半拍。',             'legendary', 'player_only', 'permanent', '镜片贴上眼球的一瞬，世界慢了半拍。', 0),
    make('nar_photo',     '第七班的合照', '边角被摸得起毛，她一直放在内袋里。',             'legendary', 'role_only', 'narrative', '合照被摸得起了毛边，她把它放回内袋。', 1)
  ];
  const out = {};
  list.forEach(function(pair) { if (pair[1]) out[pair[0]] = pair[1]; });
  return out;
}

/* 增删改 */
function reverseAddItem(raw) {
  const lib = getItemLibrary();
  const it = reverseNormalizeItem(raw, raw && raw.id);
  if (!it) return { ok: false, reason: '道具格式不对（effect.type 必须是 buff/debuff/task_item/narrative/permanent）' };
  if (lib.items[it.id]) return { ok: false, reason: '这个 id 已经有了' };
  lib.items[it.id] = it;
  saveItemLibrary(lib);
  return { ok: true, item: it };
}
function reverseDeleteItem(id) {
  const lib = getItemLibrary();
  if (!lib.items[id]) return false;
  delete lib.items[id];
  saveItemLibrary(lib);
  return true;
}
function reverseExportItems() {
  try {
    return JSON.stringify({ version: 1, items: getItemLibrary().items }, null, 2);
  } catch (e) { return '{"version":1,"items":{}}'; }
}
/* 导入：rarity 为空 = 用原值；conflict: overwrite / skip / rename */
function reverseImportItems(text, rarity, conflict) {
  let parsed = null;
  try { parsed = JSON.parse(String(text || '')); } catch (e) { return { ok: false, reason: '不是合法 JSON', added: 0, skipped: 0 }; }
  const src = (parsed && parsed.items && typeof parsed.items === 'object') ? parsed.items : parsed;
  if (!src || typeof src !== 'object') return { ok: false, reason: '里面没有 items', added: 0, skipped: 0 };
  const lib = getItemLibrary();
  let added = 0, skipped = 0;
  Object.keys(src).forEach(function(k) {
    const raw = Object.assign({}, src[k]);
    if (!raw.id) raw.id = k;
    if (rarity && REVERSE_RARITY[rarity]) raw.rarity = rarity;
    const it = reverseNormalizeItem(raw, k);
    if (!it) { skipped++; return; }
    if (lib.items[it.id]) {
      if (conflict === 'skip') { skipped++; return; }
      if (conflict === 'rename') {
        let n = 2, id = it.id + '_' + n;
        while (lib.items[id]) { n++; id = it.id + '_' + n; }
        it.id = id;
        lib.items[id] = it;
        added++;
        return;
      }
    }
    lib.items[it.id] = it;
    added++;
  });
  saveItemLibrary(lib);
  return { ok: added > 0, added: added, skipped: skipped, reason: added ? '' : '没有一条能导入' };
}

/* ── 货架：稀有度权重抽签 ─────────────────────────────── */
function reversePickByRarity(pool) {
  const list = (pool || []).filter(function(it) { return it && REVERSE_RARITY[it.rarity]; });
  if (!list.length) return null;
  let total = 0;
  list.forEach(function(it) { total += REVERSE_RARITY[it.rarity].weight; });
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= REVERSE_RARITY[list[i].rarity].weight;
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}
/* 普通货架：6 格不重复，宝石不进；按 owner 过滤对方专属 */
function reverseRollShelf(lib, side) {
  const who = side === 'player' ? 'player' : 'role';
  const pool = Object.keys(lib.items).map(function(id) { return lib.items[id]; }).filter(function(it) {
    if (!it || !REVERSE_RARITY[it.rarity]) return false;
    if (!REVERSE_RARITY[it.rarity].shelf) return false;
    if (who === 'role' && it.owner === 'player_only') return false;
    if (who === 'player' && it.owner === 'role_only') return false;
    return true;
  });
  let want = REVERSE_SHELF_SIZE;
  try {
    const st = who === 'player' ? getPlayerState() : getRoleState();
    if ((st.activeEvents || []).some(function(e) { return e && e.perk === 'shelf_plus' && rvNum(e.untilDay, 0) >= rvGameDay(); })) want += 1;
  } catch (e) {}

  const picked = [];
  const seen = {};
  let guard = 0;
  while (picked.length < want && guard++ < 90 && pool.length) {
    const hit = reversePickByRarity(pool);
    if (!hit || seen[hit.id]) continue;
    seen[hit.id] = 1;
    picked.push({ id: hit.id, price: REVERSE_RARITY[hit.rarity].price, stock: REVERSE_RARITY[hit.rarity].stock });
  }
  /* 角色侧任务需要某件道具时，确保它出现在货架上 */
  try {
    if (who === 'role') {
      const t = getRoleState().task;
      if (t && t.needItem && lib.items[t.needItem] && !picked.some(function(p) { return p.id === t.needItem; })) {
        const need = lib.items[t.needItem];
        const slot = { id: need.id, price: REVERSE_RARITY[need.rarity] ? REVERSE_RARITY[need.rarity].price : 20, stock: 1 };
        if (picked.length) picked[picked.length - 1] = slot; else picked.push(slot);
      }
    }
  } catch (e) {}
  return picked;
}
/* 宝石橱窗：每张卡固定 1~2 个，按卡名做稳定挑选 */
function reverseRollGemShelf(lib, side) {
  const who = side === 'player' ? 'player' : 'role';
  const gems = Object.keys(lib.items).map(function(id) { return lib.items[id]; }).filter(function(it) {
    if (!it || it.rarity !== 'gem') return false;
    if (who === 'role' && it.owner === 'player_only') return false;
    if (who === 'player' && it.owner === 'role_only') return false;
    return true;
  });
  if (!gems.length) return [];
  let seed = 0;
  const key = reverseItemLibKey();
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 99991;
  const count = Math.min(gems.length, 1 + (seed % 2));
  const out = [];
  for (let i = 0; i < count; i++) {
    const it = gems[(seed + i * 7) % gems.length];
    if (it && !out.some(function(x) { return x.id === it.id; })) out.push({ id: it.id, price: REVERSE_GEM_PRICE, stock: 1 });
  }
  return out;
}

/* 刷新货架：游戏内每 3 天 / 强制（跳时间）/ 3 小时真实冷却 */
function reverseMaybeRefreshShelves(force) {
  if (!isReverseModeOn()) return { role: false, player: false };
  const gameDay = rvGameDay();
  const lib = getItemLibrary();
  const now = rvNow();
  const out = { role: false, player: false };
  const due = function(st) {
    if (force === true) return true;
    return gameDay - rvNum(st.shelfGameDay, 0) >= REVERSE_SHELF_GAME_DAYS;
  };
  const canRefresh = function(st) {
    if (!st.shelfRefreshAt) return true;
    if (!st.shelf || !st.shelf.length) return true;
    return now - rvNum(st.shelfRefreshAt, 0) >= REVERSE_SHELF_REAL_COOLDOWN;
  };

  const role = getRoleState();
  if (due(role) && canRefresh(role)) {
    role.shelf = reverseRollShelf(lib, 'role');
    role.gemShelf = reverseRollGemShelf(lib, 'role');
    role.shelfGameDay = gameDay;
    role.shelfRefreshAt = now;
    saveRoleState(role);
    out.role = true;
    try { reverseRoleAutoBuy(); } catch (e) {}
  }
  const player = getPlayerState();
  if (due(player) && canRefresh(player)) {
    player.shelf = reverseRollShelf(lib, 'player');
    player.gemShelf = reverseRollGemShelf(lib, 'player');
    player.shelfGameDay = gameDay;
    player.shelfRefreshAt = now;
    savePlayerState(player);
    out.player = true;
  }
  return out;
}

/* ── 图鉴（四栏） ─────────────────────────────────────── */
function reverseCodexTab() {
  try { return getStorage().getItem(REVERSE_CODEX_TAB_KEY) || 'item'; } catch (e) { return 'item'; }
}
function getCodexHtml(tab) {
  if (!isReverseModeOn()) return '';
  const which = tab || reverseCodexTab();
  const p = getPlayerState();
  const lib = getItemLibrary();
  const head = '<div style="display:flex;gap:4px;margin-bottom:6px;">' +
    [['item', '道具'], ['ach', '成就'], ['cg', 'CG'], ['char', '角色']].map(function(pair) {
      return '<button type="button" class="mp-btn' + (which === pair[0] ? ' mp-btn-highlight' : '') +
        '" data-reverse-codex="' + pair[0] + '" style="flex:1;min-height:26px;font-size:11px;padding:0;">' + pair[1] + '</button>';
    }).join('') + '</div>';

  let body = '';
  if (which === 'item') {
    const ids = Object.keys(lib.items);
    const got = ids.filter(function(id) { return rvNum((p.seenItems || {})[id], 0) > 0; });
    body = '<div class="mp-set-desc" style="line-height:1.7;">已解锁 ' + got.length + ' / ' + ids.length + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + ids.slice(0, 60).map(function(id) {
        const it = lib.items[id];
        const has = rvNum((p.seenItems || {})[id], 0) > 0;
        const r = REVERSE_RARITY[it.rarity] || REVERSE_RARITY.common;
        return '<span title="' + rvEsc(it.desc || '') + '" style="font-size:11px;padding:2px 6px;border-radius:6px;border:1px solid ' +
          (has ? r.color + '77' : 'rgba(255,255,255,.12)') + ';color:' + (has ? r.color : '#64748b') + ';">' +
          rvEsc(has ? it.name : '？？？') + '</span>';
      }).join('') + '</div>';
  } else if (which === 'ach') {
    body = REVERSE_ACHIEVEMENTS.map(function(a) {
      const has = !!p.achievements[a.id];
      return '<div style="display:flex;justify-content:space-between;gap:6px;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);">' +
        '<span style="font-size:12px;color:' + (has ? '#fde047' : '#64748b') + ';">' + (has ? '● ' : '○ ') + rvEsc(a.title) + '</span>' +
        '<span style="font-size:10.5px;opacity:.7;text-align:right;">' + rvEsc(a.desc) + '</span></div>';
    }).join('');
  } else if (which === 'cg') {
    let list = [];
    try { list = getGalleryList(); } catch (e) { list = []; }
    body = list.length
      ? '<div class="mp-set-desc">已收集 ' + list.length + ' 张</div><div style="display:flex;flex-wrap:wrap;gap:4px;">' +
        list.slice(0, 24).map(function(g) { return '<span style="font-size:11px;padding:2px 6px;border-radius:6px;border:1px solid rgba(244,114,208,.3);">' + rvEsc(String(g.title || g.id).slice(0, 12)) + '</span>'; }).join('') + '</div>'
      : '<div class="mp-set-desc" style="opacity:.7;">还没有 CG。沉浸模式里配好图以后会进来。</div>';
  } else {
    let chars = {};
    try { chars = ((readMvuLatest() || {}).stat_data || {}).角色 || {}; } catch (e) { chars = {}; }
    const names = Object.keys(chars).filter(function(k) { return chars[k] && !isCharSkeleton(chars[k]); });
    body = names.length ? names.map(function(k) {
      const c = chars[k];
      return '<div style="padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);font-size:12px;">' +
        rvEsc(k) + ' <span style="opacity:.65;font-size:11px;">好感 ' + rvNum(c.好感度, 0) + ' · 阶段 ' + rvNum(c.阶段值, 0) +
        ' · ' + rvEsc(String(c.情绪 || '')) + '</span></div>';
    }).join('') : '<div class="mp-set-desc" style="opacity:.7;">还没有角色档案。</div>';
  }
  return head + body;
}

/* ── 大转盘：从道具池按权重抽，抽到直接进库存 ────────── */
function reverseSpinWheel(owner) {
  const who = owner === 'player' ? 'player' : 'role';
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const st = who === 'player' ? getPlayerState() : getRoleState();
  if (rvNum(st.wheelTickets, 0) <= 0) return { ok: false, reason: '没有转盘券了' };
  const lib = getItemLibrary();
  const pool = Object.keys(lib.items).map(function(id) { return lib.items[id]; }).filter(function(it) {
    if (!it || !REVERSE_RARITY[it.rarity]) return false;
    if (who === 'role' && it.owner === 'player_only') return false;
    if (who === 'player' && it.owner === 'role_only') return false;
    return true;
  });
  if (!pool.length) return { ok: false, reason: '道具库是空的，先导入道具' };
  st.wheelTickets = rvNum(st.wheelTickets, 0) - 1;
  const hit = reversePickByRarity(pool);
  st.inventory[hit.id] = rvNum(st.inventory[hit.id], 0) + 1;
  if (!st.seenItems) st.seenItems = {};
  st.seenItems[hit.id] = rvNum(st.seenItems[hit.id], 0) + 1;
  if (who === 'player') savePlayerState(st); else saveRoleState(st);
  try { toast('转盘：' + hit.name + '（' + REVERSE_RARITY[hit.rarity].name + '）', 'success'); } catch (e) {}
  return { ok: true, item: hit, label: hit.name + '（' + REVERSE_RARITY[hit.rarity].name + '）' };
}

/* ── 购买 / 使用 ─────────────────────────────────────── */
/* 角色侧货架只展示，不能手动买；她自己会挑（货架刷新后 / 任务完成后） */
function reverseRoleAutoBuy() {
  if (!isReverseModeOn()) return null;
  const st = getRoleState();
  const lib = getItemLibrary();
  const affordable = (st.shelf || []).filter(function(s) {
    return s && lib.items[s.id] && rvNum(s.stock, 0) > 0 && rvNum(st.points, 0) >= rvNum(s.price, 0);
  }).sort(function(a, b) { return rvNum(b.price, 0) - rvNum(a.price, 0); });
  if (!affordable.length) return null;
  const slot = affordable[0];
  const it = lib.items[slot.id];
  st.points = rvNum(st.points, 0) - rvNum(slot.price, 0);
  slot.stock = Math.max(0, rvNum(slot.stock, 0) - 1);
  st.inventory[it.id] = rvNum(st.inventory[it.id], 0) + 1;
  pushLedger(st, -rvNum(slot.price, 0), '她自己买了：' + it.name);
  saveRoleState(st);
  try { reverseUseItem('role', it.id, true); } catch (e) {}
  return it;
}
function reverseBuy(side, itemId) {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const who = side === 'player' ? 'player' : 'role';
  if (who === 'role') return { ok: false, reason: '她那边的东西她自己会挑，你不用替她买' };
  const st = getPlayerState();
  /* 副本失败会把 points 扣成负数。欠费期间一律不给买 —— 不然玩家欠着钱还能花，
     负债就只是个数，不是个约束。 */
  if (rvNum(st.points, 0) < 0) {
    return { ok: false, reason: '账户欠费 ' + Math.abs(rvNum(st.points, 0)) + ' 分，还清之前用不了商城' };
  }
  const lib = getItemLibrary();
  const it = lib.items[itemId];
  if (!it) return { ok: false, reason: '找不到这件东西' };
  const shelf = (st.shelf || []).concat(st.gemShelf || []);
  const slot = shelf.filter(function(s) { return s && s.id === itemId; })[0];
  if (!slot) return { ok: false, reason: '这件东西已经不在货架上了' };
  if (rvNum(slot.stock, 0) <= 0) return { ok: false, reason: '卖完了，等下次刷新' };
  const price = rvNum(slot.price, 0);
  if (rvNum(st.points, 0) < price) return { ok: false, reason: '积分不够（还差 ' + (price - rvNum(st.points, 0)) + '）' };
  st.points = rvNum(st.points, 0) - price;
  slot.stock = Math.max(0, rvNum(slot.stock, 0) - 1);
  st.inventory[it.id] = rvNum(st.inventory[it.id], 0) + 1;
  if (!st.seenItems) st.seenItems = {};
  st.seenItems[it.id] = rvNum(st.seenItems[it.id], 0) + 1;
  pushLedger(st, -price, '买入：' + it.name);
  savePlayerState(st);
  try { toast('已买入：' + it.name, 'success'); } catch (e) {}
  return { ok: true, item: it, price: price };
}
/* 使用：写 buff / 给玩家文案；silent 用于她自动买完直接用 */
function reverseUseItem(side, itemId, silent) {
  if (!isReverseModeOn()) return { ok: false, reason: '攻略模式未开启' };
  const who = side === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const lib = getItemLibrary();
  const it = lib.items[itemId];
  if (!it) return { ok: false, reason: '找不到这件东西' };
  if (rvNum(st.inventory[itemId], 0) <= 0) return { ok: false, reason: '手上没有这件东西' };
  st.inventory[itemId] = rvNum(st.inventory[itemId], 0) - 1;
  /* 先把手上的数量落盘：下面 reverseAddBuff 会重新读一次状态再存，
     如果这里不先存，后面那次 save(st) 会把刚加的 buff 覆盖掉。 */
  if (who === 'player') savePlayerState(st); else saveRoleState(st);
  const eff = it.effect || {};
  const out = { ok: true, item: it, text: '' };

  if (who === 'role') {
    if (eff.type === 'task_item') {
      out.text = '她手里多了一件要交出去的东西：' + it.name;
    } else if (eff.type === 'narrative') {
      out.text = eff.prompt || it.desc || it.name;
      reverseAddBuff('role', {
        key: 'narr_' + it.id, name: it.name, kind: 'buff',
        prompt: out.text, expireAt: rvNow() + rvHourMs(6)
      });
    } else {
      reverseAddBuff('role', {
        key: it.id, name: it.name, kind: eff.type === 'debuff' ? 'debuff' : 'buff',
        prompt: eff.prompt || it.desc || '', permanent: eff.type === 'permanent',
        expireAt: eff.type === 'permanent' ? 0 : rvNow() + rvHourMs(eff.duration),
        stackable: eff.stackable === true
      });
      out.text = '她收好了「' + it.name + '」';
    }
    /* 任务需要这件东西：重新读一遍再改，别用开头那份快照覆盖 buff */
    if (st.task && st.task.needItem === itemId) {
      const fresh = getRoleState();
      if (fresh.task) { fresh.task.progress = rvNum(fresh.task.target.need, 0); saveRoleState(fresh); }
    }
  } else {
    if (eff.type === 'narrative') {
      const line = eff.prompt || it.desc || it.name;
      st.pendingTexts.push({ at: rvNow(), item: it.id, text: line });
      if (st.pendingTexts.length > 20) st.pendingTexts = st.pendingTexts.slice(-20);
      out.text = line;
      savePlayerState(st);
      try { injectReversePlayerAction(line); } catch (e) {}
    } else {
      reverseAddBuff('player', {
        key: it.id, name: it.name, kind: eff.type === 'debuff' ? 'debuff' : 'buff',
        prompt: eff.prompt || it.desc || '', permanent: eff.type === 'permanent',
        expireAt: eff.type === 'permanent' ? 0 : rvNow() + rvHourMs(eff.duration)
      });
      out.text = eff.prompt || it.desc || it.name;
    }
  }
  if (!silent && out.text) { try { toast(out.text, 'success'); } catch (e) {} }
  return out;
}
