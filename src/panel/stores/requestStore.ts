import { computed, signal } from "@preact/signals";
import { matchesRequest } from "../../core/filters";
import type { InspectorRequest, MethodFilter } from "../../types/request";

export const MAX_REQUESTS = 500;
export const requests = signal<InspectorRequest[]>([]);
export const selectedId = signal<string | null>(null);
export const recording = signal(true);
export const search = signal("");
export const methodFilter = signal<MethodFilter>("All");
export const statusFilter = signal("");
export const filterOpen = signal(false);

export const visibleRequests = computed(() =>
  requests.value
    .filter(({ entry }) =>
      matchesRequest(
        entry,
        search.value,
        methodFilter.value,
        statusFilter.value,
      ),
    )
    .reverse(),
);
export const selectedRequest = computed(
  () =>
    requests.value.find((request) => request.id === selectedId.value) || null,
);

export function addRequest(request: InspectorRequest): void {
  addRequests([request]);
}

export function addRequests(incoming: InspectorRequest[]): void {
  const next = [...requests.peek(), ...incoming].slice(-MAX_REQUESTS);
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
  selectedId.value = null;
  recording.value = true;
}
