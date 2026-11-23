// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CartSummarySection } from "./CartSummarySection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ""} />,
}));

afterEach(cleanup);

describe("CartSummarySection accessibility", () => {
  it("announces a localized backend checkout error as an assertive alert", () => {
    render(
      <CartSummarySection
        cartItems={[]}
        updateQuantity={() => undefined}
        deleteItem={() => undefined}
        clearCart={() => undefined}
        checkoutType="delivery"
        onPlaceOrder={() => undefined}
        backendError={{
          context: "checkout",
          code: "INTERNAL_ERROR",
          message: "Diese Adresse liegt außerhalb des Liefergebiets des Restaurants.",
        }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
    expect(alert.textContent).toContain("außerhalb des Liefergebiets");
  });
});
