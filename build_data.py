#!/usr/bin/env python3
"""Parse APBR + retroseasons data and output JS object literal for 1947-1956."""

import re
import json

# ─── 1. Parse APBR data ───────────────────────────────────────────────
with open("/tmp/apbr_standings.html") as f:
    apbr_html = f.read()

# Extract sections for each year
# Each section looks like: <a name="1946-47"><strong>1946-47 BAA</strong></a>
# Followed by DIVISION lines and team lines

year_map = {
    "1946-47": "1947",
    "1947-48": "1948",
    "1948-49": "1949",
    "1949-50": "1950",
    "1950-51": "1951",
    "1951-52": "1952",
    "1952-53": "1953",
    "1953-54": "1954",
    "1954-55": "1955",
    "1955-56": "1956",
}

apbr_data = {}  # year -> { 'e': [...], 'w': [...] }

# Split by <hr>
sections = re.split(r"<hr>", apbr_html)
for section in sections:
    # Find year anchor
    m = re.search(r'<a name="(\d{4}-\d{2})">', section)
    if not m:
        continue
    apbr_year_key = m.group(1)
    year = year_map.get(apbr_year_key)
    if not year:
        continue

    lines = []
    for line in section.split("\n"):
        # Remove HTML tags
        clean = re.sub(r"<[^>]+>", "", line).strip()
        # Remove &nbsp; and other entities
        clean = clean.replace("&nbsp;", " ").replace("&amp;", "&")
        if clean:
            lines.append(clean)

    apbr_data[year] = {"e": [], "w": []}

    current_div = None
    # Determine division mapping
    # 1950 is special: Central->w, Eastern->e, Western->w
    # Other years: Eastern->e, Western->w

    for line in lines:
        # Check for division header
        div_match = re.match(r"(EASTERN|WESTERN|CENTRAL)\s+(DIVISION|CONFERENCE)", line)
        if div_match:
            div_name = div_match.group(1)
            if year == "1950":
                if div_name == "EASTERN":
                    current_div = "e"
                elif div_name == "CENTRAL":
                    current_div = "w"
                elif div_name == "WESTERN":
                    current_div = "w"
            else:
                if div_name == "EASTERN":
                    current_div = "e"
                elif div_name == "WESTERN":
                    current_div = "w"
                elif div_name == "CENTRAL":
                    current_div = "w"  # shouldn't happen except 1950
            continue

        if not current_div:
            continue

        # Parse team line: "Washington Capitols       49  11  .817  .."
        team_match = re.match(r"(.+?)\s{2,}(\d+)\s+(\d+)\s+([.\d]+)\s+(.+)$", line)
        if team_match:
            name = team_match.group(1).strip().rstrip("*").strip()
            wins = int(team_match.group(2))
            losses = int(team_match.group(3))
            pct = team_match.group(4)
            gb = team_match.group(5).strip()
            # Handle .. as —
            if gb == ".." or gb == "—":
                gb = "—"
            else:
                # Parse numeric GB
                try:
                    gb_float = float(gb)
                    # Format: integer if whole, otherwise keep as is
                    if gb_float == int(gb_float):
                        gb = str(int(gb_float))
                    else:
                        gb = str(gb_float)
                except ValueError:
                    pass  # keep as-is

            apbr_data[year][current_div].append(
                {
                    "name": name,
                    "wins": wins,
                    "losses": losses,
                    "pct": pct,
                    "gb": gb,
                }
            )

# ─── 2. Parse retroseasons data ───────────────────────────────────────
rs_data = {}  # year -> { team: {ppg, opp, diff} }

for year in range(1947, 1957):
    fname = f"/tmp/rs_{year}.html"
    with open(fname) as f:
        content = f.read()

    rows = re.findall(r"<tr>(.*?)</tr>", content, re.DOTALL)
    teams = {}
    for r in rows:
        if f"<td>{year}</td>" in r:
            cells = re.findall(r"<td[^>]*>(.*?)</td>", r, re.DOTALL)
            if len(cells) >= 18:
                team = re.sub(r"<[^>]+>", "", cells[7]).strip()
                ppg = re.sub(r"<[^>]+>", "", cells[15]).strip()
                opp = re.sub(r"<[^>]+>", "", cells[16]).strip()
                diff_raw = re.sub(r"<[^>]+>", "", cells[17]).strip()
                # Parse diff: could be "-4.9" or "3.5" or "4.9"
                # Remove any leading + sign
                diff = diff_raw.lstrip("+")
                teams[team] = {"ppg": ppg, "opp": opp, "diff": diff}
    rs_data[str(year)] = teams

