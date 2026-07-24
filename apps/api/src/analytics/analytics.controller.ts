import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Role } from '@lokocontent/db'
import { AnalyticsService } from './analytics.service'
import { EarningsQueryDto } from './dto/earnings-query.dto'
import { UsageQueryDto } from './dto/usage-query.dto'
import { ApiExceptionFilter } from './filters/api-exception.filter'

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.CREATOR, Role.ADMIN)
@UseFilters(ApiExceptionFilter)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get creator analytics overview' })
  async getOverview(@CurrentUser() userId: string) {
    const overview = await this.analyticsService.getOverview(userId)
    return {
      success: true,
      data: overview,
    }
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get creator earnings breakdown' })
  async getEarnings(
    @CurrentUser() userId: string,
    @Query() query: EarningsQueryDto,
  ) {
    const earnings = await this.analyticsService.getEarnings(userId, query)
    return {
      success: true,
      data: earnings,
    }
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get creator usage and watch-minute breakdown' })
  async getUsage(
    @CurrentUser() userId: string,
    @Query() query: UsageQueryDto,
  ) {
    const usage = await this.analyticsService.getUsage(userId, query)
    return {
      success: true,
      data: usage,
    }
  }
}
