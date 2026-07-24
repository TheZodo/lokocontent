import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma'
import { ClerkService } from './clerk.service'
import { Role } from '@lokocontent/db'

@ApiTags('Webhooks - Clerk')
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkService: ClerkService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clerk user lifecycle webhook (user.created, user.updated, user.deleted)' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    // Validate required headers
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing required Svix headers')
    }

    // Get raw body for signature verification
    // Note: Requires raw body middleware to be configured in main.ts
    const payload =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

    // Verify webhook signature
    let event
    try {
      event = this.clerkService.verifyWebhook(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch (error) {
      this.logger.error('Webhook verification failed', error)
      throw new BadRequestException('Invalid webhook signature')
    }

    // Handle different event types
    try {
      switch (event.type) {
        case 'user.created':
          await this.handleUserCreated(event.data)
          break

        case 'user.updated':
          await this.handleUserUpdated(event.data)
          break

        case 'user.deleted':
          await this.handleUserDeleted(event.data)
          break

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`)
      }

      return { success: true }
    } catch (error) {
      this.logger.error(`Error handling webhook event ${event.type}`, error)
      throw new InternalServerErrorException('Failed to process webhook')
    }
  }

  /**
   * Handle user.created event from Clerk
   * Creates a new user in the database with default VIEWER role
   */
  private async handleUserCreated(data: {
    id: string
    email_addresses?: Array<{ id: string; email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
    primary_email_address_id?: string
  }) {
    const email = this.clerkService.extractPrimaryEmail(data)
    if (!email) {
      this.logger.error(`No email found for user ${data.id}`)
      return
    }

    const displayName = this.clerkService.buildDisplayName(data)
    const defaultRoles: Role[] = [Role.VIEWER]

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        id: data.id,
        email,
        analyticsViewerId: `viewer_${randomUUID()}`,
        displayName,
        profilePicture: data.image_url ?? null,
        roles: defaultRoles,
      },
    })

    this.logger.log(`Created user ${user.id} with email ${user.email}`)

    // Sync roles back to Clerk publicMetadata
    await this.clerkService.syncRolesToClerk(user.id, defaultRoles)
  }

  /**
   * Handle user.updated event from Clerk
   * Updates user profile information (email, name, profile picture)
   * Note: Roles are managed by the backend, not synced from Clerk
   */
  private async handleUserUpdated(data: {
    id: string
    email_addresses?: Array<{ id: string; email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
    primary_email_address_id?: string
  }) {
    const email = this.clerkService.extractPrimaryEmail(data)
    const displayName = this.clerkService.buildDisplayName(data)

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: data.id },
    })

    if (!existingUser) {
      // User doesn't exist, create them (edge case: webhook order)
      this.logger.warn(`User ${data.id} not found, creating...`)
      await this.handleUserCreated(data)
      return
    }

    // Update user profile info
    const updatedUser = await this.prisma.user.update({
      where: { id: data.id },
      data: {
        ...(email && { email }),
        ...(displayName && { displayName }),
        ...(data.image_url !== undefined && {
          profilePicture: data.image_url ?? null,
        }),
      },
    })

    this.logger.log(`Updated user ${updatedUser.id}`)
  }

  /**
   * Handle user.deleted event from Clerk
   * Soft-deletes or removes user from database
   */
  private async handleUserDeleted(data: { id: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: data.id },
    })

    if (!existingUser) {
      this.logger.warn(`User ${data.id} not found for deletion`)
      return
    }

    // Delete user (cascades to related records due to onDelete: Cascade)
    await this.prisma.user.delete({
      where: { id: data.id },
    })

    this.logger.log(`Deleted user ${data.id}`)
  }
}
