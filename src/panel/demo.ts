import { addRequest } from './stores/requestStore';
import type { HarEntry } from '../types/request';

const examples: Array<[string, string, number, number]> = [
  ['GET', '/api/v1/accounts', 200, 142],
  ['POST', '/api/v1/transactions', 201, 328],
  ['GET', '/api/v1/users/99', 404, 89],
  ['POST', '/api/v1/transfer', 500, 1200]
];

export function loadDemo(): void {
  examples.slice().reverse().forEach(([method, path, status, time], index) => {
    const entry: HarEntry = {
      startedDateTime: new Date(Date.now() - index * 1000).toISOString(), time,
      request: { method, url: `https://example.test${path}`, headers: [{ name: 'Accept', value: 'application/json' }] },
      response: { status, statusText: status >= 400 ? 'Error' : 'OK', headers: [{ name: 'content-type', value: 'application/json' }], content: { mimeType: 'application/json' } },
      getContent: callback => callback('{"ok":true,"example":"preview"}', '')
    };
    addRequest({ id: `demo-${index}`, entry });
  });
}
