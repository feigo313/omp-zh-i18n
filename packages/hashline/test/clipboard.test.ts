import { describe, expect, it } from "bun:test";
import {
	applyEdits,
	type BlockResolver,
	type BlockSpan,
	type Clipboard,
	computeFileHash,
	InMemoryFilesystem,
	InMemorySnapshotStore,
	Patch,
	Patcher,
	parsePatch,
	parsePatchStreaming,
	resolveBlockEdits,
} from "@oh-my-pi/hashline";

const PATH = "x.ts";

// Deterministic stub: the block beginning on line N spans [N, N+1].
const stubResolver: BlockResolver = ({ line }): BlockSpan => ({ start: line, end: line + 1 });

function taggedPatcher(files: Array<[string, string]>): {
	fs: InMemoryFilesystem;
	snapshots: InMemorySnapshotStore;
	patcher: Patcher;
	tags: Map<string, string>;
} {
	const fs = new InMemoryFilesystem(files);
	const snapshots = new InMemorySnapshotStore();
	const tags = new Map<string, string>();
	for (const [path, text] of files) tags.set(path, snapshots.record(path, text));
	return { fs, snapshots, patcher: new Patcher({ fs, snapshots }), tags };
}

describe("clipboard parsing", () => {
	it("lowers `CUT N.=M` to a capture plus per-line deletes", () => {
		const cut = parsePatch("CUT 2.=3").edits;
		expect(cut.map(edit => edit.kind)).toEqual(["cut", "delete", "delete"]);
		expect(cut[0]).toMatchObject({ kind: "cut", range: { start: { line: 2 }, end: { line: 3 } } });
	});

	it("parses every PASTE position, tolerating a trailing colon", () => {
		const cursors = parsePatch("CUT 1\nPASTE.PRE 2\nPASTE.POST 3:\nPASTE.HEAD\nPASTE.TAIL:").edits.flatMap(edit =>
			edit.kind === "paste" ? [edit.cursor] : [],
		);
		expect(cursors).toEqual([
			{ kind: "before_anchor", anchor: { line: 2 } },
			{ kind: "after_anchor", anchor: { line: 3 } },
			{ kind: "bof" },
			{ kind: "eof" },
		]);
	});

	it("rejects bare `PASTE` without a position", () => {
		expect(() => parsePatch("PASTE")).toThrow(/`PASTE` needs a position/);
	});

	it("rejects body rows under clipboard ops", () => {
		expect(() => parsePatch("CUT 1.=2\n+x")).toThrow(/`CUT N.=M` captures \+ deletes/);
		expect(() => parsePatch("CUT 1\nPASTE.POST 1\n+x")).toThrow(/`PASTE` inserts the clipboard content/);
	});

	it("rejects a CUT range overlapping another hunk's range", () => {
		expect(() => parsePatch("CUT 2.=4\nSWAP 3.=3:\n+x")).toThrow(/already targeted by another hunk/);
	});

	it("reports inverted CUT ranges with op-specific retry forms", () => {
		expect(() => parsePatch("CUT 5.=2")).toThrow(/`CUT 5`.*`CUT 5.=6`/);
	});

	it("flushes a trailing bodyless clipboard op in streaming mode", () => {
		const { edits } = parsePatchStreaming("CUT 1\nPASTE.TAIL");
		expect(edits.map(edit => edit.kind)).toEqual(["cut", "delete", "paste"]);
	});
});

describe("clipboard apply semantics", () => {
	it("moves a range within a file (CUT + PASTE)", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT 2.=3\nPASTE.POST 5`);
		expect(section.applyTo("l1\nl2\nl3\nl4\nl5\n").text).toBe("l1\nl4\nl5\nl2\nl3\n");
	});

	it("repeats CUT content without consuming the clipboard", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT 2.=2\nPASTE.HEAD\nPASTE.TAIL`);
		expect(section.applyTo("l1\nl2\nl3\n").text).toBe("l2\nl1\nl3\nl2\n");
	});

	it("swaps two regions with sequential CUT/PASTE pairs on original coordinates", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT 1.=2\nPASTE.POST 4\nCUT 3.=4\nPASTE.PRE 1`);
		expect(section.applyTo("a1\na2\nb1\nb2").text).toBe("b1\nb2\na1\na2");
	});

	it("rejects PASTE with an empty register", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nPASTE.POST 1`);
		expect(() => section.applyTo("l1\nl2\n")).toThrow(/found nothing in the clipboard/);
	});

	it("drops an empty-register PASTE on the streaming-tolerant path", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nPASTE.POST 1`);
		expect(section.applyPartialTo("l1\nl2\n").text).toBe("l1\nl2\n");
	});

	it("allows a CUT without a following PASTE", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT 2.=2`);
		expect(section.applyTo("l1\nl2\nl3\n").text).toBe("l1\nl3\n");
	});

	it("allows consecutive CUTs and pastes the latest capture", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT 1.=1\nCUT 3.=3\nPASTE.TAIL`);
		expect(section.applyTo("l1\nl2\nl3\n").text).toBe("l2\nl3\n");
	});

	it("rejects an out-of-range capture", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT 8.=9\nPASTE.HEAD`);
		expect(() => section.applyTo("l1\nl2\n")).toThrow(/out of range \(file has 3 lines\)/);
	});

	it("threads a caller-owned register across applyEdits calls", () => {
		const clipboard: Clipboard = {};
		const cut = parsePatch("CUT 1.=1").edits;
		const paste = parsePatch("PASTE.TAIL").edits;
		expect(applyEdits("a\nb", cut, { clipboard }).text).toBe("b");
		expect(applyEdits("x\ny", paste, { clipboard }).text).toBe("x\ny\na");
	});
});

