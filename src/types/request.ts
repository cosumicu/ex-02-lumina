export interface Header {
  name: string;
  value: string;
}
export interface QueryParameter {
  name: string;
  value: string;
}
export interface HarEntry {
  startedDateTime?: string;
  time?: number;
  request: {
    method: string;
    url: string;
    headers?: Header[];
    queryString?: QueryParameter[];
    postData?: {
      mimeType?: string;
      text?: string;
      params?: Array<{ name: string; value?: string }>;
    };
  };
  response: {
    status?: number;
    statusText?: string;
    headers?: Header[];
    content?: { mimeType?: string };
  };
  getContent?: (
    callback: (
      content: string | { content?: string; encoding?: string },
      encoding?: string,
    ) => void,
  ) => void;
}
export interface ResponseBody {
  text: string;
  base64: boolean;
}
export interface InspectorRequest {
  id: string;
  entry: HarEntry;
  body?: ResponseBody;
  bodyLoading?: boolean;
}
export type MethodFilter =
  "All" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "Errors";
