'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export interface AuthError {
  type: 'oauth_error' | 'network_error' | 'validation_error' | 'rate_limit' | 'service_unavailable' | 'unknown'
  message: string
  code?: string
  retryable?: boolean
}

interface AuthErrorDisplayProps {
  error?: AuthError
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function AuthErrorDisplay({ error, onRetry, onDismiss, className = '' }: AuthErrorDisplayProps) {
  if (!error) return null

  const getErrorIcon = (type: AuthError['type']) => {
    switch (type) {
      case 'oauth_error':
        return (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'network_error':
        return (
          <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'rate_limit':
        return (
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getBorderColor = (type: AuthError['type']) => {
    switch (type) {
      case 'oauth_error': return 'border-red-200'
      case 'network_error': return 'border-orange-200'
      case 'rate_limit': return 'border-yellow-200'
      case 'service_unavailable': return 'border-blue-200'
      default: return 'border-red-200'
    }
  }

  const getBackgroundColor = (type: AuthError['type']) => {
    switch (type) {
      case 'oauth_error': return 'bg-red-50'
      case 'network_error': return 'bg-orange-50'
      case 'rate_limit': return 'bg-yellow-50'
      case 'service_unavailable': return 'bg-blue-50'
      default: return 'bg-red-50'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getBorderColor(error.type)} ${getBackgroundColor(error.type)} 
      transition-all duration-300 ease-in-out animate-in fade-in-0 slide-in-from-top-1 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon(error.type)}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">Authentication Error</p>
          <p className="mt-1 text-sm text-gray-700">{error.message}</p>
          {error.code && (
            <p className="mt-1 text-xs text-gray-500">Error code: {error.code}</p>
          )}
        </div>
        <div className="ml-4 flex flex-shrink-0 gap-2">
          {error.retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-500 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-colors duration-150 rounded px-2 py-1"
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex text-gray-400 hover:text-gray-500 
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                transition-colors duration-150 rounded p-1"
              aria-label="Dismiss error"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AuthErrorModal({ error, onRetry, onClose, isOpen }: {
  error?: AuthError
  onRetry?: () => void
  onClose: () => void
  isOpen: boolean
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !error) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                Authentication Failed
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{error.message}</p>
                {error.code && (
                  <p className="mt-1 text-xs text-gray-400">Error code: {error.code}</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            {error.retryable && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto"
              >
                Try Again
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useAuthErrorFromUrl(): AuthError | null {
  const searchParams = useSearchParams()
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (!errorParam) {
      setError(null)
      return
    }

    let authError: AuthError

    switch (errorParam) {
      case 'AccessDenied':
        authError = {
          type: 'oauth_error',
          message: 'Access was denied. You may have cancelled the sign-in process or your account may not have permission to access this application.',
          code: errorParam,
          retryable: true
        }
        break
      case 'OAuthSignin':
        authError = {
          type: 'oauth_error',
          message: 'There was an error communicating with the OAuth provider. Please try again.',
          code: errorParam,
          retryable: true
        }
        break
      case 'OAuthCallback':
        authError = {
          type: 'oauth_error',
          message: 'There was an error processing the OAuth callback. Please try signing in again.',
          code: errorParam,
          retryable: true
        }
        break
      case 'OAuthCreateAccount':
        authError = {
          type: 'oauth_error',
          message: 'Could not create account. Please ensure your OAuth provider account has a valid email address.',
          code: errorParam,
          retryable: true
        }
        break
      case 'EmailCreateAccount':
        authError = {
          type: 'validation_error',
          message: 'Could not create account with this email address. Please contact support if this continues.',
          code: errorParam,
          retryable: false
        }
        break
      case 'Callback':
        authError = {
          type: 'oauth_error',
          message: 'There was an error in the OAuth callback process. Please try signing in again.',
          code: errorParam,
          retryable: true
        }
        break
      case 'Configuration':
        authError = {
          type: 'service_unavailable',
          message: 'Authentication service is temporarily unavailable due to a configuration issue. Please try again later.',
          code: errorParam,
          retryable: true
        }
        break
      default:
        authError = {
          type: 'unknown',
          message: 'An unexpected error occurred during authentication. Please try again.',
          code: errorParam,
          retryable: true
        }
    }

    setError(authError)
  }, [searchParams])

  return error
}