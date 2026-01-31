import { IsString, IsNotEmpty } from 'class-validator'

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  filename!: string

  @IsString()
  @IsNotEmpty()
  contentType!: string
}

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  key!: string
}

// Response DTOs as interfaces (not validated, just type shapes)
export interface PresignedUploadResponseDto {
  uploadUrl: string
  key: string
  publicUrl: string
  expiresAt: Date
}

export interface PresignedDownloadResponseDto {
  downloadUrl: string
  expiresAt: Date
}
