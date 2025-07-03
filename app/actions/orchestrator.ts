'use server';

import { streamText } from 'ai';
import { aiModel, aiConfig, TIMEOUTS } from '@/lib/ai/config';
import { storage } from '@/lib/storage';
import { ContextItem } from '@/types/context';
import { PRD, createNewPRD } from '@/app/types/prd';
import { mapToAIError, AIError } from '@/lib/ai/errors';
import { withStreamRetry, RETRY_CONFIGS } from '@/lib/ai/retry';
import { 
  shouldUseMocks, 
  generateMockPRD, 
  generateMockTasks, 
  getMockScenario, 
  simulateError,
  MOCK_SCENARIOS 
} from '@/lib/ai/mocks';

/**
 * Generate a comprehensive PRD from selected context items
 * @param contextItemIds - Array of context item IDs to include in the PRD
 * @returns Promise<PRD> - The generated PRD
 */
export async function generatePRD(contextItemIds: string[]): Promise<PRD> {
  try {
    // Validate input
    if (!contextItemIds || !Array.isArray(contextItemIds) || contextItemIds.length === 0) {
      throw new AIError('Context item IDs are required', 'INVALID_INPUT');
    }

    // Fetch context items from storage
    const contextItems = await Promise.all(
      contextItemIds.map(async (id) => {
        try {
          return await storage.get<ContextItem>(`context:${id}`);
        } catch (error) {
          console.warn(`Failed to fetch context item ${id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null items and format context text
    const validContextItems = contextItems.filter((item): item is ContextItem => item !== null);
    
    if (validContextItems.length === 0) {
      throw new AIError('No valid context items found', 'NO_VALID_CONTEXT');
    }

    // Check if we should use mock responses
    let fullText: string;
    
    if (shouldUseMocks()) {
      // Handle mock scenarios
      const scenario = getMockScenario();
      if (scenario !== MOCK_SCENARIOS.SUCCESS) {
        simulateError(scenario as keyof typeof MOCK_SCENARIOS);
      }
      
      // Generate mock PRD
      fullText = generateMockPRD(validContextItems);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    } else {
      // Create structured context text for the AI prompt
      const contextText = validContextItems
        .map(item => {
          const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
          const tags = item.tags.length > 0 ? ` (Tags: ${item.tags.join(', ')})` : '';
          return `## ${categoryLabel}: ${item.title}${tags}\n\n${item.contentMd}`;
        })
        .join('\n\n---\n\n');

      // Generate PRD using AI with retry logic
      fullText = await withStreamRetry(
        async () => {
          return await streamText({
            model: aiModel,
            ...aiConfig,
            prompt: `Generate a comprehensive Product Requirements Document (PRD) based on the following context items:

${contextText}

Format the PRD as a well-structured markdown document with the following sections:
1. Executive Summary
2. Problem Statement
3. Goals & Objectives
4. Requirements
5. User Stories
6. Technical Specifications
7. Acceptance Criteria
8. Timeline & Milestones
9. Risks & Mitigation
10. Success Metrics

Make sure to:
- Be specific and actionable
- Include relevant details from the context items
- Maintain consistency across sections
- Use clear, professional language
- Include technical details where appropriate

The PRD should be comprehensive enough to guide development while remaining focused and practical.`,
          });
        },
        {
          ...RETRY_CONFIGS.PATIENT,
          timeoutMs: TIMEOUTS.PRD_GENERATION,
        }
      );
    }

    // Validate response
    if (!fullText || fullText.trim().length === 0) {
      throw new AIError('AI service returned empty response', 'EMPTY_RESPONSE');
    }

    // Create PRD object
    const title = extractTitleFromContent(fullText) || 'Generated PRD';
    const prd = createNewPRD(title, fullText, contextItemIds);

    // Store the PRD
    try {
      await storage.set(`prd:${prd.id}`, prd);
      await storage.set('prd:current', prd);
    } catch (error) {
      console.error('Failed to store PRD:', error);
      // Still return the PRD even if storage fails
    }

    return prd;
  } catch (error) {
    const aiError = mapToAIError(error);
    console.error('Error generating PRD:', aiError);
    throw aiError;
  }
}

/**
 * Extract title from markdown content
 * @param content - Markdown content
 * @returns Extracted title or null
 */
function extractTitleFromContent(content: string): string | null {
  // Look for the first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Look for the first H2 heading as fallback
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) {
    return h2Match[1].trim();
  }

  return null;
}

/**
 * Create tasks from a PRD
 * @param prdId - The PRD ID to generate tasks from
 * @returns Promise<Task[]> - Array of generated tasks
 */
export async function createTasks(prdId: string) {
  try {
    // Validate input
    if (!prdId || typeof prdId !== 'string') {
      throw new AIError('PRD ID is required', 'INVALID_INPUT');
    }

    // Fetch PRD from storage
    let prd: PRD | null;
    try {
      prd = await storage.get<PRD>(`prd:${prdId}`);
    } catch (error) {
      console.error(`Failed to fetch PRD ${prdId}:`, error);
      throw new AIError('Failed to fetch PRD from storage', 'STORAGE_ERROR', error as Error);
    }

    if (!prd) {
      throw new AIError('PRD not found', 'PRD_NOT_FOUND');
    }

    if (!prd.markdown || prd.markdown.trim().length === 0) {
      throw new AIError('PRD has no content to generate tasks from', 'EMPTY_PRD');
    }

    // Check if we should use mock responses
    let response: string;
    
    if (shouldUseMocks()) {
      // Handle mock scenarios
      const scenario = getMockScenario();
      if (scenario !== MOCK_SCENARIOS.SUCCESS) {
        simulateError(scenario as keyof typeof MOCK_SCENARIOS);
      }
      
      // Generate mock tasks
      const mockTasks = generateMockTasks(prd.markdown);
      response = JSON.stringify(mockTasks, null, 2);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    } else {
      response = await withStreamRetry(
        async () => {
          return await streamText({
            model: aiModel,
            ...aiConfig,
            prompt: `Convert this PRD into actionable development tasks with complexity scores (1-10):

${prd.markdown}

Return a JSON array of tasks with the following structure:
[
  {
    "id": "unique-task-id",
    "title": "Task title",
    "description": "Detailed description of what needs to be done",
    "complexity": 7,
    "status": "pending",
    "priority": "high|medium|low",
    "dependencies": ["other-task-id"],
    "estimatedHours": 8,
    "category": "frontend|backend|infrastructure|design|testing"
  }
]

Guidelines:
- Break down large features into smaller, manageable tasks
- Include setup/configuration tasks
- Add testing tasks for each feature
- Consider dependencies between tasks
- Complexity should reflect technical difficulty and time investment
- Prioritize based on business value and dependencies
- Include both development and non-development tasks (documentation, deployment, etc.)

Focus on creating 8-15 well-structured tasks that cover the entire project scope.`,
          });
        },
        {
          ...RETRY_CONFIGS.STANDARD,
          timeoutMs: TIMEOUTS.TASK_CREATION,
        }
      );
    }

    // Validate response
    if (!response || response.trim().length === 0) {
      throw new AIError('AI service returned empty response', 'EMPTY_RESPONSE');
    }

    // Parse the JSON response
    let tasks;
    try {
      tasks = JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          tasks = JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse JSON from AI response:', secondError);
          throw new AIError('Failed to parse tasks from AI response', 'INVALID_RESPONSE', secondError as Error);
        }
      } else {
        console.error('No JSON array found in AI response:', response);
        throw new AIError('AI response does not contain valid JSON', 'INVALID_RESPONSE', parseError as Error);
      }
    }
    
    // Validate the tasks structure
    if (!Array.isArray(tasks)) {
      throw new AIError('Expected tasks to be an array', 'INVALID_RESPONSE');
    }

    if (tasks.length === 0) {
      throw new AIError('AI service returned no tasks', 'NO_TASKS_GENERATED');
    }

    // Store the tasks
    try {
      await storage.set(`tasks:${prdId}`, tasks);
      await storage.set('tasks:current', tasks);
    } catch (error) {
      console.error('Failed to store tasks:', error);
      // Still return the tasks even if storage fails
    }

    return tasks;
  } catch (error) {
    const aiError = mapToAIError(error);
    console.error('Error creating tasks:', aiError);
    throw aiError;
  }
}