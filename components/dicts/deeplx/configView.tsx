import React from 'react';
import { DeeplxEndpointType, deeplxConfigDefault } from './types';
import { deeplxConfigStorage } from '@/utils/storage';
import { useTranslation } from 'react-i18next';
import {
  useConfigState,
  ConfigContainer,
  ConfigField,
  ConfigInput,
  ConfigSelect,
} from '../shared/configCommon';

export default function DeeplxConfigView() {
  const { t } = useTranslation();
  const [config, handleChange] = useConfigState(deeplxConfigStorage, deeplxConfigDefault);
  const endpointOptions = [
    { value: DeeplxEndpointType.Free, label: 'Free (/translate)' },
    { value: DeeplxEndpointType.Pro, label: 'Pro (/v1/translate)' },
    { value: DeeplxEndpointType.Official, label: 'Official (/v2/translate)' },
  ];

  return (
    <ConfigContainer>
      <ConfigField
        label={t('deeplxConfig.endpointType')}
      >
        <ConfigSelect
          value={config.endPointType}
          onValueChange={(value) =>
            handleChange({ endPointType: value as DeeplxEndpointType })
          }
          options={endpointOptions}
        />
      </ConfigField>

      <ConfigField
        label={t('deeplxConfig.apiEndpoint')}
        description={
          config.endPointType === DeeplxEndpointType.Official
            ? t('deeplxConfig.officialEndpointDesc')
            : t('deeplxConfig.defaultEndpointDesc')
        }
      >
        <ConfigInput
          value={config.apiEndpoint}
          onChange={(e) => handleChange({ apiEndpoint: e.target.value })}
          placeholder="https://api.deeplx.org"
        />
      </ConfigField>

      <ConfigField
        label={t('deeplxConfig.apiKey')}
        description={t('deeplxConfig.accessTokenDesc')}
      >
        <ConfigInput
          type="password"
          value={config.apiKey}
          onChange={(e) => handleChange({ apiKey: e.target.value })}
          placeholder={t('deeplxConfig.accessTokenPlaceholder')}
        />
      </ConfigField>
    </ConfigContainer>
  );
}
