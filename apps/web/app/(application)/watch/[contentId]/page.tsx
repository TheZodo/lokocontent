'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import MuxPlayer from '@mux/mux-player-react'
import { ArrowLeft, Lock, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/api/use-api-client'
import { unwrapApiResponse } from '@/api/client'
import { getContentById } from '@/api/requests/content'
import { getPlaybackUrl } from '@/api/requests/mux'
import { updateWatchProgress } from '@/api/requests/history'
import { mapApiContentToVideoContent } from '@/lib/content-mappers'
import type { VideoContent } from '@/lib/lokocontent-data'
import { UnlockButton } from '@/components/lokocontent/unlock-button'
import { createPurchase } from '@/api/requests/purchases'
import { PaymentProvider } from '@lokocontent/db'

type WatchState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'forbidden'; content: VideoContent }
  | { status: 'ready'; content: VideoContent }

const HISTORY_THROTTLE_MS = 10_000
const HISTORY_PROGRESS_DELTA = 5

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const api = useApiClient()
  const { getToken, isSignedIn, userId } = useAuth()
  const contentId = typeof params?.contentId === 'string' ? params.contentId : null

  const [state, setState] = useState<WatchState>({ status: 'loading' })
  const lastHistorySentAt = useRef(0)
  const lastHistoryProgress = useRef(0)
  const playerRef = useRef<HTMLMediaElement | null>(null)

  const pushWatchProgress = useCallback(
    async (progress: number, force: boolean) => {
      if (!isSignedIn || !contentId) return
      const now = Date.now()
      const elapsed = now - lastHistorySentAt.current
      const progressDelta = Math.abs(progress - lastHistoryProgress.current)
      if (!force && elapsed < HISTORY_THROTTLE_MS && progressDelta < HISTORY_PROGRESS_DELTA) {
        return
      }
      lastHistorySentAt.current = now
      lastHistoryProgress.current = progress
      try {
        await updateWatchProgress(api, contentId, { progress })
      } catch {
        // Best-effort
      }
    },
    [api, contentId, isSignedIn]
  )

  useEffect(() => {
    if (!contentId) {
      setState({ status: 'not_found' })
      return
    }

    let cancelled = false

    const load = async () => {
      const token = isSignedIn ? await getToken() : null
      try {
        const contentRes = await getContentById(api, contentId, { token })
        const raw = unwrapApiResponse(contentRes).data
        const content = mapApiContentToVideoContent(raw)
        if (cancelled) return
        if (!content.muxPlaybackId) {
          setState({ status: 'not_found' })
          return
        }
        const isLocked = content.isPremium && !content.isOwned
        if (isLocked) {
          setState({ status: 'forbidden', content })
          return
        }
        try {
          await getPlaybackUrl(api, content.muxPlaybackId, { token })
        } catch {
          if (cancelled) return
          setState({ status: 'forbidden', content })
          return
        }
        if (cancelled) return
        setState({ status: 'ready', content })
      } catch {
        if (!cancelled) setState({ status: 'not_found' })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [contentId, api, isSignedIn, getToken])

  const handleTimeUpdate = useCallback(() => {
    const el = playerRef.current
    if (!el || typeof el.currentTime !== 'number' || !Number.isFinite(el.duration) || el.duration <= 0) return
    const percent = Math.round((el.currentTime / el.duration) * 100)
    const clamped = Math.max(0, Math.min(100, percent))
    pushWatchProgress(clamped, false)
  }, [pushWatchProgress])

  const handlePause = useCallback(() => {
    const el = playerRef.current
    if (!el || typeof el.currentTime !== 'number' || !Number.isFinite(el.duration) || el.duration <= 0) return
    const percent = Math.round((el.currentTime / el.duration) * 100)
    pushWatchProgress(Math.max(0, Math.min(100, percent)), true)
  }, [pushWatchProgress])

  const handleEnded = useCallback(() => {
    pushWatchProgress(100, true)
  }, [pushWatchProgress])

  if (!contentId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Invalid watch URL.</p>
        <Button asChild variant="outline">
          <Link href="/browse">Back to Browse</Link>
        </Button>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (state.status === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Content not found.</p>
        <Button asChild variant="outline">
          <Link href="/browse">Back to Browse</Link>
        </Button>
      </div>
    )
  }

  if (state.status === 'forbidden') {
    const { content } = state
    const formattedPrice =
      content.price !== undefined && content.price !== null
        ? `$${content.price.toFixed(2)}`
        : '$4.99'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">{content.title}</h1>
          <p className="text-muted-foreground">
            This is premium content. Purchase access to watch in full.
          </p>
        </div>
        <UnlockButton
          price={formattedPrice}
          onClick={async () => {
            try {
              const token = isSignedIn ? await getToken() : null
              const response = await createPurchase(api, {
                contentId: content.id,
                paymentProvider: PaymentProvider.STRIPE,
              })
              const { checkoutUrl } = unwrapApiResponse(response).data
              if (typeof window !== 'undefined') {
                window.location.assign(checkoutUrl)
              }
            } catch {
              // Error could be shown via toast
            }
          }}
        />
        <Button asChild variant="ghost" size="sm">
          <Link href="/browse" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Link>
        </Button>
      </div>
    )
  }

  const { content } = state
  const playbackId = content.muxPlaybackId!

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm border-b border-border">
        <Button asChild variant="ghost" size="icon" aria-label="Back to browse">
          <Link href="/browse">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-sm font-medium truncate flex-1" title={content.title}>
          {content.title}
        </h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden">
          <MuxPlayer
            ref={playerRef}
            playbackId={playbackId}
            metadata={{
              video_title: content.title,
              viewer_user_id: userId ?? undefined,
            }}
            accentColor="#D4AF37"
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handleEnded}
            streamType="on-demand"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
