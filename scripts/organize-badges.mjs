#!/usr/bin/env node
// scripts/organize-badges.mjs
// Usage examples:
//   node scripts/organize-badges.mjs --src public --dest public/badges --version v1 --apply
//   node scripts/organize-badges.mjs --src public --dest public/badges --version v1 --apply --manifest
//   node scripts/organize-badges.mjs --src public --dest public/badges --version v1 --dry
//
// What it does:
// - Scans for image files in --src (default: public)
// - Picks files that look like badge assets (configurable heuristics)
// - Normalizes filenames to snake_case badgeIds
// - Moves into public/badges/<version>/<rarity>/badge_id.ext
// - Optionally generates/updates public/badges/manifest.json
//
// Notes:
// - By default all go to "common" unless rarity can be inferred from the path/name.
// - This is safe-by-default: dry run unless --apply is provided.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, def = null) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return def;
  const val = args[idx + 1];
  if (!val || val.startsWith("--")) return true;
  return val;
};

const SRC = String(flag("src", "public"));
const DEST = String(flag("dest", "public/badges"));
const VERSION = String(flag("version", "v1"));
const APPLY = Boolean(flag("apply", false));
const DRY = Boolean(flag("dry", !APPLY));
const WRITE_MANIFEST = Boolean(flag("manifest", false));
const VERBOSE = Boolean(flag("verbose", false));
const INCLUDE_GIFS = Boolean(flag("include-gifs", true));

const EXT_OK = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ...(INCLUDE_GIFS ? [".gif"] : [])]);
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const DEFAULT_RARITY = String(flag("default-rarity", "common"));

const BADGE_DIR = path.join(DEST, VERSION);
const UI_DIR = path.join(BADGE_DIR, "ui");

function log(...x) {
  // eslint-disable-next-line no-console
  console.log(...x);
}
function vlog(...x) {
  if (VERBOSE) log(...x);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isInside(p, rootAbs) {
  const rel = path.relative(rootAbs, p);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip our destination to avoid reprocessing
      if (full.includes(path.join("public", "badges"))) continue;
      walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function normalizeBadgeId(filenameNoExt) {
  // strip common prefixes
  let s = filenameNoExt
    .replace(/^badge[-_ ]?/i, "")
    .replace(/^icon[-_ ]?/i, "")
    .replace(/^img[-_ ]?/i, "")
    .replace(/@2x$/i, "")
    .replace(/_2x$/i, "")
    .replace(/-2x$/i, "");

  // convert camelCase -> snake_case
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2");

  // replace separators with underscore
  s = s.replace(/[\s\-\.]+/g, "_");

  // remove non-url-safe chars
  s = s.replace(/[^a-zA-Z0-9_]/g, "");

  // collapse underscores
  s = s.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

  return s.toLowerCase();
}

function inferRarity(filePath) {
  const lower = filePath.toLowerCase();

  // if already in a rarity-named folder
  for (const r of RARITIES) {
    const marker = path.sep + r + path.sep;
    if (lower.includes(marker)) return r;
  }

  // simple name hints
  if (/(legend|mythic|god)/i.test(lower)) return "legendary";
  if (/(epic)/i.test(lower)) return "epic";
  if (/(rare)/i.test(lower)) return "rare";
  if (/(uncommon)/i.test(lower)) return "uncommon";
  if (/(common)/i.test(lower)) return "common";

  return DEFAULT_RARITY;
}

function looksLikeBadgeAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXT_OK.has(ext)) return false;

  const lower = filePath.toLowerCase();

  // avoid moving meme pool / unrelated large pools
  if (lower.includes(`${path.sep}horny-meme-pool${path.sep}`)) return false;
  if (lower.includes(`${path.sep}fonts${path.sep}`)) return false;

  // heuristics: path or name contains "badge" or "badges" or "achievement" or "trophy"
  const name = path.basename(lower);
  const hasHint =
    lower.includes(`${path.sep}badge`) ||
    lower.includes(`${path.sep}badges${path.sep}`) ||
    name.includes("badge") ||
    name.includes("achievement") ||
    name.includes("trophy") ||
    name.includes("medal");

  // if you already have a badge folder somewhere, treat all its images as badge assets
  const inBadgeFolder = lower.includes(`${path.sep}badges${path.sep}`) || lower.includes(`${path.sep}badge${path.sep}`);

  return hasHint || inBadgeFolder;
}

