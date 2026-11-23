import {
  isHttpError,
  requestHost,
  requestPath,
  statusCode,
} from "../../core/filters";
import { queryParameters } from "../../core/parser";
import { formatTime } from "../../utils/formatTime";
import {
  recording,
  requests,
  resetFilters,
  selectRequest,
  visibleRequests,
} from "../stores/requestStore";

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
              class="grid min-h-[72px] w-full grid-cols-[58px_minmax(0,1fr)_82px] items-start gap-2 border-b border-[#e9ebea] px-4 py-3.5 text-left last:border-b-0 hover:bg-[#f8faf9] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#22a653] max-[500px]:grid-cols-[minmax(0,1fr)_auto]"
              aria-label={`${entry.request.method} ${entry.request.url}, ${noResponse ? "no HTTP response" : `status ${status}`}, ${formatTime(entry.time)}`}
            >
              <span
                class={`pt-[1px] text-[15px] font-medium max-[500px]:order-1 ${entry.request.method === "GET" ? "text-[#2469d8]" : "text-[#151719]"}`}
              >
                {entry.request.method}
              </span>
              <span class="min-w-0 pt-[1px] max-[500px]:order-3 max-[500px]:col-span-2">
                <strong
                  class="block truncate text-[15px] font-semibold text-[#17191c]"
                  title={entry.request.url}
                >
                  {requestPath(entry.request.url)}
                </strong>
                <small class="block truncate pt-1 text-xs text-[#59635c]">
                  {requestHost(entry.request.url)}
                  {queryCount
                    ? ` · ${queryCount} ${queryCount === 1 ? "parameter" : "parameters"}`
                    : ""}
                </small>
              </span>
              <span class="flex flex-col items-end gap-1 max-[500px]:order-2 max-[500px]:flex-row max-[500px]:items-center max-[500px]:gap-2">
                <strong
                  class={`${noResponse ? "text-[12px] text-[#895d11]" : `text-[15px] ${error ? "text-[#b33434]" : "text-[#008039]"}`}`}
                >
                  {noResponse ? "No response" : status}
                </strong>
                <small class="whitespace-nowrap text-[13px] text-[#59635c]">
                  {formatTime(entry.time)}
                </small>
              </span>
            </button>
          );
        })
      ) : (
        <div class="flex min-h-[190px] flex-col items-center justify-center gap-1 px-5 text-center text-sm text-[#59635c]">
          <strong class="font-medium text-[#535955]">
            {requests.value.length ? "No matching requests" : "No requests captured yet"}
          </strong>
          {requests.value.length ? (
            <>
              <span>Try a broader search or clear the active filters.</span>
              <button
                onClick={resetFilters}
                class="mt-2 rounded-lg border border-[#cddbd0] px-3 py-2 font-medium text-[#126b34] hover:bg-[#edf5ef]"
              >
                Clear filters
              </button>
            </>
          ) : recording.value ? (
            <span>Reload the inspected tab to capture its requests.</span>
          ) : (
            <button
              onClick={() => (recording.value = true)}
              class="mt-2 rounded-lg border border-[#cddbd0] px-3 py-2 font-medium text-[#126b34] hover:bg-[#edf5ef]"
            >
              Resume capture
            </button>
          )}
        </div>
      )}
    </div>
  );
}
