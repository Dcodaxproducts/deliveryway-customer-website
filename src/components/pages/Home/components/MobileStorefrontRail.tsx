import type { HTMLAttributes, ReactNode } from "react";

type MobileStorefrontRailProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children: ReactNode;
  variant?: "cards" | "categories";
};

export function MobileStorefrontRail({
  children,
  className = "",
  variant = "cards",
  ...props
}: MobileStorefrontRailProps) {
  const variantClassName =
    variant === "cards"
      ? "storefront-rail--cards"
      : "storefront-rail--categories";

  return (
    <div
      className={`storefront-rail ${variantClassName} ${className}`.trim()}
      data-storefront-rail={variant}
      {...props}
    >
      {children}
    </div>
  );
}
