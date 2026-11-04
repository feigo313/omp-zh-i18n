import { describe, expect, it } from "bun:test";

import {
	getLatestLocalizedRelease,
	isLocalizedVersion,
	LOCALIZED_RELEASE_REPO,
	localizedReleaseApiUrl,
	type GhRunner,
	type LocalizedRelease,
} from "@oh-my-pi/pi-coding-agent/cli/localized-release";
import { compareVersions } from "@oh-my-pi/pi-utils";

/** GitHub answers shaped like `feigo313/omp-zh-i18n` releases. */
function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		...init,
		headers: { "Content-Type": "application/json", ...init?.headers },
	});
}

function httpAnswer(body: unknown, init?: ResponseInit) {
	return async () => jsonResponse(body, init);
}

/** A transport failure of the kind a MITM'd or unverifiable chain raises. */
function httpFails(message: string) {
	return async () => {
		throw new TypeError(message);
	};
}

const ghAnswer =
	(body: unknown): GhRunner =>
	async () => ({ code: 0, stdout: JSON.stringify(body) });
const ghUnavailable: GhRunner = async () => ({ code: 1, stdout: "" });

/** Run the check with the `gh` leg pinned off, so only the injected HTTP answer can win. */
function checkOverHttp(
	fetchImpl: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
): Promise<LocalizedRelease> {
	return getLatestLocalizedRelease({ fetchImpl, gh: ghUnavailable });
}

const RELEASE_V18_17 = { tag_name: "v18.17.0-zh", html_url: "https://github.com/x/releases/tag/v18.17.0-zh" };

describe("isLocalizedVersion", () => {
	it("recognizes only the localized prerelease suffix", () => {
		expect(isLocalizedVersion("18.16.0-zh")).toBe(true);
		expect(isLocalizedVersion("18.16.0-zh.1")).toBe(true);
		expect(isLocalizedVersion("18.16.0")).toBe(false);
		expect(isLocalizedVersion("18.16.0-zhz")).toBe(false);
		expect(isLocalizedVersion("18.17.0-canary.1")).toBe(false);
	});
});

