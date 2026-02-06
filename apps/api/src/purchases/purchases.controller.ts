import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { PurchasesService } from './purchases.service'
import { CreatePurchaseDto } from './dto/create-purchase.dto'
import { MyPurchasesQueryDto } from './dto/my-purchases-query.dto'
import { ApiExceptionFilter } from './filters/api-exception.filter'

@ApiTags('Purchases')
@Controller('purchases')
@UseFilters(ApiExceptionFilter)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate content purchase' })
  async createPurchase(
    @CurrentUser() userId: string,
    @Body() dto: CreatePurchaseDto,
  ) {
    const result = await this.purchasesService.createPurchase(userId, dto)
    return {
      success: true,
      data: {
        purchaseId: result.purchaseId,
        checkoutUrl: result.checkoutUrl,
      },
    }
  }

  @Get('my-purchases')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's purchased content" })
  async getMyPurchases(
    @CurrentUser() userId: string,
    @Query() query: MyPurchasesQueryDto,
  ) {
    const { items, total, limit, offset } =
      await this.purchasesService.getMyPurchases(userId, query)
    return {
      success: true,
      data: {
        data: items,
        total,
      },
      meta: {
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      },
    }
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook (Lipila)' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (provider.toLowerCase() !== 'lipila') {
      throw new BadRequestException('Unsupported webhook provider')
    }
    await this.purchasesService.handleLipilaWebhook({
      referenceId: body.referenceId as string | undefined,
      status: body.status as string | undefined,
      amount: body.amount as number | undefined,
      identifier: body.identifier as string | undefined,
    })
    return { success: true }
  }
}
