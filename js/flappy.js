// Crude pixel Flappy Bird on a 160 x 100 logical canvas. All units are
// logical pixels, velocities pixels per second. `stepFlappy` has no DOM
// dependency; a deterministic `g.rng` (0..1) can replace Math.random in tests.
export const GRAVITY = 260;      // px/s^2
export const FLAP = 92;          // px/s upward impulse
export const SPEED = 46;         // px/s scroll speed
export const PIPE_W = 12;
export const GAP = 36;
export const PIPE_EVERY = 58;    // px of travel between pipes
export const MAX_FALL = 150;     // terminal velocity, keeps a late flap recoverable
const GAP_MARGIN = 6;            // gap centre stays this far from ceiling / ground

export function createFlappy(w = 160, h = 100) {
  return {
    w, h,
    bird: { x: 32, y: h / 2, vy: 0, w: 7, h: 6 },
    pipes: [],                   // { x, gap (centre y), passed }
    score: 0, dead: false,
    t: 0, travel: 0, nextPipe: 0, groundH: 8,
  };
}

function gapCentre(g) {
  const rnd = g.rng || Math.random;
  const lo = GAP / 2 + GAP_MARGIN, hi = g.h - g.groundH - GAP / 2 - GAP_MARGIN;
  return Math.round(lo + rnd() * (hi - lo));
}

const overlaps = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export function stepFlappy(g, dt, input = {}) {
  if (g.dead) return g;
  const b = g.bird;
  if (input.flap === true) b.vy = -FLAP;
  b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * dt);
  b.y += b.vy * dt;
  g.t += dt;
  const dx = SPEED * dt;
  g.travel += dx;
  for (const p of g.pipes) p.x -= dx;
  while (g.travel >= g.nextPipe) {
    g.pipes.push({ x: g.w - (g.travel - g.nextPipe), gap: gapCentre(g), passed: false });
    g.nextPipe += PIPE_EVERY;
  }
  g.pipes = g.pipes.filter((p) => p.x + PIPE_W + 2 > 0);

  const groundY = g.h - g.groundH;
  for (const p of g.pipes) {
    if (!p.passed && p.x + PIPE_W < b.x) { p.passed = true; g.score += 1; }
    const top = p.gap - GAP / 2, bottom = p.gap + GAP / 2;
    if (overlaps(b.x, b.y, b.w, b.h, p.x, 0, PIPE_W, top) ||
        overlaps(b.x, b.y, b.w, b.h, p.x, bottom, PIPE_W, groundY - bottom)) g.dead = true;
  }
  if (b.y + b.h >= groundY) { b.y = groundY - b.h; g.dead = true; }
  if (b.y <= 0) { b.y = 0; if (b.vy < 0) b.vy = 0; }   // the ceiling only stops the bird (forgiving for space-mashers)
  return g;
}

export function renderFlappy(ctx, g) {
  const groundY = g.h - g.groundH;
  ctx.fillStyle = '#72add6';                                   // sky = case blue
  ctx.fillRect(0, 0, g.w, g.h);

  for (const p of g.pipes) {                                   // pipes: green, navy outline, wider cap
    const x = Math.round(p.x);
    const top = Math.round(p.gap - GAP / 2), bottom = Math.round(p.gap + GAP / 2);
    for (const [y0, y1] of [[0, top], [bottom, groundY]]) {
      if (y1 <= y0) continue;
      ctx.fillStyle = '#1c2e5c';
      ctx.fillRect(x, y0, PIPE_W, y1 - y0);
      ctx.fillStyle = '#8ec530';
      ctx.fillRect(x + 1, y0 + 1, PIPE_W - 2, y1 - y0 - 2);
      const capY = y0 === 0 ? y1 - 4 : y0;                     // 4 px cap, 2 px wider, at the gap end
      ctx.fillStyle = '#1c2e5c';
      ctx.fillRect(x - 1, capY, PIPE_W + 2, 4);
      ctx.fillStyle = '#8ec530';
      ctx.fillRect(x, capY + 1, PIPE_W, 2);
    }
  }

  const off = Math.round(g.travel) % 8;                        // ground: striped band that scrolls
  ctx.fillStyle = '#8ec530';
  ctx.fillRect(0, groundY, g.w, g.groundH);
  ctx.fillStyle = '#1c2e5c';
  ctx.fillRect(0, groundY, g.w, 1);
  for (let x = -off; x < g.w; x += 8) ctx.fillRect(x, groundY + 3, 4, 3);

  const b = g.bird, bx = Math.round(b.x), by = Math.round(b.y);   // bird: yellow block, eye, beak
  ctx.fillStyle = '#f2d21e';
  ctx.fillRect(bx, by, b.w, b.h);
  ctx.fillStyle = '#000';
  ctx.fillRect(bx + 5, by + 1, 1, 1);
  ctx.fillStyle = '#f28a1e';
  ctx.fillRect(bx + b.w, by + 3, 2, 2);
}
