import { POWER, SIGNAL, BATTERY, ANTENNA, ICONS } from './icons.js';
import { progressAt } from './loader.js';
import { createGame, step, render } from './game.js';
import { createFlappy, stepFlappy, renderFlappy } from './flappy.js';
import { formatStatus } from './clock.js';
import { APPS, DESKTOP, CURRENT_PASSWORD_HASH, landingHtml } from './apps.js';
import { parseHash } from './router.js';
import { sha256Hex, isUnlocked, markUnlocked } from './gate.js';
import { createStore, createRemoteStore, cleanName } from './scores.js';
import { SCORES_ENDPOINT, GOATCOUNTER } from './config.js';
import { initAnalytics, trackView } from './analytics.js';

const $ = (id) => document.getElementById(id);
const phone = $('phone'), stage = $('stage'), photo = $('photo'), lcd = $('lcd'), frame = $('frame');
const power = $('power'), signal = $('signal'), battery = $('battery'), glyph = $('glyph');
const dateEl = $('date'), timeEl = $('time'), ampmEl = $('ampm');
const canvas = $('game'), fill = $('fill'), pct = $('pct'), score = $('score'), skip = $('skip');
const home = $('home'), label = $('label'), app = $('app');
const device = document.querySelector('.phone__device'), screenEl = $('screen');
const splash = $('splash');

export const STATES = ['off', 'splash', 'boot', 'enter', 'home', 'app'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BOOT_MS = reduced ? 1500 : 4500;
const SPLASH_MS = reduced ? 700 : 2000;          // jump (1100 ms) + hold
const SPLASH_OUT_MS = reduced ? 0 : 220;         // three-frame blink-off

const APP_LIST = APPS;

function setState(s) { phone.dataset.state = s; }

/* ---------- OFF ---------- */
power.innerHTML = POWER;
signal.insertAdjacentHTML('afterbegin', SIGNAL);
battery.innerHTML = BATTERY;
glyph.innerHTML = ANTENNA + SIGNAL;
photo.addEventListener('error', () => phone.classList.add('no-photo'));
power.addEventListener('click', startSplash);

/* ---------- SPLASH (logo jumps in, then the boot) ---------- */
function startSplash() {
  if (phone.dataset.state === 'splash') return;
  splash.classList.remove('is-out');
  setState('splash');
  let done = false;
  let outTimer = null, holdTimer = null;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(holdTimer);
    clearTimeout(outTimer);
    window.removeEventListener('keydown', onKey);
    splash.removeEventListener('click', onClick);
    splash.classList.remove('is-out');          // a later dev-aid run starts clean
    startBoot();
  };
  // Escape or a click on the splash skips straight to the boot. Listeners added
  // to the same target during dispatch do not see the current event, so the
  // boot's own Escape handler is not triggered by the same key press.
  const onKey = (e) => { if (e.key === 'Escape') finish(); };
  const onClick = () => finish();
  window.addEventListener('keydown', onKey);
  splash.addEventListener('click', onClick);
  holdTimer = setTimeout(() => {
    splash.classList.add('is-out');
    outTimer = setTimeout(finish, SPLASH_OUT_MS);
  }, SPLASH_MS);
}

