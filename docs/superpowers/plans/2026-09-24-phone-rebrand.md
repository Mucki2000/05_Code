# Phone Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the new Lausebengel site as a green toy phone: power on, Brick-Breaker boot, zoom into the LCD, BlackBerry-style home screen with seven apps holding the existing content.

**Architecture:** One static page under `rebrand/` with a root element whose `data-state` (`off`, `boot`, `zoom`, `home`, `app`) drives visibility through CSS. Pure logic (loading curve, game physics, clock formatting, hash routing, pixel icons) lives in small ES modules tested with `node --test`; `main.js` wires them to the DOM. The old site stays untouched next to it.

**Tech Stack:** Plain HTML, CSS, JavaScript ES modules. Node 24 built-in test runner for logic. Python `http.server` for local preview. Headless Chrome for screenshots. Google Fonts "Press Start 2P" and "VT323".

**Spec:** `docs/superpowers/specs/2026-09-24-phone-rebrand-design.md`

## Global Constraints

- **No git commits during this plan.** The owner commits only after approving the look. Every task ends with a verification step instead of a commit step.
- All new files live under `rebrand/`. Existing files outside it are not modified.
- Asset references use relative paths from `rebrand/`: `../assets/...`, `../Logos/...`.
- Palette: case green `#8ec530`, LCD grey `#c7d2d6`, navy `#1c2e5c`, pink `#e8368f`.
- Phone photo: `rebrand/phone.png` is a copy of `ChatGPT Image 24. Sept. 2026, 14_49_12.png` (1024 x 1536, correct spelling, sharper). LCD area as fractions of the image: left `13.9%`, top `20.7%`, width `71.2%`, height `29.7%`; device aspect ratio `1024 / 1536`. (Superseded the first Higgsfield photo during Task 1 review.)
- Fonts: "Press Start 2P" for labels and headings, "VT323" for body text, both with `monospace` fallback.
- Boot duration 6000 ms, stalls at 64 %. Reduced motion: 1500 ms.
- Local preview: run `python -m http.server 8000` from the repo root, open `http://localhost:8000/rebrand/`. ES modules do not load from `file://`, so always use the server.
- Screenshot helper (used in every task): from the repo root, with `$OUT` the scratchpad directory,

  ```bash
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
    --user-data-dir="$OUT/profile" --virtual-time-budget=8000 --window-size=1440,900 \
    --screenshot="$OUT/<name>.png" "http://localhost:8000/rebrand/?state=<state>"
  ```

  The `?state=` query parameter is a development aid implemented in Task 1 that starts the page in a given state.
- Tests: `node --test "rebrand/test/**/*.test.js"` from the repo root (quoted glob; a bare directory argument fails on Node 24 for Windows). `rebrand/package.json` sets `"type": "module"` so `.js` files are ES modules for Node too, and its `test` script runs the same glob.

---

## File structure

| File | Responsibility |
|------|----------------|
| `rebrand/index.html` | Markup shell: phone, LCD, boot layer, screen with status bar, home grid, app panel, label bar, frame. |
| `rebrand/css/rebrand.css` | All styling and state visibility rules. |
| `rebrand/js/main.js` | DOM wiring: state machine, boot loop, zoom, home grid, app panel, clock, videos, session skip. |
| `rebrand/js/loader.js` | `progressAt(t, duration)` loading curve. |
| `rebrand/js/game.js` | Brick-Breaker: `createGame`, `step`, `render`. DOM-free except `render` which takes a 2D context. |
| `rebrand/js/clock.js` | `formatStatus(date)` for the status bar. |
| `rebrand/js/router.js` | `APP_IDS`, `parseHash(hash)`. |
| `rebrand/js/icons.js` | Pixel-map to SVG converter, seven app icons, power symbol, signal bars. |
| `rebrand/js/apps.js` | Content data and HTML renderers for the seven apps. |
| `rebrand/phone.png` | Copy of the generated phone photo. |
| `rebrand/package.json` | `{"type":"module"}` for Node tests. |
| `rebrand/test/*.test.js` | Node tests for the logic modules. |

---

### Task 1: Scaffold, OFF state, test runner

**Files:**
- Create: `rebrand/package.json`, `rebrand/index.html`, `rebrand/css/rebrand.css`, `rebrand/js/icons.js`, `rebrand/js/main.js`, `rebrand/test/icons.test.js`, `rebrand/phone.png`

**Interfaces:**
- Produces: `icons.js` exports `pixelSvg(rows)`, `ICONS` (object with keys `house, social, clapper, building, reel, briefcase, face`), `POWER`, `SIGNAL`. `main.js` exports nothing; it reads `?state=` and sets `#phone[data-state]`.

- [ ] **Step 1: Copy the photo and create package.json**

```bash
cd "G:/Meine Ablage/Lausebengel/Corporate Identity/Website/Codes"
mkdir -p rebrand/css rebrand/js rebrand/test
cp hf_20260924_122419_bb62371f-a067-4128-a25d-b66a505824ec.png rebrand/phone.png
```

`rebrand/package.json`:

```json
{ "name": "lausebengel-rebrand", "private": true, "type": "module" }
```

- [ ] **Step 2: Write the failing icon test**

`rebrand/test/icons.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { pixelSvg, ICONS, POWER, SIGNAL } from '../js/icons.js';

test('pixelSvg turns a 2x2 map into rects', () => {
  const svg = pixelSvg(['#.', '.g']);
  assert.match(svg, /<svg viewBox="0 0 2 2"/);
  assert.match(svg, /<rect x="0" y="0" width="1" height="1" fill="#1c2e5c"\/>/);
  assert.match(svg, /<rect x="1" y="1" width="1" height="1" fill="#8ec530"\/>/);
  assert.equal((svg.match(/<rect/g) || []).length, 2);
});

test('every app icon is a 16x16 map', () => {
  const keys = ['house', 'social', 'clapper', 'building', 'reel', 'briefcase', 'face'];
  for (const k of keys) {
    assert.ok(ICONS[k], `missing icon ${k}`);
    assert.match(ICONS[k], /viewBox="0 0 16 16"/);
  }
});

test('power and signal symbols exist', () => {
  assert.match(POWER, /viewBox="0 0 16 16"/);
  assert.match(SIGNAL, /<svg/);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test "rebrand/test/**/*.test.js"`
Expected: FAIL, cannot find module `../js/icons.js`.

- [ ] **Step 4: Write icons.js**

`rebrand/js/icons.js`:

