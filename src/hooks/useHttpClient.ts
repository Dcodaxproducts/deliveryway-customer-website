import { useMemo, useState } from "react";

import { deleteRequest, getRequest, patchRequest, postRequest } from "@/services/http";

export const useHttpClient = (token: string | null) => {
  const [loading, setLoading] = useState(false);

  return useMemo(
    () => ({
      loading,
      get: async (endpoint: string) => {
        setLoading(true);
        try {
          return await getRequest(endpoint, token);
        } finally {
          setLoading(false);
        }
      },
      post: async (endpoint: string, body: unknown) => {
        setLoading(true);
        try {
          return await postRequest(endpoint, body, token);
        } finally {
          setLoading(false);
        }
      },
      patch: async (endpoint: string, body: unknown) => {
        setLoading(true);
        try {
          return await patchRequest(endpoint, body, token);
        } finally {
          setLoading(false);
        }
      },
      del: async (endpoint: string) => {
        setLoading(true);
        try {
          return await deleteRequest(endpoint, token);
        } finally {
          setLoading(false);
        }
      },
    }),
    [loading, token]
  );
};

export default useHttpClient;
