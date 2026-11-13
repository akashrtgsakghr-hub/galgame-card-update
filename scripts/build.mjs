#!/usr/bin/env node
/**
 * 构建：src/*.js → moon-phase.js → 酒馆助手导入 JSON
 *
 * 仓库里维护的是拆分后的源码（src/），玩家下载 / 自动更新用的仍是
 * 拼好的单文件 moon-phase.js。两者由本脚本保证一致，GitHub Actions 会自动跑。
 *
 * 用法：
 *   node scripts/build.mjs           生成（或更新）产物
 *   node scripts/build.mjs --check   只检查产物是否与 src/ 同步，不同步则退出码 1
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_SCRIPT = path.join(ROOT, 'moon-phase.js');
const OUT_JSON = path.join(ROOT, 'Galgame攻略系统-酒馆助手导入.json');

const CHECK_ONLY = process.argv.includes('--check');

function sha(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** 按文件名顺序拼接 src/；片段写入时补过一个换行，这里只裁掉那一个 */
function concatSrc() {
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.js')).sort();
  if (!files.length) throw new Error('src/ 下没有找到任何 .js 片段');
  const parts = files.map((f) => {
    // 即使 checkout 成了 CRLF（Windows 误配 core.autocrlf），也先归一成 LF 再拼，
    // 保证任何机器上的产物sha256 一致。
    const body = fs.readFileSync(path.join(SRC_DIR, f), 'utf8').replace(/\r\n/g, '\n');
    if (!body.trim()) throw new Error(`片段为空：${f}`);
    return body.replace(/\n$/, '');
  });
  return { text: parts.join('\n'), files };
}

/** 语法检查：写临时文件后交给 node --check，避免把坏脚本推上线 */
function syntaxCheck(code) {
  const tmp = path.join(ROOT, '.build-check.js');
  fs.writeFileSync(tmp, code, 'utf8');
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (e) {
    const msg = (e.stderr && e.stderr.toString()) || (e.stdout && e.stdout.toString()) || String(e);
    throw new Error('拼接后的脚本语法有误：\n' + msg);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

function extractVersion(code) {
  const m = code.match(/MOON_FORMULA_VERSION\s*=\s*'([^']+)'/);
  if (!m) throw new Error('没找到 MOON_FORMULA_VERSION');
  return m[1];
}

function extractChangelog(code) {
  /* 公告是多段字符串拼起来的（一段一行，方便改）。这里必须把整串拼接都收进来，
     只抓第一段的话，导入 JSON 的 info 会只剩标题一行——看着像「公告没了」。 */
  const m = code.match(/MOON_FORMULA_CHANGELOG\s*=\s*((?:"(?:\\.|[^"\\])*"\s*\+?\s*)+);/);
  if (!m) throw new Error('没找到 MOON_FORMULA_CHANGELOG');
  const parts = m[1].match(/"(?:\\.|[^"\\])*"/g) || [];
  if (!parts.length) throw new Error('MOON_FORMULA_CHANGELOG 里没有字符串字面量');
  try {
    return parts.map((p) => JSON.parse(p)).join('');
  } catch (e) {
    throw new Error('MOON_FORMULA_CHANGELOG 不是合法字符串字面量：' + e.message);
  }
}

/** 重建导入 JSON：只替换 content / info，其余字段（id / name / button 等）保持原样 */
function rebuildImportJson(code, info) {
  let base = {};
  if (fs.existsSync(OUT_JSON)) {
    base = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8').replace(/^﻿/, ''));
  }
  const uiNameMatch = String(code).match(/SYSTEM_UI_NAME\s*=\s*'([^']+)'/);
  const uiName = uiNameMatch ? uiNameMatch[1] : '';
  const out = Object.assign({}, base, {
    type: base.type || 'script',
    enabled: base.enabled !== false,
    name: uiName || base.name || 'Galgame攻略系统',
    id: base.id || 'e22f244b-70e1-448e-b24e-5a9b36c48484',
    content: code,
    info: info,
    button: base.button || { enabled: false, buttons: [] },
    data: base.data || {},
    export_with: (base.export_with && typeof base.export_with === 'object') ? base.export_with : { data: true, button: true },
  });
  // 统一 LF（与 .gitattributes 一致，避免 Windows/Linux 产物不一致）
  return JSON.stringify(out, null, 2) + '\n';
}

function main() {
  const { text, files } = concatSrc();
  syntaxCheck(text);

  const version = extractVersion(text);
  const info = extractChangelog(text);
  const jsonText = rebuildImportJson(text, info);

  const prevScript = fs.existsSync(OUT_SCRIPT) ? fs.readFileSync(OUT_SCRIPT, 'utf8') : '';
  const prevJson = fs.existsSync(OUT_JSON) ? fs.readFileSync(OUT_JSON, 'utf8') : '';

  const scriptChanged = prevScript !== text;
  const jsonChanged = prevJson !== jsonText;

  console.log(`片段 ${files.length} 个 → 单文件 ${text.split('\n').length} 行，${(Buffer.byteLength(text) / 1024).toFixed(0)}KB`);
  console.log(`版本 v${version}｜公告 ${String(info).split('\n').length} 行`);
  console.log(`moon-phase.js：${scriptChanged ? '有更新' : '无变化'}`);
  console.log(`导入 JSON：${jsonChanged ? '有更新' : '无变化'}`);
  console.log(`sha256 ${sha(text)}`);

  if (CHECK_ONLY) {
    if (scriptChanged || jsonChanged) {
      console.error('❌ 产物与 src/ 不同步，请运行 node scripts/build.mjs');
      process.exit(1);
    }
    console.log('✅ 产物与 src/ 同步');
    return;
  }

  fs.writeFileSync(OUT_SCRIPT, text, 'utf8');
  fs.writeFileSync(OUT_JSON, jsonText, 'utf8');

  // 回读校验，防止编码/换行把内容改坏
  const back = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
  if (back.content !== text) throw new Error('回读校验失败：导入 JSON 的 content 与拼接结果不一致');
  if (back.info !== info) throw new Error('回读校验失败：导入 JSON 的 info 与脚本公告不一致');
  console.log('✅ 已写入 moon-phase.js 与导入 JSON，回读校验一致');
}

main();
