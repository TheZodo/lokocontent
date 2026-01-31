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

@Controller('mux')
export class MuxController {
  constructor(private readonly muxService: MuxService) {}

  /**
   * Create a direct upload URL for video uploads
   * Requires CREATOR or ADMIN role
   */
  @Post('upload-url')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
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

  /**
   * Get playback URL for a video
   * For premium content, returns a signed URL
   */
  @Get('playback/:playbackId')
  @UseGuards(ClerkAuthGuard)
  async getPlaybackUrl(
    @Param('playbackId') playbackId: string,
  ): Promise<PlaybackUrlResponseDto> {
    // TODO: Add premium content verification
    // Check if content is premium and user has purchased
    return this.muxService.getSignedPlaybackUrl(playbackId)
  }

  /**
   * Get thumbnail URL for a video
   */
  @Get('thumbnail/:playbackId')
  async getThumbnailUrl(
    @Param('playbackId') playbackId: string,
  ): Promise<{ thumbnailUrl: string }> {
    const thumbnailUrl = this.muxService.getThumbnailUrl(playbackId)
    return { thumbnailUrl }
  }

  /**
   * Get upload status
   * Requires CREATOR or ADMIN role
   */
  @Get('upload/:uploadId')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  async getUploadStatus(@Param('uploadId') uploadId: string) {
    const upload = await this.muxService.getUpload(uploadId)
    return {
      id: upload.id,
      status: upload.status,
      assetId: upload.asset_id,
    }
  }
}
