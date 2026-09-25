import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_W, MAP_H, MAP_ROWS, PINS, mapSvg } from '../js/map.js';

test('map grid dimensions match MAP_W / MAP_H', () => {
  assert.equal(MAP_ROWS.length, MAP_H);
  for (const row of MAP_ROWS) {
    assert.equal(row.length, MAP_W);
  }
});

test('ten pinned cities', () => {
  assert.equal(PINS.length, 10);
});

test('mapSvg() returns an inline SVG with ten labels', () => {
  const svg = mapSvg();
  assert.ok(svg.startsWith('<svg'), 'starts with <svg');
  const textCount = (svg.match(/<text/g) || []).length;
  assert.equal(textCount, 10);
});

test('run-length encoding keeps land rects well under one per cell', () => {
  const svg = mapSvg();
  const totalRects = (svg.match(/<rect/g) || []).length;
  // 3 rects per pin: the 3x3 pink square, the 1x1 white centre, the pulsing ring.
  const pinRects = PINS.length * 3;
  const landRects = totalRects - pinRects;
  assert.ok(landRects < 3000, `expected fewer than 3000 land rects, got ${landRects}`);
});
