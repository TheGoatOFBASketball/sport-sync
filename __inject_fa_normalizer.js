// /home/numberc/Desktop/sports sync/__inject_fa_normalizer.js
//
// Injects an idempotent runtime normalizer for FREE_AGENTS data in TWO files:
//   - nba-contracts.html  : FREE_AGENTS array            → window.__faNormalizeContracts
//   - nba.html            : NBA_CONTRACTS_DATA.freeAgents → window.__faNormalizeHub
//
// What it does:
//   • Adds a per-file namespaced normalizer that, given a free-agent object,
//     normalizes:
//       faType → canonical "UFA"|"RFA"|"UFA (PO)"|"UFA (TO)"|"UFA (TW)"|"RFA (TW)"
//       pos    → canonical "PG/SG"|"PF/SF"|"C"|"SG/SF"|"SF/PF"|"C/PF"|"PF/C"
//       years  → integer (parseInt anchored at /^(\d+)/, default 0 if absent,
//                console.warn on non-empty non-numeric values).
//
//   • After declaring the array, runs a one-time pass that applies the
//     normalizer in place via a DIRECT guarded forEach (`if(Array.isArray(...))`),
//     not an IIFE wrapper. The helper *definition* is still an IIFE so its
//     `POS` table and inner functions stay private to the closure.
//
//   • Idempotent: re-running produces byte-identical output.
//
//   • Per-file namespace ensures no `window.__faNormalize` collision across
//     pages that happen to share a runtime (e.g. an iframe or a unified bundle).

const fs = require('fs');
const path = require('path');

const MARKER = '// __FA_NORMALIZER_INJECTED__';

// ---- Per-file dispatch (namespace, marker, applyExpr) ----
//
// `helperPrefix` keys the global the helper assigns to. The helper IIFE
// (`(()=>{...})()`) stays because it's structural (private scope for POS, f, p, y).
// Only the OUTER applyExpr wrapper was previously an IIFE — it has been replaced
// with a direct guarded forEach.

const TARGETS = [
  {
    file: 'nba-contracts.html',
    helperPrefix: 'window.__faNormalizeContracts',
    arrayMarker: 'const FREE_AGENTS',
    applyExpr:
      'if(Array.isArray(FREE_AGENTS))FREE_AGENTS.forEach(window.__faNormalizeContracts);',
  },
  {
    file: 'nba.html',
    helperPrefix: 'window.__faNormalizeHub',
    arrayMarker: 'freeAgents:',
    // Optional chain in the guard preserves the old "safe-parent-access" check
    // that the previous `typeof X !== "undefined"` provided.
    applyExpr:
      'if(Array.isArray(NBA_CONTRACTS_DATA?.freeAgents))NBA_CONTRACTS_DATA.freeAgents.forEach(window.__faNormalizeHub);',
  },
];

// ---- Helper IIFE (private scope; assigns to helperPrefix at runtime) ----
//
// Years() — anchored at start of string; warns on non-empty non-numeric typos.
const HELPER_BODY_INTERIOR =
  'const POS={G:"PG/SG",F:"PF/SF",C:"C","G-F":"SG/SF","F-G":"SF/PF","C-F":"C/PF","F-C":"PF/C"};' +
  'function f(v){if(v==null)return v;const s=String(v).trim().toLowerCase();if(!s)return v;' +
  'if(s==="ufa")return"UFA";if(s==="rfa")return"RFA";if(s==="ufa 1")return"UFA (PO)";' +
  'if(s==="ufa 2")return"UFA (TO)";if(s==="ufa 4"||s==="two-way ufa")return"UFA (TW)";' +
  'if(s==="rfa 4"||s==="two-way rfa")return"RFA (TW)";return v}' +
  'function p(v){if(!v)return v;const s=String(v).trim();return POS[s]||s}' +
  'function y(v){if(typeof v==="number"&&Number.isFinite(v))return Math.max(0,Math.round(v));' +
  'if(v==null||!String(v).trim())return 0;' +
  'const s=String(v);' +
  'const m=s.match(/^(\\d+)/);' +
  'if(m)return Math.max(0,parseInt(m[1],10));' +
  'console.warn("[__faNormalize.years] Non-numeric value coerced to 0:",JSON.stringify(v));' +
  'return 0}' +
  'return function normalize(o){if(!o||typeof o!=="object")return;o.faType=f(o.faType);o.pos=p(o.pos);o.years=y(o.years)}';

function buildHelperLine(helperPrefix) {
  return `${helperPrefix}=(()=>{${HELPER_BODY_INTERIOR};})();`;
}

// findArrayBounds — returns {start, end} indices (inclusive) of an array's
// outermost [...] span, given a marker prefix.
function findArrayBounds(src, marker) {
  const idx = src.indexOf(marker);
  if (idx < 0) return null;
  let bracket = -1;
  for (let i = idx; i < src.length; i++) {
    if (src[i] === '[') { bracket = i; break; }
    if (src[i] === ';' || src[i] === '\n') break;
  }
  if (bracket < 0) return null;
  let depth = 0;
  let pos = bracket;
  let inString = false;
  let stringCh = '';
  let inLineComment = false;
  let inBlockComment = false;
  while (pos < src.length) {
    const c = src[pos];
    const next = src[pos + 1] || '';
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      pos++;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; pos += 2; continue; }
      pos++;
      continue;
    }
    if (inString) {
      if (c === '\\') { pos += 2; continue; }
      if (c === stringCh) inString = false;
      pos++;
      continue;
    }
    if (c === '/' && next === '/') { inLineComment = true; pos += 2; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; pos += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringCh = c; pos++; continue; }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return { start: bracket, end: pos };
    }
    pos++;
  }
  return null;
}

function processFile(spec) {
  const file = path.join(__dirname, spec.file);
  let src = fs.readFileSync(file, 'utf8');

  if (src.includes(MARKER)) {
    console.log(`  ${spec.file}: marker present — skipping (idempotent)`);
    return { file: spec.file, ok: true, changed: 0 };
  }

  const bounds = findArrayBounds(src, spec.arrayMarker);
  if (!bounds) {
    console.log(`  ${spec.file}: array bounds not found for marker '${spec.arrayMarker}'`);
    return { file: spec.file, ok: false };
  }

  // Find end-of-line after `];` so we can insert on a fresh line.
  let at = bounds.end + 1;
  while (at < src.length && (src[at] === ' ' || src[at] === '\t')) at++;
  if (src[at] === ';') at += 1;
  while (at < src.length && src[at] !== '\n' && at < src.length) at++;
  // `at` now points at the newline character (or end-of-file). Insert right before it.

  const injection =
    `\n${MARKER}\n${buildHelperLine(spec.helperPrefix)}\n${spec.applyExpr}\n`;

  const newSrc = src.slice(0, at) + injection + src.slice(at);
  fs.writeFileSync(file, newSrc);
  console.log(
    `  ${spec.file}: injected ${injection.length} chars → ${spec.helperPrefix}`,
  );
  return { file: spec.file, ok: true, changed: injection.length };
}

(function main() {
  console.log('Injecting runtime faType / pos / years normalizer…');
  for (const spec of TARGETS) processFile(spec);
  console.log('Done.');
})();