describe("getLatestLocalizedRelease", () => {
	it("asks the fork's releases, not the official feeds", async () => {
		const requested: string[] = [];
		await getLatestLocalizedRelease({
			fetchImpl: async url => {
				requested.push(String(url));
				return jsonResponse(RELEASE_V18_17);
			},
			gh: ghUnavailable,
		});
		expect(requested).toEqual([`https://api.github.com/repos/${LOCALIZED_RELEASE_REPO}/releases/latest`]);
		expect(localizedReleaseApiUrl()).toBe(requested[0]);
		expect(requested[0]).not.toContain("build.stencil.so");
	});

	it("reports a newer localized tag as newer than the installed one", async () => {
		const release = await checkOverHttp(httpAnswer(RELEASE_V18_17));
		expect(release.tag).toBe("v18.17.0-zh");
		expect(release.version).toBe("18.17.0-zh");
		expect(release.url).toBe("https://github.com/x/releases/tag/v18.17.0-zh");
		expect(compareVersions(release.version, "18.16.0-zh")).toBeGreaterThan(0);
	});

	it("keeps an older localized tag from looking like an update", async () => {
		const release = await checkOverHttp(
			httpAnswer({ tag_name: "v18.12.6-zh", html_url: "https://github.com/x/releases/tag/v18.12.6-zh" }),
		);
		expect(compareVersions(release.version, "18.16.0-zh")).toBeLessThan(0);
	});

	it("selects the asset built for this host", async () => {
		const release = await checkOverHttp(
			httpAnswer({
				...RELEASE_V18_17,
				assets: [
					{ name: "checksums.txt", browser_download_url: "https://example.invalid/checksums" },
					{ name: "omp-darwin-arm64", browser_download_url: "https://example.invalid/darwin" },
					{ name: "omp-linux-x86_64", browser_download_url: "https://example.invalid/linux" },
					{ name: "omp-windows-x64.exe", browser_download_url: "https://example.invalid/windows" },
				],
			}),
		);
		const osToken =
			process.platform === "win32" ? "omp-windows" : process.platform === "darwin" ? "omp-darwin" : "omp-linux";
		expect(release.assetName?.startsWith(osToken)).toBe(true);
		if (process.platform === "win32") {
			expect(release.assetName).toBe("omp-windows-x64.exe");
			expect(release.assetUrl).toBe("https://example.invalid/windows");
		}
	});

	it("falls back to the release page when no host asset exists", async () => {
		const release = await checkOverHttp(
			httpAnswer({
				...RELEASE_V18_17,
				assets: [{ name: "SOURCE_CODE.zip", browser_download_url: "https://example.invalid/src" }],
			}),
		);
		expect(release.assetName).toBeUndefined();
		expect(release.assetUrl).toBeUndefined();
		expect(release.url).toBe("https://github.com/x/releases/tag/v18.17.0-zh");
	});

	it("takes the gh answer when the HTTP transport cannot verify GitHub", async () => {
		// This box's path to api.github.com presents a chain Bun's bundled CA store
		// rejects; `gh` (system trust store, authenticated) still answers, and the
		// check must not turn into a startup failure or a wrong "up to date".
		const release = await getLatestLocalizedRelease({
			fetchImpl: httpFails("unable to verify the first certificate"),
			gh: ghAnswer(RELEASE_V18_17),
		});
		expect(release.version).toBe("18.17.0-zh");
	});

	it("answers from gh and cancels the stalled HTTP leg", async () => {
		// The legs race, and the loser must actually stop: a stalled HTTP path
		// (this box, or a black-hole proxy) may not gate the answer behind its
		// timeout, nor keep the process alive after the answer arrived.
		let aborted = false;
		const stalling = (_input: string | URL | Request, init?: RequestInit) => {
			const { promise, reject } = Promise.withResolvers<Response>();
			init?.signal?.addEventListener("abort", () => {
				aborted = true;
				reject(new Error("aborted"));
			});
			return promise;
		};
		const release = await getLatestLocalizedRelease({
			fetchImpl: stalling,
			timeoutMs: 60_000,
			gh: ghAnswer(RELEASE_V18_17),
		});
		expect(release.version).toBe("18.17.0-zh");
		expect(aborted).toBe(true);
	});

	it("takes the HTTP answer when the gh CLI is missing", async () => {
		const release = await getLatestLocalizedRelease({
			fetchImpl: httpAnswer(RELEASE_V18_17),
			gh: async () => {
				throw new Error("spawn gh ENOENT");
			},
		});
		expect(release.version).toBe("18.17.0-zh");
	});

	it("names both transports when neither answers", async () => {
		await expect(
			getLatestLocalizedRelease({ fetchImpl: httpFails("self-signed certificate in chain"), gh: ghUnavailable }),
		).rejects.toThrow(/api\.github\.com.*gh api/s);
	});

	it("carries gh's own explanation into the failure", async () => {
		// `gh api` says why it failed on stderr; the check must not reduce that to
		// "exit 1", which is what a user would otherwise have to debug from.
		await expect(
			getLatestLocalizedRelease({
				fetchImpl: httpAnswer({ message: "API rate limit exceeded" }, { status: 403 }),
				gh: async () => ({ code: 1, stdout: "", error: "please run: gh auth login" }),
			}),
		).rejects.toThrow(/exit 1: please run: gh auth login/);
	});

	it("refuses an answer that is not a usable localized release", async () => {
		await expect(checkOverHttp(httpAnswer({ html_url: "https://github.com/x" }))).rejects.toThrow(/tag_name/);

		// A tag without the localized suffix (an official release reaching this
		// feed by mistake) must never be offered as this build's update.
		await expect(checkOverHttp(httpAnswer({ tag_name: "v18.17.0" }))).rejects.toThrow(/localized/);

		await expect(
			getLatestLocalizedRelease({
				fetchImpl: httpFails("socket hang up"),
				gh: ghAnswer({ tag_name: "not-a-release" }),
			}),
		).rejects.toThrow(/tag_name/);
	});
});
