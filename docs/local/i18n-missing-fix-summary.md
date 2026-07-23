# i18n Missing Fix Summary

> Generated: 2026-07-23T15:00:00Z

## Overview

- Schema paths with ui.label: 274
- Schema paths covered with CJK in zh: 274
- Added en keys: ~49 (first run)
- Added zh keys: ~49 (first run)
- Deleted phantom keys: 8 (4 keys × 2 files)
- Fixed mixed/EN labels: 6
- Gate: **PASSED** ✅

## Phantom Keys Deleted (en + zh)

| Key | File |
|---|---|
| `settings.task.isolation.apply.label` | en-settings-tasks.json, zh-settings-tasks.json |
| `settings.task.isolation.apply.description` | en-settings-tasks.json, zh-settings-tasks.json |
| `settings.mcp.renderMarkdownResults.label` | en-settings-tools.json, zh-settings-tools.json |
| `settings.mcp.renderMarkdownResults.description` | en-settings-tools.json, zh-settings-tools.json |

## Mixed/EN Labels Fixed

| Key | New ZH Value |
|---|---|
| `settings.worktree.base.label` | 工作树基础目录 |
| `settings.task.showResolvedModelBadge.label` | 显示已解析的模型徽章 |
| `settings.images.describeForTextModels.label` | 为纯文本模型描述图片 |
| `settings.images.describeForTextModels.description` | 当图片附加到不支持视觉的模型时，将其保存到 local:// 并从支持视觉的模型注入描述，而不是丢弃它。 |
| `settings.providers.openaiWebsockets.label` | OpenAI WebSocket 策略 |
| `settings.exa.enableWebsets.label` | Exa Websets |

## zh-ui Fixed

| Key | Old | New |
|---|---|---|
| `ui.agentHub.agentHub` | Agent Hub | 代理中心 |

## Schema Coverage by Tab

| Tab | Count |
|---|---|
| appearance | 24 |
| context | 26 |
| files | 21 |
| interaction | 31 |
| memory | 29 |
| model | 24 |
| providers | 35 |
| shell | 13 |
| tasks | 25 |
| tools | 46 |

## Key Translations (Sample)

| Path | EN Label | ZH Label |
|---|---|---|
| `tui.scrollbackRebuild` | Rewrite Scrollback | 重写回滚缓冲区 |
| `display.collapseCompacted` | Collapse Compacted History | 折叠已压缩的历史 |
| `tui.imeSafeCursor` | IME-Safe Prompt Layout | IME 安全提示布局 |
| `tier.openai` | Service Tier — OpenAI | 服务层级 — OpenAI |
| `tier.anthropic` | Service Tier — Anthropic | 服务层级 — Anthropic |
| `tier.google` | Service Tier — Google | 服务层级 — Google |
| `tier.subagent` | Service Tier — Subagent | 服务层级 — 子代理 |
| `tier.advisor` | Service Tier — Advisor | 服务层级 — 顾问 |
| `auth.broker.token` | Auto Resume | 自动恢复 |
| `recap.enabled` | Idle Recap | 空闲回顾 |
| `recap.idleSeconds` | Idle Recap Delay | 空闲回顾延迟 |
| `edit.enforceSeenLines` | Enforce Seen-Line Guard | 强制执行已查看行守卫 |
| `todo.remindersMax` | Todo Reminder Limit | 待办提醒上限 |
| `launch.enabled` | Launch | 启动 |
| `generate_image.enabled` | Generate Image | 生成图片 |
| `ask.enabled` | Ask | 询问 |
| `tools.xdev` | xd:// Tools | xd:// 工具 |
| `title.refreshOnReplan` | Refresh Title on Replan | 重新规划时刷新标题 |
| `task.prewalk` | Generic Task Prewalk | 通用任务预走查 |
| `providers.webSearchGeminiModel` | Gemini web_search model | Gemini web_search 模型 |
| `speech.enhanced` | Enhanced Speech Rewriting | 增强语音重写 |
| `exa.enabled` | Exa | Exa |
| `images.describeForTextModels` | Describe Images for Text Models | 为纯文本模型描述图片 |
| `providers.maxInFlightRequests` | Max In-Flight Requests | 最大并发请求 |
| `providers.anthropic.serverSideFallback` | Anthropic Server-Side Fallback (Fable 5) | Anthropic 服务端回退 (Fable 5) |
| `task.softRequestBudgetNotice` | Soft Request Budget Notice | 软请求预算通知 |

## Files Modified

- `packages/coding-agent/src/i18n/lang/en-settings-*.json` (all 10 tabs)
- `packages/coding-agent/src/i18n/lang/zh-settings-*.json` (all 10 tabs)
- `packages/coding-agent/src/i18n/lang/zh-ui.json`
- `docs/local/i18n-missing-fix-summary.md`

## Backup

All original files backed up to: `packages/coding-agent/src/i18n/lang/_backup/2026-07-23-pre-missing-fix/`
