import { useEffect, useRef, useState } from "preact/hooks";
import { Copy, X } from "lucide-preact";
import { loadResponseBody } from "../../core/capture";
import {
  CODE_FORMATS,
  generateCode,
  type CodeFormat,
} from "../../core/codegen";
import {
  contentType,
  headerText,
  queryParameters,
  requestBody,
} from "../../core/parser";
import {
  isHttpError,
  requestHost,
  requestPath,
  statusCode,
} from "../../core/filters";
import { formatBody, jsonTokens } from "../../utils/formatJson";
import { formatTime } from "../../utils/formatTime";
import { selectRequest, selectedRequest } from "../stores/requestStore";
import type { Header } from "../../types/request";

const DETAIL_TABS = ["Request", "Response", "Code"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

function Pairs({ items }: { items: Header[] }) {
  if (!items.length)
    return <p class="px-3 py-2 text-sm text-[#89918b]">None available</p>;
  return (
    <div class="divide-y divide-[#edf0ed]">
      {items.map(({ name, value }, index) => (
        <div
          key={`${name}-${index}`}
          class="grid grid-cols-[minmax(95px,30%)_minmax(0,1fr)] gap-3 px-3 py-2 text-[13px]"
        >
          <span class="break-all font-medium text-[#306caa]">{name}</span>
          <span class="max-h-32 overflow-auto break-all whitespace-pre-wrap text-[#383d3a]">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Body({
  text,
  mimeType,
  fallback,
}: {
  text: string;
  mimeType?: string;
  fallback: string;
}) {
  if (!text) return <p class="px-3 py-2 text-sm text-[#89918b]">{fallback}</p>;
  const formatted = formatBody(text, mimeType);
  return (
    <div class="max-h-[44vh] overflow-auto px-3 py-2">
      <pre class="whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-[#333b35]">
        {formatted.json
          ? jsonTokens(formatted.text).map((part, index) => (
              <span key={index} class={part.kind ? `json-${part.kind}` : ""}>
                {part.text}
              </span>
            ))
          : formatted.text}
      </pre>
      {formatted.truncated && (
        <p class="mt-2 text-xs text-[#a86a17]">
          Preview limited to 1 million characters.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText: string;
  children: preact.ComponentChildren;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section class="mt-5">
      <div class="mb-2 flex items-center justify-between gap-2">
        <h3 class="text-[13px] font-semibold text-[#252b26]">{title}</h3>
        <button
          onClick={copy}
          aria-label={`Copy ${title.toLowerCase()}`}
          class="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#69746c] hover:bg-[#edf5ef]"
        >
          <Copy size={13} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div class="overflow-hidden rounded-lg border border-[#e3e8e3] bg-[#fbfcfb]">
        {children}
      </div>
    </section>
  );
}

export function RequestDetails() {
  const selected = selectedRequest.value;
  const isOpen = selected !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<DetailTab>("Request");
  const [format, setFormat] = useState<CodeFormat>("curl");
  const [codeCopied, setCodeCopied] = useState(false);
  useEffect(() => {
    if (selected && tab === "Response") loadResponseBody(selected);
  }, [selected?.id, tab]);
  useEffect(() => {
    if (!isOpen) return;
    const returnFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        selectRequest(null);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (returnFocus?.isConnected) returnFocus.focus();
      else
        document
          .querySelector<HTMLElement>('[aria-label="Search requests"]')
          ?.focus();
    };
  }, [isOpen]);
  if (!selected) return null;
  const { entry, body } = selected;
  const query = queryParameters(entry);
  const code = statusCode(entry);
  const snippet = generateCode(entry, format);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600);
    } catch {
      setCodeCopied(false);
    }
  }

  return (
    <div
      class="fixed inset-0 z-20 flex justify-end bg-black/25"
      onClick={() => selectRequest(null)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Request details"
        class="flex h-full w-full max-w-[570px] flex-col overflow-hidden bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-[#e7ebe7] px-5 py-4">
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex min-w-0 items-center gap-2">
              <span
                class={`shrink-0 text-sm font-semibold ${entry.request.method === "GET" ? "text-[#2469d8]" : "text-[#222]"}`}
              >
                {entry.request.method}
              </span>
              <strong
                class="block min-w-0 truncate text-base text-[#202522]"
                title={entry.request.url}
              >
                {requestPath(entry.request.url)}
              </strong>
            </div>
            <p
              class="truncate text-xs text-[#7d8580]"
              title={entry.request.url}
            >
              {requestHost(entry.request.url)}
              {query.length
                ? ` · ${query.length} ${query.length === 1 ? "query parameter" : "query parameters"}`
                : ""}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            aria-label="Close details"
            onClick={() => selectRequest(null)}
            class="shrink-0 rounded p-1 text-[#566159] hover:bg-[#eff3ef]"
          >
            <X size={20} />
          </button>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2 border-b border-[#e7ebe7] px-5 py-3 text-xs">
          <span
            class={`rounded-full px-2 py-1 font-semibold ${code === 0 ? "bg-[#fff5dd] text-[#895d11]" : isHttpError(code) ? "bg-[#fff0f0] text-[#e02f35]" : "bg-[#e8f8ec] text-[#008e3b]"}`}
          >
            {code === 0 ? "No HTTP response" : code}{" "}
            {entry.response.statusText || ""}
          </span>
          <span class="rounded-full bg-[#f1f3f1] px-2 py-1 text-[#626a64]">
            {formatTime(entry.time)}
          </span>
          <span class="rounded-full bg-[#f1f3f1] px-2 py-1 text-[#626a64]">
            {contentType(entry)}
          </span>
        </div>
        <div
          role="tablist"
          aria-label="Request detail sections"
          class="flex shrink-0 gap-5 border-b border-[#e7ebe7] px-5"
          onKeyDown={(event) => {
            const index = DETAIL_TABS.indexOf(tab);
            let next: number;
            if (event.key === "ArrowRight")
              next = (index + 1) % DETAIL_TABS.length;
            else if (event.key === "ArrowLeft")
              next = (index + DETAIL_TABS.length - 1) % DETAIL_TABS.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = DETAIL_TABS.length - 1;
            else return;
            event.preventDefault();
            setTab(DETAIL_TABS[next]);
            setCodeCopied(false);
            const tabButtons =
              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]',
              );
            tabButtons[next]?.focus();
          }}
        >
          {DETAIL_TABS.map((name) => (
            <button
              key={name}
              id={`request-details-tab-${name.toLowerCase()}`}
              role="tab"
              aria-controls="request-details-panel"
              aria-selected={tab === name}
              tabIndex={tab === name ? 0 : -1}
              onClick={() => {
                setTab(name);
                setCodeCopied(false);
              }}
              class={`border-b-2 py-3 text-sm ${tab === name ? "border-[#0ba342] font-semibold text-[#1a3e26]" : "border-transparent text-[#798079]"}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div
          id="request-details-panel"
          role="tabpanel"
          aria-labelledby={`request-details-tab-${tab.toLowerCase()}`}
          tabIndex={0}
          class="min-h-0 flex-1 overflow-y-auto px-5 pb-8"
        >
          {tab === "Request" ? (
            <>
              <Section title="URL" copyText={entry.request.url}>
                <p class="max-h-28 overflow-auto break-all px-3 py-2 text-[13px]">
                  {entry.request.url}
                </p>
              </Section>
              <Section
                title="Query parameters"
                copyText={query.map((p) => `${p.name}=${p.value}`).join("&")}
              >
                <Pairs items={query} />
              </Section>
              <Section
                title="Request headers"
                copyText={headerText(entry.request.headers)}
              >
                <Pairs items={entry.request.headers || []} />
              </Section>
              <Section title="Request body" copyText={requestBody(entry)}>
                <Body
                  text={requestBody(entry)}
                  mimeType={entry.request.postData?.mimeType}
                  fallback="No request body available"
                />
              </Section>
            </>
          ) : tab === "Response" ? (
            <>
              <Section
                title="Response headers"
                copyText={headerText(entry.response.headers)}
              >
                <Pairs items={entry.response.headers || []} />
              </Section>
              <Section
                title="Response body"
                copyText={body?.base64 ? "" : body?.text || ""}
              >
                {selected.bodyLoading ? (
                  <p class="px-3 py-2 text-sm text-[#89918b]">
                    Loading response body…
                  </p>
                ) : body?.base64 ? (
                  <p class="px-3 py-2 text-sm text-[#89918b]">
                    Binary or Base64 response; text preview unavailable.
                  </p>
                ) : (
                  <Body
                    text={body?.text || ""}
                    mimeType={entry.response.content?.mimeType}
                    fallback="No response body available"
                  />
                )}
              </Section>
            </>
          ) : (
            <section class="mt-5">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label class="flex items-center gap-2 text-[13px] font-semibold text-[#252b26]">
                  Generate code{" "}
                  <select
                    aria-label="Code format"
                    value={format}
                    onChange={(event) => {
                      setFormat(event.currentTarget.value as CodeFormat);
                      setCodeCopied(false);
                    }}
                    class="rounded-md border border-[#dce4dd] bg-white px-2 py-1.5 font-normal text-[#252b26]"
                  >
                    {CODE_FORMATS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={copyCode}
                  aria-label="Copy generated code"
                  class="flex items-center gap-1 rounded-md border border-[#dce4dd] px-3 py-1.5 text-xs font-medium text-[#355f40] hover:bg-[#edf5ef]"
                >
                  <Copy size={13} />
                  {codeCopied ? "Copied" : "Copy code"}
                </button>
              </div>
              {snippet.warning && (
                <p
                  role="note"
                  class="mb-3 rounded-md bg-[#fff5dd] px-3 py-2 text-xs text-[#895d11]"
                >
                  {snippet.warning}
                </p>
              )}
              <pre class="max-h-[65vh] overflow-auto rounded-lg border border-[#e3e8e3] bg-[#fbfcfb] p-3 font-mono text-[12px] leading-relaxed text-[#333b35]">
                <code>{snippet.code}</code>
              </pre>
              <p class="mt-3 text-xs text-[#7d8580]">
                Generated code may contain captured credentials or tokens.
                Review before sharing.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
