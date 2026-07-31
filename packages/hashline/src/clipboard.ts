/**
 * Clipboard register support for `CUT` / `PASTE` ops.
 *
 * `CUT` captures its current source lines before ordinary delete edits apply.
 * `PASTE` expands the latest capture into inserts. One register flows through
 * patch sections in authored order, so content moves across files; the latest
 * cut wins and paste does not consume it.
 */
import { HL_CUT_KEYWORD, HL_RANGE_SEP } from "./format";
import { EMPTY_PASTE } from "./messages";
import { cloneCursor } from "./tokenizer";
import type { Clipboard, Edit } from "./types";

type CutEdit = Extract<Edit, { kind: "cut" }>;

function describeCutEdit(edit: CutEdit): string {
	const { start, end } = edit.range;
	const range = start.line === end.line ? `${start.line}` : `${start.line}${HL_RANGE_SEP}${end.line}`;
	return `${HL_CUT_KEYWORD} ${range}`;
}

/** True when at least one edit reads or writes the clipboard register. */
export function hasClipboardEdit(edits: readonly Edit[]): boolean {
	return edits.some(
		edit =>
			edit.kind === "cut" ||
			edit.kind === "paste" ||
			(edit.kind === "block" && (edit.mode === "cut" || edit.mode === "paste_after")),
	);
}

/** Optional knobs for {@link resolveClipboardEdits}. */
export interface ResolveClipboardEditsOptions {
	/** `PASTE` with an empty register: `throw` (default) or `drop` (streaming previews). */
	onEmptyPaste?: "throw" | "drop";
}

/**
 * Resolve clipboard edits against the original file lines in authored order.
 * Cuts fill the register and emit nothing; pastes become plain inserts.
 */
export function resolveClipboardEdits(
	edits: readonly Edit[],
	fileLines: readonly string[],
	clipboard: Clipboard,
	options: ResolveClipboardEditsOptions = {},
): readonly Edit[] {
	if (!hasClipboardEdit(edits)) return edits;
	const onEmptyPaste = options.onEmptyPaste ?? "throw";
	const resolved: Edit[] = [];
	let synthIndex = 0;
	for (const edit of edits) {
		if (edit.kind === "cut") {
			const { start, end } = edit.range;
			if (start.line < 1 || end.line > fileLines.length) {
				throw new Error(
					`line ${edit.lineNum}: \`${describeCutEdit(edit)}\` is out of range (file has ${fileLines.length} lines).`,
				);
			}
			clipboard.lines = fileLines.slice(start.line - 1, end.line);
			continue;
		}
		if (edit.kind === "paste") {
			const lines = clipboard.lines;
			if (lines === undefined) {
				if (onEmptyPaste === "drop") continue;
				throw new Error(`line ${edit.lineNum}: ${EMPTY_PASTE}`);
			}
			for (const text of lines) {
				resolved.push({
					kind: "insert",
					cursor: cloneCursor(edit.cursor),
					text,
					lineNum: edit.lineNum,
					index: synthIndex++,
					...(edit.blockStart === undefined ? {} : { blockStart: edit.blockStart }),
				});
			}
			continue;
		}
		resolved.push(edit);
	}
	return resolved;
}

/** Create a transactional working copy of a clipboard register. */
export function forkClipboard(source?: Clipboard): Clipboard {
	return source === undefined ? {} : { ...source };
}

/** Publish a clipboard fork back to its source register. */
export function commitClipboard(fork: Clipboard, target: Clipboard): void {
	if (fork.lines === undefined) delete target.lines;
	else target.lines = fork.lines;
}

/**
 * Validate that every paste has a preceding or persisted capture without
 * mutating the register or reading file content.
 */
export function validateClipboardSequence(edits: readonly Edit[], clipboard: Clipboard): void {
	let hasLines = clipboard.lines !== undefined;
	for (const edit of edits) {
		if (edit.kind === "cut") {
			hasLines = true;
		} else if (edit.kind === "paste" && !hasLines) {
			throw new Error(`line ${edit.lineNum}: ${EMPTY_PASTE}`);
		}
	}
}
