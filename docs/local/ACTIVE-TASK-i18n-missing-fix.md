# ACTIVE: 补全 schema 未进 en/zh 的设置项 + 清残留英文

> **状态**：主清单已修；**残留 P1 待办**（主题名字）  
> **更新**：2026-07-23 晚  
> **SoT**：本文件 + 清单 `docs/local/i18n-untranslated-inventory-2026-07-23.md`  
> **Worker**：仅 **MiMo**（复用已有终端，禁止新开）  
> **校验**：Coord（Grok）自检；**不要 Kimi**  

### 追加遗漏（未修）

- **P1 主题名字**：外观 → 深色/浅色主题 **选项列表中的主题名**（titanium/light/…）全部未翻译。详见 `docs/local/i18n-changelog-2026-07-23.md` §已知遗漏。
- **P1 模型 Prewalk 分组**：**已修** — `tabs.model.groups.Prewalk` = 预走查。
- **P1 主题名字**（仍开）：外观深色/浅色主题选项列表中的主题名未译。

---

## 0. 根因（已核实，禁止再「假完成」）

1. UI 文案来自 `settings-schema.ts` 的 `path` + `ui.label/description`。  
2. 运行时翻译 key 为：`settings.{path}.label` / `settings.{path}.description`。  
3. **大量 path 从未写入 `en-settings-*.json` / `zh-settings-*.json`** → `i18n.t` 找不到 key → **直接显示 schema 英文**。  
4. 这就是实机看到的：`Generate Image`、`Refresh Title on Replan`、`Generic Task Prewalk`、`Rewrite Scrollback`、`xd:// Tools`、`Launch`、`Ask`、`Todo Reminder Limit` 等。  
5. 此前「keys(zh)==keys(en)」只证明 **json 互相对齐**，**不能**证明 **覆盖了全部 schema UI path**。  
6. 幽灵 key（`task.isolation.apply` / `mcp.renderMarkdownResults`）**schema 无 path**，必须删除，禁止当 17.0.9 完成证据。

---

## 1. 强制交付物

| # | 交付 |
|---|---|
| D1 | 清单内 **全部 MISSING/NO_EN** 项写入对应 `en-settings-*.json`（英文用 schema 原文） |
| D2 | 同一批 key 写入 `zh-settings-*.json`（**合格中文**，非机翻残留英文） |
| D3 | 清单 **仍英文/夹生** 项全部改译（§2 表 C） |
| D4 | 删除 4 个幽灵 key（en+zh） |
| D5 | `zh-ui.json`：`ui.agentHub.agentHub` → 中文（如「代理中心」） |
| D6 | 回归脚本：对 `settings-schema.ts` 每个带 `ui.label` 的 path，断言 `settings.{path}.label` 在 zh 中存在且含汉字（白名单除外） |
| D7 | 摘要 `docs/local/i18n-missing-fix-summary.md`：补了多少 key、按 tab 列表、删幽灵、抽检句 |

---

## 2. 必补清单（来自自动扫描，禁止遗漏）

完整表：`docs/local/i18n-untranslated-inventory-2026-07-23.md`

### 2.1 缺失于 en/zh（NO_EN）— 必须新增 en+zh

| key | schema 英文 label/desc（摘要） | 建议分类文件 |
|---|---|---|
| `settings.tui.scrollbackRebuild.label` | Rewrite Scrollback | appearance |
| `settings.tui.scrollbackRebuild.description` | Erase and replay terminal scrollback… | appearance |
| `settings.display.collapseCompacted.label` | Collapse Compacted History | appearance |
| `settings.display.collapseCompacted.description` | Collapse pre-compaction history… | appearance |
| `settings.tui.imeSafeCursor.label` | IME-Safe Prompt Layout | appearance |
| `settings.tui.imeSafeCursor.description` | Move the prompt's bottom border… | appearance |
| `settings.todo.remindersMax.label` | Todo Reminder Limit | tools |
| `settings.todo.remindersMax.description` | Maximum number of todo reminders… | tools |
| `settings.launch.enabled.label` | Launch | tools |
| `settings.launch.enabled.description` | Enable the launch tool… | tools |
| `settings.generate_image.enabled.label` | Generate Image | tools |
| `settings.generate_image.enabled.description` | Enable the generate_image tool… | tools |
| `settings.ask.enabled.label` | Ask | tools |
| `settings.ask.enabled.description` | Enable the ask tool… | tools |
| `settings.tools.xdev.label` | xd:// Tools | tools |
| `settings.tools.xdev.description` | Mount rarely-used tools under xd://… | tools |
| `settings.title.refreshOnReplan.label` | Refresh Title on Replan | tasks |
| `settings.title.refreshOnReplan.description` | Refresh generated session titles… | tasks |
| `settings.task.prewalk.label` | Generic Task Prewalk | tasks |
| `settings.task.prewalk.description` | Arm prewalk for bundled generic task… | tasks |
| `settings.prewalk.enabled.label` | Enable Prewalk | model/tasks（按 schema tab） |
| `settings.prewalk.enabled.description` | Start on the active model, then switch… | 同上 |
| `settings.auth.broker.token.label` | Auto Resume | interaction/providers（按 schema tab） |
| `settings.auth.broker.token.description` | Automatically resume the most recent session… | 同上 |
| `settings.tier.openai.label` | Service Tier — OpenAI | model |
| `settings.tier.openai.description` | Processing tier for OpenAI… | model |
| `settings.tier.anthropic.label` | Service Tier — Anthropic | model |
| `settings.tier.google.label` | Service Tier — Google | model |
| `settings.tier.google.description` | Processing tier for Gemini… | model |
| `settings.tier.subagent.label` | Service Tier — Subagent | model |
| `settings.tier.subagent.description` | Service Tier for spawned task/eval… | model |
| `settings.tier.advisor.label` | Service Tier — Advisor | model |
| `settings.tier.advisor.description` | Service Tier for the advisor model… | model |
| `settings.recap.enabled.label` | Idle Recap | interaction/appearance（按 tab） |
| `settings.recap.enabled.description` | Generate a brief LLM recap… | 同上 |
| `settings.recap.idleSeconds.label` | Idle Recap Delay | 同上 |
| `settings.recap.idleSeconds.description` | Seconds to wait while idle… | 同上 |
| `settings.edit.enforceSeenLines.label` | Enforce Seen-Line Guard | files |
| `settings.edit.enforceSeenLines.description` | Reject edits anchored on lines… | files |
| `settings.providers.webSearchGeminiModel.label` | Gemini web_search model | providers |
| `settings.providers.webSearchGeminiModel.description` | Model ID for Gemini Google Search… | providers |
| `settings.speech.enhanced.label` | Enhanced Speech Rewriting | tools/interaction |
| `settings.speech.enhanced.description` | Rewrite assistant output into natural spoken… | 同上 |
| `settings.exa.enabled.label` | Exa | providers |
| `settings.exa.enabled.description` | Master toggle for all Exa search tools | providers |
| `settings.providers.maxInFlightRequests.description` | （以 schema 原文为准，扫描器摘录可能偏差，**以 schema 为准**） | providers |

