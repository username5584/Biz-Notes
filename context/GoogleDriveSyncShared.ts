import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { TOMBSTONE_KEY, useNotes } from '@/context/NotesContext';
import {
  type SyncPayload,
  type Tombstone,
  createSyncFile,
  findSyncFile,
  mergeSyncPayloads,
  readSyncFile,
  updateSyncFile,
} from '@/utils/googleDriveSync';

export const TOKEN_KEY = '@gdrive_access_token';
export const USER_KEY = '@gdrive_user_email';
export const LAST_SYNC_KEY = '@gdrive_last_sync';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface GoogleDriveSyncContextType {
  userEmail: string | null;
  signIn: () => void;
  signingIn: boolean;
  signOut: () => Promise<void>;
  sync: () => Promise<void>;
  status: SyncStatus;
  statusMessage: string;
  lastSyncTime: number | null;
  redirectUri?: string;
}

export interface GoogleDriveSyncCore {
  handleToken: (token: string) => void;
  userEmail: string | null;
  signOut: () => Promise<void>;
  sync: () => Promise<void>;
  status: SyncStatus;
  statusMessage: string;
  lastSyncTime: number | null;
}

export const GoogleDriveSyncContext = createContext<GoogleDriveSyncContextType | null>(null);

export function useGoogleDriveSync(): GoogleDriveSyncContextType {
  const ctx = useContext(GoogleDriveSyncContext);
  if (!ctx) throw new Error('useGoogleDriveSync must be inside GoogleDriveSyncProvider');
  return ctx;
}

export function useGoogleDriveSyncCore(): GoogleDriveSyncCore {
  const { notes, importNotes } = useNotes();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const accessTokenRef = useRef<string | null>(null);
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  useEffect(() => {
    (async () => {
      const [token, email, lastSync] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(LAST_SYNC_KEY),
      ]);
      if (token) accessTokenRef.current = token;
      if (email) setUserEmail(email);
      if (lastSync) setLastSyncTime(parseInt(lastSync, 10));
    })();
  }, []);

  const fetchUserEmail = useCallback(async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=name=\'me\'+and+trashed%3Dfalse&spaces=drive&fields=files(id,email)',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as { email?: string };
      const email = data.email ?? null;
      setUserEmail(email);
      if (email) await AsyncStorage.setItem(USER_KEY, email);
    } catch {  }
  }, []);

  const handleToken = useCallback((token: string) => {
    accessTokenRef.current = token;
    AsyncStorage.setItem(TOKEN_KEY, token);
    fetchUserEmail(token);
  }, [fetchUserEmail]);

  const signOut = useCallback(async () => {
    accessTokenRef.current = null;
    setUserEmail(null);
    setStatus('idle');
    setStatusMessage('');
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }, []);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);

  
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const sync = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) return;
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setStatus('syncing');
    setStatusMessage('Синхронизация...');
    try {
      
      const tombstoneRaw = await AsyncStorage.getItem(TOMBSTONE_KEY);
      const localTombstones: Tombstone[] = tombstoneRaw ? (JSON.parse(tombstoneRaw) as Tombstone[]) : [];

      const localPayload: SyncPayload = {
        version: 2,
        notes: notesRef.current,
        deletedIds: localTombstones,
      };

      const fileId = await findSyncFile(token);
      let merged: SyncPayload;

      if (fileId) {
        const remotePayload = await readSyncFile(token, fileId);
        merged = mergeSyncPayloads(localPayload, remotePayload);
        
        await importNotes(merged.notes);
        await updateSyncFile(token, fileId, merged);
      } else {
        merged = localPayload;
        await createSyncFile(token, merged);
      }

      
      await AsyncStorage.setItem(TOMBSTONE_KEY, JSON.stringify(merged.deletedIds));

      const now = Date.now();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
      setLastSyncTime(now);
      setStatus('success');
      setStatusMessage(`Синхронизировано (${merged.notes.length} заметок)`);
      resetTimerRef.current = setTimeout(() => setStatus('idle'), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка синхронизации';
      if (msg.includes('401') || msg.includes('403')) {
        await signOut();
        setStatus('error');
        setStatusMessage('Сессия истекла — войди снова');
      } else {
        setStatus('error');
        setStatusMessage(msg);
      }
      resetTimerRef.current = setTimeout(() => setStatus('idle'), 5000);
    } finally {
      syncingRef.current = false;
    }
  }, [importNotes, signOut]);

  const contextValue = useMemo(() => ({
    handleToken,
    userEmail,
    signOut,
    sync,
    status,
    statusMessage,
    lastSyncTime,
  }), [handleToken, userEmail, signOut, sync, status, statusMessage, lastSyncTime]);

  return contextValue;
}
