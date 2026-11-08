// German / English. /de/ and /en/ are real pages (generated from index.html by
// tools/build-pages.mjs) that fix the language via <html data-lang>, so Google
// indexes each language at its own URL. On / the language comes from ?lang=,
// else the visitor's last choice, else the browser language. Outside a browser
// (the tests) it is English.
export const LANGS = ['de', 'en'];

export function pickLang({ page = null, search = '', stored = null, nav = '' } = {}) {
  if (LANGS.includes(page)) return page;
  const fromUrl = new URLSearchParams(search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  if (LANGS.includes(stored)) return stored;
  return String(nav).toLowerCase().startsWith('de') ? 'de' : 'en';
}

function detect() {
  if (typeof location === 'undefined') return 'en';
  let stored = null;
  try { stored = localStorage.getItem('lb-lang'); } catch (_) { /* private mode */ }
  const page = document.documentElement.dataset.lang || null;
  const lang = pickLang({ page, search: location.search, stored, nav: navigator.language });
  try { localStorage.setItem('lb-lang', lang); } catch (_) { /* private mode */ }
  return lang;
}

export const LANG = detect();

// t({ de: '…', en: '…' }) → the string for the current language; plain strings pass through.
export const t = (s) => (s && typeof s === 'object' ? s[LANG] ?? s.en : s);

// Go to the other language's page (keeps the open app in the hash).
export function switchLang(lang) {
  try { localStorage.setItem('lb-lang', lang); } catch (_) { /* private mode */ }
  location.href = `/${lang}/${location.hash}`;
}
