"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { SignatureSelectionContent } from "@/components/pages/Items/components/signature-selection/SignatureSelectionContent";
import { OrderCartSidebar } from "@/components/pages/Items/components/signature-selection/OrderCartSidebar";
import { MenuPageSkeleton } from "@/components/pages/Menu/MenuLoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { getSelectedOrderType } from "@/lib/branch-selector";
import {
  getStoredCheckoutTypePreference,
  resolveSelectedCheckoutType,
  type CheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { dispatchCartChanged } from "@/lib/cart-events";
import {
  getCartSnapshotState,
  getServerCartSnapshotState,
  subscribeCartSnapshotState,
} from "@/lib/cart-snapshot-store";

function MenuPageContent() {
  const { restaurantId, user, loading } = useAuth();
  const cartState = useSyncExternalStore(
    subscribeCartSnapshotState,
    getCartSnapshotState,
    getServerCartSnapshotState,
  );
  const [storedCheckoutType, setStoredCheckoutType] =
    useState<CheckoutTypePreference | null>(null);
  const checkoutType = resolveSelectedCheckoutType(
    getSelectedOrderType(user),
    storedCheckoutType,
  );

  useEffect(() => {
    setStoredCheckoutType(getStoredCheckoutTypePreference());
  }, []);

  const handleCartRefresh = () => dispatchCartChanged({ refreshCart: true });

  if (loading) {
    return <MenuPageSkeleton />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto overflow-x-hidden">
        <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 overflow-x-hidden">
            <SignatureSelectionContent
              restaurantId={restaurantId}
              customerId={user?.id}
              branchId={user?.branchId}
              onCartRefresh={handleCartRefresh}
            />
          </div>

          <div className="min-w-0">
            <OrderCartSidebar
              customerId={user?.id}
              cartRefreshKey={cartState.cartRefreshKey}
              cartSnapshot={cartState.cartSnapshot}
              cartLoadState={cartState.cartLoadState}
              managedSnapshot
              onCartRetry={handleCartRefresh}
              onCartRefresh={handleCartRefresh}
              checkoutType={checkoutType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MenuPage() {
  return (
    <Suspense fallback={<MenuPageSkeleton />}>
      <MenuPageContent />
    </Suspense>
  );
}
