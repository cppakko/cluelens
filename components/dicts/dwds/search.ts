import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';

import type { DwdsResult, DwdsSection } from './types';

const BASE_URL = 'https://www.dwds.de';
const WB_URL = `${BASE_URL}/wb/`;

const SECTION_HEADINGS = [
  'Bedeutungsübersicht',
  'Bedeutung',
  'Bedeutungen',
  'Etymologie',
  'Bedeutungsverwandte Ausdrücke',
];

function removeJunkNodes($: cheerio.CheerioAPI, $root: cheerio.Cheerio<AnyNode>): void {
  $root.find('script, style, noscript, iframe, form, svg, audio').remove();
  $root.find('.dwds-article-icons-wrapper').remove();
  $root.find('.more-button, .expansion-button, .collapse-button').remove();
  $root.find('.dwdswb-mobile-info-button').remove();
  $root.find('.ext-separator').remove();
  $root.find('.sidebar-wrapper').remove();
  $root.find('.citation-help, .article-share-container').remove();
  $root.find('.goethe').remove();
  $root.find('.hyphinput').remove();
  $root.find('[data-nosnippet]').remove();
  $root.find('.glyphicon-volume-up').remove();

  $root.find('.more-block, .more-relations').each((_, el) => {
    $(el).css('display', '');
    $(el).removeAttr('style');
  });
}

function extractGrammarHtml($: cheerio.CheerioAPI, $article: cheerio.Cheerio<AnyNode>): string | undefined {
  const $blocks = $article.find('.dwdswb-ft-blocks').first();
  if (!$blocks.length) return undefined;

  const parts: string[] = [];
  $blocks.children('.dwdswb-ft-block').each((_, el) => {
    const $el = $(el);
    const label = $el.find('.dwdswb-ft-blocklabel').text().trim();
    // Skip Wortbildung and Mehrwortausdrücke - too long for panel display
    if (label.startsWith('Wortbildung') || label.startsWith('Mehrwortausdrücke')) return;
    const html = $.html(el).trim();
    if (html) parts.push(html);
  });

  return parts.length > 0 ? parts.join('') : undefined;
}

function extractIpa($article: cheerio.Cheerio<AnyNode>): string | undefined {
  const ipaEl = $article.find('.dwdswb-ipa').first();
  return ipaEl.length ? ipaEl.text().trim() : undefined;
}

function extractWortart($article: cheerio.Cheerio<AnyNode>): string | undefined {
  const $gramBlock = $article.find('.dwdswb-ft-block').first();
  const blockText = $gramBlock.find('.dwdswb-ft-blocktext').first();
  if (!blockText.length) return undefined;
  const firstSpan = blockText.children('span').first();
  return firstSpan.length ? firstSpan.text().trim() : undefined;
}

function extractSectionsFromArticle($: cheerio.CheerioAPI, $article: cheerio.Cheerio<AnyNode>, $pane: cheerio.Cheerio<AnyNode>): DwdsSection[] {
  const sections: DwdsSection[] = [];

  const $bedeutungsuebersicht = $article.find('.bedeutungsuebersicht').first();
  if ($bedeutungsuebersicht.length) {
    const $clone = $bedeutungsuebersicht.clone();
    $clone.find('h2').remove();
    const html = $clone.html()?.trim();
    if (html) {
      sections.push({ title: 'Bedeutungsübersicht', html });
    }
  }

  const $lesarten = $article.find('.dwdswb-lesarten').length
    ? $article.find('.dwdswb-lesarten').first()
    : $pane.find('.dwdswb-lesarten').first();
  if ($lesarten.length) {
    const headingText = $lesarten.find('.dwdswb-bedeutungsteil-header h2').first().text().trim() || 'Bedeutungen';
    const $clone = $lesarten.clone();
    $clone.find('.dwdswb-bedeutungsteil-header').remove();
    const html = $clone.html()?.trim();
    if (html) {
      sections.push({ title: headingText, html });
    }
  }

  $pane.find('h2').each((_, h2El) => {
    const $h2 = $(h2El);
    const rawTitle = $h2.text().trim();

    const matchedTitle = SECTION_HEADINGS.find(
      (heading) => rawTitle === heading || rawTitle.startsWith(heading),
    );
    if (!matchedTitle || matchedTitle === 'Bedeutungsübersicht' || matchedTitle === 'Bedeutungen' || matchedTitle === 'Bedeutung') return;

    const contentParts: string[] = [];
    let $el = $h2.next();
    while ($el.length) {
      if ($el.is('h2') || $el.hasClass('ext-separator') || $el.hasClass('citation-help') || $el.hasClass('article-share-container')) break;
      if ($el.hasClass('ext-quelle')) {
        $el = $el.next();
        continue;
      }
      const html = $.html($el[0]);
      if (html) contentParts.push(html);
      $el = $el.next();
    }

    const html = contentParts.join('').trim();
    if (html) {
      sections.push({ title: matchedTitle, html });
    }
  });

  return sections;
}

function buildResult(
  $: cheerio.CheerioAPI,
  $article: cheerio.Cheerio<AnyNode>,
  $pane: cheerio.Cheerio<AnyNode>,
  query: string,
): DwdsResult | undefined {
  const word = $article.find('.dwdswb-ft-lemmaansatz').first().text().trim() || query;
  const ipa = extractIpa($article);
  const wortart = extractWortart($article);
  const grammarHtml = extractGrammarHtml($, $article);
  const sections = extractSectionsFromArticle($, $article, $pane);

  const allSections: DwdsSection[] = [];
  if (grammarHtml) allSections.push({ title: 'Grammatik', html: grammarHtml });
  allSections.push(...sections);

  if (allSections.length === 0) return undefined;

  return {
    word,
    wortart,
    ipa,
    sections: allSections,
    baseUrl: BASE_URL,
  };
}

function parseArticles($: cheerio.CheerioAPI, query: string): DwdsResult[] {
  const results: DwdsResult[] = [];

  // Check for multi-article pages (homographs) with tab-pane structure
  const $tabPanes = $('.tab-content .tab-pane').filter((_, el) => {
    const id = $(el).attr('id');
    return id !== '0' && $(el).find('.dwdswb-artikel').length > 0;
  });

  if ($tabPanes.length > 0) {
    $tabPanes.each((_, paneEl) => {
      const $pane = $(paneEl);
      const $article = $pane.find('.dwdswb-artikel').first();
      if (!$article.length) return;

      removeJunkNodes($, $pane);
      const result = buildResult($, $article, $pane, query);
      if (result) results.push(result);
    });
  } else {
    const $article = $('.dwdswb-artikel').first();
    if (!$article.length) return [];
    const $pane = $article.parent();

    removeJunkNodes($, $pane);
    const result = buildResult($, $article, $pane, query);
    if (result) results.push(result);
  }

  return results;
}

export async function search(text: string): Promise<DwdsResult[]> {
  const query = text.trim();
  if (!query) return [];

  try {
    const rawHtml = await fetchGetHtml(`${WB_URL}${encodeURIComponent(query)}`, {
      'Accept-Language': 'de-DE,de;q=0.9',
    });

    const $ = cheerio.load(rawHtml);
    return parseArticles($, query);
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) return [];
      throw new Error(i18next.t('dwds.requestFailed', {
        status: error.status,
        statusText: error.statusText,
      }), { cause: error });
    }
    throw error;
  }
}
