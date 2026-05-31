import { httpClient } from "@/lib/axios";

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

type LooseValue = unknown[] & Record<string, unknown> & string & number & boolean;

export type ApiResult = Record<string, LooseValue> & {
  data: LooseValue;
  meta?: LooseValue;
  error?: string;
  status?: number;
  success?: boolean;
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

export const request = async (
  method: ApiMethod,
  endpoint: string,
  body?: unknown,
  token?: string | null
): Promise<ApiResult> => {
  try {
    const response = await httpClient.request<unknown>({
      url: endpoint,
      method,
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return normalizeResult(response.data);
  } catch (error) {
    return { error: toErrorMessage(error), data: looseValue(undefined) } as ApiResult;
  }
};

export const getRequest = (endpoint: string, token?: string | null) =>
  request("GET", endpoint, undefined, token);

export const postRequest = (endpoint: string, body: unknown, token?: string | null) =>
  request("POST", endpoint, body, token);

export const patchRequest = (endpoint: string, body: unknown, token?: string | null) =>
  request("PATCH", endpoint, body, token);

export const deleteRequest = (endpoint: string, token?: string | null) =>
  request("DELETE", endpoint, undefined, token);
