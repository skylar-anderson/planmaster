'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewUserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard after a few seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to the platform!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your account has been successfully created
          </p>
        </div>

        {session?.user && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4">
              {session.user.image && (
                <img
                  className="h-12 w-12 rounded-full"
                  src={session.user.image}
                  alt={session.user.name || 'User avatar'}
                />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {session.user.name || 'User'}
                </h3>
                <p className="text-sm text-gray-600">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                Account setup complete! You now have access to all features.
                You&apos;ll be automatically redirected to your dashboard in a few seconds.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>

          <div className="text-center">
            <Link 
              href="/"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Return to home page
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Next Steps</h3>
            <ul className="text-xs text-gray-600 text-left space-y-1">
              <li>• Explore your dashboard and available features</li>
              <li>• Update your profile settings if needed</li>
              <li>• Review our documentation and guides</li>
              <li>• Join our community for support and updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}