import { describe, expect, it } from 'vitest';
import { isHttpUrl, matchesRequest, requestPath } from './filters';
import type { HarEntry } from '../types/request';

const entry: HarEntry = {
  request: { method: 'POST', url: 'https://example.test/api/users?q=one' },
  response: { status: 404 }, time: 123
};

describe('request filters', () => {
  it('combines method, search, status groups, exact codes and errors', () => {
    expect(matchesRequest(entry, 'users', 'POST', '4xx')).toBe(true);
    expect(matchesRequest(entry, '', 'All', '404')).toBe(true);
    expect(matchesRequest(entry, '', 'Errors', '')).toBe(true);
    expect(matchesRequest(entry, '', 'GET', '')).toBe(false);
    expect(matchesRequest(entry, '', 'All', '5xx')).toBe(false);
    expect(matchesRequest(entry, 'missing', 'All', '')).toBe(false);
  });
  it('accepts only HTTP traffic and presents endpoint paths', () => {
    expect(isHttpUrl(entry.request.url)).toBe(true);
    expect(isHttpUrl('data:text/plain,x')).toBe(false);
    expect(requestPath(entry.request.url)).toBe('/api/users?q=one');
  });
});
