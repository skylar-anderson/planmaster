'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { AuthErrorDisplay, type AuthError } from './auth-error'
import { AuthErrorHandler } from '@/lib/auth-error-handler'
import { authLogger, AuthEventType } from '@/lib/auth-logger'
import { useCsrfToken } from './csrf-provider'
import { AuthLoading } from './auth-loading'

interface SignInButtonProps {
  className?: string
  children?: React.ReactNode
}

export function SignInButton({ className = '', children }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const { csrfToken, refreshCsrfToken, error: csrfError } = useCsrfToken()

  // Handle CSRF errors
  if (csrfError && !error) {
    const authError = AuthErrorHandler.handleNextAuthError('MissingCSRF')
    setError(authError)
  }

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Refresh CSRF token if missing or error occurred
      if (!csrfToken || csrfError) {
        await refreshCsrfToken()
      }
      
      authLogger.info(AuthEventType.SIGN_IN_ATTEMPT, 'User initiated sign in', {
        provider: 'github',
        component: 'SignInButton',
        hasCsrfToken: !!csrfToken
      })
      
      // Start OAuth login flow – let NextAuth handle redirects
      // Passing the CSRF token explicitly is optional; Auth.js will read the cookie, but we include it for completeness.
      const result = await signIn('github', {
        callbackUrl: '/dashboard',
        csrfToken: csrfToken ?? undefined
      })

      // Check if signIn returned an error result instead of redirecting
      if (result && !result.ok && result.error) {
        const authError = AuthErrorHandler.handleNextAuthError(result.error)
        AuthErrorHandler.logError(authError, {
          component: 'SignInButton',
          action: 'sign_in',
          provider: 'github'
        })
        setError(authError)
        setIsLoading(false)
        return
      }

      // The browser will be redirected away; if the promise returns we reset loading state
      setIsLoading(false)
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
      
      const authError = AuthErrorHandler.handleFetchError(error)
      AuthErrorHandler.logError(authError, {
        component: 'SignInButton',
        action: 'sign_in',
        provider: 'github'
      })
      setError(authError)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleSignIn()
  }

  const handleDismissError = () => {
    setError(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <AuthErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`auth-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          disabled:opacity-50 disabled:cursor-not-allowed 
          rounded-lg transition-all duration-200 ease-in-out
          active:scale-95 w-full sm:w-auto ${className}`}
        aria-label="Sign in with GitHub"
      >
        {isLoading ? (
          <AuthLoading variant="button" />
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{children || 'Sign in with GitHub'}</span>
          </>
        )}
      </button>
    </div>
  )
}