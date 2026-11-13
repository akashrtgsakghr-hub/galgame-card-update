/* 89c-status-theme.js —— 楼内状态卡主题（moonstatus/1）
   ─────────────────────────────────────────────────────────────────────────────
   状态卡有五套皮肤（票根 / 藏书票 / 日报 / 邸报 / 少女心绪），每套自己一套变量前缀
   （--t-* / --paper-* / --mpp-* / --db-* / --cl-*）。玩家想自己调色，以前只能改脚本。

   这里做的是「语义层 → 各皮肤变量」的转接：玩家/AI 只写一层语义 token
   （l0..l3 四层底、ink/ink2/ink3 三级字、hair/hair2 发丝线、accent 强调），
   脚本按当前皮肤把它翻译成对应的变量名。所以同一份 JSON 换到另一套皮肤上也说得通。

   素材槽：只有少女心绪有（--cl-paper-art / --cl-nacre / --cl-cover-art 三个口子，
   本来就是给实拍图留的）。别的皮肤只换色，给了图会明确告诉你「这里没有素材槽」，
   不会悄悄吞掉。
   ───────────────────────────────────────────────────────────────────────────── */
  const STATUS_THEME_FORMAT = 'moonstatus/1';
  const STATUS_KEY_APPLIED = 'moon_status_theme_v1';
  const STATUS_KEY_LIB = 'moon_status_theme_lib_v1';
  const STATUS_STYLE_ID = 'moon-status-theme-style';

  const STATUS_DEFAULT_TOKENS = {
    l0: '#171316', l1: '#1E181C', l2: '#251E22', l3: '#100C0E',
    ink: '#F3EAEA', ink2: '#C9B6BA', ink3: '#B4A9AD',
    hair: 'rgba(243,234,234,.10)', hair2: 'rgba(243,234,234,.19)',
    accent: '#DFA9AE', accent2: '#DFA9AE',
    shadow: 'rgba(6,5,4,.82)'
  };

  /* 语义 token → 皮肤变量。alpha:true 的那几个目标变量本来就是半透明填充，
     直接塞实色会把整块糊住，所以按 alpha 转成 rgba 再写进去。 */
  const STATUS_SKIN_MAP = {
    calista: {
      label: '少女心绪', root: '.mp-skin-calista',
      vars: {
        l0: '--cl-bg-0', l1: '--cl-bg-1', l2: '--cl-bg-2', l3: '--cl-bg-3',
        ink: '--cl-ink', ink2: '--cl-ink-2', ink3: '--cl-ink-3',
        hair: '--cl-hair', hair2: '--cl-hair-2',
        accent: '--cl-accent', accent2: '--cl-accent-soft', shadow: '--cl-ambient'
      },
      alpha: { accent2: 0.18 },
      images: { paper: '--cl-paper-art', nacre: '--cl-nacre', cover: '--cl-cover-art' }
    },
    dibao: {
      label: '朱丝栏邸报', root: '.mp-skin-dibao',
      vars: {
        l0: '--db-l0', l1: '--db-l1', l2: '--db-l2', l3: '--db-l3',
        ink: '--db-fg', ink2: '--db-fg-soft',
        hair: '--db-hair', hair2: '--db-hair-strong',
        accent: '--db-seal', accent2: '--db-seal-soft', shadow: '--db-shadow'
      },
      alpha: { accent2: 0.18 },
      images: {}
    },
    prophet: {
      label: '预言家日报', root: '.mp-skin-prophet',
      vars: {
        l1: '--mpp-paper', l2: '--mpp-paper-2',
        ink: '--mpp-ink', ink2: '--mpp-ink-2', ink3: '--mpp-ink-3',
        hair: '--mpp-hair', hair2: '--mpp-rule',
        accent: '--mpp-seal', accent2: '--mpp-gold', shadow: '--mpp-shadow'
      },
      alpha: {},
      images: {}
    },
    book: {
      label: '月氏藏书票', root: '.mp-skin-book',
      vars: {
        l1: '--paper-bg', l2: '--paper-inner-bg',
        ink: '--ink-primary', ink2: '--ink-secondary', ink3: '--ink-poem-trans',
        hair: '--divider', hair2: '--frame-border',
        accent: '--ink-seal-bg', accent2: '--ink-seal-border', shadow: '--shadow-color'
      },
      alpha: {},
      images: {}
    },
    ticket: {
      label: '晨昏票根', root: '.tkt-container',
      vars: {
        l0: '--t-bg', ink: '--t-ink', ink2: '--t-dim',
        hair: '--t-border', hair2: '--t-grid',
        accent: '--t-accent-red', accent2: '--t-accent-stamp', shadow: '--t-ambient-shadow'
      },
      alpha: {},
      images: {}
    }
  };

  function statusThemeStore() {
    try { return getStorage(); } catch (e) { return null; }
  }

  function statusThemeResolveImg(src) {
    var s = String(src || '');
    if (s.indexOf('builtin:') === 0) {
      try {
        var key = s.slice(8);
        return (typeof MOON_TEX !== 'undefined' && MOON_TEX[key]) ? MOON_TEX[key] : '';
      } catch (e) { return ''; }
    }
    return s;
  }

  function normalizeStatusTheme(raw) {
    var errors = [], warns = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, theme: null, errors: ['这不是一个 JSON 对象'], warnings: [] };
    }
    if (String(raw.format || '') !== STATUS_THEME_FORMAT) {
      return {
        ok: false, theme: null, warnings: [],
        errors: ['format 必须是「' + STATUS_THEME_FORMAT + '」，收到的是「' + String(raw.format || '') + '」']
      };
    }
    var skin = String(raw.skin || 'any').toLowerCase();
    if (skin !== 'any' && !STATUS_SKIN_MAP[skin]) {
      warns.push('skin「' + skin + '」不认识，按 any 处理（五套都套一遍）');
      skin = 'any';
    }

    var src = raw.tokens && typeof raw.tokens === 'object' ? raw.tokens : {};
    var tokens = {};
    Object.keys(STATUS_DEFAULT_TOKENS).forEach(function (key) {
      var val = src[key];
      if (val === undefined || val === null || String(val).trim() === '') {
        tokens[key] = STATUS_DEFAULT_TOKENS[key];
        return;
      }
      var s = String(val).trim();
      if (!themeIsColor(s)) {
        errors.push('tokens.' + key + ' 不是合法颜色：「' + s + '」');
        tokens[key] = STATUS_DEFAULT_TOKENS[key];
        return;
      }
      if (themeIsPureBlack(s)) {
        var baseL = themeIsPureBlack(tokens.l0) ? STATUS_DEFAULT_TOKENS.l0 : tokens.l0;
        var fixed = themeTintBlack(s, baseL);
        warns.push('tokens.' + key + ' 是纯黑（违反铁律 1），已染成 ' + fixed);
        tokens[key] = fixed;
        return;
      }
      tokens[key] = s;
    });

    /* 卡面上的字，对比度按三档卡：主字 7:1、次字 4.5:1、弱字 3:1（底是 l2） */
    [['ink', 7, 7], ['ink2', 4.5, 6], ['ink3', 3, 4.5]].forEach(function (p) {
      var key = p[0], need = p[1], want = p[2];
      var now = themeContrast(tokens[key], tokens.l2);
      if (now >= want) return;
      var lifted = themeLiftTo(tokens[key], tokens.l2, want);
      var after = themeContrast(lifted, tokens.l2);
      if (after > now) {
        warns.push('tokens.' + key + ' 对卡面底色只有 ' + now.toFixed(1) + ':1，已抬到 ' + after.toFixed(1) + ':1');
        tokens[key] = lifted;
      }
      if (themeContrast(tokens[key], tokens.l2) < need) {
        errors.push('tokens.' + key + ' 抬不到 ' + need + ':1，这张卡上的字会看不清');
      }
    });

    /* 素材：只有少女心绪有槽 */
    var images = {};
    var imgRaw = raw.images && typeof raw.images === 'object' ? raw.images : {};
    var hasSlot = skin === 'any' || !!(STATUS_SKIN_MAP[skin] && Object.keys(STATUS_SKIN_MAP[skin].images).length);
    ['paper', 'nacre', 'cover'].forEach(function (slot) {
      if (!imgRaw[slot]) return;
      if (!hasSlot) {
        warns.push('images.' + slot + ' 被忽略：这套皮肤没有素材槽（只有少女心绪有）');
        return;
      }
      var one = themeNormalizeImage(imgRaw[slot], 'images.' + slot, errors, warns);
      if (one) images[slot] = one;
    });

    var night = null;
    if (raw.night && typeof raw.night === 'object') {
      night = {};
      Object.keys(STATUS_DEFAULT_TOKENS).forEach(function (key) {
        var val = raw.night[key];
        if (val === undefined) return;
        var s = String(val).trim();
        if (!themeIsColor(s)) { warns.push('night.' + key + ' 不是合法颜色，已忽略'); return; }
        if (themeIsPureBlack(s)) { s = themeTintBlack(s, tokens.l0); warns.push('night.' + key + ' 是纯黑，已染成 ' + s); }
        night[key] = s;
      });
      if (!Object.keys(night).length) night = null;
    }

    var name = String(raw.name || '').trim().slice(0, 24) || '未命名状态卡';
    var id = String(raw.id || '').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 40)
      || ('s-' + themeHash(name + JSON.stringify(tokens)).toString(36));

    return {
      ok: errors.length === 0,
      theme: {
        format: STATUS_THEME_FORMAT,
        id: id, name: name,
        author: String(raw.author || '').trim().slice(0, 24),
        desc: String(raw.desc || '').trim().slice(0, 120),
        skin: skin,
        tokens: tokens,
        night: night,
        images: images,
        importedAt: Date.now()
      },
      errors: errors,
      warnings: warns
    };
  }

  function statusVarBlock(map, tokens, alpha, images) {
    var decl = [];
    Object.keys(map.vars).forEach(function (role) {
      var value = tokens[role];
      if (!value) return;
      if (alpha && alpha[role]) value = themeRgba(value, alpha[role]);
      decl.push(map.vars[role] + ':' + value + ' !important');
    });
    if (images) {
      Object.keys(images).forEach(function (slot) {
        var img = images[slot];
        var varName = map.images[slot];
        if (!img || !varName) return;
        var data = statusThemeResolveImg(img.src);
        if (!data) return;
        decl.push(varName + ':url("' + data + '") !important');
      });
    }
    return decl.join(';');
  }

  /* 少女心绪是「实拍明信片」：正面是照片＋金属压印，颜色多半写死在皮肤里，不走变量。
     光改 --cl-* 只能换掉几块底，字和压印还是原来的灰。所以这一套要单独补针：
     纸面、背面、书签条、四个小字、英文压印，逐个按主题色重画。
     只在这张卡上生效，别的卡一行都不碰。 */
  function calistaSurfaceCss() {
    return [
      '.mp-skin-calista .cl-pc-front{background-color:var(--cl-bg-1) !important;color:var(--cl-ink) !important;'
        + 'box-shadow:inset 0 0 0 1px var(--cl-hair),0 14px 30px -20px var(--cl-ambient) !important;}',
      '.mp-skin-calista .cl-pc-back{background-color:var(--cl-bg-0) !important;color:var(--cl-ink) !important;}',
      '.mp-skin-calista .cl-fold{background-color:var(--cl-bg-0) !important;color:var(--cl-ink) !important;}',
      /* 四个角上的小字：原来各自写死了灰，统一压到次字色，阴影去掉（深底上白影会发光） */
      '.mp-skin-calista :is(.cl-pc-kicker,.cl-pc-en-sub,.cl-pc-num,.cl-pc-tap,.cl-pc-postmark em,.cl-pc-back-kicker,.cl-pc-hint){'
        + 'color:var(--cl-ink-2) !important;text-shadow:none !important;}',
      /* 英文名是「银箔压进贝母」：文字本身透明，靠背景渐变裁进字里。
         给它一条由主题三级字色拼的渐变，压印感留住，颜色跟着走。 */
      '.mp-skin-calista .cl-pc-en-main{background-image:linear-gradient(98deg,'
        + 'var(--cl-ink-3) 0%,var(--cl-ink-2) 18%,var(--cl-ink) 34%,var(--cl-ink-3) 50%,'
        + 'var(--cl-ink) 66%,var(--cl-ink-2) 82%,var(--cl-ink-3) 100%) !important;'
        + '-webkit-text-fill-color:transparent !important;text-shadow:none !important;'
        + 'filter:none !important;}'
    ].join('\n');
  }

  /* 这张卡的底图也是素材。主题没给图时，按主题的明暗自动挑同批素材的昼/夜版，
     不然「深色主题 + 浅色珠光纸」= 亮卡配亮字，整张看不见。 */
  function calistaImageFallbackCss(theme) {
    var dark = themeLum(theme.tokens.l2) < 0.22;
    var pick = dark
      ? { paper: 'paperNight', nacre: 'nacreNight', cover: 'coverNight' }
      : { paper: 'paperDay', nacre: 'nacreDay', cover: 'coverDay' };
    var decl = [];
    Object.keys(pick).forEach(function (slot) {
      if (theme.images && theme.images[slot]) return;   /* 主题自己给了图就用它的 */
      var src = '';
      try { src = (typeof MOON_TEX !== 'undefined' && MOON_TEX[pick[slot]]) || ''; } catch (e) { src = ''; }
      if (!src) return;
      var varName = STATUS_SKIN_MAP.calista.images[slot];
      decl.push(varName + ':url("' + src + '") !important');
    });
    return decl.length ? '.mp-skin-calista{' + decl.join(';') + '}' : '';
  }

  function statusThemeCss(theme) {
    var targets = theme.skin === 'any' ? Object.keys(STATUS_SKIN_MAP) : [theme.skin];
    var out = [];
    targets.forEach(function (id) {
      var map = STATUS_SKIN_MAP[id];
      if (!map) return;
      var lightDecl = statusVarBlock(map, theme.tokens, map.alpha, theme.images);
      if (!lightDecl) return;
      out.push(map.root + '{' + lightDecl + ';}');
      /* 内置皮肤自己有昼/夜两套变量，覆盖两层才不会「一翻夜就变回原色」 */
      out.push(map.root + '[data-theme="night"],' + map.root + '[data-mpp-theme="night"]{'
        + statusVarBlock(map, theme.night || theme.tokens, map.alpha, theme.images) + ';}');
      out.push(map.root + '[data-theme="day"],' + map.root + '[data-mpp-theme="day"]{'
        + lightDecl + ';}');
      if (id === 'calista') {
        out.push(calistaSurfaceCss());
        var fb = calistaImageFallbackCss(theme);
        if (fb) out.push(fb);
      }
    });
    return out.join('\n');
  }

  function statusThemeStyleEl() {
    var el = mainDoc.getElementById(STATUS_STYLE_ID);
    if (!el) {
      el = mainDoc.createElement('style');
      el.id = STATUS_STYLE_ID;
      (mainDoc.head || mainDoc.documentElement).appendChild(el);
    } else {
      var head = mainDoc.head || mainDoc.documentElement;
      if (head.lastChild !== el) head.appendChild(el);
    }
    return el;
  }

  function applyStatusTheme(input) {
    var res = normalizeStatusTheme(input);
    if (!res.theme) return res;
    statusThemeStyleEl().textContent = statusThemeCss(res.theme);
    try {
      var store = statusThemeStore();
      if (store) store.setItem(STATUS_KEY_APPLIED, JSON.stringify(res.theme));
    } catch (e) {}
    return res;
  }

  function clearStatusTheme() {
    var el = mainDoc.getElementById(STATUS_STYLE_ID);
    if (el) el.textContent = '';
    try {
      var store = statusThemeStore();
      if (store) store.removeItem(STATUS_KEY_APPLIED);
    } catch (e) {}
    return true;
  }

  function getAppliedStatusTheme() {
    try {
      var store = statusThemeStore();
      var raw = store ? store.getItem(STATUS_KEY_APPLIED) : null;
      if (!raw) return null;
      return normalizeStatusTheme(JSON.parse(raw)).theme;
    } catch (e) { return null; }
  }

  function getStatusThemeLibrary() {
    try {
      var store = statusThemeStore();
      var raw = store ? store.getItem(STATUS_KEY_LIB) : null;
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveStatusTheme(theme) {
    var lib = getStatusThemeLibrary().filter(function (x) { return x.id !== theme.id; });
    var copy = JSON.parse(JSON.stringify(theme));
    Object.keys(copy.images || {}).forEach(function (k) { if (copy.images[k]) delete copy.images[k].data; });
    lib.unshift(copy);
    while (lib.length > 12) lib.pop();
    try {
      var store = statusThemeStore();
      if (store) store.setItem(STATUS_KEY_LIB, JSON.stringify(lib));
    } catch (e) {}
    return lib;
  }

  function removeStatusTheme(id) {
    var lib = getStatusThemeLibrary().filter(function (x) { return x.id !== id; });
    try {
      var store = statusThemeStore();
      if (store) store.setItem(STATUS_KEY_LIB, JSON.stringify(lib));
    } catch (e) {}
    return lib;
  }

  function statusCardHtml(theme, current, isApplied) {
    var t = theme.tokens || {};
    var dots = ['l0', 'l1', 'l2', 'l3'].map(function (k) {
      return '<i style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + (t[k] || '#222')
        + ';border:1px solid rgba(255,255,255,.12)"></i>';
    }).join('');
    var acc = '<i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + (t.accent || '#999')
      + ';margin-left:4px"></i>';
    var skinLabel = theme.skin === 'any' ? '全部五套' : (STATUS_SKIN_MAP[theme.skin] || {}).label || theme.skin;
    var mismatch = theme.skin !== 'any' && current && theme.skin !== current;
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;margin-bottom:6px;'
      + 'border:1px solid ' + (isApplied ? 'var(--k-accent,rgba(244,114,208,.6))' : 'var(--k-line,rgba(148,163,184,.2))')
      + ';border-radius:8px">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font:600 12px/1.4 inherit">' + themeEsc(theme.name)
      + (isApplied ? ' <span style="color:var(--k-accent,#f472d0);font-size:10px">· 正在用</span>' : '') + '</div>'
      + '<div style="display:flex;align-items:center;gap:3px;margin-top:4px">' + dots + acc
      + '<span style="font-size:10px;opacity:.62;margin-left:4px">' + themeEsc(skinLabel)
      + (theme.images && Object.keys(theme.images).length ? ' · 带素材' : '') + '</span></div>'
      + (mismatch ? '<div style="font-size:10px;color:#e2857f;margin-top:3px">给「' + themeEsc(skinLabel) + '」做的，你现在用的是别的卡</div>' : '')
      + (theme.desc ? '<div style="font-size:10px;opacity:.62;margin-top:3px;line-height:1.5">' + themeEsc(theme.desc) + '</div>' : '')
      + '</div>'
      + '<button type="button" data-st-apply="' + themeEsc(theme.id) + '" style="padding:5px 10px;border-radius:7px;'
      + 'border:1px solid var(--k-line-2,rgba(244,114,208,.45));background:transparent;color:var(--k-fg,#eee);'
      + 'font:600 11px/1 inherit;cursor:pointer">用这个</button>'
      + (theme.builtin ? '' : '<button type="button" data-st-del="' + themeEsc(theme.id) + '" '
        + 'style="padding:5px 7px;border-radius:7px;border:1px solid var(--k-line,rgba(148,163,184,.25));'
        + 'background:transparent;color:var(--k-fg-3,#999);font:11px/1 inherit;cursor:pointer">删</button>')
      + '</div>';
  }

  function statusThemeListHtml(currentSkin, appliedId) {
    var lib = getStatusThemeLibrary();
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;margin-bottom:6px;border:1px solid '
      + (appliedId ? 'var(--k-line,rgba(148,163,184,.2))' : 'var(--k-accent,rgba(244,114,208,.6))')
      + ';border-radius:8px">'
      + '<div style="flex:1;font:600 12px/1.4 inherit">不换色 · 皮肤原样</div>'
      + '<button type="button" data-st-apply="__default" style="padding:5px 10px;border-radius:7px;'
      + 'border:1px solid var(--k-line-2,rgba(244,114,208,.45));background:transparent;color:var(--k-fg,#eee);'
      + 'font:600 11px/1 inherit;cursor:pointer">还原</button></div>'
      + '<div style="font:600 10.5px/1 inherit;letter-spacing:.08em;opacity:.6;margin:10px 0 6px">我导入的（' + lib.length + '）</div>'
      + (lib.length ? lib.map(function (raw) {
          var one = normalizeStatusTheme(raw).theme;
          if (!one) return '';
          return statusCardHtml(one, currentSkin, one.id === appliedId);
        }).join('')
        : '<div style="font-size:10.5px;opacity:.55;padding:4px 2px">还没有。把 AI 给的 JSON 粘到下面就能用。</div>');
  }

  function openStatusThemeDialog() {
    var currentSkin = (typeof getSkinId === 'function') ? getSkinId() : 'calista';
    if (currentSkin === 'none') currentSkin = '';
    var currentLabel = currentSkin ? ((STATUS_SKIN_MAP[currentSkin] || {}).label || currentSkin) : '没选状态卡';
    function appliedId() {
      var cur = getAppliedStatusTheme();
      return cur ? cur.id : '';
    }
    var html = ''
      + '<div style="font-size:11.5px;color:var(--k-fg-2,#94a3b8);line-height:1.7;margin-bottom:10px">'
      + '只换卡面的颜色，必要时换素材。<b>不动结构</b>：谁翻面、哪里折叠、字怎么排，全都照旧。'
      + '现在挂着的卡：<b style="color:var(--k-fg,#eee)">' + themeEsc(currentLabel) + '</b>'
      + (currentSkin ? '' : '（还没选卡，先在「外观与阅读」里挑一套）') + '</div>'
      + '<div id="st-list" style="max-height:200px;overflow:auto;padding-right:2px">'
      + statusThemeListHtml(currentSkin, appliedId()) + '</div>'
      + '<div style="margin-top:12px;border-top:1px solid var(--k-line,rgba(148,163,184,.18));padding-top:10px">'
      + '<div style="font:600 10.5px/1 inherit;letter-spacing:.08em;opacity:.6;margin-bottom:6px">导入状态卡主题</div>'
      + '<textarea id="st-in" spellcheck="false" placeholder=\'形如 {"format":"moonstatus/1", "skin":"calista", ...}\' '
      + 'style="' + THEME_DLG_CSS + 'min-height:64px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px"></textarea>'
      + '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">'
      + '<button type="button" id="st-import" style="flex:1;min-width:110px;padding:8px 12px;border-radius:8px;'
      + 'border:1px solid rgba(34,197,94,.55);background:rgba(5,46,22,.5);color:#dcfce7;font:600 11.5px/1 inherit;cursor:pointer">导入并应用</button>'
      + '<label style="padding:8px 12px;border-radius:8px;border:1px solid var(--k-line,rgba(148,163,184,.3));'
      + 'background:transparent;color:var(--k-fg-2,#cbd5e1);font:600 11.5px/1 inherit;cursor:pointer">选文件'
      + '<input type="file" id="st-file" accept=".json,application/json" style="display:none"></label>'
      + '<button type="button" id="st-doc" style="padding:8px 12px;border-radius:8px;'
      + 'border:1px solid rgba(56,189,248,.5);background:rgba(12,37,64,.45);color:#e0f2fe;font:600 11.5px/1 inherit;cursor:pointer">下载制作文档</button>'
      + '</div>'
      + '<div id="st-out" style="margin-top:8px;font-size:10.5px;line-height:1.65;color:var(--k-fg-3,#94a3b8);'
      + 'max-height:110px;overflow:auto;white-space:pre-wrap"></div>'
      + '</div>';

    showModalDialogCancelable('状态卡主题 · 局部美化', html, function () {}, function () {}, {
      confirmText: '关闭', cancelText: '',
      onOpen: function (mask) {
        var out = mask.querySelector('#st-out');
        var list = mask.querySelector('#st-list');
        function say(text) { if (out) out.textContent = text; }
        function renderList() { if (list) list.innerHTML = statusThemeListHtml(currentSkin, appliedId()); }

        mask.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button') : null;
          if (!btn) return;
          if (btn.getAttribute('data-st-apply') === '__default') {
            clearStatusTheme();
            renderList();
            try { toast('状态卡已还原'); } catch (e2) {}
            return;
          }
          var applyId = btn.getAttribute('data-st-apply');
          if (applyId) {
            var hit = getStatusThemeLibrary().map(function (raw) {
              return normalizeStatusTheme(raw).theme;
            }).filter(function (t) { return t && t.id === applyId; })[0];
            if (!hit) return;
            var res = applyStatusTheme(hit);
            renderList();
            try { toast('已换卡面：' + hit.name); } catch (e3) {}
            if (res.warnings && res.warnings.length) say(res.warnings.join('\n'));
            return;
          }
          var delId = btn.getAttribute('data-st-del');
          if (delId) {
            removeStatusTheme(delId);
            var cur = getAppliedStatusTheme();
            if (cur && cur.id === delId) clearStatusTheme();
            renderList();
            try { toast('已删除'); } catch (e4) {}
          }
        });

        mask.querySelector('#st-import').addEventListener('click', function () {
          var box = mask.querySelector('#st-in');
          var text = box ? box.value.trim() : '';
          if (!text) { say('先把 JSON 粘进来。'); return; }
          var obj = null;
          try { obj = JSON.parse(text); } catch (e) {
            var fence = String.fromCharCode(96, 96, 96);
            var cleaned = text.split(fence).join('').replace(/^\s*json\s*/i, '');
            var a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
            if (a >= 0 && b > a) { try { obj = JSON.parse(cleaned.slice(a, b + 1)); } catch (e2) {} }
          }
          if (!obj) { say('这不是合法 JSON。让 AI 只输出一个 JSON 对象。'); return; }
          var res = normalizeStatusTheme(obj);
          if (!res.theme) { say('导入失败：\n· ' + res.errors.join('\n· ')); return; }
          saveStatusTheme(res.theme);
          applyStatusTheme(res.theme);
          renderList();
          var lines = ['已导入并应用：' + res.theme.name];
          if (res.errors.length) lines.push('有问题（已尽量修）：\n· ' + res.errors.join('\n· '));
          if (res.warnings.length) lines.push('自动修正：\n· ' + res.warnings.join('\n· '));
          say(lines.join('\n'));
          try { toast('已导入：' + res.theme.name); } catch (e5) {}
        });

        mask.querySelector('#st-file').addEventListener('change', function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            var box = mask.querySelector('#st-in');
            if (box) box.value = String(reader.result || '');
            mask.querySelector('#st-import').click();
          };
          reader.readAsText(file, 'utf-8');
        });

        mask.querySelector('#st-doc').addEventListener('click', function () {
          var ok = false;
          try { ok = downloadBeautyDoc('status'); } catch (e) {}
          say(ok ? '文档已下载。整份丢给 AI，末尾加一句「我要 … 风格」。' : '下载失败，可以从仓库 docs/status-theme.md 取。');
        });
      }
    });
  }

  /* 面板入口：同样走委托，面板重建不影响 */
  try {
    mainDoc.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#moon-status-theme-open')) {
        e.preventDefault();
        openStatusThemeDialog();
      }
    });
  } catch (e) {}

  setTimeout(function () {
    try {
      var applied = getAppliedStatusTheme();
      if (applied) applyStatusTheme(applied);
    } catch (e) {}
  }, 2600);

  try {
    mainWin.MOON_STATUS_THEME = {
      format: STATUS_THEME_FORMAT,
      normalize: normalizeStatusTheme,
      apply: applyStatusTheme,
      clear: clearStatusTheme,
      current: getAppliedStatusTheme,
      library: getStatusThemeLibrary,
      open: openStatusThemeDialog,
      css: function (t) { return statusThemeCss(normalizeStatusTheme(t).theme); },
      skins: Object.keys(STATUS_SKIN_MAP)
    };
  } catch (e) {}
