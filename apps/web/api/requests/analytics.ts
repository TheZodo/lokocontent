import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type AnalyticsOverview = {
  totalViews: number;
  totalEarnings: number;
  totalContent: number;
  averageRating: number;
  followersCount: number;
};

export type EarningsBreakdown = {
  date: string;
  amount: number;
  purchases: number;
};

export type EarningsResponse = {
  data: EarningsBreakdown[];
  total: number;
};

export async function getAnalyticsOverview(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<AnalyticsOverview>> {
  return api.get("/analytics/overview", { ...options, auth: true });
}

export async function getEarningsBreakdown(
  api: ApiClient,
  params: { period: "week" | "month" | "year" },
  options?: ApiRequestOptions
): Promise<ApiResponse<EarningsResponse>> {
  return api.get("/analytics/earnings", { ...options, auth: true, query: params });
}
