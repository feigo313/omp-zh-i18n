# 更新日志 — omp-zh-i18n

本文件记录 **Oh My Pi 中文版**的发布情况。上游 `can1357/oh-my-pi` 自身的详细变更请见
[上游 CHANGELOG](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/CHANGELOG.md)。

## 汉化范围说明

本项目**只汉化 TUI / GUI 界面**:欢迎页与提示、聊天渲染器、各类覆盖层、设置界面、
斜杠命令在界面中的反馈文案、以及 `omp stats` 仪表盘的全部页面。

**帮助输出的语言跟随语言开关**:设为中文时 `omp --help`、`omp launch --help`、`omp stats --help`
等的说明文案为中文;`OMP_LANG=en` 或未开语言开关时全部保持英文。参数名(`--model`)、品牌名、
模型 id 任何情况下都不翻译。

## 未发布的本地修复（v18.16.0-zh 之后）

- **汉化版永远弹「有新版本可用：18.16.0」**。编译版二进制的启动检查与 `omp update` 都问官方渠道
  （`build.stencil.so` / npm），那里只有裸 `18.16.0`；semver 把 prerelease `-zh` 排在同名 release
  **之下**（`Bun.semver.order("18.16.0", "18.16.0-zh") = +1`），所以 `18.16.0-zh` 恒被判成落后，
  上游每发一个 patch 就再弹一次。按提示跑 `omp update` 更糟：它会拿官方英文二进制覆盖汉化安装。
  - 新增 `packages/coding-agent/src/cli/localized-release.ts`：本地化构建的更新源改为本 fork 的
    GitHub releases（`/releases/latest`，只接受带 `-zh` 的 tag，并按平台挑 release asset）。
  - `main.ts` 的 `checkForNewVersion` 与 `cli/update-cli.ts` 的 `runUpdateCommand` 按
    `isLocalizedVersion` 分流：本地化构建只报告更新的 `-zh` 版本和下载地址，**不自我替换**。
  - 读 GitHub 走两级：先 `fetch`（经 `wrapFetchForExtraCa`，跟 model-registry 等调用点同一约定，
    认 `NODE_EXTRA_CA_CERTS`），失败（本机到 `api.github.com` 的链 Bun 自带 CA 不认、或匿名 API
    限流）再退回 `gh api`（系统信任库、带鉴权）。两级都失败才报错，并把两个通道的原因都打出来；
    `gh` 通道共用同一份超时预算（超时按 exit 124 记失败，不拖启动），并把 `gh` 的 stderr 首行带进
    报错，实测形如：`api.github.com: unable to verify the first certificate; gh api: exit 1:
    gh: Not Found (HTTP 404)`。
  - 新增 `packages/coding-agent/test/update-localized-release.test.ts`（11 用例）：更新源必须是
    fork releases、只有真正的 `-zh` 新版本才算可更新、非本地化 tag 直接拒绝、asset 按平台挑选、
    HTTP 通道挂掉时 gh 通道能顶上、两通道都挂才报错、gh 自带原因会出现在报错里。
  - 文案：`cli.update.localizedSource`、`cli.update.localizedDownload`（en/zh 同步补齐）。
  - 知识库：`docs/local/knowledge/LESSONS.md` L-2026-11-04-49（假更新根因）、L-2026-11-04-50（本机
    `api.github.com` 的链 Bun fetch 验不过，`gh`/curl 走系统信任库可用）。
  - 验证：新增用例 11 通过；翻译资源契约 10 通过(12767 断言)；`check:types` 通过；oxlint 0 warning、
    oxfmt 无需改动；`update-cli.test.ts` 84 通过 / 7 失败 —— 与改动前 stash 基线逐条相同（Windows 既有
    环境性失败，非本次引入）。本机 `omp update --check` 从「有新版本可用：18.16.0」变为「✔ 已是最新版本」。
  - 本机已装：`C:\Users\MYCAIGC\.bun\bin\omp.exe` 253,756,416 字节，SHA-256
    `d29b838684190eceae817ec319d4eb709a8a5a686b87d87ed4b0f98be632b982`（`--version` / `--smoke-test` 通过，
    `omp update --check` 已是最新版本）。**这是宿主构建（不设 `CROSS_TARGET`，零网络，产物 `dist/omp.exe`），
    只做本机救济，不是发布 asset**：跨目标编译要先下载 `bun-windows-x64-baseline` 运行时模板，本机
    GitHub 下载通道 ~68 KB/s 下不完（L-2026-11-04-47、L-2026-11-04-52）。发布仍须按 Step 5 先 commit、
    在模板缓存热的时候跨目标构建重建对拍，别拿这个指纹当 asset。
    被替换的旧镜像备份在 `.tools/omp-18.16.0-zh-pre-update-fix.exe`（253,713,408 字节，即已发布
    v18.16.0-zh asset）；`.bun\bin\omp-18.16.0-zh-old.exe` / `omp-18.16.0-zh-mid.exe` 是在跑进程的映像，
    重启 omp 后可删。本地构建命令固化在 `.tools/build-zh-local.ps1`（PATH 里 `bun` 是 1.3.14，
    构建必须钉 `.tools/bun-1.4.4`，否则在 `gen:export-viewer` 就挂）。

