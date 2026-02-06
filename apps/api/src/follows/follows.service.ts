import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async followCreator(userId: string, creatorId: string) {
    if (userId === creatorId) {
      throw new ForbiddenException('Cannot follow yourself')
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    const follow = await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: creatorId,
        },
      },
      create: {
        followerId: userId,
        followingId: creatorId,
      },
      update: {},
    })

    return follow
  }

  async unfollowCreator(userId: string, creatorId: string) {
    await this.prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: creatorId,
      },
    })

    return { success: true }
  }

  async getFollowing(userId: string) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
      this.prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          following: true,
        },
      }),
    ])

    return {
      total,
      users: items.map((item) => item.following),
    }
  }

  async getFollowers(userId: string) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          follower: true,
        },
      }),
    ])

    return {
      total,
      users: items.map((item) => item.follower),
    }
  }
}
