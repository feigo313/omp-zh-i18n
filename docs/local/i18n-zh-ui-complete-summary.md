# i18n zh UI 补全执行摘要

> **日期**：2026-07-23  
> **前置**：settings+commands 已对齐（第一轮 PASS）  
> **本轮范围**：zh-ui.json 去重 + Welcome/Settings 壳层 i18n + P1 底栏

---

## 执行概要

| 步骤 | 状态 | 说明 |
|---|---|---|
| A. 备份 | ✅ | `_backup/2026-07-23-pre-ui-complete/`（zh-ui/tips/hotkeys/runtime） |
| B. 去重 zh-ui | ✅ | 19 组重复 key 全部解决（值相同保留一条；值不同取更完整/更中文） |
| C. §2.1 Welcome keys | ✅ | 13 个 `interceptWelcomeString` key 写入中文 |
| D. §2.2 Settings 壳 | ✅ | `ui.settings.title` / `ui.settings.noResults` / `tabs.plugins.label` 中文 |
| E. P1 底栏 | ✅ | `settings-selector.ts` 5 个分支全部走 `interceptUIString` |
| F. 门禁 | ✅ | 零重复、零空串、§2.1/§2.2 全部中文 |
| G. 摘要 | ✅ | 本文件 |

---

## 去重详情（19 组）

| key | 冲突值 | 保留 |
|---|---|---|
| `ui.askDialog.reviewAnswers` | "审查答案" ×2 | 同值，去重 |
| `ui.modelHub.newFallbackChain` | 同 ×2 | 同值，去重 |
| `ui.modelHub.addAnApi` | 同 ×2 | 同值，去重 |
| `ui.userMessageSelector.noUserMessages` | 同 ×2 | 同值，去重 |
| `ui.userMessageSelector.noMatchingMessages` | 同 ×2 | 同值，去重 |
| `ui.hookSelector.noMatchingOptions` | 同 ×2 | 同值，去重 |
| `ui.moveOverlay.moveToDirectory` | 同 ×2 | 同值，去重 |
| `ui.extensionList.noExtensionsFound` | 同 ×2 | 同值，去重 |
| `ui.extensionList.masterSwitch` | "（主开关）" / "(主开关)" | 保留全角括号版 |
| `ui.extensionDashboard.extensionControlCenter` | 同 ×2 | 同值，去重 |
| `ui.treeSelector.noEntriesFound` | 同 ×2 | 同值，去重 |
| `ui.treeSelector.pressBackspaceTo` | 同 ×2 | 同值，去重 |
| `ui.treeSelector.pressAltaTo` | 同 ×2 | 同值，去重 |
| `ui.snapcompactShapePreview.graphicSampleNeeds` | 全角/半角括号 | 保留全角版 |
| `ui.modelPicker.switchModel` | 同 ×2 | 同值，去重 |
| `ui.omfgPanel.escCancelOmfg` | 同 ×2 | 同值，去重 |
| `ui.resetUsageSelector.selectSpendA` | 同 ×2 | 同值，去重 |
| `ui.sessionSelector.noSessionsFound` | 同 ×2 | 同值，去重 |
| `ui.sessionSelector.noSessionsIn` | 同 ×2 | 同值，去重 |

---

## 新增 Welcome keys（§2.1）

| key | 中文 |
|---|---|
| `back` | 欢迎回来！ |
| `welcome.back` | 欢迎回来！ |
| `noRecentSessions` | 暂无最近会话 |
| `noLspServers` | 无 LSP 服务器 |
| `tips` | 提示 |
| `tips.promptActions` |  打开提示操作 |
| `tips.commands` |  打开命令 |
| `tips.bash` |  运行 bash |
| `tips.python` |  运行 python |
| `lspServers` | LSP 服务器 |
| `recentSessions` | 最近会话 |
| `tipLabel` | 提示： |
| `nerdfont` | 请使用 Nerd Font 😭。 |

## 新增 Settings 壳 keys（§2.2）

| key | 中文 |
|---|---|
| `ui.settings.title` | 设置 |
| `ui.settings.noResults` | 无匹配的设置项 |
| `tabs.plugins.label` | 插件 |

## P1 底栏 keys

| key | 中文 |
|---|---|
| `ui.settings.footer.search` | Enter 更改 · Tab 跳转标签页 · Esc 退出搜索 |
| `ui.settings.footer.plugins` | Tab 切换标签页 · Esc 关闭 |
| `ui.settings.footer.sectionFocus` | ↑/↓ 跳转分组 · Tab/Enter 进入设置 · ←/→ 切换标签页 · Esc 关闭 |
| `ui.settings.footer.withSections` | Enter/Space 更改 · Tab 跳转分组 · ←/→ 切换标签页 · 输入搜索 · Esc 关闭 |
| `ui.settings.footer.withoutSections` | Enter/Space 更改 · Tab 切换标签页 · 输入搜索 · Esc 关闭 |

---

## 代码变更

### `settings-selector.ts`

`#footerHintText()` 5 个返回分支全部包裹 `interceptUIString(key, englishFallback)`：

1. search 模式 → `ui.settings.footer.search`
2. plugins tab → `ui.settings.footer.plugins`
3. section focused → `ui.settings.footer.sectionFocus`
4. hasSectionJump → `ui.settings.footer.withSections`
5. noSectionJump → `ui.settings.footer.withoutSections`

---

## 门禁结果

| 门禁 | 结果 |
|---|---|
| zh-ui 重复 key = 0 | ✅ PASS |
| §2.1 全部 key 存在且中文 | ✅ PASS |
| §2.2 全部 key 存在且中文 | ✅ PASS |
| 零空串值 | ✅ PASS |
| P1 底栏三分支走 interceptUIString | ✅ PASS |
| 未改 en-* | ✅ PASS |
| 摘要文件存在 | ✅ 本文件 |

---

## P2 Backlog（不阻塞）

- settings 中仍英文的选项标签（`Rewrite Scrollback` 等）—— 约 20 条明显可译
- zh-hotkeys / zh-runtime 抽检
- 欢迎 tip 轮播内容：zh-tips 与 TIP_KEYS 对齐抽检
