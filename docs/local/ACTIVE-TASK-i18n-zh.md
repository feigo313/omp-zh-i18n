# ACTIVE: i18n 中文按 v17.0.8 重新对齐（整合方案）

> **状态**：**已 apply 完成**；Kimi post-exec **PASS**；Grok 终审硬门禁复测通过（2026-07-23）  
> **更新**：2026-07-23  
> **执行摘要**：`docs/local/i18n-zh-realign-exec-summary.md`  
> **执行后审计**：`docs/local/i18n-zh-post-exec-kimi-audit.md`  
> **仓库**：`G:\oh-my-pi-i18n`（**无 `.git`**）  
> **包版本**：`17.0.8`  
> **本文件是执行 SoT**；交叉审查附件见文末「文档关系」。

---

## 0. 新会话 30 秒上手

1. 工作目录：`G:\oh-my-pi-i18n`
2. **只改**：`packages/coding-agent/src/i18n/lang/zh-*.json`（+ 可选新建 `scripts/realign-zh-i18n.ts`）
3. **SoT**：同目录 `en-settings-*.json`（10 分类，**不含** full）+ `en-commands.json`
4. **不要写**：`~/.omp/lang`（除非用户明确要求同步）
5. **不要改**：任何 `en-*.json` / `en-settings-full.json`
6. **不要跑**：`extract-settings-translations` / `generate-zh-templates` / `translate-settings-batch` / `gen-i18n-keys`（默认写 `~/.omp/lang`）
7. 开场语：按本文 **§8 执行清单** 从备份 + report 开始

---

## 1. 任务定义

| 项 | 内容 |
|---|---|
| 目标 | 中文翻译 **key 集与 EN 契约对齐**（删 extra、补缺、质量抽检） |
| 不是 | 全量重译 1300+ 条 |
| 范围 | `zh-settings-{appearance,context,files,interaction,memory,model,providers,shell,tasks,tools}.json` + `zh-commands.json` |
| 本轮不做 | `zh-ui` / `zh-tips` / `zh-hotkeys` / `zh-runtime`（无平行 en 分片，另开任务） |
| 回滚 | 无 git → **仅物理备份** `lang/_backup/…` |

---

## 2. 运行时语义（已读代码，执行前无需再辩论）

来源：`packages/coding-agent/src/i18n/index.ts`、`interceptor.ts`。

| 事实 | 含义 |
|---|---|
| 加载顺序 | 先包内 bundled `lang/`，再 merge 用户目录 |
| 用户覆盖路径 | 代码固定 **`~/.omp/lang`**（不是 `lan`） |
| 本机 2026-07-23 | 存在 `~/.omp/lan/` 一套 zh，**无** `~/.omp/lang/` → 用户覆盖**当前未生效**（`lan` 为残留） |
| 合并 | 多文件扁平 merge；**后读文件覆盖**同 key |
| `t(key, fallback?)` | 有译文（含空串）则用译文；否则 `fallback \|\| key` |
| Settings/commands UI | `interceptor` 动态拼 key，**多数带英文 fallback**（schema 原文） |
| Group UI 主路径 | `tabs.${tab}.groups.${group}`，`group` 为 schema **具名**（如 `Display`） |
| `en-settings-full.json` | 仅 **en** 侧嵌入加载；**无 zh-full**；分类 zh 改完即可生效，**不必** regenerate full |
| 空串陷阱 | `zh[k] === ""` 算命中，**不回退 EN** → 显示空白。比「缺 key」更糟 |

---

## 3. 实测基线（2026-07-23，包内 lang）

### 3.1 Settings（10 分类）

| 类别 | EN | ZH | missing | extra |
|---|---:|---:|---:|---:|
| appearance | 97 | 110 | 0 | 13 |
| context | 213 | 265 | 0 | 52 |
| files | 60 | 66 | 0 | 6 |
| interaction | 140 | 193 | 0 | 53 |
| memory | 97 | 101 | 0 | 4 |
| model | 187 | 217 | 0 | 30 |
| providers | 148 | 172 | 0 | 24 |
| shell | 33 | 35 | 0 | 2 |
| tasks | 105 | 119 | 0 | 14 |
| tools | 222 | 294 | 0 | 72 |
| **合计** | **1302** | **1572** | **0** | **270** |

extra 粗分：

- **misplaced ~99**：key 在**别的** `en-settings-*` 里存在（目标文件往往已有正确 key）
- **orphan ~171**：任何 en-settings 分类都没有

**EN 分类间同 key：0** → apply 后按 EN 重建，跨文件碰撞应消失。

**ZH 跨文件同 key**：约 **98** 个 key 出现在多个 zh-settings 文件；其中约 **33** 个 **值不同**。删 misplaced 后，运行时显示可能从「错位文件的译文」变为「正确文件的译文」——**方向通常更好，但必须进 report，不能静默**。

