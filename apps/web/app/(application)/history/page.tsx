"use client";

import { useState } from "react";
import { History, Clock, Trash2 } from "lucide-react";
import { VideoCard } from "@/components/lokocontent/video-card";
import { ContentModal } from "@/components/lokocontent/content-modal";
import { Button } from "@/components/ui/button";
import { trendingContent, newReleases, type VideoContent } from "@/lib/lokocontent-data";

// Mock watch history data
const watchHistory = [
  {
    date: "Today",
    items: trendingContent.slice(0, 3).map((v, i) => ({
      ...v,
      watchedAt: `${i + 1}h ago`,
      progress: Math.floor(Math.random() * 100),
    })),
  },
  {
    date: "Yesterday",
    items: newReleases.slice(0, 4).map((v, i) => ({
      ...v,
      watchedAt: "Yesterday",
      progress: Math.floor(Math.random() * 100),
    })),
  },
  {
    date: "This Week",
    items: [...trendingContent.slice(3, 5), ...newReleases.slice(4, 6)].map((v) => ({
      ...v,
      watchedAt: "3 days ago",
      progress: 100,
    })),
  },
];

export default function HistoryPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);

  const handleVideoClick = (video: VideoContent) => {
    setSelectedVideo(video);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
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
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        </div>

        {/* History Sections */}
        <div className="space-y-10">
          {watchHistory.map((section) => (
            <div key={section.date}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {section.date}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {section.items.map((item) => (
                  <div key={`${section.date}-${item.id}`} className="relative">
                    <VideoCard
                      video={item}
                      onClick={() => handleVideoClick(item)}
                    />
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
                      {item.watchedAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
