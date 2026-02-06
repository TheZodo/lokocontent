import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Role } from '@lokocontent/db'
import { PrismaService } from '../../prisma'
import { ClerkService } from '../../clerk/clerk.service'

@Injectable()
export class EnsureCreatorRoleGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkService: ClerkService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const userId = request.auth?.userId

    if (!userId) {
      throw new ForbiddenException('Authentication required')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    if (user.roles.includes(Role.ADMIN) || user.roles.includes(Role.CREATOR)) {
      return true
    }

    const nextRoles = [...new Set([...user.roles, Role.CREATOR])]

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: nextRoles,
        },
      },
    })

    await this.clerkService.syncRolesToClerk(userId, nextRoles)

    return true
  }
}
