# 本地更新日志 — i18n 中文（2026-07-23）

> 本机工作区 `G:\oh-my-pi-i18n` 当日 i18n 工作摘要。  
> 包内正式 CHANGELOG 条目已写入 `packages/coding-agent/CHANGELOG.md` → `## [Unreleased]`。  
> **明日续作**：真合并上游 17.0.9 源码（VERSION 条仍可能显示 17.0.8）、可选语言包分发。

---

## 版本

| 项 | 值 |
|---|---|
| 工作区起点 | coding-agent **17.0.8** 汉化对齐 |
| package.json | 已标 **17.0.9**（跟版标记） |
| 上游 | 曾跟 **v17.0.9**；现 Latest 为 **v17.1.0**（2026-07-24） |
| 运行时横幅 | `VERSION` 读 **utils** package；utils 曾 17.0.8 → 假升级；现提示 **17.1.0** |
| 下轮计划 | `docs/local/ACTIVE-TASK-i18n-17.1.0.md` + 开源策略 `docs/local/OPENSOURCE-I18N.md` |

---

## 完成事项

### 1) Settings + Commands key 对齐（17.0.8）

- 10 分类 `zh-settings-*` + `zh-commands`：`keys(zh)==keys(en)`
- 归档 extra → `lang/_archive/`
- 备份 → `lang/_backup/2026-07-23-pre-realign/` 等
- 文档：`ACTIVE-TASK-i18n-zh.md`、`i18n-zh-realign-exec-summary.md`

### 2) 欢迎页 / 设置壳（zh-ui）

- `interceptWelcomeString` 全 key 中文
- 设置标题、底栏 5 分支 `interceptUIString`
- 文档：`ACTIVE-TASK-i18n-zh-ui-complete.md` 等

### 3) schema 缺失 path 补全（实机英文根因）

- 根因：schema 有 UI，en/zh 无 `settings.{path}.label` → 回退英文
- 补全约 **46+** 缺失 key（生成图片、启动、询问、xd://、回滚缓冲区、预走查、刷新标题等）
- 删除幽灵 key：`isolation.apply`、`renderMarkdownResults`
- 文档：`ACTIVE-TASK-i18n-missing-fix.md`、`i18n-untranslated-inventory-2026-07-23.md`、`i18n-missing-fix-summary.md`

### 4) 实机 Orca 抽检

- 外观：重写回滚缓冲区、折叠已压缩的历史、IME 安全提示布局  
- 工具：生成图片、启动、询问、待办提醒上限、xd:// 工具  
- 任务：重新规划时刷新标题、通用任务预走查、隔离模式、工作树基础目录  

---

## 产物路径（主要）

```
packages/coding-agent/src/i18n/lang/zh-*.json
packages/coding-agent/src/i18n/lang/en-settings-*.json  # 补 schema 缺失 SoT
packages/coding-agent/src/modes/components/settings-selector.ts
packages/coding-agent/package.json
packages/coding-agent/CHANGELOG.md  # Unreleased
docs/local/ACTIVE-TASK-*.md
docs/local/i18n-*.md
lang/_backup/ …
lang/_archive/ …
```

---

## 已知遗漏（待修，用户 2026-07-23 晚记录）

### P1 — 主题：深色/浅色主题**名字**全部未翻译

| 项 | 说明 |
|---|---|
| **现象** | 设置 → 外观 → 深色主题 / 浅色主题 的**下拉选项值**仍为英文主题 ID（如 `titanium`、`light` 及列表中其它主题名） |
| **已译** | 字段 label 本身已中文：`settings.theme.dark.label` = 深色主题，`settings.theme.light.label` = 浅色主题；description 已中文 |
| **未译** | **主题包显示名**（选项列表里的名字），不是 `settings.theme.dark.label` |
| **根因（推断）** | 选项来自已安装/内置 **theme 文件名或 theme meta.name**，经主题选择器直接展示，**未走** `settings.*.options.*.label` i18n 表；`en-settings-appearance.json` 也无 per-theme-name key |
| **修复方向** | 查 `settings-selector` / theme picker：是否可用 `i18n.t("themes.<id>.label", name)` 或 theme JSON 内 `displayName`；为内置主题建 `zh` 显示名表（或扩展 lang）；**不要**把 theme id 改成中文（配置值须保持 `titanium` 等） |
| **优先级** | **P1**（用户可见、外观首页） |
| **状态** | **已修**（MiMo `task_e2973a59fdaf`）：selector `i18n.t('themes.${id}.label')` + en/zh 各 100 条显示名 |

