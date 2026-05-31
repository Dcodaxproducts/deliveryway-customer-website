// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";

import HeroSection from "@/components/pages/Home/components/heroSection";
import FoodCategorySection from "@/components/pages/Home/components/foodCategorySection";
import WhyChooseUs from "@/components/pages/Home/components/whyChooseUsSection";
import AppPromo from "@/components/pages/Home/components/appPromoSection";
import Stats from "@/components/pages/Home/components/statsSection";
import BlogSection from "@/components/pages/Home/components/blogSection";
import NewsletterSection from "@/components/pages/Home/components/newsLetterSection";
import Footer from "@/components/layout/footer/Footer";
import RequiredBranchSelectionModal from "@/components/common/branch-selector/RequiredBranchSelectionModal";
import OrderNowFloatingButton from "@/components/ui/OrderNowFloatingButton";
import BranchOpeningHoursPopup from "@/components/pages/Home/components/BranchOpeningHours";

import { useAuth } from "@/hooks/useAuth";
import useCustomer from "@/hooks/useCustomer";

const normalizeHomeData = (res: unknown) => {
  return res?.data?.data || res?.data || res || {};
};

const getUserBranchId = (user: unknown) => {
  return user?.branchId || user?.branch?.id || "";
};

const getUserRestaurantId = (user: unknown) => {
  return user?.restaurantId || user?.branch?.restaurantId || "";
};

const HomePage = () => {
  const { user, token } = useAuth();
  const { get } = useCustomer(token);

  const [homeData, setHomeData] = useState<unknown>(null);

  const restaurantId = useMemo(() => getUserRestaurantId(user), [user]);
  const branchId = useMemo(() => getUserBranchId(user), [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerHome = async () => {
      if (!token) return;
      if(!branchId) return;
      try {
        const params = new URLSearchParams();

        if (restaurantId) {
          params.set("restaurantId", String(restaurantId));
        }

        if (branchId) {
          params.set("branchId", String(branchId));
        }

        const query = params.toString();
        const res: unknown = await get(
          `/customer-app/home${query ? `?${query}` : ""}`
        );

        if (!isMounted) return;

        if (res?.error) {
          setHomeData(null);
          return;
        }

        setHomeData(normalizeHomeData(res));
      } catch (error) {
        if (!isMounted) return;
        setHomeData(null);
      }
    };

    fetchCustomerHome();

    return () => {
      isMounted = false;
    };
  }, [token, restaurantId, branchId]);

  const resolvedBranch = homeData?.branch || user?.branch || null;
  const landingPopup = homeData?.landingPopup || null;

  return (
    <div>
      <BranchOpeningHoursPopup popup={landingPopup} branch={resolvedBranch} />

      <HeroSection />

      <section id="categories">
        <FoodCategorySection />
      </section>

      <WhyChooseUs />
      <AppPromo />
      <Stats />
      <BlogSection />
      <NewsletterSection />

      <Footer isHome={true} />

      {user && token && !branchId ? <RequiredBranchSelectionModal /> : null}

      <OrderNowFloatingButton />
    </div>
  );
};

export { HomePage };
