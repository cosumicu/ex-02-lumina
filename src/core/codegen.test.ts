import { describe, expect, it } from 'vitest';
import { CODE_FORMATS, generateCode } from './codegen';
import type { HarEntry } from '../types/request';

const entry: HarEntry = {
  request: {
    method: 'PATCH',
    url: 'https://example.test/items?q=a%20b&token=one',
    headers: [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Authorization', value: 'Bearer secret' },
      { name: 'X-Note', value: "it's quoted" },
      { name: 'Content-Length', value: '42' },
      { name: 'Cookie', value: 'session=abc' }
    ],
    postData: { mimeType: 'application/json', text: '{"name":"O\'Brien"}' }
  },
  response: {}
};

describe('request code generation', () => {
  it('offers every requested format with the captured method, URL, and body', () => {
    expect(CODE_FORMATS.map(format => format.label)).toEqual(['cURL', 'JavaScript Fetch', 'Axios', 'Python Requests', 'Java HttpClient']);
    for (const format of CODE_FORMATS) {
      const { code, warning } = generateCode(entry, format.id);
      expect(code).toContain('PATCH');
      expect(code).toContain('https://example.test/items?q=a%20b&token=one');
      expect(code).toContain('O');
      expect(code).toContain('Brien');
      expect(code).toContain('Bearer secret');
      expect(code).not.toContain('Content-Length');
      expect(warning).toBeUndefined();
    }
  });

  it('escapes cURL shell values and omits browser controlled headers in JavaScript', () => {
    expect(generateCode(entry, 'curl').code).toContain(`'"'"'`);
    expect(generateCode(entry, 'curl').code).toContain("--header 'Cookie: session=abc'");
    for (const format of ['fetch', 'axios'] as const) {
      const code = generateCode(entry, format).code;
      expect(code).not.toContain('Cookie');
      expect(code).toContain('new Headers(');
    }
  });

  it('does not invent a body for a request without one', () => {
    const get: HarEntry = { request: { method: 'GET', url: 'https://example.test' }, response: {} };
    expect(generateCode(get, 'curl').code).not.toContain('--data-raw');
    expect(generateCode(get, 'fetch').code).not.toContain('body:');
    expect(generateCode(get, 'java').code).toContain('BodyPublishers.noBody()');
  });

  it('warns when a form value was not captured', () => {
    const form: HarEntry = { request: { method: 'POST', url: 'https://example.test/upload', postData: { params: [{ name: 'title', value: 'hello world' }, { name: 'file' }] } }, response: {} };
    const result = generateCode(form, 'python');
    expect(result.code).toContain('title=hello+world');
    expect(result.warning).toMatch(/unavailable/);
  });

  it('does not turn an uncaptured multipart body into URL encoded data', () => {
    const upload: HarEntry = { request: { method: 'POST', url: 'https://example.test/upload', headers: [{ name: 'Content-Type', value: 'multipart/form-data; boundary=old' }], postData: { mimeType: 'multipart/form-data; boundary=old', params: [{ name: 'file' }] } }, response: {} };
    const result = generateCode(upload, 'curl');
    expect(result.warning).toBeDefined();
    expect(result.code).not.toContain('--data-raw');
    expect(result.code).not.toContain('boundary=old');
  });
});
