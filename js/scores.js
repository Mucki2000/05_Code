// BRICKS high-score board. The site is static, so the board lives in the
// visitor's browser (localStorage) behind this small store; a shared backend
// can replace createStore() later without touching the game code.

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
