import { Role } from '@lokocontent/db'

/**
 * Type for Clerk publicMetadata (synced with Prisma roles)
 */
export interface UserPublicMetadata {
  roles: Role[]
}

/**
 * Type for the auth object attached to requests after ClerkAuthGuard
 */
export interface RequestAuth {
  userId: string
  sessionId: string
  orgId?: string
  orgRole?: string
  orgSlug?: string
  metadata?: UserPublicMetadata
}

/**
 * Extend Express Request type to include auth
 */
declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth
    }
  }
}

/**
 * Clerk webhook event types we handle
 */
export type ClerkWebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'

/**
 * Clerk user data structure from webhooks
 */
export interface ClerkUserData {
  id: string
  email_addresses?: Array<{
    id: string
    email_address: string
  }>
  first_name?: string
  last_name?: string
  image_url?: string
  primary_email_address_id?: string
  public_metadata?: UserPublicMetadata
  private_metadata?: Record<string, unknown>
  unsafe_metadata?: Record<string, unknown>
}
