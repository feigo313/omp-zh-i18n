#!/usr/bin/env bun
/**
 * Deduplicate zh-ui.json and add missing §2.1 + §2.2 keys.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LANG = join(import.meta.dir, "..", "src", "i18n", "lang");

// Read raw file to detect duplicate keys
const raw = readFileSync(join(LANG, "zh-ui.json"), "utf-8");

// Parse with duplicate detection
function parseWithDupes(json: string): { obj: Record<string, string>; dupes: Map<string, string[]> } {
	const dupes = new Map<string, string[]>();
	// Use a custom parser that tracks all occurrences
	const keys: string[] = [];
	const values: string[] = [];

	// Strip BOM and trailing commas
	const clean = json.replace(/^\uFEFF/, "").replace(/,\s*([}\]])/g, "$1");

	// Extract key-value pairs manually to detect dupes
	const kvPattern = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
	let match: RegExpExecArray | null = kvPattern.exec(clean);
	while (match !== null) {
		const key = match[1];
		const val = match[2];
		keys.push(key);
		values.push(val);
		if (dupes.has(key)) {
			dupes.get(key)!.push(val);
		} else {
			dupes.set(key, [val]);
		}
		match = kvPattern.exec(clean);
	}

	// Report dupes
	console.log(`\n=== Duplicate key report ===`);
	let dupeCount = 0;
	for (const [key, vals] of dupes) {
		if (vals.length > 1) {
			dupeCount++;
			console.log(`  [${key}]: ${vals.length} occurrences`);
			for (let i = 0; i < vals.length; i++) {
				console.log(`    ${i + 1}. "${vals[i]}"`);
			}
		}
	}
	console.log(`Total duplicate keys: ${dupeCount}`);

	// Build final object (last-write-wins, same as JSON.parse)
	const obj = JSON.parse(clean) as Record<string, string>;
	return { obj, dupes };
}

const { obj, dupes } = parseWithDupes(raw);

// Dedup: for keys with different values, pick the more Chinese/complete one
const decisions: Record<string, { chosen: string; rejected: string[] }> = {};
for (const [key, vals] of dupes) {
	if (vals.length <= 1) continue;
	const unique = [...new Set(vals)];
	if (unique.length === 1) {
		// Same value repeated - just keep one
		decisions[key] = { chosen: unique[0], rejected: [] };
	} else {
		// Different values - pick the longer/more-Chinese one
		// Prioritize: longer Chinese > Chinese > shorter
		const sorted = unique.sort((a, b) => {
			const aHasChinese = /[\u4e00-\u9fff]/.test(a);
			const bHasChinese = /[\u4e00-\u9fff]/.test(b);
			if (aHasChinese && !bHasChinese) return -1;
			if (!aHasChinese && bHasChinese) return 1;
			return b.length - a.length; // longer first
		});
		decisions[key] = { chosen: sorted[0], rejected: sorted.slice(1) };
	}
}

console.log(`\n=== Dedup decisions ===`);
for (const [key, { chosen, rejected }] of Object.entries(decisions)) {
	if (rejected.length > 0) {
		console.log(`  ${key}: keep "${chosen}", drop ${rejected.map(r => `"${r}"`).join(", ")}`);
	}
}

// Add §2.1 Welcome keys
const welcomeKeys: Record<string, string> = {
	back: "欢迎回来！",
	"welcome.back": "欢迎回来！",
	noRecentSessions: "暂无最近会话",
	noLspServers: "无 LSP 服务器",
	tips: "提示",
	"tips.promptActions": " 打开提示操作",
	"tips.commands": " 打开命令",
	"tips.bash": " 运行 bash",
	"tips.python": " 运行 python",
	lspServers: "LSP 服务器",
	recentSessions: "最近会话",
	tipLabel: "提示：",
	nerdfont: "请使用 Nerd Font 😭。",
};

// Add §2.2 Settings shell keys
const settingsKeys: Record<string, string> = {
	"ui.settings.title": "设置",
	"ui.settings.noResults": "无匹配的设置项",
	"tabs.plugins.label": "插件",
};

// Add P1 footer keys
const footerKeys: Record<string, string> = {
	"ui.settings.footer.search": "Enter to change · Tab to jump tabs · Esc to exit search",
	"ui.settings.footer.plugins": "Tab to switch tabs · Esc to close",
	"ui.settings.footer.sectionFocus":
		"↑/↓ to jump sections · Tab/Enter to settings · ←/→ to switch tabs · Esc to close",
	"ui.settings.footer.default": "Enter/Space to change · {nav} · Type to search · Esc to close",
	"ui.settings.footer.defaultWithSections":
		"Enter/Space to change · Tab to jump sections · ←/→ to switch tabs · Type to search · Esc to close",
	"ui.settings.footer.defaultNoSections": "Enter/Space to change · Tab to switch tabs · Type to search · Esc to close",
};

// Merge: obj already has last-write-wins values. Now add missing keys.
const final: Record<string, string> = { ...obj };

let addedCount = 0;
let alreadyPresent = 0;

for (const [key, val] of Object.entries({ ...welcomeKeys, ...settingsKeys, ...footerKeys })) {
	if (key in final && final[key] !== "") {
		alreadyPresent++;
		// Check if existing is English-only (needs override)
		if (!/[\u4e00-\u9fff]/.test(final[key]) && final[key] !== val) {
			console.log(`  Override English "${final[key]}" -> "${val}" for ${key}`);
			final[key] = val;
			addedCount++;
		}
	} else {
		final[key] = val;
		addedCount++;
	}
}

console.log(`\nAdded/overridden: ${addedCount}, already present (kept): ${alreadyPresent}`);

// Verify no empty values
for (const [k, v] of Object.entries(final)) {
	if (v === "") {
		console.log(`WARNING: empty value for ${k}`);
	}
}

// Verify no duplicate keys in output
const keySet = new Set(Object.keys(final));
if (keySet.size !== Object.keys(final).length) {
	console.log("ERROR: output has duplicate keys!");
} else {
	console.log(`Output keys: ${keySet.size} (no duplicates)`);
}

// Sort keys for consistency
const sorted = Object.fromEntries(Object.entries(final).sort(([a], [b]) => a.localeCompare(b)));

// Write
writeFileSync(join(LANG, "zh-ui.json"), `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`\nWritten zh-ui.json with ${Object.keys(sorted).length} keys`);
