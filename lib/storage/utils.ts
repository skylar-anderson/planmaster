import { StorageError } from './types';

/**
 * Type guard to check if a value is serializable to JSON
 */
export function isSerializable(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  
  if (type === 'object') {
    if (value instanceof Date) return true;
    if (Array.isArray(value)) {
      return value.every(isSerializable);
    }
    
    try {
      // Check if object is plain and all properties are serializable
      for (const key in value as object) {
        if (!isSerializable((value as any)[key])) return false;
      }
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Safely serialize a value to JSON
 */
export function safeSerialize<T>(value: T): string {
  if (!isSerializable(value)) {
    throw new StorageError(
      'Value is not serializable to JSON',
      'SERIALIZATION_ERROR'
    );
  }
  
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new StorageError(
      `Failed to serialize value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SERIALIZATION_ERROR'
    );
  }
}

/**
 * Safely deserialize a JSON string
 */
export function safeDeserialize<T>(json: string): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new StorageError(
      `Failed to deserialize value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DESERIALIZATION_ERROR'
    );
  }
}

/**
 * Validate storage key format
 */
export function validateKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new StorageError('Storage key must be a non-empty string', 'INVALID_KEY');
  }
  
  if (key.length > 250) {
    throw new StorageError('Storage key must not exceed 250 characters', 'KEY_TOO_LONG');
  }
  
  // Allow alphanumeric, dashes, underscores, colons, and dots
  const validKeyPattern = /^[a-zA-Z0-9_\-:.]+$/;
  if (!validKeyPattern.test(key)) {
    throw new StorageError(
      'Storage key must only contain alphanumeric characters, dashes, underscores, colons, and dots',
      'INVALID_KEY_FORMAT'
    );
  }
}

/**
 * Create a namespaced key
 */
export function createNamespacedKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/**
 * Extract namespace and key from a namespaced key
 */
export function parseNamespacedKey(namespacedKey: string): { namespace: string; key: string } {
  const colonIndex = namespacedKey.indexOf(':');
  if (colonIndex === -1) {
    return { namespace: '', key: namespacedKey };
  }
  
  return {
    namespace: namespacedKey.substring(0, colonIndex),
    key: namespacedKey.substring(colonIndex + 1)
  };
}