## [v18.16.0-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.16.0-zh) — 2026-11-04

对齐官方 **v18.16.0**(commit `650f3a10`)。上一中文版为
[v18.12.6-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.12.6-zh)。

官方 18.13 → 18.16 的主线：`/resume` 直接列出带标题的会话；后台任务新增一行用途说明并把
模型给的目的带到 `/jobs`/`proc://`/`wait`；`out://` 让 agent 在不结束任务的情况下给出阶段性
回复；resume 选择器支持 Alt+K 置顶；bash 结果被输出最小化器改写后卡片显示用了哪个过滤器和
前后字节数；`/review` 可以从一个 checkout 目录直接评审 GitHub PR；浏览器工具(relay 与自建
Chrome)修掉一批 tab/下载/富文本填字问题；启动时延通过延迟非必需加载明显下降。

### 汉化

- **上游改口的 6 处按新语义重译**：批注编辑器的取消/放弃合并为同一个动作
  (`annotation.hintCancel`/`hintDiscard` → "关闭并保留批注"，原先的"取消/放弃"与新语义相反)；
  工具组边框标签 `ui.cancelled`/`ui.exitCode` 去掉自带括号(边框会再包一层，出现 `[已取消]`
  式的重复括号)；`askDialog.noteTitle` 补上"或刚选中的答案"；`planReview.editExternal` 改成
  `{editor}` 参数以显示真实编辑器名；`usageDashboard.resetsFull` 同步上游去掉"（还有 …）"尾巴，
  并撤掉该调用点为中文版多传的参数。
- **上游重构掉的接线重新接回 4 处**：登录对话框、OAuth 终端输出、MCP 授权卡片(原生行 +
  文本行)的 "Local shortcut (this machine only):" 重新走 `ui.setupSignIn.localShortcut`。
- **`/launch` 新增 4 个参数说明按现有风格补译**(`wait-async`、`no-context-files`、
  `warn-cost`、`max-cost`)，并同步 en 侧，保持 en/zh 键对称。
- **清掉 9 个上游已删除、无调用点的死键**(setup 登录场景 2 个、usage 仪表 3 个、会话选择器
  footer 1 个、`cli.ui.error`/`cli.ui.warning`/`cli.extension.finishPrompt`)。
- **本轮保持英文的 2 条上游新串**：`/review` 丢弃全部批注的确认文案，以及 resume 列表里模型
  来源的一行说明；它们出现在新覆盖层里，下轮按整屏效果统一定措辞。

### 质量校验

