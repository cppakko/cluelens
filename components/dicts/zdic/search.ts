import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';

import { ZdicResult } from './types';

const BASE_URL = 'https://www.zdic.net';
const SEARCH_URL = `${BASE_URL}/hans/`;
const SECTION_TITLES = [
  '基本解释',
  '详细解释',
  '國語辭典',
  '《康熙字典》',
  '《说文解字》',
  '音韵方言',
  '字源字形',
];

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\uFF1A:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return url;
  }
}

function removeJunkNodes($root: cheerio.Cheerio<AnyNode>): void {
  $root.find('script, style, noscript, iframe, form, button, input, textarea, select').remove();

  $root.find('*').each((_, element) => {
    const $element = $root.find(element).addBack().filter(element).first();
    const marker = `${$element.attr('id') ?? ''} ${$element.attr('class') ?? ''}`.toLowerCase();

    if (/(^|[\s_-])(nav|menu|header|footer|aside|ad|ads|banner|share|toolbar|search|recommend|related|comment|qr|download|app)([\s_-]|$)/.test(marker)) {
      $element.remove();
      return;
    }

    if ($element.is('a') && !$element.attr('href')) {
      $element.replaceWith($element.html() ?? '');
    }
  });
}

function scoreCandidate($element: cheerio.Cheerio<AnyNode>, query: string): number {
  const text = normalizeText($element.text());
  if (text.length < 80) {
    return -Infinity;
  }

  const keywordHits = SECTION_TITLES.filter((title) => text.includes(title)).length;
  const headings = $element.find('h1, h2, h3, h4, h5').length;
  const links = $element.find('a').length;
  const descendants = $element.find('*').length;
  const queryBoost = text.includes(query) ? 120 : 0;

  return (
    Math.min(text.length, 6000)
    + keywordHits * 450
    + headings * 60
    + queryBoost
    - links * 12
    - descendants * 0.8
  );
}

function selectMainContainer($: cheerio.CheerioAPI, query: string): cheerio.Cheerio<AnyNode> {
  const preferredSelectors = [
    'main',
    'article',
    '[role="main"]',
    '#content',
    '.content',
    '.entry',
    '.main',
    '.cont',
    '.body',
  ];

  let best: cheerio.Cheerio<AnyNode> | null = null;
  let bestScore = -Infinity;

  preferredSelectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const $element = $(element);
      const score = scoreCandidate($element, query) + 40;
      if (score > bestScore) {
        best = $element;
        bestScore = score;
      }
    });
  });

  $('section, div').each((_, element) => {
    const $element = $(element);
    const score = scoreCandidate($element, query);
    if (score > bestScore) {
      best = $element;
      bestScore = score;
    }
  });

  return best ?? $('body');
}

function findSectionTitle($element: cheerio.Cheerio<AnyNode>): string | undefined {
  const $candidate = $element.find('.nr-box-header:first .h2_entry:first .span.dictname:first').first();

  if ($candidate.length === 0) {
    return undefined;
  }

  const text = normalizeText($candidate.text().trim());
  const matchedTitle = SECTION_TITLES.find((title) => text === title || text.startsWith(title));
  if (matchedTitle) {
    return matchedTitle;
  }

  const fallbackText = normalizeText($element.text().trim()).slice(0, 30);
  return SECTION_TITLES.find((title) => fallbackText.startsWith(title));
}

function stripLeadingTitle(html: string, title: string): string {
  if (!html) {
    return html;
  }

  const fragment = cheerio.load(`<div id="zdic-root">${html}</div>`);
  const $root = fragment('#zdic-root');
  const $first = $root.children().first();
  const firstText = normalizeText($first.text());

  if ($first.length > 0 && (firstText === title || firstText.startsWith(title))) {
    $first.remove();
  }

  return $root.html()?.trim() ?? '';
}

function extractSections($: cheerio.CheerioAPI) {
  const sections: ZdicResult['sections'] = [];

  $('.dictionaries.zdict').children().each((_, element) => {
    const $element = $(element);
    const title = findSectionTitle($element);
    if (!title) {
      return;
    }

    const rawHtml = $.html(element);
    const html = stripLeadingTitle(rawHtml, title);
    const text = normalizeText($element.text());
    if (!html || text.length < 20) {
      return;
    }

    const existing = sections.find((section) => section.title === title);
    if (!existing) {
      sections.push({ title, html });
    }
  });

  return sections;
}

function parse(rawHtml: string, query: string): ZdicResult[] {
  const $ = cheerio.load(rawHtml);
  const word = normalizeText($('.h1_entry, h1').first().text()) || query;
  const $zipic = $('.zipic.mlt, .zipic').first();
  const entryImgHtml = $zipic.length ? $.html($zipic[0]) : undefined;

  const $container = selectMainContainer($, query).clone();
  removeJunkNodes($container);
  $container.find('.entry_title, .h1_entry').remove();
  const heuristic = extractSections($);
  const contentHtml = $container.html()?.trim();
  if (!contentHtml) return [];
  const sections = heuristic.length > 0 ? heuristic : [{ title: '\u6c49\u5178', html: contentHtml }];

  return [{
    word,
    entryImgHtml,
    sections,
    sourceUrl: resolveUrl(`${SEARCH_URL}${encodeURIComponent(query)}`) ?? `${SEARCH_URL}${encodeURIComponent(query)}`,
    baseUrl: BASE_URL,
  }];
}

export async function search(text: string): Promise<ZdicResult[]> {
  const query = text.trim();
  if (!query) {
    return [];
  }

  try {
    const rawHtml = await fetchGetHtml(`${SEARCH_URL}${encodeURIComponent(query)}`, {
      'Accept-Language': 'zh-CN,zh;q=0.9',
    });

    return parse(rawHtml, query);
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) {
        return [];
      }

      throw new Error(i18next.t('engineError.zdicRequestFailed', {
        status: error.status,
        statusText: error.statusText,
      }), { cause: error });
    }

    throw error;
  }
}
