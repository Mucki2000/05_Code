import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_IDS, parseHash } from '../js/router.js';

test('lists home (the desktop) plus the eight apps in home-screen order', () => {
  assert.deepEqual(APP_IDS, ['home', 'filmtv', 'unternehmen', 'musik', 'current', 'contact', 'about', 'bricks', 'flappy']);
});

test('parses known hashes case-insensitively and rejects the rest', () => {
  assert.equal(parseHash('#filmtv'), 'filmtv');
  assert.equal(parseHash('#FILMTV'), 'filmtv');
  assert.equal(parseHash('#about'), 'about');
  assert.equal(parseHash('#home'), 'home', '#home stays a known hash (means the desktop)');
  assert.equal(parseHash('#flappy'), 'flappy');
  assert.equal(parseHash('#nope'), null);
  assert.equal(parseHash(''), null);
  assert.equal(parseHash(undefined), null);
});
