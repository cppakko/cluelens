export interface LanguageOption {
    value: string;
    label: string;
}

/** Supported target language options shown in settings UI */
export const TARGET_LANGUAGE_OPTIONS: LanguageOption[] = [
    { value: 'auto', label: '跟随浏览器语言' },
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'ru', label: 'Русский' },
    { value: 'pt', label: 'Português' },
    { value: 'it', label: 'Italiano' },
];

/** All supported language codes (excluding 'auto') */
const SUPPORTED_CODES = TARGET_LANGUAGE_OPTIONS
    .filter((o) => o.value !== 'auto')
    .map((o) => o.value);

/**
 * Map a browser UI language string (e.g. "zh-CN", "en-US", "ja") to the
 * closest supported target language code. Falls back to 'zh-CN'.
 */
function mapBrowserLang(uiLang: string): string {
    if (SUPPORTED_CODES.includes(uiLang)) return uiLang;

    // prefix match (e.g. "en-US" → "en", "pt-BR" → "pt", "zh-TW" → "zh-CN")
    const prefix = uiLang.split('-')[0];
    if (prefix === 'zh') return 'zh-CN'; // all Chinese variants → zh-CN
    const match = SUPPORTED_CODES.find((c) => c === prefix);
    if (match) return match;

    return 'zh-CN';
}

/**
 * Resolve the effective target language from the user setting.
 * When setting is 'auto', uses browser.i18n.getUILanguage().
 */
export function resolveTargetLanguage(setting: string): string {
    if (setting === 'auto') {
        try {
            const uiLang = browser.i18n.getUILanguage();
            return mapBrowserLang(uiLang);
        } catch {
            return 'zh-CN';
        }
    }
    return setting;
}

// ─── Per-engine language code mappers ────────────────────────────────

/**
 * DeepL / DeepLx uses uppercase ISO-639-1 codes, with some special cases.
 */
const DEEPLX_LANG_MAP: Record<string, string> = {
    'zh-CN': 'ZH',
    'en': 'EN',
    'ja': 'JA',
    'ko': 'KO',
    'fr': 'FR',
    'de': 'DE',
    'es': 'ES',
    'ru': 'RU',
    'pt': 'PT',
    'it': 'IT',
};

export function toDeepLxLangCode(lang: string): string {
    return DEEPLX_LANG_MAP[lang] || 'ZH';
}

/**
 * Caiyun translate only supports zh / en / ja as target.
 * Uses "auto2<target>" trans_type format.
 */
const CAIYUN_TARGET_MAP: Record<string, string> = {
    'zh-CN': 'auto2zh',
    'en': 'auto2en',
    'ja': 'auto2ja',
};

export function toCaiyunTransType(lang: string): string {
    return CAIYUN_TARGET_MAP[lang] || 'auto2zh';
}