```js
// Pixel maps: one string per row, one character per pixel.
// '.' is transparent; other characters look up PALETTE.
export const PALETTE = {
  '#': '#1c2e5c', // navy
  'r': '#e0302a', // red
  'y': '#f2d21e', // yellow
  'g': '#8ec530', // case green
  'w': '#ffffff',
  'b': '#2e6fd6', // blue
  'o': '#f28a1e', // orange
  'k': '#000000',
  'p': '#e8368f', // pink
  's': '#9aa8b0', // grey
};

export function pixelSvg(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  let out = '';
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = PALETTE[ch];
      if (ch !== '.' && fill) out += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    });
  });
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
}

const MAPS = {
  house: [
    '................',
    '.......##.......',
    '......#rr#......',
    '.....#rrrr#.....',
    '....#rrrrrr#....',
    '...#rrrrrrrr#...',
    '..#rrrrrrrrrr#..',
    '.##############.',
    '.#yyyyyyyyyyyy#.',
    '.#yybbyyyyybby#.',
    '.#yybbyyy##ybby#',
    '.#yyyyyyy##yyy#.',
    '.#yyyyyyy##yyy#.',
    '.#yyyyyyy##yyy#.',
    '.##############.',
    '................',
  ],
  social: [
    '................',
    '.....######.....',
    '....#ssssss#....',
    '....#wwwwww#....',
    '....#wwwwww#....',
    '....#wrwwww#....',
    '....#wrrwww#....',
    '....#wrrrww#....',
    '....#wrrwww#....',
    '....#wrwwww#....',
    '....#wwwwww#....',
    '....#wwwwww#....',
    '....#ssssss#....',
    '....#ss##ss#....',
    '.....######.....',
    '................',
  ],
  clapper: [
    '................',
    '.##############.',
    '.#w#w#w#w#w#w##.',
    '.##w#w#w#w#w#w#.',
    '.##############.',
    '.#kkkkkkkkkkkk#.',
    '.#kkkkkkkkkkkk#.',
    '.#kkwwwwwwwwkk#.',
    '.#kkwkkkkkkwkk#.',
    '.#kkwkkkkkkwkk#.',
    '.#kkwwwwwwwwkk#.',
    '.#kkkkkkkkkkkk#.',
    '.#kkkkkkkkkkkk#.',
    '.##############.',
    '................',
    '................',
  ],
  building: [
    '................',
    '....########....',
    '....#ssssss#....',
    '....#sysyys#....',
    '....#ssssss#....',
    '....#sysyys#....',
    '....#ssssss#....',
    '.####sysyys####.',
    '.#ss#ssssss#ss#.',
    '.#ys#sysyys#ys#.',
    '.#ss#ssssss#ss#.',
    '.#ys#sysyys#ys#.',
    '.#ss#ss##ss#ss#.',
    '.#ss#ss##ss#ss#.',
    '.##############.',
    '................',
  ],
  reel: [
    '................',
    '.....######.....',
    '....##ssss##....',
    '...#ss#ww#ss#...',
    '..#ss##ww##ss#..',
    '..#s#s####s#s#..',
    '.#ss#ww##ww#ss#.',
    '.#s##ww##ww##s#.',
    '.#s##ww##ww##s#.',
    '.#ss#ww##ww#ss#.',
    '..#s#s####s#s#..',
    '..#ss##ww##ss#..',
    '...#ss#ww#ss#...',
    '....##ssss##....',
    '.....######.....',
    '................',
  ],
  briefcase: [
    '................',
    '................',
    '.....######.....',
    '.....#....#.....',
    '.##############.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.##############.',
    '.#oooooo##oooo#.',
    '.#oooooo##oooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.##############.',
    '................',
    '................',
  ],
  face: [
    '................',
    '.....######.....',
    '...##yyyyyy##...',
    '..#yyyyyyyyyy#..',
    '.#yyyyyyyyyyyy#.',
    '.#yy##yyyy##yy#.',
    '.#yy##yyyy##yy#.',
    '.#yyyyyyyyyyyy#.',
    '.#yyyyyyyyyyyy#.',
    '.#yy#yyyyyy#yy#.',
    '.#yyy##yy##yyy#.',
    '..#yyyy####yy#..',
    '...##yyyyyy##...',
    '.....######.....',
    '................',
    '................',
  ],
};

export const ICONS = Object.fromEntries(
  Object.entries(MAPS).map(([k, rows]) => [k, pixelSvg(rows)])
);

export const POWER = pixelSvg([
  '................',
  '.......gg.......',
  '....g..gg..g....',
  '...g...gg...g...',
  '..g....gg....g..',
  '..g....gg....g..',
  '.g.....gg.....g.',
  '.g.....gg.....g.',
  '.g............g.',
  '.g............g.',
  '..g..........g..',
  '..g..........g..',
  '...g........g...',
  '....gg....gg....',
  '......gggg......',
  '................',
]);

export const SIGNAL =
  '<svg viewBox="0 0 9 6" shape-rendering="crispEdges" aria-hidden="true">' +
  '<rect x="0" y="4" width="1" height="2" fill="currentColor"/>' +
  '<rect x="2" y="3" width="1" height="3" fill="currentColor"/>' +
  '<rect x="4" y="2" width="1" height="4" fill="currentColor"/>' +
  '<rect x="6" y="1" width="1" height="5" fill="currentColor"/>' +
  '<rect x="8" y="0" width="1" height="6" fill="currentColor"/>' +
  '</svg>';
```

Note: the `house` map row 10 has 16 characters ending in `#` on purpose so the right wall stays closed; check every row is exactly 16 characters when editing maps.

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test "rebrand/test/**/*.test.js"`
Expected: 3 passing.

- [ ] **Step 6: Write index.html**

`rebrand/index.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lausebengel</title>
  <meta name="description" content="Lausebengel — Production & high-end editing studio." />
  <link rel="icon" type="image/png" href="../Logos/Lausebengel_transparent.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/rebrand.css" />
</head>
<body>
  <div id="phone" data-state="off">
    <div class="phone__stage" id="stage">
      <div class="phone__device">
        <img class="phone__img" id="photo" src="phone.png" alt="" draggable="false" />
        <div class="lcd" id="lcd">
          <button class="power" id="power" type="button" aria-label="Handy einschalten"></button>

          <div class="boot" id="boot">
            <canvas id="game" width="160" height="100"></canvas>
            <div class="boot__hud">
              <span id="score">SCORE 0</span>
              <span id="pct">0%</span>
            </div>
            <button class="boot__bar" id="skip" type="button" aria-label="Laden überspringen">
              <span class="boot__fill" id="fill"></span>
            </button>
          </div>

          <div class="screen" id="screen">
            <header class="status">
              <span class="status__brand">LAUSEBENGEL</span>
              <span class="status__clock" id="clock"></span>
              <span class="status__signal" id="signal">GPRS</span>
            </header>
            <div class="body">
              <main class="home" id="home" aria-label="Apps"></main>
              <section class="app" id="app" hidden></section>
            </div>
            <footer class="label" id="label"></footer>
          </div>
        </div>
      </div>
    </div>
    <div class="frame" aria-hidden="true">
      <img class="frame__mark" src="../assets/lausebengel-logo.png" alt="" />
    </div>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 7: Write the CSS for the OFF state and the state rules**

`rebrand/css/rebrand.css`:

