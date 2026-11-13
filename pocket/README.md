# pocket/ —— 掌机（卡带机）子系统

酒馆面板里那块「卡带机」页签装的就是这个页面：一张 240×160 的液晶屏、一套像素外壳、
一个真能跑 GBA 卡带的 WASM 内核。

## 目录

```
pocket/
├─ src/                     ← 真正的源码（改这里）
│  ├─ shell.html              结构：机身、屏幕、按键、屏内图层、攻略抽屉
│  ├─ pocket.00-base.css      配色令牌、报头、模式条、舞台
│  ├─ pocket.01-console.css   机身：屏幕、十字键、AB、HUD
│  ├─ pocket.02-pages.css     规范区、弹层、世界书、美化抽屉、响应式、嵌入模式
│  ├─ pocket.03-cheat.css     金手指台
│  ├─ pocket.04-guide.css     攻略抽屉与分册条
│  ├─ pocket.00-base.js       工具函数、LS 存储
│  ├─ pocket.01-skin.js       皮肤引擎（配色派生、预设）
│  ├─ pocket.02-screen.js     屏内游戏位、卡带目录、屏内导航
│  ├─ pocket.03-cart.js       卡带头部解析、卡槽状态
│  ├─ pocket.04-emu.js        核心装载、帧循环、存档桥
│  ├─ pocket.05-worldbook.js  世界书生成与编辑
│  ├─ pocket.06-cheat.js      金手指台 + 「刷新」宏
│  ├─ pocket.07-ui.js         美化抽屉、电源按键、游戏位导入、对外 API、开机
│  ├─ guide.00-index.js       攻略分册索引（空数组）
│  ├─ guide.01-main.js        攻略 · 主线（九段）
│  ├─ guide.02-item.js        攻略 · 道具（五段）
│  ├─ guide.03-mon.js         攻略 · 精灵（五段）
│  ├─ guide.04-evo.js         攻略 · 进化（三段）
│  ├─ guide.05-help.js        攻略 · 急救（两段）
│  └─ guide.06-ui.js          攻略的渲染与交互
├─ index.html               ← 由 src/ 拼出来的整页（工具生成，别手改）
├─ tools/
│  ├─ build-pocket.mjs      src/ → index.html（--check 校验 / --stats 看行数）
│  └─ pack-pocket.mjs       index.html → 仓库里的 src/87-pocket-embed.js（base64 内嵌）
└─ core/                    运行内核（本仓库不放，见下）
```

**为什么切这么碎**：改一个功能只动一个文件。改机身外观动 `01-console.css`，改攻略文案动
`guide.0x-*.js`，改金手指动 `06-cheat.js`，互不牵连。拼装顺序按文件名排序，`pocket.*` 一定
排在 `guide.*` 前面（攻略脚本要用 pocket 里的 `$` / `LS` / `esc`）。

`index.html` 既是本地能直接打开的独立页面，也是被塞进酒馆面板的那一份——两者是同一份代码，
区别只在嵌入时会加 `body.is-embed`（收掉整页营销版面、只留机身）。

## 改东西的流程

```bash
# 1) 改 src/ 里的文件（改攻略文案只动 guide.0x-*.js，改外观只动 pocket.0x-*.css）
# 2) 拼出整页（--check 只校验是否同步，--stats 看各片行数）
node pocket/tools/build-pocket.mjs
# 3) 把整页打包进脚本分片（顺带把核心塞进去）
node pocket/tools/pack-pocket.mjs
# 4) 重新拼单文件
node scripts/build.mjs
```

第 3 步需要 `pocket/core/44gba.js` 与 `pocket/core/44gba.wasm`。**这两个文件不在仓库里**：
它们是 44vba（VBA-Next 的 WebAssembly 构建）的产物，从上游取：

- 上游：<https://github.com/44670/44vba>（作者 44670，网页版 <https://gba.44670.org/>）
- 许可：**GPL-3.0**

`pack-pocket.mjs` 会做两道自检：内嵌的核心脚本必须还能被 JS 引擎解析（Emscripten 代码里全
是 `$` 标识符，字符串式替换会把它们当成 `$&` 打坏），wasm 解压回来必须与源文件逐字节一致。

## 金手指

金手指台在 `pocket.06-cheat.js` 里，搜 `金手指台（GOLDEN LINK）` 就能定位。它做三件事：

1. **一键宏**：把按键直接写进 `coreKeys`（打开菜单 / 连打 A / 倍速 / 暂停），不碰游戏数据。
2. **代码**：把 CBA「XXXXXXXX YYYY」或 GSA「XXXXXXXXYYYYYYYY」写进核心的金手指文本缓冲，
   再调 `Module._emuAddCheat(ptr)`，把返回值如实显示出来。
3. **体检**：往 EWRAM 尾巴写 4 个半字魔法值，跑一帧，然后在整个 wasm 堆里搜这 8 个字节。
   搜到才算真的写进了模拟内存。

第 3 步是有必要的：当前这个 44vba 构建里，`_emuAddCheat` 对 12 位 CBA 代码返回 0（受理），
但内存一个字节都不变；16 位 GSA 直接返回 -1。也就是说**它不会真的改游戏内存**，界面上因此
写的是「开不了」，而不是假装成功。要无敌，用模拟器那一层的修改器（PC 版 VBA / 安卓模拟器），
不在游戏菜单里。

同一个文件里还有 **「刷新」宏**：这版便利道具（闪光灯、隐身衣、城镇魔毯）点完要切一次背包才
生效，那是游戏本体的写法，插件改不了，只能替你按 `START → A → B → B`。

## 关于许可

内核是 GPL-3.0。把它的二进制内联进 `moon-phase.js` 之后，那个**打包产物**在分发意义上受
GPL 约束；本仓库同时提供本目录下的页面源码，内核源码请从上面的上游仓库获取（本仓库未做任何
修改）。如果你的分发方式不适用 GPL，`attachCore(adapter)` 是通用接口，换成许可更宽松的
WASM 内核即可（只要能提供 boot / frame / input / save 这几个动作）。

## 游戏本体

本目录**不含任何游戏**。卡带由使用者在卡带口选自己的文件，只在内存里读取、解析头部、算
SHA-1，不复制、不上传、不保存。
