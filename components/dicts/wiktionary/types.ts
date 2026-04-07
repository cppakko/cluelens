import { I18n } from "webextension-polyfill";

export interface WiktionaryResult {
  title: string;
  html: string;
  baseUrl: string;
}

export interface WiktionaryConfig {
  displayLanguage: I18n.LanguageCode;
}

export const defaultWiktionaryConfig: WiktionaryConfig = {
  displayLanguage: 'zh',
}
