"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton, RedirectToSignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { regions, categories } from "@/lib/lokocontent-data";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  onRegionChange?: (region: string) => void;
  onCategoryChange?: (category: string) => void;
}

export function AppHeader({
  onRegionChange,
  onCategoryChange,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const handleRegionClick = (regionId: string) => {
    setActiveRegion(regionId);
    onRegionChange?.(regionId);
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setShowFilters(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        closeMobileSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const nextQuery = params.get("q") ?? "";
    const nextRegion = params.get("region") ?? "all";
    const nextCategory = params.get("category") ?? "all";

    setSearchQuery(nextQuery);
    setActiveRegion(nextRegion);
    setActiveCategory(nextCategory);
  }, [searchParamsString]);

  const submitSearch = () => {
    const trimmedQuery = searchQuery.trim();
    const params = new URLSearchParams();
    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }
    if (activeRegion && activeRegion !== "all") {
      params.set("region", activeRegion);
    }
    if (activeCategory && activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    const queryString = params.toString();
    const target = `/browse${queryString ? `?${queryString}` : ""}`;

    if (pathname !== "/browse") {
      router.push(target);
      return;
    }

    router.replace(target);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveRegion("all");
    setActiveCategory("all");
    onRegionChange?.("all");
    onCategoryChange?.("all");
    setShowFilters(false);
    setIsMobileSearchOpen(false);
    router.replace("/browse");
  };

  const FilterContent = () => (
    <div className="p-4">
      <div className="mb-4">
        <span className="text-xs text-muted-foreground font-medium block mb-2">
          Region
        </span>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => handleRegionClick(region.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                activeRegion === region.id
                  ? "bg-loko-gold text-background"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <span>{region.flag}</span>
              <span>{region.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs text-muted-foreground font-medium block mb-2">
          Category
        </span>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                activeCategory === category.id
                  ? "bg-loko-teal text-background"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="text-muted-foreground"
        >
          Clear All
        </Button>
        <Button
          size="sm"
          onClick={() => {
            submitSearch();
            setShowFilters(false);
            setIsMobileSearchOpen(false);
          }}
          className="bg-loko-gold hover:bg-loko-gold/90 text-background"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-md px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Desktop Search */}
        <div
          ref={searchRef}
          className="hidden md:block flex-1 max-w-2xl relative"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitSearch();
                }
              }}
              placeholder="Search movies, series, documentaries..."
              className="w-full pl-12 pr-12 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                showFilters
                  ? "bg-loko-gold/20 text-loko-gold"
                  : "hover:bg-secondary text-muted-foreground"
              )}
              aria-label="Toggle filters"
            >
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-xl border border-border shadow-xl">
              <FilterContent />
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile Search Icon */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden p-2.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>

          <button
            type="button"
            className="relative p-2.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-loko-gold rounded-full" />
          </button>

          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
          <SignedIn>
            <div className="flex items-center p-1.5 rounded-full hover:bg-secondary transition-colors">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeMobileSearch}
            onKeyDown={(e) => e.key === "Escape" && closeMobileSearch()}
            role="button"
            tabIndex={0}
            aria-label="Close search"
          />

          <div
            ref={mobileSearchRef}
            className="absolute top-4 left-4 right-4 bg-popover rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitSearch();
                    closeMobileSearch();
                  }
                }}
                placeholder="Search movies, series, documentaries..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={closeMobileSearch}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <span>Filters</span>
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showFilters && (
              <div className="border-t border-border">
                <FilterContent />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