/* ---------- BOOT ---------- */
function startBoot() {
  renderHome();                                   // the landing images load during the boot game
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

/* ---------- LAYOUT (fill vs photo mode) ---------- */
// Photo aspect of phone.png; the LCD fractions live in css/rebrand.css.
const PHOTO_W = 1024, PHOTO_H = 1536;

function lcdFractions() {
  const css = getComputedStyle(document.documentElement);
  const frac = (name) => parseFloat(css.getPropertyValue(name)) / 100;
  return { fl: frac('--lcd-left'), ft: frac('--lcd-top'), fw: frac('--lcd-w'), fh: frac('--lcd-h') };
}

// Decides the inside-mode and, in photo mode, the LCD window + stage transform.
// photo: landscape desktop, the zoomed photo stays around the LCD (the stage
//        transform is the frame and is never cleared while in photo mode).
// fill:  mobile / portrait, the LCD is the viewport with the thin case frame.
// Returns { mode, transform }; applies the transform unless apply === false
// (zoomIn applies it inside a rAF so the CSS transition animates it).
function layout(apply = true) {
  const vw = innerWidth, vh = innerHeight;
  const mode = vw > 720 && vh > 500 && vw > vh ? 'photo' : 'fill';   // landscape phones (vh <= 500) keep the fill layout
  phone.dataset.mode = mode;
  // The real LCD must not live under the (transformed) stage: a transformed
  // ancestor is the containing block of position:fixed. zoomIn does this
  // before the transform starts; the direct-start paths reach it from here.
  if (lcd.parentNode !== phone) phone.insertBefore(lcd, frame);
  if (mode === 'fill') {
    if (apply) stage.style.transform = '';
    return { mode, transform: '' };
  }
  const { fl, ft, fw, fh } = lcdFractions();
  const A = (fw * PHOTO_W) / (fh * PHOTO_H);                 // LCD aspect, about 1.606
  const W = Math.min(0.86 * vw, 0.74 * vh * A);
  const H = W / A;
  const cx = vw / 2, cy = 0.48 * vh;                          // window centre, a bit above the middle
  phone.style.setProperty('--win-x', Math.round(cx - W / 2) + 'px');
  phone.style.setProperty('--win-y', Math.round(cy - H / 2) + 'px');
  phone.style.setProperty('--win-w', Math.round(W) + 'px');
  phone.style.setProperty('--win-h', Math.round(H) + 'px');
  // Untransformed device layout (offset* ignores transforms), centred in the stage.
  const ow = device.offsetWidth, oh = device.offsetHeight;
  const rcx = (vw - ow) / 2 + ow * (fl + fw / 2);
  const rcy = (vh - oh) / 2 + oh * (ft + fh / 2);
  const s = W / (ow * fw);
  const ox = vw / 2, oy = vh / 2;                             // transform-origin 50% 50%
  const tx = cx - ox - s * (rcx - ox), ty = cy - oy - s * (rcy - oy);
  const transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  if (apply) stage.style.transform = transform;
  return { mode, transform };
}

window.addEventListener('resize', () => {
  if (phone.dataset.state === 'home' || phone.dataset.state === 'app') layout();
});

/* ---------- ZOOM (cross-fade "enter") ---------- */
function zoomIn() {
  renderHome();
  select(0);
  setState('enter');
  // Graduate the real LCD out of the stage before the stage gets an active
  // transform of its own: a transformed ancestor would become the containing
  // block for #lcd's position:fixed, dragging the real layer along with the
  // photo instead of letting it sit still, already in its final layout,
  // underneath the fading ghost.
  phone.insertBefore(lcd, frame);
  if (reduced) {
    const { mode } = layout();
    if (mode === 'fill') stage.style.opacity = '0';
    setTimeout(() => finishEnter(null), 150);
    return;
  }
  const clone = screenEl.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  const ghost = document.createElement('div');
  ghost.className = 'lcd lcd--ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.appendChild(clone);
  device.appendChild(ghost);

  const { mode, transform } = layout(false);
  let target = transform;
  if (mode === 'fill') {
    // The LCD fills the viewport: scale the ghost's rect up to cover it.
    const r = ghost.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    const portrait = vh > vw;
    const scale = portrait ? Math.min(vw / r.width, vh / r.height) : Math.max(vw / r.width, vh / r.height);
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const tx = -scale * (cx - vw / 2), ty = -scale * (cy - vh / 2);
    target = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }
  let done = false;
  const finish = () => { if (done) return; done = true; finishEnter(ghost); };
  ghost.addEventListener('transitionend', (e) => { if (e.propertyName === 'opacity') finish(); });
  // Fallback if transitionend never fires. 900 ms ride + margin: a slow first
  // frame (the desk paints filtered logos in two layers) delays the start.
  setTimeout(finish, 1400);
  requestAnimationFrame(() => {
    stage.style.transform = target;
    ghost.classList.add('is-fading');
  });
}

function finishEnter(ghost) {
  if (ghost) ghost.remove();
  if (phone.dataset.mode !== 'photo') stage.style.transform = '';   // photo mode: the transform is the frame
  stage.style.opacity = '';
  try { sessionStorage.setItem('lb-booted', '1'); } catch (_) { /* private mode */ }
  setState('home');
  layout();                                                          // the viewport may have changed during the zoom
  select(0);
  if (pendingApp) { const p = pendingApp; pendingApp = null; showApp(p); }
}

/* ---------- HOME ---------- */
let selected = 0;
let icons = [];
let pendingApp = null;
let openFolderId = null;

function iconStyle(x, y, mx, my) {
  return `--x: ${x}%; --y: ${y}%; --mx: ${mx}%; --my: ${my}%`;
}

// The landing (logos, wordmark, kicker, tagline) is the desktop's centre piece.
// Decorative for navigation: pointer-events none (CSS), not focusable, and not
// part of `icons`, so hover/keyboard order only ever sees the five icons.
function renderHome() {
  home.innerHTML = `<div class="desk" aria-label="Lausebengel">${landingHtml()}</div>` + DESKTOP.map((entry) => {
    if (entry.type === 'folder') {
      return `<button class="icon" type="button" data-folder="${entry.id}" aria-haspopup="dialog" style="${iconStyle(entry.x, entry.y, entry.mx, entry.my)}">${ICONS[entry.icon]}<span>${entry.label}</span></button>`;
    }
    const a = APP_LIST.find((x) => x.id === entry.id);
    return `<button class="icon" type="button" data-app="${a.id}" style="${iconStyle(entry.x, entry.y, entry.mx, entry.my)}">${ICONS[a.icon]}<span>${a.label}</span></button>`;
  }).join('');
  refreshIcons();
}

// icons/folder__items are re-created on every render/open/close, so bindings
// live once on #home (delegated) instead of being re-attached per element.
function refreshIcons() {
  icons = [...home.querySelectorAll('.icon')];
}

function labelFor(el) {
  if (!el) return '';
  if (el.dataset.folder) return DESKTOP.find((d) => d.id === el.dataset.folder)?.label ?? '';
  return APP_LIST.find((x) => x.id === el.dataset.app)?.label ?? '';
}

function activate(el) {
  if (el.dataset.folder) toggleFolder(el.dataset.folder);
  else openApp(el.dataset.app);
}

function select(i) {
  selected = Math.max(0, Math.min(icons.length - 1, i));
  icons.forEach((el, j) => el.classList.toggle('is-selected', j === selected));
  label.textContent = labelFor(icons[selected]);
}

function toggleFolder(id) {
  if (openFolderId === id) closeFolder();
  else openFolder(id);
}

function openFolder(id) {
  const existing = home.querySelector('.folder');
  if (existing) existing.remove();
  const entry = DESKTOP.find((d) => d.type === 'folder' && d.id === id);
  if (!entry) return;
  const win = document.createElement('div');
  win.className = 'folder';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', entry.label);
  win.style.cssText = '--x: 50%; --y: 50%';                  // centred over the landing
  win.innerHTML = `
    <div class="folder__bar"><span>${entry.label}</span><button class="folder__close" type="button" aria-label="Schließen">X</button></div>
    <div class="folder__items">${entry.items.map((appId) => {
      const a = APP_LIST.find((x) => x.id === appId);
      return `<button class="icon" type="button" data-app="${a.id}">${ICONS[a.icon]}<span>${a.label}</span></button>`;
    }).join('')}</div>`;
  home.appendChild(win);
  home.dataset.folder = id;
  openFolderId = id;
  refreshIcons();
  const firstIndex = icons.findIndex((el) => el.dataset.app === entry.items[0]);
  select(firstIndex >= 0 ? firstIndex : 0);
}

function closeFolder() {
  if (!openFolderId) return;
  const id = openFolderId;
  const win = home.querySelector('.folder');
  if (win) win.remove();
  delete home.dataset.folder;
  openFolderId = null;
  refreshIcons();
  const idx = icons.findIndex((el) => el.dataset.folder === id);
  select(idx >= 0 ? idx : 0);
}

// Single delegated listener set on #home: survives every re-render/open/close
// without ever accumulating duplicate bindings on the persistent desktop icons.
home.addEventListener('pointerover', (e) => {
  const el = e.target.closest('.icon');
  if (el) select(icons.indexOf(el));
});
home.addEventListener('focusin', (e) => {
  const el = e.target.closest('.icon');
  if (el) select(icons.indexOf(el));
});
home.addEventListener('click', (e) => {
  if (e.target.closest('.folder__close')) { closeFolder(); return; }
  const el = e.target.closest('.icon');
  if (el) { activate(el); return; }
  if (!e.target.closest('.folder')) closeFolder();
});

window.addEventListener('keydown', (e) => {
  if (phone.dataset.state !== 'home') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(selected + 1);
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(selected - 1);
  else if (e.key === 'Enter') activate(icons[selected]);
  else if (e.key === 'Escape' && openFolderId) closeFolder();
  else return;
  e.preventDefault();
});

/* ---------- APPS ---------- */
let pushedHash = false;
let hideTimer = null;
let stopArcade = null;

function openApp(id) {
  if (parseHash(location.hash) === id) showApp(id);
  else { location.hash = id; pushedHash = true; }
}

function closeApp() {
  if (stopArcade) { stopArcade(); stopArcade = null; }
  if (pushedHash) {
    pushedHash = false;
    history.back();
  } else if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
    showApp(null);
  } else {
    showApp(null);
  }
}

