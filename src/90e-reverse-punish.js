/* 90e-reverse-punish.js —— 失败惩罚整活：猫娘病毒

   口径：一次失败只扣分；连败满 N 次（默认 3）才中病毒；时长三档 off / escalate / always。
   这里放「病毒本身」——症状文案、触发与升级终身、手动解除，以及面板上那块设置。
   任务失败结算在 90d，每轮注入在核心片的 injectReversePrompt。 */
/* ── 失败惩罚整活：扣分是唯一的数值代价，猫娘病毒要连败满次数才中 ──
   设计口径（写进提示词，角色和玩家各知道该知道的那一半）：
     · 一次失败 → 只扣分；惩罚的「样子」由玩家自己写的那句话决定，AI 照着演一次。
     · 连续 N 次失败（默认 3）→ 中「猫娘病毒」：每句带「喵」、自称「人家」、夹着嗓子撒娇。
     · 时长三档（punishForever）：off 永远 N 小时 / escalate 第二次起终身 / always 第一次就终身。
   为什么要连败计数而不是一失败就猫：一次失手就给角色挂 12 小时猫娘，会把「失败」这件事
   变得比「完成任务」更划算（猫娘状态本身就是奖励），连败才有惩罚的威胁感。 */
function reverseNyankoText(rs, permanent) {
  return '你现在中了「猫娘病毒」。' + (permanent ? '它不会再好了，会跟着你一辈子。' : '') +
    '症状：每一句她说出口的话（含心声）结尾都要带一个「喵」；自称换成「人家」；说话是夹着嗓子的，又软又飘、尾音上扬；' +
    '会不由自主向对方撒娇、拖长音、讨一点注意。你完全清楚这不正常，也知道这是惩罚，' +
    '你想忍住、也会觉得羞——但你控制不住；可以写你咬着牙想把那声「喵」咽回去，可它最后还是漏出来了。';
}
/* 中病毒（或在已中状态下升级为终身）。返回 {permanent, hours, times} */
function reverseTriggerNyanko(rs, t) {
  const st = getRoleState();
  if (!Array.isArray(st.buffs)) st.buffs = [];
  const mode = REVERSE_PUNISH_FOREVER.indexOf(String(rs.punishForever)) >= 0 ? String(rs.punishForever) : 'escalate';
  const times = rvNum(st.nyankoCount, 0);          /* 之前中过几次 */
  const permanent = mode === 'always' || (mode === 'escalate' && times >= 1);
  const hours = Math.max(1, Math.round(rvNum(rs.punishHours, 12)));
  st.nyankoCount = times + 1;
  const exist = st.buffs.filter(function(b) { return b && b.key === 'nyanko_virus'; })[0] || null;
  const prompt = reverseNyankoText(rs, permanent);
  if (exist) {
    exist.permanent = permanent;
    exist.expireAt = permanent ? 0 : Math.max(rvNum(exist.expireAt, 0), rvNow() + rvHourMs(hours));
    exist.prompt = prompt;
    exist.at = rvNow();
  } else {
    st.buffs.push({
      key: 'nyanko_virus', name: '猫娘病毒', kind: 'debuff', prompt: prompt,
      permanent: permanent, expireAt: permanent ? 0 : rvNow() + rvHourMs(hours),
      stackable: false, at: rvNow(), fromTask: String((t && t.title) || '').slice(0, 20)
    });
  }
  if (st.buffs.length > 24) st.buffs = st.buffs.slice(-24);
  saveRoleState(st);
  return { permanent: permanent, hours: hours, times: st.nyankoCount };
}
/* 手动解除：玩家玩够了 / 想给她一个台阶。终身的那条也能清掉。 */
function reverseCureNyanko() {
  const st = getRoleState();
  const before = (st.buffs || []).length;
  st.buffs = (st.buffs || []).filter(function(b) { return !(b && b.key === 'nyanko_virus'); });
  st.failStreak = 0;
  st.punishPending = null;
  saveRoleState(st);
  return before !== st.buffs.length;
}
/* 表单读值：保存按钮和时长按钮都要用，避免「改完文案再点时长」把文案丢了 */
function reverseReadPunishForm(box) {
  const txtEl = box && box.querySelector('#moon-reverse-punish-text');
  const streakEl = box && box.querySelector('#moon-reverse-punish-streak');
  const hoursEl = box && box.querySelector('#moon-reverse-punish-hours');
  return {
    punishText: String(txtEl ? txtEl.value : '').replace(/\s+/g, ' ').trim().slice(0, 120),
    punishStreak: Math.max(1, Math.min(9, parseInt(streakEl && streakEl.value, 10) || 3)),
    punishHours: Math.max(1, Math.min(72, parseInt(hoursEl && hoursEl.value, 10) || 12))
  };
}
/* 整活设置块：惩罚文案 / 触发次数 / 时长档位 / 当前连败 / 一键解除 */
function reversePunishBlockHtml() {
  const rs = getReverseSettings();
  const role = getRoleState();
  const need = Math.max(1, Math.min(9, Math.round(rvNum(rs.punishStreak, 3))));
  const hours = Math.max(1, Math.round(rvNum(rs.punishHours, 12)));
  const mode = REVERSE_PUNISH_FOREVER.indexOf(String(rs.punishForever)) >= 0 ? String(rs.punishForever) : 'escalate';
  const virus = (role.buffs || []).filter(function(b) { return b && b.key === 'nyanko_virus'; })[0] || null;
  const virusText = virus
    ? (virus.permanent ? '终身' : ('还剩 ' + Math.max(1, Math.round((rvNum(virus.expireAt, 0) - rvNow()) / 3600000)) + ' 小时'))
    : '未中';
  const fieldStyle = 'background:rgba(18,13,20,.55);color:#e5e7eb;border:1px solid rgba(244,114,208,.25);border-radius:8px;';
  return '<div class="mp-set-block"><div class="mp-set-title">挨罚的样子</div>' +
    '<div class="mp-set-desc" style="line-height:1.7;">任务没做到只扣分。挨罚的「样子」由你写，AI 会照着演一次；' +
      '连着 ' + need + ' 次没做到，她会中「猫娘病毒」——句句带「喵」、自称「人家」、夹着嗓子撒娇，她自己知道不对劲但控制不住。</div>' +
    '<textarea id="moon-reverse-punish-text" spellcheck="false" placeholder="写你想要的惩罚，比如：跪坐在门边等到对方回来，说一句「我错了」" ' +
      'style="width:100%;min-height:64px;margin-top:6px;font-size:12px;line-height:1.6;padding:6px;box-sizing:border-box;' + fieldStyle + '">' +
      rvEsc(String(rs.punishText || '')) + '</textarea>' +
    '<div style="display:flex;gap:6px;align-items:center;margin-top:6px;">' +
      '<span class="mp-set-desc" style="opacity:.8;flex:0 0 auto;">连败</span>' +
      '<input id="moon-reverse-punish-streak" value="' + need + '" title="连续失败几次触发猫娘病毒" style="width:46px;min-height:30px;font-size:12px;text-align:center;' + fieldStyle + '" />' +
      '<span class="mp-set-desc" style="opacity:.8;flex:0 0 auto;">次 · 病毒</span>' +
      '<input id="moon-reverse-punish-hours" value="' + hours + '" title="猫娘病毒持续几小时" style="width:46px;min-height:30px;font-size:12px;text-align:center;' + fieldStyle + '" />' +
      '<span class="mp-set-desc" style="opacity:.8;flex:0 0 auto;">小时</span>' +
    '</div>' +
    '<div style="display:flex;gap:5px;margin-top:6px;">' +
      [['escalate', '第二次起终身'], ['always', '第一次就终身'], ['off', '永远 ' + hours + ' 小时']].map(function(kv) {
        const on = mode === kv[0];
        return '<button class="mp-btn' + (on ? ' mp-btn-highlight' : '') + '" data-punish-forever="' + kv[0] +
          '" style="flex:1;min-height:30px;font-size:11px;padding:0 4px;' +
          (on ? 'border-color:#f472d0;color:#ffd6f2;' : '') + '">' + kv[1] + '</button>';
      }).join('') +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px;">' +
      '<button class="mp-btn mp-btn-highlight" id="moon-reverse-punish-save" style="flex:1;min-height:32px;font-size:12px;">保存</button>' +
      '<button class="mp-btn" id="moon-reverse-punish-cure" style="flex:1;min-height:32px;font-size:12px;">解除病毒</button>' +
    '</div>' +
    '<div class="mp-set-desc" style="line-height:1.8;margin-top:5px;">' +
      '她现在：连败 <b>' + rvNum(role.failStreak, 0) + '</b> / ' + need + '<br>' +
      '猫娘病毒：<b style="color:' + (virus ? '#f472d0' : '#9ca3af') + ';">' + virusText + '</b>' +
      (rvNum(role.nyankoCount, 0) > 0 ? '　累计中过 ' + rvNum(role.nyankoCount, 0) + ' 次' : '') + '</div>' +
    '</div>';
}
