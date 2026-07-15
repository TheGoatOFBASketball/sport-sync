// espn-api.test.js
//
// Run with:    npm test
// Direct:      node --test espn-api.test.js
//
// Verifies the SPORTSYNC_PROXY_BASE wire-in (window override / meta tag /
// fallback / malformed scheme) plus the runtime localStorage paths in
// getProxyBaseUrl + setProxyBaseUrl. Tests sandbox the script via node:vm
// so window/document/localStorage are fully isolated per case — no state
// leakage between scenarios.

'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');
const vm     = require('node:vm');

const SOURCE_PATH = path.join(__dirname, 'espn-api.js');
const SOURCE      = fs.readFileSync(SOURCE_PATH, 'utf8');

// ─── Test fixtures ────────────────────────────────────────────────────────────

const STORAGE_MOCK = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    _dump: () => Object.fromEntries(m),
  };
};

// Build a fresh VM context with the supplied window/document/localStorage
// overrides. Each call gives the wire-in a clean slate so override state
// from one case can't leak into the next.
function buildContext({ window = {}, document = null, localStorage = STORAGE_MOCK(), fetch: fetchImpl = null } = {}) {
  const ctxObj = {
    window: { ...window },
    localStorage,
    console: { log() {}, warn() {}, error() {}, debug() {}, info() {} },
    setTimeout,
    clearTimeout,
    AbortController,
  };
  if (document) ctxObj.document = document;
  if (fetchImpl) ctxObj.fetch = fetchImpl;
  return vm.createContext(ctxObj);
}

const META_DOC_WITH = (url) => ({
  documentElement: { getAttribute: () => null },
  querySelector: (sel) => (sel.includes('sportsync-proxy-base') ? { content: url } : null),
  querySelectorAll: () => [],
});

const META_DOC_NULL = () => ({
  documentElement: { getAttribute: () => null },
  querySelector: () => null,
  querySelectorAll: () => [],
});

const SILENT_WINDOW = () => ({});

// Capture the resolved default URL (set at module-load time via the
// _resolveProxyBaseUrl wire-in) and the SPORTSYNC_API surface for
// inspection.
function loadInContext(ctx) {
  vm.runInContext(SOURCE, ctx, { filename: 'espn-api.js' });
  const api = ctx.window.SPORTSYNC_API;
  assert.ok(api,          'SPORTSYNC_API must be exposed on window');
  assert.ok(api.PROXY,     'SPORTSYNC_API.PROXY must exist');
  assert.equal(typeof api.PROXY.defaultUrl, 'string', 'PROXY.defaultUrl must be a string');
  return { defaultUrl: api.PROXY.defaultUrl, ctx };
}

// ─── 4 wire-in scenarios ──────────────────────────────────────────────────────

test('wire-in: window.SPORTSYNC_PROXY_BASE → accepted, trailing slash trimmed', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'https://my-proxy.example.com/' },
    document: META_DOC_NULL(),
  })).defaultUrl;
  assert.equal(url, 'https://my-proxy.example.com');
});

test('wire-in: no override → falls back to localhost:8000', () => {
  const url = loadInContext(buildContext({
    window: SILENT_WINDOW(),
    document: META_DOC_NULL(),
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: <meta name="sportsync-proxy-base"> → accepted when window silent', () => {
  const url = loadInContext(buildContext({
    window: SILENT_WINDOW(),
    document: META_DOC_WITH('https://meta-proxy.example.com/'),
  })).defaultUrl;
  assert.equal(url, 'https://meta-proxy.example.com');
});

test('wire-in: window takes precedence over <meta>', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'https://window-wins.example.com/' },
    document: META_DOC_WITH('https://meta-loses.example.com/'),
  })).defaultUrl;
  assert.equal(url, 'https://window-wins.example.com');
});

test('wire-in: malformed scheme (javascript:) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'javascript:alert(1)' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: malformed scheme (file:///) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'file:///etc/passwd' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: malformed scheme (ftp://) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'ftp://anonymous@example.com/' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: malformed scheme (ws://) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'ws://socket.example.com/' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: malformed scheme (data:) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'data:text/html,<script>alert(1)</script>' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: malformed scheme (about:) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'about:blank' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: typo (missing scheme) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'my-proxy.example.com' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: http:// (not https://) accepted', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'http://insecure-proxy.example.com:9000' },
  })).defaultUrl;
  assert.equal(url, 'http://insecure-proxy.example.com:9000');
});

test('wire-in: empty string rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: '' },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

test('wire-in: number (non-string) rejected → falls back to localhost', () => {
  const url = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 42 },
  })).defaultUrl;
  assert.equal(url, 'http://localhost:8000');
});

// ─── Runtime: getProxyBaseUrl + setProxyBaseUrl ───────────────────────────────

test('runtime getProxyBaseUrl: no localStorage → returns defaultUrl', () => {
  const ls = STORAGE_MOCK();
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), loaded.defaultUrl);
});

