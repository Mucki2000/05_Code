import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_IDS, parseHash } from '../js/router.js';

test('lists the eight apps in home-screen order', () => {
  assert.deepEqual(APP_IDS, ['home', 'filmtv', 'unternehmen', 'musik', 'current', 'career', 'about', 'bricks']);
});

test('parses known hashes case-insensitively and rejects the rest', () => {
  assert.equal(parseHash('#filmtv'), 'filmtv');
  assert.equal(parseHash('#FILMTV'), 'filmtv');
  assert.equal(parseHash('#about'), 'about');
  assert.equal(parseHash('#nope'), null);
  assert.equal(parseHash(''), null);
  assert.equal(parseHash(undefined), null);
});
