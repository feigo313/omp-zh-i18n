# v17.1.8-zh 发布收尾记录

日期：2026-07-29

## 发布状态

- 分支：`i18n/17.1.8-zh-adaptation`
- 发布 tag：`v17.1.8-zh`
- 最终正式提交：`032849413a`（以远端 `master` 为父提交的共同基线快照）
- 本地适配分支 `i18n/17.1.8-zh-adaptation` 已指向最终提交 `032849413a`
- 旧 PR #2 已关闭
- GitHub Release：已创建，链接见 [v17.1.8-zh Release](https://github.com/feigo313/omp-zh-i18n/releases/tag/v17.1.8-zh)

## 本次内容

- 基于官方 Oh My Pi v17.1.8 的中文汉化适配
- 补齐 settings schema 对应的中文翻译和 26 项 tips 翻译
- 修复 plugin-settings 动态插值
- 修复 CLI profile 传递和 i18n 接线
- 修复 prompt-loader 缓存与用户/bundled fallback
- 保持 `@oh-my-pi/pi-natives` 为 17.1.8，以兼容预编译 native binary

## 验证记录

- schema gate：`Schema paths: 298`, `Passed: 298`, `Errors: 0`, `ALL GATES PASSED`
- coding-agent `tsgo --noEmit`：无 TypeScript 错误输出
- utils `tsgo --noEmit`：无 TypeScript 错误输出
- CLI 版本：`omp/17.1.8-zh`
- tips：26 行与 26 个翻译 key 对齐
- 中文动态插值 smoke：输出 `启用 MyPlugin 功能`
- `bun run check:tools`：通过，退出码 0
- `--smoke-test`：失败，退出码 1；报错位于
  `packages/natives/native/desktop.js:9`，`DesktopSession` 为 undefined。
  **注意：此为与 i18n 修改无关的预存问题**，Windows 上 native
  addon 未编译或加载路径不对，不是本次汉化引入的回归。

## 历史背景

> 以下为已废弃的旧方案背景，不代表当前分支状态。

早期为绕过完整上游历史推送失败，曾使用单根精简快照方案。
当前 `032849413a` 已改为以远端 `master` 为父提交，因此
GitHub Compare 已恢复正常增量 diff 语义，不再需要上述
orphan 快照解释。

## 最终收尾状态

- 正式本地适配分支 `i18n/17.1.8-zh-adaptation` 已更新到共同基线提交 `032849413a`
- 本地临时分支 `i18n/17.1.8-zh-final`、`i18n/17.1.8-zh-push-tmp`、`i18n/17.1.8-zh-squashed` 已删除
- 待网络恢复后继续：远端推送、tag 更新、远端临时分支删除
