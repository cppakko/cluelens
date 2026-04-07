export interface DictionaryApiDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryApiMeaning {
  partOfSpeech: string;
  definitions: DictionaryApiDefinition[];
}

export interface DictionaryApiPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryApiResult {
  word: string;
  phonetic?: string;
  phonetics: DictionaryApiPhonetic[];
  origin?: string;
  meanings: DictionaryApiMeaning[];
  sourceUrls?: string[];
}
