import Dexie, { type EntityTable } from "dexie";
import { savedMetadata } from "../core/sanitizer";
import type { InspectorRequest } from "../types/request";

export interface SavedRequest {
  id: string;
  startedDateTime: string;
  method: string;
  url: string;
  status: number;
  time: number;
}
export interface SavedSession {
  id?: number;
  createdAt: number;
  requests: SavedRequest[];
}

const database = new Dexie("api-request-inspector") as Dexie & {
  sessions: EntityTable<SavedSession, "id">;
};
database.version(1).stores({ sessions: "++id, createdAt" });

export async function saveSession(
  requests: InspectorRequest[],
  retentionLimit = 20,
): Promise<number> {
  return database.transaction("rw", database.sessions, async () => {
    const id = await database.sessions.add({
      createdAt: Date.now(),
      requests: requests.map(savedMetadata),
    });
    if (id === undefined)
      throw new Error("IndexedDB did not return a session id");
    await pruneSessions(retentionLimit);
    return id;
  });
}

export async function listSessions(): Promise<SavedSession[]> {
  return database.sessions.orderBy("id").reverse().toArray();
}

export async function deleteSession(id: number): Promise<void> {
  await database.sessions.delete(id);
}

export async function clearSessions(): Promise<void> {
  await database.sessions.clear();
}

export async function pruneSessions(limit: number): Promise<void> {
  const count = await database.sessions.count();
  const excess = Math.max(0, count - Math.max(1, Math.floor(limit)));
  if (!excess) return;
  const oldestIds = await database.sessions
    .orderBy("id")
    .limit(excess)
    .primaryKeys();
  await database.sessions.bulkDelete(oldestIds);
}
