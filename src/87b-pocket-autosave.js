/* 87b-pocket-autosave.js —— 「AI 回完了」这件事，掌机自己听不到。
   掌机跑在 sandbox iframe 里（opaque origin），既读不到酒馆的 chat，也收不到酒馆的事件；
   只有宿主这一层能听到生成结束，也才能把存档挂到当前这条聊天上。

   这里做四件事：
   1. 响一声：一声小猫叫（87c 里内嵌的采样）；采样不可用时退回两个正弦音的门铃。
      两条链路分开走——猫叫绕开 2.2kHz 低通，不然「喵」会被削成闷响。
   2. 让掌机落盘：给 iframe 发 moon-host:autosave，它抓 Flash 区、压缩、写回本机，
      宿主再把整包写进 chatMetadata（这一步在 87a 的 persist 通道里）。
   3. 记一笔真实楼层：从 ctx.chat 里读最后一条 AI 消息的楼层与摘要，
      和存档一起记下来——这样「这局是第几楼那轮回复时存的」是可查的，不是猜的。
   4. 提示玩家回正文：玩家正盯着掌机时，正文那边已经出新楼层了。
      在掌机右上角浮一枚小提示，点一下就关面板并滚到最新一条。 */

const POCKET_CHIME_KEY = 'moon_phase_pocket_chime_v1';
const POCKET_SAVE_NOTE_KEY = 'moon_phase_pocket_last_save_v1';

/* 音色。'cat' = 87c 里那声喵；改成 'bell' 就退回双音门铃。
   不放进设置面板，是因为玩家没理由关心实现——两种都能听见，只是喜好。 */
var POCKET_CHIME_KIND = 'cat';

/* 用 var 而不是 let：这些变量可能被前面分片里的回调在初始化顺序之前读到，
   var 会提升成 undefined，不会抛 TDZ。 */
var pocketChimeCtx = null;
var pocketChimeMaster = null;
var pocketChimeDirect = null;
var pocketCatBuf = null;
var pocketCatState = 0;      // 0 未解、1 解码中、2 可用、-1 失败
var pocketChimeOnCache = null;
var pocketPlaying = false;
var pocketReplyAt = 0;
var pocketNudgeEl = null;
var pocketNudgeTimer = 0;

/* 掌机的 iframe 被拆掉（切显示模式 / 换聊天）时清掉「在玩」标记：
   不然下次 AI 回复完会对着一个不存在的掌机响一声。 */
function pocketPlayingOff() { pocketPlaying = false; pocketNudgeDismiss(); }

/* ── 提示音开关（存在酒馆这一层，玩家换聊天也还是这个选择） ─────────────── */
function pocketChimeGet() {
  if (pocketChimeOnCache !== null) return pocketChimeOnCache;
  let on = true;
  try {
    const raw = mainWin.localStorage.getItem(POCKET_CHIME_KEY);
    if (raw === '0') on = false;
    else if (raw === '1') on = true;
  } catch (e) {}
  pocketChimeOnCache = on;
  return on;
}
function pocketChimeSet(on) {
  pocketChimeOnCache = !!on;
  try { mainWin.localStorage.setItem(POCKET_CHIME_KEY, on ? '1' : '0'); } catch (e) {}
  const f = pocketFrame();
  if (f) { try { f.contentWindow.postMessage({ type: 'moon-host:chime-state', on: !!on }, '*'); } catch (e) {} }
}

/* 建 AudioContext 要趁用户手势（点开面板 / 点卡带），
   等到 AI 回复完再建，多半是 suspended 状态，响不出来。 */
function pocketChimePrime() {
  try {
    const AC = mainWin.AudioContext || mainWin.webkitAudioContext;
    if (!AC) return;
    if (!pocketChimeCtx) {
      pocketChimeCtx = new AC();
      /* 门铃那条：过 2.2kHz 低通，软一点 */
      pocketChimeMaster = pocketChimeCtx.createGain();
      pocketChimeMaster.gain.value = 1;
      const lp = pocketChimeCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      pocketChimeMaster.connect(lp);
      lp.connect(pocketChimeCtx.destination);
      /* 猫叫那条：直连，不加滤波——采样本身就是 8bit/10.5kHz，
         再过一层低通只会把「喵」的尾音削没。 */
      pocketChimeDirect = pocketChimeCtx.createGain();
      pocketChimeDirect.gain.value = 1;
      pocketChimeDirect.connect(pocketChimeCtx.destination);
    }
    if (pocketChimeCtx.state === 'suspended') { try { pocketChimeCtx.resume(); } catch (e) {} }
    pocketCatDecode();
  } catch (e) {}
}

