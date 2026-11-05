import type { HarEntry, Header, InspectorRequest } from "../types/request";

const SENSITIVE_NAME =
  /(authorization|cookie|token|secret|password|key|auth|session|account|credential|csrf)/i;

export function isSensitiveName(name: string): boolean {
  return SENSITIVE_NAME.test(name);
}

export function sanitizeHeaders(headers?: Header[]): Header[] {
  return (headers || []).map((header) => ({
    ...header,
    value: header.value ? "[REDACTED]" : "",
  }));
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username) parsed.username = "REDACTED";
    if (parsed.password) parsed.password = "REDACTED";
    const redactedParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams)
      redactedParams.append(key, value ? "[REDACTED]" : "");
    parsed.search = redactedParams.toString();
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "[REDACTED URL]";
  }
}

export function sanitizeBody(text: string): string {
  return text ? "[REDACTED BODY]" : "";
}

export function sanitizeEntryForCopy(entry: HarEntry): HarEntry {
  const postData = entry.request.postData;
  return {
    ...entry,
    request: {
      ...entry.request,
      url: sanitizeUrl(entry.request.url),
      headers: sanitizeHeaders(entry.request.headers),
      queryString: entry.request.queryString?.map((param) => ({
        ...param,
        value: param.value ? "[REDACTED]" : "",
      })),
      postData: postData && {
        ...postData,
        text:
          typeof postData.text === "string"
            ? sanitizeBody(postData.text)
            : undefined,
        params: postData.params?.map((param) => ({
          ...param,
          value: param.value === undefined ? undefined : "[REDACTED]",
        })),
      },
    },
    response: {
      ...entry.response,
      headers: sanitizeHeaders(entry.response.headers),
    },
  };
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