```css
/* ============ TOKENS ============ */
:root {
  --green: #8ec530;
  --lcd: #c7d2d6;
  --navy: #1c2e5c;
  --pink: #e8368f;
  --lcd-left: 19.8%;
  --lcd-top: 17.5%;
  --lcd-w: 60.8%;
  --lcd-h: 30.8%;
  --frame: clamp(6px, 1.2vw, 14px);
  --pixel: "Press Start 2P", monospace;
  --body: "VT323", monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; background: #000; color: var(--navy); font-family: var(--body); }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
img { display: block; max-width: 100%; }
a { color: inherit; }

/* ============ PHONE (OFF / BOOT / ZOOM) ============ */
#phone { position: fixed; inset: 0; overflow: hidden; }
.phone__stage {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  transform-origin: 50% 50%;
  transition: transform 900ms cubic-bezier(0.65, 0, 0.35, 1), opacity 150ms linear;
}
.phone__device {
  position: relative;
  width: min(94vw, calc(92vh * 688 / 1024));
  aspect-ratio: 688 / 1024;
  background: var(--green);
  border-radius: 9% / 6%;
}
.phone__img { width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none; }
.no-photo .phone__img { display: none; }
.lcd {
  position: absolute;
  left: var(--lcd-left); top: var(--lcd-top);
  width: var(--lcd-w); height: var(--lcd-h);
  background: #000;
  overflow: hidden;
  container-type: inline-size;
}
.lcd::after {
  content: ""; position: absolute; inset: 0; z-index: 5; pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 3px 3px;
}

/* Power button */
.power {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  color: var(--green);
}
.power svg {
  width: 22%; height: auto;
  filter: drop-shadow(0 0 6px var(--green)) drop-shadow(0 0 14px rgba(142, 197, 48, 0.6));
  animation: pulse 2.4s ease-in-out infinite;
}
.power:hover svg, .power:focus-visible svg { animation-duration: 0.9s; }
@keyframes pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

/* Boot */
.boot { position: absolute; inset: 0; background: #000; }
#game { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
.boot__hud {
  position: absolute; top: 3%; left: 3%; right: 3%;
  display: flex; justify-content: space-between;
  color: #fff; font-family: var(--pixel); font-size: clamp(6px, 0.9vw, 10px);
  pointer-events: none;
}
.boot__bar {
  position: absolute; left: 0; right: 0; bottom: 0; height: 5%;
  background: #222; padding: 0;
}
.boot__fill { display: block; height: 100%; width: 0; background: var(--green); }

/* Screen (HOME / APP) */
.screen {
  position: absolute; inset: 0;
  background: var(--lcd);
  display: flex; flex-direction: column;
}
.status {
  display: flex; justify-content: space-between; align-items: center; gap: 1em;
  background: var(--navy); color: var(--lcd);
  font-family: var(--pixel); font-size: min(1cqw, 12px);
  padding: 0.7em 1em;
}
.status__signal { display: inline-flex; align-items: center; gap: 0.6em; }
.status__signal svg { height: 1em; width: auto; }
.body { position: relative; flex: 1; overflow: hidden; }
.label {
  font-family: var(--pixel); font-size: min(1cqw, 12px);
  text-align: center; padding: 0.8em; border-top: 2px solid var(--navy);
  min-height: 2.6em;
}

/* ============ STATE VISIBILITY ============ */
[data-state="off"] .boot, [data-state="off"] .screen { display: none; }
[data-state="boot"] .power, [data-state="boot"] .screen { display: none; }
[data-state="zoom"] .power, [data-state="zoom"] .boot { display: none; }
[data-state="home"] .power, [data-state="home"] .boot,
[data-state="app"] .power, [data-state="app"] .boot { display: none; }

/* Inside the phone: the LCD is the viewport, framed in case green. */
.frame { display: none; }
[data-state="home"] .phone__img, [data-state="app"] .phone__img { display: none; }
[data-state="home"] .phone__device, [data-state="app"] .phone__device { background: none; }
[data-state="home"] .phone__stage, [data-state="app"] .phone__stage { transform: none !important; transition: none; }
[data-state="home"] .lcd, [data-state="app"] .lcd {
  position: fixed;
  left: var(--frame); right: var(--frame); top: var(--frame);
  bottom: calc(var(--frame) * 3);
  width: auto; height: auto;
  background: var(--lcd);
}
[data-state="home"] .frame, [data-state="app"] .frame {
  display: block; position: fixed; inset: 0; z-index: 10; pointer-events: none;
  border: var(--frame) solid var(--green);
  border-bottom-width: calc(var(--frame) * 3);
}
.frame__mark {
  position: absolute; left: 50%; bottom: calc(var(--frame) * -3);
  height: calc(var(--frame) * 2.2); width: auto;
  transform: translateX(-50%);
  mix-blend-mode: screen;
}
[data-state="home"] .screen, [data-state="app"] .screen { animation: fade-in 200ms ease-out; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
```

- [ ] **Step 8: Write the minimal main.js for the OFF state and the state query parameter**

`rebrand/js/main.js`:

```js
import { POWER, SIGNAL } from './icons.js';

const phone = document.getElementById('phone');
const photo = document.getElementById('photo');
const power = document.getElementById('power');
const signal = document.getElementById('signal');

export const STATES = ['off', 'boot', 'zoom', 'home', 'app'];

function setState(s) { phone.dataset.state = s; }

power.innerHTML = POWER;
signal.insertAdjacentHTML('afterbegin', SIGNAL);
photo.addEventListener('error', () => phone.classList.add('no-photo'));

// Development aid: ?state=boot|home starts the page in that state.
const requested = new URLSearchParams(location.search).get('state');
setState(STATES.includes(requested) ? requested : 'off');
```

- [ ] **Step 9: Start the local server and take the OFF screenshot**

Start the server once, in the background, from the repo root:

```bash
python -m http.server 8000
```

Screenshot:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$OUT/profile" --virtual-time-budget=3000 --window-size=1440,900 \
  --screenshot="$OUT/off.png" "http://localhost:8000/rebrand/"
```

Expected: black page, green phone centred, black LCD with a pulsing green pixel power symbol in the middle of the LCD, no seam between the LCD element and the photo's screen edge. Open the PNG and check the power symbol sits in the screen, not on the case. If it is offset, adjust the four `--lcd-*` tokens.

Also confirm the state attribute:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$OUT/profile" \
  --virtual-time-budget=3000 --dump-dom "http://localhost:8000/rebrand/?state=boot" | grep -o 'data-state="[a-z]*"'
```

Expected: `data-state="boot"`.

---

### Task 2: Loading curve, Brick-Breaker, BOOT state

**Files:**
- Create: `rebrand/js/loader.js`, `rebrand/js/game.js`, `rebrand/test/loader.test.js`, `rebrand/test/game.test.js`
- Modify: `rebrand/js/main.js`

**Interfaces:**
- Produces: `progressAt(tMs, durationMs = 6000) -> integer 0..100`; `createGame(w = 160, h = 100) -> game`; `step(game, dtSeconds, input = { paddleX? }) -> game`; `render(ctx, game)`.
- `main.js` gains `startBoot()` and calls `zoomIn()` (a stub in this task, implemented in Task 3).

