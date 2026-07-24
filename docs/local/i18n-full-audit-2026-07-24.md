# i18n 全检报告（代码层）

- 时间: 2026-07-24
- utils VERSION: **17.1.0**
- coding-agent: **17.1.0**
- schema UI 设置项: **276**

## 汇总

| 类别 | 数量 |
|---|---:|
| 缺失 label (en/zh) | 1 |
| 缺失 description | 1 |
| 缺失 option 字段 | 154 |
| description 仍为英文说明 | 31 |
| label 仍为英文说明句 | 0 |
| 分组名无中文 | 7 |
| zh 空串 | 0 |
| zh 重复 key | 0 |
| commands missing | 0 |

## A. 缺失 label

| tab | key | 信息 |
|---|---|---|
| interaction | settings.auth.broker.token.label | Auto Resume | NO_EN |

## B. 缺失 description

| tab | key | 信息 |
|---|---|---|
| interaction | settings.auth.broker.token.description | Automatically resume the most recent session in the current directory | NO_EN |

## C. 缺失 options

| tab | key | 信息 |
|---|---|---|
| model | settings.advisor.immuneTurns.options.2.label | 2 turns | NO_EN |
| model | settings.advisor.immuneTurns.options.3.label | 3 turns | NO_EN |
| model | settings.advisor.immuneTurns.options.3.description | Default. | NO_EN |
| providers | settings.providers.maxInFlightRequests.options.global.label | Global | NO_EN |
| providers | settings.providers.maxInFlightRequests.options.global.description | Save role models in the active profile config (current behavior) | NO_EN |
| providers | settings.providers.maxInFlightRequests.options.project.label | Per-project | NO_EN |
| providers | settings.providers.maxInFlightRequests.options.project.description | Save project role models in .omp/config.yml; missing project roles use global de | NO_EN |
| appearance | settings.theme.light.options.unicode.label | Unicode | NO_EN |
| appearance | settings.theme.light.options.unicode.description | Standard symbols (default) | NO_EN |
| appearance | settings.theme.light.options.nerd.label | Nerd Font | NO_EN |
| appearance | settings.theme.light.options.nerd.description | Requires Nerd Font | NO_EN |
| appearance | settings.theme.light.options.ascii.label | ASCII | NO_EN |
| appearance | settings.theme.light.options.ascii.description | Maximum compatibility | NO_EN |
| tools | settings.tools.outputMaxColumns.options.768.label | 768 | NO_EN |
| tools | settings.tools.outputMaxColumns.options.768.description | Default | NO_EN |
| tools | settings.tools.outputMaxColumns.options.2048.label | 2048 | NO_EN |
| tools | settings.tools.outputMaxColumns.options.4096.label | 4096 | NO_EN |
| tools | settings.tools.outputMaxColumns.options.4096.description | Loose | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.auto.label | Auto | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.auto.description | Inline descriptors for Gemini models; keep them in tool schemas otherwise | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.on.label | On | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.on.description | Always inline descriptors in the system prompt | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.off.label | Off | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.off.description | Keep descriptors in provider tool schemas only | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.default.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.default.description | Terse, evidence-first engineer; dense, action-oriented replies | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.friendly.label | Friendly | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.friendly.description | Warm, encouraging collaborator focused on momentum and morale | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.pragmatic.label | Pragmatic | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.pragmatic.description | Direct, efficient engineer focused on clarity and rigor | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.none.label | None | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.none.description | Omit the personality block entirely | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.description | Use provider default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.label | 0 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.description | Deterministic | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.2.label | 0.2 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.2.description | Focused | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.5.label | 0.5 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.5.description | Balanced | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.7.label | 0.7 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.7.description | Creative | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.label | 1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.description | Maximum variety | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.description | Use provider default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.1.label | 0.1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.1.description | Very focused | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.3.label | 0.3 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.3.description | Focused | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.5.label | 0.5 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.5.description | Balanced | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.9.label | 0.9 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.9.description | Broad | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.label | 1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.description | No nucleus filtering | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.description | Use provider default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.label | 1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.description | Greedy top token | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.20.label | 20 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.20.description | Focused | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.40.label | 40 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.40.description | Balanced | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.100.label | 100 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.100.description | Broad | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.description | Use provider default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.01.label | 0.01 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.01.description | Very permissive | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.05.label | 0.05 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.05.description | Balanced | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.1.label | 0.1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.1.description | Strict | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.description | Use provider default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.label | 0 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.description | No penalty | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.5.label | 0.5 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.5.description | Mild novelty | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.label | 1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.description | Encourage novelty | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.2.label | 2 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.2.description | Strong novelty | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.label | Default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.-1.description | Use provider default | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.8.label | 0.8 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.0.8.description | Allow repetition | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.label | 1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.description | No penalty | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.1.label | 1.1 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.1.description | Mild penalty | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.2.label | 1.2 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.2.description | Balanced | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.5.label | 1.5 | NO_EN |
| model | settings.model.toolCallLoopGuard.exemptTools.options.1.5.description | Strong penalty | NO_EN |
| interaction | settings.loop.mode.options.3.label | 3 items | NO_EN |
| interaction | settings.loop.mode.options.5.label | 5 items | NO_EN |
| interaction | settings.loop.mode.options.7.label | 7 items | NO_EN |
| interaction | settings.loop.mode.options.10.label | 10 items | NO_EN |
| interaction | settings.loop.mode.options.15.label | 15 items | NO_EN |
| interaction | settings.loop.mode.options.20.label | 20 items | NO_EN |
| interaction | settings.recap.idleSeconds.options.60.label | 1 minute | NO_EN |
| interaction | settings.recap.idleSeconds.options.120.label | 2 minutes | NO_EN |
| interaction | settings.recap.idleSeconds.options.240.label | 4 minutes | NO_EN |
| interaction | settings.recap.idleSeconds.options.300.label | 5 minutes | NO_EN |
| interaction | settings.recap.idleSeconds.options.600.label | 10 minutes | NO_EN |
| context | settings.snapcompact.shape.options.silver16-bw.label | Silver 16, CJK | NO_EN |
| context | settings.snapcompact.shape.options.silver16-bw.description | Embedded Silver TrueType font on a 16px grid for CJK and other non-Latin text. | NO_EN |
| tools | settings.todo.remindersMax.options.1.label | 1 reminder | NO_EN |
| tools | settings.todo.remindersMax.options.2.label | 2 reminders | NO_EN |
| tools | settings.todo.remindersMax.options.3.label | 3 reminders | NO_EN |
| tools | settings.todo.remindersMax.options.5.label | 5 reminders | NO_EN |
| tools | settings.async.pollWaitDuration.options.10s.label | 10 seconds | NO_EN |
| tools | settings.async.pollWaitDuration.options.30s.label | 30 seconds | NO_EN |
| tools | settings.async.pollWaitDuration.options.1m.label | 1 minute | NO_EN |
| tools | settings.async.pollWaitDuration.options.5m.label | 5 minutes | NO_EN |
| tools | settings.async.pollWaitDuration.options.smart.label | Smart | NO_EN |
| tools | settings.async.pollWaitDuration.options.smart.description | Default — adaptive 5s→5m, resets when you stop polling | NO_EN |
| tasks | settings.task.softRequestBudget.options.90.label | 90 requests | NO_EN |
| tasks | settings.task.softRequestBudget.options.200.label | 200 requests | NO_EN |
| tasks | settings.task.softRequestBudget.options.200.description | Default | NO_EN |
| tools | settings.tasks.todoClearDelay.options.60.label | 1 minute | NO_EN |
| tools | settings.tasks.todoClearDelay.options.60.description | Default | NO_EN |
| providers | settings.providers.image.options.openai-codex.label | OpenAI Codex (ChatGPT) | NO_EN |
| providers | settings.providers.image.options.openai-codex.description | Uses a connected Codex / ChatGPT subscription — no OPENAI_API_KEY needed | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.online.label | Online | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.online.description | Use the online model | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.qwen3-1.7b.label | Qwen3 1.7B | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.qwen3-1.7b.description | Disabled for local inference: onnxruntime-node cannot run this ONNX export's Rot | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.llama3.2:3b.label | Llama 3.2 3B | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.llama3.2:3b.description | Larger Llama 3.2 option for local memory/classifier tasks; higher quality potent | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.gemma-3-1b.label | Gemma 3 1B | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.gemma-3-1b.description | Best consolidation/dedup; lighter footprint, but leaks small talk during extract | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.qwen2.5-1.5b.label | Qwen2.5 1.5B | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.qwen2.5-1.5b.description | Best extraction granularity (atomic facts); weaker consolidation. | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.lfm2-1.2b.label | LFM2 1.2B | NO_EN |
| providers | settings.providers.unexpectedStopModel.options.lfm2-1.2b.description | Fastest load; solid all-rounder, slightly noisier extraction labels. | NO_EN |
| providers | settings.providers.kimiApiFormat.options.auto.label | Auto | NO_EN |
| providers | settings.providers.kimiApiFormat.options.auto.description | Use the model's server-declared protocol | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.-1.label | Auto | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.-1.description | Use provider defaults and PI_* timeout env vars | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.0.label | Off | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.0.description | Disable first-event timeout | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.300.label | 5 minutes | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.600.label | 10 minutes | NO_EN |
| providers | settings.providers.streamFirstEventTimeoutSeconds.options.1800.label | 30 minutes | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.-1.label | Auto | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.-1.description | Use provider defaults and PI_* timeout env vars | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.0.label | Off | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.0.description | Disable idle timeout | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.300.label | 5 minutes | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.600.label | 10 minutes | NO_EN |
| providers | settings.providers.streamIdleTimeoutSeconds.options.1800.label | 30 minutes | NO_EN |

