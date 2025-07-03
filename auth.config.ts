import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session when 24h old
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  // Rely on default cookie settings. Custom cookie names with "__Host-" prefix must always be secure, which breaks on HTTP localhost.
  // trustHost helps during local development behind proxies.
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (user && account) {
          token.id = user.id
          token.email = user.email
          token.name = user.name
          token.image = user.image
          token.accessToken = account?.access_token
          token.refreshToken = account?.refresh_token
          token.accessTokenExpires = account?.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000
        }

        // Return previous token if the access token has not expired yet
        if (Date.now() < (token.accessTokenExpires as number || 0)) {
          return token
        }

        // Access token has expired, try to update it
        // Note: GitHub OAuth tokens don't expire, but this is here for future providers
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return { ...token, error: 'RefreshTokenError' }
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.image = token.image as string
          session.accessToken = token.accessToken as string
          
          // Check for token errors
          if (token.error) {
            session.error = token.error as string
          }
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
    async signIn({ user }) {
      try {
        // Verify user has email
        if (!user?.email) {
          console.error('No email found for user')
          return false
        }

        // Add additional verification logic here if needed
        // For example, check if email domain is allowed
        
        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  debug: process.env.NODE_ENV === 'development',
  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',
}