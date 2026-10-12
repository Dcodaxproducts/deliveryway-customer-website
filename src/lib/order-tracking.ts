export const getOrderTrackingSocketUrl = (apiBaseUrl: string) =>
  `${apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")}/orders-tracking`;
