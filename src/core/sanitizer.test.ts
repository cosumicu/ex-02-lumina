import { describe, expect, it } from "vitest";
import {
  isSensitiveName,
  sanitizeBody,
  sanitizeEntryForCopy,
  sanitizeHeaders,
  sanitizeUrl,
  savedMetadata,
} from "./sanitizer";
import { CODE_FORMATS, generateCode } from "./codegen";
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
    expect(sanitizeUrl("https://example.test/api?sort=asc")).not.toContain(
      "asc",
    );
    expect(sanitizeUrl("https://user:pass@example.test/api")).not.toContain(
      "pass",
    );
    expect(sanitizeUrl("not a URL")).toBe("[REDACTED URL]");
    expect(isSensitiveName("X-Api-Key")).toBe(true);
    expect(sanitizeBody("plain-text-secret")).toBe("[REDACTED BODY]");
  });
  it("masks request values before generating shareable code", () => {
    const request: InspectorRequest = {
      id: "1",
      entry: {
        request: {
          method: "POST",
          url: "https://example.test/api?sort=private-sort&token=private-token",
          headers: [
            { name: "Authorization", value: "Bearer private-header" },
            { name: "X-Custom", value: "private-custom" },
          ],
          postData: {
            mimeType: "application/json",
            text: '{"value":"private-body"}',
          },
        },
        response: {
          status: 200,
          headers: [{ name: "X-Secret", value: "private-response" }],
        },
      },
    };
    const safe = sanitizeEntryForCopy(request.entry);
    expect(JSON.stringify(safe)).not.toMatch(
      /private-(sort|token|header|custom|body|response)/,
    );
    for (const format of CODE_FORMATS) {
      const code = generateCode(safe, format.id).code;
      expect(code).not.toMatch(
        /private-(sort|token|header|custom|body|response)/,
      );
      expect(code).toContain("[REDACTED");
    }
  });
  it("masks captured query and form values without changing the original", () => {
    const entry: InspectorRequest["entry"] = {
      request: {
        method: "POST",
        url: "https://example.test/form?tag=first&tag=second",
        queryString: [{ name: "tag", value: "private-query" }],
        postData: {
          mimeType: "application/x-www-form-urlencoded",
          params: [{ name: "note", value: "private-form" }],
        },
      },
      response: { status: 200 },
    };
    const safe = sanitizeEntryForCopy(entry);
    expect(safe.request.url).not.toMatch(/first|second/);
    expect(safe.request.url.match(/tag=/g)).toHaveLength(2);
    expect(safe.request.queryString?.[0].value).toBe("[REDACTED]");
    expect(safe.request.postData?.params?.[0].value).toBe("[REDACTED]");
    expect(generateCode(safe, "curl").code).not.toContain("private-form");
    expect(entry.request.postData?.params?.[0].value).toBe("private-form");
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
