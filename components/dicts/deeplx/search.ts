import i18next from 'i18next';

import { fetchPostHtml } from '@/utils/fetchHtml';
import { toDeepLxLangCode } from '@/utils/languageUtils';
import { deeplxConfigStorage } from '@/utils/storage';

import { SearchOptions } from '../types';
import {
  DeeplxApiRequestParams,
  DeeplxEndpointType,
  DeeplxFreeProEndpointApiResult,
  DeeplxOfficialEndpointApiResult,
  DeeplxResult,
  deeplxConfigDefault,
} from './types';

async function searchFreePro(endpoint: string, apiKey: string, body: DeeplxApiRequestParams): Promise<DeeplxResult[]> {
  const url = /\/translate\/?$/.test(endpoint) ? endpoint : `${endpoint}/translate`;
  const result = await fetchPostHtml<DeeplxFreeProEndpointApiResult>(url, JSON.stringify(body), {
    Authorization: `Bearer ${apiKey}`,
  });

  if (result.code !== 200) {
    throw new Error(i18next.t('engineError.deeplxRequestFailed', { code: result.code }));
  }

  return [{
    translatedText: result.data,
    alternatives: result.alternatives || [],
    sourceLang: result.source_lang,
    targetLang: body.target_lang,
  }];
}

async function searchOfficial(endpoint: string, apiKey: string, body: DeeplxApiRequestParams): Promise<DeeplxResult[]> {
  const url = /\/v2\/translate\/?$/.test(endpoint) ? endpoint : `${endpoint}/v2/translate`;
  const result = await fetchPostHtml<DeeplxOfficialEndpointApiResult>(url, JSON.stringify({
    text: [body.text],
    source_lang: body.source_lang === 'auto' ? undefined : body.source_lang,
    target_lang: body.target_lang,
  }), {
    Authorization: `Bearer ${apiKey}`,
  });

  if (!result.translations || result.translations.length === 0) {
    return [];
  }

  return result.translations.map((item) => ({
    translatedText: item.text,
    alternatives: [],
    sourceLang: item.detected_source_language,
    targetLang: body.target_lang,
  }));
}

export async function search(text: string, options?: SearchOptions): Promise<DeeplxResult[]> {
  const config = await deeplxConfigStorage.getValue() || deeplxConfigDefault;
  if (config.apiKey.trim() === '') {
    throw new Error(i18next.t('engineError.deeplxApiKeyMissing'));
  }

  const targetLang = options?.targetLang ? toDeepLxLangCode(options.targetLang) : 'ZH';
  const endpoint = config.apiEndpoint.replace(/\/$/, '');
  const requestBody: DeeplxApiRequestParams = {
    text,
    source_lang: 'auto',
    target_lang: targetLang,
  };

  if (config.endPointType === DeeplxEndpointType.Free || config.endPointType === DeeplxEndpointType.Pro) {
    return searchFreePro(endpoint, config.apiKey, requestBody);
  }

  return searchOfficial(endpoint, config.apiKey, requestBody);
}

