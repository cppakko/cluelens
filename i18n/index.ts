import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import ja from './locales/ja.json';
import { commonSettingsStorage } from '@/utils/storage';

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  ja: { translation: ja },
};

/** Supported UI language codes */
export const UI_LANGUAGES = [
  { value: 'auto', labelKey: 'commonSettings.followBrowser' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
] as const;

/**
 * Map a browser UI language string to the closest supported i18n locale.
 * Falls back to 'en'.
 */
function mapBrowserLangToLocale(uiLang: string): string {
  const supported = ['en', 'zh-CN', 'ja'];
  if (supported.includes(uiLang)) return uiLang;

  const prefix = uiLang.split('-')[0];
  if (prefix === 'zh') return 'zh-CN';
  if (supported.includes(prefix)) return prefix;

  return 'en';
}

/**
 * Resolve the effective UI language.
 * When setting is 'auto', uses browser.i18n.getUILanguage().
 */
async function resolveUiLanguage(): Promise<string> {
  try {
    const settings = await commonSettingsStorage.getValue();
    const setting = settings?.uiLanguage ?? 'auto';

    if (setting !== 'auto') {
      return setting;
    }
  } catch {
    // storage might not be available yet
  }

  try {
    const uiLang = browser.i18n.getUILanguage();
    return mapBrowserLangToLocale(uiLang);
  } catch {
    return 'en';
  }
}

/**
 * Initialize i18next for the current entry point.
 * Must be called before rendering React.
 */
export async function initI18n(): Promise<typeof i18next> {
  const lng = await resolveUiLanguage();

  await i18next.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

  return i18next;
}

export default i18next;
