import json, re, time, sys
from urllib.request import urlopen, Request

HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
DELAY = 3.5

OUTPUT_FILE = "/home/numberc/Desktop/sports sync/players-data.js"

# ESPN player headshot base
ESPN_HS = "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/{id}.png&w=64&h=64"

"""BBRef to ESPN team abbreviation mapping for player team lookup"""
TEAM_MAP = {
    "AND": "AND",
    "ATL": "ATL",
    "BLB": "BLB",
    "BOS": "BOS",
    "BRK": "BKN",
    "BUF": "BUF",
    "CAP": "CAP",
    "CHA": "CHA",
    "CHH": "CHA",
    "CHI": "CHI",
    "CHP": "CHP",
    "CHS": "CHS",
    "CHZ": "CHZ",
    "CIN": "CIN",
    "CLE": "CLE",
    "CLR": "CLR",
    "DAL": "DAL",
    "DEN": "DEN",
    "DET": "DET",
    "DNN": "DEN",
    "DTF": "DTF",
    "FWP": "DET",
    "GSW": "GSW",
    "HOU": "HOU",
    "IND": "IND",
    "INJ": "INJ",
    "INO": "INO",
    "KCK": "SAC",
    "KCO": "SAC",
    "LAC": "LAC",
    "LAL": "LAL",
    "MEM": "MEM",
    "MIA": "MIA",
    "MIH": "MIL",
    "MIL": "MIL",
    "MIN": "MIN",
    "MNL": "LAL",
    "NJN": "BKN",
    "NOH": "NOP",
    "NOJ": "UTA",
    "NOK": "NOP",
    "NOP": "NOP",
    "NYN": "BKN",
    "NYK": "NYK",
    "OKC": "OKC",
    "ORL": "ORL",
    "PHI": "PHI",
    "PHO": "PHX",
    "PHW": "GSW",
    "PIT": "PIT",
    "POR": "POR",
    "PRO": "PRO",
    "ROC": "SAC",
    "SAC": "SAC",
    "SAS": "SAS",
    "SDC": "LAC",
    "SDR": "HOU",
    "SEA": "OKC",
    "SFW": "GSW",
    "SHE": "SHE",
    "STB": "STB",
    "STL": "ATL",
    "SYR": "PHI",
    "TOR": "TOR",
    "TRH": "TRH",
    "TRI": "ATL",
    "UTA": "UTA",
    "VAN": "MEM",
    "WAS": "WAS",
    "WAT": "WAT",
    "WSB": "WAS",
    "WSC": "WSC",
}


def fetch(url):
    print(f"  Fetching {url}")
    req = Request(url, headers=HEADERS)
    resp = urlopen(req)
    return resp.read().decode("utf-8")


def parse_per_game_rows(html):
    """Parse BBRef per_game_stats table, return list of player dicts."""
    m = re.search(r'<table[^>]*id="per_game_stats"[^>]*>(.*?)</table>', html, re.DOTALL)
    if not m:
        return []
    tbody = m.group(1)

    players = []
    for m2 in re.finditer(r"<tr[^>]*>(.*?)</tr>", tbody, re.DOTALL):
        row_html = m2.group(1)
        # Skip header rows (no td[name_display])
        if not re.search(r'<td[^>]*data-stat="name_display"', row_html):
            continue

        # Extract name
        nm = re.search(
            r'data-stat="name_display"[^>]*>(.*?)</t[dh]>', row_html, re.DOTALL
        )
        if not nm:
            continue
        name = re.sub(r"<[^>]+>", "", nm.group(1)).strip()
        if not name or name == "Player":
            continue

        # Extract stats
        p = {"name": name}
        for stat_key in [
            "team_name_abbr",
            "pos",
            "age",
            "games",
            "games_started",
            "mp_per_g",
            "fg_per_g",
            "fga_per_g",
            "fg_pct",
            "fg3_per_g",
            "fg3a_per_g",
            "fg3_pct",
            "ft_per_g",
            "fta_per_g",
            "ft_pct",
            "orb_per_g",
            "drb_per_g",
            "trb_per_g",
            "ast_per_g",
            "stl_per_g",
            "blk_per_g",
            "tov_per_g",
            "pts_per_g",
            "pf_per_g",
        ]:
            sm = re.search(
                r'data-stat="' + stat_key + r'"[^>]*>(.*?)</t[dh]>', row_html, re.DOTALL
            )
            if sm:
                val = re.sub(r"<[^>]+>", "", sm.group(1)).strip()
                val = val.replace("&mdash;", "—")
                p[stat_key] = val

        players.append(p)
    return players


def scrape_season(year):
    league = "BAA" if year <= 1949 else "NBA"
    url = f"https://www.basketball-reference.com/leagues/{league}_{year}_per_game.html"

    html = fetch(url)
    if "per_game" not in html.lower()[:3000]:
        print(f"  Not a valid per-game page")
        return []

    players = parse_per_game_rows(html)
    # Filter to only players who actually played
    players = [p for p in players if p.get("pts_per_g") or p.get("games")]
    # Dedup: traded players appear as 2TM/3TM/TOT + individual teams, keep first only
    seen = set()
    deduped = []
    for p in players:
        if p["name"] not in seen:
            seen.add(p["name"])
            deduped.append(p)
    players = deduped
    print(f"  Parsed {len(players)} players")
    return players


def build_stats(players, stat_key, label, limit=15):
    """Build top-N list for a given stat."""
    sorted_players = sorted(
        [
            p
            for p in players
            if p.get(stat_key) and p[stat_key] != "—" and p[stat_key] != "0.0"
        ],
        key=lambda p: float(p[stat_key]) if p[stat_key] else 0,
        reverse=True,
    )[:limit]
    return [
        {
            "name": p["name"],
            "team": p.get("team_name_abbr", ""),
            "pos": p.get("pos", ""),
            "gp": p.get("games", ""),
            "mpg": p.get("mp_per_g", ""),
            "stat": p[stat_key],
            "fg_pct": p.get("fg_pct", ""),
            "fg3_pct": p.get("fg3_pct", ""),
            "ft_pct": p.get("ft_pct", ""),
            "trb": p.get("trb_per_g", ""),
            "ast": p.get("ast_per_g", ""),
            "stl": p.get("stl_per_g", ""),
            "blk": p.get("blk_per_g", ""),
        }
        for p in sorted_players
    ]


def main():
    output = {}
    seasons = list(range(1947, 2026))
    total = len(seasons)

    for i, year in enumerate(seasons):
        print(f"[{i + 1}/{total}] Scraping {year}...")
        try:
            players = scrape_season(year)
            if players:
                output[str(year)] = {
                    "ppg": build_stats(players, "pts_per_g", "PPG"),
                    "apg": build_stats(players, "ast_per_g", "APG"),
                    "rpg": build_stats(players, "trb_per_g", "RPG"),
                }
                print(
                    f"  PPG top: {output[str(year)]['ppg'][0]['name']} ({output[str(year)]['ppg'][0]['stat']})"
                )
        except Exception as e:
            print(f"  ERROR: {e}")

        if i < total - 1:
            time.sleep(DELAY)

    # Save
    text = "const PLAYERS_DATA=" + json.dumps(output, ensure_ascii=False, indent=2)
    with open(OUTPUT_FILE, "w") as f:
        f.write(text)
        f.write("\n")
    print(f"\nSaved {len(output)} seasons to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
