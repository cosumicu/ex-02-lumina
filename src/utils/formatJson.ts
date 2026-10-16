export const MAX_PREVIEW_CHARS = 1_000_000;

export function formatBody(text: string, mimeType = ''): { text: string; json: boolean; truncated: boolean } {
  if (!text) return { text: '', json: false, truncated: false };
  const tooLarge = text.length > MAX_PREVIEW_CHARS;
  let output = tooLarge ? text.slice(0, MAX_PREVIEW_CHARS) : text;
  let json = false;
  if (!tooLarge && (/\bjson\b|\+json\b/i.test(mimeType) || /^\s*[\[{]/.test(text))) {
    try { output = JSON.stringify(JSON.parse(text), null, 2); json = true; }
    catch { /* Preserve malformed JSON for inspection. */ }
  }
  const truncated = tooLarge || output.length > MAX_PREVIEW_CHARS;
  return { text: truncated ? output.slice(0, MAX_PREVIEW_CHARS) : output, json, truncated };
}

export function jsonTokens(text: string): Array<{ text: string; kind?: 'key' | 'string' | 'number' | 'literal' }> {
  const token = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false|null)\b/g;
  const parts: Array<{ text: string; kind?: 'key' | 'string' | 'number' | 'literal' }> = [];
  let cursor = 0;
  for (const match of text.matchAll(token)) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index) });
    parts.push({ text: match[0], kind: match[1] ? 'key' : match[2] ? 'string' : match[3] ? 'number' : 'literal' });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
