'use client'

import React, { Component, ReactNode } from 'react'
import { AuthErrorDisplay, type AuthError } from './auth-error'
import { AuthErrorHandler } from '@/lib/auth-error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showRetryButton?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
  authError: AuthError | null
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorId: null,
      authError: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `auth_boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert the React error to our AuthError format
    const authError: AuthError = {
      type: 'unknown',
      message: 'A component error occurred during authentication. Please refresh the page and try again.',
      code: 'COMPONENT_ERROR',
      retryable: true
    }

    return {
      hasError: true,
      error,
      errorId,
      authError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'
    
    // Log to our auth error handler
    AuthErrorHandler.logError(
      this.state.authError || {
        type: 'unknown',
        message: error.message,
        code: 'COMPONENT_ERROR',
        retryable: true
      },
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'AuthErrorBoundary',
        timestamp: new Date().toISOString()
      }
    )

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In development, also log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Auth Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Error ID:', errorId)
      console.groupEnd()
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      authError: null
    })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Authentication Component Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Something went wrong with the authentication interface. This might be due to a temporary issue.
                </p>
              </div>
              {this.state.authError && (
                <div className="mt-4">
                  <AuthErrorDisplay
                    error={this.state.authError}
                    onRetry={this.props.showRetryButton !== false ? this.handleRetry : undefined}
                    className="bg-red-100 border-red-300"
                  />
                </div>
              )}
              <div className="mt-4 flex space-x-3">
                {this.props.showRetryButton !== false && (
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={this.handleRefresh}
                  className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Refresh Page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.errorId && (
                <details className="mt-4">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    Debug Info (Development Only)
                  </summary>
                  <div className="mt-2 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                    <p><strong>Error ID:</strong> {this.state.errorId}</p>
                    <p><strong>Error:</strong> {this.state.error?.message}</p>
                    <p><strong>Stack:</strong></p>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component version for easier usage
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithAuthErrorBoundaryComponent(props: P) {
    return (
      <AuthErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AuthErrorBoundary>
    )
  }
}

// Hook for programmatic error reporting within the boundary
export function useAuthErrorBoundary() {
  const [, setState] = React.useState()
  
  const reportError = React.useCallback((error: Error) => {
    setState(() => {
      throw error
    })
  }, [])

  return { reportError }
}