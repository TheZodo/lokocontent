import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type ThumbnailUploadRequest = {
  filename: string;
  contentType: string;
};

export type UploadThumbnailResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: Date;
};

export async function createThumbnailUpload(
  api: ApiClient,
  body: ThumbnailUploadRequest,
  options?: ApiRequestOptions
): Promise<ApiResponse<UploadThumbnailResponse>> {
  return api.post("/upload/thumbnail", body, { ...options, auth: true });
}
