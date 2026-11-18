/* 87a-pocket-host.js —— 掌机的宿主侧：占位块 + 挂到 body 的持久 iframe 容器 + 存档回传。
   为什么不把 iframe 直接放进面板：面板会被酒馆反复移除重建（切页签/引导/关面板/扩展刷新），
   而 iframe 里有正在跑的模拟器，跟着 rebuild 一次就丢一局。挂在 body 上就与面板生命周期解耦。
   坐标跟随、可见性（display:none 让 Chrome 停渲染循环）、存档写 chatMetadata 都在这里。 */
  /* 面板里只放一个「占位块」，真正的 iframe 挂在 body 上（见 mountPocket）。
     原因：面板会被酒馆自己的流程移除重建（切页签、引导、关面板、某些扩展刷新），
     而 iframe 里有正在跑的模拟器，跟着 rebuild 一次就丢一局。挂在 body 上就与面板生命周期解耦，
     面板重绘只是把占位块换个位置，我们同步一下坐标即可。 */
  function renderPocketScreen() {
    return '<div class="mp-pocket-wrap"><div class="mp-pocket-slot" id="moon-pocket-slot">' +
      '<div class="mp-pocket-hint" id="moon-pocket-hint">掌机正在装载…</div></div></div>';
  }

  /* 掌机跑在 sandbox iframe 里（opaque origin）：它读不到 localStorage，也碰不到酒馆的 DOM。
     存档由它通过 postMessage 交上来，我们写进当前聊天的 chatMetadata；下次打开再原样还给它。 */
  function mountPocket(card) {
    const slot = card.querySelector('#moon-pocket-slot');
    const hint = card.querySelector('#moon-pocket-hint');
    if (!slot) return null;
    const html = pocketEmbedHtml();
    if (!html) { if (hint) hint.textContent = '掌机资源未打包：先运行 moon-pocket/tools/pack-pocket.mjs'; return null; }

    /* 趁这次点击把 AudioContext 建起来：等 AI 回复完再建，浏览器会按「没有手势」
       把它挂在 suspended，提示音响不出来。 */
    try { if (typeof pocketChimePrime === 'function') pocketChimePrime(); } catch (e) {}

    let stopped = false;
    let host = mainDoc.getElementById('moon-pocket-host');
    let frame = null;

    if (!host) {
      host = mainDoc.createElement('div');
      host.id = 'moon-pocket-host';
      /* z-index 必须高过面板遮罩（#moon-phase-mask 是 2147483645），
         否则掌机会被那层半透明模糊遮罩盖住，看上去就是一块黑。 */
      host.style.cssText = 'position:fixed;z-index:2147483646;background:#0d0910;overflow:hidden;' +
        'box-shadow:0 0 0 1px rgba(13,9,16,.6);'   /* 带色相的近黑，不用纯黑（护眼 E02） */;
      frame = mainDoc.createElement('iframe');
      frame.id = 'moon-pocket-frame';
      frame.title = '月相掌机 / 卡带机';
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#0d0910;';
      host.appendChild(frame);
      mainDoc.body.appendChild(host);
      frame.srcdoc = html;
    } else {
      frame = host.querySelector('#moon-pocket-frame');
    }

    /* 把 iframe 容器贴到占位块的位置；滚动、缩放、面板重绘后都要重新对齐 */
    /* 每帧都写一次 style 会逼浏览器重排这块 iframe——掌机自己已经在 60fps 重绘，
       再叠一层布局抖动就是玩家感觉到的「卡」。值没变就别写。 */
    let lastL = -1, lastT = -1, lastW = -1, lastH = -1, lastShow = '';
    const sync = function () {
      if (stopped || !host || !mainDoc.body.contains(host)) return;
      const r = slot.getBoundingClientRect();
      /* 占位块不可见（面板关了 / 被别的层替换 / 切走）就把容器摘掉显示：
         用 display:none 而不是 visibility，Chrome 会对不可见的 iframe 停掉渲染循环，
         核心不再空转烧 CPU。 */
      if (r.width < 40 || r.height < 40) {
        if (lastShow !== 'none') { host.style.display = 'none'; lastShow = 'none'; lastL = -1; }
        return;
      }
      const L = Math.round(r.left), T = Math.round(r.top);
      const W = Math.round(r.width), H = Math.round(r.height);
      if (lastShow !== 'block') { host.style.display = 'block'; lastShow = 'block'; }
      if (L !== lastL) { host.style.left = L + 'px'; lastL = L; }
      if (T !== lastT) { host.style.top = T + 'px'; lastT = T; }
      if (W !== lastW) { host.style.width = W + 'px'; lastW = W; }
      if (H !== lastH) { host.style.height = H + 'px'; lastH = H; }
    };
    sync();
    const raf = function () { if (stopped) return; sync(); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    const onResize = function () { sync(); };
    mainWin.addEventListener('resize', onResize, true);
    mainDoc.addEventListener('scroll', onResize, true);

    const readSaves = () => { try { const c = getSTCtx(); return (c && c.chatMetadata && c.chatMetadata[MOON_POCKET_SAVES_KEY]) || null; } catch (e) { return null; } };
    const flushSaves = function (blob) {
      if (!blob) return;
      try {
        const c = getSTCtx();
        if (!c) return;
        if (!c.chatMetadata || typeof c.chatMetadata !== 'object') c.chatMetadata = {};
        c.chatMetadata[MOON_POCKET_SAVES_KEY] = blob;
        if (typeof c.saveMetadata === 'function') c.saveMetadata();
      } catch (e) {}
    };

    /* ── 卡带来源：两条，都不联网 ───────────────────────────────────
       ① 本机缓存（IndexedDB）：玩家手动插过一次卡，就把那 32MB 记住，之后每次打开直接点卡槽即玩；
       ② 脚本自带（只有「内置卡带」变体有 __POCKET_ROM_CHUNKS）。
       缓存只能放宿主这一层：掌机跑在 sandbox="allow-scripts" 的 srcdoc iframe 里，
       那是 opaque origin，localStorage / IndexedDB 全都不可用。 */
    const ROM_DB = 'moon-pocket-rom';
    const ROM_KEY = 'bt999';
    const ROM_META_KEY = 'bt999-meta'; // 只存 {size, at}，报告卡槽状态时不必把 32MB 读出来
    const romDb = () => new Promise((ok, bad) => {
      try {
        const req = indexedDB.open(ROM_DB, 1);
        req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('rom')) db.createObjectStore('rom'); };
        req.onsuccess = () => ok(req.result);
        req.onerror = () => bad(req.error);
      } catch (e) { bad(e); }
    });
    const romGet = (key) => romDb().then((db) => new Promise((ok, bad) => {
      const g = db.transaction('rom', 'readonly').objectStore('rom').get(key);
      g.onsuccess = () => ok(g.result || null);
      g.onerror = () => bad(g.error);
    })).catch(() => null);
    const romPut = async (key, val) => {
      try {
        const db = await romDb();
        await new Promise((ok, bad) => {
          const tx = db.transaction('rom', 'readwrite');
          tx.objectStore('rom').put(val, key);
          tx.oncomplete = () => ok(true);
          tx.onerror = () => bad(tx.error);
        });
        return true;
      } catch (e) { return false; }
    };

    let romState = 0; // 0 未解 / 1 解码中 / 2 已送出
    const tell = (msg) => { try { if (frame) frame.contentWindow.postMessage(msg, '*'); } catch (e) {} };

    const romSource = function () {
      try {
        if (typeof __POCKET_ROM_CHUNKS !== 'undefined' && __POCKET_ROM_CHUNKS && __POCKET_ROM_CHUNKS.length) return { chunks: __POCKET_ROM_CHUNKS };
      } catch (e) {}
      return null;
    };

    /* 流式解压：1MB 一段喂给 DecompressionStream，喂完立刻把这段丢掉，
       永不出现「21MB base64 + 16MB gz + 32MB 成品」同时在场。 */
    const decodeEmbedded = async function (parts) {
      const ds = new DecompressionStream('gzip');
      const w = ds.writable.getWriter();
      const done = new Response(ds.readable).arrayBuffer();
      for (let k = 0; k < parts.length; k++) {
        const bin = atob(parts[k]);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        parts[k] = '';
        await w.write(u8);
      }
      await w.close();
      const raw = new Uint8Array(await done);
      try { __POCKET_ROM_CHUNKS.length = 0; } catch (e) {}
      return raw.buffer;
    };

    const deliverRom = function () {
      if (romState || !frame) return;
      romState = 1;
      (async () => {
        try {
          /* ① 先找本机缓存 —— 玩家选过一次就再也不用手动插卡 */
          let buf = await romGet(ROM_KEY);
          if (buf && buf.byteLength) {
            frame.contentWindow.postMessage({ type: 'moon-host:rom', buf: buf }, '*', [buf]);
            romState = 2;
            return;
          }
          /* ② 再看脚本里是不是自带了卡带 */
          const src = romSource();
          if (!src) { romState = 0; tell({ type: 'moon-host:rom-none' }); return; }
          buf = await decodeEmbedded(src.chunks);
          frame.contentWindow.postMessage({ type: 'moon-host:rom', buf: buf }, '*', [buf]);
          romState = 2;
        } catch (e) {
          romState = 0;
          tell({ type: 'moon-host:rom-error', message: String((e && e.message) || e) });
          try { console.warn('[moon-pocket] 卡带准备失败：', e); } catch (_) {}
        }
      })();
    };

    /* 报告卡槽状态：有缓存 / 自带卡带多大。只读 meta，不把 32MB 读出来。 */
    const announceRom = async function () {
      if (!frame) return;
      let size = 0, cached = false;
      const meta = await romGet(ROM_META_KEY);
      if (meta && meta.size) { size = meta.size; cached = true; }
      if (!size) { try { size = (typeof POCKET_ROM_SIZE !== 'undefined' && POCKET_ROM_SIZE) || 0; } catch (e) { size = 0; } }
      if (!size) return;
      tell({ type: 'moon-host:rom-meta', size: size, cached: cached });
    };

    /* 掌机把玩家选中的卡带推上来：存进本机，下次打开就不用再选 */
    const rememberRom = async function (buf, size) {
      if (!buf || !buf.byteLength) return;
      const ok = await romPut(ROM_KEY, buf);
      if (ok) await romPut(ROM_META_KEY, { size: size || buf.byteLength, at: Date.now() });
      tell({ type: 'moon-host:rom-cached', ok: ok });
    };

    const onMessage = (event) => {
      if (stopped || !frame || event.source !== frame.contentWindow || !event.data) return;
      const d = event.data;
      if (d.type === 'moon-pocket:ready') {
        const saves = readSaves();
        if (saves) { try { frame.contentWindow.postMessage({ type: 'moon-host:restore', data: saves }, '*'); } catch (e) {} }
        /* 提示音开不开，以酒馆这一层记的为准；掌机的开关点一下就同步过去 */
        try {
          if (typeof pocketChimeGet === 'function') {
            frame.contentWindow.postMessage({ type: 'moon-host:chime-state', on: pocketChimeGet() }, '*');
          }
        } catch (e) {}
        if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
        announceRom();
        sync();
      } else if (d.type === 'moon-pocket:want-rom') {
        deliverRom();
      } else if (d.type === 'moon-pocket:rom-picked') {
        rememberRom(d.buf, d.size);
      } else if (d.type === 'moon-pocket:height') {
        // 高度由占位块决定，这里只当作「内容变化了，重新对齐」的信号
        sync();
      } else if (d.type === 'moon-pocket:persist') {
        let blob = d.data || {};
        let json = '';
        try { json = JSON.stringify(blob); } catch (e) { return; }
        if (json.length > 262144) {
          /* 整包超过 256KB（金手指代码、世界书草稿攒多了）：先保住存档，其余这轮不写。
             宁可丢一份草稿，也不能把玩家这一局的进度丢了。 */
          const keep = {};
          Object.keys(blob).forEach(function (k) {
            if (k.indexOf('moon-pocket:cart-save:') === 0) keep[k] = blob[k];
          });
          const prev = readSaves() || {};
          Object.keys(prev).forEach(function (k) {
            if (!(k in keep) && k.indexOf('moon-pocket:cart-save:') === 0) keep[k] = prev[k];
          });
          const keepJson = JSON.stringify(keep);
          if (keepJson.length > 2 && keepJson.length <= 262144) {
            flushSaves(keep);
            try { console.warn('[月相] 掌机整包超过 256KB，本轮只写了存档（' + Math.round(keepJson.length / 1024) + 'KB）'); } catch (e) {}
          } else {
            try { console.warn('[月相] 掌机存档超过 256KB，本次不写入聊天存档'); } catch (e) {}
          }
          return;
        }
        flushSaves(blob);
      }
    };
    mainWin.addEventListener('message', onMessage);

    return function () {
      stopped = true;
      try { if (typeof pocketPlayingOff === 'function') pocketPlayingOff(); } catch (e) {}
      try { mainWin.removeEventListener('message', onMessage); } catch (e) {}
      try { mainWin.removeEventListener('resize', onResize, true); } catch (e) {}
      try { mainDoc.removeEventListener('scroll', onResize, true); } catch (e) {}
      try { if (host && host.parentNode) host.parentNode.removeChild(host); } catch (e) {}
      try { if (frame) frame.removeAttribute('srcdoc'); } catch (e) {}
    };
  }

  /* ── 卡带机页下面那条「金手指 / 神宠秘籍」──────────────────────────────
     玩家不该为了把存档里的精灵写进剧情，先进卡带机翻菜单找金手指。
     这一条是酒馆侧的入口：开关、立刻转写、看这本书现在有几条在生效。

     状态从 chatMetadata 里的掌机存档包读——掌机把世界书写进自己的
     localStorage，宿主在 persist 通道里整包抄进聊天存档，所以这里
     只是「读现状」，不另存一份，两边不会打架。 */
  const POCKET_WB_NAME_FALLBACK = '后宫王神宠秘籍';

  function pocketWbInfo() {
    const out = { name: POCKET_WB_NAME_FALLBACK, total: 0, on: 0 };
    let bag = null;
    try {
      const c = getSTCtx();
      bag = (c && c.chatMetadata && c.chatMetadata[MOON_POCKET_SAVES_KEY]) || null;
    } catch (e) { bag = null; }
    if (!bag || typeof bag !== 'object') return out;
    let best = null;
    Object.keys(bag).forEach(function (k) {
      if (k.indexOf('moon-pocket:worldbook:') !== 0) return;
      let arr = null;
      try { arr = JSON.parse(bag[k]); } catch (e) { return; }
      if (!Array.isArray(arr) || !arr.length) return;
      if (!best || arr.length > best.length) best = arr;
    });
    if (!best) return out;
    out.total = best.length;
    out.on = best.filter(function (e) { return e && !e.disable; }).length;
    const raw = bag['moon-pocket:flag:wb-name'];
    if (raw != null) {
      let n = '';
      try { n = String(JSON.parse(raw)); } catch (e) { n = String(raw); }
      if (n.trim()) out.name = n.trim();
    }
    return out;
  }

  function pocketPost(msg) {
    const f = pocketFrame();
    if (!f) return false;
    try { f.contentWindow.postMessage(msg, '*'); return true; } catch (e) { return false; }
  }

  function pocketCheat(on) {
    /* 掌机的 iframe 只在「卡带机」这一页挂着。没挂就等于没开机，
       说清楚该点哪儿，别让按钮点了没反应。 */
    if (!pocketPost({ type: 'moon-host:cheat', on: !!on })) {
      if (on) { try { toast('先开一次「卡带机」，金手指要在掌机里读存档', 'warning'); } catch (e) {} }
      return false;
    }
    return true;
  }

  function renderPocketTools() {
    const st = pocketWbInfo();
    const on = st.on > 0;
    return '<div class="mp-card mp-pocket-tools" id="moon-pocket-tools">' +
      '<div class="mp-card-title">金手指 · 神宠秘籍<small>GOLDEN LINK</small></div>' +
      '<div class="mp-set-desc">把卡带里这一档的精灵、配招、道具、羁绊整理成世界书，随每轮请求注入剧情。不需要进卡带机翻菜单。</div>' +
      '<div class="mp-grid">' +
      '<button type="button" class="mp-btn' + (on ? ' mp-btn-highlight' : '') + '" id="moon-pocket-cheat" aria-pressed="' + on + '">' +
      '<span id="moon-pocket-cheat-label">' + (on ? '金手指已开启' : '开启金手指') + '</span>' +
      '<small id="moon-pocket-cheat-note">' + (on ? '再点一次就停写，已生成的条目保留' : '读一次存档，生成《' + st.name + '》') + '</small></button>' +
      '<button type="button" class="mp-btn" id="moon-pocket-wb-rebuild"><span>重新转写</span><small>进度变了、换了队员就再扫一次</small></button>' +
      '</div>' +
      '<div class="mp-set-desc" id="moon-pocket-wb-state">《' + st.name + '》 · ' + st.total + ' 条 · 启用 ' + st.on + ' 条' +
      (st.total ? ' · 每轮自动注入' : ' · 还没生成') + '</div>' +
      '</div>';
  }

  /* 转写要一秒多（读存档 → 建条目 → 落盘 → 宿主抄进聊天存档），
     这段时间不重绘面板（重绘会把正在跑的卡带机拆掉），只按节奏改文案。 */
  function pocketRefreshTools(panel) {
    const st = pocketWbInfo();
    const btn = panel.querySelector('#moon-pocket-cheat');
    const label = panel.querySelector('#moon-pocket-cheat-label');
    const note = panel.querySelector('#moon-pocket-cheat-note');
    const state = panel.querySelector('#moon-pocket-wb-state');
    const on = st.on > 0;
    if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.classList.toggle('mp-btn-highlight', on); }
    if (label) label.textContent = on ? '金手指已开启' : '开启金手指';
    if (note) note.textContent = on ? '再点一次就停写，已生成的条目保留' : '读一次存档，生成《' + st.name + '》';
    if (state) state.textContent = '《' + st.name + '》 · ' + st.total + ' 条 · 启用 ' + st.on + ' 条' + (st.total ? ' · 每轮自动注入' : ' · 还没生成');
    return st;
  }

  function pocketBindTools(panel) {
    const cheat = panel.querySelector('#moon-pocket-cheat');
    if (cheat) {
      cheat.addEventListener('click', function () {
        const want = cheat.getAttribute('aria-pressed') !== 'true';
        if (!pocketCheat(want)) return;
        let left = 6;
        const tick = function () {
          if (!mainDoc.body.contains(panel)) return;
          pocketRefreshTools(panel);
          if (--left > 0) mainWin.setTimeout(tick, 400);
        };
        mainWin.setTimeout(tick, 400);
      });
    }
    const rebuild = panel.querySelector('#moon-pocket-wb-rebuild');
    if (rebuild) {
      rebuild.addEventListener('click', function () {
        if (!pocketPost({ type: 'moon-host:wb-rebuild' })) {
          try { toast('先开一次「卡带机」，转写要在掌机里读存档', 'warning'); } catch (e) {}
          return;
        }
        try { toast('正在按当前存档重新转写《' + pocketWbInfo().name + '》…', 'info'); } catch (e) {}
        let left = 8;
        const tick = function () {
          if (!mainDoc.body.contains(panel)) return;
          pocketRefreshTools(panel);
          if (--left > 0) mainWin.setTimeout(tick, 500);
        };
        mainWin.setTimeout(tick, 500);
      });
    }
  }
