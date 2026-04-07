import { caiyunConfigDefault } from './types';
import { caiyunConfigStorage } from '@/utils/storage';
import { useTranslation, Trans } from 'react-i18next';
import {
  useConfigState,
  ConfigContainer,
  ConfigField,
  ConfigInput,
  ConfigCheckbox,
  ConfigLink,
} from '../shared/configCommon';

export default function CaiyunConfigView() {
  const { t } = useTranslation();
  const [config, handleChange] = useConfigState(caiyunConfigStorage, caiyunConfigDefault);

  return (
    <ConfigContainer>
      <ConfigCheckbox
        checked={config.useCustomToken}
        onChange={(checked) => handleChange({ useCustomToken: checked })}
        label={t('caiyunConfig.useCustomToken')}
      />

      {config.useCustomToken && (
        <ConfigField
          label={t('caiyunConfig.apiToken')}
          description={
            <Trans i18nKey="caiyunConfig.tokenHelp">
              You can apply at <ConfigLink href="https://dashboard.caiyunai.com/">Caiyun Open Platform</ConfigLink>.
            </Trans>
          }
        >
          <ConfigInput
            value={config.token}
            onChange={(e) => handleChange({ token: e.target.value })}
            placeholder={t('caiyunConfig.tokenPlaceholder')}
          />
        </ConfigField>
      )}
    </ConfigContainer>
  );
}
