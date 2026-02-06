import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RateContentDto } from './dto/rate-content.dto'

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async rateContent(userId: string, contentId: string, dto: RateContentDto) {
    const content = await this.prisma.videoContent.findFirst({
      where: { id: contentId, deletedAt: null },
    })

    if (!content) {
      throw new NotFoundException('Content not found')
    }

    if (content.creatorId === userId) {
      throw new ForbiddenException('Cannot rate your own content')
    }

    const rating = await this.prisma.rating.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      create: {
        userId,
        contentId,
        rating: dto.rating,
      },
      update: {
        rating: dto.rating,
      },
    })

    const { averageRating, ratingCount } =
      await this.recomputeContentRatings(contentId)

    return {
      rating,
      averageRating,
      ratingCount,
    }
  }

  async removeRating(userId: string, contentId: string) {
    const content = await this.prisma.videoContent.findFirst({
      where: { id: contentId, deletedAt: null },
      select: { id: true },
    })

    if (!content) {
      throw new NotFoundException('Content not found')
    }

    await this.prisma.rating.deleteMany({
      where: {
        userId,
        contentId,
      },
    })

    const { averageRating, ratingCount } =
      await this.recomputeContentRatings(contentId)

    return { averageRating, ratingCount }
  }

  private async recomputeContentRatings(contentId: string) {
    const [aggregate, count] = await this.prisma.$transaction([
      this.prisma.rating.aggregate({
        where: { contentId },
        _avg: { rating: true },
      }),
      this.prisma.rating.count({
        where: { contentId },
      }),
    ])

    const averageRating = aggregate._avg.rating ?? 0
    const ratingCount = count

    await this.prisma.videoContent.update({
      where: { id: contentId },
      data: {
        rating: averageRating,
        ratingCount,
      },
    })

    return { averageRating, ratingCount }
  }
}
