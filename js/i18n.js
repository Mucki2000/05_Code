// German / English. The language comes from ?lang= (the /de/ and /en/ pages
// redirect there), else the visitor's last choice, else the browser language.
// Outside a browser (the tests) it is English.
export const LANGS = ['de', 'en'];

export function pickLang({ search = '', stored = null, nav = '' } = {}) {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  if (LANGS.includes(stored)) return stored;
  return String(nav).toLowerCase().startsWith('de') ? 'de' : 'en';
}

function detect() {
  if (typeof location === 'undefined') return 'en';
  let stored = null;
  try { stored = localStorage.getItem('lb-lang'); } catch (_) { /* private mode */ }
  const lang = pickLang({ search: location.search, stored, nav: navigator.language });
  try { localStorage.setItem('lb-lang', lang); } catch (_) { /* private mode */ }
  return lang;
}

export const LANG = detect();

// t({ de: '…', en: '…' }) → the string for the current language; plain strings pass through.
export const t = (s) => (s && typeof s === 'object' ? s[LANG] ?? s.en : s);

// Reload in the other language (keeps the open app in the hash).
export function switchLang(lang) {
  try { localStorage.setItem('lb-lang', lang); } catch (_) { /* private mode */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  location.href = url.toString();
}
