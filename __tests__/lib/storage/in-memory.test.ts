import { InMemoryStorage } from '../../../lib/storage/in-memory';
import { 
  StorageQuotaExceededError, 
  StorageError 
} from '../../../lib/storage/types';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  afterEach(() => {
    storage.destroy();
  });

  describe('get/set operations', () => {
    it('should store and retrieve values', async () => {
      await storage.set('key1', 'value1');
      const result = await storage.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should store and retrieve complex objects', async () => {
      const obj = { name: 'test', count: 42, nested: { data: [1, 2, 3] } };
      await storage.set('complex', obj);
      const result = await storage.get<typeof obj>('complex');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent keys', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should update existing values', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key1', 'value2');
      const result = await storage.get<string>('key1');
      expect(result).toBe('value2');
    });

    it('should handle null and undefined values', async () => {
      await storage.set('null', null);
      await storage.set('undefined', undefined);
      
      expect(await storage.get('null')).toBeNull();
      expect(await storage.get('undefined')).toBe(undefined);
    });
  });

  describe('TTL functionality', () => {
    it('should expire items after TTL', async () => {
      await storage.set('expiring', 'value', 100); // 100ms TTL
      
      // Should exist immediately
      expect(await storage.get('expiring')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(await storage.get('expiring')).toBeNull();
    });

    it('should not expire items without TTL', async () => {
      await storage.set('permanent', 'value');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(await storage.get('permanent')).toBe('value');
    });
  });

  describe('delete operation', () => {
    it('should delete existing keys', async () => {
      await storage.set('key1', 'value1');
      const deleted = await storage.delete('key1');
      
      expect(deleted).toBe(true);
      expect(await storage.get('key1')).toBeNull();
    });

    it('should return false when deleting non-existent keys', async () => {
      const deleted = await storage.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('has operation', () => {
    it('should return true for existing keys', async () => {
      await storage.set('key1', 'value1');
      expect(await storage.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      expect(await storage.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      await storage.set('expiring', 'value', 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(await storage.has('expiring')).toBe(false);
    });
  });

  describe('clear operation', () => {
    it('should remove all stored items', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.set('key3', 'value3');
      
      await storage.clear();
      
      expect(await storage.has('key1')).toBe(false);
      expect(await storage.has('key2')).toBe(false);
      expect(await storage.has('key3')).toBe(false);
      expect(await storage.size()).toBe(0);
    });
  });

  describe('keys operation', () => {
    beforeEach(async () => {
      await storage.set('user:1', 'user1');
      await storage.set('user:2', 'user2');
      await storage.set('post:1', 'post1');
      await storage.set('config:app', 'config');
    });

    it('should return all keys without pattern', async () => {
      const keys = await storage.keys();
      expect(keys).toHaveLength(4);
      expect(keys).toContain('user:1');
      expect(keys).toContain('user:2');
      expect(keys).toContain('post:1');
      expect(keys).toContain('config:app');
    });

    it('should filter keys by pattern', async () => {
      const userKeys = await storage.keys('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
    });

    it('should handle complex patterns', async () => {
      const keys = await storage.keys('*:1');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('user:1');
      expect(keys).toContain('post:1');
    });

    it('should not include expired keys', async () => {
      await storage.set('expiring:1', 'value', 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const keys = await storage.keys('expiring:*');
      expect(keys).toHaveLength(0);
    });
  });

  describe('size operation', () => {
    it('should return correct item count', async () => {
      expect(await storage.size()).toBe(0);
      
      await storage.set('key1', 'value1');
      expect(await storage.size()).toBe(1);
      
      await storage.set('key2', 'value2');
      expect(await storage.size()).toBe(2);
      
      await storage.delete('key1');
      expect(await storage.size()).toBe(1);
    });

    it('should not count expired items', async () => {
      await storage.set('permanent', 'value');
      await storage.set('expiring', 'value', 50);
      
      expect(await storage.size()).toBe(2);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(await storage.size()).toBe(1);
    });
  });

  describe('quota management', () => {
    it('should throw error when exceeding quota', async () => {
      const smallStorage = new InMemoryStorage(3);
      
      await smallStorage.set('key1', 'value1');
      await smallStorage.set('key2', 'value2');
      await smallStorage.set('key3', 'value3');
      
      await expect(smallStorage.set('key4', 'value4'))
        .rejects.toThrow(StorageQuotaExceededError);
      
      smallStorage.destroy();
    });

    it('should allow updates without exceeding quota', async () => {
      const smallStorage = new InMemoryStorage(2);
      
      await smallStorage.set('key1', 'value1');
      await smallStorage.set('key2', 'value2');
      
      // Update should work
      await expect(smallStorage.set('key1', 'updated'))
        .resolves.toBeUndefined();
      
      smallStorage.destroy();
    });
  });

  describe('key validation', () => {
    it('should reject invalid keys', async () => {
      await expect(storage.set('', 'value'))
        .rejects.toThrow(StorageError);
      
      await expect(storage.set('key with spaces', 'value'))
        .rejects.toThrow(StorageError);
      
      await expect(storage.set('key@invalid', 'value'))
        .rejects.toThrow(StorageError);
    });

    it('should accept valid keys', async () => {
      const validKeys = [
        'simple',
        'with-dash',
        'with_underscore',
        'with:colon',
        'with.dot',
        'MixedCase123'
      ];
      
      for (const key of validKeys) {
        await expect(storage.set(key, 'value'))
          .resolves.toBeUndefined();
      }
    });

    it('should reject keys that are too long', async () => {
      const longKey = 'a'.repeat(251);
      await expect(storage.set(longKey, 'value'))
        .rejects.toThrow(StorageError);
    });
  });

  describe('cleanup interval', () => {
    it('should automatically clean up expired items', async () => {
      // Use a storage instance with faster cleanup for testing
      const testStorage = new InMemoryStorage();
      
      // Set items with short TTL
      await testStorage.set('expire1', 'value', 50);
      await testStorage.set('expire2', 'value', 50);
      await testStorage.set('permanent', 'value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force cleanup by calling size (which triggers cleanup)
      expect(await testStorage.size()).toBe(1);
      
      testStorage.destroy();
    });
  });
});