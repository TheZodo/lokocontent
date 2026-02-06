import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { MuxService } from './mux.service'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '@lokocontent/db'
import {
  CreateUploadDto,
  UploadType,
  UploadUrlResponseDto,
  PlaybackUrlResponseDto,
} from './dto/create-upload.dto'

@ApiTags('Mux')
@Controller('mux')
export class MuxController {
  constructor(private readonly muxService: MuxService) {}

  @Post('upload-url')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create direct upload URL for video or trailer (CREATOR or ADMIN)' })
  async createUploadUrl(
    @Body() dto: CreateUploadDto,
    @Req() req: Request,
  ): Promise<UploadUrlResponseDto> {
    // Use provided corsOrigin or derive from request
    const corsOrigin =
      dto.corsOrigin || req.headers.origin || process.env.FRONTEND_URL || '*'

    if (dto.type === UploadType.TRAILER) {
      return this.muxService.createTrailerUpload(corsOrigin)
    }

    return this.muxService.createDirectUpload(corsOrigin)
  }

  @Get('playback/:playbackId')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get signed playback URL for a video' })
  async getPlaybackUrl(
    @Param('playbackId') playbackId: string,
  ): Promise<PlaybackUrlResponseDto> {
    // TODO: Add premium content verification
    // Check if content is premium and user has purchased
    return this.muxService.getSignedPlaybackUrl(playbackId)
  }

  @Get('thumbnail/:playbackId')
  @ApiOperation({ summary: 'Get thumbnail URL for a video' })
  async getThumbnailUrl(
    @Param('playbackId') playbackId: string,
  ): Promise<{ thumbnailUrl: string }> {
    const thumbnailUrl = this.muxService.getThumbnailUrl(playbackId)
    return { thumbnailUrl }
  }

  @Get('upload/:uploadId')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Mux upload status (CREATOR or ADMIN)' })
  async getUploadStatus(@Param('uploadId') uploadId: string) {
    const upload = await this.muxService.getUpload(uploadId)
    return {
      id: upload.id,
      status: upload.status,
      assetId: upload.asset_id,
    }
  }
}
