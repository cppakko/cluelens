import * as cheerio from 'cheerio';

import { fetchGetHtml } from '@/utils/fetchHtml';
import { wiktionaryConfigStorage } from '@/utils/storage';

import { WiktionaryResult } from './types';

function getBaseUrl(lang: string): string {
  return `https://${lang}.wiktionary.org/api/rest_v1/page/mobile-html/`;
}

function getSiteBaseUrl(lang: string): string {
  return `https://${lang}.wiktionary.org/`;
}

function resolveProtocol(url: string | undefined): string | undefined {
  if (url && url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

function processImages($: cheerio.CheerioAPI): void {
  // Convert pcs-lazy-load-placeholder <span> to real <img>
  $('span.pcs-lazy-load-placeholder').each((_, el) => {
    const $el = $(el);
    const src = resolveProtocol($el.attr('data-src'));
    if (!src) return;

    const img = $('<img>');
    img.attr('src', src);

    const width = $el.attr('data-width');
    const height = $el.attr('data-height');
    if (width) img.attr('width', width);
    if (height) img.attr('height', height);

    const srcset = $el.attr('data-srcset');
    if (srcset) img.attr('srcset', resolveSrcset(srcset));

    const cls = $el.attr('data-class');
    if (cls) img.attr('class', cls);

    $el.replaceWith(img);
  });

  // Fix protocol-relative URLs on existing <img> elements
  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src) $el.attr('src', resolveProtocol(src)!);

    const srcset = $el.attr('srcset');
    if (srcset) $el.attr('srcset', resolveSrcset(srcset));
  });
}

function processAudio($: cheerio.CheerioAPI): void {
  $('audio').each((_, el) => {
    const $el = $(el);
    const sourceSrc = $el.attr('src') ?? $el.find('source').first().attr('src');
    const src = resolveProtocol(sourceSrc);

    if (!src) {
      $el.remove();
      return;
    }

    const placeholder = $('<span>');
    placeholder.attr('class', 'wiktionary-audio-placeholder');
    placeholder.attr('data-audio-src', src);

    const label = $el.attr('aria-label')
      ?? $el.attr('title')
      ?? $el.find('source').first().attr('title');
    if (label) {
      placeholder.attr('data-audio-label', label);
    }

    $el.replaceWith(placeholder);
  });
}

function resolveSrcset(srcset: string): string {
  return srcset.replace(/(\S+)(\s+[\d.]+[wx])/g, (_, url, descriptor) => {
    return (resolveProtocol(url) ?? url) + descriptor;
  });
}

export async function search(text: string): Promise<WiktionaryResult[]> {
  const config = await wiktionaryConfigStorage.getValue();
  const lang = config.displayLanguage;

  const headers: Record<string, string> = {};
  if (lang === 'zh') {
    headers['Accept-Language'] = 'zh-hans';
  }

  const baseUrl = getSiteBaseUrl(lang);
  const rawHtml = await fetchGetHtml(getBaseUrl(lang) + encodeURIComponent(text), headers);

  const $ = cheerio.load(rawHtml);
  processImages($);
  processAudio($);

  return [{ title: text, html: $.html(), baseUrl }];
}

