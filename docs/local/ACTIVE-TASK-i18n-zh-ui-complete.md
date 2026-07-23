# ACTIVE: i18n 中文 UI/欢迎页/壳层补全（第二轮）

> **状态**：**已完成** — MiMo 执行 + Kimi **PASS** + Grok 终审通过（2026-07-23）  
> **更新**：2026-07-23  
> **前置**：settings+commands 已对齐（见 `ACTIVE-TASK-i18n-zh.md` / Kimi post-exec PASS）  
> **本文件是本轮执行 SoT**  
> **摘要**：`docs/local/i18n-zh-ui-complete-summary.md`  
> **审计**：`docs/local/i18n-zh-ui-complete-kimi-audit.md`  
> **LOW**：摘要写「3 branches」实为 **5** 个 footer 分支（不阻塞）

---

## 0. 为何要做

实机 Orca 打开 `omp` + `OMP_LANG=zh` 后：

| 区域 | 现象 | 根因 |
|---|---|---|
| `/settings` 各 tab/分组/多数选项 | 已中文 | settings 本轮已对齐 |
| 欢迎首页 Tips / Welcome back / LSP / Recent | **仍英文** | `interceptWelcomeString` 的 key **全部缺失**于 zh 文件，回退 englishMap |
| Settings 标题 "Settings"、空结果、Plugins | **仍英文** | `ui.settings.title` / `ui.settings.noResults` / `tabs.plugins.label` 缺失 |
| Settings 底栏 Enter/Space… | **仍英文** | `settings-selector.ts` **硬编码**英文字符串，未走 i18n |
| `zh-ui.json` | 19 组**重复 key** | JSON 后写覆盖，不可预测 |

第一轮 **刻意不做** `zh-ui` / `zh-tips` / `zh-hotkeys` / `zh-runtime`（无平行 en 分片）。本轮补完用户可见壳层。

---

## 1. 范围

### 1.1 必做（P0）

只改（除非 P1 明确需要代码）：

```text
packages/coding-agent/src/i18n/lang/zh-ui.json
packages/coding-agent/src/i18n/lang/zh-tips.json   # 若欢迎 key 放 tips 也可，优先 zh-ui 与 interceptor 习惯一致
```

| 项 | 动作 |
|---|---|
| **W1** | 去重 `zh-ui.json` 全部重复 key（实测 **19** 组）：保留语义正确的一条；改前用 `object_pairs_hook` 列出冲突值 |
| **W2** | 写入 `interceptWelcomeString` 全套 key（见 §2.1）中文 |
| **W3** | 写入 settings 壳层 key：`ui.settings.title`、`ui.settings.noResults`、`tabs.plugins.label` |
| **W4** | 备份：`lang/_backup/2026-07-23-pre-ui-complete/` 至少含 zh-ui / zh-tips / zh-hotkeys / zh-runtime |
| **W5** | 门禁：目标文件无重复 key、无空串、占位符 `{name}` 与英文 fallback 一致（若有） |

### 1.2 强烈建议（P1，允许小改 TS）

```text
packages/coding-agent/src/modes/components/settings-selector.ts  # 仅底栏 3 处硬编码
packages/coding-agent/src/i18n/lang/zh-ui.json                   # 对应 key
```

将约 L501–507 的底栏字符串改为 `interceptUIString("ui.settings.footer....", "English...")`，并在 zh-ui 补中文：

| key（建议） | EN fallback（与现码一致） |
|---|---|
| `ui.settings.footer.plugins` | `Tab to switch tabs · Esc to close` |
| `ui.settings.footer.sectionFocus` | `↑/↓ to jump sections · Tab/Enter to settings · ←/→ to switch tabs · Esc to close` |
| `ui.settings.footer.default` | 由代码拼装；或拆成 `navWithSections` / `navTabsOnly` + 模板 `ui.settings.footer.main` |

**最小改法**：一个 `interceptUIString` 包住最终 return 的完整英文串（3 个分支各一 key），避免过度设计。

### 1.3 本轮不做

| 项 | 原因 |
|---|---|
| 再动 10 个 `zh-settings-*` / `zh-commands` | 已 PASS；仅当发现本轮误伤再修 |
| `en-*.json` / `en.json` | 不改 EN 契约 |
| 全量 CLI `--help` 汉化 | 另一轨；非欢迎/设置壳 |
| 硬编码散落在 model-hub / setup-wizard 等的英文 | 列 backlog，不阻塞 P0/P1 |
| 写 `~/.omp/lang`；改 `lan`→`lang` | 禁止 |
| git commit | 禁止除非用户要求 |

### 1.4 可选（P2 backlog，摘要进报告即可）

- settings 中仍英文的选项标签（`Rewrite Scrollback` 等）—— 多为 `zh==en` 放行或漏译，**抽 20 条明显中文可译的补**，不做全量
- `zh-hotkeys` / `zh-runtime` 抽检（目前大体已中文）
- 欢迎 tip 轮播内容：`zh-tips` 与 `TIP_KEYS` 对齐抽检

