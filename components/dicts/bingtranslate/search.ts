import i18next from 'i18next';

import { fetchGetHtml, fetchWithPolicy, HttpError } from '@/utils/fetchHtml';

import { SearchOptions } from '../types';

import type { GlobalConfig } from './types';

const TRANSLATE_API_ROOT = 'https://{s}bing.com';
const WEBSITE_ENDPOINT = '/translator';
const TRANSLATE_ENDPOINT = '/ttranslatev3?isVertical=1&';

const MAX_TEXT_LEN = 1000;
const MAX_EPT_TEXT_LEN = 3000;
const MAX_RETRY_COUNT = 3;

const EPT_LANGS = [
  'af', 'sq', 'am', 'ar', 'hy', 'az', 'bn', 'bs', 'bg', 'ca',
  'zh-Hans', 'zh-Hant', 'hr', 'cs', 'da', 'prs', 'nl', 'en', 'et', 'fil',
  'fi', 'fr', 'de', 'el', 'gu', 'ht', 'he', 'hi', 'hu', 'is',
  'id', 'iu', 'ga', 'it', 'ja', 'kn', 'kk', 'km', 'ko', 'ku',
  'lo', 'lv', 'lt', 'mg', 'ms', 'ml', 'mt', 'mr', 'my', 'mi',
  'ne', 'nb', 'or', 'ps', 'fa', 'pl', 'pt', 'pt-PT', 'pa', 'ro',
  'ru', 'sm', 'sr-Cyrl', 'sr-Latn', 'sk', 'sl', 'es', 'sw', 'sv',
  'ta', 'te', 'th', 'to', 'tr', 'uk', 'ur', 'vi', 'cy',
];

let globalConfig: GlobalConfig | undefined;
let globalConfigPromise: Promise<GlobalConfig> | undefined;

function replaceSubdomain(url: string, subdomain?: string): string {
  return url.replace('{s}', subdomain ? subdomain + '.' : '');
}

function isTokenExpired(): boolean {
  if (!globalConfig) return true;
  return Date.now() - globalConfig.tokenTs > globalConfig.tokenExpiryInterval;
}

async function fetchGlobalConfig(): Promise<GlobalConfig> {
  const subdomain = globalConfig?.subdomain;
  const websiteUrl = replaceSubdomain(TRANSLATE_API_ROOT + WEBSITE_ENDPOINT, subdomain);

  const body = await fetchGetHtml(websiteUrl);

  // Extract required fields from the page
  const igMatch = body.match(/IG:"([^"]+)"/);
  const iidMatch = body.match(/data-iid="([^"]+)"/);
  const paramsMatch = body.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/);

  if (!igMatch || !iidMatch || !paramsMatch) {
    throw new Error(i18next.t('engineError.bingTranslateConfigFailed'));
  }

  const IG = igMatch[1];
  const IID = iidMatch[1];

  let key: number, token: string, tokenExpiryInterval: number;
  try {
    const parsed = JSON.parse(paramsMatch[1]) as [number, string, number];
    [key, token, tokenExpiryInterval] = parsed;
  } catch {
    throw new Error(i18next.t('engineError.bingTranslateConfigFailed'));
  }

  if (!IG || !IID || !key || !token || !tokenExpiryInterval) {
    throw new Error(i18next.t('engineError.bingTranslateConfigFailed'));
  }

  // Detect subdomain from redirect or page content
  let detectedSubdomain = subdomain || '';
  const subdomainMatch = body.match(/https?:\/\/(\w+)\.bing\.com/);
  if (subdomainMatch) {
    detectedSubdomain = subdomainMatch[1];
  }

  globalConfig = {
    IG,
    IID,
    subdomain: detectedSubdomain,
    key,
    token,
    tokenTs: key,
    tokenExpiryInterval,
    count: 0,
  };

  return globalConfig;
}

