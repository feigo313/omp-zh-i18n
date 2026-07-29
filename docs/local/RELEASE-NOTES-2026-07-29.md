# omp 中文版 17.1.0-zh.2

基于 Oh My Pi 17.1.0，同步上游 v17.1.8 新增的设置项中文翻译。

本版是 `v17.1.0-zh.1` 之后的增量更新，仅补充上游 v17.1.1 → v17.1.8
期间新暴露的设置字段，不改动已有翻译。

## 更新内容

对照上游 `settings-schema.ts` 的 v17.1.0 → v17.1.8 差异，补齐
10 个新增设置字段的 zh / en 翻译，共 31 个新 key。

### 新增翻译字段

- **tools — computer（计算机使用）**
  - `computer.backend` 后端选择
  - `computer.display` 显示方式
  - `computer.enabled` 开关
  - `computer.maxHeight` / `computer.maxWidth` 最大尺寸
  - 各枚举选项（local / vnc 等）

- **tools — inspect_image（图片检查）**
  - `inspect_image.mode` 检查模式（auto / off / on）
  - `inspect_image.timeoutMs` 超时时长（1 / 2 / 3 / 5 分钟选项）

- **tasks — 任务派发**
  - `task.enableEffort` 每任务思考力度开关
  - `task.maxEffort` 每次派发最大思考力度

- **providers — live**
  - `live.voice` 实时语音音色

### 文件变更

- `packages/coding-agent/src/i18n/lang/en-settings-tools.json`
- `packages/coding-agent/src/i18n/lang/zh-settings-tools.json`
- `packages/coding-agent/src/i18n/lang/en-settings-tasks.json`
- `packages/coding-agent/src/i18n/lang/zh-settings-tasks.json`
- `packages/coding-agent/src/i18n/lang/en-settings-providers.json`
- `packages/coding-agent/src/i18n/lang/zh-settings-providers.json`
- `packages/coding-agent/CHANGELOG.md`

## 约束遵守

- en / zh key 严格对称，空串清零
- 品牌 / 模型 id 保留英文（如 `Computer`）
- 仅改 `packages/coding-agent/src/i18n/lang` 及 CHANGELOG
- 未提交任何 api key、.env 或凭证

## 安装

```bash
git clone https://github.com/feigo313/omp-zh-i18n.git
cd omp-zh-i18n
bun install
OMP_LANG=zh bun run packages/coding-agent/src/cli.ts
```

本 prerelease 以源码方式分发，暂不提供预编译二进制。

## 完整对照

详见 `docs/local/WORKLOG-2026-07-29.md`。
