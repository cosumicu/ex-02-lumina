import { useEffect, useState } from "preact/hooks";
import { CirclePause, CirclePlay, Filter, Search, Trash2 } from "lucide-preact";
import { clearCapture } from "../../core/capture";
import {
  filterOpen,
  methodFilter,
  recording,
  requests,
  search,
  statusFilter,
} from "../stores/requestStore";
import type { MethodFilter } from "../../types/request";

const tabs: MethodFilter[] = [
  "All",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "Errors",
];

export function RequestFilters() {
  const [input, setInput] = useState(search.value);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      search.value = input;
    }, 120);
    return () => clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  async function save() {
    try {
      const { saveSession } = await import("../../storage/database");
      await saveSession(requests.peek());
      setMessage("Request summary saved locally");
      filterOpen.value = false;
    } catch {
      setMessage("Could not save this session");
    }
  }

  return (
    <>
      <div class="mt-5 flex items-center gap-3 px-[18px]">
        <div class="relative min-w-0 flex-1">
          <Search
            size={18}
            strokeWidth={1.8}
            class="absolute top-1/2 left-2 -translate-y-1/2 text-[#5e646b]"
            aria-hidden="true"
          />
          <input
            aria-label="Search requests"
            type="search"
            placeholder="Search requests..."
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            class="h-11 w-full rounded-md border-0 bg-transparent pr-3 pl-10 text-[15px] text-[#17191c] outline-none placeholder:text-[#969696] focus:bg-[#f5f7f5]"
          />
        </div>
        <div class="flex items-center gap-[15px] text-[#55595d]">
          <button
            aria-label="Open filters"
            title="Filters and local session"
            onClick={() => (filterOpen.value = !filterOpen.value)}
            class="rounded p-1 hover:bg-[#f1f3f2]"
            aria-expanded={filterOpen.value}
          >
            <Filter size={19} strokeWidth={1.8} />
          </button>
          <button
            aria-label={
              recording.value ? "Pause monitoring" : "Resume monitoring"
            }
            title={recording.value ? "Pause" : "Resume"}
            onClick={() => (recording.value = !recording.value)}
            class="rounded p-1 hover:bg-[#f1f3f2]"
          >
            {recording.value ? (
              <CirclePause size={19} strokeWidth={1.8} />
            ) : (
              <CirclePlay size={19} strokeWidth={1.8} />
            )}
          </button>
          <button
            aria-label="Clear requests"
            title="Clear requests and resume"
            onClick={clearCapture}
            class="rounded p-1 hover:bg-[#f1f3f2]"
          >
            <Trash2 size={19} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      {filterOpen.value && (
        <div class="mx-[18px] mt-1 flex flex-wrap items-center gap-3 rounded-lg border border-[#e4e6e5] bg-[#fbfcfb] px-3 py-2 shadow-sm">
          <label class="flex items-center gap-2 text-xs text-[#5f6561]">
            Status{" "}
            <input
              aria-label="Filter status code"
              type="search"
              list="status-options"
              placeholder="404 or 4xx"
              value={statusFilter.value}
              onInput={(event) =>
                (statusFilter.value = event.currentTarget.value)
              }
              class="w-28 rounded border border-[#dbdfdb] bg-white px-2 py-1 text-sm text-[#17191c] outline-none focus:border-[#16a34a]"
            />
            <datalist id="status-options">
              <option value="2xx" />
              <option value="3xx" />
              <option value="4xx" />
              <option value="5xx" />
              <option value="error" />
            </datalist>
          </label>
          <button
            onClick={save}
            class="ml-auto rounded border border-[#dbdfdb] bg-white px-2 py-1 text-xs text-[#35433a] hover:bg-[#eef8f0]"
          >
            Save summary locally
          </button>
        </div>
      )}
      <div
        role="tablist"
        aria-label="Filter by method"
        class="mt-5 flex flex-wrap items-center gap-[8px] px-[18px] pb-4"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={methodFilter.value === tab}
            onClick={() => (methodFilter.value = tab)}
            class={`rounded-lg px-[11px] py-[6px] text-[13px] leading-4 transition-colors ${methodFilter.value === tab ? "bg-[#f1f2f2] font-medium text-[#151719]" : "text-[#25282b] hover:bg-[#f4f6f5]"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {message && (
        <div
          role="status"
          class="fixed right-5 bottom-5 z-50 rounded-lg bg-[#1f3225] px-3 py-2 text-sm text-white shadow-lg"
        >
          {message}
        </div>
      )}
    </>
  );
}
