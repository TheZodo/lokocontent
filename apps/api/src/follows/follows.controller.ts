import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { FollowsService } from './follows.service'
import { ApiExceptionFilter } from './filters/api-exception.filter'

@ApiTags('Follows')
@Controller('follows')
@UseGuards(ClerkAuthGuard)
@UseFilters(ApiExceptionFilter)
@ApiBearerAuth()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':creatorId')
  @ApiOperation({ summary: 'Follow a creator' })
  @HttpCode(HttpStatus.OK)
  async followCreator(
    @CurrentUser() userId: string,
    @Param('creatorId') creatorId: string,
  ) {
    const follow = await this.followsService.followCreator(userId, creatorId)
    return {
      success: true,
      data: follow,
    }
  }

  @Delete(':creatorId')
  @ApiOperation({ summary: 'Unfollow a creator' })
  async unfollowCreator(
    @CurrentUser() userId: string,
    @Param('creatorId') creatorId: string,
  ) {
    const result = await this.followsService.unfollowCreator(userId, creatorId)
    return {
      success: true,
      data: result,
    }
  }

  @Get('following')
  @ApiOperation({ summary: 'Get creators user is following' })
  async getFollowing(@CurrentUser() userId: string) {
    const { total, users } = await this.followsService.getFollowing(userId)
    return {
      success: true,
      data: {
        data: users,
        total,
      },
    }
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get followers for current user' })
  async getFollowers(@CurrentUser() userId: string) {
    const { total, users } = await this.followsService.getFollowers(userId)
    return {
      success: true,
      data: {
        data: users,
        total,
      },
    }
  }
}
