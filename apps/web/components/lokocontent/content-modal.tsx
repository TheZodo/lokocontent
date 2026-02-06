"use client";

import { X, Star, Play, Clock, Globe, User, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UnlockButton } from "./unlock-button";
import type { VideoContent } from "@/lib/lokocontent-data";
import { regions } from "@/lib/lokocontent-data";

interface ContentModalProps {
  video: VideoContent;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentModal({ video, isOpen, onClose }: ContentModalProps) {
  if (!isOpen) return null;

  const region = regions.find((r) => r.id === video.region);
  const isLocked = video.isPremium && !video.isOwned;
  const creatorName = video.creator || "Lokocontent Creator";
  const formattedPrice =
    video.price !== undefined && video.price !== null
      ? `$${video.price.toFixed(2)}`
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-loko-surface border border-border shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/70 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Video Preview */}
          <div className="relative lg:w-3/5">
            {/* Video Thumbnail with Blur for Premium */}
            <div className="relative aspect-video lg:aspect-auto lg:h-full">
              <Image
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                fill
                className={`object-cover ${isLocked ? "blur-sm" : ""}`}
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-loko-surface via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-loko-surface lg:block hidden" />

              {/* Lock Overlay for Premium */}
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30">
                  <div className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center mb-4">
                    <Lock className="w-10 h-10 text-loko-gold" />
                  </div>
                  <span className="text-foreground font-semibold text-lg">
                    Premium Content
                  </span>
                </div>
              )}

              {/* Watch Trailer Button */}
              <div className="absolute bottom-6 left-6">
                <Button
                  variant="outline"
                  className="border-foreground/30 text-foreground bg-background/50 backdrop-blur-sm hover:bg-background/70"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Free Trailer
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="lg:w-2/5 p-6 lg:p-8 flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
            {/* Premium Badge */}
            {video.isPremium && (
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-full bg-loko-gold/20 border border-loko-gold/30">
                  <div className="flex items-center gap-1.5 text-loko-gold text-sm font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    {video.isOwned ? "Owned Premium" : "Premium"}
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 text-balance">
              {video.title}
            </h2>

            {/* Rating & Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-loko-gold" fill="currentColor" />
                <span className="text-foreground font-semibold">
                  {video.rating}
                </span>
                <span>/5</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{video.duration || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>
                  {region?.flag} {region?.name}
                </span>
              </div>
              <span>{video.releaseYear}</span>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-secondary/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-loko-teal to-loko-purple flex items-center justify-center">
                <User className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold text-foreground">{creatorName}</p>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Synopsis
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {video.synopsis}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8 text-sm">
              <div>
                <p className="text-muted-foreground">Views</p>
                <p className="font-semibold text-foreground">{video.views}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-semibold text-foreground capitalize">
                  {video.category.replace("-", " ")}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-auto space-y-4">
              {isLocked ? (
                <UnlockButton price={formattedPrice} onClick={() => {}} />
              ) : (
                <Button className="w-full bg-loko-gold hover:bg-loko-gold/90 text-background font-semibold py-6">
                  <Play className="w-5 h-5 mr-2" fill="currentColor" />
                  Watch Now
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
