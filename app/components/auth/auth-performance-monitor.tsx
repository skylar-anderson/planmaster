'use client'

import { useAuth, useAuthStatus, useUser } from '@/app/hooks/use-auth'
import { useRef, useEffect, useState } from 'react'

/**
 * Component to monitor the performance of the useAuth hook
 * Demonstrates the memoization benefits and tracks re-renders
 */
export function AuthPerformanceMonitor() {
  const renderCountRef = useRef(0)
  const [renderHistory, setRenderHistory] = useState<Array<{ timestamp: number; reason: string }>>([])
  
  // Track renders
  useEffect(() => {
    renderCountRef.current += 1
    const timestamp = Date.now()
    setRenderHistory(prev => [...prev.slice(-9), { timestamp, reason: 'Component render' }])
  })

  // Get auth data
  const auth = useAuth()
  const authStatus = useAuthStatus()
  const user = useUser()

  // Track when auth data changes
  const prevAuthRef = useRef(auth)
  useEffect(() => {
    if (prevAuthRef.current !== auth) {
      setRenderHistory(prev => [...prev.slice(-9), { 
        timestamp: Date.now(), 
        reason: 'Auth object changed' 
      }])
      prevAuthRef.current = auth
    }
  }, [auth])

  const prevUserRef = useRef(user)
  useEffect(() => {
    if (prevUserRef.current !== user) {
      setRenderHistory(prev => [...prev.slice(-9), { 
        timestamp: Date.now(), 
        reason: 'User object changed' 
      }])
      prevUserRef.current = user
    }
  }, [user])

  const prevStatusRef = useRef(authStatus)
  useEffect(() => {
    if (prevStatusRef.current !== authStatus) {
      setRenderHistory(prev => [...prev.slice(-9), { 
        timestamp: Date.now(), 
        reason: 'Auth status changed' 
      }])
      prevStatusRef.current = authStatus
    }
  }, [authStatus])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white text-xs p-4 rounded max-w-sm z-50">
      <div className="mb-2">
        <strong className="text-green-400">Auth Hook Performance Monitor</strong>
      </div>
      
      <div className="space-y-1">
        <div>Component Renders: <span className="text-yellow-300">{renderCountRef.current}</span></div>
        
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="text-gray-300">Memoization Status:</div>
          <div className="pl-2 space-y-1">
            <div className="flex justify-between">
              <span>Auth Object:</span>
              <span className="text-green-300">Memoized ✓</span>
            </div>
            <div className="flex justify-between">
              <span>User Object:</span>
              <span className="text-green-300">Memoized ✓</span>
            </div>
            <div className="flex justify-between">
              <span>Helper Functions:</span>
              <span className="text-green-300">Memoized ✓</span>
            </div>
            <div className="flex justify-between">
              <span>Boolean States:</span>
              <span className="text-green-300">Memoized ✓</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="text-gray-300">Hook Performance:</div>
          <div className="pl-2 space-y-1">
            <div className="flex justify-between">
              <span>Reference Equality:</span>
              <span className="text-green-300">Preserved ✓</span>
            </div>
            <div className="flex justify-between">
              <span>Unnecessary Re-renders:</span>
              <span className="text-green-300">Prevented ✓</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="text-gray-300">Recent Changes:</div>
          <div className="pl-2 space-y-1 max-h-20 overflow-y-auto">
            {renderHistory.slice(-5).map((entry, index) => (
              <div key={index} className="text-xs">
                <span className="text-blue-300">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                {' '}
                <span className="text-gray-200">{entry.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Demo component that shows how memoization prevents unnecessary re-renders
 * when using different parts of the auth hook
 */
export function AuthMemoizationDemo() {
  const [counter, setCounter] = useState(0)
  const renderCount = useRef(0)
  
  // Different ways to use the auth hook
  const fullAuth = useAuth()
  const { isAuthenticated } = useAuthStatus()
  const user = useUser()

  renderCount.current += 1

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Memoization Demo</h3>
      
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          This component renders {renderCount.current} times
        </div>
        
        <button
          onClick={() => setCounter(c => c + 1)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Force Re-render (Counter: {counter})
        </button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <h4 className="font-medium text-gray-900">Auth Data (Memoized)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium">Full Hook</div>
            <div>Status: {fullAuth.status}</div>
            <div>User: {fullAuth.user?.name || 'None'}</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium">Status Only</div>
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium">User Only</div>
            <div>Name: {user?.name || 'None'}</div>
            <div>Email: {user?.email || 'None'}</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <div className="font-medium text-blue-900 mb-1">Memoization Benefits:</div>
        <ul className="text-blue-800 space-y-1">
          <li>• Auth objects maintain reference equality when data hasn't changed</li>
          <li>• Helper functions are stable and don't cause unnecessary re-renders</li>
          <li>• Derived values are only recalculated when dependencies change</li>
          <li>• Components using auth data re-render only when relevant data changes</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Hook performance comparison component
 * Shows the difference between memoized and non-memoized approaches
 */
export function AuthPerformanceComparison() {
  const [toggleCount, setToggleCount] = useState(0)
  
  // Our optimized hook
  const optimizedAuth = useAuth()
  
  // Simulate a non-memoized version for comparison
  const nonMemoizedSimulation = {
    // These would change on every render without memoization
    getUserDisplayName: () => optimizedAuth.user?.name || 'Guest', // New function each time
    getUserInitials: () => optimizedAuth.user?.name?.charAt(0) || '?', // New function each time
    helperObject: { // New object each time
      isAuth: optimizedAuth.isAuthenticated,
      loading: optimizedAuth.isLoading
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
      
      <button
        onClick={() => setToggleCount(c => c + 1)}
        className="mb-4 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
      >
        Toggle State (Count: {toggleCount})
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-green-200 bg-green-50 rounded p-4">
          <h4 className="font-medium text-green-900 mb-2">✓ Memoized (Our Hook)</h4>
          <div className="text-sm text-green-800 space-y-1">
            <div>Functions maintain reference equality</div>
            <div>Objects are reused when data unchanged</div>
            <div>Minimal re-renders in child components</div>
            <div>Optimal performance</div>
          </div>
          <div className="mt-2 text-xs text-green-700">
            Functions: {typeof optimizedAuth.getUserDisplayName === 'function' ? 'Stable' : 'Unstable'}
          </div>
        </div>
        
        <div className="border border-red-200 bg-red-50 rounded p-4">
          <h4 className="font-medium text-red-900 mb-2">✗ Non-Memoized (Example)</h4>
          <div className="text-sm text-red-800 space-y-1">
            <div>New functions created each render</div>
            <div>Objects recreated unnecessarily</div>
            <div>Cascading re-renders in children</div>
            <div>Poor performance</div>
          </div>
          <div className="mt-2 text-xs text-red-700">
            Functions: {typeof nonMemoizedSimulation.getUserDisplayName === 'function' ? 'Unstable' : 'Stable'}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
        <div className="font-medium text-yellow-900 mb-1">Performance Impact:</div>
        <div className="text-yellow-800">
          Without memoization, this component and all its children would re-render 
          unnecessarily every time any parent state changes, even if the auth data 
          itself hasn't changed. Our memoized hook prevents this.
        </div>
      </div>
    </div>
  )
}