import type {
  PaymentProvider,
  Purchase,
  VideoContent,
} from "@lokocontent/db";

import type { ApiClient, ApiRequestOptions } from "@/api/client";
import type { ApiResponse } from "@/api/types";

export type PurchaseWithContent = Purchase & { content: VideoContent };

export type CreatePurchaseInput = {
  contentId: Purchase["contentId"];
  paymentProvider: PaymentProvider;
};

export type CreatePurchaseResponse = {
  purchaseId: Purchase["id"];
  checkoutUrl: string;
};

export type PurchasesResponse = {
  data: PurchaseWithContent[];
  total: number;
};

export async function createPurchase(
  api: ApiClient,
  body: CreatePurchaseInput,
  options?: ApiRequestOptions
): Promise<ApiResponse<CreatePurchaseResponse>> {
  return api.post("/purchases", body, { ...options, auth: true });
}

export async function getMyPurchases(
  api: ApiClient,
  options?: ApiRequestOptions
): Promise<ApiResponse<PurchasesResponse>> {
  return api.get("/purchases/my-purchases", { ...options, auth: true });
}