describe("clipboard block ops", () => {
	it("expands CUT.BLK to a span capture plus per-line deletes", () => {
		const edits = parsePatch("CUT.BLK 2\nPASTE.TAIL").edits;
		const resolved = resolveBlockEdits(edits, "l1\nl2\nl3\nl4", PATH, stubResolver);
		expect(resolved.map(edit => edit.kind)).toEqual(["cut", "delete", "delete", "paste"]);
		expect(resolved[0]).toMatchObject({ kind: "cut", range: { start: { line: 2 }, end: { line: 3 } } });
	});

	it("moves a block after another block via PASTE.BLK.POST", () => {
		const section = Patch.parseSingle(`[${PATH}#1A2B]\nCUT.BLK 1\nPASTE.BLK.POST 3`);
		// stub blocks: [1,2] and [3,4].
		expect(section.applyTo("a1\na2\nb1\nb2\nrest", stubResolver).text).toBe("b1\nb2\na1\na2\nrest");
	});

	it("echoes clipboard block resolutions with their op", () => {
		const seen: string[] = [];
		resolveBlockEdits(parsePatch("CUT.BLK 2\nPASTE.TAIL").edits, "l1\nl2\nl3", PATH, stubResolver, {
			onResolved: resolution => seen.push(resolution.op),
		});
		expect(seen).toEqual(["cut"]);
	});

	it("rejects a single-line CUT.BLK resolution with the plain-op retry", () => {
		const single: BlockResolver = ({ line }): BlockSpan => ({ start: line, end: line });
		const edits = parsePatch("CUT.BLK 2\nPASTE.TAIL").edits;
		expect(() => resolveBlockEdits(edits, "a\nb\nc", PATH, single)).toThrow(/use `CUT 2`/);
	});

	it("lowers an unresolvable PASTE.BLK.POST to a plain paste with a warning", () => {
		const warnings: string[] = [];
		const resolved = resolveBlockEdits(parsePatch("CUT 1\nPASTE.BLK.POST 2").edits, "a\nb\nc", PATH, () => null, {
			onWarning: warning => warnings.push(warning),
		});
		expect(resolved.map(edit => edit.kind)).toEqual(["cut", "delete", "paste"]);
		expect(warnings.some(warning => warning.includes("`PASTE.BLK.POST 2`"))).toBe(true);
	});
});

