import {
  deleteRequest,
  getRequest,
  patchRequest,
  postRequest,
  type ApiRequestOptions,
  type ApiResult,
} from "@/services/http";

export type DomainApiService = {
  get: (endpoint: string, token?: string | null, options?: ApiRequestOptions) => Promise<ApiResult>;
  post: (endpoint: string, body: unknown, token?: string | null, options?: ApiRequestOptions) => Promise<ApiResult>;
  patch: (endpoint: string, body: unknown, token?: string | null, options?: ApiRequestOptions) => Promise<ApiResult>;
  del: (endpoint: string, token?: string | null, options?: ApiRequestOptions) => Promise<ApiResult>;
};

export const createDomainApiService = (): DomainApiService => ({
  get: (endpoint, token, options) => getRequest(endpoint, token, options),
  post: (endpoint, body, token, options) => postRequest(endpoint, body, token, options),
  patch: (endpoint, body, token, options) => patchRequest(endpoint, body, token, options),
  del: (endpoint, token, options) => deleteRequest(endpoint, token, options),
});
