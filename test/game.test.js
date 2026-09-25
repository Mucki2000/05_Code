import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, COLORS } from '../js/game.js';

test('a new game has 6 rows of 10 bricks in the six colours', () => {
  const g = createGame(160, 100);
  assert.equal(g.bricks.length, 60);
  assert.ok(g.bricks.every((b) => b.alive));
  assert.deepEqual([...new Set(g.bricks.map((b) => b.color))], COLORS);
  assert.equal(g.score, 0);
});

test('the ball bounces off the top wall', () => {
  const g = createGame(160, 100);
  g.bricks.forEach((b) => (b.alive = false));
  g.ball = { x: 80, y: 2, vx: 0, vy: -60, r: 1.5 };
  step(g, 0.05);
  assert.ok(g.ball.vy > 0);
});

test('hitting a brick removes it and scores 10', () => {
  const g = createGame(160, 100);
  const brick = g.bricks[55]; // bottom row
  g.ball = { x: brick.x + brick.w / 2, y: brick.y + brick.h + 2, vx: 0, vy: -60, r: 1.5 };
  step(g, 0.05);
  assert.equal(brick.alive, false);
  assert.equal(g.score, 10);
  assert.ok(g.ball.vy > 0);
});

test('the paddle moves toward the requested x', () => {
  const g = createGame(160, 100);
  g.paddle.x = 0;
  step(g, 0.1, { paddleX: 150 });
  assert.ok(g.paddle.x > 50);
  assert.ok(g.paddle.x <= g.w - g.paddle.w);
});

test('a lost ball respawns and counts', () => {
  const g = createGame(160, 100);
  g.ball = { x: 80, y: 103, vx: 0, vy: 60, r: 1.5 };
  step(g, 0.05);
  assert.equal(g.lost, 1);
  assert.equal(g.ball.y, 50);
});
