/* 51-settle-log.js —— 「上一轮到底结没结算」留痕 + 面板底部那两行说明

   玩家最常见的困惑是「我回复了，好感没动，是不是脚本没跑」。
   脚本有没有跑只有它自己知道，所以每轮把结论写下来（saveLastSettle），
   面板直接读（renderSettleTraceHtml）：几个标签、谁涨了几分、被周上限压住、注入了多少段。
   维护提示：结算结论在 50-calc.js 里写入，这里只负责存与显示。 */

  /* ── 「上一轮到底结没结算」留痕 ────────────────────────────────────────────
     玩家最常见的困惑是「我回复了，好感没动，是不是脚本没跑」。
     脚本有没有跑只有它自己知道，所以每轮把结论写下来，面板直接读：
     几个标签、谁涨了几分、有没有被周上限压住。 */
  const LAST_SETTLE_KEY = 'moon_last_settle_v1';
  function saveLastSettle(rec) {
    try {
      const st = getStorage();
      if (!st) return false;
      st.setItem(LAST_SETTLE_KEY + '_' + getChatStateKey(), JSON.stringify(rec));
      return true;
    } catch (e) { return false; }
  }
  function loadLastSettle() {
    try {
      const st = getStorage();
      const raw = st && st.getItem(LAST_SETTLE_KEY + '_' + getChatStateKey());
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) { return null; }
  }

/* 面板底部那两行说明：上一轮结算 + 本轮注入量。
   数据源是上面两个 key 和 16-inject 的 _injectReport，渲染细节留在这一处。 */
function renderSettleTraceHtml(ch) {
  const name = String((ch && (ch.名字 || ch.姓名)) || '').trim();
  let settleHtml = '';
  try {
    const rec = loadLastSettle();
    let text = '';
    let color = '#94a3b8';
    if (!rec) {
      text = '还没有结算记录：这一局还没跑过一轮完整结算';
    } else if (rec.changed && rec.changed.length) {
      const mine = rec.changed.filter(function(c) { return !name || c.name === name; });
      if (mine.length) {
        text = '上一轮（' + (rec.floor >= 0 ? rec.floor + ' 楼' : '—') + '）：' + mine.map(function(c) {
          return c.field + ' ' + (c.delta >= 0 ? '+' : '') + c.delta + ' → ' + c.newValue;
        }).join('、');
        color = '#6ee7b7';
      } else {
        text = '上一轮（' + (rec.floor >= 0 ? rec.floor + ' 楼' : '—') + '）：结算了，但' + (name || '这个角色') + '没有变化';
      }
    } else if (rec.blocked && rec.blocked.length) {
      text = '上一轮（' + (rec.floor >= 0 ? rec.floor + ' 楼' : '—') + '）：' + rec.blocked.join('、') + ' 的加分被本周额度挡住了';
      color = '#fbbf24';
    } else {
      text = '上一轮（' + (rec.floor >= 0 ? rec.floor + ' 楼' : '—') + '）：没检测到数值标签 —— AI 这轮没按格式写，不是脚本没跑';
      color = '#fbbf24';
    }
    settleHtml = '<div class="mp-lcd-settle" style="margin-top:6px;font-size:10.5px;line-height:1.5;color:' + color + ';">' + lcdEscape(text) + '</div>';
  } catch (e) {}
  let injectHtml = '';
  try {
    const rep = getInjectReport();
    const n = (rep && rep.items) ? rep.items.length : 0;
    const total = (rep && rep.total) ? rep.total : 0;
    const badPos = (rep && rep.items || []).filter(function(it) { return it.pos !== 0 && it.pos !== 1 && it.pos !== 2; });
    injectHtml = '<div class="mp-lcd-inject" style="margin-top:4px;font-size:10px;color:' + (n ? '#94a3b8' : '#fbbf24') + ';">' +
      (n ? ('已注入 prompt：' + n + ' 段 / ' + total + ' 字') : '还没有注入记录：发一句话之后再看') +
      (badPos.length ? ' · ⚠ ' + badPos.length + ' 段位置不合法（会被酒馆丢掉）' : '') + '</div>';
  } catch (e) {}
  return settleHtml + injectHtml;
}
