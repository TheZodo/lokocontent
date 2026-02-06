import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { HistoryService } from './history.service'
import { HistoryQueryDto } from './dto/history-query.dto'
import { UpdateHistoryDto } from './dto/update-history.dto'
import { ApiExceptionFilter } from './filters/api-exception.filter'

@ApiTags('History')
@Controller('history')
@UseGuards(ClerkAuthGuard)
@UseFilters(ApiExceptionFilter)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get watch history' })
  async getHistory(
    @CurrentUser() userId: string,
    @Query() query: HistoryQueryDto,
  ) {
    const { items, total, limit, offset } =
      await this.historyService.getHistory(userId, query)

    return {
      success: true,
      data: {
        data: items.map((item) => ({
          content: item.content,
          progress: item.progress,
          lastWatchedAt: item.lastWatchedAt,
        })),
        total,
      },
      meta: {
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      },
    }
  }

  @Post(':contentId')
  @ApiOperation({ summary: 'Update watch progress' })
  @HttpCode(HttpStatus.OK)
  async updateHistory(
    @CurrentUser() userId: string,
    @Param('contentId') contentId: string,
    @Body() dto: UpdateHistoryDto,
  ) {
    const result = await this.historyService.updateHistory(
      userId,
      contentId,
      dto,
    )

    return {
      success: true,
      data: result,
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Clear watch history' })
  async clearHistory(@CurrentUser() userId: string) {
    const result = await this.historyService.clearHistory(userId)

    return {
      success: true,
      data: result,
    }
  }

  @Delete(':contentId')
  @ApiOperation({ summary: 'Remove item from watch history' })
  async removeHistoryItem(
    @CurrentUser() userId: string,
    @Param('contentId') contentId: string,
  ) {
    const result = await this.historyService.removeHistoryItem(
      userId,
      contentId,
    )

    return {
      success: true,
      data: result,
    }
  }
}
