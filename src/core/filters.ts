import type { HarEntry, MethodFilter } from "../types/request";

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function requestPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname || "/"}${parsed.search}`;
  } catch {
    return url || "Unknown request";
  }
}

export function matchesRequest(
  entry: HarEntry,
  search: string,
  method: MethodFilter,
  status: string,
): boolean {
  const code = Number(entry.response?.status) || 0;
  if (method === "Errors") {
    if (code < 400 || code > 599) return false;
  } else if (method !== "All" && entry.request.method.toUpperCase() !== method)
    return false;
  const value = status.trim().toLowerCase();
  if (value === "error" && (code < 400 || code > 599)) return false;
  if (/^[1-5]xx$/.test(value) && Math.floor(code / 100) !== Number(value[0]))
    return false;
  if (/^\d{3}$/.test(value) && code !== Number(value)) return false;
  const needle = search.trim().toLowerCase();
  return (
    !needle ||
    `${entry.request.method} ${entry.request.url}`
      .toLowerCase()
      .includes(needle)
  );
}
