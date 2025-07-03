'use client'

import { useState } from 'react'
import { AuthErrorDisplay, AuthErrorModal, type AuthError } from '@/app/components/auth/auth-error'
import { AuthErrorBoundary, useAuthErrorBoundary } from '@/app/components/auth/auth-error-boundary'
import { withAuthErrorHandling, useAuthErrorHandler } from '@/app/components/auth/with-auth-error-handling'
import { AuthErrorHandler } from '@/lib/auth-error-handler'
import { authLogger, AuthEventType } from '@/lib/auth-logger'

// Component to test error boundary
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test component error for error boundary')
  }
  return <div className="p-4 bg-green-100 rounded">Component working normally</div>
}

// Test component with auth error handling HOC
const TestComponentWithHOC = withAuthErrorHandling(function TestComponent({ onAuthError, onRetryAuth, authError, isRetrying }: any) {
  const [testError, setTestError] = useState<Error | null>(null)

  const handleTriggerError = () => {
    const error = new Error('Test error from HOC component')
    setTestError(error)
    onAuthError(error)
  }

  const handleRetryTest = async () => {
    await onRetryAuth(() => {
      setTestError(null)
      console.log('Retry successful!')
    })
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium mb-2">HOC Test Component</h3>
      <button 
        onClick={handleTriggerError}
        className="px-3 py-1 bg-red-500 text-white rounded text-sm mr-2"
      >
        Trigger Error
      </button>
      <button 
        onClick={handleRetryTest}
        disabled={isRetrying}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
      >
        {isRetrying ? 'Retrying...' : 'Retry'}
      </button>
      {testError && <p className="text-red-600 text-sm mt-2">Component error: {testError.message}</p>}
    </div>
  )
}, { showModal: false, maxRetries: 2 })

