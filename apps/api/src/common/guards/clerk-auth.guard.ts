import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { createClerkClient, verifyToken } from '@clerk/clerk-sdk-node'

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
      // Verify the JWT token with Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })

      // Attach auth data to request for downstream use
      request.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        orgId: payload.org_id,
        orgRole: payload.org_role,
        orgSlug: payload.org_slug,
        // Include public metadata if present (contains roles)
        metadata: payload.metadata,
      }

      return true
    } catch (error) {
      this.logger.error('JWT verification failed', error)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
