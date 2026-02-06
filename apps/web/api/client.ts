import type { ApiErrorPayload, ApiResponse } from "@/api/types";

export type TokenGetter = () => Promise<string | null>;

export type ApiRequestOptions = {
  auth?: boolean;
  token?: string | null;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  onUnauthorized?: () => void | Promise<void>;
};

export type ApiClient = {
  request: <T>(
    method: string,
    path: string,
    options?: ApiRequestOptions & { body?: unknown; signal?: AbortSignal }
  ) => Promise<ApiResponse<T>>;
  get: <T>(path: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>;
  post: <T, B = unknown>(
    path: string,
    body?: B,
    options?: ApiRequestOptions
  ) => Promise<ApiResponse<T>>;
  patch: <T, B = unknown>(
    path: string,
    body?: B,
    options?: ApiRequestOptions
  ) => Promise<ApiResponse<T>>;
  del: <T>(path: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>;
};

const DEFAULT_UNAUTHORIZED: ApiErrorPayload = {
  code: "UNAUTHORIZED",
  message: "Authentication required.",
};

const DEFAULT_NETWORK_ERROR: ApiErrorPayload = {
  code: "NETWORK_ERROR",
  message: "Network error while contacting API.",
};

function buildUrl(path: string, query?: ApiRequestOptions["query"]) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function defaultUnauthorizedHandler() {
  if (typeof window !== "undefined") {
    window.location.assign("/sign-in");
  }
}

function normalizeApiError(message: string, status?: number): ApiErrorPayload {
  return {
    code: status ? `HTTP_${status}` : "API_ERROR",
    message,
  };
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  const payload = (await response.json()) as ApiResponse<T> | T;
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    typeof (payload as { success?: unknown }).success === "boolean"
  ) {
    return payload as ApiResponse<T>;
  }

  return {
    success: response.ok,
    data: payload as T,
  };
}

export class ApiClientError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function unwrapApiResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    return {
      data: response.data as T,
      meta: response.meta,
    };
  }

  throw new ApiClientError(
    response.error.message,
    response.error.code,
    undefined,
    response.error.details
  );
}

export function createApiClient(
  config: {
    getToken?: TokenGetter;
    onUnauthorized?: () => void | Promise<void>;
  } = {}
): ApiClient {
  const { getToken, onUnauthorized } = config;

  const request: ApiClient["request"] = async (
    method,
    path,
    options = {}
  ) => {
    const {
      auth,
      token,
      query,
      headers,
      onUnauthorized: onUnauthorizedOverride,
      body,
      signal,
    } = options;

    const url = buildUrl(path, query);
    const resolvedToken =
      token ?? (auth ? await getToken?.().catch(() => null) : null);
    const resolvedOnUnauthorized =
      onUnauthorizedOverride ?? onUnauthorized ?? defaultUnauthorizedHandler;

    if (auth && !resolvedToken) {
      await resolvedOnUnauthorized();
      return {
        success: false,
        error: DEFAULT_UNAUTHORIZED,
      };
    }

    try {
      const mergedHeaders = new Headers(headers);
      const isFormData =
        typeof FormData !== "undefined" && body instanceof FormData;
      const isUrlEncoded =
        typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
      const isBinary =
        typeof Blob !== "undefined" && body instanceof Blob;
      const isArrayBuffer = body instanceof ArrayBuffer;
      const isBodyInit =
        isFormData || isUrlEncoded || isBinary || isArrayBuffer || typeof body === "string";

      if (body && !isBodyInit) {
        mergedHeaders.set("Content-Type", "application/json");
      }
      if (resolvedToken) {
        mergedHeaders.set("Authorization", `Bearer ${resolvedToken}`);
      }

      const requestBody =
        body && !isBodyInit ? JSON.stringify(body) : (body as BodyInit | undefined);

      const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body: requestBody,
        signal,
      });

      if (response.status === 401) {
        await resolvedOnUnauthorized();
      }

      const json = await parseJson<T>(response);
      if (json) {
        return json;
      }

      if (!response.ok) {
        return {
          success: false,
          error: normalizeApiError(
            response.statusText || "Request failed",
            response.status
          ),
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          ...DEFAULT_NETWORK_ERROR,
          details: error,
        },
      };
    }
  };

  return {
    request,
    get: (path, options) => request("GET", path, options),
    post: (path, body, options) => request("POST", path, { ...options, body }),
    patch: (path, body, options) => request("PATCH", path, { ...options, body }),
    del: (path, options) => request("DELETE", path, options),
  };
}
