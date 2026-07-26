# 提交发布前只读终审报告 — 2026-07-26

> **审计角色**：auditor（只读终审，audit: final）
> **仓库**：`G:\oh-my-pi-i18n` · branch `master` · remote `feigo313/omp-zh-i18n`
> **基线**：`@oh-my-pi/pi-coding-agent` 17.1.0 · HEAD `3f52781`
> **参考**：`docs/local/RELEASE-DISTRIBUTION-ROADMAP.md`、`docs/local/WORKLOG-2026-07-26.md`

## 总结论：**partial**

- 代码改动（prompt-loader 修复 + 测试）与三道声明门禁：**pass**。
- 发布路径：**可执行路径存在（手动 `gh release`），但 CI 驱动的自动发布在当前 fork 上不成立**，且存在必须先解决的阻塞项（未提交改动、分支/工具链假设 `main`）。因此整体判 partial 而非 pass。

---

## R1：prompt-loader 未提交差异审查（结论：pass，附观察项）

审查对象：`packages/coding-agent/src/i18n/prompt-loader.ts`（未提交修改）、`packages/coding-agent/test/i18n/prompt-loader.test.ts`（未跟踪新增）。

### 语言优先级 — 确认修复正确

- 旧 `detectLanguage()`：`OMP_LANG → LANG → en`，与主 i18n 不一致，已删除。
- 新实现委托 `getLanguage()`（`src/i18n/index.ts:318`），单例 `I18nManager.lang` 由 `init()` 时的 `detectLanguage()`（`index.ts:152-179`）确定：`OMP_LANG → config.yml (i18n.language) → en`。修复与 worklog 声明一致。
- **行为变更（非阻塞，需在发布说明中体现）**：`LANG` 环境变量不再被读取。仅设 `LANG=zh_CN`、无 `OMP_LANG`/config.yml 的用户，此前会得到中文 prompt（若文件存在），现在回退 en。这是与主 i18n 对齐的有意变更，测试 `OMP_LANG=zh 时 LANG 不影响语言检测` 正好固化了该契约。
- `cacheKey` 未定义 bug 修复属实：旧代码 `promptCache.set(cacheKey, …)` 引用不存在的变量，已改为 `promptPath`。

### 缓存行为 — 两个观察项（非阻塞）

1. **缓存只写不读**：`loadTranslatedPrompt` 中 `promptCache.set(...)` 有两处，但全函数没有任何 `promptCache.get(...)`。缓存对运行时性能零作用；`prompt-loader.ts:47` 的注释"检查缓存"与代码不符（陈旧注释）。测试"相同 promptPath 重复调用返回相同结果"因此是必然通过的（每次重算），并未真正验证缓存命中。
2. **缓存键不含语言**：键仅为 `promptPath`。当前安全是因为 `setLanguage()`（`index.ts:334`）会 `clearPromptCache()`，且缓存本就不被读取；若将来补上 `get`，必须同步把 lang 纳入键。

### 测试覆盖评估 — 覆盖的是模块自身契约，而非端到端外部契约

- 已覆盖：en 短路、无翻译文件时回退原文、与 `getLanguage()` 语言一致、`setLanguage` 清缓存、重复调用确定性、`LANG` 不参与检测。7/7 通过。
- 缺口：
  - **无"真实翻译文件被加载并返回"的断言**。实测确认 `packages/coding-agent/src/i18n/lang/prompts/` 目录**不存在**——即使语言为 zh，bundled prompt 翻译也无文件可加载，永远走 fallback。
  - 未测试用户覆盖优先级（`~/.omp/lang/prompts/<lang>/` 优先于 bundled）。
  - **关键事实：`loadTranslatedPrompt` 在生产代码中零调用方**（全仓 grep 仅见自身 JSDoc 示例与测试导入）。该模块目前是未接线的基础设施，本轮修复的语言一致性尚无用户可观察的效果。这不构成发布阻塞（改动是严格改善且无回归面），但"测试覆盖真实外部契约"这一要求只能算部分满足——真实契约要等 prompt 加载链路实际接入后才存在。

---

## R2：发布 workflow / tag/version 规则 / master 分支审查（结论：自动发布路径不成立，手动路径可行）

### CI 触发与 release 检测（`.github/workflows/ci.yml`，本轮已提交 `3f52781`）

- push/PR 触发分支已加 `master`（diff 确认 `[main] → [main, master]`），普通 CI 可在 master 上触发。
- 但 **release 检测不会在 master 上成立**：`release_metadata` 的 case 只匹配 `refs/tags/v[0-9]*`（仅 workflow_dispatch 可达，`on.push.branches` 过滤器使 tag push 不触发）和 `refs/heads/main` + HEAD 带 `v*` tag（ci.yml:76-85）。push 到 `refs/heads/master` 落入 default 分支，`is-release=false`。worklog 中"不影响构建，仅影响缓存优化"的评估**低估了影响**：`refs/heads/main` 条件不仅管缓存，还管 release 检测本身。
- **自托管 runner 依赖**：约 12 个 job（含 `release_metadata`）非 PR 事件跑在 `omp-kata` runner 上。fork 是否配置了该 runner 未验证（本审计不使用凭据）；若无，push 触发的 CI 会整体排队挂起。发布前必须人工确认。
- `release_binary` → `release_github` → `release_github_verify` → `release_npm` 链条完整；npm 发布用 OIDC trusted publishing 指向 `@oh-my-pi/*` scope，fork 不拥有该 scope，必须用 `skip_npm=true`（workflow_dispatch input）规避；`release_brew` 无 `HOMEBREW_TAP_DEPLOY_KEY` 时自动 no-op，macOS 签名无 `APPLE_*` secrets 时自动跳过——这两点是良性的。

