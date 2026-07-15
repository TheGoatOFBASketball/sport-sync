#!/usr/bin/env python3
"""One-shot refactor of /home/numberc/Desktop/sports sync/nba.html team-cap section.

Steps:
  1. Backup original to __nba.html.before.py
  2. Replace the 4-key league config (salaryCap/luxuryTax/apron1/apron2) with
     a single LEAGUE_CAP = { cap, lt, apr1, apr2 } sub-object (keeps the old keys
     as backwards-compat aliases for renderCapBanner).
  3. Replace the 30 team objects with real 2025-26 Spotrac committed salary data
     plus derived space / overUnder fields. Each new team carries:
       {name, abbr, conf, payroll, committed, space, overUnder}
     payroll mirrors committed for any legacy code that may still read it.
  4. Rewrite renderTeamCapCards() to consume LEAGUE_CAP and the new fields, with
     proper severity lapping (apron > tax > cap > under).
"""
import os, re, sys

F = "/home/numberc/Desktop/sports sync/nba.html"
BAK = "/home/numberc/Desktop/sports sync/__nba.html.before.py"

# 1) Backup
with open(F, "rb") as fh:
    raw = fh.read()
with open(BAK, "wb") as fh:
    fh.write(raw)
text = raw.decode("utf-8")
print(f"[read] {len(text)} bytes; backup at {BAK}")

# ----------------------------------------------------------------------------
# 2) Config block
# ----------------------------------------------------------------------------
old_cfg = (
    "  salaryCap: 154647000,  // 2025-26 actuals from NBA.com\n"
    "  // TODO: 30 per-team cap/lt/apron rows below all carry the SAME league-wide values;\n"
    "  //       replace with actual 2025-26 team payrolls (committed $, space $, etc.) per team.\n"
    "  luxuryTax: 187895000,\n"
    "  apron1: 195945000,\n"
    "  apron2: 207824000,\n"
)
new_cfg = (
    "  // 2025-26 official figures from NBA.com (refresh each offseason)\n"
    "  LEAGUE_CAP: { cap: 154647000, lt: 187895000, apr1: 195945000, apr2: 207824000 },\n"
    "  // Backwards-compat aliases (renderCapBanner still uses d.salaryCap/etc.)\n"
    "  salaryCap: 154647000, luxuryTax: 187895000, apron1: 195945000, apron2: 207824000,\n"
)
assert old_cfg in text, "config block not found - file may already be refactored"
text = text.replace(old_cfg, new_cfg, 1)
print(f"[OK]   config block: {len(old_cfg)} -> {len(new_cfg)} chars")

# ----------------------------------------------------------------------------
# 3) 30-team array swap with real 2025-26 data (public facts from cap-trackers)
# ----------------------------------------------------------------------------
TEAMS = [
    ("Atlanta Hawks","ATL","East",193255583),
    ("Boston Celtics","BOS","East",194526296),
    ("Brooklyn Nets","BKN","East",150960352),
    ("Charlotte Hornets","CHA","East",183806358),
    ("Chicago Bulls","CHI","East",187673271),
    ("Cleveland Cavaliers","CLE","East",226181970),
    ("Dallas Mavericks","DAL","West",200372430),
    ("Denver Nuggets","DEN","West",200743895),
    ("Detroit Pistons","DET","East",193082507),
    ("Golden State Warriors","GSW","West",234222725),
    ("Houston Rockets","HOU","West",201412484),
    ("Indiana Pacers","IND","East",191900207),
    ("LA Clippers","LAC","West",199054230),
    ("Los Angeles Lakers","LAL","West",211399497),
    ("Memphis Grizzlies","MEM","West",157650285),
    ("Miami Heat","MIA","East",197952062),
    ("Milwaukee Bucks","MIL","East",182099997),
    ("Minnesota Timberwolves","MIN","West",228841297),
    ("New Orleans Pelicans","NOP","West",207453274),
    ("New York Knicks","NYK","East",209823691),
    ("Oklahoma City Thunder","OKC","West",188057857),
    ("Orlando Magic","ORL","East",194063614),
    ("Philadelphia 76ers","PHI","East",199898431),
    ("Phoenix Suns","PHX","West",207796989),
    ("Portland Trail Blazers","POR","West",195706145),
    ("Sacramento Kings","SAC","West",213853369),
    ("San Antonio Spurs","SAS","West",183990669),
    ("Toronto Raptors","TOR","East",194966020),
    ("Utah Jazz","UTA","West",173117343),
    ("Washington Wizards","WAS","East",232033397),
]
CAP = 154647000
parts = [
    f'  {{name:"{n}",abbr:"{a}",conf:"{c}",payroll:{committed},committed:{committed},space:{max(0,CAP-committed)},overUnder:{committed-CAP}}}'
    for n,a,c,committed in TEAMS
]
new_teams = "  teams: [\n" + ",\n".join(parts) + "\n  ]"

