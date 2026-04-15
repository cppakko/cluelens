import { Switch } from "@/components/ui/Switch";
import { LanguageBadgeGroup, type Badge } from "@/components/ui/LanguageBadge";
import { cn } from "@/utils/tailwindUtils";
import { Settings } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface DictToggleItemProps {
  id: string;
  name: string;
  subtitle?: string;
  languageBadges?: Badge[];
  iconSrc?: string;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  onConfigClick?: () => void;
  className?: string;
}

export function SettingToggleItem({ id, name, subtitle, languageBadges, iconSrc, enabled, onToggle, onConfigClick, className }: DictToggleItemProps) {
  const { t } = useTranslation();
  return (
    <div className={cn("group flex items-center gap-3 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-3.5 transition-all duration-200 hover:bg-(--m3-surface-container-low) hover:shadow-[0_14px_30px_color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]", className)}>
      {iconSrc && <img src={iconSrc} alt="" className="h-10 w-10 rounded-2xl bg-(--m3-surface-container-low) p-1.5 shadow-sm" />}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-(--m3-on-surface)">{name}</span>
        {languageBadges
          ? <LanguageBadgeGroup badges={languageBadges} moreLabel={(count) => t('language.pairSummaryMore', { count })} />
          : subtitle && <p className="text-xs text-(--m3-on-surface-variant) mt-0.5">{subtitle}</p>
        }
      </div>
      {onConfigClick && (
        <button
          onClick={onConfigClick}
          className="rounded-full p-2 transition-colors hover:bg-(--m3-primary-container)/70 text-(--m3-primary) hover:text-(--m3-on-primary-container)"
          aria-label={t('ui.configure', { name })}
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      )}
      <Switch
        checked={enabled}
        onChange={onToggle}
        aria-label={`toggle-${id}`}
      />
    </div>
  );
}
