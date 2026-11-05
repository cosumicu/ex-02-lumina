import { useCallback, useEffect, useState } from "preact/hooks";
import { CirclePause, CirclePlay, Filter, Search, Trash2 } from "lucide-preact";
import { clearCapture } from "../../core/capture";
import { isValidStatusFilter } from "../../core/filters";
import {
  filterOpen,
  methodFilter,
  recording,
  requests,
  search,
  statusFilter,
} from "../stores/requestStore";
import type { MethodFilter } from "../../types/request";
import { getRetentionLimit } from "../../storage/retention";
import { SavedSessions } from "./SavedSessions";

const tabs: MethodFilter[] = [
  "All",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HTTP errors",
  "No response",
];

export function RequestFilters() {
  const [input, setInput] = useState(search.value);
  const [message, setMessage] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const [saving, setSaving] = useState(false);
  const closeSessions = useCallback(() => setShowSessions(false), []);
  const invalidStatus = !isValidStatusFilter(statusFilter.value);
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
    if (saving || !requests.peek().length) return;
    setSaving(true);
    try {
      const { saveSession } = await import("../../storage/database");
      await saveSession(requests.peek(), getRetentionLimit());
      setMessage("Request summary saved locally");
      filterOpen.value = false;
    } catch {
      setMessage("Could not save this session");
    } finally {
      setSaving(false);
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
          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-2 text-xs text-[#5f6561]">
              Status{" "}
              <input
                aria-label="Filter status code"
                aria-invalid={invalidStatus}
                aria-describedby={
                  invalidStatus ? "status-filter-error" : undefined
                }
                type="search"
                list="status-options"
                placeholder="404 or 4xx"
                value={statusFilter.value}
                onInput={(event) =>
                  (statusFilter.value = event.currentTarget.value)
                }
                class={`w-28 rounded border bg-white px-2 py-1 text-sm text-[#17191c] outline-none ${invalidStatus ? "border-[#d34444] focus:border-[#d34444]" : "border-[#dbdfdb] focus:border-[#16a34a]"}`}
              />
              <datalist id="status-options">
                <option value="2xx" />
                <option value="3xx" />
                <option value="4xx" />
                <option value="5xx" />
                <option value="error" />
                <option value="no response" />
              </datalist>
            </label>
            {invalidStatus && (
              <p
                id="status-filter-error"
                role="alert"
                class="text-xs text-[#b33434]"
              >
                Use a code from 100–599, 1xx–5xx, error, or no response. Status
                filter not applied.
              </p>
            )}
          </div>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setShowSessions(true);
                filterOpen.value = false;
              }}
              class="rounded border border-[#dbdfdb] bg-white px-2 py-1 text-xs text-[#35433a] hover:bg-[#eef8f0]"
            >
              View saved summaries
            </button>
            <button
              onClick={() => void save()}
              disabled={saving || requests.value.length === 0}
              class="rounded border border-[#dbdfdb] bg-white px-2 py-1 text-xs text-[#35433a] hover:bg-[#eef8f0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save summary locally"}
            </button>
          </div>
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
      {showSessions && <SavedSessions onClose={closeSessions} />}
    </>
  );
}
