import { useEffect, useState } from 'preact/hooks';
import { Copy, X } from 'lucide-preact';
import { loadResponseBody } from '../../core/capture';
import { contentType, headerText, queryParameters, requestBody } from '../../core/parser';
import { requestPath } from '../../core/filters';
import { formatBody, jsonTokens } from '../../utils/formatJson';
import { formatTime } from '../../utils/formatTime';
import { selectRequest, selectedRequest } from '../stores/requestStore';
import type { Header } from '../../types/request';

function Pairs({ items }: { items: Header[] }) {
  if (!items.length) return <p class="px-3 py-2 text-sm text-[#89918b]">None available</p>;
  return <div class="divide-y divide-[#edf0ed]">{items.map(({ name, value }, index) => <div key={`${name}-${index}`} class="grid grid-cols-[minmax(95px,30%)_minmax(0,1fr)] gap-3 px-3 py-2 text-[13px]"><span class="break-all font-medium text-[#306caa]">{name}</span><span class="break-all whitespace-pre-wrap text-[#383d3a]">{value}</span></div>)}</div>;
}

function Body({ text, mimeType, fallback }: { text: string; mimeType?: string; fallback: string }) {
  if (!text) return <p class="px-3 py-2 text-sm text-[#89918b]">{fallback}</p>;
  const formatted = formatBody(text, mimeType);
  return <div class="max-h-[44vh] overflow-auto px-3 py-2"><pre class="whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-[#333b35]">{formatted.json ? jsonTokens(formatted.text).map((part, index) => <span key={index} class={part.kind ? `json-${part.kind}` : ''}>{part.text}</span>) : formatted.text}</pre>{formatted.truncated && <p class="mt-2 text-xs text-[#a86a17]">Preview limited to 1 million characters.</p>}</div>;
}

function Section({ title, copyText, children }: { title: string; copyText: string; children: preact.ComponentChildren }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(copyText); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setCopied(false); }
  }
  return <section class="mt-5"><div class="mb-2 flex items-center justify-between gap-2"><h3 class="text-[13px] font-semibold text-[#252b26]">{title}</h3><button onClick={copy} aria-label={`Copy ${title.toLowerCase()}`} class="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#69746c] hover:bg-[#edf5ef]"><Copy size={13} />{copied ? 'Copied' : 'Copy'}</button></div><div class="overflow-hidden rounded-lg border border-[#e3e8e3] bg-[#fbfcfb]">{children}</div></section>;
}

export function RequestDetails() {
  const selected = selectedRequest.value;
  const [tab, setTab] = useState<'Request' | 'Response'>('Request');
  useEffect(() => { if (selected && tab === 'Response') loadResponseBody(selected); }, [selected?.id, tab]);
  if (!selected) return null;
  const { entry, body } = selected;
  const query = queryParameters(entry);
  const code = Number(entry.response.status) || 0;

  return <div class="fixed inset-0 z-20 flex justify-end bg-black/25" onClick={() => selectRequest(null)}>
    <div role="dialog" aria-modal="true" aria-label="Request details" class="flex h-full w-full max-w-[570px] flex-col overflow-hidden bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
      <div class="flex items-start justify-between gap-3 border-b border-[#e7ebe7] px-5 py-4"><div class="min-w-0"><div class="mb-1 flex items-center gap-2"><span class={`text-sm font-semibold ${entry.request.method === 'GET' ? 'text-[#2469d8]' : 'text-[#222]'}`}>{entry.request.method}</span><strong class="break-all text-base text-[#202522]">{requestPath(entry.request.url)}</strong></div><p class="break-all text-xs text-[#7d8580]">{entry.request.url}</p></div><button aria-label="Close details" onClick={() => selectRequest(null)} class="rounded p-1 text-[#566159] hover:bg-[#eff3ef]"><X size={20}/></button></div>
      <div class="flex flex-wrap gap-2 border-b border-[#e7ebe7] px-5 py-3 text-xs"><span class={`rounded-full px-2 py-1 font-semibold ${code >= 400 ? 'bg-[#fff0f0] text-[#e02f35]' : 'bg-[#e8f8ec] text-[#008e3b]'}`}>{code || '—'} {entry.response.statusText || ''}</span><span class="rounded-full bg-[#f1f3f1] px-2 py-1 text-[#626a64]">{formatTime(entry.time)}</span><span class="rounded-full bg-[#f1f3f1] px-2 py-1 text-[#626a64]">{contentType(entry)}</span></div>
      <div class="flex gap-5 border-b border-[#e7ebe7] px-5"><button role="tab" aria-selected={tab === 'Request'} onClick={() => setTab('Request')} class={`border-b-2 py-3 text-sm ${tab === 'Request' ? 'border-[#0ba342] font-semibold text-[#1a3e26]' : 'border-transparent text-[#798079]'}`}>Request</button><button role="tab" aria-selected={tab === 'Response'} onClick={() => setTab('Response')} class={`border-b-2 py-3 text-sm ${tab === 'Response' ? 'border-[#0ba342] font-semibold text-[#1a3e26]' : 'border-transparent text-[#798079]'}`}>Response</button></div>
      <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {tab === 'Request' ? <>
          <Section title="URL" copyText={entry.request.url}><p class="break-all px-3 py-2 text-[13px]">{entry.request.url}</p></Section>
          <Section title="Query parameters" copyText={query.map(p => `${p.name}=${p.value}`).join('&')}><Pairs items={query}/></Section>
          <Section title="Request headers" copyText={headerText(entry.request.headers)}><Pairs items={entry.request.headers || []}/></Section>
          <Section title="Request body" copyText={requestBody(entry)}><Body text={requestBody(entry)} mimeType={entry.request.postData?.mimeType} fallback="No request body available"/></Section>
        </> : <>
          <Section title="Response headers" copyText={headerText(entry.response.headers)}><Pairs items={entry.response.headers || []}/></Section>
          <Section title="Response body" copyText={body?.base64 ? '' : body?.text || ''}>{selected.bodyLoading ? <p class="px-3 py-2 text-sm text-[#89918b]">Loading response body…</p> : body?.base64 ? <p class="px-3 py-2 text-sm text-[#89918b]">Binary or Base64 response; text preview unavailable.</p> : <Body text={body?.text || ''} mimeType={entry.response.content?.mimeType} fallback="No response body available"/>}</Section>
        </>}
      </div>
    </div>
  </div>;
}