function safeMove(src, dest) {
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) {
    throw new Error(`Destination exists: ${dest}`);
  }
  fs.renameSync(src, dest);
}

function makeUniqueDest(destPath) {
  if (!fs.existsSync(destPath)) return destPath;
  const dir = path.dirname(destPath);
  const ext = path.extname(destPath);
  const base = path.basename(destPath, ext);
  let i = 2;
  while (true) {
    const candidate = path.join(dir, `${base}__${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    i++;
  }
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return { version: VERSION, basePath: `/badges/${VERSION}`, badges: {} };
  }
  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return { version: VERSION, basePath: `/badges/${VERSION}`, badges: {} };
  }
}

function writeManifest(manifestPath, manifestObj) {
  ensureDir(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, JSON.stringify(manifestObj, null, 2) + "\n", "utf8");
}

function main() {
  const srcAbs = path.resolve(SRC);
  const destAbs = path.resolve(DEST);

  if (!fs.existsSync(srcAbs)) {
    log(`❌ Source not found: ${srcAbs}`);
    process.exit(1);
  }

  ensureDir(BADGE_DIR);
  for (const r of RARITIES) ensureDir(path.join(BADGE_DIR, r));
  ensureDir(UI_DIR);

  const allFiles = walk(srcAbs);
  const candidates = allFiles.filter(looksLikeBadgeAsset);

  // Only process files that are not already in destination
  const toProcess = candidates.filter((f) => !isInside(path.resolve(f), destAbs));

  log(`Found ${candidates.length} badge-like assets. Processing ${toProcess.length} (excluding already in ${DEST}).`);
  if (DRY) log(`Mode: DRY RUN (use --apply to move files)`);

  const manifestPath = path.join(DEST, "manifest.json");
  const manifest = WRITE_MANIFEST ? readManifest(manifestPath) : null;

  const moved = [];
  const skipped = [];

  for (const srcFile of toProcess) {
    const rel = path.relative(srcAbs, srcFile);
    const ext = path.extname(srcFile).toLowerCase();
    const baseName = path.basename(srcFile, ext);

    const badgeId = normalizeBadgeId(baseName);
    if (!badgeId) {
      skipped.push({ srcFile, reason: "empty badgeId after normalization" });
      continue;
    }

    const rarity = inferRarity(srcFile);
    const destFileName = `${badgeId}${ext}`;
    const destPathBase = path.join(BADGE_DIR, rarity, destFileName);
    const destPath = makeUniqueDest(destPathBase);

    vlog(`→ ${rel}  =>  ${path.relative(process.cwd(), destPath)}`);

    if (!DRY) {
      try {
        safeMove(srcFile, destPath);
      } catch (e) {
        skipped.push({ srcFile, reason: String(e?.message ?? e) });
        continue;
      }
    }

    moved.push({
      id: badgeId,
      rarity,
      src: srcFile,
      dest: destPath,
      url: `/badges/${VERSION}/${rarity}/${path.basename(destPath)}`,
    });

    if (WRITE_MANIFEST && manifest) {
      // If already exists, keep existing rarity/file unless you want overwrite
      if (!manifest.badges[badgeId]) {
        manifest.badges[badgeId] = { rarity, file: `${rarity}/${path.basename(destPath)}` };
      }
    }
  }

  // Write manifest
  if (WRITE_MANIFEST && manifest) {
    manifest.version = VERSION;
    manifest.basePath = `/badges/${VERSION}`;
    if (!DRY) writeManifest(manifestPath, manifest);
    log(`${DRY ? "Would write" : "Wrote"} manifest: ${manifestPath}`);
  }

  // Summary
  log(`\nSummary:`);
  log(`  moved:   ${moved.length}`);
  log(`  skipped: ${skipped.length}`);

  if (skipped.length && VERBOSE) {
    log("\nSkipped details:");
    for (const s of skipped) log(`  - ${s.srcFile} :: ${s.reason}`);
  }

  if (moved.length) {
    log(`\nExample output (first 10):`);
    for (const m of moved.slice(0, 10)) {
      log(`  ${path.relative(process.cwd(), m.dest)}  ->  ${m.url}`);
    }
  }

  if (DRY) {
    log(`\nDry run finished. Re-run with --apply to actually move files.`);
  } else {
    log(`\nDone.`);
  }
}

main();

