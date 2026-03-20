document.addEventListener('DOMContentLoaded', () => {
  console.log('SportSync loading...');

  const API = window.SPORTSYNC_API;

  // ═══ THEME TOGGLE ═══
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      themeToggle.innerHTML = savedTheme === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
  }

  // ═══ SEARCH FUNCTIONALITY ═══
  const searchInput = document.getElementById('site-search');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
          const feedItems = document.querySelectorAll('.fd-card, .sched-ev, .tr-item');
          feedItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'flex' : 'none';
          });
          if (query.length > 0) {
            searchInput.value = '';
            searchInput.placeholder = `Found results for "${query}"`;
            setTimeout(() => { searchInput.placeholder = 'Search teams, players...'; }, 2000);
          }
        }
      }
    });
  }

  // ═══ MOBILE SIDEBAR ═══
  const ham = document.getElementById('ham');
  const sideL = document.getElementById('side-l');
  const mobOv = document.getElementById('mob-ov');
  if (ham && sideL) {
    ham.addEventListener('click', () => { sideL.classList.toggle('open'); mobOv?.classList.toggle('show'); });
    if (mobOv) mobOv.addEventListener('click', () => { sideL.classList.remove('open'); mobOv.classList.remove('show'); });
  }

  // ═══ NAV LINK HANDLERS ═══
  document.querySelectorAll('#snav .sn').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#snav .sn').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const sport = link.dataset.s;
      if (sport && sport !== 'all') {
        renderFeedBySport(sport);
      } else {
        renderFeed(null);
      }
    });
  });

  function renderFeedBySport(sport) {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;
    const sportData = getSportNews(sport);
    renderFeed(sportData);
  }

  function getSportNews(sport) {
    const allNews = [
      { headline: '2026 NFL Mock Draft: Round 1', description: 'Field Yates releases projections.', tags: ['NFL'] },
      { headline: 'SGA passes Wilt — 127 straight 20-pt', description: 'Historic streak continues.', tags: ['NBA'] },
      { headline: 'LeBron returns from injury', description: 'King James back for stretch run.', tags: ['NBA'] },
      { headline: 'Ohtani hitting .412 in spring', description: 'Two-way star continues hot start.', tags: ['MLB'] },
      { headline: 'Arsenal vs Chelsea Derby', description: 'Premier League title race.', tags: ['Soccer'] },
      { headline: 'Panarin reaches 100 points', description: 'Art Ross race heats up.', tags: ['NHL'] }
    ];
    return allNews.filter(n => n.tags[0].toLowerCase() === sport).concat(allNews);
  }

  // ═══ LIVE CLOCK ═══
  function updateClock() {
    const clocks = document.querySelectorAll('.live-clock');
    const now = new Date();
    clocks.forEach(clock => {
      clock.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ═══ DYNAMIC GREETING ═══
  function updateGreeting() {
    const greetEl = document.getElementById('greet');
    const greetSubEl = document.getElementById('greet-sub');
    const now = new Date();
    const h = now.getHours();
    const gText = h < 5 ? "LATE NIGHT" : h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
    if (greetEl) {
      greetEl.innerHTML = `<span class="greet-time">${now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</span> ${gText}`;
    }
    if (greetSubEl) {
      const msgs = [
        'March Madness • NFL Draft • MLB Season',
        'Live Scores • Breaking News • Your Teams',
        'Stay Updated on All Sports',
        '20+ Leagues • 24/7 Updates'
      ];
      greetSubEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    }
  }
  updateGreeting();
  setInterval(updateGreeting, 60000);

  // Initialize Live Updates via SSE (if available)
  (function initLiveSSE(){
    try {
      const url = window.SPORTSYNC_SSE_URL || '/live-updates';
      if (typeof EventSource === 'undefined') return;
      const es = new EventSource(url);
      es.addEventListener('update', (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          const fixtures = payload?.fixtures || [];
          // Re-render ticker with latest fixtures
          const wrapper = document.getElementById('ticker-wrapper');
          const dup = document.getElementById('ticker-wrapper-duplicate');
          if (wrapper) wrapper.innerHTML = fixtures.map(f => `<span class="ticker-item">${f.home || ''} ${f.away || ''} ${f.homeScore != null || f.awayScore != null ? '' : ''}</span>`).join(' ');
          if (dup && fixtures.length) dup.innerHTML = wrapper.innerHTML;
        } catch(_) { /* ignore */ }
      });
    } catch(_){ /* not available */ }
  })();

  // ═══ LOAD ALL ESPN DATA ═══
  async function loadAllData() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) loadingEl.style.display = 'flex';

    try {
      const [nbaScores, nbaNews, nflScores, mlbScores, nhlScores, eplScores, mlsScores] = await Promise.all([
        API.ESPN.getScoreboard('nba'),
        API.ESPN.getNews('nba', 15),
        API.ESPN.getScoreboard('nfl'),
        API.ESPN.getScoreboard('mlb'),
        API.ESPN.getScoreboard('nhl'),
        API.ESPN.getScoreboard('epl'),
        API.ESPN.getScoreboard('mls')
      ]);

      renderScoreboardTicker(nbaScores);
      renderFeed(API.ESPN.parse.news(nbaNews));
      renderAllScores({ nba: nbaScores, nfl: nflScores, mlb: mlbScores, nhl: nhlScores, epl: eplScores, mls: mlsScores });
      renderMyTeams();
      renderStandings();

    } catch (e) {
      console.error('Data load error:', e);
      loadFallbackData();
    }

    if (loadingEl) loadingEl.style.display = 'none';
  }

  function loadFallbackData() {
    renderScoreboardTicker(null);
    renderFeed(null);
  }

  // ═══ SCOREBOARD TICKER ═══
  function getTeamLogoHTML(sport, abbr, size = 20) {
    const logo = TeamLogos.getLogo(sport, abbr);
    if (logo) {
      return `<img src="${logo}" alt="${abbr}" style="width:${size}px;height:${size}px;object-fit:contain;" onerror="this.style.display='none'">`;
    }
    return abbr;
  }

  function renderScoreboardTicker(data) {
    const wrapper = document.getElementById('ticker-wrapper');
    const wrapperDup = document.getElementById('ticker-wrapper-duplicate');
    if (!wrapper) return;

    const events = data?.events || [];
    const scores = events.length > 0 
      ? API.ESPN.parse.scoreboard(data).slice(0, 8)
      : getFallbackScores();

    const tickerHTML = scores.map(g => {
      const sportKey = (g.league || 'NBA').toLowerCase();
      return `
      <div class="sbc${g.state === 'live' ? ' live' : ''}" data-league="${sportKey}">
        <div class="sbc-header">
          <span class="sbc-lg ${sportKey}">${g.league || 'NBA'}</span>
          <span class="sbc-st${g.state === 'live' ? ' live' : ''}">${g.state === 'live' ? '● ' : ''}${g.shortDetail || g.detail || 'TBD'}</span>
        </div>
        <div class="sbc-teams">
          <div class="sbc-row">
            <div class="team">
              <span class="team-logo">${getTeamLogoHTML(sportKey, g.away?.abbr)}</span>
              <span class="team-abbr">${g.away?.abbr || 'AWAY'}</span>
            </div>
            <span class="score${g.state !== 'live' ? ' not-live' : ''}">${g.away?.score ?? '-'}</span>
          </div>
          <div class="sbc-row">
            <div class="team">
              <span class="team-logo">${getTeamLogoHTML(sportKey, g.home?.abbr)}</span>
              <span class="team-abbr">${g.home?.abbr || 'HOME'}</span>
            </div>
            <span class="score${g.state !== 'live' ? ' not-live' : ''}">${g.home?.score ?? '-'}</span>
          </div>
        </div>
        <div class="sbc-footer">
          ${g.broadcast ? `<span class="sbc-tv">${g.broadcast}</span>` : ''}
          <span class="sbc-watch">Watch</span>
        </div>
      </div>
    `}).join('');

    wrapper.innerHTML = tickerHTML;
    if (wrapperDup) wrapperDup.innerHTML = tickerHTML;
  }

  function getFallbackScores() {
    return [
      { league: 'NBA', home: { abbr: 'LAL', score: 89 }, away: { abbr: 'SAS', score: 81 }, shortDetail: 'Q3 6:42', state: 'live', broadcast: 'ESPN+' },
      { league: 'NBA', home: { abbr: 'GSW', score: 108 }, away: { abbr: 'WAS', score: 97 }, shortDetail: 'Final', state: 'post', broadcast: 'ESPN' },
      { league: 'NFL', home: { abbr: 'KC', score: '' }, away: { abbr: 'SF', score: '' }, shortDetail: 'Thu 8:20 PM', state: 'pre', broadcast: 'NBC' },
      { league: 'MLB', home: { abbr: 'NYY', score: '' }, away: { abbr: 'TB', score: '' }, shortDetail: 'Mar 27', state: 'pre', broadcast: 'YES' },
      { league: 'EPL', home: { abbr: 'ARS', score: 2 }, away: { abbr: 'CHE', score: 1 }, shortDetail: 'HT', state: 'live', broadcast: 'NBC' },
      { league: 'NHL', home: { abbr: 'NYR', score: '' }, away: { abbr: 'NJD', score: '' }, shortDetail: '7:00 PM', state: 'pre', broadcast: 'MSG' },
      { league: 'MLS', home: { abbr: 'MIA', score: '' }, away: { abbr: 'LA', score: '' }, shortDetail: '8:00 PM', state: 'pre', broadcast: 'Apple TV+' }
    ];
  }

  // ═══ ALL SCORES SECTION ═══
  function renderAllScores(allData) {
    const container = document.getElementById('all-scores');
    if (!container) return;

    const sports = [
      { key: 'nba', name: 'NBA', icon: '🏀' },
      { key: 'nfl', name: 'NFL', icon: '🏈' },
      { key: 'mlb', name: 'MLB', icon: '⚾' },
      { key: 'nhl', name: 'NHL', icon: '🏒' },
      { key: 'epl', name: 'Premier League', icon: '⚽' },
      { key: 'mls', name: 'MLS', icon: '⚽' }
    ];

    container.innerHTML = sports.map(sport => {
      const data = allData[sport.key];
      const events = data?.events || [];
      const parsed = events.length > 0 ? API.ESPN.parse.scoreboard(data) : getSportFallback(sport.key);
      
      return `
        <div class="sport-section">
          <div class="sport-header">
            <h3>${sport.icon} ${sport.name}</h3>
            <span>${events.length || parsed.length} games</span>
          </div>
          <div class="sport-games">
            ${parsed.slice(0, 4).map(g => `
              <div class="game-row">
                <div class="game-teams">
                  <span class="game-team">${g.away?.abbr || 'AWAY'}</span>
                  <span class="game-score">${g.away?.score ?? '-'}</span>
                  <span style="color:var(--t2)">@</span>
                  <span class="game-score">${g.home?.score ?? '-'}</span>
                  <span class="game-team">${g.home?.abbr || 'HOME'}</span>
                </div>
                <span class="game-status">${g.shortDetail || g.detail || 'TBD'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function getSportFallback(sport) {
    const fallbacks = {
      nba: [
        { home: { abbr: 'LAL' }, away: { abbr: 'SAS' }, homeScore: 89, awayScore: 81, shortDetail: 'Q3' },
        { home: { abbr: 'GSW' }, away: { abbr: 'BOS' }, homeScore: 108, awayScore: 97, shortDetail: 'Final' },
        { home: { abbr: 'NYK' }, away: { abbr: 'PHI' }, shortDetail: 'Thu 7:30 PM' },
        { home: { abbr: 'DEN' }, away: { abbr: 'DAL' }, shortDetail: 'Thu 10:00 PM' }
      ],
      nfl: [
        { home: { abbr: 'KC' }, away: { abbr: 'SF' }, shortDetail: 'Thu 8:20 PM' },
        { home: { abbr: 'BUF' }, away: { abbr: 'MIA' }, shortDetail: 'Sun 1:00 PM' }
      ],
      mlb: [
        { home: { abbr: 'NYY' }, away: { abbr: 'TB' }, shortDetail: 'Mar 27' },
        { home: { abbr: 'LAD' }, away: { abbr: 'CHC' }, shortDetail: 'Mar 27' }
      ],
      nhl: [
        { home: { abbr: 'NYR' }, away: { abbr: 'NJD' }, shortDetail: '7:00 PM' },
        { home: { abbr: 'BOS' }, away: { abbr: 'TOR' }, shortDetail: '7:30 PM' }
      ],
      epl: [
        { home: { abbr: 'ARS' }, away: { abbr: 'CHE' }, homeScore: 2, awayScore: 1, shortDetail: 'HT' },
        { home: { abbr: 'MCI' }, away: { abbr: 'LIV' }, shortDetail: '11:30 AM' },
        { home: { abbr: 'MUN' }, away: { abbr: 'NEW' }, shortDetail: '2:00 PM' }
      ],
      mls: [
        { home: { abbr: 'MIA' }, away: { abbr: 'LA' }, shortDetail: '8:00 PM' },
        { home: { abbr: 'ATL' }, away: { abbr: 'NYC' }, shortDetail: '4:00 PM' }
      ]
    };
    return fallbacks[sport] || [];
  }

  // ═══ MY TEAMS ═══
  function renderMyTeams() {
    const mtRow = document.getElementById('mt-row');
    if (!mtRow) return;

    const teams = [
      { name: 'NY Knicks', color: '#f58426', stat: '33-28 • W5 streak', next: 'vs Celtics', when: 'Thu 7:30 PM', tv: 'MSG', arr: 'up' },
      { name: 'NY Yankees', color: '#003087', stat: 'Spring Training', next: 'vs Rays', when: 'Mar 27', tv: 'YES', arr: 'same' },
      { name: 'NY Giants', color: '#0b2265', stat: 'NFL Draft', next: 'Apr 23-25', when: 'Draft Day', tv: 'ESPN', arr: 'same' },
      { name: 'Duke BBall', color: '#003da5', stat: '#1 Seed', next: 'Round 1', when: 'Thu 12:15 PM', tv: 'CBS', arr: 'up' }
    ];

    mtRow.innerHTML = teams.map(t => `
      <div class="mtc-card" style="border-left-color:${t.color}">
        <h3>${t.name} <span class="mtc-arrow ${t.arr === 'up' ? 'up' : ''}">${t.arr === 'up' ? '↑' : (t.arr === 'down' ? '↓' : '—')}</span></h3>
        <div class="mtc-stat">${t.stat}</div>
        <div class="mtc-next">
          <span>${t.next} — ${t.when}</span>
          <span class="mtc-tv">${t.tv}</span>
        </div>
      </div>
    `).join('');
  }

  // ═══ SCHEDULE ═══
  const schedList = document.getElementById('sched-list');
  const schedData = [
    { day: 'Today', evs: [
      { t: '7:00 PM', sp: 'mlb', m: 'USA vs Venezuela (WBC Final)', tv: 'ESPN', live: false, ppv: true },
      { t: '7:00 PM', sp: 'nhl', m: 'Rangers vs Devils', tv: 'MSG', live: false },
      { t: 'Q3 6:42', sp: 'nba', m: 'Lakers vs Spurs', tv: 'ESPN+', live: true }
    ]},
    { day: 'Thu Mar 20', evs: [
      { t: '12:15 PM', sp: 'ncaam', m: 'March Madness begins', tv: 'CBS/TNT', live: false, ppv: true },
      { t: '7:30 PM', sp: 'nba', m: 'Knicks vs Celtics', tv: 'MSG', live: false, ppv: true },
      { t: '8:20 PM', sp: 'nfl', m: '49ers vs Chiefs', tv: 'NBC', live: false }
    ]},
    { day: 'Fri Mar 21', evs: [
      { t: '7:00 PM', sp: 'nba', m: 'Warriors vs Clippers', tv: 'ESPN', live: false },
      { t: '11:30 AM', sp: 'epl', m: 'Man City vs Liverpool', tv: 'NBC', live: false },
      { t: '8:00 PM', sp: 'mls', m: 'Inter Miami vs LA Galaxy', tv: 'Apple TV+', live: false }
    ]},
    { day: 'Thu Mar 27', evs: [
      { t: 'TBD', sp: 'mlb', m: 'Yankees vs Rays (Opening Day)', tv: 'YES', live: false, ppv: true }
    ]}
  ];

  function renderSched(filter) {
    if (!schedList) return;
    schedList.innerHTML = '';
    schedData.forEach(day => {
      let evs = day.evs;
      if (filter === 'live') evs = evs.filter(e => e.live);
      else if (filter === 'upcoming') evs = evs.filter(e => !e.live);
      else if (filter === 'myteams') evs = evs.filter(e => /Knicks|Yankees|Giants|Duke/.test(e.m));
      if (!evs.length) return;

      schedList.innerHTML += `<div class="sched-day">📅 ${day.day}</div>`;
      evs.forEach(e => {
        const ppvLink = e.ppv ? `<a href="https://ppv.to" target="_blank" class="se-ppv-link">PPV Stream</a>` : '';
        schedList.innerHTML += `
          <div class="sch-ev${e.live ? ' live' : ''}">
            <span class="se-t${e.live ? ' live' : ''}">${e.live ? '🔴 ' : ''}${e.t}</span>
            <span class="se-sp ${e.sp}">${e.sp.toUpperCase()}</span>
            <span class="se-m">${e.m}</span>
            <span class="se-tv">${e.tv}</span>
            ${ppvLink}
          </div>`;
      });
    });
  }
  renderSched('all');

  document.querySelectorAll('#sched-f .sf').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#sched-f .sf').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSched(btn.dataset.f);
    });
  });

  // ═══ NEWS FEED ═══
  function renderFeed(articles) {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;

    const data = articles?.length > 0 ? articles.slice(0, 10) : [
      { headline: '2026 NFL Mock Draft: Round 1', description: 'Field Yates releases first round projections.', tags: ['NFL'] },
      { headline: 'SGA passes Wilt — 127 straight 20-pt games', description: 'Historic streak continues for Thunder star.', tags: ['NBA'] },
      { headline: 'LeBron returns from injury', description: 'King James back for stretch run.', tags: ['NBA'] },
      { headline: 'Soto to miss Opening Day', description: 'Juan Soto suffers quad strain.', tags: ['MLB'] },
      { headline: 'Ohtani hitting .412 in spring', description: 'Two-way star continues hot start.', tags: ['MLB'] },
      { headline: 'Arsenal vs Chelsea Derby', description: 'Premier League title race heats up.', tags: ['EPL'] },
      { headline: 'March Madness Bracket Released', description: 'Duke #1 seed, Final Four predictions.', tags: ['NCAA'] }
    ];

    feedList.innerHTML = data.map(f => {
      const tag = f.tags?.[0] || f.type || 'SPORTS';
      const isFire = tag === 'NFL' || tag === 'NBA';
      return `
        <div class="fd-card">
          <div class="fd-img">
            ${isFire ? '<div class="fd-fire">🔥</div>' : ''}
            <i class="fa-solid fa-newspaper"></i>
          </div>
          <div class="fd-body">
            <div class="fd-tag">${tag}</div>
            <div class="fd-title">${f.headline || f.title}</div>
            <div class="fd-desc">${f.description || ''}</div>
          </div>
        </div>`;
    }).join('');
  }

  document.querySelectorAll('#feed-tabs .ft').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#feed-tabs .ft').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ═══ STANDINGS ═══
  function renderStandings() {
    const standings = document.getElementById('standings');
    if (!standings) return;

    const teams = [
      { name: 'Boston Celtics', abbr: 'BOS', rank: 1, wins: 45, losses: 12 },
      { name: 'NY Knicks', abbr: 'NYK', rank: 2, wins: 35, losses: 22 },
      { name: 'Milwaukee Bucks', abbr: 'MIL', rank: 3, wins: 37, losses: 21 },
      { name: 'Cleveland Cavaliers', abbr: 'CLE', rank: 4, wins: 34, losses: 24 },
      { name: 'Miami Heat', abbr: 'MIA', rank: 5, wins: 32, losses: 25 }
    ];

    standings.innerHTML = teams.map(t => `
      <div class="pr-item">
        <span class="pr-rank">${t.rank}</span>
        <div class="pr-info">
          <span class="pr-logo">${getTeamLogoHTML('nba', t.abbr, 20)}</span>
          <strong>${t.name}</strong>
          <p>${t.wins}-${t.losses}</p>
        </div>
        <span class="pr-badge ${t.rank <= 3 ? 'hot' : 'same'}">${t.rank <= 3 ? '🔥' : '—'}</span>
      </div>
    `).join('');
  }

  // ═══ TRENDING ═══
  const trEl = document.getElementById('trending');
  const trData = [
    { t: 'NFL Draft projections', m: 'Field Yates Round 1', shares: '14k' },
    { t: 'SGA 127-game streak', m: 'Passes Wilt', shares: '12k' },
    { t: 'March Madness', m: 'Duke #1 Seed', shares: '9k' },
    { t: 'LeBron returns', m: 'Lakers stretch run', shares: '8k' },
    { t: 'WBC Final', m: 'USA vs Venezuela', shares: '11k' },
    { t: 'Arsenal vs Chelsea', m: 'London Derby', shares: '7k' }
  ];

  if (trEl) {
    trEl.innerHTML = trData.map(t => `
      <div class="tr-item">
        <span class="tr-fire"><i class="fa-solid fa-fire" style="color:var(--fire)"></i></span>
        <div>
          <div class="tr-title">${t.t}</div>
          <div class="tr-meta">${t.m} • ${t.shares} shares</div>
        </div>
      </div>
    `).join('');
  }

  // ═══ PLAYER STATS ═══
  const playerContainer = document.getElementById('player-stats');
  const playerData = {
    nba: [
      { name: 'Shai Gilgeous-Alexander', team: 'OKC', stat: '31.2 PPG', trend: 'up' },
      { name: 'Nikola Jokic', team: 'DEN', stat: '26.4 PPG', trend: 'same' },
      { name: 'Luka Doncic', team: 'DAL', stat: '28.9 PPG', trend: 'up' },
      { name: 'Joel Embiid', team: 'PHI', stat: '34.7 PPG', trend: 'up' }
    ],
    nfl: [
      { name: 'Josh Allen', team: 'BUF', stat: '4,317 YDS', trend: 'up' },
      { name: 'Patrick Mahomes', team: 'KC', stat: '5,250 YDS', trend: 'same' },
      { name: 'Jalen Hurts', team: 'PHI', stat: '3,858 YDS', trend: 'up' },
      { name: 'Justin Jefferson', team: 'MIN', stat: '1,756 YDS', trend: 'same' }
    ],
    mlb: [
      { name: 'Shohei Ohtani', team: 'LAD', stat: '1.040 OPS', trend: 'up' },
      { name: 'Aaron Judge', team: 'NYY', stat: '62 HR', trend: 'same' },
      { name: 'Mike Trout', team: 'LAA', stat: '.317 AVG', trend: 'up' },
      { name: 'Mookie Betts', team: 'LAD', stat: '35 HR', trend: 'same' }
    ]
  };

  function renderPlayerStats(league) {
    if (!playerContainer) return;
    const players = playerData[league] || playerData.nba;
    playerContainer.innerHTML = players.map(p => `
      <div class="player-card">
        <div class="player-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="player-info">
          <div class="player-name">${p.name}</div>
          <div class="player-stat">${p.team} • ${p.stat}</div>
        </div>
        <span class="player-trend ${p.trend}">${p.trend === 'up' ? '↑' : (p.trend === 'down' ? '↓' : '—')}</span>
      </div>
    `).join('');
  }
  renderPlayerStats('nba');

  document.querySelectorAll('.player-filters .sf').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.player-filters .sf').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPlayerStats(btn.dataset.player);
    });
  });

  // ═══ INTERACTIVE POLL ═══
  const pollVotes = { usa: 55, ven: 45 };
  document.querySelectorAll('.po').forEach(btn => {
    btn.addEventListener('click', () => {
      const span = btn.querySelector('.po-p');
      if (span && !btn.classList.contains('voted')) {
        const isUSA = btn.querySelector('span').textContent.includes('USA');
        pollVotes[isUSA ? 'usa' : 'ven']++;
        const total = pollVotes.usa + pollVotes.ven;
        document.querySelectorAll('.po').forEach(b => {
          const p = b.querySelector('.po-p');
          const u = b.querySelector('span').textContent.includes('USA');
          const pct = Math.round((pollVotes[u ? 'usa' : 'ven'] / total) * 100);
          if (p) p.textContent = pct + '%';
          b.classList.add('voted');
        });
      }
    });
  });

  // ═══ NFL MOCK DRAFT ═══
  const draftData = {
    1: [
      { pick: 1, team: 'Titans', player: 'Cam Ward', pos: 'QB', school: 'Miami', grade: '98' },
      { pick: 2, team: 'Browns', player: 'Travis Hunter', pos: 'CB/WR', school: 'Colorado', grade: '97' },
      { pick: 3, team: 'Giants', player: 'Shedeur Sanders', pos: 'QB', school: 'Colorado', grade: '96' },
      { pick: 4, team: 'Patriots', player: 'Abdul Carter', pos: 'EDGE', school: 'Penn State', grade: '95' },
      { pick: 5, team: 'Jaguars', player: 'Tet McMillan', pos: 'WR', school: 'Ole Miss', grade: '94' },
      { pick: 6, team: 'Raiders', player: 'Will Johnson', pos: 'CB', school: 'Michigan', grade: '94' },
      { pick: 7, team: 'Jets', player: 'Mason Graham', pos: 'DT', school: 'Michigan', grade: '93' },
      { pick: 8, team: 'Panthers', player: 'Jalon Walker', pos: 'LB', school: 'Georgia', grade: '93' },
      { pick: 9, team: 'Lamar', player: 'James Pearce Jr', pos: 'EDGE', school: 'Tennessee', grade: '92' },
      { pick: 10, team: 'Raiders', player: 'Warren Zapoloa', pos: 'OT', school: 'Oregon', grade: '92' },
      { pick: 11, team: 'Bengals', player: 'Jihaad Campbell', pos: 'LB', school: 'Alabama', grade: '91' },
      { pick: 12, team: 'Cardinals', player: 'Colston Loveland', pos: 'TE', school: 'Michigan', grade: '91' }
    ],
    2: [
      { pick: 33, team: 'Titans', player: 'Ollie Gordon', pos: 'RB', school: 'Oklahoma', grade: '89' },
      { pick: 34, team: 'Browns', player: 'Malaki Starks', pos: 'S', school: 'Georgia', grade: '88' },
      { pick: 35, team: 'Panthers', player: 'Jersey Jackson', pos: 'QB', school: 'Alabama', grade: '88' },
      { pick: 36, team: 'Patriots', player: 'Deone Walker', pos: 'DL', school: 'Kentucky', grade: '87' },
      { pick: 37, team: 'Commanders', player: 'Benjamin Morrison', pos: 'CB', school: 'Notre Dame', grade: '87' },
      { pick: 38, team: 'Jaguars', player: 'Emeka Egbuka', pos: 'WR', school: 'Ohio State', grade: '86' }
    ],
    3: [
      { pick: 65, team: 'Titans', player: 'Lamar Murray', pos: 'WR', school: 'Texas A&M', grade: '82' },
      { pick: 66, team: 'Browns', player: 'Kevin Winston Jr', pos: 'S', school: 'Penn State', grade: '81' },
      { pick: 67, team: 'Giants', player: 'Jontah Gilbert', pos: 'DE', school: 'Virginia Tech', grade: '81' },
      { pick: 68, team: 'Patriots', player: 'Jayden Metchie', pos: 'OG', school: 'Alabama', grade: '80' },
      { pick: 69, team: 'Bills', player: 'Jaylin Clayton', pos: 'WR', school: 'Oregon', grade: '80' },
      { pick: 70, team: 'Dolphins', player: 'Jared Wilson', pos: 'OC', school: 'Georgia', grade: '79' }
    ]
  };

  function renderDraftBoard(round) {
    const board = document.getElementById('draft-board');
    if (!board) return;
    const picks = draftData[round] || draftData[1];
    board.innerHTML = picks.map(p => `
      <div class="dt-card">
        <span class="dt-pick">${p.pick}</span>
        <span class="dt-team">${p.team}</span>
        <span class="dt-player">${p.player}</span>
        <span class="dt-pos">${p.pos} • ${p.school}</span>
      </div>
    `).join('');
  }
  renderDraftBoard(1);

  document.querySelectorAll('.dr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dr-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDraftBoard(parseInt(btn.dataset.round));
    });
  });

  // ═══ LIVE INDICATOR ═══
  setInterval(() => {
    document.querySelectorAll('.sbc.live .sbc-st').forEach(el => {
      el.style.opacity = el.style.opacity === '0.5' ? '1' : '0.5';
    });
  }, 500);

  // ═══ LOAD ALL DATA ON INIT ═══
  loadAllData();

  // ═══ TheSportsDB Live Data Integration (NBA/NFL) ═══
  async function initTheSportsDBLive() {
    if (typeof window.TheSportsDB === 'undefined') return;
    try {
      async function refreshTicker() {
        const hasFn = typeof window.TheSportsDB?.fetchLiveScoresNBAandNFL === 'function';
        const events = hasFn ? await window.TheSportsDB.fetchLiveScoresNBAandNFL() : [];
        const tickerWrapper = document.getElementById('ticker-wrapper');
        const tickerDup = document.getElementById('ticker-wrapper-duplicate');
        if (!tickerWrapper) return;
        const items = (Array.isArray(events) ? events : []).map(ev => {
          const homeLogo = ev.homeLogo ? `<img src="${ev.homeLogo}" alt="" style="width:20px;height:20px;object-fit:contain;margin-right:4px;">` : '';
          const awayLogo = ev.awayLogo ? `<img src="${ev.awayLogo}" alt="" style="width:20px;height:20px;object-fit:contain;margin-left:4px;">` : '';
          const match = `${ev.home} vs ${ev.away}`;
          const score = (ev.homeScore != null || ev.awayScore != null) ? ` ${ev.homeScore ?? ''} - ${ev.awayScore ?? ''} ` : '';
          return `<span class="ticker-item">${homeLogo}${match}${score}${awayLogo}</span>`;
        }).join(' ');
        tickerWrapper.innerHTML = items;
        if (tickerDup) tickerDup.innerHTML = items;
      }
      await refreshTicker();
      setInterval(refreshTicker, 60000);
    } catch (e) {
      console.error('TheSportsDB live init error', e);
    }
  }

  // Start TheSportsDB live feed
  initTheSportsDBLive();

  console.log('✅ SportSync loaded successfully!');
  console.log('📡 APIs available:', Object.keys(window.SPORTSYNC_API).join(', '));
});
