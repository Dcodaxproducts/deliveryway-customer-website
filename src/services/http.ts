import axios from "axios";

import { httpClient, normalizeApiEndpoint } from "@/lib/axios";

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type ApiRequestOptions = {
  signal?: AbortSignal;
};

type LooseValue = unknown[] & Record<string, unknown> & string & number & boolean;

export type ApiResult = Record<string, LooseValue> & {
  data: LooseValue;
  meta?: LooseValue;
  error?: string;
  status?: number;
  success?: boolean;
  aborted?: boolean;
  timedOut?: boolean;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "API request failed";
};

const looseValue = (value: unknown) => value as LooseValue;

const normalizeResult = (value: unknown): ApiResult => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      ...record,
      data: looseValue(record.data),
    } as ApiResult;
  }

  return { data: looseValue(value) } as ApiResult;
};

const normalizeErrorResult = (error: unknown): ApiResult => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === "object" && responseData !== null && !Array.isArray(responseData)) {
      const record = responseData as Record<string, unknown>;

      return {
        ...record,
        data: looseValue(record.data ?? responseData),
        error: looseValue(record.error ?? error.message),
        status: error.response?.status,
      } as unknown as ApiResult;
    }

    return {
      data: looseValue(responseData),
      error: toErrorMessage(error),
      status: error.response?.status,
      aborted: error.code === "ERR_CANCELED",
      timedOut: error.code === "ECONNABORTED" || error.code === "ETIMEDOUT",
    } as unknown as ApiResult;
  }

  return { error: toErrorMessage(error), data: looseValue(undefined) } as unknown as ApiResult;
};

export const request = async (
  method: ApiMethod,
  endpoint: string,
  body?: unknown,
  token?: string | null,
  options: ApiRequestOptions = {},
): Promise<ApiResult> => {
  try {
    const response = await httpClient.request<unknown>({
      url: normalizeApiEndpoint(endpoint),
      method,
      data: body,
      signal: options.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return normalizeResult(response.data);
  } catch (error) {
    return normalizeErrorResult(error);
  }
};

export const getRequest = (
  endpoint: string,
  token?: string | null,
  options?: ApiRequestOptions,
) => request("GET", endpoint, undefined, token, options);

export const postRequest = (
  endpoint: string,
  body: unknown,
  token?: string | null,
  options?: ApiRequestOptions,
) => request("POST", endpoint, body, token, options);

export const patchRequest = (
  endpoint: string,
  body: unknown,
  token?: string | null,
  options?: ApiRequestOptions,
) => request("PATCH", endpoint, body, token, options);

export const deleteRequest = (
  endpoint: string,
  token?: string | null,
  options?: ApiRequestOptions,
) => request("DELETE", endpoint, undefined, token, options);