| 项目 | 结果 |
|---|---|
| 本地化门禁 | 16 项全部 PASS(资源契约 / 运行时探针 / scoped 覆盖 / 占位符 / 设置面板渲染 / 知识库 / oxlint+oxfmt / 类型 / frozen lockfile / 版本矩阵 / 密钥 / 内容范围 / 二进制版本 / 二进制冒烟 / 二进制密钥 / 源码冒烟) |
| 合并一致性 | parity-audit(v18.12.6 → v18.16.0)：漏并上游更新 0、未删上游删除 0、未执行 fork 移除 0、冲突标记 0 |
| 类型检查 | 全部包通过 |
| 翻译资源契约测试 | 10 通过 / 0 失败 |
| 界面回归 | 热键表 5/5、MCP 授权链接 6/6、用量面板与应用原生描述等 65/65 |
| 真机启动 | 候选 exe 以 OMP_LANG=zh 实际启动：横幅、提示条、更新横幅、设置面板 11 组与设置项均为中文 |
| 独立审核 | 零信任子代理审核 PASS_WITH_NOTES，无阻断项；其提出的口径矛盾与孤儿生成物已在本版内修正 |
| seam 清单 | 调用点 1686，不同英文串 1242，无中文 0 |
| 运行环境 | 冒烟与门禁子进程需 bun ≥1.4.4(上游本周期抬高了最低版本)，已装到 `.tools/bun-1.4.4` |
| 安装包 | `omp-windows-x64.exe` 253,713,408 字节，SHA-256 `73258f07984b4a989f33c64adb4e38d018a8af999d43a32bf95bd69c282dcfae` |

## [v18.12.6-zh] — 2026-10-24

对齐官方 **v18.12.6**(commit `45c35e40`)。
上一中文版为 [v18.12.5-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.12.5-zh)。

官方 v18.12.6 的主线是 **MCP OAuth 重授权重构**(`/mcp reauth` 支持 ACP/RPC/print 模式,
流程抽成共享引擎,并修复第二次 OAuth 登录后 Esc 失效)、**扩展延迟加载**(只注册工具/命令的
扩展不再阻塞启动)、ACP steering 扩展、Codex 持久提示缓存轴与若干修复。
界面侧的变化是 **MCP OAuth 向导整文件重写**与**模型中心 footer 重构**(拆成原生提示条的
"碎片 + 整行"两种形状)。

### 汉化

- **MCP OAuth** 按上游新结构重新接线:8 条既有文案复用原键;5 分钟超时提示随流程迁入
  `mcp/oauth-reauth.ts`
- **模型中心 footer** 适配"碎片 + 整行"双形状,按既有 `*Plain` 约定拆分
  `footerCloseFull` / `footerClosePlain` / `footerKindPlain` / `footerThinkingLevelPlain` /
  `footerNewChainPlain` / `footerAssignRolesPlain`;回退/分配/受保护三行按新的
  models-then-providers 浏览顺序更正
- 其余重译清单条目为上游大小写归一(Back/back、Apply/apply 等),中文不受影响

### 质量校验

| 项目 | 结果 |
|---|---|
| 本地化门禁 | 13 项全部 PASS(资源契约 / 运行时键 / scoped 覆盖 / 占位符 / 设置面板渲染 / 知识库 / oxlint+oxfmt / 类型 / frozen lockfile / 版本矩阵 / 密钥 / 内容范围) |
| 类型检查 | 全部包通过 |
| 翻译资源契约测试 | 10 通过 / 0 失败 |
| 占位符泄漏 | 0 |
| 需要重译的条目 | 0(清单已刷新为 v18.12.6 基线) |

本轮整条对齐流程由 `bun run i18n:align` 一次完成,人工只处理了 1 个上游整文件重写的文件
(MCP OAuth 向导)与 footer 双形状的键拆分。

## [v18.12.5-zh] — 2026-10-21

对齐官方 **v18.12.5**(commit `d5cd750e`)。
上一中文版为 [v18.12.3-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.12.3-zh)。

