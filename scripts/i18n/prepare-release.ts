#!/usr/bin/env bun

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { $ } from "bun";

const ROOT = process.cwd();
const NATIVE_PACKAGE = "@oh-my-pi/pi-natives";
const ALLOWED_UNTRACKED = [".agents", ".reasonix", "docs/local/_audit"];

// These are the files owned by the localization layer. Everything else comes
// from the official release tag and must be reviewed as an independent port.
const I18N_OVERLAY_ROOTS = [
	"packages/coding-agent/src/i18n",
	"packages/coding-agent/src/config/settings-schema.ts",
	"packages/coding-agent/src/cli.ts",
	"packages/coding-agent/src/modes/components/plugin-settings.ts",
	"packages/coding-agent/src/modes/components/settings-defs.ts",
	"packages/coding-agent/src/modes/components/settings-selector.ts",
	"packages/coding-agent/src/modes/components/welcome.ts",
	"packages/coding-agent/src/modes/controllers/selector-controller.ts",
	"packages/coding-agent/src/slash-commands/builtin-registry.ts",
	"packages/coding-agent/scripts/check-schema-gate.ts",
	"packages/coding-agent/scripts/extract-settings-translations.ts",
];

type Mode = "prepare" | "finish";

interface Options {
	mode: Mode;
	targetTag: string;
	fromTag: string;
	fromLocalizedTag: string;
	plan: boolean;
	resume: boolean;
}

interface PackageJson {
	name?: string;
	version?: string;
	private?: boolean;
	workspaces?: {
		catalog?: Record<string, string>;
	};
	[key: string]: unknown;
}

function git(args: readonly string[]) {
	return $`git -c core.fsmonitor=false -c core.untrackedCache=false -c fetch.pruneTags=false ${args}`;
}

async function gitText(args: readonly string[]): Promise<string> {
	const result = await git(args).quiet().nothrow();
	if (result.exitCode !== 0) {
		throw new Error(`git ${args.join(" ")} failed:\n${result.text().trim()}`);
	}
	return result.text();
}

async function gitMaybe(args: readonly string[]): Promise<string | null> {
	const result = await git(args).quiet().nothrow();
	return result.exitCode === 0 ? result.text() : null;
}

function usage(): never {
	console.error(`Usage:
  bun run i18n:prepare -- v17.2.0 [--from v17.1.8] [--from-zh v17.1.8-zh] [--plan|--resume]
  bun run i18n:finish -- v17.2.0

prepare creates i18n/<version>-zh-adaptation from the official tag, then
three-way merges the previous localization overlay. It never commits, pushes,
or publishes.
`);
	process.exit(2);
}

function normalizeOfficialTag(raw: string): string {
	const match = raw.match(/^v?(\d+\.\d+\.\d+)$/);
	if (!match) throw new Error(`Invalid official version: ${raw}`);
	return `v${match[1]}`;
}

function normalizeLocalizedTag(raw: string): string {
	const match = raw.match(/^v?(\d+\.\d+\.\d+)-zh$/);
	if (!match) throw new Error(`Invalid localized tag: ${raw}`);
	return `v${match[1]}-zh`;
}

function parseOptions(argv: string[]): Options {
	const mode = (argv[0] ?? "prepare") as Mode;
	if (mode !== "prepare" && mode !== "finish") usage();

	let targetRaw: string | undefined;
	let fromRaw = "v17.1.8";
	let fromLocalizedRaw = "v17.1.8-zh";
	let plan = false;
	let resume = false;

	for (let i = 1; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--plan") {
			plan = true;
			continue;
		}
		if (arg === "--resume") {
			resume = true;
			continue;
		}
		if (arg === "--from") {
			fromRaw = argv[++i] ?? usage();
			continue;
		}
		if (arg === "--from-zh") {
			fromLocalizedRaw = argv[++i] ?? usage();
			continue;
		}
		if (arg.startsWith("--")) usage();
		if (targetRaw === undefined) {
			targetRaw = arg;
			continue;
		}
		usage();
	}

	if (!targetRaw) usage();
	return {
		mode,
		targetTag: normalizeOfficialTag(targetRaw),
		fromTag: normalizeOfficialTag(fromRaw),
		fromLocalizedTag: normalizeLocalizedTag(fromLocalizedRaw),
		plan,
		resume,
	};
}

