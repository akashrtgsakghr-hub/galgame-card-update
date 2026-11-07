# src/ —— 拆分后的源码

这里放的是**拆开的源码**，不能单独运行。仓库根目录的 `moon-phase.js`
是它按文件名顺序拼接出来的成品，也是玩家导入 / 自动更新时下载的那个文件。

```
src/*.js  ──[ scripts/build.mjs ]──►  moon-phase.js
                                   └─►  Galgame攻略系统-酒馆助手导入.json
```

`node scripts/build.mjs` 会拼接并做大写校验；GitHub Actions 在每次改动 `src/` 后
自动跑一遍，再把产物提交回仓库。**所以不要直接改 `moon-phase.js`**，下次构建会被覆盖。

## 为什么是「拼接」而不是 ES 模块

整个脚本是一个 IIFE（`(function(){ … })();`），里面 300 多个顶层函数共享同一个闭包和
一批 `const` 状态。真正的 `import/export` 拆分需要把状态也搬出去，改动量极大且容易
出现初始化顺序问题。这里采用**按原顺序切片、零改动拼接**：

- 每个片段都是原文件的一段连续内容，一个字节都没改；
- 切点都落在顶层语句边界（上一段以 `}` 结尾、下一段以 `function` 开头）；
- 所有顶层函数都是 `function` 声明，会整体提升，顺序不变就意味着行为完全一致。

好处是拆分**不改变任何运行时行为**，坏处是片段之间没有显式的依赖声明。改代码时请
按下面的模块表定位，跨模块调用直接写函数名即可（同在一个闭包里）。

## 模块表

| 文件 | 行数 | 职责 |
|---|---:|---|
| `00-head.js` | 221 | IIFE 开头、窗口/文档引用、全部 localStorage key、数值参数、**版本号与更新公告** |
| `05-timeline.js` | 235 | 时间线文本解析、内置仓库（localStorage 按角色卡分档）、候选扫描 |
| `10-context.js` | 178 | SillyTavern 上下文读写、历史采集、AI 模型调用入口 |
| `15-state.js` | 120 | toast、角色档案库、提示词写入（含「本轮注入了什么」记录）、本地存档读写 |
| `20-tag.js` | 189 | Sylveina 标签解析、首见加成、减益处理 |
| `25-modal.js` | 196 | 弹窗队列、loading、结果弹窗、街机挂载 |
| `30-time.js` | 149 | 时间字符串解析、token 估算、世界书条目收集 |
| `35-stat.js` | 396 | 阶段门、事件提示注入、四维增量、标签归属匹配 |
| `40-backend.js` | 144 | 游戏时间格式化、AI 后台变量块的解析与写回 |
| `45-clock.js` | 184 | 世界时钟推进（每轮分钟数 / 换日）、相对时间识别 |
| `50-calc.js` | 284 | 主计算流程 `runMoonCalculation`、事件投掷与导演 |
| `55-timejump.js` | 121 | 时间跳跃检测、倒计时与操作提示 |
| `60-listeners.js` | 168 | 事件监听绑定、正则尾部清洗 |
| `65-ending.js` | 520 | 结局 / 尾声解析与幕布渲染、标签美化、生成结束钩子（收尾会顺手折叠 AI 草稿） |
| `66-cot-hide.js` | 157 | 隐藏 AI 写给自己的 Phase／cot 草稿段：DOM 尾部折叠 + 沉浸层纯文本截断，可开关 |
| `70-anchor.js` | 134 | 锚点锁档（好感跌破 / 冷战固化，仅新对话解锁） |
| `75-bio.js` | 1330 | 角色档案与玩家档案：生成、试镜、修订、库管理 |
| `80-bio-queue.js` | 331 | 批量建档队列（静默生成，逐个填入） |
| `85-style.js` | 855 | 面板与 LCD 的全部 CSS；末尾另注入护眼基础层（四层背景 / 聚焦双环 / 弹簧令牌） |
| `88-skin.js` | 4413 | 楼内状态卡：晨昏票根 / 月氏藏书票 / 预言家日报 / 朱丝栏邸报四套外观、数据适配、挂载与刷新 |
| `90-panel.js` | 1392 | 事件状态卡、LCD 渲染、面板主体、图库与图像生成 |
| `95-selfcheck.js` | 1165 | 系统自检、模拟测试、冲突扫描、token 统计、角色表、FAQ、面板主菜单与折叠态保持 |
| `96-core.js` | 543 | 内置演绎规则（原世界书 7 条）的注入与让位判定 + 词条释义库（14 条，按本轮注入内容触发） |
| `97-api.js` | 735 | 独立 API 请求层：端点/协议推导、错误分类、超时、Retry-After、通道降级与全局串行队列 |
| `98-prompts.js` | 312 | 提示词模板与预设、AI 冲突扫描 |
| `99-timeline-ui.js` | 411 | 时间线清单 / 转写 / 生成（结果写回内置仓库）；复制对勾 2.5s 自隐 |
| `A0-adaptive.js` | 581 | 开局自适应：单卡与多卡建档、首条回复即建 0 值档、之后每轮补录新角色 |
| `A1-migrate.js` | 374 | 旧存档迁移（规则迁移 + AI 辅助迁移） |
| `A2-boot.js` | 297 | 菜单注入、面板开关、首次启动流程、一次性刷新闸门、定时任务 |
| `86-gal-core.js` | 380 | 沉浸模式核心：设置、按聊天隔离的状态、阅读进度、标签映射预设与校验、素材库 |
| `86a-gal-parse.js` | 441 | 标签解析：指令提取、选项识别、段落分类、XML / 正则映射、按容量分页（不按字数硬切） |
| `86b-gal-image.js` | 328 | 图片适配层：四种模式、内置 / 第三方互斥闸门、第三方图片收集与 BG / 立绘 / CG 分类 |
| `86c-gal-memory.js` | 253 | 记忆三模式：回合记录、阶段摘要、长期记忆、第三方接管检测 |
| `86d-gal-save.js` | 246 | 存档读档：指纹定位、回退能力探测、预检、只恢复画面 / 真回退两种读档 |
| `86e-gal-ui.js` | 1230 | 沉浸界面：毛玻璃布局、分页渲染、选项交互、工具栏、历史 / 存档 / 标签 / 设置面板 |
| `86f-gal-boot.js` | 63 | 沉浸模式启动：CSS 注入、按 DOM 判断开关、事件挂载（入口在面板里） |

