# omp 全检报告（代码 + 全 tab UI）

> 2026-07-24 | Coord 全检（非抽检）  
> 代码明细：`docs/local/i18n-full-audit-2026-07-24.md`  
> Orca 终端：`omp-full-audit`（已关）

---

## 版本

| 源 | 值 |
|---|---|
| `packages/utils`（VERSION） | **17.1.0** |
| `packages/coding-agent` | **17.1.0** |

欢迎页不应再因 17.0.8/17.0.9 漂移误报（需重开 omp 验证）。

---

## 结论总览

| 维度 | 结论 |
|---|---|
| 设置主路径（一～三级已修批次） | **大体通过**：服务层级、Role Storage、STT 触发、记忆模型介绍、Mnemopi 分组、主题名、欢迎/设置壳 |
| 全量严格「凡说明必中文」 | **未满分**：仍有二级/三级 options 缺口 + 若干 UI 英文壳 |
| 空串 / settings 重复 key / commands 缺 key | **0** |

---

## A. 已通过（全 tab 实机）

| Tab | 结果 |
|---|---|
| 欢迎 | 中文壳（本轮 dump 偏短，此前已验欢迎回来/提示） |
| 外观 | 主 label 中文；主题 id 当前值可能仍显示 `titanium`/`light`（存储值） |
| 模型 | 预走查/采样/服务层级·OpenAI…子代理/模型角色存储 **中文** |
| 交互 | 语音转文字/语音模型/提交触发 **中文**；语音模型当前值可显示 `Parakeet TDT v3 (SoTA)`（名称策略允许） |
| 上下文 | 主流程中文（TTSR 品牌可留） |
| 记忆 | 分组 **记忆派**；记忆模型显示中文向选项；字段仍多 `Mnemopi xxx` 前缀中英混 |
| 文件 / Shell / 工具 / 任务 | 主体中文 |
| 提供商 | 多数中文；仍有品牌与部分选项英文（见下） |
| 插件 | **整页英文**（见下） |

---

## B. 仍需补译 / 未覆盖（全检清单）

### B1. 代码扫描：options 仍缺（解析 154 条，需人工去伪）

自动解析可能把无关 options 挂到错误 path（如 `maxInFlightRequests` 误挂 Role Storage 选项）。**以「源码 `*_OPTIONS` + 实机英文」为准**，优先：

| 区域 | 问题 | 优先级 |
|---|---|---|
| **插件 tab** | `Plugins` / `No plugins installed` / Install 说明三行全英文（硬编码 UI，可能不在 settings lang） | **P0** |
| **提供商** | `Online (TINY role, else @smol)`、`Heart (American female)`、`Gemini web_search 模型`、分组 `Timeouts` 可能缺 zh、`Unlimited` | **P1** |
| **模型** | 部分数字 options（如 advisor immune turns「2 turns」）及 personality/exemptTools 等 options 可能仍缺 en/zh | **P1** |
| **工具** | 输出限制等数字项 description 仅 `~250 tokens`（可作白名单） | P2 |
| **分组名** | `Agent`/`Git`/`LSP`/`Bash`/`GitHub`/`Fireworks` 可作品牌；`Timeouts` 应中文「超时」 | **P1（Timeouts）** |
| **记忆字段** | 分组已「记忆派」，但 label 仍大量 `Mnemopi 数据库路径` 等 — 可统一品牌策略 | P2 |

完整自动列表：`docs/local/i18n-full-audit-2026-07-24.md` §C/D/F。

### B2. 实机英文壳（本次全 tab 扫到）

| Tab | 英文/混排 |
|---|---|
| 插件 | Plugins；No plugins installed；Install npm/marketplace 说明 |
| 提供商 | Tiny 模式当前值 `Online (TINY role, else @smol)`；语音 `Heart (American female)`；Exa / Fireworks 品牌；`Kokoro-82M` 型号 |
| 外观 | 当前主题值 `titanium`/`light`（id；列表显示名已有中文表） |
| 交互 | `one-at-a-time` / `immediate` / `default` 等枚举值显示 |
| 记忆 | 字段前缀 Mnemopi… |

---

## C. 已确认修好的批次（回归）

- 服务层级 options（无/自动/继承/优先…）  
- Model Role Storage（模型角色存储 / 全局 / 按项目）  
- STT 提交触发（从不/松开/…）  
- 记忆模型介绍中文  
- Mnemopi 分组 → 记忆派  
- 主题显示名 `themes.*.label`  
- utils 17.1.0  

---

## D. 建议下一步（派 MiMo，不手改）

1. **P0** 插件页 i18n（interceptor / zh-ui 文案）  
2. **P1** 按 `i18n-full-audit-2026-07-24.md` 清真实 miss_opt（先修 gate 误报，再补 key）  
3. **P1** 提供商 Tiny/TTS 语音 options 介绍中文（名称可留）  
4. **P1** `tabs.providers.groups.Timeouts` → 超时  
5. 可选：Mnemopi 字段 label 去英文前缀统一为「记忆派 …」  

---

## E. 开源说明

仍见 `docs/local/OPENSOURCE-I18N.md`：不保证每版跟译；不定期更新；有能力可自行拉源补译。