function isAllowedUntracked(line: string): boolean {
	if (!line.startsWith("?? ")) return false;
	const file = line.slice(3).replace(/\\/g, "/");
	return ALLOWED_UNTRACKED.some(prefix => file === prefix || file.startsWith(`${prefix}/`));
}

async function assertSafeWorktree(): Promise<void> {
	const status = (await gitText(["status", "--short"])).trim();
	if (!status) return;

	const unexpected = status.split(/\r?\n/).filter(line => line.length > 0 && !isAllowedUntracked(line));
	if (unexpected.length > 0) {
		throw new Error(
			`工作区有未完成改动，已停止。只允许存在 ${ALLOWED_UNTRACKED.join(", ")}：\n${unexpected.join("\n")}`,
		);
	}
}

function isOverlayPath(file: string): boolean {
	const normalized = file.replace(/\\/g, "/");
	return I18N_OVERLAY_ROOTS.some(root => normalized === root || normalized.startsWith(`${root}/`));
}

async function assertResumeWorktree(options: Options): Promise<void> {
	const expectedBranch = `i18n/${options.targetTag.slice(1)}-zh-adaptation`;
	const branch = (await gitText(["branch", "--show-current"])).trim();
	if (branch !== expectedBranch) {
		throw new Error(`--resume 要求当前分支为 ${expectedBranch}，实际为 ${branch || "(detached)"}`);
	}

	const status = await gitText(["status", "--short"]);
	if (!status.trim()) return;
	const unexpected = status.split(/\r?\n/).filter(line => {
		if (!line.trim()) return false;
		const file = line.slice(3).replace(/\\/g, "/");
		return !isOverlayPath(file) && !isAllowedUntracked(line);
	});
	if (unexpected.length > 0) {
		throw new Error(`--resume 只允许继续处理 i18n overlay 改动：\n${unexpected.join("\n")}`);
	}
}

async function assertRemoteTag(tag: string): Promise<void> {
	const result = await git(["ls-remote", "--exit-code", "upstream", `refs/tags/${tag}`, `refs/tags/${tag}^{}`])
		.quiet()
		.nothrow();
	if (result.exitCode !== 0) {
		throw new Error(`upstream 没有找到官方 tag ${tag}`);
	}
	console.log(`官方 tag ${tag}: ${result.text().trim().split(/\r?\n/)[0]}`);
}

async function ensureLocalTag(tag: string): Promise<void> {
	if (await gitMaybe(["rev-parse", "--verify", `${tag}^{commit}`])) return;
	const result = await git(["fetch", "--no-tags", "upstream", "tag", tag]).quiet().nothrow();
	if (result.exitCode !== 0) {
		throw new Error(`无法拉取本地 tag ${tag}：\n${result.text().trim()}`);
	}
}

async function listRefFiles(ref: string, root: string): Promise<string[]> {
	const output = await gitText(["ls-tree", "-r", "--name-only", ref, "--", root]);
	return output.split(/\r?\n/).filter(Boolean);
}

async function readRefFile(ref: string, file: string): Promise<string | null> {
	const result = await git(["show", `${ref}:${file}`])
		.quiet()
		.nothrow();
	return result.exitCode === 0 ? result.text() : null;
}

async function resetOverlayDestinations(options: Options): Promise<void> {
	const files = new Set<string>();
	for (const root of I18N_OVERLAY_ROOTS) {
		for (const file of await listRefFiles(options.fromLocalizedTag, root)) files.add(file);
	}
	for (const file of files) {
		const official = await readRefFile(options.targetTag, file);
		if (official !== null) await Bun.write(repoPath(file), official);
	}
}

