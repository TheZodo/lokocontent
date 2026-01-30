"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Star, Lock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { VideoContent } from "@/lib/lokocontent-data";

interface HeroCarouselProps {
  items: VideoContent[];
  onItemClick?: (video: VideoContent) => void;
}

export function HeroCarousel({ items, onItemClick }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % items.length);
  };

  const currentItem = items[activeIndex];

  return (
    <section className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={currentItem.thumbnail || "/placeholder.svg"}
          alt={currentItem.title}
          fill
          className="object-cover transition-transform duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-2xl">
        {/* Premium Badge */}
        {currentItem.isPremium && (
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 rounded-full bg-loko-gold/20 border border-loko-gold/30 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-loko-gold text-sm font-medium">
                <Lock className="w-3.5 h-3.5" />
                Premium
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3 text-balance">
          {currentItem.title}
        </h2>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-loko-gold" fill="currentColor" />
            <span className="text-foreground font-medium">
              {currentItem.rating}
            </span>
          </div>
          <span>{currentItem.releaseYear}</span>
          <span>{currentItem.duration}</span>
          <span>{currentItem.views} views</span>
        </div>

        {/* Synopsis */}
        <p className="text-muted-foreground text-sm md:text-base mb-6 line-clamp-2 text-pretty">
          {currentItem.synopsis}
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onItemClick?.(currentItem)}
            className="bg-loko-gold hover:bg-loko-gold/90 text-background font-semibold px-6 py-5"
          >
            <Play className="w-5 h-5 mr-2" fill="currentColor" />
            Watch Now
          </Button>
          <Button
            variant="outline"
            onClick={() => onItemClick?.(currentItem)}
            className="border-foreground/20 text-foreground hover:bg-foreground/10 px-6 py-5"
          >
            More Info
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 right-6 md:right-10 flex items-center gap-2">
        {items.map((_, index) => (
          <button
            key={`indicator-${items[index].id}`}
            type="button"
            onClick={() => goToSlide(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-8 bg-loko-gold"
                : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
