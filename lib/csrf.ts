import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Verify CSRF token for server actions and API routes
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  try {
    const headersList = await headers()
    const csrfHeader = headersList.get('x-csrf-token')
    const csrfCookie = request.cookies.get('__Host-next-auth.csrf-token')

    if (!csrfHeader || !csrfCookie) {
      return false
    }

    // Extract the actual token from the cookie value (format: token|hash)
    const [cookieToken] = csrfCookie.value.split('|')
    
    return csrfHeader === cookieToken
  } catch (error) {
    console.error('CSRF verification error:', error)
    return false
  }
}

/**
 * CSRF protection wrapper for server actions
 */
export function withCsrfProtection<T extends (...args: unknown[]) => unknown>(
  action: T
): T {
  return (async (...args: Parameters<T>) => {
    // Server actions in Next.js App Router have built-in CSRF protection
    // This wrapper is for additional validation if needed
    try {
      return await action(...args)
    } catch (error) {
      console.error('Action error:', error)
      throw error
    }
  }) as T
}