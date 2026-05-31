"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteProfileApi, getProfileApi, patchProfileApi, postProfileApi } from "@/services/profile-api";

const service = {
  get: getProfileApi,
  post: postProfileApi,
  patch: patchProfileApi,
  del: deleteProfileApi,
};

export const useProfile = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.profile.request });

export default useProfile;
