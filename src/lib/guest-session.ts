import type { AuthSession } from "@/types/auth";

type GuestSessionCoordinatorDependencies = {
  readSession: () => AuthSession | null;
  registerGuest: (restaurantId: string) => Promise<AuthSession>;
  persistSession: (session: AuthSession) => AuthSession;
};

export const createGuestSessionCoordinator = ({
  readSession,
  registerGuest,
  persistSession,
}: GuestSessionCoordinatorDependencies) => {
  let pendingSession: Promise<AuthSession> | null = null;

  return async (restaurantId: string) => {
    const storedSession = readSession();

    if (storedSession?.accessToken && storedSession.user) {
      return storedSession;
    }

    if (!pendingSession) {
      pendingSession = registerGuest(restaurantId)
        .then(persistSession)
        .finally(() => {
          pendingSession = null;
        });
    }

    return pendingSession;
  };
};
