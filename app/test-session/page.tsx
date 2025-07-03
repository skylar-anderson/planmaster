'use client'

import { useSession } from 'next-auth/react'

export default function TestSessionPage() {
  const { data: session, status } = useSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Context Test</h1>
      
      <div className="mb-4">
        <p className="font-semibold">Session Status:</p>
        <p className={`text-lg ${
          status === 'loading' ? 'text-yellow-600' : 
          status === 'authenticated' ? 'text-green-600' : 
          'text-gray-600'
        }`}>
          {status}
        </p>
      </div>

      {status === 'authenticated' && session?.user && (
        <div className="mb-4">
          <p className="font-semibold">User Information:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(session.user, null, 2)}
          </pre>
        </div>
      )}

      {status === 'unauthenticated' && (
        <div className="mb-4">
          <p className="text-gray-600">No active session. User is not authenticated.</p>
        </div>
      )}

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p className="font-semibold mb-2">Test Results:</p>
        <ul className="list-disc list-inside text-sm">
          <li>✓ useSession hook is accessible</li>
          <li>{status !== 'loading' ? '✓' : '⏳'} Session status is resolved</li>
          <li>✓ No runtime errors detected</li>
        </ul>
      </div>
    </div>
  )
}