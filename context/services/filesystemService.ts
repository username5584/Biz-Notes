import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

import type { Note } from '@/context/NotesContext';
import type { NoteStorageService } from './types';
import { sortNotesByDate } from '@/utils/format';

const notesDirectory = new FileSystem.Directory(FileSystem.Paths.document, 'notes');

function getNoteFile(name: string): FileSystem.File {
  return new FileSystem.File(notesDirectory, name);
}

async function ensureNotesDir(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (!notesDirectory.exists) {
      notesDirectory.create({ intermediates: true, idempotent: true });
    }
  } catch {
    notesDirectory.create({ intermediates: true, idempotent: true });
  }
}

async function getAll(): Promise<Note[]> {
  if (Platform.OS === 'web') return [];
  await ensureNotesDir();
  const loaded: Note[] = [];
  const files = notesDirectory.list().filter((item): item is FileSystem.File => item instanceof FileSystem.File && item.name.endsWith('.json'));

  await Promise.all(
    files.map(async file => {
      try {
        const raw = await file.text();
        loaded.push(JSON.parse(raw) as Note);
      } catch {
        // Ignore invalid or unreadable note files.
      }
    }),
  );

  return sortNotesByDate(loaded);
}

async function saveAll(notes: Note[]): Promise<void> {
  if (Platform.OS === 'web') return;
  await ensureNotesDir();
  await Promise.all(
    notes.map(note => {
      const file = getNoteFile(`${note.id}.json`);
      file.write(JSON.stringify(note));
    }),
  );
}

async function readNoteById(id: string): Promise<Note | null> {
  if (Platform.OS === 'web') return null;
  await ensureNotesDir();
  try {
    const raw = await getNoteFile(`${id}.json`).text();
    return JSON.parse(raw) as Note;
  } catch {
    return null;
  }
}

export const filesystemService: NoteStorageService = {
  async loadAll(): Promise<Note[]> {
    return getAll();
  },

  async insert(note: Note): Promise<void> {
    await ensureNotesDir();
    getNoteFile(`${note.id}.json`).write(JSON.stringify(note));
  },

  async update(id: string, data: Partial<Note>, updatedAt: number): Promise<void> {
    const existing = await readNoteById(id);
    if (!existing) return;
    await ensureNotesDir();
    getNoteFile(`${id}.json`).write(JSON.stringify({ ...existing, ...data, updatedAt }));
  },

  async delete(id: string): Promise<void> {
    await ensureNotesDir();
    try {
      getNoteFile(`${id}.json`).delete();
    } catch {
      // Ignore missing files.
    }
  },

  async bulkInsertOrReplace(notes: Note[]): Promise<void> {
    await saveAll(notes);
  },

  async deleteAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    await ensureNotesDir();
    const files = notesDirectory.list().filter((item): item is FileSystem.File => item instanceof FileSystem.File && item.name.endsWith('.json'));
    files.forEach(file => {
      try {
        file.delete();
      } catch {
        // Ignore missing files.
      }
    });
  },
};
