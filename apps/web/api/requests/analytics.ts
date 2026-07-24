import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type AnalyticsOverview = {
  totalViews: number;
  settledViews: number;
  provisionalViews: number;
  liveViewers: number;
  watchMinutes: number;
  playingMinutes: number;
  lastAnalyticsSyncAt: string | null;
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

export type UsagePeriod = "day" | "week" | "month" | "year";

export type UsageBreakdown = {
  date: string;
  views: number;
  uniqueViewers: number;
  watchMinutes: number;
  playingMinutes: number;
  billableMinutes: number;
  freshness: "LIVE" | "PROVISIONAL" | "SETTLED";
};

export type UsageResponse = {
  data: UsageBreakdown[];
  total: {
    views: number;
    uniqueViewers: number;
    watchMinutes: number;
    playingMinutes: number;
    billableMinutes: number;
  };
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

export async function getUsageBreakdown(
  api: ApiClient,
  params: { period: UsagePeriod },
  options?: ApiRequestOptions
): Promise<ApiResponse<UsageResponse>> {
  return api.get("/analytics/usage", { ...options, auth: true, query: params });
}
