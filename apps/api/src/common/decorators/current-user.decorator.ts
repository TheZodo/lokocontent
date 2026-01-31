import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Decorator to extract the current user ID from the request
 * Requires ClerkAuthGuard to be applied first
 * @example
 * @Get('profile')
 * async getProfile(@CurrentUser() userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest()
    return request.auth?.userId ?? null
  },
)
