import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { verifyToken } from '@clerk/backend'
import { Request } from 'express'
import { ContentStatus, PurchaseStatus, Role } from '@lokocontent/db'
import { PrismaService } from '../prisma/prisma.service'
import {
  ContentListQueryDto,
  ContentSearchQueryDto,
} from './dto/content-query.dto'
import {
  AnalyzeChangesDto,
  CreateContentDto,
  MyUploadsQueryDto,
  UpdateContentDto,
} from './dto/content-management.dto'
import { ContentAnalysisService } from './content-analysis.service'

const DEFAULT_LIMIT = 20

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: ContentAnalysisService,
  ) {}

  async getFeatured() {
    return this.prisma.videoContent.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      orderBy: [{ views: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    })
  }

  async getTrending(query: ContentListQueryDto) {
    const { take, skip } = this.getPagination(query)
    const where = this.buildContentWhere(query)

    const [total, items] = await this.prisma.$transaction([
      this.prisma.videoContent.count({ where }),
      this.prisma.videoContent.findMany({
        where,
        orderBy: [{ views: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
      }),
    ])

    return { total, items, limit: take, offset: skip }
  }

  async getNewReleases(query: ContentListQueryDto) {
    const { take, skip } = this.getPagination(query)
    const where = this.buildContentWhere(query)

    const [total, items] = await this.prisma.$transaction([
      this.prisma.videoContent.count({ where }),
      this.prisma.videoContent.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
      }),
    ])

    return { total, items, limit: take, offset: skip }
  }

  async searchContent(query: ContentSearchQueryDto) {
    const { take, skip } = this.getPagination(query)
    const where = this.buildContentWhere(query)
    const orderBy = this.getSearchOrderBy(query.sortBy)

    const [total, items] = await this.prisma.$transaction([
      this.prisma.videoContent.count({ where }),
      this.prisma.videoContent.findMany({
        where,
        orderBy: orderBy as any,
        take,
        skip,
      }),
    ])

    return { total, items, limit: take, offset: skip }
  }

  async getContentById(id: string, request: Request) {
    const content = await this.prisma.videoContent.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            profilePicture: true,
          },
        },
      },
    })

    if (!content) {
      return null
    }

    const userId = await this.getOptionalUserId(request)
    if (!userId) {
      return content
    }

    const [purchase, rating] = await Promise.all([
      this.prisma.purchase.findFirst({
        where: {
          userId,
          contentId: id,
          status: PurchaseStatus.COMPLETED,
        },
      }),
      this.prisma.rating.findUnique({
        where: {
          userId_contentId: {
            userId,
            contentId: id,
          },
        },
      }),
    ])

    return {
      ...content,
      isOwned: Boolean(purchase),
      userRating: rating?.rating ?? null,
    }
  }

  async createContent(userId: string, dto: CreateContentDto) {
    return this.prisma.videoContent.create({
      data: {
        creatorId: userId,
        title: dto.title,
        synopsis: dto.synopsis,
        region: dto.region,
        category: dto.category,
        isPremium: dto.isPremium,
        price: dto.isPremium ? (dto.price ?? null) : null,
        releaseYear: dto.releaseYear,
        muxAssetId: dto.muxAssetId,
        muxPlaybackId: dto.muxPlaybackId,
        trailerMuxAssetId: dto.trailerMuxAssetId,
        trailerMuxPlaybackId: dto.trailerMuxPlaybackId,
        thumbnail: dto.thumbnailUrl,
        status: dto.status,
      },
    })
  }

  async getMyUploads(userId: string, query: MyUploadsQueryDto) {
    const { limit, offset, sortBy, status } = query
    const take = limit ?? DEFAULT_LIMIT
    const skip = offset ?? 0

    const where = {
      creatorId: userId,
      deletedAt: null,
      ...(status ? { status } : null),
    }

    if (sortBy === 'earnings') {
      const items = await this.prisma.videoContent.findMany({
        where,
      })

      const contentIds = items.map((item) => item.id)
      const earningsMap = await this.getEarningsMap(contentIds)

      const withEarnings = items.map((item) => ({
        ...item,
        earnings: earningsMap.get(item.id) ?? 0,
      }))

      withEarnings.sort((a, b) => {
        if (b.earnings !== a.earnings) {
          return b.earnings - a.earnings
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      const paged = withEarnings.slice(skip, skip + take)
      const totalViews = withEarnings.reduce((sum, item) => sum + item.views, 0)
      const totalEarnings = withEarnings.reduce(
        (sum, item) => sum + item.earnings,
        0,
      )

      return {
        total: withEarnings.length,
        items: paged,
        totalViews,
        totalEarnings,
        limit: take,
        offset: skip,
      }
    }

    const orderBy =
      sortBy === 'views'
        ? [{ views: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }]

    const [total, items, viewsAggregate, earningsAggregate] =
      await this.prisma.$transaction([
        this.prisma.videoContent.count({ where }),
        this.prisma.videoContent.findMany({
          where,
          orderBy: orderBy as any,
          take,
          skip,
        }),
        this.prisma.videoContent.aggregate({
          where,
          _sum: { views: true },
        }),
        this.prisma.purchase.aggregate({
          where: {
            status: PurchaseStatus.COMPLETED,
            content: {
              creatorId: userId,
              deletedAt: null,
              ...(status ? { status } : null),
            },
          },
          _sum: { creatorEarnings: true },
        }),
      ])

    const earningsMap = await this.getEarningsMap(items.map((item) => item.id))

    return {
      total,
      items: items.map((item) => ({
        ...item,
        earnings: earningsMap.get(item.id) ?? 0,
      })),
      totalViews: viewsAggregate._sum.views ?? 0,
      totalEarnings: earningsAggregate._sum.creatorEarnings ?? 0,
      limit: take,
      offset: skip,
    }
  }

  async updateContent(userId: string, id: string, dto: UpdateContentDto) {
    const content = await this.assertContentOwner(userId, id)

    return this.prisma.videoContent.update({
      where: { id: content.id },
      data: {
        ...(dto.title ? { title: dto.title } : null),
        ...(dto.synopsis ? { synopsis: dto.synopsis } : null),
        ...(dto.region ? { region: dto.region } : null),
        ...(dto.category ? { category: dto.category } : null),
        ...(dto.thumbnailUrl ? { thumbnail: dto.thumbnailUrl } : null),
        ...(dto.status ? { status: dto.status } : null),
      },
    })
  }

  async deleteContent(userId: string, id: string) {
    const content = await this.assertContentOwner(userId, id)

    await this.prisma.videoContent.update({
      where: { id: content.id },
      data: {
        status: ContentStatus.HIDDEN,
        deletedAt: new Date(),
      },
    })

    return { success: true }
  }

  async analyzeChanges(userId: string, id: string, dto: AnalyzeChangesDto) {
    const content = await this.assertContentOwner(userId, id)

    const prompt = `Current content:\n${JSON.stringify(
      {
        title: content.title,
        synopsis: content.synopsis,
        region: content.region,
        category: content.category,
      },
      null,
      2,
    )}\n\nProposed changes:\n${JSON.stringify(dto, null, 2)}`

    const warnings = await this.analysisService.analyze(prompt)

    return { warnings }
  }

  private async getEarningsMap(contentIds: string[]) {
    if (contentIds.length === 0) {
      return new Map<string, number>()
    }

    const grouped = await this.prisma.purchase.groupBy({
      by: ['contentId'],
      where: {
        contentId: { in: contentIds },
        status: PurchaseStatus.COMPLETED,
      },
      _sum: { creatorEarnings: true },
    })

    return new Map(
      grouped.map((entry) => [
        entry.contentId,
        entry._sum.creatorEarnings ?? 0,
      ]),
    )
  }

  private async assertContentOwner(userId: string, contentId: string) {
    const content = await this.prisma.videoContent.findFirst({
      where: {
        id: contentId,
        deletedAt: null,
      },
    })

    if (!content) {
      throw new NotFoundException('Content not found')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    const isAdmin = user.roles.includes(Role.ADMIN)
    const isOwner = content.creatorId === userId

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Not allowed to manage this content')
    }

    return content
  }

  private getPagination(query: { limit?: number; offset?: number }) {
    const take = query.limit ?? DEFAULT_LIMIT
    const skip = query.offset ?? 0

    return { take, skip }
  }

  private buildContentWhere(query: {
    region?: string
    category?: string
    isPremium?: boolean
    q?: string
  }) {
    const where: Record<string, any> = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    }

    if (query.region && query.region !== 'all') {
      where.region = query.region
    }

    if (query.category && query.category !== 'all') {
      where.category = query.category
    }

    if (typeof query.isPremium === 'boolean') {
      where.isPremium = query.isPremium
    }

    if (query.q) {
      where.OR = [
        {
          title: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          synopsis: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          creator: {
            displayName: {
              contains: query.q,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    return where
  }

  private getSearchOrderBy(sortBy?: 'recent' | 'views' | 'rating') {
    if (sortBy === 'views') {
      return [{ views: 'desc' }, { createdAt: 'desc' }]
    }

    if (sortBy === 'rating') {
      return [
        { rating: 'desc' },
        { ratingCount: 'desc' },
        { createdAt: 'desc' },
      ]
    }

    return [{ createdAt: 'desc' }]
  }

  private async getOptionalUserId(request: Request) {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    if (!token) {
      return null
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })

      return payload?.sub ?? null
    } catch {
      return null
    }
  }
}
