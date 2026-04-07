import { defaultWiktionaryConfig, type WiktionaryConfig } from './types';
import type { DictSettingsBackupHandler } from '../shared/settingsBackupCommon';
import { isRecord, normalizeString } from '../shared/settingsBackupCommon';
import { wiktionaryConfigStorage } from '@/utils/storage';

function normalizeWiktionaryConfig(value: unknown): WiktionaryConfig {
  const prev = isRecord(value) ? value : {};

  return {
    displayLanguage: normalizeString(prev.displayLanguage, defaultWiktionaryConfig.displayLanguage),
  };
}

export const settingsBackupHandler: DictSettingsBackupHandler<WiktionaryConfig> = {
  key: 'wiktionaryConfig',
  async exportValue() {
    return normalizeWiktionaryConfig(await wiktionaryConfigStorage.getValue());
  },
  async importValue(value) {
    const normalized = normalizeWiktionaryConfig(value);
    await wiktionaryConfigStorage.setValue(normalized);
    return normalized;
  },
};