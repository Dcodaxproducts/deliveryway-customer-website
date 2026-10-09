"use client";

import Image from "next/image";
import { BadgePercent, Store } from "lucide-react";
import { useState } from "react";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

type ResilientImageProps = {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fallback?: "brand" | "deal" | "hero";
  quality?: number;
  skeletonClassName?: string;
};

type ImageState = {
  source: string;
  status: "loading" | "loaded" | "failed";
};

export const shouldRenderImage = (src: string | null | undefined, failed: boolean) =>
  Boolean(src?.trim()) && !failed;

export const ResilientImage = ({
  src,
  alt,
  fill = false,
  width = 160,
  height = 32,
  sizes,
  className,
  priority = false,
  fallback = "brand",
  quality = 78,
  skeletonClassName,
}: ResilientImageProps) => {
  const normalizedSource = src?.trim() ?? "";
  const [imageState, setImageState] = useState<ImageState>({
    source: normalizedSource,
    status: "loading",
  });
  const status =
    imageState.source === normalizedSource ? imageState.status : "loading";
  const failed = status === "failed";
  const loaded = status === "loaded";

  const updateStatus = (nextStatus: ImageState["status"]) => {
    setImageState({ source: normalizedSource, status: nextStatus });
  };

  if (!shouldRenderImage(src, failed)) {
    const Icon = fallback === "deal" ? BadgePercent : Store;
    return (
      <span
        role="img"
        aria-label={alt}
        className={`flex h-full w-full items-center justify-center overflow-hidden ${
          fallback === "hero"
            ? "bg-[radial-gradient(circle_at_70%_30%,color-mix(in_srgb,var(--primary)_55%,#f59e0b),var(--primary)_45%,#241015)] text-white/80"
            : "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_14%,white),#f7f3ee)] text-primary"
        }`}
      >
        <Icon className={fallback === "hero" ? "h-20 w-20" : "h-8 w-8"} aria-hidden="true" />
      </span>
    );
  }

  const common = {
    src: normalizedSource,
    alt,
    className: cn(
      "transition-opacity duration-300 motion-reduce:transition-none",
      loaded ? "opacity-100" : "opacity-0",
      className,
    ),
    priority,
    sizes,
    quality,
    onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => {
      const loadedImage = event.currentTarget;

      void loadedImage
        .decode()
        .then(() => updateStatus("loaded"))
        .catch(() => updateStatus("failed"));
    },
    onError: () => updateStatus("failed"),
  };

  const skeleton = (
    <LoadingSkeleton
      testId="image-loading-skeleton"
      className={cn(
        "absolute inset-0 h-full w-full transition-opacity duration-300 motion-reduce:transition-none",
        fallback === "hero"
          ? "bg-[linear-gradient(115deg,#351b1d_0%,color-mix(in_srgb,var(--primary)_45%,#4a2427)_48%,#291719_100%)]"
          : "bg-gray-200",
        loaded ? "pointer-events-none opacity-0" : "opacity-100",
        skeletonClassName,
      )}
    />
  );

  if (fill) {
    return (
      <>
        {skeleton}
        <Image key={normalizedSource} {...common} fill />
      </>
    );
  }

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ width, height }}
    >
      {skeleton}
      <Image
        key={normalizedSource}
        {...common}
        width={width}
        height={height}
      />
    </span>
  );
};
