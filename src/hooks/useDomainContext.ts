"use client";

import { useEffect, useState } from "react";

import {
  readStoredDomainContext,
  writeStoredDomainContext,
  type DomainContext,
} from "@/lib/domain-context";
import {
  PUBLIC_BRANCH_CHANGED_EVENT,
  readPublicBranchSelection,
  type PublicBranchSelection,
} from "@/lib/branch-selector";
import { resolveDomainContext } from "@/services/domain-context";

type DomainContextState = {
  context: DomainContext | null;
  loading: boolean;
  error: Error | null;
};

const applyPublicBranchSelection = (
  context: DomainContext | null,
): DomainContext | null => {
  if (!context?.restaurantId) {
    return context;
  }

  const selection = readPublicBranchSelection(context.restaurantId);

  if (!selection) {
    return context;
  }

  return {
    ...context,
    branchId: selection.branch.id,
    branchName: selection.branch.name,
  };
};

export const useDomainContext = (): DomainContextState => {
  const [state, setState] = useState<DomainContextState>(() => ({
    context: applyPublicBranchSelection(readStoredDomainContext()),
    loading: typeof window !== "undefined",
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    const host = window.location.host;
    const handlePublicBranchChange = (event: Event) => {
      const selection = (event as CustomEvent<PublicBranchSelection>).detail;

      setState((previous) => {
        if (
          !previous.context?.restaurantId ||
          previous.context.restaurantId !== selection?.restaurantId
        ) {
          return previous;
        }

        const context = {
          ...previous.context,
          branchId: selection.branch.id,
          branchName: selection.branch.name,
        };

        writeStoredDomainContext(context);

        return {
          ...previous,
          context,
        };
      });
    };

    window.addEventListener(
      PUBLIC_BRANCH_CHANGED_EVENT,
      handlePublicBranchChange,
    );

    resolveDomainContext(host)
      .then((context) => {
        if (cancelled) return;
        const resolvedContext = applyPublicBranchSelection(context);
        writeStoredDomainContext(resolvedContext);
        setState({ context: resolvedContext, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const nextError =
          error instanceof Error
            ? error
            : new Error("Failed to resolve restaurant domain");
        setState((previous) => ({
          ...previous,
          loading: false,
          error: nextError,
        }));
      });

    return () => {
      cancelled = true;
      window.removeEventListener(
        PUBLIC_BRANCH_CHANGED_EVENT,
        handlePublicBranchChange,
      );
    };
  }, []);

  return state;
};
