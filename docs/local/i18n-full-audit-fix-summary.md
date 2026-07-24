# i18n 全检修复摘要

> 2026-07-24 | Worker: MiMo

---

## 修复范围

### P0 — 插件页中文化

**文件**: `packages/coding-agent/src/modes/components/plugin-settings.ts`

通过 `interceptUIString()` 拦截了以下硬编码英文字符串：

| 原文 | 中文 |
|---|---|
| Plugins | 插件 |
| No plugins installed | 未安装插件 |
| Install npm plugins: ... | 安装 npm 插件：... |
| Install marketplace plugins: ... | 安装市场插件：... |
| Enter to configure · Esc to go back | Enter 配置 · Esc 返回 |
| Enabled | 已启用 |
| Enable or disable this plugin | 启用或禁用此插件 |
| Enable or disable this marketplace plugin | 启用或禁用此市场插件 |
| Enter to edit · Esc to go back | Enter 编辑 · Esc 返回 |
| Enter to select · Esc to cancel | Enter 选择 · Esc 取消 |
| Enter to save · Esc to cancel | Enter 保存 · Esc 取消 |
| Enter to toggle · Esc to go back | Enter 切换 · Esc 返回 |
| shadowed by | 被覆盖 |
| version / scope / install path / installed at / last updated / git sha | 版本 / 作用域 / 安装路径 / 安装时间 / 更新时间 / Git SHA |
| (unknown) | （未知） |
| (not set) | （未设置） |
| Configure ${key} | 配置 {key} |
| Select value for ${key} | 为 {key} 选择值 |
| Type: | 类型： |
| features | 功能 |

**文件**: `packages/coding-agent/src/i18n/lang/zh-ui.json` — 新增 30+ 个插件相关 key

---

### P1 — 提供商 Timeouts 分组

**文件**: `en-settings-providers.json` + `zh-settings-providers.json`

| Key | EN | ZH |
|---|---|---|
| `tabs.providers.groups.Timeouts` | Timeouts | 超时 |

---

### P1 — Tiny 模型选项描述中文化

**文件**: `en-settings-providers.json` + `zh-settings-providers.json`

新增 `settings.providers.tinyModel.options.*` 共 6 个选项的 label + description：

| 模型 | ZH 描述 |
|---|---|
| Online (TINY role, else @smol) | 在线标题生成：使用 /models 中的 TINY 角色模型... |
| LFM2 350M | 推荐的本地模型；速度/质量最佳平衡... |
| Qwen3 0.6B | 最强大的本地选项；首次加载较慢... |
| Gemma 270M | 最小的可行本地选项；质量较低... |
| Qwen2.5 0.5B | 平衡的本地回退；中等质量... |
| LFM2 700M | 最高质量的本地选项... |

新增 `settings.providers.tinyModelDevice.options.*` 共 14 个选项的 label + description（Default/GPU/CPU/Metal/WebGPU/CUDA/DirectML/CoreML/Auto/WASM/WebNN/WebNN GPU/WebNN CPU/WebNN NPU）

新增 `settings.providers.tinyModelDtype.options.*` 共 14 个选项的 label + description（Default/q4/q4f16/q8/fp16/fp32/int8/uint8/bnb4/q2/q2f16/q1/q1f16/Auto）

---

### P1 — TTS 语音选项描述中文化

**文件**: `en-settings-providers.json` + `zh-settings-providers.json`

新增 `settings.tts.localModel.options.kokoro.*`：Kokoro-82M 描述

新增 `settings.tts.localVoice.options.*` 共 12 个语音的 label：

| 语音 ID | ZH label |
|---|---|
| af_heart | Heart（美国女声） |
| af_bella | Bella（美国女声） |
| af_nicole | Nicole（美国女声） |
| af_aoede | Aoede（美国女声） |
| af_kore | Kore（美国女声） |
| af_sarah | Sarah（美国女声） |
| am_michael | Michael（美国男声） |
| am_fenrir | Fenrir（美国男声） |
| am_puck | Puck（美国男声） |
| bf_emma | Emma（英国女声） |
| bm_george | George（英国男声） |
| bm_fable | Fable（英国男声） |

同步新增 `settings.speech.voice.options.*` 同上 12 个语音

---

### P1 — 真实缺失 options（审计去伪后补全）

**文件**: `en-settings-providers.json` + `zh-settings-providers.json`

| Path | 选项数 | 说明 |
|---|---|---|
| `settings.providers.unexpectedStopModel.options.*` | 6 | 意外停止模型选项（online/qwen3-1.7b/llama3.2:3b/gemma-3-1b/qwen2.5-1.5b/lfm2-1.2b） |
| `settings.providers.image.options.openai-codex.*` | 1 | OpenAI Codex (ChatGPT) 选项 |
| `settings.providers.kimiApiFormat.options.auto.*` | 1 | Kimi API 自动格式选项 |
| `settings.providers.streamFirstEventTimeoutSeconds.options.*` | 5 | 流首事件超时选项（Auto/Off/5min/10min/30min） |
| `settings.providers.streamIdleTimeoutSeconds.options.*` | 5 | 流空闲超时选项（Auto/Off/5min/10min/30min） |

---

## 修改文件清单

| 文件 | 变更类型 |
|---|---|
| `packages/coding-agent/src/modes/components/plugin-settings.ts` | 添加 `interceptUIString` 拦截 |
| `packages/coding-agent/src/i18n/lang/zh-ui.json` | 新增 30+ 插件相关 key |
| `packages/coding-agent/src/i18n/lang/en-settings-providers.json` | 新增 ~120 个 option key（Tiny/TTS/Timeout/unexpectedStop/image/kimi） |
| `packages/coding-agent/src/i18n/lang/zh-settings-providers.json` | 新增 ~120 个 option key（中文翻译） |

---

## 硬门禁验证

- [x] 插件页 UI 中文（所有硬编码字符串已通过 `interceptUIString` 拦截）
- [x] Timeouts 分组中文（`tabs.providers.groups.Timeouts` = 超时）
- [x] Tiny/TTS 相关 options description 中文（tinyModel/tinyModelDevice/tinyModelDtype/tts.localVoice/tts.localModel/speech.voice 全部 options）
- [x] JSON 文件格式验证通过
- [x] 摘要文档存在

---

## 统计

- 插件页新增 key: ~30（zh-ui.json）
- 提供商 options 新增 key: ~240（en + zh 各 ~120）
- 总计新增 key: ~270
