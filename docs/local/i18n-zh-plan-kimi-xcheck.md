# i18n zh 重新对齐方案 — 独立交叉审计（Kimi）

- 日期：2026-07-23
- 审计人：Orca dispatched auditor（task i18n-zh-plan-xcheck）
- 对象：`docs/local/ACTIVE-TASK-i18n-zh.md`（执行 SoT，以下简称「方案」）
- 方式：只读核查。未改任何 `zh-*.json` / `en-*.json`，未写 `~/.omp/lang`，未调用 extract/generate/translate/gen-i18n-keys，未触碰 git。统计脚本为一次性 Python（`object_pairs_hook`），全部显式读包内路径。

---

## 0. 结论（Verdict）

**GO-WITH-FIXES（可通过，建议带一处修订执行）**

方案骨架（EN 为 SoT、重建 key 集、归档再删、禁改 EN、物理备份、空串/占位符/重复 key 硬门禁）与代码事实、实测基线、仓库约束全部吻合，未发现致命缺陷或会直接导致运行时回归的错误假设。唯一值得改方案文本的是 **F-B**：commands 算法对 53 个 `groups.N` 一律「新译」，忽视了这 53 个 key 当前以同名字符串存在于 zh-settings extra 中且译文与现行 EN 语义对齐——应允许 exact-key salvage 或至少强制对照，避免无谓 churn 和术语漂移。其余为低危注释项。

---

## 1. 代码事实核查（R2）— 全部属实

| # | 方案声明 | 核查结果 | 证据 |
|---|---|---|---|
| V1 | 加载顺序：包内 bundled → 用户目录覆盖 | ✅ | `src/i18n/index.ts:185-197` `loadTranslation` 先 `BUNDLED_LAN_DIR` 后 `this.lanDir` |
| V2 | 覆盖路径代码固定 `~/.omp/lang`（非 `lan`）；本机有 `~/.omp/lan` 全套 zh、无 `lang` → 覆盖未生效 | ✅ | `index.ts:120` `path.join(os.homedir(), ".omp", "lang")`；本机 `ls ~/.omp` 确认仅有 `lan/`（含 14 个 zh 文件）、无 `lang/` |
| V3 | 多文件扁平 merge，后读文件覆盖同 key | ✅ | `index.ts:221-231` readdir 循环 + `mergeTranslations` 直接 `target[key] = value` |
| V4 | 空串陷阱：`zh[k]===""` 算命中不回退 EN | ✅ | `index.ts:273-276`：值为 string 即返回，不判空 |
| V5 | interceptor 多数带英文 fallback；group 主路径为具名 `tabs.${tab}.groups.${group}` | ✅ | `interceptor.ts:20-33,61-72`；`settings-selector.ts:1170` 以 `def.group`（schema 具名）调 `interceptGroupLabel`；缺 key 时回退英文 group 名 |
| V6 | `en-settings-full.json` 仅 en 侧加载、无 zh-full、分类 zh 改完即生效 | ✅ | `index.ts:217` 目录加载过滤 `f.startsWith(\`${lang}-\`)`，zh 永不读 full；embedded 表（`index.ts:52-81`）同理按语言前缀筛选 |
| V7 | groups 双轨：settings 具名 / commands 下标 | ✅ | 具名：`settings-schema.ts` TAB_GROUPS + interceptor；下标 `groups.N` 由 `scripts/gen-i18n-keys.ts:49-51` 生成进 en-commands |

补充事实（方案未写、执行者应知）：

- **运行时 src 中没有任何代码拼接 `groups.${idx}`**（全仓 grep 仅命中 interceptor 的具名路径与 gen-i18n-keys 生成器）。即 53 个 `groups.N` 很可能是生成器留下的契约性 key、当前无消费方。按 EN 契约补齐是对的（方案不改 EN 的纪律正确），但这属于卫生性补齐，质量门槛保持「非空 + 语义对照」即可。
- `fs.readdir` 顺序无字母序保证，en 侧 `en-settings-full.json` 与分类文件的 merge 先后理论上不确定——与 zh 任务无关（V6），仅记录。

## 2. 基线数字复核（R3）— 与 §3 完全一致

实测脚本：Python `json.loads(object_pairs_hook=...)`，显式读 `packages/coding-agent/src/i18n/lang/`。

- **Settings 10 分类逐行复核**：appearance 97/110/0/13、context 213/265/0/52、files 60/66/0/6、interaction 140/193/0/53、memory 97/101/0/4、model 187/217/0/30、providers 148/172/0/24、shell 33/35/0/2、tasks 105/119/0/14、tools 222/294/0/72 —— **与 §3.1 逐格一致**；合计 EN=1302 / ZH=1572 / missing=0 / extra=270 ✅
- **misplaced=99 / orphan=171** ✅（orphan 判定口径：不在任何 en-settings 分类；含 `tabs.*.groups.N`，见 F-B）
- **EN 跨分类同 key = 0** ✅
- **ZH 跨文件同 key = 98，其中值不同 = 33** ✅（§3.1 的 N1 量化准确）
- **Commands**：EN=189 / ZH=362 / missing=53 / extra=226 ✅；**53 个 missing 全部是 `tabs.<tab>.groups.N`，无一例外形 key** ✅
- **重复 key 扫描（改动前）**：22 个目标文件（10 en-settings + 10 zh-settings + en/zh-commands）**全部无重复 key** → §3 统计可信，I5 的前置担忧已排除 ✅
- **空串现状**：zh-settings 10 文件 + zh-commands **当前均无 `""` 值** → 空串硬门禁是针对 apply/补译阶段的前向约束，现状干净 ✅
- 环境旁证：包版本 `17.0.8` ✅、仓库无 `.git` ✅、`test/{i18n,settings-i18n,commands-i18n}.test.ts` 均存在 ✅、目标文件均无 `meta` 键（key 集相等门禁无需 meta 特判）✅