---

## 2. Key 契约（执行对照）

### 2.1 Welcome（`interceptor.ts` `interceptWelcomeString`）

| key | 英文 fallback（勿改语义） | 建议中文 |
|---|---|---|
| `back` | Welcome back! | 欢迎回来！ |
| `welcome.back` | Welcome back! | 欢迎回来！ |
| `noRecentSessions` | No recent sessions | 暂无最近会话 |
| `noLspServers` | No LSP servers | 无 LSP 服务器 |
| `tips` | Tips | 提示 |
| `tips.promptActions` | ` for prompt actions`（前导空格保留） | ` 打开提示操作` 或 ` 提示操作`（保持前导空格） |
| `tips.commands` | ` for commands` | ` 打开命令` |
| `tips.bash` | ` to run bash` | ` 运行 bash` |
| `tips.python` | ` to run python` | ` 运行 python` |
| `lspServers` | LSP Servers | LSP 服务器 |
| `recentSessions` | Recent sessions | 最近会话 |
| `tipLabel` | Tip:  | 提示： |
| `nerdfont` | Please use nerdfont 😭. | 请使用 Nerd Font 😭。 |

**存放**：建议全部写入 `zh-ui.json`（扁平 key，与 `i18n.t(key)` 一致）。

### 2.2 Settings 壳

| key | EN | 建议中文 |
|---|---|---|
| `ui.settings.title` | Settings | 设置 |
| `ui.settings.noResults` | No matching settings | 无匹配的设置项 |
| `tabs.plugins.label` | Plugins | 插件 |

### 2.3 去重规则（zh-ui）

1. `object_pairs_hook` 列出每个重复 key 的**全部取值**  
2. 若值相同 → 保留一条  
3. 若值不同 → 选语义更完整/更中文的一条，**写进 report**  
4. apply 后重复 key = 0  

---

## 3. 算法 / 步骤

```text
A. 备份 zh-ui, zh-tips, zh-hotkeys, zh-runtime → _backup/2026-07-23-pre-ui-complete/
B. 扫描 zh-ui 重复 key → 报告 → 去重写回
C. 合并写入 §2.1 + §2.2 全部 key（已有非空则不覆盖，除非仍是英文整句）
D. P1：settings-selector 底栏改 interceptUIString + zh-ui key
E. 门禁脚本（Python object_pairs_hook）：
   - zh-ui/tips/hotkeys/runtime：无重复 key、无 ""
   - §2.1/§2.2 每个 key 存在且含中文（nerdfont 可含 emoji）
F. 可选：bun -e 调 i18n.init + interceptWelcomeString 抽检
G. 写 docs/local/i18n-zh-ui-complete-summary.md
H. 不 commit
```

---

## 4. 硬门禁

- [ ] `zh-ui.json` 重复 key = 0  
- [ ] §2.1 全部 key 存在且非空、非纯英文（`nerdfont` 除外可含英文品牌）  
- [ ] §2.2 三 key 存在且中文  
- [ ] 无 `""` 值  
- [ ] P1 若做了：底栏三分支均走 `interceptUIString`；对应 zh key 存在  
- [ ] 未改 en-*；未写 `~/.omp/lang`  
- [ ] 摘要文件存在  

软门禁：欢迎页 + `/settings` 标题肉眼/脚本抽检中文。

---

## 5. 验收命令（包内）

```bash
cd packages/coding-agent
# 重复 key / 缺 key 用 Python object_pairs_hook（见 post-exec audit 脚本风格）
# 可选：
OMP_LANG=zh bun -e "import { i18n } from './src/i18n/index.ts'; import { interceptWelcomeString } from './src/i18n/interceptor.ts'; await i18n.init(); console.log(interceptWelcomeString('tips'), interceptWelcomeString('back'));"
```

---

## 6. 文档关系

| 文件 | 角色 |
|---|---|
| **本文** | 本轮执行 SoT |
| `ACTIVE-TASK-i18n-zh.md` | 第一轮 settings/commands（已完成） |
| `i18n-zh-post-exec-kimi-audit.md` | 第一轮 PASS |
| `i18n-zh-ui-complete-summary.md` | 本轮 MiMo 产出（待写） |
| `i18n-zh-ui-complete-kimi-audit.md` | 本轮 Kimi 产出（待写） |

---

## 7. 执行角色

| 角色 | 终端策略 | 任务 |
|---|---|---|
| MiMo | **复用**已有 mimo 终端，勿新开 | 按本文 P0+P1 改文件 + 摘要 |
| Kimi | **复用**已有 kimi 终端，勿新开 | 只读校验 + audit md |
| Coord | Grok | 终审硬门禁后通知用户 |
