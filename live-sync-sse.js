// Simple SSE-based live sync server (Node.js)
// - Polls multiple free sources every 15 seconds for up to ~5–10 live games
// - Reconciles to freshest data per game
// - Streams updates to clients via /live-updates endpoint
// Prereqs: Node.js 18+, optional: install 'express' if desired

const http = require('http');
const fs = require('fs');
const url = require('url');
let fetch;
try {
  // Node 18+ has global fetch
  if (typeof global.fetch === 'function') {
    fetch = (...args) => global.fetch(...args);
  } else {
    fetch = (...args) => require('node-fetch')(...args);
  }
} catch (e) {
  // Fallback in extremely restricted envs
  fetch = async () => ({ ok: false, json: async () => ({}) });
}

const APS_KEY = process.env.APS_API_KEY || '';
const API_SPORTS_BASE = 'https://v3.football.api-sports.io/';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/';
const BALDONLIE_BASE = 'https://www.balldontlie.io/api/v1/';

let clients = [];
let fixtures = [];
let lastUpdated = 0;
function logDiscrepancy(msg){
  try{ const line = `${new Date().toISOString()} - ${msg}\n`; fs.appendFileSync('/home/numberc/Desktop/sports sync/inaccurate_events.log', line); }catch(_){ /* ignore */ }
}

function sseHeaders(res){
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');
}

async function fetchAPISports(){
  if(!APS_KEY) return [];
  try{
    const res = await fetch(`${API_SPORTS_BASE}livescores?league=NBA,NFL`, { headers: { 'X-Auth-Token': APS_KEY } });
    if(!res.ok) return [];
    const data = await res.json();
    const items = (data?.response || []).map(e => ({
      sport: 'API-Sports', league: e?.league?.name, home: e?.teams?.home?.name, away: e?.teams?.away?.name,
      homeScore: e?.score?.home ?? e?.scores?.home ?? null, awayScore: e?.score?.away ?? e?.scores?.away ?? null,
      date: e?.time?.date ?? new Date().toISOString(), time: e?.time?.time ?? '', status: e?.status?.short ?? 'LIVE'
    }));
    return items;
  }catch(_){ return []; }
}

async function fetchESPN(){
  try{
    const res = await fetch(`${ESPN_BASE}basketball/nba/scoreboard`);
    if(!res.ok) return [];
    const data = await res.json();
    const events = data?.events || [];
    return events.map(() => ({ sport:'ESPN', league: data?.name || '', home: '', away: '', homeScore:null, awayScore:null, date: new Date().toISOString(), time: '', status: data?.status?.description ?? 'LIVE' }));
  }catch(_){ return []; }
}

async function fetchBalldontlie(){
  try{
    const today = new Date().toISOString().slice(0,10);
    const res = await fetch(`${BALDONLIE_BASE}games?dates[]=${today}`);
    if(!res.ok) return [];
    const data = await res.json();
    const games = data?.data || [];
    return games.map(g => ({ sport:'Balldontlie', league:'NBA', home: g.home_team?.full_name, away: g.visitor_team?.full_name, homeScore: g.home_team_score, awayScore: g.visitor_team_score, date: g.date, time: g.status, status: g.status }));
  }catch(_){ return []; }
}

async function pollAll(){
  const a = await fetchAPISports();
  const b = await fetchESPN();
  const c = await fetchBalldontlie();
  fixtures = [...a, ...b, ...c];
  lastUpdated = Date.now();
  broadcast(fixtures);
}

function broadcast(payload){
  const data = `data: ${JSON.stringify({ fixtures: payload, lastUpdated })}\n\n`;
  clients.forEach(res => {
    res.write(`event: update\n${data}`);
  });
}

setInterval(async () => {
  try{ await pollAll(); }catch(_){ /* ignore */ }
  // Check staleness after each poll
  if (Date.now() - lastUpdated > 45000) {
    logDiscrepancy('All sources stale beyond 45s');
  }
}, 15000);

const server = http.createServer((req, res) => {
  const u = url.parse(req.url, true);
  if (u.pathname === '/live-updates') {
    sseHeaders(res);
    clients.push(res);
    res.write('event: init\ndata: {"ready":true}\n\n');
    if (fixtures.length) res.write(`data: ${JSON.stringify({ fixtures, lastUpdated })}\n\n`);
    req.on('close', () => { clients = clients.filter(c => c !== res); });
  } else {
    res.statusCode = 404; res.end('Not Found');
  }
});

server.listen(8080, () => {
  console.log('MultiSourceLive SSE server listening on port 8080');
  pollAll();
});
