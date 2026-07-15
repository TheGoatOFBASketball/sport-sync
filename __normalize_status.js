// /home/numberc/Desktop/sports sync/__normalize_status.js
//
// v2: Canonicalizes `status` strings inside FREE_AGENTS arrays for both
//   - nba-contracts.html  (FREE_AGENTS array)
//   - nba.html            (NBA_CONTRACTS_DATA.freeAgents array)
//
// Canonical vocabulary (per user spec):
//   "Unsigned"
//   "Signed (TEAM3LETTER)"
//
// Mapping rules:
//   "Unsigned"                              -> "Unsigned"           (no change)
//   "Pending"                               -> "Unsigned"
//   "Re-signed"                             -> "Signed (prior)"     (re-signed with current team)
//   "Signed"                                -> "Signed (prior)"     (signed; default to prior team)
//   "Signed (X)" where X is 3-letter abbrev -> unchanged
//   "Signed (X)" where X is a full team name/key -> "Signed (<3-letter>)"
//
// Idempotent: running twice produces the same output.
//
// v2 fixes vs v1:
//  • isPlainObjectEntry now matches IMPORTANT keys when UNQUOTED (JS literals
//    typically use `status: "Unsigned"` not `"status": "Unsigned"`).
//  • replaceStatusScalar finds the LAST `status:` match in the block (not
//    the first) to avoid overwriting a nested object's status sub-field.
//  • extractField accepts prior|team|oldTeamAbbreviation as aliases
//    (NBA.com uses different keys across versions).
//  • Removed dead-code entry from TEAM_NAME_TO_ABBREV.

const fs = require('fs');
const path = require('path');

const TEAM_NAME_TO_ABBREV = {
  // Full team names (city + nickname)
  Atlanta: 'ATL', Boston: 'BOS', Brooklyn: 'BKN', Charlotte: 'CHA', Chicago: 'CHI',
  Cleveland: 'CLE', Dallas: 'DAL', Denver: 'DEN', Detroit: 'DET', 'Golden State': 'GSW',
  Houston: 'HOU', Indiana: 'IND', 'LA Clippers': 'LAC', 'Los Angeles Lakers': 'LAL',
  'Los Angeles': 'LAL', Memphis: 'MEM', Miami: 'MIA', Milwaukee: 'MIL', Minnesota: 'MIN',
  'New Orleans': 'NOP', 'New York': 'NYK', 'Oklahoma City': 'OKC', Orlando: 'ORL',
  Philadelphia: 'PHI', Phoenix: 'PHX', Portland: 'POR', Sacramento: 'SAC',
  'San Antonio': 'SAS', Toronto: 'TOR', Utah: 'UTA', Washington: 'WAS',
  // Bare nouns (single-word team names)
  Hawks: 'ATL', Celtics: 'BOS', Nets: 'BKN', Hornets: 'CHA', Bulls: 'CHI',
  Cavaliers: 'CLE', Mavericks: 'DAL', Nuggets: 'DEN', Pistons: 'DET',
  Warriors: 'GSW', Rockets: 'HOU', Pacers: 'IND', Clippers: 'LAC', Lakers: 'LAL',
  Grizzlies: 'MEM', Heat: 'MIA', Bucks: 'MIL', Timberwolves: 'MIN',
  Pelicans: 'NOP', Knicks: 'NYK', Thunder: 'OKC', Magic: 'ORL',
  Suns: 'PHX', 'Trail Blazers': 'POR', Kings: 'SAC', Spurs: 'SAS', Raptors: 'TOR',
  Jazz: 'UTA', Wizards: 'WAS',
  // Alt spellings
  Sixers: 'PHI', Blazers: 'POR',
};

function lookupAbbr(nameRaw) {
  if (!nameRaw) return '';
  const trimmed = String(nameRaw).trim();
  if (/^[A-Z]{2,4}$/.test(trimmed)) return trimmed;
  if (TEAM_NAME_TO_ABBREV[trimmed]) return TEAM_NAME_TO_ABBREV[trimmed];
  for (const [k, v] of Object.entries(TEAM_NAME_TO_ABBREV)) {
    if (k.toLowerCase() === trimmed.toLowerCase()) return v;
  }
  const stripped = trimmed.replace(/[.,]/g, '');
  if (TEAM_NAME_TO_ABBREV[stripped]) return TEAM_NAME_TO_ABBREV[stripped];
  return trimmed;
}

function canonical(status, prior) {
  if (status == null) return prior ? `Signed (${prior})` : 'Unsigned';
  const s = String(status).trim();
  if (s === '') return prior ? `Signed (${prior})` : 'Unsigned';

  if (s === 'Unsigned') return 'Unsigned';
  if (s === 'Pending') return 'Unsigned';

  const m = s.match(/^Signed\s*\((.+)\)\s*$/);
  if (m) {
    const inner = m[1].trim();
    const abbr = lookupAbbr(inner);
    return `Signed (${abbr})`;
  }

  if (s === 'Re-signed' || s === 'Signed') {
    return prior ? `Signed (${prior})` : 'Signed';
  }

  return s;
}

function findArrayBounds(src, marker) {
  const idx = src.indexOf(marker);
  if (idx < 0) return null;
  const bracketIdx = src.indexOf('[', idx);
  if (bracketIdx < 0) return null;
  let depth = 0;
  let pos = bracketIdx;
  let endIdx = -1;
  let inString = false;
  let stringCh = '';
  while (pos < src.length) {
    const c = src[pos];
    if (inString) {
      if (c === '\\') { pos += 2; continue; }
      if (c === stringCh) inString = false;
    } else {
      if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringCh = c;
      } else if (c === '[') depth++;
      else if (c === ']') {
        depth--;
        if (depth === 0) { endIdx = pos; break; }
      }
    }
    pos++;
  }
  if (endIdx < 0) return null;
  return { start: bracketIdx, end: endIdx };
}

