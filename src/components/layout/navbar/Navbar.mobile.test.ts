import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./Navbar.tsx", import.meta.url),
  "utf8",
);

describe("mobile navigation accessibility contract", () => {
  it("keeps the navbar sticky without scroll-direction hiding", () => {
    expect(source).toContain('className="sticky top-0 z-50');
    expect(source).not.toContain("resolveNavbarVisibility");
    expect(source).not.toContain("-translate-y-full");
  });

  it("animates the same-side drawer and keeps it mounted", () => {
    expect(source).toContain('mobileOpen ? "translate-x-0" : "translate-x-full"');
    expect(source).toContain("motion-reduce:transition-none");
    expect(source).toContain("inert={!mobileOpen}");
  });

  it("locks scroll, traps focus, supports Escape, and returns focus", () => {
    expect(source).toContain('document.body.style.overflow = "hidden"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('event.key !== "Tab"');
    expect(source).toContain("mobileMenuTriggerRef.current?.focus()");
  });

  it("supports overlay close and safe-area padding", () => {
    expect(source).toContain("onClick={() => setMobileOpen(false)}");
    expect(source).toContain("env(safe-area-inset-bottom)");
    expect(source).toContain("env(safe-area-inset-top)");
  });
});
