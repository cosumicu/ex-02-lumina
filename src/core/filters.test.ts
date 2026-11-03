import { describe, expect, it } from "vitest";
import { isHttpUrl, matchesRequest, requestHost, requestPath } from "./filters";
import type { HarEntry } from "../types/request";

const entry: HarEntry = {
  request: { method: "POST", url: "https://example.test/api/users?q=one" },
  response: { status: 404 },
  time: 123,
};

describe("request filters", () => {
  it("combines method, search, status groups, exact codes and HTTP errors", () => {
    expect(matchesRequest(entry, "users", "POST", "4xx")).toBe(true);
    expect(matchesRequest(entry, "", "All", "404")).toBe(true);
    expect(matchesRequest(entry, "", "HTTP errors", "")).toBe(true);
    expect(matchesRequest(entry, "", "No response", "")).toBe(false);
    expect(matchesRequest(entry, "", "GET", "")).toBe(false);
    expect(matchesRequest(entry, "", "All", "5xx")).toBe(false);
    expect(matchesRequest(entry, "missing", "All", "")).toBe(false);
  });
  it("separates requests without an HTTP response from HTTP errors", () => {
    const noResponse: HarEntry = {
      ...entry,
      response: { status: 0, statusText: "net::ERR_CONNECTION_REFUSED" },
    };
    expect(matchesRequest(noResponse, "", "No response", "")).toBe(true);
    expect(matchesRequest(noResponse, "", "HTTP errors", "")).toBe(false);
    expect(matchesRequest(noResponse, "", "All", "no response")).toBe(true);
    expect(matchesRequest(noResponse, "", "All", "error")).toBe(false);
    expect(matchesRequest(entry, "", "All", "no response")).toBe(false);
  });
  it("accepts only HTTP traffic and presents endpoint paths", () => {
    expect(isHttpUrl(entry.request.url)).toBe(true);
    expect(isHttpUrl("data:text/plain,x")).toBe(false);
    expect(requestPath(entry.request.url)).toBe("/api/users");
    expect(requestHost(entry.request.url)).toBe("example.test");
  });
});
