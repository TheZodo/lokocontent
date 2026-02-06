import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type UploadThumbnailResponse = {
  url: string;
};

export async function uploadThumbnail(
  api: ApiClient,
  file: File,
  options?: ApiRequestOptions
): Promise<ApiResponse<UploadThumbnailResponse>> {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload/thumbnail", formData, { ...options, auth: true });
}
