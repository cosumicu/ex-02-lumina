import {
  isHttpError,
  requestHost,
  requestPath,
  statusCode,
} from "../../core/filters";
import { queryParameters } from "../../core/parser";
import { formatTime } from "../../utils/formatTime";
import { selectRequest, visibleRequests } from "../stores/requestStore";

export function RequestList() {
  const visible = visibleRequests.value;
  return (
    <div class="mx-[18px] overflow-hidden rounded-xl border border-[#e0e2e1] bg-white">
      {visible.length ? (
        visible.map(({ id, entry }) => {
          const status = statusCode(entry);
          const error = isHttpError(status);
          const noResponse = status === 0;
          const queryCount = queryParameters(entry).length;
          return (
            <button
              key={id}
              onClick={() => selectRequest(id)}
              class="grid min-h-[72px] w-full grid-cols-[58px_minmax(0,1fr)_82px] items-start gap-2 border-b border-[#e9ebea] px-4 py-3.5 text-left last:border-b-0 hover:bg-[#f8faf9] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#22a653]"
              aria-label={`${entry.request.method} ${entry.request.url}, ${noResponse ? "no HTTP response" : `status ${status}`}, ${formatTime(entry.time)}`}
            >
              <span
                class={`pt-[1px] text-[15px] font-medium ${entry.request.method === "GET" ? "text-[#2469d8]" : "text-[#151719]"}`}
              >
                {entry.request.method}
              </span>
              <span class="min-w-0 pt-[1px]">
                <strong
                  class="block truncate text-[15px] font-semibold text-[#17191c]"
                  title={entry.request.url}
                >
                  {requestPath(entry.request.url)}
                </strong>
                <small class="block truncate pt-1 text-xs text-[#8a908c]">
                  {requestHost(entry.request.url)}
                  {queryCount
                    ? ` · ${queryCount} ${queryCount === 1 ? "parameter" : "parameters"}`
                    : ""}
                </small>
              </span>
              <span class="flex flex-col items-end gap-1">
                <strong
                  class={`${noResponse ? "text-[12px] text-[#a86a17]" : `text-[15px] ${error ? "text-[#ee2d33]" : "text-[#00a446]"}`}`}
                >
                  {noResponse ? "No response" : status}
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
