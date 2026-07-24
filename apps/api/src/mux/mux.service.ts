import { Injectable, Logger } from '@nestjs/common'
import Mux from '@mux/mux-node'
import * as crypto from 'crypto'
import { gunzipSync } from 'zlib'

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

export interface MuxEngagementCounts {
  views: number
  viewers: number
  updatedAt: Date | null
  freshness: 'LIVE'
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

  hasApiCredentials() {
    return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
  }

  hasSigningCredentials() {
    return Boolean(process.env.MUX_SIGNING_KEY && process.env.MUX_PRIVATE_KEY)
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
          playback_policies: ['public'],
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

  async listVideoViewDetails(start: Date, end: Date, maxRows = 1000) {
    const timeframe = [
      `${Math.floor(start.getTime() / 1000)}`,
      `${Math.floor(end.getTime() / 1000)}`,
    ]

    const views: Array<Record<string, unknown>> = []

    for await (const view of this.mux.data.videoViews.list({ timeframe })) {
      if (views.length >= maxRows) {
        break
      }

      const detail = await this.mux.data.videoViews.retrieve(view.id)
      views.push(detail.data as unknown as Record<string, unknown>)
    }

    return views
  }

  async listVideoViewExports() {
    return this.mux.data.exports.listVideoViews()
  }

  async downloadExportText(path: string) {
    const response = await fetch(path)

    if (!response.ok) {
      throw new Error(`Failed to download Mux export: HTTP ${response.status}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentEncoding = response.headers.get('content-encoding')
    const body =
      path.endsWith('.gz') && contentEncoding !== 'gzip'
        ? gunzipSync(buffer)
        : buffer

    return body.toString('utf8')
  }

  async getEngagementCountsForVideoId(
    videoId: string,
  ): Promise<MuxEngagementCounts> {
    if (!this.hasSigningCredentials()) {
      return { views: 0, viewers: 0, updatedAt: null, freshness: 'LIVE' }
    }

    const token = await this.mux.jwt.signViewerCounts(videoId, {
      type: 'video',
      expiration: '15m',
    })
    const statsBaseUrl =
      process.env.MUX_STATS_BASE_URL?.replace(/\/$/, '') ??
      'https://stats.mux.com'
    const response = await fetch(`${statsBaseUrl}/counts?token=${token}`)

    if (!response.ok) {
      throw new Error(`Failed to retrieve Mux engagement counts: HTTP ${response.status}`)
    }

    const payload = (await response.json()) as {
      data?: Array<{ views?: number; viewers?: number; updated_at?: string }>
    }
    const data = payload.data?.[0]

    return {
      views: data?.views ?? 0,
      viewers: data?.viewers ?? 0,
      updatedAt: data?.updated_at ? new Date(data.updated_at) : null,
      freshness: 'LIVE',
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
