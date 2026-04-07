export interface OmwSynset {
  synsetId: string;
  lemmas: string[];
  definition: string;
  pos: string;
}

export interface OmwTranslation {
  language: string;
  lemmas: string[];
}

export interface OmwDefinition {
  language: string;
  text: string;
}

export interface OmwRelation {
  type: string;
  targets: string[];
}

export interface OmwDetailResult {
  synsetId: string;
  glossary: string;
  translations: OmwTranslation[];
  definitions: OmwDefinition[];
  relations: OmwRelation[];
}

export interface OmwSearchResult {
  details: OmwDetailResult[];
}

export interface OmwConfig {
  lang: string;
  lang2: string;
  maxSynsets: number;
}

export const defaultOmwConfig: OmwConfig = {
  lang: 'auto',
  lang2: 'eng',
  maxSynsets: 3,
};
