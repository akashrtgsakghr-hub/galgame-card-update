// 掌机页的拼装工具：src/shell.html + src/pocket.*.css + src/pocket.*.js + src/guide.*.js → index.html
//
// 为什么拆这么碎：这页两千多行，样式、结构、逻辑、文案全挤一起，改一处要滚半天。
// 现在按「一个功能一片」切：
//
//   shell.html              结构：机身、屏幕、按键、各个屏内图层、攻略抽屉
//   pocket.00-base.css      配色令牌、报头、模式条、舞台
//   pocket.01-console.css   掌机机身：屏幕、十字键、AB、HUD
//   pocket.02-pages.css     规范区、弹层、世界书、美化抽屉、响应式、嵌入模式
//   pocket.03-cheat.css     金手指台
//   pocket.04-guide.css     攻略抽屉与分册条
//   pocket.05-map.css       小地图窗与妈妈的便条
//   pocket.00-base.js       工具函数、LS 存储
//   pocket.01-skin.js       皮肤引擎（配色派生、预设）
//   pocket.02-screen.js     屏内游戏位、卡带目录、屏内导航
//   pocket.03-cart.js       卡带头部解析、卡槽状态
//   pocket.04-emu.js        模拟器核心装载、帧循环、存档桥
//   pocket.05-worldbook.js  世界书生成与编辑
//   pocket.06-cheat.js      金手指台
//   pocket.07-ui.js         美化抽屉、电源按键、游戏位导入、对外 API、开机
//   pocket.08-map-core.js   小地图算法与状态机（纯像素，不碰 DOM，可在 node 里跑回归）
//   pocket.09-map-ui.js     小地图取帧、绘制、交互
//   guide.00-index.js       攻略分册索引（空数组）
//   guide.01..05-*.js       攻略五册的文案（纯数据，改句子只动这里）
//   guide.06-ui.js          攻略的渲染与交互
//
// 拼装顺序 = 文件名排序（pocket.* 在前，guide.* 在后：攻略要用 pocket 里的 $ / LS / esc）。
// 用法：
//   node tools/build-pocket.mjs           # 由 src/ 拼出 index.html
//   node tools/build-pocket.mjs --check   # 只校验 src/ 与 index.html 是否同步
//   node tools/build-pocket.mjs --stats   # 看各片行数
//   node tools/verify-map.mjs             # 小地图回归（合成帧，22 条）
//   node tools/probe-map-live.mjs         # 小地图真卡带联调（要本机 ROM）
//
// 没有 --split 了：反向拆要靠人工判断边界，容易切错。要改就改 src/，index.html 是产物。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');

const SHELL = path.join(SRC, 'shell.html');
const CSS_TAG = '<style>\n/*__POCKET_CSS__*/\n</style>';
const JS_TAG = '<script>\n/*__POCKET_JS__*/\n</script>';

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/* 每片都以一个换行结尾（编辑器友好），拼装时先把这个换行去掉，一进一出相抵 */
const readPart = (p) => read(p).replace(/\n$/, '');

const list = (re) => fs.readdirSync(SRC).filter((f) => re.test(f)).sort();

function assemble(shell, css, js) {
  /* 必须用函数式替换：css / js 里有大量 $& $1 这类字面量（jQuery 风格的 $、正则回填），
     当成替换字符串传进去会被 replace 当成特殊模式，把内容打坏。 */
  return shell.replace(CSS_TAG, () => '<style>\n' + css + '\n</style>')
              .replace(JS_TAG, () => '<script>\n' + js + '\n</script>');
}

/* 顺序很重要：pocket 的所有分片要排在 guide 前面，攻略脚本用到 pocket 里的 $ / LS / esc。 */
const cssParts = list(/^pocket\.\d+.*\.css$/);
const pocketParts = list(/^pocket\.\d+.*\.js$/);
const guideParts = list(/^guide\.\d+.*\.js$/);

if (!cssParts.length || !pocketParts.length || !guideParts.length) {
  throw new Error('src/ 里的分片不齐：css ' + cssParts.length + ' · pocket ' + pocketParts.length + ' · guide ' + guideParts.length);
}

const css = cssParts.map((f) => readPart(path.join(SRC, f))).join('\n\n');
const js = pocketParts.concat(guideParts).map((f) => readPart(path.join(SRC, f))).join('\n\n');
const built = assemble(readPart(SHELL), css, js);

const args = process.argv.slice(2);

if (args.includes('--stats')) {
  const rows = [['shell.html', read(SHELL)]]
    .concat(cssParts.map((f) => [f, read(path.join(SRC, f))]))
    .concat(pocketParts.map((f) => [f, read(path.join(SRC, f))]))
    .concat(guideParts.map((f) => [f, read(path.join(SRC, f))]));
  rows.forEach(([f, t]) => console.log(String(t.split('\n').length).padStart(5) + ' 行  ' + f));
  console.log(String(rows.reduce((n, [, t]) => n + t.split('\n').length, 0)).padStart(5) +
    ' 行  合计（拼装后 ' + (built.length / 1024).toFixed(0) + 'KB）');
  process.exit(0);
}

if (args.includes('--check')) {
  const cur = read(OUT);
  if (cur === built) {
    console.log(`✅ index.html 与 src/ 同步（${(built.length / 1024).toFixed(0)}KB · css ${cssParts.length} 片 · js ${pocketParts.length + guideParts.length} 片）`);
    process.exit(0);
  }
  let i = 0;
  while (i < cur.length && i < built.length && cur[i] === built[i]) i++;
  console.log(`❌ index.html 与 src/ 不同步：从第 ${built.slice(0, i).split('\n').length} 行开始不一样`);
  console.log('   产物：' + JSON.stringify(built.slice(i, i + 80)));
  console.log('   现状：' + JSON.stringify(cur.slice(i, i + 80)));
  process.exit(1);
}

fs.writeFileSync(OUT, built, 'utf8');
console.log(`✅ 已由 src/ 拼出 index.html（${(built.length / 1024).toFixed(0)}KB · css ${cssParts.length} 片 · js ${pocketParts.length + guideParts.length} 片）`);
