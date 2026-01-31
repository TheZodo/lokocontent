import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@lokocontent/db'
import { PrismaService } from '../../prisma'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * Guard that checks if the current user has the required roles
 * Fetches roles from the database (source of truth) rather than JWT claims
 * Requires ClerkAuthGuard to run first to populate request.auth
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const userId = request.auth?.userId

    // If no user ID, deny access
    if (!userId) {
      throw new ForbiddenException('Authentication required')
    }

    // Fetch user roles from database (source of truth)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    // Check if user has any of the required roles
    const hasRole = user.roles.some((role) => requiredRoles.includes(role))

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      )
    }

    return true
  }
}
