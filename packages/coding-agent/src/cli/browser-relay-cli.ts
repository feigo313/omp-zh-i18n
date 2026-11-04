/**
 * `omp browser-relay` implementation: serve the local CDP relay and install
 * its Chrome extension. Standalone CLI command — console output here is
 * intentional user-facing output.
 */
import * as path from "node:path";
import { VERSION } from "@oh-my-pi/pi-utils/dirs";
import { probeRelayServer } from "../tools/browser/relay/daemon";
import { defaultRelayExtensionDir, writeRelayExtension } from "../tools/browser/relay/extension-files";
import { DEFAULT_RELAY_URL } from "../tools/browser/relay/kind";
import { type RelayServer, startRelayServer } from "../tools/browser/relay/server";
import { t } from "../i18n";

export const BROWSER_RELAY_ACTIONS = ["serve", "install"] as const;
export type BrowserRelayAction = (typeof BROWSER_RELAY_ACTIONS)[number];

export interface BrowserRelayCommandArgs {
	action: BrowserRelayAction;
	port: number;
	token?: string;
	/** Install target directory; defaults to ~/.omp/browser-relay/extension. */
	dir?: string;
	/** Gather tabs the agent actively drives into an 'omp' Chrome tab group (default true). */
	group?: boolean;
	verbose?: boolean;
}

/** Default port of the relay endpoint (kept in sync with DEFAULT_RELAY_URL). */
export const DEFAULT_RELAY_PORT = Number(new URL(DEFAULT_RELAY_URL).port);

export async function runBrowserRelayCommand(args: BrowserRelayCommandArgs): Promise<void> {
	if (args.action === "install") {
		await runInstall(args.dir);
		return;
	}
	await runServe(args);
}

async function runInstall(dirOverride: string | undefined): Promise<void> {
	const dir = dirOverride ? path.resolve(dirOverride) : defaultRelayExtensionDir();
	await writeRelayExtension(dir, VERSION);
	console.log(t("cli.browserRelay.installed", "Installed the OMP Browser Relay extension to {dir}", { dir }));
	console.log("");
	console.log(t("cli.browserRelay.finishSetup", "Finish setup in Chrome:"));
	console.log(t("cli.browserRelay.step1", "  1. Open chrome://extensions and enable Developer mode."));
	console.log(t("cli.browserRelay.step2", '  2. Click "Load unpacked" and select: {dir}', { dir }));
	console.log(t("cli.browserRelay.step3", "  3. Enable the mode:  omp config set browser.relay true"));
	console.log("");
	console.log(
		t("cli.browserRelay.autoStart", "omp starts the relay automatically when the browser prelude needs it;"),
	);
	console.log(t("cli.browserRelay.manualStart", "run `omp browser-relay` yourself only for --token or --no-group."));
	console.log(t("cli.browserRelay.badge", "The extension badge shows 'on' once it reaches a relay."));
	if (!dirOverride) console.log("Newer omp versions update the extension in this folder and reload it on their own.");
	console.log(
		t(
			"cli.browserRelay.clearErrors",
			"Old connection-refused entries in chrome://extensions > Errors may persist after reconnect; use Clear all.",
		),
	);
}

async function runServe(args: BrowserRelayCommandArgs): Promise<void> {
	const log = args.verbose
		? (message: string, data?: Record<string, unknown>) => {
				console.error(`[relay] ${message}${data ? ` ${JSON.stringify(data)}` : ""}`);
			}
		: undefined;
	let relay: RelayServer;
	try {
		relay = startRelayServer({ port: args.port, token: args.token, group: args.group !== false, log });
	} catch (err) {
		// The port is machine-global while relays can be started by any project's
		// broker (or by hand): losing the bind to a live relay is success.
		if (err instanceof Error && "code" in err && err.code === "EADDRINUSE") {
			if (await probeRelayServer(`http://127.0.0.1:${args.port}`)) {
				console.log(
					t(
						"cli.browserRelay.alreadyRunning",
						"omp browser relay already running on http://127.0.0.1:{port}; nothing to do.",
						{ port: args.port },
					),
				);
				return;
			}
			console.error(
				t("cli.browserRelay.portInUse", "Port {port} is in use by something that is not an omp browser relay.", {
					port: args.port,
				}),
			);
			process.exit(1);
		}
		throw err;
	}

	console.log(
		t("cli.browserRelay.listening", "omp browser relay listening on http://127.0.0.1:{port}", { port: args.port }),
	);
	console.log(
		t("cli.browserRelay.endpoint", "  extension endpoint  ws://127.0.0.1:{port}/ext{token}", {
			port: args.port,
			token: args.token ? "?token=***" : "",
		}),
	);
	if (args.port === DEFAULT_RELAY_PORT) {
		console.log(t("cli.browserRelay.enable", "  enable with         omp config set browser.relay true"));
	} else {
		console.log(
			t(
				"cli.browserRelay.enableUrl",
				"  enable with         omp config set browser.relay true && omp config set browser.relayUrl http://127.0.0.1:{port}",
				{ port: args.port },
			),
		);
	}
	console.log(
		t(
			"cli.browserRelay.waiting",
			"Waiting for the OMP Browser Relay extension to connect (omp browser-relay install)...",
		),
	);

	let announced = false;
	const readiness = setInterval(() => {
		if (relay.bridge.ready && !announced) {
			announced = true;
			console.log(
				t("cli.browserRelay.connected", "Extension connected. The omp browser prelude can now drive your tabs."),
			);
		} else if (!relay.bridge.ready && announced) {
			announced = false;
			console.log(t("cli.browserRelay.disconnected", "Extension disconnected; waiting for it to reconnect..."));
		}
	}, 500);

	const shutdown = () => {
		clearInterval(readiness);
		relay.stop();
		process.exit(0);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
	// Serve runs until SIGINT/SIGTERM; keep the process alive.
	await new Promise<never>(() => {});
}
