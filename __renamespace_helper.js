// __renamespace_helper.js — one-shot migration of the injected faNormalize block.
//   Goals:
//     1. Rename `window.__faNormalize` per-file so collisions between pages are impossible:
//          nba-contracts.html → window.__faNormalizeContracts
//          nba.html           → window.__faNormalizeHub
//     2. Drop the (function(){ ... })() IIFE wrapper around the apply step,
//        replacing with a direct guarded forEach (`if(Array.isArray(...)) ... forEach(...)`).
//   Idempotent: skips files that already reference the new per-file namespace.
const fs = require('fs');
const path = require('path');

const ROOT = '/home/numberc/Desktop/sports sync';

// Per-file dispatch.
const TARGETS = [
  {
    file: 'nba-contracts.html',
    namespace: '__faNormalizeContracts',
    // OLD applyExpr — read fresh from disk unchanged.
    oldApply: `(function(){const a=(typeof FREE_AGENTS!=="undefined")?FREE_AGENTS:null;if(Array.isArray(a))a.forEach(window.__faNormalize);})();`,
    // NEW applyExpr — direct guarded forEach (no IIFE wrapper).
    newApply: `if(Array.isArray(FREE_AGENTS))FREE_AGENTS.forEach(window.__faNormalizeContracts);`,
  },
  {
    file: 'nba.html',
    namespace: '__faNormalizeHub',
    oldApply: `(function(){const d=(typeof NBA_CONTRACTS_DATA!=="undefined")?NBA_CONTRACTS_DATA:null;if(d&&Array.isArray(d.freeAgents))d.freeAgents.forEach(window.__faNormalize);})();`,
    // Optional-chain in the guard preserves the "safe-parent-access" check that
    // the previous `typeof X !== "undefined"` provided, without bringing back an IIFE.
    newApply: `if(Array.isArray(NBA_CONTRACTS_DATA?.freeAgents))NBA_CONTRACTS_DATA.freeAgents.forEach(window.__faNormalizeHub);`,
  },
];

let totalReplaced = 0;

for (const t of TARGETS) {
  const fp = path.join(ROOT, t.file);
  let src = fs.readFileSync(fp, 'utf8');

  // Idempotency: skip if already migrated.
  if (src.includes(`window.${t.namespace}`)) {
    console.log(`[skip] ${t.file} — already namespaced (window.${t.namespace})`);
    continue;
  }

  // Sanity: the marker must be present, otherwise we risk an unrelated match.
  if (!src.includes('__FA_NORMALIZER_INJECTED__')) {
    console.error(`[error] ${t.file} — marker __FA_NORMALIZER_INJECTED__ not found; aborting`);
    process.exit(1);
  }

  // ApplyExpr substitution.
  if (!src.includes(t.oldApply)) {
    console.error(`[error] ${t.file} — could not find IIFE-apply block; aborting`);
    process.exit(1);
  }
  src = src.split(t.oldApply).join(t.newApply);

  // Global rename of the remaining `window.__faNormalize` (which after the
  // applyExpr swap only appears in the helper-assignment line).
  const remainingBefore = (src.match(/window\.__faNormalize\b/g) || []).length;
  src = src.replace(/window\.__faNormalize\b/g, `window.${t.namespace}`);
  const remainingAfter = (src.match(/window\.__faNormalize\b/g) || []).length;

  fs.writeFileSync(fp, src);
  totalReplaced++;
  console.log(
    `[ok]   ${t.file} — namespace → window.${t.namespace}; applyExpr → direct guarded; helper assignment renamed; remaining old refs: ${remainingBefore} → ${remainingAfter}`,
  );
}

console.log(`\nMigrated ${totalReplaced}/${TARGETS.length} file(s).`);
