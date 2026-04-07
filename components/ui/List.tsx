import * as React from "react"
import { cn } from "@/utils/tailwindUtils"

const List = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "w-full flex-1 touch-pan-y list-none overflow-auto scroll-smooth bg-transparent p-0 m-0 custom-scrollbar",
      className
    )}
    {...props}
  />
))
List.displayName = "List"

const ListItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "px-4 py-2 transition-all duration-200 ease-in-out last:border-b-0",
      className
    )}
    {...props}
  />
))
ListItem.displayName = "ListItem"

export { List, ListItem }
