/* 88-skin.js —— 楼内状态卡皮肤：晨昏票根 / 月氏藏书票 / 预言家日报 / 朱丝栏邸报（玩家自选）
   前两套由 tools/gen-skin.mjs 从正则美化 JSON 生成；
   预言家日报与朱丝栏邸报是后加的手写皮肤
   （skin-prophet.* / skin-dibao.*），同样经 gen-skin 注入。
   不要直接手改生成段落。本片段依赖：getStorage()、readMvuLatest()、mainDoc、mainWin。 */

  const SKIN_KEY = 'moon_phase_message_skin_v1';
  const SKIN_BOOK_THEME_KEY = 'moon_phase_message_skin_book_theme_v1';
  const SKIN_MAX_MESSAGES = 30;
  const SKIN_HOLDER_CLASS = 'mp-msg-skin';

  const SKIN_LIST = [
    { id: 'none', short: '不显示', name: '不显示', hint: '只留正文，最干净' },
    { id: 'ticket', short: '票根', name: '晨昏票根', hint: '可撕副券 · 展开房间与名册' },
    { id: 'book', short: '藏书票', name: '月氏藏书票', hint: '笺纸名札 · 双面翻转' },
    { id: 'prophet', short: '日报', name: '预言家日报', hint: '头版道具 · 折叠展开，带人物档案' },
    { id: 'dibao', short: '邸报', name: '朱丝栏邸报', hint: '暗调抄本 · 护眼四层，点题签展卷' },
    /* 内部 id 仍是 calista：存档里存的就是它，改名只改玩家看得见的部分 */
    { id: 'calista', short: '少女心绪', name: '少女心绪', hint: '明信片状态卡 · 贝母的底、银的英文，轻点翻面看Ta的近况' }
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
    font-style: normal; font-weight: 600; font-display: swap;
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
    --t-ambient-shadow: rgba(18, 20, 26, 0.55);

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
      --t-ambient-shadow: rgba(18, 20, 26, 0.55);

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
    -webkit-mask-image: linear-gradient(to right, #17181d 75%, rgba(18, 20, 26, 0.3) 95%, transparent 100%);
            mask-image: linear-gradient(to right, #17181d 75%, rgba(18, 20, 26, 0.3) 95%, transparent 100%);
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
    font-weight: 600;
    font-size: 8.5px;
    letter-spacing: 1.4px;
    border-radius: 1px;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-curator-mark {
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 1.2px;
    color: var(--t-dim);
    text-transform: uppercase;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-header-seq {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
    font-family: "Noto Serif SC", "Songti SC", serif;
    line-height: 1;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tkt-meta-txt {
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
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
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .tkt-pill {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 7.5px;
    font-weight: 600;
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
    font-weight: 600;
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
  .tkt-warn strong { color: var(--t-ink); font-weight: 600; }

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
  --divider: rgba(237,232,223,0.10); --shadow-color: rgba(18, 20, 26, 0.45);
}.mp-skin-book[data-theme="day"]{
  --paper-bg: #F1EADB; --paper-inner-bg: #F7F1E3;
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
  font-family: 'Cinzel', serif; font-size: 12.5px; font-weight: 600;
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
 *
 * 视觉依据（对照 MinaLima 为电影做的实际报纸道具）：
 *   · 报头 DAILY ⚡ PROPHET 横排一行，中间夹小型社徽，不是三段居中堆叠
 *   · 报头下方一条「分类广告带」，其中一格黑底反白（道具里就有一块
 *     10000 GALLEONS 的黑底悬赏）
 *   · 正文区被左右两条竖向窄栏夹住，窄栏里是竖排小字——这是道具最
 *     显眼的结构特征，也是「一眼认出是巫师报纸」的关键
 *   · 头版头条左对齐、阶梯式（大字压小字），行距紧到 .94
 *   · 正文两栏，栏间竖线，图片跨栏放在顶部，图片下方小字图注
 *   · 照片一律黑白 + 半调网点，纸张是暖白新闻纸而非深米黄信纸
 *   · 全版只有一个强调色：魔法部印泥红，只给栏目标签
 *
 * 隔离约定：
 *   1. 所有选择器以 .mp-skin-prophet 开头，类名统一 mpp- 前缀，
 *      不与玩家已安装的原扩展（.dp-*）争样式。
 *   2. 不写 body / :root / 通配符，不影响酒馆任何原生元素。
 *   3. @keyframes 名字带 mpp- 前缀，避免与其他皮肤撞名。
 *   4. 不 @import 任何外部字体：酒馆可能离线。
 * ══════════════════════════════════════════════════════════════════ */

.mp-skin-prophet {
  /* 纸与墨：护眼版。全部避开 #17181d / #f4f1ea / 纯黑描边——
     墨色抬到暖褐黑（约 12:1 对比，仍远高于 4.5:1），
     规则线用更浅的墨褐而不是黑框，阴影改暖墨半透明。 */
  --mpp-paper: #f5eddb;
  --mpp-paper-2: #e6dcc8;
  --mpp-ink: #251f18;
  --mpp-ink-2: #463d30;
  --mpp-ink-3: #635849;
  --mpp-hair: rgba(58, 50, 37, .38);
  --mpp-rule: #3a3225;
  --mpp-shadow: rgba(60, 50, 34, .28);
  /* 唯一强调色：印泥红 */
  --mpp-seal: #8d2f21;
  /* 社徽金，只给徽记 */
  --mpp-gold: #a3823f;

  container-type: inline-size;
  margin: 10px 0 2px;
  color: var(--mpp-ink);
  font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "SimSun", Georgia, serif;
  line-height: 1.55;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

/* ── 折叠条 ───────────────────────────────────────────────────
   不展开时只有这一条，像报童递过来的一折报纸 */
.mp-skin-prophet .mpp-fold {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  padding: 7px 11px;
  background: var(--mpp-paper);
  color: var(--mpp-ink);
  border: 1px solid var(--mpp-rule);
  box-shadow: inset 0 0 0 3px var(--mpp-paper), inset 0 0 0 4px rgba(23, 19, 14, .35);
  font: 900 12px/1.4 "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif;
  letter-spacing: .1em;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color .16s ease-out;
}
.mp-skin-prophet .mpp-fold:hover { background: var(--mpp-paper-2); }
.mp-skin-prophet .mpp-fold:focus-visible {
  outline: 2px solid var(--mpp-seal);
  outline-offset: 2px;
}
.mp-skin-prophet .mpp-fold-emblem {
  flex: 0 0 auto;
  width: 24px;
  height: 16px;
  color: var(--mpp-ink);
  /* 图标基线：与中文标题的视觉中心对齐 */
  transform: translateY(.125em);
}
.mp-skin-prophet .mpp-fold-emblem svg { display: block; width: 100%; height: 100%; }
.mp-skin-prophet .mpp-fold-hint {
  margin-left: auto;
  font: 400 9px/1 "Songti SC", "SimSun", serif;
  letter-spacing: .18em;
  color: var(--mpp-ink-3);
  white-space: nowrap;
}
.mp-skin-prophet .mpp-fold-open { display: none; }
.mp-skin-prophet.is-open .mpp-fold-open { display: inline; }
.mp-skin-prophet.is-open .mpp-fold-closed { display: none; }

/* ── 报纸本体 ─────────────────────────────────────────────── */
/* ── 折叠：Grid 0fr → 1fr ─────────────────────────────────────
   不用 max-height 魔法数，也不用 display:none 硬切。作者样式覆盖 UA 的
   [hidden]{display:none}，hidden 属性只当状态位；收起态另加
   visibility:hidden（延迟到动画结束）让读屏器跳过被折起来的内容。
   缓动用 --mp-ease-drag：1200/80 过阻尼弹簧，零回弹。 */
.mp-skin-prophet .mpp-body {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition:
    grid-template-rows var(--mp-dur-drag, 300ms) var(--mp-ease-drag, cubic-bezier(.16, 1, .3, 1)),
    visibility 0s linear var(--mp-dur-drag, 300ms);
}
.mp-skin-prophet .mpp-body:not([hidden]) {
  grid-template-rows: 1fr;
  visibility: visible;
  transition-delay: 0s;
}
.mp-skin-prophet .mpp-body-clip {
  min-height: 0;
  overflow: hidden;
  padding-top: 0;
  transition: padding-top var(--mp-dur-drag, 300ms) var(--mp-ease-drag, cubic-bezier(.16, 1, .3, 1));
}
.mp-skin-prophet .mpp-body:not([hidden]) .mpp-body-clip { padding-top: 6px; }

.mp-skin-prophet .mpp-paper {
  position: relative;
  display: flow-root;
  box-sizing: border-box;
  width: 100%;
  padding: clamp(9px, 1.5cqw, 14px) clamp(10px, 1.8cqw, 16px) 7px;
  background-color: var(--mpp-paper);
  background-image:
    /* 四角压暗，模拟纸张边缘的旧色；顶部高光是暖白，不用 255 的白 */
    radial-gradient(120% 90% at 50% 0%, rgba(252, 246, 232, .45), transparent 60%),
    radial-gradient(90% 110% at 0% 100%, rgba(120, 100, 66, .13), transparent 62%),
    radial-gradient(90% 110% at 100% 0%, rgba(120, 100, 66, .1), transparent 58%);
  border: 1px solid #b3a486;
  box-shadow:
    0 1px 0 rgba(250, 244, 230, .38) inset,
    0 6px 16px -6px var(--mpp-shadow);
  animation: mpp-unfold var(--mp-dur-drag, 300ms) var(--mp-ease-drag, cubic-bezier(.16, 1, .3, 1)) both;
}

/* 印刷网点：极淡一层，让纸面不是纯色块 */
.mp-skin-prophet .mpp-paper::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: .18;
  background-image: radial-gradient(circle at center, rgba(60, 48, 30, .5) .5px, transparent .6px);
  background-size: 3px 3px;
  mix-blend-mode: multiply;
}
.mp-skin-prophet .mpp-paper > * { position: relative; z-index: 1; }

@keyframes mpp-unfold {
  /* 只淡入：高度交给 Grid 0fr→1fr，不再叠加 translateY 免得抖动 */
  from { opacity: .72; }
  to { opacity: 1; }
}

/* ── 报头顶栏：刊号 / 地点 / 价格 ─────────────────────────── */
.mp-skin-prophet .mpp-topline {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  font-size: 7px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--mpp-ink-2);
  padding-bottom: 3px;
  border-bottom: 1px solid var(--mpp-hair);
}
.mp-skin-prophet .mpp-topline em {
  font-style: normal;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--mpp-ink);
}

/* ── 报头：DAILY ⚡ PROPHET 一行 ──────────────────────────── */
.mp-skin-prophet .mpp-mast {
  padding: 2px 0 2px;
  border-bottom: 2px solid var(--mpp-rule);
}
.mp-skin-prophet .mpp-mast-en {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .04em;
  font-family: Georgia, "Times New Roman", "Songti SC", serif;
  font-weight: 600;
  /* 字号按容器宽算：报头要撑满整行，中缝才不会空出一大块 */
  font-size: clamp(21px, 10.2cqw, 92px);
  line-height: .84;
  letter-spacing: -.018em;
  text-transform: uppercase;
  color: var(--mpp-ink);
  -webkit-text-stroke: .35px currentColor; /* 合成一层厚度，接近道具的粗衬线 */
  overflow: hidden;
}
.mp-skin-prophet .mpp-mast-word { flex: 0 0 auto; }
.mp-skin-prophet .mpp-emblem {
  flex: 0 0 auto;
  width: .6em;
  height: .4em;
  color: var(--mpp-gold);
  align-self: center;
  transform: translateY(-.02em);
}
.mp-skin-prophet .mpp-emblem svg { display: block; width: 100%; height: 100%; overflow: visible; }

/* 报头副行：中文刊名 + 拉丁副题，像道具报头下那行小字 */
.mp-skin-prophet .mpp-mast-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 3px 0 4px;
  border-bottom: 1px solid var(--mpp-hair);
  font-size: 7px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--mpp-ink-2);
}
.mp-skin-prophet .mpp-mast-cn {
  font: 900 13px/1 "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif;
  letter-spacing: .3em;
  text-indent: .3em;
  color: var(--mpp-ink);
}
.mp-skin-prophet .mpp-mast-sub i {
  font-style: normal;
  flex: 1 1 auto;
  height: 1px;
  background: var(--mpp-hair);
  max-width: 46px;
}

/* ── 分类广告带：道具报头下那排小方框 ─────────────────────── */
.mp-skin-prophet .mpp-adbar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--mpp-rule);
}
.mp-skin-prophet .mpp-adbar span {
  font-size: 7px;
  line-height: 1.35;
  letter-spacing: .1em;
  text-align: center;
  padding: 3px 3px 2px;
  border-right: 1px solid var(--mpp-hair);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-skin-prophet .mpp-adbar span:last-child { border-right: 0; }
/* 道具里必有一格黑底反白，学的就是这个 */
.mp-skin-prophet .mpp-adbar span.is-invert {
  background: var(--mpp-ink);
  color: var(--mpp-paper);
  font-weight: 600;
}

/* ── 三栏骨架：左窄栏 / 正文 / 右窄栏 ─────────────────────── */
.mp-skin-prophet .mpp-frame {
  display: grid;
  grid-template-columns: 19px minmax(0, 1fr) 19px;
}
.mp-skin-prophet .mpp-rail {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0;
  font-size: 7px;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--mpp-ink-2);
  border-right: 1px solid var(--mpp-hair);
  overflow: hidden;
  white-space: nowrap;
  user-select: none;
}
.mp-skin-prophet .mpp-rail-r {
  border-right: 0;
  border-left: 1px solid var(--mpp-hair);
  justify-content: flex-end;
}

/* ── 正文区 ───────────────────────────────────────────────── */
.mp-skin-prophet .mpp-core {
  position: relative;
  padding: 6px 9px 7px;
  min-width: 0;
}

/* 「号外」印泥章：补头条右侧的空白，也是全版的记忆点 */
.mp-skin-prophet .mpp-stamp {
  position: absolute;
  right: 7px;
  top: 8px;
  transform: rotate(-9deg);
  padding: 2px 5px 3px;
  border: 2px solid var(--mpp-seal);
  box-shadow: inset 0 0 0 1px rgba(141, 47, 33, .45);
  font: 900 clamp(11px, 2.2cqw, 16px)/1 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .16em;
  text-indent: .16em;
  color: var(--mpp-seal);
  opacity: .78;
  mix-blend-mode: multiply;
  pointer-events: none;
  user-select: none;
}

/* 栏目标签：全版唯一的红色 */
.mp-skin-prophet .mpp-kicker {
  display: inline-block;
  font: 600 7.5px/1.5 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .22em;
  text-indent: .22em;
  padding: 1px 5px;
  border: 1px solid var(--mpp-ink);
  color: var(--mpp-ink);
  text-transform: uppercase;
}
.mp-skin-prophet .mpp-kicker.is-seal {
  color: var(--mpp-seal);
  border-color: var(--mpp-seal);
}

/* 头条：左对齐阶梯，大字压小字 */
.mp-skin-prophet .mpp-headline {
  margin: 4px 0 0;
  font-family: "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif;
  font-weight: 900;
  line-height: .95;
  letter-spacing: -.005em;
  color: var(--mpp-ink);
  text-wrap: balance;
}
.mp-skin-prophet .mpp-hl-a {
  display: block;
  font-size: clamp(25px, 8.4cqw, 52px);
  -webkit-text-stroke: .3px currentColor;
}
.mp-skin-prophet .mpp-hl-b {
  display: block;
  font-size: clamp(19px, 6.4cqw, 38px);
  -webkit-text-stroke: .25px currentColor;
  margin-top: .06em;
}

/* 引题 */
.mp-skin-prophet .mpp-deck {
  margin: 5px 0 0;
  padding: 3px 0;
  border-top: 1px solid var(--mpp-hair);
  font-size: 10px;
  line-height: 1.5;
  font-style: italic;
  color: var(--mpp-ink-2);
}

/* 署名行 */
.mp-skin-prophet .mpp-byline {
  font-size: 7px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--mpp-ink-3);
  padding: 2px 0 3px;
  border-bottom: 3px double var(--mpp-rule);
}

/* ── 正文两栏 ─────────────────────────────────────────────── */
.mp-skin-prophet .mpp-copy {
  margin-top: 6px;
  columns: 2;
  column-gap: 11px;
  column-rule: 1px solid rgba(58, 50, 37, .26);
  font-size: 11px;
  line-height: 1.62;
  text-align: justify;
  text-justify: inter-ideograph;
  hyphens: auto;
}
.mp-skin-prophet .mpp-copy p {
  margin: 0 0 .5em;
  break-inside: avoid-column;
  text-wrap: pretty;
}
.mp-skin-prophet .mpp-copy p:last-child { margin-bottom: 0; }
/* 首段首字下沉（中文用「据」字起） */
.mp-skin-prophet .mpp-copy p.is-lead::first-letter {
  float: left;
  font: 900 1.85em/.82 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  padding: .06em .1em 0 0;
}

