'use client'

import { useAuth, useAuthStatus, useUser } from '@/app/hooks/use-auth'

/**
 * Component that displays comprehensive authentication status
 * Demonstrates the useAuth hook's authentication status and user data capabilities
 */
export function AuthStatusDisplay() {
  const auth = useAuth()

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Authentication Status</h3>
      
      {/* Core Status Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm font-medium text-gray-700">Status</div>
          <div className={`text-lg font-semibold ${
            auth.isAuthenticated ? 'text-green-600' : 
            auth.isLoading ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {auth.status}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm font-medium text-gray-700">Loading</div>
          <div className={`text-lg font-semibold ${auth.isLoading ? 'text-yellow-600' : 'text-gray-600'}`}>
            {auth.isLoading ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* User Information */}
      {auth.user && (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">User Information</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              {auth.getUserAvatar() ? (
                <img
                  src={auth.getUserAvatar()!}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                  {auth.getUserInitials()}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">{auth.getUserDisplayName()}</div>
                <div className="text-sm text-gray-600">{auth.user.email}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              <div>User ID: {auth.user.id}</div>
              <div>Display Name: {auth.getUserDisplayName()}</div>
              <div>Initials: {auth.getUserInitials()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Session Information */}
      {auth.session && (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Session Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Session Expired:</span>
              <span className={auth.isSessionExpired() ? 'text-red-600' : 'text-green-600'}>
                {auth.isSessionExpired() ? 'Yes' : 'No'}
              </span>
            </div>
            
            {auth.getSessionExpiryTime() && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires At:</span>
                <span className="text-gray-900">
                  {auth.getSessionExpiryTime()!.toLocaleString()}
                </span>
              </div>
            )}
            
            {auth.getTimeUntilExpiry() && (
              <div className="flex justify-between">
                <span className="text-gray-600">Time Until Expiry:</span>
                <span className="text-gray-900">
                  {Math.round(auth.getTimeUntilExpiry()! / 1000 / 60)} minutes
                </span>
              </div>
            )}
            
            {auth.getSessionToken() && (
              <div className="flex justify-between">
                <span className="text-gray-600">Has Token:</span>
                <span className="text-green-600">Yes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boolean States */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">Boolean States</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className={`p-2 rounded text-center ${auth.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}
          </div>
          <div className={`p-2 rounded text-center ${auth.isUnauthenticated ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
            Unauthenticated: {auth.isUnauthenticated ? 'Yes' : 'No'}
          </div>
          <div className={`p-2 rounded text-center ${auth.isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
            Loading: {auth.isLoading ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple component showing just the authentication status
 * Demonstrates the useAuthStatus hook
 */
export function SimpleAuthStatus() {
  const { isAuthenticated, isLoading, status } = useAuthStatus()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-600' : 'bg-red-600'}`}></div>
      <span className="text-sm font-medium">
        {isAuthenticated ? 'Signed In' : 'Not Signed In'} ({status})
      </span>
    </div>
  )
}

/**
 * User avatar component that uses the useUser hook
 * Demonstrates specific user data access
 */
export function UserAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const user = useUser()
  const { getUserAvatar, getUserInitials, getUserDisplayName } = useAuth()

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center text-gray-600`}>
        <span>?</span>
      </div>
    )
  }

  const avatar = getUserAvatar()
  
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${getUserDisplayName()} avatar`}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold`}>
      {getUserInitials()}
    </div>
  )
}

/**
 * Navigation component that adapts based on authentication status
 * Demonstrates conditional rendering with authentication state
 */
export function AuthAwareNavigation() {
  const { isAuthenticated, isLoading, getUserDisplayName } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-300 h-8 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-300 h-8 w-8 rounded-full"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">Welcome, {getUserDisplayName()}</span>
        <UserAvatar />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Please sign in</span>
    </div>
  )
}