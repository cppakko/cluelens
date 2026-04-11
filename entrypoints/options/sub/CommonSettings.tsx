import { useEffect, useRef, useState, useMemo } from 'react';
import { SettingToggleItem } from "./ui";
import { TARGET_LANGUAGE_OPTIONS } from "@/utils/languageUtils";
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { UI_LANGUAGES } from '@/i18n';
import {
  commonSettingsStorage,
  getCommonSettings,
  themeColorStorage,
  darkModeStorage,
  themeChromaStorage,
  themeToneStorage,
  fontConfigStorage,
  fontConfigDefault,
  FONT_PRESETS,
  DEFAULT_THEME_COLOR,
  DEFAULT_THEME_CHROMA,
  DEFAULT_THEME_TONE,
  type CommonSettings,
  type FontConfig,
  type FontCDNProvider,
} from '@/utils/storage';
import { generateMD3Theme, chromaGradient, toneGradient, hueGradient } from '@/utils/md3Helper';
import { Hct, hexFromArgb } from '@material/material-color-utilities';
import { exportSettingsBackup, importSettingsBackup } from '@/utils/settingsBackup';
import { loadFont, unloadFont } from '@/utils/fontLoader';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/tailwindUtils';
import { Slider } from '@/components/ui/Slider';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { CheckCircle2, Download, RefreshCcw, Upload } from 'lucide-react';

const selectTriggerClassName = "h-11 w-full justify-between";
const selectContentClassName = "w-[var(--radix-select-trigger-width)]";
const selectItemClassName = "";

