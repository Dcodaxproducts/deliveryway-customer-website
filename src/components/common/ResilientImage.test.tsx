// @vitest-environment jsdom

import React, { type ImgHTMLAttributes } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ResilientImage,
  shouldRenderImage,
} from "@/components/common/ResilientImage";

vi.mock("next/image", () => ({
  default: ({
    fill: _fill,
    priority,
    quality,
    unoptimized,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    unoptimized?: boolean;
  }) => (
    <img
      {...props}
      data-priority={String(Boolean(priority))}
      data-quality={quality}
      data-unoptimized={String(Boolean(unoptimized))}
    />
  ),
}));

afterEach(cleanup);

describe("shouldRenderImage", () => {
  it.each([undefined, null, "", "   "])("uses the fallback for missing source %s", (src) => {
    expect(shouldRenderImage(src, false)).toBe(false);
  });

  it("removes a failed image so the browser cannot show a broken icon", () => {
    expect(shouldRenderImage("https://tenant.invalid/broken.jpg", true)).toBe(false);
  });
});

describe("ResilientImage", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: vi.fn(() => Promise.resolve()),
    });
  });

  it("keeps a shape-matched skeleton until decode succeeds, then crossfades", async () => {
    render(
      <div className="relative h-40 w-40">
        <ResilientImage
          src="/hero.png"
          alt="Restaurant hero"
          fill
          sizes="100vw"
          priority
          fallback="hero"
        />
      </div>,
    );

    const image = screen.getByRole("img", { name: "Restaurant hero" });
    const skeleton = screen.getByTestId("image-loading-skeleton");

    expect(image.getAttribute("sizes")).toBe("100vw");
    expect(image.getAttribute("data-priority")).toBe("true");
    expect(image.className).toContain("opacity-0");
    expect(skeleton.className).toContain("opacity-100");

    fireEvent.load(image);

    await waitFor(() => expect(image.className).toContain("opacity-100"));
    expect(skeleton.className).toContain("opacity-0");
  });

  it("shows a safe fallback on decode error", async () => {
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: vi.fn(() => Promise.reject(new Error("decode failed"))),
    });

    render(<ResilientImage src="/broken.jpg" alt="Broken meal" fill />);
    fireEvent.load(screen.getByRole("img", { name: "Broken meal" }));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Broken meal" }).tagName).toBe("SPAN");
    });
  });

  it("resets to loading when a restaurant image source changes", async () => {
    const { rerender } = render(
      <ResilientImage src="/branch-a.jpg" alt="Category" fill sizes="81px" />,
    );
    const firstImage = screen.getByRole("img", { name: "Category" });
    fireEvent.load(firstImage);
    await waitFor(() => expect(firstImage.className).toContain("opacity-100"));

    rerender(
      <ResilientImage src="/branch-b.jpg" alt="Category" fill sizes="81px" />,
    );

    expect(screen.getByRole("img", { name: "Category" }).getAttribute("src")).toBe(
      "/branch-b.jpg",
    );
    expect(screen.getByRole("img", { name: "Category" }).className).toContain(
      "opacity-0",
    );
    expect(screen.getByTestId("image-loading-skeleton").className).toContain(
      "opacity-100",
    );
  });

  it("does not put time-limited signed URLs into the shared optimizer cache", () => {
    render(
      <ResilientImage
        src="https://deliveryway-production-media.s3.eu-north-1.amazonaws.com/uploads/item.webp?X-Amz-Signature=private&X-Amz-Expires=300"
        alt="Signed meal"
        fill
      />,
    );

    expect(
      screen.getByRole("img", { name: "Signed meal" }).getAttribute(
        "data-unoptimized",
      ),
    ).toBe("true");
  });

  it("keeps stable public media eligible for optimization", () => {
    render(
      <ResilientImage
        src="https://deliveryway-production-media.s3.eu-north-1.amazonaws.com/uploads/item.webp"
        alt="Public meal"
        fill
      />,
    );

    expect(
      screen.getByRole("img", { name: "Public meal" }).getAttribute(
        "data-unoptimized",
      ),
    ).toBe("false");
  });

  it("uses explicit dimensions and stays lazy by default", () => {
    render(
      <ResilientImage
        src="/category.jpg"
        alt="Pizza"
        width={81}
        height={81}
        sizes="81px"
      />,
    );

    const image = screen.getByRole("img", { name: "Pizza" });
    expect(image.getAttribute("width")).toBe("81");
    expect(image.getAttribute("height")).toBe("81");
    expect(image.getAttribute("sizes")).toBe("81px");
    expect(image.getAttribute("data-priority")).toBe("false");
  });
});
