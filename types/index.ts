/**
 * Глобальные типы приложения
 */

export type { Note, StorageMode } from '@/context/NotesContext';
export type { NoteStorageService } from '@/context/services/types';
export type { SyncPayload, Tombstone } from '@/utils/googleDriveSync';
export type { SyncStatus } from '@/context/GoogleDriveSyncShared';
export type { IconName } from '@/components/ui/Icon';
export type { Colors } from '@/hooks/useColors';
export type { ColorPalette } from '@/constants/colors';
