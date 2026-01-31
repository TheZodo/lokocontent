import { SetMetadata } from '@nestjs/common'
import { Role } from '@lokocontent/db'

export const ROLES_KEY = 'roles'

/**
 * Decorator to specify which roles are allowed to access a route
 * @param roles - Array of roles that can access the route
 * @example
 * @Roles(Role.CREATOR, Role.ADMIN)
 * @Post('content')
 * async createContent() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
