import { POWER, SIGNAL, ICONS } from './icons.js';
import { progressAt } from './loader.js';
import { createGame, step, render } from './game.js';
import { formatStatus } from './clock.js';
import { APPS, DESKTOP, CURRENT_PASSWORD_HASH } from './apps.js';
import { parseHash } from './router.js';
import { sha256Hex, isUnlocked, markUnlocked } from './gate.js';

const $ = (id) => document.getElementById(id);
const phone = $('phone'), stage = $('stage'), photo = $('photo'), lcd = $('lcd'), frame = $('frame');
const power = $('power'), signal = $('signal'), dateEl = $('date'), timeEl = $('time'), glyph = $('glyph');
const canvas = $('game'), fill = $('fill'), pct = $('pct'), score = $('score'), skip = $('skip');
const home = $('home'), label = $('label'), app = $('app');
const device = document.querySelector('.phone__device'), screenEl = $('screen');

export const STATES = ['off', 'boot', 'enter', 'home', 'app'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BOOT_MS = reduced ? 1500 : 6000;

const APP_LIST = APPS;

function setState(s) { phone.dataset.state = s; }

/* ---------- OFF ---------- */
power.innerHTML = POWER;
signal.insertAdjacentHTML('afterbegin', SIGNAL);
glyph.insertAdjacentHTML('afterbegin', SIGNAL);
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

/* ---------- ZOOM (cross-fade "enter") ---------- */
function zoomIn() {
  renderHome();
  select(0);
  setState('enter');
  // Graduate the real LCD out of the stage before the stage gets an active
  // transform/opacity of its own: a transformed/faded ancestor would become
  // the containing block for #lcd's position:fixed and would also mute its
  // opacity, dragging the real layer along with the photo instead of letting
  // it sit still, already in its final layout, underneath the fading ghost.
  phone.insertBefore(lcd, frame);
  if (reduced) {
    stage.style.opacity = '0';
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

  const r = ghost.getBoundingClientRect();
  const vw = innerWidth, vh = innerHeight;
  const portrait = vh > vw;
  const scale = portrait ? Math.min(vw / r.width, vh / r.height) : Math.max(vw / r.width, vh / r.height);
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const tx = -scale * (cx - vw / 2), ty = -scale * (cy - vh / 2);
  let done = false;
  const finish = () => { if (done) return; done = true; finishEnter(ghost); };
  stage.addEventListener('transitionend', (e) => { if (e.target === stage && e.propertyName === 'opacity') finish(); }, { once: true });
  setTimeout(finish, 1000);                       // fallback if the event never fires
  requestAnimationFrame(() => {
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    stage.style.opacity = '0';
  });
}

function finishEnter(ghost) {
  if (ghost) ghost.remove();
  stage.style.transform = '';
  stage.style.opacity = '';
  try { sessionStorage.setItem('lb-booted', '1'); } catch (_) { /* private mode */ }
  setState('home');
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

function renderHome() {
  home.innerHTML = DESKTOP.map((entry) => {
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
  win.style.cssText = `--x: ${entry.x}%; --y: ${entry.y}%`;
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
let stopBricks = null;

function openApp(id) {
  if (parseHash(location.hash) === id) showApp(id);
  else { location.hash = id; pushedHash = true; }
}

function closeApp() {
  if (stopBricks) { stopBricks(); stopBricks = null; }
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

function showApp(id) {
  if (stopBricks) { stopBricks(); stopBricks = null; }
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
    if (id === 'bricks') startBricks(app);
  }
  $('back').addEventListener('click', closeApp);
  requestAnimationFrame(() => app.classList.add('is-open'));
  setState('app');
  home.inert = true;
  label.textContent = a.label;
  if (locked) initGate(id);
  else $('back').focus({ preventScroll: true });
}

/* ---------- BRICKS (playable app) ---------- */
function startBricks(root) {
  const canvasEl = root.querySelector('#bricks-canvas');
  if (!canvasEl) return;
  const wrap = document.createElement('div');
  wrap.className = 'bricks__wrap';
  canvasEl.replaceWith(wrap);
  wrap.appendChild(canvasEl);

  const scoreEl = root.querySelector('#bricks-score');
  const ctx = canvasEl.getContext ? canvasEl.getContext('2d') : null;

  let g = createGame(canvasEl.width, canvasEl.height);
  let over = false;
  let overlay = null;
  let raf = null;
  let last = performance.now();
  const input = { paddleX: g.paddle.x + g.paddle.w / 2 };

  const onMove = (e) => {
    const r = canvasEl.getBoundingClientRect();
    input.paddleX = ((e.clientX - r.left) / r.width) * g.w;
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') input.paddleX = Math.max(0, input.paddleX - 8);
    else if (e.key === 'ArrowRight') input.paddleX = Math.min(g.w, input.paddleX + 8);
  };
  const restart = () => {
    g = createGame(canvasEl.width, canvasEl.height);
    over = false;
    input.paddleX = g.paddle.x + g.paddle.w / 2;
    if (overlay) { overlay.remove(); overlay = null; }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const onClick = () => { if (over) restart(); };

  canvasEl.addEventListener('pointermove', onMove);
  // Bound to the wrap, not the canvas: the game-over overlay (.bricks__over)
  // is stacked on top of the canvas with inset:0 and intentionally intercepts
  // pointer events (no pointer-events:none) so its own text stays hit-testable;
  // a listener on the canvas would never see the restart click.
  wrap.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const before = g.lost;
    step(g, dt, input);
    if (ctx) render(ctx, g);
    scoreEl.textContent = 'SCORE ' + g.score;
    if (g.lost > before && !over) {
      over = true;
      overlay = document.createElement('div');
      overlay.className = 'bricks__over';
      overlay.textContent = 'GAME OVER · SCORE ' + g.score + ' · CLICK TO RESTART';
      wrap.appendChild(overlay);
    }
    if (!over) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  stopBricks = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    canvasEl.removeEventListener('pointermove', onMove);
    wrap.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
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
  if (id === null) pushedHash = false;
  if (['off', 'boot', 'enter'].includes(phone.dataset.state)) { pendingApp = id; return; }
  showApp(id);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && phone.dataset.state === 'app') closeApp();
});

/* ---------- CLOCK ---------- */
function tickClock() {
  const { date, time } = formatStatus(new Date());
  dateEl.textContent = date;
  timeEl.textContent = time;
}
tickClock();
setInterval(tickClock, 30000);

/* ---------- START ---------- */
const startParams = new URLSearchParams(location.search);
const requested = startParams.get('state');
const requestedFolder = startParams.get('folder');
const initial = parseHash(location.hash);
let booted = false;
try { booted = sessionStorage.getItem('lb-booted') === '1'; } catch (_) { /* private mode */ }

if (requested === 'boot') startBoot();
else if (requested === 'zoom') { setState('boot'); setTimeout(zoomIn, 50); }
else if (requested === 'home' || requested === 'app' || booted || initial) {
  renderHome();
  setState('home');
  select(0);
  if (requested === 'home' && requestedFolder) openFolder(requestedFolder);
  if (initial) showApp(initial);
} else {
  setState('off');
}
