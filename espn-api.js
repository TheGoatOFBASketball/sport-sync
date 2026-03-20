// ═══════════════════════════════════════════════════════
// SPORTSYNC - MULTI-API SPORTS DATA COLLECTION
// Powered by: ESPN API, Bleacher Report, TheSportsDB, BallDonLie
// ═══════════════════════════════════════════════════════

// ═══ ESPN API (site.api.espn.com) ═══
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2';
const ESPN_WEB = 'https://site.web.api.espn.com/apis';
const ESPN_CORE = 'https://sports.core.api.espn.com/v3';

// ═══ TEAM LOGOS CACHE ═══
const TeamLogos = {
  nba: {},
  nfl: {},
  mlb: {},
  nhl: {},
  epl: {},
  mls: {},
  ncaam: {},
  ncaaf: {},
  wnba: {},
  loaded: false,

  async loadAll() {
    if (this.loaded) return;
    const sports = ['nba', 'nfl', 'mlb', 'nhl', 'epl', 'mls', 'wnba'];
    await Promise.all(sports.map(s => this.loadSport(s)));
    this.loaded = true;
    console.log('🏀🏈⚾🏒⚽ Team logos loaded for all sports');
  },

  async loadSport(sport) {
    try {
      const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
      const response = await fetch(`${ESPN_BASE}/sports/${config.sport}/${config.league}/teams`);
      const data = await response.json();
      
      if (data?.sports?.[0]?.leagues?.[0]?.teams) {
        data.sports[0].leagues[0].teams.forEach(t => {
          this[sport][t.team.abbreviation] = {
            logo: t.team.logo,
            color: t.team.color,
            name: t.team.displayName,
            shortName: t.team.shortDisplayName
          };
        });
      }
    } catch (e) {
      console.warn(`Failed to load ${sport} logos:`, e.message);
    }
  },

  get(sport, abbr) {
    return this[sport]?.[abbr] || this[sport]?.[abbr.toUpperCase()] || null;
  },

  getLogo(sport, abbr) {
    const team = this.get(sport, abbr);
    return team?.logo || null;
  },

  getColor(sport, abbr) {
    const team = this.get(sport, abbr);
    return team?.color || '#333333';
  }
};

// Helper to create team logo HTML
function teamLogo(sport, abbr, size = 24, className = '') {
  const logo = TeamLogos.getLogo(sport, abbr);
  const color = TeamLogos.getColor(sport, abbr);
  if (logo) {
    return `<img src="${logo}" alt="${abbr}" class="team-logo-img ${className}" style="width:${size}px;height:${size}px;">`;
  }
  return `<span class="team-logo-fallback ${className}" style="width:${size}px;height:${size}px;background:${color};">${abbr || ''}</span>`;
}

