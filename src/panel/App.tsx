import { useEffect } from 'preact/hooks';
import { Activity } from 'lucide-preact';
import { startCapture } from '../core/capture';
import { recording, requests, visibleRequests } from './stores/requestStore';
import { RequestFilters } from './components/RequestFilters';
import { RequestList } from './components/RequestList';
import { RequestDetails } from './components/RequestDetails';

export function App() {
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
      void import('./demo').then(({ loadDemo }) => loadDemo());
      return;
    }
    return startCapture();
  }, []);
  return <div class="min-h-screen bg-[#fafbfa] p-1 text-[#17191c]">
    <main class="mx-auto min-h-[calc(100vh-8px)] max-w-[1200px] overflow-hidden rounded-2xl border border-[#e0e4e1] bg-white">
      <header class="flex items-center justify-between gap-3 px-[18px] pt-[18px]"><div class="flex items-center gap-3"><Activity size={21} strokeWidth={2.1} class="text-[#00a448]"/><h1 class="text-[22px] font-semibold tracking-tight text-[#151719]">EX-02 Lumina</h1></div><span class={`rounded-full px-[10px] py-[3px] text-[14px] font-medium ${recording.value ? 'bg-[#def6e8] text-[#008d3e]' : 'bg-[#fff0d8] text-[#956200]'}`}>{recording.value ? 'Recording' : 'Paused'}</span></header>
      <RequestFilters />
      <RequestList />
      <p class="px-[18px] py-[17px] text-sm text-[#8a908c]" aria-live="polite">{visibleRequests.value.length === requests.value.length ? `${requests.value.length} captured request${requests.value.length === 1 ? '' : 's'}` : `${visibleRequests.value.length} of ${requests.value.length} requests`}</p>
      <RequestDetails />
    </main>
  </div>;
}
