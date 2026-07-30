# Release: v17.2.0-zh

## Metadata

- **Tag**: v17.2.0-zh
- **Target Commit**: see `git log` on master for the final adaptation commit SHA
- **Upstream Baseline**: 8db0228f4d (`fix(ci): unblocked release run on formatting and chunk watchdog`)
- **Adaptation Branch**: i18n/17.2.0-zh-adaptation

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

## Verification

| Check | Command | Expected | Actual | Notes |
|-------|---------|----------|--------|-------|
| Source version | `bun packages/coding-agent/src/cli.ts --version` | omp/17.2.0-zh | omp/17.2.0-zh | ✅ |
| Source smoke-test | `bun packages/coding-agent/src/cli.ts --smoke-test` | 0 | 0 | ✅ |
| Global omp version | `C:\Users\MYCAIGC\.bun\bin\omp.exe --version` | omp/17.2.0-zh | omp/17.2.0-zh | ✅ |
| Global omp smoke-test | `C:\Users\MYCAIGC\.bun\bin\omp.exe --smoke-test` | 0 | 0 | ✅ |
| git diff --check | `git diff --check` | 0 | 0 | ✅ |
| check:tools | `bun run check:tools` | 0 | 1 | ⚠️ 23 pre-existing lint errors in `packages/coding-agent/scripts/fix-i18n-missing.ts` and `fix-zh-ui.ts`; not caused by i18n overlay |
| i18n:verify (no binary) | `bun run i18n:verify` | 0 | 0 | ✅ schema gate + tool check + source version + source smoke |
| i18n:verify (full + binary) | `bun run i18n:verify -- --full --binary packages/coding-agent/dist/omp.exe` | 0 | 1 | ⚠️ coding-agent type-check has pre-existing TS errors in `src/session/*.ts`; binary not yet built |
| Local binary version | `packages/coding-agent/dist/omp.exe --version` | omp/17.2.0-zh | N/A | ⛔ binary not built; `bun packages/coding-agent/build.ts` failed (`Module not found`) |
| Local binary smoke | `packages/coding-agent/dist/omp.exe --smoke-test` | 0 | N/A | ⛔ binary not built |
| Native sentinel | source smoke-test native check | v17.2.0 + DesktopSession | v17.1.8 + DesktopSession | ⛔ local `pi_natives.win32-x64-baseline.node` is v17.1.8 artifact; bazel unavailable to rebuild |

## Binary Paths

- Source CLI: `packages/coding-agent/src/cli.ts`
- Local binary: `packages/coding-agent/dist/omp.exe` (not built in this environment)
- Global binary: `C:\Users\MYCAIGC\.bun\bin\omp.exe` (already v17.2.0-zh)

## Known Limitations

- `check:tools` shows 23 pre-existing lint errors in `packages/coding-agent/scripts/fix-i18n-missing.ts` and `fix-zh-ui.ts`. These are upstream issues, not caused by the i18n overlay.
- `i18n:verify --full` fails due to pre-existing TypeScript errors in `packages/coding-agent/src/session/*.ts` (unrelated to i18n).
- Local `packages/natives/native/pi_natives.win32-x64-baseline.node` is still the v17.1.8 artifact because bazel is unavailable. Global installed `omp.exe` is already v17.2.0-zh and passes smoke-test.
- `packages/coding-agent/dist/omp.exe` was not built because `bun packages/coding-agent/build.ts` failed with `Module not found`. The release should be rebuilt in an environment with proper build tooling.

## Notes

- No `.agents`, `.reasonix`, `docs/local/_audit`, or `.tools` contents are shipped in this release.
- The adaptation was prepared in a detached worktree to avoid force-push; final commit is a plain merge-free commit on `master`.
- Old remote branch `i18n/17.1.8-zh-adaptation` will be deleted after release verification; tag `v17.1.8-zh` is retained.