### P1 — 模型 → Prewalk 分组名未翻译

| 项 | 说明 |
|---|---|
| **现象** | 设置 → **模型** → 侧栏/分组标题显示英文 **Prewalk**（用户可见未译） |
| **已译** | `settings.prewalk.enabled.label` = **启用预走查**；description 已中文。任务页 `settings.task.prewalk.label` = **通用任务预走查** 已中文 |
| **根因** | 分组 key **`tabs.model.groups.Prewalk`** 曾缺失 → interceptor 回退 schema 组名 `Prewalk` |
| **对照** | 同文件已有 `tabs.model.groups.Thinking/Sampling/Prompt/…` 中文 |
| **修复** | 已写入 en+zh：`tabs.model.groups.Prewalk` → **预走查** |
| **优先级** | **P1** |
| **状态** | **已修**（当次会话，非「明日」） |

---

## 后续待办（批次派 MiMo，Coord 不手改）

1. ~~主题名字~~ **已修**（MiMo）  
2. **P1**：服务层级 / Role Storage / 语音 STT options / 记忆模型 options / Mnemopi 分组  
3. **P0**：`Update Available` 横幅（§P0 版本号）  
4. 真同步上游源码（若需）；语言包分发；单位英文  

### P0 — 欢迎页 `Update Available` / 版本条仍 17.0.8

| 项 | 说明 |
|---|---|
| **UI** | 欢迎页：`Update Available` + `New version 17.0.9 is available. Run: omp update`；横幅曾显示 `omp v17.0.8` |
| **根因** | CLI `VERSION` 来自 `@oh-my-pi/pi-utils` → `packages/utils/src/dirs.ts` 读 **utils 的 package.json**，该文件仍是 **17.0.8**；仅把 `coding-agent/package.json` 改成 17.0.9 **不够** |
| **代码** | `packages/coding-agent/src/cli.ts` import `VERSION` from `@oh-my-pi/pi-utils/dirs`；更新检查与本地 VERSION 比较（`modes/utils/ui-helpers.ts`） |
| **修复** |  monorepo 版本对齐：至少 `packages/utils/package.json`（及上游 sync 的其它包）→ **17.0.9**，与官方 release 一致；或整仓跟版。**勿**只改 coding-agent |
| **性质** | **非翻译问题**；版本漂移导致假「有更新」 |
| **状态** | 已核实根因，**未改**；派 MiMo/跟版时一并做 |

### P1 — 模型 → 采样 → 服务层级（OpenAI…子代理）未译全

| 项 | 说明 |
|---|---|
| **UI** | 设置 → 模型 → **采样** → 服务层级 OpenAI / Anthropic / Google / 子代理（+ 顾问） |
| **用户** | 「openai 到子代理里面全都没有翻译」— **先记录，稍后与主题名一并派 MiMo** |
| **label** | `settings.tier.{openai,anthropic,google,subagent,advisor}.label` 已有「服务层级 — …」中文（品牌可留） |
| **真缺口** | en/zh-settings-model **无任何** `settings.tier.*.options.*`；选项来自 `service-tier.ts` 的 `SERVICE_TIER_*_OPTIONS`（None/Auto/Default/Flex/Scale/Priority/Inherit + 英文 description）→ **下拉全英文** |
| **须补** | 各 family 的 options value 的 label+description；value id 保持 none/auto/… |
| **OpenAI** | none, auto, default, flex, scale, priority |
| **Anthropic** | none, priority |
| **Google** | none, flex, priority |
| **Subagent/Advisor** | inherit, none, auto, default, flex, scale, priority |
| **状态** | 仅记录，未修 |

### P1 — 模型 → 提示词 → Model Role Storage 标题/选项未译

| 项 | 说明 |
|---|---|
| **UI** | 设置 → **模型** → **提示词** → **Model Role Storage**（标题 + Global / Per-project 选项） |
| **用户** | 「提示词-model role strong 标题选项 遗漏翻译」— 按 **Model Role Storage** 字段记录（storage 易听成 strong） |
| **根因** | schema `modelRoleStorage` 有完整 ui.label/description/options，但 **en/zh-settings-model 中无任何 `settings.modelRoleStorage.*` key** → 全文回退英文 |
| **须补** | `settings.modelRoleStorage.label` / `.description`；`options.global|project.{label,description}` |
| **schema 英文** | label: Model Role Storage；options: Global / Per-project + 各自 description |
| **建议 ZH** | 标题如「模型角色存储」；Global→全局；Per-project→按项目；description 对照 schema 中文 |
| **状态** | **仅记录**，与主题名/服务层级 options 一并派 MiMo |

