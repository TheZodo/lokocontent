'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { HeroCarousel } from '@/components/lokocontent/hero-carousel'
import { Swimlane } from '@/components/lokocontent/swimlane'
import { ContentModal } from '@/components/lokocontent/content-modal'
import { Skeleton } from '@/components/ui/skeleton'
import type { VideoContent } from '@/lib/lokocontent-data'
import { mapApiContentToVideoContent } from '@/lib/content-mappers'
import {
  getContentById,
  getFeaturedContent,
  getNewReleases,
  getTrendingContent,
  searchContent,
} from '@/api/requests/content'
import { useApiQuery } from '@/api/query'

const buildFilters = (region: string, category: string) => ({
  ...(region && region !== 'all' ? { region } : null),
  ...(category && category !== 'all' ? { category } : null),
})

const SwimlaneSkeleton = ({
  title,
  count = 6,
}: {
  title: string
  count?: number
}) => (
  <section className="relative">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`swimlane-skeleton-${title}-${index}`} className="w-[200px]">
          <Skeleton className="aspect-3/4 w-full rounded-lg mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </section>
)

const HeroSkeleton = () => (
  <section className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden">
    <Skeleton className="absolute inset-0" />
    <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-2xl space-y-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>
    </div>
  </section>
)

function BrowsePageContent() {
  const searchParams = useSearchParams()
  const { getToken, isSignedIn } = useAuth()
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  const searchQuery = (searchParams.get('q') ?? '').trim()
  const region = searchParams.get('region') ?? 'all'
  const category = searchParams.get('category') ?? 'all'
  const filters = buildFilters(region, category)

  const featuredQuery = useApiQuery(['content', 'featured'], (api) =>
    getFeaturedContent(api),
  )

  const trendingQuery = useApiQuery(
    ['content', 'trending', region, category],
    (api) => getTrendingContent(api, { ...filters, limit: 12 }),
  )

  const newReleasesQuery = useApiQuery(
    ['content', 'new-releases', region, category],
    (api) => getNewReleases(api, { ...filters, limit: 12 }),
  )

  const shortFilmsQuery = useApiQuery(
    ['content', 'short-films', region],
    (api) =>
      getTrendingContent(api, {
        ...filters,
        category: 'short-films',
        limit: 12,
      }),
  )

  const searchResultsQuery = useApiQuery(
    ['content', 'search', searchQuery, region, category],
    (api) =>
      searchContent(api, {
        q: searchQuery,
        ...filters,
        limit: 20,
      }),
    {
      enabled: Boolean(searchQuery),
    },
  )

  const contentDetailsQuery = useApiQuery(
    ['content', 'details', selectedVideoId],
    async (api) => {
      if (!selectedVideoId) {
        throw new Error('Missing content id')
      }
      const token = isSignedIn ? await getToken() : null
      return getContentById(api, selectedVideoId, { token })
    },
    {
      enabled: Boolean(selectedVideoId),
    },
  )

  const featuredItems = useMemo(
    () => (featuredQuery.data ?? []).map(mapApiContentToVideoContent),
    [featuredQuery.data],
  )
  const trendingItems = useMemo(
    () => (trendingQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [trendingQuery.data],
  )
  const newReleaseItems = useMemo(
    () => (newReleasesQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [newReleasesQuery.data],
  )
  const shortFilmItems = useMemo(
    () => (shortFilmsQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [shortFilmsQuery.data],
  )
  const searchItems = useMemo(
    () =>
      (searchResultsQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [searchResultsQuery.data],
  )

  useEffect(() => {
    if (contentDetailsQuery.data && selectedVideoId) {
      setSelectedVideo(mapApiContentToVideoContent(contentDetailsQuery.data))
    }
  }, [contentDetailsQuery.data, selectedVideoId])

  const handleVideoClick = (video: VideoContent) => {
    setSelectedVideo(video)
    setSelectedVideoId(video.id)
  }

  const handleCloseModal = () => {
    setSelectedVideo(null)
    setSelectedVideoId(null)
  }

  const renderSwimlane = (
    title: string,
    query: { isLoading: boolean; isError: boolean },
    items: VideoContent[],
  ) => {
    if (query.isLoading) {
      return <SwimlaneSkeleton title={title} />
    }
    if (query.isError) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load {title.toLowerCase()}.
        </div>
      )
    }
    if (!items.length) {
      return (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          No content found for {title.toLowerCase()}.
        </div>
      )
    }
    return (
      <Swimlane title={title} videos={items} onVideoClick={handleVideoClick} />
    )
  }

  return (
    <>
      <div className="px-4 lg:px-6 py-6">
        <div className="space-y-10">
          {searchQuery && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                Search results for “{searchQuery}”
              </h2>
              {searchResultsQuery.isLoading && (
                <SwimlaneSkeleton title="Search Results" count={8} />
              )}
              {searchResultsQuery.isError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
                  Failed to load search results.
                </div>
              )}
              {!searchResultsQuery.isLoading &&
                !searchResultsQuery.isError &&
                (searchItems.length ? (
                  <Swimlane
                    title="Search Results"
                    videos={searchItems}
                    onVideoClick={handleVideoClick}
                  />
                ) : (
                  <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
                    No results found. Try adjusting your filters.
                  </div>
                ))}
            </div>
          )}

          {featuredQuery.isLoading && <HeroSkeleton />}
          {featuredQuery.isError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              Failed to load featured content.
            </div>
          )}
          {!featuredQuery.isLoading &&
            !featuredQuery.isError &&
            featuredItems.length > 0 && (
              <HeroCarousel
                items={featuredItems}
                onItemClick={handleVideoClick}
              />
            )}

          {renderSwimlane('Trending Now', trendingQuery, trendingItems)}
          {renderSwimlane('New Releases', newReleasesQuery, newReleaseItems)}
          {renderSwimlane('Short Films', shortFilmsQuery, shortFilmItems)}
        </div>
      </div>

      {selectedVideo && (
        <ContentModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

const BrowsePageFallback = () => (
  <div className="px-4 lg:px-6 py-6 space-y-10">
    <HeroSkeleton />
    <SwimlaneSkeleton title="Trending" />
    <SwimlaneSkeleton title="New Releases" />
  </div>
)

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowsePageFallback />}>
      <BrowsePageContent />
    </Suspense>
  )
}
