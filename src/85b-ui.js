  /* ══════════════════════════════════════════════════════════════════════════
   * 85b-ui.js —— 掌机 UI v2「墨樱 Ink Sakura」
   *
   * 为什么单独一层：85-style.js 里叠了三套历史样式（深蓝原版 → 黑粉像素 →
   * 补丁式 !important），改一处要翻三处。这一层是最终权威层，只做「覆盖」，
   * 不删除老规则，避免拆坏别处还在用的类名。
   *
   * 设计定调（写死在这里，后续改动请先读这段）：
   *   · 风格：像素掌上游戏机 OS。点阵字只用于标题/数字/标签，正文用系统中文字体，
   *     保证 10~12px 仍然读得清 —— 点阵中文在手机上小于 12px 会糊。
   *   · 配色：墨紫黑四层（明度 5/8/11/14%，相邻差 3%）+ 单一强调色樱粉。
   *     不用纯黑、不用纯白、不用黑色描边。
   *   · 层级：靠 1px 发丝线 + 微明度差，不靠粗边框；实体感靠 2px 位移硬阴影。
   *   · 字重：暗底一律 600 封顶（静态字体没有 660 档，写 660 会被舍回 700）。
   *   · 折叠：Grid 0fr → 1fr，不跳变；尊重 prefers-reduced-motion。
   *   · 点击目标：主要操作 ≥ 44px，次要 ≥ 36px 且带足够内边距。
   * ══════════════════════════════════════════════════════════════════════════ */

  /* 折叠块：全站统一用它。老代码里的 <details> 保留兼容，新结构不再新增。 */
  function pocketFold(key, title, desc, body, open) {
    return '<section class="mp-fold" data-fold="' + key + '" data-open="' + (open ? '1' : '0') + '">' +
      '<button type="button" class="mp-fold-head" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="mp-fold-info"><span class="mp-fold-title">' + title + '</span>' +
        '<span class="mp-fold-desc">' + desc + '</span></span>' +
        '<span class="mp-fold-chev" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="mp-fold-body"><div class="mp-fold-clip"><div class="mp-fold-inner">' + body + '</div></div></div>' +
    '</section>';
  }

  function bindPocketFolds(panel) {
    panel.querySelectorAll('.mp-fold-head').forEach(function(head) {
      head.addEventListener('click', function() {
        const fold = head.parentElement;
        if (!fold) return;
        const next = fold.getAttribute('data-open') !== '1';
        fold.setAttribute('data-open', next ? '1' : '0');
        head.setAttribute('aria-expanded', next ? 'true' : 'false');
      });
    });
  }

  /* 一行设置项：左边说明，右边控件。控件由调用方传 HTML，方便复用老按钮 id。 */
  function pocketRow(title, desc, control) {
    return '<div class="mp-set-row"><div class="mp-set-info">' +
      '<div class="mp-set-title">' + title + '</div>' +
      '<div class="mp-set-desc">' + desc + '</div></div>' +
      '<div class="mp-set-ctl">' + control + '</div></div>';
  }

  function injectPocketUI() {
    let el = mainDoc.getElementById('moon-pocket-ui');
    if (!el) {
      el = mainDoc.createElement('style');
      el.id = 'moon-pocket-ui';
      mainDoc.head.appendChild(el);
    }
    if (el.getAttribute('data-ready') === '1') return;
    el.setAttribute('data-ready', '1');
    el.textContent = `
#moon-phase-panel, #moon-modal-mask, .mp-tour-layer {
  --k-ink-0: #0a0509;
  --k-ink-1: #110a15;
  --k-ink-2: #171021;
  --k-ink-3: #1f182a;
  --k-line: rgba(244, 114, 208, .15);
  --k-line-2: rgba(244, 114, 208, .34);
  --k-fg: #f2e7ef;
  --k-fg-2: #c6adc0;
  --k-fg-3: #9c8698;
  --k-accent: #f472d0;
  --k-accent-2: #ffb3e8;
  --k-shadow: rgba(6, 3, 7, .70);
  --k-lcd: #7f8b72;
  --k-lcd-ink: #1c251d;
  --k-lcd-line: rgba(28, 37, 29, .38);
  --k-font-pixel: "MP Fusion Pixel", "Zpix", "Fusion Pixel 10px Monospaced SC", "Courier New", monospace;
  --k-font-body: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif;
  --k-ease: cubic-bezier(.16, 1, .3, 1);
}

/* ── 机身 ─────────────────────────────────────────────────────────────── */
#moon-phase-panel {
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, .014) 0 1px, transparent 1px 3px),
    radial-gradient(120% 70% at 50% -12%, rgba(244, 114, 208, .10), transparent 62%),
    linear-gradient(180deg, var(--k-ink-2) 0%, var(--k-ink-0) 100%) !important;
  border: 1px solid rgba(244, 114, 208, .28) !important;
  border-radius: 16px 16px 30px 16px !important;
  padding: 14px !important;
  max-width: 478px !important;
  color: var(--k-fg) !important;
  font-family: var(--k-font-body) !important;
  font-size: 12px !important;
  line-height: 1.6 !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 190, 235, .10),
    inset 0 -2px 0 rgba(6, 3, 7, .72),
    0 16px 40px var(--k-shadow),
    0 0 0 1px rgba(244, 114, 208, .10) !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(244, 114, 208, .28) transparent;
}
#moon-phase-panel::-webkit-scrollbar { width: 6px; }
#moon-phase-panel::-webkit-scrollbar-thumb { background: rgba(244, 114, 208, .26); border-radius: 3px; }
#moon-phase-panel :is(button, input, select, textarea) { font-family: inherit; }
#moon-phase-panel :is(button, .mp-menu-card, .mp-fold-head, .mp-lcd-quick-tab):focus-visible {
  outline: none !important;
  box-shadow: 0 0 0 1px var(--k-accent), 0 0 0 4px rgba(244, 114, 208, .18) !important;
}

/* ── 头部：品牌两行，长标题收成一行，不再把标题挤成三行 ────────────────── */
#moon-phase-panel .mp-head {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 0 10px !important;
  padding: 0 0 9px !important;
  border-bottom: 1px solid var(--k-line) !important;
}
#moon-phase-panel .mp-update-hitbox {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 9px !important;
  min-height: 40px;
  flex: 1 1 auto !important;
  max-width: none !important;
  padding: 0 !important;
  border: 0 !important;
}
#moon-phase-panel .mp-head .mp-title-orb {
  flex: 0 0 auto !important;
  font-size: 19px !important;
  line-height: 1.1 !important;
  filter: drop-shadow(0 0 6px rgba(244, 114, 208, .55)) !important;
}
#moon-phase-panel .mp-brand { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
#moon-phase-panel .mp-head .mp-title {
  display: block !important;
  flex: 0 0 auto !important;
  width: auto !important;
  font: 600 13px/1.25 var(--k-font-pixel) !important;
  letter-spacing: .6px !important;
  color: var(--k-accent-2) !important;
  text-shadow: none !important;
  text-transform: none !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100%;
}
#moon-phase-panel .mp-head .mp-brand-sub {
  flex: 0 0 auto !important;
  font: 9.5px/1.4 var(--k-font-body);
  color: var(--k-fg-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
#moon-phase-panel .mp-head .mp-badge {
  align-self: flex-start;
  margin-top: 1px;
  padding: 1px 6px !important;
  border-radius: 2px !important;
  border: 1px solid var(--k-line-2) !important;
  background: rgba(244, 114, 208, .10) !important;
  color: var(--k-accent-2) !important;
  font: 600 9px/1.5 var(--k-font-pixel) !important;
  box-shadow: none !important;
}
#moon-phase-panel .mp-head .mp-close {
  width: 40px !important;
  height: 40px !important;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  padding: 0 !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px !important;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font-size: 14px !important;
  line-height: 1 !important;
  box-shadow: 2px 2px 0 var(--k-shadow) !important;
}
#moon-phase-panel .mp-head .mp-close:hover { background: #3a1230 !important; color: var(--k-accent-2) !important; border-color: var(--k-line-2) !important; }

/* ── 引导条：每次打开只说一件「现在该做什么」 ──────────────────────────── */
#moon-phase-panel .mp-guide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  padding: 10px 11px;
  border: 1px solid var(--k-line-2);
  border-left: 3px solid var(--k-accent);
  border-radius: 3px;
  background: linear-gradient(100deg, rgba(244, 114, 208, .13), rgba(244, 114, 208, .02));
}
#moon-phase-panel .mp-guide.is-ok { border-left-color: #7fd8a8; border-color: rgba(127, 216, 168, .28); background: linear-gradient(100deg, rgba(127, 216, 168, .10), rgba(127, 216, 168, .02)); }
#moon-phase-panel .mp-guide-main { min-width: 0; }
#moon-phase-panel .mp-guide-eyebrow {
  font: 600 9px/1 var(--k-font-pixel);
  letter-spacing: 1.3px;
  color: var(--k-accent-2);
  display: block;
  margin-bottom: 4px;
}
#moon-phase-panel .mp-guide.is-ok .mp-guide-eyebrow { color: #9de8bd; }
#moon-phase-panel .mp-guide-title { font: 600 12px/1.45 var(--k-font-body); color: var(--k-fg); }
#moon-phase-panel .mp-guide-desc { font: 10.5px/1.6 var(--k-font-body); color: var(--k-fg-2); margin-top: 2px; }
#moon-phase-panel .mp-guide-link { white-space: normal; text-align: left; min-height: 30px; padding: 7px 0 2px; }
#moon-phase-panel .mp-guide-actions { display: flex; flex-direction: column; gap: 6px; align-items: stretch; }
#moon-phase-panel .mp-guide-cta {
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid var(--k-accent) !important;
  border-radius: 3px;
  background: rgba(244, 114, 208, .16);
  color: var(--k-accent-2);
  font: 400 11px/1.25 var(--k-font-pixel);
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--k-shadow);
}
#moon-phase-panel .mp-guide-cta:hover { background: rgba(244, 114, 208, .26); }
#moon-phase-panel .mp-guide-link {
  border: 0;
  background: transparent;
  color: var(--k-fg-3);
  font: 10px/1.4 var(--k-font-body);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  padding: 2px;
  text-align: center;
}
#moon-phase-panel .mp-guide-link:hover { color: var(--k-accent-2); }

/* ── 模式切换：从两个巨型 tab 收成一条细开关，别抢内容的位置 ───────────── */
#moon-phase-panel .mp-display-mode-switch {
  display: flex !important;
  gap: 4px !important;
  margin: 0 0 10px !important;
  padding: 3px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px;
  background: var(--k-ink-0) !important;
  box-shadow: none !important;
}
#moon-phase-panel .mp-display-mode-switch button {
  flex: 1;
  min-height: 40px !important;
  padding: 8px 8px !important;
  border: 1px solid transparent !important;
  border-radius: 2px;
  background: transparent !important;
  color: var(--k-fg-3) !important;
  font: 600 10.5px/1.2 var(--k-font-pixel) !important;
  letter-spacing: .4px;
  cursor: pointer;
  box-shadow: none !important;
}
#moon-phase-panel .mp-display-mode-switch button.active {
  border-color: var(--k-line-2) !important;
  background: var(--k-ink-3) !important;
  color: var(--k-accent-2) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 190, 235, .07) !important;
}

/* ── 卡片 ─────────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-card {
  background: var(--k-ink-1) !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px !important;
  padding: 11px 12px !important;
  margin-bottom: 9px !important;
  box-shadow: inset 0 1px 0 rgba(255, 190, 235, .04) !important;
}
#moon-phase-panel .mp-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 600 11px/1.4 var(--k-font-body);
  color: var(--k-fg);
  margin-bottom: 7px;
}
#moon-phase-panel .mp-card-title small { font: 9px/1 var(--k-font-pixel); color: var(--k-fg-3); letter-spacing: .8px; margin-left: auto; }

/* ── 液晶屏：外框不再是黑边，屏内线全部换成低对比墨绿发丝线 ─────────────── */
#moon-phase-panel .mp-lcd-card {
  background: linear-gradient(180deg, var(--k-ink-3) 0%, var(--k-ink-1) 100%) !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 6px !important;
  padding: 8px !important;
  margin-bottom: 10px !important;
  box-shadow: inset 0 0 0 1px rgba(6, 3, 7, .45), 2px 2px 0 var(--k-shadow) !important;
}
#moon-phase-panel .mp-console-bezel {
  padding: 1px 4px 7px !important;
  margin-bottom: 7px !important;
  border-bottom: 1px solid var(--k-line) !important;
  color: var(--k-fg-3) !important;
  font: 600 10px/1.3 var(--k-font-pixel) !important;
  letter-spacing: .3px;
}
#moon-phase-panel .mp-power-led { color: var(--k-accent-2) !important; font-size: 8px !important; }
#moon-phase-panel .mp-power-led i { width: 6px !important; height: 6px !important; background: var(--k-accent) !important; box-shadow: 0 0 6px rgba(244, 114, 208, .8) !important; }
#moon-phase-panel .mp-lcd-screen {
  padding: 11px !important;
  background: var(--k-lcd) !important;
  border: 1px solid var(--k-lcd-line) !important;
  border-radius: 3px !important;
  color: var(--k-lcd-ink) !important;
  font: 13px/1.6 var(--k-font-pixel) !important;
  box-shadow: inset 0 0 0 2px rgba(28, 37, 29, .08), inset 0 8px 18px rgba(28, 37, 29, .13) !important;
  background-image: radial-gradient(rgba(28, 37, 29, .05) 1px, transparent 1px) !important;
  background-size: 3px 3px !important;
}
#moon-phase-panel .mp-lcd-screen :is(div, span, b, nav, section, header, small, strong) { border-color: var(--k-lcd-line) !important; }
#moon-phase-panel .mp-lcd-screen :is(button, select) {
  border: 1px solid var(--k-lcd-line) !important;
  background: #75816a !important;
  color: var(--k-lcd-ink) !important;
  border-radius: 0;
  font-family: var(--k-font-pixel) !important;
  box-shadow: none !important;
}
#moon-phase-panel .mp-lcd-screen :is(button, select):active { transform: translate(1px, 1px); }
#moon-phase-panel .mp-lcd-screen-head { padding-bottom: 6px !important; font-size: 11.5px !important; letter-spacing: .4px; }
#moon-phase-panel .mp-lcd-screen-head b { padding: 1px 5px !important; font-size: 9px !important; border: 1px solid var(--k-lcd-line) !important; }
#moon-phase-panel .mp-lcd-quick-tabs { gap: 4px !important; margin: 8px 0 8px !important; padding-bottom: 8px !important; border-bottom: 1px solid var(--k-lcd-line) !important; }
#moon-phase-panel .mp-lcd-quick-tab {
  min-height: 34px;
  padding: 4px 2px !important;
  border: 1px solid var(--k-lcd-line) !important;
  background: rgba(28, 37, 29, .07) !important;
  color: var(--k-lcd-ink) !important;
  font: 600 10.5px/1.2 var(--k-font-pixel) !important;
  letter-spacing: .2px;
  box-shadow: none !important;
}
/* 选中态不再整块反白：一格浅墨 + 一条压重的下边线，跟其它三格同一个面孔 */
#moon-phase-panel .mp-lcd-quick-tab.active {
  background: rgba(28, 37, 29, .18) !important;
  color: var(--k-lcd-ink) !important;
  box-shadow: inset 0 -2px 0 var(--k-lcd-ink) !important;
}
#moon-phase-panel .mp-lcd-world-time { padding: 8px 0 7px !important; font-size: 12.5px !important; font-weight: 600 !important; border-bottom: 1px solid var(--k-lcd-line) !important; }
#moon-phase-panel .mp-lcd-screen-foot { font-size: 10.5px !important; padding-top: 8px !important; border-top: 1px solid var(--k-lcd-line) !important; color: rgba(28, 37, 29, .72) !important; }
#moon-phase-panel .mp-lcd-page-nav { gap: 8px !important; margin-top: 4px !important; padding-top: 8px !important; border-top: 1px solid var(--k-lcd-line) !important; }
#moon-phase-panel .mp-lcd-pages, #moon-phase-panel .mp-lcd-page { min-height: 132px !important; }
#moon-phase-panel .mp-lcd-selection { min-height: 0 !important; }
#moon-phase-panel .mp-lcd-page-nav button { min-height: 40px !important; min-width: 44px !important; color: var(--k-lcd-ink) !important; display: grid !important; place-items: center !important; }
#moon-phase-panel .mp-lcd-page-nav button svg { display: block; }
#moon-phase-panel .mp-lcd-difficulty { gap: 7px !important; padding: 8px 0 7px !important; border-bottom: 1px solid var(--k-lcd-line) !important; }
#moon-phase-panel .mp-lcd-empty { padding: 14px 6px !important; font-size: 12.5px !important; line-height: 1.65 !important; }

/* 屏内「一句话状态」：替代原来那串「锚定:开 AI:主模 卡组:单人…」的缩写墙 */
#moon-phase-panel .mp-lcd-plain {
  padding: 7px 0 3px;
  border-bottom: 1px solid var(--k-lcd-line);
  font-size: 12.5px;
  line-height: 1.65;
}
#moon-phase-panel .mp-lcd-plain b { font-weight: 600; }
#moon-phase-panel .mp-lcd-tip { padding: 7px 0 0; font-size: 11px; line-height: 1.6; color: rgba(28, 37, 29, .74); }

/* ── 主菜单 ───────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-menu-label,
#moon-phase-panel .mp-sub-label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 8px !important;
  font: 600 10.5px/1.2 var(--k-font-pixel) !important;
  letter-spacing: 1.4px !important;
  color: var(--k-fg-3) !important;
  text-shadow: none !important;
}
#moon-phase-panel .mp-menu-label::after,
#moon-phase-panel .mp-sub-label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--k-line), transparent);
}
#moon-phase-panel .mp-menu-grid { display: grid !important; grid-template-columns: 1fr !important; gap: 8px !important; }
#moon-phase-panel .mp-menu-card {
  min-height: 56px !important;
  gap: 12px !important;
  padding: 10px 12px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 8px !important;
  background: linear-gradient(180deg, var(--k-ink-3) 0%, var(--k-ink-1) 100%) !important;
  color: var(--k-fg) !important;
  box-shadow: 2px 2px 0 var(--k-shadow) !important;
  transition: transform 120ms var(--k-ease), border-color 120ms linear, background 120ms linear;
}
#moon-phase-panel .mp-menu-card:hover,
#moon-phase-panel .mp-menu-card:focus-visible {
  border-color: var(--k-line-2) !important;
  background: linear-gradient(180deg, #2a2033 0%, #171021 100%) !important;
  transform: translate(-1px, -1px);
}
#moon-phase-panel .mp-menu-card[data-primary="1"] {
  border-color: var(--k-line-2) !important;
  background: linear-gradient(180deg, #2c1327 0%, #150d1b 100%) !important;
}
/* 图标格子：跟卡片同一块表面 + 一根发丝线，不再往里灌一层粉色。
   图标用次级文字色，不抢主标题；六个图标同尺寸、同描边。 */
#moon-phase-panel .mp-menu-icon {
  width: 32px !important;
  height: 32px !important;
  flex: 0 0 32px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 4px;
  background: var(--k-ink-1) !important;
  color: var(--k-fg-2) !important;
  font-size: 15px !important;
  text-shadow: none !important;
}
#moon-phase-panel .mp-menu-card:hover .mp-menu-icon,
#moon-phase-panel .mp-menu-card:focus-visible .mp-menu-icon { color: var(--k-fg) !important; border-color: var(--k-line-2) !important; }
#moon-phase-panel .mp-lico { display: block; }
#moon-phase-panel .mp-menu-card b {
  font: 600 12px/1.4 var(--k-font-body) !important;
  color: var(--k-fg) !important;
  letter-spacing: 0;
}
#moon-phase-panel .mp-menu-card small {
  font: 10px/1.45 var(--k-font-body) !important;
  color: var(--k-fg-3) !important;
  white-space: normal !important;
  overflow-wrap: anywhere;
}
#moon-phase-panel .mp-menu-card i { font: 15px/1 var(--k-font-pixel) !important; color: var(--k-fg-3) !important; }
#moon-phase-panel .mp-menu-card:hover i { color: var(--k-accent) !important; }

/* 主菜单底部提示：改成一句人话，不再堆 kbd 键帽 */
#moon-phase-panel .mp-menu-controls {
  display: flex !important;
  flex-wrap: wrap;
  gap: 6px 12px !important;
  margin-top: 12px !important;
  padding-top: 12px !important;
  border-top: 1px solid var(--k-line) !important;
  color: var(--k-fg-3) !important;
  font: 9.5px/1.5 var(--k-font-body) !important;
  letter-spacing: 0 !important;
}
#moon-phase-panel .mp-menu-controls kbd {
  padding: 1px 4px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font: 600 8.5px/1.4 var(--k-font-pixel) !important;
  box-shadow: none !important;
}

/* ── 折叠块 ───────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-fold {
  border: 1px solid var(--k-line);
  border-radius: 3px;
  background: var(--k-ink-1);
  margin-bottom: 8px;
  overflow: hidden;
}
#moon-phase-panel .mp-fold[data-open="1"] { border-color: var(--k-line-2); }
#moon-phase-panel .mp-fold-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 46px;
  padding: 9px 11px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
#moon-phase-panel .mp-fold[data-open="1"] .mp-fold-head { border-bottom-color: var(--k-line); background: rgba(244, 114, 208, .04); }
#moon-phase-panel .mp-fold-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
#moon-phase-panel .mp-fold-title { font: 600 11.5px/1.4 var(--k-font-body); color: var(--k-fg); }
#moon-phase-panel .mp-fold-desc { font: 10px/1.5 var(--k-font-body); color: var(--k-fg-3); }
#moon-phase-panel .mp-fold-chev { color: var(--k-accent); font-size: 10px; transition: transform 220ms var(--k-ease); }
#moon-phase-panel .mp-fold[data-open="1"] .mp-fold-chev { transform: rotate(180deg); }
#moon-phase-panel .mp-fold-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 260ms var(--k-ease);
}
#moon-phase-panel .mp-fold[data-open="1"] .mp-fold-body { grid-template-rows: 1fr; }
#moon-phase-panel .mp-fold-clip { min-height: 0; overflow: hidden; }
#moon-phase-panel .mp-fold-inner { padding: 9px 11px 11px; }

/* ── 设置行 ───────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-set-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  padding: 9px 0 !important;
  margin: 0 !important;
  border-top: 1px dashed var(--k-line) !important;
}
#moon-phase-panel .mp-set-row:first-child { border-top: 0 !important; padding-top: 2px !important; }
#moon-phase-panel .mp-set-info { flex: 1 1 auto; min-width: 0; }
#moon-phase-panel .mp-set-title { font: 600 11.5px/1.4 var(--k-font-body); color: var(--k-fg); display: flex; align-items: center; gap: 5px; }
#moon-phase-panel .mp-set-desc { font: 10px/1.55 var(--k-font-body); color: var(--k-fg-3); margin-top: 2px; }
#moon-phase-panel .mp-set-ctl { flex: 0 0 auto; }
/* 设置区里成排的小按钮（换肤、剧本模式、天数…）统一抬到可点高度 */
#moon-phase-panel .mp-set-ctl button,
#moon-phase-panel .mp-set-block button {
  min-height: 40px !important;
  min-width: 44px;
  padding: 7px 11px !important;
}

/* 开关按钮统一：高度够手指点（≥40px），开启态只用一根粉线 + 粉字，不铺大红大绿 */
#moon-phase-panel :is(.mp-antisl, .mp-extra-btn, .mp-cardmode-btn, .mp-fanfic-btn, .mp-safelock-btn, .mp-pacing-btn) {
  min-height: 40px;
  min-width: 46px;
  padding: 7px 12px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px !important;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font: 600 10.5px/1.2 var(--k-font-pixel) !important;
  letter-spacing: .3px;
  box-shadow: 1px 1px 0 var(--k-shadow) !important;
  cursor: pointer;
  white-space: nowrap;
}
#moon-phase-panel :is(.mp-antisl, .mp-extra-btn, .mp-cardmode-btn, .mp-fanfic-btn, .mp-safelock-btn, .mp-pacing-btn):hover {
  border-color: var(--k-line-2) !important;
  color: var(--k-accent-2) !important;
}
#moon-phase-panel :is(.mp-antisl.on, .mp-extra-btn.on, .mp-cardmode-btn.on, .mp-fanfic-btn.on, .mp-pacing-btn.Adi, .mp-pacing-btn.And, .mp-pacing-btn.All) {
  border-color: var(--k-line-2) !important;
  background: rgba(244, 114, 208, .14) !important;
  color: var(--k-accent-2) !important;
}
#moon-phase-panel .mp-safelock-btn.on { border-color: rgba(127, 216, 168, .42) !important; background: rgba(127, 216, 168, .10) !important; color: #a8ebc4 !important; }
#moon-phase-panel .mp-safelock-btn.off { border-color: var(--k-line) !important; background: var(--k-ink-3) !important; color: var(--k-fg-3) !important; }
#moon-phase-panel .mp-antisl.on { border-color: rgba(255, 138, 178, .42) !important; background: rgba(255, 138, 178, .10) !important; color: #ffb0c8 !important; }

/* ── 按钮网格 ─────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 7px !important; margin: 0 !important; }
#moon-phase-panel .mp-btn {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  justify-content: center !important;
  gap: 3px !important;
  min-height: 56px !important;
  padding: 9px 10px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px !important;
  background: linear-gradient(180deg, var(--k-ink-3), var(--k-ink-1)) !important;
  color: var(--k-fg) !important;
  font: 600 11.5px/1.4 var(--k-font-body) !important;
  text-align: left !important;
  box-shadow: 2px 2px 0 var(--k-shadow) !important;
  cursor: pointer;
  transition: transform 110ms var(--k-ease), border-color 110ms linear;
}
#moon-phase-panel .mp-btn:hover { border-color: var(--k-line-2) !important; transform: translate(-1px, -1px); }
#moon-phase-panel .mp-btn:active { transform: translate(1px, 1px); box-shadow: none !important; }
#moon-phase-panel .mp-btn span { display: block; width: 100%; }
#moon-phase-panel .mp-btn small {
  display: block !important;
  font: 9.5px/1.45 var(--k-font-body) !important;
  color: var(--k-fg-3) !important;
  font-weight: 400 !important;
  white-space: normal;
}
#moon-phase-panel .mp-btn-highlight { border-color: var(--k-line-2) !important; background: linear-gradient(180deg, #2b1226, #160d1a) !important; color: var(--k-accent-2) !important; }
#moon-phase-panel .mp-btn-highlight small { color: #d7a8c8 !important; }
#moon-phase-panel .mp-btn-user { border-color: rgba(127, 216, 200, .3) !important; background: linear-gradient(180deg, #0f2421, #0c1517) !important; color: #9fe3d5 !important; }
#moon-phase-panel .mp-btn-user small { color: #86b9ae !important; }

/* 子页切换条 */
#moon-phase-panel .mp-subpage-switch { gap: 4px !important; margin-bottom: 9px !important; }
#moon-phase-panel .mp-subpage-tab {
  min-height: 40px;
  padding: 6px 2px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px;
  background: var(--k-ink-1) !important;
  color: var(--k-fg-3) !important;
  font: 600 9.5px/1.2 var(--k-font-pixel) !important;
  box-shadow: none !important;
  cursor: pointer;
}
#moon-phase-panel .mp-subpage-tab.active { border-color: var(--k-line-2) !important; background: rgba(244, 114, 208, .12) !important; color: var(--k-accent-2) !important; }
#moon-phase-panel .mp-menu-page-head {
  gap: 9px !important;
  padding: 7px 8px !important;
  margin-bottom: 9px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px;
  background: var(--k-ink-1) !important;
  box-shadow: none !important;
}
#moon-phase-panel .mp-menu-back {
  min-height: 36px;
  padding: 6px 9px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font: 600 10px/1.2 var(--k-font-pixel) !important;
  box-shadow: 1px 1px 0 var(--k-shadow) !important;
  cursor: pointer;
}
#moon-phase-panel .mp-menu-page-head small { font: 8.5px/1.3 var(--k-font-pixel) !important; color: var(--k-fg-3) !important; letter-spacing: .8px !important; }
#moon-phase-panel .mp-menu-page-head b { font: 600 12px/1.3 var(--k-font-body) !important; color: var(--k-fg) !important; }
#moon-phase-panel .mp-page-led { width: 6px; height: 6px; background: var(--k-accent); box-shadow: 0 0 6px rgba(244, 114, 208, .7); }

/* ── 难度四档 ─────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-mode-select-card { padding: 10px 11px !important; }
#moon-phase-panel .mp-mode-btn { display: block; width: 100%; cursor: pointer; }
#moon-phase-panel .mp-mode-btn {
  min-height: 56px !important;
  padding: 7px 2px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px !important;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font-family: var(--k-font-body) !important;
  box-shadow: none !important;
  white-space: normal !important;
  cursor: pointer;
}
#moon-phase-panel .mp-mode-btn.active {
  border-color: var(--k-line-2) !important;
  background: rgba(244, 114, 208, .12) !important;
  color: var(--k-accent-2) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 190, 235, .08) !important;
}
#moon-phase-panel .mp-mode-btn div:first-child { font-size: 17px !important; }
#moon-phase-panel .mp-mode-btn div:last-child { font-size: 9.5px !important; opacity: .8; line-height: 1.3; }
#moon-phase-panel .mp-mode-description { font-size: 10.5px !important; line-height: 1.6 !important; color: var(--k-fg-3) !important; }
#moon-phase-panel .mp-mode-description b { color: var(--k-fg) !important; font-size: 11px !important; }

/* ── 掌机按键条：保留实体感，压到一行，放在内容之后 ──────────────────── */
#moon-phase-panel .mp-console-cluster {
  display: grid !important;
  grid-template-columns: auto 1fr auto !important;
  align-items: center !important;
  gap: 10px !important;
  margin: 10px 0 4px !important;
  padding: 9px 11px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px;
  background: var(--k-ink-1) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 190, 235, .03) !important;
}
#moon-phase-panel .mp-dpad { position: relative !important; width: 72px !important; height: 72px !important; flex: 0 0 72px; }
#moon-phase-panel .mp-dpad-btn { background: var(--k-ink-3) !important; border: 1px solid var(--k-line) !important; color: var(--k-fg-2) !important; font-size: 8px !important; box-shadow: none !important; }
#moon-phase-panel .mp-dpad-btn:hover { background: #2c2036 !important; color: var(--k-accent-2) !important; }
#moon-phase-panel .mp-dpad-center { top: 26px; left: 26px; width: 20px; height: 20px; border-radius: 2px; background: var(--k-ink-2) !important; }
#moon-phase-panel .mp-dpad-center::after { top: 6px; left: 6px; width: 7px; height: 7px; background: #3a2c46; }
#moon-phase-panel .mp-dpad-up { top: 0; left: 26px; width: 20px; height: 26px; }
#moon-phase-panel .mp-dpad-down { bottom: 0; left: 26px; width: 20px; height: 26px; }
#moon-phase-panel .mp-dpad-left { left: 0; top: 26px; width: 26px; height: 20px; }
#moon-phase-panel .mp-dpad-right { right: 0; top: 26px; width: 26px; height: 20px; }
#moon-phase-panel .mp-pill-keys { display: flex !important; flex-direction: column; align-items: center; gap: 4px; }
#moon-phase-panel .mp-pill-row { display: flex; gap: 12px; }
#moon-phase-panel .mp-select-key,
#moon-phase-panel .mp-start-key {
  min-width: 60px;
  min-height: 32px;
  padding: 6px 12px;
  border: 1px solid var(--k-line) !important;
  border-radius: 8px;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font: 600 9px/1.2 var(--k-font-pixel) !important;
  letter-spacing: .5px;
  white-space: nowrap;
  transform: rotate(-7deg) !important;
  box-shadow: 1px 1px 0 var(--k-shadow) !important;
  cursor: pointer;
}
#moon-phase-panel .mp-select-key:hover,
#moon-phase-panel .mp-start-key:hover { border-color: var(--k-line-2) !important; color: var(--k-accent-2) !important; }
/* 没填钥匙不是错误，只是「没设」：用虚线和低对比表示，不用黄色警报 */
#moon-phase-panel .mp-start-key.unconfigured { border-style: dashed !important; border-color: rgba(244, 114, 208, .30) !important; color: var(--k-fg-3) !important; }
#moon-phase-panel .mp-pill-labels { display: flex; color: var(--k-fg-3); font: 10px/1.4 var(--k-font-body); }
#moon-phase-panel .mp-pill-labels { gap: 12px !important; }
#moon-phase-panel .mp-pill-labels span { min-width: 58px; text-align: center; }
#moon-phase-panel .mp-action-block { display: flex; align-items: center; gap: 8px; }
#moon-phase-panel .mp-action-cluster { display: flex; gap: 8px; }
#moon-phase-panel .mp-round-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px;
  border-radius: 50% !important;
  border: 1px solid var(--k-line) !important;
  background: var(--k-ink-3) !important;
  color: var(--k-fg-2) !important;
  font: 600 11px/1 var(--k-font-pixel) !important;
  box-shadow: 2px 2px 0 var(--k-shadow) !important;
  cursor: pointer;
}
#moon-phase-panel .mp-btn-a { border-color: var(--k-line-2) !important; color: var(--k-accent-2) !important; }
#moon-phase-panel .mp-round-btn:hover { background: #2c2036 !important; }
#moon-phase-panel .mp-speaker-grill { display: flex; flex-direction: column; gap: 2px; opacity: .4; }
#moon-phase-panel .mp-speaker-grill i { display: block; width: 12px; height: 2px; background: var(--k-fg-3); }

/* ── 状态栏 ───────────────────────────────────────────────────────────── */
#moon-phase-panel .mp-status {
  margin-top: 9px !important;
  padding: 9px 11px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 3px !important;
  background: var(--k-ink-0) !important;
  color: var(--k-fg-2) !important;
  font: 10px/1.65 var(--k-font-pixel) !important;
  max-height: 200px;
}
#moon-phase-panel .mp-status :is(b, strong) { color: var(--k-fg) !important; font-weight: 600 !important; }
#moon-phase-panel .mp-log-subhead { color: var(--k-accent-2) !important; font: 600 10px/1.4 var(--k-font-pixel) !important; margin: 9px 0 4px !important; }

/* ── 输入域：三层底 + 发丝线；聚焦禁描边，改双环 ──────────────────────── */
#moon-phase-panel :is(input, textarea, select),
#moon-modal-mask :is(input, textarea, select) {
  min-height: 36px;
  padding: 7px 9px;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px !important;
  background: var(--k-ink-3) !important;
  color: var(--k-fg) !important;
  font: 11.5px/1.5 var(--k-font-body) !important;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
}
#moon-phase-panel :is(input, textarea, select):focus,
#moon-modal-mask :is(input, textarea, select):focus {
  outline: none !important;
  border-color: rgba(244, 114, 208, .5) !important;
  box-shadow:
    0 0 0 1px rgba(244, 114, 208, .42),
    0 0 0 5px rgba(6, 3, 7, .62),
    inset 0 2px 6px rgba(6, 3, 7, .5) !important;
}

/* ── 弹窗：与面板同一套皮，去掉蓝灰渐变和黄色标题 ────────────────────── */
#moon-modal-mask.mp-pixel-modal {
  background: radial-gradient(circle at 50% 30%, rgba(30, 14, 28, .88) 0%, rgba(8, 4, 10, .94) 100%) !important;
}
#moon-modal-mask.mp-pixel-modal > div {
  position: relative;
  padding: 16px !important;
  border: 1px solid rgba(244, 114, 208, .22) !important;
  border-radius: 4px !important;
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, .012) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, var(--k-ink-3), var(--k-ink-0)) !important;
  color: var(--k-fg) !important;
  font-family: var(--k-font-body) !important;
  box-shadow: inset 0 1px 0 rgba(255, 190, 235, .10), 0 22px 56px rgba(6, 3, 7, .82) !important;
  max-width: 470px !important;
}
#moon-modal-mask.mp-pixel-modal > div > div:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 12px !important;
  padding: 0 0 10px !important;
  border-bottom: 1px solid var(--k-line) !important;
  color: var(--k-accent-2) !important;
  font: 600 12.5px/1.4 var(--k-font-pixel) !important;
  letter-spacing: .5px !important;
  text-align: left !important;
  text-shadow: none !important;
}
#moon-modal-mask.mp-pixel-modal > div > div:nth-child(2) {
  color: var(--k-fg-2) !important;
  font: 11.5px/1.7 var(--k-font-body) !important;
  margin-bottom: 12px !important;
}
#moon-modal-mask.mp-pixel-modal button {
  min-height: 40px;
  padding: 8px 12px !important;
  border: 1px solid var(--k-line) !important;
  border-radius: 2px !important;
  background: var(--k-ink-3) !important;
  color: var(--k-fg) !important;
  font: 600 11px/1.3 var(--k-font-body) !important;
  box-shadow: 2px 2px 0 var(--k-shadow) !important;
  cursor: pointer;
}
#moon-modal-mask.mp-pixel-modal button:hover { border-color: var(--k-line-2) !important; color: var(--k-accent-2) !important; }
#moon-modal-mask.mp-pixel-modal #moon-modal-confirm,
#moon-modal-mask.mp-pixel-modal #moon-step-next {
  border-color: var(--k-accent) !important;
  background: rgba(244, 114, 208, .16) !important;
  color: var(--k-accent-2) !important;
}

/* ── 引导条/说明书里的小按钮 ──────────────────────────────────────────── */
#moon-phase-panel .mp-link-btn {
  min-height: 30px;
  padding: 3px 8px;
  border: 1px solid var(--k-line);
  border-radius: 2px;
  background: transparent;
  color: var(--k-fg-2);
  font: 10px/1.4 var(--k-font-body);
  cursor: pointer;
}
#moon-phase-panel .mp-link-btn:hover { border-color: var(--k-line-2); color: var(--k-accent-2); }

/* ── 聚光灯新手引导 ───────────────────────────────────────────────────── */
.mp-tour-layer {
  position: fixed;
  inset: 0;
  /* 面板遮罩是 2147483650，引导必须压在它上面 */
  z-index: 2147483655;
  pointer-events: none;
}
.mp-tour-spot {
  position: fixed;
  border-radius: 4px;
  box-shadow:
    0 0 0 2px var(--k-accent),
    0 0 0 9999px rgba(6, 3, 7, .78);
  transition: color 160ms var(--k-ease), background-color 160ms var(--k-ease), border-color 160ms var(--k-ease), transform 160ms var(--k-ease);
  pointer-events: none;
}
.mp-tour-card {
  position: fixed;
  left: 12px;
  top: auto;
  bottom: 12px;
  width: min(340px, calc(100vw - 24px));
  box-sizing: border-box;
  max-height: 58vh;
  overflow: auto;
  padding: 13px 13px 12px;
  font-family: var(--k-font-body);
  border: 1px solid var(--k-line-2);
  border-radius: 3px;
  background: linear-gradient(180deg, #221328, #120b17);
  box-shadow: 0 14px 34px rgba(6, 3, 7, .8), inset 0 1px 0 rgba(255, 190, 235, .10);
  pointer-events: auto;
}
.mp-tour-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 600 8.5px/1 var(--k-font-pixel);
  letter-spacing: 1.2px;
  color: var(--k-accent-2);
  margin-bottom: 6px;
}
.mp-tour-dots { display: flex; gap: 3px; margin-left: auto; }
.mp-tour-dots i { width: 5px; height: 5px; border-radius: 50%; background: rgba(244, 114, 208, .22); }
.mp-tour-dots i.on { background: var(--k-accent); }
.mp-tour-title { font: 600 13px/1.4 var(--k-font-body); color: var(--k-fg); margin-bottom: 5px; }
.mp-tour-text { font: 11px/1.7 var(--k-font-body); color: var(--k-fg-2); }
.mp-tour-text b { color: var(--k-accent-2); font-weight: 600; }
.mp-tour-foot { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
.mp-tour-skip {
  border: 0; background: transparent; color: var(--k-fg-3);
  font: 10px/1.4 var(--k-font-body); text-decoration: underline; text-underline-offset: 2px;
  cursor: pointer; padding: 4px 2px;
}
.mp-tour-nav {
  min-height: 36px; padding: 6px 12px;
  border: 1px solid var(--k-line); border-radius: 2px;
  background: var(--k-ink-3); color: var(--k-fg-2);
  font: 600 10.5px/1.2 var(--k-font-pixel);
  box-shadow: 1px 1px 0 var(--k-shadow); cursor: pointer;
}
.mp-tour-nav.primary { border-color: var(--k-accent); background: rgba(244, 114, 208, .16); color: var(--k-accent-2); }
.mp-tour-nav[disabled] { opacity: .4; cursor: default; }

/* ── 答疑 ─────────────────────────────────────────────────────────────── */
#moon-faq-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
#moon-modal-mask .mp-faq-tip {
  padding: 8px 10px; margin-bottom: 10px;
  border-left: 2px solid var(--k-accent);
  background: rgba(244, 114, 208, .07);
  color: var(--k-fg-2); font: 10.5px/1.6 var(--k-font-body);
}
#moon-modal-mask .mp-faq-search {
  width: 100%; box-sizing: border-box; margin-bottom: 10px;
  min-height: 40px; padding: 8px 11px;
  border: 1px solid var(--k-line); border-radius: 2px;
  background: var(--k-ink-0); color: var(--k-fg);
  font: 11.5px/1.4 var(--k-font-body);
  outline: none;
}
#moon-modal-mask .mp-faq-search::placeholder { color: var(--k-fg-3); }
#moon-modal-mask .mp-faq-search:focus {
  border-color: rgba(244, 114, 208, .55) !important;
  box-shadow: 0 0 0 1px rgba(244, 114, 208, .22), 0 0 0 4px rgba(244, 114, 208, .07);
}
#moon-modal-mask .mp-faq-item[data-open="1"] { border-color: rgba(244, 114, 208, .34); }
#moon-modal-mask .mp-faq-foot {
  margin-top: 12px; padding-top: 12px;
  border-top: 1px dashed var(--k-line);
  color: var(--k-fg-3); font: 10px/1.6 var(--k-font-body);
}
#moon-modal-mask .mp-faq-foot b { color: var(--k-fg-2); font-weight: 600; }
#moon-modal-mask .mp-faq-chip {
  min-height: 40px; padding: 8px 12px;
  border: 1px solid var(--k-line); border-radius: 8px;
  background: var(--k-ink-3); color: var(--k-fg-2);
  font: 10.5px/1.3 var(--k-font-body); cursor: pointer;
}
#moon-modal-mask .mp-faq-chip.active { border-color: var(--k-accent); background: rgba(244, 114, 208, .14); color: var(--k-accent-2); }
#moon-modal-mask .mp-faq-item { border: 1px solid var(--k-line); border-radius: 8px; margin-bottom: 8px; overflow: hidden; background: var(--k-ink-1); }
#moon-modal-mask .mp-faq-q {
  display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px;
  padding: 10px 12px; border: 0; background: transparent;
  color: var(--k-fg); font: 600 11.5px/1.45 var(--k-font-body) !important; text-align: left;
  cursor: pointer; box-shadow: none !important;
}
#moon-modal-mask .mp-faq-q i { margin-left: auto; color: var(--k-accent); font-style: normal; font-size: 10px; transition: transform 200ms var(--k-ease); }
#moon-modal-mask .mp-faq-item[data-open="1"] .mp-faq-q i { transform: rotate(180deg); }
#moon-modal-mask .mp-faq-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 240ms var(--k-ease); }
#moon-modal-mask .mp-faq-item[data-open="1"] .mp-faq-body { grid-template-rows: 1fr; }
#moon-modal-mask .mp-faq-clip { min-height: 0; overflow: hidden; }
#moon-modal-mask .mp-faq-a {
  padding: 2px 11px 11px; color: var(--k-fg-2);
  font: 11px/1.75 var(--k-font-body);
  border-top: 1px dashed var(--k-line);
  margin: 0 0 0; padding-top: 8px;
}
#moon-modal-mask .mp-faq-a b { color: var(--k-accent-2); font-weight: 600; }
#moon-modal-mask .mp-faq-empty { padding: 18px 0; text-align: center; color: var(--k-fg-3); font-size: 11px; }

/* ── 设置组里的整块区域（难度、选择器） ────────────────────────────────── */
#moon-phase-panel .mp-set-block { padding: 9px 0; border-top: 1px dashed var(--k-line); }
#moon-phase-panel .mp-set-block:first-child { border-top: 0; padding-top: 2px; }
#moon-phase-panel .mp-set-block .mp-set-title { margin-bottom: 3px; }
#moon-phase-panel .mp-mode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin: 8px 0 7px; }
#moon-phase-panel .mp-set-block > div[style*="display:flex"] { justify-content: flex-start !important; }
#moon-phase-panel .mp-set-block button[data-skin-pick],
#moon-phase-panel .mp-set-block button[data-core-rule],
#moon-phase-panel .mp-set-block button[data-glossary] {
  min-height: 32px;
  padding: 5px 9px !important;
  border-radius: 2px !important;
  font-family: var(--k-font-body) !important;
  box-shadow: 1px 1px 0 var(--k-shadow) !important;
}

/* 命运状态条 */
#moon-phase-panel .mp-fate {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 2px;
  padding: 7px 10px;
  border: 1px solid var(--k-line);
  border-radius: 3px;
  background: var(--k-ink-0);
  color: var(--k-fg-3);
  font: 10px/1.5 var(--k-font-body);
}
#moon-phase-panel .mp-fate.active { border-color: rgba(255, 138, 178, .34); color: #ffb0c8; background: rgba(255, 138, 178, .08); }
#moon-phase-panel .mp-fate-dot { width: 6px; height: 6px; border-radius: 50%; flex: 0 0 6px; }

/* 屏内属性行：标签只要放得下「好感」两个字，别占 110px */
#moon-phase-panel .mp-rpg-stat-label { flex: 0 0 46px !important; font-weight: 600 !important; }
#moon-phase-panel .mp-rpg-stat-row { margin: 3px 0 !important; font-size: 11.5px !important; }
#moon-phase-panel .mp-rpg-stat-bar { height: 6px !important; border: 1px solid rgba(28, 37, 29, .42) !important; background: rgba(28, 37, 29, .10) !important; margin: 0 7px !important; }
#moon-phase-panel .mp-rpg-stat-fill { background: rgba(28, 37, 29, .68) !important; }
#moon-phase-panel .mp-rpg-stat-val { font-variant-numeric: tabular-nums; min-width: 34px; text-align: right; }

@media (max-width: 520px) {
  /* 手机上两列会把说明压成三行还被截断，一列读起来才顺 */
  #moon-phase-panel .mp-grid { grid-template-columns: 1fr !important; }
}

@media (max-width: 400px) {
  #moon-phase-panel .mp-guide { grid-template-columns: 1fr; }
  #moon-phase-panel .mp-guide-actions { flex-direction: row; }
  #moon-phase-panel .mp-guide-cta { flex: 1; }
  #moon-phase-panel .mp-grid { grid-template-columns: 1fr; }
  #moon-phase-panel .mp-mode-btn { min-height: 58px !important; }
}

@media (prefers-reduced-motion: reduce) {
  #moon-phase-panel .mp-fold-body,
  #moon-modal-mask .mp-faq-body,
  .mp-tour-spot,
  #moon-phase-panel .mp-menu-card,
  #moon-phase-panel .mp-btn { transition: none !important; }
}
`;
  }
