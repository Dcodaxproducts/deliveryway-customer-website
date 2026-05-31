// @ts-nocheck
"use client";

import { useState } from "react";
import { toast } from "sonner";
import useHttpClient from "@/hooks/useHttpClient";
import { useAuthContext } from "@/context/AuthContext";

export default function useBranchSelector(onSelect?: () => void) {
  const { token, user, setUser } = useAuthContext();
  const { get } = useHttpClient(token);

  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [branches, setBranches] = useState<unknown[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);

      const res: unknown = await get(`/v1/branches`);

      const activeBranches =
        res?.data?.filter((b: unknown) => b.isActive) || [];

      setBranches(activeBranches);
      setShowBranchPopup(true);
    } catch (err) {
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  const selectBranch = async (branch: unknown) => {
    try {
      // ---------------- UPDATE LOCAL STORAGE ----------------
      const authRaw = browserStorage.getItem("auth");
      const auth = authRaw ? JSON.parse(authRaw) : null;

      if (auth?.user) {
        auth.user.branchId = branch.id;
        browserStorage.setItem("auth", JSON.stringify(auth));
      }

      // ---------------- UPDATE CONTEXT (IMPORTANT FIX) ----------------
      setUser((prev: unknown) => {
        if (!prev) return prev;

        return {
          ...prev,
          branchId: branch.id,
        };
      });

      toast.success("Branch selected");
      setShowBranchPopup(false);

      // 🔥 resume flow (retry API call etc.)
      if (onSelect) onSelect();

    } catch (err) {
      toast.error("Failed to set branch");
    }
  };

  return {
    showBranchPopup,
    setShowBranchPopup,
    branches,
    loadingBranches,
    fetchBranches,
    selectBranch,
  };
}
