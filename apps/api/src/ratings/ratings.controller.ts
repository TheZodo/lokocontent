import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RatingsService } from './ratings.service'
import { RateContentDto } from './dto/rate-content.dto'
import { ApiExceptionFilter } from './filters/api-exception.filter'

@ApiTags('Ratings')
@Controller('ratings')
@UseGuards(ClerkAuthGuard)
@UseFilters(ApiExceptionFilter)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post(':contentId')
  @ApiOperation({ summary: 'Rate content' })
  @HttpCode(HttpStatus.OK)
  async rateContent(
    @CurrentUser() userId: string,
    @Param('contentId') contentId: string,
    @Body() dto: RateContentDto,
  ) {
    const result = await this.ratingsService.rateContent(
      userId,
      contentId,
      dto,
    )

    return {
      success: true,
      data: {
        averageRating: result.averageRating,
        ratingCount: result.ratingCount,
      },
    }
  }

  @Delete(':contentId')
  @ApiOperation({ summary: 'Remove rating' })
  async removeRating(
    @CurrentUser() userId: string,
    @Param('contentId') contentId: string,
  ) {
    const result = await this.ratingsService.removeRating(userId, contentId)

    return {
      success: true,
      data: result,
    }
  }
}