test('runtime getProxyBaseUrl: valid localStorage value returned', () => {
  const ls = STORAGE_MOCK();
  ls.setItem('SPORTSYNC_PROXY_URL', 'https://saved.example.com/');
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), 'https://saved.example.com');
});

test('runtime getProxyBaseUrl: invalid localStorage value falls back', () => {
  const ls = STORAGE_MOCK();
  ls.setItem('SPORTSYNC_PROXY_URL', 'javascript:alert(1)');
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), loaded.defaultUrl);
});

test('runtime getProxyBaseUrl: multi-trailing-slash trimmed', () => {
  const ls = STORAGE_MOCK();
  ls.setItem('SPORTSYNC_PROXY_URL', 'https://extra-slashes.example.com////');
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), 'https://extra-slashes.example.com');
});

test('runtime setProxyBaseUrl: valid url persisted + returns true', () => {
  const ls = STORAGE_MOCK();
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  const ok = loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl('https://new-host.example.com');
  assert.equal(ok, true);
  assert.equal(ls.getItem('SPORTSYNC_PROXY_URL'), 'https://new-host.example.com');
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), 'https://new-host.example.com');
});

test('runtime setProxyBaseUrl: invalid url rejected + returns false (storage untouched)', () => {
  const ls = STORAGE_MOCK();
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  const ok = loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl('https://valid.example.com');
  assert.equal(ok, true);
  const ok2 = loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl('ftp://wrong-scheme.example.com');
  assert.equal(ok2, false);
  // storage should still have the previous valid value, not overwritten
  assert.equal(ls.getItem('SPORTSYNC_PROXY_URL'), 'https://valid.example.com');
});

// ─── PROXY surface contract (won't regress silently) ──────────────────────────

test('PROXY surface exposes the methods callers depend on', () => {
  const loaded = loadInContext(buildContext());
  const proxy = loaded.ctx.window.SPORTSYNC_API.PROXY;
  assert.equal(typeof proxy.getUrl,          'function', 'getUrl must be a function');
  assert.equal(typeof proxy.setUrl,          'function', 'setUrl must be a function');
  assert.equal(typeof proxy.status,          'object',   'status must be an object');
  assert.equal(typeof proxy.defaultUrl,      'string',   'defaultUrl must be a string');
  assert.equal(typeof proxy.dismissKey,      'string',   'dismissKey must be a string');
  assert.equal(typeof proxy.invalidateInFlight, 'function', 'invalidateInFlight must be a function');
  assert.equal(typeof proxy.resetInFlight,     'function', 'resetInFlight must be a function');
});

test('PROXY.status starts with the resolved URL populated', () => {
  const loaded = loadInContext(buildContext({
    window: { SPORTSYNC_PROXY_BASE: 'https://status-starter.example.com/' },
  }));
  const status = loaded.ctx.window.SPORTSYNC_API.PROXY.status;
  assert.equal(status.url, 'https://status-starter.example.com');
  assert.equal(status.fellBack, false);
  assert.equal(status.date, null);
});

// ─── _normalizeProxyUrl coverage (new shared helper) ───────────────────────────

test('runtime setProxyBaseUrl: whitespace-padded url accepted, trimmed + stored trimmed', () => {
  const ls = STORAGE_MOCK();
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  const ok = loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl('  https://padded.example.com/  ');
  assert.equal(ok, true);
  assert.equal(ls.getItem('SPORTSYNC_PROXY_URL'), 'https://padded.example.com');
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), 'https://padded.example.com');
});

test('runtime setProxyBaseUrl: uppercase scheme accepted, case preserved', () => {
  const ls = STORAGE_MOCK();
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  const ok = loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl('HTTPS://upper.example.com/');
  assert.equal(ok, true);
  assert.equal(ls.getItem('SPORTSYNC_PROXY_URL'), 'HTTPS://upper.example.com');
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.getUrl(), 'HTTPS://upper.example.com');
});

test('runtime setProxyBaseUrl: whitespace-only input rejected (returns false, storage untouched)', () => {
  const ls = STORAGE_MOCK();
  ls.setItem('SPORTSYNC_PROXY_URL', 'https://preexisting.example.com');
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  const ok = loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl('   ');
  assert.equal(ok, false);
  assert.equal(ls.getItem('SPORTSYNC_PROXY_URL'), 'https://preexisting.example.com');
});

test('runtime setProxyBaseUrl: null/undefined input rejected', () => {
  const ls = STORAGE_MOCK();
  const loaded = loadInContext(buildContext({ localStorage: ls }));
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl(null), false);
  assert.equal(loaded.ctx.window.SPORTSYNC_API.PROXY.setUrl(undefined), false);
  assert.equal(ls._dump().SPORTSYNC_PROXY_URL, undefined, 'no key written');
});

// ─── getHoopsRumorsNews hostname guard (avoid localhost-katana on Vercel) ─────

