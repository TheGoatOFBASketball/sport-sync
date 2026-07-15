// __patch_years.js — surgical patcher for the years() helper.
//   Old helper: /\d+/  (matches anywhere; "-1" returns 1, "5 yrs" returns 5 — both OK)
//   New helper: /^(\d+)/  (anchored; "-1" returns 0, "5 yrs" still returns 5)
//   New behavior: console.warn on non-empty non-numeric string coerced to 0
//   Rationale: empty/null/whitespace = missing data (silent); "Rookie" / "—"
//   = author typo (loud).
const fs = require('fs');
const path = require('path');

const TARGETS = ['nba-contracts.html', 'nba.html'].map(p =>
  path.join('/home/numberc/Desktop/sports sync', p),
);

const OLD = `function y(v){if(typeof v==="number"&&Number.isFinite(v))return Math.max(0,Math.round(v));if(v==null)return 0;const s=String(v);const m=s.match(/\\d+/);return m?Math.max(0,parseInt(m[0],10)):0}`;

const NEW = `function y(v){if(typeof v==="number"&&Number.isFinite(v))return Math.max(0,Math.round(v));if(v==null||!String(v).trim())return 0;const s=String(v);const m=s.match(/^(\\d+)/);if(m)return Math.max(0,parseInt(m[1],10));console.warn("[__faNormalize.years] Non-numeric value coerced to 0:",JSON.stringify(v));return 0}`;

let totalReplaced = 0;
for (const file of TARGETS) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes(OLD)) {
    console.log(`[skip] ${file} — old helper not found`);
    continue;
  }
  const occurrences = src.split(OLD).length - 1;
  src = src.split(OLD).join(NEW);
  fs.writeFileSync(file, src);
  totalReplaced += occurrences;
  console.log(`[ok]   ${file} — replaced ${occurrences} occurrence(s)`);
}
console.log(`\nTotal replacements: ${totalReplaced}`);
