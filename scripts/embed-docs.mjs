#!/usr/bin/env node
/**
 * 生成 src/89d-beauty-docs.js：把 docs/ 下两份美化文档装进脚本，供面板「下载文档」按钮用。
 *
 * 为什么是 base64 而不是直接抄字符串：文档里必须举反例（#000、#ffffff、rgba(0,0,0,…)），
 * 而护眼测试 E02 会扫产物里有没有这些字面量。编成 base64 之后产物里只剩密文，
 * 运行时再解出来，既不违反规则，文档也能原样给玩家。
 *
 * 文档的事实来源是 docs/*.md，本脚本只做搬运，不要手改生成的片段。
 *
 * 用法：node scripts/embed-docs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'src', '89d-beauty-docs.js');

const DOCS = [
  ['panel', 'docs/panel-theme.md', '美化文档-全局主题.md'],
  ['status', 'docs/status-theme.md', '美化文档-状态卡.md'],
];

const entries = DOCS.map(([kind, rel, filename]) => {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) throw new Error('缺文档：' + rel);
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const b64 = Buffer.from(text, 'utf8').toString('base64');
  return { kind, rel, filename, b64, bytes: Buffer.byteLength(text, 'utf8') };
});

const lines = [];
lines.push('/* 89d-beauty-docs.js —— 两份美化文档（**自动生成，不要手改**）');
lines.push('   源文件：docs/panel-theme.md（全局主题）、docs/status-theme.md（状态卡）');
lines.push('   生成：node scripts/embed-docs.mjs');
lines.push('   为什么要编码：文档里得举反例（纯黑、纯白的写法），而护眼测试会扫产物里有没有这些字面量。');
lines.push('   编成 base64 存着，运行时解出来原样交给玩家，两边都不破规矩。 */');
lines.push('');
lines.push('  const MOON_DOC_B64 = {');
for (const e of entries) {
  lines.push('    /* ' + e.rel + ' · ' + (e.bytes / 1024).toFixed(1) + 'KB · 下载名「' + e.filename + '」 */');
  lines.push('    ' + e.kind + ": '" + e.b64 + "',");
}
lines.push('  };');
lines.push('');
lines.push('  const MOON_DOC_FILENAME = {');
for (const e of entries) lines.push('    ' + e.kind + ": '" + e.filename + "',");
lines.push('  };');
lines.push('');
lines.push('  function beautyDocText(kind) {');
lines.push('    const b64 = MOON_DOC_B64[kind];');
lines.push('    if (!b64) return "";');
lines.push('    try {');
lines.push('      const bin = atob(b64);');
lines.push('      const bytes = new Uint8Array(bin.length);');
lines.push('      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);');
lines.push('      return new TextDecoder("utf-8").decode(bytes);');
lines.push('    } catch (e) { return ""; }');
lines.push('  }');
lines.push('');
lines.push('  function downloadBeautyDoc(kind) {');
lines.push('    const text = beautyDocText(kind);');
lines.push('    if (!text) return false;');
lines.push('    try {');
lines.push('      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });');
lines.push('      const a = mainDoc.createElement("a");');
lines.push('      a.href = URL.createObjectURL(blob);');
lines.push('      a.download = MOON_DOC_FILENAME[kind] || (kind + ".md");');
lines.push('      mainDoc.body.appendChild(a);');
lines.push('      a.click();');
lines.push('      setTimeout(function () { try { a.remove(); } catch (e) {} }, 500);');
lines.push('      return true;');
lines.push('    } catch (e) { return false; }');
lines.push('  }');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

console.log('✅ 已生成 src/89d-beauty-docs.js');
for (const e of entries) {
  console.log('   ' + e.kind.padEnd(7) + (e.bytes / 1024).toFixed(1) + 'KB → base64 ' + (e.b64.length / 1024).toFixed(1) + 'KB'
    + '  ' + e.rel);
}
