import { Injectable, Logger } from '@nestjs/common'
import Mux from '@mux/mux-node'
import * as crypto from 'crypto'

export interface DirectUploadResponse {
  uploadUrl: string
  uploadId: string
}

export interface SignedPlaybackResponse {
  playbackUrl: string
  expiresAt: Date
}

export interface MuxWebhookEvent {
  type: string
  data: {
    id: string
    upload_id?: string
    playback_ids?: Array<{ id: string; policy: string }>
    status?: string
    duration?: number
    aspect_ratio?: string
    [key: string]: unknown
  }
}

@Injectable()
export class MuxService {
  private readonly logger = new Logger(MuxService.name)
  private readonly mux: Mux

  constructor() {
    this.mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    })
  }

  /**
   * Create a direct upload URL for the frontend to upload videos directly to Mux
   * @param corsOrigin - The origin URL for CORS (e.g., 'https://lokocontent.com')
   */
  async createDirectUpload(corsOrigin: string): Promise<DirectUploadResponse> {
    try {
      const upload = await this.mux.video.uploads.create({
        cors_origin: corsOrigin,
        new_asset_settings: {
          playback_policy: ['public'],
          encoding_tier: 'baseline',
        },
      })

      this.logger.log(`Created direct upload: ${upload.id}`)

      return {
        uploadUrl: upload.url,
        uploadId: upload.id,
      }
    } catch (error) {
      this.logger.error('Failed to create direct upload', error)
      throw error
    }
  }

  /**
   * Create a direct upload URL for trailer videos
   */
  async createTrailerUpload(corsOrigin: string): Promise<DirectUploadResponse> {
    try {
      const upload = await this.mux.video.uploads.create({
        cors_origin: corsOrigin,
        new_asset_settings: {
          playback_policies: ['public'],
          encoding_tier: 'baseline',
        },
      })

      this.logger.log(`Created trailer upload: ${upload.id}`)

      return {
        uploadUrl: upload.url,
        uploadId: upload.id,
      }
    } catch (error) {
      this.logger.error('Failed to create trailer upload', error)
      throw error
    }
  }

  /**
   * Get upload status and asset information
   */
  async getUpload(uploadId: string) {
    try {
      return await this.mux.video.uploads.retrieve(uploadId)
    } catch (error) {
      this.logger.error(`Failed to get upload ${uploadId}`, error)
      throw error
    }
  }

  /**
   * Get asset details by asset ID
   */
  async getAsset(assetId: string) {
    try {
      return await this.mux.video.assets.retrieve(assetId)
    } catch (error) {
      this.logger.error(`Failed to get asset ${assetId}`, error)
      throw error
    }
  }

  /**
   * Delete an asset from Mux
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      await this.mux.video.assets.delete(assetId)
      this.logger.log(`Deleted asset: ${assetId}`)
    } catch (error) {
      this.logger.error(`Failed to delete asset ${assetId}`, error)
      throw error
    }
  }

  /**
   * Get a signed playback URL for premium content
   * Note: Requires signing key to be configured in Mux dashboard
   */
  async getSignedPlaybackUrl(
    playbackId: string,
    expirationSeconds: number = 3600,
  ): Promise<SignedPlaybackResponse> {
    // For now, return the standard playback URL
    // Signed URLs require additional Mux signing key configuration
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000)

    // Standard HLS playback URL
    const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`

    return {
      playbackUrl,
      expiresAt,
    }
  }

  /**
   * Get thumbnail URL for a video
   */
  getThumbnailUrl(
    playbackId: string,
    options: { width?: number; height?: number; time?: number } = {},
  ): string {
    const { width = 640, height = 360, time = 0 } = options
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&time=${time}`
  }

  /**
   * Get animated GIF URL for a video
   */
  getAnimatedGifUrl(
    playbackId: string,
    options: { width?: number; start?: number; end?: number } = {},
  ): string {
    const { width = 320, start = 0, end = 5 } = options
    return `https://image.mux.com/${playbackId}/animated.gif?width=${width}&start=${start}&end=${end}`
  }

  /**
   * Verify Mux webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string,
  ): boolean {
    try {
      // Mux uses a simple HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', error)
      return false
    }
  }

  /**
   * Parse webhook event from request body
   */
  parseWebhookEvent(payload: string): MuxWebhookEvent {
    return JSON.parse(payload) as MuxWebhookEvent
  }

  /**
   * Format duration from seconds to human-readable string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
}
