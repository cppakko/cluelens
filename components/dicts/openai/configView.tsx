import { openAIConfigDefault } from './types';
import { openAIConfigStorage } from '@/utils/storage';
import { useTranslation } from 'react-i18next';
import {
  useConfigState,
  ConfigContainer,
  ConfigField,
  ConfigInput,
  ConfigTextarea,
} from '../shared/configCommon';

export default function OpenAIConfigView() {
  const { t } = useTranslation();
  const [config, handleChange] = useConfigState(openAIConfigStorage, openAIConfigDefault);

  return (
    <ConfigContainer>
      <ConfigField label={t('openaiConfig.baseUrl')}>
        <ConfigInput
          value={config.baseURL}
          onChange={(e) => handleChange({ baseURL: e.target.value })}
          placeholder="https://api.openai.com/v1"
        />
      </ConfigField>

      <ConfigField label={t('openaiConfig.apiKey')}>
        <ConfigInput
          type="password"
          value={config.apiKey}
          onChange={(e) => handleChange({ apiKey: e.target.value })}
          placeholder="sk-..."
        />
      </ConfigField>

      <ConfigField label={t('openaiConfig.model')}>
        <ConfigInput
          value={config.model}
          onChange={(e) => handleChange({ model: e.target.value })}
          placeholder="gpt-3.5-turbo, gpt-4, etc."
        />
      </ConfigField>

      <ConfigField
        label={t('openaiConfig.systemPrompt')}
      >
        <ConfigTextarea
          value={config.systemPrompt}
          onChange={(e) => handleChange({ systemPrompt: e.target.value })}
          placeholder={t('openaiConfig.systemPromptPlaceholder')}
          className="min-h-50"
        />
      </ConfigField>
    </ConfigContainer>
  );
}
