// Brick-Breaker on a 160 x 100 logical canvas. All units are logical pixels,
// velocities are pixels per second. `step` has no DOM dependency.
export const COLORS = ['#e0302a', '#f28a1e', '#f2d21e', '#4fc23c', '#2ec4d6', '#9b4fd6'];

export function createGame(w = 160, h = 100) {
  const cols = 10, rows = COLORS.length, gap = 1, brickH = 4;
  const brickW = Math.floor((w - gap * (cols + 1)) / cols);
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({ x: gap + c * (brickW + gap), y: 12 + r * (brickH + gap), w: brickW, h: brickH, color: COLORS[r], alive: true });
    }
  }
  return {
    w, h, bricks,
    paddle: { x: w / 2 - 12, y: h - 8, w: 24, h: 3 },
    ball: { x: w / 2, y: h / 2, vx: 40, vy: -60, r: 1.5 },
    score: 0, lost: 0,
  };
}

export function step(g, dt, input = {}) {
  const p = g.paddle, b = g.ball;
  const manual = input.paddleX != null;
  const target = manual ? input.paddleX : b.x;
  const maxSpeed = manual ? 1000 : 55;           // slow auto-pilot misses sometimes
  const dx = (target - p.w / 2) - p.x;
  p.x += Math.max(-maxSpeed * dt, Math.min(maxSpeed * dt, dx));
  p.x = Math.max(0, Math.min(g.w - p.w, p.x));

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
  if (b.x > g.w - b.r) { b.x = g.w - b.r; b.vx = -Math.abs(b.vx); }
  if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }

  if (b.vy > 0 && b.y + b.r >= p.y && b.y - b.r <= p.y + p.h && b.x >= p.x && b.x <= p.x + p.w) {
    b.y = p.y - b.r;
    b.vy = -Math.abs(b.vy);
    const hit = (b.x - (p.x + p.w / 2)) / (p.w / 2);   // -1 .. 1
    b.vx = 60 * hit + b.vx * 0.3;
  }

  if (b.y > g.h + 2) {
    g.lost += 1;
    b.x = g.w / 2; b.y = g.h / 2;
    b.vx = 40 * (Math.random() < 0.5 ? -1 : 1);
    b.vy = -60;
  }

  for (const k of g.bricks) {
    if (!k.alive) continue;
    if (b.x + b.r > k.x && b.x - b.r < k.x + k.w && b.y + b.r > k.y && b.y - b.r < k.y + k.h) {
      k.alive = false;
      g.score += 10;
      const overlapX = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r));
      const overlapY = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r));
      if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
      break;
    }
  }
  if (g.bricks.every((k) => !k.alive)) g.bricks.forEach((k) => (k.alive = true));
  return g;
}

export function render(ctx, g) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, g.w, g.h);
  for (const k of g.bricks) {
    if (!k.alive) continue;
    ctx.fillStyle = k.color;
    ctx.fillRect(k.x, k.y, k.w, k.h);
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(g.paddle.x), g.paddle.y, g.paddle.w, g.paddle.h);
  ctx.fillRect(Math.round(g.ball.x - g.ball.r), Math.round(g.ball.y - g.ball.r), 3, 3);
}