// 'home' is a known hash (router.js) but has no panel: it means the desktop.
function showApp(id) {
  if (stopArcade) { stopArcade(); stopArcade = null; }
  if (id === 'home') id = null;
  if (!id) {
    app.classList.remove('is-open');
    select(selected);
    setState('home');
    home.inert = false;
    icons[selected]?.focus({ preventScroll: true });
    const hide = () => { if (!app.classList.contains('is-open')) { app.hidden = true; app.innerHTML = ''; } };
    if (reduced) { hide(); hideTimer = null; } else { hideTimer = setTimeout(hide, 220); }
    return;
  }
  clearTimeout(hideTimer);
  const a = APP_LIST.find((x) => x.id === id);
  const locked = a.locked && !isUnlocked(id, sessionStorage);
  app.innerHTML = `
    <header class="app__bar">
      <button class="app__back" type="button" id="back">&lt; BACK</button>
      <h2>${a.label}</h2>
    </header>
    <div class="app__content">${locked ? gateMarkup() : a.render()}</div>`;
  app.hidden = false;
  if (!locked) {
    initVideos(app);
    if (ENGINES[id]) startArcade(app, ENGINES[id]);
  }
  $('back').addEventListener('click', closeApp);
  requestAnimationFrame(() => app.classList.add('is-open'));
  setState('app');
  home.inert = true;
  label.textContent = a.label;
  trackView(id, a.label);                      // one GoatCounter view per opened app
  if (locked) initGate(id);
  else $('back').focus({ preventScroll: true });
}

