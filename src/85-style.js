  function injectStyle() {
    let el = mainDoc.getElementById(STYLE_ID);
    if (!el) { el = mainDoc.createElement('style'); el.id = STYLE_ID; mainDoc.head.appendChild(el); }
    el.textContent = '#moon-phase-mask{position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:2147483640;background:radial-gradient(circle at center,rgba(15,23,42,0.85) 0%,rgba(2,6,23,0.92) 100%);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}' +
      '#moon-phase-mask.open{display:flex;animation:moon-fade 0.28s cubic-bezier(0.16,1,0.3,1);}' +
      '#moon-phase-panel{background:linear-gradient(170deg,rgba(20,24,38,0.95) 0%,rgba(10,12,22,0.98) 100%);color:#e2e8f0;border:1px solid rgba(148,163,184,0.18);border-radius:20px;padding:22px;width:100%;max-width:460px;max-height:88dvh;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 25px 60px rgba(0,0,0,0.75);box-sizing:border-box;}' +
      '#moon-phase-panel .mp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid rgba(148,163,184,0.12);}' +
      '#moon-phase-panel .mp-title-orb{font-size:20px;}' +
      '#moon-phase-panel .mp-title{font-size:15px;font-weight:700;color:#f8fafc;letter-spacing:1px;}' +
      '#moon-phase-panel .mp-badge{font-size:9px;background:rgba(148,163,184,0.12);padding:2px 7px;border-radius:12px;color:#94a3b8;border:1px solid rgba(148,163,184,0.2);font-weight:600;}' +
      '#moon-phase-panel .mp-close{background:transparent;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:4px;border-radius:8px;}' +
      '.mp-card{background:rgba(15,23,42,0.5);border:1px solid rgba(148,163,184,0.1);border-radius:14px;padding:12px 14px;margin-bottom:12px;}' +
      '.mp-label{font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px;}' +
      '.mp-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
      '.mp-toggle-info{font-size:11.5px;line-height:1.4;}' +
      '.mp-toggle-title{font-weight:700;color:#f1f5f9;display:flex;align-items:center;gap:5px;}' +
      '.mp-toggle-desc{font-size:10px;color:#64748b;margin-top:2px;}' +
      '#moon-phase-panel .mp-antisl,#moon-phase-panel .mp-extra-btn,#moon-phase-panel .mp-cardmode-btn,#moon-phase-panel .mp-fanfic-btn,#moon-phase-panel .mp-safelock-btn,#moon-phase-panel .mp-pacing-btn{padding:6px 12px;border-radius:9px;border:1px solid rgba(148,163,184,0.15);background:#0f172a;color:#94a3b8;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '#moon-phase-panel .mp-antisl.on{border-color:rgba(239,68,68,0.6);background:#991b1b;color:#fff;}' +
      '#moon-phase-panel .mp-extra-btn.on{border-color:rgba(56,189,248,0.6);background:#0369a1;color:#fff;}' +
      '#moon-phase-panel .mp-cardmode-btn.on{border-color:rgba(168,85,247,0.6);background:#4c1d95;color:#fff;}' +
      '#moon-phase-panel .mp-pacing-btn.Adi{border-color:rgba(56,189,248,0.6);background:rgba(56,189,248,0.15);color:#7dd3fc;}' +
      '#moon-phase-panel .mp-pacing-btn.And{border-color:rgba(168,85,247,0.6);background:rgba(168,85,247,0.15);color:#c084fc;}' +
      '#moon-phase-panel .mp-pacing-btn.All{border-color:rgba(244,63,94,0.6);background:rgba(244,63,94,0.15);color:#fda4af;}' +
      '#moon-phase-panel .mp-safelock-btn.on{border-color:rgba(110,231,183,0.5);background:#064e3b;color:#6ee7b7;}' +
      '#moon-phase-panel .mp-safelock-btn.off{border-color:rgba(251,191,36,0.5);background:#451a03;color:#fcd34d;}' +
      '#moon-phase-panel .mp-fanfic-btn.on{border-color:rgba(56,189,248,0.6);background:#0c4a6e;color:#7dd3fc;}' +
      '#moon-phase-panel .mp-fate{display:flex;align-items:center;gap:9px;margin-top:10px;padding:9px 12px;border-radius:10px;font-size:11px;font-weight:600;}' +
      '#moon-phase-panel .mp-fate.idle{background:rgba(16,185,129,0.08);color:#6ee7b7;border:1px solid rgba(16,185,129,0.22);}' +
      '#moon-phase-panel .mp-fate.active{background:rgba(244,63,94,0.12);color:#fda4af;border:1px solid rgba(244,63,94,0.35);}' +
      '.mp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-bottom:12px;}' +
      '#moon-phase-panel .mp-btn{padding:9px 6px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid rgba(148,163,184,0.12);background:#0f172a;color:#cbd5e1;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px;}' +
      '#moon-phase-panel .mp-btn:hover{background:#1e293b;color:#f8fafc;}' +
      '#moon-phase-panel .mp-btn-highlight{border-color:rgba(56,189,248,0.3) !important;background:#0c2540 !important;color:#7dd3fc !important;}' +
      '#moon-phase-panel .mp-btn-user{border-color:rgba(244,114,182,0.3) !important;background:#3b0a2a !important;color:#f9a8d4 !important;}' +
      '#moon-phase-panel .mp-status{background:#05070e;border:1px solid rgba(148,163,184,0.1);border-radius:12px;padding:12px 14px;font-size:10.5px;color:#94a3b8;line-height:1.65;max-height:230px;overflow-y:auto;font-family:monospace;}' +
      '.mp-log-subhead{margin-top:8px;margin-bottom:4px;color:#fde047;font-size:11px;font-weight:700;}' +
      '@keyframes moon-fade{from{opacity:0;transform:scale(0.96) translateY(4px);}to{opacity:1;transform:scale(1) translateY(0);}}' +
      '@keyframes moon-progress-slide{0%{left:-40%;}100%{left:105%;}}' +
      '@keyframes moon-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}' +
      '@font-face{font-family:"MP Fusion Pixel";src:url("https://fontpixel.com/downloads/fusion-pixel-monospaced-zh-Hans-12px-square.woff2") format("woff2");font-style:normal;font-weight:400;font-display:swap;}' +
      '#moon-phase-panel{background:repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0,rgba(255,255,255,.012) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#160b18 0%,#09060d 100%) !important;border:2px solid #f472d0 !important;border-radius:4px !important;padding:16px !important;font-family:"Courier New",monospace !important;box-shadow:0 0 0 3px #2a1029,0 0 28px rgba(244,114,208,.26) !important;image-rendering:pixelated;}' +
      '#moon-phase-panel .mp-head{border-bottom:2px dashed rgba(244,114,208,.45) !important;}' +
      '#moon-phase-panel .mp-display-mode-switch{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:10px 0;padding:4px;background:#0b080d;border:1px solid #59304d;box-shadow:inset 0 0 0 1px rgba(244,114,208,.04);}' +
      '#moon-phase-panel .mp-display-mode-switch button{min-height:37px;padding:7px 9px;border:1px solid #42253a;background:#160e18;color:#b7a2b4;font:700 12px/1.4 "MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","PixelMplus12","Courier New",monospace;letter-spacing:.3px;cursor:pointer;}' +
      '#moon-phase-panel .mp-display-mode-switch button.active{border-color:#f472d0;background:#35142e;color:#ffd3ef;box-shadow:inset 0 0 0 1px rgba(255,190,232,.12),2px 2px 0 #35152f;}' +
      '#moon-phase-panel.mp-display-arcade .mp-system-content{display:none !important;}' +
      '#moon-phase-panel.mp-display-arcade .mp-mode-select-card{margin-bottom:0;}' +
      '#moon-phase-panel .mp-title{color:#ffb8eb !important;text-shadow:2px 2px #5a164d;letter-spacing:.5px !important;font-size:12px !important;}' +
      '#moon-phase-panel .mp-title-orb{filter:drop-shadow(0 0 5px #f472d0);}' +
      '#moon-phase-panel .mp-card{background:#100a13 !important;border:1px solid rgba(244,114,208,.32) !important;border-radius:3px !important;box-shadow:inset 0 0 0 1px rgba(244,114,208,.05);}' +
      '#moon-phase-panel .mp-lcd-card{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(145deg,#26352a 0%,#18251c 48%,#111c15 100%) !important;border:2px solid #71866b !important;box-shadow:inset 0 0 0 2px rgba(190,216,172,.14),inset 0 0 24px rgba(151,186,129,.15),0 0 0 3px #0a120d,0 0 14px rgba(129,176,113,.12) !important;color:#d2e5c8;}' +
      '#moon-phase-panel .mp-lcd-card:before{content:"";position:absolute;inset:4px;z-index:0;pointer-events:none;border:1px solid rgba(206,225,184,.13);background:linear-gradient(115deg,rgba(230,244,207,.08),transparent 28%,transparent 70%,rgba(197,224,174,.035)),repeating-linear-gradient(to bottom,rgba(210,238,190,.065) 0,rgba(210,238,190,.065) 1px,transparent 1px,transparent 3px),repeating-linear-gradient(to right,rgba(190,224,171,.035) 0,rgba(190,224,171,.035) 1px,transparent 1px,transparent 4px);opacity:.82;}' +
      '#moon-phase-panel .mp-lcd-card>*{position:relative;z-index:1;}' +
      '#moon-phase-panel .mp-lcd-card .mp-label{color:#d6ebc7 !important;text-shadow:0 0 5px rgba(184,222,157,.28);}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn{border-radius:2px !important;border-color:#58735b !important;background:rgba(15,30,20,.76) !important;color:#bacdb0 !important;box-shadow:inset 0 0 0 1px rgba(191,222,169,.045),2px 2px 0 rgba(3,11,7,.55) !important;}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn.active{border-color:#a7c78b !important;background:linear-gradient(145deg,#314b34,#263d2c) !important;color:#f0ffdf !important;box-shadow:inset 0 0 0 1px rgba(218,242,187,.16),0 0 9px rgba(171,213,139,.18),2px 2px 0 rgba(3,11,7,.65) !important;}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn div{color:inherit !important;}' +
      '#moon-phase-panel .mp-lcd-card .mp-mode-btn div:last-child{opacity:.9 !important;}' +
      '#moon-phase-panel .mp-lcd-card>div[style*="margin-top:8px"]{color:#b8ccb0 !important;}' +
      '#moon-phase-panel .mp-lcd-card{padding:9px !important;background:#101610 !important;border:3px solid #374a37 !important;box-shadow:inset 0 0 0 2px #080d08,0 0 0 2px #080d08 !important;color:#18271a !important;}' +
      '#moon-phase-panel .mp-lcd-card:before{display:none !important;}' +
      '#moon-phase-panel .mp-lcd-screen{position:relative;overflow:hidden;padding:12px;background:#7d896f;color:#182019;border:3px solid #182019;box-shadow:none;font:14px/1.7 "MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","PixelMplus12","Courier New",monospace;letter-spacing:.15px;-webkit-font-smoothing:none;font-smooth:never;image-rendering:pixelated;}' +
      '#moon-phase-panel .mp-lcd-screen>*{position:relative;z-index:1;color:#182019 !important;text-shadow:none !important;}' +
      '#moon-phase-panel .mp-lcd-screen-head,#moon-phase-panel .mp-lcd-character-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:7px;border-bottom:1px solid #182019;font-size:12px;font-weight:bold;letter-spacing:.3px;}' +
      '#moon-phase-panel .mp-lcd-screen-head b{padding:3px 5px;border:1px solid #182019;font-size:10px;}' +
      '#moon-phase-panel .mp-lcd-world-time{padding:9px 0 7px;border-bottom:1px solid #182019;font-weight:bold;font-size:13px;}' +
      '#moon-phase-panel .mp-lcd-selection{padding:8px 0;border-bottom:1px solid #182019;line-height:1.7;}' +
      '#moon-phase-panel .mp-lcd-selection b{display:block;margin-bottom:2px;}' +
      '#moon-phase-panel .mp-lcd-selection span{display:block;font-size:13px;}' +
      '#moon-phase-panel .mp-lcd-character-head{margin-top:9px;padding-bottom:6px;}' +
      '#moon-phase-panel .mp-lcd-character-select{max-width:55%;padding:4px 6px;background:#7d896f;border:1px solid #182019;color:#182019;font:12px "Courier New",monospace;}' +
      '#moon-phase-panel .mp-lcd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:8px 0 5px;}' +
      '#moon-phase-panel .mp-lcd-stats span{padding:5px 3px;border:1px solid #182019;text-align:center;font-size:12px;}' +
      '#moon-phase-panel .mp-lcd-stats b{display:block;font-size:14px;}' +
      '#moon-phase-panel .mp-lcd-mood-row{display:flex;align-items:center;gap:9px;padding:6px 0;font-size:13px;}' +
      '#moon-phase-panel .mp-lcd-pixel-face{display:grid;grid-template-columns:repeat(5,6px);grid-auto-rows:6px;gap:1px;padding:4px;background:#7d896f;image-rendering:pixelated;}' +
      '#moon-phase-panel .mp-lcd-pixel-face i{display:block;width:6px;height:6px;background:transparent;}' +
      '#moon-phase-panel .mp-lcd-pixel-face i.on{background:#182019;}' +
      '#moon-phase-panel .mp-lcd-voice{padding:6px 0;border-top:1px solid #182019;line-height:1.7;font-size:13px;}' +
      '#moon-phase-panel .mp-lcd-voice small{font-size:11px;font-weight:bold;}' +
      '#moon-phase-panel .mp-lcd-voice div{max-height:72px;overflow:auto;overflow-wrap:anywhere;}' +
      '#moon-phase-panel .mp-lcd-empty{padding:20px 6px;text-align:center;line-height:1.8;font-size:13px;}' +
      '#moon-phase-panel .mp-lcd-screen-foot{padding-top:7px;border-top:1px solid #182019;text-align:right;font-size:10px;letter-spacing:.3px;}' +
      '#moon-phase-panel .mp-lcd-pages{min-height:260px;touch-action:pan-y;}' +
      '#moon-phase-panel .mp-lcd-page{display:none;min-height:260px;animation:moon-fade .12s ease-out;}' +
      '#moon-phase-panel .mp-lcd-page.active{display:block;}' +
      '#moon-phase-panel .mp-lcd-page-title{padding:7px 0;border-bottom:1px solid #182019;font-weight:bold;font-size:13px;}' +
      '#moon-phase-panel .mp-lcd-difficulty{display:flex;align-items:center;gap:8px;padding:10px 0 7px;border-bottom:1px solid #182019;}' +
      '#moon-phase-panel .mp-lcd-difficulty>strong{font-size:14px;}' +
      '#moon-phase-panel .mp-lcd-selection{min-height:94px;}' +
      '#moon-phase-panel .mp-lcd-page-nav{display:grid;grid-template-columns:38px 1fr 38px;align-items:center;gap:8px;margin-top:6px;padding-top:7px;border-top:1px solid #182019;}' +
      '#moon-phase-panel .mp-lcd-page-nav button,#moon-phase-panel .mp-lcd-small-btn{min-height:30px;padding:4px 7px;border:1px solid #182019;background:#707d63;color:#182019;font:700 12px "MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","PixelMplus12","Courier New",monospace;cursor:pointer;}' +
      '#moon-phase-panel .mp-lcd-page-nav button:active,#moon-phase-panel .mp-lcd-small-btn:active{transform:translate(1px,1px);}' +
      '#moon-phase-panel .mp-lcd-page-indicator{display:flex;justify-content:center;align-items:center;gap:9px;text-align:center;font-size:11px;}' +
      '#moon-phase-panel .mp-lcd-page-indicator b{font-size:12px;}' +
      '#moon-phase-panel .mp-lcd-character-head{margin-top:7px;}' +
      '#moon-phase-panel .mp-lcd-event-list,#moon-phase-panel #moon-token-box{max-height:220px;overflow:auto;overscroll-behavior:contain;padding:6px 2px;}' +
      '#moon-phase-panel .mp-lcd-event-meta{padding:5px 0;border-bottom:1px dashed #354333;font-size:12px;}' +
      '#moon-phase-panel .mp-lcd-event-entry{padding:7px 8px;margin:6px 0;border:1px solid #495744;background:rgba(225,235,214,.18);font-size:12px;line-height:1.7;overflow-wrap:anywhere;}' +
      '#moon-phase-panel .mp-lcd-event-entry b{display:block;margin-bottom:3px;font-size:13px;}' +
      '#moon-phase-panel #moon-token-box,#moon-phase-panel #moon-token-box *{color:#182019 !important;}' +
      '#moon-phase-panel #moon-token-box{font:12px/1.7 "MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","PixelMplus12","Courier New",monospace;}' +
      '#moon-phase-panel #moon-token-box [style*="border-top"]{border-color:#465240 !important;}' +
      '#moon-phase-panel .mp-lcd-token-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #182019;font-size:13px;font-weight:bold;}' +
      '#moon-phase-panel .mp-moon-pixel{display:inline-grid;grid-template-columns:repeat(7,2px);grid-template-rows:repeat(7,2px);gap:1px;width:20px;height:20px;flex:0 0 20px;vertical-align:middle;image-rendering:pixelated;}' +
      '#moon-phase-panel .mp-moon-pixel i{display:block;width:2px;height:2px;background:transparent;}' +
      '#moon-phase-panel .mp-moon-pixel i.lit{background:#eef3e3;}' +
      '#moon-phase-panel .mp-moon-pixel i.shadow{background:#182019;}' +
      '#moon-phase-panel .mp-mode-moon{display:flex;justify-content:center;align-items:center;height:23px;margin-bottom:3px;}' +
      '#moon-phase-panel .mp-mode-select-card .mp-mode-btn .mp-mode-moon{font-size:18px !important;line-height:1 !important;filter:drop-shadow(0 0 5px rgba(244,114,208,0.45));}' +
      '#moon-phase-panel .mp-difficulty-fold>summary{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;background:#180d1a;border:1px solid #70345f;border-bottom-color:#f472d0;color:#ffc4e9;font-size:13px;font-weight:bold;cursor:pointer;list-style:none;}' +
      '#moon-phase-panel .mp-difficulty-fold>summary::-webkit-details-marker{display:none;}' +
      '#moon-phase-panel .mp-difficulty-fold>summary i{color:#f472d0;font-style:normal;transition:transform .12s;}' +
      '#moon-phase-panel .mp-difficulty-fold[open]>summary{border-color:#f472d0;background:#251024;}' +
      '#moon-phase-panel .mp-difficulty-fold[open]>summary i{transform:rotate(180deg);}' +
      '#moon-phase-panel .mp-difficulty-content{padding:8px;}' +
      '#moon-phase-panel .mp-settings-fold>summary{color:#ffd1f1 !important;}' +
      '#moon-phase-panel .mp-mode-select-card .mp-mode-btn{border-radius:2px !important;border-color:#643052 !important;background:#170d1a !important;color:#f8d8ee !important;box-shadow:2px 2px 0 #35152f !important;}' +
      '#moon-phase-panel .mp-mode-select-card .mp-mode-btn.active{background:#32112b !important;color:#ffc4e9 !important;border-color:#f472d0 !important;}' +
      '#moon-phase-panel .mp-mode-select-card .mp-mode-btn{min-height:68px;font-size:11.5px !important;white-space:nowrap;}' +
      '#moon-phase-panel .mp-mode-select-card .mp-mode-btn div:first-child{font-size:18px !important;}' +
      '#moon-phase-panel .mp-mode-select-card .mp-mode-btn div:last-child{font-size:10px !important;}' +
      '#moon-phase-panel .mp-mode-select-card>div[style*="margin-top:8px"]{font-size:13px !important;line-height:1.7 !important;}' +
      '#moon-phase-panel .mp-mode-select-card>div[style*="margin-top:8px"] b{font-size:14px !important;}' +
      '#moon-phase-panel .mp-label,#moon-phase-panel .mp-toggle-title{color:#ffd1f1 !important;}' +
      '#moon-phase-panel .mp-btn,#moon-phase-panel .mp-mode-btn,#moon-phase-panel .mp-antisl,#moon-phase-panel .mp-extra-btn,#moon-phase-panel .mp-cardmode-btn,#moon-phase-panel .mp-fanfic-btn,#moon-phase-panel .mp-safelock-btn,#moon-phase-panel .mp-pacing-btn{border-radius:2px !important;font-family:"Courier New",monospace !important;box-shadow:2px 2px 0 #35152f;transition:transform .08s,filter .08s;}' +
      '#moon-phase-panel .mp-btn{background:#170d1a !important;border-color:#643052 !important;color:#f8d8ee !important;}' +
      '#moon-phase-panel .mp-btn:hover{background:#31132b !important;border-color:#f472d0 !important;transform:translate(-1px,-1px);filter:brightness(1.12);}' +
      '#moon-phase-panel .mp-btn-highlight{background:#32112b !important;border-color:#f472d0 !important;color:#ffb8eb !important;}' +
      '#moon-phase-panel .mp-btn-user{background:#241025 !important;border-color:#d946a6 !important;color:#ffc4e9 !important;}' +
      '#moon-phase-panel .mp-status{background:#08060a !important;border:1px dashed #7a3a68 !important;border-radius:2px !important;color:#e7b9d8 !important;}' +
      '#moon-phase-panel .mp-badge{border-radius:2px !important;background:#2a1126 !important;border-color:#87416e !important;color:#ffc4e9 !important;}' +
      '#moon-phase-panel button.mp-badge{appearance:none;-webkit-appearance:none;font-family:inherit;line-height:1.35;cursor:pointer;}' +
      '#moon-phase-panel .mp-fate{border-radius:2px !important;}' +
      '#moon-modal-mask.mp-pixel-modal>div{background:linear-gradient(180deg,#170b18,#09060d) !important;border:2px solid #f472d0 !important;border-radius:4px !important;font-family:"Courier New",monospace !important;box-shadow:0 0 0 3px #2a1029,0 0 28px rgba(244,114,208,.24) !important;}' +
      '#moon-modal-mask.mp-pixel-modal>div>div:first-child,#moon-firstboot-mask>div>div:first-child{color:#ff8cdb !important;border-color:rgba(244,114,208,.45) !important;text-shadow:2px 2px #48153e;}' +
      '#moon-modal-mask.mp-pixel-modal button{border-radius:2px !important;background:#37102f !important;border:1px solid #f472d0 !important;color:#ffe1f5 !important;font-family:"Courier New",monospace !important;box-shadow:2px 2px 0 #42173a;}' +
      '#moon-modal-mask.mp-pixel-modal button:hover{filter:brightness(1.2);}' +
      '#moon-firstboot-mask{font-family:"Courier New",monospace !important;}' +
      '#moon-firstboot-mask>div{border-radius:4px !important;border:2px solid #f472d0 !important;background:linear-gradient(180deg,#170b18,#09060d) !important;box-shadow:0 0 0 3px #2a1029,0 0 28px rgba(244,114,208,.25) !important;}' +
      '#moon-firstboot-mask button{border-radius:2px !important;background:#37102f !important;border-color:#f472d0 !important;}' +
      '.mp-pixel-loading{font-family:"Courier New",monospace !important;}' +
      '.mp-loading-box{padding:20px 28px;border-radius:3px;background:#100914;border:2px solid #f472d0;color:#ffe1f5;font-size:13px;text-align:center;min-width:260px;max-width:360px;box-sizing:border-box;box-shadow:0 0 0 3px #2a1029,0 0 26px rgba(244,114,208,.2);}' +
      '.mp-loading-track{height:5px;border:1px solid #74305f;background:#1a101b;overflow:hidden;position:relative;}' +
      '.mp-loading-bar{position:absolute;top:0;height:100%;width:38%;background:#f472d0;animation:moon-progress-slide 1.25s ease-in-out infinite;}' +
      '.mp-arcade-box{width:min(360px,100%);box-sizing:border-box;padding:14px 12px 10px;background:#7d896f;border:3px solid #182019;outline:3px solid #080d08;color:#182019;text-align:center;box-shadow:0 5px 0 #080d08;font-family:"MP Fusion Pixel","Zpix","Fusion Pixel 10px Monospaced SC","PixelMplus12","Courier New",monospace;-webkit-font-smoothing:none;font-smooth:never;image-rendering:pixelated;}' +
      '.mp-arcade-brand{font-size:12px;letter-spacing:1px;color:#18271a;margin-bottom:8px;}' +
      '.mp-arcade-title{font-size:13px;line-height:1.6;color:#18271a;margin:0 auto 8px;max-width:320px;}' +
      '.mp-arcade-hud{display:flex;justify-content:space-between;font-size:12px;color:#18271a;margin:0 auto 5px;max-width:320px;}' +
      '.mp-arcade-hud b{color:#f0ffdb;font-weight:700;margin-left:4px;text-shadow:0 0 5px rgba(200,230,171,.24);}' +
      '.mp-arcade-record-time{margin:-1px auto 5px;color:#18271a;font-size:8px;letter-spacing:.4px;}' +
      '#moon-arcade-canvas{display:block;width:min(320px,100%);height:auto;margin:0 auto;border:2px solid #64775e;background:#17241b;box-shadow:inset 0 0 12px rgba(8,16,10,.5);image-rendering:pixelated;touch-action:manipulation;}' +
      '.mp-arcade-state{min-height:18px;margin-top:8px;color:#18271a;font-size:12px;letter-spacing:.5px;}' +
      '.mp-arcade-foot{margin-top:6px;color:#18271a;font-size:12px;line-height:1.5;}' +
      '.mp-arcade-exit{margin-top:8px;padding:5px 10px;background:#27352a;border:1px solid #71866b;color:#dce9cc;font:10px "Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #101812;}' +
      '.mp-arcade-brand,.mp-arcade-title,.mp-arcade-hud,.mp-arcade-hud b,.mp-arcade-state,.mp-arcade-foot{color:#18271a !important;text-shadow:none !important;}' +
      '#moon-arcade-canvas{border-color:#182019 !important;background:#7d896f !important;box-shadow:none !important;}' +
      '.mp-arcade-exit{background:#7d896f !important;border-color:#182019 !important;color:#182019 !important;}' +
      '.mp-lcd-game{padding:8px !important;}' +
      '.mp-lcd-game .mp-arcade-box{width:100%;padding:9px 7px 8px;border-width:2px;outline:2px solid #101912;}' +
      '.mp-lcd-game .mp-arcade-brand{margin-bottom:5px;font-size:12px;}' +
      '.mp-lcd-game .mp-arcade-hud{font-size:11px;}' +
      '.mp-lcd-game .mp-arcade-foot{font-size:11px;}' +
      '#moon-loading-mask.mp-pixel-loading{font-family:"Courier New",monospace !important;}' +
      '.mp-settings-fold{margin:-2px 0 10px;}' +
      '.mp-settings-fold>summary{list-style:none;display:flex;justify-content:space-between;align-items:center;padding:10px 11px;background:#180d1a;border:1px solid #70345f;color:#ffc4e9;font:700 11px "Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #35152f;}' +
      '.mp-settings-fold>summary::-webkit-details-marker{display:none;}' +
      '.mp-settings-fold>summary span{color:#f472d0;transition:transform .15s;}' +
      '.mp-settings-fold[open]>summary{margin-bottom:11px;border-color:#f472d0;background:#251024;}' +
      '.mp-settings-fold[open]>summary span{transform:rotate(180deg);}' +
      '.mp-menu-label,.mp-sub-label{font:700 9px "Courier New",monospace;color:#f472d0;letter-spacing:1.5px;margin:0 0 9px;text-shadow:1px 1px #45153a;}' +
      '.mp-menu-grid{display:grid;grid-template-columns:1fr;gap:8px;}' +
      '.mp-menu-card{width:100%;min-height:54px;display:flex;align-items:center;gap:10px;padding:8px 10px;text-align:left;background:linear-gradient(180deg,#1c1020,#100a13);border:1px solid #74355f;color:#ffe1f5;font-family:"Courier New",monospace;cursor:pointer;box-shadow:3px 3px 0 #35152f;}' +
      '.mp-menu-card:hover,.mp-menu-card:focus{background:#2a1226;border-color:#ff78d6;transform:translate(-1px,-1px);outline:none;}' +
      '.mp-menu-icon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;background:#32112b;border:1px solid #a94d8b;color:#ff8cdb;font-size:16px;text-shadow:1px 1px #551344;}' +
      '.mp-menu-card>span:nth-child(2){display:flex;flex:1;min-width:0;flex-direction:column;gap:3px;}' +
      '.mp-menu-card b{font-size:11px;color:#ffe0f4;letter-spacing:.3px;}' +
      '.mp-menu-card small{font:9px "Courier New",monospace;color:#bc8eaf;line-height:1.35;min-width:0;overflow-wrap:anywhere;}' +
      '.mp-menu-card i{font:20px "Courier New",monospace;color:#f472d0;font-style:normal;}' +
      '.mp-menu-controls{display:flex;justify-content:space-between;gap:5px;margin-top:13px;padding-top:9px;border-top:1px dashed #502747;color:#a8819e;font:8px "Courier New",monospace;letter-spacing:.3px;}' +
      '.mp-menu-controls kbd{padding:2px 4px;border:1px solid #9e4b84;background:#2a1126;color:#ffc4e9;font:700 8px "Courier New",monospace;box-shadow:1px 1px #35152f;}' +
      '.mp-menu-page-head{display:flex;align-items:center;gap:10px;margin-bottom:13px;padding:8px;background:#100a13;border:1px solid #693253;box-shadow:inset 0 0 0 1px rgba(244,114,208,.05);}' +
      '.mp-menu-back{padding:8px 9px;background:#291124;border:1px solid #a94d8b;color:#ffc4e9;font:700 10px "Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #35152f;}' +
      '.mp-menu-page-head>div{display:flex;flex:1;flex-direction:column;gap:3px;}' +
      '.mp-menu-page-head small{font:8px "Courier New",monospace;color:#a8819e;letter-spacing:1px;}' +
      '.mp-menu-page-head b{font:700 12px "Courier New",monospace;color:#ffb8eb;}' +
      '.mp-page-led{width:7px;height:7px;border-radius:50%;background:#ff5fc8;box-shadow:0 0 7px #ff5fc8;}' +
      '.mp-menu-subpage .mp-grid{margin-bottom:4px;}' +
      '.mp-action-fold{margin:0 0 9px;border:1px solid #74355f;background:linear-gradient(180deg,#180d1a,#100a13);box-shadow:2px 2px 0 #35152f;}' +
      '.mp-action-fold>summary{position:relative;list-style:none;display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:38px;padding:9px 34px 9px 11px;cursor:pointer;}' +
      '.mp-action-fold>summary::-webkit-details-marker{display:none;}' +
      '.mp-action-fold>summary>span{font:700 11px "Courier New",monospace;color:#ffe1f5;}' +
      '.mp-action-fold>summary>small{font:9px "Courier New",monospace;color:#bc8eaf;}' +
      '.mp-action-fold>summary>i{position:absolute;right:11px;top:50%;transform:translateY(-50%);font:18px "Courier New",monospace;font-style:normal;color:#f472d0;transition:transform .12s;}' +
      '.mp-action-fold[open]{border-color:#bf5a9c;background:#1b0d1b;}' +
      '.mp-action-fold[open]>summary{border-bottom:1px dashed #74355f;}' +
      '.mp-action-fold[open]>summary>i{transform:translateY(-50%) rotate(45deg);}' +
      '.mp-action-fold>.mp-grid{padding:10px 9px 8px;margin:0;}' +
      '#moon-phase-panel .mp-update-hitbox{appearance:none;-webkit-appearance:none;display:flex;flex:1 1 auto;align-items:center;flex-wrap:wrap;gap:8px;min-width:0;max-width:calc(100% - 34px);padding:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;}' +
      '#moon-phase-panel .mp-update-hitbox:hover .mp-title{color:#fff0fb !important;text-shadow:0 0 8px rgba(244,114,208,.55);}' +
      '#moon-phase-panel .mp-update-hitbox:focus-visible{outline:1px dashed #ff8cdb;outline-offset:4px;}' +
      '#moon-phase-panel .mp-update-hitbox .mp-title-orb{flex:0 0 auto;}' +
      '#moon-phase-panel .mp-update-hitbox .mp-title{display:block;flex:1 1 170px;min-width:0;max-width:none;overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:anywhere;line-height:1.35;}' +
      '#moon-phase-panel .mp-update-hitbox .mp-badge{display:inline-block;flex:0 0 auto;}' +
      '@media(max-width:480px){#moon-phase-panel{max-height:92dvh !important;padding:12px !important;}#moon-phase-panel .mp-update-hitbox{max-width:calc(100% - 30px);gap:6px;}#moon-phase-panel .mp-update-hitbox .mp-title{flex-basis:140px;font-size:11px !important;letter-spacing:0 !important;}#moon-phase-panel .mp-lcd-screen{padding:9px;font-size:13px;line-height:1.65;}#moon-phase-panel .mp-lcd-stats{grid-template-columns:repeat(2,1fr);}.mp-arcade-box{padding:12px 9px;}.mp-menu-controls{font-size:7px;}}' +
      '#moon-phase-panel .mp-console-bezel{display:flex;justify-content:space-between;align-items:center;padding:3px 6px 6px;color:#b8ccb0;font:700 9px "Courier New",monospace;letter-spacing:0.8px;}' +
      '#moon-phase-panel .mp-power-led{display:inline-flex;align-items:center;gap:5px;color:#ffb8eb;font-size:9px;}' +
      '#moon-phase-panel .mp-power-led i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff4ecd;box-shadow:0 0 6px #ff4ecd;}' +
      '#moon-phase-panel .mp-lcd-quick-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:7px;padding-bottom:6px;border-bottom:1px solid #182019;}' +
      '#moon-phase-panel .mp-lcd-quick-tab{padding:3px 2px;border:1px solid #182019;background:#707d63;color:#182019;font:700 11px "MP Fusion Pixel","Zpix","Courier New",monospace;cursor:pointer;text-align:center;}' +
      '#moon-phase-panel .mp-lcd-quick-tab.active{background:#182019;color:#7d896f !important;}' +
      '#moon-phase-panel .mp-console-pillbar{display:flex;justify-content:center;align-items:center;gap:10px;margin:8px 0 11px;padding:4px 6px;}' +
      '#moon-phase-panel .mp-select-start-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border:1px solid #a94d8b;border-radius:999px;background:linear-gradient(180deg,#2a1126,#150916);color:#ffc4e9;font:700 10.5px "MP Fusion Pixel","Courier New",monospace;cursor:pointer;box-shadow:2px 2px 0 #35152f;letter-spacing:0.4px;}' +
      '#moon-phase-panel .mp-select-start-btn:hover{border-color:#f472d0;background:#3b1535;color:#fff;transform:translate(-1px,-1px);}' +
      '#moon-phase-panel .mp-select-start-btn.unconfigured{border-color:#fbbf24;color:#fde047;}' +
      '#moon-phase-panel .mp-subpage-switch{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:10px;}' +
      '#moon-phase-panel .mp-subpage-tab{padding:6px 2px;border:1px solid #643052;background:#140b16;color:#bc8eaf;font:700 10px "MP Fusion Pixel","Courier New",monospace;cursor:pointer;text-align:center;box-shadow:1px 1px 0 #35152f;}' +
      '#moon-phase-panel .mp-subpage-tab.active{border-color:#f472d0;background:#32112b;color:#ffe1f5;}' +
      '#moon-phase-panel .mp-btn{flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 6px !important;min-height:48px;}' +
      '#moon-phase-panel .mp-btn small{display:block;font-size:9px;color:#bc8eaf;font-weight:400;line-height:1.25;min-width:0;overflow-wrap:anywhere;}' +
      '#moon-phase-panel .mp-btn-highlight small,#moon-phase-panel .mp-btn-user small{color:#f5b8df;}' +
      '@media(min-width:700px){#moon-phase-panel .mp-lcd-screen{font-size:15px;}}';

    let extraEl = mainDoc.getElementById('moon-phase-retro-style');
    if (!extraEl) {
      extraEl = mainDoc.createElement('style');
      extraEl.id = 'moon-phase-retro-style';
      mainDoc.head.appendChild(extraEl);
    }
    extraEl.textContent = `
/* ══════════════════════════════════════════════════════════
 * 掌机黑粉复古像素重构样式 (Black & Pink Handheld Console)
 * ══════════════════════════════════════════════════════════ */
#moon-phase-panel {
  background: repeating-linear-gradient(0deg, rgba(244,114,208,0.015) 0, rgba(244,114,208,0.015) 1px, transparent 1px, transparent 4px),
              linear-gradient(180deg, #180c1a 0%, #0c060e 100%) !important;
  color: #ffe4f7 !important;
  border: 3px solid #742d60 !important;
  border-radius: 20px 20px 42px 20px !important;
  padding: 16px 18px 22px !important;
  width: 100% !important;
  max-width: 480px !important;
  max-height: 92dvh !important;
  overflow-y: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif !important;
  box-shadow: inset 1px 1px 0 rgba(255,184,235,0.15), inset -3px -3px 0 rgba(0,0,0,0.8), 0 0 0 3px #230d22, 0 25px 65px rgba(0,0,0,0.9), 0 0 25px rgba(244,114,208,0.2) !important;
  box-sizing: border-box !important;
  position: relative !important;
}

/* 顶部机身标识与电源指示灯 (黑底粉字) */
#moon-phase-panel .mp-head {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 12px !important;
  padding-bottom: 8px !important;
  border-bottom: 2px dashed rgba(244,114,208,0.4) !important;
}
#moon-phase-panel .mp-title-group {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  color: inherit !important;
  text-align: left !important;
  cursor: pointer !important;
}
#moon-phase-panel .mp-title-orb {
  font-size: 18px !important;
  filter: drop-shadow(0 0 6px #f472d0) !important;
}
#moon-phase-panel .mp-title {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: #ffb8eb !important;
  letter-spacing: 0.8px !important;
  text-transform: uppercase !important;
  font-family: "Courier New", monospace !important;
  text-shadow: 2px 2px 0 #4a123d !important;
}
#moon-phase-panel .mp-badge {
  font-size: 9px !important;
  background: #2b0e25 !important;
  padding: 2px 7px !important;
  border-radius: 4px !important;
  color: #ffc4e9 !important;
  border: 1px solid #9e3e7f !important;
  font-weight: 700 !important;
  font-family: monospace !important;
  box-shadow: 1px 1px 0 #140512 !important;
}
#moon-phase-panel .mp-close {
  background: #2b0e25 !important;
  border: 1px solid #9e3e7f !important;
  color: #ffb8eb !important;
  font-size: 13px !important;
  cursor: pointer !important;
  padding: 3px 8px !important;
  border-radius: 4px !important;
  box-shadow: 1px 1px 0 #140512 !important;
}
#moon-phase-panel .mp-close:hover {
  background: #ef4444 !important;
  color: #fff !important;
  border-color: #f87171 !important;
}

/* 掌机屏幕玻璃外框 (Recessed Screen Housing) */
#moon-phase-panel .mp-lcd-card {
  background: #211024 !important;
  border: 2px solid #581d45 !important;
  border-radius: 12px !important;
  padding: 10px 10px 12px !important;
  margin-bottom: 12px !important;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 0 rgba(244,114,208,0.12), 0 0 0 1px #0a040b !important;
}

/* 玻璃框顶部丝印与粉红电源灯 */
#moon-phase-panel .mp-console-bezel {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 2px 6px 8px !important;
  color: #d898c6 !important;
  font: 700 9px "Courier New", monospace !important;
  letter-spacing: 0.6px !important;
  border-bottom: 1px solid rgba(244,114,208,0.2) !important;
  margin-bottom: 8px !important;
}
#moon-phase-panel .mp-power-led {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  color: #ff8cdb !important;
  font-size: 8.5px !important;
  font-weight: 700 !important;
}
#moon-phase-panel .mp-power-led i {
  display: inline-block !important;
  width: 7px !important;
  height: 7px !important;
  border-radius: 50% !important;
  background: #ff4ecd !important;
  box-shadow: 0 0 7px #ff4ecd !important;
}

/* 复古点阵墨绿 LCD 屏幕 (保持原汁原味点阵掌机屏幕) */
#moon-phase-panel .mp-lcd-screen {
  position: relative !important;
  overflow: hidden !important;
  padding: 12px !important;
  background: #7d896f !important;
  color: #182019 !important;
  border: 2px solid #182019 !important;
  border-radius: 6px !important;
  box-shadow: inset 2px 2px 0 #465037, inset -2px -2px 0 #9caf7f !important;
  font: 13.5px/1.65 "MP Fusion Pixel","Zpix","Courier New",monospace !important;
  letter-spacing: .2px !important;
  -webkit-font-smoothing: none !important;
  font-smooth: never !important;
  image-rendering: pixelated !important;
  background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px) !important;
  background-size: 3px 3px !important;
}
#moon-phase-panel .mp-lcd-screen-head {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: 8px !important;
  padding-bottom: 6px !important;
  border-bottom: 1px solid #182019 !important;
  font-size: 11px !important;
  font-weight: bold !important;
}
#moon-phase-panel .mp-lcd-screen-head b {
  padding: 2px 5px !important;
  border: 1px solid #182019 !important;
  font-size: 9.5px !important;
}

/* LCD 顶部快捷切换页签 [01 状态 ~ 04 内存] */
#moon-phase-panel .mp-lcd-quick-tabs {
  display: grid !important;
  grid-template-columns: repeat(4,1fr) !important;
  gap: 4px !important;
  margin: 6px 0 8px !important;
  padding-bottom: 6px !important;
  border-bottom: 1px solid #182019 !important;
}
#moon-phase-panel .mp-lcd-quick-tab {
  padding: 3px 2px !important;
  border: 1px solid #182019 !important;
  background: #707d63 !important;
  color: #182019 !important;
  font: 700 11px "MP Fusion Pixel","Courier New",monospace !important;
  cursor: pointer !important;
  text-align: center !important;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.15) !important;
}
#moon-phase-panel .mp-lcd-quick-tab.active {
  background: #182019 !important;
  color: #7d896f !important;
  font-weight: 800 !important;
}

/* RPG 四维状态槽 (点阵墨墨黑) */
.mp-rpg-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 11.5px;
  line-height: 1.4;
}
.mp-rpg-stat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
  flex: 0 0 110px;
}
.mp-rpg-stat-bar {
  flex: 1;
  height: 7px;
  border: 1px solid #182019;
  background: rgba(24,32,25,0.15);
  margin: 0 8px;
  position: relative;
}
.mp-rpg-stat-fill {
  height: 100%;
  background: #182019;
}
.mp-rpg-stat-val {
  font-weight: bold;
  font-family: monospace;
  min-width: 32px;
  text-align: right;
}

/* 掌机实体控制器群 (黑粉配色) */
.mp-console-cluster {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px 10px;
  margin-bottom: 9px;
  background: #140816;
  border: 2px solid #581d45;
  border-radius: 12px;
  box-shadow: inset 1px 1px 0 rgba(244,114,208,0.1);
}

/* 左侧十字方向键 D-Pad (深黑塑料 + 粉调中心) */
.mp-dpad {
  position: relative;
  width: 72px;
  height: 72px;
}
.mp-dpad-center {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 24px;
  height: 24px;
  background: #250d27;
  border: 1px solid #531c42;
  z-index: 2;
  border-radius: 4px;
}
.mp-dpad-center::after {
  content: '';
  position: absolute;
  top: 7px;
  left: 7px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3d1438;
}
.mp-dpad-btn {
  position: absolute;
  background: #250d27;
  border: 1px solid #531c42;
  color: #ffb8eb;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  font-weight: bold;
  transition: all 0.1s;
}
.mp-dpad-btn:active {
  background: #3e123a;
  color: #fff;
}
.mp-dpad-up { top: 0; left: 24px; width: 24px; height: 26px; border-radius: 4px 4px 0 0; }
.mp-dpad-down { bottom: 0; left: 24px; width: 24px; height: 26px; border-radius: 0 0 4px 4px; }
.mp-dpad-left { top: 24px; left: 0; width: 26px; height: 24px; border-radius: 4px 0 0 4px; }
.mp-dpad-right { top: 24px; right: 0; width: 26px; height: 24px; border-radius: 0 4px 4px 0; }

/* 中间倾斜 SELECT & START 胶键 (黑粉倾斜按键) */
.mp-pill-keys {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 0 6px;
}
.mp-pill-row {
  display: flex;
  gap: 10px;
}
.mp-select-key, .mp-start-key {
  transform: rotate(-25deg);
  padding: 4px 10px;
  background: #2a1126;
  border: 1px solid #9e3e7f;
  border-radius: 10px;
  color: #ffc4e9;
  font: 700 9.5px monospace;
  cursor: pointer;
  box-shadow: 1px 2px 0 #1a0817;
  letter-spacing: 0.5px;
}
.mp-select-key:hover, .mp-start-key:hover {
  background: #47173e;
  color: #fff;
}
.mp-select-key:active, .mp-start-key:active {
  transform: rotate(-25deg) translate(1px, 1px);
  box-shadow: none;
}
.mp-pill-labels {
  display: flex;
  gap: 12px;
  font: 700 8.5px "Courier New", monospace;
  color: #e2a6d1;
  letter-spacing: 0.8px;
  margin-top: 2px;
}

/* 右侧倾斜 A / B 圆形按键 (经典 Galgame 亮粉圆钮) */
.mp-action-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.mp-action-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  transform: rotate(-18deg);
}
.mp-round-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #d946a6;
  border: 2px solid #83185b;
  color: #fff;
  font: 800 13px "Courier New", monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 1px 2px 0 #4a0d33, 0 0 6px rgba(244,114,208,0.4);
  user-select: none;
}
.mp-round-btn:hover {
  background: #f472d0;
  box-shadow: 1px 2px 0 #4a0d33, 0 0 10px rgba(244,114,208,0.7);
}
.mp-round-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}
.mp-speaker-grill {
  display: flex;
  gap: 4px;
  transform: rotate(-30deg);
  margin-right: 4px;
  margin-top: 4px;
}
.mp-speaker-grill i {
  display: block;
  width: 3px;
  height: 12px;
  background: #09030a;
  border-radius: 2px;
}

/* 紧凑月相难度分段选择器 (黑粉风格) */
.mp-lunar-dial-card {
  background: #170b1a !important;
  border: 1px solid #6b2857 !important;
  border-radius: 10px !important;
  padding: 8px 10px !important;
  margin-bottom: 12px !important;
  box-shadow: 2px 2px 0 #20081d !important;
}
.mp-lunar-dial-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}
.mp-lunar-dial-btn {
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid #5a1f49;
  background: #130715;
  color: #f3c2e6;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  transition: all 0.15s;
}
.mp-lunar-dial-btn.active {
  border-color: #f472d0;
  background: #37102f;
  color: #ffc4e9;
  box-shadow: 0 0 8px rgba(244,114,208,0.35);
}
.mp-lunar-dial-desc {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(244,114,208,0.2);
  font-size: 10.5px;
  color: #e5a4d4;
  line-height: 1.5;
}

/* 卡带插槽式导航主菜单 (黑底 + 霓虹粉插槽) */
.mp-cartridge-grid {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 8px;
}
.mp-cartridge-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: #190c1c;
  border: 1px solid #5d224d;
  border-left: 4px solid #f472d0;
  border-radius: 8px;
  color: #ffe1f5;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.12s;
  box-shadow: 2px 2px 0 #20081d;
}
.mp-cartridge-slot:hover {
  background: #2b122e;
  border-color: #ff8cdb;
  border-left-color: #ff8cdb;
  color: #fff;
  transform: translateX(2px);
  box-shadow: 3px 3px 0 #20081d, 0 0 10px rgba(244,114,208,0.25);
}
.mp-cartridge-slot.slot-adventure { border-left-color: #f472d0; }
.mp-cartridge-slot.slot-characters { border-left-color: #fb7185; }
.mp-cartridge-slot.slot-timeline { border-left-color: #fde047; }
.mp-cartridge-slot.slot-system { border-left-color: #6ee7b7; }
.mp-cartridge-slot.slot-settings { border-left-color: #c084fc; }

.mp-cartridge-slot b {
  font-size: 12.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffb8eb;
}
.mp-cartridge-slot small {
  display: block;
  font-size: 9.5px;
  color: #bc8eaf;
  margin-top: 2px;
  font-weight: normal;
}
.mp-cartridge-slot:hover small {
  color: #fcd5ee;
}
.mp-cartridge-grip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0.5;
}
.mp-cartridge-grip span {
  display: block;
  width: 14px;
  height: 2px;
  background: #f472d0;
  border-radius: 1px;
}
`;
  }
  /* ───────────────────────────────────────────────────────── */
