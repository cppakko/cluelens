import { openAIConfigDefault, type OpenAIConfig } from './types';
import type { DictSettingsBackupHandler } from '../shared/settingsBackupCommon';
import { isRecord, normalizeString } from '../shared/settingsBackupCommon';
import { openAIConfigStorage } from '@/utils/storage';

function normalizeOpenAIConfig(value: unknown): OpenAIConfig {
  const prev = isRecord(value) ? value : {};

  return {
    baseURL: normalizeString(prev.baseURL, openAIConfigDefault.baseURL),
    apiKey: normalizeString(prev.apiKey, openAIConfigDefault.apiKey),
    model: normalizeString(prev.model, openAIConfigDefault.model),
    systemPrompt: normalizeString(prev.systemPrompt, openAIConfigDefault.systemPrompt),
  };
}

export const settingsBackupHandler: DictSettingsBackupHandler<OpenAIConfig> = {
  key: 'openAIConfig',
  async exportValue() {
    return normalizeOpenAIConfig(await openAIConfigStorage.getValue());
  },
  async importValue(value) {
    const normalized = normalizeOpenAIConfig(value);
    await openAIConfigStorage.setValue(normalized);
    return normalized;
  },
};