describe("clipboard across sections and batches", () => {
	it("moves lines between files within one patch", async () => {
		const a = "keep\nmove1\nmove2\n";
		const b = "b1\n";
		const { fs, patcher, tags } = taggedPatcher([
			["a.ts", a],
			["b.ts", b],
		]);

		const patch = Patch.parse(`[a.ts#${tags.get("a.ts")}]\nCUT 2.=3\n[b.ts#${tags.get("b.ts")}]\nPASTE.TAIL`);
		await patcher.apply(patch);

		expect(fs.get("a.ts")).toBe("keep\n");
		expect(fs.get("b.ts")).toBe("b1\nmove1\nmove2\n");
	});

	it("applies a batch-local CUT without requiring PASTE", async () => {
		const a = "l1\nl2\n";
		const { fs, patcher, tags } = taggedPatcher([["a.ts", a]]);

		await patcher.apply(Patch.parse(`[a.ts#${tags.get("a.ts")}]\nCUT 1.=1`));
		expect(fs.get("a.ts")).toBe("l2\n");
	});

	it("persists a host-owned register across apply calls", async () => {
		const a = "l1\nl2\n";
		const b = "b1\n";
		const fs = new InMemoryFilesystem([
			["a.ts", a],
			["b.ts", b],
		]);
		const snapshots = new InMemorySnapshotStore();
		const tagA = snapshots.record("a.ts", a);
		const tagB = snapshots.record("b.ts", b);
		const clipboard: Clipboard = {};
		const patcher = new Patcher({ fs, snapshots, clipboard });

		const first = await patcher.apply(Patch.parse(`[a.ts#${tagA}]\nCUT 1.=1`));
		expect(fs.get("a.ts")).toBe("l2\n");
		expect(first.sections[0]?.warnings).toEqual([]);
		expect(clipboard).toEqual({ lines: ["l1"] });

		await patcher.apply(Patch.parse(`[b.ts#${tagB}]\nPASTE.TAIL`));
		expect(fs.get("b.ts")).toBe("b1\nl1\n");
		expect(clipboard).toEqual({ lines: ["l1"] });
	});

	it("does not publish register changes from a failed batch", async () => {
		const a = "l1\nl2\n";
		const b = "b1\n";
		const fs = new InMemoryFilesystem([
			["a.ts", a],
			["b.ts", b],
		]);
		const snapshots = new InMemorySnapshotStore();
		const tagA = snapshots.record("a.ts", a);
		snapshots.record("b.ts", b);
		const clipboard: Clipboard = {};
		const patcher = new Patcher({ fs, snapshots, clipboard });

		// Second section carries a bogus tag, so the batch fails in prepare.
		const patch = Patch.parse(`[a.ts#${tagA}]\nCUT 1.=1\n[b.ts#0000]\nSWAP 1.=1:\n+x`);
		await expect(patcher.apply(patch)).rejects.toThrow();

		expect(fs.get("a.ts")).toBe(a);
		expect(clipboard.lines).toBeUndefined();
	});

	it("recovers clipboard anchors when the file drifted by a uniform offset", async () => {
		const original = "x1\nx2\nx3\n";
		const live = "new\nx1\nx2\nx3\n";
		const fs = new InMemoryFilesystem([["a.ts", live]]);
		const snapshots = new InMemorySnapshotStore();
		const tag = snapshots.record("a.ts", original);
		const patcher = new Patcher({ fs, snapshots });

		const result = await patcher.apply(Patch.parse(`[a.ts#${tag}]\nCUT 2.=2\nPASTE.TAIL`));

		expect(fs.get("a.ts")).toBe("new\nx1\nx3\nx2\n");
		expect(result.sections[0]?.warnings.length).toBeGreaterThan(0);
	});

	it("rejects clipboard ops in same-path sections interleaved across another file", () => {
		const patch = Patch.parse(`[a.ts#1A2B]\nCUT 1.=1\n[b.ts#3C4D]\nSWAP 1.=1:\n+x\n[a.ts#1A2B]\nPASTE.TAIL`);
		expect(() => patch.sections[0]?.edits).toThrow(/interleaved with another file/);
	});

	it("still merges interleaved same-path sections without clipboard ops", () => {
		const patch = Patch.parse(
			`[a.ts#1A2B]\nSWAP 1.=1:\n+a1\n[b.ts#3C4D]\nSWAP 1.=1:\n+b1\n[a.ts#1A2B]\nSWAP 3.=3:\n+a3`,
		);
		expect(patch.sections).toHaveLength(2);
		expect(patch.sections[0]?.edits.map(edit => edit.kind)).toEqual(["insert", "delete", "insert", "delete"]);
	});

	it("surfaces a targeted sequencing error instead of a mismatch on the drift path", async () => {
		const original = "x1\nx2\nx3\n";
		const live = "new\nx1\nx2\nx3\n";
		const fs = new InMemoryFilesystem([["a.ts", live]]);
		const snapshots = new InMemorySnapshotStore();
		const tag = snapshots.record("a.ts", original);
		const patcher = new Patcher({ fs, snapshots });

		// PASTE with nothing captured, against a drifted tag: the recovery path
		// swallows apply errors, so the sequencing check must fire first.
		await expect(patcher.apply(Patch.parse(`[a.ts#${tag}]\nPASTE.POST 2\nCUT 2.=2`))).rejects.toThrow(
			/found nothing in the clipboard/,
		);
	});
});

describe("clipboard header hash interplay", () => {
	it("applies a paste-only section on the clean-tag fast path", async () => {
		const text = "l1\nl2\n";
		const fs = new InMemoryFilesystem([["a.ts", text]]);
		const snapshots = new InMemorySnapshotStore();
		expect(computeFileHash(text)).toBe(snapshots.record("a.ts", text));
		const clipboard: Clipboard = { lines: ["from-before"] };
		const patcher = new Patcher({ fs, snapshots, clipboard });

		await patcher.apply(Patch.parse(`[a.ts#${computeFileHash(text)}]\nPASTE.POST 1`));
		expect(fs.get("a.ts")).toBe("l1\nfrom-before\nl2\n");
	});
});
