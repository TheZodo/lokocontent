import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { MuxService } from './mux.service'
import { PrismaService } from '../prisma'
import { ContentStatus } from '@lokocontent/db'

// Extend Request to include rawBody
interface RequestWithRawBody extends Request {
  rawBody?: string
}

@ApiTags('Webhooks - Mux')
@Controller('webhooks/mux')
export class MuxWebhookController {
  private readonly logger = new Logger(MuxWebhookController.name)

  constructor(
    private readonly muxService: MuxService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mux video lifecycle webhook (asset created, ready, errored, deleted)' })
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('mux-signature') signature: string,
  ) {
    // Get raw body for signature verification
    const payload = req.rawBody || JSON.stringify(req.body)

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = this.muxService.verifyWebhookSignature(
        payload,
        signature,
        webhookSecret,
      )

      if (!isValid) {
        this.logger.warn('Invalid Mux webhook signature')
        throw new BadRequestException('Invalid webhook signature')
      }
    }

    // Parse the webhook event
    const event = this.muxService.parseWebhookEvent(payload)
    this.logger.log(`Received Mux webhook: ${event.type}`)

    try {
      switch (event.type) {
        case 'video.upload.asset_created':
          await this.handleUploadAssetCreated(event)
          break

        case 'video.asset.ready':
          await this.handleAssetReady(event)
          break

        case 'video.asset.errored':
          await this.handleAssetErrored(event)
          break

        case 'video.asset.deleted':
          await this.handleAssetDeleted(event)
          break

        default:
          this.logger.log(`Unhandled Mux event type: ${event.type}`)
      }

      return { success: true }
    } catch (error) {
      this.logger.error(`Error handling Mux webhook ${event.type}`, error)
      // Return success to prevent Mux from retrying
      // Log the error for investigation
      return { success: true, error: 'Internal processing error' }
    }
  }

  /**
   * Handle video.upload.asset_created event
   * This fires when an upload completes and an asset is created
   */
  private async handleUploadAssetCreated(event: {
    type: string
    data: { id: string; upload_id?: string; [key: string]: unknown }
  }) {
    const { id: assetId, upload_id: uploadId } = event.data

    this.logger.log(
      `Asset created from upload: assetId=${assetId}, uploadId=${uploadId}`,
    )

    // Find content by upload ID and update with asset ID
    // This requires storing uploadId when creating content
    // For now, just log the event
    // The frontend should poll for upload status and update content
  }

  /**
   * Handle video.asset.ready event
   * This fires when video processing is complete and ready for playback
   */
  private async handleAssetReady(event: {
    type: string
    data: {
      id: string
      playback_ids?: Array<{ id: string; policy: string }>
      duration?: number
      aspect_ratio?: string
      [key: string]: unknown
    }
  }) {
    const { id: assetId, playback_ids, duration } = event.data
    const playbackId = playback_ids?.[0]?.id

    this.logger.log(
      `Asset ready: assetId=${assetId}, playbackId=${playbackId}, duration=${duration}`,
    )

    // Update content status to PUBLISHED if it was PROCESSING
    // Find content by muxAssetId
    const content = await this.prisma.videoContent.findFirst({
      where: { muxAssetId: assetId },
    })

    if (content) {
      const formattedDuration = duration
        ? this.muxService.formatDuration(duration)
        : null

      await this.prisma.videoContent.update({
        where: { id: content.id },
        data: {
          status: ContentStatus.PUBLISHED,
          muxPlaybackId: playbackId,
          ...(formattedDuration && { duration: formattedDuration }),
        },
      })

      this.logger.log(`Updated content ${content.id} to PUBLISHED`)
    } else {
      this.logger.warn(`No content found for asset ${assetId}`)
    }

    // Also check for trailers
    const contentWithTrailer = await this.prisma.videoContent.findFirst({
      where: { trailerMuxAssetId: assetId },
    })

    if (contentWithTrailer) {
      await this.prisma.videoContent.update({
        where: { id: contentWithTrailer.id },
        data: {
          trailerMuxPlaybackId: playbackId,
        },
      })

      this.logger.log(
        `Updated trailer playback ID for content ${contentWithTrailer.id}`,
      )
    }
  }

  /**
   * Handle video.asset.errored event
   * This fires when video processing fails
   */
  private async handleAssetErrored(event: {
    type: string
    data: { id: string; [key: string]: unknown }
  }) {
    const { id: assetId } = event.data

    this.logger.error(`Asset processing failed: assetId=${assetId}`)

    // Find content and update status
    const content = await this.prisma.videoContent.findFirst({
      where: { muxAssetId: assetId },
    })

    if (content) {
      // Set back to DRAFT so creator can try again
      await this.prisma.videoContent.update({
        where: { id: content.id },
        data: {
          status: ContentStatus.DRAFT,
        },
      })

      this.logger.log(
        `Reset content ${content.id} to DRAFT due to processing error`,
      )

      // TODO: Send notification to creator about the failure
    }
  }

  /**
   * Handle video.asset.deleted event
   */
  private async handleAssetDeleted(event: {
    type: string
    data: { id: string; [key: string]: unknown }
  }) {
    const { id: assetId } = event.data

    this.logger.log(`Asset deleted: assetId=${assetId}`)

    // Optionally update content to remove Mux references
    // This depends on your deletion flow
  }
}
