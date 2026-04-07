"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/utils/tailwindUtils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-(--m3-outline-variant)/70 bg-(--m3-surface-container-lowest)/78 px-3 py-2 text-sm text-(--m3-on-surface) shadow-[0_8px_20px_color-mix(in_srgb,var(--m3-on-surface)_5%,transparent)] backdrop-blur-sm transition-all duration-200 outline-none select-none data-[size=default]:h-11 data-[size=sm]:h-9 data-[size=sm]:rounded-[min(var(--radius-md),12px)] data-placeholder:text-(--m3-on-surface-variant)/65 hover:border-(--m3-outline) hover:bg-(--m3-surface-container-lowest)/92 focus-visible:border-(--m3-primary) focus-visible:ring-4 focus-visible:ring-(--m3-primary)/14 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/12 disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-(--m3-on-surface-variant)" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn("relative z-50 min-w-40 max-h-(--radix-select-content-available-height) overflow-x-hidden overflow-y-auto rounded-2xl bg-(--m3-surface-container-lowest)/88 text-(--m3-on-surface) shadow-[0_20px_50px_color-mix(in_srgb,var(--m3-on-surface)_16%,transparent)] backdrop-blur-xl ring-1 ring-(--m3-outline-variant)/30 duration-150 origin-(--radix-select-content-transform-origin) data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[align-trigger=true]:animate-none", position === "popper" && "data-[side=bottom]:translate-y-1.5 data-[side=left]:-translate-x-1.5 data-[side=right]:translate-x-1.5 data-[side=top]:-translate-y-1.5", className)}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "p-1 data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && ""
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-xl py-2 pr-9 pl-3 text-sm text-(--m3-on-surface) outline-hidden select-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-50 focus:bg-(--m3-primary-container)/75 focus:text-(--m3-on-primary-container) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-3 flex size-4 items-center justify-center text-(--m3-primary)">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("z-10 flex cursor-default items-center justify-center py-2 text-(--m3-on-surface-variant) [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("z-10 flex cursor-default items-center justify-center py-2 text-(--m3-on-surface-variant) [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}
