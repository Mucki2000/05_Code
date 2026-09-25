import test from 'node:test';
import assert from 'node:assert/strict';
import { APPS, DESKTOP, PROJECTS, CREW } from '../js/apps.js';
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
  assert.deepEqual([...desktopAppIds, ...folderItemIds].sort(), [...APP_IDS].sort());
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

test('HOME renders the logos before the wordmark', () => {
  const home = APPS.find((a) => a.id === 'home').render();
  const logosIdx = home.indexOf('class="logos"');
  const markIdx = home.indexOf('landing__mark');
  assert.ok(logosIdx > -1 && markIdx > -1, 'both logos and wordmark present');
  assert.ok(logosIdx < markIdx, 'logos come before the wordmark');
});
