'use client'

import {
  type ComponentRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useParams } from 'next/navigation'
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
import { cn } from '@/lib/utils'

type WatchState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'forbidden'; content: VideoContent }
  | { status: 'ready'; content: VideoContent }

const HISTORY_THROTTLE_MS = 10_000
const HISTORY_PROGRESS_DELTA = 5

function WatchChromeShell({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-black text-white">
      <header
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20 flex shrink-0 items-center gap-2',
          'bg-gradient-to-b from-black/85 via-black/40 to-transparent px-2 pb-10 pt-2 sm:px-3 sm:pt-3',
        )}
      >
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0 text-white hover:bg-white/10 hover:text-white"
            aria-label="Back to browse"
          >
            <Link href="/browse">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          {title ? (
            <h1 className="truncate text-sm font-medium text-white/95 sm:text-base" title={title}>
              {title}
            </h1>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  )
}

export default function WatchPage() {
  const params = useParams()
  const api = useApiClient()
  const { getToken, isSignedIn, userId } = useAuth()
  const contentId = typeof params?.contentId === 'string' ? params.contentId : null

  const [state, setState] = useState<WatchState>({ status: 'loading' })
  const lastHistorySentAt = useRef(0)
  const lastHistoryProgress = useRef(0)
  const playerRef = useRef<ComponentRef<typeof MuxPlayer> | null>(null)

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
    [api, contentId, isSignedIn],
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
    if (!el || typeof el.currentTime !== 'number' || !Number.isFinite(el.duration) || el.duration <= 0)
      return
    const percent = Math.round((el.currentTime / el.duration) * 100)
    const clamped = Math.max(0, Math.min(100, percent))
    pushWatchProgress(clamped, false)
  }, [pushWatchProgress])

  const handlePause = useCallback(() => {
    const el = playerRef.current
    if (!el || typeof el.currentTime !== 'number' || !Number.isFinite(el.duration) || el.duration <= 0)
      return
    const percent = Math.round((el.currentTime / el.duration) * 100)
    pushWatchProgress(Math.max(0, Math.min(100, percent)), true)
  }, [pushWatchProgress])

  const handleEnded = useCallback(() => {
    pushWatchProgress(100, true)
  }, [pushWatchProgress])

  if (!contentId) {
    return (
      <WatchChromeShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-zinc-400">Invalid watch URL.</p>
          <Button asChild variant="outline" className="border-white/25 text-white hover:bg-white/10">
            <Link href="/browse">Back to Browse</Link>
          </Button>
        </div>
      </WatchChromeShell>
    )
  }

  if (state.status === 'loading') {
    return (
      <WatchChromeShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-400">Loading…</p>
        </div>
      </WatchChromeShell>
    )
  }

  if (state.status === 'not_found') {
    return (
      <WatchChromeShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-zinc-500" />
          <p className="text-sm text-zinc-400">Content not found.</p>
          <Button asChild variant="outline" className="border-white/25 text-white hover:bg-white/10">
            <Link href="/browse">Back to Browse</Link>
          </Button>
        </div>
      </WatchChromeShell>
    )
  }

  if (state.status === 'forbidden') {
    const { content } = state
    const formattedPrice =
      content.price !== undefined && content.price !== null
        ? `$${content.price.toFixed(2)}`
        : '$4.99'
    return (
      <WatchChromeShell title={content.title}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-auto p-6 text-center">
          <div className="flex max-w-md flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Lock className="h-8 w-8 text-zinc-300" />
            </div>
            <h1 className="text-xl font-semibold text-white">{content.title}</h1>
            <p className="text-sm text-zinc-400">
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
          <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:bg-white/10 hover:text-white">
            <Link href="/browse" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Browse
            </Link>
          </Button>
        </div>
      </WatchChromeShell>
    )
  }

  const { content } = state
  const playbackId = content.muxPlaybackId!

  return (
    <WatchChromeShell title={content.title}>
      <div className="relative flex min-h-0 flex-1 w-full items-center justify-center bg-black">
        <div className="absolute inset-0 flex items-center justify-center p-0">
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
            className="h-full w-full max-h-full max-w-full"
          />
        </div>
      </div>
    </WatchChromeShell>
  )
}
