/** Centralized error/warning text for the hashline parser, applier, and patcher. */

import { formatNumberedLine, HL_FILE_HASH_SEP, HL_FILE_PREFIX, HL_FILE_SUFFIX, HL_RANGE_SEP } from "./format";
import type { BlockSpan } from "./types";

/** Lines of context shown either side of a hash mismatch. */
export const MISMATCH_CONTEXT = 2;

/**
 * Numbered `LINE:TEXT` rows around `anchorLines` (±{@link MISMATCH_CONTEXT}),
 * `*`-marking anchors, `...` between non-adjacent runs. Out-of-range anchors
 * contribute no rows.
 */
export function formatAnchoredContext(anchorLines: readonly number[], fileLines: readonly string[]): string[] {
	const displayLines = new Set<number>();
	for (const line of anchorLines) {
		if (line < 1 || line > fileLines.length) continue;
		const lo = Math.max(1, line - MISMATCH_CONTEXT);
		const hi = Math.min(fileLines.length, line + MISMATCH_CONTEXT);
		for (let lineNum = lo; lineNum <= hi; lineNum++) displayLines.add(lineNum);
	}
	const anchorSet = new Set(anchorLines);
	const rows: string[] = [];
	let previous = -1;
	for (const lineNum of [...displayLines].sort((a, b) => a - b)) {
		if (previous !== -1 && lineNum > previous + 1) rows.push("...");
		previous = lineNum;
		const marker = anchorSet.has(lineNum) ? "*" : " ";
		rows.push(`${marker}${formatNumberedLine(lineNum, fileLines[lineNum - 1] ?? "")}`);
	}
	return rows;
}
/** Concrete range operation rejected because its absolute end precedes its start. */
export type AbsoluteRangeOp = "replace" | "cut";

/** Header forms per concrete-range op, used to compose retry suggestions. */
const RANGE_OP_FORMS: Record<AbsoluteRangeOp, { keyword: string; colon: string; blockKeyword: string }> = {
	replace: { keyword: "SWAP", colon: ":", blockKeyword: "SWAP.BLK" },
	cut: { keyword: "CUT", colon: "", blockKeyword: "CUT.BLK" },
};

/** `OP.BLK N`-style header for a concrete-range op (`SWAP.BLK 5:` / `CUT.BLK 5`). */
function blockFormAt(op: AbsoluteRangeOp, line: number): string {
	const forms = RANGE_OP_FORMS[op];
	return `${forms.blockKeyword} ${line}${forms.colon}`;
}

/** Explain absolute range endpoints and provide safe, non-applying retry forms. */
export function invalidAbsoluteRangeMessage(
	patchLine: number,
	start: number,
	end: number,
	op: AbsoluteRangeOp,
	block?: BlockSpan,
): string {
	const forms = RANGE_OP_FORMS[op];
	const single = op === "replace" ? `SWAP ${start}${HL_RANGE_SEP}${start}:` : `${forms.keyword} ${start}`;
	const countedEnd = start + end - 1;
	const counted =
		Number.isSafeInteger(countedEnd) && countedEnd >= start
			? `${forms.keyword} ${start}${HL_RANGE_SEP}${countedEnd}${forms.colon}`
			: null;
	const blockForm = blockFormAt(op, start);
	let message =
		`line ${patchLine}: Invalid absolute range: start ${start}, end ${end}. ` +
		`The value after \`${HL_RANGE_SEP}\` is an absolute source line, not a line count or replacement length. ` +
		`For one line use \`${single}\`.`;
	if (counted !== null) {
		message += ` For ${end} lines starting at ${start}, use \`${counted}\`.`;
	}
	if (block?.start === start && block.end > start) {
		message +=
			` The syntactic block beginning at ${start} ends at ${block.end}, ` + `so \`${blockForm}\` is also valid.`;
	}
	return message;
}

/** Optional patch envelope start marker; silently consumed. */
export const BEGIN_PATCH_MARKER = "*** Begin Patch";

/** Optional patch envelope end marker; terminates parsing. */
export const END_PATCH_MARKER = "*** End Patch";

/**
 * Truncation sentinel emitted by an agent loop mid-call. Ends parsing like
 * {@link END_PATCH_MARKER}, without a warning.
 */
