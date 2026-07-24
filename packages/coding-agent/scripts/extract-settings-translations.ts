#!/usr/bin/env bun
/**
 * 从 settings-schema.ts 提取所有需要翻译的 label 和 description
 * 生成英文模板和中文空模板
 *
 * 修复: 正确处理嵌套结构，避免将 ui: { 误认作设置路径
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const SCHEMA_PATH = path.join(import.meta.dir, "../src/config/settings-schema.ts");
const LAN_DIR = path.join(os.homedir(), ".omp", "lang");

interface UiBlock {
	settingPath: string;
	tab: string;
	group: string;
	label: string;
	description: string;
	options: Array<{ value: string; label: string; description?: string }>;
}

function extractUiBlocks(): UiBlock[] {
	const content = fs.readFileSync(SCHEMA_PATH, "utf-8");
	const lines = content.split("\n");
	const blocks: UiBlock[] = [];

	// 找到所有 "ui: {" 出现的行
	// 然后向上找最近的设置定义行来获取 settingPath
	const uiLineIndices: number[] = [];

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();
		if (trimmed === "ui: {") {
			uiLineIndices.push(i);
		}
	}

	for (const uiLineIdx of uiLineIndices) {
		// 向上查找最近的设置定义（在 ui: 之前，缩进更少的行）
		// 设置定义格式: `keyName: {` 或 `"key.name": {`
		let settingPath = "";
		const uiIndent = getIndent(lines[uiLineIdx]);

		for (let j = uiLineIdx - 1; j >= 0; j--) {
			const line = lines[j];
			const trimmed = line.trim();

			// 跳过空行和注释
			if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
				continue;
			}

			const lineIndent = getIndent(line);

			// 只在缩进更少（父级）的行中查找
			if (lineIndent >= uiIndent) {
				continue;
			}

			// 检查是否是设置定义：以 keyName: 开头，可以带引号
			// 格式：autoResume: { 或 "power.sleepPrevention": {
			const settingMatch = trimmed.match(/^(?:"([^"]+)"|(\w+)):\s*\{/);
			if (settingMatch) {
				settingPath = settingMatch[1] || settingMatch[2];
				break;
			}

			// 也检查以逗号结尾的版本：autoResume: {, （虽然不太常见）
		}

		if (!settingPath) {
			continue; // 找不到设置路径，跳过
		}

		// 提取 ui 块内容
		let braceDepth = 1;
		const uiLines: string[] = [];
		let i = uiLineIdx + 1;

		while (i < lines.length && braceDepth > 0) {
			const uiLine = lines[i];
			const uiTrimmed = uiLine.trim();

			for (const ch of uiTrimmed) {
				if (ch === "{") braceDepth++;
				else if (ch === "}") braceDepth--;
			}

			if (braceDepth > 0) {
				uiLines.push(uiTrimmed);
			}
			i++;
		}

		// 解析 ui 块内容
		const uiContent = uiLines.join("\n");
		const block = parseUiBlock(settingPath, uiContent);
		if (block) {
			blocks.push(block);
		}
	}

	return blocks;
}

function getIndent(line: string): number {
	let count = 0;
	for (const ch of line) {
		if (ch === " " || ch === "\t") count++;
		else break;
	}
	return count;
}

function parseUiBlock(settingPath: string, content: string): UiBlock | null {
	// 提取 tab
	const tabMatch = content.match(/tab:\s*"([^"]+)"/);
	if (!tabMatch) return null;
	const tab = tabMatch[1];

	// 提取 group
	const groupMatch = content.match(/group:\s*"([^"]+)"/);
	const group = groupMatch ? groupMatch[1] : "";

	// 提取 label
	const labelMatch = content.match(/label:\s*"([^"]+)"/);
	if (!labelMatch) return null;
	const label = labelMatch[1];

	// 提取 description（多行或单行）
	let description = "";
	// 匹配多行/单行 description
	const descRegex = /description:\s*(?:"([^"]+)"|\n\s*"([^"]+)")/;
	const descMatch = content.match(descRegex);
	if (descMatch) {
		description = descMatch[1] || descMatch[2] || "";
	}

	// 提取 options
	const options: Array<{ value: string; label: string; description?: string }> = [];
	const optionsSection = content.match(/options:\s*\[([\s\S]*?)\]/);
	if (optionsSection) {
		const optionsContent = optionsSection[1];
		const optionRegex =
			/\{\s*value:\s*"([^"]+)"[\s\S]*?label:\s*"([^"]+)"(?:[\s\S]*?description:\s*"([^"]*)")?[\s\S]*?\}/g;
		let match = optionRegex.exec(optionsContent);
		while (match !== null) {
			options.push({
				value: match[1],
				label: match[2],
				description: match[3],
			});
			match = optionRegex.exec(optionsContent);
		}
	}

	return { settingPath, tab, group, label, description, options };
}

function generateTranslations() {
	console.log("从 settings-schema.ts 提取设置项...\n");

	const blocks = extractUiBlocks();
	console.log(`提取到 ${blocks.length} 个设置项\n`);

	// 按 tab 分组
	const byTab = new Map<string, UiBlock[]>();
	for (const block of blocks) {
		if (!byTab.has(block.tab)) {
			byTab.set(block.tab, []);
		}
		byTab.get(block.tab)!.push(block);
	}

	// 检查是否有同名路径在不同 tab
	const pathMap = new Map<string, string[]>();
	for (const block of blocks) {
		if (!pathMap.has(block.settingPath)) {
			pathMap.set(block.settingPath, []);
		}
		pathMap.get(block.settingPath)!.push(block.tab);
	}
	const duplicates = [...pathMap.entries()].filter(([_, tabs]) => tabs.length > 1);
	if (duplicates.length > 0) {
		console.log("⚠️  同名路径在不同 Tab 出现:", duplicates.length);
		for (const [path, tabs] of duplicates) {
			console.log(`  ${path}: ${tabs.join(", ")}`);
		}
		console.log();
	}

	console.log("各 Tab 设置项数量:");
	for (const [tab, items] of byTab) {
		console.log(`  ${tab}: ${items.length} 个设置项`);
	}
	console.log();

	// 确保输出目录存在
	if (!fs.existsSync(LAN_DIR)) {
		fs.mkdirSync(LAN_DIR, { recursive: true });
	}

	// 生成每个 tab 的翻译文件
	for (const [tab, items] of byTab) {
		const enData: Record<string, string> = {};
		const zhData: Record<string, string> = {};

		// 保留已有的 tab group 翻译
		const existingZhPath = path.join(LAN_DIR, `zh-settings-${tab}.json`);
		if (fs.existsSync(existingZhPath)) {
			const existingZh = JSON.parse(fs.readFileSync(existingZhPath, "utf-8"));
			for (const [k, v] of Object.entries(existingZh)) {
				if (k.startsWith("tabs.")) {
					zhData[k] = v as string;
				}
			}
		}

		const existingEnPath = path.join(LAN_DIR, `en-settings-${tab}.json`);
		if (fs.existsSync(existingEnPath)) {
			const existingEn = JSON.parse(fs.readFileSync(existingEnPath, "utf-8"));
			for (const [k, v] of Object.entries(existingEn)) {
				if (k.startsWith("tabs.")) {
					enData[k] = v as string;
				}
			}
		}

		// 添加设置项的 label 和 description
		for (const block of items) {
			const pathPrefix = `settings.${block.settingPath}`;

			// label
			enData[`${pathPrefix}.label`] = block.label;
			if (!zhData[`${pathPrefix}.label`]) {
				zhData[`${pathPrefix}.label`] = "";
			}

			// description
			if (block.description) {
				enData[`${pathPrefix}.description`] = block.description;
				if (!zhData[`${pathPrefix}.description`]) {
					zhData[`${pathPrefix}.description`] = "";
				}
			}

			// options
			for (const opt of block.options) {
				const optPrefix = `${pathPrefix}.options.${opt.value}`;
				enData[`${optPrefix}.label`] = opt.label;
				if (!zhData[`${optPrefix}.label`]) {
					zhData[`${optPrefix}.label`] = "";
				}
				if (opt.description) {
					enData[`${optPrefix}.description`] = opt.description;
					if (!zhData[`${optPrefix}.description`]) {
						zhData[`${optPrefix}.description`] = "";
					}
				}
			}
		}

		// 写入文件
		const enPath = path.join(LAN_DIR, `en-settings-${tab}.json`);
		const zhPath = path.join(LAN_DIR, `zh-settings-${tab}.json`);

		fs.writeFileSync(enPath, `${JSON.stringify(enData, null, 2)}\n`);
		fs.writeFileSync(zhPath, `${JSON.stringify(zhData, null, 2)}\n`);

		const totalKeys = Object.keys(enData).length;
		const emptyZh = Object.values(zhData).filter(v => v === "").length;
		console.log(`✅ ${tab}: ${totalKeys} 条 (需要翻译 ${emptyZh} 条)`);
	}

	// 统计总数
	const allEnFiles = fs.readdirSync(LAN_DIR).filter(f => f.startsWith("en-settings-"));
	let totalKeys = 0;
	let totalEmpty = 0;
	for (const file of allEnFiles) {
		const data = JSON.parse(fs.readFileSync(path.join(LAN_DIR, file), "utf-8"));
		totalKeys += Object.keys(data).length;
	}
	for (const file of fs.readdirSync(LAN_DIR).filter(f => f.startsWith("zh-settings-"))) {
		const data = JSON.parse(fs.readFileSync(path.join(LAN_DIR, file), "utf-8"));
		totalEmpty += Object.values(data).filter(v => v === "").length;
	}

	console.log(`\n总计: ${totalKeys} 条设置翻译, 需要翻译 ${totalEmpty} 条`);
}

try {
	generateTranslations();
} catch (error) {
	console.error("Error:", error);
	process.exit(1);
}
