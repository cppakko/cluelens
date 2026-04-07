import * as cheerio from 'cheerio';

import { detectTextLanguage } from '@/utils/detectLanguage';
import { fetchGetHtml } from '@/utils/fetchHtml';
import { omwConfigStorage } from '@/utils/storage';

import type { OmwDefinition, OmwDetailResult, OmwRelation, OmwSearchResult, OmwSynset, OmwTranslation } from './types';

const BASE_URL = 'https://compling.upol.cz/ntumc/cgi-bin/wn-gridx.cgi';

const OMW_LANGUAGE_ALIASES: Record<string, string> = {
  eng: 'eng',
  English: 'eng',
  '英语': 'eng',
  '英語': 'eng',
  '英文': 'eng',
  cmn: 'cmn',
  '汉语': 'cmn',
  '漢語': 'cmn',
  '中文': 'cmn',
  Chinese: 'cmn',
  'Chinese (simplified)': 'cmn',
  'Chinese (Simplified)': 'cmn',
  'Simplified Chinese': 'cmn',
  '华语': 'cmn',
  '華語': 'cmn',
  jpn: 'jpn',
  Japanese: 'jpn',
  '日语': 'jpn',
  '日語': 'jpn',
  '日文': 'jpn',
  '日本语': 'jpn',
  '日本語': 'jpn',
  ind: 'ind',
  Indonesian: 'ind',
  '印尼语': 'ind',
  '印尼語': 'ind',
  '印度尼西亚语': 'ind',
  '印度尼西亞語': 'ind',
  'Bahasa Indonesia': 'ind',
  zsm: 'zsm',
  Malaysian: 'zsm',
  Malay: 'zsm',
  '马来语': 'zsm',
  '馬來語': 'zsm',
  'マレー語': 'zsm',
  'Bahasa Melayu': 'zsm',
  ita: 'ita',
  Italian: 'ita',
  Italiano: 'ita',
  '意大利语': 'ita',
  '意大利語': 'ita',
  'イタリア語': 'ita',
  ces: 'ces',
  Czech: 'ces',
  'Czech language': 'ces',
  'Čeština': 'ces',
  '捷克语': 'ces',
  '捷克語': 'ces',
  'チェコ語': 'ces',
  yue: 'yue',
  Cantonese: 'yue',
  '粤语': 'yue',
  '粵語': 'yue',
  kor: 'kor',
  Korean: 'kor',
  'Korean language': 'kor',
  '韩语': 'kor',
  '韓語': 'kor',
  '한국어': 'kor',
  fra: 'fra',
  French: 'fra',
  'French language': 'fra',
  '法语': 'fra',
  '法語': 'fra',
  'Français': 'fra',
  'フランス語': 'fra',
  deu: 'deu',
  German: 'deu',
  'German language': 'deu',
  Deutsch: 'deu',
  '德语': 'deu',
  '德語': 'deu',
  'ドイツ語': 'deu',
  spa: 'spa',
  Spanish: 'spa',
  'Spanish language': 'spa',
  '西班牙语': 'spa',
  '西班牙語': 'spa',
  'Español': 'spa',
  'スペイン語': 'spa',
  rus: 'rus',
  Russian: 'rus',
  'Russian language': 'rus',
  '俄语': 'rus',
  '俄語': 'rus',
  'Русский': 'rus',
  'ロシア語': 'rus',
};

/** Map BCP-47 language codes to OMW language codes. */
function toOmwLang(bcp47: string): string {
  const map: Record<string, string> = {
    en: 'eng',
    zh: 'cmn',
    ja: 'jpn',
    ko: 'kor',
    id: 'ind',
    ms: 'zsm',
    it: 'ita',
    cs: 'ces',
    fr: 'fra',
    de: 'deu',
    es: 'spa',
    ru: 'rus',
  };
  return map[bcp47] ?? 'eng';
}

function extractPos(synsetId: string): string {
  const match = synsetId.match(/-([nvarx])$/);
  return match ? match[1] : '';
}

function buildSearchUrl(lemma: string, lang: string, lang2: string): string {
  return `${BASE_URL}?gridmode=ntumcgrid&lemma=${encodeURIComponent(lemma)}&lang=${lang}&lang2=${lang2}`;
}

function buildSynsetUrl(synsetId: string, lang: string, lang2: string): string {
  return `${BASE_URL}?gridmode=ntumcgrid&synset=${encodeURIComponent(synsetId)}&lang=${lang}&lang2=${lang2}`;
}

function normalizeOmwLanguageCode(label: string): string {
  const normalizedLabel = label.trim().replace(/\s+/g, ' ');
  return OMW_LANGUAGE_ALIASES[normalizedLabel] ?? normalizedLabel;
}

