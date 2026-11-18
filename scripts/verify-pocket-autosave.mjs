// AI 回复完成 → 响一声（小猫叫）+ 让掌机存档 + 提示玩家回正文：宿主侧的行为回归。
// 跑的是线上同一份 src/87b-pocket-autosave.js 与 src/87c-pocket-chime-cat.js
// （vm 里加载，DOM / 酒馆上下文 / Web Audio 全部打桩）。
//   node scripts/verify-pocket-autosave.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_B = path.join(HERE, '..', 'src', '87b-pocket-autosave.js');
const SRC_C = path.join(HERE, '..', 'src', '87c-pocket-chime-cat.js');

const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
};

/* 定时器要 unref：nudge 会挂一个 16 秒的自动收起定时器，
   不 unref 的话 node 进程要等它跑完才退出。 */
const later = (fn, ms) => { const t = setTimeout(fn, ms); if (t.unref) t.unref(); return t; };

/* 一个最小的 DOM 节点，够 nudge 用 */
function fakeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    style: {}, children: [], parentNode: null, id: '', type: '',
    textContent: '', attrs: {}, handlers: {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; },
    addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); },
    click() { (this.handlers.click || []).forEach((f) => f({ preventDefault() {} })); },
  };
  return el;
}

/* 一个够用的假酒馆：主窗口、document、聊天、本地存储、把事件收进来的 addEventListener */
function boot(opts = {}) {
  const posted = [];               // 发给掌机 iframe 的消息
  const store = new Map();
  const ctx = {
    chat: opts.chat || [
      { is_user: true, mes: '我出门了' },
      { is_user: false, mes: '  好，路上小心。店里我看着。  ', send_date: 1730000000000 },
    ],
    chatMetadata: {},
    saveMetadata() { ctx._saved = (ctx._saved || 0) + 1; },
  };
  const frame = { contentWindow: { postMessage: (m) => posted.push(m) } };

  /* host 是 iframe 的容器，nudge 会挂到它上面 */
  const host = fakeEl('div');
  host.id = 'moon-pocket-host';
  host.style.display = '';
  host.querySelector = (sel) => (sel === '#moon-pocket-frame' ? frame : null);

  let hasHost = opts.host !== false;
  const mainDoc = {
    getElementById: (id) => (id === 'moon-pocket-host' && hasHost ? host : (id === 'chat' ? chat : null)),
    createElement: (tag) => fakeEl(tag),
    body: fakeEl('body'),
  };
  const chat = fakeEl('div');
  chat.appendChild(fakeEl('div'));

  const listeners = [];
  let closed = 0;
  const mainWin = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
    setTimeout: later,
    clearTimeout: (t) => clearTimeout(t),
    requestAnimationFrame: (fn) => { later(fn, 0); },
  };

  /* 假的 Web Audio：分别记「振荡器」和「采样」两种发声方式 */
  const audio = { created: 0, started: 0, bufferStarts: 0, decoded: 0, decodeFail: !!opts.decodeFail };
  class FakeAC {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; audio.created++; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() {} }; }
    createOscillator() {
      return { type: '', frequency: { value: 0 }, connect() {}, start() { audio.started++; }, stop() {} };
    }
    createBufferSource() {
      return { buffer: null, connect() {}, start() { audio.bufferStarts++; } };
    }
    decodeAudioData(buf, okFn, failFn) {
      /* 真实浏览器是异步回调；这里同步给结果，好让用例能确定地断言「这一声是猫叫」。
         「还没解码完」的分支由 decodeFail 覆盖。 */
      if (audio.decodeFail) { if (failFn) failFn(new Error('bad')); return Promise.reject(new Error('bad')); }
      audio.decoded++;
      const res = { duration: 0.448, numberOfChannels: 1 };
      if (okFn) okFn(res);
      return Promise.resolve(res);
    }
    resume() {}
  }
  if (opts.audio !== false) mainWin.AudioContext = FakeAC;

  const sandbox = {
    console, Math, Date, JSON, String, Number, Object, Array, Promise, isNaN, Error, Uint8Array,
    mainWin, mainDoc,
    getSTCtx: () => ctx,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    closePanel: () => { closed++; },
    AudioContext: undefined,
  };
  vm.createContext(sandbox);
  if (opts.withCat !== false) vm.runInContext(fs.readFileSync(SRC_C, 'utf8'), sandbox, { filename: '87c-pocket-chime-cat.js' });
  vm.runInContext(fs.readFileSync(SRC_B, 'utf8'), sandbox, { filename: '87b-pocket-autosave.js' });

  return {
    api: sandbox, posted, store, ctx, audio, listeners, host, chat,
    closed: () => closed,
    /* 让宿主收到一条来自掌机的消息 */
    fromPocket(data) { listeners.forEach((fn) => fn({ data })); },
    /* 让掌机 iframe 消失（切显示模式 / 换聊天时会被拆掉） */
    unmount() { hasHost = false; },
  };
}