/* 照片跨栏置顶：矮横幅，别把整张卡撑成一米高 */
.mp-skin-prophet .mpp-photo-frame {
  column-span: all;
  margin: 0 0 5px;
  padding: 0;
  break-inside: avoid;
}
.mp-skin-prophet .mpp-photo {
  position: relative;
  overflow: hidden;
  height: clamp(88px, 15cqw, 124px);
  /* 灰阶夜空：没有立绘时拍的是城堡远景，而不是硬画一个人 */
  background: linear-gradient(180deg, #8d8977 0%, #65614e 38%, #333025 66%, #17140f 100%);
  border: 1px solid var(--mpp-rule);
}
.mp-skin-prophet .mpp-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.18) brightness(.98);
}
/* 半调网点压在照片上：这是「印刷品」和「贴图」的区别 */
.mp-skin-prophet .mpp-photo::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle at center, rgba(50, 42, 30, .42) .6px, transparent .7px),
                    radial-gradient(circle at center, rgba(255, 252, 244, .14) .5px, transparent .6px);
  background-size: 2.6px 2.6px, 2.6px 2.6px;
  background-position: 0 0, 1.3px 1.3px;
  opacity: .42;
  mix-blend-mode: multiply;
}
/* 城堡远景：一轮月亮 + 一排哥特尖顶，窗口点着灯 */
.mp-skin-prophet .mpp-silhouette {
  position: absolute;
  inset: 0;
}
.mp-skin-prophet .mpp-silhouette i,
.mp-skin-prophet .mpp-silhouette b {
  position: absolute;
  display: block;
}
.mp-skin-prophet .mpp-silhouette i { /* 月亮 */
  top: 12%;
  right: 17%;
  width: clamp(26px, 4.4cqw, 40px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 36% 34%, #f2ecda, #b3ac94);
  box-shadow: 0 0 20px 7px rgba(238, 231, 209, .22);
}
.mp-skin-prophet .mpp-silhouette b { /* 塔楼群 */
  left: 0;
  bottom: 0;
  width: 100%;
  height: 78%;
  background:
    radial-gradient(circle at 45% 62%, rgba(239, 211, 142, .9) 0 1.1px, transparent 1.6px),
    radial-gradient(circle at 45% 76%, rgba(239, 211, 142, .8) 0 1.1px, transparent 1.6px),
    radial-gradient(circle at 29% 70%, rgba(239, 211, 142, .75) 0 1.1px, transparent 1.6px),
    radial-gradient(circle at 66% 68%, rgba(239, 211, 142, .75) 0 1.1px, transparent 1.6px),
    radial-gradient(circle at 85% 78%, rgba(239, 211, 142, .7) 0 1.1px, transparent 1.6px),
    linear-gradient(180deg, #363326, #11100b);
  clip-path: polygon(
    0 100%, 0 64%, 5% 64%, 9% 38%, 13% 64%,
    20% 64%, 24% 52%, 28% 24%, 32% 52%,
    39% 52%, 45% 6%, 51% 52%,
    58% 52%, 62% 42%, 66% 26%, 70% 42%,
    77% 42%, 81% 58%, 85% 32%, 89% 58%,
    95% 58%, 98% 68%, 100% 68%, 100% 100%);
}
.mp-skin-prophet .mpp-silhouette em {
  position: absolute;
  right: 5px;
  bottom: 3px;
  font: 600 7px/1 Georgia, serif;
  font-style: normal;
  letter-spacing: .1em;
  color: rgba(243, 236, 223, .82);
  z-index: 1;
}
/* 「会动的照片」：极缓慢的光影起伏，别做成动画 gif */
@media (prefers-reduced-motion: no-preference) {
  .mp-skin-prophet .mpp-photo.is-animated {
    animation: mpp-breathe 7s ease-in-out infinite;
  }
}
@keyframes mpp-breathe {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.06); }
}

.mp-skin-prophet .mpp-caption {
  display: block;
  font-size: 7.5px;
  line-height: 1.45;
  letter-spacing: .06em;
  color: var(--mpp-ink-2);
  padding-top: 2px;
  border-bottom: 1px solid var(--mpp-hair);
  padding-bottom: 3px;
}

/* ── 底部小框：天气 + 开奖 ────────────────────────────────── */
.mp-skin-prophet .mpp-strip {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 7px;
  margin-top: 6px;
  padding-top: 5px;
  border-top: 3px double var(--mpp-rule);
}
.mp-skin-prophet .mpp-box {
  border: 1px solid var(--mpp-rule);
  padding: 3px 5px 4px;
  min-width: 0;
}
.mp-skin-prophet .mpp-box-head {
  font: 600 7px/1.4 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .2em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--mpp-hair);
  padding-bottom: 2px;
  margin-bottom: 3px;
  display: flex;
  justify-content: space-between;
  gap: 4px;
}
.mp-skin-prophet .mpp-box-head b { font-weight: 600; color: var(--mpp-seal); }
.mp-skin-prophet .mpp-box-body {
  font-size: 8px;
  line-height: 1.55;
  color: var(--mpp-ink-2);
  overflow-wrap: anywhere;
}
.mp-skin-prophet .mpp-box-body strong {
  color: var(--mpp-ink);
  font-weight: 600;
}
.mp-skin-prophet .mpp-lotto {
  font: 600 15px/1.1 Georgia, "Times New Roman", serif;
  letter-spacing: .16em;
  font-variant-numeric: tabular-nums;
  color: var(--mpp-ink);
}

/* ── 人物档案：横排数字栏，报纸底部的「资料框」 ───────────── */
.mp-skin-prophet .mpp-dossier {
  margin-top: 6px;
  border-top: 3px double var(--mpp-rule);
  border-bottom: 1px solid var(--mpp-rule);
  padding: 4px 0 5px;
}
.mp-skin-prophet .mpp-dossier-head {
  font: 600 7.5px/1.4 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .24em;
  text-transform: uppercase;
  margin-bottom: 3px;
}
.mp-skin-prophet .mpp-dossier-head span {
  color: var(--mpp-ink-3);
  letter-spacing: .12em;
  margin-left: 5px;
}
.mp-skin-prophet .mpp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.mp-skin-prophet .mpp-stat {
  padding: 0 6px;
  border-left: 1px solid var(--mpp-hair);
  min-width: 0;
}
.mp-skin-prophet .mpp-stat:first-child { border-left: 0; padding-left: 0; }
.mp-skin-prophet .mpp-stat b {
  display: block;
  font: 400 7px/1.6 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .16em;
  color: var(--mpp-ink-3);
  white-space: nowrap;
}
.mp-skin-prophet .mpp-stat span {
  display: block;
  font: 600 13px/1.3 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  color: var(--mpp-ink);
  overflow-wrap: anywhere;
}
.mp-skin-prophet .mpp-stat-num {
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
}

/* ── 引文：pull quote ─────────────────────────────────────── */
.mp-skin-prophet .mpp-quote {
  margin-top: 6px;
  padding: 5px 0 5px 9px;
  border-left: 2px solid var(--mpp-seal);
  font-size: 11px;
  line-height: 1.6;
  font-style: italic;
  color: var(--mpp-ink);
  overflow-wrap: anywhere;
}
.mp-skin-prophet .mpp-quote-title {
  font: 600 7px/1.5 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  font-style: normal;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--mpp-seal);
  margin-bottom: 1px;
}
.mp-skin-prophet .mpp-sign {
  font: 400 8px/1.5 "Songti SC", "SimSun", serif;
  font-style: normal;
  color: var(--mpp-ink-3);
  margin-top: 2px;
  letter-spacing: .05em;
}

/* ── 简讯：底部通栏 ───────────────────────────────────────── */
.mp-skin-prophet .mpp-briefs {
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--mpp-rule);
}
.mp-skin-prophet .mpp-briefs-head {
  font: 600 7.5px/1.4 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .24em;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.mp-skin-prophet .mpp-briefs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  column-gap: 14px;
}
.mp-skin-prophet .mpp-brief {
  display: flex;
  gap: 5px;
  justify-content: space-between;
  align-items: baseline;
  font-size: 8.5px;
  line-height: 1.6;
  padding: 1px 0;
  border-bottom: 1px dotted rgba(23, 19, 14, .32);
  min-width: 0;
}
.mp-skin-prophet .mpp-brief:last-child { border-bottom: 0; }
.mp-skin-prophet .mpp-brief span:first-child {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-skin-prophet .mpp-brief span:last-child {
  color: var(--mpp-ink-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── 页脚 ─────────────────────────────────────────────────── */
.mp-skin-prophet .mpp-foot {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 5px;
  padding-top: 3px;
  border-top: 1px solid var(--mpp-hair);
  font-size: 7px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--mpp-ink-3);
}

/* 空态：没有角色档案时也要像一张报纸 */
.mp-skin-prophet .mpp-empty {
  padding: 18px 4px;
  text-align: center;
  font: 900 13px/1.7 "Noto Sans SC", "Microsoft YaHei", sans-serif;
  letter-spacing: .12em;
}
.mp-skin-prophet .mpp-empty small {
  display: block;
  font: 400 8px/1.8 "Songti SC", "SimSun", serif;
  letter-spacing: .16em;
  color: var(--mpp-ink-3);
  margin-top: 3px;
}

/* ── 窄屏：拆掉两侧竖栏，正文收单栏 ─────────────────────── */
@media (max-width: 560px) {
  .mp-skin-prophet .mpp-frame { grid-template-columns: minmax(0, 1fr); }
  .mp-skin-prophet .mpp-rail { display: none; }
  .mp-skin-prophet .mpp-core { padding: 5px 1px 6px; }
  .mp-skin-prophet .mpp-copy { columns: 1; font-size: 11.5px; }
  .mp-skin-prophet .mpp-photo { height: clamp(84px, 26cqw, 116px); }
  .mp-skin-prophet .mpp-strip { grid-template-columns: 1fr; }
  .mp-skin-prophet .mpp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 5px; }
  .mp-skin-prophet .mpp-stat:nth-child(3) { border-left: 0; padding-left: 0; }
  .mp-skin-prophet .mpp-briefs-grid { grid-template-columns: minmax(0, 1fr); }
  .mp-skin-prophet .mpp-adbar span:nth-child(3) { display: none; }
  .mp-skin-prophet .mpp-adbar { grid-template-columns: repeat(2, 1fr); }
  .mp-skin-prophet .mpp-fold { font-size: 11.5px; padding: 7px 9px; }
}

/* ── 宽屏：给竖栏一点余量，正文栏宽不至于过窄 ─────────────── */
@media (min-width: 780px) {
  .mp-skin-prophet .mpp-frame { grid-template-columns: 22px minmax(0, 1fr) 22px; }
  .mp-skin-prophet .mpp-core { padding: 7px 12px 8px; }
  .mp-skin-prophet .mpp-copy { column-gap: 15px; font-size: 11.5px; }
}

/* 尊重系统的「减少动态效果」 */
@media (prefers-reduced-motion: reduce) {
  .mp-skin-prophet .mpp-paper { animation: none; }
  .mp-skin-prophet .mpp-photo.is-animated { animation: none; }
  .mp-skin-prophet .mpp-body,
  .mp-skin-prophet .mpp-body-clip { transition: none; }
}

/* ── 夜间版：同一张报纸，灯关了 ───────────────────────────────
   只换纸与墨，版面一根线都不动；半透明高光从「加白」改成「加暖」。
   注意：这里全部用 [data-theme="night"] 前缀把特异性抬到 (0,2,0)，
   否则压不过上面那些单类名的 .mpp-* 规则。 */
.mp-skin-prophet[data-theme="night"] {
  --mpp-paper: #1A1613;
  --mpp-paper-2: #221D18;
  --mpp-ink: #E9E1D3;
  --mpp-ink-2: #C6BBA8;
  --mpp-ink-3: #9C9180;
  --mpp-hair: rgba(233, 225, 211, .20);
  --mpp-rule: #C3B7A2;
  --mpp-shadow: rgba(6, 5, 3, .62);
  --mpp-seal: #D2735C;
  --mpp-gold: #C9A45E;
}
.mp-skin-prophet[data-theme="night"] .mpp-paper {
  border-color: #3B332B;
  background-image:
    radial-gradient(120% 90% at 50% 0%, rgba(255, 240, 214, .055), transparent 60%),
    radial-gradient(90% 110% at 0% 100%, rgba(255, 208, 150, .045), transparent 62%),
    radial-gradient(90% 110% at 100% 0%, rgba(255, 208, 150, .035), transparent 58%);
  box-shadow:
    inset 0 1px 0 rgba(255, 240, 214, .06),
    0 8px 20px -8px var(--mpp-shadow);
}
.mp-skin-prophet[data-theme="night"] .mpp-paper::before {
  opacity: .09;
  background-image: radial-gradient(circle at center, rgba(255, 236, 205, .4) .5px, transparent .6px);
  mix-blend-mode: screen;
}
.mp-skin-prophet[data-theme="night"] .mpp-fold {
  box-shadow: inset 0 0 0 3px var(--mpp-paper), inset 0 0 0 4px rgba(255, 240, 214, .16);
}
.mp-skin-prophet[data-theme="night"] .mpp-copy { column-rule-color: rgba(233, 225, 211, .16); }
.mp-skin-prophet[data-theme="night"] .mpp-brief { border-bottom-color: rgba(233, 225, 211, .22); }
.mp-skin-prophet[data-theme="night"] .mpp-silhouette i {
  background: radial-gradient(circle at 36% 34%, #DCD2BB, #9E9682);
  box-shadow: 0 0 18px 5px rgba(220, 210, 187, .10);
}

/* 日夜切换：纸角一枚小字，不占版面 */
.mp-skin-prophet .mpp-topline { padding-right: 46px; }
.mp-skin-prophet .mpp-theme {
  position: absolute;
  right: 8px;
  top: 5px;
  z-index: 3;
  padding: 2px 6px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--mpp-ink-3);
  font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 8.5px;
  letter-spacing: .14em;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}
.mp-skin-prophet .mpp-theme:hover { color: var(--mpp-ink); background: var(--mpp-paper-2); }
.mp-skin-prophet .mpp-theme:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--mpp-paper), 0 0 0 3px var(--mpp-seal);
}
`;

  const SKIN_CSS_DIBAO = `/* 朱丝栏邸报 · 灯下夜读的暗调抄本
   ─────────────────────────────────────────────────────────────
   护眼最高法则优先于形制还原：古籍的「白纸黑字」必须让位。
   四层背景直接引用全局 --mp-l0..l3（HSL 明度 9/11/13/15%，相邻 2%），
   只在纸面叠一层 3% 暖棕气色，不改明度分层；边界只用发丝线，
   没有黑框、没有纯黑纯白、没有粗朱边。
   全部规则作用域在 .mp-skin-dibao 下，类名 db- 前缀，不与原扩展冲突。 */

