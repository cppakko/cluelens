import { useEffect, useState } from 'react';
import { SettingToggleItem } from "./ui";
import { TARGET_LANGUAGE_OPTIONS } from "@/utils/languageUtils";
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { UI_LANGUAGES } from '@/i18n';
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

export function GeneralSettings() {
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

  const handleUiLanguageChange = (value: string) => {
    updateSettings({ uiLanguage: value });

    if (value === 'auto') {
      try {
        const browserLang = browser.i18n.getUILanguage();
        const prefix = browserLang.split('-')[0];
        const resolved = prefix === 'zh' ? 'zh-CN' : (['en', 'ja'].includes(prefix) ? prefix : 'en');
        i18next.changeLanguage(resolved);
      } catch {
        i18next.changeLanguage('en');
      }
    } else {
      i18next.changeLanguage(value);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-(--m3-on-surface-variant) mt-1">{t('generalSettings.subtitle')}</p>
      </div>
      <div className="rounded-3xl p-3">
        <div className="space-y-2 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
          <label
            htmlFor="uiLanguage"
            className="block text-sm font-medium text-(--m3-on-surface) mb-1"
          >
            {t('commonSettings.uiLanguage')}
          </label>
          <Select
            value={settings.uiLanguage}
            onValueChange={handleUiLanguageChange}
          >
            <SelectTrigger
              id="uiLanguage"
              className={selectTriggerClassName}
            >
              <SelectValue placeholder={t('commonSettings.followBrowser')} />
            </SelectTrigger>
            <SelectContent position="popper" className={selectContentClassName}>
              {UI_LANGUAGES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={selectItemClassName}>
                  {opt.value === 'auto' ? t('commonSettings.followBrowser') : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-(--m3-on-surface-variant) mt-1.5">
            {t('commonSettings.uiLanguageDesc')}
          </p>
        </div>

        <SettingToggleItem
          id="enableLanguageDetection"
          name={t('commonSettings.enableLangDetection')}
          enabled={settings.enableLanguageDetection}
          onToggle={(checked) => {
            updateSettings({ enableLanguageDetection: checked });
          }}
          className="mt-3 bg-(--m3-surface-container-lowest) hover:bg-(--m3-surface-container-low)"
        />

        <SettingToggleItem
          id="autoSearch"
          name={t('commonSettings.autoSearch')}
          subtitle={t('commonSettings.autoSearchDesc')}
          enabled={settings.autoSearch}
          onToggle={(checked) => {
            updateSettings({ autoSearch: checked });
          }}
          className="mt-3 bg-(--m3-surface-container-lowest) hover:bg-(--m3-surface-container-low)"
        />

        <div className="mt-3 space-y-2 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
          <label
            htmlFor="translatorTargetLanguage"
            className="block text-sm font-medium text-(--m3-on-surface) mb-1"
          >
            {t('commonSettings.translatorOutputLang')}
          </label>
          <Select
            value={settings.translatorTargetLanguage}
            onValueChange={(val) => {
              updateSettings({ translatorTargetLanguage: val });
            }}
          >
            <SelectTrigger
              id="translatorTargetLanguage"
              className={selectTriggerClassName}
            >
              <SelectValue placeholder={t('languageOptions.followBrowser')} />
            </SelectTrigger>
            <SelectContent position="popper" className={selectContentClassName}>
              {TARGET_LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={selectItemClassName}>
                  {opt.value === 'auto' ? t('languageOptions.followBrowser') : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-(--m3-on-surface-variant) mt-1.5">
            {t('commonSettings.translatorOutputLangDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
