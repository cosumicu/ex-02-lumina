export const RETENTION_OPTIONS = [10, 20, 50] as const;
export type RetentionLimit = (typeof RETENTION_OPTIONS)[number];
const KEY = "lumina-saved-session-limit";

export function getRetentionLimit(): RetentionLimit {
  try {
    const value = Number(localStorage.getItem(KEY));
    if (RETENTION_OPTIONS.includes(value as RetentionLimit))
      return value as RetentionLimit;
  } catch {
    // Use the default if local storage is unavailable.
  }
  return 20;
}

export function setRetentionLimit(limit: RetentionLimit): void {
  localStorage.setItem(KEY, String(limit));
}
