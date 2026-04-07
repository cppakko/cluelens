import i18next from 'i18next';

import { fetchWithPolicy, HttpError } from '@/utils/fetchHtml';
import { openAIConfigStorage } from '@/utils/storage';

import {
  openAIResponseJsonSchema,
  OpenAIResult,
  OpenAILexicalResult,
  OpenAISentenceResult,
} from './types';

interface OpenAIChatMessage {
  content?: string;
  refusal?: string;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: OpenAIChatMessage;
  }>;
}

interface OpenAIChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      refusal?: string;
      role?: string;
    };
    message?: OpenAIChatMessage;
  }>;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isSentenceResult(value: unknown): value is OpenAISentenceResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.kind === 'sentence'
    && typeof candidate.sourceText === 'string'
    && typeof candidate.detectedSourceLanguage === 'string'
    && typeof candidate.targetLanguage === 'string'
    && isStringArray(candidate.notes)
    && typeof candidate.translation === 'string'
    && typeof candidate.polishedTranslation === 'string'
    && typeof candidate.summary === 'string'
    && isStringArray(candidate.alternatives)
    && Array.isArray(candidate.segments);
}

function isLexicalResult(value: unknown): value is OpenAILexicalResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.kind === 'lexical'
    && typeof candidate.sourceText === 'string'
    && typeof candidate.detectedSourceLanguage === 'string'
    && typeof candidate.targetLanguage === 'string'
    && isStringArray(candidate.notes)
    && typeof candidate.term === 'string'
    && typeof candidate.phonetic === 'string'
    && typeof candidate.brief === 'string'
    && isStringArray(candidate.morphology)
    && Array.isArray(candidate.senses)
    && isStringArray(candidate.usageTips)
    && isStringArray(candidate.relatedTerms);
}

function normalizeResult(result: OpenAIResult): OpenAIResult {
  if (result.kind === 'sentence') {
    return {
      ...result,
      alternatives: result.alternatives ?? [],
      segments: result.segments ?? [],
      notes: result.notes ?? [],
    };
  }

  return {
    ...result,
    morphology: result.morphology ?? [],
    senses: result.senses ?? [],
    usageTips: result.usageTips ?? [],
    relatedTerms: result.relatedTerms ?? [],
    notes: result.notes ?? [],
  };
}

function buildFallbackSentence(sourceText: string, content: string, warning?: string): OpenAISentenceResult {
  return {
    kind: 'sentence',
    sourceText,
    detectedSourceLanguage: '',
    targetLanguage: '',
    translation: content,
    polishedTranslation: '',
    summary: warning || '',
    alternatives: [],
    segments: [],
    notes: warning ? [warning] : [],
    warning: warning || '',
  };
}

function parseStructuredContent(sourceText: string, content?: string): OpenAIResult {
  if (!content) {
    return buildFallbackSentence(sourceText, '', 'OpenAI returned empty content');
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    if (isSentenceResult(parsed) || isLexicalResult(parsed)) {
      return normalizeResult(parsed);
    }
  } catch {
    console.warn('Failed to parse OpenAI response content as structured JSON, using fallback text view');
  }

  return buildFallbackSentence(sourceText, content, 'Response did not match the structured JSON format; showing plain text fallback');
}

function parseSseResponse(rawText: string): OpenAIChatCompletionResponse {
  const contentParts: string[] = [];
  let refusal = '';

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) {
      continue;
    }

    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') {
      continue;
    }

    try {
      const chunk = JSON.parse(payload) as OpenAIChatCompletionChunk;
      const choice = chunk.choices?.[0];
      if (!choice) {
        continue;
      }

      if (choice.message?.content) {
        contentParts.push(choice.message.content);
      }
      if (choice.delta?.content) {
        contentParts.push(choice.delta.content);
      }
      if (choice.message?.refusal) {
        refusal = choice.message.refusal;
      }
      if (choice.delta?.refusal) {
        refusal = choice.delta.refusal;
      }
    } catch {
      console.warn('Failed to parse OpenAI SSE chunk', payload);
    }
  }

  return {
    choices: [
      {
        message: {
          content: contentParts.join(''),
          refusal,
        },
      },
    ],
  };
}

async function requestOpenAI(text: string) {
  const config = await openAIConfigStorage.getValue();
  if (config.apiKey.trim() === '') {
    throw new Error(i18next.t('engineError.openaiApiKeyMissing'));
  }

  const response = await fetchWithPolicy(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: openAIResponseJsonSchema,
      },
      stream: false,
      top_p: 0.1,
    }),
  });

  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  if (contentType.includes('text/event-stream')) {
    return parseSseResponse(await response.text());
  }

  return await response.json() as OpenAIChatCompletionResponse;
}

export async function search(text: string): Promise<OpenAIResult[]> {
  let data: OpenAIChatCompletionResponse;
  try {
    data = await requestOpenAI(text);
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(i18next.t('engineError.openaiRequestFailed', { status: error.status, statusText: error.statusText }), { cause: error });
    }
    throw error;
  }

  const message = data.choices?.[0]?.message;
  if (message?.refusal) {
    return [buildFallbackSentence(text, message.refusal, 'Model refused the request; showing the raw refusal message')];
  }

  return [parseStructuredContent(text, message?.content)];
}
