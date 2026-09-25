import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlappy, stepFlappy, renderFlappy, GRAVITY, FLAP, SPEED, PIPE_W, PIPE_EVERY, GAP } from '../js/flappy.js';

const DT = 1 / 60;
// `input` may be a function of the game so a bot can decide per frame.
const steps = (g, n, input) => { for (let i = 0; i < n; i++) stepFlappy(g, DT, typeof input === 'function' ? input(g) : input); return g; };
const hover = (target) => (g) => ({ flap: g.bird.y > target });

test('createFlappy: bird mid-height, no pipes, score 0, alive', () => {
  const g = createFlappy();
  assert.equal(g.w, 160); assert.equal(g.h, 100);
  assert.deepEqual(g.bird, { x: 32, y: 50, vy: 0, w: 7, h: 6 });
  assert.deepEqual(g.pipes, []);
  assert.equal(g.score, 0); assert.equal(g.dead, false); assert.equal(g.groundH, 8);
});

test('the bird falls under gravity without input', () => {
  const g = createFlappy();
  g.rng = () => 0.5;
  stepFlappy(g, 0.1);
  assert.ok(Math.abs(g.bird.vy - GRAVITY * 0.1) < 1e-9, 'vy = g*t');
  assert.ok(g.bird.y > 50, 'bird moved down');
  const y1 = g.bird.y;
  stepFlappy(g, 0.1);
  assert.ok(g.bird.y - y1 > y1 - 50, 'accelerating');
});

test('a flap sets an upward velocity once per call', () => {
  const g = createFlappy();
  g.rng = () => 0.5;
  stepFlappy(g, 0.01, { flap: true });
  assert.ok(g.bird.vy < 0 && g.bird.vy > -FLAP, 'vy is -FLAP plus a little gravity');
  assert.ok(g.bird.y < 50, 'bird moved up');
  const vy = g.bird.vy;
  stepFlappy(g, 0.01, {});
  assert.ok(g.bird.vy > vy, 'no flap without input: gravity pulls again');
  stepFlappy(g, 0.01, { flap: 'yes' });
  assert.ok(g.bird.vy > vy, 'flap must be exactly true');
});

test('a pipe spawns at the right edge, the next one after PIPE_EVERY px of travel', () => {
  const g = createFlappy();
  g.rng = () => 0.5;
  stepFlappy(g, DT);
  assert.equal(g.pipes.length, 1, 'first pipe on the first step');
  assert.ok(g.pipes[0].x <= 160 && g.pipes[0].x > 158, 'spawned at the right edge');
  const n = Math.ceil((PIPE_EVERY - g.travel) / (SPEED * DT));
  steps(g, n - 1, hover(46));                            // a bot keeps the bird alive while we wait
  assert.equal(g.pipes.length, 1, 'still one pipe just before PIPE_EVERY');
  for (let i = 0; i < 10 && g.travel < PIPE_EVERY; i++) stepFlappy(g, DT, hover(46)(g));
  assert.equal(g.pipes.length, 2, 'second pipe after PIPE_EVERY px');
  assert.ok(Math.abs((g.pipes[1].x - g.pipes[0].x) - PIPE_EVERY) < 1e-6, 'pipes are PIPE_EVERY apart');
  assert.equal(g.dead, false);
});

test('passing a pipe adds 1 score exactly once', () => {
  const g = createFlappy();
  g.nextPipe = Infinity;                                  // no automatic spawns
  g.pipes.push({ x: 25, gap: 50, passed: false });        // bird (y 50..56) sits inside the gap 32..68
  steps(g, 6, { flap: true });                            // 6 * 0.767 px = 4.6 px: right edge 32.4, not yet passed
  assert.equal(g.score, 0);
  steps(g, 2, { flap: true });                            // right edge < 32
  assert.equal(g.score, 1, 'score once the bird passes the right edge');
  steps(g, 30, hover(40));
  assert.equal(g.score, 1, 'only counted once');
  assert.equal(g.dead, false);
});

test('hitting the ground sets dead and freezes the game', () => {
  const g = createFlappy();
  g.rng = () => 0.5;
  for (let i = 0; i < 600 && !g.dead; i++) stepFlappy(g, DT);
  assert.equal(g.dead, true);
  assert.equal(g.bird.y + g.bird.h, g.h - g.groundH, 'bird rests on the ground');
  const snap = JSON.stringify(g);
  stepFlappy(g, DT, { flap: true });
  assert.equal(JSON.stringify(g), snap, 'no state change after dead');
});

test('a pipe in the way kills the bird', () => {
  const g = createFlappy();
  g.nextPipe = Infinity;
  g.pipes.push({ x: 60, gap: 20, passed: false });        // gap 2..38, bird at 50 is below it
  for (let i = 0; i < 300 && !g.dead; i++) stepFlappy(g, DT, hover(48)(g));
  assert.equal(g.dead, true);
  assert.ok(g.pipes[0].x + PIPE_W > g.bird.x && g.pipes[0].x < g.bird.x + g.bird.w, 'died on the pipe, not the ground');
  assert.equal(g.score, 0);
});

test('a deterministic rng gives a reproducible gap', () => {
  const a = createFlappy(); a.rng = () => 0.25;
  const b = createFlappy(); b.rng = () => 0.25;
  stepFlappy(a, DT); stepFlappy(b, DT);
  assert.equal(a.pipes[0].gap, b.pipes[0].gap);
  const lo = GAP / 2 + 6, hi = 100 - 8 - GAP / 2 - 6;
  assert.equal(a.pipes[0].gap, Math.round(lo + 0.25 * (hi - lo)));
  const c = createFlappy(); c.rng = () => 0.9;
  stepFlappy(c, DT);
  assert.notEqual(c.pipes[0].gap, a.pipes[0].gap);
});

test('renderFlappy paints sky first, then ground, pipes and bird', () => {
  const g = createFlappy(); g.rng = () => 0.5;
  stepFlappy(g, DT);
  const calls = [];
  const ctx = { fillStyle: '', fillRect(...a) { calls.push([this.fillStyle, ...a]); } };
  renderFlappy(ctx, g);
  assert.deepEqual(calls[0], ['#72add6', 0, 0, 160, 100], 'sky');
  assert.ok(calls.some((c) => c[0] === '#8ec530' && c[1] === 0 && c[2] === 92 && c[3] === 160 && c[4] === 8), 'ground band');
  assert.ok(calls.some((c) => c[0] === '#f2d21e' && c[3] === 7 && c[4] === 6), 'bird block');
  assert.ok(calls.some((c) => c[0] === '#f28a1e'), 'beak');
  assert.ok(calls.some((c) => c[0] === '#8ec530' && c[3] === PIPE_W - 2), 'pipe body');
});
