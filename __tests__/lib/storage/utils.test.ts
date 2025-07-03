import {
  isSerializable,
  safeSerialize,
  safeDeserialize,
  validateKey,
  createNamespacedKey,
  parseNamespacedKey
} from '../../../lib/storage/utils';
import { StorageError } from '../../../lib/storage/types';

describe('Storage Utils', () => {
  describe('isSerializable', () => {
    it('should return true for primitive types', () => {
      expect(isSerializable('string')).toBe(true);
      expect(isSerializable(123)).toBe(true);
      expect(isSerializable(true)).toBe(true);
      expect(isSerializable(null)).toBe(true);
      expect(isSerializable(undefined)).toBe(true);
    });

    it('should return true for plain objects', () => {
      expect(isSerializable({ a: 1, b: 'test' })).toBe(true);
      expect(isSerializable({ nested: { value: 42 } })).toBe(true);
    });

    it('should return true for arrays', () => {
      expect(isSerializable([1, 2, 3])).toBe(true);
      expect(isSerializable([{ a: 1 }, { b: 2 }])).toBe(true);
    });

    it('should return true for dates', () => {
      expect(isSerializable(new Date())).toBe(true);
    });

    it('should return false for functions', () => {
      expect(isSerializable(() => {})).toBe(false);
      expect(isSerializable(function() {})).toBe(false);
    });

    it('should return false for symbols', () => {
      expect(isSerializable(Symbol('test'))).toBe(false);
    });

    it('should return false for objects with non-serializable properties', () => {
      expect(isSerializable({ fn: () => {} })).toBe(false);
      expect(isSerializable({ sym: Symbol('test') })).toBe(false);
    });
  });

  describe('safeSerialize', () => {
    it('should serialize valid values', () => {
      expect(safeSerialize('test')).toBe('"test"');
      expect(safeSerialize(123)).toBe('123');
      expect(safeSerialize({ a: 1 })).toBe('{"a":1}');
    });

    it('should throw error for non-serializable values', () => {
      expect(() => safeSerialize(() => {})).toThrow(StorageError);
      expect(() => safeSerialize(Symbol('test'))).toThrow(StorageError);
    });

    it('should handle dates correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const serialized = safeSerialize(date);
      expect(serialized).toBe('"2024-01-01T00:00:00.000Z"');
    });
  });

  describe('safeDeserialize', () => {
    it('should deserialize valid JSON', () => {
      expect(safeDeserialize('"test"')).toBe('test');
      expect(safeDeserialize('123')).toBe(123);
      expect(safeDeserialize('{"a":1}')).toEqual({ a: 1 });
    });

    it('should throw error for invalid JSON', () => {
      expect(() => safeDeserialize('invalid')).toThrow(StorageError);
      expect(() => safeDeserialize('{incomplete')).toThrow(StorageError);
    });
  });

  describe('validateKey', () => {
    it('should accept valid keys', () => {
      const validKeys = [
        'simple',
        'with-dash',
        'with_underscore',
        'with:colon',
        'with.dot',
        'MixedCase123',
        'namespace:key'
      ];

      validKeys.forEach(key => {
        expect(() => validateKey(key)).not.toThrow();
      });
    });

    it('should reject empty keys', () => {
      expect(() => validateKey('')).toThrow(StorageError);
      expect(() => validateKey(null as any)).toThrow(StorageError);
      expect(() => validateKey(undefined as any)).toThrow(StorageError);
    });

    it('should reject keys with invalid characters', () => {
      expect(() => validateKey('key with spaces')).toThrow(StorageError);
      expect(() => validateKey('key@invalid')).toThrow(StorageError);
      expect(() => validateKey('key#hash')).toThrow(StorageError);
      expect(() => validateKey('key/slash')).toThrow(StorageError);
    });

    it('should reject keys that are too long', () => {
      const longKey = 'a'.repeat(251);
      expect(() => validateKey(longKey)).toThrow(StorageError);
    });

    it('should accept keys at the maximum length', () => {
      const maxKey = 'a'.repeat(250);
      expect(() => validateKey(maxKey)).not.toThrow();
    });
  });

  describe('createNamespacedKey', () => {
    it('should create namespaced keys', () => {
      expect(createNamespacedKey('user', '123')).toBe('user:123');
      expect(createNamespacedKey('config', 'app.settings')).toBe('config:app.settings');
    });

    it('should handle empty namespace', () => {
      expect(createNamespacedKey('', 'key')).toBe(':key');
    });

    it('should handle complex keys', () => {
      expect(createNamespacedKey('cache', 'user:profile:123'))
        .toBe('cache:user:profile:123');
    });
  });

  describe('parseNamespacedKey', () => {
    it('should parse simple namespaced keys', () => {
      expect(parseNamespacedKey('user:123')).toEqual({
        namespace: 'user',
        key: '123'
      });
    });

    it('should parse keys without namespace', () => {
      expect(parseNamespacedKey('simple')).toEqual({
        namespace: '',
        key: 'simple'
      });
    });

    it('should handle keys with multiple colons', () => {
      expect(parseNamespacedKey('cache:user:profile:123')).toEqual({
        namespace: 'cache',
        key: 'user:profile:123'
      });
    });

    it('should handle empty namespace', () => {
      expect(parseNamespacedKey(':key')).toEqual({
        namespace: '',
        key: 'key'
      });
    });
  });
});