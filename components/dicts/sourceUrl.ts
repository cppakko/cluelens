import { DictID } from './types';
import { cambridgeConfigStorage } from '@/utils/storage';
import { wiktionaryConfigStorage } from '@/utils/storage';
import { omwConfigStorage } from '@/utils/storage';

const DICTS_WITHOUT_SOURCE_URL = new Set<DictID>([
  DictID.Caiyun,
  DictID.Deeplx,
  DictID.OpenAI,
  DictID.DictionaryApi,
]);

export function hasDictSourceUrl(dictId: DictID): boolean {
  return !DICTS_WITHOUT_SOURCE_URL.has(dictId);
}

export async function getDictSourceUrl(dictId: DictID, text: string): Promise<string | null> {
  const encoded = encodeURIComponent(text);

  switch (dictId) {
    case DictID.Bing:
      return `https://cn.bing.com/dict/search?q=${encoded}`;
    case DictID.BingTranslate:
      return `https://www.bing.com/translator/?text=${encoded}`;
    case DictID.Cambridge: {
      const config = await cambridgeConfigStorage.getValue();
      const langPair = config?.langPair ?? 'english-chinese-simplified';
      return `https://dictionary.cambridge.org/dictionary/${langPair}/${encoded}`;
    }
    case DictID.Dwds:
      return `https://www.dwds.de/wb/${encoded}`;
    case DictID.Google:
      return `https://translate.google.com/?sl=auto&tl=zh-CN&text=${encoded}`;
    case DictID.Greens:
      return `https://greensdictofslang.com/search/basic?q=${encoded}`;
    case DictID.Jisho:
      return `https://jisho.org/search/${encoded}`;
    case DictID.Larousse:
      return `https://www.larousse.fr/dictionnaires/francais/${encoded}`;
    case DictID.Moegirl:
      return `https://zh.moegirl.org.cn/${encoded}`;
    case DictID.Omw: {
      const config = await omwConfigStorage.getValue();
      const lang = config?.lang ?? 'auto';
      const lang2 = config?.lang2 ?? 'eng';
      return `https://compling.upol.cz/ntumc/cgi-bin/wn-gridx.cgi?gridmode=ntumcgrid&lemma=${encoded}&lang=${lang}&lang2=${lang2}`;
    }
    case DictID.SpanishDict:
      return `https://www.spanishdict.com/translate/${encoded}`;
    case DictID.Urban:
      return `https://www.urbandictionary.com/define.php?term=${encoded}`;
    case DictID.Wiktionary: {
      const config = await wiktionaryConfigStorage.getValue();
      const lang = config?.displayLanguage ?? 'zh';
      return `https://${lang}.wiktionary.org/wiki/${encoded}`;
    }
    case DictID.Zdic:
      return `https://www.zdic.net/hans/${encoded}`;
    default:
      return null;
  }
}
