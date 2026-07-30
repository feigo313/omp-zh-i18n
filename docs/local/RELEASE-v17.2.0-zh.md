# Release: v17.2.0-zh

## Metadata

- **Tag**: v17.2.0-zh
- **Target Commit**: e2480faf3a (`feat(i18n): finalize v17.2.0 Chinese adaptation`)
- **Upstream Baseline**: 8db0228f4d (`fix(ci): unblocked release run on formatting and chunk watchdog`)
- **Branch Policy**: master-only (no adaptation branch retained)

## Scope

Chinese UI localization for OMP v17.2.0.

- Settings translations: 10 categories, 1302 keys aligned (zh === en)
- Command translations: 189 keys aligned, 226 extra archived
- Runtime strings: zh-runtime.json, zh-ui.json, zh-tips.json
- Hotkeys: zh-hotkeys.json
- Release workflow: `scripts/i18n/` (prepare, verify, status, cleanup)
- CI: `.github/workflows/i18n-upstream-check.yml`
- Schema gate: `packages/coding-agent/scripts/check-schema-gate.ts`
- Extraction helper: `packages/coding-agent/scripts/extract-settings-translations.ts`

## Verification Exit Codes

| Check | Command | Exit Code | Notes |
|-------|---------|-----------|-------|
| Source version | `bun packages/coding-agent/src/cli.ts --version` | 0 | Output: `omp/17.2.0-zh` |
| Source smoke-test | `bun packages/coding-agent/src/cli.ts --smoke-test` | 0 | Passed |
| Global omp version | `C:\Users\MYCAIGC\.bun\bin\omp.exe --version` | 0 | Output: `omp/17.2.0-zh` |
| Global omp smoke-test | `C:\Users\MYCAIGC\.bun\bin\omp.exe --smoke-test` | 0 | Passed |
| git diff --check | `git diff --check` | 0 | No whitespace errors |
| check:tools | `bun run check:tools` | 1 | 23 pre-existing biome lint errors in `packages/coding-agent/scripts/fix-i18n-missing.ts` and `fix-zh-ui.ts`; not caused by i18n overlay |
| i18n:verify (source) | `bun run i18n:verify` | 0 | schema gate + tool check + source version + source smoke |
| i18n:verify (full + binary) | `bun run i18n:verify -- --full --binary packages/coding-agent/dist/omp.exe` | 1 | coding-agent type-check has pre-existing TS errors in `src/session/*.ts`; binary not built |
| Local binary version | `packages/coding-agent/dist/omp.exe --version` | N/A | Binary not built; `bun packages/coding-agent/build.ts` failed (`Module not found`) |
| Local binary smoke | `packages/coding-agent/dist/omp.exe --smoke-test` | N/A | Binary not built |
| Native sentinel | source smoke-test native check | N/A | Local `pi_natives.win32-x64-baseline.node` is v17.1.8 artifact; bazel unavailable to rebuild |

## Binary Paths

- Source CLI: `packages/coding-agent/src/cli.ts`
- Local binary: `packages/coding-agent/dist/omp.exe` (not built in this environment)
- Global binary: `C:\Users\MYCAIGC\.bun\bin\omp.exe` (already v17.2.0-zh)

## Known Limitations

- `check:tools` exit 1: 23 pre-existing lint errors in `packages/coding-agent/scripts/fix-i18n-missing.ts` and `fix-zh-ui.ts`. Not caused by i18n overlay.
- `i18n:verify --full` exit 1: pre-existing TypeScript errors in `packages/coding-agent/src/session/*.ts` (unrelated to i18n).
- Local binary not built: `bun packages/coding-agent/build.ts` failed with `Module not found`. Rebuild in environment with proper build tooling.
- Native sentinel mismatch: local `pi_natives.win32-x64-baseline.node` is v17.1.8 because bazel is unavailable. Global installed `omp.exe` is already v17.2.0-zh and passes smoke-test.

## Notes

- No `.agents`, `.reasonix`, `docs/local/_audit`, or `.tools` contents are shipped in this release.
- Final commit is a plain merge-free commit on `master`.
- Old remote branch `i18n/17.1.8-zh-adaptation` deleted after release; tag `v17.1.8-zh` retained.
- Workflow policy is master-only; adaptation branches are not created or retained.
