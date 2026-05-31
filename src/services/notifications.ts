import { createDomainApiService } from "@/services/domain-api";

const notificationsService = createDomainApiService();

export const getNotifications = notificationsService.get;
export const postNotifications = notificationsService.post;
export const patchNotifications = notificationsService.patch;
export const deleteNotifications = notificationsService.del;