# ─── 3. Team name mapping ─────────────────────────────────────────────
# APBR -> RS name mapping
name_map = {
    "Washington Capitols": "Washington",
    "Philadelphia Warriors": "Philadelphia",
    "New York Knickerbockers": "New York",
    "Providence Steam Rollers": "Providence",
    "Providence Steam Rollers ": "Providence",
    "Toronto Huskies": "Toronto",
    "Boston Celtics": "Boston",
    "Chicago Stags": "Chicago",
    "St. Louis Bombers": "St. Louis",
    "Cleveland Rebels": "Cleveland",
    "Detroit Falcons": "Detroit",
    "Pittsburgh Ironmen": "Pittsburgh",
    "Baltimore Bullets": "Baltimore",
    "Rochester Royals": "Rochester",
    "Minneapolis Lakers": "Minneapolis",
    "Fort Wayne Pistons": "Fort Wayne",
    "Indianapolis Jets": "Indianapolis",
    "Indianapolis Olympians": "Indianapolis",
    "Syracuse Nationals": "Syracuse",
    "Anderson Packers": "Anderson",
    "Tri-Cities Blackhawks": "Tri-Cities",
    "Sheboygan Red Skins": "Sheboygan",
    "Waterloo Hawks": "Waterloo",
    "Denver Nuggets": "Denver",
    "Milwaukee Hawks": "Milwaukee",
    "St. Louis Hawks": "St. Louis",
    "Philadelphia Warriors (NBL)": "Philadelphia",
}

# For years where RS uses different naming
year_specific_overrides = {
    # 1949-1950: RS calls Minneapolis "LA Lakers"
    "1949": {"Minneapolis Lakers": "LA Lakers"},
    "1950": {"Minneapolis Lakers": "LA Lakers"},
    # 1951+: RS calls them "Minneapolis"
}


# Also add "Minneapolis" as a direct RS key for 1951+
def find_rs_team(apbr_name, year, rs_teams):
    """Find RS team name for an APBR team name."""
    # Check year-specific overrides first
    if year in year_specific_overrides and apbr_name in year_specific_overrides[year]:
        candidate = year_specific_overrides[year][apbr_name]
        if candidate in rs_teams:
            return candidate

    # Check general name map
    if apbr_name in name_map:
        candidate = name_map[apbr_name]
        if candidate in rs_teams:
            return candidate

    # Fuzzy: try first word of APBR name
    apbr_words = apbr_name.split()
    for rs_key in rs_teams:
        if rs_key.lower() == apbr_words[0].lower():
            return rs_key

    # Fuzzy: try last word
    if len(apbr_words) > 1:
        for rs_key in rs_teams:
            if rs_key.lower() == apbr_words[-1].lower():
                return rs_key

    # Fuzzy: check if RS key is contained in APBR name
    for rs_key in rs_teams:
        if rs_key.lower() in apbr_name.lower():
            return rs_key

    # Fuzzy: check if APBR first word contains RS key
    for rs_key in rs_teams:
        if apbr_words[0].lower() in rs_key.lower():
            return rs_key

    return None


# ─── 4. Merge and build output ────────────────────────────────────────
def format_team(name, wins, losses, pct, gb, rs_stats):
    """Format a team entry as a JS object string."""
    ppg = rs_stats.get("ppg", "")
    opp = rs_stats.get("opp", "")
    diff = rs_stats.get("diff", "")
    return f'{{"team":"{name}","wins":"{wins}","losses":"{losses}","pct":"{pct}","gb":"{gb}","ppg":"{ppg}","opp":"{opp}","diff":"{diff}"}}'


def build_year(year):
    """Build JS for a single year."""
    apbr = apbr_data.get(year, {"e": [], "w": []})
    rs_teams = rs_data.get(year, {})

    e_teams = []
    w_teams = []

    for conf in ["e", "w"]:
        teams_out = e_teams if conf == "e" else w_teams
        for apbr_team in apbr[conf]:
            rs_key = find_rs_team(apbr_team["name"], year, rs_teams)
            rs_stats = rs_teams.get(rs_key, {}) if rs_key else {}
            teams_out.append(
                format_team(
                    apbr_team["name"],
                    apbr_team["wins"],
                    apbr_team["losses"],
                    apbr_team["pct"],
                    apbr_team["gb"],
                    rs_stats,
                )
            )

    e_str = ", ".join(e_teams)
    w_str = ", ".join(w_teams)

    return f'"{year}": {{e:[{e_str}],w:[{w_str}]}}'


# Build output as JSON matching existing format
lines = []
lines.append("const BBREF_STANDINGS={")
year_keys = sorted(apbr_data.keys(), key=int)
for yi, year in enumerate(year_keys):
    lines.append(f'  "{year}": {{')
    for conf_idx, conf in enumerate(["e", "w"]):
        conf_label = '"e"' if conf == "e" else '"w"'
        lines.append(f"    {conf_label}: [")
        apbr_teams = apbr_data[year][conf]
        rs_teams = rs_data.get(year, {})
        for ti, apbr_team in enumerate(apbr_teams):
            rs_key = find_rs_team(apbr_team["name"], year, rs_teams)
            rs_stats = rs_teams.get(rs_key, {}) if rs_key else {}
            entry = format_team(
                apbr_team["name"],
                apbr_team["wins"],
                apbr_team["losses"],
                apbr_team["pct"],
                apbr_team["gb"],
                rs_stats,
            )
            comma = "," if ti < len(apbr_teams) - 1 else ""
            lines.append(f"      {entry}{comma}")
        lines.append("    ]" + ("," if conf_idx == 0 else ""))
    lines.append("  }" + ("," if yi < len(year_keys) - 1 else ""))
lines.append("}")
print("\n".join(lines))
