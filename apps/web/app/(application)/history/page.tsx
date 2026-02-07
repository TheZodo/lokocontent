"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Clock, Trash2, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { VideoCard } from "@/components/lokocontent/video-card";
import { ContentModal } from "@/components/lokocontent/content-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoContent } from "@/lib/lokocontent-data";
import { mapApiContentToVideoContent } from "@/lib/content-mappers";
import {
  clearWatchHistory,
  removeHistoryItem,
  getWatchHistory,
} from "@/api/requests/history";
import { getContentById } from "@/api/requests/content";
import { useApiMutation, useApiQuery } from "@/api/query";

type HistoryEntry = {
  content: VideoContent;
  progress: number;
  lastWatchedAt: string;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatRelativeLabel = (date: Date) => {
  const now = startOfDay(new Date());
  const entry = startOfDay(date);
  const diffMs = now.getTime() - entry.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return "This Week";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const HistorySkeleton = () => (
  <div className="space-y-8">
    {Array.from({ length: 2 }).map((_, sectionIndex) => (
      <div key={`history-skeleton-section-${sectionIndex}`}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((__, index) => (
            <div key={`history-skeleton-card-${sectionIndex}-${index}`}>
              <Skeleton className="aspect-[3/4] w-full rounded-lg mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function HistoryPage() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const historyQuery = useApiQuery(["history", "list"], (api) =>
    getWatchHistory(api, { limit: 24, offset: 0 })
  );

  const clearHistoryMutation = useApiMutation(
    (api) => clearWatchHistory(api),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["history", "list"] });
      },
    }
  );

  const removeHistoryItemMutation = useApiMutation(
    (api, contentId: string) => removeHistoryItem(api, contentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["history", "list"] });
      },
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
    { enabled: Boolean(selectedVideoId) }
  );

  const historyItems = useMemo<HistoryEntry[]>(() => {
    const items = historyQuery.data?.data ?? [];
    return items.map((entry) => {
      const mapped = mapApiContentToVideoContent(entry.content);
      return {
        content: mapped,
        progress: entry.progress,
        lastWatchedAt: entry.lastWatchedAt,
      };
    });
  }, [historyQuery.data]);

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, HistoryEntry[]>();
    historyItems.forEach((entry) => {
      const date = new Date(entry.lastWatchedAt);
      const label = formatRelativeLabel(date);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(entry);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [historyItems]);

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

  return (
    <>
      <div className="px-4 lg:px-6 py-6">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-loko-teal/10">
                <History className="w-6 h-6 text-loko-teal" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Watch History
              </h1>
            </div>
            <p className="text-muted-foreground">
              Continue watching where you left off
            </p>
          </div>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 bg-transparent"
            onClick={() => clearHistoryMutation.mutate(undefined)}
            disabled={clearHistoryMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {clearHistoryMutation.isPending ? "Clearing..." : "Clear History"}
          </Button>
        </div>

        {historyQuery.isLoading && (
          <HistorySkeleton />
        )}

        {historyQuery.isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            Failed to load watch history.
          </div>
        )}

        {!historyQuery.isLoading && !historyQuery.isError && (
          <div className="space-y-10">
            {groupedHistory.length === 0 && (
              <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
                Your watch history is empty.
              </div>
            )}
            {groupedHistory.map((section) => (
              <div key={section.label}>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {section.label}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {section.items.map((item) => (
                    <div key={`${section.label}-${item.content.id}`} className="relative">
                      <VideoCard
                        video={item.content}
                        onClick={() => handleVideoClick(item.content)}
                      />
                      <button
                        type="button"
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeHistoryItemMutation.mutate(item.content.id);
                        }}
                        aria-label="Remove from history"
                        disabled={removeHistoryItemMutation.isPending}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {/* Progress bar */}
                      {item.progress < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
                          <div
                            className="h-full bg-loko-gold"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {/* Time badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-background/90 backdrop-blur-sm text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(item.lastWatchedAt))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
