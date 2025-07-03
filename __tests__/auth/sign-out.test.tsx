import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signOut } from 'next-auth/react'
import { SignOutButton } from '@/app/components/auth/sign-out-button'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// Mock console methods to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('SignOutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2024-12-31'
      },
      status: 'authenticated',
      update: jest.fn()
    })
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  it('renders sign out button', () => {
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows loading state when signing out', async () => {
    const user = userEvent.setup()
    mockSignOut.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<SignOutButton />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    expect(screen.getAllByText(/loading/i)[0]).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('calls signOut when button is clicked', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue(undefined)
    
    render(<SignOutButton />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('shows confirmation dialog when showConfirmation is true', async () => {
    const user = userEvent.setup()
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true)
    mockSignOut.mockResolvedValue(undefined)
    
    render(<SignOutButton showConfirmation={true} />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to sign out?')
    expect(mockSignOut).toHaveBeenCalled()
    
    mockConfirm.mockRestore()
  })

  it('cancels sign out when user rejects confirmation', async () => {
    const user = userEvent.setup()
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false)
    
    render(<SignOutButton showConfirmation={true} />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to sign out?')
    expect(mockSignOut).not.toHaveBeenCalled()
    
    mockConfirm.mockRestore()
  })

  it('handles sign out errors gracefully', async () => {
    const user = userEvent.setup()
    const error = new Error('Sign out failed')
    mockSignOut.mockRejectedValue(error)
    
    render(<SignOutButton />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Sign out error:', error)
    })
    
    // Button should be re-enabled after error
    expect(button).not.toBeDisabled()
  })

  it('accepts custom className', () => {
    render(<SignOutButton className="custom-class" />)
    const button = screen.getByRole('button', { name: /sign out/i })
    expect(button).toHaveClass('custom-class')
  })

  it('accepts custom children content', () => {
    render(<SignOutButton>Custom Sign Out Text</SignOutButton>)
    expect(screen.getByText('Custom Sign Out Text')).toBeInTheDocument()
  })

  it('maintains loading state until sign out completes', async () => {
    const user = userEvent.setup()
    let resolveSignOut: () => void
    const signOutPromise = new Promise<void>((resolve) => {
      resolveSignOut = resolve
    })
    mockSignOut.mockReturnValue(signOutPromise)
    
    render(<SignOutButton />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    // Should be loading
    expect(screen.getAllByText(/loading/i)[0]).toBeInTheDocument()
    expect(button).toBeDisabled()
    
    // Resolve the promise
    resolveSignOut!()
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })
})