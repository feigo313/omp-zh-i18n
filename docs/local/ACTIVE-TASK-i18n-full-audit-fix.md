# ACTIVE: 全检残留补译（插件页 + 二级/三级 options + 提供商 Tiny/TTS）

> **状态**：派发中  
> **SoT**：本文 + `docs/local/i18n-full-ui-audit-2026-07-24.md` + `docs/local/i18n-full-audit-2026-07-24.md`  
> **Worker**：仅 **MiMo**  
> **Coord**：终验，不手改 lang  

---

## 0. 用户要求

- 解释说明类 **不论几级菜单** 都要检查并翻译，禁止遗漏  
- 模型名 / 技术专名 / 品牌 id **非必要可不译**  
- 开源策略：不保证每版跟译（见 `OPENSOURCE-I18N.md`）

---

## 1. P0 — 插件页整页英文

| 现象 | `Plugins` / `No plugins installed` / Install npm & marketplace 说明 |
|---|---|
| 做法 | 定位插件设置组件硬编码字符串 → `interceptUIString` / zh-ui keys → 中文 |
| 建议 key 例 | `ui.plugins.title`、`ui.plugins.empty`、`ui.plugins.installNpm`、`ui.plugins.installMarketplace`（以代码为准） |

---

## 2. P1 — 提供商 Tiny / TTS 选项

| 项 | 策略 |
|---|---|
| Tiny / 意外停止模型 当前值显示 `Online (TINY role, else @smol)` | 补 `settings.providers.*` / tiny model options 的 **description 中文**；label 可保留型号 |
| `Heart (American female)` 等 TTS 音色 | **名称可英文**；若有 description **必中文**；缺 options key 则从 schema/`TTS_LOCAL_VOICE_OPTIONS` 写入 en+zh |
| `tabs.providers.groups.Timeouts` | 必须中文 **超时**（en 可 Timeouts） |
| `Gemini web_search 模型` 等混排 | label 规范中文 |

源：`settings-schema.ts`、`tiny/models.ts`、TTS voice options。

---

## 3. P1 — 真实缺失 options（去伪后补全）

1. 读 `i18n-full-audit-2026-07-24.md` §C  
2. **过滤误报**：options 必须属于该 path 的 schema / 外部 `*_OPTIONS`（勿信错误挂接的 path）  
3. 对真实缺失：写入 en（schema 原文）+ zh（说明中文）  
4. 写/跑 gate：每个带 options 的 path，每个 value 的 label+description（有则）存在；description 无汉字且非白名单 → fail  

优先真实缺口：`advisor.immuneTurns`、personality/exemptTools 等 **instructional** options；数字 `768` 可只译 description「默认」类。

---

## 4. P2（有余力）

- 记忆字段 `Mnemopi xxx` 前缀统一为「记忆派 …」  
- `~250 tokens` 类 description 可保留为白名单  

---

## 5. 硬门禁

- [ ] 插件页 UI 中文（无 No plugins installed 英文整句）  
- [ ] Timeouts 分组中文  
- [ ] Tiny/TTS 相关 options description 中文  
- [ ] gate：真实 option 覆盖；无空串/无重复 key  
- [ ] `docs/local/i18n-full-audit-fix-summary.md`  

## 6. 禁止

- 只报 keys(zh)==keys(en)  
- 把模型/品牌 id 强行译成中文破坏配置  
- commit / 写 `~/.omp/lang` / 新开多余终端  
