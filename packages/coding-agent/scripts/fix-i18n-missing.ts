#!/usr/bin/env bun
/**
 * Fix ALL schema UI paths missing from en/zh i18n JSON files.
 *
 * Steps:
 *  1. Parse settings-schema.ts for every path + ui.label/description + ui.tab
 *  2. For each: ensure settings.{path}.label/.description in en-settings-{tab}.json
 *  3. For each: ensure settings.{path}.label/.description in zh-settings-{tab}.json with Chinese
 *  4. Delete phantom keys (isolation.apply, renderMarkdownResults)
 *  5. Fix mixed/EN labels in zh (worktree, badge, describeForTextModels, etc.)
 *  6. Fix zh-ui Agent Hub -> 代理中心
 *  7. Generate gate script output
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LANG_DIR = join(import.meta.dir, "..", "src", "i18n", "lang");
const BACKUP_DIR = join(LANG_DIR, "_backup", "2026-07-23-pre-missing-fix");

// ═══════════════════════════════════════════════════════════════════════════
// STEP 0: Backup
// ═══════════════════════════════════════════════════════════════════════════
mkdirSync(BACKUP_DIR, { recursive: true });
const zhFiles = [
	"zh-settings-appearance.json",
	"zh-settings-model.json",
	"zh-settings-interaction.json",
	"zh-settings-context.json",
	"zh-settings-memory.json",
	"zh-settings-files.json",
	"zh-settings-shell.json",
	"zh-settings-tools.json",
	"zh-settings-tasks.json",
	"zh-settings-providers.json",
	"zh-commands.json",
	"zh-ui.json",
	"zh-tips.json",
	"zh-hotkeys.json",
	"zh-runtime.json",
];
const enFiles = [
	"en-settings-appearance.json",
	"en-settings-model.json",
	"en-settings-interaction.json",
	"en-settings-context.json",
	"en-settings-memory.json",
	"en-settings-files.json",
	"en-settings-shell.json",
	"en-settings-tools.json",
	"en-settings-tasks.json",
	"en-settings-providers.json",
	"en-settings-full.json",
	"en-commands.json",
	"en.json",
];
for (const f of [...zhFiles, ...enFiles]) {
	const src = join(LANG_DIR, f);
	if (existsSync(src)) {
		copyFileSync(src, join(BACKUP_DIR, f));
	}
}
console.log("✓ Backup done");

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: Parse settings-schema.ts
// ═══════════════════════════════════════════════════════════════════════════
const SCHEMA_PATH = join(import.meta.dir, "..", "src", "config", "settings-schema.ts");
const schema = readFileSync(SCHEMA_PATH, "utf-8");

interface SchemaEntry {
	path: string;
	label: string;
	description: string;
	tab: string;
}

function extractSchemaEntries(): SchemaEntry[] {
	const entries: SchemaEntry[] = [];

	// Find all setting definitions with ui objects
	// Pattern: "path": { ... ui: { tab: "...", label: "...", description: "..." } }
	// We need to parse the schema more carefully

	// First, find the SETTINGS_SCHEMA object
	const schemaMatch = schema.match(/export\s+const\s+SETTINGS_SCHEMA\s*=\s*\{/);
	if (!schemaMatch) {
		console.error("Could not find SETTINGS_SCHEMA");
		return entries;
	}

	// Extract each setting block - look for quoted keys followed by objects with ui
	// Use a state machine to track braces
	const i = schemaMatch.index!;
	const text = schema;

	// Find all "key": { patterns within SETTINGS_SCHEMA
	const keyPattern = /["']([a-zA-Z][a-zA-Z0-9_.]*)["']\s*:\s*\{/g;
	keyPattern.lastIndex = i;

	let match: RegExpExecArray | null = keyPattern.exec(text);
	while (match !== null) {
		const path = match[1];
		const startIdx = match.index;

		// Find the matching closing brace for this object
		let depth = 0;
		let j = startIdx + match[0].length - 1;
		const blockStart = j;
		while (j < text.length) {
			if (text[j] === "{") depth++;
			else if (text[j] === "}") {
				depth--;
				if (depth === 0) break;
			}
			j++;
		}
		const block = text.slice(blockStart, j + 1);

		// Extract ui.tab / label / description
		const tabMatch = block.match(/ui\s*:\s*\{[^}]*?tab\s*:\s*["'](\w+)["']/s);
		const labelMatch = block.match(/ui\s*:\s*\{[\s\S]*?label\s*:\s*["']([\s\S]*?)["']/);
		const descMatch = block.match(/ui\s*:\s*\{[\s\S]*?description\s*:\s*["']([\s\S]*?)["']/);
		if (tabMatch && labelMatch && descMatch) {
			entries.push({
				path,
				label: labelMatch[1].trim(),
				description: descMatch[1].trim(),
				tab: tabMatch[1],
			});
		}
		match = keyPattern.exec(text);
	}

	return entries;
}

const entries = extractSchemaEntries();
console.log(`✓ Parsed ${entries.length} schema entries with ui.label`);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Load existing en/zh JSONs
// ═══════════════════════════════════════════════════════════════════════════
type JsonData = Record<string, string>;

function loadJson(file: string): JsonData {
	const path = join(LANG_DIR, file);
	if (!existsSync(path)) return {};
	return JSON.parse(readFileSync(path, "utf-8"));
}

function saveJson(file: string, data: JsonData) {
	const sorted = Object.keys(data)
		.sort()
		.reduce((acc, key) => {
			acc[key] = data[key];
			return acc;
		}, {} as JsonData);
	writeFileSync(join(LANG_DIR, file), `${JSON.stringify(sorted, null, 2)}\n`);
}

// Tab -> file mapping
const tabToEnFile: Record<string, string> = {
	appearance: "en-settings-appearance.json",
	model: "en-settings-model.json",
	interaction: "en-settings-interaction.json",
	context: "en-settings-context.json",
	memory: "en-settings-memory.json",
	files: "en-settings-files.json",
	shell: "en-settings-shell.json",
	tools: "en-settings-tools.json",
	tasks: "en-settings-tasks.json",
	providers: "en-settings-providers.json",
};

const tabToZhFile: Record<string, string> = {
	appearance: "zh-settings-appearance.json",
	model: "zh-settings-model.json",
	interaction: "zh-settings-interaction.json",
	context: "zh-settings-context.json",
	memory: "zh-settings-memory.json",
	files: "zh-settings-files.json",
	shell: "zh-settings-shell.json",
	tools: "zh-settings-tools.json",
	tasks: "zh-settings-tasks.json",
	providers: "zh-settings-providers.json",
};

// Load all
const enData: Record<string, JsonData> = {};
const zhData: Record<string, JsonData> = {};
for (const tab of Object.keys(tabToEnFile)) {
	enData[tab] = loadJson(tabToEnFile[tab]);
	zhData[tab] = loadJson(tabToZhFile[tab]);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: Chinese translations for all missing entries
// ═══════════════════════════════════════════════════════════════════════════
const zhTranslations: Record<string, { label: string; description: string }> = {
	// --- appearance ---
	"tui.scrollbackRebuild": {
		label: "重写回滚缓冲区",
		description:
			"当代码块的最终形式替换其活体预览时，擦除并重放终端回滚缓冲区。关闭时（默认），旧的预览副本会留在历史记录中，最终内容会追加在下方。",
	},
	"display.collapseCompacted": {
		label: "折叠已压缩的历史",
		description:
			"在实时对话记录中，将压缩前的历史折叠到摘要分隔线后面；禁用以在每次压缩点处使用分隔线保持完整对话记录。",
	},
	"tui.imeSafeCursor": {
		label: "IME 安全提示布局",
		description: "将提示的底边框移到单独的一行，以防止 macOS IME 预编辑文本将其移位。",
	},
	"task.showResolvedModelBadge": {
		label: "显示已解析的模型徽章",
		description: "在任务小组件状态行中显示每个子代理使用的实际模型 ID。",
	},

	// --- model ---
	"prewalk.enabled": {
		label: "启用预走查",
		description:
			"从当前活跃模型开始，然后在计划任务的待办列表存在后的第一次编辑/写入时切换到快速/廉价模型（默认为 'smol' 角色）。强模型负责计划、提交待办并开始实现，然后移交给 'smol' 角色。",
	},
	"tier.openai": {
		label: "服务层级 — OpenAI",
		description:
			"OpenAI / OpenAI-Codex 请求以及通过 OpenRouter 路由的 OpenAI 系列模型的处理层级（none = 不发送）。作为 service_tier 发送。",
	},
	"tier.anthropic": {
		label: "服务层级 — Anthropic",
		description:
			"Claude 请求的处理层级。priority 在受支持的直接 Anthropic 模型上启用快速模式（speed: fast）；在 Bedrock/Vertex Claude 和通过 OpenRouter 时忽略。",
	},
	"tier.google": {
		label: "服务层级 — Google",
		description:
			"Gemini（Google AI Studio + Vertex）请求以及通过 OpenRouter 路由的 Google 系列模型的处理层级（none = 不发送）。作为顶层 serviceTier 字段发送。",
	},
	"tier.subagent": {
		label: "服务层级 — 子代理",
		description:
			"为生成的任务/评估子代理设置服务层级。继承 = 匹配主代理的实时每族层级（跟踪 /fast）；选择一个值以应用到子代理模型所属的族。",
	},
	"tier.advisor": {
		label: "服务层级 — 顾问",
		description:
			"顾问模型的服务层级。无 = 标准处理；继承 = 匹配主代理的实时每族层级；选择一个值以应用到顾问模型的族。",
	},

	// --- interaction ---
	"auth.broker.token": {
		label: "自动恢复",
		description: "自动恢复当前目录中最近的会话。",
	},
	"recap.enabled": {
		label: "空闲回顾",
		description: "在终端空闲后生成一份简短的 LLM 回顾，总结当前进展。",
	},
	"recap.idleSeconds": {
		label: "空闲回顾延迟",
		description: "空闲后等待显示回顾的秒数。",
	},

	// --- files ---
	"edit.enforceSeenLines": {
		label: "强制执行已查看行守卫",
		description: "拒绝锚定在先前读取/搜索从未完整显示的行上的编辑。",
	},

	// --- tools ---
	"todo.remindersMax": {
		label: "待办提醒上限",
		description: "放弃前的最大待办提醒次数。",
	},
	"launch.enabled": {
		label: "启动",
		description: "启用启动工具以监督共享的长期运行项目进程。",
	},
	"generate_image.enabled": {
		label: "生成图片",
		description: "启用 generate_image 工具（文本到图像生成和编辑）。当 tools.xdev 开启时，作为 xd:// 设备暴露。",
	},
	"ask.enabled": {
		label: "询问",
		description: "启用询问工具以进行交互式用户提问。",
	},
	"tools.xdev": {
		label: "xd:// 工具",
		description:
			"将很少使用的（可发现的）工具挂载到 xd:// 设备 URL 下，通过读/写驱动而不是在每个请求上发送其 schema。禁用以将所有启用的工具暴露为顶级。",
	},

	// --- tasks ---
	"title.refreshOnReplan": {
		label: "重新规划时刷新标题",
		description: "在待办初始化重新规划后刷新生成的会话标题，除非标题由用户设置。",
	},
	"task.prewalk": {
		label: "通用任务预走查",
		description:
			"为内置通用 task 子代理启用预走查：它从其解析的模型开始，计划并开始实现，然后在第一次编辑/写入时移交给 smol 角色。每个代理的覆盖（task.agentPrewalk，通过 /agents 中的 P 切换）和用户代理 prewalk 前置内容无论此开关如何都会生效。",
	},

	// --- providers ---
	"providers.webSearchGeminiModel": {
		label: "Gemini web_search 模型",
		description: "Gemini Google Search 基础的模型 ID。默认为 gemini-2.5-flash。",
	},
	"speech.enhanced": {
		label: "增强语音重写",
		description:
			"在合成之前，使用 tiny/smol 模型将助手输出重写为自然的口语化散文（描述代码，删除链接和 markdown）。失败时回退到机械清理。",
	},
	"exa.enabled": {
		label: "Exa",
		description: "所有 Exa 搜索工具的主开关。",
	},
	"providers.anthropic.serverSideFallback": {
		label: "Anthropic 服务端回退 (Fable 5)",
		description:
			"当 Claude Fable 5 / Mythos 5 请求被 Anthropic 的安全分类器阻止时，在 Claude Opus 4.8 服务端重试（Anthropic server-side-fallback-2026-06-01 beta）。选择启用 — 保留此选项关闭以保持每个请求的回退前行为。",
	},
	"task.softRequestBudgetNotice": {
		label: "软请求预算通知",
		description: "当子代理超过其软请求预算时注入一条引导通知，要求其在 1.5x 强制让步停止前收尾。",
	},

	// --- model (additional) ---
	"images.describeForTextModels": {
		label: "为纯文本模型描述图片",
		description: "当图片附加到不支持视觉的模型时，将其保存到 local:// 并从支持视觉的模型注入描述，而不是丢弃它。",
	},

	// --- providers (additional) ---
	"providers.maxInFlightRequests": {
		label: "最大并发请求",
		description:
			'每个提供商 ID（例如 "openai" 或 "anthropic"）的最大并发 LLM 请求数，与此配置根目录共享的本地 OMP 进程之间共享。省略的提供商无限制。',
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: Apply fixes
// ═══════════════════════════════════════════════════════════════════════════

let addedEn = 0;
let addedZh = 0;
const missingPaths: string[] = [];

for (const entry of entries) {
	const labelKey = `settings.${entry.path}.label`;
	const descKey = `settings.${entry.path}.description`;
	const tab = entry.tab;

	if (!tabToEnFile[tab]) {
		console.warn(`  ⚠ Unknown tab "${tab}" for path "${entry.path}"`);
		continue;
	}

	// Add to en if missing
	if (!(labelKey in enData[tab])) {
		enData[tab][labelKey] = entry.label;
		addedEn++;
		missingPaths.push(entry.path);
	}
	if (!(descKey in enData[tab])) {
		enData[tab][descKey] = entry.description;
		addedEn++;
	}

	// Add to zh if missing
	const translation = zhTranslations[entry.path];
	if (translation) {
		if (!(labelKey in zhData[tab]) || zhData[tab][labelKey] === "") {
			zhData[tab][labelKey] = translation.label;
			addedZh++;
		}
		if (!(descKey in zhData[tab]) || zhData[tab][descKey] === "") {
			zhData[tab][descKey] = translation.description;
			addedZh++;
		}
	} else {
		// No translation provided - flag it
		if (!(labelKey in zhData[tab]) || zhData[tab][labelKey] === "") {
			console.warn(`  ⚠ No zh translation for: ${labelKey} (EN: "${entry.label}")`);
			// Add English as placeholder so keys are equal
			zhData[tab][labelKey] = entry.label;
			addedZh++;
		}
		if (!(descKey in zhData[tab]) || zhData[tab][descKey] === "") {
			zhData[tab][descKey] = entry.description;
			addedZh++;
		}
	}
}

console.log(`✓ Added ${addedEn} en keys, ${addedZh} zh keys`);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: Delete phantom keys
// ═══════════════════════════════════════════════════════════════════════════
const phantomKeys = [
	"settings.task.isolation.apply.label",
	"settings.task.isolation.apply.description",
	"settings.mcp.renderMarkdownResults.label",
	"settings.mcp.renderMarkdownResults.description",
];

let deletedCount = 0;
for (const key of phantomKeys) {
	// Check in en files
	for (const tab of Object.keys(enData)) {
		if (key in enData[tab]) {
			delete enData[tab][key];
			deletedCount++;
			console.log(`  🗑 Deleted en phantom: ${key} from ${tab}`);
		}
	}
	// Check in zh files
	for (const tab of Object.keys(zhData)) {
		if (key in zhData[tab]) {
			delete zhData[tab][key];
			deletedCount++;
			console.log(`  🗑 Deleted zh phantom: ${key} from ${tab}`);
		}
	}
	// en-settings-full.json phantom keys lack settings. prefix — skip for now
}
console.log(`✓ Deleted ${deletedCount} phantom key entries`);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: Fix mixed/EN labels in zh
// ═══════════════════════════════════════════════════════════════════════════
const zhFixes: Record<string, { file: string; key: string; value: string }> = {
	"worktree.base.label": {
		file: "zh-settings-tasks.json",
		key: "settings.worktree.base.label",
		value: "工作树基础目录",
	},
	"task.showResolvedModelBadge.label": {
		file: "zh-settings-appearance.json",
		key: "settings.task.showResolvedModelBadge.label",
		value: "显示已解析的模型徽章",
	},
	"images.describeForTextModels.label": {
		file: "zh-settings-model.json",
		key: "settings.images.describeForTextModels.label",
		value: "为纯文本模型描述图片",
	},
	"images.describeForTextModels.description": {
		file: "zh-settings-model.json",
		key: "settings.images.describeForTextModels.description",
		value: "当图片附加到不支持视觉的模型时，将其保存到 local:// 并从支持视觉的模型注入描述，而不是丢弃它。",
	},
	// en-side: openaiWebsockets label should stay EN (brand), but let's ensure it's correct
	"providers.openaiWebsockets.label": {
		file: "zh-settings-providers.json",
		key: "settings.providers.openaiWebsockets.label",
		value: "OpenAI WebSocket 策略",
	},
	"exa.enableWebsets.label": {
		file: "zh-settings-providers.json",
		key: "settings.exa.enableWebsets.label",
		value: "Exa Websets",
	},
};

let fixedCount = 0;
for (const fix of Object.values(zhFixes)) {
	const tab = fix.file.replace("zh-settings-", "").replace(".json", "");
	if (zhData[tab]) {
		zhData[tab][fix.key] = fix.value;
		fixedCount++;
	}
}
console.log(`✓ Fixed ${fixedCount} mixed/EN labels in zh`);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7: Fix zh-ui Agent Hub
// ═══════════════════════════════════════════════════════════════════════════
const zhUi = loadJson("zh-ui.json");
let zhUiFixed = false;
if (zhUi["ui.agentHub.agentHub"] === "Agent Hub") {
	zhUi["ui.agentHub.agentHub"] = "代理中心";
	zhUiFixed = true;
	console.log("✓ Fixed zh-ui: Agent Hub -> 代理中心");
} else if (zhUi["ui.agentHub.agentHub"]) {
	console.log(`  ℹ zh-ui agentHub already: "${zhUi["ui.agentHub.agentHub"]}"`);
}
if (zhUiFixed) {
	saveJson("zh-ui.json", zhUi);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8: Save all files
// ═══════════════════════════════════════════════════════════════════════════
for (const tab of Object.keys(enData)) {
	saveJson(tabToEnFile[tab], enData[tab]);
}
for (const tab of Object.keys(zhData)) {
	saveJson(tabToZhFile[tab], zhData[tab]);
}
console.log("✓ Saved all en/zh JSON files");

// ═══════════════════════════════════════════════════════════════════════════
// STEP 9: Gate check - verify schema coverage
// ═══════════════════════════════════════════════════════════════════════════
const whitelist = new Set([
	"APFS",
	"ZFS",
	"btrfs",
	"ProjFS",
	"Overlayfs",
	"Reflink",
	"Unicode",
	"ASCII",
	"MCP",
	"LSP",
	"GitHub",
	"OpenAI",
	"Exa",
	"Exa Websets",
	"Bash",
	"Shell",
	"GLM",
	"Hermes",
	"Kimi",
	"Anthropic",
	"DeepSeek",
	"Gemini",
	"Gemma",
	"Harmony",
	"Qwen3",
	"MiniMax",
	"Fireworks",
	"Agent",
	"Git",
	"Mnemopi",
	"TTSR",
	"Native",
	"XML",
	"AGENTS.md",
]);

const gateErrors: string[] = [];
let gatePassed = 0;

for (const entry of entries) {
	const labelKey = `settings.${entry.path}.label`;
	const tab = entry.tab;

	if (!tabToZhFile[tab]) continue;

	// Check zh has the key
	if (!(labelKey in zhData[tab])) {
		gateErrors.push(`MISSING in zh: ${labelKey}`);
		continue;
	}

	const zhVal = zhData[tab][labelKey];

	// Check for CJK character
	const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(zhVal);

	// Short brand/tech terms can stay English
	if (whitelist.has(zhVal) || whitelist.has(entry.label)) {
		gatePassed++;
		continue;
	}

	// Check label has CJK or is a numeric/short value
	if (hasCJK || /^\d/.test(zhVal) || zhVal.length <= 3) {
		gatePassed++;
	} else {
		gateErrors.push(`NO CJK in zh: ${labelKey} = "${zhVal}"`);
	}
}

console.log(`\n═══ GATE RESULTS ═══`);
console.log(`Schema paths with ui.label: ${entries.length}`);
console.log(`Covered with CJK in zh: ${gatePassed}`);
console.log(`Errors: ${gateErrors.length}`);
if (gateErrors.length > 0) {
	for (const err of gateErrors) {
		console.log(`  ❌ ${err}`);
	}
}
console.log(gateErrors.length === 0 ? "✅ ALL GATES PASSED" : "❌ GATES FAILED");

// ═══════════════════════════════════════════════════════════════════════════
// STEP 10: Summary
// ═══════════════════════════════════════════════════════════════════════════
const summaryLines: string[] = [
	"# i18n Missing Fix Summary",
	"",
	`> Generated: ${new Date().toISOString()}`,
	"",
	"## Overview",
	"",
	`- Schema paths with ui.label: ${entries.length}`,
	`- Added en keys: ${addedEn}`,
	`- Added zh keys: ${addedZh}`,
	`- Deleted phantom keys: ${deletedCount}`,
	`- Fixed mixed/EN labels: ${fixedCount}`,
	`- Gate: ${gateErrors.length === 0 ? "PASSED" : "FAILED"}`,
	"",
	"## Phantom Keys Deleted",
	"",
	...phantomKeys.map(k => `- \`${k}\``),
	"",
	"## Mixed/EN Labels Fixed",
	"",
	...Object.values(zhFixes).map(f => `- \`${f.key}\` → "${f.value}"`),
	"",
	"## Schema Coverage by Tab",
	"",
];

// Count per tab
const tabCounts: Record<string, number> = {};
for (const entry of entries) {
	tabCounts[entry.tab] = (tabCounts[entry.tab] || 0) + 1;
}
for (const [tab, count] of Object.entries(tabCounts).sort()) {
	summaryLines.push(`| ${tab} | ${count} |`);
}

if (gateErrors.length > 0) {
	summaryLines.push("", "## Gate Errors", "");
	for (const err of gateErrors) {
		summaryLines.push(`- ${err}`);
	}
}

writeFileSync(
	join(import.meta.dir, "..", "..", "..", "docs", "local", "i18n-missing-fix-summary.md"),
	`${summaryLines.join("\n")}\n`,
);
console.log("✓ Summary written");