## 3. 发现清单（severity-tagged）

### F-B（中，建议修订方案 §6.3）— 53 个 groups.N 的「新译」丢弃了现成的对齐译文

实测：**53/53 个** en-commands 缺失的 `groups.N` key，当前以**完全相同的 key 字符串**存在于 zh-settings extra 中（apply 阶段 C 会把它们当 orphan 归档删除），且抽查 12 个（appearance 0-3、context 0-3、files 0-3）译文与现行 EN 值语义逐一对齐（`Theme→主题`、`Status Line→状态栏`、`Compaction→压缩`…）。

方案 §6.3 对此一律置 `""` 后「按 en 当前英文值新译」，且 §5/N3 只禁止「从具名 groups 字符串映射 salvage」——**没有覆盖 exact-key salvage 这个不同且安全的通道**。后果：不必要的翻译 churn；新译与旧译若措辞不同，用户看到的分组名会无声变化（正是方案自己升格的 N1 类问题），还增加术语漂移风险。

**建议补丁（§6.3 算法内，`new[k] = ...` 分支前插入）**：

> 对 53 个 `tabs.*.groups.N`：先查 stage A 备份中的 zh-settings extra（key 字符串精确相等）。若命中，**逐 key 人工/半自动核对** `en-commands[k]` 英文值与备份中文值语义对齐（防 I3 下标平移陈旧），对齐则直接采用备份译文并打标 `salvaged-from-zh-settings`；不对齐或拿不准才按 en 现值新译。禁止的仍只是「具名 → 下标」的跨形态映射。

同时建议在 §7 阶段 D 加一句验收：53 个 groups.N 的最终译文与备份值逐 key diff，差异清单进 report（可解释为「主动改译」或「salvage」）。

### F-A（低）— §3.3 的 zh==en ≈151 已漂移

实测 settings 侧 zh==en = **162**（commands 侧 = 0），其中「含空格且含小写字母」的整句类 = **39**（如 `Top K`、`GitHub Gist`、`~12.5K tokens`、`Eval & Runtimes`）。方案的「约 151」用「约」字可兜住，但 §7-B report 阶段应**以重算值为准**并把 39 条整句队列作为人工复核起点，勿沿用 151。

### F-C（低）— §6.2 settings salvage 分支实际是死代码

settings missing=0 且现状无空串 → `for k in keys(en)` 恒走「本文件优先」分支，`global_zh` salvage 永远不会触发。保留作安全网无害，但注意：`global_zh` 对 33 个跨文件异值 key 的 union 取值依赖构建顺序，若未来真有触发场景，结果不确定。建议在 §6.2 注释「salvage 仅兜底；若触发须把触发清单进 report」。

### F-D（低）— 阶段 C→D 之间存在瞬时空窗

阶段 C 从 zh-settings 删掉 `groups.N` extra，阶段 D 才把它们补进 zh-commands。文件态中间窗口内若有人跑 TUI smoke，分组名会显示英文（有 fallback，非裸 key，可接受）。建议 §7-F 明确「smoke 只在 D 完成后进行」。

### F-E（提示，无需改）— groups.N 可能是无消费方的契约 key

见 §1 补充事实。补齐它们是守 EN 契约的正确动作，但不要把「53 个 groups.N 缺失」解读为「设置页分组全坏」——方案 §3.2 优先级说明已经写对了，此处仅背书。

## 4. 对抗性审查（R4）— 方案与约束的冲突检查

- **false assumptions**：未发现。抽查的 7 项代码声明（V1-V7）全部属实；「missing=0 主战场是删 extra」与实测一致；「full 不必 regenerate」成立。
- **missing gates**：硬门禁已含 key 集相等 / 重复 key hook / 空串 / 占位符集合 / 归档 provenance / 包内路径显式化，覆盖第一轮审查的 I4/I5/I6；改动前重复 key 扫描本审计已代跑一遍（结果干净），执行时按方案在改后再跑一次即可。
- **unsafe steps**：备份先行（§7-A）✓；归档再删 ✓；禁改名 `lan`→`lang` ✓（与 V2 一致）；禁调四脚本 ✓（与 review F3 一致）；「不 commit」与无 git 现实及 AGENTS「NEVER commit unless asked」一致 ✓。
- **与 AGENTS/CLAUDE 冲突**：无。统计用 Bun/Python 非 PowerShell ✓；改动面限于 zh-*.json + 可选新脚本 ✓（CLAUDE.md 硬约束表允许）；新脚本写死包内路径符合「自动化检查只读包内」✓。方案 §9 提到可选跑 3 个 i18n 测试文件——文件确实存在，标注为非硬门禁，恰当。
- **残留风险（可接受）**：① 删 226 条 commands extra 依赖「interceptor/cliTranslator 均有英文 fallback」——已核实（`interceptor.ts:171-174` 无 fallback 但比较 key 后回退原文，等效）；② 静态无法穷举动态拼接 key，方案以 smoke 兜底，合理。

## 5. 审计边界

- 未执行任何写操作；未跑方案中的 apply；未做 TUI smoke。
- 33 个跨文件异值 key 的逐条 diff 清单、226 条 commands extra 的逐条审查，属于执行期 report 产物，本审计只验证其量级与方法可行性。
- 39 条整句类 zh==en 仅按形态规则（含空格 + 含小写字母）筛出，语义判定留给人工队列。
