"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deletePayments, getPayments, patchPayments, postPayments } from "@/services/payments";

const service = {
  get: getPayments,
  post: postPayments,
  patch: patchPayments,
  del: deletePayments,
};

export const usePayments = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.payments.request });

export default usePayments;
