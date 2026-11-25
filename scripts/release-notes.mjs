#!/usr/bin/env node
/**
 * GitHub Release 正文生成器
 *
 * 分工：
 *   更新公告（update.md）  —— 放在仓库里、面板里也能读，写给「已经装了的玩家」
 *   Release（docs/releases/<版本>.md） —— 发在 GitHub 上，写给「还没装 / 想换版本的人」
 *
 * 两者内容不同：Release 只从公告里抽几条最能说明「这一版值不值得换」的，
 * 再自动补上下载表、更新步骤、校验值 —— 这些东西公告里没有，只有 Release 需要。
 *
 * 用法：
 *   node scripts/release-notes.mjs 5.15.7           打印 Release 正文（含下载表与校验）
 *   node scripts/release-notes.mjs 5.15.7 --title   只打印标题
 *   node scripts/release-notes.mjs 5.15.7 --write   从 update.md 抽一份 docs/releases/5.15.7.md
 *   node scripts/release-notes.mjs 5.15.7 --write --force   覆盖已存在的文件
 *   node scripts/release-notes.mjs 5.15.7 --assets=/tmp/rel/5.15.7
 *                                                   下载表的体积 / 校验值从指定目录算
 *                                                   （发旧版本 Release 时，附件是从那个 tag
 *                                                    重新构建出来的，不等于当前工作区）
 *   --no-footer                                     不补下载表（--write 默认就不补）
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const NOTES_DIR = path.join(ROOT, 'docs', 'releases');
const UPDATE_MD = path.join(ROOT, 'update.md');

/* Release 里挂的四个附件：改版 / 原版各一对（导入 JSON + 单文件脚本） */
/* [本地文件名, 上传到 Release 后的名字, 说明]
   上传名必须是纯 ASCII：GitHub 的附件接口收到中文名会直接 500
   （v5.18.4 就是卡在这里；以前 gh 把名字转义成 Galgame.-.json 才勉强过）。 */
const ASSETS = [
  ['Galgame攻略系统-酒馆助手导入.json', 'Galgame-Assistant-Import.json', '**改版全量**：脚本 + 掌机（卡带机 / 金手指 / 小地图 / 导航）+ 主题包 + 美化文档。新装下这个。'],
  ['moon-phase.js', 'moon-phase.js', '改版的单文件脚本。已经装好的，只替换这一个文件就行。'],
  ['DokiDoki-原版-酒馆助手导入.json', 'DokiDoki-Base-Import.json', '原版：不含掌机、主题包、美化文档，只有攻略与状态卡那一套本体。'],
  ['moon-phase.base.js', 'moon-phase-base.js', '原版的单文件脚本。'],
];

const argv = process.argv.slice(2);
const version = argv.find((a) => /^\d+\.\d+\.\d+$/.test(a));
const flag = (name) => argv.includes(name);
const ASSET_ROOT = (argv.find((a) => a.startsWith('--assets=')) || '').slice('--assets='.length) || ROOT;

if (!version) {
  console.error('用法：node scripts/release-notes.mjs <版本号> [--title|--write [--force]] [--no-footer]');
  process.exit(2);
}

/* ── 1. 取正文：优先手写稿，其次从更新公告里抽 ── */
function sectionFromUpdate() {
  if (!fs.existsSync(UPDATE_MD)) return null;

  const lines = fs.readFileSync(UPDATE_MD, 'utf8').split(/\r?\n/);
  const head = lines.findIndex((l) => new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}\\s*$`).test(l));
  if (head < 0) return null;

  let end = lines.length;
  for (let i = head + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) { end = i; break; }
  }

  return lines.slice(head + 1, end).join('\n').trim();
}

let title = null;
let body = null;

const handwritten = path.join(NOTES_DIR, `${version}.md`);
if (fs.existsSync(handwritten)) {
  const raw = fs.readFileSync(handwritten, 'utf8').replace(/\r\n/g, '\n').trim();
  const firstLine = raw.split('\n')[0];
  const m = firstLine.match(/^#\s+(.+)$/);
  if (m) {
    title = m[1].trim();
    body = raw.split('\n').slice(1).join('\n').trim();
  } else {
    body = raw;
  }
}

if (!body) {
  const section = sectionFromUpdate();
  if (!section) {
    console.error(`找不到 ${version} 的更新公告小节，也没有 docs/releases/${version}.md。`);
    process.exit(1);
  }

  /* 公告首行是「📢【v5.15.7 掌机页补回新版：…】」，拿它当 Release 标题 */
  const lines = section.split('\n');
  const bugle = lines[0].match(/^📢【(.+?)】\s*$/);
  if (bugle) {
    const text = bugle[1].replace(new RegExp(`^v?${version.replace(/\./g, '\\.')}[\\s·:：-]*`), '');
    title = `v${version} · ${text}`;
    body = lines.slice(1).join('\n').trim();
  } else {
    title = `v${version}`;
    body = section;
  }
}

if (!title) title = `v${version}`;

if (flag('--title')) {
  process.stdout.write(title + '\n');
  process.exit(0);
}

/* ── 2. 手写稿模式：只落正文，不补表（表在发版时按真实体积算） ── */
if (flag('--write')) {
  fs.mkdirSync(NOTES_DIR, { recursive: true });
  if (fs.existsSync(handwritten) && !flag('--force')) {
    console.error(`${path.relative(ROOT, handwritten)} 已存在；要覆盖加 --force。`);
    process.exit(1);
  }
  fs.writeFileSync(handwritten, `# ${title}\n\n${body}\n`, 'utf8');
  console.log('已写入 ' + path.relative(ROOT, handwritten));
  process.exit(0);
}

/* ── 3. 下载表：体积与校验值按工作区里的实际文件算（发版前刚构建过） ── */
const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const rows = [];
const sums = [];
for (const [file, name, desc] of ASSETS) {
  const p = path.join(ASSET_ROOT, file);
  if (!fs.existsSync(p)) {
    rows.push(`| \`${name}\` | — | ${desc} |`);
    continue;
  }
  const buf = fs.statSync(p).size;
  rows.push(`| \`${name}\` | ${mb(buf)} | ${desc} |`);
  sums.push(`| \`${name}\` | \`${sha(p)}\` |`);
}

let footer = '';
if (!flag('--no-footer')) {
  footer = `

---

## 下载哪个

| 文件 | 大小 | 说明 |
| --- | --- | --- |
${rows.join('\n')}

## 怎么更新

1. 酒馆 → 扩展 → 安装扩展 → 导入上面的 JSON。同名会覆盖，**存档、世界书、角色卡都不动**。
2. 不想重装扩展的：把手里那个 \`moon-phase.js\` 整个替换成这次附件里的同名单文件即可。
3. 更新完打开面板 → 系统诊断室 → 系统自检，版本号应显示 \`v${version}\`。

## 校验

| 文件 | sha256 |
| --- | --- |
${sums.join('\n')}
`;
}

process.stdout.write(body.trim() + footer + '\n');