### `scripts/release.ts` — 对本 fork 不可用

- `release.ts:204` 硬性要求 `main` 分支，当前 `master` 直接 exit 1。
- 推送目标写死 `refs/heads/main:refs/heads/main`（:371），版本参数校验 `/^\d+\.\d+\.\d+$/`（:411）**拒绝** 路线图的 `17.1.0-zh.N` 形式。

### `scripts/ci-release-notes.ts` 与 `-zh.N` tag 的兼容性

- `resolvePublishedFloorTag` 的候选过滤 `^v\d+\.\d+\.\d+$`（:236）和 `enumerateChangelogVersions` 的 `## [X.Y.Z]` 解析（:80）都只认严格 semver。tag `v17.1.0-zh.1` 作为 target 传入可运行，但 changelog 中 `## [17.1.0-zh.1]` 段不会被解析，notes 大概率为空。**`-zh.N` 版本需手写 release notes**。

### 当前仓库状态

- 未提交：`AGENTS.md`（Identity 段）、`docs/local/WORKLOG-2026-07-26.md`、`packages/coding-agent/src/i18n/prompt-loader.ts`；未跟踪：`packages/coding-agent/test/i18n/prompt-loader.test.ts`。
- 本地无任何 tag；remote 为 `feigo313/omp-zh-i18n`。

### 最小可行 GitHub Release 操作路径（推荐：手动，无需改 CI/脚本）

前置（需用户决定，超出 auditor 权限）：

1. 提交并推送当前改动：`git add -A && git commit -m "fix(i18n): unify prompt-loader language detection with main i18n"`（信息自定），`git push origin master`。
2. 构建二进制：本地 `bun run ci:release:build-binaries`（需 Rust 工具链产出 pi-natives addon；worklog 仅验证过 `--dry-run`），或等 CI artifact（取决于 omp-kata runner 是否可用）。**若首版只做源码发布可跳过二进制，但与路线图 P0 目标不符，需用户拍板**。
3. 打 tag 并推送：`git tag -a v17.1.0-zh.1 -m "中文 i18n 首发（基线 17.1.0）" && git push origin v17.1.0-zh.1`。
4. 创建 Release：`gh release create v17.1.0-zh.1 --prerelease --title "omp 中文版 17.1.0-zh.1" --notes <手写说明> [二进制文件 + checksums]`。`--prerelease` 建议保留：首轮分发、无签名 macOS 二进制、无 CI 验证链路。

备选（CI 驱动）：push tag 后 `gh workflow run ci.yml --ref v17.1.0-zh.1 -f skip_npm=true`。可行但前提多：omp-kata runner 存在、完整测试矩阵通过、release notes 为空需事后手工补。不建议作为首发路径。

---

## R3：门禁结果（全部通过）

| 门禁 | 结果 |
|---|---|
| `bun test packages/coding-agent/test/i18n/prompt-loader.test.ts packages/coding-agent/test/i18n.test.ts` | **27 pass / 0 fail**（prompt-loader 7 + i18n 20），3.86s |
| `git diff --check` | **exit 0**，无 whitespace 错误 |
| `bun packages/coding-agent/src/cli.ts --version` | **`omp/17.1.0`** |

未运行（超出本次 gate 声明）：`bun run check`、`bun run check:tools`（worklog 已记录被既有 i18n 辅助脚本诊断阻断，沿未修复）。

---

## R4：阻塞项与风险清单

### 阻塞项（发布前必须处理）

1. **全部改动未提交**（4 个文件）。auditor 无 commit 权限，需用户明确意图。
2. **二进制构建未验证**：`ci-release-build-binaries.ts` 仅 dry-run 过；真实构建依赖 Rust/napi 工具链与 native addon，未在本机验证。路线图 P0（预编译二进制）尚无已验证产物。

### 风险

| 风险 | 严重度 | 说明 |
|---|---|---|
| CI release 检测只认 `main` / tag-ref dispatch | 中 | master push 永远不会触发 release jobs；自动发布需改 ci.yml 或走 dispatch |
| `omp-kata` 自托管 runner 在 fork 上是否可用未验证 | 中 | 不可用则 push 触发的 CI 整体挂起；发布前人工确认 |
| `release.ts` 写死 `main` 分支且拒绝 `-zh.N` 版本 | 低 | 手动路径可完全绕开；若将来要 CI 化需 fork 侧适配 |
| `-zh.N` tag 下 release notes 生成为空 | 低 | 手写 notes 规避 |
| prompt-loader 缓存只写不读 + 陈旧注释 | 低 | 无功能影响；将来启用缓存读取时键需含 lang |
| `loadTranslatedPrompt` 零生产调用方 | 信息 | 本轮修复无回归面，但也无即时用户可见效果；prompt 翻译链路接入是后续工作 |
| `LANG` 不再参与语言检测 | 信息 | 有意对齐主 i18n，需在发布说明中告知 |

---

## 附：审计边界

- 全程只读：未修改任何源码、测试、workflow、文档；未 commit/push；未触碰 GitHub issue/release；未使用凭据。
- 本报告是唯一写入产物（write_set 授权）。
