# Mobile storefront navigation redesign

## Design note

The mobile layout keeps DeliveryWays tenant colors, logo, typography, data, and existing actions. The supplied restaurant screenshots informed only interaction patterns: a stable header, a same-side menu sheet, a compact stacked order/search surface, horizontal discovery rails, and a viewport-bounded deal chooser.

## Mobile wireframe

```text
┌──────────────────────────────────┐
│ Tenant logo                  ☰   │  sticky navbar
├──────────────────────────────────┤
│ Deliver to / branch              │
│ Tenant logo + restaurant name    │  branded hero
├──────────────────────────────────┤
│ 🔎 Search menu                    │
│ [ Delivery ] [ Pickup ]          │  sticky below navbar
│ (Category) (Category) (Category) │  snap rail + scrollbar affordance
├──────────────────────────────────┤
│ Featured deal                    │
│ Promotions: 2+ visible cards →   │
│ Deals: snapping cards →          │
│ Existing storefront sections     │
└──────────────────────────────────┘

Menu: backdrop + right-side sheet, safe-area padding, body scroll lock, focus trap/return, Escape and overlay close. No day/night control.

Deal chooser: bottom sheet on mobile and centered dialog on larger screens; fixed header and action footer, internally scrolling option list, safe-area action padding, and larger selection/quantity targets.

## Responsive behavior

- 360–430px: compact spacing, 44px minimum primary controls, promotion density of roughly 2 cards in view.
- Tablet/desktop: existing desktop navigation and content layouts remain in place.
- Reduced motion: drawer and rail behavior remains usable without animation.
