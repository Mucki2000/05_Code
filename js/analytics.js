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

// Views requested before count.js has loaded (deep links, fast clicks) wait
// here and are flushed by the script's load event.
const queue = [];
let enabled = false;

export function pendingViews() { return queue.length; }

// Injects the GoatCounter script once. `doc` is injectable for tests.
export function initAnalytics(code, doc = globalThis.document) {
  const endpoint = endpointFor(code);
  if (!endpoint || !doc || doc.querySelector('script[data-goatcounter]')) return false;
  enabled = true;
  const s = doc.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', endpoint);
  s.addEventListener('load', () => flush());
  doc.head.appendChild(s);
  return true;
}

function send(gc, view) {
  try { gc.count(view); return true; } catch { return false; }
}

export function flush(gc = globalThis.goatcounter) {
  if (!gc || typeof gc.count !== 'function') return 0;
  let n = 0;
  while (queue.length) if (send(gc, queue.shift())) n++;
  return n;
}

// Counts a view of `path` (an app id, without the leading slash). Queues it
// while count.js is still loading; drops it when counting is off.
export function trackView(path, title, gc = globalThis.goatcounter) {
  const view = { path: '/' + String(path).replace(/^\/+/, ''), title: title || path };
  if (gc && typeof gc.count === 'function') return send(gc, view);
  if (enabled) { queue.push(view); return true; }
  return false;
}
