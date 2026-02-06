"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { HeroCarousel } from "@/components/lokocontent/hero-carousel";
import { Swimlane } from "@/components/lokocontent/swimlane";
import { ContentModal } from "@/components/lokocontent/content-modal";
import type { VideoContent } from "@/lib/lokocontent-data";
import { mapApiContentToVideoContent } from "@/lib/content-mappers";
import {
  getContentById,
  getFeaturedContent,
  getNewReleases,
  getTrendingContent,
  searchContent,
} from "@/api/requests/content";
import { useApiQuery } from "@/api/query";

const buildFilters = (region: string, category: string) => ({
  ...(region && region !== "all" ? { region } : null),
  ...(category && category !== "all" ? { category } : null),
});

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const { getToken, isSignedIn } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const searchQuery = (searchParams.get("q") ?? "").trim();
  const region = searchParams.get("region") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const filters = buildFilters(region, category);

  const featuredQuery = useApiQuery(["content", "featured"], (api) =>
    getFeaturedContent(api)
  );

  const trendingQuery = useApiQuery(
    ["content", "trending", region, category],
    (api) => getTrendingContent(api, { ...filters, limit: 12 })
  );

  const newReleasesQuery = useApiQuery(
    ["content", "new-releases", region, category],
    (api) => getNewReleases(api, { ...filters, limit: 12 })
  );

  const shortFilmsQuery = useApiQuery(
    ["content", "short-films", region],
    (api) =>
      getTrendingContent(api, {
        ...filters,
        category: "short-films",
        limit: 12,
      })
  );

  const searchResultsQuery = useApiQuery(
    ["content", "search", searchQuery, region, category],
    (api) =>
      searchContent(api, {
        q: searchQuery,
        ...filters,
        limit: 20,
      }),
    {
      enabled: Boolean(searchQuery),
    }
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
    {
      enabled: Boolean(selectedVideoId),
    }
  );

  const featuredItems = useMemo(
    () => (featuredQuery.data ?? []).map(mapApiContentToVideoContent),
    [featuredQuery.data]
  );
  const trendingItems = useMemo(
    () => (trendingQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [trendingQuery.data]
  );
  const newReleaseItems = useMemo(
    () => (newReleasesQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [newReleasesQuery.data]
  );
  const shortFilmItems = useMemo(
    () => (shortFilmsQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [shortFilmsQuery.data]
  );
  const searchItems = useMemo(
    () => (searchResultsQuery.data?.data ?? []).map(mapApiContentToVideoContent),
    [searchResultsQuery.data]
  );

  useEffect(() => {
    if (contentDetailsQuery.data && selectedVideoId) {
      setSelectedVideo(mapApiContentToVideoContent(contentDetailsQuery.data));
    }
  }, [contentDetailsQuery.data, selectedVideoId]);

  const handleVideoClick = (video: VideoContent) => {
    setSelectedVideo(video);
    setSelectedVideoId(video.id);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setSelectedVideoId(null);
  };

  const renderSwimlane = (
    title: string,
    query: { isLoading: boolean; isError: boolean },
    items: VideoContent[]
  ) => {
    if (query.isLoading) {
      return (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          Loading {title.toLowerCase()}…
        </div>
      );
    }
    if (query.isError) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load {title.toLowerCase()}.
        </div>
      );
    }
    if (!items.length) {
      return (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          No content found for {title.toLowerCase()}.
        </div>
      );
    }
    return (
      <Swimlane
        title={title}
        videos={items}
        onVideoClick={handleVideoClick}
      />
    );
  };

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
                <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
                  Searching content…
                </div>
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

          {featuredQuery.isLoading && (
            <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
              Loading featured content…
            </div>
          )}
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

          {renderSwimlane("Trending Now", trendingQuery, trendingItems)}
          {renderSwimlane("New Releases", newReleasesQuery, newReleaseItems)}
          {renderSwimlane("Short Films", shortFilmsQuery, shortFilmItems)}
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
  );
}
