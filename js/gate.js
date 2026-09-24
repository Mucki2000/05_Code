export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isUnlocked(id, storage) {
  try { return storage.getItem('lb-unlock-' + id) === '1'; } catch { return false; }
}

export function markUnlocked(id, storage) {
  try { storage.setItem('lb-unlock-' + id, '1'); } catch { /* private mode */ }
}
