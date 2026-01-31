/**
 * Clerk type extensions for Lokocontent
 * These types ensure TypeScript safety when accessing Clerk metadata
 */

export {}

declare global {
  /**
   * Extend Clerk's session claims to include our custom metadata
   * This is populated via Clerk Dashboard > Sessions > Customize session token
   * with: { "metadata": "{{user.public_metadata}}" }
   */
  interface CustomJwtSessionClaims {
    metadata?: {
      roles?: ('VIEWER' | 'CREATOR' | 'ADMIN')[]
    }
  }
}

/**
 * User public metadata structure (stored in Clerk, synced from database)
 */
export interface UserPublicMetadata {
  roles: ('VIEWER' | 'CREATOR' | 'ADMIN')[]
}

/**
 * Helper type for role checking
 */
export type UserRole = 'VIEWER' | 'CREATOR' | 'ADMIN'

/**
 * Helper function types for role checks
 */
export interface RoleHelpers {
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isCreator: () => boolean
  isAdmin: () => boolean
}
