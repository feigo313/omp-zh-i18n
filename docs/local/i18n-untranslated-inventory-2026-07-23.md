# 未翻译/缺失清单（强制修复）

**来源**: settings-schema.ts path ↔ en/zh-settings

- 带 UI 的设置项: 276
- **缺失 en 或 zh**: 46
- **仍英文/夹生**: 4

## A. 缺失（必须补 en+zh）

| tab | 状态 | key | schema 英文 |
|---|---|---|---|
| interaction | NO_EN | `settings.auth.broker.token.label` | Auto Resume |
| interaction | NO_EN | `settings.auth.broker.token.description` | Automatically resume the most recent session in the current directory |
| model | NO_EN | `settings.prewalk.enabled.label` | Enable Prewalk |
| model | NO_EN | `settings.prewalk.enabled.description` | Start on the active model, then switch to a fast/cheap model (default the 'smol' role) at the first edit/write after the |
| providers | NO_EN | `settings.providers.maxInFlightRequests.description` | Where model selector role assignments are saved |
| appearance | NO_EN | `settings.tui.scrollbackRebuild.label` | Rewrite Scrollback |
| appearance | NO_EN | `settings.tui.scrollbackRebuild.description` | Erase and replay terminal scrollback when a block's final form replaces its live preview. When off (default), stale prev |
| appearance | NO_EN | `settings.display.collapseCompacted.label` | Collapse Compacted History |
| appearance | NO_EN | `settings.display.collapseCompacted.description` | Collapse pre-compaction history behind the summary divider on the live transcript; disable to keep the full transcript i |
| appearance | NO_EN | `settings.tui.imeSafeCursor.label` | IME-Safe Prompt Layout |
| appearance | NO_EN | `settings.tui.imeSafeCursor.description` | Move the prompt's bottom border to a separate row so macOS IME preedit cannot displace it |
| model | NO_EN | `settings.tier.openai.label` | Service Tier — OpenAI |
| model | NO_EN | `settings.tier.openai.description` | Processing tier for OpenAI / OpenAI-Codex requests, and OpenAI-family models routed via OpenRouter (none = omit). Sent a |
| model | NO_EN | `settings.tier.anthropic.label` | Service Tier — Anthropic |
| model | NO_EN | `settings.tier.google.label` | Service Tier — Google |
| model | NO_EN | `settings.tier.google.description` | Processing tier for Gemini (Google AI Studio + Vertex) requests, and Google-family models routed via OpenRouter (none =  |
| model | NO_EN | `settings.tier.subagent.label` | Service Tier — Subagent |
| model | NO_EN | `settings.tier.subagent.description` | Service Tier for spawned task/eval subagents. Inherit = match the main agent's live per-family tiers (tracks /fast); pic |
| model | NO_EN | `settings.tier.advisor.label` | Service Tier — Advisor |
| model | NO_EN | `settings.tier.advisor.description` | Service Tier for the advisor model. None = standard processing; Inherit = match the main agent's live per-family tiers;  |
| interaction | NO_EN | `settings.recap.enabled.label` | Idle Recap |
| interaction | NO_EN | `settings.recap.enabled.description` | Generate a brief LLM recap of where things stand after the terminal has been idle |
| interaction | NO_EN | `settings.recap.idleSeconds.label` | Idle Recap Delay |
| interaction | NO_EN | `settings.recap.idleSeconds.description` | Seconds to wait while idle before showing the recap |
| files | NO_EN | `settings.edit.enforceSeenLines.label` | Enforce Seen-Line Guard |
| files | NO_EN | `settings.edit.enforceSeenLines.description` | Reject edits anchored on lines a prior read/search never displayed in full |
| tools | NO_EN | `settings.todo.remindersMax.label` | Todo Reminder Limit |
| tools | NO_EN | `settings.todo.remindersMax.description` | Maximum number of todo reminders before giving up |
| tools | NO_EN | `settings.launch.enabled.label` | Launch |
| tools | NO_EN | `settings.launch.enabled.description` | Enable the launch tool for supervising shared long-running project processes |
| tools | NO_EN | `settings.generate_image.enabled.label` | Generate Image |
| tools | NO_EN | `settings.generate_image.enabled.description` | Enable the generate_image tool (text-to-image generation and editing). Exposed as an xd:// device when tools.xdev is on. |
| tools | NO_EN | `settings.ask.enabled.label` | Ask |
| tools | NO_EN | `settings.ask.enabled.description` | Enable the ask tool for interactive user questions |
| tools | NO_EN | `settings.tools.xdev.label` | xd:// Tools |
| tools | NO_EN | `settings.tools.xdev.description` | Mount rarely-used (discoverable) tools under xd:// device URLs driven via read/write instead of shipping their schemas o |
| tasks | NO_EN | `settings.title.refreshOnReplan.label` | Refresh Title on Replan |
| tasks | NO_EN | `settings.title.refreshOnReplan.description` | Refresh generated session titles after todo init replans unless the title was set by the user |
| tasks | NO_EN | `settings.task.prewalk.label` | Generic Task Prewalk |
| tasks | NO_EN | `settings.task.prewalk.description` | Arm prewalk for the bundled generic `task` subagent: it starts on its resolved model, plans and begins the implementatio |
| providers | NO_EN | `settings.providers.webSearchGeminiModel.label` | Gemini web_search model |
| providers | NO_EN | `settings.providers.webSearchGeminiModel.description` | Model ID for Gemini Google Search grounding. Defaults to gemini-2.5-flash. |
| providers | NO_EN | `settings.speech.enhanced.label` | Enhanced Speech Rewriting |
| providers | NO_EN | `settings.speech.enhanced.description` | Rewrite assistant output into natural spoken prose with the tiny/smol model before synthesis (describes code, drops link |
| providers | NO_EN | `settings.exa.enabled.label` | Exa |
| providers | NO_EN | `settings.exa.enabled.description` | Master toggle for all Exa search tools |

## B. 仍英文/夹生（必须改译）

| tab | key | EN | 当前 ZH |
|---|---|---|---|
| tasks | `settings.worktree.base.label` | Worktree Base Directory | MIXED:Worktree 基础目录 |
| appearance | `settings.task.showResolvedModelBadge.label` | Show Resolved Model Badge | MIXED:显示 Resolved 模型 Badge |
| providers | `settings.providers.openaiWebsockets.label` | OpenAI WebSockets | OpenAI WebSocket |
| providers | `settings.exa.enableWebsets.label` | Exa Websets | Exa Websets |

## C. 幽灵 key（删除）

`settings.task.isolation.apply.label/description`
`settings.mcp.renderMarkdownResults.label/description`

## D. zh-ui
`ui.agentHub.agentHub` → 代理中心（已修：代理中心）

## E. P1 主题名字（**已修** MiMo task_e2973a59fdaf）

| 位置 | 设置 → 外观 → 深色/浅色主题选项列表 |
|---|---|
| 修复 | `settings-selector.ts` → `i18n.t(\`themes.${id}.label\`)`；en/zh-settings-appearance 各 **100** 条 `themes.*.label` |
| 抽检 | titanium→钛色，light→浅色，dark→深色；zh 无纯英文残留 |

## F. P1 模型 Prewalk 分组（**已修** 2026-07-23）

| 位置 | 设置 → **模型** → 分组标题 |
|---|---|
| 修复 | `tabs.model.groups.Prewalk` → EN `Prewalk` / ZH **预走查**（en+zh-settings-model.json） |

## G. P1 模型·采样·服务层级选项未翻译（用户记录，**未修**，待 MiMo 批次）

| UI | 模型 → 采样 → 服务层级 OpenAI / Anthropic / Google / 子代理（+ 顾问） |
|---|---|
| label 现状 | `settings.tier.*.label` 已有「服务层级 — …」中文（品牌名可保留） |
| **缺口** | **options 全缺**：en/zh-settings-model 无任何 `settings.tier.*.options.*` |
| 源 | `packages/coding-agent/src/config/service-tier.ts` → `SERVICE_TIER_OPENAI_OPTIONS` 等 |
| 须补 | 各 path 的 options value 的 label+description 中文；存储 value 保持 none/auto/… |
| OpenAI | none, auto, default, flex, scale, priority |
| Anthropic | none, priority |
| Google | none, flex, priority |
| Subagent / Advisor | inherit, none, auto, default, flex, scale, priority |

## H. P1 模型·提示词·Model Role Storage 标题/选项（用户记录，**未修**）

| UI | 模型 → 提示词 → **Model Role Storage** |
|---|---|
| 缺口 | en/zh **无** `settings.modelRoleStorage.*` 全套 |
| 须补 | `.label` / `.description`；`.options.global|project.label|description` |
| schema | `settings-schema.ts` `modelRoleStorage`（group: Prompt） |
| 建议 ZH | 模型角色存储；全局；按项目 |

## I. P1 交互·语音·语音模型 / 提交触发 options（用户记录，**未修**）

| UI | 交互 → 语音 → **语音模型**、**语音转文字提交触发** |
|---|---|
| 字段 label | 已中文 |
| **缺口** | **options 全缺**（interaction en/zh 无 `stt.modelName.options.*` / `stt.submitTrigger.options.*`） |
| 源 | `stt/models.ts`（fast/balanced/turbo/parakeet）；`stt/submit-trigger.ts`（never/release/release-complete/say-submit） |
| 用户策略 | **模型名**可保留英文；**模型 description 必中文**；**触发 label+description 全中文** |

## J. P1 记忆·记忆模型 options（用户记录，**未修**）

| UI | 记忆 → **记忆模型**（`settings.providers.memoryModel`） |
|---|---|
| 字段 label | 已有「记忆 模型」 |
| **缺口** | **options 全缺** |
| 源 | `tiny/models.ts` `TINY_MEMORY_MODEL_OPTIONS` / `TINY_MEMORY_LOCAL_MODELS` |
| values | online, qwen3-1.7b, llama3.2:3b, gemma-3-1b, qwen2.5-1.5b, lfm2-1.2b |
| 用户策略 | **名称可不译**；**介绍（description）必中文** |

## K. P1 记忆·Mnemopi 分组名（用户记录，**未修**）

| UI | 记忆 → 分组标题 **Mnemopi** |
|---|---|
| 缺口 | `tabs.memory.groups.Mnemopi` = `Mnemopi`（en/zh 相同，无中文） |
| 建议 ZH | **记忆派**（与 `settings.memory.backend.options.mnemopi.label` 一致） |
| 备注 | 字段级 mnemopi.* 多数字幕已有中文；主要是**分组标题** |
