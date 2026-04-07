/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/utils/tailwindUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface StorageItem<T> {
  getValue(): Promise<T | null>;
  setValue(val: T): Promise<void>;
}

export function useConfigState<T extends object>(
  storage: StorageItem<T>,
  defaultConfig: T
) {
  const [config, setConfig] = useState<T>(defaultConfig);

  useEffect(() => {
    storage.getValue().then((val) => {
      if (val) setConfig(val);
    });
  }, []);

  const handleChange = useCallback(
    (patch: Partial<T>) => {
      setConfig((prev) => {
        const updated = { ...prev, ...patch };
        storage.setValue(updated);
        return updated;
      });
    },
    [storage]
  );

  return [config, handleChange] as const;
}

export function ConfigContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'custom-scrollbar space-y-4 max-h-[60vh] overflow-y-auto pr-1',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ConfigField({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2 rounded-2xl bg-(--m3-surface-container-low)/72 p-4 shadow-[0_12px_28px_color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]', className)}>
      <label className="block text-sm font-medium text-(--m3-on-surface)">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-(--m3-on-surface-variant) leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export const ConfigInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-xl border border-(--m3-outline-variant)/70 bg-(--m3-surface-container-lowest)/82 px-3.5 py-2 text-sm text-(--m3-on-surface) placeholder:text-(--m3-on-surface-variant)/60 shadow-[0_8px_18px_color-mix(in_srgb,var(--m3-on-surface)_4%,transparent)] backdrop-blur-sm',
      'transition-all focus:outline-none focus:border-(--m3-primary) focus:ring-4 focus:ring-(--m3-primary)/12',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ConfigInput.displayName = 'ConfigInput';

export const ConfigSelect = React.forwardRef<
  HTMLButtonElement,
  {
    value: string;
    onValueChange: (value: string) => void;
    options: Array<{ value: string; label: React.ReactNode }>;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
  }
>(({ className, contentClassName, options, placeholder, ...props }, ref) => (
  <Select
    value={props.value}
    onValueChange={props.onValueChange}
    disabled={props.disabled}
  >
    <SelectTrigger
      ref={ref}
      className={cn('h-11 w-full justify-between', className)}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent
      position="popper"
      className={cn('w-(--radix-select-trigger-width)', contentClassName)}
    >
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
));
ConfigSelect.displayName = 'ConfigSelect';

export const ConfigTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-30 w-full rounded-xl border border-(--m3-outline-variant)/70 bg-(--m3-surface-container-lowest)/82 px-3.5 py-3 text-sm text-(--m3-on-surface) placeholder:text-(--m3-on-surface-variant)/60 shadow-[0_8px_18px_color-mix(in_srgb,var(--m3-on-surface)_4%,transparent)] backdrop-blur-sm',
      'transition-all focus:outline-none focus:border-(--m3-primary) focus:ring-4 focus:ring-(--m3-primary)/12',
      'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
      className
    )}
    {...props}
  />
));
ConfigTextarea.displayName = 'ConfigTextarea';

export function ConfigCheckbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <button
        id={id}
        role="checkbox"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
          checked
            ? 'border-(--m3-primary) bg-(--m3-primary)'
            : 'border-(--m3-outline-variant) bg-(--m3-surface-container-lowest)/82'
        )}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--m3-on-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <label
        htmlFor={id}
        className="text-sm font-medium text-(--m3-on-surface) leading-none cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}

export function ConfigLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-(--m3-primary) hover:underline font-medium"
    >
      {children}
    </a>
  );
}
