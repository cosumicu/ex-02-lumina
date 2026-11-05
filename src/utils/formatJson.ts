export const MAX_PREVIEW_CHARS = 1_000_000;
export const INITIAL_PREVIEW_CHARS = 32_000;
const MAX_FORMAT_CHARS = 64_000;

export function formatBody(
  text: string,
  mimeType = "",
  limit = MAX_PREVIEW_CHARS,
): { text: string; json: boolean; truncated: boolean } {
  if (!text) return { text: "", json: false, truncated: false };
  const previewLength = Math.max(1, Math.min(limit, MAX_PREVIEW_CHARS));
  const tooLarge = text.length > previewLength;
  let output = tooLarge ? text.slice(0, previewLength) : text;
  let json = false;
  if (
    !tooLarge &&
    text.length <= MAX_FORMAT_CHARS &&
    (/\bjson\b|\+json\b/i.test(mimeType) || /^\s*[{[]/.test(text))
  ) {
    try {
      const pretty = JSON.stringify(JSON.parse(text), null, 2);
      if (pretty.length <= MAX_FORMAT_CHARS) {
        output = pretty;
        json = true;
      }
    } catch {
      /* Preserve malformed JSON for inspection. */
    }
  }
  const truncated = tooLarge || output.length > previewLength;
  return {
    text: truncated ? output.slice(0, previewLength) : output,
    json,
    truncated,
  };
}

export function jsonTokens(
  text: string,
): Array<{ text: string; kind?: "key" | "string" | "number" | "literal" }> {
  const token =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false|null)\b/g;
  const parts: Array<{
    text: string;
    kind?: "key" | "string" | "number" | "literal";
  }> = [];
  let cursor = 0;
  for (const match of text.matchAll(token)) {
    if (match.index > cursor)
      parts.push({ text: text.slice(cursor, match.index) });
    parts.push({
      text: match[0],
      kind: match[1]
        ? "key"
        : match[2]
          ? "string"
          : match[3]
            ? "number"
            : "literal",
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