function repoPath(file: string): string {
	const absolute = path.resolve(ROOT, file);
	const relative = path.relative(ROOT, absolute);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error(`拒绝写入仓库外路径: ${file}`);
	}
	return absolute;
}

async function mergeOverlay(options: Options): Promise<void> {
	const files = new Set<string>();
	for (const root of I18N_OVERLAY_ROOTS) {
		for (const file of await listRefFiles(options.fromLocalizedTag, root)) files.add(file);
	}

	const tempRoot = path.join(ROOT, ".tools", "i18n-merge", `${Date.now()}`);
	await fs.mkdir(tempRoot, { recursive: true });
	let ported = 0;
	let skipped = 0;
	const conflicts: string[] = [];

	try {
		for (const file of [...files].sort()) {
			const base = await readRefFile(options.fromTag, file);
			const localized = await readRefFile(options.fromLocalizedTag, file);
			if (localized === null) continue;

			const official = await readRefFile(options.targetTag, file);
			const destination = repoPath(file);

			if (base === null && official === null) {
				await Bun.write(destination, localized);
				ported++;
				continue;
			}

			if (official === null) {
				conflicts.push(`${file}: 官方新版本已删除旧版汉化触点`);
				continue;
			}

			if (base === null) {
				conflicts.push(`${file}: 官方新版本新增了同路径文件，需要人工合并`);
				continue;
			}

			if (localized === base) {
				skipped++;
				continue;
			}

			if (official === base) {
				await Bun.write(destination, localized);
				ported++;
				continue;
			}

			const safeName = file.replace(/[^A-Za-z0-9._-]/g, "_");
			const currentPath = path.join(tempRoot, `${safeName}.official`);
			const basePath = path.join(tempRoot, `${safeName}.base`);
			const localizedPath = path.join(tempRoot, `${safeName}.localized`);
			await Bun.write(currentPath, official);
			await Bun.write(basePath, base);
			await Bun.write(localizedPath, localized);

			const result = await $`git merge-file --diff3 ${currentPath} ${basePath} ${localizedPath}`.quiet().nothrow();
			// git merge-file returns the number of conflict hunks, not a boolean.
			// Git command failures use the high exit-code range.
			if (result.exitCode >= 128) {
				throw new Error(`git merge-file failed for ${file}:\n${result.text().trim()}`);
			}
			await Bun.write(destination, await Bun.file(currentPath).text());
			ported++;
			if (result.exitCode > 0) conflicts.push(`${file}: 三方合并产生冲突标记（${result.exitCode} 个冲突块）`);
		}
	} finally {
		await fs.rm(tempRoot, { recursive: true, force: true });
	}

	console.log(`i18n overlay: ${ported} 个文件已移植，${skipped} 个文件无变化`);
	if (conflicts.length > 0) {
		console.error("需要人工处理的冲突:");
		for (const conflict of conflicts) console.error(`  - ${conflict}`);
		console.error(`处理完成后运行: bun run i18n:finish -- ${options.targetTag}`);
		process.exitCode = 1;
	}
}

async function updateVersions(targetTag: string): Promise<void> {
	const officialVersion = targetTag.slice(1);
	const localizedVersion = `${officialVersion}-zh`;
	const packagesDir = path.join(ROOT, "packages");
	const entries = await fs.readdir(packagesDir, { withFileTypes: true });
	let updated = 0;

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const packagePath = path.join(packagesDir, entry.name, "package.json");
		try {
			const pkg = JSON.parse(await Bun.file(packagePath).text()) as PackageJson;
			if (!pkg.name?.startsWith("@oh-my-pi/") || pkg.name === NATIVE_PACKAGE) continue;
			if (pkg.version === localizedVersion) continue;
			pkg.version = localizedVersion;
			await Bun.write(packagePath, `${JSON.stringify(pkg, null, "\t")}\n`);
			updated++;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		}
	}

	const rootPath = path.join(ROOT, "package.json");
	const rootPkg = JSON.parse(await Bun.file(rootPath).text()) as PackageJson;
	const catalog = rootPkg.workspaces?.catalog;
	if (catalog) {
		for (const name of Object.keys(catalog)) {
			if (!name.startsWith("@oh-my-pi/")) continue;
			catalog[name] = name === NATIVE_PACKAGE ? officialVersion : localizedVersion;
		}
		await Bun.write(rootPath, `${JSON.stringify(rootPkg, null, "\t")}\n`);
	}

	console.log(`版本已更新：${updated} 个 JS package -> ${localizedVersion}`);
	console.log(`native package 保持官方版本 ${officialVersion}，避免 .node sentinel 与平台 leaf 不匹配`);
}

