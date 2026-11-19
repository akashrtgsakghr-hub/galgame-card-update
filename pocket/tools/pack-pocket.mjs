// 把 moon-pocket/index.html + 模拟器核心（按 pocket.04-emu.js 的 CORE_PICK，现在是 mGBA）打包进月相脚本的 <MOON_POCKET_EMBED> 区段。
// 幂等：重复跑只替换两个标记之间的内容。
// 用法：node tools/pack-pocket.mjs ../月相系统-v5.0.0.js
//
// 为什么把核心也嵌进去：嵌进酒馆后掌机跑在 srcdoc 的 sandbox iframe 里，那是 opaque origin，
// 没有相对路径、也没有同源来源，读不到 core/44gba.js。所以核心必须以字符串形式随页面下发。
// wasm 先 gzip 再 base64（mGBA 573KB → 约 176KB），运行时用 DecompressionStream 解回。
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const POCKET = path.join(ROOT, 'index.html');

/* 嵌哪个核心不能写死：页面里 CORE_PICK 已经切到 mGBA，这里要是还塞 44vba 的 wasm，
   页面照样跑旧的 —— 32MB 卡带「新游戏」死等那个坑会原样复现，而且日志里看不出来。
   所以从 pocket.04-emu.js 的 CORES 表里读当前选的哪套。 */
const EMU_SRC = path.join(ROOT, 'src', 'pocket.04-emu.js');
const emuSrc = fs.readFileSync(EMU_SRC, 'utf8');
const pick = (/var CORE_PICK = "(\w+)"/.exec(emuSrc) || [])[1] || 'vba';
/* 取 CORES 表里这一段（从「mgba: {」起到下一个同缩进的「}」），再逐个抠字段。
   不用一条大正则：这段跨行、字段顺序还会变，正则写死了下次改表就悄悄匹配不上。 */
const blockStart = emuSrc.search(new RegExp('(^|\\n)\\s*' + pick + '\\s*:\\s*\\{'));
if (blockStart < 0) throw new Error('pocket.04-emu.js 的 CORES 表里找不到核心：' + pick);
const blockEnd = emuSrc.indexOf('}', blockStart);
const block = emuSrc.slice(blockStart, blockEnd + 1);
const field = (key) => {
  const i = block.indexOf(key + ':');
  if (i < 0) return '';
  const a = block.indexOf('"', i), b = block.indexOf('"', a + 1);
  return (a >= 0 && b > a) ? block.slice(a + 1, b) : '';
};
const CORE_JS = path.join(ROOT, field('js'));
const CORE_WASM = path.join(ROOT, field('wasm'));
const CORE_NAME = field('name'), CORE_LICENSE = field('license');
if (!field('js') || !field('wasm')) throw new Error('CORES 表里 ' + pick + ' 缺 js / wasm 路径');
console.log('打包核心：' + pick + '（' + CORE_NAME + ' / ' + CORE_LICENSE + '）');
/* 默认写回插件的掌机分片（带 <MOON_POCKET_EMBED> 标记的那个文件）。
   以前默认指向根目录一个 v5.0.0 的旧产物，跑一次就把那个旧文件改花了。 */
const TARGET = process.argv[2] || path.resolve(ROOT, '..', 'src', '87-pocket-embed.js');

const OPEN = '// <MOON_POCKET_EMBED>';
const CLOSE = '// </MOON_POCKET_EMBED>';

/* ── 核心资源 ── */
if (!fs.existsSync(CORE_JS) || !fs.existsSync(CORE_WASM)) {
  throw new Error('缺少核心文件：core/44gba.js 与 core/44gba.wasm（GPL-3.0，见 core/README.md）');
}
const coreJs = fs.readFileSync(CORE_JS, 'utf8');
const wasm = fs.readFileSync(CORE_WASM);
// wasm 必须能编译，否则打进去也是个坏包
await WebAssembly.compile(wasm).catch((e) => { throw new Error('wasm 损坏：' + e.message); });
const wasmGz = zlib.gzipSync(wasm, { level: 9 });
const wasmB64 = wasmGz.toString('base64');

// 解回来必须和原文件逐字节一致，否则等于偷偷改坏了核心
const roundTrip = zlib.gunzipSync(Buffer.from(wasmB64, 'base64'));
if (!roundTrip.equals(wasm)) throw new Error('wasm gzip 往返不一致');

