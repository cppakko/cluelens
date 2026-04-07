import * as React from "react"
import { cn } from "@/utils/tailwindUtils"

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onChange, disabled = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex h-8 w-13 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--m3-primary) focus-visible:ring-offset-2",
          checked
            ? "bg-(--m3-primary)"
            : "bg-(--m3-surface-container-highest) ring-2 ring-inset ring-(--m3-outline)",
          disabled && "opacity-[0.38] cursor-not-allowed",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-200",
            checked
              ? "left-6 h-6 w-6 bg-(--m3-on-primary)"
              : "left-2 h-4 w-4 bg-(--m3-outline)"
          )}
        >
          {checked && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-(--m3-primary)"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
      </button>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
export type { SwitchProps }
