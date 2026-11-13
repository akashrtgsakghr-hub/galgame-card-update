// 掌机页的拆装工具：src/shell.html + src/pocket.css + src/pocket.js + src/guide.js ⇄ index.html
//
// 为什么拆：整页两千多行，样式、结构、逻辑挤在一起，改一处要滚半天。
// 拆成四份后：改外观只动 pocket.css，改行为只动 pocket.js，改结构动 shell.html，
// 改攻略文案只动 guide.js（它是纯数据，玩家最常提意见的也是这块）；
// 四份都不含对方的噪音，diff 也看得清。
//
// 用法：
//   node tools/build-pocket.mjs            由 src/ 拼出 index.html（日常用这个）
//   node tools/build-pocket.mjs --check    只校验 index.html 是否与 src/ 同步（CI 用）
//   node tools/build-pocket.mjs --split    把现有 index.html 反向拆成 src/（只在迁移时用一次）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'src');
const SHELL = path.join(SRC, 'shell.html');
const CSS = path.join(SRC, 'pocket.css');
const JS = path.join(SRC, 'pocket.js');
const GUIDE = path.join(SRC, 'guide.js');
const OUT = path.join(ROOT, 'index.html');

const CSS_TAG = '<style>\n/*__POCKET_CSS__*/\n</style>';
const JS_TAG = '<script>\n/*__POCKET_JS__*/\n</script>';

/* guide.js 与 pocket.js 同处一个 <script>，用换行 + 它的头注释当分界。
   分界串只在 guide.js 开头出现一次，切回去时按它切，逐字节可逆。 */
const GUIDE_MARK = '\n\n/* ═══ 攻略数据';
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/* 三个片段都以一个换行结尾（编辑器友好），拼装时先把这个换行去掉，一进一出相抵 */
const readPart = (p) => read(p).replace(/\n$/, '');

function extract(html) {
  const h = html.replace(/\r\n/g, '\n');
  const s = h.indexOf('<style>');
  const se = h.indexOf('</style>', s);
  const j = h.indexOf('<script>');
  const je = h.indexOf('</script>', j);
  if (s < 0 || se < 0 || j < 0 || je < 0) throw new Error('页面里找不到 <style> / <script> 块');
  const css = h.slice(s + 7, se).replace(/^\n/, '').replace(/\n$/, '');
  const jsAll = h.slice(j + 8, je).replace(/^\n/, '').replace(/\n$/, '');
  const gi = jsAll.indexOf(GUIDE_MARK);
  if (gi < 0) throw new Error('页面里的脚本找不到 guide.js 的分界（' + GUIDE_MARK.trim() + '），先确认 guide.js 还在');
  const js = jsAll.slice(0, gi);
  const guide = jsAll.slice(gi + 2);
  const shell = h.slice(0, s) + CSS_TAG + h.slice(se + 8, j) + JS_TAG + h.slice(je + 9);
  return { css, js, guide, shell };
}

function assemble(shell, css, js) {
  if (!shell.includes(CSS_TAG) || !shell.includes(JS_TAG)) throw new Error('shell.html 里缺少占位标记');
  /* 必须用函数式替换：css / js 里有大量 $& $1 这类字面量（jQuery 风格的 $、正则回填），
     当成替换字符串传进去会被 replace 当成特殊模式，把内容打坏。 */
  return shell.replace(CSS_TAG, () => '<style>\n' + css + '\n</style>')
              .replace(JS_TAG, () => '<script>\n' + js + '\n</script>');
}

/* 两个脚本片段拼成一个 <script>：主逻辑在前，攻略在后（攻略要用 $ / LS / esc） */
const joinJs = () => readPart(JS) + '\n\n' + readPart(GUIDE);

const args = process.argv.slice(2);

if (args.includes('--split')) {
  const cur = read(OUT);
  const { css, js, guide, shell } = extract(cur);
  fs.mkdirSync(SRC, { recursive: true });
  fs.writeFileSync(SHELL, shell + '\n', 'utf8');
  fs.writeFileSync(CSS, css + '\n', 'utf8');
  fs.writeFileSync(JS, js + '\n', 'utf8');
  fs.writeFileSync(GUIDE, guide + '\n', 'utf8');
  // 立刻回拼，确认拆装无损
  const back = assemble(readPart(SHELL), readPart(CSS), joinJs());
  if (back !== cur) throw new Error('拆开再拼回去和原文件不一致，已中止（src/ 不要用）');
  console.log(`✅ 已拆分：shell.html ${shell.split('\n').length} 行 · pocket.css ${css.split('\n').length} 行 · pocket.js ${js.split('\n').length} 行 · guide.js ${guide.split('\n').length} 行（回拼逐字节一致）`);
  process.exit(0);
}

const built = assemble(readPart(SHELL), readPart(CSS), joinJs());
const cur = read(OUT);

if (args.includes('--check')) {
  if (built !== cur) {
    const a = built.split('\n'), b = cur.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    console.error(`❌ index.html 与 src/ 不同步（第 ${i + 1} 行）`);
    console.error('   拼: ' + JSON.stringify((a[i] || '').slice(0, 100)));
    console.error('   现: ' + JSON.stringify((b[i] || '').slice(0, 100)));
    process.exit(1);
  }
  console.log('✅ index.html 与 src/ 同步');
  process.exit(0);
}

if (built === cur) {
  console.log(`index.html 无变化（${(cur.length / 1024).toFixed(0)}KB）`);
} else {
  fs.writeFileSync(OUT, built, 'utf8');
  console.log(`✅ 已由 src/ 拼出 index.html（${(built.length / 1024).toFixed(0)}KB · css ${readPart(CSS).split('\n').length} 行 · js ${readPart(JS).split('\n').length} 行 · guide ${readPart(GUIDE).split('\n').length} 行）`);
}
