export interface SpanishDictAudioText {
  text: string;
  pronunciation?: string;
  audioUrl?: string;
  lang: string;
}

export interface SpanishDictExample {
  source: string;
  target: string;
  sourceLang?: string;
  targetLang?: string;
}

export interface SpanishDictTranslation {
  letter: string;
  word: string;
  regions?: string[];
  registerLabel?: string;
  examples: SpanishDictExample[];
}

export interface SpanishDictSense {
  number: string;
  context: string;
  translations: SpanishDictTranslation[];
}

export interface SpanishDictEntry {
  word: string;
  pronunciation?: string;
  pos: string;
  senses: SpanishDictSense[];
}

export interface SpanishDictPhrase {
  source: SpanishDictAudioText;
  targets: SpanishDictAudioText[];
  noDirectTranslation?: boolean;
}

export interface SpanishDictResult {
  headword?: SpanishDictAudioText;
  quickdefs: SpanishDictAudioText[];
  entries: SpanishDictEntry[];
  phrases: SpanishDictPhrase[];
}
