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

interface CleanupCandidate {
	branch: string;
	worktree: string | null;
	merged: boolean;
	dirty: boolean;
	forceRequired: boolean;
}

interface CleanupIssue {
	branch: string;
	worktree: string | null;
	reason: "dirty" | "unmerged" | "head";
}

interface CleanupPlan {
	keep: string[];
	candidates: CleanupCandidate[];
	removable: CleanupCandidate[];
	blocked: CleanupIssue[];
	unmergedForceable: CleanupCandidate[];
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

async function loadConfig(): Promise<ReleaseConfig> {
	const configPath = path.resolve(process.cwd(), "i18n.release.json");
	const text = await Bun.file(configPath).text();
	return JSON.parse(text) as ReleaseConfig;
}

function buildBranchRegex(pattern: string): RegExp {
	const regex = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace("\\{version\\}", "(.+)");
	return new RegExp(`^${regex}$`);
}

async function listLocalBranches(): Promise<string[]> {
	const output = await gitText("", ["branch", "--list"]);
	return output
		.split(/\r?\n/)
		.map(line => line.replace(/^\*\s*/, "").trim())
		.filter(Boolean);
}

async function getCurrentBranch(): Promise<string | null> {
	const output = await gitText("", ["rev-parse", "--abbrev-ref", "HEAD"]);
	const trimmed = output.trim();
	return trimmed === "HEAD" ? null : trimmed;
}

async function listWorktrees(): Promise<Map<string, string>> {
	const output = await gitText("", ["worktree", "list", "--porcelain"]);
	const map = new Map<string, string>();
	const blocks = output.split("\n\n");

	for (const block of blocks) {
		const branchMatch = block.match(/^branch\s+(.+)$/m);
		const pathMatch = block.match(/^worktree\s+(.+)$/m);
		if (branchMatch && pathMatch) {
			const branch = branchMatch[1].replace("refs/heads/", "");
			const worktreePath = pathMatch[1].trim();
			if (branch && worktreePath) {
				map.set(branch, worktreePath);
			}
		}
	}

	return map;
}

async function isWorktreeDirty(worktreePath: string): Promise<boolean> {
	try {
		const output = await gitText("", ["-C", worktreePath, "status", "--porcelain", "--untracked-files=normal"]);
		return output.trim().length > 0;
	} catch {
		return true;
	}
}

async function isBranchMerged(branch: string): Promise<boolean> {
	const result = await git("", ["merge-base", "--is-ancestor", branch, "HEAD"]).quiet().nothrow();
	await result.text();
	return result.exitCode === 0;
}

function normalizeVersion(raw: string): string {
	const trimmed = raw.trim();
	if (!/^\d+(\.\d+){1,2}$/.test(trimmed)) {
		throw new Error(`Invalid version: ${raw} (expected X.Y or X.Y.Z)`);
	}
	return trimmed;
}

async function buildPlan(config: ReleaseConfig, keepVersions: string[], force: boolean): Promise<CleanupPlan> {
	const branchRegex = buildBranchRegex(config.branchPattern);
	const localBranches = await listLocalBranches();
	const worktreeMap = await listWorktrees();
	const currentBranch = await getCurrentBranch();

	const normalized = keepVersions.map(v => normalizeVersion(v.startsWith("v") ? v.slice(1) : v));
	const keepBranches = normalized.map(version => config.branchPattern.replace("{version}", version));
	const matchingBranches = localBranches.filter(branch => branchRegex.test(branch));

	const candidates: CleanupCandidate[] = [];
	const issues: CleanupIssue[] = [];

	for (const branch of matchingBranches) {
		if (keepBranches.includes(branch)) {
			continue;
		}

		const worktree = worktreeMap.get(branch) ?? null;
		const merged = await isBranchMerged(branch);

		if (branch === currentBranch) {
			issues.push({ branch, worktree, reason: "head" });
			continue;
		}

		if (worktree) {
			const dirty = await isWorktreeDirty(worktree);
			if (dirty) {
				issues.push({ branch, worktree, reason: "dirty" });
				continue;
			}
			candidates.push({ branch, worktree, merged, dirty: false, forceRequired: !merged });
		} else {
			candidates.push({ branch, worktree: null, merged, dirty: false, forceRequired: !merged });
		}
	}

	const removable = candidates.filter(c => c.merged);
	const unmergedClean = candidates.filter(c => !c.merged && !c.dirty);
	const unmergedForceable = force ? unmergedClean : [];
	const blocked = [
		...issues,
		...(force
			? []
			: unmergedClean.map(c => ({ branch: c.branch, worktree: c.worktree, reason: "unmerged" as const }))),
	];

	return {
		keep: keepBranches,
		candidates,
		removable,
		blocked,
		unmergedForceable,
	};
}

function usage(): never {
	console.error(`Usage:
  bun run i18n:cleanup [--keep vX.Y.Z | --keep X.Y.Z] [--apply] [--force] [--json]

Options:
  --keep vX.Y.Z  Keep the specified localized release branch (repeatable)
  --apply        Actually remove eligible branches/worktrees
  --force        Allow removal of clean but unmerged branches with branch -D
  --json         Output machine-readable JSON
`);
	process.exit(2);
}

async function main(): Promise<void> {
	const argv = Bun.argv.slice(2);
	const keepVersions: string[] = [];
	let apply = false;
	let force = false;
	let json = false;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--apply") {
			apply = true;
		} else if (arg === "--force") {
			force = true;
		} else if (arg === "--json") {
			json = true;
		} else if (arg.startsWith("--keep=")) {
			keepVersions.push(arg.slice("--keep=".length));
		} else if (arg === "--keep" && i + 1 < argv.length) {
			keepVersions.push(argv[++i]);
		} else {
			usage();
		}
	}

	if (keepVersions.length === 0) {
		console.error("Error: --keep vX.Y.Z or --keep X.Y.Z is required");
		usage();
	}

	const config = await loadConfig();
	const plan = await buildPlan(config, keepVersions, force);

	if (apply) {
		const removed: string[] = [];
		const errors: string[] = [];
		const appliedForce = force ? plan.unmergedForceable : [];

		for (const candidate of plan.removable) {
			if (candidate.worktree) {
				const removeResult = await git("", ["worktree", "remove", candidate.worktree]).quiet().nothrow();
				if (removeResult.exitCode === 0) {
					removed.push(`${candidate.branch} (worktree: ${candidate.worktree})`);
				} else {
					errors.push(`worktree remove ${candidate.worktree}: ${removeResult.text().trim()}`);
				}
			}

			const branchResult = await git("", ["branch", "-d", candidate.branch]).quiet().nothrow();
			if (branchResult.exitCode === 0) {
				removed.push(`${candidate.branch} (branch)`);
			} else {
				errors.push(`branch -d ${candidate.branch}: ${branchResult.text().trim()}`);
			}
		}

		for (const candidate of appliedForce) {
			if (candidate.worktree) {
				const removeResult = await git("", ["worktree", "remove", candidate.worktree]).quiet().nothrow();
				if (removeResult.exitCode === 0) {
					removed.push(`${candidate.branch} (worktree: ${candidate.worktree})`);
				} else {
					errors.push(`worktree remove ${candidate.worktree}: ${removeResult.text().trim()}`);
				}
			}

			const branchResult = await git("", ["branch", "-D", candidate.branch]).quiet().nothrow();
			if (branchResult.exitCode === 0) {
				removed.push(`${candidate.branch} (branch, force)`);
			} else {
				errors.push(`branch -D ${candidate.branch}: ${branchResult.text().trim()}`);
			}
		}

		const summary = {
			keep: plan.keep,
			removed,
			errors,
			force: appliedForce.length > 0,
		};

		if (json) {
			process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
		} else {
			console.log("=== i18n:cleanup applied ===");
			console.log(`Kept: ${plan.keep.join(", ")}`);
			console.log(`Removed: ${removed.length} item(s)`);
			for (const item of removed) {
				console.log(`  - ${item}`);
			}
			if (appliedForce.length > 0) {
				console.log(`Force-removed unmerged: ${appliedForce.length}`);
				for (const item of appliedForce) {
					console.log(`  - ${item.branch}`);
				}
			}
			if (errors.length > 0) {
				console.log(`Errors: ${errors.length}`);
				for (const error of errors) {
					console.log(`  ! ${error}`);
				}
			}
		}

		if (errors.length > 0) {
			process.exitCode = 1;
		}
		return;
	}

	if (json) {
		const output = {
			keep: plan.keep,
			removable: plan.removable.map(c => ({
				branch: c.branch,
				worktree: c.worktree,
				merged: c.merged,
				forceRequired: c.forceRequired,
			})),
			blocked: plan.blocked.map(b => ({
				branch: b.branch,
				worktree: b.worktree,
				reason: b.reason,
			})),
			unmergedForceable: force
				? plan.unmergedForceable.map(c => ({
						branch: c.branch,
						worktree: c.worktree,
						merged: c.merged,
					}))
				: [],
		};
		process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
	} else {
		console.log("=== i18n:cleanup preview ===");
		console.log(`Pattern: ${config.branchPattern}`);
		console.log(`Kept:    ${plan.keep.join(", ")}`);
		console.log("");

		if (plan.removable.length === 0 && plan.blocked.length === 0 && plan.unmergedForceable.length === 0) {
			console.log("No matching local adaptation branches found.");
			return;
		}

		if (plan.removable.length > 0) {
			console.log("Would remove:");
			for (const item of plan.removable) {
				const worktreeLabel = item.worktree ? ` (worktree: ${item.worktree})` : "";
				console.log(`  - ${item.branch}${worktreeLabel}`);
			}
		}

		if (plan.unmergedForceable.length > 0) {
			console.log("");
			console.log("Would remove with --force (unmerged, clean worktree):");
			for (const item of plan.unmergedForceable) {
				const worktreeLabel = item.worktree ? ` (worktree: ${item.worktree})` : "";
				console.log(`  - ${item.branch}${worktreeLabel}`);
			}
		}

		if (plan.blocked.length > 0) {
			console.log("");
			console.log("Blocked (not removed):");
			for (const item of plan.blocked) {
				const worktreeLabel = item.worktree ? ` [${item.worktree}]` : "";
				const reasonLabel =
					item.reason === "dirty" ? "dirty worktree" : item.reason === "head" ? "current HEAD" : "unmerged";
				console.log(`  ! ${item.branch}${worktreeLabel} - ${reasonLabel}`);
			}
		}

		console.log("");
		console.log(
			`Total: ${plan.removable.length} removable, ${plan.unmergedForceable.length} forceable, ${plan.blocked.length} blocked`,
		);
		console.log("");
		if (plan.unmergedForceable.length > 0) {
			console.log("Run with --apply --force to remove unmerged clean branches.");
		} else {
			console.log("Run with --apply to execute cleanup.");
		}
	}
}

try {
	await main();
} catch (error) {
	console.error(`i18n:cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
