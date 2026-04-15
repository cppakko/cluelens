import { ComponentType, useEffect, useRef, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dictSettingsStorage, DictSetting, mergeMissingDicts } from '@/utils/storage';
import { dictMetaList, dictMetaMap, hasDictConfigView, loadDictConfigView } from '@/components/dicts';
import { DictConfig, DictID } from '@/components/dicts/types';
import type { Badge } from '@/components/ui/LanguageBadge';
import { cn } from '@/utils/tailwindUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/Dialog';
import { SettingToggleItem } from './ui';
import { useTranslation } from 'react-i18next';

interface SortableItemProps {
  id: string;
  name: string;
  iconSrc: string;
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-3 transition-[background-color,box-shadow] duration-200 hover:bg-(--m3-surface-container-low) hover:shadow-[0_14px_30px_color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]",
        isDragging && "z-10 bg-(--m3-surface-container-lowest) shadow-[0_18px_36px_color-mix(in_srgb,var(--m3-primary)_14%,transparent)]"
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-xl bg-(--m3-surface-container-low) p-2 text-(--m3-on-surface-variant) touch-none transition-colors hover:bg-(--m3-primary-container)/70 hover:text-(--m3-on-primary-container)"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </span>
      <img src={props.iconSrc} alt="" className="h-10 w-10 rounded-2xl bg-(--m3-surface-container-low) p-1.5 shadow-sm" />
      <span className="text-sm font-medium text-(--m3-on-surface)">{props.name}</span>
    </div>
  );
}

