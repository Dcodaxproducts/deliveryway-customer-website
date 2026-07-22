import axios, { AxiosHeaders } from "axios";

import { getRequestLocale } from "@/config/i18n";
import { normalizeApiEndpoint as normalizeEndpointForBase } from "@/lib/api-endpoint";
import { getAuthToken } from "@/lib/auth";

const normalizeBaseUrl = (value?: string) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
  }

  return trimmedValue.replace(/\/+$/, "");
};

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
export const CHAT_BASE_URL = new URL("/chat", API_BASE_URL).toString().replace(/\/$/, "");

export const normalizeApiEndpoint = (endpoint: string, baseUrl = API_BASE_URL) =>
  normalizeEndpointForBase(endpoint, baseUrl);

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  const headers = AxiosHeaders.from(config.headers);

  headers.set("Accept-Language", getRequestLocale());

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});

export type ApiResponse<T = unknown> = {
  data?: T;
  message?: string;
  meta?: unknown;
};
