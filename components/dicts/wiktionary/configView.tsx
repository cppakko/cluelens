import React from 'react';
import { defaultWiktionaryConfig } from './types';
import { wiktionaryConfigStorage } from '@/utils/storage';
import { useTranslation } from 'react-i18next';
import {
  useConfigState,
  ConfigContainer,
  ConfigField,
  ConfigSelect,
} from '../shared/configCommon';

const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
  { value: 'ko', label: '한국어' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
];

export default function WiktionaryConfigView() {
  const { t } = useTranslation();
  const [config, handleChange] = useConfigState(wiktionaryConfigStorage, defaultWiktionaryConfig);

  return (
    <ConfigContainer>
      <ConfigField
        label={t('wiktionaryConfig.displayLanguage')}
        description={t('wiktionaryConfig.displayLanguageDesc')}
      >
        <ConfigSelect
          value={config.displayLanguage}
          onValueChange={(value) => handleChange({ displayLanguage: value })}
          options={LANGUAGE_OPTIONS}
        />
      </ConfigField>
    </ConfigContainer>
  );
}