- [ ] **Step 1: Write the failing loader test**

`rebrand/test/loader.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { progressAt } from '../js/loader.js';

test('starts at 0 and ends at 100', () => {
  assert.equal(progressAt(0), 0);
  assert.equal(progressAt(-5), 0);
  assert.equal(progressAt(6000), 100);
  assert.equal(progressAt(9000), 100);
});

test('stalls at 64 between 55% and 70% of the duration', () => {
  assert.equal(progressAt(3300), 64);
  assert.equal(progressAt(3800), 64);
  assert.equal(progressAt(4200), 64);
});

test('is monotonic', () => {
  let prev = -1;
  for (let t = 0; t <= 6000; t += 50) {
    const p = progressAt(t);
    assert.ok(p >= prev, `dropped at ${t}`);
    prev = p;
  }
});

test('respects a custom duration', () => {
  assert.equal(progressAt(1500, 1500), 100);
  assert.equal(progressAt(900, 1500), 64);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test rebrand/test/loader.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write loader.js**

`rebrand/js/loader.js`:

```js
// Loading progress in percent for a boot that lasts `duration` ms.
// Fast to 64 %, a short stall (a nod to the original screen mock-up),
// then the rest.
export function progressAt(t, duration = 6000) {
  if (t <= 0) return 0;
  if (t >= duration) return 100;
  const x = t / duration;
  if (x < 0.55) return Math.round(64 * (x / 0.55));
  if (x < 0.70) return 64;
  return Math.round(64 + 36 * ((x - 0.70) / 0.30));
}
```

- [ ] **Step 4: Run the loader test to verify it passes**

Run: `node --test rebrand/test/loader.test.js`
Expected: 4 passing.

- [ ] **Step 5: Write the failing game test**

`rebrand/test/game.test.js`:

```js
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
```

- [ ] **Step 6: Run the game test to verify it fails**

Run: `node --test rebrand/test/game.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 7: Write game.js**

`rebrand/js/game.js`:

```js
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
```

- [ ] **Step 8: Run the game test to verify it passes**

Run: `node --test "rebrand/test/**/*.test.js"`
Expected: all passing (icons 3, loader 4, game 5).

- [ ] **Step 9: Wire the BOOT state in main.js**

Replace `rebrand/js/main.js` with:

```js
import { POWER, SIGNAL } from './icons.js';
import { progressAt } from './loader.js';
import { createGame, step, render } from './game.js';

const $ = (id) => document.getElementById(id);
const phone = $('phone'), stage = $('stage'), photo = $('photo'), lcd = $('lcd');
const power = $('power'), signal = $('signal');
const canvas = $('game'), fill = $('fill'), pct = $('pct'), score = $('score'), skip = $('skip');

export const STATES = ['off', 'boot', 'zoom', 'home', 'app'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BOOT_MS = reduced ? 1500 : 6000;

function setState(s) { phone.dataset.state = s; }

/* ---------- OFF ---------- */
power.innerHTML = POWER;
signal.insertAdjacentHTML('afterbegin', SIGNAL);
photo.addEventListener('error', () => phone.classList.add('no-photo'));
power.addEventListener('click', startBoot);

/* ---------- BOOT ---------- */
function startBoot() {
  setState('boot');
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  const g = createGame(canvas.width, canvas.height);
  const input = {};
  const start = performance.now();
  let last = start;
  let skipped = false;

  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    input.paddleX = ((e.clientX - r.left) / r.width) * g.w;
  };
  const onKey = (e) => {
    const cur = input.paddleX ?? g.paddle.x + g.paddle.w / 2;
    if (e.key === 'ArrowLeft') input.paddleX = Math.max(0, cur - 8);
    else if (e.key === 'ArrowRight') input.paddleX = Math.min(g.w, cur + 8);
    else if (e.key === 'Escape') skipped = true;
  };
  const cleanup = () => {
    lcd.removeEventListener('pointermove', onMove);
    window.removeEventListener('keydown', onKey);
    skip.removeEventListener('click', onSkip);
  };
  const onSkip = () => { skipped = true; };
  lcd.addEventListener('pointermove', onMove);
  window.addEventListener('keydown', onKey);
  skip.addEventListener('click', onSkip);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (ctx) { step(g, dt, input); render(ctx, g); }
    const p = skipped ? 100 : progressAt(now - start, BOOT_MS);
    fill.style.width = p + '%';
    pct.textContent = p + '%';
    score.textContent = 'SCORE ' + g.score;
    if (p >= 100) { cleanup(); setTimeout(zoomIn, 300); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- ZOOM (implemented in Task 3) ---------- */
function zoomIn() { setState('home'); }

/* ---------- START ---------- */
const requested = new URLSearchParams(location.search).get('state');
if (requested === 'boot') startBoot();
else setState(STATES.includes(requested) ? requested : 'off');
```

- [ ] **Step 10: Screenshot the BOOT state**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$OUT/profile" --virtual-time-budget=2500 --window-size=1440,900 \
  --screenshot="$OUT/boot.png" "http://localhost:8000/rebrand/?state=boot"
```

Expected: the LCD shows six coloured brick rows, a white paddle and ball, "SCORE n" top left, a percentage top right, and a green bar partly filled along the bottom edge. Pixels look chunky, not blurred.

Then confirm the boot ends by itself:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$OUT/profile" \
  --virtual-time-budget=9000 --dump-dom "http://localhost:8000/rebrand/?state=boot" | grep -o 'data-state="[a-z]*"'
```

Expected: `data-state="home"`.

---

### Task 3: Zoom, inside frame, clock, home grid

**Files:**
- Create: `rebrand/js/clock.js`, `rebrand/test/clock.test.js`
- Modify: `rebrand/js/main.js`, `rebrand/css/rebrand.css`

**Interfaces:**
- Consumes: `ICONS` from `icons.js`.
- Produces: `formatStatus(date) -> { date: 'THU, SEP 24', time: '14:05' }`; in `main.js`: `renderHome()`, `select(index)`, `zoomIn()`, `enterInside()`. The home grid is built from a local `APP_LIST` array `{ id, label, icon }` that Task 4 replaces with `APPS` from `apps.js`.

- [ ] **Step 1: Write the failing clock test**