## D. description 仍英文

| tab | key | 信息 |
|---|---|---|
| tools | settings.tools.artifactSpillThreshold.options.1.description | ~250 tokens | ~250 tokens |
| tools | settings.tools.artifactSpillThreshold.options.2.5.description | ~625 tokens | ~625 tokens |
| tools | settings.tools.artifactSpillThreshold.options.5.description | ~1.25K tokens | ~1.25K tokens |
| tools | settings.tools.artifactSpillThreshold.options.10.description | ~2.5K tokens | ~2.5K tokens |
| tools | settings.tools.artifactSpillThreshold.options.20.description | ~5K tokens | ~5K tokens |
| tools | settings.tools.artifactSpillThreshold.options.30.description | ~7.5K tokens | ~7.5K tokens |
| tools | settings.tools.artifactSpillThreshold.options.75.description | ~19K tokens | ~19K tokens |
| tools | settings.tools.artifactSpillThreshold.options.100.description | ~25K tokens | ~25K tokens |
| tools | settings.tools.artifactSpillThreshold.options.200.description | ~50K tokens | ~50K tokens |
| tools | settings.tools.artifactSpillThreshold.options.500.description | ~125K tokens | ~125K tokens |
| tools | settings.tools.artifactSpillThreshold.options.1000.description | ~250K tokens | ~250K tokens |
| tools | settings.tools.artifactTailBytes.options.1.description | ~250 tokens | ~250 tokens |
| tools | settings.tools.artifactTailBytes.options.2.5.description | ~625 tokens | ~625 tokens |
| tools | settings.tools.artifactTailBytes.options.5.description | ~1.25K tokens | ~1.25K tokens |
| tools | settings.tools.artifactTailBytes.options.10.description | ~2.5K tokens | ~2.5K tokens |
| tools | settings.tools.artifactTailBytes.options.50.description | ~12.5K tokens | ~12.5K tokens |
| tools | settings.tools.artifactTailBytes.options.100.description | ~25K tokens | ~25K tokens |
| tools | settings.tools.artifactTailBytes.options.200.description | ~50K tokens | ~50K tokens |
| tools | settings.tools.artifactHeadBytes.options.1.description | ~250 tokens | ~250 tokens |
| tools | settings.tools.artifactHeadBytes.options.2.5.description | ~625 tokens | ~625 tokens |
| tools | settings.tools.artifactHeadBytes.options.5.description | ~1.25K tokens | ~1.25K tokens |
| tools | settings.tools.artifactHeadBytes.options.10.description | ~2.5K tokens | ~2.5K tokens |
| tools | settings.tools.artifactHeadBytes.options.50.description | ~12.5K tokens | ~12.5K tokens |
| tools | settings.tools.artifactHeadBytes.options.100.description | ~25K tokens | ~25K tokens |
| tools | settings.tools.artifactHeadBytes.options.200.description | ~50K tokens | ~50K tokens |
| tools | settings.tools.artifactTailLines.options.50.description | ~250 tokens | ~250 tokens |
| tools | settings.tools.artifactTailLines.options.100.description | ~500 tokens | ~500 tokens |
| tools | settings.tools.artifactTailLines.options.250.description | ~1.25K tokens | ~1.25K tokens |
| tools | settings.tools.artifactTailLines.options.1000.description | ~5K tokens | ~5K tokens |
| tools | settings.tools.artifactTailLines.options.2000.description | ~10K tokens | ~10K tokens |
| tools | settings.tools.artifactTailLines.options.5000.description | ~25K tokens | ~25K tokens |

## E. label 仍英文说明

（无）

## F. 分组无中文

| tab | key | 信息 |
|---|---|---|
| interaction | tabs.interaction.groups.Agent | Agent | Agent |
| interaction | tabs.interaction.groups.Git | Git | Git |
| files | tabs.files.groups.LSP | LSP | LSP |
| shell | tabs.shell.groups.Bash | Bash | Bash |
| tools | tabs.tools.groups.GitHub | GitHub | GitHub |
| providers | tabs.providers.groups.Fireworks | Fireworks | Fireworks |
| providers | tabs.providers.groups.Timeouts | Timeouts | None |

## G. 空串

（无）

## H. 重复 key

（无）

## commands
- missing: 0
- extra: 0

## 按 tab 问题计数

- **model**: 81
- **tools**: 48
- **providers**: 34
- **interaction**: 13
- **appearance**: 6
- **tasks**: 3
- **context**: 2
