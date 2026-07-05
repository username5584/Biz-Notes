import type { Note } from '@/context/NotesContext';

export interface NoteStorageService {
  loadAll(): Promise<Note[]>;
  insert(note: Note): Promise<void>;
  update(id: string, data: Partial<Note>, updatedAt: number): Promise<void>;
  delete(id: string): Promise<void>;
  bulkInsertOrReplace(notes: Note[]): Promise<void>;
  deleteAll(): Promise<void>;
}
