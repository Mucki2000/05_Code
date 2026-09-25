import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ENTRIES, MAX_NAME, cleanName, insertScore, createStore } from '../js/scores.js';

const fakeStorage = () => {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
};

test('cleanName: upper-cases, strips, collapses, cuts, falls back to ANON', () => {
  assert.equal(cleanName('carl'), 'CARL');
  assert.equal(cleanName('abcdefghijklmnopqrst').length, MAX_NAME);
  assert.equal(cleanName('abcdefghijklmnopqrst'), 'ABCDEFGHIJKL');
  assert.equal(cleanName(''), 'ANON');
  assert.equal(cleanName('   '), 'ANON');
  assert.equal(cleanName(undefined), 'ANON');
  assert.equal(cleanName('jörg müß'), 'JÖRG MÜSS');         // toUpperCase() turns ß into SS
  assert.equal(cleanName('änne öl über'), 'ÄNNE ÖL ÜBER');
  assert.equal(cleanName('max 🎮 power'), 'MAX POWER');
  assert.equal(cleanName('  a   b  '), 'A B');
  assert.equal(cleanName('a.b-c_d'), 'A.B-C_D');
  assert.equal(cleanName('<script>'), 'SCRIPT');
  assert.equal(cleanName('🎮🎮'), 'ANON');
});

test('insertScore: sorts by score desc, ties older first, caps at MAX_ENTRIES', () => {
  const list = [
    { name: 'A', score: 50, at: 1 },
    { name: 'B', score: 100, at: 2 },
  ];
  const out = insertScore(list, { name: 'C', score: 75, at: 3 });
  assert.deepEqual(out.map((e) => e.name), ['B', 'C', 'A']);
  assert.equal(list.length, 2, 'pure: input untouched');

  const tied = insertScore(out, { name: 'D', score: 100, at: 4 });
  assert.deepEqual(tied.map((e) => e.name), ['B', 'D', 'C', 'A'], 'tie: the older entry stays first');

  let big = [];
  for (let i = 1; i <= 12; i++) big = insertScore(big, { name: 'N' + i, score: i * 10, at: i });
  assert.equal(big.length, MAX_ENTRIES);
  assert.equal(big[0].score, 120);
  assert.equal(big[MAX_ENTRIES - 1].score, 30);
});

test('createStore.add: rank 1 for a new best, 0 when it does not make the top 10', () => {
  const s = createStore(fakeStorage(), 'k');
  for (let i = 1; i <= 10; i++) s.add({ name: 'P' + i, score: i * 10 });
  assert.equal(s.load().length, 10);
  const best = s.add({ name: 'ace', score: 500 });
  assert.equal(best.rank, 1);
  assert.equal(best.list[0].name, 'ACE');
  assert.equal(best.list.length, 10);
  const worst = s.add({ name: 'nope', score: 5 });
  assert.equal(worst.rank, 0);
  assert.ok(!worst.list.some((e) => e.name === 'NOPE'));
  const mid = s.add({ name: 'mid', score: 55 });
  assert.equal(mid.rank, 7);                               // 500 100 90 80 70 60 | 55
});

test('createStore persists to the storage under the key and reloads it', () => {
  const st = fakeStorage();
  const a = createStore(st, 'lb-test');
  a.add({ name: 'one', score: 20 });
  a.add({ name: 'two', score: 40 });
  assert.ok(st.m.has('lb-test'));
  const b = createStore(st, 'lb-test');
  assert.deepEqual(b.load().map((e) => [e.name, e.score]), [['TWO', 40], ['ONE', 20]]);
  a.rememberName('TWO');
  assert.equal(st.m.get('lb-test-name'), 'TWO');
  assert.equal(b.lastName(), 'TWO');
});

