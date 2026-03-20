// TheSportsDB live data wrapper (read-only, client-side)
// Provides a lightweight API to fetch live scores and team logos.
// Note: You may override the API key by setting localStorage TSDB_API_KEY or editing this file.

(function(){
  const BASE = 'https://www.thesportsdb.com/api/v1/json/';
  const DEFAULT_KEY = '1';
  const cfg = {
    key: (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('TSDB_API_KEY')) || DEFAULT_KEY,
    logoCache: {},
  };

  async function fetchJSON(path){
    const url = `${BASE}${cfg.key}/${path}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(`TSDB fetch error: ${res.status}`);
    const data = await res.json();
    return data;
  }

  const TheSportsDB = {
    setApiKey: function(k){ cfg.key = k; },
    getApiKey: function(){ return cfg.key; },
    async getTeamLogo(teamName){
      if(!teamName) return null;
      if(cfg.logoCache[teamName] !== undefined) return cfg.logoCache[teamName];
      try{
        const data = await fetchJSON(`searchteams.php?t=${encodeURIComponent(teamName)}`);
        const t = data?.teams?.[0];
        const logo = t?.strTeamBadge || t?.strTeamLogo || null;
        cfg.logoCache[teamName] = logo;
        return logo;
      }catch(e){
        cfg.logoCache[teamName] = null;
        return null;
      }
    },
    async fetchLiveScoresNBAandNFL(){
      const leagues = [
        { sport: 'NBA', id: '4387' },
        { sport: 'NFL', id: '4391' }
      ];
      let all = [];
      for (const L of leagues){
        try{
          const data = await fetchJSON(`eventsnextleague.php?id=${L.id}`);
          const events = data?.events || [];
          for (const e of events){
            const home = e.strHomeTeam || '';
            const away = e.strAwayTeam || '';
            const homeScore = (e.intHomeScore != null && !isNaN(Number(e.intHomeScore))) ? Number(e.intHomeScore) : null;
            const awayScore = (e.intAwayScore != null && !isNaN(Number(e.intAwayScore))) ? Number(e.intAwayScore) : null;
            const date = e.dateEvent || '';
            const time = e.strTime || '';
            const status = e.strStatus || (home && away ? 'Scheduled' : 'N/A');
            all.push({ sport: L.sport, leagueId: L.id, home, away, homeScore, awayScore, date, time, status, homeLogo: null, awayLogo: null });
          }
        }catch(err){ }
      }
      for (const g of all){
        g.homeLogo = await this.getTeamLogo(g.home);
        g.awayLogo = await this.getTeamLogo(g.away);
      }
      return all;
    }
  };

  if (typeof window !== 'undefined') window.TheSportsDB = TheSportsDB;
})();
