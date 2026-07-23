"use client";

import { useAuthContext } from "@/components/providers/auth-provider";

export { useAuthContext } from "@/components/providers/auth-provider";

export const useAuth = () => {
  const auth = useAuthContext();
  const { user, token, loading } = auth;
  return {
    ...auth,
    user,
    token,
    restaurantId: user?.restaurantId,
    loading,
  };
};