const ESPN_SPORTS = {
  // Basketball
  nba: { sport: 'basketball', league: 'nba', name: 'NBA', icon: '🏀' },
  ncaam: { sport: 'basketball', league: 'mens-college-basketball', name: "Men's NCAA", icon: '🏀' },
  ncaaf_basketball: { sport: 'basketball', league: 'womens-college-basketball', name: "Women's NCAA", icon: '🏀' },
  wnba: { sport: 'basketball', league: 'wnba', name: 'WNBA', icon: '🏀' },
  eurobasket: { sport: 'basketball', league: 'euro.basketball', name: 'EuroBasket', icon: '🏀' },
  
  // Football (American)
  nfl: { sport: 'football', league: 'nfl', name: 'NFL', icon: '🏈' },
  ncaaf: { sport: 'football', league: 'college-football', name: 'NCAA Football', icon: '🏈' },
  cfl: { sport: 'football', league: 'cfl', name: 'CFL', icon: '🏈' },
  xfl: { sport: 'football', league: 'xfl', name: 'XFL', icon: '🏈' },
  
  // Baseball
  mlb: { sport: 'baseball', league: 'mlb', name: 'MLB', icon: '⚾' },
  wbc: { sport: 'baseball', league: 'wbc', name: 'World Baseball Classic', icon: '⚾' },
  ncaab: { sport: 'baseball', league: 'college-baseball', name: 'NCAA Baseball', icon: '⚾' },
  
  // Hockey
  nhl: { sport: 'hockey', league: 'nhl', name: 'NHL', icon: '🏒' },
  ncaah: { sport: 'hockey', league: 'mens-college-hockey', name: 'NCAA Hockey', icon: '🏒' },
  
  // Soccer - Major Leagues
  mls: { sport: 'soccer', league: 'usa.1', name: 'MLS', icon: '⚽' },
  epl: { sport: 'soccer', league: 'eng.1', name: 'Premier League', icon: '⚽' },
  laliga: { sport: 'soccer', league: 'esp.1', name: 'La Liga', icon: '⚽' },
  bundesliga: { sport: 'soccer', league: 'ger.1', name: 'Bundesliga', icon: '⚽' },
  seriea: { sport: 'soccer', league: 'ita.1', name: 'Serie A', icon: '⚽' },
  ligue1: { sport: 'soccer', league: 'fra.1', name: 'Ligue 1', icon: '⚽' },
  champions: { sport: 'soccer', league: 'uefa.champions', name: 'Champions League', icon: '⚽' },
  europa: { sport: 'soccer', league: 'uefa.europa', name: 'Europa League', icon: '⚽' },
  concacaf: { sport: 'soccer', league: 'concacaf.champions', name: 'CONCACAF Champions', icon: '⚽' },
  worldcup: { sport: 'soccer', league: 'fifa.world', name: 'World Cup', icon: '⚽' },
  
  // Soccer - Other
  netherlands: { sport: 'soccer', league: 'ned.1', name: 'Eredivisie', icon: '⚽' },
  portugal: { sport: 'soccer', league: 'por.1', name: 'Primeira Liga', icon: '⚽' },
  belgium: { sport: 'soccer', league: 'bel.1', name: 'Belgian Pro League', icon: '⚽' },
  
  // Other Sports
  tennis: { sport: 'tennis', league: 'tennis', name: 'Tennis', icon: '🎾' },
  golf: { sport: 'golf', league: 'pga', name: 'PGA Tour', icon: '⛳' },
  nascar: { sport: 'racing', league: 'nascar', name: 'NASCAR', icon: '🏎️' },
  ufc: { sport: 'mma', league: 'ufc', name: 'UFC', icon: '🥊' },
  boxing: { sport: 'boxing', league: 'boxing', name: 'Boxing', icon: '🥊' },
  cricket: { sport: 'cricket', league: 'cricket', name: 'Cricket', icon: '🏏' },
  rugby: { sport: 'rugby', league: 'rugby.union', name: 'Rugby Union', icon: '🏉' },
  rugby_league: { sport: 'rugby', league: 'rugby.league', name: 'Rugby League', icon: '🏉' },
  olympics: { sport: 'olympics', league: 'olympics', name: 'Olympics', icon: '🏅' },
  
  // Fantasy
  fantasy_nfl: { sport: 'football', league: 'fantasy/nfl', name: 'Fantasy NFL', icon: '🏈' },
  fantasy_nba: { sport: 'basketball', league: 'fantasy/nba', name: 'Fantasy NBA', icon: '🏀' }
};

// ═══ TheSportsDB API (Free - themoviedb.org) ═══
const THESPORTSDB_KEY = '1'; // Public free key
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json';

const THE_SPORTS_DB = {
  allLeagues: `${THESPORTSDB_BASE}/all_leagues.php`,
  lookupTeam: (id) => `${THESPORTSDB_BASE}/lookupteam.php?id=${id}`,
  lookupEvent: (id) => `${THESPORTSDB_BASE}/lookupevent.php?id=${id}`,
  eventsnextleague: (id) => `${THESPORTSDB_BASE}/eventsnextleague.php?id=${id}`,
  eventspastleague: (id) => `${THESPORTSDB_BASE}/eventspastleague.php?id=${id}`,
  searchteam: (team) => `${THESPORTSDB_BASE}/searchteam.php?t=${team}`,
  lookupTable: (id) => `${THESPORTSDB_BASE}/lookuptable.php?id=${id}`
};

