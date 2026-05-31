import { createDomainApiService } from "@/services/domain-api";

const branchesService = createDomainApiService();

export const getBranches = branchesService.get;
export const postBranches = branchesService.post;
export const patchBranches = branchesService.patch;
export const deleteBranches = branchesService.del;
