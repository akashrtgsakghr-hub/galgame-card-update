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
    const sync = function () {
      if (stopped || !host || !mainDoc.body.contains(host)) return;
      const r = slot.getBoundingClientRect();
      /* 占位块不可见（面板关了 / 被别的层替换 / 切走）就把容器摘掉显示：
         用 display:none 而不是 visibility，Chrome 会对不可见的 iframe 停掉渲染循环，
         核心不再空转烧 CPU。 */
      if (r.width < 40 || r.height < 40) { host.style.display = 'none'; return; }
      host.style.display = 'block';
      host.style.left = Math.round(r.left) + 'px';
      host.style.top = Math.round(r.top) + 'px';
      host.style.width = Math.round(r.width) + 'px';
      host.style.height = Math.round(r.height) + 'px';
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

    const onMessage = (event) => {
      if (stopped || !frame || event.source !== frame.contentWindow || !event.data) return;
      const d = event.data;
      if (d.type === 'moon-pocket:ready') {
        const saves = readSaves();
        if (saves) { try { frame.contentWindow.postMessage({ type: 'moon-host:restore', data: saves }, '*'); } catch (e) {} }
        if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
        sync();
      } else if (d.type === 'moon-pocket:height') {
        // 高度由占位块决定，这里只当作「内容变化了，重新对齐」的信号
        sync();
      } else if (d.type === 'moon-pocket:persist') {
        let blob = d.data || {};
        let json = '';
        try { json = JSON.stringify(blob); } catch (e) { return; }
        if (json.length > 262144) { try { console.warn('[月相] 掌机存档超过 256KB，本次不写入聊天存档'); } catch (e) {} return; }
        flushSaves(blob);
      }
    };
    mainWin.addEventListener('message', onMessage);

    return function () {
      stopped = true;
      try { mainWin.removeEventListener('message', onMessage); } catch (e) {}
      try { mainWin.removeEventListener('resize', onResize, true); } catch (e) {}
      try { mainDoc.removeEventListener('scroll', onResize, true); } catch (e) {}
      try { if (host && host.parentNode) host.parentNode.removeChild(host); } catch (e) {}
      try { if (frame) frame.removeAttribute('srcdoc'); } catch (e) {}
    };
  }
