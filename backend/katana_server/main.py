from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import json
import re
import time
import xml.etree.ElementTree as ET
from datetime import date as _date
import requests
from bs4 import BeautifulSoup

app = FastAPI(title="SportSync Katana Proxy")

# Allow the local frontend (any origin for dev) to call these endpoints.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

def run_katana(league: str):
    # This is a placeholder placeholder implementation.
    # In a real deployment, you would call the Katana CLI with a proper config and return parsed JSON.
    # Example: subprocess.check_output(["katana", "--config", "katana/katana_config.yaml", "--league", league, "--endpoint", "live-scores"])
    # For safety, return a mock payload here.
    payload = {
        "liveScores": [{"league": league, "home": "Team A", "away": "Team B", "homeScore": 100, "awayScore": 98, "status": "LIVE"}],
        "standings": [],
        "news": [],
        "schedule": []
    }
    return payload

@app.get("/katana/data")
async def katana_data(league: str = "nba"):
    try:
        data = run_katana(league)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ═══ Hoops Rumors proxy (fallback when rss2json 422s) ═══
# Fetch the WordPress RSS at https://www.hoopsrumors.com/feed server-side
# (avoids hoopsrumors.com's missing CORS headers + the rss2json free-tier
# throttling) and return a JSON envelope shaped like rss2json so the
# existing client-side parser can consume it without modification.
HOOPS_RUMORS_FEED_URL = "https://www.hoopsrumors.com/feed"
HOOPS_RUMORS_TIMEOUT_S = 15

def _text(el, tag):
    """Find a child element by local-name and return its text or ''."""
    node = el.find(tag)
    if node is None or node.text is None:
        return ""
    return node.text

def _parse_rss(xml_text: str, limit: int):
    root = ET.fromstring(xml_text)
    # WordPress RSS uses channel/item; support both rss/channel/item and rdf/item.
    items = []
    for item in root.iter("item"):
        if len(items) >= limit:
            break
        # content:encoded lives in a namespace; use fully-qualified tag.
        content = ""
        ce = item.find("{http://purl.org/rss/1.0/modules/content/}encoded")
        if ce is not None and ce.text:
            content = ce.text
        # dc:creator is in the Dublin Core namespace.
        author = ""
        dc = item.find("{http://purl.org/dc/elements/1.1/}creator")
        if dc is not None and dc.text:
            author = dc.text
        # enclosure (image) — WordPress attaches featured-image as <enclosure url="..." type="image/...">
        enclosure_link = ""
        for enc in item.findall("enclosure"):
            url = enc.attrib.get("url")
            if url:
                enclosure_link = url
                break
        items.append({
            "title": _text(item, "title"),
            "link": _text(item, "link"),
            "pubDate": _text(item, "pubDate"),
            "description": _text(item, "description"),
            "content": content,
            "author": author,
            "thumbnail": "",  # RSS <enclosure> may carry the image, not <media:thumbnail>
            "enclosure": {"link": enclosure_link} if enclosure_link else {},
            "guid": _text(item, "guid"),
        })
    return items

@app.get("/katana/hoopsrumors/feed")
async def hoopsrumors_feed(limit: int = Query(15, ge=1, le=50)):
    try:
        resp = requests.get(
            HOOPS_RUMORS_FEED_URL,
            timeout=HOOPS_RUMORS_TIMEOUT_S,
            headers={"User-Agent": "SportSync/1.0 (+katana_server)"},
        )
        resp.raise_for_status()
        items = _parse_rss(resp.text, limit)
        return JSONResponse(content={"status": "ok", "items": items})
    except requests.RequestException as e:
        return JSONResponse(
            content={"status": "error", "error": f"upstream: {e}"},
            status_code=502,
        )
    except ET.ParseError as e:
        return JSONResponse(
            content={"status": "error", "error": f"xml parse: {e}"},
            status_code=502,
        )

# ═══ ESPN proxy (bypasses CORS — ESPN's API doesn't send ACAO headers) ═══
# The browser talks to localhost (same-origin), katana_server fetches ESPN
# server-side where CORS doesn't apply, and relays the JSON back.
ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2"
ESPN_TIMEOUT_S = 10


