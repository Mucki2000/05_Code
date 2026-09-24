import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStatus } from '../js/clock.js';

test('formats weekday, month, day and 24h time with zero padding', () => {
  const d = new Date(2026, 8, 24, 14, 5); // Thu 24 Sep 2026, 14:05
  assert.deepEqual(formatStatus(d), { date: 'THU, SEP 24', time: '14:05' });
});

test('pads single-digit hours', () => {
  const d = new Date(2026, 0, 4, 9, 0); // Sun 4 Jan 2026
  assert.deepEqual(formatStatus(d), { date: 'SUN, JAN 4', time: '09:00' });
});