.mp-skin-dibao {
  --db-l0: var(--mp-l0, hsl(228 16% 9%));
  --db-l1: var(--mp-l1, hsl(228 15% 11%));
  --db-l2: var(--mp-l2, hsl(228 14% 13%));
  --db-l3: var(--mp-l3, hsl(228 13% 15%));
  --db-fg: var(--mp-fg, #e6e3dc);
  --db-fg-soft: var(--mp-fg-soft, #b9b6af);
  --db-hair: var(--mp-hair, rgba(230, 227, 220, .09));
  --db-hair-strong: var(--mp-hair-strong, rgba(230, 227, 220, .17));
  --db-shadow: var(--mp-ink-shadow, rgba(18, 20, 26, .55));
  --db-fw: var(--mp-fw-strong, 600);
  --db-dur-drag: var(--mp-dur-drag, 300ms);
  --db-dur-like: var(--mp-dur-like, 550ms);
  --db-ease-drag: var(--mp-ease-drag, cubic-bezier(.16, 1, .3, 1));
  --db-ease-like: var(--mp-ease-like, cubic-bezier(.16, 1, .3, 1));
  /* 朱砂提到 #d08a6f 才在 L3 上有 5.60:1；原来的 #9c3b2e 只有 2.41:1，不达标 */
  --db-seal: #d08a6f;
  --db-seal-soft: rgba(208, 138, 111, .16);

  container-type: inline-size;
  color: var(--db-fg);
  font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "SimSun", Georgia, serif;
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* L0 案面：整张卡的最外层，比纸面暗一档 */
.mp-skin-dibao .db-wrap {
  background: var(--db-l0);
  border: 1px solid var(--db-hair);
  border-radius: 4px;
  padding: 4px;
}

/* ── 题签（折叠按钮）──────────────────────────────────────── */
.mp-skin-dibao .db-fold {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  background: var(--db-l3);
  border: 1px solid var(--db-hair);
  border-radius: 3px;
  color: var(--db-fg);
  font-family: inherit;
  font-size: 12px;
  font-weight: var(--db-fw);
  line-height: 1.4;
  letter-spacing: .08em;
  text-align: left;
  cursor: pointer;
  transition: background-color 180ms ease-out, box-shadow 180ms ease-out;
}
.mp-skin-dibao .db-fold:hover { background: var(--db-l2); }
/* 聚焦：禁描边，与 85-style 逐值一致的内亮环 + 外深环 + 内凹加深 */
.mp-skin-dibao .db-fold:focus-visible {
  outline: none;
  border-color: var(--db-hair-strong);
  box-shadow:
    0 0 0 1px rgba(230, 227, 220, .24),
    0 0 0 5px rgba(18, 20, 26, .62),
    inset 0 2px 7px rgba(18, 20, 26, .48);
}
/* 图标基线：与中文标题的视觉中心对齐 */
.mp-skin-dibao .db-fold-ico {
  flex: 0 0 auto;
  width: 22px;
  height: 15px;
  color: var(--db-seal);
  transform: translateY(.125em);
}
.mp-skin-dibao .db-fold-ico svg { display: block; width: 100%; height: 100%; }
.mp-skin-dibao .db-fold-title {
  font-size: 13px;
  letter-spacing: .22em;
}
.mp-skin-dibao .db-fold-meta {
  font-size: 9.5px;
  font-weight: 400;
  letter-spacing: .1em;
  color: var(--db-fg-soft);
  opacity: .82;
  white-space: nowrap;
}
.mp-skin-dibao .db-fold-hint {
  margin-left: auto;
  font-size: 9.5px;
  font-weight: 400;
  letter-spacing: .16em;
  color: var(--db-seal);
  white-space: nowrap;
}
.mp-skin-dibao .db-fold-open { display: none; }
.mp-skin-dibao.is-open .db-fold-open { display: inline; }
.mp-skin-dibao.is-open .db-fold-closed { display: none; }

/* ── 折叠：Grid 0fr → 1fr ──────────────────────────────────
   不用 max-height 魔法数，也不用 display:none 硬切。作者样式覆盖 UA 的
   [hidden]{display:none}，hidden 只当状态位；收起态另加延迟的
   visibility:hidden 让读屏器跳过被卷起来的内容。
   缓动 --db-ease-drag 即全局 1200/80 过阻尼弹簧，零回弹。 */
.mp-skin-dibao .db-body {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition:
    grid-template-rows var(--db-dur-drag) var(--db-ease-drag),
    visibility 0s linear var(--db-dur-drag);
}
.mp-skin-dibao .db-body:not([hidden]) {
  grid-template-rows: 1fr;
  visibility: visible;
  transition-delay: 0s;
}
.mp-skin-dibao .db-body-clip {
  min-height: 0;
  overflow: hidden;
}

/* ── L1 纸面 ───────────────────────────────────────────────── */
.mp-skin-dibao .db-leaf {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  margin-top: 5px;
  /* 底部留白专供朱印落章，避免压住另讯数字或书口页脚 */
  padding: 14px 16px 62px;
  background-color: var(--db-l1);
  /* 3% 暖棕气色，只改色相不改明度分层；纯 CSS，无外部图 */
  background-image: linear-gradient(128deg, rgba(168, 118, 76, .035), transparent 62%);
  border: 1px solid var(--db-hair);
  border-radius: 2px;
  box-shadow: 0 8px 24px -14px var(--db-shadow);
}
.mp-skin-dibao .db-leaf::before {
  /* 天头：一条发丝线，取代文武边栏的粗框 */
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  top: 8px;
  height: 1px;
  background: var(--db-hair);
  pointer-events: none;
}

/* 书耳：L3，右上角小方块，放时辰 / 地点 / 天气 / 气温 */
.mp-skin-dibao .db-ear {
  position: absolute;
  top: 14px;
  right: 16px;
  z-index: 2;
  max-width: 42%;
  padding: 5px 8px;
  background: var(--db-l3);
  border: 1px solid var(--db-hair);
  border-radius: 2px;
  font-size: 9.5px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: .06em;
  color: var(--db-fg-soft);
  text-align: right;
  text-wrap: pretty;
}
.mp-skin-dibao .db-ear b {
  color: var(--db-seal);
  font-weight: var(--db-fw);
}

/* 版心：鱼尾 + 卷次 + 刊名 */
.mp-skin-dibao .db-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0 10px;
  border-bottom: 1px solid var(--db-hair);
}
.mp-skin-dibao .db-fish {
  flex: 0 0 auto;
  width: 30px;
  height: 20px;
  color: var(--db-seal);
  transform: translateY(.125em);
}
.mp-skin-dibao .db-fish svg { display: block; width: 100%; height: 100%; }
.mp-skin-dibao .db-banner-title {
  font-size: clamp(15px, 3.1cqw, 21px);
  font-weight: var(--db-fw);
  letter-spacing: .34em;
  line-height: 1.3;
  white-space: nowrap;
}
.mp-skin-dibao .db-banner-vol {
  margin-left: auto;
  font-size: 9.5px;
  letter-spacing: .14em;
  color: var(--db-fg-soft);
  white-space: nowrap;
}

/* ── L2 栏格 + 朱丝界行 ─────────────────────────────────────
   界行是很淡的朱色发丝线，不是框；四层里的第三层落在这一格。 */
.mp-skin-dibao .db-frame {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  margin-top: 11px;
  padding: 12px 14px 13px;
  background-color: var(--db-l2);
  background-image: repeating-linear-gradient(
    to right,
    transparent 0,
    transparent 2.6em,
    rgba(208, 138, 111, .085) 2.6em,
    rgba(208, 138, 111, .085) calc(2.6em + 1px)
  );
  border: 1px solid var(--db-hair);
  border-radius: 2px;
}

/* 竖排书耳栏：栏目名 + 阶梯式竖排头条 */
.mp-skin-dibao .db-rail {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: flex-start;
  border-right: 1px solid var(--db-hair);
  padding-right: 10px;
  min-height: 186px;
}
.mp-skin-dibao .db-rail-label {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 9.5px;
  font-weight: var(--db-fw);
  letter-spacing: .34em;
  color: var(--db-seal);
  white-space: nowrap;
}
.mp-skin-dibao .db-headline {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: clamp(15px, 2.9cqw, 19px);
  font-weight: var(--db-fw);
  line-height: 1.2;
  letter-spacing: .08em;
  color: var(--db-fg);
  /* 只放短事件句，8–9 字恰好单列，不会再向左溢出换列 */
  max-height: 186px;
  text-wrap: pretty;
}
.mp-skin-dibao .db-headline-plain {
  /* 竖排在窄屏会退化，这里留一版横排兜底（默认隐藏） */
  display: none;
}

/* 横排正文：宫门钞 / 上谕两段 */
.mp-skin-dibao .db-copy {
  min-width: 0;
  font-size: 11.5px;
  line-height: 1.86;
  color: var(--db-fg);
  text-align: justify;
  text-justify: inter-ideograph;
  text-wrap: pretty;
}
.mp-skin-dibao .db-copy p { margin: 0 0 .7em; }
.mp-skin-dibao .db-copy p:last-child { margin-bottom: 0; }
.mp-skin-dibao .db-copy .db-lead-word {
  color: var(--db-seal);
  font-weight: var(--db-fw);
}
.mp-skin-dibao .db-deck {
  margin: 0 0 9px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--db-hair);
  font-size: 10px;
  letter-spacing: .08em;
  line-height: 1.7;
  color: var(--db-fg-soft);
  text-wrap: pretty;
}
.mp-skin-dibao .db-desk {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid var(--db-hair);
  font-size: 10.5px;
  color: var(--db-fg-soft);
  text-wrap: pretty;
}

/* ── 奏折：朱丝栏四格人物档案 ─────────────────────────────── */
.mp-skin-dibao .db-dossier {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 11px;
  border: 1px solid var(--db-hair);
  border-radius: 2px;
  overflow: hidden;
}
.mp-skin-dibao .db-cell {
  min-width: 0;
  padding: 8px 10px 9px;
  background: var(--db-l2);
  border-right: 1px solid var(--db-hair);
}
.mp-skin-dibao .db-cell:last-child { border-right: 0; }
.mp-skin-dibao .db-cell-label {
  display: block;
  font-size: 9px;
  letter-spacing: .22em;
  color: var(--db-fg-soft);
  white-space: nowrap;
}
.mp-skin-dibao .db-cell-value {
  display: block;
  margin-top: 3px;
  font-size: 18px;
  font-weight: var(--db-fw);
  line-height: 1.2;
  color: var(--db-fg);
  font-variant-numeric: tabular-nums;
}
.mp-skin-dibao .db-cell-value.is-seal { color: var(--db-seal); }
.mp-skin-dibao .db-cell-unit {
  font-size: 9.5px;
  font-weight: 400;
  letter-spacing: .06em;
  color: var(--db-fg-soft);
}

/* ── 心声引文：朱线引首 ───────────────────────────────────── */
.mp-skin-dibao .db-quote {
  display: flex;
  gap: 10px;
  margin-top: 11px;
  padding: 9px 12px;
  background: var(--db-l3);
  border: 1px solid var(--db-hair);
  border-left: 2px solid var(--db-seal);
  border-radius: 2px;
}
.mp-skin-dibao .db-quote-mark {
  flex: 0 0 auto;
  font-size: 20px;
  line-height: 1;
  color: var(--db-seal);
  transform: translateY(.125em);
}
.mp-skin-dibao .db-quote-body {
  min-width: 0;
  font-size: 11px;
  line-height: 1.78;
  color: var(--db-fg);
  text-wrap: pretty;
}
.mp-skin-dibao .db-quote-sign {
  display: block;
  margin-top: 4px;
  font-size: 9.5px;
  letter-spacing: .12em;
  color: var(--db-fg-soft);
  text-align: right;
}

/* ── 另讯：其他在场角色 ───────────────────────────────────── */
.mp-skin-dibao .db-briefs {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--db-hair);
}
.mp-skin-dibao .db-briefs-title {
  font-size: 9.5px;
  letter-spacing: .26em;
  color: var(--db-seal);
  margin: 0 0 5px;
}
.mp-skin-dibao .db-brief {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10.5px;
  line-height: 1.7;
  padding: 2px 0;
  color: var(--db-fg-soft);
}
.mp-skin-dibao .db-brief + .db-brief { border-top: 1px dotted var(--db-hair); }
.mp-skin-dibao .db-brief-name {
  color: var(--db-fg);
  font-weight: var(--db-fw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-skin-dibao .db-brief-num {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ── 书口页脚 ─────────────────────────────────────────────── */
.mp-skin-dibao .db-colophon {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 7px;
  border-top: 1px solid var(--db-hair);
  font-size: 9px;
  letter-spacing: .14em;
  color: var(--db-fg-soft);
  font-variant-numeric: tabular-nums;
}

/* ── 朱文急件章：380/18 微弹落章 ──────────────────────────
   没有「拖拽 / 点赞」控件，微弹落在真实的落章反馈上。 */
.mp-skin-dibao .db-seal {
  position: absolute;
  right: 18px;
  bottom: 10px;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border: 1px solid var(--db-seal-soft);
  border-radius: 3px;
  color: var(--db-seal);
  font-size: 25px;
  font-weight: var(--db-fw);
  line-height: 1;
  letter-spacing: 0;
  background: var(--db-seal-soft);
  opacity: .9;
  transform: rotate(-9deg) scale(1);
  transform-origin: center;
  transition: transform var(--db-dur-like) var(--db-ease-like), opacity 200ms ease-out;
  pointer-events: none;
}
.mp-skin-dibao.is-open .db-seal {
  animation: db-stamp var(--db-dur-like) var(--db-ease-like) both;
}
@keyframes db-stamp {
  /* 起始帧不能是 opacity:0 —— 万一动画没跑（无头浏览器、虚拟时间、
     用户禁用动画），印章会整个消失。基础态本来就可见，这里只做微弹。 */
  from { transform: rotate(-9deg) scale(1.19); opacity: .6; }
  to { transform: rotate(-9deg) scale(1); opacity: .9; }
}
.mp-skin-dibao .db-seal.is-urgent {
  border-color: var(--db-seal-soft);
  color: var(--db-seal);
}

/* 空态 */
.mp-skin-dibao .db-empty {
  padding: 22px 12px;
  text-align: center;
  font-size: 11px;
  line-height: 1.9;
  color: var(--db-fg-soft);
  text-wrap: pretty;
}
.mp-skin-dibao .db-empty small { font-size: 9.5px; opacity: .78; }

/* ── 窄屏：竖排退化成横排，四格改两格 ───────────────────── */
@media (max-width: 600px) {
  .mp-skin-dibao .db-leaf { padding: 12px 11px 56px; }
  .mp-skin-dibao .db-ear {
    position: static;
    max-width: none;
    margin: 0 0 8px;
    text-align: left;
  }
  .mp-skin-dibao .db-frame {
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
    padding: 10px 11px 11px;
  }
  .mp-skin-dibao .db-rail { display: none; }
  .mp-skin-dibao .db-headline-plain {
    display: block;
    margin: 0 0 8px;
    padding-bottom: 7px;
    border-bottom: 1px solid var(--db-hair);
    font-size: 16px;
    font-weight: var(--db-fw);
    line-height: 1.45;
    letter-spacing: .1em;
    color: var(--db-fg);
    text-wrap: pretty;
  }
  .mp-skin-dibao .db-dossier { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mp-skin-dibao .db-cell:nth-child(2) { border-right: 0; }
  .mp-skin-dibao .db-cell:nth-child(-n+2) { border-bottom: 1px solid var(--db-hair); }
  .mp-skin-dibao .db-seal { width: 38px; height: 38px; font-size: 21px; right: 12px; bottom: 9px; }
  .mp-skin-dibao .db-banner-vol { display: none; }
}

/* 系统「减少动态效果」：弹簧与落章全关 */
@media (prefers-reduced-motion: reduce) {
  .mp-skin-dibao .db-body,
  .mp-skin-dibao .db-body-clip,
  .mp-skin-dibao .db-fold,
  .mp-skin-dibao .db-seal { transition: none; }
  .mp-skin-dibao.is-open .db-seal { animation: none; }
}`;

  const SKIN_CSS_CALISTA = `/* ══════════════════════════════════════════════════════════════════
   少女心绪 · 楼内状态卡（Calista 美学，第六套皮肤）
   一张夹在书里的名札：收起是书签卡，轻点从落点泛起珠光，缎带收回、
   卡面像抽出的一页向前翻开。内部 id 仍为 calista，兼容旧存档偏好。
   ─────────────────────────────────────────────────────────────────
   铁律执行情况：
   1. 无纯黑 / 无纯白 / 无黑框：四层背景只差 2% 明度，边界用 8% 发丝线
   2. 聚焦不描边：所有可点元素用双环阴影（0 0 0 2px + 0 0 0 5px）
   3. 暗色字重降 40%：--cl-fw 600 → 360
   4. 心声逐字 blur(6px) 渐显，120ms，字间错开 30ms
   5. 图标统一下移 .125em 对齐基线
   6. 数字锁 tabular-nums
   7. 折叠 Grid 0fr → 1fr
   8. 正文 text-wrap: pretty
   9. 弹簧：展开 1200/80 零回弹曲线，落位 380ms 微弹
  10. 复制对勾 2.5s 自隐（本卡无复制动作，规则预留在 .cl-copied）
   ══════════════════════════════════════════════════════════════════ */

.mp-skin-calista {
  /* 浅色四层：灰粉 → 暖白，每层差 3% 明度，靠这一点点差别分层。
     取自蕾丝少女 / 干燥玫瑰 / 贝壳内壁，不是黄调亚麻，也不是冷灰。
     最亮一层停在 #F8F1EF（明度 95%），**不到纯白**——夜里把屏幕调暗时，
     一块 255 的白会先亮出来，其余层次全被它吃掉。 */
  --cl-bg-0: #E9E0E1;
  --cl-bg-1: #F1E8E8;
  --cl-bg-2: #F8F1EF;
  --cl-bg-3: #DCD1D2;

  --cl-ink:   #3E3237;
  --cl-ink-2: #6E595F;
  --cl-ink-3: #7B6469;

  --cl-hair:   rgba(62, 50, 55, .09);
  --cl-hair-2: rgba(62, 50, 55, .17);

  --cl-accent: #BB8D93;
  --cl-accent-soft: rgba(187, 141, 147, .16);

  /* 书签卡的两层垫纸与环境阴影：同色系，不用黑框、不用纯黑 */
  --cl-paper-1: var(--cl-bg-3);
  --cl-paper-2: var(--cl-bg-0);
  --cl-ambient: rgba(31, 28, 24, .55);
  /* 翻开时扫过卡面的一道光：暖白，夜里压到只剩一点 */
  --cl-sheen-hi: rgba(248, 241, 239, .52);

  /* 三组素材都用登录态小红书重新取的实拍，裁切压白后内联：
     容器底图是整卡的珠光纸；贝扣是鲍鱼贝内壁；书封水印是两枚扇贝。
     不再用 CSS 渐变去仿——真贝母的层纹是不规则的，渐变仿不出来。 */
  --cl-paper-art: url("data:image/webp;base64,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");
  --cl-nacre: url("data:image/webp;base64,UklGRuoDAABXRUJQVlA4IN4DAAAwGACdASpgAGAAPok+mEglI6IjqdXcyKARCWcAwFx2T4ZspEHxX2IbaaFPV0Co8Z/E9gPMXLHLsT8u6JXtWOiSAFbuNdKYQxOw/8pAq0KD7YDGyJrefP3+WnDHomEuDERoSOy7twgNVrnckFRDhsMXEfmyZLDmXqYQH4g2MSV+H2g9ll+fQt61MpK/cCoE3KwYUtIjRaXCE2HihWhR0Nb/wGVzV9pU0BXx/MHed9rGJnjISo6RXT3LGcWY5mqPAphc77WDgoVprQQAAP7vxOkbOkpuMRN2F+uhmr0ob7AAKETsDnoyRlnL2Nc+FdsT2SC5SVbvoapdhZUNvHwPT2oEYWD3mgdvGOdJQgaI9VsOhjYS1DvnZQLgcjVy/tMk16BXlzRnxy8+9MHx5qr4REirVoNT9lFo3SEbVP9a/rDzZUafXN5skTFny6+FOV6UTsQvJXdaTBDPuFbg1drSxWeiii/RuyITrq+POZhsYqLLpZqGgSkxmoA5D+aTiFdyZyQw2cQA6FG87baKKZVXJSWAH2+Q7Pu5lxGgbzQZgJ+7pa53Mwo35LOBczvr1aRtYVVDvMohgV2D/uDahxM3jykijYew+LBIIzM66ZoG1x5+c9Dow2LOuQvjzFO/oGQWuCAtuLVuRrzrXJ7nbeV1FY2niRF8XTKqXrfGDOa9ApKO5X7PwW/0HHBvUI1pqZj49rZfSa/o+VR5DiHMo4ASa5ygh63ofyUaDgSJtzdircU7kfxFqnt853BWb6ztEttFZwuqfMjskpSc4ejFRa85N6uXQb3JIVtaxZBZ/XiPCDYaW++l19kC/J7z+fY+SMvCDnJ1148BU4EkS39DFM4sK7NE2SO8BZDq7dsUaON2t8L3aPxHj7aDj9yXpGXF99alyqYz0lCGDvkbalFrWZiVxAH0PHtBJ3gjH8rJvkQzi9BSe1T2u8GLIsGTDlbxQIYnMZD0+AJnFRVYORKwlaebuk1DYbCDgDpbRIT6+Y5bxHri7aOIa59r2e1jUw0BIg8+Wt1+KA6K7K9xFpwR3/FNbdLylY/O702bc0yixusSgMphZpnHx5UnbUmXQXH7RL4jwXK0O/Rp5YwOsFov+RI4rYnDDsK+jEMqjNALF4nKBb1YVrkCtAdVu5LKdPyIwmigvKRXAJF/3669MqQQvolKE/d6+YyeX72Gct91A/Qm2iddRVMs2l99imTqYh8vJTdWfeH9gcObhPC/FTd+/29WMBCKWqnnnYKP0HAViTNg6h4x/2AaKlrKk1k0a3S91FqY2XO4/t7AsQMhYH3GKTK7q3cRv4POLxgV8t7vAagAAAA=");
  --cl-cover-art: url("data:image/webp;base64,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");
  --cl-pearl-0: #EADCDD;
  /* 书封头那块色：比卡面深一档的灰粉，参考图里的绿色封面换成灰粉 */
  --cl-cover-bg: #E4D7D9;
  /* 容器底图走实拍，卡面不再叠自绘的线性渐变光 */

  --cl-fw: 600;
  --cl-fw-body: 400;

  --cl-serif: "Calista", "Songti SC", "Noto Serif SC", "Source Han Serif SC", Georgia, "Times New Roman", serif;
  --cl-sans: -apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;

  /* 弹簧：1200/80 零回弹；落位带一点微弹 */
  --cl-spring: cubic-bezier(.2, .9, .12, 1);
  --cl-pop: cubic-bezier(.34, 1.18, .64, 1);
  --cl-ease: cubic-bezier(.16, 1, .3, 1);

  container-type: inline-size;
  margin: 10px 0 2px;
  color: var(--cl-ink);
  font-family: var(--cl-sans);
  font-size: 12.5px;
  font-weight: var(--cl-fw-body);
  line-height: 1.6;
  text-wrap: pretty;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* 深色四层：同一套灰粉色相压暗，不是换成另一套颜色；文字降到 360 字重 */
.mp-skin-calista[data-theme="night"] {
  --cl-bg-0: #171316;
  --cl-bg-1: #1E181C;
  --cl-bg-2: #251E22;
  --cl-bg-3: #100C0E;

  --cl-ink:   #F3EAEA;
  --cl-ink-2: #C9B6BA;
  --cl-ink-3: #9B888C;

  --cl-hair:   rgba(243, 234, 234, .10);
  --cl-hair-2: rgba(243, 234, 234, .19);

  --cl-accent: #DFA9AE;
  --cl-accent-soft: rgba(223, 169, 174, .18);
  --cl-ambient: rgba(6, 5, 4, .82);
  --cl-sheen-hi: rgba(243, 234, 234, .075);
  /* 夜里换成同一批实拍素材压暗后的版本，结构完全不动 */
  --cl-paper-art: url("data:image/webp;base64,UklGRoADAABXRUJQVlA4IHQDAADwLQCdASqAAYABPolEn0wlI6KiIAgAoBEJaW7hMNO1T42s9MhGRp/DrQZR3pedPCtON8AFZu2DaQgu0qBZNFnY/aQ2G/m+GTsHYdjkcXNIiuv0vqFxJ+VJbShGYLgg+GtBpJuoA/DCYITzoaRJKXqwgu1R9o+D/qe43tjFWZmjLZxK1tWZUau/AU2oHU6wK/zC5Lln/XyHxijOVPqDlWVJXN2t744IT7iQYFU97aRqjIQ3kvOau71u06Zsq2isAPvdsEAmP3G/c9u7SpWy1T+hntqxn1hhn8RXXvoU2+IitPn2EPYilm6tqEAgMxkRx0UrXfEztk5KWEgsI4TW8dJFRuIZVOFAIZyf4e0KtIEtqY8Q2AJ7G9gAxgAqaz0MmlWNf9PDZvOCZfMAfaydnUuz1dCYVT+T3gpjNt3WHCDGCIVfoeiy+6tx5Sm2sMae3h6XSL8GB1A/3GqEgsamWae5lIsCcxS4Q+8SYlFbwPwRLcIXdhSgZsRAAP7hdbKXeDfFTT9xrv3UhLrnYa1PiSxSZ45/J4XV6cGJzdjHtbbAlPIpyW7t2/cGzPip3R2jf3oTJR3LBJDO88HmbcMxsIHU81bpQrXtPtUaboZjLeKs3jH1YrGmXYGhK31TKEdfjK7VCsuKjJTARJDGxyFFoestodyQM21lis8FrpiK2SCBMHTPeJFttGDXkamPATRBFuQ23UuhnXTzCU/osTXBn3X3qMJ+ITWMq/W9PnZ3ucVQwDJfEWdqiA4P68AFgSRDliv6Oiq1no0VjTR+/yvQpttV//fYAXkMAJ/wTaojIXZRDs6BYioKzU4UFKgzgTl/M1R8rUx5+hx0l9inOyUqr3IWZG7+CT0kUq4SvZ+DBhL5BGe+kNObUksG52dRWY9eN5ahW0FjYAlbx3SobSMd8O3Cx931N01wJd0BOL9aeHTgVVYMScRoM2+S5OW0sgPdo2X4gxiNBumUrh06HycNWpaWSMr6YI//g6Rg2rDRlmr3Xt+xwyqT5Rg0kYeKzhXzZiKcqDQ+VziH5rTLxcMWsed/UHF1G2+zeSdBxU7HFaWHyUbZ278U913z5NtaZu+25jJO1x0p18QAeeYdPtIB3ckNjwqwdtJGxqx56DQgSCv2Mix6Jq/Lgh6RFgLVNoo7nxsB8gDD4kg1lwpGnGXQjzhA7AAAAA==");
  --cl-nacre: url("data:image/webp;base64,UklGRgQCAABXRUJQVlA4IPgBAABwDwCdASpgAGAAPolAm0olI6IkpXVaIKARCWls0vAF34JuYMzRs6GWpJjuiW9nlp1oo/n+zObJRVT7DB+0CGTzUQN/7vWw2mwiyTemETWdw0hz0qe8MGhzbEZ0w1Zhqt4BrFV/Kvq2MNiR/M5JXrjVHQciMPbROXQ/Y1ppUUL/KMJi9GQA/u8J5r661iQNigMlFym+P7mUnLYEMqDfyY7Bk4cIu1IxFInDILisU/hT8lOWT0Ioa5c7QiO0dq8D9HkQz26tqUwauXOf7mCXTFwtA2CVXyQw9sgD3MQd8XlS2AWtye3zv9hRMGnyF4uUv1dtyJ0xJgcubG38U68L5+fEEfAhKABHiZOPEH01wwKKl10YsRPQn8KrDQG4EpEwkNAetj6Iinhp9NmcjKwLS3/PlbgMUWEkTDcvmmBhN2R6C0hkhJUmuKWSe7BCWj/sTJl20hvC0WruoNpYJx1u9Bl7/e2ERUWLbq/NikmJHQXDhNvZpugcCoNyhiCbStNpyhM7kmCW56ookE9lfLc9SDi8hynCFEAFc92qGenw3d5zgzG1IjECiVfZeesnVJhWjsZAsX72KpEsGeqbxYsb1JGUEREA5KSyoE8N9daKkcAMj7krI8sN3KTcoxughRVv7fHf2twgs3j5VRSMnjMLie2+PB8wAepdwAA=");
  --cl-cover-art: url("data:image/webp;base64,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");
  --cl-pearl-0: #2E2428;
  --cl-cover-bg: #1B1519;
  /* 夜间同样只铺压暗后的实拍底图，不再另画一层渐变 */

  --cl-fw: 360;
  --cl-fw-body: 300;
}

/* ── 收起态：一张夹在书里的名札（书签卡） ───────────────────────
   不再是胶囊：矩形卡面 + 顶部标题带 + 底部缎带尖。
   边界只用发丝线，两层同色垫纸做出纸叠厚度，不用黑框。 */
.mp-skin-calista .cl-wrap { position: relative; }
/* 收起时给缎带尖留 10px，展开后由 .is-open 收掉，不顶开卡面 */
.mp-skin-calista:not(.is-open) .cl-wrap { padding-bottom: 10px; }

.mp-skin-calista .cl-fold {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 16px;
  /* 容器底图：一张压过白的实拍贝母珠光纸，不是自绘渐变 */
  background-color: var(--cl-bg-1);
  background-image: var(--cl-paper-art);
  background-size: cover;
  background-position: center;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  /* 不描边：一圈发丝线 + 两层同色垫纸 + 一层环境阴影 */
  box-shadow:
    inset 0 0 0 1px var(--cl-hair),
    0 2px 0 var(--cl-paper-1),
    0 4px 0 var(--cl-paper-2),
    0 14px 28px -20px var(--cl-ambient);
  transition:
    background-color 260ms var(--cl-ease),
    box-shadow 260ms var(--cl-ease),
    transform 180ms var(--cl-ease),
    border-radius 420ms var(--cl-spring);
  -webkit-tap-highlight-color: transparent;
}
/* 展开后垫纸收掉，标题卡与下面的卡面读成同一张纸 */
.mp-skin-calista.is-open .cl-fold {
  --cl-paper-1: transparent;
  --cl-paper-2: transparent;
  border-radius: 16px 16px 10px 10px;
}
.mp-skin-calista .cl-fold:hover { background-color: var(--cl-bg-2); }
.mp-skin-calista .cl-fold:active { transform: scale(.988) translateY(1px); }
.mp-skin-calista .cl-fold:focus-visible {
  outline: none;
  box-shadow:
    inset 0 0 0 1px var(--cl-hair-2),
    0 0 0 2px var(--cl-bg-1),
    0 0 0 4px var(--cl-accent-soft),
    0 14px 28px -20px var(--cl-ambient);
}

/* 顶部标题带：这套皮的名字写在这里，旁边一枚真贝母小珠 */
.mp-skin-calista .cl-band {
  display: flex;
  align-items: center;
  gap: 7px;
  box-sizing: border-box;
  padding: 7px 13px 6px;
  border-radius: 16px 16px 0 0;
  background: var(--cl-bg-2);
  box-shadow: inset 0 -1px 0 var(--cl-hair);
}
.mp-skin-calista .cl-band-bead {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cl-nacre) center / cover no-repeat, var(--cl-pearl-0);
  box-shadow: inset 0 0 0 1px var(--cl-hair);
}
.mp-skin-calista .cl-band-title {
  font-family: var(--cl-serif);
  font-size: 10.5px;
  font-weight: var(--cl-fw);
  letter-spacing: .18em;
  color: var(--cl-ink-2);
  white-space: nowrap;
}
.mp-skin-calista .cl-band-note {
  margin-left: auto;
  font-size: 8px;
  letter-spacing: .14em;
  color: var(--cl-ink-3);
  white-space: nowrap;
}

/* 主行：贝扣 / 名字 / 好感 / 箭头，整块 >= 44px 的点击区 */
.mp-skin-calista .cl-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  box-sizing: border-box;
  padding: 8px 12px 9px 10px;
}

/* 书签缎带尖：卡底中央垂下一枚小三角，只在收起时露出 */
.mp-skin-calista .cl-fold::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -9px;
  width: 28px;
  height: 10px;
  transform: translateX(-50%);
  transform-origin: 50% 0;
  background: var(--cl-bg-1);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  filter: drop-shadow(0 2px 2px var(--cl-ambient));
  pointer-events: none;
  transition: transform 420ms var(--cl-spring), opacity 260ms var(--cl-ease);
}
.mp-skin-calista .cl-fold:hover::after { background: var(--cl-bg-2); }
.mp-skin-calista.is-open .cl-fold::after {
  transform: translateX(-50%) scaleY(0);
  opacity: 0;
}

/* 点击处泛起的一圈珠光：只在真正点过之后播，数据重刷不播 */
.mp-skin-calista .cl-tap-layer {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
}
.mp-skin-calista .cl-tap-ripple {
  position: absolute;
  left: var(--cl-tap-x, 50%);
  top: var(--cl-tap-y, 50%);
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  /* 柔边径向光晕，不是一块硬边色盘：扩散时只留一层玫瑰余晖 */
  background: radial-gradient(circle, var(--cl-accent) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
}
.mp-skin-calista.is-tapped .cl-tap-ripple {
  animation: clRipple 560ms var(--cl-ease) both;
}
@keyframes clRipple {
  0%   { opacity: .30; transform: scale(0); }
  55%  { opacity: .16; }
  100% { opacity: 0;   transform: scale(20); }
}

/* 圆章：一枚**扁平的母贝扣** + 首字母。**没有外圈**。
   平底 + 斜向珠光 + 粉/香槟/青虹彩；不画球面、不画高光点、不画立体阴影。 */
.mp-skin-calista .cl-orb {
  position: relative;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  /* 真实鲍鱼贝内壁的粉/青层纹，平铺在圆片上；底色只作安全兜底 */
  background: var(--cl-nacre) center / cover no-repeat, var(--cl-pearl-0);
  /* 只留一圈均匀发丝线界定圆片轮廓，不做任何方向性的立体阴影 */
  box-shadow: inset 0 0 0 1px var(--cl-hair);
  font-family: var(--cl-serif);
  font-size: 16px;
  font-weight: var(--cl-fw);
  line-height: 1;
  letter-spacing: .01em;
  color: var(--cl-ink);
  /* 一圈柔光只为可读性，不描边、不做浮雕 */
  text-shadow: 0 0 3px var(--cl-bg-2), 0 0 2px var(--cl-bg-2);
}

.mp-skin-calista .cl-id {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.mp-skin-calista .cl-name {
  font-family: var(--cl-serif);
  font-size: 14px;
  font-weight: var(--cl-fw);
  line-height: 1.25;
  letter-spacing: .05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mp-skin-calista .cl-sub {
  font-size: 9px;
  line-height: 1.4;
  letter-spacing: .16em;
  color: var(--cl-ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp-skin-calista .cl-val {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-left: auto;
  flex: 0 0 auto;
}
.mp-skin-calista .cl-val b {
  font-family: var(--cl-serif);
  font-size: 17px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: .01em;
  font-variant-numeric: tabular-nums;
}
.mp-skin-calista .cl-val span {
  font-size: 8.5px;
  letter-spacing: .12em;
  color: var(--cl-ink-3);
}

/* 箭头：和其它图标一样下移 .125em 贴基线 */
.mp-skin-calista .cl-chev {
  flex: 0 0 auto;
  position: relative;
  top: .125em;
  width: 13px;
  height: 13px;
  color: var(--cl-ink-3);
  transition: transform 340ms var(--cl-spring), color 200ms;
}
.mp-skin-calista .cl-fold:hover .cl-chev { color: var(--cl-ink-2); }
.mp-skin-calista.is-open .cl-chev { transform: rotate(180deg); }

/* ── 折叠：Grid 0fr → 1fr ─────────────────────────────────────── */
.mp-skin-calista .cl-body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 380ms var(--cl-pop),
    opacity 220ms var(--cl-ease);
}
.mp-skin-calista .cl-body:not([hidden]) {
  grid-template-rows: 1fr;
  opacity: 1;
}
.mp-skin-calista .cl-body-clip {
  min-height: 0;
  overflow: hidden;
}
.mp-skin-calista .cl-body:not([hidden]) .cl-body-clip {
  padding-top: 8px;
}

/* ── 展开后的卡面 ───────────────────────────────────────────────── */
.mp-skin-calista .cl-sheet {
  position: relative;
  overflow: hidden;
  transform-origin: 50% 0;
  padding: 13px 13px 12px;
  /* 展开后的卡面与收起书签读成同一张珠光纸，质感来自实拍而非渐变 */
  background-image: var(--cl-paper-art);
  background-size: cover;
  background-position: center;
  border-radius: 20px;
  background-color: var(--cl-bg-0);
  box-shadow:
    inset 0 0 0 1px var(--cl-hair),
    0 14px 34px -26px rgba(31, 28, 24, .6);
}
.mp-skin-calista[data-theme="night"] .cl-sheet {
  box-shadow:
    inset 0 0 0 1px var(--cl-hair),
    0 14px 34px -26px rgba(6, 5, 4, .9);
}
/* 同心圆：Calista 的线，只做节奏，不抢内容 */
.mp-skin-calista .cl-sheet::before {
  content: "";
  position: absolute;
  right: -78px;
  top: -84px;
  width: 176px;
  height: 176px;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at 50% 50%,
    transparent 0 16px,
    var(--cl-hair) 16px 17px
  );
  opacity: .42;
  pointer-events: none;
}
.mp-skin-calista .cl-sheet > * { position: relative; }
/* 翻开时扫过的一道暖白光：默认停在卡外，只有点击展开才走一遍 */
.mp-skin-calista .cl-sheet::after {
  content: "";
  position: absolute;
  inset: -20% -60%;
  background: linear-gradient(105deg,
    transparent 34%, var(--cl-sheen-hi) 50%, transparent 66%);
  opacity: 0;
  transform: translateX(-120%);
  pointer-events: none;
}

/* ── 书封头：把参考图那张「首页」的上半色块搬进状态卡 ───────────
   大面积低饱和色块 + 衬线斜体大标题 + 水印级线描插画；
   下面那条暖白横条就是参考图的「Prologue.」带。 */
.mp-skin-calista .cl-cover {
  position: relative;
  margin: -13px -13px 0;
  padding: 15px 18px 17px;
  min-height: 92px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  background: var(--cl-cover-bg);
  border-radius: 20px 20px 0 0;
}
.mp-skin-calista .cl-cover-kicker {
  font-size: 8.5px;
  letter-spacing: .24em;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-cover-title {
  font-family: var(--cl-serif);
  font-style: italic;
  font-size: 27px;
  font-weight: var(--cl-fw);
  line-height: 1.06;
  letter-spacing: -.01em;
  color: var(--cl-ink);
}
.mp-skin-calista .cl-cover-title.is-cjk { font-style: normal; letter-spacing: .06em; }
.mp-skin-calista .cl-cover-note {
  font-family: var(--cl-serif);
  font-style: italic;
  font-size: 10.5px;
  color: var(--cl-ink-2);
  opacity: .85;
}
/* 右侧装饰是登录态小红书重新取的两枚粉白扇贝实拍（处理后内联），不是手绘线描；
   四边羽化压在色块里，只当水印，不做主角。底缘的点阵花边一并删掉。 */
.mp-skin-calista .cl-cover::before {
  content: "";
  position: absolute;
  right: -6px;
  bottom: -12px;
  width: 128px;
  height: 128px;
  background: var(--cl-cover-art) center / contain no-repeat;
  opacity: .32;
  pointer-events: none;
}
.mp-skin-calista[data-theme="night"] .cl-cover::before { opacity: .24; }

.mp-skin-calista .cl-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 -13px 11px;
  padding: 9px 13px;
  background: var(--cl-bg-2);
}
.mp-skin-calista .cl-top-left {
  display: flex;
  align-items: baseline;
  gap: 11px;
  min-width: 0;
}
.mp-skin-calista .cl-prologue {
  font-family: var(--cl-serif);
  font-style: italic;
  font-size: 15px;
  font-weight: var(--cl-fw);
  color: var(--cl-ink);
  white-space: nowrap;
}
.mp-skin-calista .cl-stagechip {
  font-size: 9.5px;
  letter-spacing: .16em;
  color: var(--cl-ink-2);
}
.mp-skin-calista .cl-theme {
  border: 0;
  background: transparent;
  color: var(--cl-ink-3);
  font: inherit;
  font-size: 10px;
  letter-spacing: .12em;
  padding: 6px 8px;
  margin: -6px -4px -6px 0;
  border-radius: 999px;
  cursor: pointer;
  transition: color 180ms var(--cl-ease), background-color 180ms var(--cl-ease);
  -webkit-tap-highlight-color: transparent;
}
.mp-skin-calista .cl-theme:hover { color: var(--cl-ink); background: var(--cl-bg-2); }
.mp-skin-calista .cl-theme:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--cl-bg-0), 0 0 0 4px var(--cl-accent-soft);
}

.mp-skin-calista .cl-grid { display: grid; gap: 7px; }
.mp-skin-calista .cl-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px 12px 14px;
  border-radius: 14px;
  background: var(--cl-bg-2);
}
/* 一圈 2px 的环：Calista 的「圆」就是数值本身 */
.mp-skin-calista .cl-ring {
  position: relative;
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  display: block;
}
.mp-skin-calista .cl-ring svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.mp-skin-calista .cl-ring .cl-ring-arc {
  transition: stroke-dashoffset 900ms var(--cl-spring);
}
.mp-skin-calista .cl-ring-bead {
  filter: drop-shadow(0 0 3px rgba(192, 134, 127, .45));
}
.mp-skin-calista .cl-hero-main { display: grid; gap: 2px; min-width: 0; }
.mp-skin-calista .cl-hero .cl-v { font-size: 34px; }
.mp-skin-calista .cl-k {
  display: block;
  font-size: 9px;
  letter-spacing: .18em;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-v {
  display: block;
  margin-top: 3px;
  font-family: var(--cl-serif);
  font-weight: 400;
  font-size: 18px;
  line-height: 1.05;
  letter-spacing: .01em;
  font-variant-numeric: tabular-nums;
}
.mp-skin-calista .cl-hero .cl-v {
  margin-top: 2px;
  font-size: 34px;
  letter-spacing: -.01em;
}
.mp-skin-calista .cl-v small {
  font-family: var(--cl-sans);
  font-size: 9.5px;
  font-weight: var(--cl-fw-body);
  letter-spacing: .1em;
  color: var(--cl-ink-3);
  margin-left: 4px;
}


.mp-skin-calista .cl-row3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}
.mp-skin-calista .cl-tile {
  padding: 9px 10px 10px;
  border-radius: 14px;
  background: var(--cl-bg-2);
}
.mp-skin-calista .cl-tile .cl-v { font-size: 17px; }
.mp-skin-calista .cl-tile .cl-v.is-text {
  font-family: var(--cl-sans);
  font-size: 12px;
  font-weight: var(--cl-fw);
  letter-spacing: .02em;
  line-height: 1.5;
  margin-top: 4px;
  min-height: 1.5em;
}

/* 心声：逐字 blur 渐显 */
.mp-skin-calista .cl-voice {
  margin: 11px 0 0;
  padding: 0;
  border: 0;
  font-family: var(--cl-serif);
  font-size: 13.5px;
  font-weight: 400;
  line-height: 1.8;
  color: var(--cl-ink-2);
  text-wrap: pretty;
}
.mp-skin-calista .cl-voice-mark {
  color: var(--cl-accent);
  opacity: .75;
  margin-right: 1px;
}
.mp-skin-calista .cl-ch {
  display: inline;
  opacity: 0;
  filter: blur(6px);
  animation: clCharIn 120ms ease forwards;
  animation-delay: calc(var(--i, 0) * 30ms);
}
@keyframes clCharIn {
  to { opacity: 1; filter: blur(0); }
}

.mp-skin-calista .cl-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 12px;
  margin: 9px 0 0;
  font-size: 10px;
  letter-spacing: .1em;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-meta b {
  font-weight: var(--cl-fw);
  color: var(--cl-ink-2);
}

.mp-skin-calista .cl-others {
  display: grid;
  gap: 5px;
  margin: 10px 0 0;
  padding: 10px 0 0;
  box-shadow: inset 0 1px 0 var(--cl-hair);
}
.mp-skin-calista .cl-other {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--cl-ink-2);
}
.mp-skin-calista .cl-other b {
  font-weight: var(--cl-fw);
  color: var(--cl-ink);
}
.mp-skin-calista .cl-other i {
  font-style: normal;
  font-family: var(--cl-serif);
  font-size: 12px;
  color: var(--cl-ink-2);
  font-variant-numeric: tabular-nums;
}

.mp-skin-calista .cl-empty {
  padding: 18px 12px 20px;
  text-align: center;
  font-size: 11.5px;
  line-height: 1.9;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-empty b {
  display: block;
  margin-bottom: 4px;
  font-family: var(--cl-serif);
  font-size: 14px;
  font-weight: var(--cl-fw);
  color: var(--cl-ink-2);
}

/* 展开时子块错峰浮起：一次编排，不散着动 */
.mp-skin-calista.is-open .cl-sheet > * {
  animation: clRise 380ms var(--cl-ease) both;
}
.mp-skin-calista.is-open .cl-sheet > *:nth-child(2) { animation-delay: 40ms; }
.mp-skin-calista.is-open .cl-sheet > *:nth-child(3) { animation-delay: 80ms; }
.mp-skin-calista.is-open .cl-sheet > *:nth-child(4) { animation-delay: 120ms; }
.mp-skin-calista.is-open .cl-sheet > *:nth-child(5) { animation-delay: 160ms; }
@keyframes clRise {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

/* ── 点击展开那一瞬：一次编排好的四拍 ─────────────────────────────
   1) 缎带尖收回（上面 .is-open 的 scaleY(0)）；
   2) 卡面从页脊向前翻开，560ms 零回弹弹簧；
   3) 一道暖白珠光斜扫过卡面，错开 90ms 起步；
   4) 贝扣微弹一下（380ms），子块按 40ms 间隔错峰浮起。
   全部挂在 is-tapped 上：只有真正点过才播；数据重刷会重建整张卡，
   深浅切换会先摘掉标记，两者都不会把动画再放一遍。 */
.mp-skin-calista.is-open.is-tapped .cl-sheet {
  animation: clUnfold 560ms var(--cl-spring) both;
}
.mp-skin-calista.is-open.is-tapped .cl-sheet::after {
  animation: clSheen 900ms var(--cl-ease) 90ms both;
}
.mp-skin-calista.is-open.is-tapped .cl-orb {
  animation: clPearlPop 380ms var(--cl-pop) both;
}
@keyframes clUnfold {
  from { opacity: 0; transform: perspective(900px) rotateX(-8deg) translateY(-12px) scale(.985); }
  to   { opacity: 1; transform: none; }
}
@keyframes clSheen {
  0%   { opacity: 0;   transform: translateX(-120%); }
  18%  { opacity: 1; }
  100% { opacity: 0;   transform: translateX(120%); }
}
@keyframes clPearlPop {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.09); }
  100% { transform: scale(1); }
}

/* 窄屏：数字降一档，三格变两格 */
@container (max-width: 360px) {
  .mp-skin-calista .cl-hero .cl-v { font-size: 30px; }
  .mp-skin-calista .cl-row3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mp-skin-calista .cl-voice { font-size: 13px; }
}

/* ══ 明信片：正面珍珠贝母 + 银字，背面贝母实拍（v4.8.13）════════════
   收起态不再是一张书签：这是一张可以翻面的明信片。
   正反两面是同一块贝壳：乳白、极淡虹彩、同心层理。银只压在正面那行英文上。
   背面才是人物近况；点一下绕 Y 轴翻过去。两面都不描边、不用纯白。 */
.mp-skin-calista .cl-pc {
  position: relative;
  width: 100%;
  perspective: 1400px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.mp-skin-calista .cl-pc-inner {
  position: relative;
  display: grid;
  transform-style: preserve-3d;
  transition: transform 760ms cubic-bezier(.2, .85, .2, 1);
  will-change: transform;
}
.mp-skin-calista .cl-pc.is-flipped .cl-pc-inner { transform: rotateY(180deg); }
.mp-skin-calista .cl-pc:focus-visible { outline: none; }
.mp-skin-calista .cl-pc:focus-visible .cl-pc-front,
.mp-skin-calista .cl-pc:focus-visible .cl-pc-back {
  box-shadow:
    inset 0 0 0 1px var(--cl-hair-2),
    0 0 0 2px var(--cl-bg-1),
    0 0 0 4px var(--cl-accent-soft),
    0 14px 30px -20px var(--cl-ambient);
}
.mp-skin-calista .cl-pc-face {
  grid-area: 1 / 1;
  position: relative;
  box-sizing: border-box;
  min-height: 192px;
  border-radius: 14px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.mp-skin-calista .cl-pc-back { transform: rotateY(180deg); }

/* ── 正面：珍珠贝母底托 + 银质压印字 ───────────────────────
   底托跟背面是同一块贝壳：乳白、泛很淡的虹彩、有同心层理。
   银只出现在字上——字是银箔压进贝母里的那种，不是整张铝板。 */
.mp-skin-calista .cl-pc-front {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 15px 18px 13px;
  color: #464d54;
  font-family: var(--cl-serif);
  background-color: #f5f2f0;
  background-image:
    /* 虹彩：贝母在光下换色，压得很淡 */
    conic-gradient(from 204deg at 26% 14%,
      rgba(206, 228, 232, .50) 0deg,
      rgba(243, 216, 226, .44) 58deg,
      rgba(246, 240, 214, .48) 120deg,
      rgba(209, 223, 242, .44) 184deg,
      rgba(231, 213, 240, .42) 246deg,
      rgba(211, 235, 229, .46) 308deg,
      rgba(206, 228, 232, .50) 360deg),
    /* 珍珠层理：贝壳一圈圈的同心细弧，圆心落在右下角外面 */
    repeating-radial-gradient(circle at 116% 122%,
      rgba(250, 247, 246, .50) 0 2px,
      rgba(198, 201, 208, .10) 2px 6px),
    /* 底托：乳白微冷，没有任何金属分段 */
    linear-gradient(152deg, #fbf8f6 0%, #f1f0f0 42%, #faf6f3 70%, #efeff1 100%);
  box-shadow:
    inset 0 0 0 1px rgba(112, 119, 127, .16),
    inset 0 1px 0 rgba(250, 247, 246, .95),
    0 14px 30px -20px rgba(42, 38, 44, .50);
}
/* 珠光：左上那片柔白 + 右下一层极淡的冷紫，像照过光的贝壳内壁 */
.mp-skin-calista .cl-pc-front::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(118% 88% at 16% 4%, rgba(250, 247, 246, .74), transparent 58%),
    radial-gradient(92% 82% at 86% 96%, rgba(154, 150, 164, .14), transparent 62%);
}
/* 油膜反光：一道很宽的斜向亮带，扫过去就没了 */
.mp-skin-calista .cl-pc-front::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(104deg,
    transparent 32%, rgba(250, 247, 246, .46) 45%, transparent 58%);
  opacity: .6;
}
.mp-skin-calista .cl-pc-front > * { position: relative; z-index: 1; }
.mp-skin-calista .cl-pc-kicker {
  font-size: 8.5px;
  letter-spacing: .34em;
  text-transform: uppercase;
  color: #5d666e;
  text-shadow: 0 1px 0 rgba(250, 247, 246, .88);
}
.mp-skin-calista .cl-pc-en {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-right: 80px;
}
/* 银字：横向一道银箔渐变（暗-亮-暗），靠上下两道投影压出刻痕。
   整体压得比纯银暗两档——底托是米白贝母，字太亮就浮不起来。 */
.mp-skin-calista .cl-pc-en-main {
  font-size: 21px;
  font-weight: 400;
  line-height: 1.18;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: #626b72;
  background-image: linear-gradient(98deg,
    #4f585f 0%, #818a91 15%, #c9d0d5 31%, #5b646b 47%,
    #bcc4ca 64%, #7a838a 81%, #4a535a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter:
    drop-shadow(0 1px 0 rgba(250, 247, 246, .95))
    drop-shadow(0 -0.7px 0 rgba(62, 70, 78, .45));
  word-break: break-word;
}
/* 标题下的一道刻线：像银器上錾出来的一笔，不要太长 */
.mp-skin-calista .cl-pc-en-main::after {
  content: "";
  display: block;
  width: 36px;
  height: 1px;
  margin-top: 10px;
  background: linear-gradient(90deg, rgba(86, 93, 101, .52), rgba(86, 93, 101, 0));
}
.mp-skin-calista[data-theme="night"] .cl-pc-en-main::after {
  background: linear-gradient(90deg, rgba(226, 230, 235, .46), rgba(226, 230, 235, 0));
}
/* 右下三条地址线：明信片背面才有的那种虚线，正面只留淡淡的印刷痕 */
.mp-skin-calista .cl-pc-lines {
  position: absolute;
  right: 19px;
  bottom: 42px;
  z-index: 1;
  width: 108px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.mp-skin-calista .cl-pc-lines i {
  display: block;
  height: 1px;
  background: linear-gradient(90deg, rgba(86, 93, 101, 0), rgba(86, 93, 101, .30));
}
.mp-skin-calista[data-theme="night"] .cl-pc-lines i {
  background: linear-gradient(90deg, rgba(226, 230, 235, 0), rgba(226, 230, 235, .22));
}
.mp-skin-calista .cl-pc-en-sub {
  font-style: normal;
  font-size: 8.5px;
  line-height: 2;
  letter-spacing: .26em;
  text-transform: uppercase;
  color: #5a636b;
  text-shadow: 0 1px 0 rgba(250, 247, 246, .80);
}
/* 邮票：一张贝母小方块，贴着齿孔边 */
.mp-skin-calista .cl-pc-stamp {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 2;
  width: 42px;
  height: 50px;
  padding: 3px;
  box-sizing: border-box;
  background: #f2f4f6;
  box-shadow: 0 0 0 1px rgba(92, 99, 107, .26);
}
.mp-skin-calista .cl-pc-stamp-art {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--cl-nacre) center / cover no-repeat, var(--cl-pearl-0);
  box-shadow: inset 0 0 0 1px rgba(92, 99, 107, .20);
}
/* 邮戳：一圈虚线，落在邮票正下方，字必须收在圈里 */
.mp-skin-calista .cl-pc-postmark {
  position: absolute;
  right: 17px;
  top: 66px;
  z-index: 2;
  width: 62px;
  height: 62px;
  box-sizing: border-box;
  border: 1px dashed rgba(88, 95, 103, .42);
  border-radius: 50%;
  transform: rotate(-12deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: 5.4px;
  line-height: 1.5;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(84, 91, 99, .70);
  text-align: center;
  pointer-events: none;
}
.mp-skin-calista .cl-pc-postmark em { font-style: normal; display: block; max-width: 50px; }
.mp-skin-calista .cl-pc-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  font-size: 8px;
  letter-spacing: .20em;
  text-transform: uppercase;
  color: #565f67;
  text-shadow: 0 1px 0 rgba(250, 247, 246, .82);
}
.mp-skin-calista .cl-pc-num { font-variant-numeric: tabular-nums; }
.mp-skin-calista .cl-pc-tap { color: #4c545c; }

/* ── 背面：贝母纸上的近况 ───────────────────────────────── */
.mp-skin-calista .cl-pc-back {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 13px 15px 12px;
  background-color: var(--cl-bg-1);
  background-image:
    linear-gradient(rgba(250, 245, 243, .40), rgba(242, 234, 233, .50)),
    var(--cl-nacre);
  background-size: cover, cover;
  background-position: center, center;
  box-shadow:
    inset 0 0 0 1px var(--cl-hair),
    0 14px 30px -20px var(--cl-ambient);
}
/* 贝母晕彩：一层极淡的彩虹，随角度换色。不压字——只做柔光叠上去 */
.mp-skin-calista .cl-pc-back::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: conic-gradient(from 206deg at 28% 16%,
    rgba(196, 226, 233, .58) 0deg,
    rgba(238, 209, 224, .50) 62deg,
    rgba(246, 238, 205, .54) 124deg,
    rgba(198, 216, 240, .52) 188deg,
    rgba(226, 208, 238, .48) 250deg,
    rgba(201, 231, 226, .54) 312deg,
    rgba(196, 226, 233, .58) 360deg);
  mix-blend-mode: soft-light;
  opacity: .95;
}
.mp-skin-calista .cl-pc-back > * { position: relative; z-index: 1; }
.mp-skin-calista[data-theme="night"] .cl-pc-back {
  background-image:
    linear-gradient(rgba(26, 21, 27, .74), rgba(20, 16, 21, .82)),
    var(--cl-nacre);
}
.mp-skin-calista[data-theme="night"] .cl-pc-back::before {
  mix-blend-mode: screen;
  opacity: .16;
}
.mp-skin-calista .cl-pc-back-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mp-skin-calista .cl-pc-back-kicker {
  font-size: 7.5px;
  letter-spacing: .26em;
  text-transform: uppercase;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-pc-identity {
  display: flex;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
}
.mp-skin-calista .cl-pc-name {
  font-family: var(--cl-serif);
  font-size: 19px;
  font-weight: var(--cl-fw);
  letter-spacing: .06em;
  color: var(--cl-ink);
  line-height: 1.2;
}
.mp-skin-calista .cl-pc-enname {
  font-size: 7.5px;
  letter-spacing: .24em;
  text-transform: uppercase;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-pc-hero {
  display: flex;
  align-items: center;
  gap: 9px;
}
.mp-skin-calista .cl-pc-big {
  font-family: var(--cl-serif);
  font-size: 30px;
  line-height: 1;
  font-weight: var(--cl-fw);
  letter-spacing: -.01em;
  color: var(--cl-ink);
  font-variant-numeric: tabular-nums;
}
.mp-skin-calista .cl-pc-big small {
  font-size: 10px;
  letter-spacing: .04em;
  color: var(--cl-ink-3);
  margin-left: 2px;
}
.mp-skin-calista .cl-pc-label {
  font-size: 8.5px;
  letter-spacing: .22em;
  color: var(--cl-ink-3);
}
.mp-skin-calista .cl-pc-ring { margin-left: auto; flex: 0 0 auto; }
/* 好感数字与进度环之间拉一道虚线：像明信片上手写的引导线，别让中间空着 */
.mp-skin-calista .cl-pc-leader {
  flex: 1 1 auto;
  min-width: 12px;
  height: 0;
  margin: 0 3px;
  align-self: center;
  border-bottom: 1px dashed var(--cl-hair-2);
}
/* 背面那行时间地点比别处长，字号收一点免得「16°C」单独掉到下一行 */
.mp-skin-calista .cl-pc-back .cl-meta {
  font-size: 9px;
  letter-spacing: .06em;
  gap: 2px 9px;
}
.mp-skin-calista .cl-pc-back-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 1px;
}
.mp-skin-calista .cl-pc-hint {
  font-size: 7.5px;
  letter-spacing: .18em;
  color: var(--cl-ink-3);
}
/* 暗色：贝母收进夜色，只剩一点冷虹彩；银字提亮一档 */
.mp-skin-calista[data-theme="night"] .cl-pc-front {
  color: #d6dae0;
  background-color: #232129;
  background-image:
    conic-gradient(from 204deg at 26% 14%,
      rgba(58, 72, 84, .34) 0deg,
      rgba(72, 58, 72, .28) 58deg,
      rgba(74, 70, 54, .26) 120deg,
      rgba(54, 62, 80, .32) 184deg,
      rgba(68, 56, 76, .26) 246deg,
      rgba(52, 70, 70, .28) 308deg,
      rgba(58, 72, 84, .34) 360deg),
    repeating-radial-gradient(circle at 116% 122%,
      rgba(228, 232, 236, .05) 0 2px,
      rgba(10, 8, 12, .12) 2px 6px),
    linear-gradient(152deg, #2b2931 0%, #232129 44%, #2c2832 72%, #201e25 100%);
  box-shadow:
    inset 0 0 0 1px rgba(226, 230, 235, .13),
    inset 0 1px 0 rgba(244, 246, 248, .16),
    0 14px 30px -20px rgba(8, 6, 10, .72);
}
.mp-skin-calista[data-theme="night"] .cl-pc-front::before {
  background:
    radial-gradient(118% 88% at 16% 4%, rgba(226, 232, 238, .13), transparent 58%),
    radial-gradient(92% 82% at 86% 96%, rgba(8, 6, 12, .38), transparent 62%);
}
.mp-skin-calista[data-theme="night"] .cl-pc-front::after {
  background: linear-gradient(104deg,
    transparent 32%, rgba(232, 238, 244, .16) 45%, transparent 58%);
  opacity: .7;
}
.mp-skin-calista[data-theme="night"] .cl-pc-en-main {
  color: #dfe4e9;
  background-image: linear-gradient(98deg,
    #8d959d 0%, #d6dce1 18%, #f6f9fa 34%, #98a1a9 50%,
    #e9eef1 66%, #b3bcc3 82%, #8a929a 100%);
  -webkit-text-fill-color: transparent;
  filter:
    drop-shadow(0 1px 0 rgba(10, 8, 12, .82))
    drop-shadow(0 -0.6px 0 rgba(236, 240, 244, .28));
}
  text-shadow:
    0 1px 0 rgba(250, 247, 246, .18),
    0 -1px 0 rgba(8, 6, 10, .60);
}
.mp-skin-calista[data-theme="night"] .cl-pc-en-sub,
.mp-skin-calista[data-theme="night"] .cl-pc-kicker,
.mp-skin-calista[data-theme="night"] .cl-pc-foot { color: #c8ced5; }
.mp-skin-calista[data-theme="night"] .cl-pc-tap { color: #e2e6ea; }
.mp-skin-calista[data-theme="night"] .cl-pc-stamp { background: #3c4147; }
.mp-skin-calista[data-theme="night"] .cl-pc-postmark { color: rgba(206, 211, 217, .62); border-color: rgba(206, 211, 217, .30); }

@media (prefers-reduced-motion: reduce) {
  .mp-skin-calista .cl-pc-inner,
  .mp-skin-calista .cl-body,
  .mp-skin-calista .cl-fold,
  .mp-skin-calista .cl-fold::after,
  .mp-skin-calista .cl-chev,
  .mp-skin-calista .cl-ring .cl-ring-arc { transition: none; }
  .mp-skin-calista .cl-ch { animation: none; opacity: 1; filter: none; }
  .mp-skin-calista.is-open .cl-sheet > *,
  .mp-skin-calista.is-open.is-tapped .cl-sheet,
  .mp-skin-calista.is-open.is-tapped .cl-sheet::after,
  .mp-skin-calista.is-open.is-tapped .cl-orb,
  .mp-skin-calista.is-tapped .cl-tap-ripple { animation: none; }
  .mp-skin-calista .cl-tap-ripple,
  .mp-skin-calista .cl-sheet::after { opacity: 0; }
}
`;

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
        <div class="tkt-stub-serial tkt-hook-stub-id">№000</div>

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
      : (id === 'dibao') ? SKIN_CSS_DIBAO
      : (id === 'calista') ? SKIN_CSS_CALISTA
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
          '<div style="font-size:16px;filter:drop-shadow(0 1px 2px rgba(18, 20, 26, 0.1));">' + emoji + '</div>' +
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
     数据全部来自脚本自己的 stat_data，不依赖任何外部扩展。
     文案按《预言家日报》的腔调写：官方口吻 + 具体细节 + 不表态的结尾。 */

  /* 社徽：带翼盾牌，报头中间与折叠条共用 */
  const PROPHET_EMBLEM =
    '<svg viewBox="0 0 60 40" aria-hidden="true" focusable="false">' +
      '<path d="M26 15C20 9 12 6 3 9c6 1 9 4 11 8-5-1-10 1-12 5 6-1 10 1 14 4" ' +
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M34 15c6-6 14-9 23-6-6 1-9 4-11 8 5-1 10 1 12 5-6-1-10 1-14 4" ' +
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M30 6l11 4v10c0 7.5-6 12-11 14-5-2-11-6.5-11-14V10z" ' +
        'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>' +
      '<path d="M30 13.5l1.7 4.5h4.6l-3.8 3 1.4 4.6L30 22.8l-3.9 2.8 1.4-4.6-3.8-3h4.6z" fill="currentColor"/>' +
    '</svg>';

  /* 十一档：head 上头条（短），deck 作引题，line 进首段，desk 收尾 */
  const PROPHET_STAGES = {
    '-5': {
      name: '势不两立',
      head: '与访客彻底决裂',
      kicker: '社会新闻',
      deck: '任何一次同框，都被目击者形容为「两支魔杖同时举起」',
      line: '本报记者多方求证，得到的答复出奇一致：两人之间已无任何往来。',
      desk: '分析人士指出，此类僵局往往比表面看起来更难化解。'
    },
    '-4': {
      name: '不共戴天',
      head: '公开场合拒绝同席',
      kicker: '社会新闻',
      deck: '本报记者多次尝试求证，均被其本人以沉默回绝',
      line: '据在场人士描述，只要对方出现，Ta便起身离席，连寒暄也一并省去。',
      desk: '沉默有时比咒语更有分量。'
    },
    '-3': {
      name: '仇视敌对',
      head: '对来访者报以冷眼',
      kicker: '社会新闻',
      deck: '目击者称，Ta对他每一次出现都只报以冷眼，未置一词',
      line: '据本报了解，双方的接触已降至最低限度，谈话多由第三人转达。',
      desk: '本报曾试图就此事向双方求证，截至发稿仍未获回应。'
    },
    '-2': {
      name: '明确敌意',
      head: '与某人保持距离',
      kicker: '本市人事',
      deck: '知情人士称，两人目前连招呼都不打，气氛颇为僵硬',
      line: '接近Ta的人士透露，Ta对这段关系的态度相当明确：保持距离。',
      desk: '关系一旦开始计量距离，往往已无回头之路。'
    },
    '-1': {
      name: '轻微反感',
      head: '对访客仍存戒心',
      kicker: '本市人事',
      deck: '接近Ta的人士表示，Ta尚未放下防备，言谈间多有保留',
      line: '据观察，Ta在回应时惯于先停顿片刻，仿佛在心里过一遍措辞。',
      desk: '防备不是拒绝，只是还没决定要不要打开门。'
    },
    '0': {
      name: '拒绝认识',
      head: '尚未进入本报视野',
      kicker: '本市人事',
      deck: '双方目前尚无正式往来，本报将持续关注后续进展',
      line: '按现有记录，两人之间还没有值得写进报纸的交集。',
      desk: '本报提醒读者：一切尚未开始的故事，都还有很长的余地。'
    },
    '1': {
      name: '愿意认识',
      head: '一段新关系悄然成形',
      kicker: '本市人事',
      deck: '有邻居称，近来常见两人同行，虽未言明，气氛已不似从前',
      line: '据邻里反映，两人碰面时的停顿比从前短了些，这被视为某种信号。',
      desk: '本报将持续关注这段关系的下一步走向。'
    },
    '2': {
      name: '犹豫观望',
      head: '态度出现微妙松动',
      kicker: '社交专栏',
      deck: '知情人士称Ta仍在观望，尚未决定要不要再靠近一步',
      line: 'Ta的态度被认为出现了松动，但幅度小到只有熟人察觉得出来。',
      desk: '观望本身，也是一种已经作出了一半的决定。'
    },
    '3': {
      name: '愿意尝试',
      head: '被目击与某人同行',
      kicker: '社交专栏',
      deck: '两人关系正处于试探阶段，知情者称Ta「嘴上不说，脚步倒是没停」',
      line: '本报记者注意到，Ta近来出现在公共场合的频率明显上升，且鲜少独行。',
      desk: '试探阶段的每一步，都算数。'
    },
    '4': {
      name: '认真经营',
      head: '关系升温引发关注',
      kicker: '社交专栏',
      deck: '身边人已把这段关系视作「认真」在处理，不再是随口的玩笑',
      line: '据最亲近的几位人士透露，这段关系已被双方当作正经事对待。',
      desk: '从「试试看」到「认真」，中间隔着的往往只是一句话。'
    },
    '5': {
      name: '渴望永恒',
      head: '已对未来作出暗示',
      kicker: '社交专栏',
      deck: '据最亲近的人透露，Ta近日多次提起「很久以后」，语气笃定',
      line: '本报获悉，Ta在私下谈话中数次提到「很久以后」，措辞平静却不含糊。',
      desk: '在巫师界，敢谈「很久以后」的人，通常已经想清楚了。'
    }
  };

  /* 预言家日报：纸色日夜，跟 Calista 一样存一份偏好 */
  const PROPHET_THEME_KEY = 'moon_phase_message_skin_prophet_theme_v1';

  function getProphetTheme() {
    let t = '';
    try { t = getStorage().getItem(PROPHET_THEME_KEY) || ''; } catch (e) {}
    if (t === 'day' || t === 'night') return t;
    try {
      if (mainWin.matchMedia && mainWin.matchMedia('(prefers-color-scheme: dark)').matches) return 'night';
    } catch (e) {}
    return 'day';
  }

  function setProphetTheme(next) {
    const t = next === 'night' ? 'night' : 'day';
    try { getStorage().setItem(PROPHET_THEME_KEY, t); } catch (e) {}
    return t;
  }

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

  /* 报头竖栏要整条日期，标题行不换行 */
  function prophetLongDate(text) {
    const s = String(text == null ? '' : text).replace(/[·•]/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  /* 魔法气象司的口吻：按关键词给一句，别把天气照抄一遍 */
  function prophetWeatherLine(weather) {
    const w = String(weather == null ? '' : weather);
    if (/雨/.test(w)) return '气象司提醒：今日有雨，飞行课移入室内，坩埚请加盖。';
    if (/雪|霜|冰/.test(w)) return '高地上空落雪，禁林边缘已结薄冰，出行宜缓。';
    if (/雾|霾/.test(w)) return '雾气中检出微量魔法残留，建议随身携带照明咒。';
    if (/雷|暴/.test(w)) return '气象司发布预警：本日雷暴，请勿在塔楼顶端施展咒语。';
    if (/风/.test(w)) return '高地阵风偏强，请妥善固定扫帚与坩埚。';
    if (/晴/.test(w)) return '天光清朗，适宜户外活动与扫帚试飞。';
    if (/阴|云/.test(w)) return '云层低垂，猫头鹰邮路可能略有延误。';
    return '气象司：本日天象平稳，未观测到异常魔法扰动。';
  }

  /* 道具报头下那排分类小广告，其中一格黑底反白 */
  const PROPHET_ADS = [
    { text: '悬赏 1000 加隆 · 在逃', invert: true },
    { text: '光轮系列 · 本月七折', invert: false },
    { text: '猫头鹰饲料 · 每日鲜制', invert: false }
  ];

  function prophetNumTag(msgId) {
    const n = Math.abs(Math.round(((Number(msgId) || 0) * 71 + 1337) % 9000)) + 1000;
    return String(n);
  }

  function prophetArticleHtml(leadName, c, world, others, msgId) {
    const stage = prophetStageOf(c && c.阶段值);
    const stageVal = prophetNum(c && c.阶段值);
    const slot = prophetSlot(world.时间);
    const place = prophetText(world.地点, '');
    const weather = prophetText(world.天气, '');
    const temp = prophetText(world.温度, '');
    const timeText = prophetText(world.时间, '');
    const shortTime = prophetShortTime(timeText);
    const longDate = prophetLongDate(timeText);

    /* 栏目标签：负面用印泥红，其余用墨黑 */
    const kickerCls = 'mpp-kicker' + (stageVal <= -2 ? ' is-seal' : '');

    /* 引题：时段 + 地点 + 阶段钩子 */
    const deckParts = [];
    if (slot) deckParts.push(slot + '时分');
    if (place) deckParts.push(place);
    deckParts.push(stage.deck);
    const deckText = deckParts.join('｜') + '。';

    /* 首段：时间地点天气 + 事件 */
    const ambient = [];
    if (weather) ambient.push('当时' + weather);
    if (temp) ambient.push('气温' + temp);
    const whereText = place ? ('现身' + place) : '的行踪';
    const leadText = '据本报了解，' + (shortTime ? shortTime + '，' : '') + leadName + whereText + '，' +
      (ambient.length ? ambient.join('、') + '。' : '') + stage.line;

    /* 次段：数值与神态，写具体，别只报数字 */
    const bodyParts = [];
    bodyParts.push('本报记者注意到，其身体状况为「' + prophetNum(c && c.肉体值) + '」');
    const emo = prophetText(c && c.情绪, '');
    if (emo) bodyParts.push('神情「' + emo + '」');
    bodyParts.push('相关情况仍在核实，魔法部暂未发表正式声明');
    const bodyText = bodyParts.join('，') + '。';

    const voice = prophetText(c && c.心声, '……');
    const sign = prophetText(c && c.签名, leadName);
    const seal = prophetText(c && c.英文名, '').slice(0, 1).toUpperCase();

    const page = ('000' + String((Number(msgId) || 0) + 1)).slice(-4);
    const lotto = prophetNumTag(msgId);

    /* 左右竖栏：左侧日期与地点，右侧天气与版次 */
    const railL = [longDate || '今日', place].filter(Boolean).join('　').replace(/\s+/g, ' ');
    const railR = [weather ? weather + (temp ? ' ' + temp : '') : (temp || '天象未记'), 'VOL.CXLI'].filter(Boolean).join('　');

    const pTheme = getProphetTheme();
    let html = '<article class="mpp-paper">' +
      '<button type="button" class="mpp-theme" data-mpp-theme="1" aria-label="切换纸色">' +
        (pTheme === 'night' ? '白昼' : '夜间') +
      '</button>' +
      '<div class="mpp-topline">' +
        '<span>VOL. CXLI · No. <em>' + page + '</em></span>' +
        '<span>伦敦 · 对角巷</span>' +
        '<span>价格 七便士</span>' +
      '</div>' +
      '<header class="mpp-mast">' +
        '<div class="mpp-mast-en">' +
          '<span class="mpp-mast-word">Daily</span>' +
          '<span class="mpp-emblem">' + PROPHET_EMBLEM + '</span> ' +
          '<span class="mpp-mast-word">Prophet</span>' +
        '</div>' +
      '</header>' +
      '<div class="mpp-mast-sub">' +
        '<i></i><span class="mpp-mast-cn">预言家日报</span>' +
        '<span>The Wizarding World&rsquo;s Only Daily</span><i></i>' +
      '</div>' +
      '<div class="mpp-adbar">' +
        PROPHET_ADS.map(function(ad) {
          return '<span' + (ad.invert ? ' class="is-invert"' : '') + '>' + skinEsc(ad.text) + '</span>';
        }).join('') +
      '</div>' +
      '<div class="mpp-frame">' +
        '<aside class="mpp-rail mpp-rail-l" aria-hidden="true">' + skinEsc(railL) + '</aside>' +
        '<div class="mpp-core">' +
          '<span class="mpp-stamp" aria-hidden="true">号外</span>' +
          '<span class="' + kickerCls + '">' + skinEsc(stage.kicker) + '</span>' +
          '<h2 class="mpp-headline">' +
            '<span class="mpp-hl-a">' + skinEsc(leadName) + '</span>' +
            '<span class="mpp-hl-b">' + skinEsc(stage.head) + '</span>' +
          '</h2>' +
          '<div class="mpp-deck">' + skinEsc(deckText) + '</div>' +
          '<div class="mpp-byline">本报驻霍格沃茨记者 · 综合报道</div>' +
          '<div class="mpp-copy">' +
            '<figure class="mpp-photo-frame">' +
              '<div class="mpp-photo is-animated">' +
                '<div class="mpp-silhouette"><i></i><b></b><em>' + skinEsc(seal || 'M') + '</em></div>' +
              '</div>' +
              '<figcaption class="mpp-caption">资料照片 · ' +
                (place ? '摄于' + skinEsc(place) : '摄于霍格沃茨') +
                '　｜　本期人物：' + skinEsc(leadName) + '</figcaption>' +
            '</figure>' +
            '<p class="is-lead">' + skinEsc(leadText) + '</p>' +
            '<p>' + skinEsc(bodyText) + '</p>' +
            '<p>' + skinEsc(stage.desk) + '</p>' +
          '</div>' +
          '<div class="mpp-strip">' +
            '<div class="mpp-box">' +
              '<div class="mpp-box-head"><span>魔法天气</span><b>' + skinEsc(weather || '未见记载') + '</b></div>' +
              '<div class="mpp-box-body">' + skinEsc(prophetWeatherLine(weather)) +
                (temp ? ' <strong>' + skinEsc(temp) + '</strong>' : '') + '</div>' +
            '</div>' +
            '<div class="mpp-box">' +
              '<div class="mpp-box-head"><span>金加隆开奖</span><b>第 ' + page + ' 期</b></div>' +
              '<div class="mpp-box-body"><span class="mpp-lotto">' + lotto + '</span><br>中奖者请携魔杖至对角巷兑付</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<aside class="mpp-rail mpp-rail-r" aria-hidden="true">' + skinEsc(railR) + '</aside>' +
      '</div>' +
      '<div class="mpp-dossier">' +
        '<div class="mpp-dossier-head">人物档案<span>本报资料室</span></div>' +
        '<div class="mpp-stats">' +
          '<div class="mpp-stat"><b>好感度</b><span class="mpp-stat-num">' + prophetNum(c && c.好感度) + '</span></div>' +
          '<div class="mpp-stat"><b>身体状况</b><span class="mpp-stat-num">' + prophetNum(c && c.肉体值) + '</span></div>' +
          '<div class="mpp-stat"><b>当前阶段</b><span>' + skinEsc(stage.name) + '</span></div>' +
          '<div class="mpp-stat"><b>暗涌</b><span class="mpp-stat-num">' + prophetNum(c && c.嫉妒值) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="mpp-quote">' +
        '<div class="mpp-quote-title">未公开的心声</div>「' + skinEsc(voice) + '」' +
        '<div class="mpp-sign">—— ' + skinEsc(sign) + '</div>' +
      '</div>';

    if (others && others.length) {
      html += '<div class="mpp-briefs"><div class="mpp-briefs-head">本市简讯</div>' +
        '<div class="mpp-briefs-grid">' +
        others.map(function(item) {
          return '<div class="mpp-brief"><span>' + skinEsc(item.name) + '　' + skinEsc(item.stage) +
            '</span><span>好感 ' + item.affection + '</span></div>';
        }).join('') +
        '</div></div>';
    }

    html += '<div class="mpp-foot">' +
      '<span>未经许可，禁止复制本报内容</span>' +
      '<span>' + skinEsc(slot ? slot + '版' : '今日版') + ' · 猫头鹰邮递 · 每日发行</span>' +
      '</div></article>';

    return html;
  }

  function renderProphetSkin(scope, statData, msgId, keepOpen) {
    if (!scope) return false;

    scope.setAttribute('data-theme', getProphetTheme());

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
      '<span class="mpp-fold-emblem" aria-hidden="true">' + PROPHET_EMBLEM + '</span>' +
      '<span class="mpp-fold-title">预言家日报</span>' +
      '<span class="mpp-fold-hint"><span class="mpp-fold-closed">展开今日头版</span><span class="mpp-fold-open">收起</span></span>' +
      '</button>';

    if (!names.length) {
      scope.classList.remove('is-open');
      scope.innerHTML = '<div class="mpp-wrap">' + fold +
        '<div class="mpp-body" hidden><div class="mpp-body-clip"><article class="mpp-paper"><div class="mpp-empty">' +
        '本报今日暂无人物档案<br><small>先点「开局适配」建档，头版才有内容可登</small>' +
        '</div></article></div></div></div>';
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
      '<div class="mpp-body"' + (keepOpen ? '' : ' hidden') + '>' +
      '<div class="mpp-body-clip">' + article + '</div></div></div>';
    return true;
  }

  /* ── 朱丝栏邸报：手写皮肤（暗调抄本，护眼四层）────────── */
  /* ── 朱丝栏邸报：把状态数据排成一页中式抄本 ───────────────
     数据全部来自脚本自己的 stat_data，不依赖任何外部扩展。
     文案按清代京报的公文腔写：兹闻 / 据报 / 照录原委，未加评议。
     头条由阶段值决定，不随机抽取。 */

  /* 版心鱼尾：题签与版心共用一枚矢量徽记 */
  const DIBAO_FISH =
    '<svg viewBox="0 0 40 24" aria-hidden="true" focusable="false">' +
      '<path d="M2 4h36M2 20h36" fill="none" stroke="currentColor" stroke-width="1" opacity=".55"/>' +
      '<path d="M20 4l9 8-9 8-9-8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M20 7.5v9M16.5 12h7" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' +
    '</svg>';

  /* 十一档：head 上竖排头条，deck 作引题，line 进宫门钞，desk 是记者按语 */
  const DIBAO_STAGES = {
    '-5': {
      name: '势不两立',
      head: '与访客彻底决裂',
      kicker: '宫门钞',
      deck: '闻两人已断绝往来，凡有同席，皆不终席而去',
      line: '兹闻双方往来已绝，凡遇同席，多由第三人传语，未尝面洽。',
      desk: '照录原委，未加评议。'
    },
    '-4': {
      name: '不共戴天',
      head: '公开场合拒不同席',
      kicker: '宫门钞',
      deck: '本报屡次遣人问讯，俱以默然见却',
      line: '据报，凡其人至，辄起座引避，寒暄亦省。',
      desk: '事出有因，姑存其说，以俟后闻。'
    },
    '-3': {
      name: '仇视敌对',
      head: '对来访者报以冷眼',
      kicker: '宫门钞',
      deck: '目击者称，每值其人至，未尝措一词',
      line: '兹闻两人交接已减至最寡，言语多由旁人转达。',
      desk: '原委未明，不敢臆断。'
    },
    '-2': {
      name: '明确敌意',
      head: '与某人保持距离',
      kicker: '本市人事',
      deck: '识者云：相见不通款曲，气色颇僵',
      line: '据报，其于这段往来持论甚明，曰「宜远」。',
      desk: '此后有无转圜，容再探录。'
    },
    '-1': {
      name: '轻微反感',
      head: '对访客仍存戒心',
      kicker: '本市人事',
      deck: '近侍言其尚未弛备，应对多所保留',
      line: '兹闻每有问对，必先止息片刻，似斟酌其辞而后发。',
      desk: '存而不论，俟其自明。'
    },
    '0': {
      name: '拒绝认识',
      head: '尚未入本报纪载',
      kicker: '本市人事',
      deck: '查双方尚无正式往还，本报当续观其后',
      line: '按现存簿录，两人之间犹无可登之交集。',
      desk: '凡未始者，皆有余地，谨识于此。'
    },
    '1': {
      name: '愿意认识',
      head: '一段新交悄然成形',
      kicker: '本市人事',
      deck: '邻右言：近颇见偕行，虽未明言，气色已异于前',
      line: '兹闻两人相见时停顿较昔为短，识者以为微兆。',
      desk: '其后如何，当续登报端。'
    },
    '2': {
      name: '犹豫观望',
      head: '态度微有松动',
      kicker: '社交纪事',
      deck: '知者云其尚在观望，未决再进与否',
      line: '据报，意向稍转，然其度甚微，惟熟识者能察。',
      desk: '观望亦已半决，姑并存之。'
    },
    '3': {
      name: '愿意尝试',
      head: '被目击与某人同行',
      kicker: '社交纪事',
      deck: '知者称「口虽不言，足未尝止」',
      line: '兹闻其近日履公所较频，且罕独行。',
      desk: '试探之步，亦当在录。'
    },
    '4': {
      name: '认真经营',
      head: '两人过从渐密',
      kicker: '社交纪事',
      deck: '左右称其相见有常，言笑不设防',
      line: '据报，往来已有定时，虽未宣告，众目共睹。',
      desk: '此事不烦饰词，据实以书。'
    },
    '5': {
      name: '渴望永恒',
      head: '闻有久远之约',
      kicker: '宫门钞',
      deck: '近侍言其语及来日，辞气甚定',
      line: '兹闻两人言及久后之事，旁听者谓其意甚坚。',
      desk: '能言久远者，多已思之熟矣，谨录以备考。'
    }
  };

  const DIBAO_HAN = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  function dibaoHanNum(n) {
    let v = Math.abs(Math.round(Number(n) || 0));
    if (v > 99) return String(v);
    if (v < 10) return DIBAO_HAN[v];
    if (v < 20) return '十' + (v % 10 ? DIBAO_HAN[v % 10] : '');
    return DIBAO_HAN[Math.floor(v / 10)] + '十' + (v % 10 ? DIBAO_HAN[v % 10] : '');
  }

  function dibaoDayNum(n) {
    const v = Math.abs(Math.round(Number(n) || 0));
    if (v < 10) return '初' + DIBAO_HAN[v];
    if (v === 10) return '初十';
    if (v < 20) return '十' + DIBAO_HAN[v % 10];
    if (v === 20) return '二十';
    if (v < 30) return '廿' + DIBAO_HAN[v % 10];
    if (v === 30) return '三十';
    return '三十一';
  }

  /* 时辰：从「2024年10月03日 · 星期四 · 19:42」里取小时 */
  function dibaoShichen(text) {
    const m = String(text == null ? '' : text).match(/(\d{1,2}):(\d{2})/);
    if (!m) return '';
    const h = Number(m[1]);
    if (h >= 23 || h < 1) return '子时';
    if (h < 3) return '丑时';
    if (h < 5) return '寅时';
    if (h < 7) return '卯时';
    if (h < 9) return '辰时';
    if (h < 11) return '巳时';
    if (h < 13) return '午时';
    if (h < 15) return '未时';
    if (h < 17) return '申时';
    if (h < 19) return '酉时';
    if (h < 21) return '戌时';
    return '亥时';
  }

  /* 长日期压成「十月初三 酉时」，进正文才不撑行 */
  function dibaoShortDate(text) {
    const s = String(text == null ? '' : text);
    const d = s.match(/(\d{1,2})月(\d{1,2})日/);
    const t = dibaoShichen(s);
    const parts = [];
    if (d) parts.push(dibaoHanNum(d[1]) + '月' + dibaoDayNum(d[2]));
    if (t) parts.push(t);
    return parts.join(' · ');
  }

  function dibaoStageOf(value) {
    let r = Number(value);
    if (isNaN(r)) r = 0;
    r = Math.max(-5, Math.min(5, Math.round(r)));
    return DIBAO_STAGES[String(r)] || DIBAO_STAGES['0'];
  }

  function dibaoNum(value) {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  function dibaoText(value, fallback) {
    const s = String(value == null ? '' : value).trim();
    return s || fallback || '';
  }

  function dibaoPickLead(names, chars) {
    const present = names.filter(function(n) { return chars[n] && chars[n].在场 !== false; });
    const pool = present.length ? present : names;
    for (let i = 0; i < pool.length; i++) {
      const c = chars[pool[i]] || {};
      if (String(c.重要度 || '') === '主要') return pool[i];
    }
    return pool[0] || '';
  }

  /* 钦天监口吻：按关键词给一句，不照抄天气 */
  function dibaoAlmanac(weather) {
    const w = String(weather == null ? '' : weather);
    if (/雨/.test(w)) return '钦天监奏：今夜有雨，宜闭户添灯。';
    if (/雪|霜|冰/.test(w)) return '钦天监奏：高处落霜，行路宜缓。';
    if (/雾|霾/.test(w)) return '钦天监奏：雾气蔽野，宜携灯而行。';
    if (/雷|暴/.test(w)) return '钦天监奏：雷气未平，忌登高阁。';
    if (/风/.test(w)) return '钦天监奏：风自西北，宜掩卷避尘。';
    if (/晴/.test(w)) return '钦天监奏：天光清朗，宜出行访客。';
    if (/阴|云/.test(w)) return '钦天监奏：云低欲暝，邮传恐迟。';
    return '钦天监奏：天象如常，无异常可纪。';
  }

  function dibaoVolTag(msgId) {
    const n = Math.abs(Math.round(Number(msgId) || 0)) + 1;
    return { han: '卷之' + dibaoHanNum(n), num: ('0000' + n).slice(-4) };
  }

  function dibaoLeafHtml(leadName, c, world, others, msgId) {
    const stage = dibaoStageOf(c && c.阶段值);
    const stageVal = dibaoNum(c && c.阶段值);
    const vol = dibaoVolTag(msgId);
    const shichen = dibaoShichen(world.时间);
    const dateShort = dibaoShortDate(world.时间);
    const place = dibaoText(world.地点, '');
    const weather = dibaoText(world.天气, '');
    const temp = dibaoText(world.温度, '');
    const affection = dibaoNum(c && c.好感度);
    const body = dibaoNum(c && c.肉体值);
    const envy = dibaoNum(c && c.嫉妒值);
    const mood = dibaoText(c && c.情绪, '未录');
    const voice = dibaoText(c && c.心声, '……');
    const sign = dibaoText(c && c.签名, leadName);
    const urgent = stageVal <= -2 || stageVal >= 4;

    /* 书耳：缺项就少一句，不拼「时辰 ·  · 」这种残句 */
    const earParts = [];
    if (shichen) earParts.push('<b>' + skinEsc(shichen) + '</b>');
    if (place) earParts.push(skinEsc(place));
    if (weather) earParts.push(skinEsc(weather));
    if (temp) earParts.push(skinEsc(temp));
    const earHtml = earParts.length
      ? '<div class="db-ear">' + earParts.join(' · ') + '</div>'
      : '';

    /* 宫门钞首段：日期时辰 + 地点 + 天气气温作状语，阶段正文自带「兹闻／据报」，
       中间用逗号断开，别把「姓名」和「日期」粘成一句读不通的话 */
    const ambient = [];
    if (weather) ambient.push('其值' + weather);
    if (temp) ambient.push('寒暑' + temp);
    const leadLine =
      (dateShort ? dateShort + '，' : '') +
      (place ? '于' + place + '，' : '') +
      (ambient.length ? ambient.join('、') + '。' : '') +
      stage.line;

    /* 上谕次段：身体状况 / 情绪 / 阶段判语，缺项自动省 */
    const secondBits = [];
    if (c && (c.肉体值 !== undefined && c.肉体值 !== null && c.肉体值 !== '')) {
      secondBits.push('体气录作 ' + body);
    }
    if (mood !== '未录') secondBits.push('神色记为「' + mood + '」');
    secondBits.push('其交游等第，今定作「' + stage.name + '」');
    const secondLine = '又据簿录：' + secondBits.join('；') + '。';

    const cell = function(label, value, unit, seal) {
      return '<div class="db-cell">' +
        '<span class="db-cell-label">' + skinEsc(label) + '</span>' +
        '<span class="db-cell-value' + (seal ? ' is-seal' : '') + '">' + skinEsc(String(value)) +
        (unit ? '<span class="db-cell-unit"> ' + skinEsc(unit) + '</span>' : '') + '</span>' +
        '</div>';
    };

    const briefsHtml = others.length
      ? '<div class="db-briefs"><p class="db-briefs-title">另讯</p>' +
        others.map(function(o) {
          return '<div class="db-brief"><span class="db-brief-name">' + skinEsc(o.name) +
            ' · ' + skinEsc(o.stage) + '</span>' +
            '<span class="db-brief-num">好感 ' + o.affection + '</span></div>';
        }).join('') + '</div>'
      : '';

    return '<article class="db-leaf">' +
      earHtml +
      '<div class="db-banner">' +
        '<span class="db-fish" aria-hidden="true">' + DIBAO_FISH + '</span>' +
        '<span class="db-banner-title">月相邸报</span>' +
        '<span class="db-banner-vol">' + skinEsc(vol.han) + ' · 第 ' + vol.num + ' 号</span>' +
      '</div>' +
      '<div class="db-frame">' +
        '<div class="db-rail">' +
          '<span class="db-rail-label">' + skinEsc(stage.kicker) + '</span>' +
          '<span class="db-headline">' + skinEsc(stage.head) + '</span>' +
        '</div>' +
        '<div class="db-copy">' +
          '<div class="db-headline-plain">' + skinEsc(leadName + stage.head) + '</div>' +
          '<p class="db-deck">' + skinEsc(stage.deck) + '</p>' +
          '<p><span class="db-lead-word">宫门钞</span>　' + skinEsc(leadLine) + '</p>' +
          '<p><span class="db-lead-word">上谕</span>　' + skinEsc(secondLine) + '</p>' +
          '<p class="db-desk">' + skinEsc(dibaoAlmanac(weather)) + ' ' + skinEsc(stage.desk) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="db-dossier">' +
        cell('好感', affection, '', false) +
        cell('体气', body, '', false) +
        cell('等第', (stageVal > 0 ? '+' + stageVal : stageVal), '阶', true) +
        cell('暗涌', envy, '', false) +
      '</div>' +
      '<div class="db-quote">' +
        '<span class="db-quote-mark" aria-hidden="true">「</span>' +
        '<div class="db-quote-body">' + skinEsc(voice) +
          '<span class="db-quote-sign">—— ' + skinEsc(sign) + ' 谨识</span>' +
        '</div>' +
      '</div>' +
      briefsHtml +
      '<div class="db-colophon"><span>' + skinEsc(vol.han) + ' · 第 ' + vol.num + ' 号</span>' +
        '<span>' + skinEsc(shichen || '时刻未录') + ' 谨录 · 照原簿，不增一字</span></div>' +
      '<div class="db-seal' + (urgent ? ' is-urgent' : '') + '" aria-label="' +
        (urgent ? '急件章' : '存录章') + '">' + (urgent ? '急' : '录') + '</div>' +
      '</article>';
  }

  function renderDibaoSkin(scope, statData, msgId, keepOpen) {
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

    const vol = dibaoVolTag(msgId);
    const fold = '<button type="button" class="db-fold" aria-expanded="' + (keepOpen ? 'true' : 'false') + '">' +
      '<span class="db-fold-ico" aria-hidden="true">' + DIBAO_FISH + '</span>' +
      '<span class="db-fold-title">月相邸报</span>' +
      '<span class="db-fold-meta">' + skinEsc(vol.han) + ' · 第 ' + vol.num + ' 号</span>' +
      '<span class="db-fold-hint"><span class="db-fold-closed">展阅</span><span class="db-fold-open">收卷</span></span>' +
      '</button>';

    if (!names.length) {
      scope.classList.remove('is-open');
      scope.innerHTML = '<div class="db-wrap">' + fold +
        '<div class="db-body" hidden><div class="db-body-clip"><article class="db-leaf"><div class="db-empty">' +
        '本卷尚无人物可录<br><small>先点「开局适配」建档，邸报才有内容可登</small>' +
        '</div></article></div></div></div>';
      return false;
    }

    const leadName = dibaoPickLead(names, chars);
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
        stage: dibaoStageOf(c.阶段值).name,
        affection: dibaoNum(c.好感度)
      };
    });

    const leaf = dibaoLeafHtml(leadName, lead, world, others, msgId);

    scope.classList.toggle('is-open', !!keepOpen);
    scope.innerHTML = '<div class="db-wrap">' + fold +
      '<div class="db-body"' + (keepOpen ? '' : ' hidden') + '>' +
      '<div class="db-body-clip">' + leaf + '</div></div></div>';
    return true;
  }

  /* ── Calista：灵动岛式胶囊 → 展开极简卡 ─────────────────────── */
  const CL_THEME_KEY = 'moon_phase_message_skin_calista_theme_v1';

  const CL_STAGES = {
    '-5': '势不两立', '-4': '不共戴天', '-3': '仇视敌对',
    '-2': '明确敌意', '-1': '轻微反感', '0': '拒绝认识',
    '1': '愿意认识', '2': '犹豫观望', '3': '愿意尝试',
    '4': '认真经营', '5': '渴望永恒'
  };

  function getClTheme() {
    let t = '';
    try { t = getStorage().getItem(CL_THEME_KEY) || ''; } catch (e) {}
    if (t === 'day' || t === 'night') return t;
    try {
      if (mainWin.matchMedia && mainWin.matchMedia('(prefers-color-scheme: dark)').matches) return 'night';
    } catch (e) {}
    return 'day';
  }

  function setClTheme(next) {
    const t = next === 'night' ? 'night' : 'day';
    try { getStorage().setItem(CL_THEME_KEY, t); } catch (e) {}
    return t;
  }

  /* 阶段值 → 名字；缺项返回空串，让调用方自己决定省不省 */
  function clStageOf(value) {
    if (value === undefined || value === null || value === '') return { name: '未录', num: 0, known: false };
    let n = Number(value);
    if (!isFinite(n)) return { name: '未录', num: 0, known: false };
    n = Math.max(-5, Math.min(5, Math.round(n)));
    return { name: CL_STAGES[String(n)] || '未录', num: n, known: true };
  }

  /* 数字统一一位小数，tabular-nums 下不会跳 */
  function clNum(value) {
    const n = Number(value);
    if (!isFinite(n)) return '—';
    return n.toFixed(1);
  }

  function clPlain(value, fallback) {
    if (value === undefined || value === null) return fallback;
    const s = String(value).trim();
    return s || fallback;
  }

  /* 心声逐字拆开：每字一个 span，--i 控制 30ms 错峰 */
  function clTypeChars(text, max) {
    const s = String(text || '').slice(0, max || 140);
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s.charAt(i);
      if (ch === '\n') { out += '<br>'; continue; }
      out += '<span class="cl-ch" style="--i:' + i + '">' + skinEsc(ch) + '</span>';
    }
    return out;
  }

  /* 收起态统一模板：一张明信片。
     正反两面同一块贝壳（乳白 + 极淡虹彩 + 同心层理），银只压在正面那行英文上；
     背面才是人物近况，点一下绕 Y 轴翻过去。
     两面都在 DOM 里，翻面只是旋转，不重建，也不打断已读位置。 */
  function clPostcardHtml(o) {
    const flip = !!o.open;
    return '<div class="cl-pc' + (flip ? ' is-flipped' : '') + '" data-cl-flip="1" role="button" tabindex="0"' +
      ' aria-expanded="' + (flip ? 'true' : 'false') + '" aria-label="少女心绪 · 轻点翻到背面">' +
      '<div class="cl-pc-inner">' +
        '<div class="cl-pc-face cl-pc-front">' +
          '<span class="cl-pc-stamp" aria-hidden="true"><i class="cl-pc-stamp-art"></i></span>' +
          '<span class="cl-pc-kicker">POST&nbsp;CARD</span>' +
          '<span class="cl-pc-en">' +
            '<b class="cl-pc-en-main">' + o.enMain + '</b>' +
            '<em class="cl-pc-en-sub">' + o.enSub + '</em>' +
          '</span>' +
          '<span class="cl-pc-postmark" aria-hidden="true"><em>CALM&nbsp;SEA</em><em>MEDITERRANÉE</em></span>' +
          '<span class="cl-pc-lines" aria-hidden="true"><i></i><i></i><i></i></span>' +
          '<span class="cl-pc-foot"><span class="cl-pc-num">No.&nbsp;' + o.num + '</span>' +
            '<span class="cl-pc-tap">TAP&nbsp;TO&nbsp;TURN</span></span>' +
        '</div>' +
        '<div class="cl-pc-face cl-pc-back">' + (o.back || '') + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderCalistaSkin(scope, statData, msgId, keepOpen) {
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

    const theme = getClTheme();
    scope.setAttribute('data-theme', theme);
    scope.classList.toggle('is-open', !!keepOpen);

    const bodyId = 'mp-cl-body-' + (msgId || 0);

    if (!names.length) {
      const emptyBack =
        '<div class="cl-pc-back-head"><span class="cl-pc-back-kicker">REVERSE&nbsp;·&nbsp;人物近况</span></div>' +
        '<div class="cl-empty"><b>还没有人物档案</b>先点面板里的「一键建档案」<br>建好之后这张卡会自己长出数值</div>';
      scope.innerHTML =
        '<div class="cl-wrap">' +
          clPostcardHtml({
            open: !!keepOpen,
            enMain: 'CALISTA',
            enSub: 'A NOTE ON THE TIDE<br>SHELL &amp; SILVER<br>TO BE READ SLOWLY',
            num: String((Number(msgId) || 0) + 1).padStart(2, '0'),
            back: emptyBack
          }) +
        '</div>';
      return false;
    }

    /* 主角：在场且好感最高的那个 */
    let leadName = names[0];
    let best = -Infinity;
    names.forEach(function(n) {
      const c = chars[n] || {};
      const e = Number(c.好感度);
      /* 先看档案里标了「主要」的那个，再比在场，最后比好感 */
      const score = (c.重要度 === '主要' ? 1000 : 0) +
                    (c.在场 === false ? -10000 : 0) +
                    (isFinite(e) ? e : 0);
      if (score > best) { best = score; leadName = n; }
    });

    const lead = chars[leadName] || {};
    const stage = clStageOf(lead.阶段值);
    const affection = clNum(lead.好感度);
    const affectionPct = Math.max(0, Math.min(100, Number(lead.好感度) || 0));

    const others = names.filter(function(n) {
      if (n === leadName) return false;
      const c = chars[n] || {};
      return c.在场 !== false;
    }).slice(0, 4).map(function(n) {
      const c = chars[n] || {};
      return {
        name: n,
        stage: clStageOf(c.阶段值).name,
        affection: clNum(c.好感度)
      };
    });

    const initial = String(clPlain(lead.英文名, '') || leadName).trim().charAt(0).toUpperCase() || 'C';
    const coverEn = String(clPlain(lead.英文名, '') || '').trim();
    const coverTitle = coverEn || leadName;
    const coverCjk = coverEn ? '' : ' is-cjk';
    const inScene = lead.在场 === false ? '不在场' : '在场';
    const subLine = stage.known ? stage.name + ' · ' + inScene : inScene;

    const metaBits = [];
    if (clPlain(world.时间, '')) metaBits.push('<span>' + skinEsc(clPlain(world.时间, '')) + '</span>');
    if (clPlain(world.地点, '')) metaBits.push('<span>' + skinEsc(clPlain(world.地点, '')) + '</span>');
    if (clPlain(world.天气, '')) metaBits.push('<span>' + skinEsc(clPlain(world.天气, '')) + '</span>');
    if (clPlain(world.温度, '')) metaBits.push('<span>' + skinEsc(clPlain(world.温度, '')) + '</span>');

    const voice = clPlain(lead.心声, '……');

    const othersHtml = others.length
      ? '<div class="cl-others">' + others.map(function(o) {
          return '<div class="cl-other"><span><b>' + skinEsc(o.name) + '</b>　' + skinEsc(o.stage) + '</span>' +
            '<i>' + skinEsc(o.affection) + '</i></div>';
        }).join('') + '</div>'
      : '';

    /* 背面：贝母纸上的近况。正面只有英文，信息全在这一面。 */
    const ringR = 19;
    const ringC = 2 * Math.PI * ringR;
    const ringHtml = '<span class="cl-pc-ring" aria-hidden="true">' +
      '<svg width="44" height="44" viewBox="0 0 44 44">' +
        '<circle cx="22" cy="22" r="' + ringR + '" fill="none" stroke="var(--cl-bg-3)" stroke-width="1.6"/>' +
        '<circle class="cl-ring-arc" cx="22" cy="22" r="' + ringR + '" fill="none" stroke="var(--cl-accent)" stroke-width="1.6" ' +
          'stroke-linecap="round" stroke-dasharray="' + ringC.toFixed(1) + '" ' +
          'stroke-dashoffset="' + (ringC - ringC * affectionPct / 100).toFixed(2) + '" ' +
          'transform="rotate(-90 22 22)"/>' +
      '</svg></span>';

    const backHtml =
      '<div class="cl-pc-back-head">' +
        '<span class="cl-pc-back-kicker">REVERSE&nbsp;·&nbsp;人物近况</span>' +
        '<span class="cl-stagechip">' +
          (stage.known ? 'LV.' + stage.num + ' · ' + skinEsc(stage.name) : '关系未录') +
        '</span>' +
      '</div>' +
      '<div class="cl-pc-identity">' +
        '<b class="cl-pc-name">' + skinEsc(leadName) + '</b>' +
        (coverEn ? '<span class="cl-pc-enname">' + skinEsc(coverEn) + '</span>' : '') +
      '</div>' +
      '<div class="cl-pc-hero">' +
        '<span class="cl-pc-big">' + skinEsc(affection) + '<small>/100</small></span>' +
        '<span class="cl-pc-label">好感</span>' +
        '<span class="cl-pc-leader" aria-hidden="true"></span>' +
        ringHtml +
      '</div>' +
      '<div class="cl-row3">' +
        '<div class="cl-tile"><span class="cl-k">亲密</span><span class="cl-v">' + skinEsc(clNum(lead.肉体值)) + '</span></div>' +
        '<div class="cl-tile"><span class="cl-k">关系</span><span class="cl-v">' +
          (stage.known ? (stage.num > 0 ? '+' + stage.num : String(stage.num)) : '—') + '</span></div>' +
        '<div class="cl-tile"><span class="cl-k">醋意</span><span class="cl-v">' + skinEsc(clNum(lead.嫉妒值)) + '</span></div>' +
      '</div>' +
      '<blockquote class="cl-voice"><span class="cl-voice-mark">“</span>' + clTypeChars(voice) + '</blockquote>' +
      (metaBits.length ? '<div class="cl-meta">' + metaBits.join('') + '</div>' : '') +
      othersHtml +
      '<div class="cl-pc-back-foot">' +
        '<span class="cl-pc-hint">轻点翻回正面</span>' +
        '<button type="button" class="cl-theme" data-cl-theme="1" aria-label="切换深浅">' +
          (theme === 'night' ? '浅色' : '深色') +
        '</button>' +
      '</div>';

    scope.innerHTML =
      '<div class="cl-wrap">' +
        clPostcardHtml({
          open: !!keepOpen,
          enMain: skinEsc(String(coverEn || 'CALISTA').toUpperCase()),
          enSub: 'A NOTE ON THE TIDE<br>SHELL · SILVER · SALT<br>TO BE READ SLOWLY',
          num: String((Number(msgId) || 0) + 1).padStart(2, '0'),
          back: backHtml
        }) +
      '</div>';

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
    } else if (skin === 'dibao') {
      holder.innerHTML = '<div class="mp-skin-dibao"><div class="db-wrap"></div></div>';
    } else if (skin === 'calista') {
      holder.innerHTML = '<div class="mp-skin-calista"></div>';
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
      } else if (skin === 'dibao') {
        renderDibaoSkin(holder.querySelector('.mp-skin-dibao'), statData, msgId, !!keepOpen);
      } else if (skin === 'calista') {
        renderCalistaSkin(holder.querySelector('.mp-skin-calista'), statData, msgId, !!keepOpen);
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
        /* 数据变了要重画，但玩家已经展开的报纸／邸报不该自己合上 */
        keepOpen = !!existing.querySelector('.mpp-fold[aria-expanded="true"], .db-fold[aria-expanded="true"], .cl-pc.is-flipped, .cl-fold[aria-expanded="true"]');
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
      ';font:600 10.5px inherit;font-family:inherit;cursor:pointer;white-space:nowrap;';
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
      /* 键盘也能翻面：明信片是 role=button，Tab 到它按 Enter / 空格应该翻过去 */
      mainDoc.addEventListener('keydown', function(e) {
        if (!e || (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar')) return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('button, a, input, textarea, select')) return;
        const card = t.closest('[data-cl-flip]');
        if (!card) return;
        e.preventDefault();
        const next = !card.classList.contains('is-flipped');
        card.classList.toggle('is-flipped', next);
        card.setAttribute('aria-expanded', String(next));
        const holder = card.closest('.mp-skin-calista');
        if (holder) holder.classList.toggle('is-open', next);
      }, true);
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
          const pThemeBtn = target.closest('[data-mpp-theme]');
          if (pThemeBtn) {
            const pScope = prophetHolder.querySelector('.mp-skin-prophet');
            const next = setProphetTheme(getProphetTheme() === 'night' ? 'day' : 'night');
            let pmid = 0;
            try { pmid = Number((prophetHolder.closest('.mes') || {}).getAttribute('mesid')) || 0; } catch (e3) {}
            if (pScope) renderProphetSkin(pScope, getSkinStatData(), pmid, true);
            return;
          }
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

        /* 朱丝栏邸报：展卷 / 收卷（与日报同一套 Grid 0fr→1fr） */
        const dibaoHolder = target.closest('.' + SKIN_HOLDER_CLASS + '-dibao');
        if (dibaoHolder) {
          const fold = target.closest('.db-fold');
          if (!fold) return;
          const body = dibaoHolder.querySelector('.db-body');
          if (!body) return;
          const show = body.hidden;
          body.hidden = !show;
          fold.setAttribute('aria-expanded', String(show));
          const scope = dibaoHolder.querySelector('.mp-skin-dibao');
          if (scope) scope.classList.toggle('is-open', show);
          return;
        }

        /* Calista：展开 / 收起 / 换深浅 */
        const clHolder = target.closest('.' + SKIN_HOLDER_CLASS + '-calista');
        if (clHolder) {
          const scope = clHolder.querySelector('.mp-skin-calista');
          const themeBtn = target.closest('[data-cl-theme]');
          if (themeBtn && scope) {
            const cur = scope.getAttribute('data-theme') === 'night' ? 'night' : 'day';
            setClTheme(cur === 'night' ? 'day' : 'night');
            /* 换深浅只是换纸，不重放「点开」那一套动画 */
            scope.classList.remove('is-tapped');
            let mid = 0;
            try { mid = Number((clHolder.closest('.mes') || {}).getAttribute('mesid')) || 0; } catch (e2) {}
            renderCalistaSkin(scope, getSkinStatData(), mid, true);
            return;
          }
          const card = target.closest('[data-cl-flip]');
          if (!card) return;
          /* 明信片：点一下绕 Y 轴翻过去，再点翻回来。
             翻面是纯 CSS 旋转，不重建 DOM，已读位置与主题都不受影响。 */
          const next = !card.classList.contains('is-flipped');
          card.classList.toggle('is-flipped', next);
          card.setAttribute('aria-expanded', String(next));
          if (scope) scope.classList.toggle('is-open', next);
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

