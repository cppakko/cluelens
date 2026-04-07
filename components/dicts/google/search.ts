import i18next from 'i18next';

import { fetchJson, HttpError } from '@/utils/fetchHtml';

import { SearchOptions } from '../types';

const SEARCH_URL = 'https://translate.googleapis.com/translate_a/single';
const DEFAULT_SOURCE = 'auto';
const DEFAULT_TARGET = 'zh-CN';
const DT_PARAMS = ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'];

function buildUrl(text: string, targetLang?: string): string {
  const url = new URL(SEARCH_URL);
  const params = url.searchParams;
  const tl = targetLang || DEFAULT_TARGET;

  params.set('client', 'gtx');
  params.set('sl', DEFAULT_SOURCE);
  params.set('tl', tl);
  params.set('hl', tl);
  params.set('ie', 'UTF-8');
  params.set('oe', 'UTF-8');
  params.set('otf', '1');
  params.set('ssel', '0');
  params.set('tsel', '0');
  DT_PARAMS.forEach((dt) => params.append('dt', dt));
  params.set('q', text);

  return url.toString();
}

function parseTranslatedText(rawData: unknown): string {
  if (!Array.isArray(rawData) || !Array.isArray(rawData[0])) {
    return '';
  }

  return rawData[0]
    .map((item) => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ''))
    .join('')
    .trim();
}

export async function search(text: string, options?: SearchOptions): Promise<string[]> {
  const query = text.trim();
  if (!query) {
    return [];
  }

  let json: unknown;
  try {
    json = await fetchJson<unknown>(buildUrl(query, options?.targetLang));
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(i18next.t('engineError.googleRequestFailed', { status: error.status, statusText: error.statusText }), { cause: error });
    }
    throw error;
  }

  const translatedText = parseTranslatedText(json);
  return translatedText ? [translatedText] : [];
}
