'use client'

import { useState, useCallback, useEffect } from 'react'
import { AuthErrorDisplay, AuthErrorModal, type AuthError } from './auth-error'
import { AuthErrorHandler } from '@/lib/auth-error-handler'

interface AuthErrorState {
  error: AuthError | null
  attemptCount: number
  isRetrying: boolean
}

interface WithAuthErrorHandlingProps {
  showModal?: boolean
  maxRetries?: number
  onError?: (error: AuthError) => void
  onRetrySuccess?: () => void
  onMaxRetriesReached?: (error: AuthError) => void
}

export function withAuthErrorHandling<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  defaultOptions: WithAuthErrorHandlingProps = {}
) {
  return function WithAuthErrorHandlingComponent(
    props: P & WithAuthErrorHandlingProps
  ) {
    const {
      showModal = defaultOptions.showModal || false,
      maxRetries = defaultOptions.maxRetries || 3,
      onError = defaultOptions.onError,
      onRetrySuccess = defaultOptions.onRetrySuccess,
      onMaxRetriesReached = defaultOptions.onMaxRetriesReached,
      ...componentProps
    } = props

    const [errorState, setErrorState] = useState<AuthErrorState>({
      error: null,
      attemptCount: 0,
      isRetrying: false
    })

    const handleError = useCallback((error: any) => {
      const authError = AuthErrorHandler.handleNextAuthError(error)
      
      setErrorState(prev => ({
        error: authError,
        attemptCount: prev.attemptCount + 1,
        isRetrying: false
      }))

      AuthErrorHandler.logError(authError, {
        component: WrappedComponent.name || 'Unknown',
        attemptCount: errorState.attemptCount + 1
      })

      onError?.(authError)
    }, [onError, errorState.attemptCount, WrappedComponent.name])

    const handleRetry = useCallback(async (retryFn?: () => Promise<void> | void) => {
      if (!errorState.error || !AuthErrorHandler.isRetryableError(errorState.error)) {
        return
      }

      if (errorState.attemptCount >= maxRetries) {
        onMaxRetriesReached?.(errorState.error)
        return
      }

      setErrorState(prev => ({ ...prev, isRetrying: true }))

      try {
        const delay = AuthErrorHandler.getRetryDelay(errorState.attemptCount)
        await new Promise(resolve => setTimeout(resolve, delay))

        if (retryFn) {
          await retryFn()
        }

        // Clear error on successful retry
        setErrorState({
          error: null,
          attemptCount: 0,
          isRetrying: false
        })

        onRetrySuccess?.()
      } catch (retryError) {
        handleError(retryError)
      }
    }, [errorState, maxRetries, onMaxRetriesReached, onRetrySuccess, handleError])

    const handleDismissError = useCallback(() => {
      setErrorState({
        error: null,
        attemptCount: 0,
        isRetrying: false
      })
    }, [])

    const handleCloseModal = useCallback(() => {
      handleDismissError()
    }, [handleDismissError])

    // Provide error handling functions to wrapped component
    const enhancedProps = {
      ...componentProps,
      onAuthError: handleError,
      onRetryAuth: handleRetry,
      isRetrying: errorState.isRetrying,
      attemptCount: errorState.attemptCount,
      authError: errorState.error
    } as P & {
      onAuthError: (error: any) => void
      onRetryAuth: (retryFn?: () => Promise<void> | void) => Promise<void>
      isRetrying: boolean
      attemptCount: number
      authError: AuthError | null
    }

    return (
      <>
        <WrappedComponent {...enhancedProps} />
        
        {errorState.error && !showModal && (
          <AuthErrorDisplay
            error={errorState.error}
            onRetry={AuthErrorHandler.shouldShowRetryButton(errorState.error) ? () => handleRetry() : undefined}
            onDismiss={handleDismissError}
            className="mt-4"
          />
        )}

        {showModal && (
          <AuthErrorModal
            error={errorState.error}
            onRetry={AuthErrorHandler.shouldShowRetryButton(errorState.error) ? () => handleRetry() : undefined}
            onClose={handleCloseModal}
            isOpen={!!errorState.error}
          />
        )}
      </>
    )
  }
}

export function useAuthErrorHandler(options: WithAuthErrorHandlingProps = {}) {
  const {
    maxRetries = 3,
    onError,
    onRetrySuccess,
    onMaxRetriesReached
  } = options

  const [errorState, setErrorState] = useState<AuthErrorState>({
    error: null,
    attemptCount: 0,
    isRetrying: false
  })

  const handleError = useCallback((error: any) => {
    const authError = AuthErrorHandler.handleNextAuthError(error)
    
    setErrorState(prev => ({
      error: authError,
      attemptCount: prev.attemptCount + 1,
      isRetrying: false
    }))

    AuthErrorHandler.logError(authError, {
      attemptCount: errorState.attemptCount + 1
    })

    onError?.(authError)
  }, [onError, errorState.attemptCount])

  const handleRetry = useCallback(async (retryFn?: () => Promise<void> | void) => {
    if (!errorState.error || !AuthErrorHandler.isRetryableError(errorState.error)) {
      return
    }

    if (errorState.attemptCount >= maxRetries) {
      onMaxRetriesReached?.(errorState.error)
      return
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }))

    try {
      const delay = AuthErrorHandler.getRetryDelay(errorState.attemptCount)
      await new Promise(resolve => setTimeout(resolve, delay))

      if (retryFn) {
        await retryFn()
      }

      setErrorState({
        error: null,
        attemptCount: 0,
        isRetrying: false
      })

      onRetrySuccess?.()
    } catch (retryError) {
      handleError(retryError)
    }
  }, [errorState, maxRetries, onMaxRetriesReached, onRetrySuccess, handleError])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      attemptCount: 0,
      isRetrying: false
    })
  }, [])

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    attemptCount: errorState.attemptCount,
    handleError,
    handleRetry,
    clearError,
    canRetry: errorState.error ? AuthErrorHandler.shouldShowRetryButton(errorState.error) : false
  }
}