# 更新日志 — omp-zh-i18n

本文件记录 **Oh My Pi 中文版**的发布情况。上游 `can1357/oh-my-pi` 自身的详细变更请见
[上游 CHANGELOG](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/CHANGELOG.md)。

## 汉化范围说明

本项目**只汉化 TUI / GUI 界面**:欢迎页与提示、聊天渲染器、各类覆盖层、设置界面、
斜杠命令在界面中的反馈文案、以及 `omp stats` 仪表盘的全部页面。

**omp 自身的 `--help`、参数说明等命令行帮助输出保持英文**,这是本项目的既定设计。

## [v18.4.10-zh] — 2026-10-03

对齐官方 **v18.4.10**(2026-10-02 发布,commit `cb0d5295`)。
上一中文版为 [v18.3.1-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.3.1-zh)。

本次官方跨了 8 个补丁版本(18.3.2 → 18.4.10,共 1638 个提交),上游对 TUI 与
`omp stats` 仪表盘做了较大重构,界面文案变动较多,因此本次汉化随上游同步重做了一轮。

### 汉化

- **词表从 3997 条扩充到 4722 条**,补齐了 v18.4.x 新增与改写的界面文案。
- 补齐了 v18.3.1 遗留未汉化的 5 个 TUI 渲染器:`wait`、`proc-render`、
  `cfg-render`、`find`、代码审查批注浮层(annotation overlay)。
- **修正了一个既有缺陷**:欢迎页提示文件有 29 行而对应的键表只有 27 条,导致第 13 条
  起的提示渲染出错位的中文。两处现已对齐为 29 条。
- `omp stats` 仪表盘随上游重构完成全量重做,包括新增的「烦躁情绪」页面、
  「调用链」页面的各视图,以及侧边导航与时间范围说明。
- 模型中心新增的预设保存、角色管理、OAuth 登录等界面,以及顾问配置、Agent Hub、
  快捷键帮助页、Git 侧边栏、进程查看器、日志查看器等界面完成汉化。

### 界面文案

- 若干键位提示在中文里采用 `回车` / `Esc` 等通行写法;若你自定义了键位映射,
  这类提示不会随之变化。

### 质量校验

| 项目 | 结果 |
|---|---|
| 官方源码树校验 | 8505 个文件 blob SHA 与官方清单逐条一致 |
| 类型检查 | 17 个包全部通过 |
| 代码规范 / 格式 | 0 warning / 0 error |
| 翻译资源契约测试 | 9 通过 / 0 失败(11306 断言) |
| 界面文案接线完整性 | 1361 处调用全部可解析,0 悬空 |
| 英文回退保真 | 1361 条与官方原文逐一比对,0 漂移 |
| CLI 冒烟测试 | 通过 |
| Windows 二进制 | `--version` / `--smoke-test` 通过 |

### 已知限制

- **测试套件存在既有环境性失败**:在 Windows 上,`packages/coding-agent` 全量 16199 个
  用例中有 296 个失败,`packages/tui` 有 11 个失败。这些全部位于与官方 v18.4.10
  逐字节相同的文件中,成因为 Windows 路径分隔符、缺少 POSIX shell、文件锁与权限、
  符号链接权限、需要真实浏览器与外网网络等,与汉化无关。
- 少量设置项标签(主题名、提供商标识、协议名)按惯例保留英文。

### 产物

| 文件 | 说明 |
|---|---|
| `omp-windows-x64.exe` | Windows x64 独立可执行文件 |

```
SHA-256: a246752734afe86d49ac83071a23240008d665c090642e7a6651bb7131577364
大小:    371436544 字节
```

[下载页面](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.4.10-zh)

## 历史版本

- [v18.3.1-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.3.1-zh) — 2026-09-27
- [v18.2.6-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v18.2.6-zh) — 2026-09-19
- [v17.2.1-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.2.1-zh)
- [v17.2.0-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.2.0-zh)
- [v17.1.8-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.1.8-zh)
- [v17.1.0-zh](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.1.0-zh)
