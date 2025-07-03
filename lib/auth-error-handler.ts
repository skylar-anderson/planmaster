import type { AuthError } from '@/app/components/auth/auth-error'
import { authLogger, AuthEventType } from '@/lib/auth-logger'

export class AuthErrorHandler {
  private static rateLimitTracker = new Map<string, { count: number; resetTime: number }>()

  static handleNextAuthError(error: any): AuthError {
    if (!error) {
      return {
        type: 'unknown',
        message: 'An unexpected error occurred during authentication.',
        retryable: true
      }
    }

    const errorType = typeof error === 'string' ? error : error.type || error.code || error.message
    const errorMessage = typeof error === 'string' ? error : error.message

    switch (errorType) {
      case 'AccessDenied':
        return {
          type: 'oauth_error',
          message: 'Access was denied. You may have cancelled the sign-in process or your account may not have the required permissions.',
          code: 'ACCESS_DENIED',
          retryable: true
        }

      case 'OAuthSignin':
      case 'OAuthError':
        return {
          type: 'oauth_error',
          message: 'There was an error communicating with GitHub. Please try again.',
          code: 'OAUTH_SIGNIN_ERROR',
          retryable: true
        }

      case 'OAuthCallback':
        return {
          type: 'oauth_error',
          message: 'Authentication callback failed. Please try signing in again.',
          code: 'OAUTH_CALLBACK_ERROR',
          retryable: true
        }

      case 'OAuthCreateAccount':
        return {
          type: 'oauth_error',
          message: 'Unable to create account. Please ensure your GitHub account has a verified email address.',
          code: 'OAUTH_CREATE_ACCOUNT_ERROR',
          retryable: true
        }

      case 'EmailCreateAccount':
        return {
          type: 'validation_error',
          message: 'Unable to create account with this email address. Please contact support.',
          code: 'EMAIL_CREATE_ACCOUNT_ERROR',
          retryable: false
        }

      case 'Callback':
        return {
          type: 'oauth_error',
          message: 'Authentication callback processing failed. Please try again.',
          code: 'CALLBACK_ERROR',
          retryable: true
        }

      case 'Configuration':
        return {
          type: 'service_unavailable',
          message: 'Authentication service is temporarily misconfigured. Please try again later.',
          code: 'CONFIGURATION_ERROR',
          retryable: true
        }

      case 'Verification':
        return {
          type: 'validation_error',
          message: 'Email verification failed. Please check your email and try again.',
          code: 'VERIFICATION_ERROR',
          retryable: true
        }

      case 'MissingCSRF':
        return {
          type: 'oauth_error',
          message: 'Security token missing. Please refresh the page and try signing in again.',
          code: 'MISSING_CSRF',
          retryable: true
        }

      default:
        if (errorMessage && typeof errorMessage === 'string') {
          if (errorMessage.toLowerCase().includes('network')) {
            return this.handleNetworkError(error)
          }
          if (errorMessage.toLowerCase().includes('timeout')) {
            return this.handleTimeoutError()
          }
          if (errorMessage.toLowerCase().includes('rate limit')) {
            return this.handleRateLimitError()
          }
        }

        return {
          type: 'unknown',
          message: errorMessage || 'An unexpected authentication error occurred. Please try again.',
          code: 'UNKNOWN_ERROR',
          retryable: true
        }
    }
  }

  static handleNetworkError(error?: any): AuthError {
    const isOffline = !navigator.onLine
    
    if (isOffline) {
      return {
        type: 'network_error',
        message: 'You appear to be offline. Please check your internet connection and try again.',
        code: 'NETWORK_OFFLINE',
        retryable: true
      }
    }

    if (error && typeof error === 'object') {
      if (error.name === 'AbortError') {
        return {
          type: 'network_error',
          message: 'Authentication request was cancelled. Please try again.',
          code: 'REQUEST_ABORTED',
          retryable: true
        }
      }

      if (error.cause?.code === 'ENOTFOUND' || error.cause?.code === 'ECONNREFUSED') {
        return {
          type: 'network_error',
          message: 'Unable to connect to authentication service. Please check your internet connection.',
          code: 'CONNECTION_FAILED',
          retryable: true
        }
      }
    }

    return {
      type: 'network_error',
      message: 'Network connection failed during authentication. Please try again.',
      code: 'NETWORK_ERROR',
      retryable: true
    }
  }

