// Visitor counting with GoatCounter (https://www.goatcounter.com): no cookies,
// no personal data, so no consent banner. The site is one page with hash
// routes, so besides the initial page view every opened app is counted as a
// path of its own ("/bricks", "/about", ...).
//
// `code` is the GoatCounter site code, e.g. 'lausebengel' for
// https://lausebengel.goatcounter.com. Empty = counting off (local dev).

export function endpointFor(code) {
  return code ? `https://${code}.goatcounter.com/count` : '';
}

// Injects the GoatCounter script once. `doc` is injectable for tests.
export function initAnalytics(code, doc = globalThis.document) {
  const endpoint = endpointFor(code);
  if (!endpoint || !doc || doc.querySelector('script[data-goatcounter]')) return false;
  const s = doc.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', endpoint);
  doc.head.appendChild(s);
  return true;
}

// Counts a view of `path` (an app id, without the leading slash). Silently does
// nothing when the script is not loaded (blocked, offline, counting off).
export function trackView(path, title, gc = globalThis.goatcounter) {
  if (!gc || typeof gc.count !== 'function') return false;
  try {
    gc.count({ path: '/' + String(path).replace(/^\/+/, ''), title: title || path });
    return true;
  } catch {
    return false;
  }
}
