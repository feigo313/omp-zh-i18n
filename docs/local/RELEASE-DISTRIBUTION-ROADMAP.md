# omp-zh-i18n 发行版路线图

> 本文件记录第二阶段目标：将中文 i18n 从"源码 + 手动覆盖"推进到可分发的二进制/安装包形态。
> 更新：2026-07-26

## 现状（第一阶段完成）

| 项 | 状态 |
|---|---|
| 翻译文件 | `packages/coding-agent/src/i18n/lang/zh-*.json`（15 个文件） |
| 加载机制 | bundled（编译时嵌入）+ `~/.omp/lang/` 用户覆盖 |
| 运行方式 | 源码运行（`bun run src/cli.ts`） |
| 语言切换 | 设置 → 交互 → 语言 → 简体中文 |
| 基线 | `@oh-my-pi/pi-coding-agent` 17.1.0 |

## 第二阶段目标

### 目标形态

为中文用户提供**开箱即用**的安装方式，无需自行克隆仓库或手动复制文件。

| 形态 | 描述 | 优先级 |
|---|---|---|
| 预编译二进制 | 内嵌中文语言包的 `omp` 二进制文件 | P0 |
| npm 包 | `@oh-my-pi/pi-coding-agent` 发布到 npm | P1 |
| 安装脚本 | 一键下载并配置中文环境 | P1 |
| 平台安装包 | .deb / .rpm / Homebrew tap | P2 |

### 平台范围

| 平台 | 架构 | 二进制 | 安装包 |
|---|---|---|---|
| Linux | x86_64 | P0 | P2（.deb/.rpm） |
| Linux | aarch64 | P0 | P2 |
| macOS | arm64 (Apple Silicon) | P0 | P2（Homebrew） |
| macOS | x86_64 (Intel) | P1 | P2 |
| Windows | x86_64 | P0 | P2（.exe / winget） |

### 版本策略

- 发行版版本号与上游 `@oh-my-pi/pi-coding-agent` 保持一致（如 `17.1.0-zh.1`）
- 后缀 `-zh.N` 表示中文 i18n 补丁序号
- 每次发布需记录：基线版本、i18n 补丁版本、变更摘要

### 验证门禁

每个发行版发布前必须通过：

| 门禁 | 命令 | 说明 |
|---|---|---|
| 代码检查 | `bun run check` | 类型检查 + lint |
| 版本确认 | `bun packages/coding-agent/src/cli.ts --version` | 版本号正确 |
| 工具链 | `bun run check:tools` | 工具链完整 |
| 中文加载 | 启动后语言设置为 `zh`，验证无 crash | 运行时验证 |
| 语言包完整性 | 对比上游 en key，确认 zh 覆盖率 ≥ 95% | i18n 覆盖 |

## 实施路线

### Phase 2a：预编译二进制（P0）

**目标**：用户下载单个二进制即可运行完整中文版 omp。

**步骤**：
1. 利用现有 `bun run build`（`packages/coding-agent/scripts/build-binary.ts`）生成二进制
2. 确认中文语言包在编译时已嵌入（当前 `EMBEDDED_TRANSLATIONS` 已支持）
3. 测试各平台二进制的中文加载路径
4. 在 GitHub Releases 发布预编译二进制（附校验和）

**依赖**：无额外依赖，现有构建流程已支持。

### Phase 2b：npm 包发布（P1）

**目标**：用户通过 `npm install -g @oh-my-pi/pi-coding-agent-zh` 安装。

**步骤**：
1. 创建独立 npm 包名（避免与上游冲突）
2. 在 `package.json` 中配置 bin 入口指向内嵌中文的版本
3. 发布到 npm registry

**风险**：需确保 npm 包名不与上游冲突，且不误导用户认为是官方包。

### Phase 2c：安装脚本（P1）

**目标**：一行命令完成下载 + 安装 + 配置中文。

**步骤**：
1. 编写 `install-zh.sh`（Linux/macOS）和 `install-zh.ps1`（Windows）
2. 脚本逻辑：检测平台 → 下载对应二进制 → 放入 `~/.local/bin` 或 `~/.omp/bin` → 写入默认配置
3. 支持 `--update` 参数升级

### Phase 2d：平台安装包（P2）

**目标**：通过系统包管理器安装。

**步骤**：
1. Linux：构建 .deb / .rpm 包
2. macOS：创建 Homebrew tap
3. Windows：打包 .exe 安装器或 winget manifest

## 当前仓库不提供的东西

| 不提供 | 原因 |
|---|---|
| 官方二进制 | 上游项目未发布预编译中文版 |
| npm 发布 | 尚未配置发布流程 |
| 自动化 CI/CD | 无发布管道 |
| 签名/公证 | macOS 签名需 Apple 开发者账号 |

## 续作指引

开始第二阶段前：

1. 确认上游是否有新的 i18n 支持变更
2. 补齐 zh key 至覆盖率 ≥ 95%
3. 在各目标平台验证编译产物
4. 选择发布渠道（GitHub Releases 优先）

---

> 本路线图仅记录目标和计划，不包含已实现的发布系统。实际发布需另行搭建 CI/CD 管道。