/* 把 JS 源码变成可安全内联的字符串：先 JSON 转义，再拆掉 </script> 字面量 */
const jsLiteral = JSON.stringify(coreJs).replace(/<\//g, '<\\/');

let html = fs.readFileSync(POCKET, 'utf8').replace(/\r\n/g, '\n');
if (!/<body[^>]*class="[^"]*is-embed/.test(html)) {
  html = html.replace('<body ', '<body class="is-embed" ');
}

// 核心资源必须在掌机主脚本之前就位
const coreBlock = `<script>
/* 内嵌核心资源（由 tools/pack-pocket.mjs 生成）：${path.basename(CORE_JS)} + ${path.basename(CORE_WASM)}（gzip+base64）
   许可：${CORE_NAME} / ${CORE_LICENSE}。此处仅为同机自用内联，不对外分发。
   换核心（pocket.04-emu.js 的 CORE_PICK）后必须重跑本脚本，否则页面带的是旧 wasm。 */
window.__MOON_CORE_JS__ = ${jsLiteral};
window.__MOON_CORE_WASM_B64__ = ${JSON.stringify(wasmB64)};
window.__MOON_CORE_WASM_GZ__ = true;
</script>
`;
if (!/__MOON_CORE_JS__\s*=/.test(html)) {
  // 必须用函数式替换：coreBlock 里的 Emscripten 代码含有大量 $xxx 标识符，
  // 直接当替换字符串传进去会被当成 $& / $1 这类特殊模式，把核心脚本改坏。
  html = html.replace(/(<body[^>]*>)/, (m) => m + '\n' + coreBlock);
}

const b64 = Buffer.from(html, 'utf8').toString('base64');

/* 自检 1：页面里嵌的核心 JS 必须还能被解析（Emscripten 代码里全是 $ 标识符，
   之前用字符串式 replace 插入时就被当成 $& 改坏过，表现为 "Unexpected identifier"）。 */
const jsMatch = /window\.__MOON_CORE_JS__ = (".*?");\nwindow\.__MOON_CORE_WASM_B64__/s.exec(html);
if (!jsMatch) throw new Error('自检失败：页面里找不到内嵌的核心脚本变量');
const parsedJs = JSON.parse(jsMatch[1].replace(/<\\\//g, '</'));
if (parsedJs !== coreJs) throw new Error('自检失败：内嵌核心脚本与源文件不一致');
new vm.Script(parsedJs, { filename: 'embedded-core.js' });     // 只编译不执行，语法错会抛

/* 自检 2：页面里的 wasm base64 解压后必须与源文件逐字节一致 */
const wasmMatch = /window\.__MOON_CORE_WASM_B64__ = "([^"]+)";/.exec(html);
if (!wasmMatch) throw new Error('自检失败：页面里找不到内嵌的 wasm');
if (!zlib.gunzipSync(Buffer.from(wasmMatch[1], 'base64')).equals(wasm)) {
  throw new Error('自检失败：页面内嵌 wasm 与源文件不一致');
}
console.log('自检：核心脚本可解析、wasm 逐字节一致');

let src = fs.readFileSync(TARGET, 'utf8').replace(/\r\n/g, '\n');
const i = src.indexOf(OPEN);
const j = src.indexOf(CLOSE);
if (i < 0 || j < 0 || j < i) throw new Error('目标文件里找不到 <MOON_POCKET_EMBED> 标记');

const body = `const MOON_POCKET_EMBED_B64 = '${b64}';\n  `;
src = src.slice(0, i + OPEN.length) + '\n  ' + body + src.slice(j);

const back = Buffer.from(b64, 'base64').toString('utf8');
if (back !== html) throw new Error('base64 往返不一致');

fs.writeFileSync(TARGET, src, 'utf8');
console.log(`页面：${path.basename(POCKET)} ${(html.length / 1024).toFixed(0)}KB（含核心）`);
console.log(`核心：js ${(coreJs.length / 1024).toFixed(0)}KB + wasm ${(wasm.length / 1024).toFixed(0)}KB → gzip ${(wasmGz.length / 1024).toFixed(0)}KB → base64 ${(wasmB64.length / 1024).toFixed(0)}KB`);
console.log(`写入：${path.basename(TARGET)}（现 ${(src.length / 1024).toFixed(0)}KB）`);
