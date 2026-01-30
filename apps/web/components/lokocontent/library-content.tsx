"use client";

import { useState } from "react";
import {
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  Star,
  Film,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type VideoContent, regions, categories } from "@/lib/lokocontent-data";
import { EditContentModal } from "./edit-content-modal";

// Extended type for user's uploaded content
interface UserContent extends VideoContent {
  status: "published" | "draft" | "processing" | "hidden";
  earnings: number;
  uploadDate: string;
}

// Mock user uploads data
const mockUserUploads: UserContent[] = [
  {
    id: "user-1",
    title: "My Journey Through Lagos",
    creator: "You",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 24m",
    rating: 4.6,
    isPremium: true,
    region: "nollywood",
    category: "documentaries",
    synopsis:
      "A personal documentary exploring the vibrant streets, culture, and people of Lagos, Nigeria.",
    views: "12.4K",
    releaseYear: 2024,
    status: "published",
    earnings: 245.5,
    uploadDate: "2024-11-15",
  },
  {
    id: "user-2",
    title: "The Market Woman",
    creator: "You",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "32m",
    rating: 4.8,
    isPremium: true,
    region: "ghana",
    category: "short-films",
    synopsis:
      "A touching short film about a market woman's daily struggles and triumphs in Accra.",
    views: "8.2K",
    releaseYear: 2024,
    status: "published",
    earnings: 178.25,
    uploadDate: "2024-10-22",
  },
  {
    id: "user-3",
    title: "Sounds of the Savanna",
    creator: "You",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "45m",
    rating: 0,
    isPremium: false,
    region: "tanzania",
    category: "documentaries",
    synopsis:
      "An audio-visual journey through the Serengeti, capturing the sounds of African wildlife.",
    views: "0",
    releaseYear: 2025,
    status: "draft",
    earnings: 0,
    uploadDate: "2025-01-10",
  },
  {
    id: "user-4",
    title: "Nairobi Nights",
    creator: "You",
    thumbnail: "/placeholder.svg?height=400&width=300",
    duration: "1h 05m",
    rating: 4.3,
    isPremium: true,
    region: "riverwood",
    category: "drama",
    synopsis:
      "A gripping drama set in the nightlife of Nairobi, exploring themes of ambition and identity.",
    views: "5.1K",
    releaseYear: 2024,
    status: "hidden",
    earnings: 89.0,
    uploadDate: "2024-09-05",
  },
];

type TabType = "all" | "published" | "drafts" | "hidden";
type SortType = "recent" | "views" | "earnings" | "rating";

