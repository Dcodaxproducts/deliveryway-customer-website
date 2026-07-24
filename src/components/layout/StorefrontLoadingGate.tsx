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

  if (!isLoading) {
    return children;
  }

  return (
    <main
      aria-busy="true"
      aria-label={t("loading")}
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-white"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-4 border-primary/15 border-t-primary"
        />
        <p className="text-sm font-semibold text-gray-500">{t("loading")}</p>
      </div>
    </main>
  );
};
