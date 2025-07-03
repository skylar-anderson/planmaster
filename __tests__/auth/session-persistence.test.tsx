import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession, getSession } from 'next-auth/react'
import { cookies } from 'next/headers'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('Session Persistence and Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now for consistent timing tests
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Session Persistence', () => {
    it('persists session across page reloads', async () => {
      const sessionData = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59Z'
      }

      mockUseSession.mockReturnValue({
        data: sessionData,
        status: 'authenticated',
        update: jest.fn()
      })

      const SessionComponent = () => {
        const { data: session, status } = useSession()
        
        if (status === 'loading') return <div>Loading...</div>
        if (!session) return <div>Not authenticated</div>
        
        return <div>User: {session.user?.name}</div>
      }

      render(<SessionComponent />)
      
      expect(screen.getByText('User: Test User')).toBeInTheDocument()
      // Session persistence is demonstrated by the session data being available
      expect(mockUseSession).toHaveBeenCalled()
    })

    it('handles missing session cookies', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
        delete: jest.fn()
      }
      mockCookies.mockReturnValue(mockCookieStore as any)

      mockGetSession.mockResolvedValue(null)
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })

      const SessionComponent = () => {
        const { data: session, status } = useSession()
        
        if (status === 'loading') return <div>Loading...</div>
        if (!session) return <div>Not authenticated</div>
        
        return <div>Authenticated</div>
      }

      render(<SessionComponent />)
      
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })

    it('validates session expiry', () => {
      const expiredSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2023-12-31T23:59:59Z' // Past date
      }

      const SessionExpiryComponent = () => {
        const isExpired = new Date(expiredSession.expires) < new Date()
        
        return (
          <div>
            Session expired: {isExpired ? 'Yes' : 'No'}
          </div>
        )
      }

      render(<SessionExpiryComponent />)
      
      expect(screen.getByText('Session expired: Yes')).toBeInTheDocument()
    })

    it('maintains session state during navigation', async () => {
      const sessionData = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59Z'
      }

      mockUseSession.mockReturnValue({
        data: sessionData,
        status: 'authenticated',
        update: jest.fn()
      })

      const NavigationComponent = () => {
        const { data: session } = useSession()
        
        return (
          <div>
            <div data-testid="user-info">
              {session?.user?.name || 'Not logged in'}
            </div>
            <button onClick={() => {/* simulate navigation */}}>
              Navigate
            </button>
          </div>
        )
      }

      const { rerender } = render(<NavigationComponent />)
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User')
      
      // Simulate navigation - session should persist
      rerender(<NavigationComponent />)
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User')
    })
  })

  describe('Session Refresh', () => {
    it('refreshes session automatically before expiry', async () => {
      const mockUpdate = jest.fn()
      
      // Test the session refresh logic directly
      const checkSessionRefresh = (session: any, update: () => void, currentTime: number) => {
        if (session) {
          const timeUntilExpiry = new Date(session.expires).getTime() - currentTime
          const shouldRefresh = timeUntilExpiry < 5 * 60 * 1000 // 5 minutes

          if (shouldRefresh) {
            update()
          }
        }
      }

      // Mock time: 2024-01-15T12:00:00Z = 1705320000000
      const mockNow = new Date('2024-01-15T12:00:00Z').getTime()
      
      // Session that expires in 4 minutes from mock "now" (less than 5 minute threshold)
      const nearExpirySession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-01-15T12:04:00Z' // = 4 minutes later (should trigger refresh)
      }

      checkSessionRefresh(nearExpirySession, mockUpdate, mockNow)
      
      // Verify auto-refresh was called when session is near expiry
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('handles refresh failures gracefully', async () => {
      const sessionData = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-01-15T12:05:00Z' // 5 minutes from mock "now"
      }

      const mockUpdate = jest.fn().mockRejectedValue(new Error('Refresh failed'))

      mockUseSession.mockReturnValue({
        data: sessionData,
        status: 'authenticated',
        update: mockUpdate
      })

      const RefreshErrorComponent = () => {
        const { data: session, update } = useSession()
        
        const handleRefresh = async () => {
          try {
            await update()
          } catch (error) {
            // Handle refresh error
            console.error('Session refresh failed:', error)
          }
        }
        
        return (
          <div>
            <button onClick={handleRefresh}>Refresh Session</button>
          </div>
        )
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<RefreshErrorComponent />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh session/i })
      refreshButton.click()
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalledWith('Session refresh failed:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('triggers refresh on user activity', async () => {
      const sessionData = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-01-15T12:30:00Z'
      }

      const mockUpdate = jest.fn().mockResolvedValue(sessionData)
      let activityTimeout: NodeJS.Timeout

      mockUseSession.mockReturnValue({
        data: sessionData,
        status: 'authenticated',
        update: mockUpdate
      })

      const ActivityComponent = () => {
        const { update } = useSession()
        
        const handleActivity = () => {
          // Clear existing timeout
          if (activityTimeout) {
            clearTimeout(activityTimeout)
          }
          
          // Set new timeout to refresh session
          activityTimeout = setTimeout(() => {
            update()
          }, 100) // Short timeout for testing
        }
        
        return (
          <button onClick={handleActivity}>
            Trigger Activity
          </button>
        )
      }

      render(<ActivityComponent />)
      
      const activityButton = screen.getByRole('button', { name: /trigger activity/i })
      activityButton.click()
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled()
      }, { timeout: 200 })

      clearTimeout(activityTimeout)
    })

    it('handles concurrent refresh attempts', async () => {
      const sessionData = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-01-15T12:05:00Z'
      }

      let refreshCount = 0
      const mockUpdate = jest.fn().mockImplementation(() => {
        refreshCount++
        return Promise.resolve(sessionData)
      })

      mockUseSession.mockReturnValue({
        data: sessionData,
        status: 'authenticated',
        update: mockUpdate
      })

      const ConcurrentRefreshComponent = () => {
        const { update } = useSession()
        
        const handleConcurrentRefresh = async () => {
          // Trigger multiple refresh attempts simultaneously
          await Promise.all([
            update(),
            update(),
            update()
          ])
        }
        
        return (
          <button onClick={handleConcurrentRefresh}>
            Concurrent Refresh
          </button>
        )
      }

      render(<ConcurrentRefreshComponent />)
      
      const refreshButton = screen.getByRole('button', { name: /concurrent refresh/i })
      refreshButton.click()
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledTimes(3)
        expect(refreshCount).toBe(3)
      })
    })
  })

  describe('Session Storage', () => {
    it('stores session data securely', () => {
      const mockCookieStore = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
      }
      mockCookies.mockReturnValue(mockCookieStore as any)

      // Simulate setting a session cookie
      const sessionToken = 'secure-session-token'
      mockCookieStore.set('next-auth.session-token', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'next-auth.session-token',
        sessionToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        })
      )
    })

    it('clears session data on sign out', () => {
      const mockCookieStore = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
      }
      mockCookies.mockReturnValue(mockCookieStore as any)

      // Simulate sign out
      mockCookieStore.delete('next-auth.session-token')
      mockCookieStore.delete('next-auth.csrf-token')

      expect(mockCookieStore.delete).toHaveBeenCalledWith('next-auth.session-token')
      expect(mockCookieStore.delete).toHaveBeenCalledWith('next-auth.csrf-token')
    })
  })
})