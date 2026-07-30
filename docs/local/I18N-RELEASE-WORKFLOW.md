# I18N-RELEASE-WORKFLOW

## Branch Policy

This repository operates on a **master-only** release model for Chinese adaptations.

- All i18n overlay changes are committed directly to `master`.
- No adaptation branches (e.g. `i18n/{version}-zh-adaptation`) are created or retained.
- Tags use the pattern `v{upstream_version}-zh` (e.g. `v17.2.0-zh`).
- Old remote branches and tags from previous adaptation cycles may be deleted after verification.

## Release Checklist

1. **Version alignment**: update all `@oh-my-pi/*` package versions to `{upstream_version}-zh` (except `pi-natives` which remains `{upstream_version}`).
2. **Verification**: run `bun run i18n:verify` and record actual exit codes.
3. **Binary**: build with `bun packages/coding-agent/build.ts` (if available) and verify `dist/omp.exe --version` and `--smoke-test`.
4. **Release doc**: update `docs/local/RELEASE-{version}-zh.md` with actual verification results and known limitations.
5. **Commit**: amend or commit with `--no-verify` if pre-commit hooks fail due to environment issues.
6. **Tag**: create annotated tag `v{version}-zh` on the final master commit.
7. **Push**: force-push master and tag to origin (single-operator repo).
8. **GitHub Release**: create release from tag with `gh release create` or mark existing draft as non-draft with `gh release edit --draft=false`.
9. **Cleanup**: delete old remote branches and local branches no longer needed.

## Known Limitations

- `check:tools` may show pre-existing lint errors upstream; these are not i18n regressions.
- `i18n:verify --full` may fail on pre-existing TypeScript errors in unrelated packages.
- Native rebuild requires bazel; if unavailable, document the sentinel mismatch and rely on global installed binary for smoke-test.
- Local binary build may fail if build entrypoint is missing; document and rebuild in proper environment.

## Overlay Roots

The i18n overlay targets these paths (from `i18n.release.json`):

- `packages/coding-agent/src/i18n`
- `packages/coding-agent/src/config/settings-schema.ts`
- `packages/coding-agent/src/cli.ts`
- `packages/coding-agent/src/modes/components/plugin-settings.ts`
- `packages/coding-agent/src/modes/components/settings-defs.ts`
- `packages/coding-agent/src/modes/components/settings-selector.ts`
- `packages/coding-agent/src/modes/components/welcome.ts`
- `packages/coding-agent/src/modes/controllers/selector-controller.ts`
- `packages/coding-agent/src/slash-commands/builtin-registry.ts`
- `packages/coding-agent/scripts/check-schema-gate.ts`
- `packages/coding-agent/scripts/extract-settings-translations.ts`

## Exclusions

Do not ship these in releases:

- `.agents/`
- `.reasonix/`
- `docs/local/_audit/`
- `.tools/` temp content