export const ABORT_MARKER = "*** Abort";

/** Two consecutive hunks targeted the exact same concrete range. */
export const REPLACE_PAIR_COALESCED_WARNING = `Two hunks targeted the same range; kept only the second. One \`SWAP N${HL_RANGE_SEP}M:\` hunk per range — the body is the final content, never old+new.`;

/** Bare bodyless hunk followed by an overlapping concrete hunk. */
`Dropped a bare hunk overlapped by the concrete hunk after it. One \`SWAP N${HL_RANGE_SEP}M:\` hunk per range — the body is the final content, never old+new.`;

/** Bare body rows auto-converted to literal `+` rows. */
export const BARE_BODY_AUTO_PIPED_WARNING =
	"Auto-prefixed bare body row(s) with `+`. Body rows must be `+TEXT` literal lines.";

/**
 * Bare `-` body rows accepted as literal Markdown bullets. Only emitted when
 * the hunk is unambiguously a bullet list: every `-` row is bullet-shaped
 * (`- item`) and the body has no unified-diff `+new` counterpart rows.
 */
export const MINUS_BULLET_AUTO_PIPED_WARNING =
	"Auto-prefixed bare `- ` bullet row(s) as literal content. `-` rows never remove lines — the range does that; always prefix literal body rows with `+`: `+- item`.";

/** Unified-diff-style `-` row in a hunk body. */
export const MINUS_ROW_REJECTED =
	"`-` rows are not valid; the range already names the lines being changed. For Markdown bullets or other literal `-` lines, prefix the literal row with `+`: `+- item`.";

/** Replace hunk with no body. */
export const EMPTY_REPLACE = `\`SWAP N${HL_RANGE_SEP}M:\` needs at least one \`+TEXT\` body row. To delete lines, use \`CUT N${HL_RANGE_SEP}M\`.`;

/** `SWAP.BLK N:` hunk with no body. */
export const EMPTY_BLOCK = "`SWAP.BLK N:` needs at least one `+TEXT` body row. To delete a block, use `CUT.BLK N`.";

/** Optional source-aware suggestions appended to block-anchor diagnostics. */
export interface BlockDiagnosticSuggestions {
	/** Closest following multi-line block that begins after the authored anchor. */
	nextBlock?: BlockSpan;
	/** Closest preceding multi-line block whose span contains the authored anchor. */
	enclosingBlock?: BlockSpan;
}

/**
 * A block-anchored replace/cut could not resolve to a syntactic block.
 * Appends a {@link formatAnchoredContext} preview when `fileLines` is given.
 * `INS.BLK.POST N:` never reaches this path; it lowers to `INS.POST N:`.
 */
export function blockUnresolvedMessage(
	line: number,
	op: AbsoluteRangeOp = "replace",
	fileLines?: readonly string[],
	suggestions: BlockDiagnosticSuggestions = {},
): string {
	const forms = RANGE_OP_FORMS[op];
	const phrase = blockFormAt(op, line);
	const fallback = `${forms.keyword} ${line}${HL_RANGE_SEP}M${forms.colon}`;
	const anchorText = fileLines?.[line - 1];
	const nextBlock = suggestions.nextBlock;
	let message: string;
	if (anchorText !== undefined && anchorText.trim().length === 0 && nextBlock) {
		const retry = blockFormAt(op, nextBlock.start);
		message =
			`Line ${line} is blank; no syntactic block can begin there. ` +
			`The next multi-line block begins at line ${nextBlock.start} and ends at line ${nextBlock.end}. ` +
			`Retry \`${retry}\`.`;
	} else {
		message =
			`\`${phrase}\` could not resolve a syntactic block beginning on line ${line} ` +
			`(unsupported language, blank/closer line, or parse error). Use \`${fallback}\` with explicit lines.`;
	}
	const enclosingBlock = suggestions.enclosingBlock;
	if (enclosingBlock) {
		const retry = blockFormAt(op, enclosingBlock.start);
		message +=
			` The nearest enclosing multi-line block begins at line ${enclosingBlock.start} ` +
			`and ends at line ${enclosingBlock.end}; use \`${retry}\` to target it.`;
	}
	if (fileLines) {
		const context = formatAnchoredContext([line], fileLines);
		if (context.length > 0) message += `\n\n${context.join("\n")}`;
	}
	return message;
}

