import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as crypto from 'crypto'

export interface PresignedUploadResponse {
  uploadUrl: string
  key: string
  publicUrl: string
  expiresAt: Date
}

export interface PresignedDownloadResponse {
  downloadUrl: string
  expiresAt: Date
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly region: string
  private readonly cloudfrontDomain?: string

  // Allowed file types for different upload categories
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ]

  // Max file sizes (in bytes)
  private readonly maxImageSize = 5 * 1024 * 1024 // 5MB

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.bucket = process.env.AWS_S3_BUCKET || ''
    this.cloudfrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }

  /**
   * Generate a unique key for file storage
   */
  generateKey(prefix: string, userId: string, filename: string): string {
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(8).toString('hex')
    const extension = filename.split('.').pop() || 'jpg'
    return `${prefix}/${userId}/${timestamp}-${randomId}.${extension}`
  }

  /**
   * Validate file type against allowed types
   */
  validateFileType(contentType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(contentType.toLowerCase())
  }

  /**
   * Get presigned URL for uploading a file
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expirationSeconds: number = 3600,
  ): Promise<PresignedUploadResponse> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: expirationSeconds,
    })

    const expiresAt = new Date(Date.now() + expirationSeconds * 1000)
    const publicUrl = this.getPublicUrl(key)

    this.logger.log(`Generated presigned upload URL for key: ${key}`)

    return {
      uploadUrl,
      key,
      publicUrl,
      expiresAt,
    }
  }

  /**
   * Get presigned URL for downloading a file (private content)
   */
  async getPresignedDownloadUrl(
    key: string,
    expirationSeconds: number = 3600,
  ): Promise<PresignedDownloadResponse> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const downloadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: expirationSeconds,
    })

    const expiresAt = new Date(Date.now() + expirationSeconds * 1000)

    return {
      downloadUrl,
      expiresAt,
    }
  }

  /**
   * Get public URL for a file
   * Uses CloudFront if configured, otherwise S3 URL
   */
  getPublicUrl(key: string): string {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${key}`
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3.send(command)
      this.logger.log(`Deleted file: ${key}`)
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}`, error)
      throw error
    }
  }

  /**
   * Get presigned URL for thumbnail upload
   */
  async getThumbnailUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<PresignedUploadResponse> {
    // Validate file type
    if (!this.validateFileType(contentType, this.allowedImageTypes)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
      )
    }

    const key = this.generateKey('thumbnails', userId, filename)
    return this.getPresignedUploadUrl(key, contentType)
  }

  /**
   * Get presigned URL for profile picture upload
   */
  async getProfilePictureUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<PresignedUploadResponse> {
    // Validate file type
    if (!this.validateFileType(contentType, this.allowedImageTypes)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
      )
    }

    const key = this.generateKey('profile-pictures', userId, filename)
    return this.getPresignedUploadUrl(key, contentType)
  }

  /**
   * Extract S3 key from a full URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      // Handle CloudFront URLs
      if (this.cloudfrontDomain && url.includes(this.cloudfrontDomain)) {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1) // Remove leading slash
      }

      // Handle S3 URLs
      if (url.includes('.s3.')) {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1) // Remove leading slash
      }

      return null
    } catch {
      return null
    }
  }
}