# ═══ NBA.com scoreboard proxy (uses nba.com/games as the source of truth) ═══
# Scrape https://www.nba.com/games?date=YYYY-MM-DD with a browser-like
# User-Agent (the page rejects `requests`' default UA with 403). Parse the
# rendered GameCard_* divs with BeautifulSoup and join with ESPN for numeric
# scores, since nba.com/games' static HTML doesn't contain score numbers
# (they're hydrated via JavaScript after first paint — verified).
#
# nba.com is the source for the daily schedule, team names, logos and team
# IDs; ESPN is merged in for live/final numeric scores when available. The
# output is shaped like ESPN's scoreboard v2 response so the existing
# parseESPN_Scoreboard() in espn-api.js / parseGames() in nba.html can
# consume it without any frontend changes.
NBA_GAMES_URL = "https://www.nba.com/games"
NBA_TIMEOUT_S = 15
NBA_CACHE_TTL_S = 30  # seconds; keep short since scoreboard is live
NBA_CACHE_MAX_KEYS = 64  # bound the cache so it can't grow unbounded over the life of the server

# Per-team ESPN <-> NBA.com abbreviation differences. NBA.com URL slugs
# (e.g. /game/bkn-vs-bos-...) give us the canonical NBA.com abbreviations;
# ESPN sometimes uses legacy codes (BRK=BKN, etc.). Normalize so we can
# join NBA scrape rows with ESPN scoreboard rows reliably.
NBA_ESPN_ABBR_NORM = {
    "BRK": "BKN",  # Brooklyn — ESPN historically spells it BRK
}


def _espn_abbr_to_nba(abbr: str) -> str:
    """Map an ESPN team abbreviation to its NBA.com equivalent."""
    if not abbr:
        return ""
    return NBA_ESPN_ABBR_NORM.get(abbr.upper(), abbr.upper())


def _compact_to_iso(date_str: str) -> str:
    """Accept either YYYY-MM-DD or compact YYYYMMDD and return YYYY-MM-DD.
    Used to make the proxy tolerant of ESPN-style compact dates without
    forcing every caller (e.g. espn-api.js) to pre-format.
    """
    if not date_str:
        return ""
    s = date_str.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s
    if re.fullmatch(r"\d{8}", s):
        return f"{s[0:4]}-{s[4:6]}-{s[6:8]}"
    return s  # pass through; the route will reject truly malformed values


def _evict_stale_cache(cache: dict, ttl_s: int, max_keys: int) -> None:
    """Tidy up the in-process cache: drop anything older than ttl_s and
    cap the total size at max_keys. Called on every write so the cache
    can't grow unbounded over a long-running server.
    """
    now = time.time()
    stale = [k for k, (ts, _) in cache.items() if now - ts >= ttl_s]
    for k in stale:
        cache.pop(k, None)
    # If still over the cap, drop oldest entries until we're back at or below.
    # Run the cap BEFORE the new write so the steady-state ceiling stays
    # at max_keys: evict down to (max_keys - 1) to make room for the
    # about-to-be-written entry.
    while len(cache) >= max_keys:
        oldest_key = min(cache, key=lambda k: cache[k][0])
        cache.pop(oldest_key, None)


