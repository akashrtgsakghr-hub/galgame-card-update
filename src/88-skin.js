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
  background-color: #f5f2f0;
  /* 实拍贝母打底：层理与虹彩都来自那张照片，不再用 CSS 同心弧去仿（两条弧会互相打架） */
  background-image:
    linear-gradient(160deg, rgba(251, 248, 246, .34) 0%, rgba(246, 243, 242, .24) 46%, rgba(250, 246, 243, .36) 100%),
    var(--cl-nacre);
  background-size: cover, cover;
  background-position: center, center;
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
    linear-gradient(rgba(250, 245, 243, .50), rgba(242, 234, 233, .58)),
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
  opacity: .5;
}
.mp-skin-calista .cl-pc-back > * { position: relative; z-index: 1; }
.mp-skin-calista[data-theme="night"] .cl-pc-back {
  /* 新夜版贝壳本身就深，遮罩只补一点匀色，别再把层理闷死 */
  background-image:
    linear-gradient(rgba(26, 21, 27, .46), rgba(20, 16, 21, .52)),
    var(--cl-nacre);
}
.mp-skin-calista[data-theme="night"] .cl-pc-back::before {
  /* 照片自带蓝紫虹彩，这层只做极轻的补光，免得叠成塑料膜 */
  mix-blend-mode: screen;
  opacity: .08;
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
/* 暗色：换一张黑蝶贝——夜里本就该是另一种贝壳，不是白天那张调暗。
   遮罩只压薄薄一层（够托住银字即可），层理要留得住。 */
.mp-skin-calista[data-theme="night"] .cl-pc-front {
  color: #d6dae0;
  background-color: #1b1a20;
  background-image:
    linear-gradient(160deg, rgba(26, 22, 28, .34) 0%, rgba(20, 17, 22, .40) 100%),
    var(--cl-nacre);
  background-size: cover, cover;
  background-position: center, center;
  box-shadow:
    inset 0 0 0 1px rgba(226, 230, 235, .13),
    inset 0 1px 0 rgba(244, 246, 248, .10),
    0 14px 30px -20px rgba(8, 6, 10, .72);
}
.mp-skin-calista[data-theme="night"] .cl-pc-front::before {
  background:
    radial-gradient(118% 88% at 16% 4%, rgba(226, 232, 238, .07), transparent 58%),
    radial-gradient(92% 82% at 86% 96%, rgba(8, 6, 12, .30), transparent 62%);
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

