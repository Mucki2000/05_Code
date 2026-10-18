import test from 'node:test';
import assert from 'node:assert/strict';
import { APPS, DESKTOP, PROJECTS, CREW, landingHtml } from '../js/apps.js';
import { APP_IDS } from '../js/router.js';
import { ICONS } from '../js/icons.js';

// 'home' stays a router id (it means the desktop) but has no app of its own.
const PANEL_IDS = APP_IDS.filter((id) => id !== 'home');

test('APPS matches the router order (minus home) and uses existing icons', () => {
  assert.deepEqual(APPS.map((a) => a.id), PANEL_IDS);
  for (const a of APPS) {
    assert.ok(ICONS[a.icon], `icon ${a.icon} for ${a.id}`);
    assert.equal(typeof a.render, 'function');
    assert.ok(a.render().length > 20, `${a.id} renders something`);
  }
});

test('project tiles reference assets relative to rebrand/', () => {
  for (const [id, p] of Object.entries(PROJECTS)) {
    assert.ok(p.title && p.client, id);
    assert.ok((p.still || p.video || '').startsWith('assets/projects/'), id);
  }
});

test('DESKTOP entries reference known apps, folders reference known apps', () => {
  const desktopAppIds = [];
  const folderItemIds = [];
  for (const entry of DESKTOP) {
    if (entry.type === 'app') {
      assert.ok(APP_IDS.includes(entry.id), `desktop app id ${entry.id}`);
      desktopAppIds.push(entry.id);
    } else if (entry.type === 'folder') {
      for (const item of entry.items) {
        assert.ok(APP_IDS.includes(item), `folder item ${item}`);
        folderItemIds.push(item);
      }
    } else {
      assert.fail(`unknown DESKTOP entry type ${entry.type}`);
    }
  }
  assert.deepEqual([...desktopAppIds, ...folderItemIds].sort(), [...PANEL_IDS].sort());
  assert.ok(!DESKTOP.some((d) => d.id === 'home'), 'no HOME icon on the desktop');
});

test('CURRENT lists Ailiens before Backrooms, ABOUT renders six crew members', () => {
  const current = APPS.find((a) => a.id === 'current').render();
  assert.ok(current.indexOf('Ailiens in Lebin') < current.indexOf('Backrooms'));
  assert.equal(CREW.length, 6);
  const about = APPS.find((a) => a.id === 'about').render();
  assert.equal((about.match(/class="crew__member"/g) || []).length, 6);
  assert.ok(about.includes('class="map"'), 'ABOUT renders the map section');
});

test('Backrooms shows only in CURRENT, not FILM/TV', () => {
  const filmtv = APPS.find((a) => a.id === 'filmtv').render();
  assert.ok(!filmtv.includes('Backrooms'), 'FILM/TV excludes Backrooms');
  const current = APPS.find((a) => a.id === 'current').render();
  assert.ok(current.includes('Backrooms'), 'CURRENT includes Backrooms');
});

test('GAMES folder holds BRICKS and FLAPPY; both render a canvas and a board', () => {
  const games = DESKTOP.find((d) => d.id === 'games');
  assert.equal(games.type, 'folder');
  assert.deepEqual(games.items, ['bricks', 'flappy']);
  assert.equal(games.icon, 'joystick');
  assert.ok(!DESKTOP.some((d) => d.type === 'app' && (d.id === 'bricks' || d.id === 'flappy')), 'games only inside the folder');
  for (const id of ['bricks', 'flappy']) {
    const html = APPS.find((a) => a.id === id).render();
    assert.ok(html.includes('<canvas id="bricks-canvas" width="160" height="100">'), `${id} canvas`);
    assert.ok(html.includes('id="board-list"') && html.includes('id="board-form"'), `${id} board`);
    assert.ok(html.includes('CLICK TO RESTART'), `${id} hint`);
  }
  assert.ok(APPS.find((a) => a.id === 'flappy').render().includes('PRESS SPACE TO FLAP'));
  assert.equal(APPS.find((a) => a.id === 'flappy').icon, 'bird');
});

test('landingHtml renders eight logos as a looping ticker, then the wordmark, the kicker and the body', () => {
  const html = landingHtml();
  assert.ok(html.includes('class="landing"'));
  const logosIdx = html.indexOf('class="logos"');
  const markIdx = html.indexOf('landing__mark');
  assert.ok(logosIdx > -1 && markIdx > -1, 'both logos and wordmark present');
  assert.ok(logosIdx < markIdx, 'logos come before the wordmark');
  assert.equal((html.match(/<li><img /g) || []).length, 8, 'eight logos');
  assert.equal((html.match(/<li aria-hidden="true"><img /g) || []).length, 8, 'hidden copy for the loop');
  assert.ok(html.includes('alt="Lausebengel"'), 'wordmark alt');
  assert.ok(html.includes('class="landing__kicker"'), 'kicker');
  assert.ok(!html.includes('class="landing__body"'), 'no body text on the desk (it lives in ABOUT)');
  assert.ok(!html.includes('<button'), 'nothing interactive in the landing');
});
