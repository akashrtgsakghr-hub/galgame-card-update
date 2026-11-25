#!/usr/bin/env node
/**
 * 发布 GitHub Release（不依赖 gh CLI）
 *
 *   node scripts/publish-release.mjs \
 *     --tag v5.18.4 --target <sha> --title "..." \
 *     --notes-file /tmp/rel/5.18.4.md --assets-dir /tmp/rel/5.18.4
 *
 * 为什么不用 gh：
 *   gh 失败时只在 stderr 给一行「HTTP 422」，看不出 GitHub 到底嫌什么；
 *   而这个脚本会把 status + 响应体原样打出来，并且拆成「建 Release」和「传附件」
 *   两步——哪一步挂了一眼能看出来。
 *
 * 幂等：同名 Release 已存在就 PATCH 正文，附件按名字覆盖（先删后传）。
 */
import fs from 'node:fs';
import path from 'node:path';

const ASSETS = [
  'Galgame攻略系统-酒馆助手导入.json',
  'moon-phase.js',
  'DokiDoki-原版-酒馆助手导入.json',
  'moon-phase.base.js',
];

function arg(name, fallback = '') {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return fallback;
  return process.argv[i + 1] || fallback;
}

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const repo = process.env.GITHUB_REPOSITORY || '';
const tag = arg('tag');
const target = arg('target');
const title = arg('title');
const notesFile = arg('notes-file');
const assetsDir = arg('assets-dir');

if (!token) die('缺少 GH_TOKEN / GITHUB_TOKEN');
if (!repo.includes('/')) die('缺少 GITHUB_REPOSITORY');
if (!tag) die('缺少 --tag');

const api = 'https://api.github.com/repos/' + repo;
const headers = {
  Authorization: 'Bearer ' + token,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'moon-pocket-release',
};

/* 错误同时写 stdout 的 ::error:: —— GitHub 的 job 日志要登录才能读，
   但 annotations 是公开的，出问题时不用让人去贴日志。 */
function fail(msg) {
  console.error('✖ ' + msg);
  console.log('::error::' + String(msg).replace(/[\r\n]+/g, ' ').slice(0, 900));
  process.exit(1);
}

function die(msg) { fail(msg); }

async function readBody(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

async function call(method, url, body) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const data = await readBody(res);
  if (!res.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    console.error('✖ ' + method + ' ' + url);
    console.error('  status: ' + res.status);
    console.error('  响应: ' + detail);
    fail('GitHub API ' + method + ' ' + url + ' → ' + res.status + ' ' + detail);
  }
  return data;
}

const notes = notesFile && fs.existsSync(notesFile) ? fs.readFileSync(notesFile, 'utf8') : '';

/* 1) 建 Release（或更新已有的） */
let release = null;
const existing = await fetch(api + '/releases/tags/' + encodeURIComponent(tag), { headers });
if (existing.ok) {
  release = await readBody(existing);
  console.log('· 已存在 Release ' + tag + '，更新正文');
  release = await call('PATCH', api + '/releases/' + release.id, { name: title, body: notes });
} else if (existing.status === 404) {
  const payload = { tag_name: tag, name: title, body: notes, draft: false, prerelease: false };
  /* 只在 tag 还不存在时带 target；tag 已存在却被传 target，GitHub 会直接 422 */
  const tagRef = await fetch(api + '/git/ref/tags/' + encodeURIComponent(tag), { headers });
  if (tagRef.status === 404 && target) payload.target_commitish = target;
  console.log('· 创建 Release ' + tag + (payload.target_commitish ? '（target ' + target.slice(0, 7) + '）' : '（复用已有 tag）'));
  release = await call('POST', api + '/releases', payload);
} else {
  const data = await readBody(existing);
  fail('查询 Release 失败 status=' + existing.status + ' ' +
    (typeof data === 'string' ? data : JSON.stringify(data)));
}

console.log('  → ' + release.html_url);

/* 2) 附件：同名先删再传（clobber） */
if (assetsDir) {
  const current = await call('GET', api + '/releases/' + release.id + '/assets?per_page=100');
  const byName = {};
  (Array.isArray(current) ? current : []).forEach(function (a) { byName[a.name] = a; });

  for (const file of ASSETS) {
    const full = path.join(assetsDir, file);
    if (!fs.existsSync(full)) { console.log('  · 跳过（不存在）' + file); continue; }
    if (byName[file]) {
      await call('DELETE', api + '/releases/assets/' + byName[file].id);
      console.log('  · 删掉旧附件 ' + file);
    }
    const uploadUrl = String(release.upload_url).replace(/\{.*$/, '') +
      '?name=' + encodeURIComponent(file);
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/octet-stream' },
      body: fs.readFileSync(full),
    });
    if (!res.ok) {
      const data = await readBody(res);
      const detail = typeof data === 'string' ? data : JSON.stringify(data);
      console.error('✖ 上传失败 ' + file + ' status=' + res.status);
      console.error('  响应: ' + detail);
      fail('上传附件 ' + file + ' → ' + res.status + ' ' + detail);
    }
    const size = fs.statSync(full).size;
    console.log('  · 已上传 ' + file + '（' + (size / 1024 / 1024).toFixed(2) + ' MB）');
  }
}

console.log('✅ ' + tag + ' 发布完成');