`rebrand/test/clock.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test rebrand/test/clock.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write clock.js**

`rebrand/js/clock.js`:

```js
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatStatus(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`,
    time: `${hh}:${mm}`,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test "rebrand/test/**/*.test.js"`
Expected: all passing.

- [ ] **Step 5: Add the home grid CSS**

(Sizes use container-query units relative to `.lcd`, which is an inline-size container, so the home screen renders as a correct miniature inside the small LCD during the zoom. Ruled during Task 3 review.)

Append to `rebrand/css/rebrand.css`:

```css
/* ============ HOME GRID ============ */
.home {
  position: absolute; inset: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  align-content: center;
  gap: min(1.5cqw, 24px) min(1cqw, 16px);
  padding: min(2cqw, 30px);
}
.icon {
  grid-column: span 2;
  display: flex; flex-direction: column; align-items: center; gap: 0.9em;
  padding: 0.8em 0.4em;
  border: 2px solid transparent;
  font-family: var(--pixel); font-size: min(0.85cqw, 11px);
  min-width: 0;
  color: var(--navy); text-transform: uppercase;
}
.icon:nth-child(5) { grid-column: 2 / span 2; }
.icon:nth-child(6) { grid-column: 4 / span 2; }
.icon:nth-child(7) { grid-column: 6 / span 2; }
.icon svg { width: min(6cqw, 72px); height: auto; }
.icon.is-selected { border-color: var(--navy); }
.icon:hover { border-color: var(--green); }
.icon:focus-visible { outline: 2px dashed var(--navy); outline-offset: 2px; }
```

- [ ] **Step 6: Implement zoom, inside layout, clock and home grid in main.js**

In `rebrand/js/main.js`, replace the import block, the zoom stub and the start block with the following (keep the BOOT section from Task 2 unchanged):

```js
import { POWER, SIGNAL, ICONS } from './icons.js';
import { progressAt } from './loader.js';
import { createGame, step, render } from './game.js';
import { formatStatus } from './clock.js';

const $ = (id) => document.getElementById(id);
const phone = $('phone'), stage = $('stage'), photo = $('photo'), lcd = $('lcd');
const power = $('power'), signal = $('signal'), clock = $('clock');
const canvas = $('game'), fill = $('fill'), pct = $('pct'), score = $('score'), skip = $('skip');
const home = $('home'), label = $('label');

export const STATES = ['off', 'boot', 'zoom', 'home', 'app'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BOOT_MS = reduced ? 1500 : 6000;

// Replaced by APPS from apps.js in Task 4.
const APP_LIST = [
  { id: 'home', label: 'HOME', icon: 'house' },
  { id: 'social', label: 'SOCIAL', icon: 'social' },
  { id: 'filme', label: 'FILME', icon: 'clapper' },
  { id: 'unternehmen', label: 'UNTERNEHMEN', icon: 'building' },
  { id: 'work', label: 'WORK', icon: 'reel' },
  { id: 'career', label: 'CAREER', icon: 'briefcase' },
  { id: 'about', label: 'ABOUT', icon: 'face' },
];

function setState(s) { phone.dataset.state = s; }
```

Then after the BOOT section:

```js
/* ---------- ZOOM ---------- */
function zoomIn() {
  renderHome();
  setState('zoom');
  if (reduced) {
    stage.style.opacity = '0';
    setTimeout(enterInside, 150);
    return;
  }
  const r = lcd.getBoundingClientRect();
  const vw = innerWidth, vh = innerHeight;
  const scale = Math.max(vw / r.width, vh / r.height);
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const tx = -scale * (cx - vw / 2), ty = -scale * (cy - vh / 2);
  let done = false;
  const finish = () => { if (done) return; done = true; enterInside(); };
  stage.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 1100);                       // fallback if the event never fires
  requestAnimationFrame(() => { stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; });
}

function enterInside() {
  stage.style.transform = '';
  stage.style.opacity = '';
  try { sessionStorage.setItem('lb-booted', '1'); } catch (_) { /* private mode */ }
  setState('home');
  select(0);
}

/* ---------- HOME ---------- */
let selected = 0;
let icons = [];

function renderHome() {
  home.innerHTML = APP_LIST.map((a, i) =>
    `<button class="icon" type="button" data-app="${a.id}" data-index="${i}">${ICONS[a.icon]}<span>${a.label}</span></button>`
  ).join('');
  icons = [...home.querySelectorAll('.icon')];
  icons.forEach((el) => {
    el.addEventListener('pointerenter', () => select(+el.dataset.index));
    el.addEventListener('focus', () => select(+el.dataset.index));
    el.addEventListener('click', () => openApp(el.dataset.app));
  });
}

function select(i) {
  selected = Math.max(0, Math.min(APP_LIST.length - 1, i));
  icons.forEach((el, j) => el.classList.toggle('is-selected', j === selected));
  label.textContent = APP_LIST[selected].label;
}

// Grid is 4 + 3: index 0-3 top row, 4-6 bottom row.
window.addEventListener('keydown', (e) => {
  if (phone.dataset.state !== 'home') return;
  if (e.key === 'ArrowRight') select(selected + 1);
  else if (e.key === 'ArrowLeft') select(selected - 1);
  else if (e.key === 'ArrowDown') select(selected < 4 ? Math.min(selected + 4, 6) : selected);
  else if (e.key === 'ArrowUp') select(selected >= 4 ? selected - 4 : selected);
  else if (e.key === 'Enter') openApp(APP_LIST[selected].id);
  else return;
  e.preventDefault();
});

// Implemented in Task 4.
function openApp(id) { console.log('open', id); }

/* ---------- CLOCK ---------- */
function tickClock() {
  const { date, time } = formatStatus(new Date());
  clock.innerHTML = `<span class="status__date">${date}</span> ${time}`;
}
tickClock();
setInterval(tickClock, 30000);

/* ---------- START ---------- */
const requested = new URLSearchParams(location.search).get('state');
if (requested === 'boot') startBoot();
else if (requested === 'zoom') { setState('boot'); setTimeout(zoomIn, 50); }
else if (requested === 'home') { renderHome(); setState('home'); select(0); }
else setState('off');
```

- [ ] **Step 7: Screenshot HOME**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$OUT/profile" --virtual-time-budget=3000 --window-size=1440,900 \
  --screenshot="$OUT/home.png" "http://localhost:8000/rebrand/?state=home"
```

Expected: green frame around the viewport with the wordmark in the thicker bottom edge, LCD grey fill, navy status bar with "LAUSEBENGEL", today's date and time, signal bars and "GPRS". Seven pixel icons, four on top and three centred below, first framed in navy. Bottom label reads "HOME". Faint pixel grid visible over the LCD.

Then check the zoom path ends inside:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$OUT/profile" \
  --virtual-time-budget=3000 --dump-dom "http://localhost:8000/rebrand/?state=zoom" | grep -o 'data-state="[a-z]*"\|class="icon is-selected"' | head -3
```

Expected: `data-state="home"` and one `class="icon is-selected"`.

Take a mid-zoom screenshot for the owner review at `--virtual-time-budget=500` on `?state=zoom` and confirm the phone is enlarged with the LCD moving toward the viewport centre.

---

### Task 4: Router, app content, app panel, videos, session skip

**Files:**
- Create: `rebrand/js/router.js`, `rebrand/js/apps.js`, `rebrand/test/router.test.js`, `rebrand/test/apps.test.js`
- Modify: `rebrand/js/main.js`, `rebrand/css/rebrand.css`

**Interfaces:**
- Produces: `APP_IDS`, `parseHash(hash) -> id | null`; `APPS` array of `{ id, label, icon, render() -> html string }`; `PROJECTS`, `CREW` data.
- `main.js`: `openApp(id)` sets `location.hash`; `showApp(id | null)` renders or closes the panel; `initVideos(root)`.

- [ ] **Step 1: Write the failing router test**

`rebrand/test/router.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_IDS, parseHash } from '../js/router.js';

test('lists the seven apps in home-screen order', () => {
  assert.deepEqual(APP_IDS, ['home', 'social', 'filme', 'unternehmen', 'work', 'career', 'about']);
});

test('parses known hashes case-insensitively and rejects the rest', () => {
  assert.equal(parseHash('#filme'), 'filme');
  assert.equal(parseHash('#FILME'), 'filme');
  assert.equal(parseHash('#about'), 'about');
  assert.equal(parseHash('#nope'), null);
  assert.equal(parseHash(''), null);
  assert.equal(parseHash(undefined), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test rebrand/test/router.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Write router.js**

`rebrand/js/router.js`:

```js
export const APP_IDS = ['home', 'social', 'filme', 'unternehmen', 'work', 'career', 'about'];

export function parseHash(hash) {
  const id = String(hash || '').replace(/^#/, '').toLowerCase();
  return APP_IDS.includes(id) ? id : null;
}
```

- [ ] **Step 4: Run the router test to verify it passes**

Run: `node --test rebrand/test/router.test.js`
Expected: 2 passing.

- [ ] **Step 5: Write the failing apps test**

`rebrand/test/apps.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { APPS, PROJECTS, CREW } from '../js/apps.js';
import { APP_IDS } from '../js/router.js';
import { ICONS } from '../js/icons.js';

test('APPS matches the router order and uses existing icons', () => {
  assert.deepEqual(APPS.map((a) => a.id), APP_IDS);
  for (const a of APPS) {
    assert.ok(ICONS[a.icon], `icon ${a.icon} for ${a.id}`);
    assert.equal(typeof a.render, 'function');
    assert.ok(a.render().length > 20, `${a.id} renders something`);
  }
});

test('project tiles reference assets relative to rebrand/', () => {
  for (const [id, p] of Object.entries(PROJECTS)) {
    assert.ok(p.title && p.client, id);
    assert.ok((p.still || p.video || '').startsWith('../assets/projects/'), id);
  }
});

test('WORK lists Ailiens first, ABOUT renders six crew members', () => {
  const work = APPS.find((a) => a.id === 'work').render();
  assert.ok(work.indexOf('Ailiens in Lebin') < work.indexOf('Backrooms'));
  assert.equal(CREW.length, 6);
  const about = APPS.find((a) => a.id === 'about').render();
  assert.equal((about.match(/class="crew__member"/g) || []).length, 6);
});
```

- [ ] **Step 6: Run the apps test to verify it fails**

Run: `node --test rebrand/test/apps.test.js`
Expected: FAIL, cannot find module.

- [ ] **Step 7: Write apps.js**

`rebrand/js/apps.js`:

```js
const P = '../assets/projects/';
const A = '../assets/';
const L = '../Logos/';

export const PROJECTS = {
  ailiens:   { title: 'Ailiens in Lebin', client: 'Constantin Film · Social Media Production', still: P + 'Ailiens%20in%20Lebin.jpg' },
  backrooms: { title: 'Backrooms', client: 'A24 · German Market Social Media Campaign', still: P + 'Backrooms.jpg', portrait: true },
  fifa:      { title: 'FIFA Opening Banquet', client: 'FIFA · Social Media', still: P + 'FIFA%20Opening%20Banquet.avif' },
  denoche:   { title: 'De Noche', client: 'mk2 Films · Social Media Production', still: P + 'mk2%20social%20media%20campaign.webp' },
  euphorie:  { title: 'Euphorie', client: 'RTL+ · Social Media and Content Production', still: P + 'Euphorie_RTL%2B.jpeg' },
  prime:     { title: 'Gerry Star', client: 'Amazon Prime · Social Media', video: P + 'Amazon_Prime_Website.mp4' },
  universal: { title: 'Universal Music', client: 'Music', still: P + 'Universal.jpeg' },
  koechert:  { title: 'A.E. Köchert', client: 'Brand', video: P + 'A.E.Koechert_Website.mp4' },
  boris:     { title: 'Boris Brejcha', client: 'Music', still: P + 'Boris.jpeg' },
  audi:      { title: 'Audi Sport', client: 'Social Media', video: P + 'Audi_Sport_Website.mp4' },
  kleine:    { title: 'Kleine Brüder', client: 'Short Form', video: P + 'Michael%20Short%20%28KF%29_KLEINE_DA.mp4' },
};

export const CREW = [
  { name: 'Damian Aschenbrenner', photo: A + 'Damian.jpeg', tag: A + 'projects/STICKERS/Damian_Tag_Neu.png' },
  { name: 'Mucki Trauttmansdorff', photo: A + 'photo_5846211468326538391_y.jpg', tag: A + 'projects/STICKERS/Mucki_Tag_NEU.png' },
  { name: 'Maksim Farkas', photo: A + 'Maksim%20Farkas.jpeg', tag: A + 'projects/STICKERS/Maksim_Tag.png' },
  { name: 'Eline Maret', photo: A + 'Eline%20Maret.jpeg', tag: A + 'projects/STICKERS/Eline_Tag.png' },
  { name: 'Arved Friese', photo: A + 'Arved%20Friese%20Neu.jpeg', tag: A + 'projects/STICKERS/Arved_Tag.png' },
  { name: 'Marie Fürstenberg', photo: A + 'Marie%20F%C3%BCrstenberg.jpeg', tag: A + 'projects/STICKERS/Marie.png' },
];

const LOGOS = [
  { src: L + 'Universal-Logo-1997.png', alt: 'Universal' },
  { src: L + 'prime-video-horizontal-logo-white-dec-2024.png', alt: 'Prime Video' },
  { src: L + 'constantin_film.jpg', alt: 'Constantin Film' },
  { src: L + 'mk2-films.png', alt: 'mk2 Films' },
  { src: L + 'FIFA.png', alt: 'FIFA' },
  { src: L + 'Kleine%20br%C3%BCder.jpg', alt: 'Kleine Brüder' },
];

const TAGLINE = 'Lausebengel is a production and high-end editing studio built by and for a new generation of filmmakers. Rooted in a distinctly Gen&nbsp;Z sensibility, we champion original voices and ambitious stories built to travel.';
const KICKER = 'On-Set Content Production. Social Media Strategy. Editing.';
const EMAIL = 'info@lausebengel.studio';

function tile(id) {
  const p = PROJECTS[id];
  const media = p.video
    ? `<div class="tile__media${p.portrait ? ' is-portrait' : ''}" data-video="${p.video}"><span class="tile__placeholder">${p.title}</span></div>`
    : `<div class="tile__media${p.portrait ? ' is-portrait' : ''}"><img src="${p.still}" alt="${p.title}" loading="lazy" /></div>`;
  return `<li class="tile" id="p-${id}">${media}<p class="tile__client">${p.client}</p><h3 class="tile__title">${p.title}</h3></li>`;
}
const tiles = (ids) => `<ul class="tiles">${ids.map(tile).join('')}</ul>`;

const intro = (text) => `<p class="intro">${text}</p>`;

export const APPS = [
  {
    id: 'home', label: 'HOME', icon: 'house',
    render: () => `
      <div class="landing">
        <img class="landing__mark" src="${A}lausebengel-logo.png" alt="Lausebengel" />
        <p class="landing__kicker">${KICKER}</p>
        <p class="landing__body">${TAGLINE}</p>
        <ul class="logos">${LOGOS.map((l) => `<li><img src="${l.src}" alt="${l.alt}" loading="lazy" /></li>`).join('')}</ul>
      </div>`,
  },
  {
    id: 'social', label: 'SOCIAL', icon: 'social',
    render: () => intro('Social media production for brands, artists and events.') + tiles(['fifa', 'audi', 'universal', 'boris']),
  },
  {
    id: 'filme', label: 'FILME', icon: 'clapper',
    render: () => intro('Film campaigns and content for cinema and streaming.') + tiles(['ailiens', 'denoche', 'euphorie', 'prime', 'kleine', 'backrooms']),
  },
  {
    id: 'unternehmen', label: 'UNTERNEHMEN', icon: 'building',
    render: () => intro('Corporate content and brand films.') + tiles(['koechert']),
  },
  {
    id: 'work', label: 'WORK', icon: 'reel',
    render: () => intro('Current projects.') + tiles(['ailiens', 'backrooms', 'fifa']),
  },
  {
    id: 'career', label: 'CAREER', icon: 'briefcase',
    render: () => `
      <div class="text">
        <p>We are a small crew and always curious about new people who love film, editing and social media.</p>
        <p>Write to us: <a href="mailto:${EMAIL}">${EMAIL}</a></p>
      </div>`,
  },
  {
    id: 'about', label: 'ABOUT', icon: 'face',
    render: () => `
      <div class="text"><p>${TAGLINE}</p><p class="kicker">${KICKER}</p></div>
      <ul class="crew">${CREW.map((c) => `
        <li class="crew__member">
          <div class="crew__photo"><img src="${c.photo}" alt="${c.name}" loading="lazy" /></div>
          <img class="crew__tag" src="${c.tag}" alt="" />
          <span class="crew__name">${c.name}</span>
        </li>`).join('')}</ul>
      <div class="contact"><span class="contact__label">CONTACT</span><a class="contact__email" href="mailto:${EMAIL}">${EMAIL}</a></div>`,
  },
];
```

- [ ] **Step 8: Run all tests to verify they pass**

Run: `node --test "rebrand/test/**/*.test.js"`
Expected: all passing.

- [ ] **Step 9: Add the app panel and content CSS**

Append to `rebrand/css/rebrand.css`:

```css
/* ============ APP PANEL ============ */
.app {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  background: var(--lcd);
  transform: translateX(100%);
  transition: transform 200ms ease-out;
}
.app.is-open { transform: none; }
.app__bar {
  display: flex; align-items: center; gap: 1.5em;
  padding: 0.8em 1em;
  border-bottom: 2px solid var(--navy);
  font-family: var(--pixel); font-size: clamp(7px, 1vw, 12px);
}
.app__back { padding: 0.4em 0.6em; border: 2px solid var(--navy); }
.app__back:hover { background: var(--navy); color: var(--lcd); }
.app__bar h2 { font-size: inherit; font-weight: normal; }
.app__content {
  flex: 1; overflow-y: auto;
  padding: clamp(14px, 2.5vw, 40px);
  font-size: clamp(18px, 1.6vw, 24px); line-height: 1.25;
}

/* Text blocks */
.intro, .text p { max-width: 60ch; margin-bottom: 1em; }
.kicker { font-family: var(--pixel); font-size: 0.45em; letter-spacing: 0.1em; }
.text a { text-decoration: underline; text-underline-offset: 3px; }

/* Landing (HOME app) */
.landing { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.2em; }
.landing__mark { width: min(70%, 520px); filter: invert(1); mix-blend-mode: multiply; }
.landing__kicker { font-family: var(--pixel); font-size: 0.45em; letter-spacing: 0.12em; }
.landing__body { max-width: 60ch; }
.logos { list-style: none; display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5em 2.5em; margin-top: 1em; }
.logos img { height: clamp(22px, 2.6vw, 44px); width: auto; filter: invert(1) grayscale(1); mix-blend-mode: multiply; }

/* Project tiles */
.tiles {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: clamp(14px, 2vw, 28px);
}
.tile__media {
  position: relative; aspect-ratio: 16 / 9;
  border: 2px solid var(--navy); background: #000; overflow: hidden;
}
.tile__media.is-portrait { aspect-ratio: 2 / 3; max-width: 60%; }
.tile__media img, .tile__media video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.tile__placeholder {
  position: absolute; inset: 0; display: grid; place-items: center;
  color: #666; font-family: var(--pixel); font-size: 0.4em;
}
.tile__client { font-family: var(--pixel); font-size: 0.4em; margin-top: 0.9em; text-transform: uppercase; }
.tile__title { font-weight: normal; font-size: 1.1em; line-height: 1.1; }

/* Crew */
.crew {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: clamp(16px, 2.5vw, 40px);
  margin: 1.5em 0;
}
.crew__member { display: flex; flex-direction: column; align-items: center; text-align: center; }
.crew__photo {
  width: 70%; aspect-ratio: 1 / 1; border-radius: 50%; overflow: hidden;
  border: 2px solid var(--navy); background: #000; margin-bottom: 0.6em;
}
.crew__photo img { width: 100%; height: 100%; object-fit: cover; }
.crew__tag { width: 100%; filter: invert(1); mix-blend-mode: multiply; }
.crew__name { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.contact { display: flex; flex-direction: column; align-items: center; gap: 0.5em; margin-top: 1em; }
.contact__label { font-family: var(--pixel); font-size: 0.45em; letter-spacing: 0.2em; }
.contact__email { text-decoration: underline; text-underline-offset: 3px; }
```

- [ ] **Step 10: Wire the router and app panel in main.js**

In `rebrand/js/main.js`:

Replace the `APP_LIST` constant and its import with:

```js
import { APPS } from './apps.js';
import { parseHash } from './router.js';
const APP_LIST = APPS;
```

Add `const app = $('app');` next to the other element lookups.

Replace the `openApp` stub with:

```js
/* ---------- APPS ---------- */
function openApp(id) {
  if (parseHash(location.hash) === id) showApp(id);
  else location.hash = id;
}

function closeApp() {
  if (location.hash) location.hash = '';
  else showApp(null);
}

function showApp(id) {
  if (!id) {
    app.classList.remove('is-open');
    setState('home');
    const hide = () => { if (!app.classList.contains('is-open')) { app.hidden = true; app.innerHTML = ''; } };
    reduced ? hide() : setTimeout(hide, 220);
    return;
  }
  const a = APP_LIST.find((x) => x.id === id);
  app.innerHTML = `
    <header class="app__bar">
      <button class="app__back" type="button" id="back">&lt; BACK</button>
      <h2>${a.label}</h2>
    </header>
    <div class="app__content">${a.render()}</div>`;
  app.hidden = false;
  initVideos(app);
  $('back').addEventListener('click', closeApp);
  requestAnimationFrame(() => app.classList.add('is-open'));
  setState('app');
  select(APP_LIST.indexOf(a));
  label.textContent = a.label;
}

function initVideos(root) {
  root.querySelectorAll('[data-video]').forEach((slot) => {
    const v = document.createElement('video');
    v.src = slot.dataset.video;
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    v.addEventListener('error', () => v.remove());
    v.addEventListener('loadedmetadata', () => { if (v.videoHeight > v.videoWidth) slot.classList.add('is-portrait'); });
    slot.appendChild(v);
    slot.addEventListener('pointerenter', () => v.play().catch(() => {}));
    slot.addEventListener('pointerleave', () => v.pause());
    slot.addEventListener('click', () => (v.paused ? v.play().catch(() => {}) : v.pause()));
  });
}

window.addEventListener('hashchange', () => showApp(parseHash(location.hash)));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && phone.dataset.state === 'app') closeApp();
});
```

Replace the START block with:

```js
/* ---------- START ---------- */
const requested = new URLSearchParams(location.search).get('state');
const initial = parseHash(location.hash);
let booted = false;
try { booted = sessionStorage.getItem('lb-booted') === '1'; } catch (_) { /* private mode */ }

