'use client'

import { Suspense } from 'react'
import { useAuthErrorFromUrl, AuthErrorDisplay } from '@/app/components/auth/auth-error'
import { SignInButton } from '@/app/components/auth/sign-in-button'
import Link from 'next/link'

function AuthErrorContent() {
  const error = useAuthErrorFromUrl()

  const handleRetry = () => {
    // Clear URL parameters and redirect to sign in
    window.location.href = '/auth/signin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            There was a problem signing you in
          </p>
        </div>

        <div className="space-y-6">
          {error ? (
            <AuthErrorDisplay
              error={error}
              onRetry={error.retryable ? handleRetry : undefined}
              className="w-full"
            />
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Unknown Authentication Error</p>
                  <p className="mt-1 text-sm text-gray-700">
                    An unexpected error occurred during authentication. Please try signing in again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <SignInButton className="w-full" />
            
            <div className="text-center">
              <Link 
                href="/"
                className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Return to home page
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Common Solutions</h3>
              <ul className="text-xs text-gray-600 text-left space-y-1">
                <li>• Clear your browser cookies and try again</li>
                <li>• Disable browser extensions that might interfere</li>
                <li>• Try using an incognito/private browsing window</li>
                <li>• Check that your GitHub account has a public email</li>
                <li>• Ensure you&apos;re not using a VPN that might block the request</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}