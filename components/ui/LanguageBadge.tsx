import { useState } from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/utils/tailwindUtils';

export interface Badge {
  label: string;
  variant?: 'default' | 'all';
}

function LanguageBadge({ label, variant = 'default' }: Badge) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap',
        variant === 'all'
          ? 'bg-(--m3-tertiary-container) text-(--m3-on-tertiary-container)'
          : 'bg-(--m3-secondary-container) text-(--m3-on-secondary-container)',
      )}
    >
      {label}
    </span>
  );
}

interface LanguageBadgeGroupProps {
  badges: Badge[];
  maxVisible?: number;
  moreLabel?: (count: number) => string;
}

export function LanguageBadgeGroup({ badges, maxVisible = 3, moreLabel }: LanguageBadgeGroupProps) {
  const [open, setOpen] = useState(false);

  if (badges.length === 0) return null;

  const visible = badges.slice(0, maxVisible);
  const hidden = badges.slice(maxVisible);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {visible.map((badge, i) => (
        <LanguageBadge key={i} {...badge} />
      ))}
      {hidden.length > 0 && (
        <TooltipPrimitive.Provider delayDuration={200}>
          <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
            <TooltipPrimitive.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-(--m3-surface-container-high) px-2 py-0.5 text-[11px] font-medium leading-tight text-(--m3-on-surface-variant) transition-colors hover:bg-(--m3-surface-container-highest)"
                onClick={() => setOpen((v) => !v)}
              >
                {moreLabel ? moreLabel(hidden.length) : `+${hidden.length}`}
              </button>
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content
                side="bottom"
                align="start"
                sideOffset={4}
                className="z-50 max-w-72 rounded-xl bg-(--m3-inverse-surface) px-3 py-2 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
              >
                <div className="flex flex-wrap gap-1">
                  {hidden.map((badge, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-(--m3-inverse-primary)/20 px-2 py-0.5 text-[11px] font-medium leading-tight text-(--m3-inverse-on-surface)"
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
                <TooltipPrimitive.Arrow className="fill-(--m3-inverse-surface)" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      )}
    </div>
  );
}

export { LanguageBadge };
