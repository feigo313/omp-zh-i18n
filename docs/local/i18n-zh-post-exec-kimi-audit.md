# i18n zh realign 执行后审计（Kimi post-exec audit）

- 日期：2026-07-23
- 审计人：Orca dispatched auditor（task i18n-zh-post-exec-audit）
- 对象：`docs/local/i18n-zh-realign-exec-summary.md`（执行声称）vs `docs/local/ACTIVE-TASK-i18n-zh.md`（执行 SoT）vs 包内 lang 实际状态
- 方式：只读核查。未改任何 `zh-*.json` / `en-*.json`，未写 `~/.omp/lang`，未重跑 realign，未触碰 git。统计用一次性 Python（`object_pairs_hook`），全部显式读包内路径；脚本留存于 `docs/local/_audit/`（check-gates.py / check-groups.py）可复跑。

---

## 0. 结论（Verdict）

**PASS**

§4.1 全部硬门禁独立复测通过；R2–R5 各项声称与实测一致或仅有低危出入；无 HIGH/MED 发现，无必须返工项。执行摘要中的数字除一处措辞小误差外全部可复现。

---

## 1. R1/R2 — 硬门禁 §4.1 复测（全部通过）

复测方法：Python `json.loads(object_pairs_hook=...)` 逐文件重复 key 检测 + case-sensitive Set 比对，显式读 `packages/coding-agent/src/i18n/lang`。

| 门禁 | 实测结果 |
|---|---|
| `keys(zh-settings-C) === keys(en-settings-C)`（10 分类） | ✅ 逐类相等：33/60/97/97/105/148/187/140/213/222，合计 **1302 == 1302**，missing=0 / extra=0 |
| `keys(zh-commands) === keys(en-commands)` | ✅ **189 == 189**，missing=0 / extra=0 |
| 无重复 key（object_pairs_hook） | ✅ 22 个目标文件（10 zh-settings + zh-commands + 对应 en）全部 0 重复 |
| 无空串值 | ✅ 11 个 zh 目标文件 `""` 值 = 0 |
| 占位符集合一致 | ✅ **全量**（非抽样）1491 对 `{name}`/`%s`/`{{var}}` 集合比对，0 处不一致 |
| orphan/commands extra 归档 + provenance | ✅ settings 270（10 文件，与 §3.1 逐类一致：2/6/4/13/14/24/30/53/52/72）+ commands 226；每文件含 `_provenance`（source / timestamp / reason=extra-vs-en-*） |
| JSON UTF-8 可 parse | ✅ 全部 |
| 只读包内路径 | ✅ 本审计亦然；见 §4 |

备份核验：`_backup/2026-07-23-pre-realign/` 恰 **15 个** zh-*.json（10 settings + commands + ui/tips/hotkeys/runtime）；备份 key 数 settings=1572 / commands=362，与 §3 实测基线一致 → 备份确为 apply 前状态。

## 2. R3 — F-B groups.N（53 keys）

- 53/53 `tabs.<tab>.groups.N` 在 zh-commands 中就位，无缺失、无空串。
- **51/53 终值与备份 zh-settings extra 精确一致**（exact-key salvage 生效）。
- **2/53 为语义纠偏**：`tabs.providers.groups.4`（en `Timeouts`，备份误作「隐私」→ 已改「超时」）与 `tabs.providers.groups.5`（en `Privacy`，备份误作「超时」→ 已改「隐私」）——即摘要所称 providers 4/5 对调修复，方向正确（备份值确实与现行 EN 相反）。
- 摘要「47 salvaged + 6 空串补译」经对账**成立**：6 个为备份值 == EN 原文的品牌/技术名（`Bash`、`Git`、`GitHub`、`LSP`、`Fireworks`、`Mnemopi`），脚本按规则置空后人工回填同值；2 个 swap 纠偏计入 47 内。47+6=53，无账外操作。
- **未见具名 groups → 下标映射滥用**：全部 53 个终值要么等于备份同 key 字符串值，要么是针对 EN 语义的纠偏/回填；无「按具名分组字符串推导下标译文」的痕迹（抽查 appearance/context/files/shell/providers 全部下标分组，译文与 EN 逐一对应）。

## 3. R4 — 质量抽检

