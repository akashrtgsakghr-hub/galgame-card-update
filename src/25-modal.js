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
      mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#22262f 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:460px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(18, 20, 26, 0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:600;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-modal-confirm" style="flex:1;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#f4f1ea;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;">' + (opts.confirmText || '确认') + '</button></div></div>';
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
      mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#22262f 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:460px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(18, 20, 26, 0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:600;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-modal-cancel" style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;">' + (opts.cancelText || '取消') + '</button><button id="moon-modal-confirm" style="flex:1.4;padding:10px;border-radius:9px;border:1px solid transparent;background:#0369a1;color:#f4f1ea;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;">' + (opts.confirmText || '确认') + '</button></div></div>';
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
        mask.innerHTML = '<div style="background:linear-gradient(175deg,#141826 0%,#22262f 100%);color:#f1f5f9;border:1px solid rgba(148,163,184,0.25);border-radius:18px;padding:22px;width:100%;max-width:520px;max-height:86dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;box-shadow:0 20px 60px rgba(18, 20, 26, 0.8),0 0 30px rgba(99,102,241,0.18);box-sizing:border-box;"><div style="font-size:15px;font-weight:600;color:#fde047;text-align:center;margin-bottom:16px;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:12px;letter-spacing:1.2px;">' + title + '</div><div style="font-size:11.5px;line-height:1.8;color:#cbd5e1;margin-bottom:18px;max-height:60dvh;overflow-y:auto;">' + html + '</div><div style="display:flex;gap:8px;"><button id="moon-step-next" style="flex:1;padding:11px;border-radius:9px;border:1px solid transparent;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:#f4f1ea;font-size:12.5px;cursor:pointer;font-family:inherit;font-weight:600;">' + (opts.confirmText || '确认，进行下一步') + '</button></div></div>';
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

  function getArcadeStorageKey() {
    // 成绩只按当前聊天 ID 隔离：不拼角色卡、不拼玩家人设。
    // 聊天 ID 缺失时不退回全局键，避免不同对话意外共用成绩。
    try {
      const info = getCurrentChatInfo();
      const chatId = String(info && info.chatId || '').trim();
      if (!chatId) return '';
      return ARCADE_CHAT_RECORD_KEY + ':chat:' + encodeURIComponent(chatId);
    } catch (e) { return ''; }
  }
  function normalizeArcadeRecord(record) {
    record = record && typeof record === 'object' ? record : {};
    return {
      score: Math.max(0, parseInt(record.score, 10) || 0),
      achievedAt: Number(record.achievedAt) || 0,
      plays: Math.max(0, parseInt(record.plays, 10) || 0),
      lastScore: Math.max(0, parseInt(record.lastScore, 10) || 0),
      lastPlayedAt: Number(record.lastPlayedAt) || 0,
      history: Array.isArray(record.history) ? record.history.slice(0, 20).map(function(item) {
        return { score: Math.max(0, parseInt(item && item.score, 10) || 0), playedAt: Number(item && item.playedAt) || 0 };
      }) : []
    };
  }
  function writeArcadeRecord(record) {
    const normalized = normalizeArcadeRecord(record);
    const key = getArcadeStorageKey();
    if (!key) return normalized;
    try { mainWin.localStorage.setItem(key, JSON.stringify(normalized)); }
    catch (e) {
      // 隐私模式/存储空间不足时尽力写入聊天元数据，至少不让本次成绩立即丢失。
      try {
        const ctx = getSTCtx();
        if (ctx) { if (!ctx.chatMetadata || typeof ctx.chatMetadata !== 'object') ctx.chatMetadata = {}; ctx.chatMetadata[ARCADE_CHAT_RECORD_KEY] = normalized; if (typeof ctx.saveMetadata === 'function') ctx.saveMetadata(); }
      } catch (ignore) {}
    }
    return normalized;
  }
  function getArcadeRecord() {
    const key = getArcadeStorageKey();
    if (!key) return { score: 0, achievedAt: 0, plays: 0, lastScore: 0, lastPlayedAt: 0, history: [] };
    try {
      const raw = mainWin.localStorage.getItem(key);
      if (raw) return normalizeArcadeRecord(JSON.parse(raw));
    } catch (e) {}
    // 迁移本聊天旧版 chatMetadata 成绩；不会读取其他聊天的存档。
    try {
      const ctx = getSTCtx();
      const legacy = ctx && ctx.chatMetadata && ctx.chatMetadata[ARCADE_CHAT_RECORD_KEY];
      if (legacy && typeof legacy === 'object') return writeArcadeRecord(legacy);
      // 旧版曾使用全局最高分键，只允许迁移一次到当前聊天，随后删除，避免串档。
      const oldGlobal = Math.max(0, parseInt(mainWin.localStorage.getItem(LEGACY_ARCADE_HIGH_SCORE_KEY), 10) || 0);
      if (oldGlobal > 0) {
        const migrated = { score: oldGlobal, achievedAt: 0, plays: 0, lastScore: 0, lastPlayedAt: 0, history: [] };
        writeArcadeRecord(migrated);
        mainWin.localStorage.removeItem(LEGACY_ARCADE_HIGH_SCORE_KEY);
        return normalizeArcadeRecord(migrated);
      }
    } catch (e) {}
    return { score: 0, achievedAt: 0, plays: 0, lastScore: 0, lastPlayedAt: 0, history: [] };
  }
  function getArcadeHighScore() {
    return Math.max(0, parseInt(getArcadeRecord().score, 10) || 0);
  }
  function saveArcadeHighScore(score) {
    const current = getArcadeRecord();
    const nextScore = Math.max(0, Math.floor(Number(score) || 0));
    if (nextScore <= current.score) return current;
    current.score = nextScore;
    current.achievedAt = Date.now();
    return writeArcadeRecord(current);
  }
  function saveArcadeRun(score) {
    const current = getArcadeRecord(), nextScore = Math.max(0, Math.floor(Number(score) || 0)), now = Date.now();
    const isRecord = nextScore > current.score;
    const record = {
      score: isRecord ? nextScore : current.score,
      achievedAt: isRecord ? now : current.achievedAt,
      plays: current.plays + 1,
      lastScore: nextScore,
      lastPlayedAt: now,
      history: [{ score: nextScore, playedAt: now }].concat(current.history).slice(0, 20)
    };
    return writeArcadeRecord(record);
  }
  function formatArcadeRecordTime(timestamp, score) {
    const date = new Date(Number(timestamp) || 0);
    if (!timestamp || !isFinite(date.getTime())) return Number(score) > 0 ? '旧纪录时间未记录' : '暂无纪录时间';
    const pad = function(value) { return String(value).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  let stopArcadeRunner = null;
  function buildArcadeOfflineDocument(difficulty) {
    const name = ['easy', 'normal', 'hard', 'hell'].indexOf(difficulty) >= 0 ? difficulty : 'normal';
    const levels = { easy:{start:2.4,max:4.2,growth:220,x1:325,x2:560,gap:135}, normal:{start:3,max:6,growth:140,x1:290,x2:480,gap:90}, hard:{start:3.8,max:7.2,growth:100,x1:260,x2:420,gap:55}, hell:{start:4.4,max:8,growth:80,x1:235,x2:370,gap:38} };
    const L=levels[name];
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#7d896f;color:#18271a;font:12px monospace}*{box-sizing:border-box}canvas{display:block;width:100%;height:100%;touch-action:manipulation;image-rendering:pixelated}</style></head><body><canvas id="g" width="640" height="188"></canvas><script>'+
      '(function(){"use strict";var c=document.getElementById("g"),x=c.getContext("2d"),w=c.width,h=c.height,f=h-30,score=0,speed='+L.start+',tick=0,dead=false,jy=0,jv=0,last=0,acc=0,raf=0,stopped=false,sent=false,obs=[{x:'+(L.x1*2)+',w:20,h:36},{x:'+(L.x2*2)+',w:24,h:50}];'+
      'function end(){if(sent)return;sent=true;parent.postMessage({type:"moon-arcade-run-end",score:Math.floor(score)},"*")}function reset(){score=0;speed='+L.start+';tick=0;dead=false;jy=0;jv=0;sent=false;obs=[{x:'+(L.x1*2)+',w:20,h:36},{x:'+(L.x2*2)+',w:24,h:50}]}function jump(){if(dead){reset();return}if(jy===0)jv=-16}function key(e){if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}}'+
      'function step(){tick++;score+=.16;speed=Math.min('+(L.max*2)+','+(L.start*2)+'+score/'+(L.growth/2)+');jy+=jv;jv+=.84;if(jy>0){jy=0;jv=0}obs.forEach(function(o){o.x-=speed;if(o.x<-o.w){o.x=w+'+(L.gap*2)+'+Math.random()*220;o.h=28+Math.floor(Math.random()*34);o.w=18+Math.floor(Math.random()*28)}var px=60,pw=28,py=f-42+jy,oy=f-o.h;if(!dead&&px<o.x+o.w&&px+pw>o.x&&py+42>oy&&py<f){dead=true;jy=0;jv=0;end()}})}'+
      'function draw(){x.clearRect(0,0,w,h);x.fillStyle="#7d896f";x.fillRect(0,0,w,h);x.fillStyle="#18271a";for(var i=0;i<w;i+=32){x.fillRect((i+Math.floor(tick/3)%32)%w,f+12,16,3)}x.fillRect(0,f,w,3);x.fillRect(60,f-42+jy,28,28);x.fillRect(78,f-36+jy,4,4);x.fillRect(66,f-14+jy,6,14);x.fillRect(82,f-14+jy,6,14);obs.forEach(function(o){x.fillRect(Math.round(o.x),f-o.h,o.w,o.h);x.fillRect(Math.round(o.x)-6,f-o.h+10,8,6)});x.font="bold 18px monospace";x.fillStyle="#18271a";x.fillText("SCORE "+String(Math.floor(score)).padStart(5,"0"),12,24);if(dead){x.fillStyle="rgba(20,30,20,.72)";x.fillRect(0,0,w,h);x.fillStyle="#f1f5e8";x.textAlign="center";x.font="bold 22px monospace";x.fillText("GAME OVER",w/2,h/2-4);x.font="14px monospace";x.fillText("TAP / SPACE TO RETRY",w/2,h/2+22);x.textAlign="left"}}'+
      'function frame(t){if(stopped)return;if(document.hidden){last=t;raf=requestAnimationFrame(frame);return}if(!last)last=t;acc+=Math.min(100,t-last);last=t;var ms=1000/30;while(acc>=ms&&!dead){step();acc-=ms}if(dead)acc=0;draw();raf=requestAnimationFrame(frame)}c.addEventListener("pointerdown",jump);window.addEventListener("keydown",key);document.addEventListener("visibilitychange",function(){last=0;acc=0});window.addEventListener("pagehide",function(){stopped=true;cancelAnimationFrame(raf)});draw();raf=requestAnimationFrame(frame)})();<\/script></body></html>';
  }
  function mountArcadeRunner(root, options) {
    options=options||{}; const frame=root.querySelector('#moon-arcade-frame'); if(!frame)return null;
    let stopped=false;
    const stats=root.querySelector('#moon-arcade-session-stats'), initial=getArcadeRecord();
    if(stats)stats.textContent='本聊天 '+(initial.plays||0)+' 局 · 最近成绩 '+String(initial.lastScore||0).padStart(5,'0')+' · 近况 '+(initial.history||[]).slice(0,5).map(function(r){return String(r.score||0)}).join(' / ');
    const onMessage=function(event){if(stopped||event.source!==frame.contentWindow||!event.data||event.data.type!=='moon-arcade-run-end')return;
      const score=Math.max(0,Math.floor(Number(event.data.score)||0)),record=saveArcadeRun(score);
      const high=root.querySelector('#moon-arcade-hi-score'),time=root.querySelector('#moon-arcade-record-time');
      if(high)high.textContent=String(record.score).padStart(5,'0');
      if(time)time.textContent='RECORD TIME · '+formatArcadeRecordTime(record.achievedAt,record.score);
      if(stats)stats.textContent='本聊天 '+record.plays+' 局 · 最近成绩 '+String(score).padStart(5,'0')+' · 近况 '+(record.history||[]).slice(0,5).map(function(r){return String(r.score||0)}).join(' / ');
    };
    mainWin.addEventListener('message',onMessage);frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('title','MOON POCKET ARCADE 离线小游戏');frame.srcdoc=buildArcadeOfflineDocument(options.difficulty||'normal');
    const stop=function(){if(stopped)return;stopped=true;try{mainWin.removeEventListener('message',onMessage)}catch(e){}try{frame.srcdoc='<!doctype html><html><body></body></html>'}catch(e){}};
    if(!options.standalone)stopArcadeRunner=stop;return stop;
  }

  function showLoadingDialog(text, withArcade) {
    closeLoadingDialog();
    const mask = mainDoc.createElement('div'); mask.id = 'moon-loading-mask';
    mask.className = withArcade ? 'moon-pixel-loading' : '';
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483660;background:rgba(5,0,8,0.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;';
    mask.innerHTML = withArcade
      ? '<div class="mp-arcade-box" style="position:relative;"><button type="button" id="moon-arcade-dismiss" aria-label="收起小游戏" style="position:absolute;right:9px;top:9px;z-index:5;border:1px solid #bd82a9;background:#211525;color:#ffe8f5;padding:7px 10px;font:12px monospace;cursor:pointer;">收起 ×</button><div class="mp-arcade-brand">★ MOON ARCADE ★</div><div class="mp-arcade-title" id="moon-loading-text">' + text + '</div><div class="mp-arcade-hud"><span>SCORE <b id="moon-arcade-score">00000</b></span><span>HI <b id="moon-arcade-hi-score">' + String(getArcadeHighScore()).padStart(5, '0') + '</b></span></div><div class="mp-arcade-record-time" id="moon-arcade-record-time">RECORD TIME · ' + formatArcadeRecordTime(getArcadeRecord().achievedAt, getArcadeHighScore()) + '</div><iframe id="moon-arcade-frame" class="mp-arcade-frame" title="离线像素小游戏" sandbox="allow-scripts"></iframe><div class="mp-arcade-session-stats" id="moon-arcade-session-stats"></div><div class="mp-arcade-state" id="moon-arcade-state">空格 / ↑ / 点击游戏画面跳跃</div><div class="mp-arcade-foot">本地离线运行 · 成绩按当前聊天保存 · 收起后可从系统面板随时再玩</div></div>'
      : '<div class="mp-loading-box"><div style="margin-bottom:12px;" id="moon-loading-text">⏳ ' + text + '</div><div class="mp-loading-track"><div class="mp-loading-bar"></div></div><div style="font-size:10.5px;color:#d68cbd;margin-top:8px;">请稍候</div></div>';
    mainDoc.body.appendChild(mask);
    if (withArcade) {
      mountArcadeRunner(mask);
      const dismiss = mask.querySelector('#moon-arcade-dismiss');
      if (dismiss) dismiss.addEventListener('click', function() { closeLoadingDialog(); });
    }
  }
  function closeLoadingDialog() { if (stopArcadeRunner) { try { stopArcadeRunner(); } catch (e) {} stopArcadeRunner = null; } const m = mainDoc.getElementById('moon-loading-mask'); if (m) { try { m.remove(); } catch (e) {} } }
  // 离线街机只用于「月相自己发起、需要玩家等待」的长任务：
  // callOpeningModel 的独立 API 调用、首次系统自检。这两处各自在 finally 里关闭等待框。
  // 不要挂到酒馆的 generation_started 上——那是「每次发消息 AI 开始生成」，
  // 会变成玩家一操作就被等待框盖住。
  
  function showResultDialog(title, html, onOpenExtra) { showModalDialog(title, html, null, { confirmText: '我已截图 / 关闭', onOpen: onOpenExtra }); }
  function wrapMaskClose(mask, onClosed) {
    if (!mask || typeof mask.remove !== 'function') return;
    const origRemove = mask.remove.bind(mask); let closed = false;
    mask.remove = function() { if (closed) return; closed = true; try { origRemove(); } catch (e) {} if (typeof onClosed === 'function') { try { onClosed(); } catch (e) {} } };
  }
