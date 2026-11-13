/* 89b-theme-pack.js —— 全局主题包（moontheme/1）
   ─────────────────────────────────────────────────────────────────────────────
   做这件事的原因：以前「自制美化」只能吐 6 个颜色 + 一段 CSS，而 sanitizeCss 会把
   url() 一律抹成 none——也就是说**贴图根本进不来**。玩家手上那批实拍素材（珠光纸、
   丝缎、贝母）只能活在楼内状态卡里，换不到面板上。

   这一版把「主题包」做成一个能带素材的完整对象：
     · 四层底色 + 三级文字 + 强调双色 + 发丝线 + 阴影，全部是 token，不用玩家写 CSS
     · 素材走 data:image 内联，导入时校验体积与格式；也认 builtin:xxx 复用内置图
     · 额外声明只允许白名单属性，且只能写「面板本体」，管不到别人
     · 导入时现场验：对比度、四层明度差、纯黑、黑框，不合格就当场说清楚并自动抬到合格线

   它改的是颜色与材质，不改结构：增删按钮、挪位置、改文案这类事一件都做不了。
   ───────────────────────────────────────────────────────────────────────────── */
  const THEME_FORMAT = 'moontheme/1';
  const THEME_KEY_APPLIED = 'moon_theme_pack_v1';
  const THEME_KEY_LIB = 'moon_theme_lib_v1';
  const THEME_STYLE_ID = 'moon-theme-pack-style';

  const THEME_DEFAULT_TOKENS = {
    l0: '#141017', l1: '#191420', l2: '#1F1926', l3: '#26202E',
    fg: '#F2E9EE', fg2: '#C3B4BF', fg3: '#928490',
    accent: '#E39BBD', accent2: '#FFD3E6',
    line: 'rgba(230,200,218,.14)', line2: 'rgba(230,200,218,.30)',
    shadow: 'rgba(10,7,11,.72)',
    radius: 16
  };

  /* 允许写的额外声明：只放「面板本体」的外观，不给布局与交互留口子 */
  const THEME_CSS_PROPS = [
    'border-radius', 'box-shadow', 'backdrop-filter', '-webkit-backdrop-filter',
    'background-blend-mode', 'letter-spacing', 'font-family', 'text-shadow',
    'border-width', 'border-style', 'filter'
  ];
  const THEME_IMG_MAX = 320 * 1024;        /* 单张解码后上限 */
  const THEME_IMG_TOTAL_MAX = 900 * 1024;  /* 全部素材解码后上限 */

  function themeStore() {
    try { return getStorage(); } catch (e) { return null; }
  }

  /* ── 颜色工具 ─────────────────────────────────────────────── */

  function themeParseRgb(value) {
    var v = String(value == null ? '' : value).trim();
    var m = /^#([0-9a-f]{3,8})$/i.exec(v);
    if (m) {
      var h = m[1];
      if (h.length === 3 || h.length === 4) {
        return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
      }
      if (h.length === 6 || h.length === 8) {
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      return null;
    }
    var r = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(v);
    if (r) return [Number(r[1]), Number(r[2]), Number(r[3])];
    return null;
  }

  function themeHex(rgb) {
    function two(n) {
      var s = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return s.length < 2 ? '0' + s : s;
    }
    return '#' + two(rgb[0]) + two(rgb[1]) + two(rgb[2]);
  }

  function themeRgba(value, alpha) {
    var rgb = themeParseRgb(value);
    if (!rgb) return value;
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
  }

  function themeTriplet(value) {
    var rgb = themeParseRgb(value);
    if (!rgb) return '244, 114, 208';
    return rgb[0] + ', ' + rgb[1] + ', ' + rgb[2];
  }

  function themeLum(value) {
    var rgb = themeParseRgb(value);
    if (!rgb) return 0;
    var c = rgb.map(function (n) {
      var s = n / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function themeContrast(a, b) {
    var la = themeLum(a), lb = themeLum(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function themeIsColor(value) {
    var v = String(value == null ? '' : value).trim();
    if (!v) return false;
    if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;
    if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i.test(v)) return true;
    if (/^hsla?\(\s*[\d.]+\s*(?:deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i.test(v)) return true;
    return false;
  }

  /* 铁律一：不许纯黑。判据写成 #0{3} 这类模式，脚本里不出现那个字面量 */
  function themeIsPureBlack(value) {
    var v = String(value == null ? '' : value).trim();
    if (/^#0{3}$/i.test(v) || /^#0{6}$/i.test(v) || /^#0{8}$/i.test(v)) return true;
    var m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(v);
    if (m) return Number(m[1]) === 0 && Number(m[2]) === 0 && Number(m[3]) === 0;
    return false;
  }

  /* 纯黑不带色相，压在暗底上就是一块死洞。这里把它换成「最底层色 + 原透明度」，
     既守住铁律一，又不会把一套只错了一个值的主题整个打回去。 */
  function themeTintBlack(value, base) {
    var bg = themeParseRgb(base) ? base : '#141017';
    var v = String(value || '').trim();
    var m = /^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v);
    if (m) return themeRgba(bg, m[1] === undefined ? 1 : Number(m[1]));
    if (/^#0{3,8}$/i.test(v)) return bg;
    return v;
  }

  /* 对比度不够就往白/黑推到够——宁可自动修，也别让玩家导入一套看不清字的皮 */
  function themeLiftTo(fg, bg, target) {
    if (themeContrast(fg, bg) >= target) return fg;
    var base = themeParseRgb(fg);
    if (!base) return fg;
    var bgLum = themeLum(bg);
    var toward = bgLum < 0.35 ? [246, 241, 245] : [26, 20, 24];
    var best = fg;
    for (var step = 0; step <= 20; step++) {
      var k = step / 20;
      var mixed = [
        base[0] + (toward[0] - base[0]) * k,
        base[1] + (toward[1] - base[1]) * k,
        base[2] + (toward[2] - base[2]) * k
      ];
      best = themeHex(mixed);
      if (themeContrast(best, bg) >= target) return best;
    }
    return best;
  }

  /* ── 素材 ─────────────────────────────────────────────────── */

  function themeIsDataUrl(src) {
    return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(String(src || ''));
  }

  function themeDecodedBytes(src) {
    var s = String(src || '');
    var i = s.indexOf(',');
    if (i < 0) return 0;
    return Math.floor((s.length - i - 1) * 0.75);
  }

  function themeResolveSrc(src) {
    var s = String(src || '');
    if (s.indexOf('builtin:') === 0) {
      var key = s.slice(8);
      if (typeof MOON_TEX !== 'undefined' && MOON_TEX[key]) return MOON_TEX[key];
      return '';
    }
    return s;
  }

  /* 导出时把 builtin: 换成真图——发给别人的主题包不能依赖我们脚本里的内置图 */
  function themeInlineSrc(src) {
    return themeResolveSrc(src) || '';
  }

  function themeNormalizeImage(raw, label, errors, warns) {
    if (!raw) return null;
    if (typeof raw !== 'object') { warns.push(label + '：素材不是对象，已忽略'); return null; }
    var src = String(raw.src || '').trim();
    var resolved = themeResolveSrc(src);
    if (!resolved) {
      errors.push(label + '：src 不是 data:image/…;base64 也不是 builtin:xxx，已丢掉这张图');
      return null;
    }
    if (!themeIsDataUrl(resolved)) {
      errors.push(label + '：只认 data:image/(png|jpeg|webp);base64 内联图，不许外链');
      return null;
    }
    var bytes = themeDecodedBytes(resolved);
    if (bytes > THEME_IMG_MAX) {
      errors.push(label + '：图太大（' + (bytes / 1024).toFixed(0) + 'KB），单张上限 ' + (THEME_IMG_MAX / 1024) + 'KB');
      return null;
    }
    var blend = String(raw.blend || 'normal').toLowerCase();
    if (['normal', 'soft-light', 'overlay', 'screen', 'multiply', 'luminosity'].indexOf(blend) < 0) {
      warns.push(label + '：blend「' + blend + '」不认识，按 normal 处理');
      blend = 'normal';
    }
    var size = String(raw.size || 'cover').toLowerCase();
    if (['cover', 'contain', 'auto', '100% 100%'].indexOf(size) < 0) size = 'cover';
    var opacity = Number(raw.opacity);
    if (!isFinite(opacity)) opacity = 0.55;
    opacity = Math.max(0.05, Math.min(1, opacity));
    var position = String(raw.position || 'center').slice(0, 24);
    if (!/^[a-z% 0-9.-]+$/i.test(position)) position = 'center';
    return { src: src, data: resolved, bytes: bytes, blend: blend, size: size, opacity: opacity, position: position };
  }

  /* ── CSS 片段：只收白名单属性 ───────────────────────────────── */

  function themeSanitizeCss(css, warns) {
    var text = String(css || '');
    if (!text.trim()) return '';
    if (/@|url\s*\(|<|>|expression|javascript:/i.test(text)) {
      warns.push('额外 CSS 里有 @ / url( / 尖括号 / 表达式，这一整段没有收');
      return '';
    }
    var out = [];
    text.split(';').forEach(function (pair) {
      var i = pair.indexOf(':');
      if (i < 0) return;
      var prop = pair.slice(0, i).trim().toLowerCase();
      var val = pair.slice(i + 1).trim();
      if (!prop || !val) return;
      if (THEME_CSS_PROPS.indexOf(prop) < 0) { warns.push('额外 CSS 的「' + prop + '」不在白名单里，已跳过'); return; }
      if (val.length > 160) return;
      out.push(prop + ':' + val);
    });
    return out.join(';');
  }

  /* ── 归一化：把玩家/AI 给的东西变成本脚本能直接用的对象 ────────── */

  function normalizeTheme(raw) {
    var errors = [];
    var warns = [];

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, theme: null, errors: ['这不是一个 JSON 对象'], warnings: [] };
    }
    if (String(raw.format || '') !== THEME_FORMAT) {
      /* 格式不对就别硬塞默认值往下走——那等于把一份别的 JSON「假装」成一主题铺上去 */
      return {
        ok: false, theme: null, warnings: [],
        errors: ['format 必须是「' + THEME_FORMAT + '」，收到的是「' + String(raw.format || '') + '」']
      };
    }

    var t = raw.tokens && typeof raw.tokens === 'object' ? raw.tokens : {};
    var tokens = {};
    Object.keys(THEME_DEFAULT_TOKENS).forEach(function (key) {
      var val = t[key];
      if (key === 'radius') {
        var num = Number(val);
        tokens.radius = isFinite(num) ? Math.max(0, Math.min(24, num)) : THEME_DEFAULT_TOKENS.radius;
        return;
      }
      if (val === undefined || val === null || String(val).trim() === '') {
        tokens[key] = THEME_DEFAULT_TOKENS[key];
        return;
      }
      var s = String(val).trim();
      if (!themeIsColor(s)) {
        errors.push('tokens.' + key + ' 不是合法颜色：「' + s + '」');
        tokens[key] = THEME_DEFAULT_TOKENS[key];
        return;
      }
      if (themeIsPureBlack(s)) {
        var fixed = themeTintBlack(s, tokens.l0 && !themeIsPureBlack(tokens.l0) ? tokens.l0 : THEME_DEFAULT_TOKENS.l0);
        warns.push('tokens.' + key + ' 是纯黑（违反铁律 1），已染成 ' + fixed);
        tokens[key] = fixed;
        return;
      }
      tokens[key] = s;
    });

    /* 四层必须真的分层：明度单调递增、相邻差 1%~5% */
    var layers = ['l0', 'l1', 'l2', 'l3'];
    var lums = layers.map(function (k) { return themeLum(tokens[k]); });
    for (var i = 1; i < lums.length; i++) {
      var gap = (lums[i] - lums[i - 1]) * 100;
      if (gap <= 0) {
        warns.push('四层明度不是逐层变亮（' + layers[i - 1] + '→' + layers[i] + ' 差 ' + gap.toFixed(1) + '%），分层会糊在一起');
      } else if (gap > 5) {
        warns.push('四层明度差 ' + gap.toFixed(1) + '% 偏大（铁律 1 要求 1%~3%），层级会显得生硬');
      }
    }

    /* 文字对比度：不够就抬，抬不动就报错 */
    var pairs = [['fg', 7, 7], ['fg2', 4.5, 7], ['fg3', 3, 5]];
    pairs.forEach(function (p) {
      var key = p[0], need = p[1], want = p[2];
      var now = themeContrast(tokens[key], tokens.l2);
      if (now >= want) return;
      var lifted = themeLiftTo(tokens[key], tokens.l2, want);
      var after = themeContrast(lifted, tokens.l2);
      if (after > now) {
        warns.push('tokens.' + key + ' 对面板底色只有 ' + now.toFixed(1) + ':1，已抬到 ' + after.toFixed(1) + ':1（要求 ≥' + want + ':1）');
        tokens[key] = lifted;
      }
      if (themeContrast(tokens[key], tokens.l2) < need) {
        errors.push('tokens.' + key + ' 怎么抬都到不了 ' + need + ':1，这套配色在深底上看不清字，换一组底色');
      }
    });

    /* 素材 */
    var images = {};
    var imgRaw = raw.images && typeof raw.images === 'object' ? raw.images : {};
    ['panel', 'card', 'bar'].forEach(function (slot) {
      var img = themeNormalizeImage(imgRaw[slot], 'images.' + slot, errors, warns);
      if (img) images[slot] = img;
    });
    var total = Object.keys(images).reduce(function (n, k) { return n + images[k].bytes; }, 0);
    if (total > THEME_IMG_TOTAL_MAX) {
      errors.push('素材合计 ' + (total / 1024).toFixed(0) + 'KB，超过 ' + (THEME_IMG_TOTAL_MAX / 1024) + 'KB 上限');
    }

    var css = themeSanitizeCss(raw.css, warns);

    var name = String(raw.name || '').trim().slice(0, 24) || '未命名主题';
    var id = String(raw.id || '').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 40)
      || ('t-' + themeHash(name + JSON.stringify(tokens)).toString(36));

    var theme = {
      format: THEME_FORMAT,
      id: id,
      name: name,
      author: String(raw.author || '').trim().slice(0, 24),
      desc: String(raw.desc || '').trim().slice(0, 120),
      tokens: tokens,
      images: images,
      css: css,
      importedAt: Date.now()
    };

    return { ok: errors.length === 0, theme: theme, errors: errors, warnings: warns };
  }

  function themeHash(str) {
    var h = 5381, i = 0;
    for (; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h || 1;
  }

  /* ── 出 CSS ───────────────────────────────────────────────── */

  function themeCss(theme) {
    var t = theme.tokens;
    var imgPanel = theme.images.panel;
    var imgCard = theme.images.card;
    var imgBar = theme.images.bar;
    var out = [];

    /* 令牌：面板与弹窗共用一套 --k-*；:root 那套给沉浸层、卡片用 */
    /* 令牌必须带 !important：面板第一次打开时会把出厂那套样式表（#moon-pocket-ui）追加到
       <head> 末尾，跟我们撞在同一个位置、同一组选择器上。不带 !important 的话，谁后注入谁赢，
       于是换完皮过一会儿又自己变回粉色。 */
    function v(name, value) { return name + ':' + value + ' !important;'; }
    out.push('#moon-phase-panel,#moon-modal-mask,.mp-tour-layer{'
      + v('--k-ink-0', t.l0) + v('--k-ink-1', t.l1) + v('--k-ink-2', t.l2) + v('--k-ink-3', t.l3)
      + v('--k-fg', t.fg) + v('--k-fg-2', t.fg2) + v('--k-fg-3', t.fg3)
      + v('--k-line', t.line) + v('--k-line-2', t.line2)
      + v('--k-accent', t.accent) + v('--k-accent-2', t.accent2) + v('--k-accent-rgb', themeTriplet(t.accent))
      + v('--k-shadow', t.shadow) + v('--k-shadow-rgb', themeTriplet(t.shadow))
      /* 机身表面一套：85-style 里那些紫黑色块按明度分档挂在这几个名字上，
         默认取回退值（原色），换主题时才被改写。 */
      + v('--k-sur-0', t.l0) + v('--k-sur-1', t.l1) + v('--k-sur-2', t.l2) + v('--k-sur-3', t.l3)
      + v('--k-frame', t.line2) + '}');
    out.push(':root{'
      + v('--mp-l0', t.l0) + v('--mp-l1', t.l1) + v('--mp-l2', t.l2) + v('--mp-l3', t.l3)
      + v('--mp-fg', t.fg) + v('--mp-fg-soft', t.fg2) + v('--mp-fg-3', t.fg3)
      + v('--mp-hair', t.line) + v('--mp-hair-strong', t.line2)
      + v('--mp-accent', t.accent) + v('--mp-accent-2', t.accent2)
      + v('--mp-ink-shadow', t.shadow) + '}');

    /* 面板本体：素材在底下，压暗层在上面。压暗层用的是四层里的明暗，
       所以换素材不需要重新调文字——对比度是 token 决定的，不是图决定的。 */
    /* 压暗层跟 opacity 反着走：opacity 越高，压得越薄，图越清楚。
       下限 0.34 是为了留一条命——再薄，直接铺在面板上的标题就会开始糊。 */
    var op = imgPanel ? imgPanel.opacity : 0.5;
    var scrimA = Math.max(0.34, Math.min(0.92, 0.92 - 0.62 * op));
    var scrimB = Math.max(0.46, Math.min(0.95, 0.96 - 0.5 * op));
    var layers = ['linear-gradient(180deg,' + themeRgba(t.l1, scrimA.toFixed(2)) + ' 0%,'
      + themeRgba(t.l0, scrimB.toFixed(2)) + ' 100%)'];
    var sizes = ['auto'], positions = ['center'], blends = ['normal'], repeats = ['no-repeat'];
    if (imgPanel) {
      layers.push('url("' + imgPanel.data + '")');
      sizes.push(imgPanel.size);
      positions.push(imgPanel.position);
      blends.push(imgPanel.blend);
      repeats.push('no-repeat');
    }
    layers.push('linear-gradient(180deg,' + t.l2 + ' 0%,' + t.l0 + ' 100%)');
    sizes.push('auto'); positions.push('center'); blends.push('normal'); repeats.push('no-repeat');

    out.push('#moon-phase-panel{'
      + 'background-color:' + t.l0 + ' !important;'
      + 'background-image:' + layers.join(',') + ' !important;'
      + 'background-size:' + sizes.join(',') + ' !important;'
      + 'background-position:' + positions.join(',') + ' !important;'
      + 'background-repeat:' + repeats.join(',') + ' !important;'
      + 'background-blend-mode:' + blends.join(',') + ' !important;'
      + 'border:1px solid ' + t.line2 + ' !important;'
      + 'border-radius:' + t.radius + 'px !important;'
      + 'box-shadow:inset 0 1px 0 ' + themeRgba(t.fg, 0.06) + ',0 18px 44px ' + t.shadow + ' !important;'
      + (theme.css ? theme.css + ' !important;' : '')
      + '}');

    /* 输入域：聚焦禁描边，双环阴影里的那一环换成主题强调色 */
    out.push('#moon-phase-panel :is(input,textarea,select):focus,'
      + '#moon-modal-mask :is(input,textarea,select):focus{'
      + 'outline:none !important;'
      + 'border-color:' + t.line2 + ' !important;'
      + 'box-shadow:0 0 0 1px ' + themeRgba(t.accent, 0.42) + ',0 0 0 5px ' + themeRgba(t.shadow, 0.62)
      + ',inset 0 2px 6px ' + themeRgba(t.shadow, 0.5) + ' !important;}');

    /* 卡片 / 状态条：只有给了素材才动，否则交给 --mp-l2 / --k-ink-* 自己走 */
    if (imgPanel && !imgCard) {
      /* 卡片不额外给图时，把面板那张压到 8% 左右垫在卡片里。
         整块皮只在卡片缝隙里露出来的话，等于没换；但也只给这一点——再多就压字了。 */
      out.push('#moon-phase-panel .mp-card{'
        + 'background-image:linear-gradient(180deg,' + themeRgba(t.l1, 0.90) + ',' + themeRgba(t.l2, 0.93) + '),'
        + 'url("' + imgPanel.data + '") !important;'
        + 'background-size:auto,' + imgPanel.size + ' !important;'
        + 'background-position:center,' + imgPanel.position + ' !important;'
        + 'background-repeat:no-repeat !important;'
        + 'background-blend-mode:normal,soft-light !important;}');
    }
    if (imgCard) {
      out.push('#moon-phase-panel .mp-card{'
        + 'background-image:linear-gradient(180deg,' + themeRgba(t.l1, 0.72) + ',' + themeRgba(t.l2, 0.86) + '),'
        + 'url("' + imgCard.data + '") !important;'
        + 'background-size:auto,' + imgCard.size + ' !important;'
        + 'background-position:center,' + imgCard.position + ' !important;'
        + 'background-repeat:no-repeat !important;'
        + 'background-blend-mode:normal,' + imgCard.blend + ' !important;}');
    }
    if (imgBar) {
      out.push('#moon-phase-panel .mp-status{'
        + 'background-image:linear-gradient(180deg,' + themeRgba(t.l0, 0.78) + ',' + themeRgba(t.l0, 0.9) + '),'
        + 'url("' + imgBar.data + '") !important;'
        + 'background-size:auto,' + imgBar.size + ' !important;'
        + 'background-position:center,' + imgBar.position + ' !important;'
        + 'background-repeat:no-repeat !important;'
        + 'background-blend-mode:normal,' + imgBar.blend + ' !important;}');
    }

    return out.join('\n');
  }

  /* ── 应用 / 还原 ──────────────────────────────────────────── */

  function themeStyleEl() {
    var el = mainDoc.getElementById(THEME_STYLE_ID);
    if (!el) {
      el = mainDoc.createElement('style');
      el.id = THEME_STYLE_ID;
      (mainDoc.head || mainDoc.documentElement).appendChild(el);
    } else {
      /* 一直待在 <head> 末尾：掌机/街机那套样式表是后面才注入的，
         我们被甩到它前面就会被压掉，所以每次应用都重新挂一次。 */
      var head = mainDoc.head || mainDoc.documentElement;
      if (head.lastChild !== el) head.appendChild(el);
    }
    return el;
  }

  function applyTheme(input) {
    var res = normalizeTheme(input);
    if (!res.theme) return res;
    var el = themeStyleEl();
    el.textContent = themeCss(res.theme);
    try {
      var store = themeStore();
      if (store) store.setItem(THEME_KEY_APPLIED, JSON.stringify(stripThemeData(res.theme)));
    } catch (e) {}
    return res;
  }

  /* 存盘时把 data URL 留着（不然重开就丢素材），但把 builtin 解析后的副本去掉，避免存两遍 */
  function stripThemeData(theme) {
    var copy = JSON.parse(JSON.stringify(theme));
    Object.keys(copy.images || {}).forEach(function (k) {
      var img = copy.images[k];
      /* src 才是事实来源：data URL 存 src 里，builtin 引用存名字，解码后的 data 不落盘 */
      if (img) delete img.data;
    });
    return copy;
  }

  function clearTheme() {
    var el = mainDoc.getElementById(THEME_STYLE_ID);
    if (el) el.textContent = '';
    try {
      var store = themeStore();
      if (store) store.removeItem(THEME_KEY_APPLIED);
    } catch (e) {}
    return true;
  }

  function getAppliedTheme() {
    try {
      var store = themeStore();
      var raw = store ? store.getItem(THEME_KEY_APPLIED) : null;
      if (!raw) return null;
      var obj = JSON.parse(raw);
      return normalizeTheme(obj).theme;
    } catch (e) { return null; }
  }

  function getThemeLibrary() {
    try {
      var store = themeStore();
      var raw = store ? store.getItem(THEME_KEY_LIB) : null;
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveThemeToLibrary(theme) {
    var lib = getThemeLibrary().filter(function (x) { return x.id !== theme.id; });
    lib.unshift(stripThemeData(theme));
    while (lib.length > 12) lib.pop();
    try {
      var store = themeStore();
      if (store) store.setItem(THEME_KEY_LIB, JSON.stringify(lib));
    } catch (e) {}
    return lib;
  }

  function removeThemeFromLibrary(id) {
    var lib = getThemeLibrary().filter(function (x) { return x.id !== id; });
    try {
      var store = themeStore();
      if (store) store.setItem(THEME_KEY_LIB, JSON.stringify(lib));
    } catch (e) {}
    return lib;
  }

  /* ── 内置第一批（素材来自少女心绪那 6 张实拍） ────────────────── */

  function builtinThemes() {
    function tex(key) {
      try { return (typeof MOON_TEX !== 'undefined' && MOON_TEX[key]) ? MOON_TEX[key] : ''; } catch (e) { return ''; }
    }
    var list = [
      {
        format: THEME_FORMAT, id: 'nacre-night', name: '黑蝶贝 · 夜',
        author: '内置第一批', desc: '鲍鱼贝内壁当底，玫瑰粉只做点缀；夜里看它像一块压暗的珠母。',
        tokens: {
          l0: '#141017', l1: '#191420', l2: '#1F1926', l3: '#26202E',
          fg: '#F2E9EE', fg2: '#C3B4BF', fg3: '#958794',
          accent: '#E39BBD', accent2: '#FFD3E6',
          line: 'rgba(230,200,218,.13)', line2: 'rgba(230,200,218,.28)',
          shadow: 'rgba(10,7,11,.72)', radius: 16
        },
        images: { panel: { src: 'builtin:nacreNight', opacity: 0.62, blend: 'soft-light' } },
        css: ''
      },
      {
        format: THEME_FORMAT, id: 'satin-dusk', name: '缎光 · 暮',
        author: '内置第一批', desc: '压暗的丝缎横纹，琥珀色代替粉；比默认那套安静。',
        tokens: {
          l0: '#121114', l1: '#17161A', l2: '#1D1C21', l3: '#242329',
          fg: '#EFE9E4', fg2: '#C4BAB2', fg3: '#928982',
          accent: '#D9A06A', accent2: '#F3CD9E',
          line: 'rgba(233,222,210,.13)', line2: 'rgba(233,222,210,.28)',
          shadow: 'rgba(9,8,7,.74)', radius: 14
        },
        images: { panel: { src: 'builtin:paperNight', opacity: 0.5, blend: 'soft-light' } },
        css: ''
      },
      {
        format: THEME_FORMAT, id: 'pearl-mist', name: '珠贝 · 雾',
        author: '内置第一批', desc: '浅色珠光图压到 18% 当高光，冷灰紫的底；像雾天里的贝壳内壁。',
        tokens: {
          l0: '#131318', l1: '#18181E', l2: '#1E1E25', l3: '#25252D',
          fg: '#EDEAF0', fg2: '#BEBAC8', fg3: '#8B8798',
          accent: '#B7A7D6', accent2: '#DCCFF2',
          line: 'rgba(226,222,236,.13)', line2: 'rgba(226,222,236,.28)',
          shadow: 'rgba(8,8,11,.74)', radius: 18
        },
        images: { panel: { src: 'builtin:nacreDay', opacity: 0.18, blend: 'soft-light' } },
        css: ''
      }
    ];
    return list.map(function (raw) {
      var res = normalizeTheme(raw);
      /* 内置的图是 builtin: 引用，normalize 时会保留 src，这里补一份解码后的 data 供出 CSS */
      var theme = res.theme;
      Object.keys(theme.images).forEach(function (k) {
        var img = theme.images[k];
        if (String(img.src).indexOf('builtin:') === 0) img.data = tex(String(img.src).slice(8));
      });
      return theme;
    });
  }

  /* ── 导出成文件 ───────────────────────────────────────────── */

  function themeToPortable(theme) {
    var port = {
      format: THEME_FORMAT,
      id: theme.id,
      name: theme.name,
      author: theme.author || '',
      desc: theme.desc || '',
      tokens: theme.tokens,
      images: {},
      css: theme.css || ''
    };
    Object.keys(theme.images || {}).forEach(function (k) {
      var img = theme.images[k];
      if (!img) return;
      port.images[k] = {
        src: themeInlineSrc(img.src) || img.data,
        opacity: img.opacity, blend: img.blend, size: img.size, position: img.position
      };
    });
    return port;
  }

  function themeDownload(name, text) {
    try {
      var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      var a = mainDoc.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      mainDoc.body.appendChild(a);
      a.click();
      setTimeout(function () { try { a.remove(); } catch (e) {} }, 500);
      return true;
    } catch (e) { return false; }
  }

  /* ── 界面 ─────────────────────────────────────────────────── */

  const THEME_DLG_CSS = 'width:100%;box-sizing:border-box;padding:7px 9px;border-radius:8px;'
    + 'border:1px solid var(--k-line,rgba(148,163,184,.3));background:var(--k-ink-3,#151119);'
    + 'color:var(--k-fg,#eee);font:11.5px/1.6 inherit;';

  function themeCardHtml(theme, isCurrent) {
    var t = theme.tokens || {};
    var dots = ['l0', 'l1', 'l2', 'l3'].map(function (k) {
      return '<i style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + (t[k] || '#222')
        + ';border:1px solid rgba(255,255,255,.22)"></i>';
    }).join('');
    var acc = '<i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + (t.accent || '#999')
      + ';margin-left:4px"></i>';
    var imgTag = theme.images && theme.images.panel
      ? '<span style="opacity:.7">· 带素材</span>' : '';
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;margin-bottom:6px;'
      + 'border:1px solid ' + (isCurrent ? 'var(--k-accent,rgba(244,114,208,.6))' : 'var(--k-line,rgba(148,163,184,.2))')
      + ';border-radius:8px;background:' + (isCurrent ? 'var(--k-ink-3,#1b1522)' : 'transparent') + '">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font:600 12px/1.4 inherit;color:var(--k-fg,#eee)">' + themeEsc(theme.name)
      + (isCurrent ? ' <span style="color:var(--k-accent,#f472d0);font-size:10px">· 正在用</span>' : '') + '</div>'
      + '<div style="display:flex;align-items:center;gap:3px;margin-top:4px">' + dots + acc
      + '<span style="font-size:10px;opacity:.6;margin-left:4px">' + themeEsc(theme.author || '') + ' ' + imgTag + '</span></div>'
      + (theme.desc ? '<div style="font-size:10px;opacity:.62;margin-top:3px;line-height:1.5">' + themeEsc(theme.desc) + '</div>' : '')
      + '</div>'
      + '<button type="button" data-mt-apply="' + themeEsc(theme.id) + '" style="padding:5px 10px;border-radius:7px;'
      + 'border:1px solid var(--k-line-2,rgba(244,114,208,.45));background:transparent;color:var(--k-fg,#eee);'
      + 'font:600 11px/1 inherit;cursor:pointer">用这个</button>'
      + (theme.builtin ? '' : '<button type="button" data-mt-del="' + themeEsc(theme.id) + '" title="从我的主题里删掉" '
        + 'style="padding:5px 7px;border-radius:7px;border:1px solid var(--k-line,rgba(148,163,184,.25));'
        + 'background:transparent;color:var(--k-fg-3,#999);font:11px/1 inherit;cursor:pointer">删</button>')
      + '</div>';
  }

  function themeEsc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* 列表单独成函数：点「用这个」之后就地重画，不重开弹窗
     （重开会卡在弹窗队列里——上一个 mask 是被手动 remove 的，done 没被调用） */
  function themeListHtml(appliedId) {
    var builtins = builtinThemes();
    builtins.forEach(function (t) { t.builtin = true; });
    var lib = getThemeLibrary();
    return '<div style="font:600 10.5px/1 inherit;letter-spacing:.08em;opacity:.6;margin:2px 0 6px">默认</div>'
      + '<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;margin-bottom:6px;border:1px solid '
      + (appliedId ? 'var(--k-line,rgba(148,163,184,.2))' : 'var(--k-accent,rgba(244,114,208,.6))')
      + ';border-radius:8px">'
      + '<div style="flex:1;font:600 12px/1.4 inherit">像素皮 · 出厂设置</div>'
      + '<button type="button" data-mt-apply="__default" style="padding:5px 10px;border-radius:7px;'
      + 'border:1px solid var(--k-line-2,rgba(244,114,208,.45));background:transparent;color:var(--k-fg,#eee);'
      + 'font:600 11px/1 inherit;cursor:pointer">还原</button></div>'
      + '<div style="font:600 10.5px/1 inherit;letter-spacing:.08em;opacity:.6;margin:10px 0 6px">内置第一批</div>'
      + builtins.map(function (t) { return themeCardHtml(t, t.id === appliedId); }).join('')
      + '<div style="font:600 10.5px/1 inherit;letter-spacing:.08em;opacity:.6;margin:10px 0 6px">我导入的（'
      + lib.length + '）</div>'
      + (lib.length ? lib.map(function (raw) {
          var one = normalizeTheme(raw).theme;
          if (!one) return '';
          one.builtin = false;
          return themeCardHtml(one, one.id === appliedId);
        }).join('')
        : '<div style="font-size:10.5px;opacity:.55;padding:4px 2px">还没有。把 AI 给的 JSON 粘到下面就能用。</div>');
  }

  function openThemePackDialog() {
    function appliedId() {
      var cur = getAppliedTheme();
      return cur ? cur.id : '';
    }
    var html = ''
      + '<div style="font-size:11.5px;color:var(--k-fg-2,#94a3b8);line-height:1.7;margin-bottom:10px">'
      + '换的是<b>颜色与材质</b>：四层底色、三级文字、强调色、发丝线、素材。<b>不动布局与文案</b>。'
      + '素材内联在 JSON 里，不联网、不外链。</div>'
      + '<div id="mt-list" style="max-height:280px;overflow:auto;padding-right:2px">' + themeListHtml(appliedId()) + '</div>'
      + '<div style="margin-top:12px;border-top:1px solid var(--k-line,rgba(148,163,184,.18));padding-top:10px">'
      + '<div style="font:600 10.5px/1 inherit;letter-spacing:.08em;opacity:.6;margin-bottom:6px">导入主题包</div>'
      + '<textarea id="mt-in" spellcheck="false" placeholder=\'把 AI 给你的整段 JSON 粘进来，形如 {"format":"moontheme/1", ...}\' '
      + 'style="' + THEME_DLG_CSS + 'min-height:64px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px"></textarea>'
      + '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">'
      + '<button type="button" id="mt-import" style="flex:1;min-width:110px;padding:8px 12px;border-radius:8px;'
      + 'border:1px solid rgba(34,197,94,.55);background:rgba(5,46,22,.5);color:#dcfce7;font:600 11.5px/1 inherit;cursor:pointer">导入并应用</button>'
      + '<label style="padding:8px 12px;border-radius:8px;border:1px solid var(--k-line,rgba(148,163,184,.3));'
      + 'background:transparent;color:var(--k-fg-2,#cbd5e1);font:600 11.5px/1 inherit;cursor:pointer">选文件'
      + '<input type="file" id="mt-file" accept=".json,application/json" style="display:none"></label>'
      + '<button type="button" id="mt-doc" style="padding:8px 12px;border-radius:8px;'
      + 'border:1px solid rgba(56,189,248,.5);background:rgba(12,37,64,.45);color:#e0f2fe;font:600 11.5px/1 inherit;cursor:pointer">下载制作文档</button>'
      + '</div>'
      + '<div id="mt-out" style="margin-top:8px;font-size:10.5px;line-height:1.65;color:var(--k-fg-3,#94a3b8);'
      + 'max-height:110px;overflow:auto;white-space:pre-wrap"></div>'
      + '</div>';

    showModalDialogCancelable('主题包 · 全局美化', html, function () {}, function () {}, {
      confirmText: '关闭', cancelText: '',
      onOpen: function (mask) {
        var out = mask.querySelector('#mt-out');
        var list = mask.querySelector('#mt-list');
        function say(text) { if (out) out.textContent = text; }
        function renderList() { if (list) list.innerHTML = themeListHtml(appliedId()); }

        mask.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button') : null;
          if (!btn) return;

          if (btn.getAttribute('data-mt-apply') === '__default') {
            clearTheme();
            renderList();
            try { toast('已还原成出厂像素皮'); } catch (e2) {}
            return;
          }
          var applyId = btn.getAttribute('data-mt-apply');
          if (applyId) {
            var all = builtinThemes();
            all.forEach(function (t) { t.builtin = true; });
            getThemeLibrary().forEach(function (raw) {
              var one = normalizeTheme(raw).theme;
              if (one) all.push(one);
            });
            var hit = all.filter(function (t) { return t.id === applyId; })[0];
            if (!hit) return;
            var res = applyTheme(hit);
            renderList();
            try { toast('已换皮：' + hit.name + (res.warnings && res.warnings.length ? '（' + res.warnings.length + ' 条提醒）' : '')); } catch (e3) {}
            return;
          }
          var delId = btn.getAttribute('data-mt-del');
          if (delId) {
            removeThemeFromLibrary(delId);
            var cur = getAppliedTheme();
            if (cur && cur.id === delId) clearTheme();
            renderList();
            try { toast('已删除'); } catch (e4) {}
          }
        });

        mask.querySelector('#mt-import').addEventListener('click', function () {
          var box = mask.querySelector('#mt-in');
          var text = box ? box.value.trim() : '';
          if (!text) { say('先把 JSON 粘进来。'); return; }
          var obj = null;
          try { obj = JSON.parse(text); } catch (e) {
            /* 常见情况：AI 把 JSON 包在围栏里，或者前后带了解释文字 */
            var fence = String.fromCharCode(96, 96, 96);
            var cleaned = text.split(fence).join('');
            cleaned = cleaned.replace(/^\s*json\s*/i, '');
            var a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
            if (a >= 0 && b > a) { try { obj = JSON.parse(cleaned.slice(a, b + 1)); } catch (e2) {} }
          }
          if (!obj) { say('这不是合法 JSON。让 AI 只输出一个 JSON 对象，不要解释、不要代码围栏。'); return; }
          var res = normalizeTheme(obj);
          if (!res.theme) { say('导入失败：\n· ' + res.errors.join('\n· ')); return; }
          saveThemeToLibrary(res.theme);
          applyTheme(res.theme);
          renderList();
          var lines = ['已导入并应用：' + res.theme.name];
          if (res.errors.length) lines.push('有问题（已尽量修）：\n· ' + res.errors.join('\n· '));
          if (res.warnings.length) lines.push('自动修正：\n· ' + res.warnings.join('\n· '));
          say(lines.join('\n'));
          try { toast('已导入：' + res.theme.name); } catch (e5) {}
        });

        mask.querySelector('#mt-file').addEventListener('change', function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            var box = mask.querySelector('#mt-in');
            if (box) box.value = String(reader.result || '');
            mask.querySelector('#mt-import').click();
          };
          reader.readAsText(file, 'utf-8');
        });

        mask.querySelector('#mt-doc').addEventListener('click', function () {
          var ok = false;
          try { ok = downloadBeautyDoc('panel'); } catch (e) {}
          say(ok ? '文档已下载。把它整份丢给 AI，末尾加一句「我要 … 风格」。' : '下载失败，可以从仓库 docs/panel-theme.md 取。');
        });
      }
    });
  }

  /* 面板入口：委托挂在 mainDoc 上。面板每次打开都会重建，直接绑按钮必然丢。 */
  try {
    mainDoc.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#moon-theme-open')) {
        e.preventDefault();
        openThemePackDialog();
      }
    });
  } catch (e) {}

  /* 开机把上次用的皮铺回去。放 2.4s 是因为掌机/街机那套样式表在 2s 后才注入，
     晚一步挂上去才不会被它压掉。 */
  setTimeout(function () {
    try {
      var applied = getAppliedTheme();
      if (applied) applyTheme(applied);
    } catch (e) {}
  }, 2400);

  /* 给面板按钮、测试与外部脚本用 */
  try {
    mainWin.MOON_THEME = {
      format: THEME_FORMAT,
      normalize: normalizeTheme,
      apply: applyTheme,
      clear: clearTheme,
      current: getAppliedTheme,
      library: getThemeLibrary,
      builtins: builtinThemes,
      css: function (theme) { return themeCss(normalizeTheme(theme).theme); },
      open: openThemePackDialog,
      toPortable: themeToPortable,
      contrast: themeContrast,
      isPureBlack: themeIsPureBlack
    };
  } catch (e) {}
