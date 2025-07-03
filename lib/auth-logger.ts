export enum AuthLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AuthEventType {
  SIGN_IN_ATTEMPT = 'sign_in_attempt',
  SIGN_IN_SUCCESS = 'sign_in_success',
  SIGN_IN_FAILURE = 'sign_in_failure',
  SIGN_OUT = 'sign_out',
  SESSION_REFRESH = 'session_refresh',
  SESSION_EXPIRED = 'session_expired',
  OAUTH_CALLBACK = 'oauth_callback',
  OAUTH_ERROR = 'oauth_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT = 'rate_limit',
  COMPONENT_ERROR = 'component_error',
  SECURITY_VIOLATION = 'security_violation'
}

export interface AuthLogEntry {
  id: string
  timestamp: string
  level: AuthLogLevel
  eventType: AuthEventType
  message: string
  userId?: string
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  referer?: string
  errorCode?: string
  errorStack?: string
  metadata?: Record<string, any>
}

export interface AuthLoggerConfig {
  enableConsoleLogging?: boolean
  enableRemoteLogging?: boolean
  remoteEndpoint?: string
  enableLocalStorage?: boolean
  maxLocalEntries?: number
  logLevel?: AuthLogLevel
  includeUserAgent?: boolean
  includeLocation?: boolean
  sanitizeData?: boolean
}

class AuthLogger {
  private config: Required<AuthLoggerConfig>
  private sessionId: string
  private logBuffer: AuthLogEntry[] = []
  private isInitialized = false

  constructor(config: Partial<AuthLoggerConfig> = {}) {
    this.config = {
      enableConsoleLogging: config.enableConsoleLogging ?? process.env.NODE_ENV === 'development',
      enableRemoteLogging: config.enableRemoteLogging ?? process.env.NODE_ENV === 'production',
      remoteEndpoint: config.remoteEndpoint ?? '/api/auth/logs',
      enableLocalStorage: config.enableLocalStorage ?? true,
      maxLocalEntries: config.maxLocalEntries ?? 100,
      logLevel: config.logLevel ?? AuthLogLevel.INFO,
      includeUserAgent: config.includeUserAgent ?? true,
      includeLocation: config.includeLocation ?? true,
      sanitizeData: config.sanitizeData ?? true
    }

    this.sessionId = this.generateSessionId()
    this.initializeLogger()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeLogger(): void {
    if (typeof window === 'undefined') {
      this.isInitialized = true
      return
    }

    // Load existing logs from localStorage
    if (this.config.enableLocalStorage) {
      try {
        const stored = localStorage.getItem('auth_logs')
        if (stored) {
          this.logBuffer = JSON.parse(stored).slice(-this.config.maxLocalEntries)
        }
      } catch (error) {
        console.warn('Failed to load auth logs from localStorage:', error)
      }
    }

    // Set up periodic flush for remote logging
    if (this.config.enableRemoteLogging) {
      setInterval(() => this.flushLogs(), 30000) // Flush every 30 seconds
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs()
    })

    this.isInitialized = true
  }

  private shouldLog(level: AuthLogLevel): boolean {
    const levels = Object.values(AuthLogLevel)
    const currentIndex = levels.indexOf(this.config.logLevel)
    const requestedIndex = levels.indexOf(level)
    return requestedIndex >= currentIndex
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    if (!this.config.sanitizeData) {
      return metadata
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'csrf', 'session', 'refresh_token', 'access_token'
    ]

    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private createLogEntry(
    level: AuthLogLevel,
    eventType: AuthEventType,
    message: string,
    metadata: Record<string, any> = {}
  ): AuthLogEntry {
    const entry: AuthLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      eventType,
      message,
      sessionId: this.sessionId,
      metadata: this.sanitizeMetadata(metadata)
    }

    if (typeof window !== 'undefined') {
      if (this.config.includeUserAgent) {
        entry.userAgent = navigator.userAgent
      }
      
      if (this.config.includeLocation) {
        entry.referer = window.location.href
      }
    }

    return entry
  }

