import { openai } from '@ai-sdk/openai';

export const aiModel = openai('gpt-4o-mini', {
  apiKey: process.env.OPENAI_API_KEY,
});

export const aiConfig = {
  temperature: 0.7,
  maxTokens: 4096,
  maxRetries: 3,
  abortSignal: undefined, // Can be set per request
};

// Timeout configurations for different operations
export const TIMEOUTS = {
  PRD_GENERATION: 300000,  // 5 minutes for PRD generation
  TASK_CREATION: 180000,   // 3 minutes for task creation
  STREAMING_CHUNK: 30000,  // 30 seconds between chunks
  CONNECTION: 10000,       // 10 seconds for initial connection
} as const;