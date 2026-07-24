"use client";

import { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/hooks/useAuth";
import { useDomainContext } from "@/hooks/useDomainContext";
import { queryKeys } from "@/config/query-keys";
import {
  getDefaultBranchOrderType,
  persistPublicBranchSelection,
  persistSelectedBranch,
} from "@/lib/branch-selector";
import { fetchBranchRecords } from "@/services/branches";
import { BranchSelectorModal } from "./BranchSelectorModal";

type BranchSwitcherProps = {
  restaurantId?: string | number | null;
  endpoint?: string;
  className?: string;
  presentation?: "default" | "navbar";
};

export function BranchSwitcher({
  restaurantId,
  endpoint,
  className = "",
  presentation = "default",
}: BranchSwitcherProps) {
  const t = useTranslations("branchSelector");
  const { user, setUser } = useAuthContext();
  const { context: domainContext } = useDomainContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const resolvedRestaurantId = useMemo(() => {
    return (
      restaurantId ||
      user?.restaurantId ||
      user?.tenantId ||
      domainContext?.restaurantId ||
      null
    );
  }, [domainContext?.restaurantId, restaurantId, user]);

  const branchQuery = useQuery({
    queryKey: queryKeys.branches.list(
      resolvedRestaurantId ? String(resolvedRestaurantId) : null,
    ),
    enabled: Boolean(resolvedRestaurantId),
    queryFn: () =>
      fetchBranchRecords(
        endpoint ||
          `/v1/customer-app/branches?restaurantId=${encodeURIComponent(
            String(resolvedRestaurantId),
          )}&page=1&limit=100`,
        null,
      ),
    staleTime: 60_000,
  });
  const activeBranches = useMemo(
    () => branchQuery.data?.filter((branch) => branch.isActive !== false) ?? [],
    [branchQuery.data],
  );
  const currentBranchId =
    user?.branchId || user?.branch?.id || domainContext?.branchId || "";
  const selectedListBranch = activeBranches.find(
    (branch) => branch.id === currentBranchId,
  );
  const branchName =
    selectedListBranch?.name ||
    user?.branch?.name ||
    domainContext?.branchName ||
    t("selectBranch");
  const isNavbar = presentation === "navbar";
  const isCheckoutRoute = pathname.startsWith("/checkout");
  const canSwitchBranch =
    Boolean(resolvedRestaurantId) &&
    !isCheckoutRoute &&
    activeBranches.length > 1;

  useEffect(() => {
    if (activeBranches.length !== 1 || !resolvedRestaurantId) {
      return;
    }

    const soleBranch = {
      ...activeBranches[0],
      isOnlyBranch: true,
    };

    if (currentBranchId === soleBranch.id) {
      persistPublicBranchSelection(soleBranch, resolvedRestaurantId);
      return;
    }

    const orderType = getDefaultBranchOrderType(
      soleBranch,
      user?.selectedOrderType,
    );

    if (user) {
      persistSelectedBranch(soleBranch, setUser, { orderType });
      return;
    }

    persistPublicBranchSelection(
      { ...soleBranch, selectedOrderType: orderType },
      resolvedRestaurantId,
    );
  }, [activeBranches, currentBranchId, resolvedRestaurantId, setUser, user]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canSwitchBranch}
        aria-label={canSwitchBranch ? t("changeBranch") : branchName}
        className={`group inline-flex items-center text-left transition-all duration-200 ${
          isNavbar
            ? "h-11 gap-2 rounded-full bg-[#F7F7F8] px-4 text-sm font-semibold text-[#20242A] hover:bg-[#F1F2F4]"
            : "gap-3 rounded-2xl border border-[#E8ECF0] bg-white px-3 py-2 shadow-sm hover:border-[var(--primary)]/35 hover:shadow-[0_10px_24px_rgba(17,24,39,0.08)]"
        } ${canSwitchBranch ? "" : "cursor-default"} ${className}`}
      >
        <div
          className={
            isNavbar
              ? "flex items-center justify-center text-[var(--primary)]"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgba(206,24,27,0.08)] text-[var(--primary)] transition-all duration-200 group-hover:bg-[var(--primary)] group-hover:text-white"
          }
        >
          <FaMapMarkerAlt className="text-[14px]" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#111827]">
            {branchName}
          </p>
        </div>

        {canSwitchBranch ? (
          <FaChevronDown className="ml-1 text-[12px] text-[#6B7280]" />
        ) : null}
      </button>

      <BranchSelectorModal
        open={open}
        onClose={() => setOpen(false)}
        restaurantId={resolvedRestaurantId}
        currentBranchId={currentBranchId}
        endpoint={endpoint}
        badgeText={t("switchBranch")}
        title={t("changeBranch")}
        description=""
      />
    </>
  );
}
