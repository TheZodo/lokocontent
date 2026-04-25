import type { VideoContent } from '@/lib/lokocontent-data'

/**
 * True when list/detail payload suggests the user can open /watch/[id] without
 * going through the purchase modal first. Matches the gate on the watch page
 * before getPlaybackUrl (premium requires isOwned).
 */
export function canNavigateDirectToWatch(video: VideoContent): boolean {
  if (!video.muxPlaybackId) return false
  if (video.isPremium && !video.isOwned) return false
  return true
}
