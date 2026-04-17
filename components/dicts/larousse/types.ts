export interface LarousseSection {
  title: string;
  html: string;
}

export interface LarousseEntry {
  word: string;
  pos?: string;
  etymology?: string;
  audioUrl?: string;
  sections: LarousseSection[];
}

export interface LarousseResult {
  entries: LarousseEntry[];
  baseUrl: string;
}
