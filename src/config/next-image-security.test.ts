import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

const remotePatterns = nextConfig.images?.remotePatterns ?? [];

const normalizedPatterns = remotePatterns.map((pattern) =>
  typeof pattern === "string"
    ? new URL(pattern)
    : pattern,
);

describe("Next image remote allowlist", () => {
  it("allows the exact production S3 host only under the uploads prefix", () => {
    expect(normalizedPatterns).toContainEqual(
      expect.objectContaining({
        protocol: "https",
        hostname: "deliveryway-production-media.s3.eu-north-1.amazonaws.com",
        pathname: "/uploads/**",
      }),
    );
  });

  it("uses exact hostnames and keeps both S3 buckets path-scoped", () => {
    for (const pattern of normalizedPatterns) {
      expect(pattern.hostname).not.toMatch(/[*!]/);
    }

    expect(
      normalizedPatterns
        .filter((pattern) => pattern.hostname.endsWith(".amazonaws.com"))
        .every((pattern) => pattern.pathname === "/uploads/**"),
    ).toBe(true);
  });
});
