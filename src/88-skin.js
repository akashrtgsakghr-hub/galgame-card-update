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
    font-size: 10.5px;
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
    font-size: 10.5px;
    letter-spacing: .1em;
    white-space: nowrap;
    border-radius: 1px;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-curator-mark {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: .1em;
    white-space: nowrap;
    color: var(--t-dim);
    text-transform: uppercase;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .tkt-header-seq {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-weight: 600;
    font-size: 10.5px;
    letter-spacing: .1em;
    white-space: nowrap;
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
    font-size: 9.5px;
    font-family: "Noto Serif SC", "Songti SC", serif;
    color: var(--t-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .tkt-title-meta-badge::before {
    content: "■";
    font-size: 9px;
    color: var(--t-accent-red);
  }

  .tkt-title-text {
    font-family: "Byron Mark II", "Special Elite", "Courier Prime", "Courier New", monospace;
    font-size: 40px;
    font-weight: 600;
    letter-spacing: 0.06em;
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
    font-size: 9.5px;
    letter-spacing: 0.1em;
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
    letter-spacing: 0.06em;
    font-weight: 500;
  }
  .tkt-gender-f {
    transform: rotate(-1.2deg);
    letter-spacing: 0.06em;
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
    grid-template-columns: 1.3fr 1fr 1fr;
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
    font-size: 9px;
    color: var(--t-dim);
    letter-spacing: 0.1em;
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
    font-size: 9.5px;
    letter-spacing: 0.06em;
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
    font-size: 9.5px;
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
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
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
    letter-spacing: 0.12em;
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
    font-size: 9.5px;
    font-weight: 600;
    padding: 4px 6px;
    cursor: pointer;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: color 140ms ease, background-color 140ms ease, border-color 140ms ease, opacity 140ms ease;
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
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.1em;
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
    font-size: 9px;
    letter-spacing: 0.1em;
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
    font-size: 9.5px;
    letter-spacing: 0.1em;
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
    font-size: 9px;
    color: var(--t-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
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
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .tkt-pill {
    font-family: "Noto Serif SC", "Songti SC", serif;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 5px;
    border: 1px solid var(--t-border);
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
    font-size: 9.5px;
    font-weight: 600;
    font-family: "Noto Serif SC", "Songti SC", serif;
    letter-spacing: 0.04em;
  }
  .tkt-gauge-lbl .gauge-code { color: var(--t-dim); font-size: 9.5px; }
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
    font-size: 9.5px;
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
    font-size: 9.5px;
    letter-spacing: 0.1em;
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
    font-size: 9px;
    letter-spacing: 0.12em;
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
      font-size: 9px !important;
      padding: 1px 4px !important;
    }
    .tkt-curator-mark {
      font-size: 9px !important;
    }
    .tkt-header-seq {
      font-size: 9.5px !important;
    }
    .tkt-title-meta-badge {
      font-size: 9px !important;
      letter-spacing: 0.05em !important;
    }
    .tkt-title-text {
      font-size: 30px !important; /* 主标题增大，重塑 PC 视觉张力 */
      letter-spacing: 0.1em !important;
      margin: 2px 0 1px !important;
      line-height: 1 !important;
    }
    .tkt-sign-zone {
      margin-top: 2px !important;
      gap: 5px !important;
    }
    .tkt-sign-lbl {
      font-size: 9px !important;
      letter-spacing: 0.06em !important;
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
      font-size: 9px !important;
      margin-bottom: 2px !important;
    }
    .tkt-meta-txt {
      font-size: 10.5px !important;
    }
    .tkt-hook-glance-time {
      font-size: 9.5px !important;
    }
    .tkt-fold {
      font-size: 9px !important;
      letter-spacing: 0.06em !important;
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
      font-size: 9px !important;
      letter-spacing: 0.1em !important;
      padding-bottom: 2px !important;
    }
    .tkt-stub-serial {
      font-size: 12px !important;
      letter-spacing: 0.1em !important;
      margin: 2px 0 !important;
    }
    .tkt-btn {
      font-size: 9px !important;
      padding: 3px 2px !important;
      letter-spacing: 0.04em !important;
    }
    .tkt-stub-actions {
      margin: 4px 0 !important;
      gap: 3px !important;
    }
    .tkt-stamp {
      font-size: 9px !important;
      padding: 2px 3px !important;
      letter-spacing: 0.05em !important;
    }
    .tkt-stub-notice {
      font-size: 9px !important;
      letter-spacing: 0.05em !important;
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
      font-size: 9px !important;
      margin-bottom: 8px !important;
    }
    .tkt-env {
      margin-bottom: 12px !important;
    }
    .tkt-cell {
      padding: 6px 8px !important;
    }
    .tkt-cell-lbl {
      font-size: 9px !important;
      margin-bottom: 3px !important;
    }
    .tkt-cell-val {
      font-size: 10.5px !important;
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
      font-size: 9px !important;
      padding: 1px 3px !important;
    }
    .tkt-gauges {
      gap: 8px !important;
      margin-bottom: 8px !important;
    }
    .tkt-gauge-lbl {
      font-size: 9px !important;
    }
    .tkt-gauge-lbl .gauge-code {
      font-size: 9px !important;
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
      font-size: 9px !important;
    }
    .tkt-quote {
      font-size: 10.5px !important;
    }
    .tkt-bottom {
      padding: 8px 12px 10px 12px !important;
    }
    .tkt-warn {
      font-size: 9px !important;
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
      font-size: 9px !important;
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
}.mp-skin-book .washi-inner-box::before{ content:"+"; position:absolute; top:4px; left:6px; font-size: 9.5px; color:var(--frame-border); font-family:monospace; }.mp-skin-book .washi-inner-box::after{ content:"+"; position:absolute; bottom:4px; right:6px; font-size: 9.5px; color:var(--frame-border); font-family:monospace; }.mp-skin-book .washi-front{ z-index: 2; }.mp-skin-book .season-seal-btn{
  position: absolute; top: 14px; left: 16px; z-index: 5;
  background: transparent; border: none; color: var(--ink-secondary);
  font-size: 9.5px; letter-spacing: 0.1em; cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  font-family: 'Cinzel', serif; transition: color 0.2s ease;
}.mp-skin-book .season-seal-btn:hover{ color: var(--ink-poem-origin); }.mp-skin-book .season-dot{ width:4px; height:4px; border-radius:50%; background-color:var(--ink-poem-origin); display:inline-block; }.mp-skin-book .interlinear-poem-stage{
  position: absolute; top: 50%; transform: translateY(-50%); right: 24px;
  writing-mode: vertical-rl; text-orientation: upright;
  pointer-events: none; z-index: 2;
}.mp-skin-book .couplet-unit{ display: inline-block; vertical-align: top; margin-left: 14px; }.mp-skin-book .couplet-origin{
  display: block; white-space: nowrap;
  font-family: 'Yuji Boku', 'Noto Serif SC', serif;
  font-size: 13.5px; letter-spacing: 0.14em; line-height: 1.35;
  color: var(--ink-poem-origin); opacity: 0.95; margin-left: 5px;
}.mp-skin-book .couplet-trans{
  display: block; white-space: nowrap;
  font-family: 'Noto Serif SC', serif; font-weight: 400;
  font-size: 10.5px; letter-spacing: 0.1em; line-height: 1.35;
  color: var(--ink-poem-trans); opacity: 0.85; padding-top: 2px;
}.mp-skin-book .front-author-lockup{
  position: absolute; left: 18px; bottom: 16px; z-index: 3;
  display: flex; flex-direction: column; gap: 4px;
}.mp-skin-book .char-latin-name{
  font-family: 'Cinzel', serif; font-size: 12.5px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
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
  color: var(--ink-seal-text); font-size: 9.5px;
  font-family: 'Noto Serif SC', serif; line-height: 1;
  border-radius: 1px; transform: translateY(-2px);
}.mp-skin-book .flip-guide-under-sig{
  font-family: 'Cinzel', serif; font-size: 9px;
  letter-spacing: 0.1em; color: var(--ink-secondary);
  opacity: 0.45; margin-top: 3px;
}.mp-skin-book .washi-back{ transform: rotateY(180deg); z-index: 1; }.mp-skin-book .back-header{
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 7px; border-bottom: 1px solid var(--divider);
}.mp-skin-book .back-header-title{
  font-family: 'Cinzel', serif; font-size: 9.5px;
  letter-spacing: 0.1em; color: var(--ink-secondary);
}.mp-skin-book .back-header-stage{ font-size: 10.5px; letter-spacing: 0.1em; color: var(--ink-poem-origin); }.mp-skin-book .back-metrics-grid{
  display: grid; grid-template-columns: repeat(4, 1fr);
  margin: 12px 0; border-bottom: 1px solid var(--divider); padding-bottom: 11px;
}.mp-skin-book .metric-item{ display: flex; flex-direction: column; align-items: center; position: relative; }.mp-skin-book .metric-item:not(:last-child)::after{
  content:""; position:absolute; right:0; top:15%; height:70%; width:1px;
  background-color: var(--divider);
}.mp-skin-book .metric-tag{
  font-family: 'Cinzel', serif; font-size: 9px;
  letter-spacing: 0.1em; color: var(--ink-secondary); margin-bottom: 2px;
}.mp-skin-book .metric-number{
  font-family: 'Cormorant Garamond', monospace;
  font-size: 17px; font-weight: 600; color: var(--ink-primary); line-height: 1.1;
}.mp-skin-book .metric-cn{ font-size: 9.5px; color: var(--ink-secondary); letter-spacing: 0.08em; margin-top: 1px; }.mp-skin-book .back-voice-wrap{ display: flex; gap: 10px; align-items: flex-start; padding-top: 2px; }.mp-skin-book .back-voice-rule{ flex: 0 0 auto; width: 1px; align-self: stretch; margin-top: 2px; background: var(--frame-border); opacity: .55; }.mp-skin-book .back-voice-quote{
  font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
  font-size: 11px; line-height: 1.6; color: var(--ink-primary);
  font-style: italic; letter-spacing: 0.04em;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis; opacity: 0.9;
}.mp-skin-book .empty-card{
  text-align: center; padding: 70px 0;
  color: var(--ink-secondary); font-size: 11px; letter-spacing: 0.1em;
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
  letter-spacing: 0.14em;
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
  font-size: 9px;
  letter-spacing: 0.1em;
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
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mpp-ink-2);
}
.mp-skin-prophet .mpp-mast-cn {
  font: 900 13px/1 "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif;
  letter-spacing: 0.14em;
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
  font-size: 9px;
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
  font-size: 9px;
  letter-spacing: 0.1em;
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
  letter-spacing: 0.14em;
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
  letter-spacing: 0.14em;
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
  font-size: 10.5px;
  line-height: 1.5;
  font-style: italic;
  color: var(--mpp-ink-2);
}

/* 署名行 */
.mp-skin-prophet .mpp-byline {
  font-size: 9px;
  letter-spacing: 0.1em;
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
  font-size: 9px;
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
  letter-spacing: 0.14em;
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
  font-size: 9.5px;
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
  letter-spacing: 0.14em;
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
  letter-spacing: 0.14em;
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
  letter-spacing: 0.14em;
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
  letter-spacing: 0.14em;
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
  letter-spacing: 0.14em;
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
  font-size: 9.5px;
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
  font-size: 9px;
  letter-spacing: 0.1em;
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
  letter-spacing: 0.14em;
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
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  letter-spacing: 0.14em;
}
.mp-skin-dibao .db-fold-meta {
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: .1em;
  color: var(--db-fg-soft);
  opacity: .82;
  white-space: nowrap;
}
.mp-skin-dibao .db-fold-hint {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
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
  letter-spacing: 0.14em;
  line-height: 1.3;
  white-space: nowrap;
}
.mp-skin-dibao .db-banner-vol {
  margin-left: auto;
  font-size: 10.5px;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
  font-weight: var(--db-fw);
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
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
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
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
  font-size: 10.5px;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
  letter-spacing: 0.1em;
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
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
.mp-skin-dibao .db-empty small { font-size: 10.5px; opacity: .78; }

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
  --cl-nacre: url("data:image/webp;base64,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");
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
  --cl-ink-3: #B4A9AD;

  --cl-hair:   rgba(243, 234, 234, .10);
  --cl-hair-2: rgba(243, 234, 234, .19);

  --cl-accent: #DFA9AE;
  --cl-accent-soft: rgba(223, 169, 174, .18);
  --cl-ambient: rgba(6, 5, 4, .82);
  --cl-sheen-hi: rgba(243, 234, 234, .075);
  /* 夜里换成同一批实拍素材压暗后的版本，结构完全不动 */
  --cl-paper-art: url("data:image/webp;base64,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");
  --cl-nacre: url("data:image/webp;base64,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");
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
  letter-spacing: 0.1em;
  color: var(--cl-ink-2);
  white-space: nowrap;
}
.mp-skin-calista .cl-band-note {
  margin-left: auto;
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  font-size: 9.5px;
  line-height: 1.4;
  letter-spacing: 0.1em;
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
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--cl-ink-2);
}
.mp-skin-calista .cl-theme {
  border: 0;
  background: transparent;
  color: var(--cl-ink-3);
  font: inherit;
  font-size: 10.5px;
  letter-spacing: 0.1em;
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
.mp-skin-calista .cl-ring-bead { filter: none; }
.mp-skin-calista .cl-hero-main { display: grid; gap: 2px; min-width: 0; }
.mp-skin-calista .cl-hero .cl-v { font-size: 34px; }
.mp-skin-calista .cl-k {
  display: block;
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
  font-weight: var(--cl-fw-body);
  letter-spacing: .1em;
  color: var(--cl-ink-3);
  margin-left: 4px;
}


.mp-skin-calista .cl-row3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.mp-skin-calista .cl-tile {
  padding: 10px 12px 12px;
  border-radius: 8px;
  background: rgba(250, 247, 246, .30);
  box-shadow: inset 0 0 0 1px var(--cl-hair-2);
}
.mp-skin-calista[data-theme="night"] .cl-tile {
  background: rgba(30, 24, 28, .28);
  box-shadow: inset 0 0 0 1px var(--cl-hair-2);
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
  font-size: 10.5px;
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
  background-color: #ece7e5;
  /* 珠光材质贴图打底：丝缎光带、虹彩、丝缕全在贴图里。
     不再叠 CSS 渐变——一层一层压上去，材质就成了一块塑料膜。 */
  background-image: var(--cl-nacre);
  background-size: cover;
  background-position: center;
  box-shadow:
    inset 0 0 0 1px rgba(112, 119, 127, .16),
    inset 0 1px 0 rgba(250, 247, 246, .95),
    0 14px 30px -20px rgba(42, 38, 44, .50);
}
/* 只补一点左上提亮，让字所在的角亮半档；材质本身的光带不在这里重复 */
.mp-skin-calista .cl-pc-front::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 92% at 14% 2%, rgba(250, 247, 246, .20), transparent 62%),
    radial-gradient(96% 84% at 88% 98%, rgba(150, 146, 162, .07), transparent 66%);
}
/* 光带交给贴图：CSS 再扫一道，两条会打架，深底上就成了荧光 */
.mp-skin-calista .cl-pc-front::after { content: none; }
.mp-skin-calista .cl-pc-front > * { position: relative; z-index: 1; }
.mp-skin-calista .cl-pc-kicker {
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  letter-spacing: 0.14em;
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
  font-size: 10.5px;
  line-height: 1.9;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4a545c;
  text-shadow: 0 1px 0 rgba(250, 247, 246, .80);
}
/* 邮票：一张贝母小方块，贴着齿孔边 */
/* 邮戳：一圈虚线，落在邮票正下方，字必须收在圈里 */
.mp-skin-calista .cl-pc-postmark {
  position: absolute;
  right: 15px;
  top: 13px;
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
  font-size: 9px;
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
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  gap: 8px;
  padding: 12px 16px 12px;
  background-color: var(--cl-bg-1);
  background-image:
    linear-gradient(rgba(250, 245, 243, .26), rgba(242, 234, 233, .32)),
    var(--cl-nacre);
  background-size: cover, cover;
  background-position: center, center;
  box-shadow:
    inset 0 0 0 1px var(--cl-hair),
    0 14px 30px -20px var(--cl-ambient);
}
/* 虹彩已经烘进贴图，这层只做四分之一档的补色，别再糊一层彩虹膜 */
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
  opacity: .26;
}
.mp-skin-calista .cl-pc-back > * { position: relative; z-index: 1; }
.mp-skin-calista[data-theme="night"] .cl-pc-back {
  /* 夜版贴图本身就是深珠光，纸色只留薄薄一层，别把丝光闷死 */
  background-image:
    linear-gradient(rgba(26, 21, 27, .18), rgba(20, 16, 21, .24)),
    var(--cl-nacre);
}
.mp-skin-calista[data-theme="night"] .cl-pc-back::before {
  /* 贴图自带冷虹彩，这层只做极轻的补光 */
  mix-blend-mode: screen;
  opacity: .06;
}
.mp-skin-calista .cl-pc-back-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mp-skin-calista .cl-pc-back-kicker {
  font-size: 9px;
  letter-spacing: 0.1em;
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
  font-size: 9px;
  letter-spacing: 0.1em;
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
  font-size: 10.5px;
  letter-spacing: .04em;
  color: var(--cl-ink-3);
  margin-left: 2px;
}
.mp-skin-calista .cl-pc-label {
  font-size: 9.5px;
  letter-spacing: 0.1em;
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
  font-size: 9.5px;
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
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--cl-ink-3);
}
/* 暗色：贴图本身就是深珠光，遮罩只补一层极薄的匀色，别把丝光闷死 */
.mp-skin-calista[data-theme="night"] .cl-pc-front {
  color: #d6dae0;
  background-color: #211e27;
  background-image:
    linear-gradient(168deg, rgba(24, 20, 26, .12) 0%, rgba(16, 13, 19, .18) 100%),
    var(--cl-nacre);
  background-size: cover, cover;
  background-position: center, center;
  box-shadow:
    inset 0 0 0 1px rgba(226, 230, 235, .13),
    inset 0 1px 0 rgba(244, 246, 248, .12),
    0 14px 30px -20px rgba(8, 6, 10, .72);
}
.mp-skin-calista[data-theme="night"] .cl-pc-front::before {
  background:
    radial-gradient(120% 92% at 14% 2%, rgba(226, 232, 238, .09), transparent 62%),
    radial-gradient(96% 84% at 88% 98%, rgba(6, 4, 9, .26), transparent 66%);
}
/* 白天那道斜向柔光是照在乳白贝母上的，深底上它读起来像一块荧光屏，
   而且正好把新换的黑蝶贝层理抹平——夜里整块撤掉。 */
