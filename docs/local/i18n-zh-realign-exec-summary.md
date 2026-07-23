# i18n zh realign 执行摘要

> **日期**: 2026-07-23
> **包版本**: 17.0.8
> **执行 SoT**: `docs/local/ACTIVE-TASK-i18n-zh.md`

---

## 执行概要

对 `packages/coding-agent/src/i18n/lang/` 下 10 个 `zh-settings-*.json` 和 `zh-commands.json` 执行 key 集对齐，按 EN 契约重建，归档多余 key，补译缺失项。

## 变更统计

### Settings（10 分类）

| 类别 | EN | ZH (前) | ZH (后) | 归档 |
|---|---:|---:|---:|---:|
| shell | 33 | 35 | 33 | 2 |
| files | 60 | 66 | 60 | 6 |
| memory | 97 | 101 | 97 | 4 |
| appearance | 97 | 110 | 97 | 13 |
| tasks | 105 | 119 | 105 | 14 |
| providers | 148 | 172 | 148 | 24 |
| model | 187 | 217 | 187 | 30 |
| interaction | 140 | 193 | 140 | 53 |
| context | 213 | 265 | 213 | 52 |
| tools | 222 | 294 | 222 | 72 |
| **合计** | **1302** | **1572** | **1302** | **270** |

### Commands

| | 前 | 后 |
|---|---:|---:|
| keys | 362 | 189 |
| 归档 | — | 226 |
| salvaged | — | 47 |
| 空串补译 | — | 6 |

## 执行步骤

1. **备份** → `lang/_backup/2026-07-23-pre-realign/`（15 个 zh-*.json）
2. **Report** → 确认 §3 量级一致；N1 跨文件异值 33 个
3. **Settings --apply** → 按 EN 重建，270 个 extra 归档至 `_archive/orphan-settings-*.json`
4. **Commands --apply** → 按 EN 重建，226 个 extra 归档至 `_archive/zh-commands-extra.json`；47 个 `groups.N` 从备份 exact-key salvage；修复 2 个 providers groups 4/5 翻译对调（隐私↔超时）
5. **Quality fix** → 修复 "1 hour"→"1 小时"，修复 "已禁用; tail-only truncation"→"已禁用；仅保留尾部截断"
6. **Hard gate 验证** → 全过

## Hard Gate 验证结果

- [x] 每个 `zh-settings-*.json`: `keys(zh) === keys(en)` ✓
- [x] `zh-commands.json`: `keys(zh) === keys(en)` ✓
- [x] 无重复 key（target 文件）✓
- [x] 无空串值 ✓
- [x] JSON UTF-8 可 parse ✓

## N1 跨文件同 key 异值（33 个）

apply 后已消除（每个 key 只在一个 zh-settings 文件中存在）。

## 归档路径

- Settings: `lang/_archive/orphan-settings-{shell,files,memory,...}.json`
- Commands: `lang/_archive/zh-commands-extra.json`
- 包含 `_provenance` 元数据（来源文件、时间戳、原因）

## zh==en 白名单外（38 条，均为合理保留）

- Group 标签名: `Eval & Runtimes`, `Power (macOS)`
- 品牌名: `Exa Websets`, `GitHub Gist`
- 技术术语: `Top P`, `Top K`, `Min P`
- Token 估算描述: `~250 tokens` 等 28 条

## 脚本

- `packages/coding-agent/scripts/realign-zh-i18n.ts` — 主工具
- `packages/coding-agent/scripts/validate-gates.ts` — 门禁验证

## 未变更

- `en-*.json` — 未修改
- `zh-ui.json` / `zh-tips.json` / `zh-hotkeys.json` / `zh-runtime.json` — 仅备份，未修改（另开任务）
- 无 git commit
