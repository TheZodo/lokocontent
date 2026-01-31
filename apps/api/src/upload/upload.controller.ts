import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { UploadService } from './upload.service'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Role } from '@lokocontent/db'
import {
  PresignedUrlDto,
  PresignedUploadResponseDto,
  DeleteFileDto,
} from './dto/presigned-url.dto'

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Get presigned URL for thumbnail upload
   * Requires CREATOR or ADMIN role
   */
  @Post('thumbnail')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getThumbnailUploadUrl(
    @Body() dto: PresignedUrlDto,
    @CurrentUser() userId: string,
  ): Promise<PresignedUploadResponseDto> {
    return this.uploadService.getThumbnailUploadUrl(
      userId,
      dto.filename,
      dto.contentType,
    )
  }

  /**
   * Get presigned URL for profile picture upload
   * Available to all authenticated users
   */
  @Post('profile-picture')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfilePictureUploadUrl(
    @Body() dto: PresignedUrlDto,
    @CurrentUser() userId: string,
  ): Promise<PresignedUploadResponseDto> {
    return this.uploadService.getProfilePictureUploadUrl(
      userId,
      dto.filename,
      dto.contentType,
    )
  }

  /**
   * Delete a file from storage
   * Requires CREATOR or ADMIN role
   * Note: Should verify ownership before deletion in production
   */
  @Delete()
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteFile(
    @Body() dto: DeleteFileDto,
    @CurrentUser() userId: string,
  ): Promise<{ success: boolean }> {
    // TODO: Verify that the user owns this file before deleting
    // For now, we rely on the key structure containing the userId
    if (!dto.key.includes(userId)) {
      // Basic ownership check - key should contain userId
      throw new Error('Unauthorized to delete this file')
    }

    await this.uploadService.deleteFile(dto.key)
    return { success: true }
  }
}
