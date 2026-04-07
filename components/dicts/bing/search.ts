import * as cheerio from 'cheerio';

import { fetchGetHtml } from '@/utils/fetchHtml';

import { BingResult } from './types';

const BASE_URL = 'https://cn.bing.com';
const SEARCH_URL = 'https://cn.bing.com/dict/clientsearch?mkt=zh-CN&setLang=zh&form=BDVEHC&ClientVer=BDDTV3.5.1.4320&q=';

function resolveAudioUrl(url: string): string {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return url;
  }
}

function parse(rawHtml: string): BingResult[] {
  const $ = cheerio.load(rawHtml);
  const tabs: BingResult['tabs'] = [];

  $('.client_tb_con span').each((_, el) => {
    const $tab = $(el);
    const tabId = $tab.attr('id');
    const title = $tab.text().trim();

    if (!tabId) {
      return;
    }

    const contentId = tabId.replace('tabid', 'id');
    const $content = $(`#${contentId}`);
    if ($content.length === 0) {
      return;
    }

    tabs.push({
      title,
      tabId,
      contentId,
      content: $content.html() || '',
    });
  });

  const title = $('.client_def_hd_hd').text().trim();
  if (!title) {
    return [];
  }

  $('.client_sentence_content #sentenceSeg').each((_, el) => {
    $(el).find('.bi_pag').remove();
    $(el).find('.client_sentence_list_link').remove();
  });

  return [{
    title,
    prons: $('.client_def_hd_pn_bar').map((_, el) => ({
      lang: $(el).find('.client_def_hd_pn').text().trim(),
      pron: resolveAudioUrl($(el).find('.client_aud_o').attr('data-pronunciation') || ''),
    })).get(),
    tabs,
    client_def_container: $('.client_def_container').html() || '',
    client_search_rightside_content: $('.client_search_rightside_content').html() || '',
    client_sentence_content: $('.client_sentence_content #sentenceSeg').html() || '',
  }];
}

export async function search(text: string): Promise<BingResult[]> {
  const rawHtml = await fetchGetHtml(SEARCH_URL + encodeURIComponent(text));
  return parse(rawHtml);
}

