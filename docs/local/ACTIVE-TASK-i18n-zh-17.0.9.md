# ACTIVE: i18n 跟版 17.0.9 + 全量补译（非仅 key 对齐）

> **状态**：计划就绪 → **MiMo 执行** → Coord（Grok）自检  
> **更新**：2026-07-23  
> **不跑 Kimi**（用户指定：翻译轻量，MiMo 做、Grok 验）  
> **本文件是执行 SoT**

---

## 0. Coord 理解复述（对齐用户意图）

1. **官方已到 v17.0.9**；本仓/包装仍是 17.0.8 汉化完成态 → **必须跟版**，不是小修。
2. 前两轮主要做了：**EN key 契约对齐**（删 extra、补 missing groups、欢迎壳）。  
   **不等于**「每一条用户可见说明都已合格中文」。
3. 用户实机发现：**任务 isolation 模式末项、提供商/插件区说明等大量仍英文或未译**——属于 **质量/补译债 + 可能新版新增 key**，不是「PR 几个 json 优化完就收工」。
4. 旧 PR/旧语言包时间早于现网；**禁止偷懒**：不能只 diff key 集合，要通过后必须 **逐 tab 可见文案可接受中文**（品牌/协议词可白名单）。
5. **Worker = MiMo**（复用已有终端，勿新开）。Coord **不自己拉源码/批量翻译**；只派任务 + 终验。

---

## 1. 目标

| 目标 | 说明 |
|---|---|
| A. 跟版 | 以 **上游 v17.0.9** 的 `en-settings-*.json` + `en-commands.json`（及 17.0.9 新增的任何 en/zh 契约文件）为 **EN SoT** |
| B. key 对齐 | `keys(zh) === keys(en)` 每分类；commands 同；无空串、无重复 key |
| C. **全量可见补译** | 所有 **用户可读句子**（label/description/group/tab/帮助壳）有合格中文；禁止大段英文 description 残留 |
| D. 壳层保持 | 欢迎页 / 设置标题 / footer 等 zh-ui 不回退 |
| E. 交付 | 摘要 + 可选 `omp` 自检清单；**不 commit** |

---

## 2. 范围

### 2.1 必改

```text
packages/coding-agent/src/i18n/lang/
  en-*.json          # 用 17.0.9 上游覆盖/同步（只作 SoT，勿手编造 EN）
  zh-settings-*.json
  zh-commands.json
  zh-ui.json / zh-tips.json / zh-hotkeys.json / zh-runtime.json  # 对照 17.0.9 增量补
packages/coding-agent/package.json  # version → 17.0.9（若 monorepo 其它包 version 需与上游一致则一并同步）
```

可选：`scripts/realign-zh-i18n.ts` 扩展 quality 报告（`zh==en` 句子队列、按 tab 统计）。

### 2.2 禁止

- 不写 `~/.omp/lang`；不改 `lan`→`lang`
- 不调用旧 extract/generate/translate 写用户目录的脚本
- 不 git commit / 不 GitHub
- **不新开** agent 终端（复用现有 MiMo）
- 不为「省事」只跑 key realign 就报完成

---

## 3. 白名单（允许保留英文）

仅当 **整值** 属于：

- 品牌/协议：MCP、LSP、API、HTTP、OpenAI、GitHub、Unicode、ASCII、Powerline、TTSR、APFS、ZFS、btrfs、ProjFS、Overlayfs、Reflink 等 **短 label**
- token 形态：`50%`、`UTF-8`、`~12.5K tokens` 等
- 纯技术枚举值且 UI 设计就是英文 id

**不允许白名单**：含空格的英文整句 description、多词说明、选项长文案（用户点名的「模式最后一项内容」「插件板块说明」等）。

---

## 4. 执行步骤（MiMo 严格按序）

### Phase 0 — 备份

```text
lang/_backup/2026-07-23-pre-17.0.9/
  全部现有 zh-*.json + 当前 en-settings/commands（便于 diff）
```

### Phase 1 — 拉取上游 17.0.9 EN（SoT）

