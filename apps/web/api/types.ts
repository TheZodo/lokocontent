export type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  success: true;
  data?: T;
  meta?: ApiMeta;
};

export type ApiError = {
  success: false;
  error: ApiErrorPayload;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
