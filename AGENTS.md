# Development Rules

## This Fork (omp-zh-i18n)

| | |
|---|---|
| What | Chinese localization fork of Oh My Pi — not upstream `can1357/oh-my-pi` |
| Public | https://github.com/feigo313/omp-zh-i18n · branch `master` · also `gitee.com/atrix313/omp-zh-i18n` |
| Upstream remote | `upstream` → `https://github.com/can1357/oh-my-pi.git` |
| Current baseline | coding-agent **17.2.1-zh** (irregular upstream sync; X/Y change triggers a new zh release) |
| Primary work | `packages/coding-agent/src/i18n/lang/zh-*.json` + required en SoT / wiring (`interceptor.ts`, settings UI) |

**Defaults for agents**

- Do **not** start new i18n or release work unless the user asks.
- Prefer editing bundled `lang/zh-*.json` (+ explicitly requested en/wiring). Do not treat `~/.omp/lang` as the delivery path.
- Never `commit` / `push` / GitHub comment / open issues unless the user explicitly asks.
- Source strings stay English; translate at the UI boundary (`interceptUIString` / `i18n.t`).
- Brand names, model ids, `true`/`false` may remain English.

**Local-only files (`.git/info/exclude`, not `.gitignore`)**

These exist on this machine, are **not tracked**, and must not be force-added for release:

- `docs/local/` — worklogs, STATUS, audits
- `i18n.release.json` — overlay roots / release metadata
- `scripts/i18n/`, `.agents/`, `.reasonix/`, `.tools/`
- `.github/workflows/i18n-upstream-check.yml`

**Where to read next**

| Need | File |
|---|---|
| Session entry / Chinese collab norms | `CLAUDE.md` (tracked) |
| **Canonical** zh release process | `docs/local/I18N-RELEASE-WORKFLOW.md` (local-only SoT) |
| Historical status / worklogs | `docs/local/*` (archives; workflow file wins on conflict) |

Do not re-implement the release Gates here. Upstream `bun run release` is **not** the normal path for `vX.Y.Z-zh` builds.

## Default Context

This repo contains multiple packages, but **`packages/coding-agent/`** is the primary focus. Unless otherwise specified, assume work refers to this package.

**Terminology**: When the user says "agent" or asks "why is agent doing X", they mean the **coding-agent package implementation**, not you (the assistant). The coding-agent is a CLI tool — questions about its behavior refer to code in `packages/coding-agent/`, not your current session. i18n / 中文翻译 → `packages/coding-agent/src/i18n/`.

### Package Structure

| Package | Description |
| --- | --- |
| `packages/ai` | Multi-provider LLM client with streaming support |
| `packages/catalog` | Model catalog: bundled models.json, provider descriptors, model identity/classification |
| `packages/agent` | Agent runtime with tool calling and state management |
| `packages/coding-agent` | Main CLI application (primary focus) |
| `packages/tui` | Terminal UI library with differential rendering |
| `packages/natives` | Bindings for native text/image/grep operations |
| `packages/stats` | Local observability dashboard (`omp stats`) |
| `packages/utils` | Shared utilities (logger, streams, temp files) |
| `packages/wire` | Shared wire/protocol types |
| `packages/hashline` | Content-hash anchored edit format |
| `packages/mnemopi` | Memory backend package |
| `packages/snapcompact` | Snapshot/compaction helpers |
| `packages/collab-web` | Collab relay web UI + tool-view codegen (`gen:tool-views`) |
| `packages/metaharness` | Meta-harness tooling |
| `crates/pi-natives` | Rust crate for performance-critical text/grep ops |

**Catalog import convention**: code in this repo imports catalog *values* (bundled models, model-thinking helpers, identity, descriptors, model manager/cache) from `@oh-my-pi/pi-catalog/<module>` — never via `@oh-my-pi/pi-ai`. The pi-ai barrel re-exports only the model/effort *types* its own signatures use (`Model`, `Api`, `ThinkingConfig`, `Effort`, …); type-only imports of those from `@oh-my-pi/pi-ai` are fine.

### i18n wiring (fork-critical)

- Bundled files: `packages/coding-agent/src/i18n/lang/{en,zh}-*.json`.
- They are **statically imported** in `src/i18n/index.ts` and registered in `EMBEDDED_TRANSLATIONS` — a new lang JSON that is not imported there will not ship in the binary.
- Load order: bundled `lang/` first, then optional user overrides under `~/.omp/lang/`.
- UI boundary: `src/i18n/interceptor.ts` (`interceptUIString`, settings/command translators). Keep source English; do not sprinkle Chinese literals in components.
- Do **not** bulk-run extract/generate/translate scripts unless the user asks; edit keys by hand and keep en/zh key symmetry (no empty strings).

