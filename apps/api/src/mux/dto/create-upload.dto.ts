import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsEnum } from 'class-validator'

export enum UploadType {
  VIDEO = 'video',
  TRAILER = 'trailer',
}

export class CreateUploadDto {
  @ApiPropertyOptional({ enum: UploadType, default: UploadType.VIDEO })
  @IsOptional()
  @IsEnum(UploadType)
  type?: UploadType = UploadType.VIDEO

  @ApiPropertyOptional({ example: 'http://localhost:3000', description: 'CORS origin for the upload' })
  @IsOptional()
  @IsString()
  corsOrigin?: string
}

// Response DTOs as interfaces (not validated, just type shapes)
export interface UploadUrlResponseDto {
  uploadUrl: string
  uploadId: string
}

export interface PlaybackUrlResponseDto {
  playbackUrl: string
  expiresAt: Date
}
