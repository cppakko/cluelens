import { caiyunConfigDefault, type CaiyunConfig } from './types';
import type { DictSettingsBackupHandler } from '../shared/settingsBackupCommon';
import { isRecord, normalizeBoolean, normalizeString } from '../shared/settingsBackupCommon';
import { caiyunConfigStorage } from '@/utils/storage';

function normalizeCaiyunConfig(value: unknown): CaiyunConfig {
  const prev = isRecord(value) ? value : {};

  return {
    useCustomToken: normalizeBoolean(prev.useCustomToken, caiyunConfigDefault.useCustomToken),
    token: normalizeString(prev.token, caiyunConfigDefault.token),
  };
}

export const settingsBackupHandler: DictSettingsBackupHandler<CaiyunConfig> = {
  key: 'caiyunConfig',
  async exportValue() {
    return normalizeCaiyunConfig(await caiyunConfigStorage.getValue());
  },
  async importValue(value) {
    const normalized = normalizeCaiyunConfig(value);
    await caiyunConfigStorage.setValue(normalized);
    return normalized;
  },
};