def _scrape_nba_games(date_str: str):
    """Fetch https://www.nba.com/games?date=date_str and return a list of
    games with metadata extracted from the rendered GameCard_* DOM. The
    numeric score fields are intentionally left null — scores are
    hydrated client-side at nba.com, so the static HTML doesn't carry
    them. The caller (`/katana/nba/scoreboard`) merges in ESPN data to
    fill in numeric scores.
    """
    url = NBA_GAMES_URL + (f"?date={date_str}" if date_str else "")
    headers = {
        # Browser-like headers are required; the default `requests` UA is
        # sent 403 by nba.com's edge.
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nba.com/",
        "Connection": "keep-alive",
    }
    resp = requests.get(url, headers=headers, timeout=NBA_TIMEOUT_S)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    games = []
    # Each game card is wrapped in <a class="...GameCard_gcm..." href="/game/{away}-vs-{home}-{gameId}">.
    for anchor in soup.find_all("a", href=re.compile(r"^/game/[a-z]{2,4}-vs-[a-z]{2,4}-[0-9]+")):
        href = anchor.get("href", "")
        m = re.match(r"^/game/([a-z]{2,4})-vs-([a-z]{2,4})-([0-9]+)", href)
        if not m:
            continue
        away_abbr = m.group(1).upper()
        home_abbr = m.group(2).upper()
        game_id = m.group(3)

        # Each <article> holds one team's logo + name + record. nba.com
        # always lists away first, home second — confirmed against the
        # URL slug order.
        articles = anchor.find_all("article")
        teams = []
        for art in articles:
            name_node = art.find(
                "span", class_=re.compile(r"MatchupCardTeamName_teamName")
            )
            full_name = name_node.get_text(strip=True) if name_node else ""
            # Team ID sits on the parent MatchupCardTeamName_base div.
            base_div = art.find("div", class_=re.compile(r"MatchupCardTeamName_base"))
            team_id = base_div.get("data-team-id", "") if base_div else ""
            # Logo: MatchupCardTeamLogo_* wrapping TeamLogo_* <img>.
            img = art.find("img", class_=re.compile(r"TeamLogo_logo"))
            logo = img.get("src", "") if img else ""
            # Record line ("12-3"). Falls back to '-' (off-season pre-game).
            rec_node = art.find(
                ["p", "span"], class_=re.compile(r"Record|Ecord")
            )
            if rec_node:
                rec_txt = rec_node.get_text(strip=True)
                record = "" if rec_txt in ("-", "—", "") else rec_txt
            else:
                record = ""
            teams.append(
                {
                    "id": team_id or "",
                    "abbr": _abbr_for_full_name(away_abbr, home_abbr, full_name, teams, "away"),
                    "name": full_name,
                    "fullName": full_name,
                    "shortName": full_name,
                    "shortDisplayName": full_name,
                    "displayName": full_name,
                    "logo": logo,
                    "score": None,
                    "winner": False,
                    "record": record,
                }
            )
        # We didn't know the abbrs in advance inside _abbr_for_full_name,
        # so fix them in place by index.
        if len(teams) >= 2:
            teams[0]["abbr"] = away_abbr
            teams[1]["abbr"] = home_abbr
        elif len(teams) == 1:
            teams[0]["abbr"] = away_abbr if not teams[0]["abbr"] else home_abbr

        if len(teams) < 2:
            # Cards with <2 article elements (corrupt markup, playoff bye,
            # etc.) would later produce empty `home: {}` and break
            # renderGameCard — skip them entirely.
            continue

        # Status: data-game-status="1" pre, "2" live (with p[data-is-live="true"]),
        # "3" final. The <p data-testid="game-status"> holds a friendly
        # string (e.g. "LIVE", "Final", "7:00 pm ET").
        status_node = anchor.find(
            "div", class_=re.compile(r"GameCardMatchupStatusText_gcs")
        )
        state = "pre"
        short_detail = ""
        if status_node:
            raw = status_node.get("data-game-status") or ""
            status_p = anchor.find("p", attrs={"data-testid": "game-status"})
            p_txt = status_p.get_text(strip=True) if status_p else ""
            if raw == "2" or status_p and status_p.get("data-is-live") == "true":
                state = "in"
                short_detail = p_txt or "LIVE"
            elif raw == "3":
                state = "post"
                short_detail = p_txt or "Final"
            else:
                state = "pre"
                short_detail = p_txt or ""

        # Optional playoff round text (e.g. "Finals", "Conf Semis").
        round_node = anchor.find(
            "p", class_=re.compile(r"gamePlayoffRoundText")
        )
        round_text = ""
        if round_node:
            span = round_node.find("span")
            round_text = span.get_text(strip=True) if span else round_node.get_text(strip=True)

        # Construct the headline ESPN-style detail. If scheduled, use the
        # friendly pre-game time string (e.g. "7:00 pm ET"); otherwise
        # use LIVE/Final.
        detail = short_detail

        name = f"{teams[0]['name']} @ {teams[1]['name']}"

        games.append(
            {
                # Stable id shared with ESPN's scoreboard gameId.
                "id": game_id,
                # Anchor URL on nba.com so the existing click-through handler
                # can be redirected later if we choose.
                "url": "https://www.nba.com" + href,
                "name": name,
                "shortName": name,
                "date": date_str,
                "league": "NBA",
                "leagueName": "NBA",
                "completed": state == "post",
                "live": state == "in",
                "state": state,
                "detail": detail,
                "shortDetail": short_detail,
                # `home` is always index 1; `away` is index 0 (per nba.com's
                # left-to-right ordering on /games).
                "home": teams[1] if len(teams) >= 2 else {},
                "away": teams[0],
                "series": round_text,
                "venue": "",
                "broadcast": "",
                "_source": "nba.com",
            }
        )
    return games


def _fetch_espn_scoreboard(date_str: str):
    """Fetch the parallel ESPN scoreboard JSON so we can fill numeric
    scores into the NBA.com scrape. ESPN's date param accepts YYYYMMDD.
    """
    compact = date_str.replace("-", "") if date_str else ""
    url = f"{ESPN_BASE_URL}/sports/basketball/nba/scoreboard"
    if compact:
        url += f"?dates={compact}"
    resp = requests.get(
        url,
        timeout=ESPN_TIMEOUT_S,
        headers={"User-Agent": "SportSync/1.0 (+katana_server)"},
    )
    resp.raise_for_status()
    return resp.json()


