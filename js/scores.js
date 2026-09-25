// High-score boards. createStore() keeps a list in the visitor's browser
// (localStorage); createRemoteStore() wraps it and talks to the shared
// service (docs/highscore-backend.md) so every visitor sees the same list,
// falling back to the local list when the network is not there.

export const MAX_ENTRIES = 10;
export const MAX_NAME = 12;

// Trim, uppercase, keep only A-Z 0-9 space . - _ and the umlauts ÄÖÜ,
// collapse spaces, cut to MAX_NAME; an empty result becomes 'ANON'.
export function cleanName(raw) {
  const s = String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .\-_ÄÖÜ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME)
    .trim();
  return s || 'ANON';
}

// Pure: a new array with `entry` added, sorted by score desc then by `at`
// asc (older entries win ties), cut to MAX_ENTRIES.
export function insertScore(list, entry) {
  return [...list, entry]
    .sort((a, b) => (b.score - a.score) || (a.at - b.at))
    .slice(0, MAX_ENTRIES);
}

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
}

export function createStore(storage = defaultStorage(), key = 'lb-bricks-scores') {
  const store = storage || memoryStorage();
  const nameKey = key + '-name';
  // In-memory mirror so add() still returns a sensible list when the storage
  // throws (private mode, quota) or hands back garbage.
  let cache = null;

  const read = (k) => { try { return store.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { store.setItem(k, v); } catch { /* private mode / quota */ } };

  function load() {
    if (cache) return cache.slice();
    let list = [];
    try {
      const parsed = JSON.parse(read(key) || '[]');
      if (Array.isArray(parsed)) {
        list = parsed
          .filter((e) => e && typeof e === 'object' && Number.isFinite(e.score))
          .map((e) => ({ name: cleanName(e.name), score: Math.floor(e.score), at: Number(e.at) || 0 }));
      }
    } catch { list = []; }
    cache = list;
    return list.slice();
  }

  function add({ name, score }) {
    const entry = { name: cleanName(name), score: Math.max(0, Math.floor(Number(score) || 0)), at: Date.now() };
    const list = insertScore(load(), entry);
    cache = list;
    write(key, JSON.stringify(list));
    return { list: list.slice(), rank: list.indexOf(entry) + 1 };
  }

  function lastName() { return read(nameKey) || ''; }
  function rememberName(name) { write(nameKey, String(name ?? '')); }

  return { load, add, lastName, rememberName };
}

// Normalise whatever a server sent into a clean, sorted, capped list.
export function normaliseList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e === 'object' && Number.isFinite(Number(e.score)))
    .map((e) => ({ name: cleanName(e.name), score: Math.floor(Number(e.score)), at: Number(e.at) || 0 }))
    .sort((a, b) => (b.score - a.score) || (a.at - b.at))
    .slice(0, MAX_ENTRIES);
}

// Shared board behind a tiny JSON service:
//   GET  endpoint?game=<id>            -> { scores: [{ name, score, at }] }
//   POST endpoint  body {game,name,score} -> { scores: [...], rank }
// The POST body goes as text/plain so the browser sends no CORS preflight
// (Apps Script web apps cannot answer one). `local` is the browser store used
// for the instant first paint and as the fallback when the request fails.
export function createRemoteStore({ endpoint, game, local, fetchFn = globalThis.fetch?.bind(globalThis), timeoutMs = 8000 }) {
  const url = (params) => endpoint + (endpoint.includes('?') ? '&' : '?') + new URLSearchParams(params);

  async function request(method, params, body) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    try {
      const res = await fetchFn(method === 'GET' ? url(params) : endpoint, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'follow',
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || data.error) throw new Error(data && data.error ? String(data.error) : 'bad response');
      return data;
    } finally { if (timer) clearTimeout(timer); }
  }

  // Instant, local list for the first paint.
  const load = () => local.load();

  // The shared list; throws when the service cannot be reached.
  async function fetchAll() {
    const data = await request('GET', { game });
    return normaliseList(data.scores);
  }

  // Saves to the service (and mirrors locally); on failure the local result
  // comes back with `remote: false` so the UI can say so.
  async function add({ name, score }) {
    const entry = { name: cleanName(name), score: Math.max(0, Math.floor(Number(score) || 0)) };
    const localResult = local.add(entry);
    try {
      const data = await request('POST', undefined, { game, ...entry });
      const list = normaliseList(data.scores);
      const rank = Number.isInteger(data.rank) ? data.rank : 0;
      return { list, rank, remote: true };
    } catch {
      return { ...localResult, remote: false };
    }
  }

  return { load, fetchAll, add, lastName: local.lastName, rememberName: local.rememberName };
}
