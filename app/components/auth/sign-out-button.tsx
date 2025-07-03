'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { authLogger, AuthEventType } from '@/lib/auth-logger'
import { AuthLoading } from './auth-loading'

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
  showConfirmation?: boolean
}

export function SignOutButton({ 
  className = '', 
  children,
  showConfirmation = false 
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    if (showConfirmation) {
      const confirmed = window.confirm('Are you sure you want to sign out?')
      if (!confirmed) {
        authLogger.debug(AuthEventType.SIGN_OUT, 'User cancelled sign out')
        return
      }
    }

    try {
      setIsLoading(true)
      authLogger.info(AuthEventType.SIGN_OUT, 'User initiated sign out', {
        component: 'SignOutButton'
      })
      
      await signOut({ callbackUrl: '/' })
      
      authLogger.info(AuthEventType.SIGN_OUT, 'Sign out successful')
      setIsLoading(false)
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
      
      authLogger.error(AuthEventType.SIGN_OUT, 'Sign out failed', error as Error, {
        component: 'SignOutButton'
      })
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className={`auth-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed 
        rounded-lg transition-all duration-200 ease-in-out
        active:scale-95 w-full sm:w-auto ${className}`}
      aria-label="Sign out"
    >
      {isLoading ? (
        <AuthLoading variant="button" />
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>{children || 'Sign out'}</span>
        </>
      )}
    </button>
  )
}