/**
 * SportSync v3.1 - ESPN Professional + Bleacher Report Energy
 */

(function () {
  "use strict";

  // ESPN Logo CDN URLs
  const ESPN_LOGOS = {
    // NBA
    "nba-det": "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    "nba-bos": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
    "nba-ny": "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
    "nba-cle": "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
    "nba-atl": "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
    "nba-mia": "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
    "nba-mil": "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
    "nba-orl": "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
    "nba-phi": "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
    "nba-chi": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
    "nba-bkn": "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
    "nba-tor": "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
    "nba-ind": "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
    "nba-cha": "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
    "nba-wsh": "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
    "nba-den": "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
    "nba-min": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
    "nba-okc": "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
    "nba-por": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
    "nba-utah": "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
    "nba-gs": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
    "nba-lac": "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
    "nba-lal": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    "nba-phx": "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
    "nba-sac": "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
    "nba-dal": "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
    "nba-hou": "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
    "nba-mem": "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
    "nba-no": "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
    "nba-sa": "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
    // NFL
    "nfl-den": "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
    "nfl-ne": "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
    "nfl-jax": "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
    "nfl-sea": "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
    "nfl-buf": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
    "nfl-kc": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
    "nfl-phi": "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
    "nfl-dal": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
    "nfl-sf": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
    "nfl-mia": "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
    "nfl-rav": "https://a.espncdn.com/i/teamlogos/nfl/500/rav.png",
    "nfl-cle": "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
    "nfl-cin": "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
    "nfl-pit": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
    "nfl-ten": "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
    "nfl-ind": "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
    "nfl-jac": "https://a.espncdn.com/i/teamlogos/nfl/500/jac.png",
    "nfl-hou": "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
    "nfl-ari": "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
    "nfl-lar": "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
    "nfl-gb": "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
    "nfl-min": "https://a.espncdn.com/i/teamlogos/nfl/500/min.png",
    "nfl-chi": "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
    "nfl-det": "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
    "nfl-tb": "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
    "nfl-car": "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
    "nfl-atl": "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
    "nfl-no": "https://a.espncdn.com/i/teamlogos/nfl/500/no.png",
    "nfl-lac": "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
    "nfl-lv": "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
    "nfl-nyj": "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
    "nfl-wsh": "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",
    "nfl-bal": "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
    // MLB
    "mlb-lad": "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png",
    "mlb-nyy": "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
    "mlb-sea": "https://a.espncdn.com/i/teamlogos/mlb/500/sea.png",
    "mlb-det": "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
    "mlb-tor": "https://a.espncdn.com/i/teamlogos/mlb/500/tor.png",
    "mlb-nym": "https://a.espncdn.com/i/teamlogos/mlb/500/nym.png",
    "mlb-bos": "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png",
    "mlb-phi": "https://a.espncdn.com/i/teamlogos/mlb/500/phi.png",
    "mlb-atl": "https://a.espncdn.com/i/teamlogos/mlb/500/atl.png",
    "mlb-chc": "https://a.espncdn.com/i/teamlogos/mlb/500/chc.png",
    "mlb-mil": "https://a.espncdn.com/i/teamlogos/mlb/500/mil.png",
    "mlb-stl": "https://a.espncdn.com/i/teamlogos/mlb/500/stl.png",
    "mlb-cin": "https://a.espncdn.com/i/teamlogos/mlb/500/cin.png",
    "mlb-pit": "https://a.espncdn.com/i/teamlogos/mlb/500/pit.png",
    "mlb-hou": "https://a.espncdn.com/i/teamlogos/mlb/500/hou.png",
    "mlb-oak": "https://a.espncdn.com/i/teamlogos/mlb/500/oak.png",
    "mlb-tex": "https://a.espncdn.com/i/teamlogos/mlb/500/tex.png",
    "mlb-laa": "https://a.espncdn.com/i/teamlogos/mlb/500/laa.png",
    "mlb-sd": "https://a.espncdn.com/i/teamlogos/mlb/500/sd.png",
    "mlb-sf": "https://a.espncdn.com/i/teamlogos/mlb/500/sf.png",
    "mlb-col": "https://a.espncdn.com/i/teamlogos/mlb/500/col.png",
    "mlb-ari": "https://a.espncdn.com/i/teamlogos/mlb/500/ari.png",
    "mlb-mia": "https://a.espncdn.com/i/teamlogos/mlb/500/mia.png",
    "mlb-wsh": "https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png",
    "mlb-bal": "https://a.espncdn.com/i/teamlogos/mlb/500/bal.png",
    "mlb-cle": "https://a.espncdn.com/i/teamlogos/mlb/500/cle.png",
    "mlb-kc": "https://a.espncdn.com/i/teamlogos/mlb/500/kc.png",
    "mlb-min": "https://a.espncdn.com/i/teamlogos/mlb/500/min.png",
    "mlb-cws": "https://a.espncdn.com/i/teamlogos/mlb/500/cws.png",
    // NHL
    "nhl-buf": "https://a.espncdn.com/i/teamlogos/nhl/500/buf.png",
    "nhl-tb": "https://a.espncdn.com/i/teamlogos/nhl/500/tb.png",
    "nhl-car": "https://a.espncdn.com/i/teamlogos/nhl/500/car.png",
    "nhl-mtl": "https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png",
    "nhl-fla": "https://a.espncdn.com/i/teamlogos/nhl/500/fla.png",
    "nhl-tor": "https://a.espncdn.com/i/teamlogos/nhl/500/tor.png",
    "nhl-bos": "https://a.espncdn.com/i/teamlogos/nhl/500/bos.png",
    "nhl-ott": "https://a.espncdn.com/i/teamlogos/nhl/500/ott.png",
    "nhl-nyj": "https://a.espncdn.com/i/teamlogos/nhl/500/nyj.png",
    "nhl-nyi": "https://a.espncdn.com/i/teamlogos/nhl/500/nyi.png",
    "nhl-nyr": "https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png",
    "nhl-nj": "https://a.espncdn.com/i/teamlogos/nhl/500/nj.png",
    "nhl-pit": "https://a.espncdn.com/i/teamlogos/nhl/500/pit.png",
    "nhl-was": "https://a.espncdn.com/i/teamlogos/nhl/500/was.png",
    "nhl-cls": "https://a.espncdn.com/i/teamlogos/nhl/500/cls.png",
    "nhl-cbj": "https://a.espncdn.com/i/teamlogos/nhl/500/cbj.png",
    "nhl-det": "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
    "nhl-chi": "https://a.espncdn.com/i/teamlogos/nhl/500/chi.png",
    "nhl-nsh": "https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png",
    "nhl-stl": "https://a.espncdn.com/i/teamlogos/nhl/500/stl.png",
    "nhl-dal": "https://a.espncdn.com/i/teamlogos/nhl/500/dal.png",
    "nhl-col": "https://a.espncdn.com/i/teamlogos/nhl/500/col.png",
    "nhl-wpg": "https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png",
    "nhl-min": "https://a.espncdn.com/i/teamlogos/nhl/500/min.png",
    "nhl-ana": "https://a.espncdn.com/i/teamlogos/nhl/500/ana.png",
    "nhl-la": "https://a.espncdn.com/i/teamlogos/nhl/500/la.png",
    "nhl-sj": "https://a.espncdn.com/i/teamlogos/nhl/500/sj.png",
    "nhl-vgk": "https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png",
    "nhl-cgy": "https://a.espncdn.com/i/teamlogos/nhl/500/cgy.png",
    "nhl-edm": "https://a.espncdn.com/i/teamlogos/nhl/500/edm.png",
    "nhl-phx": "https://a.espncdn.com/i/teamlogos/nhl/500/phx.png",
    // WNBA
    "wnba-atl": "https://a.espncdn.com/i/teamlogos/wnba/500/atl.png",
    "wnba-ny": "https://a.espncdn.com/i/teamlogos/wnba/500/ny.png",
    "wnba-lv": "https://a.espncdn.com/i/teamlogos/wnba/500/lv.png",
    "wnba-min": "https://a.espncdn.com/i/teamlogos/wnba/500/min.png",
    "wnba-ind": "https://a.espncdn.com/i/teamlogos/wnba/500/ind.png",
    "wnba-con": "https://a.espncdn.com/i/teamlogos/wnba/500/con.png",
    "wnba-dal": "https://a.espncdn.com/i/teamlogos/wnba/500/dal.png",
    "wnba-chi": "https://a.espncdn.com/i/teamlogos/wnba/500/chi.png",
    "wnba-phx": "https://a.espncdn.com/i/teamlogos/wnba/500/phx.png",
    "wnba-la": "https://a.espncdn.com/i/teamlogos/wnba/500/la.png",
    "wnba-gs": "https://a.espncdn.com/i/teamlogos/wnba/500/gs.png",
    "wnba-sea": "https://a.espncdn.com/i/teamlogos/wnba/500/sea.png",
    "wnba-por": "https://a.espncdn.com/i/teamlogos/wnba/500/por.png",
    "wnba-tor": "https://a.espncdn.com/i/teamlogos/wnba/500/tor.png",
    "wnba-wsh": "https://a.espncdn.com/i/teamlogos/wnba/500/wsh.png",
    // NCAA
    "ncaa-duke": "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png",
    "ncaa-stjn": "https://a.espncdn.com/i/teamlogos/ncaa/500/267.png",
    "ncaa-uconn": "https://a.espncdn.com/i/teamlogos/ncaa/500/48.png",
    "ncaa-mich": "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png",
    "ncaa-msu": "https://a.espncdn.com/i/teamlogos/ncaa/500/127.png",
    "ncaa-isu": "https://a.espncdn.com/i/teamlogos/ncaa/500/66.png",
    "ncaa-tenn": "https://a.espncdn.com/i/teamlogos/ncaa/500/158.png",
    "ncaa-ala": "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png",
    "ncaa-ariz": "https://a.espncdn.com/i/teamlogos/ncaa/500/12.png",
    "ncaa-ark": "https://a.espncdn.com/i/teamlogos/ncaa/500/8.png",
    "ncaa-hou": "https://a.espncdn.com/i/teamlogos/ncaa/500/248.png",
    "ncaa-tex": "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png",
    "ncaa-pur": "https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png",
    "ncaa-ill": "https://a.espncdn.com/i/teamlogos/ncaa/500/356.png",
    "ncaa-fla": "https://a.espncdn.com/i/teamlogos/ncaa/500/57.png",
    "ncaa-aub": "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png",
    "ncaa-gonz": "https://a.espncdn.com/i/teamlogos/ncaa/500/225.png",
    "ncaa-iowa": "https://a.espncdn.com/i/teamlogos/ncaa/500/229.png",
    "ncaa-neb": "https://a.espncdn.com/i/teamlogos/ncaa/500/158.png",
    "ncaa-crei": "https://a.espncdn.com/i/teamlogos/ncaa/500/156.png",
    "ncaa-stmary": "https://a.espncdn.com/i/teamlogos/ncaa/500/2768.png",
    "ncaa-memph": "https://a.espncdn.com/i/teamlogos/ncaa/500/235.png",
    "ncaa-baylor": "https://a.espncdn.com/i/teamlogos/ncaa/500/239.png",
    "ncaa-uk": "https://a.espncdn.com/i/teamlogos/ncaa/500/96.png",
    "ncaa-unc": "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png",
    "ncaa-zaga": "https://a.espncdn.com/i/teamlogos/ncaa/500/158.png",
  };

  function getLogo(league, abbr) {
    const key =
      league.toLowerCase() + "-" + abbr.toLowerCase().replace(/\./g, "");
    return ESPN_LOGOS[key] || null;
  }

  function createLogoImg(league, abbr, extraClass = "") {
    const url = getLogo(league, abbr);
    if (url) {
      return `<img src="${url}" alt="${abbr}" class="team-logo-img ${extraClass}" loading="lazy" onerror="this.style.display='none'">`;
    }
    return `<span class="team-logo ${extraClass}">${abbr}</span>`;
  }

  // ═══ Team Management ═══
  const TEAMS_DATABASE = {
    nba: [
      {
        name: "Atlanta Hawks",
        abbr: "ATL",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
      },
      {
        name: "Boston Celtics",
        abbr: "BOS",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
      },
      {
        name: "Brooklyn Nets",
        abbr: "BKN",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
      },
      {
        name: "Charlotte Hornets",
        abbr: "CHA",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
      },
      {
        name: "Chicago Bulls",
        abbr: "CHI",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
      },
      {
        name: "Cleveland Cavaliers",
        abbr: "CLE",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
      },
      {
        name: "Dallas Mavericks",
        abbr: "DAL",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
      },
      {
        name: "Denver Nuggets",
        abbr: "DEN",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
      },
      {
        name: "Detroit Pistons",
        abbr: "DET",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
      },
      {
        name: "Golden State Warriors",
        abbr: "GS",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
      },
      {
        name: "Houston Rockets",
        abbr: "HOU",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
      },
      {
        name: "Indiana Pacers",
        abbr: "IND",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
      },
      {
        name: "LA Clippers",
        abbr: "LAC",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
      },
      {
        name: "Los Angeles Lakers",
        abbr: "LAL",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
      },
      {
        name: "Memphis Grizzlies",
        abbr: "MEM",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
      },
      {
        name: "Miami Heat",
        abbr: "MIA",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
      },
      {
        name: "Milwaukee Bucks",
        abbr: "MIL",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
      },
      {
        name: "Minnesota Timberwolves",
        abbr: "MIN",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
      },
      {
        name: "New Orleans Pelicans",
        abbr: "NO",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
      },
      {
        name: "New York Knicks",
        abbr: "NY",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
      },
      {
        name: "Oklahoma City Thunder",
        abbr: "OKC",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
      },
      {
        name: "Orlando Magic",
        abbr: "ORL",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
      },
      {
        name: "Philadelphia 76ers",
        abbr: "PHI",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
      },
      {
        name: "Phoenix Suns",
        abbr: "PHX",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
      },
      {
        name: "Portland Trail Blazers",
        abbr: "POR",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
      },
      {
        name: "Sacramento Kings",
        abbr: "SAC",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
      },
      {
        name: "San Antonio Spurs",
        abbr: "SA",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
      },
      {
        name: "Toronto Raptors",
        abbr: "TOR",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
      },
      {
        name: "Utah Jazz",
        abbr: "UTAH",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
      },
      {
        name: "Washington Wizards",
        abbr: "WSH",
        logo: "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
      },
    ],
    nfl: [
      {
        name: "Arizona Cardinals",
        abbr: "ARI",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
      },
      {
        name: "Atlanta Falcons",
        abbr: "ATL",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
      },
      {
        name: "Baltimore Ravens",
        abbr: "BAL",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
      },
      {
        name: "Buffalo Bills",
        abbr: "BUF",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
      },
      {
        name: "Carolina Panthers",
        abbr: "CAR",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
      },
      {
        name: "Chicago Bears",
        abbr: "CHI",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
      },
      {
        name: "Cincinnati Bengals",
        abbr: "CIN",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
      },
      {
        name: "Cleveland Browns",
        abbr: "CLE",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
      },
      {
        name: "Dallas Cowboys",
        abbr: "DAL",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
      },
      {
        name: "Denver Broncos",
        abbr: "DEN",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
      },
      {
        name: "Detroit Lions",
        abbr: "DET",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
      },
      {
        name: "Green Bay Packers",
        abbr: "GB",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
      },
      {
        name: "Houston Texans",
        abbr: "HOU",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
      },
      {
        name: "Indianapolis Colts",
        abbr: "IND",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
      },
      {
        name: "Jacksonville Jaguars",
        abbr: "JAX",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
      },
      {
        name: "Kansas City Chiefs",
        abbr: "KC",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
      },
      {
        name: "Las Vegas Raiders",
        abbr: "LV",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
      },
      {
        name: "Los Angeles Chargers",
        abbr: "LAC",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
      },
      {
        name: "Los Angeles Rams",
        abbr: "LAR",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
      },
      {
        name: "Miami Dolphins",
        abbr: "MIA",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
      },
      {
        name: "Minnesota Vikings",
        abbr: "MIN",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png",
      },
      {
        name: "New England Patriots",
        abbr: "NE",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
      },
      {
        name: "New Orleans Saints",
        abbr: "NO",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png",
      },
      {
        name: "New York Giants",
        abbr: "NYG",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
      },
      {
        name: "New York Jets",
        abbr: "NYJ",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
      },
      {
        name: "Philadelphia Eagles",
        abbr: "PHI",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
      },
      {
        name: "Pittsburgh Steelers",
        abbr: "PIT",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
      },
      {
        name: "San Francisco 49ers",
        abbr: "SF",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
      },
      {
        name: "Seattle Seahawks",
        abbr: "SEA",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
      },
      {
        name: "Tampa Bay Buccaneers",
        abbr: "TB",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
      },
      {
        name: "Tennessee Titans",
        abbr: "TEN",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
      },
      {
        name: "Washington Commanders",
        abbr: "WSH",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",
      },
    ],
    mlb: [
      {
        name: "Arizona Diamondbacks",
        abbr: "ARI",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/ari.png",
      },
      {
        name: "Atlanta Braves",
        abbr: "ATL",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/atl.png",
      },
      {
        name: "Baltimore Orioles",
        abbr: "BAL",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bal.png",
      },
      {
        name: "Boston Red Sox",
        abbr: "BOS",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png",
      },
      {
        name: "Chicago Cubs",
        abbr: "CHC",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/chc.png",
      },
      {
        name: "Chicago White Sox",
        abbr: "CWS",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cws.png",
      },
      {
        name: "Cincinnati Reds",
        abbr: "CIN",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cin.png",
      },
      {
        name: "Cleveland Guardians",
        abbr: "CLE",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cle.png",
      },
      {
        name: "Colorado Rockies",
        abbr: "COL",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/col.png",
      },
      {
        name: "Detroit Tigers",
        abbr: "DET",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png",
      },
      {
        name: "Houston Astros",
        abbr: "HOU",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/hou.png",
      },
      {
        name: "Kansas City Royals",
        abbr: "KC",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/kc.png",
      },
      {
        name: "Los Angeles Angels",
        abbr: "LAA",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/laa.png",
      },
      {
        name: "Los Angeles Dodgers",
        abbr: "LAD",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png",
      },
      {
        name: "Miami Marlins",
        abbr: "MIA",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/mia.png",
      },
      {
        name: "Milwaukee Brewers",
        abbr: "MIL",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/mil.png",
      },
      {
        name: "Minnesota Twins",
        abbr: "MIN",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/min.png",
      },
      {
        name: "New York Mets",
        abbr: "NYM",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nym.png",
      },
      {
        name: "New York Yankees",
        abbr: "NYY",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
      },
      {
        name: "Oakland Athletics",
        abbr: "OAK",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/oak.png",
      },
      {
        name: "Philadelphia Phillies",
        abbr: "PHI",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/phi.png",
      },
      {
        name: "Pittsburgh Pirates",
        abbr: "PIT",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/pit.png",
      },
      {
        name: "San Diego Padres",
        abbr: "SD",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sd.png",
      },
      {
        name: "San Francisco Giants",
        abbr: "SF",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sf.png",
      },
      {
        name: "Seattle Mariners",
        abbr: "SEA",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sea.png",
      },
      {
        name: "St. Louis Cardinals",
        abbr: "STL",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/stl.png",
      },
      {
        name: "Tampa Bay Rays",
        abbr: "TB",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tb.png",
      },
      {
        name: "Texas Rangers",
        abbr: "TEX",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tex.png",
      },
      {
        name: "Toronto Blue Jays",
        abbr: "TOR",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tor.png",
      },
      {
        name: "Washington Nationals",
        abbr: "WSH",
        logo: "https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png",
      },
    ],
    nhl: [
      {
        name: "Anaheim Ducks",
        abbr: "ANA",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/ana.png",
      },
      {
        name: "Boston Bruins",
        abbr: "BOS",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/bos.png",
      },
      {
        name: "Buffalo Sabres",
        abbr: "BUF",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/buf.png",
      },
      {
        name: "Calgary Flames",
        abbr: "CGY",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/cgy.png",
      },
      {
        name: "Carolina Hurricanes",
        abbr: "CAR",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/car.png",
      },
      {
        name: "Chicago Blackhawks",
        abbr: "CHI",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/chi.png",
      },
      {
        name: "Colorado Avalanche",
        abbr: "COL",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/col.png",
      },
      {
        name: "Columbus Blue Jackets",
        abbr: "CBJ",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/cbj.png",
      },
      {
        name: "Dallas Stars",
        abbr: "DAL",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/dal.png",
      },
      {
        name: "Detroit Red Wings",
        abbr: "DET",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
      },
      {
        name: "Edmonton Oilers",
        abbr: "EDM",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/edm.png",
      },
      {
        name: "Florida Panthers",
        abbr: "FLA",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/fla.png",
      },
      {
        name: "Los Angeles Kings",
        abbr: "LA",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/la.png",
      },
      {
        name: "Minnesota Wild",
        abbr: "MIN",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/min.png",
      },
      {
        name: "Montreal Canadiens",
        abbr: "MTL",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png",
      },
      {
        name: "Nashville Predators",
        abbr: "NSH",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png",
      },
      {
        name: "New Jersey Devils",
        abbr: "NJ",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nj.png",
      },
      {
        name: "New York Islanders",
        abbr: "NYI",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nyi.png",
      },
      {
        name: "New York Rangers",
        abbr: "NYR",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png",
      },
      {
        name: "Ottawa Senators",
        abbr: "OTT",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/ott.png",
      },
      {
        name: "Philadelphia Flyers",
        abbr: "PHI",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/phi.png",
      },
      {
        name: "Pittsburgh Penguins",
        abbr: "PIT",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/pit.png",
      },
      {
        name: "San Jose Sharks",
        abbr: "SJ",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/sj.png",
      },
      {
        name: "Seattle Kraken",
        abbr: "SEA",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/sea.png",
      },
      {
        name: "St. Louis Blues",
        abbr: "STL",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/stl.png",
      },
      {
        name: "Tampa Bay Lightning",
        abbr: "TB",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/tb.png",
      },
      {
        name: "Toronto Maple Leafs",
        abbr: "TOR",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/tor.png",
      },
      {
        name: "Vegas Golden Knights",
        abbr: "VGK",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png",
      },
      {
        name: "Washington Capitals",
        abbr: "WSH",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png",
      },
      {
        name: "Winnipeg Jets",
        abbr: "WPG",
        logo: "https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png",
      },
    ],
    wnba: [
      {
        name: "Atlanta Dream",
        abbr: "ATL",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/atl.png",
      },
      {
        name: "Chicago Sky",
        abbr: "CHI",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/chi.png",
      },
      {
        name: "Connecticut Sun",
        abbr: "CON",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/con.png",
      },
      {
        name: "Dallas Wings",
        abbr: "DAL",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/dal.png",
      },
      {
        name: "Golden State Valkyries",
        abbr: "GS",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/gs.png",
      },
      {
        name: "Indiana Fever",
        abbr: "IND",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/ind.png",
      },
      {
        name: "Las Vegas Aces",
        abbr: "LV",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/lv.png",
      },
      {
        name: "Los Angeles Sparks",
        abbr: "LA",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/la.png",
      },
      {
        name: "Minnesota Lynx",
        abbr: "MIN",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/min.png",
      },
      {
        name: "New York Liberty",
        abbr: "NY",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/ny.png",
      },
      {
        name: "Phoenix Mercury",
        abbr: "PHX",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/phx.png",
      },
      {
        name: "Portland Firebirds",
        abbr: "POR",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/por.png",
      },
      {
        name: "Seattle Storm",
        abbr: "SEA",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/sea.png",
      },
      {
        name: "Toronto Tempo",
        abbr: "TOR",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/tor.png",
      },
      {
        name: "Washington Mystics",
        abbr: "WSH",
        logo: "https://a.espncdn.com/i/teamlogos/wnba/500/wsh.png",
      },
    ],
    ncaa: [
      {
        name: "Duke Blue Devils",
        abbr: "DUKE",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png",
      },
      {
        name: "St. John's Red Storm",
        abbr: "STJN",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/267.png",
      },
      {
        name: "UConn Huskies",
        abbr: "UCON",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/48.png",
      },
      {
        name: "Michigan Wolverines",
        abbr: "MICH",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png",
      },
      {
        name: "Michigan State Spartans",
        abbr: "MSU",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/127.png",
      },
      {
        name: "Iowa State Cyclones",
        abbr: "ISU",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/66.png",
      },
      {
        name: "Tennessee Volunteers",
        abbr: "TENN",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/158.png",
      },
      {
        name: "Alabama Crimson Tide",
        abbr: "ALA",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png",
      },
      {
        name: "Arizona Wildcats",
        abbr: "ARIZ",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/12.png",
      },
      {
        name: "Arkansas Razorbacks",
        abbr: "ARK",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/8.png",
      },
      {
        name: "Houston Cougars",
        abbr: "HOU",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/248.png",
      },
      {
        name: "Florida Gators",
        abbr: "FLA",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/57.png",
      },
      {
        name: "Gonzaga Bulldogs",
        abbr: "GONZ",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/225.png",
      },
      {
        name: "Kentucky Wildcats",
        abbr: "UK",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/96.png",
      },
      {
        name: "North Carolina Tar Heels",
        abbr: "UNC",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png",
      },
      {
        name: "Kansas Jayhawks",
        abbr: "KAN",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/85.png",
      },
      {
        name: "Auburn Tigers",
        abbr: "AUB",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png",
      },
      {
        name: "Purdue Boilermakers",
        abbr: "PUR",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png",
      },
      {
        name: "Villanova Wildcats",
        abbr: "VILL",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/222.png",
      },
      {
        name: "Creighton Bluejays",
        abbr: "CREI",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/156.png",
      },
      {
        name: "Texas Longhorns",
        abbr: "TEX",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png",
      },
      {
        name: "Baylor Bears",
        abbr: "BAY",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/239.png",
      },
      {
        name: "Illinois Fighting Illini",
        abbr: "ILL",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/356.png",
      },
      {
        name: "Iowa Hawkeyes",
        abbr: "IOWA",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/229.png",
      },
      {
        name: "Wisconsin Badgers",
        abbr: "WIS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/275.png",
      },
      {
        name: "Ohio State Buckeyes",
        abbr: "OSU",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/194.png",
      },
      {
        name: "Indiana Hoosiers",
        abbr: "IND",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/84.png",
      },
      {
        name: "Nebraska Cornhuskers",
        abbr: "NEB",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/155.png",
      },
      {
        name: "Marquette Golden Eagles",
        abbr: "MARQ",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/269.png",
      },
      {
        name: "Saint Mary's Gaels",
        abbr: "STMY",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2768.png",
      },
      {
        name: "Texas A&M Aggies",
        abbr: "TA&M",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/245.png",
      },
      {
        name: "Florida State Seminoles",
        abbr: "FSU",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/52.png",
      },
      {
        name: "Miami Hurricanes",
        abbr: "MIA",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/239.png",
      },
      {
        name: "Colorado Buffaloes",
        abbr: "COL",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/45.png",
      },
      {
        name: "UCLA Bruins",
        abbr: "UCLA",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/26.png",
      },
      {
        name: "Southern California Trojans",
        abbr: "USC",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/30.png",
      },
      {
        name: "Oregon Ducks",
        abbr: "ORE",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png",
      },
      {
        name: "Arizona State Sun Devils",
        abbr: "ASU",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/9.png",
      },
      {
        name: "Washington Huskies",
        abbr: "WASH",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/264.png",
      },
    ],
  };

  const DEFAULT_MY_TEAMS = [
    {
      name: "Duke Blue Devils",
      abbr: "DUKE",
      logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png",
      league: "ncaa",
    },
    {
      name: "New York Knicks",
      abbr: "NY",
      logo: "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
      league: "nba",
    },
    {
      name: "New York Yankees",
      abbr: "NYY",
      logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
      league: "mlb",
    },
    {
      name: "New York Giants",
      abbr: "NYG",
      logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
      league: "nfl",
    },
  ];

  let myTeams = [];
  let selectedLeague = "nba";

  function loadMyTeams() {
    const saved = localStorage.getItem("myTeams");
    if (saved) {
      try {
        myTeams = JSON.parse(saved);
      } catch (e) {
        myTeams = [...DEFAULT_MY_TEAMS];
      }
    } else {
      myTeams = [...DEFAULT_MY_TEAMS];
    }
    saveMyTeams();
    renderMyTeams();
  }

  function saveMyTeams() {
    localStorage.setItem("myTeams", JSON.stringify(myTeams));
  }

  function renderMyTeams() {
    const container = document.getElementById("teamList");
    if (!container) return;

    if (myTeams.length === 0) {
      container.innerHTML =
        '<div class="team-empty">No teams added. Click + to add!</div>';
      return;
    }

    container.innerHTML = myTeams
      .map(
        (team, index) => `
      <a href="#${team.abbr.toLowerCase()}" class="team-item" data-index="${index}">
        <img src="${team.logo}" alt="${team.name}" class="team-logo" onerror="this.style.display='none'">
        <span class="team-name">${team.name}</span>
      </a>
    `,
      )
      .join("");
  }

  function initTeamModal() {
    const modal = document.getElementById("teamModal");
    const openBtn = document.getElementById("openTeamModal");
    const closeBtn = document.getElementById("closeTeamModal");
    const searchInput = document.getElementById("teamSearchInput");
    const resultsList = document.getElementById("teamResultsList");
    const filterTabs = document.querySelectorAll(".filter-tab");

    if (!modal) return;

    openBtn?.addEventListener("click", () => {
      modal.classList.add("show");
      searchInput.value = "";
      renderTeamResults();
    });

    closeBtn?.addEventListener("click", () => {
      modal.classList.remove("show");
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });

    searchInput?.addEventListener("input", () => {
      renderTeamResults(searchInput.value);
    });

    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        filterTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        selectedLeague = tab.dataset.league;
        renderTeamResults(searchInput.value);
      });
    });
  }

  function renderTeamResults(query = "") {
    const resultsList = document.getElementById("teamResultsList");
    if (!resultsList) return;

    let teams = TEAMS_DATABASE[selectedLeague] || [];

    if (query) {
      const q = query.toLowerCase();
      teams = teams.filter((t) => t.name.toLowerCase().includes(q));
    }

    resultsList.innerHTML = teams
      .map(
        (team) => `
      <div class="team-result-item" data-name="${team.name}" data-abbr="${team.abbr}" data-logo="${team.logo}" data-league="${selectedLeague}">
        <img src="${team.logo}" alt="${team.name}">
        <span>${team.name}</span>
        <span class="add-icon"><i class="fa-solid fa-plus"></i></span>
      </div>
    `,
      )
      .join("");

    resultsList.querySelectorAll(".team-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const team = {
          name: item.dataset.name,
          abbr: item.dataset.abbr,
          logo: item.dataset.logo,
          league: item.dataset.league,
        };

        if (
          !myTeams.find((t) => t.abbr === team.abbr && t.league === team.league)
        ) {
          myTeams.push(team);
          saveMyTeams();
          renderMyTeams();
        }
      });
    });
  }

  // Hub data objects (used by external data integration and hero rendering)
  const NFL_HUB = { liveScores: [] };
  const MLB_HUB = { liveScores: [] };
  const WNBA_HUB = { liveScores: [] };
  const NHL_HUB = { liveScores: [] };

  document.addEventListener("DOMContentLoaded", init);

  // ═══ Onboarding ═══
  let onboardingSelectedTeams = [];

  function initOnboarding() {
    const overlay = document.getElementById("onboardingOverlay");
    const grid = document.getElementById("onboardingTeamsGrid");
    const searchInput = document.getElementById("onboardingSearch");
    const continueBtn = document.getElementById("continueBtn");
    const selectedCount = document.getElementById("selectedCount");
    const tabs = document.querySelectorAll(".onboarding-tab");

    if (!overlay) return;

    // Check if user has already set up teams
    const hasCompletedSetup = localStorage.getItem("onboardingComplete");
    const savedTeams = localStorage.getItem("myTeams");

    if (hasCompletedSetup && savedTeams) {
      overlay.classList.add("hidden");
      return;
    }

    overlay.classList.remove("hidden");
    let currentLeague = "all";

    function renderTeams(query = "") {
      let teams = [];

      if (currentLeague === "all") {
        Object.keys(TEAMS_DATABASE).forEach((league) => {
          teams = teams.concat(
            TEAMS_DATABASE[league].map((t) => ({ ...t, league })),
          );
        });
      } else {
        teams = (TEAMS_DATABASE[currentLeague] || []).map((t) => ({
          ...t,
          league: currentLeague,
        }));
      }

      if (query) {
        const q = query.toLowerCase();
        teams = teams.filter((t) => t.name.toLowerCase().includes(q));
      }

      grid.innerHTML = teams
        .map(
          (team) => `
        <div class="onboarding-team-card${onboardingSelectedTeams.find((t) => t.abbr === team.abbr && t.league === team.league) ? " selected" : ""}"
             data-name="${team.name}"
             data-abbr="${team.abbr}"
             data-logo="${team.logo}"
             data-league="${team.league}">
          <img src="${team.logo}" alt="${team.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23222%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2230%22>${team.abbr}</text></svg>'">
          <div class="team-name">${team.name}</div>
          <div class="team-league">${team.league.toUpperCase()}</div>
        </div>
      `,
        )
        .join("");

      grid.querySelectorAll(".onboarding-team-card").forEach((card) => {
        card.addEventListener("click", () => {
          const team = {
            name: card.dataset.name,
            abbr: card.dataset.abbr,
            logo: card.dataset.logo,
            league: card.dataset.league,
          };

          const existingIndex = onboardingSelectedTeams.findIndex(
            (t) => t.abbr === team.abbr && t.league === team.league,
          );

          if (existingIndex > -1) {
            onboardingSelectedTeams.splice(existingIndex, 1);
            card.classList.remove("selected");
          } else {
            onboardingSelectedTeams.push(team);
            card.classList.add("selected");
          }

          selectedCount.textContent = onboardingSelectedTeams.length;
          continueBtn.disabled = onboardingSelectedTeams.length === 0;
        });
      });
    }

    // Search
    searchInput?.addEventListener("input", (e) => {
      renderTeams(e.target.value);
    });

    // League tabs
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentLeague = tab.dataset.league;
        renderTeams(searchInput.value);
      });
    });

    // Continue button
    continueBtn?.addEventListener("click", () => {
      if (onboardingSelectedTeams.length > 0) {
        myTeams = [...onboardingSelectedTeams];
        saveMyTeams();
        renderMyTeams();
        localStorage.setItem("onboardingComplete", "true");
        overlay.classList.add("hidden");
      }
    });

    // Initial render
    renderTeams();
  }

  function init() {
    initOnboarding();
    initTheme();
    initMobileNav();
    initTicker(); // async but fire-and-forget (ticker shows loading then updates)
    initScores(); // async - shows loading then updates
    initTeams();
    initNews(); // async - shows loading then updates
    initSchedule(); // async - shows loading then updates
    initStandings(); // async - tries live first
    initTrending(); // async - fetches ESPN headlines
    updateHeroSection(); // async - updates hero with real today's top game
    initPoll();
    loadMyTeams();
    initTeamModal();
    initRepick();
    // Render hub heroes (safe in init() since DOM is ready)
    renderHubHero("nfl");
    renderHubHero("mlb");
    renderHubHero("wnba");
    renderHubHero("nhl");
    console.log("⚡ SportSync v3.1 initialized");
    // Logo mode switcher
    const logoSel = document.getElementById("logoMode");
    const brandLogo = document.getElementById("brandLogo");
    if (logoSel && brandLogo) {
      const saved = localStorage.getItem("logoMode") || "espn";
      setLogoMode(saved);
      logoSel.value = saved;
      logoSel.addEventListener("change", (e) => {
        const mode = e.target.value;
        setLogoMode(mode);
        localStorage.setItem("logoMode", mode);
      });
    }
    function setLogoMode(mode) {
      switch (mode) {
        case "espn":
          brandLogo.src = "assets/logo_espn.svg";
          brandLogo.style.height = "36px";
          break;
        case "angle_speed":
          brandLogo.src = "assets/logo_angle_speed.svg";
          brandLogo.style.height = "28px";
          break;
        case "badge":
          brandLogo.src = "assets/logo_badge.svg";
          brandLogo.style.height = "28px";
          break;
        case "minimal":
          brandLogo.src = "assets/logo_minimal.svg";
          brandLogo.style.height = "28px";
          break;
        default:
          brandLogo.src = "assets/logo_espn.svg";
          brandLogo.style.height = "36px";
      }
      // Hide the text wordmark when ESPN logo is active (wordmark is embedded in the SVG)
      const brandText = document.getElementById("brandText");
      if (brandText) brandText.style.display = mode === "espn" ? "none" : "";
    }

    // Hub hero theme toggle
    const heroToggle = document.getElementById("heroThemeToggle");
    if (heroToggle) {
      const savedHubTheme = localStorage.getItem("hubHeroTheme") || "default";
      applyHubHeroTheme(savedHubTheme);
      heroToggle.addEventListener("click", () => {
        const next =
          document.documentElement.getAttribute("data-theme") === "dark"
            ? "seasonal"
            : "seasonal";
        // toggle between 'seasonal' and 'default'
        const current = localStorage.getItem("hubHeroTheme") || "default";
        const nextTheme = current === "seasonal" ? "default" : "seasonal";
        localStorage.setItem("hubHeroTheme", nextTheme);
        applyHubHeroTheme(nextTheme);
      });
    }

    function applyHubHeroTheme(theme) {
      const hubs = document.querySelectorAll(".hub-hero");
      hubs.forEach((h) => {
        if (theme === "seasonal") h.classList.add("seasonal");
        else h.classList.remove("seasonal");
      });
    }

    // External data (Katana) integration (mocked/safe) - opt-in
    const extToggle = document.getElementById("externalDataToggle");
    let externalDataEnabled =
      localStorage.getItem("externalDataEnabled") === "true";
    if (extToggle) {
      extToggle.checked = externalDataEnabled;
      extToggle.addEventListener("change", (e) => {
        externalDataEnabled = e.target.checked;
        localStorage.setItem(
          "externalDataEnabled",
          String(externalDataEnabled),
        );
        if (externalDataEnabled) {
          fetchExternalHubData().then(applyExternalHubData);
        }
      });
    }

    async function fetchExternalHubData() {
      // Call a backend Katana proxy (running locally) to scrape data per league
      // This is a best-effort fetch; if the proxy is unavailable, we return null
      // Try to fetch pre-scraped data published to the repo (GitHub Pages data.json)
      const localPath = "/data/katana_output.json";
      try {
        const r = await fetch(localPath);
        if (r.ok) {
          const json = await r.json();
          return json;
        }
      } catch (e) {
        // fall back to remote Katana proxy if available
      }
      const leagues = ["nfl", "mlb", "wnba", "nhl"];
      const requests = leagues.map((l) =>
        fetch("http://localhost:8000/katana/data?league=" + l)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      );
      try {
        const results = await Promise.all(requests);
        const payload = {};
        leagues.forEach((l, idx) => {
          if (results[idx]) payload[l] = results[idx];
        });
        return payload;
      } catch {
        return null;
      }
    }

    function applyExternalHubData(data) {
      if (!data) return;
      if (data.nfl?.liveScores) NFL_HUB.liveScores = data.nfl.liveScores;
      if (data.mlb?.liveScores) MLB_HUB.liveScores = data.mlb.liveScores;
      if (data.wnba?.liveScores) WNBA_HUB.liveScores = data.wnba.liveScores;
      if (data.nhl?.liveScores) NHL_HUB.liveScores = data.nhl.liveScores;
      // Re-render affected hubs
      if (typeof renderNFLHub === "function") renderNFLHub();
      if (typeof renderMLBHub === "function") renderMLBHub();
      if (typeof renderWNBAHub === "function") renderWNBAHub();
      if (typeof renderNHLHub === "function") renderNHLHub();
    }
  }

  function initRepick() {
    const repickBtn = document.getElementById("repickTeamsBtn");
    const editBtn = document.getElementById("editTeamsBtn");
    const overlay = document.getElementById("onboardingOverlay");
    const grid = document.getElementById("onboardingTeamsGrid");
    const searchInput = document.getElementById("onboardingSearch");
    const continueBtn = document.getElementById("continueBtn");
    const selectedCount = document.getElementById("selectedCount");
    const tabs = document.querySelectorAll(".onboarding-tab");

    if (!repickBtn) return;

    let currentLeague = "all";
    onboardingSelectedTeams = [...myTeams];

    function renderTeams(query = "") {
      let teams = [];

      if (currentLeague === "all") {
        Object.keys(TEAMS_DATABASE).forEach((league) => {
          teams = teams.concat(
            TEAMS_DATABASE[league].map((t) => ({ ...t, league })),
          );
        });
      } else {
        teams = (TEAMS_DATABASE[currentLeague] || []).map((t) => ({
          ...t,
          league: currentLeague,
        }));
      }

      if (query) {
        const q = query.toLowerCase();
        teams = teams.filter((t) => t.name.toLowerCase().includes(q));
      }

      grid.innerHTML = teams
        .map(
          (team) => `
        <div class="onboarding-team-card${onboardingSelectedTeams.find((t) => t.abbr === team.abbr && t.league === team.league) ? " selected" : ""}"
             data-name="${team.name}"
             data-abbr="${team.abbr}"
             data-logo="${team.logo}"
             data-league="${team.league}">
          <img src="${team.logo}" alt="${team.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23222%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2230%22>${team.abbr}</text></svg>'">
          <div class="team-name">${team.name}</div>
          <div class="team-league">${team.league.toUpperCase()}</div>
        </div>
      `,
        )
        .join("");

      grid.querySelectorAll(".onboarding-team-card").forEach((card) => {
        card.addEventListener("click", () => {
          const team = {
            name: card.dataset.name,
            abbr: card.dataset.abbr,
            logo: card.dataset.logo,
            league: card.dataset.league,
          };

          const existingIndex = onboardingSelectedTeams.findIndex(
            (t) => t.abbr === team.abbr && t.league === team.league,
          );

          if (existingIndex > -1) {
            onboardingSelectedTeams.splice(existingIndex, 1);
            card.classList.remove("selected");
          } else {
            onboardingSelectedTeams.push(team);
            card.classList.add("selected");
          }

          selectedCount.textContent = onboardingSelectedTeams.length;
          continueBtn.disabled = onboardingSelectedTeams.length === 0;
        });
      });
    }

    function showOverlay() {
      onboardingSelectedTeams = [...myTeams];
      selectedCount.textContent = onboardingSelectedTeams.length;
      continueBtn.disabled = onboardingSelectedTeams.length === 0;
      overlay.classList.remove("hidden");
      renderTeams();
    }

    repickBtn?.addEventListener("click", showOverlay);
    editBtn?.addEventListener("click", showOverlay);

    searchInput?.addEventListener("input", (e) => {
      renderTeams(e.target.value);
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentLeague = tab.dataset.league;
        renderTeams(searchInput.value);
      });
    });

    continueBtn?.addEventListener("click", () => {
      myTeams = [...onboardingSelectedTeams];
      saveMyTeams();
      renderMyTeams();
      localStorage.setItem("onboardingComplete", "true");
      overlay.classList.add("hidden");
    });
  }

  // ═══ Theme ═══
  function initTheme() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = saved || (prefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", theme);
    toggle.innerHTML = '<i class="fa-solid fa-circle-half-stroke"></i>';

    toggle.addEventListener("click", () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // ═══ Mobile Nav ═══
  function initMobileNav() {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (!menuBtn || !sidebar) return;

    const open = () => {
      sidebar.classList.add("open");
      overlay?.classList.add("show");
    };
    const close = () => {
      sidebar.classList.remove("open");
      overlay?.classList.remove("show");
    };

    menuBtn.addEventListener("click", () =>
      sidebar.classList.contains("open") ? close() : open(),
    );
    overlay?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ═══ Score Ticker ═══
  function initTicker() {
    const track = document.getElementById("tickerTrack");
    if (!track) return;

    // Fallback scores used only while API loads
    const fallbackScores = [
      {
        league: "ncaam",
        home: "TBD",
        away: "TBD",
        h: 0,
        a: 0,
        status: "Loading...",
        live: false,
        labbr: "ncaa",
        habbr: "ncaa",
      },
    ];

    // Initial render with fallback
    renderTickerItems(fallbackScores, track);

    // Fetch live scores from ESPN
    fetchTickerScores().then((scores) => {
      if (scores.length > 0) {
        renderTickerItems(scores, track);
      }
    });
  }

  async function fetchTickerScores() {
    try {
      const sports = ["nba", "nhl", "mlb", "ncaam"];
      const allScores = [];
      for (const sport of sports) {
        try {
          const data = await SPORTSYNC_API.ESPN.getScoreboard(sport);
          if (data?.events?.length) {
            data.events.forEach((ev) => {
              const comp = ev.competitions?.[0];
              if (!comp) return;
              const home = comp.competitors?.find((c) => c.homeAway === "home");
              const away = comp.competitors?.find((c) => c.homeAway === "away");
              const status = ev.status?.type;
              const isLive = status?.state === "in";
              const detail = status?.detail || status?.shortDetail || "";

              const leagueMap = {
                nba: "nba",
                nhl: "nhl",
                mlb: "mlb",
                ncaam: "ncaam",
              };
              const league = leagueMap[sport] || sport;
              const abbrMap = {
                nba: "nba",
                nhl: "nhl",
                mlb: "mlb",
                ncaam: "ncaa",
              };

              allScores.push({
                league,
                home:
                  home?.team?.abbreviation ||
                  home?.team?.shortDisplayName ||
                  "?",
                away:
                  away?.team?.abbreviation ||
                  away?.team?.shortDisplayName ||
                  "?",
                h: home?.score ?? "-",
                a: away?.score ?? "-",
                status: isLive
                  ? detail || "LIVE"
                  : detail || ev.date?.slice(0, 10) || "",
                live: isLive,
                labbr: abbrMap[league] || sport,
                habbr: abbrMap[league] || sport,
              });
            });
          }
        } catch (e) {
          /* skip failed sport */
        }
      }
      return allScores.slice(0, 15);
    } catch {
      return [];
    }
  }

  function renderTickerItems(scores, track) {
    const html = scores
      .map(
        (s) => `
      <div class="ticker-item${s.live ? " live" : ""}">
        <div class="ticker-header">
          <span class="ticker-league ${s.league}">${s.league.toUpperCase()}</span>
          <span class="ticker-status${s.live ? " live" : ""}">${s.status}</span>
        </div>
        <div class="ticker-match">
          ${createLogoImg(s.labbr, s.away, "ticker-logo")}
          <span class="ticker-score">${s.a ?? "-"}</span>
        </div>
        <div class="ticker-match">
          ${createLogoImg(s.habbr, s.home, "ticker-logo")}
          <span class="ticker-score">${s.h ?? "-"}</span>
        </div>
      </div>
    `,
      )
      .join("");
    track.innerHTML = html + html;
  }

  // ═══ Scores Grid ═══
  async function initScores() {
    const container = document.getElementById("scoresGrid");
    if (!container) return;

    // Show loading state
    container.innerHTML =
      '<div class="scores-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading live scores...</div>';

    // Fetch from ESPN API
    const games = await fetchLiveScores();

    if (games.length === 0) {
      container.innerHTML = `
        <div class="no-games">
          <i class="fa-solid fa-calendar-day" style="font-size:48px;opacity:.3"></i>
          <p>No games today</p>
          <p class="small">Check back later for updated scores</p>
        </div>
      `;
      return;
    }

    container.innerHTML = games
      .slice(0, 8)
      .map(
        (g) => `
      <article class="score-card${g.live ? " live" : ""}">
        <div class="score-card-header">
          <div class="score-card-meta">
            ${g.seed ? `<span class="score-seed">(${g.seed.a})</span>` : ""}
            <span class="score-league ${g.league}">${g.league.toUpperCase()}</span>
          </div>
          <span class="score-time${g.live ? " live" : ""}">${g.status}</span>
        </div>
        <div class="score-card-body">
          <div class="score-team${g.awayWinner ? " winner" : ""}">
            <div class="score-team-info">
              ${createLogoImg(g.lg, g.away.a, "score-logo")}
              <span class="score-team-name">${g.away.n}</span>
            </div>
            <span class="score-value">${g.a ?? "-"}</span>
          </div>
          <div class="score-team${g.homeWinner ? " winner" : ""}">
            <div class="score-team-info">
              ${createLogoImg(g.lg, g.home.a, "score-logo")}
              <span class="score-team-name">${g.home.n}</span>
            </div>
            <span class="score-value">${g.h ?? "-"}</span>
          </div>
        </div>
        <div class="score-card-footer">
          ${g.tv ? `<span class="watch-btn">${g.tv}</span>` : ""}
          ${g.seed ? `<span class="score-seed-home">(${g.seed.h})</span>` : ""}
        </div>
      </article>
    `,
      )
      .join("");
  }

  async function fetchLiveScores() {
    try {
      const sports = [
        { id: "nba", lg: "nba", leagueName: "NBA" },
        { id: "nhl", lg: "nhl", leagueName: "NHL" },
        { id: "mlb", lg: "mlb", leagueName: "MLB" },
        { id: "ncaam", lg: "ncaa", leagueName: "NCAAM" },
        { id: "epl", lg: "ncaa", leagueName: "EPL" },
      ];
      const allGames = [];

      for (const sport of sports) {
        try {
          const data = await SPORTSYNC_API.ESPN.getScoreboard(sport.id);
          if (!data?.events?.length) continue;

          for (const ev of data.events) {
            const comp = ev.competitions?.[0];
            if (!comp) continue;
            const home = comp.competitors?.find((c) => c.homeAway === "home");
            const away = comp.competitors?.find((c) => c.homeAway === "away");
            const status = ev.status?.type;
            const isLive = status?.state === "in";

            allGames.push({
              league: sport.leagueName.toLowerCase(),
              home: {
                n:
                  home?.team?.shortDisplayName ||
                  home?.team?.displayName ||
                  "?",
                a: home?.team?.abbreviation || "?",
              },
              away: {
                n:
                  away?.team?.shortDisplayName ||
                  away?.team?.displayName ||
                  "?",
                a: away?.team?.abbreviation || "?",
              },
              h: home?.score,
              a: away?.score,
              status:
                status?.detail ||
                status?.shortDetail ||
                ev.date?.slice(11, 16) ||
                "TBD",
              live: isLive,
              tv: comp.broadcasts?.[0]?.names?.[0] || null,
              lg: sport.lg,
              homeWinner: home?.winner || false,
              awayWinner: away?.winner || false,
            });
          }
        } catch (e) {
          /* Skip failed fetch */
        }
      }

      // Sort live games first, then by time
      allGames.sort((a, b) => b.live - a.live);
      return allGames;
    } catch {
      return [];
    }
  }

  // ═══ Teams Carousel ═══
  function initTeams() {
    const container = document.getElementById("teamsCarousel");
    if (!container) return;

    // Use user's actual teams instead of hardcoded ones
    const teams = myTeams.map((t) => {
      const leagueInfo = getLeagueInfo(t.league);
      return {
        n: t.name,
        lg: t.league,
        abbr: t.abbr,
        c: leagueInfo.color,
        s: `${leagueInfo.seasonText}`,
        t: "same",
        next: "Check schedule",
        w: "",
        tv: "",
      };
    });

    if (teams.length === 0) {
      container.innerHTML =
        '<div class="no-teams"><p>No teams added. Pick your teams to see them here!</p></div>';
      return;
    }

    container.innerHTML = teams
      .map(
        (t) => `
      <article class="team-card" style="border-top: 4px solid ${t.c}">
        <div class="team-card-header">
          ${createLogoImg(t.lg, t.abbr, "team-card-logo")}
          <h3 class="team-card-name">${t.n}</h3>
          <span class="team-trend ${t.t}">${t.t === "up" ? "↑" : t.t === "down" ? "↓" : "—"}</span>
        </div>
        <p class="team-card-stat">${t.s}</p>
        <div class="team-card-next">
          Next Game
          <strong>${t.next}</strong>
          ${t.w ? `<span>${t.w} • ${t.tv}</span>` : ""}
        </div>
      </article>
    `,
      )
      .join("");
  }

  function getLeagueInfo(league) {
    const info = {
      nba: { color: "#c9082a", seasonText: "2025-26 Season", full: "NBA" },
      nfl: { color: "#013369", seasonText: "2025 Season", full: "NFL" },
      mlb: { color: "#c9082a", seasonText: "2026 Season", full: "MLB" },
      nhl: { color: "#000000", seasonText: "2025-26 Season", full: "NHL" },
      wnba: { color: "#c4082b", seasonText: "Preseason", full: "WNBA" },
      ncaa: { color: "#003da5", seasonText: "2025-26 Season", full: "NCAA" },
    };
    return (
      info[league] || {
        color: "#333",
        seasonText: "Season",
        full: league.toUpperCase(),
      }
    );
  }

  // ═══ News Grid - Fetches live ESPN news ═══
  async function initNews() {
    const container = document.getElementById("newsGrid");
    const tabs = document.getElementById("newsTabs");
    if (!container) return;

    // Fetch live news from ESPN
    let cachedNews = [];
    try {
      const [nbaNews, nflNews, mlbNews] = await Promise.allSettled([
        SPORTSYNC_API.ESPN.getNews("nba", 10),
        SPORTSYNC_API.ESPN.getNews("nfl", 10),
        SPORTSYNC_API.ESPN.getNews("mlb", 10),
      ]);

      const parseArticles = (result, tag, fire = false) => {
        if (result.status !== "fulfilled" || !result.value?.articles?.length)
          return [];
        return result.value.articles.map((a) => ({
          headline: a.headline || a.shortName || "Untitled",
          description: a.description || "",
          tag,
          link: a.links?.web?.href,
          image: a.images?.[0]?.url,
          fire,
        }));
      };

      cachedNews = [
        ...parseArticles(nbaNews, "NBA", true),
        ...parseArticles(nflNews, "NFL"),
        ...parseArticles(mlbNews, "MLB"),
      ];
    } catch (e) {
      console.warn("News fetch failed, using fallback:", e);
    }

    // Fallback if all API calls fail
    if (cachedNews.length === 0) {
      cachedNews = [
        {
          headline: "NBA Playoff Race Heats Up",
          description:
            "Multiple teams battling for seeding as season nears end.",
          tag: "NBA",
          fire: true,
          link: "https://www.espn.com/nba/",
          image: null,
        },
        {
          headline: "MLB Season Kickoff Watchlist",
          description: "Top prospects and storylines to follow in 2026.",
          tag: "MLB",
          fire: false,
          link: "https://www.espn.com/mlb/",
          image: null,
        },
        {
          headline: "NFL Draft Big Board Updated",
          description: "Scouts rank top QB prospects for 2026 draft.",
          tag: "NFL",
          fire: false,
          link: "https://www.espn.com/nfl/draft/",
          image: null,
        },
      ];
    }

    function render(filter = "all") {
      let items = cachedNews;
      if (filter !== "all")
        items = items.filter((n) => n.tag.toLowerCase() === filter);

      if (items.length === 0) {
        container.innerHTML = `<div class="no-news"><p>No ${filter} news right now</p></div>`;
        return;
      }

      container.innerHTML = items
        .slice(0, 9)
        .map(
          (n) => `
        <article class="news-card">
          <div class="news-card-img">
            ${n.fire ? '<span class="news-hot"><i class="fa-solid fa-fire"></i> HOT</span>' : ""}
            ${n.image ? `<img src="${n.image}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fa-solid fa-newspaper"></i>'}
          </div>
          <div class="news-card-body">
            <p class="news-tag">${n.tag}</p>
            <h3 class="news-title">${n.headline}</h3>
            <p class="news-excerpt">${n.description ? n.description.substring(0, 120) + "..." : ""}</p>
            ${n.link ? `<a href="${n.link}" target="_blank" class="news-read-more">Read more <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ""}
          </div>
        </article>
      `,
        )
        .join("");
    }

    render();
    tabs?.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        render(btn.dataset.tab);
      });
    });
  }

  // ═══ Schedule - Fetches real ESPN data ═══
  async function initSchedule() {
    const container = document.getElementById("scheduleList");
    const filters = document.getElementById("filterTabs");
    if (!container) return;

    // Build schedule from ESPN API
    let allScheduleItems = [];

    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const sports = [
        { id: "nba", label: "NBA" },
        { id: "nhl", label: "NHL" },
        { id: "mlb", label: "MLB" },
        { id: "ncaam", label: "NCAAM" },
        { id: "epl", label: "EPL" },
      ];

      // Fetch today's games
      for (const sport of sports) {
        try {
          const data = await SPORTSYNC_API.ESPN.getScoreboard(sport.id);
          if (data?.events?.length) {
            for (const ev of data.events) {
              const comp = ev.competitions?.[0];
              if (!comp) continue;
              const away = comp.competitors?.find((c) => c.homeAway === "away");
              const home = comp.competitors?.find((c) => c.homeAway === "home");
              const status = ev.status?.type;
              const isLive = status?.state === "in";
              const timeStr = ev.date ? ev.date.slice(11, 16) : "";
              const displayTime = timeStr ? convertTo12Hour(timeStr) : "TBD";

              allScheduleItems.push({
                time: displayTime,
                l: sport.id,
                m: `${away?.team?.shortDisplayName || away?.team?.displayName || "?"} vs ${home?.team?.shortDisplayName || home?.team?.displayName || "?"}`,
                tv: comp.broadcasts?.[0]?.names?.[0] || "",
                live: isLive,
              });
            }
          }
        } catch (e) {
          /* skip */
        }
      }

      // Sort: live first, then by time
      allScheduleItems.sort((a, b) => {
        if (a.live !== b.live) return b.live - a.live;
        return a.time.localeCompare(b.time);
      });
    } catch (e) {
      console.warn("Schedule fetch failed:", e);
    }

    // Fallback if API returns nothing
    if (allScheduleItems.length === 0) {
      allScheduleItems = [
        {
          time: "TBD",
          l: "nba",
          m: "Check ESPN for today's games",
          tv: "",
          live: false,
        },
        {
          time: "TBD",
          l: "nhl",
          m: "Check ESPN for today's games",
          tv: "",
          live: false,
        },
      ];
    }

    function render(filter = "all") {
      let items = allScheduleItems;
      // Map filters
      if (filter === "today" || filter === "tomorrow") {
        // Show all since we only fetch today
        items = allScheduleItems;
      }

      container.innerHTML = items
        .map(
          (s) => `
        <div class="schedule-item${s.live ? " live" : ""}">
          <span class="schedule-time${s.live ? " live" : ""}">${s.live ? "🔴 " : ""}${s.time}</span>
          <span class="schedule-league ${s.l}">${s.l.toUpperCase()}</span>
          <span class="schedule-match">${s.m}</span>
          ${s.tv ? `<span class="schedule-tv">${s.tv}</span>` : ""}
        </div>
      `,
        )
        .join("");
    }

    render();
    filters?.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        filters
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        render(btn.dataset.filter);
      });
    });
  }

  function convertTo12Hour(time24) {
    if (!time24) return "TBD";
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  // ═══ Standings - with ESPN + TheSportsDB fallback + hardcoded last resort
  async function initStandings() {
    const container = document.getElementById("standingsList");
    const tabs = document.querySelectorAll(".standings-tab");
    if (!container) return;

    // Try to fetch live standings from ESPN/TheSportsDB
    const liveStandings = {};
    const sports = ["nba", "nhl", "mlb"];
    for (const sport of sports) {
      try {
        const data = await SPORTSYNC_API.ESPN.getStandings(sport);
        if (data?.length > 0) liveStandings[sport] = data;
      } catch {}
    }

    // Hardcoded fallback when APIs don't return standings
    const hardcoded = {
      nba: [
        { r: 1, n: "Detroit Pistons", rec: "51-22", lg: "nba", abbr: "DET" },
        {
          r: 2,
          n: "Cleveland Cavaliers",
          rec: "47-25",
          lg: "nba",
          abbr: "CLE",
        },
        { r: 3, n: "Boston Celtics", rec: "47-25", lg: "nba", abbr: "BOS" },
        { r: 4, n: "New York Knicks", rec: "46-27", lg: "nba", abbr: "NY" },
        {
          r: 5,
          n: "Oklahoma City Thunder",
          rec: "61-12",
          lg: "nba",
          abbr: "OKC",
        },
        { r: 6, n: "Houston Rockets", rec: "49-24", lg: "nba", abbr: "HOU" },
        { r: 7, n: "Memphis Grizzlies", rec: "44-29", lg: "nba", abbr: "MEM" },
        { r: 8, n: "LA Lakers", rec: "43-30", lg: "nba", abbr: "LAL" },
      ],
      nhl: [
        { r: 1, n: "Winnipeg Jets", rec: "49-20-5", lg: "nhl", abbr: "WPG" },
        {
          r: 2,
          n: "Washington Capitals",
          rec: "45-17-12",
          lg: "nhl",
          abbr: "WSH",
        },
        { r: 3, n: "Minnesota Wild", rec: "46-21-7", lg: "nhl", abbr: "MIN" },
        {
          r: 4,
          n: "Carolina Hurricanes",
          rec: "44-22-8",
          lg: "nhl",
          abbr: "CAR",
        },
        {
          r: 5,
          n: "Vegas Golden Knights",
          rec: "41-19-12",
          lg: "nhl",
          abbr: "VGK",
        },
      ],
      mlb: [
        { r: 1, n: "Los Angeles Dodgers", rec: "11-5", lg: "mlb", abbr: "LAD" },
        { r: 2, n: "New York Yankees", rec: "10-6", lg: "mlb", abbr: "NYY" },
        { r: 3, n: "Houston Astros", rec: "10-6", lg: "mlb", abbr: "HOU" },
        { r: 4, n: "Boston Red Sox", rec: "9-7", lg: "mlb", abbr: "BOS" },
        {
          r: 5,
          n: "Philadelphia Phillies",
          rec: "11-5",
          lg: "mlb",
          abbr: "PHI",
        },
      ],
      nfl: [
        { r: 1, n: "Detroit Lions", rec: "15-2", lg: "nfl", abbr: "DET" },
        { r: 2, n: "Philadelphia Eagles", rec: "14-3", lg: "nfl", abbr: "PHI" },
        { r: 3, n: "Kansas City Chiefs", rec: "15-2", lg: "nfl", abbr: "KC" },
        { r: 4, n: "Buffalo Bills", rec: "13-4", lg: "nfl", abbr: "BUF" },
        { r: 5, n: "Minnesota Vikings", rec: "14-3", lg: "nfl", abbr: "MIN" },
      ],
      wnba: [
        {
          r: 1,
          n: "New York Liberty",
          rec: "Preseason",
          lg: "wnba",
          abbr: "NY",
        },
        {
          r: 2,
          n: "Minnesota Lynx",
          rec: "Preseason",
          lg: "wnba",
          abbr: "MIN",
        },
        { r: 3, n: "Las Vegas Aces", rec: "Preseason", lg: "wnba", abbr: "LV" },
        {
          r: 4,
          n: "Connecticut Sun",
          rec: "Preseason",
          lg: "wnba",
          abbr: "CON",
        },
        { r: 5, n: "Indiana Fever", rec: "Preseason", lg: "wnba", abbr: "IND" },
      ],
    };

    function render(league) {
      const teams = liveStandings[league] || hardcoded[league] || [];
      container.innerHTML = teams
        .map(
          (t) => `
        <div class="standing-item">
          <span class="standing-rank">${t.r}</span>
          ${createLogoImg(t.lg, t.abbr, "standing-logo")}
          <span class="standing-name">${t.n}</span>
          <span class="standing-record">${t.rec}</span>
        </div>
      `,
        )
        .join("");
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        render(tab.dataset.league);
      });
    });

    render("nba");
  }

  // ═══ Trending ═══
  async function initTrending() {
    const container = document.getElementById("trendingList");
    if (!container) return;

    try {
      // Fetch top headlines from ESPN for NBA as a proxy for trending
      const data = await SPORTSYNC_API.ESPN.getNews("nba", 5);
      if (data?.articles?.length) {
        container.innerHTML = data.articles
          .slice(0, 5)
          .map(
            (a) => `
          <div class="trending-item">
            <i class="fa-solid fa-fire trending-icon"></i>
            <div>
              <p class="trending-title">${a.headline || a.shortName || "Untitled"}</p>
              <p class="trending-meta">${a.source || "ESPN"}</p>
              ${a.links?.web?.href ? `<a href="${a.links.web.href}" target="_blank" style="font-size:.75rem;color:var(--accent);text-decoration:none;">Read →</a>` : ""}
            </div>
          </div>
        `,
          )
          .join("");
        return;
      }
    } catch (e) {
      /* fallback below */
    }

    // Fallback if ESPN news fetch fails
    container.innerHTML = `
      <div class="trending-item">
        <i class="fa-solid fa-fire trending-icon"></i>
        <div>
          <p class="trending-title">NBA Standoff</p>
          <p class="trending-meta">Check ESPN for latest</p>
        </div>
      </div>
    `;

    // Add direct link to ESPN
    container.innerHTML += `
      <div class="trending-item" style="cursor:pointer;">
        <a href="https://www.espn.com/nba/" target="_blank" style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:8px;width:100%;">
          <i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--accent)"></i>
          <div>
            <p class="trending-title">More headlines on ESPN</p>
            <p class="trending-meta">Full coverage →</p>
          </div>
        </a>
      </div>
    `;
  }

  // ═══ Poll ═══
  function initPoll() {
    const buttons = document.querySelectorAll(".poll-btn");
    // Keys MUST match the `data-vote="..."` attrs on the .poll-btn elements
    // in index.html — click handler derives its target from btn.dataset.vote
    // and the percentage recompute reads votes[key]. Mismatch sets every pct
    // label to "NaN%" on the first click. Baseline numbers mirror the static
    // percentages hardcoded in the markup so the post-click recompute lands
    // back on 28/24/22/26 with no vote, instead of jumping to whatever these
    // happen to be.
    const votes = { celtics: 28, nuggets: 24, thunder: 22, lakers: 26 };

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("voted")) return;
        const v = btn.dataset.vote;
        // `?? 0` keeps the increment honest for any future data-vote value
        // not yet seeded in `votes` — undefined+? silently becomes 0+1 instead
        // of NaN, so the click handler degrades gracefully on markup drift.
        votes[v] = (votes[v] ?? 0) + 1;
        // Derive total from votes itself so adding/removing a button in the
        // markup can't reintroduce the same "undefined/100 = NaN" failure
        // mode this fix originally patched.
        const total = Object.values(votes).reduce((s, n) => s + n, 0);
        buttons.forEach((b) => {
          const pct = Math.round(((votes[b.dataset.vote] ?? 0) / total) * 100);
          b.querySelector(".poll-pct").textContent = pct + "%";
          b.classList.add("voted");
        });
      });
    });
  }

  // Hub hero rendering utility (unifies hero live strips across hubs)
  function renderHubHero(hubKey) {
    const map = { nfl: NFL_HUB, mlb: MLB_HUB, wnba: WNBA_HUB, nhl: NHL_HUB };
    const containerId = "heroLiveStrip" + hubKey.toUpperCase();
    const container = document.getElementById(containerId);
    const hub = map[hubKey];
    if (!container || !hub) return;
    const live =
      hub.liveScores && hub.liveScores.length ? hub.liveScores[0] : null;
    const score = live
      ? `<div class="mini-scores"><span class="mini-team">${live.home ?? live.team ?? ""}</span><span class="mini-score">${live.h ?? 0}-${live.a ?? 0}</span><span class="mini-time">${live.status ?? ""}</span></div>`
      : `<div class="mini-scores"><span class="mini-team">Live</span><span class="mini-score">—</span><span class="mini-time">TBD</span></div>`;
    const bracket = `<div class="bracket-teaser"><span class="bracket-title">Season Snapshot</span><span class="bracket-match">Upcoming Games</span></div>`;
    container.innerHTML = score + bracket;
  }

  // Dynamic hero section: fetches today's top game from ESPN
  async function updateHeroSection() {
    const badge = document.querySelector(".hero-badge span:last-child");
    const title = document.querySelector(".hero-title");
    const subtitle = document.querySelector(".hero-subtitle");

    if (!badge || !title || !subtitle) return;

    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    const day = now.getDate();

    // Determine current season context
    const isApril = month === "April";
    const isMay = month === "May";
    const isJune = month === "June";
    const isOct = month === "October";
    const isNov = month === "November";

    if (isApril || isMay) {
      // NBA Playoffs / MLB opening
      try {
        const nbaScore = await SPORTSYNC_API.ESPN.getScoreboard("nba");
        const events = nbaScore?.events || [];
        if (events.length > 0) {
          const comp = events[0].competitions?.[0];
          if (comp) {
            const home = comp.competitors?.find((c) => c.homeAway === "home");
            const away = comp.competitors?.find((c) => c.homeAway === "away");
            const st = events[0].status?.type;
            const isLive = st?.state === "in";
            const homeName =
              home?.team?.shortDisplayName || home?.team?.displayName || "";
            const awayName =
              away?.team?.shortDisplayName || away?.team?.displayName || "";

            if (isLive) {
              const badgeEl = document
                .querySelector(".hero-badge")
                ?.querySelectorAll("span");
              if (badgeEl && badgeEl[1]) badgeEl[1].textContent = `🔴 LIVE NOW`;
              title.textContent = `${awayName} @ ${homeName}`;
              subtitle.textContent = `${st.detail || "LIVE"} — ${awayName} ${away.score} - ${homeName} ${home.score}`;
            } else {
              title.textContent = "NBA PLAYOFF RACE HEATING UP";
              subtitle.textContent = `Tonight: ${awayName} at ${homeName} • ${events
                .slice(1)
                .map((e) => {
                  const c = e.competitions?.[0];
                  if (!c) return "";
                  const h = c.competitors?.find((x) => x.homeAway === "home");
                  const a = c.competitors?.find((x) => x.homeAway === "away");
                  return `${a?.team?.abbreviation || "?"} at ${h?.team?.abbreviation || "?"}`;
                })
                .filter(Boolean)
                .slice(0, 2)
                .join(" • ")}`;
            }
          }
        }
      } catch (e) {
        console.warn("Hero fetch failed:", e);
      }
    }
  }
})();
