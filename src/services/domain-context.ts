import { API_BASE_URL } from "@/lib/axios";
import { buildApiUrl } from "@/lib/api-endpoint";
import { getRequestLocale } from "@/config/i18n";
import {
  getLocalDomainContext,
  normalizeDomainContext,
  normalizeDomainHost,
  type DomainContext,
} from "@/lib/domain-context";

const domainContextRequests = new Map<string, Promise<DomainContext>>();
const domainContextCache = new Map<
  string,
  { context: DomainContext; expiresAt: number }
>();
export const DOMAIN_CONTEXT_CACHE_TTL_MS = 4 * 60 * 1000;

const getMessage = (value: unknown, fallback: string) => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
};

const fetchDomainContext = async (
  normalizedHost: string,
): Promise<DomainContext> => {
  const endpoint = `/customer-app/domain-context?host=${encodeURIComponent(normalizedHost)}`;
  const response = await fetch(buildApiUrl(API_BASE_URL, endpoint), {
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": getRequestLocale(),
    },
  });
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(getMessage(payload, "Failed to resolve restaurant domain"));
  }

  const context = normalizeDomainContext(payload);

  if (!context) {
    throw new Error("Invalid restaurant domain response");
  }

  return context;
};

export const resolveDomainContext = (host: string): Promise<DomainContext> => {
  const normalizedHost = normalizeDomainHost(host);

  if (!normalizedHost) {
    return Promise.reject(new Error("Host is required"));
  }

  const localContext = getLocalDomainContext(normalizedHost);

  if (localContext) return Promise.resolve(localContext);

  const cached = domainContextCache.get(normalizedHost);

  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.context);
  }
  domainContextCache.delete(normalizedHost);

  const existingRequest = domainContextRequests.get(normalizedHost);

  if (existingRequest) return existingRequest;

  const request = fetchDomainContext(normalizedHost)
    .then((context) => {
      domainContextCache.set(normalizedHost, {
        context,
        expiresAt: Date.now() + DOMAIN_CONTEXT_CACHE_TTL_MS,
      });
      return context;
    })
    .finally(() => {
      domainContextRequests.delete(normalizedHost);
    });

  domainContextRequests.set(normalizedHost, request);

  return request;
};
