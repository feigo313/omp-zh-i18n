import { describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Contract: a Chinese translation never renders a literal "{placeholder}".
 *
 * The `zh-{ui,tips,hotkeys,runtime}` groups have no `en-*` counterpart, so their
 * English source of truth is the inline fallback at the callsite and the paired
 * resource test cannot cover them. The seam returns the Chinese string verbatim
 * when a callsite passes no params, so a Chinese value that uses a placeholder
 * the callsite does not supply prints the literal "{name}" in the UI.
 *
 * The callsites are discovered by parsing them, because a key's parameter set
 * is a property of where it is used, not of the key. The assertion itself is on
 * the rendered string, not on the source text.
 */

const LANG_DIR = path.join(import.meta.dir, "../../src/i18n/lang");
const ZH_ONLY_GROUPS = ["ui", "tips", "hotkeys", "runtime"];
const SOURCE_DIRS = [path.join(import.meta.dir, "../../../tui/src"), path.join(import.meta.dir, "../../src")];

function placeholders(text: string): string[] {
	return [...text.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]);
}

/** Arguments of a call, split at the top level. */
function splitArgs(text: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let inString = false;
	let escaped = false;
	let start = 0;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (ch === "\\") {
			escaped = true;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (ch === "(" || ch === "{" || ch === "[") depth++;
		else if (ch === ")" || ch === "}" || ch === "]") depth--;
		else if (ch === "," && depth === 0) {
			out.push(text.slice(start, i));
			start = i + 1;
		}
	}
	out.push(text.slice(start));
	return out.map(a => a.trim());
}

/** Top-level parameter names of an object literal, or null when it is dynamic. */
function objectKeys(arg: string): string[] | null {
	const trimmed = arg.trim();
	if (!trimmed.startsWith("{")) return null;
	const inner = trimmed.slice(1, -1);
	const keys: string[] = [];
	let depth = 0;
	let inString = false;
	let escaped = false;
	let segment = "";
	const segments: string[] = [];
	for (let i = 0; i < inner.length; i++) {
		const ch = inner[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (ch === "\\") {
			escaped = true;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (ch === "{" || ch === "[" || ch === "(") depth++;
		else if (ch === "}" || ch === "]" || ch === ")") depth--;
		if (ch === "," && depth === 0) {
			segments.push(segment);
			segment = "";
			continue;
		}
		segment += ch;
	}
	segments.push(segment);
	for (const seg of segments) {
		const match = seg.trim().match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::|,|$)/);
		if (match) keys.push(match[1]);
	}
	return keys;
}

type Callsite = { key: string; fallback: string; params: string[] | null; site: string };

const CALL = /\b(tuiT|interceptUIString|\bt)\s*\(/g;

async function* walk(dir: string): AsyncGenerator<string> {
	let entries;
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(full);
		else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) yield full;
	}
}

async function collectCallsites(): Promise<Callsite[]> {
	const found: Callsite[] = [];
	for (const dir of SOURCE_DIRS) {
		for await (const file of walk(dir)) {
			if (file.includes(`${path.sep}i18n${path.sep}lang${path.sep}`)) continue;
			const text = await fs.readFile(file, "utf8");
			CALL.lastIndex = 0;
			let match: RegExpExecArray | null;
			while ((match = CALL.exec(text))) {
				const open = text.indexOf("(", match.index);
				let depth = 0;
				let inString = false;
				let escaped = false;
				let close = -1;
				for (let i = open; i < text.length; i++) {
					const ch = text[i];
					if (escaped) {
						escaped = false;
						continue;
					}
					if (ch === "\\") {
						escaped = true;
						continue;
					}
					if (ch === '"' || ch === "'" || ch === "`") {
						inString = !inString;
						continue;
					}
					if (inString) continue;
					if (ch === "(" || ch === "{" || ch === "[") depth++;
					else if (ch === ")" || ch === "}" || ch === "]") {
						depth--;
						if (depth === 0) {
							close = i;
							break;
						}
					}
				}
				if (close < 0) continue;
				const args = splitArgs(text.slice(open + 1, close));
				const key = args[0]?.match(/^"((?:[^"\\]|\\.)*)"/)?.[1];
				if (!key) continue;
				const fallback = args[1]?.match(/^"((?:[^"\\]|\\.)*)"/)?.[1] ?? key;
				const params = args[2] === undefined ? [] : objectKeys(args[2]);
				const line = text.slice(0, match.index).split("\n").length;
				found.push({
					key,
					fallback,
					params,
					site: `${path.relative(process.cwd(), file)}:${line}`,
				});
			}
		}
	}
	return found;
}

describe("zh-only translations", () => {
	it("never renders a literal placeholder for a zh-only key", async () => {
		const dict: Record<string, string> = {};
		for (const file of await fs.readdir(LANG_DIR)) {
			if (!file.endsWith(".json")) continue;
			const group = file.replace(/^(en|zh)-/, "").replace(/\.json$/, "");
			if (!ZH_ONLY_GROUPS.includes(group)) continue;
			const parsed = JSON.parse(await fs.readFile(path.join(LANG_DIR, file), "utf8")) as Record<string, unknown>;
			for (const [key, value] of Object.entries(parsed)) {
				if (key === "meta" || typeof value !== "string") continue;
				dict[key] = value;
			}
		}

		const callsites = (await collectCallsites()).filter(callsite => callsite.key in dict);
		expect(callsites.length).toBeGreaterThan(0);

		const leaks: string[] = [];
		for (const callsite of callsites) {
			const chinese = dict[callsite.key];
			const params = callsite.params
				? Object.fromEntries(callsite.params.map(name => [name, `<${name}>`]))
				: undefined;
			// The seam returns the Chinese string verbatim when no params are
			// supplied, so the rendered result must be free of leftovers.
			const rendered = params ? chinese.replace(/\{(\w+)\}/g, (m, k: string) => params[k] ?? m) : chinese;
			const leftovers = placeholders(rendered);
			if (leftovers.length > 0) {
				leaks.push(
					`${callsite.key} @ ${callsite.site} renders literal {${leftovers.join("},{")}} (zh="${chinese}")`,
				);
			}
		}
		expect(leaks).toEqual([]);
	});
});
