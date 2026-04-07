import * as cheerio from 'cheerio';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';

import { MoegirlResult } from './types';

const BASE_URL = 'https://zh.moegirl.org.cn/';
const API_BASE_URL = 'https://zh.moegirl.org.cn/rest.php/v1/page/';

function getSourceUrl(title: string): string {
  return new URL(encodeURIComponent(title), BASE_URL).toString();
}

function removeJunkNodes($: cheerio.CheerioAPI): void {
  $('script, style, noscript, iframe, form, button, input, textarea, select').remove();
  $('.mw-editsection, .toc, .shortdescription, .navbox, .vertical-navbox, .catlinks, .printfooter, .metadata, .noprint, .ambox, .ombox, .portal, .stub, [role="navigation"]').remove();

  $('a').each((_, element) => {
    const $element = $(element);
    if (!$element.attr('href')) {
      $element.replaceWith($element.html() ?? '');
    }
  });
}

function normalizeMediaUrls($: cheerio.CheerioAPI): void {
  $('img, source').each((_, element) => {
    const $element = $(element);
    const src = $element.attr('src');
    if (src?.startsWith('//')) {
      $element.attr('src', `https:${src}`);
    }
  });
}

function normalizeInfoboxes($: cheerio.CheerioAPI): void {
  $('.moe-infobox.infobox3').each((_, element) => {
    const $infobox = $(element);
    $infobox.addClass('moegirl-infobox-card');

    $infobox.children('div').each((__, child) => {
      const $child = $(child);

      if ($child.hasClass('infobox-image-container')) {
        $child.addClass('moegirl-infobox-image');
        return;
      }

      const directDivChildren = $child.children('div');
      if (directDivChildren.length === 2) {
        $child.addClass('moegirl-infobox-row');
        directDivChildren.eq(0).addClass('moegirl-infobox-label');
        directDivChildren.eq(1).addClass('moegirl-infobox-value');
        return;
      }

      if ($child.text().trim()) {
        $child.addClass('moegirl-infobox-section');
      }
    });
  });
}

function pickContentHtml(rawHtml: string): string {
  const $ = cheerio.load(rawHtml);
  removeJunkNodes($);
  normalizeMediaUrls($);
  normalizeInfoboxes($);

  const $content = $('.mw-parser-output').first();
  if ($content.length > 0) {
    return $.html($content);
  }

  return $('body').html()?.trim() || $.root().html() || '';
}

export async function search(text: string): Promise<MoegirlResult[]> {
  const query = text.trim();
  if (!query) {
    return [];
  }

  try {
    const rawHtml = await fetchGetHtml(`${API_BASE_URL}${encodeURIComponent(query)}/html`, {
      'Accept-Language': 'zh-CN,zh;q=0.9',
    });

    const html = pickContentHtml(rawHtml);
    if (!html) {
      return [];
    }

    return [{
      title: query,
      html,
      sourceUrl: getSourceUrl(query),
      baseUrl: BASE_URL,
    }];
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) {
        return [];
      }

      throw new Error(i18next.t('engineError.moegirlRequestFailed', {
        status: error.status,
        statusText: error.statusText,
      }), { cause: error });
    }

    throw error;
  }
}