**结论**：settings 主战场是 **删 extra + 文案变化报告 + 质量抽检**，不是大补 missing。

### 3.2 Commands

| | EN | ZH |
|---|---:|---:|
| keys | 189 | 362 |
| missing | **53**（几乎全是 `tabs.<tab>.groups.N`） | |
| extra | | **226**（commands.* / flags.* 等残留） |

双轨（分别对齐各自 EN，**不擅自改 EN**）：

| 侧 | 形态 | 例 |
|---|---|---|
| settings | 具名 groups | `tabs.appearance.groups.Display` |
| commands | 下标 groups | `tabs.appearance.groups.0` |

**优先级说明**：UI group 主路径是 **settings 具名**。commands 的 53 个 `groups.N` 仍须按 EN 契约补齐，但**不等于**「设置页分组全坏」；勿与具名 groups 交叉 salvage。

### 3.3 质量

- 约 **151** 处 `zh == en`：多数为 Unicode/ASCII/Powerline/百分比等 → 白名单放行
- 含空格的英文整句 `zh == en`（如 `"Auto detect"`）→ **人工复核队列**，不当放行

### 3.4 旧文档

桌面任务书 `C:\Users\MYCAIGC\Desktop\oh-my-pi-i18n-zh-update-task.md` 的 key 数已过时。**以包内 EN + 本节实测为准**。

---

## 4. 目标与验收（硬 / 软）

### 4.1 硬门禁（apply 后必须全过）

- [ ] 每个 `zh-settings-*.json`：`keys(zh) === keys(en)`（对应分类，case-sensitive）
- [ ] `zh-commands.json`：`keys(zh) === keys(en)`
- [ ] 无重复 key（**不能**只靠 `JSON.parse`；用 `object_pairs_hook` 或等价检查）
- [ ] 目标文件 **无空串值**（`""`），除非显式白名单
- [ ] 占位符集合一致：每对 `(enVal, zhVal)` 的 `{name}` / `%s` / `{{var}}` 集合相等
- [ ] orphan / commands extra **先归档再删**（带 provenance：来源文件、时间、原因）
- [ ] JSON UTF-8 可 parse；统计脚本用 **Bun/Python**，勿用 PowerShell `ConvertFrom-Json`（大小写撞键会炸）
- [ ] 所有自动化检查 **显式读包内路径**，不依赖 `~/.omp`

### 4.2 软门禁 / 报告必出

- [ ] **跨文件同 key 异值**清单（apply 前文案会变的 key）+ apply 后抽检
- [ ] `zh == en` 白名单外条目 → 人工队列
- [ ] 明显错译抽检（对照 EN description）
- [ ] （可选）`OMP_LANG=zh` TUI smoke：settings 各 tab + 命令帮助

### 4.3 明确非门禁

- 全量源码 `used-not-in-en` 扫描为 **卫生项**，非删 extra 硬前置（见 §5）
- 不必先 patch 旧 extract 三脚本；**本轮不调用即可**
- 无 git → 不做 commit / tag / `git status` 门禁
- 不要求 regenerate `en-settings-full.json`

---

## 5. 风险与裁决摘要（整合两轮审查）

| ID | 级别 | 议题 | 执行裁决 |
|---|---|---|---|
| F1 | 卫生 / 非硬 blocker | 删 extra 是否删出裸 key | 本仓 interceptor **多数有英文 fallback**；删「不在 EN 契约内」的 key 主风险低。替代：扫无 fallback 的 `i18n.t`；**空串门禁**比全量 used-scan 更贴切。可选 smoke。 |
| F2 | TUI 真 / file 验收轻 | `~/.omp` 污染 | 文件级 report **只读包内**。smoke 前检查 **`~/.omp/lang`**；本机 **`lan` 勿改名为 `lang`**。 |
| F3 | 纪律 | 旧脚本写 `~/.omp/lang` | **禁止调用**；新建 realign **写死** `src/i18n/lang`。apply 后核对包内 mtime/文件集合。 |
| N1 | **重要** | 跨文件同 key 异值 ~33 | apply 前出 diff 报告；删 extra 后文案可能变。 |
| N2 | **重要** | 空串不回退 EN | salvage 失败勿写 `""` 长期留存；补译后再收工。 |
| N3 | 中 | groups 双轨 | 分别对齐 EN；`groups.N` **禁止**从具名 groups **字符串/形态**映射。**允许** exact-key salvage：同名字面量若在备份 zh-settings extra 中且与 `en-commands[k]` 语义对齐则采用（Kimi F-B）。 |
| N4 | 中 | full.json | 不改 full；zh 只改分类文件。 |
| N5 | 中 | 重复 key | 目标 zh-settings/commands 改前改后 hook 扫描；`zh-ui` 另任务。 |
| N6 | 低 | 大小写敏感 | 全链路 case-sensitive Set。 |

