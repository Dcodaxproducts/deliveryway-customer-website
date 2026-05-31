import { createDomainApiService } from "@/services/domain-api";

const reservationsService = createDomainApiService();

export const getReservations = reservationsService.get;
export const postReservations = reservationsService.post;
export const patchReservations = reservationsService.patch;
export const deleteReservations = reservationsService.del;
