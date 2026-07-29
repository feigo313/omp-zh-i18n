#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { join } from "node:path";

const LANG = join(import.meta.dir, "..", "src", "i18n", "lang");
const SCHEMA = join(import.meta.dir, "..", "src", "config", "settings-schema.ts");

const schema = readFileSync(SCHEMA, "utf-8");
const keyPattern = /["']([a-zA-Z][a-zA-Z0-9_.]*)["']\s*:\s*\{/g;
const entries: { path: string; label: string; tab: string }[] = [];
let match: RegExpExecArray | null = keyPattern.exec(schema);
while (match !== null) {
	const p = match[1];
	const startIdx = match.index;
	let depth = 0;
	let j = startIdx + match[0].length - 1;
	const blockStart = j;
	while (j < schema.length) {
		if (schema[j] === "{") depth++;
		else if (schema[j] === "}") {
			depth--;
			if (depth === 0) break;
		}
		j++;
	}
	const block = schema.slice(blockStart, j + 1);
	const tabMatch = block.match(/ui\s*:\s*\{[^}]*?tab\s*:\s*["'](\w+)["']/s);
	const labelMatch = tabMatch ? block.match(/ui\s*:\s*\{[\s\S]*?label\s*:\s*["']([\s\S]*?)["']/) : null;
	if (tabMatch && labelMatch) {
		entries.push({ path: p, label: labelMatch[1].trim(), tab: tabMatch[1] });
	}
	match = keyPattern.exec(schema);
}

const tabToZh: Record<string, string> = {
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

let errors = 0;
let passed = 0;
for (const entry of entries) {
	const labelKey = `settings.${entry.path}.label`;
	const zhFile = tabToZh[entry.tab];
	if (!zhFile) continue;
	const zh = JSON.parse(readFileSync(join(LANG, zhFile), "utf-8"));
	if (!(labelKey in zh)) {
		console.log(`MISSING: ${labelKey}`);
		errors++;
		continue;
	}
	const val = zh[labelKey];
	const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(val);
	if (whitelist.has(val) || hasCJK || /^\d/.test(val) || val.length <= 3) {
		passed++;
	} else {
		console.log(`NO CJK: ${labelKey} = "${val}"`);
		errors++;
	}
}

console.log(`\nSchema paths: ${entries.length}`);
console.log(`Passed: ${passed}`);
console.log(`Errors: ${errors}`);
console.log(errors === 0 ? "✅ ALL GATES PASSED" : "❌ GATES FAILED");
