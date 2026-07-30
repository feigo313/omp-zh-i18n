#!/usr/bin/env bun

import { createRequire } from "node:module";
import * as path from "node:path";
import { $ } from "bun";

interface CodingAgentPackage {
	version: string;
}

interface NativesPackage {
	version: string;
}

function parseArgs(argv: string[]): { binary?: string; full: boolean } {
	let binary: string | undefined;
	let full = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--full") {
			full = true;
			continue;
		}
		if (arg === "--binary") {
			binary = argv[++i];
			if (!binary) throw new Error("--binary requires a path");
			continue;
		}
		throw new Error(`Unknown option: ${arg}`);
	}
	return { binary, full };
}

async function runStep(label: string, args: readonly string[]): Promise<string> {
	console.log(`\n=== ${label} ===`);
	const result = await $`${args}`.quiet().nothrow();
	const output = result.text();
	if (output.trim()) process.stdout.write(output);
	if (result.exitCode !== 0) {
		throw new Error(`${label} failed with exit code ${result.exitCode}`);
	}
	return output;
}

async function runBinary(label: string, binary: string, args: readonly string[]): Promise<string> {
	console.log(`\n=== ${label} ===`);
	const result = await $`${[binary, ...args]}`.quiet().nothrow();
	const output = result.text();
	if (output.trim()) process.stdout.write(output);
	if (result.exitCode !== 0) {
		throw new Error(`${label} failed with exit code ${result.exitCode}`);
	}
	return output;
}

async function verifyNativeBindings(): Promise<void> {
	console.log("\n=== native binding probe ===");
	if (process.platform !== "win32") {
		console.log(`skipped on ${process.platform}`);
		return;
	}

	const nativePackage = (await Bun.file("packages/natives/package.json").json()) as NativesPackage;
	const nativePath = path.resolve("packages/natives/native/pi_natives.win32-x64-baseline.node");
	if (!(await Bun.file(nativePath).exists())) {
		throw new Error(`native binding not found: ${nativePath}`);
	}

	const loadNative = createRequire(import.meta.url);
	const bindings = loadNative(nativePath) as Record<string, unknown>;
	const sentinel = `__piNativesV${nativePackage.version.replace(/[^A-Za-z0-9]/g, "_")}`;
	if (typeof bindings[sentinel] !== "function") {
		throw new Error(`native sentinel missing: expected ${sentinel}`);
	}
	if (typeof bindings.DesktopSession !== "function") {
		throw new Error("native DesktopSession export missing");
	}
	console.log(`sentinel ${sentinel}: function`);
	console.log("DesktopSession: function");
}

async function main(): Promise<void> {
	const options = parseArgs(Bun.argv.slice(2));
	const packageData = (await Bun.file("packages/coding-agent/package.json").json()) as CodingAgentPackage;
	const expectedVersion = `omp/${packageData.version}`;

	await runStep("git diff check", ["git", "diff", "--check"]);
	await runStep("schema gate", ["bun", "packages/coding-agent/scripts/check-schema-gate.ts"]);
	await runStep("tool check", ["bun", "run", "check:tools"]);
	await verifyNativeBindings();

	const sourceVersion = await runStep("source version", ["bun", "packages/coding-agent/src/cli.ts", "--version"]);
	if (!sourceVersion.includes(expectedVersion)) {
		throw new Error(`source version mismatch: expected ${expectedVersion}`);
	}
	await runStep("source smoke-test", ["bun", "packages/coding-agent/src/cli.ts", "--smoke-test"]);

	if (options.full) {
		await runStep("coding-agent check", ["bun", "--cwd=packages/coding-agent", "run", "check"]);
		await runStep("full check", ["bun", "run", "check"]);
	}

	if (options.binary) {
		const binary = path.resolve(process.cwd(), options.binary);
		if (!(await Bun.file(binary).exists())) throw new Error(`binary not found: ${binary}`);
		const binaryVersion = await runBinary("binary version", binary, ["--version"]);
		if (!binaryVersion.includes(expectedVersion)) {
			throw new Error(`binary version mismatch: expected ${expectedVersion}`);
		}
		await runBinary("binary smoke-test", binary, ["--smoke-test"]);
	}

	await runStep("status snapshot", ["git", "status", "--short"]);
	console.log("\nALL I18N GATES PASSED");
}

try {
	await main();
} catch (error) {
	console.error(`\nI18N GATES FAILED: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
