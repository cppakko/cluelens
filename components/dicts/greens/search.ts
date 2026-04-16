import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';

import type { GreensCandidate, GreensDetailResult, GreensSearchResult } from './types';

const BASE_URL = 'https://greensdictofslang.com';
const SEARCH_URL = `${BASE_URL}/search/basic?q=`;

function normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function stripTrailingComma(text: string): string {
    return text.replace(/,\s*$/, '').trim();
}

function resolveUrl(path: string): string {
    return new URL(path, BASE_URL).toString();
}

function parseCandidate($: cheerio.CheerioAPI, linkEl: AnyNode): GreensCandidate | undefined {
    const $link = $(linkEl);
    const href = $link.attr('href');
    if (!href) return undefined;

    const $entry = $link.find('article.srentry').first();
    if (!$entry.length) return undefined;

    const isSubentry = $entry.find('.subhw').length > 0;
    const $head = $entry.find('.srhead').first();
    const title = isSubentry
        ? stripTrailingComma(normalizeText($entry.find('.subhw').first().text()))
        : stripTrailingComma(normalizeText($head.find('.hw').first().text()));

    if (!title) return undefined;

    const pos = normalizeText((isSubentry ? $entry.find('.subpos').first() : $head.find('.pos').first()).text()) || undefined;
    const homonym = normalizeText($head.find('.homonym').first().text()) || undefined;

    const summary = $entry.find('.srdefinition').toArray()
        .map((el) => normalizeText($(el).text()))
        .filter(Boolean)
        .join(' ');

    const moreInfo = normalizeText($entry.find('.moreinfo').first().text()) || undefined;

    return {
        href: resolveUrl(href),
        title,
        pos,
        homonym,
        summary,
        moreInfo,
        isSubentry,
    };
}

function parseSearchResults(rawHtml: string, query: string): GreensSearchResult[] {
    const $ = cheerio.load(rawHtml);
    const candidates: GreensCandidate[] = [];
    const seenHrefs = new Set<string>();

    $('#searchresults a.srlink').each((_, el) => {
        const candidate = parseCandidate($, el);
        if (!candidate || seenHrefs.has(candidate.href)) return;
        seenHrefs.add(candidate.href);
        candidates.push(candidate);
    });

    if (candidates.length === 0) {
        return [];
    }

    const totalResultsText = normalizeText($('#resultsinfo b').first().text());
    const totalResults = Number.parseInt(totalResultsText, 10) || candidates.length;

    return [{
        query,
        totalResults,
        candidates,
    }];
}

function pickDetailArticle($: cheerio.CheerioAPI, targetId: string | undefined): cheerio.Cheerio<AnyNode> {
    if (targetId) {
        const directMatch = $(`article.subentry[id="${targetId}"], article.entry[id="${targetId}"]`).first();
        if (directMatch.length) {
            return directMatch;
        }

        const nestedTarget = $(`[id="${targetId}"]`).first();
        if (nestedTarget.length) {
            const parentArticle = nestedTarget.closest('article.subentry, article.entry');
            if (parentArticle.length) {
                return parentArticle.first();
            }
        }
    }

    return $('main article.entry').first();
}

function cleanupDetailHtml($article: cheerio.Cheerio<AnyNode>): string {
    const $clone = $article.clone();
    $clone.find('script, style, .timelinearea, .qtoggle').remove();
    return cheerio.load('<div></div>')('div').append($clone).html() ?? '';
}

export async function search(text: string): Promise<GreensSearchResult[]> {
    const query = text.trim();
    if (!query) return [];

    try {
        const rawHtml = await fetchGetHtml(SEARCH_URL + encodeURIComponent(query));
        return parseSearchResults(rawHtml, query);
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 404) return [];
            throw new Error(i18next.t('engineError.greensRequestFailed', {
                status: error.status,
                statusText: error.statusText,
            }), { cause: error });
        }
        throw error;
    }
}

export async function loadDetail(payload: unknown): Promise<GreensDetailResult> {
    const candidate = payload as Partial<GreensCandidate>;
    if (typeof candidate?.href !== 'string') {
        throw new Error('Invalid Greens detail payload.');
    }

    const sourceUrl = candidate.href;
    const pageUrl = new URL(sourceUrl);
    const targetId = pageUrl.hash ? pageUrl.hash.slice(1) : undefined;
    pageUrl.hash = '';

    try {
        const rawHtml = await fetchGetHtml(pageUrl.toString());
        const $ = cheerio.load(rawHtml);
        const $article = pickDetailArticle($, targetId);
        if (!$article.length) {
            throw new Error('Unable to find matching entry content on Green\'s Dictionary page.');
        }

        const html = cleanupDetailHtml($article);
        if (!html) {
            throw new Error('Selected Green\'s Dictionary entry is empty.');
        }

        return {
            html,
            sourceUrl,
            baseUrl: pageUrl.toString(),
            isSubentry: Boolean(targetId),
        };
    } catch (error) {
        if (error instanceof HttpError) {
            throw new Error(i18next.t('engineError.greensRequestFailed', {
                status: error.status,
                statusText: error.statusText,
            }), { cause: error });
        }
        throw error;
    }
}