  static handleTimeoutError(): AuthError {
    return {
      type: 'network_error',
      message: 'Authentication request timed out. Please try again.',
      code: 'REQUEST_TIMEOUT',
      retryable: true
    }
  }

  static handleRateLimitError(provider = 'github'): AuthError {
    const key = `rate_limit_${provider}`
    const now = Date.now()
    const tracker = this.rateLimitTracker.get(key)

    if (tracker && now < tracker.resetTime) {
      const minutesLeft = Math.ceil((tracker.resetTime - now) / (1000 * 60))
      return {
        type: 'rate_limit',
        message: `GitHub API rate limit exceeded. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: false
      }
    }

    // Set rate limit tracker for 1 hour
    this.rateLimitTracker.set(key, {
      count: 1,
      resetTime: now + (60 * 60 * 1000)
    })

    return {
      type: 'rate_limit',
      message: 'Too many authentication attempts. Please wait a moment before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryable: true
    }
  }

  static handleFetchError(error: any): AuthError {
    if (!error) {
      return this.handleNetworkError()
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.handleNetworkError(error)
    }

    if (error.name === 'AbortError') {
      return {
        type: 'network_error',
        message: 'Request was cancelled. Please try again.',
        code: 'REQUEST_ABORTED',
        retryable: true
      }
    }

    if (error.status) {
      switch (error.status) {
        case 401:
          return {
            type: 'oauth_error',
            message: 'Authentication failed. Please try signing in again.',
            code: 'UNAUTHORIZED',
            retryable: true
          }
        case 403:
          return {
            type: 'oauth_error',
            message: 'Access forbidden. Your account may not have permission to access this application.',
            code: 'FORBIDDEN',
            retryable: false
          }
        case 404:
          return {
            type: 'service_unavailable',
            message: 'Authentication service not found. Please try again later.',
            code: 'SERVICE_NOT_FOUND',
            retryable: true
          }
        case 429:
          return this.handleRateLimitError()
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'service_unavailable',
            message: 'Authentication service is temporarily unavailable. Please try again later.',
            code: 'SERVICE_UNAVAILABLE',
            retryable: true
          }
        default:
          return {
            type: 'network_error',
            message: `Network error (${error.status}). Please try again.`,
            code: 'HTTP_ERROR',
            retryable: true
          }
      }
    }

    return this.handleNetworkError(error)
  }

  static isRetryableError(error: AuthError): boolean {
    return error.retryable !== false
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backup with jitter: 1s, 2s, 4s, 8s, 16s (max)
    const baseDelay = Math.min(1000 * Math.pow(2, attemptCount - 1), 16000)
    const jitter = Math.random() * 0.1 * baseDelay
    return baseDelay + jitter
  }

  static shouldShowRetryButton(error: AuthError): boolean {
    return this.isRetryableError(error) && error.type !== 'rate_limit'
  }

  static logError(error: AuthError, context?: Record<string, any>): void {
    const eventType = this.getEventTypeFromError(error)
    
    const metadata = {
      errorType: error.type,
      errorCode: error.code,
      retryable: error.retryable,
      ...context
    }

    authLogger.error(eventType, error.message, undefined, metadata)
  }

  private static getEventTypeFromError(error: AuthError): AuthEventType {
    switch (error.type) {
      case 'oauth_error':
        return AuthEventType.OAUTH_ERROR
      case 'network_error':
        return AuthEventType.NETWORK_ERROR
      case 'rate_limit':
        return AuthEventType.RATE_LIMIT
      case 'service_unavailable':
        return AuthEventType.OAUTH_ERROR
      case 'validation_error':
        return AuthEventType.SIGN_IN_FAILURE
      default:
        return AuthEventType.SIGN_IN_FAILURE
    }
  }

  static clearRateLimitTracker(): void {
    this.rateLimitTracker.clear()
  }
}