export interface DwdsSection {
  title: string;
  html: string;
}

export interface DwdsResult {
  word: string;
  wortart?: string;
  ipa?: string;
  sections: DwdsSection[];
  baseUrl: string;
}
