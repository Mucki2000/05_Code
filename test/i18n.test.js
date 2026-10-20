import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLang, t, LANG } from '../js/i18n.js';

test('pickLang: ?lang wins, then the stored choice, then the browser language', () => {
  assert.equal(pickLang({ search: '?lang=en', stored: 'de', nav: 'de-AT' }), 'en');
  assert.equal(pickLang({ search: '?lang=xx', stored: 'de', nav: 'en-US' }), 'de');
  assert.equal(pickLang({ search: '', stored: null, nav: 'de-AT' }), 'de');
  assert.equal(pickLang({ search: '', stored: null, nav: 'fr-FR' }), 'en');
  assert.equal(pickLang(), 'en');
});

test('t picks the current language (English outside a browser) and passes strings through', () => {
  assert.equal(LANG, 'en');
  assert.equal(t({ de: 'Hallo', en: 'Hello' }), 'Hello');
  assert.equal(t('FILM/TV'), 'FILM/TV');
});
