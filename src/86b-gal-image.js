/* 86b-gal-image.js —— 图片适配层。
   四种模式：builtin（月相内置生图）/ external（第三方插件接管）/ manual（只用手动素材）/ off（纯文字）。
   铁律：external / manual / off 下，月相自己的生图入口必须直接拒绝，不能"偷偷调用"。 */

  let _galBuiltinImageToken = 0;

  /* ── 互斥闸门 ─────────────────────────────────────────── */
  function galImageGenerationAllowed() {
    const mode = galGetImageMode();
    if (mode === 'builtin') return { allowed: true, mode: mode };
    const label = { external: '第三方插件接管', manual: '手动素材模式', off: '纯文字模式' }[mode] || mode;
    return {
      allowed: false,
      mode: mode,
      reason: '当前图片模式是「' + label + '」，月相不再发起任何生图请求。'
    };
  }
  /* 生图前调用；不允许就抛错，由调用方 catch 后提示，绝不静默降级 */
  function galAssertImageGenerationAllowed() {
    const gate = galImageGenerationAllowed();
    if (!gate.allowed) {
      const err = new Error(gate.reason);
      err.code = 'GAL_IMG_MODE_BLOCKED';
      throw err;
    }
  }
  /* 切换模式时立刻作废所有在途请求 */
  function galAbortBuiltinImageToken() {
    _galBuiltinImageToken++;
    return _galBuiltinImageToken;
  }
  function galAbortBuiltinImageTasks() {
    galAbortBuiltinImageToken();
    try { closeLoadingDialog(); } catch (e) {}
  }
  function galImageTaskToken() { return _galBuiltinImageToken; }
  function galImageTaskStillValid(token) {
    return token === _galBuiltinImageToken && galGetImageMode() === 'builtin';
  }

  /* ── 第三方插件探测（只认扩展设置与 DOM，不模拟点击） ───── */
  const GAL_IMAGE_PLUGIN_KEYS = [
    { key: 'image-generation', label: '酒馆内置 Image Generation' },
    { key: 'sd', label: 'Stable Diffusion 扩展' },
    { key: 'comfy', label: 'ComfyUI 扩展' },
    { key: 'comfyui', label: 'ComfyUI 扩展' },
    { key: 'stable-diffusion', label: 'Stable Diffusion 扩展' },
    { key: 'pollinations', label: 'Pollinations 扩展' },
    { key: 'novelai', label: 'NovelAI 扩展' },
    { key: 'sd_webui', label: 'SD WebUI 扩展' },
    { key: 'extensions_imagegen', label: '第三方生图扩展' }
  ];

  function galDetectImagePlugins() {
    const found = [];
    let ext = null;
    try {
      const ctx = getSTCtx();
      ext = (ctx && ctx.extensionSettings) || null;
    } catch (e) { ext = null; }
    if (ext && typeof ext === 'object') {
      GAL_IMAGE_PLUGIN_KEYS.forEach(function(meta) {
        const cfg = ext[meta.key];
        if (!cfg) return;
        const enabled = cfg.enabled !== false && cfg.disabled !== true;
        if (found.some(function(f) { return f.label === meta.label; })) return;
        found.push({ key: meta.key, label: meta.label, enabled: enabled, source: 'extensionSettings' });
      });
    }
    // DOM 侧：扩展面板里的启用项
    try {
      const nodes = mainDoc.querySelectorAll('[data-extension-id], [data-extension-name]');
      for (let i = 0; i < nodes.length; i++) {
        const id = String(nodes[i].getAttribute('data-extension-id') || nodes[i].getAttribute('data-extension-name') || '').toLowerCase();
        if (!id) continue;
        if (!/image|img|sd|comfy|novelai|pollination|draw/.test(id)) continue;
        if (found.some(function(f) { return f.key === id; })) continue;
        found.push({ key: id, label: id, enabled: true, source: 'dom' });
      }
    } catch (e) {}
    return found;
  }

  /* ── 图片提取：三条独立通道，任一命中就够 ─────────────────
     通道 1：消息正文里的 Markdown / HTML 图片（第三方插件最常见的落点）
     通道 2：消息对象的 extra / 自定义字段（部分插件写这里）
     通道 3：已渲染 DOM 里的 <img>（插件直接插节点时最可靠） */
  const GAL_IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|gif|avif)(?:\?|#|$)/i;

  function galNormalizeImageUrl(url) {
    let u = String(url || '').trim();
    if (!u) return '';
    if (/^<.*>$/.test(u)) u = u.slice(1, -1);
    if (/^https?:\/\//i.test(u)) return u;
    if (/^data:image\//i.test(u)) return u;
    if (/^blob:/i.test(u)) return u;
    return '';
  }

  function galExtractImagesFromText(text) {
    const out = [];
    const s = String(text || '');
    // Markdown ![alt](url)
    const md = /!\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)/g;
    let m;
    while ((m = md.exec(s)) !== null) {
      const url = galNormalizeImageUrl(m[2]);
      if (url) out.push({ url: url, alt: String(m[1] || '').trim(), source: 'markdown' });
    }
    // <img src="...">
    const img = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((m = img.exec(s)) !== null) {
      const url = galNormalizeImageUrl(m[1]);
      if (url) {
        const altM = m[0].match(/\balt\s*=\s*["']([^"']*)["']/i);
        out.push({ url: url, alt: altM ? altM[1] : '', source: 'html' });
      }
    }
    // 裸链接（只认明确图片扩展名，避免把普通链接当图）
    const bare = /(https?:\/\/[^\s"'<>()]+?\.(?:png|jpe?g|webp|gif|avif)(?:\?[^\s"'<>()]*)?)/gi;
    while ((m = bare.exec(s)) !== null) {
      const url = galNormalizeImageUrl(m[1]);
      if (url) out.push({ url: url, alt: '', source: 'url' });
    }
    return out;
  }

  function galExtractImagesFromExtra(msg) {
    const out = [];
    if (!msg || typeof msg !== 'object') return out;
    const scan = function(value, depth) {
      if (depth > 3 || value == null) return;
      if (typeof value === 'string') {
        if (/^https?:\/\//i.test(value) && GAL_IMAGE_EXT_RE.test(value)) {
          out.push({ url: value, alt: '', source: 'extra' });
        } else if (/^data:image\//i.test(value)) {
          out.push({ url: value, alt: '', source: 'extra' });
        }
        return;
      }
      if (Array.isArray(value)) { value.forEach(function(v) { scan(v, depth + 1); }); return; }
      if (typeof value === 'object') {
        Object.keys(value).forEach(function(k) {
          if (/^(image|images|img|imgurl|imageurl|image_url|pic|picture|photo|cg|url)$/i.test(k)) scan(value[k], depth + 1);
          else if (typeof value[k] === 'object') scan(value[k], depth + 1);
        });
      }
    };
    ['extra', 'variables', 'metadata'].forEach(function(k) { if (msg[k]) scan(msg[k], 0); });
    return out;
  }

  function galExtractImagesFromDom(floorIdx) {
    const out = [];
    try {
      const nodes = mainDoc.querySelectorAll('.mes');
      if (!nodes.length) return out;
      let node = null;
      if (typeof floorIdx === 'number' && nodes[floorIdx]) node = nodes[floorIdx];
      if (!node) node = nodes[nodes.length - 1];
      if (!node) return out;
      const imgs = node.querySelectorAll('.mes_text img, .mes_img, img');
      for (let i = 0; i < imgs.length; i++) {
        const url = galNormalizeImageUrl(imgs[i].currentSrc || imgs[i].src || imgs[i].getAttribute('data-src'));
        if (url) out.push({ url: url, alt: imgs[i].alt || '', source: 'dom' });
      }
    } catch (e) {}
    return out;
  }

  function galDedupeImages(list) {
    const seen = {};
    const out = [];
    (list || []).forEach(function(it) {
      if (!it || !it.url) return;
      const key = it.url.slice(0, 300);
      if (seen[key]) return;
      seen[key] = 1;
      out.push(it);
    });
    return out;
  }

  function galCollectImagesForMessage(msg, floorIdx) {
    let list = [];
    list = list.concat(galExtractImagesFromText(msg && msg.mes));
    list = list.concat(galExtractImagesFromExtra(msg));
    list = list.concat(galExtractImagesFromDom(floorIdx));
    return galDedupeImages(list);
  }

  /* ── 图片归类：有明确指令才自动归，其余一律待玩家指定 ───── */
  function galClassifyImage(item, parsed) {
    if (!item) return 'unknown';
    if (parsed && parsed.directives) {
      if (parsed.directives.cg) return 'cg';
      if (parsed.directives.bg) return 'bg';
      if (parsed.directives.sprite && parsed.directives.sprite.length) return 'sprite';
    }
    const alt = String(item.alt || '').toLowerCase();
    if (/^(bg|background|背景)/.test(alt)) return 'bg';
    if (/^(cg|event)/.test(alt)) return 'cg';
    if (/^(sprite|立绘|char)/.test(alt)) return 'sprite';
    return 'unknown';
  }

  function galGetPendingImages() {
    const st = galGetState();
    return Array.isArray(st.pendingImages) ? st.pendingImages : [];
  }
  function galSetPendingImages(list) {
    const st = galGetState();
    st.pendingImages = (Array.isArray(list) ? list : []).slice(0, 12);
    galSetState(st);
  }
  function galRemovePendingImage(url) {
    galSetPendingImages(galGetPendingImages().filter(function(p) { return p.url !== url; }));
  }

  function galMarkImagesApplied(floorIdx, swipeId, urls) {
    const st = galGetState();
    if (!st.imgApplied || typeof st.imgApplied !== 'object') st.imgApplied = {};
    const key = galFloorKey(floorIdx, swipeId);
    const cur = Array.isArray(st.imgApplied[key]) ? st.imgApplied[key] : [];
    st.imgApplied[key] = cur.concat(urls || []).slice(-24);
    st.lastImageFloor = floorIdx;
    galSetState(st);
  }
  function galImagesAlreadyApplied(floorIdx, swipeId) {
    const st = galGetState();
    const key = galFloorKey(floorIdx, swipeId);
    return Array.isArray(st.imgApplied && st.imgApplied[key]) ? st.imgApplied[key] : [];
  }

  /* ── 接收：把这一轮的图接进来（只在 external 模式跑） ───── */
  function galIngestImagesForFloor(floorIdx) {
    if (galGetImageMode() !== 'external') return { applied: 0, pending: 0 };
    let ctx = null;
    try { ctx = getSTCtx(); } catch (e) { return { applied: 0, pending: 0 }; }
    if (!ctx || !Array.isArray(ctx.chat) || !ctx.chat[floorIdx]) return { applied: 0, pending: 0 };
    const msg = ctx.chat[floorIdx];
    if (!msg || msg.is_user) return { applied: 0, pending: 0 };
    const swipeId = Number(msg.swipe_id) || 0;
    const images = galCollectImagesForMessage(msg, floorIdx);
    if (!images.length) return { applied: 0, pending: 0 };

    const seen = galImagesAlreadyApplied(floorIdx, swipeId);
    const fresh = images.filter(function(it) { return seen.indexOf(it.url) < 0; });
    if (!fresh.length) return { applied: 0, pending: 0 };

    const s = galGetSettings();
    const maxPerTurn = Math.max(1, Math.min(4, Number(s.maxImagesPerTurn) || 1));
    const take = fresh.slice(0, maxPerTurn);
    const parsed = galParseMessage(msg.mes, galGetTagmap());
    const st = galGetState();
    let appliedCount = 0, pendingCount = 0;
    const appliedUrls = [];

    take.forEach(function(item) {
      const kind = galClassifyImage(item, parsed);
      if (kind === 'bg') {
        st.view.bg = item.url;
        appliedCount++;
      } else if (kind === 'cg') {
        st.view.cg = item.url;
        appliedCount++;
      } else if (kind === 'sprite') {
        const name = (parsed.directives.sprite && parsed.directives.sprite[0]) || '默认';
        st.view.sprites[name] = item.url;
        appliedCount++;
      } else {
        st.pendingImages = (Array.isArray(st.pendingImages) ? st.pendingImages : []);
        st.pendingImages.push({ url: item.url, floor: floorIdx, at: Date.now(), source: item.source || '' });
        pendingCount++;
      }
      appliedUrls.push(item.url);
    });
    galSetState(st);
    galMarkImagesApplied(floorIdx, swipeId, appliedUrls);
    if (pendingCount > 0) {
      toast('收到 ' + pendingCount + ' 张图片，未能判断用途：请在沉浸界面里指定它是背景 / 立绘 / CG', 'info');
    }
    return { applied: appliedCount, pending: pendingCount };
  }

  /* ── 手动指派（永远可逆） ───────────────────────────────── */
  function galAssignImage(url, kind, name) {
    const st = galGetState();
    const u = galNormalizeImageUrl(url);
    if (!u) return false;
    if (kind === 'bg') st.view.bg = u;
    else if (kind === 'cg') st.view.cg = u;
    else if (kind === 'sprite') {
      const key = String(name || '默认').trim() || '默认';
      st.view.sprites[key] = u;
    } else return false;
    st.pendingImages = (Array.isArray(st.pendingImages) ? st.pendingImages : []).filter(function(p) { return p.url !== u; });
    galSetState(st);
    return true;
  }
  function galClearView(kind) {
    const st = galGetState();
    if (kind === 'bg') st.view.bg = '';
    else if (kind === 'cg') st.view.cg = '';
    else if (kind === 'sprite') st.view.sprites = {};
    else { st.view = { bg: '', cg: '', sprites: {}, expressions: {} }; }
    galSetState(st);
  }

  /* ── 状态摘要（给面板 / 自检看） ────────────────────────── */
  function galImageHint() {
    const s = galGetSettings();
    const mode = s.imageMode;
    const label = { builtin: '月相内置生图', external: '第三方插件接管', manual: '手动素材', off: '纯文字' }[mode] || mode;
    const detected = galDetectImagePlugins();
    let warning = '';
    if (mode === 'external' && !detected.some(function(d) { return d.enabled; })) {
      warning = '未检测到已启用的第三方生图插件。月相已停止内置生图，现在不会有任何图片自动生成。';
    }
    return {
      mode: mode, label: label,
      builtinActive: mode === 'builtin',
      externalActive: mode === 'external',
      detected: detected,
      warning: warning,
      pending: galGetPendingImages().length
    };
  }
