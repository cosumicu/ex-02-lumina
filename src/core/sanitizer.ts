import type { Header, InspectorRequest } from "../types/request";

const SECRET =
  /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api-key)$/i;
const SENSITIVE_PARAM = /(token|secret|password|key|auth|session|account)/i;

export function sanitizeHeaders(headers?: Header[]): Header[] {
  return (headers || []).map((header) => ({
    ...header,
    value: SECRET.test(header.name) ? "[REDACTED]" : header.value,
  }));
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of parsed.searchParams.keys())
      if (SENSITIVE_PARAM.test(key)) parsed.searchParams.set(key, "[REDACTED]");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function savedMetadata(request: InspectorRequest) {
  const { entry } = request;
  let origin = "";
  try {
    origin = new URL(entry.request.url).origin;
  } catch {
    /* Omit malformed URLs. */
  }
  return {
    id: request.id,
    startedDateTime: entry.startedDateTime || "",
    method: entry.request.method,
    url: origin,
    status: entry.response.status || 0,
    time: entry.time || 0,
  };
}
