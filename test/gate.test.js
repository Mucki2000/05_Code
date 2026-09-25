import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, isUnlocked, markUnlocked } from '../js/gate.js';

test('sha256Hex hashes text to a hex SHA-256 digest', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('isUnlocked/markUnlocked round-trip through a storage-like object', () => {
  const m = new Map();
  const storage = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.equal(isUnlocked('current', storage), false);
  markUnlocked('current', storage);
  assert.equal(isUnlocked('current', storage), true);
  assert.equal(isUnlocked('other', storage), false);
});

test('isUnlocked tolerates a storage that throws (private mode)', () => {
  const storage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(isUnlocked('current', storage), false);
  assert.doesNotThrow(() => markUnlocked('current', storage));
});
