// scripts/copy-public.js
//
// Vercel CLI enforces that after the build step, `outputDirectory` exists
// with at least one shippable file. The repo keeps runtime assets at the
// project root (no compile step), so this script mirrors the shippable
// subset into ./public/ so Vercel can verify and serve it. The source file
// layout is unchanged — only the deploy bundle moves.
//
// Run from project root: `node scripts/copy-public.js`
// (also wired up as Vercel's `buildCommand` AND as `package.json`'s `build`
//  script — both must stay in lockstep or the deploy will fall back to a
//  no-op and serve an empty public/. Do not edit one without the other.)
//

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public");

// Wipe + recreate so removed files don't linger in the deploy bundle.
// Intentionally destructive — this directory is regenerated each build.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Directories we never ship — backend code, browser extension, dev caches,
// and the build/deploy plumbing itself.
const SKIP_DIRS = new Set([
  "node_modules",
  ".vercel",
  ".git",
  ".github",
  "backend",
  "extension",
  "katana",
  "__pycache__",
  "scripts", // this build script + future build helpers
  "public",  // recurse guard (RMT'd above, but defensive)
]);

// Top-level files we never ship — configs, deploy bookkeeping, bookkeeping.
const SKIP_FILES = new Set([
  "vercel.json",
  "package.json",
  "package-lock.json",
  ".gitignore",
  ".vercelignore",
  ".DS_Store",
  "README.md",
  "readme.html",
  "nba.html.bak",
  "nba.html.bak2",
  "output.json",
]);

// Whitelist of extensions the browser loads directly. Using a whitelist
// (not a blacklist) so adding new hostile files (e.g. *.sh) doesn't leak
// them into the deployed bundle by accident.
const SHIPPABLE_EXT = new Set([
  ".html",
  ".css",
  ".js",
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".ico",
  ".json",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
]);

// Anything inside a directory whose name starts with `__` is treated as a
// throwaway debug artifact (matches `.vercelignore` patterns). Keeping the
// same convention here so the two ignore layers stay aligned. We check
// the basename, NOT the full relative path, so `assets/__scratch/` is
// still skipped even though `rel` is `assets/__scratch`.
function shouldSkipDir(rel) {
  if (SKIP_DIRS.has(rel)) return true;
  const base = path.basename(rel);
  return base.startsWith("__");
}

function copy(src, rel) {
  // lstatSync (not statSync) so symlinks are detected instead of followed.
  // A symlink loop on disk would otherwise recurse forever and OOM the build.
  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) {
    // Skip symlinks outright — Vercel serves VCS-tracked files only, so
    // between-build symlinks shouldn't appear here; if they do, treat as
    // out of scope rather than chase them.
    return;
  }
  if (stat.isDirectory()) {
    if (shouldSkipDir(rel)) return;
    fs.mkdirSync(path.join(OUT, rel), { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copy(path.join(src, entry), path.join(rel, entry));
    }
    return;
  }
  if (SKIP_FILES.has(rel)) return;
  const ext = path.extname(rel).toLowerCase();
  if (!SHIPPABLE_EXT.has(ext)) return;
  fs.copyFileSync(src, path.join(OUT, rel));
}

for (const entry of fs.readdirSync(ROOT)) {
  copy(path.join(ROOT, entry), entry);
}

// Surface a small summary so the user can verify the bundle at a glance
// in the Vercel build log.
const shipped = fs.readdirSync(OUT, { recursive: true }).length;
console.log(
  `[copy-public] mirrored ${shipped} entries into ${path.relative(
    ROOT,
    OUT,
  )}/`,
);