// ═══ BallDonLie API (Free - balldontlie.io) ═══
const BALLDONLIE_BASE = 'https://api.balldontlie.io/v1';
const BALLDONLIE_KEY = 'demo'; // Free tier

// ═══ Generic Fetch Helper ═══
async function fetchJSON(url, options = {}) {
  try {
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('API Error:', url, e.message);
    return null;
  }
}

// ═══ ESPN FUNCTIONS ═══
async function getESPN_Scoreboard(sport = 'nba', date = null) {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  let url = `${ESPN_BASE}/sports/${config.sport}/${config.league}/scoreboard`;
  if (date) url += `?dates=${date}`;
  return await fetchJSON(url);
}

async function getESPN_News(sport = 'nba', limit = 20) {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/news?limit=${limit}`);
}

async function getESPN_Teams(sport = 'nba') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/teams`);
}

async function getESPN_TeamSchedule(teamId, sport = 'nba') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/teams/${teamId}/schedule`);
}

async function getESPN_Standings(sport = 'nba') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/standings`);
}

async function getESPN_Rankings(sport = 'ncaaf') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.ncaaf;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/rankings`);
}

async function getESPN_GameSummary(eventId, sport = 'nba') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_WEB}/v2/sports/${config.sport}/${config.league}/summary?event=${eventId}`);
}

