/**
 * Update source for localized (`-zh`) builds.
 *
 * A localized build's version carries a semver prerelease suffix (`18.16.0-zh`).
 * The official feeds — the npm registry and Stencil's build service — only ever
 * serve the bare `X.Y.Z`, and semver ranks a release ABOVE its own prerelease,
 * so an `-zh` install that asks them reads the version it already runs as an
 * update and prompts forever. Worse, acting on that prompt would install the
 * English binary over the localization. Localized builds are published only to
 * this fork's GitHub releases, so they ask those instead, and they are never
 * self-replaced: the newest release is reported with its download page, and
 * installing it stays a deliberate act (download the asset, or align + rebuild).
 *
 * GitHub is read through Bun's `fetch` first, then through the `gh` CLI: Bun
 * ships its own CA bundle, and some hosts' path to GitHub presents a chain that
 * bundle will not verify, while `gh` uses the system trust store and is
 * authenticated (so the anonymous-API rate limit stops throttling the check).
 */
import { isRecord, USER_AGENT, wrapFetchForExtraCa } from "@oh-my-pi/pi-utils";
import { withTimeoutSignal } from "../utils/fetch-timeout";

/**
 * GitHub repository publishing the localized releases. Renaming this repo must
 * change this constant in the same commit as `i18n.release.json`'s
 * `github.repo` — it is compiled into the shipped binary, and an installed
 * build asks this slug for its update feed. A test pins the two together.
 */
export const LOCALIZED_RELEASE_REPO = "feigo313/oh-my-pi-zh";

/** The prerelease suffix every localized build carries. */
export const LOCALIZED_SUFFIX = "zh";

/** Startup update checks keep the short timeout the official check uses. */
const LOCALIZED_RELEASE_TIMEOUT_MS = 10_000;

/** `-zh`, and any localized hotfix stamp like `-zh.1`. */
const LOCALIZED_VERSION_RE = /-zh(?:\.[0-9A-Za-z-]+)*$/;

/** Whether `version` names a localized build rather than an official release. */
export function isLocalizedVersion(version: string): boolean {
	return LOCALIZED_VERSION_RE.test(version);
}

/** The newest published localized release. */
export interface LocalizedRelease {
	/** Release tag, e.g. `v18.17.0-zh`. */
	tag: string;
	/** Tag without the `v`, comparable with `VERSION`, e.g. `18.17.0-zh`. */
	version: string;
	/** Release page URL. */
	url: string;
	/** Asset matching this host, when the release publishes one. */
	assetName?: string;
	assetUrl?: string;
}

/** GitHub's endpoint for the newest non-draft, non-prerelease release. */
export function localizedReleaseApiUrl(repo: string = LOCALIZED_RELEASE_REPO): string {
	return `https://api.github.com/repos/${repo}/releases/latest`;
}

/** One `gh` leg: exit code, stdout, and the first stderr line when it failed. */
export type GhResult = { code: number; stdout: string; error?: string };

/** Runs `gh <args>` under a deadline and abort signal. Test/DI seam. */
export type GhRunner = (args: readonly string[], timeoutMs: number, signal?: AbortSignal) => Promise<GhResult>;

async function readGhResult(proc: Bun.Subprocess<"ignore", "pipe", "pipe">, code: number): Promise<GhResult> {
	const stdout = await new Response(proc.stdout).text();
	// `gh api` explains itself on stderr; without it a failure is just "exit 1".
	const firstStderrLine = (await new Response(proc.stderr).text()).trim().split("\n")[0];
	return { code, stdout, error: firstStderrLine || undefined };
}

/**
 * `gh <args>` bounded by a deadline and an optional abort. The startup check is
 * awaited before the TUI settles, so a `gh` that hangs — an auth prompt, a dead
 * network path — must not stall the launch, and a leg that already lost the
 * race must not hold the process open either.
 */
async function runGh(args: readonly string[], timeoutMs: number, signal?: AbortSignal): Promise<GhResult> {
	const proc = Bun.spawn(["gh", ...args], { stdout: "pipe", stderr: "pipe" });
	const { promise, resolve, reject } = Promise.withResolvers<GhResult>();
	const stop = (reason: string) => {
		proc.kill();
		reject(new Error(reason));
	};
	const timer = setTimeout(() => stop(`timed out after ${timeoutMs}ms`), timeoutMs);
	const onAbort = () => stop("cancelled: the other transport answered first");
	signal?.addEventListener("abort", onAbort, { once: true });
	proc.exited
		.then(async code => {
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
			resolve(await readGhResult(proc, code));
		})
		.catch((err: unknown) => {
			clearTimeout(timer);
			reject(err instanceof Error ? err : new Error(String(err)));
		});
	return promise;
}

