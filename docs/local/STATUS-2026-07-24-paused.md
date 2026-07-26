# omp-zh-i18n — 17.1.0-zh.1 阶段收尾（暂停）

> **状态**：本阶段工作结束，默认不再开新任务。有上游版本/用户反馈再续。  
> **日期**：2026-07-26
> **GitHub**：https://github.com/feigo313/omp-zh-i18n  
> **本地**：`G:\oh-my-pi-i18n` · branch `master`（本阶段已发布，默认暂停）

## 交付物

| 项 | 内容 |
|---|---|
| 项目名 | **omp-zh-i18n**（独立中文汉化，非官方） |
| 基线 | coding-agent / utils **17.1.0** |
| 更新节奏 | **不定期**（不承诺跟每个上游小版本） |
| 主改动 | `packages/coding-agent/src/i18n/lang/zh-*.json` + 必要 en SoT / interceptor / schema options / settings-selector |
| 范围 | 欢迎/设置一二级三级、插件页、主题名、枚举值列、常用 UI chrome |
| 当前发布 | GitHub prerelease `v17.1.0-zh.1`；README 已含中文界面实拍 |

## 本阶段完成摘要

1. zh/en key 对齐与 realign（删 orphan、补缺）  
2. schema 缺 path / 17.0.9→17.1.0 跟进（主题、服务层级、STT、记忆、Tiny/TTS/Timeouts 等）  
3. 插件页 `interceptUIString` + providers 大补  
4. bare enum → `ui.options` 子菜单 + 中文 option 标签；4 条坏译；`预览：`；主题列表名 i18n  
5. 公开仓库推送（Google OAuth 客户端为上游同源公开桌面凭据，已 push-protection 放行）

## 已知可接受残留

- `true`/`false`、品牌/技术 id（Shell、Unicode、模型名等）可保留英文  
- 上游新版本后可能英文回退（缺 key）— 预期行为  
- 设置向导 / 部分非设置选择器 / advisor 配置页等若仍有硬编码，属后续批次  

## 续作时怎么开

```text
仅在上游出现**大版本**、用户报告明显中文回退，或用户明确要求时重开。
先读本文件、README.md 和 docs/local/WORKLOG-2026-07-26.md。
对照上游的新 en-settings / settings-schema，扫 missing key 再补 zh。
只改 packages/coding-agent/src/i18n/lang（及明确要求的接线）；默认不写 ~/.omp/lang；勿把 lan 改名为 lang。
```

历史任务书（已完成，仅存档）：`docs/local/ACTIVE-TASK-*.md`、`docs/local/*-summary.md`。

## 硬约束（续作仍有效）

| 做 | 不做 |
|---|---|
| 中文用户可见文案 | 无脑跑旧 extract/generate/translate |
| 空串清零、en/zh key 对称 | 默认 commit/push（需用户意图） |
| 品牌/模型 id 可英文 | 依赖 `~/.omp/lang` 覆盖做主交付 |
