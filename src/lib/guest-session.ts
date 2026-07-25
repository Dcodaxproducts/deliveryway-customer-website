import type { AuthSession } from "@/types/auth";

type GuestSessionCoordinatorDependencies = {
  readSession: () => AuthSession | null;
  registerGuest: (restaurantId: string) => Promise<AuthSession>;
  persistSession: (session: AuthSession) => AuthSession;
};

type CustomerSession = {
  customerId: string;
  token: string;
  isGuest: boolean;
};

type GuestSessionRecoveryDependencies<TResponse extends { status?: number }> = {
  session: CustomerSession;
  request: (session: CustomerSession) => Promise<TResponse>;
  renewSession: () => Promise<CustomerSession>;
};

export const runWithGuestSessionRecovery = async <
  TResponse extends { status?: number },
>({
  session,
  request,
  renewSession,
}: GuestSessionRecoveryDependencies<TResponse>) => {
  const response = await request(session);

  if (response.status !== 401 || !session.isGuest) {
    return response;
  }

  return request(await renewSession());
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
