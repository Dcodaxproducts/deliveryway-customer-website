"use client";

import Image from "next/image";
import { BadgePercent, Store } from "lucide-react";
import { useEffect, useState } from "react";

import { isRemoteHttpsImageUrl } from "@/lib/image-fallback";

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
}: ResilientImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

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
    src: src as string,
    alt,
    className,
    priority,
    sizes,
    unoptimized: isRemoteHttpsImageUrl(src),
    onError: () => setFailed(true),
  };

  return fill ? <Image {...common} fill /> : <Image {...common} width={width} height={height} />;
};
