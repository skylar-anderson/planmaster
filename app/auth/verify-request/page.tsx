'use client'

import Link from 'next/link'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 2.25l-10.72 6.018a2.25 2.25 0 01-2.06 0L1.5 9M8.25 19.5l5.25-5.25 7.5 7.5" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification link to your email address
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Click the link in your email to complete the sign-in process. 
                The link will expire in 24 hours for security.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Didn&apos;t receive an email? Check your spam folder or try signing in again.
            </p>
            <Link 
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to sign in
            </Link>
          </div>

          <div className="text-center pt-4">
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
            <h3 className="text-sm font-medium text-gray-900 mb-2">Troubleshooting</h3>
            <ul className="text-xs text-gray-600 text-left space-y-1">
              <li>• Check your spam or junk mail folder</li>
              <li>• Ensure your email client allows HTML emails</li>
              <li>• Try adding this domain to your safe senders list</li>
              <li>• Contact support if you continue having issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}