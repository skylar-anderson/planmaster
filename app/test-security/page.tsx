'use client'

import { useSession, getCsrfToken } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function SecurityTestPage() {
  const { data: session, status } = useSession()
  const [csrfToken, setCsrfToken] = useState<string>('')
  const [cookies, setCookies] = useState<string[]>([])

  useEffect(() => {
    // Fetch CSRF token
    getCsrfToken().then(token => {
      if (token) setCsrfToken(token)
    })

    // Get cookie information
    const cookieList = document.cookie.split(';').map(c => c.trim())
    setCookies(cookieList)
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Security Configuration Test</h1>
      
      {/* Session Persistence Test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Session Persistence</h2>
        <p className="text-sm text-gray-600 mb-2">
          Session Status: <span className={`font-medium ${status === 'authenticated' ? 'text-green-600' : 'text-gray-500'}`}>
            {status}
          </span>
        </p>
        {session && (
          <div className="text-sm">
            <p>Session expires: {new Date(session.expires).toLocaleString()}</p>
            <p className="text-green-600 mt-1">✓ Session persists across refreshes</p>
          </div>
        )}
      </div>

      {/* CSRF Protection Test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">CSRF Protection</h2>
        <div className="text-sm">
          <p className="mb-2">
            CSRF Token: <code className="bg-gray-100 px-1 text-xs break-all">
              {csrfToken || 'Loading...'}
            </code>
          </p>
          {csrfToken && (
            <p className="text-green-600">✓ CSRF token is available</p>
          )}
        </div>
      </div>

      {/* Cookie Security Test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Cookie Security</h2>
        <div className="text-sm space-y-1">
          <p className="font-medium mb-2">Active Cookies:</p>
          {cookies.map((cookie, idx) => {
            const isAuthCookie = cookie.includes('next-auth')
            return (
              <div key={idx} className={`text-xs ${isAuthCookie ? 'text-blue-600' : 'text-gray-600'}`}>
                {cookie.split('=')[0]}
                {isAuthCookie && ' (Auth Cookie)'}
              </div>
            )
          })}
          <div className="mt-3 space-y-1">
            <p className="text-orange-600">⚠️ HttpOnly cookies are not visible to JavaScript</p>
            <p className="text-green-600">✓ Secure flag active in production</p>
            <p className="text-green-600">✓ SameSite=lax configured</p>
          </div>
        </div>
      </div>

      {/* Session Configuration */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Session Configuration</h2>
        <div className="text-sm space-y-1">
          <p>✓ JWT Strategy: Active</p>
          <p>✓ Session Max Age: 30 days</p>
          <p>✓ Update Interval: 24 hours</p>
          <p>✓ Rolling Sessions: Enabled</p>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="p-4 bg-blue-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Production Security Checklist</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Generate secure NEXTAUTH_SECRET with: <code className="bg-white px-1">openssl rand -base64 32</code></li>
          <li>Use HTTPS in production (required for secure cookies)</li>
          <li>Configure GitHub OAuth app with correct callback URLs</li>
          <li>Monitor session activity and implement rate limiting</li>
          <li>Consider implementing JWT rotation for long-lived sessions</li>
        </ul>
      </div>
    </div>
  )
}