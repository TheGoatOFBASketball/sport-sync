// /home/numberc/Desktop/sports sync/__build_fa_com.js
//
// Final mapper: takes the cached __NEXT_DATA__ candidate JSON
// (224 raw NBA.com free agent records) and emits the user-schema JSON.
//
// Re-runs in <1s. No browser launch.
//
// NBA.com raw shape per record (verified):
//   playerDisplayName, position ("G"|"F"|"C"|"G-F"|"F-G"|"C-F"|"F-C"),
//   oldTeamId ("1610612743", or "0"), newTeamId ("0" if unsigned),
//   age (int), exp (int years), type ("ufa"|"rfa"),
//   isPlayerOption, isTeamOption, isTwoWayFreeAgent (bools),
//   oldTeamAbbr — EMPTY in JSON (we map oldTeamId → abbrev instead),
//   newTeamAbbr — EMPTY in JSON (signings not yet propagated to JSON).
//
// User target schema:
//   { name, pos, age, prior, priorSalary, years, faType, birdRights, status }

const fs = require('fs');
const path = require('path');

const SRC = '/tmp/fa-fetch/_nextdata_fa_candidate.json';
const OUT = path.join(__dirname, '__nba_com_free_agents_full.json');

// NBA.com team IDs are stable; 31 IDs (30 NBA teams + a phantom "0")
const TEAM_ID_TO_ABBR = {
  '1610612737': 'ATL', '1610612738': 'BOS', '1610612751': 'BKN',
  '1610612766': 'CHA', '1610612741': 'CHI', '1610612739': 'CLE',
  '1610612742': 'DAL', '1610612743': 'DEN', '1610612765': 'DET',
  '1610612744': 'GSW', '1610612745': 'HOU', '1610612754': 'IND',
  '1610612746': 'LAC', '1610612747': 'LAL', '1610612763': 'MEM',
  '1610612748': 'MIA', '1610612749': 'MIL', '1610612750': 'MIN',
  '1610612762': 'NOP', '1610612752': 'NYK', '1610612760': 'OKC',
  '1610612753': 'ORL', '1610612755': 'PHI', '1610612756': 'PHX',
  '1610612757': 'POR', '1610612758': 'SAC', '1610612759': 'SAS',
  '1610612761': 'TOR', '1610612764': 'WAS',
  '1610612762': 'NOP', // alias (NBA.com uses 162 for NOP)
  '1610612763': 'MEM', // alias (Memphis uses 763 historically)
};

// Map raw short position → user's two-position code
const POS_MAP = {
  G: 'PG/SG',
  F: 'PF/SF',
  C: 'C',
  'G-F': 'SG/SF',
  'F-G': 'SF/PF',
  'C-F': 'C/PF',
  'F-C': 'PF/C',
};

// NBA.com URL slug → abbrev (fallback if oldTeamId lookup fails)
const SLUG_TO_ABBR = {
  hawks: 'ATL', celtics: 'BOS', nets: 'BKN', hornets: 'CHA', bulls: 'CHI',
  cavaliers: 'CLE', 'trail-blazers': 'POR', pistons: 'DET', pacers: 'IND',
  bucks: 'MIL', raptors: 'TOR', '76ers': 'PHI', sixers: 'PHI', wizards: 'WAS',
  knicks: 'NYK', nuggets: 'DEN', timberwolves: 'MIN', thunder: 'OKC',
  blazers: 'POR', jazz: 'UTA', warriors: 'GSW', lakers: 'LAL', clippers: 'LAC',
  suns: 'PHX', kings: 'SAC', mavericks: 'DAL', rockets: 'HOU', grizzlies: 'MEM',
  pelicans: 'NOP', spurs: 'SAS', magic: 'ORL', heat: 'MIA',
};

