import { describe, expect, it } from 'vitest';
import { normalizeContent, queryParameters, requestBody } from './parser';
import { formatBody, jsonTokens } from '../utils/formatJson';
import type { HarEntry } from '../types/request';

const entry: HarEntry = { request: { method: 'POST', url: 'https://example.test/api?a=1', postData: { mimeType: 'application/json', text: '{"ok":true}' } }, response: {} };

describe('request parsing', () => {
  it('reads query and payload details', () => {
    expect(queryParameters(entry)).toEqual([{ name: 'a', value: '1' }]);
    expect(requestBody(entry)).toBe('{"ok":true}');
  });
  it('supports both Chrome response callback forms', () => {
    expect(normalizeContent('hello', '')).toEqual({ text: 'hello', base64: false });
    expect(normalizeContent({ content: 'YWJj', encoding: 'base64' })).toEqual({ text: 'YWJj', base64: true });
  });
  it('formats JSON while leaving untrusted content as text tokens', () => {
    const result = formatBody('{"x":"<img src=x>"}', 'application/json');
    expect(result.json).toBe(true);
    expect(jsonTokens(result.text).some(token => token.text.includes('<img'))).toBe(true);
    expect(formatBody('{bad', 'application/json').text).toBe('{bad');
    expect(formatBody('x'.repeat(1_000_001)).truncated).toBe(true);
  });
});