export default function DictionarySettings() {
  const DIALOG_CLOSE_ANIMATION_MS = 200;
  const { t } = useTranslation();
  const [settings, setSettings] = useState<DictSetting[]>([]);
  const [editingDictId, setEditingDictId] = useState<string | null>(null);
  const [subSettingsOpen, setSubSettingsOpen] = useState(false);
  const [ConfigView, setConfigView] = useState<ComponentType | null>(null);
  const clearDialogTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (clearDialogTimerRef.current !== null) {
      window.clearTimeout(clearDialogTimerRef.current);
      clearDialogTimerRef.current = null;
    }

    if (!editingDictId || !hasDictConfigView(editingDictId)) {
      setConfigView(null);
      return;
    }

    if (!subSettingsOpen) {
      clearDialogTimerRef.current = window.setTimeout(() => {
        setConfigView(null);
        setEditingDictId(null);
        clearDialogTimerRef.current = null;
      }, DIALOG_CLOSE_ANIMATION_MS);
      return;
    }

    let cancelled = false;

    void (async () => {
      const view = await loadDictConfigView(editingDictId);
      if (!cancelled) {
        setConfigView(() => view);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editingDictId, subSettingsOpen]);

  useEffect(() => () => {
    if (clearDialogTimerRef.current !== null) {
      window.clearTimeout(clearDialogTimerRef.current);
    }
  }, []);

  useEffect(() => {
    dictSettingsStorage.getValue().then((val) => {
      if (val) setSettings(mergeMissingDicts(val));
    });

    const unwatch = dictSettingsStorage.watch((newVal) => {
      if (newVal) setSettings(mergeMissingDicts(newVal));
    });

    return () => {
      unwatch();
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSettings((currentSettings) => {
        const enabledItems = currentSettings.filter(s => s.enabled);
        const oldIndex = enabledItems.findIndex((item) => item.id === active.id);
        const newIndex = enabledItems.findIndex((item) => item.id === over.id);
        const newEnabledItems = arrayMove(enabledItems, oldIndex, newIndex);

        let enabledPointer = 0;
        const newSettings = currentSettings.map(item => {
          if (item.enabled) {
            const newItem = newEnabledItems[enabledPointer];
            enabledPointer++;
            return newItem;
          } else {
            return item;
          }
        });

        dictSettingsStorage.setValue(newSettings);
        return newSettings;
      });
    }
  };

  const handleToggle = (id: string, checked: boolean) => {
    setSettings((items) => {
      const newItems = items.map((item) =>
        item.id === id ? { ...item, enabled: checked } : item
      );
      dictSettingsStorage.setValue(newItems);
      return newItems;
    });
  };

  if (settings.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-(--m3-primary) border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getLanguageBadges = (config: DictConfig): Badge[] => {
    const lang = config.language;
    switch (lang.type) {
      case 'all':
        return [{ label: t('language.all'), variant: 'all' }];
      case 'monolingual':
        return lang.languages.map(code => ({ label: t(`language.${code}`, code) }));
      case 'pairs': {
        const seen = new Set<string>();
        const badges: Badge[] = [];
        for (const [from, to] of lang.pairs) {
          const key = [from, to].sort().join('-');
          if (seen.has(key)) continue;
          seen.add(key);
          const reverse = lang.pairs.some(([f, t]) => f === to && t === from);
          const fromLabel = t(`language.${from}`, from);
          const toLabel = t(`language.${to}`, to);
          badges.push({ label: reverse ? `${fromLabel} ↔ ${toLabel}` : `${fromLabel} → ${toLabel}` });
        }
        return badges;
      }
    }
  };

  const enabledSettings = settings.filter(s => s.enabled);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-(--m3-surface-container-low)/56 p-3 shadow-[0_20px_50px_color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]">
        <div className="rounded-2xl bg-(--m3-secondary-container) px-4 py-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-(--m3-on-secondary-container)">
            {t('dictSettings.enableDicts')}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {dictMetaList.map((config) => {
            const setting = settings.find((s) => s.id === config.id);
            if (!setting) return null;
            const badges = getLanguageBadges(config);
            return (
              <SettingToggleItem
                key={setting.id}
                id={setting.id}
                name={config.displayNameKey ? t(config.displayNameKey) : config.displayName}
                languageBadges={badges}
                iconSrc={config.icon}
                enabled={setting.enabled}
                onToggle={(checked) => handleToggle(setting.id, checked)}
                onConfigClick={hasDictConfigView(setting.id) ? () => {
                  setEditingDictId(setting.id);
                  setSubSettingsOpen(true);
                } : undefined}
              />
            );
          })}
        </div>
      </section>

      {enabledSettings.length > 0 && (
        <section className="overflow-hidden rounded-3xl bg-(--m3-surface-container-low)/56 p-3 shadow-[0_20px_50px_color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]">
          <div className="rounded-2xl bg-(--m3-secondary-container) px-4 py-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-(--m3-on-secondary-container)">
              {t('dictSettings.displayOrder')}
            </span>
            <p className="text-xs text-(--m3-on-secondary-container)/70 mt-0.5 font-normal tracking-normal normal-case">
              {t('dictSettings.displayOrderDesc')}
            </p>
          </div>
          <div className="mt-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={enabledSettings.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {enabledSettings.map((setting) => {
                    const config = dictMetaMap[setting.id as DictID] || null;
                    const name = config ? (config.displayNameKey ? t(config.displayNameKey) : config.displayName) : setting.id;
                    const icon = config ? config.icon : '';

                    return (
                      <SortableItem
                        key={setting.id}
                        id={setting.id}
                        name={name}
                        iconSrc={icon}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </section>
      )}

      <Dialog open={subSettingsOpen} onOpenChange={(open) => setSubSettingsOpen(open)} aria-describedby='sub-setting panel'>
        <DialogContent className="flex max-h-[calc(100vh-32px)] flex-col overflow-hidden sm:max-w-lg">
          {editingDictId && (
            <>
              <DialogHeader>
                <DialogTitle>{(() => { const c = dictMetaMap[editingDictId as DictID]; return c?.displayNameKey ? t(c.displayNameKey) : c?.displayName; })()}</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto py-4">
                {ConfigView ? <ConfigView /> : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
