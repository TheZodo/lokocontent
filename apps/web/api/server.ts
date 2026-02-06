import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createApiClient } from "@/api/client";

export function createServerApiClient() {
  const { getToken } = auth();
  return createApiClient({ getToken });
}
