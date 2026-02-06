import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { verifyToken } from '@clerk/backend'
import type { RequestAuth } from '../types/clerk.types'

/**
 * Guard that validates Clerk JWT tokens
 * Populates request.auth with the validated session data
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Extract token from Authorization header
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      // Verify the JWT token with Clerk Backend SDK
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })

      if (!payload) {
        throw new UnauthorizedException('Invalid or expired token')
      }

      // Attach auth data to request for downstream use
      const sessionPayload = payload as {
        sub: string
        sid?: string
        org_id?: string
        org_role?: string
        org_slug?: string
        metadata?: { roles?: string[] }
      }
      request.auth = {
        userId: sessionPayload.sub,
        sessionId: sessionPayload.sid,
        orgId: sessionPayload.org_id,
        orgRole: sessionPayload.org_role,
        orgSlug: sessionPayload.org_slug,
        metadata: sessionPayload.metadata as RequestAuth['metadata'],
      }

      return true
    } catch (error) {
      this.logger.error('JWT verification failed', error)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
