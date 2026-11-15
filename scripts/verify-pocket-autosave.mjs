// AI 回复完成 → 响一声 + 让掌机存档：宿主侧的行为回归。
// 跑的是线上同一份 src/87b-pocket-autosave.js（vm 里加载，DOM / 酒馆上下文全部打桩）。
//   node scripts/verify-pocket-autosave.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src', '87b-pocket-autosave.js');
const code = fs.readFileSync(SRC, 'utf8');

const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
};

/* 一个够用的假酒馆：主窗口、document、聊天、本地存储、把事件收进来的 addEventListener */
function boot(opts = {}) {
  const posted = [];               // 发给掌机 iframe 的消息
  const outbound = [];             // 掌机发上来的消息（由测试手动触发）
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
  const host = { querySelector: (sel) => (sel === '#moon-pocket-frame' ? frame : null) };

  let hasHost = opts.host !== false;
  const mainDoc = {
    getElementById: (id) => (id === 'moon-pocket-host' && hasHost ? host : null),
  };

  const listeners = [];
  const mainWin = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
  };

  /* 假的 Web Audio：只记「拉开了几个振荡器」，不发声 */
  const audio = { created: 0, started: 0 };
  class FakeAC {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; audio.created++; this._n = 0; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() {} }; }
    createOscillator() {
      const self = this;
      return { type: '', frequency: { value: 0 }, connect() {}, start() { audio.started++; }, stop() {} };
    }
    resume() {}
  }
  if (opts.audio !== false) mainWin.AudioContext = FakeAC;

  const sandbox = {
    console, Math, Date, JSON, String, Number, Object, Array, Promise, isNaN,
    mainWin, mainDoc,
    getSTCtx: () => ctx,
    AudioContext: undefined,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: '87b-pocket-autosave.js' });

  return {
    api: sandbox, posted, store, ctx, audio, listeners,
    /* 让宿主收到一条来自掌机的消息 */
    fromPocket(data) { listeners.forEach((fn) => fn({ data })); },
    /* 让掌机 iframe 消失（切显示模式 / 换聊天时会被拆掉） */
    unmount() { hasHost = false; },
  };
}

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
  ok('在玩 → 响了一声门铃（两个音）', did === true && t.audio.started === 2, `振荡器 ${t.audio.started} 个`);
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

console.log('\n— 静音不等于不存档 ————————————————————————');
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketChimeSet(false);
  const did = t.api.pocketAfterAiReply('generation_ended');
  ok('关掉提示音后不再响', did === true && t.audio.started === 0, `振荡器 ${t.audio.started} 个`);
  ok('但存档照旧触发', t.posted.some((m) => m.type === 'moon-host:autosave'));
  ok('关掉的选择记在酒馆这一层', t.store.get('moon_phase_pocket_chime_v1') === '0');
}
{
  const t = boot();
  t.api.pocketPlaying = true;
  t.api.pocketChimeSet(false);
  t.api.pocketChimeSet(true);
  t.api.pocketAfterAiReply('generation_ended');
  ok('重新打开后又能响', t.audio.started === 2, `振荡器 ${t.audio.started} 个`);
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
  ok('默认是开着的（新玩家第一轮就能听到）', t.audio.started === 2, `振荡器 ${t.audio.started} 个`);
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