官方在 v18.12.3 之后发布了两个 patch(v18.12.4 / v18.12.5),内容以模型请求层与账号策略为主;
界面侧的变化是**等待卡片重写**(新增紧凑视图),本轮据此重新接线了汉化。

### 汉化

- **等待卡片**按上游新结构重新接线(紧凑视图与常规视图两处退出码、标签)
- **3 条新增界面文案**:`ui.wait.summaryDetail`、`cli.browserRelay.clearErrors`、
  `cli.extension.hostOnlyTurns`

### 质量校验

| 项目 | 结果 |
|---|---|
| 本地化门禁 | 12 项全部 PASS(资源契约 / 运行时键 / scoped 覆盖 / 占位符 / 设置面板渲染 / 类型 / 格式 / frozen lockfile / 版本矩阵 / 密钥 / 内容范围) |
| 类型检查 | 16 个包全部通过 |
| 翻译资源契约测试 | 10 通过 / 0 失败 |
| 需要重译的条目 | 3 条(其余 42 处为上游大小写变化,中文不受影响) |

本轮的整条对齐流程(官方树导入 → overlay 重贴 → 冲突分类裁决 → 版本矩阵 → lockfile →
行尾归一 → 翻译清单)已由 `bun run i18n:align` 一次完成,人工只处理了 1 个上游整文件重写
的文件(等待卡片)与 3 条新文案。

## [v18.12.3-zh] — 2026-10-21

对齐官方 **v18.12.3**(commit `53a0377db`)。
上一中文版为 [v18.11.0-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.11.0-zh)。

本次官方跨了 7 个次版本(v18.11.1 → v18.12.3):新增"询问并记住"审批模式、
后台任务实时组件、子代理在任务卡上显示当前步骤、模型选择器与用量仪表盘调整,
以及一批协议与稳定性修复。

### 汉化

- **7 个新设置项**:`advisor.continueSeverity`、`prewalk.auto`、`prewalk.autoTarget`、
  `async.widgets`、`computer.backgroundFallback`、`lsp.requestTimeout`、`tui.completeScrollback`
- **`auth-gateway` 的新参数** `--clients`(作用域客户端令牌)
- **"询问并记住"审批模式** 的选项与说明
- **模型选择器**:标题与搜索提示接入汉化(此前的译键一直存在但未接线)
- **等待卡片**按上游重写后的新结构(作业磁贴 / 任务组件)重新接线,保留原有汉化
- 官方重写后的其它界面文案同步对齐

### 质量校验

| 项目 | 结果 |
|---|---|
| 官方源码树 | 直接取自上游仓库自身的 git 对象,树哈希与官方一致 |
| 本地化门禁 | 15 项全部 PASS(资源契约 / 运行时键 / scoped 覆盖 / 占位符 / 设置面板渲染 / 类型 / 格式 / 密钥 / 内容范围 / 二进制三项) |
| 类型检查 | 16 个包全部通过 |
| 翻译资源契约测试 | 10 通过 / 0 失败(12741 断言) |
| 设置面板中文渲染 | 387 项中本轮新增/变更的 8 项全中文 |
| 本地实测 | 版本 / 冒烟 / 读写 / 检索 / 新设置项 / RPC 初始化 / 真实模型任务 均通过 |
| 密钥扫描(源码 + 二进制) | 干净 |
| 发布后回验 | 从 Release 重新下载 asset,SHA-256 / 版本 / 冒烟与候选一致 |

### 已知限制

- 部分上游新文案位于 coding-agent 侧(如审批对话框的 "Deny" / "Always Approve" /
  "Ask and remember" 按钮、会话咨询的模型选择项、后台任务组件的角色名),
  这些位置本就不在汉化缝内,与此前版本行为一致,渲染英文。
- 少量设置项标签(主题名、提供商标识、协议名、模型名)按惯例保留英文。

### 产物

