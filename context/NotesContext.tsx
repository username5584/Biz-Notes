import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import {
  filesystemService,
  sqliteService,
  type NoteStorageService,
} from './services';
import { sortNotesByDate } from '@/utils/format';
export type StorageMode = 'sqlite' | 'filesystem';

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesContextType {
  notes: Note[];
  storageMode: StorageMode;
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  switchStorageMode: (mode: StorageMode) => Promise<void>;
  importNotes: (notes: Note[]) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);

const STORAGE_MODE_KEY = '@notes_storage_mode';
export const TOMBSTONE_KEY = '@deleted_notes_tombstones';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [storageMode, setStorageMode] = useState<StorageMode>('sqlite');
  const [isLoading, setIsLoading] = useState(true);

  const notesRef = useRef<Note[]>(notes);
  const storageModeRef = useRef<StorageMode>(storageMode);

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { storageModeRef.current = storageMode; }, [storageMode]);

  const getStorageService = useCallback((): NoteStorageService => {
    if (storageModeRef.current === 'sqlite') {
      return sqliteService;
    }
    return filesystemService;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const savedMode = (await AsyncStorage.getItem(STORAGE_MODE_KEY)) as StorageMode | null;
        const mode: StorageMode = savedMode === 'filesystem' ? 'filesystem' : 'sqlite';

        setStorageMode(mode);
        storageModeRef.current = mode;

        const service = getStorageService();
        const loaded = await service.loadAll();
        setNotes(loaded);
        notesRef.current = loaded;
      } catch {
        
      } finally {
        setIsLoading(false);
      }
    };
    init();
    
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const service = getStorageService();
      const loaded = await service.loadAll();
      setNotes(loaded);
    } catch {
      
    }
  }, [getStorageService]);

  const createNote = useCallback(
    async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
      const now = Date.now();
      const note: Note = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const service = getStorageService();
      await service.insert(note);
      setNotes(prev => [note, ...prev]);
      return note;
    },
    [getStorageService],
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> => {
      const updatedAt = Date.now();
      const service = getStorageService();
      await service.update(id, data, updatedAt);
      setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...data, updatedAt } : n)));
    },
    [getStorageService],
  );

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    
    try {
      const raw = await AsyncStorage.getItem(TOMBSTONE_KEY);
      const tombstones: { id: string; deletedAt: number }[] = raw ? JSON.parse(raw) : [];
      const filtered = tombstones.filter(t => t.id !== id);
      filtered.push({ id, deletedAt: Date.now() });
      await AsyncStorage.setItem(TOMBSTONE_KEY, JSON.stringify(filtered));
    } catch {  }

    const service = getStorageService();
    await service.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [getStorageService]);

  const importNotes = useCallback(async (incoming: Note[]): Promise<void> => {
    
    
    const service = getStorageService();
    await service.deleteAll();
    if (incoming.length > 0) {
      await service.bulkInsertOrReplace(incoming);
    }
    const loaded = await service.loadAll();
    setNotes(loaded);
    notesRef.current = loaded;
  }, [getStorageService]);

  const switchStorageMode = useCallback(
    async (newMode: StorageMode): Promise<void> => {
      if (newMode === storageModeRef.current) return;
      if (Platform.OS === 'web' && newMode === 'filesystem') return;

      const oldService = getStorageService();
      const current = await oldService.loadAll();

      if (newMode === 'sqlite') {
        await sqliteService.bulkInsertOrReplace(current);
        await filesystemService.deleteAll();
      } else {
        await filesystemService.bulkInsertOrReplace(current);
        await sqliteService.deleteAll();
      }

      await AsyncStorage.setItem(STORAGE_MODE_KEY, newMode);
      const sorted = sortNotesByDate(current);
      setStorageMode(newMode);
      storageModeRef.current = newMode;
      setNotes(sorted);
      notesRef.current = sorted;
    },
    [getStorageService],
  );

  const contextValue = useMemo(() => ({
    notes,
    storageMode,
    isLoading,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    switchStorageMode,
    importNotes,
  }), [
    notes,
    storageMode,
    isLoading,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    switchStorageMode,
    importNotes,
  ]);

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes(): NotesContextType {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider');
  return ctx;
}


export function useNotesList(): Note[] {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotesList must be used inside NotesProvider');
  return ctx.notes;
}

export function useNotesLoading(): boolean {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotesLoading must be used inside NotesProvider');
  return ctx.isLoading;
}