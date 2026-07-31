/**
 * Pure data types shared across the hashline parser, applier, and patcher.
 * Nothing in this file references a filesystem, agent runtime, or schema
 * library — keep it that way.
 */

/** A line-number anchor (1-indexed). */
export interface Anchor {
	line: number;
}

/** Where an `insert` edit should land relative to existing content. */
export type Cursor =
	| { kind: "bof" }
	| { kind: "eof" }
	| { kind: "before_anchor"; anchor: Anchor }
	| { kind: "after_anchor"; anchor: Anchor };

/**
 * A single low-level edit produced by the parser and consumed by the applier.
 * Multi-line replacements decompose to one `insert` per replacement line plus
 * one `delete` per consumed line. Replacement payloads are tagged so the
 * applier can distinguish literal insertion from new content for a deleted
 * line.
 */
export type Edit =
	| {
			kind: "insert";
			cursor: Cursor;
			text: string;
			lineNum: number;
			index: number;
			mode?: "replacement";
			/**
			 * Present on inserts lowered from `insert_after_block N:`: the
			 * resolved block's first line. Lets the applier slide a body that
			 * claims a depth inside the block back across the block's trailing
			 * closer lines (never above this line).
			 */
			blockStart?: number;
	  }
	| { kind: "delete"; anchor: Anchor; lineNum: number; index: number; oldAssertion?: string }
	| {
			/**
			 * Clipboard cut (`CUT N.=M`, or the resolved form of `CUT.BLK N`).
			 * Captures the range's current lines into the {@link Clipboard}
			 * register during the applier's clipboard pre-pass and lowers to one
			 * `delete` per range line at parse/resolve time.
			 */
			kind: "cut";
			range: ParsedRange;
			lineNum: number;
			index: number;
	  }
	| {
			/**
			 * Clipboard insertion (`PASTE.PRE N` / `PASTE.POST N` / `PASTE.HEAD` /
			 * `PASTE.TAIL`, or the resolved form of `PASTE.BLK.POST N`). Expanded
			 * by the clipboard pre-pass into one plain insert per captured line.
			 * `blockStart` mirrors the insert variant's field for block-lowered
			 * pastes so landing correction can slide the body across trailing
			 * closer lines.
			 */
			kind: "paste";
			cursor: Cursor;
			lineNum: number;
			index: number;
			blockStart?: number;
	  }
	| {
			/**
			 * Deferred block edit (`SWAP.BLK N:`, `INS.BLK.POST N:`,
			 * `CUT.BLK N`, or `PASTE.BLK.POST N`). The exact line span is
			 * unknown at parse time; {@link resolveBlockEdits} computes it once
			 * file text and language are available, then expands it into
			 * concrete edits. `mode: "insert_after"` becomes plain
			 * `after_anchor` inserts, `"cut"` becomes a clipboard cut plus
			 * per-line deletes, and `"paste_after"` becomes a paste after the
			 * resolved block. No mode denotes a block replacement.
			 */
			kind: "block";
			anchor: Anchor;
			payloads: string[];
			mode?: "insert_after" | "cut" | "paste_after";
			lineNum: number;
			index: number;
	  };

/** File-level operation parsed from a section body (`REM` / `MV`). */
export type FileOp = { kind: "rem" } | { kind: "move"; dest: string };

/** Result of applying a parsed set of edits to a text body. */
export interface ApplyResult {
	/** Post-edit text body. */
	text: string;
	/** First line number (1-indexed) that changed, or `undefined` for a no-op apply. */
	firstChangedLine?: number;
	/** Diagnostic warnings collected by the parser, patcher, or recovery. */
	warnings?: string[];
	/**
	 * Resolved spans for each block op in this apply, in patch order. Present
	 * only when the apply matched the tagged content, so the line numbers match
	 * what the caller read. Absent when there were no block ops.
	 */
	blockResolutions?: BlockResolution[];
}

/** A parsed `[A.=B]` line range. */
export interface ParsedRange {
	start: Anchor;
	end: Anchor;
}

/** Optional hints for {@link splitPatchInput}. */
export interface SplitOptions {
	/** Resolves absolute paths inside hashline headers to cwd-relative form. */
	cwd?: string;
	/**
	 * Fallback path used when the input lacks a `[PATH]` header but contains
	 * recognizable hashline operations. Lets streaming previews work before
	 * the model has written the header.
	 */
	path?: string;
}

/** Streaming-formatter knobs for {@link streamHashLines}. */
export interface StreamOptions {
	/** First line number to use when formatting (1-indexed, default 1). */
	startLine?: number;
	/** Maximum formatted lines per yielded chunk (default 200). */
	maxChunkLines?: number;
	/** Maximum UTF-8 bytes per yielded chunk (default 64 KiB). */
	maxChunkBytes?: number;
}

/** Result of {@link buildCompactDiffPreview}. */
export interface CompactDiffPreview {
	preview: string;
	addedLines: number;
	removedLines: number;
}

/** Optional knobs for {@link buildCompactDiffPreview}. */
export interface CompactDiffOptions {
	/** Added lines kept on each side of a long added-run elision (default 2). */
	maxAddedRunContext?: number;
	/** Back-compat alias for {@link maxAddedRunContext}. */
	maxUnchangedRun?: number;
}

/** Resolved 1-indexed inclusive line span of a block target. */
export interface BlockSpan {
	/** First line of the block (1-indexed, inclusive). */
	start: number;
	/** Last line of the block (1-indexed, inclusive). */
	end: number;
}

/**
 * One block-op anchor resolved to its concrete line span. Surfaced on
 * {@link ApplyResult} so the host can echo the resolved range and let the
 * model catch an anchor on the wrong opener.
 */
export interface BlockResolution {
	/** The 1-indexed line the block op was anchored on (the `N`). */
	anchorLine: number;
	/** First line of the resolved span (1-indexed, inclusive). */
	start: number;
	/** Last line of the resolved span (1-indexed, inclusive). */
	end: number;
	/** Which block op produced this resolution. */
	op: "replace" | "insert_after" | "cut" | "paste_after";
}

/** Request handed to a {@link BlockResolver} to resolve one block-op anchor. */
export interface BlockResolverRequest {
	/** Target file path (used to infer language by extension). */
	path: string;
	/** Full text the block must be resolved against (the snapshot the tag names). */
	text: string;
	/** 1-indexed line the block must begin on. */
	line: number;
}

/**
 * Resolves a block-op anchor to the line span of the syntactic block beginning
 * on that line. Returns `null` for an unsupported language, invalid line, absent
 * opener, or syntax error. The host injects the tree-sitter-backed implementation.
 */
export type BlockResolver = (request: BlockResolverRequest) => BlockSpan | null;

/**
 * Mutable clipboard register threaded through one patch application. Filled
 * by `CUT` edits and read by `PASTE` edits in patch source order, across
 * sections, so content can move between files. Create one per batch (`{}`)
 * and hand it to every {@link Patcher.prepare} / `applyTo` call in that batch;
 * callers that omit it get a private per-call register.
 */
export interface Clipboard {
	/** Lines captured by the most recent `CUT`, or unset. */
	lines?: readonly string[];
}
