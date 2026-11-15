#!/usr/bin/env node
/**
 * 构建「内置卡带」变体：把 BT999 的 GBA 压进月相脚本，玩家不用再自己找 ROM 文件。
 *
 *   node scripts/build-rom-variant.mjs [--rom=<path>] [--out=<dir>]
 *
 * 产物（默认写到 ../poke-hack/deliver/）：
 *   moon-phase.rom.js                      裸脚本，含内置卡带
 *   Galgame攻略系统-酒馆助手导入-内置卡带.json  同内容的酒馆助手导入包
 *
 * 为什么是「变体」而不是直接塞进主产物：
 *   ROM 32MB → gzip 16MB → base64 22MB。主产物 moon-phase.js 才 2.2MB，
 *   塞进去以后每次自动更新都要多下 20MB，手机端也扛不住。
 *   所以主发布保持干净，需要开箱即玩的人单独拿这一份。
 *
 * 编码方式：gzip -9 后 base64，再按 1MB 切成字符串数组（单个 22MB 字面量有些
 * 解析器会崩），运行时 join + DecompressionStream('gzip') 解回 32MB。
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (name, fallback) => {
  const hit = new RegExp('--' + name + '=([^\\s]+)').exec(process.argv.join(' '));
  return hit ? hit[1] : fallback;
};

const SCRIPT = path.join(ROOT, 'moon-phase.js');
const IMPORT = path.join(ROOT, 'Galgame攻略系统-酒馆助手导入.json');
const ROM = path.resolve(arg('rom', path.join(ROOT, '..', 'pokeemerald-cn', 'pokeemerald.gba')));
const OUT_DIR = path.resolve(arg('out', path.join(ROOT, '..', 'poke-hack', 'deliver')));
const OUT_JS = path.join(OUT_DIR, 'moon-phase.rom.js');
const OUT_JSON = path.join(OUT_DIR, 'Galgame攻略系统-酒馆助手导入-内置卡带.json');

for (const f of [SCRIPT, IMPORT, ROM]) {
  if (!fs.existsSync(f)) throw new Error('缺文件：' + f);
}

/* ── 1. 压 ROM ─────────────────────────────────────────────── */
const raw = fs.readFileSync(ROM);
const gz = zlib.gzipSync(raw, { level: 9 });
const b64 = gz.toString('base64');
const md5 = crypto.createHash('md5').update(raw).digest('hex');
console.log('ROM   : ' + path.basename(ROM) + '  ' + (raw.length / 1048576).toFixed(2) + ' MB  md5 ' + md5.slice(0, 8));
console.log('gzip  : ' + (gz.length / 1048576).toFixed(2) + ' MB');
console.log('base64: ' + (b64.length / 1048576).toFixed(2) + ' MB');

/* ── 2. 切成 1MB 一段，避免单个超大字符串字面量 ───────────────── */
const CHUNK = 1 << 20;
const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));

const blob =
  '\n/* ────────────────────────────────────────────────────────────\n' +
  '   内置卡带：BT999 变态宝可梦：后宫王内部特供_v9.99魔改汉化版\n' +
  '   原始 32MB，gzip 后 base64。md5 ' + md5 + '\n' +
  '   掌机收到 moon-host:rom 后存在内存里，玩家点一下卡槽就能开机。\n' +
  '   ──────────────────────────────────────────────────────────── */\n' +
  'var __POCKET_ROM_CHUNKS = [\n' +
  chunks.map((c) => JSON.stringify(c)).join(',\n') + '\n];\n' +
  'var POCKET_ROM_MD5 = "' + md5 + '";\n' +
  'var POCKET_ROM_SIZE = ' + raw.length + ';\n';

/* ── 3. 写裸脚本 ───────────────────────────────────────────── */
const script = fs.readFileSync(SCRIPT, 'utf8');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JS, script + blob, 'utf8');

/* ── 4. 写导入 JSON（content 换成带卡带的脚本，其余字段照抄） ───── */
const pack = JSON.parse(fs.readFileSync(IMPORT, 'utf8'));
pack.content = script + blob;
pack.id = crypto.randomUUID();
pack.name = (pack.name || 'Galgame') + '-内置卡带';
fs.writeFileSync(OUT_JSON, JSON.stringify(pack), 'utf8');

/* ── 5. 回读自检：把 blob 解回来，md5 必须和 ROM 一致 ──────────── */
const back = fs.readFileSync(OUT_JS, 'utf8');
const m = /var POCKET_ROM_SIZE = \d+;/.test(back);
const arr = /var __POCKET_ROM_CHUNKS = \[([\s\S]*?)\n\];/.exec(back);
if (!m || !arr) throw new Error('自检失败：产物里找不到卡带分片');
const joined = JSON.parse('[' + arr[1] + ']').join('');
const rt = zlib.gunzipSync(Buffer.from(joined, 'base64'));
const rtMd5 = crypto.createHash('md5').update(rt).digest('hex');
if (rt.length !== raw.length || rtMd5 !== md5) {
  throw new Error('自检失败：解回来的卡带与源 ROM 不一致（' + rt.length + ' / ' + rtMd5 + '）');
}

const mb = (p) => (fs.statSync(p).size / 1048576).toFixed(2) + ' MB';
console.log('\n分片  : ' + chunks.length + ' 段（每段 ≤1MB）');
console.log('脚本  : ' + path.relative(ROOT, OUT_JS) + '  ' + mb(OUT_JS));
console.log('导入包: ' + path.relative(ROOT, OUT_JSON) + '  ' + mb(OUT_JSON));
console.log('回读  : 解回 ' + (rt.length / 1048576).toFixed(2) + ' MB，md5 ' + rtMd5.slice(0, 8) + ' 一致 ✅');
