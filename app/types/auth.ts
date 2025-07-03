/**
 * Comprehensive TypeScript types for authentication
 * Extends the types defined in the useAuth hook
 */

import type { Session } from 'next-auth'

// Extended authentication types
export interface ExtendedAuthUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  roles?: string[]
  permissions?: string[]
  createdAt?: Date
  lastLoginAt?: Date
  emailVerified?: boolean
  isActive?: boolean
  metadata?: Record<string, any>
}

// Role-based access control types
export interface UserRole {
  id: string
  name: string
  description?: string
  permissions: string[]
}

export interface UserPermission {
  id: string
  name: string
  description?: string
  resource?: string
  action?: string
}

// Authentication context types
export interface AuthContextValue {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAuthenticated: boolean
  isUnauthenticated: boolean
  user: ExtendedAuthUser | null
}

// Hook return types for better typing
export interface UseAuthReturn extends AuthContextValue {
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
  getTimeUntilExpiry: () => number | null
}

// Authentication event types
export type AuthEvent = 
  | 'sign-in-start'
  | 'sign-in-success' 
  | 'sign-in-error'
  | 'sign-out'
  | 'session-refresh'
  | 'session-expired'
  | 'token-refresh'

export interface AuthEventHandler {
  (event: AuthEvent, data?: any): void
}

// Configuration types
export interface AuthConfig {
  enableRoles?: boolean
  enablePermissions?: boolean
  sessionTimeout?: number
  refreshThreshold?: number
  onAuthEvent?: AuthEventHandler
}

// Error types
export interface AuthErrorInfo {
  code: string
  message: string
  type: 'authentication' | 'authorization' | 'session' | 'network'
  retryable: boolean
  timestamp: Date
}

// Component prop types
export interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
  requiredRoles?: string[]
  requiredPermission?: string
  requiredPermissions?: string[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: string[]
  permissions?: string[]
  fallback?: React.ReactNode
  onUnauthorized?: () => void
}

// Utility types
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type UserInfo = Pick<ExtendedAuthUser, 'id' | 'name' | 'email' | 'image'>

export type SessionInfo = {
  token: string | null
  expiresAt: Date | null
  isExpired: boolean
  timeUntilExpiry: number | null
}

// Generic utility types for auth-related data
export type AuthDataState<T = any> = {
  data: T | null
  loading: boolean
  error: AuthErrorInfo | null
}

export type AuthMutationState = {
  loading: boolean
  error: AuthErrorInfo | null
  success: boolean
}

// Form types for authentication
export interface SignInFormData {
  email?: string
  password?: string
  provider?: 'github' | 'google' | 'credentials'
  remember?: boolean
  callbackUrl?: string
}

export interface SignUpFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface ProfileFormData {
  name?: string
  email?: string
  image?: string
  bio?: string
  preferences?: Record<string, any>
}

// API response types
export interface AuthApiResponse<T = any> {
  success: boolean
  data?: T
  error?: AuthErrorInfo
  message?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: 'Bearer'
}

// Middleware types
export interface AuthMiddlewareConfig {
  publicRoutes?: string[]
  protectedRoutes?: string[]
  adminRoutes?: string[]
  redirects?: {
    signIn?: string
    signOut?: string
    unauthorized?: string
  }
}

// Testing types
export interface MockAuthUser extends ExtendedAuthUser {
  _isMock: true
}

export interface AuthTestHelpers {
  signIn: (user?: Partial<ExtendedAuthUser>) => Promise<void>
  signOut: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: AuthErrorInfo | null) => void
  mockRole: (role: string) => void
  mockPermission: (permission: string) => void
}

// Type guards
export const isAuthenticatedUser = (user: any): user is ExtendedAuthUser => {
  return user && typeof user.id === 'string' && user.email
}

export const isValidSession = (session: any): session is Session => {
  return session && session.user && isAuthenticatedUser(session.user)
}

export const isAuthError = (error: any): error is AuthErrorInfo => {
  return error && typeof error.code === 'string' && typeof error.message === 'string'
}

// Constants
export const AUTH_STATUSES = ['loading', 'authenticated', 'unauthenticated'] as const
export const AUTH_EVENTS = [
  'sign-in-start',
  'sign-in-success', 
  'sign-in-error',
  'sign-out',
  'session-refresh',
  'session-expired',
  'token-refresh'
] as const

export const AUTH_ERROR_TYPES = ['authentication', 'authorization', 'session', 'network'] as const