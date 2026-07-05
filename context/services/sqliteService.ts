




// Platform-specific export resolution
// Metro bundler will resolve:
// - .native.ts on iOS/Android
// - .web.ts on web
// This file is for TypeScript type checking only
export { sqliteService } from './sqliteService.native';
export type { NoteStorageService } from './types';
