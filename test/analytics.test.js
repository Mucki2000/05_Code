import test from 'node:test';
import assert from 'node:assert/strict';
import { endpointFor, initAnalytics, trackView } from '../js/analytics.js';

function fakeDoc() {
  const head = { children: [], appendChild(n) { this.children.push(n); } };
  return {
    head,
    querySelector: (sel) => head.children.find((n) => sel.includes('data-goatcounter') && n.attrs['data-goatcounter']) || null,
    createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }),
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
  assert.equal(trackView('x', 'X', undefined), false);
  assert.equal(trackView('x', 'X', { count: () => { throw new Error('boom'); } }), false);
});
