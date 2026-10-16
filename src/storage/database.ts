import Dexie, { type EntityTable } from 'dexie';
import { savedMetadata } from '../core/sanitizer';
import type { InspectorRequest } from '../types/request';

export interface SavedRequest {
  id: string;
  startedDateTime: string;
  method: string;
  url: string;
  status: number;
  time: number;
}
export interface SavedSession { id?: number; createdAt: number; requests: SavedRequest[] }

const database = new Dexie('api-request-inspector') as Dexie & { sessions: EntityTable<SavedSession, 'id'> };
database.version(1).stores({ sessions: '++id, createdAt' });

export async function saveSession(requests: InspectorRequest[]): Promise<number> {
  const id = await database.sessions.add({ createdAt: Date.now(), requests: requests.map(savedMetadata) });
  if (id === undefined) throw new Error('IndexedDB did not return a session id');
  return id;
}

export async function latestSession(): Promise<SavedSession | undefined> {
  return database.sessions.orderBy('createdAt').last();
}