def _merge_scores(nba_games, espn_data):
    """For every NBA.com scrape row, find the matching ESPN row by
    (home_abbr, away_abbr) and copy in numeric scores + status overrides
    (LIVE clock/period, Final confirmation). Games only in ESPN (rare)
    are kept; games only in NBA.com keep null scores.
    """
    espn_events = (espn_data or {}).get("events", []) if espn_data else []
    espn_by_pair: dict = {}
    for ev in espn_events:
        comp = (ev.get("competitions") or [{}])[0]
        teams = comp.get("competitors", [])
        if len(teams) < 2:
            continue
        # ESPN marks home/away via homeAway field; some older shapes use
        # id-based ordering. Pick whichever ordering yields H/A labels.
        home_t = next((t for t in teams if t.get("homeAway") == "home"), teams[0])
        away_t = next((t for t in teams if t.get("homeAway") == "away"), teams[1])
        h_abbr = _espn_abbr_to_nba((home_t.get("team") or {}).get("abbreviation", ""))
        a_abbr = _espn_abbr_to_nba((away_t.get("team") or {}).get("abbreviation", ""))
        espn_by_pair[(h_abbr, a_abbr)] = ev

    merged = list(nba_games) if nba_games else []
    seen_pairs = set()
    for g in nba_games:
        pair = (g["home"].get("abbr", ""), g["away"].get("abbr", ""))
        seen_pairs.add(pair)
        ev = espn_by_pair.get(pair)
        if not ev:
            continue
        comp = (ev.get("competitions") or [{}])[0]
        teams = comp.get("competitors", [])
        home_t = next((t for t in teams if t.get("homeAway") == "home"), teams[0])
        away_t = next((t for t in teams if t.get("homeAway") == "away"), teams[1])
        # Map ESPN-ish status back to NBA.com-friendly state.
        st = (ev.get("status") or {}).get("type") or {}
        completed = bool(st.get("completed"))
        s_state = st.get("state")  # "pre" | "in" | "post"
        if completed:
            g["completed"] = True
            g["state"] = "post"
            g["live"] = False
        elif s_state == "in":
            g["completed"] = False
            g["state"] = "in"
            g["live"] = True
        else:
            g["completed"] = False
            g["state"] = "pre"
            g["live"] = False
        s_short = st.get("shortDetail") or st.get("detail") or ""
        s_detail = st.get("detail") or s_short
        if s_short:
            g["shortDetail"] = s_short
        if s_detail:
            g["detail"] = s_detail
        g["name"] = ev.get("name", g["name"])
        g["shortName"] = ev.get("shortName", g["shortName"])
        # Copy numeric scores (and a few enrichments).
        try:
            if home_t.get("score") is not None:
                g["home"]["score"] = str(home_t["score"])
            if away_t.get("score") is not None:
                g["away"]["score"] = str(away_t["score"])
        except Exception:
            pass
        # ESPN shape: winner flag.
        g["home"]["winner"] = bool(home_t.get("winner"))
        g["away"]["winner"] = bool(away_t.get("winner"))
        # Records (e.g. "12-3") when present.
        rec_home = (home_t.get("records") or [{}])[0]
        rec_away = (away_t.get("records") or [{}])[0]
        if rec_home.get("summary") and not g["home"].get("record"):
            g["home"]["record"] = rec_home["summary"]
        if rec_away.get("summary") and not g["away"].get("record"):
            g["away"]["record"] = rec_away["summary"]
        # Pull ESPN team's display logos IF nba.com's logo failed to load.
        if not g["home"].get("logo"):
            g["home"]["logo"] = (home_t.get("team") or {}).get("logo", "")
        if not g["away"].get("logo"):
            g["away"]["logo"] = (away_t.get("team") or {}).get("logo", "")
        # Venue + broadcast from ESPN if nba.com didn't carry them.
        if not g.get("venue"):
            g["venue"] = ((comp.get("venue") or {}).get("fullName")) or ""
        if not g.get("broadcast"):
            br = comp.get("broadcasts") or []
            if br and br[0].get("names"):
                g["broadcast"] = br[0]["names"][0]
        # Mark as merged for downstream consumers.
        g["_source"] = "nba.com+espn"
        g["_espnId"] = ev.get("id")

    # Also include ESPN-only games that didn't appear in nba.com's daily
    # slate (rare — usually replay/deferred). Filter to those whose date
    # matches the requested date so we don't accidentally show tomorrow.
    for ev in espn_events:
        comp = (ev.get("competitions") or [{}])[0]
        teams = comp.get("competitors", [])
        if len(teams) < 2:
            continue
        home_t = next((t for t in teams if t.get("homeAway") == "home"), teams[0])
        away_t = next((t for t in teams if t.get("homeAway") == "away"), teams[1])
        h_abbr = _espn_abbr_to_nba((home_t.get("team") or {}).get("abbreviation", ""))
        a_abbr = _espn_abbr_to_nba((away_t.get("team") or {}).get("abbreviation", ""))
        if (h_abbr, a_abbr) in seen_pairs:
            continue
        # Use ESPN rows directly (already in the right shape).
        merged.append(ev)

    return merged