### P1 — 交互 → 语音 → 语音模型 / 转文字提交触发

| 项 | 说明 |
|---|---|
| **UI** | 设置 → **交互** → **语音** → **语音模型**、**语音转文字提交触发** |
| **用户** | 模型**名字**可不译；模型**介绍**要译；**触发**里**全部**要译 — 先记录，稍后批量派 MiMo |
| **字段 label** | 已有中文：`settings.stt.modelName.label` = 语音模型；`settings.stt.submitTrigger.label` = 语音转文字提交触发 |
| **真缺口** | en/zh-settings-interaction 中 **`settings.stt.modelName.options.*` 与 `settings.stt.submitTrigger.options.*` 均为 0 条** |
| **语音模型源** | `src/stt/models.ts` `STT_MODELS` / `STT_MODEL_OPTIONS`：fast/balanced/turbo/parakeet 的 label+description |
| **触发源** | `src/stt/submit-trigger.ts` `STT_SUBMIT_TRIGGER_OPTIONS`：never / release / release-complete / say-submit |
| **策略** | label 可保留英文模型名（Whisper/Parakeet…）；**description 必须中文**。触发项 label+description **全中文** |
| **须补 key 例** | `settings.stt.modelName.options.{fast,balanced,turbo,parakeet}.{label,description}`；`settings.stt.submitTrigger.options.{never,release,release-complete,say-submit}.{label,description}` |
| **状态** | 仅记录，未修 |

### P1 — 记忆 → 记忆模型：名称可留英文，介绍必中文

| 项 | 说明 |
|---|---|
| **UI** | 设置 → **记忆** → **记忆模型**（`settings.providers.memoryModel`，schema tab: memory） |
| **用户** | 模型**名称**可不译；**介绍**要译 — 先记录，稍后批量派 MiMo |
| **字段 label** | 已有「记忆 模型」（可润色为「记忆模型」）；description 已有简短中文 |
| **真缺口** | en/zh **无** `settings.providers.memoryModel.options.*`（0 条）→ 下拉选项回退 `tiny/models.ts` 英文 |
| **源** | `TINY_MEMORY_MODEL_OPTIONS` + `TINY_MEMORY_LOCAL_MODELS`：`online` + qwen3-1.7b / llama3.2:3b / gemma-3-1b / qwen2.5-1.5b / lfm2-1.2b |
| **策略** | **label** 可保留型号英文（Qwen3 1.7B、LFM2 1.2B…）；**description 必须中文** |
| **须补** | `settings.providers.memoryModel.options.{online,qwen3-1.7b,llama3.2:3b,gemma-3-1b,qwen2.5-1.5b,lfm2-1.2b}.{label,description}` |
| **状态** | 仅记录，未修 |

### P1 — 记忆 → Mnemopi 分组未翻译

| 项 | 说明 |
|---|---|
| **UI** | 设置 → **记忆** → 侧栏/分组标题 **Mnemopi** |
| **用户** | 「记忆-mnemopi 没有翻译」— 先记录，稍后批量派 MiMo |
| **已译** | 多数 `settings.mnemopi.*` 字段 label/description 已有中文（常带 Mnemopi 前缀） |
| **真缺口** | **`tabs.memory.groups.Mnemopi`** en=zh=`Mnemopi`，无中文显示名（对照同文件 General→通用、Hindsight→事后反思） |
| **修复** | 补/改 `tabs.memory.groups.Mnemopi` → 建议 **记忆派**（与 backend 选项 `settings.memory.backend.options.mnemopi.label` 已用「记忆派」一致）或 **Mnemopi 记忆** |
| **可选** | 字段 label 里重复的英文 “Mnemopi ” 前缀是否统一成中文品牌策略，批次时一并定 |
| **状态** | 仅记录，未修 |

---

## 协作约定（已记）

- Worker 重活 → **MiMo**；Coord 计划/终验 → **Grok**（**不手改 lang**）  
- 派任务前 **复用已开终端**，不默认新开  
- 交叉评审是证据，不是自动裁决  
