import { requestPath } from "../../core/filters";
import { formatTime } from "../../utils/formatTime";
import { selectRequest, visibleRequests } from "../stores/requestStore";

export function RequestList() {
  const visible = visibleRequests.value;
  return (
    <div class="mx-[18px] overflow-hidden rounded-xl border border-[#e0e2e1] bg-white">
      {visible.length ? (
        visible.map(({ id, entry }) => {
          const status = Number(entry.response?.status) || 0;
          const error = status >= 400;
          return (
            <button
              key={id}
              onClick={() => selectRequest(id)}
              class="grid min-h-[95px] w-full grid-cols-[70px_minmax(0,1fr)_66px] items-start gap-3 border-b border-[#e9ebea] px-4 py-[18px] text-left last:border-b-0 hover:bg-[#f8faf9] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#22a653]"
              aria-label={`${entry.request.method} ${requestPath(entry.request.url)}, status ${status || "unknown"}, ${formatTime(entry.time)}`}
            >
              <span
                class={`pt-[1px] text-[15px] font-medium ${entry.request.method === "GET" ? "text-[#2469d8]" : "text-[#151719]"}`}
              >
                {entry.request.method}
              </span>
              <span class="min-w-0 break-all pt-[1px] text-[15px] font-semibold text-[#17191c]">
                {requestPath(entry.request.url)}
              </span>
              <span class="flex flex-col items-end gap-1">
                <strong
                  class={`text-[15px] ${error ? "text-[#ee2d33]" : "text-[#00a446]"}`}
                >
                  {status || "—"}
                </strong>
                <small class="whitespace-nowrap text-[13px] text-[#969696]">
                  {formatTime(entry.time)}
                </small>
              </span>
            </button>
          );
        })
      ) : (
        <div class="flex min-h-[190px] flex-col items-center justify-center gap-1 px-5 text-center text-sm text-[#888d8b]">
          <strong class="font-medium text-[#535955]">
            No requests to show
          </strong>
          <span>Reload the inspected tab or adjust your filters.</span>
        </div>
      )}
    </div>
  );
}
