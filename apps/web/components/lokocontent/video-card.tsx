"use client";

import { Lock, Play, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VideoContent } from "@/lib/lokocontent-data";

interface VideoCardProps {
  video: VideoContent;
  onClick?: () => void;
  className?: string;
}

export function VideoCard({ video, onClick, className }: VideoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex-shrink-0 w-[200px] cursor-pointer text-left",
        className
      )}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-loko-surface mb-3">
        <Image
          src={video.thumbnail || "/placeholder.svg"}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Premium Lock Badge */}
        {video.isPremium && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-loko-gold/90 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-4 h-4 text-background" />
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground">
          {video.duration}
        </div>

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-loko-gold/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-background ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-loko-gold transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground">{video.creator}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-loko-gold" fill="currentColor" />
            <span>{video.rating}</span>
          </div>
          <span>•</span>
          <span>{video.views} views</span>
        </div>
      </div>
    </button>
  );
}