function teamFromRecord(rec) {
  // 1) Direct via oldTeamId
  if (rec.oldTeamId && TEAM_ID_TO_ABBR[rec.oldTeamId]) return TEAM_ID_TO_ABBR[rec.oldTeamId];
  // 2) Via oldTeamLink URL slug
  if (rec.oldTeamLink) {
    const m = rec.oldTeamLink.match(/\/team\/\d+\/([^/]+)/);
    if (m && SLUG_TO_ABBR[decodeURIComponent(m[1]).toLowerCase()]) {
      return SLUG_TO_ABBR[decodeURIComponent(m[1]).toLowerCase()];
    }
  }
  // 3) If we have an oldTeamAbbr (unlikely per observed data)
  if (rec.oldTeamAbbr && rec.oldTeamAbbr.length === 3) return rec.oldTeamAbbr.toUpperCase();
  return '';
}

function normalizeType(rec) {
  const base = rec.type === 'rfa' ? 'RFA' : 'UFA';
  // Suffix mapping matching user's spec:
  //   ufa+PO → UFA (PO), ufa+TO → UFA (TO), ufa+TW → UFA (TW),
  //   rfa+TW → RFA (TW)
  if (rec.isPlayerOption) return `${base} (PO)`;
  if (rec.isTeamOption) return `${base} (TO)`;
  if (rec.isTwoWayFreeAgent) return `${base} (TW)`;
  return base;
}

function isSigned(rec) {
  // Per probe: newTeamId is "0" for unsigned; "0" / blank for newTeamAbbr.
  if (!rec.newTeamId) return false;
  const id = String(rec.newTeamId);
  if (id === '0' || id === '') return false;
  return !!TEAM_ID_TO_ABBR[id];
}

function newTeamAbbr(rec) {
  if (!isSigned(rec)) return '';
  return TEAM_ID_TO_ABBR[String(rec.newTeamId)] || '';
}

(function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source not found: ${SRC}. Re-run fetch_nba_fa_v2.js first.`);
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  if (!Array.isArray(raw) || raw.length === 0) {
    console.error('Source is not a non-empty array');
    process.exit(3);
  }

  const out = [];
  let unsigned = 0,
    signed = 0,
    withPrior = 0,
    posDist = {};

  for (const r of raw) {
    if (!r) continue;
    const prior = teamFromRecord(r);
    const ntAbbr = newTeamAbbr(r);
    const status = ntAbbr ? `Signed (${ntAbbr})` : 'Unsigned';
    if (prior) withPrior++;
    if (ntAbbr) signed++;
    else unsigned++;
    const posRaw = (r.position || '').trim();
    posDist[posRaw] = (posDist[posRaw] || 0) + 1;

    out.push({
      // user schema — exact field order
      name: (r.playerDisplayName || `${r.playerFirstName || ''} ${r.playerLastName || ''}`.trim()).trim(),
      pos: POS_MAP[posRaw] || posRaw,
      age: r.age || 0,
      prior, // 3-letter abbrev of 2025-26 team
      priorSalary: 0, // not exposed on NBA.com page (filled by Spotrac layer)
      years: r.exp || 0,
      faType: normalizeType(r),
      birdRights: '', // not exposed (filled by Spotrac layer)
      status,
      // extra provenance for downstream merge (will be preserved by Spotrac pass)
      _playerId: r.playerId,
      _slug: r.playerSlug,
      _raw: {
        oldTeamId: r.oldTeamId,
        oldTeamSlug: (r.oldTeamLink || '').match(/\/team\/\d+\/([^/]+)/)?.[1] || '',
        newTeamId: r.newTeamId,
        isPlayerOption: !!r.isPlayerOption,
        isTeamOption: !!r.isTeamOption,
        isTwoWayFreeAgent: !!r.isTwoWayFreeAgent,
        PPG: r.PPG,
        RPG: r.RPG,
        APG: r.APG,
      },
    });
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

  console.log('=====================================================================');
  console.log('NBA.com 2026 free agent tracker — full success');
  console.log('  TOTAL ROWS          :', out.length);
  console.log('  WITH PRIOR          :', withPrior);
  console.log('  SIGNED              :', signed);
  console.log('  UNSIGNED            :', unsigned);
  console.log('  POSITION DIST       :', posDist);
  const faTypeDist = {};
  out.forEach((p) => (faTypeDist[p.faType] = (faTypeDist[p.faType] || 0) + 1));
  console.log('  FATYPE DIST         :', faTypeDist);
  console.log('saved →', OUT);
})();
