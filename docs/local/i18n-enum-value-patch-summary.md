# i18n 枚举值列 + 坏译小补丁摘要

## 1. 修改的文件

### settings-schema.ts
- 给 15 个 bare enum 添加了 `ui.options` 子菜单选项：
  - `advisor.syncBacklog` — off/1/3/5
  - `tui.hyperlinks` — off/auto/always
  - `steeringMode` — all/one-at-a-time
  - `followUpMode` — all/one-at-a-time
  - `interruptMode` — immediate/wait
  - `doubleEscapeAction` — branch/tree/none
  - `treeFilterMode` — default/no-tools/user-only/labeled-only/all
  - `completion.notify` — on/off
  - `ask.notify` — on/off
  - `hindsight.recallBudget` — low/mid/high
  - `ttsr.contextMode` — discard/keep
  - `ttsr.repeatMode` — once/after-gap
  - `shellMinimizer.sourceOutlineLevel` — default/aggressive
  - `python.kernelMode` — session/per-call
  - `dev.autoqaConsent` — unset/granted/denied

### settings-selector.ts
- "Preview:" → `interceptUIString("ui.settings.preview", "Preview:")`（i18n 拦截）

### zh-ui.json
- 新增 `"ui.settings.preview": "预览："`

### 语言文件更新（en + zh 配对）
- **settings-interaction**: 新增选项 label/description（completion.notify, ask.notify, doubleEscapeAction, followUpMode, interruptMode, steeringMode, treeFilterMode 的 options）
- **settings-appearance**: 新增 tui.hyperlinks 三个选项
- **settings-model**: 新增 advisor.syncBacklog 选项、defaultThinkingLevel 选项（auto/minimal/low/medium/high/xhigh/max）
- **settings-context**: 新增 ttsr.contextMode、ttsr.repeatMode 选项
- **settings-shell**: 新增 shellMinimizer.sourceOutlineLevel、python.kernelMode 选项
- **settings-tools**: 新增 dev.autoqaConsent 选项
- **settings-tasks**: 已有 task.eager 选项（无需变更）
- **settings-memory**: 新增 hindsight.recallBudget 选项
- **settings-providers**: 无变更（已有完整选项）

### 坏译修复（4 处）
1. `zh-settings-context.json` — `settings.branchSummary.enabled.description`: "提示词 to summarize..." → "离开分支时提示总结"
2. `zh-settings-providers.json` — `settings.provider.appendOnlyContext.options.on.description`: "始终 enable append-only context" → "始终启用仅追加上下文"
3. `zh-settings-providers.json` — `settings.providers.openrouterVariant.options.online.description`: "启用 OpenRouter's web-search plugin" → "启用 OpenRouter 网页搜索插件"
4. `zh-settings-tasks.json` — `settings.task.eager.options.default.description`: "模型 decides when to delegate" → "模型自行决定何时委派"

## 2. 验证结果
- 所有 JSON 文件解析成功（27 个文件）
- 所有 en/zh 文件 key 对称（0 个缺失）
- 无空串
- settings-schema.ts 中 bare enum 现在全部有 `ui.options`

## 3. 影响
- 设置列表右侧现在显示中文选项标签而非原始 ID（如 "逐条处理" 而非 "one-at-a-time"）
- 预览标签已本地化为 "预览："
- 4 处中英夹杂的描述已修复为完整中文