// entry block: balance braces w/ depth. Sub-objects are kept INSIDE the block
// so that replaceStatusScalar sees whole-block context.
function getEntryBounds(text, startIdx) {
  let depth = 1;
  let j = startIdx + 1;
  let inS = false,
    sc = '';
  while (j < text.length) {
    const c = text[j];
    if (inS) {
      if (c === '\\') { j += 2; continue; }
      if (c === sc) inS = false;
    } else {
      if (c === '"' || c === "'" || c === '`') { inS = true; sc = c; }
      else if (c === '{') depth++;
      else if (c === '}' && depth === 1) { return j + 1; }
      else if (c === '}') depth--;
    }
    j++;
  }
  return -1;
}

// Match key EITHER quoted OR unquoted (JS object literal style).
//
// `name|prior|status|team|pos|priorSalary|faType|id`
const ENTRY_HINT =
  /(?:["']\b(?:name|prior|status|team|pos|priorSalary|faType|id)\b["']|(?<![A-Za-z_0-9])(?:name|prior|status|team|pos|priorSalary|faType|id)(?![A-Za-z_0-9]))/;

function isPlainObjectEntry(block) {
  return ENTRY_HINT.test(block);
}

// Read value of `key`, accepting both quoted and unquoted key naming.
function extractField(block, key) {
  const re = new RegExp(
    `(?:["']\\b${key}\\b["']|(?<![A-Za-z_0-9])${key}(?![A-Za-z_0-9]))\\s*:\\s*` +
      `("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\\d+(?:\\.\\d+)?|true|false|null)`,
  );
  const m = block.match(re);
  if (!m) return undefined;
  return unquoteOrScalar(m[1]);
}

function unquoteOrScalar(v) {
  if (v.startsWith('"') || v.startsWith("'")) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

// Replace the LAST `status:` scalar value in the block. This protects against
// sub-object status fields (e.g. trade metadata) being inadvertently rewritten.
function replaceStatusScalar(block, newValue) {
  const re = new RegExp(
    `(?:["']\\bstatus\\b["']|(?<![A-Za-z_0-9])status(?![A-Za-z_0-9]))\\s*:\\s*` +
      `("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')`,
    'g',
  );
  let lastMatch = null;
  let m;
  while ((m = re.exec(block)) !== null) lastMatch = m;
  if (!lastMatch) return block;
  const escaped = JSON.stringify(String(newValue));
  return block.slice(0, lastMatch.index) +
    lastMatch[0].slice(0, lastMatch[0].lastIndexOf(lastMatch[1])) +
    escaped +
    block.slice(lastMatch.index + lastMatch[0].length);
}

function getPrior(block) {
  return extractField(block, 'prior')
    ?? extractField(block, 'team')
    ?? extractField(block, 'oldTeamAbbreviation')
    ?? extractField(block, 'oldTeamAbbr');
}

function normalizeArray(text) {
  let out = '';
  let i = 0;
  let totalChanged = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '{') {
      const endIdx = getEntryBounds(text, i);
      if (endIdx < 0) {
        // Couldn't balance — copy rest verbatim
        out += text.slice(i);
        break;
      }
      const block = text.slice(i, endIdx);
      if (isPlainObjectEntry(block)) {
        const prior = getPrior(block);
        const currentStatus = extractField(block, 'status');
        const canonStatus = canonical(currentStatus, prior);
        if (currentStatus !== canonStatus) {
          const newBlock = replaceStatusScalar(block, canonStatus);
          out += newBlock;
          totalChanged++;
        } else {
          out += block;
        }
      } else {
        out += block;
      }
      i = endIdx;
    } else {
      out += ch;
      i++;
    }
  }
  return { text: out, changed: totalChanged };
}

function processFile(filePath, marker) {
  const src = fs.readFileSync(filePath, 'utf8');
  const bounds = findArrayBounds(src, marker);
  if (!bounds) {
    console.log(`  ${path.basename(filePath)}: array bounds NOT FOUND for marker '${marker}'`);
    return { file: filePath, ok: false, changed: 0 };
  }
  const arrayText = src.slice(bounds.start, bounds.end + 1);
  const { text: newArrayText, changed } = normalizeArray(arrayText);
  if (changed === 0) {
    console.log(`  ${path.basename(filePath)}: 0 changes (already canonical)`);
    return { file: filePath, ok: true, changed: 0 };
  }
  const newSrc = src.slice(0, bounds.start) + newArrayText + src.slice(bounds.end + 1);
  fs.writeFileSync(filePath, newSrc);
  console.log(`  ${path.basename(filePath)}: changed ${changed} entries`);
  return { file: filePath, ok: true, changed };
}

(function main() {
  console.log('Normalizing status vocabulary across files (v2)…');
  const r1 = processFile(path.join(__dirname, 'nba-contracts.html'), 'const FREE_AGENTS');
  const r2 = processFile(path.join(__dirname, 'nba.html'), 'freeAgents:');

  // Idempotency check
  console.log('--- Idempotency check (re-run on the just-written files) ---');
  const r1b = processFile(path.join(__dirname, 'nba-contracts.html'), 'const FREE_AGENTS');
  const r2b = processFile(path.join(__dirname, 'nba.html'), 'freeAgents:');
  console.log('Done.');
})();
