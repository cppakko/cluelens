import { fetchJson, HttpError } from '@/utils/fetchHtml';
import i18next from 'i18next';

import { DictionaryApiResult } from './types';

const SEARCH_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

function normalizeAudioUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return url;
}

export async function search(text: string): Promise<DictionaryApiResult[]> {
  const query = text.trim();
  if (!query) {
    return [];
  }

  try {
    const entries = await fetchJson<DictionaryApiResult[]>(SEARCH_URL + encodeURIComponent(query));

    return entries.map((entry) => ({
      ...entry,
      phonetics: (entry.phonetics ?? []).map((phonetic) => ({
        ...phonetic,
        audio: normalizeAudioUrl(phonetic.audio),
      })),
      meanings: (entry.meanings ?? []).map((meaning) => ({
        ...meaning,
        definitions: (meaning.definitions ?? []).map((definition) => ({
          ...definition,
          synonyms: definition.synonyms ?? [],
          antonyms: definition.antonyms ?? [],
        })),
      })),
      sourceUrls: entry.sourceUrls ?? [],
    }));
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) {
        throw error;
      }

      throw new Error(i18next.t('engineError.dictionaryApiRequestFailed', { status: error.status, statusText: error.statusText }), { cause: error });
    }

    throw error;
  }
}
