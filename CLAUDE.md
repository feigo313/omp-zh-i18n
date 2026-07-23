# Oh My Pi (i18n fork) — Project Agent Entry

> Orca / Claude Code / 多 harness 打开本仓库时优先读本文件。  
> 上游开发规范见 `AGENTS.md`（勿随意改写上游规则）。  
> **当前活跃任务（执行 SoT）**：`docs/local/ACTIVE-TASK-i18n-zh.md`

## 身份

| 项 | 值 |
|---|---|
| 路径 | `G:\oh-my-pi-i18n` |
| 性质 | Oh My Pi 本地副本 / i18n 中文对齐工作区 |
| 主包 | `packages/coding-agent`（CLI 名 `omp`） |
| 版本 | `17.0.8`（`packages/coding-agent/package.json`） |
| Git | 本机副本当前 **无 `.git`**（勿假设可 push/PR，除非用户另行初始化） |

## 术语

- 用户说 **agent** / coding agent 行为 → 指 **`packages/coding-agent` 实现**，不是当前会话里的你。
- 用户说 **i18n / 中文翻译 / zh-settings** → 指 `packages/coding-agent/src/i18n/`。

## 当前活跃任务（2026-07-23）

**任务**：按 v17.0.8 将中文 i18n 与 EN key 契约对齐（删 extra、补缺、抽检），不是全量重译。

**完整方案（唯一执行 SoT）**：`docs/local/ACTIVE-TASK-i18n-zh.md`  
（已整合：原始计划 + 第一轮审查 + 第二轮独立裁决。）

### 一句话状态

- Settings：各 `zh-settings-*.json` 对对应 EN **missing=0**，主问题是 **270 extra**（错位+orphan）+ 跨文件同 key 异值约 33。
- Commands：缺 **53** 个 `tabs.*.groups.N`，多 **226** 残留 key。
- 策略：以包内 EN 重建 ZH key 集；orphan 归档再删；只改包内 `src/i18n/lang`；空串硬门禁；旧 extract 脚本禁止调用。
- **尚未 apply 改文件**。

### 硬约束（摘要）

| 做 | 不做 |
|---|---|
| 只改 `lang/zh-*.json`（+ 可选 `scripts/realign-zh-i18n.ts`） | 改 `en-*.json` / `en-settings-full.json` |
| 自动化检查只读包内路径 | 写 `~/.omp/lang`（默认） |
| 物理备份 `lang/_backup/` | 依赖 git tag / commit |
| 空串清零、占位符一致、重复 key 扫描 | 无脑跑 extract/generate/translate/gen-i18n-keys |

**用户覆盖**：代码读 `~/.omp/lang`。本机若只有 `~/.omp/lan`，当前覆盖未生效——**勿把 `lan` 改名为 `lang`**。

**审查历史**：`docs/local/i18n-zh-translation-plan-review.md`（论据保留；**冲突以 ACTIVE-TASK 裁决为准**）。

### 新会话建议开场

```text
读 docs/local/ACTIVE-TASK-i18n-zh.md，按 §8 执行清单从备份+report 开始。
```

## i18n 路径

| 角色 | 路径 |
|---|---|
| **唯一应改的翻译目录** | `packages/coding-agent/src/i18n/lang/` |
| 运行时用户覆盖 | `~/.omp/lang`（本任务默认不写） |
| 加载逻辑 | `packages/coding-agent/src/i18n/index.ts`：bundled → 用户目录 |
| UI 注入 | `packages/coding-agent/src/i18n/interceptor.ts`（多数带英文 fallback） |
| 设置 schema | `packages/coding-agent/src/config/settings-schema.ts` |

## 常用命令

```bash
cd packages/coding-agent
bun run check:types
bun run check
bun -e "JSON.parse(await Bun.file('src/i18n/lang/zh-settings-tools.json').text()); console.log('ok')"
```

全仓 `bun test` 很重；i18n 任务以 JSON 对齐报告 + 抽检为主。

## 协作约定（本仓库）

- 回复默认 **中文**；术语保留英文（i18n、key、TUI、MCP 等）。
- 先读文件再下结论；改翻译只动 `zh-*.json`（及用户明确要求的脚本）。
- 交叉验证 / 其它模型意见 = **证据输入**，以 ACTIVE-TASK 整合裁决为准。
- 破坏性操作、外发、凭据：需用户明确意图。
- **不要** GitHub 评论/开 issue，除非用户明确要求。

## 上游规范入口

完整编码规范、Bun 约定、禁止事项 → **`AGENTS.md`**。  
改 TS 业务代码前必读；纯改 `lang/*.json` 时以本文件 + ACTIVE-TASK 为主即可。
