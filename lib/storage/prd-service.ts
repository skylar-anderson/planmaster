import { storage } from './index';
import { PRD, validatePRD, createNewPRD } from '@/app/types/prd';

export interface PRDListItem {
  id: string;
  title: string;
  updatedAt: Date;
  isDraft: boolean;
  version: number;
}

export class PRDService {
  private static readonly PRD_KEY_PREFIX = 'prd:';
  private static readonly PRD_LIST_KEY = 'prd:list';
  private static readonly CURRENT_PRD_KEY = 'prd:current';

  /**
   * Save a PRD document
   */
  static async savePRD(prd: PRD): Promise<void> {
    const validated = validatePRD(prd);
    const key = `${this.PRD_KEY_PREFIX}${validated.id}`;
    
    await storage.set(key, validated);
    await this.updatePRDList(validated);
  }

  /**
   * Get a PRD document by ID
   */
  static async getPRD(id: string): Promise<PRD | null> {
    const key = `${this.PRD_KEY_PREFIX}${id}`;
    const prd = await storage.get<PRD>(key);
    
    if (!prd) return null;
    
    try {
      return validatePRD(prd);
    } catch (error) {
      console.error('Invalid PRD data:', error);
      return null;
    }
  }

  /**
   * Get the current active PRD
   */
  static async getCurrentPRD(): Promise<PRD | null> {
    const currentId = await storage.get<string>(this.CURRENT_PRD_KEY);
    if (!currentId) return null;
    
    return this.getPRD(currentId);
  }

  /**
   * Set the current active PRD
   */
  static async setCurrentPRD(id: string): Promise<void> {
    const prd = await this.getPRD(id);
    if (!prd) throw new Error('PRD not found');
    
    await storage.set(this.CURRENT_PRD_KEY, id);
  }

  /**
   * Create a new PRD document
   */
  static async createPRD(
    title: string,
    markdown: string = '',
    sourceContextItemIds: string[] = []
  ): Promise<PRD> {
    const prd = createNewPRD(title, markdown, sourceContextItemIds);
    await this.savePRD(prd);
    await this.setCurrentPRD(prd.id);
    return prd;
  }

  /**
   * Update an existing PRD document
   */
  static async updatePRD(
    id: string,
    updates: Partial<Omit<PRD, 'id' | 'createdAt'>>
  ): Promise<PRD | null> {
    const existing = await this.getPRD(id);
    if (!existing) return null;

    const updated: PRD = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      version: existing.version + 1,
    };

    await this.savePRD(updated);
    return updated;
  }

  /**
   * Delete a PRD document
   */
  static async deletePRD(id: string): Promise<boolean> {
    const key = `${this.PRD_KEY_PREFIX}${id}`;
    const exists = await storage.has(key);
    
    if (!exists) return false;

    await storage.delete(key);
    await this.removePRDFromList(id);
    
    // Clear current PRD if it was the deleted one
    const currentId = await storage.get<string>(this.CURRENT_PRD_KEY);
    if (currentId === id) {
      await storage.delete(this.CURRENT_PRD_KEY);
    }
    
    return true;
  }

  /**
   * Get list of all PRD documents
   */
  static async listPRDs(): Promise<PRDListItem[]> {
    const list = await storage.get<PRDListItem[]>(this.PRD_LIST_KEY);
    return list || [];
  }

  /**
   * Search PRDs by title or content
   */
  static async searchPRDs(query: string): Promise<PRDListItem[]> {
    const allPRDs = await this.listPRDs();
    const lowercaseQuery = query.toLowerCase();
    
    const results: PRDListItem[] = [];
    
    for (const item of allPRDs) {
      if (item.title.toLowerCase().includes(lowercaseQuery)) {
        results.push(item);
        continue;
      }
      
      // Search in content
      const prd = await this.getPRD(item.id);
      if (prd && prd.markdown.toLowerCase().includes(lowercaseQuery)) {
        results.push(item);
      }
    }
    
    return results;
  }

  /**
   * Auto-save functionality
   */
  static async autoSavePRD(
    id: string,
    markdown: string,
    title?: string
  ): Promise<PRD | null> {
    const updates: Partial<Omit<PRD, 'id' | 'createdAt'>> = {
      markdown,
      updatedAt: new Date(),
    };

    if (title) {
      updates.title = title;
    }

    return this.updatePRD(id, updates);
  }

  /**
   * Duplicate a PRD document
   */
  static async duplicatePRD(id: string, newTitle?: string): Promise<PRD | null> {
    const original = await this.getPRD(id);
    if (!original) return null;

    const title = newTitle || `${original.title} (Copy)`;
    const duplicated = createNewPRD(title, original.markdown, original.sourceContextItemIds);
    
    if (original.metadata) {
      duplicated.metadata = {
        ...original.metadata,
        tags: [...original.metadata.tags],
      };
    }

    await this.savePRD(duplicated);
    return duplicated;
  }

  /**
   * Update PRD list metadata
   */
  private static async updatePRDList(prd: PRD): Promise<void> {
    const list = await this.listPRDs();
    const existingIndex = list.findIndex(item => item.id === prd.id);
    
    const listItem: PRDListItem = {
      id: prd.id,
      title: prd.title,
      updatedAt: prd.updatedAt,
      isDraft: prd.isDraft,
      version: prd.version,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = listItem;
    } else {
      list.push(listItem);
    }

    // Sort by updatedAt desc
    list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    await storage.set(this.PRD_LIST_KEY, list);
  }

  /**
   * Remove PRD from list
   */
  private static async removePRDFromList(id: string): Promise<void> {
    const list = await this.listPRDs();
    const filtered = list.filter(item => item.id !== id);
    await storage.set(this.PRD_LIST_KEY, filtered);
  }

  /**
   * Get PRD statistics
   */
  static async getStats(): Promise<{
    total: number;
    drafts: number;
    published: number;
    recentlyUpdated: number;
  }> {
    const list = await this.listPRDs();
    const recent = new Date();
    recent.setDate(recent.getDate() - 7); // Last 7 days

    return {
      total: list.length,
      drafts: list.filter(item => item.isDraft).length,
      published: list.filter(item => !item.isDraft).length,
      recentlyUpdated: list.filter(item => item.updatedAt > recent).length,
    };
  }
}