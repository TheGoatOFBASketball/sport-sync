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

  async function fetchFromAPISports(){
    if (!APS_KEY) return [];
    try{
      const res = await fetch(`${API_SPORTS_BASE}livescores?league=NBA, NFL`, {
        headers: { 'X-Auth-Token': APS_KEY }
      });
      if(!res.ok) return [];
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
        status: e?.status?.short || 'LIVE'
      }));
    }catch(_){ return []; }
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

  window.SPORTSYNC = window.SPORTSYNC || {};
  window.SPORTSYNC.MultiSourceLive = {
    start: function(){
      async function tick(){
        const sources = await Promise.all([
          fetchFromAPISports(),
          fetchFromESPN(),
          fetchFromBalldontlie()
        ]);
        const events = reconcile(sources);
        const wrapper = document.getElementById('ticker-wrapper');
        const dup = document.getElementById('ticker-wrapper-duplicate');
        if(!wrapper) return;
        const html = events.map(e => `<span class="ticker-item">${e.home} vs ${e.away}${(e.homeScore!=null||e.awayScore!=null) ? ` ${e.homeScore ?? ''} - ${e.awayScore ?? ''}` : ''}</span>`).join(' ');
        wrapper.innerHTML = html;
        if (dup) dup.innerHTML = html;
      }
      tick();
      setInterval(tick, 60000);
    }
  };
})();