  private logToConsole(entry: AuthLogEntry): void {
    if (!this.config.enableConsoleLogging) return

    const style = this.getConsoleStyle(entry.level)
    const prefix = `[AUTH:${entry.eventType}]`
    
    switch (entry.level) {
      case AuthLogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.metadata)
        break
      case AuthLogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, entry.metadata)
        break
      case AuthLogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.metadata)
        break
      case AuthLogLevel.ERROR:
      case AuthLogLevel.CRITICAL:
        console.error(`${prefix} ${entry.message}`, entry.metadata)
        if (entry.errorStack) {
          console.error('Stack trace:', entry.errorStack)
        }
        break
    }
  }

  private getConsoleStyle(level: AuthLogLevel): string {
    switch (level) {
      case AuthLogLevel.DEBUG: return 'color: #888'
      case AuthLogLevel.INFO: return 'color: #007acc'
      case AuthLogLevel.WARN: return 'color: #ff8c00'
      case AuthLogLevel.ERROR: return 'color: #d73a49'
      case AuthLogLevel.CRITICAL: return 'color: #fff; background: #d73a49; padding: 2px 4px;'
      default: return ''
    }
  }

  private storeLocally(entry: AuthLogEntry): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return

    try {
      this.logBuffer.push(entry)
      
      // Keep only the most recent entries
      if (this.logBuffer.length > this.config.maxLocalEntries) {
        this.logBuffer = this.logBuffer.slice(-this.config.maxLocalEntries)
      }

      localStorage.setItem('auth_logs', JSON.stringify(this.logBuffer))
    } catch (error) {
      console.warn('Failed to store auth log locally:', error)
    }
  }

  private async flushLogs(): Promise<void> {
    if (!this.config.enableRemoteLogging || this.logBuffer.length === 0) return

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: this.logBuffer,
          sessionId: this.sessionId
        })
      })

      if (response.ok) {
        this.logBuffer = [] // Clear buffer after successful upload
      }
    } catch (error) {
      console.warn('Failed to flush auth logs to remote endpoint:', error)
    }
  }

  public log(
    level: AuthLogLevel,
    eventType: AuthEventType,
    message: string,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, eventType, message, metadata)
    
    this.logToConsole(entry)
    this.storeLocally(entry)

    // For critical errors, immediately attempt to flush
    if (level === AuthLogLevel.CRITICAL) {
      this.flushLogs()
    }
  }

  // Convenience methods
  public debug(eventType: AuthEventType, message: string, metadata?: Record<string, any>): void {
    this.log(AuthLogLevel.DEBUG, eventType, message, metadata)
  }

  public info(eventType: AuthEventType, message: string, metadata?: Record<string, any>): void {
    this.log(AuthLogLevel.INFO, eventType, message, metadata)
  }

  public warn(eventType: AuthEventType, message: string, metadata?: Record<string, any>): void {
    this.log(AuthLogLevel.WARN, eventType, message, metadata)
  }

  public error(eventType: AuthEventType, message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = {
      ...metadata,
      errorMessage: error?.message,
      errorStack: error?.stack
    }
    this.log(AuthLogLevel.ERROR, eventType, message, entry)
  }

  public critical(eventType: AuthEventType, message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = {
      ...metadata,
      errorMessage: error?.message,
      errorStack: error?.stack
    }
    this.log(AuthLogLevel.CRITICAL, eventType, message, entry)
  }

  // User session tracking
  public setUserId(userId: string): void {
    this.config = { ...this.config, userId }
  }

  public clearUserId(): void {
    this.config = { ...this.config, userId: undefined }
  }

  // Get logs for debugging or reporting
  public getLogs(eventType?: AuthEventType, level?: AuthLogLevel): AuthLogEntry[] {
    let logs = [...this.logBuffer]
    
    if (eventType) {
      logs = logs.filter(log => log.eventType === eventType)
    }
    
    if (level) {
      logs = logs.filter(log => log.level === level)
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  public clearLogs(): void {
    this.logBuffer = []
    if (typeof window !== 'undefined' && this.config.enableLocalStorage) {
      localStorage.removeItem('auth_logs')
    }
  }

  public exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2)
  }
}

// Create singleton instance
export const authLogger = new AuthLogger({
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteLogging: false, // Disable remote logging by default
  logLevel: process.env.NODE_ENV === 'development' ? AuthLogLevel.DEBUG : AuthLogLevel.INFO
})

// Export types and enums for external use
export { AuthLogger }
export type { AuthLogEntry, AuthLoggerConfig }