**审查附件中的「F1–F3 全为致命 blocker」已降级**；硬前置改为：备份 + 包内 report（含 N1/空串/重复 key）+ 只写包内脚本。

---

## 6. 工具与算法

### 6.1 新建（推荐）

`packages/coding-agent/scripts/realign-zh-i18n.ts`

| 模式 | 行为 |
|---|---|
| `report` | missing / extra / misplaced / orphan / 跨文件异值 / 空串 / zh==en / 重复 key |
| `settings --apply` | 按 EN 重建各 zh-settings |
| `commands --apply` | 按 EN 重建 zh-commands |
| `quality` | 空串、占位符、zh==en 队列 |

**路径常量写死**：

```text
packages/coding-agent/src/i18n/lang
```

### 6.2 Settings 算法

```text
global_zh = union(all current zh-settings values by exact key string)

for each category C in [shell, files, memory, appearance, tasks,
                        providers, model, interaction, context, tools]:
  en = load en-settings-C.json   # keys only from this file
  zh = load zh-settings-C.json
  for k in keys(en):
    if k in zh and zh[k] !== "":
      new[k] = zh[k]                    # 本文件优先
    else if k in global_zh and global_zh[k] !== "":
      new[k] = global_zh[k]             # salvage exact key only；打标
      mark_salvaged(C, k)
    else:
      new[k] = ""                       # 暂空，必须在 quality 阶段补完
  archive (keys(zh) - keys(en)) → lang/_archive/orphan-settings-C.json
    # provenance: source file, timestamp, reason=extra-vs-en-C
  write zh-settings-C.json = new
  assert keys(new) === keys(en)
```

**禁止**：把 misplaced key「迁移」到目标文件（目标 EN 已 full；迁移只会制造重复）。

### 6.3 Commands 算法

```text
en, zh = load en-commands / zh-commands
# 备份中的 zh-settings union（exact key），用于 groups.N salvage（见 F-B）
backup_zh_settings = union(lang/_backup/.../zh-settings-*.json)

for k in keys(en):
  if k in zh and zh[k] !== "":
    new[k] = zh[k]
  elif k matches tabs.*.groups.N and k in backup_zh_settings and backup_zh_settings[k] !== "":
    # exact-key salvage only（禁止具名 groups → 下标映射）
    # 须逐 key 对照 en[k] 英文值与备份中文语义；对齐则采用并 mark salvaged-from-zh-settings
    # 不对齐或拿不准 → 按 en[k] 新译
    new[k] = salvage_or_retranslate(k, en[k], backup_zh_settings[k])
  else:
    new[k] = ""   # 暂空，E 阶段补完；禁止长期留空串

# 禁止从 settings 具名 groups 字符串映射到 groups.N
archive (keys(zh)-keys(en)) → lang/_archive/zh-commands-extra.json
assert keys(new) === keys(en)
# 验收：53 个 groups.N 最终值 vs 备份值逐 key diff 进 report（salvage / 主动改译）
```

### 6.4 禁止调用的脚本

| 脚本 | 原因 |
|---|---|
| `extract-settings-translations.ts` | 默认写 `~/.omp/lang` |
| `generate-zh-templates.ts` | 同上 |
| `translate-settings-batch.ts` | 同上 |
| `gen-i18n-keys.ts` | 同上 |

### 6.5 白名单与术语

**zh==en 放行**：值在品牌/协议词表（Unicode、ASCII、Powerline、MCP、LSP、TTSR…）**或** token 形态（无空格，字母数字与 `%./+-`，如 `50%`、`UTF-8`）。

**进人工队列**：含空格且含小写字母的英文整句 `zh == en`。

**术语表**：

| EN | ZH |
|---|---|
| compaction | 压缩 |
| advisor | 顾问 |
| snapcompact | 快照压缩 |
| fallback | 回退 |
| subagent | 子代理 |

---

## 7. 执行阶段（按序）

### A. 冻结基线

```text
packages/coding-agent/src/i18n/lang/_backup/2026-07-23-pre-realign/
  全部 zh-*.json（含 ui/tips 等，整包备份最省事）
```

确认备份文件数齐全后再改任何文件。

### B. Report

跑 `realign report`（或等价一次性脚本），数字应与 §3 **同量级**；产出 N1 异值表。

### C. Settings apply

顺序建议：shell → files → memory → appearance → tasks → providers → model → interaction → context → tools。

每文件 assert key 集相等；extra 进 `_archive/`。

### D. Commands apply