/* 采样只有 12KB，趁手势时解码好（几十毫秒），别等要响的那一刻才解。 */
function pocketCatDecode() {
  if (pocketCatState !== 0) return;
  if (!pocketChimeCtx) return;
  let b64 = '';
  try { b64 = (typeof POCKET_CAT_B64 === 'string') ? POCKET_CAT_B64 : ''; } catch (e) { b64 = ''; }
  if (!b64) { pocketCatState = -1; return; }
  pocketCatState = 1;
  try {
    const bin = atob(b64);
    const n = bin.length;
    const u8 = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    const after = function (buf) { pocketCatBuf = buf; pocketCatState = 2; };
    const fail = function () { pocketCatState = -1; };
    const p = pocketChimeCtx.decodeAudioData(u8.buffer, after, fail);
    /* 新版浏览器返回 Promise，旧版靠回调 —— 两条都接上，谁先到算谁 */
    if (p && typeof p.then === 'function') p.then(after).catch(fail);
  } catch (e) { pocketCatState = -1; }
}

function pocketCatPlay() {
  try {
    if (pocketCatState === 0) pocketCatDecode();
    if (!pocketCatBuf || !pocketChimeCtx) return false;
    if (pocketChimeCtx.state === 'suspended') { try { pocketChimeCtx.resume(); } catch (e) {} }
    const src = pocketChimeCtx.createBufferSource();
    const g = pocketChimeCtx.createGain();
    src.buffer = pocketCatBuf;
    g.gain.value = 0.6;          // 采样已归一化到 0.92，这里再留一截余量
    src.connect(g);
    g.connect(pocketChimeDirect || pocketChimeCtx.destination);
    src.start(0);
    return true;
  } catch (e) { return false; }
}

function pocketBellPlay() {
  try {
    const ctx = pocketChimeCtx;
    if (!ctx) return false;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    const t0 = ctx.currentTime + 0.03;
    /* G5 → C6，一个小三度上行；两声错开 130ms，听感像门铃不像警报 */
    [[783.99, 0], [1046.5, 0.13]].forEach(function (pair) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = pair[0];
      g.gain.setValueAtTime(0.0001, t0 + pair[1]);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + pair[1] + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + pair[1] + 0.85);
      o.connect(g);
      g.connect(pocketChimeMaster);
      o.start(t0 + pair[1]);
      o.stop(t0 + pair[1] + 0.9);
    });
    return true;
  } catch (e) { return false; }
}

function pocketChimePlay(force) {
  if (!force && !pocketChimeGet()) return false;
  try {
    pocketChimePrime();
    if (!pocketChimeCtx) return false;
    if (POCKET_CHIME_KIND === 'cat') {
      if (pocketCatPlay()) return true;
      /* 采样还没解好 / 解不开：这一声用门铃顶上，不能让玩家什么都听不到 */
      if (pocketCatState === 1) { try { mainWin.setTimeout(function () { pocketCatPlay(); }, 400); } catch (e) {} }
    }
    return pocketBellPlay();
  } catch (e) { return false; }
}

/* ── 掌机的 iframe 在哪 ──────────────────────────────────────────────────── */
function pocketFrame() {
  try {
    const host = mainDoc.getElementById('moon-pocket-host');
    if (!host) return null;
    const f = host.querySelector('#moon-pocket-frame');
    return f || null;
  } catch (e) { return null; }
}

function pocketRequestAutosave(reason) {
  const f = pocketFrame();
  if (!f) return false;
  try {
    f.contentWindow.postMessage({ type: 'moon-host:autosave', reason: reason || 'ai-reply' }, '*');
    return true;
  } catch (e) { return false; }
}

/* ── 真实楼层：读 ctx.chat，不是猜 ─────────────────────────────────────── */
function pocketLastAiMessage() {
  try {
    const c = getSTCtx();
    const chat = (c && Array.isArray(c.chat)) ? c.chat : [];
    for (let i = chat.length - 1; i >= 0; i--) {
      const m = chat[i];
      if (!m || m.is_user) continue;
      return {
        floor: i,
        msgId: (m.send_date || i),
        snippet: String(m.mes || '').replace(/\s+/g, ' ').trim().slice(0, 60)
      };
    }
  } catch (e) {}
  return { floor: -1, msgId: -1, snippet: '' };
}

function pocketNoteSave(info) {
  try {
    const c = getSTCtx();
    if (!c) return;
    if (!c.chatMetadata || typeof c.chatMetadata !== 'object') c.chatMetadata = {};
    const last = pocketLastAiMessage();
    const prev = c.chatMetadata[POCKET_SAVE_NOTE_KEY] || {};
    c.chatMetadata[POCKET_SAVE_NOTE_KEY] = {
      at: Date.now(),
      floor: last.floor,
      msgId: last.msgId,
      snippet: last.snippet,
      code: String((info && info.code) || prev.code || ''),
      bytes: Number((info && info.bytes) || 0),
      reason: String((info && info.reason) || 'ai-reply'),
      ok: !(info && info.ok === false)
    };
    if (typeof c.saveMetadata === 'function') c.saveMetadata();
  } catch (e) {}
}

