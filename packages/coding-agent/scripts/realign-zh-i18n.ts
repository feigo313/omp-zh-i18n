#!/usr/bin/env bun
/**
 * realign-zh-i18n.ts — i18n 中文重新对齐工具
 *
 * 模式: report | settings --apply | commands --apply | quality
 *
 * 硬编码路径: packages/coding-agent/src/i18n/lang
 * Bun only; never write ~/.omp/lang; never call extract/generate/translate/gen-i18n-keys.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

// ── Constants ──
const LANG_DIR = join(import.meta.dir, "..", "src", "i18n", "lang");
const BACKUP_DIR = join(LANG_DIR, "_backup", "2026-07-23-pre-realign");
const ARCHIVE_DIR = join(LANG_DIR, "_archive");

const CATEGORIES = [
  "shell",
  "files",
  "memory",
  "appearance",
  "tasks",
  "providers",
  "model",
  "interaction",
  "context",
  "tools",
] as const;

type Category = (typeof CATEGORIES)[number];

// ── JSON parsing with duplicate key detection ──
function parseJsonDetectDupes(filePath: string): Record<string, string> {
  const text = readFileSync(filePath, "utf-8");
  // Strip BOM and trailing commas for safety
  const clean = text.replace(/^\uFEFF/, "").replace(/,\s*([}\]])/g, "$1");
  const result: Record<string, string> = {};
  const keys: string[] = [];
  // Use object_pairs_hook pattern: parse, check for dups
  const obj = JSON.parse(clean) as Record<string, string>;
  for (const k of Object.keys(obj)) {
    keys.push(k);
  }
  // Detect duplicates by re-scanning raw text
  const keyPattern = /"([^"\\]|\\.)*"\s*:/g;
  let match;
  const rawKeys: string[] = [];
  while ((match = keyPattern.exec(clean)) !== null) {
    const keyStr = match[0].slice(0, -1).trim();
    if (keyStr.startsWith('"')) {
      rawKeys.push(JSON.parse(keyStr));
    }
  }
  const seen = new Map<string, number>();
  for (const k of rawKeys) {
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  const dupes: string[] = [];
  for (const [k, count] of seen) {
    if (count > 1) dupes.push(k);
  }
  if (dupes.length > 0) {
    console.error(`  ⚠ DUPLICATE KEYS in ${basename(filePath)}: ${dupes.join(", ")}`);
  }
  return obj;
}

function loadJson(dir: string, name: string): Record<string, string> {
  return parseJsonDetectDupes(join(dir, name));
}

function loadBackupZhSettings(): Record<string, string> {
  const union: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const name = `zh-settings-${cat}.json`;
    const p = join(BACKUP_DIR, name);
    if (!existsSync(p)) continue;
    const obj = loadJson(BACKUP_DIR, name);
    for (const [k, v] of Object.entries(obj)) {
      if (!(k in union)) union[k] = v;
    }
  }
  return union;
}

// ── Placeholders check ──
function extractPlaceholders(val: string): string[] {
  const ph: string[] = [];
  // %s, %d, %f
  const percentMatches = val.match(/%[sdf]/g);
  if (percentMatches) ph.push(...percentMatches);
  // {name} style
  const braceMatches = val.match(/\{[^}]+\}/g);
  if (braceMatches) ph.push(...braceMatches);
  // {{var}} style
  const doubleBrace = val.match(/\{\{[^}]+\}\}/g);
  if (doubleBrace) ph.push(...doubleBrace);
  return ph.sort();
}

function placeholderMatch(a: string, b: string): boolean {
  const pa = extractPlaceholders(a);
  const pb = extractPlaceholders(b);
  if (pa.length !== pb.length) return false;
  for (let i = 0; i < pa.length; i++) {
    if (pa[i] !== pb[i]) return false;
  }
  return true;
}

// ── Whitelist: zh==en allowed ──
const WHITELIST_PATTERNS = [
  // Brand/protocol terms (no spaces, technical)
  /^(?:Unicode|ASCII|Powerline|MCP|LSP|TTSR|Julia|Python|Ruby|JavaScript|Bash|Julia|Kitty|OSC|ANSI|IPython|ACP|OAuth|SSH|JSON|YAML|HTTP|HTTPS|URI|URL|PNG|WAV|HTML|CSS|JS|TS|GH|PR|CLI|GUI|TUI|API|SDK|LTS|MIT|GPL|AGPL|WAL|VHS|BOM|UTF-8|JetBrainsMono|Nerd|KITT|Knight Rider)$/i,
  // Token-like (no spaces, alphanumeric + limited punctuation)
  /^[a-zA-Z0-9%./+\-_*@#]+$/,
  // Powerline arrows / symbols
  /^[\uE0B0-\uE0BF\uE700-\uE8FF]/,
  // Numeric + unit
  /^\d+\s*(?:ms|%|px|MB|GB|KB)?$/,
];

function isWhitelistedZhEn(val: string): boolean {
  // Empty string is NOT whitelisted
  if (val === "") return false;
  // No spaces → likely a token/identifier
  if (!val.includes(" ")) return true;
  // Check patterns
  for (const p of WHITELIST_PATTERNS) {
    if (p.test(val)) return true;
  }
  // Single word (no lowercase letters = likely proper noun)
  if (!/[a-z]/.test(val)) return true;
  return false;
}

// ── Report mode ──
function cmdReport() {
  console.log("═══ i18n zh realign report ═══\n");

  // Settings report
  const settingsReport: Record<string, { en: number; zh: number; missing: string[]; extra: string[]; misplaced: string[]; orphan: string[] }> = {};
  let totalEn = 0,
    totalZh = 0,
    totalMissing = 0,
    totalExtra = 0;

  for (const cat of CATEGORIES) {
    const en = loadJson(LANG_DIR, `en-settings-${cat}.json`);
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    const enKeys = new Set(Object.keys(en));
    const zhKeys = new Set(Object.keys(zh));
    const missing = [...enKeys].filter((k) => !zhKeys.has(k));
    const extra = [...zhKeys].filter((k) => !enKeys.has(k));

    // Check misplaced: extra key exists in another en-settings category
    const misplaced: string[] = [];
    const orphan: string[] = [];
    for (const k of extra) {
      let foundElsewhere = false;
      for (const otherCat of CATEGORIES) {
        if (otherCat === cat) continue;
        const otherEn = loadJson(LANG_DIR, `en-settings-${otherCat}.json`);
        if (k in otherEn) {
          foundElsewhere = true;
          break;
        }
      }
      if (foundElsewhere) misplaced.push(k);
      else orphan.push(k);
    }

    settingsReport[cat] = { en: enKeys.size, zh: zhKeys.size, missing, extra, misplaced, orphan };
    totalEn += enKeys.size;
    totalZh += zhKeys.size;
    totalMissing += missing.length;
    totalExtra += extra.length;
  }

  console.log("Settings (10 categories):");
  console.log("Category        EN   ZH   miss  extra  misplaced  orphan");
  for (const cat of CATEGORIES) {
    const r = settingsReport[cat];
    console.log(
      `${cat.padEnd(15)} ${String(r.en).padStart(4)} ${String(r.zh).padStart(4)} ${String(r.missing.length).padStart(5)} ${String(r.extra.length).padStart(6)} ${String(r.misplaced.length).padStart(10)} ${String(r.orphan.length).padStart(7)}`
    );
  }
  console.log(`${"TOTAL".padEnd(15)} ${String(totalEn).padStart(4)} ${String(totalZh).padStart(4)} ${String(totalMissing).padStart(5)} ${String(totalExtra).padStart(6)}`);

  // Commands report
  const enCmd = loadJson(LANG_DIR, "en-commands.json");
  const zhCmd = loadJson(LANG_DIR, "zh-commands.json");
  const enCmdKeys = new Set(Object.keys(enCmd));
  const zhCmdKeys = new Set(Object.keys(zhCmd));
  const cmdMissing = [...enCmdKeys].filter((k) => !zhCmdKeys.has(k));
  const cmdExtra = [...zhCmdKeys].filter((k) => !enCmdKeys.has(k));

  console.log(`\nCommands:`);
  console.log(`  EN keys: ${enCmdKeys.size}`);
  console.log(`  ZH keys: ${zhCmdKeys.size}`);
  console.log(`  Missing: ${cmdMissing.length}`);
  console.log(`  Extra: ${cmdExtra.length}`);

  // N1: Cross-file same key different value
  console.log("\n═══ N1: Cross-file same key, different value ═══");
  const allSettingsKeys: Record<string, { values: Record<Category, string>; categories: Category[] }> = {};
  for (const cat of CATEGORIES) {
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    for (const [k, v] of Object.entries(zh)) {
      if (!allSettingsKeys[k]) {
        allSettingsKeys[k] = { values: {} as Record<Category, string>, categories: [] };
      }
      allSettingsKeys[k].values[cat] = v;
      allSettingsKeys[k].categories.push(cat);
    }
  }
  let n1Count = 0;
  for (const [k, info] of Object.entries(allSettingsKeys)) {
    if (info.categories.length < 2) continue;
    const vals = new Set(info.categories.map((c) => info.values[c]));
    if (vals.size > 1) {
      n1Count++;
      if (n1Count <= 30) {
        console.log(`  ${k}:`);
        for (const c of info.categories) {
          console.log(`    [${c}] ${info.values[c].substring(0, 80)}`);
        }
      }
    }
  }
  console.log(`  Total cross-file value diffs: ${n1Count}`);

  // Empty strings in zh
  console.log("\n═══ Empty strings in zh ═══");
  let emptyCount = 0;
  for (const cat of CATEGORIES) {
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    for (const [k, v] of Object.entries(zh)) {
      if (v === "") {
        emptyCount++;
        console.log(`  zh-settings-${cat}: ${k}`);
      }
    }
  }
  const zhCmdEmpty = Object.entries(zhCmd).filter(([, v]) => v === "");
  emptyCount += zhCmdEmpty.length;
  for (const [k] of zhCmdEmpty) {
    console.log(`  zh-commands: ${k}`);
  }
  console.log(`  Total empty: ${emptyCount}`);

  // Duplicate keys in zh
  console.log("\n═══ Duplicate keys in zh files ═══");
  for (const f of readdirSync(LANG_DIR).filter((f) => f.startsWith("zh-") && f.endsWith(".json"))) {
    parseJsonDetectDupes(join(LANG_DIR, f));
  }

  // zh==en queue
  console.log("\n═══ zh==en (non-whitelisted) ═══");
  let zhEnCount = 0;
  for (const cat of CATEGORIES) {
    const en = loadJson(LANG_DIR, `en-settings-${cat}.json`);
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    for (const [k, ev] of Object.entries(en)) {
      if (k in zh && zh[k] === ev && !isWhitelistedZhEn(ev)) {
        zhEnCount++;
        console.log(`  zh-settings-${cat}: ${k} = "${ev.substring(0, 60)}"`);
      }
    }
  }
  for (const [k, ev] of Object.entries(enCmd)) {
    if (k in zhCmd && zhCmd[k] === ev && !isWhitelistedZhEn(ev)) {
      zhEnCount++;
      console.log(`  zh-commands: ${k} = "${ev.substring(0, 60)}"`);
    }
  }
  console.log(`  Total non-whitelisted zh==en: ${zhEnCount}`);
}

// ── Settings --apply mode ──
function cmdSettingsApply() {
  console.log("═══ settings --apply ═══\n");
  mkdirSync(ARCHIVE_DIR, { recursive: true });

  // Load backup union for salvage
  const backupUnion = loadBackupZhSettings();

  for (const cat of CATEGORIES) {
    const en = loadJson(LANG_DIR, `en-settings-${cat}.json`);
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    const enKeys = Object.keys(en);
    const zhKeys = Object.keys(zh);

    // Archive extras
    const extras = zhKeys.filter((k) => !enKeys.includes(k));
    if (extras.length > 0) {
      const archiveObj: Record<string, string> = {};
      for (const k of extras) archiveObj[k] = zh[k];
      const archivePath = join(ARCHIVE_DIR, `orphan-settings-${cat}.json`);
      const archiveMeta = {
        _provenance: {
          source: `zh-settings-${cat}.json`,
          timestamp: new Date().toISOString(),
          reason: `extra-vs-en-${cat}`,
        },
      };
      writeFileSync(archivePath, JSON.stringify({ ...archiveMeta, ...archiveObj }, null, 2) + "\n");
    }

    // Build new zh
    const newZh: Record<string, string> = {};
    const salvaged: string[] = [];
    const emptyQueue: string[] = [];

    for (const k of enKeys) {
      if (k in zh && zh[k] !== "") {
        newZh[k] = zh[k];
      } else if (k in backupUnion && backupUnion[k] !== "") {
        newZh[k] = backupUnion[k];
        salvaged.push(k);
      } else {
        newZh[k] = "";
        emptyQueue.push(k);
      }
    }

    // Write
    writeFileSync(join(LANG_DIR, `zh-settings-${cat}.json`), JSON.stringify(newZh, null, 2) + "\n");

    // Verify
    const newKeys = Object.keys(newZh);
    const keyMatch = newKeys.length === enKeys.length && newKeys.every((k) => enKeys.includes(k));
    console.log(
      `[${cat}] EN:${enKeys.length} ZH:${newKeys.length} archive:${extras.length} salvaged:${salvaged.length} empty:${emptyQueue.length} keys_match:${keyMatch}`
    );
    if (salvaged.length > 0) console.log(`  salvaged: ${salvaged.slice(0, 10).join(", ")}${salvaged.length > 10 ? "..." : ""}`);
    if (emptyQueue.length > 0) console.log(`  empty_queue: ${emptyQueue.join(", ")}`);
  }
}

// ── Commands --apply mode ──
function cmdCommandsApply() {
  console.log("═══ commands --apply ═══\n");
  mkdirSync(ARCHIVE_DIR, { recursive: true });

  const en = loadJson(LANG_DIR, "en-commands.json");
  const zh = loadJson(LANG_DIR, "zh-commands.json");
  const backupUnion = loadBackupZhSettings();

  const enKeys = Object.keys(en);
  const zhKeys = Object.keys(zh);

  // Archive extras
  const extras = zhKeys.filter((k) => !enKeys.includes(k));
  if (extras.length > 0) {
    const archiveObj: Record<string, string> = {};
    for (const k of extras) archiveObj[k] = zh[k];
    const archivePath = join(ARCHIVE_DIR, "zh-commands-extra.json");
    const archiveMeta = {
      _provenance: {
        source: "zh-commands.json",
        timestamp: new Date().toISOString(),
        reason: "extra-vs-en-commands",
      },
    };
    writeFileSync(archivePath, JSON.stringify({ ...archiveMeta, ...archiveObj }, null, 2) + "\n");
  }

  // Build new zh
  const newZh: Record<string, string> = {};
  const salvaged: string[] = [];
  const emptyQueue: string[] = [];
  const groupsSalvaged: { key: string; backupVal: string; enVal: string }[] = [];

  for (const k of enKeys) {
    if (k in zh && zh[k] !== "") {
      newZh[k] = zh[k];
    } else if (k.startsWith("tabs.") && k.includes(".groups.") && /\.\d+$/.test(k)) {
      // groups.N salvage: check backup union
      if (k in backupUnion && backupUnion[k] !== "") {
        const backupVal = backupUnion[k];
        const enVal = en[k];
        // Semantic check: if backup value looks like a translation of en value
        // (not identical to en, and not obviously wrong)
        if (backupVal !== enVal) {
          newZh[k] = backupVal;
          salvaged.push(k);
          groupsSalvaged.push({ key: k, backupVal, enVal });
        } else {
          // backup == en → not a real translation, use empty
          newZh[k] = "";
          emptyQueue.push(k);
        }
      } else {
        newZh[k] = "";
        emptyQueue.push(k);
      }
    } else if (k in backupUnion && backupUnion[k] !== "") {
      newZh[k] = backupUnion[k];
      salvaged.push(k);
    } else {
      newZh[k] = "";
      emptyQueue.push(k);
    }
  }

  // Write
  writeFileSync(join(LANG_DIR, "zh-commands.json"), JSON.stringify(newZh, null, 2) + "\n");

  // Verify
  const newKeys = Object.keys(newZh);
  const keyMatch = newKeys.length === enKeys.length && newKeys.every((k) => enKeys.includes(k));

  console.log(`[commands] EN:${enKeys.length} ZH:${newKeys.length} archive:${extras.length} salvaged:${salvaged.length} empty:${emptyQueue.length} keys_match:${keyMatch}`);
  if (groupsSalvaged.length > 0) {
    console.log(`\n  groups.N salvage diff (key | backup | en):`);
    for (const g of groupsSalvaged) {
      console.log(`    ${g.key} | "${g.backupVal.substring(0, 50)}" | "${g.enVal.substring(0, 50)}"`);
    }
  }
  if (emptyQueue.length > 0) {
    console.log(`\n  empty_queue (${emptyQueue.length}): ${emptyQueue.join(", ")}`);
  }
}

// ── Quality mode ──
function cmdQuality() {
  console.log("═══ quality ═══\n");

  // 1. Empty strings
  console.log("── 1. Empty strings ──");
  let emptyCount = 0;
  for (const cat of CATEGORIES) {
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    for (const [k, v] of Object.entries(zh)) {
      if (v === "") {
        emptyCount++;
        console.log(`  zh-settings-${cat}: ${k}`);
      }
    }
  }
  const zhCmd = loadJson(LANG_DIR, "zh-commands.json");
  for (const [k, v] of Object.entries(zhCmd)) {
    if (v === "") {
      emptyCount++;
      console.log(`  zh-commands: ${k}`);
    }
  }
  console.log(`  Total empty: ${emptyCount}\n`);

  // 2. Placeholder parity
  console.log("── 2. Placeholder parity ──");
  let phMismatch = 0;
  for (const cat of CATEGORIES) {
    const en = loadJson(LANG_DIR, `en-settings-${cat}.json`);
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    for (const [k, ev] of Object.entries(en)) {
      if (k in zh && zh[k] !== "" && !placeholderMatch(ev, zh[k])) {
        phMismatch++;
        console.log(`  zh-settings-${cat}: ${k}`);
        console.log(`    EN placeholders: ${extractPlaceholders(ev).join(" ") || "(none)"}`);
        console.log(`    ZH placeholders: ${extractPlaceholders(zh[k]).join(" ") || "(none)"}`);
      }
    }
  }
  for (const [k, ev] of Object.entries(loadJson(LANG_DIR, "en-commands.json"))) {
    if (k in zhCmd && zhCmd[k] !== "" && !placeholderMatch(ev, zhCmd[k])) {
      phMismatch++;
      console.log(`  zh-commands: ${k}`);
      console.log(`    EN placeholders: ${extractPlaceholders(ev).join(" ") || "(none)"}`);
      console.log(`    ZH placeholders: ${extractPlaceholders(zhCmd[k]).join(" ") || "(none)"}`);
    }
  }
  console.log(`  Total mismatch: ${phMismatch}\n`);

  // 3. zh==en non-whitelisted
  console.log("── 3. zh==en (non-whitelisted) ──");
  let zhEnCount = 0;
  for (const cat of CATEGORIES) {
    const en = loadJson(LANG_DIR, `en-settings-${cat}.json`);
    const zh = loadJson(LANG_DIR, `zh-settings-${cat}.json`);
    for (const [k, ev] of Object.entries(en)) {
      if (k in zh && zh[k] === ev && !isWhitelistedZhEn(ev)) {
        zhEnCount++;
        console.log(`  zh-settings-${cat}: ${k} = "${ev.substring(0, 80)}"`);
      }
    }
  }
  for (const [k, ev] of Object.entries(loadJson(LANG_DIR, "en-commands.json"))) {
    if (k in zhCmd && zhCmd[k] === ev && !isWhitelistedZhEn(ev)) {
      zhEnCount++;
      console.log(`  zh-commands: ${k} = "${ev.substring(0, 80)}"`);
    }
  }
  console.log(`  Total: ${zhEnCount}`);
}

// ── Main ──
const args = process.argv.slice(2);
const mode = args[0];
const flag = args[1];

if (!mode || !["report", "settings", "commands", "quality"].includes(mode)) {
  console.error("Usage: bun realign-zh-i18n.ts <report|settings|commands|quality> [--apply]");
  console.error("  report           Show baseline statistics");
  console.error("  settings --apply Rebuild zh-settings by EN keys");
  console.error("  commands --apply Rebuild zh-commands by EN keys");
  console.error("  quality          Check empty/placeholder/zh==en");
  process.exit(1);
}

switch (mode) {
  case "report":
    cmdReport();
    break;
  case "settings":
    if (flag !== "--apply") {
      console.error("Usage: bun realign-zh-i18n.ts settings --apply");
      process.exit(1);
    }
    cmdSettingsApply();
    break;
  case "commands":
    if (flag !== "--apply") {
      console.error("Usage: bun realign-zh-i18n.ts commands --apply");
      process.exit(1);
    }
    cmdCommandsApply();
    break;
  case "quality":
    cmdQuality();
    break;
}
