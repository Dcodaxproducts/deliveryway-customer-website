"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useBranding } from "@/hooks/useBranding";

type StorefrontLoadingGateProps = {
  children: ReactNode;
};

export const StorefrontLoadingGate = ({
  children,
}: StorefrontLoadingGateProps) => {
  const t = useTranslations("common");
  const { isLoading } = useBranding();

  return (
    <>
      {isLoading ? (
        <div
          role="status"
          aria-label={t("loading")}
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/10"
        >
          <span className="block h-full w-full animate-pulse bg-primary" />
        </div>
      ) : null}
      {children}
    </>
  );
};