/* ── 提示玩家回正文 ────────────────────────────────────────────────────────
   玩家盯着掌机的时候，正文那边已经多了一楼。只响一声不够——他得知道回去看什么。
   这枚胶囊挂在掌机容器里（不在 iframe 内，才能在点击时关掉面板、滚到正文）。 */
function pocketNudgeDismiss() {
  if (pocketNudgeTimer) { try { mainWin.clearTimeout(pocketNudgeTimer); } catch (e) {} pocketNudgeTimer = 0; }
  const el = pocketNudgeEl;
  pocketNudgeEl = null;
  if (!el) return;
  try { el.style.opacity = '0'; } catch (e) {}
  try {
    mainWin.setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 180);
  } catch (e) {}
}

function pocketNudge() {
  try {
    const host = mainDoc.getElementById('moon-pocket-host');
    if (!host) return false;
    /* 掌机没在显示（display:none）说明玩家已经回到正文了，正文就在眼前，不用再喊 */
    if (host.style.display === 'none') return false;
    pocketNudgeDismiss();
    const el = mainDoc.createElement('button');
    el.type = 'button';
    el.id = 'moon-pocket-nudge';
    el.textContent = 'AI 回话了 · 点这里回正文';
    el.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:10px;' +
      'z-index:2;border:0;cursor:pointer;white-space:nowrap;' +
      'font:600 12px/1.55 system-ui,-apple-system,"Microsoft YaHei",sans-serif;letter-spacing:.02em;' +
      'color:#F6EEF0;background:rgba(28,20,26,.88);padding:7px 14px;border-radius:999px;' +
      'box-shadow:0 2px 10px rgba(20,12,18,.38);opacity:0;transition:opacity .18s ease;';
    el.addEventListener('click', function (e) {
      try { e.preventDefault(); } catch (err) {}
      pocketNudgeDismiss();
      /* 面板是全屏遮罩，不关掉就看不见正文；关面板会连掌机一起停，
         但存档刚在上一行写进 chatMetadata 了，下次打开原样恢复。 */
      try { if (typeof closePanel === 'function') closePanel(); } catch (err) {}
      try {
        const chat = mainDoc.getElementById('chat');
        const last = chat && chat.lastElementChild;
        if (last && typeof last.scrollIntoView === 'function') last.scrollIntoView({ block: 'end' });
      } catch (err) {}
    });
    host.appendChild(el);
    pocketNudgeEl = el;
    try { mainWin.requestAnimationFrame(function () { el.style.opacity = '1'; }); } catch (e) { el.style.opacity = '1'; }
    /* 16 秒没点就自己收起来，别一直压在掌机画面上 */
    pocketNudgeTimer = mainWin.setTimeout(function () { pocketNudgeDismiss(); }, 16000);
    return true;
  } catch (e) { return false; }
}

/* ── 主入口：AI 这一轮回完了 ───────────────────────────────────────────── */
function pocketAfterAiReply(reason) {
  /* 什么情况下什么都不做：
     · 掌机压根没打开过（host 不在）——玩家没在玩，不该被打扰
     · 打开过但没真正跑卡带（pocketPlaying=false）——只是看了一眼
     这两个条件合起来，等于「只有真的在玩这局的人才收得到提示」。 */
  if (!pocketFrame() || !pocketPlaying) return false;
  const now = Date.now();
  /* generation_ended 与 message_received 会前后脚都来，1.5 秒内只处理一次 */
  if (now - pocketReplyAt < 1500) return false;
  pocketReplyAt = now;
  pocketChimePlay();
  pocketRequestAutosave(reason || 'ai-reply');
  pocketNudge();
  return true;
}

/* 掌机发上来的三种消息：真的开始玩了 / 开关了提示音 / 存完了 */
(function pocketBindMessages() {
  try {
    mainWin.addEventListener('message', function (event) {
      const d = event.data;
      if (!d || typeof d.type !== 'string' || d.type.indexOf('moon-pocket:') !== 0) return;
      if (d.type === 'moon-pocket:playing') {
        pocketPlaying = true;
        pocketChimePrime();
        /* 玩家已经回到掌机开始玩了，那条「回正文」的提示该收了 */
        pocketNudgeDismiss();
      } else if (d.type === 'moon-pocket:chime-set') {
        pocketChimeSet(!!d.on);
      } else if (d.type === 'moon-pocket:saved') {
        pocketNoteSave(d);
      }
    });
  } catch (e) {}
})();
