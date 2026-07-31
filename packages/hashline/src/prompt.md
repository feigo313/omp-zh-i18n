Line-anchored patch language: name original lines to replace, cut, or insert at, then list new content. A header ending in `:` takes `+` body rows; `CUT`, `PASTE`, `REM`, `MV` take none.

<headers>
Every file section starts `[PATH#TAG]`. `TAG` = 4-hex snapshot tag from your latest `read`/`search` — REQUIRED on every section. Create new files with `write`; hashline only edits existing files.
</headers>

<ops>
`SWAP N.=M:` — replace original lines N.=M (INCLUSIVE).
`SWAP.BLK N:` — replace the whole syntactic block BEGINNING on line N; its closing line is resolved for you.
`CUT N.=M` / `CUT.BLK N` — delete lines N.=M / the block beginning at N, and capture them for `PASTE`.
`INS.PRE N:` / `INS.POST N:` — insert immediately before / after line N.
`INS.BLK.POST N:` — insert after the END of the block beginning at N, outside it at sibling depth. Append inside a block → `INS.POST`.
`INS.HEAD:` / `INS.TAIL:` — insert at the very start / end of the file.
`PASTE.PRE N` / `PASTE.POST N` / `PASTE.HEAD` / `PASTE.TAIL` / `PASTE.BLK.POST N` — insert the clipboard at the position (the clipboard IS the body).
`REM` — delete the whole section file. `MV DEST` — move/rename to `DEST` (quote paths with spaces); edits above `MV` land on the source first, final content written at `DEST`.
Single line: `SWAP N.=N:` / `CUT N`. Range = ORIGINAL lines touched; body length irrelevant (1 line → 10 is still `SWAP N.=N:`).
</ops>

<body-rows>
Only under a `:` header. Every row is `+TEXT`, verbatim (leading whitespace kept); `+` alone = blank line. NEVER `-old` or bare/context rows — the range deletes; the body is only the final content. Keep a line: leave it out of every range. Literal leading `-`/`+` keeps the prefix: `- item` → `+- item`, `+ item` → `++ item`.
</body-rows>

<rules>
- Line numbers + `#TAG` come from your latest `read`/`search` (`LINE:TEXT` rows); numbers name ORIGINAL lines, never shifted by applied hunks.
- Applied edits renumber the file and change the `#TAG` — take the next edit's numbers from the edit response or a fresh `read`.
- Touch only displayed lines — hunks on undisplayed lines are REJECTED. Far from your read window? Re-`read`; confirm numbers map to the intended construct.
- Elided regions are UNSEEN (`…`/`..` markers, collapsed `N-M:` summary rows) — NEVER place or span a hunk inside one; `read` the range first.
- NEVER start or end a range mid-expression or mid-block.
- Ranges cover ONLY changed lines — never widen over keepers. Non-adjacent changes = separate hunks.
- Whole construct → `SWAP.BLK N`; lines inside one → `SWAP N.=M`.
- `SWAP.BLK` resolves EXACTLY the node at N: leading decorators/attributes/doc-comments are separate nodes — point N at the FIRST decorator to sweep both; standalone line-comments are never swept (use `SWAP N.=M`).
- Block ops anchor the OPENING line of a MULTI-LINE construct — never the closer, last line, or a bare inner statement; one statement → plain op (`SWAP N.=N:` / `CUT N` / `INS.POST N:`). Saw the closer? `INS.POST M:`.
- Markdown: a heading IS a block opener — block ops on `##`/`###` resolve the WHOLE section (through deeper nested headings, up to the next same-or-higher heading). `INS.BLK.POST` after a section: end the body with a blank line to keep the next heading separated.
- Pure additions → `INS.PRE`/`INS.POST`/`INS.HEAD`/`INS.TAIL`, never a widened `SWAP`.
- Move code with `CUT`+`PASTE`, never retype. Clipboard: top-to-bottom across the whole patch (cross-file moves), persists across edit calls, latest `CUT` wins, and `PASTE` repeats freely. Pasted indentation is verbatim; re-indent via `SWAP`.
- NEVER format/restyle code with this tool; run the project formatter.
</rules>

<example>
`read` output shape:
```
[greet.py#A1B2]
1:def greet(name):
2:    msg = "Hello, " + name
3:    print(msg)
4:greet("world")
```

Edit, then move:
```
[greet.py#A1B2]
SWAP 1.=3:
+def greet(name):
+    print(f"Hi, {name}")
MV lib/greet.py
```

Markdown bullets — the file receives `- task`:
```
[PLAN.md#A1B2]
INS.POST 2:
+- task
+  - nested task
```

Move `greet` to a sibling file — clipboard flows across sections:
```
[greet.py#A1B2]
CUT.BLK 1
[other.py#3C4D]
PASTE.HEAD
```

`SWAP.BLK 1:` resolves lines 1–3 (`def` header through `print(msg)`); line 4 is a separate statement and stays:
```
[greet.py#A1B2]
SWAP.BLK 1:
+def greet(name):
+    print(f"Hello, {name}")
```

Decorator/doc-comment = SEPARATE block — point N at the decorator to take both; anchoring the `def` (line 2) would orphan `@cache`:
```
[svc.py#C3D4]
SWAP.BLK 1:
+@cache
+def load(key):
+    return store[key]
```
</example>

<anti-patterns>
# WRONG — empty `SWAP` to delete. RIGHT: CUT 4
SWAP 4.=4:

# WRONG — range sized to the post-edit content. RIGHT: SWAP 1.=1: (body length irrelevant)
SWAP 1.=2:
+def greet(name):

# WRONG — `-` rows / bare context lines do not exist; the range deletes, the body is only new content.
SWAP 3.=3:
    msg = "Hello, " + name
-   print(msg)
+   return msg
# RIGHT
SWAP 3.=3:
+   return msg

# WRONG — pure insertion as a widened `SWAP`: retyped keepers get dropped (here line 4).
SWAP 2.=4:
+    msg = "Hello, " + name
+    extra = compute(name)
+    print(msg)
# RIGHT — touch nothing you keep.
INS.POST 2:
+    extra = compute(name)

# WRONG — `INS.BLK.POST` anchored on the closing delimiter / last visible line. RIGHT: plain `INS.POST M:`
INS.BLK.POST 3:
+after()
# RIGHT
INS.POST 3:
+after()

# WRONG — body rows under PASTE; the clipboard is the body. RIGHT: capture first, then a bodyless `PASTE.POST 20`.
PASTE.POST 20:
+function f() {}
</anti-patterns>

<critical>
1. RE-GROUND AFTER EVERY EDIT — applied edits renumber the file and change the `#TAG`; take next numbers from the edit response or a fresh `read`. Stale tag or surprise? STOP, re-`read`.
2. RANGES ARE TIGHT — cover only lines that change. Whole construct → `SWAP.BLK N`.
3. BODY = FINAL CONTENT — every body row starts with `+`; Markdown bullets use `+- item`, not `- item`.
</critical>
