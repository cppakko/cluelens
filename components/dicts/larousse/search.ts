import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';

import type { LarousseEntry, LarousseResult, LarousseSection } from './types';

const BASE_URL = 'https://www.larousse.fr';
const DICT_URL = `${BASE_URL}/dictionnaires/francais/`;

function removeJunkNodes($: cheerio.CheerioAPI, $root: cheerio.Cheerio<AnyNode>): void {
  $root.find('script, style, noscript, iframe, form, svg').remove();
  $root.find('.linkaudio').remove();
  $root.find('.icon-section').remove();
  $root.find('.pub-bottom, .pub-top, .pub-pave, .pub-gtm').remove();
  $root.find('.ads-core-placer').remove();
}

function extractExpressionsHtml($: cheerio.CheerioAPI, $page: cheerio.Cheerio<AnyNode>): string | undefined {
  const $bloc = $page.find('article.BlocLocutions');
  if (!$bloc.length) return undefined;

  const $list = $bloc.find('ul.ListeLocutions');
  if (!$list.length) return undefined;

  const html = $.html($list).trim();
  return html || undefined;
}

function extractHomonymesHtml($: cheerio.CheerioAPI, $page: cheerio.Cheerio<AnyNode>): string | undefined {
  const $bloc = $page.find('article.Blochomonymes');
  if (!$bloc.length) return undefined;

  const $list = $bloc.find('ul.HomonymeDirects');
  if (!$list.length) return undefined;

  const html = $.html($list).trim();
  return html || undefined;
}

function extractDifficultesHtml($: cheerio.CheerioAPI, $page: cheerio.Cheerio<AnyNode>): string | undefined {
  const $bloc = $page.find('article.BlocDifficultes');
  if (!$bloc.length) return undefined;

  const $clone = $bloc.clone();
  $clone.find('.icon-section').remove();
  $clone.find('h1.TitrePage').remove();

  const html = $clone.html()?.trim();
  return html || undefined;
}

function extractCitationsHtml($: cheerio.CheerioAPI, $page: cheerio.Cheerio<AnyNode>): string | undefined {
  const $bloc = $page.find('.BlocCitations');
  if (!$bloc.length) return undefined;

  const $list = $bloc.find('ul.ListeCitations');
  if (!$list.length) return undefined;

  const html = $.html($list).trim();
  return html || undefined;
}

function parseEntries($: cheerio.CheerioAPI): LarousseEntry[] {
  const entries: LarousseEntry[] = [];
  const $bloc = $('article.BlocDefinition');
  if (!$bloc.length) return [];

  const $headers = $bloc.find('[class^="Zone-Entree"]');

  $headers.each((_, headerEl) => {
    const $header = $(headerEl);

    const word = $header.find('h2.AdresseDefinition').first().text().trim();
    if (!word) return;

    const pos = $header.find('p.CatgramDefinition').first().text().trim() || undefined;
    const etymology = $header.find('p.OrigineDefinition').first().text().trim() || undefined;

    const audioSrc = $header.find('audio').first().attr('src');
    const audioUrl = audioSrc ? `${BASE_URL}${audioSrc}` : undefined;

    const sections: LarousseSection[] = [];
    let $next = $header.next();
    while ($next.length && !$next.is('[class^="Zone-Entree"]')) {
      if ($next.is('ul.Definitions')) {
        const html = $.html($next).trim();
        if (html) {
          sections.push({ title: 'Définitions', html });
        }
      }
      $next = $next.next();
    }

    if (sections.length > 0 || pos) {
      entries.push({ word, pos, etymology, audioUrl, sections });
    }
  });

  return entries;
}

function addSharedSections($: cheerio.CheerioAPI, entries: LarousseEntry[]): void {
  if (entries.length === 0) return;

  const $page = $.root();

  const expressionsHtml = extractExpressionsHtml($, $page);
  if (expressionsHtml) {
    entries[entries.length - 1].sections.push({ title: 'Expressions', html: expressionsHtml });
  }

  const homonymesHtml = extractHomonymesHtml($, $page);
  if (homonymesHtml) {
    entries[entries.length - 1].sections.push({ title: 'Homonymes', html: homonymesHtml });
  }

  const difficultesHtml = extractDifficultesHtml($, $page);
  if (difficultesHtml) {
    entries[entries.length - 1].sections.push({ title: 'Difficultés', html: difficultesHtml });
  }

  const citationsHtml = extractCitationsHtml($, $page);
  if (citationsHtml) {
    entries[entries.length - 1].sections.push({ title: 'Citations', html: citationsHtml });
  }
}

export async function search(text: string): Promise<LarousseResult[]> {
  const query = text.trim();
  if (!query) return [];

  const url = `${DICT_URL}${encodeURIComponent(query)}`;

  try {
    const rawHtml = await fetchGetHtml(url, {
      'Accept-Language': 'fr-FR,fr;q=0.9',
    });

    const $ = cheerio.load(rawHtml);
    removeJunkNodes($, $.root());

    const entries = parseEntries($);
    if (entries.length === 0) return [];

    addSharedSections($, entries);

    return [{ entries, baseUrl: BASE_URL }];
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) return [];
      throw new Error(
        i18next.t('engineError.larousseRequestFailed', {
          status: error.status,
          statusText: error.statusText,
        }),
        { cause: error },
      );
    }
    throw error;
  }
}