/** Block-anchored edit reached a path with no {@link BlockResolver} wired in. */
export const BLOCK_RESOLVER_UNAVAILABLE =
	"Block ops (`SWAP.BLK`, `INS.BLK.POST`, `CUT.BLK`, `PASTE.BLK.POST`) are not available here (no block resolver configured). Use a concrete line range.";

/**
 * An after-block op anchored on a closing-delimiter line, lowered to its
 * plain after-line form — the closer ends a block, and inserting after it is
 * exactly what the plain form does.
 */
function closerLoweredWarning(blockForm: string, plainForm: string): string {
	return `\`${blockForm}\` anchors on a closing delimiter, so it was applied as plain \`${plainForm}\`. Anchor on the line that OPENS the construct.`;
}

/**
 * An after-block op whose anchor was unresolvable (unsupported language,
 * blank line, parse error, or no resolver), lowered to its plain after-line
 * form — applying with a warning beats failing the patch.
 */
function unresolvedLoweredWarning(blockForm: string, line: number, plainForm: string): string {
	return `\`${blockForm}\` could not resolve a syntactic block on line ${line}, so it was applied as plain \`${plainForm}\`. Verify the landing line; anchor on a line that OPENS a construct.`;
}

/** `INS.BLK.POST N:` anchored on a closing-delimiter line; applied as `INS.POST N:`. */
export function insertAfterBlockCloserLoweredWarning(line: number): string {
	return closerLoweredWarning(`INS.BLK.POST ${line}:`, `INS.POST ${line}:`);
}

/** `INS.BLK.POST N:` anchor unresolvable; applied as `INS.POST N:`. */
export function insertAfterBlockUnresolvedLoweredWarning(line: number): string {
	return unresolvedLoweredWarning(`INS.BLK.POST ${line}:`, line, `INS.POST ${line}:`);
}

/** `PASTE.BLK.POST N` anchored on a closing-delimiter line; applied as `PASTE.POST N`. */
export function pasteAfterBlockCloserLoweredWarning(line: number): string {
	return closerLoweredWarning(`PASTE.BLK.POST ${line}`, `PASTE.POST ${line}`);
}

/** `PASTE.BLK.POST N` anchor unresolvable; applied as `PASTE.POST N`. */
export function pasteAfterBlockUnresolvedLoweredWarning(line: number): string {
	return unresolvedLoweredWarning(`PASTE.BLK.POST ${line}`, line, `PASTE.POST ${line}`);
}
/**
 * A one-sided boundary echo whose payload is too short to be the widened
 * range's full content: dropping the echo deletes range line(s) the payload
 * never restates (the "widened range" reading), while the "range shifted by
 * the echo" reading keeps them. The readings produce different files, so the
 * edit is rejected instead of repaired.
 */
export function ambiguousBoundaryEchoMessage(
	startLine: number,
	endLine: number,
	side: "leading" | "trailing",
	count: number,
): string {
	const where =
		side === "leading"
			? `opens by restating the ${count} line(s) just above the range`
			: `ends by restating the ${count} line(s) just below the range`;
	return (
		`\`SWAP ${startLine}${HL_RANGE_SEP}${endLine}:\` rejected: the body ${where}, ` +
		`but is too short to be the full final content of the widened range — applying it as-is or ` +
		`auto-repairing would delete range line(s) the body never restates. ` +
		`Re-issue with the range covering exactly the lines that change and the body as their complete ` +
		`final content: drop the restated keeper from the body, or widen the range to consume it.`
	);
}

/**
 * A replacement range deletes trailing structural closer(s) the payload never
 * restates, and nothing anchors the payload inside the block those closers
 * terminate: the payload has no unmatched opener for them and its indentation
 * is not deeper than the closer. Sparing the closer would have to guess
 * whether the payload belongs before it (inside the block) or after it (a
 * sibling), so the edit is rejected instead of repaired.
 */