@app.get("/katana/nba/scoreboard")
async def nba_scoreboard(date: str = Query(None)):
    """Scoreboard for a single NBA day.

    Source-of-truth: https://www.nba.com/games?date=YYYY-MM-DD.
    Numeric scores merged in from ESPN when possible.

    Accepts both YYYY-MM-DD and compact YYYYMMDD date strings so callers
    using ESPN-style dates (e.g. espn-api.js) work without pre-formatting.

    Cached for {NBA_CACHE_TTL_S} seconds per ISO date. Stale entries are
    evicted on every write so the cache can't grow unbounded.
    """
    raw = (date or "").strip()
    if raw and not re.fullmatch(r"\d{4}-\d{2}-\d{2}|\d{8}", raw):
        return JSONResponse(
            content={"error": f"date must be YYYY-MM-DD or YYYYMMDD: {raw!r}"},
            status_code=400,
        )
    date_str = _compact_to_iso(raw) or _date.today().isoformat()
    cached = _nba_scoreboard_cache.get(date_str)
    if cached and (time.time() - cached[0]) < NBA_CACHE_TTL_S:
        return JSONResponse(content=cached[1])

    payload = {
        # parseESPN_Scoreboard reads data.events directly; leagues[]
        # wrapping was unused, so we keep the envelope flat.
        "events": [],
        "source": "nba.com",
        "date": date_str,
    }
    try:
        nba_games = _scrape_nba_games(date_str)
        payload["events"] = nba_games
    except requests.RequestException as e:
        payload["scrape_error"] = f"nba.com: {e}"
    except Exception as e:
        payload["scrape_error"] = f"nba.com: {type(e).__name__}: {e}"

    # Always try to merge in ESPN for numeric scores — even if NBA.com
    # scrape returned nothing, return the raw ESPN events so the panel
    # never goes empty.
    try:
        espn_data = _fetch_espn_scoreboard(date_str)
        if payload["events"]:
            payload["events"] = _merge_scores(payload["events"], espn_data)
        else:
            payload["events"] = (espn_data or {}).get("events", []) or []
            payload["source"] = "espn"
    except requests.RequestException as e:
        payload["espn_error"] = f"espn: {e}"
    except Exception as e:
        payload["espn_error"] = f"espn: {type(e).__name__}: {e}"

    _evict_stale_cache(_nba_scoreboard_cache, NBA_CACHE_TTL_S, NBA_CACHE_MAX_KEYS)
    _nba_scoreboard_cache[date_str] = (time.time(), payload)
    return JSONResponse(content=payload)


@app.get("/katana/espn/teams")
async def espn_teams(sport: str, league: str):
    try:
        url = f"{ESPN_BASE_URL}/sports/{sport}/{league}/teams"
        resp = requests.get(
            url,
            timeout=ESPN_TIMEOUT_S,
            headers={"User-Agent": "SportSync/1.0 (+katana_server)"},
        )
        resp.raise_for_status()
        return JSONResponse(content=resp.json())
    except requests.RequestException as e:
        return JSONResponse(content={"error": f"upstream: {e}"}, status_code=502)


@app.get("/katana/espn/teams/{team_id}/schedule")
async def espn_team_schedule(team_id: str, sport: str, league: str):
    try:
        url = f"{ESPN_BASE_URL}/sports/{sport}/{league}/teams/{team_id}/schedule"
        resp = requests.get(
            url,
            timeout=ESPN_TIMEOUT_S,
            headers={"User-Agent": "SportSync/1.0 (+katana_server)"},
        )
        resp.raise_for_status()
        return JSONResponse(content=resp.json())
    except requests.RequestException as e:
        return JSONResponse(content={"error": f"upstream: {e}"}, status_code=502)
