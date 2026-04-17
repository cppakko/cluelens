import * as cheerio from 'cheerio';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';

import type {
  SpanishDictAudioText,
  SpanishDictEntry,
  SpanishDictExample,
  SpanishDictPhrase,
  SpanishDictResult,
  SpanishDictSense,
  SpanishDictTranslation,
} from './types';
import { Element } from 'domhandler';

const BASE_URL = 'https://www.spanishdict.com';
const AUDIO_BASE_URL = 'https://audio-cdn.sdcdns.com/audio';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getTextFromHtml(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return cheerio.load(`<body>${value}</body>`).text().replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLookupKey(value: string): string {
  return normalizeText(value).toLowerCase();
}

function normalizePronunciation(value: string): string {
  return value
    .replace(/\*/g, '-')
    .replace(/[ˈˌ]/g, '')
    .replace(/-{2,}/g, '-')
    .trim();
}

function extractComponentData(rawHtml: string): Record<string, unknown> | null {
  const marker = 'window.SD_COMPONENT_DATA = ';
  const start = rawHtml.indexOf(marker);
  if (start === -1) return null;

  const jsonStart = start + marker.length;
  const scriptEnd = rawHtml.indexOf('</script>', jsonStart);
  if (scriptEnd === -1) return null;

  const jsonText = rawHtml.slice(jsonStart, scriptEnd).trim().replace(/;$/, '');

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parsePronunciation(pronunciations: unknown): string | undefined {
  for (const pronunciation of getArray(pronunciations)) {
    if (!isRecord(pronunciation)) continue;

    const raw = getString(pronunciation.spa)
      ?? getString(pronunciation.abc)
      ?? getString(pronunciation.ipa);
    if (raw) {
      return normalizePronunciation(raw);
    }
  }

  return undefined;
}

function parseAudioText(value: unknown, fallbackPronunciation?: string): SpanishDictAudioText | undefined {
  if (!isRecord(value)) return undefined;

  const text = getString(value.displayText);
  if (!text) return undefined;

  return {
    text,
    pronunciation: parsePronunciation(value.pronunciations) ?? fallbackPronunciation,
    audioUrl: getString(value.audioUrl),
    lang: getString(value.wordLang) ?? 'en',
  };
}

function parseInlineExamples(
  value: unknown,
  sourceLang: string,
  targetLang: string,
): SpanishDictExample[] {
  const examples: SpanishDictExample[] = [];

  for (const item of getArray(value)) {
    if (!Array.isArray(item) || item.length < 2) continue;

    const source = getTextFromHtml(item[0]);
    const target = getTextFromHtml(item[1]);
    if (!source || !target) continue;

    examples.push({ source, target, sourceLang, targetLang });
  }

  return examples;
}

function parseDisplayLabels(value: unknown): string[] {
  const labels: string[] = [];

  for (const item of getArray(value)) {
    if (typeof item === 'string' && item.trim()) {
      labels.push(item.trim());
      continue;
    }

    if (!isRecord(item)) continue;
    const name = getString(item.name) ?? getString(item.label);
    if (name) {
      labels.push(name);
    }
  }

  return labels;
}

function parseTranslations(
  value: unknown,
  sourceLang: string,
  targetLang: string,
): SpanishDictTranslation[] {
  const translations: SpanishDictTranslation[] = [];

  for (const item of getArray(value)) {
    if (!isRecord(item)) continue;

    const nestedDisplay = isRecord(item.translationsDisplay)
      ? item.translationsDisplay
      : undefined;
    const nestedTexts = getArray(nestedDisplay?.texts)
      .map((text) => getString(text))
      .filter((text): text is string => Boolean(text));
    const word = getString(item.translation) ?? nestedTexts[0];
    if (!word) continue;

    const registerLabels = parseDisplayLabels(item.registerLabelsDisplay);

    translations.push({
      letter: getString(item.letters) ?? '',
      word,
      regions: parseDisplayLabels(item.regionsDisplay),
      registerLabel: registerLabels[0],
      examples: parseInlineExamples(item.examplesDisplay, sourceLang, targetLang),
    });
  }

  return translations;
}

function parseEntries(componentData: Record<string, unknown>, headword?: SpanishDictAudioText): SpanishDictEntry[] {
  const dictProps = isRecord(componentData.sdDictionaryResultsProps)
    ? componentData.sdDictionaryResultsProps
    : undefined;
  const entryRoot = dictProps && isRecord(dictProps.entry)
    ? dictProps.entry
    : undefined;
  const neodictEntries = getArray(entryRoot?.neodict);

  const entries: SpanishDictEntry[] = [];

  for (const entryItem of neodictEntries) {
    if (!isRecord(entryItem)) continue;

    const word = getString(entryItem.subheadword);
    if (!word) continue;

    for (const posGroupItem of getArray(entryItem.posGroups)) {
      if (!isRecord(posGroupItem)) continue;

      const posDisplay = isRecord(posGroupItem.posDisplay)
        ? posGroupItem.posDisplay
        : undefined;
      const pos = getString(posDisplay?.name) ?? '';
      const entryLang = getString(posGroupItem.entryLang) ?? 'en';
      const targetLang = entryLang === 'es' ? 'en' : 'es';

      const senses: SpanishDictSense[] = [];
      for (const senseItem of getArray(posGroupItem.senses)) {
        if (!isRecord(senseItem)) continue;

        const number = typeof senseItem.idx === 'number'
          ? String(senseItem.idx)
          : getString(senseItem.idx) ?? '';
        const rawContext = getString(senseItem.context);
        const context = rawContext ? `(${rawContext})` : '';
        const translations = parseTranslations(senseItem.translationsDisplay, entryLang, targetLang);

        if (!number || translations.length === 0) continue;
        senses.push({ number, context, translations });
      }

      if (senses.length === 0) continue;

      entries.push({
        word,
        pronunciation: headword?.text === word ? headword.pronunciation : undefined,
        pos,
        senses,
      });
    }
  }

  return entries;
}

function buildAudioUrl(audioHost: string | undefined, queryString: string | undefined): string | undefined {
  if (!queryString) return undefined;

  const baseUrl = audioHost ? `https://${audioHost}/audio` : AUDIO_BASE_URL;
  return `${baseUrl}${queryString.startsWith('?') ? queryString : `?${queryString}`}`;
}

function buildPhraseAudioMap(componentData: Record<string, unknown>): Map<string, {
  sourceAudioUrl?: string;
  targetAudioUrls: Map<string, string>;
}> {
  const hostConfig = isRecord(componentData.hostConfig) ? componentData.hostConfig : undefined;
  const audioHost = getString(hostConfig?.audioHost);
  const phraseMap = new Map<string, { sourceAudioUrl?: string; targetAudioUrls: Map<string, string> }>();

  for (const item of getArray(componentData.phrases)) {
    if (!isRecord(item)) continue;

    const sourceText = getString(item.source);
    if (!sourceText) continue;

    const targetAudioUrls = new Map<string, string>();
    const quickdef1 = getString(item.quickdef1);
    const quickdef2 = getString(item.quickdef2);

    if (quickdef1) {
      const audioUrl = buildAudioUrl(audioHost, getString(item.quickdef1AudioQueryString));
      if (audioUrl) {
        targetAudioUrls.set(normalizeLookupKey(quickdef1), audioUrl);
      }
    }

    if (quickdef2) {
      const audioUrl = buildAudioUrl(audioHost, getString(item.quickdef2AudioQueryString));
      if (audioUrl) {
        targetAudioUrls.set(normalizeLookupKey(quickdef2), audioUrl);
      }
    }

    phraseMap.set(normalizeLookupKey(sourceText), {
      sourceAudioUrl: buildAudioUrl(audioHost, getString(item.sourceAudioQueryString)),
      targetAudioUrls,
    });
  }

  return phraseMap;
}
  
function findPhrasesTableAfterHeading($heading: cheerio.Cheerio<Element>): cheerio.Cheerio<Element> | null {
  const searchResult = $heading.map((_, element) => {
    if (element.next && element.next.type === 'tag' && element.next.name === 'table') {
      return element.next;
    }
  });
  return searchResult;
}

function parsePhrases(rawHtml: string, componentData: Record<string, unknown>): SpanishDictPhrase[] {
  const $ = cheerio.load(rawHtml);
  const phraseAudioMap = buildPhraseAudioMap(componentData);
  const phrases: SpanishDictPhrase[] = [];

  const $heading = $('div').filter((_, element) => normalizeText($(element).text()) === 'Phrases');
  if (!$heading.length) return phrases;

  const $table = findPhrasesTableAfterHeading($heading);
  if (!$table) return phrases;

  $table.find('tr').each((_, row) => {
    const $cells = $(row).children('td');
    if ($cells.length < 2) return;

    const $sourceCell = $cells.eq(0);
    const $targetCell = $cells.eq(1);
    const sourceText = normalizeText(
      $sourceCell.find('a[href^="/translate/"]').first().text() || $sourceCell.text(),
    );
    if (!sourceText) return;

    const audioInfo = phraseAudioMap.get(normalizeLookupKey(sourceText));
    const targetLang = $targetCell.attr('lang')?.trim() || 'es';
    const targets: SpanishDictAudioText[] = [];
    const seenTargets = new Set<string>();

    $targetCell.find('a[href^="/translate/"]').each((_, anchor) => {
      const text = normalizeText($(anchor).text());
      if (!text) return;

      const key = normalizeLookupKey(text);
      if (seenTargets.has(key)) return;
      seenTargets.add(key);

      targets.push({
        text,
        lang: targetLang,
        audioUrl: audioInfo?.targetAudioUrls.get(key),
      });
    });

    const targetText = normalizeText($targetCell.text());
    phrases.push({
      source: {
        text: sourceText,
        lang: $sourceCell.attr('lang')?.trim() || 'en',
        audioUrl: audioInfo?.sourceAudioUrl,
      },
      targets,
      noDirectTranslation: targets.length === 0 && /no direct translation/i.test(targetText),
    });
  });

  return phrases.slice(0, 12);
}

export async function search(text: string): Promise<SpanishDictResult[]> {
  const query = text.trim();
  if (!query) return [];

  const encodedQuery = encodeURIComponent(query);
  const dictUrl = `${BASE_URL}/translate/${encodedQuery}`;

  try {
    const dictHtml = await fetchGetHtml(dictUrl);

    const dictData = extractComponentData(dictHtml);
    if (!dictData) return [];

    const resultCardProps = isRecord(dictData.resultCardHeaderProps)
      ? dictData.resultCardHeaderProps
      : undefined;
    const headwordAndQuickdefsProps = resultCardProps && isRecord(resultCardProps.headwordAndQuickdefsProps)
      ? resultCardProps.headwordAndQuickdefsProps
      : undefined;
    const pronunciationLink = isRecord(dictData.pronunciationDictionaryLink)
      ? dictData.pronunciationDictionaryLink
      : undefined;
    const fallbackPronunciation = getArray(pronunciationLink?.pronunciationSpellings)
      .map((item) => getString(item))
      .find((item): item is string => Boolean(item));
    const headword = parseAudioText(headwordAndQuickdefsProps?.headword, fallbackPronunciation ? normalizePronunciation(fallbackPronunciation) : undefined);
    const quickdefs = [
      parseAudioText(headwordAndQuickdefsProps?.quickdef1),
      parseAudioText(headwordAndQuickdefsProps?.quickdef2),
    ].filter((item): item is SpanishDictAudioText => Boolean(item));

    const entries = parseEntries(dictData, headword);
    const phrases = parsePhrases(dictHtml, dictData);

    if (entries.length === 0 && phrases.length === 0 && quickdefs.length === 0 && !headword) {
      return [];
    }

    return [{
      headword,
      quickdefs,
      entries,
      phrases,
    }];
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) return [];
      throw new Error(
        i18next.t('engineError.spanishDictRequestFailed', {
          status: error.status,
          statusText: error.statusText,
        }),
        { cause: error },
      );
    }
    throw error;
  }
}
