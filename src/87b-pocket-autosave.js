/* 87b-pocket-autosave.js —— 「AI 回完了」这件事，掌机自己听不到。
   掌机跑在 sandbox iframe 里（opaque origin），既读不到酒馆的 chat，也收不到酒馆的事件；
   只有宿主这一层能听到生成结束，也才能把存档挂到当前这条聊天上。

   这里做三件事：
   1. 响一声：两个正弦音，过 2.2kHz 低通，音量 0.07——够听见，不刺耳。
   2. 让掌机落盘：给 iframe 发 moon-host:autosave，它抓 Flash 区、压缩、写回本机，
      宿主再把整包写进 chatMetadata（这一步在 87a 的 persist 通道里）。
   3. 记一笔真实楼层：从 ctx.chat 里读最后一条 AI 消息的楼层与摘要，
      和存档一起记下来——这样「这局是第几楼那轮回复时存的」是可查的，不是猜的。 */

const POCKET_CHIME_KEY = 'moon_phase_pocket_chime_v1';
const POCKET_SAVE_NOTE_KEY = 'moon_phase_pocket_last_save_v1';

/* 用 var 而不是 let：这些变量可能被前面分片里的回调在初始化顺序之前读到，
   var 会提升成 undefined，不会抛 TDZ。 */
var pocketChimeCtx = null;
var pocketChimeMaster = null;
var pocketChimeOnCache = null;
var pocketPlaying = false;
var pocketReplyAt = 0;

/* 掌机的 iframe 被拆掉（切显示模式 / 换聊天）时清掉「在玩」标记：
   不然下次 AI 回复完会对着一个不存在的掌机响一声。 */
function pocketPlayingOff() { pocketPlaying = false; }

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
      pocketChimeMaster = pocketChimeCtx.createGain();
      pocketChimeMaster.gain.value = 1;
      const lp = pocketChimeCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      pocketChimeMaster.connect(lp);
      lp.connect(pocketChimeCtx.destination);
    }
    if (pocketChimeCtx.state === 'suspended') { try { pocketChimeCtx.resume(); } catch (e) {} }
  } catch (e) {}
}

function pocketChimePlay(force) {
  if (!force && !pocketChimeGet()) return false;
  try {
    pocketChimePrime();
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
      } else if (d.type === 'moon-pocket:chime-set') {
        pocketChimeSet(!!d.on);
      } else if (d.type === 'moon-pocket:saved') {
        pocketNoteSave(d);
      }
    });
  } catch (e) {}
})();
