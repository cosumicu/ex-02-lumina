import type { HarEntry, MethodFilter } from "../types/request";

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function requestPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return url || "Unknown request";
  }
}

export function requestHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "Unknown host";
  }
}

export function statusCode(entry: HarEntry): number {
  return Number(entry.response?.status) || 0;
}

export function isHttpError(code: number): boolean {
  return code >= 400 && code <= 599;
}

type StatusCriterion =
  | { kind: "all" | "error" | "no-response" | "invalid" }
  | { kind: "class"; hundreds: number }
  | { kind: "exact"; code: number };

function parseStatusFilter(input: string): StatusCriterion {
  const value = input.trim().toLowerCase();
  if (!value) return { kind: "all" };
  if (value === "error") return { kind: "error" };
  if (value === "no response" || value === "failed")
    return { kind: "no-response" };
  if (/^[1-5]xx$/.test(value))
    return { kind: "class", hundreds: Number(value[0]) };
  if (/^[1-5]\d{2}$/.test(value)) return { kind: "exact", code: Number(value) };
  return { kind: "invalid" };
}

export function isValidStatusFilter(input: string): boolean {
  return parseStatusFilter(input).kind !== "invalid";
}

export function matchesRequest(
  entry: HarEntry,
  search: string,
  method: MethodFilter,
  status: string,
): boolean {
  const code = statusCode(entry);
  if (method === "HTTP errors") {
    if (!isHttpError(code)) return false;
  } else if (method === "No response") {
    if (code !== 0) return false;
  } else if (method !== "All" && entry.request.method.toUpperCase() !== method)
    return false;
  const criterion = parseStatusFilter(status);
  if (criterion.kind === "error" && !isHttpError(code)) return false;
  if (criterion.kind === "no-response" && code !== 0) return false;
  if (
    criterion.kind === "class" &&
    Math.floor(code / 100) !== criterion.hundreds
  )
    return false;
  if (criterion.kind === "exact" && code !== criterion.code) return false;
  const needle = search.trim().toLowerCase();
  return (
    !needle ||
    `${entry.request.method} ${entry.request.url}`
      .toLowerCase()
      .includes(needle)
  );
}
