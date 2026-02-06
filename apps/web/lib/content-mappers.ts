import type { VideoContent as DbVideoContent, User } from "@lokocontent/db";
import type { ContentDetails } from "@/api/requests/content";
import type { VideoContent } from "@/lib/lokocontent-data";

type CreatorSummary = Pick<User, "id" | "displayName" | "profilePicture">;

type ApiContent = DbVideoContent & {
  creator?: CreatorSummary;
  isOwned?: boolean;
  userRating?: number | null;
};

const DEFAULT_CREATOR_NAME = "Lokocontent Creator";
const DEFAULT_DURATION = "—";

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}M`;
  }
  if (value >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}K`;
  }
  return `${value}`;
};

const resolveReleaseYear = (content: DbVideoContent) => {
  if (content.releaseYear) {
    return content.releaseYear;
  }
  if (content.createdAt) {
    const date = new Date(content.createdAt);
    if (!Number.isNaN(date.getTime())) {
      return date.getFullYear();
    }
  }
  return new Date().getFullYear();
};

export const mapApiContentToVideoContent = (
  content: ApiContent | ContentDetails
): VideoContent => {
  const creator = "creator" in content ? content.creator : undefined;
  const creatorName = creator?.displayName || DEFAULT_CREATOR_NAME;

  const viewsCount = content.views ?? 0;

  return {
    id: content.id,
    title: content.title,
    creator: creatorName,
    creatorId: creator?.id ?? content.creatorId,
    creatorProfilePicture: creator?.profilePicture ?? null,
    thumbnail: content.thumbnail || "/placeholder.svg",
    duration: content.duration || DEFAULT_DURATION,
    rating: content.rating ?? 0,
    ratingCount: content.ratingCount ?? 0,
    isPremium: content.isPremium,
    region: content.region,
    category: content.category,
    synopsis: content.synopsis,
    views: formatCompactNumber(viewsCount),
    viewsCount,
    releaseYear: resolveReleaseYear(content),
    muxPlaybackId: content.muxPlaybackId ?? null,
    muxAssetId: content.muxAssetId ?? null,
    trailerMuxPlaybackId: content.trailerMuxPlaybackId ?? null,
    isOwned: "isOwned" in content ? content.isOwned : undefined,
    userRating: "userRating" in content ? content.userRating : undefined,
    price: content.price ?? null,
  };
};
