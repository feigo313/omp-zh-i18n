#!/usr/bin/env bun

import * as path from "node:path";
import { $ } from "bun";

interface ReleaseConfig {
	remotes: {
		upstream: string;
		origin: string;
	};
	github: {
		repo: string;
		release: {
			draft: boolean;
			prerelease: boolean;
		};
	};
	localizedTagSuffix: string;
	branchPattern: string;
	cadence: {
		xyReleaseDue: string;
		patchOnlyPolicy: string;
	};
	overlay: {
		roots: string[];
		localAuxiliary: string[];
	};
}

interface SemVer {
	major: number;
	minor: number;
	patch: number;
	prerelease?: string;
	suffix?: string;
	raw: string;
}

interface StatusResult {
	latestOfficial: string | null;
	latestLocalized: string | null;
	xyReleaseDue: boolean;
	patchPending: boolean;
	suggested: {
		prepare?: string;
		finish?: string;
		verify?: string;
		publish?: string;
	};
	officialTags: string[];
	localizedTags: string[];
	note?: string;
}

function git(_remote: string, args: readonly string[]) {
	return $`git -c core.fsmonitor=false -c core.untrackedCache=false -c fetch.pruneTags=false ${args}`.cwd(
		process.cwd(),
	);
}

async function gitText(_remote: string, args: readonly string[]): Promise<string> {
	const result = await git(_remote, args).quiet().nothrow();
	if (result.exitCode !== 0) {
		throw new Error(`git ${args.join(" ")} failed:\n${result.text().trim()}`);
	}
	return result.text();
}

function parseSemVer(raw: string): SemVer | null {
	const match = raw.match(/^v(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9._-]+))?$/);
	if (!match) return null;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		prerelease: match[4] ?? undefined,
		raw,
	};
}

function parseLocalizedTag(raw: string, suffix: string): SemVer | null {
	const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = raw.match(new RegExp(`^v(\\d+)\\.(\\d+)\\.(\\d+)${escaped}$`));
	if (!match) return null;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		suffix,
		raw,
	};
}

function isStableOfficial(sv: SemVer): boolean {
	return !sv.prerelease;
}

function isStableLocalized(sv: SemVer, suffix: string): boolean {
	return sv.suffix === suffix && !sv.prerelease;
}

function compareSemVer(a: SemVer, b: SemVer): number {
	if (a.major !== b.major) return a.major - b.major;
	if (a.minor !== b.minor) return a.minor - b.minor;
	return a.patch - b.patch;
}

function sortSemVer(tags: SemVer[]): SemVer[] {
	return tags.sort(compareSemVer);
}

async function fetchRemoteTags(remoteName: string): Promise<string[]> {
	const output = await gitText(remoteName, ["ls-remote", "--tags", remoteName]);
	return output.split(/\r?\n/).filter(Boolean);
}

async function listLocalTags(): Promise<string[]> {
	const output = await gitText("", ["tag", "-l"]);
	return output.split(/\r?\n/).filter(Boolean);
}

async function getOfficialTags(remoteName: string, remote: boolean): Promise<SemVer[]> {
	const rawTags = remote ? await fetchRemoteTags(remoteName) : await listLocalTags();
	const tags: SemVer[] = [];

	for (const line of rawTags) {
		if (line.includes("^{}")) continue;

		let tag: string;
		if (remote) {
			const parts = line.split("\t");
			if (parts.length < 2) continue;
			tag = parts[1].replace("refs/tags/", "");
		} else {
			tag = line.trim();
		}

		const sv = parseSemVer(tag);
		if (sv && isStableOfficial(sv)) {
			tags.push(sv);
		}
	}

	return sortSemVer(tags);
}

async function getRemoteLocalizedTags(remoteName: string, suffix: string): Promise<SemVer[]> {
	const rawTags = await fetchRemoteTags(remoteName);
	const tags: SemVer[] = [];

	for (const line of rawTags) {
		if (line.includes("^{}")) continue;
		const parts = line.split("\t");
		if (parts.length < 2) continue;
		const tag = parts[1].replace("refs/tags/", "");
		const sv = parseLocalizedTag(tag, suffix);
		if (sv && isStableLocalized(sv, suffix)) {
			tags.push(sv);
		}
	}

	return sortSemVer(tags);
}

async function getLocalizedTags(remoteName: string, remote: boolean, suffix: string): Promise<SemVer[]> {
	const tags: SemVer[] = [];

	if (remote) {
		const remoteTags = await getRemoteLocalizedTags(remoteName, suffix);
		for (const sv of remoteTags) {
			if (isStableLocalized(sv, suffix)) {
				tags.push(sv);
			}
		}
	} else {
		const rawTags = await listLocalTags();
		for (const raw of rawTags) {
			const trimmed = raw.trim();
			const sv = parseLocalizedTag(trimmed, suffix);
			if (sv && isStableLocalized(sv, suffix)) {
				tags.push(sv);
			}
		}
	}

	return sortSemVer(tags);
}