## GitHub

Unless user tells you exactly what to write:
- **Never comment on GitHub** (issues, PRs, discussions).
- **Never create issues on GitHub**.

## Code Quality

- No `any` unless absolutely necessary.
- **NEVER use `ReturnType<>`** — use the actual type name.
- **NEVER use inline imports** — no `await import()`, no `import("pkg").Type` in type positions, no dynamic type imports. Always top-level.
- Check `node_modules` for external API types instead of guessing.
- **Barrel exports**: prefer `export * from "./module"` over named re-exports, including `export type { ... } from`. In pure `index.ts` barrels, use star re-exports even for single-specifier cases. If stars create ambiguity, remove the redundant export path; do not keep duplicates.
- **Class privacy**: use ES `#private` fields; leave externally accessible members bare. **No `private`/`protected`/`public` keyword on fields or methods**, except on **constructor parameter properties** where TypeScript requires it (e.g. `constructor(private readonly session: ToolSession)`).
- **Promises**: use `Promise.withResolvers()` instead of `new Promise((resolve, reject) => ...)`.
- **Prompts**: never build prompts in code (no inline strings, template literals, or concatenation). Prompts live in static `.md` files; use Handlebars for dynamic content. Import them via `import content from "./prompt.md" with { type: "text" }` — not `readFile`.
- **Worker scripts**: workers re-enter the CLI entrypoint; never spawn separate worker entry modules. `cli.ts` declares itself as the worker host at startup (`declareWorkerHostEntry()` from `@oh-my-pi/pi-utils/env`) and dispatches hidden argv selectors (`__omp_worker_stats_sync`, `__omp_worker_tab`, `__omp_worker_js_eval`, `__omp_worker_tiny_inference`) before loading the command registry. Spawn sites use:
  ```ts
  import { workerHostEntry } from "@oh-my-pi/pi-utils";
  const hostEntry = workerHostEntry();
  const worker = hostEntry
  	? new Worker(hostEntry, { type: "module", argv: ["__omp_worker_<name>"] })
  	: new Worker(new URL("./<worker>.ts", import.meta.url).href, { type: "module" });
  ```
  When the process was started from the omp CLI — source `cli.ts`, npm-bundle `dist/cli.js`, or compiled binary — `workerHostEntry()` is `Bun.main` and the worker re-enters the single entry module, so no per-worker `--compile` entrypoints or bundle entries exist. Outside a CLI host (`bun test`, SDK embedding, standalone `omp-stats`) it returns `null` and the direct-module fallback loads the worker source. New worker kinds MUST add their selector to the dispatch table in `cli.ts` and keep the fallback branch.
  History: `with { type: "file" }` only copied the entry as a raw asset (workers crashed silently in compiled binaries — issues #1011, #1027), and the later literal-path + extra-entrypoint pattern required keeping spawn literals and two build scripts in sync (issue #1150). The smoke probe below is the live validation of this contract.
  Validate any new worker with the dedicated smoke probe: `omp --smoke-test` spawns the stats sync worker and the tiny-model subprocess, pings them, and exits — it's wired into `ci:test:smoke` and `scripts/install-tests/run-ci.sh` so binary, source-link, and tarball installs all exercise it. Add a sibling smoke if the new worker is on a different module graph.

## Bun Over Node

Use Bun APIs where they provide a cleaner alternative; fall back to `node:*` only for what Bun doesn't cover. **Never spawn shell commands for operations with proper APIs** (e.g., don't `Bun.spawnSync(["mkdir", "-p", dir])` — use `mkdirSync`).

### Quick reference

| Operation       | Use                                       | Not                             |
| --------------- | ----------------------------------------- | ------------------------------- |
| File read/write | `Bun.file()`, `Bun.write()`               | `readFileSync`, `writeFileSync` |
| Spawn process   | `` $`cmd` ``, `Bun.spawn()`               | `child_process`                 |
| Sleep           | `Bun.sleep(ms)`                           | `setTimeout` promise            |
| Binary lookup   | `$which("git")` from `@oh-my-pi/pi-utils` | `spawnSync(["which", "git"])`   |
| HTTP server     | `Bun.serve()`                             | `http.createServer()`           |
| SQLite          | `bun:sqlite`                              | `better-sqlite3`                |
| Hashing         | `Bun.hash()`, `Bun.password.*`, WebCrypto | `node:crypto`                   |
| Path resolution | `import.meta.dir`, `import.meta.path`     | `fileURLToPath` dance           |
| JSON5           | `Bun.JSON5.parse()` / `.stringify()`      | `json5` package                 |
| JSONL           | `Bun.JSONL.parse()` / `.parseChunk()`     | `text.split("\n").map(JSON.parse)` |
| String width    | `Bun.stringWidth()`                       | `get-east-asian-width`, custom  |
| Text wrapping   | `Bun.wrapAnsi()`                          | custom ANSI-aware wrappers      |

