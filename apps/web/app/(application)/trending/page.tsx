"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Flame } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { VideoCard } from "@/components/lokocontent/video-card";
import { ContentModal } from "@/components/lokocontent/content-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoContent } from "@/lib/lokocontent-data";
import { mapApiContentToVideoContent } from "@/lib/content-mappers";
import { getContentById, getTrendingContent } from "@/api/requests/content";
import { useApiQuery } from "@/api/query";
import { canNavigateDirectToWatch } from "@/lib/watch-eligibility";

export default function TrendingPage() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const trendingQuery = useApiQuery(["content", "trending-page"], (api) =>
    getTrendingContent(api, { limit: 36 })
  );

  const contentDetailsQuery = useApiQuery(
    ["content", "details", selectedVideoId],
    async (api) => {
      if (!selectedVideoId) {
        throw new Error("Missing content id");
      }
      const token = isSignedIn ? await getToken() : null;
      return getContentById(api, selectedVideoId, { token });
    },
    { enabled: Boolean(selectedVideoId) }
  );

  const trendingItems = useMemo(
    () => (trendingQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [trendingQuery.data]
  );

  useEffect(() => {
    if (contentDetailsQuery.data && selectedVideoId) {
      setSelectedVideo(mapApiContentToVideoContent(contentDetailsQuery.data));
    }
  }, [contentDetailsQuery.data, selectedVideoId]);

  const handleVideoClick = (video: VideoContent) => {
    if (canNavigateDirectToWatch(video)) {
      router.push(`/watch/${video.id}`);
      return;
    }
    setSelectedVideo(video);
    setSelectedVideoId(video.id);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setSelectedVideoId(null);
  };

  return (
    <>
      <div className="px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-loko-gold/10">
              <Flame className="w-6 h-6 text-loko-gold" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Trending Now
            </h1>
          </div>
          <p className="text-muted-foreground">
            The most popular content across all of Africa right now
          </p>
        </div>

        {trendingQuery.isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={`trending-skeleton-${index}`} className="relative">
                <Skeleton className="aspect-[3/4] w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {trendingQuery.isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            Failed to load trending content.
          </div>
        )}

        {!trendingQuery.isLoading && !trendingQuery.isError && (
          <>
            {/* Trending Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingItems.map((video, index) => (
                <div key={video.id} className="relative">
                  {/* Ranking Badge */}
                  <div className="absolute -left-2 -top-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-loko-gold to-loko-deep-red flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <VideoCard
                    video={video}
                    onClick={() => handleVideoClick(video)}
                  />
                </div>
              ))}
            </div>

            {/* Trending Stats */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-loko-gold" />
                  <span className="text-sm text-muted-foreground">This Week</span>
                </div>
                <p className="text-2xl font-bold text-foreground">2.4M</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="w-5 h-5 text-loko-deep-red" />
                  <span className="text-sm text-muted-foreground">Hot Region</span>
                </div>
                <p className="text-2xl font-bold text-foreground">Nollywood</p>
                <p className="text-sm text-muted-foreground">Most Active</p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-loko-teal" />
                  <span className="text-sm text-muted-foreground">Top Genre</span>
                </div>
                <p className="text-2xl font-bold text-foreground">Drama</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedVideo && (
        <ContentModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
