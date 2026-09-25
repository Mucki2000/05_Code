import test from 'node:test';
import assert from 'node:assert/strict';
import { progressAt } from '../js/loader.js';

test('starts at 0 and ends at 100', () => {
  assert.equal(progressAt(0), 0);
  assert.equal(progressAt(-5), 0);
  assert.equal(progressAt(6000), 100);
  assert.equal(progressAt(9000), 100);
});

test('stalls at 64 between 55% and 70% of the duration', () => {
  assert.equal(progressAt(3300), 64);
  assert.equal(progressAt(3800), 64);
  assert.equal(progressAt(4200), 64);
});

test('is monotonic', () => {
  let prev = -1;
  for (let t = 0; t <= 6000; t += 50) {
    const p = progressAt(t);
    assert.ok(p >= prev, `dropped at ${t}`);
    prev = p;
  }
});

test('respects a custom duration', () => {
  assert.equal(progressAt(1500, 1500), 100);
  assert.equal(progressAt(900, 1500), 64);
});
