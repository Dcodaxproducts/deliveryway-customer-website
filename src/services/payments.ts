import { createDomainApiService } from "@/services/domain-api";

const paymentsService = createDomainApiService();

export const getPayments = paymentsService.get;
export const postPayments = paymentsService.post;
export const patchPayments = paymentsService.patch;
export const deletePayments = paymentsService.del;
