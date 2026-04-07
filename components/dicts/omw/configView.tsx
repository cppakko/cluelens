import { defaultOmwConfig } from './types';
import { omwConfigStorage } from '@/utils/storage';
import { useTranslation } from 'react-i18next';
import {
  useConfigState,
  ConfigContainer,
  ConfigField,
  ConfigSelect,
} from '../shared/configCommon';

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'eng', label: 'English' },
  { value: 'cmn', label: '简体中文 (Chinese)' },
  { value: 'jpn', label: '日本語 (Japanese)' },
  { value: 'ind', label: 'Indonesian' },
  { value: 'zsm', label: 'Malaysian' },
  { value: 'ita', label: 'Italiano (Italian)' },
  { value: 'ces', label: 'Čeština (Czech)' },
  { value: 'yue', label: '粵語 (Yue Chinese)' },
  { value: 'kor', label: '한국어 (Korean)' },
  { value: 'fra', label: 'Français (French)' },
  { value: 'deu', label: 'Deutsch (German)' },
  { value: 'spa', label: 'Español (Spanish)' },
  { value: 'rus', label: 'Русский (Russian)' },
];

const BACKOFF_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto');

const MAX_SYNSETS_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
];

export default function OmwConfigView() {
  const { t } = useTranslation();
  const [config, handleChange] = useConfigState(omwConfigStorage, defaultOmwConfig);

  return (
    <ConfigContainer>
      <ConfigField
        label={t('omwConfig.lang')}
        description={t('omwConfig.langDesc')}
      >
        <ConfigSelect
          value={config.lang}
          onValueChange={(value) => handleChange({ lang: value })}
          options={LANGUAGE_OPTIONS}
        />
      </ConfigField>

      <ConfigField
        label={t('omwConfig.lang2')}
        description={t('omwConfig.lang2Desc')}
      >
        <ConfigSelect
          value={config.lang2}
          onValueChange={(value) => handleChange({ lang2: value })}
          options={BACKOFF_LANGUAGE_OPTIONS}
        />
      </ConfigField>

      <ConfigField
        label={t('omwConfig.maxSynsets')}
        description={t('omwConfig.maxSynsetsDesc')}
      >
        <ConfigSelect
          value={String(config.maxSynsets)}
          onValueChange={(value) => handleChange({ maxSynsets: Number(value) })}
          options={MAX_SYNSETS_OPTIONS}
        />
      </ConfigField>
    </ConfigContainer>
  );
}
