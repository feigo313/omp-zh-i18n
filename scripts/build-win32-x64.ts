import * as fs from "node:fs/promises";
import * as path from "node:path";
import { $ } from "bun";
import { createRequire } from "node:module";
import { compileCodingAgent } from "../packages/coding-agent/scripts/compile-binary";

const repoRoot = path.resolve(import.meta.dir, "..");
const entrypoint = path.join(repoRoot, "packages", "coding-agent", "src", "cli.ts");
const outfile = path.join(repoRoot, "packages", "coding-agent", "binaries", "omp-windows-x64.exe");
const transformersManifest = createRequire(import.meta.url)("@huggingface/transformers/package.json");
if (!transformersManifest?.version) throw new Error("transformers manifest missing");
const transformersVersion = transformersManifest.version;

await fs.mkdir(path.dirname(outfile), { recursive: true });

// Embed native addon for win32-x64 before compiling.
await $`bun run gen:native`.cwd(repoRoot).env({
	TARGET_PLATFORM: "win32",
	TARGET_ARCH: "x64",
});

await compileCodingAgent({
	repoRoot,
	entrypoint,
	outfile,
	transformersVersion,
	target: "bun-windows-x64",
	minifyIdentifiers: true,
});

const stat = await fs.stat(outfile);
console.log(`built: ${outfile} (${stat.size} bytes)`);
