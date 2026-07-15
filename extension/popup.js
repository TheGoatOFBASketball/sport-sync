// SportSync Browser Extension - Popup Script

const TEAMS_DATA = {
  nba: [
    { name: 'Atlanta Hawks', abbr: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png' },
    { name: 'Boston Celtics', abbr: 'BOS', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' },
    { name: 'Brooklyn Nets', abbr: 'BKN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png' },
    { name: 'Charlotte Hornets', abbr: 'CHA', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png' },
    { name: 'Chicago Bulls', abbr: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' },
    { name: 'Cleveland Cavaliers', abbr: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' },
    { name: 'Dallas Mavericks', abbr: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' },
    { name: 'Denver Nuggets', abbr: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png' },
    { name: 'Detroit Pistons', abbr: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png' },
    { name: 'Golden State Warriors', abbr: 'GS', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png' },
    { name: 'Houston Rockets', abbr: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png' },
    { name: 'Indiana Pacers', abbr: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png' },
    { name: 'LA Clippers', abbr: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png' },
    { name: 'Los Angeles Lakers', abbr: 'LAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
    { name: 'Memphis Grizzlies', abbr: 'MEM', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png' },
    { name: 'Miami Heat', abbr: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' },
    { name: 'Milwaukee Bucks', abbr: 'MIL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' },
    { name: 'Minnesota Timberwolves', abbr: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' },
    { name: 'New Orleans Pelicans', abbr: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/no.png' },
    { name: 'New York Knicks', abbr: 'NY', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png' },
    { name: 'Oklahoma City Thunder', abbr: 'OKC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' },
    { name: 'Orlando Magic', abbr: 'ORL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png' },
    { name: 'Philadelphia 76ers', abbr: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' },
    { name: 'Phoenix Suns', abbr: 'PHX', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' },
    { name: 'Portland Trail Blazers', abbr: 'POR', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' },
    { name: 'Sacramento Kings', abbr: 'SAC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png' },
    { name: 'San Antonio Spurs', abbr: 'SA', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png' },
    { name: 'Toronto Raptors', abbr: 'TOR', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png' },
    { name: 'Utah Jazz', abbr: 'UTAH', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png' },
    { name: 'Washington Wizards', abbr: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png' }
  ],
  nfl: [
    { name: 'Arizona Cardinals', abbr: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
    { name: 'Atlanta Falcons', abbr: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
    { name: 'Baltimore Ravens', abbr: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
    { name: 'Buffalo Bills', abbr: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
    { name: 'Carolina Panthers', abbr: 'CAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
    { name: 'Chicago Bears', abbr: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
    { name: 'Cincinnati Bengals', abbr: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
    { name: 'Cleveland Browns', abbr: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
    { name: 'Dallas Cowboys', abbr: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
    { name: 'Denver Broncos', abbr: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
    { name: 'Detroit Lions', abbr: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
    { name: 'Green Bay Packers', abbr: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
    { name: 'Houston Texans', abbr: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
    { name: 'Indianapolis Colts', abbr: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
    { name: 'Jacksonville Jaguars', abbr: 'JAX', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
    { name: 'Kansas City Chiefs', abbr: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
    { name: 'Las Vegas Raiders', abbr: 'LV', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
    { name: 'Los Angeles Chargers', abbr: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
    { name: 'Los Angeles Rams', abbr: 'LAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
    { name: 'Miami Dolphins', abbr: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
    { name: 'Minnesota Vikings', abbr: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
    { name: 'New England Patriots', abbr: 'NE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
    { name: 'New Orleans Saints', abbr: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
    { name: 'New York Giants', abbr: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
    { name: 'New York Jets', abbr: 'NYJ', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
    { name: 'Philadelphia Eagles', abbr: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
    { name: 'Pittsburgh Steelers', abbr: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
    { name: 'San Francisco 49ers', abbr: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
    { name: 'Seattle Seahawks', abbr: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
    { name: 'Tampa Bay Buccaneers', abbr: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
    { name: 'Tennessee Titans', abbr: 'TEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
    { name: 'Washington Commanders', abbr: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' }
  ],
  mlb: [
    { name: 'Arizona Diamondbacks', abbr: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/ari.png' },
    { name: 'Atlanta Braves', abbr: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png' },
    { name: 'Baltimore Orioles', abbr: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/bal.png' },
    { name: 'Boston Red Sox', abbr: 'BOS', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png' },
    { name: 'Chicago Cubs', abbr: 'CHC', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
    { name: 'Chicago White Sox', abbr: 'CWS', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/cws.png' },
    { name: 'Cincinnati Reds', abbr: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/cin.png' },
    { name: 'Cleveland Guardians', abbr: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/cle.png' },
    { name: 'Colorado Rockies', abbr: 'COL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png' },
    { name: 'Detroit Tigers', abbr: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/det.png' },
    { name: 'Houston Astros', abbr: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png' },
    { name: 'Kansas City Royals', abbr: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/kc.png' },
    { name: 'Los Angeles Angels', abbr: 'LAA', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png' },
    { name: 'Los Angeles Dodgers', abbr: 'LAD', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png' },
    { name: 'Miami Marlins', abbr: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/mia.png' },
    { name: 'Milwaukee Brewers', abbr: 'MIL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/mil.png' },
    { name: 'Minnesota Twins', abbr: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/min.png' },
    { name: 'New York Mets', abbr: 'NYM', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png' },
    { name: 'New York Yankees', abbr: 'NYY', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png' },
    { name: 'Oakland Athletics', abbr: 'OAK', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/oak.png' },
    { name: 'Philadelphia Phillies', abbr: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png' },
    { name: 'Pittsburgh Pirates', abbr: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/pit.png' },
    { name: 'San Diego Padres', abbr: 'SD', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png' },
    { name: 'San Francisco Giants', abbr: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png' },
    { name: 'Seattle Mariners', abbr: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sea.png' },
    { name: 'St. Louis Cardinals', abbr: 'STL', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png' },
    { name: 'Tampa Bay Rays', abbr: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/tb.png' },
    { name: 'Texas Rangers', abbr: 'TEX', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png' },
    { name: 'Toronto Blue Jays', abbr: 'TOR', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/tor.png' },
    { name: 'Washington Nationals', abbr: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png' }
  ],
  nhl: [
    { name: 'Anaheim Ducks', abbr: 'ANA', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/ana.png' },
    { name: 'Boston Bruins', abbr: 'BOS', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png' },
    { name: 'Buffalo Sabres', abbr: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png' },
    { name: 'Calgary Flames', abbr: 'CGY', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/cgy.png' },
    { name: 'Carolina Hurricanes', abbr: 'CAR', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/car.png' },
    { name: 'Chicago Blackhawks', abbr: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/chi.png' },
    { name: 'Colorado Avalanche', abbr: 'COL', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/col.png' },
    { name: 'Columbus Blue Jackets', abbr: 'CBJ', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/cbj.png' },
    { name: 'Dallas Stars', abbr: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/dal.png' },
    { name: 'Detroit Red Wings', abbr: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/det.png' },
    { name: 'Edmonton Oilers', abbr: 'EDM', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/edm.png' },
    { name: 'Florida Panthers', abbr: 'FLA', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/fla.png' },
    { name: 'Los Angeles Kings', abbr: 'LA', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/la.png' },
    { name: 'Minnesota Wild', abbr: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/min.png' },
    { name: 'Montréal Canadiens', abbr: 'MTL', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png' },
    { name: 'Nashville Predators', abbr: 'NSH', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png' },
    { name: 'New Jersey Devils', abbr: 'NJ', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nj.png' },
    { name: 'New York Islanders', abbr: 'NYI', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyi.png' },
    { name: 'New York Rangers', abbr: 'NYR', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png' },
    { name: 'Ottawa Senators', abbr: 'OTT', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/ott.png' },
    { name: 'Philadelphia Flyers', abbr: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/phi.png' },
    { name: 'Pittsburgh Penguins', abbr: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/pit.png' },
    { name: 'San Jose Sharks', abbr: 'SJ', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/sj.png' },
    { name: 'Seattle Kraken', abbr: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/sea.png' },
    { name: 'St. Louis Blues', abbr: 'STL', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/stl.png' },
    { name: 'Tampa Bay Lightning', abbr: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/tb.png' },
    { name: 'Toronto Maple Leafs', abbr: 'TOR', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/tor.png' },
    { name: 'Vegas Golden Knights', abbr: 'VGK', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png' },
    { name: 'Washington Capitals', abbr: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png' },
    { name: 'Winnipeg Jets', abbr: 'WPG', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png' }
  ],
  wnba: [
    { name: 'Atlanta Dream', abbr: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/atl.png' },
    { name: 'Chicago Sky', abbr: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/chi.png' },
    { name: 'Connecticut Sun', abbr: 'CON', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/con.png' },
    { name: 'Dallas Wings', abbr: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/dal.png' },
    { name: 'Golden State Valkyries', abbr: 'GS', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/gs.png' },
    { name: 'Indiana Fever', abbr: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/ind.png' },
    { name: 'Las Vegas Aces', abbr: 'LV', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/lv.png' },
    { name: 'Los Angeles Sparks', abbr: 'LA', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/la.png' },
    { name: 'Minnesota Lynx', abbr: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/min.png' },
    { name: 'New York Liberty', abbr: 'NY', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/ny.png' },
    { name: 'Phoenix Mercury', abbr: 'PHX', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/phx.png' },
    { name: 'Portland Firebirds', abbr: 'POR', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/por.png' },
    { name: 'Seattle Storm', abbr: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/sea.png' },
    { name: 'Toronto Tempo', abbr: 'TOR', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/tor.png' },
    { name: 'Washington Mystics', abbr: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/wsh.png' }
  ]
};

// Default teams
const DEFAULT_TEAMS = [
  { name: 'Duke Blue Devils', abbr: 'DUKE', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/150.png', league: 'ncaa' },
  { name: 'New York Knicks', abbr: 'NY', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png', league: 'nba' },
  { name: 'New York Yankees', abbr: 'NYY', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png', league: 'mlb' },
  { name: 'New York Giants', abbr: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png', league: 'nfl' }
];

let myTeams = [];
let currentLeague = 'nba';

// Load teams from storage
async function loadTeams() {
  const result = await chrome.storage.local.get(['myTeams']);
  if (result.myTeams && result.myTeams.length > 0) {
    myTeams = result.myTeams;
  } else {
    myTeams = [...DEFAULT_TEAMS];
    await saveTeams();
  }
  renderTeams();
}

// Save teams to storage
async function saveTeams() {
  await chrome.storage.local.set({ myTeams });
}

// Render teams list
function renderTeams() {
  const teamList = document.getElementById('teamList');
  if (myTeams.length === 0) {
    teamList.innerHTML = '<div class="empty">No teams added yet</div>';
    return;
  }
  teamList.innerHTML = myTeams.map((team, index) => `
    <div class="team-item" data-index="${index}">
      <img src="${team.logo}" alt="${team.name}" onerror="this.style.display='none'">
      <span class="team-name">${team.name}</span>
      <span class="team-remove" data-index="${index}">×</span>
    </div>
  `).join('');

  // Add event listeners
  teamList.querySelectorAll('.team-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      myTeams.splice(index, 1);
      saveTeams();
      renderTeams();
    });
  });
}

// Render search results
function renderSearchResults(query = '') {
  const results = document.getElementById('searchResults');
  let teams = TEAMS_DATA[currentLeague] || [];
  
  if (query) {
    const q = query.toLowerCase();
    teams = teams.filter(t => t.name.toLowerCase().includes(q));
  }

  if (teams.length === 0) {
    results.innerHTML = '<div class="empty">No teams found</div>';
    return;
  }

  results.innerHTML = teams.map(team => `
    <div class="search-result" data-name="${team.name}" data-abbr="${team.abbr}" data-logo="${team.logo}">
      <img src="${team.logo}" alt="${team.name}" onerror="this.style.display='none'">
      <span>${team.name}</span>
      <i class="fa-solid fa-plus add-icon"></i>
    </div>
  `).join('');

  // Add click handlers
  results.querySelectorAll('.search-result').forEach(result => {
    result.addEventListener('click', () => {
      const team = {
        name: result.dataset.name,
        abbr: result.dataset.abbr,
        logo: result.dataset.logo,
        league: currentLeague
      };
      
      // Check if already added
      if (!myTeams.find(t => t.abbr === team.abbr && t.league === team.league)) {
        myTeams.push(team);
        saveTeams();
        renderTeams();
      }
      
      // Switch back to teams view
      document.getElementById('myTeamsSection').style.display = 'block';
      document.getElementById('addTeamSection').style.display = 'none';
    });
  });
}

// Event listeners
document.getElementById('openAddModal').addEventListener('click', () => {
  document.getElementById('myTeamsSection').style.display = 'none';
  document.getElementById('addTeamSection').style.display = 'block';
  document.getElementById('searchBox').value = '';
  renderSearchResults();
});

document.getElementById('closeAddModal').addEventListener('click', () => {
  document.getElementById('myTeamsSection').style.display = 'block';
  document.getElementById('addTeamSection').style.display = 'none';
});

document.getElementById('searchBox').addEventListener('input', (e) => {
  renderSearchResults(e.target.value);
});

document.getElementById('leagueTabs').addEventListener('click', (e) => {
  if (e.target.classList.contains('league-tab')) {
    document.querySelectorAll('.league-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentLeague = e.target.dataset.league;
    renderSearchResults(document.getElementById('searchBox').value);
  }
});

// Initialize
loadTeams();
