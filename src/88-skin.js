/* 88-skin.js —— 楼内状态卡皮肤：晨昏票根 / 月氏藏书票 / 预言家日报（玩家自选）
   前两套由 tools/gen-skin.mjs 从正则美化 JSON 生成；
   预言家日报是后加的手写皮肤（skin-prophet.css / skin-prophet.js），同样经 gen-skin 注入。
   不要直接手改生成段落。本片段依赖：getStorage()、readMvuLatest()、mainDoc、mainWin。 */

  const SKIN_KEY = 'moon_phase_message_skin_v1';
  const SKIN_BOOK_THEME_KEY = 'moon_phase_message_skin_book_theme_v1';
  const SKIN_MAX_MESSAGES = 30;
  const SKIN_HOLDER_CLASS = 'mp-msg-skin';

  const SKIN_LIST = [
    { id: 'none', short: '不显示', name: '不显示', hint: '只留正文，最干净' },
    { id: 'ticket', short: '票根', name: '晨昏票根', hint: '可撕副券 · 展开房间与名册' },
    { id: 'book', short: '藏书票', name: '月氏藏书票', hint: '笺纸名札 · 双面翻转' },
    { id: 'prophet', short: '日报', name: '预言家日报', hint: '头版道具 · 折叠展开，带人物档案' }
  ];

  const SKIN_CSS_TICKET = `@import url("https://fontsapi.zeoseven.com/802/main/result.css");
  @import url("https://fonts.font.im/css2?family=Cinzel:wght@600;700;800&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Playfair+Display:wght@600;700&family=Oooh+Baby&family=Klee+One:wght@400;600&family=Nanum+Pen+Script&family=Special+Elite&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Noto+Serif+SC:wght@400;600;700;900&display=swap");

  @font-face {
    font-family: "ZSFT-640";
    src: url("https://fontsapi.zeoseven.com/640/main.woff2") format("woff2");
    font-style: normal; font-weight: 400; font-display: swap;
  }
  @font-face {
    font-family: "ZSFT-fc";
    src: url("https://fontsapi.zeoseven.com/fc/bold.woff2") format("woff2");
    font-style: normal; font-weight: 700; font-display: swap;
  }
  @font-face {
    font-family: "ZSFT-fc";
    src: url("https://fontsapi.zeoseven.com/fc/main.woff2") format("woff2");
    font-style: normal; font-weight: 400; font-display: swap;
  }


  /* ────────── 护眼简约复古调色板 ────────── */
  .tkt-container {
    --t-bg: #f7f4ed;
    --t-card-bg: transparent;
    --t-ink: #24211e;
    --t-border: #383431;
    --t-dim: #78726b;
    --t-grid: #e2ddd3;
    --t-subtle: #eae5da;
    --t-invert-bg: #2b2724;
    --t-invert-ink: #f9f7f2;
    --t-accent-red: #b83e39;
    --t-accent-stamp: #b83e39;
    --t-native-color: #243a5e;

    --t-shadow-plate: var(--t-border);
    --t-shadow-plate-border: var(--t-border);
    --t-ambient-shadow: rgba(36, 33, 30, 0.12);

    --t-watermark-color: rgba(86, 78, 68, 0.10);
    --t-watermark-blend: multiply;

    --stub-w: 158px;
    --notch-r: 10px;

    width: 690px;
    max-width: 98%;
    margin: 18px auto;
    font-family: "Noto Serif SC", "Songti SC", "STSong", "Source Han Serif SC", SimSun, serif;
    color: var(--t-ink);
    position: relative;
    user-select: none;
    box-sizing: border-box;
    transition: color 0.25s ease;
  }

  .tkt-container[data-theme="dark"] {
    --t-bg: #1c1e22;
    --t-card-bg: transparent;
    --t-ink: #e0e4eb;
    --t-border: #444a56;
    --t-dim: #8b929e;
    --t-grid: #282d36;
    --t-subtle: #23272e;
    --t-invert-bg: #cbd2dc;
    --t-invert-ink: #17181c;
    --t-accent-red: #e06860;
    --t-accent-stamp: #e06860;
    --t-native-color: #adcbe3;

    --t-shadow-plate: var(--t-border);
    --t-shadow-plate-border: var(--t-border);
    --t-ambient-shadow: rgba(0, 0, 0, 0.55);

    --t-watermark-color: rgba(195, 205, 220, 0.08);
    --t-watermark-blend: normal;
  }

  @media (prefers-color-scheme: dark) {
    .tkt-container[data-theme="auto"] {
      --t-bg: #1c1e22;
      --t-card-bg: transparent;
      --t-ink: #e0e4eb;
      --t-border: #444a56;
      --t-dim: #8b929e;
      --t-grid: #282d36;
      --t-subtle: #23272e;
      --t-invert-bg: #cbd2dc;
      --t-invert-ink: #17181c;
      --t-accent-red: #e06860;
      --t-accent-stamp: #e06860;
      --t-native-color: #adcbe3;

      --t-shadow-plate: var(--t-border);
      --t-shadow-plate-border: var(--t-border);
      --t-ambient-shadow: rgba(0, 0, 0, 0.55);

      --t-watermark-color: rgba(195, 205, 220, 0.08);
      --t-watermark-blend: normal;
    }
  }

  .tkt-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: -4px;
    bottom: -4px;
    background-color: var(--t-shadow-plate);
    border: none;
    z-index: 0;
    pointer-events: none;
    box-sizing: border-box;
    box-shadow: 0 12px 28px var(--t-ambient-shadow);
    transition: background-color 0.25s ease;
  }

  .tkt-board {
    background-color: var(--t-bg);
    border: 1.5px solid var(--t-border);
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    overflow: hidden;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }

  .tkt-notch-top {
    position: absolute;
    top: -1px;
    right: calc(var(--stub-w) - var(--notch-r));
    width: calc(var(--notch-r) * 2);
    height: var(--notch-r);
    background: var(--t-shadow-plate);
    border: none;
    border-radius: 0 0 var(--notch-r) var(--notch-r);
    z-index: 30;
    pointer-events: none;
    box-sizing: border-box;
    transition: background-color 0.25s ease;
  }

  .tkt-notch-bottom {
    position: absolute;
    bottom: -1px;
    right: calc(var(--stub-w) - var(--notch-r));
    width: calc(var(--notch-r) * 2);
    height: var(--notch-r);
    background: var(--t-shadow-plate);
    border: none;
    border-radius: var(--notch-r) var(--notch-r) 0 0;
    z-index: 30;
    pointer-events: none;
    box-sizing: border-box;
    transition: background-color 0.25s ease;
  }

  .tkt-cross-mark {
    position: absolute;
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 10px;
    line-height: 1;
    color: var(--t-border);
    opacity: 0.45;
    pointer-events: none;
    z-index: 10;
  }
  .tkt-cross-tl { top: 6px; left: 8px; }
  .tkt-cross-tr { top: 6px; right: calc(var(--stub-w) + 14px); }
  .tkt-cross-bl { bottom: 6px; left: 8px; }

  .tkt-watermark {
    position: absolute;
    top: 6px;
    left: 10px;
    right: calc(var(--stub-w) + 7px);
    height: 195px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-family: "Special Elite", "Courier Prime", monospace;
    font-weight: 400;
    font-size: 180px;
    letter-spacing: 0.05em;
    line-height: 0.8;
    text-transform: uppercase;
    color: var(--t-watermark-color);
    mix-blend-mode: var(--t-watermark-blend);
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    user-select: none;
    -webkit-font-smoothing: antialiased;
    -webkit-mask-image: linear-gradient(to right, #000 75%, rgba(0,0,0,0.3) 95%, transparent 100%);
            mask-image: linear-gradient(to right, #000 75%, rgba(0,0,0,0.3) 95%, transparent 100%);
    transition: color 0.3s ease;
  }
  .tkt-watermark > span {
    display: inline-block;
    white-space: nowrap;
    line-height: 1;
    letter-spacing: inherit;
    text-transform: inherit;
    font-size: inherit;
    flex-shrink: 0;
  }

  .tkt-love-svg {
    position: absolute;
    left: 0; top: -4px;
    width: calc(100% - var(--stub-w));
    height: 140px;
    pointer-events: none;
    z-index: 8;
    overflow: visible;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.28s ease, visibility 0.28s ease;
  }
  .tkt-love-hit {
    stroke: transparent;
    stroke-width: 18px;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    pointer-events: stroke;
    cursor: pointer;
  }
  .tkt-love-path {
    stroke: var(--t-accent-red);
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    stroke-dasharray: 1000.1;
    stroke-dashoffset: 1000;
    shape-rendering: geometricPrecision;
    will-change: stroke-dashoffset, stroke-width, stroke;
    pointer-events: stroke;
    cursor: pointer;
    transition: stroke 0.22s ease, stroke-width 0.22s ease, opacity 0.22s ease, filter 0.22s ease;
  }
  .tkt-container.is-open.is-love .tkt-love-svg {
    opacity: 0.95;
    visibility: visible;
  }
  .tkt-container.is-open.is-love .tkt-love-path {
    animation: tktLoveDraw 1.05s cubic-bezier(0.38, 0.05, 0.22, 1) 0.08s forwards;
  }
  @keyframes tktLoveDraw {
    0% { stroke-dashoffset: 1000; }
    100% { stroke-dashoffset: 0; }
  }
  .tkt-container.is-open.is-love .tkt-love-hit:hover + .tkt-love-path,
  .tkt-container.is-open.is-love .tkt-love-path:hover {
    stroke: #d02c27 !important;
    stroke-width: 2.2px !important;
    opacity: 1 !important;
  }
  .tkt-container[data-theme="dark"] .tkt-love-path {
    filter: drop-shadow(0 0 3px rgba(224, 104, 96, 0.65));
  }
  .tkt-container[data-theme="dark"].is-open.is-love .tkt-love-path {
    animation: tktLoveDraw 1.05s cubic-bezier(0.38, 0.05, 0.22, 1) 0.08s forwards,
               tktDarkBreath 3.2s ease-in-out 1.15s infinite alternate;
  }
  @media (prefers-color-scheme: dark) {
    .tkt-container[data-theme="auto"] .tkt-love-path {
      filter: drop-shadow(0 0 3px rgba(224, 104, 96, 0.65));
    }
    .tkt-container[data-theme="auto"].is-open.is-love .tkt-love-path {
      animation: tktLoveDraw 1.05s cubic-bezier(0.38, 0.05, 0.22, 1) 0.08s forwards,
                 tktDarkBreath 3.2s ease-in-out 1.15s infinite alternate;
    }
  }
  @keyframes tktDarkBreath {
    0% { opacity: 0.8; }
    100% { opacity: 1; }
  }

  .tkt-face {
    display: grid;
    grid-template-columns: 1fr var(--stub-w);
    position: relative;
    z-index: 1;
    cursor: pointer;
  }
  .tkt-main {
    padding: 16px 24px 14px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .tkt-slip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.2px solid var(--t-border);
    padding-bottom: 6px;
    position: relative;
  }
  .tkt-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tkt-type-tag {
    background: var(--t-invert-bg);
    color: var(--t-invert-ink);
    padding: 2px 7px;
    font-weight: 700;
    font-size: 8.5px;
    letter-spacing: 1.4px;
    border-radius: 1px;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-curator-mark {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: var(--t-dim);
    text-transform: uppercase;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-header-seq {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 1.2px;
    opacity: 0.9;
  }

  .tkt-name-stage {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 2px 0 0;
    position: relative;
  }
  .tkt-title-meta-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 8px;
    font-family: "Noto Serif SC", "Songti SC", serif;
    color: var(--t-dim);
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .tkt-title-meta-badge::before {
    content: "■";
    font-size: 6px;
    color: var(--t-accent-red);
  }

  .tkt-title-text {
    font-family: "Byron Mark II", "Special Elite", "Courier Prime", "Courier New", monospace;
    font-size: 40px;
    font-weight: 700;
    letter-spacing: 2.5px;
    line-height: 0.95;
    text-transform: uppercase;
    display: block;
    position: relative;
    z-index: 1;
    color: var(--t-ink);
    margin: 3px 0 2px;
  }

  .tkt-sign-zone {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    margin-top: 4px;
  }
  .tkt-sign-lbl {
    font-size: 8.5px;
    letter-spacing: 1.4px;
    color: var(--t-dim);
    text-transform: uppercase;
    font-weight: 700;
    white-space: nowrap;
    opacity: 0.75;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }

  .tkt-name-native {
    position: relative;
    z-index: 12 !important;
    background: transparent;
    display: inline-block;
    color: var(--t-native-color);
    white-space: nowrap;
    line-height: 1;
    font-weight: normal;
    transform-origin: left center;
    -webkit-font-smoothing: antialiased;
    transition: none !important;
    animation: none !important;
  }

  .tkt-gender-m {
    transform: rotate(-3deg);
    letter-spacing: 0.3px;
    font-weight: 500;
  }
  .tkt-gender-f {
    transform: rotate(-1.2deg);
    letter-spacing: 1.1px;
    font-weight: 400;
  }

  .tkt-lang-zh-cn, .tkt-lang-zh-tw, .tkt-lang-ja {
    font-family: "Written", "YShi-Written", "Klee One", "STKaiti", "KaiTi", serif;
    font-size: 20px;
  }
  .tkt-lang-en, .tkt-lang-fr, .tkt-lang-it, .tkt-lang-ru {
    font-family: "Oooh Baby", cursive, sans-serif;
    font-size: 27px;
  }
  .tkt-lang-ko {
    font-family: "Nanum Pen Script", cursive, sans-serif;
    font-size: 21px;
  }

  .tkt-quick-grid {
    display: grid;
    grid-template-columns: 1.65fr 1fr 1fr;
    border: 1.2px solid var(--t-border);
    background: transparent;
    position: relative;
    border-radius: 1px;
    z-index: 1;
    margin-top: 4px;
  }
  .tkt-meta-block {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 6px 10px;
    overflow: hidden;
    border-right: 1.2px solid var(--t-border);
    position: relative;
    background: transparent;
  }
  .tkt-meta-block:last-child {
    border-right: none;
  }
  .tkt-meta-lbl {
    font-size: 7.5px;
    color: var(--t-dim);
    letter-spacing: 1.2px;
    text-transform: uppercase;
    font-weight: 700;
    font-family: "Noto Serif SC", "Songti SC", serif;
    line-height: 1;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tkt-meta-txt {
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-hook-glance-time {
    font-size: 11.5px;
    letter-spacing: -0.25px;
  }

  .tkt-fold {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    letter-spacing: 1.8px;
    color: var(--t-dim);
    padding-top: 6px;
    text-transform: uppercase;
    font-weight: 700;
    font-family: "Noto Serif SC", "Songti SC", serif;
    position: relative;
    z-index: 1;
  }
  .tkt-fold-status {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .tkt-fold-dot {
    width: 5px; height: 5px;
    background-color: var(--t-border);
    border-radius: 50%;
    opacity: 0.6;
  }
  .tkt-fold .arrow {
    font-size: 9px;
    transition: transform 0.28s cubic-bezier(0.2, 1, 0.3, 1);
  }
  .tkt-container.is-open .tkt-fold .arrow { transform: rotate(180deg); }

  .tkt-stub {
    border-left: none;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background: var(--t-bg);
    position: relative;
    z-index: 1;
    box-sizing: border-box;
  }

  .tkt-stub::before {
    content: "";
    position: absolute;
    left: 0;
    top: calc(var(--notch-r) + 4px);
    bottom: calc(var(--notch-r) + 4px);
    width: 1.5px;
    border-left: 1.5px dashed var(--t-border);
    pointer-events: none;
  }

  .tkt-stub-tag {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--t-dim);
    text-transform: uppercase;
    border-bottom: 1px solid var(--t-grid);
    width: 100%;
    text-align: center;
    padding-bottom: 4px;
  }
  .tkt-stub-serial {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 15px;
    letter-spacing: 2.2px;
    font-weight: 700;
    text-align: center;
    position: relative;
    line-height: 1;
    margin: 4px 0;
    z-index: 1;
  }
  .tkt-stub-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin: 8px 0;
    position: relative;
    z-index: 12;
  }
  .tkt-btn {
    background: transparent;
    border: 1.2px solid var(--t-border);
    color: var(--t-ink);
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 9px;
    font-weight: 700;
    padding: 4px 6px;
    cursor: pointer;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.15s ease;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
    border-radius: 1px;
    box-shadow: none;
  }
  .tkt-btn:hover {
    background: var(--t-invert-bg);
    color: var(--t-invert-ink);
    box-shadow: none;
  }
  .tkt-btn:active {
    background: var(--t-invert-bg);
    box-shadow: none;
  }
  .tkt-stub-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-top: auto;
    position: relative;
    z-index: 12;
    width: 100%;
    min-height: 42px;
  }
  .tkt-stamp {
    position: relative;
    z-index: 12;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--t-accent-stamp);
    border: 1.5px solid var(--t-accent-stamp);
    border-radius: 1px;
    padding: 3px 8px;
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    text-align: center;
    white-space: nowrap;
    line-height: 1;
    background-color: var(--t-bg);
    outline: 1px solid var(--t-accent-stamp);
    outline-offset: -3.5px;
    box-shadow: inset 0 0 4px rgba(158, 57, 44, 0.15);
    opacity: 0;
    visibility: hidden;
    transform: scale(0.85) rotate(-10deg);
    transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
  }

  .tkt-container.is-open .tkt-stamp {
    visibility: visible;
    animation: tktStampImpact 0.42s cubic-bezier(0.18, 0.89, 0.32, 1.28) 0.2s both;
  }

  @keyframes tktStampImpact {
    0% { opacity: 0; transform: scale(2.2) rotate(-24deg); filter: blur(2px); }
    60% { opacity: 0.96; transform: scale(0.94) rotate(-8deg); filter: blur(0px); }
    100% { opacity: 0.92; transform: scale(1) rotate(-10deg); }
  }

  .tkt-stub-notice {
    font-size: 7px;
    letter-spacing: 1.6px;
    font-family: "Noto Serif SC", "Songti SC", serif;
    color: var(--t-dim);
    text-transform: uppercase;
    text-align: center;
    white-space: nowrap;
    opacity: 0.7;
    line-height: 1;
  }

  .tkt-body {
    max-height: 0px;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.2, 1, 0.3, 1), padding 0.2s ease;
    border-top: 1px solid transparent;
    padding: 0px 24px;
    background: var(--t-bg);
    box-sizing: border-box;
    position: relative;
    z-index: 2;
  }
  .tkt-container.is-open .tkt-body {
    max-height: 2000px;
    padding: 20px 24px 22px 24px;
    border-top: 1.5px dashed var(--t-border);
  }
  .tkt-sec {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 700;
    border-bottom: 1.2px solid var(--t-border);
    padding-bottom: 5px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--t-dim);
  }
  .tkt-sec-tag {
    background: var(--t-subtle);
    padding: 1px 5px;
    border-radius: 1px;
    color: var(--t-ink);
  }
  .tkt-env {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1.2px solid var(--t-border);
    margin-bottom: 18px;
    background: transparent;
    border-radius: 1px;
  }
  .tkt-cell {
    border-right: 1.2px solid var(--t-border);
    padding: 8px 12px;
  }
  .tkt-cell:last-child { border-right: none; }
  .tkt-cell-lbl {
    font-size: 7.5px;
    color: var(--t-dim);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-family: "Noto Serif SC", "Songti SC", serif;
    line-height: 1;
    margin-bottom: 5px;
  }
  .tkt-cell-val {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }

  .tkt-roster { display: flex; flex-direction: column; gap: 12px; }
  .tkt-entity {
    border: 1.2px solid var(--t-border);
    padding: 14px 16px;
    background: transparent;
    position: relative;
    border-radius: 1px;
    box-shadow: 1.5px 2px 0px var(--t-grid);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .tkt-entity.is-hero {
    border-width: 1.6px;
    border-left: 5px solid var(--t-border);
  }
  .tkt-entity-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .tkt-entity-id { display: flex; align-items: center; gap: 8px; }
  .tkt-entity-name {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .tkt-pill {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 7.5px;
    font-weight: 700;
    padding: 2px 5px;
    border: 1px solid var(--t-border);
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }
  .tkt-pill.active {
    background: var(--t-invert-bg);
    color: var(--t-invert-ink);
  }
  .tkt-gauges {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 12px;
  }
  .tkt-gauge { display: flex; flex-direction: column; gap: 4px; }
  .tkt-gauge-lbl {
    display: flex;
    justify-content: space-between;
    font-size: 8.5px;
    font-weight: 700;
    font-family: "Noto Serif SC", "Songti SC", serif;
    letter-spacing: 0.6px;
  }
  .tkt-gauge-lbl .gauge-code { color: var(--t-dim); font-size: 8px; }
  .tkt-gauge-track {
    height: 5px;
    background: var(--t-subtle);
    border: 1px solid var(--t-border);
    position: relative;
    overflow: hidden;
  }
  .tkt-gauge-track::after {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 24%,
      var(--t-border) 24%,
      var(--t-border) 25%
    );
    opacity: 0.25;
    pointer-events: none;
  }
  .tkt-gauge-bar {
    height: 100%;
    background: var(--t-ink);
    width: 0px;
    transition: width 0.35s ease;
  }
  .tkt-narrative {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 14px;
    border-top: 1px dashed var(--t-grid);
    padding-top: 10px;
    font-size: 12px;
    line-height: 1.45;
  }
  .tkt-outfit {
    font-size: 9px;
    color: var(--t-dim);
    word-break: break-all;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-quote {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 13.5px;
    font-style: normal;
    border-left: 2px solid var(--t-border);
    padding-left: 10px;
    word-break: break-all;
    color: var(--t-ink);
    line-height: 1.4;
  }

  .tkt-bottom {
    border-top: 1.5px solid var(--t-border);
    padding: 12px 22px 14px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--t-bg);
    position: relative;
    z-index: 2;
  }
  .tkt-warn {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 8px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--t-dim);
    text-align: left;
    line-height: 1.5;
  }
  .tkt-warn strong { color: var(--t-ink); font-weight: 700; }

  .tkt-barcode-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .tkt-barcode {
    display: flex;
    align-items: flex-start;
    gap: 1.5px;
    height: 28px;
  }
  .tkt-bar { background: var(--t-border); height: 23px; }
  .tkt-bar.is-guard { height: 28px; }
  .tkt-w1 { width: 1.2px; }
  .tkt-w2 { width: 2.2px; }
  .tkt-w3 { width: 3.4px; }
  .tkt-barcode-serial {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 6.5px;
    letter-spacing: 2.2px;
    color: var(--t-dim);
    line-height: 1;
    margin-left: 2px;
  }

  /* ────────── 移动端极致复刻 PC 比例微调 ────────── */
  @media (max-width: 680px) {
    .tkt-container {
      --stub-w: 88px !important;  /* 收窄副券，释放左侧主票面24px呼吸空间 */
      --notch-r: 7.5px !important; /* 咬口比例对齐手机尺度，不突兀 */
      margin: 10px auto !important;
    }
    .tkt-main {
      padding: 12px 12px 8px 12px !important;
      gap: 5px !important;
    }
    .tkt-type-tag {
      font-size: 7px !important;
      padding: 1px 4px !important;
    }
    .tkt-curator-mark {
      font-size: 7px !important;
    }
    .tkt-header-seq {
      font-size: 8px !important;
    }
    .tkt-title-meta-badge {
      font-size: 7px !important;
      letter-spacing: 0.8px !important;
    }
    .tkt-title-text {
      font-size: 30px !important; /* 主标题增大，重塑 PC 视觉张力 */
      letter-spacing: 1.6px !important;
      margin: 2px 0 1px !important;
      line-height: 1 !important;
    }
    .tkt-sign-zone {
      margin-top: 2px !important;
      gap: 5px !important;
    }
    .tkt-sign-lbl {
      font-size: 7.5px !important;
      letter-spacing: 1px !important;
    }
    .tkt-lang-zh-cn, .tkt-lang-zh-tw, .tkt-lang-ja {
      font-size: 15px !important;
    }
    .tkt-lang-en, .tkt-lang-fr, .tkt-lang-it, .tkt-lang-ru {
      font-size: 18px !important;
    }
    .tkt-lang-ko {
      font-size: 15px !important;
    }
    .tkt-quick-grid {
      margin-top: 4px !important;
      grid-template-columns: 1.4fr 1fr 1fr !important;
    }
    .tkt-meta-block {
      padding: 3px 5px !important;
    }
    .tkt-meta-lbl {
      font-size: 6.5px !important;
      margin-bottom: 2px !important;
    }
    .tkt-meta-txt {
      font-size: 9.5px !important;
    }
    .tkt-hook-glance-time {
      font-size: 8.5px !important;
    }
    .tkt-fold {
      font-size: 7.5px !important;
      letter-spacing: 1px !important;
      padding-top: 4px !important;
    }
    .tkt-fold-dot {
      width: 3.5px !important;
      height: 3.5px !important;
    }
    .tkt-stub {
      padding: 10px 6px !important;
    }
    .tkt-stub-tag {
      font-size: 6.5px !important;
      letter-spacing: 1.2px !important;
      padding-bottom: 2px !important;
    }
    .tkt-stub-serial {
      font-size: 12px !important;
      letter-spacing: 1.5px !important;
      margin: 2px 0 !important;
    }
    .tkt-btn {
      font-size: 7.5px !important;
      padding: 3px 2px !important;
      letter-spacing: 0.5px !important;
    }
    .tkt-stub-actions {
      margin: 4px 0 !important;
      gap: 3px !important;
    }
    .tkt-stamp {
      font-size: 6.5px !important;
      padding: 2px 3px !important;
      letter-spacing: 0.8px !important;
    }
    .tkt-stub-notice {
      font-size: 5.5px !important;
      letter-spacing: 0.8px !important;
    }
    .tkt-stub-footer {
      min-height: 28px !important;
    }
    .tkt-watermark {
      height: 125px !important;
    }
    .tkt-love-svg {
      height: 80px !important;
    }
    .tkt-container.is-open .tkt-body {
      padding: 12px 14px 14px 14px !important;
    }
    .tkt-sec {
      font-size: 7.5px !important;
      margin-bottom: 8px !important;
    }
    .tkt-env {
      margin-bottom: 12px !important;
    }
    .tkt-cell {
      padding: 6px 8px !important;
    }
    .tkt-cell-lbl {
      font-size: 6.5px !important;
      margin-bottom: 3px !important;
    }
    .tkt-cell-val {
      font-size: 10px !important;
    }
    .tkt-roster {
      gap: 8px !important;
    }
    .tkt-entity {
      padding: 10px 12px !important;
    }
    .tkt-entity-name {
      font-size: 12px !important;
    }
    .tkt-pill {
      font-size: 6.5px !important;
      padding: 1px 3px !important;
    }
    .tkt-gauges {
      gap: 8px !important;
      margin-bottom: 8px !important;
    }
    .tkt-gauge-lbl {
      font-size: 7.5px !important;
    }
    .tkt-gauge-lbl .gauge-code {
      font-size: 7px !important;
    }
    .tkt-gauge-track {
      height: 4px !important;
    }
    .tkt-narrative {
      grid-template-columns: 75px 1fr !important;
      gap: 10px !important;
      padding-top: 8px !important;
    }
    .tkt-outfit {
      font-size: 7.5px !important;
    }
    .tkt-quote {
      font-size: 10px !important;
    }
    .tkt-bottom {
      padding: 8px 12px 10px 12px !important;
    }
    .tkt-warn {
      font-size: 6px !important;
      line-height: 1.3 !important;
    }
    .tkt-barcode {
      height: 20px !important;
    }
    .tkt-bar {
      height: 16px !important;
    }
    .tkt-bar.is-guard {
      height: 20px !important;
    }
    .tkt-barcode-serial {
      font-size: 5.5px !important;
    }
  }`;

  const SKIN_CSS_BOOK = `.mp-skin-book{
  --paper-bg: #151619; --paper-inner-bg: #1a1b1f;
  --frame-border: rgba(220,205,180,0.12); --ink-primary: #ede8df;
  --ink-secondary: #8c8f96; --ink-poem-origin: #dfc8a7;
  --ink-poem-trans: #ab9b86; --ink-seal-bg: rgba(184,51,42,0.2);
  --ink-seal-border: #b8332a; --ink-seal-text: #e06a61;
  --divider: rgba(255,255,255,0.1); --shadow-color: rgba(0,0,0,0.45);
}.mp-skin-book[data-theme="day"]{
  --paper-bg: #f5f0e6; --paper-inner-bg: #f9f6ef;
  --frame-border: rgba(90,70,50,0.15); --ink-primary: #1f1b18;
  --ink-secondary: #7a7267; --ink-poem-origin: #422f1d;
  --ink-poem-trans: #735d4b; --ink-seal-bg: #ab3b30;
  --ink-seal-border: #ab3b30; --ink-seal-text: #f9f6ef;
  --divider: rgba(90,70,50,0.12); --shadow-color: rgba(60,45,30,0.08);
}.mp-skin-book *{ box-sizing: border-box; margin: 0; padding: 0; user-select: none; }.mp-skin-book{
  background: transparent; padding: 20px 0; margin: 0;
  display: flex; justify-content: center; align-items: center;
  font-family: "Noto Serif SC", -apple-system, serif;
  -webkit-font-smoothing: antialiased;
}.mp-skin-book .namecard-deck{ display: flex; flex-direction: column; gap: 18px; align-items: center; }.mp-skin-book .card-stage{ width: 350px; height: 210px; perspective: 1200px; }.mp-skin-book .card-flipper{
  width: 100%; height: 100%; position: relative;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.16,1,0.3,1);
  cursor: pointer;
}.mp-skin-book .card-stage.is-flipped .card-flipper{ transform: rotateY(180deg); }.mp-skin-book .card-washi{
  position: absolute; inset: 0; width: 100%; height: 100%;
  background-color: var(--paper-bg); border-radius: 3px; padding: 10px;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  overflow: hidden;
  box-shadow: 0 10px 25px var(--shadow-color), inset 0 0 0 1px var(--frame-border);
  transition: background-color 0.4s ease, box-shadow 0.4s ease;
}.mp-skin-book .washi-inner-box{
  width: 100%; height: 100%;
  background-color: var(--paper-inner-bg);
  border: 1px solid var(--frame-border);
  position: relative; padding: 14px 16px;
  display: flex; flex-direction: column; justify-content: space-between;
}.mp-skin-book .washi-inner-box::before{ content:"+"; position:absolute; top:4px; left:6px; font-size:8px; color:var(--frame-border); font-family:monospace; }.mp-skin-book .washi-inner-box::after{ content:"+"; position:absolute; bottom:4px; right:6px; font-size:8px; color:var(--frame-border); font-family:monospace; }.mp-skin-book .washi-front{ z-index: 2; }.mp-skin-book .season-seal-btn{
  position: absolute; top: 14px; left: 16px; z-index: 5;
  background: transparent; border: none; color: var(--ink-secondary);
  font-size: 9px; letter-spacing: 0.16em; cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  font-family: 'Cinzel', serif; transition: color 0.2s ease;
}.mp-skin-book .season-seal-btn:hover{ color: var(--ink-poem-origin); }.mp-skin-book .season-dot{ width:4px; height:4px; border-radius:50%; background-color:var(--ink-poem-origin); display:inline-block; }.mp-skin-book .interlinear-poem-stage{
  position: absolute; top: 50%; transform: translateY(-50%); right: 24px;
  writing-mode: vertical-rl; text-orientation: upright;
  pointer-events: none; z-index: 2;
}.mp-skin-book .couplet-unit{ display: inline-block; vertical-align: top; margin-left: 14px; }.mp-skin-book .couplet-origin{
  display: block; white-space: nowrap;
  font-family: 'Yuji Boku', 'Noto Serif SC', serif;
  font-size: 13.5px; letter-spacing: 0.16em; line-height: 1.35;
  color: var(--ink-poem-origin); opacity: 0.95; margin-left: 5px;
}.mp-skin-book .couplet-trans{
  display: block; white-space: nowrap;
  font-family: 'Noto Serif SC', serif; font-weight: 400;
  font-size: 9.5px; letter-spacing: 0.18em; line-height: 1.35;
  color: var(--ink-poem-trans); opacity: 0.85; padding-top: 2px;
}.mp-skin-book .front-author-lockup{
  position: absolute; left: 18px; bottom: 16px; z-index: 3;
  display: flex; flex-direction: column; gap: 4px;
}.mp-skin-book .char-latin-name{
  font-family: 'Cinzel', serif; font-size: 12.5px; font-weight: 700;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--ink-secondary); line-height: 1;
}.mp-skin-book .signature-row{ display: flex; align-items: baseline; gap: 8px; }.mp-skin-book .char-handwritten-signature{
  font-family: 'Yuji Boku', 'Noto Serif SC', serif;
  font-size: 23px; letter-spacing: 0.14em;
  color: var(--ink-primary); line-height: 1;
}.mp-skin-book .hanko-seal{
  width: 14px; height: 14px;
  display: inline-flex; justify-content: center; align-items: center;
  border: 1px solid var(--ink-seal-border);
  background-color: var(--ink-seal-bg);
  color: var(--ink-seal-text); font-size: 8px;
  font-family: 'Noto Serif SC', serif; line-height: 1;
  border-radius: 1px; transform: translateY(-2px);
}.mp-skin-book .flip-guide-under-sig{
  font-family: 'Cinzel', serif; font-size: 7.5px;
  letter-spacing: 0.22em; color: var(--ink-secondary);
  opacity: 0.45; margin-top: 3px;
}.mp-skin-book .washi-back{ transform: rotateY(180deg); z-index: 1; }.mp-skin-book .back-header{
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 7px; border-bottom: 1px solid var(--divider);
}.mp-skin-book .back-header-title{
  font-family: 'Cinzel', serif; font-size: 9px;
  letter-spacing: 0.28em; color: var(--ink-secondary);
}.mp-skin-book .back-header-stage{ font-size: 9.5px; letter-spacing: 0.12em; color: var(--ink-poem-origin); }.mp-skin-book .back-metrics-grid{
  display: grid; grid-template-columns: repeat(4, 1fr);
  margin: 12px 0; border-bottom: 1px solid var(--divider); padding-bottom: 11px;
}.mp-skin-book .metric-item{ display: flex; flex-direction: column; align-items: center; position: relative; }.mp-skin-book .metric-item:not(:last-child)::after{
  content:""; position:absolute; right:0; top:15%; height:70%; width:1px;
  background-color: var(--divider);
}.mp-skin-book .metric-tag{
  font-family: 'Cinzel', serif; font-size: 7.5px;
  letter-spacing: 0.18em; color: var(--ink-secondary); margin-bottom: 2px;
}.mp-skin-book .metric-number{
  font-family: 'Cormorant Garamond', monospace;
  font-size: 17px; font-weight: 600; color: var(--ink-primary); line-height: 1.1;
}.mp-skin-book .metric-cn{ font-size: 8px; color: var(--ink-secondary); letter-spacing: 0.08em; margin-top: 1px; }.mp-skin-book .back-voice-wrap{ display: flex; gap: 10px; align-items: flex-start; padding-top: 2px; }.mp-skin-book .back-voice-emoji{ font-size: 15px; line-height: 1; opacity: 0.85; padding-top: 1px; }.mp-skin-book .back-voice-quote{
  font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
  font-size: 11px; line-height: 1.6; color: var(--ink-primary);
  font-style: italic; letter-spacing: 0.04em;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis; opacity: 0.9;
}.mp-skin-book .empty-card{
  text-align: center; padding: 70px 0;
  color: var(--ink-secondary); font-size: 11px; letter-spacing: 0.15em;
}`;

  const SKIN_CSS_PROPHET = `/* ══════════════════════════════════════════════════════════════════
 * 88-skin.js · 楼内状态卡「预言家日报」样式
 * 视觉参考：prophet-daily-extension（哈利波特电影道具风格的报纸头版）
 * 只取风格与排版，不带扩展的 launcher / 设置面板 / IndexedDB 图库。
 *
 * 隔离约定：
 *   1. 所有选择器以 .mp-skin-prophet 开头，类名统一 mpp- 前缀，
 *      不与玩家已安装的原扩展（.dp-*）争样式。
 *   2. 不写 body / :root / 通配符，不影响酒馆任何原生元素。
 *   3. @keyframes 名字带 mpp- 前缀，避免与其他皮肤撞名。
 * ══════════════════════════════════════════════════════════════════ */

.mp-skin-prophet {
  --mpp-paper: #e9dfc5;
  --mpp-paper-deep: #d8caa8;
  --mpp-ink: #211d17;
  --mpp-ink-soft: #4a4030;
  --mpp-rule: #3c3327;
  --mpp-rule-soft: #9b8967;
  --mpp-gold: #a58b5d;
  --mpp-gold-deep: #6c5830;
  margin: 10px 0 2px;
  font-family: Georgia, "Noto Serif SC", "Songti SC", "SimSun", serif;
  color: var(--mpp-ink);
  line-height: 1.55;
}

/* ── 折叠条：不展开时只有这一行，不占版面 ─────────────────────── */
.mp-skin-prophet .mpp-fold {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  text-align: left;
  padding: 9px 13px;
  background: linear-gradient(90deg, #2d251d, #51402b, #2d251d);
  color: #f0e1bf;
  border: 1px solid #9d8456;
  font: 700 13px Georgia, "Noto Serif SC", "Songti SC", serif;
  letter-spacing: .6px;
  cursor: pointer;
  box-sizing: border-box;
  transition: filter .12s, border-color .12s;
}
.mp-skin-prophet .mpp-fold:hover {
  filter: brightness(1.14);
  border-color: #c3a874;
}
.mp-skin-prophet .mpp-fold-star {
  color: #d7bd86;
  font-size: 12px;
  flex: 0 0 auto;
}
.mp-skin-prophet .mpp-fold-hint {
  margin-left: auto;
  font-size: 10px;
  font-weight: 400;
  opacity: .78;
  letter-spacing: .3px;
  white-space: nowrap;
}
.mp-skin-prophet .mpp-fold-open { display: none; }
.mp-skin-prophet.is-open .mpp-fold-open { display: inline; }
.mp-skin-prophet.is-open .mpp-fold-closed { display: none; }

/* ── 报纸本体 ─────────────────────────────────────────────── */
.mp-skin-prophet .mpp-body[hidden] { display: none; }

.mp-skin-prophet .mpp-paper {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  margin-top: 6px;
  padding: clamp(12px, 2.2vw, 24px);
  background-color: var(--mpp-paper);
  background-image:
    repeating-linear-gradient(0deg,
      rgba(108, 88, 48, .13) 0, rgba(108, 88, 48, .13) 1px,
      transparent 1px, transparent 4px),
    linear-gradient(95deg, rgba(0, 0, 0, .05), transparent 7%, rgba(255, 255, 255, .16) 49%, rgba(0, 0, 0, .05));
  border: 1px solid #a18d66;
  box-shadow: inset 0 0 22px rgba(121, 103, 68, .22), 2px 4px 10px rgba(0, 0, 0, .28);
  animation: mpp-unfold .42s ease both;
}

/* 纸面中缝与上下旧化 */
.mp-skin-prophet .mpp-paper::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    linear-gradient(90deg, transparent 49.6%, rgba(111, 92, 61, .10) 50%, transparent 50.4%),
    linear-gradient(180deg, rgba(255, 255, 255, .28) 0, transparent 14%, transparent 86%, rgba(107, 87, 48, .16) 100%);
}

@keyframes mpp-unfold {
  /* 不从 0 起：展开放大动画不该有一帧整张白纸看不见 */
  from { opacity: .62; transform: perspective(900px) rotateX(-4deg) scaleY(.97); }
  to { opacity: 1; transform: none; }
}

/* ── 报头 ─────────────────────────────────────────────────── */
.mp-skin-prophet .mpp-topline,
.mp-skin-prophet .mpp-edition,
.mp-skin-prophet .mpp-foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 8.5px;
  letter-spacing: .35px;
  color: var(--mpp-ink-soft);
}
.mp-skin-prophet .mpp-topline {
  border-bottom: 1px solid var(--mpp-rule);
  padding-bottom: 4px;
}
.mp-skin-prophet .mpp-mast {
  text-align: center;
  padding: 6px 0 4px;
  border-bottom: 4px double #241f19;
}
.mp-skin-prophet .mpp-mast-small {
  font-size: 7.5px;
  letter-spacing: 2.2px;
  text-transform: uppercase;
}
.mp-skin-prophet .mpp-mast-cn {
  font-size: clamp(30px, 6.4vw, 52px);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: .14em;
  text-indent: .14em;
  text-shadow: 1px 1px rgba(255, 255, 255, .55), -1px -1px rgba(76, 64, 46, .18);
}
.mp-skin-prophet .mpp-mast-en {
  font-size: 9px;
  letter-spacing: 4.6px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: .82;
}
.mp-skin-prophet .mpp-edition { padding: 5px 0; }
.mp-skin-prophet .mpp-rule-d {
  height: 0;
  border-top: 1px solid var(--mpp-rule);
  margin: 1px 0 7px;
}

/* ── 头条 ─────────────────────────────────────────────────── */
.mp-skin-prophet .mpp-headline {
  font-size: clamp(18px, 3.6vw, 30px);
  line-height: 1.15;
  font-weight: 900;
  text-align: center;
  letter-spacing: .04em;
  padding: 2px 1% 4px;
  text-wrap: balance;
}
.mp-skin-prophet .mpp-deck {
  text-align: center;
  font-size: 9.5px;
  color: var(--mpp-ink-soft);
  border-bottom: 1px solid #40372a;
  padding-bottom: 7px;
  margin-bottom: 9px;
  letter-spacing: .3px;
}

/* ── 双栏 ─────────────────────────────────────────────────── */
.mp-skin-prophet .mpp-cols {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(128px, .85fr);
  gap: 12px;
}
.mp-skin-prophet .mpp-main {
  min-width: 0;
  display: flow-root; /* 收住浮动，免得正文比剪影短时下面拖一大块空 */
}

/* 人物肖像：没有图就用报纸剪影，绝不空一块白 */
.mp-skin-prophet .mpp-photo-frame {
  float: left;
  width: min(40%, 180px);
  margin: 2px 11px 7px 0;
  padding: 4px;
  background: #d2c5a7;
  border: 1px solid #786849;
  box-shadow: 1px 2px 4px rgba(0, 0, 0, .25);
}
.mp-skin-prophet .mpp-photo {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: linear-gradient(160deg, #cbbd9d, #b8a884);
}
.mp-skin-prophet .mpp-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(.14) contrast(1.03);
}
.mp-skin-prophet .mpp-silhouette i,
.mp-skin-prophet .mpp-silhouette b {
  position: absolute;
  left: 50%;
  display: block;
  background: #9a8a67;
  transform: translateX(-50%);
}
.mp-skin-prophet .mpp-silhouette i {
  top: 20%;
  width: 32%;
  aspect-ratio: 1;
  border-radius: 50%;
}
.mp-skin-prophet .mpp-silhouette b {
  bottom: -16%;
  width: 74%;
  height: 56%;
  border-radius: 50% 50% 0 0;
  background: #8d7d5e;
}
.mp-skin-prophet .mpp-silhouette em {
  position: absolute;
  right: 5px;
  bottom: 3px;
  font-size: 8.5px;
  font-style: normal;
  letter-spacing: .18em;
  color: #5c503a;
}
.mp-skin-prophet .mpp-caption {
  display: block;
  font-size: 8.5px;
  text-align: center;
  padding-top: 3px;
  color: var(--mpp-ink-soft);
}

.mp-skin-prophet .mpp-lead {
  font-size: 12.5px;
  line-height: 1.72;
  margin: 0 0 7px;
  text-align: justify;
}
.mp-skin-prophet .mpp-lead::first-letter {
  font-size: 24px;
  float: left;
  line-height: .92;
  padding: 2px 3px 0 0;
  font-weight: 700;
}
.mp-skin-prophet .mpp-bodycopy {
  font-size: 11px;
  line-height: 1.62;
  text-align: justify;
  margin: 0 0 6px;
  color: var(--mpp-ink-soft);
}

/* ── 侧栏：人物档案 ───────────────────────────────────────── */
.mp-skin-prophet .mpp-side {
  border-left: 1px solid #77664a;
  padding-left: 10px;
  font-size: 10.5px;
  min-width: 0;
}
.mp-skin-prophet .mpp-side-head {
  font-size: 13.5px;
  font-weight: 700;
  text-align: center;
  border-top: 3px double var(--mpp-rule);
  border-bottom: 1px solid var(--mpp-rule);
  padding: 4px 0;
  margin-bottom: 3px;
  letter-spacing: .18em;
  text-indent: .18em;
}
.mp-skin-prophet .mpp-stat {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  border-bottom: 1px dotted var(--mpp-rule-soft);
  padding: 4px 0;
}
.mp-skin-prophet .mpp-stat b { font-weight: 400; color: var(--mpp-ink-soft); white-space: nowrap; }
.mp-skin-prophet .mpp-stat span { text-align: right; font-weight: 700; overflow-wrap: anywhere; }
.mp-skin-prophet .mpp-stat-num { font-variant-numeric: tabular-nums; }

.mp-skin-prophet .mpp-quote {
  margin-top: 9px;
  padding: 7px 8px;
  background: #d9ceb2;
  border-left: 3px solid #776344;
  font-size: 10.5px;
  line-height: 1.55;
  font-style: italic;
  overflow-wrap: anywhere;
}
.mp-skin-prophet .mpp-quote-title {
  font-style: normal;
  font-weight: 700;
  font-size: 9px;
  letter-spacing: .12em;
  margin-bottom: 3px;
  color: var(--mpp-ink-soft);
}
.mp-skin-prophet .mpp-sign {
  text-align: right;
  margin-top: 6px;
  font-size: 9.5px;
  color: var(--mpp-ink-soft);
}

/* ── 简讯：其他在场角色一行一条 ───────────────────────────── */
.mp-skin-prophet .mpp-briefs {
  margin-top: 10px;
  border-top: 3px double var(--mpp-rule);
  padding-top: 6px;
}
.mp-skin-prophet .mpp-briefs-head {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .2em;
  text-indent: .2em;
  margin-bottom: 3px;
}
.mp-skin-prophet .mpp-brief {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
  font-size: 9.5px;
  color: var(--mpp-ink);
  padding: 3px 0;
  border-bottom: 1px dotted var(--mpp-rule-soft);
}
.mp-skin-prophet .mpp-brief span:first-child { font-weight: 700; overflow-wrap: anywhere; }
.mp-skin-prophet .mpp-brief span:last-child { color: var(--mpp-ink-soft); white-space: nowrap; }

/* ── 页脚 ─────────────────────────────────────────────────── */
.mp-skin-prophet .mpp-foot {
  border-top: 3px double #30281e;
  margin-top: 10px;
  padding-top: 5px;
  font-size: 8.5px;
}

/* 空态：没有角色档案时也要像一张报纸 */
.mp-skin-prophet .mpp-empty {
  padding: 22px 6px;
  text-align: center;
  font-size: 12px;
  line-height: 1.9;
  letter-spacing: .05em;
}
.mp-skin-prophet .mpp-empty small {
  display: block;
  font-size: 9.5px;
  color: var(--mpp-ink-soft);
  margin-top: 3px;
}

/* ── 窄屏：收成单栏，侧栏掉到正文下方 ─────────────────────── */
@media (max-width: 620px) {
  .mp-skin-prophet .mpp-paper { padding: 11px; }
  .mp-skin-prophet .mpp-cols { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .mp-skin-prophet .mpp-side {
    border-left: 0;
    border-top: 3px double var(--mpp-rule);
    padding: 7px 0 0;
    margin-top: 8px;
  }
  .mp-skin-prophet .mpp-photo-frame { width: 34%; margin-right: 8px; }
  .mp-skin-prophet .mpp-mast-cn { font-size: clamp(26px, 9vw, 40px); }
  .mp-skin-prophet .mpp-headline { font-size: clamp(17px, 5.2vw, 24px); }
  .mp-skin-prophet .mpp-topline,
  .mp-skin-prophet .mpp-edition,
  .mp-skin-prophet .mpp-foot { font-size: 7.5px; }
  .mp-skin-prophet .mpp-lead { font-size: 11.5px; }
}

/* ── 宽屏：图片缩回一点，正文保持单栏（楼内宽度撑两栏会把句子切碎）── */
@media (min-width: 760px) {
  .mp-skin-prophet .mpp-photo-frame { width: min(33%, 170px); }
}`;

  const SKIN_TICKET_TPL = `<div class="tkt-container" data-theme="auto">
  <div class="tkt-board">
    <div class="tkt-notch-top"></div>
    <div class="tkt-notch-bottom"></div>
    <span class="tkt-cross-mark tkt-cross-tl">+</span>
    <span class="tkt-cross-mark tkt-cross-tr">+</span>
    <span class="tkt-cross-mark tkt-cross-bl">+</span>

    <div class="tkt-watermark tkt-hook-watermark"><span>AMORE</span></div>

    <svg class="tkt-love-svg" viewBox="0 0 490 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="tkt-love-hit" d="
        M -10,72
        C 55,72 85,70 115,67
        C 135,65 148,61 158,52
        C 172,39 192,18 198,20
        C 204,22 182,50 170,68
        C 161,81 151,95 155,97
        C 158,98 166,92 174,82
        C 182,72 191,59 199,57
        C 206,55 212,63 206,73
        C 200,83 188,84 184,77
        C 180,70 186,58 196,56
        C 204,54 210,63 216,67
        C 222,72 226,78 230,62
        C 233,50 242,47 248,52
        C 253,56 248,64 242,71
        C 236,78 239,84 246,84
        C 254,84 263,76 272,66
        C 282,56 286,53 282,52
        C 276,50 266,60 268,72
        C 270,82 280,86 292,88
        C 308,90 325,90 345,90
        C 365,90 385,90 408,90
        C 430,90 455,92 478,95
        C 488,96 495,97 500,98
      " />
      <path class="tkt-love-path" pathLength="1000" d="
        M -10,72
        C 55,72 85,70 115,67
        C 135,65 148,61 158,52
        C 172,39 192,18 198,20
        C 204,22 182,50 170,68
        C 161,81 151,95 155,97
        C 158,98 166,92 174,82
        C 182,72 191,59 199,57
        C 206,55 212,63 206,73
        C 200,83 188,84 184,77
        C 180,70 186,58 196,56
        C 204,54 210,63 216,67
        C 222,72 226,78 230,62
        C 233,50 242,47 248,52
        C 253,56 248,64 242,71
        C 236,78 239,84 246,84
        C 254,84 263,76 272,66
        C 282,56 286,53 282,52
        C 276,50 266,60 268,72
        C 270,82 280,86 292,88
        C 308,90 325,90 345,90
        C 365,90 385,90 408,90
        C 430,90 455,92 478,95
        C 488,96 495,97 500,98
      " />
    </svg>

    <!-- 票券主联与撕存联 -->
    <div class="tkt-face tkt-hook-open">
      <div class="tkt-main">
        <div class="tkt-slip-header">
          <div class="tkt-header-left">
            <span class="tkt-type-tag">BIENNALE ADMIT</span>
            <span class="tkt-curator-mark">EDITION 01/01</span>
          </div>
          <span class="tkt-header-seq tkt-hook-seq">NO. 0000 // ARCHIVE</span>
        </div>

        <div class="tkt-name-stage">
          <div class="tkt-title-meta-badge">GALLERY ACCESS · CATALOGUE RAISONNÉ</div>
          <span class="tkt-title-text tkt-hook-char-latin">AMORE</span>

          <div class="tkt-sign-zone">
            <span class="tkt-sign-lbl">ISSUED TO:</span>
            <span class="tkt-name-native tkt-hook-char-native"></span>
          </div>
        </div>

        <!-- 瑞士网格环境栏 -->
        <div class="tkt-quick-grid">
          <div class="tkt-meta-block">
            <span class="tkt-meta-lbl">TIME / 展期</span>
            <span class="tkt-meta-txt tkt-hook-glance-time">未知</span>
          </div>
          <div class="tkt-meta-block">
            <span class="tkt-meta-lbl">VENUE / 展馆</span>
            <span class="tkt-meta-txt tkt-hook-glance-loc">未知</span>
          </div>
          <div class="tkt-meta-block">
            <span class="tkt-meta-lbl">CLIMATE / 气候</span>
            <span class="tkt-meta-txt tkt-hook-glance-weather">未知</span>
          </div>
        </div>

        <div class="tkt-fold">
          <div class="tkt-fold-status">
            <span class="tkt-fold-dot"></span>
            <span>INSPECT CURATORIAL MANIFEST</span>
          </div>
          <span class="arrow">▼</span>
        </div>
      </div>

      <!-- 撕下副券 (Stub) -->
      <div class="tkt-stub">
        <div class="tkt-stub-tag">PASS STUB</div>
        <div class="tkt-stub-serial tkt-hook-stub-id">#000</div>

        <div class="tkt-stub-actions">
          <button type="button" class="tkt-btn tkt-hook-btn-mode" title="切换夜间/日间展厅模式">
            MODE <span class="tkt-theme-icon">◐</span>
          </button>
          <button type="button" class="tkt-btn tkt-hook-btn-toggle">
            <span class="tkt-hook-toggle-word">UNFOLD</span>
          </button>
        </div>

        <div class="tkt-stub-footer">
          <div class="tkt-stamp">★ ADMITTED ★</div>
          <div class="tkt-stub-notice">NON-TRANSFERABLE</div>
        </div>
      </div>
    </div>

    <!-- 展开详情区 -->
    <div class="tkt-body">
      <div class="tkt-sec">
        <span>EXHIBITION PAVILION // 展馆环境</span>
        <span class="tkt-sec-tag">SECT. 01</span>
      </div>
      <div class="tkt-env">
        <div class="tkt-cell">
          <div class="tkt-cell-lbl">TERRAIN / 地形</div>
          <div class="tkt-cell-val tkt-hook-loc">未知</div>
        </div>
        <div class="tkt-cell">
          <div class="tkt-cell-lbl">METEOROLOGY / 气象</div>
          <div class="tkt-cell-val tkt-hook-weather">未知</div>
        </div>
        <div class="tkt-cell">
          <div class="tkt-cell-lbl">AMBIENT TEMP / 气温</div>
          <div class="tkt-cell-val tkt-hook-temp">未知</div>
        </div>
      </div>

      <div class="tkt-sec">
        <span>PERSONA PROFILE // 参展样本名册</span>
        <span class="tkt-sec-tag">SECT. 02</span>
      </div>
      <div class="tkt-roster tkt-hook-roster"></div>
    </div>

    <!-- 底部版记与条形码 -->
    <div class="tkt-bottom">
      <div class="tkt-warn">
        <strong>THE TWILIGHT LINE</strong> // EXHIBITION SERIES BY SYLVAINE<br />
        ARCHIVAL DOSSIER · STRICTLY PRESERVED · MODS PERMITTED
      </div>
      <div class="tkt-barcode-wrap">
        <div class="tkt-barcode">
          <span class="tkt-bar tkt-w1 is-guard"></span>
          <span class="tkt-bar tkt-w1 is-guard"></span>
          <span class="tkt-bar tkt-w2"></span>
          <span class="tkt-bar tkt-w1"></span>
          <span class="tkt-bar tkt-w3"></span>
          <span class="tkt-bar tkt-w1"></span>
          <span class="tkt-bar tkt-w2"></span>
          <span class="tkt-bar tkt-w1"></span>
          <span class="tkt-bar tkt-w1 is-guard"></span>
          <span class="tkt-bar tkt-w1 is-guard"></span>
          <span class="tkt-bar tkt-w2"></span>
          <span class="tkt-bar tkt-w3"></span>
          <span class="tkt-bar tkt-w1"></span>
          <span class="tkt-bar tkt-w2"></span>
          <span class="tkt-bar tkt-w1"></span>
          <span class="tkt-bar tkt-w3"></span>
          <span class="tkt-bar tkt-w1 is-guard"></span>
          <span class="tkt-bar tkt-w1 is-guard"></span>
        </div>
        <span class="tkt-barcode-serial">№ 082024</span>
      </div>
    </div>
  </div>
</div>`;

  function isSkinId(value) {
    return !!SKIN_LIST.filter(function(x) { return x.id === value; })[0];
  }

  function getSkinId() {
    try {
      const store = getStorage();
      const saved = store ? store.getItem(SKIN_KEY) : null;
      if (isSkinId(saved)) return saved;
    } catch (e) {}
    return 'none';
  }

  function setSkinId(next) {
    const id = (isSkinId(next) && next !== 'none') ? next : 'none';
    try { const store = getStorage(); if (store) store.setItem(SKIN_KEY, id); } catch (e) {}
    refreshMessageSkins();
    return id;
  }

  function skinEsc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getSkinStatData() {
    try {
      const data = readMvuLatest();
      return (data && data.stat_data) || null;
    } catch (e) { return null; }
  }

  function ensureSkinStyle(id) {
    if (!isSkinId(id) || id === 'none') return;
    const styleId = 'moon-skin-style-' + id;
    if (mainDoc.getElementById(styleId)) return;
    const styleEl = mainDoc.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = (id === 'ticket') ? SKIN_CSS_TICKET
      : (id === 'book') ? SKIN_CSS_BOOK
      : SKIN_CSS_PROPHET;
    (mainDoc.head || mainDoc.documentElement).appendChild(styleEl);
  }

  /* ── 数据适配：脚本字段 → 美化需要的字段 ───────────────── */
  function adaptStatForSkin(statData) {
    const out = { 世界: {}, 角色: {} };
    if (!statData || typeof statData !== 'object') return out;
    out.世界 = Object.assign({}, statData.世界 || {});
    const chars = statData.角色 || {};
    const next = {};
    Object.keys(chars).forEach(function(name) {
      const src = chars[name] || {};
      const c = Object.assign({}, src);
      const E = Number(c.好感度);
      const R = Number(c.阶段值);
      if (c.情感值 === undefined) c.情感值 = isNaN(E) ? 0 : E;
      if (c.关系值 === undefined) {
        const phase = isNaN(R) ? 0 : R;
        c.关系值 = Math.max(0, Math.min(100, Math.round(phase * 20)));
      }
      if (!c.服饰) c.服饰 = '未记录';
      next[name] = c;
    });
    out.角色 = next;
    return out;
  }

  /* ── 晨昏票根：移植自原正则（仅换数据入口）─────────────── */
