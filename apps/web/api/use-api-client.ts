"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/api/client";

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(() => createApiClient({ getToken }), [getToken]);
}