export function ambiguousCloserSpareMessage(
	startLine: number,
	endLine: number,
	closerLine: number,
	count: number,
): string {
	const closers = count === 1 ? `line ${closerLine}` : `lines ${closerLine}-${closerLine + count - 1}`;
	return (
		`\`SWAP ${startLine}${HL_RANGE_SEP}${endLine}:\` rejected: the range deletes the closing-delimiter ` +
		`${closers} but the body never restates it, and the body claims no position inside that block ` +
		`(no unmatched opener, indentation not deeper than the closer) — whether the new content belongs ` +
		`before or after the closer is ambiguous. Restate the closer in the body at the intended position, ` +
		`or use \`INS.PRE ${closerLine}:\` / \`INS.POST ${closerLine}:\` instead.`
	);
}

/**
 * Internal invariant: `applyEdits` received an unresolved block edit;
 * `resolveBlockEdits` must run first.
 */
export const UNRESOLVED_BLOCK_INTERNAL =
	"internal error: unresolved block edit reached the applier (resolveBlockEdits was not run).";

/** `REM` received a body row or coexists with line edits. */
export const REM_TAKES_NO_BODY =
	"`REM` deletes the whole file and takes no body rows or line ops. Issue it alone under the header.";

/** `MV` received a body row. */
export const MOVE_TAKES_NO_BODY =
	"`MV DEST` does not take body rows. Put line edits above the `MV` row; the destination path follows `MV` on the same line.";

/** `CUT N.=M` hunk received a body row. */
export const CUT_TAKES_NO_BODY = `\`CUT N${HL_RANGE_SEP}M\` captures + deletes lines and takes no body rows. To replace lines with new content, use \`SWAP N${HL_RANGE_SEP}M:\`.`;

/** `PASTE` hunk received a body row. */
export const PASTE_TAKES_NO_BODY =
	"`PASTE` inserts the clipboard content and takes no `+` body rows. To insert literal text, use `INS`.";

/** `PASTE` ran with an empty clipboard register. */
export const EMPTY_PASTE = `\`PASTE\` found nothing in the clipboard. Ops run top-to-bottom across the whole patch (sections included): put \`CUT N${HL_RANGE_SEP}M\` or \`CUT.BLK N\` above the \`PASTE\`.`;

/**
 * Clipboard ops inside a same-path section that was merged across another
 * file's section. Same-path sections coalesce into their first occurrence, so
 * an interleaved layout would silently reorder the register sequence.
 */
export const CLIPBOARD_INTERLEAVED_SECTIONS =
	"`CUT`/`PASTE` cannot be used in a file whose sections are interleaved with another file's: same-path sections merge into the first occurrence, which would reorder the clipboard sequence. Keep each file's ops under ONE `[path#TAG]` header.";

/** Insert hunk with no body. */
export const EMPTY_INSERT = "`INS` needs at least one `+TEXT` body row.";

/**
 * `insert after` body indented shallower than the anchor: the landing slid
 * forward past trailing closer lines — the common "anchored on the last line
 * I read instead of after the block" mistake.
 */
export function afterInsertLandingShiftWarning(anchorLine: number, landingLine: number, crossed: number): string {
	return `INS.POST ${anchorLine}: body indented shallower than the anchor, so the landing moved past ${crossed} closing line${crossed === 1 ? "" : "s"} to after line ${landingLine}. For the deeper position inside the block, re-issue with the body indented to match.`;
}

/**
 * `insert_after_block N:` body indented deeper than the block's closer: the
 * landing was pulled inside the block — a deeper body almost always means
 * "append inside the block's body".
 */
export function blockInsertLandingShiftWarning(blockStart: number, closerLine: number, landingLine: number): string {
	return `INS.BLK.POST ${blockStart}: body indented deeper than closing line ${closerLine}, so it was placed inside the block, after line ${landingLine}. \`INS.BLK.POST\` lands AFTER the block at sibling depth — if inside was intended, use plain \`INS.POST ${closerLine}:\`.`;
}

/** `Recovery`: an external write matched a cached snapshot. */
export const RECOVERY_EXTERNAL_WARNING =
	"Recovered from a stale file hash using a previous read snapshot (file changed externally between read and edit).";