if (requested === 'boot') startBoot();
else if (requested === 'zoom') { setState('boot'); setTimeout(zoomIn, 50); }
else if (requested === 'home' || requested === 'app' || booted || initial) {
  renderHome();
  setState('home');
  select(0);
  if (initial) showApp(initial);
} else {
  setState('off');
}
```

- [ ] **Step 11: Screenshot every app**

```bash
for a in home social filme unternehmen work career about; do
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
    --user-data-dir="$OUT/profile" --virtual-time-budget=4000 --window-size=1440,900 \
    --screenshot="$OUT/app-$a.png" "http://localhost:8000/rebrand/?state=app#$a"
done
```

Expected per screenshot: green frame, status bar, a title bar with "< BACK" and the app name, content below, label bar showing the app name. HOME: black wordmark on LCD grey, kicker, tagline, a row of dark logos. SOCIAL: four tiles. FILME: six tiles, Backrooms as a portrait tile. WORK: Ailiens first. ABOUT: six circular photos with black sticker text under each, contact e-mail at the end. Video tiles show the title placeholder until hovered.

Check the deep link and back path in the DOM:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$OUT/profile" \
  --virtual-time-budget=3000 --dump-dom "http://localhost:8000/rebrand/#filme" | grep -o 'data-state="[a-z]*"\|<h2>[A-Z]*</h2>' | head -2
```