| 文件 | 说明 |
|---|---|
| `omp-windows-x64.exe` | Windows x64 独立可执行文件 |

```
SHA-256: 942a4a96d4b6bb2896145e6bd2843f7ad2790b5c12eb34b71f968f5d4c80fc6b
大小:    413809664 字节
```

[下载页面](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.12.3-zh)

## [v18.11.0-zh] — 2026-10-16

对齐官方 **v18.11.0**(commit `c2cb79e4`)。
上一中文版为 [v18.4.10-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.4.10-zh)。

本次官方跨了 7 个次版本(v18.5.0 → v18.11.0):MCP 向导重构、usage 仪表盘、
欢迎页提示、autoresearch、4 个新 CLI 命令、大批新设置项与协议修复陆续落地,
界面文案相应变动较多。

### 汉化

- 本轮相对 v18.4.10-zh 新增/更新 **380 个键**:CLI 帮助 223(含 4 个新命令
  `anonymize` / `auth` / `predict` / `session`)、设置面板 148、TUI 9;
  另修复 zh-ui.json 中 `keybindings.app.stt.toggle` 的误加重复键。
- **修正 CLI 帮助的翻译优先级缺陷**:渲染器原先让通用键反向遮蔽命令专属键
  (81 个通用键遮蔽 100 个专属键,如 `omp agents --force` 显示 install 的文案),
  现改为专属键优先,14 组真实用例全部验证通过。
- **修正 autoresearch seam**:运行编号原被预插值进英文兜底串导致中文值失效,
  改为参数传递。
- 翻译方法升级为运行时录制式 probe(2688 个真实渲染键)+ 静态对账,
  CLI 帮助与设置面板全部走真实渲染路径核对。

### 质量校验

| 项目 | 结果 |
|---|---|
| 官方源码树校验 | 9064 个文件 blob SHA 与官方清单逐条一致 |
| 发布冻结门 | 22 项全部 PASS(binary SHA-256 与候选一致) |
| 翻译资源契约测试 | 3 通过 / 0 失败(12600 断言) |
| 运行时键缺口 | 0(41 个为有意保留的通用兜底键,其专属键覆盖 100%) |
| 不变性审计(恒等 translator vs 中文) | 1237 行,结构零差异 |
| 密钥扫描(源码 + 二进制) | 干净 |
| CLI 冒烟测试 | 通过(源码与二进制各一次) |
| Windows 二进制 | `--version` / `--smoke-test` 通过 |

### 已知限制

- 上游 v18.11.0 新带的部分 TUI 文案(如 approval dialog 的 "Summarize" /
  "Approve this call")尚未接入翻译缝,渲染英文;不影响已汉化面。
- 少量设置项标签(主题名、提供商标识、协议名)按惯例保留英文。

### 发布后修订(2026-10-20,已并入 master)

发布后对基线做了一次完整审计,发现并修复了 5 处缺陷。已发布的
`v18.11.0-zh` 标签内容不变,以下修复在 master 上,随下一版发布。

- **修复占位符泄漏**:三个中文键在不带参数的调用点会把 `{name}` 原样渲染到界面
  (模型中心页脚、插件设置标签)。根因是同一个键承担两种英文形态,
  现拆分为独立键;插件设置项改为传参,英文输出逐字不变。
- **补齐批注面板页脚汉化**:终端页脚里 11 个已翻译但从未接线的文案已接线;
  原生渲染路径此前整条未汉化,一并补齐 7 个词。28 个页脚词中 27 个为中文,
  仅 "diff" 按惯例保留英文。
- **修复质量门**:此前 `oxfmt` 有 11 处不达标(全部由本 fork 引入,上游原版均通过),
  导致 `bun run check:ts` 在类型检查之前就中断;现已全仓合规,
  16 个包的类型检查全部通过(`stats` 与 `catalog` 原有的 9 个类型错误一并消除)。
