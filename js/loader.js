// Loading progress in percent for a boot that lasts `duration` ms.
// Fast to 64 %, a short stall (a nod to the original screen mock-up),
// then the rest.
export function progressAt(t, duration = 6000) {
  if (t <= 0) return 0;
  if (t >= duration) return 100;
  const x = t / duration;
  if (x < 0.55) return Math.round(64 * (x / 0.55));
  if (x < 0.70) return 64;
  return Math.round(64 + 36 * ((x - 0.70) / 0.30));
}
