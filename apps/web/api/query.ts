"use client";

import {
  useQuery,
  useMutation,
  type UseMutationOptions,
  type UseQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";

import type { ApiClient } from "@/api/client";
import { unwrapApiResponse } from "@/api/client";
import type { ApiResponse } from "@/api/types";
import { useApiClient } from "@/api/use-api-client";

export type ApiQueryFn<TData> = (client: ApiClient) => Promise<ApiResponse<TData>>;

export function useApiQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: ApiQueryFn<TData>,
  options?: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  const client = useApiClient();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await queryFn(client);
      return unwrapApiResponse(response).data;
    },
    ...options,
  });
}

export function useApiMutation<TData, TVariables, TError = Error>(
  mutationFn: (client: ApiClient, variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables>,
    "mutationFn"
  >
) {
  const client = useApiClient();

  return useMutation({
    mutationFn: async (variables) => {
      const response = await mutationFn(client, variables);
      return unwrapApiResponse(response).data;
    },
    ...options,
  });
}
