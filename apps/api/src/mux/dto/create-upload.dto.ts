import { IsOptional, IsString, IsEnum } from 'class-validator'

export enum UploadType {
  VIDEO = 'video',
  TRAILER = 'trailer',
}

export class CreateUploadDto {
  @IsOptional()
  @IsEnum(UploadType)
  type?: UploadType = UploadType.VIDEO

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
