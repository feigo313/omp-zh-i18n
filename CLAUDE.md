# Oh My Pi (i18n fork) — Project Agent Entry

> Orca / Claude Code / 多 harness 打开本仓库时优先读本文件。  
> 上游开发规范见 `AGENTS.md`（勿随意改写上游规则）。  
> **阶段状态（暂停 SoT）**：`docs/local/STATUS-2026-07-24-paused.md`

## 身份

| 项 | 值 |
|---|---|
| 路径 | `G:\oh-my-pi-i18n` |
| 性质 | Oh My Pi 中文汉化工作区 / 公开项目 **omp-zh-i18n** |
| 主包 | `packages/coding-agent`（CLI 名 `omp`） |
| 基线版本 | **17.1.0** |
| GitHub | https://github.com/feigo313/omp-zh-i18n · `master` |
| 更新节奏 | **不定期**（不承诺跟每个上游小版本） |

## 术语

- 用户说 **agent** / coding agent 行为 → 指 **`packages/coding-agent` 实现**，不是当前会话里的你。
- 用户说 **i18n / 中文翻译 / zh-settings** → 指 `packages/coding-agent/src/i18n/`。

## 当前状态（2026-07-24 收尾）

本阶段汉化与仓库发布已完成，**默认不再开新任务**。续作前读：

- `docs/local/STATUS-2026-07-24-paused.md`（暂停 SoT）  
- 根目录 `README.md`（对外说明）

历史任务书在 `docs/local/ACTIVE-TASK-*.md` / `*-summary.md`（存档，非执行 SoT）。

### 硬约束（摘要）

| 做 | 不做 |
|---|---|
| 优先改 `lang/zh-*.json`（+ 明确要求的 en/接线） | 无脑跑 extract/generate/translate/gen-i18n-keys |
| 空串清零、en/zh key 对称 | 默认写 `~/.omp/lang` |
| 品牌/模型 id 可英文 | 把 `lan` 改名为 `lang` |
| 破坏性/外发/凭据需用户意图 | 无用户意图 commit/push |

## i18n 路径

| 角色 | 路径 |
|---|---|
| **主翻译目录** | `packages/coding-agent/src/i18n/lang/` |
| 运行时用户覆盖 | `~/.omp/lang`（默认任务不写） |
| 加载逻辑 | `packages/coding-agent/src/i18n/index.ts` |
| UI 注入 | `packages/coding-agent/src/i18n/interceptor.ts` |

## 常用命令

```bash
cd packages/coding-agent
bun run check:types
bun run check
bun -e "JSON.parse(await Bun.file('src/i18n/lang/zh-settings-tools.json').text()); console.log('ok')"
```

## 协作约定

- 回复默认 **中文**；术语保留 English（i18n、key、TUI、MCP 等）。
- 先读文件再下结论。
- **不要** GitHub 评论/开 issue，除非用户明确要求。

## 上游规范入口

完整编码规范、Bun 约定 → **`AGENTS.md`**。纯改 `lang/*.json` 时以本文件 + STATUS 为主即可。
