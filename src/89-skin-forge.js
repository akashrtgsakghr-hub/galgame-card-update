/* 89-skin-forge.js —— 自制美化（Skin Forge）
   玩家描述想要的风格 → 内置提示词 → 调用可单独配置的 API → 生成一套安全 CSS
   只改配色/材质/字体族，不改结构，不写脚本，不联网加载资源。
   也支持：把整套东西导出成一份 Markdown 文档，拿去外部做；做好再贴回来。 */
(function () {
  var CFG_KEY = 'moon_forge_cfg_v1';
  var STYLE_ID = 'moon-forge-style';
  var FENCE = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
  var DEFAULT_CFG = { apiUrl: 'http://127.0.0.1:1234/v1/chat/completions', apiKey: '', model: '', temperature: 0.7 };

  function loadCfg() {
    try { var raw = localStorage.getItem(CFG_KEY); if (raw) return Object.assign({}, DEFAULT_CFG, JSON.parse(raw)); } catch (e) {}
    return Object.assign({}, DEFAULT_CFG);
  }
  function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }

  var SCHEMA = [
    '输出一个 JSON 对象，不要别的文字：',
    '{',
    '  "name": "这套皮肤的名字（4-8 字）",',
    '  "accent": "#RRGGBB 主强调色",',
    '  "accent2": "#RRGGBB 次强调/高光色",',
    '  "ink0": "#RRGGBB 最底层背景",',
    '  "ink1": "#RRGGBB 面板背景",',
    '  "fg": "#RRGGBB 主文字（必须和 ink0 对比度 >= 7:1）",',
    '  "line": "rgba(r,g,b,0.18) 细线颜色",',
    '  "texture": "一句话描述材质倾向（不要写代码）",',
    '  "css": "一段最多 40 行的 CSS，只允许 background / color / border / box-shadow / border-radius / backdrop-filter / font-family，禁止 @import、url(、position:fixed、display:none、脚本"',
    '}'
  ].join('\n');

  function buildPrompt(desc) {
    var sys = '你是游戏 UI 皮肤生成器。根据玩家描述，输出一套深色主题的配色与材质 token。硬性要求：文字与背景对比度 >= 7:1；只用颜色/材质/字体，不改变布局；不引入外部资源；不写脚本。';
    var user = '玩家想要的风格：' + String(desc || '').trim() + '\n\n' + SCHEMA;
    return { system: sys, user: user };
  }

  function sanitizeCss(css) {
    var s = String(css || '');
    s = s.replace(/@import[^;]*;/gi, '').replace(/url\s*\([^)]*\)/gi, 'none')
         .replace(/<\/?script[^>]*>/gi, '').replace(/expression\s*\(/gi, '').replace(/javascript:/gi, '');
    return s;
  }

  function applyForgedSkin(o) {
    try {
      var doc = (typeof mainDoc !== 'undefined' && mainDoc) ? mainDoc : document;
      var el = doc.getElementById(STYLE_ID);
      if (!el) { el = doc.createElement('style'); el.id = STYLE_ID; (doc.head || doc.documentElement).appendChild(el); }
      var vars = [];
      if (o.ink0) vars.push('--mp-ink-0:' + o.ink0);
      if (o.ink1) vars.push('--mp-ink-1:' + o.ink1);
      if (o.accent) vars.push('--mp-accent:' + o.accent);
      if (o.accent2) vars.push('--mp-accent-2:' + o.accent2);
      if (o.fg) vars.push('--mp-fg:' + o.fg);
      if (o.line) vars.push('--mp-line:' + o.line);
      var css = ':root{' + vars.join(';') + '}'
        + '#moon-phase-panel{background:linear-gradient(170deg,' + (o.ink1 || '#141021') + ',' + (o.ink0 || '#0a0509') + ')!important;}'
        + '#moon-phase-panel .mp-card{border-color:' + (o.line || 'rgba(244,114,208,.18)') + '!important;}'
        + '#moon-phase-panel .mp-card-title{color:' + (o.accent2 || o.accent || '#ffb3e8') + '!important;}'
        + (o.css ? sanitizeCss(o.css) : '');
      el.textContent = css;
      try { localStorage.setItem('moon_forge_last', JSON.stringify(o)); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }

  function forgeDocText(o, desc) {
    return ['# ' + SYSTEM_MENU_NAME + ' · 自制美化文档', '',
      '- 皮肤名：' + (o.name || '(未命名)'),
      '- 玩家描述：' + (desc || ''),
      '- 生成时间：' + new Date().toLocaleString(), '',
      '## 色板', '| 用途 | 变量 | 值 |', '| --- | --- | --- |',
      '| 主强调 | --mp-accent | ' + (o.accent || '') + ' |',
      '| 次强调 | --mp-accent-2 | ' + (o.accent2 || '') + ' |',
      '| 底 | --mp-ink-0 | ' + (o.ink0 || '') + ' |',
      '| 面板 | --mp-ink-1 | ' + (o.ink1 || '') + ' |',
      '| 文字 | --mp-fg | ' + (o.fg || '') + ' |',
      '| 细线 | --mp-line | ' + (o.line || '') + ' |', '',
      '## 材质倾向', o.texture || '', '',
      '## 生成用的提示词', FENCE, buildPrompt(desc).system, '', buildPrompt(desc).user, FENCE, '',
      '## 额外 CSS', FENCE + 'css', sanitizeCss(o.css || ''), FENCE, '',
      '## 怎么用',
      '1. 在' + SYSTEM_MENU_NAME + ' → 外观与阅读 → 自制美化，把这段 JSON 存下来；',
      '2. 或把上面的 CSS 手动放进酒馆的自定义 CSS 里；',
      '3. 想继续改，把这份文档丢给任意模型，让它按同一份 schema 再调。'
    ].join('\n');
  }

  function downloadText(name, text) {
    try {
      var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
      return true;
    } catch (e) { return false; }
  }

  function openSkinForgeDialog() {
    var cfg = loadCfg();
    var html = ''
      + '<div style="font-size:11.5px;color:#94a3b8;line-height:1.7;margin-bottom:10px;">描述你想要的风格，模型会生成一套配色与材质（只改颜色/材质/字体，不改布局、不加载外部资源）。</div>'
      + '<textarea id="moon-forge-desc" placeholder="例：灰蓝雾霭、旧胶片颗粒、像雨夜的老式胶带机；标题要冷一点，别粉" style="width:100%;box-sizing:border-box;min-height:88px;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:12px;font-family:inherit;"></textarea>'
      + '<div style="margin-top:10px;font-size:11px;color:#94a3b8;">API（可单独配置，不影响酒馆主 API）</div>'
      + '<input id="moon-forge-url" value="' + (cfg.apiUrl || '') + '" placeholder="https://.../v1/chat/completions" style="width:100%;box-sizing:border-box;margin-top:4px;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
      + '<div style="display:flex;gap:6px;margin-top:6px;">'
      + '<input id="moon-forge-key" value="' + (cfg.apiKey || '') + '" placeholder="API Key（留空不用）" style="flex:1;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
      + '<input id="moon-forge-model" value="' + (cfg.model || '') + '" placeholder="模型名" style="width:38%;padding:7px 9px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#171a22;color:#e2e8f0;font-size:11px;">'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button id="moon-forge-run" style="padding:8px 14px;border-radius:9px;border:1px solid rgba(34,197,94,.6);background:#052e16;color:#dcfce7;font-size:12px;cursor:pointer;">生成皮肤</button>'
      + '<button id="moon-forge-export" style="padding:8px 14px;border-radius:9px;border:1px solid rgba(56,189,248,.6);background:#0c2540;color:#e0f2fe;font-size:12px;cursor:pointer;">导出美化文档</button>'
      + '<button id="moon-forge-reset" style="padding:8px 14px;border-radius:9px;border:1px solid rgba(148,163,184,.35);background:#171a22;color:#cbd5e1;font-size:12px;cursor:pointer;">还原默认</button>'
      + '</div>'
      + '<pre id="moon-forge-out" style="margin-top:10px;max-height:180px;overflow:auto;font-size:10.5px;color:#94a3b8;background:#0a0509;border:1px solid rgba(244,114,208,.18);border-radius:8px;padding:8px;white-space:pre-wrap;"></pre>';

    showModalDialogCancelable('自制美化', html, function () {}, function () {},
      { confirmText: '关闭', cancelText: '', onOpen: function (mask) {
        var out = mask.querySelector('#moon-forge-out');
        var desc = mask.querySelector('#moon-forge-desc');
        var urlEl = mask.querySelector('#moon-forge-url');
        var keyEl = mask.querySelector('#moon-forge-key');
        var modelEl = mask.querySelector('#moon-forge-model');
        function persist() { saveCfg({ apiUrl: urlEl.value.trim() || DEFAULT_CFG.apiUrl, apiKey: keyEl.value.trim(), model: modelEl.value.trim(), temperature: 0.7 }); }
        mask.querySelector('#moon-forge-run').addEventListener('click', async function () {
          persist();
          out.textContent = '生成中…';
          try {
            var o = await forgeSkin(desc.value);
            out.textContent = JSON.stringify(o, null, 1);
            applyForgedSkin(o);
            try { toast('皮肤已应用：' + (o.name || ''), 'success'); } catch (e) {}
          } catch (e) { out.textContent = '失败：' + (e && e.message || e); }
        });
        mask.querySelector('#moon-forge-export').addEventListener('click', function () {
          var last = null;
          try { last = JSON.parse(localStorage.getItem('moon_forge_last') || 'null'); } catch (e) {}
          if (!last) last = { name: '(模板)', accent: '#f472d0', accent2: '#ffb3e8', ink0: '#0a0509', ink1: '#141021', fg: '#f2e7ef', line: 'rgba(244,114,208,.18)', texture: '（未生成）', css: '' };
          var ok = downloadText('月相-自制美化-' + (last.name || 'skin') + '.md', forgeDocText(last, desc.value));
          out.textContent = ok ? '文档已下载。可以在外部照着改，改完把 JSON 贴回来生成。' : '下载失败，可复制上面的 JSON 手动保存。';
        });
        mask.querySelector('#moon-forge-reset').addEventListener('click', function () {
          try { var el = (typeof mainDoc !== 'undefined' && mainDoc ? mainDoc : document).getElementById(STYLE_ID); if (el) el.textContent = ''; } catch (e) {}
          try { localStorage.removeItem('moon_forge_last'); } catch (e) {}
          out.textContent = '已还原默认风格。';
        });
      } });
  }

  try {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.id === 'moon-forge-open') { e.preventDefault(); openSkinForgeDialog(); }
    });
  } catch (e) {}

  try { window.openSkinForgeDialog = openSkinForgeDialog; } catch (e) {}
  try { if (typeof mainWin !== 'undefined' && mainWin) mainWin.openSkinForgeDialog = openSkinForgeDialog; } catch (e) {}
})();