function makeRequestURL(config: GlobalConfig, canUseEPT: boolean): string {
  const baseUrl = replaceSubdomain(TRANSLATE_API_ROOT + TRANSLATE_ENDPOINT, config.subdomain);
  let url = baseUrl + '&IG=' + config.IG + '&IID=' + config.IID;
  if (canUseEPT) {
    url += '&SFX=' + (++config.count);
    url += '&ref=TThis&edgepdftranslator=1';
  }
  return url;
}

function makeRequestBody(config: GlobalConfig, text: string, fromLang: string, toLang: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set('fromLang', fromLang);
  params.set('text', text);
  params.set('token', config.token);
  params.set('key', String(config.key));
  params.set('to', toLang);
  params.set('tryFetchingGenderDebiasedTranslations', 'true');
  return params;
}

function toBingLangCode(lang: string): string {
  const map: Record<string, string> = {
    'zh': 'zh-Hans',
    'zh-CN': 'zh-Hans',
    'zh-TW': 'zh-Hant',
    'zh-HK': 'zh-Hant',
  };
  return map[lang] || lang;
}

export async function search(text: string, options?: SearchOptions): Promise<string[]> {
  const query = text.trim();
  if (!query) return [];

  // Ensure global config is fetched
  if (!globalConfigPromise) {
    globalConfigPromise = fetchGlobalConfig();
  }
  await globalConfigPromise;

  // Refresh if token expired
  if (isTokenExpired()) {
    globalConfigPromise = fetchGlobalConfig();
    await globalConfigPromise;
  }

  const config = globalConfig!;
  const fromLang = 'auto-detect';
  const toLang = toBingLangCode(options?.targetLang || 'zh-Hans');

  // Determine if EPT mode can be used
  const canUseEPT =
    query.length <= MAX_EPT_TEXT_LEN &&
    EPT_LANGS.includes(toLang);

  if (!canUseEPT && query.length > MAX_TEXT_LEN) {
    throw new Error(i18next.t('engineError.bingTranslateTextTooLong', { maxLen: MAX_TEXT_LEN }));
  }

  const requestURL = makeRequestURL(config, canUseEPT);
  const requestBody = makeRequestBody(config, query, fromLang, toLang);

  let response: Response;
  let retries = 0;
  while (true) {
    try {
      response = await fetchWithPolicy(
        requestURL,
        {
          method: 'POST',
          body: requestBody,
        },
        {
          headers: {
            'referer': replaceSubdomain(TRANSLATE_API_ROOT + WEBSITE_ENDPOINT, config.subdomain),
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      );
      break;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401 && retries < MAX_RETRY_COUNT) {
        retries++;
        globalConfigPromise = fetchGlobalConfig();
        await globalConfigPromise;
        continue;
      }
      if (error instanceof HttpError) {
        throw new Error(
          i18next.t('engineError.bingTranslateRequestFailed', { status: error.status, statusText: error.statusText }),
          { cause: error },
        );
      }
      throw error;
    }
  }

  const contentType = response.headers.get('content-type') || '';
  let translation: string;

  if (contentType.includes('application/json')) {
    const body = await response.json() as Array<{ translations: Array<{ text: string; to: string }> }>;
    if (!body?.[0]?.translations?.[0]?.text) {
      return [];
    }
    translation = body[0].translations[0].text;
  } else {
    // Gender-debiased response comes as text/html, need a second request
    const bodyParams = makeRequestBody(config, query, fromLang, toLang);
    bodyParams.set('isGenderDebiasViewPresent', 'true');

    const gdResponse = await fetchWithPolicy(
      requestURL,
      {
        method: 'POST',
        body: bodyParams,
      },
      {
        headers: {
          'referer': replaceSubdomain(TRANSLATE_API_ROOT + WEBSITE_ENDPOINT, config.subdomain),
          'content-type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const gdBody = await gdResponse.json() as { masculineTranslation?: string; feminineTranslation?: string };
    translation = gdBody.masculineTranslation || gdBody.feminineTranslation || '';
  }

  return translation ? [translation] : [];
}
