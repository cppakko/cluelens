export interface DeeplxResult {
  translatedText: string;
  alternatives: string[];
  sourceLang: string;
  targetLang: string;
}

export interface DeeplxConfig {
  apiKey: string;
  apiEndpoint: string;
  endPointType: DeeplxEndpointType;
}

export enum DeeplxEndpointType {
  Free = 'free',
  Pro = 'pro',
  Official = 'official',
}

export const deeplxConfigDefault: DeeplxConfig = {
  apiKey: '',
  apiEndpoint: 'https://api.deeplx.org',
  endPointType: DeeplxEndpointType.Free,
}

export interface DeeplxFreeProEndpointApiResult {
  alternatives: string[];
  code: number;
  data: string;
  id: number;
  method: string;
  source_lang: string;
  target_lang: string;
}

export interface DeeplxOfficialEndpointApiResult {
  translations: Array<{
    detected_source_language: string;
    text: string;
    billed_characters?: number;
    model_type_used?: string;
  }>;
}

export interface DeeplxApiRequestParams {
  text: string;
  source_lang: string;
  target_lang: string;
}