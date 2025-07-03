import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signIn } from 'next-auth/react'
import { SignInButton } from '@/app/components/auth/sign-in-button'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// Mock CSRF provider
jest.mock('@/app/components/auth/csrf-provider', () => ({
  useCsrfToken: jest.fn(() => ({
    csrfToken: 'test-csrf-token',
    refreshCsrfToken: jest.fn(),
    error: null
  }))
}))

describe('SignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    })
  })

  it('renders sign in button', () => {
    render(<SignInButton />)
    expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument()
  })

  it('shows loading state when signing in', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<SignInButton />)
    
    const button = screen.getByRole('button', { name: /sign in with github/i })
    await user.click(button)
    
    expect(screen.getAllByText(/loading/i)[0]).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('calls signIn when button is clicked', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null })
    
    render(<SignInButton />)
    
    const button = screen.getByRole('button', { name: /sign in with github/i })
    await user.click(button)
    
    expect(mockSignIn).toHaveBeenCalledWith('github', {
      callbackUrl: '/dashboard',
      csrfToken: 'test-csrf-token'
    })
  })

  it('handles sign in success', async () => {
    const user = userEvent.setup()
    
    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null })
    
    render(<SignInButton />)
    
    const button = screen.getByRole('button', { name: /sign in with github/i })
    await user.click(button)
    
    // Since signIn redirects on success, we mainly verify it was called
    expect(mockSignIn).toHaveBeenCalled()
    
    // Button should be re-enabled after successful sign-in (before redirect)
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('displays error on sign in failure', async () => {
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
    })
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Network error'))
    
    render(<SignInButton />)
    
    const button = screen.getByRole('button', { name: /sign in with github/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
    })
  })

  it('allows retry after error', async () => {
    const user = userEvent.setup()
    mockSignIn
      .mockRejectedValueOnce(new Error('Network error'))
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

  it('dismisses error when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Network error'))
    
    render(<SignInButton />)
    
    const button = screen.getByRole('button', { name: /sign in with github/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
    })
    
    const dismissButton = screen.getByRole('button', { name: /dismiss error/i })
    await user.click(dismissButton)
    
    expect(screen.queryByText(/authentication error/i)).not.toBeInTheDocument()
  })
})