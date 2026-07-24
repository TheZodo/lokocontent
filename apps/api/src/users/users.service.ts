import { ForbiddenException, Injectable } from '@nestjs/common'
import { Prisma, User } from '@lokocontent/db'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UpdateSettingsDto } from './dto/update-settings.dto'
import { UpdatePayoutDto } from './dto/update-payout.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    if (!user.analyticsViewerId) {
      user = await this.prisma.user.update({
        where: { id: userId },
        data: { analyticsViewerId: this.createAnalyticsViewerId() },
      })
    }

    return user
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : null),
        ...(dto.bio !== undefined ? { bio: dto.bio } : null),
        ...(dto.profilePicture !== undefined
          ? { profilePicture: dto.profilePicture }
          : null),
      },
    })

    return user
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.emailNotifications !== undefined
          ? { emailNotifications: dto.emailNotifications }
          : null),
        ...(dto.newFollowerNotifications !== undefined
          ? { newFollowerNotifications: dto.newFollowerNotifications }
          : null),
        ...(dto.contentUpdateNotifications !== undefined
          ? { contentUpdateNotifications: dto.contentUpdateNotifications }
          : null),
        ...(dto.earningsNotifications !== undefined
          ? { earningsNotifications: dto.earningsNotifications }
          : null),
        ...(dto.watchHistoryEnabled !== undefined
          ? { watchHistoryEnabled: dto.watchHistoryEnabled }
          : null),
      },
    })

    return user
  }

  async updatePayout(userId: string, dto: UpdatePayoutDto): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        payoutMethod: dto.payoutMethod,
        payoutDetails:
          dto.payoutDetails != null
            ? (dto.payoutDetails as Prisma.InputJsonValue)
            : undefined,
      },
    })

    return user
  }

  private createAnalyticsViewerId() {
    return `viewer_${randomUUID()}`
  }
}
