import { DeeplxEndpointType, deeplxConfigDefault, type DeeplxConfig } from './types';
import type { DictSettingsBackupHandler } from '../shared/settingsBackupCommon';
import { isRecord, normalizeEnum, normalizeString } from '../shared/settingsBackupCommon';
import { deeplxConfigStorage } from '@/utils/storage';

const validDeeplxEndpointTypes = new Set(Object.values(DeeplxEndpointType));

function normalizeDeeplxConfig(value: unknown): DeeplxConfig {
  const prev = isRecord(value) ? value : {};

  return {
    apiKey: normalizeString(prev.apiKey, deeplxConfigDefault.apiKey),
    apiEndpoint: normalizeString(prev.apiEndpoint, deeplxConfigDefault.apiEndpoint),
    endPointType: normalizeEnum(prev.endPointType, validDeeplxEndpointTypes, deeplxConfigDefault.endPointType),
  };
}

export const settingsBackupHandler: DictSettingsBackupHandler<DeeplxConfig> = {
  key: 'deeplxConfig',
  async exportValue() {
    return normalizeDeeplxConfig(await deeplxConfigStorage.getValue());
  },
  async importValue(value) {
    const normalized = normalizeDeeplxConfig(value);
    await deeplxConfigStorage.setValue(normalized);
    return normalized;
  },
};