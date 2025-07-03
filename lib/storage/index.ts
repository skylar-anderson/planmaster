import { StorageAdapter } from './types';
import { InMemoryStorage } from './in-memory';

/**
 * Storage instance singleton
 * Provides environment-specific storage implementation
 */
let storageInstance: StorageAdapter | null = null;

/**
 * Get or create the storage instance
 * @returns Storage adapter instance
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

/**
 * Create a new storage instance based on environment
 * @returns Storage adapter instance
 */
function createStorage(): StorageAdapter {
  // Check if we're in Edge Runtime
  const isEdgeRuntime = typeof globalThis !== 'undefined' && 
    // @ts-ignore
    globalThis.EdgeRuntime !== undefined;

  // Check if we're in Node.js
  const isNode = typeof process !== 'undefined' && 
    process.versions && 
    process.versions.node;

  // Check if we're in the browser
  const isBrowser = typeof window !== 'undefined' && 
    typeof window.document !== 'undefined';

  // For now, we use InMemoryStorage for all environments
  // In the future, we can add different implementations:
  // - LocalStorage for browser
  // - Redis for server with Redis available
  // - SQL for server with database
  
  if (isEdgeRuntime || isNode || isBrowser) {
    // Use larger capacity for server environments
    const maxSize = (isEdgeRuntime || isNode) ? 50000 : 5000;
    return new InMemoryStorage(maxSize);
  }

  // Default fallback
  return new InMemoryStorage();
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetStorage(): void {
  if (storageInstance && 'destroy' in storageInstance) {
    (storageInstance as InMemoryStorage).destroy();
  }
  storageInstance = null;
}

// Export storage instance getter as default
export const storage = getStorage();

// Re-export types for convenience
export * from './types';