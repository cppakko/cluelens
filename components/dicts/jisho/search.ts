import { fetchJson } from '@/utils/fetchHtml';

import { JishoApiResponse, JishoResult } from './types';

const SEARCH_API_URL = 'https://jisho.org/api/v1/search/words?keyword=';

export async function search(text: string): Promise<JishoResult[]> {
  const response = await fetchJson<JishoApiResponse>(SEARCH_API_URL + encodeURIComponent(text));
  return response.data ?? [];
}
