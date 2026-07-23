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
| 上游 | GitHub `can1357/oh-my-pi` **v17.0.9** 已发布 |
| 运行时横幅 | 实机曾见 `omp v17.0.8` + Update Available（VERSION 常量未必读 package.json） |

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

## 明日建议

1. 真同步上游 **v17.0.9 源码**（schema/VERSION/其它包），再扫一轮 schema→i18n  
2. 语言包分发：`~/.omp/lang` zip + install 脚本（非全量编译）  
3. 可选：清剩余单位英文（`1 minute` / `3 reminders`）与品牌策略  

---

## 协作约定（已记）

- Worker 重活 → **MiMo**；Coord 计划/终验 → **Grok**  
- 派任务前 **复用已开终端**，不默认新开  
- 交叉评审是证据，不是自动裁决  