async function generateTemplates(): Promise<void> {
	const result =
		await $`bun packages/coding-agent/scripts/extract-settings-translations.ts --output-dir packages/coding-agent/src/i18n/lang`
			.quiet()
			.nothrow();
	process.stdout.write(result.text());
	if (result.exitCode !== 0) {
		throw new Error("settings translation template generation failed");
	}
}

async function finish(options: Options): Promise<void> {
	const expectedBranch = `i18n/${options.targetTag.slice(1)}-zh-adaptation`;
	const branch = (await gitText(["branch", "--show-current"])).trim();
	if (branch !== expectedBranch) {
		throw new Error(`当前分支为 ${branch || "(detached)"}，预期为 ${expectedBranch}`);
	}
	await updateVersions(options.targetTag);
	await generateTemplates();
	console.log("准备阶段完成：请先翻译新增空键，再运行 bun run i18n:verify -- --binary <path>");
}

async function prepare(options: Options): Promise<void> {
	if (options.plan) {
		const status = (await gitText(["status", "--short"])).trim();
		if (status) console.log(`计划模式检测到当前改动（不会写入）：\n${status}`);
	} else {
		if (options.resume) await assertResumeWorktree(options);
		else await assertSafeWorktree();
	}
	await assertRemoteTag(options.targetTag);
	if (options.plan) {
		const files = new Set<string>();
		for (const root of I18N_OVERLAY_ROOTS) {
			for (const file of await listRefFiles(options.fromLocalizedTag, root)) files.add(file);
		}
		console.log(`计划创建分支: i18n/${options.targetTag.slice(1)}-zh-adaptation`);
		console.log(`官方基线: ${options.targetTag}`);
		console.log(`旧官方基线: ${options.fromTag}`);
		console.log(`旧汉化 tag: ${options.fromLocalizedTag}`);
		console.log(`受控 i18n overlay 文件: ${files.size}`);
		console.log("计划模式未 fetch、未切换分支、未修改文件。");
		return;
	}

	await ensureLocalTag(options.targetTag);
	await ensureLocalTag(options.fromTag);
	if (!(await gitMaybe(["rev-parse", "--verify", `${options.fromLocalizedTag}^{commit}`]))) {
		throw new Error(`本地不存在旧汉化 tag ${options.fromLocalizedTag}`);
	}

	const branch = `i18n/${options.targetTag.slice(1)}-zh-adaptation`;
	if (options.resume) {
		await resetOverlayDestinations(options);
		console.log(`已在 ${branch} 恢复官方 overlay 基线，继续三方合并`);
	} else {
		if (await gitMaybe(["show-ref", "--verify", `refs/heads/${branch}`])) {
			throw new Error(`分支已存在：${branch}。为避免覆盖，未执行任何切换。`);
		}
		await gitText(["switch", "-c", branch, options.targetTag]);
		console.log(`已从官方 ${options.targetTag} 创建 ${branch}`);
	}
	await mergeOverlay(options);
	if (process.exitCode === 1) return;
	await finish(options);
}

async function main(): Promise<void> {
	const options = parseOptions(Bun.argv.slice(2));
	if (options.mode === "finish") {
		await finish(options);
		return;
	}
	await prepare(options);
}

try {
	await main();
} catch (error) {
	console.error(`i18n workflow failed: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
