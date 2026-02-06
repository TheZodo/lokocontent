import type { Follow, User } from "@lokocontent/db";

import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type FollowsResponse = {
  data: User[];
  total: number;
};

export type FollowResponse = {
  id: Follow["id"];
  createdAt: Follow["createdAt"];
};

export async function followCreator(
  api: ApiClient,
  creatorId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<FollowResponse>> {
  return api.post(`/follows/${creatorId}`, undefined, { ...options, auth: true });
}

export async function unfollowCreator(
  api: ApiClient,
  creatorId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.del(`/follows/${creatorId}`, { ...options, auth: true });
}

export async function getFollowing(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<FollowsResponse>> {
  return api.get("/follows/following", { ...options, auth: true });
}

export async function getFollowers(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<FollowsResponse>> {
  return api.get("/follows/followers", { ...options, auth: true });
}
