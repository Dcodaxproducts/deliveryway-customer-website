type CheckoutUserContext = {
  restaurantId?: string | null;
  branchId?: string | null;
  branch?: {
    id?: string | null;
    restaurantId?: string | null;
  } | null;
} | null;

type PublicDomainContext = {
  restaurantId?: string | null;
  branchId?: string | null;
} | null;

export const resolveCheckoutContext = ({
  user,
  domainContext,
}: {
  user: CheckoutUserContext;
  domainContext: PublicDomainContext;
}) => ({
  restaurantId:
    user?.restaurantId ||
    user?.branch?.restaurantId ||
    domainContext?.restaurantId ||
    "",
  branchId:
    user?.branchId || user?.branch?.id || domainContext?.branchId || null,
});