const nudgeOf = (t) => t.host.children.find((c) => c.id === 'moon-pocket-nudge') || null;
/* 收起是「先淡出、180ms 后从 DOM 摘掉」，所以看内部指针比看 DOM 子节点准 */
const nudgeShown = (t) => !!t.api.pocketNudgeEl;

console.log('— 什么时候该响 ————————————————————————————');
{
  const t = boot({ host: false });
  const did = t.api.pocketAfterAiReply('generation_ended');
  ok('掌机没打开过 → 什么都不做', did === false && t.posted.length === 0 && t.audio.started === 0);
}
{
  const t = boot();
  const did = t.api.pocketAfterAiReply('generation_ended');
  ok('打开了但没真正跑卡带 → 不打扰', did === false && t.audio.started === 0 && t.posted.length === 0);
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  const did = t.api.pocketAfterAiReply('generation_ended');
  ok('在玩 → 响了一声（小猫叫）', did === true && t.audio.bufferStarts === 1 && t.audio.started === 0,
    `采样 ${t.audio.bufferStarts} 次 / 振荡器 ${t.audio.started} 个`);
  ok('猫叫采样在手势时已解码，不是临时现解', t.audio.decoded === 1, `decodeAudioData 调了 ${t.audio.decoded} 次`);
  const ask = t.posted.filter((m) => m && m.type === 'moon-host:autosave');
  ok('同时让掌机把这一局存下来', ask.length === 1, JSON.stringify(ask[0] || null));
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  const n1 = t.posted.length;
  t.api.pocketAfterAiReply('message_received');   // 酒馆两个事件前后脚都到
  ok('两个事件连着来只处理一次', t.posted.length === n1, `发了 ${t.posted.length} 次`);
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  t.api.pocketReplyAt = Date.now() - 2000;        // 假装过了 2 秒
  t.api.pocketAfterAiReply('generation_ended');
  ok('过了 2 秒再来一轮会重新处理', t.posted.length === 2, `发了 ${t.posted.length} 次`);
}

console.log('\n— 采样拿不到时不能没声音 ————————————————————');
{
  const t = boot({ withCat: false });
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  ok('没有猫叫采样 → 退回双音门铃', t.audio.started === 2 && t.audio.bufferStarts === 0,
    `振荡器 ${t.audio.started} 个`);
}
{
  const t = boot({ decodeFail: true });
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  ok('采样解不开 → 同样退回门铃，不会静默', t.audio.started === 2, `振荡器 ${t.audio.started} 个`);
}

console.log('\n— 静音不等于不存档 ————————————————————————');
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketChimeSet(false);
  const did = t.api.pocketAfterAiReply('generation_ended');
  ok('关掉提示音后不再响', did === true && t.audio.started === 0 && t.audio.bufferStarts === 0,
    `采样 ${t.audio.bufferStarts} 次 / 振荡器 ${t.audio.started} 个`);
  ok('但存档照旧触发', t.posted.some((m) => m.type === 'moon-host:autosave'));
  ok('关掉的选择记在酒馆这一层', t.store.get('moon_phase_pocket_chime_v1') === '0');
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketChimeSet(false);
  t.api.pocketChimeSet(true);
  t.api.pocketAfterAiReply('generation_ended');
  ok('重新打开后又能响', t.audio.bufferStarts === 1, `采样 ${t.audio.bufferStarts} 次`);
}

