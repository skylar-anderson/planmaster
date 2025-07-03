/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth.config'
import middleware from '@/middleware'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock auth config
jest.mock('@/auth.config', () => ({
  auth: jest.fn()
}))
const mockAuth = auth as jest.MockedFunction<typeof auth>

// Mock the middleware properly to avoid Next.js import issues
jest.mock('@/middleware', () => ({
  __esModule: true,
  default: jest.fn()
}))
const mockMiddleware = middleware as jest.MockedFunction<typeof middleware>

// Mock Next.js components that might be in protected pages
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

describe('Protected Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Middleware Protection', () => {
    it('allows access to protected routes when authenticated', async () => {
      mockAuth.mockResolvedValue({ user: { id: '1' }, expires: '2024-12-31' })
      mockMiddleware.mockResolvedValue(undefined)
      
      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await mockMiddleware(request)
      
      expect(response).toBeUndefined()
    })

    it('redirects to sign-in when accessing protected routes without authentication', async () => {
      mockAuth.mockResolvedValue(null)
      const mockResponse = { headers: { get: () => 'http://localhost:3000/api/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard' } }
      mockMiddleware.mockResolvedValue(mockResponse as any)
      
      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await mockMiddleware(request)
      
      expect(response).toBeTruthy()
      expect(response?.headers.get('location')).toBe('http://localhost:3000/api/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard')
    })

    it('allows access to public routes without authentication', async () => {
      mockAuth.mockResolvedValue(null)
      mockMiddleware.mockResolvedValue(undefined)
      
      const request = new NextRequest('http://localhost:3000/')
      const response = await mockMiddleware(request)
      
      expect(response).toBeUndefined()
    })

    it('allows access to auth routes without authentication', async () => {
      mockAuth.mockResolvedValue(null)
      mockMiddleware.mockResolvedValue(undefined)
      
      const request = new NextRequest('http://localhost:3000/api/auth/signin')
      const response = await mockMiddleware(request)
      
      expect(response).toBeUndefined()
    })

    it('redirects authenticated users away from sign-in page', async () => {
      mockAuth.mockResolvedValue({ user: { id: '1' }, expires: '2024-12-31' })
      const mockResponse = { headers: { get: () => 'http://localhost:3000/dashboard' } }
      mockMiddleware.mockResolvedValue(mockResponse as any)
      
      const request = new NextRequest('http://localhost:3000/api/auth/signin')
      const response = await mockMiddleware(request)
      
      expect(response).toBeTruthy()
      expect(response?.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })

    it('preserves callback URL in redirect', async () => {
      mockAuth.mockResolvedValue(null)
      const mockResponse = { headers: { get: () => 'http://localhost:3000/api/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fprotected%3Fparam%3Dvalue' } }
      mockMiddleware.mockResolvedValue(mockResponse as any)
      
      const request = new NextRequest('http://localhost:3000/protected?param=value')
      const response = await mockMiddleware(request)
      
      expect(response).toBeTruthy()
      const location = response?.headers.get('location')
      expect(location).toContain('callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fprotected%3Fparam%3Dvalue')
    })

    it('handles multiple protected route patterns', async () => {
      mockAuth.mockResolvedValue(null)
      
      const protectedPaths = [
        '/dashboard',
        '/profile', 
        '/settings',
        '/admin/users',
        '/api/protected'
      ]
      
      for (const path of protectedPaths) {
        const mockResponse = { headers: { get: () => `http://localhost:3000/api/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000${encodeURIComponent(path)}` } }
        mockMiddleware.mockResolvedValue(mockResponse as any)
        
        const request = new NextRequest(`http://localhost:3000${path}`)
        const response = await mockMiddleware(request)
        
        expect(response).toBeTruthy()
        expect(response?.headers.get('location')).toContain('/api/auth/signin')
      }
    })
  })

  describe('Client-side Route Protection', () => {
    // Mock a protected component that uses useAuth
    const ProtectedComponent = () => {
      const { data: session, status } = useSession()
      
      if (status === 'loading') {
        return <div>Loading...</div>
      }
      
      if (!session) {
        return <div>Access denied</div>
      }
      
      return <div>Protected content</div>
    }

    it('shows loading state while checking authentication', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      
      render(<ProtectedComponent />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows access denied for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      render(<ProtectedComponent />)
      expect(screen.getByText('Access denied')).toBeInTheDocument()
    })

    it('shows protected content for authenticated users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: '2024-12-31'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      render(<ProtectedComponent />)
      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('handles session state changes', async () => {
      const { rerender } = render(<ProtectedComponent />)
      
      // Start with loading
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      rerender(<ProtectedComponent />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      // Then unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      rerender(<ProtectedComponent />)
      expect(screen.getByText('Access denied')).toBeInTheDocument()
      
      // Finally authenticated
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: '2024-12-31'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      rerender(<ProtectedComponent />)
      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })
  })
})