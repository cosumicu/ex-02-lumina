import { describe, expect, it } from "vitest";
import {
  durationFilterError,
  isHttpUrl,
  isValidStatusFilter,
  matchesRequest,
  requestHost,
  requestPath,
} from "./filters";
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
  it("validates status input and leaves invalid input unapplied", () => {
    for (const value of [
      "",
      "404",
      " 4XX ",
      "error",
      "no response",
      "failed",
      "100",
      "599",
    ])
      expect(isValidStatusFilter(value)).toBe(true);
    for (const value of ["4", "4x", "000", "600", "404x", "timeout"])
      expect(isValidStatusFilter(value)).toBe(false);
    expect(matchesRequest(entry, "", "All", "4x")).toBe(true);
    expect(matchesRequest(entry, "", "All", "500")).toBe(false);
  });
  it("accepts only HTTP traffic and presents endpoint paths", () => {
    expect(isHttpUrl(entry.request.url)).toBe(true);
    expect(isHttpUrl("data:text/plain,x")).toBe(false);
    expect(requestPath(entry.request.url)).toBe("/api/users");
    expect(requestHost(entry.request.url)).toBe("example.test");
  });
  it("combines inclusive duration and response type filters", () => {
    const typed: HarEntry = {
      ...entry,
      time: 125.5,
      response: {
        status: 200,
        headers: [
          { name: "Content-Type", value: "Application/JSON; charset=utf-8" },
        ],
      },
    };
    const filters = {
      minDuration: "100",
      maxDuration: "125.5",
      contentType: "json",
    };
    expect(matchesRequest(typed, "users", "POST", "2xx", filters)).toBe(true);
    expect(
      matchesRequest(typed, "", "All", "", {
        ...filters,
        minDuration: "126",
        maxDuration: "",
      }),
    ).toBe(false);
    expect(
      matchesRequest(typed, "", "All", "", {
        ...filters,
        contentType: "image/",
      }),
    ).toBe(false);
    expect(
      matchesRequest({ ...typed, time: undefined }, "", "All", "", filters),
    ).toBe(false);
    expect(matchesRequest(entry, "", "All", "", filters)).toBe(false);
  });
  it("validates duration bounds and ignores an invalid duration range", () => {
    expect(durationFilterError("", "")).toBe("");
    expect(durationFilterError("0.5", "100")).toBe("");
    expect(durationFilterError("-1", "")).toMatch(/non-negative/);
    expect(durationFilterError("abc", "")).toMatch(/non-negative/);
    expect(durationFilterError("200", "100")).toMatch(/Minimum/);
    expect(
      matchesRequest(entry, "", "All", "", {
        minDuration: "200",
        maxDuration: "100",
        contentType: "",
      }),
    ).toBe(true);
  });
});
