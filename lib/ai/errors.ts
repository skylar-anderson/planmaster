/**
 * Custom error classes for AI operations
 */

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIRateLimitError extends AIError {
  constructor(message: string = 'AI service rate limit exceeded', originalError?: Error) {
    super(message, 'RATE_LIMIT_EXCEEDED', originalError);
    this.name = 'AIRateLimitError';
  }
}

export class AINetworkError extends AIError {
  constructor(message: string = 'Network error occurred', originalError?: Error) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'AINetworkError';
  }
}

export class AIInvalidResponseError extends AIError {
  constructor(message: string = 'Invalid response from AI service', originalError?: Error) {
    super(message, 'INVALID_RESPONSE', originalError);
    this.name = 'AIInvalidResponseError';
  }
}

export class AIQuotaExceededError extends AIError {
  constructor(message: string = 'AI service quota exceeded', originalError?: Error) {
    super(message, 'QUOTA_EXCEEDED', originalError);
    this.name = 'AIQuotaExceededError';
  }
}

export class AIAuthenticationError extends AIError {
  constructor(message: string = 'AI service authentication failed', originalError?: Error) {
    super(message, 'AUTHENTICATION_ERROR', originalError);
    this.name = 'AIAuthenticationError';
  }
}

export class AITimeoutError extends AIError {
  constructor(message: string = 'AI service request timed out', originalError?: Error) {
    super(message, 'TIMEOUT_ERROR', originalError);
    this.name = 'AITimeoutError';
  }
}

/**
 * Maps generic errors to specific AI error types
 */
export function mapToAIError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return new AIRateLimitError(error.message, error);
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return new AINetworkError(error.message, error);
    }
    
    // Authentication
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('api key')) {
      return new AIAuthenticationError(error.message, error);
    }
    
    // Quota/billing
    if (message.includes('quota') || message.includes('billing') || message.includes('credits')) {
      return new AIQuotaExceededError(error.message, error);
    }
    
    // Timeout
    if (message.includes('timeout') || message.includes('timed out')) {
      return new AITimeoutError(error.message, error);
    }
    
    // Invalid response
    if (message.includes('json') || message.includes('parse') || message.includes('format')) {
      return new AIInvalidResponseError(error.message, error);
    }
    
    // Generic AI error
    return new AIError(error.message, 'UNKNOWN_ERROR', error);
  }

  // Unknown error type
  return new AIError(
    typeof error === 'string' ? error : 'Unknown error occurred',
    'UNKNOWN_ERROR'
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: AIError): string {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'AI service is currently busy. Please try again in a few moments.';
    
    case 'NETWORK_ERROR':
      return 'Unable to connect to AI service. Please check your internet connection and try again.';
    
    case 'AUTHENTICATION_ERROR':
      return 'AI service authentication failed. Please check your API configuration.';
    
    case 'QUOTA_EXCEEDED':
      return 'AI service quota has been exceeded. Please check your billing or try again later.';
    
    case 'TIMEOUT_ERROR':
      return 'Request timed out. The AI service took too long to respond. Please try again.';
    
    case 'INVALID_RESPONSE':
      return 'AI service returned an invalid response. Please try again or contact support.';
    
    default:
      return 'An error occurred while processing your request. Please try again.';
  }
}