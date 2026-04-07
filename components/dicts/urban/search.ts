import i18next from 'i18next';

import { fetchJson, HttpError } from '@/utils/fetchHtml';

import { UrbanEntry, UrbanResult } from './types';

interface UrbanApiResponse {
  list: Array<{
    word: string;
    definition: string;
    example: string;
    author: string;
    thumbs_up: number;
    thumbs_down: number;
    permalink: string;
  }>;
}

const SEARCH_URL = 'https://api.urbandictionary.com/v0/define?term=';
const MAX_ENTRIES = 3;

export async function search(text: string): Promise<UrbanResult[]> {
  const query = text.trim();
  if (!query) {
    return [];
  }

  let json: UrbanApiResponse;
  try {
    json = await fetchJson<UrbanApiResponse>(SEARCH_URL + encodeURIComponent(query));
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(i18next.t('engineError.urbanRequestFailed', {
        status: error.status,
        statusText: error.statusText,
      }), { cause: error });
    }
    throw error;
  }

  if (!json.list || json.list.length === 0) {
    return [];
  }

  const entries: UrbanEntry[] = json.list
    .slice(0, MAX_ENTRIES)
    .map((item) => ({
      word: item.word,
      definition: item.definition,
      example: item.example,
      author: item.author,
      thumbs_up: item.thumbs_up,
      thumbs_down: item.thumbs_down,
      permalink: item.permalink,
    }));

  return [{ entries }];
}