/* ---------- ARCADE (BRICKS and FLAPPY share one runner) ---------- */
// An engine is the pure game module plus what the runner needs to know:
// create/step/render (js/game.js, js/flappy.js), isOver(g, prev) with `prev`
// a shallow copy of the state before this frame's step, the localStorage key
// of its high-score list, the ready prompt and the control scheme.
const NAME_KEY = 'lb-bricks-scores';          // one remembered name for all games
const ENGINES = {
  bricks: {
    create: createGame, step, render,
    isOver: (g, prev) => g.lost > prev.lost,
    storeKey: 'lb-bricks-scores',
    readyText: 'MOVE THE MOUSE OR TAP TO START',
    controls: 'paddle',                        // pointermove / ArrowLeft / ArrowRight
  },
  flappy: {
    create: createFlappy, step: stepFlappy, render: renderFlappy,
    isOver: (g) => g.dead,
    storeKey: 'lb-flappy-scores',
    readyText: 'TAP OR PRESS SPACE TO START',
    controls: 'flap',                          // click / tap / Space / ArrowUp
  },
};

function startArcade(root, engine) {
  const canvasEl = root.querySelector('#bricks-canvas');
  if (!canvasEl) return;
  // The wrap comes from the markup (apps.js) and holds canvas + overlay.
  const wrap = canvasEl.closest('.bricks__wrap') || canvasEl.parentElement;
  const paddle = engine.controls === 'paddle';
  wrap.classList.toggle('bricks__wrap--flap', !paddle);

  const scoreEl = root.querySelector('#bricks-score');
  const ctx = canvasEl.getContext ? canvasEl.getContext('2d') : null;

  // High-score board (localStorage behind js/scores.js). One store per open;
  // the list is per game, the remembered name is shared through the BRICKS key.
  const local = createStore(undefined, engine.storeKey);
  const names = engine.storeKey === NAME_KEY ? local : createStore(undefined, NAME_KEY);
  // With a configured service the board is shared by all visitors; the local
  // list paints first and stands in when the network fails.
  const store = SCORES_ENDPOINT
    ? createRemoteStore({ endpoint: SCORES_ENDPOINT, game: engine.storeKey.replace(/^lb-|-scores$/g, ''), local })
    : local;
  let closed = false;                          // set by stopArcade: ignore late responses
  const listEl = root.querySelector('#board-list');
  const formEl = root.querySelector('#board-form');
  const promptEl = root.querySelector('#board-prompt');
  const nameEl = root.querySelector('#board-name');
  const noteEl = root.querySelector('#board-note');
  const renderBoard = (list, newEntry = null) => {
    if (!listEl) return;
    listEl.replaceChildren();
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'board__empty';
      li.textContent = 'NO SCORES YET';
      listEl.appendChild(li);
      return;
    }
    list.forEach((e, i) => {
      const li = document.createElement('li');
      if (e === newEntry) li.classList.add('is-new');
      for (const [cls, text] of [['board__rank', (i + 1) + '.'], ['board__name', e.name], ['board__score', String(e.score)]]) {
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = text;
        li.appendChild(span);
      }
      listEl.appendChild(li);
    });
  };
  renderBoard(store.load());
  if (store.fetchAll) {
    store.fetchAll().then((list) => { if (!closed) renderBoard(list); }).catch(() => { /* local list stays */ });
  }
  const hideBoardUi = () => {
    if (formEl) formEl.hidden = true;
    if (noteEl) { noteEl.hidden = true; noteEl.textContent = ''; }
  };
  const typing = () => !!nameEl && document.activeElement === nameEl;

  let g = engine.create(canvasEl.width, canvasEl.height);
  let over = false;
  let overlay = null;
  let raf = null;
  let last = performance.now();
  const input = {};
  const resetInput = () => {
    if (paddle) input.paddleX = g.paddle.x + g.paddle.w / 2;
    else input.flap = false;
  };
  resetInput();

  // The game waits for the first input so a visitor who has just opened the
  // panel is not handed a game over (and the name form) within a second.
  let armed = false;
  let ready = null;
  const showReady = () => {
    ready = document.createElement('div');
    ready.className = 'bricks__over bricks__over--ready';
    ready.textContent = engine.readyText;
    wrap.appendChild(ready);
  };
  const arm = () => {
    if (armed || over) return;
    armed = true;
    if (ready) { ready.remove(); ready = null; }
    last = performance.now();
  };

  const onMove = (e) => {
    const r = canvasEl.getBoundingClientRect();
    input.paddleX = ((e.clientX - r.left) / r.width) * g.w;
    arm();
  };
  const isFlapKey = (e) => e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp';
  const onKey = (e) => {
    if (typing()) return;                       // Space types a space, arrows move the caret
    if (paddle) {
      if (e.key === 'ArrowLeft') input.paddleX = Math.max(0, input.paddleX - 8);
      else if (e.key === 'ArrowRight') input.paddleX = Math.min(g.w, input.paddleX + 8);
      else return;
    } else {
      if (!isFlapKey(e)) return;
      e.preventDefault();                       // no page scroll, no BACK activation
      if (e.repeat || over) return;             // one flap per press
      input.flap = true;
    }
    arm();
  };
  // Space activates the focused BACK button on keyup: swallow that too.
  const onKeyUp = (e) => { if (isFlapKey(e) && !typing()) e.preventDefault(); };
  const restart = () => {
    g = engine.create(canvasEl.width, canvasEl.height);
    over = false;
    armed = false;
    resetInput();
    if (overlay) { overlay.remove(); overlay = null; }
    hideBoardUi();                       // a restart without saving discards that score
    showReady();
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const onClick = () => {
    if (over) { restart(); return; }
    if (!paddle) input.flap = true;
    arm();
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!over || !formEl) return;
    const score = g.score;
    names.rememberName(cleanName(nameEl.value));
    formEl.hidden = true;
    if (noteEl) { noteEl.textContent = 'SAVING...'; noteEl.hidden = false; }
    const result = await store.add({ name: nameEl.value, score });   // sync for the local store
    if (closed) return;
    const { list, rank } = result;
    renderBoard(list, rank > 0 ? list[rank - 1] : null);
    if (noteEl) {
      const where = result.remote === false ? ' (OFFLINE)' : '';
      noteEl.textContent = (rank > 0 ? 'SAVED · #' + rank : 'NOT IN TOP 10') + where;
    }
  };

  if (paddle) canvasEl.addEventListener('pointermove', onMove);
  // Bound to the wrap, not the canvas: the game-over overlay (.bricks__over)
  // is stacked on top of the canvas with inset:0 and intentionally intercepts
  // pointer events (no pointer-events:none) so its own text stays hit-testable;
  // a listener on the canvas would never see the restart click. The ready
  // overlay has pointer-events:none, so the first tap/click reaches it too.
  wrap.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  if (!paddle) window.addEventListener('keyup', onKeyUp);
  if (formEl) formEl.addEventListener('submit', onSubmit);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const prev = { ...g };
    if (armed) engine.step(g, dt, input);
    if (!paddle) input.flap = false;            // a flap is a single impulse
    if (ctx) engine.render(ctx, g);
    scoreEl.textContent = 'SCORE ' + g.score;
    if (!over && engine.isOver(g, prev)) {
      over = true;
      overlay = document.createElement('div');
      overlay.className = 'bricks__over';
      overlay.textContent = 'GAME OVER · SCORE ' + g.score + ' · CLICK TO RESTART';
      wrap.appendChild(overlay);
      if (g.score > 0 && formEl) {
        promptEl.textContent = 'GAME OVER · SCORE ' + g.score;
        nameEl.value = names.lastName();
        formEl.hidden = false;
        nameEl.focus({ preventScroll: true });
      }
    }
    if (!over) raf = requestAnimationFrame(frame);
  }
  showReady();
  raf = requestAnimationFrame(frame);

  stopArcade = () => {
    closed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    canvasEl.removeEventListener('pointermove', onMove);
    wrap.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    if (formEl) formEl.removeEventListener('submit', onSubmit);
  };
}

