import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type MuxUploadResponse = {
  uploadUrl: string;
  uploadId: string;
};

export type PlaybackResponse = {
  playbackUrl: string;
  expiresAt: Date;
};

export async function createMuxUploadUrl(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<MuxUploadResponse>> {
  return api.post("/mux/upload-url", undefined, { ...options, auth: true });
}

export async function getPlaybackUrl(
  api: ApiClient,
  playbackId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<PlaybackResponse>> {
  return api.get(`/mux/playback/${playbackId}`, { ...options, auth: true });
}
