/**
 * Tests for AI integration functionality
 */

import { generatePRD, createTasks } from '@/app/actions/orchestrator';
import { generateMockPRD, generateMockTasks, shouldUseMocks } from '@/lib/ai/mocks';
import { AIError, mapToAIError } from '@/lib/ai/errors';
import { withRetry, RETRY_CONFIGS } from '@/lib/ai/retry';
import { ContextItem } from '@/types/context';

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
    size: jest.fn(),
  }
}));

// Mock the AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(),
}));

describe('AI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.USE_AI_MOCKS = 'true';
    process.env.MOCK_SCENARIO = 'success';
  });

  describe('Mock System', () => {
    it('should detect when mocks are enabled', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_AI_MOCKS = 'true';
      
      expect(shouldUseMocks()).toBe(true);
    });

    it('should generate mock PRD content', () => {
      const contextItems: ContextItem[] = [
        {
          id: '1',
          title: 'Project Management Platform',
          contentMd: 'A comprehensive project management solution',
          tags: [],
          category: 'requirement',
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        },
        {
          id: '2',
          title: 'Task Management Feature',
          contentMd: 'Users should be able to create and manage tasks',
          tags: ['core'],
          category: 'feature',
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        }
      ];

      const prd = generateMockPRD(contextItems);
      
      expect(prd).toContain('Project Management Platform');
      expect(prd).toContain('Executive Summary');
      expect(prd).toContain('Problem Statement');
      expect(prd).toContain('Technical Specifications');
      expect(typeof prd).toBe('string');
      expect(prd.length).toBeGreaterThan(1000);
    });

    it('should generate mock task list', () => {
      const tasks = generateMockTasks('Mock project description');
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(5);
      
      const firstTask = tasks[0];
      expect(firstTask).toHaveProperty('id');
      expect(firstTask).toHaveProperty('title');
      expect(firstTask).toHaveProperty('description');
      expect(firstTask).toHaveProperty('complexity');
      expect(firstTask).toHaveProperty('status');
      expect(firstTask).toHaveProperty('priority');
      expect(firstTask).toHaveProperty('category');
      
      // Validate complexity scores
      tasks.forEach(task => {
        expect(task.complexity).toBeGreaterThanOrEqual(1);
        expect(task.complexity).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Error Handling', () => {
    it('should map generic errors to AI errors', () => {
      const networkError = new Error('fetch failed');
      const aiError = mapToAIError(networkError);
      
      expect(aiError).toBeInstanceOf(AIError);
      expect(aiError.code).toBe('NETWORK_ERROR');
      expect(aiError.message).toBe('fetch failed');
    });

    it('should map rate limit errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const aiError = mapToAIError(rateLimitError);
      
      expect(aiError.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should map authentication errors correctly', () => {
      const authError = new Error('Invalid API key');
      const aiError = mapToAIError(authError);
      
      expect(aiError.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      let attempts = 0;
      const mockFunction = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const result = await withRetry(mockFunction, RETRY_CONFIGS.FAST);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFunction = jest.fn().mockImplementation(async () => {
        throw new Error('Invalid request format');
      });

      await expect(withRetry(mockFunction, RETRY_CONFIGS.FAST)).rejects.toThrow();
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      const mockFunction = jest.fn().mockImplementation(async () => {
        throw new Error('Network error');
      });

      await expect(withRetry(mockFunction, {
        maxAttempts: 2,
        baseDelay: 10,
        timeoutMs: 1000,
      })).rejects.toThrow();
      
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      const { storage } = require('@/lib/storage');
      
      // Mock storage responses
      storage.get.mockImplementation(async (key: string) => {
        if (key.startsWith('context:')) {
          return {
            id: key.split(':')[1],
            title: 'Test Context Item',
            contentMd: 'Test content',
            tags: [],
            category: 'requirement',
            createdAt: new Date(),
            updatedAt: new Date(),
            isArchived: false,
          };
        }
        if (key.startsWith('prd:')) {
          return {
            id: key.split(':')[1],
            title: 'Test PRD',
            markdown: 'Test PRD content',
            createdAt: new Date(),
            updatedAt: new Date(),
            sourceContextItemIds: [],
            version: 1,
            isDraft: true,
          };
        }
        return null;
      });
      
      storage.set.mockResolvedValue(undefined);
    });

    it('should generate PRD from context items', async () => {
      const contextItemIds = ['1', '2'];
      
      const prd = await generatePRD(contextItemIds);
      
      expect(prd).toBeDefined();
      expect(prd.title).toBeDefined();
      expect(prd.markdown).toBeDefined();
      expect(prd.sourceContextItemIds).toEqual(contextItemIds);
      expect(typeof prd.markdown).toBe('string');
      expect(prd.markdown.length).toBeGreaterThan(100);
    });

    it('should create tasks from PRD', async () => {
      const prdId = 'test-prd-id';
      
      const tasks = await createTasks(prdId);
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      
      // Validate task structure
      tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('complexity');
        expect(task).toHaveProperty('status');
        expect(['pending', 'in-progress', 'done']).toContain(task.status);
        expect(['high', 'medium', 'low']).toContain(task.priority);
      });
    });

    it('should handle empty context items', async () => {
      await expect(generatePRD([])).rejects.toThrow('Context item IDs are required');
    });

    it('should handle missing PRD', async () => {
      const { storage } = require('@/lib/storage');
      storage.get.mockResolvedValue(null);
      
      await expect(createTasks('non-existent-prd')).rejects.toThrow('PRD not found');
    });
  });

  describe('Response Validation', () => {
    it('should validate PRD response format', async () => {
      // This would test the actual response format when not using mocks
      const contextItems: ContextItem[] = [
        {
          id: '1',
          title: 'Test Project',
          contentMd: 'Test description',
          tags: [],
          category: 'requirement',
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        }
      ];

      const prd = generateMockPRD(contextItems);
      
      // Check for required sections
      expect(prd).toContain('# Product Requirements Document');
      expect(prd).toContain('## Executive Summary');
      expect(prd).toContain('## Problem Statement');
      expect(prd).toContain('## Technical Specifications');
      expect(prd).toContain('## Success Metrics');
    });

    it('should validate task response format', () => {
      const tasks = generateMockTasks('test content');
      
      // Validate JSON structure
      const taskString = JSON.stringify(tasks);
      const parsedTasks = JSON.parse(taskString);
      
      expect(Array.isArray(parsedTasks)).toBe(true);
      expect(parsedTasks.length).toBeGreaterThan(0);
      
      // Validate required fields
      parsedTasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.description).toBeDefined();
        expect(typeof task.complexity).toBe('number');
        expect(['high', 'medium', 'low']).toContain(task.priority);
        expect(['frontend', 'backend', 'infrastructure', 'design', 'testing']).toContain(task.category);
      });
    });
  });
});