export default function AuthErrorTestPage() {
  const [testScenario, setTestScenario] = useState<string>('')
  const [showErrorBoundaryTest, setShowErrorBoundaryTest] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentError, setCurrentError] = useState<AuthError | null>(null)
  const [shouldThrowError, setShouldThrowError] = useState(false)
  
  const { reportError } = useAuthErrorBoundary()
  const errorHandler = useAuthErrorHandler({
    maxRetries: 3,
    onError: (error) => console.log('Error handler caught:', error),
    onRetrySuccess: () => console.log('Retry successful!'),
    onMaxRetriesReached: (error) => console.log('Max retries reached:', error)
  })

  const testScenarios: Record<string, AuthError> = {
    oauth_access_denied: {
      type: 'oauth_error',
      message: 'Access was denied. You may have cancelled the sign-in process.',
      code: 'ACCESS_DENIED',
      retryable: true
    },
    oauth_callback_error: {
      type: 'oauth_error',
      message: 'Authentication callback failed. Please try signing in again.',
      code: 'OAUTH_CALLBACK_ERROR',
      retryable: true
    },
    network_offline: {
      type: 'network_error',
      message: 'You appear to be offline. Please check your internet connection.',
      code: 'NETWORK_OFFLINE',
      retryable: true
    },
    network_timeout: {
      type: 'network_error',
      message: 'Authentication request timed out. Please try again.',
      code: 'REQUEST_TIMEOUT',
      retryable: true
    },
    rate_limit: {
      type: 'rate_limit',
      message: 'Too many authentication attempts. Please wait before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryable: false
    },
    service_unavailable: {
      type: 'service_unavailable',
      message: 'Authentication service is temporarily unavailable.',
      code: 'SERVICE_UNAVAILABLE',
      retryable: true
    },
    validation_error: {
      type: 'validation_error',
      message: 'Unable to create account with this email address.',
      code: 'EMAIL_CREATE_ACCOUNT_ERROR',
      retryable: false
    },
    unknown_error: {
      type: 'unknown',
      message: 'An unexpected error occurred during authentication.',
      code: 'UNKNOWN_ERROR',
      retryable: true
    }
  }

  const handleTestError = (scenarioKey: string) => {
    const error = testScenarios[scenarioKey]
    if (error) {
      setCurrentError(error)
      setTestScenario(scenarioKey)
      
      // Log the test error
      AuthErrorHandler.logError(error, {
        testScenario: scenarioKey,
        component: 'AuthErrorTestPage'
      })
      
      // Also test the error handler hook
      errorHandler.handleError(new Error(error.message))
    }
  }

  const handleRetry = () => {
    console.log(`Retrying scenario: ${testScenario}`)
    authLogger.info(AuthEventType.SIGN_IN_ATTEMPT, `Retry for test scenario: ${testScenario}`)
    
    // Simulate retry success after delay
    setTimeout(() => {
      setCurrentError(null)
      setTestScenario('')
      console.log('Test retry completed successfully')
      authLogger.info(AuthEventType.SIGN_IN_SUCCESS, `Test retry successful for: ${testScenario}`)
    }, 1000)
  }

  const handleDismiss = () => {
    setCurrentError(null)
    setTestScenario('')
  }

  const handleShowModal = (scenarioKey: string) => {
    const error = testScenarios[scenarioKey]
    if (error) {
      setCurrentError(error)
      setShowModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentError(null)
  }

  const handleTestErrorBoundary = () => {
    setShouldThrowError(true)
    setTimeout(() => setShouldThrowError(false), 100) // Reset after triggering
  }

  const handleProgrammaticError = () => {
    reportError(new Error('Programmatically reported error'))
  }

  const clearLogs = () => {
    authLogger.clearLogs()
    console.log('Auth logs cleared')
  }

  const exportLogs = () => {
    const logs = authLogger.exportLogs()
    const blob = new Blob([logs], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            Authentication Error Testing
          </h1>
          
          <div className="space-y-8">
            {/* Error Display Tests */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Error Display Component Tests
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(testScenarios).map(([key, error]) => (
                  <button
                    key={key}
                    onClick={() => handleTestError(key)}
                    className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{key.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-xs text-gray-600 mt-1">{error.message}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Type: {error.type} | Retryable: {error.retryable ? 'Yes' : 'No'}
                    </div>
                  </button>
                ))}
              </div>

              {currentError && !showModal && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Current Test Error:</h3>
                  <AuthErrorDisplay
                    error={currentError}
                    onRetry={currentError.retryable ? handleRetry : undefined}
                    onDismiss={handleDismiss}
                  />
                </div>
              )}
            </section>

            {/* Modal Tests */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Error Modal Tests
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {Object.keys(testScenarios).slice(0, 4).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleShowModal(key)}
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {key.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <AuthErrorModal
                error={currentError}
                onRetry={currentError?.retryable ? handleRetry : undefined}
                onClose={handleCloseModal}
                isOpen={showModal}
              />
            </section>

            {/* Error Boundary Tests */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Error Boundary Tests
              </h2>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={handleTestErrorBoundary}
                    className="px-4 py-2 bg-red-500 text-white rounded mr-4 hover:bg-red-600"
                  >
                    Trigger Component Error
                  </button>
                  <button
                    onClick={handleProgrammaticError}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Report Error Programmatically
                  </button>
                </div>

                <AuthErrorBoundary>
                  <ErrorThrowingComponent shouldThrow={shouldThrowError} />
                </AuthErrorBoundary>
              </div>
            </section>

            {/* HOC Tests */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Higher-Order Component Tests
              </h2>
              
              <TestComponentWithHOC />
            </section>

            {/* Error Hook Tests */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Error Handler Hook Tests
              </h2>
              
              <div className="p-4 border rounded-lg">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Hook State: Error: {errorHandler.error?.message || 'None'} | 
                    Retrying: {errorHandler.isRetrying ? 'Yes' : 'No'} | 
                    Attempts: {errorHandler.attemptCount}
                  </p>
                  
                  <button
                    onClick={() => errorHandler.handleError(new Error('Hook test error'))}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm mr-2"
                  >
                    Trigger Hook Error
                  </button>
                  
                  <button
                    onClick={() => errorHandler.handleRetry(() => console.log('Hook retry success!'))}
                    disabled={errorHandler.isRetrying || !errorHandler.canRetry}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm mr-2 disabled:opacity-50"
                  >
                    {errorHandler.isRetrying ? 'Retrying...' : 'Retry'}
                  </button>
                  
                  <button
                    onClick={errorHandler.clearError}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                  >
                    Clear Error
                  </button>
                </div>

                {errorHandler.error && (
                  <AuthErrorDisplay
                    error={errorHandler.error}
                    onRetry={errorHandler.canRetry ? () => errorHandler.handleRetry() : undefined}
                    onDismiss={errorHandler.clearError}
                  />
                )}
              </div>
            </section>

            {/* Logging Tests */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Logging Tests
              </h2>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => authLogger.info(AuthEventType.SIGN_IN_ATTEMPT, 'Test log entry')}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm mr-2"
                  >
                    Log Info
                  </button>
                  <button
                    onClick={() => authLogger.warn(AuthEventType.OAUTH_ERROR, 'Test warning')}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm mr-2"
                  >
                    Log Warning
                  </button>
                  <button
                    onClick={() => authLogger.error(AuthEventType.SIGN_IN_FAILURE, 'Test error', new Error('Test'))}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm mr-2"
                  >
                    Log Error
                  </button>
                  <button
                    onClick={exportLogs}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm mr-2"
                  >
                    Export Logs
                  </button>
                  <button
                    onClick={clearLogs}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                  >
                    Clear Logs
                  </button>
                </div>

                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p className="font-medium mb-2">Recent Logs (check console for full details):</p>
                  <div className="max-h-32 overflow-y-auto">
                    {authLogger.getLogs().slice(0, 5).map((log, index) => (
                      <div key={index} className="text-xs text-gray-700">
                        {log.timestamp}: {log.eventType} - {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Test Summary */}
            <section className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Test Checklist
              </h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Error display components render correctly for all error types</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Error modals show and hide appropriately</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Error boundaries catch component errors</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Retry mechanisms work for retryable errors</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Non-retryable errors hide retry buttons</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>HOC provides error handling to wrapped components</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Error handler hook manages state correctly</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Logging captures all error events with proper metadata</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Rate limiting prevents excessive retry attempts</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Sensitive data is sanitized in logs</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}