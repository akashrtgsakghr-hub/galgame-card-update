#!/usr/bin/env node
/**
 * 从 docs/dungeon-seed.md 生成「副本库」世界书文件（8 个成品本）。
 *
 *   node scripts/gen-dungeon-book.mjs
 *
 * 为什么要有这一步：副本内容不进脚本（否则单文件从 2.6MB 涨到 3MB+，而且玩家没法改）。
 * 脚本只认「副本·」开头的世界书条目，所以这边把设计稿里的 yaml 转成条目正文，
 * 正文前半是脚本解析用的「等级/回合/胜利/失败」，后面是给 AI 看的设定。
 *
 * 加新本：在 dungeon-seed.md 里按同样的 `### 3.x X 级 · 名字（N 回合）` + yaml 写，
 * 重跑本脚本即可。标题里的「X 级」「N 回合」和小节号都要对得上。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SEED = path.join(ROOT, 'docs/dungeon-seed.md');
const OUT = path.join(ROOT, 'docs/releases/副本库-8本.json');

const md = fs.readFileSync(SEED, 'utf8');
const lines = md.split(/\r?\n/);

/* 小节标题：### 3.1 E 级 · 深夜便利店（12 回合，练手本） */
const HEAD = /^###\s+3\.\d+\s+([A-S])\s*级\s*[·・]\s*(.+?)（(\d+)\s*回合/;

const books = [];
let cur = null;
let inYaml = false;
let yaml = [];
let afterBlock = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const h = line.match(HEAD);
  if (h) {
    if (cur) books.push(finish(cur, yaml, afterBlock));
    cur = { grade: h[1], name: h[2].trim(), rounds: parseInt(h[3], 10) };
    yaml = [];
    afterBlock = [];
    inYaml = false;
    continue;
  }
  if (!cur) continue;
  if (/^```ya?ml\s*$/.test(line)) { inYaml = true; yaml = []; continue; }
  if (inYaml && /^```\s*$/.test(line)) { inYaml = false; continue; }
  if (inYaml) { yaml.push(line); continue; }
  /* yaml 之后的说明文字（氛围补充 / 为什么这个本好）也收进来，但截掉小标题 */
  if (!inYaml && yaml.length && line.trim() && !/^---\s*$/.test(line)) afterBlock.push(line.trim());
}
if (cur) books.push(finish(cur, yaml, afterBlock));

function finish(meta, yl, after) {
  const f = { entry: [], rules: [], acts: [] };
  let mode = null;
  for (const raw of yl) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || /^\[dungeon\]/.test(line)) continue;
    const kv = line.match(/^\s*([a-z_]+)\s*:\s*(.*)$/);
    if (kv) {
      const k = kv[1];
      const v = kv[2];
      if (k === 'entry') { mode = v.trim() === '|' || v.trim() === '' ? 'entry' : null; if (v && v.trim() !== '|') f.entry.push(v.trim()); continue; }
      if (k === 'rules') { mode = 'rules'; continue; }
      if (k === 'acts') { mode = v.trim() === '|' || v.trim() === '' ? 'acts' : null; if (v && v.trim() !== '|') f.acts.push(v.trim()); continue; }
      mode = null;
      if (k === 'difficulty') f.difficulty = v.trim();
      else if (k === 'genre') f.genre = v.trim();
      else if (k === 'rounds') f.rounds = parseInt(v, 10) || meta.rounds;
      else if (k === 'survive') f.survive = v.trim();
      else if (k === 'win') f.win = v.trim();
      else if (k === 'lose') f.lose = v.trim();
      else if (k === 'hidden') f.hidden = v.trim();
      else if (k === 'id') f.id = v.trim();
      continue;
    }
    if (mode === 'entry') { f.entry.push(line.trim()); continue; }
    if (mode === 'acts') { f.acts.push(line.trim()); continue; }
    if (mode === 'rules') {
      const r = line.match(/^\s*-\s*(.+)$/);
      if (r) f.rules.push(r[1].trim());
      continue;
    }
  }
  /* yaml 之后那段常混着作者注解。分段处理：
     粗体小标题若写的是「氛围」就保留它下面几行，写的是「为什么这个本好」就整段跳过。
     否则设计思路会被当成副本设定塞给 AI。 */
  const amb = [];
  let ambMode = null;
  for (const l of after) {
    const b = l.match(/^\*\*(.+?)\*\*/);
    if (b) { ambMode = /氛围|补充/.test(b[1]) ? 'keep' : 'skip'; continue; }
    if (ambMode === 'keep' && !/\[dungeon\]|^>/.test(l)) amb.push(l);
  }
  const ambience = amb.join('\n').slice(0, 240);
  return {
    id: f.id || ('dg_' + meta.name),
    name: meta.name,
    grade: f.difficulty || meta.grade,
    rounds: f.rounds || meta.rounds,
    survive: f.survive || '',
    genre: f.genre || '',
    win: f.win || '',
    lose: f.lose || '',
    entry: f.entry.join('\n').trim(),
    rules: f.rules,
    acts: f.acts.join('\n').trim(),
    hidden: f.hidden || '',
    ambience
  };
}

