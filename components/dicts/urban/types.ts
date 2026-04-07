export interface UrbanEntry {
  word: string;
  definition: string;
  example: string;
  author: string;
  thumbs_up: number;
  thumbs_down: number;
  permalink: string;
}

export interface UrbanResult {
  entries: UrbanEntry[];
}
