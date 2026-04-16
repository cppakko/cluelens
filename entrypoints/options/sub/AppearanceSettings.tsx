import { useEffect, useRef, useState, useMemo } from 'react';
import { SettingToggleItem } from "./ui";
import { useTranslation } from 'react-i18next';
import {
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
  type FontConfig,
  type FontCDNProvider,
} from '@/utils/storage';
import { generateMD3Theme, chromaGradient, toneGradient, hueGradient } from '@/utils/md3Helper';
import { Hct, hexFromArgb } from '@material/material-color-utilities';
import { loadFont, unloadFont } from '@/utils/fontLoader';
import { Slider } from '@/components/ui/Slider';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { RefreshCcw } from 'lucide-react';

const selectTriggerClassName = "h-11 w-full justify-between";
const selectContentClassName = "w-[var(--radix-select-trigger-width)]";
const selectItemClassName = "";

export function AppearanceSettings() {
  const { t } = useTranslation();
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [darkMode, setDarkMode] = useState(false);
  const [themeChroma, setThemeChroma] = useState(DEFAULT_THEME_CHROMA);
  const [themeTone, setThemeTone] = useState(DEFAULT_THEME_TONE);
  const [themeHue, setThemeHue] = useState(0);
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const darkModeRef = useRef(false);
  const chromaRef = useRef(DEFAULT_THEME_CHROMA);
  const toneRef = useRef(DEFAULT_THEME_TONE);
  const hueRef = useRef(0);
  const [fontConfig, setFontConfig] = useState<FontConfig>(fontConfigDefault);
  const [customFontInput, setCustomFontInput] = useState('');

  useEffect(() => {
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
        <p className="text-sm text-(--m3-on-surface-variant) mt-1">{t('appearanceSettings.subtitle')}</p>
      </div>
      <div className="rounded-3xl p-3">
        <div className="space-y-2 rounded-2xl bg-(--m3-surface-container-lowest) px-4 py-4">
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
