import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type MuxUploadRequest = {
  type?: "video" | "trailer";
  corsOrigin?: string;
};

export type MuxUploadResponse = {
  uploadUrl: string;
  uploadId: string;
};

export type MuxUploadStatusResponse = {
  id: string;
  status: string;
  assetId?: string | null;
  playbackId?: string | null;
};

export type PlaybackResponse = {
  playbackUrl: string;
  expiresAt: Date;
};

export async function createMuxUploadUrl(
  api: ApiClient,
  body?: MuxUploadRequest,
  options?: ApiRequestOptions
): Promise<ApiResponse<MuxUploadResponse>> {
  return api.post("/mux/upload-url", body, { ...options, auth: true });
}

export async function getMuxUploadStatus(
  api: ApiClient,
  uploadId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<MuxUploadStatusResponse>> {
  return api.get(`/mux/upload/${uploadId}`, { ...options, auth: true });
}

export async function getPlaybackUrl(
  api: ApiClient,
  playbackId: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<PlaybackResponse>> {
  return api.get(`/mux/playback/${playbackId}`, { ...options, auth: true });
}