function gateMarkup() {
  return `
  <form class="gate" id="gate">
    <p class="gate__title">CURRENT PROJECTS</p>
    <p class="gate__text">This area is for clients and partners. Enter the password.</p>
    <label class="gate__label" for="gate-input">PASSWORD</label>
    <input class="gate__input" id="gate-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" />
    <button class="gate__button" type="submit">OK</button>
    <p class="gate__error" id="gate-error" hidden>WRONG PASSWORD</p>
  </form>`;
}

function initGate(id) {
  const form = $('gate');
  const input = $('gate-input');
  const error = $('gate-error');
  input.focus({ preventScroll: true });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(globalThis.crypto && globalThis.crypto.subtle)) {
      error.textContent = 'PASSWORD CHECK NEEDS HTTPS';
      error.hidden = false;
      return;
    }
    const hash = await sha256Hex(input.value);
    if (hash === CURRENT_PASSWORD_HASH) {
      markUnlocked(id, sessionStorage);
      showApp(id);
      return;
    }
    error.hidden = false;
    input.value = '';
    form.classList.add('is-shake');
    setTimeout(() => form.classList.remove('is-shake'), 400);
    input.focus({ preventScroll: true });
  });
}

function initVideos(root) {
  root.querySelectorAll('[data-video]').forEach((slot) => {
    const v = document.createElement('video');
    v.src = slot.dataset.video + '#t=0.1';
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    v.addEventListener('error', () => v.remove());
    v.addEventListener('loadedmetadata', () => { if (v.videoHeight > v.videoWidth) slot.classList.add('is-portrait'); });
    slot.appendChild(v);
    slot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') v.play().catch(() => {}); });
    slot.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') v.pause(); });
    slot.addEventListener('click', () => (v.paused ? v.play().catch(() => {}) : v.pause()));
  });
}

