import { describe, expect, it } from "vitest";
import { sanitizeHeaders, sanitizeUrl, savedMetadata } from "./sanitizer";
import type { InspectorRequest } from "../types/request";

describe("optional persistence sanitization", () => {
  it("redacts common secrets in headers and URLs", () => {
    expect(
      sanitizeHeaders([{ name: "Authorization", value: "Bearer secret" }])[0]
        .value,
    ).toBe("[REDACTED]");
    expect(
      sanitizeUrl("https://example.test/api?token=secret&sort=asc"),
    ).toContain("token=%5BREDACTED%5D");
  });
  it("persists metadata without payloads or headers", () => {
    const request: InspectorRequest = {
      id: "1",
      entry: {
        request: {
          method: "POST",
          url: "https://example.test/?token=secret",
          postData: { text: "secret-body" },
          headers: [{ name: "Authorization", value: "secret" }],
        },
        response: { status: 200 },
        time: 50,
      },
    };
    const saved = JSON.stringify(savedMetadata(request));
    expect(saved).not.toContain("secret-body");
    expect(saved).not.toContain("Authorization");
    expect(saved).not.toContain("token=secret");
    expect(saved).not.toContain("/?");
  });
});
