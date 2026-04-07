import type { ComponentType, FC, ReactNode } from 'react';

import { DictConfig, DictID, ModuleType, SearchOptions } from './types';

import bingIcon from './bing/icon.png';
import caiyunIcon from './caiyun/icon.png';
import googleIcon from './google/icon.png';
import openaiIcon from './openai/icon.png';
import jishoIcon from './jisho/icon.png';
import deeplxIcon from './deeplx/icon.png';
import wiktionaryIcon from './wiktionary/icon.png';
import urbanIcon from './urban/icon.png';
import dictionaryApiIcon from './dictionaryapi/icon.png';
import zdicIcon from './zdic/icon.png';
import moegirlIcon from './moegirl/icon.ico';
import omwIcon from './omw/icon.png';

export interface DictSearcher {
  search(text: string, options?: SearchOptions): Promise<unknown[]>;
}

export type DictRenderer = {
  (data: unknown[]): ReactNode;
  displayName?: string;
};

const searchModules = import.meta.glob<DictSearcher>('./*/search.ts');
const viewModules = import.meta.glob<{ ResultsView: FC<{ data: unknown[] }> }>('./*/view.tsx', {
  import: 'ResultsView',
});
const configViewModules = import.meta.glob<{ default: ComponentType }>('./*/configView.tsx');

export const dictMetaMap: Record<DictID, DictConfig> = {
  [DictID.Bing]: {
    id: DictID.Bing,
    displayName: 'Bing Dictionary',
    displayNameKey: 'dict.bing',
    icon: bingIcon,
    language: { type: 'pairs', pairs: [['en', 'zh'], ['zh', 'en']] },
    type: ModuleType.Dict,
  },
  [DictID.Caiyun]: {
    id: DictID.Caiyun,
    displayName: '彩云小译',
    displayNameKey: 'dict.caiyun',
    icon: caiyunIcon,
    language: { type: 'all' },
    type: ModuleType.Translator,
  },
  [DictID.Google]: {
    id: DictID.Google,
    displayName: 'Google Translate',
    displayNameKey: 'dict.google',
    icon: googleIcon,
    language: { type: 'all' },
    type: ModuleType.Translator,
  },
  [DictID.OpenAI]: {
    id: DictID.OpenAI,
    displayName: 'OpenAI',
    displayNameKey: 'dict.openai',
    icon: openaiIcon,
    language: { type: 'all' },
    type: ModuleType.Other,
  },
  [DictID.Jisho]: {
    id: DictID.Jisho,
    displayName: 'Jisho',
    displayNameKey: 'dict.jisho',
    icon: jishoIcon,
    language: { type: 'pairs', pairs: [['en', 'ja'], ['ja', 'en']] },
    type: ModuleType.Dict,
  },
  [DictID.DictionaryApi]: {
    id: DictID.DictionaryApi,
    displayName: 'DictionaryAPI',
    displayNameKey: 'dict.dictionaryApi',
    icon: dictionaryApiIcon,
    language: { type: 'monolingual', languages: ['en'] },
    type: ModuleType.Dict,
  },
  [DictID.Zdic]: {
    id: DictID.Zdic,
    displayName: '\u6c49\u5178 Zdic',
    displayNameKey: 'dict.zdic',
    icon: zdicIcon,
    language: { type: 'monolingual', languages: ['zh'] },
    type: ModuleType.Dict,
  },
  [DictID.Moegirl]: {
    id: DictID.Moegirl,
    displayName: '\u840c\u5a18\u767e\u79d1',
    displayNameKey: 'dict.moegirl',
    icon: moegirlIcon,
    language: { type: 'monolingual', languages: ['zh'] },
    type: ModuleType.Dict,
  },
  [DictID.Deeplx]: {
    id: DictID.Deeplx,
    displayName: 'DeepLx',
    displayNameKey: 'dict.deeplx',
    icon: deeplxIcon,
    language: { type: 'all' },
    type: ModuleType.Translator,
  },
  [DictID.Wiktionary]: {
    id: DictID.Wiktionary,
    displayName: 'Wiktionary',
    displayNameKey: 'dict.wiktionary',
    icon: wiktionaryIcon,
    language: { type: 'all' },
    type: ModuleType.Dict,
  },
  [DictID.Urban]: {
    id: DictID.Urban,
    displayName: 'Urban Dictionary',
    displayNameKey: 'dict.urban',
    icon: urbanIcon,
    language: { type: 'monolingual', languages: ['en'] },
    type: ModuleType.Dict,
  },
  [DictID.Omw]: {
    id: DictID.Omw,
    displayName: 'Open Multilingual Wordnet',
    displayNameKey: 'dict.omw',
    icon: omwIcon,
    language: { type: 'all' },
    type: ModuleType.Dict,
  },
};

export const dictMetaList = Object.values(dictMetaMap);

export async function loadDictSearcher(dictId: DictID): Promise<DictSearcher | undefined> {
  const loader = searchModules[`./${dictId}/search.ts`];
  if (!loader) return undefined;
  return await loader();
}

export async function loadDictRenderer(dictId: DictID): Promise<DictRenderer | undefined> {
  const loader = viewModules[`./${dictId}/view.tsx`];
  if (!loader) return undefined;
  const ResultsView = await loader() as unknown as FC<{ data: unknown[] }>;
  const Renderer: DictRenderer = (data) => <ResultsView data={data} />;
  Renderer.displayName = `${dictId}Renderer`;
  return Renderer;
}

export function hasDictConfigView(dictId: string): dictId is DictID {
  return `./${dictId}/configView.tsx` in configViewModules;
}

export async function loadDictConfigView(dictId: DictID): Promise<ComponentType | null> {
  const loader = configViewModules[`./${dictId}/configView.tsx`];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}
