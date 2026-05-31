"use client";

import Image from "next/image";

import { useBranding } from "@/hooks/useBranding";

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
  restaurantLogoUrl,
  variant = "light",
  alt = "Logo",
  fill = false,
  width = 160,
  height = 32,
  className = "object-contain",
  priority = false,
}: BrandLogoProps) => {
  const { branding } = useBranding();
  const variantLogo = variant === "dark" ? branding.logo.dark : branding.logo.light;
  const src = variantLogo ?? restaurantLogoUrl ?? branding.logo.default ?? "/logo.png";

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} priority={priority} />;
  }

  return <Image src={src} alt={alt} width={width} height={height} className={className} priority={priority} />;
};
