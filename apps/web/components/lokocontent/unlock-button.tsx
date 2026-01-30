"use client";

import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnlockButtonProps {
  price?: string;
  onClick?: () => void;
  className?: string;
}

export function UnlockButton({
  price = "$4.99",
  onClick,
  className,
}: UnlockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg p-[2px] transition-all duration-300 glow-gold glow-gold-hover",
        className
      )}
    >
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 gradient-border rounded-lg" />

      {/* Inner Button */}
      <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-background rounded-[6px] transition-all duration-300 group-hover:bg-background/90">
        {/* Shimmer Effect */}
        <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[6px]" />

        {/* Content */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-loko-gold to-loko-deep-red flex items-center justify-center">
            <Lock className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                Unlock Premium
              </span>
              <Sparkles className="w-4 h-4 text-loko-gold" />
            </div>
            <span className="text-sm text-muted-foreground">
              One-time payment of{" "}
              <span className="text-loko-gold font-semibold">{price}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
