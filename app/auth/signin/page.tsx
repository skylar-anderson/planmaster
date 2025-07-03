'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SignInButton } from '@/app/components/auth/sign-in-button'
import { useAuthErrorFromUrl, AuthErrorDisplay } from '@/app/components/auth/auth-error'
import Link from 'next/link'

function SignInContent() {
  const { status } = useSession()
  const router = useRouter()
  const error = useAuthErrorFromUrl()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">You are already signed in. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your dashboard and protected content
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <AuthErrorDisplay
              error={error}
              onRetry={() => window.location.reload()}
              className="w-full"
            />
          )}

          <SignInButton className="w-full justify-center" />

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
            <p className="text-xs text-gray-500">
              By signing in, you agree to our terms of service and privacy policy.
              We only request access to your public GitHub profile and email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}