import { useEffect, useState } from 'react';
import { SettingToggleItem } from "./ui";
import { useTranslation } from 'react-i18next';
import {
  commonSettingsStorage,
  getCommonSettings,
  type CommonSettings,
} from '@/utils/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

const selectTriggerClassName = "h-11 w-full justify-between";
const selectContentClassName = "w-[var(--radix-select-trigger-width)]";
const selectItemClassName = "";

export function AudioSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<CommonSettings>({
    enableLanguageDetection: true,
    translatorTargetLanguage: 'auto',
    uiLanguage: 'auto',
    autoPreloadAudio: false,
    autoPlayAudio: false,
    ttsProvider: 'webSpeech',
    autoSearch: false,
  });

  useEffect(() => {
    getCommonSettings().then((val) => {
      setSettings(val);
    });
  }, []);

  const updateSettings = (patch: Partial<CommonSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void commonSettingsStorage.setValue(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-(--m3-on-surface-variant) mt-1">{t('audioSettings.subtitle')}</p>
      </div>
      <div className="rounded-3xl p-3">
        <SettingToggleItem
          id="autoPreloadAudio"
          name={t('commonSettings.autoPreloadAudio')}
          enabled={settings.autoPreloadAudio}
          onToggle={(checked) => {
            updateSettings({ autoPreloadAudio: checked });
          }}
          className="bg-(--m3-surface-container-lowest) hover:bg-(--m3-surface-container-low)"
        />

        <SettingToggleItem
          id="autoPlayAudio"
          name={t('commonSettings.autoPlayAudio')}
          subtitle={t('commonSettings.autoPlayAudioDesc')}
          enabled={settings.autoPlayAudio}
          onToggle={(checked) => {
            updateSettings({ autoPlayAudio: checked });
          }}
          className="mt-3 bg-(--m3-surface-container-lowest) hover:bg-(--m3-surface-container-low)"
        />

        {settings.autoPlayAudio && (
          <div className="mt-3 space-y-2 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
            <label
              htmlFor="ttsProvider"
              className="block text-sm font-medium text-(--m3-on-surface) mb-1"
            >
              {t('commonSettings.ttsProvider')}
            </label>
            <Select
              value={settings.ttsProvider}
              onValueChange={(val) => {
                updateSettings({ ttsProvider: val as CommonSettings['ttsProvider'] });
              }}
            >
              <SelectTrigger
                id="ttsProvider"
                className={selectTriggerClassName}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={selectContentClassName}>
                <SelectItem value="webSpeech" className={selectItemClassName}>
                  {t('commonSettings.ttsWebSpeech')}
                </SelectItem>
                <SelectItem value="lingva" className={selectItemClassName}>
                  {t('commonSettings.ttsLingva')}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-(--m3-on-surface-variant) mt-1.5">
              {t('commonSettings.ttsProviderDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