export function LibraryContent() {
  const [uploads, setUploads] = useState<UserContent[]>(mockUserUploads);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [editingContent, setEditingContent] = useState<UserContent | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: uploads.length },
    {
      id: "published",
      label: "Published",
      count: uploads.filter((u) => u.status === "published").length,
    },
    {
      id: "drafts",
      label: "Drafts",
      count: uploads.filter((u) => u.status === "draft").length,
    },
    {
      id: "hidden",
      label: "Hidden",
      count: uploads.filter((u) => u.status === "hidden").length,
    },
  ];

  const filteredUploads = uploads.filter((upload) => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return upload.status === "published";
    if (activeTab === "drafts") return upload.status === "draft";
    if (activeTab === "hidden") return upload.status === "hidden";
    return true;
  });

  const sortedUploads = [...filteredUploads].sort((a, b) => {
    switch (sortBy) {
      case "views":
        return parseViews(b.views) - parseViews(a.views);
      case "earnings":
        return b.earnings - a.earnings;
      case "rating":
        return b.rating - a.rating;
      case "recent":
      default:
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    }
  });

  const handleSaveContent = async (updatedContent: VideoContent) => {
    // Stub: Save to backend
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === updatedContent.id
          ? { ...upload, ...updatedContent }
          : upload
      )
    );
  };

  const handleToggleVisibility = (contentId: string) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === contentId
          ? {
              ...upload,
              status: upload.status === "hidden" ? "published" : "hidden",
            }
          : upload
      )
    );
    setOpenMenuId(null);
  };

  const handleDeleteContent = (contentId: string) => {
    // In real app, show confirmation dialog
    setUploads((prev) => prev.filter((upload) => upload.id !== contentId));
    setOpenMenuId(null);
  };

  const getRegionName = (regionId: string) => {
    return regions.find((r) => r.id === regionId)?.name || regionId;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const totalEarnings = uploads.reduce((sum, u) => sum + u.earnings, 0);
  const totalViews = uploads.reduce((sum, u) => sum + parseViews(u.views), 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-xl bg-loko-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-loko-gold/10">
              <Film className="w-5 h-5 text-loko-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uploads.length}</p>
              <p className="text-sm text-muted-foreground">Total Uploads</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-loko-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-loko-teal/10">
              <Eye className="w-5 h-5 text-loko-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatViews(totalViews)}
              </p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-loko-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-loko-purple/10">
              <DollarSign className="w-5 h-5 text-loko-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-loko-gold text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-2 px-1.5 py-0.5 text-xs rounded-full",
                  activeTab === tab.id ? "bg-background/20" : "bg-muted"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3 py-1.5 bg-secondary rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 appearance-none cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="views">Most Views</option>
            <option value="earnings">Highest Earnings</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {sortedUploads.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No content found
          </h3>
          <p className="text-muted-foreground">
            {activeTab === "all"
              ? "Start uploading your African stories to the world."
              : `No ${activeTab} content yet.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedUploads.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              isMenuOpen={openMenuId === content.id}
              onMenuToggle={() =>
                setOpenMenuId(openMenuId === content.id ? null : content.id)
              }
              onEdit={() => {
                setEditingContent(content);
                setOpenMenuId(null);
              }}
              onToggleVisibility={() => handleToggleVisibility(content.id)}
              onDelete={() => handleDeleteContent(content.id)}
              getRegionName={getRegionName}
              getCategoryName={getCategoryName}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingContent && (
        <EditContentModal
          content={editingContent}
          isOpen={!!editingContent}
          onClose={() => setEditingContent(null)}
          onSave={handleSaveContent}
        />
      )}
    </div>
  );
}

// Content Card Component
interface ContentCardProps {
  content: UserContent;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  getRegionName: (id: string) => string;
  getCategoryName: (id: string) => string;
}

function ContentCard({
  content,
  isMenuOpen,
  onMenuToggle,
  onEdit,
  onToggleVisibility,
  onDelete,
  getRegionName,
  getCategoryName,
}: ContentCardProps) {
  return (
    <div className="rounded-xl bg-loko-surface border border-border overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={content.thumbnail || "/placeholder.svg"}
          alt={content.title}
          className={cn(
            "w-full h-full object-cover transition-opacity",
            content.status === "hidden" && "opacity-50"
          )}
        />

        {/* Status Badge */}
        <div
          className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium",
            content.status === "published" && "bg-loko-teal/90 text-background",
            content.status === "draft" && "bg-secondary text-foreground",
            content.status === "hidden" && "bg-muted text-muted-foreground",
            content.status === "processing" && "bg-loko-gold/90 text-background"
          )}
        >
          {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
        </div>

        {/* Premium Badge */}
        {content.isPremium && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-loko-gold/90 text-background text-xs font-medium">
            Premium
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-background/80 text-foreground text-xs">
          {content.duration}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground line-clamp-1">{content.title}</h3>
          {/* Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={onMenuToggle}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 py-1 rounded-lg bg-popover border border-border shadow-xl z-10">
                <button
                  type="button"
                  onClick={onEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onToggleVisibility}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  {content.status === "hidden" ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Make Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{getRegionName(content.region)}</span>
          <span>|</span>
          <span>{getCategoryName(content.category)}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{content.views}</span>
          </div>

          {content.rating > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-loko-gold fill-loko-gold" />
              <span className="text-foreground">{content.rating}</span>
            </div>
          )}

          {content.isPremium && content.earnings > 0 && (
            <div className="flex items-center gap-1 text-sm ml-auto">
              <DollarSign className="w-4 h-4 text-loko-teal" />
              <span className="text-loko-teal">{content.earnings.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Upload Date */}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Uploaded {formatDate(content.uploadDate)}</span>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function parseViews(views: string): number {
  if (views.endsWith("K")) return parseFloat(views) * 1000;
  if (views.endsWith("M")) return parseFloat(views) * 1000000;
  return parseInt(views) || 0;
}

function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return views.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