export function CommonSettings() {
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
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [darkMode, setDarkMode] = useState(false);
  const [themeChroma, setThemeChroma] = useState(DEFAULT_THEME_CHROMA);
  const [themeTone, setThemeTone] = useState(DEFAULT_THEME_TONE);
  const [themeHue, setThemeHue] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const darkModeRef = useRef(false);
  const chromaRef = useRef(DEFAULT_THEME_CHROMA);
  const toneRef = useRef(DEFAULT_THEME_TONE);
  const hueRef = useRef(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fontConfig, setFontConfig] = useState<FontConfig>(fontConfigDefault);
  const [customFontInput, setCustomFontInput] = useState('');

  useEffect(() => {
    getCommonSettings().then((val) => {
      setSettings(val);
    });
    themeColorStorage.getValue().then((color) => {
      setThemeColor(color);
      const hct = Hct.fromInt(parseInt(color.replace('#', ''), 16) >>> 0 | 0xFF000000);
      hueRef.current = hct.hue;
      setThemeHue(hct.hue);
    });
    darkModeStorage.getValue().then((val) => {
      setDarkMode(val ?? false);
      darkModeRef.current = val ?? false;
    });
    themeChromaStorage.getValue().then((val) => {
      const v = val ?? DEFAULT_THEME_CHROMA;
      setThemeChroma(v);
      chromaRef.current = v;
    });
    themeToneStorage.getValue().then((val) => {
      const v = val ?? DEFAULT_THEME_TONE;
      setThemeTone(v);
      toneRef.current = v;
    });

    fontConfigStorage.getValue().then((cfg) => {
      setFontConfig(cfg);
      const isPreset = FONT_PRESETS.some((p) => p.value === cfg.fontFamily);
      if (!isPreset) setCustomFontInput(cfg.fontFamily);
      if (cfg.enabled && cfg.fontFamily) {
        loadFont(cfg.fontFamily, cfg.cdnProvider);
      }
    });

    return () => {
      if (colorDebounceRef.current) {
        clearTimeout(colorDebounceRef.current);
      }
    };
  }, []);

  const hueGradientBg = useMemo(
    () => hueGradient(themeChroma, themeTone),
    [themeChroma, themeTone],
  );
  const chromaGradientBg = useMemo(
    () => chromaGradient(hueRef.current, themeTone),
    [themeColor, themeTone],
  );
  const toneGradientBg = useMemo(
    () => toneGradient(hueRef.current, themeChroma),
    [themeColor, themeChroma],
  );

  const updateSettings = (patch: Partial<CommonSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void commonSettingsStorage.setValue(next);
      return next;
    });
  };

  const handleUiLanguageChange = (value: string) => {
    updateSettings({ uiLanguage: value });

    applyUiLanguage(value);
  };

  const applyUiLanguage = (value: string) => {
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

  const handleExport = async () => {
    try {
      const backup = await exportSettingsBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cluelens-settings-${backup.exportedAt.replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setFeedback({ type: 'success', message: t('commonSettings.exportSuccess') });
    } catch {
      setFeedback({ type: 'error', message: t('commonSettings.exportError') });
    }
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File) => {
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
      colorDebounceRef.current = null;
    }

    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const imported = await importSettingsBackup(raw);

      setSettings(imported.commonSettings);
      setThemeColor(imported.themeColor);
      setDarkMode(imported.darkMode);
      darkModeRef.current = imported.darkMode;
      setThemeChroma(imported.themeChroma);
      setThemeTone(imported.themeTone);
      chromaRef.current = imported.themeChroma;
      toneRef.current = imported.themeTone;
      const importedHct = Hct.fromInt(parseInt(imported.themeColor.replace('#', ''), 16) >>> 0 | 0xFF000000);
      hueRef.current = importedHct.hue;
      setThemeHue(importedHct.hue);
      applyUiLanguage(imported.commonSettings.uiLanguage);
      setFontConfig(imported.fontConfig);
      if (imported.fontConfig.enabled && imported.fontConfig.fontFamily) {
        loadFont(imported.fontConfig.fontFamily, imported.fontConfig.cdnProvider);
      } else {
        unloadFont();
      }
      setFeedback({ type: 'success', message: t('commonSettings.importSuccess') });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('commonSettings.importErrorUnknown');
      setFeedback({
        type: 'error',
        message: t('commonSettings.importError', { message }),
      });
    }
  };

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!window.confirm(t('commonSettings.importConfirm'))) {
      return;
    }

    void handleImportFile(file);
  };

  const updateFontConfig = (patch: Partial<FontConfig>) => {
    setFontConfig((prev) => {
      const next = { ...prev, ...patch };
      void fontConfigStorage.setValue(next);
      if (next.enabled && next.fontFamily) {
        loadFont(next.fontFamily, next.cdnProvider);
      } else {
        unloadFont();
      }
      return next;
    });
  };

  const isPresetFont = FONT_PRESETS.some((p) => p.value === fontConfig.fontFamily);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-(--m3-on-surface-variant) mt-1">{t('commonSettings.subtitle')}</p>
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

        <div className="mt-3 space-y-2 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-(--m3-on-surface)">
              {t('commonSettings.themeColor')}
            </label>
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: themeColor }}
              />
              <span className="text-xs font-mono text-(--m3-on-surface-variant)">{themeColor}</span>
              {themeColor !== DEFAULT_THEME_COLOR && (
                <button
                  type="button"
                  onClick={() => {
                    const defaultHct = Hct.fromInt(parseInt(DEFAULT_THEME_COLOR.replace('#', ''), 16) >>> 0 | 0xFF000000);
                    hueRef.current = defaultHct.hue;
                    setThemeHue(defaultHct.hue);
                    setThemeColor(DEFAULT_THEME_COLOR);
                    void themeColorStorage.setValue(DEFAULT_THEME_COLOR);
                    const vars = generateMD3Theme(DEFAULT_THEME_COLOR, darkModeRef.current, '--m3', chromaRef.current, toneRef.current);
                    const root = document.documentElement;
                    for (const [key, value] of Object.entries(vars)) {
                      root.style.setProperty(key, value);
                    }
                    document.body.style.background = vars['--m3-surface-container-high'];
                    document.body.style.color = vars['--m3-on-surface'];
                  }}
                  className="text-(--m3-primary) hover:underline"
                >
                  <RefreshCcw className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 mt-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-(--m3-on-surface-variant)">Hue</label>
                <span className="text-xs font-mono text-(--m3-on-surface-variant)">
                  {Math.round(themeHue)}
                </span>
              </div>
              <Slider
                className="max-w-60"
                min={0}
                max={360}
                step={1}
                value={[themeHue]}
                trackBackground={hueGradientBg}
                onValueChange={([val]) => {
                  hueRef.current = val;
                  setThemeHue(val);
                  const newColor = hexFromArgb(Hct.from(val, chromaRef.current, toneRef.current).toInt());
                  setThemeColor(newColor);
                  const vars = generateMD3Theme(newColor, darkModeRef.current, '--m3', chromaRef.current, toneRef.current);
                  const root = document.documentElement;
                  for (const [key, value] of Object.entries(vars)) {
                    root.style.setProperty(key, value);
                  }
                  document.body.style.background = vars['--m3-surface-container-high'];
                  document.body.style.color = vars['--m3-on-surface'];
                  if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                  colorDebounceRef.current = setTimeout(() => {
                    void themeColorStorage.setValue(newColor);
                  }, 300);
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-(--m3-on-surface-variant)">Chroma</label>
                <span className="text-xs font-mono text-(--m3-on-surface-variant)">
                  {Math.round(themeChroma * 10) / 10}
                </span>
              </div>
              <Slider
                className="max-w-60"
                min={0}
                max={150}
                step={0.5}
                value={[themeChroma]}
                trackBackground={chromaGradientBg}
                onValueChange={([val]) => {
                  setThemeChroma(val);
                  chromaRef.current = val;
                  const vars = generateMD3Theme(themeColor, darkModeRef.current, '--m3', val, toneRef.current);
                  const root = document.documentElement;
                  for (const [key, value] of Object.entries(vars)) {
                    root.style.setProperty(key, value);
                  }
                  document.body.style.background = vars['--m3-surface-container-high'];
                  document.body.style.color = vars['--m3-on-surface'];
                  if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                  colorDebounceRef.current = setTimeout(() => {
                    void themeChromaStorage.setValue(val);
                  }, 300);
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-(--m3-on-surface-variant)">Tone</label>
                <span className="text-xs font-mono text-(--m3-on-surface-variant)">
                  {Math.round(themeTone * 10) / 10}
                </span>
              </div>
              <Slider
                className="max-w-60"
                min={0}
                max={100}
                step={0.5}
                value={[themeTone]}
                trackBackground={toneGradientBg}
                onValueChange={([val]) => {
                  setThemeTone(val);
                  toneRef.current = val;
                  const vars = generateMD3Theme(themeColor, darkModeRef.current, '--m3', chromaRef.current, val);
                  const root = document.documentElement;
                  for (const [key, value] of Object.entries(vars)) {
                    root.style.setProperty(key, value);
                  }
                  document.body.style.background = vars['--m3-surface-container-high'];
                  document.body.style.color = vars['--m3-on-surface'];
                  if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                  colorDebounceRef.current = setTimeout(() => {
                    void themeToneStorage.setValue(val);
                  }, 300);
                }}
              />
            </div>
          </div>

          <p className="text-xs text-(--m3-on-surface-variant) mt-1.5">
            {t('commonSettings.themeColorDesc')}
          </p>
          <p className="text-xs text-(--m3-on-surface-variant)">
            {t('commonSettings.chromaToneDesc')}
          </p>
        </div>

        <SettingToggleItem
          id="darkMode"
          name={t('commonSettings.darkMode')}
          enabled={darkMode}
          onToggle={(checked) => {
            setDarkMode(checked);
            darkModeRef.current = checked;
            void darkModeStorage.setValue(checked);
          }}
          className="mt-3 bg-(--m3-surface-container-lowest) hover:bg-(--m3-surface-container-low)"
        />

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

        <SettingToggleItem
          id="autoPreloadAudio"
          name={t('commonSettings.autoPreloadAudio')}
          enabled={settings.autoPreloadAudio}
          onToggle={(checked) => {
            updateSettings({ autoPreloadAudio: checked });
          }}
          className="mt-3 bg-(--m3-surface-container-lowest) hover:bg-(--m3-surface-container-low)"
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

        <div className="mt-3 space-y-3 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
          <div>
            <label className="block text-sm font-medium text-(--m3-on-surface) mb-1">
              {t('commonSettings.backupRestore')}
            </label>
            <p className="text-xs text-(--m3-on-surface-variant)">
              {t('commonSettings.backupRestoreDesc')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-(--m3-outline-variant)/70 bg-(--m3-surface-container-low) text-(--m3-on-surface) hover:bg-(--m3-surface-container)"
              onClick={() => void handleExport()}
            >
              <Upload className="h-4 w-4" />
              {t('commonSettings.exportJson')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-(--m3-outline-variant)/70 bg-(--m3-surface-container-low) text-(--m3-on-surface) hover:bg-(--m3-surface-container)"
              onClick={handleImportTrigger}
            >
              <Download className="h-4 w-4" />
              {t('commonSettings.importJson')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportChange}
            />
          </div>

          {feedback && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-xl px-3 py-2 text-sm',
                feedback.type === 'success'
                  ? 'bg-(--m3-tertiary-container) text-(--m3-on-tertiary-container)'
                  : 'bg-(--m3-error-container) text-(--m3-on-error-container)'
              )}
            >
              {feedback.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* ── Font Settings ── */}
        <div className="mt-3 space-y-3 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
          <div>
            <label className="block text-sm font-medium text-(--m3-on-surface) mb-1">
              {t('fontSettings.title')}
            </label>
          </div>

          <SettingToggleItem
            id="enableCustomFont"
            name={t('fontSettings.enableCustomFont')}
            enabled={fontConfig.enabled}
            onToggle={(checked) => updateFontConfig({ enabled: checked })}
            className="bg-(--m3-surface-container-low) hover:bg-(--m3-surface-container)"
          />

          {fontConfig.enabled && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-(--m3-on-surface)">
                  {t('fontSettings.fontFamily')}
                </label>
                <Select
                  value={isPresetFont ? fontConfig.fontFamily : '__custom__'}
                  onValueChange={(val) => {
                    if (val === '__custom__') {
                      if (customFontInput) {
                        updateFontConfig({ fontFamily: customFontInput });
                      }
                    } else {
                      updateFontConfig({ fontFamily: val });
                    }
                  }}
                >
                  <SelectTrigger className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className={selectContentClassName}>
                    {FONT_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value} className={selectItemClassName}>
                        {preset.label} — {preset.desc}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className={selectItemClassName}>
                      {t('fontSettings.customInput')}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {!isPresetFont && (
                  <Input
                    className="h-10 mt-2"
                    placeholder="e.g. Roboto, Source Han Sans SC"
                    value={customFontInput}
                    onChange={(e) => setCustomFontInput(e.target.value)}
                    onBlur={() => {
                      const trimmed = customFontInput.trim();
                      if (trimmed) updateFontConfig({ fontFamily: trimmed });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = customFontInput.trim();
                        if (trimmed) updateFontConfig({ fontFamily: trimmed });
                      }
                    }}
                  />
                )}
                <p className="text-xs text-(--m3-on-surface-variant) mt-1">
                  {t('fontSettings.fontFamilyDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-(--m3-on-surface)">
                  {t('fontSettings.cdnProvider')}
                </label>
                <Select
                  value={fontConfig.cdnProvider}
                  onValueChange={(val) => updateFontConfig({ cdnProvider: val as FontCDNProvider })}
                >
                  <SelectTrigger className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className={selectContentClassName}>
                    <SelectItem value="google" className={selectItemClassName}>
                      {t('fontSettings.cdnGoogle')}
                    </SelectItem>
                    <SelectItem value="sjtu-mirror" className={selectItemClassName}>
                      {t('fontSettings.cdnSjtuMirror')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-(--m3-on-surface-variant) mt-1">
                  {t('fontSettings.cdnProviderDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-(--m3-on-surface)">
                  {t('fontSettings.preview')}
                </label>
                <div
                  className="rounded-xl bg-(--m3-surface-container-low) px-4 py-3 text-sm text-(--m3-on-surface) leading-relaxed"
                  style={{ fontFamily: `"${fontConfig.fontFamily}", sans-serif` }}
                >
                  {t('fontSettings.previewText')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
