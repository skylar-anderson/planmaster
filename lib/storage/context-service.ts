import { storage } from './index';
import { 
  ContextItem, 
  CreateContextItem, 
  UpdateContextItem, 
  ContextFilter,
  validateContextItem,
  validateCreateContextItem,
  validateUpdateContextItem,
  validateContextFilter
} from '@/types/context';
import { StorageError, StorageKeyNotFoundError } from './types';

/**
 * Context service for managing context items with CRUD operations
 */
export class ContextService {
  private static readonly KEY_PREFIX = 'context:';
  private static readonly INDEX_KEY = 'context:_index';

  /**
   * Generate storage key for a context item
   */
  private static getItemKey(id: string): string {
    return `${this.KEY_PREFIX}${id}`;
  }

  /**
   * Generate a unique ID for new context items
   */
  private static generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get the index of all context item IDs
   */
  private static async getIndex(): Promise<string[]> {
    try {
      const index = await storage.get<string[]>(this.INDEX_KEY);
      return index || [];
    } catch (error) {
      console.error('Error getting context index:', error);
      return [];
    }
  }

  /**
   * Update the index with a new set of IDs
   */
  private static async updateIndex(ids: string[]): Promise<void> {
    try {
      await storage.set(this.INDEX_KEY, ids);
    } catch (error) {
      console.error('Error updating context index:', error);
      throw new StorageError('Failed to update context index', 'INDEX_UPDATE_FAILED');
    }
  }

  /**
   * Add an ID to the index
   */
  private static async addToIndex(id: string): Promise<void> {
    const index = await this.getIndex();
    if (!index.includes(id)) {
      index.push(id);
      await this.updateIndex(index);
    }
  }

  /**
   * Remove an ID from the index
   */
  private static async removeFromIndex(id: string): Promise<void> {
    const index = await this.getIndex();
    const filteredIndex = index.filter(itemId => itemId !== id);
    if (filteredIndex.length !== index.length) {
      await this.updateIndex(filteredIndex);
    }
  }

  /**
   * Create a new context item
   */
  static async create(data: CreateContextItem): Promise<ContextItem> {
    try {
      // Validate input data
      const validatedData = validateCreateContextItem(data);
      
      // Generate ID and timestamps
      const id = this.generateId();
      const now = new Date();
      
      const contextItem: ContextItem = {
        ...validatedData,
        id,
        createdAt: now,
        updatedAt: now
      };

      // Validate the complete item
      const validatedItem = validateContextItem(contextItem);
      
      // Store the item
      await storage.set(this.getItemKey(id), validatedItem);
      
      // Add to index
      await this.addToIndex(id);
      
      return validatedItem;
    } catch (error) {
      console.error('Error creating context item:', error);
      if (error instanceof Error) {
        throw new StorageError(`Failed to create context item: ${error.message}`, 'CREATE_FAILED');
      }
      throw new StorageError('Failed to create context item', 'CREATE_FAILED');
    }
  }

  /**
   * Get a context item by ID
   */
  static async getById(id: string): Promise<ContextItem | null> {
    try {
      const item = await storage.get<ContextItem>(this.getItemKey(id));
      if (!item) {
        return null;
      }
      
      // Validate the retrieved item
      return validateContextItem(item);
    } catch (error) {
      console.error('Error getting context item:', error);
      return null;
    }
  }

