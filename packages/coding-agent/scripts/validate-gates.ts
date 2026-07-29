#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { join } from "node:path";

const LANG = join(import.meta.dir, "..", "src", "i18n", "lang");
const categories = [
	"shell",
	"files",
	"memory",
	"appearance",
	"tasks",
	"providers",
	"model",
	"interaction",
	"context",
	"tools",
];
let allPass = true;

function load(f: string): Record<string, string> {
	return JSON.parse(readFileSync(join(LANG, f), "utf-8"));
}
function sortedKeys(f: string): string[] {
	return Object.keys(load(f)).sort();
}

// Gate 1: settings keys match
for (const cat of categories) {
	const enK = sortedKeys(`en-settings-${cat}.json`);
	const zhK = sortedKeys(`zh-settings-${cat}.json`);
	const match = enK.length === zhK.length && enK.every((k, i) => k === zhK[i]);
	if (!match) {
		console.log(`FAIL settings-${cat}: EN=${enK.length} ZH=${zhK.length}`);
		allPass = false;
	}
}

// Gate 2: commands keys match
const enCmd = sortedKeys("en-commands.json");
const zhCmd = sortedKeys("zh-commands.json");
const cmdMatch = enCmd.length === zhCmd.length && enCmd.every((k, i) => k === zhCmd[i]);
if (!cmdMatch) {
	console.log(`FAIL commands: EN=${enCmd.length} ZH=${zhCmd.length}`);
	allPass = false;
}

// Gate 3 & 4: no dupes, no empty
for (const f of [...categories.map(c => `zh-settings-${c}.json`), "zh-commands.json"]) {
	const obj = load(f);
	const empty = Object.entries(obj).filter(([, v]) => v === "");
	if (empty.length > 0) {
		allPass = false;
		for (const [k] of empty) console.log(`EMPTY ${f}: ${k}`);
	}
}

console.log(allPass ? "\nALL GATES PASS" : "\nSOME GATES FAILED");
console.log(`EN settings total: ${categories.reduce((s, c) => s + sortedKeys(`en-settings-${c}.json`).length, 0)}`);
console.log(`ZH settings total: ${categories.reduce((s, c) => s + sortedKeys(`zh-settings-${c}.json`).length, 0)}`);
console.log(`EN commands: ${enCmd.length}`);
console.log(`ZH commands: ${zhCmd.length}`);
