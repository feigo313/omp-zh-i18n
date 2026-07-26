# omp-zh-i18n

**Oh My Pi（`omp`）中文界面汉化项目** — 独立维护，面向中文用户。

| 项 | 说明 |
|---|---|
| 基线 | `@oh-my-pi/pi-coding-agent` **17.1.0** |
| 维护方 | 本仓库（非官方） |
| 更新节奏 | **不定期**：人力允许时对照上游补 key / 补二级三级菜单文案 |
| 范围 | 欢迎页、设置一/二/三级、插件页、主题名、常用 UI chrome |

上游产品：[Oh My Pi](https://github.com/can1357/oh-my-pi)（MIT）。本仓库在其源码基础上维护中文 `lang` 与必要的 i18n 接线改动；**不承诺**跟随每一个上游小版本同日更新。官方升级后若出现英文回退（缺 key），属预期现象。

## 快速开始

**从本仓库源码运行**（唯一可靠方式）

```sh
# 前置：安装 Bun ≥ 1.3.14
git clone https://github.com/feigo313/omp-zh-i18n.git
cd omp-zh-i18n
bun install
cd packages/coding-agent
bun run src/cli.ts
# 启动后进入 设置 → 交互 → 语言 → 简体中文
```

> 首次启动会进入设置向导。语言选项在「设置 → 交互 → 语言」。

**官方 omp 无法直接使用本仓库的中文包。** 本项目的 i18n 加载器（`~/.omp/lang/` 覆盖机制）是本仓库对上游源码的修改，官方 omp 二进制不包含此代码。将 `zh-*.json` 复制到 `~/.omp/lang/` 对官方安装无效。

未来计划通过预编译二进制发行版解决此问题，详见 [发行版路线图](./docs/local/RELEASE-DISTRIBUTION-ROADMAP.md)。

## 切换语言

运行 omp 后，通过以下方式切换到中文：

1. **TUI 界面**：按 `?` 打开设置 → 交互 → 语言 → 选择「简体中文」
2. **环境变量**：`OMP_LANG=zh omp`（当前会话生效）
3. **配置文件**：在 `~/.omp/config.yml` 中添加：
   ```yaml
   i18n:
     language: zh
   ```

## 升级

- **本仓库更新**：`git pull` 后重新运行即可
- **官方 omp 升级后**：中文可能出现英文回退（缺 key），属预期现象。等待本仓库对照新版本补 key 即可

## 常见问题

| 问题 | 解决 |
|---|---|
| 界面部分显示英文 | 缺 key 时回退到 schema 原文，属预期。可到 issue 反馈 |
| 设置里看不到「语言」选项 | 确认是从本仓库源码运行，官方 omp 无 i18n 支持 |
| `bun run src/cli.ts` 报错 | 确认已执行 `bun install` 且 Bun ≥ 1.3.14 |
| 汉化范围不够全 | 本项目为不定期更新，欢迎 PR 补译 |

## 翻译范围

- **已覆盖**：欢迎页、设置一/二/三级菜单、插件页、主题名、枚举值标签、常用 UI chrome
- **保留英文**：品牌名（Oh My Pi）、模型 id、技术枚举（如 `Unicode`、`Shell`、`true`/`false`）
- **未覆盖**：设置向导部分、advisor 配置页、部分非设置选择器

## 反馈

请注明：omp 版本、界面路径（如「设置 → 模型 → 采样」）、截图或 key 名。

## 项目状态

详细进度见 [`docs/local/STATUS-2026-07-24-paused.md`](./docs/local/STATUS-2026-07-24-paused.md)。

## 许可

上游与本衍生改动均遵循 [MIT License](./LICENSE)（含原作者版权声明）。

---

English: Independent Chinese UI localization for Oh My Pi (`omp`), baseline **17.1.0**, maintained on an **irregular** schedule. Not an official release channel. The official omp binary does not include the i18n loader required for Chinese — you must run from this repo's source code (`bun run src/cli.ts` from `packages/coding-agent/`). Pre-compiled binaries with embedded Chinese are planned (see release roadmap).
