import React, { Suspense } from "react";
import CheckoutPage from "./CheckoutPage";

const page = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading checkout...
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
};

export default page;