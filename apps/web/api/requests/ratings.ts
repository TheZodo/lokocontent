import type { Rating } from "@lokocontent/db";

import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type CreateRatingInput = {
  rating: Rating["rating"];
};

export type RatingSummary = {
  averageRating: number;
  ratingCount: number;
};

export async function rateContent(
  api: ApiClient,
  contentId: string,
  body: CreateRatingInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<RatingSummary>> {
  return api.post(`/ratings/${contentId}`, body, { ...options, auth: true });
}

export async function removeRating(
  api: ApiClient,
  contentId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.del(`/ratings/${contentId}`, { ...options, auth: true });
}