function buildSuggested(config: ReleaseConfig, result: StatusResult): StatusResult {
	if (result.latestOfficial && !result.latestLocalized) {
		const official = result.latestOfficial;
		result.suggested = {
			prepare: `bun run i18n:prepare -- ${official}`,
			finish: `bun run i18n:finish -- ${official}`,
			verify: "bun run i18n:verify",
		};
	} else if (result.xyReleaseDue && result.latestOfficial && result.latestLocalized) {
		const official = result.latestOfficial;
		const localized = result.latestLocalized;
		const version = official.slice(1);
		const prevVersion = localized.replace(config.localizedTagSuffix, "");
		const branch = config.branchPattern.replace("{version}", version);
		result.suggested = {
			prepare: `bun run i18n:prepare -- ${official} --from ${prevVersion} --from-zh ${localized}`,
			finish: `bun run i18n:finish -- ${official}`,
			verify: "bun run i18n:verify",
			publish: `git push origin ${branch} && git tag -a ${official}${config.localizedTagSuffix} -m "${official}${config.localizedTagSuffix}" && git push origin ${official}${config.localizedTagSuffix} && gh release create ${official}${config.localizedTagSuffix} --repo ${config.github.repo} --title "${official}${config.localizedTagSuffix}" --notes-file docs/local/RELEASE-${official}${config.localizedTagSuffix}.md`,
		};
	} else if (result.patchPending) {
		result.suggested = {
			verify: "bun run i18n:verify",
		};
		result.note = "Z patch changes pending. They will be folded into the next X.Y alignment.";
	}
	return result;
}

function computeStatus(config: ReleaseConfig, officialTags: SemVer[], localizedTags: SemVer[]): StatusResult {
	const latestOfficial = officialTags.length > 0 ? officialTags[officialTags.length - 1].raw : null;
	const latestLocalized = localizedTags.length > 0 ? localizedTags[localizedTags.length - 1].raw : null;

	let xyReleaseDue = false;
	let patchPending = false;

	if (latestOfficial && latestLocalized) {
		const officialSv = parseSemVer(latestOfficial)!;
		const localizedSv = parseLocalizedTag(latestLocalized, config.localizedTagSuffix)!;

		if (officialSv.major !== localizedSv.major || officialSv.minor !== localizedSv.minor) {
			xyReleaseDue = true;
		} else if (officialSv.patch > localizedSv.patch) {
			patchPending = true;
		}
	} else if (latestOfficial && !latestLocalized) {
		xyReleaseDue = true;
	}

	const result: StatusResult = {
		latestOfficial,
		latestLocalized,
		xyReleaseDue,
		patchPending,
		suggested: {},
		officialTags: officialTags.map(sv => sv.raw),
		localizedTags: localizedTags.map(sv => sv.raw),
	};

	return buildSuggested(config, result);
}

function formatHuman(result: StatusResult, _config: ReleaseConfig): string {
	const lines: string[] = [];

	lines.push("=== OMP i18n Status ===");
	lines.push(`Latest official:   ${result.latestOfficial ?? "(none)"}`);
	lines.push(`Latest localized:  ${result.latestLocalized ?? "(none)"}`);
	lines.push(`X.Y release due:   ${result.xyReleaseDue ? "YES" : "NO"}`);
	lines.push(`Patch pending:     ${result.patchPending ? "YES" : "NO"}`);

	if (result.note) {
		lines.push(`Note:              ${result.note}`);
	}

	lines.push("");
	lines.push("Suggested commands:");

	if (result.suggested.prepare) {
		lines.push(`  prepare: ${result.suggested.prepare}`);
	}
	if (result.suggested.finish) {
		lines.push(`  finish:  ${result.suggested.finish}`);
	}
	if (result.suggested.verify) {
		lines.push(`  verify:  ${result.suggested.verify}`);
	}
	if (result.suggested.publish) {
		lines.push(`  publish: ${result.suggested.publish}`);
	}

	if (!result.suggested.prepare && !result.suggested.verify) {
		lines.push("  (up to date)");
	}

	lines.push("");
	lines.push(
		`Official tags (${result.officialTags.length}): ${result.officialTags.slice(-5).join(", ")}${result.officialTags.length > 5 ? " ..." : ""}`,
	);
	lines.push(
		`Localized tags (${result.localizedTags.length}): ${result.localizedTags.slice(-5).join(", ")}${result.localizedTags.length > 5 ? " ..." : ""}`,
	);

	return `${lines.join("\n")}\n`;
}

function usage(): never {
	console.error(`Usage:
  bun run i18n:status [--remote] [--json]

Options:
  --remote  Check upstream remote instead of local tags (requires network)
  --json    Output machine-readable JSON to stdout
`);
	process.exit(2);
}

async function main(): Promise<void> {
	const argv = Bun.argv.slice(2);
	let remote = false;
	let json = false;

	for (const arg of argv) {
		if (arg === "--remote") {
			remote = true;
		} else if (arg === "--json") {
			json = true;
		} else {
			usage();
		}
	}

	const configPath = path.resolve(process.cwd(), "i18n.release.json");
	const config: ReleaseConfig = JSON.parse(await Bun.file(configPath).text());

	const upstreamRemote = config.remotes.upstream;
	const originRemote = config.remotes.origin;

	let officialTags: SemVer[];
	let localizedTags: SemVer[];

	try {
		if (remote) {
			officialTags = await getOfficialTags(upstreamRemote, true);
			localizedTags = await getLocalizedTags(originRemote, true, config.localizedTagSuffix);
		} else {
			officialTags = await getOfficialTags("", false);
			localizedTags = await getLocalizedTags("", false, config.localizedTagSuffix);
		}
	} catch (error) {
		console.error("BLOCKED: network", error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
		return;
	}

	const result = computeStatus(config, officialTags, localizedTags);

	if (json) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} else {
		process.stdout.write(formatHuman(result, config));
	}
}

try {
	await main();
} catch (error) {
	console.error(`i18n:status failed: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