/** `Recovery`: a prior in-session edit advanced the hash. */
export const RECOVERY_SESSION_CHAIN_WARNING =
	"Recovered from a stale file hash using an earlier in-session snapshot (a prior edit in this session advanced the hash).";

/** `Recovery`: stale anchors were relocated to unchanged live lines after drift. */
export const RECOVERY_LINE_REMAP_WARNING =
	"Recovered by remapping stale line anchors to unchanged current lines (file changed since the tagged read). Verify the diff matches your intent.";

/**
 * `insert head:`/`insert tail:` applied despite a stale snapshot tag.
 * Head/tail position is content-independent, so drift is non-fatal: apply
 * onto live content and warn instead of hard-failing.
 */
export const HEADTAIL_DRIFT_WARNING =
	"Applied the `INS.HEAD:`/`INS.TAIL:` edit despite a stale snapshot tag (file changed since your read) — head/tail position is content-independent. Re-read if the drift was unexpected.";

/**
 * The `Filesystem` reported that what actually landed on disk differs from
 * what was written (see `WriteResult.text`) — most commonly an ACP-connected
 * editor reformatting the buffer on save (e.g. `format_on_save` with tab/space
 * settings that don't match the file). The recorded snapshot is re-keyed on
 * the real, post-write content so the next edit's tag validation matches
 * reality instead of silently drifting.
 */
export function writeDriftWarning(path: string): string {
	return (
		`${path}: the file on disk after this write differs from what was sent — the client ` +
		"(editor/IDE) likely reformatted it on save (e.g. format-on-save, tab/space settings). " +
		"The returned snapshot reflects the actual file; re-read before further edits if the " +
		"extra changes were unexpected."
	);
}

/**
 * Section omitted the mandatory snapshot tag. Shared by the apply
 * ({@link Patcher.prepare}) and preview/diff paths so both stay in lockstep.
 */
export function missingSnapshotTagMessage(sectionPath: string): string {
	return `Missing hashline snapshot tag for ${sectionPath}; use \`${HL_FILE_PREFIX}${sectionPath}${HL_FILE_HASH_SEP}tag${HL_FILE_SUFFIX}\` from your latest read/search output. To create a new file, use the write tool.`;
}

/**
 * A section named a path that does not exist, but its filename and snapshot
 * tag together match exactly one file read earlier this session — the model
 * gave the bare filename (or wrong directory) for a file it just read. The
 * edit was rebound to that file's full path. Surfaced as a warning so the
 * model (and user) learn the corrected path and stop reusing the wrong one.
 */
export function pathRecoveredFromTagMessage(authoredPath: string, resolvedPath: string, tag: string): string {
	return (
		`Path "${authoredPath}" does not exist; matched its filename and snapshot tag ` +
		`${HL_FILE_HASH_SEP}${tag} to ${resolvedPath} (read earlier this session). Anchor future edits on ` +
		`${HL_FILE_PREFIX}${resolvedPath}${HL_FILE_HASH_SEP}TAG${HL_FILE_SUFFIX}.`
	);
}

/** Compress a line list into a sorted `1-4, 7, 10-12` range string. */
function formatLineRanges(lines: readonly number[]): string {
	const sorted = [...new Set(lines)].sort((a, b) => a - b);
	if (sorted.length === 0) return "";
	const parts: string[] = [];
	let start = sorted[0];
	let prev = sorted[0];
	for (let i = 1; i <= sorted.length; i++) {
		const current = sorted[i];
		if (current === prev + 1) {
			prev = current;
			continue;
		}
		parts.push(start === prev ? `${start}` : `${start}-${prev}`);
		start = current;
		prev = current;
	}
	return parts.join(", ");
}

/** One anchored line whose actual content is being surfaced in an error message. */
export interface RevealedLine {
	line: number;
	text: string;
}

/**
 * Content preview handed to {@link unseenLinesMessage}. `lines` are the
 * unseen anchor lines whose actual file content we surface inline (from the
 * tagged snapshot the caller matched). `truncated` = true means the anchor
 * range exceeded the inline reveal cap; the caller only revealed a prefix
 * and the remaining unseen lines still require a range re-read.
 */
