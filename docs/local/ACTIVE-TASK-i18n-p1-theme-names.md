# ACTIVE: P1 主题名字中文化 + Prewalk 分组确认

> **Worker：MiMo only**（Coord 不直接改 lang）  
> **状态**：派发中  
> **SoT**：本文

## 背景

用户要求：**干活拉 MiMo，Coord 不亲自改翻译**。

## 任务

### A. 确认 Prewalk（若已有则跳过）

- Key：`tabs.model.groups.Prewalk`
- 期望 zh：**预走查**
- 若 en/zh-settings-model 已有且正确 → 摘要注明已存在，勿重复破坏

### B. P1 主题名字（必做）

| 项 | 说明 |
|---|---|
| UI | 设置 → 外观 → **深色主题** / **浅色主题** 下拉列表中的**主题显示名** |
| 现状 | 显示 `titanium`、`light` 等英文 id/名 |
| 约束 | 配置**存储值**必须仍是英文 theme id；只改**显示名** |
| 做法 | 1) 读 theme 加载/选择器代码（settings-selector / theme 列表）找展示点 2) 增加 i18n：`themes.<id>.label` 或等价表写入 zh（及 en 如需） 3) 选择器 `i18n.t` 显示中文，fallback 英文 id 4) 至少覆盖内置主题全表；用户自定义主题无映射则显示原名 |
| 验收 | OMP_LANG=zh 下深色/浅色选项列表主题名含中文（至少内置） |

### C. 交付

- 改动文件列表
- `docs/local/i18n-p1-theme-names-summary.md`
- 不 commit；不写 `~/.omp/lang`；不新开终端（本任务已由 coord 开好 mimo）

## 禁止

- Coord 代写翻译
- 只改 label「深色主题」而不改选项名
- 把配置值改成中文 id

---

## 批次追加（用户先记录，稍后一并派 MiMo）

### P1 模型·采样·服务层级（OpenAI → 子代理）

- 见 `docs/local/i18n-changelog-2026-07-23.md` §P1 服务层级  
- 见清单 `i18n-untranslated-inventory-2026-07-23.md` §G  
- **核心**：补全 `settings.tier.{openai,anthropic,google,subagent,advisor}.options.*.{label,description}`（源：`service-tier.ts`），当前 en/zh **0 条 options**  
- 字段 label 已有中文；用户看到的「全没翻译」主要是**下拉选项** None/Priority/Inherit 等  

**批次派单时**把下列打成同一 MiMo 任务即可：

1. 主题显示名  
2. 服务层级 options（清单 §G）  
3. Model Role Storage 标题+选项（清单 §H）  
4. **交互·语音**：`stt.modelName` / `stt.submitTrigger` options（清单 §I）— 模型名可英文，介绍必中文；触发项全中文
5. **记忆·记忆模型**：settings.providers.memoryModel.options.*（清单 §J）— 名称可英文，介绍必中文
6. **记忆·Mnemopi 分组**：	abs.memory.groups.Mnemopi → 记忆派（清单 §K）
