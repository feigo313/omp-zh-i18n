# i18n zh UI 补全执行后审计（Kimi audit）

- 日期：2026-07-23
- 审计人：Orca dispatched auditor（task i18n-zh-ui-complete-audit）
- 对象：`docs/local/i18n-zh-ui-complete-summary.md`（执行声称）vs `docs/local/ACTIVE-TASK-i18n-zh-ui-complete.md`（SoT）vs 包内实际状态
- 方式：只读核查 + 一次只读运行时 smoke。未改任何 zh/en json 或 ts，未写 `~/.omp/lang`，未触碰 git。统计脚本：`docs/local/_audit/check-zh-ui.py`（Python `object_pairs_hook`）可复跑。

---

## 0. 结论（Verdict）

**PASS**

P0（去重 + Welcome/Settings 壳层 key）与 P1（settings-selector 底栏 i18n 化）全部声称经独立复测成立，硬门禁 §4 全过，且运行时 smoke 确认真实 i18n 栈解析出中文。仅 1 处 LOW 文档措辞瑕疵，无需返工。

---

## 1. R2 — zh-ui 门禁复测（全过）

| 门禁 | 实测 |
|---|---|
| 重复 key = 0 | ✅ `object_pairs_hook` 扫描 134 keys，0 重复 |
| 空串 = 0 | ✅ 0 个 `""` 值 |
| 备份基线 | ✅ `_backup/2026-07-23-pre-ui-complete/zh-ui.json` 恰有 **19 组**重复 key，且 key 名单与摘要去重表**逐一相同** → 去重真实发生且范围吻合 |
| §2.1 Welcome 13 keys | ✅ 全部存在、非空、含 CJK；`nerdfont` = 「请使用 Nerd Font 😭。」品牌+emoji 合规 |
| 前导空格 | ✅ `tips.promptActions/commands/bash/python` 四 key 译文均保留前导空格（与 EN fallback `" for ..."` 形态一致） |
| §2.2 三 keys | ✅ `ui.settings.title`=设置、`ui.settings.noResults`=无匹配的设置项、`tabs.plugins.label`=插件 |
| 占位符 parity | ✅ 新 key 无 `{name}`/`%s`，与 EN fallback 集合一致 |

`interceptor.ts:96-110` 的 `englishMap` 恰为 §2.1 的 13 个 key —— SoT 契约与实际代码一致，无遗漏 key。

## 2. R3 — P1 底栏代码复测（全过）

`settings-selector.ts` `#footerHintText()`（L496–509）**5 个返回分支**全部走 `interceptUIString(key, englishFallback)`：

1. L498 search → `ui.settings.footer.search`
2. L501 plugins tab → `ui.settings.footer.plugins`
3. L504 section focused → `ui.settings.footer.sectionFocus`
4. L507 hasSectionJump → `ui.settings.footer.withSections`
5. L508 noSectionJump → `ui.settings.footer.withoutSections`

- 全文件 grep 确认：底栏相关英文串（`Esc to close` / `to change` / `Type to search` / `to jump`）**仅**作为 `interceptUIString` 的 fallback 出现，**无残留硬编码英文底栏**。
- 5 个 footer key 在 zh-ui 全部存在且为中文（值与摘要表逐字一致）。
- `interceptUIString` 语义 = `i18n.t(key, english)`（interceptor.ts:86-88），扁平 key 与 zh-ui 存放方式匹配。
- 旁证：`ui.settings.title`（L569）、`ui.settings.noResults`（L675）、`tabs.plugins.label`（L795）同样经 `interceptUIString` 接入。

## 3. R4 — 备份 / en 完整性 / 摘要准确性

| 项 | 实测 |
|---|---|
| 备份目录 | ✅ 存在，恰含 zh-ui / zh-tips / zh-hotkeys / zh-runtime 四文件 |
| 改动面 | ✅ 四文件中**仅 zh-ui.json 被修改**（20:53），tips/hotkeys/runtime 与备份**逐字节相同**（filecmp） |
| en-* 未改 | ✅ `en.json` / `en-commands.json` mtime = 14:24:47（仓库快照时间），早于本轮编辑 |
| 未写 `~/.omp/lang` | ✅（沿用第一轮核查结论，本轮无新增写入迹象） |
| 摘要数字 | ✅ 19 组去重、13 welcome keys、3 shell keys、5 footer keys、5 分支 —— 全部与实测一致 |

## 4. 运行时 smoke（软门禁，实测补强）

SoT §5 可选命令实际执行（`OMP_LANG=zh`，包内 i18n 初始化）：

```text
["提示","欢迎回来！"," 运行 bash","请使用 Nerd Font 😭。","设置","Tab 切换标签页 · Esc 关闭","插件"]
```

`interceptWelcomeString` / `interceptUIString` 在真实加载链路上全部解析为中文，含前导空格保留。欢迎页与设置壳层的用户可见面已确认为中文。

## 5. 发现清单（severity-tagged）

### LOW-1（文档措辞，无需改文件）— 摘要门禁表「底栏三分支」与正文「5 个分支」不一致
摘要正文与 P1 keys 表正确写明 5 分支 / 5 keys（SoT 原文按「约 3 分支」估算，实际代码有 5 个返回路径，MiMo 按实际补全——做法正确且为超集）；但摘要「门禁结果」表沿用了 SoT 的「三分支」措辞。纯文档瑕疵，代码与数据无问题。可在下轮文档顺手修订。

## 6. 审计边界

- 仓无 git，`settings-selector.ts` 无法做内容级 diff；「P1 仅改底栏」的论据为 grep 全文件无其他底栏英文残留 + mtime。标题/空结果/plugins label 三处 `interceptUIString` 调用无法区分是本轮新增还是先前已有，但两种情形均不影响门禁结论。
- P2 backlog（~20 条选项标签补译、zh-hotkeys/runtime 抽检、tips 轮播对齐）按 SoT 不阻塞，本轮未核。
- 未做 TUI 全界面肉眼巡检；以运行时 smoke 代替，覆盖本轮全部新增 key 路径。
