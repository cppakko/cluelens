export interface OpenAIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export interface OpenAIExampleItem {
  sentence: string;
  translation: string;
}

export interface OpenAIDefinitionItem {
  meaning: string;
  translation: string;
  explanation: string;
  examples: OpenAIExampleItem[];
}

export interface OpenAILexicalSense {
  partOfSpeech: string;
  definitions: OpenAIDefinitionItem[];
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
}

export interface OpenAISentenceSegment {
  source: string;
  translation: string;
  note: string;
}

interface OpenAIResultBase {
  kind: 'sentence' | 'lexical';
  sourceText: string;
  detectedSourceLanguage: string;
  targetLanguage: string;
  notes: string[];
  warning?: string;
}

export interface OpenAISentenceResult extends OpenAIResultBase {
  kind: 'sentence';
  translation: string;
  polishedTranslation: string;
  summary: string;
  alternatives: string[];
  segments: OpenAISentenceSegment[];
}

export interface OpenAILexicalResult extends OpenAIResultBase {
  kind: 'lexical';
  term: string;
  phonetic: string;
  brief: string;
  morphology: string[];
  senses: OpenAILexicalSense[];
  usageTips: string[];
  relatedTerms: string[];
}

export type OpenAIResult = OpenAISentenceResult | OpenAILexicalResult;

export const openAIResponseJsonSchema = {
  name: 'dictionary_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      kind: {
        type: 'string',
        enum: ['sentence', 'lexical'],
        description: 'sentence for clauses/sentences/paragraphs; lexical for words, phrases, phrasal verbs, idioms, and short term lookups.',
      },
      sourceText: { type: 'string' },
      detectedSourceLanguage: { type: 'string' },
      targetLanguage: { type: 'string' },
      notes: {
        type: 'array',
        items: { type: 'string' },
      },
      translation: { type: 'string' },
      polishedTranslation: { type: 'string' },
      summary: { type: 'string' },
      alternatives: {
        type: 'array',
        items: { type: 'string' },
      },
      segments: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            source: { type: 'string' },
            translation: { type: 'string' },
            note: { type: 'string' },
          },
          required: ['source', 'translation', 'note'],
        },
      },
      term: { type: 'string' },
      phonetic: { type: 'string' },
      brief: { type: 'string' },
      morphology: {
        type: 'array',
        items: { type: 'string' },
      },
      senses: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            partOfSpeech: { type: 'string' },
            definitions: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  meaning: { type: 'string' },
                  translation: { type: 'string' },
                  explanation: { type: 'string' },
                  examples: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        sentence: { type: 'string' },
                        translation: { type: 'string' },
                      },
                      required: ['sentence', 'translation'],
                    },
                  },
                },
                required: ['meaning', 'translation', 'explanation', 'examples'],
              },
            },
            synonyms: {
              type: 'array',
              items: { type: 'string' },
            },
            antonyms: {
              type: 'array',
              items: { type: 'string' },
            },
            collocations: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['partOfSpeech', 'definitions', 'synonyms', 'antonyms', 'collocations'],
        },
      },
      usageTips: {
        type: 'array',
        items: { type: 'string' },
      },
      relatedTerms: {
        type: 'array',
        items: { type: 'string' },
      },
      warning: { type: 'string' },
    },
    required: [
      'kind',
      'sourceText',
      'detectedSourceLanguage',
      'targetLanguage',
      'notes',
      'translation',
      'polishedTranslation',
      'summary',
      'alternatives',
      'segments',
      'term',
      'phonetic',
      'brief',
      'morphology',
      'senses',
      'usageTips',
      'relatedTerms',
      'warning',
    ],
  },
} as const;

const defaultSystemPrompt = `
Detect the input language automatically, but OUTPUT everything in 简体中文.
`;

export const openAIConfigDefault: OpenAIConfig = {
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-5-mini',
  systemPrompt: defaultSystemPrompt,
};
