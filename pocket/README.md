# pocket/ —— 掌机（卡带机）子系统

酒馆面板里那块「卡带机」页签装的就是这个页面：一张 240×160 的液晶屏、一套像素外壳、
一个真能跑 GBA 卡带的 WASM 内核。

## 目录

```
pocket/
├─ src/                    ← 真正的源码（改这里）
│  ├─ shell.html           结构：机身、屏幕、按键、各个屏内图层、攻略抽屉
│  ├─ pocket.css           外观：配色令牌、机身、液晶、各图层与抽屉样式
│  ├─ pocket.js            行为：卡带菜单、存档、核心装载、金手指台
│  └─ guide.js             攻略：卡关急救手册的文案与渲染（纯数据，玩家最常提意见的就是这块）
├─ index.html              ← 由 src/ 拼出来的整页（工具生成，别手改）
├─ tools/
│  ├─ build-pocket.mjs     src/ → index.html（--check 只校验，--split 反向拆）
│  └─ pack-pocket.mjs      index.html → 仓库里的 src/87-pocket-embed.js（base64 内嵌）
└─ core/                   运行内核（本仓库不放，见下）
```

`index.html` 既是本地能直接打开的独立页面，也是被塞进酒馆面板的那一份——两者是同一份代码，
区别只在嵌入时会加 `body.is-embed`（收掉整页营销版面、只留机身）。

## 改东西的流程

```bash
# 1) 改 src/ 里的文件（只是改攻略文案的话，只会动到 guide.js）
# 2) 拼出整页
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

金手指台在 `pocket.js` 里，搜 `金手指台（GOLDEN LINK）` 就能定位。它做三件事：

1. **一键宏**：把按键直接写进 `coreKeys`（打开菜单 / 连打 A / 倍速 / 暂停），不碰游戏数据。
2. **代码**：把 CBA「XXXXXXXX YYYY」或 GSA「XXXXXXXXYYYYYYYY」写进核心的金手指文本缓冲，
   再调 `Module._emuAddCheat(ptr)`，把返回值如实显示出来。
3. **体检**：往 EWRAM 尾巴写 4 个半字魔法值，跑一帧，然后在整个 wasm 堆里搜这 8 个字节。
   搜到才算真的写进了模拟内存。

第 3 步是有必要的：当前这个 44vba 构建里，`_emuAddCheat` 对 12 位 CBA 代码返回 0（受理），
但内存一个字节都不变；16 位 GSA 直接返回 -1。也就是说**它不会真的改游戏内存**，界面上因此
写的是「开不了」，而不是假装成功。要无敌，去开游戏自带的修改器（`START` 菜单第二项）。

## 关于许可

内核是 GPL-3.0。把它的二进制内联进 `moon-phase.js` 之后，那个**打包产物**在分发意义上受
GPL 约束；本仓库同时提供本目录下的页面源码，内核源码请从上面的上游仓库获取（本仓库未做任何
修改）。如果你的分发方式不适用 GPL，`attachCore(adapter)` 是通用接口，换成许可更宽松的
WASM 内核即可（只要能提供 boot / frame / input / save 这几个动作）。

## 游戏本体

本目录**不含任何游戏**。卡带由使用者在卡带口选自己的文件，只在内存里读取、解析头部、算
SHA-1，不复制、不上传、不保存。