function renderTicketSkin(p_root, p_statData, p_msgId) {
  if (!p_root) return;
  var doc = p_root.ownerDocument || document;
/* ★ 纯净值提取函数 ★ */
  function clean(val, fallback) {
    if (val === undefined || val === null) return fallback || '';
    var str = String(val).trim();
    if (str.indexOf('->') !== -1) {
      var parts = str.split('->');
      str = parts[parts.length - 1].trim();
    }
    str = str.replace(/^[->\s]+/, '').trim();
    return str || fallback || '';
  }

  function cleanNum(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    var str = clean(val, '0');
    var num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  /* ★ 1. 前置安全黑名单与映射字典 ★ */
  var BLACKLIST = [
    '示例角色', '示例', '示例角色名', 'Example', 'Example Character',
    'Unknown', '未知', '未知角色', 'placeholder', 'Placeholder',
    '角色名', '名字', '角色A', '角色B', '角色C', '角色D',
    'Character', 'CharacterA', 'CharacterB', 'NPC', 'npc',
    '主人公', '主角', '配角', '路人', '群众', '村民'
  ];

  function isBlacklisted(name) {
    if (!name) return true;
    var n = String(name).trim();
    for (var i = 0; i < BLACKLIST.length; i++) {
      if (n === BLACKLIST[i]) return true;
    }
    return false;
  }

  var NATIVE_DICTIONARY = {
    '太宰治': { ja: '太宰 治', romaji: 'DAZAI' },
    '太宰 治': { ja: '太宰 治', romaji: 'DAZAI' },
    '中原中也': { ja: '中原 中也', romaji: 'CHUUYA' },
    '中原 中也': { ja: '中原 中也', romaji: 'CHUUYA' },
    '中岛敦': { ja: '中島 敦', romaji: 'ATSUSHI' },
    '中島 敦': { ja: '中島 敦', romaji: 'ATSUSHI' },
    '芥川龙之介': { ja: '芥川 龍之介', romaji: 'AKUTAGAWA' },
    '芥川 龍之介': { ja: '芥川 龍之介', romaji: 'AKUTAGAWA' },
    '江户川乱步': { ja: '江戸川 乱歩', romaji: 'RANPO' },
    '江戸川 乱步': { ja: '江戸川 乱歩', romaji: 'RANPO' },
    '国木田独步': { ja: '国木田 独歩', romaji: 'KUNIKIDA' },
    '福泽谕吉': { ja: '福沢 諭吉', romaji: 'FUKUZAWA' },
    '森鸥外': { ja: '森 鴎外', romaji: 'MORI' },
    '织田作之助': { ja: '織田 作之助', romaji: 'ODASAKU' },
    '陀思妥耶夫斯基': { ja: 'ドストエフスキー', ru: 'Фёдор Д.', romaji: 'FYODOR' },
    '费奥多尔': { ja: 'フョードル', ru: 'Фёдор', romaji: 'FYODOR' },
    '文豪ストレイドッグス': { ja: '文豪ストレイドッグス', romaji: 'BUNGO' }
  };

  var root = p_root;
  var msgId = p_msgId || 0;
  var rawVars = p_statData || {};
var worldData = (rawVars && rawVars['世界']) || {};
  var charsData = (rawVars && rawVars['角色']) || {};

  function formatTicketDate(str) {
    str = clean(str, '未知');
    if (!str || str === '未知') return '未知';

    var timePart = '';
    var timeMatch = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      timePart = String(timeMatch[1]).padStart(2, '0') + ':' + timeMatch[2];
    }

    var year = '', month = '', day = '';
    var dateMatch = str.match(/(\d{4})[年\-\/\.](\d{1,2})[月\-\/\.](\d{1,2})[日号]?/);
    if (dateMatch) {
      year = dateMatch[1];
      month = String(dateMatch[2]).padStart(2, '0');
      day = String(dateMatch[3]).padStart(2, '0');
    }

    if (year && month && day) {
      var datePart = year + '.' + month + '.' + day;
      if (timePart) {
        return datePart + ' · ' + timePart;
      }
      return datePart;
    }

    if (timePart && !year) {
      return timePart;
    }

    return str.replace(/星期|周/g, '').replace(/\s+/g, ' ').trim();
  }

  /* ★ 2. 智能捕获主角 ★ */
  var mesText = '';
  var mesEl = root.closest('.mes');
  if (mesEl) {
    var bodyEl = mesEl.querySelector('.mes_text');
    if (bodyEl) mesText = bodyEl.textContent || '';
  }

  var validCharKeys = Object.keys(charsData).filter(function(k) {
    return k && k !== 'You' && k !== '你' && k !== 'User' && k.toLowerCase() !== 'guest' && !isBlacklisted(k) && !/^\d+$/.test(k);
  });

  var primaryName = '';

  var heroList = validCharKeys.filter(function(k) {
    return clean(charsData[k] && charsData[k]['重要度']) === '主要';
  });
  if (heroList.length === 1) {
    primaryName = heroList[0];
  }

  if (!primaryName && validCharKeys.length > 0) {
    var bestScore = -1;
    var bestMatch = '';
    for (var i = 0; i < validCharKeys.length; i++) {
      var cName = validCharKeys[i];
      var score = 0;
      if (clean(charsData[cName] && charsData[cName]['重要度']) === '主要') score += 100;
      if (charsData[cName] && charsData[cName]['在场'] === true) score += 50;

      var shortName = cName.replace(/[（(].*?[)）]/g, '').trim();
      if (mesText) {
        var idx = mesText.indexOf(cName);
        if (idx === -1 && shortName) idx = mesText.indexOf(shortName);
        if (idx !== -1) {
          score += Math.max(10, 80 - Math.floor(idx / 15));
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = cName;
      }
    }
    if (bestMatch) primaryName = bestMatch;
  }

  if (!primaryName) {
    if (mesEl) {
      var nameEl = mesEl.querySelector('.ch_name, .name_text, .character_name');
      if (nameEl) {
        var t = nameEl.textContent.trim();
        if (t && t !== 'You' && t !== '你' && t !== 'User' && t.toLowerCase() !== 'guest' && !isBlacklisted(t)) {
          primaryName = t;
        }
      }
      if (!primaryName && mesEl.getAttribute('ch_name')) {
        primaryName = mesEl.getAttribute('ch_name') || '';
      }
    }
  }

  if (!primaryName) {
    try { primaryName = getCurrentCharacterName() || ''; } catch (e) {}
  }
  if (!primaryName) {
    try {
      if (window.SillyTavern && typeof window.SillyTavern.getContext === 'function') {
        primaryName = window.SillyTavern.getContext().name2 || '';
      }
    } catch (e) {}
  }
  if (!primaryName && validCharKeys.length > 0) {
    primaryName = validCharKeys[0];
  }

  primaryName = clean(primaryName, '');
  if (primaryName.toLowerCase() === 'guest' || isBlacklisted(primaryName)) primaryName = '';
  primaryName = primaryName.replace(/[\/\\]+$/g, '').trim();

  var wTimeRaw = worldData['时间'] || '2000年01月01日 · 00:00';
  var wLoc = clean(worldData['地点'], '未知');
  var wWea = clean(worldData['天气'], '未知');
  var wTmp = clean(worldData['温度'], '未知');

  var heroRaw = primaryName ? (charsData[primaryName] || {}) : {};

  /* ★ 3. 语言与文化背景判定 ★ */
  var rawLang = clean(heroRaw['语言'] || heroRaw['母语'] || heroRaw['国籍'] || heroRaw['国家'] || worldData['语言'] || worldData['国家'] || worldData['地点'] || '').toLowerCase();
  var rawGender = clean(heroRaw['性别'] || heroRaw['gender'] || '').toLowerCase();

  var isFemale = (
    rawGender.indexOf('女') !== -1 ||
    rawGender.indexOf('母') !== -1 ||
    rawGender.indexOf('female') !== -1 ||
    rawGender.indexOf('woman') !== -1 ||
    rawGender.indexOf('girl') !== -1
  );

  var langType = 'en';

  var isJpEnv = (
    rawLang.indexOf('日') !== -1 || rawLang.indexOf('ja') !== -1 || rawLang.indexOf('japanese') !== -1 ||
    wLoc.indexOf('日本') !== -1 || wLoc.indexOf('横滨') !== -1 || wLoc.indexOf('東京') !== -1 || wLoc.indexOf('东京') !== -1 || wLoc.indexOf('京都') !== -1 ||
    primaryName.indexOf('文豪') !== -1 || /[\u3040-\u30ff]/.test(primaryName) ||
    /太宰|中原|中岛|芥川|乱步|国木田|福泽|森鸥外|织田/.test(primaryName)
  );

  if (isJpEnv) {
    langType = 'ja';
  } else if (rawLang.indexOf('繁体') !== -1 || rawLang.indexOf('繁體') !== -1 || rawLang.indexOf('港') !== -1 || rawLang.indexOf('台') !== -1 || rawLang.indexOf('灣') !== -1 || rawLang.indexOf('zh-tw') !== -1 || rawLang.indexOf('zh-hant') !== -1) {
    langType = 'zh-tw';
  } else if (rawLang.indexOf('简') !== -1 || rawLang.indexOf('簡') !== -1 || rawLang.indexOf('中') !== -1 || rawLang.indexOf('华') !== -1 || rawLang.indexOf('zh') !== -1 || rawLang.indexOf('chinese') !== -1) {
    langType = 'zh-cn';
  } else if (rawLang.indexOf('韩') !== -1 || rawLang.indexOf('韓') !== -1 || rawLang.indexOf('朝') !== -1 || rawLang.indexOf('ko') !== -1 || rawLang.indexOf('korean') !== -1 || /[\uac00-\ud7af]/.test(primaryName)) {
    langType = 'ko';
  } else if (rawLang.indexOf('法') !== -1 || rawLang.indexOf('fr') !== -1 || rawLang.indexOf('french') !== -1) {
    langType = 'fr';
  } else if (rawLang.indexOf('俄') !== -1 || rawLang.indexOf('ru') !== -1 || rawLang.indexOf('russian') !== -1 || /[\u0400-\u04ff]/.test(primaryName)) {
    langType = 'ru';
  } else if (rawLang.indexOf('英') !== -1 || rawLang.indexOf('en') !== -1 || rawLang.indexOf('english') !== -1 || rawLang.indexOf('美') !== -1) {
    langType = 'en';
  } else {
    if (/[A-Za-z]/.test(primaryName)) {
      langType = 'en';
    } else if (/^[\u4e00-\u9fa5]+$/.test(primaryName)) {
      langType = (/[龍國華體櫻衛齊萧葉爱萬点隨聽廣]/i.test(primaryName)) ? 'zh-tw' : 'zh-cn';
    }
  }

  var safeCleanName = String(primaryName).replace(/[（(].*?[)）]/g, '').trim();
  var dictHit = NATIVE_DICTIONARY[safeCleanName] || NATIVE_DICTIONARY[primaryName];

  /* ★ 4. 签名角色名 ★ */
  var finalNativeName = '';
  var rawSignature = clean(heroRaw['签名'] || heroRaw['母语名'] || heroRaw['原名'] || heroRaw['本名'] || heroRaw['日文名'] || '', '');

  if (rawSignature) {
    finalNativeName = rawSignature;
  } else if (dictHit && langType === 'ja' && dictHit.ja) {
    finalNativeName = dictHit.ja;
  } else if (dictHit && langType === 'ru' && dictHit.ru) {
    finalNativeName = dictHit.ru;
  } else {
    finalNativeName = safeCleanName || primaryName || 'Unknown';
  }
  finalNativeName = finalNativeName.replace(/[\/\\]+$/g, '').trim();

  /* ★ 5. 大标题 ★ */
  var bigLatinTitle = '';
  var rawEnglishAttr = clean(heroRaw['英文名'] || heroRaw['英文'] || heroRaw['罗马音'] || heroRaw['romaji'] || heroRaw['title_latin'] || heroRaw['latin'] || heroRaw['title'] || heroRaw['大标题'] || '', '');

  if (rawEnglishAttr) {
    var parts = rawEnglishAttr.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      var first = parts[0];
      var last = parts[parts.length - 1];
      var isEastern = (langType === 'zh-cn' || langType === 'zh-tw' || langType === 'ja' || langType === 'ko');
      if (first.length < last.length) bigLatinTitle = first;
      else if (last.length < first.length) bigLatinTitle = last;
      else bigLatinTitle = isEastern ? first : last;
    } else if (parts.length === 1) {
      bigLatinTitle = parts[0];
    }
  } else if (dictHit && dictHit.romaji) {
    bigLatinTitle = dictHit.romaji;
  } else if (/[A-Za-z]/.test(primaryName)) {
    var matchEn = primaryName.match(/[A-Za-z]+/g);
    if (matchEn && matchEn.length > 0) {
      bigLatinTitle = matchEn[0];
    }
  }

  if (!bigLatinTitle) {
    bigLatinTitle = 'AMORE';
  }
  bigLatinTitle = bigLatinTitle.toUpperCase();

  var LOVERS = {
    'zh-cn': '亲爱的',
    'zh-tw': '親愛的',
    'ja': 'あなた',
    'ko': '자기야',
    'en': 'Pookie',
    'fr': 'Amour',
    'ru': 'Дорогой'
  };

  var manualTerm = clean(heroRaw['昵称'] || heroRaw['恋人称呼'] || '', '');
  var userTerm = clean(heroRaw['user爱称'] || '', '');
  var watermarkLoverText = manualTerm || userTerm || LOVERS[langType] || 'AMORE';

  var redlineE = cleanNum(heroRaw['情感值']);
  var shouldShowRedline = (redlineE >= 65);

  function generateCulturalSignature(name, lang, isFem, customSign) {
    var target = customSign ? String(customSign) : String(name || '');
    target = clean(target, 'Signature');
    target = target.replace(/[\s\u2500\u2014\u2015\-\u2010\u2012\u2013\u30FC·~─—\/\\-]+$/g, '').trim();

    if (lang === 'en' || lang === 'fr' || lang === 'ru') {
      var cleanText = target.replace(/[^a-zA-Z\s]/g, '').trim();
      if (cleanText) {
        var p = cleanText.split(/\s+/);
        if (p.length > 1) {
          return isFem ? (p[0] + ' ' + p[p.length - 1][0] + '.') : (p[0][0] + '. ' + p[p.length - 1]);
        }
        return cleanText;
      }
      return target;
    }

    if (lang === 'ja') {
      if (!isFem) {
        if (target.length >= 3 && target.indexOf(' ') === -1 && target.indexOf('　') === -1) {
          return target.substring(0, 2) + ' ' + target.substring(2);
        }
      }
      return target;
    }

    return target;
  }

  var signatureDisplay = generateCulturalSignature(finalNativeName, langType, isFemale, heroRaw['签名']);
  var genderKey = isFemale ? 'tkt-gender-f' : 'tkt-gender-m';

  function setText(sel, txt) {
    var el = root.querySelector(sel);
    if (el) el.textContent = txt;
  }

  function fitWatermarkFont(wrapper, text) {
    if (!wrapper || !text) return;
    var inner = wrapper.querySelector('span');
    if (!inner) {
      inner = doc.createElement('span');
      inner.textContent = text;
      wrapper.appendChild(inner);
    }

    var apply = function () {
      var containerW = wrapper.clientWidth || 540;
      var containerH = wrapper.clientHeight || 180;
      var targetW = containerW * 1.02;

      var hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(text);
      var visualRatio = hasCJK ? 1.0 : 0.75;
      var targetVisualH = containerH * 0.95;
      var targetH = targetVisualH / visualRatio;

      var size = 180;
      inner.style.fontSize = size + 'px';

      for (var i = 0; i < 20; i++) {
        var rect = inner.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;
        if (!w || !h) break;
        var ratioW = targetW / w;
        var ratioH = targetH / h;
        var ratio = Math.min(ratioW, ratioH);
        if (Math.abs(ratio - 1) < 0.005) break;
        size = size * ratio;
        if (size > 260) size = 260;
        if (size < 50) size = 50;
        inner.style.fontSize = size + 'px';
      }
    };

    requestAnimationFrame(apply);

    if (doc.fonts && doc.fonts.ready && typeof doc.fonts.ready.then === 'function') {
      doc.fonts.ready.then(function () {
        requestAnimationFrame(apply);
      });
    }
  }

  setText('.tkt-hook-seq', 'NO. ' + String(msgId).padStart(4, '0') + ' // ARCHIVE');
  setText('.tkt-hook-stub-id', '#' + String(msgId).padStart(3, '0'));
  setText('.tkt-hook-char-latin', bigLatinTitle);

  var wmEl = root.querySelector('.tkt-hook-watermark');
  if (wmEl) {
    var wmInner = wmEl.querySelector('span');
    if (wmInner) wmInner.textContent = watermarkLoverText;
    else wmEl.textContent = watermarkLoverText;
    fitWatermarkFont(wmEl, watermarkLoverText);
  }

  var nativeEl = root.querySelector('.tkt-hook-char-native');
  if (nativeEl) {
    nativeEl.className = 'tkt-name-native tkt-hook-char-native tkt-lang-' + langType + ' ' + genderKey;
    nativeEl.textContent = signatureDisplay;
    if (nativeEl.textContent) {
      nativeEl.textContent = nativeEl.textContent.replace(/[\s\u2500\u2014\u2015\-\u2010\u2012\u2013\u30FC·~─—\/\\-]+$/g, '').trim();
    }
  }

  if (shouldShowRedline) {
    root.classList.add('is-love');
  } else {
    root.classList.remove('is-love');
  }

  var formattedTime = formatTicketDate(wTimeRaw);
  setText('.tkt-hook-glance-time', formattedTime);
  setText('.tkt-hook-glance-loc', wLoc);
  setText('.tkt-hook-glance-weather', wWea);

  setText('.tkt-hook-loc', wLoc);
  setText('.tkt-hook-weather', wWea);
  setText('.tkt-hook-temp', wTmp);

  var IMP_ORDER = { '主要': 0, '重要': 1, '次要': 2 };
  var charList = [];

  if (primaryName) {
    charList.push({
      name: finalNativeName,
      data: {
        '服饰': clean(heroRaw['服饰'], '未知'),
        '情感值': cleanNum(heroRaw['情感值']),
        '肉体值': cleanNum(heroRaw['肉体值']),
        '关系值': cleanNum(heroRaw['关系值']),
        '情绪': clean(heroRaw['情绪'], '😐'),
        '心声': clean(heroRaw['心声'], '……'),
        '在场': true,
        '重要度': '主要'
      },
      isHero: true
    });
  }

  Object.keys(charsData).forEach(function (name) {
    if (name === primaryName) return;
    if (isBlacklisted(name)) return;
    if (/^\d+$/.test(name)) return;
    var c = charsData[name] || {};
    var imp = clean(c['重要度'], '次要');
    if (IMP_ORDER[imp] == null) imp = '次要';
    
    var hit = NATIVE_DICTIONARY[name];
    var cDisplayName = clean(c['签名'] || c['母语名'] || c['原名'] || (hit && isJpEnv ? hit.ja : '') || name, name);

    charList.push({
      name: cDisplayName,
      data: {
        '服饰': clean(c['服饰'], '未知'),
        '情感值': cleanNum(c['情感值']),
        '肉体值': cleanNum(c['肉体值']),
        '关系值': cleanNum(c['关系值']),
        '情绪': clean(c['情绪'], '😐'),
        '心声': clean(c['心声'], '……'),
        '在场': c['在场'] === true,
        '重要度': imp
      },
      isHero: false
    });
  });

  charList.sort(function (a, b) {
    if (a.isHero) return -1;
    if (b.isHero) return 1;
    var pa = a.data['在场'] ? 0 : 1;
    var pb = b.data['在场'] ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return IMP_ORDER[a.data['重要度']] - IMP_ORDER[b.data['重要度']];
  });

  var rosterEl = root.querySelector('.tkt-hook-roster');
  if (rosterEl) {
    rosterEl.innerHTML = '';
    charList.forEach(function (entry, index) {
      var c = entry.data;
      var name = entry.name;
      var isHero = entry.isHero;
      var present = Boolean(c['在场']);
      var emo = cleanNum(c['情感值']);
      var phy = cleanNum(c['肉体值']);
      var rel = cleanNum(c['关系值']);
      var emoji = c['情绪'] || '😐';
      var thought = c['心声'] || '……';
      var outfit = c['服饰'] || '未知';
      var imp = c['重要度'] || '次要';
      var itemCode = 'EXH.' + String(index + 1).padStart(2, '0');

      var emoBar = Math.min(100, Math.max(0, emo));
      var phyBar = Math.min(100, Math.max(0, phy));
      var relBar = Math.min(100, Math.max(0, rel));

      var card = doc.createElement('div');
      card.className = 'tkt-entity' + (isHero ? ' is-hero' : '');
      card.innerHTML =
        '<div class="tkt-entity-top">' +
          '<div class="tkt-entity-id">' +
            '<span style="font-family:\'Noto Serif SC\',\'Songti SC\',serif;font-size:9px;color:var(--t-dim);">' + itemCode + '</span>' +
            '<span class="tkt-entity-name">' + name + '</span>' +
            '<span class="tkt-pill ' + (present ? 'active' : '') + '">' + (present ? 'ON SITE' : 'OFF SITE') + '</span>' +
            '<span class="tkt-pill" style="border-color:var(--t-dim);color:var(--t-dim);">' + imp + '</span>' +
          '</div>' +
          '<div style="font-size:16px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.1));">' + emoji + '</div>' +
        '</div>' +
        '<div class="tkt-gauges">' +
          '<div class="tkt-gauge"><div class="tkt-gauge-lbl"><span>EMO / 情感</span><span class="gauge-code">' + emo + '</span></div><div class="tkt-gauge-track"><div class="tkt-gauge-bar" style="width:' + emoBar + '%;"></div></div></div>' +
          '<div class="tkt-gauge"><div class="tkt-gauge-lbl"><span>PHY / 肉体</span><span class="gauge-code">' + phy + '</span></div><div class="tkt-gauge-track"><div class="tkt-gauge-bar" style="width:' + phyBar + '%;"></div></div></div>' +
          '<div class="tkt-gauge"><div class="tkt-gauge-lbl"><span>REL / 关系</span><span class="gauge-code">' + rel + '</span></div><div class="tkt-gauge-track"><div class="tkt-gauge-bar" style="width:' + relBar + '%;"></div></div></div>' +
        '</div>' +
        '<div class="tkt-narrative">' +
          '<div class="tkt-outfit">SPEC // ' + outfit + '</div>' +
          '<div class="tkt-quote">“' + thought + '”</div>' +
        '</div>';
      rosterEl.appendChild(card);
    });
  }

  var handleToggle = function () {
    var open = root.classList.toggle('is-open');
    var w = root.querySelector('.tkt-hook-toggle-word');
    if (w) w.textContent = open ? 'FOLD' : 'UNFOLD';
  };

  var openTrigger = root.querySelector('.tkt-hook-open');
  if (openTrigger) openTrigger.addEventListener('click', handleToggle);

  var loveSvg = root.querySelector('.tkt-love-svg');
  if (loveSvg) {
    loveSvg.addEventListener('click', function (e) {
      handleToggle();
    });
  }

  var toggleBtn = root.querySelector('.tkt-hook-btn-toggle');
  if (toggleBtn) toggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    handleToggle();
  });

  var modeBtn = root.querySelector('.tkt-hook-btn-mode');
  if (modeBtn) modeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var cur = root.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : (cur === 'light' ? 'auto' : 'dark');
    root.setAttribute('data-theme', next);
    var icon = root.querySelector('.tkt-theme-icon');
    if (icon) icon.textContent = next === 'dark' ? '●' : (next === 'light' ? '○' : '◐');
  });
}

  /* ── 预言家日报：手写皮肤（报纸头版版式）─────────────── */
  /* ── 预言家日报：把状态数据排成一张头版 ─────────────────────
     数据来自脚本自己的 stat_data，不依赖任何外部扩展。
     版式参考 prophet-daily-extension，但字段与文案是自己生成的。 */

  const PROPHET_STAGES = {
    '-5': {
      name: '势不两立',
      head: '与访客彻底决裂',
      line: '据信双方已无任何往来，任何同框都被目击者形容为「火药味十足」。'
    },
    '-4': {
      name: '不共戴天',
      head: '公开场合拒绝同席',
      line: '本报记者多次尝试求证，均被其本人以沉默回绝。'
    },
    '-3': {
      name: '仇视敌对',
      head: '对来访者报以冷眼',
      line: '目击者称，她对他每一次出现都只报以冷眼，未置一词。'
    },
    '-2': {
      name: '明确敌意',
      head: '与某人保持距离',
      line: '据知情人士透露，两人目前连招呼都不打，气氛颇为僵硬。'
    },
    '-1': {
      name: '轻微反感',
      head: '对访客仍存戒心',
      line: '接近她的人士表示，她尚未放下防备，言谈间多有保留。'
    },
    '0': {
      name: '拒绝认识',
      head: '尚未进入本报视野',
      line: '双方目前尚无正式往来，本报将持续关注后续进展。'
    },
    '1': {
      name: '愿意认识',
      head: '一段新关系悄然成形',
      line: '有邻居称，近来常见两人同行，虽未言明，气氛已不似从前。'
    },
    '2': {
      name: '犹豫观望',
      head: '态度出现微妙松动',
      line: '知情人士称她仍在观望，尚未决定要不要再靠近一步。'
    },
    '3': {
      name: '愿意尝试',
      head: '被目击与某人同行',
      line: '两人关系正处于试探阶段，知情者称她「嘴上不说，脚步倒是没停」。'
    },
    '4': {
      name: '认真经营',
      head: '关系升温引发关注',
      line: '身边人已把这段关系视作「认真」在处理，不再是随口的玩笑。'
    },
    '5': {
      name: '渴望永恒',
      head: '已对未来作出暗示',
      line: '据最亲近的人透露，她近日多次提起「很久以后」，语气笃定。'
    }
  };

  function prophetStageOf(value) {
    let r = Number(value);
    if (isNaN(r)) r = 0;
    r = Math.max(-5, Math.min(5, Math.round(r)));
    return PROPHET_STAGES[String(r)] || PROPHET_STAGES['0'];
  }

  /* 时段：从「2024年10月03日 · 星期四 · 19:42」里取小时 */
  function prophetSlot(text) {
    const m = String(text == null ? '' : text).match(/(\d{1,2}):(\d{2})/);
    if (!m) return '';
    const h = Number(m[1]);
    if (h >= 5 && h < 9) return '清晨';
    if (h >= 9 && h < 12) return '上午';
    if (h >= 12 && h < 17) return '午后';
    if (h >= 17 && h < 20) return '傍晚';
    return '深夜';
  }

  function prophetNum(value) {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  function prophetText(value, fallback) {
    const s = String(value == null ? '' : value).trim();
    return s || fallback || '';
  }

  function prophetJoiner(parts) {
    return parts.filter(function(x) { return !!x; }).join('，');
  }

  function prophetPickLead(chars) {
    const present = chars.filter(function(n) { return chars && chars[n] && chars[n].在场 !== false; });
    const pool = present.length ? present : chars;
    for (let i = 0; i < pool.length; i++) {
      const c = (chars || {})[pool[i]] || {};
      if (String(c.重要度 || '') === '主要') return pool[i];
    }
    return pool[0] || '';
  }

  /* 长日期在正文里会把一行撑爆，这里压成「10月03日 19:42」 */
  function prophetShortTime(text) {
    const s = String(text == null ? '' : text);
    const d = s.match(/(\d{1,2})月(\d{1,2})日/);
    const t = s.match(/(\d{1,2}:\d{2})/);
    const parts = [];
    if (d) parts.push(d[1] + '月' + d[2] + '日');
    if (t) parts.push(t[1]);
    return parts.join(' ');
  }

  function prophetArticleHtml(leadName, c, world, others, msgId) {
    const stage = prophetStageOf(c && c.阶段值);
    const slot = prophetSlot(world.时间);
    const place = prophetText(world.地点, '');
    const weather = prophetText(world.天气, '');
    const temp = prophetText(world.温度, '');
    const timeText = prophetText(world.时间, '');

    const headline = leadName + stage.head;
    const deckParts = [];
    if (slot) deckParts.push(slot);
    if (place) deckParts.push(place);
    deckParts.push('本报特派记者追踪报道');
    const deckText = deckParts.join('｜');

    const shortTime = prophetShortTime(timeText);
    const ambient = [];
    if (weather) ambient.push('当时' + weather);
    if (temp) ambient.push('气温' + temp);
    const ambientText = ambient.length ? (ambient.join('、') + '。') : '';

    const leadText = place
      ? ('据本报了解，' + (shortTime ? shortTime + '，' : '') + leadName + '现身' + place + '，' + ambientText + stage.line)
      : ('据本报了解，' + leadName + '近日的行踪引起本报注意，' + ambientText + stage.line);

    const bodyParts = ['本报记者注意到，她目前的身体状况为「' + prophetNum(c && c.肉体值) + '」'];
    const emo = prophetText(c && c.情绪, '');
    if (emo) bodyParts.push('神情是「' + emo + '」');
    bodyParts.push('相关情况仍在进一步核实，魔法部暂未发表正式声明');
    const bodyText = bodyParts.join('，') + '。';

    const voice = prophetText(c && c.心声, '……');
    const sign = prophetText(c && c.签名, leadName);
    const seal = prophetText(c && c.英文名, '').slice(0, 1).toUpperCase();

    const idx = 'No.' + ('0000' + String((Number(msgId) || 0) + 1)).slice(-4);

    let html = '<article class="mpp-paper">' +
      '<div class="mpp-topline"><span>巫师界权威新闻 · 猫头鹰邮递</span><span>霍格沃茨特别版 · 每周七日发行</span></div>' +
      '<header class="mpp-mast">' +
        '<div class="mpp-mast-small">The Wizarding World&rsquo;s No.1 Newspaper</div>' +
        '<div class="mpp-mast-cn">预言家日报</div>' +
        '<div class="mpp-mast-en">The Daily Prophet</div>' +
      '</header>' +
      '<div class="mpp-edition"><span>伦敦版 · 特别报道</span><span>' + idx + ' · 今日头版</span><span>价格：七便士</span></div>' +
      '<div class="mpp-rule-d"></div>' +
      '<div class="mpp-headline">' + skinEsc(headline) + '</div>' +
      '<div class="mpp-deck">' + skinEsc(deckText) + '</div>' +
      '<div class="mpp-cols">' +
        '<div class="mpp-main">' +
          '<div class="mpp-photo-frame">' +
            '<div class="mpp-photo mpp-silhouette"><i></i><b></b><em>' + skinEsc(seal || 'M') + '</em></div>' +
            '<span class="mpp-caption">本期人物：' + skinEsc(leadName) + '</span>' +
          '</div>' +
          '<p class="mpp-lead">' + skinEsc(leadText) + '</p>' +
          '<p class="mpp-bodycopy">' + skinEsc(bodyText) + '</p>' +
        '</div>' +
        '<aside class="mpp-side">' +
          '<div class="mpp-side-head">人物档案</div>' +
          '<div class="mpp-stat"><b>好感度</b><span class="mpp-stat-num">' + prophetNum(c && c.好感度) + '</span></div>' +
          '<div class="mpp-stat"><b>身体状况</b><span>' + prophetNum(c && c.肉体值) + '</span></div>' +
          '<div class="mpp-stat"><b>当前阶段</b><span>' + skinEsc(stage.name) + '</span></div>' +
          '<div class="mpp-stat"><b>暗涌</b><span class="mpp-stat-num">' + prophetNum(c && c.嫉妒值) + '</span></div>' +
          '<div class="mpp-quote"><div class="mpp-quote-title">未公开的心声</div>「' + skinEsc(voice) + '」</div>' +
          '<div class="mpp-sign">—— ' + skinEsc(sign) + '</div>' +
        '</aside>' +
      '</div>';

    if (others && others.length) {
      html += '<div class="mpp-briefs"><div class="mpp-briefs-head">简讯</div>' +
        others.map(function(item) {
          return '<div class="mpp-brief"><span>' + skinEsc(item.name) + '</span><span>' +
            skinEsc(item.stage) + ' · 好感 ' + item.affection + '</span></div>';
        }).join('') +
        '</div>';
    }

    html += '<div class="mpp-foot"><span>未经许可，禁止复制本报内容</span><span>' +
      skinEsc(slot ? slot + '版' : '今日版') + ' · 下一版：敬请期待</span></div>' +
      '</article>';

    return html;
  }

  function renderProphetSkin(scope, statData, msgId, keepOpen) {
    if (!scope) return false;

    const src = statData || {};
    const world = (src.世界 && typeof src.世界 === 'object') ? src.世界 : {};
    const chars = (src.角色 && typeof src.角色 === 'object') ? src.角色 : {};

    let names = Object.keys(chars).filter(function(k) {
      return k && k !== '示例角色' && k !== '{{char}}' && chars[k] && typeof chars[k] === 'object';
    });

    /* 兼容「只有一个角色、字段直接摊在顶层」的旧存档 */
    if (!names.length && (src.好感度 !== undefined || src.阶段值 !== undefined || src.肉体值 !== undefined)) {
      const solo = src.姓名 || src.签名 || src.name || '核心角色';
      chars[solo] = src;
      names = [solo];
    }

    const fold = '<button type="button" class="mpp-fold" aria-expanded="' + (keepOpen ? 'true' : 'false') + '">' +
      '<span class="mpp-fold-star">✦</span>' +
      '<span class="mpp-fold-title">展开《预言家日报》</span>' +
      '<span class="mpp-fold-hint"><span class="mpp-fold-closed">点击阅读</span><span class="mpp-fold-open">收起报纸</span></span>' +
      '</button>';

    if (!names.length) {
      scope.classList.remove('is-open');
      scope.innerHTML = '<div class="mpp-wrap">' + fold +
        '<div class="mpp-body" hidden><article class="mpp-paper"><div class="mpp-empty">' +
        '本报今日暂无人物档案<br><small>（先点「开局适配」建档，头版才有内容可登）</small>' +
        '</div></article></div></div>';
      return false;
    }

    const leadName = prophetPickLead(names);
    const lead = chars[leadName] || {};
    const others = names.filter(function(n) {
      if (n === leadName) return false;
      const c = chars[n] || {};
      if (c.在场 === false) return false;
      return true;
    }).slice(0, 4).map(function(n) {
      const c = chars[n] || {};
      return {
        name: n,
        stage: prophetStageOf(c.阶段值).name,
        affection: prophetNum(c.好感度)
      };
    });

    const article = prophetArticleHtml(leadName, lead, world, others, msgId);

    scope.classList.toggle('is-open', !!keepOpen);
    scope.innerHTML = '<div class="mpp-wrap">' + fold +
      '<div class="mpp-body"' + (keepOpen ? '' : ' hidden') + '>' + article + '</div></div>';
    return true;
  }

  /* ── 月氏藏书票：移植自原正则（换数据入口 + 主题作用域）── */
  const SKIN_BOOK_STAGES = {
    '-5': '势不两立', '-4': '不共戴天', '-3': '仇视敌对',
    '-2': '明确敌意', '-1': '轻微反感', '0': '拒绝认识',
    '1': '愿意认识', '2': '犹豫观望', '3': '愿意尝试',
    '4': '认真经营', '5': '渴望永恒'
  };

  const SKIN_BOOK_COUPLETS = {
    '日语': [
      { origin: '富士には', trans: '富士山头' },
      { origin: '月見草がよく似合ふ', trans: '月见草最是相宜' }
    ],
    '英语': [
      { origin: 'Shall I compare thee', trans: '我能否将你' },
      { origin: 'to a summer’s day?', trans: '比作夏日' }
    ],
    '中文': [
      { origin: '人生若只如初见', trans: '若得常如初' },
      { origin: '何事秋风悲画扇', trans: '何来画扇悲' }
    ]
  };

  function getBookTheme() {
    try {
      const store = getStorage();
      const saved = store ? store.getItem(SKIN_BOOK_THEME_KEY) : null;
      if (saved === 'day' || saved === 'night') return saved;
    } catch (e) {}
    return 'day';
  }

  function setBookTheme(theme) {
    const next = theme === 'night' ? 'night' : 'day';
    try { const store = getStorage(); if (store) store.setItem(SKIN_BOOK_THEME_KEY, next); } catch (e) {}
    return next;
  }

  function skinSplitLines(text) {
    const s = String(text == null ? '' : text).trim();
    if (!s) return [];
    let arr = s.split(/[\n\r\s\u3000\/,，;；|]+/).filter(Boolean);
    if (arr.length === 1 && arr[0].length > 5) {
      const mid = Math.ceil(arr[0].length / 2);
      arr = [arr[0].slice(0, mid), arr[0].slice(mid)];
    }
    return arr;
  }

  function getBookCouplets(lang, c) {
    const fallback = SKIN_BOOK_COUPLETS[lang] || SKIN_BOOK_COUPLETS['日语'];
    const originLines = skinSplitLines(c.题辞);
    const transLines = skinSplitLines(c.题辞译文);
    if (!originLines.length) return fallback;
    return originLines.slice(0, 2).map(function(origin, idx) {
      return {
        origin: origin,
        trans: transLines[idx] || (fallback[idx] ? fallback[idx].trans : '')
      };
    });
  }

  function renderBookSkinCard(nameKey, c, theme) {
    const charData = c || {};
    const transName = String(charData.英文名 || '').trim() || 'NAME CARD';
    const signName = String(charData.签名 || '').trim() || nameKey;
    const lang = String(charData.语言 || '').trim() || '日语';
    const couplets = getBookCouplets(lang, charData);

    const E = Number(charData.好感度 != null ? charData.好感度 : charData.情感值) || 0;
    const P = Number(charData.肉体值) || 0;
    const R = Math.round(Number(charData.阶段值 != null ? charData.阶段值 : charData.关系值 / 20) || 0);
    const I = Number(charData.嫉妒值) || 0;
    const stageName = SKIN_BOOK_STAGES[String(R)] || '平行交集';
    const emoji = String(charData.情绪 || '').trim() || '—';
    const voice = String(charData.心声 || '').trim() || '……';
    const sealChar = signName.replace(/[^\u4e00-\u9fa5\u3040-\u30ff]/g, '').slice(0, 1) || '印';

    const themeLabel = (theme === 'day')
      ? '<span class="season-dot"></span> DIURNE · 白昼'
      : '<span class="season-dot"></span> NOCTURNE · 幽夜';

    const coupletsHtml = couplets.map(function(pair) {
      return '<div class="couplet-unit">' +
        '<span class="couplet-origin">' + skinEsc(pair.origin) + '</span>' +
        (pair.trans ? '<span class="couplet-trans">' + skinEsc(pair.trans) + '</span>' : '') +
        '</div>';
    }).join('');

    return '<div class="card-stage" data-flip="1">' +
      '<div class="card-flipper">' +
        '<div class="card-washi washi-front">' +
          '<div class="washi-inner-box">' +
            '<button type="button" class="season-seal-btn" data-theme-toggle="1">' + themeLabel + '</button>' +
            '<div class="interlinear-poem-stage">' + coupletsHtml + '</div>' +
            '<div class="front-author-lockup">' +
              '<span class="char-latin-name">' + skinEsc(transName) + '</span>' +
              '<div class="signature-row">' +
                '<span class="char-handwritten-signature">' + skinEsc(signName) + '</span>' +
                '<span class="hanko-seal">' + skinEsc(sealChar) + '</span>' +
              '</div>' +
              '<span class="flip-guide-under-sig">EX LIBRIS · TOUCH TO TURN ↺</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card-washi washi-back">' +
          '<div class="washi-inner-box">' +
            '<div class="back-header">' +
              '<span class="back-header-title">CHRONICLE INDEX</span>' +
              '<span class="back-header-stage">【' + skinEsc(stageName) + '】</span>' +
            '</div>' +
            '<div class="back-metrics-grid">' +
              '<div class="metric-item"><span class="metric-tag">AFFECTION</span><span class="metric-number">' + E + '</span><span class="metric-cn">情感</span></div>' +
              '<div class="metric-item"><span class="metric-tag">GRAVITY</span><span class="metric-number">' + P + '</span><span class="metric-cn">肉体</span></div>' +
              '<div class="metric-item"><span class="metric-tag">PHASE</span><span class="metric-number">' + (R > 0 ? '+' + R : R) + '</span><span class="metric-cn">阶段</span></div>' +
              '<div class="metric-item"><span class="metric-tag">INVIDIA</span><span class="metric-number">' + I + '</span><span class="metric-cn">暗涌</span></div>' +
            '</div>' +
            '<div class="back-voice-wrap">' +
              '<span class="back-voice-emoji">' + skinEsc(emoji) + '</span>' +
              '<div class="back-voice-quote">“' + skinEsc(voice) + '”</div>' +
            '</div>' +
            '<span class="turn-guide" style="position:absolute;right:14px;bottom:7px;font-size:8px;color:var(--ink-secondary);letter-spacing:0.18em;font-family:\'Cormorant Garamond\',serif;font-style:italic;opacity:0.55;">Return ↺</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderBookSkin(scope, statData) {
    if (!scope) return false;
    const deck = scope.querySelector('.namecard-deck');
    if (!deck) return false;

    const theme = getBookTheme();
    scope.setAttribute('data-theme', theme);

    const src = statData || {};
    let chars = src.角色 && typeof src.角色 === 'object' && Object.keys(src.角色).length ? src.角色 : null;
    if (!chars && (src.好感度 !== undefined || src.阶段值 !== undefined || src.肉体值 !== undefined)) {
      const singleName = src.姓名 || src.签名 || src.name || '核心角色';
      chars = {};
      chars[singleName] = src;
    }

    if (!chars) {
      deck.innerHTML = '<div class="card-stage"><div class="card-washi"><div class="washi-inner-box empty-card">NO CARDS PRESENT<br><span style="font-size:9px;opacity:0.6;">（还没有角色档案，先点「开局适配」）</span></div></div></div>';
      return false;
    }

    const keys = Object.keys(chars).filter(function(k) {
      return k && k !== '示例角色' && k !== '{{char}}' && chars[k] && chars[k].在场 !== false;
    });

    if (!keys.length) {
      deck.innerHTML = '<div class="card-stage"><div class="card-washi"><div class="washi-inner-box empty-card">NO CARDS PRESENT</div></div></div>';
      return false;
    }

    deck.innerHTML = keys.map(function(k) { return renderBookSkinCard(k, chars[k], theme); }).join('');
    return true;
  }

  /* ── 挂载与刷新 ──────────────────────────────────────── */
  function clearSkinNodes(scope) {
    try {
      const olds = (scope || mainDoc).querySelectorAll('.' + SKIN_HOLDER_CLASS);
      for (let i = 0; i < olds.length; i++) {
        if (olds[i] && olds[i].parentNode) olds[i].parentNode.removeChild(olds[i]);
      }
    } catch (e) {}
  }

  /* 数据指纹：数值/情绪/心声/时间没变就不重画，保住展开与翻转状态 */
  function getSkinSignature(statData) {
    const world = (statData && statData.世界) || {};
    const chars = (statData && statData.角色) || {};
    const parts = [String(world.时间 || ''), String(world.地点 || ''), String(world.天气 || ''), String(world.温度 || '')];
    Object.keys(chars).forEach(function(name) {
      const c = chars[name] || {};
      parts.push([name, c.好感度, c.肉体值, c.阶段值, c.嫉妒值, c.情绪, c.心声, c.在场 === false ? 0 : 1, c.签名, c.英文名].join(','));
    });
    return parts.join('|');
  }

  function mountSkinIntoMessage(mesEl, statData, skinId, sig, keepOpen) {
    if (!mesEl || !mesEl.querySelector) return;
    if (mesEl.getAttribute('is_user') === 'true') return;
    const textEl = mesEl.querySelector('.mes_text');
    if (!textEl || !textEl.parentNode) return;

    const skin = skinId || getSkinId();
    if (skin === 'none') return;

    const holder = mainDoc.createElement('div');
    holder.className = SKIN_HOLDER_CLASS + ' ' + SKIN_HOLDER_CLASS + '-' + skin;
    holder.setAttribute('data-mp-skin', skin);
    if (sig) holder.setAttribute('data-mp-sig', sig);
    holder.style.margin = '10px 0 2px';

    if (skin === 'ticket') {
      holder.innerHTML = SKIN_TICKET_TPL;
    } else if (skin === 'prophet') {
      holder.innerHTML = '<div class="mp-skin-prophet"><div class="mpp-wrap"></div></div>';
    } else {
      holder.innerHTML = '<div class="mp-skin-book"><div class="namecard-deck"></div></div>';
    }

    /* 挂到 mes_block 末尾，避开酒馆自己的消息按钮条 */
    const blockEl = (textEl.closest && textEl.closest('.mes_block')) || textEl.parentNode;
    blockEl.appendChild(holder);

    let msgId = 0;
    try { msgId = Number(mesEl.getAttribute('mesid')) || 0; } catch (e) { msgId = 0; }

    try {
      if (skin === 'ticket') {
        const rootEl = holder.querySelector('.tkt-container');
        if (rootEl) renderTicketSkin(rootEl, adaptStatForSkin(statData), msgId);
      } else if (skin === 'prophet') {
        renderProphetSkin(holder.querySelector('.mp-skin-prophet'), statData, msgId, !!keepOpen);
      } else {
        renderBookSkin(holder.querySelector('.mp-skin-book'), statData);
      }
    } catch (e) {
      try { holder.parentNode.removeChild(holder); } catch (e2) {}
    }
  }

  function getMessageNodes() {
    let nodes = [];
    try { nodes = mainDoc.querySelectorAll('#chat .mes'); } catch (e) {}
    if (!nodes || !nodes.length) {
      try { nodes = mainDoc.querySelectorAll('.mes'); } catch (e) {}
    }
    return Array.prototype.slice.call(nodes || []);
  }

  function refreshMessageSkins(opts) {
    opts = opts || {};
    const skin = getSkinId();
    const nodes = getMessageNodes();
    if (skin === 'none' || !nodes.length) { clearSkinNodes(mainDoc); return; }

    ensureSkinStyle(skin);
    const statData = getSkinStatData();
    if (!statData) { clearSkinNodes(mainDoc); return; }

    const sig = getSkinSignature(statData) + '#' + skin;
    const tail = nodes.slice(-SKIN_MAX_MESSAGES);

    if (!opts.onlyLast) {
      /* 只清掉「超出范围」和「皮肤不对」的，范围里数据没变的留着 */
      const keep = new Set(tail);
      const olds = mainDoc.querySelectorAll('.' + SKIN_HOLDER_CLASS);
      for (let i = 0; i < olds.length; i++) {
        const h = olds[i];
        const mes = h.closest ? h.closest('.mes') : null;
        if (!mes || !keep.has(mes) || h.getAttribute('data-mp-skin') !== skin) {
          if (h.parentNode) h.parentNode.removeChild(h);
        }
      }
    }

    const targets = opts.onlyLast ? nodes.slice(-1) : tail;
    for (let i = 0; i < targets.length; i++) {
      const mesEl = targets[i];
      const existing = mesEl.querySelector('.' + SKIN_HOLDER_CLASS);
      let keepOpen = false;
      if (existing) {
        if (!opts.force && existing.getAttribute('data-mp-sig') === sig) continue;
        /* 数据变了要重画，但玩家已经展开的报纸不该自己合上 */
        keepOpen = !!existing.querySelector('.mpp-fold[aria-expanded="true"]');
        if (existing.parentNode) existing.parentNode.removeChild(existing);
      }
      mountSkinIntoMessage(mesEl, statData, skin, sig, keepOpen);
    }
  }

  let _skinRefreshTimer = null;
  function scheduleSkinRefresh(opts) {
    if (_skinRefreshTimer) { try { clearTimeout(_skinRefreshTimer); } catch (e) {} }
    _skinRefreshTimer = setTimeout(function() {
      _skinRefreshTimer = null;
      try { refreshMessageSkins(opts); } catch (e) {}
    }, 120);
  }

  function getSkinHint() {
    const id = getSkinId();
    const item = SKIN_LIST.filter(function(x) { return x.id === id; })[0];
    return item ? item.hint : '';
  }

  function skinPickStyle(active) {
    return 'padding:5px 9px;border-radius:7px;border:1px solid ' +
      (active ? 'rgba(244,114,208,0.55)' : 'rgba(148,163,184,0.18)') +
      ';background:' + (active ? '#2a1040' : '#0f172a') +
      ';color:' + (active ? '#ffc4e9' : '#94a3b8') +
      ';font:700 10.5px inherit;font-family:inherit;cursor:pointer;white-space:nowrap;';
  }

  function renderSkinPickerHtml() {
    const id = getSkinId();
    return '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">' +
      SKIN_LIST.map(function(item) {
        return '<button type="button" data-skin-pick="' + item.id + '" title="' + skinEsc(item.name) + ' · ' + skinEsc(item.hint) + '"' +
          ' style="' + skinPickStyle(item.id === id) + '">' + skinEsc(item.short) + '</button>';
      }).join('') + '</div>';
  }

  function ensureSkinDelegation() {
    if (ensureSkinDelegation.done) return;
    ensureSkinDelegation.done = true;
    try {
      mainDoc.addEventListener('click', function(e) {
        const target = e.target;
        if (!target || !target.closest) return;

        /* 面板里的皮肤选择 */
        const pick = target.closest('[data-skin-pick]');
        if (pick) {
          const id = setSkinId(pick.getAttribute('data-skin-pick'));
          ensureSkinStyle(id);
          const group = pick.parentNode;
          if (group && group.querySelectorAll) {
            const buttons = group.querySelectorAll('[data-skin-pick]');
            for (let i = 0; i < buttons.length; i++) {
              const on = buttons[i].getAttribute('data-skin-pick') === id;
              buttons[i].style.cssText = skinPickStyle(on);
            }
          }
          const descEl = mainDoc.querySelector('#moon-phase-skin-desc');
          if (descEl) descEl.textContent = getSkinHint();
          const hit = SKIN_LIST.filter(function(x) { return x.id === id; })[0];
          if (typeof toast === 'function') toast('楼内状态卡：' + (hit ? hit.name : '不显示'), 'info');
          return;
        }

        /* 预言家日报：展开 / 收起 */
        const prophetHolder = target.closest('.' + SKIN_HOLDER_CLASS + '-prophet');
        if (prophetHolder) {
          const fold = target.closest('.mpp-fold');
          if (!fold) return;
          const body = prophetHolder.querySelector('.mpp-body');
          if (!body) return;
          const show = body.hidden;
          body.hidden = !show;
          fold.setAttribute('aria-expanded', String(show));
          const scope = prophetHolder.querySelector('.mp-skin-prophet');
          if (scope) scope.classList.toggle('is-open', show);
          return;
        }

        /* 藏书票：日夜与翻转 */
        const holder = target.closest('.' + SKIN_HOLDER_CLASS + '-book');
        if (!holder) return;
        const themeBtn = target.closest('[data-theme-toggle]');
        if (themeBtn) {
          const scope = holder.querySelector('.mp-skin-book');
          const next = setBookTheme(getBookTheme() === 'day' ? 'night' : 'day');
          if (scope) {
            scope.setAttribute('data-theme', next);
            renderBookSkin(scope, getSkinStatData());
          }
          return;
        }
        const stage = target.closest('[data-flip]');
        if (stage) stage.classList.toggle('is-flipped');
      }, true);
    } catch (e) {}
  }

  try { ensureSkinDelegation(); } catch (e) {}

