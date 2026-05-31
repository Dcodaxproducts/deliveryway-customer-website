import {
  deleteAddress,
  fetchAddresses,
  fetchWalletSummary,
  requestPresignedAvatarUpload,
  updateProfile,
  uploadAvatarFile,
  type ApiClient,
  type ProfileUpdatePayload,
} from "@/services/profile";

export const useProfile = (api: ApiClient) => ({
  fetchWallet: () => fetchWalletSummary(api),
  fetchAddresses: () => fetchAddresses(api),
  deleteAddress: (id: string) => deleteAddress(api, id),
  updateProfile: (payload: ProfileUpdatePayload) => updateProfile(api, payload),
  uploadAvatar: async (file: File) => {
    const upload = await requestPresignedAvatarUpload(api, file);
    await uploadAvatarFile(upload, file);
    return upload.fileUrl;
  },
});
