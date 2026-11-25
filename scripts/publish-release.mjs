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

/* [本地文件名, 上传名]
   上传名必须是纯 ASCII：GitHub 的附件接口收到中文名会 500（v5.18.4 卡在这）。
   以前 gh 把中文名转义成 Galgame.-.json 才勉强能传，玩家看到的名字也就成了乱码。 */
const ASSETS = [
  ['Galgame攻略系统-酒馆助手导入.json', 'Galgame-Assistant-Import.json'],
  ['moon-phase.js', 'moon-phase.js'],
  ['DokiDoki-原版-酒馆助手导入.json', 'DokiDoki-Base-Import.json'],
  ['moon-phase.base.js', 'moon-phase-base.js'],
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
const noAssets = process.argv.includes('--no-assets');   // workflow 里交给 gh 传

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
if (assetsDir && !noAssets) {
  const current = await call('GET', api + '/releases/' + release.id + '/assets?per_page=100');
  const byName = {};
  (Array.isArray(current) ? current : []).forEach(function (a) { byName[a.name] = a; });

  /* 单个附件失败不整体退出：先把它记下来，剩下的继续传，
     全部走完再决定成败。GitHub 的资产存储偶尔 502（Error updating policy），
     一个传挂了就把整次发布废掉，下次还得从第一个重来。 */
  const failed = [];

  for (const [file, uploadName] of ASSETS) {
    const full = path.join(assetsDir, file);
    if (!fs.existsSync(full)) { console.log('  · 跳过（不存在）' + file); continue; }

    const size = fs.statSync(full).size;
    const exist = byName[uploadName];
    /* 已经传过且大小一致：跳过。重跑时不用把 3MB 再传一遍。 */
    if (exist && exist.size === size) {
      console.log('  · 已存在且大小一致，跳过 ' + uploadName);
      continue;
    }
    if (exist) {
      await call('DELETE', api + '/releases/assets/' + exist.id);
      console.log('  · 删掉旧附件 ' + uploadName);
    }

    const uploadUrl = String(release.upload_url).replace(/\{.*$/, '') +
      '?name=' + encodeURIComponent(uploadName);
    const buf = fs.readFileSync(full);
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (res.ok) { ok = true; break; }
      const data = await readBody(res);
      const detail = typeof data === 'string' ? data : JSON.stringify(data);
      console.error('✖ 上传失败 ' + uploadName + ' status=' + res.status + ' 第 ' + attempt + ' 次');
      console.error('  响应: ' + detail);
      if (attempt < 3) {
        const wait = attempt * 5;
        console.log('  · ' + wait + ' 秒后重试 ' + uploadName + '（' + res.status + '）');
        await new Promise(function (r) { setTimeout(r, wait * 1000); });
      } else {
        failed.push(uploadName + ' ' + res.status);
      }
    }
    if (ok) console.log('  · 已上传 ' + uploadName + '（' + (size / 1024 / 1024).toFixed(2) + ' MB）');
  }

  if (failed.length) {
    fail('有附件没传上去：' + failed.join(' | ') + '（Release 正文已更新，重跑 workflow 会补齐已存在的）');
  }
}

console.log('✅ ' + tag + ' 发布完成');
