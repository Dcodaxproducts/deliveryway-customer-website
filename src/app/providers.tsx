"use client";

import type { ReactNode } from "react";

import QueryProvider from "@/components/providers/query-provider";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
