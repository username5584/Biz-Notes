import type { Note } from '@/context/NotesContext';
import type { NoteStorageService } from './types';


export const sqliteService: NoteStorageService = {
  async loadAll(): Promise<Note[]> {
    return [];
  },

  async insert(): Promise<void> {
    console.warn('SQLite unavailable on web');
  },

  async update(): Promise<void> {
    console.warn('SQLite unavailable on web');
  },

  async delete(): Promise<void> {
    console.warn('SQLite unavailable on web');
  },

  async bulkInsertOrReplace(): Promise<void> {
    console.warn('SQLite unavailable on web');
  },

  async deleteAll(): Promise<void> {
    console.warn('SQLite unavailable on web');
  },
};
