import { Injectable, Logger } from '@nestjs/common'
import { createClerkClient } from '@clerk/backend'
import { Role } from '@lokocontent/db'
import { Webhook } from 'svix'

export interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{
      id: string
      email_address: string
    }>
    first_name?: string
    last_name?: string
    image_url?: string
    primary_email_address_id?: string
    [key: string]: unknown
  }
}

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name)
  private readonly clerkClient

  constructor() {
    this.clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  }

  /**
   * Sync user roles to Clerk publicMetadata
   * Call this whenever roles change in the database
   */
  async syncRolesToClerk(userId: string, roles: Role[]): Promise<void> {
    try {
      await this.clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { roles },
      })
      this.logger.log(
        `Synced roles ${roles.join(', ')} to Clerk for user ${userId}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to sync roles to Clerk for user ${userId}`,
        error,
      )
      throw error
    }
  }

  /**
   * Get user from Clerk by ID
   */
  async getUser(userId: string) {
    try {
      return await this.clerkClient.users.getUser(userId)
    } catch (error) {
      this.logger.error(`Failed to get user ${userId} from Clerk`, error)
      throw error
    }
  }

  /**
   * Verify Clerk webhook signature using Svix
   * @param payload - Raw request body as string
   * @param headers - Request headers containing svix signature
   * @returns Verified webhook event or throws error
   */
  verifyWebhook(
    payload: string,
    headers: {
      'svix-id': string
      'svix-timestamp': string
      'svix-signature': string
    },
  ): ClerkWebhookEvent {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET is not configured')
    }

    const wh = new Webhook(webhookSecret)

    console.log('malaizyo payload', payload)

    console.log('malaizyo headers', headers)

    console.log('malaizyo webhookSecret', webhookSecret)

    try {
      const event = wh.verify(payload, {
        'svix-id': headers['svix-id'],
        'svix-timestamp': headers['svix-timestamp'],
        'svix-signature': headers['svix-signature'],
      }) as ClerkWebhookEvent

      this.logger.log(`Verified webhook event: ${event.type}`)
      return event
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', error)
      throw error
    }
  }

  /**
   * Extract primary email from Clerk user data
   */
  extractPrimaryEmail(userData: ClerkWebhookEvent['data']): string | null {
    if (!userData.email_addresses || !userData.primary_email_address_id) {
      return null
    }

    const primaryEmail = userData.email_addresses.find(
      (email) => email.id === userData.primary_email_address_id,
    )

    return primaryEmail?.email_address ?? null
  }

  /**
   * Build display name from Clerk user data
   */
  buildDisplayName(userData: ClerkWebhookEvent['data']): string | null {
    const parts = [userData.first_name, userData.last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : null
  }
}
