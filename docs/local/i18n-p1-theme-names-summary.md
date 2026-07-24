# P1 主题名中文化 — 完成摘要

> 2026-07-24 | Worker: MiMo

## 改动文件

| 文件 | 变更 |
|---|---|
| `packages/coding-agent/src/modes/components/settings-selector.ts` | 第 939–943 行：theme.dark/theme.light 下拉选项的 `label` 从裸 `t` 改为 `i18n.t(\`themes.${t}.label\`, t)` |
| `packages/coding-agent/src/i18n/lang/en-settings-appearance.json` | 新增 93 条 `themes.<id>.label` 键（内置主题英文显示名） |
| `packages/coding-agent/src/i18n/lang/zh-settings-appearance.json` | 新增 93 条 `themes.<id>.label` 键（内置主题中文显示名） |

## 验证

- **Prewalk 分组名**：`tabs.model.groups.Prewalk` 在 `zh-settings-model.json` 已为 `预走查`，无需改动（先前已修）。
- **JSON 校验**：en/zh 两个 appearance JSON 均解析通过。

## 示例对照（OMP_LANG=zh）

| 主题 ID | 英文 label | 中文 label |
|---|---|---|
| titanium | Titanium | 钛色 |
| light | Light | 浅色 |
| dark | Dark | 深色 |
| dark-catppuccin | Dark Catppuccin | 暗色·猫咖 |
| dark-dracula | Dark Dracula | 暗色·德古拉 |
| dark-tokyo-night | Dark Tokyo Night | 暗色·东京夜 |
| light-frost | Light Frost | 亮色·霜 |
| obsidian | Obsidian | 黑曜石 |
| alabaster | Alabaster | 雪花白 |

## 机制

`i18n.t("themes.<id>.label", fallback)` — 有翻译时显示中文，无翻译时 fallback 回英文原始主题 ID。用户自定义主题无映射则保持原名。配置存储值不受影响（仍为英文 theme id）。
