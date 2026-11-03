import { describe, expect, it } from "vitest";

import {
  captureBodyScrollStyles,
  getNavbarStickyOffset,
  resolveDrawerKeyAction,
  restoreBodyScrollStyles,
} from "@/lib/mobile-drawer";

describe("mobile drawer behavior", () => {
  it("closes on Escape", () => {
    expect(resolveDrawerKeyAction({ key: "Escape", shiftKey: false, activeIndex: 1, focusableCount: 3 })).toBe("close");
  });

  it("wraps focus in both directions", () => {
    expect(resolveDrawerKeyAction({ key: "Tab", shiftKey: false, activeIndex: 2, focusableCount: 3 })).toBe("focus-first");
    expect(resolveDrawerKeyAction({ key: "Tab", shiftKey: true, activeIndex: 0, focusableCount: 3 })).toBe("focus-last");
  });

  it("restores pre-existing body scroll styles after close", () => {
    const style = { overflow: "clip", paddingRight: "7px" };
    const previous = captureBodyScrollStyles(style);
    style.overflow = "hidden";
    style.paddingRight = "15px";
    restoreBodyScrollStyles(style, previous);
    expect(style).toEqual({ overflow: "clip", paddingRight: "7px" });
  });

  it("turns rendered navbar height into a stable sticky offset", () => {
    expect(getNavbarStickyOffset(84)).toBe("84px");
    expect(getNavbarStickyOffset(-1)).toBe("0px");
  });
});
