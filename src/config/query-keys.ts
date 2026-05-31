export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
  restaurants: {
    all: ["restaurants"] as const,
    detail: (restaurantId: string) => ["restaurants", restaurantId] as const,
  },
  branches: {
    all: ["branches"] as const,
    list: (restaurantId?: string | null) => ["branches", restaurantId ?? "all"] as const,
  },
  menu: {
    all: ["menu"] as const,
    items: (params?: Record<string, unknown>) => ["menu", "items", params ?? {}] as const,
    categories: (params?: Record<string, unknown>) => ["menu", "categories", params ?? {}] as const,
  },
  cart: {
    current: ["cart", "current"] as const,
  },
  groupOrders: {
    all: ["group-orders"] as const,
    detail: (inviteCode: string) => ["group-orders", inviteCode] as const,
  },
};
