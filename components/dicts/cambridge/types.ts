export interface CambridgePron {
  region: string;
  ipa: string;
  audioUrl?: string;
}

export interface CambridgeExample {
  text: string;
  translation?: string;
}

export interface CambridgeDefinition {
  level?: string;
  grammarCode?: string;
  usageLabel?: string;
  definition: string;
  translation?: string;
  examples: CambridgeExample[];
}

export interface CambridgeSenseGroup {
  guideWord?: string;
  definitions: CambridgeDefinition[];
}

export interface CambridgeEntry {
  word: string;
  pos?: string;
  prons: CambridgePron[];
  senseGroups: CambridgeSenseGroup[];
}

export interface CambridgeResult {
  entries: CambridgeEntry[];
}

export interface CambridgeConfig {
  langPair: string;
}

export const defaultCambridgeConfig: CambridgeConfig = {
  langPair: 'english-chinese-simplified',
};

export const CAMBRIDGE_LANG_PAIRS: { value: string; label: string }[] = [
  { value: 'english-chinese-simplified', label: 'English–Chinese (Simplified)' },
  { value: 'english-chinese-traditional', label: 'English–Chinese (Traditional)' },
  { value: 'english-danish', label: 'English–Danish' },
  { value: 'english-dutch', label: 'English–Dutch' },
  { value: 'english-french', label: 'English–French' },
  { value: 'english-german', label: 'English–German' },
  { value: 'english-indonesian', label: 'English–Indonesian' },
  { value: 'english-italian', label: 'English–Italian' },
  { value: 'english-japanese', label: 'English–Japanese' },
  { value: 'english-norwegian', label: 'English–Norwegian' },
  { value: 'english-polish', label: 'English–Polish' },
  { value: 'english-portuguese', label: 'English–Portuguese' },
  { value: 'english-spanish', label: 'English–Spanish' },
  { value: 'english-swedish', label: 'English–Swedish' },
];
