import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStatus } from '../js/clock.js';

test('formats weekday, month, day and 12h time with PM', () => {
  const d = new Date(2026, 8, 24, 14, 5); // Thu 24 Sep 2026, 14:05
  assert.deepEqual(formatStatus(d), { date: 'THU, SEP 24', time: '2:05', ampm: 'PM' });
});

test('does not pad single-digit hours, morning is AM', () => {
  const d = new Date(2026, 0, 4, 9, 0); // Sun 4 Jan 2026
  assert.deepEqual(formatStatus(d), { date: 'SUN, JAN 4', time: '9:00', ampm: 'AM' });
});

test('midnight half past is 12:30 AM', () => {
  const d = new Date(2026, 0, 4, 0, 30);
  assert.deepEqual(formatStatus(d), { date: 'SUN, JAN 4', time: '12:30', ampm: 'AM' });
});

test('noon is 12:26 PM', () => {
  const d = new Date(2026, 0, 4, 12, 26);
  assert.deepEqual(formatStatus(d), { date: 'SUN, JAN 4', time: '12:26', ampm: 'PM' });
});

test('last minute of the day is 11:59 PM', () => {
  const d = new Date(2026, 8, 24, 23, 59);
  assert.deepEqual(formatStatus(d), { date: 'THU, SEP 24', time: '11:59', ampm: 'PM' });
});