/** Filename prefix of this platform's release asset (`omp-windows-x64.exe`). */
function hostAssetPrefix(): string {
	switch (process.platform) {
		case "win32":
			return "omp-windows";
		case "darwin":
			return "omp-darwin";
		default:
			return "omp-linux";
	}
}

function pickHostAsset(assets: readonly unknown[]): { name: string; url: string } | undefined {
	const prefix = hostAssetPrefix();
	const candidates = assets.filter(
		(asset): asset is Record<"name" | "browser_download_url", string> =>
			isRecord(asset) &&
			typeof asset.name === "string" &&
			asset.name.startsWith(prefix) &&
			typeof asset.browser_download_url === "string",
	);
	// The release names one asset per architecture; on Windows only `.exe` builds run.
	const exact = candidates.find(asset => (process.platform === "win32" ? asset.name.endsWith(".exe") : true));
	const chosen = exact ?? candidates[0];
	return chosen ? { name: chosen.name, url: chosen.browser_download_url } : undefined;
}

/** Validate one GitHub release answer as a localized release this build may use. */
function parseLocalizedRelease(answer: unknown, repo: string): LocalizedRelease {
	if (!isRecord(answer) || typeof answer.tag_name !== "string" || !answer.tag_name.startsWith("v")) {
		throw new Error(`Malformed release response from ${repo}: missing tag_name`);
	}
	const tag = answer.tag_name;
	const version = tag.slice(1);
	// A tag without the localized suffix (an official release reaching this feed
	// by mistake) must never be offered as this build's update.
	if (!isLocalizedVersion(version)) {
		throw new Error(`Release ${tag} is not a localized (-${LOCALIZED_SUFFIX}) build`);
	}
	const assets = Array.isArray(answer.assets) ? answer.assets : [];
	const asset = pickHostAsset(assets);
	return {
		tag,
		version,
		url: typeof answer.html_url === "string" ? answer.html_url : `https://github.com/${repo}/releases/latest`,
		assetName: asset?.name,
		assetUrl: asset?.url,
	};
}

/**
 * The fork's newest localized release, read over BOTH transports at once.
 * Queuing them would put the HTTP leg's whole budget in front of an answer the
 * `gh` CLI gives in a couple of seconds (this box's path to `api.github.com`
 * stalls rather than failing fast), and the check runs on every launch.
 * Whichever leg answers first wins; when both fail, the error names each.
 */
export async function getLatestLocalizedRelease(
	options: {
		timeoutMs?: number;
		repo?: string;
		/** Test seam for the HTTP leg; defaults to `wrapFetchForExtraCa(fetch)`. */
		fetchImpl?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
		/** Test seam for the `gh` leg; set to a failing runner to simulate no CLI. */
		gh?: GhRunner;
	} = {},
): Promise<LocalizedRelease> {
	const repo = options.repo ?? LOCALIZED_RELEASE_REPO;
	const budget = options.timeoutMs ?? LOCALIZED_RELEASE_TIMEOUT_MS;
	const failures: string[] = [];
	// One controller cancels whichever leg is still running once the other wins,
	// so a stalled transport cannot hold the CLI (or the launch) open.
	const cancel = new AbortController();
	const httpLeg = (async () => {
		// The shim is per call site (no global fetch patch), so a plain `fetch`
		// here would ignore NODE_EXTRA_CA_CERTS on a TLS-intercepting network.
		const response = await (options.fetchImpl ?? wrapFetchForExtraCa(fetch))(localizedReleaseApiUrl(repo), {
			headers: { Accept: "application/vnd.github+json", "User-Agent": USER_AGENT },
			signal: withTimeoutSignal(budget, cancel.signal),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
		return parseLocalizedRelease(await response.json(), repo);
	})().catch((err: unknown) => {
		// Stay rejected: `Promise.any` must keep waiting for the other leg.
		failures.push(`api.github.com: ${(err as Error).message}`);
		throw err;
	});
	const ghLeg = (async () => {
		const gh = await (options.gh ?? runGh)(["api", `repos/${repo}/releases/latest`], budget, cancel.signal);
		if (gh.code !== 0) throw new Error(`exit ${gh.code}${gh.error ? `: ${gh.error}` : ""}`);
		return parseLocalizedRelease(JSON.parse(gh.stdout), repo);
	})().catch((err: unknown) => {
		failures.push(`gh api: ${(err as Error).message}`);
		throw err;
	});
	try {
		return await Promise.any([httpLeg, ghLeg]);
	} catch {
		// Reaching a rejection means both legs failed, so `failures` holds both reasons.
		throw new Error(`Could not read ${repo} releases — ${failures.join("; ")}`);
	} finally {
		cancel.abort();
	}
}