test('createStore: storage that throws still returns a list from add()', () => {
  const throwing = { getItem() { throw new Error('private mode'); }, setItem() { throw new Error('quota'); } };
  const s = createStore(throwing, 'k');
  assert.deepEqual(s.load(), []);
  const r = s.add({ name: 'x', score: 10 });
  assert.equal(r.rank, 1);
  assert.equal(r.list.length, 1);
  assert.equal(s.lastName(), '');
  assert.doesNotThrow(() => s.rememberName('X'));
  const r2 = s.add({ name: 'y', score: 30 });
  assert.deepEqual(r2.list.map((e) => e.name), ['Y', 'X'], 'in-memory list survives within the session');
});

test('createStore.load: garbage JSON or non-array yields []', () => {
  const st = fakeStorage();
  st.setItem('k', '{not json');
  assert.deepEqual(createStore(st, 'k').load(), []);
  st.setItem('k', '{"a":1}');
  assert.deepEqual(createStore(st, 'k').load(), []);
  st.setItem('k', '[{"name":"ok","score":10,"at":1},{"score":"NaN"},null,5]');
  assert.deepEqual(createStore(st, 'k').load(), [{ name: 'OK', score: 10, at: 1 }]);
});

test('createStore without storage works in memory', () => {
  const s = createStore(null, 'k');
  assert.deepEqual(s.load(), []);
  assert.equal(s.add({ name: 'm', score: 1 }).rank, 1);
  s.rememberName('M');
  assert.equal(s.lastName(), 'M');
});

// ---- remote store (shared board) ----
import { createRemoteStore, normaliseList } from '../js/scores.js';

const ok = (data) => ({ ok: true, status: 200, json: async () => data });

test('normaliseList cleans, sorts and caps what a server sends', () => {
  const list = normaliseList([{ name: 'b', score: 5, at: 2 }, { name: 'a', score: 5, at: 1 }, { name: 'x', score: 'nope' }, ...Array.from({ length: 12 }, (_, i) => ({ name: 'n' + i, score: i, at: i }))]);
  assert.equal(list.length, 10);
  assert.deepEqual(list.slice(0, 3).map((e) => e.name), ['N11', 'N10', 'N9']);
  assert.equal(normaliseList('garbage').length, 0);
});

test('remote store fetches the shared list and posts new scores as text/plain JSON', async () => {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    if (init.method === 'GET') return ok({ scores: [{ name: 'CARL', score: 100, at: 1 }] });
    return ok({ scores: [{ name: 'CARL', score: 100, at: 1 }, { name: 'MUCKI', score: 40, at: 2 }], rank: 2 });
  };
  const local = createStore(fakeStorage(), 'lb-bricks-scores');
  const store = createRemoteStore({ endpoint: 'https://example.test/exec', game: 'bricks', local, fetchFn });
  assert.deepEqual(store.load(), []);
  const list = await store.fetchAll();
  assert.equal(calls[0].url, 'https://example.test/exec?game=bricks');
  assert.deepEqual(list.map((e) => e.name), ['CARL']);
  const res = await store.add({ name: 'mucki', score: 40 });
  assert.equal(calls[1].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].init.body), { game: 'bricks', name: 'MUCKI', score: 40 });
  assert.equal(calls[1].init.headers, undefined, 'no content-type header, so no CORS preflight');
  assert.deepEqual({ rank: res.rank, remote: res.remote, names: res.list.map((e) => e.name) }, { rank: 2, remote: true, names: ['CARL', 'MUCKI'] });
  assert.equal(local.load().length, 1, 'mirrored locally');
});

test('remote store falls back to the local list when the service fails', async () => {
  const fetchFn = async () => { throw new Error('offline'); };
  const local = createStore(fakeStorage(), 'lb-flappy-scores');
  const store = createRemoteStore({ endpoint: 'https://example.test/exec', game: 'flappy', local, fetchFn });
  await assert.rejects(store.fetchAll());
  const res = await store.add({ name: 'x', score: 3 });
  assert.deepEqual({ rank: res.rank, remote: res.remote, n: res.list.length }, { rank: 1, remote: false, n: 1 });
});
