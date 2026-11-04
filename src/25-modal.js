  /* ───────────────────────────────────────────────────────── */
  const modalQueue = []; let isModalShowing = false;
  function enqueueModal(render) { modalQueue.push(render); processModalQueue(); }
  function processModalQueue() {
    if (isModalShowing) return; if (modalQueue.length === 0) return;
    isModalShowing = true; const task = modalQueue.shift();
    const onDone = function() { isModalShowing = false; setTimeout(processModalQueue, 120); };
    try { task(onDone); } catch (e) { try { console.warn('[Doki] 弹窗任务异常：', e); } catch (e2) {} onDone(); }
  }

  function showModalDialog(title, html, onConfirm, opts) {
    opts = opts || {};
    enqueueModal(function(done) {
      let mask = mainDoc.getElementById('moon-modal-mask'); if (mask) { try { mask.remove(); } catch (e) {} }
      mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
      mask.className = 'mp-pixel-modal';
      mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:460px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-modal-confirm" style="flex:1;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.confirmText || '确认') + '</button></div></div>';
      mainDoc.body.appendChild(mask); wrapMaskClose(mask, done);
      mask.querySelector('#moon-modal-confirm').addEventListener('click', function() { if (typeof onConfirm === 'function') { try { onConfirm(); } catch (e) {} } try { mask.remove(); } catch (e) {} });
      if (typeof onConfirm !== 'function') { mask.addEventListener('click', function(e) { if (e.target === mask) { try { mask.remove(); } catch (err) {} } }); }
      if (typeof opts.onOpen === 'function') { try { opts.onOpen(mask); } catch (e) {} }
    });
  }

  function showModalDialogCancelable(title, html, onConfirm, onCancel, opts) {
    opts = opts || {};
    enqueueModal(function(done) {
      let mask = mainDoc.getElementById('moon-modal-mask'); if (mask) { try { mask.remove(); } catch (e) {} }
      mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
      mask.className = 'mp-pixel-modal';
      mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:460px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-modal-cancel" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.cancelText || '取消') + '</button><button id="moon-modal-confirm" style="flex:1.4;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.confirmText || '确认') + '</button></div></div>';
      mainDoc.body.appendChild(mask); wrapMaskClose(mask, done);
      mask.querySelector('#moon-modal-confirm').addEventListener('click', function() { if (typeof onConfirm === 'function') { try { onConfirm(); } catch (e) {} } try { mask.remove(); } catch (e) {} });
      mask.querySelector('#moon-modal-cancel').addEventListener('click', function() { if (typeof onCancel === 'function') { try { onCancel(); } catch (e) {} } try { mask.remove(); } catch (e) {} });
      mask.addEventListener('click', function(e) { if (e.target === mask) { if (typeof onCancel === 'function') { try { onCancel(); } catch (e) {} } try { mask.remove(); } catch (err) {} } });
      if (typeof opts.onOpen === 'function') { try { opts.onOpen(mask); } catch (e) {} }
    });
  }

  function showStepDialog(title, html, opts) {
    opts = opts || {};
    return new Promise(function(resolve) {
      enqueueModal(function(done) {
        let mask = mainDoc.getElementById('moon-modal-mask'); if (mask) { try { mask.remove(); } catch (e) {} }
        mask = mainDoc.createElement('div'); mask.id = 'moon-modal-mask';
        mask.className = 'mp-pixel-modal';
        mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483650;background:radial-gradient(circle at center,rgba(15,23,42,0.92) 0%,rgba(2,6,12,0.96) 100%);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
        mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#0a0c16 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:520px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:700;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;max-height:60dvh;overflow-y:auto;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-step-next" style="flex:1;padding:11px;border-radius:9px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#fff;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:700;">' + (opts.confirmText || '确认，进行下一步') + '</button></div></div>';
        mainDoc.body.appendChild(mask);
        let resolved = false;
        function finish() { if (resolved) return; resolved = true; try { mask.remove(); } catch (e) {} try { resolve(); } catch (e) {} }
        wrapMaskClose(mask, function() { done(); if (!resolved) { resolved = true; try { resolve(); } catch (e) {} } });
        mask.querySelector('#moon-step-next').addEventListener('click', finish);
        mask.addEventListener('click', function(e) { if (e.target === mask) finish(); });
        if (typeof opts.onOpen === 'function') { try { opts.onOpen(mask); } catch (e) {} }
      });
    });
  }

  function getArcadeHighScore() {
    const record = getArcadeRecord();
    return Math.max(0, parseInt(record.score, 10) || 0);
  }
  function saveArcadeHighScore(score) {
    const current = getArcadeRecord();
    const nextScore = Math.max(0, Math.floor(Number(score) || 0));
    if (nextScore <= (Number(current.score) || 0)) return current;
    const ctx = getSTCtx();
    if (!ctx) return current;
    if (!ctx.chatMetadata || typeof ctx.chatMetadata !== 'object') ctx.chatMetadata = {};
    const record = { score: nextScore, achievedAt: Date.now() };
    ctx.chatMetadata[ARCADE_CHAT_RECORD_KEY] = record;
    scheduleArcadeMetadataSave(ctx);
    return record;
  }
  function getArcadeRecord() {
    try {
      const ctx = getSTCtx();
      const record = ctx && ctx.chatMetadata && ctx.chatMetadata[ARCADE_CHAT_RECORD_KEY];
      if (record && typeof record === 'object') return { score: Math.max(0, parseInt(record.score, 10) || 0), achievedAt: Number(record.achievedAt) || 0 };
      // 一次性把旧版全局分数转入当前聊天；旧版没有时间戳，因此明确保留为“时间未记录”。
      if (ctx && ctx.chatMetadata) {
        const legacyScore = Math.max(0, parseInt(mainWin.localStorage.getItem(LEGACY_ARCADE_HIGH_SCORE_KEY), 10) || 0);
        if (legacyScore > 0) {
          const migrated = { score: legacyScore, achievedAt: 0, migrated: true };
          ctx.chatMetadata[ARCADE_CHAT_RECORD_KEY] = migrated;
          mainWin.localStorage.removeItem(LEGACY_ARCADE_HIGH_SCORE_KEY);
          scheduleArcadeMetadataSave(ctx);
          return migrated;
        }
      }
    } catch (e) {}
    return { score: 0, achievedAt: 0 };
  }
  function formatArcadeRecordTime(timestamp, score) {
    const date = new Date(Number(timestamp) || 0);
    if (!timestamp || !isFinite(date.getTime())) return Number(score) > 0 ? '旧纪录时间未记录' : '暂无纪录时间';
    const pad = function(value) { return String(value).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  let _arcadeMetadataSaveTimer = null;
  let _arcadeMetadataSaveContext = null;
  function scheduleArcadeMetadataSave(ctx) {
    _arcadeMetadataSaveContext = ctx;
    if (_arcadeMetadataSaveTimer) return;
    _arcadeMetadataSaveTimer = setTimeout(function() {
      _arcadeMetadataSaveTimer = null;
      flushArcadeMetadataSave();
    }, 1800);
  }
  function flushArcadeMetadataSave() {
    if (_arcadeMetadataSaveTimer) { clearTimeout(_arcadeMetadataSaveTimer); _arcadeMetadataSaveTimer = null; }
    const ctx = _arcadeMetadataSaveContext;
    _arcadeMetadataSaveContext = null;
    if (ctx && typeof ctx.saveMetadata === 'function') {
      try { const result = ctx.saveMetadata(); if (result && typeof result.catch === 'function') result.catch(function() {}); } catch (e) {}
    }
  }
  try { mainWin.addEventListener('pagehide', flushArcadeMetadataSave); } catch (e) {}
  let stopArcadeRunner = null;
  function mountArcadeRunner(root, options) {
    options = options || {};
    const canvas = root.querySelector('#moon-arcade-canvas');
    const scoreEl = root.querySelector('#moon-arcade-score');
    const highScoreEl = root.querySelector('#moon-arcade-hi-score');
    const stateEl = root.querySelector('#moon-arcade-state');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const difficulty = options.difficulty || 'normal';
    const levels = {
      easy: { startSpeed: 2.4, maxSpeed: 4.2, growth: 220, firstX: 325, secondX: 560, gap: 135 },
      normal: { startSpeed: 3, maxSpeed: 6, growth: 140, firstX: 290, secondX: 480, gap: 90 },
      hard: { startSpeed: 3.8, maxSpeed: 7.2, growth: 100, firstX: 260, secondX: 420, gap: 55 },
      hell: { startSpeed: 4.4, maxSpeed: 8, growth: 80, firstX: 235, secondX: 370, gap: 38 }
    };
    const level = levels[difficulty] || levels.normal;
    let raf = 0, score = 0, speed = level.startSpeed, tick = 0, dead = false, jumpY = 0, jumpV = 0;
    let highScore = getArcadeHighScore(), shownScore = -1, stopped = false;
    const recordTimeEl = root.querySelector('#moon-arcade-record-time');
    let obstacles = [{ x: level.firstX, w: 10, h: 18 }, { x: level.secondX, w: 12, h: 25 }];
    if (highScoreEl) highScoreEl.textContent = String(highScore).padStart(5, '0');
    function resetRound() { score = 0; shownScore = -1; dead = false; speed = level.startSpeed; tick = 0; jumpY = 0; jumpV = 0; obstacles = [{ x: level.firstX, w: 10, h: 18 }, { x: level.secondX, w: 12, h: 25 }]; stateEl.textContent = 'PRESS SPACE / TAP TO JUMP'; }
    function jump() { if (dead) { resetRound(); return; } if (jumpY === 0) jumpV = -8; }
    function keydown(e) { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } }
    function draw() {
      const w = canvas.width, h = canvas.height, floor = h - 18;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#7d896f'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#18271a'; for (let x = 0; x < w; x += 16) { const p = (x + Math.floor(tick / 3) % 16) % w; ctx.fillRect(p, floor + 7, 8, 2); }
      ctx.fillStyle = '#18271a'; ctx.fillRect(0, floor, w, 2);
      if (!dead) { tick++; score += 0.08; speed = Math.min(level.maxSpeed, level.startSpeed + score / level.growth); jumpY += jumpV; jumpV += 0.42; if (jumpY > 0) { jumpY = 0; jumpV = 0; }
        obstacles.forEach(function(o) {
          o.x -= speed;
          if (o.x < -o.w) { o.x = w + level.gap + Math.random() * 110; o.h = 14 + Math.floor(Math.random() * 17); o.w = 9 + Math.floor(Math.random() * 6); }
          const playerX = 30, playerWidth = 14, playerY = floor - 21 + jumpY, playerHeight = 21;
          const obstacleY = floor - o.h;
          if (!dead && playerX < o.x + o.w && playerX + playerWidth > o.x && playerY + playerHeight > obstacleY && playerY < floor) {
            dead = true; jumpY = 0; jumpV = 0; stateEl.textContent = 'GAME OVER · TAP / SPACE TO RETRY'; flushArcadeMetadataSave();
          }
        }); }
      ctx.fillStyle = '#18271a'; ctx.fillRect(30, floor - 21 + jumpY, 14, 14); ctx.fillRect(39, floor - 18 + jumpY, 2, 2); ctx.fillRect(33, floor - 7 + jumpY, 3, 7); ctx.fillRect(40, floor - 7 + jumpY, 3, 7);
      ctx.fillStyle = '#18271a'; obstacles.forEach(function(o) { ctx.fillRect(Math.round(o.x), floor - o.h, o.w, o.h); ctx.fillRect(Math.round(o.x) - 3, floor - o.h + 5, 4, 3); });
      const scoreNow = Math.floor(score);
      if (scoreNow !== shownScore) {
        shownScore = scoreNow;
        scoreEl.textContent = String(scoreNow).padStart(5, '0');
        if (scoreNow > highScore) { highScore = scoreNow; const record = saveArcadeHighScore(highScore); if (highScoreEl) highScoreEl.textContent = String(highScore).padStart(5, '0'); if (recordTimeEl) recordTimeEl.textContent = 'RECORD TIME · ' + formatArcadeRecordTime(record.achievedAt); }
      }
      raf = mainWin.requestAnimationFrame(draw);
    }
    canvas.addEventListener('pointerdown', jump); mainDoc.addEventListener('keydown', keydown, true); draw();
    const stop = function() { if (stopped) return; stopped = true; flushArcadeMetadataSave(); try { mainWin.cancelAnimationFrame(raf); } catch (e) {} try { mainDoc.removeEventListener('keydown', keydown, true); } catch (e) {} canvas.removeEventListener('pointerdown', jump); };
    if (!options.standalone) stopArcadeRunner = stop;
    return stop;
  }

  function showLoadingDialog(text, withArcade) {
    closeLoadingDialog();
    const mask = mainDoc.createElement('div'); mask.id = 'moon-loading-mask';
    mask.className = withArcade ? 'moon-pixel-loading' : '';
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483660;background:rgba(5,0,8,0.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;';
    mask.innerHTML = withArcade
      ? '<div class="mp-arcade-box"><div class="mp-arcade-brand">★ MOON ARCADE ★</div><div class="mp-arcade-title" id="moon-loading-text">' + text + '</div><div class="mp-arcade-hud"><span>SCORE <b id="moon-arcade-score">00000</b></span><span>HI <b id="moon-arcade-hi-score">' + String(getArcadeHighScore()).padStart(5, '0') + '</b></span></div><div class="mp-arcade-record-time" id="moon-arcade-record-time">RECORD TIME · ' + formatArcadeRecordTime(getArcadeRecord().achievedAt, getArcadeHighScore()) + '</div><canvas id="moon-arcade-canvas" width="320" height="94" aria-label="离线像素小游戏，按空格或点击跳跃"></canvas><div class="mp-arcade-state" id="moon-arcade-state">PRESS SPACE / TAP TO JUMP</div><div class="mp-arcade-foot">操作角色跳过障碍 · 任务完成后自动返回</div></div>'
      : '<div class="mp-loading-box"><div style="margin-bottom:12px;" id="moon-loading-text">⏳ ' + text + '</div><div class="mp-loading-track"><div class="mp-loading-bar"></div></div><div style="font-size:10.5px;color:#d68cbd;margin-top:8px;">请稍候</div></div>';
    mainDoc.body.appendChild(mask);
    if (withArcade) mountArcadeRunner(mask);
  }
  function closeLoadingDialog() { if (stopArcadeRunner) { try { stopArcadeRunner(); } catch (e) {} stopArcadeRunner = null; } const m = mainDoc.getElementById('moon-loading-mask'); if (m) { try { m.remove(); } catch (e) {} } }
  function showResultDialog(title, html, onOpenExtra) { showModalDialog(title, html, null, { confirmText: '我已截图 / 关闭', onOpen: onOpenExtra }); }
  function wrapMaskClose(mask, onClosed) {
    if (!mask || typeof mask.remove !== 'function') return;
    const origRemove = mask.remove.bind(mask); let closed = false;
    mask.remove = function() { if (closed) return; closed = true; try { origRemove(); } catch (e) {} if (typeof onClosed === 'function') { try { onClosed(); } catch (e) {} } };
  }
