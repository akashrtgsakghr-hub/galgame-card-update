// 认图回归：拿卡带里真实的地图数据造「一帧画面」，看能不能认出是哪张图的哪一格。
// 关键不是「全都认得出」，而是「绝不认错」——认不准就返回 null，界面上说「走两步再点」。
import fs from 'node:fs';

const ROOT = 'C:/Users/1/WorkBuddy/2026-10-31-03-22-02';
const ROM = process.argv[2] || 'E:/绿宝石+模拟器/1100296.gba';

const src = ['pocket.11-rom-atlas.js', 'pocket.12-nav-core.js', 'pocket.13-nav-view.js']
  .map((f) => fs.readFileSync(`${ROOT}/moon-pocket/src/${f}`, 'utf8')).join('\n;\n');
const api = new Function(src + `; return {
  navTestSetRom, navIdentify, navMapGrid, navAtlas };`)();

const bytes = new Uint8Array(fs.readFileSync(ROM));
api.navTestSetRom(bytes);
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log(`  ✓ ${n}${e ? ' · ' + e : ''}`); } else { fail++; console.log(`  ✗ ${n}${e ? ' · ' + e : ''}`); } };

console.log('== 认图 ==');
const atlas = api.navAtlas();
ok('图集可用', !!atlas, atlas ? atlas.count + ' 张' : '');

const ident = JSON.parse(fs.readFileSync(ROOT + '/moon-pocket/shots/_identity.json', 'utf8'));
const byName = new Map(ident.map((m) => [m.name, m.i]));

/* 从地图数据里抠出 15×8 的一窗，当作「画面」喂进去 */
function fakeFrame(idx, ox, oy, noise) {
  const mg = api.navMapGrid(atlas, idx);
  const out = new Uint8Array(15 * 8);
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 15; tx++) {
      let v = mg.grid[(oy + ty) * mg.w + ox + tx];
      if (noise) v = Math.max(0, Math.min(255, v + (((tx * 7 + ty * 13) % 11) - 5)));
      out[ty * 15 + tx] = v;
    }
  }
  return out;
}
function centerFrame(name, noise) {
  const idx = byName.get(name);
  const mg = api.navMapGrid(atlas, idx);
  const ox = Math.max(0, Math.floor((mg.w - 15) / 2)), oy = Math.max(0, Math.floor((mg.h - 8) / 2));
  return { idx, ox, oy, fl: fakeFrame(idx, ox, oy, noise) };
}

/* 一、该认得出的必须认对，坐标也要对 */
const mustKnow = ['LittlerootTown', 'SlateportCity', 'FortreeCity', 'Route119', 'LilycoveCity'];
for (const name of mustKnow) {
  if (!byName.has(name)) continue;
  const c = centerFrame(name, false);
  const t0 = Date.now();
  const got = api.navIdentify(c.fl);
  const ms = Date.now() - t0;
  ok(`${name} 认得出且认对`, !!got && got.idx === c.idx,
    got ? `→ ${ident[got.idx].name} 得分 ${got.score}/120 · ${ms}ms` : 'null');
  if (got && got.idx === c.idx) {
    /* 画面取的是「玩家所在行往上 5 行」，所以玩家在这一窗的第 5 行 */
    ok(`${name} 位置对得上`, got.x === c.ox + 7 && got.y === c.oy + 5, `期望 (${c.ox + 7},${c.oy + 5}) 实得 (${got.x},${got.y})`);
  }
}

/* 二、地形在好几张图里都一样的，必须返回 null（宁可不说，不许说错） */
for (const name of ['Route101', 'PetalburgCity']) {
  if (!byName.has(name)) continue;
  const c = centerFrame(name, false);
  const got = api.navIdentify(c.fl);
  ok(`${name} 这块地形有歧义 → 不猜`, got === null, got ? `认成了 ${ident[got.idx].name}` : 'null（符合预期）');
}

/* 三、全量抽样：凡是给出答案的，必须都是对的 */
let asked = 0, answered = 0, wrong = 0;
for (let i = 0; i < atlas.count; i += 3) {
  const lay = atlas.layoutOf(i);
  if (!lay || lay.w < 15 || lay.h < 8) continue;
  const mg = api.navMapGrid(atlas, i);
  const ox = Math.max(0, Math.floor((mg.w - 15) / 2)), oy = Math.max(0, Math.floor((mg.h - 8) / 2));
  const got = api.navIdentify(fakeFrame(i, ox, oy, false));
  asked++;
  if (got) { answered++; if (got.idx !== i) wrong++; }
}
ok('抽样扫全图：给答案的都认对了', wrong === 0, `问了 ${asked} 张，敢答 ${answered} 张，答错 ${wrong} 张`);

/* 四、加噪声（NPC、天气）后，原本认得出的那些仍不该认错 */
let noisyWrong = 0, noisyAnswered = 0;
for (const name of mustKnow) {
  if (!byName.has(name)) continue;
  const c = centerFrame(name, true);
  const got = api.navIdentify(c.fl);
  if (got) { noisyAnswered++; if (got.idx !== c.idx) noisyWrong++; }
}
ok('有噪声也不认错', noisyWrong === 0, `还敢答 ${noisyAnswered} 张，答错 ${noisyWrong} 张`);

console.log(`\n==== ${pass}/${pass + fail} 通过 ====`);
if (fail) process.exit(1);
