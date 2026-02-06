import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { HistoryQueryDto } from './dto/history-query.dto'
import { UpdateHistoryDto } from './dto/update-history.dto'

const DEFAULT_LIMIT = 20

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(userId: string, query: HistoryQueryDto) {
    const watchHistoryEnabled = await this.ensureWatchHistoryEnabled(userId)

    if (!watchHistoryEnabled) {
      return {
        items: [],
        total: 0,
        limit: query.limit ?? DEFAULT_LIMIT,
        offset: query.offset ?? 0,
      }
    }

    const take = query.limit ?? DEFAULT_LIMIT
    const skip = query.offset ?? 0

    const [total, items] = await this.prisma.$transaction([
      this.prisma.watchHistory.count({
        where: { userId },
      }),
      this.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { lastWatchedAt: 'desc' },
        take,
        skip,
        include: {
          content: true,
        },
      }),
    ])

    return { total, items, limit: take, offset: skip }
  }

  async updateHistory(userId: string, contentId: string, dto: UpdateHistoryDto) {
    const watchHistoryEnabled = await this.ensureWatchHistoryEnabled(userId)

    if (!watchHistoryEnabled) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'WATCH_HISTORY_DISABLED',
            message: 'Watch history is disabled',
          },
        },
        HttpStatus.FORBIDDEN,
      )
    }

    await this.prisma.watchHistory.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      update: {
        progress: dto.progress,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        contentId,
        progress: dto.progress,
        lastWatchedAt: new Date(),
      },
    })

    return { success: true }
  }

  async clearHistory(userId: string) {
    await this.prisma.watchHistory.deleteMany({
      where: { userId },
    })

    return { success: true }
  }

  async removeHistoryItem(userId: string, contentId: string) {
    await this.prisma.watchHistory.deleteMany({
      where: { userId, contentId },
    })

    return { success: true }
  }

  private async ensureWatchHistoryEnabled(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { watchHistoryEnabled: true },
    })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    return user.watchHistoryEnabled
  }
}
