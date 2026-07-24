#!/usr/bin/env bun
/**
 * 为每个 en-settings-*.json 生成对应的 zh-settings-*.json 模板
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const LAN_DIR = path.join(os.homedir(), ".omp", "lang");

console.log(`LAN_DIR: ${LAN_DIR}`);
console.log(`Directory exists: ${fs.existsSync(LAN_DIR)}`);

// 读取所有 en-settings-*.json 文件
const files = fs.readdirSync(LAN_DIR).filter(f => f.startsWith("en-settings-") && f.endsWith(".json"));

console.log(`Found ${files.length} English settings files:`, files);

for (const enFile of files) {
	const enPath = path.join(LAN_DIR, enFile);
	const enData = JSON.parse(fs.readFileSync(enPath, "utf-8"));

	// 创建中文模板（所有值设为空字符串）
	const zhData: Record<string, string> = {};
	for (const key of Object.keys(enData)) {
		zhData[key] = "";
	}

	// 生成对应的中文文件名
	const zhFile = enFile.replace("en-settings-", "zh-settings-");
	const zhPath = path.join(LAN_DIR, zhFile);

	console.log(`Writing ${zhFile} to ${zhPath}...`);
	fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2));

	// 验证文件是否写入成功
	if (fs.existsSync(zhPath)) {
		console.log(`✓ Generated: ${zhFile} (${Object.keys(zhData).length} keys)`);
	} else {
		console.error(`✗ Failed to generate: ${zhFile}`);
	}
}

console.log("\nListing all files in LAN_DIR:");
console.log(fs.readdirSync(LAN_DIR).join("\n"));
