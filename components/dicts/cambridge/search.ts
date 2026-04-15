import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import i18next from 'i18next';

import { fetchGetHtml, HttpError } from '@/utils/fetchHtml';
import { cambridgeConfigStorage } from '@/utils/storage';

import type {
  CambridgeDefinition,
  CambridgeEntry,
  CambridgeExample,
  CambridgePron,
  CambridgeResult,
  CambridgeSenseGroup,
} from './types';

const BASE_URL = 'https://dictionary.cambridge.org';

function extractProns($: cheerio.CheerioAPI, $header: cheerio.Cheerio<AnyNode>): CambridgePron[] {
  const prons: CambridgePron[] = [];

  $header.find('.dpron-i').each((_, el) => {
    const $pron = $(el);
    const region = $pron.find('.region.dreg').first().text().trim();
    const ipa = $pron.find('.ipa.dipa').first().text().trim();
    if (!ipa) return;

    const audioSrc = $pron.find('.daud audio source[type="audio/mpeg"]').first().attr('src');
    const audioUrl = audioSrc ? (audioSrc.startsWith('/') ? `${BASE_URL}${audioSrc}` : audioSrc) : undefined;

    prons.push({ region, ipa, audioUrl });
  });

  return prons;
}

function extractExamples($: cheerio.CheerioAPI, $parent: cheerio.Cheerio<AnyNode>): CambridgeExample[] {
  const examples: CambridgeExample[] = [];

  $parent.find('.examp.dexamp').each((_, el) => {
    const $ex = $(el);
    const text = $ex.find('.eg.deg').first().text().trim();
    if (!text) return;

    const translation = $ex.find('.trans.dtrans').first().text().trim() || undefined;
    examples.push({ text, translation });
  });

  return examples;
}

function extractDefinitions($: cheerio.CheerioAPI, $parent: cheerio.Cheerio<AnyNode>): CambridgeDefinition[] {
  const definitions: CambridgeDefinition[] = [];

  $parent.find('.def-block.ddef_block').each((_, el) => {
    const $block = $(el);

    const level = $block.find('.ddef_h .epp-xref.dxref').first().text().trim() || undefined;
    const usageLabel = $block.find('.ddef_h .lab.dlab .usage.dusage').first().text().trim() || undefined;
    const grammarCode = $block.find('.ddef_h .gram.dgram').first().text().trim() || undefined;
    const definition = $block.find('.def.ddef_d').first().text().trim();
    if (!definition) return;

    // Translation is the first direct .trans.dtrans child of .def-body (not inside .examp)
    const $defBody = $block.find('.def-body.ddef_b').first();
    const translation = $defBody.children('.trans.dtrans').first().text().trim() || undefined;

    const examples = extractExamples($, $defBody);

    definitions.push({
      level,
      grammarCode,
      usageLabel,
      definition,
      translation,
      examples,
    });
  });

  return definitions;
}

function extractSenseGroups($: cheerio.CheerioAPI, $posBody: cheerio.Cheerio<AnyNode>): CambridgeSenseGroup[] {
  const groups: CambridgeSenseGroup[] = [];

  $posBody.find('.pr.dsense, .pr.dsense-noh').each((_, el) => {
    const $sense = $(el);
    const guideWord = $sense.find('.dsense_h .guideword span').first().text().trim() || undefined;
    const definitions = extractDefinitions($, $sense);

    if (definitions.length > 0) {
      groups.push({ guideWord, definitions });
    }
  });

  // Some entries have def-blocks directly in .pos-body without sense wrappers
  if (groups.length === 0) {
    const definitions = extractDefinitions($, $posBody);
    if (definitions.length > 0) {
      groups.push({ definitions });
    }
  }

  return groups;
}

function parseEntries($: cheerio.CheerioAPI): CambridgeEntry[] {
  const entries: CambridgeEntry[] = [];

  $('.entry-body__el').each((_, el) => {
    const $entry = $(el);

    const $header = $entry.find('.pos-header.dpos-h').first();
    const word = $header.find('.hw.dhw').first().text().trim();
    if (!word) return;

    const pos = $header.find('.posgram .pos.dpos').first().text().trim() || undefined;
    const prons = extractProns($, $header);

    const $posBody = $entry.find('.pos-body').first();
    const senseGroups = extractSenseGroups($, $posBody);

    if (senseGroups.length > 0) {
      entries.push({ word, pos, prons, senseGroups });
    }
  });

  return entries;
}

export async function search(text: string): Promise<CambridgeResult[]> {
  const query = text.trim();
  if (!query) return [];

  const config = await cambridgeConfigStorage.getValue();
  const langPair = config?.langPair || 'english-chinese-simplified';
  const url = `${BASE_URL}/dictionary/${langPair}/${encodeURIComponent(query)}`;

  try {
    const rawHtml = await fetchGetHtml(url);
    const $ = cheerio.load(rawHtml);
    const entries = parseEntries($);

    if (entries.length === 0) return [];
    return [{ entries }];
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) return [];
      throw new Error(
        i18next.t('engineError.cambridgeRequestFailed', {
          status: error.status,
          statusText: error.statusText,
        }),
        { cause: error },
      );
    }
    throw error;
  }
}
