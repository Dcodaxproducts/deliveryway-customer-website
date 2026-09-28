import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getRequestHost } from "@/lib/favicon";
import {
  fetchTenantBrandingContext,
  getCustomTenantFaviconUrl,
} from "@/lib/server-favicon";

const FALLBACK_FILE = "deliveryway-logo.jpg";
const FALLBACK_CONTENT_TYPE = "image/jpeg";
const MAX_FAVICON_BYTES = 2 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/webp",
  "image/svg+xml",
  "image/jpeg",
]);

export const dynamic = "force-dynamic";

const responseHeaders = (contentType: string, etag: string) => ({
  "Cache-Control": "public, max-age=31536000, immutable",
  "Content-Type": contentType,
  ETag: etag,
  Vary: "Host, X-Forwarded-Host",
  "X-Content-Type-Options": "nosniff",
});

const imageResponse = (
  request: Request,
  body: ArrayBuffer,
  contentType: string,
) => {
  const etag = `"${createHash("sha256")
    .update(new Uint8Array(body))
    .digest("hex")}"`;
  const responseInit = { headers: responseHeaders(contentType, etag) };
  if (request.headers.get("if-none-match")?.split(",").includes(etag)) {
    return new Response(null, { ...responseInit, status: 304 });
  }

  return new Response(body, { ...responseInit, status: 200 });
};

const fallbackResponse = async (request: Request) => {
  const file = await readFile(join(process.cwd(), "public", FALLBACK_FILE));
  const body = new ArrayBuffer(file.byteLength);
  new Uint8Array(body).set(file);
  return imageResponse(request, body, FALLBACK_CONTENT_TYPE);
};

export async function GET(request: Request): Promise<Response> {
  const host = getRequestHost(request.headers);
  const context = await fetchTenantBrandingContext(host);
  const customFaviconUrl = getCustomTenantFaviconUrl(context);

  if (!customFaviconUrl) {
    return fallbackResponse(request);
  }

  try {
    const assetResponse = await fetch(customFaviconUrl, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    const contentType = assetResponse.headers.get("content-type")
      ?.split(";")[0]
      ?.trim()
      .toLowerCase();
    const contentLength = Number(assetResponse.headers.get("content-length"));

    if (
      !assetResponse.ok ||
      !contentType ||
      !ALLOWED_CONTENT_TYPES.has(contentType) ||
      (Number.isFinite(contentLength) && contentLength > MAX_FAVICON_BYTES)
    ) {
      return fallbackResponse(request);
    }

    const body = await assetResponse.arrayBuffer();
    if (body.byteLength > MAX_FAVICON_BYTES) {
      return fallbackResponse(request);
    }

    return imageResponse(request, body, contentType);
  } catch {
    return fallbackResponse(request);
  }
}
