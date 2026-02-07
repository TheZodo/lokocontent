'use client'

import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as UpChunk from '@mux/upchunk'
import {
  Upload,
  Film,
  ImageIcon,
  Play,
  X,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  Globe,
  Tag,
  FileText,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { regions, categories } from '@/lib/lokocontent-data'
import { useApiClient } from '@/api/use-api-client'
import { unwrapApiResponse } from '@/api/client'
import { ContentStatus } from '@lokocontent/db'
import { createContent } from '@/api/requests/content'
import { createThumbnailUpload } from '@/api/requests/upload'
import { createMuxUploadUrl, getMuxUploadStatus } from '@/api/requests/mux'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

interface FileUpload {
  file: File | null
  preview: string | null
  status: UploadStatus
  progress: number
  muxAssetId?: string
  muxPlaybackId?: string
  uploadId?: string
  publicUrl?: string
  error?: string
}

interface UploadFormData {
  title: string
  synopsis: string
  region: string
  category: string
  isPremium: boolean
  price: string
  releaseYear: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const createMuxThumbnailUrl = (playbackId: string) =>
  `https://image.mux.com/${playbackId}/thumbnail.jpg`

async function uploadFileToMuxWithUpChunk(
  file: File,
  uploadUrl: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const upload = UpChunk.createUpload({
      endpoint: () => Promise.resolve(uploadUrl),
      file,
      chunkSize: 5120,
    })
    upload.on('progress', (e: { detail: number }) => {
      onProgress(typeof e.detail === 'number' ? e.detail : 0)
    })
    upload.on('success', () => resolve())
    upload.on('error', (e: { detail?: unknown }) => {
      reject(
        e.detail instanceof Error ? e.detail : new Error(String(e.detail)),
      )
    })
  })
}

