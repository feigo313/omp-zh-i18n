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
- `bun run check:tools`：退出码 1，报告 29 个既有格式问题；未将该结果标记为通过

## 推送说明

完整上游历史推送时远端 `index-pack` 报缺少对象。为完成推送，保留原始本地适配分支，并从发布 HEAD 创建单根快照提交后推送到远端适配分支和 tag。该精简分支与远端 `master` 没有共同提交历史，因此 GitHub Compare 页面会显示完整快照为新增内容，不能用于正常的增量 PR diff。未跟踪的 `.agents/`、`.reasonix/`、`docs/local/` 目录未加入发布提交。

## 最终收尾状态

- 正式本地适配分支 `i18n/17.1.8-zh-adaptation` 已更新到共同基线提交 `032849413a`
- 本地临时分支 `i18n/17.1.8-zh-final`、`i18n/17.1.8-zh-push-tmp`、`i18n/17.1.8-zh-squashed` 已删除
- 待网络恢复后继续：远端推送、tag 更新、远端临时分支删除
