import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
  testId?: string;
};

/** Decorative, motion-safe placeholder for content whose geometry is known. */
export function LoadingSkeleton({ className, testId }: LoadingSkeletonProps) {
  return (
    <span
      aria-hidden="true"
      data-loading-skeleton="true"
      data-testid={testId}
      className={cn("loading-skeleton block bg-gray-200", className)}
    />
  );
}
