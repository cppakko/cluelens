export interface BingTab {
  title: string;
  tabId: string;
  contentId: string;
  content: string;
}

export interface BingPron {
  lang: string;
  pron: string;
}

export interface BingResult {
  title: string;
  prons: BingPron[];
  tabs: BingTab[];
  client_def_container: string;
  client_search_rightside_content: string;
  client_sentence_content: string;
}