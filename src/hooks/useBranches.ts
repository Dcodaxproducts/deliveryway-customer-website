"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteBranches, getBranches, patchBranches, postBranches } from "@/services/branches";

const service = {
  get: getBranches,
  post: postBranches,
  patch: patchBranches,
  del: deleteBranches,
};

export const useBranches = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.branches.request });

export default useBranches;
