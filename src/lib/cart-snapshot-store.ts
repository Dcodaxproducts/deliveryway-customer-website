export type CartSnapshotLoadState = "idle" | "loading" | "ready" | "error";

export type CartSnapshotState = {
  cartSnapshot: unknown;
  cartLoadState: CartSnapshotLoadState;
  cartRefreshKey: number;
};

const initialState: CartSnapshotState = {
  cartSnapshot: null,
  cartLoadState: "idle",
  cartRefreshKey: 0,
};

let state = initialState;
const listeners = new Set<() => void>();

export const getCartSnapshotState = () => state;
export const getServerCartSnapshotState = () => initialState;

export const publishCartSnapshotState = (
  update: Partial<CartSnapshotState>,
) => {
  state = { ...state, ...update };
  listeners.forEach((listener) => listener());
};

export const subscribeCartSnapshotState = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
