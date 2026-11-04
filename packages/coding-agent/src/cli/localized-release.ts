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

/** GitHub repository publishing the localized releases. */
export const LOCALIZED_RELEASE_REPO = "feigo313/omp-zh-i18n";

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

/** Runs `gh <args>` under a deadline. Test/DI seam. */
export type GhRunner = (args: readonly string[], timeoutMs: number) => Promise<GhResult>;

/** Exit code reported when `gh` outlives the check's budget (124, as timeout(1) does). */
const GH_TIMEOUT_CODE = 124;

async function runGh(args: readonly string[], timeoutMs: number): Promise<GhResult> {
	const proc = Bun.spawn(["gh", ...args], { stdout: "pipe", stderr: "pipe" });
	// The startup check is awaited before the TUI settles, so a `gh` that hangs —
	// an auth prompt, a stalled network path — must not stall the launch.
	const outcome = await Promise.race([
		proc.exited.then(code => ({ code, timedOut: false })),
		Bun.sleep(timeoutMs).then(() => ({ code: GH_TIMEOUT_CODE, timedOut: true })),
	]);
	if (outcome.timedOut) proc.kill();
	const stdout = await new Response(proc.stdout).text();
	// `gh api` explains itself on stderr; without it a failure is just "exit 1".
	const firstStderrLine = (await new Response(proc.stderr).text()).trim().split("\n")[0];
	return {
		code: outcome.code,
		stdout,
		error: outcome.timedOut ? `timed out after ${timeoutMs}ms` : firstStderrLine || undefined,
	};
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
 * The fork's newest localized release, read over HTTP and, when that transport
 * fails (TLS the bundled CA store will not verify, a proxy, a 403 rate limit),
 * through the `gh` CLI. Throws naming both failures when neither answers.
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
	try {
		// The shim is per call site (no global fetch patch), so a plain `fetch`
		// here would ignore NODE_EXTRA_CA_CERTS on a TLS-intercepting network.
		const response = await (options.fetchImpl ?? wrapFetchForExtraCa(fetch))(localizedReleaseApiUrl(repo), {
			headers: { Accept: "application/vnd.github+json", "User-Agent": USER_AGENT },
			signal: withTimeoutSignal(budget),
		});
		if (response.ok) return parseLocalizedRelease(await response.json(), repo);
		failures.push(`api.github.com: HTTP ${response.status} ${response.statusText}`);
	} catch (err) {
		failures.push(`api.github.com: ${(err as Error).message}`);
	}
	try {
		const gh = await (options.gh ?? runGh)(["api", `repos/${repo}/releases/latest`], budget);
		if (gh.code === 0) return parseLocalizedRelease(JSON.parse(gh.stdout), repo);
		failures.push(`gh api: exit ${gh.code}${gh.error ? `: ${gh.error}` : ""}`);
	} catch (err) {
		failures.push(`gh api: ${(err as Error).message}`);
	}
	throw new Error(`Could not read ${repo} releases — ${failures.join("; ")}`);
}