console.log('\n— 提示玩家回正文 ————————————————————————');
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  const n = nudgeOf(t);
  ok('AI 回完 → 掌机右上角浮出提示', !!n, n && n.textContent);
  ok('文案说清楚点它干什么', n && /回正文/.test(n.textContent), n && n.textContent);
  n.click();
  ok('点一下 → 关面板（回到正文）', t.closed() === 1, `closePanel 调了 ${t.closed()} 次`);
  ok('点完提示自己消失', !nudgeShown(t) && n.style.opacity === '0', 'opacity=' + n.style.opacity);
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.host.style.display = 'none';      // 玩家已经把掌机收起、在看正文
  t.api.pocketAfterAiReply('generation_ended');
  ok('掌机收起时不弹提示（正文就在眼前）', !nudgeOf(t));
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  t.fromPocket({ type: 'moon-pocket:playing' });   // 玩家回到掌机继续玩
  ok('玩家回掌机继续玩 → 提示自动收起', !nudgeShown(t));
}

console.log('\n— 存档记的是真实楼层 ————————————————————————');
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.fromPocket({ type: 'moon-pocket:saved', ok: true, at: 1794599336516, bytes: 491, code: 'BPEE' });
  const note = t.ctx.chatMetadata['moon_phase_pocket_last_save_v1'];
  ok('写进了当前聊天的 chatMetadata', !!note, JSON.stringify(note));
  ok('楼层取自 ctx.chat 的最后一条 AI 消息', note && note.floor === 1, 'floor=' + (note && note.floor));
  ok('摘要取自那条消息本身（去掉多余空白）', note && note.snippet === '好，路上小心。店里我看着。', note && note.snippet);
  ok('卡带代号一并记下', note && note.code === 'BPEE', note && note.code);
  ok('落盘时让酒馆把 chatMetadata 写回文件', (t.ctx._saved || 0) === 1, 'saveMetadata 调了 ' + (t.ctx._saved || 0) + ' 次');
}
{
  const t = boot({ chat: [{ is_user: true, mes: '在吗' }] });
  t.fromPocket({ type: 'moon-pocket:saved', ok: true });
  const note = t.ctx.chatMetadata['moon_phase_pocket_last_save_v1'];
  ok('聊天里还没有 AI 回复时，楼层记 -1 不硬编', note && note.floor === -1, 'floor=' + (note && note.floor));
}
{
  const t = boot();
  t.fromPocket({ type: 'moon-pocket:saved', ok: false, why: '核心没在跑' });
  const note = t.ctx.chatMetadata['moon_phase_pocket_last_save_v1'];
  ok('掌机说这次没存上，也会如实记下来', note && note.ok === false, 'ok=' + (note && note.ok));
}

console.log('\n— 掌机那边的开关要能同步回来 ——————————————————');
{
  const t = boot();
  t.fromPocket({ type: 'moon-pocket:chime-set', on: false });
  ok('掌机点了静音 → 宿主记下来', t.store.get('moon_phase_pocket_chime_v1') === '0');
  ok('并把状态回给掌机（两边显示一致）', t.posted.some((m) => m.type === 'moon-host:chime-state' && m.on === false));
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketAfterAiReply('generation_ended');
  ok('默认是开着的（新玩家第一轮就能听到）', t.audio.bufferStarts === 1, `采样 ${t.audio.bufferStarts} 次`);
}

console.log('\n— 拆掉 iframe 之后 ————————————————————————');
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketPlayingOff();
  const did = t.api.pocketAfterAiReply('generation_ended');
  ok('掌机被拆掉后不再对着空气响', did === false);
}

const fail = results.filter((r) => !r.pass);
console.log(`\n${results.length - fail.length}/${results.length} 通过`);
if (fail.length) {
  console.log('失败项：'); fail.forEach((f) => console.log('  · ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exitCode = 1;
}
