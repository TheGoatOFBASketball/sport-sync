// Multi-Source Live Scores Reconciliation (Free sources)
// Primary: API-SPORTS livescores (free tier) - uses APS_API_KEY if available
// Backup 1: ESPN public endpoints (no key required)
// Backup 2: balldontlie (NBA) / or other free sources

(function(){
  const APS_KEY = (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('APS_API_KEY')) || '';
  const API_SPORTS_BASE = 'https://v3.football.api-sports.io/';
  const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/';
  const BALLDONLIT_BASE = 'https://www.balldontlie.io/api/v1/';

  function todayStr(){
    const d = new Date();
    const pad = (n) => (n<10?'0'+n:n);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function normalizeEvent(src, raw){
    if(!raw) return null;
    const base = {
      sport: raw.sport || src,
      league: raw.league || raw.leagueName || '',
      home: raw.home || raw.homeTeam || raw.homeName || '',
      away: raw.away || raw.awayTeam || raw.awayName || '',
      homeScore: raw.homeScore != null ? Number(raw.homeScore) : null,
      awayScore: raw.awayScore != null ? Number(raw.awayScore) : null,
      date: raw.date || raw.dateEvent || todayStr(),
      time: raw.time || raw.timeEvent || '',
      status: raw.status || raw.state || '',
      source: src
    };
    base.home = base.home?.toString?.() ?? '';
    base.away = base.away?.toString?.() ?? '';
    return base;
  }

  // Backoff wrapper
  async function fetchWithBackoff(sourceName, fn){
    const t = Date.now();
    if (nextAttempt[sourceName] && t < nextAttempt[sourceName]) return [];
    try{
      const res = await fn();
      // reset on success
      nextAttempt[sourceName] = 0;
      backoff[sourceName] = 0;
      return res || [];
    }catch(err){
      const next = (backoff[sourceName] || 1000) * 2;
      backoff[sourceName] = Math.min(MAX_BACKOFF, next);
      nextAttempt[sourceName] = t + backoff[sourceName];
      logDiscrepancy && logDiscrepancy(`Backoff for ${sourceName}: ${backoff[sourceName]}ms`);
      return [];
    }
  }

  async function fetchFromAPISports(){
    if (!APS_KEY) return [];
    return fetchWithBackoff('apisports', async () => {
      const res = await fetch(`${API_SPORTS_BASE}livescores?league=NBA, NFL`, {
        headers: { 'X-Auth-Token': APS_KEY }
      });
      if(!res.ok) throw new Error('APISports bad');
      const data = await res.json();
      const events = data?.response || [];
      return events.map(e => normalizeEvent('API-Sports', {
        sport: e?.league?.name || e?.sport?.name,
        league: e?.league?.name,
        home: e?.teams?.home?.name || e?.home?.name,
        away: e?.teams?.away?.name || e?.away?.name,
        homeScore: e?.scores?.home ?? e?.score?.home,
        awayScore: e?.scores?.away ?? e?.score?.away,
        date: e?.time?.date || (e?.fixture?.date ? new Date(e.fixture.date).toISOString().slice(0,10) : todayStr()),
        time: e?.time?.extra || e?.time?.time || '',
        status: e?.status?.short || 'LIVE',
        source: 'API-Sports'
      }));
    });
  }

  async function fetchFromESPN(){
    try{
      const res = await fetch(`${ESPN_BASE}basketball/nba/scoreboard`);
      if(!res.ok) return [];
      const data = await res.json();
      const events = data?.events || [];
      return events.map(ev => normalizeEvent('ESPN', {
        sport: 'NBA',
        league: data?.name || '',
        home: ev?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.shortDisplayName || '',
        away: ev?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.shortDisplayName || '',
        homeScore: ev?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.score,
        awayScore: ev?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.score,
        date: ev?.date ?? todayStr(),
        time: ev?.date ? ev.date : '',
        status: ev?.status?.type?.description ?? 'LIVE'
      }));
    }catch(_){ return []; }
  }

  async function fetchFromBalldontlie(){
    try{
      const date = todayStr();
      const res = await fetch(`${BALLDONLIT_BASE}games?dates[]=${date}`);
      if(!res.ok) return [];
      const data = await res.json();
      const games = data?.data || [];
      return games.map(g => normalizeEvent('Balldontlie', {
        sport: 'NBA', league: 'NBA', home: g.home_team?.full_name, away: g.visitor_team?.full_name,
        homeScore: g.home_team_score, awayScore: g.visitor_team_score, date: g.date, time: g.status, status: g.status
      }));
    }catch(_){ return []; }
  }

  function reconcile(lists){
    const map = new Map();
    const keyOf = (e)=>`${e.sport}||${e.league}||${e.home}||${e.away}||${e.date}`;
    for (const list of lists){
      for (const e of (list||[])){
        if(!e) continue;
        const k = keyOf(e);
        const existing = map.get(k);
        if(!existing) map.set(k, { ...e, _src: e.source || 'src' });
        else {
          const scorePresent = (e.homeScore != null) || (e.awayScore != null);
          const existScore = (existing.homeScore != null) || (existing.awayScore != null);
          if(scorePresent && !existScore){ map.set(k, { ...e, _src: e.source || 'src' }); }
        }
      }
    }
    return Array.from(map.values());
  }

  // Simple exponential backoff scaffolding per source
  const backoff = { apisports: 0, espn: 0, balldontlie: 0 };
  const nextAttempt = { apisports: 0, espn: 0, balldontlie: 0 };
  const MAX_BACKOFF = 5 * 60 * 1000; // 5 minutes
  function now() { return Date.now(); }
  function logDiscrepancy(msg){
    if (typeof require === 'function') {
      try {
        const fs = require('fs');
        fs.appendFileSync('/home/numberc/Desktop/sports sync/inaccurate_events.log', new Date().toISOString() + ' ' + msg + '\n');
        return;
      } catch(_){ }
    }
    // Fallback for browser environment
    console.log('[DISCREPANCY]', msg);
  }

  // Fixture/cache state
  let fixtureList = [];
  let fixtures = [];
  let lastFixtureRefresh = 0;
  function updateFixtureCache(all) {
    fixtureList = all || [];
    lastFixtureRefresh = Date.now();
  }

  // Schedule sources: TheSportsDB upcoming events (schedules)
  const TSDB_LEAGUE_IDS = {
    NBA: 4387,
    NFL: 4391,
    MLB: 4331,
    NHL: 4346
  };

  async function fetchScheduleFromTheSportsDB(){
    const leagues = Object.values(TSDB_LEAGUE_IDS);
    const names = Object.keys(TSDB_LEAGUE_IDS);
    const promises = leagues.map((id, idx) =>
      fetch(`https://www.thesportsdb.com/api/v1/json/1/eventsnextleague.php?id=${id}`)
        .then(r => r.json().catch(() => null))
        .then(data => {
          const arr = data?.events || [];
          const sport = names[idx];
          return arr.map(ev => ({
            sport,
            league: sport,
            home: ev?.strHomeTeam || ev?.homeTeam || '',
            away: ev?.strAwayTeam || ev?.awayTeam || '',
            date: ev?.dateEvent || ev?.dateEventLocal || '',
            time: ev?.strTime || '',
            status: ev?.status || ''
          }));
        })
        .catch(() => [])
    );
    const results = await Promise.all(promises);
    return results.flat();
  }

  window.SPORTSYNC = window.SPORTSYNC || {};
  window.SPORTSYNC.MultiSourceLive = {
    start: function(){
      async function tick(){
        const sources = await Promise.all([
          fetchFromAPISports(),
          fetchFromESPN(),
          fetchFromBalldontlie(),
          fetchScheduleFromTheSportsDB()
        ]);
        const all = [].concat(...sources);
        // Hourly fixture refresh (simulate first-fetch-all fixtures)
        if (Date.now() - lastFixtureRefresh > 3600000 || fixtureList.length === 0) {
          updateFixtureCache(all);
        } else {
          updateFixtureCache(fixtureList.concat(all));
        }
        // Pick live/in-progress games from cached fixtures
        const liveCandidates = fixtureList.filter(i => {
          const s = (i?.status || '') .toString().toLowerCase();
          return s.includes('live') || s.includes('in progress');
        });
        const toPoll = liveCandidates.length ? liveCandidates.slice(0, Math.min(10, liveCandidates.length)) : fixtureList.slice(0, 0);
        fixtures = toPoll;
        lastUpdated = Date.now();
        broadcast(fixtures);
        
        // Schedule: render upcoming events via TheSportsDB data plus any other sources if present
        const schedContainer = document.getElementById('sched-list');
        if (schedContainer) {
          const allSources = [].concat(...sources);
          const schedItems = allSources
            .filter(Boolean)
            .map(s => {
              const when = s.date || s.dateEvent || '';
              const ts = s.time || '';
              const home = s.home || '';
              const away = s.away || '';
              const label = (home || away) ? `${home} vs ${away}` : '';
              return `${when ? when + ' ' : ''}${ts ? ts + ' ' : ''}${label}`;
            })
            .filter(l => l).slice(0, 20)
            .map(l => `<div class="sched-item">${l}</div>`).join('');
          schedContainer.innerHTML = schedItems;
        }
        // Also render simple HTML on ticker (legacy path) if needed
        const wrapper = document.getElementById('ticker-wrapper');
        const dup = document.getElementById('ticker-wrapper-duplicate');
        if (wrapper && fixtures.length) {
        const html = fixtures.map(e => `<span class="ticker-item">${e.home} vs ${e.away}${(e.homeScore!=null||e.awayScore!=null) ? ` ${e.homeScore ?? ''} - ${e.awayScore ?? ''}` : ''} <span class="src-badge">${e.source ?? ''}</span></span>`).join(' ');
          wrapper.innerHTML = html;
          if (dup) dup.innerHTML = html;
        }
      }
      tick();
      setInterval(tick, 60000);
    }
  };
  // Auto-start on load if DOM is ready
  if (typeof window !== 'undefined' && window.SPORTSYNC && window.SPORTSYNC.MultiSourceLive && typeof window.SPORTSYNC.MultiSourceLive.start === 'function') {
    try { window.SPORTSYNC.MultiSourceLive.start(); } catch(e) { console.error(e); }
  }
})();
