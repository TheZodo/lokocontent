'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  X,
  Star,
  Play,
  Clock,
  Globe,
  User,
  Lock,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { UnlockButton } from './unlock-button'
import type { VideoContent } from '@/lib/lokocontent-data'
import { regions } from '@/lib/lokocontent-data'
import { useApiClient } from '@/api/use-api-client'
import { unwrapApiResponse } from '@/api/client'
import { getContentById } from '@/api/requests/content'
import { getPlaybackUrl } from '@/api/requests/mux'
import { createPurchase } from '@/api/requests/purchases'
import { rateContent, removeRating } from '@/api/requests/ratings'
import { mapApiContentToVideoContent } from '@/lib/content-mappers'
import { PaymentProvider } from '@lokocontent/db'
import { updateWatchProgress } from '@/api/requests/history'

interface ContentModalProps {
  video: VideoContent
  isOpen: boolean
  onClose: () => void
}

export function ContentModal({ video, isOpen, onClose }: ContentModalProps) {
  if (!isOpen) return null

  const api = useApiClient()
  const { getToken, isSignedIn } = useAuth()
  const [currentContent, setCurrentContent] = useState(video)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [isFetchingPlayback, setIsFetchingPlayback] = useState(false)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [isRating, setIsRating] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastHistorySentAt = useRef(0)
  const lastHistoryProgress = useRef(0)

  useEffect(() => {
    setCurrentContent(video)
    setPlaybackUrl(null)
    setPlaybackError(null)
    setPurchaseError(null)
    setRatingError(null)
  }, [video])

  const refreshContent = async () => {
    try {
      const token = isSignedIn ? await getToken() : null
      const response = await getContentById(api, video.id, { token })
      const refreshed = mapApiContentToVideoContent(
        unwrapApiResponse(response).data,
      )
      setCurrentContent(refreshed)
    } catch {
      // Best-effort refresh; keep existing content on failure.
    }
  }

  const getProgressPercent = () => {
    const videoEl = videoRef.current
    if (
      !videoEl ||
      !Number.isFinite(videoEl.duration) ||
      videoEl.duration <= 0
    ) {
      return null
    }
    const percent = Math.round((videoEl.currentTime / videoEl.duration) * 100)
    return Math.max(0, Math.min(100, percent))
  }

  const pushWatchHistory = async (force: boolean) => {
    if (!isSignedIn) return
    const progress = getProgressPercent()
    if (progress === null) return

    const now = Date.now()
    const elapsed = now - lastHistorySentAt.current
    const progressDelta = Math.abs(progress - lastHistoryProgress.current)

    if (!force && elapsed < 10000 && progressDelta < 5) {
      return
    }

    lastHistorySentAt.current = now
    lastHistoryProgress.current = progress

    try {
      await updateWatchProgress(api, currentContent.id, { progress })
    } catch {
      // Best-effort history update.
    }
  }

  useEffect(() => {
    if (!isOpen) return
    refreshContent()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const successFlag =
        params.get('success') === 'true' ||
        params.get('status') === 'success' ||
        params.get('purchase') === 'success'
      const contentId = params.get('contentId')
      if (successFlag && (!contentId || contentId === video.id)) {
        refreshContent()
      }
    }
  }, [isOpen, video.id])

  useEffect(() => {
    if (!playbackUrl) return
    const videoEl = videoRef.current
    if (!videoEl) return

    const handleTimeUpdate = () => {
      pushWatchHistory(false)
    }
    const handlePause = () => {
      pushWatchHistory(true)
    }
    const handleEnded = () => {
      pushWatchHistory(true)
    }

    videoEl.addEventListener('timeupdate', handleTimeUpdate)
    videoEl.addEventListener('pause', handlePause)
    videoEl.addEventListener('ended', handleEnded)

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate)
      videoEl.removeEventListener('pause', handlePause)
      videoEl.removeEventListener('ended', handleEnded)
      pushWatchHistory(true)
    }
  }, [playbackUrl, currentContent.id])

  const region = regions.find((r) => r.id === currentContent.region)
  const isLocked = currentContent.isPremium && !currentContent.isOwned
  const creatorName = currentContent.creator || 'Lokocontent Creator'
  const formattedPrice =
    currentContent.price !== undefined && currentContent.price !== null
      ? `$${currentContent.price.toFixed(2)}`
      : undefined
  const hasPlaybackId = Boolean(currentContent.muxPlaybackId)
  const displayRating = useMemo(
    () => (Number.isFinite(currentContent.rating) ? currentContent.rating : 0),
    [currentContent.rating],
  )
  const ratingCount = currentContent.ratingCount ?? 0

  const handleClose = () => {
    pushWatchHistory(true)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-loko-surface border border-border shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/70 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Video Preview */}
          <div className="relative lg:w-3/5">
            {/* Video Thumbnail with Blur for Premium */}
            <div className="relative aspect-video lg:aspect-auto lg:h-full">
              {playbackUrl ? (
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={playbackUrl} />
                </video>
              ) : (
                <Image
                  src={currentContent.thumbnail || '/placeholder.svg'}
                  alt={currentContent.title}
                  fill
                  className={`object-cover ${isLocked ? 'blur-sm' : ''}`}
                />
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-linear-to-t from-loko-surface via-transparent to-transparent" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-loko-surface lg:block hidden" />

              {/* Lock Overlay for Premium */}
              {isLocked && !playbackUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30">
                  <div className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center mb-4">
                    <Lock className="w-10 h-10 text-loko-gold" />
                  </div>
                  <span className="text-foreground font-semibold text-lg">
                    Premium Content
                  </span>
                </div>
              )}

              {/* Watch Trailer Button */}
              <div className="absolute bottom-6 left-6">
                <Button
                  variant="outline"
                  className="border-foreground/30 text-foreground bg-background/50 backdrop-blur-sm hover:bg-background/70"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Free Trailer
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="lg:w-2/5 p-6 lg:p-8 flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
            {/* Premium Badge */}
            {currentContent.isPremium && (
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-full bg-loko-gold/20 border border-loko-gold/30">
                  <div className="flex items-center gap-1.5 text-loko-gold text-sm font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    {currentContent.isOwned ? 'Owned Premium' : 'Premium'}
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 text-balance">
              {currentContent.title}
            </h2>

            {/* Rating & Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-loko-gold" fill="currentColor" />
                <span className="text-foreground font-semibold">
                  {displayRating.toFixed(1)}
                </span>
                <span>/5</span>
                <span className="text-xs text-muted-foreground">
                  ({ratingCount})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{currentContent.duration || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>
                  {region?.flag} {region?.name}
                </span>
              </div>
              <span>{currentContent.releaseYear}</span>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-secondary/50">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-loko-teal to-loko-purple flex items-center justify-center">
                <User className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold text-foreground">{creatorName}</p>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Synopsis
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentContent.synopsis}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8 text-sm">
              <div>
                <p className="text-muted-foreground">Views</p>
                <p className="font-semibold text-foreground">
                  {currentContent.views}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-semibold text-foreground capitalize">
                  {currentContent.category.replace('-', ' ')}
                </p>
              </div>
            </div>

            {/* Your Rating */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">
                  Your Rating
                </p>
                {currentContent.userRating ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isRating}
                    onClick={async () => {
                      setIsRating(true)
                      setRatingError(null)
                      try {
                        await unwrapApiResponse(
                          await removeRating(api, currentContent.id),
                        )
                        setCurrentContent((prev) => ({
                          ...prev,
                          userRating: null,
                        }))
                        await refreshContent()
                      } catch {
                        setRatingError('Unable to remove rating.')
                      } finally {
                        setIsRating(false)
                      }
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="p-1"
                    disabled={isRating}
                    onClick={async () => {
                      setIsRating(true)
                      setRatingError(null)
                      try {
                        const response = await rateContent(
                          api,
                          currentContent.id,
                          {
                            rating: value,
                          },
                        )
                        const data = unwrapApiResponse(response).data
                        setCurrentContent((prev) => ({
                          ...prev,
                          userRating: value,
                          rating: data.averageRating,
                          ratingCount: data.ratingCount,
                        }))
                      } catch {
                        setRatingError('Unable to submit rating.')
                      } finally {
                        setIsRating(false)
                      }
                    }}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (currentContent.userRating ?? 0) >= value
                          ? 'text-loko-gold fill-loko-gold'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
                {isRating && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {ratingError && (
                <p className="text-xs text-destructive-foreground mt-2">
                  {ratingError}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto space-y-4">
              {isLocked ? (
                <UnlockButton
                  price={formattedPrice}
                  onClick={async () => {
                    setIsPurchasing(true)
                    setPurchaseError(null)
                    try {
                      const response = await createPurchase(api, {
                        contentId: currentContent.id,
                        paymentProvider: PaymentProvider.STRIPE,
                      })
                      const { checkoutUrl } = unwrapApiResponse(response).data
                      if (typeof window !== 'undefined') {
                        window.location.assign(checkoutUrl)
                      }
                    } catch {
                      setPurchaseError('Unable to start checkout.')
                    } finally {
                      setIsPurchasing(false)
                    }
                  }}
                />
              ) : (
                <Button
                  className="w-full bg-loko-gold hover:bg-loko-gold/90 text-background font-semibold py-6"
                  disabled={isFetchingPlayback || !hasPlaybackId}
                  onClick={async () => {
                    if (!currentContent.muxPlaybackId) return
                    setIsFetchingPlayback(true)
                    setPlaybackError(null)
                    try {
                      const response = await getPlaybackUrl(
                        api,
                        currentContent.muxPlaybackId,
                      )
                      const { playbackUrl: signedUrl } =
                        unwrapApiResponse(response).data
                      setPlaybackUrl(signedUrl)
                    } catch {
                      setPlaybackError('Unable to start playback.')
                    } finally {
                      setIsFetchingPlayback(false)
                    }
                  }}
                >
                  {isFetchingPlayback ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" fill="currentColor" />
                      Watch
                    </>
                  )}
                </Button>
              )}

              {(purchaseError || playbackError) && (
                <div className="flex items-center gap-2 text-xs text-destructive-foreground justify-center">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{purchaseError || playbackError}</span>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
