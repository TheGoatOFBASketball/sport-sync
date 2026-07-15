#!/usr/bin/env python3
"""Fix NBA_DRAFT_DATA in nba.html using B-R data as ground truth for 2004-2024"""

import re, sys, subprocess, os

NBA_HTML = "nba.html"


def fetch_br_draft(year):
    """Fetch draft data from B-R. Returns dict of pick_num -> {team, abbr, player}"""
    url = f"https://www.basketball-reference.com/draft/NBA_{year}.html"
    result = subprocess.run(
        [
            "curl",
            "-s",
            "-L",
            "-A",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            url,
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0 or not result.stdout:
        return None

    html = result.stdout
    table_match = re.search(
        r'<table[^>]*id="stats"[^>]*>(.*?)</table>', html, re.DOTALL
    )
    if not table_match:
        return None

    table_html = table_match.group(1)
    picks = {}
    row_pattern = re.compile(r"<tr[^>]*>(.*?)</tr>", re.DOTALL)

    for row_match in row_pattern.finditer(table_html):
        row = row_match.group(1)
        if 'class="thead"' in row or 'class="over_header"' in row:
            continue
        if 'data-stat="skip"' in row:
            continue
        if 'data-stat="pick_overall"' not in row or 'data-stat="player"' not in row:
            continue

        pick_match = re.search(r'data-stat="pick_overall"\s+csk="(\d+)"', row)
        if not pick_match:
            continue
        pick_num = int(pick_match.group(1))

        team_match = re.search(r'data-stat="team_id"[^>]*>.*?<a[^>]*>([A-Z]+)</a>', row)
        if not team_match:
            continue
        team_abbr = team_match.group(1)

        player_match = re.search(r'data-stat="player"[^>]*>\s*<a[^>]*>([^<]+)</a>', row)
        if not player_match:
            player_match = re.search(r'data-stat="player"[^>]*>([^<]+)<', row)
        if not player_match:
            continue
        player_name = player_match.group(1).strip()

        picks[pick_num] = {"team_abbr": team_abbr, "player": player_name}

    return picks


# Map B-R abbr -> our full team name + our abbr
BR_TEAM_MAP = {
    "ORL": ("Orlando Magic", "orl"),
    "CHA": ("Charlotte Bobcats", "cha"),  # Pre-2014
    "CHO": ("Charlotte Hornets", "cha"),  # Post-2014
    "CHI": ("Chicago Bulls", "chi"),
    "LAC": ("LA Clippers", "lac"),
    "WAS": ("Washington Wizards", "was"),
    "ATL": ("Atlanta Hawks", "atl"),
    "PHO": ("Phoenix Suns", "pho"),
    "PHX": ("Phoenix Suns", "pho"),
    "TOR": ("Toronto Raptors", "tor"),
    "PHI": ("Philadelphia 76ers", "phi"),
    "CLE": ("Cleveland Cavaliers", "cle"),
    "GSW": ("Golden State Warriors", "gsw"),
    "SEA": ("Seattle Supersonics", "sea"),
    "POR": ("Portland Trail Blazers", "por"),
    "UTA": ("Utah Jazz", "uta"),
    "BOS": ("Boston Celtics", "bos"),
    "NOH": ("New Orleans Hornets", "noh"),
    "NOK": ("New Orleans/Oklahoma City Hornets", "noh"),
    "NOP": ("New Orleans Pelicans", "nop"),
    "MIA": ("Miami Heat", "mia"),
    "DEN": ("Denver Nuggets", "den"),
    "NJN": ("New Jersey Nets", "njn"),
    "BRK": ("Brooklyn Nets", "bkn"),
    "BKN": ("Brooklyn Nets", "bkn"),
    "SAC": ("Sacramento Kings", "sac"),
    "HOU": ("Houston Rockets", "hou"),
    "LAL": ("Los Angeles Lakers", "lal"),
    "SAS": ("San Antonio Spurs", "sas"),
    "IND": ("Indiana Pacers", "ind"),
    "DET": ("Detroit Pistons", "det"),
    "MIL": ("Milwaukee Bucks", "mil"),
    "NYK": ("New York Knicks", "ny"),
    "OKC": ("Oklahoma City Thunder", "okc"),
    "MIN": ("Minnesota Timberwolves", "min"),
    "MEM": ("Memphis Grizzlies", "mem"),
    "DAL": ("Dallas Mavericks", "dal"),
    "NOP": ("New Orleans Pelicans", "nop"),
}

# Full team name map
TEAM_NAME_MAP = {
    "orl": "Orlando Magic",
    "cha": "Charlotte Hornets",
    "chi": "Chicago Bulls",
    "lac": "LA Clippers",
    "was": "Washington Wizards",
    "atl": "Atlanta Hawks",
    "pho": "Phoenix Suns",
    "tor": "Toronto Raptors",
    "phi": "Philadelphia 76ers",
    "cle": "Cleveland Cavaliers",
    "gsw": "Golden State Warriors",
    "sea": "Seattle Supersonics",
    "por": "Portland Trail Blazers",
    "uta": "Utah Jazz",
    "bos": "Boston Celtics",
    "noh": "New Orleans Pelicans",
    "nop": "New Orleans Pelicans",
    "njn": "New Jersey Nets",
    "bkn": "Brooklyn Nets",
    "sac": "Sacramento Kings",
    "hou": "Houston Rockets",
    "lal": "Los Angeles Lakers",
    "sas": "San Antonio Spurs",
    "ind": "Indiana Pacers",
    "det": "Detroit Pistons",
    "mil": "Milwaukee Bucks",
    "ny": "New York Knicks",
    "nyk": "New York Knicks",
    "okc": "Oklahoma City Thunder",
    "min": "Minnesota Timberwolves",
    "mem": "Memphis Grizzlies",
    "dal": "Dallas Mavericks",
    "nop": "New Orleans Pelicans",
    "cha": "Charlotte Hornets",
    "no": "New Orleans Pelicans",
}


def fix_nba_html():
    with open(NBA_HTML) as f:
        content = f.read()

    # Find NBA_DRAFT_DATA
    start = content.find("const NBA_DRAFT_DATA = {")
    if start == -1:
        print("ERROR: Could not find NBA_DRAFT_DATA")
        sys.exit(1)

    # Parse the current NBA_DRAFT_DATA to locate individual pick entries
    years_to_fix = list(range(2004, 2025))  # 2004-2024

    total_fixes = 0
    team_only_fixes = 0

    for year in years_to_fix:
        year_str = str(year)
        print(f"\n{year_str}: Fetching B-R data...", end=" ")
        sys.stdout.flush()

        br_picks = fetch_br_draft(year)
        if br_picks is None:
            print("SKIPPED (fetch failed)")
            continue

        print(f"got {len(br_picks)} picks")

        if not br_picks:
            continue

        # Find the start and end of this year's data in the HTML
        year_pattern = f'"{year_str}": ['
        year_start = content.find(year_pattern, start)
        if year_start == -1:
            print(f"  WARNING: Could not find year {year_str} in data")
            continue

        # Find the end of this year's array (find next year or end of object)
        # Look for "YYYY": [ pattern after this year
        next_year = None
        for y in range(year + 1, 2030):
            yp = f'"{y}": ['
            ypos = content.find(yp, year_start + 10)
            if ypos != -1:
                next_year = ypos
                break

        year_end = next_year if next_year else content.find("\n}", year_start + 10)

        # Get this year's section
        year_section = content[year_start:year_end]

        # For each B-R pick, find the corresponding pick in our data and fix it
        for pick_num in sorted(br_picks.keys()):
            br_info = br_picks[pick_num]
            br_team_abbr = br_info["team_abbr"]
            br_player = br_info["player"]

            # Map B-R team abbr to our format
            if br_team_abbr in BR_TEAM_MAP:
                our_team_name, our_abbr = BR_TEAM_MAP[br_team_abbr]
            else:
                our_team_name = br_team_abbr
                our_abbr = br_team_abbr.lower()

            # Find this pick within the year section
            pick_pattern = re.compile(r"\{pick\s*:\s*" + str(pick_num) + r"\b[^}]*\}")
            match = pick_pattern.search(year_section)

            if not match:
                print(f"  WARNING: Could not find pick {pick_num} in {year_str}")
                continue

            pick_str = match.group(0)

            # Check current values
            curr_team = re.search(r'team\s*:\s*"([^"]*)"', pick_str)
            curr_abbr = re.search(r'abbr\s*:\s*"([^"]*)"', pick_str)
            curr_player = re.search(r'player\s*:\s*"([^"]*)"', pick_str)

            curr_abbr_val = curr_abbr.group(1).lower() if curr_abbr else ""
            curr_player_name = curr_player.group(1) if curr_player else ""

            # Normalize player names for comparison
            br_player_clean = re.sub(
                r"[^a-z0-9\s\.\-\']", "", br_player.lower()
            ).strip()
            curr_player_clean = re.sub(
                r"[^a-z0-9\s\.\-\']", "", curr_player_name.lower()
            ).strip()

            needs_team_fix = our_abbr != curr_abbr_val
            needs_player_fix = (
                br_player_clean != curr_player_clean and len(br_player_clean) > 2
            )

            if needs_team_fix or needs_player_fix:
                desc = []
                if needs_team_fix:
                    desc.append(
                        f"team: ({curr_abbr_val}) -> {our_team_name}({our_abbr})"
                    )
                if needs_player_fix:
                    desc.append(f"player: '{curr_player_name}' -> '{br_player}'")

                # Build replacement string
                new_pick_str = pick_str
                if needs_team_fix:
                    new_pick_str = re.sub(
                        r'team\s*:\s*"[^"]*"', f'team:"{our_team_name}"', new_pick_str
                    )
                    new_pick_str = re.sub(
                        r'abbr\s*:\s*"[^"]*"', f'abbr:"{our_abbr}"', new_pick_str
                    )
                if needs_player_fix:
                    new_pick_str = re.sub(
                        r'player\s*:\s*"[^"]*"', f'player:"{br_player}"', new_pick_str
                    )

                if new_pick_str != pick_str:
                    # Find the exact position in the overall content
                    abs_pick_start = year_start + match.start()
                    abs_pick_end = year_start + match.end()

                    content = (
                        content[:abs_pick_start] + new_pick_str + content[abs_pick_end:]
                    )
                    shift = len(new_pick_str) - len(pick_str)

                    # Update positions
                    year_start += shift
                    if next_year:
                        next_year += shift
                    year_end += shift
                    year_section = content[year_start:year_end]

                    total_fixes += 1
                    print(f"  Fix pick {pick_num}: {' | '.join(desc)}")

    # Write back
    with open(NBA_HTML, "w") as f:
        f.write(content)

    print(f"\n\nTotal fixes applied: {total_fixes}")
    return total_fixes


if __name__ == "__main__":
    sys.exit(fix_nba_html())
