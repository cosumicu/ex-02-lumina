import { afterEach, describe, expect, it, vi } from "vitest";
import { clearCapture, loadResponseBody, startCapture } from "./capture";
import {
  discardedRequests,
  MAX_REQUESTS,
  recording,
  requests,
  selectRequest,
} from "../panel/stores/requestStore";
import type { HarEntry } from "../types/request";

function entry(url: string, content = '{"ok":true}'): HarEntry {
  return {
    startedDateTime: new Date().toISOString(),
    time: 80,
    request: { method: "GET", url },
    response: { status: 200 },
    getContent: (callback) => callback({ content, encoding: "" }),
  };
}

afterEach(() => {
  clearCapture();
  vi.unstubAllGlobals();
});

describe("DevTools capture", () => {
  it("merges HAR history with live events, honors pause, and loads a body on selection", async () => {
    const first = entry("https://example.test/api/first");
    const second = entry("https://example.test/api/second");
    let listener: ((value: HarEntry) => void) | undefined;
    vi.stubGlobal("chrome", {
      devtools: {
        network: {
          onRequestFinished: {
            addListener: (fn: (value: HarEntry) => void) => {
              listener = fn;
            },
            removeListener: () => {},
          },
          getHAR: (callback: (value: { entries: HarEntry[] }) => void) =>
            callback({ entries: [first] }),
        },
      },
    });
    const stop = startCapture();
    await Promise.resolve();
    expect(requests.value).toHaveLength(1);
    listener?.(first);
    expect(requests.value).toHaveLength(1);
    recording.value = false;
    listener?.(second);
    expect(requests.value).toHaveLength(1);
    recording.value = true;
    listener?.(second);
    await Promise.resolve();
    expect(requests.value).toHaveLength(2);
    selectRequest(requests.value[1].id);
    loadResponseBody(requests.value[1]);
    expect(requests.value[1].body?.text).toBe('{"ok":true}');
    clearCapture();
    expect(requests.value).toHaveLength(0);
    expect(recording.value).toBe(true);
    stop();
  });

  it("counts requests displaced both before and after a queued capture flush", async () => {
    const history = Array.from({ length: MAX_REQUESTS + 3 }, (_, index) =>
      entry(`https://example.test/api/${index}`),
    );
    let listener: ((value: HarEntry) => void) | undefined;
    vi.stubGlobal("chrome", {
      devtools: {
        network: {
          onRequestFinished: {
            addListener: (fn: (value: HarEntry) => void) => {
              listener = fn;
            },
            removeListener: () => {},
          },
          getHAR: (callback: (value: { entries: HarEntry[] }) => void) =>
            callback({ entries: history }),
        },
      },
    });
    const stop = startCapture();
    await Promise.resolve();
    expect(requests.value).toHaveLength(MAX_REQUESTS);
    expect(discardedRequests.value).toBe(3);
    listener?.(entry("https://example.test/api/new"));
    await Promise.resolve();
    expect(requests.value).toHaveLength(MAX_REQUESTS);
    expect(discardedRequests.value).toBe(4);
    clearCapture();
    expect(discardedRequests.value).toBe(0);
    stop();
  });
});
