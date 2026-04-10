import { DictID } from '@/components/dicts/types';
import { CaiyunConfig, caiyunConfigDefault } from '@/components/dicts/caiyun/types';
import { OpenAIConfig, openAIConfigDefault } from '@/components/dicts/openai/types';
import { DeeplxConfig, deeplxConfigDefault } from '@/components/dicts/deeplx/types';
import { WiktionaryConfig, defaultWiktionaryConfig } from '@/components/dicts/wiktionary/types';
import { OmwConfig, defaultOmwConfig } from '@/components/dicts/omw/types';

export interface CommonSettings {
  enableLanguageDetection: boolean;
  translatorTargetLanguage: string;
  uiLanguage: string;
  autoPreloadAudio: boolean;
}

export const commonSettingsDefault: CommonSettings = {
  enableLanguageDetection: false,
  translatorTargetLanguage: 'auto',
  uiLanguage: 'auto',
  autoPreloadAudio: false,
};

export const commonSettingsStorage = storage.defineItem<CommonSettings>(
  'local:commonSettings',
  {
    fallback: commonSettingsDefault,
    version: 2,
    migrations: {
      2: (val: unknown) => ({ ...commonSettingsDefault, ...(val as Record<string, unknown>) }),
    },
  }
);

export async function getCommonSettings(): Promise<CommonSettings> {
  const stored = await commonSettingsStorage.getValue();
  return { ...commonSettingsDefault, ...stored };
}

export interface DictSetting {
  id: DictID;
  enabled: boolean;
}

const defaultEnabledDicts = new Set([
  DictID.Bing,
  DictID.Google,
  DictID.Wiktionary,
]);

const defaultDictSettings: DictSetting[] = (Object.values(DictID) as DictID[]).map(id => ({
  id,
  enabled: defaultEnabledDicts.has(id),
}));

export const dictSettingsStorage = storage.defineItem<DictSetting[]>(
  'local:dictSettings',
  {
    fallback: defaultDictSettings,
    version: 1,
  }
);

export function mergeMissingDicts(stored: DictSetting[]): DictSetting[] {
  const allIds = new Set(Object.values(DictID) as DictID[]);
  const seenIds = new Set<DictID>();
  const result: DictSetting[] = [];

  for (const item of stored) {
    if (allIds.has(item.id)) {
      seenIds.add(item.id);
      result.push(item);
    }
  }

  for (const id of allIds) {
    if (!seenIds.has(id)) {
      result.push({ id, enabled: false });
    }
  }

  return result;
}

export const caiyunConfigStorage = storage.defineItem<CaiyunConfig>(
  'local:caiyunConfig',
  {
    fallback: caiyunConfigDefault,
    version: 1,
  }
);

export const openAIConfigStorage = storage.defineItem<OpenAIConfig>(
  'local:openaiConfig',
  {
    fallback: openAIConfigDefault,
    version: 1,
  }
);

export const deeplxConfigStorage = storage.defineItem<DeeplxConfig>(
  'local:deeplxConfig',
  {
    fallback: deeplxConfigDefault,
    version: 1,
  }
);

export const wiktionaryConfigStorage = storage.defineItem<WiktionaryConfig>(
  'local:wiktionaryConfig',
  {
    fallback: defaultWiktionaryConfig,
    version: 1,
  }
);

export const omwConfigStorage = storage.defineItem<OmwConfig>(
  'local:omwConfig',
  {
    fallback: defaultOmwConfig,
    version: 1,
  }
);

// ── Font Configuration ──

export type FontCDNProvider = 'google' | 'sjtu-mirror';

export interface FontConfig {
  enabled: boolean;
  fontFamily: string;
  cdnProvider: FontCDNProvider;
}

export const FONT_CDN_URLS: Record<FontCDNProvider, string> = {
  'google': 'https://fonts.googleapis.com',
  'sjtu-mirror': 'https://google-fonts.mirrors.sjtug.sjtu.edu.cn',
};

export const fontConfigDefault: FontConfig = {
  enabled: false,
  fontFamily: 'Noto Sans SC',
  cdnProvider: 'google',
};

export const FONT_PRESETS = [
  { label: 'Noto Sans SC', value: 'Noto Sans SC', desc: '简体中文' },
  { label: 'Noto Sans TC', value: 'Noto Sans TC', desc: '繁體中文' },
  { label: 'Noto Sans JP', value: 'Noto Sans JP', desc: '日本語' },
  { label: 'Noto Sans KR', value: 'Noto Sans KR', desc: '한국어' },
  { label: 'Noto Sans', value: 'Noto Sans', desc: 'Latin / Cyrillic' },
  { label: 'Inter', value: 'Inter', desc: 'Latin' },
  { label: 'LXGW WenKai', value: 'LXGW WenKai', desc: '霞鹜文楷' },
];

export const fontConfigStorage = storage.defineItem<FontConfig>(
  'local:fontConfig',
  {
    fallback: fontConfigDefault,
    version: 1,
  }
);

// ── Theme ──

export const DEFAULT_THEME_COLOR = '#0b57d0';

export const themeColorStorage = storage.defineItem<string>(
  'local:themeColor',
  {
    fallback: DEFAULT_THEME_COLOR,
    version: 1,
  }
);

export const darkModeStorage = storage.defineItem<boolean>(
  'local:darkMode',
  {
    fallback: false,
    version: 1,
  }
);

export const DEFAULT_THEME_CHROMA = 65.32165949426562;
export const DEFAULT_THEME_TONE = 40.32506565365839;

export const themeChromaStorage = storage.defineItem<number>(
  'local:themeChroma',
  {
    fallback: DEFAULT_THEME_CHROMA,
    version: 1,
  }
);

export const themeToneStorage = storage.defineItem<number>(
  'local:themeTone',
  {
    fallback: DEFAULT_THEME_TONE,
    version: 1,
  }
);

// ── Vocabulary Book ──

export interface VocabularyEntry {
  id: string;
  word: string;
  sourceDicts: DictID[];
  addedAt: number;
  note?: string;
}

export const vocabularyStorage = storage.defineItem<VocabularyEntry[]>(
  'local:vocabulary',
  {
    fallback: [],
    version: 2,
  }
);
