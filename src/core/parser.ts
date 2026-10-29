import type {
  HarEntry,
  Header,
  QueryParameter,
  ResponseBody,
} from "../types/request";

export function queryParameters(entry: HarEntry): QueryParameter[] {
  if (entry.request.queryString?.length) return entry.request.queryString;
  try {
    return [...new URL(entry.request.url).searchParams].map(
      ([name, value]) => ({ name, value }),
    );
  } catch {
    return [];
  }
}

export function requestBody(entry: HarEntry): string {
  const post = entry.request.postData;
  if (typeof post?.text === "string") return post.text;
  if (post?.params?.length)
    return post.params
      .map((param) => `${param.name}=${param.value ?? "[file or unavailable]"}`)
      .join("&");
  return "";
}

export function headerText(headers?: Header[]): string {
  return (headers || [])
    .map(({ name, value }) => `${name}: ${value}`)
    .join("\n");
}

export function contentType(entry: HarEntry): string {
  return (
    entry.response.content?.mimeType ||
    entry.response.headers?.find((h) => h.name.toLowerCase() === "content-type")
      ?.value ||
    "Content type unavailable"
  );
}

export function normalizeContent(
  content: string | { content?: string; encoding?: string },
  encoding?: string,
): ResponseBody {
  if (typeof content === "object" && content !== null)
    return {
      text: content.content || "",
      base64: content.encoding === "base64",
    };
  return {
    text: typeof content === "string" ? content : "",
    base64: encoding === "base64",
  };
}
