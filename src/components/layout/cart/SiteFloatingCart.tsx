"use client";

import { ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { OrderCartSidebar } from "@/components/pages/Items/components/signature-selection/OrderCartSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { getSelectedOrderType } from "@/lib/branch-selector";
import {
  CART_CHANGED_EVENT,
  shouldFetchCartAfterChange,
  type CartChangedDetail,
} from "@/lib/cart-events";
import {
  getStoredCheckoutTypePreference,
  resolveSelectedCheckoutType,
  type CheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { createLatestRequestCoordinator } from "@/lib/latest-request";
import { shouldShowFloatingCart } from "@/lib/cart-reliability";
import { resolveCustomerCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  fetchCustomerCartForOrderType,
  getCustomerCartItemCount,
} from "@/services/cart";

const HIDDEN_CART_PATHS = ["/checkout", "/menu"];

export function SiteFloatingCart() {
  const pathname = usePathname();
  const t = useTranslations("cart");
  const { user, token, loading, restaurantId } = useAuth();
  const { context: domainContext } = useDomainContext();
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [cartSnapshot, setCartSnapshot] = useState<unknown>(null);
  const [cartLoadState, setCartLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);
  const pendingCartMutationsRef = useRef(0);
  const cartRequestRef = useRef(createLatestRequestCoordinator());
  const [storedCheckoutType, setStoredCheckoutType] =
    useState<CheckoutTypePreference | null>(null);
  const [checkoutTypeReady, setCheckoutTypeReady] = useState(false);

  const isHiddenRoute = HIDDEN_CART_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const hideOnMobileHome = pathname === "/";
  const customerId = user?.id;
  const homeRestaurantId = resolveHomeRestaurantId(
    user,
    restaurantId,
    domainContext,
  );
  const branchId = resolveHomeBranchId(user, domainContext);
  const homeQuery = useHome(
    homeRestaurantId,
    branchId,
    Boolean(!loading && homeRestaurantId && branchId),
  );
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });
  const checkoutType = resolveSelectedCheckoutType(
    getSelectedOrderType(user),
    storedCheckoutType,
  );

  const refreshCart = useCallback(async () => {
    if (!checkoutTypeReady) return;

    if (loading || !customerId) {
      cartRequestRef.current.cancel();
      setCartSnapshot(null);
      setCartLoadState("idle");
      setHasCartItems(false);
      setIsOpen(false);
      return;
    }

    const request = cartRequestRef.current.start();
    setCartLoadState("loading");

    try {
      const { response, items, quote } = await fetchCustomerCartForOrderType({
        customerId,
        orderType: checkoutType === "pickup" ? "TAKEAWAY" : "DELIVERY",
        token,
        signal: request.signal,
      });

      if (!cartRequestRef.current.isCurrent(request)) return;

      if (!response || response.error || response.success === false) {
        setCartLoadState("error");
        setIsOpen(true);
        return;
      }

      const nextSnapshot = { items, quote };
      const nextHasCartItems = items.length > 0;
      setCartSnapshot(nextSnapshot);
      setHasCartItems(nextHasCartItems);
      setCartLoadState("ready");
      setCartRefreshKey((current) => current + 1);

      if (!nextHasCartItems) setIsOpen(false);
    } catch {
      if (cartRequestRef.current.isCurrent(request)) {
        setCartLoadState("error");
        setIsOpen(true);
      }
    }
  }, [checkoutType, checkoutTypeReady, customerId, loading, token]);

  useEffect(() => {
    void refreshCart();

    return () => cartRequestRef.current.cancel();
  }, [refreshCart]);

  useEffect(() => {
    setStoredCheckoutType(getStoredCheckoutTypePreference());
    setCheckoutTypeReady(true);

    const handleCartChanged = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as CartChangedDetail | undefined)
          : undefined;

      if (detail?.mutationStatus === "pending") {
        pendingCartMutationsRef.current += 1;
        setHasCartItems(true);
        return;
      }

      if (
        detail?.mutationStatus === "committed" ||
        detail?.mutationStatus === "rolled-back"
      ) {
        pendingCartMutationsRef.current = Math.max(
          0,
          pendingCartMutationsRef.current - 1,
        );

        if (pendingCartMutationsRef.current > 0) {
          return;
        }
      }

      setStoredCheckoutType(getStoredCheckoutTypePreference());

      if (detail?.cartData !== undefined) {
        cartRequestRef.current.cancel();
        setCartSnapshot(detail.cartData);
        setCartLoadState("ready");
        setCartRefreshKey((current) => current + 1);
      }

      const itemCount =
        typeof detail?.itemCount === "number"
          ? detail.itemCount
          : detail?.cartData !== undefined
            ? getCustomerCartItemCount(detail.cartData)
            : null;

      if (itemCount !== null) {
        const nextHasCartItems = itemCount > 0;
        setHasCartItems(nextHasCartItems);
        if (!nextHasCartItems) setIsOpen(false);

        if (shouldFetchCartAfterChange(detail)) void refreshCart();
        return;
      }

      if (shouldFetchCartAfterChange(detail)) void refreshCart();
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [refreshCart]);

  if (
    loading ||
    !customerId ||
    isHiddenRoute ||
    !shouldShowFloatingCart(hasCartItems, cartLoadState)
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 right-4 z-40 flex items-end justify-end sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8",
        hideOnMobileHome && "hidden md:flex",
      )}
    >
      {isOpen ? (
        <div className="relative h-[min(720px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))]">
          <Button
            type="button"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute -left-3 -top-3 z-10 h-9 w-9 rounded-full border border-black/10 bg-white text-[#222] shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:bg-[#f7f7f7]"
            aria-label={t("minimizeCart")}
          >
            <X className="h-4 w-4" />
          </Button>

          <OrderCartSidebar
            customerId={customerId}
            cartRefreshKey={cartRefreshKey}
            cartSnapshot={cartSnapshot}
            cartLoadState={cartLoadState}
            onCartRetry={() => void refreshCart()}
            onCartRefresh={() => void refreshCart()}
            presentation="floating"
            checkoutType={checkoutType}
            currency={currency}
          />
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-11 rounded-full border border-black/10 bg-white pl-2 pr-3.5 text-[#222] shadow-[0_14px_38px_rgba(15,23,42,0.16)] hover:bg-[#f7f7f7] sm:h-12 sm:pl-2.5 sm:pr-4"
          aria-label={t("openCart")}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 sm:h-8 sm:w-8">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </span>
          <span className="text-[13px] font-semibold sm:text-sm">
            {t("yourOrder")}
          </span>
        </Button>
      )}
    </div>
  );
}
