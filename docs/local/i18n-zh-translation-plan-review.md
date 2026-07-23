# Oh My Pi i18n 中文翻译重做计划 + 独立交叉验证审查

日期：2026-07-23  
状态：**历史附件**（第一轮审查原文）  
**执行请以** `docs/local/ACTIVE-TASK-i18n-zh.md` **为准**（已整合本文件 + 第二轮裁决：F1–F3 降级，N1 空串/`lang`vs`lan` 等升格）。

原审查结论：有条件通过；下列 F1–F3 在 ACTIVE-TASK 中已重新分级，勿再当作硬 blocker 原文照抄。

---

## 第一部分：原始计划（待审查稿）

### 背景

- 项目：Oh My Pi (OMP)，基于 coding-agent 的 CLI，包版本 v17.0.8
- 路径：`G:\oh-my-pi-i18n\packages\coding-agent\src\i18n\lang\`
- 加载：先加载包内 bundled `lang/`，再用 `~/.omp/lang` 覆盖
- 任务：让中文翻译与英文源 key 对齐（清理多余键、补缺、质量抽检），不是从零全盘重译

### 已实测数据（2026-07-23，对包内 lang 目录）

**Settings（10 个分类）**

每个 zh-settings-*.json 对比对应 en-settings-*.json：

- missing = 0（ZH 已覆盖该分类 EN 的全部 key）
- 合计 extra ≈ 270
  - 其中 misplaced ≈ 99（该 key 在别的 en-settings 分类里存在）
  - 其中 orphan ≈ 171（任何 en-settings-* 都没有）

分类大致 delta（zh - en）：

```
appearance +13, context +52, files +6, interaction +53, memory +4,
model +30, providers +24, shell +2, tasks +14, tools +72
```

**Commands**

- en-commands.json ≈ 189 keys
- zh-commands.json ≈ 362 keys
- missing ≈ 53，且几乎全是 `tabs.<tab>.groups.N`（下标分组名）
- extra ≈ 226（大量 commands.* / flags.* 残留）

注意：settings 侧分组键已是具名形式（如 `tabs.appearance.groups.Display`），commands 侧仍是下标形式（如 `tabs.appearance.groups.0`）。计划认为应分别对齐各自 EN，不擅自改 EN。

**质量**

- 约 151 处 zh 值 == en 值；多数像 Unicode/ASCII/Powerline/百分比选项，计划用白名单放行，不全当未翻译。

**脚本坑**

- extract-settings-translations.ts / generate-zh-templates.ts / translate-settings-batch.ts 默认写 `~/.omp/lang`，不是包内 `src/i18n/lang`
- 计划要求本轮只改包内 lang，避免"本机好了、仓库还是坏"

### 计划核心策略

1. 以当前 en-settings-*.json / en-commands.json 为唯一契约（SoT），不沿用旧任务文档的过时 key 数
2. Settings：按 EN 重建每个 zh 文件 key 集；删 extra；不"迁移"错位键到目标文件（因目标文件已 full match）；写目标前可用 global salvage 从其它旧 zh 捞译文防丢
3. Commands：按 en-commands 重建 zh-commands；补 53 个 tabs groups；多余进归档
4. orphan / 多余 commands 先归档再删，不直接不可追溯删除
5. 不重翻已对齐的 1300+ 条，除非抽检发现错译
6. 本轮范围：settings 10 文件 + commands；zh-ui/tips/hotkeys/runtime 另开任务
7. 验收：keys(zh)==keys(en)；无重复键；JSON 合法；出 report

### 计划方提出的审查问题

**A. 前提是否成立**

1. "settings missing=0，主战场是删 extra 而非补译"这个判断是否合理？有没有反例场景（例如运行时还依赖 orphan key）？
2. "错位键不迁移、直接删"是否安全？在 merge 是扁平 key 字典时，错位是否本来就无害/有害？
3. settings 具名 groups vs commands 下标 groups 双轨并存，分别对齐是否正确？还是应统一？

**B. 策略漏洞**

4. global salvage 从错误分类捞译文，是否会把错误语义译文写进正确 key？如何防？
5. 删掉 zh-commands 里 192+ 条不在 EN 的 commands.*，会不会漏掉源码仍在用的旧 key？如何验证？
6. 只改包内 lang、不碰 `~/.omp/lang`，验收时要注意什么假阳性/假阴性？
7. 不改 en-settings-full.json 是否正确？

**C. 流程与验收**

8. 阶段顺序（备份→report 脚本→settings apply→commands apply→补空→抽检）有没有更优/更危险的步骤？
9. 验收标准是否够硬？还缺哪些自动化检查（例如插值占位符、HTML/Markdown、重复 key 原文扫描）？
10. 白名单保留英文的规则是否过宽/过窄？

---

## 第二部分：独立交叉验证审查报告

### 1. 总评

**有条件通过**。策略骨架（EN 为 SoT、重建 key 集、归档不硬删、不动 EN）是对的，但计划有一个验证盲区可能直接导致运行时回归：**所有 missing/extra 统计都是 zh↔en 互相对比，从未扫过源码实际引用了哪些 key**。另外验收环节会被 `~/.omp/lang` 覆盖机制污染，已知脚本坑也只有原则、没有强制手段。补上这三件事后可执行。

### 2. 致命问题（必须改）

**F1. 缺「代码侧 key 使用扫描」，删 extra 可能删出运行时裸 key**（对应 A1/B5）

计划的全部数据（missing=0、extra≈270、zh-commands extra≈226）只证明 zh 与 en 对齐，不证明 en 覆盖了代码。如果源码里有 `t('commands.xxx')` 引用一个 en-commands.json 里没有的 key，而该 key 恰好存在于 zh-commands 的 extra 里（旧版残留很常见），按现计划删除后，运行时连回退英文都没有，直接显示裸 key——这是用户可见的回归，且 missing=0 完全测不出来。

改法：删除任何东西之前，先从源码提取被引用的 key，与 en key 集做差集：

```bash
cd /g/oh-my-pi-i18n/packages/coding-agent
rg -o --no-filename '[tT]\(\s*[`"'"'"']([a-zA-Z][a-zA-Z0-9_.]+)' -r '$1' src/ | sort -u > /tmp/used-static.txt
# 还要单独人工看模板拼接的动态 key，例如：
rg -n 'groups\.\$\{|`tabs\.' src/ | head -50
```

用脚本把 used-static.txt 与 en 全量 key 求差。期望输出：`used-not-in-en` 为空。若不为空，这些 key 的 zh 译文**豁免删除**、保留在 zh 里并单独列入报告，同时给上游 en 提 issue。注意静态 grep 必然漏掉动态拼接 key，所以运行时 smoke test 不可省。

**F2. 验收环境被 `~/.omp/lang` 覆盖机制污染，假阳性假阴性都可能**（对应 B6）

加载顺序是「包内 → 用户目录覆盖」。这意味着：本机验收时看到的任何界面文案，来源都不确定。`~/.omp/lang` 里有旧文件 → 仓库修好了但界面没变（假阴性/以为没生效）；`~/.omp/lang` 里恰好是新文件 → 仓库还是坏的但界面正确（假阳性）。计划写了「只改包内 lang」，但验收标准里没有任何隔离措施。

改法：验收前 `mv ~/.omp/lang ~/.omp/lang.bak`（或查代码里是否有禁用 override 的环境变量，[不确定] 是否存在，需本地确认），验收完恢复。并且每条自动化检查脚本都必须显式指向包内路径。

**F3. 已知脚本坑没有强制防护，一次默认参数的 apply 就「修错了地方还报告成功」**

extract/generate/translate 三个脚本默认写 `~/.omp/lang`。计划只在原则层面说「本轮只改包内」，但执行清单里如果没有硬性约束，任何一步忘加参数就会静默写错位置——而且因为 F2 的覆盖机制，本机验收时看起来还「好了」。

改法：三选一并写进执行清单：(a) 给脚本打补丁去掉默认值、强制要求 `--lang-dir`；(b) 用包装脚本/环境变量锁死输出路径；(c) 最低限度——每步 apply 后立即 `git -C /g/oh-my-pi-i18n status --short packages/coding-agent/src/i18n/lang` 确认改动落在包内，且 `ls ~/.omp/lang` 确认无新增。[不确定] 脚本现有 CLI 参数是否已支持指定目录，需本地确认。

### 3. 重要问题（建议改）

- **I1（对应 A2）错位键删除的安全性取决于 merge 语义**。[不确定] 运行时是否把所有 settings 分类合并成一个扁平 key 字典、以及同名 key 冲突时谁覆盖谁。若扁平合并且错位副本与正确文件里同 key 的值不同，则当前线上显示的可能是错位（陈旧）的那份，删除后文案会变——方向是对的，但变化必须进报告 diff，不能静默发生。验证：`rg -n "i18n/lang|loadLang|merge" src/` 找到加载逻辑确认合并顺序；另外跑一个脚本列出「出现在多个 zh 分类且值不同」的 key 清单。
- **I2（对应 B4）global salvage 有过期语义风险**。同名 key 的 en 文案可能已改版，从旧文件捞来的译文是按旧语义翻的。鉴于 settings missing=0，salvage 在 settings 侧几乎无用武之地；commands 侧的 53 个 `groups.N` 是下标键，settings 侧的具名键译文**不能**安全映射过去（`groups.0` ≠ `groups.Display` 没有可靠对应关系）。建议：salvage 仅限同 key 字符串精确匹配，所有被 salvage 填充的条目打标记进报告，人工抽检；53 个 groups 键直接按 en 当前值现翻，不走 salvage。
- **I3（对应 A3）下标 groups 键是结构性脆弱点**。分别对齐各自 EN 是对的（双轨说明两侧代码生成 key 的方式不同，统一等于改 EN 或改代码，超出范围）。但要意识到：en 侧若在中间插入一个分组，其后所有下标平移，中文名静默错位，且 `keys(zh)==keys(en)` 验收完全测不出。建议在报告中把 53 个 groups 键连同其 en 原文一起列出，人工核对语义对应；并记为技术债。
- **I4（对应 C9）验收缺占位符一致性检查**。`{name}`、`%s`、`{{var}}` 类插值占位符在 zh 值和 en 值之间必须集合相等，否则运行时要么抛错要么把 `{name}` 原样显示。检查逻辑：对每对 (enVal, zhVal)，比较 `enVal.match(/\{[^}]+\}|%[sd]|\{\{\w+\}\}/g)` 排序后与 zh 侧是否相等。同类补充检查：空字符串值、Markdown 链接/粗体标记数、HTML 标签配对、换行数。
- **I5（对应 C9）「无重复键」不能用 JSON.parse 验**。`JSON.parse` 对重复 key 静默取最后一个。需用能报错的解析方式：

  ```bash
  python -c "
  import json,sys
  def hook(pairs):
      keys=[k for k,_ in pairs]
      assert len(keys)==len(set(keys)), f'duplicate keys: {pairs}'
      return dict(pairs)
  json.load(open(sys.argv[1],encoding='utf-8'), object_pairs_hook=hook)
  print('OK')" path/to/zh-commands.json
  ```

  且这个检查要在**改动前**也跑一次——如果现状就有重复 key，「删 extra」可能删掉的根本不是生效的那份。
- **I6（对应 B7）`en-settings-full.json` 性质未定**。[不确定] 它是运行时真正加载的聚合文件，还是 per-category 文件的生成产物。如果运行时加载的是 full.json 而分类文件只是中间产物，那「只改分类文件」根本不生效。验证：`rg -n "settings-full" packages/coding-agent/src/`，并找它有没有生成脚本（若有，改完分类文件后要重新生成，而不是手改）。

### 4. 同意点

- 以当前 en 文件为唯一 SoT、不沿用旧文档 key 数——正确，旧任务文档的 key 数在这类项目里几乎必然漂移。
- 不重翻已对齐的 1300+ 条、只抽检——正确，全量重翻引入的错译风险远大于收益。
- 归档先行、不硬删——正确，且归档应记录 provenance（来源文件 + 删除时间 + 对应 commit）。
- zh==en 的 151 处不全当未翻译——正确方向（规则细节见 C10 答复）。
- 具名/下标 groups 双轨分别对齐、不擅自改 EN——正确。

**C10 白名单规则补充**：zh==en 放行条件 = 值在显式白名单（Unicode/ASCII/Powerline 等品牌或协议词）**或** 值匹配「token 形态」（无空格、纯字母数字与 `%./+-`，如 `50%`、`UTF-8`）；**任何含空格且含小写字母的英文整句 zh==en 一律进人工复核队列**（如 "Auto detect"、"Default" 这类其实应翻成 自动检测/默认）。即：现状白名单偏宽的风险大于偏窄。

### 5. 修订后的最小执行清单（9 步）

1. 备份：仓库**无 `.git`**（不能用 tag 回滚），物理复制 `packages/coding-agent/src/i18n/lang/zh-*.json` 到 `lang/_backup/2026-07-23-pre-realign/`（与 ACTIVE-TASK §3-A 一致），确认备份完整后再动手。
2. 确认加载与合并语义：`rg -n "settings-full|i18n/lang" packages/coding-agent/src/`，搞清 full.json 是否被加载/如何生成、扁平合并时同 key 谁赢（回答 I1/I6）。
3. 跑 F1 的源码 key 扫描，产出 `used-not-in-en` 差集；非空则列入豁免删除清单。
4. 跑改动前基线检查：所有目标 JSON 的合法性 + 重复 key 扫描（I5 脚本），有重复先单独处理。
5. 锁死脚本输出路径（F3 的 a/b/c 任一），先 dry-run，确认 diff 只落在包内 lang。
6. Settings apply：按各 en 分类重建 zh key 集，extra（减去豁免）写入带 provenance 的归档文件后删除；跨分类同 key 不同值的清单进报告（I1）。
7. Commands apply：重建 key 集；53 个 `groups.N` 按 en 当前值现翻（不走 salvage）；extra 归档；若 full.json 是生成物则重新生成。
8. 自动化验收：`keys(zh)==keys(en)` 逐文件相等、重复 key 扫描、占位符集合一致、空值检查、zh==en 白名单规则（含空格英文整句进人工队列）、`used-not-in-en` 仍为空。全部脚本显式指向包内路径。
9. 运行时 smoke test：`mv ~/.omp/lang ~/.omp/lang.bak` 后启动 CLI 过一遍 settings 各分类与 commands 帮助页，确认无裸 key、无 `{placeholder}` 原形；恢复 override；提交改动 + 归档 + report。

### 6. 需要本地实测才能下定论的点（未编造，均未验证）

- [不确定] 运行时 i18n 合并是否扁平字典、分类间同 key 冲突的覆盖顺序（决定 F1 豁免清单和 I1 文案变化的真实影响面）。
- [不确定] `en-settings-full.json` 是源文件还是生成物、运行时实际加载哪些文件（I6）。
- [不确定] 源码中动态拼接 key 的规模（`groups.${i}` 类），静态 grep 的覆盖率有多少。
- [不确定] `used-not-in-en` 是否为空——这直接决定「删 192+ 条 commands.*」是否安全。
- [不确定] 三个脚本的现有 CLI 是否已支持指定输出目录，还是需要打补丁。
- [不确定] 现状 JSON 是否已存在重复 key（若存在，所有 extra/missing 统计的可信度都要重估，因为统计脚本读的键和生效的键可能不是同一份）。
- [不确定] 当前 `~/.omp/lang` 里实际有什么文件、是否正在覆盖包内文件（决定此前所有「实测数据」观测到的是不是包内真身——如果之前的统计是在 override 存在的环境下通过 CLI 行为间接观测的，数据本身就需要重测）。

---

## 第三部分：审查后补充实测发现（2026-07-23）

审查过程中在本机确认的事实：

- 项目内已有正式任务文档 **`docs/local/ACTIVE-TASK-i18n-zh.md`**（根 `AGENTS.md` 顶部与 `CLAUDE.md` 均指向它），其中 §1 实测基线、§3 执行阶段、§5 最小清单与本文件第一部分一致；本文件是其**交叉验证附件**，执行时以 ACTIVE-TASK 为主、按本文 F1–F3/I1–I6 修订。另：该仓库**无 `.git`**，所有「打 tag / git status 验证」类步骤一律改为物理备份 + 目录 diff。
- 本机 `~/.omp/` 下的覆盖目录实际名为 **`lan`**（非计划所写的 `lang`），内含 zh-commands.json、zh-settings-*.json 等一套文件。影响：F2/F3 的验收隔离步骤指向的路径可能错误——需先跑 `rg -n "\.omp/(lang|lan)" packages/coding-agent/src/` 确认运行时真实读取的覆盖目录名，再定验收步骤；若代码读 `lang` 而磁盘是 `lan`，该目录可能是从未生效的残留。
- 相关测试文件已存在：`packages/coding-agent/test/i18n.test.ts`、`settings-i18n.test.ts`、`commands-i18n.test.ts`；另有脚本 `packages/coding-agent/scripts/gen-i18n-keys.ts`。执行清单第 8 步的自动化验收可优先考虑接入这些现有测试而不是另起炉灶 [不确定：未读其内容，覆盖范围待确认]。