Expected: `data-state="app"` and `<h2>FILME</h2>`.

---

### Task 5: Responsive layout, reduced motion, fallbacks, review set

**Files:**
- Modify: `rebrand/css/rebrand.css`

- [ ] **Step 1: Add the responsive and reduced-motion rules**

Append to `rebrand/css/rebrand.css`:

```css
/* ============ RESPONSIVE ============ */
@media (max-width: 720px) {
  .status__date { display: none; }
  .home { grid-template-columns: repeat(2, 1fr); align-content: start; padding-top: 6vw; gap: 4vw 0; }
  .icon, .icon:nth-child(5), .icon:nth-child(6), .icon:nth-child(7) { grid-column: auto; }
  .icon { font-size: 10px; }
  .icon svg { width: 18vw; }
  .tile__media.is-portrait { max-width: 100%; }
  .crew { grid-template-columns: repeat(2, 1fr); }
  .app__content { font-size: 18px; }
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .power svg { animation: none; opacity: 1; }
  .phone__stage { transition: opacity 150ms linear; }
  .app { transition: none; }
  [data-state="home"] .screen, [data-state="app"] .screen { animation: none; }
}
```

- [ ] **Step 2: Take the review set of screenshots**

For each width in 1440x900, 1024x768 and 390x844, and for each of `?state=` `off`, `boot`, `home`, `app#filme`, `app#about`:

