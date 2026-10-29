import type { HarEntry, Header } from "../types/request";

export type CodeFormat = "curl" | "fetch" | "axios" | "python" | "java";

export const CODE_FORMATS: Array<{ id: CodeFormat; label: string }> = [
  { id: "curl", label: "cURL" },
  { id: "fetch", label: "JavaScript Fetch" },
  { id: "axios", label: "Axios" },
  { id: "python", label: "Python Requests" },
  { id: "java", label: "Java HttpClient" },
];

const TRANSPORT_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "transfer-encoding",
  "keep-alive",
  "proxy-connection",
]);
const BROWSER_HEADERS = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "cookie",
  "date",
  "dnt",
  "expect",
  "origin",
  "permissions-policy",
  "referer",
  "te",
  "trailer",
  "upgrade",
  "user-agent",
  "via",
]);

function headersFor(entry: HarEntry, browser: boolean): Header[] {
  const multipartWithoutBody =
    entry.request.postData?.mimeType
      ?.toLowerCase()
      .startsWith("multipart/form-data") &&
    typeof entry.request.postData.text !== "string";
  const headers = (entry.request.headers || []).filter(({ name }) => {
    const lower = name.toLowerCase();
    return (
      !name.startsWith(":") &&
      !TRANSPORT_HEADERS.has(lower) &&
      !(multipartWithoutBody && lower === "content-type") &&
      !(
        browser &&
        (BROWSER_HEADERS.has(lower) ||
          lower.startsWith("sec-") ||
          lower.startsWith("proxy-"))
      )
    );
  });
  const post = entry.request.postData;
  if (
    post &&
    !multipartWithoutBody &&
    !headers.some(({ name }) => name.toLowerCase() === "content-type")
  ) {
    const mimeType =
      post.mimeType ||
      (post.params?.length ? "application/x-www-form-urlencoded" : undefined);
    if (mimeType) headers.push({ name: "Content-Type", value: mimeType });
  }
  return headers;
}

function payload(entry: HarEntry): { text?: string; incomplete: boolean } {
  const post = entry.request.postData;
  if (typeof post?.text === "string")
    return { text: post.text, incomplete: false };
  if (post?.mimeType?.toLowerCase().startsWith("multipart/form-data"))
    return { incomplete: true };
  if (post?.params?.length) {
    const params = new URLSearchParams();
    for (const param of post.params)
      if (param.value !== undefined) params.append(param.name, param.value);
    return {
      text: params.toString(),
      incomplete: post.params.some((param) => param.value === undefined),
    };
  }
  return { incomplete: false };
}

const js = (value: string) => JSON.stringify(value);
const py = (value: string) => JSON.stringify(value);
const shell = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;
const java = (value: string) =>
  JSON.stringify(value)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

function jsHeaders(headers: Header[]): string {
  return `new Headers([${headers.map(({ name, value }) => `[${js(name)}, ${js(value)}]`).join(", ")}])`;
}

export function generateCode(
  entry: HarEntry,
  format: CodeFormat,
): { code: string; warning?: string } {
  const { method, url } = entry.request;
  const { text: body, incomplete } = payload(entry);
  const headers = headersFor(entry, format === "fetch" || format === "axios");
  const warning = incomplete
    ? "Some form or file fields were unavailable in the capture. Complete the request body before sending."
    : undefined;
  let code: string;

  switch (format) {
    case "curl":
      code = [
        `curl --request ${shell(method)} ${shell(url)}`,
        ...headers.map(
          ({ name, value }) => `  --header ${shell(`${name}: ${value}`)}`,
        ),
        ...(body !== undefined ? [`  --data-raw ${shell(body)}`] : []),
      ].join(" \\\n");
      break;
    case "fetch":
      code = `const response = await fetch(${js(url)}, {\n  method: ${js(method)},\n  headers: ${jsHeaders(headers)}${body !== undefined ? `,\n  body: ${js(body)}` : ""}\n});\nconst data = await response.text();\nconsole.log(response.status, data);`;
      break;
    case "axios":
      code = `import axios from 'axios';\n\nconst response = await axios({\n  method: ${js(method)},\n  url: ${js(url)},\n  headers: Object.fromEntries(${jsHeaders(headers)})${body !== undefined ? `,\n  data: ${js(body)}` : ""}\n});\nconsole.log(response.status, response.data);`;
      break;
    case "python":
      code = `import requests\n\nresponse = requests.request(\n    ${py(method)},\n    ${py(url)},\n    headers={${headers.map(({ name, value }) => `\n        ${py(name)}: ${py(value)},`).join("")}\n    }${body !== undefined ? `,\n    data=${py(body)}` : ""},\n)\nprint(response.status_code, response.text)`;
      break;
    case "java":
      code = `import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\npublic class RequestExample {\n    public static void main(String[] args) throws Exception {\n        HttpRequest request = HttpRequest.newBuilder()\n            .uri(URI.create(${java(url)}))${headers.map(({ name, value }) => `\n            .header(${java(name)}, ${java(value)})`).join("")}\n            .method(${java(method)}, ${body !== undefined ? `HttpRequest.BodyPublishers.ofString(${java(body)})` : "HttpRequest.BodyPublishers.noBody()"})\n            .build();\n        HttpResponse<String> response = HttpClient.newHttpClient()\n            .send(request, HttpResponse.BodyHandlers.ofString());\n        System.out.println(response.statusCode() + " " + response.body());\n    }\n}`;
  }

  if (warning)
    code = `${format === "curl" || format === "python" ? "#" : "//"} ${warning}\n${code}`;
  return { code, warning };
}
