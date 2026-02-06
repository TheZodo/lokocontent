import type { VideoContent, WatchHistory } from "@lokocontent/db";

import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type HistoryEntry = {
  content: VideoContent;
  progress: WatchHistory["progress"];
  lastWatchedAt: WatchHistory["lastWatchedAt"];
};

export type HistoryResponse = {
  data: HistoryEntry[];
  total: number;
};

export async function getWatchHistory(
  api: ApiClient,
  params?: { limit?: number; offset?: number },
  options?: ApiRequestOptions
): Promise<ApiResponse<HistoryResponse>> {
  return api.get("/history", {
    ...options,
    auth: true,
    query: params,
  });
}

export async function updateWatchProgress(
  api: ApiClient,
  contentId: string,
  body: { progress: WatchHistory["progress"] },
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.post(`/history/${contentId}`, body, { ...options, auth: true });
}

export async function clearWatchHistory(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.del("/history", { ...options, auth: true });
}

export async function removeHistoryItem(
  api: ApiClient,
  contentId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.del(`/history/${contentId}`, { ...options, auth: true });
}
