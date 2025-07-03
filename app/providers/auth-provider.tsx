'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import type { Session } from 'next-auth'
import { AuthErrorBoundary } from '@/app/components/auth/auth-error-boundary'
import { CsrfProvider } from '@/app/components/auth/csrf-provider'
import { authLogger, AuthEventType } from '@/lib/auth-logger'

interface AuthProviderProps {
  children: ReactNode
  session?: Session | null
}

function AuthSessionLogger({ session }: { session?: Session | null }) {
  useEffect(() => {
    if (session?.user) {
      authLogger.setUserId(session.user.id || 'unknown')
      authLogger.info(AuthEventType.SESSION_REFRESH, 'User session loaded', {
        userId: session.user.id,
        userEmail: session.user.email
      })
    } else {
      authLogger.clearUserId()
    }
  }, [session])

  return null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  const handleAuthError = (error: Error, errorInfo: React.ErrorInfo) => {
    authLogger.critical(
      AuthEventType.COMPONENT_ERROR,
      'Critical error in authentication provider',
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'AuthProvider'
      }
    )
  }

  return (
    <AuthErrorBoundary onError={handleAuthError}>
      <SessionProvider session={session}>
        <CsrfProvider>
          <AuthSessionLogger session={session} />
          {children}
        </CsrfProvider>
      </SessionProvider>
    </AuthErrorBoundary>
  )
}