import type { Note } from '@/context/NotesContext';

const SYNC_FILENAME = 'notes_app_sync.json';
const TOMBSTONE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface Tombstone {
  id: string;
  deletedAt: number;
}

export interface SyncPayload {
  version: 2;
  notes: Note[];
  deletedIds: Tombstone[];
}

async function driveRequest(
  url: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function findSyncFile(accessToken: string): Promise<string | null> {
  const res = await driveRequest(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${SYNC_FILENAME}'+and+trashed%3Dfalse&spaces=drive&fields=files(id,name)`,
    accessToken,
  );
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);
  const data = await res.json() as { files: { id: string }[] };
  return data.files?.[0]?.id ?? null;
}

export async function readSyncFile(accessToken: string, fileId: string): Promise<SyncPayload> {
  const res = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    accessToken,
  );
  if (!res.ok) throw new Error(`Drive read failed: ${res.status}`);
  try {
    const data = await res.json() as Note[] | SyncPayload;
    
    if (Array.isArray(data)) {
      return { version: 2, notes: data, deletedIds: [] };
    }
    return {
      version: 2,
      notes: Array.isArray(data.notes) ? data.notes : [],
      deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
    };
  } catch {
    return { version: 2, notes: [], deletedIds: [] };
  }
}

export async function createSyncFile(accessToken: string, payload: SyncPayload): Promise<string> {
  const metadata = { name: SYNC_FILENAME, mimeType: 'application/json' };
  const body = new FormData();
  body.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  body.append(
    'media',
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
  );
  const res = await driveRequest(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    accessToken,
    { method: 'POST', body },
  );
  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
  const data = await res.json() as { id: string };
  return data.id;
}

export async function updateSyncFile(
  accessToken: string,
  fileId: string,
  payload: SyncPayload,
): Promise<void> {
  const res = await driveRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    accessToken,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload, null, 2),
    },
  );
  if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
}

/**
 * Merge local and remote: last-write-wins for notes, tombstones delete older notes.
 */
export function mergeSyncPayloads(local: SyncPayload, remote: SyncPayload): SyncPayload {
  const tombstoneMap = new Map<string, Tombstone>();
  for (const t of [...local.deletedIds, ...remote.deletedIds]) {
    const existing = tombstoneMap.get(t.id);
    if (!existing || t.deletedAt > existing.deletedAt) {
      tombstoneMap.set(t.id, t);
    }
  }

  const noteMap = new Map<string, Note>();
  for (const n of [...local.notes, ...remote.notes]) {
    const existing = noteMap.get(n.id);
    if (!existing || n.updatedAt > existing.updatedAt) {
      noteMap.set(n.id, n);
    }
  }

  for (const [id, tombstone] of tombstoneMap) {
    const note = noteMap.get(id);
    if (note && tombstone.deletedAt > note.updatedAt) {
      noteMap.delete(id);
    }
  }

  const now = Date.now();
  const activeTombstones: Tombstone[] = [];
  for (const [id, tombstone] of tombstoneMap) {
    const isGone = !noteMap.has(id);
    const isFresh = now - tombstone.deletedAt < TOMBSTONE_MAX_AGE_MS;
    if (isGone && isFresh) activeTombstones.push(tombstone);
  }

  return {
    version: 2,
    notes: Array.from(noteMap.values()).sort((a, b) => b.createdAt - a.createdAt),
    deletedIds: activeTombstones,
  };
}
