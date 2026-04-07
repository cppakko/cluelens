import { cn } from "@/utils/tailwindUtils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-skeleton-shimmer rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