### Process execution

Prefer Bun Shell (`` $`cmd` ``) for simple commands:

```typescript
import { $ } from "bun";

const result = await $`git status`.cwd(dir).quiet().nothrow();
if (result.exitCode === 0) {
	const text = result.text();
}

$`do-stuff ${tmpFile}`.quiet().nothrow(); // fire and forget
```

Methods: `.quiet()`, `.nothrow()`, `.text()`, `.cwd(path)`.

Use `Bun.spawn`/`Bun.spawnSync` only for: long-running processes (LSP, kernels), streaming stdin/stdout/stderr (SSE, JSON-RPC), or process control (signals, kill, complex lifecycle).

When using `pipe` mode, cast the stream:
```typescript
const child = Bun.spawn(["cmd"], { stdout: "pipe", stderr: "pipe" });
const reader = (child.stdout as ReadableStream<Uint8Array>).getReader();
```

### Node module imports

Always use **namespace imports** for `node:fs`, `node:path`, `node:os`:

```typescript
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
```

- Async-only file → `node:fs/promises`.
- Needs both sync and async → `node:fs`, then `fs.promises.xxx` for async.

### File I/O

Prefer Bun:
```typescript
const text = await Bun.file(path).text();
const data = await Bun.file(path).json();
await Bun.write(path, data); // auto-creates parent dirs
```

Use `node:fs/promises` for directory ops (`fs.mkdir`, `fs.rm`, `fs.readdir`) — Bun has no native directory APIs. Avoid sync APIs in async flows; use sync only when forced by a synchronous interface.

**Anti-patterns:**
- `existsSync`/`readFileSync`/`writeFileSync` in async code → `Bun.file()` APIs.
- `mkdir(dirname(path), …)` before `Bun.write(path, …)` → redundant; `Bun.write` handles it.
- `if (await file.exists()) { await file.json() }` → two syscalls plus race. Use try-catch with `isEnoent`:
  ```typescript
  import { isEnoent } from "@oh-my-pi/pi-utils";
  try {
  	return await Bun.file(path).json();
  } catch (err) {
  	if (isEnoent(err)) return null;
  	throw err;
  }
  ```
- Multiple `Bun.file(path)` handles for the same path (including across `checkX`/`loadX` helpers).
- `Buffer.from(await Bun.file(x).arrayBuffer())` → `await fs.readFile(path)`.
- Existence check + try-catch around the same read → drop the existence check.

### Streams

Prefer centralized helpers:
```typescript
import { readStream, readLines } from "./utils/stream";
const text = await readStream(child.stdout);
for await (const line of readLines(stream)) { /* ... */ }
```
Manual reader loops only when the protocol requires it (SSE, streaming JSON-RPC).

### Misc

- **Sleep**: `await Bun.sleep(ms)`, never `new Promise(r => setTimeout(r, ms))`.
- **Password hashing**: `Bun.password.hash(pw, "bcrypt")` / `Bun.password.verify(pw, hash)`.
- **String width**: `Bun.stringWidth(text, { countAnsiEscapeCodes?: false })`.
- **Wrapping**: `Bun.wrapAnsi(text, width, { wordWrap, hard, trim })`.

## Generated Files

**NEVER edit `packages/catalog/src/models.json` directly.** It is generated from upstream sources (models.dev, provider catalog discovery, OpenCode docs) by `packages/catalog/scripts/generate-models.ts` and the descriptors/resolvers in `packages/catalog/src/provider-models/`. Hand-edits get overwritten on the next regen.

