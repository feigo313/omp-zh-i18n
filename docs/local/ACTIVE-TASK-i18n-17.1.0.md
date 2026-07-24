# ACTIVE: 跟版 v17.1.0 + 二级/三级菜单补译 + 积压 P1

> **状态**：**MiMo 已完成 + Coord 终验通过**（2026-07-24）  
> **更新**：2026-07-24  
> **上游**：`can1357/oh-my-pi` **v17.1.0**  
> **摘要**：`docs/local/i18n-17.1.0-summary.md`  
> **开源策略**：`docs/local/OPENSOURCE-I18N.md`  
> **Worker**：MiMo；Coord 终验  
> **备注**：`Scale` 等专有层级名可保留英文；description 已中文

---

## 0. 背景

- 欢迎页已提示：`New version 17.1.0 is available. Run: omp update`
- 本地曾只改 coding-agent 版本，**utils 仍 17.0.8** → 假升级提示；跟 17.1.0 时必须 **整 monorepo 版本/源码对齐**
- 用户要求：跟版核对后**补充翻译**，重点 **二级/三级菜单**（options / 下拉介绍），**不要遗漏**
- 昨日积压 P1 一并纳入本任务

---

## 1. 目标

| # | 目标 |
|---|---|
| A | 拉取/对齐上游 **v17.1.0**（至少 coding-agent + utils + 影响 i18n 的源） |
| B | VERSION / package 版本与 **17.1.0** 一致，消除错误 Update Available（或与真上游一致后的真实提示） |
| C | schema path + **options 二级/三级** 全覆盖：label 可品牌英文，**description 用户可读句必中文**（用户策略见各条） |
| D | 清掉昨日清单 §G–§K 积压 |
| E | 摘要 + 开源更新策略说明（见 `docs/local/OPENSOURCE-I18N.md`） |

---

## 2. Phase 0 — 备份

```
lang/_backup/2026-07-24-pre-17.1.0/
  当前全部 en-settings* / zh-* / en-commands / zh-commands
```

---

## 3. Phase 1 — 拉 17.1.0 并核对

```text
gh api / git：tag v17.1.0
对比相对当前工作区：
  - packages/coding-agent/src/i18n/lang/en-*.json
  - settings-schema.ts / service-tier.ts / stt/* / tiny/models.ts
  - packages/*/package.json version（至少 utils + coding-agent）
```

产出报告段落：新增/删除 schema path、新增 options、VERSION 来源。

同步策略（MiMo 选可复现一种并写摘要）：

1. 用上游 tarball/sparse 覆盖 **en lang + schema 相关源**（若整仓 merge 太大，至少保证 SoT 正确）  
2. monorepo `version` 对齐 **17.1.0**（**必须**含 `packages/utils/package.json`）

---

## 4. Phase 2 — Key / 二级三级菜单扫描（硬门禁前置）

对每个 schema `path` 且含 `ui`：

1. `settings.{path}.label` / `.description` 必须在 en+zh  
2. 若有 `options`（含外部 `*_OPTIONS` 数组）：每个 `value` 必须有  
   `settings.{path}.options.{value}.label`  
   `settings.{path}.options.{value}.description`（有 description 时）  
3. 分组：`tabs.{tab}.groups.{GroupName}` 必须有 zh  

**重点 tab（二级/三级）**：模型（采样服务层级、提示词 Role Storage、Prewalk）、交互（语音模型/提交触发）、记忆（记忆模型 options、Mnemopi 分组）、外观（主题名已修，回归即可）、工具/任务/提供商 全扫。

脚本：扩展或新建 `check-schema-i18n` —— **fail if any path/option missing**。

---

## 5. Phase 3 — 积压 P1（必须全做）

| ID | 项 | 策略 |
|---|---|---|
| G | 服务层级 options | `service-tier.ts` 全表 → en+zh；value 英文 |
| H | Model Role Storage | `settings.modelRoleStorage.*` 全套 |
| I | 语音模型 / 提交触发 | 模型 **名可英**，**介绍中文**；触发 **全中文** |
| J | 记忆模型 options | **名可英**，**介绍中文**（`tiny/models.ts`） |
| K | Mnemopi 分组 | `tabs.memory.groups.Mnemopi` → **记忆派** |
| P0 | 版本 | utils(+monorepo) → 17.1.0 |

主题名：已修，回归即可。

---

## 6. Phase 4 — 质量

- 非白名单：无汉字且含空格的 description → 必须中文  
- 白名单：短品牌/协议 id、true/false、数字单位  
- 幽灵 key：无 schema 的删掉  

---

## 7. 硬门禁

- [ ] monorepo 运行时 `VERSION` 与宣称版本一致（读 utils package）  
- [ ] schema path 覆盖 100%  
- [ ] options 二级/三级覆盖 100%（有 description 的必有中文 desc）  
- [ ] 积压 G–K、P0 全关闭  
- [ ] `docs/local/i18n-17.1.0-summary.md`  

---

## 8. 开源说明（用户要求）

见 **`docs/local/OPENSOURCE-I18N.md`**（GitHub README 可链过去）：

- **不保证**每个上游小版本都跟译  
- **不定期**更新汉化  
- 有能力者可自行 fork / 拉 en 对照更新  

---

## 9. 角色

| 谁 | 做 |
|---|---|
| 用户 | 下令「派 MiMo」后执行 |
| MiMo | Phase 0–7 |
| Grok | 终验 + 可选 Orca 抽二级菜单 |
