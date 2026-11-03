import { useEffect, useRef, useState } from "preact/hooks";
import { X } from "lucide-preact";
import type { SavedSession } from "../../storage/database";
import {
  getRetentionLimit,
  RETENTION_OPTIONS,
  setRetentionLimit,
  type RetentionLimit,
} from "../../storage/retention";
import { formatTime } from "../../utils/formatTime";

export function SavedSessions({ onClose }: { onClose: () => void }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [retention, setRetention] = useState<RetentionLimit>(getRetentionLimit);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    let active = true;
    void import("../../storage/database")
      .then(({ listSessions }) => listSessions())
      .then((items) => {
        if (active) setSessions(items);
      })
      .catch(() => {
        if (active) setError("Could not load saved summaries.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function remove(id: number) {
    setBusy(true);
    setError("");
    try {
      const { deleteSession } = await import("../../storage/database");
      await deleteSession(id);
      setSessions((items) => items.filter((item) => item.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      setError("Could not delete this summary.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAll() {
    setBusy(true);
    setError("");
    try {
      const { clearSessions } = await import("../../storage/database");
      await clearSessions();
      setSessions([]);
      setExpandedId(null);
      setConfirmClear(false);
    } catch {
      setError("Could not delete saved summaries.");
    } finally {
      setBusy(false);
    }
  }

  async function changeRetention(limit: RetentionLimit) {
    setBusy(true);
    setError("");
    try {
      const { pruneSessions, listSessions } =
        await import("../../storage/database");
      await pruneSessions(limit);
      setRetentionLimit(limit);
      setRetention(limit);
      setSessions(await listSessions());
    } catch {
      setError("Could not update the saved-summary limit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      class="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saved summaries"
        class="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div class="flex items-start justify-between gap-3 border-b border-[#e7ebe7] px-5 py-4">
          <div>
            <h2 class="text-lg font-semibold text-[#202522]">
              Saved summaries
            </h2>
            <p class="mt-1 text-xs text-[#69746c]">
              Stored locally. Summaries contain time, method, origin, status,
              and duration only.
            </p>
          </div>
          <button
            ref={closeButton}
            aria-label="Close saved summaries"
            onClick={onClose}
            class="rounded p-1 text-[#566159] hover:bg-[#eff3ef]"
          >
            <X size={20} />
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-3 border-b border-[#e7ebe7] px-5 py-3 text-sm">
          <label class="flex items-center gap-2 text-[#535d55]">
            Keep latest
            <select
              aria-label="Saved summary limit"
              value={retention}
              disabled={busy || loading}
              onChange={(event) =>
                void changeRetention(
                  Number(event.currentTarget.value) as RetentionLimit,
                )
              }
              class="rounded border border-[#dce4dd] bg-white px-2 py-1 text-[#252b26]"
            >
              {RETENTION_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
            summaries
          </label>
          {sessions.length > 0 && (
            <div class="ml-auto flex items-center gap-2">
              {confirmClear ? (
                <>
                  <span class="text-xs text-[#9b4c33]">
                    Delete all saved summaries?
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => void removeAll()}
                    class="rounded bg-[#b33434] px-2 py-1 text-xs text-white disabled:opacity-50"
                  >
                    Delete all
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    class="rounded px-2 py-1 text-xs text-[#535d55] hover:bg-[#f1f3f2]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => setConfirmClear(true)}
                  class="rounded px-2 py-1 text-xs text-[#a12f2f] hover:bg-[#fff0f0] disabled:opacity-50"
                >
                  Delete all
                </button>
              )}
            </div>
          )}
        </div>
        <div class="min-h-0 overflow-y-auto px-5 py-4">
          {error && (
            <p role="alert" class="mb-3 text-sm text-[#b33434]">
              {error}
            </p>
          )}
          {loading ? (
            <p class="text-sm text-[#69746c]">Loading saved summaries…</p>
          ) : sessions.length === 0 ? (
            <p class="py-10 text-center text-sm text-[#69746c]">
              No saved summaries yet.
            </p>
          ) : (
            <div class="space-y-3">
              {sessions.map((session) => (
                <section
                  key={session.id}
                  class="overflow-hidden rounded-lg border border-[#e2e7e2]"
                >
                  <div class="flex flex-wrap items-center gap-2 px-3 py-3">
                    <button
                      aria-expanded={expandedId === session.id}
                      onClick={() =>
                        setExpandedId(
                          expandedId === session.id
                            ? null
                            : (session.id ?? null),
                        )
                      }
                      class="min-w-0 flex-1 text-left hover:text-[#008d3e]"
                    >
                      <strong class="block text-sm font-medium">
                        {new Date(session.createdAt).toLocaleString()}
                      </strong>
                      <span class="text-xs text-[#69746c]">
                        {session.requests.length} request
                        {session.requests.length === 1 ? "" : "s"} ·{" "}
                        {expandedId === session.id ? "Hide" : "View"} summary
                      </span>
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        session.id !== undefined && void remove(session.id)
                      }
                      class="rounded px-2 py-1 text-xs text-[#a12f2f] hover:bg-[#fff0f0] disabled:opacity-50"
                      aria-label={`Delete summary from ${new Date(session.createdAt).toLocaleString()}`}
                    >
                      Delete
                    </button>
                  </div>
                  {expandedId === session.id && (
                    <div class="max-h-[40vh] overflow-auto border-t border-[#e7ebe7]">
                      <table class="w-full min-w-[620px] text-left text-xs">
                        <thead class="sticky top-0 bg-[#f8faf8] text-[#69746c]">
                          <tr>
                            <th class="px-3 py-2">Method</th>
                            <th class="px-3 py-2">Started</th>
                            <th class="px-3 py-2">Origin</th>
                            <th class="px-3 py-2">Status</th>
                            <th class="px-3 py-2">Duration</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-[#edf0ed]">
                          {session.requests.map((request, index) => (
                            <tr key={`${request.id}-${index}`}>
                              <td class="px-3 py-2">{request.method}</td>
                              <td class="whitespace-nowrap px-3 py-2">
                                {request.startedDateTime
                                  ? new Date(
                                      request.startedDateTime,
                                    ).toLocaleString()
                                  : "—"}
                              </td>
                              <td class="break-all px-3 py-2">{request.url}</td>
                              <td class="px-3 py-2">{request.status || "—"}</td>
                              <td class="px-3 py-2">
                                {formatTime(request.time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