To change an entry, fix the source:
- **Resolution rules / per-id overrides** → relevant resolver in `packages/catalog/src/provider-models/openai-compat.ts` (e.g. `createOpenCodeApiResolution`'s id-override map).
- **Provider catalog entries** (default model, discovery factory/flags) → the `CATALOG_PROVIDERS` table in `packages/catalog/src/provider-models/descriptors.ts`.
- **Generator-level fixups** (premium multipliers, codex pricing fallback, fallback models, post-processing) → `packages/catalog/scripts/generate-models.ts`.
- **Thinking metadata / generated policies** → `packages/catalog/src/model-thinking.ts` (`applyGeneratedModelPolicies`); model-id classification (family/version parsing) lives in `packages/catalog/src/identity/classify.ts`.

Regenerate with `bun run gen:models` and commit `models.json` alongside the source change. Add a regression test against the **resolver/descriptor**, not the bundled JSON, so it survives upstream metadata shifts.

## Logging

**NEVER use `console.log`/`error`/`warn`** in the coding-agent package — it corrupts TUI rendering. Use the centralized logger:

```typescript
import { logger } from "@oh-my-pi/pi-utils";

logger.error("MCP request failed", { url, method });
logger.warn("Theme file invalid, using fallback", { path });
logger.debug("LSP fallback triggered", { reason });
```

Logs go to `~/.omp/logs/omp.YYYY-MM-DD.log` with automatic rotation.

## TUI Sanitization

All text displayed in tool renderers must be sanitized. Raw content (file contents, error messages, tool output) breaks terminal rendering: tabs → visual holes, long lines → overflow, paths → leak home directory.

**Rules:**
- **Tabs → spaces** via `replaceTabs()` (from `@oh-my-pi/pi-tui` or `../tools/render-utils`).
- **Truncate** lines with `truncateToWidth()` / `ui.truncate()`. Use `TRUNCATE_LENGTHS` constants.
- **Shorten paths** with `shortenPath()` (replaces home with `~`).
- **Preview limits** from `PREVIEW_LIMITS`. No ad-hoc numbers.

**Apply to every render path**, not just the happy one:
- Success output (file previews, command output, search results).
- **Error messages** — these often embed file content (e.g., patch failure messages include unmatched lines). If a message contains file content, it needs `replaceTabs()`.
- Diff content (added and removed).
- Streaming previews.

### Streaming tool previews

Tool-call previews can have **multiple render paths**. If you add preview-only fields or depend on partially streamed args, update every path — not only the final renderer. Streamed argument buffers decode into display args via `decodeStreamedToolArgs` / `ToolArgsRevealController` (`modes/controllers/tool-args-reveal.ts`); both the live event path and transcript rebuilds must go through them — never spread provider-parsed `arguments` next to a raw `__partialJson` (parsed args lag the stream by a throttled parse window).

For the bash tool specifically:
- The pending preview may need raw `partialJson`, not just parsed `arguments`. Parsed args lag until a JSON object closes, which makes inline env assignments appear only at the end.
- Preserve preview-only fields (e.g. `__partialJson`) through `event-controller.ts`, transcript rebuilds in `ui-helpers.ts`, and merged call/result rendering in `tool-execution.ts`. Missing one path causes inconsistent previews.
- `ToolExecutionComponent.#buildRenderContext()` for bash must work even before a result exists — the renderer uses call args plus render context to show the command preview while streaming.
- Verify both live streaming and rebuilt transcript paths after any bash preview change. A fix in one path does not fix the other.

## Commands

- NEVER commit unless asked.
- Never use `tsc`/`npx tsc` — always `bun check` (package gate uses `tsgo`, not `tsc`).
- Runtime is **Bun** (`packageManager: bun@1.3.14`). On Windows use PowerShell; do not assume bash-only paths.

### High-signal scripts (root unless noted)

| Task | Command |
| --- | --- |
| Install + native build + link `omp` | `bun run setup` |
| Run CLI from source | `bun run dev` |
| Full type+lint gate (TS+RS parallel) | `bun check` |
| TS-only gate | `bun run check:ts` |
| Package gate | `cd packages/coding-agent && bun run check` (`check:types` = `tsgo`) |
| Local test suite | `bun run test` (`scripts/ci-test-ts.ts local`) |
| TS tests only | `bun run test:ts` |
| Focused coding-agent buckets | `bun run ci:test:coding-agent:singleton` / `:ui` / `:runtime` / `:native` / `:heavy` |
| CLI smoke (workers, tiny model) | `bun run ci:test:smoke` |
| Regenerate model catalog | `bun run gen:models` |
| Rebuild collab tool views after renderer edits | `bun run gen:tool-views` |
| Validate a zh JSON file | `bun -e "JSON.parse(await Bun.file('packages/coding-agent/src/i18n/lang/zh-settings-tools.json').text()); console.log('ok')"` |

Tests are **bucketed** via `scripts/ci-test-ts.ts` — do not assume a single `bun test` covers coding-agent; UI/native/heavy suites are split on purpose (OOM/GC).

## Testing Guidance

Test the contract the system exposes — not the easiest internal detail to assert.

- Every new test must defend one **concrete, externally observable contract**: behavior, output shape, state transition, error mapping, or a regression-prone parsing boundary. If you cannot name the contract, do not add the test.
- No placeholder tests, tautologies, or "the code ran" assertions (`expect(true).toBe(true)`, bare `not.toThrow()`, non-empty string checks, length-grew checks, "prompt exists" checks without semantic assertion).
- Prefer contract-level tests over implementation details. Avoid asserting internal helper wiring, field assignment, singleton identity, incidental ordering, prompt boilerplate, or passthrough option forwarding unless another component depends on that exact detail.
- Don't duplicate coverage across abstraction levels. If an integration test already proves the behavior, drop the narrower unit test that restates it through mocks.
- Tests **must be full-suite safe**, not just file-local safe. No long-lived file-wide mutations of `Bun.*`, `process.platform`, `process.env`, or `Bun.env` when a narrower seam exists. Prefer per-test `vi.spyOn(...)` with `vi.restoreAllMocks()` in `afterEach`. A test that passes alone but poisons later files is broken.
- **Never use `mock.module()`**. Bun's `mock.module()` mutates the global module registry and leaks across files ([oven-sh/bun#12823](https://github.com/oven-sh/bun/issues/12823)). Use `spyOn` on the imported module object instead. For pass deps, import the pass and spy on `.run`. For package deps, namespace-import and spy on the exported function.
- For lifecycle/stateful code, prefer one test per invariant or transition over several tiny tests asserting one field each from the same transition.
- For error handling, trigger the real failure path and assert the surfaced contract — don't instantiate error classes directly or inspect internal metadata.
- Smoke tests are acceptable only when they catch a failure mode narrower tests would miss. "Package boots" or "command starts" alone is not enough.
- Assert exact strings, ordering, and formatting only when downstream code parses or depends on the exact bytes. Otherwise assert semantic content.
- Compile-time guarantees → type checks/type tests, not runtime placeholders.
- **Never source-grep.** A test that reads an implementation file (`.ts`/`.rs`/build script) and asserts on its *text* — `expect(src).toContain("someCall()")`, `.toMatch(/import .../)`, `.not.toContain("oldName")`, or "comment must say X" — is banned. It tests how code *looks*, not what it *does*: it breaks on harmless refactors (comment reflow, rename, import reorder) and passes while the behavior is broken. Assert the observable contract instead (run the code, check output/state/error), use the runtime smoke probe for wiring you cannot exercise in-process, and enforce structural invariants (no value-import of X, no self-import) with a type test or a lint/biome rule — never a string scan of the source. (Reading a file your code *wrote* — apply-patch result, generated bundle, temp fixture — and asserting on that output is fine; that is behavior, not a source grep.)
- Don't add tests for tiny low-risk changes unless they protect a real contract or fix a regression-prone edge case.
- Prefer focused package-local verification for the changed area.

## Changelog

Location: `packages/*/CHANGELOG.md` (per package).

**Format** — sections under `## [Unreleased]`:
- `### Breaking Changes` (first if present)
- `### Added`
- `### Changed`
- `### Fixed`
- `### Removed`

**Rules:**
- New entries always go under `## [Unreleased]`.
- Never modify already-released sections (e.g., `## [0.12.2]`) — they are immutable.
- Don't flag changelog section order or formatting in reviews or PRs — `bun run release` runs `fix-changelogs` which normalizes everything automatically.

**Attribution:**
- Internal (from issues): `Fixed foo bar ([#123](https://github.com/can1357/oh-my-pi/issues/123))`.
- External contributions: `Added feature X ([#456](https://github.com/can1357/oh-my-pi/pull/456) by [@username](https://github.com/username))`.

## Releasing

**Fork note:** Chinese releases (`vX.Y.Z-zh`) follow `docs/local/I18N-RELEASE-WORKFLOW.md` (local-only). That file is the sole process SoT: master-only, no feature branches/PRs for release, one tag + one GitHub Release per version, no force-push. Do not invent a parallel flow.

Upstream-style package release (only when explicitly aligning with official npm publish):

1. Ensure all changes since last release are in each affected package's `[Unreleased]` section.
2. Run `bun run release`.

The script handles version bump, CHANGELOG finalization, commit, tag, publish, and adding new `[Unreleased]` sections.