export function UploadForm() {
  const api = useApiClient()
  const router = useRouter()
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    synopsis: '',
    region: '',
    category: '',
    isPremium: false,
    price: '',
    releaseYear: new Date().getFullYear().toString(),
  })

  const [mainVideo, setMainVideo] = useState<FileUpload>({
    file: null,
    preview: null,
    status: 'idle',
    progress: 0,
  })

  const [thumbnail, setThumbnail] = useState<FileUpload>({
    file: null,
    preview: null,
    status: 'idle',
    progress: 0,
  })

  const [trailer, setTrailer] = useState<FileUpload>({
    file: null,
    preview: null,
    status: 'idle',
    progress: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mainVideoRef = useRef<HTMLInputElement>(null)
  const thumbnailRef = useRef<HTMLInputElement>(null)
  const trailerRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'video' | 'thumbnail' | 'trailer',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)

    if (type === 'video') {
      setMainVideo({ file, preview, status: 'uploading', progress: 0 })
      try {
        const uploadResponse = await createMuxUploadUrl(api, {
          type: 'video',
          corsOrigin:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        })
        const { uploadUrl, uploadId } = unwrapApiResponse(uploadResponse).data

        setMainVideo((prev) => ({ ...prev, uploadId }))

        await uploadFileToMuxWithUpChunk(file, uploadUrl, (progress) => {
          setMainVideo((prev) => ({ ...prev, progress }))
        })

        setMainVideo((prev) => ({
          ...prev,
          status: 'processing',
          progress: 100,
        }))

        const result = await pollMuxUpload(uploadId)

        setMainVideo((prev) => ({
          ...prev,
          status: 'complete',
          muxAssetId: result.assetId,
          muxPlaybackId: result.playbackId,
        }))
      } catch (error) {
        setMainVideo((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        }))
      }
    } else if (type === 'thumbnail') {
      setThumbnail({ file, preview, status: 'uploading', progress: 0 })
      try {
        const uploadResponse = await createThumbnailUpload(api, {
          filename: file.name,
          contentType: file.type,
        })
        const { uploadUrl, publicUrl } = unwrapApiResponse(uploadResponse).data

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        })

        if (!response.ok) {
          throw new Error('Thumbnail upload failed')
        }

        setThumbnail((prev) => ({
          ...prev,
          status: 'complete',
          progress: 100,
          publicUrl,
        }))
      } catch (error) {
        setThumbnail((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        }))
      }
    } else if (type === 'trailer') {
      setTrailer({ file, preview, status: 'uploading', progress: 0 })
      try {
        const uploadResponse = await createMuxUploadUrl(api, {
          type: 'trailer',
          corsOrigin:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        })
        const { uploadUrl, uploadId } = unwrapApiResponse(uploadResponse).data

        setTrailer((prev) => ({ ...prev, uploadId }))

        await uploadFileToMuxWithUpChunk(file, uploadUrl, (progress) => {
          setTrailer((prev) => ({ ...prev, progress }))
        })

        setTrailer((prev) => ({
          ...prev,
          status: 'processing',
          progress: 100,
        }))

        const result = await pollMuxUpload(uploadId)

        setTrailer((prev) => ({
          ...prev,
          status: 'complete',
          muxAssetId: result.assetId,
          muxPlaybackId: result.playbackId,
        }))
      } catch (error) {
        setTrailer((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        }))
      }
    }
  }

  const pollMuxUpload = async (uploadId: string) => {
    const maxAttempts = 20

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await getMuxUploadStatus(api, uploadId)
      const data = unwrapApiResponse(response).data

      if (data.status === 'errored') {
        throw new Error('Mux processing failed')
      }

      if (data.assetId && data.playbackId) {
        return {
          assetId: data.assetId,
          playbackId: data.playbackId,
        }
      }

      await sleep(3000)
    }

    throw new Error('Mux processing timed out')
  }

  const removeFile = (type: 'video' | 'thumbnail' | 'trailer') => {
    const emptyState: FileUpload = {
      file: null,
      preview: null,
      status: 'idle',
      progress: 0,
    }
    if (type === 'video') setMainVideo(emptyState)
    else if (type === 'thumbnail') setThumbnail(emptyState)
    else setTrailer(emptyState)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mainVideo.file || mainVideo.status !== 'complete') return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitError(null)

    try {
      const price = formData.isPremium ? Number(formData.price) : undefined
      const releaseYear = Number(formData.releaseYear)
      const thumbnailUrl =
        thumbnail.publicUrl ||
        (mainVideo.muxPlaybackId
          ? createMuxThumbnailUrl(mainVideo.muxPlaybackId)
          : '')

      const payload = {
        title: formData.title,
        synopsis: formData.synopsis,
        region: formData.region,
        category: formData.category,
        isPremium: formData.isPremium,
        price: price && !Number.isNaN(price) ? price : undefined,
        releaseYear: Number.isNaN(releaseYear)
          ? new Date().getFullYear()
          : releaseYear,
        muxAssetId: mainVideo.muxAssetId ?? null,
        muxPlaybackId: mainVideo.muxPlaybackId ?? null,
        trailerMuxAssetId: trailer.muxAssetId ?? null,
        trailerMuxPlaybackId: trailer.muxPlaybackId ?? null,
        thumbnailUrl,
        status: ContentStatus.PUBLISHED,
      }

      if (!payload.muxAssetId || !payload.muxPlaybackId) {
        throw new Error('Video upload is not ready yet')
      }

      if (!payload.thumbnailUrl) {
        throw new Error('Thumbnail upload is required')
      }

      const response = await createContent(api, payload)
      unwrapApiResponse(response)

      setSubmitStatus('success')
      router.push('/library')
      router.refresh()
    } catch (error) {
      setSubmitStatus('error')
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Upload failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = useMemo(
    () =>
      Boolean(
        formData.title &&
        formData.synopsis &&
        formData.region &&
        formData.category &&
        mainVideo.status === 'complete',
      ),
    [formData, mainVideo.status],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Upload Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Video Upload */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            <Film className="inline w-4 h-4 mr-2" />
            Main Video *
          </label>
          <UploadZone
            accept="video/*"
            file={mainVideo}
            onSelect={() => mainVideoRef.current?.click()}
            onRemove={() => removeFile('video')}
            placeholder="Drag and drop your video here, or click to browse"
            subtext="MP4, MOV, MKV up to 10GB"
          />
          <input
            ref={mainVideoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'video')}
          />
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <ImageIcon className="inline w-4 h-4 mr-2" />
            Thumbnail (Optional)
          </label>
          <UploadZone
            accept="image/*"
            file={thumbnail}
            onSelect={() => thumbnailRef.current?.click()}
            onRemove={() => removeFile('thumbnail')}
            placeholder="Upload cover image"
            subtext="JPG, PNG, WebP (16:9 ratio)"
            isImage
          />
          <input
            ref={thumbnailRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'thumbnail')}
          />
        </div>
      </div>

      {/* Trailer Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Play className="inline w-4 h-4 mr-2" />
          Trailer (Optional)
        </label>
        <UploadZone
          accept="video/*"
          file={trailer}
          onSelect={() => trailerRef.current?.click()}
          onRemove={() => removeFile('trailer')}
          placeholder="Upload a trailer to attract viewers"
          subtext="30 seconds to 3 minutes recommended"
        />
        <input
          ref={trailerRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'trailer')}
        />
      </div>

      {/* Content Details */}
      <div className="border-t border-border pt-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Content Details
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="inline w-4 h-4 mr-2" />
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter your content title"
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50"
              required
            />
          </div>

          {/* Synopsis */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Synopsis *
            </label>
            <textarea
              value={formData.synopsis}
              onChange={(e) =>
                setFormData({ ...formData, synopsis: e.target.value })
              }
              placeholder="Describe your content in a few sentences..."
              rows={4}
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 resize-none"
              required
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Globe className="inline w-4 h-4 mr-2" />
              Region *
            </label>
            <select
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-popover">
                Select a region
              </option>
              {regions
                .filter((r) => r.id !== 'all')
                .map((region) => (
                  <option
                    key={region.id}
                    value={region.id}
                    className="bg-popover"
                  >
                    {region.flag} {region.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Tag className="inline w-4 h-4 mr-2" />
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-popover">
                Select a category
              </option>
              {categories
                .filter((c) => c.id !== 'all')
                .map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-popover"
                  >
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="inline w-4 h-4 mr-2" />
              Release Year
            </label>
            <input
              type="number"
              value={formData.releaseYear}
              onChange={(e) =>
                setFormData({ ...formData, releaseYear: e.target.value })
              }
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50"
            />
          </div>

          {/* Premium Toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <DollarSign className="inline w-4 h-4 mr-2" />
              Pricing
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPremium: false })}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  !formData.isPremium
                    ? 'bg-loko-teal text-background'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPremium: true })}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  formData.isPremium
                    ? 'bg-loko-gold text-background'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                Premium
              </button>
            </div>
          </div>

          {/* Price Input (shown when Premium is selected) */}
          {formData.isPremium && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Set your unlock price. Lokocontent takes a 15% platform fee.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="border-t border-border pt-8 flex items-center justify-between">
        <div>
          {submitStatus === 'success' && (
            <p className="text-loko-teal flex items-center gap-2">
              <Check className="w-4 h-4" />
              Content uploaded successfully!
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {submitError ?? 'Upload failed. Please try again.'}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="bg-linear-to-r from-loko-gold to-loko-deep-red hover:from-loko-gold/90 hover:to-loko-deep-red/90 text-foreground font-semibold px-8 py-6 glow-gold-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Publish Content
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Upload Zone Component
interface UploadZoneProps {
  accept: string
  file: FileUpload
  onSelect: () => void
  onRemove: () => void
  placeholder: string
  subtext: string
  isImage?: boolean
}

function UploadZone({
  file,
  onSelect,
  onRemove,
  placeholder,
  subtext,
  isImage,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Note: File handling would go through the parent's input change handler
  }

  if (file.file) {
    return (
      <div className="relative rounded-xl border border-border bg-loko-surface overflow-hidden">
        {/* Preview */}
        <div className="aspect-video relative">
          {isImage && file.preview ? (
            <img
              src={file.preview || '/placeholder.svg'}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-loko-surface-elevated flex items-center justify-center">
              <Film className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Progress Overlay */}
          {(file.status === 'uploading' || file.status === 'processing') && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-loko-gold animate-spin mb-3" />
              <p className="text-sm text-foreground mb-2">
                {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </p>
              <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-loko-gold to-loko-teal transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {file.progress}%
              </p>
            </div>
          )}

          {/* Complete Badge */}
          {file.status === 'complete' && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-loko-teal/90 text-background text-xs font-medium rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Uploaded
            </div>
          )}

          {/* Error Badge */}
          {file.status === 'error' && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-destructive/90 text-foreground text-xs font-medium rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Error
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="p-3 flex items-center justify-between border-t border-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{file.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'w-full aspect-video rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center p-6',
        isDragging
          ? 'border-loko-gold bg-loko-gold/5'
          : 'border-border hover:border-loko-gold/50 hover:bg-loko-surface',
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
          isDragging ? 'bg-loko-gold/20' : 'bg-secondary',
        )}
      >
        <Upload
          className={cn(
            'w-6 h-6',
            isDragging ? 'text-loko-gold' : 'text-muted-foreground',
          )}
        />
      </div>
      <div>
        <p className="text-sm text-foreground font-medium">{placeholder}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </div>
    </button>
  )
}
