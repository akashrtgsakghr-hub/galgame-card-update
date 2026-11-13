#!/usr/bin/env node
/**
 * 重新切分：把已经拼好的单文件按「上一版的 src/ 分片边界」重新切回去。
 *
 * 适用场景：src/ 落后了一两个版本，手上只有拼好的单文件。
 * 做法：用 `diff -U0` 拿到 旧单文件 → 新单文件 的行级映射，把旧分片的起始行映射到新位置再切。
 * 切完会断言「各片拼回去 == 新单文件」，不一致就直接失败，不会静默写坏。
 *
 * 用法（在本目录执行）：
 *   node scripts/resplit.mjs moon-phase.js ../新版本.js src            # 先试算，不落盘
 *   node scripts/resplit.mjs moon-phase.js ../新版本.js src --write    # 确认无误再落盘
 *
 * 典型场景：src/ 落后了几个版本，手上只有别人发来的拼好的单文件。
 * 注意：切完一定要跑 node scripts/build.mjs --check，产物必须与新单文件一致。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [oldFile, newFile, srcDir] = process.argv.slice(2);
const WRITE = process.argv.includes('--write');
if (!oldFile || !newFile || !srcDir) {
  console.error('用法：node tools/resplit.mjs <旧单文件> <新单文件> <src目录> [--write]');
  process.exit(2);
}

const oldText = fs.readFileSync(oldFile, 'utf8').replace(/\r\n/g, '\n');
const newText = fs.readFileSync(newFile, 'utf8').replace(/\r\n/g, '\n');

/** 按 build.mjs 的规则拼：每片去掉末尾一个换行后用 \n 连接 */
function concatFiles(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  const parts = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, ''));
  return { files, text: parts.join('\n') };
}

const cur = concatFiles(srcDir);
if (cur.text !== oldText) {
  const a = cur.text.split('\n'), b = oldText.split('\n');
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.error(`❌ src/ 拼起来和「旧单文件」不一致，从第 ${i + 1} 行开始不同`);
  console.error('   src: ' + JSON.stringify((a[i] || '').slice(0, 90)));
  console.error('   旧档: ' + JSON.stringify((b[i] || '').slice(0, 90)));
  process.exit(1);
}

/* 旧分片每片的起始行号（1 基） */
const oldLines = oldText.split('\n');
const starts = [];
let line = 1;
for (const f of cur.files) {
  starts.push({ file: f, line });
  const body = fs.readFileSync(path.join(srcDir, f), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
  line += body.split('\n').length;
}

/* diff -U0 拿行级映射 */
const tmpA = path.join(path.dirname(newFile), '.resplit-a.txt');
const tmpB = path.join(path.dirname(newFile), '.resplit-b.txt');
fs.writeFileSync(tmpA, oldText, 'utf8');
fs.writeFileSync(tmpB, newText, 'utf8');
let diff = '';
try {
  diff = execFileSync('diff', ['-U0', tmpA, tmpB], { encoding: 'utf8', maxBuffer: 1 << 28 });
} catch (e) {
  diff = e.stdout || '';
}
fs.rmSync(tmpA, { force: true });
fs.rmSync(tmpB, { force: true });

const hunks = [];
for (const m of diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
  const oStart = Number(m[1]);
  const oCount = m[2] === undefined ? 1 : Number(m[2]);
  const nStart = Number(m[3]);
  const nCount = m[4] === undefined ? 1 : Number(m[4]);
  hunks.push({ oStart, oEnd: oStart + Math.max(oCount, 1) - 1, oCount, nStart, nCount });
}

/** 旧行号 → 新行号（1 基） */
function mapLine(x) {
  let delta = 0;
  for (const h of hunks) {
    if (h.oCount === 0) {
      // 纯插入：插在旧第 oStart 行之后，只有跨越它的行号才受影响
      if (h.oStart >= x) break;
      delta += h.nCount;
      continue;
    }
    if (x < h.oStart) break;
    if (x <= h.oEnd) return h.nStart + (x - h.oStart);
    delta += h.nCount - h.oCount;
  }
  return x + delta;
}

const newLines = newText.split('\n');
if (process.env.RESPLIT_DEBUG) console.log('hunks', hunks.length, 'hunks[0]', JSON.stringify(hunks[0]), 'starts[0..2]', JSON.stringify(starts.slice(0, 3)));
const bounds = starts.map((s) => mapLine(s.line));
if (process.env.RESPLIT_DEBUG) console.log('bounds[0..4]', bounds.slice(0, 4));
bounds.push(newLines.length + 1);

const out = [];
for (let i = 0; i < starts.length; i++) {
  const from = bounds[i] - 1, to = bounds[i + 1] - 1;
  const body = newLines.slice(from, to).join('\n');
  if (!body.trim()) throw new Error(`切出来的片段是空的：${starts[i].file}（旧行 ${starts[i].line} → 新行 ${bounds[i]}）`);
  /* 不裁末尾换行：片段末行本身可能就是空行，裁掉会少一行。
     落盘时统一写成「片段 + 一个换行」，build.mjs 拼装时正好把这个换行去掉，一进一出相抵。 */
  out.push({ file: starts[i].file, body });
}

const rejoined = out.map((o) => o.body).join('\n');
if (rejoined !== newText) {
  const a = rejoined.split('\n'), b = newLines;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.error(`❌ 切完拼回去和新单文件不一致（第 ${i + 1} 行起）：`);
  console.error('   切: ' + JSON.stringify((a[i] || '').slice(0, 90)));
  console.error('   新: ' + JSON.stringify((b[i] || '').slice(0, 90)));
  process.exit(1);
}

console.log(`✅ 映射通过：${out.length} 个分片，旧 ${oldLines.length} 行 → 新 ${newLines.length} 行`);
out.forEach((o, i) => {
  const delta = o.body.split('\n').length - fs.readFileSync(path.join(srcDir, o.file), 'utf8').replace(/\r\n/g, '\n').split('\n').length;
  if (delta) console.log(`   ${o.file.padEnd(26)} ${delta > 0 ? '+' : ''}${delta} 行`);
});

if (WRITE) {
  for (const o of out) fs.writeFileSync(path.join(srcDir, o.file), o.body + '\n', 'utf8');
  console.log('✅ 已写入 src/');
} else {
  console.log('（未写入，加 --write 才落盘）');
}
