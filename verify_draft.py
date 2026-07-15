#!/usr/bin/env python3
"""Verify NBA draft data against Basketball-Reference.com"""

import re, json, sys, os, subprocess, html as html_mod

NBA_HTML = "nba.html"


# Step 1: Extract NBA_DRAFT_DATA from nba.html
def extract_draft_data():
    with open(NBA_HTML) as f:
        content = f.read()

    # Find the NBA_DRAFT_DATA object
    match = re.search(
        r"const NBA_DRAFT_DATA = ({.*?});\s*\n\s*(?:const |var |let |//|\n|$)",
        content,
        re.DOTALL,
    )
    if not match:
        print("ERROR: Could not find NBA_DRAFT_DATA", file=sys.stderr)
        sys.exit(1)

    js_obj = match.group(1)

    # Try to use python to parse the JS object by converting to JSON
    # First, add quotes around keys
    json_str = re.sub(r"(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'\1"\2":', js_obj)
    # Fix single quotes
    json_str = json_str.replace("'", '"')
    # Fix escaped quotes in values
    json_str = re.sub(r'(?<!\\)"', '\\"', json_str)
    # Actually this is too complex. Let me just use regex to extract what we need

    # Alternative: extract each year's data with regex
    years_data = {}

    # Find all year entries
    year_pattern = re.compile(
        r'"(\d{4})":\s*\[(.*?)\]\s*\](?=\s*,\s*"\d{4}"|\s*\};)', re.DOTALL
    )

    for match in year_pattern.finditer(js_obj):
        year = match.group(1)
        picks_str = match.group(2)

        # Extract individual pick objects
        picks = []
        pick_pattern = re.compile(r"\{(.*?)\}", re.DOTALL)
        for pick_match in pick_pattern.finditer(picks_str):
            pick_str = pick_match.group(1)
            pick_dict = {}

            # Extract key-value pairs
            kv_pattern = re.compile(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*("[^"]*"|[^,}]+)')
            for kv in kv_pattern.finditer(pick_str):
                key = kv.group(1)
                val = kv.group(2).strip()
                # Remove trailing comma if any
                if val.endswith(","):
                    val = val[:-1].strip()
                if key in (
                    "pick",
                    "wt",
                    "age",
                    "pts",
                    "reb",
                    "ast",
                    "blk",
                    "stl",
                    "pts36",
                    "reb36",
                    "ast36",
                    "blk36",
                    "stl36",
                    "ts",
                    "usg",
                    "obpm",
                    "dbpm",
                    "bpm",
                ):
                    # numeric - skip for now
                    pass
                elif key in ("team", "player", "pos", "college", "ht", "cls", "abbr"):
                    if val.startswith('"') and val.endswith('"'):
                        val = val[1:-1]
                    pick_dict[key] = val

            if "pick" in pick_str and "player" in pick_str:
                pick_num = re.search(r"pick\s*:\s*(\d+)", pick_str)
                player_name = re.search(r'player\s*:\s*"([^"]*)"', pick_str)
                team_name = re.search(r'team\s*:\s*"([^"]*)"', pick_str)
                abbr = re.search(r'abbr\s*:\s*"([^"]*)"', pick_str)

                if pick_num and player_name:
                    picks.append(
                        {
                            "pick": int(pick_num.group(1)),
                            "player": player_name.group(1),
                            "team": team_name.group(1) if team_name else "",
                            "abbr": abbr.group(1).lower() if abbr else "",
                        }
                    )

            years_data[year] = picks

    return years_data


# Better approach: extract using simpler JS-like parsing
def extract_draft_data_v2():
    with open(NBA_HTML) as f:
        content = f.read()

    # Find the start of NBA_DRAFT_DATA
    start = content.find("const NBA_DRAFT_DATA = {")
    if start == -1:
        print("ERROR: Could not find NBA_DRAFT_DATA", file=sys.stderr)
        sys.exit(1)

    # Find the matching closing brace
    brace_count = 0
    in_string = False
    escape = False
    end = start

    for i in range(start, len(content)):
        ch = content[i]
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string:
            if ch == "{":
                brace_count += 1
            elif ch == "}":
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break

    js_obj = content[start:end]

    # Remove the variable declaration part and outer braces
    js_obj = re.sub(r"^const\s+NBA_DRAFT_DATA\s*=\s*", "", js_obj).strip()
    if js_obj.startswith("{") and js_obj.endswith("}"):
        js_obj = js_obj[1:-1].strip()

    years_data = {}

    # Split by year pattern: "YYYY": [
    parts = re.split(r'"(\d{4})"\s*:\s*\[', js_obj)
    # parts[0] is junk (before first year), then alternating: year, content_until_end
    # parts[1] = year, parts[2] = content from that year's [ to end of object
    # So we need to find where each year's array ends by bracket counting

    for i in range(1, len(parts), 2):
        year = parts[i]
        if i + 1 >= len(parts):
            continue

        content_after = parts[i + 1]

        # Find the end of the array for this year by bracket counting
        bracket_depth = 0
        in_string = False
        escape = False
        array_end = -1

        for j, ch in enumerate(content_after):
            if escape:
                escape = False
                continue
            if ch == "\\" and in_string:
                escape = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if not in_string:
                if ch == "[":
                    bracket_depth += 1
                elif ch == "]":
                    bracket_depth -= 1
                    if bracket_depth < 0:
                        array_end = j
                        break

        if array_end == -1:
            print(f"  WARNING: Could not find end of array for {year}", file=sys.stderr)
            continue

        picks_content = content_after[:array_end]

        picks = []
        pick_objects = re.finditer(r"\{(.*?)\}", picks_content, re.DOTALL)
        for pick_match in pick_objects:
            pick_str = pick_match.group(1)

            pick_num = re.search(r"pick\s*:\s*(\d+)", pick_str)
            player_name = re.search(r'player\s*:\s*"([^"]*)"', pick_str)
            team_name = re.search(r'team\s*:\s*"([^"]*)"', pick_str)
            abbr = re.search(r'abbr\s*:\s*"([^"]*)"', pick_str)

            if pick_num and player_name:
                picks.append(
                    {
                        "pick": int(pick_num.group(1)),
                        "player": player_name.group(1),
                        "team": team_name.group(1) if team_name else "",
                        "abbr": abbr.group(1).lower() if abbr else "",
                    }
                )

        years_data[year] = picks

    return years_data


# Step 3: Fetch B-R draft data
def fetch_br_draft(year):
    """Fetch draft data from B-R for a given year. Returns list of {pick, team, player}"""
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
        print(f"  WARNING: Failed to fetch {url}", file=sys.stderr)
        return None

    html = result.stdout

    # Find the stats table
    table_match = re.search(
        r'<table[^>]*id="stats"[^>]*>(.*?)</table>', html, re.DOTALL
    )
    if not table_match:
        print(f"  WARNING: No stats table found for {year}", file=sys.stderr)
        return None

    table_html = table_match.group(1)

    picks = []

    # Find all data rows (tr elements that have actual pick data)
    row_pattern = re.compile(r"<tr[^>]*>(.*?)</tr>", re.DOTALL)

    for row_match in row_pattern.finditer(table_html):
        row = row_match.group(1)

        # Skip header rows
        if 'class="thead"' in row or 'class="over_header"' in row:
            continue
        # Skip forfeited rows
        if 'data-stat="skip"' in row:
            continue

        # Only process rows with pick_overall AND player data-stat
        if 'data-stat="pick_overall"' not in row or 'data-stat="player"' not in row:
            continue

        # Extract pick number: <td data-stat="pick_overall" csk="NN">
        pick_match = re.search(r'data-stat="pick_overall"\s+csk="(\d+)"', row)
        if not pick_match:
            # try alternate format
            pick_match = re.search(r'data-stat="pick_overall"[^>]*>.*?(\d+)\s*<', row)
        if not pick_match:
            continue
        pick_num = int(pick_match.group(1))

        # Extract team abbreviation from data-stat="team_id"
        team_match = re.search(r'data-stat="team_id"[^>]*>.*?<a[^>]*>([A-Z]+)</a>', row)
        if not team_match:
            continue
        team_abbr = team_match.group(1)

        # Extract player name from data-stat="player"
        player_match = re.search(r'data-stat="player"[^>]*>\s*<a[^>]*>([^<]+)</a>', row)
        if not player_match:
            # try format where player name not in <a>
            player_match = re.search(r'data-stat="player"[^>]*>([^<]+)<', row)
        if not player_match:
            continue
        player_name = player_match.group(1).strip()

        picks.append({"pick": pick_num, "team": team_abbr, "player": player_name})

    return picks


# Normalize team abbreviations for comparison
TEAM_MAP = {
    # Our format -> B-R format
    "orl": "ORL",
    "cha": "CHA",
    "chi": "CHI",
    "lac": "LAC",
    "was": "WAS",
    "atl": "ATL",
    "phx": "PHO",
    "pho": "PHO",
    "tor": "TOR",
    "phi": "PHI",
    "cle": "CLE",
    "gsw": "GSW",
    "gs": "GSW",
    "sea": "SEA",
    "por": "POR",
    "uta": "UTA",
    "bos": "BOS",
    "no": "NOH",
    "noh": "NOH",
    "nop": "NOP",
    "mia": "MIA",
    "den": "DEN",
    "nj": "NJN",
    "njn": "NJN",
    "sac": "SAC",
    "hou": "HOU",
    "lal": "LAL",
    "sas": "SAS",
    "ind": "IND",
    "det": "DET",
    "mil": "MIL",
    "ny": "NYK",
    "okc": "OKC",
    "bkn": "BKN",
    "min": "MIN",
    "mem": "MEM",
    "dal": "DAL",
    "pho": "PHO",
    "nop": "NOP",
    # Handle some edge cases
    "noh": "NOH",
    "njn": "NJN",
    "nop": "NOH",
    # B-R specials
    "noh": "NOH",
    "njn": "NJN",
    "nop": "NOH",
    "brk": "BKN",
    "pho": "PHO",
    "seo": "SEO",
    "nok": "NOH",
    "nop": "NOP",
}


def normalize_team(abbr):
    return TEAM_MAP.get(abbr.lower(), abbr.upper())


def compare_picks(year, local_picks, br_picks):
    if not local_picks or not br_picks:
        return []

    issues = []
    local_by_pick = {p["pick"]: p for p in local_picks}
    br_by_pick = {p["pick"]: p for p in br_picks}

    max_pick = max(max(local_by_pick.keys()), max(br_by_pick.keys()))

    for pick_num in range(1, max_pick + 1):
        local = local_by_pick.get(pick_num)
        br = br_by_pick.get(pick_num)

        if not local and not br:
            continue

        if not local:
            issues.append(
                f"  Pick {pick_num}: MISSING in our data. B-R has: {br['team']} - {br['player']}"
            )
            continue

        if not br:
            issues.append(
                f"  Pick {pick_num}: EXTRA in our data: {local['team']} - {local['player']} (not in B-R)"
            )
            continue

        # Compare team
        br_team = br["team"]
        local_team_abbr = normalize_team(local["abbr"])

        # Compare player names (handle diacritics)
        br_player = br["player"].lower().strip()
        local_player = local["player"].lower().strip()

        # Simple normalization for comparison
        br_player_simple = re.sub(r"[^a-z0-9\s\.\-\']", "", br_player).strip()
        local_player_simple = re.sub(r"[^a-z0-9\s\.\-\']", "", local_player).strip()

        team_issue = ""
        player_issue = ""

        if br_team != local_team_abbr:
            team_issue = (
                f"TEAM: local={local_team_abbr} ({local['team']}) vs B-R={br_team}"
            )

        if br_player_simple != local_player_simple:
            player_issue = f"PLAYER: local='{local['player']}' vs B-R='{br['player']}'"

        if team_issue or player_issue:
            msg = f"  Pick {pick_num}: "
            if team_issue:
                msg += team_issue
            if player_issue:
                if team_issue:
                    msg += " | "
                msg += player_issue
            issues.append(msg)

    return issues


def main():
    print("=" * 70)
    print("NBA DRAFT DATA VERIFICATION AGAINST BASKETBALL-REFERENCE.COM")
    print("=" * 70)

    # Extract local data
    print("\n[1] Extracting draft data from nba.html...")
    local_data = extract_draft_data_v2()
    years = sorted(local_data.keys())
    print(f"  Found {len(years)} years: {', '.join(years)}")
    total_picks = sum(len(picks) for picks in local_data.values())
    print(f"  Total picks: {total_picks}")

    # Fetch and compare
    print("\n[2] Fetching B-R data and comparing...\n")

    all_issues = []
    verified_years = 0
    skipped_years = 0

    for year in years:
        print(f"  --- {year} ---")

        br_picks = fetch_br_draft(year)

        if br_picks is None:
            print(f"  SKIPPED (could not fetch)\n")
            skipped_years += 1
            continue

        verified_years += 1
        local_picks = local_data[year]

        issues = compare_picks(year, local_picks, br_picks)

        if issues:
            print(f"  Found {len(issues)} issue(s):")
            for issue in issues:
                print(issue)
                all_issues.append((year, issue))
        else:
            print(f"  All {len(br_picks)} picks verified OK ✓")

        print()

    # Summary
    print("=" * 70)
    print(f"SUMMARY: {verified_years} years verified, {skipped_years} skipped")
    print(f"Total discrepancies found: {len(all_issues)}")
    print("=" * 70)

    for year, issue in all_issues:
        print(f"{year}: {issue}")

    return len(all_issues)


if __name__ == "__main__":
    sys.exit(main())