> **执行时必须以 schema 原文全文为准**，不要用本表截断英文。  
> 分类文件：看 schema `ui.tab` 映射到 `zh-settings-{tab}.json`（appearance/tools/tasks/…）。

### 2.2 夹生/仍英文 — 必须改译

| key | 当前问题 | 目标 |
|---|---|---|
| `settings.worktree.base.label` | `Worktree 基础目录` | 如「Worktree 基础目录」→「工作树基础目录」或「Worktree 根目录」（全文中文说明优先） |
| `settings.task.showResolvedModelBadge.label` | `显示 Resolved 模型 Badge` | 如「显示解析后的模型徽章」 |
| `settings.providers.openaiWebsockets.label` | OpenAI WebSocket | 可保留品牌；若做说明则 description 必须中文（label 可 `OpenAI WebSocket` 白名单） |
| `settings.exa.enableWebsets.label` | Exa Websets | 品牌可留；**description 必须中文** |
| `settings.images.describeForTextModels.label` | 含 Describe/Text 英文夹生 | 纯中文 |

### 2.3 幽灵 key — 必须删除（en + zh）

```
settings.task.isolation.apply.label
settings.task.isolation.apply.description
settings.mcp.renderMarkdownResults.label
settings.mcp.renderMarkdownResults.description
```

### 2.4 zh-ui

| key | 现状 | 目标 |
|---|---|---|
| `ui.agentHub.agentHub` | Agent Hub | 代理中心（或「智能体中心」） |

### 2.5 可选但建议

- 修正 `settings.task.isolation.mode.description` 若与 en 语义错位（曾出现 en「No isolation」对 zh「任务隔离模式」类错误）—— **对照 schema 全文** 校正。  
- 版本显示仍 17.0.8：查 `VERSION` 常量来源，与 `package.json` 对齐（若改动小可一并修；大改写进摘要「未做」原因）。

---

## 3. 白名单（仅 label 可保留英文）

短 token/品牌：`APFS` `ZFS` `btrfs` `ProjFS` `Overlayfs` `Reflink` `Unicode` `ASCII` `MCP` `LSP` `GitHub` `OpenAI` `Exa` `Exa Websets` `true/false` `auto` 数字与 `N KB`/`N%`/`~N tokens`。

**禁止**：多词英文 label（含空格的英文标题）当白名单 — 必须中文。

---

## 4. 算法（MiMo 逐步）

```text
A. 备份 lang → _backup/2026-07-23-pre-missing-fix/
B. 解析 settings-schema.ts：每个 path + ui.label/description
C. for each:
     keyL = settings.{path}.label
     keyD = settings.{path}.description
     若 en 无 → 写入对应 en-settings-{tab}.json（schema 英文）
     若 zh 无或空或仍英/夹生 → 写中文
D. 删幽灵 4 key
E. 修 zh-ui Agent Hub
F. 生成脚本 gate（推荐 packages/coding-agent/scripts/check-schema-i18n.ts 或 .py）:
     解析 schema → 断言每 path 的 label key 在 zh 且含汉字（白名单例外）
G. 硬门禁全过 + 摘要
H. 不 commit；不写 ~/.omp/lang
```

---

## 5. 硬门禁（Coord 将按此拒收）

- [ ] 清单 §2.1 **每一条** en 有、zh 有、zh 含汉字（白名单 label 除外）  
- [ ] 清单 §2.2 夹生项已消失  
- [ ] 幽灵 4 key **不存在**  
- [ ] schema 全量扫描：missing path→i18n = **0**（白名单除外）  
- [ ] 无空串、无重复 key  
- [ ] 摘要列出全部新增 key 与中文样例  
- [ ] **禁止**只报「keys(zh)==keys(en)」交差  

---

## 6. 角色

| 谁 | 做 |
|---|---|
| MiMo | 全文执行 A–H |
| Grok | worker_done 后脚本终验 + 可选 Orca 打开设置抽查 |
| Kimi | 不参与 |
