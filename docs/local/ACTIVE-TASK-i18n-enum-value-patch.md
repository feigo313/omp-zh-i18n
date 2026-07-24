# ACTIVE: i18n 枚举值列 + 坏译小补丁

> 2026-07-24 · Coord: Grok · Worker: MiMo  
> 完成后仓库名 **`omp-zh-i18n`**（GitHub `feigo313`），更新节奏不定期。

## 目标

设置列表**右侧当前值**不再大面积显示英文 raw id；修 4 条中英夹杂 description；可选 Preview chrome。

## 根因（已证实）

1. **Bare enum**（schema `type: "enum"` 且 **无** `ui.options`）→ `settings-defs` 生成 `type: "enum"` → `settings-selector` 用 `String(currentValue)` 展示，**不走** option label i18n。  
   实机：`one-at-a-time` / `immediate` / `tree` / `default` / `on` 等。
2. **Theme**（`theme.dark`/`theme.light`）为 runtime options：`#getSubmenuCurrentValue` 只查 `def.options`（常为空），**未** `i18n.t(themes.${id}.label)`，故列表显示 `titanium`/`light` 尽管 `zh` 已有 `themes.*.label`。
3. **Thinking level** 有 options，但可能缺 `settings.defaultThinkingLevel.options.<level>.label` 的 zh/en key。
4. 4 条 zh description 半英半中（见下）。

## 允许修改

| 路径 | 说明 |
|---|---|
| `packages/coding-agent/src/config/settings-schema.ts` | 给 bare enum 补 `ui.options`（英文 label/desc，与现有 `loop.mode` 模式一致） |
| `packages/coding-agent/src/modes/components/settings-selector.ts` | theme/thinking 当前值展示；`Preview:` 等 chrome → `interceptUIString` |
| `packages/coding-agent/src/i18n/lang/en-settings-*.json` | SoT 补 option keys |
| `packages/coding-agent/src/i18n/lang/zh-settings-*.json` | 中文 option + 修坏译 |
| `packages/coding-agent/src/i18n/lang/zh-ui.json` | Preview 等 UI 串 |
| `docs/local/*-summary.md` | 摘要 |

## 禁止

- commit / push / 写 `~/.omp/lang` / 改 `lan`  
- 无关重构、全量重译  
- 引用任何旧上游 PR

## Bare enums（脚本枚举，约 15）

```
advisor.syncBacklog          off|1|3|5
tui.hyperlinks               off|auto|always
steeringMode                 all|one-at-a-time
followUpMode                 all|one-at-a-time
interruptMode                immediate|wait
doubleEscapeAction           branch|tree|none
treeFilterMode               default|no-tools|user-only|labeled-only|all
completion.notify            on|off
ask.notify                   on|off
hindsight.recallBudget       low|mid|high
ttsr.contextMode             discard|keep
ttsr.repeatMode              once|after-gap
shellMinimizer.sourceOutlineLevel  default|aggressive
python.kernelMode            session|per-call
dev.autoqaConsent            unset|granted|denied
```

对每个：在 schema `ui` 增加 `options: [{ value, label, description? }]`（英文），  
`pathToSettingDef` 会自动变成 **submenu**，interceptor 用  
`settings.<path>.options.<value>.label|.description`。

同步写入对应 **en** + **zh** settings JSON（key 必须与 path 一致，前缀 `settings.`）。

中文 label 示例（可润色，勿空串）：

| value | zh 建议 |
|---|---|
| one-at-a-time | 逐条处理 |
| all | 全部处理 |
| immediate | 立即中断 |
| wait | 等待后处理 |
| branch | 分支 |
| tree | 会话树 |
| none | 无 |
| on / off | 开 / 关 |
| auto / always | 自动 / 始终 |
| default | 默认 |
| no-tools | 无工具 |
| user-only | 仅用户 |
| labeled-only | 仅已标注 |
| discard / keep | 丢弃 / 保留 |
| once / after-gap | 一次 / 间隔后 |
| aggressive | 激进 |
| session / per-call | 会话级 / 每次调用 |
| unset / granted / denied | 未设置 / 已允许 / 已拒绝 |
| low / mid / high | 低 / 中 / 高 |

## Theme 当前值（代码）

`#getSubmenuCurrentValue` 在 path 为 `theme.dark`/`theme.light` 时：

```ts
return i18n.t(`themes.${rawValue}.label`, rawValue);
```

（`themes.titanium.label` / `themes.light.label` 等 zh 已有。）

## Thinking 当前值

确保 en/zh 有 `settings.defaultThinkingLevel.options.<level>.label`  
（含 auto/high/… 与 runtime 可能出现的 effort）。  
`#getSubmenuCurrentValue` 已能用 option.label；若 runtime 注入无 baseOpt，createSubmenu 里 fallback label 也走 `i18n.t`。

## 必修 4 条坏译（zh）

| key | 问题 | 期望方向 |
|---|---|---|
| `settings.branchSummary.enabled.description` | `提示词 to summarize...` | 完整中文 |
| `settings.provider.appendOnlyContext.options.on.description` | `始终 enable...` | 完整中文 |
| `settings.providers.openrouterVariant.options.online.description` | 半英 | 完整中文（可保留 OpenRouter 品牌） |
| `settings.task.eager.options.default.description` | `模型 decides...` | 完整中文 |

## Preview chrome（可选但建议）

`settings-selector.ts` 中硬编码 `"Preview:"` →  
`interceptUIString("ui.settings.preview", "Preview:")`  
`zh-ui.json`: `"ui.settings.preview": "预览："`

另：若同文件仍有 `"Enter to save · Esc to cancel..."` 等未拦截 footer，一并 `interceptUIString` + zh-ui key（只改看得到的）。

## 门禁

```bash
cd packages/coding-agent
# JSON 可解析；en/zh 同文件 key 对称（针对改过的 settings 文件）
# bare enum 在 schema 均有 options
# 空串 = 0
```

写摘要：`docs/local/i18n-enum-value-patch-summary.md`

## worker_done

- to: coord Grok terminal（dispatch 时 resolve）
- filesModified / reportPath  
- 勿 commit
