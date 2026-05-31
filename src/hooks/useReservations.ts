"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteReservations, getReservations, patchReservations, postReservations } from "@/services/reservations";

const service = {
  get: getReservations,
  post: postReservations,
  patch: patchReservations,
  del: deleteReservations,
};

export const useReservations = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.reservations.request });

export default useReservations;
