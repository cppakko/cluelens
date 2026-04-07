import type { I18n } from 'webextension-polyfill'

/**
 * Supported language codes (BCP 47) and their character matchers.
 * Uses I18n.LanguageCode from webextension-polyfill for type consistency.
 */
export type SupportedLanguageCode = 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'es' | 'de'

const matchers: Record<SupportedLanguageCode, RegExp> = {
  zh: /[\u4e00-\u9fa5]/,
  en: /[a-zA-Z]/,
  /** Hiragana & Katakana, no Chinese */
  ja: /[\u3041-\u3096\u30A0-\u30FF]/,
  /** Korean Hangul, no Chinese */
  ko: /[\u3131-\u4dff\u9fa6-\uD79D]/,
  /** French-specific characters: àâäèéêëîïôœùûüÿç */
  fr: /[\u00e0\u00e2\u00e4\u00e8\u00e9\u00ea\u00eb\u00ee\u00ef\u00f4\u0153\u00f9\u00fb\u00fc\u00ff\u00e7]/i,
  /** Spanish-specific characters: áéíóúñü¡¿ */
  es: /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc\u00a1\u00bf]/i,
  /** German-specific characters: äöüÄÖÜß */
  de: /[\u00E4\u00F6\u00FC\u00C4\u00D6\u00DC\u00df]/i,
}

const matcherPunct = /[/[\]{}$^*+|?.\-~!@#%&()_='";:><,。？！，、；：""﹃﹄「」﹁﹂''『』（）—［］〔〕【】…－～·‧《》〈〉﹏＿]/
const matchAllMeaningless = new RegExp(`^(\\d|\\s|${matcherPunct.source})+$`)


/**
 * Detect the primary language of the given text.
 * Returns the best-matching I18n.LanguageCode, or 'und' (undetermined) if
 * no supported language is detected.
 *
 * Detection priority: zh > ja > ko (CJK first), then fr > es > de > en.
 * For Latin-script languages, whichever has the most unique character hits wins.
 */
export function detectTextLanguage(text: string): I18n.LanguageCode {
  if (!text || matchAllMeaningless.test(text)) {
    return 'und'
  }

  // CJK detection: check in priority order (Chinese > Japanese > Korean)
  // Japanese and Korean matchers exclude Chinese characters, so order matters.
  const cjkCodes: SupportedLanguageCode[] = ['zh', 'ja', 'ko']
  for (const code of cjkCodes) {
    if (matchers[code].test(text)) {
      return code
    }
  }

  // Latin-script languages: count unique character matches
  const latinCodes: SupportedLanguageCode[] = ['fr', 'es', 'de']
  let bestLatin: SupportedLanguageCode | null = null
  let bestCount = 0

  for (const code of latinCodes) {
    const regex = new RegExp(matchers[code].source, 'gi')
    const matches = text.match(regex)
    if (matches && matches.length > bestCount) {
      bestCount = matches.length
      bestLatin = code
    }
  }

  if (bestLatin) {
    return bestLatin
  }

  // Fallback: if it contains English characters, treat as English
  if (matchers.en.test(text)) {
    return 'en'
  }

  return 'und'
}