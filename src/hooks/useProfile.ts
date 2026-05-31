"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useAuthContext } from "@/context/AuthContext";
import { useDomainApi } from "@/hooks/useDomainApi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { readAuthSession, saveAuthSession } from "@/lib/auth";
import {
  deleteAddress as deleteProfileAddress,
  fetchAddresses as fetchProfileAddresses,
  fetchWalletSummary,
  mergeUpdatedProfileAuth,
  requestPresignedAvatarUpload,
  updateProfile as updateProfileRequest,
  type AddressRecord,
  type ProfileUpdatePayload,
  type WalletSummary,
} from "@/services/profile";
import { deleteProfileApi, getProfileApi, patchProfileApi, postProfileApi } from "@/services/profile-api";

const service = {
  get: getProfileApi,
  post: postProfileApi,
  patch: patchProfileApi,
  del: deleteProfileApi,
};

export type ProfileActions = {
  loading: boolean;
  fetchWallet: () => Promise<WalletSummary>;
  fetchAddresses: () => Promise<AddressRecord[]>;
  deleteAddress: (id: string) => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
};

export const useProfile = (token: string | null): ProfileActions => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.profile.request });
  const { uploadAvatarFile } = useFileUpload();
  const { login } = useAuthContext();

  const fetchWallet = useCallback(() => fetchWalletSummary(api), [api]);

  const fetchAddresses = useCallback(() => fetchProfileAddresses(api), [api]);

  const deleteAddress = useCallback(
    async (id: string) => {
      await deleteProfileAddress(api, id);
    },
    [api]
  );

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      await updateProfileRequest(api, payload);

      const auth = readAuthSession();

      if (auth) {
        const updatedAuth = mergeUpdatedProfileAuth(auth, payload);
        saveAuthSession(updatedAuth);
        login(updatedAuth);
      }
    },
    [api, login]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const upload = await requestPresignedAvatarUpload(api, file);
      await uploadAvatarFile(upload, file);
      return upload.fileUrl;
    },
    [api, uploadAvatarFile]
  );

  return useMemo(
    () => ({
      loading: api.loading,
      fetchWallet,
      fetchAddresses,
      deleteAddress,
      updateProfile,
      uploadAvatar,
    }),
    [api.loading, deleteAddress, fetchAddresses, fetchWallet, updateProfile, uploadAvatar]
  );
};

export default useProfile;
