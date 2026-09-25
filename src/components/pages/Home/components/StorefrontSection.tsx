import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StorefrontSectionProps = {
  children: ReactNode;
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
  className?: string;
  headerClassName?: string;
};

export function StorefrontSection({
  children,
  title,
  eyebrow,
  description,
  action,
  id,
  className,
  headerClassName,
}: StorefrontSectionProps) {
  const hasHeader = title || eyebrow || description || action;

  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14",
        className,
      )}
    >
      {hasHeader ? (
        <div
          className={cn(
            "mb-6 flex items-end justify-between gap-4",
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className={cn("text-2xl font-bold text-gray-900", eyebrow && "mt-1")}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
