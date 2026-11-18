// 用 node 写版本号与公告，避免手工转义出错
// 用法：node scripts/set-version.mjs 5.15.8 moon/tools/changelog.txt
//   （公告文本给一个 txt，每行一段，第一行是标题）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const target = process.argv[2];
const file = process.argv[3] ? path.resolve(process.argv[3]) : '';
if (!target) { console.error('缺少版本号'); process.exit(1); }
if (!file || !fs.existsSync(file)) { console.error('缺少公告文件（或路径不存在）：' + file); process.exit(1); }

const headPath = path.join(ROOT, 'src', '00-head.js');
let s = fs.readFileSync(headPath, 'utf8');

const verRe = /const MOON_FORMULA_VERSION = '[^']*';/;
if (!verRe.test(s)) { console.error('找不到版本行'); process.exit(1); }
s = s.replace(verRe, "const MOON_FORMULA_VERSION = '" + target + "';");

const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\n+$/, '').split('\n');
/* 公告在源码里是「一行一段 + 加号」拼起来的（方便改某一句时 diff 干净）。
   每段末尾要带 \n，否则拼出来是挤成一行的；最后一段不带，免得尾巴多个空行。 */
const literal = lines.map((l, i) => (i ? '    ' : '') + JSON.stringify(i < lines.length - 1 ? l + '\n' : l)).join(' +\n');
/* 别把正则写成只认单段：5.x 之后公告是多段拼接，旧写法会一直报「找不到公告行」。 */
const clRe = /const MOON_FORMULA_CHANGELOG =\s*(?:"(?:\\.|[^"\\])*"\s*\+?\s*)+;/;
if (!clRe.test(s)) { console.error('找不到公告行'); process.exit(1); }
s = s.replace(clRe, 'const MOON_FORMULA_CHANGELOG = ' + literal + ';');

fs.writeFileSync(headPath, s, 'utf8');
console.log('版本 → ' + target + '｜公告 ' + lines.length + ' 行');
