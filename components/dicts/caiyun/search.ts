import { fetchPostHtml } from '@/utils/fetchHtml';
import { toCaiyunTransType } from '@/utils/languageUtils';
import { caiyunConfigStorage } from '@/utils/storage';

import { SearchOptions } from '../types';
import { CaiyunRequestBody, CaiyunResult } from './types';

const SEARCH_URL = 'https://api.interpreter.caiyunai.com/v1/translator';
const DEFAULT_TOKEN = import.meta.env.VITE_CAIYUN_DEFAULT_TOKEN || '';

export async function search(text: string, options?: SearchOptions): Promise<string[]> {
  const config = await caiyunConfigStorage.getValue();
  const token = (config?.useCustomToken && config.token) ? config.token : DEFAULT_TOKEN;
  const transType = options?.targetLang ? toCaiyunTransType(options.targetLang) : 'auto2zh';

  const body: CaiyunRequestBody = {
    source: [text],
    trans_type: transType,
    detect: false,
  };

  const result = await fetchPostHtml<CaiyunResult>(SEARCH_URL, JSON.stringify(body), {
    'x-authorization': `token ${token}`,
  });

  return result.target || [];
}