任选稳定方式（MiMo 自选可复现的一种并写进摘要）：

```text
# 推荐
gh api repos/can1357/oh-my-pi/tarball/v17.0.9
# 或
git clone --depth 1 --branch v17.0.9 https://github.com/can1357/oh-my-pi.git <tmp>
```

从上游拷贝到本仓：

```text
packages/coding-agent/src/i18n/lang/en-*.json
# 若上游 en.json / 其它 en 分片有变，一并同步
```

核对 `packages/coding-agent/package.json` version = **17.0.9**（与上游 coding-agent 对齐；workspace 其它包若版本锁死则按上游 monorepo 同步策略处理，**摘要写明**）。

### Phase 2 — key 对齐 report（硬）

对每个 `en-settings-C` / `en-commands`：

- missing / extra / 空串 / 重复 key
- **新增 key 列表**（相对 17.0.8 备份）= 优先补译队列 A

跑现有 `realign-zh-i18n.ts` 或等价：settings/commands apply，**salvage 非空旧译**；新 key 禁止长期 `""`。

### Phase 3 — 全量质量扫（硬，用户强调）

对每个 `zh-settings-*.json` + `zh-commands.json` + `zh-ui.json`：

对每个 `(enVal, zhVal)`：

1. `zh` 缺失或 `""` → 必须译  
2. `zh == en` 且 **非 §3 白名单** → 必须译  
3. `zh` 无汉字且含空格/小写英文句 → 必须译  
4. 占位符 `{x}` / `%s` 集合必须与 en 一致  

**按 tab 验收**（设置 UI 路径，不得跳过）：

```text
外观 / 模型 / 交互 / 上下文 / 记忆 / 文件 / Shell / 工具 / 任务 / 提供商 / 插件
```

用户点名重点：

- **任务**：isolation **mode 全部选项**（含最后一项）的 label **与 description**
- **提供商**：所有说明、Websets、以及 **插件 tab/相关说明**
- 每一 tab：滚动可见的 description **不得整段英文**（白名单除外）

### Phase 4 — 壳层回归

- `interceptWelcomeString` 全 key 仍中文  
- `ui.settings.title` / footer 五 key / plugins label 仍中文  
- 若 17.0.9 interceptor 新增 welcome key → 补 zh-ui  

### Phase 5 — 门禁

- [ ] coding-agent 声明 17.0.9（或摘要解释 monorepo 版本策略）  
- [ ] 每文件 `keys(zh)==keys(en)`（settings 分类 + commands）  
- [ ] 无空串、目标 zh 无重复 key  
- [ ] 占位符一致  
- [ ] **非白名单 zh==en 句子 = 0**（脚本统计）  
- [ ] 摘要含：相对 17.0.8 新增/删除 key 数、每 tab 补译条数、白名单放行样例  

### Phase 6 — 摘要

写：`docs/local/i18n-zh-17.0.9-summary.md`  
路径、数字、重点 tab 抽检 3 句中文样例（任务末项、提供商、插件）。

---

## 5. Coord 终验（Grok，MiMo done 后）

只读脚本，不代写翻译：

1. package/lang 版本与 key 集  
2. 非白名单 `zh==en` 计数必须为 0（或极低并解释）  
3. 任务 isolation 最后选项 description 含中文  
4. 提供商/插件相关 description 抽样含中文  
5. 欢迎 + 设置标题 smoke（`OMP_LANG=zh` bun -e 或现有 omp）  

不通过 → **同一 MiMo 终端** 回修，直到过。

---

## 6. 成功标准（用户视角）

打开 17.0.9 汉化 omp → 设置里 **任务 / 提供商 / 插件** 等 tab，**说明文字是中文**，不是「标题中文、正文英文大段」。

---

## 7. 角色

| 谁 | 做什么 |
|---|---|
| **MiMo** | Phase 0–6 全部执行 |
| **Grok** | 只派发 + 终验；不拉 tarball、不批量译 |
| Kimi | **不参与** |
