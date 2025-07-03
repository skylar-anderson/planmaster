import { 
  StorageAdapter, 
  StorageItem, 
  StorageKeyNotFoundError,
  StorageQuotaExceededError 
} from './types';
import { validateKey } from './utils';

/**
 * In-memory storage implementation
 * Provides fast, temporary storage with TTL support
 */
export class InMemoryStorage implements StorageAdapter {
  private store = new Map<string, StorageItem<any>>();
  private readonly maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
    // Run cleanup every minute to remove expired items
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    if (typeof global !== 'undefined' && global.setInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpired();
      }, 60000); // 1 minute
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expires && item.expires <= now) {
        this.store.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    validateKey(key);
    
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expires && item.expires <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    validateKey(key);
    
    // Check size limit
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      throw new StorageQuotaExceededError(
        `Maximum storage size of ${this.maxSize} items exceeded`
      );
    }

    const now = Date.now();
    const item: StorageItem<T> = {
      value,
      created: this.store.get(key)?.created || now,
      updated: now,
      expires: ttl ? now + ttl : undefined
    };

    this.store.set(key, item);
  }

  async delete(key: string): Promise<boolean> {
    validateKey(key);
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    validateKey(key);
    
    const item = this.store.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (item.expires && item.expires <= Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    // Clean up expired items first
    this.cleanupExpired();

    const keys = Array.from(this.store.keys());

    if (!pattern) {
      return keys;
    }

    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' + pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
      + '$'
    );

    return keys.filter(key => regex.test(key));
  }

  async size(): Promise<number> {
    // Clean up expired items first
    this.cleanupExpired();
    return this.store.size;
  }

  /**
   * Cleanup method to stop the interval timer
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}