function parseLemmaSearch(html: string): OmwSynset[] {
  const $ = cheerio.load(html);
  const synsets: OmwSynset[] = [];

  // Each <tr> in the results table is a synset row
  // Structure: <td> synsetId link | <td> lemmas | <td> spacer | <td> definition | <td> actions
  $('h6').first().next('table').find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    const synsetLink = $(cells[0]).find('a').first();
    const synsetId = synsetLink.text().trim().replace(/\s*\(\d+\)$/, '');
    if (!synsetId) return;

    // Extract lemmas from span elements in the second cell
    const lemmaTexts: string[] = [];
    $(cells[1]).find('span').each((_, span) => {
      const text = $(span).text().trim();
      if (text) lemmaTexts.push(text);
    });
    // Fallback: use the cell text if no spans found
    if (lemmaTexts.length === 0) {
      const raw = $(cells[1]).text().trim();
      if (raw) lemmaTexts.push(...raw.split(',').map((s) => s.trim()).filter(Boolean));
    }

    const definition = $(cells[3]).text().trim();
    const pos = extractPos(synsetId);

    synsets.push({ synsetId, lemmas: lemmaTexts, definition, pos });
  });

  return synsets;
}

function parseSynsetDetail(html: string): OmwDetailResult | undefined {
  const $ = cheerio.load(html);

  // The synset ID is inside a <font> tag near the top of the body.
  // Following it are text nodes containing the glossary in quotes.
  const fontEl = $('body > font').first();
  const fontText = fontEl.text().trim();
  const idMatch = fontText.match(/(\d{8}-[nvarx])/);
  if (!idMatch) return undefined;
  const synsetId = idMatch[1];

  // Collect glossary from sibling text nodes after the <font> tag
  // Format: 'some definition'; (may span across text and <sub> elements)
  let glossaryRaw = '';
  let sibling = fontEl[0]?.nextSibling;
  while (sibling) {
    const text = $(sibling).text();
    glossaryRaw += text;
    if (text.includes(';')) break;
    sibling = sibling.nextSibling;
  }
  const glossaryMatch = glossaryRaw.match(/['\u2018](.+?)['\u2019];?/);
  const glossary = glossaryMatch ? glossaryMatch[1].trim() : '';

  // Translations table: first <table> with language rows
  const translations: OmwTranslation[] = [];
  $('table').first().find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    const langEl = $(cells[0]).find('strong');
    if (!langEl.length) return;

    const language = normalizeOmwLanguageCode(langEl.text());
    const lemmas: string[] = [];
    $(cells[1]).find('a').each((_, a) => {
      const href = $(a).attr('href') ?? '';
      // Only include lemma links (not corpus links)
      if (href.includes('lemma=')) {
        const text = $(a).text().trim();
        if (text) lemmas.push(text);
      }
    });

    if (language && lemmas.length > 0) {
      translations.push({ language, lemmas });
    }
  });

  // Definitions: <dl> with <dt> (language) and <dd> (definition text)
  const definitions: OmwDefinition[] = [];
  $('dl').first().find('dt').each((_, dt) => {
    const language = normalizeOmwLanguageCode($(dt).find('strong').text());
    const dd = $(dt).next('dd');
    const text = dd.text().trim().replace(/\s+/g, ' ');
    if (language && text) {
      definitions.push({ language, text });
    }
  });

  // Relations table: after "Relations" heading
  const relations: OmwRelation[] = [];
  const relationsDiv = $('div#line span').filter((_, el) => $(el).text().trim() === 'Relations');
  if (relationsDiv.length) {
    relationsDiv.closest('div').next('table').find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const type = $(cells[0]).find('strong').text().trim().replace(/:$/, '');
      const targets: string[] = [];
      $(cells[1]).find('a').each((_, a) => {
        const text = $(a).text().trim();
        if (text) targets.push(text);
      });
      // Also get plain text targets (like "communicationn" with subscript)
      if (targets.length === 0) {
        const text = $(cells[1]).text().trim();
        if (text) targets.push(text);
      }

      if (type && targets.length > 0) {
        relations.push({ type, targets });
      }
    });
  }

  return { synsetId, glossary, translations, definitions, relations };
}

export async function search(text: string): Promise<OmwSearchResult[]> {
  const query = text.trim();
  if (!query) return [];

  const config = await omwConfigStorage.getValue();
  const lang2 = config.lang2;
  const maxSynsets = config.maxSynsets;

  // Determine search language
  let omwLang: string;
  if (config.lang === 'auto') {
    const detectedLang = detectTextLanguage(query);
    omwLang = toOmwLang(detectedLang);
  } else {
    omwLang = config.lang;
  }

  // Step 1: Lemma search to get synset list
  const searchHtml = await fetchGetHtml(buildSearchUrl(query, omwLang, lang2));
  const synsets = parseLemmaSearch(searchHtml);
  if (synsets.length === 0) return [];

  // Step 2: Fetch details for top N synsets in parallel
  const topSynsets = synsets.slice(0, maxSynsets);
  const detailResults = await Promise.allSettled(
    topSynsets.map(async (synset) => {
      const detailHtml = await fetchGetHtml(buildSynsetUrl(synset.synsetId, omwLang, lang2));
      return parseSynsetDetail(detailHtml);
    }),
  );

  const details: OmwDetailResult[] = detailResults
    .filter((r): r is PromiseFulfilledResult<OmwDetailResult | undefined> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((d): d is OmwDetailResult => d != null);

  if (details.length === 0) return [];

  return [{ details }];
}
