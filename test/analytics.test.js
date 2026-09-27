import test from 'node:test';
import assert from 'node:assert/strict';
import { endpointFor, initAnalytics, trackView, flush, pendingViews } from '../js/analytics.js';

function fakeDoc() {
  const head = { children: [], appendChild(n) { this.children.push(n); } };
  return {
    head,
    querySelector: (sel) => head.children.find((n) => sel.includes('data-goatcounter') && n.attrs['data-goatcounter']) || null,
    createElement: () => ({ attrs: {}, listeners: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { this.listeners[t] = f; } }),
  };
}

test('endpointFor builds the GoatCounter count URL, empty code = off', () => {
  assert.equal(endpointFor('lausebengel'), 'https://lausebengel.goatcounter.com/count');
  assert.equal(endpointFor(''), '');
});

test('initAnalytics injects the script once and not without a code', () => {
  const doc = fakeDoc();
  assert.equal(initAnalytics('', doc), false);
  assert.equal(doc.head.children.length, 0);
  assert.equal(initAnalytics('lausebengel', doc), true);
  assert.equal(initAnalytics('lausebengel', doc), false, 'second call is a no-op');
  const s = doc.head.children[0];
  assert.equal(s.src, 'https://gc.zgo.at/count.js');
  assert.equal(s.async, true);
  assert.equal(s.attrs['data-goatcounter'], 'https://lausebengel.goatcounter.com/count');
});

test('trackView counts a path and survives a missing or throwing tracker', () => {
  const calls = [];
  assert.equal(trackView('bricks', 'BRICKS', { count: (o) => calls.push(o) }), true);
  assert.deepEqual(calls, [{ path: '/bricks', title: 'BRICKS' }]);
  assert.equal(trackView('/about', undefined, { count: (o) => calls.push(o) }), true);
  assert.deepEqual(calls[1], { path: '/about', title: '/about' });
  assert.equal(trackView('x', 'X', { count: () => { throw new Error('boom'); } }), false);
});

test('views before count.js has loaded are queued and flushed on load', () => {
  const doc = fakeDoc();
  initAnalytics('lausebengel', doc);
  const before = pendingViews();
  assert.equal(trackView('about', 'ABOUT', undefined), true, 'queued while the script loads');
  assert.equal(pendingViews(), before + 1);
  const calls = [];
  globalThis.goatcounter = { count: (o) => calls.push(o) };
  doc.head.children[0].listeners.load();
  delete globalThis.goatcounter;
  assert.equal(pendingViews(), 0);
  assert.deepEqual(calls.at(-1), { path: '/about', title: 'ABOUT' });
  assert.equal(flush(undefined), 0, 'nothing to flush without a tracker');
});