# locate the existing teams array and walk to its closing bracket using brace depth
m = re.search(r'^  teams: \[', text, re.MULTILINE)
assert m, "teams anchor missing"
i, depth = m.end(), 0
in_str = None
end = -1
n = len(text)
while i < n:
    ch = text[i]
    if in_str:
        if ch == "\\": i += 2; continue
        if ch == in_str: in_str = None
        i += 1; continue
    if ch in ('"', "'"): in_str = ch; i += 1; continue
    if ch == "{": depth += 1
    elif ch == "}": depth -= 1
    elif ch == "]" and depth == 0: end = i; break
    i += 1
assert end > m.start(), "no team-array close bracket"

trailing = text[end+1:end+2]
old_len = end - m.start() + 1
text = text[:m.start()] + new_teams + ("," if trailing == "," else "") + text[end+1:]
text = re.sub(r",+,", ",", text)  # collapse any double commas
print(f"[OK]   teams array: replaced {old_len} -> {len(new_teams)} chars (30 teams)")

# ----------------------------------------------------------------------------
# 4) Rewrite renderTeamCapCards
# ----------------------------------------------------------------------------
pat = re.compile(r"^function renderTeamCapCards\(teams\)\{[\s\S]*?\n\}", re.MULTILINE)
m = pat.search(text)
assert m, "renderTeamCapCards function not found"

new_render = (
    "function renderTeamCapCards(teams){\n"
    "  const grid=document.getElementById('teamCapGrid');\n"
    "  if(!grid)return;\n"
    "  const C=NBA_CONTRACTS_DATA.LEAGUE_CAP;\n"
    "  grid.innerHTML=teams.map(t=>{\n"
    "    const overApron=t.committed>C.apr2;\n"
    "    const overTax  =t.committed>C.lt;\n"
    "    const overCap  =t.committed>C.cap;\n"
    "    const pct=Math.min((t.committed/C.apr2)*100,100);\n"
    "    const fillColor=overApron?'#b80e28':overTax?'#e67800':overCap?'#c8a000':'#005a30';\n"
    "    const spaceLabel=t.overUnder>=0\n"
    "      ? ('<span class=\"tcc-val over\">-' + formatSalary(t.overUnder) + '</span>')\n"
    "      : ('<span class=\"tcc-val under\">'  + formatSalary(t.space)     + '</span>');\n"
    "    return '<div class=\"team-cap-card\"><div class=\"tcc-header\">'+\n"
    "      teamLogoHTML(t.abbr,32)+'<div><div class=\"tcc-name\">'+t.name+'</div><div class=\"tcc-conf\">'+t.conf+'</div></div></div>'+\n"
    "      '<div class=\"tcc-row\"><span class=\"tcc-label\">Committed</span><span class=\"tcc-val '+(overApron?'over':overTax?'warning':overCap?'warning':'')+'\">'+formatSalary(t.committed)+'</span></div>'+\n"
    "      '<div class=\"tcc-row\"><span class=\"tcc-label\">'+(t.overUnder>=0?'Over Cap':'Cap Space')+'</span>'+spaceLabel+'</div>'+\n"
    "      '<div class=\"tcc-bar-wrap\"><div class=\"tcc-bar-label\"><span>Cap Used</span><span>'+Math.round(pct)+'%</span></div>'+\n"
    "      '<div class=\"tcc-bar-track\"><div class=\"tcc-bar-fill\" style=\"width:'+pct+'%;background:'+fillColor+'\"></div></div></div></div>';\n"
    "  }).join('');\n"
    "}"
)
text = text[:m.start()] + new_render + text[m.end():]
print(f"[OK]   renderTeamCapCards: replaced {m.end()-m.start()} -> {len(new_render)} chars")

# ----------------------------------------------------------------------------
# Write back + self-verify
# ----------------------------------------------------------------------------
with open(F, "wb") as fh:
    fh.write(text.encode("utf-8"))
print(f"\n[done] wrote {len(text)} bytes to {F}")

# Self-verify (counts that an LLM summary can't lie about)
verify = {
    "LEAGUE_CAP key": text.count("LEAGUE_CAP:"),
    "old t.payroll>d.cap (should be 0)": text.count("t.payroll>d.cap"),
    "new t.committed>C.cap": text.count("t.committed>C.cap"),
    "renderer header C=LEAGUE_CAP": text.count("C=NBA_CONTRACTS_DATA.LEAGUE_CAP"),
    "C.apr2 references": text.count("C.apr2"),
    "tcc-val.warning class use": text.count("tcc-val warning"),
    "Boston Celtics new shape": text.count('"BOS","East",payroll:194526296'),
    "Golden State new shape": text.count('"GSW","West",payroll:234222725'),
    "Brooklyn Nets new shape": text.count('"BKN","East",payroll:150960352'),
}
print("\n[verify]")
for k, v in verify.items():
    print(f"  {v:3d}  {k}")
