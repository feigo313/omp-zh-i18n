import { describe, expect, it } from "bun:test";
import * as path from "node:path";

import { EMBEDDED_TRANSLATION_FILES } from "../../src/i18n";

const langDir = path.join(import.meta.dir, "../../src/i18n/lang");
const legacyFiles = new Set(["en-settings-full.json"]);

function flatten(value: unknown, prefix = "", result = new Map<string, string>()): Map<string, string> {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		for (const [key, child] of Object.entries(value)) {
			if (key === "meta") continue;
			flatten(child, prefix ? `${prefix}.${key}` : key, result);
		}
	} else if (typeof value === "string") {
		result.set(prefix, value);
	}
	return result;
}

async function readLanguage(name: string): Promise<Map<string, string>> {
	return flatten(await Bun.file(path.join(langDir, name)).json());
}

function placeholders(value: string): string[] {
	return [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
}

describe("i18n resource contract", () => {
	it("registers every active bundled language file", async () => {
		const files = (await Array.fromAsync(new Bun.Glob("*.json").scan({ cwd: langDir })))
			.filter(file => !legacyFiles.has(file))
			.sort();
		expect([...EMBEDDED_TRANSLATION_FILES].sort()).toEqual(files);
	});

	it("keeps paired English and Chinese resources symmetric", async () => {
		const pairs = [
			"cli",
			"commands",
			"settings-appearance",
			"settings-context",
			"settings-files",
			"settings-interaction",
			"settings-memory",
			"settings-model",
			"settings-providers",
			"settings-shell",
			"settings-tasks",
			"settings-tools",
		];
		for (const pair of pairs) {
			const en = await readLanguage(`en-${pair}.json`);
			const zh = await readLanguage(`zh-${pair}.json`);
			expect({ pair, missingInZh: [...en.keys()].filter(key => !zh.has(key)) }).toEqual({ pair, missingInZh: [] });
			if (pair !== "commands") {
				expect({ pair, extraInZh: [...zh.keys()].filter(key => !en.has(key)) }).toEqual({ pair, extraInZh: [] });
			}
			for (const [key, english] of en) {
				expect({ pair, key, placeholders: placeholders(zh.get(key) ?? "") }).toEqual({
					pair,
					key,
					placeholders: placeholders(english),
				});
			}
		}
	});

	it("has no empty translations or active cross-file duplicate keys", async () => {
		const files = (await Array.fromAsync(new Bun.Glob("*.json").scan({ cwd: langDir })))
			.filter(file => !legacyFiles.has(file))
			.sort();
		for (const language of ["en", "zh"]) {
			const seen = new Map<string, string[]>();
			for (const file of files.filter(name => name.startsWith(`${language}-`) || name === `${language}.json`)) {
				for (const [key, value] of await readLanguage(file)) {
					expect(value.trim(), `${file}:${key}`).not.toBe("");
					const owners = seen.get(key) ?? [];
					owners.push(file);
					seen.set(key, owners);
				}
			}
			const duplicates = [...seen.entries()].filter(([, owners]) => owners.length > 1);
			expect({ language, duplicates }).toEqual({ language, duplicates: [] });
		}
	});
});
