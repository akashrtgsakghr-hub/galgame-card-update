/* 90f-reverse-ui.js —— 攻略模式面板：两版页签、渲染、事件委托

   只做展示与交互；取数与写数都调核心 / 道具 / 任务 / 整活各片已有的函数。
   新增控件时：渲染加在这里，事件分支加在 bindReverseBlockEvents。 */
/* ── 面板 UI ─────────────────────────────────────────── */
function reverseRarityChip(rarity) {
  const r = REVERSE_RARITY[rarity] || REVERSE_RARITY.common;
  return '<span style="font-size:10px;padding:1px 5px;border-radius:6px;border:1px solid ' + r.color + '55;color:' + r.color + ';">' + r.name + '</span>';
}
function reverseShelfHtml(side, gems) {
  const who = side === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const lib = getItemLibrary();
  const list = ((gems ? st.gemShelf : st.shelf) || []).filter(function(s) { return s && lib.items[s.id]; });
  if (!list.length) return '<div class="mp-set-desc" style="opacity:.7;">货架空着。过 3 个游戏日会自己补，也可以点下面的「刷新货架」。</div>';
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' + list.map(function(s) {
    const it = lib.items[s.id];
    const price = rvNum(s.price, 0);
    const stock = rvNum(s.stock, 0);
    const can = who === 'player' && rvNum(st.points, 0) >= price && stock > 0;
    return '<div style="border:1px solid rgba(244,114,208,.18);border-radius:8px;padding:7px 8px;background:rgba(255,255,255,.02);">' +
      '<div style="display:flex;justify-content:space-between;gap:4px;align-items:center;">' +
        '<b style="font-size:12px;">' + rvEsc(it.name) + '</b>' + reverseRarityChip(it.rarity) + '</div>' +
      '<div class="mp-set-desc" style="font-size:11px;margin:3px 0 5px;line-height:1.5;opacity:.85;">' + rvEsc(String(it.desc || '').slice(0, 46)) + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">' +
        '<span style="font-size:11px;color:#fde047;">' + price + ' 分 · 剩 ' + stock + '</span>' +
        (who === 'player'
          ? '<button type="button" class="mp-btn" style="min-height:26px;padding:0 8px;font-size:11px;" data-reverse-buy="player|' + rvEsc(s.id) + '"' + (can ? '' : ' disabled') + '>买</button>'
          : '<span style="font-size:10.5px;opacity:.6;">她自己会挑</span>') +
      '</div></div>';
  }).join('') + '</div>';
}
function reverseBagHtml(side) {
  const who = side === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const lib = getItemLibrary();
  const keys = Object.keys(st.inventory || {}).filter(function(k) { return rvNum(st.inventory[k], 0) > 0; });
  if (!keys.length) return '<div class="mp-set-desc" style="opacity:.7;">空的。</div>';
  return keys.map(function(k) {
    const it = lib.items[k] || { name: k, desc: '' };
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 0;border-bottom:1px dashed rgba(255,255,255,.06);">' +
      '<span style="font-size:12px;">' + rvEsc(it.name) + ' <span style="opacity:.6;">×' + rvNum(st.inventory[k], 0) + '</span></span>' +
      '<button type="button" class="mp-btn" style="min-height:24px;padding:0 8px;font-size:11px;" data-reverse-use="' + rvEsc(side) + '|' + rvEsc(k) + '">用</button></div>';
  }).join('');
}
function reverseBuffsHtml(owner) {
  const list = getActiveBuffs(owner);
  if (!list.length) return '';
  return '<div class="mp-set-desc" style="line-height:1.75;">' + list.map(function(b) {
    const left = b.permanent || !b.expireAt ? '永久' : (Math.max(1, Math.round((rvNum(b.expireAt, 0) - rvNow()) / 3600000)) + ' 小时');
    const color = b.kind === 'debuff' ? '#f87171' : '#7dd3fc';
    return '<span style="color:' + color + ';">●</span> ' + rvEsc(b.name) + '（' + left + '）';
  }).join('<br>') + '</div>';
}
function reverseTaskHtml(owner) {
  const who = owner === 'player' ? 'player' : 'role';
  const st = who === 'player' ? getPlayerState() : getRoleState();
  const t = st.task;
  if (!t) return '<div class="mp-set-desc" style="opacity:.7;">' + (who === 'player' ? '暂时没有任务。' : '她暂时没在盘算什么。') + '</div>';
  if (who === 'role') {
    /* 她的任务对玩家只露一个模糊的轮廓：不能直接看穿她在干什么 */
    const veil = t.status === 'active' ? 'Ta 正在盘算什么，但你看不出来。' : (t.status === 'done' ? 'Ta 好像松了口气。' : 'Ta 这两天有点低落。');
    return '<div class="mp-set-block" style="margin:0;"><div class="mp-set-desc" style="line-height:1.7;">' + rvEsc(veil) + '</div></div>';
  }
  const statusText = t.status === 'active' ? '进行中' : (t.status === 'done' ? '已完成' : '已失败');
  const color = t.status === 'active' ? '#fde047' : (t.status === 'done' ? '#7fd8a8' : '#f87171');
  return '<div style="border:1px solid rgba(244,114,208,.18);border-radius:8px;padding:7px 9px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<b style="font-size:12.5px;">' + rvEsc(t.title) + '</b>' +
      '<span style="font-size:11px;color:' + color + ';">' + statusText + '</span></div>' +
    '<div class="mp-set-desc" style="line-height:1.65;margin-top:2px;">' + rvEsc(t.desc) + '</div>' +
    '<div class="mp-set-desc" style="line-height:1.65;">进度 ' + rvNum(t.progress, 0) + ' / ' + rvNum(t.target.need, 0) +
      (t.status === 'active' ? ('　剩 ' + rvNum(t.remaining, 0) + ' 回合') : '') +
      '　奖励 +' + Math.round(rvNum(t.reward, 0) * (rvNum(t.rewardMul, 1) || 1)) + ' 分' +
      (rvNum(t.rewardMul, 1) > 1 ? '（活动 ×' + rvNum(t.rewardMul, 1) + '）' : '') + '</div></div>';
}
function reverseRolePaneHtml() {
  const role = getRoleState();
  return '<div class="mp-set-block"><div class="mp-set-title">她那边的账</div>' +
    '<div class="mp-set-desc" style="line-height:1.9;">积分 <b style="color:#f472d0;">' + rvNum(role.points, 0) + '</b>' +
      '　累计正向 E ' + rvNum(role.accumPositiveE, 0).toFixed(1) + ' × 5' +
      '<br>任务 完成 ' + rvNum(role.taskDone, 0) + ' / 失败 ' + rvNum(role.taskFailed, 0) +
      '　连败 ' + rvNum(role.failStreak, 0) + ' / ' + Math.max(1, Math.min(9, Math.round(rvNum(getReverseSettings().punishStreak, 3)))) +
      '　库存 ' + Object.keys(role.inventory || {}).length + ' 种</div>' +
    reverseTaskHtml('role') +
    (reverseBuffsHtml('role') ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">她现在的状态</div>' + reverseBuffsHtml('role') : '') +
    '</div>' +
    '<div class="mp-set-block"><div class="mp-set-title">亲手给她派一件事</div>' +
      '<div class="mp-set-desc" style="margin-bottom:6px;">她不做完就会掉分' +
        (getReverseSettings().nyankoPunish ? '，连着没做到还会中猫娘病毒' : '、闹情绪') + '。名字最多 14 个字。</div>' +
      '<div style="display:flex;gap:5px;margin-bottom:5px;">' +
        '<input id="moon-reverse-assign-title" placeholder="比如：把房间收拾干净" style="flex:1;min-height:32px;font-size:12px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;padding:0 8px;box-sizing:border-box;" />' +
      '</div>' +
      '<div style="display:flex;gap:5px;align-items:center;">' +
        '<input id="moon-reverse-assign-reward" value="12" title="奖励积分" style="width:52px;min-height:30px;font-size:12px;text-align:center;background:rgba(18,13,20,.55);color:#fde047;border:1px solid rgba(244,114,208,.25);border-radius:8px;" />' +
        '<span class="mp-set-desc" style="opacity:.75;">分</span>' +
        '<input id="moon-reverse-assign-turns" value="4" title="持续回合" style="width:44px;min-height:30px;font-size:12px;text-align:center;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;" />' +
        '<span class="mp-set-desc" style="opacity:.75;">回合</span>' +
        '<input id="moon-reverse-assign-penalty" value="6" title="没做到扣多少分" style="width:44px;min-height:30px;font-size:12px;text-align:center;background:rgba(18,13,20,.55);color:#f87171;border:1px solid rgba(244,114,208,.25);border-radius:8px;" />' +
        '<span class="mp-set-desc" style="opacity:.75;">罚</span>' +
        '<button class="mp-btn" id="moon-reverse-assign-go" style="flex:1;min-height:30px;padding:0 8px;font-size:11px;">派给她</button>' +
      '</div></div>' +
    '<div class="mp-set-block"><div class="mp-set-title">她能买到的东西</div>' + reverseShelfHtml('role') + '</div>' +
    (role.gemShelf && role.gemShelf.length ? '<div class="mp-set-block"><div class="mp-set-title">宝石橱窗</div>' + reverseShelfHtml('role', true) + '</div>' : '') +
    '<div class="mp-set-block"><div class="mp-set-title">她手上的东西</div>' + reverseBagHtml('role') + '</div>';
}
function reversePlayerPaneHtml() {
  const p = getPlayerState();
  const lib = getItemLibrary();
  const evHtml = (p.activeEvents || []).filter(function(e) { return e && rvNum(e.untilDay, 0) >= rvGameDay(); })
    .map(function(e) { return '<div class="mp-set-desc" style="color:#fde047;">今天有活动 · ' + rvEsc(e.title) + '：' + rvEsc(e.desc) + '</div>'; }).join('');
  const anniHtml = (p.anniversaries || []).slice(-4).reverse()
    .map(function(a) { return '<div class="mp-set-desc">' + rvEsc(String(a.realDate || '').slice(5)) + ' · ' + (a.type === 'marry' ? '结婚' : '表白') + '：' + rvEsc(a.charName || '') + '</div>'; }).join('');
  const pendHtml = (p.pendingTexts || []).slice(-2).reverse()
    .map(function(t) { return '<div class="mp-set-desc" style="opacity:.85;border-left:2px solid rgba(244,114,208,.4);padding-left:6px;margin:4px 0;">' + rvEsc(t.text) + '</div>'; }).join('');
  const birthday = p.birthday || reverseGuessBirthday();
  return '<div class="mp-set-block"><div class="mp-set-title">你那边的账</div>' +
    '<div class="mp-set-desc" style="line-height:1.9;">积分 <b style="color:#7dd3fc;">' + rvNum(p.points, 0) + '</b>' +
      '　券 <b>' + rvNum(p.wheelTickets, 0) + '</b>　连签 <b>' + rvNum(p.signIn.streak, 0) + '</b> 天' +
      '<br>街机 ' + rvNum(p.arcadeTotalScore, 0) + ' 分（50:1）　累计获得 ' + rvNum(p.earnedTotal, 0) +
      '<br>图鉴 ' + Object.keys(p.seenItems || {}).length + ' / ' + Object.keys(lib.items).length + '</div>' +
    evHtml +
    '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
      '<button class="mp-btn mp-btn-highlight" id="moon-reverse-signin" style="flex:1;min-height:40px;"><span>每日签到</span><small>' + (reverseCanSignIn() ? '今天还没签' : '今天已经签过了') + '</small></button>' +
      '<button class="mp-btn" id="moon-reverse-spin" style="flex:1;min-height:40px;"><span>转一次盘</span><small>券 ' + rvNum(p.wheelTickets, 0) + ' 张</small></button>' +
    '</div>' +
    '<div class="mp-set-title" style="font-size:12px;margin-top:8px;">今天的任务</div>' + reverseTaskHtml('player') +
    (reverseBuffsHtml('player') ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">你的状态</div>' + reverseBuffsHtml('player') : '') +
    (pendHtml ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">可以直接发出去的话</div>' + pendHtml : '') +
    (anniHtml ? '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">纪念日</div>' + anniHtml : '') +
    '<div class="mp-set-title" style="font-size:12px;margin-top:6px;">她的生日</div>' +
    '<div style="display:flex;gap:6px;align-items:center;">' +
      '<input id="moon-reverse-birthday" value="' + rvEsc(birthday) + '" placeholder="月-日，如 05-20" style="flex:1;min-height:30px;font-size:12px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;padding:0 8px;box-sizing:border-box;" />' +
      '<button class="mp-btn" id="moon-reverse-birthday-save" style="min-height:30px;padding:0 10px;font-size:11px;">记下</button>' +
    '</div>' +
    '</div>' +
    '<div class="mp-set-block"><div class="mp-set-title">你能买到的东西</div>' + reverseShelfHtml('player') + '</div>' +
    (p.gemShelf && p.gemShelf.length ? '<div class="mp-set-block"><div class="mp-set-title">宝石橱窗（1000 分）</div>' + reverseShelfHtml('player', true) + '</div>' : '') +
    '<div class="mp-set-block"><div class="mp-set-title">你的背包</div>' + reverseBagHtml('player') + '</div>';
}
function reverseCodexBlockHtml() {
  return '<div class="mp-set-block"><div class="mp-set-title">图鉴</div>' + getCodexHtml(reverseCodexTab()) + '</div>';
}
function reverseLibraryHtml() {
  let json = '';
  try { json = JSON.stringify({ version: 1, items: getItemLibrary().items }); } catch (e) { json = ''; }
  return '<div class="mp-set-block"><div class="mp-set-title">道具库</div>' +
    '<div class="mp-set-desc">改完粘回来点导入；稀有度可以统一改，冲突按下面两条规则处理。留空点导入 = 恢复内置。</div>' +
    '<textarea id="moon-reverse-lib" spellcheck="false" style="width:100%;min-height:86px;margin-top:6px;font-size:11px;line-height:1.5;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;padding:6px;box-sizing:border-box;">' + rvEsc(json) + '</textarea>' +
    '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">' +
      '<select id="moon-reverse-lib-rarity" style="flex:1;min-height:30px;font-size:11px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;">' +
        '<option value="">保留原稀有度</option>' +
        '<option value="common">全部普通</option><option value="rare">全部稀有</option>' +
        '<option value="legendary">全部传说</option><option value="gem">全部宝石</option></select>' +
      '<select id="moon-reverse-lib-conflict" style="flex:1;min-height:30px;font-size:11px;background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;">' +
        '<option value="rename">冲突就改名</option><option value="overwrite">冲突就覆盖</option><option value="skip">冲突就跳过</option></select>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px;">' +
      '<button class="mp-btn mp-btn-highlight" id="moon-reverse-lib-import" style="flex:1;min-height:34px;"><span>导入</span><small>按上面两条规则</small></button>' +
      '<button class="mp-btn" id="moon-reverse-lib-export" style="flex:1;min-height:34px;"><span>导出文件</span><small>存成 .json</small></button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px;">' +
      '<button class="mp-btn" id="moon-reverse-lib-reset" style="flex:1;min-height:30px;font-size:11px;">恢复内置道具</button>' +
      '<button class="mp-btn" id="moon-reverse-shelf-refresh" style="flex:1;min-height:30px;font-size:11px;">刷新两边货架</button>' +
    '</div></div>';
}
function renderReverseBlockHtml() {
  const rs = getReverseSettings();
  const role = getRoleState();
  const p = getPlayerState();
  const toggle = function(key, label, desc, on) {
    return pocketRow(label, desc, '<button class="mp-safelock-btn ' + (on ? 'on' : 'off') + '" data-reverse-toggle="' + key + '">' + (on ? '开' : '关') + '</button>');
  };
  let tab = 'role';
  try { tab = getStorage().getItem(REVERSE_UI_TAB_KEY) === 'player' ? 'player' : 'role'; } catch (e) {}
  const tabs = '<div style="display:flex;gap:6px;margin:8px 0;">' +
    '<button class="mp-btn' + (tab === 'role' ? ' mp-btn-highlight' : '') + '" data-reverse-tab="role" style="flex:1;min-height:32px;font-size:12px;">角色版</button>' +
    '<button class="mp-btn' + (tab === 'player' ? ' mp-btn-highlight' : '') + '" data-reverse-tab="player" style="flex:1;min-height:32px;font-size:12px;">玩家版</button>' +
    '</div>';

  const body =
    toggle('enabled', '攻略模式', rs.enabled ? '已开启：两边各有任务与商城，互相不知情' : '未开启。开了才有任务、商城、分数', rs.enabled) +
    toggle('userKnowsOwn', '{{user}} 知道自己的那一半', rs.userKnowsOwn ? '剧情里 {{user}} 知道自己有玩家版' : '{{user}} 不知道，只有屏幕前的你在操作', rs.userKnowsOwn) +
    toggle('charKnowsPlayerSys', '角色知道 {{user}} 也有', rs.charKnowsPlayerSys ? '角色察觉到你身上有同类东西' : '角色不知道（推荐）', rs.charKnowsPlayerSys) +
    toggle('userKnowsCharSys', '{{user}} 知道角色也有', rs.userKnowsCharSys ? '{{user}} 察觉角色身上有东西' : '{{user}} 不知道（推荐）', rs.userKnowsCharSys) +
    toggle('hud', '像素挂件', rs.hud === false ? '已关掉：页面上不显示那个球' : '右下角那个小球，点开是任务板 / 货架 / 背包 / 上下文', rs.hud !== false) +
    toggle('nyankoPunish', '失败惩罚整活', rs.nyankoPunish
      ? ('已开：只扣分，连败 ' + Math.max(1, Math.min(9, Math.round(rvNum(rs.punishStreak, 3)))) + ' 次中猫娘病毒')
      : '关着：失败只扣分 + 情绪低落 12 小时', rs.nyankoPunish) +
    (rs.nyankoPunish ? reversePunishBlockHtml() : '') +
    (rs.enabled ? (tabs + (tab === 'player' ? reversePlayerPaneHtml() : reverseRolePaneHtml()) + reverseCodexBlockHtml() + reverseLibraryHtml()) : '');

  const desc = rs.enabled
    ? ('她 ' + rvNum(role.points, 0) + ' 分 · 你 ' + rvNum(p.points, 0) + ' 分 · 券 ' + rvNum(p.wheelTickets, 0))
    : '未开启：点开设置五个开关';
  return pocketFold('reverse', '攻略模式', desc, body, false);
}

/* 事件委托：开关 / 页签 / 买 / 用 / 签到 / 转盘 / 图鉴页 / 导入导出 / 生日 */
function bindReverseBlockEvents(panel) {
  if (!panel || panel.dataset.reverseBound === '1') return;
  panel.dataset.reverseBound = '1';
  panel.addEventListener('click', function(ev) {
    const t = ev.target;
    if (!t || !t.closest) return;

    const tg = t.closest('[data-reverse-toggle]');
    if (tg) {
      const key = tg.getAttribute('data-reverse-toggle');
      const cur = getReverseSettings();
      const patch = {}; patch[key] = !cur[key];
      saveReverseSettings(patch);
      if (key === 'enabled') {
        if (patch[key]) {
          reverseMaybeRefreshShelves(true);
          reverseCheckEvents(true);
          reverseMaybeGenerateTask('role');
        } else {
          try { callSetPrompt(REVERSE_PROMPT_KEY, '', 0, 0, false); } catch (e) {}
        }
      }
      /* 挂件跟着开关走：开→挂上球，关→连球带浮层一起删掉 */
      try { if (key === 'enabled' || key === 'hud') reverseHudSync(); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const punishSave = t.closest('#moon-reverse-punish-save');
    if (punishSave) {
      const box = punishSave.closest('.mp-set-block');
      const form = reverseReadPunishForm(box);
      const foreverEl = box && box.querySelector('[data-punish-forever].mp-btn-highlight');
      form.punishForever = foreverEl && REVERSE_PUNISH_FOREVER.indexOf(foreverEl.getAttribute('data-punish-forever')) >= 0
        ? foreverEl.getAttribute('data-punish-forever') : 'escalate';
      saveReverseSettings(form);
      try { toast('惩罚已保存 · 下次失手就按这个演', 'success'); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }
    const punishForever = t.closest('[data-punish-forever]');
    if (punishForever) {
      const box = punishForever.closest('.mp-set-block');
      const form = reverseReadPunishForm(box);
      const val = punishForever.getAttribute('data-punish-forever');
      form.punishForever = REVERSE_PUNISH_FOREVER.indexOf(val) >= 0 ? val : 'escalate';
      saveReverseSettings(form);
      try { toast(val === 'always' ? '第一次中招就终身' : (val === 'off' ? '永远只给限时' : '第二次起终身'), 'info'); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }
    const punishCure = t.closest('#moon-reverse-punish-cure');
    if (punishCure) {
      const did = reverseCureNyanko();
      try { toast(did ? '猫娘病毒已解除 · 连败也清零了' : '她现在没中病毒', did ? 'success' : 'info'); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const assignGo = t.closest('#moon-reverse-assign-go');
    if (assignGo) {
      try {
        const box = assignGo.closest('.mp-set-block');
        const titleEl = box && box.querySelector('#moon-reverse-assign-title');
        const rewardEl = box && box.querySelector('#moon-reverse-assign-reward');
        const turnsEl = box && box.querySelector('#moon-reverse-assign-turns');
        const penaltyEl = box && box.querySelector('#moon-reverse-assign-penalty');
        const r = reverseAssignRoleTask({
          title: titleEl ? titleEl.value : '',
          reward: rewardEl ? rewardEl.value : 12,
          remaining: turnsEl ? turnsEl.value : 4,
          penalty: penaltyEl ? penaltyEl.value : 6
        });
        if (r.ok) {
          try { toast('派下去了：' + r.task.title, 'success'); } catch (e) {}
          try { refreshPanel(); } catch (e) {}
        } else {
          try { toast(r.reason || '派不出去', 'warning'); } catch (e) {}
        }
      } catch (e) {}
      return;
    }

    const tabBtn = t.closest('[data-reverse-tab]');
    if (tabBtn) {
      try { getStorage().setItem(REVERSE_UI_TAB_KEY, tabBtn.getAttribute('data-reverse-tab')); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const codexBtn = t.closest('[data-reverse-codex]');
    if (codexBtn) {
      try { getStorage().setItem(REVERSE_CODEX_TAB_KEY, codexBtn.getAttribute('data-reverse-codex')); } catch (e) {}
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const buyBtn = t.closest('[data-reverse-buy]');
    if (buyBtn) {
      const raw = String(buyBtn.getAttribute('data-reverse-buy') || '').split('|');
      const r = reverseBuy(raw[0], raw[1]);
      if (!r.ok) toast(r.reason || '买不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    const useBtn = t.closest('[data-reverse-use]');
    if (useBtn) {
      const raw = String(useBtn.getAttribute('data-reverse-use') || '').split('|');
      const r = reverseUseItem(raw[0], raw[1]);
      if (!r.ok) toast(r.reason || '用不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-signin')) {
      const r = reverseDoSignIn();
      if (!r.ok) toast(r.reason || '签不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-spin')) {
      const r = reverseSpinWheel('player');
      if (!r.ok) toast(r.reason || '抽不了', 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-birthday-save')) {
      const box = panel.querySelector('#moon-reverse-birthday');
      const r = reverseSetBirthday(box ? box.value : '');
      toast(r.ok ? ('生日记下了：' + r.birthday) : r.reason, r.ok ? 'success' : 'warning');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-lib-import')) {
      const box = panel.querySelector('#moon-reverse-lib');
      const rarSel = panel.querySelector('#moon-reverse-lib-rarity');
      const conSel = panel.querySelector('#moon-reverse-lib-conflict');
      const txt = box ? String(box.value || '').trim() : '';
      let r = null;
      if (!txt) {
        const builtin = reverseBuiltinItems();
        saveItemLibrary({ version: 1, items: builtin });
        r = { ok: true, added: Object.keys(builtin).length, skipped: 0 };
      } else {
        r = reverseImportItems(txt, rarSel ? rarSel.value : '', conSel ? conSel.value : 'rename');
      }
      toast(r.ok ? ('导入完成：新增 ' + r.added + ' 条' + (r.skipped ? '，跳过 ' + r.skipped : '')) : (r.reason || '导入失败'), r.ok ? 'success' : 'warning');
      if (r.ok) {
        try { reverseMaybeRefreshShelves(true); } catch (e) {}
        try { refreshPanel(); } catch (e) {}
      }
      return;
    }

    if (t.closest('#moon-reverse-lib-export')) {
      try {
        const blob = new Blob([reverseExportItems()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = mainDoc.createElement('a');
        a.href = url;
        a.download = 'moon-reverse-items-' + rvTodayKey() + '.json';
        mainDoc.body.appendChild(a);
        a.click();
        setTimeout(function() { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 1200);
        toast('导出好了', 'success');
      } catch (e) { toast('导出失败：' + String(e && e.message || e), 'warning'); }
      return;
    }

    if (t.closest('#moon-reverse-lib-reset')) {
      saveItemLibrary({ version: 1, items: reverseBuiltinItems() });
      try { reverseMaybeRefreshShelves(true); } catch (e) {}
      toast('已恢复内置道具', 'success');
      try { refreshPanel(); } catch (e) {}
      return;
    }

    if (t.closest('#moon-reverse-shelf-refresh')) {
      const r = reverseMaybeRefreshShelves(true);
      if (r.role || r.player) toast('货架已刷新：她 ' + (r.role ? '✓' : '—') + ' / 你 ' + (r.player ? '✓' : '—'), 'success');
      else toast('还在 3 小时冷却里', 'info');
      try { refreshPanel(); } catch (e) {}
    }
  }, true);
}
