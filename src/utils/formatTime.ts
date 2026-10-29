export function formatTime(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) return "—";
  return ms < 1000
    ? `${Math.round(ms)} ms`
    : `${Number((ms / 1000).toFixed(2))} s`;
}