按 §6.3：53 个 `groups.N` **优先 exact-key salvage**（备份 zh-settings extra）+ 语义核对；裁 extra；归档。  
**禁止**在 D 完成前做 TUI smoke（避免 C→D 瞬时空窗只见英文 fallback）。

### E. 补译与质量

1. 清空串（硬）  
2. 占位符一致性  
3. 明显错译 / 长英文句  
4. zh==en 队列（**以 report 重算为准**，勿沿用 §3.3 约 151；整句类约 39 条为人工起点）  

### F. 验收

- 硬门禁 §4.1  
- 软报告 §4.2（含 groups.N salvage/改译 diff、N1 异值）  
- 可选 TUI：**仅 D+E 完成后**；`Test-Path ~/.omp/lang`；若存在则临时移走再 `OMP_LANG=zh`；**不要**把 `lan` 改成 `lang`  

### G. 收尾

变更摘要（文件列表、删/补 key 数、N1 样例、归档路径）。**不自动 commit**。

---

## 8. 最小执行清单（照做，9 步）

1. 读本文件 + `CLAUDE.md`  
2. 物理备份全部 `zh-*.json` → `lang/_backup/2026-07-23-pre-realign/`  
3. 写/跑 `realign report`：确认 §3 量级；输出跨文件异值、空串、重复 key  
4. `settings --apply`（仅写包内 lang）  
5. `commands --apply`  
6. 补空串 + 占位符 + 错译/zh==en 队列  
7. 硬门禁全过（keys / 重复 key / 空串 / 占位符 / JSON）  
8. （可选）TUI smoke，隔离 `~/.omp/lang` 若存在  
9. 变更摘要；**不 commit**（无 git；有 git 也须用户确认）  

---

## 9. 有用命令速查

```bash
cd packages/coding-agent

# JSON 合法
bun -e "JSON.parse(await Bun.file('src/i18n/lang/zh-settings-tools.json').text()); console.log('ok')"

# 重复 key（示例：Python）
# object_pairs_hook: assert len(keys)==len(set(keys))

# 用户覆盖是否生效
# PowerShell: Test-Path $HOME\.omp\lang   # 代码读这个
#            Test-Path $HOME\.omp\lan    # 本机残留，当前无效

# 可选：聚焦 i18n 测试（覆盖范围以读 test 文件为准，非硬门禁）
# bun test test/i18n.test.ts test/settings-i18n.test.ts test/commands-i18n.test.ts
```

全仓 `bun test` 很重；本任务以包内 report + 抽检为主。

---

## 10. 路径速查

```text
packages/coding-agent/src/i18n/
  index.ts                 # 加载/merge/t()
  interceptor.ts           # settings/commands/tab 注入 + fallback
  lang/
    en-settings-*.json     # SoT（10 分类）
    en-settings-full.json  # 只读；en 聚合参考；勿手改
    zh-settings-*.json     # 改这里
    en-commands.json       # SoT
    zh-commands.json       # 改这里
    _backup/               # 执行时创建
    _archive/              # 执行时创建
packages/coding-agent/scripts/
  realign-zh-i18n.ts       # 建议新建（写死包内路径）
  extract-*.ts 等          # 禁止本轮调用
packages/coding-agent/src/config/settings-schema.ts
packages/coding-agent/test/
  i18n.test.ts
  settings-i18n.test.ts
  commands-i18n.test.ts
```

---

## 11. 会话历史（压缩）

- 桌面旧任务书定位项目；实测 key 数与旧文档不一致 → 按 v17.0.8 包内 EN 重做  
- 根目录 `CLAUDE.md` + 本文件用于 Orca/多 harness 交接  
- 第一轮独立审查：`docs/local/i18n-zh-translation-plan-review.md`（F1–F3 / I1–I6）  
- 第二轮独立裁决：F1–F3 降级；升格 N1 文案突变、N2 空串、`lang` vs `lan`、禁 git 门禁  
- **本文件 = 整合后的唯一执行方案**；**尚未改任何 zh 文件**

---

## 12. 文档关系

| 文件 | 角色 |
|---|---|
| **本文** `docs/local/ACTIVE-TASK-i18n-zh.md` | **执行 SoT** |
| `CLAUDE.md` | 多 harness 入口；指向本文 |
| `AGENTS.md` 顶部本地块 | 指针；勿改上游正文 |
| `docs/local/i18n-zh-translation-plan-review.md` | 第一轮审查原文（历史/论据）；**执行以本文为准** |
| `docs/local/i18n-zh-plan-kimi-xcheck.md` | Kimi 方案交叉审计（GO-WITH-FIXES）；F-B 已并入本文 §5/§6.3/§7 |
| 桌面 `oh-my-pi-i18n-zh-update-task.md` | 过时 key 数；仅历史参考 |
