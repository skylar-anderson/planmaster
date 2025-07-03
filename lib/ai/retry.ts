import { AIError, AIRateLimitError, AINetworkError, AITimeoutError, mapToAIError } from './errors';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  timeoutMs?: number;
  retryCondition?: (error: AIError) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  timeoutMs: 120000, // 2 minutes
  retryCondition: (error: AIError) => {
    // Retry on network errors, rate limiting, and timeouts
    return error instanceof AINetworkError || 
           error instanceof AIRateLimitError || 
           error instanceof AITimeoutError;
  }
};

/**
 * Implements exponential backoff with jitter for retry attempts
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.baseDelay * Math.pow(options.exponentialBase, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  // Add jitter (random variation of ±25%)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitter);
}

/**
 * Creates a promise that rejects after the specified timeout
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AITimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Wraps an async function with timeout handling
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs)
  ]);
}

/**
 * Executes an async function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: AIError;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Wrap the function call with timeout
      const result = await withTimeout(fn(), opts.timeoutMs);
      return result;
    } catch (error) {
      lastError = mapToAIError(error);
      
      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }
      
      // Check if we should retry this error
      if (!opts.retryCondition(lastError)) {
        throw lastError;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, opts);
      
      console.warn(
        `Attempt ${attempt}/${opts.maxAttempts} failed: ${lastError.message}. ` +
        `Retrying in ${Math.round(delay)}ms...`,
        { error: lastError, attempt, delay }
      );
      
      // Wait before retrying
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts exhausted
  throw lastError;
}

/**
 * Specialized retry function for AI streaming operations
 */
export async function withStreamRetry<T>(
  createStream: () => Promise<{ textStream: AsyncIterable<string> }>,
  options: RetryOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  return withRetry(async () => {
    const { textStream } = await createStream();
    
    let fullText = '';
    let lastChunkTime = Date.now();
    const chunkTimeoutMs = 30000; // 30 seconds between chunks
    
    for await (const chunk of textStream) {
      fullText += chunk;
      lastChunkTime = Date.now();
      
      // Check if we're taking too long between chunks
      const timeSinceLastChunk = Date.now() - lastChunkTime;
      if (timeSinceLastChunk > chunkTimeoutMs) {
        throw new AITimeoutError(`No data received for ${chunkTimeoutMs}ms`);
      }
    }
    
    if (!fullText || fullText.trim().length === 0) {
      throw new AIError('Stream completed with no data', 'EMPTY_STREAM');
    }
    
    return fullText;
  }, opts);
}

/**
 * Helper to create a retry wrapper for a specific function
 */
export function createRetryWrapper<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  defaultOptions: RetryOptions = {}
) {
  return (
    ...args: TArgs
  ) => (
    retryOptions: RetryOptions = {}
  ): Promise<TReturn> => {
    const options = { ...defaultOptions, ...retryOptions };
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Predefined retry configurations for different scenarios
 */
export const RETRY_CONFIGS = {
  // Quick operations that should fail fast
  FAST: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 5000,
    timeoutMs: 30000
  } as RetryOptions,
  
  // Standard operations
  STANDARD: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    timeoutMs: 120000
  } as RetryOptions,
  
  // Long-running operations like PRD generation
  PATIENT: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    timeoutMs: 300000 // 5 minutes
  } as RetryOptions
} as const;