#!/usr/bin/env node
/**
 * 生成 src/89a-theme-tex.js：把「少女心绪」状态卡里那 6 张实拍素材抽出来，
 * 给主题包当第一批贴图用。
 *
 * 为什么要抽：那 6 张图已经在 88-skin.js 里内联了（卡面 / 贝扣 / 书封水印，
 * 昼各一套），主题包再用同一批图，没必要让玩家多下载一份，也没必要维护两份图源。
 * 唯一的事实来源是 88-skin.js，本脚本只做「搬」，不做「改」。
 *
 * 用法：node scripts/gen-theme-tex.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'src');
const SKIN = path.join(SRC, '88-skin.js');
const OUT = path.join(SRC, '89a-theme-tex.js');

const skin = fs.readFileSync(SKIN, 'utf8');
const start = skin.indexOf('const SKIN_CSS_CALISTA = `');
if (start < 0) throw new Error('没找到 SKIN_CSS_CALISTA');
const open = skin.indexOf('`', start) + 1;
const close = skin.indexOf('`;', open);
if (close < 0) throw new Error('SKIN_CSS_CALISTA 没有正常收尾');
const css = skin.slice(open, close);

/** 取某个变量在指定区段里的第一条定义 */
function grabVar(name, from = 0, to = css.length) {
  const seg = css.slice(from, to);
  const m = new RegExp('--' + name + ':\\s*url\\("(data:image\\/[a-z]+;base64,[A-Za-z0-9+/=]+)"\\)').exec(seg);
  return m ? m[1] : null;
}

const nightAt = css.indexOf('.mp-skin-calista[data-theme="night"]');
if (nightAt < 0) throw new Error('没找到夜间变量块');

const pairs = [
  ['paperDay', grabVar('cl-paper-art', 0, nightAt)],
  ['nacreDay', grabVar('cl-nacre', 0, nightAt)],
  ['coverDay', grabVar('cl-cover-art', 0, nightAt)],
  ['paperNight', grabVar('cl-paper-art', nightAt)],
  ['nacreNight', grabVar('cl-nacre', nightAt)],
  ['coverNight', grabVar('cl-cover-art', nightAt)],
];

for (const [k, v] of pairs) if (!v) throw new Error('素材缺失：' + k);

const bytes = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64').length;

const lines = [];
lines.push('/* 89a-theme-tex.js —— 主题包的第一批贴图（**自动生成，不要手改**）');
lines.push('   来源：少女心绪状态卡里那 6 张实拍素材（卡面珠光纸 / 鲍鱼贝内壁 / 书封双扇贝，昼各一套）。');
lines.push('   主题包与状态卡共用同一批图，避免脚本里存两份同样的 base64。');
lines.push('   改图要改 88-skin.js，然后 node scripts/gen-theme-tex.mjs 重新生成本文件。 */');
lines.push('');
lines.push('  const MOON_TEX = {');
for (const [k, v] of pairs) lines.push('    ' + k + ": '" + v + "',");
lines.push('  };');
lines.push('');
lines.push('  /* 只留字节数：主题包导入时要按体积设上限，界面上也用这个数告诉玩家有多大 */');
lines.push('  const MOON_TEX_BYTES = {');
for (const [k, v] of pairs) lines.push('    ' + k + ': ' + bytes(v) + ',');
lines.push('  };');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

const total = pairs.reduce((n, [, v]) => n + bytes(v), 0);
console.log('✅ 已生成 src/89a-theme-tex.js');
for (const [k, v] of pairs) console.log('   ' + k.padEnd(11) + (bytes(v) / 1024).toFixed(1) + 'KB');
console.log('   合计 ' + (total / 1024).toFixed(1) + 'KB（base64 后约 ' + (total * 4 / 3 / 1024).toFixed(0) + 'KB）');
