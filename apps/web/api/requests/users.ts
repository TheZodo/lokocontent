import type { PayoutMethod, User } from "@lokocontent/db";

import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type UpdateProfileInput = {
  displayName?: User["displayName"];
  bio?: User["bio"];
  profilePicture?: User["profilePicture"];
};

export type UpdateSettingsInput = {
  emailNotifications?: User["emailNotifications"];
  newFollowerNotifications?: User["newFollowerNotifications"];
  contentUpdateNotifications?: User["contentUpdateNotifications"];
  earningsNotifications?: User["earningsNotifications"];
  watchHistoryEnabled?: User["watchHistoryEnabled"];
};

export type UpdatePayoutInput = {
  payoutMethod: PayoutMethod;
  payoutDetails: User["payoutDetails"];
};

export async function getCurrentUser(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<User>> {
  return api.get("/users/me", { ...options, auth: true });
}

export async function updateProfile(
  api: ApiClient,
  body: UpdateProfileInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<User>> {
  return api.patch("/users/me", body, { ...options, auth: true });
}

export async function updateSettings(
  api: ApiClient,
  body: UpdateSettingsInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<User>> {
  return api.patch("/users/me/settings", body, { ...options, auth: true });
}

export async function updatePayout(
  api: ApiClient,
  body: UpdatePayoutInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<{ success: boolean }>> {
  return api.patch("/users/me/payout", body, { ...options, auth: true });
}
