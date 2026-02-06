import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  HttpException,
  HttpStatus,
  UseFilters,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { ContentService } from './content.service'
import { ContentListQueryDto, ContentSearchQueryDto } from './dto/content-query.dto'
import { ApiExceptionFilter } from './filters/api-exception.filter'
import {
  AnalyzeChangesDto,
  CreateContentDto,
  MyUploadsQueryDto,
  UpdateContentDto,
} from './dto/content-management.dto'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '@lokocontent/db'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { EnsureCreatorRoleGuard } from './guards/ensure-creator.guard'

@ApiTags('Content')
@Controller('content')
@UseFilters(ApiExceptionFilter)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('featured')
  @ApiOperation({ summary: 'Get featured content (limit 5)' })
  async getFeatured() {
    const items = await this.contentService.getFeatured()
    return {
      success: true,
      data: items,
    }
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending content' })
  async getTrending(@Query() query: ContentListQueryDto) {
    const { items, total, limit, offset } =
      await this.contentService.getTrending(query)

    return {
      success: true,
      data: { data: items, total },
      meta: {
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      },
    }
  }

  @Get('new-releases')
  @ApiOperation({ summary: 'Get new releases' })
  async getNewReleases(@Query() query: ContentListQueryDto) {
    const { items, total, limit, offset } =
      await this.contentService.getNewReleases(query)

    return {
      success: true,
      data: { data: items, total },
      meta: {
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      },
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search content' })
  async search(@Query() query: ContentSearchQueryDto) {
    const { items, total, limit, offset } =
      await this.contentService.searchContent(query)

    return {
      success: true,
      data: { data: items, total },
      meta: {
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      },
    }
  }

  @Get('my-uploads')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator uploads' })
  async getMyUploads(
    @CurrentUser() userId: string,
    @Query() query: MyUploadsQueryDto,
  ) {
    const { items, total, totalViews, totalEarnings, limit, offset } =
      await this.contentService.getMyUploads(userId, query)

    return {
      success: true,
      data: {
        data: items,
        total,
        totalViews,
        totalEarnings,
      },
      meta: {
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      },
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content details' })
  async getById(@Param('id') id: string, @Req() request: Request) {
    const content = await this.contentService.getContentById(id, request)

    if (!content) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content not found',
          },
        },
        HttpStatus.NOT_FOUND,
      )
    }

    return {
      success: true,
      data: content,
    }
  }

  @Post()
  @UseGuards(ClerkAuthGuard, EnsureCreatorRoleGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new content (CREATOR or ADMIN)' })
  @HttpCode(HttpStatus.OK)
  async createContent(
    @CurrentUser() userId: string,
    @Body() dto: CreateContentDto,
  ) {
    const content = await this.contentService.createContent(userId, dto)
    return {
      success: true,
      data: content,
    }
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content (owner or ADMIN)' })
  async updateContent(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    const content = await this.contentService.updateContent(userId, id, dto)
    return {
      success: true,
      data: content,
    }
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content (owner or ADMIN)' })
  async deleteContent(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.contentService.deleteContent(userId, id)
    return {
      success: true,
      data: result,
    }
  }

  @Post(':id/analyze-changes')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze content changes (owner or ADMIN)' })
  async analyzeChanges(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: AnalyzeChangesDto,
  ) {
    const analysis = await this.contentService.analyzeChanges(userId, id, dto)
    return {
      success: true,
      data: analysis,
    }
  }
}
