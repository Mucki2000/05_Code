export const APP_IDS = ['home', 'filmtv', 'unternehmen', 'musik', 'current', 'career', 'about', 'bricks'];

export function parseHash(hash) {
  const id = String(hash || '').replace(/^#/, '').toLowerCase();
  return APP_IDS.includes(id) ? id : null;
}
