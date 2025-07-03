'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCsrfToken } from 'next-auth/react'
import { authLogger, AuthEventType } from '@/lib/auth-logger'

interface CsrfContextType {
  csrfToken: string | null
  refreshCsrfToken: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined)

interface CsrfProviderProps {
  children: ReactNode
}

export function CsrfProvider({ children }: CsrfProviderProps) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCsrfToken = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = await getCsrfToken()
      
      if (token) {
        setCsrfToken(token)
        authLogger.debug(AuthEventType.OAUTH_CALLBACK, 'CSRF token fetched successfully', {
          tokenLength: token.length,
          component: 'CsrfProvider'
        })
      } else {
        throw new Error('No CSRF token received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token'
      setError(errorMessage)
      setCsrfToken(null)
      
      authLogger.error(AuthEventType.OAUTH_ERROR, 'Failed to fetch CSRF token', err as Error, {
        component: 'CsrfProvider'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCsrfToken = async () => {
    await fetchCsrfToken()
  }

  useEffect(() => {
    fetchCsrfToken()
    
    // Set up periodic refresh (every 30 minutes)
    const interval = setInterval(fetchCsrfToken, 30 * 60 * 1000)
    
    // Refresh on focus (in case user was away for a while)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchCsrfToken()
      }
    }
    
    document.addEventListener('visibilitychange', handleFocus)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  const value: CsrfContextType = {
    csrfToken,
    refreshCsrfToken,
    isLoading,
    error
  }

  return (
    <CsrfContext.Provider value={value}>
      {children}
    </CsrfContext.Provider>
  )
}

export function useCsrfToken(): CsrfContextType {
  const context = useContext(CsrfContext)
  if (context === undefined) {
    throw new Error('useCsrfToken must be used within a CsrfProvider')
  }
  return context
}

// Component for debugging CSRF token issues
export function CsrfDebugInfo() {
  const { csrfToken, isLoading, error } = useCsrfToken()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
      <div><strong>CSRF Debug:</strong></div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Token: {csrfToken ? `${csrfToken.substring(0, 8)}...` : 'None'}</div>
      <div>Error: {error || 'None'}</div>
    </div>
  )
}