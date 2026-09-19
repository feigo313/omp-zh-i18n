import * as fs from "node:fs";
import { loadNative } from "./loader-state.js";

let native;
function api() {
	native ??= loadNative();
	return native;
}
function vcsError(code, message) {
	const error = new Error(message);
	error.name = "VcsError";
	error.code = code;
	error.exitCode = 1;
	error.stdout = "";
	error.stderr = message;
	return error;
}

/**
 * Resolve a native VCS export. Staged JS and the prebuilt `.node` addon can
 * drift (e.g. v18 wrapper on a v17 binary): missing exports must not throw a
 * raw TypeError out of session switch / status-line paths.
 */
function nativeFn(name) {
	const fn = api()[name];
	return typeof fn === "function" ? fn : undefined;
}

function requireNativeFn(name) {
	const fn = nativeFn(name);
	if (!fn) {
		throw vcsError("NativeUnavailable", `native binding \`${name}\` is unavailable (rebuild @oh-my-pi/pi-natives)`);
	}
	return fn;
}

/**
 * True when `error` is a native VCS failure. The native layer constructs these
 * on the JS thread as real `Error` objects with `name: "VcsError"`, a
 * machine-readable `code`, and `exitCode`/`stdout`/`stderr` properties — an
 * `instanceof` check is impossible for foreign-constructed errors, so identity
 * rides on `name`.
 */
export function isVcsError(error) {
	return error instanceof Error && error.name === "VcsError";
}

/** True when a cherry-pick failed because the commit is already applied. */
export function isEmptyCherryPick(error) {
	return isVcsError(error) && error.code === "EmptyCherryPick";
}

/** Discover the git repository containing `dir`; `null` outside any checkout. */
export function git(dir) {
	const fn = nativeFn("vcsGitDiscover");
	if (!fn) return null;
	return fn(dir);
}
/** Discover the repository owning `dir`; `null` outside any repository. */
export function repo(dir) {
	const fn = nativeFn("vcsDiscover");
	if (!fn) return null;
	return fn(dir);
}

/** Like {@link repo}, but equal-root jj+git ties prefer Jujutsu for display. Git-safe automation must keep using {@link repo}. */
export function repoForDisplay(dir) {
	const fn = nativeFn("vcsDiscoverForDisplay");
	if (!fn) return null;
	return fn(dir);
}

/** Like {@link repo}, asserting any requested backend capabilities. */
export function require(dir, ...features) {
	const discovered = repo(dir);
	if (!discovered) throw vcsError("NotARepository", `not a repository: ${dir}`);
	for (const feature of features) {
		if (!discovered.supports(feature)) {
			throw vcsError(
				"Unsupported",
				`\`${feature}\` is not supported on a ${discovered.kind()} repository`,
			);
		}
	}
	return discovered;
}

/** Like {@link git}, but throws a `NotARepository` VcsError. */
export function requireGit(dir) {
	const repo = git(dir);
	if (!repo) {
		throw vcsError("NotARepository", `not a repository: ${dir}`);
	}
	return repo;
}

/** Repository metadata only (cheap fs walk) — for synchronous render paths. */
export function gitInfo(dir) {
	const fn = nativeFn("vcsGitRepoInfo");
	if (!fn) return null;
	return fn(dir);
}

/** Discover the Jujutsu workspace containing `dir`; `null` when absent. */
export function jj(dir) {
	const fn = nativeFn("vcsJjDiscover");
	if (!fn) return null;
	return fn(dir);
}

/** Whether jj is the nearest VCS ancestor, making git automation unsafe. */
export function isPureJj(dir) {
	const fn = nativeFn("vcsIsPureJj");
	if (!fn) return false;
	return fn(dir);
}

/** Clone a repository (git CLI under the hood for credential parity). */
export function clone(url, target, options = {}, signal) {
	return requireNativeFn("vcsGitClone")(url, target, options, signal);
}

/** Sever a copied working tree from shared git metadata. */
export function detachGitDir(worktreeRoot, sourceCommonDir, signal) {
	return requireNativeFn("vcsDetachGitDir")(worktreeRoot, sourceCommonDir, signal);
}

/** Join patch fragments, preserving each part's trailing newline. */
export function joinPatches(parts) {
	return requireNativeFn("vcsJoinPatches")(parts);
}

/** Validate hunk selections against a raw diff. */
export function validateHunkSelections(rawDiff, selections) {
	return requireNativeFn("vcsValidateHunkSelections")(rawDiff, selections);
}

/** Stat-poll interval for {@link watch}. */
export const HEAD_WATCH_INTERVAL_MS = 1000;

/**
 * Watch a repository for head changes; returns a disposer.
 *
 * Stat-polls via `fs.watchFile` instead of `fs.watch`: backends may atomically
 * replace the watched entry, permanently silencing inotify-backed watchers.
 */
export function watch(repo, onChange, intervalMs = HEAD_WATCH_INTERVAL_MS) {
	const target = repo.watchTarget();
	const listener = (curr, prev) => {
		if (curr.mtimeMs !== prev.mtimeMs || curr.ino !== prev.ino || curr.size !== prev.size) onChange();
	};
	fs.watchFile(target, { interval: intervalMs }, listener).unref();
	return () => fs.unwatchFile(target, listener);
}
