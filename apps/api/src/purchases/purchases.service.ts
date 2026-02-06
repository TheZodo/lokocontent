import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ContentStatus, PaymentProvider, PurchaseStatus } from '@lokocontent/db'
import { PrismaService } from '../prisma/prisma.service'
import { LipilaService } from './lipila.service'
import { CreatePurchaseDto, LipilaPaymentMethod } from './dto/create-purchase.dto'
import { MyPurchasesQueryDto } from './dto/my-purchases-query.dto'

const DEFAULT_LIMIT = 20
const PLATFORM_FEE_RATE = 0.15
const CREATOR_EARNINGS_RATE = 0.85

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly lipila: LipilaService,
  ) {}

  async createPurchase(
    userId: string,
    dto: CreatePurchaseDto,
  ): Promise<{ purchaseId: string; checkoutUrl: string | null }> {
    const content = await this.prisma.videoContent.findFirst({
      where: {
        id: dto.contentId,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    })

    if (!content) {
      throw new NotFoundException('Content not found')
    }
    if (!content.isPremium || content.price == null || content.price <= 0) {
      throw new BadRequestException('Content is not available for purchase')
    }

    const existing = await this.prisma.purchase.findUnique({
      where: {
        userId_contentId: { userId, contentId: dto.contentId },
      },
    })

    if (existing) {
      if (existing.status === PurchaseStatus.COMPLETED) {
        throw new ConflictException('Content already purchased')
      }
      if (
        existing.status === PurchaseStatus.PENDING &&
        dto.paymentProvider === PaymentProvider.LIPILA
      ) {
        return this.getCheckoutForPendingPurchase(
          userId,
          existing.id,
          dto.contentId,
          content.price,
          content.title,
          dto.paymentMethod!,
          dto.phoneNumber,
        )
      }
      throw new ConflictException(
        'A pending purchase already exists for this content',
      )
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        contentId: dto.contentId,
        amount: content.price,
        platformFee: 0,
        creatorEarnings: 0,
        paymentProvider: dto.paymentProvider,
        paymentId: 'PENDING',
        status: PurchaseStatus.PENDING,
      },
    })

    if (dto.paymentProvider === PaymentProvider.LIPILA) {
      const checkoutUrl = await this.initiateLipilaCollection(
        userId,
        purchase.id,
        content.price,
        content.title,
        dto.paymentMethod!,
        dto.phoneNumber,
      )
      return { purchaseId: purchase.id, checkoutUrl }
    }

    throw new BadRequestException(
      'Only Lipila is supported; use paymentProvider LIPILA',
    )
  }

  private async getCheckoutForPendingPurchase(
    userId: string,
    purchaseId: string,
    contentId: string,
    amount: number,
    title: string,
    paymentMethod: LipilaPaymentMethod,
    phoneNumber?: string,
  ): Promise<{ purchaseId: string; checkoutUrl: string | null }> {
    const checkoutUrl = await this.initiateLipilaCollection(
      userId,
      purchaseId,
      amount,
      title,
      paymentMethod,
      phoneNumber,
    )
    return { purchaseId, checkoutUrl }
  }

  private async initiateLipilaCollection(
    userId: string,
    referenceId: string,
    amountUsd: number,
    narration: string,
    paymentMethod: LipilaPaymentMethod,
    phoneNumber?: string,
  ): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    })

    const amountZMW = this.lipila.getAmountInZMW(amountUsd)
    const frontendUrl =
      process.env.FRONTEND_URL ?? 'https://lokocontent.io'
    const redirectUrl = `${frontendUrl}/purchase/success`
    const backUrl = `${frontendUrl}/purchase/cancel`

    const placeholder = process.env.LIPILA_PLACEHOLDER_PHONE ?? '260000000000'
    const placeholderAddress =
      process.env.LIPILA_PLACEHOLDER_ADDRESS ?? 'Not provided'
    const placeholderCity = process.env.LIPILA_PLACEHOLDER_CITY ?? 'Lusaka'
    const placeholderCountry = process.env.LIPILA_PLACEHOLDER_COUNTRY ?? 'ZM'
    const placeholderZip = process.env.LIPILA_PLACEHOLDER_ZIP ?? '10101'

    const nameParts = (user?.displayName ?? 'Customer').trim().split(/\s+/)
    const firstName = nameParts[0] ?? 'Customer'
    const lastName = nameParts.slice(1).join(' ') || 'User'
    const email = user?.email ?? 'customer@lokocontent.io'

    if (paymentMethod === 'card') {
      const res = await this.lipila.createCardCollection(
        {
          firstName,
          lastName,
          phoneNumber: placeholder,
          city: placeholderCity,
          country: placeholderCountry,
          address: placeholderAddress,
          zip: placeholderZip,
          email,
        },
        {
          referenceId,
          amount: amountZMW,
          narration: `Purchase: ${narration}`,
          accountNumber: placeholder,
          currency: 'ZMW',
          backUrl,
          redirectUrl,
        },
      )
      return res.cardRedirectionUrl
    }

    if (paymentMethod === 'mobile_money') {
      if (!phoneNumber) {
        throw new BadRequestException(
          'phoneNumber is required for Lipila mobile money',
        )
      }
      const res = await this.lipila.createMobileMoneyCollection({
        referenceId,
        amount: amountZMW,
        narration: `Purchase: ${narration}`,
        accountNumber: phoneNumber,
        currency: 'ZMW',
        email,
      })
      return res.cardRedirectionUrl ?? null
    }

    return null
  }

  async getMyPurchases(userId: string, query: MyPurchasesQueryDto) {
    const take = query.limit ?? DEFAULT_LIMIT
    const skip = query.offset ?? 0

    const where = {
      userId,
      status: PurchaseStatus.COMPLETED,
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { content: true },
      }),
    ])

    return { items, total, limit: take, offset: skip }
  }

  async handleLipilaWebhook(body: {
    referenceId?: string
    status?: string
    amount?: number
    identifier?: string
  }): Promise<void> {
    const { referenceId, status, amount } = body

    if (!referenceId) {
      this.logger.warn('Lipila webhook missing referenceId')
      throw new BadRequestException('Missing referenceId')
    }

    const successStatuses = ['Success', 'SUCCESS', 'success']
    if (!status || !successStatuses.includes(status)) {
      this.logger.log(`Lipila webhook non-success status: ${status}`)
      return
    }

    const purchase = await this.prisma.purchase.findUnique({
      where: { id: referenceId },
    })

    if (!purchase) {
      this.logger.warn(`Lipila webhook unknown referenceId: ${referenceId}`)
      return
    }

    if (purchase.status === PurchaseStatus.COMPLETED) {
      return
    }

    const amountPaid = amount ?? purchase.amount
    const platformFee = Math.round(amountPaid * PLATFORM_FEE_RATE * 100) / 100
    const creatorEarnings =
      Math.round(amountPaid * CREATOR_EARNINGS_RATE * 100) / 100

    await this.prisma.purchase.update({
      where: { id: referenceId },
      data: {
        status: PurchaseStatus.COMPLETED,
        platformFee,
        creatorEarnings,
        ...(body.identifier && { paymentId: body.identifier }),
      },
    })

    this.logger.log(`Purchase ${referenceId} completed via Lipila webhook`)
  }
}
