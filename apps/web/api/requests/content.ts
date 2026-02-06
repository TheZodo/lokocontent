import type {
  ContentStatus,
  User,
  VideoContent,
} from "@lokocontent/db";

import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type ContentListResponse = {
  data: VideoContent[];
  total: number;
};

export type ContentDetails = VideoContent & {
  creator: Pick<User, "id" | "displayName" | "profilePicture">;
  isOwned: boolean;
  userRating: number | null;
};

export type CreateContentInput = {
  title: VideoContent["title"];
  synopsis: VideoContent["synopsis"];
  region: VideoContent["region"];
  category: VideoContent["category"];
  isPremium: VideoContent["isPremium"];
  price?: VideoContent["price"];
  releaseYear: VideoContent["releaseYear"];
  muxAssetId: VideoContent["muxAssetId"];
  muxPlaybackId: VideoContent["muxPlaybackId"];
  trailerMuxAssetId?: VideoContent["trailerMuxAssetId"];
  trailerMuxPlaybackId?: VideoContent["trailerMuxPlaybackId"];
  thumbnailUrl: VideoContent["thumbnail"];
  status: ContentStatus;
};

export type UpdateContentInput = {
  title?: VideoContent["title"];
  synopsis?: VideoContent["synopsis"];
  region?: VideoContent["region"];
  category?: VideoContent["category"];
  thumbnailUrl?: VideoContent["thumbnail"];
  status?: ContentStatus;
};

export type AnalyzeContentChangesInput = {
  title?: VideoContent["title"];
  synopsis?: VideoContent["synopsis"];
  region?: VideoContent["region"];
  category?: VideoContent["category"];
};

export type AnalyzeContentChangesResponse = {
  warnings: Array<{
    field: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export type SearchContentParams = {
  q: string;
  region?: string;
  category?: string;
  isPremium?: boolean;
  sortBy?: "recent" | "views" | "rating";
  limit?: number;
  offset?: number;
};

export type ContentListParams = {
  region?: string;
  category?: string;
  limit?: number;
  offset?: number;
};

export type CreatorUpload = VideoContent & { earnings: number };

export type CreatorUploadsResponse = {
  data: CreatorUpload[];
  total: number;
  totalViews: number;
  totalEarnings: number;
};

export async function getFeaturedContent(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<VideoContent[]>> {
  return api.get("/content/featured", options);
}

export async function getTrendingContent(
  api: ApiClient,
  params?: ContentListParams,
  options?: ApiRequestOptions
): Promise<ApiResponse<ContentListResponse>> {
  return api.get("/content/trending", { ...options, query: params });
}

export async function getNewReleases(
  api: ApiClient,
  params?: ContentListParams,
  options?: ApiRequestOptions
): Promise<ApiResponse<ContentListResponse>> {
  return api.get("/content/new-releases", { ...options, query: params });
}

export async function searchContent(
  api: ApiClient,
  params: SearchContentParams,
  options?: ApiRequestOptions
): Promise<ApiResponse<ContentListResponse>> {
  return api.get("/content/search", { ...options, query: params });
}

export async function getContentById(
  api: ApiClient,
  id: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<ContentDetails>> {
  return api.get(`/content/${id}`, options);
}

export async function createContent(
  api: ApiClient,
  body: CreateContentInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<VideoContent>> {
  return api.post("/content", body, { ...options, auth: true });
}

export async function getMyUploads(
  api: ApiClient,
  params?: {
    status?: ContentStatus;
    sortBy?: string;
    limit?: number;
    offset?: number;
  },
  options?: ApiRequestOptions
): Promise<ApiResponse<CreatorUploadsResponse>> {
  return api.get("/content/my-uploads", {
    ...options,
    auth: true,
    query: params,
  });
}

export async function updateContent(
  api: ApiClient,
  id: string,
  body: UpdateContentInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<VideoContent>> {
  return api.patch(`/content/${id}`, body, { ...options, auth: true });
}

export async function deleteContent(
  api: ApiClient,
  id: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.del(`/content/${id}`, { ...options, auth: true });
}

export async function analyzeContentChanges(
  api: ApiClient,
  id: string,
  body: AnalyzeContentChangesInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<AnalyzeContentChangesResponse>> {
  return api.post(`/content/${id}/analyze-changes`, body, {
    ...options,
    auth: true,
  });
}
