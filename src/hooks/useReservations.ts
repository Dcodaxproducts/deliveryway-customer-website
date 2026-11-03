"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import {
  cancelReservation,
  createReservation,
  deleteReservations,
  fetchReservationBranch,
  fetchReservationBranches,
  fetchReservations,
  getReservations,
  patchReservations,
  postReservations,
  type Reservation,
  type ReservationMeta,
  type ReservationPayload,
} from "@/services/reservations";
import type { ApiResult } from "@/services/http";
import type { BranchRecord } from "@/types/branch-selector";

const service = {
  get: getReservations,
  post: postReservations,
  patch: patchReservations,
  del: deleteReservations,
};

export type ReservationsApi = DomainApiHook & {
  fetchReservations: () => Promise<{
    response: ApiResult;
    reservations: Reservation[];
    meta: ReservationMeta | null;
  }>;
  createReservation: (args: {
    payload: ReservationPayload;
  }) => Promise<ApiResult>;
  cancelReservation: (args: { reservationId: string }) => Promise<ApiResult>;
  fetchReservationBranch: (args: {
    branchId: string;
    restaurantId?: string | number | null;
  }) => Promise<{ response: ApiResult; branch: BranchRecord | null }>;
  fetchReservationBranches: (args: {
    restaurantId?: string | number | null;
    search?: string;
    page?: number;
  }) => Promise<ApiResult>;
};

export const useReservations = (token: string | null): ReservationsApi => {
  const api = useDomainApi(token, {
    service,
    requestKey: queryKeys.reservations.request,
  });

  const getReservationList = useCallback(
    () => fetchReservations(token),
    [token],
  );

  const addReservation = useCallback(
    ({ payload }: { payload: ReservationPayload }) =>
      createReservation({ payload, token }),
    [token],
  );

  const cancelReservationById = useCallback(
    ({ reservationId }: { reservationId: string }) =>
      cancelReservation({ reservationId, token }),
    [token],
  );

  const getReservationBranch = useCallback(
    ({ branchId, restaurantId }: { branchId: string; restaurantId?: string | number | null }) =>
      fetchReservationBranch({ branchId, restaurantId, token }),
    [token],
  );

  const getReservationBranches = useCallback(
    (args: {
      restaurantId?: string | number | null;
      search?: string;
      page?: number;
    }) => fetchReservationBranches({ ...args, token }),
    [token],
  );

  return useMemo(
    () => ({
      ...api,
      fetchReservations: getReservationList,
      createReservation: addReservation,
      cancelReservation: cancelReservationById,
      fetchReservationBranch: getReservationBranch,
      fetchReservationBranches: getReservationBranches,
    }),
    [
      api,
      addReservation,
      cancelReservationById,
      getReservationBranch,
      getReservationBranches,
      getReservationList,
    ],
  );
};

export default useReservations;
