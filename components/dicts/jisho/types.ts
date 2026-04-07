export interface JishoJapaneseWord {
  word?: string;
  reading: string;
}

export interface JishoLink {
  text: string;
  url: string;
}

export interface JishoSense {
  english_definitions: string[];
  parts_of_speech: string[];
  links: JishoLink[];
  tags: string[];
  restrictions: string[];
  see_also: string[];
  antonyms: string[];
  source: string[];
  info: string[];
}

export interface JishoAttribution {
  jmdict: boolean;
  jmnedict: boolean;
  dbpedia: string | false;
}

export interface JishoResult {
  slug: string;
  is_common: boolean;
  tags: string[];
  jlpt: string[];
  japanese: JishoJapaneseWord[];
  senses: JishoSense[];
  attribution: JishoAttribution;
}

export interface JishoApiResponse {
  meta: {
    status: number;
  };
  data: JishoResult[];
}
