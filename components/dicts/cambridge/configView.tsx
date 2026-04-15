import { useTranslation } from 'react-i18next';

import { cambridgeConfigStorage } from '@/utils/storage';

import { useConfigState, ConfigContainer, ConfigField, ConfigSelect } from '../shared/configCommon';
import { defaultCambridgeConfig, CAMBRIDGE_LANG_PAIRS } from './types';

export default function CambridgeConfigView() {
  const { t } = useTranslation();
  const [config, handleChange] = useConfigState(cambridgeConfigStorage, defaultCambridgeConfig);

  return (
    <ConfigContainer>
      <ConfigField
        label={t('cambridgeConfig.langPair')}
        description={t('cambridgeConfig.langPairDesc')}
      >
        <ConfigSelect
          value={config.langPair}
          onValueChange={(value) => handleChange({ langPair: value })}
          options={CAMBRIDGE_LANG_PAIRS}
        />
      </ConfigField>
    </ConfigContainer>
  );
}
