// 存档快照回归：不跑模拟器，用合成的 136KB 存档区走一遍「压缩 → 写盘 → 读盘 → 回填」。
// 跑的是线上同一份 src/pocket.10-save.js（vm 里加载，不复制代码）。
//   node tools/verify-save.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src', 'pocket.10-save.js');
const code = fs.readFileSync(SRC, 'utf8');

const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
};

const SIZE = 0x20000 + 0x2000;   // 核心符号 2 的大小：128KB Flash + 8KB 附加区

function boot(opts = {}) {
  const store = new Map();
  const sandbox = {
    console, Math, Date, JSON, String, Number, Object, Array, Promise, isNaN,
    Uint8Array, Blob, Response, CompressionStream, DecompressionStream, btoa, atob,
    FLAG_PREFIX: 'moon-pocket:flag:',
    lastRom: opts.rom === null ? null : (opts.rom || { hash: 'abc123def4567890', code: 'BPEE', title: 'POKEMON EMER' }),
    coreBooted: true,
    coreSavView: null,
    LS: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    $: () => null,
    toast: () => {},
    parent: { postMessage: () => {} },
    addEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    document: { hidden: false },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'pocket.10-save.js' });
  const U8 = sandbox.Uint8Array;
  const view = new U8(SIZE);
  view.fill(0xff);
  sandbox.coreSavView = view;
  return { sandbox, store, view, U8 };
}

/* 空存档：整片 0xFF，和真卡带从没存过档时一样 */
function blankSlice(U8) {
  const u = new U8(SIZE);
  u.fill(0xff);
  return u;
}
/* 有内容的存档：几段数据块 + 大量 0xFF 空区，接近真实的宝可梦 Flash 存档 */
function filledSlice(U8, seed = 1) {
  const u = blankSlice(U8);
  for (let i = 0; i < 8; i++) {
    const base = 0x1000 + i * 0x2000;
    for (let j = 0; j < 0x800; j++) u[base + j] = (seed * 13 + i * 31 + j * 7) & 0xff;
  }
  return u;
}
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

console.log('— 压缩往返 ————————————————————————————————');
{
  const { sandbox, U8 } = boot();
  const blank = blankSlice(U8);
  const packed = await sandbox.savCompress(blank);
  const back = await sandbox.savDecompress({ k: packed.k, raw: blank.length, data: sandbox.savB64(packed.bytes) });
  ok('空存档能被压到 2KB 以内', packed.bytes.length < 2048, `${packed.k} · ${packed.bytes.length} 字节`);
  ok('空存档解压后逐字节一致', back && same(back, blank), back ? `${back.length} 字节` : '解压失败');

  const data = filledSlice(U8, 5);
  const p2 = await sandbox.savCompress(data);
  const b2 = await sandbox.savDecompress({ k: p2.k, raw: data.length, data: sandbox.savB64(p2.bytes) });
  ok('有内容的存档能压到原体积的 20% 以内', p2.bytes.length < SIZE * 0.2,
    `${p2.k} · ${p2.bytes.length}/${SIZE} 字节（${(p2.bytes.length / SIZE * 100).toFixed(1)}%）`);
  ok('有内容的存档解压后逐字节一致', b2 && same(b2, data), b2 ? `${b2.length} 字节` : '解压失败');

  const b64 = sandbox.savB64(p2.bytes);
  ok('落进聊天的 base64 在 20 万字符以内', b64.length < 200000, `${b64.length} 字符`);
  ok('base64 解回来还是同一份', same(sandbox.savUnB64(b64), p2.bytes));
}

console.log('\n— 写盘 / 读盘 ——————————————————————————————');
{
  const { sandbox, store, view, U8 } = boot();
  const data = filledSlice(U8, 9);
  view.set(data);

  const r1 = await sandbox.savWrite('manual');
  ok('写盘成功', r1.ok, `压缩后 ${r1.bytes} 字节（${r1.pack}）`);
  ok('键按卡带指纹走', store.has('moon-pocket:cart-save:abc123def4567890'),
    [...store.keys()].join(' , '));

  const rec = JSON.parse(store.get('moon-pocket:cart-save:abc123def4567890'));
  ok('记录里带压缩算法与原始长度', rec.k === r1.pack && rec.raw === SIZE, `k=${rec.k} raw=${rec.raw}`);
  ok('记录里带卡带代号', rec.code === 'BPEE', rec.code);

  const r2 = await sandbox.savWrite('timer');
  ok('没变化就不重复写（省次数）', r2.ok && r2.skip === 'nochange', r2.skip || '');

  view[0x4000] ^= 0xff;
  const r3 = await sandbox.savWrite('flash');
  ok('改了一个字节就会重写', r3.ok && !r3.skip, r3.skip || 'rewrote');

  /* 模拟关掉核心再开机：存档区被清零，靠 savRestoreToCore 回填 */
  const before = Array.from(view);
  view.fill(0x00);
  const restored = await sandbox.savRestoreToCore();
  ok('重新开机能把存档回填进核心', restored && same(Array.from(view), before),
    restored ? '逐字节一致' : '回填失败');
}

console.log('\n— 边界 ————————————————————————————————————');
{
  const { sandbox, store, view, U8 } = boot();
  view.set(blankSlice(U8));
  const r = await sandbox.savWrite('auto');
  ok('空存档不写盘（还没在游戏里存过档）', r.ok && r.skip === 'blank', r.skip || '');
  ok('空存档确实没留下记录', store.size === 0, [...store.keys()].join(',') || '无');
}
{
  const { sandbox, store, view, U8 } = boot({ rom: { hash: 'ffff000011112222', code: 'BPRE', title: 'POKEMON FIRE' } });
  view.set(filledSlice(U8, 3));
  await sandbox.savWrite('manual');
  ok('换一张卡带就是另一把钥匙（不串档）', store.has('moon-pocket:cart-save:ffff000011112222'),
    [...store.keys()].join(','));
}
{
  const { sandbox, store } = boot();
  store.set('moon-pocket:cart-save:abc123def4567890', JSON.stringify({ v: 1, k: 'd', raw: SIZE, data: 'AAAA' }));
  const bad = await sandbox.savRestoreToCore();
  ok('坏掉的存档不会把核心写坏（解压失败就跳过）', bad === false);
}
{
  const { sandbox, store, view, U8 } = boot();
  view.set(filledSlice(U8, 7));
  await sandbox.savWrite('manual');
  const json = store.get('moon-pocket:cart-save:abc123def4567890');
  ok('落盘的是能解析的 JSON', (() => { try { return !!JSON.parse(json).data; } catch (e) { return false; } })(),
    `${json.length} 字符`);
}

const fail = results.filter((r) => !r.pass);
console.log(`\n${results.length - fail.length}/${results.length} 通过`);
if (fail.length) {
  console.log('失败项：'); fail.forEach((f) => console.log('  · ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exitCode = 1;
}
