export enum DictID {
  Bing = 'bing',
  Caiyun = 'caiyun',
  Google = 'google',
  Greens = 'greens',
  OpenAI = 'openai',
  Jisho = 'jisho',
  DictionaryApi = 'dictionaryapi',
  Zdic = 'zdic',
  Moegirl = 'moegirl',
  Deeplx = 'deeplx',
  Wiktionary = 'wiktionary',
  Urban = 'urban',
  Omw = 'omw',
  Dwds = 'dwds',
  Cambridge = 'cambridge',
  BingTranslate = 'bingtranslate',
  SpanishDict = 'spanishdict',
}

export enum ModuleType {
  Dict = 'dict',
  Translator = 'translator',
  Other = 'other',
}

export interface SearchOptions {
  targetLang?: string;
}

export type LanguageSupport =
  | { type: 'all' }
  | { type: 'monolingual'; languages: string[] }
  | { type: 'pairs'; pairs: [string, string][] };

export interface DictConfig {
  id: string;
  displayName: string;
  displayNameKey?: string;
  icon: string;
  language: LanguageSupport;
  type: ModuleType;
}

/** Check whether a language code is supported by a given dict config. */
export function isLanguageSupported(lang: LanguageSupport, inputLang: string): boolean {
  switch (lang.type) {
    case 'all':
      return true;
    case 'monolingual':
      return lang.languages.includes(inputLang);
    case 'pairs':
      return lang.pairs.some(([from]) => from === inputLang);
  }
}
