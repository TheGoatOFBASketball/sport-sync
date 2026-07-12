# SPORTSYNC - Multi-API Sports Dashboard

## Overview
SportSync is a comprehensive sports dashboard that aggregates data from multiple free sports APIs to provide live scores, news, standings, and more across 40+ sports leagues.

## APIs Integrated

### 1. ESPN API (Primary)
**Base URL:** `https://site.api.espn.com/apis/site/v2`

The ESPN API powers the core of SportSync with real-time scores, news, and standings data.

#### Supported Sports (20+)
```
Basketball:  NBA, Men's NCAA, Women's NCAA, WNBA, EuroBasket
Football:    NFL, NCAA Football, CFL, XFL
Baseball:    MLB, WBC, NCAA Baseball
Hockey:      NHL, NCAA Hockey
Soccer:      MLS, Premier League, La Liga, Bundesliga, Serie A, 
             Ligue 1, Champions League, Europa League, World Cup,
             Eredivisie, Primeira Liga
Other:       Tennis, Golf, NASCAR, UFC, Boxing, Cricket, Rugby, Olympics
```

#### Endpoints
| Sport | Scoreboard | News | Teams |
|-------|-----------|------|-------|
| NBA | `/sports/basketball/nba/scoreboard` | `/sports/basketball/nba/news` | `/sports/basketball/nba/teams` |
| NFL | `/sports/football/nfl/scoreboard` | `/sports/football/nfl/news` | `/sports/football/nfl/teams` |
| MLB | `/sports/baseball/mlb/scoreboard` | `/sports/baseball/mlb/news` | `/sports/baseball/mlb/teams` |
| EPL | `/sports/soccer/eng.1/scoreboard` | `/sports/soccer/eng.1/news` | `/sports/soccer/eng.1/teams` |

#### Query Parameters
- `dates=YYYYMMDD` - Specific date
- `limit=N` - Number of results
- `dates=YYYYMMDD-YYYYMMDD` - Date range

---

### 2. BallDonLie API (NBA Stats)
**Base URL:** `https://api.balldontlie.io/v1`

Free API for NBA player statistics, game data, and team information.

#### Endpoints
- `/players` - All players
- `/players/:id` - Player details
- `/games` - Game data
- `/teams` - All NBA teams
- `/season_averages` - Player season stats

---

### 3. TheSportsDB (Free Sports Database)
**Base URL:** `https://www.thesportsdb.com/api/v1/json/1`

Community-driven sports database with leagues, teams, events, and tables.

#### Endpoints
- `/all_leagues.php` - All sports leagues
- `/lookupteam.php?id=ID` - Team details
- `/eventsnextleague.php?id=LEAGUE_ID` - Upcoming events
- `/eventspastleague.php?id=LEAGUE_ID` - Past events
- `/lookuptable.php?id=LEAGUE_ID` - League standings

---

## Local Development

1. Open `index.html` in a browser
2. The app will automatically fetch live data from ESPN
3. If API fails, fallback data is displayed

### File Structure
```
sports-sync/
├── index.html           # Main dashboard
├── index.css            # Styles
├── main.js              # Dashboard logic
├── espn-api.js          # Multi-API wrapper
├── nba.html             # NBA Basketball Hub
├── nba-draft.html       # NBA Draft + Lottery Simulator
├── mock-draft.html      # NFL Mock Draft 2026
├── nfl-draft.html       # NFL Draft 2026 (7 rounds)
├── march-madness.html   # March Madness 2026 Bracket
└── *.png/*.webp        # Images
```

## Features
- ✅ Live Scores (20+ sports)
- ✅ ESPN-Style Scrolling Ticker
- ✅ News Feed
- ✅ Standings
- ✅ Team Schedules
- ✅ Player Stats
- ✅ Interactive Polls
- ✅ Dark/Light Mode
- ✅ Mobile Responsive
- ✅ PPV Streaming Links
- ✅ Multi-page Navigation
  - **NBA Hub** - Scores, standings, players, news
  - **NBA Draft** - Slot machine lottery simulator (Tankathon odds), big board, mock draft
  - **NFL Draft** - 7-round mock draft, trades, big board, position rankings
  - **March Madness** - Bracket, live games, upset alerts, predictions

## Deploy to Vercel

The repo is a static site — no build step required.

### One-time setup
```bash
npm i -g vercel            # install Vercel CLI
vercel login               # authenticate
```

### Deploy
From the project root:
```bash
vercel                     # preview deploy (interactive)
# or
vercel --prod              # production deploy
```
Accept the prompts: Framework = **Other**, Root Directory = **./**, Build Command = (leave blank), Output Directory = (leave blank).

`vercel.json` already enables:
- `cleanUrls` → `/nba` resolves to `nba.html`, `/index` to `index.html`, etc.
- Immutable `Cache-Control` for `*.js / *.css / images`.
- `must-revalidate` cache for `*.html`.

### URLs after deploy
- `/` → landing dashboard
- `/nba` → NBA Summer League 2026 hub (light theme)
- `/nba-draft`, `/nfl-hub`, `/mlb-hub`, `/wnba-hub`, `/soccer-hub`, `/nhl-hub`, `/march-madness`, `/nba-contracts`, `/nfl-draft`, `/mock-draft` → sibling hubs

### Proxy caveat
The optional `backend/katana_server/` FastAPI scraper runs on `localhost:8000` and is **not** deployed to Vercel (servers aren't supported on the static plan). On Vercel the page automatically falls back to direct ESPN/CDN calls — no code changes needed.

If you ever want a proxy in production, deploy `backend/` to Render/Fly.io and set `window.SPORTSYNC_PROXY_BASE = "https://your-proxy.onrender.com"` *before* `espn-api.js` loads.

## License
For educational and personal use only. Data from ESPN is property of ESPN Inc.
