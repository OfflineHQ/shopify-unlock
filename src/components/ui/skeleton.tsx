import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "offline-animate-pulse offline-rounded-md offline-bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
