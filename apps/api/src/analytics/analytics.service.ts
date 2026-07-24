import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EarningsQueryDto } from './dto/earnings-query.dto'
import { PurchaseStatus } from '@lokocontent/db'
import { UsageService } from '../usage'

const PERIOD_CONFIG = {
  week: { days: 7, label: 'day' as const },
  month: { days: 30, label: 'day' as const },
  year: { days: 12, label: 'month' as const },
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
  ) {}

  async getOverview(userId: string) {
    const [contentAgg, earningsAgg, followersCount, ratingsAgg] =
      await this.prisma.$transaction([
        this.prisma.videoContent.aggregate({
          where: { creatorId: userId, deletedAt: null },
          _sum: { views: true },
          _count: { _all: true },
        }),
        this.prisma.purchase.aggregate({
          where: {
            status: PurchaseStatus.COMPLETED,
            content: { creatorId: userId, deletedAt: null },
          },
          _sum: { creatorEarnings: true },
        }),
        this.prisma.follow.count({
          where: { followingId: userId },
        }),
        this.prisma.rating.aggregate({
          where: {
            content: { creatorId: userId, deletedAt: null },
          },
          _avg: { rating: true },
        }),
      ])

    const usage = await this.usageService.getCreatorOverviewUsage(userId)

    return {
      totalViews: contentAgg._sum.views ?? 0,
      settledViews: usage.settledViews,
      provisionalViews: usage.provisionalViews,
      liveViewers: usage.liveViewers,
      watchMinutes: usage.watchMinutes,
      playingMinutes: usage.playingMinutes,
      lastAnalyticsSyncAt: usage.lastAnalyticsSyncAt,
      totalEarnings: earningsAgg._sum.creatorEarnings ?? 0,
      totalContent: contentAgg._count._all ?? 0,
      averageRating: ratingsAgg._avg.rating ?? 0,
      followersCount,
    }
  }

  async getEarnings(userId: string, query: EarningsQueryDto) {
    const config = PERIOD_CONFIG[query.period]
    const now = new Date()
    const start = new Date(now)

    if (query.period === 'year') {
      start.setMonth(start.getMonth() - (config.days - 1), 1)
      start.setHours(0, 0, 0, 0)
    } else {
      start.setDate(start.getDate() - (config.days - 1))
      start.setHours(0, 0, 0, 0)
    }

    const purchases = await this.prisma.purchase.findMany({
      where: {
        status: PurchaseStatus.COMPLETED,
        createdAt: { gte: start },
        content: { creatorId: userId, deletedAt: null },
      },
      select: {
        creatorEarnings: true,
        createdAt: true,
      },
    })

    const buckets = this.buildBuckets(start, query.period)

    purchases.forEach((purchase) => {
      const key = this.formatBucketKey(purchase.createdAt, query.period)
      const entry = buckets.get(key)
      if (entry) {
        entry.amount += purchase.creatorEarnings
        entry.purchases += 1
      }
    })

    const data = Array.from(buckets.values())
    const total = data.reduce((sum, entry) => sum + entry.amount, 0)

    return { data, total }
  }

  async getUsage(
    userId: string,
    query: { period?: 'day' | 'week' | 'month' | 'year' },
  ) {
    return this.usageService.getCreatorUsage(userId, query.period ?? 'month')
  }

  private buildBuckets(start: Date, period: 'week' | 'month' | 'year') {
    const buckets = new Map<string, { date: string; amount: number; purchases: number }>()

    const days = period === 'year' ? PERIOD_CONFIG.year.days : PERIOD_CONFIG[period].days
    const useMonths = period === 'year'

    for (let i = 0; i < days; i += 1) {
      const bucketDate = new Date(start)
      if (useMonths) {
        bucketDate.setMonth(start.getMonth() + i, 1)
      } else {
        bucketDate.setDate(start.getDate() + i)
      }
      const key = this.formatBucketKey(bucketDate, period)
      buckets.set(key, {
        date: key,
        amount: 0,
        purchases: 0,
      })
    }

    return buckets
  }

  private formatBucketKey(date: Date, period: 'week' | 'month' | 'year') {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    if (period === 'year') {
      return `${year}-${month}`
    }
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
