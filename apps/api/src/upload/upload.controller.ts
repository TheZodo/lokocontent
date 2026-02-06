import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
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

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('thumbnail')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for thumbnail upload (CREATOR or ADMIN)' })
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

  @Post('profile-picture')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for profile picture upload' })
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

  @Delete()
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file from storage (CREATOR or ADMIN)' })
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