| 项 | 结果 |
|---|---|
| 占位符 parity | ✅ 全量 0 失配（见 §1），超出「抽样」要求 |
| providers swap fix | ✅ 已验证（见 §2），groups.0-5 全部与 EN 对齐（服务/Fireworks/小型模型/协议/超时/隐私） |
| mixed-language fix | ✅ `settings.tools.artifactHeadBytes.options.0.description` = 「已禁用；仅保留尾部截断」（en `Disabled; tail-only truncation`）；「1 hour」→「1 小时」落实于 3 处（tasks.maxRuntimeMs、compaction.idleTimeoutSeconds、tasks.todoClearDelay） |
| zh==en 队列诚实度 | ✅ 重算整句类（含空格+小写）= **38 条**，与摘要 38 一致；内容为 7 个标签/品牌/术语（Eval & Runtimes、Power (macOS)、Exa Websets、GitHub Gist、Top P/K、Min P）+ 31 条 token 估算描述（`~250 tokens` 等），均属 §6.5 可放行形态 |
| N1 消除 | ✅ apply 后跨 zh-settings 文件同 key = **0**（98 → 0，33 个异值随之消失），与摘要一致 |

## 4. R5 — 对抗性检查

| 检查 | 结果 |
|---|---|
| 脚本路径写死 | ✅ `realign-zh-i18n.ts:15` `LANG_DIR = join(import.meta.dir, "..", "src", "i18n", "lang")`；文件头注释声明「never write ~/.omp/lang」 |
| 未调禁用脚本 | ✅ realign/validate-gates 内无 `extract-settings-translations` / `generate-zh-templates` / `translate-settings-batch` / `gen-i18n-keys` 引用或 spawn |
| 未改 en | ✅ 全部 en-*.json mtime = 2026-07-23 14:24:47（仓库快照时间），早于 zh 编辑（19:55–19:58）；与 untouched zh-ui/tips/hotkeys/runtime 同戳 |
| 未写 `~/.omp/lang` | ✅ `~/.omp/` 下仍只有残留 `lan/`，无 `lang/`；`lan` 未被改名 |
| 改动面 | ✅ 仅 10 个 zh-settings + zh-commands 有编辑 mtime；zh-ui/tips/hotkeys/runtime 与备份逐字节相同（`filecmp` 验证） |
| 归档时间戳 | ✅ provenance 时间戳 11:55 UTC = 本地 19:55，与文件 mtime 自洽 |

## 5. 发现清单（severity-tagged）

### LOW-1（提示）— 摘要 token 条数口径小误差
摘要称「`~250 tokens` 等 **28** 条」，实测 token 估算类为 **31** 条（spillThreshold 11 + tailBytes 7 + headBytes 7 + tailLines 6）。38 总数正确，仅分项计数差 3。不影响门禁与结论，无需改文件。

### LOW-2（提示，无需处理）— 一次性脚本风格
`realign-zh-i18n.ts` 使用 `console.log/error` 与 `readFileSync/writeFileSync`，与仓库「logger 优先 / Bun 优先」惯例不符。属一次性迁移脚本、不进运行时路径，按「最小改动」原则不建议为此返工；若未来保留为常驻工具再收敛。

### LOW-3（提示）— 审计脚手架留存
本审计在 `docs/local/_audit/` 留下 2 个复测脚本（check-gates.py / check-groups.py）。保留便于复核；如不需可由协调方删除。

## 6. 结论与后续

**PASS** — 无 HIGH/MED 发现，无需 MiMo 返工项。LOW-1 可在下轮文档顺手修订，不阻塞。

软门禁 §4.2 覆盖度说明：跨文件异值（N1）已消除并经复测；zh==en 队列 38 条已重算；明显错译已抽检（providers swap、两组 mixed-language 修复均坐实）。可选 TUI smoke（§4.2 末项）非硬门禁，本轮未跑——若要对终端用户可见面做最终背书，建议在隔离 `~/.omp/lang` 前提下补一次 `OMP_LANG=zh` smoke。

## 7. 审计边界

- 未执行任何写操作于 lang 目录；未跑 realign；未做 TUI smoke。
- 「未改 en」的论据为 mtime + 快照同戳，仓无 git，无法做内容级 diff；在现有约束下此为最强可得证据。
- 占位符为正则形态比对（`{name}` / `%s` / `{{var}}`），未做 printf 位置参数语义级验证。
