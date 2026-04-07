import { defaultOmwConfig, type OmwConfig } from './types';
import type { DictSettingsBackupHandler } from '../shared/settingsBackupCommon';
import { isRecord, normalizeString } from '../shared/settingsBackupCommon';
import { omwConfigStorage } from '@/utils/storage';

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeOmwConfig(value: unknown): OmwConfig {
  const prev = isRecord(value) ? value : {};

  return {
    lang: normalizeString(prev.lang, defaultOmwConfig.lang),
    lang2: normalizeString(prev.lang2, defaultOmwConfig.lang2),
    maxSynsets: normalizeNumber(prev.maxSynsets, defaultOmwConfig.maxSynsets),
  };
}

export const settingsBackupHandler: DictSettingsBackupHandler<OmwConfig> = {
  key: 'omwConfig',
  async exportValue() {
    return normalizeOmwConfig(await omwConfigStorage.getValue());
  },
  async importValue(value) {
    const normalized = normalizeOmwConfig(value);
    await omwConfigStorage.setValue(normalized);
    return normalized;
  },
};
