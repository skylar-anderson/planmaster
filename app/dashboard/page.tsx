import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UserAvatar } from '@/app/components/auth/user-avatar'
import { SignOutButton } from '@/app/components/auth/sign-out-button'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <UserAvatar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome, {session.user?.name}!</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Your GitHub Information</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user?.id || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Session Expires</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(session.expires).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Actions</h3>
              <div className="flex gap-4">
                <a
                  href="/protected"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Visit another protected page →
                </a>
                <a
                  href="/public"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Visit public page →
                </a>
              </div>
            </div>

            <div className="pt-4">
              <SignOutButton className="w-full sm:w-auto" />
            </div>
          </div>
        </div>

        {/* Additional Dashboard Content */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Stats</h3>
            <p className="text-3xl font-bold text-blue-600">42</p>
            <p className="text-sm text-gray-500">Total activities</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold text-green-600">7</p>
            <p className="text-sm text-gray-500">This week</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Progress</h3>
            <p className="text-3xl font-bold text-purple-600">85%</p>
            <p className="text-sm text-gray-500">Goals completed</p>
          </div>
        </div>
      </main>
    </div>
  )
}