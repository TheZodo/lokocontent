import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class PresignedUrlDto {
  @ApiProperty({ example: 'thumbnail.jpg', description: 'File name for the upload' })
  @IsString()
  @IsNotEmpty()
  filename!: string

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  contentType!: string
}

export class DeleteFileDto {
  @ApiProperty({
    example: 'thumbnails/user_xxx/filename.jpg',
    description: 'Storage key of the file to delete (must contain userId for ownership)',
  })
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
