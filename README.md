# omp-zh-i18n

**Oh My Pi（`omp`）中文界面汉化项目** — 独立维护，面向中文用户。

| 项 | 说明 |
|---|---|
| 基线 | `@oh-my-pi/pi-coding-agent` **17.1.0** |
| 维护方 | 本仓库（非官方） |
| 更新节奏 | **不定期**：人力允许时对照上游补 key / 补二级三级菜单文案 |
| 范围 | 欢迎页、设置一/二/三级、插件页、主题名、常用 UI chrome |

上游产品：[Oh My Pi](https://github.com/can1357/oh-my-pi)（MIT）。本仓库在其源码基础上维护中文 `lang` 与必要的 i18n 接线改动；**不承诺**跟随每一个上游小版本同日更新。官方升级后若出现英文回退（缺 key），属预期现象。

## 这是什么

- 包内语言文件：`packages/coding-agent/src/i18n/lang/zh-*.json`（及配套 `en-*.json` SoT）
- 运行时：bundled lang → 可选用户覆盖 `~/.omp/lang`
- 设置标签 / 分组 / 选项 / 部分 UI 硬编码串经 interceptor 翻译

品牌名、模型 id、技术枚举（如 `Unicode`、`Shell`、`true`/`false`）可保留英文。

## 使用（开发树）

```sh
# 依赖 Bun
git clone https://github.com/feigo313/omp-zh-i18n.git
cd omp-zh-i18n
bun install
cd packages/coding-agent
bun run src/cli.ts
# 设置 → 交互 → 语言 → 简体中文
```

仅想覆盖已有官方安装的语言文件时，可将 `packages/coding-agent/src/i18n/lang/zh-*.json` 复制到 `~/.omp/lang/`（需自行确认路径与版本匹配）。

## 不承诺

- 与官方同日发布  
- 100% 无英文残留（id / 品牌 / 技术型号可保留）  
- 替代官方安装渠道

## 反馈

请注明：omp 版本、界面路径（如「设置 → 模型 → 采样」）、截图或 key 名。

## 许可

上游与本衍生改动均遵循 [MIT License](./LICENSE)（含原作者版权声明）。

---

English: Independent Chinese UI localization for Oh My Pi (`omp`), baseline **17.1.0**, maintained on an **irregular** schedule. Not an official release channel.
