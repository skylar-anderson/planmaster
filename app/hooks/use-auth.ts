'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'
import { useMemo, useCallback } from 'react'
import type { Session } from 'next-auth'

// Extended user type with additional properties
export interface AuthUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  // Add any additional user properties here
}

// Authentication status enum for better type safety
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated'
}

// Main authentication state interface
export interface AuthState {
  // Core state
  status: AuthStatus
  isLoading: boolean
  isAuthenticated: boolean
  isUnauthenticated: boolean
  
  // User data
  user: AuthUser | null
  session: Session | null
  
  // Helper functions
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAllRoles: (roles: string[]) => boolean
  
  // User information helpers
  getUserDisplayName: () => string
  getUserInitials: () => string
  getUserAvatar: () => string | null
  
  // Session helpers
  getSessionToken: () => string | null
  isSessionExpired: () => boolean
  getSessionExpiryTime: () => Date | null
  getTimeUntilExpiry: () => number | null // milliseconds
}

// Extended Session type with optional custom fields
type SessionExt = Session & {
  accessToken?: string
  expires?: string
  user?: AuthUser & {
    roles?: string[]
    permissions?: string[]
  }
}

/**
 * Custom hook for managing authentication state and user session data
 * 
 * This hook wraps NextAuth's useSession and provides additional
 * convenience methods and computed values for authentication logic.
 * 
 * @returns {AuthState} Complete authentication state and helper functions
 */
export function useAuth(): AuthState {
  const { data: session, status } = useNextAuthSession()

  // Memoized authentication status
  const authStatus = useMemo((): AuthStatus => {
    switch (status) {
      case 'loading':
        return AuthStatus.LOADING
      case 'authenticated':
        return AuthStatus.AUTHENTICATED
      case 'unauthenticated':
        return AuthStatus.UNAUTHENTICATED
      default:
        return AuthStatus.LOADING
    }
  }, [status])

  // Memoized boolean states
  const isLoading = useMemo(() => authStatus === AuthStatus.LOADING, [authStatus])
  const isAuthenticated = useMemo(() => authStatus === AuthStatus.AUTHENTICATED, [authStatus])
  const isUnauthenticated = useMemo(() => authStatus === AuthStatus.UNAUTHENTICATED, [authStatus])

  // Memoized user object with proper typing
  const user = useMemo((): AuthUser | null => {
    if (!session?.user) return null
    
    return {
      id: session.user.id || '',
      name: session.user.name || null,
      email: session.user.email || null,
      image: session.user.image || null
    }
  }, [session?.user])

  // Role checking function (placeholder for future role-based access)
  const hasRole = useCallback((role: string): boolean => {
    if (!session?.user) return false
    
    // TODO: Implement role checking based on your user model
    // This is a placeholder implementation
    const userRoles = (session as SessionExt)?.user?.roles || []
    return Array.isArray(userRoles) && userRoles.includes(role)
  }, [session])

  // Permission checking function (placeholder for future permission system)
  const hasPermission = useCallback((permission: string): boolean => {
    if (!session?.user) return false
    
    // TODO: Implement permission checking based on your authorization model
    // This is a placeholder implementation
    const userPermissions = (session as SessionExt)?.user?.permissions || []
    return Array.isArray(userPermissions) && userPermissions.includes(permission)
  }, [session])

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }, [hasRole])

  // Check if user has all of the specified roles
  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return roles.every(role => hasRole(role))
  }, [hasRole])

  // Get user's display name with fallbacks
  const getUserDisplayName = useCallback((): string => {
    if (!user) return 'Guest'
    
    if (user.name) return user.name
    if (user.email) return user.email.split('@')[0]
    return 'User'
  }, [user])

  // Get user's initials for avatars
  const getUserInitials = useCallback((): string => {
    if (!user?.name) return '?'
    
    const nameParts = user.name.trim().split(' ')
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }, [user?.name])

  // Get user's avatar URL
  const getUserAvatar = useCallback((): string | null => {
    return user?.image || null
  }, [user?.image])

  // Get session access token
  const getSessionToken = useCallback((): string | null => {
    return (session as SessionExt)?.accessToken || null
  }, [session])

  // Check if session is expired
  const isSessionExpired = useCallback((): boolean => {
    if (!session) return true
    
    const expires = (session as SessionExt)?.expires
    if (!expires) return false
    
    const expiryDate = new Date(expires)
    return expiryDate.getTime() < Date.now()
  }, [session])

  // Get session expiry time
  const getSessionExpiryTime = useCallback((): Date | null => {
    if (!session) return null
    
    const expires = (session as SessionExt)?.expires
    return expires ? new Date(expires) : null
  }, [session])

  // Get time until session expires (in milliseconds)
  const getTimeUntilExpiry = useCallback((): number | null => {
    const expiryTime = getSessionExpiryTime()
    if (!expiryTime) return null
    
    const timeLeft = expiryTime.getTime() - Date.now()
    return timeLeft > 0 ? timeLeft : 0
  }, [getSessionExpiryTime])

  // Return the complete authentication state
  return useMemo((): AuthState => ({
    // Core state
    status: authStatus,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    
    // User data
    user,
    session,
    
    // Helper functions
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    
    // User information helpers
    getUserDisplayName,
    getUserInitials,
    getUserAvatar,
    
    // Session helpers
    getSessionToken,
    isSessionExpired,
    getSessionExpiryTime,
    getTimeUntilExpiry
  }), [
    authStatus,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    user,
    session,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    getUserDisplayName,
    getUserInitials,
    getUserAvatar,
    getSessionToken,
    isSessionExpired,
    getSessionExpiryTime,
    getTimeUntilExpiry
  ])
}

// Additional utility hooks for specific use cases

/**
 * Hook that returns only the user data
 * Useful when you only need user information
 */
export function useUser(): AuthUser | null {
  const { user } = useAuth()
  return user
}

/**
 * Hook that returns only the authentication status
 * Useful for conditional rendering based on auth state
 */
export function useAuthStatus(): {
  isLoading: boolean
  isAuthenticated: boolean
  isUnauthenticated: boolean
  status: AuthStatus
} {
  const { isLoading, isAuthenticated, isUnauthenticated, status } = useAuth()
  return { isLoading, isAuthenticated, isUnauthenticated, status }
}

/**
 * Hook for role-based access control
 * Returns role checking functions
 */
export function useRoles(): {
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAllRoles: (roles: string[]) => boolean
} {
  const { hasRole, hasAnyRole, hasAllRoles } = useAuth()
  return { hasRole, hasAnyRole, hasAllRoles }
}

/**
 * Hook for session management
 * Returns session-related data and helpers
 */
export function useSession(): {
  session: Session | null
  isSessionExpired: () => boolean
  getSessionExpiryTime: () => Date | null
  getTimeUntilExpiry: () => number | null
  getSessionToken: () => string | null
} {
  const { 
    session, 
    isSessionExpired, 
    getSessionExpiryTime, 
    getTimeUntilExpiry, 
    getSessionToken 
  } = useAuth()
  
  return {
    session,
    isSessionExpired,
    getSessionExpiryTime,
    getTimeUntilExpiry,
    getSessionToken
  }
}