export interface UnseenLinesReveal {
	lines: readonly RevealedLine[];
	truncated: boolean;
}

/**
 * An anchored edit referenced lines the read that minted the cited tag never
 * displayed (a partial range, or a structural summary that collapsed bodies).
 * Editing lines you have not read is the off-by-memory failure that mangles
 * files. When `reveal.lines` is non-empty, the caller has already inlined the
 * actual file content at those lines and merged them into the snapshot's
 * seen-line set, so the message points the model at a straight retry with the
 * same `[path#tag]` header; when the reveal is empty or truncated, the
 * message falls back to instructing a range re-read.
 */
export function unseenLinesMessage(
	sectionPath: string,
	unseenLines: readonly number[],
	tag: string,
	reveal: UnseenLinesReveal = { lines: [], truncated: false },
): string {
	const ranges = formatLineRanges(unseenLines);
	const selector = ranges.replace(/, /g, ",");
	const header =
		`This edit anchors to lines ${ranges} of ${sectionPath} that ` +
		`${HL_FILE_PREFIX}${sectionPath}${HL_FILE_HASH_SEP}${tag}${HL_FILE_SUFFIX} never displayed (it showed a ` +
		`partial range, a search hit, or a folded summary).`;
	if (reveal.lines.length === 0) {
		return (
			`${header} Re-read them in full first with a ranged read like ` +
			`\`${sectionPath}:${selector}\` — it skips summarization and mints a fresh tag (a plain re-read just re-folds ` +
			`them) — then re-issue the edit.`
		);
	}
	const preview = reveal.lines.map(({ line, text }) => `  ${formatNumberedLine(line, text)}`).join("\n");
	if (reveal.truncated) {
		return (
			`${header} Preview of the actual file content at the first ${reveal.lines.length} unseen line(s):\n${preview}\n` +
			`The range exceeds the inline preview cap — re-read the remainder with \`${sectionPath}:${selector}\` before ` +
			`re-issuing the edit.`
		);
	}
	return (
		`${header} Actual file content at those lines:\n${preview}\n` +
		`Verify the content matches what you intend to touch, then re-issue the edit with the same ` +
		`${HL_FILE_PREFIX}path${HL_FILE_HASH_SEP}tag${HL_FILE_SUFFIX} header — a straight retry now succeeds without a re-read. ` +
		`If the content does NOT match, fix your line numbers.`
	);
}

/** Op kind of a deferred block edit, for {@link blockSingleLineMessage}. */
export type BlockOp = "replace" | "insert_after" | "cut" | "paste_after";

/** Display forms per deferred-block op: block keyword, trailing colon, and single-line plain form. */
const BLOCK_OP_FORMS: Record<BlockOp, { keyword: string; colon: string; plain: (line: number) => string }> = {
	replace: { keyword: "SWAP.BLK", colon: ":", plain: line => `SWAP ${line}${HL_RANGE_SEP}${line}:` },
	insert_after: { keyword: "INS.BLK.POST", colon: ":", plain: line => `INS.POST ${line}:` },
	cut: { keyword: "CUT.BLK", colon: "", plain: line => `CUT ${line}` },
	paste_after: { keyword: "PASTE.BLK.POST", colon: "", plain: line => `PASTE.POST ${line}` },
};

/**
 * A block-op anchor resolved to a single line: line N is a bare statement,
 * not the opening line of a multi-line construct. The plain op is exact for
 * one line, so reject and point at it.
 */
export function blockSingleLineMessage(line: number, op: BlockOp, enclosingBlock?: BlockSpan): string {
	const forms = BLOCK_OP_FORMS[op];
	const plainForm = forms.plain(line);
	let message =
		`\`${forms.keyword} ${line}\` resolved a single-line block — line ${line} is a bare statement, not the opening line ` +
		`of a multi-line construct. For only this statement use \`${plainForm}\`.`;
	if (enclosingBlock) {
		const enclosingForm = `${forms.keyword} ${enclosingBlock.start}${forms.colon}`;
		message +=
			` The nearest enclosing multi-line block begins at line ${enclosingBlock.start} ` +
			`and ends at line ${enclosingBlock.end}; use \`${enclosingForm}\` to target it.`;
	}
	return message;
}
