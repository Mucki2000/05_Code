import test from 'node:test';
import assert from 'node:assert/strict';
import { pixelSvg, ICONS, POWER, SIGNAL, BATTERY, ANTENNA } from '../js/icons.js';

test('pixelSvg turns a 2x2 map into rects', () => {
  const svg = pixelSvg(['#.', '.g']);
  assert.match(svg, /<svg viewBox="0 0 2 2"/);
  assert.match(svg, /<rect x="0" y="0" width="1" height="1" fill="#1c2e5c"\/>/);
  assert.match(svg, /<rect x="1" y="1" width="1" height="1" fill="#8ec530"\/>/);
  assert.equal((svg.match(/<rect/g) || []).length, 2);
});

test('every app icon is a 16x16 map', () => {
  const keys = ['house', 'clapper', 'building', 'reel', 'briefcase', 'face', 'folder', 'note', 'bricks'];
  for (const k of keys) {
    assert.ok(ICONS[k], `missing icon ${k}`);
    assert.match(ICONS[k], /viewBox="0 0 16 16"/);
  }
});

test('power and signal symbols exist', () => {
  assert.match(POWER, /viewBox="0 0 16 16"/);
  assert.match(SIGNAL, /<svg/);
});

test('battery and antenna status glyphs are crisp currentColor pixel art', () => {
  for (const g of [BATTERY, ANTENNA]) {
    assert.match(g, /shape-rendering="crispEdges"/);
    assert.match(g, /fill="currentColor"/);
    assert.doesNotMatch(g, /fill="#/);
  }
  assert.match(BATTERY, /viewBox="0 0 10 6"/);
  assert.match(ANTENNA, /viewBox="0 0 5 6"/);
});
