/**
 * JWT Secret Rotation Strategy
 * 
 * In production, you would implement a more sophisticated rotation strategy:
 * 1. Store secrets in a secure key management service (AWS KMS, Azure Key Vault, etc.)
 * 2. Implement automatic rotation on a schedule
 * 3. Keep old secrets for a grace period to validate existing tokens
 * 4. Use versioned secrets with timestamps
 */

interface JWTSecret {
  secret: string
  version: number
  createdAt: Date
  expiresAt: Date
}

export class JWTSecretManager {
  private secrets: JWTSecret[] = []
  
  constructor() {
    // Initialize with the current secret from environment
    if (process.env.NEXTAUTH_SECRET) {
      this.secrets.push({
        secret: process.env.NEXTAUTH_SECRET,
        version: 1,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      })
    }
  }

  /**
   * Get the current active secret for signing new tokens
   */
  getCurrentSecret(): string {
    const activeSecret = this.secrets.find(s => 
      s.expiresAt > new Date() && s.createdAt <= new Date()
    )
    return activeSecret?.secret || process.env.NEXTAUTH_SECRET || ''
  }

  /**
   * Get all valid secrets for token verification
   * Includes current and recently expired secrets for grace period
   */
  getValidationSecrets(): string[] {
    const gracePeriod = 7 * 24 * 60 * 60 * 1000 // 7 days
    const now = new Date()
    
    return this.secrets
      .filter(s => {
        const expiredTime = s.expiresAt.getTime() + gracePeriod
        return expiredTime > now.getTime()
      })
      .map(s => s.secret)
  }

  /**
   * Rotate to a new secret
   * In production, this would be called by a scheduled job
   */
  async rotateSecret(newSecret: string): Promise<void> {
    const latestVersion = Math.max(...this.secrets.map(s => s.version), 0)
    
    this.secrets.push({
      secret: newSecret,
      version: latestVersion + 1,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    })

    // Clean up very old secrets (beyond grace period)
    this.cleanupOldSecrets()
  }

  private cleanupOldSecrets(): void {
    const gracePeriod = 7 * 24 * 60 * 60 * 1000
    const cutoffDate = new Date(Date.now() - gracePeriod)
    
    this.secrets = this.secrets.filter(s => 
      s.expiresAt > cutoffDate
    )
  }
}

// Export a singleton instance
export const jwtSecretManager = new JWTSecretManager()

/**
 * Environment variable validation for production
 */
export function validateJWTConfiguration(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is required in production')
    }
    
    if (process.env.NEXTAUTH_SECRET.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters long')
    }
  }
}