文件名前缀只是排序用的编号，`A*` 排在 `9*` 后面。

## 常见改动去哪

- 改版本号 / 更新公告 → `00-head.js` 顶部的 `MOON_FORMULA_VERSION` / `MOON_FORMULA_CHANGELOG`
- 调数值上限、难度系数 → `00-head.js` 的 `MOON_FORMULA_PARAMS`
- 改按钮文案、面板布局 → `90-panel.js`（`renderPanel`）
- 改弹窗样式 / 配色 → `85-style.js`
- 改时间推进规则 → `45-clock.js`、`55-timejump.js`
- 改标签解析 / 美化 → `20-tag.js`、`65-ending.js`
- 改事件投掷节奏 → `50-calc.js`
- 改时间线清单 → `05-timeline.js`（数据层）、`99-timeline-ui.js`（界面）
- 改更新线路 → `97-api.js` 上面的更新模块区（`buildUpdateSourceChain` / `fetchUpdateSource`）
- 改内置演绎规则（原世界书那 7 条） → `96-core.js` 顶部的 `CORE_RULE_SECTIONS`
- 加 / 改词条释义（标签和状态是什么意思） → `96-core.js` 的 `GLOSSARY_ENTRIES`，每条给 `id / label / priority / keys / title / body`，`always: true` 表示每轮必发
- 改楼内状态卡外观 → `88-skin.js` 是**生成物**：票根 / 藏书票的来源是 `moon/tools/skin-runtime.js` 骨架与两份正则 JSON，预言家日报来自 `moon/tools/skin-prophet.css` / `skin-prophet.js`（`PROPHET_STAGES` 文案表），朱丝栏邸报来自 `moon/tools/skin-dibao.css` / `skin-dibao.js`（`DIBAO_STAGES` 文案表、时辰换算），改完跑 `node moon/tools/gen-skin.mjs` 重新生成。生成器会校验每套 CSS 的作用域与护眼色值。注意 `moon/` 是本地开发目录，**不在本仓库内**；只 clone 到本仓库时，直接编辑 `src/88-skin.js` 里的 `SKIN_CSS_*` / `renderProphetSkin` / `renderDibaoSkin` 段落即可。数据入口统一是 `readMvuLatest()`
- 改护眼配色 / 弹簧参数 → 唯一事实来源是 `moon/tools/eye-care.mjs`（四层明度、k/c 参数、`linear()` 曲线、归一化规则）；`85-style.js` 末尾的基础层用同一套 token，`gen-skin.mjs` 用同一套规则清洗四套皮肤 CSS。改完跑 `node moon/tools/eye-care.mjs --apply` 与 `node moon/tools/gen-skin.mjs`，再 `node scripts/build.mjs`。归一化幂等，产物里有违禁色值生成器会直接报错。`moon/` **不在本仓库内**；只 clone 到本仓库时，直接改 `85-style.js` 末尾 `eyeEl.textContent` 里的 `:root` 令牌块即可

## 加新文件

文件名只要在 `00`～`A2` 之间、以 `.js` 结尾，就会按字典序插到对应位置。
**注意**：新文件会改变拼接结果，属于真实代码变更。若只是想拆得更细，请同步更新
本表；若切点不对导致语法错误，`build.mjs` 的 `node --check` 会直接失败，不会推出坏包。