async function getESPN_PlayByPlay(eventId, sport = 'nba') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/playbyplay?event=${eventId}`);
}

async function getESPN_BoxScore(eventId, sport = 'nba') {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  return await fetchJSON(`${ESPN_BASE}/sports/${config.sport}/${config.league}/boxscore?event=${eventId}`);
}

async function getESPN_Schedule(sport = 'nba', startDate = null, endDate = null) {
  const config = ESPN_SPORTS[sport] || ESPN_SPORTS.nba;
  let url = `${ESPN_BASE}/sports/${config.sport}/${config.league}/scoreboard`;
  const params = [];
  if (startDate) params.push(`dates=${startDate}`);
  if (endDate) params.push(`endDate=${endDate}`);
  if (params.length) url += '?' + params.join('&');
  return await fetchJSON(url);
}

async function getESPN_AllSportsScores(date = null) {
  const results = {};
  const sports = ['nba', 'nfl', 'mlb', 'nhl', 'ncaam', 'ncaaf', 'mls', 'epl', 'laliga', 'bundesliga', 'wnba', 'champions'];
  for (const sport of sports) {
    try {
      const data = await getESPN_Scoreboard(sport, date);
      if (data?.events?.length) results[sport] = data.events;
    } catch (e) {}
  }
  return results;
}

async function getESPN_AllNews() {
  const results = {};
  const sports = ['nba', 'nfl', 'mlb', 'nhl', 'ncaam', 'ncaaf', 'mls', 'epl'];
  for (const sport of sports) {
    try {
      const data = await getESPN_News(sport, 10);
      if (data?.articles?.length) results[sport] = data.articles;
    } catch (e) {}
  }
  return results;
}

// ═══ BALLDONLIE FUNCTIONS ═══
async function getBallDontLie_Players(page = 1, perPage = 25) {
  return await fetchJSON(`${BALLDONLIE_BASE}/players?page=${page}&per_page=${perPage}`);
}

async function getBallDontLie_Player(id) {
  return await fetchJSON(`${BALLDONLIE_BASE}/players/${id}`);
}

async function getBallDontLie_Games(date = null) {
  let url = `${BALLDONLIE_BASE}/games`;
  if (date) url += `?dates[]=${date}`;
  return await fetchJSON(url);
}

async function getBallDontLie_Teams() {
  return await fetchJSON(`${BALLDONLIE_BASE}/teams`);
}

async function getBallDontLie_Averages(playerId, season = 2024) {
  return await fetchJSON(`${BALLDONLIE_BASE}/season_averages?player_ids[]=${playerId}&season=${season}`);
}

// ═══ THESPORTSDB FUNCTIONS ═══
async function getSportsDB_Leagues() {
  return await fetchJSON(THE_SPORTS_DB.allLeagues);
}

async function getSportsDB_Team(teamId) {
  return await fetchJSON(THE_SPORTS_DB.lookupTeam(teamId));
}

async function getSportsDB_NextEvents(leagueId) {
  return await fetchJSON(THE_SPORTS_DB.eventsnextleague(leagueId));
}

async function getSportsDB_PastEvents(leagueId) {
  return await fetchJSON(THE_SPORTS_DB.eventspastleague(leagueId));
}

async function getSportsDB_Table(leagueId) {
  return await fetchJSON(THE_SPORTS_DB.lookupTable(leagueId));
}

async function getSportsDB_SearchTeam(teamName) {
  return await fetchJSON(THE_SPORTS_DB.searchteam(teamName));
}

// ═══ DATA PARSERS ═══
function parseESPN_Scoreboard(data) {
  if (!data?.events) return [];
  return data.events.map(event => {
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    const status = event.status;
    return {
      id: event.id,
      name: event.name,
      date: event.date,
      league: data.leagues?.[0]?.abbreviation || '',
      leagueName: data.leagues?.[0]?.name || '',
      completed: status.type.completed,
      period: status.period,
      clock: status.displayClock,
      state: status.type.state,
      detail: status.type.detail,
      shortDetail: status.type.shortDetail,
      home: {
        id: home?.id,
        name: home?.team?.shortDisplayName,
        fullName: home?.team?.displayName,
        abbr: home?.team?.abbreviation,
        logo: home?.team?.logo,
        score: home?.score,
        winner: home?.winner,
        record: home?.records?.[0]?.summary
      },
      away: {
        id: away?.id,
        name: away?.team?.shortDisplayName,
        fullName: away?.team?.displayName,
        abbr: away?.team?.abbreviation,
        logo: away?.team?.logo,
        score: away?.score,
        winner: away?.winner,
        record: away?.records?.[0]?.summary
      },
      venue: comp.venue?.fullName,
      broadcast: comp.broadcasts?.[0]?.names?.[0],
      odds: comp.odds?.[0]?.details,
      overUnder: comp.odds?.[0]?.overUnder
    };
  });
}

function parseESPN_News(data) {
  if (!data?.articles) return [];
  return data.articles.map(article => ({
    id: article.id,
    headline: article.headline,
    description: article.description,
    author: article.byline,
    image: article.images?.[0]?.url,
    thumbnail: article.thumbnail,
    link: article.links?.web?.href,
    published: article.published,
    related: article.related?.map(r => r.id),
    tags: article.categories?.map(c => c.description) || [],
    type: article.type
  }));
}

function parseESPN_Teams(data) {
  if (!data?.sports?.[0]?.leagues?.[0]?.teams) return [];
  return data.sports[0].leagues[0].teams.map(t => ({
    id: t.team.id,
    uid: t.team.uid,
    name: t.team.displayName,
    shortName: t.team.shortDisplayName,
    abbr: t.team.abbreviation,
    logo: t.team.logo,
    color: t.team.color,
    alternateColor: t.team.alternateColor,
    location: t.team.location,
    links: t.team.links
  }));
}

function parseESPN_Standings(data) {
  if (!data?.children) return [];
  const standings = [];
  data.children.forEach(group => {
    if (group.standings?.entries) {
      group.standings.entries.forEach(entry => {
        const getStat = (name) => entry.stats.find(s => s.name === name)?.value || '0';
        standings.push({
          rank: getStat('rank'),
          name: entry.team?.displayName,
          abbr: entry.team?.abbreviation,
          logo: entry.team?.logo,
          wins: getStat('wins'),
          losses: getStat('losses'),
          pct: getStat('pct'),
          streak: getStat('streak'),
          gb: getStat('gb'),
          home: getStat('home'),
          away: getStat('away'),
          conference: getStat('conference'),
          division: getStat('division')
        });
      });
    }
  });
  return standings;
}

function parseESPN_Rankings(data) {
  if (!data?.rankings) return [];
  const rankings = [];
  data.rankings.forEach(rank => {
    rank.ranked?.forEach(team => {
      rankings.push({
        rank: team.current,
        firstPlaceVotes: team.firstPlaceVotes,
        points: team.points,
        trend: team.trend,
        team: {
          id: team.team?.id,
          name: team.team?.displayName,
          abbr: team.team?.abbreviation,
          logo: team.team?.logo
        }
      });
    });
  });
  return rankings;
}

function parseESPN_GameSummary(data) {
  if (!data) return null;
  return {
    id: data.id,
    boxscore: data.boxscore,
    header: data.header,
    gameInfo: data.gameInfo,
    standings: data.standings,
    leaders: data.leaders,
    plays: data.plays?.map(p => ({
      id: p.id,
      text: p.text,
      clock: p.clock,
      period: p.period,
      scoreValue: p.scoreValue,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      team: p.team?.abbreviation,
      type: p.type
    }))
  };
}

// ═══ BLEACHER REPORT HELPER ═══
const BLEACHER_REPORT = {
  baseUrl: 'https://bleacherreport.com',
  apiUrl: 'http://bleacherreport.com/api',
  
  async getTrending(sport = 'nba') {
    // Note: B/R doesn't have a public API, these are RSS/embed alternatives
    return [
      { title: 'Latest from Bleacher Report', url: `${this.baseUrl}/${sport}` }
    ];
  }
};

// ═══ EXPORT ALL APIs ═══
window.SPORTSYNC_API = {
  // ESPN
  ESPN: {
    BASE: ESPN_BASE,
    SPORTS: ESPN_SPORTS,
    getScoreboard: getESPN_Scoreboard,
    getNews: getESPN_News,
    getTeams: getESPN_Teams,
    getTeamSchedule: getESPN_TeamSchedule,
    getStandings: getESPN_Standings,
    getRankings: getESPN_Rankings,
    getGameSummary: getESPN_GameSummary,
    getPlayByPlay: getESPN_PlayByPlay,
    getBoxScore: getESPN_BoxScore,
    getSchedule: getESPN_Schedule,
    getAllScores: getESPN_AllSportsScores,
    getAllNews: getESPN_AllNews,
    parse: {
      scoreboard: parseESPN_Scoreboard,
      news: parseESPN_News,
      teams: parseESPN_Teams,
      standings: parseESPN_Standings,
      rankings: parseESPN_Rankings,
      summary: parseESPN_GameSummary
    }
  },
  
  // BallDontLie
  BALLDONLIE: {
    BASE: BALLDONLIE_BASE,
    getPlayers: getBallDontLie_Players,
    getPlayer: getBallDontLie_Player,
    getGames: getBallDontLie_Games,
    getTeams: getBallDontLie_Teams,
    getAverages: getBallDontLie_Averages
  },
  
  // TheSportsDB
  THESPORTSDB: {
    BASE: THESPORTSDB_BASE,
    getLeagues: getSportsDB_Leagues,
    getTeam: getSportsDB_Team,
    getNextEvents: getSportsDB_NextEvents,
    getPastEvents: getSportsDB_PastEvents,
    getTable: getSportsDB_Table,
    searchTeam: getSportsDB_SearchTeam
  },
  
  // Bleacher Report
  BLEACHER_REPORT: BLEACHER_REPORT,
  
  // Utilities
  fetch: fetchJSON,
  
  // Quick access sports list
  SPORTS_LIST: Object.entries(ESPN_SPORTS).map(([key, val]) => ({
    id: key,
    name: val.name,
    icon: val.icon
  }))
};

console.log('🏆 SportSync API loaded! Available APIs:', Object.keys(window.SPORTSYNC_API).join(', '));
console.log('📋 Sports:', window.SPORTSYNC_API.SPORTS_LIST.map(s => s.icon + ' ' + s.name).join(', '));