- **移除误入库的本机产物**:`.v2c/`、`.zcode/`、`.zcodeignore` 不再随版本发布。
- 新增回归测试:断言中文翻译永远不会渲染出字面量占位符。

### 产物

| 文件 | 说明 |
|---|---|
| `omp-windows-x64.exe` | Windows x64 独立可执行文件 |

```
SHA-256: D0688E3EF59C79F0BAEC929769DED22B41ACC4AD938FEF6B009FAECE8692F46E
大小:    431777280 字节
```

[下载页面](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.11.0-zh)

## [v18.4.10-zh] — 2026-10-03

对齐官方 **v18.4.10**(2026-10-02 发布,commit `cb0d5295`)。
上一中文版为 [v18.3.1-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.3.1-zh)。

本次官方跨了 8 个补丁版本(18.3.2 → 18.4.10,共 1638 个提交),上游对 TUI 与
`omp stats` 仪表盘做了较大重构,界面文案变动较多,因此本次汉化随上游同步重做了一轮。

### 汉化

- **词表从 3997 条扩充到 4722 条**,补齐了 v18.4.x 新增与改写的界面文案。
- 补齐了 v18.3.1 遗留未汉化的 5 个 TUI 渲染器:`wait`、`proc-render`、
  `cfg-render`、`find`、代码审查批注浮层(annotation overlay)。
- **修正了一个既有缺陷**:欢迎页提示文件有 29 行而对应的键表只有 27 条,导致第 13 条
  起的提示渲染出错位的中文。两处现已对齐为 29 条。
- `omp stats` 仪表盘随上游重构完成全量重做,包括新增的「烦躁情绪」页面、
  「调用链」页面的各视图,以及侧边导航与时间范围说明。
- 模型中心新增的预设保存、角色管理、OAuth 登录等界面,以及顾问配置、Agent Hub、
  快捷键帮助页、Git 侧边栏、进程查看器、日志查看器等界面完成汉化。

### 界面文案

- 若干键位提示在中文里采用 `回车` / `Esc` 等通行写法;若你自定义了键位映射,
  这类提示不会随之变化。

### 质量校验

| 项目 | 结果 |
|---|---|
| 官方源码树校验 | 8505 个文件 blob SHA 与官方清单逐条一致 |
| 类型检查 | 17 个包全部通过 |
| 代码规范 / 格式 | 0 warning / 0 error |
| 翻译资源契约测试 | 9 通过 / 0 失败(11306 断言) |
| 界面文案接线完整性 | 1361 处调用全部可解析,0 悬空 |
| 英文回退保真 | 1361 条与官方原文逐一比对,0 漂移 |
| CLI 冒烟测试 | 通过 |
| Windows 二进制 | `--version` / `--smoke-test` 通过 |

### 已知限制

- **测试套件存在既有环境性失败**:在 Windows 上,`packages/coding-agent` 全量 16199 个
  用例中有 296 个失败,`packages/tui` 有 11 个失败。这些全部位于与官方 v18.4.10
  逐字节相同的文件中,成因为 Windows 路径分隔符、缺少 POSIX shell、文件锁与权限、
  符号链接权限、需要真实浏览器与外网网络等,与汉化无关。
- 少量设置项标签(主题名、提供商标识、协议名)按惯例保留英文。

### 产物

| 文件 | 说明 |
|---|---|
| `omp-windows-x64.exe` | Windows x64 独立可执行文件 |

```
SHA-256: a246752734afe86d49ac83071a23240008d665c090642e7a6651bb7131577364
大小:    371436544 字节
```

[下载页面](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.4.10-zh)

## 历史版本

- [v18.4.10-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.4.10-zh) — 2026-10-03
- [v18.3.1-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.3.1-zh) — 2026-09-27
- [v18.2.6-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.2.6-zh) — 2026-09-19
- [v17.2.1-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.2.1-zh)
- [v17.2.0-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.2.0-zh)
- [v17.1.8-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.1.8-zh)
- [v17.1.0-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.1.0-zh)
