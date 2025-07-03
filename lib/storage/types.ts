/**
 * Storage adapter interface for flexible storage implementations
 * Supports both synchronous (in-memory) and asynchronous (Redis/SQL) implementations
 */
export interface StorageAdapter {
  /**
   * Retrieve a value by key
   * @param key - The key to retrieve
   * @returns The stored value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store a value with optional TTL
   * @param key - The key to store under
   * @param value - The value to store
   * @param ttl - Optional time-to-live in milliseconds
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete a value by key
   * @param key - The key to delete
   * @returns true if the key existed and was deleted, false otherwise
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists
   * @param key - The key to check
   * @returns true if the key exists, false otherwise
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all stored values
   */
  clear(): Promise<void>;

  /**
   * Get all keys (with optional pattern matching)
   * @param pattern - Optional pattern to filter keys (e.g., "user:*")
   * @returns Array of matching keys
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Get the size of the storage
   * @returns Number of stored items
   */
  size(): Promise<number>;
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageKeyNotFoundError extends StorageError {
  constructor(key: string) {
    super(`Key "${key}" not found`, 'KEY_NOT_FOUND');
  }
}

export class StorageQuotaExceededError extends StorageError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message, 'QUOTA_EXCEEDED');
  }
}

/**
 * Storage item with metadata
 */
export interface StorageItem<T> {
  value: T;
  expires?: number; // Unix timestamp in milliseconds
  created: number; // Unix timestamp in milliseconds
  updated: number; // Unix timestamp in milliseconds
}