window.addEventListener('hashchange', () => {
  const id = parseHash(location.hash);
  if (id === null || id === 'home') pushedHash = false;     // both mean "desktop"
  if (['off', 'splash', 'boot', 'enter'].includes(phone.dataset.state)) { pendingApp = id; return; }
  showApp(id);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && phone.dataset.state === 'app') closeApp();
});

/* ---------- CLOCK ---------- */
function tickClock() {
  const { date, time, ampm } = formatStatus(new Date());
  dateEl.textContent = date;
  timeEl.textContent = time;
  ampmEl.textContent = ampm;
}
tickClock();
setInterval(tickClock, 30000);

/* ---------- START ---------- */
initAnalytics(GOATCOUNTER);                     // no-op while the code is empty
const startParams = new URLSearchParams(location.search);
const requested = startParams.get('state');
const requestedFolder = startParams.get('folder');
const initial = parseHash(location.hash);
let booted = false;
try { booted = sessionStorage.getItem('lb-booted') === '1'; } catch (_) { /* private mode */ }

if (requested === 'boot') startBoot();
else if (requested === 'splash') startSplash();
else if (requested === 'zoom') { renderHome(); setState('boot'); setTimeout(zoomIn, 50); }
else if (requested === 'home' || requested === 'app' || booted || initial) {
  renderHome();
  layout();
  setState('home');
  select(0);
  if (requested === 'home' && requestedFolder) openFolder(requestedFolder);
  if (initial) showApp(initial);
} else {
  setState('off');
}
