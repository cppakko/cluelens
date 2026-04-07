import type { PointerEventHandler } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Search, Settings, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

type DragHandlers = {
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onPointerCancel?: PointerEventHandler<HTMLDivElement>;
};

interface DictAppBarProps {
  handler?: DragHandlers;
  onClose?: () => void;
  onOpenSettings?: () => void;
  text?: string;
  onSearch?: (text: string) => void;
  autoFocus?: boolean;
}

export function DictAppBar({ handler, onClose, onOpenSettings, text, onSearch, autoFocus }: DictAppBarProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(text || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(text || '');
  }, [text]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);


  const handleSearch = useCallback(() => {
    if (onSearch && inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  }, [onSearch, inputValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // M3 Top App Bar: surface-container-high bg + on-surface-variant icons
  const AppBarButtonStyle = 'hover:bg-(--m3-on-surface)/8 active:bg-(--m3-on-surface)/14 rounded-full transition-colors duration-150';
  const inputPaddingRight = onClose ? "pr-[120px]" : "pr-[84px]";

  return <>
    <div className="bg-(--m3-surface-container-high) shadow-[0_1px_3px_color-mix(in_srgb,var(--m3-on-surface)_15%,transparent)]">
      <div className="flex items-center p-2 px-3" {...handler}>
        <div className="flex grow items-center">
          <div className="relative flex items-center w-full">
            <Input
              ref={inputRef}
              placeholder={t('appbar.searchPlaceholder')}
              id="standard-basic"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`rounded-full border-none bg-(--m3-surface-container-lowest) ${inputPaddingRight} text-(--m3-primary) transition-all duration-200 ease-in-out text-[14px] placeholder:text-(--m3-on-surface-variant) selection:bg-(--m3-primary)/20 focus:ring-2 focus:ring-(--m3-primary)/20`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('appbar.searchAriaLabel')}
                title={t('appbar.search')}
                onClick={handleSearch}
                onPointerDown={(e) => e.stopPropagation()}
                className={AppBarButtonStyle}
              >
                <Search className="size-5 text-(--m3-primary)" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('appbar.settingsAriaLabel')}
                title={t('appbar.settings')}
                onClick={onOpenSettings}
                onPointerDown={(e) => e.stopPropagation()}
                className={AppBarButtonStyle}
              >
                <Settings className="size-5 text-(--m3-primary)" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('appbar.closeAriaLabel')}
                  title={t('appbar.close')}
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={AppBarButtonStyle}
                >
                  <X className="size-5 text-(--m3-primary)" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
}