import { computed, signal } from "@preact/signals";
import { matchesRequest } from "../../core/filters";
import type { InspectorRequest, MethodFilter } from "../../types/request";

export const MAX_REQUESTS = 500;
export const requests = signal<InspectorRequest[]>([]);
export const discardedRequests = signal(0);
export const selectedId = signal<string | null>(null);
export const recording = signal(true);
export const search = signal("");
export const methodFilter = signal<MethodFilter>("All");
export const statusFilter = signal("");
export const minDurationFilter = signal("");
export const maxDurationFilter = signal("");
export const contentTypeFilter = signal("");
export const filterOpen = signal(false);

export const visibleRequests = computed(() => {
  const searchValue = search.value;
  const method = methodFilter.value;
  const status = statusFilter.value;
  const additional = {
    minDuration: minDurationFilter.value,
    maxDuration: maxDurationFilter.value,
    contentType: contentTypeFilter.value,
  };
  return requests.value
    .filter(({ entry }) =>
      matchesRequest(entry, searchValue, method, status, additional),
    )
    .reverse();
});
export const selectedRequest = computed(
  () =>
    requests.value.find((request) => request.id === selectedId.value) || null,
);

export function addRequest(request: InspectorRequest): void {
  addRequests([request]);
}

export function addRequests(
  incoming: InspectorRequest[],
  discardedBeforeFlush = 0,
): void {
  const combined = [...requests.peek(), ...incoming];
  const overflow = Math.max(0, combined.length - MAX_REQUESTS);
  const next = combined.slice(-MAX_REQUESTS);
  discardedRequests.value += discardedBeforeFlush + overflow;
  if (
    selectedId.peek() &&
    !next.some((request) => request.id === selectedId.peek())
  )
    selectedId.value = null;
  requests.value = next;
}

export function updateRequest(
  id: string,
  patch: Partial<InspectorRequest>,
): void {
  requests.value = requests
    .peek()
    .map((request) => (request.id === id ? { ...request, ...patch } : request));
}

export function selectRequest(id: string | null): void {
  const previous = selectedId.peek();
  if (previous && previous !== id)
    updateRequest(previous, { body: undefined, bodyLoading: false });
  selectedId.value = id;
}

export function clearRequests(): void {
  requests.value = [];
  discardedRequests.value = 0;
  selectedId.value = null;
  recording.value = true;
}
