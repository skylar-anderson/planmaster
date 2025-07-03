import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signIn, signOut } from 'next-auth/react'
import { AuthErrorHandler } from '@/lib/auth-error-handler'
import { SignInButton } from '@/app/components/auth/sign-in-button'
import { AuthErrorDisplay } from '@/app/components/auth/auth-error'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// Mock CSRF provider
jest.mock('@/app/components/auth/csrf-provider', () => ({
  useCsrfToken: jest.fn(() => ({
    csrfToken: 'test-csrf-token',
    refreshCsrfToken: jest.fn(),
    isLoading: false,
    error: null
  }))
}))

describe('Authentication Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    })
  })

  describe('OAuth Errors', () => {
    it('handles AccessDenied error', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'AccessDenied',
        status: 401,
        url: null
      })
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
        expect(screen.getByText(/access was denied/i)).toBeInTheDocument()
      })
    })

    it('handles OAuthSignin error', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'OAuthSignin',
        status: 500,
        url: null
      })
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
        expect(screen.getByText(/there was an error communicating with github/i)).toBeInTheDocument()
      })
    })

    it('handles OAuthCallback error', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'OAuthCallback',
        status: 500,
        url: null
      })
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
        expect(screen.getByText(/authentication callback failed/i)).toBeInTheDocument()
      })
    })

    it('handles Configuration error', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'Configuration',
        status: 500,
        url: null
      })
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
        expect(screen.getByText(/authentication service is temporarily misconfigured/i)).toBeInTheDocument()
      })
    })
  })

  describe('Network Errors', () => {
    it('handles network timeout', async () => {
      const user = userEvent.setup()
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      mockSignIn.mockRejectedValue(timeoutError)
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      })
    })

    it('handles connection refused', async () => {
      const user = userEvent.setup()
      const connectionError = new Error('Connection refused')
      connectionError.name = 'ConnectionError'
      mockSignIn.mockRejectedValue(connectionError)
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      })
    })

    it('handles fetch abort', async () => {
      const user = userEvent.setup()
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      mockSignIn.mockRejectedValue(abortError)
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Edge Cases', () => {
    it('handles expired session during operation', async () => {
      // Start authenticated
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: '2024-01-01' // Past date
        },
        status: 'authenticated',
        update: jest.fn()
      })

      const ExpiredSessionComponent = () => {
        const { data: session } = useSession()
        const isExpired = session && new Date(session.expires) < new Date()
        
        if (isExpired) {
          return <div>Session expired</div>
        }
        
        return <div>Session valid</div>
      }
      
      render(<ExpiredSessionComponent />)
      expect(screen.getByText('Session expired')).toBeInTheDocument()
    })

    it('handles concurrent session usage', async () => {
      const user = userEvent.setup()
      let signInCallCount = 0
      
      mockSignIn.mockImplementation(() => {
        signInCallCount++
        if (signInCallCount === 1) {
          return Promise.resolve({ ok: true, error: null, status: 200, url: null })
        } else {
          return Promise.resolve({
            ok: false,
            error: 'SessionConflict',
            status: 409,
            url: null
          })
        }
      })
      
      render(
        <div>
          <SignInButton />
          <SignInButton />
        </div>
      )
      
      const buttons = screen.getAllByRole('button', { name: /sign in with github/i })
      
      // Click both buttons simultaneously
      await Promise.all([
        user.click(buttons[0]),
        user.click(buttons[1])
      ])
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(2)
      })
    })

    it('handles invalid token scenarios', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' })
      } as Response)
      
      // Simulate API call with invalid token
      try {
        const response = await fetch('/api/protected-endpoint', {
          headers: { 'Authorization': 'Bearer invalid-token' }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          expect(errorData.error).toBe('Invalid token')
          expect(response.status).toBe(401)
        }
      } finally {
        mockFetch.mockRestore()
      }
    })
  })

  describe('Error Recovery', () => {
    it('allows retry after transient error', async () => {
      const user = userEvent.setup()
      mockSignIn
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockResolvedValueOnce({ ok: true, error: null, status: 200, url: null })
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      })
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(2)
      })
    })

    it('prevents retry for non-retryable errors', () => {
      const error = {
        type: 'validation_error' as const,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
        retryable: false
      }
      
      render(<AuthErrorDisplay error={error} />)
      
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    })

    it('handles rapid consecutive error states', async () => {
      const user = userEvent.setup()
      
      mockSignIn
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({ ok: true, error: null, status: 200, url: null })
      
      render(<SignInButton />)
      
      const button = screen.getByRole('button', { name: /sign in with github/i })
      
      // First attempt
      await user.click(button)
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      })
      
      // Retry
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
      })
      
      // Second retry
      const retryButton2 = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton2)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(3)
      })
    })
  })
})