  /**
   * Get all context items with optional filtering
   */
  static async getAll(filter?: ContextFilter): Promise<ContextItem[]> {
    try {
      const validatedFilter = filter ? validateContextFilter(filter) : {};
      const index = await this.getIndex();
      const items: ContextItem[] = [];

      // Retrieve all items
      for (const id of index) {
        const item = await this.getById(id);
        if (item) {
          items.push(item);
        }
      }

      // Apply filters
      let filteredItems = items;

      // Filter by categories
      if (validatedFilter.categories && validatedFilter.categories.length > 0) {
        filteredItems = filteredItems.filter(item => 
          validatedFilter.categories!.includes(item.category)
        );
      }

      // Filter by tags
      if (validatedFilter.tags && validatedFilter.tags.length > 0) {
        filteredItems = filteredItems.filter(item =>
          validatedFilter.tags!.some(tag => item.tags.includes(tag))
        );
      }

      // Filter by archive status
      if (validatedFilter.isArchived !== undefined) {
        filteredItems = filteredItems.filter(item => 
          item.isArchived === validatedFilter.isArchived
        );
      }

      // Filter by search term (title and content)
      if (validatedFilter.searchTerm) {
        const searchTerm = validatedFilter.searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.contentMd.toLowerCase().includes(searchTerm)
        );
      }

      // Sort by updated date (most recent first)
      filteredItems.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Apply pagination
      const offset = validatedFilter.offset || 0;
      const limit = validatedFilter.limit || 50;
      
      return filteredItems.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting all context items:', error);
      return [];
    }
  }

  /**
   * Update a context item
   */
  static async update(updates: UpdateContextItem): Promise<ContextItem | null> {
    try {
      // Validate input data
      const validatedUpdates = validateUpdateContextItem(updates);
      
      // Get existing item
      const existing = await this.getById(validatedUpdates.id);
      if (!existing) {
        throw new StorageKeyNotFoundError(validatedUpdates.id);
      }

      // Apply updates
      const updatedItem: ContextItem = {
        ...existing,
        ...validatedUpdates,
        updatedAt: new Date()
      };

      // Validate the updated item
      const validatedItem = validateContextItem(updatedItem);
      
      // Store the updated item
      await storage.set(this.getItemKey(validatedItem.id), validatedItem);
      
      return validatedItem;
    } catch (error) {
      console.error('Error updating context item:', error);
      if (error instanceof StorageKeyNotFoundError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new StorageError(`Failed to update context item: ${error.message}`, 'UPDATE_FAILED');
      }
      throw new StorageError('Failed to update context item', 'UPDATE_FAILED');
    }
  }

  /**
   * Delete a context item
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // Check if item exists
      const exists = await storage.has(this.getItemKey(id));
      if (!exists) {
        return false;
      }

      // Delete the item
      await storage.delete(this.getItemKey(id));
      
      // Remove from index
      await this.removeFromIndex(id);
      
      return true;
    } catch (error) {
      console.error('Error deleting context item:', error);
      throw new StorageError('Failed to delete context item', 'DELETE_FAILED');
    }
  }

  /**
   * Delete all context items
   */
  static async deleteAll(): Promise<number> {
    try {
      const index = await this.getIndex();
      let deletedCount = 0;

      // Delete all items
      for (const id of index) {
        try {
          await storage.delete(this.getItemKey(id));
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting context item ${id}:`, error);
        }
      }

      // Clear the index
      await storage.delete(this.INDEX_KEY);
      
      return deletedCount;
    } catch (error) {
      console.error('Error deleting all context items:', error);
      throw new StorageError('Failed to delete all context items', 'DELETE_ALL_FAILED');
    }
  }

  /**
   * Get count of context items
   */
  static async count(filter?: Omit<ContextFilter, 'limit' | 'offset'>): Promise<number> {
    try {
      const items = await this.getAll({ ...filter, limit: 999999, offset: 0 });
      return items.length;
    } catch (error) {
      console.error('Error counting context items:', error);
      return 0;
    }
  }

  /**
   * Archive/unarchive a context item
   */
  static async archive(id: string, isArchived: boolean = true): Promise<ContextItem | null> {
    return this.update({ id, isArchived });
  }

  /**
   * Get all unique tags used in context items
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const items = await this.getAll({ limit: 999999 });
      const tagSet = new Set<string>();
      
      items.forEach(item => {
        item.tags.forEach(tag => tagSet.add(tag));
      });
      
      return Array.from(tagSet).sort();
    } catch (error) {
      console.error('Error getting all tags:', error);
      return [];
    }
  }

  /**
   * Export all context items (for backup/migration)
   */
  static async export(): Promise<ContextItem[]> {
    return this.getAll({ limit: 999999 });
  }

  /**
   * Import context items (for backup/migration)
   */
  static async import(items: ContextItem[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await storage.set(this.getItemKey(item.id), validateContextItem(item));
        await this.addToIndex(item.id);
        success++;
      } catch (error) {
        console.error(`Failed to import item ${item.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

// Export a default instance for convenience
export const contextService = ContextService;