import * as SQLite from 'expo-sqlite';

import type { Note } from '@/context/NotesContext';
import type { NoteStorageService } from './types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync('notes.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL DEFAULT '',
          time TEXT NOT NULL DEFAULT '',
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        );
      `);
    } catch (error) {
      throw error;
    }
  }
  return db;
}

export const sqliteService: NoteStorageService = {
  async loadAll(): Promise<Note[]> {
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<Note>('SELECT * FROM notes ORDER BY createdAt DESC');
      return rows;
    } catch {
      return [];
    }
  },

  async insert(note: Note): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'INSERT INTO notes (id, title, content, date, time, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [note.id, note.title, note.content, note.date, note.time, note.createdAt, note.updatedAt],
    );
  },

  async update(id: string, data: Partial<Note>, updatedAt: number): Promise<void> {
    const database = await getDb();
    const keys = Object.keys(data);
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values: (string | number)[] = [
      ...(Object.values(data) as (string | number)[]),
      updatedAt,
      id,
    ];
    await database.runAsync(`UPDATE notes SET ${sets}, updatedAt = ? WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  },

  async bulkInsertOrReplace(notes: Note[]): Promise<void> {
    if (!notes.length) return;
    const database = await getDb();
    await database.withTransactionAsync(async () => {
      for (const note of notes) {
        await database.runAsync(
          'INSERT OR REPLACE INTO notes (id, title, content, date, time, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [note.id, note.title, note.content, note.date, note.time, note.createdAt, note.updatedAt],
        );
      }
    });
  },

  async deleteAll(): Promise<void> {
    const database = await getDb();
    await database.execAsync('DELETE FROM notes');
  },
};