.mp-skin-calista[data-theme="night"] .cl-pc-front::after { content: none; }
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
.mp-skin-calista[data-theme="night"] .cl-pc-en-sub,
.mp-skin-calista[data-theme="night"] .cl-pc-kicker,
.mp-skin-calista[data-theme="night"] .cl-pc-foot { color: #c8ced5; }
.mp-skin-calista[data-theme="night"] .cl-pc-tap { color: #e2e6ea; }
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
            <span class="tkt-type-tag">ADMIT ONE</span>
            <span class="tkt-curator-mark">ED. 01</span>
          </div>
          <span class="tkt-header-seq tkt-hook-seq">NO. 0000</span>
        </div>

        <div class="tkt-name-stage">
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
            <span>MANIFEST</span>
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
            MODE <svg class="tkt-theme-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.6"/><path d="M12 4.4a7.6 7.6 0 0 0 0 15.2z" fill="currentColor" stroke="none"/></svg>
          </button>
          <button type="button" class="tkt-btn tkt-hook-btn-toggle">
            <span class="tkt-hook-toggle-word">UNFOLD</span>
          </button>
        </div>

        <div class="tkt-stub-footer">
          <div class="tkt-stamp">ADMITTED</div>
        </div>
      </div>
    </div>

    <!-- 展开详情区 -->
    <div class="tkt-body">
      <div class="tkt-sec">
        <span>展馆环境</span>
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
        <span>参展样本</span>
        <span class="tkt-sec-tag">SECT. 02</span>
      </div>
      <div class="tkt-roster tkt-hook-roster"></div>
    </div>

    <!-- 底部版记与条形码 -->
    <div class="tkt-bottom">
      <div class="tkt-warn">
        <strong>THE TWILIGHT LINE</strong><br />
        ARCHIVAL DOSSIER
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

  setText('.tkt-hook-seq', 'NO. ' + String(msgId).padStart(4, '0'));
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
          '<span class="cl-pc-kicker">POST&nbsp;CARD</span>' +
          '<span class="cl-pc-en">' +
            '<b class="cl-pc-en-main">' + o.enMain + '</b>' +
            '<em class="cl-pc-en-sub">' + o.enSub + '</em>' +
          '</span>' +
          '<span class="cl-pc-postmark" aria-hidden="true"><em>CALM&nbsp;SEA</em><em>POSTED</em></span>' +
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
        '<circle cx="22" cy="22" r="' + ringR + '" fill="none" stroke="var(--cl-hair-2)" stroke-width="2"/>' +
        '<circle class="cl-ring-arc" cx="22" cy="22" r="' + ringR + '" fill="none" stroke="var(--cl-ink-2)" stroke-width="2.2" ' +
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
        (coverEn && String(coverEn).trim().toLowerCase() !== String(leadName).trim().toLowerCase()
          ? '<span class="cl-pc-enname">' + skinEsc(coverEn) + '</span>' : '') +
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
      ? '<span class="season-dot"></span> 白昼'
      : '<span class="season-dot"></span> 幽夜';

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
              '<span class="flip-guide-under-sig">EX LIBRIS · TOUCH TO TURN</span>' +
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
              '<span class="back-voice-rule" aria-hidden="true"></span>' +
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

