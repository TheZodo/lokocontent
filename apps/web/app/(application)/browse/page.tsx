"use client";

import { useState } from "react";
import { HeroCarousel } from "@/components/lokocontent/hero-carousel";
import { Swimlane } from "@/components/lokocontent/swimlane";
import { ContentModal } from "@/components/lokocontent/content-modal";
import {
  featuredContent,
  trendingContent,
  newReleases,
  shortFilms,
  type VideoContent,
} from "@/lib/lokocontent-data";

export default function BrowsePage() {
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
        <div className="space-y-10">
          <HeroCarousel
            items={featuredContent}
            onItemClick={handleVideoClick}
          />

          <Swimlane
            title="Trending Now"
            videos={trendingContent}
            onVideoClick={handleVideoClick}
          />

          <Swimlane
            title="New Releases"
            videos={newReleases}
            onVideoClick={handleVideoClick}
          />

          <Swimlane
            title="Short Films"
            videos={shortFilms}
            onVideoClick={handleVideoClick}
          />
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