```bash
for size in 1440,900 1024,768 390,844; do
  for s in "" "?state=boot" "?state=home" "?state=app#filme" "?state=app#about"; do
    name="$(echo "${size}${s}" | tr -c 'a-z0-9' '_')"
    "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
      --user-data-dir="$OUT/profile" --virtual-time-budget=3000 --window-size=$size \
      --screenshot="$OUT/review-$name.png" "http://localhost:8000/rebrand/$s"
  done
done
```

Expected at 390 px: the phone photo fits the width with the power symbol inside the LCD; HOME shows the icons in two columns without horizontal scrolling; FILME tiles stack in one column; ABOUT shows two crew members per row.

- [ ] **Step 3: Fallback checks**

- Rename `rebrand/phone.png` to `rebrand/phone.off.png` temporarily, take the OFF screenshot, confirm a green rounded rectangle with the black LCD and power symbol shows. Rename it back.
- Run `node --test "rebrand/test/**/*.test.js"` one last time. Expected: all passing.

- [ ] **Step 4: Hand the review set to the owner**

Open `http://localhost:8000/rebrand/` in the owner's browser and list the screenshots. Do not commit. The owner decides on changes; only after approval do the `rebrand/` files move to the repo root in a separate, later task.

---

## Self-review

**Spec coverage**

| Spec section | Task |
|---|---|
| Where it lives, local preview | Task 1 (structure, server) |
| Assets, LCD fractions, swappable photo | Task 1 (tokens), Task 5 (fallback) |
| Visual language, palette, pixel grid | Task 1 CSS |
| OFF | Task 1 |
| BOOT: game, auto-play, mouse/keys, 6 s with stall, skip, freeze 300 ms | Task 2 |
| ZOOM: scale into LCD, home visible during zoom, CSS frame with wordmark | Task 3 |
| HOME: status bar, 4+3 grid, selection, label bar, keyboard | Task 3 |
| APP: slide-in, back, Escape, hash per app, components | Task 4 |
| Return visits and deep links | Task 4 |
| App contents table | Task 4 `apps.js` |
| Responsive | Task 5 |
| Accessibility: buttons, reduced motion | Tasks 1-5 |
| Error handling: photo, video, canvas | Task 1 (`no-photo`), Task 4 (`error` listener), Task 2 (`ctx` null) |
| Testing: node tests, headless screenshots, keyboard | Every task; keyboard check is manual in Task 5 |

**Placeholder scan:** none. CAREER copy is a real placeholder text the owner asked for.

**Type consistency:** `progressAt(t, duration)`, `createGame/step/render`, `formatStatus`, `parseHash/APP_IDS`, `APPS[].render()`, `ICONS` keys `house, social, clapper, building, reel, briefcase, face` are used with the same names across tasks. `APP_LIST` is introduced in Task 3 and re-pointed to `APPS` in Task 4.
