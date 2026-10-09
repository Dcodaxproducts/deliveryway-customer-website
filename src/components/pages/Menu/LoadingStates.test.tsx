// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { MenuItemsSkeleton, MenuPageSkeleton } from "./MenuLoadingSkeleton";

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

afterEach(cleanup);

describe("items and menu loading contracts", () => {
  it("reserves menu card and cart geometry on cold load", () => {
    const { container } = render(<MenuPageSkeleton />);

    expect(screen.getAllByTestId("menu-card-skeleton")).toHaveLength(6);
    expect(container.querySelector("aside")).not.toBeNull();
    expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
  });

  it("keeps the same product-grid geometry for inner menu loads", () => {
    render(<MenuItemsSkeleton />);

    expect(screen.getAllByTestId("menu-card-skeleton")).toHaveLength(6);
    expect(screen.getByRole("status").className).toContain("md:grid-cols-2");
  });

  it("keeps error and empty menu states distinct with a localized retry", () => {
    const source = read(
      "../Items/components/signature-selection/SignatureSelectionContent.tsx",
    );

    expect(source).toContain("menuLoadFailed ?");
    expect(source).toContain('tSignature("retryMenus")');
    expect(source).toContain("menus.length === 0 ?");
    expect(source.indexOf("menuLoadFailed ?")).toBeLessThan(
      source.indexOf("menus.length === 0 ?"),
    );
  });

  it("starts domain context identically on server and client hydration", () => {
    const source = read("../../../hooks/useDomainContext.ts");
    const initializer = source.slice(
      source.indexOf("useState<DomainContextState>"),
      source.indexOf("useEffect(() =>"),
    );

    expect(initializer).toContain("context: null");
    expect(initializer).toContain("loading: true");
    expect(initializer).not.toContain("window");
    expect(initializer).not.toContain("localStorage");
  });
});
