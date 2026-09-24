"use client";

import { useMemo } from "react";

import { ResilientImage } from "@/components/common/ResilientImage";
import { useBranding } from "@/hooks/useBranding";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";

type BrandLogoProps = {
  restaurantLogoUrl?: string | null;
  variant?: "light" | "dark";
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export const BrandLogo = ({
  restaurantLogoUrl, variant = "light", alt = "Logo", fill = false,
  width = 160, height = 32, className = "object-contain", priority = false,
}: BrandLogoProps) => {
  const { branding } = useBranding();
  const variantLogo = variant === "dark" ? branding.logo.dark : branding.logo.light;
  const fallbackLogo = useMemo(
    () => resolveHttpsImageUrl(variantLogo ?? branding.logo.default, "/deliveryway-logo.jpg"),
    [branding.logo.default, variantLogo],
  );
  const src = useMemo(
    () => resolveHttpsImageUrl(restaurantLogoUrl, fallbackLogo),
    [fallbackLogo, restaurantLogoUrl],
  );

  return (
    <ResilientImage
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      priority={priority}
      fallback="brand"
    />
  );
};