// Run getHoopsRumorsNews against a stubbable fetch and capture every URL the
// function tries. The stub always returns a non-ok envelope so both proxies
// fall through; we only care about the URL ordering, not the payload.
async function runHoopsCapturing(windowOpts) {
  const fetches = [];
  const fetchStub = async (url) => {
    fetches.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'error', message: 'stub' }),
    };
  };
  const ctx = buildContext({
    window: { location: { hostname: windowOpts.hostname || '' }, ...(windowOpts.extra || {}) },
    fetch: fetchStub,
  });
  const loaded = loadInContext(ctx);
  try {
    await loaded.ctx.window.SPORTSYNC_API.HOOPS_RUMORS.getNews(5);
  } catch (_) { /* expected — both proxies return error envelope */ }
  return fetches;
}

test('getHoopsRumorsNews: skips localhost katana on deployed (non-loopback) page', async () => {
  const fetches = await runHoopsCapturing({ hostname: 'sports-sync-theta.vercel.app' });
  assert.equal(fetches.length, 1, 'no localhost attempt on deployed host');
  assert.ok(fetches[0].startsWith('https://api.rss2json.com/'),
    'must skip directly to rss2json');
  assert.ok(!fetches.some(u => u.includes('localhost:8000')),
    'localhost:8000 must NOT be hit from a deployed page');
});

test('getHoopsRumorsNews: uses localhost katana on loopback page', async () => {
  const fetches = await runHoopsCapturing({ hostname: 'localhost' });
  assert.equal(fetches.length, 2, 'local dev should try katana first, then rss2json');
  assert.ok(fetches[0].includes('localhost:8000'),
    'first fetch must hit the local katana proxy');
  assert.ok(fetches[1].startsWith('https://api.rss2json.com/'),
    'second fetch must be rss2json');
});

test('getHoopsRumorsNews: respects custom remote proxy override on deployed page', async () => {
  const fetches = await runHoopsCapturing({
    hostname: 'sports-sync-theta.vercel.app',
    extra: { SPORTSYNC_PROXY_BASE: 'https://my-proxy.example.com' },
  });
  assert.equal(fetches.length, 2, 'custom proxy override must run the primary path');
  assert.ok(fetches[0].startsWith('https://my-proxy.example.com/'),
    'first fetch must hit the user-configured proxy');
});

test('getHoopsRumorsNews: rss2json URL does not include the count parameter (free-tier 422 bug)', async () => {
  const fetches = await runHoopsCapturing({ hostname: 'localhost' });
  const rssFetch = fetches.find(u => u.startsWith('https://api.rss2json.com/'));
  assert.ok(rssFetch, 'rss2json must be called');
  assert.ok(!/[?&]count=\d+/.test(rssFetch),
    'rss2json free tier rejects count= and returns HTTP 422');
});

test('getHoopsRumorsNews: regex guard — "localhost" appearing as substring of host (not the host itself) is NOT considered local', async () => {
  // Regression: without the /[:/]|$/ boundary anchor, `.includes("localhost")`
  // would false-positive on https://localhost-mirror.example.com and we'd
  // silently skip the user's remote proxy. The regex with boundary anchoring
  // ensures we only treat a proxy as truly-local when the host IS local.
  const fetches = await runHoopsCapturing({
    hostname: 'vercel.app',
    extra: { SPORTSYNC_PROXY_BASE: 'https://localhost-mirror.example.com' },
  });
  assert.equal(fetches.length, 2, 'substring "localhost" must NOT trip the local-proxy guard');
  assert.ok(fetches[0].startsWith('https://localhost-mirror.example.com/'),
    'first fetch must hit the user-configured remote proxy despite hostname containing "localhost"');
});

test('getHoopsRumorsNews: regex guard — IPv4 loopback with non-default port still treated as local', async () => {
  // Custom-port 127.0.0.1 deploys are still localhost; verify the regex
  // handles the trailing colon as a boundary.
  const fetches = await runHoopsCapturing({
    hostname: 'vercel.app',
    extra: { SPORTSYNC_PROXY_BASE: 'http://127.0.0.1:9000' },
  });
  assert.equal(fetches.length, 1, '127.0.0.1 proxy on deployed page should be skipped entirely');
  assert.ok(!fetches.some(u => u.includes('127.0.0.1')),
    '127.0.0.1 proxy must NOT be hit from a deployed page');
});

test('getHoopsRumorsNews: regex guard — truth-table symmetry (localhost page + remote proxy override runs primary)', async () => {
  // The fourth truth-table case: on a loopback page with a user-configured
  // remote proxy, the primary path should still run.
  const fetches = await runHoopsCapturing({
    hostname: 'localhost',
    extra: { SPORTSYNC_PROXY_BASE: 'https://my-proxy.example.com' },
  });
  assert.equal(fetches.length, 2, 'remote proxy override must run on loopback page too');
  assert.ok(fetches[0].startsWith('https://my-proxy.example.com/'),
    'first fetch must hit the user-configured proxy');
});