const MIN_ROUNDS = 20;   // 脚本侧的硬底线，这里先对齐，免得生成出来还要玩家改

/* ── 拼成世界书条目正文：前半脚本解析，后半给 AI ───────────── */
function contentOf(b) {
  const out = [];
  out.push('等级：' + b.grade);
  out.push('最少回合：' + Math.max(MIN_ROUNDS, b.rounds));
  if (b.survive) out.push('存活：' + b.survive);
  if (b.genre) out.push('类型：' + b.genre);
  out.push('胜利：' + (b.win || '撑到回合结束'));
  out.push('失败：' + (b.lose || '血量归零'));
  out.push('');
  if (b.entry) { out.push('【开场】'); out.push(b.entry); out.push(''); }
  if (b.acts) { out.push('【分幕】'); out.push(b.acts); out.push(''); }
  if (b.rules.length) {
    out.push('【规则】');
    /* 真假标记是这个玩法的核心：真规则违反才出事，假规则遵守才出事。
       没标的一律当「真」，那种本只能算普通剧情本。 */
    b.rules.forEach((r, i) => {
      const m = String(r).match(/^\s*[\[【]\s*(真|假)\s*[\]】]\s*(.+)$/);
      const flag = m ? m[1] : '真';
      const text = m ? m[2] : r;
      out.push((i + 1) + '. [' + flag + '] ' + text);
    });
    out.push('');
  }
  if (b.hidden) { out.push('【隐藏线索】'); out.push(b.hidden); out.push(''); }
  if (b.ambience) { out.push('【氛围】'); out.push(b.ambience); }
  return out.join('\n').trim();
}

/* ── SillyTavern 世界书导出格式（字段给全，缺的它也会补默认） ── */
const entries = {};
books.forEach((b, i) => {
  entries[String(i)] = {
    uid: i,
    key: ['副本·' + b.name, b.name],
    keysecondary: [],
    comment: '副本·' + b.name,
    content: contentOf(b),
    constant: false,
    selective: true,
    order: 100,
    position: 0,
    disable: false,
    addMemo: true,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: false,
    probability: 100,
    useProbability: true,
    depth: 4,
    group: '',
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    automationId: '',
    role: null,
    vectorized: false,
    sticky: null,
    cooldown: null,
    delay: null,
    displayIndex: i
  };
});

const out = { name: 'BT999 副本库（8 本）', entries };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

console.log('生成 ' + books.length + ' 个副本 → ' + path.relative(ROOT, OUT));
books.forEach(b => {
  const bad = [];
  if (!b.rounds) bad.push('回合');
  if (!b.win) bad.push('胜利');
  console.log('  ' + (bad.length ? '⚠ ' : '· ') + b.name + '（' + b.grade + ' 级 / ' + b.rounds + ' 回合 / 存活 ' + (b.survive || (b.rounds * 10) + ' 分') + '）' + (bad.length ? ' 缺：' + bad.join(',') : ''));
});
