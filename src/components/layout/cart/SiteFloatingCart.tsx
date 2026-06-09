"use client";

import { ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { OrderCartSidebar } from "@/components/pages/Items/components/signature-selection/OrderCartSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CART_CHANGED_EVENT } from "@/lib/cart-events";

const HIDDEN_CART_PATHS = ["/checkout", "/menu"];

export function SiteFloatingCart() {
  const pathname = usePathname();
  const t = useTranslations("cart");
  const { user, loading } = useAuth();
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const isHiddenRoute = HIDDEN_CART_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const refreshCart = useCallback(() => {
    setCartRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const handleCartChanged = () => {
      refreshCart();
      setIsOpen(true);
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [refreshCart]);

  if (loading || !user?.id || isHiddenRoute) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 flex items-end justify-end sm:bottom-6 sm:right-6">
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
            customerId={user.id}
            cartRefreshKey={cartRefreshKey}
            onCartRefresh={refreshCart}
            presentation="floating"
          />
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-14 rounded-full border border-black/10 bg-white px-5 text-[#222] shadow-[0_18px_48px_rgba(15,23,42,0.18)] hover:bg-[#f7f7f7]"
          aria-label={t("openCart")}
        >
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">{t("yourOrder")}</span>
        </Button>
      )}
    </div>
  );
}
