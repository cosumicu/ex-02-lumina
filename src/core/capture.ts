import { isHttpUrl } from './filters';
import { normalizeContent } from './parser';
import { addRequests, clearRequests, MAX_REQUESTS, recording, requests, selectedId, updateRequest } from '../panel/stores/requestStore';
import type { HarEntry, InspectorRequest } from '../types/request';

let generation = 0;
let sequence = 0;
const keys = new Set<string>();
const pending = new Set<string>();
const queued: InspectorRequest[] = [];
let flushScheduled = false;

function keyOf(entry: HarEntry): string {
  return `${entry.startedDateTime || ''}\u0000${entry.request.method}\u0000${entry.request.url}\u0000${entry.time || ''}`;
}

function capture(entry: HarEntry): void {
  if (!recording.peek() || !isHttpUrl(entry.request?.url || '')) return;
  const key = keyOf(entry);
  if (keys.has(key)) return;
  keys.add(key);
  const request: InspectorRequest = { id: String(++sequence), entry };
  queued.push(request);
  if (queued.length > MAX_REQUESTS) keys.delete(keyOf(queued.shift()!.entry));
  if (!flushScheduled) {
    flushScheduled = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
    else queueMicrotask(flush);
  }
}

function flush(): void {
  flushScheduled = false;
  if (!queued.length) return;
  addRequests(queued.splice(0));
  keys.clear();
  for (const request of requests.peek()) keys.add(keyOf(request.entry));
}

export function clearCapture(): void {
  generation++;
  keys.clear();
  pending.clear();
  queued.length = 0;
  clearRequests();
}

export function startCapture(): () => void {
  if (typeof chrome === 'undefined' || !chrome.devtools?.network) return () => {};
  const initialGeneration = generation;
  const listener = (entry: chrome.devtools.network.Request) => capture(entry as unknown as HarEntry);
  chrome.devtools.network.onRequestFinished.addListener(listener);
  chrome.devtools.network.getHAR(har => {
    if (initialGeneration !== generation) return;
    for (const entry of har?.entries || []) capture(entry as unknown as HarEntry);
  });
  return () => chrome.devtools.network.onRequestFinished.removeListener(listener);
}

export function loadResponseBody(request: InspectorRequest): void {
  if (request.body || request.bodyLoading || pending.has(request.id)) return;
  if (typeof request.entry.getContent !== 'function') {
    updateRequest(request.id, { body: { text: '', base64: false } });
    return;
  }
  const token = generation;
  pending.add(request.id);
  updateRequest(request.id, { bodyLoading: true });
  try {
    request.entry.getContent((content, encoding) => {
      pending.delete(request.id);
      if (token !== generation || selectedId.peek() !== request.id) return;
      updateRequest(request.id, { body: normalizeContent(content, encoding), bodyLoading: false });
    });
  } catch {
    pending.delete(request.id);
    updateRequest(request.id, { body: { text: '', base64: false }, bodyLoading: false });
  }
}
